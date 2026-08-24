import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "DocuExam Generator Engine",
  });
});

// Helper to sanitize and alias Gemini model names
function sanitizeGeminiModel(model?: string): string {
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

// Helper to execute Gemini generation with auto-retry on 503/429/500 and fallback to high-capacity models
async function generateWithGeminiRetry(ai: GoogleGenAI, params: any, maxRetries = 3) {
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

        // Switch to next available model that hasn't exhausted quota
        if (is503 || is429 || is404) {
          const nextModel = fallbackModels.find((m) => !exhaustedModels.has(m)) || "gemini-flash-latest";
          currentParams.model = nextModel;
        }

        // Calculate intelligent delay
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

function sanitizeExamQuestions(data: any): any {
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

// Helper to extract and auto-repair JSON from LLM text responses
function extractJSONFromText(text: string): any {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();

  // 1. Direct parse
  try {
    return sanitizeExamQuestions(JSON.parse(trimmed));
  } catch {}

  // 2. Strip markdown ```json code blocks
  const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return sanitizeExamQuestions(JSON.parse(markdownMatch[1].trim()));
    } catch {}
  }

  // 3. Find leftmost { and rightmost }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return sanitizeExamQuestions(JSON.parse(candidate));
    } catch {}
  }

  // 4. Auto-repair for truncated JSON (e.g. cut off mid-stream or token boundary)
  if (firstBrace !== -1) {
    const partial = trimmed.substring(firstBrace);
    // Find the last completed question by looking for end of property quotes
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

  // 5. Fallback AST/Regex question extractor
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

function extractQuestionsRegex(text: string): any[] {
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

// Test Provider Connection Endpoint
app.post("/api/test-provider", async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      providerId = "gemini",
      apiKey = "",
      endpoint = "",
      model = "",
    } = req.body;

    // 1. Google Gemini or Built-in Temp Demo
    if (providerId === "gemini" || providerId === "temp_demo") {
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: "NO_API_KEY",
          message: "Introduce una clave API de Gemini válida o activa el plan del servidor.",
        });
      }

    const ai = new GoogleGenAI({
      apiKey: keyToUse,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

      const testModel = sanitizeGeminiModel(model);
      const response = await generateWithGeminiRetry(ai, {
        model: testModel,
        contents: "Responde únicamente con la palabra OK.",
      });

      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        latencyMs,
        model: testModel,
        message: `Conexión exitosa con Google Gemini (${testModel}) en ${latencyMs}ms.`,
      });
    }

    // 2. OpenAI-compatible providers (DeepSeek, Groq, OpenRouter, OpenAI, Local Ollama, Custom)
    let baseUrl = endpoint.trim().replace(/\/+$/, "");
    if (!baseUrl) {
      if (providerId === "deepseek") baseUrl = "https://api.deepseek.com/v1";
      else if (providerId === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (providerId === "openrouter") baseUrl = "https://openrouter.ai/api/v1";
      else if (providerId === "openai") baseUrl = "https://api.openai.com/v1";
      else if (providerId === "local_ollama") baseUrl = "http://localhost:11434/v1";
      else baseUrl = "https://api.openai.com/v1";
    }

    const testModel = model || (providerId === "deepseek" ? "deepseek-chat" : providerId === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey && apiKey.trim()) {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    }

    if (providerId === "openrouter") {
      headers["HTTP-Referer"] = "https://docuexam.app";
      headers["X-Title"] = "DocuExam Builder";
    }

    const testPayload = {
      model: testModel,
      messages: [{ role: "user", content: "Responde únicamente con la palabra OK." }],
      max_tokens: 10,
    };

    const targetUrl = `${baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const apiRes = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => "");
      let parsedErr = "";
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || jsonErr.message || errText;
      } catch {
        parsedErr = errText;
      }
      return res.status(apiRes.status).json({
        success: false,
        latencyMs,
        error: `HTTP ${apiRes.status}`,
        message: `Error al conectar con ${providerId.toUpperCase()} (${baseUrl}): ${parsedErr.substring(0, 200)}`,
      });
    }

    const data = await apiRes.json();
    return res.json({
      success: true,
      latencyMs,
      model: testModel,
      message: `Conexión exitosa con ${providerId.toUpperCase()} (${testModel}) en ${latencyMs}ms.`,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error("Error probando conexión de proveedor:", error);
    return res.status(500).json({
      success: false,
      latencyMs,
      error: "CONNECTION_ERROR",
      message: error.message || "Fallo de conexión al endpoint del proveedor.",
    });
  }
});

interface LLMExamCallParams {
  providerId: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

async function callLLMForExam(params: LLMExamCallParams): Promise<{ data: any; usage?: any; model: string }> {
  const {
    providerId = "gemini",
    apiKey: requestApiKey = "",
    endpoint: requestEndpoint = "",
    model: requestModel = "",
    systemPrompt,
    userPrompt,
    temperature,
  } = params;

  // PATH A: Google Gemini / Temp Demo via @google/genai
  if (providerId === "gemini" || providerId === "temp_demo") {
    const apiKey = requestApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No se ha configurado ninguna clave de API de Gemini ni servidor.");
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    const modelName = sanitizeGeminiModel(requestModel);

    const response = await generateWithGeminiRetry(ai, {
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature,
        maxOutputTokens: 65536,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analisis_anticolision: {
              type: Type.STRING,
              description: "Razonamiento interno sobre prevención de repeticiones y temáticas cubiertas.",
            },
            bloques: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: { type: Type.STRING },
                  preguntas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        enunciado: { type: Type.STRING },
                        opciones: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        indiceCorrecta: { type: Type.INTEGER },
                        justificacion: { type: Type.STRING },
                      },
                      required: ["enunciado", "opciones", "indiceCorrecta", "justificacion"],
                    },
                  },
                },
                required: ["titulo", "preguntas"],
              },
            },
          },
          required: ["bloques"],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsedData = extractJSONFromText(rawText);

    const usage = response.usageMetadata
      ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          candidatesTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        }
      : null;

    return {
      data: parsedData,
      model: modelName,
      usage,
    };
  }

  // PATH B: OpenAI-Compatible Providers (OpenAI, DeepSeek, Groq, OpenRouter, Local Ollama, Custom)
  let baseUrl = (requestEndpoint || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    if (providerId === "deepseek") baseUrl = "https://api.deepseek.com/v1";
    else if (providerId === "groq") baseUrl = "https://api.groq.com/openai/v1";
    else if (providerId === "openrouter") baseUrl = "https://openrouter.ai/api/v1";
    else if (providerId === "openai") baseUrl = "https://api.openai.com/v1";
    else if (providerId === "local_ollama") baseUrl = "http://localhost:11434/v1";
    else baseUrl = "https://api.openai.com/v1";
  }

  const modelName = requestModel || (providerId === "deepseek" ? "deepseek-chat" : providerId === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requestApiKey && requestApiKey.trim()) {
    headers["Authorization"] = `Bearer ${requestApiKey.trim()}`;
  }

  if (providerId === "openrouter") {
    headers["HTTP-Referer"] = "https://docuexam.app";
    headers["X-Title"] = "AI Exams Builder";
  }

  const requestPayload: any = {
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: 8192,
  };

  if (providerId !== "local_ollama") {
    requestPayload.response_format = { type: "json_object" };
  }

  const targetUrl = `${baseUrl}/chat/completions`;
  const maxOpenAIRetries = 3;
  let lastOpenAIError: any = null;

  for (let attempt = 0; attempt <= maxOpenAIRetries; attempt++) {
    try {
      const apiRes = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestPayload),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => "");
        let parsedErr = errText;
        try {
          const jsonErr = JSON.parse(errText);
          parsedErr = jsonErr.error?.message || jsonErr.message || errText;
        } catch {}

        const isRateLimitOrBusy = apiRes.status === 429 || apiRes.status === 503 || apiRes.status === 502 || apiRes.status === 504;
        if (attempt < maxOpenAIRetries && isRateLimitOrBusy) {
          const delayMs = 2500 * Math.pow(1.8, attempt) + Math.random() * 1000;
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw new Error(`[${providerId.toUpperCase()} HTTP ${apiRes.status}]: ${parsedErr}`);
      }

      const responseData = await apiRes.json();
      const content = responseData.choices?.[0]?.message?.content || "{}";
      const parsedData = extractJSONFromText(content);

      const usage = responseData.usage
        ? {
            promptTokens: responseData.usage.prompt_tokens || 0,
            candidatesTokens: responseData.usage.completion_tokens || 0,
            totalTokens: responseData.usage.total_tokens || 0,
          }
        : null;

      return {
        data: parsedData,
        model: modelName,
        usage,
      };
    } catch (err: any) {
      lastOpenAIError = err;
      if (attempt < maxOpenAIRetries) {
        const delayMs = 2000 * Math.pow(1.8, attempt) + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }

  throw lastOpenAIError;
}

// Concurrency-controlled Worker Pool for high-volume stress tests
async function runTasksWithConcurrencyPool<T, R>(
  items: T[],
  workerFn: (item: T, index: number) => Promise<R>,
  concurrency = 3
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await workerFn(items[idx], idx);
      } catch (err) {
        console.error(`Sub-task ${idx + 1}/${items.length} error:`, err);
        results[idx] = null;
      }
    }
  }

  const workers = [];
  const workerCount = Math.min(concurrency, items.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

// Multi-provider Exam Generation API Route with Chunking & Batch Generation
app.post("/api/generate-exam", async (req, res) => {
  try {
    const {
      difficulty = "easy",
      numQuestions = 12,
      batchCount = 1,
      customPrompt = "",
      aggregatedContent = "",
      creativityStyle = "literal",
      providerId = "gemini",
      apiKey: requestApiKey = "",
      endpoint: requestEndpoint = "",
      model: requestModel = "",
    } = req.body;

    const validatedBatchCount = Math.max(1, Math.min(10, Number(batchCount) || 1));

    const isOpo205 =
      customPrompt.toLowerCase().includes("oposiciones esp. 205") ||
      customPrompt.toLowerCase().includes("205 (equipos") ||
      customPrompt.toLowerCase().includes("frigoríficas") ||
      customPrompt.toLowerCase().includes("especialidad 205");

    let documentContextInstruction = "";
    let contextPayload = "";

    if (aggregatedContent && aggregatedContent.trim() !== "") {
      const limitText = aggregatedContent.substring(0, 45000);
      documentContextInstruction = `
**BASE DOCUMENTAL Y PREVENCIÓN DE COLISIONES (RAG AVANZADO):** El usuario ha proporcionado un MATERIAL DE ESTUDIO y/o EXÁMENES ANTERIORES.
1. Si el material contiene información teórica pura (MATERIAL BASE): Extrae conceptos, normativas y situaciones de este texto.
2. Si el material contiene PREGUNTAS YA FORMULADAS (HISTÓRICO): APLICA EVASIÓN CONCEPTUAL EXTREMA. Está TERMINANTEMENTE PROHIBIDO evaluar el mismo objetivo de aprendizaje. Explora otras ramas, componentes y normativas del temario no tocadas.`;
      contextPayload = `\n\n--- INICIO DEL MATERIAL PROPORCIONADO ---\n${limitText}\n--- FIN DEL MATERIAL ---\n\n`;
    } else {
      documentContextInstruction = `
**GENERACIÓN AUTÓNOMA:** El usuario NO ha proporcionado material base. Utiliza tu conocimiento experto para generar las preguntas ciñéndote estrictamente a las temáticas y directrices del rol solicitadas.`;
    }

    const systemPrompt = `CONFIGURACIÓN DEL SISTEMA
$$MODO: EVALUACIÓN DE ALTO RIGOR TÉCNICO Y NORMATIVO UNIVERSAL$$
$$META: RIGOR ACADÉMICO + NORMATIVA APLICADA + SINTAXIS JSON PERFECTA$$

1. FILOSOFÍA Y CONTEXTO
Eres un Tribunal y Evaluador Experto de máximo nivel técnico y pedagógico en oposiciones, cualificaciones profesionales, ingenierías y ciencias aplicadas. Tu objetivo es generar un examen riguroso que evalúe con total precisión el conocimiento del candidato.
Objetivo Crítico: Evitar el sesgo de la picardía o "Test-Wiseness". El alumno jamás debe poder deducir la respuesta correcta por descarte superficial, longitud dispar, tono, pistas gramaticales o descarte por sentido común.

2. REGLAS PARA LAS OPCIONES DE RESPUESTA
- FORMATO LIMPIO DE LAS OPCIONES: Cada elemento del array 'opciones' debe contener ÚNICAMENTE el texto de la respuesta (por ejemplo: "El valor límite no debe superar 50 V", "Filtro deshidratador en línea de líquido"). ESTÁ TERMINANTEMENTE PROHIBIDO incluir prefijos como "Opción A:", "a)", "A.", "1.", o añadir anotaciones como "(Correcta)", "(Verdadera)", "(Falsa)" en el array de opciones.
- EVITAR EXPLICACIONES EN LAS OPCIONES: Las opciones (A, B, C, D) deben contener únicamente enunciados directos, datos objetivos, fórmulas o medidas. Toda la argumentación técnica detallada y citas reglamentarias deben ir en la "justificacion".
- PROHIBICIÓN DE ABSOLUTISMOS: PROHIBIDO utilizar palabras absolutas o limitantes en los distractores falsos ("siempre", "nunca", "exclusivamente", "únicamente", "totalmente", "independientemente"). Los distractores falsos deben estar redactados de forma tan matizada, verosímil y profesional como la opción correcta.
- HOMOGENEIDAD SINTÁCTICA Y DE LONGITUD: Todas las opciones de una misma pregunta deben tener una longitud, estructura gramatical y complejidad equivalente.
- DISTRACTORES REALISTAS: Los valores numéricos o conceptuales falsos deben reflejar errores conceptuales, de cálculo o de aplicación práctica muy comunes.

3. JUSTIFICACIÓN TÉCNICA Y NORMATIVA AMPLIA (OBLIGATORIA)
La "justificacion" de CADA pregunta debe ser exhaustiva, profunda y rigurosa, adaptada al campo del documento o temario (Prevención de Riesgos Laborales LPRL/RDs, Normativa Europea EN/ISO/CE, Instalaciones Térmicas, Electricidad, Mecánica, Construcción, Sanidad, Administración, Telecomunicaciones, etc.):
- Cita Explícita del Marco Normativo y Técnico: Indicar con exactitud el artículo, anexo, tabla, norma UNE/EN/ISO, Directiva Comunitaria, Real Decreto, Ley estatal/autonómica o ley física/teorema científico en el que se sustenta la respuesta correcta.
- Desglose y Refutación de Distractores: Explicar pormenorizadamente por qué la opción correcta es la única válida y señalar con precisión técnica el error o la inexactitud de cada uno de los 3 distractores descartados.

4. EVASIÓN CONCEPTUAL EXTREMA (ANTICOLISIÓN)
Si el usuario proporciona exámenes previos o histórico de preguntas, identifica las raíces conceptuales ya evaluadas y ponlas en lista negra. Formula preguntas sobre nuevos conceptos, subsistemas y normativas no tocadas.

5. FORMATO DE RESPUESTA:
Debes responder OBLIGATORIAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "analisis_anticolision": "Razonamiento y temáticas cubiertas",
  "bloques": [
    {
      "titulo": "Nombre del bloque",
      "preguntas": [
        {
          "enunciado": "Texto claro y preciso de la pregunta",
          "opciones": [
            "Primera opción de respuesta (texto limpio sin prefijos ni anotaciones)",
            "Segunda opción de respuesta (texto limpio sin prefijos ni anotaciones)",
            "Tercera opción de respuesta (texto limpio sin prefijos ni anotaciones)",
            "Cuarta opción de respuesta (texto limpio sin prefijos ni anotaciones)"
          ],
          "indiceCorrecta": 0,
          "justificacion": "Justificación técnica y normativa exhaustiva (citando artículos, leyes, normas UNE/ISO, directivas o principios científicos) explicando la correcta y refutando las incorrectas."
        }
      ]
    }
  ]
}`;

    let modeInstructions = "";
    if (difficulty === "killer") {
      modeInstructions = `
**MODO DE DIFICULTAD: DESAFÍO EXTREMO (Preguntas complejas de alta discriminación)**
- Casos de diagnóstico avanzado, situaciones de campo críticas, límites reglamentarios específicos y fundamentos interdisciplinares.
- Distractores técnicamente defendibles a simple vista pero inexactos bajo análisis normativo riguroso.
- Justificaciones completas con desglose de la opción correcta y refutación detallada de las 3 opciones incorrectas.`;
    } else if (difficulty === "standard") {
      modeInstructions = `
**MODO DE DIFICULTAD: OFICIAL / PRÁCTICO (Nivel Oposición / Profesional - Casos Aplicados)**
- Práctico y justo. Evalúa competencia técnica real sin trampas. Casos de campo, normativas aplicadas y procedimientos reales.
- Distractores plausibles que representen errores típicos de preparación media.`;
    } else {
      modeInstructions = `
**MODO DE DIFICULTAD: BÁSICO / TEÓRICO (Fundamentos directos)**
- Preguntas directas, concisas y teóricas: definiciones, función de componentes, clasificaciones o procedimientos estándar.
- Distractores claros sin trampas lingüísticas ni ambigüedades.`;
    }

    const customInstructionsStr = customPrompt
      ? `\n**INSTRUCCIONES ADICIONALES DEL USUARIO (PRIORIDAD ALTA):**\n${customPrompt}\n`
      : "";

    let styleInstruction = "";
    let temperature = 0.6;

    if (creativityStyle === "literal") {
      temperature = 0.25;
      styleInstruction = `\n**ESTILO DE EVALUACIÓN: ESTRICTAMENTE LITERAL (LEY / NORMATIVA):**
- Formula preguntas de máxima fidelidad al texto legal y técnico suministrado.
- Evita interpretaciones libres. Basa las respuestas y justificaciones en la redacción exacta de artículos, definiciones reglamentarias y fórmulas directas.`;
    } else if (creativityStyle === "interpretive") {
      temperature = 0.85;
      styleInstruction = `\n**ESTILO DE EVALUACIÓN: CASOS PRÁCTICOS E INTERPRETATIVOS:**
- Plantea situaciones reales de campo, problemas de diagnóstico, supuestos prácticos y aplicación razonada de normativas.
- Evalúa la capacidad del candidato para deducir soluciones técnicas ante escenarios operacionales complejos.`;
    } else {
      temperature = difficulty === "killer" ? 0.75 : difficulty === "standard" ? 0.6 : 0.45;
      styleInstruction = `\n**ESTILO DE EVALUACIÓN: EQUILIBRADO (OFICIAL / OPOSICIÓN):**
- Combina armónicamente preguntas teóricas de normativa con casos prácticos directos.`;
    }

    const CHUNK_LIMIT = 20;

    // CASE 1: Single Call Generation (for normal exam sizes <= 20 questions and single batch)
    if (numQuestions <= CHUNK_LIMIT && validatedBatchCount === 1) {
      let structureInstruction = "";
      if (isOpo205) {
        const half = Math.floor(numQuestions / 2);
        structureInstruction = `1. **Estructura Fija del Examen:** Debes dividir las preguntas equitativamente en exactamente DOS bloques con estos títulos exactos:
        - "❄️ Bloque 1: Instalaciones Frigoríficas (Simulacro Especialidad 205)" (para la primera mitad de ${half} preguntas)
        - "🔥 Bloque 2: Instalaciones de Calefacción y ACS (Simulacro Especialidad 205)" (para la segunda mitad de ${numQuestions - half} preguntas)
2. Total de preguntas solicitadas: EXACTAMENTE ${numQuestions} preguntas.`;
      } else {
        structureInstruction = `1. **Estructura Fija del Examen:** Genera exactamente 1 apartado con el título "Examen General".
2. Debe contener EXACTAMENTE ${numQuestions} preguntas de opción múltiple.`;
      }

      const userPrompt = `Genera un examen estructurado aplicando rigurosamente el algoritmo de validación de consistencia.
${contextPayload}
${structureInstruction}
3. Cada pregunta debe contener: un enunciado, exactamente cuatro (4) opciones de respuesta en texto plano, el índice de la opción correcta (0, 1, 2 o 3), y una justificación técnica integral explicando la correcta y por qué fallan las demás.
4. ${modeInstructions}
5. ${documentContextInstruction}
${styleInstruction}
${customInstructionsStr}
Recuerda: Devuelve únicamente el JSON estructurado solicitado.`;

      const result = await callLLMForExam({
        providerId,
        apiKey: requestApiKey,
        endpoint: requestEndpoint,
        model: requestModel,
        systemPrompt,
        userPrompt,
        temperature,
      });

      return res.json(result);
    }

    // CASE 2: High-Volume or Multi-Battery Batch Generation
    interface ChunkTask {
      batteryIndex: number;
      blockTitle: string;
      targetCount: number;
      subThematic: string;
    }

    const tasks: ChunkTask[] = [];

    const opo205FrigoThemes = [
      "Ciclos frigoríficos de compresión simple y múltiple, diagramas p-h de Mollier, fluidos refrigerantes (R-134a, R-410A, R-32, CO2 R-744, NH3), compresores alternativos, rotativos, scroll y de tornillo, y evaporadores.",
      "Condensadores de aire y agua, torres de refrigeración, válvulas de expansión termostáticas (con compensación externa) y electrónicas, recipientes de líquido, presostatos de alta/baja y termostatos de desescarche.",
      "Cálculo de potencia frigorífica, COP y EER, subenfriamiento y recalentamiento útil/total, aceites lubricantes POE/PAG, filtros deshidratadores y visores de líquido.",
      "Reglamento de Seguridad para Instalaciones Frigoríficas (RSIF / RD 552/2019), normativa europea de gases fluorados (Reglamento F-Gas), detección de fugas y mantenimiento preventivo.",
    ];

    const opo205ClimaThemes = [
      "Generadores de calor: calderas de condensación y baja temperatura, quemadores modulantes, bombas de calor aerotérmicas y geotérmicas, rendimiento estacional (SCOP/SEER) y producción de ACS.",
      "Redes de tuberías y distribución hidráulica: colectores, equilibrado estático y dinámico (válvulas PICV), bombas circuladoras electrónicas de velocidad variable y pérdidas de carga.",
      "Vasos de expansión cerrados con membrana, válvulas de seguridad, suelo radiante/refrescante, prevención y control de Legionella en depósitos de acumulación según RD 487/2022.",
      "Reglamento de Instalaciones Térmicas en los Edificios (RITE / RD 1027/2007 y modificaciones), Código Técnico de la Edificación (CTE DB-HE), chimeneas y eficiencia energética.",
    ];

    for (let b = 1; b <= validatedBatchCount; b++) {
      if (isOpo205) {
        const b1Total = Math.floor(numQuestions / 2);
        const b2Total = numQuestions - b1Total;

        // Partition Bloque 1
        const b1Chunks = Math.ceil(b1Total / CHUNK_LIMIT);
        let b1Remaining = b1Total;
        const b1Title = "❄️ Bloque 1: Instalaciones Frigoríficas";

        for (let i = 0; i < b1Chunks; i++) {
          const count = Math.min(CHUNK_LIMIT, Math.ceil(b1Remaining / (b1Chunks - i)));
          b1Remaining -= count;
          const themeIdx = (b - 1 + i) % opo205FrigoThemes.length;
          tasks.push({
            batteryIndex: b,
            blockTitle: b1Title,
            targetCount: count,
            subThematic: `${opo205FrigoThemes[themeIdx]} [Enfoque exclusivo de la Batería ${b}]`,
          });
        }

        // Partition Bloque 2
        const b2Chunks = Math.ceil(b2Total / CHUNK_LIMIT);
        let b2Remaining = b2Total;
        const b2Title = "🔥 Bloque 2: Instalaciones de Calefacción y ACS";

        for (let i = 0; i < b2Chunks; i++) {
          const count = Math.min(CHUNK_LIMIT, Math.ceil(b2Remaining / (b2Chunks - i)));
          b2Remaining -= count;
          const themeIdx = (b - 1 + i) % opo205ClimaThemes.length;
          tasks.push({
            batteryIndex: b,
            blockTitle: b2Title,
            targetCount: count,
            subThematic: `${opo205ClimaThemes[themeIdx]} [Enfoque exclusivo de la Batería ${b}]`,
          });
        }
      } else {
        // Partition General Exam
        const numChunks = Math.ceil(numQuestions / CHUNK_LIMIT);
        let remaining = numQuestions;
        const blockTitle = "Examen Técnico";

        for (let i = 0; i < numChunks; i++) {
          const count = Math.min(CHUNK_LIMIT, Math.ceil(remaining / (numChunks - i)));
          remaining -= count;
          tasks.push({
            batteryIndex: b,
            blockTitle,
            targetCount: count,
            subThematic: `Batería ${b} (Parte ${i + 1} de ${numChunks}): Explora ramas técnicas, operativas y normativas sin solapamiento con otras baterías ni preguntas previas.`,
          });
        }
      }
    }

    // Execute sub-tasks with controlled concurrency pool (3 concurrent workers to prevent rate-limits / 429 quota exhaustion)
    const results = await runTasksWithConcurrencyPool(
      tasks,
      async (task) => {
        const chunkPrompt = `Genera un lote específico de preguntas para el examen (Batería ${task.batteryIndex} de ${validatedBatchCount}).
${contextPayload}
1. **Bloque Destino:** "${task.blockTitle}"
2. **Cantidad EXACTA de preguntas en este lote:** ${task.targetCount} preguntas de opción múltiple.
3. **Área Temática y Foco de este Lote:** ${task.subThematic}
4. Cada pregunta debe contener: un enunciado riguroso, exactamente cuatro (4) opciones de respuesta, el índice de la opción correcta (0, 1, 2 o 3), y una justificación técnica integral explicando la correcta y refutando las erróneas.
5. ${modeInstructions}
6. ${documentContextInstruction}
${customInstructionsStr}
Recuerda: Devuelve únicamente el JSON estructurado solicitado para el bloque indicado con exactamente ${task.targetCount} preguntas.`;

        return callLLMForExam({
          providerId,
          apiKey: requestApiKey,
          endpoint: requestEndpoint,
          model: requestModel,
          systemPrompt,
          userPrompt: chunkPrompt,
          temperature,
        });
      },
      3
    );

    // Group results per individual battery
    const batteriesMap = new Map<number, Map<string, any[]>>();
    for (let b = 1; b <= validatedBatchCount; b++) {
      batteriesMap.set(b, new Map<string, any[]>());
    }

    let mergedModel = "";
    let totalPromptTokens = 0;
    let totalCandidateTokens = 0;
    let totalTokens = 0;
    let successfulChunks = 0;

    for (let i = 0; i < results.length; i++) {
      const resObj = results[i];
      if (!resObj) continue;

      successfulChunks++;
      mergedModel = resObj.model || mergedModel;
      if (resObj.usage) {
        totalPromptTokens += resObj.usage.promptTokens || 0;
        totalCandidateTokens += resObj.usage.candidatesTokens || 0;
        totalTokens += resObj.usage.totalTokens || 0;
      }

      const task = tasks[i];
      const bIndex = task.batteryIndex;
      const bMap = batteriesMap.get(bIndex) || new Map<string, any[]>();
      batteriesMap.set(bIndex, bMap);

      const data = resObj.data;
      if (data && Array.isArray(data.bloques)) {
        for (const blk of data.bloques) {
          const title = blk.titulo || task.blockTitle;
          const existing = bMap.get(title) || [];
          if (Array.isArray(blk.preguntas)) {
            existing.push(...blk.preguntas);
          }
          bMap.set(title, existing);
        }
      }
    }

    if (successfulChunks === 0) {
      throw new Error("No se pudo generar ninguno de los lotes de preguntas solicitados. Comprueba la conexión o clave de API.");
    }

    const batteryResults: Array<{ batteryIndex: number; title: string; data: any; totalQuestions: number }> = [];

    for (let b = 1; b <= validatedBatchCount; b++) {
      const bMap = batteriesMap.get(b);
      if (!bMap) continue;

      const finalBloques = Array.from(bMap.entries()).map(([titulo, preguntas]) => ({
        titulo,
        preguntas,
      }));
      const totalBatteryQuestions = finalBloques.reduce((acc, blk) => acc + blk.preguntas.length, 0);

      if (finalBloques.length > 0 && totalBatteryQuestions > 0) {
        batteryResults.push({
          batteryIndex: b,
          title: `Batería ${b}`,
          data: {
            analisis_anticolision: `Batería ${b} de ${totalBatteryQuestions} preguntas generada de forma independiente y sin colisiones.`,
            bloques: finalBloques,
          },
          totalQuestions: totalBatteryQuestions,
        });
      }
    }

    return res.json({
      data: batteryResults[0]?.data || { bloques: [] },
      batteries: batteryResults,
      batchCount: validatedBatchCount,
      model: mergedModel,
      usage:
        totalTokens > 0
          ? {
              promptTokens: totalPromptTokens,
              candidatesTokens: totalCandidateTokens,
              totalTokens,
            }
          : null,
    });
  } catch (error: any) {
    console.error("Error generando examen multi-proveedor:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: error.message || "Error interno al generar el examen.",
    });
  }
});

// Server-side Multimodal Document Understanding Route (PDFs, Image Captures, Scanned Docs)
app.post("/api/ocr-pdf", async (req, res) => {
  try {
    const {
      fileBase64,
      pageImages,
      mimeType = "application/pdf",
      fileName = "documento.pdf",
      customApiKey = "",
      customModel = "",
    } = req.body;

    if (!fileBase64 && (!pageImages || !Array.isArray(pageImages) || pageImages.length === 0)) {
      return res.status(400).json({
        error: "MISSING_DATA",
        message: "No se recibieron datos de archivo ni imágenes para el procesamiento multimodal.",
      });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error: "NO_API_KEY",
        message: "No se ha configurado ninguna clave de API de Gemini para realizar el análisis multimodal.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const modelName = sanitizeGeminiModel(customModel || "gemini-3.6-flash");

    const promptText = `Actúa como un motor de Document Understanding y Reconocimiento Multimodal de máxima precisión para oposiciones y temática técnica.
El documento o capturas suministradas contienen texto digitalizado, capturas de pantalla, esquemas, preguntas de examen, tablas o fórmulas.
Instrucciones de transcripción:
1. Extrae y transcribe íntegramente todo el contenido textual visible, tablas, fórmulas y diagramas explicativos, respetando el orden de lectura y la estructura en párrafos y secciones.
2. Si el documento contiene preguntas tipo test, problemas o ejercicios: transcribe cada enunciado con exactitud, todas sus opciones (A, B, C, D), la respuesta correcta indicada o deducible y su justificación si está presente.
3. Formatea la salida en Markdown limpio, utilizando encabezados (##, ###), listas estructuradas y tablas Markdown fieles.
4. NO omitas contenido, NO agregues introducciones superfluas ni resúmenes. Devuelve exclusivamente la transcripción fiel y estructurada del documento.`;

    const contents: any[] = [];

    if (Array.isArray(pageImages) && pageImages.length > 0) {
      // Process multi-page rendered screenshots / canvas images
      for (const img of pageImages) {
        const cleanImg = img.includes(",") ? img.split(",")[1] : img;
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanImg,
          },
        });
      }
    } else if (fileBase64) {
      const cleanData = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      contents.push({
        inlineData: {
          mimeType: mimeType || "application/pdf",
          data: cleanData,
        },
      });
    }

    contents.push({
      text: promptText,
    });

    const response = await generateWithGeminiRetry(ai, {
      model: modelName,
      contents,
    });

    const transcribedText = response.text || "";

    if (!transcribedText.trim()) {
      return res.status(422).json({
        error: "EMPTY_OCR",
        message: "No se pudo extraer texto legible de las imágenes del documento.",
      });
    }

    res.json({
      text: transcribedText,
      fileName,
      model: modelName,
      pagesCount: Array.isArray(pageImages) ? pageImages.length : 1,
    });
  } catch (error: any) {
    console.error("Error en servicio OCR / Document Understanding:", error);
    res.status(500).json({
      error: "OCR_ERROR",
      message: error.message || "Fallo durante el reconocimiento multimodal del documento.",
    });
  }
});

// Endpoint for predicting ideal depth/subtopics for a topic
app.post("/api/suggest-depth", async (req, res) => {
  try {
    const { topic = "", apiKey: requestApiKey = "", model: requestModel = "" } = req.body;
    if (!topic || !topic.trim()) {
      return res.json({ suggested: 5 });
    }

    // High-accuracy structural heuristic
    const itemsMatch = topic.match(/(?:\n|^)\s*(?:\d+[\.\)-]|[-*•]|\w\)) /gi);
    if (itemsMatch && itemsMatch.length > 1) {
      return res.json({ suggested: Math.max(2, Math.min(15, itemsMatch.length)) });
    }

    const semicolonMatch = topic.match(/;/g);
    if (semicolonMatch && semicolonMatch.length > 1) {
      return res.json({ suggested: Math.max(2, Math.min(15, semicolonMatch.length + 1)) });
    }

    const cleanBody = topic.replace(/^Tema\s+\d+[\.\:\-]?\s*/i, "");
    const sentenceMatch = cleanBody.match(/\.\s+[A-ZÁÉÍÓÚÑ]/g);
    if (sentenceMatch && sentenceMatch.length >= 3) {
      return res.json({ suggested: Math.max(2, Math.min(15, sentenceMatch.length + 1)) });
    }

    const apiKey = requestApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const words = topic.split(/\s+/).length;
      const fallbackCount = words <= 6 ? 4 : words <= 15 ? 6 : words <= 30 ? 8 : 10;
      return res.json({ suggested: fallbackCount });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      const fastModel = "gemini-flash-latest";

      const prePrompt = `Analiza este tema o índice: "${topic.substring(0, 500)}". Responde ÚNICAMENTE con un número entero entre 2 y 15, que represente la cantidad ideal de subapartados técnicos necesarios para explicarlo en profundidad. No des explicaciones, solo el número.`;

      const response = await ai.models.generateContent({
        model: fastModel,
        contents: prePrompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 10,
        },
      });

      const text = response.text || "";
      const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num >= 2 && num <= 15) {
        return res.json({ suggested: num });
      }
    } catch {
      // Quiet fallback to word-count heuristic on any rate limit or API error
    }

    const words = topic.split(/\s+/).length;
    const fallbackCount = words <= 6 ? 4 : words <= 15 ? 6 : words <= 30 ? 8 : 10;
    return res.json({ suggested: fallbackCount });
  } catch {
    return res.json({ suggested: 6 });
  }
});

// High-Density Thematic Document Streaming Endpoint (SSE)
app.post("/api/stream-topic", async (req, res) => {
  let isAborted = false;
  res.on("close", () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });

  try {
    const {
      prompt,
      providerId = "gemini",
      apiKey: requestApiKey = "",
      endpoint: requestEndpoint = "",
      model: requestModel = "",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "MISSING_PROMPT", message: "Falta el prompt de generación." });
    }

    // Configure SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    if (providerId === "gemini" || providerId === "temp_demo") {
      const apiKey = requestApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: "NO_API_KEY", message: "Clave de API de Gemini requerida." })}\n\n`);
        return res.end();
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      let modelName = sanitizeGeminiModel(requestModel || "gemini-3.6-flash");

      const modelsToTry: string[] = [];
      if (modelName) modelsToTry.push(modelName);
      if (!modelsToTry.includes("gemini-3.6-flash")) modelsToTry.push("gemini-3.6-flash");
      if (!modelsToTry.includes("gemini-3.1-flash-lite")) modelsToTry.push("gemini-3.1-flash-lite");
      if (!modelsToTry.includes("gemini-3.7-flash")) modelsToTry.push("gemini-3.7-flash");
      if (!modelsToTry.includes("gemini-flash-latest")) modelsToTry.push("gemini-flash-latest");
      if (!modelsToTry.includes("gemini-3.1-pro-preview")) modelsToTry.push("gemini-3.1-pro-preview");

      let streamedAny = false;
      let lastErr: any = null;
      let latestUsage: any = null;

      for (const currentModel of modelsToTry) {
        if (isAborted) break;

        // Try up to 2 times for 503 spikes on the current model before falling back
        for (let subAttempt = 0; subAttempt < 2; subAttempt++) {
          if (isAborted) break;
          try {
            const streamConfig: any = {
              temperature: 0.3,
            };

            const responseStream = await ai.models.generateContentStream({
              model: currentModel,
              contents: prompt,
              config: streamConfig,
            });

            for await (const chunk of responseStream) {
              if (isAborted) break;

              let text = "";
              try {
                text = chunk.text || "";
              } catch {
                text = "";
              }

              if (!text && chunk.candidates?.[0]?.content?.parts) {
                text = chunk.candidates[0].content.parts
                  .map((p: any) => (typeof p.text === "string" ? p.text : ""))
                  .join("");
              }

              if (chunk.usageMetadata) {
                latestUsage = {
                  promptTokens: chunk.usageMetadata.promptTokenCount || 0,
                  candidatesTokens: chunk.usageMetadata.candidatesTokenCount || 0,
                  totalTokens: chunk.usageMetadata.totalTokenCount || 0,
                };
              }

              if (text) {
                streamedAny = true;
                res.write(`data: ${JSON.stringify({ text, model: currentModel })}\n\n`);
              }
            }

            if (isAborted) {
              return res.end();
            }

            if (streamedAny) {
              if (latestUsage) {
                res.write(`data: ${JSON.stringify({ usage: latestUsage, model: currentModel })}\n\n`);
              }
              res.write("data: [DONE]\n\n");
              return res.end();
            }
          } catch (err: any) {
            lastErr = err;
            const errMsg = err?.message || "";
            const is503 = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
            if (streamedAny) {
              // Already started streaming data to client, cannot restart stream mid-way
              break;
            }
            if (is503 && subAttempt === 0) {
              // Quick 600ms pause and retry once on temporary 503 spike
              await new Promise((resolve) => setTimeout(resolve, 600));
              continue;
            }
            break; // Move to next fallback model
          }
        }
        if (streamedAny || isAborted) {
          break;
        }
      }

      if (isAborted) return res.end();

      if (!streamedAny) {
        res.write(`data: ${JSON.stringify({ error: "GENERATION_FAILED", message: lastErr?.message || "Error al conectar con Gemini." })}\n\n`);
      } else {
        if (latestUsage) {
          res.write(`data: ${JSON.stringify({ usage: latestUsage })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
      }
      return res.end();
    }

    // OpenAI Compatible Provider Stream
    let baseUrl = (requestEndpoint || "").trim().replace(/\/+$/, "");
    if (!baseUrl) {
      if (providerId === "deepseek") baseUrl = "https://api.deepseek.com/v1";
      else if (providerId === "groq") baseUrl = "https://api.groq.com/openai/v1";
      else if (providerId === "openrouter") baseUrl = "https://openrouter.ai/api/v1";
      else if (providerId === "openai") baseUrl = "https://api.openai.com/v1";
      else if (providerId === "local_ollama") baseUrl = "http://localhost:11434/v1";
      else baseUrl = "https://api.openai.com/v1";
    }

    const modelName = requestModel || (providerId === "deepseek" ? "deepseek-chat" : providerId === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (requestApiKey && requestApiKey.trim()) {
      headers["Authorization"] = `Bearer ${requestApiKey.trim()}`;
    }

    const targetUrl = `${baseUrl}/chat/completions`;
    const openAiRes = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 16384,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!openAiRes.ok) {
      const errText = await openAiRes.text().catch(() => "");
      res.write(`data: ${JSON.stringify({ error: `HTTP ${openAiRes.status}`, message: errText })}\n\n`);
      return res.end();
    }

    const reader = openAiRes.body?.getReader();
    const decoder = new TextDecoder();
    let openAiUsage: any = null;

    if (reader) {
      while (true) {
        if (isAborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        const decoded = decoder.decode(value, { stream: true });
        const lines = decoded.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.usage) {
                openAiUsage = {
                  promptTokens: parsed.usage.prompt_tokens || 0,
                  candidatesTokens: parsed.usage.completion_tokens || 0,
                  totalTokens: parsed.usage.total_tokens || 0,
                };
              }
              const text = parsed.choices?.[0]?.delta?.content || "";
              if (text) {
                res.write(`data: ${JSON.stringify({ text, model: modelName })}\n\n`);
              }
            } catch {}
          }
        }
      }
    }

    if (isAborted) return res.end();

    if (openAiUsage) {
      res.write(`data: ${JSON.stringify({ usage: openAiUsage, model: modelName })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    return res.end();
  } catch (error: any) {
    if (!isAborted) {
      console.error("Error en streaming de temario:", error);
      res.write(`data: ${JSON.stringify({ error: "SERVER_ERROR", message: error.message })}\n\n`);
    }
    return res.end();
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Exams Builder server running at http://localhost:${PORT}`);
  });

  server.setTimeout(600000); // 10 minutes timeout for heavy stress-tests
  server.keepAliveTimeout = 610000;
  server.headersTimeout = 620000;
}

startServer();
