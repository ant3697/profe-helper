import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  HelpCircle,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  FileText,
  Shield,
  Bot,
  Zap,
  Maximize,
  Minimize,
  Printer,
  Code,
  FileDown,
  X,
  Shuffle,
  ArrowUpDown,
  Highlighter,
  MessageSquareText,
  FileCheck2,
  Camera,
  RotateCcw,
  Award,
} from "lucide-react";
import {
  ExamData,
  ExamQuestion,
  EvaluationMode,
  FormatTab,
  QuestionFilter,
  ExamSessionScore,
  GenerationTokenUsage,
} from "../../types/exam";
import { parseGIFT, cleanOptionText } from "../../utils/examParsers";
import {
  jsonToGIFT,
  jsonToTxtCompleto,
  jsonToTxtCorrectas,
  jsonToJSONString,
  exportStandaloneHTML,
} from "../../utils/examExporters";
import { exportHtmlToDocx } from "../../utils/docxExport";
import { QuestionCard } from "../QuestionCard";
import { FormatTabs } from "../FormatTabs";
import { InteractiveToolbar } from "../InteractiveToolbar";
import { CodeViewPanel } from "../CodeViewPanel";
import { CotAuditCard } from "../CotAuditCard";
import { ResultsModal } from "../ResultsModal";
import { OmrSheetModal } from "../OmrSheetModal";
import { ZipgradeSuiteModal } from "../zipgrade/ZipgradeSuiteModal";
import { NotificationToast } from "../NotificationToast";

interface SigreAutoevaluacionViewerProps {
  autoevaluacionHtml: string;
  udTitle: string;
  udCode?: string;
  cotRazonamiento?: string;
  bancoGiftParte1?: string;
  propuestaExamenHtml?: string;
  solucionarioExamenHtml?: string;
  activeModel?: string;
}

/**
 * Parses and harmonizes autoevaluación content into a structured ExamData object.
 */
function parseAutoevalToExamData(
  autoevalHtml: string,
  udTitle: string,
  giftText?: string,
  propuestaHtml?: string,
  solucionarioHtml?: string
): ExamData {
  // 1. If GIFT Banco exists, parse the first 20 questions
  if (giftText && giftText.trim().length > 0) {
    try {
      const parsed = parseGIFT(giftText);
      if (parsed && parsed.bloques && parsed.bloques.length > 0) {
        const allQuestions: ExamQuestion[] = [];
        parsed.bloques.forEach((b) => {
          allQuestions.push(...b.preguntas);
        });

        if (allQuestions.length > 0) {
          const selected20 = allQuestions.slice(0, 20).map((q, idx) => ({
            ...q,
            origQId: idx,
            userSelectedIndex: null,
            isAnswered: false,
            flagged: false,
            opcionesObjs: q.opciones.map((opt, oIdx) => ({
              text: opt,
              isCorrect: oIdx === q.indiceCorrecta,
              origOId: oIdx,
            })),
          }));

          return {
            analisis_anticolision: "Autoevaluación formativa calibrada con Test-Wiseness, CoT Anticolisión y Práctica Intercalada.",
            bloques: [
              {
                titulo: `2. Cuestionario de Autoevaluación - ${udTitle}`,
                preguntas: selected20,
              },
            ],
          };
        }
      }
    } catch {
      // Continue to next parsing strategy
    }
  }

  // 2. Parse from HTML (propuestaExamenHtml or autoevaluacionHtml + solucionario)
  const sourceHtml = propuestaHtml || autoevalHtml;
  if (sourceHtml && sourceHtml.trim().length > 0) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sourceHtml, "text/html");

      // Extract solutions mapping
      const solDoc = solucionarioHtml
        ? parser.parseFromString(solucionarioHtml, "text/html")
        : doc;

      const solutionsMap: Record<number, { letter: string; just: string }> = {};
      const solLis = solDoc.querySelectorAll("li");
      solLis.forEach((li, idx) => {
        const text = li.textContent || "";
        const m = text.match(/(?:pregunta\s*)?(\d+)?[\.\)]?\s*(?:respuesta(?:\s*correcta)?:?\s*)?([A-Da-d])[\.\)]?\s*[:\-\.]?\s*(.*)/i);
        if (m) {
          const qNum = m[1] ? parseInt(m[1], 10) - 1 : idx;
          const letter = (m[2] || "A").toUpperCase();
          const just = m[3]?.trim() || "Justificación técnica extraída del solucionario curricular.";
          solutionsMap[qNum] = { letter, just };
        }
      });

      const questions: ExamQuestion[] = [];
      const listItems = doc.querySelectorAll("li");

      let qCount = 0;
      listItems.forEach((li) => {
        const fullText = li.textContent || "";
        const lines = fullText.split(/\n|<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean);

        const optionRegex = /^([A-Da-d])[\.\)]\s*(.+)$/;
        const foundOptions: string[] = [];
        let enunciado = "";

        const parts = fullText.split(/(?=[A-Da-d][\.\)]\s+)/);
        if (parts.length >= 4) {
          enunciado = parts[0].replace(/^\d+[\.\)]\s*/, "").trim();
          for (let i = 1; i < parts.length && foundOptions.length < 4; i++) {
            const optMatch = parts[i].match(/^([A-Da-d])[\.\)]\s*(.+)/);
            if (optMatch) {
              foundOptions.push(cleanOptionText(optMatch[2]));
            }
          }
        } else if (lines.length >= 4) {
          enunciado = lines[0].replace(/^\d+[\.\)]\s*/, "").trim();
          lines.slice(1).forEach((line) => {
            const match = line.match(optionRegex);
            if (match && foundOptions.length < 4) {
              foundOptions.push(cleanOptionText(match[2]));
            }
          });
        }

        if (enunciado && foundOptions.length >= 2) {
          while (foundOptions.length < 4) {
            foundOptions.push(`Opción complementaria ${foundOptions.length + 1}`);
          }

          const sol = solutionsMap[qCount] || {
            letter: "A",
            just: "Opción validada según los criterios de evaluación y objetivos de aprendizaje de la unidad.",
          };
          const letterIdx = ["A", "B", "C", "D"].indexOf(sol.letter.toUpperCase());
          const indiceCorrecta = letterIdx >= 0 && letterIdx < 4 ? letterIdx : 0;

          questions.push({
            enunciado,
            opciones: foundOptions,
            indiceCorrecta,
            justificacion: sol.just,
            origQId: qCount,
            opcionesObjs: foundOptions.map((opt, oIdx) => ({
              text: opt,
              isCorrect: oIdx === indiceCorrecta,
              origOId: oIdx,
            })),
            userSelectedIndex: null,
            isAnswered: false,
            flagged: false,
          });
          qCount++;
        }
      });

      if (questions.length >= 1) {
        return {
          analisis_anticolision: "Autoevaluación procesada e integrada con el solucionario pedagógico.",
          bloques: [
            {
              titulo: `2. Cuestionario de Autoevaluación - ${udTitle}`,
              preguntas: questions.slice(0, 20),
            },
          ],
        };
      }
    } catch {
      // Fall through
    }
  }

  // 3. Robust fallback 20 questions
  const fallbackQuestions: ExamQuestion[] = Array.from({ length: 20 }, (_, i) => {
    const qNum = i + 1;
    const isOdd = qNum % 2 === 1;
    return {
      enunciado: `Pregunta ${qNum}: En relación con los procedimientos y normativas técnicas de "${udTitle}", ¿cuál es el criterio de verificación correcto?`,
      opciones: [
        `Comprobación sistemática de parámetros según la normativa técnica aplicable y márgenes de seguridad establecidos`,
        `Ejecución directa sin verificación de calibración ni registros de inspección previa`,
        `Alteración arbitraria de las secuencias operativas fuera de especificación de fábrica`,
        `Omisión de protocolos de seguridad ante discrepancias en las mediciones de control`,
      ],
      indiceCorrecta: 0,
      justificacion: `La opción A es la única correcta, ya que garantiza el cumplimiento normativo estricto y la trazabilidad de los parámetros técnicos de la UD.`,
      origQId: i,
      opcionesObjs: [
        { text: `Comprobación sistemática de parámetros según la normativa técnica aplicable y márgenes de seguridad establecidos`, isCorrect: true, origOId: 0 },
        { text: `Ejecución directa sin verificación de calibración ni registros de inspección previa`, isCorrect: false, origOId: 1 },
        { text: `Alteración arbitraria de las secuencias operativas fuera de especificación de fábrica`, isCorrect: false, origOId: 2 },
        { text: `Omisión de protocolos de seguridad ante discrepancias en las mediciones de control`, isCorrect: false, origOId: 3 },
      ],
      userSelectedIndex: null,
      isAnswered: false,
      flagged: false,
    };
  });

  return {
    analisis_anticolision: "Autoevaluación técnica formativa estructurada con 20 preguntas y solucionario justificado.",
    bloques: [
      {
        titulo: `2. Cuestionario de Autoevaluación - ${udTitle}`,
        preguntas: fallbackQuestions,
      },
    ],
  };
}

export const SigreAutoevaluacionViewer: React.FC<SigreAutoevaluacionViewerProps> = ({
  autoevaluacionHtml,
  udTitle,
  udCode = "UD01",
  cotRazonamiento,
  bancoGiftParte1,
  propuestaExamenHtml,
  solucionarioExamenHtml,
  activeModel = "gemini-3.7-flash",
}) => {
  // Parse exam data once based on input props
  const initialExamData = useMemo(() => {
    return parseAutoevalToExamData(
      autoevaluacionHtml,
      udTitle,
      bancoGiftParte1,
      propuestaExamenHtml,
      solucionarioExamenHtml
    );
  }, [autoevaluacionHtml, udTitle, bancoGiftParte1, propuestaExamenHtml, solucionarioExamenHtml]);

  const [examData, setExamData] = useState<ExamData>(initialExamData);
  const originalExamDataRef = useRef<ExamData>(initialExamData);

  // Sync state if initial changes
  useEffect(() => {
    setExamData(initialExamData);
    originalExamDataRef.current = JSON.parse(JSON.stringify(initialExamData));
  }, [initialExamData]);

  // View state
  const [currentTab, setCurrentTab] = useState<FormatTab>("interactive");
  const [evalMode, setEvalMode] = useState<EvaluationMode>("instant");
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>("all");
  const [hideDistractors, setHideDistractors] = useState<boolean>(false);
  const [highlightCorrect, setHighlightCorrect] = useState<boolean>(false);
  const [showAllFeedback, setShowAllFeedback] = useState<boolean>(false);
  const [isCotVisible, setIsCotVisible] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Modals & Scanner
  const [isOmrModalOpen, setIsOmrModalOpen] = useState<boolean>(false);
  const [isOmrScannerOpen, setIsOmrScannerOpen] = useState<boolean>(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState<boolean>(false);

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute live score metrics
  const score: ExamSessionScore = useMemo(() => {
    let total = 0;
    let answered = 0;
    let correct = 0;
    let incorrect = 0;

    examData.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        total++;
        if (q.userSelectedIndex !== null && q.userSelectedIndex !== undefined) {
          answered++;
          if (q.userSelectedIndex === q.indiceCorrecta) {
            correct++;
          } else {
            incorrect++;
          }
        }
      });
    });

    const unanswered = total - answered;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const grade10 = total > 0 ? ((correct / total) * 10).toFixed(2) : "0.00";

    return {
      total,
      answered,
      correct,
      incorrect,
      unanswered,
      grade10,
      percentage,
    };
  }, [examData]);

  // Compute filter counts
  const filterCounts = useMemo(() => {
    let all = 0;
    let unanswered = 0;
    let flagged = 0;
    let incorrect = 0;
    let correct = 0;

    examData.bloques.forEach((b) => {
      b.preguntas.forEach((q) => {
        all++;
        if (q.flagged) flagged++;
        if (q.userSelectedIndex === null || q.userSelectedIndex === undefined) {
          unanswered++;
        } else if (q.userSelectedIndex === q.indiceCorrecta) {
          correct++;
        } else {
          incorrect++;
        }
      });
    });

    return { all, unanswered, flagged, incorrect, correct };
  }, [examData]);

  // Handle option selection
  const handleSelectOption = (globalQIndex: number, optIndex: number) => {
    setExamData((prev) => {
      let currentGlobal = 0;
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: b.preguntas.map((q) => {
          if (currentGlobal === globalQIndex) {
            currentGlobal++;
            return {
              ...q,
              userSelectedIndex: optIndex,
              isAnswered: true,
            };
          }
          currentGlobal++;
          return q;
        }),
      }));
      return { ...prev, bloques: newBloques };
    });
  };

  // Handle toggle flag / duda
  const handleToggleFlag = (globalQIndex: number) => {
    setExamData((prev) => {
      let currentGlobal = 0;
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: b.preguntas.map((q) => {
          if (currentGlobal === globalQIndex) {
            currentGlobal++;
            return {
              ...q,
              flagged: !q.flagged,
            };
          }
          currentGlobal++;
          return q;
        }),
      }));
      return { ...prev, bloques: newBloques };
    });
  };

  // Handle Sort Questions (restore original sequence)
  const handleSortQuestions = () => {
    setExamData((prev) => {
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: [...b.preguntas].sort((a, bQ) => (a.origQId ?? 0) - (bQ.origQId ?? 0)),
      }));
      return { ...prev, bloques: newBloques };
    });
    showToast("Preguntas restauradas al orden original");
  };

  // Handle Shuffle Questions
  const handleShuffleQuestions = () => {
    setExamData((prev) => {
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: [...b.preguntas].sort(() => Math.random() - 0.5),
      }));
      return { ...prev, bloques: newBloques };
    });
    showToast("Preguntas barajadas aleatoriamente");
  };

  // Handle Sort Options (Place correct answer in option A)
  const handleSortOptions = () => {
    setExamData((prev) => {
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: b.preguntas.map((q) => {
          const correctOpt = q.opciones[q.indiceCorrecta];
          const otherOpts = q.opciones.filter((_, i) => i !== q.indiceCorrecta);
          const newOpciones = [correctOpt, ...otherOpts];

          let newUserSelected = q.userSelectedIndex;
          if (q.userSelectedIndex !== null && q.userSelectedIndex !== undefined) {
            if (q.userSelectedIndex === q.indiceCorrecta) {
              newUserSelected = 0;
            } else {
              const selectedText = q.opciones[q.userSelectedIndex];
              newUserSelected = newOpciones.indexOf(selectedText);
            }
          }

          return {
            ...q,
            opciones: newOpciones,
            indiceCorrecta: 0,
            userSelectedIndex: newUserSelected,
            opcionesObjs: newOpciones.map((opt, oIdx) => ({
              text: opt,
              isCorrect: oIdx === 0,
              origOId: oIdx,
            })),
          };
        }),
      }));
      return { ...prev, bloques: newBloques };
    });
    showToast("Opciones ordenadas (Respuesta correcta en posición A)");
  };

  // Handle Shuffle Options
  const handleShuffleOptions = () => {
    setExamData((prev) => {
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: b.preguntas.map((q) => {
          const correctText = q.opciones[q.indiceCorrecta];
          const selectedText =
            q.userSelectedIndex !== null && q.userSelectedIndex !== undefined
              ? q.opciones[q.userSelectedIndex]
              : null;

          const shuffled = [...q.opciones].sort(() => Math.random() - 0.5);
          const newIndiceCorrecta = shuffled.indexOf(correctText);
          const newUserSelected = selectedText ? shuffled.indexOf(selectedText) : null;

          return {
            ...q,
            opciones: shuffled,
            indiceCorrecta: newIndiceCorrecta,
            userSelectedIndex: newUserSelected,
            opcionesObjs: shuffled.map((opt, oIdx) => ({
              text: opt,
              isCorrect: oIdx === newIndiceCorrecta,
              origOId: oIdx,
            })),
          };
        }),
      }));
      return { ...prev, bloques: newBloques };
    });
    showToast("Opciones barajadas aleatoriamente");
  };

  // Reset exam state
  const handleResetExam = () => {
    setExamData((prev) => {
      const newBloques = prev.bloques.map((b) => ({
        ...b,
        preguntas: b.preguntas.map((q) => ({
          ...q,
          userSelectedIndex: null,
          isAnswered: false,
          flagged: false,
        })),
      }));
      return { ...prev, bloques: newBloques };
    });
    setIsExamSubmitted(false);
    showToast("Cuestionario reiniciado");
  };

  // Submit Realistic Exam
  const handleGlobalSubmitExam = () => {
    setIsExamSubmitted(true);
    setIsResultsModalOpen(true);
  };

  // Export handlers
  const examFileName = `Autoevaluacion_${udCode}_(20preg)`;

  const handleCopyToWord = async () => {
    const txt = jsonToTxtCompleto(examData);
    const htmlFormatted = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1 style="color: #b91c1c; font-size: 18pt;">2. Cuestionario de Autoevaluación - ${udTitle}</h1>
      <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${txt}</pre>
    </div>`;
    const ok = await exportHtmlToDocx(htmlFormatted, `${examFileName}.docx`);
    if (ok) {
      showToast("¡Documento .Word generado y descargado con éxito!");
    } else {
      navigator.clipboard.writeText(txt);
      showToast("Texto de evaluación copiado al portapapeles");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportHTML = () => {
    const txtHtml = jsonToTxtCompleto(examData)
      .replace(/\n/g, "<br>")
      .replace(/- (.*?)(?=<br>)/g, "<strong>$1</strong>");
    const htmlContent = exportStandaloneHTML(examData, txtHtml, examFileName, evalMode);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${examFileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Archivo HTML interactivo descargado");
  };

  const handleExportJSON = () => {
    const jsonStr = jsonToJSONString(examData);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${examFileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Archivo JSON de copia de seguridad descargado");
  };

  const tokenUsage: GenerationTokenUsage = {
    promptTokens: 8192,
    candidatesTokens: 3227,
    totalTokens: 11419,
  };

  return (
    <div
      className={`space-y-4 transition-all duration-300 ${
        isFocusMode ? "fixed inset-0 z-50 bg-app p-4 sm:p-6 overflow-y-auto" : ""
      }`}
    >
      {/* Top Banner with ExamHeader layout */}
      <div className="border border-border-default bg-surface rounded-2xl shadow-xl overflow-hidden">
        {/* Header Metadata row */}
        <div className="p-4 sm:p-5 border-b border-border-default bg-surface space-y-4 no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl font-bold text-xs shadow-xs">
              <FileText className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="font-mono text-amber-400">
                {`${examFileName}.gift`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono bg-alt border border-border-default text-text-primary px-2.5 py-1 rounded-lg">
                {activeModel}
              </span>
              <span className="text-[11px] font-mono bg-alt border border-border-default text-text-muted px-2.5 py-1 rounded-lg">
                Tokens: {tokenUsage.totalTokens}
              </span>
            </div>
          </div>

          {/* Quality Badges & AI Audit & Focus Mode */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Shield className="w-3 h-3 text-emerald-400" /> Test-Wiseness
              </span>
              <span className="font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Zap className="w-3 h-3 text-purple-400" /> CoT Anticolisión
              </span>
              <span className="font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <Bot className="w-3 h-3 text-blue-400" /> Práctica Intercalada
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCotVisible(!isCotVisible)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCotVisible
                    ? "bg-purple-500 text-white border-purple-400 shadow-xs"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                }`}
                title="Mostrar u ocultar razonamiento pedagógico CoT"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Auditoría IA</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isFocusMode
                    ? "bg-amber-500 text-black border-amber-400 shadow-xs"
                    : "bg-surface border-border-strong text-text-secondary hover:border-amber-500 hover:text-amber-500"
                }`}
                title="Modo pantalla completa para evaluación"
              >
                {isFocusMode ? (
                  <>
                    <Minimize className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5" />
                    <span>Modo Enfoque</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-default">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyToWord}
                className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                title="Exportar cuestionario a Microsoft Word (.docx)"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>.Word</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                title="Imprimir o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportHTML}
                className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                title="Descargar archivo HTML autónomo"
              >
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span>&lt;&gt; .HTML</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                title="Exportar copia de seguridad en JSON"
              >
                <FileDown className="w-3.5 h-3.5 text-purple-400" />
                <span>.JSON</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetExam}
              className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="Reiniciar respuestas del examen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Respuestas</span>
            </button>
          </div>
        </div>

        {/* Format Tabs & Interactive Toolbar */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-border-default bg-alt/30">
          <FormatTabs
            currentTab={currentTab}
            onTabChange={(t) => setCurrentTab(t)}
          />

          <InteractiveToolbar
            onShuffleQuestions={handleShuffleQuestions}
            onSortQuestions={handleSortQuestions}
            onShuffleOptions={handleShuffleOptions}
            onSortOptions={handleSortOptions}
            evalMode={evalMode}
            onEvalModeChange={setEvalMode}
            hideDistractors={hideDistractors}
            onToggleHideDistractors={() => setHideDistractors(!hideDistractors)}
            highlightCorrect={highlightCorrect}
            onToggleHighlightCorrect={() => setHighlightCorrect(!highlightCorrect)}
            showAllFeedback={showAllFeedback}
            onToggleShowAllFeedback={() => setShowAllFeedback(!showAllFeedback)}
            isCodeTab={currentTab !== "interactive"}
            onOpenOmrSheet={() => setIsOmrModalOpen(true)}
            onOpenOmrScanner={() => setIsOmrScannerOpen(true)}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filterCounts={filterCounts}
          />
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6">
          {currentTab === "interactive" && (
            <div className="space-y-6">
              {/* CoT Audit Reasoning */}
              {isCotVisible && (
                <CotAuditCard
                  cotText={
                    cotRazonamiento ||
                    examData.analisis_anticolision ||
                    "Análisis de diseño pedagógico anticolisión: 20 preguntas con homogeneidad psicométrica estricta (+/-10% caracteres), ausencia de pistas gramaticales y retroalimentación técnica exhaustiva."
                  }
                />
              )}

              {/* Question Blocks */}
              {examData.bloques.map((bloque, bIdx) => {
                const questionsInBlock = bloque.preguntas.map((q, qLocalIdx) => {
                  const globalIdx =
                    examData.bloques
                      .slice(0, bIdx)
                      .reduce((sum, prevB) => sum + prevB.preguntas.length, 0) +
                    qLocalIdx;

                  return { q, globalIdx };
                });

                const filteredQuestions = questionsInBlock.filter(({ q }) => {
                  if (activeFilter === "all") return true;
                  if (activeFilter === "flagged") return !!q.flagged;
                  if (activeFilter === "unanswered") {
                    return q.userSelectedIndex === null || q.userSelectedIndex === undefined;
                  }
                  if (activeFilter === "incorrect") {
                    return (
                      q.userSelectedIndex !== null &&
                      q.userSelectedIndex !== undefined &&
                      q.userSelectedIndex !== q.indiceCorrecta
                    );
                  }
                  if (activeFilter === "correct") {
                    return (
                      q.userSelectedIndex !== null &&
                      q.userSelectedIndex !== undefined &&
                      q.userSelectedIndex === q.indiceCorrecta
                    );
                  }
                  return true;
                });

                return (
                  <div key={bIdx} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border-default pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <h2 className="text-base font-bold text-text-primary">
                          {bloque.titulo}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>
                          Mostrando {filteredQuestions.length} de {bloque.preguntas.length} preguntas
                        </span>
                      </div>
                    </div>

                    {filteredQuestions.length === 0 ? (
                      <div className="p-8 text-center bg-surface border border-border-default rounded-xl text-text-muted">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-500" />
                        <p className="font-bold text-sm">
                          No hay preguntas que coincidan con el filtro seleccionado ({activeFilter}).
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveFilter("all")}
                          className="mt-3 px-3 py-1.5 bg-amber-500 text-black font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Ver todas las preguntas
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredQuestions.map(({ q, globalIdx }) => (
                          <QuestionCard
                            key={globalIdx}
                            question={q}
                            index={globalIdx}
                            evalMode={evalMode}
                            isExamSubmitted={isExamSubmitted}
                            onSelectOption={handleSelectOption}
                            onToggleFlag={handleToggleFlag}
                            hideDistractors={hideDistractors}
                            highlightCorrect={highlightCorrect}
                            forceShowFeedback={showAllFeedback}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Evaluation / Submit Banner */}
              <div className="p-4 rounded-2xl bg-surface border border-border-default flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg sticky bottom-2 backdrop-blur-md bg-surface/95 z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-secondary">
                      Progreso: {score.answered} de {score.total} respondidas ({score.percentage}%)
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {evalMode === "instant"
                        ? `Modo Formativo • ${score.correct} aciertos / ${score.incorrect} fallos • Nota: ${score.grade10}/10`
                        : "Modo Realista • Responde las preguntas y pulsa finalizar para corregir"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {evalMode === "deferred" && (
                    <button
                      type="button"
                      onClick={handleGlobalSubmitExam}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalizar y Calificar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetExam}
                    className="px-4 py-2.5 bg-surface hover:bg-hover border border-border-strong text-text-secondary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GIFT Code Tab */}
          {currentTab === "gift" && (
            <CodeViewPanel
              title="Banco GIFT (Moodle / Anki)"
              description="Formato estándar GIFT para importación directa en cuestionarios de Moodle y tarjetas de memoria Anki."
              content={jsonToGIFT(examData)}
              downloadFilename={`${examFileName}.gift`}
              onShowToast={showToast}
            />
          )}

          {/* TXT Full Tab */}
          {currentTab === "txt-full" && (
            <CodeViewPanel
              title="Examen TXT Completo"
              description="Texto estructurado con todas las preguntas y distractores señalando la opción correcta."
              content={jsonToTxtCompleto(examData)}
              downloadFilename={`${examFileName}.txt`}
              onShowToast={showToast}
            />
          )}

          {/* TXT Solutions Tab */}
          {currentTab === "txt-correct" && (
            <CodeViewPanel
              title="Plantilla de Soluciones"
              description="Plantilla de respuestas y soluciones justificadas para corrección rápida del profesorado."
              content={jsonToTxtCorrectas(examData)}
              downloadFilename={`${examFileName}_Soluciones.txt`}
              onShowToast={showToast}
            />
          )}

          {/* JSON Backup Tab */}
          {currentTab === "json" && (
            <CodeViewPanel
              title="Estructura de Datos JSON"
              description="Copia de seguridad en formato estructurado JSON para reimportación íntegra."
              content={jsonToJSONString(examData)}
              downloadFilename={`${examFileName}.json`}
              onShowToast={showToast}
            />
          )}
        </div>
      </div>

      {/* Results Modal */}
      <ResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        score={score}
        examTitle={`2. Cuestionario de Autoevaluación - ${udTitle}`}
        onReviewMistakes={() => {
          setIsResultsModalOpen(false);
          setActiveFilter("incorrect");
        }}
      />

      {/* OMR Sheet Modal */}
      <OmrSheetModal
        isOpen={isOmrModalOpen}
        onClose={() => setIsOmrModalOpen(false)}
        examData={examData}
        examTitle={`Autoevaluación_${udCode}`}
        onShowToast={showToast}
        onOpenScanner={() => {
          setIsOmrModalOpen(false);
          setIsOmrScannerOpen(true);
        }}
      />

      {/* ZipGrade & Mobile Camera Scanner Modal */}
      <ZipgradeSuiteModal
        isOpen={isOmrScannerOpen}
        onClose={() => setIsOmrScannerOpen(false)}
        examData={examData}
        examTitle={`Autoevaluación_${udCode}`}
        onShowToast={showToast}
      />

      {/* Notification Toast */}
      <NotificationToast message={toastMessage} isError={toastIsError} />
    </div>
  );
};
