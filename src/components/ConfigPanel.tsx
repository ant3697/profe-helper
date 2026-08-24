import React, { useState } from "react";
import {
  Bot,
  Key,
  Zap,
  FileText,
  FileCode,
  Shield,
  Trash2,
  ListFilter,
  Sparkles,
  Sliders,
  UploadCloud,
  Layers,
  Settings,
  Cpu,
  RefreshCw,
  ArrowLeftRight,
  FileCheck,
} from "lucide-react";
import { DifficultyLevel, UploadedDocument, CreativityStyle } from "../types/exam";
import { AIProviderConfig } from "../types/aiProviders";

interface ConfigPanelProps {
  activeProviderConfig: AIProviderConfig;
  onOpenAIModal: () => void;
  accumulatedTokens: number;
  uploadedFiles: UploadedDocument[];
  onUploadFiles: (files: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onToggleFileActive?: (id: string) => void;
  onTransferDocumentToTopic?: (file: UploadedDocument) => void;
  onClearFiles: () => void;
  onSelectDocument: (file: UploadedDocument, preferredMode?: "html" | "markdown" | "plain") => void;
  selectedDocumentId: string | null;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  baseMode: "files" | "text";
  onBaseModeChange: (mode: "files" | "text") => void;
  difficulty: DifficultyLevel;
  onDifficultyChange: (level: DifficultyLevel) => void;
  creativityStyle?: CreativityStyle;
  onCreativityStyleChange?: (style: CreativityStyle) => void;
  numQuestions: number;
  onNumQuestionsChange: (num: number) => void;
  batchCount: number;
  onBatchCountChange: (count: number) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  onOpenThematicBuilder: () => void;
  onRequestGenerate: () => void;
  isLoading: boolean;
  isProcessingFiles?: boolean;
  processingStatusText?: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  activeProviderConfig,
  onOpenAIModal,
  accumulatedTokens,
  uploadedFiles,
  onUploadFiles,
  onRemoveFile,
  onToggleFileActive,
  onTransferDocumentToTopic,
  onClearFiles,
  onSelectDocument,
  selectedDocumentId,
  pastedText,
  onPastedTextChange,
  baseMode,
  onBaseModeChange,
  difficulty,
  onDifficultyChange,
  creativityStyle = "literal",
  onCreativityStyleChange,
  numQuestions,
  onNumQuestionsChange,
  batchCount,
  onBatchCountChange,
  customPrompt,
  onCustomPromptChange,
  onOpenThematicBuilder,
  onRequestGenerate,
  isLoading,
  isProcessingFiles = false,
  processingStatusText = "",
}) => {
  const [fileSort, setFileSort] = useState<string>("time-desc");
  const [isMainDragOver, setIsMainDragOver] = useState(false);
  const [isPromptDragOver, setIsPromptDragOver] = useState(false);
  const mainDragCounterRef = React.useRef(0);
  const promptDragCounterRef = React.useRef(0);
  const promptFileInputRef = React.useRef<HTMLInputElement>(null);
  const fileDropInputRef = React.useRef<HTMLInputElement>(null);

  // Filter and sort files
  const sortedFiles = [...uploadedFiles].sort((a, b) => {
    if (fileSort === "time-desc") return b.timestamp - a.timestamp;
    if (fileSort === "time-asc") return a.timestamp - b.timestamp;
    if (fileSort === "name-asc") return a.name.localeCompare(b.name);
    if (fileSort === "name-desc") return b.name.localeCompare(a.name);
    if (fileSort === "type-exam") return a.role === "exam" ? -1 : 1;
    if (fileSort === "type-base") return a.role === "base" ? -1 : 1;
    return 0;
  });

  const handlePromptDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    promptDragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsPromptDragOver(true);
    }
  };

  const handlePromptDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsPromptDragOver(true);
  };

  const handlePromptDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    promptDragCounterRef.current -= 1;
    if (promptDragCounterRef.current <= 0) {
      promptDragCounterRef.current = 0;
      setIsPromptDragOver(false);
    }
  };

  const handlePromptFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    promptDragCounterRef.current = 0;
    setIsPromptDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const text = await file.text();
      onCustomPromptChange(customPrompt ? `${customPrompt}\n\n${text}` : text);
    }
  };

  const handlePromptFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const text = await file.text();
      onCustomPromptChange(customPrompt ? `${customPrompt}\n\n${text}` : text);
      e.target.value = "";
    }
  };

  const handleMainDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mainDragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsMainDragOver(true);
    }
  };

  const handleMainDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsMainDragOver(true);
  };

  const handleMainDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mainDragCounterRef.current -= 1;
    if (mainDragCounterRef.current <= 0) {
      mainDragCounterRef.current = 0;
      setIsMainDragOver(false);
    }
  };

  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mainDragCounterRef.current = 0;
    setIsMainDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-surface border border-border-default shadow-xl rounded-2xl p-5 space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-default pb-3">
        <h2 className="text-base sm:text-lg font-black text-text-primary tracking-wide">
          Configuración del Examen
        </h2>
        <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
          {accumulatedTokens.toLocaleString()} tokens
        </span>
      </div>

      {/* Base Documents (Context) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary">
            Documentos Base (Contexto)
          </label>
          <div className="flex bg-alt p-1 rounded-lg border border-border-default">
            <button
              type="button"
              onClick={() => onBaseModeChange("files")}
              className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                baseMode === "files"
                  ? "bg-surface text-text-primary shadow-xs border border-border-default"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              ARCHIVOS
            </button>
            <button
              type="button"
              onClick={() => onBaseModeChange("text")}
              className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                baseMode === "text"
                  ? "bg-surface text-text-primary shadow-xs border border-border-default"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              PEGAR TEXTO
            </button>
          </div>
        </div>

        {baseMode === "files" ? (
          <div className="space-y-3">
            <div
              onDragEnter={handleMainDragEnter}
              onDragOver={handleMainDragOver}
              onDragLeave={handleMainDragLeave}
              onDrop={!isProcessingFiles ? handleMainDrop : undefined}
              onClick={() => !isProcessingFiles && fileDropInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group select-none ${
                isMainDragOver
                  ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 scale-[1.01]"
                  : isProcessingFiles
                  ? "border-amber-500 bg-amber-500/10 cursor-wait"
                  : "border-border-default bg-alt hover:border-amber-500/80"
              }`}
            >
              <input
                type="file"
                ref={fileDropInputRef}
                multiple
                accept=".pdf,.md,.txt,.gift,.png,.jpg,.jpeg,.webp,.json"
                className="hidden"
                onChange={(e) => e.target.files && onUploadFiles(e.target.files)}
              />
              {isProcessingFiles ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2 text-center animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      Procesando documento...
                    </p>
                    <p className="text-[11px] text-text-muted max-w-[280px] mx-auto leading-relaxed">
                      {processingStatusText ||
                        "Detectado documento con capturas de imagen / escaneado. Analizando con Gemini Multimodal (Document Understanding)..."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud
                    className={`w-8 h-8 transition-transform pointer-events-none ${
                      isMainDragOver ? "text-amber-400 scale-125 animate-bounce" : "text-amber-500 group-hover:scale-110"
                    }`}
                  />
                  <p className="text-xs font-bold text-text-primary pointer-events-none mt-0.5">
                    {isMainDragOver
                      ? "¡Suelta los archivos aquí!"
                      : "Arrastra PDFs (Digitales o Capturas), Imágenes o .GIFT"}
                  </p>
                  <p className="text-[11px] text-text-muted pointer-events-none">
                    Reconocimiento multimodal estructurado en formato Markdown (.md)
                  </p>
                  <div className="flex flex-wrap justify-center gap-1 mt-0.5 pointer-events-none">
                    {["PDF", "MD", "TXT", "PNG", "JPG", "GIFT"].map((ext) => (
                      <span
                        key={ext}
                        className="text-[9px] font-mono font-bold bg-alt border border-border-default px-1.5 py-0.5 rounded text-text-secondary"
                      >
                        .{ext}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-text-primary bg-surface px-4 py-1.5 rounded-lg border border-border-default group-hover:border-amber-500 transition-colors pointer-events-none shadow-xs"
                  >
                    Explorar Archivos...
                  </button>
                </>
              )}
            </div>

            {/* Processing banner if active */}
            {isProcessingFiles && (
              <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-xs shadow-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                <div className="flex-1 truncate">
                  <span className="font-bold">Reconocimiento RAG en curso: </span>
                  <span className="text-text-muted text-[11px]">
                    {processingStatusText || "Detectado documento con capturas..."}
                  </span>
                </div>
              </div>
            )}

            {/* Uploaded Files List */}
            {sortedFiles.length > 0 && (
              <div className="bg-alt p-3 rounded-xl border border-border-default space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                    <span>Documentos ({sortedFiles.length}):</span>
                    {sortedFiles.some((f) => f.role === "exam") && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                        {sortedFiles.filter((f) => f.role === "exam").length} anticolisión
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={onClearFiles}
                    className="text-[11px] text-red-500 dark:text-red-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Limpiar todos
                  </button>
                </div>

                <div className="flex justify-between items-center bg-surface border border-border-default rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] text-text-muted font-bold uppercase flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5 text-amber-500" />
                    Ordenar:
                  </span>
                  <select
                    value={fileSort}
                    onChange={(e) => setFileSort(e.target.value)}
                    className="text-[11px] bg-alt text-text-primary font-semibold outline-none cursor-pointer border border-border-default rounded-md px-2 py-1 hover:border-amber-500/60 focus:border-amber-500 transition-colors shadow-xs"
                  >
                    <option value="time-desc">Más recientes primero</option>
                    <option value="time-asc">Más antiguos primero</option>
                    <option value="name-asc">Alfabético (A-Z)</option>
                    <option value="name-desc">Alfabético (Z-A)</option>
                    <option value="type-exam">Exámenes primero</option>
                    <option value="type-base">Temario primero</option>
                  </select>
                </div>

                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sortedFiles.map((file) => {
                    const isExam = file.role === "exam";
                    const isSelected = selectedDocumentId === file.id;
                    const isActive = file.active !== false;

                    return (
                      <li
                        key={file.id}
                        onClick={() => onSelectDocument(file)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer select-none text-xs group ${
                          isSelected
                            ? "bg-[#16120b] border-2 border-amber-500 shadow-md shadow-amber-500/10"
                            : !isActive
                            ? "bg-surface/50 border-border-default opacity-60"
                            : "bg-surface/90 border-border-default hover:border-amber-500/50"
                        }`}
                        title={
                          isSelected
                            ? `Clic para deseleccionar ${file.name}`
                            : isExam
                            ? "Clic para ver e interactuar con el examen"
                            : "Clic para leer y explorar el documento base"
                        }
                      >
                        {/* Left: Checkbox + Green File Icon + Title */}
                        <div className="flex items-center gap-2.5 truncate pr-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (onToggleFileActive) {
                                onToggleFileActive(file.id);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-amber-500 bg-surface border-border-default focus:ring-amber-500/30 cursor-pointer shrink-0 accent-amber-500"
                            title={
                              isActive
                                ? "Habilitado en la generación (clic para desactivar)"
                                : "Deshabilitado en la generación (clic para activar)"
                            }
                          />

                          <FileCheck
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? "text-emerald-500" : "text-text-muted"
                            }`}
                          />

                          <span
                            className={`truncate font-semibold text-xs ${
                              isActive
                                ? "text-text-primary"
                                : "text-text-muted line-through"
                            }`}
                            title={file.name}
                          >
                            {file.name}
                          </span>

                          {isExam && (
                            <span className="text-[9px] font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded shrink-0 shadow-xs">
                              EXAMEN
                            </span>
                          )}

                          {!isActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-alt text-text-muted border border-border-default shrink-0">
                              DESACTIVADO
                            </span>
                          )}
                        </div>

                        {/* Right: MD + HTML + Swap + Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDocument(file, "markdown");
                            }}
                            className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-blue-950/70 text-blue-400 hover:bg-blue-600 hover:text-white border-blue-800/40"
                            }`}
                            title="Ver documento en formato Markdown (.md)"
                          >
                            MD
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDocument(file, "html");
                            }}
                            className={`text-[10px] font-black px-2 py-0.5 rounded border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-500 text-black border-amber-500 shadow-xs"
                                : "bg-amber-950/70 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-800/40"
                            }`}
                            title="Ver documento en formato HTML maquetado A4"
                          >
                            HTML
                          </button>

                          {onTransferDocumentToTopic && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTransferDocumentToTopic(file);
                              }}
                              className="text-text-muted hover:text-amber-500 p-1 rounded transition-colors hover:bg-amber-500/10 cursor-pointer"
                              title="Copiar / Enviar este documento al módulo Experto IA (Temarios)"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFile(file.id);
                            }}
                            className="text-text-muted hover:text-red-500 p-1 rounded transition-colors hover:bg-red-500/10 cursor-pointer"
                            title="Eliminar archivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <textarea
              value={pastedText}
              onChange={(e) => onPastedTextChange(e.target.value)}
              placeholder="Pega aquí el contenido del temario, leyes o apuntes que quieras que la IA use como base de conocimiento..."
              className="w-full h-36 bg-alt border border-border-default text-text-primary placeholder:text-text-muted rounded-xl text-xs p-3 pb-8 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none font-mono"
            />
            {pastedText && (
              <button
                type="button"
                onClick={() => onPastedTextChange("")}
                className="absolute bottom-2 right-2 text-[10px] bg-surface hover:bg-red-500/20 text-text-secondary hover:text-red-500 px-2 py-1 rounded border border-border-default transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Borrar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Difficulty Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary">
            Modo de Dificultad
          </label>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
              difficulty === "easy"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : difficulty === "standard"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
            }`}
          >
            {difficulty === "easy"
              ? "BÁSICO (TEÓRICO)"
              : difficulty === "standard"
              ? "OFICIAL (PRÁCTICO)"
              : "KILLER (TRIBUNAL)"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onDifficultyChange("easy")}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
              difficulty === "easy"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/60 shadow-xs"
                : "bg-alt border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Básico
            </span>
            <span className="text-[10px] font-normal opacity-80">(Teórico)</span>
          </button>
          <button
            type="button"
            onClick={() => onDifficultyChange("standard")}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
              difficulty === "standard"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/60 shadow-xs"
                : "bg-alt border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Oficial
            </span>
            <span className="text-[10px] font-normal opacity-80">(Práctico)</span>
          </button>
          <button
            type="button"
            onClick={() => onDifficultyChange("killer")}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
              difficulty === "killer"
                ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/60 shadow-xs"
                : "bg-alt border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
            }`}
          >
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Killer
            </span>
            <span className="text-[10px] font-normal opacity-80">(Tribunal)</span>
          </button>
        </div>

        <p className="text-[11px] text-text-muted leading-snug pt-0.5">
          {difficulty === "easy" &&
            "Preguntas directas, definiciones y conceptos fundamentales. Formato test estándar."}
          {difficulty === "standard" &&
            "Práctico y justo. Evalúa competencia técnica real sin trampas. Casos de campo y normativas aplicadas."}
          {difficulty === "killer" &&
            "Máxima exigencia de tribunal: diagnósticos complejos, límites reglamentarios y distractores hiper-verosímiles."}
        </p>
      </div>

      {/* Creativity & Formulation Style */}
      {onCreativityStyleChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary">
              Estilo de Formulación (Creatividad IA)
            </label>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
              {creativityStyle === "literal"
                ? "Temp 0.25 (Literal)"
                : creativityStyle === "interpretive"
                ? "Temp 0.85 (Casos)"
                : "Temp 0.60 (Equilibrado)"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onCreativityStyleChange("literal")}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                creativityStyle === "literal"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/60 shadow-xs"
                  : "bg-alt border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
              }`}
              title="Ajuste estricto y literal sobre la ley y el temario"
            >
              <span className="flex items-center gap-1">
                <span>⚖️</span>
                <span>Literal</span>
              </span>
              <span className="text-[10px] font-normal opacity-80">(Ley Pura)</span>
            </button>

            <button
              type="button"
              onClick={() => onCreativityStyleChange("balanced")}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                creativityStyle === "balanced"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/60 shadow-xs"
                  : "bg-alt border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
              }`}
              title="Estilo equilibrado oficial de oposición"
            >
              <span className="flex items-center gap-1">
                <span>🎯</span>
                <span>Equilibrado</span>
              </span>
              <span className="text-[10px] font-normal opacity-80">(Oficial)</span>
            </button>

            <button
              type="button"
              onClick={() => onCreativityStyleChange("interpretive")}
              className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                creativityStyle === "interpretive"
                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/60 shadow-xs"
                  : "bg-alt border-border-default text-text-muted hover:text-text-primary hover:border-border-strong"
              }`}
              title="Supuestos prácticos, casos de campo y deducciones"
            >
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>Casos</span>
              </span>
              <span className="text-[10px] font-normal opacity-80">(Prácticos)</span>
            </button>
          </div>
        </div>
      )}

      {/* Number of Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary">
            Preguntas Tipo Test
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
              {numQuestions}
            </span>
            <span className="text-[10px] text-text-muted font-medium">ítems</span>
          </div>
        </div>

        <input
          type="range"
          min={4}
          max={100}
          step={2}
          value={numQuestions}
          onChange={(e) => onNumQuestionsChange(Number(e.target.value))}
          className="custom-range-slider"
        />

        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {[10, 20, 40, 60, 80, 100].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onNumQuestionsChange(count)}
              className={`flex-1 py-1 rounded-md text-[10px] font-mono font-bold transition-colors ${
                numQuestions === count
                  ? "bg-amber-400 text-black shadow-xs"
                  : "bg-alt text-text-muted hover:text-text-primary hover:bg-hover border border-border-default"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Extra Instructions (Optional) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-primary block">
          Instrucciones Extra (Opcional)
        </label>
        <div
          onDragEnter={handlePromptDragEnter}
          onDragOver={handlePromptDragOver}
          onDragLeave={handlePromptDragLeave}
          onDrop={handlePromptFileDrop}
          className="relative"
        >
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Ej. Incluye preguntas sobre psicometría y cálculo de conductos..."
            className="w-full h-20 bg-alt border border-border-default text-text-primary placeholder:text-text-muted rounded-xl text-xs p-3 outline-none focus:border-amber-500 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Profiles & Dynamic Focus */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-bold text-text-primary block">
          Perfiles y Foco Dinámico:
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenThematicBuilder}
            className="flex-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/60 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Selección de Temáticas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCustomPromptChange("");
            }}
            className="p-2 bg-alt border border-border-default text-text-muted hover:text-red-500 hover:border-red-500/40 rounded-xl transition-colors cursor-pointer"
            title="Limpiar instrucciones"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Generación en Lote */}
      <div className="pt-3 border-t border-border-default space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-text-primary">
            Generación en Lote:
          </label>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
            {batchCount} {batchCount === 1 ? "Batería" : "Baterías"}
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={batchCount}
          onChange={(e) => onBatchCountChange(Number(e.target.value))}
          className="custom-range-slider"
        />
      </div>

      {/* Generate Exam / Battery CTA Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={onRequestGenerate}
        className="w-full bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-black text-xs sm:text-sm py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] mt-1"
      >
        <Sparkles className="w-4 h-4 fill-black text-black" />
        <span>Generar Examen / Batería (IA)</span>
      </button>
    </div>
  );
};

