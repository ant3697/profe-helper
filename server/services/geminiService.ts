import { GoogleGenAI } from "@google/genai";

export function sanitizeGeminiModel(model?: string): string {
  if (!model || typeof model !== "string") return "gemini-3.6-flash";
  const m = model.toLowerCase().trim();
  if (
    m === "gemini-3.6-flash" ||
    m === "gemini-3.1-flash-lite" ||
    m === "gemini-3.7-flash" ||
    m === "gemini-flash-latest" ||
    m === "gemini-3.1-pro-preview"
  ) {
    return m;
  }
  if (m.includes("3.6")) return "gemini-3.6-flash";
  if (m.includes("3.7")) return "gemini-3.7-flash";
  if (m.includes("3.1") && (m.includes("lite") || m.includes("flash"))) return "gemini-3.1-flash-lite";
  if (m.includes("3.1") && m.includes("pro")) return "gemini-3.1-pro-preview";
  if (m.includes("flash") || m === "gemini" || m.includes("2.5")) {
    return "gemini-3.6-flash";
  }
  return model.trim();
}

export async function generateWithGeminiRetry(ai: GoogleGenAI, params: any, maxRetries = 3) {
  let currentParams = { ...params };
  let lastError: any = null;
  const fallbackModels = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
  ];
  const exhaustedModels = new Set<string>();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(currentParams);
    } catch (err: any) {
      lastError = err;
      const msg = err.message || "";
      const is404 = msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("no longer available");
      const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded") || msg.includes("rate limit") || msg.includes("exceeded your current quota");
      const is503 = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("overloaded");
      const isTransient = is404 || is429 || is503 || msg.includes("500") || msg.includes("502") || msg.includes("504") || msg.includes("fetch failed") || msg.includes("ECONNRESET") || msg.includes("socket hang up");

      if (attempt < maxRetries && isTransient) {
        if (is429 || is404) {
          exhaustedModels.add(currentParams.model);
        }

        if (is503 || is429 || is404) {
          const nextModel = fallbackModels.find((m) => !exhaustedModels.has(m)) || "gemini-flash-latest";
          currentParams.model = nextModel;
        }

        let delayMs = is503 ? 600 : 1200;
        const delayMatch = msg.match(/retry\s+in\s+([\d\.]+)\s*s/i) || msg.match(/retryDelay["']?\s*:\s*["']?(\d+)/i);
        if (delayMatch && delayMatch[1]) {
          const parsedSeconds = parseFloat(delayMatch[1]);
          if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
            delayMs = Math.min(parsedSeconds * 1000 + 300, 5000);
          }
        } else {
          delayMs = delayMs * Math.pow(1.4, attempt) + Math.random() * 300;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export function sanitizeExamQuestions(data: any): any {
  if (!data || typeof data !== "object") return data;
  const cleanStr = (str: any) => {
    if (typeof str !== "string") return "";
    let clean = str.trim();
    clean = clean.replace(/^(?:opci[oó]n\s+[a-d][\s:\.\-\)]*|[a-d][\.\)\:\-]\s*|\[[a-d]\]\s*|\([a-d]\)\s*)/i, "").trim();
    clean = clean.replace(/\s*[\(\[]\s*(?:correcta|verdadera|falsa|incorrecta|distractor[^\)\]]*|respuesta correcta|desarrollo clave[^\)\]]*|condici[oó]n no aplicable[^\)\]]*|par[aá]metro fuera[^\)\]]*)\s*[\)\]]\s*$/i, "").trim();
    return clean || str.trim();
  };

  if (Array.isArray(data.bloques)) {
    data.bloques.forEach((b: any) => {
      if (Array.isArray(b.preguntas)) {
        b.preguntas.forEach((q: any) => {
          if (Array.isArray(q.opciones)) {
            q.opciones = q.opciones.map(cleanStr);
          }
        });
      }
    });
  }
  return data;
}

export function repairJsonEscapes(str: string): string {
  let result = "";
  let inString = false;
  let isEscaped = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (!inString) {
      if (char === '"') {
        inString = true;
        isEscaped = false;
        result += char;
      } else {
        result += char;
      }
    } else {
      if (isEscaped) {
        isEscaped = false;
        if (
          char === '"' ||
          char === "\\" ||
          char === "/" ||
          char === "b" ||
          char === "f" ||
          char === "n" ||
          char === "r" ||
          char === "t"
        ) {
          result += char;
        } else if (char === "u" && /^[0-9a-fA-F]{4}$/.test(str.substring(i + 1, i + 5))) {
          result += char;
        } else {
          result += "\\" + char;
        }
      } else {
        if (char === "\\") {
          isEscaped = true;
          result += char;
        } else if (char === '"') {
          inString = false;
          result += char;
        } else if (char === "\n") {
          result += "\\n";
        } else if (char === "\r") {
          result += "\\r";
        } else if (char === "\t") {
          result += "\\t";
        } else if (char.charCodeAt(0) < 32) {
          result += " ";
        } else {
          result += char;
        }
      }
    }
  }
  if (isEscaped) result += "\\";
  if (inString) result += '"';
  return result.replace(/,(\s*[}\]])/g, "$1");
}

export function extractJSONFromText(text: string): any {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();

  try {
    return sanitizeExamQuestions(JSON.parse(trimmed));
  } catch {}

  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return sanitizeExamQuestions(JSON.parse(markdownMatch[1].trim()));
    } catch {
      try {
        return sanitizeExamQuestions(JSON.parse(repairJsonEscapes(markdownMatch[1].trim())));
      } catch {}
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return sanitizeExamQuestions(JSON.parse(candidate));
    } catch {
      try {
        return sanitizeExamQuestions(JSON.parse(repairJsonEscapes(candidate)));
      } catch {}
    }
  }

  try {
    return sanitizeExamQuestions(JSON.parse(repairJsonEscapes(trimmed)));
  } catch {}

  if (firstBrace !== -1) {
    const partial = trimmed.substring(firstBrace);
    const lastQuoteBrace = Math.max(
      partial.lastIndexOf('"}'),
      partial.lastIndexOf('"\n}'),
      partial.lastIndexOf('"\r\n}')
    );
    if (lastQuoteBrace !== -1) {
      const sliced = partial.substring(0, lastQuoteBrace + 2);
      const repairAttempts = [
        sliced + "]}]}",
        sliced + "]}",
        sliced + "}]}",
        sliced + "}",
      ];
      for (const attempt of repairAttempts) {
        try {
          const parsed = JSON.parse(attempt);
          if (parsed && (parsed.bloques || Array.isArray(parsed))) {
            return sanitizeExamQuestions(parsed);
          }
        } catch {}
      }
    }
  }

  const recoveredQuestions = extractQuestionsRegex(trimmed);
  if (recoveredQuestions.length > 0) {
    return sanitizeExamQuestions({
      analisis_anticolision: "Estructura recuperada exitosamente mediante el analizador de emergencia.",
      bloques: [
        {
          titulo: "Examen Técnico (Preguntas Recuperadas)",
          preguntas: recoveredQuestions,
        },
      ],
    });
  }

  throw new Error("No se pudo extraer una estructura JSON válida de la respuesta del modelo.");
}

export function extractQuestionsRegex(text: string): any[] {
  const questions: any[] = [];
  const qRegex = /"enunciado"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"opciones"\s*:\s*\[((?:[^\]\\]|\\.)*)\]\s*,\s*"indiceCorrecta"\s*:\s*(\d+)\s*,\s*"justificacion"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = qRegex.exec(text)) !== null) {
    try {
      const enunciado = JSON.parse(`"${match[1]}"`);
      const opcionesRaw = `[${match[2]}]`;
      const opciones = JSON.parse(opcionesRaw);
      const indiceCorrecta = parseInt(match[3], 10);
      const justificacion = JSON.parse(`"${match[4]}"`);
      if (enunciado && Array.isArray(opciones) && opciones.length >= 2) {
        questions.push({
          enunciado,
          opciones,
          indiceCorrecta: isNaN(indiceCorrecta) ? 0 : indiceCorrecta,
          justificacion: justificacion || "",
        });
      }
    } catch {}
  }
  return questions;
}
