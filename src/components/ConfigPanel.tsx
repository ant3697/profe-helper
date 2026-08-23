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
  onClearFiles: () => void;
  onSelectDocument: (file: UploadedDocument) => void;
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
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  activeProviderConfig,
  onOpenAIModal,
  accumulatedTokens,
  uploadedFiles,
  onUploadFiles,
  onRemoveFile,
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
              onDrop={handleMainDrop}
              onClick={() => fileDropInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group select-none bg-alt ${
                isMainDragOver
                  ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 scale-[1.01]"
                  : "border-border-default hover:border-amber-500/80"
              }`}
            >
              <input
                type="file"
                ref={fileDropInputRef}
                multiple
                accept=".pdf,.txt,.html,.htm,.md,.json,.gift"
                className="hidden"
                onChange={(e) => e.target.files && onUploadFiles(e.target.files)}
              />
              <UploadCloud
                className={`w-8 h-8 transition-transform pointer-events-none ${
                  isMainDragOver ? "text-amber-400 scale-125 animate-bounce" : "text-amber-500 group-hover:scale-110"
                }`}
              />
              <p className="text-xs font-bold text-text-primary pointer-events-none mt-0.5">
                {isMainDragOver
                  ? "¡Suelta los archivos aquí!"
                  : "Arrastra PDFs, TXTs o .GIFT (Contexto)"}
              </p>
              <p className="text-[11px] text-text-muted pointer-events-none">
                La aplicación detectará si es Temario o Examen Anticolisión.
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-text-primary bg-surface px-4 py-1.5 rounded-lg border border-border-default group-hover:border-amber-500 transition-colors pointer-events-none shadow-xs"
              >
                Explorar Archivos...
              </button>
            </div>

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

                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {sortedFiles.map((file) => {
                    const isExam = file.role === "exam";
                    const isSelected = selectedDocumentId === file.id;

                    return (
                      <li
                        key={file.id}
                        onClick={() => onSelectDocument(file)}
                        className={`flex justify-between items-center border rounded-lg px-3 py-2 text-xs transition-all cursor-pointer ${
                          isExam
                            ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20"
                            : "bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20"
                        } ${
                          isSelected
                            ? isExam
                              ? "ring-2 ring-amber-500 shadow-md font-bold bg-amber-500/20"
                              : "ring-2 ring-blue-500 shadow-md font-bold bg-blue-500/20"
                            : ""
                        }`}
                        title={
                          isSelected
                            ? `Clic para deseleccionar y cerrar la visualización de ${file.name}`
                            : isExam
                            ? "Clic para ver e interactuar con el examen"
                            : "Clic para leer y explorar el documento base en el panel principal"
                        }
                      >
                        <div className="flex flex-col min-w-0 flex-1 mr-2 gap-1">
                          <span
                            className="truncate font-mono text-text-primary text-xs font-semibold"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isExam ? (
                              <span className="text-[9px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                EXAMEN (ANTICOLISIÓN)
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                                📚 BASE DOCUMENTAL
                              </span>
                            )}
                            {isSelected && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isExam
                                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                    : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                👁️ VIENDO
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(file.id);
                          }}
                          className="text-text-muted hover:text-red-500 p-1 rounded transition-colors hover:bg-surface border border-transparent hover:border-red-500/30 cursor-pointer"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

