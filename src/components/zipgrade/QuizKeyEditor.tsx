import React, { useState } from "react";
import { ZipGradeQuiz, ZipGradeQuizKey } from "../../types/omr";
import { OMR_LETTERS } from "../../utils/omrProcessor";
import { Camera, Plus, Trash2, Info, Check, Sparkles, Tag, ShieldCheck } from "lucide-react";

interface QuizKeyEditorProps {
  quiz: ZipGradeQuiz;
  onUpdateQuiz: (updatedQuiz: ZipGradeQuiz) => void;
  onScanKeyWithCamera: () => void;
  availableTags: string[];
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const QuizKeyEditor: React.FC<QuizKeyEditorProps> = ({
  quiz,
  onUpdateQuiz,
  onScanKeyWithCamera,
  availableTags,
  onShowToast,
}) => {
  const [activeKeyId, setActiveKeyId] = useState<string>(quiz.activeKeyId || quiz.keys[0]?.id || "key_a");
  const [editingQuestionForTags, setEditingQuestionForTags] = useState<number | null>(null);

  const activeKeyIndex = quiz.keys.findIndex((k) => k.id === activeKeyId);
  const activeKey = quiz.keys[activeKeyIndex >= 0 ? activeKeyIndex : 0] || {
    id: "key_a",
    name: "A: PRINCIPAL",
    answers: {},
    points: {},
    tags: {},
  };

  const handleSelectAnswer = (questionNum: number, letter: string) => {
    const updatedAnswers = { ...activeKey.answers, [questionNum]: letter };
    const updatedKeys = [...quiz.keys];
    updatedKeys[activeKeyIndex] = {
      ...activeKey,
      answers: updatedAnswers,
    };

    onUpdateQuiz({
      ...quiz,
      keys: updatedKeys,
      updatedAt: Date.now(),
    });
  };

  const handleUpdatePoints = (questionNum: number, pts: number) => {
    const updatedPoints = { ...activeKey.points, [questionNum]: pts };
    const updatedKeys = [...quiz.keys];
    updatedKeys[activeKeyIndex] = {
      ...activeKey,
      points: updatedPoints,
    };

    onUpdateQuiz({
      ...quiz,
      keys: updatedKeys,
      updatedAt: Date.now(),
    });
  };

  const handleToggleTag = (questionNum: number, tag: string) => {
    const currentTags = activeKey.tags?.[questionNum] || [];
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];

    const updatedTagsMap = { ...(activeKey.tags || {}), [questionNum]: newTags };
    const updatedKeys = [...quiz.keys];
    updatedKeys[activeKeyIndex] = {
      ...activeKey,
      tags: updatedTagsMap,
    };

    onUpdateQuiz({
      ...quiz,
      keys: updatedKeys,
      updatedAt: Date.now(),
    });
  };

  const handleAddKey = () => {
    const nextLetter = String.fromCharCode(65 + quiz.keys.length);
    const newKeyId = `key_${Date.now()}`;
    const newKey: ZipGradeQuizKey = {
      id: newKeyId,
      name: `${nextLetter}: VARIANTE ${nextLetter}`,
      answers: { ...activeKey.answers },
      points: { ...activeKey.points },
      tags: { ...activeKey.tags },
    };

    onUpdateQuiz({
      ...quiz,
      keys: [...quiz.keys, newKey],
      activeKeyId: newKeyId,
      updatedAt: Date.now(),
    });
    setActiveKeyId(newKeyId);
    onShowToast(`Clave variante ${nextLetter} agregada`);
  };

  const handleDeleteKey = (keyId: string) => {
    if (quiz.keys.length <= 1) {
      onShowToast("El examen debe tener al menos una clave de respuestas", true);
      return;
    }
    const filtered = quiz.keys.filter((k) => k.id !== keyId);
    onUpdateQuiz({
      ...quiz,
      keys: filtered,
      activeKeyId: filtered[0].id,
      updatedAt: Date.now(),
    });
    setActiveKeyId(filtered[0].id);
    onShowToast("Clave eliminada");
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* Subheader info */}
      <div className="px-4 py-2.5 border-b border-[#232d42] bg-[#10141e] flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Examen: </span>
          <span className="text-sm font-bold text-amber-400">{quiz.name}</span>
        </div>
        <button
          type="button"
          onClick={onScanKeyWithCamera}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>ESCANEAR CLAVE MAESTRA</span>
        </button>
      </div>

      {/* Keys Tabs (A: PRINCIPAL, B, C...) */}
      <div className="flex items-center border-b border-[#232d42] bg-[#10141e] overflow-x-auto px-3 py-2 gap-2">
        {quiz.keys.map((k) => {
          const isActive = k.id === activeKeyId;
          return (
            <div key={k.id} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveKeyId(k.id);
                  onUpdateQuiz({ ...quiz, activeKeyId: k.id });
                }}
                className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-[#161c28] text-slate-400 border-[#26334a] hover:text-slate-200"
                }`}
              >
                {k.name}
              </button>
              {quiz.keys.length > 1 && isActive && (
                <button
                  type="button"
                  onClick={() => handleDeleteKey(k.id)}
                  className="ml-1 p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md"
                  title="Eliminar esta clave"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleAddKey}
          className="px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 rounded-xl flex items-center gap-1 border border-dashed border-amber-500/40 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ AGREGAR CLAVE</span>
        </button>
      </div>

      {/* Bubble Matrix List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>Pulse una burbuja para definir la respuesta correcta</span>
          <span className="font-semibold text-amber-400">Total: {quiz.totalQuestions} Preguntas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Array.from({ length: quiz.totalQuestions }, (_, i) => {
            const qNum = i + 1;
            const currentAns = activeKey.answers?.[qNum] || "";
            const currentPts = activeKey.points?.[qNum] ?? 1;
            const currentTags = activeKey.tags?.[qNum] || [];

            return (
              <div
                key={qNum}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#232d42] bg-[#121620] hover:bg-[#161c28] transition-colors"
              >
                {/* Number */}
                <span className="w-8 text-xs font-black font-mono text-slate-400">
                  {qNum}.
                </span>

                {/* Bubbles A B C D E */}
                <div className="flex items-center gap-1.5">
                  {OMR_LETTERS.slice(0, 5).map((letter) => {
                    const isSelected = currentAns === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleSelectAnswer(qNum, letter)}
                        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center border-2 transition-transform active:scale-90 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 font-black"
                            : "bg-[#1a2233] text-slate-300 border-[#2e3e5c] hover:border-amber-400/60"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>

                {/* Points & Tags */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newPts = currentPts === 1 ? 2 : currentPts === 2 ? 0.5 : 1;
                      handleUpdatePoints(qNum, newPts);
                    }}
                    className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer"
                    title="Modificar puntuación de la pregunta"
                  >
                    {currentPts}pt
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingQuestionForTags(editingQuestionForTags === qNum ? null : qNum)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      currentTags.length > 0
                        ? "text-amber-400 bg-amber-500/15 border border-amber-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-[#1e273a]"
                    }`}
                    title="Asignar criterios / etiquetas RA / CE"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tag Assignment Dialog / Popover if active */}
      {editingQuestionForTags !== null && (
        <div className="p-3.5 bg-[#121620] border-t border-[#232d42] animate-slideUp">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200">
              Etiquetas para Pregunta {editingQuestionForTags}:
            </span>
            <button
              type="button"
              onClick={() => setEditingQuestionForTags(null)}
              className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {availableTags.map((tag) => {
              const assigned = (activeKey.tags?.[editingQuestionForTags] || []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(editingQuestionForTags, tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                    assigned
                      ? "bg-amber-500 text-black border-amber-500 shadow-xs"
                      : "bg-[#1a2233] text-slate-300 border-[#2e3e5c] hover:border-amber-400"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
