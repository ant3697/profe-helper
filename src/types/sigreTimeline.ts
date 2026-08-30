// Types for Multi-Level Timeline & Cronogramas (Curso, Profesor, Módulo, Unidad)

export type TimelineLevel = "curso" | "profesor" | "modulo" | "unidad";

export type TimelineEventCategory =
  | "lectivo"
  | "evaluacion"
  | "dual"
  | "festivo"
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

export interface MultiLevelTimelineData {
  schoolYear: string; // e.g. "2025-2026" or "2026-2027"
  activeLevel: TimelineLevel;
  cursoEvents: TimelineEvent[];
  profesorEvents: TimelineEvent[];
  moduloEvents: TimelineEvent[];
  unidadEvents: Record<string, TimelineEvent[]>; // keyed by udId e.g. "UD01"
}

export interface TimelineScale {
  minDate: Date;
  maxDate: Date;
  pixelsPerDay: number;
}
