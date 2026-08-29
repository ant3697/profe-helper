import React, { useState } from "react";
import {
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Clock,
  Calendar,
  Layers,
  FileCode2,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";
import { SigreUDItem } from "../../types/sigre";

interface SigreRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ud: SigreUDItem | null;
  onConfirm: (ud: SigreUDItem) => void;
  isGenerating?: boolean;
}

export const SigreRegenerateModal: React.FC<SigreRegenerateModalProps> = ({
  isOpen,
  onClose,
  ud,
  onConfirm,
  isGenerating = false,
}) => {
  const [understood, setUnderstood] = useState(false);

  // Reset checkbox when modal opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setUnderstood(false);
    }
  }, [isOpen, ud?.id]);

  if (!isOpen || !ud) return null;

  const handleApprove = () => {
    if (!understood && ud.status === "completed") return;
    onConfirm(ud);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border-default rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-alt/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <RefreshCw className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary flex items-center gap-2">
                Confirmar Regeneración de UD
              </h2>
              <p className="text-xs text-text-muted">
                Validación de reemplazo y re-ejecución del pipeline de IA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface border border-transparent hover:border-border-default transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Target UD Summary Card */}
          <div className="p-4 bg-background border border-amber-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black font-mono px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {ud.id} &bull; {ud.bcCode}
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {ud.horasEstimadas || 12}h lectivas
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  {ud.sesionesEstimadas || 6} sesiones
                </span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              {ud.title}
            </h3>
          </div>

          {/* Warning notice */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">
                ¿Deseas volver a generar esta Unidad Didáctica?
              </p>
              <p className="text-text-muted leading-relaxed">
                Esta acción volverá a consultar a los modelos de Inteligencia Artificial utilizando las directrices curriculares actualizadas y regenerará íntegramente:
              </p>
            </div>
          </div>

          {/* Impact list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-surface border border-border-default rounded-lg flex items-start gap-2">
              <FileCode2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary block">Módulo 1: Tema Oficial</span>
                <span className="text-[11px] text-text-muted">Epígrafes 5.1 a 5.x, Glosario, Autoevaluación y Diagrama Mermaid.</span>
              </div>
            </div>

            <div className="p-2.5 bg-surface border border-border-default rounded-lg flex items-start gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary block">Mapa Mental OPML (Tony Buzan)</span>
                <span className="text-[11px] text-text-muted">Árbol multi-ramificado en 6 niveles con fórmulas y prescripciones.</span>
              </div>
            </div>

            <div className="p-2.5 bg-surface border border-border-default rounded-lg flex items-start gap-2">
              <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary block">Módulo 2: Recursos Docente</span>
                <span className="text-[11px] text-text-muted">Banco GIFT (60 preguntas), Examen, Solucionario y simulador HDI.</span>
              </div>
            </div>

            <div className="p-2.5 bg-surface border border-border-default rounded-lg flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-text-primary block">Módulo 3: Programación y Evaluación</span>
                <span className="text-[11px] text-text-muted">Vinculación curricular, matriz de alineación y rúbricas analíticas.</span>
              </div>
            </div>
          </div>

          {/* Checkbox of confirmation */}
          <label className="flex items-start gap-3 p-3 bg-alt/60 border border-border-default hover:border-amber-500/40 rounded-xl cursor-pointer transition-colors select-none">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border-default text-amber-500 focus:ring-amber-500/20 cursor-pointer"
            />
            <span className="text-xs text-text-primary font-medium">
              Confirmo que deseo regenerar y sobrescribir el contenido actual de la unidad <strong className="text-amber-400">{ud.id}</strong> con el nuevo pipeline de IA.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default bg-alt/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 bg-surface hover:bg-alt border border-border-default text-text-primary font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!understood || isGenerating}
            onClick={handleApprove}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Regenerando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Aprobar y Regenerar UD
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
