import {
  SigreAcademicCalendar,
  SigreCalendarLegendItem,
  SigreCalendarDayOverride,
  SigreCalendarDayType,
  SigreUDItem,
} from "../types/sigre";

export interface CalendarMonthData {
  year: number;
  month: number; // 0=Jan, 8=Sep, 11=Dec
  monthName: string;
  shortName: string;
  days: Array<{
    dayNumber: number;
    dateString: string; // "YYYY-MM-DD"
    dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
    isCurrentMonth: boolean;
    isWeekend: boolean;
    override?: SigreCalendarDayOverride;
    legendItem?: SigreCalendarLegendItem;
    isSpecialEvent?: boolean;
    specialEventType?: SigreCalendarDayType;
    specialEventLabel?: string;
    assignedUdId?: string;
    assignedUdCode?: string;
    assignedUdColor?: string;
    displayBgColor: string;
    displayTextColor: string;
    hasSpecialPrevalence: boolean;
  }>;
}

export type CalendarGridDay = CalendarMonthData["days"][0];

export const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const MONTH_NAMES_SHORT_ES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

// Special event types that have visual prevalence over general UD schedules
export function isSpecialEventType(type?: SigreCalendarDayType): boolean {
  if (!type) return false;
  return [
    "festivo_nacional",
    "festivo_autonomico",
    "festivo_local",
    "vacaciones_navidad",
    "vacaciones_semana_santa",
    "semana_blanca",
    "dia_comunidad_educativa",
    "no_lectivo",
    "evaluacion_inicial",
    "evaluacion_trimestral",
    "evaluacion_final",
    "evaluacion_extraordinaria",
    "inicio_fin_curso",
  ].includes(type);
}

// Curated palette of visually distinct, harmonic and high-contrast color pairs for UDs & Didactic Units
// Pattern taken directly from the official school calendar & didactic planning reference
export interface UdColorOption {
  bg: string;
  text: string;
  border?: string;
  name: string;
  category?: "ud" | "official" | "accent";
}

export const UD_DISTINCT_COLOR_PALETTE: UdColorOption[] = [
  { bg: "#fcd5b4", text: "#431407", border: "#fba972", name: "Melocotón Crema (UD1/RA08)", category: "ud" },
  { bg: "#e2d5e8", text: "#3b0764", border: "#c4b5fd", name: "Lavanda / Malva (UD2/RA01)", category: "ud" },
  { bg: "#f5deb3", text: "#7c2d12", border: "#deb887", name: "Marrón Canela / Trigo (UD3/RA02)", category: "ud" },
  { bg: "#fff2b2", text: "#713f12", border: "#fde047", name: "Amarillo Crema (UD4/RA03)", category: "ud" },
  { bg: "#ffc482", text: "#7c2d12", border: "#fb923c", name: "Naranja Melocotón (UD5/RA04)", category: "ud" },
  { bg: "#99e6ff", text: "#0c4a6e", border: "#38bdf8", name: "Azul Cielo Cyan (UD6/RA05)", category: "ud" },
  { bg: "#b2e6b2", text: "#14532d", border: "#4ade80", name: "Verde Menta (UD7/RA06)", category: "ud" },
  { bg: "#80deea", text: "#134e4a", border: "#26c6da", name: "Turquesa Claro (UD8/RA07)", category: "ud" },
  { bg: "#c5e1a5", text: "#365314", border: "#9ccc65", name: "Verde Pistacho / Proyecto", category: "ud" },
  { bg: "#ffd966", text: "#713f12", border: "#facc15", name: "Amarillo Dorado (UD10)", category: "ud" },
  { bg: "#f8cb9c", text: "#7c2d12", border: "#fb923c", name: "Melocotón Tostado / Recuperación", category: "ud" },
  { bg: "#fbcfe8", text: "#831843", border: "#f472b6", name: "Rosa Pastel / Fucsia Suave", category: "ud" },
  { bg: "#c7d2fe", text: "#3730a3", border: "#818cf8", name: "Añil / Lavanda", category: "ud" },
  { bg: "#a7f3d0", text: "#065f46", border: "#34d399", name: "Verde Esmeralda", category: "ud" },
  { bg: "#fef08a", text: "#854d0e", border: "#eab308", name: "Amarillo Dual", category: "ud" },
  { bg: "#bae6fd", text: "#0369a1", border: "#38bdf8", name: "Azul Celeste", category: "ud" },
];

export const OFFICIAL_EVENT_COLOR_PALETTE: UdColorOption[] = [
  { bg: "#ff0000", text: "#ffffff", border: "#cc0000", name: "Festivo Nacional (Rojo)", category: "official" },
  { bg: "#ff00ff", text: "#ffffff", border: "#d900d9", name: "Inicio / Fin Clases / Hito (Magenta)", category: "official" },
  { bg: "#0080ff", text: "#ffffff", border: "#0066cc", name: "Sesión de Evaluación (Azul)", category: "official" },
  { bg: "#99cc33", text: "#000000", border: "#7da829", name: "Evaluación Inicial / Andalucía (Pistacho)", category: "official" },
  { bg: "#00ffff", text: "#000000", border: "#00cccc", name: "Vacaciones Navidad (Cyan)", category: "official" },
  { bg: "#ff99ff", text: "#000000", border: "#e680e6", name: "Vacaciones Semana Santa (Rosa)", category: "official" },
  { bg: "#80cbc4", text: "#000000", border: "#4db6ac", name: "Semana Blanca (Aguamarina)", category: "official" },
  { bg: "#ffc000", text: "#000000", border: "#e6ac00", name: "Día Comunidad Ed. (Ámbar)", category: "official" },
  { bg: "#00b050", text: "#ffffff", border: "#009944", name: "Jueves Santo / Festivo Verde", category: "official" },
  { bg: "#fff2b2", text: "#713f12", border: "#fde047", name: "FP Dual / Formación Empresa", category: "official" },
  { bg: "#f8cb9c", text: "#7c2d12", border: "#fb923c", name: "Recuperación (Melocotón Tostado)", category: "official" },
  { bg: "#64748b", text: "#ffffff", border: "#475569", name: "No Lectivo (Pizarra)", category: "official" },
];

// Helper to calculate optimal WCAG contrast text color (dark vs white) for any hex background
export function getOptimalTextColorForBg(hexBg: string): string {
  if (!hexBg || hexBg === "transparent") return "#ffffff";
  const cleanHex = hexBg.replace("#", "");
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  // Standard relative luminance calculation (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

// Get distinct color pair by index or key
export function getDistinctUdColor(indexOrKey: number | string): { bg: string; text: string } {
  if (typeof indexOrKey === "number") {
    const opt = UD_DISTINCT_COLOR_PALETTE[Math.abs(indexOrKey) % UD_DISTINCT_COLOR_PALETTE.length];
    return { bg: opt.bg, text: opt.text };
  }
  let hash = 0;
  for (let i = 0; i < indexOrKey.length; i++) {
    hash = (hash << 5) - hash + indexOrKey.charCodeAt(i);
    hash |= 0;
  }
  const opt = UD_DISTINCT_COLOR_PALETTE[Math.abs(hash) % UD_DISTINCT_COLOR_PALETTE.length];
  return { bg: opt.bg, text: opt.text };
}

// Official color styling for special events matching reference pattern
export function getOfficialEventStyle(type?: SigreCalendarDayType): {
  bgColor: string;
  textColor: string;
  label: string;
  isHoliday: boolean;
} {
  switch (type) {
    case "festivo_nacional":
      return { bgColor: "#ff0000", textColor: "#ffffff", label: "Festivo Nacional", isHoliday: true };
    case "festivo_autonomico":
      return { bgColor: "#99cc33", textColor: "#000000", label: "Festivo Autonómico (Día de Andalucía / Junta)", isHoliday: true };
    case "festivo_local":
      return { bgColor: "#ff0000", textColor: "#ffffff", label: "Fiesta Local", isHoliday: true };
    case "vacaciones_navidad":
      return { bgColor: "#00ffff", textColor: "#000000", label: "Vacaciones de Navidad", isHoliday: true };
    case "vacaciones_semana_santa":
      return { bgColor: "#ff99ff", textColor: "#000000", label: "Semana Santa", isHoliday: true };
    case "semana_blanca":
      return { bgColor: "#80cbc4", textColor: "#000000", label: "Semana Blanca", isHoliday: true };
    case "dia_comunidad_educativa":
      return { bgColor: "#ffc000", textColor: "#000000", label: "Día de la Comunidad Educativa", isHoliday: true };
    case "no_lectivo":
      return { bgColor: "#64748b", textColor: "#ffffff", label: "Día no lectivo", isHoliday: true };
    case "evaluacion_inicial":
      return { bgColor: "#99cc33", textColor: "#000000", label: "Evaluación Inicial", isHoliday: false };
    case "evaluacion_trimestral":
      return { bgColor: "#0080ff", textColor: "#ffffff", label: "Sesión de Evaluación Trimestral", isHoliday: false };
    case "evaluacion_final":
      return { bgColor: "#0080ff", textColor: "#ffffff", label: "Sesión de Evaluación Final", isHoliday: false };
    case "evaluacion_extraordinaria":
      return { bgColor: "#0080ff", textColor: "#ffffff", label: "Sesión Evaluación Extraordinaria (Segunda Final)", isHoliday: false };
    case "inicio_fin_curso":
      return { bgColor: "#ff00ff", textColor: "#ffffff", label: "Hito Inicio / Fin de Régimen de Clases", isHoliday: false };
    case "periodo_dual_empresa":
      return { bgColor: "#fff2b2", textColor: "#713f12", label: "Periodo Dual / Formación en Empresa", isHoliday: false };
    case "periodo_recuperacion":
      return { bgColor: "#f8cb9c", textColor: "#7c2d12", label: "Periodo de Recuperación", isHoliday: false };
    default:
      return { bgColor: "transparent", textColor: "#0f172a", label: "Día lectivo ordinario", isHoliday: false };
  }
}

// Academic Months in order: Sep, Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun
export function getAcademicMonthsList(academicYear: string): Array<{ year: number; month: number; monthName: string }> {
  const parts = academicYear.split("-");
  const startYear = parseInt(parts[0], 10) || 2026;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  return [
    { year: startYear, month: 8, monthName: "SEPTIEMBRE " + startYear },
    { year: startYear, month: 9, monthName: "OCTUBRE " + startYear },
    { year: startYear, month: 10, monthName: "NOVIEMBRE " + startYear },
    { year: startYear, month: 11, monthName: "DICIEMBRE " + startYear },
    { year: endYear, month: 0, monthName: "ENERO " + endYear },
    { year: endYear, month: 1, monthName: "FEBRERO " + endYear },
    { year: endYear, month: 2, monthName: "MARZO " + endYear },
    { year: endYear, month: 3, monthName: "ABRIL " + endYear },
    { year: endYear, month: 4, monthName: "MAYO " + endYear },
    { year: endYear, month: 5, monthName: "JUNIO " + endYear },
  ];
}

export interface MonthTrimesterInfo {
  trimesterId: "1T" | "2T" | "3T" | "2T_3T" | "3T_RECUP" | "1T_2T";
  trimesterNumber: number | string;
  name: string; // e.g. "1er Trimestre", "2º Trimestre", "Compartido (2ºT / 3erT)", "3er Trimestre y Recuperación"
  shortBadge: string; // "1T", "2T", "2T / 3T", "3T", "3T · Recup."
  isShared: boolean;
  sharedExplanation?: string;
  headerBgClass: string;
  headerStyleBg: string;
  headerBorderColor: string;
  badgeStyleBg: string;
  badgeStyleText: string;
  tagColor: string;
}

// Determines the trimester info, shared trimester indicator, and distinct colors for each month
export function getMonthTrimesterInfo(
  year: number,
  month: number, // 0=Jan, 8=Sep, 11=Dec
  calendar?: SigreAcademicCalendar
): MonthTrimesterInfo {
  // Septiembre (8), Octubre (9), Noviembre (10), Diciembre (11) -> 1er Trimestre (Oficial Verde Junta #007A33)
  if (month === 8 || month === 9 || month === 10 || month === 11) {
    const isDec = month === 11;
    return {
      trimesterId: "1T",
      trimesterNumber: 1,
      name: isDec ? "1er Trimestre (Evaluación 1T)" : "1er Trimestre",
      shortBadge: "1T",
      isShared: false,
      headerBgClass: "bg-[#007A33] border-[#005a26]",
      headerStyleBg: "#007A33",
      headerBorderColor: "#005a26",
      badgeStyleBg: "rgba(255, 255, 255, 0.22)",
      badgeStyleText: "#ffffff",
      tagColor: "#10b981",
    };
  }

  // Enero (0), Febrero (1) -> 2º Trimestre (Azul Zafiro / Índigo #1e40af)
  if (month === 0 || month === 1) {
    return {
      trimesterId: "2T",
      trimesterNumber: 2,
      name: "2º Trimestre",
      shortBadge: "2T",
      isShared: false,
      headerBgClass: "bg-[#1e40af] border-[#1e3a8a]",
      headerStyleBg: "#1e40af",
      headerBorderColor: "#1e3a8a",
      badgeStyleBg: "rgba(255, 255, 255, 0.22)",
      badgeStyleText: "#ffffff",
      tagColor: "#3b82f6",
    };
  }

  // Marzo (2) -> Compartido 2ºT y 3er Trimestre (Verde Azulado / Teal Oscuro #0f766e)
  if (month === 2) {
    return {
      trimesterId: "2T_3T",
      trimesterNumber: "2 / 3",
      name: "Compartido (2ºT / 3erT)",
      shortBadge: "2T / 3T",
      isShared: true,
      sharedExplanation: "Marzo comparte 2º Trimestre (hasta Sesión de Evaluación 2T) y el inicio del 3er Trimestre tras evaluación/Semana Santa.",
      headerBgClass: "bg-[#0f766e] border-[#115e59]",
      headerStyleBg: "#0f766e",
      headerBorderColor: "#115e59",
      badgeStyleBg: "#fbbf24",
      badgeStyleText: "#0f172a",
      tagColor: "#14b8a6",
    };
  }

  // Abril (3), Mayo (4) -> 3er Trimestre (Púrpura Imperial #7e22ce)
  if (month === 3 || month === 4) {
    const isMay = month === 4;
    return {
      trimesterId: "3T",
      trimesterNumber: 3,
      name: isMay ? "3er Trimestre (1ª Eval. Final Ordinaria)" : "3er Trimestre",
      shortBadge: "3T",
      isShared: false,
      headerBgClass: "bg-[#7e22ce] border-[#6b21a8]",
      headerStyleBg: "#7e22ce",
      headerBorderColor: "#6b21a8",
      badgeStyleBg: "rgba(255, 255, 255, 0.22)",
      badgeStyleText: "#ffffff",
      tagColor: "#a855f7",
    };
  }

  // Junio (5) -> 3er Trimestre Compartido con Periodo de Recuperación (Sem. 1-3) y 2ª Evaluación Final Extraordinaria (#c2410c)
  if (month === 5) {
    return {
      trimesterId: "3T_RECUP",
      trimesterNumber: "3T + Recup.",
      name: "3erT · Recuperación & Extraordinaria",
      shortBadge: "3T + Recup.",
      isShared: true,
      sharedExplanation: "Junio comparte 3er Trimestre, Periodo de Recuperación (Semanas 1-3) y 2ª Evaluación Final Extraordinaria (Semana 4).",
      headerBgClass: "bg-[#c2410c] border-[#9a3412]",
      headerStyleBg: "#c2410c",
      headerBorderColor: "#9a3412",
      badgeStyleBg: "#fbbf24",
      badgeStyleText: "#0f172a",
      tagColor: "#f97316",
    };
  }

  // Fallback
  return {
    trimesterId: "1T",
    trimesterNumber: 1,
    name: "1er Trimestre",
    shortBadge: "1T",
    isShared: false,
    headerBgClass: "bg-[#007A33] border-[#005a26]",
    headerStyleBg: "#007A33",
    headerBorderColor: "#005a26",
    badgeStyleBg: "rgba(255, 255, 255, 0.22)",
    badgeStyleText: "#ffffff",
    tagColor: "#10b981",
  };
}

export interface MonthLateralTag {
  id: string;
  code: string;
  title: string;
  color: string;
  textColor?: string;
  type?: SigreCalendarLegendItem["type"];
  side: "left" | "right";
  dateStr?: string;
  dayNumber?: number;
  dayRangeText?: string;
  isAutoGenerated?: boolean;
}

// Dynamically derive and extract left & right lateral tags for a month from dayOverrides and legend items
export function deriveMonthLateralLegends(
  year: number,
  month: number, // 0-11
  calendar: SigreAcademicCalendar
): { leftLegends: MonthLateralTag[]; rightLegends: MonthLateralTag[] } {
  const monthNum = month + 1; // 1-12
  const monthStr = String(monthNum).padStart(2, "0");
  const monthShort = MONTH_NAMES_SHORT_ES[month] || "MES";
  const monthShortCap = monthShort.charAt(0).toUpperCase() + monthShort.slice(1).toLowerCase();

  interface RawMonthTag extends MonthLateralTag {
    days: number[];
    minDay: number;
    maxDay: number;
    centroidDay: number;
    dominantWeekDay: number;
    avgCol: number;
    spatialAffinity: number;
  }

  const rawTags: RawMonthTag[] = [];

  // Helper to determine day column in Spanish grid (0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun)
  const getDayColIndex = (y: number, m: number, dayNum: number) => {
    const dDate = new Date(y, m, dayNum);
    const dOfWeek = dDate.getDay(); // 0 is Sun
    return dOfWeek === 0 ? 6 : dOfWeek - 1;
  };

  // Helper to compute dominant week day for multi-day events
  const computeDominantWeekDay = (daysList: number[], fallbackDay: number): number => {
    if (!daysList || daysList.length === 0) return fallbackDay;
    if (daysList.length === 1) return daysList[0];

    const weekBuckets = new Map<number, number[]>();
    daysList.forEach((d) => {
      const wIdx = Math.floor((d - 1) / 7);
      if (!weekBuckets.has(wIdx)) weekBuckets.set(wIdx, []);
      weekBuckets.get(wIdx)!.push(d);
    });

    let maxCount = -1;
    let peakDays: number[] = [];
    weekBuckets.forEach((wDays) => {
      if (wDays.length > maxCount) {
        maxCount = wDays.length;
        peakDays = wDays;
      }
    });

    return peakDays.length > 0 ? peakDays[Math.floor(peakDays.length / 2)] : fallbackDay;
  };

  // Lookup map for existing legend items
  const legendLookup = new Map<string, SigreCalendarLegendItem>();
  (calendar.legendItems || []).forEach((l) => {
    legendLookup.set(l.id, l);
    if (l.udId) legendLookup.set(l.udId, l);
    if (l.code) legendLookup.set(l.code, l);
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const udAssignedDaysInMonth = new Map<
    string,
    { days: number[]; colors?: { bg: string; text?: string }; title?: string; code?: string }
  >();
  const multiDayPeriodsInMonth = new Map<
    string,
    { type: string; days: number[]; colors?: { bg: string; text?: string }; title?: string; code?: string }
  >();

  // 1. Scan all days in this month to extract active events, milestone overrides, and assigned UDs/RAs
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${monthStr}-${String(d).padStart(2, "0")}`;
    const dayDate = new Date(year, month, d);
    const dayOfWeek = dayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const override = calendar.dayOverrides?.[dateStr];
    const specialEvent = (calendar.specialEvents || []).find((e) => e.date === dateStr);
    const colIndex = getDayColIndex(year, month, d);

    const effectiveType = override?.type || specialEvent?.type;
    const isMultiDayPeriodType =
      effectiveType === "periodo_recuperacion" ||
      effectiveType === "periodo_dual_empresa" ||
      effectiveType === "vacaciones_navidad" ||
      effectiveType === "vacaciones_semana_santa" ||
      effectiveType === "semana_blanca";

    // Determine UD assignment key strictly (never on weekends)
    let assignedUdKey: string | undefined = undefined;
    if (!isWeekend) {
      if (override?.assignedUdId) {
        assignedUdKey = override.assignedUdId;
      } else if (override?.assignedUdCode) {
        assignedUdKey = override.assignedUdCode;
      } else if (override?.legendItemId) {
        const leg = legendLookup.get(override.legendItemId);
        if (leg?.type === "ud_ra") {
          assignedUdKey = leg.id;
        }
      } else if (override?.title && /^(TEMINS|MOD|UD\d+|RA\d+|UT\d+)/i.test(override.title.trim())) {
        assignedUdKey = override.title.split(" ")[0];
      }
    }

    const isUdAssignment = Boolean(assignedUdKey) && !isWeekend;

    // Multi-day Period Aggregation (Recuperación, Dual, Vacaciones)
    if (isMultiDayPeriodType) {
      const pKey = effectiveType!;
      const style = getOfficialEventStyle(pKey as any);
      let pCode = "Periodo";
      if (pKey === "periodo_recuperacion") pCode = "Recuperación";
      else if (pKey === "periodo_dual_empresa") pCode = "FP Dual";
      else if (pKey === "vacaciones_navidad") pCode = "Navidad";
      else if (pKey === "vacaciones_semana_santa") pCode = "S. Santa";
      else if (pKey === "semana_blanca") pCode = "S. Blanca";

      if (!multiDayPeriodsInMonth.has(pKey)) {
        multiDayPeriodsInMonth.set(pKey, {
          type: pKey,
          days: [],
          colors: {
            bg: override?.customColor || specialEvent?.color || style.bgColor,
            text: override?.customTextColor || style.textColor,
          },
          title: override?.title || specialEvent?.title || style.label,
          code: pCode,
        });
      }
      multiDayPeriodsInMonth.get(pKey)!.days.push(d);
    }
    // UD / RA Days Aggregation
    else if (isUdAssignment && assignedUdKey) {
      const matchedLeg = legendLookup.get(assignedUdKey);
      const uKey = matchedLeg?.id || assignedUdKey;
      if (!udAssignedDaysInMonth.has(uKey)) {
        udAssignedDaysInMonth.set(uKey, {
          days: [],
          colors: override?.customColor
            ? { bg: override.customColor, text: override.customTextColor }
            : matchedLeg
            ? { bg: matchedLeg.color, text: matchedLeg.textColor }
            : undefined,
          title: override?.title || matchedLeg?.title,
          code: override?.assignedUdCode || matchedLeg?.code || (override?.title ? override.title.split(" ")[0] : undefined),
        });
      }
      udAssignedDaysInMonth.get(uKey)!.days.push(d);
    }
    // Single-day Events, Holidays, Evaluations, Milestones
    else if (override || specialEvent) {
      const isSpecial = isSpecialEventType(effectiveType);
      const hasCustomTitle = Boolean(override?.title || specialEvent?.title);
      const isNotOrdinaryLectivo = effectiveType !== "lectivo" && effectiveType !== "no_lectivo";

      if (
        isSpecial ||
        (hasCustomTitle && isNotOrdinaryLectivo) ||
        effectiveType === "inicio_fin_curso" ||
        effectiveType === "evaluacion_inicial" ||
        effectiveType === "evaluacion_trimestral" ||
        effectiveType === "evaluacion_final" ||
        effectiveType === "evaluacion_extraordinaria"
      ) {
        const style = getOfficialEventStyle(effectiveType);
        const dayCode = `${d} ${monthShortCap}`;
        const color = override?.customColor || specialEvent?.color || style.bgColor;
        const textColor = override?.customTextColor || style.textColor;
        const title = override?.title || specialEvent?.title || style.label;

        const dayTagId = `day_${dateStr}`;
        const alreadyCovered = rawTags.some(
          (l) =>
            l.id === dayTagId ||
            l.code === dayCode ||
            (l.title === title && (l.dateStr === dateStr || l.code.startsWith(String(d))))
        );

        if (!alreadyCovered && title) {
          const matchedLegend = override?.legendItemId ? legendLookup.get(override.legendItemId) : undefined;
          const explicitSide = matchedLegend?.sidePosition;

          // Compute spatial affinity
          const colOffset = colIndex - 3.0; // -3 to +3
          const timelineBias = ((d / daysInMonth) - 0.5) * 0.4;
          const institutionalBias =
            effectiveType === "inicio_fin_curso" || effectiveType === "evaluacion_inicial" ? -1.8 : 0;
          const explicitWeight = explicitSide === "left" ? -50 : explicitSide === "right" ? 50 : 0;

          const affinity = explicitWeight + colOffset + timelineBias + institutionalBias;

          rawTags.push({
            id: dayTagId,
            code: dayCode,
            title: title,
            color: color,
            textColor: textColor,
            type: effectiveType as any,
            side: affinity <= 0 ? "left" : "right",
            dateStr: dateStr,
            dayNumber: d,
            days: [d],
            minDay: d,
            maxDay: d,
            centroidDay: d,
            dominantWeekDay: d,
            avgCol: colIndex,
            spatialAffinity: affinity,
            isAutoGenerated: true,
          });
        }
      }
    }
  }

  // 2. Populate Consolidated Lateral Tags from all active UDs / RAs in this month (EXACTLY ONE PER UD)
  udAssignedDaysInMonth.forEach((data, key) => {
    const matchedLeg =
      legendLookup.get(key) ||
      Array.from(legendLookup.values()).find((l) => l.code === key || l.title === data.title || l.udId === key);

    const minDay = Math.min(...data.days);
    const maxDay = Math.max(...data.days);
    const centroidDay = data.days.reduce((acc, curr) => acc + curr, 0) / Math.max(1, data.days.length);
    const dominantWeekDay = computeDominantWeekDay(data.days, minDay);

    const rangeText =
      minDay === maxDay
        ? `${minDay} ${monthShortCap}`
        : `${String(minDay).padStart(2, "0")}-${String(maxDay).padStart(2, "0")} ${monthShortCap}`;

    const avgCol =
      data.days.reduce((acc, curr) => acc + getDayColIndex(year, month, curr), 0) /
      Math.max(1, data.days.length);

    const explicitSide = matchedLeg?.sidePosition;
    const colOffset = avgCol - 3.0; // -3 to +3
    const timelineBias = ((centroidDay / daysInMonth) - 0.5) * 0.8;
    const explicitWeight = explicitSide === "left" ? -50 : explicitSide === "right" ? 50 : 0;
    const affinity = explicitWeight + colOffset + timelineBias;

    if (matchedLeg) {
      const alreadyPresent = rawTags.some((t) => t.id === matchedLeg.id || t.code === matchedLeg.code);
      if (!alreadyPresent) {
        rawTags.push({
          id: matchedLeg.id,
          code: matchedLeg.code,
          title: matchedLeg.title,
          color: matchedLeg.color,
          textColor: matchedLeg.textColor,
          type: "ud_ra",
          side: affinity <= 0 ? "left" : "right",
          dayRangeText: rangeText,
          dayNumber: minDay,
          days: data.days,
          minDay,
          maxDay,
          centroidDay,
          dominantWeekDay,
          avgCol,
          spatialAffinity: affinity,
          isAutoGenerated: true,
        });
      }
    } else {
      const autoId = `auto_ud_${key.replace(/[^a-z0-9]/gi, "_")}`;
      const alreadyPresent = rawTags.some((t) => t.id === autoId || t.title === data.title);
      if (!alreadyPresent) {
        const titleText = data.title || key;
        let codeText = data.code;
        if (!codeText) {
          if (titleText.startsWith("TEMINS") || titleText.startsWith("UD") || titleText.startsWith("RA")) {
            const firstParts = titleText.split("(")[0].trim();
            codeText = firstParts.length <= 15 ? firstParts : titleText.split(" ")[0];
          } else {
            codeText = key.startsWith("leg_") ? key.replace("leg_", "").toUpperCase() : key.toUpperCase();
          }
        }

        rawTags.push({
          id: autoId,
          code: codeText.length > 16 ? codeText.substring(0, 14) + "..." : codeText,
          title: titleText,
          color: data.colors?.bg || "#fed7aa",
          textColor: data.colors?.text || "#9a3412",
          type: "ud_ra",
          side: affinity <= 0 ? "left" : "right",
          dayRangeText: rangeText,
          dayNumber: minDay,
          days: data.days,
          minDay,
          maxDay,
          centroidDay,
          dominantWeekDay,
          avgCol,
          spatialAffinity: affinity,
          isAutoGenerated: true,
        });
      }
    }
  });

  // 3. Populate Consolidated Multi-Day Periods in this month (EXACTLY ONE PER PERIOD)
  multiDayPeriodsInMonth.forEach((data, pKey) => {
    const minDay = Math.min(...data.days);
    const maxDay = Math.max(...data.days);
    const centroidDay = data.days.reduce((acc, curr) => acc + curr, 0) / Math.max(1, data.days.length);
    const dominantWeekDay = computeDominantWeekDay(data.days, minDay);

    const rangeText =
      minDay === maxDay
        ? `${minDay} ${monthShortCap}`
        : `${String(minDay).padStart(2, "0")}-${String(maxDay).padStart(2, "0")} ${monthShortCap}`;

    const avgCol =
      data.days.reduce((acc, curr) => acc + getDayColIndex(year, month, curr), 0) /
      Math.max(1, data.days.length);

    const autoPeriodId = `auto_period_${pKey}`;
    const alreadyPresent = rawTags.some((t) => t.id === autoPeriodId || t.type === (pKey as any));
    if (!alreadyPresent) {
      const colOffset = avgCol - 3.0;
      const timelineBias = ((centroidDay / daysInMonth) - 0.5) * 0.8;
      const affinity = colOffset + timelineBias;

      rawTags.push({
        id: autoPeriodId,
        code: data.code || "Periodo",
        title: data.title || "Periodo Lectivo / Especial",
        color: data.colors?.bg || "#fed7aa",
        textColor: data.colors?.text || "#9a3412",
        type: (pKey === "periodo_recuperacion" ? "recuperacion" : pKey === "periodo_dual_empresa" ? "dual" : "hito") as any,
        side: affinity <= 0 ? "left" : "right",
        dayRangeText: rangeText,
        dayNumber: minDay,
        days: data.days,
        minDay,
        maxDay,
        centroidDay,
        dominantWeekDay,
        avgCol,
        spatialAffinity: affinity,
        isAutoGenerated: true,
      });
    }
  });

  // 4. Include explicit general month notes / milestones (non-UD, non-day-bound) if configured specifically for this month
  (calendar.legendItems || []).forEach((leg) => {
    if (
      leg.monthTarget === monthNum &&
      (leg.type === "hito" || leg.type === "otro") &&
      !rawTags.some((t) => t.id === leg.id || t.title === leg.title)
    ) {
      const matchDay = leg.code.match(/^(\d{1,2})/);
      const parsedDay = matchDay ? parseInt(matchDay[1], 10) : undefined;
      const colIndex = parsedDay ? getDayColIndex(year, month, parsedDay) : 3;
      const colOffset = colIndex - 3.0;
      const explicitWeight = leg.sidePosition === "left" ? -50 : leg.sidePosition === "right" ? 50 : 0;
      const affinity = explicitWeight + colOffset;

      rawTags.push({
        id: leg.id,
        code: leg.code,
        title: leg.title,
        color: leg.color,
        textColor: leg.textColor,
        type: leg.type,
        side: affinity <= 0 ? "left" : "right",
        dayRangeText: leg.dayRangeText,
        dayNumber: parsedDay,
        days: parsedDay ? [parsedDay] : [],
        minDay: parsedDay || 15,
        maxDay: parsedDay || 15,
        centroidDay: parsedDay || 15,
        dominantWeekDay: parsedDay || 15,
        avgCol: colIndex,
        spatialAffinity: affinity,
      });
    }
  });

  // Distribution Algorithm implementing User Criteria:
  // 1. Equilibrado entre número de etiquetas en un lado y otro (Diferencia máx de 1 entre ambos lados).
  // 2. Cercanía espacial entre los días asignados y la ubicación de la etiqueta (Lunes-Miércoles -> Izquierda, Jueves-Domingo -> Derecha).
  // 3. Orden interno: ordenado por el núcleo central de días / semana con más días asociados a la etiqueta.

  const N = rawTags.length;
  let leftTags: MonthLateralTag[] = [];
  let rightTags: MonthLateralTag[] = [];

  if (N === 0) {
    return { leftLegends: [], rightLegends: [] };
  } else if (N === 1) {
    const single = rawTags[0];
    if (single.spatialAffinity <= 0) {
      leftTags = [{ ...single, side: "left" }];
    } else {
      rightTags = [{ ...single, side: "right" }];
    }
  } else {
    // Sort all tags by spatial affinity ascending (most-left-biased first, most-right-biased last)
    // If affinities are tied, tie-break by dominant week day
    rawTags.sort((a, b) => {
      if (Math.abs(a.spatialAffinity - b.spatialAffinity) > 0.001) {
        return a.spatialAffinity - b.spatialAffinity;
      }
      return a.dominantWeekDay - b.dominantWeekDay;
    });

    // Calculate balanced target counts
    let targetLeft = Math.floor(N / 2);
    const targetRight = N - targetLeft;

    // For odd total counts, check if median tag leans left
    if (N % 2 !== 0) {
      const medianTag = rawTags[Math.floor(N / 2)];
      if (medianTag.spatialAffinity <= 0) {
        targetLeft = Math.ceil(N / 2);
      }
    }

    const leftPartition = rawTags.slice(0, targetLeft);
    const rightPartition = rawTags.slice(targetLeft);

    leftTags = leftPartition.map((t) => ({ ...t, side: "left" }));
    rightTags = rightPartition.map((t) => ({ ...t, side: "right" }));
  }

  // Helper comparator to sort tags chronologically by their peak/dominant week and day
  const compareByDominantWeek = (a: MonthLateralTag, b: MonthLateralTag) => {
    const rawA = rawTags.find((r) => r.id === a.id);
    const rawB = rawTags.find((r) => r.id === b.id);

    const dayA = rawA?.dominantWeekDay ?? rawA?.minDay ?? a.dayNumber ?? 99;
    const dayB = rawB?.dominantWeekDay ?? rawB?.minDay ?? b.dayNumber ?? 99;

    if (dayA !== dayB) return dayA - dayB;

    const centroidA = rawA?.centroidDay ?? dayA;
    const centroidB = rawB?.centroidDay ?? dayB;
    if (centroidA !== centroidB) return centroidA - centroidB;

    return a.title.localeCompare(b.title);
  };

  // Sort both Left and Right groups internally in strict chronological progression (top to bottom)
  leftTags.sort(compareByDominantWeek);
  rightTags.sort(compareByDominantWeek);

  // Guarantee strictly unique ids for all left & right tags to prevent React key collisions
  const seenLeftIds = new Set<string>();
  const uniqueLeftLegends: MonthLateralTag[] = [];
  leftTags.forEach((tag, idx) => {
    let tagId = tag.id || `left_tag_${idx}`;
    if (seenLeftIds.has(tagId)) {
      tagId = `${tagId}_left_${idx}`;
    }
    seenLeftIds.add(tagId);
    uniqueLeftLegends.push({ ...tag, id: tagId });
  });

  const seenRightIds = new Set<string>();
  const uniqueRightLegends: MonthLateralTag[] = [];
  rightTags.forEach((tag, idx) => {
    let tagId = tag.id || `right_tag_${idx}`;
    if (seenRightIds.has(tagId)) {
      tagId = `${tagId}_right_${idx}`;
    }
    seenRightIds.add(tagId);
    uniqueRightLegends.push({ ...tag, id: tagId });
  });

  return { leftLegends: uniqueLeftLegends, rightLegends: uniqueRightLegends };
}

// Generate the 6x7 grid for a month (Monday to Sunday) with visual prevalence for special events
export function generateMonthGrid(
  year: number,
  month: number,
  calendar: SigreAcademicCalendar
): CalendarMonthData {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week of 1st day: 0=Sun, 1=Mon... In ES Monday is 1, Sunday is 7 (or 0)
  let firstDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 0=Mon, 6=Sun

  const legendMap = new Map<string, SigreCalendarLegendItem>();
  (calendar.legendItems || []).forEach((item) => {
    legendMap.set(item.id, item);
  });

  const days: CalendarMonthData["days"] = [];

  const processDay = (
    dayNum: number,
    m: number,
    y: number,
    isCurrentMonth: boolean
  ) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayDate = new Date(y, m, dayNum);
    const dayOfWeek = dayDate.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const override = calendar.dayOverrides[dateStr];
    const legendItem = override?.legendItemId ? legendMap.get(override.legendItemId) : undefined;
    const specialEvent = (calendar.specialEvents || []).find((e) => e.date === dateStr);

    // Weekends (Saturdays and Sundays) are strictly non-lectivo (or special holiday if defined)
    let effectiveType: SigreCalendarDayType = "lectivo";
    if (isWeekend) {
      if (override?.type && isSpecialEventType(override.type)) {
        effectiveType = override.type;
      } else if (specialEvent?.type && isSpecialEventType(specialEvent.type)) {
        effectiveType = specialEvent.type;
      } else {
        effectiveType = "no_lectivo";
      }
    } else {
      effectiveType = override?.type || specialEvent?.type || "lectivo";
    }

    const isSpecial = isSpecialEventType(effectiveType);

    let displayBgColor = "transparent";
    let displayTextColor = isCurrentMonth ? (isWeekend ? "#ef4444" : "#cbd5e1") : "#475569";
    let hasSpecialPrevalence = false;
    let assignedUdColor: string | undefined = undefined;

    // Determine assigned UD color if present (STRICTLY FORBIDDEN on weekends)
    if (!isWeekend) {
      if (override?.assignedUdId) {
        const assignedLeg = legendMap.get(override.assignedUdId);
        if (assignedLeg) assignedUdColor = assignedLeg.color;
      } else if (legendItem && (legendItem.type === "ud_ra" || legendItem.type === "dual" || legendItem.type === "recuperacion")) {
        assignedUdColor = legendItem.color;
      }
    }

    if (isCurrentMonth) {
      if (isSpecial) {
        // Special events PREVAIL visually (holidays, festive days)
        const style = getOfficialEventStyle(effectiveType);
        displayBgColor = override?.customColor || specialEvent?.color || style.bgColor;
        displayTextColor = override?.customTextColor || style.textColor || getOptimalTextColorForBg(displayBgColor);
        hasSpecialPrevalence = true;
      } else if (!isWeekend && override?.customColor && override.customColor !== "transparent") {
        displayBgColor = override.customColor;
        displayTextColor = override.customTextColor || getOptimalTextColorForBg(displayBgColor);
      } else if (!isWeekend && legendItem && legendItem.color && legendItem.color !== "transparent") {
        displayBgColor = legendItem.color;
        displayTextColor = legendItem.textColor || getOptimalTextColorForBg(displayBgColor);
      } else {
        displayBgColor = "transparent";
        displayTextColor = isWeekend ? "#ef4444" : "#cbd5e1";
      }
    }

    return {
      dayNumber: dayNum,
      dateString: dateStr,
      dayOfWeek,
      isCurrentMonth,
      isWeekend,
      override: isWeekend && override?.type === "lectivo" ? undefined : override,
      legendItem: isWeekend && legendItem?.type === "ud_ra" ? undefined : legendItem,
      isSpecialEvent: isSpecial,
      specialEventType: effectiveType,
      specialEventLabel: override?.title || specialEvent?.title || (isSpecial ? getOfficialEventStyle(effectiveType).label : undefined),
      assignedUdId: isWeekend ? undefined : override?.assignedUdId,
      assignedUdCode: isWeekend ? undefined : override?.assignedUdCode,
      assignedUdColor: isWeekend ? undefined : assignedUdColor,
      displayBgColor,
      displayTextColor,
      hasSpecialPrevalence,
    };
  };

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    days.push(processDay(prevDayNum, prevMonth, prevYear, false));
  }

  // Current month days
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    days.push(processDay(dayNum, month, year, true));
  }

  // Next month padding days to complete 35 or 42 cells (multiple of 7)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    days.push(processDay(i, nextMonth, nextYear, false));
  }

  return {
    year,
    month,
    monthName: `${MONTH_NAMES_ES[month].toUpperCase()} ${year}`,
    shortName: MONTH_NAMES_SHORT_ES[month],
    days,
  };
}

// Helper to safely parse "YYYY-MM-DD" in local timezone without UTC shifting
export function parseDateSafe(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-").map((p) => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}

// Check if a day is school day (lectivo)
export function isDayLectivo(dateStr: string, calendar: SigreAcademicCalendar): boolean {
  const d = parseDateSafe(dateStr);
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Weekend

  if (dateStr < calendar.startDate || dateStr > calendar.endDate) return false;

  const overrides = calendar.dayOverrides || {};
  const override = overrides[dateStr];
  if (override && isSpecialEventType(override.type)) {
    const style = getOfficialEventStyle(override.type);
    if (style.isHoliday) return false;
  }

  return true;
}

// Calculate total school days and stats
export function calculateAcademicCalendarStats(calendar?: SigreAcademicCalendar | null) {
  if (!calendar) {
    return {
      totalSchoolDays: 0,
      totalHolidays: 0,
      totalVacationDays: 0,
      totalDualDays: 0,
      totalEvalDays: 0,
      totalRecuperacionDays: 0,
      minimumRequiredFp: 175,
      minimumRequiredPrimaria: 178,
    };
  }
  const months = getAcademicMonthsList(calendar.academicYear);
  let totalSchoolDays = 0;
  let totalHolidays = 0;
  let totalVacationDays = 0;
  let totalDualDays = 0;
  let totalEvalDays = 0;
  let totalRecuperacionDays = 0;

  months.forEach(({ year, month }) => {
    const monthData = generateMonthGrid(year, month, calendar);
    monthData.days
      .filter((d) => d.isCurrentMonth && !d.isWeekend)
      .forEach((d) => {
        const type = d.override?.type;
        if (
          type === "festivo_nacional" ||
          type === "festivo_autonomico" ||
          type === "festivo_local"
        ) {
          totalHolidays++;
        } else if (
          type === "vacaciones_navidad" ||
          type === "vacaciones_semana_santa" ||
          type === "semana_blanca" ||
          type === "dia_comunidad_educativa" ||
          type === "no_lectivo"
        ) {
          totalVacationDays++;
        } else if (type === "periodo_dual_empresa") {
          totalDualDays++;
          totalSchoolDays++;
        } else if (
          type === "evaluacion_inicial" ||
          type === "evaluacion_trimestral" ||
          type === "evaluacion_final" ||
          type === "evaluacion_extraordinaria"
        ) {
          totalEvalDays++;
          totalSchoolDays++;
        } else if (type === "periodo_recuperacion") {
          totalRecuperacionDays++;
          totalSchoolDays++;
        } else {
          totalSchoolDays++;
        }
      });
  });

  return {
    totalSchoolDays,
    totalHolidays,
    totalVacationDays,
    totalDualDays,
    totalEvalDays,
    totalRecuperacionDays,
    minimumRequiredFp: 175,
    minimumRequiredPrimaria: 178,
  };
}

// Assign a date range to a legend item (UD / RA / Dual / Recuperación), preserving special events if enabled
export function assignRangeToCalendar(
  calendar: SigreAcademicCalendar,
  startDate: string,
  endDate: string,
  legendItem: SigreCalendarLegendItem,
  preserveSpecialEvents: boolean = true
): { updatedCalendar: SigreAcademicCalendar; countAssigned: number; countPreserved: number } {
  const newOverrides = { ...(calendar.dayOverrides || {}) };
  const start = parseDateSafe(startDate);
  const end = parseDateSafe(endDate);

  let countAssigned = 0;
  let countPreserved = 0;

  for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;

    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const existing = newOverrides[dateStr];
    const isSpecial = existing && isSpecialEventType(existing.type);

    if (isSpecial && preserveSpecialEvents) {
      // PREVALENCE OF SPECIAL EVENT: keep type & colors, attach assigned UD
      newOverrides[dateStr] = {
        ...existing,
        assignedUdId: legendItem.id,
        assignedUdCode: legendItem.code,
        notes: existing.notes ? `${existing.notes} | UD: ${legendItem.code}` : `UD programada: ${legendItem.code}`,
      };
      countPreserved++;
    } else {
      // Regular school day assignment
      newOverrides[dateStr] = {
        date: dateStr,
        type:
          legendItem.type === "dual"
            ? "periodo_dual_empresa"
            : legendItem.type === "recuperacion"
            ? "periodo_recuperacion"
            : "lectivo",
        legendItemId: legendItem.id,
        customColor: legendItem.color,
        customTextColor: legendItem.textColor,
        title: legendItem.title,
      };
      countAssigned++;
    }
  }

  return {
    updatedCalendar: {
      ...calendar,
      dayOverrides: newOverrides,
    },
    countAssigned,
    countPreserved,
  };
}

// Academic Trimesters and Assessment Milestones Structure
export interface SigreAcademicTrimesterItem {
  id: "1T" | "2T" | "3T";
  name: string;
  shortName: string;
  periodText: string;
  startDate: string;
  endDate: string;
  evalSessionDate: string;
  evalSessionLabel: string;
  reportCardDeliveryDate: string;
  reportCardDeliveryLabel: string;
  totalLectivosEstimated?: number;
  juneStructure?: {
    recuperacionStart: string;
    recuperacionEnd: string;
    recuperacionLabel: string;
    evalExtraordinariaDate: string;
    evalExtraordinariaLabel: string;
    finClasesDate: string;
    finClasesLabel: string;
    planificacionNextStart: string;
    planificacionNextEnd: string;
    planificacionNextLabel: string;
  };
}

export function getAcademicTrimestersStructure(academicYear: string): SigreAcademicTrimesterItem[] {
  const parts = academicYear.split("-");
  const startYear = parseInt(parts[0], 10) || 2026;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  return [
    {
      id: "1T",
      name: "1º Trimestre",
      shortName: "1T",
      periodText: `15 Sep ${startYear} - 22 Dic ${startYear}`,
      startDate: `${startYear}-09-15`,
      endDate: `${startYear}-12-22`,
      evalSessionDate: `${startYear}-12-16`,
      evalSessionLabel: "Sesión de Evaluación 1º Trimestre",
      reportCardDeliveryDate: `${startYear}-12-21`,
      reportCardDeliveryLabel: "Entrega de Calificaciones / Boletines 1T",
      totalLectivosEstimated: 68,
    },
    {
      id: "2T",
      name: "2º Trimestre",
      shortName: "2T",
      periodText: `08 Ene ${endYear} - 19 Mar ${endYear}`,
      startDate: `${endYear}-01-08`,
      endDate: `${endYear}-03-19`,
      evalSessionDate: `${endYear}-03-17`,
      evalSessionLabel: "Sesión de Evaluación 2º Trimestre",
      reportCardDeliveryDate: `${endYear}-03-22`,
      reportCardDeliveryLabel: "Entrega de Calificaciones / Boletines 2T",
      totalLectivosEstimated: 52,
    },
    {
      id: "3T",
      name: "3º Trimestre y Periodo de Recuperación",
      shortName: "3T",
      periodText: `29 Mar ${endYear} - 24 Jun ${endYear}`,
      startDate: `${endYear}-03-29`,
      endDate: `${endYear}-06-24`,
      evalSessionDate: `${endYear}-05-28`,
      evalSessionLabel: "1ª Sesión de Evaluación Final Ordinaria",
      reportCardDeliveryDate: `${endYear}-06-01`,
      reportCardDeliveryLabel: "Entrega de Calificaciones Evaluación Ordinaria",
      totalLectivosEstimated: 55,
      juneStructure: {
        recuperacionStart: `${endYear}-06-01`,
        recuperacionEnd: `${endYear}-06-19`,
        recuperacionLabel: "Periodo de Recuperación de Aprendizajes No Adquiridos y Refuerzo (Semanas 1-3)",
        evalExtraordinariaDate: `${endYear}-06-22`,
        evalExtraordinariaLabel: "2ª Sesión de Evaluación Final Extraordinaria",
        finClasesDate: `${endYear}-06-24`,
        finClasesLabel: "Fin de Régimen de Clases y Entrega de Calificaciones Finales",
        planificacionNextStart: `${endYear}-06-25`,
        planificacionNextEnd: `${endYear}-06-30`,
        planificacionNextLabel: "Reclamaciones, Planificación para el Curso Siguiente y Memorias",
      },
    },
  ];
}

// Gaussian Easter Sunday calculation algorithm for Gregorian calendar
export function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// Generate complete, robust official Andalusian holidays, vacations and milestone overrides for any academic year
export function getOfficialAndalusianHolidaysAndVacations(
  academicYear: string
): {
  dayOverrides: Record<string, SigreCalendarDayOverride>;
  legendItems: SigreCalendarLegendItem[];
} {
  const parts = academicYear.split("-");
  const startYear = parseInt(parts[0], 10) || 2025;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  const overrides: Record<string, SigreCalendarDayOverride> = {};
  const legends: SigreCalendarLegendItem[] = [];

  // Helper for adding an override
  const addDay = (
    dateStr: string,
    type: SigreCalendarDayType,
    customColor: string,
    customTextColor: string,
    title: string,
    legendItemId?: string
  ) => {
    overrides[dateStr] = {
      date: dateStr,
      type,
      customColor,
      customTextColor,
      title,
      legendItemId,
    };
  };

  // 1. Septiembre: Inicio de curso escalonado y evaluación inicial
  addDay(`${startYear}-09-03`, "inicio_fin_curso", "#ff00ff", "#ffffff", "Enseñanzas Deportivas y 1º ciclo Ed. Inf.", "leg_ini_3");
  addDay(`${startYear}-09-10`, "inicio_fin_curso", "#ff00ff", "#ffffff", "2º ciclo Ed. Inf., Prim., E.E.", "leg_ini_10");
  addDay(`${startYear}-09-15`, "inicio_fin_curso", "#ff00ff", "#ffffff", "Inicio Régimen Ordinario FP / ESO / Bach.", "leg_ini_15");
  addDay(`${startYear}-09-22`, "evaluacion_inicial", "#99cc33", "#000000", "Evaluación inicial", "leg_ini_20");

  legends.push(
    { id: "leg_ini_3", code: "3", title: "Enseñanzas Deportivas y 1º ciclo Ed. Inf.", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "leg_ini_10", code: "10", title: "2º ciclo Ed. Inf., Prim., E.E.", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "leg_ini_15", code: "15", title: "E.S.O., Bach., F.P.", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "leg_ini_20", code: "20", title: "Evaluación inicial", type: "evaluacion", color: "#99cc33", textColor: "#000", sidePosition: "left", monthTarget: 9 }
  );

  // 2. Octubre: 12 de Octubre (Fiesta Nacional de España)
  const oct12Date = new Date(startYear, 9, 12);
  const oct12Dow = oct12Date.getDay();
  addDay(`${startYear}-10-12`, "festivo_nacional", "#ff0000", "#ffffff", "Fiesta Nacional de España");
  if (oct12Dow === 0) {
    addDay(`${startYear}-10-13`, "festivo_autonomico", "#ff0000", "#ffffff", "Festivo Autonómico (traslado 12 de Octubre)");
  }

  // 3. Noviembre: 1 de Noviembre (Todos los Santos)
  const nov1Date = new Date(startYear, 10, 1);
  const nov1Dow = nov1Date.getDay();
  addDay(`${startYear}-11-01`, "festivo_nacional", "#ff0000", "#ffffff", "Todos los Santos");
  if (nov1Dow === 0) {
    addDay(`${startYear}-11-02`, "festivo_autonomico", "#ff0000", "#ffffff", "Festivo Autonómico (traslado Todos los Santos)");
  } else if (nov1Dow === 6) {
    addDay(`${startYear}-11-03`, "festivo_autonomico", "#ff0000", "#ffffff", "Festivo Autonómico (por Todos los Santos)");
  }

  // 4. Diciembre: Festivos Nacionales de la Constitución e Inmaculada
  const dec6Date = new Date(startYear, 11, 6);
  const dec6Dow = dec6Date.getDay();
  addDay(`${startYear}-12-06`, "festivo_nacional", "#ff0000", "#ffffff", "Día de la Constitución Española");
  if (dec6Dow === 0) {
    addDay(`${startYear}-12-07`, "festivo_autonomico", "#ff0000", "#ffffff", "Festivo Autonómico (traslado Constitución)");
  }
  addDay(`${startYear}-12-08`, "festivo_nacional", "#ff0000", "#ffffff", "Inmaculada Concepción");

  // Sesión Evaluación 1T y Entrega Notas
  addDay(`${startYear}-12-16`, "evaluacion_trimestral", "#0080ff", "#ffffff", "Sesión de evaluación 1º trimestre", "leg_eval_1");
  addDay(`${startYear}-12-19`, "otro_evento", "#38bdf8", "#0f172a", "Entrega de Calificaciones y Boletines 1º Trimestre", "leg_notas_1");

  legends.push(
    { id: "leg_eval_1", code: "16 Dic", title: "Sesión de evaluación 1º trimestre", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 12 },
    { id: "leg_notas_1", code: "19 Dic", title: "Entrega de Calificaciones 1T", type: "hito", color: "#38bdf8", textColor: "#0f172a", sidePosition: "right", monthTarget: 12 }
  );

  // 5. Vacaciones de Navidad (Diciembre 22 a Enero 6 inclusive)
  const navStart = new Date(startYear, 11, 22);
  const navEnd = new Date(endYear, 0, 6);
  for (let d = new Date(navStart); d <= navEnd; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const y = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, "0");
    const dStr = String(d.getDate()).padStart(2, "0");
    const fullDate = `${y}-${mStr}-${dStr}`;

    if (fullDate === `${startYear}-12-25`) {
      addDay(fullDate, "festivo_nacional", "#ff0000", "#ffffff", "Natividad del Señor (Navidad)");
    } else if (fullDate === `${endYear}-01-01`) {
      addDay(fullDate, "festivo_nacional", "#ff0000", "#ffffff", "Año Nuevo");
    } else if (fullDate === `${endYear}-01-06`) {
      addDay(fullDate, "festivo_nacional", "#ff0000", "#ffffff", "Epifanía del Señor (Reyes)");
    } else if (dow !== 0 && dow !== 6) {
      addDay(fullDate, "vacaciones_navidad", "#00ffff", "#000000", "Vacaciones de Navidad");
    }
  }

  // 6. Febrero: Semana Blanca, Día de la Comunidad Educativa y Día de Andalucía
  const feb28 = new Date(endYear, 1, 28);
  const feb28Dow = feb28.getDay();
  const semBlancaMon = new Date(endYear, 1, 23);
  if (feb28Dow === 5) {
    semBlancaMon.setDate(24);
  } else if (feb28Dow === 6) {
    semBlancaMon.setDate(23);
  } else if (feb28Dow === 0) {
    semBlancaMon.setDate(22);
  }

  for (let i = 0; i < 4; i++) {
    const day = new Date(semBlancaMon);
    day.setDate(day.getDate() + i);
    const y = day.getFullYear();
    const mStr = String(day.getMonth() + 1).padStart(2, "0");
    const dStr = String(day.getDate()).padStart(2, "0");
    addDay(`${y}-${mStr}-${dStr}`, "semana_blanca", "#80cbc4", "#000000", "Semana Blanca");
  }

  const diaComunidad = new Date(semBlancaMon);
  diaComunidad.setDate(diaComunidad.getDate() + 4);
  const diaComY = diaComunidad.getFullYear();
  const diaComM = String(diaComunidad.getMonth() + 1).padStart(2, "0");
  const diaComD = String(diaComunidad.getDate()).padStart(2, "0");
  addDay(`${diaComY}-${diaComM}-${diaComD}`, "dia_comunidad_educativa", "#ffc000", "#000000", "Día de la Comunidad Educativa");

  addDay(`${endYear}-02-28`, "festivo_autonomico", "#99cc33", "#000000", "Día de Andalucía");
  if (feb28Dow === 6) {
    addDay(`${endYear}-03-02`, "festivo_autonomico", "#99cc33", "#000000", "Festivo Autonómico (traslado Día de Andalucía)");
  } else if (feb28Dow === 0) {
    addDay(`${endYear}-03-01`, "festivo_autonomico", "#99cc33", "#000000", "Festivo Autonómico (traslado Día de Andalucía)");
  }

  // 7. Marzo / Abril: Sesión de Evaluación 2º Trimestre y Semana Santa (Gauss calculation)
  addDay(`${endYear}-03-18`, "evaluacion_trimestral", "#0080ff", "#ffffff", "Sesión de evaluación 2º trimestre", "leg_eval_2");
  addDay(`${endYear}-03-20`, "otro_evento", "#38bdf8", "#0f172a", "Entrega de Calificaciones 2º Trimestre", "leg_notas_2");

  legends.push(
    { id: "leg_eval_2", code: "18 Mar", title: "Sesion de evaluación 2 trimestre", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 3 },
    { id: "leg_notas_2", code: "20 Mar", title: "Entrega Calificaciones 2T", type: "hito", color: "#38bdf8", textColor: "#0f172a", sidePosition: "right", monthTarget: 3 }
  );

  const easter = getEasterSunday(endYear);
  const easterDate = new Date(endYear, easter.month - 1, easter.day);
  const lunesSanto = new Date(easterDate);
  lunesSanto.setDate(lunesSanto.getDate() - 6);
  const martesSanto = new Date(easterDate);
  martesSanto.setDate(martesSanto.getDate() - 5);
  const miercolesSanto = new Date(easterDate);
  miercolesSanto.setDate(miercolesSanto.getDate() - 4);
  const juevesSanto = new Date(easterDate);
  juevesSanto.setDate(juevesSanto.getDate() - 3);
  const viernesSanto = new Date(easterDate);
  viernesSanto.setDate(viernesSanto.getDate() - 2);

  const formatD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  addDay(formatD(lunesSanto), "vacaciones_semana_santa", "#ff99ff", "#000000", "Vacaciones de Semana Santa");
  addDay(formatD(martesSanto), "vacaciones_semana_santa", "#ff99ff", "#000000", "Vacaciones de Semana Santa");
  addDay(formatD(miercolesSanto), "vacaciones_semana_santa", "#ff99ff", "#000000", "Vacaciones de Semana Santa");
  addDay(formatD(juevesSanto), "festivo_nacional", "#ff0000", "#ffffff", "Jueves Santo");
  addDay(formatD(viernesSanto), "festivo_nacional", "#ff0000", "#ffffff", "Viernes Santo");

  // 8. Mayo: 1 de Mayo (Fiesta del Trabajo) y Evaluación Final Ordinaria
  addDay(`${endYear}-05-01`, "festivo_nacional", "#ff0000", "#ffffff", "Fiesta del Trabajo");
  addDay(`${endYear}-05-28`, "evaluacion_final", "#0080ff", "#ffffff", "Sesión de evaluación 3º trim. (1ª, final)", "leg_eval_3");
  addDay(`${endYear}-05-29`, "otro_evento", "#38bdf8", "#0f172a", "Entrega de Calificaciones Evaluación Final Ordinaria", "leg_notas_ord");

  legends.push(
    { id: "leg_eval_3", code: "28 May", title: "Sesión de evaluación 3º trim. (1ª, final)", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 5 },
    { id: "leg_notas_ord", code: "29 May", title: "Entrega Calificaciones Ordinarias", type: "hito", color: "#38bdf8", textColor: "#0f172a", sidePosition: "right", monthTarget: 5 }
  );

  // 9. Junio: Periodo de Recuperación (Semanas 1-3: 1 al 19 de Junio), 2ª Evaluación Final Extraordinaria, Fin de curso y Memorias
  const juneRecupStart = new Date(endYear, 5, 1);
  const juneRecupEnd = new Date(endYear, 5, 19);
  for (let d = new Date(juneRecupStart); d <= juneRecupEnd; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = `${endYear}-06-${String(d.getDate()).padStart(2, "0")}`;
    addDay(dateStr, "periodo_recuperacion", "#f8cb9c", "#7c2d12", "Periodo de recup. aprend. No adquiridos", "leg_recup_junio");
  }

  addDay(`${endYear}-06-22`, "evaluacion_extraordinaria", "#0080ff", "#ffffff", "Sesión de evaluación segunda final", "leg_eval_fin2");
  addDay(`${endYear}-06-23`, "inicio_fin_curso", "#ff00ff", "#ffffff", "Último día lectivo en el resto de enseñanzas", "leg_fin23");

  for (let d = 24; d <= 30; d++) {
    const checkD = new Date(endYear, 5, d);
    const dow = checkD.getDay();
    if (dow !== 0 && dow !== 6) {
      addDay(`${endYear}-06-${String(d).padStart(2, "0")}`, "no_lectivo", "#e2e8f0", "#334155", "Planificación para el curso siguiente y memorias");
    }
  }

  legends.push(
    { id: "leg_recup_junio", code: "Recup", title: "Periodo de recup. aprend. No adquiridos", type: "recuperacion", color: "#f8cb9c", textColor: "#7c2d12", sidePosition: "right", monthTarget: 6 },
    { id: "leg_eval_fin2", code: "22 Jun", title: "Sesión de evaluación segunda final", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
    { id: "leg_fin23", code: "23", title: "Último día lectivo en el resto de enseñanzas", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
    { id: "leg_plan_siguiente", code: "24-30 Jun", title: "Planificación curso siguiente y memorias", type: "hito", color: "#cbd5e1", textColor: "#1e293b", sidePosition: "right", monthTarget: 6 }
  );

  return { dayOverrides: overrides, legendItems: legends };
}

export interface FormatUdLegendOptions {
  udNumber?: number;
  id?: string;
  bcCode?: string;
  horasAsignadas?: number;
  totalHoras?: number;
  sesiones?: number;
  title: string;
  moduloCodigo?: string;
}

/**
 * Strips bracketed tags like [UD01], [RA1], [20/160h], [10 sesiones], duplicate UD prefixes,
 * and formats a clean, human-readable UD title.
 * e.g. "UD01. Entornos cloud, gemelos digitales e IoT en instalaciones"
 */
export function cleanSigreUdTitle(rawTitle: string, fallbackNum?: number): string {
  if (!rawTitle) {
    return fallbackNum ? `UD${String(fallbackNum).padStart(2, "0")}. Unidad Didáctica` : "Unidad Didáctica";
  }

  let cleaned = rawTitle.trim();

  // Extract explicit UD number if present (e.g. UD01, UD 1, [UD01], UD.01)
  let udPrefix = "";
  const udMatch = cleaned.match(/^(?:UD|UT)\s*0*(\d+)[:.\s-]*/i) || cleaned.match(/\[(?:UD|UT)\s*0*(\d+)\]/i);
  if (udMatch) {
    udPrefix = `UD${String(udMatch[1]).padStart(2, "0")}`;
  } else if (fallbackNum) {
    udPrefix = `UD${String(fallbackNum).padStart(2, "0")}`;
  }

  // Remove bracketed chunks like [UD01], [RA1], [BC7], [20/160h], [10 sesiones], [14h/7s]
  cleaned = cleaned
    .replace(/\[\s*(?:UD|UT|RA|BC)\s*\d+\s*\]/gi, "")
    .replace(/\[\s*\d+\s*\/\s*\d+\s*h?\s*\]/gi, "")
    .replace(/\[\s*\d+\s*h(?:\/\d+s)?\s*\]/gi, "")
    .replace(/\[\s*\d+\s*sesion(?:es)?\s*\]/gi, "")
    .replace(/\[\s*\]/g, "")
    .replace(/^\d{3,4}\.[\s._-]*(?:BC|RA|UT)?\d*[\s.:_-]*/gi, "")
    .replace(/^[A-Z0-9_-]+\.[\s._-]*(?:BC|RA|UT)\d*[\s.:_-]*/gi, "")
    .replace(/^(?:UD|RA|UT|BC)[\s._-]*\d+[\s.:_-]*/gi, "")
    .replace(/^(?:BC|RA|UT)[\s._-]*\d+[\s.:_-]*/gi, "")
    .replace(/^[:.\s-]+/, "")
    .trim();

  // If there's still a redundant UD prefix at start
  cleaned = cleaned.replace(/^UD\s*0*\d+[:.\s-]+/i, "").trim();

  if (udPrefix && cleaned) {
    return `${udPrefix}. ${cleaned}`;
  }
  return cleaned || (udPrefix ? `${udPrefix}. Unidad Didáctica` : "Unidad Didáctica");
}

/**
 * Standard UD Legend Title Formatter conforming strictly to clean, human-readable SIGRE standard:
 * Title: UD01. Prevención de riesgos laborales y protección ambiental
 * Code: UD01. BC7 (14h • 7 ses.)
 */
export function buildUdLegendTitleAndCode(opts: FormatUdLegendOptions): {
  code: string;
  title: string;
} {
  const udNum = opts.udNumber || 1;
  const udFormatted = `UD${String(udNum).padStart(2, "0")}`;

  // Extract / normalize BC or RA code (e.g. "BC7", "BC1", "RA08")
  let cleanBc = (opts.bcCode || `BC${udNum}`).trim().toUpperCase();
  if (/^\d+$/.test(cleanBc)) {
    cleanBc = `BC${cleanBc}`;
  } else if (!cleanBc.startsWith("BC") && !cleanBc.startsWith("RA") && !cleanBc.startsWith("UT")) {
    cleanBc = `BC${cleanBc}`;
  }

  // Calculate hours & total hours
  const totalHoras = opts.totalHoras && opts.totalHoras > 0 ? opts.totalHoras : 160;
  const horasAsignadas =
    opts.horasAsignadas && opts.horasAsignadas > 0
      ? opts.horasAsignadas
      : Math.max(10, Math.round(totalHoras / (udNum > 10 ? 12 : 8)));

  // Calculate sessions
  const sesiones =
    opts.sesiones && opts.sesiones > 0
      ? opts.sesiones
      : Math.max(1, Math.round(horasAsignadas / 2));

  // Clean raw title to remove any already nested or duplicate prefix tags
  let cleanTitle = (opts.title || `Unidad Didáctica ${udNum}`).trim();
  cleanTitle = cleanTitle
    .replace(/^\[UD\d+\]\s*/gi, "")
    .replace(/^\[(?:BC|RA|UT)\w+\]\s*/gi, "")
    .replace(/^\[\d+(?:\/\d+)?h?(?:\s*de\s*\d+h?)?\]\s*/gi, "")
    .replace(/^\[\d+\s*sesion(?:es)?\]\s*/gi, "")
    .replace(/^\d{3,4}\.[\s._-]*(?:BC|RA|UT)?\d*[\s.:_-]*/gi, "")
    .replace(/^[A-Z0-9_-]+\.[\s._-]*(?:BC|RA|UT)\d*[\s.:_-]*/gi, "")
    .replace(/^(?:UD|RA|UT|BC)[\s._-]*\d+[\s.:_-]*/gi, "")
    .replace(/^(?:BC|RA|UT)[\s._-]*\d+[\s.:_-]*/gi, "")
    .replace(/^\((.*)\)$/, "$1")
    .replace(/^\[\s*\]/g, "")
    .replace(/^UD\s*0*\d+[:.\s-]+/i, "")
    .trim();

  if (!cleanTitle) {
    cleanTitle = `Unidad Didáctica ${udNum}`;
  }

  // Clean format: UDxx. [Título del Bloque o Unidad]
  const formattedTitle = `${udFormatted}. ${cleanTitle}`;
  const formattedCode = `${udFormatted}. ${cleanBc} (${horasAsignadas}h • ${sesiones} ses.)`;

  return {
    code: formattedCode,
    title: formattedTitle,
  };
}

// Auto-distribute SIGRE UDs evenly across teaching weeks
// Pedagogically distributes ordinary UDs from September to late May (avoiding June),
// and establishes the June Recuperation Period (weeks 1-3) & Final Assessment / Planning (week 4)
export function autoDistributeUdsToCalendar(
  calendar: SigreAcademicCalendar,
  uds: SigreUDItem[],
  moduloCodigo: string = "TEMINS 0037"
): SigreAcademicCalendar {
  if (!calendar) return calendar;

  // Strict compliance: If no UDs exist or list is empty, remove all UD legend items and UD day allocations
  if (!uds || uds.length === 0) {
    const cleanedLegends = (calendar.legendItems || []).filter(
      (l) =>
        l.type !== "ud_ra" &&
        !l.id.startsWith("leg_ud_") &&
        !l.id.startsWith("ist_ud_") &&
        !l.id.startsWith("cit_ud_") &&
        !l.id.startsWith("dig_ud_") &&
        !l.id.startsWith("leg25_ra")
    );
    const cleanedOverrides = { ...(calendar.dayOverrides || {}) };
    Object.keys(cleanedOverrides).forEach((dateKey) => {
      const ov = cleanedOverrides[dateKey];
      if (
        ov?.assignedUdId ||
        (ov?.legendItemId &&
          (ov.legendItemId.startsWith("leg_ud_") ||
            ov.legendItemId.startsWith("ist_ud_") ||
            ov.legendItemId.startsWith("cit_ud_") ||
            ov.legendItemId.startsWith("dig_ud_") ||
            ov.legendItemId.startsWith("leg25_ra")))
      ) {
        if (ov.type === "lectivo") {
          delete cleanedOverrides[dateKey];
        } else {
          cleanedOverrides[dateKey] = {
            ...ov,
            assignedUdId: undefined,
            assignedUdCode: undefined,
          };
        }
      }
    });

    return sanitizeAcademicCalendar({
      ...calendar,
      legendItems: cleanedLegends,
      dayOverrides: cleanedOverrides,
    });
  }

  // Helper to extract clean numeric UD index for strict ordering
  const extractUdNumber = (ud: SigreUDItem, idx: number): number => {
    if (typeof ud.number === "number" && !isNaN(ud.number) && ud.number > 0) return ud.number;
    const strToSearch = `${ud.bcCode || ""} ${ud.id || ""} ${ud.fullCode || ""} ${ud.title || ""}`;
    const match = strToSearch.match(/(?:UD|RA|UT|BC|TEMA|UNIDAD)[\s._-]*0*(\d+)/i) || strToSearch.match(/\b0*(\d+)\b/);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return idx + 1;
  };

  // Total horas from plan if available
  const totalHorasPlan =
    uds.reduce((sum, u) => sum + (u.horasEstimadas || 0), 0) || 160;

  // Pedagogical Rule: Ensure any PRL (Prevención de Riesgos Laborales) unit is placed FIRST at the start of the academic year (September)
  const sortedUds = [...uds].sort((a, b) => {
    const isPrlA = Boolean(
      a.isPrl ||
      a.title?.toLowerCase().includes("prevención") ||
      a.title?.toLowerCase().includes("prevencion") ||
      a.title?.toLowerCase().includes("riesgos laborales") ||
      a.title?.toLowerCase().includes("riesgos") ||
      a.title?.toLowerCase().includes("prl") ||
      a.fullCode?.toLowerCase().includes("prl") ||
      a.bcCode?.toLowerCase().includes("prl")
    );
    const isPrlB = Boolean(
      b.isPrl ||
      b.title?.toLowerCase().includes("prevención") ||
      b.title?.toLowerCase().includes("prevencion") ||
      b.title?.toLowerCase().includes("riesgos laborales") ||
      b.title?.toLowerCase().includes("riesgos") ||
      b.title?.toLowerCase().includes("prl") ||
      b.fullCode?.toLowerCase().includes("prl") ||
      b.bcCode?.toLowerCase().includes("prl")
    );

    if (isPrlA && !isPrlB) return -1;
    if (!isPrlA && isPrlB) return 1;
    return extractUdNumber(a, 0) - extractUdNumber(b, 0);
  });

  const parts = calendar.academicYear.split("-");
  const startYear = parseInt(parts[0], 10) || 2025;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  // Cut-off date for ordinary teaching: May 31st (June is strictly reserved for Recuperation & Final Evals)
  const cutoffOrdinaryTeaching = `${endYear}-05-31`;

  // Get official baseline calendar overrides and legend items
  const baseline = getOfficialAndalusianHolidaysAndVacations(calendar.academicYear);

  // Initialize new overrides by merging baseline and any existing non-UD special overrides
  const newOverrides: Record<string, SigreCalendarDayOverride> = { ...baseline.dayOverrides };

  // Preserve user custom milestones if they are special event types
  Object.entries(calendar.dayOverrides || {}).forEach(([dateStr, ov]) => {
    const d = parseDateSafe(dateStr);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      if (isSpecialEventType(ov.type)) {
        newOverrides[dateStr] = {
          ...ov,
          assignedUdId: undefined,
          assignedUdCode: undefined,
        };
      }
      return;
    }

    if (isSpecialEventType(ov.type)) {
      newOverrides[dateStr] = {
        ...ov,
        assignedUdId: undefined,
        assignedUdCode: undefined,
      };
    }
  });

  // Collect ordinary teaching days (Monday to Friday) between calendar.startDate (Sep 15) and May 31st
  const validSchoolDays: string[] = [];
  const months = getAcademicMonthsList(calendar.academicYear);

  months.forEach(({ year, month }) => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayDate = new Date(year, month, dayNum);
      const dayOfWeek = dayDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      if (dateStr >= calendar.startDate && dateStr <= cutoffOrdinaryTeaching) {
        const ov = newOverrides[dateStr];
        const type = ov?.type;
        const isNonTeachingHoliday =
          type === "festivo_nacional" ||
          type === "festivo_autonomico" ||
          type === "festivo_local" ||
          type === "vacaciones_navidad" ||
          type === "vacaciones_semana_santa" ||
          type === "semana_blanca" ||
          type === "dia_comunidad_educativa" ||
          type === "no_lectivo";

        if (!isNonTeachingHoliday) {
          validSchoolDays.push(dateStr);
        }
      }
    }
  });

  const totalLectivos = validSchoolDays.length;
  if (totalLectivos === 0) return calendar;

  const daysPerUd = Math.max(1, Math.floor(totalLectivos / sortedUds.length));

  // Purge ALL existing UD legend items and replace with clean baseline legend items
  const preservedLegendItems: SigreCalendarLegendItem[] = [
    ...baseline.legendItems,
    ...(calendar.legendItems || []).filter(
      (l) =>
        l.type !== "ud_ra" &&
        !l.id.startsWith("leg_auto_") &&
        !l.id.startsWith("leg_ud_") &&
        !l.id.startsWith("leg25_ra") &&
        !l.id.startsWith("ist_ra") &&
        !baseline.legendItems.some((b) => b.id === l.id)
    ),
  ];

  const updatedLegendItems: SigreCalendarLegendItem[] = [...preservedLegendItems];

  // Distribute UDs sequentially and continuously
  sortedUds.forEach((ud, index) => {
    const startIdx = index * daysPerUd;
    const endIdx = index === sortedUds.length - 1 ? totalLectivos : Math.min(totalLectivos, (index + 1) * daysPerUd);
    const assignedDays = validSchoolDays.slice(startIdx, endIdx);

    if (assignedDays.length === 0) return;

    const firstDate = assignedDays[0];
    const lastDate = assignedDays[assignedDays.length - 1];

    const firstMonthNum = parseInt(firstDate.split("-")[1], 10);
    const lastMonthNum = parseInt(lastDate.split("-")[1], 10);

    const firstDayNum = parseInt(firstDate.split("-")[2], 10);
    const lastDayNum = parseInt(lastDate.split("-")[2], 10);

    let rangeText = "";
    if (firstMonthNum === lastMonthNum) {
      rangeText = `${firstDayNum}-${lastDayNum} ${MONTH_NAMES_SHORT_ES[firstMonthNum - 1]}`;
    } else {
      rangeText = `${firstDayNum} ${MONTH_NAMES_SHORT_ES[firstMonthNum - 1]} - ${lastDayNum} ${MONTH_NAMES_SHORT_ES[lastMonthNum - 1]}`;
    }

    const palette = UD_COLOR_PALETTE[index % UD_COLOR_PALETTE.length];
    const udNum = extractUdNumber(ud, index);
    const legId = `leg_ud_${index + 1}_${udNum}`;

    const { code: udCode, title: udTitle } = buildUdLegendTitleAndCode({
      udNumber: udNum,
      id: ud.id,
      bcCode: ud.bcCode,
      horasAsignadas: ud.horasEstimadas,
      totalHoras: totalHorasPlan,
      sesiones: ud.sesionesEstimadas,
      title: ud.title || ud.fullCode || `Unidad Didáctica ${udNum}`,
      moduloCodigo,
    });

    // Compute side position according to the semester/column layout:
    // Left column: Sept(9), Oct(10), Nov(11), Dec(12), Jan(1)
    // Right column: Feb(2), Mar(3), Apr(4), May(5), Jun(6)
    const isFirstSemester = [9, 10, 11, 12, 1].includes(firstMonthNum);
    const sidePos: "left" | "right" = isFirstSemester ? "left" : "right";

    updatedLegendItems.push({
      id: legId,
      code: udCode,
      title: udTitle,
      type: "ud_ra",
      color: palette.bg,
      textColor: palette.text,
      udId: ud.id,
      monthTarget: firstMonthNum,
      sidePosition: sidePos,
      dayRangeText: rangeText,
    });

    assignedDays.forEach((dateStr) => {
      const d = parseDateSafe(dateStr);
      if (d.getDay() === 0 || d.getDay() === 6) return; // Strict weekend safety

      const existing = newOverrides[dateStr];
      if (existing && isSpecialEventType(existing.type)) {
        // Preserve milestone visuals (e.g. Sep 15 Inicio FP with #ff00ff, Sep 22 Evaluación Inicial with #99cc33)
        newOverrides[dateStr] = {
          ...existing,
          assignedUdId: legId,
          assignedUdCode: udCode,
        };
      } else {
        newOverrides[dateStr] = {
          date: dateStr,
          type: "lectivo",
          legendItemId: legId,
          assignedUdId: legId,
          assignedUdCode: udCode,
          customColor: palette.bg,
          customTextColor: palette.text,
          title: udTitle,
        };
      }
    });
  });

  return sanitizeAcademicCalendar({
    ...calendar,
    totalLectivosEstimated: totalLectivos,
    legendItems: updatedLegendItems,
    dayOverrides: newOverrides,
  });
}

// Ensure strict uniqueness of legend item IDs, normalize all UD legend items to the official standard format, and ensure structural integrity across the calendar
export function sanitizeAcademicCalendar(calendar: SigreAcademicCalendar): SigreAcademicCalendar {
  if (!calendar) return calendar;

  const seenLegendIds = new Set<string>();
  const sanitizedLegendItems: SigreCalendarLegendItem[] = [];
  const codeMapping = new Map<string, { oldCode: string; newCode: string; newTitle: string; newId: string }>();

  // Counter for sequential UD numbering when needed
  let udCounter = 0;

  (calendar.legendItems || []).forEach((leg, idx) => {
    let finalId = leg.id || `leg_${idx + 1}`;
    if (seenLegendIds.has(finalId)) {
      finalId = `${finalId}_${idx + 1}`;
    }
    seenLegendIds.add(finalId);

    const isUdItem =
      leg.type === "ud_ra" ||
      finalId.startsWith("leg_ud_") ||
      finalId.startsWith("ist_ud_") ||
      finalId.startsWith("cit_ud_") ||
      finalId.startsWith("dig_ud_") ||
      finalId.startsWith("leg25_ra") ||
      Boolean(leg.code && /^(?:UD\d+|\d{3,4}\.\s*(?:BC|RA|UT)|[A-Z0-9_-]+\.\s*(?:BC|RA|UT))/i.test(leg.code.trim())) ||
      Boolean(leg.title && /^(?:\[UD\d+\]|\d{3,4}\.\s*(?:BC|RA|UT)|(?:BC|RA|UT)\d+)/i.test(leg.title.trim()));

    if (isUdItem) {
      udCounter++;

      // 1. Extract UD Number
      let udNum = udCounter;
      if (leg.udId && /UD\s*0*(\d+)/i.test(leg.udId)) {
        udNum = parseInt(leg.udId.match(/UD\s*0*(\d+)/i)![1], 10);
      } else if (leg.code && /UD\s*0*(\d+)/i.test(leg.code)) {
        udNum = parseInt(leg.code.match(/UD\s*0*(\d+)/i)![1], 10);
      } else if (finalId && /(?:ud|ra)_*0*(\d+)/i.test(finalId)) {
        udNum = parseInt(finalId.match(/(?:ud|ra)_*0*(\d+)/i)![1], 10);
      } else if (leg.title && /\[UD\s*0*(\d+)\]/i.test(leg.title)) {
        udNum = parseInt(leg.title.match(/\[UD\s*0*(\d+)\]/i)![1], 10);
      }

      // 2. Extract BC code
      let bcCode = (leg.bcCode || "").trim().toUpperCase();
      if (!bcCode) {
        const bcMatch =
          (leg.code || "").match(/(?:BC|RA|UT)\s*0*(\d+)/i) ||
          (leg.title || "").match(/\[(?:BC|RA|UT)\s*0*(\d+)\]/i) ||
          (leg.title || "").match(/(?:BC|RA|UT)\s*0*(\d+)/i);
        if (bcMatch) {
          const prefix = bcMatch[0].toUpperCase().startsWith("RA") ? "RA" : bcMatch[0].toUpperCase().startsWith("UT") ? "UT" : "BC";
          bcCode = `${prefix}${parseInt(bcMatch[1], 10)}`;
        } else {
          bcCode = `BC${udNum}`;
        }
      }

      // 3. Extract Hours and Total Hours
      let horasAsignadas = leg.horasAsignadas || (leg as any).horasEstimadas;
      let totalHoras = 160;
      const hoursMatch = (leg.title || "").match(/\[\s*(\d+)\s*\/\s*(\d+)\s*h\s*\]/i);
      if (hoursMatch) {
        horasAsignadas = parseInt(hoursMatch[1], 10);
        totalHoras = parseInt(hoursMatch[2], 10);
      } else {
        const shorthandMatch = (leg.code || "").match(/\((\d+)h\/(\d+)s\)/i);
        if (shorthandMatch) {
          horasAsignadas = parseInt(shorthandMatch[1], 10);
        }
      }
      if (!horasAsignadas || horasAsignadas <= 0) {
        horasAsignadas = Math.max(10, Math.round(totalHoras / (udNum > 10 ? 12 : 8)));
      }

      // 4. Extract Sessions
      let sesiones = leg.sesiones || (leg as any).sesionesEstimadas;
      const sesMatch = (leg.title || "").match(/\[\s*(\d+)\s*sesion(?:es)?\s*\]/i);
      if (sesMatch) {
        sesiones = parseInt(sesMatch[1], 10);
      } else {
        const shorthandMatch = (leg.code || "").match(/\((\d+)h\/(\d+)s\)/i);
        if (shorthandMatch) {
          sesiones = parseInt(shorthandMatch[2], 10);
        }
      }
      if (!sesiones || sesiones <= 0) {
        sesiones = Math.max(1, Math.round(horasAsignadas / 2));
      }

      // 5. Clean Title (remove any prefixes, old module codes like "0392. BC1", etc.)
      let cleanTitle = (leg.title || `Unidad Didáctica ${udNum}`).trim();
      cleanTitle = cleanTitle
        .replace(/^\[UD\d+\]\s*/gi, "")
        .replace(/^\[(?:BC|RA|UT)\w+\]\s*/gi, "")
        .replace(/^\[\d+(?:\/\d+)?h?(?:\s*de\s*\d+h?)?\]\s*/gi, "")
        .replace(/^\[\d+\s*sesion(?:es)?\]\s*/gi, "")
        .replace(/^\d{3,4}\.[\s._-]*(?:BC|RA|UT)?\d*[\s.:_-]*/gi, "")
        .replace(/^[A-Z0-9_-]+\.[\s._-]*(?:BC|RA|UT)\d*[\s.:_-]*/gi, "")
        .replace(/^(?:UD|RA|UT|BC)[\s._-]*\d+[\s.:_-]*/gi, "")
        .replace(/^(?:BC|RA|UT)[\s._-]*\d+[\s.:_-]*/gi, "")
        .replace(/^\((.*)\)$/, "$1")
        .replace(/^\[\s*\]/g, "")
        .trim();

      if (!cleanTitle) {
        cleanTitle = `Unidad Didáctica ${udNum}`;
      }

      const { code: normalizedCode, title: normalizedTitle } = buildUdLegendTitleAndCode({
        udNumber: udNum,
        id: finalId,
        bcCode: bcCode,
        horasAsignadas,
        totalHoras,
        sesiones,
        title: cleanTitle,
      });

      if (leg.code && leg.code !== normalizedCode) {
        codeMapping.set(leg.code, {
          oldCode: leg.code,
          newCode: normalizedCode,
          newTitle: normalizedTitle,
          newId: finalId,
        });
      }
      codeMapping.set(finalId, {
        oldCode: leg.code || "",
        newCode: normalizedCode,
        newTitle: normalizedTitle,
        newId: finalId,
      });

      sanitizedLegendItems.push({
        ...leg,
        id: finalId,
        type: "ud_ra",
        code: normalizedCode,
        title: normalizedTitle,
        udId: `UD${String(udNum).padStart(2, "0")}`,
        bcCode: bcCode,
        horasAsignadas: horasAsignadas,
        totalHoras: totalHoras,
        sesiones: sesiones,
      });
    } else {
      sanitizedLegendItems.push({
        ...leg,
        id: finalId,
      });
    }
  });

  const sanitizedDayOverrides: Record<string, SigreCalendarDayOverride> = {};
  Object.entries(calendar.dayOverrides || {}).forEach(([dateStr, ov]) => {
    const d = parseDateSafe(dateStr);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      // Weekends MUST NEVER be lectivo and MUST NEVER have UD assignments
      if (ov.type === "lectivo" || ov.assignedUdId || ov.assignedUdCode) {
        return; // Drop invalid lectivo/UD overrides on weekends
      }
      // If it's a legitimate holiday on a weekend (e.g. Navidad / Todos los Santos), preserve it without UD assignment
      if (isSpecialEventType(ov.type)) {
        sanitizedDayOverrides[dateStr] = {
          ...ov,
          type: ov.type,
          assignedUdId: undefined,
          assignedUdCode: undefined,
        };
      }
    } else {
      let updatedOv = { ...ov };
      if (ov.assignedUdId && codeMapping.has(ov.assignedUdId)) {
        const mapping = codeMapping.get(ov.assignedUdId)!;
        updatedOv.assignedUdCode = mapping.newCode;
        if (updatedOv.title && (/^\d{3,4}\./.test(updatedOv.title) || /^UD\d+/.test(updatedOv.title) || /^\[UD\d+\]/.test(updatedOv.title))) {
          updatedOv.title = mapping.newTitle;
        }
      } else if (ov.assignedUdCode && codeMapping.has(ov.assignedUdCode)) {
        const mapping = codeMapping.get(ov.assignedUdCode)!;
        updatedOv.assignedUdCode = mapping.newCode;
        updatedOv.assignedUdId = mapping.newId;
        if (updatedOv.title && (/^\d{3,4}\./.test(updatedOv.title) || /^UD\d+/.test(updatedOv.title) || /^\[UD\d+\]/.test(updatedOv.title))) {
          updatedOv.title = mapping.newTitle;
        }
      } else if (ov.legendItemId && codeMapping.has(ov.legendItemId)) {
        const mapping = codeMapping.get(ov.legendItemId)!;
        updatedOv.assignedUdCode = mapping.newCode;
        updatedOv.assignedUdId = mapping.newId;
        if (updatedOv.title && (/^\d{3,4}\./.test(updatedOv.title) || /^UD\d+/.test(updatedOv.title) || /^\[UD\d+\]/.test(updatedOv.title))) {
          updatedOv.title = mapping.newTitle;
        }
      }
      sanitizedDayOverrides[dateStr] = updatedOv;
    }
  });

  return {
    ...calendar,
    legendItems: sanitizedLegendItems,
    dayOverrides: sanitizedDayOverrides,
    specialEvents: calendar.specialEvents || [],
  };
}

// UD Color Palette matching reference image pattern for auto-distribution
export const UD_COLOR_PALETTE = [
  { bg: "#fcd5b4", text: "#431407", border: "#fba972" }, // Melocotón Crema (UD1)
  { bg: "#e2d5e8", text: "#3b0764", border: "#c4b5fd" }, // Lavanda (UD2)
  { bg: "#f5deb3", text: "#7c2d12", border: "#deb887" }, // Marrón Canela (UD3)
  { bg: "#fff2b2", text: "#713f12", border: "#fde047" }, // Amarillo Crema (UD4)
  { bg: "#ffc482", text: "#7c2d12", border: "#fb923c" }, // Naranja Melocotón (UD5)
  { bg: "#99e6ff", text: "#0c4a6e", border: "#38bdf8" }, // Azul Cielo Cyan (UD6)
  { bg: "#b2e6b2", text: "#14532d", border: "#4ade80" }, // Verde Menta (UD7)
  { bg: "#80deea", text: "#134e4a", border: "#26c6da" }, // Turquesa Claro (UD8)
  { bg: "#c5e1a5", text: "#365314", border: "#9ccc65" }, // Verde Pistacho (UD9)
  { bg: "#ffd966", text: "#713f12", border: "#facc15" }, // Amarillo Mostaza (UD10)
  { bg: "#f8cb9c", text: "#7c2d12", border: "#fb923c" }, // Melocotón Tostado (UD11)
  { bg: "#fbcfe8", text: "#831843", border: "#f472b6" }, // Rosa Fucsia Suave (UD12)
  { bg: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" }, // Azul Índigo Claro (UD13)
  { bg: "#ccfbf1", text: "#115e59", border: "#5eead4" }, // Verde Esmeralda Pastel (UD14)
  { bg: "#fed7aa", text: "#9a3412", border: "#fdba74" }, // Coral Cálido (UD15)
  { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" }, // Violeta Iris (UD16)
  { bg: "#fce7f3", text: "#9d174d", border: "#f472b6" }, // Rosa Palo (UD17)
  { bg: "#ecfccb", text: "#3f6212", border: "#bef264" }, // Lima Suave (UD18)
  { bg: "#e0f2fe", text: "#075985", border: "#7dd3fc" }, // Azul Glaciar (UD19)
  { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" }, // Ámbar Dorado (UD20)
];

// Helper to create a new academic calendar template
export function createNewAcademicCalendarTemplate(
  academicYear: string,
  province: string = "Málaga",
  moduloFormativo: string = "Técnicas de montaje de instalaciones térmicas",
  codigoModulo: string = "TEMINS 0037",
  cicloFormativo: string = "1º CFGM Instalaciones Frigoríficas y de Climatización",
  docente: string = "Profesorado FP"
): SigreAcademicCalendar {
  const parts = academicYear.split("-");
  const startYear = parseInt(parts[0], 10) || 2025;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  const startDate = `${startYear}-09-15`;
  const endDate = `${endYear}-06-24`;

  const baseline = getOfficialAndalusianHolidaysAndVacations(academicYear);

  return sanitizeAcademicCalendar({
    id: `cal_${startYear}_${endYear}_andalucia`,
    academicYear: `${startYear}-${endYear}`,
    region: "Andalucía",
    province: province,
    resolutionRef: `Resolución de Delegación Territorial de Desarrollo Educativo y FP en ${province} (Curso ${startYear}/${endYear})`,
    resolutionUrl: "https://www.juntadeandalucia.es/educacion/portales/w/calendario-escolar-andalucia",
    educationalStage: "Formación Profesional / Secundaria / Bachillerato",
    startDate,
    endDate,
    moduloFormativo,
    codigoModulo,
    cicloFormativo,
    docente,
    totalLectivosEstimated: 175,
    legendItems: baseline.legendItems,
    dayOverrides: baseline.dayOverrides,
    specialEvents: [],
    notes: `Calendario Escolar Oficial del curso ${startYear}/${endYear} para la comunidad autónoma de Andalucía.`,
  });
}

// Utility to switch or adapt a calendar to a new academic year seamlessly
export function shiftCalendarToAcademicYear(
  calendar: SigreAcademicCalendar,
  targetAcademicYear: string,
  mode: "shift_dates" | "load_official_preset" | "update_label_only" = "shift_dates"
): SigreAcademicCalendar {
  const cleanTargetYear = targetAcademicYear.trim();
  const targetParts = cleanTargetYear.split("-");
  const newStartYear = parseInt(targetParts[0], 10) || 2026;
  const newEndYear = parseInt(targetParts[1], 10) || newStartYear + 1;

  const currentParts = (calendar.academicYear || "2026-2027").split("-");
  const oldStartYear = parseInt(currentParts[0], 10) || 2026;
  const oldEndYear = parseInt(currentParts[1], 10) || oldStartYear + 1;

  // Mode 1: Update label only
  if (mode === "update_label_only") {
    return {
      ...calendar,
      academicYear: cleanTargetYear,
      startDate: `${newStartYear}-09-15`,
      endDate: `${newEndYear}-06-24`,
      resolutionRef: `Resolución de Delegación Territorial de Desarrollo Educativo y FP en ${calendar.province || "Málaga"} (Curso ${newStartYear}/${newEndYear})`,
    };
  }

  // Mode 2: Load official template for that academic year if requested
  if (mode === "load_official_preset") {
    const base = createNewAcademicCalendarTemplate(
      cleanTargetYear,
      calendar.province || "Málaga",
      calendar.moduloFormativo,
      calendar.codigoModulo,
      calendar.cicloFormativo,
      calendar.docente
    );
    // Preserve custom UD legend items and custom user notes
    const udLegends = (calendar.legendItems || []).filter((l) => l.type === "ud_ra");
    return {
      ...base,
      id: calendar.id,
      legendItems: [...base.legendItems, ...udLegends],
      notes: calendar.notes || base.notes,
    };
  }

  // Mode 3 (Default): Intelligently shift dates from old year to new year
  const yearDiff = newStartYear - oldStartYear;
  const newDayOverrides: Record<string, SigreCalendarDayOverride> = {};

  Object.entries(calendar.dayOverrides || {}).forEach(([dateStr, override]) => {
    const [yStr, mStr, dStr] = dateStr.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10); // 1-12

    // September-December belong to startYear; January-June belong to endYear
    let shiftedY = y + yearDiff;
    if (m >= 9 && m <= 12) {
      shiftedY = newStartYear;
    } else if (m >= 1 && m <= 8) {
      shiftedY = newEndYear;
    }

    const newDateStr = `${shiftedY}-${mStr}-${dStr}`;
    newDayOverrides[newDateStr] = {
      ...override,
      date: newDateStr,
    };
  });

  const newSpecialEvents = (calendar.specialEvents || []).map((ev) => {
    const [yStr, mStr, dStr] = ev.date.split("-");
    const m = parseInt(mStr, 10);
    let shiftedY = parseInt(yStr, 10) + yearDiff;
    if (m >= 9 && m <= 12) shiftedY = newStartYear;
    else if (m >= 1 && m <= 8) shiftedY = newEndYear;

    return {
      ...ev,
      date: `${shiftedY}-${mStr}-${dStr}`,
    };
  });

  return {
    ...calendar,
    academicYear: cleanTargetYear,
    startDate: `${newStartYear}-09-15`,
    endDate: `${newEndYear}-06-24`,
    resolutionRef: `Resolución de Delegación Territorial de Desarrollo Educativo y FP en ${calendar.province || "Málaga"} (Curso ${newStartYear}/${newEndYear})`,
    dayOverrides: newDayOverrides,
    specialEvents: newSpecialEvents,
  };
}

// Helper to format code inside legend chip (e.g. "3 Sep" -> "3", "23-31", "UD01. BC7 (14h/7s)", "Recuperación")
export function formatOfficialLegendChip(item: MonthLateralTag): string {
  // 1. If it's a UD / RA / Dual / Recuperation or multi-day period, ALWAYS display the distinctive UD / Period code
  const isMultiDayOrUd =
    item.type === "ud_ra" ||
    item.type === "dual" ||
    item.type === "recuperacion" ||
    item.id.startsWith("auto_ud_") ||
    item.id.startsWith("auto_period_") ||
    item.id.startsWith("leg_auto_") ||
    item.id.startsWith("leg_ud_") ||
    item.id.startsWith("ist_ud_") ||
    item.id.startsWith("cit_ud_") ||
    item.id.startsWith("dig_ud_") ||
    item.id.startsWith("leg25_ra") ||
    (item.code && !/^\d{1,2}(\s+[a-zA-ZáéíóúÁÉÍÓÚ]{3,})?$/.test(item.code.trim()));

  if (isMultiDayOrUd) {
    let cleanCode = item.code || "";
    // If it's an old module prefix format like "0392. BC1" or "TEMINS. RA01", convert to clean UD format
    if (/^\d{3,4}\.\s*(?:BC|RA|UT)/i.test(cleanCode) || /^[A-Z0-9_-]+\.\s*(?:BC|RA|UT)/i.test(cleanCode)) {
      const bcMatch = cleanCode.match(/(?:BC|RA|UT)\s*0*(\d+)/i);
      const bcStr = bcMatch ? `${bcMatch[0].toUpperCase().startsWith("RA") ? "RA" : "BC"}${parseInt(bcMatch[1], 10)}` : "BC1";
      const udNumMatch = item.id.match(/(?:ud|ra)_*0*(\d+)/i) || (item.title || "").match(/\[UD\s*0*(\d+)\]/i);
      const udNum = udNumMatch ? parseInt(udNumMatch[1], 10) : 1;
      return `UD${String(udNum).padStart(2, "0")}. ${bcStr}`;
    }
    return cleanCode;
  }

  // 2. Day Range override if explicit (e.g. "23-31")
  if (item.dayRangeText && /^\d{1,2}-\d{1,2}$/.test(item.dayRangeText.trim())) {
    return item.dayRangeText.trim();
  }

  // 3. Single-day events / holidays: show the day number (e.g. "12", "23", "26")
  if (item.dayNumber !== undefined) {
    return String(item.dayNumber);
  }
  const matchNum = item.code.match(/^(\d{1,2})(?:\s+[a-zA-ZáéíóúÁÉÍÓÚ]{3,})?$/);
  if (matchNum) {
    return matchNum[1];
  }
  return item.code;
}

// Render official printable HTML matching the 2-column by 5-row A4 landscape layout of Andalusian official bulletin / Consejería resolution
export function renderOfficialSchoolCalendarA4Html(calendar?: SigreAcademicCalendar | null): string {
  if (!calendar) {
    return `<div style="padding: 40px; text-align: center; font-family: sans-serif; color: #64748b;">No hay calendario escolar cargado para imprimir.</div>`;
  }
  const months = getAcademicMonthsList(calendar.academicYear);
  const stats = calculateAcademicCalendarStats(calendar);

  // Render a Month Calendar Table (Days Table with L M X J V S D)
  const renderMonthCalendarTable = (m: CalendarMonthData) => {
    return `
      <div style="border: 0.8px solid #000000; background: #ffffff; width: 100%; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 6.8px; font-family: Arial, Helvetica, sans-serif; table-layout: fixed; margin: 0; padding: 0;">
          <thead>
            <tr style="background-color: #f1f5f9 !important; color: #000000 !important; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center;">L</th>
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center;">M</th>
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center;">X</th>
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center;">J</th>
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center;">V</th>
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center; background-color: #e2e8f0 !important;">S</th>
              <th style="border: 0.5px solid #000000; padding: 1.2px 0; width: 14.28%; font-size: 6.2px; text-align: center; background-color: #e2e8f0 !important;">D</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: Math.ceil(m.days.length / 7) })
              .map((_, rowIdx) => {
                const rowDays = m.days.slice(rowIdx * 7, (rowIdx + 1) * 7);
                return `
                  <tr>
                    ${rowDays
                      .map((d) => {
                        let cellBg = "#ffffff";
                        let cellColor = "#000000";
                        let isBold = true;
                        let titleTip = "";

                        if (d.isCurrentMonth) {
                          if (d.hasSpecialPrevalence) {
                            cellBg = d.displayBgColor;
                            cellColor = d.displayTextColor;
                            titleTip = `${d.specialEventLabel || ""}`;
                          } else if (!d.isWeekend && d.displayBgColor && d.displayBgColor !== "transparent") {
                            cellBg = d.displayBgColor;
                            cellColor = d.displayTextColor;
                            titleTip = d.override?.title || d.legendItem?.title || "";
                          } else if (d.isWeekend) {
                            cellBg = "#f8fafc";
                            cellColor = "#ef4444";
                          }
                        } else {
                          cellBg = "#f1f5f9";
                          cellColor = "transparent";
                        }

                        const dayText = d.isCurrentMonth ? String(d.dayNumber) : "&nbsp;";

                        return `
                          <td style="border: 0.5px solid #475569; height: 10.5px; vertical-align: middle; background-color: ${cellBg} !important; color: ${cellColor} !important; font-weight: ${isBold ? "bold" : "normal"}; font-size: 7px; padding: 0; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" title="${titleTip}">
                            ${dayText}
                          </td>
                        `;
                      })
                      .join("")}
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  // Render a Legend Column for a specific Month
  const renderMonthLegendColumn = (tags: MonthLateralTag[], side: "left" | "right") => {
    if (!tags || tags.length === 0) {
      return `<div style="width: 100%; min-height: 1px;"></div>`;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 1.5px; justify-content: center; width: 100%; box-sizing: border-box;">
        ${tags
          .map((item) => {
            const chipCode = formatOfficialLegendChip(item);
            return `
              <div style="display: flex; align-items: center; gap: 2.5px; line-height: 1.05; background: #ffffff; padding: 0.8px 1.5px; border: 0.5px solid #cbd5e1; border-radius: 1.5px; box-sizing: border-box;">
                <span style="background-color: ${item.color} !important; color: ${item.textColor || "#000000"} !important; border: 0.5px solid #000000; padding: 0.5px 2px; font-weight: bold; font-size: 5.6px; text-align: center; min-width: 10px; max-width: 38px; shrink: 0; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; border-radius: 1px;">
                  ${chipCode}
                </span>
                <span style="color: #0f172a; font-size: 5.4px; font-weight: 600; word-break: break-word; line-height: 1.0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  ${item.title}
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  };

  // Render a single Month Card (Header + Left Legend + Center Table + Right Legend)
  const renderMonthCard = (year: number, month: number) => {
    const monthData = generateMonthGrid(year, month, calendar);
    const { leftLegends, rightLegends } = deriveMonthLateralLegends(year, month, calendar);
    const trimesterInfo = getMonthTrimesterInfo(year, month, calendar);
    const lectivosCount = monthData.days.filter((d) => {
      if (!d.isCurrentMonth || d.isWeekend) return false;
      const type = d.override?.type;
      return !(
        type === "festivo_nacional" ||
        type === "festivo_autonomico" ||
        type === "festivo_local" ||
        type === "vacaciones_navidad" ||
        type === "vacaciones_semana_santa" ||
        type === "semana_blanca" ||
        type === "dia_comunidad_educativa" ||
        type === "no_lectivo"
      );
    }).length;

    const rawParts = monthData.monthName.split(" ");
    const monthTitle =
      rawParts.length >= 2
        ? `${rawParts[0].toUpperCase()} ${rawParts[1]}`
        : monthData.monthName.toUpperCase();

    return `
      <div class="month-card" style="border-color: ${trimesterInfo.headerBorderColor} !important;">
        <!-- Month Header (Color-coded by Trimester with Lectivos Count & Trimester Badge) -->
        <div class="month-header" style="background-color: ${trimesterInfo.headerStyleBg} !important; border-bottom: 0.5px solid ${trimesterInfo.headerBorderColor} !important;">
          <div style="display: flex; align-items: center; gap: 3.5px;">
            <span class="month-name">${monthTitle}</span>
            <span style="font-size: 5.2px; font-weight: 900; background-color: ${trimesterInfo.badgeStyleBg} !important; color: ${trimesterInfo.badgeStyleText} !important; padding: 0.5px 2.5px; border-radius: 1.5px; text-transform: uppercase; letter-spacing: 0.2px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              ${trimesterInfo.isShared ? `🔄 ${trimesterInfo.shortBadge}` : trimesterInfo.shortBadge}
            </span>
          </div>
          <span class="month-lectivos">${lectivosCount} días lectivos</span>
        </div>

        <!-- Month Body: 3-column layout (Left Legend, Calendar, Right Legend) -->
        <div class="month-body">
          <div class="side-col left-col">
            ${renderMonthLegendColumn(leftLegends, "left")}
          </div>
          <div class="center-col">
            ${renderMonthCalendarTable(monthData)}
          </div>
          <div class="side-col right-col">
            ${renderMonthLegendColumn(rightLegends, "right")}
          </div>
        </div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendario Escolar Oficial ${calendar.academicYear} - ${calendar.moduloFormativo || "FP Andalucía"}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 3.5mm 4.5mm 3.5mm 4.5mm;
    }
    * {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      background: #ffffff !important;
      margin: 0;
      padding: 0;
      font-size: 6.5px;
      line-height: 1.1;
      width: 100%;
      height: 100%;
    }
    .page-container {
      width: 100%;
      height: 100%;
      max-width: 288mm;
      max-height: 202mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      border-bottom: 1.8px solid #007A33;
      padding-bottom: 2px;
      margin-bottom: 2.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .junta-brand {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-title {
      font-size: 10.5px;
      font-weight: 900;
      color: #007A33;
      letter-spacing: -0.2px;
      line-height: 1.1;
      margin: 0.5px 0;
    }
    .header-subtitle {
      font-size: 6.2px;
      color: #1e293b;
      margin-top: 0.5px;
      line-height: 1.1;
    }
    /* 2 COLUMNS x 5 ROWS RIGID LANDSCAPE GRID (10 MONTHS TOTAL: SEPTIEMBRE A JUNIO) */
    .calendar-grid-2x5 {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      grid-template-rows: repeat(5, minmax(0, 1fr)) !important;
      gap: 2.5px 4.5px !important;
      width: 100% !important;
      flex: 1 !important;
      min-height: 0 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .month-card {
      border: 1px solid #007A33;
      background: #ffffff !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      border-radius: 1.5px !important;
      overflow: hidden !important;
    }
    .month-header {
      color: #ffffff !important;
      font-weight: 800 !important;
      font-size: 6.8px !important;
      padding: 1.2px 4px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      letter-spacing: 0.2px !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      flex-shrink: 0;
    }
    .month-name {
      font-weight: 900;
      letter-spacing: 0.2px;
    }
    .month-lectivos {
      font-size: 5.8px !important;
      font-weight: 600 !important;
      opacity: 0.95;
      background: rgba(0, 0, 0, 0.2) !important;
      padding: 0.5px 3px !important;
      border-radius: 2px !important;
    }
    .month-body {
      display: grid !important;
      grid-template-columns: 28% 44% 28% !important;
      gap: 2px !important;
      padding: 1.5px 2.5px !important;
      align-items: center !important;
      flex: 1 !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
    }
    .side-col {
      display: flex !important;
      flex-direction: column !important;
      gap: 1px !important;
      justify-content: center !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .center-col {
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
      box-sizing: border-box !important;
    }
    .legend-bottom {
      padding: 2px 4px !important;
      border: 1px solid #007A33 !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      border-radius: 1.5px !important;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .legend-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 1.5px 5px !important;
      font-size: 5.6px !important;
      margin-top: 1.5px !important;
    }
    .legend-chip {
      display: flex !important;
      align-items: center !important;
      gap: 2.5px !important;
      line-height: 1.05 !important;
    }
    .chip-color {
      width: 6.5px !important;
      height: 6.5px !important;
      border: 0.5px solid #000000 !important;
      flex-shrink: 0 !important;
      display: inline-block !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border-radius: 0.5px !important;
    }
    .official-footer {
      margin-top: 1.5px !important;
      font-size: 5px !important;
      color: #475569 !important;
      border-top: 0.5px dashed #94a3b8 !important;
      padding-top: 1px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    .action-bar-screen {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 99999;
      display: flex;
      gap: 6px;
      background: #0f172a;
      padding: 5px 10px;
      border-radius: 6px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      border: 1px solid #334155;
    }
    .btn-action {
      font-family: Arial, sans-serif;
      padding: 5px 10px;
      border-radius: 5px;
      font-weight: bold;
      font-size: 11px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-print {
      background: #007A33;
      color: #ffffff;
    }
    .btn-close {
      background: #475569;
      color: #ffffff;
    }
    @media print {
      .action-bar-screen {
        display: none !important;
      }
      body { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
        color-adjust: exact !important;
      }
      .page-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        height: 100vh !important;
        max-height: 202mm !important;
      }
      .calendar-grid-2x5, .month-card, .legend-bottom {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
  <script>
    // Listen for parent print messages
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'PRINT') {
        window.focus();
        window.print();
      }
    });

    // Hide floating action bar if embedded inside an iframe
    window.addEventListener('DOMContentLoaded', function() {
      try {
        if (window.self !== window.top) {
          var bar = document.querySelector('.action-bar-screen');
          if (bar) bar.style.display = 'none';
        }
      } catch(e) {}
    });
  </script>
</head>
<body>
  <!-- On-Screen Floating Action Bar for standalone tab view -->
  <div class="action-bar-screen">
    <button type="button" class="btn-action btn-print" onclick="window.print()">
      🖨️ Imprimir / Guardar en PDF (Apaisado)
    </button>
    <button type="button" class="btn-action btn-close" onclick="window.close()">
      ✕ Cerrar
    </button>
  </div>

  <div class="page-container">
    <!-- Official Header -->
    <div class="header">
      <div class="junta-brand">
        <!-- Junta de Andalucia Official Emblem -->
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="8" fill="#007A33"/>
          <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50Z" fill="#ffffff" fill-opacity="0.15"/>
          <path d="M50 26C36.7452 26 26 36.7452 26 50C26 63.2548 36.7452 74 50 74C63.2548 74 74 63.2548 74 50C74 36.7452 63.2548 26 50 26ZM48 35H52V47H64V51H52V63H48V51H36V47H48V35Z" fill="#ffffff"/>
          <circle cx="50" cy="50" r="8" fill="#007A33"/>
        </svg>
        <div>
          <div style="font-size: 5.8px; font-weight: 800; color: #007A33; text-transform: uppercase; letter-spacing: 0.2px;">
            Junta de Andalucía &bull; Consejería de Desarrollo Educativo y Formación Profesional
          </div>
          <div class="header-title">
            CALENDARIO ESCOLAR Y PLANIFICACIÓN CURRICULAR CURSO ${calendar.academicYear.replace("-", "/")}
          </div>
          <div class="header-subtitle">
            <strong>Delegación Territorial:</strong> ${calendar.province || "Málaga"} &bull; 
            ${calendar.moduloFormativo ? `<strong>Módulo:</strong> ${calendar.moduloFormativo} (${calendar.codigoModulo || "FP"}) &bull; ` : ""}
            ${calendar.cicloFormativo ? `<strong>Ciclo:</strong> ${calendar.cicloFormativo}` : ""}
            ${calendar.docente ? ` &bull; <strong>Docente:</strong> ${calendar.docente}` : ""}
          </div>
        </div>
      </div>
      <div style="text-align: right; font-size: 5.8px; color: #1e293b; line-height: 1.15;">
        <div style="color: #007A33; font-weight: bold;">${calendar.resolutionRef || "Resolución de la Delegación Territorial"}</div>
        <div><strong>Régimen FP:</strong> 15 Sep - 24 Jun &bull; <strong>Días lectivos totales:</strong> ~${stats.totalSchoolDays}</div>
      </div>
    </div>

    <!-- 2 COLUMNS x 5 ROWS RIGID LANDSCAPE GRID (Septiembre a Junio) -->
    <div class="calendar-grid-2x5">
      ${months.map((m) => renderMonthCard(m.year, m.month)).join("")}
    </div>

    <!-- Global Reference Notes -->
    <div class="legend-bottom">
      <div style="font-weight: bold; font-size: 6.2px; color: #007A33; margin-bottom: 1px; border-bottom: 0.5px solid #007A33; padding-bottom: 1px; display: flex; justify-content: space-between;">
        <span>LEYENDA DE PLANIFICACIÓN DOCENTE Y RESULTADOS DE APRENDIZAJE (UDs/RAs) &bull; CURSO ${calendar.academicYear.replace("-", "/")}</span>
        <span>Días lectivos mínimos: 175 FP / 178 Primaria</span>
      </div>
      <div class="legend-grid">
        <div class="legend-chip">
          <span class="chip-color" style="background: #ff0000;"></span>
          <span><strong>Festivo Nacional / Local:</strong> Rojo oficial</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #16a34a;"></span>
          <span><strong>Festivo Autonómico:</strong> Día de Andalucía</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #00ffff;"></span>
          <span><strong>Vacaciones Navidad:</strong> Periodo no lectivo</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #ff99ff;"></span>
          <span><strong>Semana Santa:</strong> Periodo no lectivo</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #0080ff;"></span>
          <span><strong>Evaluaciones:</strong> Sesiones trimestrales y finales</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #38bdf8;"></span>
          <span><strong>Entrega de Calificaciones:</strong> Boletines oficiales</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #f8cb9c;"></span>
          <span><strong>Recuperación (Junio):</strong> Aprendizajes no adquiridos</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #d946ef;"></span>
          <span><strong>Inicio / Fin de Clases:</strong> Hito escolar</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #fff2b2;"></span>
          <span><strong>FP Dual:</strong> Formación en Empresa (FFEoE)</span>
        </div>
        <div class="legend-chip">
          <span class="chip-color" style="background: #fcd5b4;"></span>
          <span><strong>UDs / RAs:</strong> Temporalización de unidades</span>
        </div>
      </div>
      <div class="official-footer">
        <div>
          * Conforme a la Orden de Calendario Escolar de la Consejería de Desarrollo Educativo y Formación Profesional de la Junta de Andalucía.
        </div>
        <div>
          SIGRE &bull; Sistema Integrado de Gestión y Régimen Escolar FP
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
