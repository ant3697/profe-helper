import React, { useState } from "react";
import { ZipGradeQuiz } from "../../types/omr";
import { computeClassStatistics, exportRosterToCsv, generatePrintableZipgradeSheet, printOmrHtmlDocument } from "../../utils/omrProcessor";
import {
  KeyRound,
  Camera,
  Search,
  BarChart2,
  Tag,
  Printer,
  Edit2,
  FileSpreadsheet,
  Trash2,
  Sparkles,
} from "lucide-react";

interface QuizDetailViewProps {
  quiz: ZipGradeQuiz;
  onEditQuiz: () => void;
  onOpenKeyEditor: () => void;
  onOpenLiveScanner: () => void;
  onOpenReviewDocuments: () => void;
  onOpenItemAnalysis: () => void;
  onOpenTagReport: () => void;
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const QuizDetailView: React.FC<QuizDetailViewProps> = ({
  quiz,
  onEditQuiz,
  onOpenKeyEditor,
  onOpenLiveScanner,
  onOpenReviewDocuments,
  onOpenItemAnalysis,
  onOpenTagReport,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<"detalles" | "estadisticas">("detalles");

  const stats = computeClassStatistics(quiz.scannedDocuments);
  const activeKey = quiz.keys.find((k) => k.id === quiz.activeKeyId) || quiz.keys[0];

  const handlePrintSheet = () => {
    const html = generatePrintableZipgradeSheet({
      examTitle: quiz.name,
      questionCount: quiz.totalQuestions,
      optionsCount: 5,
      includeAnswerKey: false,
    });
    const success = printOmrHtmlDocument(html);
    if (!success) {
      onShowToast("Permite ventanas emergentes para imprimir la hoja", true);
    }
  };

  const handleExportCsv = () => {
    if (quiz.scannedDocuments.length === 0) {
      onShowToast("No hay documentos escaneados para exportar", true);
      return;
    }
    exportRosterToCsv(quiz.scannedDocuments, quiz.name);
    onShowToast("Calificaciones exportadas a CSV correctamente");
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* Subheader info */}
      <div className="px-4 pt-3 pb-2 border-b border-[#232d42] bg-[#10141e] flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Nombre: </span>
          <span className="text-sm font-black text-amber-400">{quiz.name}</span>
        </div>
        <button
          type="button"
          onClick={onEditQuiz}
          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Editar información del examen"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#232d42] bg-[#10141e] px-4 pt-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("detalles")}
          className={`flex-1 py-2.5 text-xs font-black tracking-wider text-center rounded-t-xl transition-all cursor-pointer ${
            activeTab === "detalles"
              ? "bg-amber-500/15 text-amber-400 border-b-2 border-amber-500 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          DETALLES
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("estadisticas")}
          className={`flex-1 py-2.5 text-xs font-black tracking-wider text-center rounded-t-xl transition-all cursor-pointer ${
            activeTab === "estadisticas"
              ? "bg-amber-500/15 text-amber-400 border-b-2 border-amber-500 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          ESTADÍSTICAS
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "detalles" ? (
          <>
            {/* Metadata Card */}
            <div className="bg-[#121620] rounded-2xl border border-[#232d42] p-4 space-y-2.5 shadow-sm">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-400 font-medium">Clases</span>
                <span className="font-bold text-slate-100">{quiz.classes.join(", ") || "Sin clase"}</span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm border-t border-[#1e293b] pt-2.5">
                <span className="text-slate-400 font-medium">Hoja de respuestas</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{quiz.sheetType}</span>
                  <button
                    type="button"
                    onClick={handlePrintSheet}
                    className="p-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-all cursor-pointer shadow-xs"
                    title="Imprimir plantilla oficial de respuestas"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm border-t border-[#1e293b] pt-2.5">
                <span className="text-slate-400 font-medium">Fecha</span>
                <span className="font-bold text-slate-100 font-mono">{quiz.date}</span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm border-t border-[#1e293b] pt-2.5">
                <span className="text-slate-400 font-medium">Documentos escaneados</span>
                <span className="font-bold text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                  {quiz.scannedDocuments.length}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm border-t border-[#1e293b] pt-2.5">
                <span className="text-slate-400 font-medium">Preguntas</span>
                <span className="font-bold text-slate-100 font-mono">{quiz.totalQuestions}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenKeyEditor}
                className="w-full bg-[#161d2b] hover:bg-[#1e273a] border border-amber-500/30 text-amber-400 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all cursor-pointer tracking-wider uppercase"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>EDITAR CLAVE</span>
              </button>

              <button
                type="button"
                onClick={onOpenLiveScanner}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer tracking-wider uppercase"
              >
                <Camera className="w-4 h-4 text-black" />
                <span>ESCANEAR DOCUMENTOS CON CÁMARA</span>
              </button>

              <button
                type="button"
                onClick={onOpenReviewDocuments}
                className="w-full bg-[#161d2b] hover:bg-[#1e273a] border border-[#232d42] text-slate-100 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all cursor-pointer tracking-wider uppercase"
              >
                <Search className="w-4 h-4 text-amber-400" />
                <span>REVISAR DOCUMENTOS ({quiz.scannedDocuments.length})</span>
              </button>

              <button
                type="button"
                onClick={onOpenItemAnalysis}
                className="w-full bg-[#161d2b] hover:bg-[#1e273a] border border-[#232d42] text-slate-100 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all cursor-pointer tracking-wider uppercase"
              >
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>ANÁLISIS DE ELEMENTOS</span>
              </button>

              <button
                type="button"
                onClick={onOpenTagReport}
                className="w-full bg-[#161d2b] hover:bg-[#1e273a] border border-[#232d42] text-slate-100 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all cursor-pointer tracking-wider uppercase"
              >
                <Tag className="w-4 h-4 text-amber-400" />
                <span>INFORME DE ETIQUETAS (RA / CE)</span>
              </button>
            </div>
          </>
        ) : (
          /* ESTADÍSTICAS TAB */
          <div className="space-y-4">
            {quiz.scannedDocuments.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-[#232d42] rounded-2xl bg-[#121620]">
                <BarChart2 className="w-10 h-10 mx-auto text-slate-500 mb-3 opacity-40" />
                <h4 className="text-sm font-bold text-slate-200">Sin documentos escaneados</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Escanee exámenes con la cámara o cargue fotos para ver las estadísticas del grupo.
                </p>
                <button
                  type="button"
                  onClick={onOpenLiveScanner}
                  className="mt-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 shadow-md shadow-amber-500/20"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Escanear Primer Examen</span>
                </button>
              </div>
            ) : (
              <>
                {/* Statistics Table */}
                <div className="bg-[#121620] rounded-2xl border border-[#232d42] overflow-hidden shadow-xs">
                  <div className="grid grid-cols-3 bg-[#161c28] px-4 py-2.5 text-xs font-black text-slate-400 border-b border-[#232d42]">
                    <div>Métrica</div>
                    <div className="text-right">Puntaje</div>
                    <div className="text-right">Por ciento</div>
                  </div>

                  <div className="divide-y divide-[#1e293b] text-sm font-medium text-slate-200">
                    <div className="grid grid-cols-3 px-4 py-2.5 items-center">
                      <span className="text-slate-400 font-semibold">Puntaje mín.</span>
                      <span className="text-right font-bold text-slate-100">{stats.minScore.toFixed(1).replace(".", ",")}</span>
                      <span className="text-right font-semibold text-slate-400">{stats.minPercent.toFixed(1).replace(".", ",")}%</span>
                    </div>

                    <div className="grid grid-cols-3 px-4 py-2.5 items-center">
                      <span className="text-slate-400 font-semibold">Puntaje máx.</span>
                      <span className="text-right font-bold text-slate-100">{stats.maxScore.toFixed(1).replace(".", ",")}</span>
                      <span className="text-right font-semibold text-slate-400">{stats.maxPercent.toFixed(1).replace(".", ",")}%</span>
                    </div>

                    <div className="grid grid-cols-3 px-4 py-2.5 items-center bg-amber-500/10">
                      <span className="text-amber-400 font-bold">Promedio</span>
                      <span className="text-right font-black text-amber-400">{stats.averageScore.toFixed(1).replace(".", ",")}</span>
                      <span className="text-right font-black text-amber-400">{stats.averagePercent.toFixed(1).replace(".", ",")}%</span>
                    </div>

                    <div className="grid grid-cols-3 px-4 py-2.5 items-center">
                      <span className="text-slate-400 font-semibold">Mediana</span>
                      <span className="text-right font-bold text-slate-100">{stats.medianScore.toFixed(1).replace(".", ",")}</span>
                      <span className="text-right font-semibold text-slate-400">{stats.medianPercent.toFixed(1).replace(".", ",")}%</span>
                    </div>

                    <div className="grid grid-cols-3 px-4 py-2.5 items-center">
                      <span className="text-slate-400 font-semibold">Std. Desviación</span>
                      <span className="text-right font-bold text-slate-100">{stats.standardDeviation.toFixed(1).replace(".", ",")}</span>
                      <span className="text-right font-semibold text-slate-400">{stats.standardDeviationPercent.toFixed(1).replace(".", ",")}%</span>
                    </div>
                  </div>
                </div>

                {/* Summary badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Aprobados
                    </span>
                    <span className="text-2xl font-black text-emerald-400">
                      {stats.passedCount} <span className="text-xs text-slate-400 font-normal">({stats.passPercentage}%)</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                      Suspensos
                    </span>
                    <span className="text-2xl font-black text-rose-400">
                      {stats.failedCount} <span className="text-xs text-slate-400 font-normal">({(100 - stats.passPercentage).toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>

                {/* Export & Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex-1 bg-[#161c28] hover:bg-[#1e273a] border border-[#232d42] text-slate-100 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Exportar CSV (Excel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenItemAnalysis}
                    className="flex-1 bg-[#161c28] hover:bg-[#1e273a] border border-[#232d42] text-slate-100 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <BarChart2 className="w-4 h-4 text-amber-400" />
                    <span>Ver Análisis Detallado</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
