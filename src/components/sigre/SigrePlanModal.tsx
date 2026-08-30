import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Trash2,
  Plus,
  AlertCircle,
  ShieldAlert,
  BookOpen,
  Clock,
  Calendar,
  Layers,
  Building2,
  School,
  Split,
  ChevronDown,
  Info,
  Sparkles,
  RefreshCw,
  Award,
  ArrowRightLeft,
} from "lucide-react";
import { SigreUDItem, SigreCurricularConfig } from "../../types/sigre";

interface SigrePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  uds: SigreUDItem[];
  moduloTitle: string;
  horasTotales?: number;
  horasSemanales?: number;
  config?: SigreCurricularConfig;
  onConfirmPlan: (
    updatedUds: SigreUDItem[],
    configUpdates?: Partial<SigreCurricularConfig>
  ) => void;
}

export const SigrePlanModal: React.FC<SigrePlanModalProps> = ({
  isOpen,
  onClose,
  uds: initialUds,
  moduloTitle,
  horasTotales = 160,
  horasSemanales = 5,
  config,
  onConfirmPlan,
}) => {
  // Number of partials / trimesters (default 3)
  const [numParciales, setNumParciales] = useState<number>(() => {
    return config?.numParciales || 3;
  });

  // Stage & Dual regime
  const [etapaCiclo, setEtapaCiclo] = useState<"basico" | "medio" | "superior" | "especializacion">(() => {
    return config?.etapaCiclo || "medio";
  });

  const [regimenDual, setRegimenDual] = useState<"general" | "intensivo">(() => {
    return config?.regimenDual || "general";
  });

  // Dual percentage calculation based on regulations
  const getDefaultDualPct = (etapa: string, regimen: string) => {
    if (etapa === "basico") return 20;
    if (etapa === "especializacion") return 10;
    if (regimen === "intensivo") return 40;
    return 25; // General: 20-35% (typical 25%)
  };

  const [porcentajeDual, setPorcentajeDual] = useState<number>(() => {
    return config?.porcentajeDual || getDefaultDualPct(config?.etapaCiclo || "medio", config?.regimenDual || "general");
  });

  // Total module hours breakdown between FCE (Centro) and FFEOE (Empresa)
  const [horasModulo, setHorasModulo] = useState<number>(horasTotales);
  const [isDualConfigOpen, setIsDualConfigOpen] = useState(false);
  const [isTemporalConfigOpen, setIsTemporalConfigOpen] = useState(false);

  // Total teaching weeks (standard: 32 weeks) and session settings
  const [semanasCurso, setSemanasCurso] = useState<number>(() => {
    return config?.semanasCurso || 32;
  });

  const [horasPorSesion, setHorasPorSesion] = useState<number>(() => {
    return config?.horasPorSesion || 1;
  });

  const [duracionSesionMinutos, setDuracionSesionMinutos] = useState<number>(() => {
    return config?.duracionSesionMinutos || 60;
  });

  // Calculated weekly hours based on total module hours and teaching weeks (32 weeks standard)
  const calculatedHorasSemanales = Math.max(1, Math.round(horasModulo / (semanasCurso || 32)));
  const totalSesionesPrevistas = Math.round(horasModulo / (horasPorSesion || 1));
  const sesionesSemanalesPrevistas = Math.max(1, Math.round(calculatedHorasSemanales / (horasPorSesion || 1)));

  // Calculate default FCE vs FFEOE
  const ffeoeHoursCalc = Math.round((horasModulo * porcentajeDual) / 100);
  const fceHoursCalc = horasModulo - ffeoeHoursCalc;

  const [uds, setUds] = useState<SigreUDItem[]>(() => {
    const defaultHoursPerUd = Math.round(horasTotales / (initialUds.length || 8));
    return initialUds.map((u, idx) => {
      // Calculate initial trimester if not set
      const defaultTrimestre = u.trimestre || Math.min(numParciales, Math.floor((idx / (initialUds.length || 8)) * numParciales) + 1);
      const h = u.horasEstimadas || defaultHoursPerUd;
      return {
        ...u,
        horasEstimadas: h,
        sesionesEstimadas: u.sesionesEstimadas || Math.max(1, Math.round(h / (config?.horasPorSesion || 1))),
        trimestre: defaultTrimestre,
      };
    });
  });

  useEffect(() => {
    if (isOpen) {
      const activeNumParciales = config?.numParciales || 3;
      const activeSemanas = config?.semanasCurso || 32;
      const activeHorasPorSesion = config?.horasPorSesion || 1;
      setNumParciales(activeNumParciales);
      setEtapaCiclo(config?.etapaCiclo || "medio");
      setRegimenDual(config?.regimenDual || "general");
      setPorcentajeDual(config?.porcentajeDual || getDefaultDualPct(config?.etapaCiclo || "medio", config?.regimenDual || "general"));
      setHorasModulo(horasTotales);
      setSemanasCurso(activeSemanas);
      setHorasPorSesion(activeHorasPorSesion);
      setDuracionSesionMinutos(config?.duracionSesionMinutos || 60);

      const defaultHoursPerUd = Math.round(horasTotales / (initialUds.length || 8));
      setUds(
        initialUds.map((u, idx) => {
          const defaultTrimestre = u.trimestre || Math.min(activeNumParciales, Math.floor((idx / (initialUds.length || 8)) * activeNumParciales) + 1);
          const h = u.horasEstimadas || defaultHoursPerUd;
          return {
            ...u,
            horasEstimadas: h,
            sesionesEstimadas: u.sesionesEstimadas || Math.max(1, Math.round(h / activeHorasPorSesion)),
            trimestre: defaultTrimestre,
          };
        })
      );
    }
  }, [isOpen, initialUds, horasTotales, config]);

  if (!isOpen) return null;

  const totalAssignedHours = uds.reduce((acc, u) => acc + (u.horasEstimadas || 0), 0);
  const totalAssignedSessions = uds.reduce((acc, u) => acc + (u.sesionesEstimadas || 0), 0);

  // Handle stage change with automatic dual percentage recommendation
  const handleEtapaChange = (newEtapa: "basico" | "medio" | "superior" | "especializacion") => {
    setEtapaCiclo(newEtapa);
    const recPct = getDefaultDualPct(newEtapa, regimenDual);
    setPorcentajeDual(recPct);
  };

  const handleRegimenChange = (newRegimen: "general" | "intensivo") => {
    setRegimenDual(newRegimen);
    const recPct = getDefaultDualPct(etapaCiclo, newRegimen);
    setPorcentajeDual(recPct);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      title: newTitle,
      fullCode: `UD${String(index + 1).padStart(2, "0")}. ${updated[index].bcCode}. ${newTitle}`,
    };
    setUds(updated);
  };

  const handleBcCodeChange = (index: number, newBc: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      bcCode: newBc,
      fullCode: `UD${String(index + 1).padStart(2, "0")}. ${newBc}. ${updated[index].title}`,
    };
    setUds(updated);
  };

  const handleHoursChange = (index: number, hours: number) => {
    const val = Math.max(1, hours || 1);
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      horasEstimadas: val,
      sesionesEstimadas: Math.max(1, Math.round(val / (horasPorSesion || 1))),
    };
    setUds(updated);
  };

  const handleSessionsChange = (index: number, sessions: number) => {
    const val = Math.max(1, sessions || 1);
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      sesionesEstimadas: val,
      horasEstimadas: Math.max(1, Math.round(val * (horasPorSesion || 1))),
    };
    setUds(updated);
  };

  const handleTrimestreChange = (index: number, trim: number) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      trimestre: trim,
    };
    setUds(updated);
  };

  const handleDistributeEvenly = () => {
    if (uds.length === 0) return;
    const baseHours = Math.floor(horasModulo / uds.length);
    let remainder = horasModulo % uds.length;
    const updated = uds.map((u) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      const h = baseHours + extra;
      return {
        ...u,
        horasEstimadas: h,
        sesionesEstimadas: Math.max(1, Math.round(h / (horasPorSesion || 1))),
      };
    });
    setUds(updated);
  };

  const handleAutoDistributeTrimesters = () => {
    if (uds.length === 0) return;
    const perParcial = Math.ceil(uds.length / numParciales);
    const updated = uds.map((u, idx) => {
      const trim = Math.min(numParciales, Math.floor(idx / perParcial) + 1);
      return {
        ...u,
        trimestre: trim,
      };
    });
    setUds(updated);
  };

  const handleDelete = (index: number) => {
    const filtered = uds.filter((_, i) => i !== index);
    const renumbered = filtered.map((item, idx) => ({
      ...item,
      number: idx + 1,
      id: `UD${String(idx + 1).padStart(2, "0")}`,
      fullCode: `UD${String(idx + 1).padStart(2, "0")}. ${item.bcCode}. ${item.title}`,
    }));
    setUds(renumbered);
  };

  const handleClearAll = () => {
    setUds([]);
  };

  const handleAddUd = () => {
    const nextNum = uds.length + 1;
    const defaultHours = Math.round(horasModulo / (nextNum || 1)) || 16;
    const assignedTrimestre = numParciales === 1 ? 1 : Math.min(numParciales, Math.floor(((nextNum - 1) / (nextNum || 1)) * numParciales) + 1);
    const newUd: SigreUDItem = {
      id: `UD${String(nextNum).padStart(2, "0")}`,
      number: nextNum,
      bcCode: `BC${nextNum}`,
      title: "Nueva Unidad Didáctica",
      fullCode: `UD${String(nextNum).padStart(2, "0")}. BC${nextNum}. Nueva Unidad Didáctica`,
      horasEstimadas: defaultHours,
      sesionesEstimadas: Math.max(1, Math.round(defaultHours / (horasPorSesion || 1))),
      trimestre: assignedTrimestre,
      isPrl: false,
      status: "pending",
    };
    setUds([...uds, newUd]);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= uds.length) return;
    const reordered = [...uds];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const renumbered = reordered.map((item, idx) => ({
      ...item,
      number: idx + 1,
      id: `UD${String(idx + 1).padStart(2, "0")}`,
      fullCode: `UD${String(idx + 1).padStart(2, "0")}. ${item.bcCode}. ${item.title}`,
    }));
    setUds(renumbered);
  };

  // Group summary by partial/trimester
  const getParcialSummary = (pNum: number) => {
    const parcialUds = uds.filter((u) => (u.trimestre || 1) === pNum);
    const hours = parcialUds.reduce((acc, u) => acc + (u.horasEstimadas || 0), 0);
    const sessions = parcialUds.reduce((acc, u) => acc + (u.sesionesEstimadas || 0), 0);
    return { count: parcialUds.length, hours, sessions };
  };

  const getParcialLabel = (pNum: number) => {
    if (numParciales === 1) return "Evaluación Única / Anual";
    if (numParciales === 2) return `${pNum}º Semestre (P${pNum})`;
    if (numParciales === 4) return `${pNum}º Bimestre (P${pNum})`;
    return `${pNum}º Trimestre (P${pNum})`;
  };

  const handleSave = () => {
    const configUpdates: Partial<SigreCurricularConfig> = {
      numParciales,
      etapaCiclo,
      regimenDual,
      porcentajeDual,
      horasTotales: horasModulo,
      horasFceModulo: fceHoursCalc,
      horasFfeoeModulo: ffeoeHoursCalc,
      semanasCurso,
      duracionSesionMinutos,
      horasPorSesion,
      totalSesionesPrevistas,
      horasSemanales: calculatedHorasSemanales,
      incluyePeriodoRecuperacionJunio: true,
      incluyePlanificacionSiguienteCursoJunio: true,
    };
    onConfirmPlan(uds, configUpdates);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-default bg-alt/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-text-primary flex items-center gap-2">
                Propuesta del Plan de Unidades Didácticas
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold">
                  {uds.length} UDs • {totalSesionesPrevistas} Sesiones
                </span>
              </h3>
              <p className="text-xs text-text-muted">
                {moduloTitle || "Módulo Profesional"} — Configuración de Parciales, Semanas Lectivas ({semanasCurso} sem), Sesiones y Formación Dual
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-alt transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top Configuration Controls: Parciales & Formación Dual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Parciales Selector Card */}
            <div className="p-3.5 bg-background border border-border-default rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Número de Parciales / Evaluaciones:</span>
                </div>
                <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setNumParciales(n);
                        // Adjust any UD that has trimestre > n
                        setUds((prev) =>
                          prev.map((u) => ({
                            ...u,
                            trimestre: Math.min(n, u.trimestre || 1),
                          }))
                        );
                      }}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                        numParciales === n
                          ? "bg-amber-500 text-black shadow-sm"
                          : "text-text-muted hover:text-text-primary hover:bg-alt"
                      }`}
                    >
                      {n} {n === 3 ? "Trim." : n === 2 ? "Sem." : n === 1 ? "Anual" : "P"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live breakdown per partial */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                {Array.from({ length: numParciales }, (_, i) => i + 1).map((pNum) => {
                  const stat = getParcialSummary(pNum);
                  return (
                    <div
                      key={pNum}
                      className="p-2 rounded-lg bg-surface border border-border-default text-center text-[11px]"
                    >
                      <span className="font-bold text-amber-400 block truncate">{getParcialLabel(pNum)}</span>
                      <span className="text-text-muted font-mono font-semibold">
                        {stat.count} UDs • <strong className="text-text-primary">{stat.hours}h</strong> • <span className="text-purple-400 font-bold">{stat.sessions} ses.</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleAutoDistributeTrimesters}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-repartir UDs en los {numParciales} parciales
                </button>
              </div>
            </div>

            {/* Formación Dual Card (LO 3/2022 y RD 659/2023) */}
            <div className="p-3.5 bg-background border border-border-default rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Formación Dual (FCE Centro vs FFEOE Empresa):</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDualConfigOpen(!isDualConfigOpen)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                >
                  {isDualConfigOpen ? "Ocultar" : "Ajustar"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDualConfigOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Dual stats bar */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <School className="w-3.5 h-3.5" /> FCE (Centro):
                  </span>
                  <span className="font-mono font-black text-emerald-300">{fceHoursCalc}h</span>
                </div>
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> FFEOE (Empresa):
                  </span>
                  <span className="font-mono font-black text-cyan-300">{ffeoeHoursCalc}h ({porcentajeDual}%)</span>
                </div>
              </div>

              {/* Expandable Dual Stage / Settings */}
              {isDualConfigOpen && (
                <div className="pt-2 border-t border-border-default/60 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">
                        Etapa del Ciclo Formativo:
                      </label>
                      <select
                        value={etapaCiclo}
                        onChange={(e) => handleEtapaChange(e.target.value as any)}
                        className="w-full px-2 py-1 bg-surface border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="basico">Grado Básico (20% Dual)</option>
                        <option value="medio">Grado Medio (General / Intensivo)</option>
                        <option value="superior">Grado Superior (General / Intensivo)</option>
                        <option value="especializacion">Curso Especialización (Grado E)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-text-muted block mb-1">
                        Régimen Dual (RD 659/2023):
                      </label>
                      <select
                        value={regimenDual}
                        onChange={(e) => handleRegimenChange(e.target.value as any)}
                        disabled={etapaCiclo === "basico" || etapaCiclo === "especializacion"}
                        className="w-full px-2 py-1 bg-surface border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="general">Régimen General (20% - 35%)</option>
                        <option value="intensivo">Régimen Intensivo (35% - 50%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2 bg-alt/50 rounded-lg text-[10px] text-text-muted flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      Normativa LO 3/2022: La formación dual distribuye las {horasModulo}h del módulo entre docencia en centro educativo (FCE: {fceHoursCalc}h) y fase práctica en empresa (FFEOE: {ffeoeHoursCalc}h), contempladas en el calendario y cuadrante horario.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Temporal & Session Planning (32 Weeks Standard) */}
          <div className="p-3.5 bg-background border border-border-default rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Marco Temporal del Curso y Previsión de Sesiones (Base: {semanasCurso} Semanas Lectivas):</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTemporalConfigOpen(!isTemporalConfigOpen)}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5"
              >
                {isTemporalConfigOpen ? "Ocultar Parámetros" : "Ajustar Sesiones/Semanas"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTemporalConfigOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Live Metrics row: 32 weeks, sessions, weekly hours */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-surface border border-border-default rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-text-muted font-bold">Carga Total Módulo:</span>
                <span className="font-mono font-black text-amber-400 text-sm mt-0.5">{horasModulo}h</span>
              </div>
              <div className="p-2.5 bg-surface border border-border-default rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-text-muted font-bold">Semanas del Curso:</span>
                <span className="font-mono font-black text-cyan-400 text-sm mt-0.5">{semanasCurso} sem.</span>
              </div>
              <div className="p-2.5 bg-surface border border-border-default rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-text-muted font-bold">Horas Semanales:</span>
                <span className="font-mono font-black text-emerald-400 text-sm mt-0.5">{calculatedHorasSemanales} h/sem</span>
              </div>
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-purple-300 font-bold">Total Sesiones Previstas:</span>
                <span className="font-mono font-black text-purple-400 text-sm mt-0.5">{totalSesionesPrevistas} sesiones <span className="text-[10px] font-normal text-text-muted">({sesionesSemanalesPrevistas} ses/sem)</span></span>
              </div>
            </div>

            {/* Expandable Temporal Configuration */}
            {isTemporalConfigOpen && (
              <div className="p-3 bg-surface/80 border border-border-default rounded-xl space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-1">
                      Semanas Lectivas Ordinarias del Curso:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="20"
                        max="40"
                        value={semanasCurso}
                        onChange={(e) => setSemanasCurso(Math.max(1, Number(e.target.value) || 32))}
                        className="w-20 px-2 py-1 bg-background border border-border-default rounded-lg font-mono font-bold text-text-primary text-xs"
                      />
                      <div className="flex items-center gap-1">
                        {[30, 32, 34].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSemanasCurso(s)}
                            className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer ${
                              semanasCurso === s ? "bg-cyan-500 text-black font-black" : "bg-alt text-text-muted hover:text-text-primary"
                            }`}
                          >
                            {s}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-1">
                      Horas / Tipo de Sesión Lectiva:
                    </label>
                    <select
                      value={horasPorSesion}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        setHorasPorSesion(h);
                        setDuracionSesionMinutos(h === 2 ? 120 : h === 1 ? 60 : 55);
                        // Update all UDs estimated sessions
                        setUds((prev) =>
                          prev.map((u) => ({
                            ...u,
                            sesionesEstimadas: Math.max(1, Math.round((u.horasEstimadas || 1) / h)),
                          }))
                        );
                      }}
                      className="w-full px-2 py-1 bg-background border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:border-purple-500 focus:outline-none"
                    >
                      <option value={1}>1 hora estándar (60 min / 1 sesión = 1h)</option>
                      <option value={2}>Bloque de taller doble (2 horas / 120 min = 1 sesión)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-muted block mb-1">
                      Reparto automático uniforme:
                    </label>
                    <button
                      type="button"
                      onClick={handleDistributeEvenly}
                      className="w-full px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Equilibrar Horas y Sesiones
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* June Recovery & Academic Planning Information Note */}
            <div className="p-3 bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-emerald-500/10 border border-blue-500/30 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Info className="w-4 h-4 shrink-0" />
                <span>Distribución Temporal Normativa del Curso (32 Semanas + Mes de Junio):</span>
              </div>
              <p className="text-text-muted text-[11px] leading-relaxed">
                • <strong>Periodo Ordinario (32 semanas lectivas):</strong> Comprende la impartición efectiva de las Unidades Didácticas (con su carga de <span className="text-emerald-400 font-semibold">FCE en centro</span> y <span className="text-cyan-400 font-semibold">FFEOE práctica en empresa</span>) distribuidas a lo largo de los parciales/trimestres hasta la última sesión de evaluación ordinaria.
              </p>
              <p className="text-text-muted text-[11px] leading-relaxed">
                • <strong>Mes de Junio (Tras la última sesión de evaluación):</strong> Reservado normativamente para el <em>periodo de recuperación de aprendizajes no adquiridos</em> (evaluación extraordinaria, refuerzo y tutorías del alumnado) y para la <em>planificación, memorias finales y programación del siguiente curso lectivo</em>.
              </p>
            </div>
          </div>

          {/* Balance & Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-surface border border-border-default rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Horas Asignadas:</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold ${
                    totalAssignedHours === horasModulo ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {totalAssignedHours} / {horasModulo}h
                </span>
                <button
                  type="button"
                  onClick={handleDistributeEvenly}
                  className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition-colors cursor-pointer"
                  title="Repartir horas de manera uniforme"
                >
                  Equilibrar
                </button>
              </div>
            </div>

            <div className="p-3 bg-surface border border-border-default rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Sesiones Asignadas:</span>
              </div>
              <span className="font-mono font-bold text-purple-400">
                {totalAssignedSessions} / {totalSesionesPrevistas} sesiones
              </span>
            </div>

            <div className="p-3 bg-surface border border-border-default rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Semanas Totales Estimadas:</span>
              </div>
              <span className="font-mono font-bold text-cyan-400">
                ~{(totalAssignedHours / calculatedHorasSemanales).toFixed(1)} / {semanasCurso} sem.
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>Regla de Priorización PRL:</strong> Los bloques de contenido de Prevención de Riesgos y Seguridad están asignados como <strong>UD01</strong> con carácter transversal prioritario.
            </div>
          </div>

          {/* List of UDs */}
          {uds.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border-default rounded-2xl bg-alt/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">No hay Unidades Didácticas en el plan</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Has eliminado todas las UDs. Pulsa el botón inferior para añadir una nueva unidad didáctica.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddUd}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Añadir Primera Unidad Didáctica
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1 text-[11px] text-text-muted">
                <span>
                  {uds.length} {uds.length === 1 ? "Unidad configurada" : "Unidades configuradas"} en {numParciales} {numParciales === 1 ? "evaluación" : "parciales/trimestres"} ({totalSesionesPrevistas} sesiones previstas)
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hover:text-red-400 transition-colors cursor-pointer text-[10px] font-semibold"
                >
                  Vaciar lista
                </button>
              </div>

              {uds.map((ud, idx) => {
                const currentTrim = ud.trimestre || 1;
                const estimatedWeeksForUd = ((ud.horasEstimadas || 1) / calculatedHorasSemanales).toFixed(1);
                return (
                  <div
                    key={ud.id}
                    className="p-3 sm:p-3.5 bg-background border border-border-default rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, "up")}
                          className="text-text-muted hover:text-amber-400 disabled:opacity-20 transition-colors p-0.5 cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === uds.length - 1}
                          onClick={() => handleMove(idx, "down")}
                          className="text-text-muted hover:text-amber-400 disabled:opacity-20 transition-colors p-0.5 cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>

                      <span className="font-mono font-black text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md shrink-0">
                        {ud.id}
                      </span>

                      <input
                        type="text"
                        value={ud.bcCode}
                        onChange={(e) => handleBcCodeChange(idx, e.target.value)}
                        className="w-16 px-2 py-1 text-xs font-mono font-bold bg-surface border border-border-default rounded-lg text-text-primary focus:border-amber-500 focus:outline-none"
                        placeholder="BCx"
                      />

                      <input
                        type="text"
                        value={ud.title}
                        onChange={(e) => handleTitleChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1 text-xs sm:text-sm font-semibold bg-surface border border-border-default rounded-lg text-text-primary focus:border-amber-500 focus:outline-none truncate"
                      />

                      {ud.isPrl && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-300 font-bold rounded uppercase shrink-0">
                          PRL Prioritaria
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                      {/* Parcial / Trimestre Selector */}
                      <div className="flex items-center gap-1 bg-surface border border-border-default px-2 py-1 rounded-lg text-xs">
                        <span className="text-[10px] text-text-muted font-bold mr-0.5">Parcial:</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: numParciales }, (_, i) => i + 1).map((pNum) => (
                            <button
                              key={pNum}
                              type="button"
                              onClick={() => handleTrimestreChange(idx, pNum)}
                              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                                currentTrim === pNum
                                  ? "bg-amber-500 text-black shadow-xs font-black"
                                  : "text-text-muted hover:text-text-primary hover:bg-alt"
                              }`}
                              title={`Asignar a ${getParcialLabel(pNum)}`}
                            >
                              {pNum}T
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hours & Sessions Reparto Lógico */}
                      <div className="flex items-center gap-1.5 bg-surface border border-border-default px-2 py-1 rounded-lg text-xs">
                        {/* Hours */}
                        <div className="flex items-center gap-1" title="Horas lectivas estimadas de la unidad">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={ud.horasEstimadas || 16}
                            onChange={(e) => handleHoursChange(idx, Number(e.target.value))}
                            className="w-10 bg-transparent text-text-primary font-mono font-bold text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-text-muted font-semibold">h</span>
                        </div>

                        <span className="text-border-default">|</span>

                        {/* Sessions */}
                        <div className="flex items-center gap-1" title="Número previsto de sesiones calculadas">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={ud.sesionesEstimadas || Math.max(1, Math.round((ud.horasEstimadas || 16) / horasPorSesion))}
                            onChange={(e) => handleSessionsChange(idx, Number(e.target.value))}
                            className="w-10 bg-transparent text-purple-400 font-mono font-bold text-center focus:outline-none"
                          />
                          <span className="text-[10px] text-purple-300 font-semibold">ses.</span>
                        </div>

                        <span className="text-border-default">|</span>

                        {/* Weeks badge */}
                        <span className="text-[10px] font-mono text-cyan-400 font-bold px-1" title={`Ocupa aproximadamente ${estimatedWeeksForUd} semanas en un curso de ${semanasCurso} semanas`}>
                          ~{estimatedWeeksForUd} sem
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar UD"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {uds.length > 0 && (
            <button
              type="button"
              onClick={handleAddUd}
              className="w-full py-2.5 border border-dashed border-border-default hover:border-amber-500 text-xs font-bold text-text-muted hover:text-amber-400 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Añadir Otra Unidad Didáctica
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-default bg-alt/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4" /> {uds.length === 0 ? "Guardar y Limpiar Plan (0 UDs)" : `Aprobar Plan (${uds.length} UDs • ${totalAssignedHours}h • ${totalSesionesPrevistas} Sesiones • ${semanasCurso} Semanas)`}
          </button>
        </div>
      </div>
    </div>
  );
};
