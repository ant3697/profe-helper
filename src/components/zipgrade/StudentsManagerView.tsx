import React, { useState } from "react";
import { ZipGradeStudent, ZipGradeClass } from "../../types/omr";
import { User, Search, Plus, Trash2, X, ArrowUpDown, Edit2 } from "lucide-react";

interface StudentsManagerViewProps {
  students: ZipGradeStudent[];
  classes: ZipGradeClass[];
  onAddStudent: (newStudent: ZipGradeStudent) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentsManagerView: React.FC<StudentsManagerViewProps> = ({
  students,
  classes,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"lastName" | "firstName" | "id">("lastName");
  const [isAdding, setIsAdding] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentZipGradeId, setStudentZipGradeId] = useState("");
  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || "TEMINS 25_26");

  const filteredStudents = students
    .filter(
      (s) =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentZipGradeId.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === "lastName") return a.lastName.localeCompare(b.lastName);
      if (sortBy === "firstName") return a.firstName.localeCompare(b.firstName);
      return a.studentZipGradeId.localeCompare(b.studentZipGradeId);
    });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const newStd: ZipGradeStudent = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      studentZipGradeId: studentZipGradeId.trim() || `${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      className: selectedClass,
    };
    onAddStudent(newStd);
    setFirstName("");
    setLastName("");
    setStudentZipGradeId("");
    setIsAdding(false);
  };

  return (
    <div className="relative flex flex-col h-full bg-[#0b0e14] text-slate-100">
      {/* Top Filter & Sort Bar */}
      <div className="p-3.5 bg-[#10141e] border-b border-[#232d42] space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Ordenar por</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 py-1.5 px-2.5 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 font-bold outline-hidden cursor-pointer"
          >
            <option value="lastName">Apellido</option>
            <option value="firstName">Nombre</option>
            <option value="id">ID de Alumno</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID de alumno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Students list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]">
        {filteredStudents.map((std) => (
          <div
            key={std.id}
            className="p-3.5 hover:bg-[#161c28]/60 flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#161c28] border border-[#26334a] flex items-center justify-center text-amber-400 font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                  {std.firstName} {std.lastName}
                </h4>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    ID: {std.studentZipGradeId}
                  </span>
                  <span>·</span>
                  <span className="text-slate-400">{std.className || "Sin clase"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar al estudiante "${std.firstName} ${std.lastName}"?`)) {
                    onDeleteStudent(std.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Eliminar estudiante"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <User className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-sm font-bold text-slate-200">No se encontraron estudiantes</p>
          </div>
        )}
      </div>

      {/* Floating Action Button: + NUEVO ESTUDIANTE */}
      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>+ NUEVO ESTUDIANTE</span>
        </button>
      </div>

      {/* Modal create student */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-[#121620] rounded-2xl p-5 border border-[#232d42] shadow-2xl w-full max-w-sm space-y-3.5 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-[#232d42] pb-2">
              <h3 className="text-base font-bold text-white">Nuevo Estudiante</h3>
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
                Apellidos
              </label>
              <input
                type="text"
                required
                placeholder="Ej. García López"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Alejandro"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID Alumno (1-5 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="1001"
                  value={studentZipGradeId}
                  onChange={(e) => setStudentZipGradeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Clase Asignada
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#232d42]">
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
