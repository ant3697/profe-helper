import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { ConfigPanel } from "./components/ConfigPanel";
import { ExamHeader } from "./components/ExamHeader";
import { FormatTabs } from "./components/FormatTabs";
import { InteractiveToolbar } from "./components/InteractiveToolbar";
import { QuestionCard } from "./components/QuestionCard";
import { CotAuditCard } from "./components/CotAuditCard";
import { CodeViewPanel } from "./components/CodeViewPanel";
import { EmptyState } from "./components/EmptyState";
import { ExamFooterBar } from "./components/ExamFooterBar";
import { ThematicBuilderModal } from "./components/ThematicBuilderModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { ResultsModal } from "./components/ResultsModal";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { NotificationToast } from "./components/NotificationToast";
import { AIProviderModal } from "./components/AIProviderModal";
import { DocumentViewerPanel } from "./components/DocumentViewerPanel";
import { OmrSheetModal } from "./components/OmrSheetModal";
import { ZipgradeSuiteModal } from "./components/zipgrade/ZipgradeSuiteModal";
import { TopicGeneratorView } from "./components/topicGenerator/TopicGeneratorView";
import { SigreCurricularView } from "./components/sigre/SigreCurricularView";

import {
  DifficultyLevel,
  EvaluationMode,
  FormatTab,
  ExamData,
  UploadedDocument,
  ThematicGroup,
  ExamSessionScore,
  GenerationTokenUsage,
  CreativityStyle,
  QuestionFilter,
} from "./types/exam";
import {
  AIProviderId,
  AIProviderConfig,
  AISettingsState,
  DEFAULT_AI_PROVIDERS,
} from "./types/aiProviders";
import { extractTextFromFile, extractTextFromPDF } from "./utils/pdfExtractor";
import {
  parseGIFT,
  parseTXTCompleto,
  parseHTMLDoc,
  parseJSONExam,
} from "./utils/examParsers";
import {
  jsonToGIFT,
  jsonToTxtCompleto,
  jsonToTxtCorrectas,
  jsonToJSONString,
  exportStandaloneHTML,
} from "./utils/examExporters";
import { copyTextToClipboard, downloadBlob, DEFAULT_THEMATICS } from "./utils/fileHelpers";
import { TopicUploadedFile } from "./types/thematicDoc";

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("docuexam_theme") as "dark" | "light") || "dark";
  });

  // Fullscreen & Focus Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isExtendedMode, setIsExtendedMode] = useState(() => {
    return localStorage.getItem("docuexam_extended") === "true";
  });

  // AI Settings State (Multi-Provider: Gemini, DeepSeek, OpenAI, Groq, OpenRouter, Ollama)
  const [aiSettings, setAISettings] = useState<AISettingsState>(() => {
    try {
      const saved = localStorage.getItem("docuexam_ai_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedProviders = {
          ...DEFAULT_AI_PROVIDERS,
          ...(parsed.providers || {}),
        };

        // Ensure availableModels and obsolete selectedModel are sanitized for Gemini
        if (mergedProviders.gemini) {
          mergedProviders.gemini.availableModels = DEFAULT_AI_PROVIDERS.gemini.availableModels;
          const validIds = DEFAULT_AI_PROVIDERS.gemini.availableModels.map((m) => m.id);
          if (
            !validIds.includes(mergedProviders.gemini.selectedModel) ||
            mergedProviders.gemini.selectedModel.includes("2.5") ||
            mergedProviders.gemini.selectedModel.includes("2.0") ||
            mergedProviders.gemini.selectedModel.includes("1.5")
          ) {
            mergedProviders.gemini.selectedModel = "gemini-3.6-flash";
          }
        }
        if (mergedProviders.temp_demo) {
          mergedProviders.temp_demo.availableModels = DEFAULT_AI_PROVIDERS.temp_demo.availableModels;
          const validIds = DEFAULT_AI_PROVIDERS.temp_demo.availableModels.map((m) => m.id);
          if (
            !validIds.includes(mergedProviders.temp_demo.selectedModel) ||
            mergedProviders.temp_demo.selectedModel.includes("2.5") ||
            mergedProviders.temp_demo.selectedModel.includes("2.0")
          ) {
            mergedProviders.temp_demo.selectedModel = "gemini-3.6-flash";
          }
        }

        return {
          activeProviderId: parsed.activeProviderId || "gemini",
          providers: mergedProviders,
        };
      }
    } catch {}
    return {
      activeProviderId: "gemini",
      providers: DEFAULT_AI_PROVIDERS,
    };
  });
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Config State
  const [accumulatedTokens, setAccumulatedTokens] = useState<number>(() => {
    return parseInt(localStorage.getItem("docuexam_tokens") || "0", 10);
  });
  const [baseMode, setBaseMode] = useState<"files" | "text">("files");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("standard");
  const [creativityStyle, setCreativityStyle] = useState<CreativityStyle>("literal");
  const [numQuestions, setNumQuestions] = useState(12);
  const [batchCount, setBatchCount] = useState(1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [thematics, setThematics] = useState<ThematicGroup[]>(() => {
    try {
      const saved = localStorage.getItem("docuexam_thematics");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_THEMATICS;
  });

  const handleUpdateThematics = (groups: ThematicGroup[]) => {
    setThematics(groups);
    try {
      localStorage.setItem("docuexam_thematics", JSON.stringify(groups));
    } catch (e) {
      console.warn("Error persisting thematics:", e);
    }
  };

  // Active Exam / Document State
  const [currentExamData, setCurrentExamData] = useState<ExamData | null>(null);
  const [selectedBaseDoc, setSelectedBaseDoc] = useState<UploadedDocument | null>(null);
  const [docViewerPreferredMode, setDocViewerPreferredMode] = useState<"html" | "markdown" | "plain" | undefined>(undefined);
  const [loadedFileName, setLoadedFileName] = useState("Examen Generado");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<FormatTab>("interactive");
  const [evalMode, setEvalMode] = useState<EvaluationMode>("instant");
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);

  // View Modifiers & Filters
  const [hideDistractors, setHideDistractors] = useState(false);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [isCotVisible, setIsCotVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>("all");

  // Stats & Usage
  const [generationModel, setGenerationModel] = useState<string | undefined>(undefined);
  const [lastUsage, setLastUsage] = useState<GenerationTokenUsage | null>(null);

  // Modals & UI Controls
  const [appMode, setAppMode] = useState<"exams" | "topic_builder" | "sigre_curricular">("exams");
  const [isThematicModalOpen, setIsThematicModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
  const [isOmrScannerOpen, setIsOmrScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const renderedContentRef = useRef<HTMLDivElement>(null);

  const handleReceiveExamFromTopic = (
    examData: ExamData | null,
    baseDocuments?: UploadedDocument[]
  ) => {
    if (baseDocuments && baseDocuments.length > 0) {
      setUploadedFiles((prev) => {
        const existingNames = new Set(prev.map((d) => d.name));
        const newDocs = baseDocuments.filter((d) => !existingNames.has(d.name));
        const updatedExisting = prev.map((d) => {
          const matchingNew = baseDocuments.find((nb) => nb.name === d.name);
          return matchingNew ? { ...d, text: matchingNew.text, active: true } : d;
        });
        return [...updatedExisting, ...newDocs];
      });

      const primaryDoc =
        baseDocuments.find((d) => d.name.startsWith("Tema -")) ||
        baseDocuments.find((d) => d.name.startsWith("Autoevaluación")) ||
        baseDocuments[0];

      if (primaryDoc) {
        setSelectedDocumentId(primaryDoc.id);
        setSelectedBaseDoc(primaryDoc);
      }
    }

    if (examData && examData.bloques && examData.bloques.length > 0 && examData.bloques[0].preguntas?.length > 0) {
      setCurrentExamData(examData);
      setLoadedFileName(examData.bloques[0]?.titulo || "Simulacro Active Recall");
      setIsExamSubmitted(false);
      setCurrentTab("interactive");
    }

    setAppMode("exams");
    const count = baseDocuments ? baseDocuments.length : 0;
    showToast(
      `🎯 ¡${count} documentos listos en el Módulo de Exámenes (bases activas, tema generado y autoevaluación con solucionario)!`
    );
  };

  // Sync Theme to HTML root
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("docuexam_theme", theme);
  }, [theme]);

  // Save & persist AI Settings
  const handleSaveAISettings = (newSettings: AISettingsState) => {
    setAISettings(newSettings);
    localStorage.setItem("docuexam_ai_settings", JSON.stringify(newSettings));
  };

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  // Process Files Upload (PDF, TXT, HTML, JSON, GIFT)
  const processUploadedFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let newDocs: UploadedDocument[] = [];
    let lastExamFile: UploadedDocument | null = null;

    setIsProcessingFiles(true);
    setProcessingStatusText(`Iniciando lectura de ${fileArray.length} archivo(s)...`);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (uploadedFiles.some((f) => f.name === file.name)) {
        showToast(`El archivo ${file.name} ya está en la lista`, false);
        continue;
      }

      let extractedText = "";
      const lowerName = file.name.toLowerCase();
      setProcessingStatusText(`Cargando ${file.name} (${i + 1}/${fileArray.length})...`);

      try {
        const customApiKey =
          aiSettings.providers[aiSettings.activeProviderId]?.apiKey ||
          aiSettings.providers.gemini?.apiKey ||
          "";

        extractedText = await extractTextFromFile(
          file,
          (status) => {
            setProcessingStatusText(status);
            showToast(status, false);
          },
          customApiKey
        );

        if (!extractedText.trim()) {
          showToast(`El archivo ${file.name} no contiene texto extraíble`, true);
          continue;
        }

        // Determine role (base study material by default, exam only if explicitly structured GIFT or JSON)
        let role: "base" | "exam" = "base";
        if (lowerName.endsWith(".gift") || (lowerName.endsWith(".json") && extractedText.includes('"bloques"'))) {
          role = "exam";
        }

        const doc: UploadedDocument = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          text: extractedText,
          role,
          size: file.size,
          active: true,
          timestamp: Date.now(),
        };

        newDocs.push(doc);
        if (role === "exam") lastExamFile = doc;
      } catch (err: any) {
        console.error("Error processing file:", err);
        showToast(`Error al leer ${file.name}: ${err.message}`, true);
      }
    }

    setIsProcessingFiles(false);
    setProcessingStatusText("");

    if (newDocs.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newDocs]);
      showToast(`${newDocs.length} archivo(s) procesado(s) correctamente`);

      // If an explicit structured exam was uploaded, automatically view it
      if (lastExamFile) {
        handleSelectDocument(lastExamFile);
      }
    }
  };

  // Load an existing exam from an uploaded document
  const loadExamFromFile = (file: UploadedDocument) => {
    try {
      let parsed: ExamData;
      const lower = file.name.toLowerCase();

      if (lower.endsWith(".json")) {
        parsed = parseJSONExam(file.text);
      } else if (lower.endsWith(".gift")) {
        parsed = parseGIFT(file.text);
      } else if (lower.endsWith(".html") || lower.endsWith(".htm")) {
        parsed = parseHTMLDoc(file.text);
      } else {
        if (file.text.includes("::") && file.text.includes("{") && file.text.includes("}")) {
          parsed = parseGIFT(file.text);
        } else {
          parsed = parseTXTCompleto(file.text);
        }
      }

      setCurrentExamData(parsed);
      setSelectedBaseDoc(null);
      setLoadedFileName(file.name);
      setSelectedDocumentId(file.id);
      setIsExamSubmitted(false);
      setCurrentTab("interactive");
      setActiveFilter("all");
      showToast(`Examen cargado: ${file.name}`);
    } catch (err: any) {
      console.error("Error loading exam:", err);
      showToast(`Error al interpretar examen: ${err.message}`, true);
    }
  };

  // Unified document selection handler (Exams and Base Documents) with toggle deselection
  const handleSelectDocument = (
    file: UploadedDocument,
    preferredMode?: "html" | "markdown" | "plain"
  ) => {
    if (preferredMode) {
      setDocViewerPreferredMode(preferredMode);
    }
    if (selectedDocumentId === file.id && !preferredMode) {
      // Toggle off / Deselect document
      setSelectedDocumentId(null);
      setSelectedBaseDoc(null);
      setCurrentExamData(null);
      setLoadedFileName("");
      setIsExamSubmitted(false);
      showToast(`Deseleccionado: ${file.name}`);
      return;
    }

    setSelectedDocumentId(file.id);
    if (file.role === "exam") {
      loadExamFromFile(file);
    } else {
      setCurrentExamData(null);
      setSelectedBaseDoc(file);
      setLoadedFileName(file.name);
      showToast(`Visualizando documento base: ${file.name}`);
    }
  };

  // Update document text if edited in viewer
  const handleUpdateDocumentText = (id: string, newText: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, text: newText } : f))
    );
    if (selectedBaseDoc && selectedBaseDoc.id === id) {
      setSelectedBaseDoc({ ...selectedBaseDoc, text: newText });
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedDocumentId === id) {
      setSelectedDocumentId(null);
      setSelectedBaseDoc(null);
      setCurrentExamData(null);
    }
  };

  const handleToggleFileActive = (id: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, active: f.active === false ? true : false } : f))
    );
  };

  // Transfer document from Exams module to Topics module
  const handleTransferDocumentToTopic = (file: UploadedDocument) => {
    try {
      const saved = localStorage.getItem("docuexam_topic_rag_files");
      let currentTopicFiles: TopicUploadedFile[] = [];
      if (saved) {
        currentTopicFiles = JSON.parse(saved);
      }
      if (currentTopicFiles.some((f) => f.name === file.name)) {
        showToast(`El documento "${file.name}" ya existe en el Creador de Temas`, false);
        return;
      }
      const newTopicFile: TopicUploadedFile = {
        id: `topic-transfer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        text: file.text,
        size: file.size,
        active: file.active !== false,
      };
      const updatedTopicFiles = [...currentTopicFiles, newTopicFile];
      localStorage.setItem("docuexam_topic_rag_files", JSON.stringify(updatedTopicFiles));
      window.dispatchEvent(new Event("storage"));
      showToast(`🔄 Documento "${file.name}" transferido al Creador de Temas`);
    } catch (e) {
      console.error("Error transferring doc to topic:", e);
      showToast("Error al transferir documento", true);
    }
  };

  // Transfer document from Topics module to Exams module
  const handleTransferDocumentToExams = (file: TopicUploadedFile) => {
    const existing = uploadedFiles.find((f) => f.name === file.name);
    if (existing) {
      setSelectedDocumentId(existing.id);
      setSelectedBaseDoc(existing);
      setAppMode("exams");
      showToast(`El documento "${file.name}" ya existía y ha sido activado en Exámenes`);
      return;
    }
    const newExamFile: UploadedDocument = {
      id: `exam-transfer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      text: file.text,
      size: file.size,
      role: "base",
      timestamp: Date.now(),
      active: file.active !== false,
    };
    setUploadedFiles((prev) => [...prev, newExamFile]);
    setSelectedDocumentId(newExamFile.id);
    setSelectedBaseDoc(newExamFile);
    setAppMode("exams");
    showToast(`🔄 Documento "${file.name}" transferido y abierto en Exámenes`);
  };

  const handleClearFiles = () => {
    setUploadedFiles([]);
    setSelectedDocumentId(null);
    setSelectedBaseDoc(null);
    setCurrentExamData(null);
    showToast("Archivos eliminados");
  };

  // Close Active Exam or Base Document View
  const handleCloseViewer = () => {
    setCurrentExamData(null);
    setSelectedBaseDoc(null);
    setSelectedDocumentId(null);
    setLoadedFileName("");
    setIsExamSubmitted(false);
    showToast("Vista cerrada");
  };

  // Toggle Flag on Question
  const handleToggleFlag = (globalIdx: number) => {
    if (!currentExamData) return;
    const updated = { ...currentExamData };
    let currentCount = 0;

    for (const b of updated.bloques) {
      for (const q of b.preguntas) {
        if (currentCount === globalIdx) {
          q.flagged = !q.flagged;
          setCurrentExamData(updated);
          showToast(
            q.flagged
              ? `Pregunta #${globalIdx + 1} marcada con duda 🚩`
              : `Marca de duda retirada de pregunta #${globalIdx + 1}`
          );
          return;
        }
        currentCount++;
      }
    }
  };

  // Aggregate content for Gemini RAG context (respecting active flag)
  const getAggregatedContent = (overrideBaseText?: string) => {
    let baseText = overrideBaseText || "";
    let examText = "";

    if (!overrideBaseText) {
      uploadedFiles.forEach((f) => {
        // Only include active documents in the generation context (default active is true)
        if (f.active === false) return;

        if (f.role === "exam") {
          examText += f.text + "\n\n---\n\n";
        } else {
          baseText += f.text + "\n\n---\n\n";
        }
      });

      if (pastedText.trim()) {
        baseText += pastedText + "\n\n---\n\n";
      }
    }

    let aggregated = "";
    if (baseText.trim()) {
      aggregated += "### MATERIAL DE ESTUDIO BASE ###\n" + baseText + "\n";
    }
    if (examText.trim()) {
      aggregated +=
        "### HISTÓRICO DE EXÁMENES PREVIOS (PROHIBIDO REPETIR ESTAS PREGUNTAS) ###\n" +
        examText +
        "\n";
    }
    return aggregated;
  };

  // Generate Exam with AI Provider
  const handleGenerateExam = async (paramsOverride?: {
    customFragment?: string;
    overrideNumQuestions?: number;
  }) => {
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    const activeConfig =
      aiSettings.providers[aiSettings.activeProviderId] ||
      DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId];

    const targetQuestions = paramsOverride?.overrideNumQuestions || numQuestions;
    const targetCustomPrompt = paramsOverride?.customFragment
      ? `Genera preguntas enfocadas exclusivamente en este artículo o fragmento normativo:\n"""\n${paramsOverride.customFragment}\n"""`
      : customPrompt;

    try {
      const aggregatedContent = getAggregatedContent(paramsOverride?.customFragment);

      const res = await fetch("/api/generate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          creativityStyle,
          numQuestions: targetQuestions,
          batchCount,
          customPrompt: targetCustomPrompt,
          aggregatedContent,
          providerId: aiSettings.activeProviderId,
          apiKey: activeConfig.apiKey || undefined,
          endpoint: activeConfig.endpoint,
          model: activeConfig.selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${res.status}`);
      }

      const { data, batteries, model, usage } = await res.json();

      const rawBatteries: Array<{ data: any; title?: string }> =
        Array.isArray(batteries) && batteries.length > 0
          ? batteries
          : [{ data, title: "Examen Principal" }];

      if (!rawBatteries[0]?.data?.bloques || !Array.isArray(rawBatteries[0].data.bloques)) {
        throw new Error("Respuesta de IA sin estructura de bloques válida.");
      }

      // Initialize question objects & randomly shuffle options
      rawBatteries.forEach((bat) => {
        const bData = bat.data;
        if (bData && Array.isArray(bData.bloques)) {
          bData.bloques.forEach((b: any) => {
            b.preguntas?.forEach((q: any, qIdx: number) => {
              q.origQId = qIdx;
              const optObjs = q.opciones.map((txt: string, oIdx: number) => ({
                text: txt,
                isCorrect: oIdx === q.indiceCorrecta,
                origOId: oIdx,
              }));

              // Shuffle options
              for (let i = optObjs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [optObjs[i], optObjs[j]] = [optObjs[j], optObjs[i]];
              }

              q.opciones = optObjs.map((o: any) => o.text);
              q.indiceCorrecta = optObjs.findIndex((o: any) => o.isCorrect);
              q.opcionesObjs = optObjs;
              q.isAnswered = false;
              q.userSelectedIndex = null;
              q.flagged = false;
            });
          });
        }
      });

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const timeClean = timeStr.replace(/:/g, "-");

      const createdDocs: UploadedDocument[] = [];
      const isMultiBatch = rawBatteries.length > 1;

      rawBatteries.forEach((bat, idx) => {
        const bData = bat.data;
        if (!bData || !Array.isArray(bData.bloques) || bData.bloques.length === 0) return;

        const batQuestions = bData.bloques.reduce(
          (acc: number, b: any) => acc + (b.preguntas?.length || 0),
          0
        );

        const examFileName = paramsOverride?.customFragment
          ? `Fragmento_Test_${timeClean}_(${batQuestions}preg).gift`
          : isMultiBatch
          ? `Bateria_${idx + 1}_IA_${timeClean}_(${batQuestions}preg).gift`
          : `Examen_IA_${timeClean}_(${batQuestions}preg).gift`;

        const examGIFTContent = jsonToGIFT(bData);

        const newDoc: UploadedDocument = {
          id: `exam-gen-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name: examFileName,
          text: examGIFTContent,
          role: "exam",
          timestamp: Date.now() + idx,
        };

        createdDocs.push(newDoc);
      });

      if (createdDocs.length > 0) {
        setUploadedFiles((prev) => [...createdDocs, ...prev]);

        const firstDoc = createdDocs[0];
        const firstBatData = rawBatteries[0].data;

        setCurrentExamData(firstBatData);
        setSelectedBaseDoc(null);
        setLoadedFileName(firstDoc.name);
        setSelectedDocumentId(firstDoc.id);
        setGenerationModel(model);
        setLastUsage(usage);
        setIsExamSubmitted(false);
        setCurrentTab("interactive");
        setActiveFilter("all");

        if (usage?.totalTokens) {
          const newTotal = accumulatedTokens + usage.totalTokens;
          setAccumulatedTokens(newTotal);
          localStorage.setItem("docuexam_tokens", newTotal.toString());
        }

        showToast(
          paramsOverride?.customFragment
            ? `¡Generadas ${targetQuestions} preguntas del fragmento seleccionado!`
            : isMultiBatch
            ? `¡Generadas ${createdDocs.length} baterías independientes (${numQuestions} preg. cada una)!`
            : `¡Examen (${numQuestions} preg.) generado exitosamente!`
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        showToast("Generación cancelada por el usuario.");
      } else {
        console.error("Exam generation error:", err);
        showToast(`Error al generar examen: ${err.message}`, true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Selective Generation from Selected Document Fragment
  const handleGenerateFromFragment = (fragmentText: string, fragmentQuestions: number) => {
    handleGenerateExam({
      customFragment: fragmentText,
      overrideNumQuestions: fragmentQuestions,
    });
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  // Option selection handler
  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (!currentExamData) return;
    if (isExamSubmitted && evalMode === "deferred") return;

    const updated = { ...currentExamData };
    let totalQCount = 0;

    for (const b of updated.bloques) {
      for (let i = 0; i < b.preguntas.length; i++) {
        if (totalQCount === qIndex) {
          const q = b.preguntas[i];
          if (evalMode === "instant" && q.isAnswered) return;

          q.userSelectedIndex = optIndex;
          if (evalMode === "instant") {
            q.isAnswered = true;
          }
          break;
        }
        totalQCount++;
      }
    }

    setCurrentExamData(updated);
  };

  // Calculate Exam Score
  const calculateScore = (): ExamSessionScore => {
    if (!currentExamData) {
      return {
        total: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        grade10: "0.00",
        percentage: 0,
      };
    }

    let total = 0;
    let answered = 0;
    let correct = 0;
    let incorrect = 0;

    currentExamData.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        total++;
        if (q.userSelectedIndex !== null && q.userSelectedIndex !== undefined) {
          answered++;
          if (q.userSelectedIndex === q.indiceCorrecta) {
            correct++;
          } else {
            incorrect++;
          }
        }
      });
    });

    const unanswered = total - answered;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const grade10 = total > 0 ? ((correct / total) * 10).toFixed(2) : "0.00";

    return {
      total,
      answered,
      correct,
      incorrect,
      unanswered,
      grade10,
      percentage,
    };
  };

  // Mode: Repaso de Falladas
  const handleReviewMistakes = () => {
    if (!currentExamData) return;

    const failedOrUnansweredQuestions: any[] = [];
    currentExamData.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        const isWrong =
          q.userSelectedIndex !== null &&
          q.userSelectedIndex !== undefined &&
          q.userSelectedIndex !== q.indiceCorrecta;
        const isBlank =
          q.userSelectedIndex === null || q.userSelectedIndex === undefined;
        if (isWrong || isBlank) {
          // Reset answers for the review session
          failedOrUnansweredQuestions.push({
            ...q,
            userSelectedIndex: null,
            isAnswered: false,
          });
        }
      });
    });

    if (failedOrUnansweredQuestions.length === 0) {
      showToast("¡Enhorabuena! No tienes ninguna pregunta fallada o en blanco.");
      setIsResultsModalOpen(false);
      return;
    }

    const reviewExam: ExamData = {
      bloques: [
        {
          titulo: `🔁 Repaso de Falladas y Dudas (${failedOrUnansweredQuestions.length} preguntas)`,
          preguntas: failedOrUnansweredQuestions,
        },
      ],
    };

    setCurrentExamData(reviewExam);
    setIsExamSubmitted(false);
    setIsResultsModalOpen(false);
    setActiveFilter("all");
    setLoadedFileName(`Repaso_Falladas_(${failedOrUnansweredQuestions.length}preg)`);
    showToast(
      `Iniciando test de repaso con las ${failedOrUnansweredQuestions.length} preguntas falladas o pendientes.`
    );
  };

  const handleGlobalSubmitExam = () => {
    if (!currentExamData) return;

    if (evalMode === "deferred") {
      setIsExamSubmitted(true);
      setIsResultsModalOpen(true);
    } else {
      const score = calculateScore();
      if (score.answered < score.total) {
        if (
          !confirm(
            `Has respondido ${score.answered} de ${score.total} preguntas. ¿Deseas ver la puntuación final?`
          )
        ) {
          return;
        }
      }
      setIsResultsModalOpen(true);
    }
  };

  // Reordering Tools
  const handleShuffleQuestions = () => {
    if (!currentExamData) return;
    const updated = { ...currentExamData };
    updated.bloques.forEach((b) => {
      for (let i = b.preguntas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b.preguntas[i], b.preguntas[j]] = [b.preguntas[j], b.preguntas[i]];
      }
    });
    setCurrentExamData(updated);
    showToast("Preguntas barajadas");
  };

  const handleSortQuestions = () => {
    if (!currentExamData) return;
    const updated = { ...currentExamData };
    updated.bloques.forEach((b) => {
      b.preguntas.sort((a, b) => (a.origQId || 0) - (b.origQId || 0));
    });
    setCurrentExamData(updated);
    showToast("Preguntas ordenadas al estado original");
  };

  const handleShuffleOptions = () => {
    if (!currentExamData) return;
    const updated = { ...currentExamData };
    updated.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        if (q.opcionesObjs) {
          const opts = [...q.opcionesObjs];
          for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]];
          }
          q.opciones = opts.map((o) => o.text);
          q.indiceCorrecta = opts.findIndex((o) => o.isCorrect);
          q.opcionesObjs = opts;
        }
      });
    });
    setCurrentExamData(updated);
    showToast("Opciones barajadas aleatoriamente");
  };

  const handleSortOptions = () => {
    if (!currentExamData) return;
    const updated = { ...currentExamData };
    updated.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        if (q.opcionesObjs && q.opcionesObjs.length > 0) {
          const correctOpt = q.opcionesObjs.find((o) => o.isCorrect);
          const distractors = q.opcionesObjs.filter((o) => !o.isCorrect);
          const sortedOpts = correctOpt ? [correctOpt, ...distractors] : [...q.opcionesObjs];

          q.opciones = sortedOpts.map((o) => o.text);
          q.indiceCorrecta = 0;
          q.opcionesObjs = sortedOpts;
        } else if (q.opciones && q.opciones.length > 0) {
          const currentCorrectIdx = q.indiceCorrecta ?? 0;
          const correctText = q.opciones[currentCorrectIdx] || q.opciones[0];
          const distractorTexts = q.opciones.filter((_, idx) => idx !== currentCorrectIdx);
          const sortedTexts = [correctText, ...distractorTexts];
          q.opciones = sortedTexts;
          q.indiceCorrecta = 0;
          q.opcionesObjs = sortedTexts.map((txt, idx) => ({
            text: txt,
            isCorrect: idx === 0,
            origOId: idx,
          }));
        }
      });
    });
    setCurrentExamData(updated);
    showToast("Opciones ordenadas: respuesta correcta en opción a)");
  };

  // Export actions
  const handleCopyToWord = async () => {
    if (!currentExamData) return;
    const txt = jsonToTxtCompleto(currentExamData);
    await copyTextToClipboard(txt);
    showToast("Examen copiado con formato de texto estructurado para Word");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportHTML = () => {
    if (!currentExamData) return;
    const html = exportStandaloneHTML(currentExamData, loadedFileName);
    downloadBlob(html, `${loadedFileName}.html`, "text/html;charset=utf-8");
    showToast("Examen exportado como visor interactivo HTML autónomo");
  };

  const handleExportJSON = () => {
    if (!currentExamData) return;
    const jsonStr = jsonToJSONString(currentExamData);
    downloadBlob(jsonStr, `${loadedFileName}.json`, "application/json;charset=utf-8");
    showToast("Copia de seguridad en formato JSON descargada");
  };

  // Thematic selection apply
  const handleApplyThematics = (selectedGroups: ThematicGroup[]) => {
    const allSelectedItems: string[] = [];
    selectedGroups.forEach((g) => {
      if (g.temas && g.temas.length > 0) {
        g.temas.forEach((tema) => {
          allSelectedItems.push(`${g.grupo} -> ${tema}`);
        });
      } else {
        allSelectedItems.push(g.grupo);
      }
    });

    if (allSelectedItems.length === 0) {
      showToast("No seleccionaste ningún bloque", true);
      return;
    }

    const generatedPrompt =
      `PRIORIDAD TEMÁTICA OBLIGATORIA: Genera preguntas extraídas específicamente de estos bloques temáticos:\n- ` +
      allSelectedItems.join("\n- ") +
      `\n\nVARIABILIDAD OBLIGATORIA: Cada distractor debe ser técnicamente verosímil pero erróneo en el contexto específico.`;

    setCustomPrompt(generatedPrompt);
    setNumQuestions(12);
    showToast("Instrucciones configuradas con los bloques seleccionados");
  };

  const toggleExtendedMode = () => {
    const next = !isExtendedMode;
    setIsExtendedMode(next);
    localStorage.setItem("docuexam_extended", String(next));
  };

  const score = calculateScore();

  // Compute question filter counts
  const allQuestionsFlat = currentExamData
    ? currentExamData.bloques.flatMap((b) => b.preguntas)
    : [];

  const filterCounts = {
    all: allQuestionsFlat.length,
    unanswered: allQuestionsFlat.filter(
      (q) => q.userSelectedIndex === null || q.userSelectedIndex === undefined
    ).length,
    flagged: allQuestionsFlat.filter((q) => !!q.flagged).length,
    incorrect: allQuestionsFlat.filter(
      (q) =>
        q.userSelectedIndex !== null &&
        q.userSelectedIndex !== undefined &&
        q.userSelectedIndex !== q.indiceCorrecta
    ).length,
    correct: allQuestionsFlat.filter(
      (q) =>
        q.userSelectedIndex !== null &&
        q.userSelectedIndex !== undefined &&
        q.userSelectedIndex === q.indiceCorrecta
    ).length,
  };

  return (
    <div className="min-h-screen bg-app text-text-primary transition-colors duration-200 p-3 sm:p-5 lg:p-6">
      <div
        id="mainWrapper"
        className={`${
          isExtendedMode ? "w-full max-w-[1700px]" : "max-w-7xl"
        } mx-auto space-y-5 transition-all duration-300`}
      >
        {/* Header */}
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isExtendedMode={isExtendedMode}
          onToggleExtendedMode={toggleExtendedMode}
          onImportFile={(e) => e.target.files && processUploadedFiles(e.target.files)}
          activeProviderConfig={
            aiSettings.providers[aiSettings.activeProviderId] ||
            DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId]
          }
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onOpenOmrScanner={() => setIsOmrScannerOpen(true)}
          currentAppMode={appMode}
          onAppModeChange={setAppMode}
        />

        {/* View Mode: High-Density Topic Generator (Experto IA) - Preserved in DOM across mode changes */}
        <div className={appMode === "topic_builder" ? "block" : "hidden"}>
          <TopicGeneratorView
            activeProviderConfig={
              aiSettings.providers[aiSettings.activeProviderId] ||
              DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId]
            }
            onShowToast={showToast}
            onSendExamToApp={handleReceiveExamFromTopic}
            onTransferDocumentToExams={handleTransferDocumentToExams}
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        </div>

        {/* View Mode: SIGRE Curricular (FP & UDs) - Preserved in DOM across mode changes */}
        <div className={appMode === "sigre_curricular" ? "block" : "hidden"}>
          <SigreCurricularView
            theme={theme}
            activeProviderConfig={
              aiSettings.providers[aiSettings.activeProviderId] ||
              DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId]
            }
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        </div>

        {/* Main Grid: Exam Builder & Evaluator - Preserved in DOM across mode changes */}
        <div className={appMode === "exams" ? "block" : "hidden"}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel: Settings & Configuration */}
          {!isFocusMode && (
            <div className="lg:col-span-4 no-print space-y-6">
              <ConfigPanel
                activeProviderConfig={
                  aiSettings.providers[aiSettings.activeProviderId] ||
                  DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId]
                }
                onOpenAIModal={() => setIsAIModalOpen(true)}
                accumulatedTokens={accumulatedTokens}
                uploadedFiles={uploadedFiles}
                onUploadFiles={processUploadedFiles}
                onRemoveFile={handleRemoveFile}
                onToggleFileActive={handleToggleFileActive}
                onTransferDocumentToTopic={handleTransferDocumentToTopic}
                onClearFiles={handleClearFiles}
                onSelectDocument={handleSelectDocument}
                selectedDocumentId={selectedDocumentId}
                pastedText={pastedText}
                onPastedTextChange={setPastedText}
                baseMode={baseMode}
                onBaseModeChange={setBaseMode}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
                creativityStyle={creativityStyle}
                onCreativityStyleChange={setCreativityStyle}
                numQuestions={numQuestions}
                onNumQuestionsChange={setNumQuestions}
                batchCount={batchCount}
                onBatchCountChange={setBatchCount}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                onOpenThematicBuilder={() => setIsThematicModalOpen(true)}
                onRequestGenerate={() => setIsConfirmModalOpen(true)}
                isLoading={isLoading}
                isProcessingFiles={isProcessingFiles}
                processingStatusText={processingStatusText}
              />
            </div>
          )}

          {/* Right Panel: Exam / Base Document Viewer & Formats */}
          <div
            className={`${
              isFocusMode ? "lg:col-span-12" : "lg:col-span-8"
            } flex flex-col min-h-[600px] transition-all duration-300`}
          >
            <div className="bg-surface/90 backdrop-blur-md border border-border-default shadow-xl rounded-2xl flex flex-col flex-1 overflow-hidden">
              {selectedBaseDoc ? (
                <DocumentViewerPanel
                  document={selectedBaseDoc}
                  initialViewMode={docViewerPreferredMode}
                  onClose={handleCloseViewer}
                  onUpdateDocumentText={handleUpdateDocumentText}
                  onRequestGenerateExam={() => setIsConfirmModalOpen(true)}
                  onGenerateFromFragment={handleGenerateFromFragment}
                  onShowToast={showToast}
                />
              ) : currentExamData ? (
                <>
                  {/* Exam Active Header */}
                  <ExamHeader
                    fileName={loadedFileName}
                    modelName={generationModel}
                    usage={lastUsage}
                    hasCotAudit={!!currentExamData.analisis_anticolision}
                    isCotVisible={isCotVisible}
                    onToggleCot={() => setIsCotVisible(!isCotVisible)}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                    onCopyToWord={handleCopyToWord}
                    onPrintPDF={handlePrintPDF}
                    onExportHTML={handleExportHTML}
                    onExportJSON={handleExportJSON}
                    onCloseExam={handleCloseViewer}
                  />

                  {/* Format Tabs & Toolbar */}
                  <div className="p-4 sm:p-5 space-y-4 border-b border-border-default bg-alt/30">
                    <FormatTabs
                      currentTab={currentTab}
                      onTabChange={(t) => setCurrentTab(t)}
                    />

                    <InteractiveToolbar
                      onShuffleQuestions={handleShuffleQuestions}
                      onSortQuestions={handleSortQuestions}
                      onShuffleOptions={handleShuffleOptions}
                      onSortOptions={handleSortOptions}
                      evalMode={evalMode}
                      onEvalModeChange={setEvalMode}
                      hideDistractors={hideDistractors}
                      onToggleHideDistractors={() => setHideDistractors(!hideDistractors)}
                      highlightCorrect={highlightCorrect}
                      onToggleHighlightCorrect={() =>
                        setHighlightCorrect(!highlightCorrect)
                      }
                      showAllFeedback={showAllFeedback}
                      onToggleShowAllFeedback={() =>
                        setShowAllFeedback(!showAllFeedback)
                      }
                      isCodeTab={currentTab !== "interactive"}
                      onOpenOmrSheet={() => setIsOmrModalOpen(true)}
                      onOpenOmrScanner={() => setIsOmrScannerOpen(true)}
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                      filterCounts={filterCounts}
                    />
                  </div>

                  {/* Body Content by Tab */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col overflow-y-auto">
                    {currentTab === "interactive" && (
                      <div className="space-y-6 flex-1" ref={renderedContentRef}>
                        {/* CoT Audit Reasoning */}
                        {isCotVisible && currentExamData.analisis_anticolision && (
                          <CotAuditCard cotText={currentExamData.analisis_anticolision} />
                        )}

                        {/* Exam Blocks */}
                        {currentExamData.bloques.map((bloque, bIdx) => {
                          // Filter questions in this block based on activeFilter
                          const questionsInBlock = bloque.preguntas.map((q, qLocalIdx) => {
                            const globalIdx =
                              currentExamData.bloques
                                .slice(0, bIdx)
                                .reduce((sum, prevB) => sum + prevB.preguntas.length, 0) +
                              qLocalIdx;

                            return { q, globalIdx };
                          });

                          const filteredQuestions = questionsInBlock.filter(({ q }) => {
                            if (activeFilter === "all") return true;
                            if (activeFilter === "flagged") return !!q.flagged;
                            if (activeFilter === "unanswered")
                              return (
                                q.userSelectedIndex === null ||
                                q.userSelectedIndex === undefined
                              );
                            if (activeFilter === "incorrect")
                              return (
                                q.userSelectedIndex !== null &&
                                q.userSelectedIndex !== undefined &&
                                q.userSelectedIndex !== q.indiceCorrecta
                              );
                            if (activeFilter === "correct")
                              return (
                                q.userSelectedIndex !== null &&
                                q.userSelectedIndex !== undefined &&
                                q.userSelectedIndex === q.indiceCorrecta
                              );
                            return true;
                          });

                          if (filteredQuestions.length === 0 && activeFilter !== "all") {
                            return null;
                          }

                          return (
                            <div key={bIdx} className="space-y-4">
                              <h2 className="text-base font-bold text-text-primary font-primary border-b border-border-default pb-2 flex items-center justify-between">
                                <span>{bloque.titulo}</span>
                                {activeFilter !== "all" && (
                                  <span className="text-xs font-normal text-text-muted">
                                    Mostrando {filteredQuestions.length} de {bloque.preguntas.length}
                                  </span>
                                )}
                              </h2>

                              <div className="space-y-4">
                                {filteredQuestions.map(({ q, globalIdx }) => (
                                  <QuestionCard
                                    key={globalIdx}
                                    question={q}
                                    index={globalIdx}
                                    evalMode={evalMode}
                                    isExamSubmitted={isExamSubmitted}
                                    onSelectOption={handleSelectOption}
                                    onToggleFlag={handleToggleFlag}
                                    hideDistractors={hideDistractors}
                                    highlightCorrect={highlightCorrect}
                                    forceShowFeedback={showAllFeedback}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty filtered list notification */}
                        {allQuestionsFlat.length > 0 &&
                          activeFilter !== "all" &&
                          filterCounts[activeFilter] === 0 && (
                            <div className="text-center py-12 space-y-3 bg-surface/50 rounded-2xl border border-border-subtle p-6">
                              <p className="text-sm font-semibold text-text-muted">
                                No hay preguntas que coincidan con el filtro seleccionado:{" "}
                                <b className="text-amber-500 font-bold">{activeFilter}</b>
                              </p>
                              <button
                                type="button"
                                onClick={() => setActiveFilter("all")}
                                className="text-xs bg-amber-500 text-black font-bold px-4 py-2 rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
                              >
                                Ver todas las preguntas
                              </button>
                            </div>
                          )}
                      </div>
                    )}

                    {currentTab === "gift" && (
                      <CodeViewPanel
                        title="Formato GIFT"
                        description="Formato estándar optimizado para importación directa en plataformas Moodle o tarjetas Anki."
                        content={jsonToGIFT(currentExamData)}
                        downloadFilename="Examen_DocuExam.gift"
                        onShowToast={showToast}
                      />
                    )}

                    {currentTab === "txt-full" && (
                      <CodeViewPanel
                        title="Texto Plano Completo"
                        description="Examen estructurado clásico de lectura con preguntas y opciones completas."
                        content={jsonToTxtCompleto(currentExamData)}
                        downloadFilename="Examen_Completo.txt"
                        onShowToast={showToast}
                      />
                    )}

                    {currentTab === "txt-correct" && (
                      <CodeViewPanel
                        title="Plantilla de Soluciones"
                        description="Plantilla de respuestas y correcciones rápidas para el profesor o tribunal."
                        content={jsonToTxtCorrectas(currentExamData)}
                        downloadFilename="Plantilla_Respuestas.txt"
                        onShowToast={showToast}
                      />
                    )}

                    {currentTab === "json" && (
                      <CodeViewPanel
                        title="Estructura de Datos JSON"
                        description="Copia de seguridad en formato estructurado JSON para reimportación íntegra en la aplicación."
                        content={jsonToJSONString(currentExamData)}
                        downloadFilename="Copia_Seguridad_Examen.json"
                        onShowToast={showToast}
                      />
                    )}
                  </div>

                  {/* Sticky Footer Bar for Interactive Mode */}
                  {currentTab === "interactive" && (
                    <ExamFooterBar
                      answeredCount={score.answered}
                      totalQuestions={score.total}
                      onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      onSubmitExam={handleGlobalSubmitExam}
                    />
                  )}
                </>
              ) : (
                <EmptyState
                  onUploadFiles={processUploadedFiles}
                  onOpenThematicBuilder={() => setIsThematicModalOpen(true)}
                  onOpenOmrScanner={() => setIsOmrScannerOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modals & Overlays */}
      <ThematicBuilderModal
        isOpen={isThematicModalOpen}
        onClose={() => setIsThematicModalOpen(false)}
        thematics={thematics}
        onUpdateThematics={handleUpdateThematics}
        onApplySelection={handleApplyThematics}
        onShowToast={showToast}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleGenerateExam}
        numQuestions={numQuestions}
        batchCount={batchCount}
        difficulty={difficulty}
        hasBaseDocs={
          uploadedFiles.some((f) => f.role === "base") || pastedText.trim().length > 0
        }
        baseDocsCount={
          uploadedFiles.filter((f) => f.role === "base").length +
          (pastedText.trim().length > 0 ? 1 : 0)
        }
        antiCollisionCount={uploadedFiles.filter((f) => f.role === "exam").length}
        hasCustomPrompt={customPrompt.trim().length > 0}
        activeProviderName={
          (aiSettings.providers[aiSettings.activeProviderId] || DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId])?.subtitle ||
          aiSettings.activeProviderId
        }
        activeModelName={
          (aiSettings.providers[aiSettings.activeProviderId] || DEFAULT_AI_PROVIDERS[aiSettings.activeProviderId])?.selectedModel ||
          "Predeterminado"
        }
      />

      <ResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        score={score}
        examTitle={loadedFileName}
        onReviewMistakes={handleReviewMistakes}
      />

      <AIProviderModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        settings={aiSettings}
        onSaveSettings={handleSaveAISettings}
        onShowToast={showToast}
      />

      {/* OMR Sheet Modal */}
      <OmrSheetModal
        isOpen={isOmrModalOpen}
        onClose={() => setIsOmrModalOpen(false)}
        examData={currentExamData}
        examTitle={loadedFileName}
        onShowToast={showToast}
        onOpenScanner={() => setIsOmrScannerOpen(true)}
      />

      {/* ZipGrade Full Ecosystem & Mobile Camera Scanner */}
      <ZipgradeSuiteModal
        isOpen={isOmrScannerOpen}
        onClose={() => setIsOmrScannerOpen(false)}
        examData={currentExamData}
        examTitle={loadedFileName}
        onShowToast={showToast}
      />

      <LoadingOverlay
        isLoading={isLoading}
        onCancel={handleCancelGeneration}
      />

      <NotificationToast message={toastMessage} isError={toastIsError} />
    </div>
  );
}
