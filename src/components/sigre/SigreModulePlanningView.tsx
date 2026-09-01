import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowRight,
  TrendingUp,
  Award,
  Hash,
  ShieldCheck,
  Percent,
  Check,
  CalendarRange,
  ChevronRight,
  GraduationCap,
  ListOrdered,
  CalendarCheck,
  Eye,
  RefreshCw,
  Building2,
} from "lucide-react";
import {
  SigreCurricularConfig,
  SigreUDItem,
  SigreAcademicCalendar,
} from "../../types/sigre";
import { SigreMultiLevelTimeline } from "./SigreMultiLevelTimeline";
import { SigreCurricularMatrix71View } from "./SigreCurricularMatrix71View";
import { SigreCycleOrganizationView } from "./SigreCycleOrganizationView";
import { SigreDualEvaluationView } from "./SigreDualEvaluationView";
import { calculateAcademicCalendarStats } from "../../utils/sigreCalendarUtils";

interface SigreModulePlanningViewProps {
  config: SigreCurricularConfig;
  uds: SigreUDItem[];
  selectedUdId: string | null;
  onSelectUd: (udId: string) => void;
  onUpdateUds?: (uds: SigreUDItem[]) => void;
  onUpdateConfig?: (config: SigreCurricularConfig) => void;
  onNavigateToView: (
    view: "parametros" | "planificacion" | "calendario" | "unidades" | "horarios"
  ) => void;
  onOpenModuleCurriculum?: (
    cal: SigreAcademicCalendar,
    targetView?: "unidades" | "parametros" | "planificacion" | "calendario" | "cronogramas"
  ) => void;
  onOpenPlanModal?: () => void;
  theme?: "dark" | "light";
}

export const SigreModulePlanningView: React.FC<SigreModulePlanningViewProps> = ({
  config,
  uds,
  selectedUdId,
  onSelectUd,
  onUpdateUds,
  onUpdateConfig,
  onNavigateToView,
  onOpenModuleCurriculum,
  onOpenPlanModal,
  theme = "dark",
}) => {
  const [planningSubTab, setPlanningSubTab] = useState<
    | "matriz71"
    | "organizacion_ciclo"
    | "parciales_ffeoe"
    | "cronograma4n"
    | "matriz_dimensionamiento"
  >("matriz71");

  // Calculations & Dimensioning
  const totalHorasConfig = config.horasTotales || 160;
  const horasSemanales = config.horasSemanales || 5;
  const semanasEstimadas = config.semanasCurso || 32;
  const totalHorasFfce = uds.reduce((acc, u) => acc + (u.horasFfce ?? u.horasEstimadas ?? 0), 0);
  const totalHorasFfeoe = uds.reduce((acc, u) => acc + (u.horasFfeoe ?? 0), 0);
  const totalHorasUds = totalHorasFfce + totalHorasFfeoe;
  const totalSesionesUds = uds.reduce((acc, u) => acc + (u.sesionesEstimadas || 0), 0);
  const totalPesoUds = uds.filter((u) => !u.isPeriodoRecuperacion).reduce((acc, u) => acc + (u.pesoPorcentaje ?? 0), 0);
  const diffHoras = totalHorasUds - totalHorasConfig;
  const isHorasBalanced = diffHoras === 0 && uds.length > 0;
  const pctFce = totalHorasUds > 0 ? ((totalHorasFfce / totalHorasUds) * 100).toFixed(1) : "0";
  const pctFfeoe = totalHorasUds > 0 ? ((totalHorasFfeoe / totalHorasUds) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Module Planning Header & Workflow Breadcrumb */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-cyan-500/30 shadow-lg shadow-cyan-950/20"
            : "bg-white border-cyan-300 shadow-md shadow-cyan-500/10"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-cyan-400 rounded-2xl border border-cyan-500/40 shrink-0 shadow-inner">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Nivel 2: Secuenciación y Dimensionamiento
                </span>
                <span className="text-xs font-mono font-bold text-text-muted">
                  {config.codigo || "1580"} - {config.moduloFormativo || "Técnicas de montaje en instalaciones de agua"}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-text-primary mt-1 flex items-center gap-2">
                Planificación Curricular del Módulo
              </h2>
              <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
                Estructura secuencial en <strong>Fases Pedagógicas Dinámicas</strong>, vinculación de <strong>UDs con RA/CE, BC, CPPS, OG</strong> (Tabla 7.1), dimensionamiento <strong>FFCE / FFEOE (FP Dual RD 659/2023)</strong> y concreción curricular oficial de <strong>Andalucía (Resolución de 24 de julio de 2026 - Grados D y E)</strong>.
              </p>
            </div>
          </div>

          {/* Connected Steps Workflow Badges */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-alt/60 border border-border-default shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => onNavigateToView("parametros")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-surface hover:bg-hover text-amber-400 border border-amber-500/30 hover:border-amber-500/60"
              title="Ir al Marco Normativo y Parámetros Curriculares"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. Parámetros</span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />

            <div className="px-3 py-1.5 rounded-lg text-xs font-black bg-cyan-500 text-black shadow-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>2. Planificación</span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />

            <button
              type="button"
              onClick={() => onNavigateToView("calendario")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-surface hover:bg-hover text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60"
              title="Aterrizar en el Calendario Escolar Oficial (Fechas Reales y Festivos)"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>3. Calendario</span>
            </button>
          </div>
        </div>

        {/* Dimensioning & Compliance Summary Bar */}
        <div className="mt-4 pt-3 border-t border-border-default/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-alt border border-border-default">
            <span className="text-[10px] text-text-muted block font-semibold">
              Horas Asignadas / Marco
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-sm font-black font-mono ${
                  isHorasBalanced ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {totalHorasUds}h / {totalHorasConfig}h
              </span>
              {isHorasBalanced ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-alt border border-border-default">
            <span className="text-[10px] text-text-muted block font-semibold">
              Carga Semanal Estimada
            </span>
            <span className="text-sm font-black font-mono text-cyan-400 block mt-0.5">
              {horasSemanales}h / semana (~{semanasEstimadas} sem)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-alt border border-border-default">
            <span className="text-[10px] text-text-muted block font-semibold">
              Horas Centro (FFCE)
            </span>
            <span className="text-sm font-black font-mono text-emerald-400 block mt-0.5">
              {totalHorasFfce} h ({pctFce}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-alt border border-border-default">
            <span className="text-[10px] text-text-muted block font-semibold">
              Horas Empresa (FFEOE)
            </span>
            <span className="text-sm font-black font-mono text-amber-400 block mt-0.5">
              {totalHorasFfeoe} h ({pctFfeoe}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-alt border border-border-default">
            <span className="text-[10px] text-text-muted block font-semibold">
              Total Fases / UDs
            </span>
            <span className="text-sm font-black font-mono text-text-primary block mt-0.5">
              {uds.length > 0 ? `4 Fases · ${uds.length} UDs` : "0 UDs (Sin Plan)"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-alt border border-border-default">
            <span className="text-[10px] text-text-muted block font-semibold">
              Ponderación Total
            </span>
            <span className="text-sm font-black font-mono text-purple-400 block mt-0.5">
              {uds.length > 0 ? `${totalPesoUds.toFixed(2)} %` : "0,00 %"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Planning Sub-Tabs Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-2 rounded-2xl border border-border-default">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlanningSubTab("matriz71")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              planningSubTab === "matriz71"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-hover"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>7.1 Matriz Curricular y Fases</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
              RD 659/23
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlanningSubTab("organizacion_ciclo")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              planningSubTab === "organizacion_ciclo"
                ? "bg-blue-500 text-black shadow-md shadow-blue-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-hover"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Organización Ciclo / Módulo</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono font-bold" title="Resolución de 24 de julio de 2026 (Junta de Andalucía)">
              Res. 24/07/26 (AND)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlanningSubTab("parciales_ffeoe")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              planningSubTab === "parciales_ffeoe"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-hover"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Parciales y Planificación FFEOE (Dual)</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
              12,1%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlanningSubTab("cronograma4n")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              planningSubTab === "cronograma4n"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-hover"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cronogramas a 4 Niveles</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
              4N
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlanningSubTab("matriz_dimensionamiento")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              planningSubTab === "matriz_dimensionamiento"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-hover"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Auditoría de Dimensionamiento</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToView("calendario")}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            title="Ir directamente al calendario escolar con las UDs dimensionadas"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Ver en Calendario Escolar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Sub-View Contents */}
      {planningSubTab === "matriz71" && (
        <SigreCurricularMatrix71View
          config={config}
          uds={uds}
          onUpdateUds={onUpdateUds}
          onUpdateConfig={onUpdateConfig}
          onSelectUd={onSelectUd}
          onNavigateToUdCurricular={(udId) => {
            onSelectUd(udId);
            onNavigateToView("unidades");
          }}
          onOpenPlanModal={onOpenPlanModal}
          theme={theme}
        />
      )}

      {planningSubTab === "organizacion_ciclo" && (
        <SigreCycleOrganizationView
          config={config}
          onUpdateConfig={onUpdateConfig}
          onNavigateToView={onNavigateToView}
          theme={theme}
        />
      )}

      {planningSubTab === "parciales_ffeoe" && (
        <SigreDualEvaluationView
          config={config}
          onUpdateConfig={onUpdateConfig}
          onNavigateToView={onNavigateToView}
          theme={theme}
        />
      )}

      {planningSubTab === "cronograma4n" && (
        <div className="space-y-4">
          <SigreMultiLevelTimeline
            uds={uds}
            config={config}
            selectedUdId={selectedUdId}
            onSelectUd={onSelectUd}
            onOpenModuleCurriculum={onOpenModuleCurriculum}
            theme={theme}
          />
        </div>
      )}

      {planningSubTab === "matriz_dimensionamiento" && (
        <div className="space-y-4">
          <div className="bg-surface border border-border-default rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default">
              <div>
                <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Auditoría de Dimensionamiento y Carga Horaria por UD
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Auditoría detallada de horas estimadas, número de sesiones lectivas, asignación de bloques curriculares y regla de priorización PRL.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                    isHorasBalanced
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {isHorasBalanced ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Cuadre Horario Exacto: {totalHorasUds}h de {totalHorasConfig}h
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Desviación: {diffHoras > 0 ? `+${diffHoras}h` : `${diffHoras}h`} vs {totalHorasConfig}h
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Table of UDs dimensioning */}
            <div className="overflow-x-auto border border-border-default rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-alt text-text-muted font-bold border-b border-border-default">
                  <tr>
                    <th className="py-2.5 px-3">UD / Código</th>
                    <th className="py-2.5 px-3">Título de la Unidad Didáctica</th>
                    <th className="py-2.5 px-3">Bloque Curricular (BC)</th>
                    <th className="py-2.5 px-3 text-center">Trimestre</th>
                    <th className="py-2.5 px-3 text-right">Horas Est.</th>
                    <th className="py-2.5 px-3 text-right">% Módulo</th>
                    <th className="py-2.5 px-3 text-right">Sesiones</th>
                    <th className="py-2.5 px-3 text-center">PRL / Prioridad</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default font-medium">
                  {uds.map((ud, idx) => {
                    const percentage =
                      totalHorasConfig > 0
                        ? ((ud.horasEstimadas || 20) / totalHorasConfig) * 100
                        : 0;
                    const isSelected = ud.id === selectedUdId;

                    return (
                      <tr
                        key={ud.id}
                        onClick={() => onSelectUd(ud.id)}
                        className={`hover:bg-hover transition-colors cursor-pointer ${
                          isSelected ? "bg-cyan-500/10 font-bold" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">
                          {ud.id}
                        </td>
                        <td className="py-2.5 px-3 text-text-primary">
                          <div className="flex items-center gap-2">
                            <span>{ud.title}</span>
                            {ud.isPrl && (
                              <span className="px-1.5 py-0.2 text-[10px] font-black rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                PRL
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary font-mono">
                          {ud.bcCode || `BC${ud.number || idx + 1}`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ud.trimestre === 1
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : ud.trimestre === 2
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            T{ud.trimestre || 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                          {ud.horasEstimadas || 20}h
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-text-muted">
                          {ud.sesionesEstimadas ||
                            Math.ceil((ud.horasEstimadas || 20) / 2)}{" "}
                          ses
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {ud.isPrl ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-400">
                              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                              Prioritaria
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-muted">
                              Estándar
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ud.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-500/20 text-slate-400"
                            }`}
                          >
                            {ud.status === "completed"
                              ? "Completa"
                              : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-alt/80 font-bold border-t border-border-default text-text-primary">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-xs">
                      Totales del Módulo:
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono text-sm ${
                        isHorasBalanced ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {totalHorasUds}h
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                      {totalHorasConfig > 0
                        ? ((totalHorasUds / totalHorasConfig) * 100).toFixed(1)
                        : 100}
                      %
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-text-muted">
                      {totalSesionesUds} ses
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-text-muted">
                        Marco: {totalHorasConfig}h (
                        {config.semanasCurso || 32} semanas)
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
