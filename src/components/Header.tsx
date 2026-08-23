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
        <div className="flex bg-alt p-1.5 rounded-2xl border border-border-default shadow-md">
          <button
            type="button"
            onClick={() => onAppModeChange("exams")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentAppMode === "exams"
                ? "bg-surface text-amber-600 dark:text-amber-400 shadow-md border border-border-default"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>Exámenes y Tests</span>
          </button>
          <button
            type="button"
            onClick={() => onAppModeChange("topic_builder")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentAppMode === "topic_builder"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-text-muted hover:text-amber-500"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Experto IA (Temarios)</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-black text-amber-400">
              NUEVO
            </span>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 flex-wrap justify-center">
        {/* Hidden Import Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".html,.htm,.gift,.txt,.json,.md,.pdf"
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

