import { TimelineEvent, TimelineColorPreset } from "../types/sigreTimeline";

export const TIMELINE_COLOR_PRESETS: TimelineColorPreset[] = [
  { name: "Por Defecto", bg: "", text: "", border: "", isDefault: true },
  { name: "Amarillo / Negro (A11y)", bg: "#ffd700", text: "#000000", border: "#000000" },
  { name: "Negro / Amarillo (A11y)", bg: "#000000", text: "#ffd700", border: "#ffd700" },
  { name: "Blanco / Azul Marino", bg: "#ffffff", text: "#000080", border: "#000080" },
  { name: "Azul Marino / Blanco", bg: "#000080", text: "#ffffff", border: "#ffffff" },
  { name: "Crema / Marrón", bg: "#fffdd0", text: "#4b3621", border: "#4b3621" },
  { name: "Verde Esmeralda", bg: "#10b981", text: "#000000", border: "#059669" },
  { name: "Rojo Marca Inexmoda / SIGRE", bg: "#dc0d15", text: "#ffffff", border: "#ffffff" },
  { name: "Ámbar SIGRE", bg: "#f59e0b", text: "#000000", border: "#d97706" },
  { name: "Cian Tecnológico", bg: "#06b6d4", text: "#000000", border: "#0891b2" },
  { name: "Púrpura Innovación", bg: "#a855f7", text: "#ffffff", border: "#9333ea" },
  { name: "Gris Pizarra", bg: "#475569", text: "#ffffff", border: "#334155" },
];

export const MONTH_COLORS_TIMELINE = [
  "#6610f2", // Ene (Índigo / Azul profundo)
  "#d63384", // Feb (Rosa / Magenta)
  "#20c997", // Mar (Verde Azulado / Teal)
  "#0dcaf0", // Abr (Cian)
  "#ffc107", // May (Ámbar / Amarillo)
  "#0d6efd", // Jun (Azul)
  "#6f42c1", // Jul (Púrpura)
  "#dc3545", // Ago (Carmesí / Rojo)
  "#198754", // Sep (Verde Bosque)
  "#6c757d", // Oct (Gris Pizarra)
  "#6f42c1", // Nov (Púrpura)
  "#fd7e14", // Dic (Naranja Brillante)
];

// Generates default course events for a given start year (e.g. 2025 -> 2025-2026)
export function getDefaultCursoTimelineEvents(startYear = 2025): TimelineEvent[] {
  const y1 = startYear;
  const y2 = startYear + 1;
  return [
    {
      id: 101,
      description: "Inicio del Curso Académico y Acogida del Alumnado",
      startDate: `${y1}-09-11`,
      endDate: `${y1}-09-11`,
      category: "lectivo",
      level: "curso",
      bgColor: "#06b6d4",
      textColor: "#000000",
      borderColor: "#0891b2",
    },
    {
      id: 102,
      description: "1er Trimestre Lectivo (Periodo Ordinario 1T)",
      startDate: `${y1}-09-11`,
      endDate: `${y1}-12-05`,
      category: "lectivo",
      level: "curso",
      bgColor: "#3b82f6",
      textColor: "#ffffff",
      borderColor: "#2563eb",
    },
    {
      id: 103,
      description: "1ª Sesión de Evaluación Parcial Ordinaria",
      startDate: `${y1}-12-10`,
      endDate: `${y1}-12-12`,
      category: "evaluacion",
      level: "curso",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 104,
      description: "Vacaciones de Navidad",
      startDate: `${y1}-12-22`,
      endDate: `${y2}-01-07`,
      category: "festivo",
      level: "curso",
      bgColor: "#ef4444",
      textColor: "#ffffff",
      borderColor: "#dc2626",
    },
    {
      id: 105,
      description: "2º Trimestre Lectivo (Periodo Ordinario 2T)",
      startDate: `${y2}-01-08`,
      endDate: `${y2}-03-27`,
      category: "lectivo",
      level: "curso",
      bgColor: "#10b981",
      textColor: "#000000",
      borderColor: "#059669",
    },
    {
      id: 106,
      description: "2ª Sesión de Evaluación Parcial Ordinaria",
      startDate: `${y2}-03-24`,
      endDate: `${y2}-03-26`,
      category: "evaluacion",
      level: "curso",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 107,
      description: "Vacaciones de Semana Santa",
      startDate: `${y2}-03-30`,
      endDate: `${y2}-04-06`,
      category: "festivo",
      level: "curso",
      bgColor: "#ef4444",
      textColor: "#ffffff",
      borderColor: "#dc2626",
    },
    {
      id: 108,
      description: "3er Trimestre Lectivo (Periodo Ordinario 3T)",
      startDate: `${y2}-04-07`,
      endDate: `${y2}-06-05`,
      category: "lectivo",
      level: "curso",
      bgColor: "#a855f7",
      textColor: "#ffffff",
      borderColor: "#9333ea",
    },
    {
      id: 109,
      description: "Última Sesión de Evaluación Final Ordinaria del Curso",
      startDate: `${y2}-06-08`,
      endDate: `${y2}-06-10`,
      category: "evaluacion",
      level: "curso",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 110,
      description: "Mes de Junio: Periodo de Recuperación de Aprendizajes No Adquiridos",
      startDate: `${y2}-06-11`,
      endDate: `${y2}-06-24`,
      category: "recuperacion",
      level: "curso",
      bgColor: "#eab308",
      textColor: "#000000",
      borderColor: "#ca8a04",
    },
    {
      id: 111,
      description: "Mes de Junio: Planificación del Siguiente Curso Escolar y Memorias",
      startDate: `${y2}-06-25`,
      endDate: `${y2}-06-30`,
      category: "lectivo",
      level: "curso",
      bgColor: "#64748b",
      textColor: "#ffffff",
      borderColor: "#475569",
    },
  ];
}

// Generates default teacher events for a given start year
export function getDefaultProfesorTimelineEvents(startYear = 2025): TimelineEvent[] {
  const y1 = startYear;
  const y2 = startYear + 1;
  return [
    {
      id: 201,
      description: "Claustro Inicial de Profesores y Asignación de Módulos",
      startDate: `${y1}-09-02`,
      endDate: `${y1}-09-02`,
      category: "reunion",
      level: "profesor",
      bgColor: "#3b82f6",
      textColor: "#ffffff",
      borderColor: "#1d4ed8",
    },
    {
      id: 202,
      description: "Reuniones Semanales de Departamento de Familia Profesional",
      startDate: `${y1}-09-15`,
      endDate: `${y2}-06-15`,
      category: "reunion",
      level: "profesor",
      bgColor: "#6366f1",
      textColor: "#ffffff",
      borderColor: "#4f46e5",
    },
    {
      id: 203,
      description: "Atención y Tutoría con Familias / Alumnado (Horario Semanal)",
      startDate: `${y1}-10-01`,
      endDate: `${y2}-05-30`,
      category: "tutoria",
      level: "profesor",
      bgColor: "#06b6d4",
      textColor: "#000000",
      borderColor: "#0891b2",
    },
    {
      id: 204,
      description: "Seguimiento Dual: Visitas a Empresas y Coordinación con Tutores Laborales",
      startDate: `${y1}-11-03`,
      endDate: `${y1}-11-28`,
      category: "dual",
      level: "profesor",
      bgColor: "#10b981",
      textColor: "#000000",
      borderColor: "#059669",
    },
    {
      id: 205,
      description: "Juntas de Evaluación Colegiada del 1er Trimestre",
      startDate: `${y1}-12-10`,
      endDate: `${y1}-12-12`,
      category: "evaluacion",
      level: "profesor",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 206,
      description: "Guardias de Aula y Sustituciones Previstas (2T)",
      startDate: `${y2}-01-12`,
      endDate: `${y2}-03-20`,
      category: "guardia",
      level: "profesor",
      bgColor: "#f43f5e",
      textColor: "#ffffff",
      borderColor: "#e11d48",
    },
    {
      id: 207,
      description: "Juntas de Evaluación Colegiada del 2º Trimestre",
      startDate: `${y2}-03-24`,
      endDate: `${y2}-03-26`,
      category: "evaluacion",
      level: "profesor",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 208,
      description: "Evaluación Final Ordinaria y Cierre de Actas Oficiales",
      startDate: `${y2}-06-08`,
      endDate: `${y2}-06-10`,
      category: "evaluacion",
      level: "profesor",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 209,
      description: "Claustro Final de Curso y Redacción de la Memoria Didáctica Anual",
      startDate: `${y2}-06-26`,
      endDate: `${y2}-06-30`,
      category: "reunion",
      level: "profesor",
      bgColor: "#475569",
      textColor: "#ffffff",
      borderColor: "#334155",
    },
  ];
}

// Generates default module events based on module settings
export function getDefaultModuloTimelineEvents(
  startYear = 2025,
  moduleTitle = "Módulo Profesional",
  totalHours = 160
): TimelineEvent[] {
  const y1 = startYear;
  const y2 = startYear + 1;
  return [
    {
      id: 301,
      description: `Presentación del Módulo: ${moduleTitle} (160h • 32 semanas)`,
      startDate: `${y1}-09-11`,
      endDate: `${y1}-09-12`,
      category: "lectivo",
      level: "modulo",
      bgColor: "#06b6d4",
      textColor: "#000000",
      borderColor: "#0891b2",
    },
    {
      id: 302,
      description: "1er Bloque Curricular: Fundamentos Técnicos y Normativa de Seguridad",
      startDate: `${y1}-09-15`,
      endDate: `${y1}-10-24`,
      category: "lectivo",
      level: "modulo",
      bgColor: "#3b82f6",
      textColor: "#ffffff",
      borderColor: "#2563eb",
    },
    {
      id: 303,
      description: "Prácticas de Taller y Simulación Electrotécnica (FCE Centro)",
      startDate: `${y1}-10-27`,
      endDate: `${y1}-11-28`,
      category: "practica",
      level: "modulo",
      bgColor: "#10b981",
      textColor: "#000000",
      borderColor: "#059669",
    },
    {
      id: 304,
      description: "Examen Parcial 1T y Entrega del 1er Dossier Práctico",
      startDate: `${y1}-12-01`,
      endDate: `${y1}-12-05`,
      category: "evaluacion",
      level: "modulo",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 305,
      description: "2º Bloque Curricular: Automatismos, Circuitos y Mantenimiento",
      startDate: `${y2}-01-08`,
      endDate: `${y2}-02-20`,
      category: "lectivo",
      level: "modulo",
      bgColor: "#a855f7",
      textColor: "#ffffff",
      borderColor: "#9333ea",
    },
    {
      id: 306,
      description: "Fase de Formación Práctica en Empresa (FFEOE Dual)",
      startDate: `${y2}-02-23`,
      endDate: `${y2}-03-20`,
      category: "dual",
      level: "modulo",
      bgColor: "#06b6d4",
      textColor: "#000000",
      borderColor: "#0891b2",
    },
    {
      id: 307,
      description: "Examen Parcial 2T y Evaluación de Competencias Duales",
      startDate: `${y2}-03-23`,
      endDate: `${y2}-03-27`,
      category: "evaluacion",
      level: "modulo",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 308,
      description: "3er Bloque Curricular: Diagnóstico Avanzado y Proyecto Integrado",
      startDate: `${y2}-04-07`,
      endDate: `${y2}-05-22`,
      category: "proyecto",
      level: "modulo",
      bgColor: "#ec4899",
      textColor: "#ffffff",
      borderColor: "#db2777",
    },
    {
      id: 309,
      description: "Defensa del Proyecto Final del Módulo y Examen 3T",
      startDate: `${y2}-05-25`,
      endDate: `${y2}-06-03`,
      category: "evaluacion",
      level: "modulo",
      bgColor: "#f59e0b",
      textColor: "#000000",
      borderColor: "#d97706",
    },
    {
      id: 310,
      description: "Sesiones de Recuperación y Refuerzo Extraordinario (Junio)",
      startDate: `${y2}-06-11`,
      endDate: `${y2}-06-23`,
      category: "recuperacion",
      level: "modulo",
      bgColor: "#eab308",
      textColor: "#000000",
      borderColor: "#ca8a04",
    },
  ];
}

// Generates default unit events for a specific UD
export function getDefaultUnidadTimelineEvents(
  startYear = 2025,
  udId = "UD01",
  udTitle = "Instalaciones y Mantenimiento",
  startDateStr = `${startYear}-09-15`
): TimelineEvent[] {
  const baseDate = new Date(startDateStr + "T00:00:00");
  const addDays = (d: Date, days: number) => {
    const next = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    const yyyy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, "0");
    const dd = String(next.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return [
    {
      id: 401,
      description: `${udId} - Sesión 1: Activación de Conocimientos Previos y Marco Normativo`,
      startDate: addDays(baseDate, 0),
      endDate: addDays(baseDate, 0),
      category: "lectivo",
      level: "unidad",
      udId,
      sesionNum: 1,
      horas: 1,
      bgColor: "#06b6d4",
      textColor: "#000000",
      borderColor: "#0891b2",
    },
    {
      id: 402,
      description: `${udId} - Sesión 2: Desarrollo Teórico, Simbología y Fórmulas Clave`,
      startDate: addDays(baseDate, 2),
      endDate: addDays(baseDate, 2),
      category: "lectivo",
      level: "unidad",
      udId,
      sesionNum: 2,
      horas: 1,
      bgColor: "#3b82f6",
      textColor: "#ffffff",
      borderColor: "#2563eb",
    },
    {
      id: 403,
      description: `${udId} - Sesión 3 y 4: Bloque de Taller Práctico y Montaje Guiado (FCE)`,
      startDate: addDays(baseDate, 4),
      endDate: addDays(baseDate, 7),
      category: "practica",
      level: "unidad",
      udId,
      sesionNum: 3,
      horas: 2,
      bgColor: "#10b981",
      textColor: "#000000",
      borderColor: "#059669",
    },
    {
      id: 404,
      description: `${udId} - Sesión 5: Simulación HDI Interactiva y Cuestionario de Autoevaluación`,
      startDate: addDays(baseDate, 9),
      endDate: addDays(baseDate, 9),
      category: "lectivo",
      level: "unidad",
      udId,
      sesionNum: 5,
      horas: 1,
      bgColor: "#a855f7",
      textColor: "#ffffff",
      borderColor: "#9333ea",
    },
    {
      id: 405,
      description: `${udId} - Sesión 6: Examen Oficial Tipo Test (GIFT 60 ítems) y Evaluación con Rúbrica`,
      startDate: addDays(baseDate, 11),
      endDate: addDays(baseDate, 11),
      category: "evaluacion",
      level: "unidad",
      udId,
      sesionNum: 6,
      horas: 1,
      bgColor: "#ef4444",
      textColor: "#ffffff",
      borderColor: "#dc2626",
    },
  ];
}
