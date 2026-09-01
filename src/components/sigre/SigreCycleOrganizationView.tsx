import React, { useState } from "react";
import {
  BookOpen,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Building2,
  ArrowRight,
  Sliders,
  Sparkles,
  Info,
} from "lucide-react";
import {
  SigreCurricularConfig,
  SigreCyclePlanData,
} from "../../types/sigre";
import { DEFAULT_CYCLE_PLAN_DATA } from "../../data/sigreCurricularModelPreset";

interface SigreCycleOrganizationViewProps {
  config: SigreCurricularConfig;
  onUpdateConfig?: (config: SigreCurricularConfig) => void;
  onNavigateToView?: (
    view: "parametros" | "planificacion" | "calendario" | "unidades" | "horarios"
  ) => void;
  theme?: "dark" | "light";
}

export const SigreCycleOrganizationView: React.FC<
  SigreCycleOrganizationViewProps
> = ({ config, onUpdateConfig, onNavigateToView, theme = "dark" }) => {
  const [copied, setCopied] = useState(false);
  const cycleData: SigreCyclePlanData =
    config.cyclePlanData || DEFAULT_CYCLE_PLAN_DATA;

  const modulosPrimerCurso = cycleData.modulos.filter((m) => m.curso === 1);
  const modulosSegundoCurso = cycleData.modulos.filter((m) => m.curso === 2);

  const subtotalHoras1 = modulosPrimerCurso.reduce(
    (acc, m) => acc + m.horasTotales,
    0
  );
  const subtotalSemanales1 = modulosPrimerCurso.reduce(
    (acc, m) => acc + m.horasSemanales,
    0
  );

  const subtotalHoras2 = modulosSegundoCurso.reduce(
    (acc, m) => acc + m.horasTotales,
    0
  );
  const subtotalSemanales2 = modulosSegundoCurso.reduce(
    (acc, m) => acc + m.horasSemanales,
    0
  );

  const totalHorasCiclo = subtotalHoras1 + subtotalHoras2;

  // Active module parameters
  const currentModCode = config.codigo || "1580";
  const currentMod = cycleData.modulos.find((m) => m.codigo === currentModCode) || {
    codigo: "1580",
    nombre: "Técnicas de montaje en instalaciones de agua.",
    horasTotales: 160,
    horasSemanales: 5,
  };

  const handleCopyTable = () => {
    let md = `### Organización ciclo/módulo (Andalucía 2026/2027)\n`;
    md += `Según la Resolución de 24 de julio de 2026 de la Dirección General de Formación Profesional y Educación Permanente (Junta de Andalucía) por la que se dictan instrucciones relativas a la distribución horaria y a la concreción curricular de los Grados D y E para el curso 2026/2027, se establece la siguiente carga horaria para este ciclo formativo:\n\n`;
    md += `| Módulo/Proyecto | Bilingüe | Horas | 1.º | 2.º |\n`;
    md += `|---|---|---|---|---|\n`;

    modulosPrimerCurso.forEach((m) => {
      md += `| ${m.codigo}. ${m.nombre} | ${m.bilingueNota || (m.bilingue ? "Sí" : "")} | ${m.horasTotales} | ${m.horasSemanales} | |\n`;
    });
    md += `| **Subtotal** | | **${subtotalHoras1}** | **${subtotalSemanales1}** | -- |\n\n`;

    modulosSegundoCurso.forEach((m) => {
      md += `| ${m.codigo}. ${m.nombre} | ${m.bilingueNota || (m.bilingue ? "Sí" : "")} | ${m.horasTotales} | | ${m.horasSemanales} |\n`;
    });
    md += `| **Subtotal** | | **${subtotalHoras2}** | -- | **${subtotalSemanales2}** |\n`;
    md += `| **Total** | | **${totalHorasCiclo}** | **${subtotalSemanales1}** | **${subtotalSemanales2}** |\n\n`;

    md += `(*) ${cycleData.bilingueTexto}\n\n`;
    md += `Parámetros del módulo:\n- Horas totales: ${currentMod.horasTotales}h\n- Horas semanales: ${currentMod.horasSemanales}h\n- Número de semanas: 32 semanas\n- Número de sesiones semanales: 3 sesiones\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-blue-500/30"
            : "bg-white border-blue-200 shadow-sm"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Res. 24/07/2026 (Andalucía) · 2000 Horas
              </span>
              <span className="text-xs font-mono font-bold text-text-muted">
                Ciclo Formativo FP (Grados D y E) · Curso 2026/2027
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-text-primary mt-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Organización Ciclo / Módulo y Carga Horaria (Andalucía)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 max-w-3xl">
              Carga lectiva oficial regulada por la{" "}
              <strong>Resolución de 24 de julio de 2026 de la Dirección General de Formación Profesional y Educación Permanente (Junta de Andalucía)</strong>, que dicta instrucciones para determinar la distribución horaria y la concreción curricular (Grados D y E) para el curso 2026/2027, distribuyendo las 2000h entre 1º y 2º curso a razón de 30h semanales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTable}
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
                  <span>Copiar Tabla</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Full Cycle Table Structure */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-border-default"
            : "bg-white border-slate-300"
        }`}
      >
        <div className="p-3 bg-alt border-b border-border-default">
          <p className="text-xs text-text-secondary">
            Según la <strong>Resolución de 24 de julio de 2026 de la Junta de Andalucía</strong> (Instrucciones de distribución horaria y concreción curricular para el curso 2026/2027), se establece la carga horaria y ordenación para este ciclo formativo en la Comunidad Autónoma de Andalucía:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-black border-b border-slate-700">
                <th className="py-2.5 px-3 border-r border-slate-700">
                  Módulo / Proyecto
                </th>
                <th className="py-2.5 px-3 w-28 text-center border-r border-slate-700">
                  Bilingüe
                </th>
                <th className="py-2.5 px-3 w-24 text-center border-r border-slate-700">
                  Horas
                </th>
                <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-700">
                  Secuenciación
                </th>
              </tr>
              <tr className="bg-slate-800/90 text-white font-black border-b border-slate-700 text-center">
                <th className="py-1 px-3 border-r border-slate-700"></th>
                <th className="py-1 px-3 border-r border-slate-700"></th>
                <th className="py-1 px-3 border-r border-slate-700"></th>
                <th className="py-1 px-3 w-16 border-r border-slate-700 bg-slate-700/60">
                  1.º
                </th>
                <th className="py-1 px-3 w-16 bg-slate-700/60">2.º</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-default/80 font-medium">
              {/* 1º Curso Group */}
              {modulosPrimerCurso.map((m) => {
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
                    <td className="py-2 px-3 border-r border-border-default/60">
                      <span>
                        {m.codigo}. {m.nombre}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-border-default/60 font-semibold text-text-secondary">
                      {m.bilingueNota || (m.bilingue ? "Sí (*)" : "")}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold border-r border-border-default/60">
                      {m.horasTotales}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black border-r border-border-default/60 text-cyan-400">
                      {m.horasSemanales}
                    </td>
                    <td className="py-2 px-3 text-center text-text-muted">--</td>
                  </tr>
                );
              })}

              {/* Subtotal 1º Curso */}
              <tr className="bg-blue-500/10 font-black text-xs border-y border-blue-500/30">
                <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider text-blue-400 border-r border-border-default/60">
                  Subtotal (1º Curso)
                </td>
                <td className="py-2 px-3 text-center font-mono text-blue-400 border-r border-border-default/60">
                  {subtotalHoras1}
                </td>
                <td className="py-2 px-3 text-center font-mono text-blue-400 border-r border-border-default/60">
                  {subtotalSemanales1}
                </td>
                <td className="py-2 px-3 text-center text-text-muted">--</td>
              </tr>

              {/* Spacer divider */}
              <tr className="bg-alt h-2">
                <td colSpan={5} className="p-0"></td>
              </tr>

              {/* 2º Curso Group */}
              {modulosSegundoCurso.map((m) => (
                <tr
                  key={m.codigo}
                  className="hover:bg-hover/80 transition-colors text-text-primary"
                >
                  <td className="py-2 px-3 border-r border-border-default/60">
                    <span>
                      {m.codigo}. {m.nombre}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center border-r border-border-default/60 font-semibold text-text-secondary">
                    {m.bilingueNota || (m.bilingue ? "Sí (*)" : "")}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold border-r border-border-default/60">
                    {m.horasTotales}
                  </td>
                  <td className="py-2 px-3 text-center text-text-muted border-r border-border-default/60">
                    --
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-black text-purple-400">
                    {m.horasSemanales}
                  </td>
                </tr>
              ))}

              {/* Subtotal 2º Curso */}
              <tr className="bg-purple-500/10 font-black text-xs border-y border-purple-500/30">
                <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider text-purple-400 border-r border-border-default/60">
                  Subtotal (2º Curso)
                </td>
                <td className="py-2 px-3 text-center font-mono text-purple-400 border-r border-border-default/60">
                  {subtotalHoras2}
                </td>
                <td className="py-2 px-3 text-center text-text-muted border-r border-border-default/60">
                  --
                </td>
                <td className="py-2 px-3 text-center font-mono text-purple-400">
                  {subtotalSemanales2}
                </td>
              </tr>

              {/* Total Final */}
              <tr className="bg-slate-800 font-black text-xs border-t-2 border-slate-700 text-white">
                <td colSpan={2} className="py-2.5 px-3 text-right uppercase tracking-wider text-white border-r border-slate-700">
                  Total Ciclo
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-emerald-400 border-r border-slate-700 text-sm">
                  {totalHorasCiclo}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-cyan-400 border-r border-slate-700">
                  {subtotalSemanales1}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-purple-400">
                  {subtotalSemanales2}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bilingual Footnote */}
        <div className="p-3.5 bg-alt/60 border-t border-border-default text-xs text-text-secondary leading-relaxed">
          <p>
            <strong className="text-blue-400">(*)</strong> Como muestra la tabla anterior, el módulo es{" "}
            <strong>susceptible de impartirse en modalidad bilingüe</strong> conforme a las directrices de la{" "}
            <strong>Resolución de 24 de julio de 2026 de la Dirección General de Formación Profesional de la Junta de Andalucía</strong>, y según determine el{" "}
            <strong>Proyecto Educativo del Centro (PEC)</strong>. No obstante, en el presente curso escolar{" "}
            <strong>no se ha implementado</strong>, ya que dicha modalidad requeriría un refuerzo horario para garantizar la asimilación de contenidos. Por ello, el módulo cuenta con una carga total de{" "}
            <strong>{currentMod.horasTotales} horas</strong>, equivalentes a{" "}
            <strong>{currentMod.horasSemanales} horas semanales durante 32 semanas lectivas</strong>, organizadas en{" "}
            <strong>tres sesiones semanales</strong>.
          </p>
        </div>
      </div>

      {/* 3. Parameter Summary Box (Exact from Image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
            theme === "dark"
              ? "bg-slate-900/90 border-border-default"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="p-3 bg-alt border-b border-border-default">
            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Parámetros Operativos del Módulo ({config.codigo || "1580"})
            </h4>
          </div>

          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                  <th className="py-2 px-3 text-left">Parámetro</th>
                  <th className="py-2 px-3 text-right">Valor Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/80 font-medium">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    Horas totales del módulo
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-cyan-400">
                    {config.horasTotales || currentMod.horasTotales} horas
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    Horas semanales
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-400">
                    {config.horasSemanales || currentMod.horasSemanales} horas
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    Número de semanas
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                    {config.semanasCurso || 32} semanas
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    Número de sesiones semanales
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    3 sesiones
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Informative Guidance Card */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between ${
            theme === "dark"
              ? "bg-slate-900/90 border-cyan-500/30"
              : "bg-blue-50/60 border-blue-200"
          }`}
        >
          <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="font-black text-text-primary">
                Coherencia con la Ordenación Curricular
              </h4>
            </div>
            <p>
              La estructuración en <strong>3 sesiones semanales</strong> (por ejemplo: bloque de 2h + 2h + 1h) permite compatibilizar las clases teóricas de aula con las prácticas continuadas en el taller de instalaciones de agua y redes.
            </p>
            <p>
              Estos parámetros son el punto de partida que alimentan la <strong>Matriz 7.1</strong> y la <strong>Planificación Dual (FFEOE)</strong>.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border-default/60 flex items-center justify-end">
            {onNavigateToView && (
              <button
                type="button"
                onClick={() => onNavigateToView("parametros")}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Modificar en Parámetros Curriculares</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
