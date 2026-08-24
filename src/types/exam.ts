export type DifficultyLevel = "easy" | "standard" | "killer";
export type EvaluationMode = "instant" | "deferred";
export type FormatTab = "interactive" | "gift" | "txt-full" | "txt-correct" | "json";
export type CreativityStyle = "literal" | "balanced" | "interpretive";
export type QuestionFilter = "all" | "unanswered" | "flagged" | "incorrect" | "correct";

export interface ExamOption {
  text: string;
  isCorrect: boolean;
  origOId: number;
}

export interface ExamQuestion {
  enunciado: string;
  opciones: string[];
  indiceCorrecta: number;
  justificacion: string;
  origQId?: number;
  opcionesObjs?: ExamOption[];
  userSelectedIndex?: number | null;
  isAnswered?: boolean;
  flagged?: boolean;
}

export interface ExamBlock {
  titulo: string;
  preguntas: ExamQuestion[];
}

export interface ExamData {
  analisis_anticolision?: string;
  bloques: ExamBlock[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  text: string;
  role: "base" | "exam";
  timestamp: number;
  size?: number;
  active?: boolean;
}

export interface ThematicGroup {
  id: string;
  grupo: string;
  temas: string[];
  selected: boolean;
}

export interface ExamSessionScore {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  grade10: string;
  percentage: number;
}

export interface GenerationTokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}
