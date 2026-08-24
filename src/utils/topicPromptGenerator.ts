import { TopicDepth, TopicAuditOptions } from "../types/thematicDoc";
import { ExamData, ExamQuestion } from "../types/exam";
import { cleanOptionText } from "./examParsers";

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

/* Active Recall / Autoevaluación Rápida - Semantic Green Background */
.recall-box, .autoevaluacion-box, .autoeval-box, [data-section="autoevaluacion"] {
  background-color: #f0fdf4 !important;
  border: 1px solid #bbf7d0 !important;
  border-left: 6px solid #16a34a !important;
  padding: 16px 20px !important;
  margin: 20px 0 !important;
  border-radius: 0 8px 8px 0 !important;
  color: #14532d !important;
  font-size: 12px !important;
  line-height: 1.65 !important;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.08) !important;
}
.recall-box strong, .autoevaluacion-box strong, .autoeval-box strong {
  color: #15803d !important;
}
.recall-box ul, .recall-box ol, .autoevaluacion-box ul, .autoeval-box ul {
  margin: 10px 0 10px 24px !important;
  color: #14532d !important;
}
.recall-box li, .autoevaluacion-box li, .autoeval-box li {
  color: #14532d !important;
  font-size: 12px !important;
  margin-bottom: 6px !important;
}
.recall-box li strong, .autoevaluacion-box li strong, .autoeval-box li strong {
  color: #15803d !important;
}

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

/* Dark mode semantic green background for Active Recall / Autoevaluación */
body.dark-theme .recall-box,
body.dark-theme .autoevaluacion-box,
body.dark-theme .autoeval-box,
body.dark-theme [data-section="autoevaluacion"] {
  background-color: #064e3b !important;
  border: 1px solid #047857 !important;
  border-left: 6px solid #4ade80 !important;
  color: #ecfdf5 !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
}
body.dark-theme .recall-box strong,
body.dark-theme .autoevaluacion-box strong,
body.dark-theme .autoeval-box strong {
  color: #86efac !important;
}
body.dark-theme .recall-box ul,
body.dark-theme .recall-box ol,
body.dark-theme .recall-box li,
body.dark-theme .autoevaluacion-box ul,
body.dark-theme .autoevaluacion-box li,
body.dark-theme .autoeval-box ul,
body.dark-theme .autoeval-box li {
  color: #ecfdf5 !important;
}

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

export function cleanMathToPlainText(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let text = raw;

  // 1. Unwrap display math $$...$$ and \[...\]
  text = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, inner) => cleanMathFormulaString(inner));
  text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, inner) => cleanMathFormulaString(inner));

  // 2. Unwrap inline math $...$ and \(...\)
  text = text.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, inner) => cleanMathFormulaString(inner));
  text = text.replace(/\$([^\$\n\r]+?)\$/g, (_, inner) => cleanMathFormulaString(inner));

  // 3. Clean raw LaTeX math keywords even if not wrapped in dollar signs
  text = cleanMathFormulaString(text);

  return text;
}

function cleanMathFormulaString(rawFormula: string): string {
  if (!rawFormula) return "";
  let f = rawFormula;

  // Degree / angle / temperature notation (e.g. 60^\circ, 60^\circ\text{C}, 60^{\circ}\text{C}, ^\circ, \degree)
  f = f.replace(/\^\s*\{?\\circ\}?\s*\\text\{([A-Za-z]+)\}/g, " °$1");
  f = f.replace(/\^\s*\{?\\circ\}?\s*([A-Za-z])/g, " °$1");
  f = f.replace(/\^\s*\{?\\circ\}?/g, "°");
  f = f.replace(/\^\s*\{?°\}?/g, "°");
  f = f.replace(/\\circ\b/g, "°");
  f = f.replace(/\\degree\b/g, "°");
  f = f.replace(/\\angle\b/g, "∠");

  // Remove font wrappers: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}, \operatorname{...}, \bm{...}
  f = f.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname|bm|underline)\{([^{}]+)\}/g, "$1");

  // Fractions: recursively convert \frac{A}{B} to (A / B) or A / B
  for (let i = 0; i < 4; i++) {
    f = f.replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1 / $2)");
  }

  // Roots: \sqrt[n]{x} -> root_n(x), \sqrt{x} -> sqrt(x)
  f = f.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, "root_$1($2)");
  f = f.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
  f = f.replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, "sqrt($1)");

  // Operators & symbols
  f = f.replace(/\\(?:cdot|times|bullet)\b/g, " * ");
  f = f.replace(/\\div\b/g, " / ");
  f = f.replace(/\\pm\b/g, " ± ");
  f = f.replace(/\\mp\b/g, " ∓ ");
  f = f.replace(/\\(?:approx|simeq)\b/g, " ≈ ");
  f = f.replace(/\\sim\b/g, " ~ ");
  f = f.replace(/\\(?:neq|ne)\b/g, " != ");
  f = f.replace(/\\(?:le|leq)\b/g, " <= ");
  f = f.replace(/\\(?:ge|geq)\b/g, " >= ");
  f = f.replace(/\\ll\b/g, " << ");
  f = f.replace(/\\gg\b/g, " >> ");
  f = f.replace(/\\infty\b/g, "∞");
  f = f.replace(/\\(?:to|rightarrow|implies)\b/g, " -> ");
  f = f.replace(/\\iff\b/g, " <=> ");
  f = f.replace(/\\sum\b/g, "SUM");
  f = f.replace(/\\prod\b/g, "PROD");
  f = f.replace(/\\int\b/g, "INT");
  f = f.replace(/\\nabla\b/g, "grad");
  f = f.replace(/\\partial\b/g, "d");

  // Greek letters & physics constants/variables
  f = f.replace(/\\Delta\b/g, "Delta");
  f = f.replace(/\\delta\b/g, "delta");
  f = f.replace(/\\(?:Omega|ohm)\b/g, "Ohm");
  f = f.replace(/\\(?:mu|micro)\b/g, "u");
  f = f.replace(/\\pi\b/g, "pi");
  f = f.replace(/\\rho\b/g, "rho");
  f = f.replace(/\\eta\b/g, "eta");
  f = f.replace(/\\(?:varphi|phi)\b/g, "phi");
  f = f.replace(/\\theta\b/g, "theta");
  f = f.replace(/\\lambda\b/g, "lambda");
  f = f.replace(/\\sigma\b/g, "sigma");
  f = f.replace(/\\omega\b/g, "omega");
  f = f.replace(/\\alpha\b/g, "alpha");
  f = f.replace(/\\beta\b/g, "beta");
  f = f.replace(/\\gamma\b/g, "gamma");
  f = f.replace(/\\tau\b/g, "tau");
  f = f.replace(/\\(?:epsilon|varepsilon)\b/g, "epsilon");
  f = f.replace(/\\cos\b/g, "cos");
  f = f.replace(/\\sin\b/g, "sin");
  f = f.replace(/\\tan\b/g, "tan");
  f = f.replace(/\\log\b/g, "log");
  f = f.replace(/\\ln\b/g, "ln");
  f = f.replace(/\\exp\b/g, "exp");

  // Braces / Exponents / Subscripts
  f = f.replace(/\^\{([^{}]+)\}/g, "^$1");
  f = f.replace(/\_\{([^{}]+)\}/g, "_$1");
  f = f.replace(/\\left\(/g, "(");
  f = f.replace(/\\right\)/g, ")");
  f = f.replace(/\\left\[/g, "[");
  f = f.replace(/\\right\]/g, "]");
  f = f.replace(/\\left\\\{/g, "{");
  f = f.replace(/\\right\\\}/g, "}");
  f = f.replace(/\\left\|/g, "|");
  f = f.replace(/\\right\|/g, "|");
  f = f.replace(/\\left\./g, "");
  f = f.replace(/\\right\./g, "");

  // LaTeX spacing
  f = f.replace(/\\[,;!]|\\quad|\\qquad/g, " ");

  // Clean trailing backslashes or remaining stray math delimiters
  f = f.replace(/\\([a-zA-Z]+)/g, "$1");

  // Clean double spaces
  f = f.replace(/[ \t]{2,}/g, " ");

  return f;
}

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

  // 6. Clean mathematical formulas and dollar delimiters to standard keyboard plain text
  textHtml = textHtml.replace(/<div class=["']formula-box["']>([\s\S]*?)<\/div>/gi, (_, content) => {
    return `<div class="formula-box">${cleanMathToPlainText(content)}</div>`;
  });
  textHtml = textHtml.replace(/\$([^\$\n\r<]{2,})\$/g, (_, math) => cleanMathToPlainText(math));
  textHtml = textHtml.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, math) => cleanMathToPlainText(math));
  textHtml = textHtml.replace(/(\d+)\s*\^\s*\{?\\circ\}?/g, "$1°");
  textHtml = textHtml.replace(/\^\s*\{?\\circ\}?/g, "°");

  // 7. Balance and close any unclosed tags to prevent DOM corruption
  const tagsToBalance = ["strong", "em", "p", "li", "ul", "ol", "td", "th", "tr", "tbody", "table", "div"];
  for (const tag of tagsToBalance) {
    const openCount = (textHtml.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) || []).length;
    const closeCount = (textHtml.match(new RegExp(`</${tag}>`, "gi")) || []).length;
    if (openCount > closeCount) {
      const diff = openCount - closeCount;
      textHtml += `</${tag}>`.repeat(diff);
    }
  }

  // 8. Ensure root .page container only if non-empty and doesn't already have one
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
    optInstructions += `\n\nREQUISITO ADICIONAL CRÍTICO (AUDITORÍA ANTI-VISIÓN DE TÚNEL Y DISTRIBUCIÓN SIMÉTRICA DE TOKENS): Tienes un límite máximo de salida de tokens. Si te extiendes de forma desproporcionada en los primeros apartados, la generación se cortará a mitad del temario. DEBES distribuir tu extensión de forma SIMÉTRICA, RIGUROSA Y CALCULADA entre los ${numSubapartados} subapartados principales (máximo 2-3 párrafos de alta densidad y tablas por subapartado) para GARANTIZAR AL 100% que completas todo el índice y llegas hasta los apartados finales obligatorios de CONCLUSIÓN, BIBLIOGRAFÍA, REFERENCIAS NORMATIVAS y GLOSARIO/AUTOEVALUACIÓN sin que falte ninguna sección.`;
  }

  const cleanTopic = (topic || "[Escribe el Título o Índice arriba para actualizar]").trim();

  let finalPrompt = `Rol: Experto e Ingeniero Senior, especialista en docencia técnica y redacción de materiales de impacto.

Objetivo: Generar un documento HTML impecable y autónomo, adaptado al título del usuario y la profundidad requerida.
Mantén siempre un tono objetivo, crítico y directo. Evita cualquier tipo de lenguaje condescendiente o de relleno.

Instrucciones Globales de Accesibilidad y Formato:
1. Accesibilidad TTS y Dictado Narrativo en Tablas (CRÍTICO): Antes de declarar CUALQUIER etiqueta \`<table>\`, inserta un \`<div class="audio-desc">\` con un resumen o dictado narrativo accesible explicando los valores, unidades y criterios técnicos reflejados en la tabla para facilitar su asimilación por voz y lectores de pantalla. Añade \`aria-hidden="true"\` a la tabla.
2. FÓRMULAS Y MATEMÁTICAS EN FORMATO PLANO DEL TECLADO (CRÍTICO Y OBLIGATORIO):
- PROHIBIDO TERMINANTEMENTE usar LaTeX, KaTeX o signos de dólar ($ o $$) y comandos con barra invertida (\\frac, \\cdot, \\circ, \\sqrt, \\Delta, \\text, etc.).
- Todas las fórmulas, ecuaciones, potencias, grados y ángulos DEBEN escribirse en FORMATO PLANO DEL TECLADO estándar (utilizando símbolos directos: +, *, /, %, -, ^, sqrt(), °).
- Ejemplos obligatorios:
  * Ángulos y temperaturas: Escribe "60°" o "60 °C" (NUNCA "$60^\\circ$" ni "60^\\circ").
  * Multiplicación y división: Escribe "*" y "/" (ejemplo: "P = V * I * cos(phi)" o "I = P / (V * cos(phi))").
  * Raíces y potencias: Escribe "sqrt(3)", "x^2", "mm^2" (ejemplo: "P = sqrt(3) * V * I * cos(phi)").
  * Fórmulas destacadas: Envuélvelas siempre en \`<div class="formula-box">\` usando exclusivamente este texto plano de teclado y explicando las variables debajo.
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
      // Check if the recall box has sub-lists or questions with options
      const listItems = box.querySelectorAll("li");
      listItems.forEach((li) => {
        // If this li contains nested lists (options)
        const subListItems = li.querySelectorAll("ul > li, ol > li");
        if (subListItems.length >= 2) {
          const directText = Array.from(li.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE || (node as HTMLElement).tagName === "STRONG")
            .map((node) => node.textContent || "")
            .join(" ")
            .replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "")
            .replace(/[<>]/g, "")
            .trim();

          const parsedOptions: string[] = [];
          let correctIdx = 0;
          subListItems.forEach((subLi, sIdx) => {
            const rawSub = subLi.textContent || "";
            const isCorrect =
              subLi.getAttribute("data-correct") === "true" ||
              subLi.classList.contains("correct") ||
              /\s*[\(\[]\s*(?:correcta|verdadera)\s*[\)\]]/i.test(rawSub);
            if (isCorrect) correctIdx = sIdx;
            parsedOptions.push(cleanOptionText(rawSub));
          });

          if (directText && parsedOptions.length >= 2) {
            questions.push({
              enunciado: directText,
              opciones: parsedOptions,
              indiceCorrecta: correctIdx,
              justificacion: `Pregunta de autoevaluación Active Recall formulada a partir del tema "${topicTitle}". Consulta el apartado teórico para contrastar la respuesta.`,
              userSelectedIndex: null,
              flagged: false,
            });
            counter++;
            return;
          }
        }

        // Single list item: check if it contains multiple lines like "a) ... \n b) ..."
        const rawContent = li.innerHTML || "";
        const textLines = (li.textContent || "")
          .split(/\n|<br\s*\/?>/i)
          .map((l) => l.trim())
          .filter(Boolean);

        if (textLines.length >= 3 && /^[a-d][\)\.\-]/i.test(textLines[1])) {
          const enunciado = textLines[0].replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "").replace(/[<>]/g, "").trim();
          const parsedOptions: string[] = [];
          let correctIdx = 0;

          textLines.slice(1).forEach((line, lIdx) => {
            if (/^[a-d][\)\.\-]/i.test(line)) {
              const isCorrect = /\s*[\(\[]\s*(?:correcta|verdadera)\s*[\)\]]/i.test(line);
              if (isCorrect) correctIdx = lIdx;
              parsedOptions.push(cleanOptionText(line));
            }
          });

          if (enunciado && parsedOptions.length >= 2) {
            questions.push({
              enunciado,
              opciones: parsedOptions,
              indiceCorrecta: correctIdx,
              justificacion: `Pregunta de autoevaluación Active Recall formulada a partir del tema "${topicTitle}". Consulta el apartado teórico para contrastar la respuesta.`,
              userSelectedIndex: null,
              flagged: false,
            });
            counter++;
            return;
          }
        }

        // Standard single question without embedded options
        let text = li.textContent || "";
        text = text
          .replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "")
          .replace(/^<\s*([^<>]+?)\s*>\s*$/, "$1")
          .replace(/[<>]/g, "")
          .trim();

        if (text.length > 5) {
          questions.push({
            enunciado: text,
            opciones: [
              "Cumple estrictamente con la prescripción técnica y normativa indicada en el temario",
              "Aplica únicamente en instalaciones especiales bajo autorización expresa",
              "Supera los límites establecidos requiriendo corrección técnica",
              "Queda exento de cumplimiento según el criterio general de diseño",
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

/**
 * Converts rich topic HTML into clean, high-density structured plain text for exam base material.
 */
export function htmlToCleanTopicText(topicTitle: string, html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanAndRepairTopicHtml(html), "text/html");
    doc.querySelectorAll("script, style, #standalone-export-bar").forEach((el) => el.remove());

    const lines: string[] = [];
    lines.push(`================================================================================`);
    lines.push(`TEMA: ${topicTitle.toUpperCase()}`);
    lines.push(`================================================================================\n`);

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text.trim()) {
          lines.push(text.trim());
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "h1") {
          lines.push(`\n\n# ${(el.textContent || "").trim()}\n`);
        } else if (tag === "h2") {
          lines.push(`\n\n## ${(el.textContent || "").trim()}\n`);
        } else if (tag === "h3") {
          lines.push(`\n\n### ${(el.textContent || "").trim()}\n`);
        } else if (tag === "h4" || tag === "h5" || tag === "h6") {
          lines.push(`\n#### ${(el.textContent || "").trim()}\n`);
        } else if (tag === "p") {
          const pText = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (pText) lines.push(`\n${pText}\n`);
        } else if (tag === "li") {
          const liText = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (liText) lines.push(`• ${liText}`);
        } else if (tag === "table") {
          const rows = Array.from(el.querySelectorAll("tr"));
          lines.push("\n[TABLA DE DATOS / PRESCRIPCIONES TÉCNICAS]");
          rows.forEach((r) => {
            const cells = Array.from(r.querySelectorAll("th, td")).map((c) =>
              (c.textContent || "").replace(/\s+/g, " ").trim()
            );
            if (cells.length > 0) {
              lines.push(`| ${cells.join(" | ")} |`);
            }
          });
          lines.push("\n");
        } else if (el.classList.contains("formula-box")) {
          lines.push(`\n[FÓRMULA / CRITERIO TÉCNICO]: ${(el.textContent || "").replace(/\s+/g, " ").trim()}\n`);
        } else if (el.classList.contains("mnemo-box") || el.classList.contains("apuntes-box")) {
          lines.push(`\n[APUNTE DESTACADO]: ${(el.textContent || "").replace(/\s+/g, " ").trim()}\n`);
        } else if (el.classList.contains("recall-box")) {
          lines.push(`\n--- AUTOEVALUACIÓN RÁPIDA ---\n${(el.textContent || "").replace(/\s+/g, " ").trim()}\n-----------------------------\n`);
        } else {
          node.childNodes.forEach(walk);
        }
      }
    };

    doc.body.childNodes.forEach(walk);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } catch (e) {
    console.error("Error converting HTML to topic text:", e);
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

/**
 * Extracts all Active Recall questions, answers and solutions from the active topic HTML
 * into a dedicated structured document for test generation and study.
 */
export function extractAutoevaluacionYSolucionarioText(topicTitle: string, html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanAndRepairTopicHtml(html), "text/html");
    doc.querySelectorAll("script, style, #standalone-export-bar").forEach((el) => el.remove());

    const recallBoxes = doc.querySelectorAll(".recall-box");
    const outputLines: string[] = [];

    outputLines.push("================================================================================");
    outputLines.push(`AUTOEVALUACIÓN RÁPIDA Y SOLUCIONARIO TÉCNICO`);
    outputLines.push(`TEMA: ${topicTitle.toUpperCase()}`);
    outputLines.push("================================================================================\n");
    outputLines.push("DESCRIPCIÓN Y OBJETIVO:");
    outputLines.push("Este documento recopila íntegramente las preguntas de Autoevaluación Rápida");
    outputLines.push("(Active Recall) y el Solucionario Técnico asociado extraídos del tema activo.");
    outputLines.push("Sirve como documento de base para la generación de exámenes tipo test con respuestas justificadas.\n");
    outputLines.push("--------------------------------------------------------------------------------\n");

    let globalQIndex = 1;

    recallBoxes.forEach((box, bIdx) => {
      let prev = box.previousElementSibling;
      let boxHeading = "";
      const surroundingContext: string[] = [];

      while (prev) {
        const tagName = prev.tagName.toLowerCase();
        if (!boxHeading && (tagName === "h1" || tagName === "h2" || tagName === "h3" || tagName === "h4")) {
          boxHeading = (prev.textContent || "").trim();
        }
        if (tagName === "p" || tagName === "table" || prev.classList.contains("formula-box")) {
          const snippet = (prev.textContent || "").replace(/\s+/g, " ").trim();
          if (snippet && surroundingContext.length < 4) {
            surroundingContext.unshift(snippet);
          }
        }
        prev = prev.previousElementSibling;
      }

      const sectionTitle = boxHeading || `Subapartado ${bIdx + 1}`;
      outputLines.push(`\n================================================================================`);
      outputLines.push(`BLOQUE DE AUTOEVALUACIÓN ${bIdx + 1}: ${sectionTitle.toUpperCase()}`);
      outputLines.push(`================================================================================\n`);

      const listItems = box.querySelectorAll("li");
      listItems.forEach((li) => {
        const subListItems = li.querySelectorAll("ul > li, ol > li");
        if (subListItems.length >= 2) {
          const directText = Array.from(li.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE || (node as HTMLElement).tagName === "STRONG")
            .map((node) => node.textContent || "")
            .join(" ")
            .replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "")
            .replace(/[<>]/g, "")
            .trim();

          outputLines.push(`PREGUNTA ${globalQIndex}: ${directText || "Pregunta de autoevaluación"}`);
          let correctOptionText = "";
          subListItems.forEach((subLi, sIdx) => {
            const letter = String.fromCharCode(65 + sIdx);
            const rawSub = (subLi.textContent || "").trim();
            const isCorrect =
              subLi.getAttribute("data-correct") === "true" ||
              subLi.classList.contains("correct") ||
              /\s*[\(\[]\s*(?:correcta|verdadera)\s*[\)\]]/i.test(rawSub);
            const cleanSub = cleanOptionText(rawSub);
            outputLines.push(`   ${letter}) ${cleanSub}${isCorrect ? "  <-- [CORRECTA]" : ""}`);
            if (isCorrect) {
              correctOptionText = `${letter}) ${cleanSub}`;
            }
          });
          outputLines.push(`   ► SOLUCIÓN / RESPUESTA: ${correctOptionText || "Opción fundamentada en el temario"}`);
          outputLines.push(`   ► JUSTIFICACIÓN NORMATIVA: Conforme al desarrollo técnico del apartado "${sectionTitle}".\n`);
          globalQIndex++;
          return;
        }

        const textLines = (li.textContent || "")
          .split(/\n|<br\s*\/?>/i)
          .map((l) => l.trim())
          .filter(Boolean);

        if (textLines.length >= 3 && /^[a-d][\)\.\-]/i.test(textLines[1])) {
          const enunciado = textLines[0].replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "").replace(/[<>]/g, "").trim();
          outputLines.push(`PREGUNTA ${globalQIndex}: ${enunciado}`);
          let correctOpt = "";
          textLines.slice(1).forEach((line) => {
            const isCorrect = /\s*[\(\[]\s*(?:correcta|verdadera)\s*[\)\]]/i.test(line);
            outputLines.push(`   ${line}${isCorrect ? "  <-- [CORRECTA]" : ""}`);
            if (isCorrect) correctOpt = line;
          });
          outputLines.push(`   ► SOLUCIÓN / RESPUESTA: ${correctOpt || "Opción validada en el apartado"}`);
          outputLines.push(`   ► JUSTIFICACIÓN NORMATIVA: Fundamentada en el apartado "${sectionTitle}".\n`);
          globalQIndex++;
          return;
        }

        let text = (li.textContent || "")
          .replace(/^\s*(?:[-*•–—]|\d+[\.\)-])\s*/, "")
          .replace(/^<\s*([^<>]+?)\s*>\s*$/, "$1")
          .replace(/[<>]/g, "")
          .trim();

        if (text.length > 3) {
          outputLines.push(`PREGUNTA ${globalQIndex}: ${text}`);
          const relevantTheory = surroundingContext.slice(0, 3).join(" ");
          outputLines.push(`   ► SOLUCIÓN Y CRITERIO TÉCNICO:`);
          if (relevantTheory.length > 20) {
            outputLines.push(`     ${relevantTheory.substring(0, 400)}...`);
          } else {
            outputLines.push(`     Consultar las prescripciones técnicas y fórmulas desarrolladas en el apartado "${sectionTitle}".`);
          }
          outputLines.push(`   ► REFERENCIA Y JUSTIFICACIÓN:`);
          outputLines.push(`     Desarrollado en el apartado: "${sectionTitle}".\n`);
          globalQIndex++;
        }
      });
    });

    if (globalQIndex === 1) {
      outputLines.push("Cuestiones y conceptos clave de repaso extraídos del tema:\n");
      const bullets = doc.querySelectorAll("ul > li, ol > li");
      bullets.forEach((b, idx) => {
        const t = (b.textContent || "").trim();
        if (t.length > 15 && idx < 30) {
          outputLines.push(`CUESTIÓN ${idx + 1}: ${t}`);
          outputLines.push(`► Solución / Fundamento: Desarrollado en el cuerpo teórico del tema.\n`);
        }
      });
    }

    outputLines.push("\n================================================================================");
    outputLines.push(`FIN DEL SOLUCIONARIO Y AUTOEVALUACIÓN RÁPIDA (Total: ${Math.max(0, globalQIndex - 1)} preguntas registradas)`);
    outputLines.push("================================================================================");

    return outputLines.join("\n");
  } catch (err) {
    console.error("Error extrayendo autoevaluacion y solucionario:", err);
    return `Autoevaluación Rápida y Solucionario - ${topicTitle}\n\nDocumento generado a partir del temario.`;
  }
}

/**
 * Escapes HTML characters for safe rendering
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converts Markdown text (or PDF OCR output) into clean semantic HTML
 */
export function markdownToCleanHtml(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return "";

  const trimmed = markdown.trim();
  // If it's already full HTML
  if (/<(?:!DOCTYPE|html|body|div\s+class=["']page["'])/i.test(trimmed)) {
    return cleanAndRepairTopicHtml(trimmed);
  }

  const lines = trimmed.split("\n");
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let blockquoteBuffer: string[] = [];
  let inRecallBox = false;

  const flushBlockquote = () => {
    if (inBlockquote) {
      const text = blockquoteBuffer.join(" ").trim();
      if (text) {
        htmlParts.push(`<blockquote>${formatInlineMarkdown(text)}</blockquote>`);
      }
      blockquoteBuffer = [];
      inBlockquote = false;
    }
  };

  const flushList = () => {
    if (inList) {
      htmlParts.push(`</${inList}>`);
      inList = null;
    }
  };

  const flushRecallBox = () => {
    if (inRecallBox) {
      flushBlockquote();
      flushList();
      flushTable();
      htmlParts.push("</div>");
      inRecallBox = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse my-3 text-xs">';
      const isHeaderSep = (row: string[]) => row.every((c) => /^[-:\s]+$/.test(c));

      let hasHeader = false;
      if (tableRows.length >= 2 && isHeaderSep(tableRows[1])) {
        hasHeader = true;
      }

      if (hasHeader) {
        tableHtml += "<thead><tr>";
        tableRows[0].forEach((cell) => {
          tableHtml += `<th>${formatInlineMarkdown(cell)}</th>`;
        });
        tableHtml += "</tr></thead><tbody>";
        for (let r = 2; r < tableRows.length; r++) {
          if (isHeaderSep(tableRows[r])) continue;
          tableHtml += "<tr>";
          tableRows[r].forEach((cell) => {
            tableHtml += `<td>${formatInlineMarkdown(cell)}</td>`;
          });
          tableHtml += "</tr>";
        }
        tableHtml += "</tbody>";
      } else {
        tableHtml += "<tbody>";
        tableRows.forEach((row) => {
          if (isHeaderSep(row)) return;
          tableHtml += "<tr>";
          row.forEach((cell) => {
            tableHtml += `<td>${formatInlineMarkdown(cell)}</td>`;
          });
          tableHtml += "</tr>";
        });
        tableHtml += "</tbody>";
      }

      tableHtml += "</table></div>";
      htmlParts.push(tableHtml);
      tableRows = [];
      inTable = false;
    }
  };

  const formatInlineMarkdown = (text: string): string => {
    const cleanedText = cleanMathToPlainText(text);
    let res = escapeHtml(cleanedText);
    // Bold + Italic
    res = res.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    res = res.replace(/___(.*?)___/g, "<strong><em>$1</em></strong>");
    // Bold
    res = res.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    res = res.replace(/__(.*?)__/g, "<strong>$1</strong>");
    // Italic
    res = res.replace(/\*(.*?)\*/g, "<em>$1</em>");
    res = res.replace(/_([^_]+)_/g, "<em>$1</em>");
    // Code
    res = res.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Strikethrough
    res = res.replace(/~~(.*?)~~/g, "<del>$1</del>");
    return res;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTrimmed = line.trim();

    // 1. Code blocks
    if (lineTrimmed.startsWith("```")) {
      if (inCodeBlock) {
        htmlParts.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushBlockquote();
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Autoevaluación Rápida / Active Recall Trigger
    const isAutoevalHeader =
      /^(?:---|===+)\s*AUTOEVALUACIÓN\s+RÁPIDA/i.test(lineTrimmed) ||
      /^\[AUTOEVALUACIÓN\s+RÁPIDA\]/i.test(lineTrimmed) ||
      /^BLOQUE DE AUTOEVALUACIÓN/i.test(lineTrimmed);

    if (isAutoevalHeader) {
      flushRecallBox();
      flushBlockquote();
      flushList();
      flushTable();
      inRecallBox = true;
      const cleanHeader = lineTrimmed
        .replace(/^(?:---|===+)\s*/, "")
        .replace(/\s*(?:---|===+)$/, "")
        .replace(/^\[|\]$/g, "")
        .trim();
      htmlParts.push(
        `<div class="recall-box" data-section="autoevaluacion"><div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; font-weight:800; color:#15803d; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;"><span style="background:#16a34a; color:#ffffff; padding:3px 8px; border-radius:4px; font-size:10.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px;">🎯 AUTOEVALUACIÓN RÁPIDA</span><span>${escapeHtml(
          cleanHeader || "Active Recall y Verificación"
        )}</span></div>`
      );
      continue;
    }

    // Close recall box if separator encountered
    if (inRecallBox && /^(?:-----------------------------|={10,}|_{10,})\s*$/.test(lineTrimmed)) {
      flushRecallBox();
      continue;
    }

    // 3. Formula Box Callouts
    if (lineTrimmed.startsWith("[FÓRMULA / CRITERIO TÉCNICO]:")) {
      flushRecallBox();
      flushBlockquote();
      flushList();
      flushTable();
      const content = lineTrimmed.replace(/^\[FÓRMULA \/ CRITERIO TÉCNICO\]:\s*/, "");
      htmlParts.push(`<div class="formula-box">${formatInlineMarkdown(content)}</div>`);
      continue;
    }

    // 4. Apuntes Callouts
    if (lineTrimmed.startsWith("[APUNTE DESTACADO]:")) {
      flushRecallBox();
      flushBlockquote();
      flushList();
      flushTable();
      const content = lineTrimmed.replace(/^\[APUNTE DESTACADO\]:\s*/, "");
      htmlParts.push(`<div class="apuntes-box"><strong>📌 APUNTE CLAVE:</strong> ${formatInlineMarkdown(content)}</div>`);
      continue;
    }

    // 5. Mnemotecnia Callouts
    if (lineTrimmed.startsWith("[MNEMOTECNIA]:")) {
      flushRecallBox();
      flushBlockquote();
      flushList();
      flushTable();
      const content = lineTrimmed.replace(/^\[MNEMOTECNIA\]:\s*/, "");
      htmlParts.push(`<div class="mnemo-box"><strong>💡 REGLA MNEMOTÉCNICA:</strong> ${formatInlineMarkdown(content)}</div>`);
      continue;
    }

    // 6. Tables
    if (lineTrimmed.startsWith("|") && lineTrimmed.endsWith("|")) {
      flushBlockquote();
      flushList();
      inTable = true;
      const cells = lineTrimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 7. Blockquotes
    if (lineTrimmed.startsWith(">")) {
      flushList();
      inBlockquote = true;
      blockquoteBuffer.push(lineTrimmed.replace(/^>\s*/, ""));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // 8. Headings
    if (/^#{1,6}\s+/.test(lineTrimmed)) {
      if (inRecallBox) flushRecallBox();
      flushList();
      const match = lineTrimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        if (/autoevaluaci[oó]n/i.test(text)) {
          htmlParts.push(
            `<h${level} style="color:#16a34a !important; display:flex; align-items:center; gap:8px;">🎯 ${formatInlineMarkdown(text)}</h${level}>`
          );
        } else {
          htmlParts.push(`<h${level}>${formatInlineMarkdown(text)}</h${level}>`);
        }
      }
      continue;
    }

    // 9. Horizontal rule
    if (/^(?:---|\*\*\*|___)\s*$/.test(lineTrimmed)) {
      if (inRecallBox) {
        flushRecallBox();
      } else {
        flushList();
        htmlParts.push("<hr />");
      }
      continue;
    }

    // 10. Lists
    const ulMatch = lineTrimmed.match(/^[-*•+]\s+(.*)$/);
    const olMatch = lineTrimmed.match(/^\d+[\.\)]\s+(.*)$/);

    if (ulMatch) {
      if (inList !== "ul") {
        flushList();
        htmlParts.push("<ul>");
        inList = "ul";
      }
      htmlParts.push(`<li>${formatInlineMarkdown(ulMatch[1])}</li>`);
      continue;
    } else if (olMatch) {
      if (inList !== "ol") {
        flushList();
        htmlParts.push("<ol>");
        inList = "ol";
      }
      htmlParts.push(`<li>${formatInlineMarkdown(olMatch[1])}</li>`);
      continue;
    } else {
      flushList();
    }

    // 11. Paragraph or blank line
    if (!lineTrimmed) {
      continue;
    }

    htmlParts.push(`<p>${formatInlineMarkdown(lineTrimmed)}</p>`);
  }

  flushRecallBox();
  flushBlockquote();
  flushList();
  flushTable();

  return htmlParts.join("\n");
}

/**
 * Renders the Base Document in Markdown (.md) visual delivery format (Matching Screenshot 1)
 */
export function renderMarkdownDeliverableHtml(docName: string, markdownText: string, isDark = true): string {
  const words = markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0;
  const chars = markdownText.length;
  const linesCount = markdownText.split("\n").length;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  const cleanBodyHtml = markdownToCleanHtml(markdownText);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(docName)} - Formato Markdown (.md)</title>
  <style>
    :root { color-scheme: ${isDark ? "dark" : "light"}; }
    * { box-sizing: border-box; }
    body {
      background-color: ${isDark ? "#090a0f" : "#f1f5f9"};
      color: ${isDark ? "#e2e8f0" : "#1e293b"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px 16px;
      line-height: 1.68;
      font-size: 13.5px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 920px;
      margin: 0 auto;
      background: ${isDark ? "#12141c" : "#ffffff"};
      border: 1px solid ${isDark ? "#232736" : "#e2e8f0"};
      border-radius: 16px;
      padding: 32px;
      box-shadow: ${isDark ? "0 12px 36px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.06)"};
    }
    .header-bar {
      padding-bottom: 20px;
      border-bottom: 1px solid ${isDark ? "#232736" : "#e2e8f0"};
      margin-bottom: 28px;
    }
    .badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .badge-md {
      background: #2563eb;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 5px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .read-time {
      font-size: 12px;
      color: ${isDark ? "#94a3b8" : "#64748b"};
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 800;
      color: ${isDark ? "#ffffff" : "#0f172a"};
      margin: 0 0 12px 0;
      line-height: 1.3;
      letter-spacing: -0.3px;
    }
    .stats-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: ${isDark ? "#94a3b8" : "#64748b"};
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: ${isDark ? "#1a1d29" : "#f1f5f9"};
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid ${isDark ? "#282d3f" : "#e2e8f0"};
    }
    /* Distinctive Markdown Typography (Matching Screenshot 1) */
    h1 {
      font-size: 22px;
      font-weight: 900;
      color: #f59e0b;
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${isDark ? "#2d3345" : "#e2e8f0"};
      letter-spacing: -0.3px;
      line-height: 1.35;
      text-transform: uppercase;
    }
    h2 {
      font-size: 18px;
      font-weight: 800;
      color: #fbbf24;
      margin-top: 26px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${isDark ? "#232736" : "#f1f5f9"};
      letter-spacing: -0.2px;
      text-transform: uppercase;
    }
    h3 {
      font-size: 15px;
      font-weight: 700;
      color: #60a5fa;
      margin-top: 22px;
      margin-bottom: 10px;
    }
    h4 {
      font-size: 14px;
      font-weight: 700;
      color: ${isDark ? "#e2e8f0" : "#334155"};
      margin-top: 18px;
      margin-bottom: 8px;
    }
    p {
      margin-top: 0;
      margin-bottom: 14px;
      color: ${isDark ? "#cbd5e1" : "#334155"};
      line-height: 1.7;
    }
    strong {
      color: ${isDark ? "#f8fafc" : "#0f172a"};
      font-weight: 700;
    }
    em {
      color: ${isDark ? "#e2e8f0" : "#475569"};
    }
    ul, ol {
      margin: 12px 0 16px 20px;
      padding: 0;
      color: ${isDark ? "#cbd5e1" : "#334155"};
    }
    li {
      margin-bottom: 6px;
      line-height: 1.65;
    }
    blockquote {
      border-left: 4px solid #f59e0b;
      background: ${isDark ? "rgba(245, 158, 11, 0.1)" : "#fffbeb"};
      padding: 12px 16px;
      border-radius: 0 10px 10px 0;
      margin: 18px 0;
      color: ${isDark ? "#fde68a" : "#78350f"};
      font-style: italic;
    }
    code {
      background: ${isDark ? "#1a1d28" : "#f1f5f9"};
      color: #f59e0b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid ${isDark ? "#282d3f" : "#e2e8f0"};
    }
    pre {
      background: ${isDark ? "#141722" : "#f8fafc"};
      border: 1px solid ${isDark ? "#282d3f" : "#e2e8f0"};
      border-radius: 8px;
      padding: 14px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: ${isDark ? "#e2e8f0" : "#1e293b"};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 12.5px;
      border: 1px solid ${isDark ? "#282d3f" : "#e2e8f0"};
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: ${isDark ? "#1a1e2b" : "#f1f5f9"};
      color: ${isDark ? "#f8fafc" : "#0f172a"};
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid ${isDark ? "#282d3f" : "#cbd5e1"};
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid ${isDark ? "#232736" : "#f1f5f9"};
      color: ${isDark ? "#cbd5e1" : "#334155"};
    }
    tr:nth-child(even) td {
      background: ${isDark ? "#141722" : "#f8fafc"};
    }
    hr {
      border: none;
      border-top: 1px solid ${isDark ? "#282d3f" : "#e2e8f0"};
      margin: 24px 0;
    }
    .recall-box, .autoevaluacion-box, .autoeval-box {
      background: ${isDark ? "#064e3b" : "#f0fdf4"} !important;
      border: 1px solid ${isDark ? "#047857" : "#bbf7d0"} !important;
      border-left: 6px solid ${isDark ? "#4ade80" : "#16a34a"} !important;
      padding: 16px 20px;
      margin: 22px 0;
      border-radius: 0 10px 10px 0;
      color: ${isDark ? "#ecfdf5" : "#14532d"} !important;
      font-size: 12.5px;
      line-height: 1.65;
      box-shadow: ${isDark ? "0 4px 14px rgba(0,0,0,0.3)" : "0 2px 8px rgba(22,163,74,0.08)"};
    }
    .recall-box strong, .autoevaluacion-box strong, .autoeval-box strong {
      color: ${isDark ? "#86efac" : "#15803d"} !important;
    }
    .recall-box ul, .recall-box ol {
      margin: 10px 0 10px 22px !important;
      color: ${isDark ? "#ecfdf5" : "#14532d"} !important;
    }
    .recall-box li {
      color: ${isDark ? "#ecfdf5" : "#14532d"} !important;
      font-size: 12.5px !important;
      margin-bottom: 6px;
    }
    .recall-box li strong {
      color: ${isDark ? "#86efac" : "#15803d"} !important;
    }
    .formula-box {
      background: ${isDark ? "#172554" : "#eff6ff"};
      border: 1px solid ${isDark ? "#1e3a8a" : "#bfdbfe"};
      border-left: 5px solid #3b82f6;
      padding: 12px 16px;
      margin: 18px 0;
      border-radius: 0 8px 8px 0;
      color: ${isDark ? "#bfdbfe" : "#1e40af"};
      font-family: ui-monospace, monospace;
      font-size: 12px;
      font-weight: 600;
    }
    .apuntes-box {
      background: ${isDark ? "#1e1b4b" : "#f5f3ff"};
      border: 1px solid ${isDark ? "#312e81" : "#ddd6fe"};
      border-left: 5px solid #8b5cf6;
      padding: 12px 16px;
      margin: 18px 0;
      border-radius: 0 8px 8px 0;
      color: ${isDark ? "#ddd6fe" : "#5b21b6"};
      font-size: 12px;
    }
    .mnemo-box {
      background: ${isDark ? "#451a03" : "#fffbeb"};
      border: 1px solid ${isDark ? "#78350f" : "#fef3c7"};
      border-left: 5px solid #f59e0b;
      padding: 12px 16px;
      margin: 18px 0;
      border-radius: 0 8px 8px 0;
      color: ${isDark ? "#fef3c7" : "#92400e"};
      font-size: 12px;
    }
    mark.search-match {
      background-color: #fde047;
      color: #000000;
      font-weight: bold;
      border-radius: 2px;
      padding: 1px 3px;
    }
    @media print {
      body { background: #ffffff !important; color: #000000 !important; padding: 0 !important; }
      .container { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
      h1, h2, h3 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <div class="badge-row">
        <span class="badge-md">📖 Temario / Base Documental (.md)</span>
        <span class="read-time">⏱ ~${readingTime} min lectura</span>
      </div>
      <h1 class="doc-title">${escapeHtml(docName)}</h1>
      <div class="stats-row">
        <span class="stat-badge">📄 ${words.toLocaleString()} palabras</span>
        <span class="stat-badge">🔤 ${chars.toLocaleString()} caracteres</span>
        <span class="stat-badge">📑 ${linesCount} líneas</span>
      </div>
    </div>
    <div class="content-body">
      ${cleanBodyHtml}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders the Base Document in Technical A4 HTML format (Matching generated HTML layout)
 */
export function renderTechnicalA4DocumentHtml(docName: string, markdownText: string, isDark = false): string {
  const cleanBodyHtml = markdownToCleanHtml(markdownText);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(docName)} - Documento Técnico HTML</title>
  ${TOPIC_STYLE_INJECTIONS}
</head>
<body class="${isDark ? "dark-theme" : ""}">
  <div class="page">
    <div style="display: inline-block; background: #003366; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">
      DOCUMENTO BASE TÉCNICO (HTML)
    </div>
    <h1 style="margin-top: 0;">${escapeHtml(docName)}</h1>
    ${cleanBodyHtml}
  </div>
</body>
</html>`;
}

/**
 * Renders raw code (Markdown source or HTML code) cleanly in the iframe
 */
export function renderPlainCodeHtml(docName: string, text: string, mode: "md" | "html", isDark = true): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background-color: ${isDark ? "#090a0f" : "#f8fafc"};
      color: ${isDark ? "#e2e8f0" : "#1e293b"};
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.7;
      margin: 0;
      padding: 20px;
    }
    .code-container {
      max-width: 960px;
      margin: 0 auto;
      background: ${isDark ? "#12141c" : "#ffffff"};
      border: 1px solid ${isDark ? "#232736" : "#e2e8f0"};
      border-radius: 12px;
      padding: 24px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .header {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: ${isDark ? "#94a3b8" : "#64748b"};
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid ${isDark ? "#232736" : "#e2e8f0"};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      background: ${mode === "html" ? "#059669" : "#2563eb"};
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="code-container">
    <div class="header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge">${mode === "html" ? "Código .HTML" : "Formato .MD"}</span>
        <span>${escapeHtml(docName)}</span>
      </div>
      <span>${text.length.toLocaleString()} caracteres</span>
    </div>
    <div>${escapeHtml(text)}</div>
  </div>
</body>
</html>`;
}

