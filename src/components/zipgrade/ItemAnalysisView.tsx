import React, { useState } from "react";
import { ZipGradeQuiz } from "../../types/omr";
import { computeItemAnalysis } from "../../utils/omrProcessor";
import { BarChart3, Filter, CheckCircle2, AlertTriangle, ArrowUpDown } from "lucide-react";

interface ItemAnalysisViewProps {
  quiz: ZipGradeQuiz;
}

export const ItemAnalysisView: React.FC<ItemAnalysisViewProps> = ({ quiz }) => {
  const [sortBy, setSortBy] = useState<"number" | "hardest" | "easiest">("number");

  const activeKey = quiz.keys.find((k) => k.id === quiz.activeKeyId) || quiz.keys[0];
  const items = computeItemAnalysis(
    quiz.totalQuestions,
    activeKey?.answers || {},
    quiz.scannedDocuments,
    activeKey?.points || {},
    activeKey?.tags || {}
  );

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "hardest") return a.correctPercent - b.correctPercent;
    if (sortBy === "easiest") return b.correctPercent - a.correctPercent;
    return a.questionNumber - b.questionNumber;
  });

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* Top Filter Bar */}
      <div className="p-3.5 bg-[#10141e] border-b border-[#232d42] flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400">
          {quiz.scannedDocuments.length} Exámenes analizados
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
          >
            <option value="number">Nº Pregunta (1..N)</option>
            <option value="hardest">Mayor % Error (Más difíciles)</option>
            <option value="easiest">Mayor % Acierto (Más fáciles)</option>
          </select>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedItems.map((item) => {
          const isHard = item.correctPercent < 50;
          const isExcellent = item.correctPercent >= 80;

          return (
            <div
              key={item.questionNumber}
              className="p-4 rounded-2xl border border-[#232d42] bg-[#121620] hover:border-amber-500/40 transition-all shadow-md space-y-3"
            >
              {/* Question header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#1a2233] border border-[#2e3e5c] flex items-center justify-center text-xs font-black font-mono text-amber-400">
                    P{item.questionNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    Respuesta correcta:{" "}
                    <strong className="text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
                      {item.correctAnswer}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                      isExcellent
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : isHard
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {item.correctPercent}% Aciertos
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    ({item.correctCount}/{item.totalAnswers})
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#161c28] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isExcellent ? "bg-emerald-500" : isHard ? "bg-rose-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${item.correctPercent}%` }}
                />
              </div>

              {/* Distribution of options A, B, C, D, E, Blank */}
              <div className="grid grid-cols-6 gap-1.5 pt-1 text-center font-mono text-xs">
                {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                  const isCorrect = item.correctAnswer === letter;
                  const count = item.distribution[letter];
                  return (
                    <div
                      key={letter}
                      className={`p-2 rounded-xl border transition-all ${
                        isCorrect
                          ? "border-amber-500/60 bg-amber-500/15 text-amber-400 font-black shadow-xs"
                          : "border-[#232d42] bg-[#161c28] text-slate-400"
                      }`}
                    >
                      <div className="font-bold">{letter}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{count}</div>
                    </div>
                  );
                })}
                <div className="p-2 rounded-xl border border-[#232d42] bg-[#161c28] text-slate-400">
                  <div className="font-bold text-[11px]">Blanco</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.distribution.blank}</div>
                </div>
              </div>

              {/* Tags if any */}
              {item.tags.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold">Criterios:</span>
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2 py-0.5 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
