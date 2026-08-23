import React from "react";
import { ArrowUp, CheckCircle2 } from "lucide-react";

interface ExamFooterBarProps {
  answeredCount: number;
  totalQuestions: number;
  onScrollToTop: () => void;
  onSubmitExam: () => void;
}

export const ExamFooterBar: React.FC<ExamFooterBarProps> = ({
  answeredCount,
  totalQuestions,
  onScrollToTop,
  onSubmitExam,
}) => {
  return (
    <div className="sticky bottom-0 p-4 bg-surface/95 backdrop-blur-md border-t border-border-default shadow-xl flex justify-between items-center no-print z-30 transition-all rounded-b-2xl mt-auto">
      <button
        type="button"
        onClick={onScrollToTop}
        className="text-xs font-bold bg-alt border border-border-strong text-text-secondary hover:bg-hover px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
        title="Mover a la parte superior del examen"
      >
        <ArrowUp className="w-4 h-4" />
        <span className="hidden sm:inline">Mover arriba</span>
      </button>

      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-text-secondary font-mono bg-alt px-3 py-1.5 rounded-lg border border-border-subtle">
          Respondidas: {answeredCount}/{totalQuestions}
        </span>

        <button
          type="button"
          onClick={onSubmitExam}
          className="text-xs font-extrabold bg-amber-500 text-black hover:bg-amber-400 px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <span>Finalizar y Enviar</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
