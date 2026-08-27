import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import {
  sanitizeGeminiModel,
  generateWithGeminiRetry,
  extractJSONFromText,
} from "../services/geminiService";

export const apiRouter = Router();

// Health Check Endpoint
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "DocuExam Generator Engine",
  });
});

// Test Provider Connection Endpoint
apiRouter.post("/test-provider", async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      providerId = "gemini",
      apiKey = "",
      endpoint = "",
      model = "",
    } = req.body;

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
      await generateWithGeminiRetry(ai, {
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
