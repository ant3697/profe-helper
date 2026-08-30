import { ExamData, ExamQuestion, ExamBlock } from "../types/exam";

/**
 * Sanitizes option text by removing duplicated letter prefixes (e.g. "a)", "Opción A:", "[A]")
 * and removing any leaked annotations (e.g. "(Correcta)", "(Verdadera)", "(Distractor)").
 */
export function cleanOptionText(text: string): string {
  if (!text || typeof text !== "string") return "";
  let clean = text.trim();
  
  // 1. Strip leading option identifiers like "Opción A:", "Opción A -", "Opción A", "a)", "A.", "[a]", "(A)"
  clean = clean.replace(/^(?:opci[oó]n\s+[a-d][\s:\.\-\)]*|[a-d][\.\)\:\-]\s*|\[[a-d]\]\s*|\([a-d]\)\s*)/i, "").trim();
  
  // 2. Strip trailing correctness or distractor annotations if any leaked from raw generation
  clean = clean.replace(/\s*[\(\[]\s*(?:correcta|verdadera|falsa|incorrecta|distractor[^\)\]]*|respuesta correcta|desarrollo clave[^\)\]]*|condici[oó]n no aplicable[^\)\]]*|par[aá]metro fuera[^\)\]]*)\s*[\)\]]\s*$/i, "").trim();
  
  return clean || text.trim();
}

export function parseGIFT(text: string): ExamData {
  if (!text || typeof text !== "string") {
    throw new Error("Texto GIFT vacío o no válido.");
  }

  const sections = text.split(/(?=\/\/\s*Bloque:)/i);
  const blocks: ExamBlock[] = [];
  let globalQIdx = 0;

  sections.forEach((sec) => {
    const trimmedSec = sec.trim();
    if (!trimmedSec) return;

    let blockTitle = "Banco Moodle GIFT";
    const blockTitleMatch = trimmedSec.match(/^\/\/\s*Bloque:\s*(.+)$/m);
    if (blockTitleMatch) {
      blockTitle = blockTitleMatch[1].trim();
    }

    const questions: ExamQuestion[] = [];
    let currentIndex = 0;

    while (currentIndex < trimmedSec.length) {
      const braceStart = trimmedSec.indexOf("{", currentIndex);
      if (braceStart === -1) break;

      const braceEnd = trimmedSec.indexOf("}", braceStart);
      if (braceEnd === -1) break;

      const headerRaw = trimmedSec.substring(currentIndex, braceStart);
      const optionsRaw = trimmedSec.substring(braceStart + 1, braceEnd);
      currentIndex = braceEnd + 1;

      // Clean header: remove comment lines (//...) and empty lines
      const cleanHeaderLines = headerRaw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("//"));

      const cleanHeader = cleanHeaderLines.join(" ").trim();
      if (!cleanHeader && !optionsRaw.trim()) continue;

      let enunciado = cleanHeader;
      const titleMatch = cleanHeader.match(/^::(.*?)::\s*(.*)$/);
      if (titleMatch) {
        enunciado = titleMatch[2].trim() || titleMatch[1].trim();
      }

      // Parse options inside { ... }
      const options: string[] = [];
      let indiceCorrecta = 0;
      let justificacion = "";

      // Match all option tokens starting with = or ~
      const optionTokenRegex = /([=~])\s*([\s\S]*?)(?=(?:[=~]|$))/g;
      let optMatch: RegExpExecArray | null;

      while ((optMatch = optionTokenRegex.exec(optionsRaw)) !== null) {
        const isCorrect = optMatch[1] === "=";
        const rawContent = optMatch[2].trim();
        if (!rawContent) continue;

        let optText = rawContent;
        const hashIdx = rawContent.indexOf("#");
        if (hashIdx !== -1) {
          optText = rawContent.substring(0, hashIdx).trim();
          const feedback = rawContent.substring(hashIdx + 1).trim();
          if (feedback && !justificacion) {
            justificacion = feedback;
          }
        }

        // Unescape standard GIFT characters
        optText = optText.replace(/\\([=~#{}])/g, "$1").trim();
        const cleaned = cleanOptionText(optText);
        if (cleaned) {
          options.push(cleaned);
          if (isCorrect) {
            indiceCorrecta = options.length - 1;
          }
        }
      }

      if (enunciado && options.length >= 2) {
        questions.push({
          enunciado: enunciado.replace(/\\([=~#{}])/g, "$1").trim(),
          opciones: options,
          indiceCorrecta,
          justificacion: justificacion || "Retroalimentación técnica extraída del formato GIFT.",
          origQId: globalQIdx++,
          opcionesObjs: options.map((txt, oIdx) => ({
            text: txt,
            isCorrect: oIdx === indiceCorrecta,
            origOId: oIdx,
          })),
        });
      }
    }

    if (questions.length > 0) {
      blocks.push({
        titulo: blockTitle,
        preguntas: questions,
      });
    }
  });

  if (blocks.length === 0) {
    throw new Error("No se encontraron preguntas válidas en formato GIFT.");
  }

  return {
    bloques: blocks,
  };
}

export function parseTXTCompleto(text: string): ExamData {
  const lines = text.split(/\r?\n/);
  const questions: ExamQuestion[] = [];
  let currentQ: Partial<ExamQuestion> | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("- ")) {
      if (currentQ && currentQ.opciones && currentQ.opciones.length > 0) {
        const cleanedOpts = currentQ.opciones.map(cleanOptionText);
        const optObjs = cleanedOpts.map((opt, oIdx) => ({
          text: opt,
          isCorrect: oIdx === (currentQ!.indiceCorrecta || 0),
          origOId: oIdx,
        }));
        questions.push({
          enunciado: currentQ.enunciado || "",
          opciones: cleanedOpts,
          indiceCorrecta: currentQ.indiceCorrecta || 0,
          justificacion: currentQ.justificacion || "Examen importado desde archivo de texto plano.",
          origQId: questions.length,
          opcionesObjs: optObjs,
        });
      }
      currentQ = {
        enunciado: trimmed.substring(2).trim(),
        opciones: [],
        indiceCorrecta: 0,
        justificacion: "Examen importado desde archivo de texto plano.",
      };
    } else if (currentQ && currentQ.opciones) {
      let isCorrect = false;
      let optText = trimmed;

      const correctRegex = /\s*[\(\[]?\s*correcta\s*[\)\]]?\s*$/i;
      if (correctRegex.test(trimmed)) {
        isCorrect = true;
        optText = trimmed.replace(correctRegex, "").trim();
      }

      currentQ.opciones.push(cleanOptionText(optText));
      if (isCorrect) {
        currentQ.indiceCorrecta = currentQ.opciones.length - 1;
      }
    }
  });

  if (currentQ && currentQ.opciones && currentQ.opciones.length > 0) {
    const cleanedOpts = currentQ.opciones.map(cleanOptionText);
    const optObjs = cleanedOpts.map((opt, oIdx) => ({
      text: opt,
      isCorrect: oIdx === (currentQ!.indiceCorrecta || 0),
      origOId: oIdx,
    }));
    questions.push({
      enunciado: currentQ.enunciado || "",
      opciones: cleanedOpts,
      indiceCorrecta: currentQ.indiceCorrecta || 0,
      justificacion: currentQ.justificacion || "Examen importado desde archivo de texto plano.",
      origQId: questions.length,
      opcionesObjs: optObjs,
    });
  }

  if (questions.length === 0) {
    throw new Error("No se encontraron preguntas estructuradas en el archivo TXT.");
  }

  return {
    bloques: [
      {
        titulo: "Examen Importado (TXT)",
        preguntas: questions,
      },
    ],
  };
}

export function parseHTMLDoc(htmlText: string): ExamData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const blocks: ExamBlock[] = [];

  const h2s = doc.querySelectorAll("h2");

  if (h2s.length === 0) {
    const standaloneCards = doc.querySelectorAll(".question-block, .p-4.rounded-xl.bg-surface");
    if (standaloneCards.length > 0) {
      const questions: ExamQuestion[] = [];
      standaloneCards.forEach((card, cIdx) => {
        const qTextEl = card.querySelector(".markdown-body") || card.querySelector("div");
        if (!qTextEl) return;
        const enunciado = qTextEl.textContent?.replace(/^\s*\d+\.?\s*/, "").trim() || "";

        const options: string[] = [];
        let indiceCorrecta = 0;
        const optButtons = card.querySelectorAll(".option-btn");
        optButtons.forEach((btn, btnIdx) => {
          const raw = btn.textContent || "";
          options.push(cleanOptionText(raw));
          if (btn.getAttribute("data-correct") === "true" || btn.classList.contains("correct")) {
            indiceCorrecta = btnIdx;
          }
        });

        const justBox = card.querySelector(".justification-box .markdown-body") || card.querySelector(".justification-box");
        const justificacion = justBox
          ? justBox.textContent?.replace(/Retroalimentación Formativa/g, "").trim() || ""
          : "Retroalimentación recuperada.";

        questions.push({
          enunciado,
          opciones: options,
          indiceCorrecta,
          justificacion,
          origQId: cIdx,
          opcionesObjs: options.map((txt, oIdx) => ({
            text: txt,
            isCorrect: oIdx === indiceCorrecta,
            origOId: oIdx,
          })),
        });
      });

      return {
        bloques: [{ titulo: "Examen Importado (HTML)", preguntas: questions }],
      };
    }
    throw new Error("Formato HTML no reconocido como examen.");
  }

  h2s.forEach((h2) => {
    const title = h2.textContent?.trim() || "Bloque";
    const parentDiv = h2.closest("div") || doc.body;

    const questions: ExamQuestion[] = [];
    const qCards = parentDiv.querySelectorAll(".question-block, .p-4.rounded-xl.bg-surface");
    qCards.forEach((card, cIdx) => {
      const qTextEl = card.querySelector(".markdown-body") || card.querySelector("strong");
      if (!qTextEl) return;

      const enunciado = qTextEl.textContent?.replace(/^\s*\d+\.?\s*/, "").trim() || "";
      const options: string[] = [];
      let indiceCorrecta = 0;

      const optButtons = card.querySelectorAll(".option-btn");
      optButtons.forEach((btn, btnIdx) => {
        const text = btn.textContent || "";
        options.push(cleanOptionText(text));
        if (btn.getAttribute("data-correct") === "true" || btn.classList.contains("correct")) {
          indiceCorrecta = btnIdx;
        }
      });

      const justBox = card.querySelector(".justification-box");
      const justificacion = justBox ? justBox.textContent?.trim() || "" : "Retroalimentación recuperada.";

      if (enunciado && options.length > 0) {
        questions.push({
          enunciado,
          opciones: options,
          indiceCorrecta,
          justificacion,
          origQId: cIdx,
          opcionesObjs: options.map((txt, oIdx) => ({
            text: txt,
            isCorrect: oIdx === indiceCorrecta,
            origOId: oIdx,
          })),
        });
      }
    });

    if (questions.length > 0) {
      blocks.push({
        titulo: title,
        preguntas: questions,
      });
    }
  });

  if (blocks.length === 0) {
    throw new Error("No se pudieron extraer preguntas del archivo HTML.");
  }

  return { bloques: blocks };
}

export function parseJSONExam(text: string): ExamData {
  const parsed = JSON.parse(text);
  let examData: ExamData;

  if (Array.isArray(parsed)) {
    examData = { bloques: [{ titulo: "Examen Importado (JSON)", preguntas: parsed }] };
  } else if (parsed && parsed.bloques && Array.isArray(parsed.bloques)) {
    examData = parsed;
  } else if (parsed && parsed.preguntas && Array.isArray(parsed.preguntas)) {
    examData = { bloques: [{ titulo: "Examen Importado (JSON)", preguntas: parsed.preguntas }] };
  } else {
    throw new Error("JSON sin estructura de bloques o preguntas válida.");
  }

  // Ensure normalized object options and sanitized option texts
  examData.bloques.forEach((b) => {
    b.preguntas.forEach((q, qIdx) => {
      q.origQId = qIdx;
      if (Array.isArray(q.opciones)) {
        q.opciones = q.opciones.map(cleanOptionText);
      }
      if (!q.opcionesObjs || q.opcionesObjs.length !== q.opciones.length) {
        q.opcionesObjs = q.opciones.map((txt, oIdx) => ({
          text: txt,
          isCorrect: oIdx === q.indiceCorrecta,
          origOId: oIdx,
        }));
      }
    });
  });

  return examData;
}
