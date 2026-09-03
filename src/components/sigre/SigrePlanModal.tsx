import React, { useState, useEffect, useRef } from "react";
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
  FileSpreadsheet,
  ListOrdered,
  CalendarRange,
  GraduationCap,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { SigreUDItem, SigreCurricularConfig, SigrePedagogicalPhaseGroup } from "../../types/sigre";
import { DEFAULT_PEDAGOGICAL_PHASES } from "../../data/sigreCurricularModelPreset";
import {
  getDualRegulationParams,
  auditDualRegulationCompliance,
  autoDistributeDualHoursAndRAs,
  EducationalStageType,
  DualRegimeType,
} from "../../utils/sigreDualRegulations";

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
  // Modal View Mode Tab: "unidades" (Quick List) vs "matriz_planificacion" (Full Module Planning Table 7.1)
  const [activePlanTab, setActivePlanTab] = useState<"unidades" | "matriz_planificacion">("matriz_planificacion");

  // Number of partials / trimesters (default 3)
  const [numParciales, setNumParciales] = useState<number>(() => {
    return config?.numParciales || 3;
  });

  // Course of this module (1º Curso vs 2º Curso)
  const [cursoModulo, setCursoModulo] = useState<1 | 2>(() => {
    if (config?.cursoModulo) return config.cursoModulo;
    if (config?.curso?.includes("2")) return 2;
    return 1;
  });

  // Stage & Dual regime
  const [etapaCiclo, setEtapaCiclo] = useState<EducationalStageType>(() => {
    return (config?.etapaCiclo as EducationalStageType) || "superior";
  });

  const [regimenDual, setRegimenDual] = useState<DualRegimeType>(() => {
    return (config?.regimenDual as DualRegimeType) || "general";
  });

  // Course-specific Dual percentages (%) & Direct Dual Hours (h)
  const [horasPrimerCurso, setHorasPrimerCurso] = useState<number>(() => {
    return config?.horasPrimerCurso || config?.cyclePlanData?.horasPrimerCurso || 995;
  });

  const [horasSegundoCurso, setHorasSegundoCurso] = useState<number>(() => {
    return config?.horasSegundoCurso || config?.cyclePlanData?.horasSegundoCurso || 1005;
  });

  const [porcentajeDualPrimerCurso, setPorcentajeDualPrimerCurso] = useState<number>(() => {
    return config?.porcentajeDualPrimerCurso ?? 12.1;
  });

  const [porcentajeDualSegundoCurso, setPorcentajeDualSegundoCurso] = useState<number>(() => {
    return config?.porcentajeDualSegundoCurso ?? 25.0;
  });

  const [horasFfeoePrimerCurso, setHorasFfeoePrimerCurso] = useState<number>(() => {
    if (config?.horasFfeoePrimerCurso !== undefined) return config.horasFfeoePrimerCurso;
    const pct = config?.porcentajeDualPrimerCurso ?? 12.1;
    const h1 = config?.horasPrimerCurso || config?.cyclePlanData?.horasPrimerCurso || 995;
    return Math.round((h1 * pct) / 100);
  });

  const [horasFfeoeSegundoCurso, setHorasFfeoeSegundoCurso] = useState<number>(() => {
    if (config?.horasFfeoeSegundoCurso !== undefined) return config.horasFfeoeSegundoCurso;
    const pct = config?.porcentajeDualSegundoCurso ?? 25.0;
    const h2 = config?.horasSegundoCurso || config?.cyclePlanData?.horasSegundoCurso || 1005;
    return Math.round((h2 * pct) / 100);
  });

  // Start dates for Dual period in enterprise
  const [fechaInicioDualPrimerCurso, setFechaInicioDualPrimerCurso] = useState<string>(() => {
    return config?.fechaInicioDualPrimerCurso || config?.cyclePlanData?.fechaInicioDualPrimerCurso || "17 de marzo";
  });

  const [fechaInicioDualSegundoCurso, setFechaInicioDualSegundoCurso] = useState<string>(() => {
    return config?.fechaInicioDualSegundoCurso || config?.cyclePlanData?.fechaInicioDualSegundoCurso || "24 de marzo";
  });

  // Weekly dual hours in enterprise (e.g. 30h/sem, 35h/sem)
  const [horasSemanalesDualPrimerCurso, setHorasSemanalesDualPrimerCurso] = useState<number>(() => {
    return config?.horasSemanalesDualPrimerCurso || config?.cyclePlanData?.horasSemanalesDualPrimerCurso || 30;
  });

  const [horasSemanalesDualSegundoCurso, setHorasSemanalesDualSegundoCurso] = useState<number>(() => {
    return config?.horasSemanalesDualSegundoCurso || config?.cyclePlanData?.horasSemanalesDualSegundoCurso || 30;
  });

  // Active module dual values based on its course
  const activeDualPct = cursoModulo === 1 ? porcentajeDualPrimerCurso : porcentajeDualSegundoCurso;
  const activeDualHours = cursoModulo === 1 ? horasFfeoePrimerCurso : horasFfeoeSegundoCurso;
  const activeFechaInicioDual = cursoModulo === 1 ? fechaInicioDualPrimerCurso : fechaInicioDualSegundoCurso;
  const activeHorasSemanalesDual = cursoModulo === 1 ? horasSemanalesDualPrimerCurso : horasSemanalesDualSegundoCurso;

  // Module-specific Dual state (repercussion on this individual module)
  const [porcentajeDualModulo, setPorcentajeDualModulo] = useState<number>(() => {
    if (config?.porcentajeDual !== undefined) return config.porcentajeDual;
    return cursoModulo === 1 ? 12.1 : 25.0;
  });

  const [targetFfeoeModulo, setTargetFfeoeModulo] = useState<number>(() => {
    if (config?.horasFfeoeModulo !== undefined) return config.horasFfeoeModulo;
    const initialPct = config?.porcentajeDual !== undefined ? config.porcentajeDual : (cursoModulo === 1 ? 12.1 : 25.0);
    return Math.round((horasTotales * initialPct) / 100);
  });

  // Handlers for stage and regime switching with regulatory presets
  const handleSelectEtapa = (newStage: EducationalStageType) => {
    setEtapaCiclo(newStage);
    const p = getDualRegulationParams(newStage, regimenDual);
    if (newStage === "especializacion") {
      setHorasPrimerCurso(p.totalCycleHours);
      setHorasSegundoCurso(0);
      setHorasFfeoePrimerCurso(p.typicalCourse1.recommendedHours);
      setPorcentajeDualPrimerCurso(p.typicalCourse1.recommendedPct);
      setHorasFfeoeSegundoCurso(0);
      setPorcentajeDualSegundoCurso(0);
      setPorcentajeDualModulo(p.typicalCourse1.recommendedPct);
      setTargetFfeoeModulo(Math.round((horasModulo * p.typicalCourse1.recommendedPct) / 100));
    } else if (newStage === "basico") {
      setHorasPrimerCurso(1000);
      setHorasSegundoCurso(1000);
      setHorasFfeoePrimerCurso(0);
      setPorcentajeDualPrimerCurso(0);
      setHorasFfeoeSegundoCurso(400);
      setPorcentajeDualSegundoCurso(40.0);
      const modPct = cursoModulo === 1 ? 0 : 20.0;
      setPorcentajeDualModulo(modPct);
      setTargetFfeoeModulo(Math.round((horasModulo * modPct) / 100));
    } else {
      // Medio / Superior
      setHorasPrimerCurso(995);
      setHorasSegundoCurso(1005);
      setHorasFfeoePrimerCurso(120);
      setPorcentajeDualPrimerCurso(12.1);
      setHorasFfeoeSegundoCurso(410);
      setPorcentajeDualSegundoCurso(40.8);
      const modPct = cursoModulo === 1 ? 12.1 : 25.0;
      setPorcentajeDualModulo(modPct);
      setTargetFfeoeModulo(Math.round((horasModulo * modPct) / 100));
    }
  };

  const handleSelectRegimen = (newRegime: DualRegimeType) => {
    setRegimenDual(newRegime);
    const p = getDualRegulationParams(etapaCiclo, newRegime);
    if (newRegime === "no_dual") {
      setHorasFfeoePrimerCurso(0);
      setPorcentajeDualPrimerCurso(0);
      setHorasFfeoeSegundoCurso(0);
      setPorcentajeDualSegundoCurso(0);
      setTargetFfeoeModulo(0);
      setPorcentajeDualModulo(0);
    } else if (newRegime === "intensivo") {
      const h1 = etapaCiclo === "especializacion" ? 0 : 250;
      const h2 = etapaCiclo === "especializacion" ? 250 : 550;
      setHorasFfeoePrimerCurso(h1);
      setPorcentajeDualPrimerCurso(h1 > 0 ? parseFloat(((h1 / (horasPrimerCurso || 1000)) * 100).toFixed(1)) : 0);
      setHorasFfeoeSegundoCurso(h2);
      setPorcentajeDualSegundoCurso(h2 > 0 ? parseFloat(((h2 / (horasSegundoCurso || 1000)) * 100).toFixed(1)) : 0);
      const modPct = 40.0;
      setPorcentajeDualModulo(modPct);
      setTargetFfeoeModulo(Math.round((horasModulo * modPct) / 100));
    } else {
      // General
      const h1 = p.typicalCourse1.recommendedHours;
      const h2 = p.typicalCourse2.recommendedHours;
      setHorasFfeoePrimerCurso(h1);
      setPorcentajeDualPrimerCurso(p.typicalCourse1.recommendedPct);
      setHorasFfeoeSegundoCurso(h2);
      setPorcentajeDualSegundoCurso(p.typicalCourse2.recommendedPct);
      const modPct = cursoModulo === 1 ? p.typicalCourse1.recommendedPct : (etapaCiclo === "especializacion" ? 20 : 25);
      setPorcentajeDualModulo(modPct);
      setTargetFfeoeModulo(Math.round((horasModulo * modPct) / 100));
    }
  };

  // Handlers for bidirectional synchronization between % and Hours (1º and 2º Curso del Ciclo)
  const handleUpdatePrimerCursoFfeoeHours = (newHours: number) => {
    const safeH = Math.max(0, newHours);
    setHorasFfeoePrimerCurso(safeH);
    const newPct = parseFloat(((safeH / (horasPrimerCurso || 995)) * 100).toFixed(1));
    setPorcentajeDualPrimerCurso(newPct);
  };

  const handleUpdatePrimerCursoPct = (newPct: number) => {
    const safePct = Math.max(0, newPct);
    setPorcentajeDualPrimerCurso(safePct);
    const newHours = Math.round(((horasPrimerCurso || 995) * safePct) / 100);
    setHorasFfeoePrimerCurso(newHours);
  };

  const handleUpdateSegundoCursoFfeoeHours = (newHours: number) => {
    const safeH = Math.max(0, newHours);
    setHorasFfeoeSegundoCurso(safeH);
    const newPct = parseFloat(((safeH / (horasSegundoCurso || 1005)) * 100).toFixed(1));
    setPorcentajeDualSegundoCurso(newPct);
  };

  const handleUpdateSegundoCursoPct = (newPct: number) => {
    const safePct = Math.max(0, newPct);
    setPorcentajeDualSegundoCurso(safePct);
    const newHours = Math.round(((horasSegundoCurso || 1005) * safePct) / 100);
    setHorasFfeoeSegundoCurso(newHours);
  };

  // Handlers for bidirectional synchronization of Module Repercussion (FFEOE en este Módulo)
  const handleUpdateModuloFfeoeHours = (newHours: number) => {
    const safeH = Math.max(0, Math.min(horasModulo, newHours));
    setTargetFfeoeModulo(safeH);
    const newPct = parseFloat(((safeH / (horasModulo || 1)) * 100).toFixed(1));
    setPorcentajeDualModulo(newPct);
  };

  const handleUpdateModuloDualPct = (newPct: number) => {
    const safePct = Math.max(0, Math.min(100, newPct));
    setPorcentajeDualModulo(safePct);
    const newHours = Math.round(((horasModulo || 1) * safePct) / 100);
    setTargetFfeoeModulo(newHours);
  };

  // Total module hours breakdown between FCE (Centro) and FFEOE (Empresa)
  const [horasModulo, setHorasModulo] = useState<number>(horasTotales);
  const [isDualConfigOpen, setIsDualConfigOpen] = useState(false);
  const [isTemporalConfigOpen, setIsTemporalConfigOpen] = useState(false);

  // Target hours in FFEOE (Empresa) vs FCE (Centro) for the current module
  const targetFceModulo = Math.max(0, horasModulo - targetFfeoeModulo);

  // Total teaching weeks (standard: 32 weeks) and session settings
  const [semanasCurso, setSemanasCurso] = useState<number>(() => {
    return config?.semanasCurso || 32;
  });

  const [horasPorSesion, setHorasPorSesion] = useState<number>(() => {
    return config?.horasPorSesion || 1;
  });

  const [duracionSesionMinutos, setDuracionSesionMinutos] = useState<number>(() => {
    return config?.duracionSesionMinutos || (config?.horasPorSesion ? config.horasPorSesion * 60 : 60);
  });

  const [distribucionSemanalDias, setDistribucionSemanalDias] = useState<
    { dia: "L" | "M" | "X" | "J" | "V"; nombre: string; horas: number; activo: boolean }[]
  >(() => {
    if (config?.distribucionSemanalDias?.length) {
      return config.distribucionSemanalDias;
    }
    const hSem = config?.horasSemanales || Math.max(1, Math.round(horasModulo / (config?.semanasCurso || 32)));
    const hSes = config?.horasPorSesion || 1;
    const dias: { dia: "L" | "M" | "X" | "J" | "V"; nombre: string }[] = [
      { dia: "L", nombre: "Lunes" },
      { dia: "M", nombre: "Martes" },
      { dia: "X", nombre: "Miércoles" },
      { dia: "J", nombre: "Jueves" },
      { dia: "V", nombre: "Viernes" },
    ];
    return dias.map((d, i) => ({
      dia: d.dia,
      nombre: d.nombre,
      horas: i < Math.min(5, Math.ceil(hSem / hSes)) ? hSes : 0,
      activo: i < Math.min(5, Math.ceil(hSem / hSes)),
    }));
  });

  // Calculated weekly hours based on total module hours and teaching weeks (32 weeks standard)
  const calculatedHorasSemanales = Math.max(1, Math.round(horasModulo / (semanasCurso || 32)));
  const totalSesionesPrevistas = Math.round(horasModulo / (horasPorSesion || 1));
  const sesionesSemanalesPrevistas = Math.max(1, Math.round(calculatedHorasSemanales / (horasPorSesion || 1)));

  // Total dual hours for the whole cycle (1º + 2º)
  const totalHorasFfeoe1 = Math.round((horasPrimerCurso * porcentajeDualPrimerCurso) / 100);
  const totalHorasFfeoe2 = Math.round((horasSegundoCurso * porcentajeDualSegundoCurso) / 100);
  const totalHorasFfeoeCiclo = totalHorasFfeoe1 + totalHorasFfeoe2;
  const totalHorasCiclo = horasPrimerCurso + horasSegundoCurso;
  const porcentajeDualCicloGlobal = parseFloat(((totalHorasFfeoeCiclo / (totalHorasCiclo || 2000)) * 100).toFixed(1));

  // Dual Regulation Parameters & Live Compliance Audit (LO 3/2022 y RD 659/2023)
  const dualRegulationParams = getDualRegulationParams(
    etapaCiclo,
    regimenDual,
    totalHorasCiclo
  );

  const [uds, setUds] = useState<SigreUDItem[]>(() => {
    const defaultHoursPerUd = Math.round(horasTotales / (initialUds.length || 8));
    const defaultWeight = parseFloat((100 / (initialUds.length || 8)).toFixed(2));
    const activeNumParciales = numParciales || 3;
    const hasDiverseTrimesters = initialUds.some((u) => u.trimestre && u.trimestre > 1);
    const perParcial = Math.ceil((initialUds.length || 8) / activeNumParciales);

    return initialUds.map((u, idx) => {
      const defaultTrimestre = (hasDiverseTrimesters && u.trimestre)
        ? Math.min(activeNumParciales, u.trimestre)
        : Math.min(activeNumParciales, Math.floor(idx / perParcial) + 1);
      const h = u.horasEstimadas || defaultHoursPerUd;
      return {
        ...u,
        horasEstimadas: h,
        horasFfce: u.horasFfce ?? h,
        horasFfeoe: u.horasFfeoe ?? 0,
        isRaFfeoe: u.isRaFfeoe ?? ((u.horasFfeoe ?? 0) > 0),
        pesoPorcentaje: u.pesoPorcentaje ?? defaultWeight,
        sesionesEstimadas: u.sesionesEstimadas || Math.max(1, Math.round(h / (config?.horasPorSesion || 1))),
        trimestre: defaultTrimestre,
        fasePedagogicaId: u.fasePedagogicaId || (idx < 4 ? "fase_1" : idx < 7 ? "fase_2" : idx < 9 ? "fase_3" : "fase_4"),
        fasePedagogicaNombre: u.fasePedagogicaNombre || (idx < 4 ? "Fase I: Planificación y Fundamentos" : idx < 7 ? "Fase II: Desarrollo Técnico" : idx < 9 ? "Fase III: Aplicación y Práctica" : "Fase IV: Integración y Explotación"),
      };
    });
  });

  const dualAudit = auditDualRegulationCompliance(
    {
      ...config,
      etapaCiclo,
      regimenDual,
      horasTotales: horasModulo,
      horasPrimerCurso,
      horasSegundoCurso,
      horasFfeoePrimerCurso,
      horasFfeoeSegundoCurso,
      horasFfeoeModulo: targetFfeoeModulo,
      porcentajeDual: porcentajeDualModulo,
    },
    uds
  );

  const prevIsOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const activeNumParciales = config?.numParciales || 3;
      const activeSemanas = config?.semanasCurso || 32;
      const activeHorasPorSesion = config?.horasPorSesion || 1;
      const curMod = config?.cursoModulo || (config?.curso?.includes("2") ? 2 : 1);
      const h1 = config?.horasPrimerCurso || config?.cyclePlanData?.horasPrimerCurso || 995;
      const h2 = config?.horasSegundoCurso || config?.cyclePlanData?.horasSegundoCurso || 1005;
      const pct1 = config?.porcentajeDualPrimerCurso ?? 12.1;
      const pct2 = config?.porcentajeDualSegundoCurso ?? 25.0;
      const hDual1 = config?.horasFfeoePrimerCurso ?? config?.cyclePlanData?.horasFfeoePrimerCurso ?? Math.round((h1 * pct1) / 100);
      const hDual2 = config?.horasFfeoeSegundoCurso ?? config?.cyclePlanData?.horasFfeoeSegundoCurso ?? Math.round((h2 * pct2) / 100);
      const fecha1 = config?.fechaInicioDualPrimerCurso || config?.cyclePlanData?.fechaInicioDualPrimerCurso || "17 de marzo";
      const fecha2 = config?.fechaInicioDualSegundoCurso || config?.cyclePlanData?.fechaInicioDualSegundoCurso || "24 de marzo";
      const semDual1 = config?.horasSemanalesDualPrimerCurso || config?.cyclePlanData?.horasSemanalesDualPrimerCurso || 30;
      const semDual2 = config?.horasSemanalesDualSegundoCurso || config?.cyclePlanData?.horasSemanalesDualSegundoCurso || 30;

      setNumParciales(activeNumParciales);
      setCursoModulo(curMod);
      setEtapaCiclo(config?.etapaCiclo || "superior");
      setRegimenDual(config?.regimenDual || "general");
      setPorcentajeDualPrimerCurso(pct1);
      setPorcentajeDualSegundoCurso(pct2);
      setHorasPrimerCurso(h1);
      setHorasSegundoCurso(h2);
      setHorasFfeoePrimerCurso(hDual1);
      setHorasFfeoeSegundoCurso(hDual2);
      setFechaInicioDualPrimerCurso(fecha1);
      setFechaInicioDualSegundoCurso(fecha2);
      setHorasSemanalesDualPrimerCurso(semDual1);
      setHorasSemanalesDualSegundoCurso(semDual2);
      setHorasModulo(horasTotales);
      setSemanasCurso(activeSemanas);
      setHorasPorSesion(activeHorasPorSesion);
      setDuracionSesionMinutos(config?.duracionSesionMinutos || 60);

      const initPctModulo = config?.porcentajeDual !== undefined ? config.porcentajeDual : (curMod === 1 ? pct1 : pct2);
      const initHoursModulo = config?.horasFfeoeModulo !== undefined ? config.horasFfeoeModulo : Math.round((horasTotales * initPctModulo) / 100);
      setPorcentajeDualModulo(initPctModulo);
      setTargetFfeoeModulo(initHoursModulo);

      const defaultHoursPerUd = Math.round(horasTotales / (initialUds.length || 8));
      const defaultWeight = parseFloat((100 / (initialUds.length || 8)).toFixed(2));
      const hasDiverseTrimesters = initialUds.some((u) => u.trimestre && u.trimestre > 1);
      const perParcial = Math.ceil((initialUds.length || 8) / activeNumParciales);
      setUds(
        initialUds.map((u, idx) => {
          const defaultTrimestre = (hasDiverseTrimesters && u.trimestre)
            ? Math.min(activeNumParciales, u.trimestre)
            : Math.min(activeNumParciales, Math.floor(idx / perParcial) + 1);
          const h = u.horasEstimadas || defaultHoursPerUd;
          return {
            ...u,
            horasEstimadas: h,
            horasFfce: u.horasFfce ?? h,
            horasFfeoe: u.horasFfeoe ?? 0,
            pesoPorcentaje: u.pesoPorcentaje ?? defaultWeight,
            sesionesEstimadas: u.sesionesEstimadas || Math.max(1, Math.round(h / activeHorasPorSesion)),
            trimestre: defaultTrimestre,
            fasePedagogicaId: u.fasePedagogicaId || (idx < 4 ? "fase_1" : idx < 7 ? "fase_2" : idx < 9 ? "fase_3" : "fase_4"),
            fasePedagogicaNombre: u.fasePedagogicaNombre || (idx < 4 ? "Fase I: Planificación y Fundamentos" : idx < 7 ? "Fase II: Desarrollo Técnico" : idx < 9 ? "Fase III: Aplicación y Práctica" : "Fase IV: Integración y Explotación"),
          };
        })
      );
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialUds, horasTotales, config]);

  if (!isOpen) return null;

  const totalAssignedFfce = uds.reduce((acc, u) => acc + (u.horasFfce ?? u.horasEstimadas ?? 0), 0);
  const totalAssignedFfeoe = uds.reduce((acc, u) => acc + (u.horasFfeoe ?? 0), 0);
  const totalAssignedHours = totalAssignedFfce + totalAssignedFfeoe;
  const totalAssignedSessions = uds.reduce((acc, u) => acc + (u.sesionesEstimadas || 0), 0);
  const totalPesoCalculated = uds.filter((u) => !u.isPeriodoRecuperacion).reduce((acc, u) => acc + (u.pesoPorcentaje ?? 0), 0);

  // Dual percentage calculation based on stage, regime, and course
  const getDefaultDualPct = (etapa: string, regimen: string, curso: 1 | 2) => {
    if (etapa === "basico") return curso === 1 ? 10 : 20;
    if (etapa === "especializacion") return 10;
    if (regimen === "intensivo") return curso === 1 ? 25 : 45;
    return curso === 1 ? 12.1 : 25.0; // General: 10-20% in 1º, 20-35% in 2º
  };

  // Handle stage change with automatic dual percentage recommendation
  const handleEtapaChange = (newEtapa: "basico" | "medio" | "superior" | "especializacion") => {
    setEtapaCiclo(newEtapa);
    setPorcentajeDualPrimerCurso(getDefaultDualPct(newEtapa, regimenDual, 1));
    setPorcentajeDualSegundoCurso(getDefaultDualPct(newEtapa, regimenDual, 2));
  };

  const handleRegimenChange = (newRegimen: "general" | "intensivo") => {
    setRegimenDual(newRegimen);
    setPorcentajeDualPrimerCurso(getDefaultDualPct(etapaCiclo, newRegimen, 1));
    setPorcentajeDualSegundoCurso(getDefaultDualPct(etapaCiclo, newRegimen, 2));
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      title: newTitle,
      fullCode: `UD${String(index + 1).padStart(2, "0")}. ${updated[index].bcCode || "BC" + (index + 1)}. ${newTitle}`,
    };
    setUds(updated);
  };

  const handleBcCodeChange = (index: number, newBc: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      bcCode: newBc,
      bcText: newBc.replace(/[^0-9,]/g, "") || newBc,
      fullCode: `UD${String(index + 1).padStart(2, "0")}. ${newBc}. ${updated[index].title}`,
    };
    setUds(updated);
  };

  const handleRaCeChange = (index: number, newRaCe: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      raCeText: newRaCe,
    };
    setUds(updated);
  };

  const handleCppsChange = (index: number, newCpps: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      cppsText: newCpps,
    };
    setUds(updated);
  };

  const handleOgChange = (index: number, newOg: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      ogText: newOg,
    };
    setUds(updated);
  };

  const handleFfceChange = (index: number, hoursFce: number) => {
    const val = Math.max(0, hoursFce || 0);
    const updated = [...uds];
    const ffeoe = updated[index].horasFfeoe || 0;
    const totalH = val + ffeoe;
    updated[index] = {
      ...updated[index],
      horasFfce: val,
      horasEstimadas: totalH,
      sesionesEstimadas: Math.max(1, Math.round(totalH / (horasPorSesion || 1))),
    };
    setUds(updated);
  };

  const handleFfeoeChange = (index: number, hoursFfeoe: number) => {
    const val = Math.max(0, hoursFfeoe || 0);
    const updated = [...uds];
    const ffce = updated[index].horasFfce ?? updated[index].horasEstimadas ?? 0;
    const totalH = ffce + val;
    updated[index] = {
      ...updated[index],
      horasFfeoe: val,
      horasEstimadas: totalH,
      sesionesEstimadas: Math.max(1, Math.round(totalH / (horasPorSesion || 1))),
    };
    setUds(updated);
  };

  const handlePesoChange = (index: number, peso: number) => {
    const val = Math.max(0, peso || 0);
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      pesoPorcentaje: val,
    };
    setUds(updated);
  };

  const handleFaseChange = (index: number, faseId: string) => {
    const faseNames: Record<string, string> = {
      fase_1: "Fase I: Planificación y Fundamentos (UD 1-4)",
      fase_2: "Fase II: Desarrollo Técnico y Ejecución (UD 5-7)",
      fase_3: "Fase III: Aplicación y Práctica Avanzada (UD 8-9)",
      fase_4: "Fase IV: Integración, Explotación y Cierre (UD 10-12)",
      fase_r: "Fase R: Recuperación y Refuerzo Extraordinario (Junio)",
    };
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      fasePedagogicaId: faseId,
      fasePedagogicaNombre: faseNames[faseId] || "Fase Pedagógica",
    };
    setUds(updated);
  };

  const handleHoursChange = (index: number, hours: number) => {
    const val = Math.max(1, hours || 1);
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      horasEstimadas: val,
      horasFfce: val,
      horasFfeoe: 0,
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
      horasFfce: Math.max(1, Math.round(val * (horasPorSesion || 1))),
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
    const defaultWeight = parseFloat((100 / uds.length).toFixed(2));
    const updated = uds.map((u) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      const h = baseHours + extra;
      return {
        ...u,
        horasEstimadas: h,
        horasFfce: h,
        horasFfeoe: 0,
        pesoPorcentaje: defaultWeight,
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
      fullCode: `UD${String(idx + 1).padStart(2, "0")}. ${item.bcCode || "BC" + (idx + 1)}. ${item.title}`,
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
    const defaultWeight = parseFloat((100 / nextNum).toFixed(2));
    const newUd: SigreUDItem = {
      id: `UD${String(nextNum).padStart(2, "0")}`,
      number: nextNum,
      bcCode: `BC${nextNum}`,
      bcText: `${nextNum}`,
      title: "Nueva Unidad Didáctica",
      fullCode: `UD${String(nextNum).padStart(2, "0")}. BC${nextNum}. Nueva Unidad Didáctica`,
      horasEstimadas: defaultHours,
      horasFfce: defaultHours,
      horasFfeoe: 0,
      pesoPorcentaje: defaultWeight,
      raCeText: `RA ${nextNum}: a, b, c`,
      cppsText: nextNum % 2 === 0 ? "r" : "c",
      ogText: nextNum % 2 === 0 ? "s" : "c",
      sesionesEstimadas: Math.max(1, Math.round(defaultHours / (horasPorSesion || 1))),
      trimestre: assignedTrimestre,
      fasePedagogicaId: nextNum <= 4 ? "fase_1" : nextNum <= 7 ? "fase_2" : nextNum <= 9 ? "fase_3" : "fase_4",
      fasePedagogicaNombre: nextNum <= 4 ? "Fase I: Planificación y Fundamentos" : nextNum <= 7 ? "Fase II: Desarrollo Técnico" : nextNum <= 9 ? "Fase III: Aplicación y Práctica" : "Fase IV: Integración y Explotación",
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
      fullCode: `UD${String(idx + 1).padStart(2, "0")}. ${item.bcCode || "BC" + (idx + 1)}. ${item.title}`,
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

  // Handle auto-distribution of FFEOE (Empresa) target hours & RAs across UDs with regulatory compliance (10%-20% RA)
  const handleAutoDistributeFfeoe = () => {
    if (uds.length === 0) return;
    const targetFfeoe = targetFfeoeModulo;
    const updated = autoDistributeDualHoursAndRAs(
      uds,
      targetFfeoe,
      horasModulo,
      15 // Target 15% of RAs in dual within [10%-20%]
    );
    setUds(updated);
  };

  // Toggle isRaFfeoe for an individual UD
  const handleToggleUdRaFfeoe = (udId: string) => {
    setUds((prev) =>
      prev.map((u) => {
        if (u.id === udId) {
          return {
            ...u,
            isRaFfeoe: !u.isRaFfeoe,
          };
        }
        return u;
      })
    );
  };

  const handleSave = () => {
    const activeHorasDualCurso = cursoModulo === 1 ? horasFfeoePrimerCurso : horasFfeoeSegundoCurso;
    const activeSemanasFfeoe = Math.max(1, Math.round(activeHorasDualCurso / (activeHorasSemanalesDual || 30)));

    const updatedCyclePlan = config?.cyclePlanData
      ? {
          ...config.cyclePlanData,
          horasPrimerCurso,
          horasSegundoCurso,
          porcentajeFfeoeCurso: cursoModulo === 1 ? porcentajeDualPrimerCurso : porcentajeDualSegundoCurso,
          totalHorasFfeoeCurso: activeHorasDualCurso,
          horasFfeoePrimerCurso,
          horasFfeoeSegundoCurso,
          fechaInicioDualPrimerCurso,
          fechaInicioDualSegundoCurso,
          horasSemanalesDualPrimerCurso,
          horasSemanalesDualSegundoCurso,
          semanasFfeoe: activeSemanasFfeoe,
        }
      : undefined;

    const configUpdates: Partial<SigreCurricularConfig> = {
      numParciales,
      curso: cursoModulo === 1 ? "1º" : "2º",
      cursoModulo,
      etapaCiclo,
      regimenDual,
      porcentajeDual: activeDualPct,
      porcentajeDualPrimerCurso,
      porcentajeDualSegundoCurso,
      porcentajeRaFfeoe: dualAudit.pctRaFfeoe,
      porcentajeRaFfeoeModulo: dualAudit.pctRaFfeoe,
      totalRasModulo: dualAudit.totalRasModulo,
      rasFfeoeModulo: dualAudit.rasInFfeoeCount,
      horasPrimerCurso,
      horasSegundoCurso,
      horasFfeoePrimerCurso,
      horasFfeoeSegundoCurso,
      fechaInicioDualPrimerCurso,
      fechaInicioDualSegundoCurso,
      horasSemanalesDualPrimerCurso,
      horasSemanalesDualSegundoCurso,
      fechaInicioDual: activeFechaInicioDual,
      horasSemanalesDual: activeHorasSemanalesDual,
      horasTotales: horasModulo,
      horasFceModulo: totalAssignedFfce,
      horasFfeoeModulo: totalAssignedFfeoe,
      semanasCurso,
      duracionSesionMinutos,
      horasPorSesion,
      distribucionSemanalDias,
      diasSemanaImparticion: distribucionSemanalDias.filter((d) => d.activo && d.horas > 0).map((d) => d.dia),
      totalSesionesPrevistas,
      horasSemanales: calculatedHorasSemanales,
      incluyePeriodoRecuperacionJunio: true,
      incluyePlanificacionSiguienteCursoJunio: true,
      ...(updatedCyclePlan ? { cyclePlanData: updatedCyclePlan } : {}),
    };
    onConfirmPlan(uds, configUpdates);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-surface border border-cyan-500/40 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Unified Planning & UDs Badge */}
        <div className="p-4 sm:p-5 border-b border-border-default bg-alt/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Propuesta Integrada: Planificación Curricular & UDs (Nivel 2)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold">
                  {uds.length} UDs • {totalAssignedHours}h / {horasModulo}h • {totalSesionesPrevistas} Sesiones
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-text-primary mt-0.5 flex items-center gap-2">
                {moduloTitle || "Módulo Profesional"}
              </h3>
              <p className="text-xs text-text-muted">
                Fusión de <strong>Planificación General del Módulo (Tabla 7.1)</strong> y <strong>Estructura de UDs</strong>: Fases Pedagógicas, RAs/CEs, FP Dual (FFCE/FFEOE RD 659/2023) y Calendario Escolar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-alt transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-surface border-b border-border-default flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-alt/60 rounded-xl border border-border-default/60 shadow-inner">
            <button
              type="button"
              onClick={() => setActivePlanTab("matriz_planificacion")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activePlanTab === "matriz_planificacion"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                  : "text-text-muted hover:text-text-primary hover:bg-alt/80 border border-transparent"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>1. Planificación Curricular Integral (Tabla 7.1 + RA/CE + FP Dual)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlanTab("unidades")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activePlanTab === "unidades"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                  : "text-text-muted hover:text-text-primary hover:bg-alt/80 border border-transparent"
              }`}
            >
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <span>2. Secuencia Rápida de UDs ({uds.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
            <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 shadow-2xs ${
              totalAssignedHours === horasModulo
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-amber-500/15 border-amber-500/40 text-amber-400"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {totalAssignedHours}h / {horasModulo}h
            </span>
            <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 shadow-2xs ${
              Math.abs(totalPesoCalculated - 100) < 0.1
                ? "bg-purple-500/15 border-purple-500/40 text-purple-400"
                : "bg-amber-500/15 border-amber-500/40 text-amber-400"
            }`}>
              <Percent className="w-3.5 h-3.5" />
              {totalPesoCalculated.toFixed(1)}% / 100%
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: FULL CURRICULAR PLANNING (TABLA 7.1 + RA/CE + FP DUAL + MARCO LECTIVO) */}
          {activePlanTab === "matriz_planificacion" && (
            <div className="space-y-4">
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
            <div className="p-3.5 bg-background border border-cyan-500/30 rounded-xl space-y-3 shadow-2xs">
              {/* Card Header & Stage / Regime Switchers */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>Formación Profesional Dual (LO 3/2022 · RD 659/2023):</span>
                </div>

                {/* Stage (Etapa) and Regime (Régimen) Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Etapa Educativa */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-[10px]">
                    <span className="font-bold text-text-muted px-1">Etapa:</span>
                    {(
                      [
                        { id: "medio", label: "Grado Medio" },
                        { id: "superior", label: "Grado Superior" },
                        { id: "basico", label: "Grado Básico (CFGB)" },
                        { id: "especializacion", label: "Especialización" },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectEtapa(st.id)}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          etapaCiclo === st.id
                            ? "bg-purple-500 text-white shadow-xs font-black"
                            : "text-text-muted hover:text-text-primary hover:bg-alt"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Régimen Dual */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-[10px]">
                    <span className="font-bold text-text-muted px-1">Régimen:</span>
                    {(
                      [
                        { id: "general", label: "Dual General (10-20% RA · 500-700h)" },
                        { id: "intensivo", label: "Dual Intensivo (>30% RA)" },
                        { id: "no_dual", label: "No Dual (0h)" },
                      ] as const
                    ).map((rg) => (
                      <button
                        key={rg.id}
                        type="button"
                        onClick={() => handleSelectRegimen(rg.id)}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          regimenDual === rg.id
                            ? "bg-cyan-500 text-black shadow-xs font-black"
                            : "text-text-muted hover:text-text-primary hover:bg-alt"
                        }`}
                      >
                        {rg.label}
                      </button>
                    ))}
                  </div>

                  {/* Course Switcher for the module */}
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-[10px]">
                    <span className="font-bold text-text-muted px-1">Curso Módulo:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCursoModulo(1);
                        const targetPct = porcentajeDualPrimerCurso;
                        setPorcentajeDualModulo(targetPct);
                        setTargetFfeoeModulo(Math.round((horasModulo * targetPct) / 100));
                      }}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        cursoModulo === 1
                          ? "bg-cyan-500 text-black shadow-xs font-black"
                          : "text-text-muted hover:text-text-primary hover:bg-alt"
                      }`}
                    >
                      1º Curso
                    </button>
                    {etapaCiclo !== "especializacion" && (
                      <button
                        type="button"
                        onClick={() => {
                          setCursoModulo(2);
                          const targetPct = porcentajeDualSegundoCurso;
                          setPorcentajeDualModulo(targetPct);
                          setTargetFfeoeModulo(Math.round((horasModulo * targetPct) / 100));
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          cursoModulo === 2
                            ? "bg-cyan-500 text-black shadow-xs font-black"
                            : "text-text-muted hover:text-text-primary hover:bg-alt"
                        }`}
                      >
                        2º Curso
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE REGULATORY COMPLIANCE BANNER & AUDIT */}
              <div
                className={`p-3 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs transition-all ${
                  dualAudit.summaryBadgeColor === "emerald"
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    : dualAudit.summaryBadgeColor === "amber"
                    ? "bg-amber-950/30 border-amber-500/40 text-amber-200"
                    : dualAudit.summaryBadgeColor === "cyan" || dualAudit.summaryBadgeColor === "blue"
                    ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
                    : "bg-red-950/30 border-red-500/40 text-red-200"
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border flex items-center gap-1 ${
                        dualAudit.summaryBadgeColor === "emerald"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : dualAudit.summaryBadgeColor === "amber"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : dualAudit.summaryBadgeColor === "cyan" || dualAudit.summaryBadgeColor === "blue"
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/40"
                      }`}
                    >
                      {dualAudit.isFullyCompliant ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {dualAudit.summaryBadgeText}
                    </span>
                    <span className="font-bold text-[11px] opacity-90">
                      {dualRegulationParams.legalReference}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-0.5">
                    {/* Horas Empresa vs Legal Range */}
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-0.5">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10px] opacity-80">Horas FFEOE Ciclo:</span>
                        <span className="font-bold">
                          {totalHorasFfeoeCiclo}h de {totalHorasCiclo}h ({porcentajeDualCicloGlobal}%)
                        </span>
                      </div>
                      <div className="text-[10px] opacity-75 font-mono">
                        Rango legal: [{dualRegulationParams.minHoursFfeoe}h - {dualRegulationParams.maxHoursFfeoe}h] ({dualRegulationParams.minPctFfeoe}% - {dualRegulationParams.maxPctFfeoe}%)
                      </div>
                    </div>

                    {/* RAs en FFEOE vs Legal Range (10%-20%) */}
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5 space-y-0.5">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10px] opacity-80">RAs en Dual (FFEOE):</span>
                        <span className="font-bold">
                          {dualAudit.rasInFfeoeCount} de {dualAudit.totalRasModulo} RAs ({dualAudit.pctRaFfeoe.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="text-[10px] opacity-75 font-mono">
                        Rango curricular legal: [{dualRegulationParams.minPctRaFfeoe}% - {dualRegulationParams.maxPctRaFfeoe}% de los RAs]
                      </div>
                    </div>
                  </div>

                  {dualAudit.recommendations.length > 0 && (
                    <div className="text-[10px] pt-1 space-y-0.5 opacity-90">
                      {dualAudit.recommendations.map((rec, i) => (
                        <p key={i} className="flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          {rec}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Auto-Distribute Action Button */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={handleAutoDistributeFfeoe}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Auto-distribuir horas y marcar el rango legal del 10%-20% de RAs en UDs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-repartir Horas y RAs</span>
                  </button>
                  <span className="text-[9px] opacity-70 font-mono">
                    Ajusta horas + 10%-20% RAs
                  </span>
                </div>
              </div>

              {/* Course-Differentiated FFEOE Hours, Percentages, Start Dates & Weekly Hours Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* 1º CURSO Dual Config Card */}
                <div
                  className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                    cursoModulo === 1
                      ? "bg-cyan-500/10 border-cyan-500/50 shadow-xs"
                      : "bg-surface/60 border-border-default"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        cursoModulo === 1 ? "bg-cyan-500 text-black" : "bg-alt text-text-muted"
                      }`}>
                        1º CURSO
                      </span>
                      <span className="text-[11px] font-bold text-text-primary">Fase Inicial Alternancia</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {cursoModulo === 1 && (
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">
                          ★ Módulo Actual
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-text-muted">
                        Total 1º Curso: {horasPrimerCurso}h
                      </span>
                    </div>
                  </div>

                  {/* Dual Hours and % inputs */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-0.5">
                          Horas Empresa Ciclo (FFEOE 1º):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={horasPrimerCurso}
                            value={horasFfeoePrimerCurso}
                            onChange={(e) => handleUpdatePrimerCursoFfeoeHours(Number(e.target.value))}
                            className="w-full px-2.5 py-1 bg-background border border-border-default rounded-lg text-xs font-mono font-bold text-text-primary focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1 text-xs text-text-muted font-bold font-mono">h</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-0.5">
                          % Empresa s/ 1º Curso:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="50"
                            value={porcentajeDualPrimerCurso}
                            onChange={(e) => handleUpdatePrimerCursoPct(Number(e.target.value))}
                            className="w-full px-2.5 py-1 bg-background border border-border-default rounded-lg text-xs font-mono font-bold text-text-primary focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1 text-xs text-text-muted font-bold font-mono">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Repercussion on whole cycle label */}
                    <div className="flex items-center justify-between text-[10px] px-1 text-text-muted">
                      <span>Repercusión s/ Ciclo Total ({totalHorasCiclo}h):</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {((horasFfeoePrimerCurso / (totalHorasCiclo || 2000)) * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Quick percentage shortcuts */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[10px] text-text-muted">Preajustes 1º:</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {(etapaCiclo === "especializacion"
                          ? [
                              { label: "15% (90h)", pct: 15, h: 90 },
                              { label: "20% (120h)", pct: 20, h: 120 },
                              { label: "25% (150h)", pct: 25, h: 150 },
                            ]
                          : etapaCiclo === "basico"
                          ? [
                              { label: "0h (100% 2º)", pct: 0, h: 0 },
                              { label: "10% (100h)", pct: 10, h: 100 },
                              { label: "15% (150h)", pct: 15, h: 150 },
                            ]
                          : [
                              { label: "10% (100h)", pct: 10, h: 100 },
                              { label: "12.1% (120h)", pct: 12.1, h: 120 },
                              { label: "15% (149h)", pct: 15, h: 149 },
                              { label: "20% (199h)", pct: 20, h: 199 },
                            ]
                        ).map((preset) => (
                          <button
                            key={preset.pct}
                            type="button"
                            onClick={() => {
                              setHorasFfeoePrimerCurso(preset.h);
                              setPorcentajeDualPrimerCurso(preset.pct);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                              horasFfeoePrimerCurso === preset.h || porcentajeDualPrimerCurso === preset.pct
                                ? "bg-cyan-500 text-black"
                                : "bg-alt hover:bg-hover text-text-muted border border-border-subtle"
                            }`}
                          >
                            {preset.pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Start Date & Weekly Hours Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-subtle/60">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold flex items-center gap-1 mb-0.5">
                        <CalendarRange className="w-3 h-3 text-cyan-400" />
                        Fecha Inicio Dual:
                      </label>
                      <input
                        type="text"
                        value={fechaInicioDualPrimerCurso}
                        onChange={(e) => setFechaInicioDualPrimerCurso(e.target.value)}
                        placeholder="ej. 17 de marzo"
                        className="w-full px-2 py-1 bg-background border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:border-cyan-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-1 mt-1">
                        {["17 de marzo", "24 de marzo", "1 de abril"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFechaInicioDualPrimerCurso(f)}
                            className="text-[9px] px-1 py-0.5 rounded bg-alt text-text-muted hover:text-text-primary hover:bg-hover border border-border-subtle cursor-pointer"
                          >
                            {f.split(" ")[0]} {f.split(" ")[2]?.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-text-muted font-bold flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        Horas Semanales:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={horasSemanalesDualPrimerCurso}
                          onChange={(e) => setHorasSemanalesDualPrimerCurso(Math.max(1, Number(e.target.value) || 30))}
                          className="w-full px-2 py-1 bg-background border border-border-default rounded-lg text-xs font-mono font-bold text-text-primary focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1 text-[10px] text-text-muted font-bold font-mono">h/sem</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[25, 30, 35, 40].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHorasSemanalesDualPrimerCurso(h)}
                            className={`text-[9px] px-1 py-0.5 rounded border border-border-subtle cursor-pointer ${
                              horasSemanalesDualPrimerCurso === h
                                ? "bg-cyan-500 text-black font-bold"
                                : "bg-alt text-text-muted hover:bg-hover"
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Stay Footer */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-text-muted font-mono bg-alt/30 px-2 py-1 rounded-md border border-border-subtle">
                    <span>Estancia 1º en Empresa:</span>
                    <span className="font-bold text-cyan-400">
                      ~{(horasFfeoePrimerCurso / (horasSemanalesDualPrimerCurso || 30)).toFixed(1)} sem. ({Math.round(horasFfeoePrimerCurso / (horasSemanalesDualPrimerCurso || 30))} semanas)
                    </span>
                  </div>
                </div>

                {/* 2º CURSO Dual Config Card */}
                <div
                  className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                    cursoModulo === 2
                      ? "bg-cyan-500/10 border-cyan-500/50 shadow-xs"
                      : "bg-surface/60 border-border-default"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        cursoModulo === 2 ? "bg-cyan-500 text-black" : "bg-alt text-text-muted"
                      }`}>
                        2º CURSO
                      </span>
                      <span className="text-[11px] font-bold text-text-primary">Fase Avanzada Alternancia</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {cursoModulo === 2 && (
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">
                          ★ Módulo Actual
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-text-muted">
                        Total 2º Curso: {horasSegundoCurso}h
                      </span>
                    </div>
                  </div>

                  {/* Dual Hours and % inputs */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-0.5">
                          Horas Empresa Ciclo (FFEOE 2º):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={horasSegundoCurso}
                            value={horasFfeoeSegundoCurso}
                            onChange={(e) => handleUpdateSegundoCursoFfeoeHours(Number(e.target.value))}
                            className="w-full px-2.5 py-1 bg-background border border-border-default rounded-lg text-xs font-mono font-bold text-text-primary focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1 text-xs text-text-muted font-bold font-mono">h</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-0.5">
                          % Empresa s/ 2º Curso:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="60"
                            value={porcentajeDualSegundoCurso}
                            onChange={(e) => handleUpdateSegundoCursoPct(Number(e.target.value))}
                            className="w-full px-2.5 py-1 bg-background border border-border-default rounded-lg text-xs font-mono font-bold text-text-primary focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2 top-1 text-xs text-text-muted font-bold font-mono">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Repercussion on whole cycle label */}
                    <div className="flex items-center justify-between text-[10px] px-1 text-text-muted">
                      <span>Repercusión s/ Ciclo Total ({totalHorasCiclo}h):</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {((horasFfeoeSegundoCurso / (totalHorasCiclo || 2000)) * 100).toFixed(1)}%
                      </span>
                    </div>

                    {/* Quick percentage shortcuts */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="text-[10px] text-text-muted">Preajustes 2º:</span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {(etapaCiclo === "basico"
                          ? [
                              { label: "35% (350h)", pct: 35, h: 350 },
                              { label: "40% (400h)", pct: 40, h: 400 },
                              { label: "44% (440h)", pct: 44, h: 440 },
                            ]
                          : [
                              { label: "20% (201h)", pct: 20, h: 201 },
                              { label: "25% (251h)", pct: 25, h: 251 },
                              { label: "35% (352h)", pct: 35, h: 352 },
                              { label: "40.8% (410h)", pct: 40.8, h: 410 },
                            ]
                        ).map((preset) => (
                          <button
                            key={preset.h}
                            type="button"
                            onClick={() => {
                              setHorasFfeoeSegundoCurso(preset.h);
                              setPorcentajeDualSegundoCurso(preset.pct);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                              horasFfeoeSegundoCurso === preset.h || porcentajeDualSegundoCurso === preset.pct
                                ? "bg-cyan-500 text-black"
                                : "bg-alt hover:bg-hover text-text-muted border border-border-subtle"
                            }`}
                          >
                            {preset.h === 410 ? "410h (40.8%)" : `${preset.pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Start Date & Weekly Hours Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-subtle/60">
                    <div>
                      <label className="text-[10px] text-text-muted font-bold flex items-center gap-1 mb-0.5">
                        <CalendarRange className="w-3 h-3 text-cyan-400" />
                        Fecha Inicio Dual:
                      </label>
                      <input
                        type="text"
                        value={fechaInicioDualSegundoCurso}
                        onChange={(e) => setFechaInicioDualSegundoCurso(e.target.value)}
                        placeholder="ej. 24 de marzo"
                        className="w-full px-2 py-1 bg-background border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:border-cyan-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-1 mt-1">
                        {["17 de marzo", "24 de marzo", "1 de abril"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFechaInicioDualSegundoCurso(f)}
                            className="text-[9px] px-1 py-0.5 rounded bg-alt text-text-muted hover:text-text-primary hover:bg-hover border border-border-subtle cursor-pointer"
                          >
                            {f.split(" ")[0]} {f.split(" ")[2]?.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-text-muted font-bold flex items-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        Horas Semanales:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="40"
                          value={horasSemanalesDualSegundoCurso}
                          onChange={(e) => setHorasSemanalesDualSegundoCurso(Math.max(1, Number(e.target.value) || 30))}
                          className="w-full px-2 py-1 bg-background border border-border-default rounded-lg text-xs font-mono font-bold text-text-primary focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1 text-[10px] text-text-muted font-bold font-mono">h/sem</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[25, 30, 35, 40].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHorasSemanalesDualSegundoCurso(h)}
                            className={`text-[9px] px-1 py-0.5 rounded border border-border-subtle cursor-pointer ${
                              horasSemanalesDualSegundoCurso === h
                                ? "bg-cyan-500 text-black font-bold"
                                : "bg-alt text-text-muted hover:bg-hover"
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Stay Footer */}
                  <div className="pt-1 flex items-center justify-between text-[10px] text-text-muted font-mono bg-alt/30 px-2 py-1 rounded-md border border-border-subtle">
                    <span>Estancia 2º en Empresa:</span>
                    <span className="font-bold text-cyan-400">
                      ~{(horasFfeoeSegundoCurso / (horasSemanalesDualSegundoCurso || 30)).toFixed(1)} sem. ({Math.round(horasFfeoeSegundoCurso / (horasSemanalesDualSegundoCurso || 30))} semanas)
                    </span>
                  </div>
                </div>
              </div>

              {/* Module Dual Repercussion & Distribution Card */}
              <div className="p-3.5 bg-surface/90 border border-cyan-500/40 rounded-xl space-y-3 text-xs shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/80 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-text-primary text-sm flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-cyan-400" />
                      Repercusión en este Módulo Formativo ({cursoModulo}º Curso · {horasModulo}h totales):
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">
                      {porcentajeDualModulo.toFixed(1)}% FFEOE = {targetFfeoeModulo}h en Empresa
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDistributeFfeoe}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Repartir automáticamente las horas de empresa y el 10%-20% de RAs en las UDs prácticas"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-repartir {targetFfeoeModulo}h FFEOE + RAs en UDs</span>
                  </button>
                </div>

                {/* Module-Specific Controls & Repercussion Presets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-background/60 p-2.5 rounded-xl border border-border-subtle">
                  {/* Direct Inputs for Module Repercussion */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-text-primary block">
                      Ajuste Directo de Horas / Porcentaje para este Módulo:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-0.5">
                          Horas Empresa en Módulo (FFEOE):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={horasModulo}
                            value={targetFfeoeModulo}
                            onChange={(e) => handleUpdateModuloFfeoeHours(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-border-default rounded-lg text-xs font-mono font-black text-cyan-300 focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-1.5 text-xs text-text-muted font-bold font-mono">h</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-0.5">
                          % Empresa en este Módulo:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={porcentajeDualModulo}
                            onChange={(e) => handleUpdateModuloDualPct(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-border-default rounded-lg text-xs font-mono font-black text-cyan-300 focus:border-cyan-500 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-1.5 text-xs text-text-muted font-bold font-mono">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repercussion Shortcuts / Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-text-muted block">
                      Repercusión Proporcional Rápida en Módulo:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateModuloDualPct(porcentajeDualCicloGlobal)}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-all border ${
                          Math.abs(porcentajeDualModulo - porcentajeDualCicloGlobal) < 0.2
                            ? "bg-cyan-500 text-black border-cyan-400 font-black"
                            : "bg-alt hover:bg-hover text-text-muted border-border-subtle"
                        }`}
                        title="Aplica la media ponderada del ciclo completo"
                      >
                        % Ciclo ({porcentajeDualCicloGlobal}% · {Math.round((horasModulo * porcentajeDualCicloGlobal) / 100)}h)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateModuloDualPct(activeDualPct)}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-all border ${
                          Math.abs(porcentajeDualModulo - activeDualPct) < 0.2
                            ? "bg-cyan-500 text-black border-cyan-400 font-black"
                            : "bg-alt hover:bg-hover text-text-muted border-border-subtle"
                        }`}
                        title="Aplica el porcentaje establecido para este curso"
                      >
                        % Curso ({activeDualPct}% · {Math.round((horasModulo * activeDualPct) / 100)}h)
                      </button>

                      {[
                        { label: "10%", pct: 10 },
                        { label: "15%", pct: 15 },
                        { label: "20%", pct: 20 },
                        { label: "25%", pct: 25 },
                        { label: "0h (Centro)", pct: 0 },
                      ].map((p) => (
                        <button
                          key={p.pct}
                          type="button"
                          onClick={() => handleUpdateModuloDualPct(p.pct)}
                          className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-all border ${
                            Math.abs(porcentajeDualModulo - p.pct) < 0.1
                              ? "bg-cyan-500 text-black border-cyan-400 font-black"
                              : "bg-alt hover:bg-hover text-text-muted border-border-subtle"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status and target compliance cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <School className="w-3.5 h-3.5" /> FCE (Centro):
                    </span>
                    <span className="font-mono font-black text-emerald-300 text-sm mt-0.5">
                      {totalAssignedFfce}h / {targetFceModulo}h target
                    </span>
                    <span className="text-[9px] text-emerald-400/80 font-mono">
                      {((targetFceModulo / (horasModulo || 1)) * 100).toFixed(1)}% del módulo
                    </span>
                  </div>

                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> FFEOE (Empresa):
                    </span>
                    <span className="font-mono font-black text-cyan-300 text-sm mt-0.5">
                      {totalAssignedFfeoe}h / {targetFfeoeModulo}h target
                    </span>
                    <span className="text-[9px] text-cyan-400/80 font-mono">
                      {porcentajeDualModulo.toFixed(1)}% del módulo
                    </span>
                  </div>

                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg flex flex-col justify-between col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Total FP Dual Ciclo ({totalHorasCiclo}h):
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {regimenDual === "general"
                          ? "Régimen General (25-35% · 500-700h)"
                          : regimenDual === "intensivo"
                          ? "Régimen Intensivo (>35-50% · >700h)"
                          : "No Dual (100% Centro)"}
                      </span>
                    </div>
                    <span className="font-mono font-black text-purple-200 text-sm mt-0.5">
                      {totalHorasFfeoeCiclo}h totales ({porcentajeDualCicloGlobal}%) = {horasFfeoePrimerCurso}h (1º) + {horasFfeoeSegundoCurso}h (2º)
                    </span>
                    <span className="text-[9px] text-purple-300/80 font-mono">
                      LO 3/2022 · RD 659/2023 · RAs en Dual: {dualAudit.rasInFfeoeCount}/{dualAudit.totalRasModulo} ({dualAudit.pctRaFfeoe.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Temporal & Session Planning (32 Weeks Standard) */}
          <div className="p-3.5 bg-background border border-border-default rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Marco Temporal del Curso ({semanasCurso} Semanas Lectivas Ordinarias):</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTemporalConfigOpen(!isTemporalConfigOpen)}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-0.5"
              >
                {isTemporalConfigOpen ? "Ocultar Parámetros" : "Ajustar Sesiones/Semanas"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTemporalConfigOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Metrics row */}
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
                <span className="font-mono font-black text-purple-400 text-sm mt-0.5">{totalSesionesPrevistas} sesiones</span>
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
                        setDuracionSesionMinutos(h * 60);
                        setUds((prev) =>
                          prev.map((u) => ({
                            ...u,
                            sesionesEstimadas: Math.max(1, Math.round((u.horasEstimadas || 1) / h)),
                          }))
                        );
                      }}
                      className="w-full px-2 py-1 bg-background border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:border-purple-500 focus:outline-none mb-1.5"
                    >
                      <option value={1}>1 hora estándar (60 min / 1 sesión = 1h)</option>
                      <option value={2}>Bloque de taller doble (2 horas / 120 min = 1 sesión)</option>
                      <option value={3}>Bloque de taller-lab triple (3 horas / 180 min = 1 sesión)</option>
                      <option value={4}>Bloque intensivo / proyecto (4 horas / 240 min = 1 sesión)</option>
                    </select>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((hVal) => (
                        <button
                          key={hVal}
                          type="button"
                          onClick={() => {
                            setHorasPorSesion(hVal);
                            setDuracionSesionMinutos(hVal * 60);
                            setUds((prev) =>
                              prev.map((u) => ({
                                ...u,
                                sesionesEstimadas: Math.max(1, Math.round((u.horasEstimadas || 1) / hVal)),
                              }))
                            );
                          }}
                          className={`flex-1 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer text-center ${
                            horasPorSesion === hVal
                              ? "bg-purple-500 text-white shadow-xs font-black"
                              : "bg-surface text-purple-300 hover:bg-purple-500/20 border border-purple-500/30"
                          }`}
                        >
                          {hVal}h
                        </button>
                      ))}
                    </div>
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

                {/* 5-Day Week Distribution (Lunes a Viernes) in Sesiones de 1, 2, 3 y 4h */}
                <div className="pt-2 border-t border-border-default/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      Distribución Semanal en 5 Días (Lunes a Viernes):
                    </span>
                    <span className="text-[10px] text-purple-300 font-bold">
                      Sesiones de 1h, 2h, 3h o 4h
                    </span>
                  </div>

                  {(() => {
                    const diasBase: { dia: "L" | "M" | "X" | "J" | "V"; nombre: string }[] = [
                      { dia: "L", nombre: "Lunes" },
                      { dia: "M", nombre: "Martes" },
                      { dia: "X", nombre: "Miércoles" },
                      { dia: "J", nombre: "Jueves" },
                      { dia: "V", nombre: "Viernes" },
                    ];

                    const updateDay = (dia: "L" | "M" | "X" | "J" | "V", horas: number, activo: boolean) => {
                      const newDistrib = diasBase.map((d) => {
                        const exist = distribucionSemanalDias.find((item) => item.dia === d.dia);
                        if (d.dia === dia) {
                          return { dia: d.dia, nombre: d.nombre, horas, activo };
                        }
                        return exist || { dia: d.dia, nombre: d.nombre, horas: 1, activo: true };
                      });
                      setDistribucionSemanalDias(newDistrib);
                    };

                    const applyPreset = (presetType: "5x1" | "5x2" | "3x2" | "2x3" | "2x2_1x1" | "1x4" | "2x4") => {
                      let newDistrib: { dia: "L" | "M" | "X" | "J" | "V"; nombre: string; horas: number; activo: boolean }[] = [];
                      let dominantH = 1;

                      switch (presetType) {
                        case "5x1":
                          dominantH = 1;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 1, activo: true },
                            { dia: "M", nombre: "Martes", horas: 1, activo: true },
                            { dia: "X", nombre: "Miércoles", horas: 1, activo: true },
                            { dia: "J", nombre: "Jueves", horas: 1, activo: true },
                            { dia: "V", nombre: "Viernes", horas: 1, activo: true },
                          ];
                          break;
                        case "5x2":
                          dominantH = 2;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 2, activo: true },
                            { dia: "M", nombre: "Martes", horas: 2, activo: true },
                            { dia: "X", nombre: "Miércoles", horas: 2, activo: true },
                            { dia: "J", nombre: "Jueves", horas: 2, activo: true },
                            { dia: "V", nombre: "Viernes", horas: 2, activo: true },
                          ];
                          break;
                        case "3x2":
                          dominantH = 2;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 2, activo: true },
                            { dia: "M", nombre: "Martes", horas: 0, activo: false },
                            { dia: "X", nombre: "Miércoles", horas: 2, activo: true },
                            { dia: "J", nombre: "Jueves", horas: 0, activo: false },
                            { dia: "V", nombre: "Viernes", horas: 2, activo: true },
                          ];
                          break;
                        case "2x3":
                          dominantH = 3;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 3, activo: true },
                            { dia: "M", nombre: "Martes", horas: 0, activo: false },
                            { dia: "X", nombre: "Miércoles", horas: 3, activo: true },
                            { dia: "J", nombre: "Jueves", horas: 0, activo: false },
                            { dia: "V", nombre: "Viernes", horas: 0, activo: false },
                          ];
                          break;
                        case "2x2_1x1":
                          dominantH = 2;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 2, activo: true },
                            { dia: "M", nombre: "Martes", horas: 0, activo: false },
                            { dia: "X", nombre: "Miércoles", horas: 2, activo: true },
                            { dia: "J", nombre: "Jueves", horas: 0, activo: false },
                            { dia: "V", nombre: "Viernes", horas: 1, activo: true },
                          ];
                          break;
                        case "1x4":
                          dominantH = 4;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 0, activo: false },
                            { dia: "M", nombre: "Martes", horas: 0, activo: false },
                            { dia: "X", nombre: "Miércoles", horas: 0, activo: false },
                            { dia: "J", nombre: "Jueves", horas: 0, activo: false },
                            { dia: "V", nombre: "Viernes", horas: 4, activo: true },
                          ];
                          break;
                        case "2x4":
                          dominantH = 4;
                          newDistrib = [
                            { dia: "L", nombre: "Lunes", horas: 0, activo: false },
                            { dia: "M", nombre: "Martes", horas: 4, activo: true },
                            { dia: "X", nombre: "Miércoles", horas: 0, activo: false },
                            { dia: "J", nombre: "Jueves", horas: 4, activo: true },
                            { dia: "V", nombre: "Viernes", horas: 0, activo: false },
                          ];
                          break;
                      }

                      setDistribucionSemanalDias(newDistrib);
                      setHorasPorSesion(dominantH);
                      setDuracionSesionMinutos(dominantH * 60);
                      setUds((prev) =>
                        prev.map((u) => ({
                          ...u,
                          sesionesEstimadas: Math.max(1, Math.round((u.horasEstimadas || 1) / dominantH)),
                        }))
                      );
                    };

                    const totalHorasSemCalculadas = distribucionSemanalDias.reduce((acc, d) => acc + (d.activo ? d.horas : 0), 0);

                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-1.5">
                          {diasBase.map((d) => {
                            const info = distribucionSemanalDias.find((item) => item.dia === d.dia) || {
                              dia: d.dia,
                              nombre: d.nombre,
                              horas: 1,
                              activo: false,
                            };

                            return (
                              <div
                                key={d.dia}
                                className={`p-1.5 rounded-lg border transition-all flex flex-col justify-between ${
                                  info.activo && info.horas > 0
                                    ? "bg-purple-500/15 border-purple-500/40"
                                    : "bg-surface/40 border-border-default/40 opacity-60 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1 select-none text-[11px] font-bold">
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        info.activo && info.horas > 0 ? "bg-purple-500" : "bg-text-muted/30"
                                      }`}
                                    />
                                    <span className="text-text-primary">{d.dia}</span>
                                    <span className="text-[10px] text-text-muted">({d.nombre.slice(0, 3)})</span>
                                  </div>
                                  <span className={`text-[10px] font-mono font-bold px-1 rounded transition-colors ${
                                    info.activo && info.horas > 0 ? "bg-purple-500 text-white" : "text-text-muted"
                                  }`}>
                                    {info.activo && info.horas > 0 ? `${info.horas}h` : "0h"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-4 gap-0.5">
                                  {[1, 2, 3, 4].map((hVal) => {
                                    const isSelected = Boolean(info.activo && info.horas === hVal);
                                    return (
                                      <button
                                        key={hVal}
                                        type="button"
                                        onClick={() => {
                                          if (isSelected) {
                                            updateDay(d.dia, 0, false);
                                          } else {
                                            updateDay(d.dia, hVal, true);
                                          }
                                        }}
                                        title={
                                          isSelected
                                            ? `${d.nombre}: Desactivar sesión de ${hVal}h`
                                            : `${d.nombre}: Activar sesión de ${hVal}h`
                                        }
                                        className={`py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer text-center transition-all ${
                                          isSelected
                                            ? "bg-purple-600 text-white font-black ring-1 ring-purple-400"
                                            : "bg-alt/60 hover:bg-purple-500/20 text-text-muted hover:text-purple-300"
                                        }`}
                                      >
                                        {hVal}h
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Presets and summary */}
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-text-muted">Plantillas:</span>
                            <button
                              type="button"
                              onClick={() => applyPreset("5x1")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              5d×1h (5h)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("5x2")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              5d×2h (10h)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("2x2_1x1")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              2d×2h+1d×1h (5h)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("3x2")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              3d×2h (6h)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("2x3")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              2d×3h (6h)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("1x4")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              1d×4h (4h)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("2x4")}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-alt hover:bg-purple-500/20 text-text-secondary border border-border-default cursor-pointer"
                            >
                              2d×4h (8h)
                            </button>
                          </div>
                          <span className="font-mono font-bold text-purple-300">
                            Total semanal: <strong className="text-white bg-purple-600 px-1 rounded">{totalHorasSemCalculadas}h/sem</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

            {/* TAB 1: FULL MODULE PLANNING TABLE (TABLE 7.1 + RA/CE + FP DUAL) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    Tabla 7.1: Resultados de Aprendizaje, Criterios, Bloques y Pesos Ponderados
                  </h4>
                  <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                    ({uds.length} {uds.length === 1 ? "UD" : "UDs"})
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Evaluaciones / Parciales selector in Table 7.1 Header */}
                  <div className="flex items-center gap-1 bg-surface px-2 py-1 rounded-lg border border-border-default text-xs">
                    <span className="text-[11px] font-bold text-text-muted flex items-center gap-1 mr-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Evaluación:
                    </span>
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setNumParciales(n);
                          setUds((prev) =>
                            prev.map((u) => ({
                              ...u,
                              trimestre: Math.min(n, u.trimestre || 1),
                            }))
                          );
                        }}
                        className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-all cursor-pointer ${
                          numParciales === n
                            ? "bg-amber-500 text-black shadow-xs"
                            : "text-text-muted hover:text-text-primary hover:bg-alt"
                        }`}
                        title={`Configurar ${n} ${n === 3 ? "trimestres" : n === 2 ? "semestres" : n === 1 ? "evaluación anual" : "parciales"}`}
                      >
                        {n} {n === 3 ? "Trim." : n === 2 ? "Sem." : n === 1 ? "Anual" : "P"}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDistributeTrimesters}
                    className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    title={`Repartir automáticamente las ${uds.length} UDs entre los ${numParciales} trimestres`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-repartir
                  </button>

                  <button
                    type="button"
                    onClick={handleAddUd}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                    title="Añadir nueva fila de Unidad Didáctica"
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir Fila UD
                  </button>
                  {uds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      title="Eliminar todas las UDs de la planificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Vaciar Todas las UDs
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Full Planning Table */}
              <div className="border border-border-default rounded-xl overflow-x-auto bg-surface shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-alt/80 border-b border-border-default text-[11px] text-text-muted">
                      <th className="py-2 px-2 text-center font-bold w-16">UD / Eliminar</th>
                      <th className="py-2 px-2.5 font-bold min-w-[200px]">Título de la Unidad Didáctica</th>
                      <th className="py-2 px-2 font-bold min-w-[140px]">RA / Criterios de Evaluación</th>
                      <th className="py-2 px-1 text-center font-bold w-16 text-cyan-400" title="Indica si esta UD aporta Resultados de Aprendizaje evaluados/impartidos en empresa (FFEOE)">RA Dual</th>
                      <th className="py-2 px-1.5 text-center font-bold w-14">BC</th>
                      <th className="py-2 px-1.5 text-center font-bold w-14">CPPS</th>
                      <th className="py-2 px-1.5 text-center font-bold w-14">OG</th>
                      <th className="py-2 px-1.5 text-center font-bold w-16">Fase Pedagógica</th>
                      <th className="py-2 px-1.5 text-center font-bold w-16">Parcial</th>
                      <th className="py-2 px-2 text-center font-bold w-16 text-emerald-400">FFCE (h)</th>
                      <th className="py-2 px-2 text-center font-bold w-16 text-cyan-400">FFEOE (h)</th>
                      <th className="py-2 px-2 text-center font-bold w-16 text-purple-400">Peso %</th>
                      <th className="py-2 px-2 text-center font-bold w-14">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {uds.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-text-muted text-xs">
                          No hay unidades configuradas. Pulsa "+ Añadir Fila UD" para comenzar.
                        </td>
                      </tr>
                    ) : (
                      uds.map((ud, idx) => {
                        return (
                          <tr key={ud.id} className="hover:bg-alt/30 transition-colors">
                            {/* UD Code + Quick Delete */}
                            <td className="py-2 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(idx)}
                                  className="p-1 text-text-muted hover:text-red-400 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                                  title={`Eliminar fila ${ud.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-black text-amber-400 text-xs">
                                  {ud.id}
                                </span>
                              </div>
                            </td>

                            {/* Title */}
                            <td className="py-2 px-2.5">
                              <input
                                type="text"
                                value={ud.title}
                                onChange={(e) => handleTitleChange(idx, e.target.value)}
                                className="w-full px-2 py-1 text-xs font-semibold bg-background border border-border-default rounded-lg text-text-primary focus:border-cyan-500 focus:outline-none"
                              />
                            </td>

                            {/* RA / CE */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={ud.raCeText || ""}
                                onChange={(e) => handleRaCeChange(idx, e.target.value)}
                                placeholder="RA 1: a, b, c..."
                                className="w-full px-2 py-1 text-xs bg-background border border-border-default rounded-lg text-text-primary focus:border-cyan-500 focus:outline-none"
                              />
                            </td>

                            {/* RA Dual (FFEOE) Toggle */}
                            <td className="py-2 px-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleUdRaFfeoe(ud.id)}
                                title={
                                  ud.isRaFfeoe
                                    ? "Esta UD contiene RAs impartidos en empresa (FFEOE). Clic para desmarcar."
                                    : "Marcar esta UD como impartida en empresa (FFEOE)."
                                }
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                  ud.isRaFfeoe
                                    ? "bg-cyan-500 text-black border-cyan-400 shadow-xs"
                                    : (ud.horasFfeoe || 0) > 0
                                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                                    : "bg-surface/50 text-text-muted hover:text-text-primary border-border-default"
                                }`}
                              >
                                {ud.isRaFfeoe ? "★ Dual" : (ud.horasFfeoe || 0) > 0 ? "Dual h" : "Centro"}
                              </button>
                            </td>

                            {/* BC */}
                            <td className="py-2 px-1.5 text-center">
                              <input
                                type="text"
                                value={ud.bcCode || ""}
                                onChange={(e) => handleBcCodeChange(idx, e.target.value)}
                                className="w-12 px-1 py-1 text-xs text-center font-mono bg-background border border-border-default rounded-lg text-text-primary focus:border-cyan-500 focus:outline-none"
                              />
                            </td>

                            {/* CPPS */}
                            <td className="py-2 px-1.5 text-center">
                              <input
                                type="text"
                                value={ud.cppsText || ""}
                                onChange={(e) => handleCppsChange(idx, e.target.value)}
                                placeholder="r, c"
                                className="w-12 px-1 py-1 text-xs text-center font-mono bg-background border border-border-default rounded-lg text-rose-300 focus:border-cyan-500 focus:outline-none"
                              />
                            </td>

                            {/* OG */}
                            <td className="py-2 px-1.5 text-center">
                              <input
                                type="text"
                                value={ud.ogText || ""}
                                onChange={(e) => handleOgChange(idx, e.target.value)}
                                placeholder="s, c"
                                className="w-12 px-1 py-1 text-xs text-center font-mono bg-background border border-border-default rounded-lg text-emerald-300 focus:border-cyan-500 focus:outline-none"
                              />
                            </td>

                            {/* Fase Pedagógica */}
                            <td className="py-2 px-1.5 text-center">
                              <select
                                value={ud.fasePedagogicaId || "fase_1"}
                                onChange={(e) => handleFaseChange(idx, e.target.value)}
                                className="w-20 px-1 py-1 text-[11px] font-bold bg-background border border-border-default rounded-lg text-text-primary focus:border-cyan-500 focus:outline-none"
                              >
                                <option value="fase_1">Fase I</option>
                                <option value="fase_2">Fase II</option>
                                <option value="fase_3">Fase III</option>
                                <option value="fase_4">Fase IV</option>
                                <option value="fase_r">Fase R</option>
                              </select>
                            </td>

                            {/* Parcial / Trimestre */}
                            <td className="py-2 px-1.5 text-center">
                              <select
                                value={ud.trimestre || 1}
                                onChange={(e) => handleTrimestreChange(idx, Number(e.target.value))}
                                className={`w-14 px-1 py-1 text-xs font-mono font-bold rounded-lg border focus:outline-none text-center cursor-pointer transition-colors ${
                                  (ud.trimestre || 1) === 1
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/40 focus:border-amber-400"
                                    : (ud.trimestre || 1) === 2
                                    ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/40 focus:border-cyan-400"
                                    : (ud.trimestre || 1) === 3
                                    ? "bg-purple-500/15 text-purple-400 border-purple-500/40 focus:border-purple-400"
                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 focus:border-emerald-400"
                                }`}
                                title={`Asignar evaluación a esta UD (Actual: ${ud.trimestre || 1}T)`}
                              >
                                {Array.from({ length: Math.max(numParciales || 3, 3) }, (_, i) => i + 1).map((p) => (
                                  <option key={p} value={p} className="bg-surface text-text-primary">
                                    {p}T
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* FFCE (Horas Centro) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="200"
                                value={ud.horasFfce ?? ud.horasEstimadas ?? 0}
                                onChange={(e) => handleFfceChange(idx, Number(e.target.value))}
                                className="w-12 px-1 py-1 text-xs text-center font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                              />
                            </td>

                            {/* FFEOE (Horas Empresa) */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="200"
                                value={ud.horasFfeoe ?? 0}
                                onChange={(e) => handleFfeoeChange(idx, Number(e.target.value))}
                                className="w-12 px-1 py-1 text-xs text-center font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg focus:border-cyan-500 focus:outline-none"
                              />
                            </td>

                            {/* Peso % */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={ud.pesoPorcentaje ?? 0}
                                onChange={(e) => handlePesoChange(idx, Number(e.target.value))}
                                className="w-14 px-1 py-1 text-xs text-center font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                              />
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDelete(idx)}
                                className="p-1 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot>
                    <tr className="bg-alt/90 font-bold text-xs border-t-2 border-border-default">
                      <td colSpan={3} className="py-2.5 px-3 text-right text-text-muted">
                        Totales Módulo ({uds.length} UDs):
                      </td>
                      <td className="py-2.5 px-1 text-center font-mono text-[11px] font-black text-cyan-400">
                        {dualAudit.rasInFfeoeCount}/{dualAudit.totalRasModulo} RAs ({dualAudit.pctRaFfeoe.toFixed(1)}%)
                      </td>
                      <td colSpan={5}></td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-400">
                        {totalAssignedFfce} h
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-cyan-400">
                        {totalAssignedFfeoe} h
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-purple-400">
                        {totalPesoCalculated.toFixed(1)} %
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          )}

          {/* TAB 2: QUICK UDs LIST & REORDERING */}
          {activePlanTab === "unidades" && (
            <div className="space-y-3.5">
              {/* Quick Timing & Parciales Toolbar */}
              <div className="p-3.5 bg-background border border-amber-500/30 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Evaluaciones / Parciales de la Secuencia:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border-default text-xs">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setNumParciales(n);
                            setUds((prev) =>
                              prev.map((u) => ({
                                ...u,
                                trimestre: Math.min(n, u.trimestre || 1),
                              }))
                            );
                          }}
                          className={`px-2.5 py-0.5 font-mono font-bold rounded transition-all cursor-pointer ${
                            numParciales === n
                              ? "bg-amber-500 text-black shadow-xs font-black"
                              : "text-text-muted hover:text-text-primary hover:bg-alt"
                          }`}
                        >
                          {n} {n === 3 ? "Trim." : n === 2 ? "Sem." : n === 1 ? "Anual" : "P"}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoDistributeTrimesters}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer"
                      title="Distribuir equitativamente las UDs entre los parciales"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Auto-repartir
                    </button>
                  </div>
                </div>

                {/* Quick metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-surface border border-border-default flex items-center justify-between">
                    <span className="text-[11px] text-text-muted font-sans">Carga Módulo:</span>
                    <span className="font-bold text-amber-400">{horasModulo}h</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border-default flex items-center justify-between">
                    <span className="text-[11px] text-text-muted font-sans">Horas Asignadas:</span>
                    <span className={`font-bold ${totalAssignedHours === horasModulo ? "text-emerald-400" : "text-amber-400"}`}>
                      {totalAssignedHours}h
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border-default flex items-center justify-between">
                    <span className="text-[11px] text-text-muted font-sans">Semanas Curso:</span>
                    <span className="font-bold text-cyan-400">{semanasCurso} sem.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border-default flex items-center justify-between">
                    <span className="text-[11px] text-text-muted font-sans">Total Sesiones:</span>
                    <span className="font-bold text-purple-400">{totalSesionesPrevistas} ses.</span>
                  </div>
                </div>
              </div>

              {/* PRL Priority Rule banner */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong>Regla de Priorización PRL:</strong> Los bloques de contenido de Prevención de Riesgos y Seguridad están asignados como <strong>UD01</strong> con carácter transversal prioritario.
                </div>
              </div>

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
                            value={ud.bcCode || ""}
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
                              {Array.from({ length: Math.max(numParciales || 3, 3) }, (_, i) => i + 1).map((pNum) => (
                                <button
                                  key={pNum}
                                  type="button"
                                  onClick={() => handleTrimestreChange(idx, pNum)}
                                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                                    currentTrim === pNum
                                      ? pNum === 1
                                        ? "bg-amber-500 text-black shadow-xs font-black"
                                        : pNum === 2
                                        ? "bg-cyan-500 text-black shadow-xs font-black"
                                        : pNum === 3
                                        ? "bg-purple-500 text-white shadow-xs font-black"
                                        : "bg-emerald-500 text-black shadow-xs font-black"
                                      : "text-text-muted hover:text-text-primary hover:bg-alt"
                                  }`}
                                  title={`Asignar a ${getParcialLabel(pNum)}`}
                                >
                                  {pNum}T
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Hours & Sessions */}
                          <div className="flex items-center gap-1.5 bg-surface border border-border-default px-2 py-1 rounded-lg text-xs">
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
          )}
        </div>

        {/* Unified Approval Footer */}
        <div className="p-4 sm:p-5 border-t border-border-default bg-alt/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-text-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Al aprobar, se actualizará simultáneamente la <strong>Programación del Módulo</strong>, la <strong>Matriz Curricular</strong> y el <strong>Calendario Escolar</strong>.</span>
          </div>

          <div className="flex items-center gap-3">
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
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Check className="w-4 h-4" /> {uds.length === 0 ? "Guardar y Limpiar Plan (0 UDs)" : `Aprobar e Incorporar Planificación Integral (${uds.length} UDs • ${totalAssignedHours}h)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
