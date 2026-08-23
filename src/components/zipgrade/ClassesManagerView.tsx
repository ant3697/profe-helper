import React, { useState } from "react";
import { ZipGradeClass, ZipGradeQuiz, ZipGradeStudent } from "../../types/omr";
import { Users, Search, Plus, Trash2, BookOpen, GraduationCap, X } from "lucide-react";

interface ClassesManagerViewProps {
  classes: ZipGradeClass[];
  quizzes: ZipGradeQuiz[];
  students: ZipGradeStudent[];
  onAddClass: (newClass: ZipGradeClass) => void;
  onDeleteClass: (classId: string) => void;
  onSelectClassForQuizzes?: (className: string) => void;
}

export const ClassesManagerView: React.FC<ClassesManagerViewProps> = ({
  classes,
  quizzes,
  students,
  onAddClass,
  onDeleteClass,
  onSelectClassForQuizzes,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newCls: ZipGradeClass = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newClassName.trim(),
      quizIds: [],
      studentIds: [],
      createdAt: Date.now(),
    };
    onAddClass(newCls);
    setNewClassName("");
    setIsAdding(false);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* Search bar */}
      <div className="p-3.5 bg-[#10141e] border-b border-[#232d42]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar clases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Classes list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]">
        {filteredClasses.map((cls) => {
          const classQuizzesCount = quizzes.filter((q) => q.classes.includes(cls.name)).length;
          const classStudentsCount = students.filter(
            (s) => s.classId === cls.id || s.className === cls.name
          ).length;

          return (
            <div
              key={cls.id}
              onClick={() => onSelectClassForQuizzes && onSelectClassForQuizzes(cls.name)}
              className="p-4 hover:bg-[#161c28]/60 cursor-pointer flex items-center justify-between transition-colors group"
            >
              <div>
                <h4 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                  {cls.name}
                </h4>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span className="text-amber-400 font-semibold">{classQuizzesCount} Exámenes</span>
                  <span>·</span>
                  <span>{classStudentsCount} Estudiantes</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar la clase "${cls.name}"?`)) {
                      onDeleteClass(cls.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Eliminar clase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredClasses.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-sm font-bold text-slate-200">No se encontraron clases</p>
          </div>
        )}
      </div>

      {/* Floating Action Button: + NUEVA CLASE */}
      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>+ NUEVA CLASE</span>
        </button>
      </div>

      {/* Modal create class */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-[#121620] rounded-2xl p-5 border border-[#232d42] shadow-2xl w-full max-w-sm space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nueva Clase</h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de la Clase
              </label>
              <input
                type="text"
                required
                placeholder="Ej. TEMINS 25_26, 1º CFGM"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-medium"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs font-bold px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="text-xs font-black px-4 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 uppercase shadow-md shadow-amber-500/20"
              >
                GUARDAR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
