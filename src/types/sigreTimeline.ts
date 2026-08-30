// Types for Multi-Level Timeline & Cronogramas (Curso, Profesor, Módulo, Unidad)

export type TimelineLevel = "curso" | "profesor" | "modulo" | "unidad";

export type TimelineEventCategory =
  | "lectivo"
  | "evaluacion"
  | "dual"
  | "festivo"
  | "vacaciones"
  | "hito"
  | "reunion"
  | "practica"
  | "recuperacion"
  | "tutoria"
  | "guardia"
  | "proyecto"
  | "otro";

export interface TimelineEvent {
  id: number;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (if empty or same as startDate, treated as milestone/hito)
  hidden?: boolean;
  forcedPosition?: "top" | "bottom" | null;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  category?: TimelineEventCategory;
  level?: TimelineLevel;
  moduleId?: string; // e.g. "cal_2026_2027_malaga_andalucia" or "0392"
  moduleCode?: string; // e.g. "0392", "DIG 1664", "TEMINS 0037"
  udId?: string; // e.g. "UD01", "UD02" for unit-level events
  sesionNum?: number; // e.g. 1, 2, 3... for lesson sessions
  horas?: number;
  notes?: string;
}

export interface TimelineColorPreset {
  name: string;
  bg: string;
  text: string;
  border: string;
  isDefault?: boolean;
}

export interface SigreCourseTimelineItem {
  id: string;
  name: string;
  category?: string; // e.g. "General", "1º Curso FP", "2º Curso FP Dual", "Departamento"
  academicYear?: string;
  events: TimelineEvent[];
}

export interface MultiLevelTimelineData {
  schoolYear: string; // e.g. "2025-2026" or "2026-2027"
  activeLevel: TimelineLevel;
  activeModuleId?: string;
  activeCursoCronogramaId?: string;
  cursoEvents: TimelineEvent[];
  cursoCronogramas?: SigreCourseTimelineItem[]; // Multiple course-level timelines
  profesorEvents: TimelineEvent[];
  moduloEvents: TimelineEvent[];
  moduloEventsByModule?: Record<string, TimelineEvent[]>; // keyed by moduleId e.g. "cal_2026_2027_dig_1664"
  unidadEvents: Record<string, TimelineEvent[]>; // keyed by udId e.g. "UD01"
}

export interface TimelineScale {
  minDate: Date;
  maxDate: Date;
  pixelsPerDay: number;
}
