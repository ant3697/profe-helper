import React, { useState, useMemo, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Search,
  Copy,
  Download,
  Printer,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  FileText,
  Clock,
  Layers,
  Edit3,
  Save,
  FileCode,
  Zap,
  MousePointerClick,
} from "lucide-react";
import { UploadedDocument } from "../types/exam";

interface DocumentViewerPanelProps {
  document: UploadedDocument;
  onClose: () => void;
  onUpdateDocumentText?: (id: string, newText: string) => void;
  onRequestGenerateExam?: (doc: UploadedDocument) => void;
  onGenerateFromFragment?: (fragmentText: string, numQuestions: number) => void;
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const DocumentViewerPanel: React.FC<DocumentViewerPanelProps> = ({
  document,
  onClose,
  onUpdateDocumentText,
  onRequestGenerateExam,
  onGenerateFromFragment,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(document.text);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"markdown" | "plain">("markdown");

  // Selected Fragment State
  const [selectedText, setSelectedText] = useState("");
  const [fragmentQuestionCount, setFragmentQuestionCount] = useState(5);
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Sync editedText when document changes
  useEffect(() => {
    setEditedText(document.text);
    setIsEditing(false);
    setSearchQuery("");
    setSelectedText("");
    setSelectionPosition(null);
  }, [document.id, document.text]);

  // Detect user text selection in the document
  const handleMouseUp = () => {
    if (isEditing) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length >= 15) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect) {
        setSelectionPosition({
          x: Math.min(window.innerWidth - 320, Math.max(20, rect.left + rect.width / 2 - 140)),
          y: Math.max(10, rect.top - 54),
        });
      }
    } else {
      // Don't immediately close if clicking inside the popover
    }
  };

  // Document statistics
  const stats = useMemo(() => {
    const text = isEditing ? editedText : document.text;
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text.split("\n").length;
    const estReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    return {
      charCount,
      wordCount,
      lineCount,
      estReadingTimeMinutes,
    };
  }, [document.text, editedText, isEditing]);

  // Search matches
  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const text = document.text;
    const results: { start: number; end: number }[] = [];
    let pos = 0;
    while ((pos = text.toLowerCase().indexOf(query, pos)) !== -1) {
      results.push({ start: pos, end: pos + query.length });
      pos += query.length;
    }
    return results;
  }, [document.text, searchQuery]);

  const totalMatches = matches.length;

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIdx((prev) => (prev + 1) % totalMatches);
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIdx((prev) => (prev - 1 + totalMatches) % totalMatches);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(document.text);
      setCopied(true);
      onShowToast("Contenido copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast("Error al copiar texto", true);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([document.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.name.endsWith(".txt") ? document.name : `${document.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Archivo ${document.name} descargado`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdit = () => {
    if (onUpdateDocumentText) {
      onUpdateDocumentText(document.id, editedText);
      setIsEditing(false);
      onShowToast("Documento actualizado correctamente");
    }
  };

  const handleTriggerFragmentGeneration = () => {
    if (!selectedText.trim()) {
      onShowToast("Selecciona primero un texto o artículo en el documento", true);
      return;
    }
    if (onGenerateFromFragment) {
      onGenerateFromFragment(selectedText, fragmentQuestionCount);
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  // Render text with highlight if searching
  const renderHighlightedContent = () => {
    if (!searchQuery.trim()) {
      return (
        <pre className="font-sans text-sm leading-relaxed text-text-primary whitespace-pre-wrap select-text break-words">
          {document.text}
        </pre>
      );
    }

    const query = searchQuery;
    const parts = document.text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));

    return (
      <pre className="font-sans text-sm leading-relaxed text-text-primary whitespace-pre-wrap select-text break-words">
        {parts.map((part, i) => {
          const isMatch = part.toLowerCase() === query.toLowerCase();
          return isMatch ? (
            <mark
              key={i}
              className="bg-amber-400 text-black px-0.5 rounded-xs font-semibold"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </pre>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-surface relative" ref={contentContainerRef}>
      {/* Floating Action Popover for Selected Text / Article Fragment */}
      {selectedText && selectionPosition && !isEditing && (
        <div
          style={{
            position: "fixed",
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            zIndex: 60,
          }}
          className="bg-slate-900 border-2 border-amber-500 text-white rounded-2xl shadow-2xl p-2.5 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          <div className="flex items-center gap-1.5 pl-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold text-amber-300">
              Generar de selección:
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            {[3, 5, 10].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setFragmentQuestionCount(count)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                  fragmentQuestionCount === count
                    ? "bg-amber-500 text-black"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {count}p
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleTriggerFragmentGeneration}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>Generar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedText("");
              setSelectionPosition(null);
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            title="Cerrar selección"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border-default p-4 sm:p-5 space-y-3 bg-surface/90">
        {/* Top title and meta */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                  Temario / Base Documental
                </span>
                <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  ~{stats.estReadingTimeMinutes} min lectura
                </span>
              </div>
              <h1
                className="text-base sm:text-lg font-bold text-text-primary font-primary truncate"
                title={document.name}
              >
                {document.name}
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {/* View Mode Toggle (Markdown vs Plain) */}
            {!isEditing && (
              <div className="flex items-center bg-alt border border-border-default rounded-xl p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("markdown")}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === "markdown"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  title="Formato enriquecido con títulos, tablas y artículos"
                >
                  <FileText className="w-3 h-3" />
                  <span>Enriquecido</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("plain")}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === "plain"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  title="Vista de texto sin formato"
                >
                  <FileCode className="w-3 h-3" />
                  <span>Texto</span>
                </button>
              </div>
            )}

            {onRequestGenerateExam && (
              <button
                type="button"
                onClick={() => onRequestGenerateExam(document)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                title="Configurar generación de examen completo con este temario"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Examen</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar texto al portapapeles"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Descargar documento"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-alt hover:bg-hover border border-border-default text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {onUpdateDocumentText && (
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isEditing
                    ? "bg-emerald-500 text-black border-emerald-400 font-bold"
                    : "bg-alt hover:bg-hover border-border-default text-text-primary"
                }`}
                title={isEditing ? "Guardar cambios" : "Editar texto del documento"}
              >
                {isEditing ? (
                  <Save className="w-3.5 h-3.5" />
                ) : (
                  <Edit3 className="w-3.5 h-3.5" />
                )}
                <span>{isEditing ? "Guardar" : "Editar"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-alt border border-transparent hover:border-border-default transition-colors cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          {/* Metadata badges & Selection helper notice */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
            <span className="flex items-center gap-1 bg-alt/60 px-2 py-0.5 rounded border border-border-subtle font-mono text-[11px]">
              <FileText className="w-3 h-3 text-blue-400" />
              {stats.wordCount.toLocaleString()} palabras
            </span>
            <span className="flex items-center gap-1 bg-alt/60 px-2 py-0.5 rounded border border-border-subtle font-mono text-[11px]">
              <Layers className="w-3 h-3 text-amber-400" />
              {stats.charCount.toLocaleString()} caracteres
            </span>
            <span className="flex items-center gap-1 bg-alt/60 px-2 py-0.5 rounded border border-border-subtle font-mono text-[11px]">
              {stats.lineCount} líneas
            </span>

            <span className="hidden lg:flex items-center gap-1 text-[11px] text-amber-400/90 font-medium pl-1">
              <MousePointerClick className="w-3 h-3" />
              Selecciona texto para generar preguntas de ese fragmento
            </span>
          </div>

          {/* Quick in-document search */}
          {!isEditing && (
            <div className="flex items-center gap-1.5 bg-alt border border-border-default rounded-lg px-2.5 py-1 focus-within:border-amber-500 transition-colors">
              <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el documento..."
                className="bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted/60 w-36 sm:w-52"
              />
              {searchQuery && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-text-muted pl-1 border-l border-border-subtle">
                  <span>
                    {totalMatches > 0
                      ? `${currentMatchIdx + 1}/${totalMatches}`
                      : "0"}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    className="p-0.5 hover:text-text-primary rounded cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMatch}
                    className="p-0.5 hover:text-text-primary rounded cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 hover:text-red-400 rounded cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="p-4 sm:p-6 flex-1 overflow-y-auto bg-alt/10"
        onMouseUp={handleMouseUp}
      >
        {isEditing ? (
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex justify-between items-center text-xs text-amber-500 font-semibold">
              <span>
                Modo edición activo. Realiza los cambios necesarios y pulsa
                "Guardar".
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditedText(document.text);
                  setIsEditing(false);
                }}
                className="text-text-muted hover:text-text-primary underline cursor-pointer"
              >
                Cancelar edición
              </button>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="flex-1 w-full p-4 bg-alt/50 border border-border-default rounded-xl font-mono text-sm text-text-primary outline-none focus:border-amber-500 transition-colors resize-none min-h-[400px]"
            />
          </div>
        ) : (
          <div className="bg-surface border border-border-default rounded-2xl p-6 sm:p-8 shadow-xs max-w-none">
            {viewMode === "markdown" && !searchQuery.trim() ? (
              <div className="prose prose-invert max-w-none text-text-primary space-y-4 text-sm leading-relaxed select-text font-sans">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl sm:text-2xl font-black text-amber-400 border-b border-border-default pb-2 mt-6 mb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg sm:text-xl font-bold text-amber-300/90 border-b border-border-subtle pb-1 mt-5 mb-3">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold text-blue-400 mt-4 mb-2">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-bold text-text-primary mt-3 mb-1">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="my-2.5 text-text-primary/95 leading-relaxed text-sm">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1.5 my-3 pl-2 text-text-secondary">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1.5 my-3 pl-2 text-text-secondary">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-amber-500 bg-amber-500/10 p-3.5 rounded-r-xl my-4 text-amber-200/90 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-alt px-1.5 py-0.5 rounded font-mono text-xs text-amber-400 border border-border-subtle">
                        {children}
                      </code>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 border border-border-default rounded-xl">
                        <table className="w-full text-left text-xs border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="bg-alt p-2.5 font-bold border-b border-border-default text-text-primary">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="p-2.5 border-b border-border-subtle text-text-secondary">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {document.text}
                </Markdown>
              </div>
            ) : (
              renderHighlightedContent()
            )}
          </div>
        )}
      </div>
    </div>
  );
};
