export type TopicDepth = "resumen" | "estandar" | "catedratico";

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
