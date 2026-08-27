import React, { useRef } from "react";
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
  ExamData,
  UploadedDocument,
  ExamSessionScore,
} from "./types/exam";
import { DEFAULT_AI_PROVIDERS } from "./types/aiProviders";
import { extractTextFromFile } from "./utils/pdfExtractor";
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
import { copyTextToClipboard, downloadBlob } from "./utils/fileHelpers";
import { TopicUploadedFile } from "./types/thematicDoc";

// Custom Hooks for Modular Clean Architecture
import { useAISettings } from "./hooks/useAISettings";
import { useExamState } from "./hooks/useExamState";
import { useDocumentManager } from "./hooks/useDocumentManager";
import { useUIControls } from "./hooks/useUIControls";

export default function App() {
  // Custom Modular Hooks
  const {
    aiSettings,
    setAISettings,
    isAIModalOpen,
    setIsAIModalOpen,
    handleSaveAISettings,
  } = useAISettings();

  const {
    currentExamData,
    setCurrentExamData,
    loadedFileName,
    setLoadedFileName,
    currentTab,
    setCurrentTab,
    evalMode,
    setEvalMode,
    isExamSubmitted,
    setIsExamSubmitted,
    difficulty,
    setDifficulty,
    creativityStyle,
    setCreativityStyle,
    numQuestions,
    setNumQuestions,
    batchCount,
    setBatchCount,
    customPrompt,
    setCustomPrompt,
    accumulatedTokens,
    setAccumulatedTokens,
    thematics,
    handleUpdateThematics,
    hideDistractors,
    setHideDistractors,
    highlightCorrect,
    setHighlightCorrect,
    showAllFeedback,
    setShowAllFeedback,
    isCotVisible,
    setIsCotVisible,
    activeFilter,
    setActiveFilter,
    generationModel,
    setGenerationModel,
    lastUsage,
    setLastUsage,
  } = useExamState();

  const {
    baseMode,
    setBaseMode,
    uploadedFiles,
    setUploadedFiles,
    pastedText,
    setPastedText,
    selectedBaseDoc,
    setSelectedBaseDoc,
    selectedDocumentId,
    setSelectedDocumentId,
    docViewerPreferredMode,
    setDocViewerPreferredMode,
    isProcessingFiles,
    setIsProcessingFiles,
    processingStatusText,
    setProcessingStatusText,
  } = useDocumentManager();

  const {
    theme,
    toggleTheme,
    isFullscreen,
    toggleFullscreen,
    isFocusMode,
    setIsFocusMode,
    isExtendedMode,
    toggleExtendedMode,
    appMode,
    setAppMode,
    isThematicModalOpen,
    setIsThematicModalOpen,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isResultsModalOpen,
    setIsResultsModalOpen,
    isOmrModalOpen,
    setIsOmrModalOpen,
    isOmrScannerOpen,
    setIsOmrScannerOpen,
    isLoading,
    setIsLoading,
    toastMessage,
    toastIsError,
    showToast,
  } = useUIControls();

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

  const handleCloseViewer = () => {
    setCurrentExamData(null);
    setSelectedBaseDoc(null);
    setSelectedDocumentId(null);
    setLoadedFileName("");
    setIsExamSubmitted(false);
    showToast("Vista cerrada");
  };

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

  const getAggregatedContent = (overrideBaseText?: string) => {
    let baseText = overrideBaseText || "";
    let examText = "";

    if (!overrideBaseText) {
      uploadedFiles.forEach((f) => {
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

  const handleSelectAnswer = (globalIdx: number, optionIdx: number) => {
    if (!currentExamData || isExamSubmitted) return;
    const updated = { ...currentExamData };
    let currentCount = 0;

    for (const b of updated.bloques) {
      for (const q of b.preguntas) {
        if (currentCount === globalIdx) {
          q.userSelectedIndex = optionIdx;
          q.isAnswered = true;
          setCurrentExamData(updated);
          return;
        }
        currentCount++;
      }
    }
  };

  const calculateScore = (): ExamSessionScore | null => {
    if (!currentExamData) return null;
    let totalQuestions = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    currentExamData.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        totalQuestions++;
        if (q.userSelectedIndex === null || q.userSelectedIndex === undefined) {
          unansweredCount++;
        } else if (q.userSelectedIndex === q.indiceCorrecta) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });
    });

    const netScore = Math.max(0, correctCount - incorrectCount * 0.33);
    const percentage = totalQuestions > 0 ? (netScore / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      netScore,
      percentage,
    };
  };

  const handleSubmitExam = () => {
    setIsExamSubmitted(true);
    setIsResultsModalOpen(true);
  };

  const handleExportText = (type: "gift" | "completo" | "correctas" | "json" | "html" | "docx") => {
    if (!currentExamData) return;
    const baseName = loadedFileName.replace(/\.[^/.]+$/, "");

    if (type === "gift") {
      downloadBlob(jsonToGIFT(currentExamData), `${baseName}.gift`, "text/plain;charset=utf-8");
    } else if (type === "completo") {
      downloadBlob(jsonToTxtCompleto(currentExamData), `${baseName}_completo.txt`, "text/plain;charset=utf-8");
    } else if (type === "correctas") {
      downloadBlob(jsonToTxtCorrectas(currentExamData), `${baseName}_solucionario.txt`, "text/plain;charset=utf-8");
    } else if (type === "json") {
      downloadBlob(jsonToJSONString(currentExamData), `${baseName}.json`, "application/json;charset=utf-8");
    } else if (type === "html") {
      downloadBlob(exportStandaloneHTML(currentExamData, loadedFileName), `${baseName}.html`, "text/html;charset=utf-8");
    }
    showToast(`Examen exportado en formato ${type.toUpperCase()}`);
  };

  const handleCopyText = (type: "gift" | "completo" | "correctas" | "json") => {
    if (!currentExamData) return;
    let text = "";
    if (type === "gift") text = jsonToGIFT(currentExamData);
    else if (type === "completo") text = jsonToTxtCompleto(currentExamData);
    else if (type === "correctas") text = jsonToTxtCorrectas(currentExamData);
    else if (type === "json") text = jsonToJSONString(currentExamData);

    copyTextToClipboard(text).then((ok) => {
      if (ok) showToast(`Copiado al portapapeles (${type.toUpperCase()})`);
      else showToast("Error al copiar al portapapeles", true);
    });
  };

  // Flattened questions for rendering
  const allQuestions = currentExamData
    ? currentExamData.bloques.flatMap((b, bIdx) =>
        b.preguntas.map((q, qIdx) => ({
          ...q,
          blockTitle: b.titulo,
          blockIndex: bIdx,
          questionIndexInBlock: qIdx,
        }))
      )
    : [];

  const filteredQuestions = allQuestions.filter((q) => {
    if (activeFilter === "flagged") return q.flagged;
    if (activeFilter === "answered") return q.isAnswered;
    if (activeFilter === "unanswered") return !q.isAnswered;
    if (activeFilter === "correct") return isExamSubmitted && q.userSelectedIndex === q.indiceCorrecta;
    if (activeFilter === "incorrect") return isExamSubmitted && q.userSelectedIndex !== null && q.userSelectedIndex !== q.indiceCorrecta;
    return true;
  });

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Header Bar */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        appMode={appMode}
        onSelectAppMode={setAppMode}
        onOpenAISettings={() => setIsAIModalOpen(true)}
        activeProviderId={aiSettings.activeProviderId}
        activeModel={aiSettings.providers[aiSettings.activeProviderId]?.selectedModel || "gemini-3.6-flash"}
      />

      {/* Primary Sub-Applications Routing */}
      {appMode === "topic_builder" ? (
        <TopicGeneratorView
          onSendExamToExamsModule={handleReceiveExamFromTopic}
          onTransferDocumentToExams={handleTransferDocumentToExams}
        />
      ) : appMode === "sigre_curricular" ? (
        <SigreCurricularView />
      ) : (
        /* Exams Generator & Active Recall Suite */
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Configuration Panel */}
            {!isFocusMode && (
              <div className="lg:col-span-4 space-y-6">
                <ConfigPanel
                  baseMode={baseMode}
                  setBaseMode={setBaseMode}
                  uploadedFiles={uploadedFiles}
                  onFileUpload={processUploadedFiles}
                  onRemoveFile={handleRemoveFile}
                  onToggleFileActive={handleToggleFileActive}
                  onSelectDocument={handleSelectDocument}
                  selectedDocumentId={selectedDocumentId}
                  pastedText={pastedText}
                  setPastedText={setPastedText}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  creativityStyle={creativityStyle}
                  setCreativityStyle={setCreativityStyle}
                  numQuestions={numQuestions}
                  setNumQuestions={setNumQuestions}
                  batchCount={batchCount}
                  setBatchCount={setBatchCount}
                  customPrompt={customPrompt}
                  setCustomPrompt={setCustomPrompt}
                  onGenerate={handleGenerateExam}
                  isLoading={isLoading}
                  onCancelGeneration={handleCancelGeneration}
                  thematics={thematics}
                  onOpenThematicModal={() => setIsThematicModalOpen(true)}
                  accumulatedTokens={accumulatedTokens}
                  onClearFiles={handleClearFiles}
                  isProcessingFiles={isProcessingFiles}
                  processingStatusText={processingStatusText}
                  onOpenZipgradeModal={() => setIsOmrModalOpen(true)}
                  onTransferDocumentToTopic={handleTransferDocumentToTopic}
                />
              </div>
            )}

            {/* Main Interactive Viewing Area */}
            <div className={`${isFocusMode ? "lg:col-span-12" : "lg:col-span-8"} space-y-6`}>
              {currentExamData || selectedBaseDoc ? (
                <>
                  <ExamHeader
                    title={loadedFileName}
                    totalQuestions={allQuestions.length}
                    answeredQuestions={allQuestions.filter((q) => q.isAnswered).length}
                    flaggedQuestions={allQuestions.filter((q) => q.flagged).length}
                    onClose={handleCloseViewer}
                    model={generationModel}
                    usage={lastUsage}
                  />

                  {currentExamData && (
                    <>
                      <FormatTabs currentTab={currentTab} onSelectTab={setCurrentTab} />

                      {currentTab === "interactive" && (
                        <>
                          <InteractiveToolbar
                            evalMode={evalMode}
                            onSelectEvalMode={setEvalMode}
                            hideDistractors={hideDistractors}
                            onToggleHideDistractors={() => setHideDistractors(!hideDistractors)}
                            highlightCorrect={highlightCorrect}
                            onToggleHighlightCorrect={() => setHighlightCorrect(!highlightCorrect)}
                            showAllFeedback={showAllFeedback}
                            onToggleShowAllFeedback={() => setShowAllFeedback(!showAllFeedback)}
                            isCotVisible={isCotVisible}
                            onToggleCotVisible={() => setIsCotVisible(!isCotVisible)}
                            activeFilter={activeFilter}
                            onSelectFilter={setActiveFilter}
                            isSubmitted={isExamSubmitted}
                          />

                          {isCotVisible && currentExamData.analisis_anticolision && (
                            <CotAuditCard reasoning={currentExamData.analisis_anticolision} />
                          )}

                          <div ref={renderedContentRef} className="space-y-4">
                            {filteredQuestions.map((q, idx) => (
                              <QuestionCard
                                key={`${q.blockIndex}-${q.questionIndexInBlock}`}
                                question={q}
                                globalIndex={allQuestions.findIndex(
                                  (item) => item.blockIndex === q.blockIndex && item.questionIndexInBlock === q.questionIndexInBlock
                                )}
                                evalMode={evalMode}
                                isSubmitted={isExamSubmitted}
                                hideDistractors={hideDistractors}
                                highlightCorrect={highlightCorrect}
                                showFeedback={showAllFeedback}
                                onSelectAnswer={handleSelectAnswer}
                                onToggleFlag={handleToggleFlag}
                              />
                            ))}
                          </div>

                          <ExamFooterBar
                            onSubmit={handleSubmitExam}
                            isSubmitted={isExamSubmitted}
                            onExport={handleExportText}
                            onCopy={handleCopyText}
                            onOpenOmrSheet={() => setIsOmrScannerOpen(true)}
                          />
                        </>
                      )}

                      {currentTab !== "interactive" && (
                        <CodeViewPanel
                          format={currentTab}
                          examData={currentExamData}
                          title={loadedFileName}
                          onCopy={handleCopyText}
                          onExport={handleExportText}
                        />
                      )}
                    </>
                  )}

                  {selectedBaseDoc && (
                    <DocumentViewerPanel
                      doc={selectedBaseDoc}
                      onUpdateText={(text) => handleUpdateDocumentText(selectedBaseDoc.id, text)}
                      preferredMode={docViewerPreferredMode}
                      onGenerateFromFragment={handleGenerateFromFragment}
                      onClose={handleCloseViewer}
                    />
                  )}
                </>
              ) : (
                <EmptyState onOpenFileSelect={() => {}} />
              )}
            </div>
          </div>
        </main>
      )}

      {/* Modals & Overlays */}
      <AIProviderModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        settings={aiSettings}
        onSave={handleSaveAISettings}
      />

      <ThematicBuilderModal
        isOpen={isThematicModalOpen}
        onClose={() => setIsThematicModalOpen(false)}
        groups={thematics}
        onSave={handleUpdateThematics}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleClearFiles}
        title="¿Limpiar todos los archivos?"
        message="Esta acción eliminará todos los documentos cargados y exámenes generados de la memoria actual."
      />

      {isResultsModalOpen && currentExamData && (
        <ResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => setIsResultsModalOpen(false)}
          score={calculateScore()}
        />
      )}

      {isOmrModalOpen && (
        <OmrSheetModal
          isOpen={isOmrModalOpen}
          onClose={() => setIsOmrModalOpen(false)}
          examData={currentExamData}
        />
      )}

      {isOmrScannerOpen && (
        <ZipgradeSuiteModal
          isOpen={isOmrScannerOpen}
          onClose={() => setIsOmrScannerOpen(false)}
          examData={currentExamData}
        />
      )}

      {isLoading && (
        <LoadingOverlay
          onCancel={handleCancelGeneration}
          statusText="Generando preguntas active recall con IA..."
        />
      )}

      <NotificationToast message={toastMessage} isError={toastIsError} />
    </div>
  );
}
