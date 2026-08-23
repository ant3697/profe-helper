import React, { useState, useRef } from "react";
import {
  Printer,
  Download,
  X,
  FileCheck2,
  Layers,
  Camera,
  ExternalLink,
  Languages,
  Copy,
  Image as ImageIcon,
  Check,
  Sparkles,
} from "lucide-react";
import { toBlob, toPng } from "html-to-image";
import { ExamData } from "../types/exam";
import {
  generatePrintableZipgradeSheet,
  printOmrHtmlDocument,
  openOmrInNewTab,
  getAnswerKeyFromExam,
  OMR_LETTERS,
} from "../utils/omrProcessor";

interface OmrSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  examData?: ExamData;
  examTitle?: string;
  onShowToast: (msg: string, isError?: boolean) => void;
  onOpenScanner?: () => void;
}

export const OmrSheetModal: React.FC<OmrSheetModalProps> = ({
  isOpen,
  onClose,
  examData,
  examTitle = "",
  onShowToast,
  onOpenScanner,
}) => {
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [dni, setDni] = useState("");
  const [className, setClassName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [customQuizTitle, setCustomQuizTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [sheetFormat, setSheetFormat] = useState<"auto" | "20" | "50" | "100">("auto");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !examData) return null;

  const isEs = language === "es";

  // Flatten all questions
  const allQuestions = examData.bloques.flatMap((b) => b.preguntas);
  const totalQuestions = allQuestions.length;
  const answerKey = getAnswerKeyFromExam(examData);

  // Active form determination
  const activeFormat =
    sheetFormat === "auto"
      ? totalQuestions <= 20
        ? "20"
        : totalQuestions > 50
        ? "100"
        : "50"
      : sheetFormat;

  // Student ID 5 digits (for 50-Q) & 8 digits (for 100-Q)
  const rawIdDigits5 = dni.replace(/\D/g, "").slice(0, 5).padEnd(5, " ");
  const idDigitsArray5 = rawIdDigits5.split("");
  const rawIdDigits8 = dni.replace(/\D/g, "").slice(0, 8).padEnd(8, " ");
  const idDigitsArray8 = rawIdDigits8.split("");

  // Labels for preview and modal
  const labels = {
    testVersion: isEs ? "MODELO / VERSIÓN:" : "TEST VERSION:",
    keyVersion: "MODELO",
    keyVersionShort: "MOD",
    studentId: isEs ? "DNI / ID ALUMNO" : "STUDENT ID",
    studentNotes: isEs
      ? "• Rellene los círculos completamente con bolígrafo negro o azul oscuro. Borre o tape completamente cualquier corrección."
      : "• Fill circles completely with black ink or pencil. Erase all stray marks completely.",
    teacherNotes: isEs
      ? "• Mantenga el papel en superficie plana al escanear. Evite sombras."
      : "• Hold sheet on flat surface when scanning. Avoid glare.",
    footerText: isEs
      ? "HOJA OFICIAL DE RESPUESTAS OMR · FORMATO A5"
      : "OFFICIAL OMR ANSWER SHEET · A5 FORMAT",
  };

  const getFullOmrHtml = () => {
    return generatePrintableZipgradeSheet({
      examTitle: customQuizTitle || examTitle,
      questionCount: activeFormat === "20" ? 20 : activeFormat === "100" ? 100 : 50,
      optionsCount: 5,
      includeAnswerKey: includeSolutions,
      answerKey,
      candidateName,
      dni,
      className,
      examDate,
      model: selectedModel,
      sheetFormat: activeFormat,
      language,
    });
  };

  const handlePrint = () => {
    const html = getFullOmrHtml();
    onShowToast(isEs ? "Abriendo ventana e iniciando diálogo de impresión A5 vertical..." : "Opening print dialog...");
    const success = printOmrHtmlDocument(html);
    if (!success) {
      handleDownloadHtml();
      onShowToast(isEs ? "Descargando archivo HTML para imprimir..." : "Downloading HTML file to print...", true);
    }
  };

  const handleOpenInNewTab = () => {
    const html = getFullOmrHtml();
    const success = openOmrInNewTab(html);
    if (success) {
      onShowToast(isEs ? "Plantilla OMR A5 vertical abierta en nueva pestaña." : "A5 OMR Sheet opened in new tab.");
    } else {
      handleDownloadHtml();
    }
  };

  const handleDownloadHtml = () => {
    const fullHtml = getFullOmrHtml();
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Plantilla_OMR_A5_Caballera_${language.toUpperCase()}_${activeFormat}P_${(customQuizTitle || examTitle || "Examen").replace(/\s+/g, "_")}${selectedModel ? `_Mod_${selectedModel}` : ""}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(isEs ? "Plantilla OMR A5 descargada en HTML para imprimir." : "A5 OMR Sheet HTML downloaded.");
  };

  // Copy high-resolution PNG image directly to clipboard for pasting into Word/Docs/Exams
  const handleCopyImage = async () => {
    if (!captureRef.current) return;
    setIsCopyingImage(true);
    try {
      const blob = await toBlob(captureRef.current, {
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        skipFonts: true,
        cacheBust: true,
      });
      if (blob && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        onShowToast(
          isEs
            ? "¡Imagen de la plantilla copiada al portapapeles! Puedes pegarla con Ctrl+V en tu examen."
            : "OMR sheet image copied to clipboard! Paste with Ctrl+V into your document."
        );
      } else {
        // Fallback to downloading PNG if clipboard write is blocked
        await handleDownloadImage();
      }
    } catch (err) {
      console.error("Error capturing image:", err);
      onShowToast(
        isEs
          ? "No se pudo copiar directamente al portapapeles. Descargando imagen PNG..."
          : "Could not copy directly. Downloading PNG image...",
        true
      );
      await handleDownloadImage();
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Download high-resolution PNG image
  const handleDownloadImage = async () => {
    if (!captureRef.current) return;
    setIsDownloadingImage(true);
    try {
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2.5,
        backgroundColor: "#ffffff",
        skipFonts: true,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Plantilla_OMR_A5_Caballera_${activeFormat}P_${(customQuizTitle || examTitle || "Examen").replace(/\s+/g, "_")}${selectedModel ? `_Mod_${selectedModel}` : ""}.png`;
      a.click();
      onShowToast(
        isEs
          ? "Imagen PNG de alta resolución descargada. Lista para insertar en tus exámenes."
          : "High-resolution PNG image downloaded."
      );
    } catch (err) {
      console.error("Error downloading image:", err);
      onShowToast(isEs ? "Error al generar la imagen PNG" : "Error generating PNG image", true);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Render question row in interactive preview with large legible circles and exact Lato font
  const renderPreviewRow = (
    qNum: number,
    size: "large" | "medium" | "compact" = "medium"
  ) => {
    const qData = allQuestions[qNum - 1];
    const correctLetter = qData ? OMR_LETTERS[qData.indiceCorrecta] : answerKey[qNum];

    let bubbleCls = "w-4.5 h-4.5";
    let numCls = "w-5 text-[11.8pt] mr-1.5"; // 50-preg standard: 11.8pt Lato-Regular
    let containerCls = "py-[2px]";
    let gapCls = "gap-[5px]";

    if (size === "large") {
      bubbleCls = "w-6 h-6";
      numCls = "w-6 text-[12.5pt] mr-2"; // 20-preg standard: 12.5pt Lato-Regular
      containerCls = "py-[4px]";
      gapCls = "gap-[7px]";
    } else if (size === "compact") {
      bubbleCls = "w-3 h-3 sm:w-3.5 sm:h-3.5";
      numCls = "w-5 text-[8.5pt] sm:text-[9pt] mr-1"; // 100-preg standard: 9pt Lato fits 3 digits ("100") without touching bubbles
      containerCls = "py-[0.5px]";
      gapCls = "gap-[2px] sm:gap-[2.5px]";
    }

    return (
      <div key={qNum} className={`flex items-center justify-start ${containerCls} font-['Lato',sans-serif]`}>
        <span className={`font-normal text-black ${numCls} text-right shrink-0 font-['Lato',sans-serif] leading-none`}>
          {qNum}
        </span>
        <div className={`flex items-center ${gapCls}`}>
          {["A", "B", "C", "D", "E"].map((l) => {
            const isCorrect = includeSolutions && Boolean(correctLetter) && l === correctLetter;
            return (
              <div
                key={l}
                className={`${bubbleCls} rounded-full border-[1.4px] border-[#555555] flex items-center justify-center transition-colors shrink-0 ${
                  isCorrect
                    ? "bg-black"
                    : "bg-white"
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // Render column sub-header with 100% exact mathematical alignment with bubbles
  const renderColHeader = (
    size: "large" | "medium" | "compact" = "medium",
    withTimingSquare: boolean = false
  ) => {
    let bubbleCls = "w-4.5 h-4.5";
    let numCls = "w-5 mr-1.5";
    let fontCls = "text-[10.8pt]"; // 50-preg standard: ~10.8pt Lato-Regular / Light
    let gapCls = "gap-[5px]";
    let sqCls = "w-2.5 h-2.5";

    if (size === "large") {
      bubbleCls = "w-6 h-6";
      numCls = "w-6 mr-2";
      fontCls = "text-[13.4pt]"; // 20-preg standard: 13.4pt Lato-Regular
      gapCls = "gap-[7px]";
      sqCls = "w-3 h-3";
    } else if (size === "compact") {
      bubbleCls = "w-3 h-3 sm:w-3.5 sm:h-3.5";
      numCls = "w-5 mr-1";
      fontCls = "text-[7.5pt] sm:text-[8pt]"; // 100-preg standard: 8pt Lato-Regular / Light
      gapCls = "gap-[2px] sm:gap-[2.5px]";
      sqCls = "w-2 h-2";
    }

    return (
      <div className={`flex items-center justify-start mb-1 font-['Lato',sans-serif]`}>
        <div className={`${numCls} flex items-center justify-center shrink-0`}>
          {withTimingSquare && <div className={`${sqCls} bg-black shrink-0`} />}
        </div>
        <div className={`flex items-center ${gapCls}`}>
          {["A", "B", "C", "D", "E"].map((l) => (
            <span
              key={l}
              className={`${bubbleCls} flex items-center justify-center text-center font-normal text-black ${fontCls} leading-none shrink-0`}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render bottom column alignment square in timing column
  const renderColBottomSquare = (
    size: "large" | "medium" | "compact" = "medium",
    showSquare: boolean = true
  ) => {
    let numCls = "w-5 mr-1.5";
    let sqCls = "w-2.5 h-2.5";
    if (size === "large") {
      numCls = "w-6 mr-2";
      sqCls = "w-3 h-3";
    } else if (size === "compact") {
      numCls = "w-5 mr-1";
      sqCls = "w-2 h-2";
    }
    return (
      <div className="flex items-center justify-start mt-1 font-['Lato',sans-serif]">
        <div className={`${numCls} flex items-center justify-center shrink-0`}>
          {showSquare && <div className={`${sqCls} bg-black shrink-0`} />}
        </div>
      </div>
    );
  };

  // Render 2x5 Asymmetric Binary Form-ID and Orientation Pattern
  const renderOrientationPattern = () => (
    <div
      className="absolute left-2 top-[60%] -translate-y-1/2 flex flex-col border border-black bg-white select-none shadow-xs z-10"
      title="Código binario de orientación y verificación de plantilla"
    >
      <div className="flex">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white" />
      </div>
      <div className="flex">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black" />
      </div>
      <div className="flex">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white" />
      </div>
      <div className="flex">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black" />
      </div>
      <div className="flex">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black" />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
      <div className="relative bg-[#10141e] border border-[#232d42] shadow-2xl w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#232d42] bg-[#121620] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100 font-primary">
                  {isEs ? "Hoja Oficial de Evaluación OMR" : "Official OMR Evaluation Sheet"}
                </h2>
                <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                  A5 Caballera (148×210 mm)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEs
                  ? "Formato A5 vertical (caballera), distribución compacta de alta densidad sin texto superfluo"
                  : "Compact high-density A5 portrait layout without superfluous text"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#161c28] border border-[#26334a] rounded-xl p-1 text-xs">
              <Languages className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-1" />
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  isEs
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Imprimir con textos oficiales en español"
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  !isEs
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Print with English labels"
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#161c28] border border-transparent hover:border-[#26334a] transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="p-3.5 bg-[#161c28]/70 border-b border-[#232d42] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Format selector */}
            <div className="min-w-[160px]">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {isEs ? "Formato de Hoja" : "Sheet Format"}
              </label>
              <select
                value={sheetFormat}
                onChange={(e) => setSheetFormat(e.target.value as "auto" | "20" | "50" | "100")}
                className="w-full bg-[#10141e] border border-[#26334a] rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="auto">Auto ({totalQuestions} Preguntas)</option>
                <option value="20">20 Preguntas (A5 - 20Q)</option>
                <option value="50">50 Preguntas (A5 - 50Q)</option>
                <option value="100">100 Preguntas (A5 - 100Q)</option>
              </select>
            </div>

            {/* Answer Key Toggle */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none bg-[#10141e] border border-[#26334a] px-3.5 py-2 rounded-xl hover:border-amber-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={includeSolutions}
                  onChange={(e) => setIncludeSolutions(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded border-[#26334a] cursor-pointer"
                />
                <span className="font-bold text-slate-200 text-xs">
                  {isEs ? "Mostrar Solucionario (Plantilla Correctora)" : "Include Answer Key (Master Template)"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-[#10141e] border border-[#232d42] px-3 py-1.5 rounded-xl">
            📐 <span className="font-semibold text-slate-300">A5 Vertical (Caballera)</span> · Espaciado Optimizado
          </div>
        </div>

        {/* Live Sheet Preview */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-[#0b0e14] flex items-center justify-center">
          <div
            ref={captureRef}
            id="omr-sheet-capture-container"
            className="w-full max-w-[530px] bg-white text-black rounded-sm shadow-2xl font-sans select-none border border-slate-300"
          >
            {activeFormat === "20" ? (
              /* ================= 20 QUESTIONS PREVIEW ================= */
              <div className="relative p-6 sm:p-8 pl-10 sm:pl-12 pr-8 sm:pr-10 min-h-[580px] flex flex-col justify-center items-center">
                {/* 6 Calibration Black Fiducials (Corners & Mid-points) */}
                <div className="w-3.5 h-3.5 bg-black absolute top-2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-2 right-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-[38%] -translate-y-1/2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-[38%] -translate-y-1/2 right-2" />
                <div className="w-3.5 h-3.5 bg-black absolute bottom-2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute bottom-2 right-2" />

                {/* Left Margin Binary Form/Orientation Code */}
                {renderOrientationPattern()}

                {/* 2 Big Spacious Columns of 10 Questions */}
                <div className="flex justify-center items-start gap-10 sm:gap-14 my-auto w-full">
                  <div className="shrink-0">
                    {renderColHeader("large", false)}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <React.Fragment key={i + 1}>
                        {renderPreviewRow(i + 1, "large")}
                      </React.Fragment>
                    ))}
                    {renderColBottomSquare("large", false)}
                  </div>
                  <div className="shrink-0">
                    {renderColHeader("large", true)}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <React.Fragment key={i + 11}>
                        {renderPreviewRow(i + 11, "large")}
                      </React.Fragment>
                    ))}
                    {renderColBottomSquare("large", true)}
                  </div>
                </div>
              </div>
            ) : activeFormat === "50" ? (
              /* ================= 50 QUESTIONS PREVIEW (10-BLOCK DIVIDED) ================= */
              <div className="relative p-4 sm:p-6 pl-9 sm:pl-11 pr-7 sm:pr-9 min-h-[580px] flex flex-col justify-center items-center">
                {/* 6 Calibration Black Fiducials (Corners & Mid-points) */}
                <div className="w-3.5 h-3.5 bg-black absolute top-2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-2 right-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-[38%] -translate-y-1/2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-[38%] -translate-y-1/2 right-2" />
                <div className="w-3.5 h-3.5 bg-black absolute bottom-2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute bottom-2 right-2" />

                {/* Left Margin Binary Form/Orientation Code */}
                {renderOrientationPattern()}

                {/* 2 Clean Columns of 25 Questions Divided into 10-Item Sections */}
                <div className="flex flex-col gap-2.5 my-auto w-full items-center">
                  {/* Block 1 (Q1-10 & Q26-35) */}
                  <div className="flex justify-center items-start gap-8 sm:gap-12 w-full">
                    <div className="shrink-0">
                      {renderColHeader("medium", false)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 1}>
                          {renderPreviewRow(i + 1, "medium")}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shrink-0">
                      {renderColHeader("medium", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 26}>
                          {renderPreviewRow(i + 26, "medium")}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Block 2 (Q11-20 & Q36-45) */}
                  <div className="flex justify-center items-start gap-8 sm:gap-12 w-full">
                    <div className="shrink-0">
                      {renderColHeader("medium", false)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 11}>
                          {renderPreviewRow(i + 11, "medium")}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shrink-0">
                      {renderColHeader("medium", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 36}>
                          {renderPreviewRow(i + 36, "medium")}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Block 3 (Q21-25 & Q46-50) */}
                  <div className="flex justify-center items-start gap-8 sm:gap-12 w-full">
                    <div className="shrink-0">
                      {renderColHeader("medium", false)}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <React.Fragment key={i + 21}>
                          {renderPreviewRow(i + 21, "medium")}
                        </React.Fragment>
                      ))}
                      {renderColBottomSquare("medium", false)}
                    </div>
                    <div className="shrink-0">
                      {renderColHeader("medium", true)}
                      {Array.from({ length: 5 }).map((_, i) => (
                        <React.Fragment key={i + 46}>
                          {renderPreviewRow(i + 46, "medium")}
                        </React.Fragment>
                      ))}
                      {renderColBottomSquare("medium", true)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= 100 QUESTIONS PREVIEW (10-BLOCK DIVIDED) ================= */
              <div className="relative p-3 sm:p-4 pl-9 sm:pl-11 pr-6 sm:pr-8 min-h-[580px] flex flex-col justify-center items-center">
                {/* 6 Calibration Black Fiducials (Corners & Mid-points) */}
                <div className="w-3.5 h-3.5 bg-black absolute top-2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-2 right-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-[38%] -translate-y-1/2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute top-[38%] -translate-y-1/2 right-2" />
                <div className="w-3.5 h-3.5 bg-black absolute bottom-2 left-2" />
                <div className="w-3.5 h-3.5 bg-black absolute bottom-2 right-2" />

                {/* Left Margin Binary Form/Orientation Code */}
                {renderOrientationPattern()}

                {/* 4 COLUMNS ORGANIZED IN 2 BLOCKS OF 10 (Q1-10/21-30/51-60/81-90 and Q11-20/31-40/61-70/91-100) */}
                <div className="flex flex-col gap-2 sm:gap-3 my-auto w-full items-center">
                  {/* TOP SECTION (10 items per column) */}
                  <div className="flex justify-center items-start gap-1.5 sm:gap-2.5 w-full">
                    {/* Col 1: Q1-10 */}
                    <div className="shrink-0">
                      {renderColHeader("compact", false)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 1}>
                          {renderPreviewRow(i + 1, "compact")}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Col 2: Q21-30 with timing square */}
                    <div className="shrink-0">
                      {renderColHeader("compact", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 21}>
                          {renderPreviewRow(i + 21, "compact")}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Col 3: Q51-60 with timing square */}
                    <div className="shrink-0">
                      {renderColHeader("compact", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 51}>
                          {renderPreviewRow(i + 51, "compact")}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Col 4: Q81-90 with timing square */}
                    <div className="shrink-0">
                      {renderColHeader("compact", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 81}>
                          {renderPreviewRow(i + 81, "compact")}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* BOTTOM SECTION (10 items per column) */}
                  <div className="flex justify-center items-start gap-1.5 sm:gap-2.5 w-full">
                    {/* Col 1: Q11-20 */}
                    <div className="shrink-0">
                      {renderColHeader("compact", false)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 11}>
                          {renderPreviewRow(i + 11, "compact")}
                        </React.Fragment>
                      ))}
                      {renderColBottomSquare("compact", false)}
                    </div>
                    {/* Col 2: Q31-40 with timing square */}
                    <div className="shrink-0">
                      {renderColHeader("compact", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 31}>
                          {renderPreviewRow(i + 31, "compact")}
                        </React.Fragment>
                      ))}
                      {renderColBottomSquare("compact", true)}
                    </div>
                    {/* Col 3: Q61-70 with timing square */}
                    <div className="shrink-0">
                      {renderColHeader("compact", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 61}>
                          {renderPreviewRow(i + 61, "compact")}
                        </React.Fragment>
                      ))}
                      {renderColBottomSquare("compact", true)}
                    </div>
                    {/* Col 4: Q91-100 with timing square */}
                    <div className="shrink-0">
                      {renderColHeader("compact", true)}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <React.Fragment key={i + 91}>
                          {renderPreviewRow(i + 91, "compact")}
                        </React.Fragment>
                      ))}
                      {renderColBottomSquare("compact", true)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 border-t border-[#232d42] bg-[#121620] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>
              {isEs
                ? `Formato A5 Caballera · ${activeFormat} Preguntas · Calibración óptica homologada`
                : `A5 Portrait format · ${activeFormat} Questions · Homologated calibration`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenScanner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-xs font-black px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{isEs ? "Corregir con Cámara" : "Scan with Camera"}</span>
              </button>
            )}

            {/* Copy Image Button */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isCopyingImage}
              className="bg-[#161c28] hover:bg-[#1f283a] border border-[#2d3a54] text-amber-400 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Copiar imagen PNG al portapapeles para pegar con Ctrl+V en Word o Docs"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{isCopyingImage ? (isEs ? "Copiando..." : "Copying...") : (isEs ? "Copiar Imagen" : "Copy Image")}</span>
            </button>

            {/* Download Image Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="bg-[#161c28] hover:bg-[#1f283a] border border-[#2d3a54] text-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descargar imagen PNG de alta resolución lista para insertar en exámenes"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>{isDownloadingImage ? (isEs ? "Generando..." : "Generating...") : (isEs ? "Descargar PNG" : "Download PNG")}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="bg-[#161c28] hover:bg-[#1a2233] border border-[#26334a] text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              title="Abrir plantilla en una nueva pestaña"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>{isEs ? "Abrir Pestaña" : "Open in Tab"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              title="Imprimir plantilla OMR en A5 vertical (caballera)"
            >
              <Printer className="w-4 h-4" />
              <span>{isEs ? "Imprimir A5" : "Print A5"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


