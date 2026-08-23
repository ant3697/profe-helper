import { TopicDepth, TopicAuditOptions } from "../types/thematicDoc";
import { ExamData, ExamQuestion } from "../types/exam";

export const TOPIC_STYLE_INJECTIONS = `
<style id="docuexam-topic-styles">
:root { color-scheme: light dark !important; }
@media print {
  .no-print, #standalone-export-bar { display: none !important; }
  body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; color: #000000 !important; }
  .page { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; padding: 0 !important; background: #ffffff !important; color: #000000 !important; }
  h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
  table, .formula-box, .recall-box, .apuntes-box, .mnemo-box, .audio-desc { page-break-inside: avoid; break-inside: avoid; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  @page { size: A4 portrait; margin: 15mm; }
}
body { background-color: #525659; margin: 0; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b; transition: background-color 0.25s ease, color 0.25s ease; -webkit-font-smoothing: antialiased; }
.page { max-width: 210mm; width: 100%; min-height: 297mm; padding: 25mm 20mm; margin: 0 auto; background: #ffffff !important; box-shadow: 0 10px 30px rgba(0,0,0,0.22); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #1e293b !important; line-height: 1.68; box-sizing: border-box; transition: background-color 0.25s ease, color 0.25s ease; border-radius: 2px; }
.page * { text-decoration: none !important; }
a { color: #003366 !important; text-decoration: none !important; }
a:hover, a:focus, a:active { text-decoration: underline !important; }
h1 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #003366 !important; font-size: 20px; font-weight: 800; border-bottom: 3px solid #003366; padding-bottom: 8px; margin-top: 0; margin-bottom: 22px; text-transform: uppercase; letter-spacing: -0.3px; line-height: 1.35; }
h2 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #003366 !important; font-size: 15px; font-weight: 700; margin-top: 30px; margin-bottom: 14px; border-left: 5px solid #b71c1c; padding: 8px 14px; background: #f1f5f9; text-transform: uppercase; border-radius: 0 4px 4px 0; letter-spacing: -0.2px; }
h3 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #b71c1c !important; font-size: 13.5px; font-weight: 700; margin-top: 24px; margin-bottom: 10px; }
p { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; margin-top: 0; margin-bottom: 12px; text-align: justify; color: #1e293b; }
table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 18px 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; border-radius: 4px; overflow: hidden; }
caption { font-weight: bold; padding: 8px 12px; background: #e2e8f0; color: #0f172a !important; text-align: left; border: 1px solid #cbd5e1; border-bottom: none; font-size: 11.5px; }
th { background: #003366 !important; color: #ffffff !important; padding: 9px 12px; border: 1px solid #003366; text-transform: uppercase; font-size: 11px; font-weight: 700; text-align: left; }
th, th * { color: #ffffff !important; }
td { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: top; color: #1e293b !important; background-color: #ffffff; font-size: 11.5px; }
tr:nth-child(even) td { background-color: #f8fafc; }
.formula-box { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; border-left: 5px solid #003366 !important; padding: 14px 18px; text-align: center; font-family: 'Fira Code', 'Courier New', Courier, monospace; font-size: 12px; margin: 18px 0; font-weight: bold; overflow-x: auto; color: #0f172a !important; border-radius: 0 6px 6px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.audio-desc { background-color: #fffdf5 !important; border: 1px solid #fef3c7 !important; border-left: 5px solid #f59e0b !important; padding: 12px 16px; margin: 18px 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11.5px; color: #78350f !important; border-radius: 0 6px 6px 0; line-height: 1.55; }
.audio-desc::before { content: "🔊 Resumen Narrativo Accesible: "; font-weight: bold; color: #b45309; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
.hide-tables table { display: none !important; }

.page ul, .page ol { margin: 15px 0 20px 30px !important; padding: 0 !important; }
.page ol { list-style-type: decimal !important; }
.page ul { list-style-type: disc !important; }
.page li { margin-bottom: 8px; line-height: 1.6; padding-left: 4px; color: #1e293b !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; }
.page li::marker { font-weight: bold; color: #b71c1c; }

.apuntes-box { background-color: #f0f7ff !important; border: 1px solid #dbeafe !important; border-left: 5px solid #2563eb !important; padding: 14px 18px; margin: 18px 0; border-radius: 0 6px 6px 0; color: #1e293b !important; font-size: 12px; line-height: 1.6; }
.apuntes-box strong { color: #1d4ed8 !important; }

.recall-box { background-color: #f0fdf4 !important; border: 1px solid #dcfce7 !important; border-left: 5px solid #16a34a !important; padding: 14px 18px; margin: 18px 0; border-radius: 0 6px 6px 0; color: #1e293b !important; font-size: 12px; line-height: 1.6; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.recall-box strong { color: #15803d !important; }
.recall-box ul, .recall-box ol { margin: 8px 0 8px 24px !important; color: #1e293b !important; }
.recall-box li { color: #1e293b !important; font-size: 12px !important; }
.recall-box li strong { color: #15803d !important; }

.mnemo-box { background-color: #fffbeb !important; border: 1px solid #fef3c7 !important; border-left: 5px solid #d97706 !important; padding: 14px 18px; margin: 18px 0; border-radius: 0 6px 6px 0; color: #1e293b !important; font-size: 12px; line-height: 1.6; }
.mnemo-box strong { color: #b45309 !important; }

mark.search-match { background-color: #fde047 !important; color: #000000 !important; font-weight: bold; border-radius: 2px; padding: 1px 3px; }

razonamiento { display: none !important; }
think { display: none !important; }

body.dark-theme { background-color: #0c0d12; color: #f9fafb; }
body.dark-theme .page { background: #14151d !important; color: #f9fafb !important; box-shadow: 0 8px 30px rgba(0,0,0,0.7); border: 1px solid #262837; }
body.dark-theme h1 { color: #60a5fa !important; border-bottom-color: #3b82f6; }
body.dark-theme h2 { color: #93c5fd !important; background: #1a1c26 !important; border-left-color: #ef4444; border-top: 1px solid #262837; border-right: 1px solid #262837; border-bottom: 1px solid #262837; }
body.dark-theme h3 { color: #f87171 !important; }
body.dark-theme p { color: #d1d5db !important; }
body.dark-theme table { background-color: #14151d; }
body.dark-theme th { background: #1e3a8a !important; border-color: #1e3a8a; color: #ffffff !important; }
body.dark-theme caption { background: #1a1c26; color: #cbd5e1 !important; border-color: #262837; }
body.dark-theme td { border-color: #262837; color: #d1d5db !important; background-color: #14151d; }
body.dark-theme tr:nth-child(even) td { background-color: #1a1c26; }
body.dark-theme .formula-box { background: #1a1c26 !important; border-color: #262837 !important; border-left-color: #60a5fa !important; color: #f8fafc !important; }
body.dark-theme .audio-desc { background-color: #231c12 !important; border-color: #451a03 !important; border-left-color: #fbbf24 !important; color: #fde68a !important; }
body.dark-theme .page li { color: #d1d5db !important; }
body.dark-theme .page li::marker { color: #f87171 !important; }

body.dark-theme .apuntes-box { background-color: #172554 !important; border-color: #1e3a8a !important; border-left-color: #60a5fa !important; color: #e0f2fe !important; }
body.dark-theme .apuntes-box strong { color: #93c5fd !important; }

body.dark-theme .recall-box { background-color: #064e3b !important; border-color: #047857 !important; border-left-color: #4ade80 !important; color: #ecfdf5 !important; }
body.dark-theme .recall-box strong { color: #86efac !important; }
body.dark-theme .recall-box ul, body.dark-theme .recall-box ol, body.dark-theme .recall-box li { color: #ecfdf5 !important; }

body.dark-theme .mnemo-box { background-color: #451a03 !important; border-color: #78350f !important; border-left-color: #fb923c !important; color: #fef3c7 !important; }
body.dark-theme .mnemo-box strong { color: #fde68a !important; }
body.dark-theme mark.search-match { background-color: #f59e0b !important; color: #000000 !important; }
</style>
`;

export const STANDALONE_HTML_BAR = `
<script src="https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js"></script>
<script id="standalone-scripts">
function __toggleDocTheme() {
    document.body.classList.toggle('dark-theme');
    var btn = document.getElementById('btnToggleTheme');
    if(document.body.classList.contains('dark-theme')) {
        if(btn) btn.innerHTML = '☀️ Modo Claro';
    } else {
        if(btn) btn.innerHTML = '🌙 Modo Oscuro';
    }
}
function __exportWord() {
    var htmlContent = document.documentElement.innerHTML;
    if (!/<meta[^>]*charset/i.test(htmlContent)) {
        htmlContent = htmlContent.replace(/<head>/i, '<head><meta charset="utf-8">');
    }
    htmlContent = htmlContent.replace(/dark-theme/g, '');
    
    var fullHtml = "<!DOCTYPE html><html>" + htmlContent + "</html>";
    try {
        if (typeof window.htmlDocx !== 'undefined') {
            var converted = window.htmlDocx.asBlob(fullHtml, {orientation: 'portrait'});
            var url = URL.createObjectURL(converted);
            var a = document.createElement("a"); a.href = url; a.download = 'Documento_Alta_Densidad.docx';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            return;
        }
    } catch(e) { console.warn(e); }

    var pageNode = document.querySelector('.page') || document.body;
    var rawHtml = "<html><head><meta charset='utf-8'></head><body>" + pageNode.outerHTML.replace(/dark-theme/g, '') + "</body></html>";
    var blob = new Blob(['\\ufeff', rawHtml], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = 'Documento_Alta_Densidad.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function __exportTxt() {
    var pageNode = document.querySelector('.page');
    if(!pageNode) return;
    var clone = pageNode.cloneNode(true);
    var listItems = clone.querySelectorAll('li');
    listItems.forEach(function(li) { li.insertBefore(document.createTextNode('- '), li.firstChild); });
    var headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(function(h) { h.innerHTML = '\\n' + h.innerHTML + '\\n'; });
    var div = document.createElement('div');
    div.style.position = 'absolute'; div.style.left = '-9999px';
    div.appendChild(clone); document.body.appendChild(div);
    var textContent = clone.innerText; document.body.removeChild(div);
    textContent = textContent.replace(/\\n{3,}/g, '\\n\\n').trim();
    var blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = "Documento_Alta_Densidad.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function __toggleTables() {
    var doc = document.documentElement;
    var btn = document.getElementById('btnToggleTables');
    if (doc.classList.contains('hide-tables')) {
        doc.classList.remove('hide-tables');
        if (btn) btn.innerHTML = '👁️ Ocultar Tablas';
    } else {
        doc.classList.add('hide-tables');
        if (btn) btn.innerHTML = '👁️ Mostrar Tablas';
    }
}
</script>
<div id="standalone-export-bar" class="export-bar no-print">
    <button onclick="__toggleDocTheme()" id="btnToggleTheme" class="btn theme-toggle">☀️ Modo Claro</button>
    <button onclick="window.print()" class="btn pdf">🖨️ PDF</button>
    <button onclick="__exportWord()" class="btn word">📝 Word</button>
    <button onclick="__exportTxt()" class="btn txt-export">📄 TXT</button>
    <button onclick="__toggleTables()" id="btnToggleTables" class="btn tables-toggle">👁️ Ocultar Tablas</button>
</div>
<style id="standalone-styles">
.export-bar { position: fixed; top: 16px; right: 16px; z-index: 1000; display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; max-width: 650px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.btn { padding: 7px 12px; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.25); font-size: 12px; transition: transform 0.15s, box-shadow 0.15s; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 5px 9px rgba(0,0,0,0.35); }
.pdf { background-color: #dc2626; } 
.word { background-color: #2563eb; } 
.txt-export { background-color: #ea580c; } 
.tables-toggle { background-color: #475569; } 
.theme-toggle { background-color: #1e293b; }
</style>
`;

export function cleanAndRepairTopicHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  let textHtml = rawHtml.trim();
  if (!textHtml) return "";

  // 1. If markdown code fence is present, extract the inner HTML
  const codeBlockMatch = textHtml.match(/```(?:html)?\s*([\s\S]*?)(?:```\s*$|$)/i);
  if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].trim().length > 10) {
    textHtml = codeBlockMatch[1].trim();
  }

  // 2. Locate the earliest valid HTML start tag if preamble or analysis text precedes it
  const startPattern = /(?:<!DOCTYPE\s+html>|<html\b[^>]*>|<body\b[^>]*>|<div\s+class=["']page["']|<h1\b[^>]*>)/i;
  const startMatch = textHtml.match(startPattern);
  if (startMatch && startMatch.index !== undefined && startMatch.index > 0) {
    textHtml = textHtml.substring(startMatch.index);
  }

  // 3. Strip closing backticks or trailing markdown markers
  textHtml = textHtml.replace(/`{3,}\s*$/g, "").trim();

  // 4. Remove AI internal thoughts / reasoning blocks safely
  textHtml = textHtml.replace(/<razonamiento\b[^>]*>[\s\S]*?<\/razonamiento>/gi, "");
  textHtml = textHtml.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "");
  textHtml = textHtml.replace(/<\/?(?:razonamiento|think)\b[^>]*>/gi, "");
  textHtml = textHtml.replace(/\[(?:Análisis|Razonamiento|CoT)[^\]]*\]/gi, "");

  // 5. Clean pseudo-tags artifacts safely
  textHtml = textHtml.replace(/(?:<strong\s*<\s*li\s*>|<strong\s*li\s*>|<strong<\s*strong>|<strong<li>)+/gi, "<li>");
  textHtml = textHtml.replace(/(?:<\/strong\s*<\s*li\s*>|<\/strong\s*li\s*>|<\/strong<\s*strong>|<\/strong<li>)+/gi, "</li>");
  textHtml = textHtml.replace(/<strong\s*<\s*strong\s*>/gi, "<strong>");
  textHtml = textHtml.replace(/<\/strong\s*<\s*\/strong\s*>/gi, "</strong>");

  // 6. Balance and close any unclosed tags to prevent DOM corruption
  const tagsToBalance = ["strong", "em", "p", "li", "ul", "ol", "td", "th", "tr", "tbody", "table", "div"];
  for (const tag of tagsToBalance) {
    const openCount = (textHtml.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) || []).length;
    const closeCount = (textHtml.match(new RegExp(`</${tag}>`, "gi")) || []).length;
    if (openCount > closeCount) {
      const diff = openCount - closeCount;
      textHtml += `</${tag}>`.repeat(diff);
    }
  }

  // 7. Ensure root .page container only if non-empty and doesn't already have one
  if (textHtml.length > 10) {
    const hasPageDiv = textHtml.includes('<div class="page"') || textHtml.includes("<div class='page'");
    if (!hasPageDiv) {
      if (textHtml.includes("<body")) {
        textHtml = textHtml.replace(/<body([^>]*)>/i, '<body$1>\n<div class="page">');
        if (textHtml.includes("</body>")) {
          textHtml = textHtml.replace("</body>", "</div>\n</body>");
        } else {
          textHtml += "\n</div>";
        }
      } else {
        textHtml = `<div class="page">\n${textHtml}\n</div>`;
      }
    }
  }

  return textHtml.trim();
}

export function buildDynamicTopicPrompt(
  topic: string,
  currentDepth: TopicDepth,
  numSubapartados: number,
  activeOptions: TopicAuditOptions,
  aggregatedFileContent = "",
  extraContext = ""
): string {
  let specificInstructions = "";
  if (currentDepth === "resumen") {
    specificInstructions =
      "PRIORIDAD DE FORMATO: SÍNTESIS DIDÁCTICA. Extrae y menciona todos los puntos clave mediante viñetas y listas, pero manteniendo una redacción fluida, clara y accesible. REQUISITO CRÍTICO: ESTÁ PROHIBIDO omitir jerga técnica, pero DEBES acompañarla de una brevísima analogía o ejemplo cotidiano para facilitar su comprensión rápida. Destaca el vocabulario técnico esencial en **negrita**.";
  } else if (currentDepth === "estandar") {
    specificInstructions =
      "PRIORIDAD DE FORMATO: REDACCIÓN FLUIDA Y DIDÁCTICA. Actúa como un excelente profesor. REGLA DE ORO: Por cada subapartado técnico, DEBES incluir una analogía breve o ejemplo de la vida cotidiana que permita entender cómo funciona visualmente antes de la teoría pura.";
  } else {
    // catedratico / experto
    specificInstructions =
      "PRIORIDAD DE FORMATO: DENSIDAD TÉCNICA CON ENFOQUE DIDÁCTICO. Abarca todos los conceptos llevándolos a la máxima profundidad técnica y cuantificando todo (temperaturas, presiones, normativas), pero manteniendo una redacción fluida de excelente profesor. REGLA DE ORO: A pesar del rigor, por cada subapartado técnico, DEBES incluir una analogía avanzada o ejemplo práctico industrial que permita entender cómo funciona visualmente antes de la teoría pura.";
  }

  let structureString = `Estructura de Contenido (OBLIGATORIA Y SECUENCIAL):\n- TODO el contenido envuelto en \`<div class="page">\`.\n- TÍTULO PRINCIPAL: <h1> (Copia literal del título aportado).\n1. ÍNDICE: Adecuado al tema, estructurado y secuenciado.\n2. INTRODUCCIÓN: Relevancia y justificación.\n3. DESARROLLO DE LOS APARTADOS: Cuerpo central (<h2>). Subapartados en <h3>.`;

  let secNum = 4;
  let optInstructions = "";

  structureString += `\n${secNum}. CONCLUSIÓN: Síntesis final clara y relacionando conceptos.`;
  secNum++;

  structureString += `\n${secNum}. BIBLIOGRAFÍA Y FUENTES: Citas y manuales de referencia.`;
  secNum++;

  structureString += `\n${secNum}. REFERENCIAS NORMATIVAS (CRÍTICO): Normativa europea y española aplicable (RITE, REBT, RSIF, etc.). Lista formal.`;
  secNum++;

  if (activeOptions.glossary) {
    structureString += `\n${secNum}. GLOSARIO, CONCEPTOS CLAVE Y FÓRMULAS RELEVANTES: Definiciones y ecuaciones.`;
    optInstructions += `\n\nREQUISITO ADICIONAL CRÍTICO (TEST-WISENESS): Genera obligatoriamente el apartado principal <h2> "${secNum}. GLOSARIO, CONCEPTOS CLAVE Y FÓRMULAS RELEVANTES".\nEstructura exacta con subapartados <h3>:\n- <h3>${secNum}.1. Palabras Clave</h3> (lista <ul> con 20 elementos <li> detallados, SIN viñetas vacías).\n- <h3>${secNum}.2. Conceptos Fundamentales</h3> (lista <ul> con 20 elementos <li> desarrollados, SIN viñetas vacías).\n- <h3>${secNum}.3. Fórmulas Relevantes</h3> (fórmulas en \`<div class="formula-box">\` con variables definidas).\nREGLA ESTRICTA: Está estrictamente prohibido intercalar elementos <li> vacíos o usar saltos de línea dobles entre conceptos dentro de las listas.`;
    secNum++;
  }

  if (activeOptions.recall) {
    const numRecallQuestions = currentDepth === "resumen" ? 2 : currentDepth === "estandar" ? 4 : 6;
    optInstructions += `\n\nREQUISITO ADICIONAL CRÍTICO (ACTIVE RECALL Y COBERTURA INTEGRAL 100%): \n1. Al finalizar CADA subapartado de desarrollo (<h3>), incluye OBLIGATORIAMENTE un \`<div class="recall-box">\` con el encabezado \`<strong>Autoevaluación Rápida</strong>\` y EXACTAMENTE ${numRecallQuestions} preguntas. \n2. REGLA FUNDAMENTAL DE COBERTURA Y RESPUESTA COMPLETA EN EL TEXTO: TODAS Y CADA UNA de las ${numRecallQuestions} preguntas DEBEN tener su respuesta, dato cuantitativo, fórmula, paso procedimental o referencia normativa (REBT, RITE, RSIF, CTE) PLENAMENTE EXPLICADA Y DESARROLLADA en el texto, tablas o fórmulas del subapartado precedente. \n3. AMPLIACIÓN EXHAUSTIVA DEL CONTENIDO: Si formulas preguntas sobre valores límite, criterios de cálculo, tolerancias, caídas de tensión, factores de potencia o protecciones, DEBES enriquecer y ampliar el cuerpo del subapartado con anterioridad para que ninguna pregunta quede huérfana o sin desarrollo. \n4. MANTENIMIENTO ESTRICTO DEL VOLUMEN DE PREGUNTAS: ESTÁ ESTRICTAMENTE PROHIBIDO reducir el número de preguntas (${numRecallQuestions} preguntas exactas por subapartado). \n5. NUMERACIÓN CONTINUA GLOBAL Y FORMATO (CRÍTICO): Numera las preguntas de forma CORRELATIVA GLOBAL a lo largo de todo el documento (1, 2, 3... 43, 44... hasta el final sin reiniciar el conteo). PROHIBIDO usar etiquetas de lista ordenada (<ol>). OBLIGATORIO usar etiquetas de viñetas (<ul>) y NO añadir prefijos automáticos. Escribe el formato EXACTAMENTE ASÍ: \`<li><strong>43.</strong> ¿Qué es...?</li>\`.`;
  }

  if (activeOptions.cot) {
    optInstructions += `\n\nREQUISITO ADICIONAL (CoT ANTICOLISIÓN): ANTES de generar el HTML, escribe en texto plano un análisis MUY BREVE (MÁXIMO 4 LÍNEAS) para organizar el índice y no gastar tokens. LUEGO, abre un bloque markdown (\`\`\`html) y genera TODO el HTML COMENZANDO CON <!DOCTYPE html>. Nunca metas el documento dentro del bloque de razonamiento.`;
  }
  if (activeOptions.pedagogic) {
    optInstructions += `\n\nREQUISITO ADICIONAL (PRÁCTICA INTERCALADA): A lo largo del desarrollo, inserta pequeños cuadros HTML \`<div class="apuntes-box">\` con "Apuntes del Experto" relacionando conceptos.`;
  }
  if (activeOptions.mnemotecnias) {
    optInstructions += `\n\nREQUISITO ADICIONAL (MNEMOTECNIAS): Cada vez que expongas clasificaciones o procesos, incluye una REGLA MNEMOTÉCNICA en un \`<div class="mnemo-box">\`.`;
  }
  if (activeOptions.antitunel) {
    optInstructions += `\n\nREQUISITO ADICIONAL CRÍTICO (AUDITORÍA ANTI-VISIÓN DE TÚNEL Y CONTROL DE TOKENS): Tienes un límite máximo de salida de 8000 tokens. Si te extiendes ilimitadamente en los primeros subapartados, la generación se cortará a la mitad del documento. DEBES distribuir tu extensión de forma SIMÉTRICA Y CALCULADA. Tienes ${numSubapartados} subapartados principales: RESTRINGE su longitud (ej: máximo 2-3 párrafos por subapartado) y usa tablas en lugar de texto largo para asegurar que completas todo el índice y llegas hasta el apartado final.`;
  }

  const cleanTopic = (topic || "[Escribe el Título o Índice arriba para actualizar]").trim();

  let finalPrompt = `Rol: Experto e Ingeniero Senior, especialista en docencia técnica y redacción de materiales de impacto.

Objetivo: Generar un documento HTML impecable y autónomo, adaptado al título del usuario y la profundidad requerida.
Mantén siempre un tono objetivo, crítico y directo. Evita cualquier tipo de lenguaje condescendiente o de relleno.

Instrucciones Globales de Accesibilidad y Formato:
1. Accesibilidad TTS en Tablas (CRÍTICO): Antes de declarar CUALQUIER \`<table>\`, inserta un \`<div class="audio-desc">\` con una explicación narrada de los datos. Añade \`aria-hidden="true"\` a la tabla.
2. Fórmulas y Matemáticas: PROHIBIDO LaTeX o KaTeX. Usa texto plano lineal (*, /, ^) envuelto en \`<div class="formula-box">\`.
3. Cero UI Interna Generada: PROHIBIDO generar etiquetas <button> o paneles interactivos.
4. Estilos y Colores: PROHIBIDO generar etiquetas <style> internas.
5. Sistema de Unidades (CRÍTICO): Uso EXCLUSIVO del SI y unidades métricas (España). Convierte si es necesario.
6. Alineación Total y Respuesta Explícita (CRÍTICO): El desarrollo técnico de cada subapartado DEBE ser suficientemente detallado y amplio para que el 100% de las preguntas de "Autoevaluación Rápida" puedan responderse directamente con el contenido redactado. Nunca formules preguntas sobre conceptos no explicados previamente.

=== INPUT DEL USUARIO (TEMA A DESARROLLAR) ===
TÍTULO EXACTO DEL TEMA:
"""${cleanTopic}"""

=== PARÁMETROS ORTOGONALES DE GENERACIÓN ===

[EJE 1: NIVEL DE DESARROLLO DEL CONTENIDO (DENSIDAD)]
${specificInstructions}

[EJE 2: ESTRUCTURA EXACTA Y CORRELATIVA (REGLA CRÍTICA)]
REGLA 1: El documento comienza con etiqueta <h1> copiando LITERALMENTE el "TÍTULO EXACTO DEL TEMA".
REGLA 2: Si el título contiene enumeraciones (;, comas, guiones), OBLIGATORIAMENTE úsalas como tus subapartados de desarrollo (3.1, 3.2...). Si no, divide lógicamente en EXACTAMENTE ${numSubapartados} subapartados.
REGLA 3 (NUMERACIÓN ESTRICTA Y CIERRE SEGURO): Sigue EXACTAMENTE esta numeración principal (<h2>) ininterrumpida que ha sido pre-calculada para esta entrega:

${structureString}
${optInstructions}

⚠️ ALERTA DE SISTEMA (MANDATORIO): TIENES UN LÍMITE INFRANQUEABLE DE TOKENS. BAJO NINGÚN CONCEPTO PUEDES CERRAR EL DOCUMENTO SIN HABER REDACTADO LOS APARTADOS FINALES DE CONCLUSIÓN, BIBLIOGRAFÍA, NORMATIVA Y GLOSARIO (SI ESTÁN LISTADOS ARRIBA). CÁLCULO DE EXTENSIÓN: SINTETIZA TUS RESPUESTAS EN EL DESARROLLO (APARTADO 3) PARA GARANTIZAR QUE LLEGAS AL 100% DEL ÍNDICE SIN CORTARTE. ES MIL VECES PREFERIBLE SER BREVE Y DIRECTO QUE DEJAR UN DOCUMENTO INCOMPLETO. NUNCA OMITAS LOS APARTADOS FINALES.`;

  const fullContext = (aggregatedFileContent + (extraContext ? "\n" + extraContext : "")).trim();
  if (fullContext) {
    finalPrompt += `\n\nATENCIÓN CRÍTICA - RESTRICCIÓN DE FUENTES (RAG): Basa la extracción de valores y argumentos principalmente en este texto de referencia:\n\n<<INICIO BASE DOCUMENTAL>>\n${fullContext.substring(
      0,
      300000
    )}\n<<FIN BASE DOCUMENTAL>>`;
  }

  return finalPrompt;
}

export function injectDocumentStyles(html: string): string {
  let text = cleanAndRepairTopicHtml(html);
  if (!text.includes('id="docuexam-topic-styles"')) {
    if (text.includes("</head>")) {
      text = text.replace("</head>", TOPIC_STYLE_INJECTIONS + "\n</head>");
    } else if (text.includes("<body>")) {
      text = text.replace("<body>", "<head>" + TOPIC_STYLE_INJECTIONS + "</head>\n<body>");
    } else if (text.includes('<div class="page"')) {
      text = TOPIC_STYLE_INJECTIONS + "\n" + text;
    } else {
      text = TOPIC_STYLE_INJECTIONS + "\n" + text;
    }
  }
  return text;
}

export function exportStandaloneHtmlDocument(html: string): string {
  let clean = cleanAndRepairTopicHtml(html);
  // Remove existing styles to avoid duplication when building full standalone html
  clean = clean.replace(/<style id="docuexam-topic-styles">[\s\S]*?<\/style>/gi, "").trim();
  clean = clean.replace(/<script id="standalone-scripts">[\s\S]*?<\/script>/gi, "").trim();
  clean = clean.replace(/<div id="standalone-export-bar"[\s\S]*?<\/div>/gi, "").trim();
  clean = clean.replace(/<style id="standalone-styles">[\s\S]*?<\/style>/gi, "").trim();

  // If clean already contains <!DOCTYPE or <html> or <body>, strip them to keep pure body content
  clean = clean.replace(/<!DOCTYPE\s+html>/gi, "");
  clean = clean.replace(/<\/?html\b[^>]*>/gi, "");
  clean = clean.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
  clean = clean.replace(/<\/?body\b[^>]*>/gi, "").trim();

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Temario de Alta Densidad</title>
${TOPIC_STYLE_INJECTIONS}
</head>
<body>
${clean}
${STANDALONE_HTML_BAR}
</body>
</html>`;

  return fullHtml;
}

/**
 * Extracts questions from <div class="recall-box"> inside the generated topic HTML
 * and transforms them into standard Question objects for ExamData.
 */
export function extractActiveRecallExamFromHtml(topicTitle: string, html: string): ExamData | null {
  try {
    const cleanedHtml = cleanAndRepairTopicHtml(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedHtml, "text/html");
    const recallBoxes = doc.querySelectorAll(".recall-box");

    const questions: ExamQuestion[] = [];
    let counter = 1;

    recallBoxes.forEach((box) => {
      const listItems = box.querySelectorAll("li");
      listItems.forEach((li) => {
        let text = li.textContent || "";
        // Strip leading numbering, bullets and clean stray angle brackets
        text = text
          .replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "")
          .replace(/^<\s*([^<>]+?)\s*>\s*$/, "$1")
          .replace(/[<>]/g, "")
          .trim();

        if (text.length > 5) {
          questions.push({
            enunciado: text,
            opciones: [
              "Opción A (Verdadera / Desarrollo clave según el temario)",
              "Opción B (Distractor técnico plausible)",
              "Opción C (Condición no aplicable según normativa)",
              "Opción D (Parámetro fuera de rango operativo)",
            ],
            indiceCorrecta: 0,
            justificacion: `Pregunta de autoevaluación Active Recall formulada a partir del subapartado correspondiente del tema "${topicTitle}". Consulta el apartado teórico para contrastar la respuesta.`,
            userSelectedIndex: null,
            flagged: false,
          });
          counter++;
        }
      });
    });

    if (questions.length === 0) return null;

    return {
      analisis_anticolision: `Batería de ${questions.length} preguntas de autoevaluación activa y comprensión extraídas directamente del temario de alta densidad.`,
      bloques: [
        {
          titulo: `Preguntas de Autoevaluación (${topicTitle})`,
          preguntas: questions,
        },
      ],
    };
  } catch (err) {
    console.error("Error extrayendo preguntas de Active Recall:", err);
    return null;
  }
}
