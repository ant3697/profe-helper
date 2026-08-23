import React from "react";
import { Award, CheckCircle2, XCircle, X, RotateCcw, ArrowRight } from "lucide-react";
import { ExamSessionScore } from "../types/exam";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: ExamSessionScore;
  examTitle: string;
  onReviewMistakes?: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  score,
  examTitle,
  onReviewMistakes,
}) => {
  if (!isOpen) return null;

  const mistakesCount = score.incorrect + score.unanswered;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-surface border-2 border-amber-500 shadow-2xl p-6 sm:p-8 w-full max-w-lg rounded-3xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-text-muted hover:text-red-400 hover:bg-alt transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 mb-1 shadow-sm">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-text-primary font-primary">
            Resultados del Examen
          </h2>
          <p className="text-xs text-text-muted font-medium truncate max-w-xs mx-auto">
            {examTitle || "Test Técnico"}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-alt/70 rounded-2xl border border-border-subtle flex flex-col justify-center">
            <span className="text-[11px] text-text-muted font-bold uppercase mb-1">
              Nota Final
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-500">
              {score.grade10}
              <span className="text-xs text-text-muted font-normal">/10</span>
            </div>
          </div>

          <div className="p-3.5 bg-alt/70 rounded-2xl border border-border-subtle flex flex-col justify-center">
            <span className="text-[11px] text-text-muted font-bold uppercase mb-1">
              Precisión
            </span>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">
              {score.percentage}%
            </div>
          </div>

          <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex flex-col justify-center">
            <span className="text-[11px] text-emerald-400 font-bold uppercase mb-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Aciertos
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {score.correct}
            </div>
          </div>

          <div className="p-3.5 bg-red-500/10 rounded-2xl border border-red-500/30 flex flex-col justify-center">
            <span className="text-[11px] text-red-400 font-bold uppercase mb-1 flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" />
              Fallos
            </span>
            <div className="text-2xl sm:text-3xl font-black text-red-400">
              {score.incorrect}
            </div>
          </div>
        </div>

        {score.unanswered > 0 && (
          <p className="text-xs text-text-muted">
            Preguntas no respondidas: <b className="text-text-primary">{score.unanswered}</b>
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {mistakesCount > 0 && onReviewMistakes && (
            <button
              type="button"
              onClick={onReviewMistakes}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repaso de Falladas ({mistakesCount} preg.)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-amber-500 text-black px-6 py-3 rounded-xl hover:bg-amber-400 transition-all font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            Revisar Corrección
          </button>
        </div>
      </div>
    </div>
  );
};
