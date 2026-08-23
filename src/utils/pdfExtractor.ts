import * as pdfjsLib from "pdfjs-dist";

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
function readFileAsBase64(file: File): Promise<string> {
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

export async function extractTextFromPDF(
  file: File,
  onStatus?: (status: string) => void
): Promise<string> {
  // 1. Read binary arrayBuffer for PDF.js parsing
  const rawBuffer = await file.arrayBuffer();
  
  // CRITICAL FIX: Clone the arrayBuffer before passing to pdfjsLib, because
  // Web Workers in PDF.js transfer and detach the underlying ArrayBuffer!
  const bufferCopyForPdfJs = rawBuffer.slice(0);
  const typedArray = new Uint8Array(bufferCopyForPdfJs);

  let extractedDigitalText = "";
  let extractedItemsCount = 0;
  let pdfParsedSuccessfully = false;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 100);

    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageStrings = content.items
          .map((item: any) => (item.str ? item.str.trim() : ""))
          .filter((str: string) => str.length > 0);

        extractedItemsCount += pageStrings.length;
        if (pageStrings.length > 0) {
          extractedDigitalText += `--- PÁGINA ${i} ---\n` + pageStrings.join(" ") + "\n\n";
        }

        // Yield thread periodically
        if (i % 5 === 0) {
          await new Promise((r) => setTimeout(r, 5));
        }
      } catch (pageErr) {
        console.warn(`Aviso: No se pudo extraer texto digital de página ${i}:`, pageErr);
      }
    }

    pdfParsedSuccessfully = true;
  } catch (pdfErr) {
    console.warn("Fallo al interpretar texto digital del PDF, recurriendo a OCR:", pdfErr);
  }

  const trimmedText = extractedDigitalText.trim();

  // If sufficient digital text is found, return it directly
  if (pdfParsedSuccessfully && trimmedText && extractedItemsCount > 10 && trimmedText.length > 80) {
    return trimmedText;
  }

  // 2. If no digital text (scanned PDF / image-only), trigger AI OCR safely using independent Base64 reader
  onStatus?.("Documento escaneado detectado. Procesando con OCR de IA...");
  
  try {
    const fileBase64 = await readFileAsBase64(file);
    const response = await fetch("/api/ocr-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64,
        mimeType: file.type || "application/pdf",
        fileName: file.name,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        errData.message || `Error en el servicio de OCR (${response.status})`
      );
    }

    const result = await response.json();
    if (result.text && result.text.trim()) {
      return result.text.trim();
    }

    // If both OCR and digital text were empty, but we had partial digital text, return it
    if (trimmedText) {
      return trimmedText;
    }

    throw new Error("El OCR no devolvió texto identificable en las imágenes del PDF.");
  } catch (ocrErr: any) {
    // If OCR failed but we have some digital text, return it as fallback
    if (trimmedText && trimmedText.length > 20) {
      return trimmedText;
    }
    console.error("Fallo en OCR con IA:", ocrErr);
    throw new Error(
      `Fallo al realizar OCR en documento escaneado: ${ocrErr.message || "Error desconocido"}`
    );
  }
}


