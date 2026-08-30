import { TimelineEvent, TimelineScale } from "../types/sigreTimeline";
import { SigreUDItem, SigreCurricularConfig } from "../types/sigre";

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getSchoolYearRange(schoolYearStr: string): { startYear: number; endYear: number } {
  const match = schoolYearStr?.match(/^(\d{4})-(\d{4})$/);
  if (match) {
    return { startYear: parseInt(match[1], 10), endYear: parseInt(match[2], 10) };
  }
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  return { startYear, endYear: startYear + 1 };
}

export function formatDateToIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseIsoDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function calculateDateScale(
  events: TimelineEvent[],
  schoolYear: string
): { minDate: Date; maxDate: Date } {
  const validEvents = events.filter((e) => e.startDate && !isNaN(new Date(`${e.startDate}T00:00:00`).getTime()));
  if (validEvents.length > 0) {
    const timestamps = validEvents.flatMap((e) => {
      const start = new Date(`${e.startDate}T00:00:00`).getTime();
      const end = e.endDate ? new Date(`${e.endDate}T00:00:00`).getTime() : start;
      return [start, end];
    });
    const min = new Date(Math.min(...timestamps) - 15 * ONE_DAY_MS);
    const max = new Date(Math.max(...timestamps) + 15 * ONE_DAY_MS);
    return { minDate: min, maxDate: max };
  }

  const { startYear, endYear } = getSchoolYearRange(schoolYear);
  const min = new Date(startYear, 8, 1); // 1 Sep
  const max = new Date(endYear, 6, 31); // 31 Jul
  return { minDate: min, maxDate: max };
}

// Convert Date to X coordinate on SVG canvas
export function dateToX(date: Date | string, scale: TimelineScale, panOffset: number): number {
  const d = typeof date === "string" ? parseIsoDate(date) : date;
  const daysFromStart = (d.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
  return panOffset + daysFromStart * scale.pixelsPerDay;
}

// Convert X coordinate to Date
export function xToDate(x: number, scale: TimelineScale, panOffset: number): Date {
  const daysFromStart = (x - panOffset) / scale.pixelsPerDay;
  const newTime = scale.minDate.getTime() + daysFromStart * ONE_DAY_MS;
  return new Date(newTime);
}

// Synchronize Module and Unit timelines with current SIGRE UDs & Curricular Config
export function generateModuleTimelineFromUds(
  uds: SigreUDItem[],
  config: Partial<SigreCurricularConfig> = {},
  schoolYear: string
): TimelineEvent[] {
  const { startYear, endYear } = getSchoolYearRange(schoolYear);
  const events: TimelineEvent[] = [];
  let nextId = 500;

  // Header presentation event
  events.push({
    id: nextId++,
    description: `Inicio del Módulo: ${config.moduloFormativo || "Módulo Técnico"} (${config.horasTotales || 160}h • ${config.semanasCurso || 32} semanas)`,
    startDate: `${startYear}-09-11`,
    endDate: `${startYear}-09-12`,
    category: "lectivo",
    level: "modulo",
    bgColor: "#06b6d4",
    textColor: "#000000",
    borderColor: "#0891b2",
  });

  if (uds.length === 0) {
    return events;
  }

  // Base calendar schedule: 32 weeks from mid September
  const startDate = new Date(`${startYear}-09-15T00:00:00`);
  let currentDate = new Date(startDate.getTime());

  // Distribute UDs across weeks
  uds.forEach((ud, index) => {
    const hours = ud.horasEstimadas || 16;
    const weeklyHours = config.horasSemanales || 5;
    const weeksDuration = Math.max(1, Math.round(hours / weeklyHours));
    const udStartIso = formatDateToIso(currentDate);

    // End date after weeksDuration weeks (excluding weekends roughly by adding 7 * weeks - 2)
    const udEndDate = new Date(currentDate.getTime() + (weeksDuration * 7 - 2) * ONE_DAY_MS);
    const udEndIso = formatDateToIso(udEndDate);

    const isPrl = ud.isPrl || index === 0;
    const trim = ud.trimestre || 1;
    const color = isPrl
      ? { bg: "#f59e0b", text: "#000000", border: "#d97706" }
      : trim === 1
      ? { bg: "#3b82f6", text: "#ffffff", border: "#2563eb" }
      : trim === 2
      ? { bg: "#10b981", text: "#000000", border: "#059669" }
      : { bg: "#a855f7", text: "#ffffff", border: "#9333ea" };

    events.push({
      id: nextId++,
      description: `${ud.fullCode || ud.id || `UD${index + 1}`}: ${ud.title || "Unidad Didáctica"} (${hours}h • ${ud.sesionesEstimadas || Math.round(hours / 2)} ses.)`,
      startDate: udStartIso,
      endDate: udEndIso,
      category: isPrl ? "otro" : "lectivo",
      level: "modulo",
      udId: ud.id,
      horas: hours,
      bgColor: color.bg,
      textColor: color.text,
      borderColor: color.border,
    });

    // Advance current date
    currentDate = new Date(udEndDate.getTime() + 3 * ONE_DAY_MS); // skip to next Monday
  });

  // Final evaluation & June recovery
  events.push({
    id: nextId++,
    description: `Evaluación Final Ordinaria y Cierre de Calificaciones del Módulo`,
    startDate: `${endYear}-06-08`,
    endDate: `${endYear}-06-10`,
    category: "evaluacion",
    level: "modulo",
    bgColor: "#f59e0b",
    textColor: "#000000",
    borderColor: "#d97706",
  });

  events.push({
    id: nextId++,
    description: `Periodo Extraordinario de Recuperación de Aprendizajes No Adquiridos (Junio)`,
    startDate: `${endYear}-06-11`,
    endDate: `${endYear}-06-24`,
    category: "recuperacion",
    level: "modulo",
    bgColor: "#eab308",
    textColor: "#000000",
    borderColor: "#ca8a04",
  });

  return events;
}

// Generate Unit Timeline for a specific UD
export function generateUnitTimelineFromUd(
  ud: SigreUDItem,
  schoolYear: string,
  startEstimatedDate?: string
): TimelineEvent[] {
  const { startYear } = getSchoolYearRange(schoolYear);
  const baseDateStr = startEstimatedDate || `${startYear}-09-15`;
  const baseDate = parseIsoDate(baseDateStr);
  const events: TimelineEvent[] = [];
  let nextId = 700;

  const totalSessions = ud.sesionesEstimadas || Math.max(3, Math.round((ud.horasEstimadas || 16) / 2));
  const udTitle = ud.title || "Unidad Didáctica";
  const udCode = ud.fullCode || ud.id || "UD01";

  // Session 1: Motivation & Prior knowledge
  events.push({
    id: nextId++,
    description: `${udCode} - Sesión 1: Presentación, Objetivos, Motivación y Activación Curricular`,
    startDate: formatDateToIso(baseDate),
    endDate: formatDateToIso(baseDate),
    category: "lectivo",
    level: "unidad",
    udId: ud.id,
    sesionNum: 1,
    horas: 1,
    bgColor: "#06b6d4",
    textColor: "#000000",
    borderColor: "#0891b2",
  });

  // Intermediate sessions
  for (let s = 2; s < totalSessions; s++) {
    const sDate = new Date(baseDate.getTime() + (s - 1) * 2 * ONE_DAY_MS);
    const isLab = s % 2 === 1;
    events.push({
      id: nextId++,
      description: `${udCode} - Sesión ${s}: ${isLab ? "Taller Práctico, Montaje y Simulación (FCE)" : "Desarrollo de Contenidos Técnicos y Epígrafes"}`,
      startDate: formatDateToIso(sDate),
      endDate: formatDateToIso(sDate),
      category: isLab ? "practica" : "lectivo",
      level: "unidad",
      udId: ud.id,
      sesionNum: s,
      horas: isLab ? 2 : 1,
      bgColor: isLab ? "#10b981" : "#3b82f6",
      textColor: isLab ? "#000000" : "#ffffff",
      borderColor: isLab ? "#059669" : "#2563eb",
    });
  }

  // Interactive HDI & Autoeval Session
  const hdiDate = new Date(baseDate.getTime() + (totalSessions - 1) * 2 * ONE_DAY_MS);
  events.push({
    id: nextId++,
    description: `${udCode} - Sesión ${totalSessions}: Simulación HDI Interactiva y Autoevaluación`,
    startDate: formatDateToIso(hdiDate),
    endDate: formatDateToIso(hdiDate),
    category: "lectivo",
    level: "unidad",
    udId: ud.id,
    sesionNum: totalSessions,
    horas: 1,
    bgColor: "#a855f7",
    textColor: "#ffffff",
    borderColor: "#9333ea",
  });

  // Final Assessment & Rubric (Hito)
  const examDate = new Date(hdiDate.getTime() + 2 * ONE_DAY_MS);
  events.push({
    id: nextId++,
    description: `${udCode} - Examen de Evaluación Oficial (GIFT 60 ítems) y Evaluación con Rúbrica`,
    startDate: formatDateToIso(examDate),
    endDate: formatDateToIso(examDate),
    category: "evaluacion",
    level: "unidad",
    udId: ud.id,
    horas: 1,
    bgColor: "#ef4444",
    textColor: "#ffffff",
    borderColor: "#dc2626",
  });

  return events;
}
