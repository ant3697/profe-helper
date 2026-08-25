import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure local worker URL bundled by Vite (guarantees exact version match)
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch {
    // Fallback if URL constructor fails
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

// Convert File to Base64 safely without relying on a shared or transferred ArrayBuffer
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function getStoredApiKey(): string {
  try {
    const saved = localStorage.getItem("docuexam_ai_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.providers?.gemini?.apiKey) {
        return parsed.providers.gemini.apiKey;
      }
    }
  } catch {}
  return "";
}

/**
 * Render PDF pages to high-resolution JPEG base64 strings using PDF.js and offscreen canvas.
 * Ideal fallback when documents contain embedded screenshots, scans, or vector drawings.
 */
async function renderPdfPagesToImages(
  typedArray: Uint8Array,
  maxPages = 20,
  onStatus?: (status: string) => void
): Promise<string[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: typedArray,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pageLimit = Math.min(pdf.numPages, maxPages);
  const renderedImages: string[] = [];

  for (let i = 1; i <= pageLimit; i++) {
    onStatus?.(`Rasterizando página ${i} de ${pageLimit} para análisis visual...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background before rendering
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    } as any).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    renderedImages.push(dataUrl);
  }

  return renderedImages;
}

/**
 * Extract text from a PDF file:
 * 1. Attempts fast digital text parsing via PDF.js.
 * 2. If it detects a scanned document or a PDF generated with image captures/screenshots,
 *    invokes Gemini Multimodal Document Understanding via /api/ocr-pdf.
 * 3. Includes smart fallback to offscreen canvas rasterization if direct PDF parsing encounters issues.
 */
export async function extractTextFromPDF(
  file: File,
  onStatus?: (status: string) => void,
  customApiKey?: string
): Promise<string> {
  const apiKey = customApiKey || getStoredApiKey();

  // 1. Read binary arrayBuffer for PDF.js inspection
  const rawBuffer = await file.arrayBuffer();
  
  // Clone arrayBuffer before passing to pdfjsLib, preventing detached ArrayBuffer issues
  const bufferCopyForPdfJs = rawBuffer.slice(0);
  const typedArray = new Uint8Array(bufferCopyForPdfJs);

  let extractedDigitalText = "";
  let extractedItemsCount = 0;
  let pdfParsedSuccessfully = false;
  let totalPages = 1;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    totalPages = pdf.numPages;
    const maxPages = Math.min(pdf.numPages, 100);

    // Fast concurrent extraction in batches of 10 pages
    const batchSize = 10;
    const pageResults: { index: number; text: string; count: number }[] = [];

    for (let batchStart = 1; batchStart <= maxPages; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, maxPages);
      const pagePromises = [];

      for (let i = batchStart; i <= batchEnd; i++) {
        pagePromises.push(
          (async (pageIdx) => {
            try {
              const page = await pdf.getPage(pageIdx);
              const content = await page.getTextContent();
              const pageStrings = content.items
                .map((item: any) => (item.str ? item.str.trim() : ""))
                .filter((str: string) => str.length > 0);

              if (pageStrings.length > 0) {
                return {
                  index: pageIdx,
                  text: `--- PÁGINA ${pageIdx} ---\n` + pageStrings.join(" ") + "\n\n",
                  count: pageStrings.length,
                };
              }
            } catch (pageErr) {
              console.warn(`Aviso: No se pudo extraer texto digital de página ${pageIdx}:`, pageErr);
            }
            return { index: pageIdx, text: "", count: 0 };
          })(i)
        );
      }

      const results = await Promise.all(pagePromises);
      pageResults.push(...results);
    }

    // Sort in original page order
    pageResults.sort((a, b) => a.index - b.index);
    for (const res of pageResults) {
      extractedDigitalText += res.text;
      extractedItemsCount += res.count;
    }

    pdfParsedSuccessfully = true;
  } catch (pdfErr) {
    console.warn("Fallo al interpretar texto digital del PDF, recurriendo a análisis multimodal:", pdfErr);
  }

  const trimmedText = extractedDigitalText.trim();
  const avgCharsPerPage = totalPages > 0 ? trimmedText.length / totalPages : 0;

  // If substantial digital text is present (not just stray headers/page numbers), return it immediately
  const isImageBasedPdf =
    !pdfParsedSuccessfully ||
    extractedItemsCount < 15 ||
    trimmedText.length < 90 ||
    avgCharsPerPage < 35;

  if (!isImageBasedPdf && trimmedText) {
    return trimmedText;
  }

  // 2. Multimodal AI Document Understanding for Scanned / Screenshot-based PDFs
  onStatus?.(
    "Reconociendo contenido visual e imágenes con Gemini Multimodal..."
  );
  
  try {
    const fileBase64 = await readFileAsBase64(file);
    const response = await fetch("/api/ocr-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64,
        mimeType: "application/pdf",
        fileName: file.name,
        customApiKey: apiKey,
        customModel: "gemini-3.6-flash",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.text && result.text.trim()) {
        return result.text.trim();
      }
    }

    // If direct PDF inline data failed (e.g. payload issue or complex PDF stream),
    // fallback to fast page-by-page visual canvas rasterization:
    onStatus?.("Rasterizando capturas para análisis por visión...");
    
    const bufferForRaster = rawBuffer.slice(0);
    const pageImages = await renderPdfPagesToImages(
      new Uint8Array(bufferForRaster),
      12,
      onStatus
    );

    if (pageImages.length > 0) {
      onStatus?.("Transcribiendo capturas de imagen...");
      const rasterResponse = await fetch("/api/ocr-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageImages,
          fileName: file.name,
          customApiKey: apiKey,
          customModel: "gemini-3.6-flash",
        }),
      });

      if (rasterResponse.ok) {
        const rasterResult = await rasterResponse.json();
        if (rasterResult.text && rasterResult.text.trim()) {
          return rasterResult.text.trim();
        }
      }
    }

    // If partial digital text was captured, fallback to it
    if (trimmedText) {
      return trimmedText;
    }

    throw new Error("El modelo multimodal no devolvió texto legible en las capturas del PDF.");
  } catch (ocrErr: any) {
    if (trimmedText && trimmedText.length > 20) {
      return trimmedText;
    }
    console.error("Fallo en Document Understanding multimodal:", ocrErr);
    throw new Error(
      `Fallo al procesar PDF con capturas de imagen: ${ocrErr.message || "Error desconocido"}`
    );
  }
}

/**
 * Extract text directly from single or multiple image captures (.png, .jpg, .jpeg, .webp)
 */
export async function extractTextFromImage(
  file: File,
  onStatus?: (status: string) => void,
  customApiKey?: string
): Promise<string> {
  const apiKey = customApiKey || getStoredApiKey();
  onStatus?.(`Procesando captura de imagen ${file.name} con Gemini Vision...`);

  const fileBase64 = await readFileAsBase64(file);
  const mimeType = file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");

  const response = await fetch("/api/ocr-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileBase64,
      mimeType,
      fileName: file.name,
      customApiKey: apiKey,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Error al procesar imagen (${response.status})`);
  }

  const result = await response.json();
  if (result.text && result.text.trim()) {
    return result.text.trim();
  }

  throw new Error("No se detectó texto en la imagen seleccionada.");
}

/**
 * Universal text extractor supporting PDFs (digital + screenshot captures), Images, HTML, Markdown, GIFT, and Text.
 */
export async function extractTextFromFile(
  file: File,
  onStatus?: (status: string) => void,
  customApiKey?: string
): Promise<string> {
  const lowerName = file.name.toLowerCase();
  const mime = file.type || "";

  if (mime === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractTextFromPDF(file, onStatus, customApiKey);
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    onStatus?.(`Extrayendo texto del documento DOCX ${file.name}...`);
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  if (
    mime.startsWith("image/") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".webp") ||
    lowerName.endsWith(".bmp")
  ) {
    return extractTextFromImage(file, onStatus, customApiKey);
  }

  // Plain text, HTML, Markdown, JSON, GIFT
  return file.text();
}
