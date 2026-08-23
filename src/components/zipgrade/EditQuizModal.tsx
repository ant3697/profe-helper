import React, { useState } from "react";
import { ZipGradeQuiz, OmrSheetType } from "../../types/omr";
import { X, MoreVertical, Trash2, Copy, RefreshCw } from "lucide-react";

interface EditQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quiz: ZipGradeQuiz) => void;
  onDelete?: (quizId: string) => void;
  onDuplicate?: (quiz: ZipGradeQuiz) => void;
  initialQuiz?: ZipGradeQuiz | null;
  availableClasses: string[];
  availableTags: string[];
}

export const EditQuizModal: React.FC<EditQuizModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  initialQuiz,
  availableClasses,
  availableTags,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialQuiz);

  const [name, setName] = useState(initialQuiz?.name || "Nuevo Quiz");
  const [sheetType, setSheetType] = useState<OmrSheetType>(initialQuiz?.sheetType || "50 Question Form (2)");
  const [date, setDate] = useState(initialQuiz?.date || new Date().toISOString().split("T")[0]);
  const [folder, setFolder] = useState(initialQuiz?.folder || "Main Folder");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialQuiz?.classes || (availableClasses.length > 0 ? [availableClasses[0]] : []));
  const [selectedTags, setSelectedTags] = useState<string[]>(initialQuiz?.tags || []);
  const [totalQuestions, setTotalQuestions] = useState<number>(initialQuiz?.totalQuestions || 40);
  const [penaltyPerWrong, setPenaltyPerWrong] = useState<number>(initialQuiz?.penaltyPerWrong ?? 0.33);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleToggleClass = (className: string) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toUpperCase();
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const quiz: ZipGradeQuiz = {
      id: initialQuiz?.id || `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      sheetType,
      date,
      folder,
      classes: selectedClasses,
      tags: selectedTags,
      totalQuestions,
      penaltyPerWrong,
      activeKeyId: initialQuiz?.activeKeyId || "key_a",
      keys: initialQuiz?.keys || [
        {
          id: "key_a",
          name: "A: PRINCIPAL",
          answers: Object.fromEntries(Array.from({ length: totalQuestions }, (_, i) => [i + 1, "A"])),
          points: Object.fromEntries(Array.from({ length: totalQuestions }, (_, i) => [i + 1, 1])),
          tags: {},
        },
      ],
      scannedDocuments: initialQuiz?.scannedDocuments || [],
      createdAt: initialQuiz?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(quiz);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#10141e] rounded-3xl shadow-2xl border border-[#232d42] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-[#232d42] text-center relative bg-[#0b0e14]">
          <h2 className="text-base font-black text-amber-400">
            {isEditing ? "Editar quiz" : "Nuevo quiz"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-[#161c28] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Nombre */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all placeholder:text-slate-500"
              placeholder="Ej. Rec RA04 Tipo A"
            />
          </div>

          {/* Hoja de respuestas */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Hoja de respuestas
            </label>
            <select
              value={sheetType}
              onChange={(e) => {
                const val = e.target.value as OmrSheetType;
                setSheetType(val);
                if (val.includes("20")) setTotalQuestions(20);
                else if (val.includes("50")) setTotalQuestions(50);
                else if (val.includes("100")) setTotalQuestions(100);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all cursor-pointer"
            >
              <option value="50 Question Form (2)">50 Question Form (2)</option>
              <option value="50 Question Form (1)">50 Question Form (1)</option>
              <option value="20 Question Form">20 Question Form</option>
              <option value="100 Question Form">100 Question Form</option>
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Carpeta
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all cursor-pointer"
            >
              <option value="Main Folder">📁 Carpeta Principal</option>
              <option value="Exámenes 2025/2026">📁 Exámenes 2025/2026</option>
              <option value="Recuperaciones">📁 Recuperaciones</option>
              <option value="Pruebas Cortas">📁 Pruebas Cortas</option>
            </select>
          </div>

          {/* Total Preguntas & Penalización */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nº Preguntas
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Penalización error
              </label>
              <select
                value={penaltyPerWrong}
                onChange={(e) => setPenaltyPerWrong(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
              >
                <option value={0.33}>-0.33 (1/3)</option>
                <option value={0.25}>-0.25 (1/4)</option>
                <option value={0.5}>-0.50 (1/2)</option>
                <option value={0}>0 (Sin penalizar)</option>
              </select>
            </div>
          </div>

          {/* Clases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                Clases ({selectedClasses.length})
              </label>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-[#232d42] rounded-2xl p-2.5 bg-[#0b0e14]">
              {availableClasses.map((cls) => {
                const checked = selectedClasses.includes(cls);
                return (
                  <label
                    key={cls}
                    onClick={() => handleToggleClass(cls)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#161c28] cursor-pointer text-sm font-medium text-slate-200 select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded-md accent-amber-500 border-[#26334a]"
                    />
                    <span>{cls}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                Criterios / Etiquetas ({selectedTags.length})
              </label>
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
              >
                + AÑADIR ETIQUETA
              </button>
            </div>

            {isAddingTag && (
              <div className="flex items-center gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="Ej. RA04, CE4.a"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewTag())}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-amber-500/50 bg-[#161c28] text-slate-100 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="bg-amber-500 text-black text-xs px-3.5 py-2 rounded-xl font-black hover:bg-amber-400 cursor-pointer"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-2 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 border border-[#232d42] rounded-2xl bg-[#0b0e14]">
              {availableTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                      active
                        ? "bg-amber-500 text-black border-amber-500 shadow-xs"
                        : "bg-[#161c28] text-slate-300 border-[#26334a] hover:border-amber-500/50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {availableTags.length === 0 && (
                <span className="text-xs text-slate-500">No hay etiquetas disponibles</span>
              )}
            </div>
          </div>

          {/* Bottom Actions matching screenshot */}
          <div className="pt-3 border-t border-[#232d42] flex items-center justify-between relative">
            <div className="relative">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-[#161c28] transition-colors uppercase tracking-wider cursor-pointer"
                >
                  MÁS
                </button>
              )}

              {showMoreMenu && isEditing && initialQuiz && (
                <div className="absolute left-0 bottom-full mb-2 bg-[#121620] border border-[#232d42] shadow-2xl rounded-2xl py-1.5 w-52 z-30 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      if (onDuplicate) onDuplicate(initialQuiz);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-[#161c28] flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copiar prueba</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-[#161c28] flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Forzar sincronización</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      if (onDelete && confirm(`¿Eliminar permanentemente el quiz "${initialQuiz.name}"?`)) {
                        onDelete(initialQuiz.id);
                        onClose();
                      }
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-[#232d42] mt-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-rose-400 hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-colors uppercase tracking-wider cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="text-xs font-black text-black bg-amber-500 hover:bg-amber-400 px-5 py-2.5 rounded-xl transition-colors uppercase tracking-wider cursor-pointer shadow-md shadow-amber-500/20"
              >
                GUARDAR
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
