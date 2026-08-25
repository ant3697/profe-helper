export type SigreUserLevel = 1 | 2 | 3 | 4; // 1: Secundaria, 2: Bachillerato/FP, 3: Universitarios, 4: Doctorados/Oposiciones

export interface SigrePedagogicalOptions {
  testWiseness: boolean; // Glosario, Fórmulas, Anti-flaws, Homogeneidad sintáctica
  cotAnticolision: boolean; // Chain of Thought Reasoning, Desglose y Unicidad Conceptual
  practicaIntercalada: boolean; // Apuntes del Experto, Conexión Interdisciplinar y Variedad
  activeRecall: boolean; // Cajas de Autoevaluación Rápida continua por epígrafe
  mnemotecnias: boolean; // Reglas Mnemotécnicas y trucos de memoria
  antiTunel: boolean; // Visión Holística, Anti-Visión de Túnel, Distribución Simétrica
}

export interface SigrePedagogicalAuditResult {
  testWisenessScore: number; // 0-100%
  homogeneityRate: number; // % homogeneidad opciones
  longestOptionWinRate: number; // % acierto longitud (objetivo <= 40%)
  cotReasoning: string; // Resumen del análisis anticolisión
  interleavedDomains: string[]; // Dominios temáticos intercalados
  activeRecallCount: number; // Número de puntos de recuperación activa
  mnemonicsCount: number; // Reglas mnemotécnicas insertadas
  antiTunelCoverage: string; // Cobertura de apartados y equilibrio
  passedAll: boolean;
}

export interface SigreRagDocument {
  id: string;
  name: string;
  size: number;
  type: string; // "pdf" | "docx" | "txt" | "image" | "other"
  text: string;
  wordCount: number;
  uploadedAt: string;
  extractedSummary?: {
    moduloFormativo?: string;
    codigo?: string;
    cicloFormativo?: string;
    bloquesCount?: number;
    rasCount?: number;
  };
}

export interface SigreCurricularConfig {
  iterations: number; // 1 a 5 (defecto 3)
  adhesion: number; // 1 a 5 (1: Muy Creativo, 3: Equilibrado, 5: Estricto)
  userLevel: SigreUserLevel;
  moduloFormativo: string;
  codigo: string;
  cicloFormativo: string;
  familiaProfesional: string;
  curso: string;
  curriculoReferencia: string;
  contextoAplicacion: string;
  desgloseCurricular: string;
  pedagogicalOptions?: SigrePedagogicalOptions;
  // Configuración de horas y dimensionamiento curricular
  horasTotales?: number; // Horas totales del módulo (ej. 160h, 200h)
  horasSemanales?: number; // Horas lectivas semanales (ej. 4h, 5h, 6h)
  numUnidadesDidacticas?: number; // Número de UDs objetivo (0 o undefined = automático por bloques)
}

export interface SigreUDItem {
  id: string; // "UD01", "UD02"...
  number: number; // 1, 2...
  bcCode: string; // "BC7", "BC1"...
  title: string;
  fullCode: string; // "UD01. BC7. Prevención de riesgos laborales..."
  isPrl: boolean;
  horasEstimadas?: number; // Horas lectivas estimadas para esta UD (ej. 16)
  sesionesEstimadas?: number; // Sesiones estimadas de clase (ej. 8)
  status: "pending" | "generating" | "completed" | "error";
  error?: string;
  // Entregables generados
  data?: SigreUDData;
}

export interface SigreUDData {
  cotRazonamiento?: string;
  glosarioHtml?: string;

  // Módulo 1: Unidad Didáctica Completa
  modulo1: {
    titulo: string; // 1.1
    introduccion: string; // 1.2
    contenidos: {
      conceptuales: string[];
      procedimentales: string[];
      actitudinales: string[];
    }; // 1.3
    objetivosSmart: string[]; // 1.4 (5-8)
    indiceDesarrollo: string; // 1.5
    desarrolloEpigrafesHtml: string; // 1.6 (HTML o Markdown enriquecido A4)
    autoevaluacionHtml: string; // 1.7 (20 preguntas con soluciones en negrita)
    conclusiones: string; // 1.8
    relacionIntradisciplinar: string; // 1.9
    diagramaMermaid: string; // 1.10 (flowchart TD)
    mapaMentalOpml: string; // 1.11 (XML OPML)
    cotRazonamiento?: string; // Análisis y diseño pedagógico anticolisión
    glosarioHtml?: string; // Glosario y fórmulas Test-Wiseness
  };

  // Auditoría Pedagógica Consolidada
  pedagogicalAudit?: SigrePedagogicalAuditResult;

  // Material de Apoyo para el Docente (Recursos Digitales)
  recursosDocente: {
    bancoGiftParte1: string; // 2.1 Preguntas 01-30
    bancoGiftParte2: string; // 2.1 Preguntas 31-60
    giftFullText: string;
    propuestaExamenHtml: string; // 2.2 (20 preguntas A, B, C, D)
    solucionarioExamenHtml: string; // 2.3 (Justificación técnica)
    propuestaHdiConceptual: string; // 2.4 (150-200 palabras)
    longitudAudit?: {
      totalQuestions: number;
      longestOptionWins: number;
      longestOptionWinRate: number; // porcentaje (ej. 25%)
      passesCriterion: boolean; // <= 40%
    };
  };

  // Material Complementario (Programación y Evaluación)
  programacionEval: {
    vinculacionCurricularHtml: string; // 3.1
    matrizAlineacionHtml: string; // 3.2.1 (Tabla RA | CrEv | Evidencias | Instrumentos | Peso %)
    tablaActividadesHtml: string; // 3.2.2 (Tabla Actividad | Técnica | Agrupamiento | Recursos | Instrumento)
    rubricasXml: string; // 3.2.3 (XML con nodos <criterio>)
  };

  // Módulo 2: Herramienta Didáctica Interactiva (HDI)
  hdi?: {
    prdMarkdown: string; // Fase 1: PRD
    appHtmlCode: string; // Fase 2 & 3: Código fuente HTML5 + CSS + JS ejecutable
    justificacionPedagogica: string; // Informe final en Markdown
    nombreApp: string;
  };
}

export interface SigreCurricularState {
  config: SigreCurricularConfig;
  uds: SigreUDItem[];
  selectedUdId: string | null;
  activeTab: "ud_completa" | "cuestionario_autoeval" | "recursos_docente" | "programacion_eval" | "diagrama_flujo" | "hdi_interactiva";
  isAnalyzingCurriculum: boolean;
  isGeneratingUd: boolean;
  isGeneratingHdi: boolean;
  progressMessage: string;
}
