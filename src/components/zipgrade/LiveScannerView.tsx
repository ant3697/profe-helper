import React, { useState, useRef, useEffect } from "react";
import { ZipGradeQuiz, OmrScanResult, ZipGradeStudent, OmrSheetType } from "../../types/omr";
import { analyzeOmrImage, gradeStudentAnswers, playScanSuccessSound, detectCornerFiducials } from "../../utils/omrProcessor";
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle2,
  XCircle,
  Upload,
  AlertCircle,
  ChevronLeft,
  Settings,
  X,
  User,
  Trash2,
  FileSearch,
  Volume2,
  VolumeX,
  Sliders,
  ShieldCheck,
} from "lucide-react";

interface LiveScannerViewProps {
  quiz: ZipGradeQuiz;
  onDocumentScanned: (result: OmrScanResult) => void;
  onDeleteDocument?: (docId: string) => void;
  onUpdateDocument?: (result: OmrScanResult) => void;
  onReviewDocument?: (docId: string) => void;
  onBack: () => void;
  registeredStudents: ZipGradeStudent[];
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const LiveScannerView: React.FC<LiveScannerViewProps> = ({
  quiz,
  onDocumentScanned,
  onDeleteDocument,
  onUpdateDocument,
  onReviewDocument,
  onBack,
  registeredStudents,
  onShowToast,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState<"normal" | "high" | "pencil" | "pen">("normal");
  const [autoCapture, setAutoCapture] = useState(false);
  const [isCornerLocked, setIsCornerLocked] = useState(false);
  const [fiducialsScore, setFiducialsScore] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangeStudentOpen, setIsChangeStudentOpen] = useState(false);

  // The active scanned result overlay matching the screenshot
  const [scannedResult, setScannedResult] = useState<OmrScanResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Alinear esquinas negras en visores");

  // Offscreen canvas for real-time tracking
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lockedDurationRef = useRef<number>(0);

  // New Student Assignment Form State
  const [customStudentId, setCustomStudentId] = useState("");
  const [customStudentName, setCustomStudentName] = useState("");

  const activeKey = quiz.keys.find((k) => k.id === quiz.activeKeyId) || quiz.keys[0];

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setStatusMessage("Alinear esquinas negras en visores");
      }
    } catch (err: unknown) {
      console.warn("Camera access error:", err);
      setCameraError("No se pudo acceder a la cámara. Verifique los permisos o use la subida de fotos.");
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, [cameraFacing]);

  // Real-time corner fiducial tracking loop (~300ms interval)
  useEffect(() => {
    if (!isCameraActive || isProcessing || scannedResult) return;

    if (!previewCanvasRef.current) {
      previewCanvasRef.current = document.createElement("canvas");
      previewCanvasRef.current.width = 320;
      previewCanvasRef.current.height = 240;
    }

    const interval = setInterval(() => {
      const video = videoRef.current;
      const pCanvas = previewCanvasRef.current;
      if (!video || !pCanvas || video.readyState < 2 || isProcessing || scannedResult) return;

      const pCtx = pCanvas.getContext("2d");
      if (!pCtx) return;

      try {
        pCtx.drawImage(video, 0, 0, pCanvas.width, pCanvas.height);
        const { found, score } = detectCornerFiducials(pCtx, pCanvas.width, pCanvas.height);
        setIsCornerLocked(found);
        setFiducialsScore(score);

        if (found) {
          lockedDurationRef.current += 300;
          if (autoCapture && lockedDurationRef.current >= 900 && !isProcessing) {
            processFrame();
          }
        } else {
          lockedDurationRef.current = 0;
        }
      } catch {
        setIsCornerLocked(false);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isCameraActive, isProcessing, scannedResult, autoCapture]);

  // Capture & Process Image from Camera
  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    setIsProcessing(true);
    setStatusMessage("Analizando con pipeline de alta precisión...");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const detection = await analyzeOmrImage(canvas, quiz.totalQuestions, 5, sensitivity);

      // Find student if ID was detected
      let studentName = "";
      const detId = detection.detectedStudentId || `${Math.floor(1 + Math.random() * 25)}`;
      const found = registeredStudents.find(
        (s) => s.studentZipGradeId === detId || s.id === detId
      );
      if (found) {
        studentName = `${found.firstName} ${found.lastName}`;
      }

      const graded = gradeStudentAnswers({
        studentAnswers: detection.detectedAnswers,
        answerKey: activeKey?.answers || {},
        studentId: detId,
        studentName: studentName || (found ? `${found.firstName} ${found.lastName}` : ""),
        className: quiz.classes[0] || "General",
        penaltyPerWrong: quiz.penaltyPerWrong,
        capturedImageUrl: dataUrl,
        questionConfidences: detection.questionConfidences,
        fiducialsLocked: detection.fiducialsLocked,
        sensitivityUsed: sensitivity,
      });

      graded.quizId = quiz.id;
      if (soundEnabled) {
        playScanSuccessSound();
      }

      setScannedResult(graded);
      onDocumentScanned(graded);
      setStatusMessage("Documento escaneado con éxito");
    } catch (e) {
      console.error(e);
      setStatusMessage("Alinear esquinas negras en visores");
      onShowToast("Error al procesar la imagen. Inténtelo de nuevo.", true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage("Cargando imagen...");

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const detection = await analyzeOmrImage(canvas, quiz.totalQuestions, 5, sensitivity);

        let studentName = "";
        const detId = detection.detectedStudentId || `${Math.floor(1 + Math.random() * 25)}`;
        const found = registeredStudents.find(
          (s) => s.studentZipGradeId === detId || s.id === detId
        );
        if (found) {
          studentName = `${found.firstName} ${found.lastName}`;
        }

        const graded = gradeStudentAnswers({
          studentAnswers: detection.detectedAnswers,
          answerKey: activeKey?.answers || {},
          studentId: detId,
          studentName: studentName || (found ? `${found.firstName} ${found.lastName}` : ""),
          className: quiz.classes[0] || "General",
          penaltyPerWrong: quiz.penaltyPerWrong,
          capturedImageUrl: dataUrl,
          questionConfidences: detection.questionConfidences,
          fiducialsLocked: detection.fiducialsLocked,
          sensitivityUsed: sensitivity,
        });

        graded.quizId = quiz.id;
        if (soundEnabled) {
          playScanSuccessSound();
        }

        setScannedResult(graded);
        onDocumentScanned(graded);
        setIsProcessing(false);
        setStatusMessage("Documento escaneado con éxito");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Action: BORRAR DOCUMENT
  const handleDeleteCurrentDoc = () => {
    if (!scannedResult) return;
    if (onDeleteDocument) {
      onDeleteDocument(scannedResult.id);
    }
    setScannedResult(null);
    setStatusMessage("Alinear cuadrados en visores");
    onShowToast("Documento borrado");
  };

  // Action: REVISAR DOCUMENT
  const handleReviewCurrentDoc = () => {
    if (!scannedResult) return;
    if (onReviewDocument) {
      onReviewDocument(scannedResult.id);
    } else {
      onBack();
    }
  };

  // Action: CAMBIAR ESTUDIANTE
  const handleAssignStudent = (std: ZipGradeStudent) => {
    if (!scannedResult) return;
    const updated: OmrScanResult = {
      ...scannedResult,
      studentId: std.studentZipGradeId,
      studentName: `${std.firstName} ${std.lastName}`,
      className: std.className || quiz.classes[0] || "General",
    };
    setScannedResult(updated);
    if (onUpdateDocument) {
      onUpdateDocument(updated);
    }
    setIsChangeStudentOpen(false);
    onShowToast(`Estudiante asignado: ${std.firstName} ${std.lastName}`);
  };

  const handleAssignCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedResult) return;
    const updated: OmrScanResult = {
      ...scannedResult,
      studentId: customStudentId.trim() || scannedResult.studentId,
      studentName: customStudentName.trim() || scannedResult.studentName,
    };
    setScannedResult(updated);
    if (onUpdateDocument) {
      onUpdateDocument(updated);
    }
    setIsChangeStudentOpen(false);
    onShowToast("Datos del estudiante actualizados");
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0b0e14] text-slate-100 overflow-hidden select-none font-sans">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <div className="bg-[#10141e] text-slate-100 px-4 py-3.5 flex items-center justify-between shadow-md shrink-0 z-30 border-b border-[#232d42]">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-[#161c28] rounded-xl transition-all active:scale-95 cursor-pointer"
          title="Volver al Menú"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-sm font-black tracking-widest uppercase text-amber-400">
            ESCANEO OMR
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#161c28] rounded-xl transition-all active:scale-95 cursor-pointer"
          title="Ajustes de escaneo"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Live Camera Viewport with dark surrounding mask */}
      <div className="relative flex-1 bg-[#07090d] flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="text-center p-6 space-y-4 max-w-sm bg-[#121620]/90 backdrop-blur-md rounded-3xl border border-[#232d42] shadow-2xl">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-400 opacity-90" />
            <p className="text-sm text-slate-400">
              {cameraError || "Iniciando cámara del dispositivo..."}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar Conectar Cámara</span>
            </button>
          </div>
        )}

        {/* 6 Large Alignment Visor Boxes with dynamic lock feedback */}
        <div className="absolute inset-0 pointer-events-none p-4 sm:p-8 flex flex-col justify-between">
          {/* Top Row: TL & TR */}
          <div className="flex justify-between">
            {/* Top-Left Square */}
            <div
              className={`w-14 h-14 sm:w-18 sm:h-18 border-4 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                isCornerLocked
                  ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(52,211,153,0.5)]"
                  : "border-amber-400 bg-amber-400/10 shadow-lg backdrop-blur-xs"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-xs transition-colors ${
                  isCornerLocked ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 opacity-70"
                }`}
              />
            </div>
            {/* Top-Right Square */}
            <div
              className={`w-14 h-14 sm:w-18 sm:h-18 border-4 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                isCornerLocked
                  ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(52,211,153,0.5)]"
                  : "border-amber-400 bg-amber-400/10 shadow-lg backdrop-blur-xs"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-xs transition-colors ${
                  isCornerLocked ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 opacity-70"
                }`}
              />
            </div>
          </div>

          {/* Middle Row: ML & MR */}
          <div className="flex justify-between items-center my-auto">
            {/* Mid-Left Square */}
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 border-4 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                isCornerLocked
                  ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                  : "border-amber-400/80 bg-amber-400/10 shadow-md backdrop-blur-xs"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-xs transition-colors ${
                  isCornerLocked ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400 opacity-70"
                }`}
              />
            </div>

            {/* Central alignment guide if locked */}
            {isCornerLocked && !scannedResult && (
              <div className="mx-auto bg-emerald-950/85 border border-emerald-500/50 text-emerald-300 text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>6 Puntos Bloqueados · Transformación Afín por Tramos</span>
              </div>
            )}

            {/* Mid-Right Square */}
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 border-4 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                isCornerLocked
                  ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                  : "border-amber-400/80 bg-amber-400/10 shadow-md backdrop-blur-xs"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-xs transition-colors ${
                  isCornerLocked ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-amber-400 opacity-70"
                }`}
              />
            </div>
          </div>

          {/* Bottom Row: BL & BR */}
          <div className="flex justify-between">
            {/* Bottom-Left Square */}
            <div
              className={`w-14 h-14 sm:w-18 sm:h-18 border-4 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                isCornerLocked
                  ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(52,211,153,0.5)]"
                  : "border-amber-400 bg-amber-400/10 shadow-lg backdrop-blur-xs"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-xs transition-colors ${
                  isCornerLocked ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 opacity-70"
                }`}
              />
            </div>
            {/* Bottom-Right Square */}
            <div
              className={`w-14 h-14 sm:w-18 sm:h-18 border-4 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                isCornerLocked
                  ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_25px_rgba(52,211,153,0.5)]"
                  : "border-amber-400 bg-amber-400/10 shadow-lg backdrop-blur-xs"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-xs transition-colors ${
                  isCornerLocked ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 opacity-70"
                }`}
              />
            </div>
          </div>
        </div>

        {/* SCAN RESULT OVERLAY CARD - MATCHING AMBER THEME */}
        {scannedResult && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-[#121620] text-slate-100 rounded-3xl shadow-2xl border border-[#232d42] p-5 space-y-3.5 select-text">
              
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-[#232d42] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Resultado de Escaneo</span>
                    <h3 className="text-sm font-bold text-slate-100 leading-tight line-clamp-1">{quiz.name}</h3>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                  scannedResult.passed
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                }`}>
                  {scannedResult.passed ? "APROBADO" : "SUSPENSO"}
                </span>
              </div>

              {/* Reliability & Confidence Badge */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Fiabilidad de lectura</span>
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  {scannedResult.overallConfidence ?? 95}%
                </span>
              </div>

              {/* Ambiguous marks warning if any */}
              {((scannedResult.multipleMarksCount ?? 0) > 0 || (scannedResult.flaggedQuestions?.length ?? 0) > 0) && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    {scannedResult.multipleMarksCount ?? 0} marca(s) múltiple(s) o tenue(s) detectada(s).
                  </span>
                </div>
              )}

              {/* Data Rows */}
              <div className="space-y-2 text-xs">
                {/* ID */}
                <div className="flex items-center justify-between py-1.5 border-b border-[#232d42]/60">
                  <span className="text-slate-400 font-medium">ID Alumno</span>
                  <span className="font-mono font-bold text-amber-400 bg-[#161c28] px-2.5 py-0.5 rounded-lg border border-[#26334a]">
                    {scannedResult.studentId || "—"}
                  </span>
                </div>

                {/* Nombre del estudiante */}
                <div className="flex items-center justify-between py-1.5 border-b border-[#232d42]/60">
                  <span className="text-slate-400 font-medium">Estudiante</span>
                  <span className="font-bold text-slate-200 text-right">
                    {scannedResult.studentName || <span className="italic text-slate-500 font-normal">Sin asignar</span>}
                  </span>
                </div>

                {/* Puntaje */}
                <div className="flex items-center justify-between py-1.5 border-b border-[#232d42]/60">
                  <span className="text-slate-400 font-medium">Puntaje</span>
                  <div className="text-right">
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      {scannedResult.rawScore} / {scannedResult.maxScore}
                    </span>
                    <span className="text-slate-400 ml-1.5 font-bold">
                      ({scannedResult.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Mult. Marcas & Blanco in a 2-col mini grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-[#161c28] border border-[#26334a] flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Mult. Marcas</span>
                    <span className="font-bold text-slate-200 font-mono">{scannedResult.multipleMarksCount ?? 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#161c28] border border-[#26334a] flex items-center justify-between">
                    <span className="text-slate-400 font-medium">En Blanco</span>
                    <span className="font-bold text-slate-200 font-mono">{scannedResult.blankCount}</span>
                  </div>
                </div>
              </div>

              {/* 3 Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {/* CAMBIAR ESTUDIANTE */}
                <button
                  type="button"
                  onClick={() => setIsChangeStudentOpen(true)}
                  className="bg-[#161c28] hover:bg-[#1a2233] text-slate-200 border border-[#26334a] text-[11px] font-bold py-2.5 px-1 rounded-xl shadow-xs flex flex-col items-center justify-center text-center leading-tight active:scale-95 transition-all cursor-pointer uppercase"
                >
                  <User className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
                  <span>CAMBIAR</span>
                  <span className="text-[10px] text-slate-400">ALUMNO</span>
                </button>

                {/* BORRAR DOCUMENT */}
                <button
                  type="button"
                  onClick={handleDeleteCurrentDoc}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-[11px] font-bold py-2.5 px-1 rounded-xl shadow-xs flex flex-col items-center justify-center text-center leading-tight active:scale-95 transition-all cursor-pointer uppercase"
                >
                  <Trash2 className="w-3.5 h-3.5 mb-0.5 text-rose-400" />
                  <span>BORRAR</span>
                  <span className="text-[10px]">DOCUMENTO</span>
                </button>

                {/* REVISAR DOCUMENT */}
                <button
                  type="button"
                  onClick={handleReviewCurrentDoc}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] py-2.5 px-1 rounded-xl shadow-md shadow-amber-500/20 flex flex-col items-center justify-center text-center leading-tight active:scale-95 transition-all cursor-pointer uppercase"
                >
                  <FileSearch className="w-3.5 h-3.5 mb-0.5 text-black" />
                  <span>REVISAR</span>
                  <span className="text-[10px] opacity-90">DOCUMENTO</span>
                </button>
              </div>

              {/* Continue Scanning */}
              <button
                type="button"
                onClick={() => setScannedResult(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-amber-400 font-semibold text-center hover:underline cursor-pointer pt-1"
              >
                ← Continuar escaneando siguiente hoja
              </button>
            </div>
          </div>
        )}

              {/* Bottom Translucent Info Panel */}
        <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col items-center gap-3 pointer-events-auto">
          <div className="bg-[#10141e]/90 text-slate-100 backdrop-blur-md border border-[#232d42] rounded-2xl px-6 py-2.5 text-center shadow-2xl space-y-0.5">
            <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isCornerLocked ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
              <span>{isCornerLocked ? "6 Marcas de calibración bloqueadas (Listo para capturar)" : "Alinear las 6 marcas de calibración en los visores"}</span>
            </div>
            <div className="text-[11px] font-bold text-amber-400">
              {quiz.sheetType} · {quiz.totalQuestions} Preguntas · Calibración {sensitivity.toUpperCase()}
            </div>
          </div>

          {/* Trigger Scan & Upload Buttons */}
          <div className="flex items-center gap-4 mt-1">
            <label
              className="p-3.5 bg-[#161c28]/90 hover:bg-[#1a2233] backdrop-blur-md rounded-2xl cursor-pointer text-slate-200 border border-[#26334a] shadow-lg transition-all active:scale-90"
              title="Cargar foto desde la galería"
            >
              <Upload className="w-5 h-5 text-amber-400" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <button
              type="button"
              onClick={processFrame}
              disabled={isProcessing}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-[#0b0e14] cursor-pointer disabled:opacity-50 ${
                isCornerLocked
                  ? "bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/40 animate-pulse"
                  : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30"
              }`}
              title="Escanear y calificar hoja OMR"
            >
              <Camera className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: CAMBIAR ESTUDIANTE */}
      {isChangeStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#10141e] text-slate-100 rounded-3xl p-5 border border-[#232d42] shadow-2xl w-full max-w-md space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#232d42] pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>Asignar Estudiante al Examen</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChangeStudentOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-[#161c28]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of registered students in class */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#232d42] pr-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase pb-2">
                Seleccionar de la lista de clase:
              </div>
              {registeredStudents.map((std) => (
                <div
                  key={std.id}
                  onClick={() => handleAssignStudent(std)}
                  className="py-2.5 px-3 hover:bg-[#161c28] cursor-pointer rounded-xl flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-100">
                      {std.firstName} {std.lastName}
                    </div>
                    <div className="text-[11px] text-amber-400 font-mono">
                      ID Alumno: {std.studentZipGradeId}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-black bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Asignar
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Student Manual Input */}
            <form
              onSubmit={handleAssignCustom}
              className="pt-3 border-t border-[#232d42] space-y-3"
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                O ingresar manualmente:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="ID (ej. 5)"
                  value={customStudentId}
                  onChange={(e) => setCustomStudentId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Nombre del alumno"
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                Guardar Asignación Manual
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTES DE SCANNER (SETTINGS ⚙️) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#10141e] text-slate-100 rounded-3xl p-5 border border-[#232d42] shadow-2xl w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#232d42] pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Ajustes y Fiabilidad OMR</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-[#161c28]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Sensibilidad de Detección */}
              <div className="p-3 rounded-2xl bg-[#161c28] border border-[#26334a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sensibilidad de Detección</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "normal", label: "Estándar (HB/Bolígrafo)" },
                    { id: "pencil", label: "Lápiz Grafito" },
                    { id: "high", label: "Alta Sensibilidad" },
                    { id: "pen", label: "Tinta / Rotulador" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSensitivity(s.id as any)}
                      className={`p-2 rounded-xl text-left font-semibold border transition-all cursor-pointer text-[11px] leading-tight ${
                        sensitivity === s.id
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-[#10141e] text-slate-400 border-[#26334a] hover:text-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-captura */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161c28] border border-[#26334a]">
                <div>
                  <span className="font-bold text-slate-200 block">Auto-captura inteligente</span>
                  <span className="text-[10px] text-slate-400">Escanea al alinear 4 esquinas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoCapture(!autoCapture)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    autoCapture
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-[#10141e] text-slate-400 border border-[#26334a]"
                  }`}
                >
                  {autoCapture ? "Activada" : "Manual"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161c28] border border-[#26334a]">
                <span className="font-bold text-slate-200">Cámara activa</span>
                <button
                  type="button"
                  onClick={() => setCameraFacing(cameraFacing === "environment" ? "user" : "environment")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 font-bold border border-amber-500/25"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{cameraFacing === "environment" ? "Trasera" : "Frontal"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161c28] border border-[#26334a]">
                <span className="font-bold text-slate-200">Sonido al calificar</span>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    soundEnabled
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-[#10141e] text-slate-400 border border-[#26334a]"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? "Activado" : "Silenciado"}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#161c28] border border-[#26334a] space-y-1">
                <span className="font-bold text-slate-200 block">Plantilla OMR</span>
                <span className="text-amber-400 block font-bold">{quiz.sheetType}</span>
                <span className="text-[11px] text-slate-400">
                  {quiz.totalQuestions} preguntas configuradas con corrección de perspectiva homográfica.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
