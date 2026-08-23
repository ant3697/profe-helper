async function runAudit() {
  console.log("=== INICIANDO AUDITORÍA TÉCNICA, FUNCIONAL Y ESTRÉS ===");
  const results = {
    timestamp: new Date().toISOString(),
    passed: 0,
    failed: 0,
    tests: [],
  };

  const BASE_URL = "http://localhost:3000";

  // Test 1: Ingress & Health Endpoint
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    const duration = Date.now() - t0;
    if (res.status === 200 && data.status === "ok") {
      results.passed++;
      results.tests.push({ name: "1. Health & Server Ingress", status: "PASSED", latencyMs: duration, info: data });
    } else {
      throw new Error(`Respuesta inválida: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name: "1. Health & Server Ingress", status: "FAILED", error: e.message });
  }

  // Test 2: AI Provider Connectivity Test with Gemini 3.7 Flash
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/test-provider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: "gemini",
        model: "gemini-3.7-flash",
      }),
    });
    const data = await res.json();
    const duration = Date.now() - t0;
    if (res.ok && data.success) {
      results.passed++;
      results.tests.push({ name: "2. Conectividad Gemini API (Internal Key)", status: "PASSED", latencyMs: duration, model: data.model, info: data.message });
    } else {
      throw new Error(data.message || data.error || "Fallo de conexión");
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name: "2. Conectividad Gemini API", status: "FAILED", error: e.message });
  }

  // Test 3: Structured Generation & Strict Schema Validation
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/generate-exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        difficulty: "standard",
        numQuestions: 4,
        customPrompt: "Examen de evaluación técnica sobre Ciclos Termodinámicos y Fluidos Refrigerantes.",
        providerId: "gemini",
        model: "gemini-3.7-flash",
      }),
    });
    const data = await res.json();
    const duration = Date.now() - t0;
    
    if (!res.ok || !data.data || !data.data.bloques) {
      throw new Error(`Fallo en generación: ${JSON.stringify(data)}`);
    }

    const bloques = data.data.bloques;
    let totalQuestions = 0;
    let validQuestions = true;
    const questionsSample = [];

    for (const b of bloques) {
      for (const q of b.preguntas) {
        totalQuestions++;
        if (!q.enunciado || !Array.isArray(q.opciones) || q.opciones.length !== 4) {
          validQuestions = false;
        }
        if (typeof q.indiceCorrecta !== "number" || q.indiceCorrecta < 0 || q.indiceCorrecta > 3) {
          validQuestions = false;
        }
        if (!q.justificacion || q.justificacion.length < 5) {
          validQuestions = false;
        }
        if (questionsSample.length < 2) {
          questionsSample.push({
            enunciado: q.enunciado.substring(0, 80) + "...",
            correcta: q.opciones[q.indiceCorrecta],
            justificacion: q.justificacion.substring(0, 80) + "...",
          });
        }
      }
    }

    if (validQuestions && totalQuestions >= 4) {
      results.passed++;
      results.tests.push({
        name: "3. Generación Estructurada (JSON Schema + 4 opciones + justificación técnica)",
        status: "PASSED",
        latencyMs: duration,
        totalQuestions,
        sample: questionsSample,
        tokens: data.usage,
      });
    } else {
      throw new Error(`Validación de estructura falló: Total=${totalQuestions}, Valid=${validQuestions}`);
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name: "3. Generación Estructurada", status: "FAILED", error: e.message });
  }

  // Test 4: Extreme Stress Test - Concurrent Requests (Oposiciones 205 + Killer Mode)
  try {
    console.log("Ejecutando prueba de estrés extrema concurrente (3 peticiones en paralelo)...");
    const t0 = Date.now();
    const stressPromises = [
      { id: 1, prompt: "Oposiciones Esp. 205 (Equipos Térmicos y Fluidos): Instalaciones Frigoríficas y Calefacción", diff: "killer", n: 4 },
      { id: 2, prompt: "Reglamento Electrotécnico de Baja Tensión (REBT) ITC-BT-28 y protecciones", diff: "standard", n: 2 },
      { id: 3, prompt: "Auditoría Energética y Código Técnico de la Edificación CTE-HE", diff: "easy", n: 2 },
    ].map((item) =>
      fetch(`${BASE_URL}/api/generate-exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: item.diff,
          numQuestions: item.n,
          customPrompt: item.prompt,
          providerId: "gemini",
          model: "gemini-3.7-flash",
        }),
      }).then(async (r) => {
        const json = await r.json();
        return { status: r.status, ok: r.ok, json };
      })
    );

    const stressResponses = await Promise.all(stressPromises);
    const duration = Date.now() - t0;
    const allSuccessful = stressResponses.every(r => r.ok && r.json && r.json.data && r.json.data.bloques);

    if (allSuccessful) {
      results.passed++;
      results.tests.push({
        name: "4. Prueba de Estrés Concurrente (3 peticiones en paralelo: Opo 205, REBT, CTE-HE)",
        status: "PASSED",
        totalTimeMs: duration,
        avgLatencyMs: Math.round(duration / 3),
        concurrentThroughput: `${(3 / (duration / 1000)).toFixed(2)} req/s`,
      });
    } else {
      throw new Error(`Fallo en concurrencia: ${JSON.stringify(stressResponses)}`);
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name: "4. Prueba de Estrés Concurrente", status: "FAILED", error: e.message });
  }

  // Test 5: OCR PDF and Image Input Validation
  try {
    const t0 = Date.now();
    const resEmpty = await fetch(`${BASE_URL}/api/ocr-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const samplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const resSample = await fetch(`${BASE_URL}/api/ocr-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: samplePngBase64,
        mimeType: "image/png",
        fileName: "test_doc.png",
      }),
    });
    const sampleData = await resSample.json();
    const duration = Date.now() - t0;

    if (resEmpty.status === 400 && (resSample.status === 200 || sampleData.text !== undefined || sampleData.error === "EMPTY_OCR")) {
      results.passed++;
      results.tests.push({
        name: "5. Endpoint OCR y Gestión Robusta de Errores",
        status: "PASSED",
        latencyMs: duration,
        handling: "Correct HTTP 400 validation on empty payload & clean handling of image buffer",
      });
    } else {
      throw new Error(`Fallo en OCR: ${JSON.stringify(sampleData)}`);
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name: "5. Endpoint OCR", status: "FAILED", error: e.message });
  }

  console.log("\n==========================================");
  console.log("    INFORME DETALLADO DE AUDITORÍA");
  console.log("==========================================");
  console.log(`Total Pruebas: ${results.passed + results.failed}`);
  console.log(`Pruebas Superadas (PASS): ${results.passed}`);
  console.log(`Pruebas Fallidas (FAIL): ${results.failed}`);
  console.log("==========================================");
  console.log(JSON.stringify(results, null, 2));
}

runAudit();
