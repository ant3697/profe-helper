import React, { useState } from "react";
import { ZipGradeQuiz, OmrScanResult } from "../../types/omr";
import { OMR_LETTERS, gradeStudentAnswers } from "../../utils/omrProcessor";
import {
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronRight,
  Eye,
  Calendar,
} from "lucide-react";

interface ReviewDocumentsViewProps {
  quiz: ZipGradeQuiz;
  onUpdateQuiz: (updatedQuiz: ZipGradeQuiz) => void;
  onShowToast: (msg: string, isError?: boolean) => void;
  initialDocId?: string | null;
}

export const ReviewDocumentsView: React.FC<ReviewDocumentsViewProps> = ({
  quiz,
  onUpdateQuiz,
  onShowToast,
  initialDocId,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<OmrScanResult | null>(() => {
    if (initialDocId) {
      return quiz.scannedDocuments.find((d) => d.id === initialDocId) || null;
    }
    return null;
  });
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<{ [qNum: number]: string | null }>(() => {
    if (initialDocId) {
      const doc = quiz.scannedDocuments.find((d) => d.id === initialDocId);
      if (doc) {
        const ansMap: { [qNum: number]: string | null } = {};
        doc.questionGrades.forEach((g) => {
          ansMap[g.questionNumber] = g.studentAnswer;
        });
        return ansMap;
      }
    }
    return {};
  });

  const activeKey = quiz.keys.find((k) => k.id === quiz.activeKeyId) || quiz.keys[0];

  const handleOpenDoc = (doc: OmrScanResult) => {
    setSelectedDoc(doc);
    const ansMap: { [qNum: number]: string | null } = {};
    doc.questionGrades.forEach((g) => {
      ansMap[g.questionNumber] = g.studentAnswer;
    });
    setEditedAnswers(ansMap);
    setIsEditingAnswers(false);
  };

  const handleDeleteDoc = (docId: string) => {
    if (!confirm("¿Eliminar este examen escaneado?")) return;
    const updatedDocs = quiz.scannedDocuments.filter((d) => d.id !== docId);
    onUpdateQuiz({
      ...quiz,
      scannedDocuments: updatedDocs,
      updatedAt: Date.now(),
    });
    setSelectedDoc(null);
    onShowToast("Documento eliminado");
  };

  const handleSaveEditedAnswers = () => {
    if (!selectedDoc) return;

    const reGraded = gradeStudentAnswers({
      studentAnswers: editedAnswers,
      answerKey: activeKey?.answers || {},
      studentId: selectedDoc.studentId,
      studentName: selectedDoc.studentName,
      className: selectedDoc.className,
      penaltyPerWrong: selectedDoc.penaltyPerWrong,
      capturedImageUrl: selectedDoc.capturedImageUrl,
    });
    reGraded.id = selectedDoc.id;
    reGraded.timestamp = selectedDoc.timestamp;
    reGraded.quizId = quiz.id;

    const updatedDocs = quiz.scannedDocuments.map((d) => (d.id === selectedDoc.id ? reGraded : d));
    onUpdateQuiz({
      ...quiz,
      scannedDocuments: updatedDocs,
      updatedAt: Date.now(),
    });

    setSelectedDoc(reGraded);
    setIsEditingAnswers(false);
    onShowToast("Calificación recalculada y guardada");
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* If inspecting a specific document */}
      {selectedDoc ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Inspection Top bar */}
          <div className="p-3.5 bg-[#10141e] border-b border-[#232d42] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Volver a la lista
            </button>
            <div className="flex items-center gap-2">
              {!isEditingAnswers ? (
                <button
                  type="button"
                  onClick={() => setIsEditingAnswers(true)}
                  className="px-3 py-1.5 bg-[#161c28] border border-[#26334a] hover:bg-[#1a2233] text-xs font-bold text-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Corregir Marcas</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveEditedAnswers}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-xs font-black text-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteDoc(selectedDoc.id)}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                title="Eliminar documento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student details summary card */}
          <div className="p-4 bg-[#121620] border-b border-[#232d42] flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-100">{selectedDoc.studentName}</h3>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>ID Alumno: <strong className="text-amber-400">{selectedDoc.studentId}</strong></span>
                <span>·</span>
                <span>Clase: <strong className="text-slate-300">{selectedDoc.className}</strong></span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-slate-100 font-mono">
                {selectedDoc.rawScore} / {selectedDoc.maxScore}
              </div>
              <div className="text-xs font-bold text-amber-400 mt-0.5">
                Nota: {selectedDoc.grade10.toFixed(2)}/10 ({selectedDoc.percentage}%)
              </div>
            </div>
          </div>

          {/* Question marks visual inspector */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedDoc.questionGrades.map((q) => {
                const currentAnswer = isEditingAnswers ? editedAnswers[q.questionNumber] : q.studentAnswer;
                const isCorrect = currentAnswer === q.correctAnswer;
                const isBlank = !currentAnswer;

                return (
                  <div
                    key={q.questionNumber}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                      isBlank
                        ? "border-amber-500/30 bg-amber-500/5"
                        : isCorrect
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 text-xs font-black font-mono text-slate-400">
                        {q.questionNumber}.
                      </span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isBlank ? (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>

                    {/* Bubbles */}
                    <div className="flex items-center gap-1.5">
                      {OMR_LETTERS.slice(0, 5).map((letter) => {
                        const isStudentMark = currentAnswer === letter;
                        const isCorrectKey = q.correctAnswer === letter;

                        let bubbleStyle = "bg-[#161c28] text-slate-400 border-[#26334a]";
                        if (isStudentMark && isCorrectKey) {
                          bubbleStyle = "bg-emerald-500 text-black border-emerald-400 font-black shadow-xs";
                        } else if (isStudentMark && !isCorrectKey) {
                          bubbleStyle = "bg-rose-500 text-white border-rose-400 font-black shadow-xs";
                        } else if (isCorrectKey) {
                          bubbleStyle = "border-emerald-400 text-emerald-400 bg-emerald-500/10 border-2 font-bold";
                        }

                        return (
                          <button
                            key={letter}
                            type="button"
                            disabled={!isEditingAnswers}
                            onClick={() => {
                              if (isEditingAnswers) {
                                setEditedAnswers({
                                  ...editedAnswers,
                                  [q.questionNumber]: currentAnswer === letter ? null : letter,
                                });
                              }
                            }}
                            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center border transition-all ${bubbleStyle} ${
                              isEditingAnswers ? "cursor-pointer hover:scale-110 active:scale-95" : ""
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Scanned Documents List */
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]">
          {quiz.scannedDocuments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Eye className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="text-sm font-bold text-slate-200">No hay exámenes escaneados aún</p>
              <p className="text-xs mt-1 text-slate-400">Utilice el botón "ESCANEAR DOCUMENTOS" para calificar hojas.</p>
            </div>
          ) : (
            quiz.scannedDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc)}
                className="p-4 hover:bg-[#161c28]/60 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-black text-sm">
                    {doc.grade10.toFixed(1)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{doc.studentName}</h4>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
                        ID: {doc.studentId}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-100 font-mono">
                      {doc.rawScore.toFixed(1)} / {doc.maxScore}
                    </span>
                    <span className="text-xs text-amber-400 block font-semibold">
                      {doc.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
