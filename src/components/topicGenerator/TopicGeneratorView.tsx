import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import {
  Cpu,
  FileText,
  Settings,
  Code,
  BookOpen,
  TextCursorInput,
  Trash2,
  FileType2,
  CloudUpload,
  AlignJustify,
  ListTree,
  Wand2,
  ShieldCheck,
  Shield,
  Printer,
  Bot,
  CheckCircle2,
  Zap,
  RefreshCw,
  HelpCircle,
  BrainCircuit,
  ScanLine,
  Key,
  Play,
  MonitorX,
  Import,
  Sun,
  Moon,
  FileDown,
  AlignLeft,
  EyeOff,
  Eye,
  Info,
  ArrowRight,
  X,
  GripVertical,
  List,
  Sparkles,
  Layers,
  ChevronRight,
  Download,
  AlertTriangle,
  FileCheck,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  ChevronDown,
  ChevronUp,
  Hash,
  Clock,
  Activity,
  ArrowLeftRight,
  Bug,
  FileCode,
  Edit3,
  Save,
  Globe,
} from "lucide-react";

import {
  TopicDepth,
  TopicAuditOptions,
  TopicUploadedFile,
  GeneratedTopicVersion,
  TopicGenerationMode,
  TopicOutlineBlueprint,
  TopicSectionPlan,
} from "../../types/thematicDoc";
import { AIProviderConfig } from "../../types/aiProviders";
import { ExamData, UploadedDocument } from "../../types/exam";
import { extractTextFromFile, extractTextFromPDF } from "../../utils/pdfExtractor";
import {
  buildDynamicTopicPrompt,
  buildModularOutlinePrompt,
  buildModularSectionPrompt,
  buildModularClosingPrompt,
  assembleModularDocumentHtml,
  injectDocumentStyles,
  exportStandaloneHtmlDocument,
  preparePrintableHtmlDocument,
  extractActiveRecallExamFromHtml,
  cleanAndRepairTopicHtml,
  htmlToCleanTopicText,
  extractAutoevaluacionYSolucionarioText,
  renderMarkdownDeliverableHtml,
  renderTechnicalA4DocumentHtml,
  renderPlainCodeHtml,
  markdownToCleanHtml,
} from "../../utils/topicPromptGenerator";
import { downloadBlob } from "../../utils/fileHelpers";
import { exportHtmlToDocx } from "../../utils/docxExport";
import { ModularPlannerModal } from "./ModularPlannerModal";

export interface TopicDebugLog {
  fecha: string;
  modelo: string;
  proveedor: string;
  profundidad: string;
  subapartados: number;
  opcionesActivas: TopicAuditOptions;
  promptEnviado: string;
  respuestaRaw: string;
  htmlProcesado?: string;
  metricasTokens?: {
    in: number;
    out: number;
    total: number;
  } | null;
  errorStack?: {
    mensaje: string;
    stack?: string;
  } | null;
}


interface TopicGeneratorViewProps {
  activeProviderConfig?: AIProviderConfig;
  onShowToast: (msg: string, isError?: boolean) => void;
  onSendExamToApp?: (examData: ExamData | null, baseDocuments?: UploadedDocument[]) => void;
  onTransferDocumentToExams?: (file: TopicUploadedFile) => void;
  onOpenAIModal?: () => void;
}

export const TopicGeneratorView: React.FC<TopicGeneratorViewProps> = ({
  activeProviderConfig,
  onShowToast,
  onSendExamToApp,
  onTransferDocumentToExams,
  onOpenAIModal,
}) => {
  // Tabs: 'generator' | 'config' | 'prompt'
  const [activeSidebarTab, setActiveSidebarTab] = useState<"generator" | "config" | "prompt">("generator");
  const [mobileTab, setMobileTab] = useState<"panel" | "preview">("panel");
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem("docuexam_topic_zoom");
    return saved ? parseInt(saved, 10) || 100 : 100;
  });
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Inputs with localStorage persistence
  const [topic, setTopic] = useState<string>(() => {
    return localStorage.getItem("docuexam_topic_title") || "";
  });
  const [baseMode, setBaseMode] = useState<"files" | "text">("files");
  const [uploadedFiles, setUploadedFiles] = useState<TopicUploadedFile[]>(() => {
    try {
      const saved = localStorage.getItem("docuexam_topic_rag_files");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [pastedContext, setPastedContext] = useState<string>(() => {
    return localStorage.getItem("docuexam_topic_context") || "";
  });

  // Density & Subtopics
  const [currentDepth, setCurrentDepth] = useState<TopicDepth>(() => {
    const saved = localStorage.getItem("docuexam_topic_depth");
    if (saved === "resumen" || saved === "estandar" || saved === "catedratico") return saved;
    return "catedratico";
  });
  const [subapartados, setSubapartados] = useState<number>(() => {
    const saved = localStorage.getItem("docuexam_topic_subapartados");
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 2 && num <= 15) return num;
    }
    return 5;
  });
  const [isAutoDepth, setIsAutoDepth] = useState<boolean>(true);

  // Audit Options
  const [activeOptions, setActiveOptions] = useState<TopicAuditOptions>(() => {
    try {
      const saved = localStorage.getItem("docuexam_topic_options");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      glossary: true,
      cot: true,
      pedagogic: true,
      recall: true,
      mnemotecnias: true,
      antitunel: true,
    };
  });

  // Token Tracking
  const [tokensIn, setTokensIn] = useState<number>(() => {
    return parseInt(localStorage.getItem("experto_tokens_in") || "0", 10);
  });
  const [tokensOut, setTokensOut] = useState<number>(() => {
    return parseInt(localStorage.getItem("experto_tokens_out") || "0", 10);
  });
  const [tokensTotal, setTokensTotal] = useState<number>(() => {
    return parseInt(localStorage.getItem("experto_tokens_total") || "0", 10);
  });

  // Document Versions with localStorage persistence
  const [versions, setVersions] = useState<GeneratedTopicVersion[]>(() => {
    try {
      const saved = localStorage.getItem("docuexam_topic_versions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(() => {
    try {
      const savedIdx = localStorage.getItem("docuexam_topic_current_index");
      if (savedIdx !== null) {
        const parsedIdx = parseInt(savedIdx, 10);
        if (!isNaN(parsedIdx)) return parsedIdx;
      }
    } catch {}
    return -1;
  });
  const [draggedVersionIdx, setDraggedVersionIdx] = useState<number | null>(null);

  // Generation Mode: 'rapido' (1-shot) | 'modular' (multi-step by section)
  const [generationMode, setGenerationMode] = useState<TopicGenerationMode>(() => {
    return (localStorage.getItem("docuexam_topic_gen_mode") as TopicGenerationMode) || "modular";
  });
  const [modularBlueprint, setModularBlueprint] = useState<TopicOutlineBlueprint | null>(null);
  const [isModularPlannerOpen, setIsModularPlannerOpen] = useState(false);
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);
  const [modularProgress, setModularProgress] = useState<{ current: number; total: number; sectionName: string }>({
    current: 0,
    total: 0,
    sectionName: "",
  });

  // Save generation mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("docuexam_topic_gen_mode", generationMode);
    } catch {}
  }, [generationMode]);

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPredictingDepth, setIsPredictingDepth] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analizando contexto, estructurando índices y redactando apartados de alta densidad...");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hideTablesInDoc, setHideTablesInDoc] = useState(false);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const [docTheme, setDocTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("docuexam_topic_doctheme") as "light" | "dark") || "dark";
  });
  const [previewingRagDoc, setPreviewingRagDoc] = useState<TopicUploadedFile | null>(null);
  const [docViewStyle, setDocViewStyle] = useState<"markdown" | "html" | "code_html" | "code_md">("markdown");
  const [isEditingBaseDoc, setIsEditingBaseDoc] = useState(false);
  const [editedBaseDocText, setEditedBaseDocText] = useState("");
  const [lastDebugLog, setLastDebugLog] = useState<TopicDebugLog | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Sync edited text when previewing document changes
  useEffect(() => {
    if (previewingRagDoc) {
      setEditedBaseDocText(previewingRagDoc.text || "");
      setIsEditingBaseDoc(false);
    }
  }, [previewingRagDoc]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("docuexam_topic_versions", JSON.stringify(versions));
    } catch (e) {
      console.warn("Storage quota exceeded or error storing versions:", e);
    }
  }, [versions]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_current_index", currentVersionIndex.toString());
  }, [currentVersionIndex]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_title", topic);
  }, [topic]);

  useEffect(() => {
    try {
      localStorage.setItem("docuexam_topic_rag_files", JSON.stringify(uploadedFiles));
    } catch {}
  }, [uploadedFiles]);

  // Listen to cross-module storage events to sync transferred files
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("docuexam_topic_rag_files");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setUploadedFiles(parsed);
          }
        }
      } catch {}
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_context", pastedContext);
  }, [pastedContext]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_depth", currentDepth);
  }, [currentDepth]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_subapartados", subapartados.toString());
  }, [subapartados]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_options", JSON.stringify(activeOptions));
  }, [activeOptions]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_doctheme", docTheme);
  }, [docTheme]);

  useEffect(() => {
    localStorage.setItem("docuexam_topic_zoom", zoomLevel.toString());
  }, [zoomLevel]);

  // Ensure active version index is valid on load
  useEffect(() => {
    if (versions.length > 0 && (currentVersionIndex < 0 || currentVersionIndex >= versions.length)) {
      setCurrentVersionIndex(versions.length - 1);
    }
  }, []);
  
  // UX & Exploration states
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineFilter, setOutlineFilter] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchesCount, setSearchMatchesCount] = useState(0);
  const [isRagDragOver, setIsRagDragOver] = useState(false);
  const [isProcessingRag, setIsProcessingRag] = useState(false);
  const [processingRagStatus, setProcessingRagStatus] = useState("");
  const [streamingStats, setStreamingStats] = useState({
    elapsedSeconds: 0,
    tokSpeed: 0,
    words: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importHtmlInputRef = useRef<HTMLInputElement>(null);

  // Auto-depth calculation on topic change if auto mode is on
  useEffect(() => {
    if (!isAutoDepth || !topic.trim()) return;
    const itemsMatch = topic.match(/(?:\n|^)\s*(?:\d+[\.\)-]|[-*•]|\w\)) /gi);
    const semicolonMatch = topic.match(/;/g);
    const periodSentenceMatch = topic.replace(/^Tema\s+\d+[\.\:\-]?\s*/i, "").match(/\.\s+[A-ZÁÉÍÓÚÑ]/g);
    let count = 5;

    if (itemsMatch && itemsMatch.length > 1) {
      count = itemsMatch.length;
    } else if (semicolonMatch && semicolonMatch.length > 1) {
      count = semicolonMatch.length + 1;
    } else if (periodSentenceMatch && periodSentenceMatch.length >= 3) {
      count = periodSentenceMatch.length + 1;
    } else {
      const words = topic.split(/\s+/).length;
      if (words <= 5) count = 4;
      else if (words <= 12) count = 6;
      else if (words <= 25) count = 8;
      else if (words <= 40) count = 10;
      else count = 12;
    }
    setSubapartados(Math.max(2, Math.min(15, count)));
  }, [topic, isAutoDepth]);

  // Sync iframe document when version, docTheme or docViewStyle changes
  useEffect(() => {
    const isDark = docTheme === "dark";
    if (previewingRagDoc) {
      let renderedHtml = "";
      if (docViewStyle === "markdown") {
        renderedHtml = renderMarkdownDeliverableHtml(previewingRagDoc.name, previewingRagDoc.text, isDark);
      } else if (docViewStyle === "html") {
        renderedHtml = renderTechnicalA4DocumentHtml(previewingRagDoc.name, previewingRagDoc.text, isDark);
      } else if (docViewStyle === "code_html") {
        const fullHtml = renderTechnicalA4DocumentHtml(previewingRagDoc.name, previewingRagDoc.text, false);
        renderedHtml = renderPlainCodeHtml(previewingRagDoc.name, fullHtml, "html", isDark);
      } else {
        // code_md
        renderedHtml = renderPlainCodeHtml(previewingRagDoc.name, previewingRagDoc.text, "md", isDark);
      }

      if (hideTablesInDoc) {
        renderedHtml = renderedHtml.replace("<html", '<html class="hide-tables"');
      }

      if (iframeRef.current) {
        iframeRef.current.srcdoc = renderedHtml;
      }
    } else if (currentVersionIndex >= 0 && versions[currentVersionIndex]) {
      const currentVer = versions[currentVersionIndex];
      let renderedHtml = "";

      if (docViewStyle === "markdown") {
        const markdownFromTopic = htmlToCleanTopicText(currentVer.topic, currentVer.html);
        renderedHtml = renderMarkdownDeliverableHtml(currentVer.topic, markdownFromTopic, isDark);
      } else if (docViewStyle === "code_html") {
        renderedHtml = renderPlainCodeHtml(currentVer.topic, currentVer.html, "html", isDark);
      } else if (docViewStyle === "code_md") {
        const markdownFromTopic = htmlToCleanTopicText(currentVer.topic, currentVer.html);
        renderedHtml = renderPlainCodeHtml(currentVer.topic, markdownFromTopic, "md", isDark);
      } else {
        // "html" mode - standard A4 injected styles
        let html = injectDocumentStyles(currentVer.html);
        if (isDark && !html.includes("dark-theme")) {
          html = html.replace("<body", '<body class="dark-theme"');
        } else if (!isDark) {
          html = html.replace(/dark-theme/g, "");
        }
        renderedHtml = html;
      }

      if (hideTablesInDoc) {
        renderedHtml = renderedHtml.replace("<html", '<html class="hide-tables"');
      }

      if (iframeRef.current) {
        iframeRef.current.srcdoc = renderedHtml;
      }
    }
  }, [currentVersionIndex, versions, docTheme, hideTablesInDoc, previewingRagDoc, docViewStyle]);

  // Aggregate files text (respecting active flag)
  const aggregatedFilesText = uploadedFiles
    .filter((f) => f.active !== false)
    .map((f) => f.text)
    .join("\n\n---\n\n");

  // Dynamic Prompt preview text
  const dynamicPromptText = buildDynamicTopicPrompt(
    topic,
    currentDepth,
    subapartados,
    activeOptions,
    aggregatedFilesText,
    pastedContext
  );

  // Handle Drag & Drop for Base Documentation (RAG)
  const handleRagDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRagDragOver(true);
  };

  const handleRagDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRagDragOver(false);
  };

  const handleRagDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRagDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  // Process incoming files from input or drag-and-drop
  const processIncomingFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsProcessingRag(true);
    setProcessingRagStatus(`Iniciando lectura de ${files.length} archivo(s)...`);
    onShowToast(`Procesando ${files.length} archivo(s)...`);

    const newDocs: TopicUploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (uploadedFiles.some((f) => f.name === file.name)) {
        onShowToast(`El archivo ${file.name} ya está en la lista`, false);
        continue;
      }

      setProcessingRagStatus(`Cargando ${file.name} (${i + 1}/${files.length})...`);

      try {
        const extracted = await extractTextFromFile(
          file,
          (msg) => {
            setProcessingRagStatus(msg);
            onShowToast(msg, false);
          },
          activeProviderConfig?.apiKey
        );

        if (extracted && extracted.trim()) {
          newDocs.push({
            id: `rag-file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            text: extracted.trim(),
            size: file.size,
          });
        } else {
          onShowToast(`No se detectó contenido de texto en ${file.name}`, true);
        }
      } catch (err: any) {
        console.error("Error reading file:", err);
        onShowToast(`Error al leer ${file.name}: ${err?.message || "Fallo"}`, true);
      }
    }

    if (newDocs.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newDocs]);
      onShowToast(`${newDocs.length} archivo(s) añadido(s) a la base documental`);
    }

    setIsProcessingRag(false);
    setProcessingRagStatus("");
  };

  // Handle file input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processIncomingFiles(e.target.files);
    e.target.value = "";
  };

  // AI-Assisted Auto-depth predictor
  const handleAutoSuggestDepth = async () => {
    if (!topic.trim()) {
      onShowToast("Escribe primero el título o índice del tema", true);
      return;
    }

    setIsPredictingDepth(true);
    try {
      const res = await fetch("/api/suggest-depth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          apiKey: activeProviderConfig?.apiKey,
          model: activeProviderConfig?.selectedModel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggested && typeof data.suggested === "number") {
          setSubapartados(data.suggested);
          setIsAutoDepth(true);
          onShowToast(`🪄 Estructura calculada por IA: ${data.suggested} subapartados óptimos`);
        }
      }
    } catch (e) {
      console.warn("Fallo al predecir profundidad:", e);
    } finally {
      setIsPredictingDepth(false);
    }
  };

  // Toggle Audit option pills
  const toggleOption = (opt: keyof TopicAuditOptions) => {
    setActiveOptions((prev) => ({
      ...prev,
      [opt]: !prev[opt],
    }));
  };

  // Fetch or regenerate Modular Outline Blueprint
  const handleFetchModularBlueprint = async () => {
    if (!topic.trim()) {
      onShowToast("Introduce el título del tema para planificar el índice", true);
      return;
    }
    setIsLoadingBlueprint(true);
    setIsModularPlannerOpen(true);

    try {
      const outlinePrompt = buildModularOutlinePrompt(
        topic,
        currentDepth,
        subapartados,
        activeOptions,
        aggregatedFilesText,
        pastedContext
      );

      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: outlinePrompt,
          providerId: activeProviderConfig?.id || "gemini",
          apiKey: activeProviderConfig?.apiKey,
          endpoint: activeProviderConfig?.endpoint,
          model: activeProviderConfig?.selectedModel,
          temperature: 0.2,
          jsonMode: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en servidor (${response.status})`);
      }

      const resData = await response.json();
      const rawText = resData.text || "";
      let parsed: TopicOutlineBlueprint | null = null;

      try {
        const cleanJsonStr = rawText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, "$1").trim();
        parsed = JSON.parse(cleanJsonStr);
      } catch {
        // Fallback: build default blueprint
        const fallbackSections: TopicSectionPlan[] = Array.from({ length: subapartados }, (_, i) => ({
          id: `sec-${i + 1}`,
          sectionNumber: `3.${i + 1}`,
          title: `Epígrafe ${i + 1}: Análisis y Desarrollo Técnico`,
          description: "Fundamentos, procedimientos y casos prácticos aplicables.",
          status: "pending",
        }));

        parsed = {
          topicTitle: topic.trim(),
          introductionSummary: "Justificación y relevancia del tema para la práctica técnica y marco de oposición.",
          sections: fallbackSections,
          includeConclusion: true,
          includeBibliography: true,
          includeNormative: true,
          includeGlossary: activeOptions.glossary,
        };
      }

      if (parsed && Array.isArray(parsed.sections)) {
        parsed.sections = parsed.sections.map((s, idx) => ({
          ...s,
          id: s.id || `sec-${idx + 1}`,
          sectionNumber: s.sectionNumber || `3.${idx + 1}`,
          status: "pending" as const,
        }));
        setModularBlueprint(parsed);
      }
    } catch (err: any) {
      console.error("Error obteniendo blueprint modular:", err);
      onShowToast(`Error planificando índice: ${err.message || "Fallo de conexión"}`, true);
    } finally {
      setIsLoadingBlueprint(false);
    }
  };

  // Start Generation Flow depending on selected mode
  const handleStartGeneration = () => {
    if (!topic.trim()) {
      onShowToast("Por favor, introduce el título o índice del tema a desarrollar", true);
      return;
    }
    if (generationMode === "modular") {
      handleFetchModularBlueprint();
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  // Execute Modular Generation Section by Section
  const handleExecuteModularGeneration = async () => {
    if (!modularBlueprint || modularBlueprint.sections.length === 0) return;
    setIsModularPlannerOpen(false);
    setIsGenerating(true);
    setGenerationError(null);
    setMobileTab("preview");
    setPreviewingRagDoc(null);

    abortControllerRef.current = new AbortController();

    const sectionsToGenerate = [...modularBlueprint.sections];
    const generatedSections: Array<{ sectionNumber: string; title: string; html: string }> = [];
    let currentQuestionCounter = 1;
    let accumulatedTokensIn = 0;
    let accumulatedTokensOut = 0;

    try {
      // Loop sequentially through each section with its own token budget
      for (let i = 0; i < sectionsToGenerate.length; i++) {
        if (abortControllerRef.current.signal.aborted) break;

        const sec = sectionsToGenerate[i];
        setModularProgress({
          current: i + 1,
          total: sectionsToGenerate.length + 1, // +1 for closing blocks
          sectionName: `${sec.sectionNumber}. ${sec.title}`,
        });
        setLoadingStatus(
          `[Epígrafe ${i + 1}/${sectionsToGenerate.length}] Redactando en máxima densidad: "${sec.title}"...`
        );

        const sectionPrompt = buildModularSectionPrompt(
          modularBlueprint.topicTitle || topic,
          sec,
          i,
          sectionsToGenerate.length,
          currentDepth,
          activeOptions,
          currentQuestionCounter,
          aggregatedFilesText,
          pastedContext
        );

        const secRes = await fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: sectionPrompt,
            providerId: activeProviderConfig?.id || "gemini",
            apiKey: activeProviderConfig?.apiKey,
            endpoint: activeProviderConfig?.endpoint,
            model: activeProviderConfig?.selectedModel,
            temperature: 0.3,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!secRes.ok) {
          throw new Error(`Fallo en epígrafe ${sec.sectionNumber} (HTTP ${secRes.status})`);
        }

        const secData = await secRes.json();
        const cleanSecHtml = cleanAndRepairTopicHtml(secData.text || "");
        generatedSections.push({
          sectionNumber: sec.sectionNumber,
          title: sec.title,
          html: cleanSecHtml,
        });

        // Count how many questions were included
        const recallQuestionsMatch = cleanSecHtml.match(/<li><strong>\d+\.<\/strong>/gi);
        if (recallQuestionsMatch) {
          currentQuestionCounter += recallQuestionsMatch.length;
        } else {
          currentQuestionCounter += (currentDepth === "resumen" ? 2 : currentDepth === "estandar" ? 3 : 4);
        }

        if (secData.usage) {
          accumulatedTokensIn += secData.usage.promptTokens || 0;
          accumulatedTokensOut += secData.usage.candidatesTokens || 0;
        }

        // Live preview of assembled progress so far
        const partialHtml = assembleModularDocumentHtml(
          modularBlueprint.topicTitle || topic,
          modularBlueprint.introductionSummary,
          generatedSections,
          `<div class="loading-next-section" style="padding: 16px; background: rgba(245,158,11,0.1); border: 1px dashed #f59e0b; border-radius: 8px; margin-top: 16px; font-style: italic; color: #f59e0b;">⏳ Redactando siguientes epígrafes (${i + 2}/${sectionsToGenerate.length})...</div>`
        );
        if (iframeRef.current) {
          iframeRef.current.srcdoc = partialHtml;
        }
      }

      if (abortControllerRef.current.signal.aborted) {
        throw new Error("Generación modular cancelada");
      }

      // PHASE 3: Generate Closing Blocks (Conclusión, Bibliografía, Normativa, Glosario)
      setModularProgress({
        current: sectionsToGenerate.length + 1,
        total: sectionsToGenerate.length + 1,
        sectionName: "Conclusión, Bibliografía, Normativa y Glosario",
      });
      setLoadingStatus("Generando apartados finales: Conclusión, Bibliografía, Normativas y Glosario...");

      const closingPrompt = buildModularClosingPrompt(
        modularBlueprint.topicTitle || topic,
        modularBlueprint,
        activeOptions,
        currentQuestionCounter,
        aggregatedFilesText
      );

      const closingRes = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: closingPrompt,
          providerId: activeProviderConfig?.id || "gemini",
          apiKey: activeProviderConfig?.apiKey,
          endpoint: activeProviderConfig?.endpoint,
          model: activeProviderConfig?.selectedModel,
          temperature: 0.3,
        }),
        signal: abortControllerRef.current.signal,
      });

      let closingHtml = "";
      if (closingRes.ok) {
        const closingData = await closingRes.json();
        closingHtml = cleanAndRepairTopicHtml(closingData.text || "");
        if (closingData.usage) {
          accumulatedTokensIn += closingData.usage.promptTokens || 0;
          accumulatedTokensOut += closingData.usage.candidatesTokens || 0;
        }
      }

      // Assemble final complete document
      let finalFullHtml = assembleModularDocumentHtml(
        modularBlueprint.topicTitle || topic,
        modularBlueprint.introductionSummary,
        generatedSections,
        closingHtml
      );

      // Sanitize
      finalFullHtml = DOMPurify.sanitize(finalFullHtml, {
        WHOLE_DOCUMENT: true,
        ADD_TAGS: ["style", "meta", "title", "caption"],
        ADD_ATTR: ["class", "id", "style", "aria-hidden", "charset", "lang"],
      });
      finalFullHtml = cleanAndRepairTopicHtml(finalFullHtml);
      finalFullHtml = injectDocumentStyles(finalFullHtml);

      if (docTheme === "dark" && !finalFullHtml.includes("dark-theme")) {
        finalFullHtml = finalFullHtml.replace("<body", '<body class="dark-theme"');
      }

      // Update tokens in local storage
      setTokensIn((prev) => {
        const v = prev + accumulatedTokensIn;
        localStorage.setItem("experto_tokens_in", v.toString());
        return v;
      });
      setTokensOut((prev) => {
        const v = prev + accumulatedTokensOut;
        localStorage.setItem("experto_tokens_out", v.toString());
        return v;
      });
      setTokensTotal((prev) => {
        const v = prev + accumulatedTokensIn + accumulatedTokensOut;
        localStorage.setItem("experto_tokens_total", v.toString());
        return v;
      });

      const newVersion: GeneratedTopicVersion = {
        id: Date.now(),
        topic: (modularBlueprint.topicTitle || topic).trim(),
        depth: currentDepth,
        html: finalFullHtml,
        timestamp: Date.now(),
        modelName: `${activeProviderConfig?.selectedModel || "gemini-3.7-flash"} (Modular ${sectionsToGenerate.length} Secciones)`,
      };

      setVersions((prev) => {
        const updated = [...prev, newVersion];
        setCurrentVersionIndex(updated.length - 1);
        return updated;
      });

      if (iframeRef.current) {
        iframeRef.current.srcdoc = finalFullHtml;
      }

      onShowToast(`✨ Temario modular de ${sectionsToGenerate.length} epígrafes completado con éxito`);
    } catch (error: any) {
      if (error.name === "AbortError" || error.message.includes("cancelada")) {
        if (generatedSections.length > 0) {
          const draftHtml = assembleModularDocumentHtml(
            modularBlueprint.topicTitle || topic,
            modularBlueprint.introductionSummary,
            generatedSections,
            `<p><em>[Generación detenida en la sección ${generatedSections.length}]</em></p>`
          );
          const draftVersion: GeneratedTopicVersion = {
            id: Date.now(),
            topic: topic.trim() + " (Borrador Parcial)",
            depth: currentDepth,
            html: draftHtml,
            timestamp: Date.now(),
          };
          setVersions((prev) => {
            const updated = [...prev, draftVersion];
            setCurrentVersionIndex(updated.length - 1);
            return updated;
          });
          onShowToast("Generación cancelada. Se conservaron los epígrafes redactados.");
        } else {
          onShowToast("Generación cancelada", true);
        }
      } else {
        console.error("Error en generación modular:", error);
        setGenerationError(error.message || "Fallo en la redacción modular");
        onShowToast(`Error: ${error.message || "Fallo en la redacción modular"}`, true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Start Generation Flow

  // Execute Generation via SSE Stream or API
  const handleConfirmAndExecute = async () => {
    setIsConfirmModalOpen(false);
    setIsGenerating(true);
    setGenerationError(null);
    setMobileTab("preview");
    setPreviewingRagDoc(null);
    setLoadingStatus("Analizando contexto, estructurando índices y redactando apartados de alta densidad...");

    abortControllerRef.current = new AbortController();

    const fullPrompt = buildDynamicTopicPrompt(
      topic,
      currentDepth,
      subapartados,
      activeOptions,
      aggregatedFilesText,
      pastedContext
    );

    const debugRecord: TopicDebugLog = {
      fecha: new Date().toISOString(),
      modelo: activeProviderConfig?.selectedModel || "gemini-3.6-flash",
      proveedor: activeProviderConfig?.id || "gemini",
      profundidad: currentDepth,
      subapartados: subapartados,
      opcionesActivas: { ...activeOptions },
      promptEnviado: fullPrompt,
      respuestaRaw: "",
      htmlProcesado: "",
      metricasTokens: null,
      errorStack: null,
    };
    setLastDebugLog(debugRecord);

    let streamBuffer = "";
    let isFirstRender = true;

    try {
      const response = await fetch("/api/stream-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          providerId: activeProviderConfig?.id || "gemini",
          apiKey: activeProviderConfig?.apiKey,
          endpoint: activeProviderConfig?.endpoint,
          model: activeProviderConfig?.selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || `Error en servidor HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let partialLineBuffer = "";

      if (!reader) throw new Error("No se pudo iniciar el flujo de lectura.");

      let lastFrameUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialLineBuffer += decoder.decode(value, { stream: true });
        const lines = partialLineBuffer.split("\n");
        partialLineBuffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.message || data.error);
              }

              if (data.usage) {
                setTokensIn((prev) => {
                  const val = prev + (data.usage.promptTokens || 0);
                  localStorage.setItem("experto_tokens_in", val.toString());
                  return val;
                });
                setTokensOut((prev) => {
                  const val = prev + (data.usage.candidatesTokens || 0);
                  localStorage.setItem("experto_tokens_out", val.toString());
                  return val;
                });
                setTokensTotal((prev) => {
                  const val = prev + (data.usage.totalTokens || 0);
                  localStorage.setItem("experto_tokens_total", val.toString());
                  return val;
                });
              }

              const chunk = data.text || "";
              streamBuffer += chunk;

              // Live stream preview update
              if (streamBuffer.length > 50 && isFirstRender) {
                isFirstRender = false;
                setLoadingStatus("Redactando apartados técnicos y cuadros didácticos en tiempo real...");
              }

              const now = Date.now();
              if (!isFirstRender && iframeRef.current && now - lastFrameUpdate > 300) {
                lastFrameUpdate = now;
                try {
                  let liveHtml = cleanAndRepairTopicHtml(streamBuffer);
                  liveHtml = injectDocumentStyles(liveHtml);
                  if (docTheme === "dark" && !liveHtml.includes("dark-theme")) {
                    liveHtml = liveHtml.replace("<body", '<body class="dark-theme"');
                  }
                  iframeRef.current.srcdoc = liveHtml;
                } catch {
                  // Non-fatal preview update error
                }
              }
            } catch (err: any) {
              if (err.message && !err.message.includes("JSON")) {
                throw err;
              }
            }
          }
        }
      }

      // Cleanup and extract final clean HTML
      let cleanHtml = cleanAndRepairTopicHtml(streamBuffer);

      // Sanitize with DOMPurify
      cleanHtml = DOMPurify.sanitize(cleanHtml, {
        WHOLE_DOCUMENT: true,
        ADD_TAGS: ["style", "meta", "title", "caption"],
        ADD_ATTR: ["class", "id", "style", "aria-hidden", "charset", "lang"],
      });

      // Post-purify secondary repair pass and style injection
      cleanHtml = cleanAndRepairTopicHtml(cleanHtml);
      cleanHtml = injectDocumentStyles(cleanHtml);

      // Verify that output is not blank; if so, construct structured recovery from raw stream
      const textOnly = cleanHtml.replace(/<[^>]*>/g, "").trim();
      if (textOnly.length < 15 && streamBuffer.trim().length > 0) {
        cleanHtml = `<div class="page"><h1>${topic.trim() || "DOCUMENTO TÉCNICO"}</h1><p>${streamBuffer.trim().replace(/\n\n+/g, "</p><p>")}</p></div>`;
        cleanHtml = injectDocumentStyles(cleanHtml);
      } else if (textOnly.length === 0 && streamBuffer.trim().length === 0) {
        throw new Error("El modelo generó una respuesta vacía. Por favor, reintenta la generación.");
      }

      if (docTheme === "dark" && !cleanHtml.includes("dark-theme")) {
        cleanHtml = cleanHtml.replace("<body", '<body class="dark-theme"');
      }

      const newVersion: GeneratedTopicVersion = {
        id: Date.now(),
        topic: topic.trim(),
        depth: currentDepth,
        html: cleanHtml,
        timestamp: Date.now(),
        modelName: activeProviderConfig?.selectedModel || "gemini-3.6-flash",
      };

      debugRecord.respuestaRaw = streamBuffer;
      debugRecord.htmlProcesado = cleanHtml;
      debugRecord.metricasTokens = {
        in: tokensIn,
        out: tokensOut,
        total: tokensTotal,
      };
      setLastDebugLog(debugRecord);

      setVersions((prev) => {
        const updated = [...prev, newVersion];
        setCurrentVersionIndex(updated.length - 1);
        return updated;
      });

      if (iframeRef.current) {
        iframeRef.current.srcdoc = cleanHtml;
      }

      onShowToast("✨ Documento de alta densidad generado exitosamente");
    } catch (error: any) {
      debugRecord.respuestaRaw = streamBuffer;
      debugRecord.errorStack = {
        mensaje: error.message || "Error desconocido en generación",
        stack: error.stack,
      };
      setLastDebugLog(debugRecord);

      if (error.name === "AbortError") {
        if (streamBuffer.trim().length > 150) {
          try {
            let partialHtml = cleanAndRepairTopicHtml(streamBuffer);
            partialHtml = DOMPurify.sanitize(partialHtml, {
              WHOLE_DOCUMENT: true,
              ADD_TAGS: ["style", "meta", "title", "caption"],
              ADD_ATTR: ["class", "id", "style", "aria-hidden", "charset", "lang"],
            });
            partialHtml = injectDocumentStyles(partialHtml);
            const draftVersion: GeneratedTopicVersion = {
              id: Date.now(),
              topic: topic.trim() + " (Borrador Interrumpido)",
              depth: currentDepth,
              html: partialHtml,
              timestamp: Date.now(),
            };
            setVersions((prev) => {
              const updated = [...prev, draftVersion];
              setCurrentVersionIndex(updated.length - 1);
              return updated;
            });
            if (iframeRef.current) {
              iframeRef.current.srcdoc = partialHtml;
            }
            onShowToast("Generación cancelada. Se ha guardado el borrador parcial.");
          } catch {
            onShowToast("Generación cancelada por el usuario", true);
          }
        } else {
          onShowToast("Generación cancelada por el usuario", true);
        }
      } else {
        console.error("Error en generación de temario:", error);
        setGenerationError(error.message || "Fallo en la generación");
        onShowToast(`Error: ${error.message || "Fallo en la generación"}`, true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDebugLog = () => {
    if (!lastDebugLog) {
      onShowToast("No hay registros de depuración disponibles en esta sesión", true);
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `Experto_IA_Debug_Log_${timestamp}.json`;
    const jsonStr = JSON.stringify(lastDebugLog, null, 2);
    downloadBlob(filename, jsonStr, "application/json;charset=utf-8");
    onShowToast(`📥 Log de depuración descargado: ${filename}`);
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  // Convert Active Recall questions to Exam format and send all relevant documents to main app
  const handleConvertActiveRecallToExam = async (specificFile?: TopicUploadedFile) => {
    let effectiveUploadedFiles = uploadedFiles;
    if (specificFile && specificFile.active === false) {
      effectiveUploadedFiles = uploadedFiles.map((item) =>
        item.id === specificFile.id ? { ...item, active: true } : item
      );
      setUploadedFiles(effectiveUploadedFiles);
    }

    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) {
      // If no version is generated yet, transfer active base docs
      const activeRagDocs: UploadedDocument[] = effectiveUploadedFiles
        .filter((f) => f.active !== false || (specificFile && f.id === specificFile.id))
        .map((f) => ({
          id: `topic-rag-${f.id}`,
          name: f.name,
          text: f.text,
          size: f.size || new Blob([f.text]).size,
          role: "base" as const,
          active: true,
          timestamp: Date.now(),
        }));

      if (activeRagDocs.length > 0 && onSendExamToApp) {
        onSendExamToApp(null, activeRagDocs);
        onShowToast(`🎯 ¡${activeRagDocs.length} documento(s) base transferidos al Módulo de Exámenes!`);
        return;
      }

      onShowToast("No hay ningún documento activo para transferir", true);
      return;
    }
    const currentVer = versions[currentVersionIndex];

    // 1. Prepare base documents for exam creation:
    // (a) Active base documents from Topic Generator
    const activeRagDocs: UploadedDocument[] = effectiveUploadedFiles
      .filter((f) => f.active !== false || (specificFile && f.id === specificFile.id))
      .map((f) => ({
        id: `topic-rag-${f.id}`,
        name: f.name,
        text: f.text,
        size: f.size || new Blob([f.text]).size,
        role: "base" as const,
        active: true,
        timestamp: Date.now(),
      }));

    // (b) Active generated topic document currently displayed
    const generatedTopicText = htmlToCleanTopicText(currentVer.topic, currentVer.html);
    const topicDoc: UploadedDocument = {
      id: `topic-gen-${currentVer.id || Date.now()}`,
      name: `Tema - ${currentVer.topic}.txt`,
      text: generatedTopicText,
      size: new Blob([generatedTopicText]).size,
      role: "base" as const,
      active: true,
      timestamp: Date.now(),
    };

    // (c) Autoevaluación Rápida document with questions and complete solucionario
    const autoevalText = extractAutoevaluacionYSolucionarioText(currentVer.topic, currentVer.html);
    const autoevalDoc: UploadedDocument = {
      id: `autoeval-${currentVer.id || Date.now()}`,
      name: `Autoevaluación Rápida y Solucionario - ${currentVer.topic}.txt`,
      text: autoevalText,
      size: new Blob([autoevalText]).size,
      role: "base" as const,
      active: true,
      timestamp: Date.now(),
    };

    const documentsToSend: UploadedDocument[] = [...activeRagDocs, topicDoc, autoevalDoc];

    // Extract questions cleanly from the local HTML document for the interactive test runner
    const examData = extractActiveRecallExamFromHtml(currentVer.topic, currentVer.html);

    if (onSendExamToApp) {
      onSendExamToApp(examData, documentsToSend);
      const totalDocs = documentsToSend.length;
      onShowToast(
        `🎯 ¡${totalDocs} documento(s) preparados para la creación de tests (documentos base activos, tema generado y autoevaluación rápida con solucionario)!`
      );
    }
  };

  // Import existing HTML Document
  const processHtmlFile = async (file: File) => {
    try {
      let text = await file.text();
      text = text.replace(/<script id="standalone-scripts">[\s\S]*?<\/script>/i, "");
      text = text.replace(/<div id="standalone-export-bar"[\s\S]*?<\/div>/i, "");
      text = text.replace(/<style id="standalone-styles">[\s\S]*?<\/style>/i, "");

      const importedVer: GeneratedTopicVersion = {
        id: Date.now(),
        topic: file.name.replace(/\.[^/.]+$/, ""),
        depth: "recuperado",
        html: injectDocumentStyles(text),
        timestamp: Date.now(),
      };

      setVersions((prev) => {
        const next = [...prev, importedVer];
        setCurrentVersionIndex(next.length - 1);
        return next;
      });
      setPreviewingRagDoc(null);
      onShowToast(`📄 Documento HTML importado: ${file.name}`);
    } catch (err: any) {
      onShowToast(`Error importando HTML: ${err.message}`, true);
    }
  };

  const handleImportHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    await processHtmlFile(file);
    e.target.value = "";
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      setIsCanvasDragOver(true);
    }
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(false);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm") || file.type.includes("html")) {
        await processHtmlFile(file);
      } else {
        // If user dropped another document type, process it into RAG
        processIncomingFiles(e.dataTransfer.files);
      }
    }
  };

  // Export handlers
  const handleExportPdf = () => {
    let htmlContent = "";
    let docTitle = "Temario";

    if (previewingRagDoc) {
      docTitle = previewingRagDoc.name.replace(/\.[^/.]+$/, "");
      const rawBody = docViewStyle === "html"
        ? renderTechnicalA4DocumentHtml(previewingRagDoc.name, previewingRagDoc.text, false)
        : renderMarkdownDeliverableHtml(previewingRagDoc.name, previewingRagDoc.text, false);
      htmlContent = preparePrintableHtmlDocument(rawBody, docTitle);
    } else if (currentVersionIndex >= 0 && versions[currentVersionIndex]) {
      docTitle = topic ? `Temario_${topic.replace(/[^a-z0-9]/gi, "_")}` : `Temario_V${currentVersionIndex + 1}`;
      htmlContent = preparePrintableHtmlDocument(versions[currentVersionIndex].html, docTitle);
    }

    if (!htmlContent) {
      onShowToast("No hay ningún documento activo para imprimir o crear PDF", true);
      return;
    }

    onShowToast("🖨️ Abriendo diálogo de impresión / PDF...");

    try {
      // 1. Direct Portal Injection in the main window (handles top-level and print styles cleanly)
      let portal = document.getElementById("topic-direct-print-portal");
      if (!portal) {
        portal = document.createElement("div");
        portal.id = "topic-direct-print-portal";
        document.body.appendChild(portal);
      }

      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyInner = (bodyMatch ? bodyMatch[1] : htmlContent).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      portal.innerHTML = bodyInner;

      document.documentElement.classList.add("printing-topic-active");
      document.body.classList.add("printing-topic-active");

      const cleanup = () => {
        document.documentElement.classList.remove("printing-topic-active");
        document.body.classList.remove("printing-topic-active");
        if (portal) portal.innerHTML = "";
      };

      window.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(cleanup, 8000);

      // 2. Open dedicated print window with auto-print & manual fallback controls
      let printWin: Window | null = null;
      try {
        printWin = window.open("", "_blank");
      } catch (e) {
        console.warn("window.open failed, fallback to in-page print:", e);
        printWin = null;
      }

      if (printWin) {
        const printEnhancedHtml = htmlContent.replace(
          "</body>",
          `
          <div class="no-print" style="position:fixed; top:12px; right:12px; z-index:999999; display:flex; gap:8px; background:#0f172a; padding:8px 12px; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.3); font-family:sans-serif;">
            <button onclick="window.print()" style="background:#f59e0b; color:#000; border:none; padding:7px 14px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px;">
              🖨️ Imprimir / Guardar PDF
            </button>
            <button onclick="window.close()" style="background:#334155; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-size:12px; cursor:pointer;">
              Cerrar
            </button>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                try { window.print(); } catch(e) { console.error(e); }
              }, 300);
            };
          </` + `script>
          </body>`
        );

        printWin.document.open();
        printWin.document.write(printEnhancedHtml);
        printWin.document.close();
      } else {
        // Fallback to direct window.print() if popups are blocked in the iframe sandbox
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn("Direct window.print restricted:", e);
        }
      }
    } catch (err) {
      console.error("Error launching PDF print:", err);
      window.print();
    }
  };

  const handleExportWord = async () => {
    if (previewingRagDoc) {
      const cleanName = previewingRagDoc.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, "_").toLowerCase() || "documento_base";
      const filename = `${cleanName}.docx`;
      onShowToast(`Exportando documento Word nativo (.docx)...`);
      const htmlToConvert = renderTechnicalA4DocumentHtml(previewingRagDoc.name, previewingRagDoc.text, false);
      const isDocx = await exportHtmlToDocx(htmlToConvert, filename);
      if (isDocx) {
        onShowToast(`📄 ¡Documento Word (.docx) descargado limpiamente!`);
      } else {
        onShowToast(`📄 Documento Word (.doc) descargado`);
      }
      return;
    }
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    const filename = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "temario"}.docx`;
    onShowToast(`Exportando documento Word nativo (.docx)...`);
    const isDocx = await exportHtmlToDocx(versions[currentVersionIndex].html, filename);
    if (isDocx) {
      onShowToast(`📄 ¡Documento Word (.docx) descargado limpiamente!`);
    } else {
      onShowToast(`📄 Documento Word (.doc) descargado`);
    }
  };

  const handleExportHtml = () => {
    if (previewingRagDoc) {
      const cleanName = previewingRagDoc.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, "_").toLowerCase() || "documento_base";
      const standalone = docViewStyle === "markdown"
        ? renderMarkdownDeliverableHtml(previewingRagDoc.name, previewingRagDoc.text, false)
        : renderTechnicalA4DocumentHtml(previewingRagDoc.name, previewingRagDoc.text, false);
      const filename = `${cleanName}.html`;
      downloadBlob(filename, standalone, "text/html;charset=utf-8");
      onShowToast(`HTML autocontenido exportado: ${filename}`);
      return;
    }
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    const standalone = exportStandaloneHtmlDocument(versions[currentVersionIndex].html);
    const filename = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "temario"}.html`;
    downloadBlob(filename, standalone, "text/html;charset=utf-8");
    onShowToast(`HTML autocontenido exportado: ${filename}`);
  };

  const handleExportTxt = () => {
    if (previewingRagDoc) {
      const cleanName = previewingRagDoc.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, "_").toLowerCase() || "documento_base";
      const filename = `${cleanName}.md`;
      downloadBlob(filename, previewingRagDoc.text, "text/markdown;charset=utf-8");
      onShowToast(`Archivo Markdown (.md) descargado: ${filename}`);
      return;
    }
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    const clean = cleanAndRepairTopicHtml(versions[currentVersionIndex].html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, "text/html");
    const textContent = (doc.body.innerText || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const filename = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "temario"}.txt`;
    downloadBlob(filename, textContent, "text/plain;charset=utf-8");
    onShowToast(`TXT exportado: ${filename}`);
  };

  const handleCopyText = async () => {
    if (previewingRagDoc) {
      try {
        await navigator.clipboard.writeText(previewingRagDoc.text);
        setCopiedType("text");
        setTimeout(() => setCopiedType(null), 2000);
        onShowToast("📋 Texto Markdown copiado al portapapeles");
      } catch {
        onShowToast("Error al copiar texto", true);
      }
      return;
    }
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    const clean = cleanAndRepairTopicHtml(versions[currentVersionIndex].html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, "text/html");
    const textContent = (doc.body.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
    try {
      await navigator.clipboard.writeText(textContent);
      setCopiedType("text");
      setTimeout(() => setCopiedType(null), 2000);
      onShowToast("📋 Texto plano copiado al portapapeles");
    } catch {
      onShowToast("Error al copiar texto", true);
    }
  };

  const handleCopyHtml = async () => {
    if (previewingRagDoc) {
      try {
        const fullHtml = docViewStyle === "markdown"
          ? renderMarkdownDeliverableHtml(previewingRagDoc.name, previewingRagDoc.text, false)
          : renderTechnicalA4DocumentHtml(previewingRagDoc.name, previewingRagDoc.text, false);
        await navigator.clipboard.writeText(fullHtml);
        setCopiedType("html");
        setTimeout(() => setCopiedType(null), 2000);
        onShowToast("📋 Código HTML del documento copiado al portapapeles");
      } catch {
        onShowToast("Error al copiar HTML", true);
      }
      return;
    }
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    try {
      await navigator.clipboard.writeText(versions[currentVersionIndex].html);
      setCopiedType("html");
      setTimeout(() => setCopiedType(null), 2000);
      onShowToast("📋 Código HTML copiado al portapapeles");
    } catch {
      onShowToast("Error al copiar HTML", true);
    }
  };

  const handleSaveEditedBaseDoc = () => {
    if (!previewingRagDoc) return;
    const updatedDoc: TopicUploadedFile = {
      ...previewingRagDoc,
      text: editedBaseDocText,
      size: new Blob([editedBaseDocText]).size,
    };
    setPreviewingRagDoc(updatedDoc);
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === updatedDoc.id ? updatedDoc : f))
    );
    setIsEditingBaseDoc(false);
    onShowToast("✅ Documento base actualizado correctamente");
  };

  const handleResetTokens = () => {
    setTokensIn(0);
    setTokensOut(0);
    setTokensTotal(0);
    localStorage.removeItem("experto_tokens_in");
    localStorage.removeItem("experto_tokens_out");
    localStorage.removeItem("experto_tokens_total");
    onShowToast("Contadores de tokens reiniciados");
  };

  const handleClearPreview = () => {
    setCurrentVersionIndex(-1);
    setPreviewingRagDoc(null);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
    onShowToast("Vista limpiada");
  };

  const handleCloseVersion = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const updated = versions.filter((_, i) => i !== idx);
    setVersions(updated);
    if (updated.length === 0) {
      setCurrentVersionIndex(-1);
    } else if (currentVersionIndex === idx) {
      setCurrentVersionIndex(Math.max(0, idx - 1));
    } else if (currentVersionIndex > idx) {
      setCurrentVersionIndex(currentVersionIndex - 1);
    }
  };


  // Slider visual feedback calculation
  const getSliderFeedback = (val: number) => {
    if (val <= 5) {
      return {
        level: "ESTRUCTURA BÁSICA (Pocos epígrafes)",
        desc: "El índice principal se divide únicamente en los bloques más grandes o generales del tema.",
        color: "text-emerald-500",
        border: "border-l-emerald-500",
      };
    } else if (val <= 10) {
      return {
        level: "ESTRUCTURA DETALLADA (Desglose equilibrado)",
        desc: "División estándar del índice. Cubre todos los puntos clave con balance óptimo entre teoría y fórmulas.",
        color: "text-amber-500",
        border: "border-l-amber-500",
      };
    } else {
      return {
        level: "ESTRUCTURA EXHAUSTIVA (Máximo desglose analítico)",
        desc: "Genera un alto número de subapartados analíticos para cubrir cada mínimo detalle, normativa y aplicación.",
        color: "text-red-500",
        border: "border-l-red-500",
      };
    }
  };

  const sliderFeedback = getSliderFeedback(subapartados);
  const activeVersion = currentVersionIndex >= 0 ? versions[currentVersionIndex] : null;

  // Real-time document statistics
  const docStats = React.useMemo(() => {
    if (previewingRagDoc) {
      const text = previewingRagDoc.text || "";
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const lines = text.split("\n").length;
      const recallBoxes = 0;
      const formulas = 0;
      const tables = (text.match(/\|[\s\S]*?\|/g) || []).length;
      const readingTimeMin = Math.max(1, Math.ceil(words / 200));
      return { words, chars, lines, recallBoxes, formulas, tables, readingTimeMin };
    }
    if (!activeVersion?.html) return null;
    const clean = cleanAndRepairTopicHtml(activeVersion.html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, "text/html");
    const text = (doc.body.innerText || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const lines = text.split("\n").length;
    const recallBoxes = (activeVersion.html.match(/class=["']recall-box["']/gi) || []).length;
    const formulas = (activeVersion.html.match(/class=["']formula-box["']/gi) || []).length;
    const tables = (activeVersion.html.match(/<table\b/gi) || []).length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 220));
    return { words, chars, lines, recallBoxes, formulas, tables, readingTimeMin };
  }, [activeVersion, previewingRagDoc]);

  // Extract structured headings for Interactive Table of Contents (Outline)
  const docHeadings = React.useMemo(() => {
    const headings: { id: string; text: string; level: number; index: number }[] = [];

    // 1. If viewing a base document (Markdown, HTML, plain text)
    if (previewingRagDoc) {
      const raw = previewingRagDoc.text || "";
      // If the document has HTML heading tags
      if (/<h[1-6]\b/i.test(raw)) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(raw, "text/html");
          const elements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
          let idx = 0;
          elements.forEach((el) => {
            const level = parseInt(el.tagName.substring(1), 10);
            const text = (el.textContent || "").trim();
            if (text && text.length > 1) {
              headings.push({ id: `doc-heading-${idx}`, text, level, index: idx });
              idx++;
            }
          });
          if (headings.length > 0) return headings;
        } catch (_) {}
      }

      // Markdown / line-by-line heading extraction
      const lines = raw.split("\n");
      let idx = 0;
      lines.forEach((line) => {
        const trimmed = line.trim();
        const mdMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (mdMatch) {
          const level = mdMatch[1].length;
          const cleanText = mdMatch[2].replace(/[*_`]/g, "").trim();
          if (cleanText) {
            headings.push({
              id: `doc-heading-${idx}`,
              text: cleanText,
              level,
              index: idx,
            });
            idx++;
          }
          return;
        }

        // Fallback for numbered section titles like "1. INTRODUCCIÓN", "2. DESARROLLO", "3.1. ..."
        const numMatch = trimmed.match(/^(\d+(?:\.\d+)*\.?)\s+([A-ZÁÉÍÓÚÑ0-9\s,\-\(\)\/]{3,80})$/);
        if (numMatch) {
          const dots = (numMatch[1].match(/\./g) || []).length;
          const level = Math.min(6, Math.max(1, dots + 1));
          headings.push({
            id: `doc-heading-${idx}`,
            text: `${numMatch[1]} ${numMatch[2]}`,
            level,
            index: idx,
          });
          idx++;
        }
      });
      return headings;
    }

    // 2. If viewing a generated topic version
    if (!activeVersion?.html) return [];
    try {
      const clean = cleanAndRepairTopicHtml(activeVersion.html);
      const parser = new DOMParser();
      const doc = parser.parseFromString(clean, "text/html");
      const elements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
      let idx = 0;
      elements.forEach((el) => {
        const level = parseInt(el.tagName.substring(1), 10);
        const text = (el.textContent || "").trim();
        if (text && text.length > 1) {
          headings.push({
            id: `doc-heading-${idx}`,
            text,
            level,
            index: idx,
          });
          idx++;
        }
      });

      if (headings.length === 0) {
        // Fallback to regex in case DOMParser produced a partial body
        const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
        let match;
        while ((match = regex.exec(clean)) !== null) {
          const level = parseInt(match[1], 10);
          const cleanText = match[2].replace(/<[^>]+>/g, "").trim();
          if (cleanText) {
            headings.push({
              id: `doc-heading-${idx}`,
              text: cleanText,
              level,
              index: idx,
            });
            idx++;
          }
        }
      }
    } catch (e) {
      console.warn("Error parsing document headings:", e);
    }
    return headings;
  }, [activeVersion, previewingRagDoc]);

  // Filtered headings for live outline search
  const filteredHeadings = React.useMemo(() => {
    if (!outlineFilter.trim()) return docHeadings;
    const q = outlineFilter.toLowerCase();
    return docHeadings.filter((h) => h.text.toLowerCase().includes(q));
  }, [docHeadings, outlineFilter]);

  const handleScrollToHeading = (headingIndex: number) => {
    if (!iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    const elements = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (elements[headingIndex]) {
      const target = elements[headingIndex] as HTMLElement;
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Visual feedback highlight
      const prevBackground = target.style.backgroundColor;
      const prevTransition = target.style.transition;
      target.style.transition = "background-color 0.35s ease";
      target.style.backgroundColor = "rgba(245, 158, 11, 0.3)";
      setTimeout(() => {
        target.style.backgroundColor = prevBackground;
        setTimeout(() => {
          target.style.transition = prevTransition;
        }, 350);
      }, 1500);
    }
  };

  const handleSearchInDoc = (query: string) => {
    setSearchQuery(query);
    if (!iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    const body = doc.body;
    if (!body) return;

    // Remove previous marks
    const existingMarks = doc.querySelectorAll("mark.search-match");
    existingMarks.forEach((m) => {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(doc.createTextNode(m.textContent || ""), m);
        parent.normalize();
      }
    });

    const trimmed = query.trim();
    if (!trimmed) {
      setSearchMatchesCount(0);
      return;
    }

    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.tagName !== "SCRIPT" && node.parentElement?.tagName !== "STYLE") {
        textNodes.push(node as Text);
      }
    }

    let count = 0;
    const regex = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");

    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      if (regex.test(text)) {
        const frag = doc.createDocumentFragment();
        let lastIndex = 0;
        text.replace(regex, (match, p1, offset) => {
          frag.appendChild(doc.createTextNode(text.substring(lastIndex, offset)));
          const mark = doc.createElement("mark");
          mark.className = "search-match";
          mark.textContent = match;
          frag.appendChild(mark);
          lastIndex = offset + match.length;
          count++;
          return match;
        });
        frag.appendChild(doc.createTextNode(text.substring(lastIndex)));
        textNode.parentNode?.replaceChild(frag, textNode);
      }
    });

    setSearchMatchesCount(count);
    const firstMatch = doc.querySelector("mark.search-match");
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-140px)] w-full rounded-2xl overflow-hidden border border-border-default bg-app text-text-primary shadow-xl">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".pdf,.txt,.html,.htm,.json,.md,.csv,.png,.jpg,.jpeg,.webp"
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={importHtmlInputRef}
        className="hidden"
        accept=".html,.htm"
        onChange={handleImportHtml}
      />

      {/* Mobile Top Navigation Tab Bar (Visible on mobile/tablet screens only) */}
      <div className="lg:hidden flex bg-surface border-b border-border-default p-2 gap-2 z-20">
        <button
          type="button"
          onClick={() => setMobileTab("panel")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex justify-center items-center gap-1.5 transition-all ${
            mobileTab === "panel"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
              : "bg-alt text-text-muted hover:text-text-primary"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Panel de Control</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex justify-center items-center gap-1.5 transition-all ${
            mobileTab === "preview"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
              : "bg-alt text-text-muted hover:text-text-primary"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Visor A4 {versions.length > 0 && `(V${versions.length})`}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR: CONTROLS & GENERATOR ENGINE                                  */}
      {/* ========================================================================= */}
      <aside className={`w-full lg:w-[420px] bg-surface border-r border-border-default flex flex-col shrink-0 shadow-lg z-10 ${
        mobileTab === "preview" ? "hidden lg:flex" : "flex"
      }`}>
        {/* Module Header */}
        <div className="p-5 border-b border-border-default bg-alt/50">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Tribunal IA &middot; Alta Densidad
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              v3.2 PRO
            </span>
          </div>
          <h2 className="text-xl font-bold font-primary tracking-tight text-text-primary flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            Experto IA
          </h2>
          <p className="text-xs text-text-muted font-medium mt-0.5">
            Generador de Temarios y Documentos Técnicos de Máximo Rigor
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 py-3 border-b border-border-subtle bg-surface">
          <div className="flex bg-alt p-1 rounded-xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveSidebarTab("generator")}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1.5 transition-all cursor-pointer ${
                activeSidebarTab === "generator"
                  ? "bg-surface text-amber-600 dark:text-amber-400 shadow-xs border border-border-subtle"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Redactor
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarTab("config")}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1.5 transition-all cursor-pointer ${
                activeSidebarTab === "config"
                  ? "bg-surface text-amber-600 dark:text-amber-400 shadow-xs border border-border-subtle"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Config
            </button>
            <button
              type="button"
              onClick={() => setActiveSidebarTab("prompt")}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1.5 transition-all cursor-pointer ${
                activeSidebarTab === "prompt"
                  ? "bg-surface text-amber-600 dark:text-amber-400 shadow-xs border border-border-subtle"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Prompts
            </button>
          </div>
        </div>

        {/* Sidebar Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: REDACTOR */}
          {activeSidebarTab === "generator" && (
            <>
              {/* Generation Error Alert with Debug Log Downloader */}
              {generationError && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-3.5 rounded-r-xl space-y-2.5 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs text-red-600 dark:text-red-400 font-medium leading-snug">
                      <p className="font-bold text-red-700 dark:text-red-300">Fallo en la generación:</p>
                      <p className="mt-0.5">{generationError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGenerationError(null)}
                      className="text-text-muted hover:text-text-primary p-0.5"
                      title="Cerrar aviso"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-red-500/20">
                    <button
                      type="button"
                      onClick={handleDownloadDebugLog}
                      className="text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Log de Depuración (.json)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Topic Input Box */}
              <section className="bg-amber-500/10 border-2 border-amber-500/40 p-4 rounded-2xl relative shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-bold text-text-primary flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Título o Índice del Tema
                  </label>
                  <span className="text-[9px] font-black bg-amber-500 text-black px-2 py-0.5 rounded shadow-xs">
                    REQUERIDO
                  </span>
                </div>
                <div className="relative group mt-2">
                  <TextCursorInput className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                  <textarea
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && topic.trim() && !isGenerating) {
                        e.preventDefault();
                        handleStartGeneration();
                      }
                    }}
                    placeholder="Ej: TEMA 25. Control Numérico y Robótica Industrial...&#10;(O pega tu índice desglosado con puntos o guiones)"
                    className="w-full bg-surface border-2 border-border-strong rounded-xl py-2.5 pl-10 pr-16 text-xs font-medium leading-relaxed text-text-primary outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y min-h-[75px]"
                  />
                  {topic && (
                    <button
                      type="button"
                      onClick={() => setTopic("")}
                      className="absolute top-2.5 right-2.5 text-[10px] bg-alt hover:bg-red-500 hover:text-white text-text-muted px-2 py-1 rounded-md border border-border-default transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Borrar texto"
                    >
                      <Trash2 className="w-3 h-3" /> Borrar
                    </button>
                  )}
                </div>
                

                <p className="text-[10px] text-text-muted mt-2 leading-relaxed">
                  Pulsa <kbd className="font-mono bg-alt px-1 py-0.5 rounded border border-border-default text-[9px]">Ctrl+Enter</kbd> para ejecutar la redacción.
                </p>
              </section>

              {/* RAG Base Documentation */}
              <section className="bg-alt/70 p-4 rounded-2xl border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-text-secondary flex items-center gap-1.5">
                    <FileType2 className="w-4 h-4 text-amber-500" />
                    Documentación Base (RAG)
                  </label>
                  <div className="flex bg-surface p-1 rounded-lg border border-border-default shadow-xs">
                    <button
                      type="button"
                      onClick={() => setBaseMode("files")}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        baseMode === "files"
                          ? "bg-alt text-text-primary shadow-xs border border-border-default"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      ARCHIVOS
                    </button>
                    <button
                      type="button"
                      onClick={() => setBaseMode("text")}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        baseMode === "text"
                          ? "bg-alt text-text-primary shadow-xs border border-border-default"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      PEGAR TEXTO
                    </button>
                  </div>
                </div>

                {baseMode === "files" ? (
                  <>
                    <div
                      onDragOver={handleRagDragOver}
                      onDragLeave={handleRagDragLeave}
                      onDrop={!isProcessingRag ? handleRagDrop : undefined}
                      onClick={() => !isProcessingRag && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                        isRagDragOver
                          ? "border-amber-500 bg-amber-500/15 scale-[1.01] shadow-md shadow-amber-500/20"
                          : isProcessingRag
                          ? "border-amber-500/60 bg-amber-500/10 cursor-wait"
                          : "border-border-strong bg-surface hover:border-amber-500 hover:bg-hover active:scale-[0.99]"
                      }`}
                    >
                      {isProcessingRag ? (
                        <div className="flex flex-col items-center justify-center py-2 space-y-2 text-center animate-pulse">
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Procesando documento...
                            </p>
                            <p className="text-[11px] text-text-muted max-w-[260px] mx-auto leading-relaxed">
                              {processingRagStatus || "Analizando contenido y capturas con Gemini Multimodal..."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CloudUpload className="w-5 h-5 text-amber-500 group-hover:-translate-y-0.5 transition-transform" />
                          </div>
                          <p className="text-xs font-bold text-text-primary pointer-events-none">
                            {isRagDragOver
                              ? "¡Suelta los archivos aquí!"
                              : uploadedFiles.length > 0
                              ? "Añadir más apuntes, PDFs o imágenes..."
                              : "Arrastra PDFs (Digitales o Capturas), Imágenes o TXT"}
                          </p>
                          <p className="text-[10px] text-text-muted pointer-events-none">
                            Reconocimiento multimodal con Gemini para PDFs escaneados y capturas
                          </p>
                          <div className="flex flex-wrap justify-center gap-1 mt-0.5 pointer-events-none">
                            {["PDF", "TXT", "HTML", "JSON", "MD", "PNG", "JPG"].map((ext) => (
                              <span
                                key={ext}
                                className="text-[9px] font-mono font-bold bg-alt border border-border-subtle px-1.5 py-0.5 rounded text-text-secondary"
                              >
                                .{ext}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline mt-0.5 pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            o selecciona desde tu equipo
                          </button>
                        </>
                      )}
                    </div>

                    {/* Processing active banner */}
                    {isProcessingRag && (
                      <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-200 text-xs shadow-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                        <div className="flex-1 truncate">
                          <span className="font-semibold">Reconocimiento RAG en curso: </span>
                          <span className="text-text-muted text-[11px]">{processingRagStatus || "Gemini Document Understanding activo..."}</span>
                        </div>
                      </div>
                    )}

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-bold text-text-primary">
                            Listos para analizar ({uploadedFiles.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles([])}
                            className="text-[11px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Limpiar
                          </button>
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {uploadedFiles.map((f) => {
                            const isActive = f.active !== false;
                            const isSelected = previewingRagDoc?.id === f.id;
                            return (
                              <div
                                key={f.id}
                                onClick={() => {
                                  setPreviewingRagDoc(f);
                                  setCurrentVersionIndex(-1);
                                }}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border cursor-pointer select-none group text-xs transition-all ${
                                  isSelected
                                    ? "bg-[#16120b] border-2 border-amber-500 shadow-md shadow-amber-500/10"
                                    : !isActive
                                    ? "bg-surface/50 border-border-default opacity-60"
                                    : "bg-surface/90 border-border-default hover:border-amber-500/50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate pr-2 min-w-0 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setUploadedFiles((prev) =>
                                        prev.map((item) =>
                                          item.id === f.id
                                            ? { ...item, active: item.active === false ? true : false }
                                            : item
                                        )
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-amber-500 bg-surface border-border-default focus:ring-amber-500/30 cursor-pointer shrink-0 accent-amber-500"
                                    title={
                                      isActive
                                        ? "Habilitado en la redacción del tema (clic para desactivar)"
                                        : "Deshabilitado en la redacción (clic para activar)"
                                    }
                                  />
                                  <FileCheck
                                    className={`w-4 h-4 shrink-0 ${
                                      isActive ? "text-emerald-500" : "text-text-muted"
                                    }`}
                                  />
                                  <span
                                    className={`truncate font-semibold text-xs ${
                                      isActive ? "text-text-primary" : "text-text-muted line-through"
                                    }`}
                                    title={f.name}
                                  >
                                    {f.name}
                                  </span>
                                  {!isActive && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-alt text-text-muted border border-border-default shrink-0">
                                      DESACTIVADO
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewingRagDoc(f);
                                      setDocViewStyle("markdown");
                                      setCurrentVersionIndex(-1);
                                    }}
                                    className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                      isSelected && docViewStyle === "markdown"
                                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                        : "bg-blue-950/70 text-blue-400 hover:bg-blue-600 hover:text-white border-blue-800/40"
                                    }`}
                                    title="Ver entregable en formato Markdown (.md)"
                                  >
                                    MD
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewingRagDoc(f);
                                      setDocViewStyle("html");
                                      setCurrentVersionIndex(-1);
                                    }}
                                    className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                      isSelected && docViewStyle === "html"
                                        ? "bg-amber-500 text-black border-amber-500 shadow-xs"
                                        : "bg-amber-950/70 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-800/40"
                                    }`}
                                    title="Ver documento maquetado A4 HTML"
                                  >
                                    HTML
                                  </button>
                                  {onSendExamToApp && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConvertActiveRecallToExam(f);
                                      }}
                                      className="text-text-muted hover:text-amber-500 p-1 rounded transition-colors hover:bg-amber-500/10 cursor-pointer"
                                      title="Copiar / Enviar (crear test con documentos base, tema activo y autoevaluación con solucionario)"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadedFiles((prev) => prev.filter((item) => item.id !== f.id));
                                      if (previewingRagDoc?.id === f.id) setPreviewingRagDoc(null);
                                    }}
                                    className="text-text-muted hover:text-red-500 p-1 rounded transition-colors hover:bg-red-500/10 cursor-pointer"
                                    title="Eliminar archivo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={pastedContext}
                      onChange={(e) => setPastedContext(e.target.value)}
                      placeholder="Pega aquí el contenido, directrices curriculares o normativas base para la redacción..."
                      className="w-full bg-surface border border-border-default rounded-xl p-3 text-xs text-text-primary font-mono outline-none focus:border-amber-500 resize-none shadow-xs"
                    />
                    {pastedContext && (
                      <button
                        type="button"
                        onClick={() => setPastedContext("")}
                        className="absolute bottom-2.5 right-2.5 text-[10px] bg-alt hover:bg-red-500 hover:text-white text-text-muted px-2 py-1 rounded-md border border-border-default flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Limpiar
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Generation Mode Selector: Modular vs Directo */}
              <section className="bg-gradient-to-br from-amber-500/10 via-alt/70 to-alt/90 p-4 rounded-2xl border-2 border-amber-500/30 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-black text-text-primary flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    Modo de Generación
                  </label>
                  <span className="text-[9px] font-black bg-amber-500 text-black px-2 py-0.5 rounded shadow-xs">
                    {generationMode === "modular" ? "MAX. EXHAUSTIVIDAD" : "1-SHOT"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenerationMode("modular")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      generationMode === "modular"
                        ? "bg-surface border-2 border-amber-500 shadow-md shadow-amber-500/10 text-text-primary"
                        : "bg-surface/60 border-border-default hover:border-amber-500/40 text-text-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Sparkles className="w-3.5 h-3.5" /> Modular (Recomendado)
                      </span>
                      {generationMode === "modular" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[10px] text-text-secondary leading-snug">
                      Genera por epígrafes independientes. Evita recortes y logra <strong>+8.000 palabras</strong> sin pérdida de densidad.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenerationMode("rapido")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      generationMode === "rapido"
                        ? "bg-surface border-2 border-amber-500 shadow-md shadow-amber-500/10 text-text-primary"
                        : "bg-surface/60 border-border-default hover:border-amber-500/40 text-text-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-400" /> Directo (1-Paso)
                      </span>
                      {generationMode === "rapido" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[10px] text-text-secondary leading-snug">
                      Generación en un solo flujo SSE. Rápido, adecuado para esquemas o temas cortos.
                    </p>
                  </button>
                </div>
              </section>

              {/* Density Level & Subtopics Slider */}
              <section className="bg-alt/70 p-4 rounded-2xl border border-border-subtle space-y-4">
                {/* Density Segmented Control */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs uppercase font-bold text-text-secondary flex items-center gap-1.5">
                      <AlignJustify className="w-4 h-4 text-amber-500" />
                      Densidad Técnica por Apartado
                    </label>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider ${
                        currentDepth === "resumen"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : currentDepth === "estandar"
                          ? "bg-yellow-500/15 text-yellow-500"
                          : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {currentDepth === "resumen"
                        ? "MODO SÍNTESIS"
                        : currentDepth === "estandar"
                        ? "DESARROLLO MEDIO"
                        : "ALTA DENSIDAD"}
                    </span>
                  </div>

                  <div className="flex items-center bg-surface border border-border-default rounded-xl overflow-hidden text-xs font-medium text-text-secondary">
                    <button
                      type="button"
                      onClick={() => setCurrentDepth("resumen")}
                      className={`flex-1 py-2 px-2 border-r border-border-default flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        currentDepth === "resumen"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "hover:bg-hover"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Resumen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentDepth("estandar")}
                      className={`flex-1 py-2 px-2 border-r border-border-default flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        currentDepth === "estandar"
                          ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-bold"
                          : "hover:bg-hover"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span>Estándar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentDepth("catedratico")}
                      className={`flex-1 py-2 px-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        currentDepth === "catedratico"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400 font-bold"
                          : "hover:bg-hover"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>Experto</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                    {currentDepth === "resumen" &&
                      "Viñetas fluidas y conceptos clave con ejemplos y analogías para repaso rápido."}
                    {currentDepth === "estandar" &&
                      "Párrafos fluidos y claros con explicaciones equilibradas y casos cotidianos."}
                    {currentDepth === "catedratico" &&
                      "Máximo rigor técnico, fórmulas cuantificadas y normativas en redacción densa."}
                  </p>
                </div>

                {/* Subtopics Slider with Auto Prediction */}
                <div className="border-t border-border-subtle pt-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase font-bold text-text-secondary flex items-center gap-1.5">
                      <ListTree className="w-4 h-4 text-amber-500" />
                      Amplitud del Índice
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoSuggestDepth}
                        disabled={isPredictingDepth}
                        className={`text-[9px] uppercase tracking-wider px-2 py-1 rounded-md transition-all flex items-center gap-1 font-bold cursor-pointer ${
                          isAutoDepth
                            ? "bg-amber-500 text-black shadow-xs"
                            : "bg-surface border border-border-default text-text-muted hover:text-amber-500"
                        }`}
                        title="Calcular número óptimo de subapartados con IA"
                      >
                        <Wand2 className="w-3 h-3" />
                        {isPredictingDepth ? "Calculando..." : "Auto IA"}
                      </button>
                      <input
                        type="number"
                        min={2}
                        max={15}
                        value={subapartados}
                        onChange={(e) => {
                          setIsAutoDepth(false);
                          setSubapartados(Math.max(2, Math.min(15, parseInt(e.target.value) || 2)));
                        }}
                        className="w-12 bg-surface border border-border-strong rounded-lg text-center text-xs font-bold text-text-primary p-1 outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-text-muted">Subapartados</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={2}
                    max={15}
                    value={subapartados}
                    onChange={(e) => {
                      setIsAutoDepth(false);
                      setSubapartados(parseInt(e.target.value));
                    }}
                    className="w-full h-1.5 bg-border-strong rounded-lg cursor-pointer accent-amber-500 mb-2"
                  />

                  {/* Feedback Card */}
                  <div className={`p-2.5 rounded-xl border border-border-default bg-surface shadow-xs border-l-4 ${sliderFeedback.border}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sliderFeedback.color}`}>
                      {sliderFeedback.level}
                    </span>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{sliderFeedback.desc}</p>
                  </div>
                </div>
              </section>

              {/* Audit and Focus Pills */}
              <section className="space-y-2.5">
                <label className="text-xs uppercase font-bold text-text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Auditoría y Enfoque Pedagógico
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleOption("glossary")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOptions.glossary
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/20"
                        : "bg-surface border-border-default text-text-muted opacity-60"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Test-Wiseness (Glosario)
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOption("cot")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOptions.cot
                        ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm shadow-purple-500/20"
                        : "bg-surface border-border-default text-text-muted opacity-60"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    CoT Anticolisión
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOption("pedagogic")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOptions.pedagogic
                        ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/20"
                        : "bg-surface border-border-default text-text-muted opacity-60"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Práctica Intercalada
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOption("recall")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOptions.recall
                        ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/20"
                        : "bg-surface border-border-default text-text-muted opacity-60"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Active Recall (Tests)
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOption("mnemotecnias")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOptions.mnemotecnias
                        ? "bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 shadow-sm shadow-orange-500/20"
                        : "bg-surface border-border-default text-text-muted opacity-60"
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Mnemotecnias (Trucos)
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOption("antitunel")}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeOptions.antitunel
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm shadow-cyan-500/20"
                        : "bg-surface border-border-default text-text-muted opacity-60"
                    }`}
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                    Anti-Visión de Túnel
                  </button>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: CONFIG */}
          {activeSidebarTab === "config" && (
            <div className="space-y-4 text-xs">
              <div className="bg-alt/70 p-4 rounded-2xl border border-border-default space-y-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-500" /> Proveedor y Modelo LLM
                </h3>
                <div className="p-3 bg-surface rounded-xl border border-border-subtle flex items-center justify-between">
                  <span className="text-text-secondary font-semibold">Proveedor Actual:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {activeProviderConfig?.subtitle || "Google Gemini"}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border-subtle flex items-center justify-between">
                  <span className="text-text-secondary font-semibold">Modelo de Generación:</span>
                  <span className="font-mono font-bold text-text-primary">
                    {activeProviderConfig?.selectedModel || "gemini-3.7-flash"}
                  </span>
                </div>
                {onOpenAIModal && (
                  <button
                    type="button"
                    onClick={onOpenAIModal}
                    className="w-full py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:text-black text-amber-600 dark:text-amber-400 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Cambiar Clave o Modelo en Ajustes
                  </button>
                )}
              </div>

              {/* Token Metrics Box */}
              <div className="bg-alt/70 p-4 rounded-2xl border border-border-default space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary">Uso Histórico de Tokens</h3>
                  <button
                    type="button"
                    onClick={handleResetTokens}
                    className="text-[10px] font-bold text-text-muted hover:text-red-500 flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border-default transition-all cursor-pointer"
                    title="Reiniciar contadores de tokens"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reiniciar
                  </button>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border-subtle font-mono text-[11px] space-y-1.5 text-amber-600 dark:text-amber-400">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Prompt In:</span>
                    <span className="font-bold">{tokensIn.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Candidates Out:</span>
                    <span className="font-bold">{tokensOut.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-1 text-text-primary">
                    <span className="font-bold">Total Acumulado:</span>
                    <span className="font-black">{tokensTotal.toLocaleString()} tokens</span>
                  </div>
                </div>
              </div>

              {/* Debug & Diagnostic Trace Box */}
              <div className="bg-alt/70 p-4 rounded-2xl border border-border-default space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-amber-500" />
                    Diagnóstico y Logs
                  </h3>
                  {lastDebugLog && (
                    <span className="text-[10px] font-mono text-text-muted">
                      {new Date(lastDebugLog.fecha).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Descarga la traza completa (prompt, hiperparámetros, respuesta en bruto y tokens) para depuración técnica o soporte.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadDebugLog}
                  disabled={!lastDebugLog}
                  className="w-full py-2.5 bg-surface hover:bg-hover border border-border-default text-text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lastDebugLog ? "Descargar Log de Depuración (.json)" : "Sin logs en esta sesión"}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROMPTS */}
          {activeSidebarTab === "prompt" && (
            <div className="flex flex-col h-full space-y-2 text-xs">
              <label className="text-xs uppercase font-bold text-text-secondary">
                Núcleo del Prompt Interno Resultante
              </label>
              <p className="text-[11px] text-text-muted">
                Previsualización de las directrices y restricciones enviadas al modelo.
              </p>
              <textarea
                readOnly
                value={dynamicPromptText}
                className="w-full h-80 bg-alt border border-border-strong rounded-xl p-3 text-[11px] font-mono text-text-primary outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Generate Button (Sticky Bottom) */}
        <div className="p-5 border-t border-border-subtle bg-surface">
          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={isGenerating || !topic.trim()}
            className="w-full uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/25 flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{isGenerating ? "EJECUTANDO GENERACIÓN..." : "EJECUTAR GENERACIÓN"}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* RIGHT MAIN PANEL: A4 PREVIEW PANE, VERSIONS TABS & EXPORT SUITE            */}
      {/* ========================================================================= */}
      <main className={`flex-1 flex flex-col bg-alt relative overflow-hidden h-full ${
        mobileTab === "panel" ? "hidden lg:flex" : "flex"
      } ${isFullscreen ? "fixed inset-0 z-50 bg-app" : ""}`}>
        {/* Tier 1, 2 & 3: Topic Header & Action Suite (Matching ExamHeader structure) */}
        <div className="border-b border-border-default bg-surface/95 backdrop-blur-md p-4 sm:p-5 space-y-3.5 no-print shrink-0">
          {/* Main Top Row: Icon + Title + Meta & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-2xl shadow-xs shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider font-mono">
                    {previewingRagDoc ? "DOC BASE TÉCNICA" : "TEMARIO DE OPOSICIÓN"}
                  </span>
                  {activeVersion && (
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">
                      V{currentVersionIndex + 1} de {versions.length}
                    </span>
                  )}
                  {docStats && (
                    <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-amber-400" />
                      ~{docStats.readingTimeMin} min lectura
                    </span>
                  )}
                </div>
                <h1
                  className="text-base sm:text-lg font-bold text-text-primary font-primary truncate"
                  title={previewingRagDoc ? previewingRagDoc.name : topic || "Temario Técnico"}
                >
                  {previewingRagDoc
                    ? previewingRagDoc.name
                    : topic
                    ? `Temario: ${topic}`
                    : "Temario Técnico Activo"}
                </h1>
              </div>
            </div>

            {/* Primary Action Suite (Matching Exam Module Header) */}
            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
              {/* Synergistic Transfer / Send to Exams CTA */}
              {onTransferDocumentToExams && previewingRagDoc && (
                <button
                  type="button"
                  onClick={() => onTransferDocumentToExams(previewingRagDoc)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Transferir este documento al módulo de Exámenes para generar preguntas tipo test"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Transferir a Exámenes</span>
                </button>
              )}

              {onSendExamToApp && (activeVersion || previewingRagDoc) && !previewingRagDoc && (
                <button
                  type="button"
                  onClick={() => handleConvertActiveRecallToExam(undefined)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Crear examen oficial con las preguntas de autoevaluación y solucionario"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Active Recall &rarr; Examen</span>
                </button>
              )}

              {/* Export Group */}
              <button
                type="button"
                onClick={handleExportWord}
                disabled={!activeVersion && !previewingRagDoc}
                className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Exportar documento en formato Microsoft Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">.Word</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!activeVersion && !previewingRagDoc}
                className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Imprimir o exportar en PDF limpio A4"
              >
                <Printer className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportHtml}
                disabled={!activeVersion && !previewingRagDoc}
                className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Descargar archivo HTML autónomo maquetado"
              >
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">.HTML</span>
              </button>

              <button
                type="button"
                onClick={handleExportTxt}
                disabled={!activeVersion && !previewingRagDoc}
                className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Descargar entregable en Markdown estructurado (.md)"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">.MD</span>
              </button>

              {(activeVersion || previewingRagDoc) && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar texto / Markdown al portapapeles"
                >
                  {copiedType === "text" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden lg:inline">{copiedType === "text" ? "Copiado" : "Copiar"}</span>
                </button>
              )}

              {/* Focus / Fullscreen Mode */}
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isFullscreen
                    ? "bg-amber-500 text-black border-amber-400 shadow-xs font-bold"
                    : "bg-alt hover:bg-hover border-border-default text-text-primary"
                }`}
                title={isFullscreen ? "Restaurar vista estándar" : "Ocultar panel lateral para modo enfoque"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">{isFullscreen ? "Restaurar" : "Enfoque"}</span>
              </button>

              {/* Close View */}
              <button
                type="button"
                onClick={handleClearPreview}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-alt border border-transparent hover:border-border-default transition-colors cursor-pointer"
                title="Cerrar vista previa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-header: Quality Badges & AI Audit trace */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border-subtle/60 text-[11px] text-text-muted">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                <Shield className="w-3 h-3" /> Maquetación A4
              </span>
              <span className="font-mono bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                🎯 Autoevaluación Rápida
              </span>
              {uploadedFiles.length > 0 && (
                <span className="font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1 shadow-xs">
                  <FileText className="w-3 h-3" /> RAG Asistido ({uploadedFiles.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {lastDebugLog && (
                <button
                  type="button"
                  onClick={handleDownloadDebugLog}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1 cursor-pointer"
                  title="Descargar traza de auditoría IA y depuración"
                >
                  <Bot className="w-3 h-3" />
                  <span>Auditoría IA</span>
                </button>
              )}
              <span className="font-mono text-text-muted text-[11px]">
                {activeProviderConfig?.selectedModel || "gemini-3.7-flash"}
              </span>
              {tokensTotal > 0 && (
                <span className="font-mono text-text-muted text-[11px]">
                  &middot; {tokensTotal.toLocaleString()} tokens
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tier 4 & 5: Format Navigation Tabs & Interactive Controls Toolbar (Matching Exam UI) */}
        <div className="p-4 sm:p-5 pb-3 border-b border-border-default bg-alt/30 space-y-3 shrink-0 no-print">
          {/* Format Tabs (like FormatTabs.tsx) */}
          <div className="flex overflow-x-auto pb-2 gap-2 border-b border-border-default no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setDocViewStyle("html");
                setIsEditingBaseDoc(false);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                docViewStyle === "html" && !isEditingBaseDoc
                  ? "bg-surface border border-border-strong text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent"
              }`}
            >
              <FileType2 className="w-3.5 h-3.5 text-amber-500" />
              <span>General (Maquetado A4)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocViewStyle("markdown");
                setIsEditingBaseDoc(false);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                docViewStyle === "markdown" && !isEditingBaseDoc
                  ? "bg-surface border border-border-strong text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-500" />
              <span>Estilo .MD (Lectura)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocViewStyle("code_html");
                setIsEditingBaseDoc(false);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                docViewStyle === "code_html" && !isEditingBaseDoc
                  ? "bg-surface border border-border-strong text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent"
              }`}
            >
              <Code className="w-3.5 h-3.5 text-emerald-500" />
              <span>Código HTML</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocViewStyle("code_md");
                setIsEditingBaseDoc(false);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                docViewStyle === "code_md" && !isEditingBaseDoc
                  ? "bg-surface border border-border-strong text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>Código .MD</span>
            </button>

            {/* Outline / TOC Tab Button */}
            {(activeVersion || previewingRagDoc) && (
              <button
                type="button"
                onClick={() => setIsOutlineOpen((prev) => !prev)}
                className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isOutlineOpen
                    ? "bg-amber-500 text-black border border-amber-400 font-extrabold shadow-sm"
                    : "text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent"
                }`}
                title="Abrir o cerrar el índice de contenidos lateral"
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Índice{docHeadings.length > 0 ? ` (${docHeadings.length})` : ""}</span>
              </button>
            )}

            {/* Edit Base Doc Tab (When viewing RAG document) */}
            {previewingRagDoc && (
              <button
                type="button"
                onClick={() => setIsEditingBaseDoc((prev) => !prev)}
                className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isEditingBaseDoc
                    ? "bg-amber-500 text-black font-extrabold shadow-sm"
                    : "text-text-muted hover:text-amber-500 hover:bg-surface/50 border border-transparent"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingBaseDoc ? "Ver Documento" : "Editar Doc Base"}</span>
              </button>
            )}
          </div>

          {/* Interactive Toolbar (like InteractiveToolbar.tsx) */}
          <div className="bg-app/80 p-3 rounded-2xl border border-border-subtle shadow-inner w-full space-y-2.5">
            {/* Row 1: Document Metrics & Stats (like Question Filters) */}
            {docStats && (
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border-subtle/60 text-xs">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mr-1">
                  Métricas:
                </span>

                <span className="px-2.5 py-1 rounded-lg font-bold bg-amber-500 text-black shadow-xs flex items-center gap-1">
                  <span>{docStats.words.toLocaleString()} palabras</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg font-bold bg-surface text-text-secondary border border-border-subtle flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>~{docStats.readingTimeMin} min lectura</span>
                </span>

                {docStats.recallBoxes > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-surface text-red-400 border border-red-500/30 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-red-400" />
                    <span>{docStats.recallBoxes} Active Recall</span>
                  </span>
                )}

                {docStats.tables > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-surface text-slate-300 border border-border-subtle flex items-center gap-1">
                    <span>{docStats.tables} tablas técnicas</span>
                  </span>
                )}

                {docStats.formulas > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-surface text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <span>{docStats.formulas} fórmulas</span>
                  </span>
                )}
              </div>
            )}

            {/* Row 2: Interactive Controls (Search, Theme, Tables, Zoom, Import) */}
            <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* In-Document Search */}
                {(activeVersion || previewingRagDoc) && !isEditingBaseDoc && (
                  <div className="relative flex items-center">
                    <div className="flex items-center bg-surface border border-border-default rounded-lg px-2.5 py-1.5 gap-1.5 focus-within:border-amber-500 transition-all shadow-xs">
                      <Search className="w-3.5 h-3.5 text-text-muted" />
                      <input
                        type="text"
                        placeholder="Buscar en tema..."
                        value={searchQuery}
                        onChange={(e) => handleSearchInDoc(e.target.value)}
                        className="bg-transparent text-xs text-text-primary outline-none w-32 sm:w-44 placeholder:text-text-muted"
                      />
                      {searchQuery && (
                        <>
                          <span className="text-[10px] font-mono px-1 bg-alt rounded text-amber-500 font-bold">
                            {searchMatchesCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSearchInDoc("")}
                            className="text-text-muted hover:text-text-primary"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Theme Switcher */}
                <button
                  type="button"
                  onClick={() => setDocTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border-default bg-surface hover:bg-hover text-text-primary flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {docTheme === "dark" ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>{docTheme === "dark" ? "Doc Claro" : "Doc Oscuro"}</span>
                </button>

                {/* Hide / Show Tables */}
                <button
                  type="button"
                  onClick={() => setHideTablesInDoc((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    hideTablesInDoc
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      : "bg-surface border-border-default text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {hideTablesInDoc ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{hideTablesInDoc ? "Tablas Ocultas" : "Tablas"}</span>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default shadow-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
                    className="p-1 text-text-muted hover:text-text-primary rounded transition-all"
                    title="Alejar zoom"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1 text-text-secondary min-w-[34px] text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
                    className="p-1 text-text-muted hover:text-text-primary rounded transition-all"
                    title="Acercar zoom"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {zoomLevel !== 100 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(100)}
                      className="text-[9px] font-bold px-1 text-amber-500 hover:underline"
                      title="Restablecer a 100%"
                    >
                      100%
                    </button>
                  )}
                </div>
              </div>

              {/* Import HTML Button */}
              <button
                type="button"
                onClick={() => importHtmlInputRef.current?.click()}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500 hover:text-black px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Importar un documento HTML generado previamente"
              >
                <Import className="w-3.5 h-3.5" />
                <span>Importar HTML</span>
              </button>
            </div>
          </div>
        </div>

        {/* Version Tabs Bar with Drag & Drop Reordering */}
        {versions.length > 0 && (
          <div className="bg-alt border-b border-border-default px-6 pt-2 flex items-end gap-2 overflow-x-auto shrink-0 min-h-[40px]">
            {versions.map((ver, idx) => {
              const isActive = idx === currentVersionIndex;
              const isDragging = draggedVersionIdx === idx;
              return (
                <div
                  key={ver.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedVersionIdx(idx);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", `${idx}`);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedVersionIdx !== null && draggedVersionIdx !== idx) {
                      const activeId = currentVersionIndex >= 0 ? versions[currentVersionIndex]?.id : null;
                      const reordered = [...versions];
                      const [moved] = reordered.splice(draggedVersionIdx, 1);
                      reordered.splice(idx, 0, moved);
                      setVersions(reordered);
                      if (activeId !== null) {
                        const newActiveIdx = reordered.findIndex((v) => v.id === activeId);
                        setCurrentVersionIndex(newActiveIdx >= 0 ? newActiveIdx : idx);
                      }
                      setDraggedVersionIdx(null);
                      onShowToast("📑 Versiones reordenadas");
                    }
                  }}
                  onDragEnd={() => setDraggedVersionIdx(null)}
                  onClick={() => {
                    setCurrentVersionIndex(idx);
                    setPreviewingRagDoc(null);
                  }}
                  className={`group flex items-center gap-2 px-3.5 py-1.5 border border-border-default border-b-0 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-grab active:cursor-grabbing select-none ${
                    isDragging ? "opacity-40 scale-95 border-dashed border-amber-500 bg-amber-500/10" : ""
                  } ${
                    isActive
                      ? "bg-surface text-text-primary border-b-2 border-b-amber-500 shadow-xs -mb-[1px]"
                      : "bg-alt/70 text-text-muted hover:bg-surface hover:text-text-primary"
                  }`}
                  title={`Arrastra para reordenar o haz clic para visualizar V${idx + 1}`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-text-muted group-hover:text-amber-500 transition-colors" />
                  <span className="truncate max-w-[140px]">
                    V{idx + 1}: {ver.depth.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCloseVersion(e, idx)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500 hover:text-white transition-all ml-0.5"
                    title="Cerrar versión"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Central A4 Canvas Display with Interactive Outline Sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Collapsible Outline Sidebar */}
          {isOutlineOpen && (activeVersion || previewingRagDoc) && (
            <aside className="w-72 md:w-80 bg-surface/95 backdrop-blur-md border-r border-border-default flex flex-col z-20 shrink-0 shadow-lg animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-border-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Índice de Contenidos ({docHeadings.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOutlineOpen(false)}
                  className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-alt transition-all"
                  title="Cerrar índice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {docHeadings.length > 4 && (
                <div className="p-2 border-b border-border-subtle">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
                    <input
                      type="text"
                      value={outlineFilter}
                      onChange={(e) => setOutlineFilter(e.target.value)}
                      placeholder="Filtrar apartados..."
                      className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-alt border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
                {filteredHeadings.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-xs">
                    <p className="font-semibold mb-1">Sin apartados detectados</p>
                    <p className="text-[11px]">
                      {docHeadings.length === 0
                        ? "El documento no presenta encabezados detectables (h1, h2, h3 o numeración)."
                        : "Ningún apartado coincide con el filtro de búsqueda."}
                    </p>
                  </div>
                ) : (
                  filteredHeadings.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => handleScrollToHeading(h.index)}
                      className={`w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-start gap-1.5 cursor-pointer hover:bg-alt ${
                        h.level === 1
                          ? "font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/5 mt-1.5"
                          : h.level === 2
                          ? "font-semibold text-text-primary pl-3.5"
                          : h.level === 3
                          ? "font-medium text-text-secondary pl-6 text-[11.5px]"
                          : "font-normal text-text-muted pl-8 text-[11px]"
                      }`}
                    >
                      <span className="font-mono text-[9px] uppercase px-1 rounded bg-surface border border-border-subtle shrink-0 mt-0.5">
                        H{h.level}
                      </span>
                      <span className="line-clamp-2">{h.text}</span>
                    </button>
                  ))
                )}
              </div>
            </aside>
          )}

          {/* Canvas Scroll Area */}
          <div
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
            className="flex-1 p-4 md:p-8 flex justify-center overflow-auto items-start relative pb-20"
          >
            {/* Canvas Drag & Drop Overlay */}
            {isCanvasDragOver && (
              <div className="absolute inset-4 z-40 bg-amber-500/15 border-2 border-dashed border-amber-500 rounded-2xl flex flex-col items-center justify-center backdrop-blur-xs transition-all pointer-events-none">
                <div className="p-4 rounded-full bg-surface text-amber-500 shadow-xl mb-3 animate-bounce">
                  <Import className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-text-primary">Suelta el archivo aquí</h4>
                <p className="text-xs text-text-muted mt-1">
                  Se importará como una versión en el visor (.html) o como base documental
                </p>
              </div>
            )}

            {/* Empty State */}
            {!activeVersion && !previewingRagDoc && !isGenerating && (
              <div className="my-auto flex flex-col items-center justify-center p-8 max-w-md text-center">
                <div className="p-4 rounded-2xl bg-surface border border-border-default shadow-lg text-amber-500 mb-4">
                  <BookOpen className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Ningún Documento Abierto</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-6">
                  Configura los parámetros del tema a la izquierda y pulsa <b>Ejecutar Generación</b> o arrastra y suelta aquí un documento HTML.
                </p>
                <button
                  type="button"
                  onClick={() => importHtmlInputRef.current?.click()}
                  className="px-4 py-2.5 bg-surface border border-border-default hover:border-amber-500 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Import className="w-4 h-4 text-amber-500" />
                  <span>Importar archivo .HTML</span>
                </button>
              </div>
            )}

            {/* Render State: Base Document In-Place Editor */}
            {previewingRagDoc && isEditingBaseDoc && (
              <div className="w-full max-w-4xl bg-surface border border-border-default rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-3">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-xs md:text-sm text-text-primary">
                        Editando Documento Base: {previewingRagDoc.name}
                      </h4>
                      <p className="text-[11px] text-text-muted">
                        Puedes modificar, corregir OCR o añadir fórmulas y tablas en Markdown.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEditedBaseDoc}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBaseDoc(false)}
                      className="px-3 py-1.5 bg-alt hover:bg-surface border border-border-default text-text-secondary hover:text-text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      <span>Cerrar Editor</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={editedBaseDocText}
                  onChange={(e) => setEditedBaseDocText(e.target.value)}
                  className="w-full min-h-[600px] bg-alt/80 border border-border-default rounded-xl p-4 font-mono text-xs text-text-primary outline-none focus:border-amber-500 resize-y leading-relaxed"
                  placeholder="Escribe o edita el contenido del documento en formato Markdown..."
                />
              </div>
            )}

            {/* Render State: A4 Frame */}
            <div
              style={{
                transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className={`w-full max-w-[210mm] min-h-[297mm] shadow-2xl rounded-sm border border-border-strong bg-surface overflow-hidden ${
                (!activeVersion && !previewingRagDoc) || isEditingBaseDoc ? "hidden" : "block"
              }`}
            >
              <iframe
                ref={iframeRef}
                title="A4 Document Preview"
                className="w-full min-h-[1200px] border-none inset-0 p-0 m-0"
                sandbox="allow-same-origin allow-scripts allow-downloads allow-modals"
              />
            </div>
          </div>
        </div>
      </main>

      {/* High-Visibility Full-View Generation Overlay (Fixed in viewport, guaranteed always visible) */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#14151d] text-white border-2 border-amber-500 shadow-2xl p-6 sm:p-8 rounded-2xl max-w-lg w-full text-center relative space-y-5 animate-in zoom-in-95 duration-150">
            {/* Animated Pulse & Spinner */}
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/25">
                <Wand2 className="w-8 h-8 animate-pulse text-amber-400" />
              </div>
            </div>

            {/* Title & Status - High visibility and contrast */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[11px] font-black text-amber-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Generando con IA en tiempo real
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight font-primary">
                Construyendo Documento Técnico...
              </h3>
              <div className="bg-[#1c1f2b] border border-amber-500/30 p-4 rounded-xl text-left shadow-inner">
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed flex items-start gap-2.5 font-medium">
                  <span className="text-amber-400 font-bold shrink-0 mt-0.5 animate-pulse">▶</span>
                  <span>{loadingStatus}</span>
                </p>
              </div>
            </div>

            {/* Live Model & Depth Indicator */}
            <div className="flex items-center justify-between text-xs text-gray-400 px-2 pt-1 border-t border-gray-800">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Motor: {activeProviderConfig?.selectedModel || "gemini-3.7-flash"}</span>
              </span>
              <span className="font-mono text-amber-400 font-bold uppercase">{currentDepth}</span>
            </div>

            {/* Modular Generation Progress Bar */}
            {generationMode === "modular" && modularProgress.total > 0 && (
              <div className="p-3 bg-[#181b24] border border-amber-500/30 rounded-xl text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Progreso Modular:
                  </span>
                  <span className="font-mono font-bold text-white">
                    {modularProgress.current} / {modularProgress.total} etapas
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((modularProgress.current / modularProgress.total) * 100))}%`,
                    }}
                  />
                </div>
                {modularProgress.sectionName && (
                  <p className="text-[11px] text-gray-300 truncate font-mono">
                    {modularProgress.sectionName}
                  </p>
                )}
              </div>
            )}

            {/* Action Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="px-5 py-2.5 bg-red-500/15 text-red-400 border border-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-black shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Cancelar Generación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border-2 border-amber-500 shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                Confirmar Generación de Temario
              </h3>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-secondary">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Tema:</span>
                <span className="text-text-muted truncate max-w-[220px] font-mono">{topic}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Documentos base (RAG):</span>
                <span className="text-text-muted">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} archivo(s)`
                    : pastedContext
                    ? "Texto Pegado"
                    : "Conocimiento Experto Autónomo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Nivel de Densidad:</span>
                <span className="font-bold text-amber-500 uppercase">{currentDepth}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Subapartados desglosados:</span>
                <span className="font-bold font-mono bg-alt px-2 py-0.5 rounded border border-border-default">
                  {subapartados}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Motor de IA:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {activeProviderConfig?.selectedModel || "gemini-3.7-flash"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-default">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-text-secondary bg-surface border border-border-default rounded-xl hover:bg-hover cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAndExecute}
                className="px-5 py-2 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Confirmar y Redactar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modular Planner & Blueprint Modal */}
      <ModularPlannerModal
        isOpen={isModularPlannerOpen}
        topicTitle={topic}
        depth={currentDepth}
        blueprint={modularBlueprint}
        isLoadingOutline={isLoadingBlueprint}
        onClose={() => setIsModularPlannerOpen(false)}
        onUpdateBlueprint={(updated) => setModularBlueprint(updated)}
        onConfirmStartModular={handleExecuteModularGeneration}
        onRegenerateOutline={handleFetchModularBlueprint}
      />
    </div>
  );
};
