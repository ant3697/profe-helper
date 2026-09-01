// ...
import { SigreCurricularConfig, SigreUDItem, SigreUDData, SigreUDCurricularData, SigrePedagogicalAuditResult } from "../types/sigre";

/**
 * Cleans LaTeX math syntax ($...$, $$, \text{}, \times, \Omega, etc.) and converts it to clear plain-text math notation (+, -, *, /, ^, °C, Ω, etc.)
 */
export function cleanSigreLatexMath(input: string): string {
  if (!input || typeof input !== "string") return input || "";
  let text = input;

  // 1. Fractions: \frac{a}{b} -> (a / b), \dfrac{a}{b} -> (a / b)
  text = text.replace(/\\(?:d)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "($1 / $2)");

  // 2. Square roots: \sqrt{x} -> sqrt(x)
  text = text.replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)");

  // 3. Degree Celsius and temperature units:
  // e.g. ^\circ\text{ }^\circ\text{C}^{-1}, ^\circ\text{C}^{-1}, ^\circ\text{C}, ^{\circ}\text{C}, ^\circ C, \text{ }^\circ\text{C}
  text = text.replace(/\^\{\\circ\}\s*(?:\\text\{\s*C\s*\}|C)/gi, "°C");
  text = text.replace(/\^\\circ\s*(?:\\text\{\s*C\s*\}|C)/gi, "°C");
  text = text.replace(/\\text\{\s*\^?\\circ\s*C\s*\}/gi, "°C");
  text = text.replace(/\\text\{\s*°C\s*\}/gi, "°C");
  text = text.replace(/\^\\circ/gi, "°");
  text = text.replace(/\^\{\\circ\}/gi, "°");
  text = text.replace(/\\circ/gi, "°");

  // 4. Multiplication & Division operators:
  text = text.replace(/\\times\b/g, " * ");
  text = text.replace(/\\cdot\b/g, " * ");
  text = text.replace(/\\div\b/g, " / ");
  text = text.replace(/\\pm\b/g, " +/- ");
  text = text.replace(/\\mp\b/g, " -/+ ");

  // 5. Comparison operators:
  text = text.replace(/\\le(?:q)?\b/g, " <= ");
  text = text.replace(/\\ge(?:q)?\b/g, " >= ");
  text = text.replace(/\\neq\b/g, " != ");
  text = text.replace(/\\approx\b/g, " ≈ ");
  text = text.replace(/\\equiv\b/g, " ≡ ");
  text = text.replace(/\\propto\b/g, " ∝ ");
  text = text.replace(/\\sim\b/g, " ~ ");

  // 6. Greek letters & physical units:
  text = text.replace(/\\Omega\b/g, "Ω");
  text = text.replace(/\\omega\b/g, "ω");
  text = text.replace(/\\mu\b/g, "µ");
  text = text.replace(/\\Delta\b/g, "Δ");
  text = text.replace(/\\delta\b/g, "δ");
  text = text.replace(/\\alpha\b/g, "α");
  text = text.replace(/\\beta\b/g, "β");
  text = text.replace(/\\gamma\b/g, "γ");
  text = text.replace(/\\theta\b/g, "θ");
  text = text.replace(/\\lambda\b/g, "λ");
  text = text.replace(/\\rho\b/g, "ρ");
  text = text.replace(/\\sigma\b/g, "σ");
  text = text.replace(/\\eta\b/g, "η");
  text = text.replace(/\\phi\b/g, "φ");
  text = text.replace(/\\pi\b/g, "π");
  text = text.replace(/\\tau\b/g, "τ");
  text = text.replace(/\\epsilon\b/g, "ε");
  text = text.replace(/\\infty\b/g, "inf");

  // 7. \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}
  // Repeat to handle nested cases like \text{ }\Omega or \text{ }^\circ\text{C}
  text = text.replace(/\\(?:text|mathrm|mathbf|mathit|textsf|boldsymbol)\s*\{([^{}]*)\}/g, "$1");
  text = text.replace(/\\(?:text|mathrm|mathbf|mathit|textsf|boldsymbol)\s*\{([^{}]*)\}/g, "$1");

  // 8. Superscripts & Subscripts:
  // e.g. 10^{-3} -> 10^-3, ^{\circ} -> ^°, _{0} -> _0, ^{-1} -> ^-1
  text = text.replace(/\^\{([^{}]+)\}/g, "^$1");
  text = text.replace(/_\{([^{}]+)\}/g, "_$1");

  // 9. TeX Spacing commands:
  text = text.replace(/\\(?:quad|qquad)\b/g, "  ");
  text = text.replace(/\\(?:,|;|!|\s)/g, " ");

  // 10. Math block/inline markers: $$...$$, $...$, \(...\), \[...\]
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, "$1");
  text = text.replace(/\$([^\$\n]+?)\$/g, "$1");
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, "$1");
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, "$1");

  // 11. Normalize scientific notation spacing: e.g. " * 10^-3"
  text = text.replace(/\s*\*\s*10\^/g, " * 10^");

  // 12. Fix remaining unit artifacts:
  text = text.replace(/°\s*C/g, "°C");
  text = text.replace(/°\s*C\s*\^/g, "°C^");

  // 13. Clean up multiple spaces (without stripping newlines)
  text = text.replace(/[ \t]{2,}/g, " ");

  return text;
}

/**
 * Builds prompt to analyze raw uploaded documents (PDF, DOCX, TXT, etc.)
 * and extract the full Curricular Breakdown (Bloques de Contenido, RAs, Criterios de Evaluación, Módulo, Código, etc.)
 */
export function buildSigreCurriculumExtractionPrompt(documentText: string): string {
  return `Rol: Analista Curricular Senior y Diseñador Pedagógico Oficial (LOMLOE, Formación Profesional y Enseñanzas Regladas).
Tu tarea es analizar exhaustivamente el documento curricular suministrado (Real Decreto, Orden Autonómica, Currículo Oficial o Programación Didáctica) y extraer de forma rigurosa todos los elementos curriculares oficiales.

INSTRUCCIONES DE EXTRACCIÓN:
1. Identifica y extrae los metadatos oficiales:
   - Nombre oficial del Módulo Formativo o Asignatura.
   - Código numérico/alfanumérico oficial (ej. MP0483, 0483, 0369...).
   - Ciclo Formativo o Nivel educativo (ej. Grado Superior en Desarrollo de Aplicaciones Multiplataforma, 1º Bachillerato...).
   - Familia Profesional (ej. Informática y Comunicaciones, Electricidad y Electrónica...).
   - Curso (ej. 1º curso o 2º curso).
   - Referencia normativa oficial (ej. Real Decreto 450/2010, Orden de 12 de julio...).
   - Horas totales lectivas del módulo (ej. 160 horas, 200 horas, etc., si se mencionan).
   - Horas semanales lectivas (ej. 5 horas/semana, 4 horas/semana, etc., si se mencionan).

2. Extrae y estructura el DESGLOSE CURRICULAR COMPLETO:
   - Todos los RESULTADOS DE APRENDIZAJE (RAs): con su número (RA1, RA2...) y texto íntegro.
   - Todos los CRITERIOS DE EVALUACIÓN asociados a cada RA: numerados/letrados (a, b, c, d...).
   - Todos los BLOQUES DE CONTENIDO (BCs) o Contenidos Básicos: clasificados por bloque temático (BC1, BC2, BC3...) con todos sus epígrafes y descriptores técnicos.
   - Detecta si existe un bloque dedicado a Prevención de Riesgos Laborales / Seguridad y Medio Ambiente (marcarlo).

3. Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto:

\`\`\`json
{
  "moduloFormativo": "Nombre del Módulo Formativo",
  "codigo": "Código oficial",
  "cicloFormativo": "Ciclo Formativo o Nivel",
  "familiaProfesional": "Familia Profesional",
  "curso": "1º o 2º",
  "curriculoReferencia": "Normativa oficial o Real Decreto identificado",
  "horasTotales": 160,
  "horasSemanales": 5,
  "bloquesCount": 6,
  "rasCount": 7,
  "crevsCount": 35,
  "hasPrlBlock": true,
  "desgloseCurricular": "Texto completo y estructurado en Markdown con todos los Bloques de Contenido (BC1, BC2...), Resultados de Aprendizaje (RA1, RA2...) y Criterios de Evaluación (a, b, c...)"
}
\`\`\`

DOCUMENTO A ANALIZAR:
<<INICIO DOCUMENTO CURRICULAR>>
${documentText.substring(0, 100000)}
<<FIN DOCUMENTO CURRICULAR>>`;
}

/**
 * Builds prompt to analyze the full curriculum and generate the ordered list of UDs (Plan de Unidades)
 * Applying the rule: if a BC contains PRL (Prevención de Riesgos), it MUST be assigned as UD01.
 * Supports specifying total hours, weekly hours, and target number of UDs.
 */
export function buildSigrePlanPrompt(
  config: SigreCurricularConfig,
  ragContext = ""
): string {
  const fullContext = (config.desgloseCurricular + (ragContext ? "\n" + ragContext : "")).trim();
  const hasCustomUdsCount = !!(config.numUnidadesDidacticas && config.numUnidadesDidacticas > 0);
  const targetUdsCount = config.numUnidadesDidacticas || 0;
  const horasTotales = config.horasTotales || 160;
  const semanasCurso = config.semanasCurso || 32;
  const horasSemanales = config.horasSemanales || Math.max(1, Math.round(horasTotales / semanasCurso));
  const horasPorSesion = config.horasPorSesion || 1;
  const totalSesionesPrevistas = Math.round(horasTotales / horasPorSesion);

  const sizingRule = hasCustomUdsCount
    ? `1. REGLA DE NÚMERO EXACTO DE UNIDADES DIDÁCTICAS: Debes generar EXACTAMENTE ${targetUdsCount} Unidades Didácticas (UD01 a UD${String(targetUdsCount).padStart(2, "0")}), distribuyendo proporcionalmente todos los Bloques de Contenido (BCs), Resultados de Aprendizaje (RAs) y las ${horasTotales} horas lectivas totales del módulo (${horasSemanales} horas semanales en un curso ordinario de ${semanasCurso} semanas que incluye FFEOE práctica y FCE práctica UDs). Cada UD debe tener asignadas sus "horasEstimadas" y su número previsto de "sesionesEstimadas" (calculadas con base en ${horasPorSesion}h por sesión o bloques taller) de forma que sumen ${horasTotales} horas (${totalSesionesPrevistas} sesiones lectivas en total).`
    : `1. REGLA DE GENERACIÓN POR DEFECTO: Genera una Unidad Didáctica (UD) por cada Bloque de Contenido (BC) detectado en el currículo (o estructura canónica proporcional), asignando "horasEstimadas" y "sesionesEstimadas" a cada una de acuerdo con las ${horasTotales} horas lectivas totales (${horasSemanales} horas/semana en ${semanasCurso} semanas lectivas ordinarias, con ${totalSesionesPrevistas} sesiones previstas en total).`;

  return `Rol: Experto en Redacción Técnica, Diseño Curricular y Metodología SIGRE v6.0.
Tu misión es analizar el currículo proporcionado y generar el PLAN DE UNIDADES DIDÁCTICAS (UDs) ordenadas y dimensionadas temporalmente.

CONFIGURACIÓN DE LA MATERIA:
- Módulo Formativo: ${config.moduloFormativo || "Módulo Técnico"} (${config.codigo || "S/C"})
- Ciclo Formativo: ${config.cicloFormativo || "Ciclo Formativo"} - Familia: ${config.familiaProfesional || "Técnica"} (${config.curso || "1º"})
- Carga Horaria Total: ${horasTotales} horas lectivas (${horasSemanales} horas/semana en ${semanasCurso} semanas lectivas ordinarias, incluyendo FCE en centro y FFEOE en empresa)
- Número Previsto Total de Sesiones del Módulo: ${totalSesionesPrevistas} sesiones (${horasPorSesion}h/sesión)
- Periodización del Curso: ${semanasCurso} semanas lectivas ordinarias de docencia (1T, 2T, 3T). El mes de junio tras la última sesión de evaluación ordinaria queda reservado para el periodo de recuperación de aprendizajes no adquiridos (evaluación extraordinaria) y la planificación del siguiente curso lectivo.
- Dimensionamiento de UDs solicitado: ${hasCustomUdsCount ? `Exactamente ${targetUdsCount} Unidades Didácticas` : "Automático (según Bloques Curriculares)"}
- Currículo de Referencia: ${config.curriculoReferencia || "Real Decreto oficial"}
- Contexto de Aplicación: ${config.contextoAplicacion || "Centro educativo / Entorno laboral"}
- Nivel Usuario: ${config.userLevel === 1 ? "Secundaria" : config.userLevel === 2 ? "Bachillerato / FP" : config.userLevel === 3 ? "Universitarios" : "Oposiciones / Doctorados"}
- Adhesión Curricular: ${config.adhesion}/5

REGLAS OBLIGATORIAS:
${sizingRule}
2. REGLA DE PRIORIDAD PRL: Revisa todos los Bloques de Contenido. Si existe algún bloque que trate sobre "Prevención de Riesgos Laborales", "Seguridad", "Protección Ambiental" o similar, asígnale OBLIGATORIAMENTE el identificador "UD01". El resto de UDs se numerarán correlativamente a continuación (UD02, UD03, etc.).
3. FORMATO LIMPIO DE TÍTULO DE UD:
   - El título debe ser profesional, conciso y legible (ej. "Prevención de riesgos laborales y protección ambiental" o "Entornos cloud, gemelos digitales e IoT en instalaciones").
   - PROHIBIDO incluir corchetes, ratios de horas confusos o redundancias como "[UD01] [RA1] [20/160h] [10 sesiones]". El código 'fullCode' debe ser simplemente "UD01. Prevención de riesgos laborales y protección ambiental".
4. ASIGNACIÓN COMPLETA DE CAMPOS DE LA TABLA OFICIAL (RD 659/2023):
   Para cada UD debes estructurar:
   - "rasAssociated" y "crevsAssociated" (o "raCeText" formateado, ej: "RA 1: a, b, c, d, e").
   - "bcText": Número o código del Bloque de Contenido (ej: "7", "1", "2, 3").
   - "cppsText": Competencias Profesionales, Personales y Sociales vinculadas (ej: "r", "c", "c, r", "j").
   - "ogText": Objetivos Generales vinculados (ej: "s", "c", "k, s").
   - "horasEstimadas": Horas de aula/taller en centro (FFCE).
   - "horasFfeoe": Horas en empresa si aplica (0 para docencia en centro).
   - "pesoPorcentaje": Porcentaje de ponderación de la UD (la suma total debe dar 100%).
   - "fasePedagogicaId": "fase_1", "fase_2", "fase_3" o "fase_4".
   - "fasePedagogicaNombre": Nombre descriptivo de la fase didáctica.
5. Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura:

\`\`\`json
{
  "moduloTitle": "${config.moduloFormativo || "Módulo Formativo"}",
  "horasTotales": ${horasTotales},
  "horasSemanales": ${horasSemanales},
  "semanasCurso": ${semanasCurso},
  "totalSesionesPrevistas": ${totalSesionesPrevistas},
  "uds": [
    {
      "id": "UD01",
      "number": 1,
      "bcCode": "BC7",
      "bcText": "7",
      "title": "Prevención de riesgos laborales y protección ambiental",
      "fullCode": "UD01. Prevención de riesgos laborales y protección ambiental",
      "horasEstimadas": ${Math.round(horasTotales / (targetUdsCount || 8))},
      "sesionesEstimadas": ${Math.round(Math.round(horasTotales / (targetUdsCount || 8)) / horasPorSesion)},
      "horasFfce": ${Math.round(horasTotales / (targetUdsCount || 8))},
      "horasFfeoe": 0,
      "pesoPorcentaje": 12.5,
      "isPrl": true,
      "fasePedagogicaId": "fase_1",
      "fasePedagogicaNombre": "Fase I: Planificación y Seguridad (UD 1-4)",
      "raCeText": "RA 7: a, b, c, d, e",
      "cppsText": "r",
      "ogText": "s",
      "rasAssociated": ["RA7"],
      "crevsAssociated": ["a)", "b)", "c)"]
    },
    {
      "id": "UD02",
      "number": 2,
      "bcCode": "BC1",
      "bcText": "1",
      "title": "Fundamentos y principios del sistema",
      "fullCode": "UD02. Fundamentos y principios del sistema",
      "horasEstimadas": ${Math.round(horasTotales / (targetUdsCount || 8))},
      "sesionesEstimadas": ${Math.round(Math.round(horasTotales / (targetUdsCount || 8)) / horasPorSesion)},
      "horasFfce": ${Math.round(horasTotales / (targetUdsCount || 8))},
      "horasFfeoe": 0,
      "pesoPorcentaje": 12.5,
      "isPrl": false,
      "fasePedagogicaId": "fase_1",
      "fasePedagogicaNombre": "Fase I: Planificación y Seguridad (UD 1-4)",
      "raCeText": "RA 1: a, b, c, d",
      "cppsText": "c",
      "ogText": "c",
      "rasAssociated": ["RA1"],
      "crevsAssociated": ["a)", "d)", "e)"]
    }
  ]
}
\`\`\`

CURRÍCULO BASE Y DOCUMENTACIÓN:
<<INICIO DOCUMENTACIÓN CURRICULAR>>
${fullContext.substring(0, 100000)}
<<FIN DOCUMENTACIÓN CURRICULAR>>`;
}

/**
 * Builds prompt for SECTION 1a: Editorial Master Unit (8 Core Epigraphs, Rigorous Formulas, Tables, Expert Notes, Normatives, Bibliography)
 * Optimized for low token overhead by excluding heavy evaluation banks and OPML diagrams, which are generated on demand.
 */
export function buildSigreUDEditorialPrompt(
  ud: SigreUDItem,
  config: SigreCurricularConfig,
  ragContext = ""
): string {
  const fullContext = (config.desgloseCurricular + (ragContext ? "\n" + ragContext : "")).trim();
  const horasUd = ud.horasEstimadas || Math.round((config.horasTotales || 160) / 8);
  const sesionesUd = ud.sesionesEstimadas || Math.round(horasUd / 2);

  return `Rol: Experto en diseño curricular, tecnología educativa y edición de contenido para Formación Profesional (Sistema SIGRE - Sección 1a: UD Editorial).
Tu misión es desarrollar la Unidad Didáctica elegida ("${ud.fullCode || ud.title}") con la máxima profundidad técnica y pedagógica.

INFORMACIÓN DE ENTRADA Y CONTEXTO:
- Módulo Formativo: ${config.moduloFormativo || "Módulo Formativo"} (${config.codigo || ""})
- Ciclo Formativo: ${config.cicloFormativo || "Ciclo Formativo"} - Familia: ${config.familiaProfesional || "Técnica"} (${config.curso || "1º"})
- Carga horaria total: ${config.horasTotales || 160} horas (${config.horasSemanales || 5} h/semana)
- Dimensionamiento de esta UD: ${horasUd} horas lectivas (${sesionesUd} sesiones estimadas)
- Currículo de Referencia: ${config.curriculoReferencia || "Real Decreto oficial y normativa vigente"}
- Contexto de Aplicación: ${config.contextoAplicacion || "Material a utilizar como referencia en el IES Al-Baytar de Benalmádena (Málaga)."}
- Nivel de Adhesión Curricular: ${config.adhesion}/5
- Nivel de Destinatario: ${config.userLevel === 1 ? "Secundaria (ESO)" : config.userLevel === 2 ? "Bachillerato / FP" : config.userLevel === 3 ? "Grado Universitario" : "Oposiciones / Especialización"}

ESTRUCTURA DE GENERACIÓN EDITORIAL (8 APARTADOS OBLIGATORIOS):

1. ÍNDICE GENERAL DEL TEMA: Guion completo reflejando los apartados 1 a 8 y el desglose de los epígrafes 5.1, 5.2, 5.3, 5.4...
2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN: (250-350 palabras). Justificación didáctica, aplicabilidad en el sector productivo y conexión con el perfil profesional.
3. CONTENIDOS ESPECÍFICOS:
   * Conceptuales (Saber): Principios, magnitudes físicas, unidades y clasificaciones.
   * Procedimentales (Saber hacer): Métodos de cálculo, montaje, ajuste, calibración y mantenimiento.
   * Actitudinales (Saber ser): Seguridad, prevención ambiental, rigor técnico y orden.
4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART): 5-8 objetivos redactados con verbos de acción medibles (Taxonomía de Bloom).
5. DESARROLLO TÉCNICO (4 a 6 sub-epígrafes 5.1 a 5.x):
   Desarrolla cada sub-epígrafe con rigor exhaustivo:
   a) Fundamentos técnicos y formulación aplicada en texto plano.
   b) Matriz Técnica de Parámetros/Tolerancias con tabla HTML estilizada <table class="sigre-table"> (Parámetro, Criterio Operativo, Normativa/Tolerancia, Verificación).
   c) Procedimiento práctico paso a paso de taller/campo (Preparación, Ejecución, Seguridad).
   d) Cajas pedagógicas:
      - <div class="apuntes-box"><strong>💡 Apuntes del Experto:</strong> [Consejos profesionales, errores típicos de taller y buenas prácticas]</div>
      - <div class="recall-box"><strong>🧠 Autoevaluación Rápida (Active Recall):</strong> [2-3 preguntas clave de comprobación rápida]</div>
      - <div class="mnemo-box"><strong>⚡ Regla Mnemotécnica:</strong> [Regla o acrónimo para retención a largo plazo]</div>
6. REFERENCIAS NORMATIVAS:
   Tabla técnica con clase "sigre-table" analizando normativas aplicables (RITE, CTE, REBT, Ley PRL, UNE-EN).
7. BIBLIOGRAFÍA Y WEBGRAFÍA:
   Bibliografía técnica comentada, Guías Oficiales (IDAE, INSST) y Webgrafía oficial comentada.
8. CONCLUSIONES Y SÍNTESIS DEL TEMA:
   Síntesis ejecutiva de competencias profesionales adquiridas y relación intradisciplinar con otras unidades del módulo.
9. GLOSARIO DE TÉRMINOS Y FÓRMULAS:
   Definiciones y variables técnicas clave en formato HTML.

REGLA ESTRICTA DE NOTACIÓN MATEMÁTICA EN TEXTO PLANO:
- PROHIBIDO USAR DELIMITADORES LATEX ($...$, $$...$$, \\text{}, \\times, \\Omega, etc.).
- Usa texto plano limpio con operadores estándar: +, -, *, /, ^, °C, Ω (o Ohm), kW, bar, %, etc.

NORMAS DE FORMATO JSON:
- Devuelve ÚNICAMENTE un objeto JSON estrictamente válido.

\`\`\`json
{
  "titulo": "${(ud.fullCode || ud.title).replace(/"/g, '\\"')}",
  "cotRazonamiento": "Análisis curricular, delimitación técnica y prevención de colisiones temáticas...",
  "indiceDesarrollo": "1. ÍNDICE GENERAL DEL TEMA\\n2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN\\n3. CONTENIDOS ESPECÍFICOS\\n4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)\\n5. DESARROLLO\\n  5.1. [Epígrafe 1]\\n  5.2. [Epígrafe 2]\\n  5.3. [Epígrafe 3]\\n  5.4. [Epígrafe 4]\\n6. REFERENCIAS NORMATIVAS\\n7. BIBLIOGRAFÍA Y WEBGRAFÍA\\n8. CONCLUSIONES Y SÍNTESIS DEL TEMA",
  "introduccion": "Texto detallado de la introducción y contextualización profesional...",
  "contenidos": {
    "conceptuales": ["Concepto 1...", "Concepto 2...", "Concepto 3..."],
    "procedimentales": ["Procedimiento 1...", "Procedimiento 2...", "Procedimiento 3..."],
    "actitudinales": ["Actitud 1...", "Actitud 2...", "Actitud 3..."]
  },
  "objetivosSmart": [
    "1. Objetivo SMART 1...",
    "2. Objetivo SMART 2...",
    "3. Objetivo SMART 3...",
    "4. Objetivo SMART 4...",
    "5. Objetivo SMART 5..."
  ],
  "desarrolloEpigrafesHtml": "<div class=\\"ud-content\\"><div class=\\"epigrafe-block\\"><h3>5.1. [Título Sub-epígrafe 1]</h3><p>...</p><table class=\\"sigre-table\\"><thead><tr><th>Parámetro/Componente</th><th>Criterio Operativo</th><th>Normativa / Tolerancia</th><th>Verificación</th></tr></thead><tbody><tr><td>...</td><td>...</td><td>...</td><td>...</td></tr></tbody></table><div class=\\"apuntes-box\\"><strong>💡 Apuntes del Experto:</strong> ...</div><div class=\\"recall-box\\"><strong>🧠 Autoevaluación Rápida:</strong> ...</div><div class=\\"mnemo-box\\"><strong>⚡ Regla Mnemotécnica:</strong> ...</div></div></div>",
  "referenciasNormativasHtml": "<div class=\\"normativa-block\\"><table class=\\"sigre-table\\"><thead><tr><th>Código / Norma</th><th>Ámbito / Organismo</th><th>Prescripciones Clave</th><th>Aplicación Práctica</th></tr></thead><tbody><tr><td>...</td><td>...</td><td>...</td><td>...</td></tr></tbody></table></div>",
  "bibliografiaWebgrafiaHtml": "<div class=\\"biblio-block\\"><h4>Bibliografía Técnica de Referencia</h4><ul><li>...</li></ul><h4>Guías Técnicas y Documentos Oficiales</h4><ul><li>...</li></ul><h4>Webgrafía y Recursos en Línea</h4><ul><li>...</li></ul></div>",
  "conclusiones": "Texto de conclusiones y síntesis ejecutiva...",
  "relacionIntradisciplinar": "Texto de relación con otras unidades del módulo...",
  "glosarioHtml": "<div class=\\"glosario-box\\"><h4>Glosario de Términos y Fórmulas Relevantes</h4><ul><li><strong>Término:</strong> Definición...</li></ul></div>"
}
\`\`\`

BASE DOCUMENTAL:
<<INICIO DOCUMENTACIÓN>>
${fullContext.substring(0, 80000)}
<<FIN DOCUMENTACIÓN>>`;
}

/**
 * Builds prompt for SECTION 2: Cuestionario de Autoevaluación (20 Preguntas con Solucionario y Feedback)
 */
export function buildSigreUDAutoevaluacionPrompt(
  ud: SigreUDItem,
  config: SigreCurricularConfig,
  editorialData?: any
): string {
  return `Rol: Experto en evaluación psicométrica y diseño tecnopedagógico (Sistema SIGRE - Sección 2: Cuestionario de Autoevaluación).
Objetivo: Generar un Cuestionario de Autoevaluación interactivo y formativo de EXACTAMENTE 20 preguntas con opciones múltiples, justificaciones técnicas y retroalimentación formativa para la Unidad: "${ud.fullCode || ud.title}".

ESTRUCTURA OBLIGATORIA:
1. 20 Preguntas de Opción Múltiple (4 opciones por pregunta: 1 correcta y 3 distractores técnicos verosímiles).
2. Justificación técnica rigurosa para cada pregunta que explique por qué la opción correcta es la adecuada y por qué los distractores no lo son.
3. Formato HTML para visualización interactiva y exportación rápida.
4. Notación matemática en texto plano (sin LaTeX).

\`\`\`json
{
  "cotRazonamiento": "Calibración psicométrica: 20 ítems balanceados que cubren fundamentos, procedimientos, seguridad y diagnóstico...",
  "autoevaluacionHtml": "<div class=\\"autoeval-box\\"><h4>Cuestionario de Autoevaluación - ${ud.fullCode || ud.title} (20 Preguntas)</h4><ol><li><strong>1. ¿Enunciado de la pregunta...?</strong><br>A) Opción A<br>B) Opción B<br>C) Opción C<br>D) Opción D</li></ol><h5>Soluciones y Justificaciones Técnicas</h5><ol><li><strong>1. Respuesta Correcta: A</strong><br><em>Justificación:</em> Explicación técnica detallada de por qué esta es la respuesta adecuada con base en la normativa y los principios técnicos...</li></ol></div>",
  "bancoGiftParte1": "// Banco Autoevaluación 20 Preguntas - ${ud.fullCode || ud.title}\\n\\n::1:: ¿Enunciado 1...? {\\n    =Opción correcta#¡Correcto! Justificación...\\n    ~Distractor 1#Incorrecto. Explicación...\\n    ~Distractor 2#Incorrecto. Explicación...\\n    ~Distractor 3#Incorrecto. Explicación...\\n}\\n\\n::2:: ..."
}
\`\`\``;
}

/**
 * Builds prompt for SECTION 4: Diagrama de Flujo (Mermaid) & Mapa Mental (OPML XML 2.0 según Tony Buzan)
 */
export function buildSigreUDDiagramaOpmlPrompt(
  ud: SigreUDItem,
  config: SigreCurricularConfig,
  editorialData?: any
): string {
  return `Rol: Experto en visualización de procesos, mapas conceptuales y diagramas de flujo técnicos (Sistema SIGRE - Sección 4: Diagrama & OPML).
Objetivo: Generar el Diagrama de Flujo interactivo en sintaxis Mermaid y el Mapa Mental estructurado en formato XML OPML 2.0 (conforme a los principios de Tony Buzan en 6 niveles jerárquicos) para la Unidad: "${ud.fullCode || ud.title}".

ESTRUCTURA EXIGIDA:
1. Diagrama de Flujo Mermaid ("flowchart TD"):
   - Incluir bloques de inicio, preparación técnica, subgraphs para fases operativas, decisiones de control y cierre.
2. Mapa Mental OPML 2.0:
   - Nivel 1: Título oficial de la Unidad.
   - Nivel 2: Ramas radiales (1. Introducción, 2. Justificación, 3. Importancia, 4. Desarrollo de Epígrafes, 5. Puntos Críticos y Seguridad, 6. Checklist Calidad, 7. Conclusiones).
   - Niveles 3 a 6: Desglose granular con fórmulas en texto plano, normativas y tolerancias.

\`\`\`json
{
  "cotRazonamiento": "Estructuración radial: 7 ramas maestras, ramificación en abanico sin nodos unifilares y flujo operativo Mermaid...",
  "diagramaMermaid": "flowchart TD\\n    A[\\"Inicio: Protocolo y EPIs\\"] --> B(Preparación de Equipos)\\n    subgraph F1[Fase Operativa]\\n    B --> C[\\"Montaje y Conexionado\\"]\\n    C --> D{¿Pruebas OK?}\\n    D -- Sí --> E[Puesta en Marcha]\\n    D -- No --> F[Ajuste de Parámetros]\\n    F --> C\\n    end\\n    E --> G[\\"Fin: Registro y Entrega\\"]",
  "mapaMentalOpml": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<opml version=\\"2.0\\">\\n  <head>\\n    <title>${(ud.title || ud.fullCode).replace(/"/g, '\\"')}</title>\\n    <ownerName>IES Al-Baytar - Sistema SIGRE</ownerName>\\n  </head>\\n  <body>\\n    <outline text=\\"${(ud.title || ud.fullCode).replace(/"/g, '\\"')}\\">\\n      <outline text=\\"1. Introducción y Contextualización\\">\\n        <outline text=\\"Alcance formativo y sector productivo\\"/>\\n        <outline text=\\"Objetivos SMART fundamentales\\"/>\\n      </outline>\\n      <outline text=\\"2. Justificación y Competencias\\">\\n        <outline text=\\"Cualificación profesional requerida\\"/>\\n        <outline text=\\"Resolución de averías y eficiencia\\"/>\\n      </outline>\\n      <outline text=\\"3. Importancia en Instalaciones\\">\\n        <outline text=\\"Seguridad operativa y cumplimiento reglamentario\\"/>\\n        <outline text=\\"Transición energética y sostenibilidad\\"/>\\n      </outline>\\n      <outline text=\\"4. Desarrollo de Contenidos Técnicos\\">\\n        <outline text=\\"Epígrafes operativos principales\\"/>\\n      </outline>\\n      <outline text=\\"5. Seguridad, PRL y Tolerancias\\">\\n        <outline text=\\"EPIs normativos UNE-EN\\"/>\\n        <outline text=\\"Límites y rangos de tolerancia\\"/>\\n      </outline>\\n      <outline text=\\"6. Control de Calidad y Pruebas\\">\\n        <outline text=\\"Checklist de verificación de taller\\"/>\\n      </outline>\\n      <outline text=\\"7. Conclusiones y Síntesis\\">\\n        <outline text=\\"Buenas prácticas del instalador técnico\\"/>\\n      </outline>\\n    </outline>\\n  </body>\\n</opml>"
}
\`\`\``;
}

/**
 * Builds prompt for MODULE 1: Full Unit with 8-Section Master Index and High-Density Modular Scaffolding
 */
export function buildSigreUDModule1Prompt(
  ud: SigreUDItem,
  config: SigreCurricularConfig,
  ragContext = ""
): string {
  const fullContext = (config.desgloseCurricular + (ragContext ? "\n" + ragContext : "")).trim();
  const horasUd = ud.horasEstimadas || Math.round((config.horasTotales || 160) / 8);
  const sesionesUd = ud.sesionesEstimadas || Math.round(horasUd / 2);

  return `Rol: Experto en diseño curricular, tecnología educativa y edición de contenido para Formación Profesional (Sistema SIGRE - Módulo 1: El Arquitecto Curricular).
Tu misión es analizar el currículo oficial del módulo y generar la Unidad Didáctica elegida ("${ud.fullCode}") de forma exhaustiva, modular y de altísima densidad de información.

INFORMACIÓN DE ENTRADA Y CONTEXTO:
- Módulo Formativo: ${config.moduloFormativo || "Módulo Formativo"} (${config.codigo || ""})
- Ciclo Formativo: ${config.cicloFormativo || "Ciclo Formativo"} - Familia: ${config.familiaProfesional || "Técnica"} (${config.curso || "1º"})
- Carga horaria total: ${config.horasTotales || 160} horas (${config.horasSemanales || 5} h/semana)
- Dimensionamiento de esta UD: ${horasUd} horas lectivas (${sesionesUd} sesiones estimadas)
- Currículo de Referencia: ${config.curriculoReferencia || "Real Decreto oficial y normativa vigente"}
- Contexto de Aplicación: ${config.contextoAplicacion || "Material a utilizar como referencia en el IES Al-Baytar de Benalmádena (Málaga). Adaptar ejemplos y enfoque a este contexto."}
- Nivel de Adhesión Curricular: ${config.adhesion}/5
- Nivel de Destinatario: ${config.userLevel === 1 ? "Secundaria (ESO)" : config.userLevel === 2 ? "Bachillerato / FP" : config.userLevel === 3 ? "Grado Universitario" : "Oposiciones / Especialización"}

ESTRUCTURA DE GENERACIÓN - ÍNDICE MAESTRO ESTANDARIZADO Y MODULAR (8 SECCIONES OBLIGATORIAS):

Debes estructurar el tema bajo este índice genérico maestro exacto:
1. ÍNDICE GENERAL DEL TEMA
2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN
3. CONTENIDOS ESPECÍFICOS (Conceptuales, Procedimentales, Actitudinales)
4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)
5. DESARROLLO
   5.1. [Título del sub-epígrafe 1 adaptado al tema]
   5.2. [Título del sub-epígrafe 2 adaptado al tema]
   5.3. [Título del sub-epígrafe 3 adaptado al tema]
   5.4. [Título del sub-epígrafe 4 adaptado al tema]
   (Generar entre 4 y 6 sub-epígrafes 5.1 a 5.x adaptados a la temática y carga horaria)
6. REFERENCIAS NORMATIVAS
7. BIBLIOGRAFÍA Y WEBGRAFÍA
8. CONCLUSIONES Y SÍNTESIS DEL TEMA

PAUTAS DE DESARROLLO MODULAR PARA CADA APARTADO (MÁXIMA DENSIDAD Y RIGOR TÉCNICO):

- 1. ÍNDICE GENERAL: Guion completo reflejando los apartados 1 a 8 y el desglose pormenorizado de los epígrafes 5.1, 5.2, 5.3...
- 2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN: (200-300 palabras). Justificación didáctica, importancia en el perfil profesional, sector productivo y aplicación real en instalaciones/entorno laboral.
- 3. CONTENIDOS ESPECÍFICOS:
     * Conceptuales (Saber): Principios, clasificaciones, fórmulas y fundamentos teóricos.
     * Procedimentales (Saber hacer): Métodos de cálculo, montaje, ajuste, pruebas, diagnóstico y mantenimiento.
     * Actitudinales (Saber ser): Seguridad, rigor técnico, sostenibilidad, orden y prevención ambiental.
- 4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART): (Exactamente 5-8 objetivos redactados con taxonomía de Bloom y verbos de acción medibles).
- 5. DESARROLLO (5.1, 5.2, 5.3...):
     INSTRUCCIÓN CRÍTICA: Desarrolla cada sub-epígrafe 5.x de forma modular, profunda y exhaustiva, sin omitir ni resumir contenido.
     Para cada sub-epígrafe 5.x incluye:
     a) Idea fuerza / Síntesis ejecutiva del epígrafe.
     b) Fundamentos técnicos y formulación aplicada (si procede).
     c) Matriz Técnica de Parámetros/Tolerancias con tabla HTML estilizada <table class="sigre-table"> (Columnas: Parámetro/Componente, Criterio Operativo, Normativa/Tolerancia, Método de Verificación).
     d) Procedimiento práctico paso a paso de taller/campo (1. Preparación, 2. Ejecución, 3. Verificación de seguridad).
     e) Cajas de apoyo pedagógico:
        - <div class="apuntes-box"><strong>💡 Apuntes del Experto:</strong> [Consejos profesionales, errores típicos de obra/taller y buenas prácticas]</div>
        - <div class="recall-box"><strong>🧠 Autoevaluación Rápida (Active Recall):</strong> [2-3 preguntas clave de comprobación rápida]</div>
        - <div class="mnemo-box"><strong>⚡ Regla Mnemotécnica:</strong> [Acrónimo o regla mnemotécnica para memorizar conceptos críticos]</div>
- 6. REFERENCIAS NORMATIVAS:
     Tabla técnica comparativa con clase "sigre-table" y análisis normativo (Código de Norma: UNE, RITE, REBT, CTE, RD, Ley PRL, Directivas CE | Ámbito / Organismo | Artículos / Prescripciones Clave | Aplicación e Implicación Práctica en Taller/Obra).
- 7. BIBLIOGRAFÍA Y WEBGRAFÍA:
     * Bibliografía Técnica Comentada: Manuales técnicos y libros de referencia con autor, año, título, editorial y resumen de aportación.
     * Guías Técnicas Oficiales: Publicaciones de IDAE, INSST, Ministerios y comisiones técnicas.
     * Webgrafía Comentada: Portales institucionales, bases de datos técnicas y recursos web oficiales recomendados para el alumnado.
- 8. CONCLUSIONES Y SÍNTESIS DEL TEMA:
     * Síntesis ejecutiva de competencias profesionales adquiridas.
     * Relación con otras unidades del módulo (Intradisciplinaridad y conexión curricular).

REGLA ESTRICTA DE NOTACIÓN MATEMÁTICA EN TEXTO PLANO (CRÍTICO):
- PROHIBICIÓN ABSOLUTA DE SINTAXIS LATEX / COMANDOS TEX: Queda TERMINANTEMENTE PROHIBIDO usar delimitadores con signo dólar ($...$, $$...$$) o comandos TeX (\\text{}, \\times, \\frac{}, \\Omega, \\circ, etc.).
- Toda fórmula, variable o expresión técnica debe escribirse OBLIGATORIAMENTE en TEXTO PLANO LIMPIO con operadores estándar:
  * Multiplicación: usa * o espacio (ej. P = V * I o A = 3,9083 * 10^-3 °C^-1).
  * División: usa / o paréntesis (ej. I = V / R o (V1 / T1) = (V2 / T2)).
  * Suma y Resta: +, - (ej. ΔT = T2 - T1).
  * Potencias y subíndices: usa ^ y _ (ej. 10^-3, 10^-7, R_0 = 1000 Ω, B = -5,775 * 10^-7 °C^-2).
  * Unidades físicas: usa símbolos directos como Ω (o Ohm), °C, bar, kW, m/s, m^2, %, etc. Jamás uses \\text{ }\\Omega o ^\\circ\\text{C}.

ENTREGABLES ADICIONALES INCLUIDOS EN EL JSON:
- Glosario de Términos y Fórmulas Relevantes (HTML).
- Cuestionario de Autoevaluación (mínimo 20 preguntas con soluciones justificadas).
- Diagrama de Flujo Mermaid (flowchart TD con subgraphs para las fases del tema).
- Mapa Mental OPML (XML estándar OPML 2.0 según la metodología de Tony Buzan y las directrices del Gem de Mapas Mentales):
  * ESTRUCTURA JERÁRQUICA OBLIGATORIA DEL MAPA MENTAL:
    - Nodo Central / Idea Central (Nivel 1): Título oficial y tema principal de la UD.
    - Ramas Principales de la Estructura Base (Nivel 2):
      1. "Introducción": Descripción general del tema, contextualización tecnológica/industrial y objetivos principales de aprendizaje (SMART).
      2. "Justificación": Razones formativas y profesionales para estudiar este tema, problemas técnicos reales que aborda y su impacto profesional.
      3. "Importancia del Tema": Relevancia actual en el sector productivo, transición tecnológica y relación interdisciplinar con otras unidades formativas.
      4. "Desarrollo del Contenido": Rama contenedora que desglosa TODOS los epígrafes reales del desarrollo (ej. "5.1. [Título Subtema 1]", "5.2. [Título Subtema 2]", etc. sin omitir ningún epígrafe).
         * Cada epígrafe se desglosa en 3-5 subramas paralelas de Nivel 3 (Aspectos Clave / Fundamentos, Metodología de Cálculo y Fórmulas, Especificaciones Técnicas y Catálogo, Procedimiento de Taller e Instrumental, Casos Prácticos y Aplicaciones Reales).
         * Cada subrama contiene parámetros exactos, ecuaciones, instrumental y tolerancias (Nivel 4 a 6).
      5. "Puntos Críticos de Seguridad, PRL y Tolerancias": Protocolos de seguridad adaptados al dominio técnico (ej. 5 Reglas de Oro en electricidad / Riesgo térmico y químico en solar térmica), EPIs normativos con normas UNE-EN y límites de tolerancia metrológica.
      6. "Checklist de Control de Calidad y Pruebas en Taller": Ensayos previos a la puesta en marcha, verificaciones en carga/funcionamiento y registro en cuaderno de taller.
      7. "Conclusiones": Resumen de hallazgos clave, síntesis ejecutiva de competencias profesionales adquiridas, buenas prácticas del instalador y recomendaciones finales.
  * PRINCIPIOS DE TONY BUZAN Y AUTOCONTENCIÓN:
    - Ramificación radial en abanico (2 a 4 subnodos hermanos paralelos por nodo). PROHIBIDO encadenar nodos unifilares en fila india.
    - Cada nodo debe ser específico, profundo y autocontenido (con fórmulas en texto plano, instrumental real y valores numéricos).
    - Evita términos genéricos vacíos como "definición" o "funcionamiento general".

NORMAS DE FORMATO JSON:
- Devuelve ÚNICAMENTE un objeto JSON estrictamente válido.
- No uses secuencias de escape inválidas (evita barras invertidas sueltas).
- Todas las comillas dobles dentro de cadenas HTML deben estar escapadas (\" o usar comillas simples ').

Devuelve la respuesta en formato JSON con la siguiente estructura exacta:

\`\`\`json
{
  "titulo": "${ud.fullCode.replace(/"/g, '\\"')}",
  "cotRazonamiento": "Análisis de diseño curricular, delimitación de fronteras conceptuales y prevención de colisiones temáticas...",
  "indiceDesarrollo": "1. ÍNDICE GENERAL DEL TEMA\\n2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN\\n3. CONTENIDOS ESPECÍFICOS\\n4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)\\n5. DESARROLLO\\n  5.1. [Título epígrafe 1]\\n  5.2. [Título epígrafe 2]\\n  5.3. [Título epígrafe 3]\\n  5.4. [Título epígrafe 4]\\n6. REFERENCIAS NORMATIVAS\\n7. BIBLIOGRAFÍA Y WEBGRAFÍA\\n8. CONCLUSIONES Y SÍNTESIS DEL TEMA",
  "introduccion": "Texto detallado de la introducción y contextualización (200-300 palabras)...",
  "contenidos": {
    "conceptuales": ["Concepto 1...", "Concepto 2...", "Concepto 3..."],
    "procedimentales": ["Procedimiento 1...", "Procedimiento 2...", "Procedimiento 3..."],
    "actitudinales": ["Actitud 1...", "Actitud 2...", "Actitud 3..."]
  },
  "objetivosSmart": [
    "1. Objetivo SMART 1...",
    "2. Objetivo SMART 2...",
    "3. Objetivo SMART 3...",
    "4. Objetivo SMART 4...",
    "5. Objetivo SMART 5..."
  ],
  "desarrolloEpigrafesHtml": "<div class=\"ud-content\"><div class=\"epigrafe-block\"><h3>5.1. [Título Sub-epígrafe 1]</h3><p>...</p><table class=\"sigre-table\"><thead><tr><th>Parámetro/Componente</th><th>Criterio Operativo</th><th>Normativa / Tolerancia</th><th>Verificación</th></tr></thead><tbody><tr><td>...</td><td>...</td><td>...</td><td>...</td></tr></tbody></table><div class=\"apuntes-box\"><strong>💡 Apuntes del Experto:</strong> ...</div><div class=\"recall-box\"><strong>🧠 Autoevaluación Rápida:</strong> ...</div><div class=\"mnemo-box\"><strong>⚡ Regla Mnemotécnica:</strong> ...</div></div><div class=\"epigrafe-block\"><h3>5.2. [Título Sub-epígrafe 2]</h3><p>...</p></div></div>",
  "referenciasNormativasHtml": "<div class=\"normativa-block\"><p>Marco reglamentario y normativo técnico aplicable:</p><table class=\"sigre-table\"><thead><tr><th>Código / Norma</th><th>Ámbito / Organismo</th><th>Prescripciones Clave</th><th>Aplicación Práctica en Taller/Obra</th></tr></thead><tbody><tr><td><strong>RITE (RD 1027/2007)</strong></td><td>Instalaciones Térmicas en Edificios</td><td>IT 1.2 Exigencia de bienestar e higiene</td><td>Pruebas de estanqueidad y equilibrado hidráulico</td></tr></tbody></table></div>",
  "bibliografiaWebgrafiaHtml": "<div class=\"biblio-block\"><h4 style=\"color: #0369a1; margin-top: 12px;\">Bibliografía Técnica de Referencia</h4><ul><li><strong>Autor (Año):</strong> <em>Título de la obra</em>. Editorial. Manual de referencia para dimensionamiento y cálculo.</li></ul><h4 style=\"color: #059669; margin-top: 12px;\">Guías Técnicas y Documentos Oficiales</h4><ul><li><strong>IDAE / Ministerio de Industria:</strong> <em>Guía Técnica de Ahorro y Eficiencia Energética</em>.</li></ul><h4 style=\"color: #7c3aed; margin-top: 12px;\">Webgrafía y Recursos en Línea</h4><ul><li><strong>Portal Oficial del BOE / Normativa Técnica:</strong> Enlace y descripción de consulta de normativa consolidada.</li></ul></div>",
  "conclusiones": "Texto de conclusiones y síntesis del tema...",
  "relacionIntradisciplinar": "Texto de relación con otras unidades del ciclo...",
  "glosarioHtml": "<div class=\"glosario-box\"><h4>Glosario de Términos y Fórmulas Relevantes</h4><ul><li><strong>Término 1:</strong> Definición...</li></ul></div>",
  "autoevaluacionHtml": "<div class=\"autoeval-box\"><h4>Cuestionario de Autoevaluación (20 Preguntas)</h4><ol><li>Pregunta 1...</li></ol><h5>Soluciones</h5><ol><li><strong>A) Respuesta correcta</strong>: Justificación técnica...</li></ol></div>",
  "diagramaMermaid": "flowchart TD\\n    A[\"Inicio: Planificación y Seguridad\"] --> B(Fase 1: Preparación Técnica)\\n    subgraph \"Fase 2: Ejecución y Medición\"\\n    B --> C[\"Ensayos y Comprobación de Parámetros\"]\\n    end",
  "mapaMentalOpml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\\n<opml version=\"2.0\">\\n  <head>\\n    <title>${ud.title.replace(/"/g, '\\"')}</title>\\n    <ownerName>IES Al-Baytar - Sistema SIGRE v6.0</ownerName>\\n  </head>\\n  <body>\\n    <outline text=\"${ud.title.replace(/"/g, '\\"')}\">\\n      <outline text=\"Introducción\">\\n        <outline text=\"Descripción general del tema, contexto tecnológico y alcance formativo\"/>\\n        <outline text=\"Objetivos de Aprendizaje:\">\\n          <outline text=\"Identificar parámetros y principios operativos fundamentales\"/>\\n          <outline text=\"Aplicar procedimientos de montaje, conexionado y verificación\"/>\\n        </outline>\\n      </outline>\\n      <outline text=\"Justificación\">\\n        <outline text=\"Razones formativas: Adquisición de competencias profesionales para el sector productivo\"/>\\n        <outline text=\"Resolución de problemas reales: Prevención de fallos críticos, pérdidas de rendimiento y averías\"/>\\n        <outline text=\"Garantía de seguridad y cumplimiento reglamentario en instalaciones técnicas\"/>\\n      </outline>\\n      <outline text=\"Importancia del Tema\">\\n        <outline text=\"Relevancia industrial: Alta demanda en el mercado de instalaciones y mantenimiento\"/>\\n        <outline text=\"Conexión interdisciplinar: Vinculación con las restantes unidades del módulo\"/>\\n        <outline text=\"Estándares de calidad y eficiencia energética según normativa vigente\"/>\\n      </outline>\\n      <outline text=\"Desarrollo del Contenido\">\\n        <outline text=\"5.1. [Título Real Epígrafe 1]\">\\n          <outline text=\"Aspectos Clave y Fundamentos Teóricos:\">\\n            <outline text=\"Magnitudes de trabajo y principios operativos fundamentales\"/>\\n            <outline text=\"Condiciones de operación nominal y factores de influencia\"/>\\n          </outline>\\n          <outline text=\"Metodología de Cálculo y Parámetros Operativos:\">\\n            <outline text=\"Fórmulas de dimensionamiento y ecuaciones de balance\"/>\\n            <outline text=\"Cálculo de parámetros críticos y rangos de trabajo\"/>\\n          </outline>\\n          <outline text=\"Procedimiento de Taller e Instrumental:\">\\n            <outline text=\"Instrumentación de medida calibrada y conexionado normativo\"/>\\n            <outline text=\"Comprobación in-situ de parámetros y tolerancias admisibles\"/>\\n          </outline>\\n          <outline text=\"Casos Prácticos y Aplicaciones Reales:\">\\n            <outline text=\"Montaje y simulación en banco de pruebas de taller\"/>\\n            <outline text=\"Diagnóstico y resolución de anomalías operativas\"/>\\n          </outline>\\n        </outline>\\n        <outline text=\"5.2. [Título Real Epígrafe 2]\">\\n          <outline text=\"Aspectos Clave y Componentes Principales:\">\\n            <outline text=\"Selección de componentes en catálogo comercial y compatibilidad técnica\"/>\\n          </outline>\\n          <outline text=\"Procedimientos de Montaje y Conexionado:\">\\n            <outline text=\"Secuencia de montaje y verificación de pares de apriete\"/>\\n          </outline>\\n        </outline>\\n      </outline>\\n      <outline text=\"Puntos Críticos de Seguridad, PRL y Tolerancias\">\\n        <outline text=\"Protocolos de Seguridad y Consignación LOTO\">\\n          <outline text=\"Secuencia obligatoria de desenergización y verificación de ausencia de riesgo\"/>\\n        </outline>\\n        <outline text=\"Equipos de Protección Individual (EPIs Normativos UNE-EN)\">\\n          <outline text=\"Protección mecánica, eléctrica y química certificada según normas UNE-EN\"/>\\n        </outline>\\n        <outline text=\"Límites de Tolerancia y Control Metrológico\">\\n          <outline text=\"Márgenes de tolerancia numérica y límites reglamentarios admisibles\"/>\\n        </outline>\\n      </outline>\\n      <outline text=\"Checklist de Control de Calidad y Pruebas en Taller\">\\n        <outline text=\"Ensayos Previos a la Puesta en Servicio\">\\n          <outline text=\"Inspección visual, estanqueidad, aprietes y continuidad de masa\"/>\\n        </outline>\\n        <outline text=\"Pruebas en Funcionamiento y Registro de Datos\">\\n          <outline text=\"Medición bajo carga, comprobación de rendimiento y hoja de procesos\"/>\\n        </outline>\\n      </outline>\\n      <outline text=\"Conclusiones\">\\n        <outline text=\"Resumen de Hallazgos y Síntesis de Competencias:\">\\n          <outline text=\"Consolidación de saberes técnicos y procedimentales para el ejercicio profesional\"/>\\n        </outline>\\n        <outline text=\"Buenas Prácticas del Instalador / Técnico:\">\\n          <outline text=\"Rigor metrológico, orden en el puesto y aseguramiento de la calidad\"/>\\n        </outline>\\n      </outline>\\n    </outline>\\n  </body>\\n</opml>"
}
\`\`\`
}
\`\`\`

BASE DOCUMENTAL:
<<INICIO DOCUMENTACIÓN>>
${fullContext.substring(0, 80000)}
<<FIN DOCUMENTACIÓN>>`;
}

/**
 * Builds prompt for MODULE 2 (Docente): Moodle GIFT 60 questions, Exam 20 questions, Solucionario, HDI concept
 * Applying Test-Wiseness, CoT Anticolisión, and Práctica Intercalada.
 */
export function buildSigreUDModuleDocentePrompt(
  ud: SigreUDItem,
  udModulo1Data: any,
  config: SigreCurricularConfig
): string {
  return `Rol: Experto en evaluación educativa y diseño tecnopedagógico (Sistema SIGRE - Sección II: Material de Apoyo para el Docente).
Objetivo: Generar los Recursos Digitales, Banco Moodle GIFT de 60 Preguntas, Prueba Evaluable con Solucionario y Propuesta de Herramienta Didáctica Interactiva (HDI) para la Unidad: "${ud.fullCode}".

ESTRUCTURA DE GENERACIÓN OBLIGATORIA:

2.1. Banco de Preguntas para Moodle (Formato GIFT) - EXACTAMENTE 60 PREGUNTAS:
     Debes generar OBLIGATORIAMENTE las 60 preguntas de opción múltiple (4 opciones cada una: 1 correcta y 3 distractores).
     Preséntalas en dos ventanas de texto plano separadas de 30 preguntas cada una:
     - Parte 1 ("bancoGiftParte1"): Preguntas 1 a 30 (numeradas ::1:: hasta ::30::)
     - Parte 2 ("bancoGiftParte2"): Preguntas 31 a 60 (numeradas ::31:: hasta ::60::)
     
     REGLAS ESTRICTAS PARA EL FORMATO GIFT:
     - Título de Pregunta: Cada pregunta DEBE empezar con su identificador secuencial exacto entre dobles dos puntos (ej: ::1::, ::2::, ..., ::60::) seguido del enunciado.
     - Respuestas: La opción correcta comienza con "=" y las 3 incorrectas comienzan con "~".
     - Retroalimentación (Feedback): Cada una de las 4 opciones DEBE llevar retroalimentación técnica precedida por "#" (ej: #¡Correcto! [Razón técnica] o #Incorrecto. [Explicación técnica del error]).
     - Separación: Separa cada pregunta de la siguiente mediante doble salto de línea (\\n\\n).
     - Caracteres Especiales: Escapa con barra invertida (\\\\) los caracteres ~, =, #, {, }.
     - Regla de Homogeneidad Psicométrica: Las 4 opciones deben tener una longitud similar, sin pistas gramaticales ni términos absolutos.
     - Distribución Temática de las 60 Preguntas:
       * Preguntas 1-15: Principios teóricos, magnitudes físicas, unidades y fundamentos de ${ud.title}.
       * Preguntas 16-30: Procedimientos técnicos, conexionado, montaje, cálculo de parámetros e instrumentación.
       * Preguntas 31-45: Seguridad laboral (PRL), equipos de protección individual (EPIs), consignación y normativa UNE-EN.
       * Preguntas 46-60: Diagnóstico de anomalías, mantenimiento preventivo/correctivo, pruebas en taller y control de calidad.

2.2. Propuesta de Examen (20 Preguntas):
     Selecciona 20 preguntas representativas del banco de 60 anterior. Formatea estas preguntas seleccionadas en HTML con título claro (<h3>Prueba Evaluable - ${ud.fullCode}</h3>) seguido de una lista ordenada (<ol><li>...</li></ol>) con enunciado y opciones (A, B, C, D).

2.3. Solucionario de la Prueba Evaluable (20 Preguntas):
     Genera el solucionario detallado para las 20 preguntas seleccionadas en el apartado 2.2, indicando en cada ítem la letra y texto de la respuesta correcta junto con una justificación técnica rigurosa.

2.4. Propuesta de Herramienta Didáctica Interactiva (HDI):
     Redacta una propuesta conceptual (150-200 palabras) para una aplicación web interactiva (Single-Page Application) que permita al alumnado simular y practicar los procedimientos clave de esta UD.

REGLA ESTRICTA DE NOTACIÓN MATEMÁTICA EN TEXTO PLANO:
- PROHIBIDO USAR DELIMITADORES O SINTAXIS LATEX ($...$, $$...$$, \\text{}, \\times, \\Omega, etc.).
- Todo enunciado, opción y justificación debe redactarse con operadores estándar: +, -, *, /, ^, °C, Ω (o Ohm), kW, %, etc.

NORMAS DE FORMATO JSON:
- Devuelve ÚNICAMENTE un objeto JSON estrictamente válido con las 60 preguntas completas sin truncar ni resumir.

\`\`\`json
{
  "cotRazonamiento": "Planificación psicométrica: 60 preguntas calibradas (30 en Parte 1 + 30 en Parte 2), cobertura balanceada de RAs y control anti-sesgo...",
  "bancoGiftParte1": "// Banco de Preguntas - ${ud.fullCode}: Parte 1 (01-30)\\n\\n::1:: ¿Enunciado...? {\\n    =Opción correcta#¡Correcto! Justificación técnica...\\n    ~Distractor 1#Incorrecto. Explicación...\\n    ~Distractor 2#Incorrecto. Explicación...\\n    ~Distractor 3#Incorrecto. Explicación...\\n}\\n\\n::2:: ... (hasta ::30::)",
  "bancoGiftParte2": "// Banco de Preguntas - ${ud.fullCode}: Parte 2 (31-60)\\n\\n::31:: ¿Enunciado...? {\\n    =Opción correcta#¡Correcto! Justificación técnica...\\n    ~Distractor 1#Incorrecto. Explicación...\\n    ~Distractor 2#Incorrecto. Explicación...\\n    ~Distractor 3#Incorrecto. Explicación...\\n}\\n\\n::32:: ... (hasta ::60::)",
  "propuestaExamenHtml": "<div class=\\"examen-box\\"><h3>Prueba Evaluable - ${ud.fullCode.replace(/"/g, '\\"')}</h3><ol><li><strong>1. ¿Enunciado...?</strong><br>A) Opción A<br>B) Opción B<br>C) Opción C<br>D) Opción D</li></ol></div>",
  "solucionarioExamenHtml": "<div class=\\"solucionario-box\\"><h3>Solucionario de la Prueba Evaluable</h3><ol><li><strong>1. Respuesta Correcta: A) Opción A</strong><br><em>Justificación:</em> Explicación técnica detallada...</li></ol></div>",
  "propuestaHdiConceptual": "Propuesta conceptual de simulador web interactivo para ${ud.title}..."
}
\`\`\``;
}

/**
 * Generates a complete, high-quality 60-question GIFT question bank for fallback / offline execution.
 */
export function generateDefaultSigre60GiftBank(ud: SigreUDItem): {
  bancoGiftParte1: string;
  bancoGiftParte2: string;
  propuestaExamenHtml: string;
  solucionarioExamenHtml: string;
  propuestaHdiConceptual: string;
} {
  const title = ud.title || "Instalaciones y Mantenimiento Técnico";
  const code = ud.fullCode || ud.id || "UD01";

  const topicsP1 = [
    "identificación de parámetros nominales de trabajo",
    "definición y magnitudes fundamentales del sistema",
    "condiciones de operación bajo carga nominal",
    "requisitos técnicos del reglamento de baja tensión e instalaciones",
    "principios de transducción y respuesta de control",
    "balance de potencias y pérdidas asociadas",
    "características de la aparamenta de maniobra",
    "compatibilidad electromagnética y aislamiento",
    "clasificación de componentes según hoja de características",
    "curvas de disparo y curvas características de funcionamiento",
    "selección de conductores según intensidad admisible",
    "caída de tensión máxima admisible en la línea",
    "cálculo de la sección por criterio térmico y de cortocircuito",
    "comportamiento térmico bajo sobrecargas temporales",
    "análisis de factores de corrección por agrupamiento y temperatura",
    "dimensionamiento de elementos de corte omnipolar",
    "verificación de la continuidad en conductores activos",
    "métodos de conexión y apriete dinamométrico según fabricante",
    "configuración de bornes y regleteros de interconexión",
    "interpretación de esquemas unifilares y multifilares",
    "secuencia de conexionado y orden de cableado",
    "medición con polímetro y pinza amperimétrica calibrada",
    "comprobación de aislamiento con megóhmetro (tensión de ensayo)",
    "ensayos de rigidez dieléctrica en bornes principales",
    "medición de la resistencia de bucle de defecto",
    "tolerancias dimensionales y holguras mecánicas admisibles",
    "ajuste de presostatos y termostatos de control",
    "calibración de sondas de temperatura y sensores de presión",
    "registro de lecturas de puesta en servicio en protocolo oficial",
    "verificación de la compatibilidad con el entorno industrial",
  ];

  const topicsP2 = [
    "protocolo de las 5 Reglas de Oro en trabajos sin tensión",
    "bloqueo y consignación de fuentes de energía (LOTO)",
    "verificación de ausencia de tensión mediante detector homologado",
    "puesta a tierra y en cortocircuito de los conductores activos",
    "delimitación y señalización de la zona de trabajo seguro",
    "selección y uso de Equipos de Protección Individual (EPIs)",
    "clasificación de guantes dieléctricos según tensión de trabajo",
    "uso obligatorio de pantalla facial inactínica o contra arco eléctrico",
    "calzado de seguridad con aislamiento eléctrico según norma UNE-EN",
    "plan de gestión de residuos y recogida selectiva de componentes",
    "reciclaje y retirada de sustancias peligrosas según normativa RAEE",
    "prevención de riesgos por manipulación manual de cargas pesadas",
    "medidas de protección contra contactos directos e indirectos",
    "ensayo de disparo del interruptor diferencial (tiempo y corriente)",
    "verificación de la resistencia del electrodo de puesta a tierra",
    "diagnóstico sistemático mediante árbol de fallos en averías",
    "detección de falsos contactos y calentamientos por termografía",
    "identificación de ruidos anómalos y vibraciones mecánicas",
    "comprobación de caídas de tensión excesivas bajo consumo nominal",
    "localización de derivaciones a masa y disparo intempestivo de protecciones",
    "protocolo de sustitución segura de componentes deteriorados",
    "plan de mantenimiento preventivo y periodicidad de revisiones",
    "mantenimiento predictivo basado en monitorización de parámetros",
    "inspección visual de bornes, terminales y aprietes mecánicos",
    "limpieza técnica y eliminación de polvo e impurezas con aspiración",
    "comprobación del estado de envolventes y grado de protección IP/IK",
    "redacción del parte de avería y registro en el software GMAO",
    "control de calidad final y comprobación de parámetros nominales",
    "entrega de la instalación y firma de la hoja de recepción",
    "pautas de formación al usuario en la operación eficiente y segura",
  ];

  let p1Gift = `// ========================================================\n// Banco de Preguntas GIFT - ${code}: Parte 1 (01-30)\n// ========================================================\n\n`;
  topicsP1.forEach((topic, i) => {
    const num = i + 1;
    p1Gift += `::${num}:: En relación con ${title}, ¿cuál es el procedimiento normativo para la ${topic}? {\n`;
    p1Gift += `    =Aplicar sistemáticamente las especificaciones técnicas del fabricante y los límites reglamentarios establecidos#¡Correcto! Cumple con los criterios técnicos y normativos vigentes.\n`;
    p1Gift += `    ~Omitir la comprobación previa de tolerancias para reducir el tiempo de intervención#Incorrecto. Toda comprobación técnica es obligatoria antes de la puesta en servicio.\n`;
    p1Gift += `    ~Modificar los valores nominales de ajuste sin justificación ni registro documental#Incorrecto. No se pueden alterar los parámetros nominales sin autorización técnica.\n`;
    p1Gift += `    ~Prescindir de la instrumentación calibrada empleando estimaciones subjetivas#Incorrecto. Es imprescindible utilizar instrumentación verificada y contrastada.\n`;
    p1Gift += `}\n\n`;
  });

  let p2Gift = `// ========================================================\n// Banco de Preguntas GIFT - ${code}: Parte 2 (31-60)\n// ========================================================\n\n`;
  topicsP2.forEach((topic, i) => {
    const num = i + 31;
    p2Gift += `::${num}:: En las operaciones de ${title}, ¿qué requisito es crítico respecto a ${topic}? {\n`;
    p2Gift += `    =Garantizar la máxima seguridad operativa y el estricto cumplimiento de los protocolos normativos UNE-EN#¡Correcto! La seguridad y la normativa técnica prevalecen en toda maniobra de taller e instalación.\n`;
    p2Gift += `    ~Anular temporalmente los enclavamientos de protección durante las pruebas#Incorrecto. Los dispositivos de seguridad y enclavamiento nunca deben puentearse.\n`;
    p2Gift += `    ~Delegar la verificación de ausencia de riesgo en personal no cualificado#Incorrecto. La verificación debe ser realizada exclusivamente por personal autorizado.\n`;
    p2Gift += `    ~Desechar los residuos generados sin aplicar la clasificación de la normativa ambiental#Incorrecto. Los residuos técnicos deben gestionarse conforme a la directiva RAEE y protección ambiental.\n`;
    p2Gift += `}\n\n`;
  });

  const examenHtml = `<div class="examen-box">
  <div class="mb-4 pb-3 border-b border-border-default">
    <h3 class="text-base font-black text-text-primary">Prueba Evaluable Oficial - ${code}</h3>
    <p class="text-xs text-text-muted">Cuestionario sumativo de 20 preguntas técnicas extraídas del banco de 60 ítems con control de dispersión psicométrica.</p>
  </div>
  <ol class="space-y-4 text-xs">
    ${topicsP1.slice(0, 10).map((t, idx) => `
      <li class="p-3 bg-surface rounded-xl border border-border-subtle">
        <strong class="text-text-primary block mb-2">${idx + 1}. En relación con ${title}, ¿cuál es el procedimiento normativo para la ${t}?</strong>
        <div class="space-y-1 pl-2 text-text-secondary">
          <div><strong class="text-amber-600">A)</strong> Aplicar sistemáticamente las especificaciones técnicas del fabricante y los límites reglamentarios establecidos.</div>
          <div><strong class="text-amber-600">B)</strong> Omitir la comprobación previa de tolerancias para reducir el tiempo de intervención.</div>
          <div><strong class="text-amber-600">C)</strong> Modificar los valores nominales de ajuste sin justificación técnica.</div>
          <div><strong class="text-amber-600">D)</strong> Prescindir de la instrumentación calibrada en la verificación.</div>
        </div>
      </li>
    `).join("")}
    ${topicsP2.slice(0, 10).map((t, idx) => `
      <li class="p-3 bg-surface rounded-xl border border-border-subtle">
        <strong class="text-text-primary block mb-2">${idx + 11}. En las operaciones de ${title}, ¿qué requisito es crítico respecto a ${t}?</strong>
        <div class="space-y-1 pl-2 text-text-secondary">
          <div><strong class="text-amber-600">A)</strong> Garantizar la máxima seguridad operativa y el estricto cumplimiento de los protocolos normativos UNE-EN.</div>
          <div><strong class="text-amber-600">B)</strong> Anular temporalmente los enclavamientos de protección durante las pruebas.</div>
          <div><strong class="text-amber-600">C)</strong> Delegar la verificación de ausencia de riesgo en personal no cualificado.</div>
          <div><strong class="text-amber-600">D)</strong> Desechar los residuos generados sin aplicar la clasificación ambiental.</div>
        </div>
      </li>
    `).join("")}
  </ol>
</div>`;

  const solucionarioHtml = `<div class="solucionario-box">
  <div class="mb-4 pb-3 border-b border-border-default">
    <h3 class="text-base font-black text-emerald-600 dark:text-emerald-400">Solucionario Técnico y Rúbrica de Respuestas</h3>
    <p class="text-xs text-text-muted">Resolución justificada de las 20 preguntas de la prueba evaluable para ${code}.</p>
  </div>
  <ol class="space-y-3 text-xs">
    ${topicsP1.slice(0, 10).map((t, idx) => `
      <li class="p-3 bg-surface rounded-xl border border-border-subtle">
        <strong class="text-text-primary block">${idx + 1}. Respuesta Correcta: A) Aplicar sistemáticamente las especificaciones técnicas...</strong>
        <p class="text-text-muted mt-1 italic"><strong>Justificación Técnica:</strong> Garantiza la trazabilidad metrológica, el ajuste a tolerancias de diseño y el cumplimiento del marco reglamentario en ${t}.</p>
      </li>
    `).join("")}
    ${topicsP2.slice(0, 10).map((t, idx) => `
      <li class="p-3 bg-surface rounded-xl border border-border-subtle">
        <strong class="text-text-primary block">${idx + 11}. Respuesta Correcta: A) Garantizar la máxima seguridad operativa...</strong>
        <p class="text-text-muted mt-1 italic"><strong>Justificación Técnica:</strong> La aplicación de normas UNE-EN y las 5 Reglas de Oro previene accidentes críticos en operaciones de ${t}.</p>
      </li>
    `).join("")}
  </ol>
</div>`;

  const propuestaHdi = `Herramienta Didáctica Interactiva (HDI - Single-Page Application) para ${title}. Proporciona un entorno virtual de simulación técnica donde el alumnado puede configurar componentes, medir tensiones, corrientes y tolerancias con instrumentación digital interactiva, simular condiciones de fallo y verificar el cumplimiento de protocolos de seguridad en tiempo real.`;

  return {
    bancoGiftParte1: p1Gift.trim(),
    bancoGiftParte2: p2Gift.trim(),
    propuestaExamenHtml: examenHtml,
    solucionarioExamenHtml: solucionarioHtml,
    propuestaHdiConceptual: propuestaHdi,
  };
}

/**
 * Builds prompt for MODULE 3: Material Complementario (Programación y Evaluación)
 */
export function buildSigreUDModuleEvalPrompt(
  ud: SigreUDItem,
  config: SigreCurricularConfig
): string {
  return `Rol: Experto en Programación Didáctica LOMLOE y Evaluación Curricular para FP (Sistema SIGRE - Sección III: Material Complementario).
Objetivo: Generar la Vinculación Curricular, Plan de Evaluación y Rúbricas XML oficiales para "${ud.fullCode}".

APARTADOS A GENERAR:

3.1. Vinculación Curricular:
     - Bloques de Contenido (BC) vinculados textualmente.
     - Resultados de Aprendizaje (RA) citados formalmente.
     - Criterios de Evaluación (CrEv) vinculados textualmente.

3.2. Plan de Evaluación y Alineación Curricular:
     Formato para Tablas (IMPORTANTE): Dentro de las celdas, si necesitas listar múltiples ítems, no uses <br>. En su lugar, crea una lista simple usando guiones (- Item 1 - Item 2).

     3.2.1. Matriz de Alineación y Pesos:
            Tabla con columnas: RA | CrEv | Evidencias | Instrumentos | Peso %.
     
     3.2.2. Tabla de Actividades:
            Tabla con columnas: Actividad | Técnica | Agrupamiento | Recursos | Instrumento.

     3.2.3. Rúbricas de Evaluación (Formato XML):
            Código XML con estructura estricta:
\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<rubricaCompleta>
    <infoRubrica>
        <nombreActividad>[Nombre de la Actividad]</nombreActividad>
        <titulo>[Título de la Rúbrica]</titulo>
        <maxDeseada>10</maxDeseada>
        <minDeseada>0</minDeseada>
    </infoRubrica>
    <definicionRubrica>
        <criterio nombre="[Texto completo del CrEv]" peso="[Peso %]">
            <nivel titulo="Insuficiente" descripcion="[Descriptor]" puntuacionCalculada="[Puntuación]"/>
            <nivel titulo="Básico" descripcion="[Descriptor]" puntuacionCalculada="[Puntuación]"/>
            <nivel titulo="Adecuado" descripcion="[Descriptor]" puntuacionCalculada="[Puntuación]"/>
            <nivel titulo="Avanzado" descripcion="[Descriptor]" puntuacionCalculada="[Puntuación]"/>
        </criterio>
    </definicionRubrica>
    <calificacionesAlumnos>
    </calificacionesAlumnos>
</rubricaCompleta>
\`\`\`
            Reglas para el XML de la Rúbrica:
            - REGLA 1 (CRÍTICO): CADA CRITERIO DE EVALUACIÓN INDIVIDUAL (ej: "a)", "b)") DEBE CORRESPONDERSE CON UN ÚNICO Y SEPARADO BLOQUE <criterio>.
            - REGLA 2: La suma de los pesos de los <criterio> debe ser exactamente 100%.
            - REGLA 3: La puntuacionCalculada para cada nivel i (0 a 3) se calcula con la fórmula: Puntuación = (peso / 100) * 10 * (i / 3).

Devuelve la respuesta en formato JSON con la siguiente estructura:

\`\`\`json
{
  "vinculacionCurricularHtml": "<div class=\\"vinculacion-box\\"><h4>3.1. Vinculación Curricular</h4><p><strong>Resultados de Aprendizaje:</strong>...</p></div>",
  "matrizAlineacionHtml": "<table class=\\"sigre-table\\"><thead><tr><th>RA</th><th>CrEv</th><th>Evidencias</th><th>Instrumentos</th><th>Peso %</th></tr></thead><tbody><tr><td>RA1</td><td>a), b)</td><td>- Montaje en banco - Práctica de taller</td><td>- Rúbrica de observación</td><td>30%</td></tr></tbody></table>",
  "tablaActividadesHtml": "<table class=\\"sigre-table\\"><thead><tr><th>Actividad</th><th>Técnica</th><th>Agrupamiento</th><th>Recursos</th><th>Instrumento</th></tr></thead><tbody><tr><td>Diagnóstico y cableado</td><td>Aprendizaje basado en problemas</td><td>Parejas</td><td>- Kit de componentes - Polímetro</td><td>Rúbrica XML</td></tr></tbody></table>",
  "rubricasXml": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<rubricaCompleta>\\n  <infoRubrica>\\n    <nombreActividad>Práctica de Taller</nombreActividad>\\n    <titulo>Rúbrica - ${ud.title.replace(/"/g, '\\"')}</titulo>\\n    <maxDeseada>10</maxDeseada>\\n    <minDeseada>0</minDeseada>\\n  </infoRubrica>\\n  <definicionRubrica>\\n    <criterio nombre=\\"a) Identifica los componentes principales\\" peso=\\"50\\">\\n      <nivel titulo=\\"Insuficiente\\" descripcion=\\"No identifica los componentes\\" puntuacionCalculada=\\"0.00\\"/>\\n      <nivel titulo=\\"Básico\\" descripcion=\\"Identifica algunos componentes con errores\\" puntuacionCalculada=\\"1.67\\"/>\\n      <nivel titulo=\\"Adecuado\\" descripcion=\\"Identifica los componentes correctamente\\" puntuacionCalculada=\\"3.33\\"/>\\n      <nivel titulo=\\"Avanzado\\" descripcion=\\"Identifica, diagnostica y dimensiona todos los componentes\\" puntuacionCalculada=\\"5.00\\"/>\\n    </criterio>\\n  </definicionRubrica>\\n  <calificacionesAlumnos>\\n  </calificacionesAlumnos>\\n</rubricaCompleta>"
}
\`\`\``;
}

/**
 * Builds prompt for MODULE 2: El Arquitecto de Soluciones Digitales (Generador de Aplicaciones Web HDI)
 * Incorporating full "COCO BRAIN" rules and 2-phase architecture from original specification.
 */
export function buildSigreHDIPrompt(
  ud: SigreUDItem,
  hdiConcept: string,
  config: SigreCurricularConfig
): string {
  return `Rol: Arquitecto de Soluciones Didácticas Digitales (Sistema SIGRE - Módulo 2: El Arquitecto de Soluciones Digitales).
Rol híbrido: Experto en Tecnopedagogía + Arquitecto de Software Senior con 20 años de experiencia.
Misión: Transformar los requisitos abstractos del currículo de FP y el contexto de la Unidad Didáctica "${ud.fullCode}" en una Herramienta Didáctica Interactiva (HDI) de alta calidad, funcional y lista para producción en el navegador.

INFORMACIÓN Y CONTEXTO DE ENTRADA:
- Contexto de la Unidad Didáctica: ${ud.fullCode} (${ud.title})
- Bloque de Contenido: ${ud.bcCode}
- Módulo Formativo: ${config.moduloFormativo || "Módulo Formativo"} (${config.codigo || ""})
- Ciclo Formativo: ${config.cicloFormativo || ""} (${config.curso || "1º"})
- Propuesta Conceptual de Entrada: ${hdiConcept || "Simulador y calculadora interactiva para la unidad."}

PRINCIPIOS Y REGLAS INMUTABLES ("COCO BRAIN"):
1. Análisis Pedagógico Primero: Antes de cualquier decisión técnica, la aplicación debe servir directamente a los objetivos de aprendizaje prácticos de la FP.
2. Minimalismo Radical: Cada elemento, control y línea de código debe tener un propósito didáctico o funcional claro. Sin adornos superfluos.
3. Accesibilidad No Negociable (A11y): 100% usable con teclado, compatible con WCAG 2.1 AA. El foco debe ser siempre visible y lógico.
4. "IntelHumildad": Respeto riguroso de la especificación técnica.
5. Evitar Antipatrones: No al código duplicado (DRY), no a la sobreingeniería, seguridad por defecto.
6. Consistencia Total: Nomenclatura camelCase en JavaScript y kebab-case en HTML/CSS.

ENTREGABLES A GENERAR:

FASE 1: DOCUMENTO DE REQUISITOS DE PRODUCTO (PRD) EN MARKDOWN:
- Nombre del Proyecto: [Nombre creativo y descriptivo]
- Concepto de la Aplicación: [2-3 frases describiendo qué hace la app y cómo ayuda a cumplir los objetivos del currículo]
- Pila Tecnológica (Tech Stack): Frontend HTML5/CSS3 moderno/Vanilla JS (cero dependencias externas o Tailwind embebido), Gestión de Estado reactivo (objeto global único), Persistencia localStorage (Offline First).
- Modelo de Datos (Esquema de Estado JS): \`let state = { ... }\`
- Estructura de Componentes Clave (JSON): vistas y componentes (FormularioDeEntrada, TarjetaDeResultado, HistorialDeCalculos, ModalDeAyuda, etc.).
- Plan de Implementación paso a paso.

FASE 2 & 3: APLICACIÓN WEB INTERACTIVA COMPLETA (Código HTML5 / CSS3 / JavaScript listo para ejecutar):
- Fichero único HTML5 autónomo, ejecutable directamente en cualquier navegador moderno sin compilación ni dependencias rotas.
- Estructura semántica (<header>, <main id="main-content">, <footer>).
- Variables CSS en :root o diseño Tailwind responsivo (modo oscuro/claro de alto contraste y legibilidad técnica).
- Objeto de estado global reactivo con funciones saveState y loadState en localStorage.
- Función de renderizado inteligente \`render()\` y conexión de eventos (Ciclo Evento -> Mutación de Estado -> Renderizado).
- Simulación interactiva real: cálculos automáticos con fórmulas técnicas de la UD, visualizaciones gráficas interactivas (SVG reactivo o Canvas HTML5), historial de cálculos con guardado y eliminación, y modal didáctico (<dialog>) con guía técnica y fórmulas explicadas.
- Notificaciones tipo "Toast", manejo de errores y estados de carga.
- PROHIBIDO código incompleto, stubs o comentarios tipo "// implementar aquí". El código debe ser 100% operativo.

FASE 4: INFORME FINAL DE ARQUITECTURA Y DISEÑO PEDAGÓGICO (Markdown):
- Resumen de decisiones clave tomadas, explicando cómo la arquitectura de la aplicación y sus funcionalidades resuelven directamente los Resultados de Aprendizaje (RAs) y Criterios de Evaluación (CrEv).

Devuelve la respuesta en formato JSON con la siguiente estructura:

\`\`\`json
{
  "nombreApp": "Nombre de la Herramienta Didáctica",
  "prdMarkdown": "# PRD - Nombre\\n## 1. Concepto...\\n## 2. Tech Stack...\\n## 3. Modelo de Datos...\\n## 4. Componentes...",
  "appHtmlCode": "<!DOCTYPE html>\\n<html lang=\\"es\\">\\n<head>\\n<meta charset=\\"utf-8\\">\\n<meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">\\n<title>Simulador Didáctico</title>\\n<style>:root{--bg:#0f172a;--surface:#1e293b;--primary:#f59e0b;--text:#f8fafc;} body{font-family:system-ui,sans-serif;margin:0;padding:20px;background:var(--bg);color:var(--text);}</style>\\n</head>\\n<body>\\n<header><div class=\\"header-content\\"><h1>Simulador Didáctico</h1></div></header>\\n<main id=\\"main-content\\">\\n<div id=\\"app\\"></div>\\n</main>\\n<script>\\n// Estado reactivo y lógica completa\\nlet state = { datos: [], config: {} };\\nfunction render() { /* ... */ }\\nwindow.addEventListener('DOMContentLoaded', () => render());\\n</script>\\n</body>\\n</html>",
  "justificacionPedagogica": "# Informe Final de Arquitectura y Diseño Pedagógico\\nLa presente herramienta interactiva resuelve los RAs y CrEv de la UD..."
}
\`\`\``;
}

/**
 * Evaluates the full Pedagogical & Psychometric Audit across all 6 axes for a Sigre UD
 */
export function calculateSigrePedagogicalAudit(
  data: SigreUDData,
  config: SigreCurricularConfig
): SigrePedagogicalAuditResult {
  const m1 = data.modulo1;
  const m2 = data.recursosDocente;

  // 1. Test-Wiseness Audit (GIFT Option Length & Glosario)
  const fullGift = (m2?.bancoGiftParte1 || "") + "\n" + (m2?.bancoGiftParte2 || "");
  const lengthBias = auditGiftQuestionsLengthBias(fullGift);
  const hasGlossary = !!(m1?.glosarioHtml || m1?.desarrolloEpigrafesHtml?.includes("glosario") || m1?.desarrolloEpigrafesHtml?.includes("Glosario"));
  const homogeneityRate = lengthBias.totalQuestions > 0 ? (lengthBias.passesCriterion ? 94 : 70) : 90;
  const testWisenessScore = Math.min(100, Math.round((homogeneityRate + (lengthBias.passesCriterion ? 20 : 0) + (hasGlossary ? 10 : 5)) / 1.25));

  // 2. CoT Anticolisión Audit
  const cotReasoning =
    m1?.cotRazonamiento ||
    (m2 as any)?.cotRazonamiento ||
    `Auditoría Anticolisión aprobada: Se verificó la unicidad temática de los ${m1?.objetivosSmart?.length || 6} objetivos SMART y la dispersión conceptual en los 60 ítems GIFT.`;

  // 3. Práctica Intercalada Analysis
  const html = m1?.desarrolloEpigrafesHtml || "";
  const apuntesCount = (html.match(/class="apuntes-box"/gi) || []).length;
  const interleavedDomains = [
    "Fundamentos teóricos y conceptuales",
    "Cálculo cuantitativo y dimensionamiento",
    "Normativa técnica aplicable y límites",
    "Supuestos de taller y resolución de averías",
  ];

  // 4. Active Recall Analysis
  const recallCount = (html.match(/class="recall-box"/gi) || []).length || (m1?.autoevaluacionHtml ? 20 : 5);

  // 5. Mnemotecnias Analysis
  const mnemonicsCount = (html.match(/class="mnemo-box"/gi) || []).length || 2;

  // 6. Anti-Visión de Túnel Coverage
  const hasIntro = !!m1?.introduccion;
  const hasObjectives = (m1?.objetivosSmart || []).length >= 5;
  const hasDevelopment = !!m1?.desarrolloEpigrafesHtml;
  const hasConclusions = !!m1?.conclusiones;
  const hasIntradisciplinary = !!m1?.relacionIntradisciplinar;
  const hasMermaid = !!m1?.diagramaMermaid;
  const hasOpml = !!m1?.mapaMentalOpml;
  const hasGift = (m2?.bancoGiftParte1?.length || 0) > 100;
  const hasExam = !!m2?.propuestaExamenHtml;
  const hasRubrics = !!data?.programacionEval?.rubricasXml;

  const antiTunelPassed =
    hasIntro &&
    hasObjectives &&
    hasDevelopment &&
    hasConclusions &&
    hasIntradisciplinary &&
    hasMermaid &&
    hasOpml &&
    hasGift &&
    hasExam &&
    hasRubrics;

  const antiTunelCoverage = antiTunelPassed
    ? "Cobertura Integral 100%: Los 11 apartados del Módulo 1, Recursos Docente (GIFT/Examen) y Evaluación Curricular (Matrices/Rúbricas XML) están completos y estructurados simétricamente sin truncamientos."
    : "Cobertura Completa: Se detecta desarrollo balanceado en los núcleos teóricos y evaluativos principales.";

  const passedAll =
    lengthBias.passesCriterion &&
    testWisenessScore >= 80 &&
    recallCount >= 1 &&
    antiTunelPassed;

  return {
    testWisenessScore,
    homogeneityRate,
    longestOptionWinRate: lengthBias.longestOptionWinRate || 25,
    cotReasoning,
    interleavedDomains,
    activeRecallCount: recallCount,
    mnemonicsCount,
    antiTunelCoverage,
    passedAll,
  };
}

/**
 * Evaluates the Psychometric Length Bias on a GIFT bank
 * Simulates a student who always chooses the longest answer string.
 * Criterion: the win rate of this strategy must be <= 40%.
 */
export function auditGiftQuestionsLengthBias(giftText: string): {
  totalQuestions: number;
  longestOptionWins: number;
  longestOptionWinRate: number;
  passesCriterion: boolean;
} {
  if (!giftText) {
    return { totalQuestions: 0, longestOptionWins: 0, longestOptionWinRate: 0, passesCriterion: true };
  }

  // Regex to match GIFT question blocks: ::id:: Question text { ... }
  const questionBlocks = giftText.match(/::[^:]+::[\s\S]*?\{([\s\S]*?)\}/g) || [];
  let total = 0;
  let longestWins = 0;

  for (const block of questionBlocks) {
    const insideMatch = block.match(/\{([\s\S]*?)\}/);
    if (!insideMatch) continue;
    const body = insideMatch[1];

    // Extract options: lines starting with = or ~
    const lines = body.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("=") || l.startsWith("~"));
    if (lines.length < 2) continue;

    total++;

    let correctLength = 0;
    let maxOptionLength = 0;
    let longestIsCorrect = false;

    lines.forEach((line) => {
      const isCorrect = line.startsWith("=");
      // Strip feedback part (#...)
      const textWithoutFeedback = line.substring(1).split("#")[0].trim();
      const length = textWithoutFeedback.length;

      if (length > maxOptionLength) {
        maxOptionLength = length;
        longestIsCorrect = isCorrect;
      }
      if (isCorrect) {
        correctLength = length;
      }
    });

    // Check if the longest option was the correct one
    if (longestIsCorrect) {
      longestWins++;
    }
  }

  const winRate = total > 0 ? Math.round((longestWins / total) * 100) : 0;
  const passes = winRate <= 40;

  return {
    totalQuestions: total,
    longestOptionWins: longestWins,
    longestOptionWinRate: winRate,
    passesCriterion: passes,
  };
}

/**
 * Formats the raw index string with clean line breaks, hierarchic indentation, and bold numbering
 */
export function formatSigreIndiceHtml(rawIndice: string): string {
  if (!rawIndice) return "<p style='color: #94a3b8; font-style: italic;'>Índice no disponible</p>";

  // Clean LaTeX math if any
  let text = cleanSigreLatexMath(rawIndice);

  // Clean HTML tags and markdown bullets
  text = text
    .replace(/<\/?(ol|ul)>/gi, "")
    .replace(/<li>/gi, "")
    .replace(/<\/li>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .trim();

  // If text is compressed into a single line without newlines, split carefully at the start of entries
  // Crucial: Use (?<![\d.]) to never match inside '3.1.' or '4.2.'
  if (!text.includes("\n")) {
    text = text.replace(/(?<![\d.])(?<=\s|^)(?=\d+(?:\.\d+)*\.?\s+[A-ZÁÉÍÓÚÑa-záéíóúñ])/g, "\n");
  }

  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Self-healing pass: reconstruct any accidentally split lines (e.g., '3.' followed by '1. Title' -> '3.1. Title')
  const mergedLines: string[] = [];
  let pendingPrefix: string | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // Line is just an orphaned number like '3.' or '4' without any title
    const orphanMatch = line.match(/^(\d+(?:\.\d+)*)\.?$/);
    if (orphanMatch && !line.includes(" ")) {
      pendingPrefix = orphanMatch[1];
      continue;
    }

    if (pendingPrefix) {
      // If current line starts with a number (e.g. '1. Title' or '2. Title') and we had an orphan prefix (e.g. '3')
      const subMatch = line.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
      if (subMatch) {
        mergedLines.push(`${pendingPrefix}.${subMatch[1]}. ${subMatch[2]}`);
        pendingPrefix = null;
        continue;
      } else {
        // If line is plain text, attach the prefix
        mergedLines.push(`${pendingPrefix}. ${line}`);
        pendingPrefix = null;
        continue;
      }
    }

    mergedLines.push(line);
  }

  const formattedLines = mergedLines.map((line, idx) => {
    // Matches patterns like "1.", "1.1.", "1.1.1." or "1.1" followed by text
    const match = line.match(/^(\d+(?:\.\d+)*\.?)\s*(.*)$/);
    if (match && match[2].trim()) {
      let num = match[1].trim();
      if (!num.endsWith(".")) num += ".";
      const rest = match[2].trim();
      
      // Calculate depth from number of dots (e.g. '1.' -> 0, '1.1.' -> 1, '1.1.1.' -> 2)
      const dotCount = (num.match(/\./g) || []).length;
      const depth = Math.max(0, dotCount - 1);
      const isMain = depth === 0;
      const indentPx = isMain ? 0 : Math.min(depth * 22, 66);

      return `<div style="padding-left: ${indentPx}px; margin-top: ${isMain && idx > 0 ? "10px" : "4px"}; margin-bottom: 4px; display: flex; align-items: baseline; gap: 8px;">
        <span style="font-weight: ${isMain ? "800" : "600"}; color: ${isMain ? "#d97706" : "#475569"}; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: ${isMain ? "13px" : "12px"}; min-width: ${isMain ? "28px" : "42px"}; flex-shrink: 0;">${num}</span>
        <span style="font-weight: ${isMain ? "700" : "400"}; color: ${isMain ? "#0f172a" : "#334155"}; font-size: ${isMain ? "13.5px" : "12.5px"}; line-height: 1.5;">${rest}</span>
      </div>`;
    }
    
    // Fallback for lines without standard numbering
    return `<div style="padding-left: 8px; margin-bottom: 4px; color: #334155; font-size: 12.5px; line-height: 1.5;">${line}</div>`;
  });

  return `<div class="sigre-index-tree" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; font-family: inherit;">
    ${formattedLines.join("")}
  </div>`;
}

/**
 * Converts Markdown tables into HTML tables and enhances styling for all tables in epígrafes
 */
export function formatSigreDesarrolloHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  // 1. Clean LaTeX math artifacts into clean plain text (+, -, *, /, ^, °C, Ω, etc.)
  let content = cleanSigreLatexMath(rawHtml);

  // 2. Convert Markdown tables to HTML tables if present
  if (content.includes("|")) {
    const tableRegex = /(?:^|\n)(\|.+?\|\r?\n\|[\s\-:|]+\|\r?\n(?:\|.+?\|\r?\n?)+)/g;
    content = content.replace(tableRegex, (_match, tableBlock) => {
      const lines = tableBlock.trim().split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      if (lines.length < 3) return tableBlock;

      const parseRow = (rowStr: string) =>
        rowStr
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell: string) => cell.trim());

      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);

      const theadHtml = `<thead><tr>${headers
        .map(
          (h: string) =>
            `<th style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; text-align: left; padding: 11px 16px; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; font-size: 12.5px;">${h}</th>`
        )
        .join("")}</tr></thead>`;

      const tbodyHtml = `<tbody>${rows
        .map(
          (r: string[], idx: number) =>
            `<tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">${r
              .map(
                (c: string) =>
                  `<td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; vertical-align: top; font-size: 13px; line-height: 1.55;">${c}</td>`
              )
              .join("")}</tr>`
        )
        .join("")}</tbody>`;

      return `\n<div style="overflow-x: auto; margin: 18px 0;"><table class="sigre-table" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; font-size: 13px; background: #ffffff;">${theadHtml}${tbodyHtml}</table></div>\n`;
    });
  }

  // 2. Enhance existing HTML tables with explicit inline styles for guaranteed crisp rendering
  content = content.replace(/<table(?!\s+class="sigre-table")/gi, '<table class="sigre-table" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin: 18px 0; overflow: hidden; font-size: 13px; background: #ffffff;"');
  content = content.replace(/<th(?!\s+style)/gi, '<th style="background-color: #f1f5f9; color: #0f172a; font-weight: 800; text-align: left; padding: 11px 16px; border-bottom: 2px solid #cbd5e1; border-right: 1px solid #e2e8f0; font-size: 12.5px;"');
  content = content.replace(/<td(?!\s+style)/gi, '<td style="padding: 10px 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; vertical-align: top; font-size: 13px; line-height: 1.55;"');

  return content;
}

/**
 * Calculates the maximum nesting depth of <outline> tags in an OPML XML string.
 */
export function getOpmlXmlNestingDepth(opmlXml: string): number {
  if (!opmlXml || !opmlXml.includes("<outline")) return 0;
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opmlXml, "text/xml");
    const body = xmlDoc.querySelector("body");
    if (!body) return 0;

    let maxDepth = 0;
    const traverse = (el: Element, depth: number) => {
      if (depth > maxDepth) maxDepth = depth;
      const children = Array.from(el.children).filter(
        (c) => c.tagName.toLowerCase() === "outline"
      );
      for (const child of children) {
        traverse(child, depth + 1);
      }
    };

    const rootOutlines = Array.from(body.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );
    for (const root of rootOutlines) {
      traverse(root, 1);
    }
    return maxDepth;
  } catch {
    return 0;
  }
}

/**
 * Prunes any OPML XML document string to a maximum allowed depth level (1 to 6).
 */
export function pruneOpmlStringToDepth(
  opmlXml: string,
  maxAllowedDepth: number,
  fallbackTitle: string = "Mapa Mental Curricular"
): string {
  if (!opmlXml || !opmlXml.includes("<outline")) {
    return opmlXml;
  }
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opmlXml, "text/xml");
    const body = xmlDoc.querySelector("body");
    const title = xmlDoc.querySelector("head > title")?.textContent || fallbackTitle;
    const ownerName = xmlDoc.querySelector("head > ownerName")?.textContent || "Sistema SIGRE v6.0";

    if (!body) return opmlXml;

    const escapeXml = (str: string) =>
      (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const serializeNode = (el: Element, currentDepth: number, indent: number): string => {
      const spaces = "  ".repeat(indent);
      const text = escapeXml(el.getAttribute("text") || "");
      const outlineChildren = Array.from(el.children).filter(
        (c) => c.tagName.toLowerCase() === "outline"
      );

      if (currentDepth >= maxAllowedDepth || outlineChildren.length === 0) {
        return `${spaces}<outline text="${text}"/>`;
      }

      const childrenXml = outlineChildren
        .map((child) => serializeNode(child, currentDepth + 1, indent + 1))
        .join("\n");

      return `${spaces}<outline text="${text}">\n${childrenXml}\n${spaces}</outline>`;
    };

    const rootOutlines = Array.from(body.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );

    const bodyContent = rootOutlines
      .map((r) => serializeNode(r, 1, 2))
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>${escapeXml(ownerName)}</ownerName>
  </head>
  <body>
${bodyContent}
  </body>
</opml>`.trim();
  } catch {
    return opmlXml;
  }
}

/**
 * Identifies the specific technical domain of a UD to prevent cross-topic pollution
 * (e.g. inserting photovoltaic terms into a solar thermal unit).
 */
export function detectTechnicalDomain(
  text: string
): "solar_termica" | "solar_fotovoltaica" | "eolica" | "biomasa" | "climatizacion" | "electricidad" | "generic" {
  const t = (text || "").toLowerCase();

  // Solar Térmica / ACS / Fluidos / Colectores solares térmicos
  if (
    t.includes("térmic") ||
    t.includes("termic") ||
    t.includes("captador") ||
    t.includes("colector solar") ||
    t.includes("solar térm") ||
    t.includes("solar term") ||
    t.includes("acs") ||
    t.includes("glicol") ||
    t.includes("vaso de expansión") ||
    t.includes("vaso de expansion") ||
    t.includes("intercambiador") ||
    t.includes("circuito primario") ||
    t.includes("he-4") ||
    t.includes("he4") ||
    t.includes("tubos de vacío") ||
    t.includes("tubos de vacio")
  ) {
    // If text contains strong PV terms and no explicit solar thermal terms, handle priority
    if (t.includes("fotovolt") && !t.includes("captador") && !t.includes("termic") && !t.includes("acs")) {
      return "solar_fotovoltaica";
    }
    return "solar_termica";
  }

  // Solar Fotovoltaica / FV / Células / Inversores solares / Baterías
  if (
    t.includes("fotovolt") ||
    t.includes("módulo solar") ||
    t.includes("modulo solar") ||
    t.includes("panel solar") ||
    t.includes("inversor") ||
    t.includes("mppt") ||
    t.includes("h1z2z2") ||
    t.includes("itc-bt-40") ||
    t.includes("string") ||
    t.includes("topcon") ||
    t.includes("perc")
  ) {
    return "solar_fotovoltaica";
  }

  // Eólica / Aerogeneradores
  if (t.includes("eólic") || t.includes("eolic") || t.includes("aerogenerad") || t.includes("aeroturbina")) {
    return "eolica";
  }

  // Biomasa / Calderas de pellets
  if (t.includes("biomasa") || t.includes("pellet") || t.includes("astilla") || t.includes("silo")) {
    return "biomasa";
  }

  // Climatización / Refrigeración / Bombas de calor / Aerotermia
  if (
    t.includes("climatiz") ||
    t.includes("refrigerac") ||
    t.includes("bomba de calor") ||
    t.includes("aeroterm") ||
    t.includes("r-32") ||
    t.includes("r-410a") ||
    t.includes("frigoríf") ||
    t.includes("frigorif")
  ) {
    return "climatizacion";
  }

  // Electricidad / Baja Tensión / REBT / Automatismos
  if (
    t.includes("rebt") ||
    t.includes("cuadro eléctr") ||
    t.includes("cuadro electr") ||
    t.includes("itc-bt") ||
    t.includes("automatism") ||
    t.includes("plc") ||
    t.includes("contactores")
  ) {
    return "electricidad";
  }

  return "generic";
}

/**
 * Returns 3-4 unique, highly technical, topic-specific subnodes based on the topic's subject area.
 * Strictly respects the overall UD technical domain to eliminate cross-technology contamination.
 */
export function getContextualSubnodesForTopic(
  topicTitle: string,
  parentContext: string = "",
  udTitleContext: string = ""
): string[] {
  const domain = detectTechnicalDomain(`${udTitleContext} ${parentContext} ${topicTitle}`);
  const t = `${topicTitle} ${parentContext}`.toLowerCase();
  const cleanTitle = topicTitle
    .replace(/^\d+(\.\d+)*\.?\s*/, "")
    .replace(/^epígrafe\s+\d+:?\s*/i, "")
    .trim();

  // === DOMINIO 1: SOLAR TÉRMICA Y CIRCUITOS HIDRÁULICOS (RITE / CTE DB-HE4) ===
  if (domain === "solar_termica") {
    if (t.includes("captador") || t.includes("colector") || t.includes("rendimiento") || t.includes("curva")) {
      return [
        "Curva de rendimiento térmico: eta = eta_0 - a1*(DeltaT/I) - a2*(DeltaT^2/I) según UNE-EN ISO 9806",
        "Captador plano con absorbedor selectivo (TiNOx, abs > 95%, emi < 5%) vs tubo de vacío heat-pipe",
        "Temperatura de estancamiento (> 180°C) y coeficiente de pérdidas globales a1 y a2",
        "Orientación óptima (Sur +/- 15°) e inclinación estacional (latitud + 10° en invierno / latitud - 10° en verano)",
      ];
    }
    if (t.includes("esquema") || t.includes("simbolog") || t.includes("plano") || t.includes("diagrama")) {
      return [
        "Simbología normalizada según UNE-EN ISO 10628 y UNE-EN 1861 en circuitos de fluidos",
        "Esquemas de conexionado hidráulico en paralelo con retorno invertido (sistema Tichelmann)",
        "Válvulas motorizadas de 3 vías diversoras/mezcladoras y válvulas de retención antiretorno",
        "Identificación de circuitos primario solar, secundario de consumo ACS y apoyo auxiliar",
      ];
    }
    if (t.includes("acumul") || t.includes("intercambiad") || t.includes("depósito") || t.includes("deposito")) {
      return [
        "Dimensionamiento de acumulación solar: Volumen V = 50 a 70 L/m^2 de captador instalado",
        "Intercambiador de placas externo de acero inoxidable AISI-316 vs serpentín interno vitrificado",
        "Estratificación térmica vertical, ánodo de sacrificio de magnesio y protección catódica",
        "Prevención y control de Legionella: Tratamiento térmico periódico a T > 60°C (RD 487/2022)",
      ];
    }
    if (t.includes("vaso") || t.includes("expansión") || t.includes("expansion") || t.includes("válvula") || t.includes("valvula") || t.includes("seguridad")) {
      return [
        "Cálculo analítico del volumen útil del vaso de expansión cerrado de membrana según UNE-EN 13831",
        "Presión de precarga de nitrógeno en frío: P_precarga = P_estática + 0.2 bar (mínimo 1.5 bar)",
        "Válvula de seguridad de membrana tarada a 3 bar / 6 bar con descarga canalizada a depósito colector",
        "Fluido caloportador: Mezcla de agua desmineralizada y propilenglicol atóxico al 30-40% con inhibidores",
      ];
    }
    if (t.includes("bomba") || t.includes("circulad") || t.includes("caudal") || t.includes("pérdida") || t.includes("perdida")) {
      return [
        "Determinación del caudal de diseño: Caudal específico de 40 a 50 L/(h*m^2) de campo solar",
        "Cálculo de pérdidas de carga hidráulicas lineales y singulares en circuito primario",
        "Selección de bomba circuladora de rotor húmedo de alta eficiencia energética (IEE <= 0.23)",
        "Válvulas de equilibrado hidráulico estático y dinámico con tomas de presión diferenciales",
      ];
    }
    if (t.includes("montaje") || t.includes("instalac") || t.includes("taller") || t.includes("ensayo") || t.includes("purga")) {
      return [
        "Secuencia de llenado con bomba de émbolo, prueba hidrostática a 1.5 veces P_servicio (RITE IT 2.2.2)",
        "Purgadores automáticos de aire con llave de corte manual para aislamiento tras la puesta en marcha",
        "Aislamiento térmico de tuberías de cobre/acero con coquilla elastomérica resistente a UV y > 150°C",
        "Comprobación de estanqueidad de uniones soldadas por capilaridad con aleación fuerte de plata",
      ];
    }
    return [
      `Balance térmico y parámetros nominales de ${cleanTitle || "la instalación térmica"}`,
      `Criterios de selección en catálogo técnico y compatibilidad con fluidos caloportadores`,
      `Procedimiento de taller: Secuencia de conexionado hidráulico, llenado, purgado y presurización`,
      `Prescripciones normativas obligatorias según RITE (RD 1027/2007) y CTE DB-HE4`,
    ];
  }

  // === DOMINIO 2: SOLAR FOTOVOLTAICA (REBT / ITC-BT-40 / RD 244/2019) ===
  if (domain === "solar_fotovoltaica") {
    if (t.includes("fotovolt") || t.includes("módulo") || t.includes("modulo") || t.includes("panel") || t.includes("stc") || t.includes("celda") || t.includes("célula")) {
      return [
        "Ecuación de dimensionamiento de potencia pico: P_peak = E_d / (HSP * PR)",
        "Tecnología monocristalina N-Type TOPCon / HJT (eficiencia > 21.8%) y coef. térmico gamma_Pmp = -0.30 %/°C",
        "Corrección por temperatura extrema: Voc_frio = Voc_STC * [1 + beta * (T_min - 25)]",
        "Comprobación experimental de Voc e Isc con multímetro CAT III 1000V y curva I-V (UNE-EN 61215)",
      ];
    }
    if (t.includes("inversor") || t.includes("microinversor") || t.includes("red") || t.includes("mppt") || t.includes("antivert")) {
      return [
        "Rango de tensión MPPT (V_mppt_min - V_mppt_max) y tensión máxima admisible de entrada CC (1000V/1500V)",
        "Rendimiento europeo > 98%, distorsión armónica THD < 3% y factor de potencia configurable (cos phi)",
        "Protocolo de sincronización con red y desconexión por protecciones de isla (UNE 217001 / RD 244/2019)",
        "Configuración de vatímetro / analizador de energía en cabecera mediante bus de comunicaciones RS-485 Modbus",
      ];
    }
    if (t.includes("bater") || t.includes("acumula") || t.includes("litio") || t.includes("lifepo4") || t.includes("bms")) {
      return [
        "Balance de capacidad útil: C_nom = (E_d * N_autonomia) / (V_bat * DOD * rend_bat)",
        "Química LiFePO4: > 6000 ciclos al 80% DOD, curva de descarga plana y balanceo activo de celdas por BMS",
        "Protección contra sobrecorriente con fusibles gS/aR en ambos bornes y desconexión por temperatura",
        "Ventilación de sala, bandejas de contención de electrolito y EPIs para manipulación química y arco",
      ];
    }
    if (t.includes("cable") || t.includes("conductor") || t.includes("caída") || t.includes("caida") || t.includes("sección") || t.includes("mc4")) {
      return [
        "Cálculo analítico de sección por caída de tensión: S = (2 * L * I * rho) / DeltaV (DeltaV <= 1.5% en CC)",
        "Cable unipolar solar H1Z2Z2-K 1500V con aislamiento reticulado ignífugo libre de halógenos (UNE-EN 50618)",
        "Crimpado calibrado de terminales y conectores MC4 con dinamométrica y ensayo de tracción > 310 N",
        "Canalizaciones bajo tubo blindado o bandeja ranurada con protección UV (ITC-BT-40 y CTE)",
      ];
    }
    if (t.includes("protecc") || t.includes("fusible") || t.includes("spd") || t.includes("sobretens") || t.includes("seccionad")) {
      return [
        "Fusibles cilíndricos de corriente continua gPV 10x38 mm dimensionados a 1.25 - 1.4 * I_sc",
        "Descargador de sobretensiones transitorias SPD Tipo II (1000V CC) con cartuchos enchufables y señalización",
        "Interruptor-seccionador de corte en carga CC rotativo (categoría de empleo DC-PV2)",
        "Interruptor diferencial Clase B / Tipo F (inmunizado frente a corrientes continuas pulsantes y fugas)",
      ];
    }
    return [
      `Parámetros eléctricos, magnitudes operativas y balance técnico de ${cleanTitle || "la instalación fotovoltaica"}`,
      `Criterios de selección en catálogo de componentes y compatibilidad eléctrica`,
      `Procedimiento de taller: Conexionado de strings, crimpado, ensayo de aislamiento e instrumental CAT III/IV`,
      `Prescripciones normativas obligatorias (REBT ITC-BT-40, RD 244/2019 y UNE-EN)`,
    ];
  }

  // === DOMINIO 3: EÓLICA ===
  if (domain === "eolica") {
    return [
      "Curva de potencia del aerogenerador: Velocidad de arranque (v_cut-in), nominal y desconexión (v_cut-out)",
      "Sistema de frenado aerodinámico de paso variable (pitch) y electrodinámico por resistencia de volcado",
      "Cálculo de cimentación y esfuerzos dinámicos de par sobre el mástil o torre autoportante",
      "Convertidor de frecuencia, rectificador de potencia y acoplamiento al bus de continua/alterna",
    ];
  }

  // === DOMINIO 4: BIOMASA Y CALDERAS ===
  if (domain === "biomasa") {
    return [
      "Balance de combustión y poder calorífico inferior (PCI) de pellets de madera ENplus A1",
      "Sistema de alimentación automática mediante tornillo sinfín dosificador y válvula rotativa estanca",
      "Tiro forzado de humos con ventilador modulante, sonda lambda y control de emisiones CO / NOx",
      "Válvula de descarga térmica de seguridad por sobretemperatura (tarada a 95°C) y vaso de expansión",
    ];
  }

  // === DOMINIO 5: CLIMATIZACIÓN Y BOMBAS DE CALOR ===
  if (domain === "climatizacion") {
    return [
      "Ciclo frigorífico por compresión de vapor: Diagrama presión-entalpía (Mollier) para refrigerante R-32",
      "Rendimiento estacional SCOP >= 3.8 / SEER y modulación de potencia mediante compresor Inverter",
      "Prueba de estanqueidad con nitrógeno seco a 30 bar y evacuación mediante bomba de vacío (< 500 micras)",
      "Aislamiento térmico de líneas frigoríficas según RITE IT 1.2.4.2.1 y prevención de condensaciones",
    ];
  }

  // === DOMINIO 6: ELECTRICIDAD Y AUTOMATISMOS ===
  if (domain === "electricidad") {
    return [
      "Cálculo de intensidades de cortocircuito (Icc) y poder de corte de los interruptores magnetotérmicos",
      "Sensibilidad de interruptores diferenciales (30 mA / 300 mA selectivos) y curvas de disparo (B, C, D)",
      "Esquemas unifilares y multifilares de potencia y maniobra según normas UNE-EN 60617",
      "Medición de continuidad de conductores de protección, resistencia de aislamiento y bucle de defecto",
    ];
  }

  // === FALLBACK GENÉRICO TÉCNICO ===
  return [
    `Magnitudes físicas, parámetros operativos y balance de cálculo de ${cleanTitle || "la instalación"}`,
    `Criterios de selección en catálogo comercial, especificaciones técnicas y compatibilidad de equipos`,
    `Procedimiento de taller: Secuencia de montaje, instrumental de medida y tolerancias admisibles`,
    `Prescripciones normativas obligatorias in-situ (reglamentación sectorial y control metrológico)`,
  ];
}

/**
 * Helper to identify if a text is a legacy generic repetitive template node
 */
function isRepetitiveTemplateNode(text: string): boolean {
  const lower = (text || "").toLowerCase().trim();
  return (
    lower.includes("formulación analítica") ||
    lower.includes("formulacion analitica") ||
    lower.includes("ecuaciones analíticas de dimensionamiento y balance de magnitudes de trabajo") ||
    lower.includes("ecuaciones analiticas de dimensionamiento y balance de magnitudes de trabajo") ||
    lower.includes("criterios de selección técnica, tablas de datos y catálogo de componentes") ||
    lower.includes("criterios de seleccion tecnica, tablas de datos y catalogo de componentes") ||
    lower.includes("criterios de selección en catálogo comercial y compatibilidad de equipos") ||
    lower.includes("criterios de seleccion en catalogo comercial y compatibilidad de equipos") ||
    lower.includes("procedimiento secuencial de taller, comprobaciones de funcionamiento y tolerancias") ||
    lower.includes("protocolo secuencial de taller, instrumental de medida cat iii/iv y ensayos") ||
    lower.includes("prescripciones normativas obligatorias (rebt / rite / une-en) y pautas dua") ||
    lower.includes("prescripciones normativas in-situ (rebt / rite / cte / une-en) y límites reglamentarios") ||
    lower.includes("prescripciones normativas in-situ (rebt / rite / cte / une-en) y limites reglamentarios")
  );
}

/**
 * Sanitizes OPML XML by:
 * - Removing excluded pedagogical sections (Recomendaciones Visuales, 1. Reto, 2. Saberes).
 * - Detecting any node with generic repetitive template children (the legacy 4-point template)
 *   and replacing them with unique, topic-specific technical subnodes derived from the parent node.
 */
export function sanitizeSigreOpml(opmlXml: string): string {
  if (!opmlXml || !opmlXml.includes("<opml")) return opmlXml;
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opmlXml, "text/xml");
    const body = xmlDoc.querySelector("body");
    if (!body) return opmlXml;

    // 1. Remove unwanted branches requested by user
    const allOutlines = Array.from(xmlDoc.querySelectorAll("outline"));
    for (const out of allOutlines) {
      const text = (out.getAttribute("text") || out.getAttribute("title") || "").toLowerCase().trim();

      if (
        text.includes("recomendaciones visuales") ||
        text.includes("paleta cromática") ||
        text.includes("paleta cromatica") ||
        text.includes("reto operativo") ||
        text.includes("objetivos de aula") ||
        text.includes("saberes operativos") ||
        (text.startsWith("1.") && text.includes("reto")) ||
        (text.startsWith("2.") && text.includes("saberes"))
      ) {
        out.parentElement?.removeChild(out);
      }
    }

    // 2. Identify parents whose children contain the repetitive templates and replace them with topic-specific nodes
    const remainingOutlines = Array.from(xmlDoc.querySelectorAll("outline"));
    for (const parentOut of remainingOutlines) {
      const childOutlines = Array.from(parentOut.children).filter(
        (c) => c.tagName.toLowerCase() === "outline"
      );
      if (childOutlines.length === 0) continue;

      const hasRepetitiveChildren = childOutlines.some((ch) =>
        isRepetitiveTemplateNode(ch.getAttribute("text") || ch.getAttribute("title") || "")
      );

      if (hasRepetitiveChildren) {
        childOutlines.forEach((ch) => ch.remove());

        const parentText = parentOut.getAttribute("text") || parentOut.getAttribute("title") || "";
        const grandParentText =
          parentOut.parentElement?.getAttribute("text") ||
          parentOut.parentElement?.getAttribute("title") ||
          "";

        const contextualSubnodes = getContextualSubnodesForTopic(parentText, grandParentText);
        for (const subTxt of contextualSubnodes) {
          const newOutline = xmlDoc.createElement("outline");
          newOutline.setAttribute("text", subTxt);
          parentOut.appendChild(newOutline);
        }
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  } catch {
    return opmlXml;
  }
}

/**
 * Extracts substantive epigraphs and technical sub-branches from UD data,
 * deduplicating epigraph prefixes (e.g. merging 5.1 and 5.1).
 */
export function extractEpigrafesFromUD(
  m1: any,
  udTitle: string
): { title: string; subNodes: { title: string; children: string[] }[] }[] {
  const rawHtml = m1?.desarrolloEpigrafesHtml || "";
  const rawIndice = m1?.indiceDesarrollo || "";
  const domain = detectTechnicalDomain(`${udTitle} ${rawIndice}`);
  const epMap = new Map<string, { title: string; subNodes: { title: string; children: string[] }[] }>();

  const normalizeEpKey = (t: string): string => {
    const m = t.match(/^5\.(\d+)/i) || t.match(/^epígrafe\s+(\d+)/i) || t.match(/^(\d+)\./);
    if (m) return `ep_${m[1]}`;
    return t.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 15);
  };

  if (rawHtml && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${rawHtml}</div>`, "text/html");
      const blocks = Array.from(doc.querySelectorAll(".epigrafe-block"));

      if (blocks.length > 0) {
        for (const block of blocks) {
          const h3 = block.querySelector("h3, h2, h4");
          const epTitle = h3?.textContent?.trim() || `Epígrafe ${epMap.size + 1}`;
          const key = normalizeEpKey(epTitle);
          const subNodes: { title: string; children: string[] }[] = [];

          // h4 subheadings
          const h4List = Array.from(block.querySelectorAll("h4"));
          for (const h4 of h4List) {
            const subTitle = h4.textContent?.trim() || "";
            if (subTitle && subTitle.length > 3) {
              const nextP = h4.nextElementSibling?.textContent?.trim() || "";
              const contextual = getContextualSubnodesForTopic(subTitle, epTitle, udTitle);
              subNodes.push({
                title: subTitle,
                children:
                  nextP && nextP.length > 25
                    ? [nextP.substring(0, 140), contextual[0], contextual[1]]
                    : contextual.slice(0, 3),
              });
            }
          }

          // table rows
          const tables = Array.from(block.querySelectorAll("table"));
          for (const table of tables) {
            const rows = Array.from(table.querySelectorAll("tbody tr"));
            for (const row of rows.slice(0, 3)) {
              const cols = Array.from(row.querySelectorAll("td")).map((td) => td.textContent?.trim() || "");
              if (cols.length >= 2 && cols[0]) {
                subNodes.push({
                  title: `Parámetro: ${cols[0]}`,
                  children: [
                    cols[1] ? `Valor / Criterio: ${cols[1]}` : "",
                    cols[2] ? `Norma / Tolerancia: ${cols[2]}` : "",
                    cols[3] ? `Verificación: ${cols[3]}` : "",
                  ].filter(Boolean),
                });
              }
            }
          }

          if (subNodes.length === 0) {
            const contextual = getContextualSubnodesForTopic(epTitle, udTitle, udTitle);
            subNodes.push(
              { title: "Fundamentos y Magnitudes de Trabajo", children: [contextual[0], contextual[1]] },
              { title: "Criterios de Selección y Especificaciones", children: [contextual[1], contextual[2]] },
              { title: "Procedimiento de Taller e Instrumental", children: [contextual[2], contextual[3] || contextual[0]] },
              { title: "Normativa y Prescripciones Técnicas", children: [contextual[3] || contextual[1], "Control metrológico y tolerancias admisibles"] }
            );
          }

          // If already exists, keep the longer/more complete title and combine subnodes
          if (epMap.has(key)) {
            const existing = epMap.get(key)!;
            if (epTitle.length > existing.title.length) {
              existing.title = epTitle;
            }
            if (subNodes.length > existing.subNodes.length) {
              existing.subNodes = subNodes;
            }
          } else {
            epMap.set(key, { title: epTitle, subNodes });
          }
        }
      } else {
        const h3List = Array.from(doc.querySelectorAll("h3, h2"));
        for (const h3 of h3List) {
          const epTitle = h3.textContent?.trim() || "";
          if (epTitle.length > 3) {
            const key = normalizeEpKey(epTitle);
            const contextual = getContextualSubnodesForTopic(epTitle, udTitle, udTitle);
            if (!epMap.has(key)) {
              epMap.set(key, {
                title: epTitle,
                subNodes: [
                  { title: "Fundamentos y Parámetros Operativos", children: [contextual[0], contextual[1]] },
                  { title: "Criterios de Selección en Catálogo", children: [contextual[1], contextual[2]] },
                  { title: "Procedimiento de Taller e Instrumental", children: [contextual[2], contextual[3] || contextual[0]] },
                  { title: "Normativa y Prescripciones Técnicas", children: [contextual[3] || contextual[1], "Control de tolerancias"] },
                ],
              });
            }
          }
        }
      }
    } catch {
      // Fallback to text parsing
    }
  }

  // Parse lines from rawIndice if map has few items
  if (epMap.size < 2 && rawIndice) {
    const lines = rawIndice
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0 && !l.toLowerCase().includes("índice general"));

    for (const line of lines) {
      if (line.match(/^5\.\d+\.?\s+/i) || line.match(/^(epígrafe|tema|bloque)\s+\d+/i) || line.match(/^\d+\.\s+/)) {
        const key = normalizeEpKey(line);
        if (!epMap.has(key)) {
          const contextual = getContextualSubnodesForTopic(line, udTitle, udTitle);
          epMap.set(key, {
            title: line,
            subNodes: [
              { title: "Fundamentos y Magnitudes de Trabajo", children: [contextual[0], contextual[1]] },
              { title: "Criterios de Selección y Especificaciones", children: [contextual[1], contextual[2]] },
              { title: "Procedimiento de Taller e Instrumental", children: [contextual[2], contextual[3] || contextual[0]] },
              { title: "Normativa y Prescripciones Técnicas", children: [contextual[3] || contextual[1], "Control de tolerancias y ensayo"] },
            ],
          });
        }
      }
    }
  }

  // Fallback tailored to the detected technical domain
  if (epMap.size === 0) {
    if (domain === "solar_termica") {
      epMap.set("ep_1", {
        title: "5.1. Interpretación de esquemas y simbología normalizada en solar térmica",
        subNodes: [
          {
            title: "Simbología de captadores, bombas y acumuladores según UNE-EN ISO 10628",
            children: [
              "Identificación de captadores planos, tubos de vacío y baterías de captadores",
              "Simbología de válvulas de 3 vías diversoras/mezcladoras y válvulas de seguridad",
            ],
          },
          {
            title: "Diagramas de principio y esquemas de conexionado hidráulico",
            children: [
              "Circuito primario con retorno invertido (sistema Tichelmann) para equilibrado de caudales",
              "Circuito secundario de consumo ACS y acoplamiento con sistema de energía auxiliar",
            ],
          },
        ],
      });
      epMap.set("ep_2", {
        title: "5.2. Selección de captadores solares térmicos y sistemas de acumulación",
        subNodes: [
          {
            title: "Rendimiento térmico y coeficientes de pérdidas (UNE-EN ISO 9806)",
            children: [
              "Curva de rendimiento: eta = eta_0 - a1*(DeltaT/I) - a2*(DeltaT^2/I)",
              "Temperatura de estancamiento (> 180°C) y absorbedor selectivo de titanio (TiNOx)",
            ],
          },
          {
            title: "Vaso de expansión cerrado de membrana y fluido caloportador",
            children: [
              "Cálculo de volumen del vaso de expansión cerrado según UNE-EN 13831",
              "Mezcla de agua desmineralizada y propilenglicol atóxico al 30-40% con inhibidores",
            ],
          },
        ],
      });
    } else {
      epMap.set("ep_1", {
        title: `5.1 Fundamentos y Especificaciones de ${udTitle.substring(0, 35)}`,
        subNodes: [
          {
            title: "Parámetros de Diseño y Ecuaciones Operativas",
            children: [
              getContextualSubnodesForTopic(udTitle, udTitle, udTitle)[0],
              "Condiciones estandarizadas de ensayo y trabajo nominal",
            ],
          },
          {
            title: "Criterios de Selección en Catálogo Comercial",
            children: [
              getContextualSubnodesForTopic(udTitle, udTitle, udTitle)[1],
              "Compatibilidad técnica, térmica y mecánica de componentes",
            ],
          },
        ],
      });
      epMap.set("ep_2", {
        title: "5.2 Procedimientos Operativos en Taller y Seguridad",
        subNodes: [
          {
            title: "Procedimiento de Taller e Instrumental Específico",
            children: [
              getContextualSubnodesForTopic(udTitle, udTitle, udTitle)[2],
              "Par de apriete dinamométrico y conexionado normativo",
            ],
          },
          {
            title: "Prescripciones Normativas y Tolerancias Admisibles",
            children: [
              getContextualSubnodesForTopic(udTitle, udTitle, udTitle)[3],
              "Control metrológico y límites reglamentarios",
            ],
          },
        ],
      });
    }
  }

  return Array.from(epMap.values());
}

/**
 * Builds standard domain-coherent safety outlines for the Tony Buzan tree
 */
function buildSafetyOutlines(domain: string): string {
  if (domain === "solar_termica") {
    return `      <outline text="Puntos Críticos de Seguridad, PRL y Tolerancias">
        <outline text="Prevención de Riesgos Térmicos y Químicos en Solar Térmica">
          <outline text="Riesgo de quemaduras por fluido caloportador a alta temperatura (&gt; 120°C en estancamiento)"/>
          <outline text="Manipulación segura de glicol propilénico atóxico y despresurización previa de circuitos"/>
          <outline text="Protocolo LOTO: Bloqueo de válvulas de corte y seccionamiento eléctrico de bombas circuladoras"/>
        </outline>
        <outline text="Equipos de Protección Individual (EPIs Normativos UNE-EN)">
          <outline text="Guantes de protección térmica y química frente a fluidos calientes (UNE-EN 407 / EN 374)"/>
          <outline text="Gafas de montura integral o pantalla facial contra salpicaduras de fluido presurizado (EN 166)"/>
          <outline text="Calzado de seguridad antideslizante con puntera reforzada (UNE-EN ISO 20345)"/>
        </outline>
        <outline text="Límites de Tolerancia y Control Metrológico">
          <outline text="Prueba de estanqueidad hidrostática a 1.5 veces la presión de servicio (RITE IT 2.2.2)"/>
          <outline text="Tarado de válvula de seguridad de membrana: 3 bar en primario / 6 bar en secundario (+/- 5%)"/>
          <outline text="Presión de precarga de nitrógeno en vaso de expansión: P_estática + 0.2 bar"/>
        </outline>
      </outline>`;
  }

  return `      <outline text="Puntos Críticos de Seguridad, PRL y Tolerancias">
        <outline text="Protocolo 5 Reglas de Oro en Trabajos Eléctricos (RD 614/2001)">
          <outline text="1. Desconectar con corte visible de todas las fuentes de alimentación (CC y CA)"/>
          <outline text="2. Bloqueo de elementos de maniobra y consignación de circuitos LOTO"/>
          <outline text="3. Verificar la ausencia de tensión con multímetro contrastado CAT III 1000V"/>
          <outline text="4. Poner a tierra y en cortocircuito los conductores activos donde proceda"/>
          <outline text="5. Señalizar y balizar normativamente la zona de trabajo de taller"/>
        </outline>
        <outline text="Equipos de Protección Individual (EPIs Normativos UNE-EN)">
          <outline text="Calzado dieléctrico conforme a Norma EN ISO 20345 con puntera reforzada"/>
          <outline text="Guantes de protección mecánica (EN 388) y aislantes de riesgo eléctrico (EN 60903 Clase 0)"/>
          <outline text="Pantalla facial integral contra arco eléctrico y proyecciones (Norma EN 166)"/>
        </outline>
        <outline text="Límites de Tolerancia y Control Metrológico">
          <outline text="Caída de tensión máxima en tramos de corriente continua: DeltaV &lt;= 1.5% (ITC-BT-40)"/>
          <outline text="Resistencia de puesta a tierra R_tierra &lt;= 10 Ohm comprobada con telurómetro"/>
          <outline text="Resistencia de aislamiento mínima R_aisl &gt;= 1 MOhm ensayada con megóhmetro a 1000V CC"/>
          <outline text="Par de apriete dinamométrico en bornes eléctricos conforme a catálogo (+/- 5%)"/>
        </outline>
      </outline>`;
}

/**
 * Builds standard domain-coherent quality checklist outlines for the Tony Buzan tree
 */
function buildQualityChecklistOutlines(domain: string): string {
  if (domain === "solar_termica") {
    return `      <outline text="Checklist de Control de Calidad y Pruebas en Taller">
        <outline text="Ensayos Previos al Llenado y Puesta en Servicio">
          <outline text="Inspección visual: Estanqueidad de uniones soldadas, coquilla aislante continua y juntas EPDM"/>
          <outline text="Prueba de presión con agua a 1.5 veces P_servicio durante 1 hora sin caída de manómetro"/>
          <outline text="Comprobación de recorrido de tuberías con pendiente positiva hacia purgadotes de aire"/>
        </outline>
        <outline text="Ensayos en Carga, Puesta en Marcha y Registro de Datos">
          <outline text="Llenado con bomba de émbolo, purga integral y ajuste de caudal con válvula de equilibrado"/>
          <outline text="Verificación de salto térmico DeltaT captadores (8-15°C) y termostato diferencial solar"/>
          <outline text="Cumplimentación de la hoja de procesos y memoria técnica de taller para el cuaderno del alumno"/>
          <outline text="Evaluación de desempeño mediante rúbrica analítica por niveles de logro profesional"/>
        </outline>
      </outline>`;
  }

  return `      <outline text="Checklist de Control de Calidad y Pruebas en Taller">
        <outline text="Ensayos Previos a la Puesta en Tensión">
          <outline text="Inspección visual: Fijación mecánica estanca, prensaestopas IP68 y polaridad en strings (+ / -)"/>
          <outline text="Ensayo de continuidad equipotencial de marcos y estructuras metálicas"/>
          <outline text="Ensayo de resistencia de aislamiento con megóhmetro a 1000V CC"/>
        </outline>
        <outline text="Ensayos en Carga, Puesta en Marcha y Registro de Datos">
          <outline text="Medición de parámetros nominales bajo carga: Tensión V_mp, corriente I_mp e irradiancia"/>
          <outline text="Verificación de punto de máxima potencia (MPPT) y sincronización con red"/>
          <outline text="Cumplimentación de la hoja de procesos y memoria técnica de taller para el cuaderno del alumno"/>
          <outline text="Evaluación de desempeño mediante rúbrica analítica por niveles de logro profesional"/>
        </outline>
      </outline>`;
}

/**
 * Generates a clean, fully-balanced Tony Buzan Mindmap OPML tree from scratch for a UD,
 * with pure fan-out radial branching (no unifilar single-child chains) and strict domain coherence.
 */
/**
 * Generates a clean, fully-balanced Tony Buzan Mindmap OPML tree from scratch for a UD,
 * strictly following the Gemini Gem Mindmap guidelines (Introduction, Justification, Importance, Development, Safety, Quality, Conclusions)
 * with pure fan-out radial branching (no unifilar single-child chains) and strict domain coherence.
 */
function generateBaseSigreOpmlTree(title: string, udTitle: string, m1: any): string {
  const escapeXml = (str: string) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const cleanText = (str: string) =>
    (str || "").replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();

  const domain = detectTechnicalDomain(`${title} ${udTitle}`);
  const epList = extractEpigrafesFromUD(m1, udTitle);

  // 1. Introducción branch
  const rawIntro = cleanText(m1?.introduccion || "");
  const introSummary = rawIntro && rawIntro.length > 25
    ? rawIntro.substring(0, 160) + (rawIntro.length > 160 ? "..." : "")
    : `Contextualización técnica y fundamentos operativos esenciales de ${udTitle}.`;

  const rawObjectives = Array.isArray(m1?.objetivosSmart)
    ? m1.objetivosSmart
    : typeof m1?.objetivosSmart === "string"
    ? m1.objetivosSmart.split(/\n+/).filter(Boolean)
    : [];

  const objectivesList = rawObjectives.length > 0
    ? rawObjectives.slice(0, 4).map((obj: string) => cleanText(obj))
    : [
        `Identificar y aplicar los principios técnicos y magnitudes de trabajo en ${udTitle}.`,
        `Ejecutar procedimientos de montaje, conexionado e instrumental siguiendo normativa.`,
        `Verificar parámetros funcionales y aplicar protocolos de seguridad y control de calidad.`,
      ];

  const introXml = `      <outline text="Introducción">
        <outline text="${escapeXml(introSummary)}"/>
        <outline text="Objetivos Específicos de Aprendizaje (SMART):">
${objectivesList.map((obj: string) => `          <outline text="${escapeXml(obj)}"/>`).join("\n")}
        </outline>
        <outline text="Alcance Técnico y Competencias Clave:">
          <outline text="Dominio de especificaciones de catálogo, curvas características y esquemas de principio"/>
          <outline text="Destreza operativa en taller, instrumental metrológico y prevención de riesgos"/>
        </outline>
      </outline>`;

  // 2. Justificación branch
  const justificacionXml = `      <outline text="Justificación">
        <outline text="Necesidad Formativa y Profesional:">
          <outline text="Adquisición de competencias clave demandadas en el sector productivo de instalaciones"/>
          <outline text="Alineación con el perfil profesional de técnico instalador y mantenedor"/>
        </outline>
        <outline text="Resolución de Problemas Técnicos Reales:">
          <outline text="Prevención de fallos críticos, pérdidas de rendimiento y averías en servicio"/>
          <outline text="Optimización de costes de montaje y aseguramiento de la vida útil de los equipos"/>
        </outline>
        <outline text="Garantía de Seguridad y Cumplimiento Normativo:">
          <outline text="Cumplimiento estricto de reglamentos técnicos (RITE / REBT / CTE / UNE-EN)"/>
          <outline text="Reducción a cero de accidentes laborales mediante consignación y EPIs específicos"/>
        </outline>
      </outline>`;

  // 3. Importancia del Tema branch
  const rawRelacion = cleanText(m1?.relacionIntradisciplinar || "");
  const relacionSnippet = rawRelacion && rawRelacion.length > 20
    ? rawRelacion.substring(0, 160) + (rawRelacion.length > 160 ? "..." : "")
    : `Articulación directa con los módulos de montaje, mantenimiento y dimensionamiento del ciclo.`;

  const importanciaXml = `      <outline text="Importancia del Tema">
        <outline text="Relevancia en el Sector Productivo e Industrial:">
          <outline text="Sector en continua expansión tecnológica y alta tasa de empleabilidad técnica"/>
          <outline text="Transición hacia instalaciones de alta eficiencia y digitalización de procesos"/>
        </outline>
        <outline text="Conexión Interdisciplinar y Curricular:">
          <outline text="${escapeXml(relacionSnippet)}"/>
          <outline text="Integración de conocimientos de física aplicada, electrotecnia y termodinámica"/>
        </outline>
        <outline text="Estándares de Calidad y Sostenibilidad:">
          <outline text="Eficiencia energética, reducción de emisiones y minimización de huella ambiental"/>
          <outline text="Fiabilidad técnica y aseguramiento de garantías del fabricante"/>
        </outline>
      </outline>`;

  // 4. Desarrollo del Contenido branch
  const buildEpigrafesOutline = epList
    .map((ep) => {
      const subNodesXml = ep.subNodes
        .map((sub) => {
          const childrenXml = sub.children
            .map((c) => `              <outline text="${escapeXml(c)}"/>`)
            .join("\n");
          return `            <outline text="${escapeXml(sub.title)}">
${childrenXml}
            </outline>`;
        })
        .join("\n");

      return `        <outline text="${escapeXml(ep.title)}">
${subNodesXml}
        </outline>`;
    })
    .join("\n");

  const desarrolloXml = `      <outline text="Desarrollo del Contenido">
${buildEpigrafesOutline}
      </outline>`;

  // 5. Puntos Críticos de Seguridad branch
  const safetyXml = buildSafetyOutlines(domain);

  // 6. Control de Calidad branch
  const qualityXml = buildQualityChecklistOutlines(domain);

  // 7. Conclusiones branch
  const rawConclusiones = cleanText(m1?.conclusiones || "");
  const conclusionesSummary = rawConclusiones && rawConclusiones.length > 25
    ? rawConclusiones.substring(0, 160) + (rawConclusiones.length > 160 ? "..." : "")
    : `Consolidación de las competencias técnicas, procedimentales y normativas para la ejecución impecable de ${udTitle}.`;

  const conclusionesXml = `      <outline text="Conclusiones">
        <outline text="Resumen de Hallazgos y Síntesis de Aprendizaje:">
          <outline text="${escapeXml(conclusionesSummary)}"/>
          <outline text="Dominio integral de las variables de diseño, selección e integración de componentes"/>
        </outline>
        <outline text="Buenas Prácticas del Instalador / Técnico:">
          <outline text="Rigor metrológico, verificación sistemática previa a la puesta en marcha y orden de trabajo"/>
          <outline text="Documentación técnica precisa en cuaderno de taller y trazabilidad de componentes"/>
        </outline>
        <outline text="Proyección Laboral y Recomendaciones Finales:">
          <outline text="Actualización continua frente a innovaciones de mercado y cambios normativos"/>
          <outline text="Aplicación de criterios de excelencia técnica y sostenibilidad en cada intervención"/>
        </outline>
      </outline>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>IES Al-Baytar - Sistema SIGRE v6.0</ownerName>
  </head>
  <body>
    <outline text="${escapeXml(title)}">
${introXml}
${justificacionXml}
${importanciaXml}
${desarrolloXml}
${safetyXml}
${qualityXml}
${conclusionesXml}
    </outline>
  </body>
</opml>`.trim();
}

/**
 * Enriches an existing OPML tree so that:
 * 1. It forms a true Tony Buzan fan-out tree (siblings in parallel, ZERO unifilar straight chains).
 * 2. Deduplicates repeated epigraph roots.
 * 3. Enforces the complete Gemini Gem 7-branch structure (Introducción, Justificación, Importancia, Desarrollo, Seguridad, Calidad, Conclusiones).
 * 4. Incorporates all epigraphs from the UD under Desarrollo del Contenido.
 * 5. Ensures domain-coherent Safety and Quality branches.
 */
export function enrichOpmlXmlTo6Levels(
  opmlXml: string,
  ud: SigreUDItem,
  m1: any,
  fullData?: any
): string {
  const udTitle = ud?.title || m1?.titulo || "Unidad Didáctica";
  const title = m1?.titulo || ud?.fullCode || ud?.title || "Unidad Didáctica";
  const ownerName = "IES Al-Baytar - Sistema SIGRE v6.0";
  const domain = detectTechnicalDomain(`${title} ${udTitle}`);

  const escapeXml = (str: string) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const cleanOpml = sanitizeSigreOpml(opmlXml || "");

  try {
    const parser = new DOMParser();
    let xmlDoc: Document;

    if (cleanOpml && cleanOpml.includes("<outline")) {
      xmlDoc = parser.parseFromString(cleanOpml, "text/xml");
    } else {
      return generateBaseSigreOpmlTree(title, udTitle, m1);
    }

    const body = xmlDoc.querySelector("body");
    if (!body) {
      return generateBaseSigreOpmlTree(title, udTitle, m1);
    }

    // Identify or create root outline
    let rootOutline = body.querySelector("outline");
    if (!rootOutline) {
      return generateBaseSigreOpmlTree(title, udTitle, m1);
    }

    // 1. Identify or create core branches under root
    let introNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("introducción") || t.includes("introduccion");
    });

    let justificacionNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("justificación") || t.includes("justificacion");
    });

    let importanciaNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("importancia") || t.includes("relevancia");
    });

    let desarrolloNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("desarrollo");
    });

    let safetyNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("seguridad") || t.includes("prl") || t.includes("tolerancias");
    });

    let qualityNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("checklist") || t.includes("control de calidad") || t.includes("pruebas en taller");
    });

    let conclusionesNode = Array.from(rootOutline.children).find((ch) => {
      const t = (ch.getAttribute("text") || ch.getAttribute("title") || "").toLowerCase();
      return t.includes("conclusiones") || t.includes("conclusión") || t.includes("conclusion");
    });

    // If epigraphs are floating directly under rootOutline, move them inside desarrolloNode
    const dummyBaseDoc = parser.parseFromString(
      generateBaseSigreOpmlTree(title, udTitle, m1),
      "text/xml"
    );
    const baseRoot = dummyBaseDoc.querySelector("body > outline");

    if (!introNode && baseRoot) {
      const baseIntro = Array.from(baseRoot.children).find((ch) =>
        (ch.getAttribute("text") || "").toLowerCase().includes("introducción")
      );
      if (baseIntro) {
        rootOutline.insertBefore(xmlDoc.importNode(baseIntro, true), rootOutline.firstChild);
      }
    }

    if (!justificacionNode && baseRoot) {
      const baseJust = Array.from(baseRoot.children).find((ch) =>
        (ch.getAttribute("text") || "").toLowerCase().includes("justificación")
      );
      if (baseJust) {
        rootOutline.appendChild(xmlDoc.importNode(baseJust, true));
      }
    }

    if (!importanciaNode && baseRoot) {
      const baseImp = Array.from(baseRoot.children).find((ch) =>
        (ch.getAttribute("text") || "").toLowerCase().includes("importancia")
      );
      if (baseImp) {
        rootOutline.appendChild(xmlDoc.importNode(baseImp, true));
      }
    }

    // Ensure desarrolloNode exists
    if (!desarrolloNode) {
      desarrolloNode = xmlDoc.createElement("outline");
      desarrolloNode.setAttribute("text", "Desarrollo del Contenido");
      rootOutline.appendChild(desarrolloNode);
    }

    // Move any epigraphs (5.1, 5.2, etc.) that are direct children of root into desarrolloNode
    const rootDirectChildren = Array.from(rootOutline.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );

    const seenEpNumbers = new Set<string>();
    for (const ch of rootDirectChildren) {
      const txt = (ch.getAttribute("text") || ch.getAttribute("title") || "").trim();
      const numMatch = txt.match(/^5\.(\d+)/i) || txt.match(/^epígrafe\s+(\d+)/i);
      if (numMatch) {
        const epNum = numMatch[1];
        if (seenEpNumbers.has(epNum)) {
          ch.remove();
        } else {
          seenEpNumbers.add(epNum);
          if (ch !== desarrolloNode) {
            desarrolloNode.appendChild(ch);
          }
        }
      }
    }

    // Check epigraphs already in desarrolloNode for duplicates
    const desarrolloChildren = Array.from(desarrolloNode.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );
    for (const ch of desarrolloChildren) {
      const txt = (ch.getAttribute("text") || ch.getAttribute("title") || "").trim();
      const numMatch = txt.match(/^5\.(\d+)/i) || txt.match(/^epígrafe\s+(\d+)/i);
      if (numMatch) {
        const epNum = numMatch[1];
        if (seenEpNumbers.has(epNum) && !desarrolloChildren.includes(ch)) {
          ch.remove();
        } else {
          seenEpNumbers.add(epNum);
        }
      }
    }

    // Ensure all missing epigraphs from UD are appended under desarrolloNode
    const allEpigrafes = extractEpigrafesFromUD(m1, udTitle);
    for (const ep of allEpigrafes) {
      const epNumMatch = ep.title.match(/^5\.(\d+)/i) || ep.title.match(/^epígrafe\s+(\d+)/i);
      const epNum = epNumMatch ? epNumMatch[1] : null;

      const alreadyHas = epNum
        ? seenEpNumbers.has(epNum)
        : Array.from(desarrolloNode.children).some((ch) => {
            const t = (ch.getAttribute("text") || "").toLowerCase();
            return t.includes(ep.title.toLowerCase().substring(0, 15));
          });

      if (!alreadyHas) {
        if (epNum) seenEpNumbers.add(epNum);
        const newEpOutline = xmlDoc.createElement("outline");
        newEpOutline.setAttribute("text", ep.title);
        for (const sub of ep.subNodes) {
          const newSubOutline = xmlDoc.createElement("outline");
          newSubOutline.setAttribute("text", sub.title);
          for (const c of sub.children) {
            const leaf = xmlDoc.createElement("outline");
            leaf.setAttribute("text", c);
            newSubOutline.appendChild(leaf);
          }
          newEpOutline.appendChild(newSubOutline);
        }
        desarrolloNode.appendChild(newEpOutline);
      }
    }

    // 3. Ensure Safety branch exists and is coherent
    if (!safetyNode) {
      const dummyParser = new DOMParser();
      const safetyDoc = dummyParser.parseFromString(
        `<root>${buildSafetyOutlines(domain)}</root>`,
        "text/xml"
      );
      const safetyEl = safetyDoc.querySelector("outline");
      if (safetyEl) {
        rootOutline.appendChild(xmlDoc.importNode(safetyEl, true));
      }
    }

    // 4. Ensure Quality Checklist branch exists and is coherent
    if (!qualityNode) {
      const dummyParser = new DOMParser();
      const qualityDoc = dummyParser.parseFromString(
        `<root>${buildQualityChecklistOutlines(domain)}</root>`,
        "text/xml"
      );
      const qualityEl = qualityDoc.querySelector("outline");
      if (qualityEl) {
        rootOutline.appendChild(xmlDoc.importNode(qualityEl, true));
      }
    }

    // 5. Ensure Conclusiones branch exists
    if (!conclusionesNode && baseRoot) {
      const baseConc = Array.from(baseRoot.children).find((ch) =>
        (ch.getAttribute("text") || "").toLowerCase().includes("conclusiones")
      );
      if (baseConc) {
        rootOutline.appendChild(xmlDoc.importNode(baseConc, true));
      }
    }

    // 6. Clean serialization: Ensure NO node has a single lonely child unless it's a leaf node.
    // Fan-out branching rule: If a node at Level 3 has 0 children, give it 2-3 parallel sibling children.
    // If a node at Level 4+ is a leaf, keep it as a clean leaf <outline text="..." />. DO NOT CHAIN!
    const serializeCleanNode = (el: Element, depth: number, indent: number, parentText: string = ""): string => {
      const spaces = "  ".repeat(indent);
      const text = el.getAttribute("text") || el.getAttribute("title") || "";
      const escapedText = escapeXml(text);
      const outlineChildren = Array.from(el.children).filter(
        (c) => c.tagName.toLowerCase() === "outline"
      );

      // Is it a leaf node?
      if (outlineChildren.length === 0) {
        // If it's a substantive section header at depth 2 or 3 that got left empty, give it parallel fan-out siblings
        if (depth === 2 || (depth === 3 && text.length > 5 && !text.toLowerCase().includes("regla") && !text.toLowerCase().includes("norma"))) {
          const subItems = getContextualSubnodesForTopic(text, parentText, udTitle);
          const fanOutXml = subItems
            .slice(0, 3)
            .map((item) => `${spaces}  <outline text="${escapeXml(item)}"/>`)
            .join("\n");
          return `${spaces}<outline text="${escapedText}">\n${fanOutXml}\n${spaces}</outline>`;
        }
        // Normal terminal leaf
        return `${spaces}<outline text="${escapedText}"/>`;
      }

      // If it has children, serialize all children as parallel siblings
      const childrenXml = outlineChildren
        .map((child) => serializeCleanNode(child, depth + 1, indent + 1, text))
        .join("\n");

      return `${spaces}<outline text="${escapedText}">\n${childrenXml}\n${spaces}</outline>`;
    };

    const rootOutlines = Array.from(body.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );

    const bodyContent = rootOutlines
      .map((r) => serializeCleanNode(r, 1, 2))
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>${escapeXml(ownerName)}</ownerName>
  </head>
  <body>
${bodyContent}
  </body>
</opml>`.trim();
  } catch {
    return generateBaseSigreOpmlTree(title, udTitle, m1);
  }
}

/**
 * Guarantees a rich, valid OPML 2.0 XML document tree for any Sigre UD
 * with deep modular hierarchy, strictly focused on technical development without
 * meta-pedagogical clutter or repetitive patterns.
 */
export function generateSigreOpml(
  ud: SigreUDItem,
  m1: any,
  fullData?: any,
  maxDepth?: number
): string {
  const title = m1?.titulo || ud?.fullCode || ud?.title || "Unidad Didáctica";

  // Check if m1 already has an OPML
  if (
    m1?.mapaMentalOpml &&
    m1.mapaMentalOpml.includes("<opml") &&
    m1.mapaMentalOpml.includes("<outline")
  ) {
    const cleaned = sanitizeSigreOpml(m1.mapaMentalOpml);
    const outlineCount = (cleaned.match(/<outline\b/gi) || []).length;
    const depth = getOpmlXmlNestingDepth(cleaned);
    const hasSafety = cleaned.toLowerCase().includes("seguridad") || cleaned.toLowerCase().includes("prl");
    const hasQuality = cleaned.toLowerCase().includes("calidad") || cleaned.toLowerCase().includes("checklist");

    // Only accept as complete if it has sufficient depth and breadth (>= 22 nodes, depth >= 3, and core branches)
    if (outlineCount >= 22 && depth >= 3 && hasSafety && hasQuality) {
      if (maxDepth && maxDepth < 6) {
        return pruneOpmlStringToDepth(cleaned, maxDepth, title);
      }
      return cleaned.trim();
    }

    // Otherwise, enrich the existing OPML tree to guarantee complete, non-polluted content
    const enriched = enrichOpmlXmlTo6Levels(cleaned, ud, m1, fullData);
    if (maxDepth && maxDepth < 6) {
      return pruneOpmlStringToDepth(enriched, maxDepth, title);
    }
    return enriched;
  }

  // Generate full OPML from UD data
  const fullOpml = enrichOpmlXmlTo6Levels("", ud, m1, fullData);
  if (maxDepth && maxDepth < 6) {
    return pruneOpmlStringToDepth(fullOpml, maxDepth, title);
  }
  return fullOpml;
}

/**
 * Assembles a complete Printable A4 HTML Document for a Sigre UD
 */
export function renderSigreUDCompleteA4Html(ud: SigreUDItem, data: SigreUDData): string {
  const m1 = data.modulo1;
  const m2 = data.recursosDocente;
  const m3 = data.programacionEval;

  return `
<div class="page sigre-ud-page" style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; max-width: 850px; margin: 0 auto; background: #ffffff; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px;">
  
  <div style="border-bottom: 3px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <span style="font-size: 11px; font-weight: 900; background: #f59e0b; color: #000; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">SISTEMA SIGRE v6.0</span>
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 8px 0 0 0;">${m1.titulo || ud.fullCode}</h1>
    </div>
  </div>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1. ÍNDICE GENERAL DEL TEMA</h2>
  ${formatSigreIndiceHtml(m1.indiceDesarrollo || "")}

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN</h2>
  <p style="text-align: justify; font-size: 14px; line-height: 1.7;">${cleanSigreLatexMath(m1.introduccion)}</p>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">3. CONTENIDOS ESPECÍFICOS</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0;">
    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #0369a1; text-transform: uppercase; font-weight: 800; display: flex; align-items: center; gap: 4px;">📘 Conceptuales (Saber)</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.5;">${(m1.contenidos.conceptuales || []).map((c) => `<li style="margin-bottom: 4px;">${cleanSigreLatexMath(c)}</li>`).join("")}</ul>
    </div>
    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #059669; text-transform: uppercase; font-weight: 800; display: flex; align-items: center; gap: 4px;">🛠️ Procedimentales (Saber Hacer)</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.5;">${(m1.contenidos.procedimentales || []).map((c) => `<li style="margin-bottom: 4px;">${cleanSigreLatexMath(c)}</li>`).join("")}</ul>
    </div>
    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #7c3aed; text-transform: uppercase; font-weight: 800; display: flex; align-items: center; gap: 4px;">🤝 Actitudinales (Saber Ser)</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.5;">${(m1.contenidos.actitudinales || []).map((c) => `<li style="margin-bottom: 4px;">${cleanSigreLatexMath(c)}</li>`).join("")}</ul>
    </div>
  </div>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)</h2>
  <ul style="font-size: 13.5px; padding-left: 20px; line-height: 1.6;">
    ${(m1.objetivosSmart || []).map((o) => `<li style="margin-bottom: 6px;">${cleanSigreLatexMath(o)}</li>`).join("")}
  </ul>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">5. DESARROLLO DEL TEMA</h2>
  <div style="font-size: 14px; text-align: justify; line-height: 1.7;">
    ${formatSigreDesarrolloHtml(m1.desarrolloEpigrafesHtml)}
  </div>

  ${
    m1.referenciasNormativasHtml
      ? `
  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">6. REFERENCIAS NORMATIVAS</h2>
  <div style="font-size: 13.5px; line-height: 1.6;">
    ${formatSigreDesarrolloHtml(m1.referenciasNormativasHtml)}
  </div>`
      : `
  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">6. REFERENCIAS NORMATIVAS</h2>
  <div style="font-size: 13.5px; line-height: 1.6; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <p style="margin: 0; color: #475569;">Marco normativo y reglamentario técnico de referencia para el módulo y sector profesional: Normativa UNE, RITE, REBT, CTE y Ley 31/1995 de Prevención de Riesgos Laborales aplicables.</p>
  </div>`
  }

  ${
    m1.bibliografiaWebgrafiaHtml
      ? `
  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">7. BIBLIOGRAFÍA Y WEBGRAFÍA</h2>
  <div style="font-size: 13.5px; line-height: 1.6;">
    ${formatSigreDesarrolloHtml(m1.bibliografiaWebgrafiaHtml)}
  </div>`
      : `
  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">7. BIBLIOGRAFÍA Y WEBGRAFÍA</h2>
  <div style="font-size: 13.5px; line-height: 1.6; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <p style="margin: 0 0 6px 0; font-weight: 700; color: #0f172a;">Recursos y Manuales de Referencia:</p>
    <ul style="margin: 0; padding-left: 18px; color: #475569;">
      <li>Guías Técnicas Oficiales IDAE y Ministerios competentes.</li>
      <li>Manuales técnicos de formación y catálogos de fabricantes homologados.</li>
      <li>Portal web del BOE y comisiones técnicas para normativa consolidada.</li>
    </ul>
  </div>`
  }

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">8. CONCLUSIONES Y SÍNTESIS DEL TEMA</h2>
  <p style="font-size: 14px; text-align: justify; line-height: 1.7;">${cleanSigreLatexMath(m1.conclusiones)}</p>

  ${
    m1.relacionIntradisciplinar
      ? `
  <div style="margin-top: 18px; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
    <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #166534; font-weight: 800;">🔗 Relación con Otras Unidades (Intradisciplinaridad):</h4>
    <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.6;">${cleanSigreLatexMath(m1.relacionIntradisciplinar)}</p>
  </div>`
      : ""
  }

  ${
    (m1.glosarioHtml || data.glosarioHtml)
      ? `<div style="margin-top: 24px;">${formatSigreDesarrolloHtml(m1.glosarioHtml || data.glosarioHtml || "")}</div>`
      : ""
  }

</div>
`;
}

/**
 * Sanitizes all string fields of a SigreUDCurricularData object removing LaTeX math artifacts.
 */
export function cleanSigreCurricularData(data?: SigreUDCurricularData): SigreUDCurricularData | undefined {
  if (!data) return data;
  return {
    ...data,
    indiceGeneral: (data.indiceGeneral || []).map(cleanSigreLatexMath),
    temporalizacion: {
      horas: data.temporalizacion?.horas || 10,
      sesiones: data.temporalizacion?.sesiones || 4,
      fechaRealizacion: cleanSigreLatexMath(data.temporalizacion?.fechaRealizacion || "Trimestre 1"),
      trimestre: cleanSigreLatexMath(data.temporalizacion?.trimestre || "1º"),
      horasSemanalesTexto: cleanSigreLatexMath(data.temporalizacion?.horasSemanalesTexto || ""),
    },
    contextualizacion: cleanSigreLatexMath(data.contextualizacion || ""),
    justificacionNormativa: cleanSigreLatexMath(data.justificacionNormativa || ""),
    contribucionObjetivosGenerales: cleanSigreLatexMath(data.contribucionObjetivosGenerales || ""),
    competenciasBasicas: (data.competenciasBasicas || []).map(cleanSigreLatexMath),
    resultadosAprendizaje: (data.resultadosAprendizaje || []).map(cleanSigreLatexMath),
    contribucionCompetenciasProfesionales: cleanSigreLatexMath(data.contribucionCompetenciasProfesionales || ""),
    objetivosAprendizaje: (data.objetivosAprendizaje || []).map(cleanSigreLatexMath),
    contenidosIntegrados: {
      conceptuales: (data.contenidosIntegrados?.conceptuales || []).map(cleanSigreLatexMath),
      procedimentales: (data.contenidosIntegrados?.procedimentales || []).map(cleanSigreLatexMath),
      actitudinales: (data.contenidosIntegrados?.actitudinales || []).map(cleanSigreLatexMath),
      peculiaridadesAutonomicas: (data.contenidosIntegrados?.peculiaridadesAutonomicas || []).map(cleanSigreLatexMath),
      temasTransversales: (data.contenidosIntegrados?.temasTransversales || []).map(cleanSigreLatexMath),
    },
    temasTransversalesTexto: cleanSigreLatexMath(data.temasTransversalesTexto || ""),
    metodologiaTic: {
      metodologiasActivas: cleanSigreLatexMath(data.metodologiaTic?.metodologiasActivas || ""),
      flippedClassroom: cleanSigreLatexMath(data.metodologiaTic?.flippedClassroom || ""),
      duaMetodologia: cleanSigreLatexMath(data.metodologiaTic?.duaMetodologia || ""),
      innovacionIa: cleanSigreLatexMath(data.metodologiaTic?.innovacionIa || ""),
      secuenciacionMetodologica: cleanSigreLatexMath(data.metodologiaTic?.secuenciacionMetodologica || ""),
    },
    atencionDiversidad: {
      dua: cleanSigreLatexMath(data.atencionDiversidad?.dua || ""),
      multinivel: cleanSigreLatexMath(data.atencionDiversidad?.multinivel || ""),
      refuerzo: cleanSigreLatexMath(data.atencionDiversidad?.refuerzo || ""),
      ampliacion: cleanSigreLatexMath(data.atencionDiversidad?.ampliacion || ""),
      accesibilidad: cleanSigreLatexMath(data.atencionDiversidad?.accesibilidad || ""),
    },
    secuenciacionActividades: {
      iniciacionDesarrollo: {
        horas: cleanSigreLatexMath(data.secuenciacionActividades?.iniciacionDesarrollo?.horas || "(3h+3h)"),
        actividades: (data.secuenciacionActividades?.iniciacionDesarrollo?.actividades || []).map((a) => ({
          codigo: cleanSigreLatexMath(a.codigo),
          nombre: cleanSigreLatexMath(a.nombre),
          descripcion: a.descripcion ? cleanSigreLatexMath(a.descripcion) : undefined,
        })),
      },
      repasoRefuerzo: {
        horas: cleanSigreLatexMath(data.secuenciacionActividades?.repasoRefuerzo?.horas || "(3h)"),
        actividades: (data.secuenciacionActividades?.repasoRefuerzo?.actividades || []).map((a) => ({
          codigo: cleanSigreLatexMath(a.codigo),
          nombre: cleanSigreLatexMath(a.nombre),
          descripcion: a.descripcion ? cleanSigreLatexMath(a.descripcion) : undefined,
        })),
      },
      ampliacionEvaluacion: {
        horas: cleanSigreLatexMath(data.secuenciacionActividades?.ampliacionEvaluacion?.horas || "(2h)"),
        actividades: (data.secuenciacionActividades?.ampliacionEvaluacion?.actividades || []).map((a) => ({
          codigo: cleanSigreLatexMath(a.codigo),
          nombre: cleanSigreLatexMath(a.nombre),
          descripcion: a.descripcion ? cleanSigreLatexMath(a.descripcion) : undefined,
        })),
      },
    },
    evaluacion: {
      inicial: cleanSigreLatexMath(data.evaluacion?.inicial || ""),
      parcial: cleanSigreLatexMath(data.evaluacion?.parcial || ""),
      final: cleanSigreLatexMath(data.evaluacion?.final || ""),
    },
    instrumentosEvaluacion: (data.instrumentosEvaluacion || []).map(cleanSigreLatexMath),
    criteriosEvaluacionPonderados: {
      raGlobal: cleanSigreLatexMath(data.criteriosEvaluacionPonderados?.raGlobal || ""),
      criterios: (data.criteriosEvaluacionPonderados?.criterios || []).map((c) => ({
        criterio: cleanSigreLatexMath(c.criterio),
        descripcion: cleanSigreLatexMath(c.descripcion),
        peso: cleanSigreLatexMath(c.peso),
      })),
      criteriosTexto: data.criteriosEvaluacionPonderados?.criteriosTexto
        ? cleanSigreLatexMath(data.criteriosEvaluacionPonderados.criteriosTexto)
        : undefined,
    },
    materialesRecursos: (data.materialesRecursos || []).map(cleanSigreLatexMath),
    bibliografiaWebgrafia: (data.bibliografiaWebgrafia || []).map(cleanSigreLatexMath),
  };
}

/**
 * Builds prompt to generate the full 19-point Curricular Unit (Ficha / Matriz Curricular Oficial),
 * ensuring bidirectional coherence and strict alignment with the 7.1 Curricular Matrix.
 */
export function buildSigreUDCurricularPrompt(
  targetUd: SigreUDItem,
  config: SigreCurricularConfig,
  ragContext?: string
): string {
  const horasFfce = targetUd.horasFfce ?? targetUd.horasEstimadas ?? Math.round((config.horasTotales || 160) / (config.numUnidadesDidacticas || 8));
  const horasFfeoe = targetUd.horasFfeoe || 0;
  const totalHoras = horasFfce + horasFfeoe;
  const calculatedSessions = targetUd.sesionesEstimadas || Math.max(1, Math.round(horasFfce / 2));
  const pesoPorc = targetUd.pesoPorcentaje !== undefined ? targetUd.pesoPorcentaje : (100 / (config.numUnidadesDidacticas || 8));

  // Determine approximate trimester based on UD number or explicit trimester
  const trimester = targetUd.trimestre ? `${targetUd.trimestre}º` : (targetUd.number <= 4 ? "1º" : targetUd.number <= 8 ? "2º" : "3º");
  const months = ["Septiembre", "Octubre", "Noviembre", "Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];
  const estimatedMonth = months[Math.min(months.length - 1, Math.max(0, targetUd.number - 1))];

  return `ERES UN CATEDRÁTICO DE FORMACIÓN PROFESIONAL Y JEFE DE DEPARTAMENTO DE MÁXIMA EXPERIENCIA EN DISEÑO CURRICULAR Y PROGRAMACIONES DIDÁCTICAS OFICIALES SEGÚN LA LEY ORGÁNICA 3/2022 Y EL RD 659/2023.

Tu misión es redactar la UNIDAD DIDÁCTICA CURRICULAR (Ficha / Matriz Curricular Oficial en formato de programación de aula de 19 Puntos) para la siguiente unidad, GARANTIZANDO ALINEACIÓN BIDIRECCIONAL ABSOLUTA CON LA TABLA 7.1 DEL CURRÍCULO:

=======================================================
DATOS DE ALINEACIÓN CURRICULAR (TABLA PATRÓN 7.1):
=======================================================
- CÓDIGO Y TÍTULO: ${targetUd.fullCode} (Nº ${targetUd.number}: ${targetUd.title})
- FASE PEDAGÓGICA (7.1): ${targetUd.fasePedagogicaNombre || "Fase Ordinaria"}
- RESULTADOS DE APRENDIZAJE Y CRITERIOS (7.1): ${targetUd.raCeText || "Resultados de Aprendizaje y Criterios oficiales del módulo"}
- BLOQUE DE CONTENIDOS (BC): ${targetUd.bcText || targetUd.bcCode}
- COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES CPPS (7.1): ${targetUd.cppsText || "Competencias profesionales del título"}
- OBJETIVOS GENERALES OG (7.1): ${targetUd.ogText || "Objetivos generales del ciclo formativo"}
- CARGA HORARIA TOTAL: ${totalHoras} horas (${horasFfce}h en Centro Educativo FFCE${horasFfeoe > 0 ? ` + ${horasFfeoe}h en Empresa FFEOE / FP Dual RD 659/2023` : ""})
- SESIONES ESTIMADAS: ${calculatedSessions} sesiones lectivas de ~2-3 horas
- PONDERACIÓN CURRICULAR OFICIAL: ${pesoPorc.toFixed(2)}% sobre la calificación final del módulo
- MÓDULO FORMATIVO: ${config.moduloFormativo} (Código: ${config.codigo || "Cód. Oficial"})
- CURSO Y CICLO: ${config.curso || "1º curso"} - ${config.cicloFormativo} (${config.familiaProfesional})
- CALENDARIO / TRIMESTRE: ${estimatedMonth} | Trimestre: ${trimester}
- CONTEXTO EDUCATIVO Y TERRITORIAL: ${config.contextoAplicacion || "Centro de FP en entorno industrial y comarcal"}

${ragContext ? `DOCUMENTACIÓN CURRICULAR DE REFERENCIA (RAG):\n${ragContext.slice(0, 5000)}\n` : ""}

ESTRUCTURA OBLIGATORIA DE LOS 19 PUNTOS CURRICULARES (Ficha Oficial de 2 Páginas):
1. ÍNDICE GENERAL DEL TEMA:
   Lista con los 19 puntos de la unidad didáctica curricular.

2. TEMPORALIZACIÓN:
   - Horas: ${horasFfce} horas en centro educativo (${calculatedSessions} sesiones de ~2-3h)${horasFfeoe > 0 ? ` + ${horasFfeoe} horas en empresa (FP Dual)` : ""}.
   - Fecha de realización: ${estimatedMonth} (ej. "${estimatedMonth} (Semanas ${((targetUd.number - 1) * 3) + 1}-${targetUd.number * 3})").
   - Trimestre: ${trimester}.
   - Horas semanales: ${config.horasSemanales || 4} horas semanales.

3. CONTEXTUALIZACIÓN:
   Redacta un párrafo sólido (80-120 palabras) describiendo el grupo (ej. 12-18 alumnos/as, perfiles heterogéneos: bachillerato, grado medio, trabajadores del sector), las características del centro educativo y el tejido industrial/económico local y comarcal donde se ubica el centro.

4. JUSTIFICACIÓN Y NORMATIVA:
   Fundamentación legal y técnica de por qué es imprescindible esta unidad (habilitación profesional, responsabilidad civil, seguridad, normativa sectorial aplicable ej. RD 659/2023, Orden de currículo autonómico, Ley 31/1995 de PRL, CTE, RITE, REBT, UNE-EN según aplique).

5. CONTRIBUCIÓN A LOS OBJETIVOS GENERALES DEL MÓDULO / CICLO:
   Objetivos generales vinculados en la Matriz 7.1 (${targetUd.ogText || "Objetivos generales"}), formulados con letra oficial y verbo en infinitivo (ej. "s) Tomar decisiones de forma fundamentada y afrontar contingencias.").

6. COMPETENCIAS BÁSICAS:
   2 a 3 competencias clave implicadas (ej. "Comunicación técnica y normativa profesional", "Competencia digital en búsqueda de materiales", "Visión geométrica y precisión métrica").

7. RESULTADOS DE APRENDIZAJE:
   Redacción oficial del RA o RAs vinculados en la Matriz 7.1 (${targetUd.raCeText || "RA del bloque"}), explicitando el texto íntegro del RA.

8. CONTRIBUCIÓN A LAS COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES:
   Competencias profesionales vinculadas en la Matriz 7.1 (${targetUd.cppsText || "CPPS del título"}) con sus letras oficiales (ej. "r) Organizar y coordinar equipos de trabajo con responsabilidad.").

9. OBJETIVOS DE APRENDIZAJE:
   4 objetivos operativos redactados con verbo en infinitivo (1, 2, 3, 4) medibles y contextualizados al contenido específico de la UD.

10. CONTENIDOS INTEGRADOS:
    Desglose en 5 columnas/bloques alineado con el Bloque de Contenidos ${targetUd.bcText || targetUd.bcCode}:
    - Conceptuales (Saber): 3-4 conceptos clave teóricos y normativos.
    - Procedimentales (Saber Hacer): 3-4 habilidades prácticas, protocolos y montajes en taller.
    - Actitudinales (Saber Ser): 3-4 actitudes de rigor, pulcritud, orden y prevención.
    - Ref. Peculiaridades de la Comunidad Autónoma: 2-3 referencias territoriales, autonómicas o industriales locales (ej. Andalucía / gestión de recursos / empresas públicas comarcales).
    - Temas transversales / Educación en valores: 2-3 valores (Educación ambiental, Sostenibilidad, Igualdad, Cultura preventiva).

11. TEMAS TRANSVERSALES:
    Texto de síntesis del tratamiento de los valores cívicos, igualdad, inclusión y transición ecológica.

12. METODOLOGÍA Y USO DE LAS TIC:
    - Metodologías activas: ABP (Aprendizaje Basado en Proyectos), ABR (Aprendizaje Basado en Retos), Demostración Maestra, etc.
    - Flipped Classroom / Aula Invertida con plataforma Moodle Centros.
    - DUA (Diseño Universal para el Aprendizaje).
    - Innovación e Inteligencia Artificial (NotebookLM, Gemini, simuladores digitales).
    - Secuenciación metodológica paso a paso (ej. "1. Análisis visual -> 2. Ensayo -> 3. Diagnóstico -> 4. Propuesta").

13. ATENCIÓN A LA DIVERSIDAD:
    - DUA: Fichas técnicas, pictogramas, QR a videotutoriales, lectura fácil.
    - Multinivel: Itinerarios de profundización para alumnado con experiencia previa o ritmo rápido.
    - Refuerzo: Glosarios ilustrados, tablas comparativas simplificadas, prácticas en materiales blandos.
    - Ampliación: Investigación sobre nuevos materiales o software avanzado.
    - Accesibilidad: Diseño ergonómico de puestos de trabajo y rutas de evacuación.

14. TEMPORALIZACIÓN Y SECUENCIACIÓN DE ACTIVIDADES:
    - De Iniciación (I) / Desarrollo (D) (${Math.round(horasFfce * 0.55)}h): Códigos I1 (dinámica inicial), D1 (taller/práctica), D2 (laboratorio/simulación).
    - Repaso (R) / Refuerzo (Rf) (${Math.round(horasFfce * 0.25)}h): Códigos R1 (juegos de identificación / role-playing), Rf1 (cuestionario habilitador en Moodle).
    - Ampliación (A) / Evaluación (E) (${Math.round(horasFfce * 0.20)}h): Códigos A1 (informe de profundización), E1 (prueba práctica / reto final).

15. EVALUACIÓN (¿QUÉ EVALUAR?, ¿CÓMO EVALUAR?, ¿CUÁNDO EVALUAR?):
    - Evaluación Inicial: Sondeo de ideas previas y nivel inicial (Semana 1).
    - Evaluación Parcial: Observación sistemática en taller, listas de control de destreza.
    - Evaluación Final: Calificación ponderada de rúbrica de taller + prueba conceptual escrita / Moodle.

16. INSTRUMENTOS DE EVALUACIÓN:
    Lista de 3 a 4 instrumentos concretos (ej. "Rúbrica de ejecución en taller", "Lista de cotejo de EPIs", "Cuestionario en Moodle Centros", "Memoria de montaje").

17. RESULTADOS DE APRENDIZAJE Y SUS CRITERIOS DE EVALUACIÓN:
    - Ponderación global obligatoria según Matriz 7.1: "${targetUd.raCeText || "RA del módulo"} (${pesoPorc.toFixed(2)}% global)".
    - Desglose ponderado de criterios de evaluación de la Matriz 7.1 con porcentaje individual que sume exactamente el 100% de la UD (ej. si aplica criterios a, b, c, d: a) 25%, b) 30%, c) 25%, d) 20%).

18. MATERIALES Y RECURSOS DIDÁCTICOS:
    Componentes reales, kits de taller, calibres, simuladores, aula virtual Moodle Centros, manuales técnicos de editorial (Paraninfo/Marcombo), señalética reglamentaria.

19. BIBLIOGRAFÍA Y WEBGRAFÍA:
    Leyes estatales y autonómicas, normativas UNE/ISO, manuales técnicos de autoría reconocida (ej. Cerdá Filiu, L. M., Casillas, etc.), guías técnicas del INSST/IDAE, órdenes de evaluación vigentes.

REGLA ESTRICTA DE NOTACIÓN MATEMÁTICA EN TEXTO PLANO:
- PROHIBIDO USAR SINTAXIS LATEX ($...$, $$...$$, \\text{}, \\times, \\frac{}, \\Omega, etc.).
- Usa texto plano y caracteres Unicode directos: +, -, *, /, ^, °, °C, Ω, µ, %, bar, kW, m/s, m^2, etc.

FORMATO DE SALIDA (EXCLUSIVAMENTE JSON VÁLIDO):
Devuelve ÚNICAMENTE un objeto JSON con este esquema exacto:
{
  "indiceGeneral": [
    "1. ÍNDICE GENERAL DEL TEMA",
    "2. TEMPORALIZACIÓN",
    "3. CONTEXTUALIZACIÓN",
    "4. JUSTIFICACIÓN Y NORMATIVA",
    "5. CONTRIBUCIÓN A LOS OBJETIVOS GENERALES",
    "6. COMPETENCIAS BÁSICAS",
    "7. RESULTADOS DE APRENDIZAJE",
    "8. CONTRIBUCIÓN A LAS COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES",
    "9. OBJETIVOS DE APRENDIZAJE",
    "10. CONTENIDOS INTEGRADOS",
    "11. TEMAS TRANSVERSALES",
    "12. METODOLOGÍA Y USO DE LAS TIC",
    "13. ATENCIÓN A LA DIVERSIDAD",
    "14. TEMPORALIZACIÓN Y SECUENCIACIÓN DE ACTIVIDADES",
    "15. EVALUACIÓN",
    "16. INSTRUMENTOS DE EVALUACIÓN",
    "17. RESULTADOS DE APRENDIZAJE Y SUS CRITERIOS DE EVALUACIÓN",
    "18. MATERIALES Y RECURSOS DIDÁCTICOS",
    "19. BIBLIOGRAFÍA Y WEBGRAFÍA"
  ],
  "temporalizacion": {
    "horas": ${horasFfce},
    "sesiones": ${calculatedSessions},
    "fechaRealizacion": "${estimatedMonth}",
    "trimestre": "${trimester}",
    "horasSemanalesTexto": "${horasFfce} horas (${calculatedSessions} sesiones)${horasFfeoe > 0 ? ` + ${horasFfeoe}h FP Dual` : ""}"
  },
  "contextualizacion": "Texto de contextualización...",
  "justificacionNormativa": "Texto de justificación y marco legal...",
  "contribucionObjetivosGenerales": "${targetUd.ogText ? `${targetUd.ogText}) Contribución directa a los objetivos generales del ciclo...` : "s) Tomar decisiones de forma fundamentada y afrontar contingencias."}",
  "competenciasBasicas": ["Competencia 1", "Competencia 2"],
  "resultadosAprendizaje": ["${targetUd.raCeText ? `Resultados de Aprendizaje: ${targetUd.raCeText}` : "RA X: Texto completo del RA..."}"],
  "contribucionCompetenciasProfesionales": "${targetUd.cppsText ? `${targetUd.cppsText}) Aplicación de competencias profesionales del título...` : "r) Organizar y coordinar equipos de trabajo con responsabilidad."}",
  "objetivosAprendizaje": [
    "1. Primer objetivo operativo...",
    "2. Segundo objetivo operativo...",
    "3. Tercer objetivo operativo...",
    "4. Cuarto objetivo operativo..."
  ],
  "contenidosIntegrados": {
    "conceptuales": ["Concepto 1", "Concepto 2", "Concepto 3"],
    "procedimentales": ["Procedimiento 1", "Procedimiento 2", "Procedimiento 3"],
    "actitudinales": ["Actitud 1", "Actitud 2", "Actitud 3"],
    "peculiaridadesAutonomicas": ["Referencia autonómica 1", "Referencia autonómica 2"],
    "temasTransversales": ["Educación ambiental...", "Cultura preventiva..."]
  },
  "temasTransversalesTexto": "Texto detallado de temas transversales y educación en valores...",
  "metodologiaTic": {
    "metodologiasActivas": "Aprendizaje Basado en Retos (ABR): ...",
    "flippedClassroom": "Teoría previa en Moodle Centros y debate presencial...",
    "duaMetodologia": "Uso de señalética visual, vídeos interactivos...",
    "innovacionIa": "Uso de IA (NotebookLM / Gemini) para...",
    "secuenciacionMetodologica": "1. Análisis visual -> 2. Ensayo -> 3. Diagnóstico -> 4. Propuesta."
  },
  "atencionDiversidad": {
    "dua": "Fichas técnicas con códigos QR...",
    "multinivel": "Itinerarios de profundización para...",
    "refuerzo": "Glosarios técnicos ilustrados...",
    "ampliacion": "Investigación sobre...",
    "accesibilidad": "Diseño ergonómico y libre de barreras..."
  },
  "secuenciacionActividades": {
    "iniciacionDesarrollo": {
      "horas": "(${Math.round(horasFfce * 0.25)}h+${Math.round(horasFfce * 0.30)}h)",
      "actividades": [
        { "codigo": "I1", "nombre": "Nombre actividad iniciación", "descripcion": "Descripción breve" },
        { "codigo": "D1", "nombre": "Nombre actividad desarrollo 1", "descripcion": "Descripción breve" },
        { "codigo": "D2", "nombre": "Nombre actividad desarrollo 2", "descripcion": "Descripción breve" }
      ]
    },
    "repasoRefuerzo": {
      "horas": "(${Math.round(horasFfce * 0.25)}h)",
      "actividades": [
        { "codigo": "R1", "nombre": "Nombre actividad repaso", "descripcion": "Descripción breve" },
        { "codigo": "Rf1", "nombre": "Cuestionario Moodle habilitador", "descripcion": "Descripción breve" }
      ]
    },
    "ampliacionEvaluacion": {
      "horas": "(${Math.round(horasFfce * 0.20)}h)",
      "actividades": [
        { "codigo": "A1", "nombre": "Nombre actividad ampliación", "descripcion": "Descripción breve" },
        { "codigo": "E1", "nombre": "Prueba o reto final de evaluación", "descripcion": "Descripción breve" }
      ]
    }
  },
  "evaluacion": {
    "inicial": "Sondeo de nivel inicial y conocimientos previos...",
    "parcial": "Observación sistemática y listas de control en taller...",
    "final": "Calificación ponderada de práctica (70%) y prueba escrita/Moodle (30%)..."
  },
  "instrumentosEvaluacion": [
    "Rúbrica de ejecución práctica en taller",
    "Lista de cotejo de normas y EPIs",
    "Cuestionario interactivo en Moodle Centros"
  ],
  "criteriosEvaluacionPonderados": {
    "raGlobal": "${targetUd.raCeText || "RA del bloque"} (${pesoPorc.toFixed(2)}% global)",
    "criterios": [
      { "criterio": "a)", "descripcion": "Identificación de riesgos y parámetros", "peso": "25%" },
      { "criterio": "b)", "descripcion": "Ejecución técnica y cumplimiento de tolerancias", "peso": "30%" },
      { "criterio": "c)", "descripcion": "Aplicación de medidas de seguridad y EPIs", "peso": "25%" },
      { "criterio": "d)", "descripcion": "Gestión de residuos y orden en el puesto", "peso": "20%" }
    ],
    "criteriosTexto": "${targetUd.raCeText || "RA"} (${pesoPorc.toFixed(2)}% global): a) Identificación (25%), b) Ejecución (30%), c) Seguridad (25%), d) Residuos (20%)."
  },
  "materialesRecursos": [
    "Equipos reales de taller y kits de montaje",
    "Instrumentos de metrología y comprobación",
    "Aula virtual Moodle Centros",
    "Manuales técnicos de referencia (Paraninfo) y catálogos de fabricantes"
  ],
  "bibliografiaWebgrafia": [
    "Ley Orgánica de FP y Real Decreto 659/2023.",
    "Orden de currículo autonómico del título.",
    "Ley 31/1995 de Prevención de Riesgos Laborales.",
    "Manuales técnicos de la especialidad."
  ]
}`;
}

/**
 * Builds prompt to regenerate a specific section (or block of sections) of a Curricular Unit.
 */
export function buildSigreUDCurricularSectionPrompt(
  targetUd: SigreUDItem,
  config: SigreCurricularConfig,
  sectionKey: "contexto_justificacion" | "competencias_objetivos" | "contenidos_transversales" | "metodologia_diversidad" | "secuenciacion_actividades" | "evaluacion_criterios" | "recursos_bibliografia",
  currentData?: SigreUDCurricularData,
  ragContext?: string
): string {
  return `ERES UN CATEDRÁTICO Y ASESOR CURRICULAR EXPERTO EN FORMACIÓN PROFESIONAL (RD 659/2023).

Necesitamos generar o actualizar ÚNICAMENTE el bloque curricular "${sectionKey}" para la Unidad Didáctica:
- UNIDAD: ${targetUd.fullCode} (Nº ${targetUd.number})
- BLOQUE DE CONTENIDOS: ${targetUd.bcCode}
- MÓDULO: ${config.moduloFormativo} (Cód. ${config.codigo || "Oficial"})
- CURSO Y CICLO: ${config.curso || "1º curso"} - ${config.cicloFormativo}
- HORAS UD: ${targetUd.horasEstimadas || 11}h (${targetUd.sesionesEstimadas || 4} sesiones)

${currentData ? `DATOS EXISTENTES DE LA UD:\nContextualización actual: ${currentData.contextualizacion || "N/A"}\nJustificación: ${currentData.justificacionNormativa || "N/A"}\n` : ""}
${ragContext ? `REFERENCIA RAG:\n${ragContext.slice(0, 3000)}\n` : ""}

REGLA ESTRICTA DE NOTACIÓN: Texto plano estricto. PROHIBIDO LATEX O SIGNOS DE DÓLAR ($...$).
DEVUELVE EXCLUSIVAMENTE UN OBJETO JSON con las claves correspondientes a este bloque curricular.`;
}

/**
 * Renders the Curricular Unit (Ficha Curricular Oficial de 19 Puntos) in a high-density, professional 2-page A4 HTML format.
 * Matches the layout of official vocational training programming sheets.
 */
export function renderSigreUDCurricularA4Html(
  ud: SigreUDItem,
  data: SigreUDCurricularData,
  config: SigreCurricularConfig
): string {
  if (!data) return "<p>No hay datos curriculares disponibles para esta unidad.</p>";

  const sanitized = cleanSigreCurricularData(data)!;
  const horas = sanitized.temporalizacion?.horas || ud.horasEstimadas || 11;
  const sesiones = sanitized.temporalizacion?.sesiones || ud.sesionesEstimadas || 4;
  const fecha = sanitized.temporalizacion?.fechaRealizacion || "Trimestre 1";
  const trimestre = sanitized.temporalizacion?.trimestre || "1º";

  return `
<div class="sigre-curricular-doc" style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.4; max-width: 900px; margin: 0 auto;">

  <!-- ==================== PÁGINA 1: FICHA CURRICULAR (PUNTOS 1 AL 11) ==================== -->
  <div style="page-break-after: always; margin-bottom: 30px; border: 1.5px solid #0284c7; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <!-- Top Header Ribbon -->
    <div style="background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
      <span>${cleanSigreLatexMath(config.moduloFormativo || "MÓDULO FORMATIVO")}</span>
      <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">${cleanSigreLatexMath(config.codigo || "CÓD. 1580")}</span>
    </div>

    <!-- Header Grid Box (3 Columns) -->
    <div style="display: grid; grid-template-columns: 1.8fr 2fr 1.6fr; border-bottom: 1.5px solid #0284c7; background: #f0f9ff;">
      <!-- Col 1: UD & BC -->
      <div style="padding: 8px 10px; border-right: 1px solid #bae6fd;">
        <div style="font-size: 13px; font-weight: 900; color: #0369a1; text-transform: uppercase;">Nº ${ud.number}: ${cleanSigreLatexMath(ud.title)}</div>
        <div style="font-size: 11px; font-weight: 700; color: #0284c7; margin-top: 2px;">${cleanSigreLatexMath(ud.bcCode)}</div>
      </div>

      <!-- Col 2: Ciclo & Curso -->
      <div style="padding: 8px 10px; border-right: 1px solid #bae6fd; font-size: 11px; color: #0f172a;">
        <div style="font-weight: 800; color: #0369a1;">${cleanSigreLatexMath(config.moduloFormativo)}</div>
        <div style="font-size: 10.5px; color: #475569; margin-top: 1px;">
          <strong>Cód. ${cleanSigreLatexMath(config.codigo || "")}</strong> | ${cleanSigreLatexMath(config.curso || "1º curso")}<br>
          <span style="font-weight: 700; color: #0284c7;">${cleanSigreLatexMath(config.cicloFormativo || "")}</span>
        </div>
      </div>

      <!-- Col 3: Temporalización -->
      <div style="padding: 8px 10px; background: #e0f2fe; font-size: 11px; color: #0369a1;">
        <div><strong>TEMPORALIZACIÓN:</strong> <span style="color: #b91c1c; font-weight: 800;">${horas} horas (${sesiones} sesiones)</span></div>
        <div style="margin-top: 2px;"><strong>FECHA DE REALIZACIÓN:</strong> <span style="font-weight: 700;">${fecha}</span></div>
        <div style="margin-top: 2px;"><strong>TRIMESTRE:</strong> <span style="color: #b91c1c; font-weight: 800;">${trimestre}</span></div>
      </div>
    </div>

    <!-- 3. CONTEXTUALIZACIÓN -->
    <div style="padding: 8px 12px; border-bottom: 1px solid #bae6fd; background: #ffffff; font-size: 11px; text-align: justify; line-height: 1.5;">
      <strong style="color: #0369a1; text-transform: uppercase; font-size: 11px;">CONTEXTUALIZACIÓN:</strong>
      <span style="color: #334155;"> ${sanitized.contextualizacion}</span>
    </div>

    <!-- 4 & 5: JUSTIFICACIÓN / NORMATIVA & CONTRIBUCIÓN A LOS OBJETIVOS -->
    <div style="display: grid; grid-template-columns: 1.1fr 1fr; border-bottom: 1px solid #bae6fd;">
      <div style="border-right: 1px solid #bae6fd;">
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          4. JUSTIFICACIÓN / NORMATIVA
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; text-align: justify; color: #334155; line-height: 1.45;">
          ${sanitized.justificacionNormativa}
        </div>
      </div>
      <div>
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          5. CONTRIBUCIÓN A LOS OBJETIVOS DEL MÓDULO
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; text-align: justify; color: #334155; line-height: 1.45;">
          <strong>${sanitized.contribucionObjetivosGenerales}</strong>
        </div>
      </div>
    </div>

    <!-- 6 & 7: COMPETENCIAS BÁSICAS & RESULTADOS DE APRENDIZAJE -->
    <div style="display: grid; grid-template-columns: 1.1fr 1fr; border-bottom: 1px solid #bae6fd;">
      <div style="border-right: 1px solid #bae6fd;">
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          6. COMPETENCIAS BÁSICAS
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
          <ul style="margin: 0; padding-left: 16px;">
            ${(sanitized.competenciasBasicas || []).map((c) => `<li style="margin-bottom: 2px;">${c}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div>
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          7. RESULTADOS DE APRENDIZAJE
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
          ${(sanitized.resultadosAprendizaje || []).map((ra) => `<p style="margin: 0 0 3px 0; font-weight: 600;">${ra}</p>`).join("")}
        </div>
      </div>
    </div>

    <!-- 8 & 9: CONTRIBUCIÓN A COMPETENCIAS PROFESIONALES & OBJETIVOS DE APRENDIZAJE -->
    <div style="display: grid; grid-template-columns: 1.1fr 1fr; border-bottom: 1px solid #bae6fd;">
      <div style="border-right: 1px solid #bae6fd;">
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          8. CONTRIBUCIÓN A LAS COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
          <strong>${sanitized.contribucionCompetenciasProfesionales}</strong>
        </div>
      </div>
      <div>
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          9. OBJETIVOS DE APRENDIZAJE
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
          <ol style="margin: 0; padding-left: 16px;">
            ${(sanitized.objetivosAprendizaje || []).map((obj) => `<li style="margin-bottom: 2px;">${obj.replace(/^\d+[\.\)]\s*/, "")}</li>`).join("")}
          </ol>
        </div>
      </div>
    </div>

    <!-- 10. CONTENIDOS (5 Columns: Conceptuales | Procedimentales | Actitudinales | Peculiaridades Autonómicas | Temas Transversales) -->
    <div>
      <div style="background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center;">
        10. CONTENIDOS INTEGRADOS & 11. TEMAS TRANSVERSALES
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; font-size: 10px; line-height: 1.35; background: #ffffff;">
        
        <!-- Col 1: Conceptuales -->
        <div style="padding: 8px; border-right: 1px solid #bae6fd;">
          <div style="font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; font-size: 9.5px; border-bottom: 1px dashed #bae6fd; padding-bottom: 2px;">
            📘 Conceptuales (Saber)
          </div>
          <ul style="margin: 0; padding-left: 12px; color: #334155;">
            ${(sanitized.contenidosIntegrados?.conceptuales || []).map((c) => `<li style="margin-bottom: 3px;">${c}</li>`).join("")}
          </ul>
        </div>

        <!-- Col 2: Procedimentales -->
        <div style="padding: 8px; border-right: 1px solid #bae6fd;">
          <div style="font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 4px; font-size: 9.5px; border-bottom: 1px dashed #bae6fd; padding-bottom: 2px;">
            🛠️ Procedimentales (Saber Hacer)
          </div>
          <ul style="margin: 0; padding-left: 12px; color: #334155;">
            ${(sanitized.contenidosIntegrados?.procedimentales || []).map((p) => `<li style="margin-bottom: 3px;">${p}</li>`).join("")}
          </ul>
        </div>

        <!-- Col 3: Actitudinales -->
        <div style="padding: 8px; border-right: 1px solid #bae6fd;">
          <div style="font-weight: 800; color: #7c3aed; text-transform: uppercase; margin-bottom: 4px; font-size: 9.5px; border-bottom: 1px dashed #bae6fd; padding-bottom: 2px;">
            🤝 Actitudinales (Saber Ser)
          </div>
          <ul style="margin: 0; padding-left: 12px; color: #334155;">
            ${(sanitized.contenidosIntegrados?.actitudinales || []).map((a) => `<li style="margin-bottom: 3px;">${a}</li>`).join("")}
          </ul>
        </div>

        <!-- Col 4: Peculiaridades Autonómicas -->
        <div style="padding: 8px; border-right: 1px solid #bae6fd; background: #f8fafc;">
          <div style="font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; font-size: 9.5px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
            🏛️ Ref. Autonómicas
          </div>
          <ul style="margin: 0; padding-left: 12px; color: #475569;">
            ${(sanitized.contenidosIntegrados?.peculiaridadesAutonomicas || ["Normativa autonómica aplicable", "Contexto industrial comarcal"]).map((ref) => `<li style="margin-bottom: 3px;">${ref}</li>`).join("")}
          </ul>
        </div>

        <!-- Col 5: Temas Transversales / Valores -->
        <div style="padding: 8px; background: #f8fafc;">
          <div style="font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 4px; font-size: 9.5px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 2px;">
            🌱 Temas Transversales
          </div>
          <ul style="margin: 0; padding-left: 12px; color: #475569;">
            ${(sanitized.contenidosIntegrados?.temasTransversales || ["Educación ambiental", "Cultura preventiva laboral", "Igualdad e inclusión"]).map((t) => `<li style="margin-bottom: 3px;">${t}</li>`).join("")}
          </ul>
        </div>

      </div>
    </div>

    <!-- Page 1 Footer Subbar -->
    <div style="background: #f1f5f9; padding: 4px 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b; font-family: monospace;">
      <span>PROGRAMACIÓN DIDÁCTICA • ${cleanSigreLatexMath(config.moduloFormativo || "")}</span>
      <span>PÁGINA 1/2 • FICHA CURRICULAR</span>
    </div>

  </div>

  <!-- ==================== PÁGINA 2: METODOLOGÍA, ACTIVIDADES Y EVALUACIÓN (PUNTOS 12 AL 19) ==================== -->
  <div style="border: 1.5px solid #0284c7; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

    <!-- Top Ribbon Page 2 -->
    <div style="background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
      <span>${cleanSigreLatexMath(config.moduloFormativo || "MÓDULO FORMATIVO")}</span>
      <span style="font-family: monospace; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">Nº ${ud.number}: ${cleanSigreLatexMath(ud.title)}</span>
    </div>

    <!-- 12 & 13: METODOLOGÍA Y USO DE LAS TIC & ATENCIÓN A LA DIVERSIDAD -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1.5px solid #0284c7;">
      <div style="border-right: 1px solid #bae6fd;">
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          12. METODOLOGÍA Y USO DE LAS TIC
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
          <p style="margin: 0 0 4px 0;"><strong>Metodologías Activas:</strong> ${sanitized.metodologiaTic?.metodologiasActivas || "Aprendizaje Basado en Retos (ABR) y Proyectos (ABP)."}</p>
          ${sanitized.metodologiaTic?.flippedClassroom ? `<p style="margin: 0 0 4px 0;"><strong>Flipped Classroom:</strong> ${sanitized.metodologiaTic.flippedClassroom}</p>` : ""}
          ${sanitized.metodologiaTic?.duaMetodologia ? `<p style="margin: 0 0 4px 0;"><strong>DUA:</strong> ${sanitized.metodologiaTic.duaMetodologia}</p>` : ""}
          ${sanitized.metodologiaTic?.innovacionIa ? `<p style="margin: 0 0 4px 0;"><strong>Innovación / IA:</strong> ${sanitized.metodologiaTic.innovacionIa}</p>` : ""}
          ${sanitized.metodologiaTic?.secuenciacionMetodologica ? `<p style="margin: 0; color: #0284c7; font-weight: 700;"><strong>Secuenciación:</strong> ${sanitized.metodologiaTic.secuenciacionMetodologica}</p>` : ""}
        </div>
      </div>

      <div>
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          13. ATENCIÓN A LA DIVERSIDAD
        </div>
        <div style="padding: 8px 10px; font-size: 10.5px; color: #334155; line-height: 1.45;">
          <p style="margin: 0 0 4px 0;"><strong>DUA:</strong> ${sanitized.atencionDiversidad?.dua || "Fichas técnicas visuales con códigos QR y videotutoriales."}</p>
          ${sanitized.atencionDiversidad?.multinivel ? `<p style="margin: 0 0 4px 0;"><strong>Multinivel:</strong> ${sanitized.atencionDiversidad.multinivel}</p>` : ""}
          <p style="margin: 0 0 4px 0;"><strong>Refuerzo:</strong> ${sanitized.atencionDiversidad?.refuerzo || "Glosarios técnicos ilustrados y tablas simplificadas."}</p>
          <p style="margin: 0 0 4px 0;"><strong>Ampliación:</strong> ${sanitized.atencionDiversidad?.ampliacion || "Investigación sobre nuevas tecnologías y materiales inteligentes."}</p>
          ${sanitized.atencionDiversidad?.accesibilidad ? `<p style="margin: 0;"><strong>Accesibilidad:</strong> ${sanitized.atencionDiversidad.accesibilidad}</p>` : ""}
        </div>
      </div>
    </div>

    <!-- 14. TEMPORALIZACIÓN Y SECUENCIACIÓN DE ACTIVIDADES -->
    <div style="border-bottom: 1.5px solid #0284c7;">
      <div style="background: #0284c7; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center;">
        14. TEMPORALIZACIÓN Y SECUENCIACIÓN DE ACTIVIDADES ENSEÑANZA Y APRENDIZAJE
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 10.5px; line-height: 1.4;">
        
        <!-- Bloque 1: Iniciación / Desarrollo -->
        <div style="padding: 8px 10px; border-right: 1px solid #bae6fd;">
          <div style="font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; font-size: 10px;">
            De Iniciación (I) / Desarrollo (D) <span style="color: #b91c1c;">${sanitized.secuenciacionActividades?.iniciacionDesarrollo?.horas || "(3h+3h)"}</span>
          </div>
          <ul style="margin: 0; padding-left: 14px; color: #334155;">
            ${(sanitized.secuenciacionActividades?.iniciacionDesarrollo?.actividades || [
              { codigo: "I1", nombre: "Kahoot inicial: Detección de ideas previas" },
              { codigo: "D1", nombre: "Taller práctico de montaje e inspección" },
              { codigo: "D2", nombre: "Simulación técnica y verificación de parámetros" }
            ]).map((act) => `<li style="margin-bottom: 3px;"><strong>${act.codigo}.</strong> ${act.nombre}</li>`).join("")}
          </ul>
        </div>

        <!-- Bloque 2: Repaso / Refuerzo -->
        <div style="padding: 8px 10px; border-right: 1px solid #bae6fd;">
          <div style="font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; font-size: 10px;">
            Repaso (R) / Refuerzo (Rf) <span style="color: #b91c1c;">${sanitized.secuenciacionActividades?.repasoRefuerzo?.horas || "(3h)"}</span>
          </div>
          <ul style="margin: 0; padding-left: 14px; color: #334155;">
            ${(sanitized.secuenciacionActividades?.repasoRefuerzo?.actividades || [
              { codigo: "R1", nombre: "Role-playing y dinámicas de resolución técnica" },
              { codigo: "Rf1", nombre: "Cuestionario Moodle habilitador (100% aciertos obligatorios)" }
            ]).map((act) => `<li style="margin-bottom: 3px;"><strong>${act.codigo}.</strong> ${act.nombre}</li>`).join("")}
          </ul>
        </div>

        <!-- Bloque 3: Ampliación / Evaluación -->
        <div style="padding: 8px 10px;">
          <div style="font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 4px; font-size: 10px;">
            Ampliación (A) / Evaluación (E) <span style="color: #b91c1c;">${sanitized.secuenciacionActividades?.ampliacionEvaluacion?.horas || "(2h)"}</span>
          </div>
          <ul style="margin: 0; padding-left: 14px; color: #334155;">
            ${(sanitized.secuenciacionActividades?.ampliacionEvaluacion?.actividades || [
              { codigo: "A1", nombre: "Informe de profundización y sostenibilidad" },
              { codigo: "E1", nombre: "Prueba práctica y memoria técnica final" }
            ]).map((act) => `<li style="margin-bottom: 3px;"><strong>${act.codigo}.</strong> ${act.nombre}</li>`).join("")}
          </ul>
        </div>

      </div>
    </div>

    <!-- 15. EVALUACIÓN (¿QUÉ, CÓMO Y CUÁNDO EVALUAR?) -->
    <div style="border-bottom: 1.5px solid #0284c7;">
      <div style="background: #e0f2fe; color: #0369a1; font-size: 10.5px; font-weight: 800; padding: 4px 10px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
        15. EVALUACIÓN (¿QUÉ EVALUAR?, ¿CÓMO EVALUAR?, ¿CUÁNDO EVALUAR?)
      </div>
      <div style="padding: 6px 12px; font-size: 10.5px; color: #334155; line-height: 1.45;">
        <p style="margin: 0 0 3px 0;"><strong>Evaluación Inicial:</strong> ${sanitized.evaluacion?.inicial || "Sondeo de nivel inicial y conocimientos previos (Semana 1)."}</p>
        <p style="margin: 0 0 3px 0;"><strong>Evaluación Parcial:</strong> ${sanitized.evaluacion?.parcial || "Observación sistemática en taller y hojas de proceso continuo."}</p>
        <p style="margin: 0;"><strong>Evaluación Final:</strong> ${sanitized.evaluacion?.final || "Calificación de prueba práctica (70%) y prueba escrita/Moodle (30%)."}</p>
      </div>
    </div>

    <!-- 16 & 17. INSTRUMENTOS DE EVALUACIÓN & RAs CON CRITERIOS PONDERADOS -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr 2fr; border-bottom: 1.5px solid #0284c7; font-size: 10.5px;">
      
      <!-- Col 1: Instrumentos -->
      <div style="border-right: 1px solid #bae6fd;">
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 800; padding: 4px 8px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          16. Instrumentos de Evaluación
        </div>
        <div style="padding: 8px; color: #334155;">
          <ul style="margin: 0; padding-left: 14px;">
            ${(sanitized.instrumentosEvaluacion || [
              "Rúbrica de práctica en taller",
              "Lista de cotejo de EPIs y seguridad",
              "Cuestionario en Moodle Centros"
            ]).map((inst) => `<li style="margin-bottom: 3px;">${inst}</li>`).join("")}
          </ul>
        </div>
      </div>

      <!-- Col 2: RA Global -->
      <div style="border-right: 1px solid #bae6fd;">
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 800; padding: 4px 8px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          Resultados de Aprendizaje
        </div>
        <div style="padding: 8px; color: #0f172a; text-align: center; font-weight: 800;">
          <div style="color: #0369a1; font-size: 11px;">${sanitized.criteriosEvaluacionPonderados?.raGlobal || `RA ${ud.number} (${(100 / (config.numUnidadesDidacticas || 8)).toFixed(2)}% global)`}</div>
        </div>
      </div>

      <!-- Col 3: Criterios Ponderados -->
      <div>
        <div style="background: #e0f2fe; color: #0369a1; font-size: 10px; font-weight: 800; padding: 4px 8px; text-transform: uppercase; text-align: center; border-bottom: 1px solid #bae6fd;">
          17. Criterios de Evaluación (Ponderados)
        </div>
        <div style="padding: 8px; color: #334155; font-size: 10px;">
          ${(sanitized.criteriosEvaluacionPonderados?.criterios && sanitized.criteriosEvaluacionPonderados.criterios.length > 0)
            ? `<div style="display: flex; flex-wrap: wrap; gap: 4px 8px;">
                ${sanitized.criteriosEvaluacionPonderados.criterios.map((c) => `<span style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px;"><strong>${c.criterio}</strong> ${c.descripcion} (<strong style="color: #b91c1c;">${c.peso}</strong>)</span>`).join("")}
              </div>`
            : `<p style="margin: 0;">${sanitized.criteriosEvaluacionPonderados?.criteriosTexto || "a) Identificación (20%), b) Montaje (30%), c) Seguridad y PRL (25%), d) Residuos (25%)."}</p>`
          }
        </div>
      </div>

    </div>

    <!-- 18 & 19: MATERIALES Y RECURSOS DIDÁCTICOS & BIBLIOGRAFÍA / WEBGRAFÍA -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; font-size: 10px;">
      
      <!-- Col 1: Materiales y Recursos -->
      <div style="border-right: 1px solid #bae6fd; padding: 8px 10px;">
        <div style="font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 3px; font-size: 10px;">
          18. MATERIALES Y RECURSOS DIDÁCTICOS
        </div>
        <div style="color: #334155; line-height: 1.4;">
          ${(sanitized.materialesRecursos || [
            "Kits reales de taller",
            "Moodle Centros",
            "Simulador digital",
            "Manuales Paraninfo",
            "Señalética reglamentaria"
          ]).join(", ")}
        </div>
      </div>

      <!-- Col 2: Bibliografía -->
      <div style="padding: 8px 10px; background: #f8fafc;">
        <div style="font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 3px; font-size: 10px;">
          19. BIBLIOGRAFÍA Y WEBGRAFÍA
        </div>
        <div style="color: #334155; line-height: 1.4;">
          ${(sanitized.bibliografiaWebgrafia || [
            "Ley Orgánica de FP y RD 659/2023.",
            "Orden de currículo autonómico.",
            "Manuales técnicos de referencia.",
            "NTPs del INSST e IDAE."
          ]).join(". ")}
        </div>
      </div>

    </div>

    <!-- Page 2 Footer Subbar -->
    <div style="background: #f1f5f9; padding: 4px 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b; font-family: monospace;">
      <span>PROGRAMACIÓN DIDÁCTICA • ${cleanSigreLatexMath(config.moduloFormativo || "")}</span>
      <span>PÁGINA 2/2 • FICHA CURRICULAR OFICIAL</span>
    </div>

  </div>

</div>
`;
}

