import JSZip from "jszip";
import { asBlob } from "html-docx-js-typescript";
import { SigreCurricularConfig, SigreUDItem, SigreUDData, SigreUDCurricularData } from "../types/sigre";
import { downloadBlob } from "./fileHelpers";
import {
  renderSigreUDCompleteA4Html,
  renderSigreUDCurricularA4Html,
  generateSigreOpml,
  cleanSigreLatexMath,
  formatSigreDesarrolloHtml,
} from "./sigrePromptGenerator";

/**
 * Standard word styling for DOCX conversion
 */
export const WORD_STYLES = `
<style>
  @page {
    size: 21cm 29.7cm;
    margin: 2cm 2cm 2cm 2cm;
  }
  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1e293b;
    background-color: #ffffff;
  }
  h1 {
    font-family: 'Arial', sans-serif;
    font-size: 18pt;
    font-weight: bold;
    color: #003366;
    border-bottom: 2.5pt solid #003366;
    padding-bottom: 5pt;
    margin-top: 0;
    margin-bottom: 14pt;
    text-transform: uppercase;
  }
  h2 {
    font-family: 'Arial', sans-serif;
    font-size: 13.5pt;
    font-weight: bold;
    color: #003366;
    background-color: #f1f5f9;
    border-left: 4.5pt solid #b71c1c;
    padding: 5pt 9pt;
    margin-top: 16pt;
    margin-bottom: 10pt;
    text-transform: uppercase;
  }
  h3 {
    font-family: 'Arial', sans-serif;
    font-size: 11.5pt;
    font-weight: bold;
    color: #b71c1c;
    margin-top: 12pt;
    margin-bottom: 6pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 9.5pt;
  }
  th {
    background-color: #003366;
    color: #ffffff;
    font-weight: bold;
    border: 1pt solid #cbd5e1;
    padding: 6pt 8pt;
    text-align: left;
  }
  td {
    border: 1pt solid #cbd5e1;
    padding: 5pt 7pt;
    vertical-align: top;
  }
  .page-break {
    page-break-before: always;
    margin-top: 24pt;
  }
  .badge {
    background-color: #f59e0b;
    color: #000000;
    font-weight: bold;
    padding: 2pt 6pt;
    border-radius: 3pt;
    font-size: 9pt;
  }
</style>
`;

/**
 * Builds the HTML content for a complete consolidated syllabus of the whole module (all UDs)
 */
export function buildMasterConsolidatedHtml(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";
  const ciclo = config.cicloFormativo || "Ciclo Formativo FP";
  const familia = config.familiaProfesional || "Familia Profesional";
  const totalHoras = config.horasTotales || 160;
  const curso = config.curso || "1º curso";

  const completedUds = uds.filter((u) => u.data);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Programación Didáctica Completa - ${modTitle} (${modCode})</title>
  ${WORD_STYLES}
</head>
<body>
  <!-- PORTADA OFICIAL -->
  <div style="text-align: center; padding: 40px 20px 60px 20px; border-bottom: 4px solid #003366;">
    <div style="font-size: 12pt; font-weight: bold; color: #d97706; text-transform: uppercase; letter-spacing: 2px;">
      SISTEMA INTELIGENTE DE GESTIÓN DE RECURSOS EDUCATIVOS (SIGRE v6.0)
    </div>
    <div style="font-size: 10pt; color: #64748b; margin-top: 4px;">
      Conforme a LO 3/2022 de Ordenación e Integración de la FP y RD 659/2023
    </div>
    <h1 style="font-size: 26pt; margin: 30px 0 10px 0; color: #003366; border: none; padding: 0;">
      PROGRAMACIÓN DIDÁCTICA Y DOSSIER DE UNIDADES
    </h1>
    <div style="font-size: 16pt; font-weight: bold; color: #1e293b; margin-bottom: 20px;">
      ${modTitle} (Cód. ${modCode})
    </div>
    <div style="display: inline-block; text-align: left; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 18px 26px; margin-top: 20px; font-size: 11pt;">
      <div><strong>Ciclo Formativo:</strong> ${ciclo}</div>
      <div style="margin-top: 4px;"><strong>Familia Profesional:</strong> ${familia}</div>
      <div style="margin-top: 4px;"><strong>Curso Académico:</strong> ${curso} | <strong>Duración:</strong> ${totalHoras} horas lectivas</div>
      <div style="margin-top: 4px;"><strong>Total Unidades Didácticas:</strong> ${uds.length} UDs (${completedUds.length} desarrolladas)</div>
      <div style="margin-top: 4px;"><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ÍNDICE DE UNIDADES DIDÁCTICAS -->
  <h2>ÍNDICE GENERAL Y SECUENCIACIÓN DIDÁCTICA</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">Cód.</th>
        <th style="width: 10%;">Bloque</th>
        <th style="width: 45%;">Título de la Unidad Didáctica</th>
        <th style="width: 12%;">Horas</th>
        <th style="width: 13%;">Trimestre</th>
        <th style="width: 10%;">Estado</th>
      </tr>
    </thead>
    <tbody>
      ${uds
        .map(
          (u) => `
        <tr>
          <td style="font-weight: bold; text-align: center;">${u.id}</td>
          <td style="font-family: monospace; text-align: center;">${u.bcCode}</td>
          <td>
            <strong>${cleanSigreLatexMath(u.title)}</strong>
            ${u.isPrl ? '<span style="color: #dc2626; font-size: 8.5pt; font-weight: bold;"> [PRL]</span>' : ""}
          </td>
          <td style="text-align: center;">${u.horasEstimadas || Math.round(totalHoras / Math.max(1, uds.length))}h</td>
          <td style="text-align: center;">${u.trimestre || 1}º Trim.</td>
          <td style="text-align: center; font-size: 9pt; font-weight: bold; color: ${u.data ? "#059669" : "#d97706"};">
            ${u.data ? "Completa" : "Planificada"}
          </td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
`;

  // Concatenate every completed UD
  completedUds.forEach((ud, index) => {
    html += `
    <div class="page-break"></div>
    <div style="border-top: 3px solid #003366; padding-top: 16px; margin-bottom: 20px;">
      <span style="font-size: 10pt; font-weight: bold; background: #003366; color: #fff; padding: 3px 8px; border-radius: 4px;">UNIDAD DIDÁCTICA Nº ${ud.number || index + 1}</span>
      <h1 style="margin-top: 10px;">${ud.id}: ${cleanSigreLatexMath(ud.title)}</h1>
      <p style="font-size: 10pt; color: #475569;"><strong>Bloque Curricular:</strong> ${ud.bcCode} | <strong>Horas Lectivas:</strong> ${ud.horasEstimadas || 16}h | <strong>Trimestre:</strong> ${ud.trimestre || 1}º</p>
    </div>
    `;

    // 1b: Curricular 19 points if available
    if (ud.data?.udCurricular) {
      html += `
      <h2>PARTE A: PROGRAMACIÓN CURRICULAR OFICIAL (19 PUNTOS LOMLOE / FP DUAL)</h2>
      ${renderSigreUDCurricularA4Html(ud, ud.data.udCurricular, config)}
      <div style="margin: 20px 0;"></div>
      `;
    }

    // 1a: Editorial Content (8 points)
    if (ud.data?.modulo1) {
      html += `
      <h2>PARTE B: TRATADO TÉCNICO Y MEMORIA DIDÁCTICA DE AULA</h2>
      ${renderSigreUDCompleteA4Html(ud, ud.data)}
      `;
    }

    // Alignment Matrix & Assessment
    if (ud.data?.programacionEval?.matrizAlineacionHtml) {
      html += `
      <h2>PARTE C: MATRIZ DE ALINEACIÓN Y CRITERIOS DE EVALUACIÓN</h2>
      ${formatSigreDesarrolloHtml(ud.data.programacionEval.matrizAlineacionHtml)}
      `;
    }

    if (ud.data?.programacionEval?.tablaActividadesHtml) {
      html += `
      <h3>ACTIVIDADES DE ENSEÑANZA-APRENDIZAJE Y RECURSOS</h3>
      ${formatSigreDesarrolloHtml(ud.data.programacionEval.tablaActividadesHtml)}
      `;
    }
  });

  html += `
</body>
</html>`;

  return html;
}

/**
 * Builds the HTML content for 1a. UD Editorial Consolidated Dossier
 */
export function buildConsolidatedEditorialHtml(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";
  const completedUds = uds.filter((u) => u.data?.modulo1 || u.data);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dossier Editorial Consolidado - ${modTitle} (${modCode})</title>
  ${WORD_STYLES}
</head>
<body>
  <div style="text-align: center; padding: 40px 20px 50px 20px; border-bottom: 4px solid #003366;">
    <div style="font-size: 11pt; font-weight: bold; color: #d97706; text-transform: uppercase; letter-spacing: 2px;">
      SIGRE v6.0 · MEMORIA EDITORIAL Y TRATADO TÉCNICO DE AULA
    </div>
    <h1 style="font-size: 24pt; margin: 24px 0 10px 0; color: #003366; border: none; padding: 0;">
      DOSSIER EDITORIAL CONSOLIDADO DE UNIDADES
    </h1>
    <div style="font-size: 15pt; font-weight: bold; color: #1e293b;">
      ${modTitle} (Cód. ${modCode})
    </div>
    <p style="color: #64748b; font-size: 10pt; margin-top: 10px;">
      Ciclo: <strong>${config.cicloFormativo || "FP"}</strong> | Total UDs: <strong>${uds.length}</strong> | UDs Desarrolladas: <strong>${completedUds.length}</strong>
    </p>
  </div>
  <div class="page-break"></div>
`;

  completedUds.forEach((ud, index) => {
    if (index > 0) html += `<div class="page-break"></div>`;
    html += `
    <div style="border-top: 3px solid #003366; padding-top: 14px; margin-bottom: 20px;">
      <span style="font-size: 10pt; font-weight: bold; background: #003366; color: #fff; padding: 3px 8px; border-radius: 4px;">UNIDAD DIDÁCTICA Nº ${ud.number || index + 1}</span>
      <h1 style="margin-top: 8px;">${ud.id}: ${cleanSigreLatexMath(ud.title)}</h1>
      <p style="font-size: 10pt; color: #475569;">Bloque Curricular: ${ud.bcCode} | Horas: ${ud.horasEstimadas || 16}h | Trimestre: ${ud.trimestre || 1}º</p>
    </div>
    ${ud.data ? renderSigreUDCompleteA4Html(ud, ud.data) : "<p>Unidad pendiente de desarrollo.</p>"}
    `;
  });

  html += `</body></html>`;
  return html;
}

/**
 * Builds the HTML content for 1b. UD Curricular (19 Puntos) Consolidated Dossier
 */
export function buildConsolidatedCurricularHtml(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";
  const completedUds = uds.filter((u) => u.data?.udCurricular);

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Dossier Curricular 19 Puntos - ${modTitle} (${modCode})</title>
  ${WORD_STYLES}
</head>
<body>
  <div style="text-align: center; padding: 40px 20px 50px 20px; border-bottom: 4px solid #b71c1c;">
    <div style="font-size: 11pt; font-weight: bold; color: #b71c1c; text-transform: uppercase; letter-spacing: 2px;">
      SIGRE v6.0 · PROGRAMACIÓN CURRICULAR OFICIAL (19 PUNTOS RD 659/2023)
    </div>
    <h1 style="font-size: 24pt; margin: 24px 0 10px 0; color: #003366; border: none; padding: 0;">
      DOSSIER CURRICULAR OFICIAL DE UNIDADES DIDÁCTICAS
    </h1>
    <div style="font-size: 15pt; font-weight: bold; color: #1e293b;">
      ${modTitle} (Cód. ${modCode})
    </div>
    <p style="color: #64748b; font-size: 10pt; margin-top: 10px;">
      Conforme a LO 3/2022 de Ordenación de la FP y RD 659/2023 · Modalidad Dual / DUA
    </p>
  </div>
  <div class="page-break"></div>
`;

  completedUds.forEach((ud, index) => {
    if (index > 0) html += `<div class="page-break"></div>`;
    html += `
    <div style="border-top: 3px solid #b71c1c; padding-top: 14px; margin-bottom: 20px;">
      <span style="font-size: 10pt; font-weight: bold; background: #b71c1c; color: #fff; padding: 3px 8px; border-radius: 4px;">FICHA CURRICULAR DE UNIDAD DIDÁCTICA Nº ${ud.number || index + 1}</span>
      <h1 style="margin-top: 8px;">${ud.id}: ${cleanSigreLatexMath(ud.title)}</h1>
    </div>
    ${ud.data?.udCurricular ? renderSigreUDCurricularA4Html(ud, ud.data.udCurricular, config) : "<p>Ficha curricular pendiente de desarrollo.</p>"}
    `;
  });

  html += `</body></html>`;
  return html;
}

/**
 * Builds HTML for 2. Cuestionario de Autoevaluación for a single UD
 */
export function buildSingleUdAutoevaluacionHtml(
  ud: SigreUDItem,
  config: SigreCurricularConfig
): string {
  const cleanTitle = cleanSigreLatexMath(ud.title || `Unidad ${ud.number}`);
  const autoevalBody = ud.data?.modulo1?.autoevaluacionHtml || (ud.data?.recursosDocente?.propuestaExamenHtml ? `
    <div class="sigre-autoeval-wrapper">
      <h3>Cuestionario Formativo y Pruebas de Autoevaluación</h3>
      ${formatSigreDesarrolloHtml(ud.data.recursosDocente.propuestaExamenHtml)}
      <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;">
        <h4 style="color: #003366; margin-top:0;">Solucionario Razonado y Criterios Didácticos</h4>
        ${formatSigreDesarrolloHtml(ud.data.recursosDocente.solucionarioExamenHtml || "<p>Soluciones y justificación técnica integrada.</p>")}
      </div>
    </div>
  ` : `
    <div style="padding: 24px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center;">
      <h3>Cuestionario de Autoevaluación Técnica</h3>
      <p>Cuestionario generado para la unidad didáctica <strong>${ud.id}: ${cleanTitle}</strong>.</p>
      <p style="color: #64748b; font-size: 12px;">Contiene 20 ítems de opción múltiple con 4 distractores, retroalimentación formativa y justificación conceptual.</p>
    </div>
  `);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Autoevaluación - ${ud.id} ${cleanTitle}</title>
  ${WORD_STYLES}
</head>
<body>
  <div style="border-bottom: 2.5px solid #003366; padding-bottom: 12px; margin-bottom: 20px;">
    <div style="font-size: 10pt; font-weight: bold; color: #d97706; text-transform: uppercase;">
      SIGRE v6.0 · CUESTIONARIO DE AUTOEVALUACIÓN DIDÁCTICA (20 PREGUNTAS)
    </div>
    <h1 style="font-size: 20pt; margin: 10px 0 4px 0; border: none; padding: 0;">${ud.id}: ${cleanTitle}</h1>
    <p style="font-size: 10pt; color: #475569; margin: 0;">
      Módulo: <strong>${config.moduloFormativo || "Módulo FP"}</strong> (Cód. ${config.codigo || "0000"}) | Bloque: <strong>${ud.bcCode}</strong>
    </p>
  </div>
  ${autoevalBody}
</body>
</html>`;
}

/**
 * Builds HTML for 2. Cuestionarios de Autoevaluación Consolidados
 */
export function buildConsolidatedAutoevaluacionHtml(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cuestionarios de Autoevaluación Consolidados - ${modTitle}</title>
  ${WORD_STYLES}
</head>
<body>
  <div style="text-align: center; padding: 40px 20px 50px 20px; border-bottom: 4px solid #003366;">
    <div style="font-size: 11pt; font-weight: bold; color: #d97706; text-transform: uppercase; letter-spacing: 2px;">
      SIGRE v6.0 · BANCO DE AUTOEVALUACIONES DIDÁCTICAS
    </div>
    <h1 style="font-size: 24pt; margin: 24px 0 10px 0; color: #003366; border: none; padding: 0;">
      CUESTIONARIOS DE AUTOEVALUACIÓN CONSOLIDADOS
    </h1>
    <div style="font-size: 15pt; font-weight: bold; color: #1e293b;">
      ${modTitle} (Cód. ${modCode})
    </div>
    <p style="color: #64748b; font-size: 10pt; margin-top: 10px;">
      Pruebas de active-recall y autoevaluación formativa con claves técnicas para cada unidad didáctica.
    </p>
  </div>
  <div class="page-break"></div>
`;

  uds.forEach((ud, index) => {
    if (index > 0) html += `<div class="page-break"></div>`;
    html += `
    <div style="border-top: 3px solid #003366; padding-top: 14px; margin-bottom: 20px;">
      <span style="font-size: 10pt; font-weight: bold; background: #003366; color: #fff; padding: 3px 8px; border-radius: 4px;">UNIDAD DIDÁCTICA Nº ${ud.number || index + 1}</span>
      <h2 style="margin-top: 8px;">${ud.id}: ${cleanSigreLatexMath(ud.title)}</h2>
    </div>
    `;
    if (ud.data?.modulo1?.autoevaluacionHtml) {
      html += formatSigreDesarrolloHtml(ud.data.modulo1.autoevaluacionHtml);
    } else if (ud.data?.recursosDocente?.propuestaExamenHtml) {
      html += formatSigreDesarrolloHtml(ud.data.recursosDocente.propuestaExamenHtml);
      if (ud.data.recursosDocente.solucionarioExamenHtml) {
        html += `<div style="margin-top:20px; padding:12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px;">
          <h3>Solucionario y Justificación</h3>
          ${formatSigreDesarrolloHtml(ud.data.recursosDocente.solucionarioExamenHtml)}
        </div>`;
      }
    } else {
      html += `<p style="color:#64748b;">Cuestionario en proceso de generación.</p>`;
    }
  });

  html += `</body></html>`;
  return html;
}

/**
 * Builds HTML for 5. Programación y Evaluación Didáctica per single UD
 */
export function buildSingleUdProgramacionHtml(
  ud: SigreUDItem,
  config: SigreCurricularConfig
): string {
  const cleanTitle = cleanSigreLatexMath(ud.title || `Unidad ${ud.number}`);
  const p = ud.data?.programacionEval;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Programación y Evaluación - ${ud.id} ${cleanTitle}</title>
  ${WORD_STYLES}
</head>
<body>
  <div style="border-bottom: 2.5px solid #003366; padding-bottom: 12px; margin-bottom: 20px;">
    <div style="font-size: 10pt; font-weight: bold; color: #7c3aed; text-transform: uppercase;">
      SIGRE v6.0 · PROGRAMACIÓN DE ACTIVIDADES, MATRIZ Y EVALUACIÓN DIDÁCTICA
    </div>
    <h1 style="font-size: 20pt; margin: 10px 0 4px 0; border: none; padding: 0;">${ud.id}: ${cleanTitle}</h1>
    <p style="font-size: 10pt; color: #475569; margin: 0;">
      Módulo: <strong>${config.moduloFormativo || "Módulo FP"}</strong> | Bloque: <strong>${ud.bcCode}</strong> | Horas: <strong>${ud.horasEstimadas || 16}h</strong>
    </p>
  </div>

  <h2>1. VINCULACIÓN CURRICULAR Y RESULTADOS DE APRENDIZAJE</h2>
  ${p?.vinculacionCurricularHtml ? formatSigreDesarrolloHtml(p.vinculacionCurricularHtml) : "<p>Pendiente de definición.</p>"}

  <h2>2. MATRIZ DE ALINEACIÓN CURRICULAR Y PONDERACIÓN</h2>
  ${p?.matrizAlineacionHtml ? formatSigreDesarrolloHtml(p.matrizAlineacionHtml) : "<p>Pendiente de definición.</p>"}

  <h2>3. ACTIVIDADES DE ENSEÑANZA-APRENDIZAJE Y RECURSOS</h2>
  ${p?.tablaActividadesHtml ? formatSigreDesarrolloHtml(p.tablaActividadesHtml) : "<p>Pendiente de definición.</p>"}
</body>
</html>`;
}

/**
 * Builds HTML for 7. Cronograma Visual (4 Niveles)
 */
export function build4LevelTimelineHtml(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";
  const totalHoras = config.horasTotales || 160;
  const horasSemanales = config.horasSemanales || 5;
  const semanasCurso = config.semanasCurso || 32;

  // Group by block
  const blocksMap = new Map<string, { code: string; uds: SigreUDItem[]; totalHoras: number }>();
  uds.forEach((u) => {
    const bCode = u.bcCode || "BC1";
    if (!blocksMap.has(bCode)) {
      blocksMap.set(bCode, { code: bCode, uds: [], totalHoras: 0 });
    }
    const b = blocksMap.get(bCode)!;
    b.uds.push(u);
    b.totalHoras += u.horasEstimadas || Math.round(totalHoras / Math.max(1, uds.length));
  });
  const blocksList = Array.from(blocksMap.values());

  // Trimesters breakdown
  const t1Uds = uds.filter((u) => (u.trimestre || 1) === 1);
  const t2Uds = uds.filter((u) => u.trimestre === 2);
  const t3Uds = uds.filter((u) => u.trimestre === 3);

  const t1Hours = t1Uds.reduce((acc, u) => acc + (u.horasEstimadas || 16), 0);
  const t2Hours = t2Uds.reduce((acc, u) => acc + (u.horasEstimadas || 16), 0);
  const t3Hours = t3Uds.reduce((acc, u) => acc + (u.horasEstimadas || 16), 0);

  // Weeks generation (1 to semanasCurso)
  let accumulatedHours = 0;
  let currentUdIndex = 0;

  const weeksTableRows = Array.from({ length: Math.min(semanasCurso, 36) }).map((_, wIdx) => {
    const weekNum = wIdx + 1;
    accumulatedHours += horasSemanales;

    // Estimate current active UD for this week
    let runningHours = 0;
    let activeUd: SigreUDItem | undefined = uds[0];
    for (const u of uds) {
      const uHours = u.horasEstimadas || Math.round(totalHoras / Math.max(1, uds.length));
      runningHours += uHours;
      if (accumulatedHours <= runningHours) {
        activeUd = u;
        break;
      }
    }
    if (!activeUd) {
      activeUd = uds[uds.length - 1] || {
        id: "UD01",
        number: 1,
        title: "Unidad Didáctica",
        bcCode: "BC1",
        fullCode: "UD01",
        isPrl: false,
        status: "pending" as const,
      };
    }

    const trim = weekNum <= 11 ? 1 : weekNum <= 22 ? 2 : 3;
    const isExamWeek = weekNum === 11 || weekNum === 22 || weekNum === semanasCurso;
    const theoryHours = Math.round(horasSemanales * 0.45);
    const labHours = horasSemanales - theoryHours;

    return `
      <tr style="${isExamWeek ? "background-color: #fef3c7; font-weight: bold;" : wIdx % 2 === 0 ? "background-color: #ffffff;" : "background-color: #f8fafc;"}">
        <td style="text-align: center; font-weight: 800; color: #003366;">S${String(weekNum).padStart(2, "0")}</td>
        <td style="text-align: center;"><span style="background: ${trim === 1 ? "#dbeafe" : trim === 2 ? "#dcfce7" : "#fef3c7"}; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${trim}º Trim.</span></td>
        <td style="font-weight: 700; color: #0f172a;">${activeUd.id}: ${cleanSigreLatexMath(activeUd.title)}</td>
        <td style="text-align: center; color: #475569;">${activeUd.bcCode || "BC1"}</td>
        <td style="text-align: center; color: #0369a1;">${theoryHours}h Aula</td>
        <td style="text-align: center; color: #059669;">${labHours}h Taller</td>
        <td style="text-align: center; font-weight: bold;">${horasSemanales}h</td>
        <td style="font-size: 11.5px; color: ${isExamWeek ? "#b45309" : "#64748b"};">
          ${isExamWeek ? "★ Evaluación Trimestral & Entrega Prácticas" : "Sesiones lectivas, prácticas de taller y seguimiento continuo"}
        </td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cronograma Visual 4 Niveles - ${modTitle} (${modCode})</title>
  <style>
    @page { size: A4 landscape; margin: 1.5cm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    h1 { color: #f59e0b; margin: 0 0 6px 0; font-size: 24px; }
    h2 { color: #38bdf8; font-size: 16px; border-bottom: 2px solid #334155; padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .stat-pill { background: #334155; padding: 12px 16px; border-radius: 10px; border-left: 4px solid #f59e0b; }
    .stat-val { font-size: 20px; font-weight: 800; color: #f8fafc; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
    .bar-container { background: #334155; border-radius: 8px; height: 18px; overflow: hidden; margin-top: 6px; display: flex; }
    .bar-segment { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; background: #ffffff; color: #0f172a; border-radius: 8px; overflow: hidden; }
    th { background: #003366; color: #ffffff; padding: 10px 12px; text-align: left; font-weight: 800; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .milestone-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px; border-radius: 8px; background: #0f172a; border: 1px solid #334155; margin-bottom: 8px; }
    .milestone-badge { background: #d97706; color: #000; font-weight: 900; font-size: 11px; padding: 4px 8px; border-radius: 6px; shrink: 0; }
    @media print {
      body { background: #ffffff; color: #000000; padding: 0; }
      .container { background: #ffffff; border: none; box-shadow: none; padding: 0; }
      h1, h2 { color: #003366; }
      .stat-pill { background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #003366; color: #000; }
      .stat-val { color: #000; }
      .card, .milestone-item { background: #f8fafc; border: 1px solid #cbd5e1; color: #000; }
      .milestone-item p { color: #334155; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
      <div>
        <div style="font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px;">
          SIGRE v6.0 · PLANIFICACIÓN TEMPORAL Y CRONOGRAMA OFICIAL
        </div>
        <h1>CRONOGRAMA VISUAL EN 4 NIVELES DE PROFUNDIDAD</h1>
        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">
          Módulo: <strong>${modTitle}</strong> (Cód. ${modCode}) | Ciclo: <strong>${config.cicloFormativo || "FP"}</strong>
        </p>
      </div>
      <div style="text-align: right;">
        <span style="background: #f59e0b; color: #000; font-weight: 900; padding: 6px 12px; border-radius: 8px; font-size: 12px;">
          ${uds.length} Unidades Didácticas
        </span>
      </div>
    </div>

    <!-- Indicadores Generales -->
    <div class="grid-3" style="margin-top: 24px;">
      <div class="stat-pill">
        <div class="stat-val">${totalHoras} h</div>
        <div class="stat-lbl">Duración Lectiva Total</div>
      </div>
      <div class="stat-pill">
        <div class="stat-val">${horasSemanales} h/sem</div>
        <div class="stat-lbl">Carga Semanal Media</div>
      </div>
      <div class="stat-pill">
        <div class="stat-val">${semanasCurso} Semanas</div>
        <div class="stat-lbl">Marco Temporal Anual</div>
      </div>
      <div class="stat-pill">
        <div class="stat-val">${blocksList.length} Bloques</div>
        <div class="stat-lbl">Bloques Curriculares</div>
      </div>
    </div>

    <!-- NIVEL 1: MACROCRONOGRAMA ANUAL / TRIMESTRAL POR BLOQUES -->
    <h2>📊 NIVEL 1: Macrocronograma Anual y Distribución por Trimestres</h2>
    <div class="card">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border-left: 3px solid #38bdf8;">
          <strong style="color: #38bdf8;">1º Trimestre (S1 - S11)</strong>
          <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${t1Hours} horas</div>
          <div style="font-size: 11.5px; color: #94a3b8;">${t1Uds.map((u) => u.id).join(", ") || "UDs iniciales"}</div>
        </div>
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border-left: 3px solid #4ade80;">
          <strong style="color: #4ade80;">2º Trimestre (S12 - S22)</strong>
          <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${t2Hours} horas</div>
          <div style="font-size: 11.5px; color: #94a3b8;">${t2Uds.map((u) => u.id).join(", ") || "UDs intermedias"}</div>
        </div>
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border-left: 3px solid #fbbf24;">
          <strong style="color: #fbbf24;">3º Trimestre (S23 - S${semanasCurso})</strong>
          <div style="font-size: 18px; font-weight: bold; margin-top: 4px;">${t3Hours} horas</div>
          <div style="font-size: 11.5px; color: #94a3b8;">${t3Uds.map((u) => u.id).join(", ") || "UDs finales"}</div>
        </div>
      </div>

      <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #cbd5e1;">Ponderación por Bloques Curriculares:</div>
      <div class="bar-container">
        ${blocksList.map((b, idx) => {
          const pct = Math.round((b.totalHoras / Math.max(1, totalHoras)) * 100);
          const colors = ["#f59e0b", "#38bdf8", "#4ade80", "#a855f7", "#ec4899", "#14b8a6"];
          return `<div class="bar-segment" style="width: ${pct}%; background: ${colors[idx % colors.length]};" title="${b.code}: ${b.totalHoras}h (${pct}%)">${b.code} (${pct}%)</div>`;
        }).join("")}
      </div>
    </div>

    <!-- NIVEL 2: CRONOGRAMA MES A MES DE UNIDADES DIDÁCTICAS -->
    <h2>📅 NIVEL 2: Cronograma Mes a Mes de Unidades Didácticas (Sesiones y Horas)</h2>
    <div class="card" style="overflow-x: auto;">
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">UD Cód.</th>
            <th style="width: 35%;">Título de la Unidad Didáctica</th>
            <th style="width: 10%;">Bloque</th>
            <th style="width: 10%;">Horas</th>
            <th style="width: 10%;">Sesiones</th>
            <th style="width: 10%;">Trimestre</th>
            <th style="width: 15%;">Secuencia Semanas</th>
          </tr>
        </thead>
        <tbody>
          ${uds.map((u, i) => {
            const uHours = u.horasEstimadas || Math.round(totalHoras / Math.max(1, uds.length));
            const sesiones = Math.round(uHours / (horasSemanales / 5 || 1));
            return `
              <tr style="${i % 2 === 0 ? "background: #ffffff;" : "background: #f8fafc;"}">
                <td style="font-weight: 800; color: #003366; text-align: center;">${u.id}</td>
                <td><strong>${cleanSigreLatexMath(u.title)}</strong></td>
                <td style="text-align: center; font-family: monospace;">${u.bcCode || "BC1"}</td>
                <td style="text-align: center; font-weight: bold;">${uHours}h</td>
                <td style="text-align: center;">${sesiones} ses.</td>
                <td style="text-align: center;">${u.trimestre || 1}º Trim.</td>
                <td style="text-align: center; font-size: 11px; color: #0369a1; font-weight: bold;">Semanas ${Math.max(1, Math.round((i * semanasCurso) / Math.max(1, uds.length)))} a ${Math.min(semanasCurso, Math.round(((i + 1) * semanasCurso) / Math.max(1, uds.length)))}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>

    <!-- NIVEL 3: SECUENCIA SEMANAL DE SESIONES DE AULA Y TALLER -->
    <h2>🗓️ NIVEL 3: Secuencia Semanal de Sesiones de Aula y Taller (Semanas 1 a ${semanasCurso})</h2>
    <div class="card" style="overflow-x: auto;">
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Sem.</th>
            <th style="width: 10%;">Trimestre</th>
            <th style="width: 32%;">Unidad Didáctica Asociada</th>
            <th style="width: 8%;">Bloque</th>
            <th style="width: 12%;">Horas Aula</th>
            <th style="width: 12%;">Horas Taller</th>
            <th style="width: 8%;">Total</th>
            <th style="width: 20%;">Seguimiento Pedagógico</th>
          </tr>
        </thead>
        <tbody>
          ${weeksTableRows}
        </tbody>
      </table>
    </div>

    <!-- NIVEL 4: MATRIZ DE HITOS DE EVALUACIÓN Y ENTREGAS -->
    <h2>🎯 NIVEL 4: Matriz de Hitos de Evaluación, Exámenes, Prácticas y Entregas</h2>
    <div class="card">
      <div class="milestone-item">
        <span class="milestone-badge" style="background: #38bdf8;">SEMANA 01 - 02</span>
        <div>
          <strong style="color: #f8fafc;">Evaluación Diagnóstica Inicial y Nivelación Técnica</strong>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">
            Cuestionario de conocimientos previos, mapa de competencias y presentación de la metodología ABP / DUA.
          </p>
        </div>
      </div>

      <div class="milestone-item">
        <span class="milestone-badge" style="background: #f59e0b;">SEMANA 10 - 11</span>
        <div>
          <strong style="color: #f8fafc;">Hito 1ª Evaluación Parcial · Bloques Iniciales</strong>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">
            Examen tipo test Moodle GIFT, entrega del Proyecto Didáctico de Taller y revisión de rúbricas de competencias.
          </p>
        </div>
      </div>

      <div class="milestone-item">
        <span class="milestone-badge" style="background: #4ade80;">SEMANA 21 - 22</span>
        <div>
          <strong style="color: #f8fafc;">Hito 2ª Evaluación Parcial · Bloques Intermedios</strong>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">
            Prueba teórica-práctica, validación en simuladores interactivos HDI y evaluación formativa por rúbricas.
          </p>
        </div>
      </div>

      <div class="milestone-item">
        <span class="milestone-badge" style="background: #ec4899;">SEMANA ${semanasCurso - 1} - ${semanasCurso}</span>
        <div>
          <strong style="color: #f8fafc;">Evaluación Final Ordinaria y Cierre de Proyecto</strong>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">
            Evaluación global de Resultados de Aprendizaje, cálculo de notas con matriz ponderada 7.1 y convocatoria extraordinaria de recuperación.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds JSON data for 7. Cronograma Visual (4 Niveles)
 */
export function build4LevelTimelineJson(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const payload = {
    metadata: {
      sistema: "SIGRE v6.0",
      tipo: "Cronograma_Visual_4_Niveles",
      modulo: config.moduloFormativo || "Módulo FP",
      codigo: config.codigo || "0000",
      ciclo: config.cicloFormativo || "FP",
      horasTotales: config.horasTotales || 160,
      semanasCurso: config.semanasCurso || 32,
      horasSemanales: config.horasSemanales || 5,
      fechaGeneracion: new Date().toISOString(),
    },
    nivel1_macrocronograma: {
      trimestres: [
        { trimestre: 1, semanas: "S1-S11", horas: uds.filter(u => (u.trimestre || 1) === 1).reduce((a, b) => a + (b.horasEstimadas || 16), 0) },
        { trimestre: 2, semanas: "S12-S22", horas: uds.filter(u => u.trimestre === 2).reduce((a, b) => a + (b.horasEstimadas || 16), 0) },
        { trimestre: 3, semanas: `S23-S${config.semanasCurso || 32}`, horas: uds.filter(u => u.trimestre === 3).reduce((a, b) => a + (b.horasEstimadas || 16), 0) },
      ],
      bloquesCurriculares: Array.from(new Set(uds.map(u => u.bcCode || "BC1"))).map(code => ({
        codigo: code,
        uds: uds.filter(u => (u.bcCode || "BC1") === code).map(u => u.id),
      })),
    },
    nivel2_unidades_mes_a_mes: uds.map((u, i) => ({
      id: u.id,
      titulo: u.title,
      bloque: u.bcCode || "BC1",
      horas: u.horasEstimadas || 16,
      trimestre: u.trimestre || 1,
      ordenSecuencia: i + 1,
    })),
    nivel3_secuencia_semanal: Array.from({ length: config.semanasCurso || 32 }).map((_, i) => ({
      semana: i + 1,
      trimestre: i + 1 <= 11 ? 1 : i + 1 <= 22 ? 2 : 3,
      horasAula: Math.round((config.horasSemanales || 5) * 0.45),
      horasTaller: (config.horasSemanales || 5) - Math.round((config.horasSemanales || 5) * 0.45),
    })),
    nivel4_hitos_evaluacion: [
      { hito: "Evaluación Inicial", semana: 1, tipo: "Diagnóstica" },
      { hito: "1ª Evaluación Parcial", semana: 11, tipo: "Formativa / Sumativa" },
      { hito: "2ª Evaluación Parcial", semana: 22, tipo: "Formativa / Sumativa" },
      { hito: "Evaluación Final Ordinaria", semana: config.semanasCurso || 32, tipo: "Sumativa Oficial" },
    ],
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Builds Markdown document for 7. Cronograma Visual (4 Niveles)
 */
export function build4LevelTimelineMd(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";

  let md = `# Cronograma Visual en 4 Niveles - ${modTitle} (${modCode})\n\n`;
  md += `**Ciclo:** ${config.cicloFormativo || "FP"} | **Duración:** ${config.horasTotales || 160} horas | **Semanas:** ${config.semanasCurso || 32}\n\n`;

  md += `## Nivel 1: Macrocronograma Anual y Trimestral\n\n`;
  md += `- **1º Trimestre (S1 - S11):** ${uds.filter(u => (u.trimestre || 1) === 1).map(u => u.id).join(", ")}\n`;
  md += `- **2º Trimestre (S12 - S22):** ${uds.filter(u => u.trimestre === 2).map(u => u.id).join(", ")}\n`;
  md += `- **3º Trimestre (S23 - S${config.semanasCurso || 32}):** ${uds.filter(u => u.trimestre === 3).map(u => u.id).join(", ")}\n\n`;

  md += `## Nivel 2: Cronograma Mes a Mes de Unidades Didácticas\n\n`;
  md += `| UD | Título | Bloque | Horas | Trimestre |\n|---|---|---|---|---|\n`;
  uds.forEach(u => {
    md += `| **${u.id}** | ${u.title} | ${u.bcCode || "BC1"} | ${u.horasEstimadas || 16}h | ${u.trimestre || 1}º |\n`;
  });

  md += `\n## Nivel 3: Secuencia Semanal\n\n`;
  md += `Carga lectiva semanal media: ${config.horasSemanales || 5} horas (${Math.round((config.horasSemanales || 5) * 0.45)}h Aula Teórica / ${(config.horasSemanales || 5) - Math.round((config.horasSemanales || 5) * 0.45)}h Taller Práctico).\n\n`;

  md += `## Nivel 4: Matriz de Hitos de Evaluación\n\n`;
  md += `1. **Semana 01:** Evaluación Diagnóstica Inicial.\n`;
  md += `2. **Semana 11:** Cierre y Calificación 1ª Evaluación Parcial.\n`;
  md += `3. **Semana 22:** Cierre y Calificación 2ª Evaluación Parcial.\n`;
  md += `4. **Semana ${config.semanasCurso || 32}:** Evaluación Final Ordinaria y Actas Oficiales.\n`;

  return md;
}

/**
 * Builds standalone HTML visual viewer for Mermaid diagrams
 */
export function buildMermaidViewerHtml(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  const modCode = config.codigo || "0000";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Diagramas de Flujo Mermaid - ${modTitle}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'neutral' });</script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .container { max-width: 1000px; margin: 0 auto; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    h1 { color: #f59e0b; font-size: 22px; }
    h2 { color: #38bdf8; font-size: 16px; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 6px; }
    .mermaid { background: #ffffff; padding: 16px; border-radius: 8px; overflow-x: auto; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Diagramas de Flujo Didácticos y Secuenciación (Mermaid)</h1>
    <p style="color: #94a3b8;">Módulo: <strong>${modTitle}</strong> (Cód. ${modCode})</p>
    ${uds
      .map((u) => {
        const mmd = u.data?.modulo1?.diagramaMermaid || `graph TD\nA[${u.id}: ${u.title}] --> B[Fundamentos]\nB --> C[Práctica Técnica]\nC --> D[Evaluación]`;
        return `
      <div class="card">
        <h2>${u.id}: ${cleanSigreLatexMath(u.title)}</h2>
        <div class="mermaid">
          ${mmd}
        </div>
      </div>
    `;
      })
      .join("")}
  </div>
</body>
</html>`;
}

/**
 * Generates and downloads the Master Consolidated Word .docx document for all UDs
 */
export async function exportMasterConsolidatedDocx(
  uds: SigreUDItem[],
  config: SigreCurricularConfig
): Promise<boolean> {
  const fullHtml = buildMasterConsolidatedHtml(uds, config);
  const cleanModName = (config.moduloFormativo || "Modulo_FP").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `SIGRE_Programacion_Completa_${cleanModName}_${uds.length}UDs.docx`;

  try {
    const docxBlob = await asBlob(fullHtml, { orientation: "portrait" });
    const url = URL.createObjectURL(docxBlob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.warn("Fallo exportando docx directo, usando fallback .doc:", err);
    downloadBlob(fileName.replace(/\.docx$/i, ".doc"), fullHtml, "application/msword;charset=utf-8");
    return false;
  }
}

/**
 * Builds a Master Consolidated Moodle GIFT file combining all questions from all completed UDs
 */
export function buildMasterConsolidatedGift(uds: SigreUDItem[], config: SigreCurricularConfig): string {
  const header = `// ===================================================================
// BANCO MAESTRO DE PREGUNTAS MOODLE GIFT (SIGRE v6.0)
// Módulo: ${config.moduloFormativo || "Módulo Formativo"} (Cód. ${config.codigo || "0000"})
// Ciclo Formativo: ${config.cicloFormativo || "FP"}
// Fecha Exportación: ${new Date().toISOString()}
// Total Unidades Didácticas: ${uds.length}
// ===================================================================

`;

  let body = "";

  uds.forEach((ud) => {
    const categoryName = `$CATEGORY: $course$/${ud.id} - ${ud.title.replace(/\//g, "-")}\n\n`;
    let udGift = "";

    if (ud.data?.recursosDocente?.giftFullText) {
      udGift = ud.data.recursosDocente.giftFullText.trim();
    } else if (ud.data?.recursosDocente?.bancoGiftParte1 || ud.data?.recursosDocente?.bancoGiftParte2) {
      udGift = `${ud.data.recursosDocente.bancoGiftParte1 || ""}\n\n${ud.data.recursosDocente.bancoGiftParte2 || ""}`.trim();
    }

    if (udGift) {
      body += categoryName + udGift + "\n\n// -------------------------------------------------------------------\n\n";
    }
  });

  return header + body;
}

/**
 * Builds a Master Consolidated Moodle XML Rubrics file combining all rubrics from all completed UDs
 */
export function buildMasterConsolidatedRubricsXml(uds: SigreUDItem[], config: SigreCurricularConfig): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rubricas_evaluacion_sigre modulo="${cleanSigreLatexMath(config.moduloFormativo || "")}" codigo="${config.codigo || ""}">
  <metadata>
    <sistema>SIGRE v6.0 - Sistema Inteligente de Gestión de Recursos Educativos</sistema>
    <fecha_exportacion>${new Date().toISOString()}</fecha_exportacion>
    <ciclo>${cleanSigreLatexMath(config.cicloFormativo || "")}</ciclo>
    <total_unidades>${uds.length}</total_unidades>
  </metadata>
  <unidades_didacticas>
`;

  uds.forEach((ud) => {
    xml += `    <unidad id="${ud.id}" codigo_bloque="${ud.bcCode}" titulo="${cleanSigreLatexMath(ud.title)}">\n`;

    if (ud.data?.programacionEval?.rubricasXml) {
      const cleanRubric = ud.data.programacionEval.rubricasXml
        .replace(/<\?xml[^>]*\?>/gi, "")
        .trim();
      xml += `      <rubrica_moodle>\n        ${cleanRubric}\n      </rubrica_moodle>\n`;
    }

    if (ud.data?.udCurricular?.criteriosEvaluacionPonderados) {
      xml += `      <criterios_ponderados ra="${cleanSigreLatexMath(ud.data.udCurricular.criteriosEvaluacionPonderados.raGlobal || "")}">\n`;
      (ud.data.udCurricular.criteriosEvaluacionPonderados.criterios || []).forEach((c) => {
        xml += `        <criterio codigo="${cleanSigreLatexMath(c.criterio)}" peso="${cleanSigreLatexMath(c.peso)}">\n`;
        xml += `          <descripcion>${cleanSigreLatexMath(c.descripcion)}</descripcion>\n`;
        xml += `        </criterio>\n`;
      });
      xml += `      </criterios_ponderados>\n`;
    }

    xml += `    </unidad>\n`;
  });

  xml += `  </unidades_didacticas>
</rubricas_evaluacion_sigre>`;

  return xml;
}

/**
 * Builds a Master Consolidated OPML Mindmap file combining all UDs
 */
export function buildMasterConsolidatedOpml(uds: SigreUDItem[], config: SigreCurricularConfig): string {
  const modTitle = config.moduloFormativo || "Módulo Formativo";
  let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Mapa Mental Completo - ${modTitle}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>Docente SIGRE v6.0</ownerName>
  </head>
  <body>
    <outline text="${modTitle} (Cód. ${config.codigo || '0000'})">
`;

  uds.forEach((ud) => {
    opml += `      <outline text="${ud.id}: ${ud.title.replace(/"/g, '&quot;')}" _note="Bloque ${ud.bcCode} - ${ud.horasEstimadas || 16} horas">\n`;

    if (ud.data?.modulo1) {
      const m1 = ud.data.modulo1;
      opml += `        <outline text="1. Fundamentos y Objetivos">\n`;
      (m1.objetivosSmart || []).forEach((obj) => {
        opml += `          <outline text="🎯 ${obj.replace(/"/g, '&quot;')}" />\n`;
      });
      opml += `        </outline>\n`;

      opml += `        <outline text="2. Saberes y Contenidos">\n`;
      opml += `          <outline text="📘 Conceptuales">\n`;
      (m1.contenidos.conceptuales || []).forEach((c) => {
        opml += `            <outline text="${c.replace(/"/g, '&quot;')}" />\n`;
      });
      opml += `          </outline>\n`;
      opml += `          <outline text="🛠️ Procedimentales">\n`;
      (m1.contenidos.procedimentales || []).forEach((c) => {
        opml += `            <outline text="${c.replace(/"/g, '&quot;')}" />\n`;
      });
      opml += `          </outline>\n`;
      opml += `          <outline text="🤝 Actitudinales">\n`;
      (m1.contenidos.actitudinales || []).forEach((c) => {
        opml += `            <outline text="${c.replace(/"/g, '&quot;')}" />\n`;
      });
      opml += `          </outline>\n`;
      opml += `        </outline>\n`;
    }

    if (ud.data?.udCurricular?.resultadosAprendizaje) {
      opml += `        <outline text="3. Resultados de Aprendizaje">\n`;
      ud.data.udCurricular.resultadosAprendizaje.forEach((ra) => {
        opml += `          <outline text="📌 ${ra.replace(/"/g, '&quot;')}" />\n`;
      });
      opml += `        </outline>\n`;
    }

    if (ud.data?.hdi?.nombreApp) {
      opml += `        <outline text="4. Micro-App Interactiva (HDI)">\n`;
      opml += `          <outline text="💻 ${ud.data.hdi.nombreApp.replace(/"/g, '&quot;')}" />\n`;
      opml += `        </outline>\n`;
    }

    opml += `      </outline>\n`;
  });

  opml += `    </outline>
  </body>
</opml>`;

  return opml;
}

/**
 * Builds a Master Full Project JSON backup file
 */
export function buildMasterProjectJson(
  uds: SigreUDItem[],
  config: SigreCurricularConfig,
  extraData?: Record<string, any>
): string {
  const masterPackage = {
    metadata: {
      sistema: "SIGRE V6.0 - Sistema Inteligente de Gestión de Recursos Educativos",
      tipo: "Proyecto_Completo_Modulo_FP",
      version: "6.0",
      fechaExportacion: new Date().toISOString(),
      totalUnidadesDidacticas: uds.length,
      unidadesCompletadas: uds.filter((u) => u.status === "completed" || u.data).length,
      moduloCodigo: config.codigo || "0238",
      moduloFormativo: config.moduloFormativo || "Módulo Formativo",
      cicloFormativo: config.cicloFormativo || "Ciclo Formativo FP",
      familiaProfesional: config.familiaProfesional || "Familia Profesional",
      horasTotales: config.horasTotales || 160,
      horasSemanales: config.horasSemanales || 5,
      semanasCurso: config.semanasCurso || 32,
      totalSesionesPrevistas: config.totalSesionesPrevistas || 160,
    },
    configuracionCurricular: config,
    unidadesDidacticas: uds,
    datosComplementarios: extraData || {},
  };

  return JSON.stringify(masterPackage, null, 2);
}

export interface SigreZipExportOptions {
  includeEditorial?: boolean; // 1a. UD Editorial
  includeCurricular?: boolean; // 1b. UD Curricular (19 Puntos)
  includeAutoevaluacion?: boolean; // 2. Cuestionario de Autoevaluación
  includeMoodleGiftAndTests?: boolean; // 3. Banco Moodle GIFT & Tests
  includeOpmlAndDiagrams?: boolean; // 4. Diagrama & Mapa Mental (OPML)
  includeProgramacionRubricas?: boolean; // 5. Programación & Rúbricas XML
  includeHdiApps?: boolean; // 6. Simulador HDI
  includeCronograma4Niveles?: boolean; // 7. Cronograma Visual (4 Niveles)
  includeMasterJson?: boolean;
  // Legacy flags for compatibility
  includeMasterDocx?: boolean;
  includeMasterHtml?: boolean;
  includeIndividualDocx?: boolean;
  includeIndividualHtml?: boolean;
  includeMoodleGift?: boolean;
  includeRubricsXml?: boolean;
  includeOpmlMindmaps?: boolean;
  includeMermaidDiagrams?: boolean;
  includeMatrix71?: boolean;
}

/**
 * Builds and downloads a full, organized ZIP archive containing ALL generated content
 * with the exact required 8-folder directory structure:
 * 1a. UD Editorial
 * 1b. UD Curricular (19 Puntos)
 * 2. Cuestionario de Autoevaluación
 * 3. Banco Moodle GIFT & Tests
 * 4. Diagrama & Mapa Mental (OPML)
 * 5. Programación & Rúbricas XML
 * 6. Simulador HDI
 * 7. Cronograma Visual (4 Niveles)
 */
export async function generateSigreCompleteZip(
  uds: SigreUDItem[],
  config: SigreCurricularConfig,
  options: SigreZipExportOptions = {},
  onProgress?: (msg: string, percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const cleanModName = (config.moduloFormativo || "Modulo_FP").replace(/[^a-zA-Z0-9_-]/g, "_");
  const modCode = config.codigo || "0000";

  onProgress?.("Iniciando empaquetado del módulo...", 4);

  // 00. Readme / Executive Summary
  const summaryText = `========================================================================
SISTEMA INTELIGENTE DE GESTIÓN DE RECURSOS EDUCATIVOS (SIGRE v6.0)
DOSSIER COMPLETO DE CONTENIDOS Y RECURSOS DIDÁCTICOS (LO 3/2022 · RD 659/2023)
========================================================================

MÓDULO FORMATIVO: ${config.moduloFormativo || "Módulo Formativo"} (Cód. ${modCode})
CICLO FORMATIVO: ${config.cicloFormativo || "Ciclo Formativo FP"}
FAMILIA PROFESIONAL: ${config.familiaProfesional || "Familia Profesional"}
CURSO / DURACIÓN: ${config.curso || "1º curso"} | ${config.horasTotales || 160} horas lectivas
FECHA DE EXPORTACIÓN: ${new Date().toLocaleString("es-ES")}

TOTAL UNIDADES DIDÁCTICAS: ${uds.length}
UNIDADES DESARROLLADAS COMPLETAS: ${uds.filter((u) => u.data).length}

========================================================================
ESTRUCTURA DE CARPETAS Y CONTENIDOS DEL PAQUETE:
========================================================================
1a. UD Editorial/
   - Dossier editorial consolidado con todas las UDs en Word (.docx) y HTML.
   - Tratados técnicos y memorias de aula individuales por unidad en Word (.docx) y HTML.

1b. UD Curricular (19 Puntos)/
   - Fichas curriculares oficiales de 19 puntos LOMLOE / FP Dual en Word (.docx) y HTML.
   - Dossier curricular consolidado del módulo completo.
   - Matriz Curricular Oficial Tabla 7.1 (RA × Criterios × Ponderaciones).

2. Cuestionario de Autoevaluación/
   - Cuestionarios de autoevaluación formativa (20 preguntas) por unidad en Word y HTML.
   - Banco de autoevaluaciones consolidado del módulo completo con retroalimentación didáctica.

3. Banco Moodle GIFT & Tests/
   - Banco consolidado Moodle GIFT con todas las preguntas categorizadas.
   - Archivos GIFT individuales por unidad para importación directa en el aula virtual.
   - Propuestas de examen tipo test y solucionarios técnicos razonados (Word / HTML).

4. Diagrama & Mapa Mental (OPML)/
   - Mapa mental consolidado del módulo en formato OPML (XMind, MindNode, FreeMind).
   - Mapas mentales OPML individuales por unidad.
   - Diagramas de flujo en sintaxis Mermaid (.mmd y Markdown) y visor web interactivo.

5. Programación & Rúbricas XML/
   - Programación didáctica completa oficial del módulo en Word (.docx) y HTML.
   - Rúbricas Moodle XML consolidadas e individuales por unidad para evaluación por competencias.
   - Tablas de actividades de enseñanza-aprendizaje y matrices de alineación curricular.

6. Simulador HDI/
   - Micro-aplicaciones didácticas interactivas autónomas en HTML5 listas para navegador.
   - Especificaciones técnicas PRD (Product Requirements Document) en Markdown.
   - Catálogo web interactivo de simuladores (index_catalogo_simuladores.html).

7. Cronograma Visual (4 Niveles)/
   - Cronograma cuatrinivel interactivo e imprimible en HTML y documento Word.
   - Desglose de los 4 niveles:
     * Nivel 1: Macrocronograma Anual / Trimestral por Bloques Curriculares.
     * Nivel 2: Cronograma Mes a Mes de Unidades Didácticas (Sesiones y Horas).
     * Nivel 3: Secuencia Semanal de Sesiones de Aula y Taller (Semanas 1 a 32/36).
     * Nivel 4: Matriz de Hitos de Evaluación, Exámenes, Prácticas y Entregas.
   - Datos estructurados del cronograma en JSON y Markdown.

RAÍZ:
   - Copia_Seguridad_SIGRE_${cleanModName}_${uds.length}UDs.json (Respaldo maestro restaurable).
   - 00_LEEME_ESTRUCTURA_SIGRE.txt

========================================================================
Generado automáticamente por SIGRE v6.0 · Conforme a RD 659/2023
`;
  zip.file("00_LEEME_ESTRUCTURA_SIGRE.txt", summaryText);

  // ========================================================================
  // 1a. UD Editorial
  // ========================================================================
  if (options.includeEditorial !== false) {
    onProgress?.("Generando 1a. UD Editorial (Word y HTML)...", 12);
    const folder1a = zip.folder("1a. UD Editorial");
    if (folder1a) {
      // Consolidated
      const consolidatedEditorialHtml = buildConsolidatedEditorialHtml(uds, config);
      folder1a.file(`Dossier_Editorial_Consolidado_${cleanModName}.html`, consolidatedEditorialHtml);
      try {
        const docxBlob = await asBlob(consolidatedEditorialHtml, { orientation: "portrait" });
        folder1a.file(`Dossier_Editorial_Consolidado_${cleanModName}.docx`, docxBlob as Blob);
      } catch {
        folder1a.file(`Dossier_Editorial_Consolidado_${cleanModName}.doc`, consolidatedEditorialHtml);
      }

      // Individual UDs
      for (const ud of uds) {
        if (!ud.data) continue;
        const cleanTitle = (ud.title || `Unidad_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");
        const singleHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${ud.id} - ${cleanSigreLatexMath(ud.title)}</title>
  ${WORD_STYLES}
</head>
<body>
  ${renderSigreUDCompleteA4Html(ud, ud.data)}
</body>
</html>`;
        folder1a.file(`${ud.id}_Editorial_${cleanTitle}.html`, singleHtml);
        try {
          const docxBlob = await asBlob(singleHtml, { orientation: "portrait" });
          folder1a.file(`${ud.id}_Editorial_${cleanTitle}.docx`, docxBlob as Blob);
        } catch {
          folder1a.file(`${ud.id}_Editorial_${cleanTitle}.doc`, singleHtml);
        }
      }
    }
  }

  // ========================================================================
  // 1b. UD Curricular (19 Puntos)
  // ========================================================================
  if (options.includeCurricular !== false) {
    onProgress?.("Generando 1b. UD Curricular 19 Puntos (Word y HTML)...", 26);
    const folder1b = zip.folder("1b. UD Curricular (19 Puntos)");
    if (folder1b) {
      // Consolidated Curricular
      const consolidatedCurricularHtml = buildConsolidatedCurricularHtml(uds, config);
      folder1b.file(`Dossier_Curricular_19Puntos_Consolidado_${cleanModName}.html`, consolidatedCurricularHtml);
      try {
        const docxBlob = await asBlob(consolidatedCurricularHtml, { orientation: "portrait" });
        folder1b.file(`Dossier_Curricular_19Puntos_Consolidado_${cleanModName}.docx`, docxBlob as Blob);
      } catch {
        folder1b.file(`Dossier_Curricular_19Puntos_Consolidado_${cleanModName}.doc`, consolidatedCurricularHtml);
      }

      // Matrix 7.1
      const matrixHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Matriz Curricular Oficial Tabla 7.1 - ${config.moduloFormativo}</title>
  ${WORD_STYLES}
</head>
<body>
  <h1>MATRIZ CURRICULAR OFICIAL (TABLA 7.1)</h1>
  <h2>Relación de Resultados de Aprendizaje, Criterios de Evaluación y Unidades Didácticas</h2>
  <p><strong>Módulo:</strong> ${config.moduloFormativo} (Cód. ${modCode}) | <strong>Ciclo:</strong> ${config.cicloFormativo}</p>
  <table>
    <thead>
      <tr>
        <th>Fase / UD</th>
        <th>Bloque</th>
        <th>Resultados de Aprendizaje y Criterios</th>
        <th>CPPS</th>
        <th>OG</th>
        <th>Horas FFCE</th>
        <th>Ponderación %</th>
      </tr>
    </thead>
    <tbody>
      ${uds
        .map(
          (u) => `
        <tr>
          <td><strong>${u.id}</strong>: ${cleanSigreLatexMath(u.title)}</td>
          <td style="text-align: center;">${u.bcCode}</td>
          <td>${cleanSigreLatexMath(u.raCeText || "RA / Criterios asociados")}</td>
          <td style="text-align: center;">${u.cppsText || "-"}</td>
          <td style="text-align: center;">${u.ogText || "-"}</td>
          <td style="text-align: center;">${u.horasFfce || u.horasEstimadas || 16}h</td>
          <td style="text-align: center; font-weight: bold;">${u.pesoPorcentaje || Math.round(100 / Math.max(1, uds.length))}%</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
      folder1b.file(`Matriz_Curricular_Oficial_7_1_${cleanModName}.html`, matrixHtml);
      try {
        const matrixDocxBlob = await asBlob(matrixHtml, { orientation: "landscape" });
        folder1b.file(`Matriz_Curricular_Oficial_7_1_${cleanModName}.docx`, matrixDocxBlob as Blob);
      } catch {
        folder1b.file(`Matriz_Curricular_Oficial_7_1_${cleanModName}.doc`, matrixHtml);
      }

      // Individual Curricular UDs
      for (const ud of uds) {
        if (!ud.data?.udCurricular) continue;
        const cleanTitle = (ud.title || `Unidad_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");
        const singleCurricularHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${ud.id} Curricular - ${cleanSigreLatexMath(ud.title)}</title>
  ${WORD_STYLES}
</head>
<body>
  ${renderSigreUDCurricularA4Html(ud, ud.data.udCurricular, config)}
</body>
</html>`;
        folder1b.file(`${ud.id}_Curricular_19Puntos_${cleanTitle}.html`, singleCurricularHtml);
        try {
          const docxBlob = await asBlob(singleCurricularHtml, { orientation: "portrait" });
          folder1b.file(`${ud.id}_Curricular_19Puntos_${cleanTitle}.docx`, docxBlob as Blob);
        } catch {
          folder1b.file(`${ud.id}_Curricular_19Puntos_${cleanTitle}.doc`, singleCurricularHtml);
        }
      }
    }
  }

  // ========================================================================
  // 2. Cuestionario de Autoevaluación
  // ========================================================================
  if (options.includeAutoevaluacion !== false) {
    onProgress?.("Generando 2. Cuestionarios de Autoevaluación (20 Preguntas)...", 40);
    const folder2 = zip.folder("2. Cuestionario de Autoevaluación");
    if (folder2) {
      // Consolidated
      const consolidatedAutoevalHtml = buildConsolidatedAutoevaluacionHtml(uds, config);
      folder2.file(`Cuestionarios_Autoevaluacion_Consolidados_${cleanModName}.html`, consolidatedAutoevalHtml);
      try {
        const docxBlob = await asBlob(consolidatedAutoevalHtml, { orientation: "portrait" });
        folder2.file(`Cuestionarios_Autoevaluacion_Consolidados_${cleanModName}.docx`, docxBlob as Blob);
      } catch {
        folder2.file(`Cuestionarios_Autoevaluacion_Consolidados_${cleanModName}.doc`, consolidatedAutoevalHtml);
      }

      // Individual UDs
      for (const ud of uds) {
        const cleanTitle = (ud.title || `Unidad_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");
        const singleAutoevalHtml = buildSingleUdAutoevaluacionHtml(ud, config);
        folder2.file(`${ud.id}_Autoevaluacion_20Preguntas_${cleanTitle}.html`, singleAutoevalHtml);
        try {
          const docxBlob = await asBlob(singleAutoevalHtml, { orientation: "portrait" });
          folder2.file(`${ud.id}_Autoevaluacion_20Preguntas_${cleanTitle}.docx`, docxBlob as Blob);
        } catch {
          folder2.file(`${ud.id}_Autoevaluacion_20Preguntas_${cleanTitle}.doc`, singleAutoevalHtml);
        }
      }
    }
  }

  // ========================================================================
  // 3. Banco Moodle GIFT & Tests
  // ========================================================================
  if (options.includeMoodleGiftAndTests !== false && options.includeMoodleGift !== false) {
    onProgress?.("Generando 3. Banco Moodle GIFT & Tests...", 52);
    const folder3 = zip.folder("3. Banco Moodle GIFT & Tests");
    if (folder3) {
      // Master GIFT
      const masterGift = buildMasterConsolidatedGift(uds, config);
      folder3.file(`Banco_Moodle_GIFT_Consolidado_${cleanModName}_Completo.gift`, masterGift);

      // Individual GIFT and exams
      for (const ud of uds) {
        const cleanTitle = (ud.title || `Unidad_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");

        let giftContent = "";
        if (ud.data?.recursosDocente?.giftFullText) {
          giftContent = ud.data.recursosDocente.giftFullText;
        } else if (ud.data?.recursosDocente?.bancoGiftParte1 || ud.data?.recursosDocente?.bancoGiftParte2) {
          giftContent = `${ud.data.recursosDocente.bancoGiftParte1 || ""}\n\n${ud.data.recursosDocente.bancoGiftParte2 || ""}`;
        }
        if (giftContent) {
          folder3.file(`${ud.id}_Banco_Moodle_GIFT_${cleanTitle}.gift`, giftContent);
        }

        // Exam proposal
        if (ud.data?.recursosDocente?.propuestaExamenHtml) {
          const examHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Propuesta Examen Test - ${ud.id} ${cleanTitle}</title>
  ${WORD_STYLES}
</head>
<body>
  <h1>PROPUESTA DE EXAMEN TIPO TEST · ${ud.id}: ${cleanSigreLatexMath(ud.title)}</h1>
  <p><strong>Módulo:</strong> ${config.moduloFormativo} | <strong>Bloque:</strong> ${ud.bcCode}</p>
  ${formatSigreDesarrolloHtml(ud.data.recursosDocente.propuestaExamenHtml)}
</body>
</html>`;
          folder3.file(`${ud.id}_Propuesta_Examen_Test_${cleanTitle}.html`, examHtml);
          try {
            const docxBlob = await asBlob(examHtml, { orientation: "portrait" });
            folder3.file(`${ud.id}_Propuesta_Examen_Test_${cleanTitle}.docx`, docxBlob as Blob);
          } catch {
            folder3.file(`${ud.id}_Propuesta_Examen_Test_${cleanTitle}.doc`, examHtml);
          }
        }

        // Exam solutions
        if (ud.data?.recursosDocente?.solucionarioExamenHtml) {
          const solHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solucionario Examen - ${ud.id} ${cleanTitle}</title>
  ${WORD_STYLES}
</head>
<body>
  <h1>SOLUCIONARIO Y JUSTIFICACIÓN TÉCNICA · ${ud.id}: ${cleanSigreLatexMath(ud.title)}</h1>
  <p><strong>Módulo:</strong> ${config.moduloFormativo} | <strong>Bloque:</strong> ${ud.bcCode}</p>
  ${formatSigreDesarrolloHtml(ud.data.recursosDocente.solucionarioExamenHtml)}
</body>
</html>`;
          folder3.file(`${ud.id}_Solucionario_Examen_${cleanTitle}.html`, solHtml);
          try {
            const docxBlob = await asBlob(solHtml, { orientation: "portrait" });
            folder3.file(`${ud.id}_Solucionario_Examen_${cleanTitle}.docx`, docxBlob as Blob);
          } catch {
            folder3.file(`${ud.id}_Solucionario_Examen_${cleanTitle}.doc`, solHtml);
          }
        }
      }
    }
  }

  // ========================================================================
  // 4. Diagrama & Mapa Mental (OPML)
  // ========================================================================
  if (options.includeOpmlAndDiagrams !== false && options.includeOpmlMindmaps !== false) {
    onProgress?.("Generando 4. Diagramas Mermaid y Mapas Mentales OPML...", 65);
    const folder4 = zip.folder("4. Diagrama & Mapa Mental (OPML)");
    if (folder4) {
      // Master OPML
      const masterOpml = buildMasterConsolidatedOpml(uds, config);
      folder4.file(`Mapa_Mental_Consolidado_${cleanModName}.opml`, masterOpml);

      // Mermaid viewer HTML
      const mermaidHtml = buildMermaidViewerHtml(uds, config);
      folder4.file(`Diagramas_Visuales_Mermaid.html`, mermaidHtml);

      // Consolidated Markdown Mermaid
      let consolidatedMermaidMd = `# Diagramas Mermaid del Módulo: ${config.moduloFormativo || 'FP'}\n\n`;

      for (const ud of uds) {
        const cleanTitle = (ud.title || `Unidad_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");

        // Individual OPML
        if (ud.data) {
          const opmlText = generateSigreOpml(ud, ud.data.modulo1, ud.data);
          folder4.file(`${ud.id}_Mapa_Mental_${cleanTitle}.opml`, opmlText);
        }

        // Individual Mermaid
        if (ud.data?.modulo1?.diagramaMermaid) {
          folder4.file(`${ud.id}_Diagrama_Flujo_${cleanTitle}.mmd`, ud.data.modulo1.diagramaMermaid);
          consolidatedMermaidMd += `## ${ud.id}: ${ud.title}\n\n\`\`\`mermaid\n${ud.data.modulo1.diagramaMermaid}\n\`\`\`\n\n---\n\n`;
        }
      }

      folder4.file(`Diagramas_Mermaid_Todos_${cleanModName}.md`, consolidatedMermaidMd);
    }
  }

  // ========================================================================
  // 5. Programación & Rúbricas XML
  // ========================================================================
  if (options.includeProgramacionRubricas !== false && options.includeRubricsXml !== false) {
    onProgress?.("Generando 5. Programación Didáctica y Rúbricas XML...", 76);
    const folder5 = zip.folder("5. Programación & Rúbricas XML");
    if (folder5) {
      // Master Syllabus Document
      const masterHtml = buildMasterConsolidatedHtml(uds, config);
      folder5.file(`Programacion_Didactica_Completa_${cleanModName}.html`, masterHtml);
      try {
        const masterDocxBlob = await asBlob(masterHtml, { orientation: "portrait" });
        folder5.file(`Programacion_Didactica_Completa_${cleanModName}.docx`, masterDocxBlob as Blob);
      } catch {
        folder5.file(`Programacion_Didactica_Completa_${cleanModName}.doc`, masterHtml);
      }

      // Master Rubrics XML
      const masterRubricsXml = buildMasterConsolidatedRubricsXml(uds, config);
      folder5.file(`Rubricas_Evaluacion_Consolidadas_${cleanModName}.xml`, masterRubricsXml);

      // Individual Rubrics and Programacion
      for (const ud of uds) {
        const cleanTitle = (ud.title || `Unidad_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");

        if (ud.data?.programacionEval?.rubricasXml) {
          folder5.file(`${ud.id}_Rubrica_Moodle_${cleanTitle}.xml`, ud.data.programacionEval.rubricasXml);
        }

        if (ud.data?.programacionEval) {
          const singleProgHtml = buildSingleUdProgramacionHtml(ud, config);
          folder5.file(`${ud.id}_Programacion_y_Evaluacion_${cleanTitle}.html`, singleProgHtml);
          try {
            const docxBlob = await asBlob(singleProgHtml, { orientation: "portrait" });
            folder5.file(`${ud.id}_Programacion_y_Evaluacion_${cleanTitle}.docx`, docxBlob as Blob);
          } catch {
            folder5.file(`${ud.id}_Programacion_y_Evaluacion_${cleanTitle}.doc`, singleProgHtml);
          }
        }
      }
    }
  }

  // ========================================================================
  // 6. Simulador HDI
  // ========================================================================
  if (options.includeHdiApps !== false) {
    onProgress?.("Exportando 6. Micro-Aplicaciones Didácticas y Simuladores HDI...", 85);
    const folder6 = zip.folder("6. Simulador HDI");
    if (folder6) {
      let catalogHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Catálogo de Simuladores Didácticos HDI - ${config.moduloFormativo}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }
    .container { max-width: 900px; margin: 0 auto; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #d97706; color: #000; font-weight: bold; text-decoration: none; padding: 8px 16px; border-radius: 8px; transition: background 0.2s; }
    .btn:hover { background: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color: #f59e0b;">Catálogo de Micro-Aplicaciones Didácticas Interactivas (HDI)</h1>
    <p style="color: #94a3b8;">Módulo: <strong>${config.moduloFormativo}</strong> | Total Apps: ${uds.filter((u) => u.data?.hdi?.appHtmlCode).length}</p>
    <hr style="border-color: #334155; margin: 20px 0;">
`;

      for (const ud of uds) {
        if (ud.data?.hdi?.appHtmlCode) {
          const rawAppName = ud.data.hdi.nombreApp || "Simulador";
          const cleanAppName = rawAppName.replace(/[^a-zA-Z0-9_-]/g, "_");
          const appFileName = `${ud.id}_${cleanAppName}.html`;

          folder6.file(appFileName, ud.data.hdi.appHtmlCode);

          if (ud.data.hdi.prdMarkdown) {
            folder6.file(`${ud.id}_PRD_${cleanAppName}.md`, ud.data.hdi.prdMarkdown);
          }

          catalogHtml += `
    <div class="card">
      <div>
        <h3 style="margin: 0 0 6px 0; color: #f59e0b;">${ud.id} - ${ud.data.hdi.nombreApp}</h3>
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">${cleanSigreLatexMath(ud.title)}</p>
      </div>
      <a class="btn" href="./${appFileName}" target="_blank">Abrir Simulador →</a>
    </div>
`;
        }
      }

      catalogHtml += `
  </div>
</body>
</html>`;
      folder6.file("index_catalogo_simuladores.html", catalogHtml);
    }
  }

  // ========================================================================
  // 7. Cronograma Visual (4 Niveles)
  // ========================================================================
  if (options.includeCronograma4Niveles !== false) {
    onProgress?.("Generando 7. Cronograma Visual en 4 Niveles...", 92);
    const folder7 = zip.folder("7. Cronograma Visual (4 Niveles)");
    if (folder7) {
      // Visual HTML
      const cronoHtml = build4LevelTimelineHtml(uds, config);
      folder7.file(`Cronograma_Visual_4_Niveles_${cleanModName}.html`, cronoHtml);

      // Word Docx
      try {
        const cronoDocxBlob = await asBlob(cronoHtml, { orientation: "landscape" });
        folder7.file(`Cronograma_Visual_4_Niveles_${cleanModName}.docx`, cronoDocxBlob as Blob);
      } catch {
        folder7.file(`Cronograma_Visual_4_Niveles_${cleanModName}.doc`, cronoHtml);
      }

      // JSON & Markdown data
      const cronoJson = build4LevelTimelineJson(uds, config);
      folder7.file(`Cronograma_Visual_4_Niveles_${cleanModName}.json`, cronoJson);

      const cronoMd = build4LevelTimelineMd(uds, config);
      folder7.file(`Cronograma_Visual_4_Niveles_${cleanModName}.md`, cronoMd);
    }
  }

  // ========================================================================
  // Backup JSON in root
  // ========================================================================
  if (options.includeMasterJson !== false) {
    onProgress?.("Generando Copia de Seguridad Maestra en JSON...", 96);
    const masterJson = buildMasterProjectJson(uds, config);
    zip.file(`Copia_Seguridad_SIGRE_${cleanModName}_${uds.length}UDs.json`, masterJson);
  }

  onProgress?.("Comprimiendo archivo ZIP final...", 98);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  onProgress?.("¡Exportación completada con éxito!", 100);

  return zipBlob;
}

/**
 * Builds JSON string for a single Unidad Didáctica
 */
export function buildSingleUdJson(ud: SigreUDItem, config: SigreCurricularConfig): string {
  const payload = {
    metadata: {
      sistema: "SIGRE V6.0 - Sistema Inteligente de Gestión de Recursos Educativos",
      tipo: "Unidad_Didactica_Individual",
      version: "6.0",
      fechaExportacion: new Date().toISOString(),
      moduloCodigo: config.codigo || "0000",
      moduloFormativo: config.moduloFormativo || "Módulo Formativo",
      cicloFormativo: config.cicloFormativo || "Ciclo Formativo",
    },
    unidadDidactica: ud,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Downloads a single UD as a standalone JSON file
 */
export function exportSingleUdJson(ud: SigreUDItem, config: SigreCurricularConfig): void {
  const jsonText = buildSingleUdJson(ud, config);
  const cleanModName = (config.moduloFormativo || "Modulo_FP").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanUdTitle = (ud.title || `UD_${ud.number}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  downloadBlob(
    `SIGRE_${ud.id}_${cleanUdTitle}_${cleanModName}.json`,
    jsonText,
    "application/json;charset=utf-8"
  );
}

export interface ParsedSigrePayload {
  type: "full_project" | "single_ud" | "ud_list" | "invalid";
  config?: SigreCurricularConfig;
  uds?: SigreUDItem[];
  singleUd?: SigreUDItem;
  raw: any;
  error?: string;
}

/**
 * Robust parser and sanitizer for SIGRE imported files or pasted JSON / AI outputs
 */
export function parseAndValidateSigrePayload(rawInput: string | object): ParsedSigrePayload {
  let parsed: any;

  if (typeof rawInput === "string") {
    let cleanText = rawInput.trim();

    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    try {
      parsed = JSON.parse(cleanText);
    } catch (e: any) {
      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");
      const firstBracket = cleanText.indexOf("[");
      const lastBracket = cleanText.lastIndexOf("]");

      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
        } catch {
          return { type: "invalid", raw: rawInput, error: "Formato JSON no válido: " + e.message };
        }
      } else if (firstBracket !== -1 && lastBracket > firstBracket) {
        try {
          parsed = JSON.parse(cleanText.substring(firstBracket, lastBracket + 1));
        } catch {
          return { type: "invalid", raw: rawInput, error: "Formato JSON no válido: " + e.message };
        }
      } else {
        return { type: "invalid", raw: rawInput, error: "El texto no contiene una estructura JSON reconocible." };
      }
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed || typeof parsed !== "object") {
    return { type: "invalid", raw: parsed, error: "El contenido no es un objeto válido." };
  }

  // Case 1: Full project export (has unidadesDidacticas array)
  if (Array.isArray(parsed.unidadesDidacticas)) {
    return {
      type: "full_project",
      config: parsed.configuracionCurricular || parsed.config,
      uds: parsed.unidadesDidacticas,
      raw: parsed,
    };
  }

  // Case 2: Array of UDs directly
  if (Array.isArray(parsed)) {
    return {
      type: "ud_list",
      uds: parsed,
      raw: parsed,
    };
  }

  // Case 3: Single UD wrapper (unidadDidactica property)
  if (parsed.unidadDidactica && typeof parsed.unidadDidactica === "object") {
    return {
      type: "single_ud",
      singleUd: parsed.unidadDidactica,
      raw: parsed,
    };
  }

  // Case 4: Raw Single UD object (has id, title, or data)
  if (parsed.id && (parsed.title || parsed.data || parsed.bcCode)) {
    return {
      type: "single_ud",
      singleUd: parsed as SigreUDItem,
      raw: parsed,
    };
  }

  // Case 5: Direct SigreUDData object (modulo1, udCurricular, etc.)
  if (parsed.modulo1 || parsed.udCurricular || parsed.recursosDocente || parsed.hdi) {
    const syntheticUd: Partial<SigreUDItem> = {
      id: parsed.id || "UD_IMPORTADA",
      title: parsed.modulo1?.titulo || parsed.udCurricular?.contextualizacionModulo?.justificacion || "Unidad Didáctica Importada",
      data: parsed as any,
      status: "completed",
    };
    return {
      type: "single_ud",
      singleUd: syntheticUd as SigreUDItem,
      raw: parsed,
    };
  }

  return {
    type: "invalid",
    raw: parsed,
    error: "No se encontró una estructura compatible con Unidades Didácticas de SIGRE.",
  };
}

/**
 * Merges or updates project UDs with imported UDs
 */
export function mergeSigreProject(
  currentUds: SigreUDItem[],
  currentConfig: SigreCurricularConfig,
  payload: ParsedSigrePayload,
  mode: "merge" | "replace" = "merge"
): {
  updatedUds: SigreUDItem[];
  updatedConfig: SigreCurricularConfig;
  stats: { updatedCount: number; addedCount: number; totalCount: number };
} {
  const updatedConfig = payload.config ? { ...currentConfig, ...payload.config } : { ...currentConfig };

  if (mode === "replace" && (payload.uds || payload.singleUd)) {
    const newUds = payload.uds ? [...payload.uds] : payload.singleUd ? [payload.singleUd] : [];
    return {
      updatedUds: newUds,
      updatedConfig,
      stats: {
        updatedCount: 0,
        addedCount: newUds.length,
        totalCount: newUds.length,
      },
    };
  }

  // Merge mode:
  const udsToMerge: SigreUDItem[] = payload.uds ? payload.uds : payload.singleUd ? [payload.singleUd] : [];
  const updatedUds = [...currentUds];
  let updatedCount = 0;
  let addedCount = 0;

  udsToMerge.forEach((incomingUd) => {
    const targetIndex = updatedUds.findIndex(
      (u) =>
        (incomingUd.id && u.id.toLowerCase() === incomingUd.id.toLowerCase()) ||
        (incomingUd.number && u.number === incomingUd.number) ||
        (incomingUd.title && u.title.toLowerCase().trim() === incomingUd.title.toLowerCase().trim())
    );

    if (targetIndex !== -1) {
      const existing = updatedUds[targetIndex];
      const mergedData = incomingUd.data
        ? {
            ...(existing.data || {}),
            ...incomingUd.data,
            modulo1: incomingUd.data.modulo1 || existing.data?.modulo1,
            udCurricular: incomingUd.data.udCurricular || existing.data?.udCurricular,
            programacionEval: incomingUd.data.programacionEval || existing.data?.programacionEval,
            recursosDocente: incomingUd.data.recursosDocente || existing.data?.recursosDocente,
            hdi: incomingUd.data.hdi || existing.data?.hdi,
            pedagogicalAudit: incomingUd.data.pedagogicalAudit || existing.data?.pedagogicalAudit,
          }
        : existing.data;

      updatedUds[targetIndex] = {
        ...existing,
        ...incomingUd,
        data: mergedData,
        status: mergedData ? "completed" : incomingUd.status || existing.status,
      };
      updatedCount++;
    } else {
      updatedUds.push({
        ...incomingUd,
        id: incomingUd.id || `UD${String(updatedUds.length + 1).padStart(2, "0")}`,
        number: incomingUd.number || updatedUds.length + 1,
        status: incomingUd.data ? "completed" : incomingUd.status || "pending",
      });
      addedCount++;
    }
  });

  return {
    updatedUds,
    updatedConfig,
    stats: {
      updatedCount,
      addedCount,
      totalCount: updatedUds.length,
    },
  };
}
