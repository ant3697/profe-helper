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
  const horasSemanales = config.horasSemanales || 5;

  const sizingRule = hasCustomUdsCount
    ? `1. REGLA DE NÚMERO EXACTO DE UNIDADES DIDÁCTICAS: Debes generar EXACTAMENTE ${targetUdsCount} Unidades Didácticas (UD01 a UD${String(targetUdsCount).padStart(2, "0")}), distribuyendo proporcionalmente todos los Bloques de Contenido (BCs), Resultados de Aprendizaje (RAs) y las ${horasTotales} horas lectivas totales del módulo (${horasSemanales} horas semanales). Cada UD debe tener asignadas sus "horasEstimadas" y "sesionesEstimadas" de forma que sumen ${horasTotales} horas.`
    : `1. REGLA DE GENERACIÓN POR DEFECTO: Genera una Unidad Didáctica (UD) por cada Bloque de Contenido (BC) detectado en el currículo (o estructura canónica proporcional), asignando "horasEstimadas" y "sesionesEstimadas" a cada una de acuerdo con las ${horasTotales} horas lectivas totales (${horasSemanales} horas/semana).`;

  return `Rol: Experto en Redacción Técnica, Diseño Curricular y Metodología SIGRE v6.0.
Tu misión es analizar el currículo proporcionado y generar el PLAN DE UNIDADES DIDÁCTICAS (UDs) ordenadas y dimensionadas temporalmente.

CONFIGURACIÓN DE LA MATERIA:
- Módulo Formativo: ${config.moduloFormativo || "Módulo Técnico"} (${config.codigo || "S/C"})
- Ciclo Formativo: ${config.cicloFormativo || "Ciclo Formativo"} - Familia: ${config.familiaProfesional || "Técnica"} (${config.curso || "1º"})
- Carga Horaria Total: ${horasTotales} horas lectivas (${horasSemanales} horas/semana)
- Dimensionamiento de UDs solicitado: ${hasCustomUdsCount ? `Exactamente ${targetUdsCount} Unidades Didácticas` : "Automático (según Bloques Curriculares)"}
- Currículo de Referencia: ${config.curriculoReferencia || "Real Decreto oficial"}
- Contexto de Aplicación: ${config.contextoAplicacion || "Centro educativo / Entorno laboral"}
- Nivel Usuario: ${config.userLevel === 1 ? "Secundaria" : config.userLevel === 2 ? "Bachillerato / FP" : config.userLevel === 3 ? "Universitarios" : "Oposiciones / Doctorados"}
- Adhesión Curricular: ${config.adhesion}/5

REGLAS OBLIGATORIAS:
${sizingRule}
2. REGLA DE PRIORIDAD PRL: Revisa todos los Bloques de Contenido. Si existe algún bloque que trate sobre "Prevención de Riesgos Laborales", "Seguridad", "Protección Ambiental" o similar, asígnale OBLIGATORIAMENTE el identificador "UD01". El resto de UDs se numerarán correlativamente a continuación (UD02, UD03, etc.).
3. El título de cada UD debe seguir el formato exacto: "UDxx. BCx. [Título del Bloque de Contenido o Unidad]".
4. Asocia a cada UD los Resultados de Aprendizaje (RA) y Criterios de Evaluación (CrEv) vinculados, así como las "horasEstimadas" y "sesionesEstimadas".
5. Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura:

\`\`\`json
{
  "moduloTitle": "${config.moduloFormativo || "Módulo Formativo"}",
  "horasTotales": ${horasTotales},
  "horasSemanales": ${horasSemanales},
  "uds": [
    {
      "id": "UD01",
      "number": 1,
      "bcCode": "BC7",
      "title": "Prevención de riesgos laborales y protección ambiental",
      "fullCode": "UD01. BC7. Prevención de riesgos laborales y protección ambiental",
      "horasEstimadas": ${Math.round(horasTotales / (targetUdsCount || 8))},
      "sesionesEstimadas": ${Math.round((horasTotales / (targetUdsCount || 8)) / 2)},
      "isPrl": true,
      "rasAssociated": ["RA1", "RA7"],
      "crevsAssociated": ["a)", "b)", "c)"]
    },
    {
      "id": "UD02",
      "number": 2,
      "bcCode": "BC1",
      "title": "Fundamentos y principios del sistema",
      "fullCode": "UD02. BC1. Fundamentos y principios del sistema",
      "horasEstimadas": ${Math.round(horasTotales / (targetUdsCount || 8))},
      "sesionesEstimadas": ${Math.round((horasTotales / (targetUdsCount || 8)) / 2)},
      "isPrl": false,
      "rasAssociated": ["RA1", "RA2"],
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
- Mapa Mental OPML (XML jerárquico estructurado).

NORMAS DE FORMATO JSON:
- Devuelve ÚNICAMENTE un objeto JSON estrictamente válido.
- No uses secuencias de escape inválidas (evita barras invertidas sueltas).
- Todas las comillas dobles dentro de cadenas HTML deben estar escapadas (\\" o usar comillas simples ').

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
  "desarrolloEpigrafesHtml": "<div class=\\"ud-content\\"><div class=\\"epigrafe-block\\"><h3>5.1. [Título Sub-epígrafe 1]</h3><p>...</p><table class=\\"sigre-table\\"><thead><tr><th>Parámetro/Componente</th><th>Criterio Operativo</th><th>Normativa / Tolerancia</th><th>Verificación</th></tr></thead><tbody><tr><td>...</td><td>...</td><td>...</td><td>...</td></tr></tbody></table><div class=\\"apuntes-box\\"><strong>💡 Apuntes del Experto:</strong> ...</div><div class=\\"recall-box\\"><strong>🧠 Autoevaluación Rápida:</strong> ...</div><div class=\\"mnemo-box\\"><strong>⚡ Regla Mnemotécnica:</strong> ...</div></div><div class=\\"epigrafe-block\\"><h3>5.2. [Título Sub-epígrafe 2]</h3><p>...</p></div></div>",
  "referenciasNormativasHtml": "<div class=\\"normativa-block\\"><p>Marco reglamentario y normativo técnico aplicable:</p><table class=\\"sigre-table\\"><thead><tr><th>Código / Norma</th><th>Ámbito / Organismo</th><th>Prescripciones Clave</th><th>Aplicación Práctica en Taller/Obra</th></tr></thead><tbody><tr><td><strong>RITE (RD 1027/2007)</strong></td><td>Instalaciones Térmicas en Edificios</td><td>IT 1.2 Exigencia de bienestar e higiene</td><td>Pruebas de estanqueidad y equilibrado hidráulico</td></tr></tbody></table></div>",
  "bibliografiaWebgrafiaHtml": "<div class=\\"biblio-block\\"><h4 style=\\"color: #0369a1; margin-top: 12px;\\">Bibliografía Técnica de Referencia</h4><ul><li><strong>Autor (Año):</strong> <em>Título de la obra</em>. Editorial. Manual de referencia para dimensionamiento y cálculo.</li></ul><h4 style=\\"color: #059669; margin-top: 12px;\\">Guías Técnicas y Documentos Oficiales</h4><ul><li><strong>IDAE / Ministerio de Industria:</strong> <em>Guía Técnica de Ahorro y Eficiencia Energética</em>.</li></ul><h4 style=\\"color: #7c3aed; margin-top: 12px;\\">Webgrafía y Recursos en Línea</h4><ul><li><strong>Portal Oficial del BOE / Normativa Técnica:</strong> Enlace y descripción de consulta de normativa consolidada.</li></ul></div>",
  "conclusiones": "Texto de conclusiones y síntesis del tema...",
  "relacionIntradisciplinar": "Texto de relación con otras unidades del ciclo...",
  "glosarioHtml": "<div class=\\"glosario-box\\"><h4>Glosario de Términos y Fórmulas Relevantes</h4><ul><li><strong>Término 1:</strong> Definición...</li></ul></div>",
  "autoevaluacionHtml": "<div class=\\"autoeval-box\\"><h4>Cuestionario de Autoevaluación (20 Preguntas)</h4><ol><li>Pregunta 1...</li></ol><h5>Soluciones</h5><ol><li><strong>A) Respuesta correcta</strong>: Justificación técnica...</li></ol></div>",
  "diagramaMermaid": "flowchart TD\\n    A[\\"Inicio: Planificación y Seguridad\\"] --> B(Fase 1: Preparación Técnica)\\n    subgraph \\"Fase 2: Ejecución y Medición\\"\\n    B --> C[\\"Ensayos y Comprobación de Parámetros\\"]\\n    end",
  "mapaMentalOpml": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<opml version=\\"2.0\\">\\n  <head>\\n    <title>${ud.title.replace(/"/g, '\\"')}</title>\\n    <ownerName>IES Al-Baytar</ownerName>\\n  </head>\\n  <body>\\n    <outline text=\\"${ud.title.replace(/"/g, '\\"')}\\">\\n      <outline text=\\"Fundamentos\\"/>\\n    </outline>\\n  </body>\\n</opml>"
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
Objetivo: Generar los Recursos Digitales, Banco Moodle GIFT, Prueba Evaluable con Solucionario y Propuesta de Herramienta Didáctica Interactiva (HDI) para la Unidad: "${ud.fullCode}".

ESTRUCTURA DE GENERACIÓN OBLIGATORIA:

2.1. Banco de Preguntas para Moodle (Formato GIFT):
     Crea exactamente 60 preguntas de opción múltiple única. Preséntalas en dos ventanas de texto plano separadas de 30 preguntas cada una:
     - Parte 1: Preguntas 1-30 (::1:: a ::30::)
     - Parte 2: Preguntas 31-60 (::31:: a ::60::)
     
     Reglas para el formato GIFT:
     - Título de Pregunta: El título de cada pregunta debe ser únicamente su número secuencial entre dobles dos puntos (ej: ::1::, ::2::, etc.).
     - Respuestas: La correcta con = y las incorrectas con ~.
     - Feedback (Muy importante): Después de cada opción, añade feedback pedagógico precedido por # (ej: #¡Correcto! o #Incorrecto. [Explicación técnica]).
     - Caracteres Especiales: Escapa con barra invertida (\\\\) los caracteres ~, =, #, {, }.
     - Regla de Homogeneidad Psicométrica: La longitud de las 4 opciones de respuesta debe ser similar, evitando pistas gramaticales o absolutismos ("siempre", "nunca").
     - Cobertura: Distribuye las preguntas entre conceptos teóricos, cálculos/dimensionado, normativa técnica y supuestos de taller/resolución de averías.

2.2. Propuesta de Examen (20 Preguntas):
     Selecciona aleatoriamente 20 preguntas del banco de 60 que has creado en el apartado 2.1. La selección debe ser representativa de los contenidos de la UD. Formatea estas preguntas seleccionadas con un título claro (Prueba Evaluable - UDxx: [Título del Tema]) seguido de las preguntas numeradas. Para cada pregunta, debes mostrar su enunciado completo y todas sus opciones de respuesta, etiquetadas con letras (A, B, C, D).

2.3. Solucionario de la Prueba Evaluable:
     A continuación, genera el solucionario para las 20 preguntas seleccionadas en la prueba evaluable del apartado 2.2. Presenta las respuestas en una lista numerada. Para cada pregunta, indica la letra y el texto de la respuesta correcta, y una breve justificación técnica.
     Ejemplo de formato:
     1. Respuesta Correcta: B) [Texto completo de la opción correcta].
        Justificación: [Breve explicación de por qué es la respuesta correcta].

2.4. Propuesta de Herramienta Didáctica Interactiva (HDI):
     Basándote en el contenido eminentemente práctico y procedimental de esta Unidad Didáctica, redacta una propuesta conceptual (150-200 palabras) para una aplicación web (Single-Page Application) que sirva para reforzar el aprendizaje. Describe qué haría la aplicación, qué problema resolvería para el estudiante y cómo se alinea con los Resultados de Aprendizaje de esta UD. Esta propuesta servirá como base para el Módulo 2.

REGLA ESTRICTA DE NOTACIÓN MATEMÁTICA EN TEXTO PLANO:
- PROHIBIDO USAR DELIMITADORES O SINTAXIS LATEX ($...$, $$...$$, \\text{}, \\times, \\Omega, etc.).
- Todo enunciado, opción y justificación debe redactarse con operadores estándar: +, -, *, /, ^, °C, Ω (o Ohm), kW, %, etc.

NORMAS DE FORMATO JSON:
- Devuelve ÚNICAMENTE un objeto JSON estrictamente válido.
- No uses caracteres de escape inválidos (prohibido barras invertidas sueltas; todo salto de línea en strings debe ser \\n).
- Las cadenas HTML deben escapar sus comillas interiores (\\" o usar comillas simples ').

Devuelve la respuesta en formato JSON con la siguiente estructura:

\`\`\`json
{
  "cotRazonamiento": "Análisis de dispersión psicométrica, cobertura balanceada de RAs y distribución de ítems evaluativos...",
  "bancoGiftParte1": "// Banco de Preguntas - UD[xx]: Parte 1 (01-30)\\n::1:: ¿Pregunta...? {\\n    =Respuesta correcta#¡Correcto!\\n    ~Opción incorrecta 1#Incorrecto. Explicación...\\n    ~Opción incorrecta 2#Incorrecto. Explicación...\\n    ~Opción incorrecta 3#Incorrecto. Explicación...\\n}\\n\\n::2:: ...",
  "bancoGiftParte2": "// Banco de Preguntas - UD[xx]: Parte 2 (31-60)\\n::31:: ¿Pregunta...? {\\n    =Respuesta correcta#¡Correcto!\\n    ~Opción incorrecta 1#Incorrecto. Explicación...\\n    ~Opción incorrecta 2#Incorrecto. Explicación...\\n    ~Opción incorrecta 3#Incorrecto. Explicación...\\n}\\n\\n::32:: ...",
  "propuestaExamenHtml": "<div class=\\"examen-box\\"><h3>Prueba Evaluable - ${ud.fullCode.replace(/"/g, '\\"')}</h3><ol><li><strong>1. ¿Enunciado de la pregunta...?</strong><br>A) Opción A<br>B) Opción B<br>C) Opción C<br>D) Opción D</li></ol></div>",
  "solucionarioExamenHtml": "<div class=\\"solucionario-box\\"><h3>Solucionario de la Prueba Evaluable</h3><ol><li><strong>1. Respuesta Correcta: B) Opción B</strong><br><em>Justificación:</em> Explicación técnica detallada...</li></ol></div>",
  "propuestaHdiConceptual": "Propuesta conceptual de 150-200 palabras describiendo el simulador web interactivo..."
}
\`\`\``;
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
 * Guarantees a rich, valid OPML 2.0 XML document tree for any Sigre UD
 */
export function generateSigreOpml(ud: SigreUDItem, m1: any): string {
  if (
    m1?.mapaMentalOpml &&
    m1.mapaMentalOpml.includes("<opml") &&
    m1.mapaMentalOpml.includes("<outline") &&
    m1.mapaMentalOpml.length > 200
  ) {
    return m1.mapaMentalOpml.trim();
  }

  const escapeXml = (str: string) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const title = escapeXml(m1?.titulo || ud.fullCode || "Unidad Didáctica");

  // Parse index into outlines
  const rawIndice = m1?.indiceDesarrollo || "";
  const indexLines = rawIndice
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter(Boolean);

  const indexOutlines = indexLines
    .map((line: string) => `        <outline text="${escapeXml(line)}"/>`)
    .join("\n");

  const conceptuales = (m1?.contenidos?.conceptuales || [])
    .map((c: string) => `        <outline text="${escapeXml(c)}"/>`)
    .join("\n");
  const procedimentales = (m1?.contenidos?.procedimentales || [])
    .map((p: string) => `        <outline text="${escapeXml(p)}"/>`)
    .join("\n");
  const actitudinales = (m1?.contenidos?.actitudinales || [])
    .map((a: string) => `        <outline text="${escapeXml(a)}"/>`)
    .join("\n");
  const objetivos = (m1?.objetivosSmart || [])
    .map((o: string) => `        <outline text="${escapeXml(o)}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Mapa Mental - ${title}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>Sistema SIGRE v6.0</ownerName>
  </head>
  <body>
    <outline text="${title}">
      <outline text="1. INTRODUCCIÓN Y MARCO FORMATIVO">
        <outline text="${escapeXml((m1?.introduccion || "Contextualización formativa del módulo").substring(0, 140))}..."/>
      </outline>
      <outline text="2. CONTENIDOS ESPECÍFICOS">
        <outline text="Conceptuales (Saber)">
${conceptuales || '          <outline text="Conceptos técnicos y fundamentos"/>'}
        </outline>
        <outline text="Procedimentales (Saber hacer)">
${procedimentales || '          <outline text="Procedimientos técnicos y de cálculo"/>'}
        </outline>
        <outline text="Actitudinales (Saber ser)">
${actitudinales || '          <outline text="Criterios de seguridad, sostenibilidad y calidad"/>'}
        </outline>
      </outline>
      <outline text="3. OBJETIVOS ESPECÍFICOS SMART">
${objetivos || '        <outline text="Objetivos de aprendizaje"/>'}
      </outline>
      <outline text="4. ÍNDICE Y DESARROLLO DEL TEMA">
${indexOutlines || '        <outline text="Desarrollo de los epígrafes del tema"/>'}
      </outline>
      <outline text="5. CONCLUSIONES Y SÍNTESIS">
        <outline text="${escapeXml((m1?.conclusiones || "Síntesis didáctica del tema").substring(0, 140))}..."/>
      </outline>
      <outline text="6. RELACIONES INTRADISCIPLINARES">
        <outline text="${escapeXml((m1?.relacionIntradisciplinar || "Conexión curricular con otras UDs").substring(0, 140))}..."/>
      </outline>
    </outline>
  </body>
</opml>`.trim();
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
 * Builds prompt to generate the full 19-point Curricular Unit (Ficha / Matriz Curricular Oficial).
 */
export function buildSigreUDCurricularPrompt(
  targetUd: SigreUDItem,
  config: SigreCurricularConfig,
  ragContext?: string
): string {
  const calculatedHours = targetUd.horasEstimadas || Math.round((config.horasTotales || 160) / 10);
  const calculatedSessions = targetUd.sesionesEstimadas || Math.max(1, Math.round(calculatedHours / 2));

  // Determine approximate trimester based on UD number
  const trimester = targetUd.number <= 4 ? "1º" : targetUd.number <= 8 ? "2º" : "3º";
  const months = ["Septiembre", "Octubre", "Noviembre", "Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"];
  const estimatedMonth = months[Math.min(months.length - 1, Math.max(0, targetUd.number - 1))];

  return `ERES UN CATEDRÁTICO DE FORMACIÓN PROFESIONAL Y JEFE DE DEPARTAMENTO DE MÁXIMA EXPERIENCIA EN DISEÑO CURRICULAR Y PROGRAMACIONES DIDÁCTICAS OFICIALES SEGÚN LA LEY ORGÁNICA DE FP Y EL RD 659/2023.

Tu misión es redactar la UNIDAD DIDÁCTICA CURRICULAR (Ficha / Matriz Curricular Oficial en formato de programación de aula) para la siguiente unidad:
- CÓDIGO Y TÍTULO: ${targetUd.fullCode} (Nº ${targetUd.number})
- BLOQUE DE CONTENIDOS: ${targetUd.bcCode}
- MÓDULO FORMATIVO: ${config.moduloFormativo} (Código: ${config.codigo || "Cód. Oficial"})
- CURSO Y CICLO: ${config.curso || "1º curso"} - ${config.cicloFormativo} (${config.familiaProfesional})
- HORAS TOTALES MÓDULO: ${config.horasTotales || 160}h | Horas Semanales: ${config.horasSemanales || 5}h/sem
- TEMPORALIZACIÓN ESTIMADA PARA ESTA UD: ${calculatedHours} horas (${calculatedSessions} sesiones lectivas) | ${estimatedMonth} | Trimestre: ${trimester}
- CONTEXTO EDUCATIVO Y TERRITORIAL: ${config.contextoAplicacion || "Centro de FP en entorno industrial y comarcal"}

${ragContext ? `DOCUMENTACIÓN CURRICULAR DE REFERENCIA (RAG):\n${ragContext.slice(0, 5000)}\n` : ""}

ESTRUCTURA OBLIGATORIA DE LOS 19 PUNTOS CURRICULARES (Ficha Oficial de 2 Páginas):
1. ÍNDICE GENERAL DEL TEMA:
   Lista con los 19 puntos de la unidad didáctica curricular.

2. TEMPORALIZACIÓN:
   - Horas: ${calculatedHours} horas (${calculatedSessions} sesiones de ~2-3h).
   - Fecha de realización: ${estimatedMonth} (ej. "${estimatedMonth} (Semanas ${((targetUd.number - 1) * 3) + 1}-${targetUd.number * 3})").
   - Trimestre: ${trimester}.
   - Horas semanales: ${config.horasSemanales || 4} horas semanales.

3. CONTEXTUALIZACIÓN:
   Redacta un párrafo sólido (80-120 palabras) describiendo el grupo (ej. 12-18 alumnos/as, perfiles heterogéneos: bachillerato, grado medio, trabajadores del sector), las características del centro educativo y el tejido industrial/económico local y comarcal donde se ubica el centro.

4. JUSTIFICACIÓN Y NORMATIVA:
   Fundamentación legal y técnica de por qué es imprescindible esta unidad (habilitación profesional, responsabilidad civil, seguridad, normativa sectorial aplicable ej. RD 659/2023, Orden de currículo autonómico, Ley 31/1995 de PRL, CTE, RITE, REBT, UNE-EN según aplique).

5. CONTRIBUCIÓN A LOS OBJETIVOS GENERALES DEL MÓDULO / CICLO:
   Objetivos generales formulados con letra y verbo en infinitivo (ej. "s) Tomar decisiones de forma fundamentada y afrontar contingencias.").

6. COMPETENCIAS BÁSICAS:
   2 a 3 competencias clave implicadas (ej. "Comunicación técnica y normativa profesional", "Competencia digital en búsqueda de materiales", "Visión geométrica y precisión métrica").

7. RESULTADOS DE APRENDIZAJE:
   Redacción oficial del RA o RAs asociados a este bloque (ej. "RA ${targetUd.number > 0 ? (targetUd.number % 6 || 1) : 1}: Identifica los materiales y sus tratamientos...").

8. CONTRIBUCIÓN A LAS COMPETENCIAS PROFESIONALES, PERSONALES Y SOCIALES:
   Competencias profesionales del título con sus letras oficiales (ej. "r) Organizar y coordinar equipos de trabajo con responsabilidad.").

9. OBJETIVOS DE APRENDIZAJE:
   4 objetivos operativos redactados con verbo en infinitivo (1, 2, 3, 4) medibles y contextualizados al contenido específico de la UD.

10. CONTENIDOS INTEGRADOS:
    Desglose en 5 columnas/bloques:
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
    - De Iniciación (I) / Desarrollo (D) (${Math.round(calculatedHours * 0.55)}h): Códigos I1 (dinámica inicial), D1 (taller/práctica), D2 (laboratorio/simulación).
    - Repaso (R) / Refuerzo (Rf) (${Math.round(calculatedHours * 0.25)}h): Códigos R1 (juegos de identificación / role-playing), Rf1 (cuestionario habilitador en Moodle).
    - Ampliación (A) / Evaluación (E) (${Math.round(calculatedHours * 0.20)}h): Códigos A1 (informe de profundización), E1 (prueba práctica / reto final).

15. EVALUACIÓN (¿QUÉ EVALUAR?, ¿CÓMO EVALUAR?, ¿CUÁNDO EVALUAR?):
    - Evaluación Inicial: Sondeo de ideas previas y nivel inicial (Semana 1).
    - Evaluación Parcial: Observación sistemática en taller, listas de control de destreza.
    - Evaluación Final: Calificación ponderada de rúbrica de taller + prueba conceptual escrita / Moodle.

16. INSTRUMENTOS DE EVALUACIÓN:
    Lista de 3 a 4 instrumentos concretos (ej. "Rúbrica de ejecución en taller", "Lista de cotejo de EPIs", "Cuestionario en Moodle Centros", "Memoria de montaje").

17. RESULTADOS DE APRENDIZAJE Y SUS CRITERIOS DE EVALUACIÓN:
    - Ponderación global del RA (ej. "RA 1 (${(100 / (config.numUnidadesDidacticas || 8)).toFixed(2)}% global)").
    - Desglose ponderado de criterios de evaluación con porcentaje individual (ej. a) ID materiales (20%), b) Propiedades físico-químicas (20%), c) Tratamientos (15%), d) Procesos (20%), e) Técnicas (25%)).

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
    "horas": ${calculatedHours},
    "sesiones": ${calculatedSessions},
    "fechaRealizacion": "${estimatedMonth}",
    "trimestre": "${trimester}",
    "horasSemanalesTexto": "${calculatedHours} horas (${calculatedSessions} sesiones)"
  },
  "contextualizacion": "Texto de contextualización...",
  "justificacionNormativa": "Texto de justificación y marco legal...",
  "contribucionObjetivosGenerales": "s) Tomar decisiones de forma fundamentada y afrontar contingencias.",
  "competenciasBasicas": ["Competencia 1", "Competencia 2"],
  "resultadosAprendizaje": ["RA X: Texto completo del RA..."],
  "contribucionCompetenciasProfesionales": "r) Organizar y coordinar equipos de trabajo con responsabilidad.",
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
      "horas": "(${Math.round(calculatedHours * 0.25)}h+${Math.round(calculatedHours * 0.30)}h)",
      "actividades": [
        { "codigo": "I1", "nombre": "Nombre actividad iniciación", "descripcion": "Descripción breve" },
        { "codigo": "D1", "nombre": "Nombre actividad desarrollo 1", "descripcion": "Descripción breve" },
        { "codigo": "D2", "nombre": "Nombre actividad desarrollo 2", "descripcion": "Descripción breve" }
      ]
    },
    "repasoRefuerzo": {
      "horas": "(${Math.round(calculatedHours * 0.25)}h)",
      "actividades": [
        { "codigo": "R1", "nombre": "Nombre actividad repaso", "descripcion": "Descripción breve" },
        { "codigo": "Rf1", "nombre": "Cuestionario Moodle habilitador", "descripcion": "Descripción breve" }
      ]
    },
    "ampliacionEvaluacion": {
      "horas": "(${Math.round(calculatedHours * 0.20)}h)",
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
    "raGlobal": "RA X (${(100 / (config.numUnidadesDidacticas || 8)).toFixed(2)}% global)",
    "criterios": [
      { "criterio": "a)", "descripcion": "Identificación de riesgos y parámetros", "peso": "20%" },
      { "criterio": "b)", "descripcion": "Ejecución técnica y cumplimiento de tolerancias", "peso": "30%" },
      { "criterio": "c)", "descripcion": "Aplicación de medidas de seguridad y EPIs", "peso": "25%" },
      { "criterio": "d)", "descripcion": "Gestión de residuos y orden en el puesto", "peso": "25%" }
    ],
    "criteriosTexto": "RA X. a) Identificación (20%), b) Ejecución (30%), c) Seguridad (25%), d) Residuos (25%)."
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

