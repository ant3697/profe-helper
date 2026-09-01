import { SigreUDItem, SigrePedagogicalPhaseGroup } from "../types/sigre";

/**
 * Extracts RA identifiers from text or UD items (e.g. "RA 1", "RA 10", "RA 5, 6")
 */
export function extractRaLabelsFromUds(uds: SigreUDItem[]): string {
  const raSet = new Set<string>();

  uds.forEach((u) => {
    if (u.raCeText) {
      const matches = u.raCeText.match(/RA\s*\d+/gi);
      if (matches) {
        matches.forEach((m) => raSet.add(m.toUpperCase().replace(/\s+/, " ")));
      }
    }
    // Also check title if it includes RA references
    const titleMatches = u.title.match(/RA\s*\d+/gi);
    if (titleMatches) {
      titleMatches.forEach((m) => raSet.add(m.toUpperCase().replace(/\s+/, " ")));
    }
  });

  if (raSet.size === 0) {
    return "los Resultados de Aprendizaje del bloque";
  }

  const sorted = Array.from(raSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  return sorted.join(", ");
}

/**
 * Derives a domain-specific, dynamic thematic title and sequential justification
 * based on the actual UDs titles and RAs present in the phase.
 */
export function synthesizePhaseTheme(
  phaseIndex: number,
  totalPhases: number,
  phaseUds: SigreUDItem[],
  customName?: string
): { nombre: string; justificacionSecuencial: string; colorTheme: "green" | "yellow" | "blue" | "purple" | "slate" } {
  if (phaseUds.length === 0) {
    return {
      nombre: customName || `Fase ${getRomanNumeral(phaseIndex + 1)}`,
      justificacionSecuencial: "Bloque pedagógico de desarrollo curricular.",
      colorTheme: "blue",
    };
  }

  // Check if it's a recovery / reinforcement phase
  const isRecuperacion =
    phaseUds.every((u) => u.isPeriodoRecuperacion || u.id === "R" || u.title.toLowerCase().includes("recuperación")) ||
    (customName && customName.toLowerCase().includes("recuperación"));

  if (isRecuperacion) {
    return {
      nombre: "Periodo de Recuperación / Refuerzo Extraordinario (R)",
      justificacionSecuencial:
        "Atención personalizada, recuperación de competencias no superadas y consolidación de todos los Resultados de Aprendizaje.",
      colorTheme: "slate",
    };
  }

  const udRangeStr =
    phaseUds.length === 1
      ? `UD ${phaseUds[0].number || phaseUds[0].id.replace("UD", "")}`
      : `UD ${phaseUds[0].number || phaseUds[0].id.replace("UD", "")}-${
          phaseUds[phaseUds.length - 1].number || phaseUds[phaseUds.length - 1].id.replace("UD", "")
        }`;

  const allTitlesText = phaseUds.map((u) => u.title.toLowerCase()).join(" ");
  const raLabels = extractRaLabelsFromUds(phaseUds);

  const roman = getRomanNumeral(phaseIndex + 1);

  // Thematic keyword classification
  const isPrlOrPlanning =
    allTitlesText.includes("seguridad") ||
    allTitlesText.includes("riesgos") ||
    allTitlesText.includes("prevención") ||
    allTitlesText.includes("ambiental") ||
    allTitlesText.includes("planificación") ||
    allTitlesText.includes("fundamentos") ||
    allTitlesText.includes("normativa") ||
    allTitlesText.includes("planos") ||
    allTitlesText.includes("esquemas") ||
    phaseUds.some((u) => u.isPrl);

  const isMontajeOrInstalacion =
    allTitlesText.includes("montaje") ||
    allTitlesText.includes("instalación") ||
    allTitlesText.includes("redes") ||
    allTitlesText.includes("conductos") ||
    allTitlesText.includes("climatización") ||
    allTitlesText.includes("ventilación") ||
    allTitlesText.includes("tuberías") ||
    allTitlesText.includes("agua") ||
    allTitlesText.includes("captadores") ||
    allTitlesText.includes("fabricación") ||
    allTitlesText.includes("conformado") ||
    allTitlesText.includes("tendido");

  const isEnsayosOrAutomatismos =
    allTitlesText.includes("ensayos") ||
    allTitlesText.includes("estanqueidad") ||
    allTitlesText.includes("cuadros") ||
    allTitlesText.includes("automatismos") ||
    allTitlesText.includes("eléctricos") ||
    allTitlesText.includes("puesta en marcha") ||
    allTitlesText.includes("regulación") ||
    allTitlesText.includes("verificación") ||
    allTitlesText.includes("medidas") ||
    allTitlesText.includes("pruebas");

  const isMantenimientoOrDiagnosis =
    allTitlesText.includes("mantenimiento") ||
    allTitlesText.includes("diagnosis") ||
    allTitlesText.includes("averías") ||
    allTitlesText.includes("salubridad") ||
    allTitlesText.includes("correctivo") ||
    allTitlesText.includes("preventivo") ||
    allTitlesText.includes("calidad") ||
    allTitlesText.includes("explotación");

  let thematicTitle = "";
  let justification = "";
  let colorTheme: "green" | "yellow" | "blue" | "purple" | "slate" = "blue";

  // Build tailored thematic title & justification
  if (phaseIndex === 0 && (isPrlOrPlanning || phaseUds.length <= 4)) {
    if (allTitlesText.includes("climatización") || allTitlesText.includes("equipos")) {
      thematicTitle = `Fase ${roman}: Planificación, Seguridad y Equipos Base (${udRangeStr})`;
    } else if (allTitlesText.includes("prevención") || allTitlesText.includes("seguridad")) {
      thematicTitle = `Fase ${roman}: Planificación, Normativa y Prevención (${udRangeStr})`;
    } else {
      thematicTitle = `Fase ${roman}: Planificación y Fundamentación Técnica (${udRangeStr})`;
    }
    justification = `Se establece la base normativa (Seguridad y PRL), técnica y de diseño preparatorio asociada a ${raLabels}, garantizando los protocolos antes de la intervención en taller o campo.`;
    colorTheme = "green";
  } else if (isMontajeOrInstalacion && !isMantenimientoOrDiagnosis && !isEnsayosOrAutomatismos) {
    if (allTitlesText.includes("redes") || allTitlesText.includes("conductos")) {
      thematicTitle = `Fase ${roman}: Montaje de Equipos, Redes y Trazado (${udRangeStr})`;
    } else if (allTitlesText.includes("climatización") || allTitlesText.includes("ventilación")) {
      thematicTitle = `Fase ${roman}: Instalación y Montaje de Sistemas (${udRangeStr})`;
    } else {
      thematicTitle = `Fase ${roman}: Ejecución Técnica y Montaje Operativo (${udRangeStr})`;
    }
    justification = `Despliegue operativo y conexionado de equipos e infraestructuras vinculadas a ${raLabels}, aplicando procedimientos de montaje, ensamblado y técnicas de conformación.`;
    colorTheme = "blue";
  } else if (isEnsayosOrAutomatismos) {
    if (allTitlesText.includes("cuadros") || allTitlesText.includes("automatismos")) {
      thematicTitle = `Fase ${roman}: Ensayos, Automatismos y Puesta en Marcha (${udRangeStr})`;
    } else {
      thematicTitle = `Fase ${roman}: Pruebas de Estanqueidad y Verificación (${udRangeStr})`;
    }
    justification = `Verificación funcional, pruebas instrumentales de estanqueidad y protocolos de conexionado/arranque para ${raLabels}, validando la operatividad de los sistemas.`;
    colorTheme = "yellow";
  } else if (isMantenimientoOrDiagnosis || phaseIndex === totalPhases - 1) {
    if (allTitlesText.includes("diagnosis") || allTitlesText.includes("averías")) {
      thematicTitle = `Fase ${roman}: Diagnosis de Averías, Mantenimiento y Calidad (${udRangeStr})`;
    } else if (allTitlesText.includes("mantenimiento")) {
      thematicTitle = `Fase ${roman}: Mantenimiento Preventivo y Salubridad (${udRangeStr})`;
    } else {
      thematicTitle = `Fase ${roman}: Integración, Explotación y Control de Calidad (${udRangeStr})`;
    }
    justification = `Fase de síntesis orientada al mantenimiento predictivo, preventivo y correctivo, control de salubridad y aseguramiento de la calidad final conforme a ${raLabels}.`;
    colorTheme = "purple";
  } else {
    // Generic fallback based on position
    if (phaseIndex === 1) {
      thematicTitle = `Fase ${roman}: Desarrollo Técnico y Ejecución (${udRangeStr})`;
      justification = `Fase de desarrollo práctico e implementación de técnicas avanzadas asociadas a ${raLabels}.`;
      colorTheme = "blue";
    } else if (phaseIndex === 2) {
      thematicTitle = `Fase ${roman}: Aplicación Práctica y Puesta en Servicio (${udRangeStr})`;
      justification = `Fase de aplicación operativa, ensayos de funcionamiento y verificación para ${raLabels}.`;
      colorTheme = "yellow";
    } else {
      thematicTitle = `Fase ${roman}: Integración y Explotación Final (${udRangeStr})`;
      justification = `Fase de consolidación, mantenimiento y evaluación global vinculada a ${raLabels}.`;
      colorTheme = "purple";
    }
  }

  // If user provided a customized clean name, respect the title prefix while updating the range
  if (customName && !customName.includes("Fase I: Planificación (UD 1-4)") && !customName.includes("Fase II: Fabricación (UD 5-6)") && !customName.includes("Fase III: Unión Metálica (UD 7-9)") && !customName.includes("Fase IV: Montaje en Campo")) {
    thematicTitle = customName.replace(/\(UD.*?\)/, `(${udRangeStr})`);
  }

  return {
    nombre: thematicTitle,
    justificacionSecuencial: justification,
    colorTheme,
  };
}

/**
 * Dynamically groups UDs into coherent Pedagogical Phases based on:
 * 1. Their explicit phase assignments (`fasePedagogicaId` / `fasePedagogicaNombre`)
 * 2. OR dynamic sequential grouping with thematic synthesis if not assigned
 * Ensures NO duplicate UDs across phases.
 */
export function deriveDynamicPedagogicalPhases(
  uds: SigreUDItem[],
  customPhases?: SigrePedagogicalPhaseGroup[]
): {
  phases: SigrePedagogicalPhaseGroup[];
  groupedUds: { phase: SigrePedagogicalPhaseGroup; uds: SigreUDItem[] }[];
} {
  if (!uds || uds.length === 0) {
    return {
      phases: customPhases || [],
      groupedUds: [],
    };
  }

  // Sort UDs by number
  const sortedUds = [...uds].sort((a, b) => (a.number || 0) - (b.number || 0));

  const regularUds = sortedUds.filter(
    (u) => !u.isPeriodoRecuperacion && u.id !== "R" && !u.title.toLowerCase().includes("recuperación")
  );
  const recoveryUds = sortedUds.filter(
    (u) => u.isPeriodoRecuperacion || u.id === "R" || u.title.toLowerCase().includes("recuperación")
  );

  // Determine partitioning
  const phaseMap = new Map<string, SigreUDItem[]>();

  // Check if UDs have explicit `fasePedagogicaId`
  const hasExplicitPhaseIds = regularUds.some((u) => u.fasePedagogicaId);

  if (hasExplicitPhaseIds) {
    // Group by explicit ID
    regularUds.forEach((u, idx) => {
      let fId = u.fasePedagogicaId;
      if (!fId) {
        // Assign sequentially based on index
        const quarter = Math.min(4, Math.floor((idx / Math.max(1, regularUds.length)) * 4) + 1);
        fId = `fase_${quarter}`;
      }
      if (!phaseMap.has(fId)) {
        phaseMap.set(fId, []);
      }
      phaseMap.get(fId)!.push(u);
    });
  } else {
    // Automatically partition regular UDs into 2, 3, or 4 phases based on length
    const totalReg = regularUds.length;
    let numPhases = 4;
    if (totalReg <= 4) numPhases = 2;
    else if (totalReg <= 6) numPhases = 3;
    else numPhases = 4;

    const chunkSize = Math.ceil(totalReg / numPhases);
    for (let i = 0; i < numPhases; i++) {
      const fId = `fase_${i + 1}`;
      const slice = regularUds.slice(i * chunkSize, (i + 1) * chunkSize);
      if (slice.length > 0) {
        phaseMap.set(fId, slice);
      }
    }
  }

  // Build the list of generated phases
  const generatedPhases: SigrePedagogicalPhaseGroup[] = [];
  const groupedResult: { phase: SigrePedagogicalPhaseGroup; uds: SigreUDItem[] }[] = [];

  const phaseEntries = Array.from(phaseMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const totalPhaseCount = phaseEntries.length;

  phaseEntries.forEach(([faseId, pUds], idx) => {
    const customMatch = customPhases?.find((cp) => cp.id === faseId);
    const theme = synthesizePhaseTheme(idx, totalPhaseCount, pUds, customMatch?.nombre);

    const phaseObj: SigrePedagogicalPhaseGroup = {
      id: faseId,
      numero: idx + 1,
      nombre: theme.nombre,
      justificacionSecuencial: customMatch?.justificacionSecuencial || theme.justificacionSecuencial,
      colorTheme: theme.colorTheme,
      udsIds: pUds.map((u) => u.id),
    };

    generatedPhases.push(phaseObj);
    groupedResult.push({ phase: phaseObj, uds: pUds });
  });

  // Add Recovery phase if recovery UDs exist
  if (recoveryUds.length > 0) {
    const recTheme = synthesizePhaseTheme(generatedPhases.length, generatedPhases.length + 1, recoveryUds);
    const recPhase: SigrePedagogicalPhaseGroup = {
      id: "fase_r",
      numero: generatedPhases.length + 1,
      nombre: recTheme.nombre,
      justificacionSecuencial: recTheme.justificacionSecuencial,
      colorTheme: "slate",
      udsIds: recoveryUds.map((u) => u.id),
    };
    generatedPhases.push(recPhase);
    groupedResult.push({ phase: recPhase, uds: recoveryUds });
  }

  return {
    phases: generatedPhases,
    groupedUds: groupedResult,
  };
}

function getRomanNumeral(n: number): string {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return romans[n - 1] || `${n}`;
}
