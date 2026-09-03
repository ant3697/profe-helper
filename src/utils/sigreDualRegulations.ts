import { SigreCurricularConfig, SigreUDItem } from "../types/sigre";

export type EducationalStageType = "medio" | "superior" | "basico" | "especializacion";
export type DualRegimeType = "general" | "intensivo" | "no_dual";

export interface DualRegulationParameters {
  stage: EducationalStageType;
  regime: DualRegimeType;
  stageLabel: string;
  regimeLabel: string;
  totalCycleHours: number;
  // Limites normativos de horas en empresa (FFEOE) para el ciclo
  minHoursFfeoe: number;
  maxHoursFfeoe: number;
  minPctFfeoe: number;
  maxPctFfeoe: number;
  // Limites normativos de Resultados de Aprendizaje (RA) en empresa (FFEOE)
  minPctRaFfeoe: number;
  maxPctRaFfeoe: number;
  // Distribución orientativa por cursos
  typicalCourse1: {
    minHours: number;
    maxHours: number;
    recommendedHours: number;
    recommendedPct: number;
    description: string;
  };
  typicalCourse2: {
    minHours: number;
    maxHours: number;
    recommendedHours: number;
    recommendedPct: number;
    description: string;
  };
  legalReference: string;
  normativeSummary: string;
  raNormativeSummary: string;
}

/**
 * Devuelve los parámetros normativos exactos según la etapa educativa (CFGM, CFGS, CFGB, Especialización)
 * y el régimen de alternancia (Dual General, Dual Intensivo o No Dual).
 */
export function getDualRegulationParams(
  stage: EducationalStageType = "medio",
  regime: DualRegimeType = "general",
  customCycleHours?: number
): DualRegulationParameters {
  const isBasico = stage === "basico";
  const isEspecializacion = stage === "especializacion";
  const isSuperior = stage === "superior";
  const isMedio = stage === "medio";

  const totalCycleHours = customCycleHours || (isEspecializacion ? 600 : 2000);

  if (regime === "no_dual") {
    return {
      stage,
      regime,
      stageLabel: getStageLabel(stage),
      regimeLabel: "Régimen General / Sin Alternancia (100% Centro)",
      totalCycleHours,
      minHoursFfeoe: 0,
      maxHoursFfeoe: 0,
      minPctFfeoe: 0,
      maxPctFfeoe: 0,
      minPctRaFfeoe: 0,
      maxPctRaFfeoe: 0,
      typicalCourse1: {
        minHours: 0,
        maxHours: 0,
        recommendedHours: 0,
        recommendedPct: 0,
        description: "100% Formación en Centro Educativo (FFCE)",
      },
      typicalCourse2: {
        minHours: 0,
        maxHours: 0,
        recommendedHours: 0,
        recommendedPct: 0,
        description: "100% Formación en Centro Educativo (FFCE)",
      },
      legalReference: "LO 3/2022 y RD 659/2023",
      normativeSummary: "Modalidad íntegramente presencial en centro educativo sin estancia curricular en empresa.",
      raNormativeSummary: "El 100% de los Resultados de Aprendizaje se imparten y evalúan en el centro educativo.",
    };
  }

  if (regime === "intensivo") {
    const minHours = Math.round(totalCycleHours * 0.3501); // > 35%
    const maxHours = Math.round(totalCycleHours * 0.50); // Hasta 50%
    return {
      stage,
      regime,
      stageLabel: getStageLabel(stage),
      regimeLabel: "FP Dual Régimen Intensivo (>35% - 50%)",
      totalCycleHours,
      minHoursFfeoe: minHours,
      maxHoursFfeoe: maxHours,
      minPctFfeoe: 35.1,
      maxPctFfeoe: 50.0,
      minPctRaFfeoe: 30.0,
      maxPctRaFfeoe: 50.0,
      typicalCourse1: {
        minHours: isEspecializacion ? 0 : 200,
        maxHours: isEspecializacion ? 0 : 350,
        recommendedHours: isEspecializacion ? 0 : 250,
        recommendedPct: isEspecializacion ? 0 : 25.0,
        description: "Alternancia intensiva inicial con contrato de formación",
      },
      typicalCourse2: {
        minHours: isEspecializacion ? minHours : 450,
        maxHours: isEspecializacion ? maxHours : 650,
        recommendedHours: isEspecializacion ? maxHours : 550,
        recommendedPct: isEspecializacion ? 50.0 : 54.7,
        description: "Alternancia intensiva avanzada y evaluación compartida",
      },
      legalReference: "LO 3/2022 Art. 68 y RD 659/2023 Art. 68",
      normativeSummary: `Formación en empresa superior al 35% y hasta el 50% (${minHours}h - ${maxHours}h para ${totalCycleHours}h de ciclo). Requiere contrato de formación en alternancia remunerado.`,
      raNormativeSummary: "Se impartirán y evaluarán en empresa más del 30% de los Resultados de Aprendizaje (RA) del ciclo formativo.",
    };
  }

  // Dual General (default)
  if (isBasico) {
    // Ciclos Formativos de Grado Básico (CFGB): 20% a 22% en empresa (400h a 440h en 2000h)
    const minHours = Math.round(totalCycleHours * 0.20);
    const maxHours = Math.round(totalCycleHours * 0.22);
    return {
      stage: "basico",
      regime: "general",
      stageLabel: "Grado Básico (CFGB - Grado D)",
      regimeLabel: "FP Dual Régimen General (CFGB: 20% - 22%)",
      totalCycleHours,
      minHoursFfeoe: minHours,
      maxHoursFfeoe: maxHours,
      minPctFfeoe: 20.0,
      maxPctFfeoe: 22.0,
      minPctRaFfeoe: 10.0,
      maxPctRaFfeoe: 15.0,
      typicalCourse1: {
        minHours: 0,
        maxHours: 80,
        recommendedHours: 0,
        recommendedPct: 0,
        description: "Centro educativo (inicio optativo de estancia en 3er trimestre)",
      },
      typicalCourse2: {
        minHours: 350,
        maxHours: 440,
        recommendedHours: 400,
        recommendedPct: 39.8,
        description: "Estancia práctica adaptada en empresa (400h / 20% del ciclo)",
      },
      legalReference: "LO 3/2022 y RD 659/2023 Art. 67/68 (CFGB)",
      normativeSummary: `Para Grado Básico, la FFEOE se sitúa entre el 20% y el 22% del ciclo (${minHours}h - ${maxHours}h de ${totalCycleHours}h).`,
      raNormativeSummary: "Se impartirán entre el 10% y el 15% de los Resultados de Aprendizaje (RA) básicos en estancia de empresa.",
    };
  }

  if (isEspecializacion) {
    // Cursos de Especialización (Grado E): Duración típica 300h - 720h (def. 600h)
    const minHours = Math.round(totalCycleHours * 0.15);
    const maxHours = Math.round(totalCycleHours * 0.25);
    return {
      stage: "especializacion",
      regime: "general",
      stageLabel: "Curso de Especialización (Grado E)",
      regimeLabel: "FP Dual Régimen General (Especialización: 15% - 25%)",
      totalCycleHours,
      minHoursFfeoe: minHours,
      maxHoursFfeoe: maxHours,
      minPctFfeoe: 15.0,
      maxPctFfeoe: 25.0,
      minPctRaFfeoe: 10.0,
      maxPctRaFfeoe: 20.0,
      typicalCourse1: {
        minHours,
        maxHours,
        recommendedHours: Math.round((minHours + maxHours) / 2),
        recommendedPct: 20.0,
        description: "Estancia técnica especializada en empresa del sector tecnológico",
      },
      typicalCourse2: {
        minHours: 0,
        maxHours: 0,
        recommendedHours: 0,
        recommendedPct: 0,
        description: "Curso anual único (Grado E)",
      },
      legalReference: "LO 3/2022 y RD 659/2023 (Cursos de Especialización Grado E)",
      normativeSummary: `Para Cursos de Especialización (${totalCycleHours}h), la estancia práctica en empresa se sitúa entre el 15% y el 25% (${minHours}h - ${maxHours}h).`,
      raNormativeSummary: "Se impartirán entre el 10% y el 20% de los Resultados de Aprendizaje (RA) especializados en estancia práctica.",
    };
  }

  // Grado Medio (CFGM) y Grado Superior (CFGS) - Régimen General Estándar
  // 500h a 700h (25% a 35% del total del ciclo de 2000h)
  // 10% a 20% de los Resultados de Aprendizaje (RA) en FFEOE
  const minHours = 500;
  const maxHours = 700;
  const minPct = parseFloat(((minHours / totalCycleHours) * 100).toFixed(1)); // 25.0%
  const maxPct = parseFloat(((maxHours / totalCycleHours) * 100).toFixed(1)); // 35.0%

  return {
    stage: isSuperior ? "superior" : "medio",
    regime: "general",
    stageLabel: isSuperior ? "Grado Superior (CFGS - Grado D)" : "Grado Medio (CFGM - Grado D)",
    regimeLabel: "FP Dual Régimen General (25% - 35% · 500h a 700h)",
    totalCycleHours,
    minHoursFfeoe: minHours,
    maxHoursFfeoe: maxHours,
    minPctFfeoe: minPct,
    maxPctFfeoe: maxPct,
    minPctRaFfeoe: 10.0,
    maxPctRaFfeoe: 20.0,
    typicalCourse1: {
      minHours: 100,
      maxHours: 200,
      recommendedHours: 120,
      recommendedPct: 12.1,
      description: "1º Curso: Fase inicial de alternancia (4 semanas · 120h aprox. en marzo-abril)",
    },
    typicalCourse2: {
      minHours: 380,
      maxHours: 540,
      recommendedHours: 410,
      recommendedPct: 40.8,
      description: "2º Curso: Fase avanzada de alternancia (marzo a junio · 410h aprox.)",
    },
    legalReference: "LO 3/2022 Art. 67 y RD 659/2023 Art. 67 (Instrucciones Junta de Andalucía)",
    normativeSummary: `La formación en empresa (FFEOE) en Régimen General comprenderá entre 500 y 700 horas (25% a 35% de las ${totalCycleHours}h del ciclo).`,
    raNormativeSummary: "El currículo establece que se impartirán entre el 10% y el 20% de los Resultados de Aprendizaje (RA) en la empresa (FFEOE).",
  };
}

function getStageLabel(stage: EducationalStageType): string {
  switch (stage) {
    case "basico":
      return "Grado Básico (CFGB)";
    case "medio":
      return "Grado Medio (CFGM)";
    case "superior":
      return "Grado Superior (CFGS)";
    case "especializacion":
      return "Curso de Especialización (Grado E)";
  }
}

/**
 * Valida si las horas de ciclo, horas de módulo y porcentaje de RAs asignados cumplen con la normativa.
 */
export interface DualComplianceAudit {
  isCompliantHours: boolean;
  isCompliantRa: boolean;
  isFullyCompliant: boolean;
  totalCycleHours: number;
  totalFfeoeCycleHours: number;
  ffeoeCyclePct: number;
  minHoursFfeoe: number;
  maxHoursFfeoe: number;
  hoursStatus: "under" | "valid" | "over";
  hoursStatusMessage: string;
  // RAs en FFEOE
  totalRasModulo: number;
  rasInFfeoeCount: number;
  pctRaFfeoe: number;
  minPctRa: number;
  maxPctRa: number;
  raStatus: "under" | "valid" | "over";
  raStatusMessage: string;
  // Repercusión en este módulo
  horasModulo: number;
  horasFfeoeModulo: number;
  pctFfeoeModulo: number;
  params: DualRegulationParameters;
  summaryBadgeText: string;
  summaryBadgeColor: "emerald" | "amber" | "red" | "cyan" | "blue";
  recommendations: string[];
}

export function auditDualRegulationCompliance(
  config: SigreCurricularConfig,
  uds: SigreUDItem[] = []
): DualComplianceAudit {
  const stage: EducationalStageType =
    config.etapaCiclo ||
    (config.cicloFormativo?.toLowerCase().includes("básico") || config.cicloFormativo?.toLowerCase().includes("basico")
      ? "basico"
      : config.cicloFormativo?.toLowerCase().includes("superior")
      ? "superior"
      : config.cicloFormativo?.toLowerCase().includes("especializ")
      ? "especializacion"
      : "medio");

  const regime: DualRegimeType = config.regimenDual || "general";
  const horasTotalesModulo = config.horasTotales || 160;
  const totalCiclo = config.cyclePlanData?.totalHorasCiclo || (stage === "especializacion" ? 600 : 2000);

  const params = getDualRegulationParams(stage, regime, totalCiclo);

  // Horas en empresa de 1º y 2º
  const h1 = config.horasFfeoePrimerCurso ?? 120;
  const h2 = config.horasFfeoeSegundoCurso ?? 410;
  const totalFfeoeCycleHours = stage === "especializacion" ? (config.horasFfeoeModulo ?? 120) : h1 + h2;
  const ffeoeCyclePct = parseFloat(((totalFfeoeCycleHours / totalCiclo) * 100).toFixed(1));

  // Horas del módulo actual
  const horasFfeoeModulo =
    config.horasFfeoeModulo !== undefined
      ? config.horasFfeoeModulo
      : Math.round((horasTotalesModulo * (config.porcentajeDual ?? 12.1)) / 100);
  const pctFfeoeModulo = parseFloat(((horasFfeoeModulo / horasTotalesModulo) * 100).toFixed(1));

  // Estado de Horas Ciclo
  let hoursStatus: "under" | "valid" | "over" = "valid";
  let hoursStatusMessage = "";

  if (regime === "no_dual") {
    hoursStatus = totalFfeoeCycleHours === 0 ? "valid" : "over";
    hoursStatusMessage = "Modalidad 100% presencial en Centro Educativo (0h empresa).";
  } else if (totalFfeoeCycleHours < params.minHoursFfeoe) {
    hoursStatus = "under";
    hoursStatusMessage = `Por debajo del mínimo legal: ${totalFfeoeCycleHours}h (Mínimo: ${params.minHoursFfeoe}h · ${params.minPctFfeoe}%).`;
  } else if (totalFfeoeCycleHours > params.maxHoursFfeoe) {
    hoursStatus = "over";
    hoursStatusMessage =
      regime === "general"
        ? `Supera el máximo de Régimen General: ${totalFfeoeCycleHours}h (Máx: ${params.maxHoursFfeoe}h · ${params.maxPctFfeoe}%). Correspondería a Régimen Intensivo (>35%).`
        : `Supera el límite máximo de ${params.maxHoursFfeoe}h (${params.maxPctFfeoe}%).`;
  } else {
    hoursStatus = "valid";
    hoursStatusMessage = `Cumple la normativa: ${totalFfeoeCycleHours}h (${ffeoeCyclePct}%) dentro del rango [${params.minHoursFfeoe}h - ${params.maxHoursFfeoe}h].`;
  }

  const isCompliantHours = hoursStatus === "valid";

  // Análisis de Resultados de Aprendizaje (RA) en FFEOE
  // Contamos los RAs presentes en las UDs que tienen estancia dual (horasFfeoe > 0 o isDualEmpresa)
  const regularUds = uds.filter((u) => !u.isPeriodoRecuperacion);
  const totalUdsCount = regularUds.length || 8;
  const udsWithFfeoe = regularUds.filter((u) => (u.horasFfeoe && u.horasFfeoe > 0) || u.isDualEmpresa || u.isRaFfeoe);

  // Estimamos o calculamos los RAs del módulo
  // Si las UDs tienen raCeText, extraemos los RAs únicos
  const allRas = new Set<string>();
  const ffeoeRas = new Set<string>();

  regularUds.forEach((u) => {
    const raMatches = (u.raCeText || "").match(/RA\s*\d+/gi) || [`RA_${u.id}`];
    raMatches.forEach((r) => {
      const cleanRa = r.toUpperCase().replace(/\s+/g, " ");
      allRas.add(cleanRa);
      if ((u.horasFfeoe && u.horasFfeoe > 0) || u.isDualEmpresa || u.isRaFfeoe) {
        ffeoeRas.add(cleanRa);
      }
    });
  });

  const totalRasModulo = allRas.size > 0 ? allRas.size : Math.max(5, Math.ceil(totalUdsCount * 0.75));
  let rasInFfeoeCount = ffeoeRas.size;

  // Si no hay RAs desglosados en texto todavía, deducimos proporcionalmente de las UDs con dual
  if (rasInFfeoeCount === 0 && udsWithFfeoe.length > 0) {
    rasInFfeoeCount = Math.max(1, Math.round((udsWithFfeoe.length / totalUdsCount) * totalRasModulo));
  } else if (rasInFfeoeCount === 0 && horasFfeoeModulo > 0) {
    // Estimación teórica conforme al porcentaje de horas
    rasInFfeoeCount = Math.max(1, Math.round((pctFfeoeModulo / 100) * totalRasModulo));
  }

  const pctRaFfeoe = parseFloat(((rasInFfeoeCount / (totalRasModulo || 1)) * 100).toFixed(1));

  let raStatus: "under" | "valid" | "over" = "valid";
  let raStatusMessage = "";

  if (regime === "no_dual") {
    raStatus = rasInFfeoeCount === 0 ? "valid" : "over";
    raStatusMessage = "0% de RAs en empresa (100% en centro educativo).";
  } else if (pctRaFfeoe < params.minPctRaFfeoe) {
    raStatus = "under";
    raStatusMessage = `RAs en empresa (${pctRaFfeoe}%) inferior al mínimo legal del ${params.minPctRaFfeoe}%.`;
  } else if (pctRaFfeoe > params.maxPctRaFfeoe) {
    raStatus = "over";
    raStatusMessage =
      regime === "general"
        ? `RAs en empresa (${pctRaFfeoe}%) supera el máximo del ${params.maxPctRaFfeoe}% para Dual General (corresponde a Régimen Intensivo >30%).`
        : `RAs en empresa (${pctRaFfeoe}%) supera el máximo del ${params.maxPctRaFfeoe}%.`;
  } else {
    raStatus = "valid";
    raStatusMessage = `Cumple el criterio curricular: ${rasInFfeoeCount}/${totalRasModulo} RAs en FFEOE (${pctRaFfeoe}%), dentro del rango legal [${params.minPctRaFfeoe}% - ${params.maxPctRaFfeoe}%].`;
  }

  const isCompliantRa = raStatus === "valid";
  const isFullyCompliant = isCompliantHours && isCompliantRa;

  const recommendations: string[] = [];
  if (hoursStatus === "under") {
    recommendations.push(
      `Aumentar las horas de empresa en el ciclo hasta al menos ${params.minHoursFfeoe}h (${params.minPctFfeoe}% del total) para cumplir con el Régimen General.`
    );
  }
  if (hoursStatus === "over" && regime === "general") {
    recommendations.push(
      `Las ${totalFfeoeCycleHours}h superan las 700h del Régimen General. Ajusta a 500h-700h o cambia la modalidad a 'Dual Intensiva' (>35%).`
    );
  }
  if (raStatus === "under") {
    recommendations.push(
      `Vincular al menos 1 o 2 Resultados de Aprendizaje de aplicación práctica/taller a la estancia en empresa (objetivo: ${params.minPctRaFfeoe}% - ${params.maxPctRaFfeoe}% de los RAs).`
    );
  }
  if (raStatus === "over" && regime === "general") {
    recommendations.push(
      `El currículo limita al 10%-20% los RAs impartidos en FFEOE en Régimen General. Reubica RAs teóricos/base a la FCE (Centro).`
    );
  }

  let summaryBadgeColor: "emerald" | "amber" | "red" | "cyan" | "blue" = "emerald";
  let summaryBadgeText = "✓ Normativa FP Dual LO 3/2022 y RD 659/2023 Conforme";

  if (!isFullyCompliant) {
    if (hoursStatus !== "valid" && raStatus !== "valid") {
      summaryBadgeColor = "red";
      summaryBadgeText = "⚠ Fuera de rango legal en horas y RAs";
    } else {
      summaryBadgeColor = "amber";
      summaryBadgeText = "⚠ Requiere ajuste para coincidir exactamente con el rango normativo";
    }
  }

  return {
    isCompliantHours,
    isCompliantRa,
    isFullyCompliant,
    totalCycleHours: totalCiclo,
    totalFfeoeCycleHours,
    ffeoeCyclePct,
    minHoursFfeoe: params.minHoursFfeoe,
    maxHoursFfeoe: params.maxHoursFfeoe,
    hoursStatus,
    hoursStatusMessage,
    totalRasModulo,
    rasInFfeoeCount,
    pctRaFfeoe,
    minPctRa: params.minPctRaFfeoe,
    maxPctRa: params.maxPctRaFfeoe,
    raStatus,
    raStatusMessage,
    horasModulo: horasTotalesModulo,
    horasFfeoeModulo,
    pctFfeoeModulo,
    params,
    summaryBadgeText,
    summaryBadgeColor,
    recommendations,
  };
}

/**
 * Realiza un reparto automático inteligente de horas y RAs en las Unidades Didácticas
 * garantizando que se respete el rango normativo de 10%-20% de RAs y el target de horas.
 */
export function autoDistributeDualHoursAndRAs(
  uds: SigreUDItem[],
  targetFfeoeHours: number,
  totalModuleHours: number,
  targetRaPct: number = 15 // Defecto 15% (dentro de 10%-20%)
): SigreUDItem[] {
  if (!uds || uds.length === 0) return [];

  const regularUds = uds.filter((u) => !u.isPeriodoRecuperacion);
  const recupUds = uds.filter((u) => u.isPeriodoRecuperacion);
  const totalUdsCount = regularUds.length;

  if (totalUdsCount === 0) return uds;

  // Calculamos cuántas UDs deben llevar estancia en empresa para cubrir el ~15% (10%-20%) de RAs
  // Típicamente 1 o 2 UDs de las fases finales (Fase 3: Fabricación/Montaje, Fase 4: Control/Puesta en servicio)
  const targetDualUdsCount = Math.max(1, Math.min(Math.round(totalUdsCount * (targetRaPct / 100)), Math.ceil(totalUdsCount * 0.25)));

  // Buscamos las mejores candidatas (fases finales, UDs prácticas o las últimas UDs de la secuencia)
  const candidateIndices: number[] = [];
  
  // Prioridad 1: UDs marcadas como fase_3 o fase_4
  regularUds.forEach((u, idx) => {
    if (u.fasePedagogicaId === "fase_4" || u.fasePedagogicaId === "fase_3" || u.title.toLowerCase().includes("montaje") || u.title.toLowerCase().includes("mantenimiento") || u.title.toLowerCase().includes("puesta en marcha")) {
      candidateIndices.push(idx);
    }
  });

  // Si no encontramos suficientes por nombre/fase, tomamos las últimas UDs
  if (candidateIndices.length < targetDualUdsCount) {
    for (let i = totalUdsCount - 1; i >= 0 && candidateIndices.length < targetDualUdsCount; i--) {
      if (!candidateIndices.includes(i)) {
        candidateIndices.push(i);
      }
    }
  }

  // Tomamos solo las primeras targetDualUdsCount candidatas
  const selectedDualIndices = new Set(candidateIndices.slice(0, targetDualUdsCount));

  // Distribuimos las horas de empresa equitativamente entre las UDs seleccionadas
  const hoursPerDualUd = Math.floor(targetFfeoeHours / (targetDualUdsCount || 1));
  let remainingHours = targetFfeoeHours - (hoursPerDualUd * targetDualUdsCount);

  const updatedRegularUds = regularUds.map((u, idx) => {
    const isDual = selectedDualIndices.has(idx) && targetFfeoeHours > 0;
    const assignedFfeoe = isDual ? hoursPerDualUd + (remainingHours > 0 ? (remainingHours--, 1) : 0) : 0;
    const totalUdHours = u.horasEstimadas || Math.round(totalModuleHours / totalUdsCount);
    const assignedFfce = Math.max(0, totalUdHours - assignedFfeoe);

    return {
      ...u,
      horasFfeoe: assignedFfeoe,
      horasFfce: assignedFfce,
      horasFce: assignedFfce,
      isDualEmpresa: isDual,
      isRaFfeoe: isDual,
      dualNotaEmpresa: isDual
        ? `Estancia Dual en Empresa (FFEOE · RD 659/2023): ${assignedFfeoe}h lectivas de práctica y adquisición directa de Resultados de Aprendizaje en alternancia.`
        : undefined,
    };
  });

  return [...updatedRegularUds, ...recupUds];
}
