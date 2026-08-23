export type OmrSheetType =
  | "20 Question Form"
  | "50 Question Form (1)"
  | "50 Question Form (2)"
  | "100 Question Form"
  | "omr-20"
  | "omr-30"
  | "omr-50"
  | "custom-oposicion";

export interface OmrQuestionGrade {
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  isBlank: boolean;
  isMultiple?: boolean;
  confidence: number; // 0 - 100
  pointsEarned?: number;
  tags?: string[];
}

export interface OmrScanResult {
  id: string;
  quizId?: string;
  timestamp: number;
  studentId: string;
  studentName: string;
  className: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  multipleMarksCount?: number;
  penaltyPerWrong: number; // e.g. 0, 0.33 (1/3), 0.25 (1/4)
  rawScore: number;
  maxScore: number;
  percentage: number;
  grade10: number; // Scale 0-10
  passed: boolean;
  questionGrades: OmrQuestionGrade[];
  capturedImageUrl?: string;
  keyUsed?: string;
  fiducialsLocked?: boolean;
  overallConfidence?: number;
  flaggedQuestions?: number[];
  sensitivityUsed?: "normal" | "high" | "pencil" | "pen";
}

export interface OmrClassStatistics {
  totalScanned: number;
  minScore: number;
  maxScore: number;
  minPercent: number;
  maxPercent: number;
  averageScore: number;
  averagePercent: number;
  medianScore: number;
  medianPercent: number;
  standardDeviation: number;
  standardDeviationPercent: number;
  passedCount: number;
  failedCount: number;
  passPercentage: number;
  averageGrade?: number;
  highestGrade?: number;
  lowestGrade?: number;
  hardestQuestions: Array<{
    questionNumber: number;
    errorRate: number;
    correctAnswer: string;
    mostCommonWrongAnswer?: string;
  }>;
}

export interface ZipGradeClass {
  id: string;
  name: string;
  quizIds: string[];
  studentIds: string[];
  createdAt: number;
}

export interface ZipGradeStudent {
  id: string;
  studentZipGradeId: string;
  firstName: string;
  lastName: string;
  classId?: string;
  className?: string;
  email?: string;
}

export interface ZipGradeTag {
  id: string;
  name: string;
  description?: string;
  category?: "RA" | "CE" | "THEME" | "OTHER";
}

export interface ZipGradeQuizKey {
  id: string;
  name: string; // e.g. "A: PRINCIPAL", "B: VARIANTE 2"
  answers: Record<number, string>; // { 1: "B", 2: "C", ... }
  points: Record<number, number>; // { 1: 1, 2: 1, ... }
  tags: Record<number, string[]>; // { 1: ["RA04", "CE4.a"], ... }
}

export interface ZipGradeQuiz {
  id: string;
  name: string; // e.g. "Rec RA04 Tipo A"
  sheetType: OmrSheetType;
  date: string; // e.g. "2026-06-10"
  folder: string; // e.g. "Main Folder"
  classes: string[]; // e.g. ["TEMINS 25_26"]
  tags: string[]; // e.g. ["RA04"]
  totalQuestions: number;
  penaltyPerWrong: number; // default 0.33
  keys: ZipGradeQuizKey[];
  activeKeyId: string;
  scannedDocuments: OmrScanResult[];
  createdAt: number;
  updatedAt: number;
}

export interface ZipGradeItemAnalysisRow {
  questionNumber: number;
  correctAnswer: string;
  points: number;
  totalAnswers: number;
  correctCount: number;
  correctPercent: number;
  distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    blank: number;
  };
  tags: string[];
  discriminationIndex?: number;
}

export interface ZipGradeTagReportRow {
  tag: string;
  questionCount: number;
  questions: number[];
  totalPossiblePoints: number;
  earnedPoints: number;
  masteryPercent: number;
  status: "high" | "medium" | "low";
}

