import { asBlob } from "html-docx-js-typescript";

/**
 * Cleanly exports an HTML string to a native Microsoft Word .docx file
 * Sanitizes dark theme artifacts, enforces UTF-8, and formats tables and callout boxes.
 */
export async function exportHtmlToDocx(
  htmlContent: string,
  filename: string = "Documento_Temario.docx"
): Promise<boolean> {
  // 1. Strip dark mode classes and clean HTML
  let cleanHtml = htmlContent
    .replace(/class="[^"]*dark-theme[^"]*"/gi, 'class="page"')
    .replace(/dark-theme/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<div id="standalone-export-bar"[\s\S]*?<\/div>/gi, "")
    .replace(/<style id="standalone-styles">[\s\S]*?<\/style>/gi, "");

  // 2. Prepare comprehensive Word-compatible CSS styling
  const wordStyles = `
    <style>
      @page {
        size: 21cm 29.7cm;
        margin: 2cm 2cm 2cm 2cm;
      }
      body {
        font-family: 'Calibri', 'Arial', sans-serif;
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
        border-bottom: 2pt solid #003366;
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
      p {
        font-size: 11pt;
        line-height: 1.45;
        margin-top: 0;
        margin-bottom: 8pt;
        text-align: justify;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 12pt 0;
        font-size: 10pt;
      }
      caption {
        font-weight: bold;
        font-size: 10pt;
        background-color: #e2e8f0;
        color: #0f172a;
        padding: 6pt 8pt;
        text-align: left;
        border: 1pt solid #cbd5e1;
        border-bottom: none;
      }
      th {
        background-color: #003366;
        color: #ffffff;
        font-weight: bold;
        padding: 6pt 8pt;
        border: 1pt solid #003366;
        text-transform: uppercase;
        font-size: 9.5pt;
      }
      td {
        border: 1pt solid #cbd5e1;
        padding: 5pt 8pt;
        color: #1e293b;
        background-color: #ffffff;
      }
      tr:nth-child(even) td {
        background-color: #f8fafc;
      }
      ul, ol {
        margin: 8pt 0 12pt 20pt;
        padding: 0;
      }
      li {
        margin-bottom: 5pt;
        line-height: 1.4;
      }
      .formula-box {
        background-color: #f8fafc;
        border: 1pt solid #cbd5e1;
        border-left: 4.5pt solid #003366;
        padding: 10pt 14pt;
        font-family: 'Courier New', Courier, monospace;
        font-size: 11pt;
        font-weight: bold;
        margin: 12pt 0;
        color: #0f172a;
      }
      .audio-desc {
        background-color: #fffdf5;
        border: 1pt solid #fef3c7;
        border-left: 4.5pt solid #f59e0b;
        padding: 8pt 12pt;
        margin: 10pt 0;
        font-size: 10pt;
        color: #78350f;
      }
      .apuntes-box {
        background-color: #f0f7ff;
        border: 1pt solid #dbeafe;
        border-left: 4.5pt solid #2563eb;
        padding: 10pt 14pt;
        margin: 12pt 0;
        color: #1e293b;
      }
      .recall-box {
        background-color: #f0fdf4;
        border: 1pt solid #dcfce7;
        border-left: 4.5pt solid #16a34a;
        padding: 10pt 14pt;
        margin: 12pt 0;
        color: #1e293b;
      }
      .mnemo-box {
        background-color: #fffbeb;
        border: 1pt solid #fef3c7;
        border-left: 4.5pt solid #d97706;
        padding: 10pt 14pt;
        margin: 12pt 0;
        color: #1e293b;
      }
    </style>
  `;

  // 3. Construct standard HTML document
  const fullDocumentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename.replace(/\.docx?$/i, "")}</title>
  ${wordStyles}
</head>
<body>
  ${cleanHtml}
</body>
</html>`;

  const targetFilename = filename.endsWith(".docx") ? filename : `${filename}.docx`;

  try {
    const docxBlob = await asBlob(fullDocumentHtml, { orientation: "portrait" });
    const blobUrl = URL.createObjectURL(docxBlob as Blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = targetFilename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.warn("Fallo en exportación DOCX mediante html-docx-js, aplicando fallback HTML Word (.doc):", error);
    // Fallback: Word XML/HTML blob
    const fallbackBlob = new Blob(["\ufeff", fullDocumentHtml], {
      type: "application/msword;charset=utf-8",
    });
    const blobUrl = URL.createObjectURL(fallbackBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = targetFilename.replace(/\.docx$/i, ".doc");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
    return false;
  }
}
