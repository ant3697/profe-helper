import React, { useState } from "react";
import { HelpCircle, Check, X as XIcon, Lightbulb, Flag } from "lucide-react";
import { ExamQuestion, EvaluationMode } from "../types/exam";

interface QuestionCardProps {
  question: ExamQuestion;
  index: number;
  evalMode: EvaluationMode;
  isExamSubmitted: boolean;
  onSelectOption: (qIndex: number, optIndex: number) => void;
  onToggleFlag?: (qIndex: number) => void;
  hideDistractors: boolean;
  highlightCorrect: boolean;
  forceShowFeedback: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  evalMode,
  isExamSubmitted,
  onSelectOption,
  onToggleFlag,
  hideDistractors,
  highlightCorrect,
  forceShowFeedback,
}) => {
  const [showSingleHint, setShowSingleHint] = useState(false);

  const isInstant = evalMode === "instant";
  const isAnswered = question.isAnswered || false;
  const selectedIdx = question.userSelectedIndex;
  const isCorrectOption = (optIdx: number) => optIdx === question.indiceCorrecta;
  const isFlagged = question.flagged || false;

  // Decide if justification is visible
  const isJustificationVisible =
    forceShowFeedback ||
    showSingleHint ||
    (isInstant && isAnswered) ||
    (evalMode === "deferred" && isExamSubmitted);

  const isCorrectAnswer = isAnswered && selectedIdx === question.indiceCorrecta;
  const isIncorrectAnswer = isAnswered && selectedIdx !== null && selectedIdx !== question.indiceCorrecta;

  return (
    <div
      className={`p-5 rounded-2xl bg-surface border shadow-xs transition-all space-y-4 question-block ${
        isFlagged
          ? "border-amber-500/80 bg-amber-500/[0.03] ring-1 ring-amber-500/30"
          : "border-border-default hover:border-border-strong"
      }`}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-text-primary leading-relaxed flex-1">
          <span className="font-bold text-amber-500 mr-2">{index + 1}.</span>
          <span>{question.enunciado}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 no-print">
          {/* Flag / Duda button */}
          {onToggleFlag && (
            <button
              type="button"
              onClick={() => onToggleFlag(index)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isFlagged
                  ? "bg-amber-500 text-black border-amber-400 font-bold shadow-xs"
                  : "bg-alt text-text-muted hover:text-amber-400 border-border-subtle hover:border-border-default"
              }`}
              title={isFlagged ? "Pregunta marcada con duda (clic para desmarcar)" : "Marcar con duda / revisión"}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-black" : ""}`} />
            </button>
          )}

          {/* Single Hint button */}
          <button
            type="button"
            onClick={() => setShowSingleHint(!showSingleHint)}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
              showSingleHint
                ? "bg-amber-500/15 border-amber-500 text-amber-400"
                : "bg-alt text-text-muted hover:text-text-primary border-border-subtle hover:border-border-default"
            }`}
            title="Ver justificación técnica individual / Pista"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Pista</span>
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2 options-container">
        {question.opciones.map((optText, optIdx) => {
          const letter = String.fromCharCode(97 + optIdx);
          const isCorrect = isCorrectOption(optIdx);
          const isSelected = selectedIdx === optIdx;

          // If hiding distractors, skip incorrect ones
          if (hideDistractors && !isCorrect) {
            return null;
          }

          let btnStyles =
            "border-border-default bg-alt/60 hover:bg-hover text-text-secondary";

          if (isInstant && isAnswered) {
            if (isCorrect) {
              btnStyles =
                "bg-emerald-500/20 border-emerald-500/70 text-text-primary font-bold";
            } else if (isSelected && !isCorrect) {
              btnStyles =
                "bg-red-500/20 border-red-500/70 text-text-primary line-through";
            }
          } else if (evalMode === "deferred") {
            if (isExamSubmitted) {
              if (isCorrect) {
                btnStyles =
                  "bg-emerald-500/20 border-emerald-500/70 text-text-primary font-bold";
              } else if (isSelected && !isCorrect) {
                btnStyles =
                  "bg-red-500/20 border-red-500/70 text-text-primary line-through";
              }
            } else if (isSelected) {
              btnStyles =
                "bg-amber-500/15 border-amber-500 text-text-primary font-semibold ring-1 ring-amber-500/40 shadow-xs";
            }
          }

          // Highlight correct override
          if (highlightCorrect && isCorrect && !(isInstant && isAnswered)) {
            btnStyles =
              "bg-emerald-500/15 border-emerald-500/60 text-text-primary font-bold";
          }

          const isDisabled =
            (isInstant && isAnswered) || (evalMode === "deferred" && isExamSubmitted);

          return (
            <button
              key={optIdx}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectOption(index, optIdx)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer disabled:cursor-default option-btn ${btnStyles}`}
              data-correct={isCorrect ? "true" : "false"}
            >
              <span className="font-bold text-amber-500 shrink-0 font-mono">
                {letter})
              </span>
              <span className="flex-1 leading-relaxed">{optText}</span>

              {/* Status Icons */}
              {isInstant && isAnswered && (
                <span className="shrink-0">
                  {isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                  {isSelected && !isCorrect && (
                    <XIcon className="w-4 h-4 text-red-400" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Justification Box */}
      {isJustificationVisible && (
        <div className="p-4 bg-amber-500/5 border-l-4 border-amber-500 border-t border-r border-b border-border-default rounded-xl space-y-1.5 text-xs text-text-muted leading-relaxed justification-box animate-in fade-in duration-200">
          <div className="font-bold text-amber-500 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Retroalimentación Formativa y Cita Normativa
          </div>
          <p className="text-text-secondary whitespace-pre-wrap">{question.justificacion}</p>
        </div>
      )}
    </div>
  );
};
