import React from "react";
import {
  Upload,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Bot,
  Columns,
  Sparkles,
  Camera,
  Cpu,
  FileQuestion,
  BookOpen,
} from "lucide-react";
import { AIProviderConfig } from "../types/aiProviders";

interface HeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeProviderConfig?: AIProviderConfig;
  onOpenAIModal: () => void;
  isExtendedMode?: boolean;
  onToggleExtendedMode?: () => void;
  onOpenOmrScanner?: () => void;
  currentAppMode?: "exams" | "topic_builder";
  onAppModeChange?: (mode: "exams" | "topic_builder") => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  onImportFile,
  activeProviderConfig,
  onOpenAIModal,
  isExtendedMode = false,
  onToggleExtendedMode,
  onOpenOmrScanner,
  currentAppMode = "exams",
  onAppModeChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-default pb-5 no-print">
      {/* Left Branding */}
      <div className="flex items-center gap-3.5 text-center md:text-left">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-amber-500/20 shrink-0">
          A
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary flex items-center gap-2">
            AI <span className="text-amber-600 dark:text-amber-400 font-black">Exams & Temarios Builder</span>
          </h1>
          <p className="text-xs text-text-muted font-medium">
            Generador Universal de Exámenes, Temarios de Alta Densidad y Evaluación OMR
          </p>
        </div>
      </div>

      {/* Center / Navigation Mode Switcher */}
      {onAppModeChange && (
        <div className="flex bg-[#0f1422] p-1.5 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md items-center gap-1">
          {/* Button: Exámenes y Tests */}
          <button
            type="button"
            onClick={() => onAppModeChange("exams")}
            className={`group px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer select-none ${
              currentAppMode === "exams"
                ? "bg-gradient-to-r from-[#00b074] via-[#05c485] to-[#06b6d4] text-white shadow-lg shadow-emerald-500/25 border border-emerald-300/40"
                : "bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <FileQuestion
              className={`w-4 h-4 shrink-0 transition-colors ${
                currentAppMode === "exams"
                  ? "text-white"
                  : "text-[#05c485]"
              }`}
            />
            <div className="flex flex-col text-left leading-tight">
              <span
                className={`text-xs tracking-tight ${
                  currentAppMode === "exams"
                    ? "font-black text-white"
                    : "font-bold text-slate-300 group-hover:text-white"
                }`}
              >
                Exámenes y
              </span>
              <span
                className={`text-xs tracking-tight ${
                  currentAppMode === "exams"
                    ? "font-black text-white"
                    : "font-bold text-slate-400 group-hover:text-slate-200"
                }`}
              >
                Tests
              </span>
            </div>
          </button>

          {/* Button: Experto IA (Temarios) */}
          <button
            type="button"
            onClick={() => onAppModeChange("topic_builder")}
            className={`group px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2.5 cursor-pointer select-none ${
              currentAppMode === "topic_builder"
                ? "bg-gradient-to-r from-[#5a52ff] via-[#6d45fe] to-[#8d3ffe] text-white shadow-lg shadow-indigo-500/25 border border-indigo-300/40"
                : "bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Cpu
              className={`w-4 h-4 shrink-0 transition-colors ${
                currentAppMode === "topic_builder"
                  ? "text-white"
                  : "text-[#7c5cfc]"
              }`}
            />
            <div className="flex flex-col text-left leading-tight">
              <span
                className={`text-xs tracking-tight ${
                  currentAppMode === "topic_builder"
                    ? "font-black text-white"
                    : "font-bold text-slate-300 group-hover:text-white"
                }`}
              >
                Experto IA
              </span>
              <span
                className={`text-xs tracking-tight ${
                  currentAppMode === "topic_builder"
                    ? "font-black text-white"
                    : "font-bold text-slate-400 group-hover:text-slate-200"
                }`}
              >
                (Temarios)
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 flex-wrap justify-center">
        {/* Hidden Import Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.md,.txt,.gift,.json,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={onImportFile}
        />

        {/* Mobile Camera OMR Scanner Button */}
        {onOpenOmrScanner && (
          <button
            type="button"
            onClick={onOpenOmrScanner}
            className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs hover:border-amber-500 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Escanear y Corregir con Cámara Móvil (Lector Óptico OMR)"
          >
            <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-extrabold">Corregir con Móvil</span>
          </button>
        )}

        {/* AI Providers Button */}
        <button
          type="button"
          onClick={onOpenAIModal}
          className="text-xs font-bold text-text-primary bg-surface px-3 py-2 rounded-xl border border-border-default shadow-xs hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          title="Configurar Proveedor de IA"
        >
          <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline text-text-muted">IA:</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold max-w-[120px] truncate">
            {activeProviderConfig ? activeProviderConfig.subtitle : "Gemini"}
          </span>
        </button>

        {/* Extended Mode */}
        {onToggleExtendedMode && (
          <button
            type="button"
            onClick={onToggleExtendedMode}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
              isExtendedMode
                ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold"
                : "bg-surface border-border-default text-text-secondary hover:border-amber-500 hover:text-text-primary"
            }`}
            title="Modo Extendido / Ajustar Ancho de Pantalla"
          >
            <Columns className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Modo Extendido</span>
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="text-xs font-semibold text-text-secondary bg-surface px-3 py-2 rounded-xl border border-border-default shadow-xs hover:border-amber-500 hover:text-text-primary transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Pantalla Completa"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Salir</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Pantalla Completa</span>
            </>
          )}
        </button>

        {/* Theme Switcher */}
        <div className="flex bg-alt p-1 rounded-xl border border-border-subtle shadow-xs">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              theme === "light"
                ? "bg-surface text-amber-600 shadow-xs font-bold"
                : "text-text-muted hover:text-text-primary"
            }`}
            title="Modo Claro"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-surface text-amber-400 shadow-xs font-bold"
                : "text-text-muted hover:text-text-primary"
            }`}
            title="Modo Oscuro"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

