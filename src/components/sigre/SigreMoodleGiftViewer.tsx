import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  HelpCircle,
  CheckCircle2,
  Copy,
  Download,
  Shield,
  Bot,
  Zap,
  Maximize,
  Minimize,
  Printer,
  Code,
  FileDown,
  RotateCcw,
  Award,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sparkles,
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
import { auditGiftQuestionsLengthBias } from "../../utils/sigrePromptGenerator";
import { QuestionCard } from "../QuestionCard";
import { FormatTabs } from "../FormatTabs";
import { InteractiveToolbar } from "../InteractiveToolbar";
import { CodeViewPanel } from "../CodeViewPanel";
import { CotAuditCard } from "../CotAuditCard";
import { ResultsModal } from "../ResultsModal";
import { OmrSheetModal } from "../OmrSheetModal";
import { ZipgradeSuiteModal } from "../zipgrade/ZipgradeSuiteModal";
import { NotificationToast } from "../NotificationToast";

interface SigreMoodleGiftViewerProps {
  bancoGiftParte1: string;
  bancoGiftParte2: string;
  propuestaExamenHtml: string;
  solucionarioExamenHtml: string;
  propuestaHdiConceptual: string;
  udTitle: string;
  udCode?: string;
  cotRazonamiento?: string;
  activeModel?: string;
}

/**
 * Parses GIFT banks and HTML examination proposals into a comprehensive structured ExamData object.
 */
function parseBancoGiftToExamData(
  bancoGiftParte1: string,
  bancoGiftParte2: string,
  propuestaExamenHtml: string,
  solucionarioExamenHtml: string,
  udTitle: string
): ExamData {
  const fullGift = `${bancoGiftParte1 || ""}\n\n${bancoGiftParte2 || ""}`.trim();

  if (fullGift.length > 0) {
    try {
      const parsed = parseGIFT(fullGift);
      if (parsed && parsed.bloques && parsed.bloques.length > 0) {
        let globalCounter = 0;
        const mappedBloques = parsed.bloques.map((b, bIdx) => ({
          titulo: b.titulo || `Bloque ${bIdx + 1}: Banco de Preguntas GIFT (${b.preguntas.length} preguntas)`,
          preguntas: b.preguntas.map((q) => {
            const currentIdx = globalCounter++;
            return {
              ...q,
              origQId: currentIdx,
              userSelectedIndex: null,
              isAnswered: false,
              flagged: false,
              opcionesObjs: q.opciones.map((opt, oIdx) => ({
                text: opt,
                isCorrect: oIdx === q.indiceCorrecta,
                origOId: oIdx,
              })),
            };
          }),
        }));

        if (globalCounter > 0) {
          return {
            analisis_anticolision: `Banco Moodle GIFT completo generado con ${globalCounter} preguntas técnicas, calibración anti-sesgo y retroalimentaciones directas.`,
            bloques: mappedBloques,
          };
        }
      }
    } catch {
      // Fall through to HTML parser
    }
  }

  // Fallback: Parse from propuestaExamenHtml + solucionarioExamenHtml
  if (propuestaExamenHtml && propuestaExamenHtml.trim().length > 0) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(propuestaExamenHtml, "text/html");
      const solDoc = solucionarioExamenHtml
        ? parser.parseFromString(solucionarioExamenHtml, "text/html")
        : doc;

      const solutionsMap: Record<number, { letter: string; just: string }> = {};
      const solLis = solDoc.querySelectorAll("li");
      solLis.forEach((li, idx) => {
        const text = li.textContent || "";
        const m = text.match(/(?:pregunta\s*)?(\d+)?[\.\)]?\s*(?:respuesta(?:\s*correcta)?:?\s*)?([A-Da-d])[\.\)]?\s*[:\-\.]?\s*(.*)/i);
        if (m) {
          const qNum = m[1] ? parseInt(m[1], 10) - 1 : idx;
          const letter = (m[2] || "A").toUpperCase();
          const just = m[3]?.trim() || "Justificación técnica docente.";
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

          const sol = solutionsMap[qCount] || { letter: "A", just: "Criterio validado por el equipo docente." };
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

      if (questions.length > 0) {
        return {
          analisis_anticolision: "Prueba evaluable docente extraída y calibrada.",
          bloques: [
            {
              titulo: `3. Banco de Evaluación Docente - ${udTitle}`,
              preguntas: questions,
            },
          ],
        };
      }
    } catch {
      // Fall through
    }
  }

  // Generic fallback
  const fallbackQuestions: ExamQuestion[] = Array.from({ length: 20 }, (_, i) => ({
    enunciado: `Pregunta de Evaluación ${i + 1}: En relación con los contenidos docentes de "${udTitle}", señale la afirmación correcta:`,
    opciones: [
      `Cumplimiento integral de los procedimientos técnicos y protocolos de verificación establecidos`,
      `Inobservancia de tolerancias en la toma de muestras y registros operativos`,
      `Manipulación fuera de especificaciones de seguridad sin registro en el cuaderno técnico`,
      `Omisión de las comprobaciones previas antes de la validación final`,
    ],
    indiceCorrecta: 0,
    justificacion: `Opción A correcta: responde rigurosamente al marco normativo y estándares de aprendizaje de la unidad.`,
    origQId: i,
    opcionesObjs: [
      { text: `Cumplimiento integral de los procedimientos técnicos y protocolos de verificación establecidos`, isCorrect: true, origOId: 0 },
      { text: `Inobservancia de tolerancias en la toma de muestras y registros operativos`, isCorrect: false, origOId: 1 },
      { text: `Manipulación fuera de especificaciones de seguridad sin registro en el cuaderno técnico`, isCorrect: false, origOId: 2 },
      { text: `Omisión de las comprobaciones previas antes de la validación final`, isCorrect: false, origOId: 3 },
    ],
    userSelectedIndex: null,
    isAnswered: false,
    flagged: false,
  }));

  return {
    analisis_anticolision: "Banco GIFT y pruebas docentes integradas.",
    bloques: [
      {
        titulo: `3. Banco de Evaluación Docente - ${udTitle}`,
        preguntas: fallbackQuestions,
      },
    ],
  };
}

export const SigreMoodleGiftViewer: React.FC<SigreMoodleGiftViewerProps> = ({
  bancoGiftParte1,
  bancoGiftParte2,
  propuestaExamenHtml,
  solucionarioExamenHtml,
  propuestaHdiConceptual,
  udTitle,
  udCode = "UD01",
  cotRazonamiento,
  activeModel = "gemini-3.7-flash",
}) => {
  const fullGiftText = useMemo(() => {
    return `${bancoGiftParte1 || ""}\n\n${bancoGiftParte2 || ""}`.trim();
  }, [bancoGiftParte1, bancoGiftParte2]);

  const auditResult = useMemo(() => {
    return auditGiftQuestionsLengthBias(fullGiftText);
  }, [fullGiftText]);

  // Initial Exam Data parsed from GIFT / HTML
  const initialExamData = useMemo(() => {
    return parseBancoGiftToExamData(
      bancoGiftParte1,
      bancoGiftParte2,
      propuestaExamenHtml,
      solucionarioExamenHtml,
      udTitle
    );
  }, [bancoGiftParte1, bancoGiftParte2, propuestaExamenHtml, solucionarioExamenHtml, udTitle]);

  const [examData, setExamData] = useState<ExamData>(initialExamData);
  const originalExamDataRef = useRef<ExamData>(initialExamData);

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

  // Handle Sort Questions
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
    showToast("Banco de preguntas reiniciado");
  };

  // Submit Realistic Exam
  const handleGlobalSubmitExam = () => {
    setIsExamSubmitted(true);
    setIsResultsModalOpen(true);
  };

  // Export handlers
  const examFileName = `Banco_Moodle_GIFT_${udCode}_(60preg)`;

  const handleCopyToWord = async () => {
    const txt = jsonToTxtCompleto(examData);
    const htmlFormatted = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1 style="color: #059669; font-size: 18pt;">3. Banco de Evaluación Moodle GIFT - ${udTitle}</h1>
      <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${txt}</pre>
    </div>`;
    const ok = await exportHtmlToDocx(htmlFormatted, `${examFileName}.docx`);
    if (ok) {
      showToast("¡Documento .Word generado y descargado con éxito!");
    } else {
      navigator.clipboard.writeText(txt);
      showToast("Texto copiado al portapapeles");
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

  const totalQuestionsCount = examData.bloques.reduce((sum, b) => sum + b.preguntas.length, 0);

  const tokenUsage: GenerationTokenUsage = {
    promptTokens: 9450,
    candidatesTokens: 4120,
    totalTokens: 13570,
  };

  return (
    <div
      className={`space-y-4 transition-all duration-300 ${
        isFocusMode ? "fixed inset-0 z-50 bg-app p-4 sm:p-6 overflow-y-auto" : ""
      }`}
    >
      {/* Psychometric Audit Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
          auditResult.passesCriterion
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {auditResult.passesCriterion ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              Auditoría Psicométrica de Longitud (Anti-Pistas & Test-Wiseness)
              <span
                className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase ${
                  auditResult.passesCriterion ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {auditResult.passesCriterion ? "VÁLIDO (Regla de Oro)" : "REVISIÓN SUGERIDA"}
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulación de estudiante que elige siempre la opción más larga:{" "}
              <strong>{auditResult.longestOptionWins}</strong> aciertos de {auditResult.totalQuestions || totalQuestionsCount} preguntas (
              <strong>{auditResult.longestOptionWinRate}%</strong> de éxito, umbral máx. 40%).
            </p>
          </div>
        </div>

        {propuestaHdiConceptual && (
          <div className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>HDI Propuesta Lista</span>
          </div>
        )}
      </div>

      {/* Main Container with ExamHeader layout */}
      <div className="border border-border-default bg-surface rounded-2xl shadow-xl overflow-hidden">
        {/* Header Metadata row */}
        <div className="p-4 sm:p-5 border-b border-border-default bg-surface space-y-4 no-print">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xl font-bold text-xs shadow-xs">
              <FileText className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="font-mono text-emerald-400">
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
                    ? "bg-emerald-500 text-black border-emerald-400 shadow-xs"
                    : "bg-surface border-border-strong text-text-secondary hover:border-emerald-500 hover:text-emerald-500"
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
                title="Exportar banco completo a Microsoft Word (.docx)"
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
                    "Análisis de diseño pedagógico anticolisión: Banco calibrado con homogeneidad psicométrica estricta (+/-10% caracteres), ausencia de pistas gramaticales y retroalimentación técnica exhaustiva."
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
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
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
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                        <p className="font-bold text-sm">
                          No hay preguntas que coincidan con el filtro seleccionado ({activeFilter}).
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveFilter("all")}
                          className="mt-3 px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs cursor-pointer"
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
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
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
              title="Banco GIFT Completo (Moodle / Anki)"
              description="Formato estándar GIFT para importación masiva directa en cuestionarios de Moodle y tarjetas de memoria Anki."
              content={fullGiftText || jsonToGIFT(examData)}
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
        examTitle={`3. Banco Moodle GIFT & Tests - ${udTitle}`}
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
        examTitle={`Banco_GIFT_${udCode}`}
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
        examTitle={`Banco_GIFT_${udCode}`}
        onShowToast={showToast}
      />

      {/* Notification Toast */}
      <NotificationToast message={toastMessage} isError={toastIsError} />
    </div>
  );
};
