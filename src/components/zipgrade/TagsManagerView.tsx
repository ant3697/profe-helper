import React, { useState } from "react";
import { ZipGradeTag } from "../../types/omr";
import { Tag, Search, Plus, Trash2, X } from "lucide-react";

interface TagsManagerViewProps {
  tags: ZipGradeTag[];
  onAddTag: (newTag: ZipGradeTag) => void;
  onDeleteTag: (tagId: string) => void;
}

export const TagsManagerView: React.FC<TagsManagerViewProps> = ({
  tags,
  onAddTag,
  onDeleteTag,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"RA" | "CE" | "THEME" | "OTHER">("RA");

  const filteredTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTag: ZipGradeTag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim().toUpperCase(),
      description: description.trim(),
      category,
    };
    onAddTag(newTag);
    setName("");
    setDescription("");
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
            placeholder="Buscar etiquetas (RA, CE, tema)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
          />
        </div>
      </div>

      {/* Tags list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="p-4 hover:bg-[#161c28]/60 flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">{tag.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#161c28] border border-[#26334a] text-slate-300">
                    {tag.category || "General"}
                  </span>
                </div>
                {tag.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{tag.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar la etiqueta "${tag.name}"?`)) {
                    onDeleteTag(tag.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Eliminar etiqueta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredTags.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Tag className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-sm font-bold text-slate-200">No se encontraron etiquetas</p>
          </div>
        )}
      </div>

      {/* Floating Action Button: + NUEVA ETIQUETA */}
      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>+ NUEVA ETIQUETA</span>
        </button>
      </div>

      {/* Modal create tag */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-[#121620] rounded-2xl p-5 border border-[#232d42] shadow-2xl w-full max-w-sm space-y-3.5 text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-[#232d42] pb-2">
              <h3 className="text-base font-bold text-white">Nueva Etiqueta</h3>
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
                Nombre / Código
              </label>
              <input
                type="text"
                required
                placeholder="Ej. RA04, CE4.a, Termodinámica"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-bold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo / Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden font-medium"
              >
                <option value="RA">Resultado de Aprendizaje (RA)</option>
                <option value="CE">Criterio de Evaluación (CE)</option>
                <option value="THEME">Tema / Bloque Teórico</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descripción (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Parámetros de funcionamiento y diagnóstico"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
              />
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
