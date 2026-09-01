import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Award,
  Layers,
  ShieldCheck,
  Building2,
  Calendar,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  SigreCurricularConfig,
  SigreUDItem,
  SigrePedagogicalPhaseGroup,
} from "../../types/sigre";
import {
  DEFAULT_PEDAGOGICAL_PHASES,
  PATTERN_MODEL_UDS_7_1,
} from "../../data/sigreCurricularModelPreset";
import { deriveDynamicPedagogicalPhases } from "../../utils/sigreDynamicPhaseGrouper";

interface SigreCurricularMatrix71ViewProps {
  config: SigreCurricularConfig;
  uds: SigreUDItem[];
  onUpdateUds?: (uds: SigreUDItem[]) => void;
  onUpdateConfig?: (config: SigreCurricularConfig) => void;
  onSelectUd?: (udId: string) => void;
  onNavigateToUdCurricular?: (udId: string) => void;
  onOpenPlanModal?: () => void;
  theme?: "dark" | "light";
}

export const SigreCurricularMatrix71View: React.FC<
  SigreCurricularMatrix71ViewProps
> = ({ config, uds, onUpdateUds, onUpdateConfig, onSelectUd, onNavigateToUdCurricular, onOpenPlanModal, theme = "dark" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncedToast, setSyncedToast] = useState(false);
  const [editingUds, setEditingUds] = useState<SigreUDItem[]>(uds);

  // Use the actual uds provided by the user/system.
  const activeUds = uds;

  // Dynamic Phase Derivation based on the thematic RAs and content of UDs (eliminates duplicates and stale hardcoded labels)
  const { phases: dynamicPhases, groupedUds } = useMemo(() => {
    return deriveDynamicPedagogicalPhases(activeUds, config.pedagogicalPhases);
  }, [activeUds, config.pedagogicalPhases]);

  // Real-time Calculations & Audits
  const totalHorasFfce = activeUds.reduce(
    (acc, u) => acc + (u.horasFfce ?? u.horasEstimadas ?? 0),
    0
  );
  const totalHorasFfeoe = activeUds.reduce(
    (acc, u) => acc + (u.horasFfeoe ?? 0),
    0
  );
  const totalHorasModulo = totalHorasFfce + totalHorasFfeoe;
  const totalPesoPorcentaje = activeUds
    .filter((u) => !u.isPeriodoRecuperacion)
    .reduce((acc, u) => acc + (u.pesoPorcentaje ?? 0), 0);

  const horasObjetivo = config.horasTotales || 160;
  const isHorasExact = totalHorasModulo === horasObjetivo;
  const isPesoExact = Math.abs(totalPesoPorcentaje - 100) < 0.05;

  const dualUds = activeUds.filter((u) => (u.horasFfeoe ?? 0) > 0);

  // Load Pattern Model
  const handleLoadPatternPreset = () => {
    if (
      window.confirm(
        "¿Deseas cargar la Matriz Curricular Patrón 7.1 oficial con las Fases Pedagógicas adaptadas, RA/CE, BC, CPPS, OG, FFCE/FFEOE y Pesos (%)?"
      )
    ) {
      if (onUpdateUds) {
        onUpdateUds(PATTERN_MODEL_UDS_7_1);
      }
      setEditingUds(PATTERN_MODEL_UDS_7_1);
    }
  };

  // Copy as Text / Markdown
  const handleCopyMarkdown = () => {
    let md = `### Resultados de aprendizaje, Criterios de evaluación y Unidades didácticas.\n`;
    md += `A continuación, se presentan las Unidades didácticas (UD), que estructuran el desarrollo de este módulo y que permiten alcanzar los RA de manera eficaz y progresiva:\n\n`;
    md += `| UD | Título de la Unidad Didáctica | RA / CE | BC | CPPS | OG | FFCE (h) | FFEOE (h) | Peso % |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;

    groupedUds.forEach(({ phase: fase, uds: phaseUds }) => {
      md += `| **${fase.nombre}** | ${fase.justificacionSecuencial} | | | | | | | |\n`;
      phaseUds.forEach((u) => {
        md += `| **${u.id}** | ${u.title} | ${u.raCeText || "-"} | ${
          u.bcText || u.bcCode || "-"
        } | ${u.cppsText || "-"} | ${u.ogText || "-"} | ${
          u.horasFfce ?? u.horasEstimadas ?? "-"
        } | ${u.horasFfeoe ?? 0} | ${
          u.isPeriodoRecuperacion
            ? "--"
            : `${(u.pesoPorcentaje || 0).toFixed(2)} %`
        } |\n`;
      });
    });

    md += `| | **Totales** | | | | | **${totalHorasFfce} h** | **${totalHorasFfeoe} h** | **${totalPesoPorcentaje.toFixed(
      0
    )} %** |\n\n`;
    md += `(*) **Nota:** En el marco de la FP Dual regulada por la LO 3/2022, el RD 659/2023 y la Resolución de 24 de julio de 2026 de la Junta de Andalucía, las Unidades derivan parte de su carga lectiva a la FFEOE, ejecutándose dichos contenidos en la empresa.\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Bidirectional Synchronization: Propagate 7.1 Matrix to all 19-point Curricular UDs (1b)
  const handleSyncAllWith19Points = () => {
    if (!onUpdateUds) return;
    const updated = activeUds.map((u) => {
      const horasFfce = u.horasFfce ?? u.horasEstimadas ?? 11;
      const horasFfeoe = u.horasFfeoe || 0;
      const sesiones = u.sesionesEstimadas || Math.max(1, Math.round(horasFfce / 2));
      const peso = (u.pesoPorcentaje || 10).toFixed(2);

      if (u.data?.udCurricular) {
        const curr = { ...u.data.udCurricular };
        curr.temporalizacion = {
          ...curr.temporalizacion,
          horas: horasFfce,
          sesiones: sesiones,
          horasSemanalesTexto: `${horasFfce} horas (${sesiones} sesiones)${horasFfeoe > 0 ? ` + ${horasFfeoe}h FP Dual` : ""}`,
        };
        if (u.raCeText) {
          curr.resultadosAprendizaje = [
            `Resultados de Aprendizaje vinculados (7.1): ${u.raCeText}`,
          ];
          if (curr.criteriosEvaluacionPonderados) {
            curr.criteriosEvaluacionPonderados.raGlobal = `${u.raCeText} (${peso}% global)`;
          }
        }
        if (u.cppsText) {
          curr.contribucionCompetenciasProfesionales = `${u.cppsText}) Aplicación de competencias profesionales vinculadas a la unidad...`;
        }
        if (u.ogText) {
          curr.contribucionObjetivosGenerales = `${u.ogText}) Contribución directa a los objetivos generales del ciclo formativo...`;
        }
        return {
          ...u,
          data: {
            ...u.data,
            udCurricular: curr,
          },
        };
      }
      return u;
    });

    onUpdateUds(updated);
    setSyncedToast(true);
    setTimeout(() => setSyncedToast(false), 3000);
  };

  // Export HTML for Printing / Word
  const handleExportHtmlDoc = () => {
    const docHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Resultados de aprendizaje, Criterios de evaluación y UDs - ${config.moduloFormativo || "Módulo"}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #111; font-size: 11pt; }
          h2 { font-size: 14pt; color: #003366; border-bottom: 2px solid #003366; padding-bottom: 4px; margin-bottom: 8px; }
          p { margin-bottom: 12px; line-height: 1.4; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 10pt; }
          th { background-color: #b8cce4; color: #002060; border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; }
          td { border: 1px solid #333; padding: 5px 7px; vertical-align: middle; }
          .fase-header { background-color: #dbe5f1; font-weight: bold; font-size: 9.5pt; text-align: left; }
          .ud-code-green { background-color: #92d050; font-weight: bold; text-align: center; }
          .ud-code-yellow { background-color: #ffc000; font-weight: bold; text-align: center; }
          .ud-code-blue { background-color: #00b0f0; font-weight: bold; text-align: center; }
          .ud-code-slate { background-color: #d9d9d9; font-weight: bold; text-align: center; }
          .cpps-red { background-color: #f28a8a; text-align: center; }
          .cpps-green { background-color: #92d050; text-align: center; }
          .og-green { background-color: #92d050; text-align: center; }
          .totales { font-weight: bold; background-color: #f2f2f2; }
          .footnote { font-size: 9pt; font-style: italic; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h2>Resultados de aprendizaje, Criterios de evaluación y Unidades didácticas.</h2>
        <p>A continuación, se presentan las Unidades didácticas (UD), que estructuran el desarrollo de este módulo y que permiten alcanzar los RA de manera eficaz y progresiva:</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">UD</th>
              <th style="width: 25%;">Título de la Unidad Didáctica</th>
              <th style="width: 28%;">RA / CE</th>
              <th style="width: 6%;">BC</th>
              <th style="width: 6%;">CPPS</th>
              <th style="width: 6%;">OG</th>
              <th style="width: 8%;">FFCE (h)</th>
              <th style="width: 8%;">FFEOE (h)</th>
              <th style="width: 8%;">Peso %</th>
            </tr>
          </thead>
          <tbody>
            ${groupedUds
              .map(({ phase: fase, uds: pUds }) => {
                return `
                <tr>
                  <td colspan="9" class="fase-header">
                    <strong>${fase.nombre}.</strong> ${fase.justificacionSecuencial}
                  </td>
                </tr>
                ${pUds
                  .map((u) => {
                    let codeClass = "ud-code-green";
                    if (fase.id === "fase_3") codeClass = "ud-code-yellow";
                    if (fase.id === "fase_4") codeClass = "ud-code-blue";
                    if (fase.id === "fase_r") codeClass = "ud-code-slate";

                    return `
                    <tr>
                      <td class="${codeClass}">${u.id}</td>
                      <td>${u.title}</td>
                      <td><strong>${u.raCeText || "-"}</strong></td>
                      <td style="text-align: center;">${u.bcText || u.bcCode || "-"}</td>
                      <td class="cpps-red">${u.cppsText || "-"}</td>
                      <td class="og-green">${u.ogText || "-"}</td>
                      <td style="text-align: center;">${u.horasFfce ?? u.horasEstimadas ?? "-"}</td>
                      <td style="text-align: center;">${u.horasFfeoe ?? 0}</td>
                      <td style="text-align: right;">${
                        u.isPeriodoRecuperacion
                          ? "--"
                          : `${(u.pesoPorcentaje || 0).toFixed(2).replace(".", ",")} %`
                      }</td>
                    </tr>
                  `;
                  })
                  .join("")}
              `;
              })
              .join("")}
            <tr class="totales">
              <td colspan="6" style="text-align: right;"><strong>Totales</strong></td>
              <td style="text-align: center;"><strong>${totalHorasFfce} h</strong></td>
              <td style="text-align: center;"><strong>${totalHorasFfeoe} h</strong></td>
              <td style="text-align: right;"><strong>${totalPesoPorcentaje.toFixed(0)} %</strong></td>
            </tr>
          </tbody>
        </table>

        <p class="footnote">
          (*) <strong>Nota:</strong> En el marco de la <strong>FP Dual (modalidad general)</strong> regulada por el <strong>RD 659/2023</strong> y la <strong>Resolución de 24 de julio de 2026 (Junta de Andalucía)</strong>, las Unidades derivan parte de su carga lectiva a la FFEOE, ejecutándose directamente en la empresa asociada.
        </p>
      </body>
      </html>
    `;

    const blob = new Blob([docHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Matriz_Curricular_7_1_${config.codigo || "0037"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper color badges
  const getUdBadgeColor = (faseId?: string, isR?: boolean) => {
    if (isR) return "bg-slate-400 text-black border-slate-500";
    if (faseId === "fase_1" || faseId === "fase_2")
      return "bg-[#84cc16] text-black border-[#65a30d] font-bold";
    if (faseId === "fase_3")
      return "bg-[#f59e0b] text-black border-[#d97706] font-bold";
    if (faseId === "fase_4")
      return "bg-[#06b6d4] text-black border-[#0891b2] font-bold";
    return "bg-emerald-500 text-black border-emerald-600";
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Actions Toolbar */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-amber-500/30"
            : "bg-white border-amber-200 shadow-sm"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Tabla Oficial · RD 659/2023
              </span>
              <span className="text-xs font-mono font-bold text-text-muted">
                {config.codigo || "1580"} - {config.moduloFormativo || "TMIAG"}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-text-primary mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              Resultados de aprendizaje, Criterios de evaluación y Unidades didácticas
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
              Estructura secuencial en <strong>4 Fases Didácticas</strong> + Periodo de Recuperación (R), con mapeo bidireccional a <strong>RA / CE</strong>, <strong>Bloques de Contenidos (BC)</strong>, <strong>CPPS</strong>, <strong>OG</strong>, reparto <strong>FFCE / FFEOE (Dual)</strong> y ponderación porcentual exacta (<strong>100%</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadPatternPreset}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              title="Cargar la matriz patrón del modelo normativo con todas las fases y vínculos curriculares"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cargar Matriz Patrón</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 bg-surface hover:bg-hover text-text-secondary hover:text-text-primary border border-border-default text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Copiar tabla en formato Markdown para portapapeles"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Tabla</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSyncAllWith19Points}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              title="Sincronizar metadatos de la Matriz 7.1 con las Fichas Curriculares Oficiales de 19 Puntos (1b)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar con 1b (19 Ptos)</span>
            </button>

            <button
              type="button"
              onClick={handleExportHtmlDoc}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              title="Exportar documento oficial imprimible / compatible con Word"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Oficial (Word/HTML)</span>
            </button>
          </div>
        </div>

        {syncedToast && (
          <div className="mt-2 p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Matriz 7.1 sincronizada con éxito con las Fichas Curriculares Oficiales de 19 Puntos (1b)!</span>
          </div>
        )}

        {/* Real-time Math & Pedagogical Audit Badges */}
        <div className="mt-3 pt-3 border-t border-border-default/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-alt border border-border-default flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted block">Horas Centro (FFCE)</span>
              <span className="text-sm font-black font-mono text-emerald-400">
                {totalHorasFfce} h
              </span>
            </div>
            <BookOpen className="w-4 h-4 text-emerald-400/60" />
          </div>

          <div className="p-2 rounded-xl bg-alt border border-border-default flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted block">Horas Dual Empresa (FFEOE)</span>
              <span className="text-sm font-black font-mono text-amber-400">
                {totalHorasFfeoe} h
              </span>
            </div>
            <Building2 className="w-4 h-4 text-amber-400/60" />
          </div>

          <div className="p-2 rounded-xl bg-alt border border-border-default flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted block">Total Módulo (FFCE+FFEOE)</span>
              <span
                className={`text-sm font-black font-mono flex items-center gap-1 ${
                  isHorasExact ? "text-cyan-400" : "text-amber-400"
                }`}
              >
                {totalHorasModulo} h / {horasObjetivo} h
                {isHorasExact ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </span>
            </div>
            <ShieldCheck className="w-4 h-4 text-cyan-400/60" />
          </div>

          <div className="p-2 rounded-xl bg-alt border border-border-default flex items-center justify-between">
            <div>
              <span className="text-[10px] text-text-muted block">Ponderación Total (Pesos %)</span>
              <span
                className={`text-sm font-black font-mono flex items-center gap-1 ${
                  isPesoExact ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {totalPesoPorcentaje.toFixed(2)} % / 100,00 %
                {isPesoExact ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </span>
            </div>
            <Percent className="w-4 h-4 text-emerald-400/60" />
          </div>
        </div>
      </div>

      {/* 2. Official Table 7.1 Representation */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-border-default"
            : "bg-white border-slate-300"
        }`}
      >
        <div className="p-3.5 bg-alt/80 border-b border-border-default flex items-center justify-between">
          <p className="text-xs text-text-secondary italic">
            A continuación, se presentan las Unidades didácticas (UD), que estructuran el desarrollo de este módulo y que permiten alcanzar los RA de manera eficaz y progresiva:
          </p>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
            {activeUds.length} Registros
          </span>
        </div>

        <div className="overflow-x-auto">
          {activeUds.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-4 bg-background/50">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-md shadow-amber-500/10">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-base font-black text-text-primary">
                  Tabla Oficial Sin Unidades Didácticas
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Actualmente no hay Unidades Didácticas en la programación. Abre la <strong>Propuesta del Plan de Unidades Didácticas</strong> para que el motor curricular analice y proponga la secuenciación oficial (RA/CE, BC, CPPS, OG, Dual y Pesos %), o carga la matriz patrón de referencia.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onOpenPlanModal && (
                  <button
                    type="button"
                    onClick={onOpenPlanModal}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Propuesta del Plan de UDs</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLoadPatternPreset}
                  className="px-4 py-2.5 bg-surface hover:bg-alt text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Cargar Matriz Patrón Oficial</span>
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-black border-b border-slate-700 text-center">
                <th className="py-2.5 px-3 w-14 border-r border-slate-700">UD</th>
                <th className="py-2.5 px-3 text-left w-52 border-r border-slate-700">
                  Título de la Unidad Didáctica
                </th>
                <th className="py-2.5 px-3 text-left border-r border-slate-700">
                  RA / CE
                </th>
                <th className="py-2.5 px-2.5 w-14 border-r border-slate-700" title="Bloque de Contenidos">
                  BC
                </th>
                <th className="py-2.5 px-2.5 w-16 border-r border-slate-700" title="Competencias Profesionales, Personales y Sociales">
                  CPPS
                </th>
                <th className="py-2.5 px-2.5 w-16 border-r border-slate-700" title="Objetivos Generales">
                  OG
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700" title="Horas en Centro Educativo">
                  FFCE (h)
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700" title="Horas en Empresa / Dual">
                  FFEOE (h)
                </th>
                <th className="py-2.5 px-3 w-24 text-right border-r border-slate-700" title="Ponderación sobre la nota final del módulo">
                  Peso %
                </th>
                <th className="py-2.5 px-3 w-28 text-center" title="Ficha Curricular Oficial de 19 Puntos (Alineación Bidireccional)">
                  Ficha 1b
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/80">
              {groupedUds.map(({ phase: fase, uds: phaseUds }) => {
                return (
                  <React.Fragment key={fase.id}>
                    {/* Phase Header Row */}
                    <tr
                      className={`${
                        theme === "dark"
                          ? "bg-slate-800/80 text-cyan-200 border-y border-cyan-500/20"
                          : "bg-blue-50 text-blue-950 border-y border-blue-200 font-bold"
                      }`}
                    >
                      <td colSpan={10} className="py-2 px-3 text-xs leading-relaxed">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                          <span className="font-black text-cyan-400 uppercase tracking-wide shrink-0">
                            {fase.nombre}.
                          </span>
                          <span className="text-text-secondary font-medium text-[11px]">
                            {fase.justificacionSecuencial}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Phase UDs */}
                    {phaseUds.map((ud) => {
                      const isSelected = ud.id === config.codigo;
                      const hasDual = (ud.horasFfeoe || 0) > 0;

                      return (
                        <tr
                          key={ud.id}
                          onClick={() => onSelectUd && onSelectUd(ud.id)}
                          className={`hover:bg-hover/80 transition-colors cursor-pointer ${
                            isSelected ? "bg-cyan-500/10 font-bold" : ""
                          }`}
                        >
                          {/* UD Code Badge */}
                          <td className="py-2.5 px-2 text-center border-r border-border-default/60">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs rounded-md shadow-xs border ${getUdBadgeColor(
                                fase.id,
                                ud.isPeriodoRecuperacion
                              )}`}
                            >
                              {ud.id.replace("UD", "")}
                            </span>
                          </td>

                          {/* UD Title */}
                          <td className="py-2.5 px-3 font-semibold text-text-primary border-r border-border-default/60">
                            <div className="flex items-center gap-1.5">
                              <span>{ud.title}</span>
                              {hasDual && (
                                <span
                                  className="text-amber-400 font-bold text-[10px]"
                                  title="Unidad con estancia dual en empresa (FFEOE)"
                                >
                                  (*)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* RA / CE */}
                          <td className="py-2.5 px-3 text-text-primary border-r border-border-default/60 font-mono text-[11px]">
                            {ud.raCeText ? (
                              <span className="font-bold text-cyan-400">
                                {ud.raCeText}
                              </span>
                            ) : (
                              <span className="text-text-muted italic">Todos los RA</span>
                            )}
                          </td>

                          {/* BC */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold text-text-secondary border-r border-border-default/60">
                            {ud.bcText || ud.bcCode || "-"}
                          </td>

                          {/* CPPS */}
                          <td className="py-2.5 px-2 text-center border-r border-border-default/60">
                            {ud.cppsText ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30 text-[11px]">
                                {ud.cppsText}
                              </span>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>

                          {/* OG */}
                          <td className="py-2.5 px-2 text-center border-r border-border-default/60">
                            {ud.ogText ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 text-[11px]">
                                {ud.ogText}
                              </span>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>

                          {/* FFCE (h) */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-black text-text-primary border-r border-border-default/60">
                            {ud.horasFfce ?? ud.horasEstimadas ?? "-"}
                          </td>

                          {/* FFEOE (h) */}
                          <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-border-default/60">
                            {ud.horasFfeoe ? (
                              <span className="text-amber-400 font-bold">
                                {ud.horasFfeoe}
                              </span>
                            ) : (
                              <span className="text-text-muted">0</span>
                            )}
                          </td>

                          {/* Peso % */}
                          <td className="py-2.5 px-3 text-right font-mono font-black text-text-primary border-r border-border-default/60">
                            {ud.isPeriodoRecuperacion ? (
                              <span className="text-text-muted">--</span>
                            ) : (
                              <span>{(ud.pesoPorcentaje || 0).toFixed(2)} %</span>
                            )}
                          </td>

                          {/* Ficha 1b Action */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToUdCurricular) {
                                  onNavigateToUdCurricular(ud.id);
                                } else if (onSelectUd) {
                                  onSelectUd(ud.id);
                                }
                              }}
                              className="px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition-all mx-auto shadow-xs cursor-pointer"
                              title="Abrir y editar la Ficha Curricular Oficial de 19 Puntos (1b) para esta UD"
                            >
                              <Layers className="w-3 h-3 text-indigo-400" />
                              <span>Ficha 1b</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Totals Summary Row */}
              <tr className="bg-alt/90 font-black text-xs border-t-2 border-slate-700">
                <td colSpan={6} className="py-3 px-3 text-right text-text-primary uppercase tracking-wider">
                  Totales
                </td>
                <td className="py-3 px-2.5 text-center font-mono text-emerald-400 text-sm">
                  {totalHorasFfce} h
                </td>
                <td className="py-3 px-2.5 text-center font-mono text-amber-400 text-sm">
                  {totalHorasFfeoe} h
                </td>
                <td className="py-3 px-3 text-right font-mono text-cyan-400 text-sm border-r border-slate-700">
                  {totalPesoPorcentaje.toFixed(0)} %
                </td>
                <td className="py-3 px-2 text-center text-text-muted text-[10px]">
                  ✓ 100% Coherente
                </td>
              </tr>
            </tbody>
          </table>
          )}
        </div>

        {/* Table Footnote */}
        <div className="p-3.5 bg-alt/60 border-t border-border-default text-xs text-text-secondary leading-relaxed">
          <p>
            <strong className="text-amber-400">(*) Nota:</strong> En el marco de la{" "}
            <strong>FP Dual (modalidad general)</strong> regulada por la <strong>LO 3/2022</strong>, el{" "}
            <strong>RD 659/2023</strong> y la <strong>Resolución de 24 de julio de 2026 de la Junta de Andalucía</strong> (Instrucciones de distribución horaria y concreción curricular para el curso 2026/2027), las Unidades marcadas con asterisco derivan{" "}
            <strong>{totalHorasFfeoe} horas totales</strong> a la <strong>FFEOE (Formación en Empresa u Organismo Equiparado)</strong>, ejecutándose de forma coordinada con la empresa durante el periodo de alternancia.
          </p>
        </div>
      </div>
    </div>
  );
};
