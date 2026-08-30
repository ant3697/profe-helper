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
  docenteNombre?: string;
  desgloseCurricular: string;
  pedagogicalOptions?: SigrePedagogicalOptions;
  // Configuración de horas y dimensionamiento curricular
  horasTotales?: number; // Horas totales del módulo (ej. 160h, 200h)
  horasSemanales?: number; // Horas lectivas semanales (ej. 4h, 5h, 6h)
  numUnidadesDidacticas?: number; // Número de UDs objetivo (0 o undefined = automático por bloques)
  semanasCurso?: number; // Total de semanas lectivas del curso (defecto 32 semanas: incluye FFEOE práctica y FCE práctica UDs)
  duracionSesionMinutos?: number; // Duración media de la sesión lectiva en minutos (ej. 50, 55, 60, 120 min para taller)
  horasPorSesion?: number; // Horas por sesión lectiva (defecto 1h, o 2h para bloques taller)
  totalSesionesPrevistas?: number; // Número total de sesiones lectivas previstas para el módulo
  incluyePeriodoRecuperacionJunio?: boolean; // Periodo de recuperación de aprendizajes no adquiridos tras la última sesión de evaluación ordinaria en junio
  incluyePlanificacionSiguienteCursoJunio?: boolean; // Periodo de planificación del siguiente curso lectivo en junio
  // Formación Profesional Dual (LO 3/2022 y RD 659/2023)
  etapaCiclo?: "basico" | "medio" | "superior" | "especializacion"; // Grado D Básico, Medio, Superior o Grado E Especialización
  regimenDual?: "general" | "intensivo"; // Régimen General (20-35% empresa) vs Intensivo (>35-50% empresa)
  porcentajeDual?: number; // % del ciclo formativo en empresa (ej. 20%, 25%, 35%, 50%)
  horasFceModulo?: number; // Horas en Centro Educativo (FCE) para el módulo (ej. 130h)
  horasFfeoeModulo?: number; // Horas en Empresa / Organismo Equiparado (FFEOE) para el módulo (ej. 30h)
  // Configuración de Evaluaciones y Parciales
  numParciales?: number; // Número de evaluaciones parciales / trimestres por curso (por defecto 3)
  // Gestor de Horarios y Guardias
  scheduleConfig?: SigreScheduleConfig;
}

export type SigreTeacherReductionType =
  | "mayor_55"
  | "jefatura_dpto"
  | "coordinacion_ffeoe"
  | "coordinacion_innovacion"
  | "coordinacion_ateca"
  | "coordinacion_prl"
  | "coordinacion_erasmus"
  | "coordinacion_bilingue"
  | "coordinacion_tic"
  | "equipo_directivo"
  | "tutoria"
  | "lactancia_guarda"
  | "personalizada";

export interface SigreTeacherReduction {
  id: string;
  tipo: SigreTeacherReductionType;
  nombre: string;
  horasLectivas: number; // Reducción de horas lectivas
  horasComplementarias?: number; // Horas complementarias asignadas a esta función
  normativaRef?: string; // ej. "LO 3/2022 y RD 659/2023", "Acuerdo Marco >55 años", "ROC Centros FP"
  activo: boolean;
}

export interface SigreTeacher {
  id: string; // "EVM", "PBG", "VHC", "BGJL", "DMA", "DPA", "EAR"...
  code: string; // "EVM-Mont", "PBG-Gloria"...
  name: string; // "Montserrat Elena", "Gloria Perera"...
  department?: string; // "Instalación y Mantenimiento / Térmicas y Frío"
  email?: string;
  color?: string; // Hex o clase Tailwind para distintivo visual
  // Jornada y permanencia según normativa docente
  horasPermanenciaCentro?: number; // Por defecto 30h semanales (25h regulares + 5h no fijas / 37.5h totales)
  horasLectivasBase?: number; // Por defecto 18h lectivas ordinarias (LOMLOE / Ley 4/2019)
  isMayor55?: boolean; // Reducción automática de 2h lectivas para mayores de 55 años
  reducciones?: SigreTeacherReduction[];
  observaciones?: string;
}

export interface SigreNormativaItem {
  id: string;
  code: string; // ej. "LO 3/2022", "RD 659/2023", "Decreto 102/2023", "Orden 20/06/1997", "Ley 4/2019", "Decreto 327/2010"
  title: string;
  category: "andalucia_autonomica" | "estatal" | "jornada_horarios" | "reducciones_edad" | "fp_dual_desdobles";
  officialScope: "Andalucía (BOJA)" | "Estatal (BOE)" | "Consejería de Desarrollo Educativo";
  publicationRef: string; // ej. "BOJA núm. 90 de 15/05/2023", "BOE núm. 77 de 31/03/2022"
  status: "vigente" | "actualizada" | "en_aplicacion";
  isVigenteAndalucia: boolean;
  lastCheckedDate: string; // ej. "2026-08-26"
  summary: string;
  keyPoints: string[];
  applicabilityNotes: string;
  legalArticles?: string;
  sourceUrl?: string;
}

export type SigreScheduleSlotType =
  | "clase"
  | "guardia"
  | "guardia_recreo"
  | "reunion_dpto"
  | "tutoria"
  | "coordinacion"
  | "libre"
  | "otro";

export interface SigreTimeSlot {
  id: string; // "1", "2", "3", "recreo", "4", "5", "6", "tardes"
  label: string; // "1ª", "2ª", "3ª", "RECREO", "4ª", "5ª", "6ª", "TARDES"
  timeRange: string; // "8:30-9:30", "9:30-10:30", "10:30-11:30", "11:30-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "17:00-18:00"
  isBreak?: boolean;
}

export interface SigreScheduleCell {
  day: "L" | "M" | "X" | "J" | "V";
  slotId: string;
  type: SigreScheduleSlotType;
  code?: string; // ej. "GUA", "CALOR 0302", "IEAUT 0038", "METER 0036", "SOLAR 0392", "GAS 0393", "IP 2 1710", "CTOP.", "PROY. 1713"
  subject?: string; // ej. "Instalaciones de Producción de Calor"
  classroom?: string; // ej. "Aula 2º Calor / Nave 2º", "Aula-taller 1º Frío", "Pasillo/Patio"
  group?: string; // ej. "1º CFGM Calor", "2º CFGM Frío", "2º CFGM Calor"
  teacherId?: string; // ID del profesor principal
  sharedWith?: string[]; // IDs o nombres de profesores adicionales en co-docencia/desdoble
  notes?: string;
}

export interface SigreGroupSchedule {
  id: string; // "cfgm_calor_1", "cfgm_calor_2", "cfgm_frio_1", "cfgm_frio_2"
  name: string; // "2º CFGM Técnico en Instalaciones de Producción de Calor"
  shortName: string; // "2º Calor", "1º Frío"...
  cells: SigreScheduleCell[];
}

export type SigreCalendarDayType =
  | "lectivo"
  | "festivo_nacional"
  | "festivo_autonomico"
  | "festivo_local"
  | "vacaciones_navidad"
  | "vacaciones_semana_santa"
  | "semana_blanca"
  | "dia_comunidad_educativa"
  | "no_lectivo"
  | "evaluacion_inicial"
  | "evaluacion_trimestral"
  | "evaluacion_final"
  | "evaluacion_extraordinaria"
  | "periodo_dual_empresa"
  | "periodo_recuperacion"
  | "inicio_fin_curso"
  | "otro_evento";

export interface SigreCalendarLegendItem {
  id: string;
  code: string; // ej. "UD01. BC7 (14h/7s)", "DUAL", "16 Dic", "RECUP"
  title: string; // "[UD01] [BC7] [14/160h] [7 sesiones] Prevención de riesgos laborales y protección ambiental"
  type: "ud_ra" | "evaluacion" | "dual" | "recuperacion" | "festivo" | "vacaciones" | "hito" | "otro";
  color: string; // Hex color code (e.g., "#fed7aa", "#bae6fd", "#fef08a", "#bbf7d0", "#e9d5ff", "#fecdd3")
  textColor?: string;
  borderColor?: string;
  udId?: string; // ID de la SigreUDItem vinculada si procede (ej. "UD01", "UD02")
  bcCode?: string; // Código de bloque o resultado (ej. "BC7", "BC1", "RA08")
  horasAsignadas?: number; // Horas asignadas a la UD
  totalHoras?: number; // Total horas del módulo
  sesiones?: number; // Número de sesiones de la UD
  monthTarget?: number; // 9=Sep, 10=Oct...
  sidePosition?: "left" | "right";
  dayRangeText?: string; // ej. "15-30", "02/02 - 20/02 - 120h"
  notes?: string;
}

export interface SigreCalendarSpecialEvent {
  date: string; // "YYYY-MM-DD"
  title: string;
  type: SigreCalendarDayType;
  color?: string;
  description?: string;
  legendItemId?: string;
}

export interface SigreCalendarDayOverride {
  date: string; // "YYYY-MM-DD"
  type: SigreCalendarDayType;
  title?: string;
  legendItemId?: string; // Vinculación a SigreCalendarLegendItem (UD / RA / Hito)
  assignedUdId?: string; // UD programada para este periodo si el día es festivo/evento especial
  assignedUdCode?: string; // e.g. "UD02. RA01"
  customColor?: string;
  customTextColor?: string;
  notes?: string;
}

export interface SigreAcademicCalendar {
  id: string;
  academicYear: string; // "2026-2027", "2025-2026", etc.
  region: string; // "Andalucía"
  province: string; // "Málaga", "Sevilla", "Granada", "Cádiz", "Córdoba", "Jaén", "Almería", "Huelva"
  resolutionRef: string; // "Resolución de 20 de mayo de 2026 de la Delegación Territorial en Málaga (BOJA/Consejería)"
  resolutionUrl?: string; // "https://www.juntadeandalucia.es/educacion/portales/w/260522_del_calendescolar"
  educationalStage: string; // "Formación Profesional / Secundaria / Bachillerato"
  startDate: string; // "2026-09-15" (Inicio clases FP)
  endDate: string; // "2027-06-24" (Fin régimen ordinario FP)
  moduloFormativo?: string; // ej. "Técnicas de montaje de instalaciones térmicas"
  codigoModulo?: string; // ej. "TEMINS 0037"
  cicloFormativo?: string; // ej. "1º CFGM Instalaciones Frigoríficas y de Climatización"
  docente?: string; // ej. "Montserrat Elena (EVM)"
  totalLectivosEstimated?: number; // 175 días lectivos FP
  legendItems: SigreCalendarLegendItem[];
  dayOverrides: Record<string, SigreCalendarDayOverride>;
  specialEvents: SigreCalendarSpecialEvent[];
  notes?: string;
}

export interface SigreScheduleConfig {
  teachers: SigreTeacher[];
  timeSlots: SigreTimeSlot[];
  teacherSchedules: Record<string, SigreScheduleCell[]>; // teacherId -> cells
  groupSchedules?: SigreGroupSchedule[];
  selectedTeacherId?: string;
  selectedGroupId?: string;
  activeView?: "profesores" | "guardias_general" | "grupos" | "normativa" | "calendario_escolar";
  academicCalendars?: SigreAcademicCalendar[];
  activeCalendarId?: string;
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
  trimestre?: number; // 1: 1º Trimestre (P1), 2: 2º Trimestre (P2), 3: 3º Trimestre (P3), 4: 4º Parcial
  horasFce?: number; // Horas lectivas en Centro Educativo
  horasFfeoe?: number; // Horas estimadas en Empresa / Organismo Equiparado
  status: "pending" | "generating" | "completed" | "error";
  error?: string;
  // Entregables generados
  data?: SigreUDData;
}

export interface SigreUDCurricularData {
  // 1. ÍNDICE GENERAL DEL TEMA
  indiceGeneral: string[];
  // 2. TEMPORALIZACIÓN (número de horas/sesiones semanales)
  temporalizacion: {
    horas: number;
    sesiones: number;
    fechaRealizacion: string; // ej. "Septiembre", "Octubre (Semanas 3-4)"
    trimestre: string; // ej. "1º", "2º", "3º"
    horasSemanalesTexto?: string; // ej. "11 horas (4 sesiones)"
  };
  // 3. CONTEXTUALIZACIÓN
  contextualizacion: string;
  // 4. JUSTIFICACIÓN Y NORMATIVA
  justificacionNormativa: string;
  // 5. CONTRIBUCIÓN A LOS OBJETIVOS GENERALES
  contribucionObjetivosGenerales: string; // ej. "s) Tomar decisiones de forma fundamentada..."
  // 6. COMPETENCIAS BÁSICAS
  competenciasBasicas: string[]; // ej. ["Comunicación técnica y normativa profesional.", "Sentido de la responsabilidad..."]
  // 7. RESULTADOS DE APRENDIZAJE
  resultadosAprendizaje: string[]; // ej. ["RA 6: Cumple las normas de prevención de riesgos laborales..."]
  // 8. CONTRIBUCIÓN A LAS COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES
  contribucionCompetenciasProfesionales: string; // ej. "r) Organizar y coordinar equipos de trabajo con responsabilidad."
  // 9. OBJETIVOS DE APRENDIZAJE
  objetivosAprendizaje: string[]; // 1. Identificar..., 2. Reconocer...
  // 10. CONTENIDOS INTEGRADOS
  contenidosIntegrados: {
    conceptuales: string[];
    procedimentales: string[];
    actitudinales: string[];
    peculiaridadesAutonomicas?: string[]; // ej. Referencias a peculiaridades de Andalucía / Comunidad Autónoma
    temasTransversales?: string[]; // ej. Educación ambiental, Cultura preventiva...
  };
  // 11. TEMAS TRANSVERSALES
  temasTransversalesTexto: string;
  // 12. METODOLOGÍA Y USO DE LAS TIC
  metodologiaTic: {
    metodologiasActivas: string; // ej. "Aprendizaje Basado en Retos (ABR)..."
    flippedClassroom?: string;
    duaMetodologia?: string;
    innovacionIa?: string;
    secuenciacionMetodologica?: string; // ej. "1. Análisis visual -> 2. Ensayo -> 3. Diagnóstico..."
  };
  // 13. ATENCIÓN A LA DIVERSIDAD
  atencionDiversidad: {
    dua: string; // ej. "Fichas técnicas con códigos QR a vídeos..."
    multinivel?: string; // ej. "Itinerarios de profundización..."
    refuerzo: string; // ej. "Glosarios técnicos ilustrados..."
    ampliacion: string; // ej. "Investigación sobre materiales inteligentes..."
    accesibilidad?: string; // ej. "Diseño de rutas de evacuación libres de barreras..."
  };
  // 14. TEMPORALIZACIÓN Y SECUENCIACIÓN DE ACTIVIDADES [Iniciación, Desarrollo, Repaso, Refuerzo, Ampliación, Evaluación]
  secuenciacionActividades: {
    iniciacionDesarrollo: {
      horas: string; // ej. "(3h+3h)"
      actividades: { codigo: string; nombre: string; descripcion?: string }[];
    };
    repasoRefuerzo: {
      horas: string; // ej. "(3h)"
      actividades: { codigo: string; nombre: string; descripcion?: string }[];
    };
    ampliacionEvaluacion: {
      horas: string; // ej. "(2h)"
      actividades: { codigo: string; nombre: string; descripcion?: string }[];
    };
  };
  // 15. EVALUACIÓN [Inicial, Parcial, Final - ¿Qué evaluar?, ¿Cómo evaluar?, ¿Cuándo evaluar?]
  evaluacion: {
    inicial: string; // "Sondeo de nivel preventivo (Semana 1)"
    parcial: string; // "Observación sistemática en taller (uso de EPIs)"
    final: string; // "Ponderación del examen de habilitación y casos prácticos"
  };
  // 16. INSTRUMENTOS DE EVALUACIÓN
  instrumentosEvaluacion: string[]; // ["Pasaporte de Seguridad (Moodle)", "Lista de cotejo de EPIs", "Observación sistemática"]
  // 17. RESULTADOS DE APRENDIZAJE Y SUS CRITERIOS DE EVALUACIÓN [Alcanzados / Ponderados %]
  criteriosEvaluacionPonderados: {
    raGlobal: string; // ej. "RA 6 y RA 2 (11,13% global)"
    criterios: { criterio: string; descripcion: string; peso: string }[];
    criteriosTexto?: string;
  };
  // 18. MATERIALES Y RECURSOS DIDÁCTICOS
  materialesRecursos: string[];
  // 19. BIBLIOGRAFÍA Y WEBGRAFÍA
  bibliografiaWebgrafia: string[];
}

export interface SigreUDData {
  cotRazonamiento?: string;
  glosarioHtml?: string;

  // Módulo 1: Unidad Didáctica de Aula Completa (8 secciones)
  modulo1: {
    titulo: string; // Título de la UD
    introduccion: string; // 2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN
    contenidos: {
      conceptuales: string[];
      procedimentales: string[];
      actitudinales: string[];
    }; // 3. CONTENIDOS ESPECÍFICOS
    objetivosSmart: string[]; // 4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)
    indiceDesarrollo: string; // 1. ÍNDICE / Guion de epígrafes (5.1, 5.2, 5.3...)
    desarrolloEpigrafesHtml: string; // 5. DESARROLLO (Epígrafes 5.1, 5.2...)
    referenciasNormativasHtml?: string; // 6. REFERENCIAS NORMATIVAS
    bibliografiaWebgrafiaHtml?: string; // 7. BIBLIOGRAFÍA Y WEBGRAFÍA
    conclusiones: string; // 8. CONCLUSIONES Y SÍNTESIS DEL TEMA
    relacionIntradisciplinar: string; // Intradisciplinaridad y conexión curricular
    diagramaMermaid: string; // Diagrama de Flujo (Mermaid flowchart TD)
    mapaMentalOpml: string; // Mapa Mental OPML XML
    cotRazonamiento?: string; // Análisis y diseño pedagógico anticolisión
    glosarioHtml?: string; // Glosario y fórmulas Test-Wiseness
    autoevaluacionHtml: string; // Cuestionario de autoevaluación (20 preguntas)
  };

  // Unidad Didáctica Curricular (19 Puntos - Ficha / Matriz Curricular Oficial)
  udCurricular?: SigreUDCurricularData;

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
  activeTab: "ud_completa" | "ud_curricular" | "cuestionario_autoeval" | "recursos_docente" | "programacion_eval" | "diagrama_flujo" | "hdi_interactiva";
  isAnalyzingCurriculum: boolean;
  isGeneratingUd: boolean;
  isGeneratingHdi: boolean;
  progressMessage: string;
}
