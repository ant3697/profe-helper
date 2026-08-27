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

    // Determine UD assignment key strictly
    let assignedUdKey: string | undefined = undefined;
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

    const isUdAssignment = Boolean(assignedUdKey);

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

  return { leftLegends: leftTags, rightLegends: rightTags };
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

    const effectiveType = override?.type || specialEvent?.type || (isWeekend ? "no_lectivo" : "lectivo");
    const isSpecial = isSpecialEventType(effectiveType);

    let displayBgColor = "transparent";
    let displayTextColor = isCurrentMonth ? (isWeekend ? "#ef4444" : "#cbd5e1") : "#475569";
    let hasSpecialPrevalence = false;
    let assignedUdColor: string | undefined = undefined;

    // Determine assigned UD color if present
    if (override?.assignedUdId) {
      const assignedLeg = legendMap.get(override.assignedUdId);
      if (assignedLeg) assignedUdColor = assignedLeg.color;
    } else if (legendItem && (legendItem.type === "ud_ra" || legendItem.type === "dual" || legendItem.type === "recuperacion")) {
      assignedUdColor = legendItem.color;
    }

    if (isCurrentMonth) {
      if (isSpecial) {
        // Special events PREVAIL visually
        const style = getOfficialEventStyle(effectiveType);
        displayBgColor = override?.customColor || specialEvent?.color || style.bgColor;
        displayTextColor = override?.customTextColor || style.textColor;
        hasSpecialPrevalence = true;
      } else if (override?.customColor) {
        displayBgColor = override.customColor;
        displayTextColor = override.customTextColor || "#0f172a";
      } else if (legendItem) {
        displayBgColor = legendItem.color;
        displayTextColor = legendItem.textColor || "#0f172a";
      }
    }

    return {
      dayNumber: dayNum,
      dateString: dateStr,
      dayOfWeek,
      isCurrentMonth,
      isWeekend,
      override,
      legendItem,
      isSpecialEvent: isSpecial,
      specialEventType: effectiveType,
      specialEventLabel: override?.title || specialEvent?.title || (isSpecial ? getOfficialEventStyle(effectiveType).label : undefined),
      assignedUdId: override?.assignedUdId,
      assignedUdCode: override?.assignedUdCode,
      assignedUdColor,
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
export function calculateAcademicCalendarStats(calendar: SigreAcademicCalendar) {
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

// Auto-distribute SIGRE UDs evenly across teaching weeks
export function autoDistributeUdsToCalendar(
  calendar: SigreAcademicCalendar,
  uds: SigreUDItem[],
  moduloCodigo: string = "TEMINS 0037"
): SigreAcademicCalendar {
  if (!uds || uds.length === 0) return calendar;

  const validSchoolDays: string[] = [];
  const months = getAcademicMonthsList(calendar.academicYear);

  months.forEach(({ year, month }) => {
    const monthData = generateMonthGrid(year, month, calendar);
    monthData.days
      .filter((d) => d.isCurrentMonth && !d.isWeekend)
      .forEach((d) => {
        if (d.dateString >= calendar.startDate && d.dateString <= calendar.endDate) {
          const type = d.override?.type;
          const isHoliday =
            type === "festivo_nacional" ||
            type === "festivo_autonomico" ||
            type === "festivo_local" ||
            type === "vacaciones_navidad" ||
            type === "vacaciones_semana_santa" ||
            type === "semana_blanca" ||
            type === "dia_comunidad_educativa" ||
            type === "no_lectivo";

          if (!isHoliday) {
            validSchoolDays.push(d.dateString);
          }
        }
      });
  });

  const totalLectivos = validSchoolDays.length;
  if (totalLectivos === 0) return calendar;

  const daysPerUd = Math.max(1, Math.floor(totalLectivos / uds.length));
  const newOverrides = { ...calendar.dayOverrides };
  const updatedLegendItems: SigreCalendarLegendItem[] = [
    ...calendar.legendItems.filter((l) => l.type !== "ud_ra"),
  ];

  uds.forEach((ud, index) => {
    const startIdx = index * daysPerUd;
    const endIdx = index === uds.length - 1 ? totalLectivos : Math.min(totalLectivos, (index + 1) * daysPerUd);
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
    const legId = `leg_auto_${ud.id || "ud_" + (index + 1)}`;
    const udCode = `${moduloCodigo ? moduloCodigo.split(" ")[0] : "MOD"}. ${ud.bcCode || "UD" + ud.number}`;

    updatedLegendItems.push({
      id: legId,
      code: udCode,
      title: `${udCode} (${ud.title || "Unidad Didáctica " + ud.number})`,
      type: "ud_ra",
      color: palette.bg,
      textColor: palette.text,
      udId: ud.id,
      monthTarget: firstMonthNum,
      sidePosition: index % 2 === 0 ? "left" : "right",
      dayRangeText: rangeText,
    });

    assignedDays.forEach((dateStr) => {
      const existing = newOverrides[dateStr];
      if (existing && isSpecialEventType(existing.type)) {
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
          customColor: palette.bg,
          customTextColor: palette.text,
          title: `${udCode}: ${ud.title}`,
        };
      }
    });
  });

  return {
    ...calendar,
    legendItems: updatedLegendItems,
    dayOverrides: newOverrides,
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
  const startYear = parseInt(parts[0], 10) || 2027;
  const endYear = parseInt(parts[1], 10) || startYear + 1;

  const startDate = `${startYear}-09-15`;
  const endDate = `${endYear}-06-24`;

  return {
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
    legendItems: [
      { id: "leg_ini_fp", code: "15 Sep", title: "Inicio Régimen Ordinario Formación Profesional", type: "hito", color: "#d8b4fe", sidePosition: "left", monthTarget: 9 },
      { id: "leg_eval_1", code: "16 Dic", title: "Sesión de Evaluación 1º Trimestre", type: "evaluacion", color: "#0284c7", textColor: "#ffffff", sidePosition: "right", monthTarget: 12 },
      { id: "leg_eval_2", code: "17 Mar", title: "Sesión de Evaluación 2º Trimestre", type: "evaluacion", color: "#0284c7", textColor: "#ffffff", sidePosition: "right", monthTarget: 3 },
      { id: "leg_eval_fin1", code: "28 May", title: "Sesión de Evaluación Final Ordinaria (1ª Final)", type: "evaluacion", color: "#0284c7", textColor: "#ffffff", sidePosition: "right", monthTarget: 5 },
      { id: "leg_fin_fp", code: "24 Jun", title: "Fin de clases y 2ª Sesión Final Extraordinaria", type: "hito", color: "#d946ef", textColor: "#ffffff", sidePosition: "right", monthTarget: 6 },
    ],
    dayOverrides: {
      [`${startYear}-09-15`]: { date: `${startYear}-09-15`, type: "inicio_fin_curso", customColor: "#d8b4fe", title: "Inicio de clases FP" },
      [`${startYear}-10-12`]: { date: `${startYear}-10-12`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Fiesta Nacional de España" },
      [`${startYear}-11-01`]: { date: `${startYear}-11-01`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Todos los Santos" },
      [`${startYear}-12-06`]: { date: `${startYear}-12-06`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Día de la Constitución" },
      [`${startYear}-12-08`]: { date: `${startYear}-12-08`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Inmaculada Concepción" },
      [`${startYear}-12-16`]: { date: `${startYear}-12-16`, type: "evaluacion_trimestral", customColor: "#0284c7", customTextColor: "#fff", title: "Sesión Evaluación 1T" },
      [`${startYear}-12-25`]: { date: `${startYear}-12-25`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Natividad del Señor" },
      [`${endYear}-01-01`]: { date: `${endYear}-01-01`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Año Nuevo" },
      [`${endYear}-01-06`]: { date: `${endYear}-01-06`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Epifanía del Señor" },
      [`${endYear}-02-27`]: { date: `${endYear}-02-27`, type: "dia_comunidad_educativa", customColor: "#f59e0b", customTextColor: "#fff", title: "Día de la Comunidad Educativa" },
      [`${endYear}-02-28`]: { date: `${endYear}-02-28`, type: "festivo_autonomico", customColor: "#16a34a", customTextColor: "#fff", title: "Día de Andalucía" },
      [`${endYear}-05-01`]: { date: `${endYear}-05-01`, type: "festivo_nacional", customColor: "#ef4444", customTextColor: "#fff", title: "Fiesta del Trabajo" },
      [`${endYear}-06-24`]: { date: `${endYear}-06-24`, type: "inicio_fin_curso", customColor: "#d946ef", customTextColor: "#fff", title: "Fin de clases" },
    },
    specialEvents: [],
    notes: `Calendario Escolar Oficial del curso ${startYear}/${endYear} para la comunidad autónoma de Andalucía.`,
  };
}

// Helper to format code inside legend chip (e.g. "3 Sep" -> "3", "23-31", "TEMINS. RA08", "Recuperación")
export function formatOfficialLegendChip(item: MonthLateralTag): string {
  // 1. If it's a UD / RA / Dual / Recuperation or multi-day period, ALWAYS display the distinctive UD / Period code
  const isMultiDayOrUd =
    item.type === "ud_ra" ||
    item.type === "dual" ||
    item.type === "recuperacion" ||
    item.id.startsWith("auto_ud_") ||
    item.id.startsWith("auto_period_") ||
    item.id.startsWith("leg_auto_") ||
    (item.code && !/^\d{1,2}(\s+[a-zA-ZáéíóúÁÉÍÓÚ]{3,})?$/.test(item.code.trim()));

  if (isMultiDayOrUd) {
    // Return clean UD or period code (e.g. "TEMINS. RA01", "TEMINS. RA08", "Recuperación", "FP Dual")
    return item.code;
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

// Render official printable HTML identical to the 2-column by 5-row view of Andalusian official bulletin / Consejería resolution
export function renderOfficialSchoolCalendarA4Html(calendar: SigreAcademicCalendar): string {
  const months = getAcademicMonthsList(calendar.academicYear);
  const stats = calculateAcademicCalendarStats(calendar);

  // Render a Month Calendar Table (Days Table with L M X J V S D)
  const renderMonthCalendarTable = (m: CalendarMonthData) => {
    return `
      <div style="border: 0.8px solid #000000; background: #ffffff; width: 100%; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 6.5px; font-family: Arial, Helvetica, sans-serif; table-layout: fixed; margin: 0; padding: 0;">
          <thead>
            <tr style="background-color: #cbd5e1 !important; color: #000000 !important; font-weight: bold; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">L</th>
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">M</th>
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">X</th>
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">J</th>
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">V</th>
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">S</th>
              <th style="border: 0.5px solid #000000; padding: 1px 0; width: 14.28%; font-size: 6px; text-align: center;">D</th>
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
                          } else if (d.displayBgColor && d.displayBgColor !== "transparent") {
                            cellBg = d.displayBgColor;
                            cellColor = d.displayTextColor;
                            titleTip = d.override?.title || d.legendItem?.title || "";
                          } else if (d.isWeekend) {
                            cellBg = "#f1f5f9";
                            cellColor = "#64748b";
                          }
                        } else {
                          cellBg = "#e2e8f0";
                          cellColor = "transparent";
                        }

                        const dayText = d.isCurrentMonth ? String(d.dayNumber) : "&nbsp;";

                        return `
                          <td style="border: 0.5px solid #334155; height: 9.5px; vertical-align: middle; background-color: ${cellBg} !important; color: ${cellColor} !important; font-weight: ${isBold ? "bold" : "normal"}; font-size: 6.5px; padding: 0; text-align: center; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;" title="${titleTip}">
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
              <div style="display: flex; align-items: flex-start; gap: 2px; line-height: 1.05; background: #ffffff; padding: 0.5px 1px; border: 0.5px solid #cbd5e1; box-sizing: border-box; margin-bottom: 0.5px;">
                <span style="background-color: ${item.color} !important; color: ${item.textColor || "#000000"} !important; border: 0.5px solid #000000; padding: 0.5px 2px; font-weight: bold; font-size: 5.5px; text-align: center; min-width: 11px; shrink: 0; display: inline-block; white-space: nowrap; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                  ${chipCode}
                </span>
                <span style="color: #0f172a; font-size: 5.5px; font-weight: 600; word-break: break-word; line-height: 1.0;">
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
      <div class="month-card">
        <!-- Month Header (Green banner matching the official Junta de Andalucía resolution) -->
        <div class="month-header">
          <span class="month-name">${monthTitle}</span>
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
    }
    .page-container {
      width: 100%;
      max-width: 288mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 1px;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 2px solid #007A33;
      padding-bottom: 2px;
      margin-bottom: 2.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
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
    }
    .header-subtitle {
      font-size: 6.5px;
      color: #1e293b;
      margin-top: 1px;
    }
    /* 5 COLUMNS x 2 ROWS RIGID LANDSCAPE GRID (10 MONTHS TOTAL: SEPTIEMBRE A JUNIO) */
    .calendar-grid-5x2 {
      display: grid !important;
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
      grid-template-rows: repeat(2, auto) !important;
      gap: 2.5px 3.5px !important;
      width: 100% !important;
      margin-bottom: 2.5px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .month-card {
      border: 1px solid #007A33 !important;
      background: #ffffff !important;
      display: flex !important;
      flex-direction: column !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      border-radius: 2px !important;
      overflow: hidden !important;
    }
    .month-header {
      background-color: #007A33 !important;
      color: #ffffff !important;
      font-weight: 800 !important;
      font-size: 6.5px !important;
      padding: 1.5px 3px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      letter-spacing: 0.1px !important;
      border-bottom: 0.5px solid #005a26 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .month-lectivos {
      font-size: 5.5px !important;
      font-weight: normal !important;
      opacity: 0.95;
      background: rgba(0, 0, 0, 0.25) !important;
      padding: 0.5px 2.5px !important;
      border-radius: 2px !important;
    }
    .month-body {
      display: grid !important;
      grid-template-columns: 24% 52% 24% !important;
      gap: 1.5px !important;
      padding: 1.5px !important;
      align-items: center !important;
      min-height: 48px !important;
      background: #f8fafc !important;
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
      border-radius: 2px !important;
    }
    .legend-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 1.5px 4px !important;
      font-size: 5.8px !important;
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
    }
    .official-footer {
      margin-top: 1.5px !important;
      font-size: 5.2px !important;
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
      }
      .calendar-grid-5x2, .month-card, .legend-bottom {
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

    <!-- 5 COLUMNS x 2 ROWS RIGID LANDSCAPE GRID (Septiembre a Junio) -->
    <div class="calendar-grid-5x2">
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
          <span class="chip-color" style="background: #ff00ff;"></span>
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
