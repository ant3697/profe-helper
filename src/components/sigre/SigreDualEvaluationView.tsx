import React, { useState } from "react";
import {
  CalendarRange,
  Building2,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Percent,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  SigreCurricularConfig,
  SigreCyclePlanData,
} from "../../types/sigre";
import { DEFAULT_CYCLE_PLAN_DATA } from "../../data/sigreCurricularModelPreset";

interface SigreDualEvaluationViewProps {
  config: SigreCurricularConfig;
  onUpdateConfig?: (config: SigreCurricularConfig) => void;
  onNavigateToView?: (
    view: "parametros" | "planificacion" | "calendario" | "unidades" | "horarios"
  ) => void;
  theme?: "dark" | "light";
}

export const SigreDualEvaluationView: React.FC<
  SigreDualEvaluationViewProps
> = ({ config, onUpdateConfig, onNavigateToView, theme = "dark" }) => {
  const [copied, setCopied] = useState(false);
  const [selectedCursoTab, setSelectedCursoTab] = useState<1 | 2>(() => {
    return config.cursoModulo || (config.curso?.includes("2") ? 2 : 1);
  });

  const cycleData: SigreCyclePlanData =
    config.cyclePlanData || DEFAULT_CYCLE_PLAN_DATA;

  const parciales = cycleData.parciales;

  // Course-specific Dual parameters
  const pctDualPrimerCurso = config.porcentajeDualPrimerCurso ?? 12.1;
  const pctDualSegundoCurso = config.porcentajeDualSegundoCurso ?? 25.0;
  const horasPrimerCurso = config.horasPrimerCurso ?? 995;
  const horasSegundoCurso = config.horasSegundoCurso ?? 1005;

  const horasFfeoe1 = config.horasFfeoePrimerCurso ?? Math.round((horasPrimerCurso * pctDualPrimerCurso) / 100);
  const horasFfeoe2 = config.horasFfeoeSegundoCurso ?? Math.round((horasSegundoCurso * pctDualSegundoCurso) / 100);
  const fechaInicio1 = config.fechaInicioDualPrimerCurso || config.cyclePlanData?.fechaInicioDualPrimerCurso || "17 de marzo";
  const fechaInicio2 = config.fechaInicioDualSegundoCurso || config.cyclePlanData?.fechaInicioDualSegundoCurso || "24 de marzo";
  const horasSemDual1 = config.horasSemanalesDualPrimerCurso || config.cyclePlanData?.horasSemanalesDualPrimerCurso || 30;
  const horasSemDual2 = config.horasSemanalesDualSegundoCurso || config.cyclePlanData?.horasSemanalesDualSegundoCurso || 30;

  const activePctDual = selectedCursoTab === 1 ? pctDualPrimerCurso : pctDualSegundoCurso;
  const activeHorasCurso = selectedCursoTab === 1 ? horasPrimerCurso : horasSegundoCurso;
  const activeHorasFfeoeCurso = selectedCursoTab === 1 ? horasFfeoe1 : horasFfeoe2;
  const activeFechaInicio = selectedCursoTab === 1 ? fechaInicio1 : fechaInicio2;
  const activeHorasSemDual = selectedCursoTab === 1 ? horasSemDual1 : horasSemDual2;
  const activeSemanasEstimadas = parseFloat((activeHorasFfeoeCurso / (activeHorasSemDual || 30)).toFixed(1));

  const rawModulos = cycleData.modulos.filter((m) => m.curso === selectedCursoTab);
  
  // Calculate module dual breakdown for the selected course
  const modulosCurso = rawModulos.map((m) => {
    const totFfeoe = m.horasTotFfeoe ?? Math.round((m.horasTotales * activePctDual) / 100);
    const totFfce = m.horasTotFfce ?? (m.horasTotales - totFfeoe);
    const semFfeoe = m.horasSemFfeoe ?? Math.max(1, Math.round((m.horasSemanales * activePctDual) / 100));
    const semFfce = m.horasSemFfce ?? Math.max(0, m.horasSemanales - semFfeoe);
    const pctFfeoe = m.porcentajeFfeoe ?? ((totFfeoe / m.horasTotales) * 100);
    return {
      ...m,
      horasTotFfeoe: totFfeoe,
      horasTotFfce: totFfce,
      horasSemFfeoe: semFfeoe,
      horasSemFfce: semFfce,
      porcentajeFfeoe: pctFfeoe,
    };
  });

  const totalFfceParciales = parciales.reduce((acc, p) => acc + p.horasFfce, 0);
  const totalFfeoeParciales = parciales.reduce((acc, p) => acc + p.horasFfeoe, 0);
  const totalModuloParciales = totalFfceParciales + totalFfeoeParciales;

  const totalHorasTotMod = modulosCurso.reduce(
    (acc, m) => acc + m.horasTotales,
    0
  );
  const totalHorasTotFfce = modulosCurso.reduce(
    (acc, m) => acc + (m.horasTotFfce || 0),
    0
  );
  const totalHorasTotFfeoe = modulosCurso.reduce(
    (acc, m) => acc + (m.horasTotFfeoe || 0),
    0
  );
  const totalHorasSemMod = modulosCurso.reduce(
    (acc, m) => acc + m.horasSemanales,
    0
  );

  const totalHorasFfeoeCiclo = Math.round((horasPrimerCurso * pctDualPrimerCurso) / 100) + Math.round((horasSegundoCurso * pctDualSegundoCurso) / 100);
  const totalHorasCiclo = horasPrimerCurso + horasSegundoCurso;
  const pctDualGlobal = parseFloat(((totalHorasFfeoeCiclo / totalHorasCiclo) * 100).toFixed(1));

  const handleCopyTables = () => {
    let md = `### Periodos de Evaluación y Horas por Parcial\n`;
    md += `| Parciales | Periodos | FFCE (h) | FFEOE (h) |\n`;
    md += `|---|---|---|---|\n`;
    parciales.forEach((p) => {
      md += `| ${p.nombre} | ${p.fechas} | ${p.horasFfce} | ${p.horasFfeoe} |\n`;
    });
    md += `| **Subtotal de horas** | | **${totalFfceParciales}** | **${totalFfeoeParciales}** |\n`;
    md += `| **En total disponemos de:** | | **${totalModuloParciales}** | |\n\n`;

    md += `### Planificación del módulo para la fase de formación en empresa (FFEOE) - ${selectedCursoTab}º CURSO\n`;
    md += `Según la normativa (LO 3/2022 y RD 659/2023), en la formación en alternancia de régimen general, las horas del ${selectedCursoTab}º curso destinadas a FFEOE alcanzan un ${activePctDual}% (${totalHorasTotFfeoe} horas), distribuidas entre los módulos como se detalla en la siguiente tabla:\n\n`;
    md += `| Sem./Tot. Academ. | Sem./Tot. FFEOE | Sem./Tot. FFCE | Días/Sem. en FFCE | Días/Sem. en FFEOE |\n`;
    md += `|---|---|---|---|---|\n`;
    md += `| ${cycleData.totalSemanasAcademicas} | ${cycleData.semanasFfeoe} | ${cycleData.semanasFfce} | ${cycleData.diasSemanaFfce} | ${cycleData.diasSemanaFfeoe} |\n\n`;

    md += `| Cód. | Módulo | Horas/Sem. Mód. | Horas/Sem. en FFCE | Horas/Sem. en FFEOE | Horas/Tot. Mód. | Horas/Tot. FFCE | Horas/Tot. en FFEOE | % del Mod. En FFEOE |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;
    modulosCurso.forEach((m) => {
      md += `| ${m.codigo} | ${m.abreviatura || m.nombre} | ${m.horasSemanales} | ${m.horasSemFfce ?? 0} | ${m.horasSemFfeoe ?? m.horasSemanales} | ${m.horasTotales} | ${m.horasTotFfce} | ${m.horasTotFfeoe} | ${(m.porcentajeFfeoe || 0).toFixed(1)}% |\n`;
    });
    md += `| **Totales** | | **${totalHorasSemMod}** | **0** | **${totalHorasSemMod}** | **${totalHorasTotMod}** | **${totalHorasTotFfce}** | **${totalHorasTotFfeoe}** | **${activePctDual}%** |\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-emerald-500/30"
            : "bg-white border-emerald-200 shadow-sm"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                FP Dual · RD 659/2023
              </span>
              <span className="text-xs font-mono font-bold text-text-muted">
                Régimen General (10% - 20% en Empresa)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-text-primary mt-1 flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-emerald-500" />
              Temporalización por Parciales y Planificación FFEOE (FP Dual)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
              Articulación del calendario de evaluaciones parciales (Sep-Dic, Ene-Mar, Mar-May y Junio) y desglose de la alternancia en empresa (<strong>4 semanas intensivas · 120h totales / 20h en este módulo</strong>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTables}
              className="px-3 py-1.5 bg-surface hover:bg-hover text-text-secondary hover:text-text-primary border border-border-default text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Tablas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Table 1: Parciales y Horas FFCE vs FFEOE */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-border-default"
            : "bg-white border-slate-300"
        }`}
      >
        <div className="p-3 bg-alt border-b border-border-default flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Así mismo, las evaluaciones se desarrollarán entre los siguientes periodos:
          </p>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Total Módulo: {totalModuloParciales} Horas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-black border-b border-slate-700">
                <th className="py-2.5 px-4 w-48 border-r border-slate-700">
                  Parciales
                </th>
                <th className="py-2.5 px-4 border-r border-slate-700">
                  Periodos
                </th>
                <th colSpan={2} className="py-1 px-4 text-center border-b border-slate-700">
                  Horas
                </th>
              </tr>
              <tr className="bg-slate-800/90 text-white font-black border-b border-slate-700 text-center">
                <th className="py-1 px-4 border-r border-slate-700"></th>
                <th className="py-1 px-4 border-r border-slate-700"></th>
                <th className="py-1 px-4 w-28 border-r border-slate-700 bg-slate-700/60">
                  FFCE
                </th>
                <th className="py-1 px-4 w-28 bg-slate-700/60">FFEOE</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-default/80 font-medium">
              {parciales.map((p) => {
                const isDual = p.horasFfeoe > 0;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-hover/80 transition-colors ${
                      isDual
                        ? "bg-amber-500/10 text-amber-300 font-bold"
                        : "text-text-primary"
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold border-r border-border-default/60">
                      {p.nombre}
                    </td>
                    <td className="py-2.5 px-4 border-r border-border-default/60">
                      {p.fechas}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold border-r border-border-default/60 text-emerald-400">
                      {p.horasFfce}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-amber-400">
                      {p.horasFfeoe}
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal */}
              <tr className="bg-alt font-black text-xs border-t border-border-default">
                <td colSpan={2} className="py-2 px-4 text-left uppercase tracking-wider text-text-primary border-r border-border-default/60">
                  Subtotal de horas:
                </td>
                <td className="py-2 px-4 text-center font-mono text-emerald-400 text-sm border-r border-border-default/60">
                  {totalFfceParciales}
                </td>
                <td className="py-2 px-4 text-center font-mono text-amber-400 text-sm">
                  {totalFfeoeParciales}
                </td>
              </tr>

              {/* Final Sum */}
              <tr className="bg-slate-800 font-black text-xs border-t-2 border-slate-700 text-white">
                <td colSpan={2} className="py-2.5 px-4 text-left uppercase tracking-wider text-white border-r border-slate-700">
                  En total disponemos de:
                </td>
                <td colSpan={2} className="py-2.5 px-4 text-center font-mono text-cyan-400 text-base">
                  {totalModuloParciales}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Table 2: Planificación FFEOE (FP Dual Régimen General) */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-border-default"
            : "bg-white border-slate-300"
        }`}
      >
        <div className="p-3.5 bg-alt border-b border-border-default space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Planificación del módulo para la fase de formación en empresa (FFEOE)
            </h4>

            {/* Course Selector for Dual Table */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border-default">
              <button
                type="button"
                onClick={() => setSelectedCursoTab(1)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCursoTab === 1
                    ? "bg-cyan-500 text-black shadow-xs font-black"
                    : "text-text-muted hover:text-text-primary hover:bg-alt"
                }`}
              >
                1º Curso ({horasFfeoe1}h · {pctDualPrimerCurso}%)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCursoTab(2)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCursoTab === 2
                    ? "bg-cyan-500 text-black shadow-xs font-black"
                    : "text-text-muted hover:text-text-primary hover:bg-alt"
                }`}
              >
                2º Curso ({horasFfeoe2}h · {pctDualSegundoCurso}%)
              </button>
            </div>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            Según la normativa (LO 3/2022 y RD 659/2023), en la <strong>formación en alternancia de régimen general</strong>, las horas del <strong>{selectedCursoTab}º curso</strong> destinadas a FFEOE alcanzan <strong>{activeHorasFfeoeCurso} horas ({activePctDual}% de {activeHorasCurso}h totales)</strong>, con inicio el <strong>{activeFechaInicio}</strong> ({activeHorasSemDual} h/sem., aprox. {activeSemanasEstimadas} semanas de estancia). El total global del ciclo es de <strong>{pctDualGlobal}% ({totalHorasFfeoeCiclo}h)</strong>:
          </p>
        </div>

        {/* Header Block CURSO distribution */}
        <div className="p-3 bg-alt/60 border-b border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black text-xs uppercase tracking-widest inline-block">
              {selectedCursoTab}º CURSO · FFEOE {activeHorasFfeoeCurso}h ({activePctDual}%)
            </div>
            <div className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1">
              <CalendarRange className="w-3 h-3 text-amber-400" />
              <span>Inicio: {activeFechaInicio}</span>
            </div>
            <div className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{activeHorasSemDual} h/sem</span>
            </div>
            {config.cursoModulo === selectedCursoTab && (
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                ★ Módulo Actual ({config.codigo})
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold border border-slate-700 text-center">
                  <th className="py-1 px-2.5 border-r border-slate-700">
                    Sem./Tot. Academ.
                  </th>
                  <th className="py-1 px-2.5 border-r border-slate-700">
                    Sem./Tot. FFEOE
                  </th>
                  <th className="py-1 px-2.5 border-r border-slate-700">
                    Sem./Tot. FFCE
                  </th>
                  <th className="py-1 px-2.5 border-r border-slate-700">
                    Días/Sem. en FFCE
                  </th>
                  <th className="py-1 px-2.5">Días/Sem. en FFEOE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-mono font-bold text-center bg-surface border border-border-default">
                  <td className="py-1.5 px-2.5 border-r border-border-default">
                    {cycleData.totalSemanasAcademicas}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-border-default text-amber-400">
                    {cycleData.semanasFfeoe}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-border-default text-emerald-400">
                    {cycleData.semanasFfce}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-border-default">
                    {cycleData.diasSemanaFfce}
                  </td>
                  <td className="py-1.5 px-2.5 text-cyan-400">
                    {cycleData.diasSemanaFfeoe}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modules Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-black border-b border-slate-700 text-center">
                <th className="py-2.5 px-2.5 w-14 border-r border-slate-700">
                  Cód.
                </th>
                <th className="py-2.5 px-3 text-left w-24 border-r border-slate-700">
                  Módulo
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">
                  Horas/Sem. Mód.
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">
                  Horas/Sem. en FFCE
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">
                  Horas/Sem. en FFEOE
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">
                  Horas/Tot. Mód.
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">
                  Horas/Tot. FFCE
                </th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">
                  Horas/Tot. en FFEOE
                </th>
                <th className="py-2.5 px-2.5 w-24 text-right">
                  % del Mod. En FFEOE
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-default/80 font-medium">
              {modulosCurso.map((m) => {
                const isTarget = m.codigo === (config.codigo || "1580");

                return (
                  <tr
                    key={m.codigo}
                    className={`hover:bg-hover/80 transition-colors ${
                      isTarget
                        ? "bg-cyan-500/15 font-black text-cyan-300 border-l-4 border-cyan-400"
                        : "text-text-primary"
                    }`}
                  >
                    <td className="py-2 px-2.5 text-center font-mono font-bold border-r border-border-default/60">
                      {m.codigo}
                    </td>
                    <td className="py-2 px-3 font-semibold border-r border-border-default/60">
                      {m.abreviatura || m.nombre}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono border-r border-border-default/60">
                      {m.horasSemanales}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono border-r border-border-default/60 text-text-muted">
                      {m.horasSemFfce ?? 0}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono border-r border-border-default/60 font-bold text-amber-400">
                      {m.horasSemFfeoe ?? m.horasSemanales}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-bold border-r border-border-default/60">
                      {m.horasTotales}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-bold border-r border-border-default/60 text-emerald-400">
                      {m.horasTotFfce}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black border-r border-border-default/60 text-amber-400">
                      {m.horasTotFfeoe}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono font-bold text-text-primary">
                      {(m.porcentajeFfeoe || 0).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-slate-800 font-black text-xs border-t-2 border-slate-700 text-white">
                <td colSpan={2} className="py-2.5 px-3 text-right uppercase tracking-wider text-white border-r border-slate-700">
                  Totales {selectedCursoTab}º Curso:
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-700">
                  {totalHorasSemMod}
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-700 text-text-muted">
                  0
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-700 text-amber-400">
                  {totalHorasSemMod}
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-700 text-cyan-400">
                  {totalHorasTotMod}
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-700 text-emerald-400">
                  {totalHorasTotFfce}
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono border-r border-slate-700 text-amber-400">
                  {totalHorasTotFfeoe}
                </td>
                <td className="py-2.5 px-2.5 text-right font-mono text-cyan-400 font-bold">
                  {activePctDual}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
