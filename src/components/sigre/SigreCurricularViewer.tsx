import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Eye,
  Sparkles,
  Layers,
  GraduationCap,
  Scale,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  ListOrdered,
  Cpu,
  Bookmark,
  Share2,
  Users,
  Target,
  FileCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SigreUDItem, SigreCurricularConfig, SigreUDCurricularData } from "../../types/sigre";
import {
  cleanSigreCurricularData,
  renderSigreUDCurricularA4Html,
  cleanSigreLatexMath,
} from "../../utils/sigrePromptGenerator";
import { exportHtmlToDocx } from "../../utils/docxExport";
import { preparePrintableHtmlDocument } from "../../utils/topicPromptGenerator";

interface SigreCurricularViewerProps {
  ud: SigreUDItem;
  config: SigreCurricularConfig;
  theme: "dark" | "light";
  isGenerating?: boolean;
  onGenerateFull?: () => void;
  onGenerateSection?: (sectionKey: "contexto_justificacion" | "competencias_objetivos" | "contenidos_transversales" | "metodologia_diversidad" | "secuenciacion_actividades" | "evaluacion_criterios" | "recursos_bibliografia") => void;
  onUpdateData?: (updatedData: SigreUDCurricularData) => void;
}

export const SigreCurricularViewer: React.FC<SigreCurricularViewerProps> = ({
  ud,
  config,
  theme,
  isGenerating = false,
  onGenerateFull,
  onGenerateSection,
  onUpdateData,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"sheet" | "structured" | "edit">("sheet");
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  const rawCurricular = ud.data?.udCurricular;
  const curricularData: SigreUDCurricularData | undefined = rawCurricular
    ? cleanSigreCurricularData(rawCurricular)
    : undefined;

  const handleCopyHtml = () => {
    if (!curricularData) return;
    const html = renderSigreUDCurricularA4Html(ud, curricularData, config);
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!curricularData) return;
    const html = renderSigreUDCurricularA4Html(ud, curricularData, config);
    const printDoc = preparePrintableHtmlDocument(
      html,
      `UD Curricular Nº ${ud.number} - ${ud.title}`
    );

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printDoc);
      printWin.document.close();
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 400);
    }
  };

  const handleExportDocx = async () => {
    if (!curricularData) return;
    const html = renderSigreUDCurricularA4Html(ud, curricularData, config);
    await exportHtmlToDocx(
      html,
      `UD_Curricular_${ud.number}_${ud.title.replace(/[^a-zA-Z0-9]/g, "_")}.docx`
    );
  };

  // If no data generated yet
  if (!curricularData) {
    return (
      <div className={`p-8 rounded-xl border text-center ${
        theme === "dark" ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
      } shadow-sm`}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold mb-2">Unidad Didáctica Curricular (19 Puntos Oficiales)</h3>
        <p className="text-sm max-w-xl mx-auto mb-6 text-slate-500 dark:text-slate-400">
          Esta unidad curricular es paralela a la UD de aula y genera la matriz curricular oficial de 2 páginas con los 19 apartados normativos exigidos (RD 659/2023): justificación, RAs, competencias, contenidos integrados, DUA, actividades I-D-R-Rf-A-E y evaluación ponderada.
        </p>

        {onGenerateFull && (
          <button
            onClick={onGenerateFull}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generando UD Curricular...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generar UD Curricular (19 Apartados)</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className={`p-4 rounded-xl border ${
        theme === "dark" ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200"
      } shadow-sm flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-base border border-amber-500/20">
            UD {ud.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{ud.title}</h2>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Ficha Curricular (19 Puntos)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {config.moduloFormativo} • {config.curso || "1º curso"} {config.cicloFormativo} • {curricularData.temporalizacion?.horas || ud.horasEstimadas || 11}h ({curricularData.temporalizacion?.sesiones || ud.sesionesEstimadas || 4} sesiones) • Trimestre {curricularData.temporalizacion?.trimestre || "1º"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode("sheet")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === "sheet"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Ficha A4 Oficial
            </button>
            <button
              onClick={() => setViewMode("structured")}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === "structured"
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Estructura 19 Puntos
            </button>
          </div>

          {/* Regenerate Section Dropdown */}
          {onGenerateSection && (
            <div className="relative">
              <button
                onClick={() => setShowSectionMenu(!showSectionMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                title="Regenerar un bloque curricular específico"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Por Apartados</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showSectionMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 text-xs">
                  <div className="px-3 py-1.5 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                    Regenerar por Bloques
                  </div>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("contexto_justificacion");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>1-4: Contexto y Justificación</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("competencias_objetivos");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>5-9: Competencias, RAs y Objetivos</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("contenidos_transversales");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>10-11: Contenidos y Transversales</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("metodologia_diversidad");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>12-13: Metodología y DUA</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("secuenciacion_actividades");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>14: Actividades (I, D, R, Rf, A, E)</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("evaluacion_criterios");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>15-17: Evaluación y Criterios</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSectionMenu(false);
                      onGenerateSection("recursos_bibliografia");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 flex items-center justify-between"
                  >
                    <span>18-19: Recursos y Bibliografía</span>
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Regenerate Full Button */}
          {onGenerateFull && (
            <button
              onClick={onGenerateFull}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50"
              title="Regenerar Ficha Curricular Completa"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Generando..." : "Regenerar Completa"}</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Copiar HTML maquetado al portapapeles"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "¡Copiado!" : "Copiar"}</span>
          </button>

          {/* Export Docx */}
          <button
            onClick={handleExportDocx}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Descargar como documento Word (.docx)"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Word</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Imprimir o guardar en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-purple-500" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      {viewMode === "sheet" ? (
        <div className={`p-6 rounded-xl border ${
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
        } shadow-inner overflow-x-auto`}>
          <div
            className="max-w-[920px] mx-auto bg-white p-6 rounded-lg shadow-lg border border-slate-300"
            dangerouslySetInnerHTML={{
              __html: renderSigreUDCurricularA4Html(ud, curricularData, config),
            }}
          />
        </div>
      ) : (
        /* Structured 19 Points Accordion View */
        <div className="space-y-4">
          
          {/* Bloque 1: Puntos 1 al 4 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque I: Marco General, Contexto y Justificación (Puntos 1-4)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">1. ÍNDICE GENERAL DEL TEMA:</span>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  {(curricularData.indiceGeneral || [
                    "1. ÍNDICE GENERAL DEL TEMA", "2. TEMPORALIZACIÓN", "3. CONTEXTUALIZACIÓN", "4. JUSTIFICACIÓN Y NORMATIVA",
                    "5. CONTRIBUCIÓN A OBJETIVOS", "6. COMPETENCIAS BÁSICAS", "7. RESULTADOS DE APRENDIZAJE", "8. COMPETENCIAS PROFESIONALES",
                    "9. OBJETIVOS DE APRENDIZAJE", "10. CONTENIDOS INTEGRADOS", "11. TEMAS TRANSVERSALES", "12. METODOLOGÍA Y TIC",
                    "13. ATENCIÓN A LA DIVERSIDAD", "14. SECUENCIACIÓN ACTIVIDADES", "15. EVALUACIÓN", "16. INSTRUMENTOS DE EVALUACIÓN",
                    "17. CRITERIOS PONDERADOS", "18. MATERIALES Y RECURSOS", "19. BIBLIOGRAFÍA Y WEBGRAFÍA"
                  ]).map((item, idx) => (
                    <li key={idx}>{item.replace(/^\d+[\.\)]\s*/, "")}</li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">2. TEMPORALIZACIÓN:</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Horas:</strong> {curricularData.temporalizacion?.horas || 11}h ({curricularData.temporalizacion?.sesiones || 4} sesiones de ~2-3h) • <strong>Fecha:</strong> {curricularData.temporalizacion?.fechaRealizacion} • <strong>Trimestre:</strong> {curricularData.temporalizacion?.trimestre}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">3. CONTEXTUALIZACIÓN:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                    {curricularData.contextualizacion}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">4. JUSTIFICACIÓN Y NORMATIVA:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                    {curricularData.justificacionNormativa}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Puntos 5 al 9 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque II: Competencias, Resultados de Aprendizaje y Objetivos (Puntos 5-9)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">5. CONTRIBUCIÓN A OBJETIVOS GENERALES:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {curricularData.contribucionObjetivosGenerales}
                </p>

                <span className="font-bold text-blue-600 dark:text-blue-400 block mt-3 mb-1">6. COMPETENCIAS BÁSICAS:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(curricularData.competenciasBasicas || []).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">7. RESULTADOS DE APRENDIZAJE:</span>
                <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                  {(curricularData.resultadosAprendizaje || []).map((ra, i) => (
                    <p key={i} className="font-semibold">{ra}</p>
                  ))}
                </div>

                <span className="font-bold text-blue-600 dark:text-blue-400 block mt-3 mb-1">8. COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {curricularData.contribucionCompetenciasProfesionales}
                </p>

                <span className="font-bold text-blue-600 dark:text-blue-400 block mt-3 mb-1">9. OBJETIVOS DE APRENDIZAJE (OPERATIVOS):</span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(curricularData.objetivosAprendizaje || []).map((obj, i) => (
                    <li key={i}>{obj.replace(/^\d+[\.\)]\s*/, "")}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Bloque 3: Puntos 10 y 11 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque III: Contenidos Integrados y Temas Transversales (Puntos 10-11)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs mb-3">
              <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">📘 Conceptuales</span>
                <ul className="list-disc pl-3 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                  {(curricularData.contenidosIntegrados?.conceptuales || []).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">🛠️ Procedimentales</span>
                <ul className="list-disc pl-3 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                  {(curricularData.contenidosIntegrados?.procedimentales || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50">
                <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1">🤝 Actitudinales</span>
                <ul className="list-disc pl-3 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                  {(curricularData.contenidosIntegrados?.actitudinales || []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">🏛️ Ref. Autonómicas</span>
                <ul className="list-disc pl-3 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                  {(curricularData.contenidosIntegrados?.peculiaridadesAutonomicas || []).map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50">
                <span className="font-bold text-cyan-700 dark:text-cyan-300 block mb-1">🌱 Transversales</span>
                <ul className="list-disc pl-3 space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                  {(curricularData.contenidosIntegrados?.temasTransversales || []).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>

            {curricularData.temasTransversalesTexto && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">11. TEMAS TRANSVERSALES Y EDUCACIÓN EN VALORES:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {curricularData.temasTransversalesTexto}
                </p>
              </div>
            )}
          </div>

          {/* Bloque 4: Puntos 12 y 13 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Cpu className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque IV: Metodología, TIC y Atención a la Diversidad (Puntos 12-13)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">12. METODOLOGÍA Y USO DE LAS TIC:</span>
                <p><strong>Metodologías Activas:</strong> {curricularData.metodologiaTic?.metodologiasActivas}</p>
                {curricularData.metodologiaTic?.flippedClassroom && <p><strong>Flipped Classroom:</strong> {curricularData.metodologiaTic.flippedClassroom}</p>}
                {curricularData.metodologiaTic?.duaMetodologia && <p><strong>DUA:</strong> {curricularData.metodologiaTic.duaMetodologia}</p>}
                {curricularData.metodologiaTic?.innovacionIa && <p><strong>Innovación / IA:</strong> {curricularData.metodologiaTic.innovacionIa}</p>}
                {curricularData.metodologiaTic?.secuenciacionMetodologica && <p className="text-purple-600 dark:text-purple-400 font-semibold"><strong>Secuenciación:</strong> {curricularData.metodologiaTic.secuenciacionMetodologica}</p>}
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">13. ATENCIÓN A LA DIVERSIDAD:</span>
                <p><strong>DUA:</strong> {curricularData.atencionDiversidad?.dua}</p>
                {curricularData.atencionDiversidad?.multinivel && <p><strong>Multinivel:</strong> {curricularData.atencionDiversidad.multinivel}</p>}
                <p><strong>Refuerzo:</strong> {curricularData.atencionDiversidad?.refuerzo}</p>
                <p><strong>Ampliación:</strong> {curricularData.atencionDiversidad?.ampliacion}</p>
                {curricularData.atencionDiversidad?.accesibilidad && <p><strong>Accesibilidad:</strong> {curricularData.atencionDiversidad.accesibilidad}</p>}
              </div>
            </div>
          </div>

          {/* Bloque 5: Punto 14 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque V: Temporalización y Secuenciación de Actividades (Punto 14)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-700 dark:text-amber-300 block mb-2">
                  Iniciación / Desarrollo {curricularData.secuenciacionActividades?.iniciacionDesarrollo?.horas}
                </span>
                <div className="space-y-2">
                  {(curricularData.secuenciacionActividades?.iniciacionDesarrollo?.actividades || []).map((act, i) => (
                    <div key={i} className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-amber-600 dark:text-amber-400">{act.codigo}:</span> {act.nombre}
                      {act.descripcion && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{act.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-blue-700 dark:text-blue-300 block mb-2">
                  Repaso / Refuerzo {curricularData.secuenciacionActividades?.repasoRefuerzo?.horas}
                </span>
                <div className="space-y-2">
                  {(curricularData.secuenciacionActividades?.repasoRefuerzo?.actividades || []).map((act, i) => (
                    <div key={i} className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{act.codigo}:</span> {act.nombre}
                      {act.descripcion && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{act.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-2">
                  Ampliación / Evaluación {curricularData.secuenciacionActividades?.ampliacionEvaluacion?.horas}
                </span>
                <div className="space-y-2">
                  {(curricularData.secuenciacionActividades?.ampliacionEvaluacion?.actividades || []).map((act, i) => (
                    <div key={i} className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{act.codigo}:</span> {act.nombre}
                      {act.descripcion && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{act.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 6: Puntos 15 al 17 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque VI: Evaluación, Instrumentos y Criterios Ponderados (Puntos 15-17)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">15. EVALUACIÓN:</span>
                <p><strong>Inicial:</strong> {curricularData.evaluacion?.inicial}</p>
                <p><strong>Parcial:</strong> {curricularData.evaluacion?.parcial}</p>
                <p><strong>Final:</strong> {curricularData.evaluacion?.final}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">16. INSTRUMENTOS:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(curricularData.instrumentosEvaluacion || []).map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">17. CRITERIOS PONDERADOS:</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                  {curricularData.criteriosEvaluacionPonderados?.raGlobal}
                </div>
                <div className="space-y-1.5">
                  {(curricularData.criteriosEvaluacionPonderados?.criterios || []).map((crit, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
                      <span><strong>{crit.criterio}</strong> {crit.descripcion}</span>
                      <span className="font-black text-rose-600 dark:text-rose-400 ml-2">{crit.peso}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 7: Puntos 18 y 19 */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"} shadow-xs`}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Bookmark className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Bloque VII: Materiales, Recursos y Bibliografía (Puntos 18-19)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">18. MATERIALES Y RECURSOS:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(curricularData.materialesRecursos || []).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">19. BIBLIOGRAFÍA Y WEBGRAFÍA:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(curricularData.bibliografiaWebgrafia || []).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
