import React from "react";
import { ZipGradeQuiz } from "../../types/omr";
import { computeTagReport } from "../../utils/omrProcessor";
import { Tag, CheckCircle2, AlertCircle, TrendingUp, Layers } from "lucide-react";

interface TagReportViewProps {
  quiz: ZipGradeQuiz;
}

export const TagReportView: React.FC<TagReportViewProps> = ({ quiz }) => {
  const activeKey = quiz.keys.find((k) => k.id === quiz.activeKeyId) || quiz.keys[0];
  const tagRows = computeTagReport(
    quiz.totalQuestions,
    activeKey?.answers || {},
    quiz.scannedDocuments,
    activeKey?.points || {},
    activeKey?.tags || {}
  );

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* Subheader */}
      <div className="p-3.5 bg-[#10141e] border-b border-[#232d42] flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400">
          Informe de Resultados de Aprendizaje y Criterios (RA / CE)
        </span>
        <span className="text-xs text-slate-400">
          {tagRows.length} Criterios evaluados
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tagRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Tag className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-sm font-bold text-slate-200">Sin criterios asignados a las preguntas</p>
            <p className="text-xs mt-1 text-slate-400 max-w-sm mx-auto">
              En "EDITAR CLAVE", pulse el icono de información en cada pregunta para asignarle criterios curriculares (ej. RA04, CE4.a).
            </p>
          </div>
        ) : (
          tagRows.map((row) => (
            <div
              key={row.tag}
              className="p-4 rounded-2xl border border-[#232d42] bg-[#121620] hover:border-amber-500/40 transition-all shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    <Tag className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-100">{row.tag}</h4>
                    <span className="text-xs text-slate-400">
                      Preguntas: {row.questions.map((q) => `P${q}`).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black px-2.5 py-1 rounded-xl border ${
                      row.status === "high"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : row.status === "medium"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {row.masteryPercent}% Dominio
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {row.earnedPoints} / {row.totalPossiblePoints} pts
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-[#161c28] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    row.status === "high"
                      ? "bg-emerald-500"
                      : row.status === "medium"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${row.masteryPercent}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
