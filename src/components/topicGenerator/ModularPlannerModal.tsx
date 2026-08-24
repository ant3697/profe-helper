import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  ListTree,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { TopicSectionPlan, TopicOutlineBlueprint, TopicDepth } from "../../types/thematicDoc";

interface ModularPlannerModalProps {
  isOpen: boolean;
  topicTitle: string;
  depth: TopicDepth;
  blueprint: TopicOutlineBlueprint | null;
  isLoadingOutline: boolean;
  onClose: () => void;
  onUpdateBlueprint: (updated: TopicOutlineBlueprint) => void;
  onConfirmStartModular: () => void;
  onRegenerateOutline: () => void;
}

export const ModularPlannerModal: React.FC<ModularPlannerModalProps> = ({
  isOpen,
  topicTitle,
  depth,
  blueprint,
  isLoadingOutline,
  onClose,
  onUpdateBlueprint,
  onConfirmStartModular,
  onRegenerateOutline,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  if (!isOpen) return null;

  const handleStartEdit = (idx: number, sec: TopicSectionPlan) => {
    setEditingIndex(idx);
    setEditTitle(sec.title);
    setEditDesc(sec.description || "");
  };

  const handleSaveEdit = (idx: number) => {
    if (!blueprint) return;
    const updatedSections = [...blueprint.sections];
    updatedSections[idx] = {
      ...updatedSections[idx],
      title: editTitle.trim() || updatedSections[idx].title,
      description: editDesc.trim(),
    };
    onUpdateBlueprint({
      ...blueprint,
      sections: updatedSections,
    });
    setEditingIndex(null);
  };

  const handleDeleteSection = (idx: number) => {
    if (!blueprint || blueprint.sections.length <= 2) return;
    const updatedSections = blueprint.sections.filter((_, i) => i !== idx).map((sec, newIdx) => ({
      ...sec,
      sectionNumber: `3.${newIdx + 1}`,
    }));
    onUpdateBlueprint({
      ...blueprint,
      sections: updatedSections,
    });
  };

  const handleAddSection = () => {
    if (!blueprint) return;
    const nextNum = blueprint.sections.length + 1;
    const newSec: TopicSectionPlan = {
      id: `sec-${Date.now()}`,
      sectionNumber: `3.${nextNum}`,
      title: `Nuevo Epígrafe ${nextNum}`,
      description: "Conceptos, procedimientos técnicos y criterios normativos.",
      status: "pending",
    };
    onUpdateBlueprint({
      ...blueprint,
      sections: [...blueprint.sections, newSec],
    });
  };

  const estimatedWords = blueprint ? blueprint.sections.length * (depth === "resumen" ? 450 : depth === "estandar" ? 750 : 1050) + 1200 : 0;
  const estimatedTimeMin = blueprint ? Math.ceil(blueprint.sections.length * 0.4 + 0.5) : 0;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border-2 border-amber-500/80 shadow-2xl rounded-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border-default flex items-center justify-between bg-alt/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                  FASE 1: BLUEPRINT ESTRUCTURAL
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold uppercase">
                  {depth}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-text-primary mt-0.5 truncate max-w-[380px] sm:max-w-[460px]" title={topicTitle}>
                {topicTitle || "Planificación del Índice Modular"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-hover transition-colors cursor-pointer"
            title="Cerrar planificador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {isLoadingOutline ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20">
                <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
              </div>
              <p className="text-sm font-bold text-text-primary">
                Estructurando Blueprint e Índice Maestro con IA...
              </p>
              <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                Analizando el documento base y organizando los epígrafes correlativos para garantizar máxima profundidad y cero cortes.
              </p>
            </div>
          ) : blueprint ? (
            <>
              {/* Estimates Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-alt/80 rounded-xl border border-border-default text-xs font-medium">
                <div className="flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-text-muted block text-[10px]">Epígrafes Centrales:</span>
                    <span className="font-bold text-text-primary">{blueprint.sections.length} secciones</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-text-muted block text-[10px]">Volumen Estimado:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">~{estimatedWords.toLocaleString()} palabras</span>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-text-muted block text-[10px]">Tiempo Generación:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">~{estimatedTimeMin} min (secuencial)</span>
                  </div>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold text-text-secondary flex items-center gap-1.5">
                    <ListTree className="w-4 h-4 text-amber-500" />
                    Epígrafes Técnicos del Desarrollo (3.x)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Añadir Epígrafe
                  </button>
                </div>

                <div className="space-y-2">
                  {blueprint.sections.map((sec, idx) => {
                    const isEditing = editingIndex === idx;
                    return (
                      <div
                        key={sec.id || idx}
                        className="bg-surface border border-border-default hover:border-amber-500/50 p-3 rounded-xl transition-all shadow-xs space-y-1.5"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-500 text-xs shrink-0">
                                {sec.sectionNumber}
                              </span>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Título del epígrafe..."
                                className="flex-1 bg-alt border border-border-strong rounded-lg px-2.5 py-1 text-xs text-text-primary font-bold outline-none focus:border-amber-500"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Directrices de contenido técnico a desarrollar..."
                              className="w-full bg-alt border border-border-strong rounded-lg p-2 text-[11px] text-text-secondary outline-none focus:border-amber-500 resize-none"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingIndex(null)}
                                className="px-2.5 py-1 text-[11px] font-bold text-text-muted hover:text-text-primary rounded cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(idx)}
                                className="px-3 py-1 text-[11px] font-bold bg-amber-500 text-black rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-500 text-xs shrink-0">
                                  {sec.sectionNumber}
                                </span>
                                <h4 className="text-xs font-bold text-text-primary truncate">
                                  {sec.title}
                                </h4>
                              </div>
                              {sec.description && (
                                <p className="text-[11px] text-text-muted mt-1 leading-snug line-clamp-2">
                                  {sec.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(idx, sec)}
                                className="p-1 text-text-muted hover:text-amber-500 hover:bg-alt rounded transition-colors cursor-pointer"
                                title="Editar título o descripción"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {blueprint.sections.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSection(idx)}
                                  className="p-1 text-text-muted hover:text-red-500 hover:bg-alt rounded transition-colors cursor-pointer"
                                  title="Eliminar epígrafe"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Complementary Sections Note */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-text-secondary flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-primary block">Estructura A4 Integral Incluida:</span>
                  El documento incluirá automáticamente portada <strong>1. ÍNDICE</strong>, <strong>2. INTRODUCCIÓN</strong>, <strong>4. CONCLUSIÓN</strong>, <strong>5. BIBLIOGRAFÍA</strong>, <strong>6. NORMATIVA</strong> y <strong>7. GLOSARIO/TESTS</strong> correlativos.
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              No se pudo cargar el blueprint. Pulsa regenerar para intentarlo de nuevo.
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-3 bg-alt/60">
          <button
            type="button"
            onClick={onRegenerateOutline}
            disabled={isLoadingOutline}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary bg-surface border border-border-default hover:bg-hover rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOutline ? "animate-spin" : ""}`} />
            <span>Re-sugerir Índice con IA</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-text-secondary hover:text-text-primary bg-surface border border-border-default hover:bg-hover rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmStartModular}
              disabled={isLoadingOutline || !blueprint || blueprint.sections.length === 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-black text-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>INICIAR REDACCIÓN MODULAR</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
