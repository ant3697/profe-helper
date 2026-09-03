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
  Scale,
  FileText,
  RotateCcw,
  Settings2,
  ChevronDown,
  ChevronUp,
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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRegulatoryDetails, setShowRegulatoryDetails] = useState(false);

  const cycleData: SigreCyclePlanData =
    config.cyclePlanData || DEFAULT_CYCLE_PLAN_DATA;

  // Regulatory context (State Order + Annual Andalusian Resolution)
  const cursoEscolar =
    config.cursoEscolar || cycleData.cursoEscolar || "2026/2027";
  const gradoNivel =
    config.etapaCiclo || cycleData.gradoCiclo || "medio";

  const getOrdenEstatalDefault = (grado: string) => {
    if (grado === "medio") {
      return "Orden EFD/657/2024, de 25 de junio, por la que se determina el currículo y se regulan determinados aspectos organizativos para los ciclos formativos de grado medio en el ámbito de gestión del Ministerio de Educación, Formación Profesional y Deportes";
    }
    if (grado === "basico") {
      return "Orden EFD/658/2024, de 25 de junio, por la que se determina el currículo y se regulan determinados aspectos organizativos para los ciclos formativos de grado básico";
    }
    return "Orden EFD/659/2024, de 25 de junio, por la que se determina el currículo y se regulan determinados aspectos organizativos para los ciclos formativos de grado superior en el ámbito de gestión del Ministerio de Educación, Formación Profesional y Deportes";
  };

  const getResolucionAndaluciaDefault = (curso: string) => {
    if (curso === "2026/2027") {
      return "Resolución de 24 de julio de 2026 de la Dirección General de Formación Profesional y Educación Permanente por la que se dictan Instrucciones para determinar aspectos relativos a la distribución horaria y a la concreción curricular de las enseñanzas correspondientes a los grados D y E del sistema de Formación Profesional para el curso escolar 2026/2027 en la comunidad autónoma de Andalucía";
    }
    if (curso === "2025/2026") {
      return "Resolución de 26 de junio de 2025 de la Dirección General de Formación Profesional y Educación Permanente por la que se dictan Instrucciones para determinar aspectos relativos a la distribución horaria y a la concreción curricular de las enseñanzas correspondientes a los grados D y E del sistema de Formación Profesional para el curso escolar 2025/2026 en la comunidad autónoma de Andalucía";
    }
    return `Resolución anual de Instrucciones de la Dirección General de Formación Profesional y Educación Permanente para determinar la distribución horaria y la concreción curricular de los Grados D y E para el curso escolar ${curso} en la Comunidad Autónoma de Andalucía`;
  };

  const ordenEstatal =
    config.ordenEstatalReferencia ||
    cycleData.ordenEstatalReferencia ||
    getOrdenEstatalDefault(gradoNivel);

  const resolucionAndalucia =
    config.resolucionInstruccionesAndalucia ||
    cycleData.resolucionInstruccionesAndalucia ||
    getResolucionAndaluciaDefault(cursoEscolar);

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

  const handleUpdateRegulatory = (
    newCurso: string,
    newGrado: "medio" | "superior" | "basico" | "especializacion",
    customResolucion?: string,
    customOrden?: string
  ) => {
    const orden = customOrden || getOrdenEstatalDefault(newGrado);
    const res = customResolucion || getResolucionAndaluciaDefault(newCurso);

    const updatedCycle: SigreCyclePlanData = {
      ...cycleData,
      cursoEscolar: newCurso,
      gradoCiclo: newGrado,
      ordenEstatalReferencia: orden,
      resolucionInstruccionesAndalucia: res,
      ordenReferencia: `${newGrado === "medio" ? "Orden EFD/657/2024" : "Orden EFD/659/2024"} adaptada en Andalucía mediante ${res.slice(0, 50)}...`,
    };

    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        cursoEscolar: newCurso,
        etapaCiclo: newGrado,
        ordenEstatalReferencia: orden,
        resolucionInstruccionesAndalucia: res,
        cyclePlanData: updatedCycle,
      });
    }
  };

  const handleCopyTable = () => {
    let md = `### Organización Ciclo / Módulo y Concreción Curricular (${cursoEscolar})\n\n`;
    md += `**Marco Normativo de Referencia:**\n`;
    md += `- **Normativa Estatal:** ${ordenEstatal} y Real Decreto 659/2023, de 18 de julio.\n`;
    md += `- **Adaptación y Concreción en Andalucía:** ${resolucionAndalucia}.\n\n`;
    md += `Según la referida Resolución de Instrucciones de la Junta de Andalucía para el curso escolar ${cursoEscolar}, se establece la siguiente carga horaria y ordenación del ciclo formativo (2000 horas totales, 30 horas semanales por curso):\n\n`;
    md += `| Módulo/Proyecto | Bilingüe | Horas | 1.º | 2.º |\n`;
    md += `|---|---|---|---|---|\n`;

    modulosPrimerCurso.forEach((m) => {
      md += `| ${m.codigo}. ${m.nombre} | ${m.bilingueNota || (m.bilingue ? "Sí" : "")} | ${m.horasTotales} | ${m.horasSemanales} | |\n`;
    });
    md += `| **Subtotal (1.º Curso)** | | **${subtotalHoras1}** | **${subtotalSemanales1}** | -- |\n\n`;

    modulosSegundoCurso.forEach((m) => {
      md += `| ${m.codigo}. ${m.nombre} | ${m.bilingueNota || (m.bilingue ? "Sí" : "")} | ${m.horasTotales} | | ${m.horasSemanales} |\n`;
    });
    md += `| **Subtotal (2.º Curso)** | | **${subtotalHoras2}** | -- | **${subtotalSemanales2}** |\n`;
    md += `| **Total Ciclo** | | **${totalHorasCiclo}** | **${subtotalSemanales1}** | **${subtotalSemanales2}** |\n\n`;

    md += `(*) ${cycleData.bilingueTexto}\n\n`;
    md += `Parámetros del módulo docente (${config.codigo || "1580"}):\n`;
    md += `- Horas totales: ${config.horasTotales || currentMod.horasTotales}h\n`;
    md += `- Horas semanales: ${config.horasSemanales || currentMod.horasSemanales}h\n`;
    md += `- Número de semanas lectivas: ${config.semanasCurso || 32} semanas\n`;
    md += `- Distribución semanal: Sesiones de 1h, 2h, 3h o 4h en 5 días lectivos (L-V)\n`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Legal Hierarchy Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-blue-500/30"
            : "bg-white border-blue-200 shadow-sm"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Scale className="w-3 h-3 text-blue-400" />
                Andalucía · Curso {cursoEscolar}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                {gradoNivel === "medio"
                  ? "Grado Medio (Orden EFD/657/2024)"
                  : gradoNivel === "basico"
                  ? "Grado Básico (Orden EFD/658/2024)"
                  : "Grado Superior (Orden EFD/659/2024)"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                2000 Horas (Grados D y E)
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Organización Ciclo / Módulo y Concreción Curricular (Andalucía)
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed max-w-4xl">
              En la <strong>Comunidad Autónoma de Andalucía</strong>, la{" "}
              <strong>
                {gradoNivel === "medio"
                  ? "Orden EFD/657/2024, de 25 de junio"
                  : "Orden EFD/659/2024, de 25 de junio"}
              </strong>{" "}
              del Ministerio de Educación, FP y Deportes se adapta anualmente mediante las Instrucciones dictadas por la{" "}
              <strong>Dirección General de Formación Profesional y Educación Permanente</strong> (para el curso {cursoEscolar}:{" "}
              <strong className="text-blue-300">Resolución de 24 de julio de 2026</strong>), regulando la distribución horaria semanal (30h/curso) y la concreción curricular oficial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRegulatoryDetails(!showRegulatoryDetails)}
              className="px-3 py-1.5 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary border border-border-default text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>{showRegulatoryDetails ? "Ocultar Normativa" : "Marco Normativo"}</span>
              {showRegulatoryDetails ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowConfigModal(!showConfigModal)}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Actualización Anual</span>
            </button>

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

        {/* Regulatory Details Drawer (Expandable) */}
        {showRegulatoryDetails && (
          <div className="mt-3 pt-3 border-t border-border-default/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-alt/40 p-3 rounded-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-text-primary">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Marco Estatal de Currículo y Organización:</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed bg-surface/60 p-2 rounded-lg border border-border-default/40">
                {ordenEstatal}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-text-primary">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Adaptación Anual en Andalucía (Instrucciones):</span>
              </div>
              <p className="text-text-secondary text-[11px] leading-relaxed bg-surface/60 p-2 rounded-lg border border-border-default/40">
                {resolucionAndalucia}
              </p>
            </div>
          </div>
        )}

        {/* Annual Dynamic Configuration Drawer */}
        {showConfigModal && (
          <div className="mt-3 pt-3 border-t border-blue-500/30 bg-blue-950/20 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">
                  Selector de Curso Escolar y Adaptación de la Orden Estatal
                </h4>
              </div>
              <span className="text-[10px] text-text-muted">
                Actualizable anualmente por resolución autonómica
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Curso Escolar Lectivo:
                </label>
                <select
                  value={cursoEscolar}
                  onChange={(e) =>
                    handleUpdateRegulatory(e.target.value, gradoNivel as any)
                  }
                  className="w-full px-2.5 py-1.5 bg-surface border border-border-default rounded-lg text-xs font-bold text-text-primary focus:border-blue-500 focus:outline-none"
                >
                  <option value="2026/2027">
                    Curso 2026/2027 (Resolución 24/07/2026)
                  </option>
                  <option value="2025/2026">
                    Curso 2025/2026 (Resolución 26/06/2025)
                  </option>
                  <option value="2027/2028">
                    Curso 2027/2028 (Próximo curso)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                  Nivel / Grado del Ciclo:
                </label>
                <select
                  value={gradoNivel}
                  onChange={(e) =>
                    handleUpdateRegulatory(cursoEscolar, e.target.value as any)
                  }
                  className="w-full px-2.5 py-1.5 bg-surface border border-border-default rounded-lg text-xs font-bold text-text-primary focus:border-blue-500 focus:outline-none"
                >
                  <option value="medio">
                    Grado Medio (Orden EFD/657/2024)
                  </option>
                  <option value="superior">
                    Grado Superior (Orden EFD/659/2024)
                  </option>
                  <option value="basico">
                    Grado Básico (Orden EFD/658/2024)
                  </option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleUpdateRegulatory("2026/2027", "medio")}
                  className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Restablecer Predeterminado 2026/2027
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Full Cycle Table Structure */}
      <div
        className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
          theme === "dark"
            ? "bg-slate-900/90 border-border-default"
            : "bg-white border-slate-300"
        }`}
      >
        <div className="p-3 bg-alt border-b border-border-default flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">
            Concreción horaria y ordenación del ciclo en Andalucía conforme a la{" "}
            <strong>Resolución de 24 de julio de 2026</strong> (Instrucciones curso <strong>{cursoEscolar}</strong>):
          </p>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Total Ciclo: {totalHorasCiclo}h (1.º: {subtotalHoras1}h | 2.º: {subtotalHoras2}h)
          </span>
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
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3 border-r border-border-default/60">
                      <span className="font-semibold text-text-primary">
                        {m.codigo}. {m.nombre}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-border-default/60 font-semibold text-text-secondary">
                      {m.bilingueNota || (m.bilingue ? "Sí (*)" : "")}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold border-r border-border-default/60">
                      {m.horasTotales}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-black text-cyan-400 border-r border-border-default/60">
                      {m.horasSemanales}
                    </td>
                    <td className="py-2 px-3 text-center text-text-muted">
                      --
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal 1º Curso */}
              <tr className="bg-cyan-500/10 font-black text-xs border-y border-cyan-500/30">
                <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider text-cyan-400 border-r border-border-default/60">
                  Subtotal (1.º Curso)
                </td>
                <td className="py-2 px-3 text-center font-mono text-cyan-400 border-r border-border-default/60">
                  {subtotalHoras1}
                </td>
                <td className="py-2 px-3 text-center font-mono text-cyan-400 border-r border-border-default/60">
                  {subtotalSemanales1}
                </td>
                <td className="py-2 px-3 text-center text-text-muted">
                  --
                </td>
              </tr>

              {/* 2º Curso Group */}
              {modulosSegundoCurso.map((m) => {
                const isTarget = m.codigo === (config.codigo || "1580");

                return (
                  <tr
                    key={m.codigo}
                    className={`hover:bg-hover/80 transition-colors ${
                      isTarget
                        ? "bg-purple-500/15 font-black text-purple-300 border-l-4 border-purple-400"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3 border-r border-border-default/60">
                      <span className="font-semibold text-text-primary">
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
                );
              })}

              {/* Subtotal 2º Curso */}
              <tr className="bg-purple-500/10 font-black text-xs border-y border-purple-500/30">
                <td colSpan={2} className="py-2 px-3 text-right uppercase tracking-wider text-purple-400 border-r border-border-default/60">
                  Subtotal (2.º Curso)
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
            <strong>{resolucionAndalucia}</strong>, y según determine el{" "}
            <strong>Proyecto Educativo del Centro (PEC)</strong>. No obstante, en el presente curso escolar {cursoEscolar}{" "}
            <strong>no se ha implementado</strong>, ya que dicha modalidad requeriría un refuerzo horario para garantizar la asimilación de contenidos. Por ello, el módulo cuenta con una carga total de{" "}
            <strong>{config.horasTotales || currentMod.horasTotales} horas</strong>, equivalentes a{" "}
            <strong>{config.horasSemanales || currentMod.horasSemanales} horas semanales durante {config.semanasCurso || 32} semanas lectivas</strong>, organizadas en los 5 días lectivos de la semana.
          </p>
        </div>
      </div>

      {/* 3. Parameter Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${
            theme === "dark"
              ? "bg-slate-900/90 border-border-default"
              : "bg-white border-slate-300"
          }`}
        >
          <div className="p-3 bg-alt border-b border-border-default flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Parámetros Operativos del Módulo ({config.codigo || "1580"})
            </h4>
            <span className="text-[10px] text-text-muted font-mono">
              Andalucía · Curso {cursoEscolar}
            </span>
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
                    {config.horasSemanales || currentMod.horasSemanales} horas/sem
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    Número de semanas lectivas
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                    {config.semanasCurso || 32} semanas (FCE + FFEOE)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-text-primary">
                    Distribución semanal de sesiones
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    Sesiones de 1h, 2h, 3h o 4h en 5 días (L-V)
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
                Coherencia con la Ordenación Curricular en Andalucía
              </h4>
            </div>
            <p>
              La distribución semanal en <strong>los 5 días lectivos</strong> (bloques de 1h, 2h, 3h o 4h) permite compatibilizar las sesiones teóricas con la práctica técnica intensiva de taller y laboratorio.
            </p>
            <p>
              Estos parámetros y la adaptación autonómica de la <strong>{gradoNivel === "medio" ? "Orden EFD/657/2024 (Grado Medio)" : "Orden EFD/659/2024 (Grado Superior)"}</strong> alimentan de forma bidireccional la <strong>Matriz 7.1</strong>, la <strong>Planificación Dual (FFEOE)</strong> y la generación de programaciones docentes.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border-default/60 flex items-center justify-end">
            {onNavigateToView && (
              <button
                type="button"
                onClick={() => onNavigateToView("parametros")}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Configurar Parámetros Curriculares</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
