export type TopicDepth = "resumen" | "estandar" | "catedratico";
export type TopicGenerationMode = "rapido" | "modular";

export interface TopicSectionPlan {
  id: string;
  sectionNumber: string; // e.g. "3.1", "3.2", "4", "5"
  title: string; // e.g. "Termodinámica Básica y Ciclos Frigoríficos"
  description?: string; // Brief guidance on what to cover
  status: "pending" | "generating" | "completed" | "error";
  generatedHtml?: string;
  wordCount?: number;
}

export interface TopicOutlineBlueprint {
  topicTitle: string;
  introductionSummary: string;
  sections: TopicSectionPlan[];
  includeConclusion: boolean;
  includeBibliography: boolean;
  includeNormative: boolean;
  includeGlossary: boolean;
}

export interface TopicAuditOptions {
  glossary: boolean;
  cot: boolean;
  pedagogic: boolean;
  recall: boolean;
  mnemotecnias: boolean;
  antitunel: boolean;
}

export interface TopicUploadedFile {
  id: string;
  name: string;
  text: string;
  size?: number;
  active?: boolean;
}

export interface ExtractedActiveRecallQuestion {
  questionNumber: number;
  questionText: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface GeneratedTopicVersion {
  id: number;
  topic: string;
  depth: TopicDepth | "recuperado";
  html: string;
  timestamp: number;
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  modelName?: string;
  extractedQuestions?: ExtractedActiveRecallQuestion[];
}

export interface TopicGenerationRequest {
  topic: string;
  depth: TopicDepth;
  numSubapartados: number;
  activeOptions: TopicAuditOptions;
  aggregatedContent?: string;
  extraContext?: string;
  providerId?: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}
