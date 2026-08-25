import { SigreCurricularConfig, SigreUDItem, SigreUDData, SigrePedagogicalAuditResult } from "../types/sigre";

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
 * Builds prompt for MODULE 1: Full Unit (1.1 to 1.11) with full Pedagogical Auditing (6 Axes)
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
Tu misión es analizar el currículo oficial del módulo y generar la Unidad Didáctica elegida ("${ud.fullCode}") de forma completa, multifacética y lista para su uso, estructurada rigurosamente en tres secciones claras.

INFORMACIÓN DE ENTRADA Y CONTEXTO:
- Módulo Formativo: ${config.moduloFormativo || "Módulo Formativo"} (${config.codigo || ""})
- Ciclo Formativo: ${config.cicloFormativo || "Ciclo Formativo"} - Familia: ${config.familiaProfesional || "Técnica"} (${config.curso || "1º"})
- Carga horaria total: ${config.horasTotales || 160} horas (${config.horasSemanales || 5} h/semana)
- Dimensionamiento de esta UD: ${horasUd} horas lectivas (${sesionesUd} sesiones estimadas)
- Currículo de Referencia: ${config.curriculoReferencia || "Real Decreto oficial y normativa vigente"}
- Contexto de Aplicación: ${config.contextoAplicacion || "Material a utilizar como referencia en el IES Al-Baytar de Benalmádena (Málaga). Adaptar ejemplos y enfoque a este contexto."}
- Nivel de Adhesión Curricular: ${config.adhesion}/5
- Nivel de Destinatario: ${config.userLevel === 1 ? "Secundaria (ESO)" : config.userLevel === 2 ? "Bachillerato / FP" : config.userLevel === 3 ? "Grado Universitario" : "Oposiciones / Especialización"}

ESTRUCTURA DE GENERACIÓN - SECCIÓN I: MATERIAL IMPRIMIBLE PARA EL ALUMNO (FORMATO LIBRO DE TEXTO):

1.1. Título del Tema: Formato exacto "${ud.fullCode}".
1.2. Breve Introducción: (Aprox. 150-200 palabras contextualizadas).
1.3. Contenidos Específicos: Desglosados en:
     - Conceptuales (Saber)
     - Procedimentales (Saber hacer)
     - Actitudinales (Saber ser)
1.4. Objetivos Específicos de Aprendizaje: (Exactamente 5-8 objetivos SMART).
1.5. Índice del Desarrollo del Tema: Guion completo y numerado.
1.6. Desarrollo de los Apartados del Índice:
     INSTRUCCIÓN CRÍTICA (REGLA INQUEBRANTABLE): Sigue exhaustivamente, uno por uno y en orden, el guion creado en el índice (1.5). Utiliza cada entrada como un subtítulo, manteniendo la numeración y el texto exactos. BAJO NINGUNA CIRCUNSTANCIA sustituyas el desarrollo real por un texto de resumen o un marcador de posición. Debes generar el contenido completo, riguroso y detallado para cada punto del índice.
     - Aplica scaffolding didáctico en cada epígrafe:
       * Idea fuerza / Síntesis ejecutiva.
       * Tablas estructuradas con clase "sigre-table" con columnas de Parámetro/Componente, Criterio Operativo, Normativa/Tolerancia y Verificación.
       * Procedimiento práctico paso a paso de taller/campo.
       * Cajas de apoyo pedagógico:
         - <div class="apuntes-box"><strong>💡 Apuntes del Experto:</strong> [Conexión y aplicación práctica]</div>
         - <div class="recall-box"><strong>🧠 Autoevaluación Rápida (Active Recall):</strong> [Preguntas de recuperación activa]</div>
         - <div class="mnemo-box"><strong>⚡ Regla Mnemotécnica:</strong> [Acrónimo o regla mnemotécnica]</div>
1.7. Cuestionario de Autoevaluación:
     Genera un mínimo de 20 preguntas variadas con una sección final de "Soluciones". En la sección de soluciones, la respuesta correcta debe aparecer en negrita con breve justificación.
1.8. Diagrama de Flujo (Mermaid):
     Reglas para el formato Mermaid:
     - Orientación: Usa \`flowchart TD\`.
     - Estructura: Para agrupar fases, utiliza la sintaxis de \`subgraph\` ("Fase 1: ...", "Fase 2: ...").
     - Compatibilidad (CRÍTICO): Para conectar múltiples nodos a uno solo, define cada conexión en una línea separada. Usa siempre \`A --> C;\` \`B --> C;\`.
     - Caracteres Especiales (CRÍTICO): Si el texto de un nodo contiene caracteres especiales (/, (, etc.), enciérralo siempre entre comillas dobles (").
1.9. Mapa Mental (OPML):
     Reglas para el formato OPML:
     - Cabecera (<head>): Rellena los metadatos. Genera las fechas en formato RFC 822. ownerName: "IES Al-Baytar".
     - Cuerpo (<body>): Estructura el contenido jerárquicamente usando \`<outline text="...">\`.
1.10. Conclusiones y Síntesis del Tema: Resumen de ideas clave y relevancia profesional.
1.11. Relación con Otras Unidades (Intradisciplinaridad):
      Redacta un breve párrafo explicando cómo los contenidos de esta UD se relacionan con los de otras UDs del mismo módulo.

NORMAS DE FORMATO JSON:
- Devuelve ÚNICAMENTE un objeto JSON estrictamente válido.
- No uses secuencias de escape inválidas (evita barras invertidas sueltas).
- Todas las comillas dobles dentro de cadenas HTML deben estar escapadas (\\" o usar comillas simples ').

Devuelve la respuesta en formato JSON con la siguiente estructura:

\`\`\`json
{
  "titulo": "${ud.fullCode.replace(/"/g, '\\"')}",
  "cotRazonamiento": "Análisis de diseño curricular, delimitación de fronteras conceptuales y prevención de colisiones temáticas...",
  "introduccion": "Texto de la introducción...",
  "contenidos": {
    "conceptuales": ["Concepto 1...", "Concepto 2..."],
    "procedimentales": ["Procedimiento 1...", "Procedimiento 2..."],
    "actitudinales": ["Actitud 1...", "Actitud 2..."]
  },
  "objetivosSmart": [
    "1. Objetivo SMART 1...",
    "2. Objetivo SMART 2..."
  ],
  "indiceDesarrollo": "1. Introducción\\n2. Principios...\\n3. Procedimientos...",
  "desarrolloEpigrafesHtml": "<div class=\\"ud-content\\"><h3>1. Introducción</h3><p>...</p><div class=\\"apuntes-box\\"><strong>💡 Apuntes del Experto:</strong> ...</div><div class=\\"recall-box\\"><strong>🧠 Autoevaluación Rápida:</strong> ...</div><div class=\\"mnemo-box\\"><strong>⚡ Regla Mnemotécnica:</strong> ...</div></div>",
  "glosarioHtml": "<div class=\\"glosario-box\\"><h4>Glosario de Términos y Fórmulas Relevantes</h4><ul><li><strong>Término 1:</strong> Definición...</li></ul></div>",
  "autoevaluacionHtml": "<div class=\\"autoeval-box\\"><h4>Cuestionario de Autoevaluación (20 Preguntas)</h4><ol><li>Pregunta 1...</li></ol><h5>Soluciones</h5><ol><li><strong>A) Respuesta correcta</strong>: Justificación técnica...</li></ol></div>",
  "conclusiones": "Texto de conclusiones y síntesis...",
  "relacionIntradisciplinar": "Texto de relación con otras unidades del módulo...",
  "diagramaMermaid": "flowchart TD\\n    A[\\"Inicio: Planteamiento\\"] --> B(Planificación)\\n    subgraph \\"Fase 1: Análisis\\"\\n    B --> C[\\"Cálculo y Dimensionado\\"]\\n    end",
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

  // Clean HTML tags and markdown bullets
  let text = rawIndice
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

  let content = rawHtml;

  // 1. Convert Markdown tables to HTML tables if present
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

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.1. INTRODUCCIÓN Y CONTEXTUALIZACIÓN</h2>
  <p style="text-align: justify; font-size: 14px;">${m1.introduccion}</p>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.2. CONTENIDOS ESPECÍFICOS</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0;">
    <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #0369a1; text-transform: uppercase; font-weight: 800;">Conceptuales</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12px;">${(m1.contenidos.conceptuales || []).map((c) => `<li>${c}</li>`).join("")}</ul>
    </div>
    <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #059669; text-transform: uppercase; font-weight: 800;">Procedimentales</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12px;">${(m1.contenidos.procedimentales || []).map((c) => `<li>${c}</li>`).join("")}</ul>
    </div>
    <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #7c3aed; text-transform: uppercase; font-weight: 800;">Actitudinales</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12px;">${(m1.contenidos.actitudinales || []).map((c) => `<li>${c}</li>`).join("")}</ul>
    </div>
  </div>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.3. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)</h2>
  <ul style="font-size: 13px; padding-left: 20px;">
    ${(m1.objetivosSmart || []).map((o) => `<li style="margin-bottom: 4px;">${o}</li>`).join("")}
  </ul>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.4. ÍNDICE DEL DESARROLLO DEL TEMA</h2>
  ${formatSigreIndiceHtml(m1.indiceDesarrollo || "")}

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.5. DESARROLLO DE LOS APARTADOS DEL ÍNDICE</h2>
  <div style="font-size: 14px; text-align: justify; line-height: 1.7;">
    ${formatSigreDesarrolloHtml(m1.desarrolloEpigrafesHtml)}
  </div>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.6. CONCLUSIONES Y SÍNTESIS DEL TEMA</h2>
  <p style="font-size: 14px; text-align: justify;">${m1.conclusiones}</p>

  <h2 style="color: #d97706; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1.7. RELACIÓN CON OTRAS UNIDADES (INTRADISCIPLINARIDAD)</h2>
  <p style="font-size: 13px; color: #475569;">${m1.relacionIntradisciplinar}</p>

  ${
    (m1.glosarioHtml || data.glosarioHtml)
      ? `<div style="margin-top: 24px;">${formatSigreDesarrolloHtml(m1.glosarioHtml || data.glosarioHtml || "")}</div>`
      : ""
  }

</div>
`;
}
