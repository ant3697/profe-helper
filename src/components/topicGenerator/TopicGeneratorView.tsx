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
} from "lucide-react";

import {
  TopicDepth,
  TopicAuditOptions,
  TopicUploadedFile,
  GeneratedTopicVersion,
} from "../../types/thematicDoc";
import { AIProviderConfig } from "../../types/aiProviders";
import { ExamData } from "../../types/exam";
import { extractTextFromPDF } from "../../utils/pdfExtractor";
import {
  buildDynamicTopicPrompt,
  injectDocumentStyles,
  exportStandaloneHtmlDocument,
  extractActiveRecallExamFromHtml,
  cleanAndRepairTopicHtml,
} from "../../utils/topicPromptGenerator";
import { downloadBlob } from "../../utils/fileHelpers";


interface TopicGeneratorViewProps {
  activeProviderConfig?: AIProviderConfig;
  onShowToast: (msg: string, isError?: boolean) => void;
  onSendExamToApp?: (examData: ExamData) => void;
  onOpenAIModal?: () => void;
}

export const TopicGeneratorView: React.FC<TopicGeneratorViewProps> = ({
  activeProviderConfig,
  onShowToast,
  onSendExamToApp,
  onOpenAIModal,
}) => {
  // Tabs: 'generator' | 'config' | 'prompt'
  const [activeSidebarTab, setActiveSidebarTab] = useState<"generator" | "config" | "prompt">("generator");
  const [mobileTab, setMobileTab] = useState<"panel" | "preview">("panel");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Inputs
  const [topic, setTopic] = useState("");
  const [baseMode, setBaseMode] = useState<"files" | "text">("files");
  const [uploadedFiles, setUploadedFiles] = useState<TopicUploadedFile[]>([]);
  const [pastedContext, setPastedContext] = useState("");

  // Density & Subtopics
  const [currentDepth, setCurrentDepth] = useState<TopicDepth>("catedratico");
  const [subapartados, setSubapartados] = useState<number>(5);
  const [isAutoDepth, setIsAutoDepth] = useState<boolean>(true);

  // Audit Options
  const [activeOptions, setActiveOptions] = useState<TopicAuditOptions>({
    glossary: true,
    cot: true,
    pedagogic: true,
    recall: true,
    mnemotecnias: true,
    antitunel: true,
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

  // Document Versions
  const [versions, setVersions] = useState<GeneratedTopicVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(-1);
  const [draggedVersionIdx, setDraggedVersionIdx] = useState<number | null>(null);

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPredictingDepth, setIsPredictingDepth] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analizando contexto, estructurando índices y redactando apartados...");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [hideTablesInDoc, setHideTablesInDoc] = useState(false);
  const [docTheme, setDocTheme] = useState<"light" | "dark">("dark");
  const [previewingRagDoc, setPreviewingRagDoc] = useState<TopicUploadedFile | null>(null);
  
  // UX & Exploration states
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchesCount, setSearchMatchesCount] = useState(0);
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

  // Sync iframe document when version or docTheme changes
  useEffect(() => {
    if (currentVersionIndex >= 0 && versions[currentVersionIndex]) {
      const currentVer = versions[currentVersionIndex];
      let html = injectDocumentStyles(currentVer.html);
      if (docTheme === "dark" && !html.includes("dark-theme")) {
        html = html.replace("<body", '<body class="dark-theme"');
      } else if (docTheme === "light") {
        html = html.replace(/dark-theme/g, "");
      }
      if (hideTablesInDoc) {
        html = html.replace("<html", '<html class="hide-tables"');
      }

      if (iframeRef.current) {
        iframeRef.current.srcdoc = html;
      }
    } else if (previewingRagDoc) {
      const isDark = docTheme === "dark";
      const textContent = previewingRagDoc.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const previewHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { background-color: ${isDark ? "#0b0e14" : "#f1f5f9"}; margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: ${isDark ? "#e2e8f0" : "#0f172a"}; }
            .page { max-width: 210mm; margin: 0 auto; background: ${isDark ? "#151821" : "#ffffff"}; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); border-radius: 8px; border: 1px solid ${isDark ? "#334155" : "#e2e8f0"}; }
            .badge { display: inline-block; background: #f59e0b; color: #000; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; }
            h1 { font-size: 18px; margin-top: 0; border-bottom: 1px solid ${isDark ? "#334155" : "#e2e8f0"}; padding-bottom: 10px; color: ${isDark ? "#fbbf24" : "#003366"}; }
            pre { font-family: 'Courier New', Courier, monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.7; color: ${isDark ? "#94a3b8" : "#334155"}; }
          </style>
        </head>
        <body>
          <div class="page">
            <span class="badge">VISTA PREVIA DOCUMENTACIÓN BASE (RAG)</span>
            <h1>${previewingRagDoc.name}</h1>
            <pre>${textContent}</pre>
          </div>
        </body>
        </html>
      `;
      if (iframeRef.current) {
        iframeRef.current.srcdoc = previewHtml;
      }
    }
  }, [currentVersionIndex, versions, docTheme, hideTablesInDoc, previewingRagDoc]);

  // Aggregate files text
  const aggregatedFilesText = uploadedFiles.map((f) => f.text).join("\n\n---\n\n");

  // Dynamic Prompt preview text
  const dynamicPromptText = buildDynamicTopicPrompt(
    topic,
    currentDepth,
    subapartados,
    activeOptions,
    aggregatedFilesText,
    pastedContext
  );

  // Handle file uploads (PDF, TXT, HTML, JSON, MD, CSV)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    onShowToast(`Procesando ${files.length} archivo(s)...`);

    const newDocs: TopicUploadedFile[] = [];

    for (const file of files) {
      if (uploadedFiles.some((f) => f.name === file.name)) continue;

      let extracted = "";
      const lower = file.name.toLowerCase();

      try {
        if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
          extracted = await extractTextFromPDF(file, (msg) => onShowToast(msg));
        } else {
          extracted = await file.text();
        }

        if (extracted.trim()) {
          newDocs.push({
            id: `rag-file-${Date.now()}-${Math.random()}`,
            name: file.name,
            text: extracted,
            size: file.size,
          });
        }
      } catch (err: any) {
        console.error("Error reading file:", err);
        onShowToast(`Error al leer ${file.name}: ${err.message}`, true);
      }
    }

    if (newDocs.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newDocs]);
      onShowToast(`${newDocs.length} archivo(s) añadido(s) a la base documental`);
    }
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

  // Start Generation Flow
  const handleStartGeneration = () => {
    if (!topic.trim()) {
      onShowToast("Por favor, introduce el título o índice del tema a desarrollar", true);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Execute Generation via SSE Stream or API
  const handleConfirmAndExecute = async () => {
    setIsConfirmModalOpen(false);
    setIsGenerating(true);
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
        onShowToast(`Error: ${error.message || "Fallo en la generación"}`, true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  // Convert Active Recall questions to Exam format and send to main app
  const handleConvertActiveRecallToExam = () => {
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) {
      onShowToast("No hay ningún documento activo para extraer preguntas", true);
      return;
    }
    const currentVer = versions[currentVersionIndex];
    const examData = extractActiveRecallExamFromHtml(currentVer.topic, currentVer.html);

    if (!examData || examData.bloques[0]?.preguntas.length === 0) {
      onShowToast("No se encontraron preguntas Active Recall en este documento", true);
      return;
    }

    if (onSendExamToApp) {
      onSendExamToApp(examData);
      onShowToast(`🎯 ¡${examData.bloques[0].preguntas.length} preguntas de Active Recall cargadas en el Evaluador y Plantilla OMR!`);
    }
  };

  // Import existing HTML Document
  const handleImportHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
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

      setVersions((prev) => [...prev, importedVer]);
      setCurrentVersionIndex(versions.length);
      onShowToast(`Documento importado: ${file.name}`);
    } catch (err: any) {
      onShowToast(`Error importando HTML: ${err.message}`, true);
    }
    e.target.value = "";
  };

  // Export handlers
  const handleExportPdf = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (e) {
        console.warn("Direct iframe print restricted, using fallback:", e);
      }
    }
    if (currentVersionIndex >= 0 && versions[currentVersionIndex]) {
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(exportStandaloneHtmlDocument(versions[currentVersionIndex].html));
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 300);
      } else {
        window.print();
      }
    }
  };

  const handleExportWord = () => {
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    const clean = cleanAndRepairTopicHtml(versions[currentVersionIndex].html.replace(/dark-theme/g, ""));
    const filename = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "temario"}.doc`;
    const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${topic || "Temario"}</title>
<style>
body { font-family: "Georgia", "Times New Roman", serif; font-size: 11pt; line-height: 1.5; color: #111; }
h1 { font-family: "Arial", sans-serif; font-size: 18pt; color: #003366; border-bottom: 2pt solid #003366; padding-bottom: 4pt; }
h2 { font-family: "Arial", sans-serif; font-size: 13pt; color: #003366; background: #f1f5f9; border-left: 4pt solid #b71c1c; padding: 4pt 8pt; margin-top: 18pt; }
h3 { font-family: "Arial", sans-serif; font-size: 11pt; color: #b71c1c; margin-top: 14pt; }
table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 9.5pt; }
th { background-color: #003366; color: #ffffff; padding: 6pt; border: 1pt solid #003366; }
td { border: 1pt solid #cbd5e1; padding: 5pt; }
.formula-box, .recall-box, .apuntes-box, .mnemo-box { border-left: 4pt solid #3b82f6; background: #f8fafc; padding: 8pt; margin: 10pt 0; }
</style>
</head>
<body>${clean}</body>
</html>`;
    const blob = new Blob(["\ufeff", fullHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast(`Descargando documento Word: ${filename}`);
  };

  const handleExportHtml = () => {
    if (currentVersionIndex < 0 || !versions[currentVersionIndex]) return;
    const standalone = exportStandaloneHtmlDocument(versions[currentVersionIndex].html);
    const filename = `${topic.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "temario"}.html`;
    downloadBlob(filename, standalone, "text/html;charset=utf-8");
    onShowToast(`HTML autocontenido exportado: ${filename}`);
  };

  const handleExportTxt = () => {
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
    if (!activeVersion?.html) return null;
    const clean = cleanAndRepairTopicHtml(activeVersion.html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, "text/html");
    const text = (doc.body.innerText || "").trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const recallBoxes = (activeVersion.html.match(/class=["']recall-box["']/gi) || []).length;
    const formulas = (activeVersion.html.match(/class=["']formula-box["']/gi) || []).length;
    const tables = (activeVersion.html.match(/<table\b/gi) || []).length;
    const readingTimeMin = Math.max(1, Math.ceil(words / 220));
    return { words, chars, recallBoxes, formulas, tables, readingTimeMin };
  }, [activeVersion]);

  // Extract structured headings for Interactive Table of Contents (Outline)
  const docHeadings = React.useMemo(() => {
    if (!activeVersion?.html) return [];
    const clean = cleanAndRepairTopicHtml(activeVersion.html);
    const headings: { id: string; text: string; level: number; index: number }[] = [];
    const regex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;
    let idx = 0;
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
    return headings;
  }, [activeVersion]);

  const handleScrollToHeading = (headingIndex: number) => {
    if (!iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    const elements = doc.querySelectorAll("h1, h2, h3");
    if (elements[headingIndex]) {
      elements[headingIndex].scrollIntoView({ behavior: "smooth", block: "start" });
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
        accept=".pdf,.txt,.html,.htm,.json,.md,.csv"
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
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border-strong rounded-xl p-4 text-center cursor-pointer bg-surface hover:border-amber-500 hover:bg-hover transition-all flex flex-col items-center justify-center gap-2 group active:scale-[0.99]"
                    >
                      <CloudUpload className="w-7 h-7 text-amber-500 group-hover:-translate-y-0.5 transition-transform" />
                      <p className="text-xs font-bold text-text-primary">
                        {uploadedFiles.length > 0 ? "Añadir más apuntes o normativas..." : "Sube Temario o Normativas"}
                      </p>
                      <div className="flex flex-wrap justify-center gap-1">
                        {["PDF", "TXT", "HTML", "JSON", "MD", "CSV"].map((ext) => (
                          <span
                            key={ext}
                            className="text-[9px] font-mono font-bold bg-alt border border-border-subtle px-1.5 py-0.5 rounded text-text-secondary"
                          >
                            .{ext}
                          </span>
                        ))}
                      </div>
                    </div>

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
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {uploadedFiles.map((f) => (
                            <div
                              key={f.id}
                              onClick={() => {
                                setPreviewingRagDoc(f);
                                setCurrentVersionIndex(-1);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border-default hover:border-amber-500/50 cursor-pointer group text-xs"
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="truncate font-medium text-text-primary">{f.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadedFiles((prev) => prev.filter((item) => item.id !== f.id));
                                  if (previewingRagDoc?.id === f.id) setPreviewingRagDoc(null);
                                }}
                                className="text-text-muted hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
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
        {/* Top Control Bar */}
        <div className="h-14 bg-surface/90 backdrop-blur-md border-b border-border-default flex items-center px-4 md:px-6 z-10 shadow-xs shrink-0 overflow-x-auto">
          <div className="flex flex-1 items-center justify-between gap-3 min-w-max">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearPreview}
                className="text-xs font-bold text-text-secondary bg-surface px-2.5 py-1.5 rounded-lg border border-border-default shadow-xs hover:border-red-500 hover:text-red-500 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Limpiar vista previa"
              >
                <MonitorX className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>

              <button
                type="button"
                onClick={() => importHtmlInputRef.current?.click()}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/40 px-2.5 py-1.5 rounded-lg shadow-xs hover:bg-amber-500 hover:text-black transition-all flex items-center gap-1.5 cursor-pointer"
                title="Importar un documento HTML generado previamente"
              >
                <Import className="w-3.5 h-3.5" />
                <span>Importar HTML</span>
              </button>

              {/* Outline / TOC Toggle */}
              {activeVersion && docHeadings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsOutlineOpen((prev) => !prev)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isOutlineOpen
                      ? "bg-amber-500 text-black border-amber-500 font-extrabold shadow-sm"
                      : "bg-surface text-text-secondary border-border-default hover:text-text-primary"
                  }`}
                  title="Abrir índice interactivo de apartados"
                >
                  <ListTree className="w-3.5 h-3.5" />
                  <span>Índice ({docHeadings.length})</span>
                </button>
              )}

              {/* In-Document Search Bar */}
              {activeVersion && (
                <div className="relative flex items-center">
                  <div className="flex items-center bg-alt border border-border-default rounded-lg px-2 py-1 gap-1.5 focus-within:border-amber-500 transition-all">
                    <Search className="w-3 h-3 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Buscar en tema..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInDoc(e.target.value)}
                      className="bg-transparent text-xs text-text-primary outline-none w-28 md:w-36 placeholder:text-text-muted"
                    />
                    {searchQuery && (
                      <>
                        <span className="text-[10px] font-mono px-1 bg-surface rounded text-amber-600 dark:text-amber-400 font-bold">
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

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-alt p-1 rounded-lg border border-border-default">
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

            {/* Export and Cross-Module Tools */}
            <div className="flex items-center gap-2 border-l border-border-default pl-3">
              {/* Synergistic Active Recall -> Exam Button */}
              {onSendExamToApp && activeVersion && (
                <button
                  type="button"
                  onClick={handleConvertActiveRecallToExam}
                  className="text-xs font-extrabold text-black bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 px-3 py-1.5 rounded-lg shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Extraer las preguntas del bloque Active Recall y cargarlas en el Evaluador de Tests y Plantilla OMR"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crear Test / OMR</span>
                </button>
              )}

              {/* Copy Buttons */}
              {activeVersion && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-xs font-bold text-text-secondary bg-surface hover:text-text-primary px-2.5 py-1.5 rounded-lg shadow-xs border border-border-default transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copiar texto plano al portapapeles"
                  >
                    {copiedType === "text" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "text" ? "¡Copiado!" : "Copiar Texto"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="text-xs font-bold text-text-secondary bg-surface hover:text-text-primary px-2.5 py-1.5 rounded-lg shadow-xs border border-border-default transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Copiar código HTML al portapapeles"
                  >
                    {copiedType === "html" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5" />}
                    <span>{copiedType === "html" ? "¡HTML Copiado!" : "Copiar HTML"}</span>
                  </button>
                </>
              )}

              {/* Document Light/Dark Mode Switcher */}
              <button
                type="button"
                onClick={() => setDocTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                className="text-xs font-bold text-text-primary bg-surface px-2.5 py-1.5 rounded-lg shadow-xs border border-border-default hover:bg-hover transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {docTheme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{docTheme === "dark" ? "Doc Claro" : "Doc Oscuro"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!activeVersion}
                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                disabled={!activeVersion}
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Word
              </button>

              <button
                type="button"
                onClick={handleExportHtml}
                disabled={!activeVersion}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" /> HTML
              </button>

              <button
                type="button"
                onClick={handleExportTxt}
                disabled={!activeVersion}
                className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-2.5 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" /> TXT
              </button>

              <button
                type="button"
                onClick={() => setHideTablesInDoc((prev) => !prev)}
                className="text-xs font-bold text-white bg-slate-600 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {hideTablesInDoc ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Tablas</span>
              </button>

              {/* Fullscreen Preview Switcher */}
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="text-xs font-bold text-text-secondary bg-surface hover:text-text-primary px-2.5 py-1.5 rounded-lg shadow-xs border border-border-default transition-all flex items-center gap-1.5 cursor-pointer"
                title={isFullscreen ? "Salir de pantalla completa" : "Lectura a pantalla completa"}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Document Metrics Bar */}
        {docStats && (
          <div className="bg-surface border-b border-border-default px-6 py-2 flex flex-wrap items-center gap-4 text-[11px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary">{docStats.words.toLocaleString()}</span>
              <span className="text-text-muted">palabras</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary">{docStats.chars.toLocaleString()}</span>
              <span className="text-text-muted">caracteres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-amber-600 dark:text-amber-400">~{docStats.readingTimeMin} min</span>
              <span className="text-text-muted">lectura técnica</span>
            </div>
            {docStats.recallBoxes > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/20">
                <HelpCircle className="w-3 h-3" />
                <span>{docStats.recallBoxes} bloques Active Recall</span>
              </div>
            )}
            {docStats.formulas > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20">
                <span>{docStats.formulas} bloques de fórmulas</span>
              </div>
            )}
            {docStats.tables > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-500/20">
                <span>{docStats.tables} tablas técnicas</span>
              </div>
            )}
          </div>
        )}

        {/* Version Tabs Bar */}
        {versions.length > 0 && (
          <div className="bg-alt border-b border-border-default px-6 pt-2 flex items-end gap-2 overflow-x-auto shrink-0 min-h-[40px]">
            {versions.map((ver, idx) => {
              const isActive = idx === currentVersionIndex;
              return (
                <div
                  key={ver.id}
                  draggable
                  onDragStart={() => setDraggedVersionIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedVersionIdx !== null && draggedVersionIdx !== idx) {
                      const reordered = [...versions];
                      const [moved] = reordered.splice(draggedVersionIdx, 1);
                      reordered.splice(idx, 0, moved);
                      setVersions(reordered);
                      setCurrentVersionIndex(idx);
                      setDraggedVersionIdx(null);
                    }
                  }}
                  onClick={() => {
                    setCurrentVersionIndex(idx);
                    setPreviewingRagDoc(null);
                  }}
                  className={`group flex items-center gap-2 px-3.5 py-1.5 border border-border-default border-b-0 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? "bg-surface text-text-primary border-b-2 border-b-amber-500 shadow-xs -mb-[1px]"
                      : "bg-alt/70 text-text-muted hover:bg-surface"
                  }`}
                >
                  <GripVertical className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100" />
                  <span className="truncate max-w-[140px]">
                    V{idx + 1}: {ver.depth.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCloseVersion(e, idx)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500 hover:text-white"
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
          {isOutlineOpen && activeVersion && docHeadings.length > 0 && (
            <aside className="w-72 bg-surface/95 backdrop-blur-md border-r border-border-default flex flex-col z-20 shrink-0 shadow-lg animate-in slide-in-from-left duration-200">
              <div className="p-3 border-b border-border-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                    Índice del Tema ({docHeadings.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOutlineOpen(false)}
                  className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-alt transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
                {docHeadings.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleScrollToHeading(h.index)}
                    className={`w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-start gap-1.5 cursor-pointer hover:bg-alt ${
                      h.level === 1
                        ? "font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/5 mt-2"
                        : h.level === 2
                        ? "font-semibold text-text-primary pl-4"
                        : "font-normal text-text-muted pl-7 text-[11px]"
                    }`}
                  >
                    <span className="font-mono text-[9px] uppercase px-1 rounded bg-surface border border-border-subtle shrink-0 mt-0.5">
                      H{h.level}
                    </span>
                    <span className="line-clamp-2">{h.text}</span>
                  </button>
                ))}
              </div>
            </aside>
          )}

          {/* Canvas Scroll Area */}
          <div className="flex-1 p-4 md:p-8 flex justify-center overflow-auto items-start relative pb-20">
            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-app/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-amber-500 mb-2">Construyendo Documento Técnico...</h3>
                <p className="text-xs text-text-muted max-w-md leading-relaxed mb-6">{loadingStatus}</p>
                <button
                  type="button"
                  onClick={handleCancelGeneration}
                  className="px-5 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar Generación
                </button>
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
                  Configura los parámetros del tema a la izquierda y pulsa <b>Ejecutar Generación</b> o importa un documento HTML.
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

            {/* Render State: A4 Frame */}
            <div
              style={{
                transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className={`w-full max-w-[210mm] min-h-[297mm] shadow-2xl rounded-sm border border-border-strong bg-surface overflow-hidden ${
                !activeVersion && !previewingRagDoc ? "hidden" : "block"
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
    </div>
  );
};
