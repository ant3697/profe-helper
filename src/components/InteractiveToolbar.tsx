import React from "react";
import {
  Shuffle,
  ArrowUpDown,
  Zap,
  CheckCircle2,
  EyeOff,
  Eye,
  Highlighter,
  MessageSquareText,
  FileCheck2,
  Flag,
  HelpCircle,
  XCircle,
  Camera,
} from "lucide-react";
import { EvaluationMode, QuestionFilter } from "../types/exam";

interface InteractiveToolbarProps {
  onShuffleQuestions: () => void;
  onSortQuestions: () => void;
  onShuffleOptions: () => void;
  onSortOptions: () => void;
  evalMode: EvaluationMode;
  onEvalModeChange: (mode: EvaluationMode) => void;
  hideDistractors: boolean;
  onToggleHideDistractors: () => void;
  highlightCorrect: boolean;
  onToggleHighlightCorrect: () => void;
  showAllFeedback: boolean;
  onToggleShowAllFeedback: () => void;
  isCodeTab: boolean;
  onOpenOmrSheet?: () => void;
  onOpenOmrScanner?: () => void;
  activeFilter?: QuestionFilter;
  onFilterChange?: (filter: QuestionFilter) => void;
  filterCounts?: {
    all: number;
    unanswered: number;
    flagged: number;
    incorrect: number;
    correct: number;
  };
}

export const InteractiveToolbar: React.FC<InteractiveToolbarProps> = ({
  onShuffleQuestions,
  onSortQuestions,
  onShuffleOptions,
  onSortOptions,
  evalMode,
  onEvalModeChange,
  hideDistractors,
  onToggleHideDistractors,
  highlightCorrect,
  onToggleHighlightCorrect,
  showAllFeedback,
  onToggleShowAllFeedback,
  isCodeTab,
  onOpenOmrSheet,
  onOpenOmrScanner,
  activeFilter = "all",
  onFilterChange,
  filterCounts = { all: 0, unanswered: 0, flagged: 0, incorrect: 0, correct: 0 },
}) => {
  return (
    <div className="bg-app/80 p-3 rounded-2xl border border-border-subtle shadow-inner w-full no-print space-y-2.5">
      {/* Question Filter Pills (Interactive only) */}
      {!isCodeTab && onFilterChange && (
        <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-border-subtle/60 text-xs">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider mr-1">
            Filtros:
          </span>

          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === "all"
                ? "bg-amber-500 text-black shadow-xs"
                : "bg-surface text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            <span>Todas</span>
            <span className="text-[10px] opacity-80">({filterCounts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("unanswered")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === "unanswered"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Pendientes</span>
            <span className="text-[10px] opacity-80">({filterCounts.unanswered})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("flagged")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === "flagged"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-surface text-text-secondary hover:text-text-primary border border-border-subtle"
            }`}
          >
            <Flag className="w-3 h-3" />
            <span>Con Duda 🚩</span>
            <span className="text-[10px] opacity-80">({filterCounts.flagged})</span>
          </button>

          {filterCounts.incorrect > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange("incorrect")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "incorrect"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-surface text-red-400 hover:text-red-300 border border-red-500/30"
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Falladas</span>
              <span className="text-[10px] opacity-80">({filterCounts.incorrect})</span>
            </button>
          )}

          {filterCounts.correct > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange("correct")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === "correct"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-surface text-emerald-400 hover:text-emerald-300 border border-emerald-500/30"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Acertadas</span>
              <span className="text-[10px] opacity-80">({filterCounts.correct})</span>
            </button>
          )}
        </div>
      )}

      {/* Main Toolbar Buttons */}
      <div className="flex flex-wrap gap-2 text-xs">
        {/* Reordering controls */}
        <button
          type="button"
          onClick={onShuffleQuestions}
          className="flex-1 min-w-[110px] bg-surface/80 border border-border-strong hover:bg-hover px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-text-primary transition-all active:scale-95 shadow-xs cursor-pointer"
          title="Barajar aleatoriamente el orden de las preguntas"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-500" />
          <span>Barajar P</span>
        </button>

        <button
          type="button"
          onClick={onSortQuestions}
          className="flex-1 min-w-[110px] bg-surface/80 border border-border-strong hover:bg-hover px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-text-primary transition-all active:scale-95 shadow-xs cursor-pointer"
          title="Restablecer el orden original de las preguntas"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Ordenar P</span>
        </button>

        <button
          type="button"
          onClick={onShuffleOptions}
          className="flex-1 min-w-[110px] bg-surface/80 border border-border-strong hover:bg-hover px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-text-primary transition-all active:scale-95 shadow-xs cursor-pointer"
          title="Barajar aleatoriamente las opciones (A, B, C, D)"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-500" />
          <span>Barajar O</span>
        </button>

        <button
          type="button"
          onClick={onSortOptions}
          className="flex-1 min-w-[110px] bg-surface/80 border border-border-strong hover:bg-hover px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-text-primary transition-all active:scale-95 shadow-xs cursor-pointer"
          title="Ordenar opciones colocando la respuesta correcta en la posición a)"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
          <span>Ordenar O</span>
        </button>

        {/* Interactive-only view modifiers */}
        {!isCodeTab && (
          <>
            <button
              type="button"
              onClick={() => onEvalModeChange("instant")}
              className={`flex-1 min-w-[110px] border px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                evalMode === "instant"
                  ? "bg-amber-500/15 border-amber-500 text-amber-400 font-extrabold"
                  : "bg-surface/80 border-border-strong hover:bg-hover text-text-secondary"
              }`}
              title="Feedback instantáneo al hacer clic en cada opción"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Formativo</span>
            </button>

            <button
              type="button"
              onClick={() => onEvalModeChange("deferred")}
              className={`flex-1 min-w-[110px] border px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                evalMode === "deferred"
                  ? "bg-blue-500/15 border-blue-500 text-blue-400 font-extrabold"
                  : "bg-surface/80 border-border-strong hover:bg-hover text-text-secondary"
              }`}
              title="Simulacro realista: responde todo y evalúa al final"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Realista</span>
            </button>

            <button
              type="button"
              onClick={onToggleHideDistractors}
              className={`flex-1 min-w-[110px] border px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                hideDistractors
                  ? "bg-purple-500/15 border-purple-500 text-purple-400"
                  : "bg-surface/80 border-border-strong hover:bg-hover text-text-secondary"
              }`}
              title="Ocultar distractores incorrectos para memorización rápida"
            >
              {hideDistractors ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Sin Errores</span>
            </button>

            <button
              type="button"
              onClick={onToggleHighlightCorrect}
              className={`flex-1 min-w-[110px] border px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                highlightCorrect
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                  : "bg-surface/80 border-border-strong hover:bg-hover text-text-secondary"
              }`}
              title="Resaltar en verde la opción correcta"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              <span>Resaltar Cor.</span>
            </button>

            <button
              type="button"
              onClick={onToggleShowAllFeedback}
              className={`flex-1 min-w-[110px] border px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 shadow-xs cursor-pointer ${
                showAllFeedback
                  ? "bg-amber-500/15 border-amber-500 text-amber-400"
                  : "bg-surface/80 border-border-strong hover:bg-hover text-text-secondary"
              }`}
              title="Mostrar todas las justificaciones y retroalimentación"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-amber-500" />
              <span>Ver Feedback</span>
            </button>

            {onOpenOmrSheet && (
              <button
                type="button"
                onClick={onOpenOmrSheet}
                className="flex-1 min-w-[110px] bg-gradient-to-r from-amber-500/15 to-amber-600/15 border border-amber-500/50 hover:border-amber-400 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
                title="Generar o imprimir Hoja Oficial de Respuestas con casillas A/B/C/D"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Hoja OMR</span>
              </button>
            )}

            {onOpenOmrScanner && (
              <button
                type="button"
                onClick={onOpenOmrScanner}
                className="flex-1 min-w-[120px] bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500 text-amber-800 dark:text-amber-300 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-black transition-all active:scale-95 shadow-xs cursor-pointer"
                title="Escanear y corregir exámenes con la cámara del móvil (ZipGrade)"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Escanear Móvil</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
