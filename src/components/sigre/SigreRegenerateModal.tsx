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
  CheckSquare,
  Square,
  GraduationCap,
  HelpCircle,
  Workflow,
  FileCheck,
  Cpu,
} from "lucide-react";
import { SigreUDItem } from "../../types/sigre";

export type SigreUDSectionKey =
  | "ud_editorial"
  | "ud_curricular"
  | "cuestionario_autoeval"
  | "banco_gift_60"
  | "diagrama_opml"
  | "programacion_rubricas"
  | "simulador_hdi";

export interface UDSectionOption {
  id: SigreUDSectionKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const UD_SECTIONS_CATALOG: UDSectionOption[] = [
  {
    id: "ud_editorial",
    label: "1a. UD Editorial - Documento Oficial Completo",
    shortLabel: "1a. UD Editorial",
    description: "Tratado técnico oficial (1.1 a 1.11), epígrafes 5.1 a 5.x, glosario, normativa y síntesis.",
    icon: BookOpen,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "ud_curricular",
    label: "1b. UD Curricular (19 Puntos Oficiales DUA)",
    shortLabel: "1b. UD Curricular",
    description: "Matriz curricular completa: RAs, criterios, DUA, competencias, metodología activa y TIC.",
    icon: Layers,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
  },
  {
    id: "cuestionario_autoeval",
    label: "2. Cuestionario de Autoevaluación (20 Preguntas)",
    shortLabel: "2. Autoevaluación",
    description: "20 preguntas interactivas con justificación técnica y retroalimentación formativa.",
    icon: HelpCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  {
    id: "banco_gift_60",
    label: "3. Banco Moodle GIFT (60 Preguntas) & Tests",
    shortLabel: "3. Banco GIFT (60)",
    description: "60 preguntas GIFT estructuradas con retroalimentación, examen de 20 preguntas y solucionario.",
    icon: GraduationCap,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "diagrama_opml",
    label: "4. Diagrama Mermaid & Mapa Mental OPML",
    shortLabel: "4. Diagrama & OPML",
    description: "Diagrama de flujo de proceso y mapa mental OPML en 6 niveles jerárquicos (Tony Buzan).",
    icon: Workflow,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    id: "programacion_rubricas",
    label: "5. Programación Didáctica & Rúbricas XML",
    shortLabel: "5. Programación & XML",
    description: "Vinculación curricular, matriz de ponderaciones, tabla de actividades y rúbricas analíticas XML.",
    icon: FileCheck,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "simulador_hdi",
    label: "Módulo 2: Herramienta Didáctica Interactiva (Simulador HDI)",
    shortLabel: "Simulador HDI",
    description: "Aplicación interactiva HTML5/JS para taller y simulaciones técnicas sin dependencias.",
    icon: Cpu,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
];

interface SigreRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ud: SigreUDItem | null;
  onConfirm: (ud: SigreUDItem, selectedSections?: SigreUDSectionKey[]) => void;
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
  const [isModularMode, setIsModularMode] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<SigreUDSectionKey>>(
    new Set(UD_SECTIONS_CATALOG.map((s) => s.id))
  );

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setUnderstood(false);
      setIsModularMode(false);
      setSelectedSections(new Set(UD_SECTIONS_CATALOG.map((s) => s.id)));
    }
  }, [isOpen, ud?.id]);

  if (!isOpen || !ud) return null;

  const toggleSection = (id: SigreUDSectionKey) => {
    const updated = new Set(selectedSections);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedSections(updated);
  };

  const handleSelectAll = () => {
    setSelectedSections(new Set(UD_SECTIONS_CATALOG.map((s) => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedSections(new Set());
  };

  const handleApprove = () => {
    if (!understood && ud.status === "completed") return;
    if (isModularMode) {
      const chosen = Array.from(selectedSections);
      if (chosen.length === 0) return;
      onConfirm(ud, chosen);
    } else {
      onConfirm(ud);
    }
    onClose();
  };

  const isCompleted = ud.status === "completed";
  const canSubmit = !isCompleted || understood;
  const modularCount = selectedSections.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border-default rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-default flex items-center justify-between bg-alt/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <RefreshCw className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary flex items-center gap-2">
                Generar / Regenerar Unidad Didáctica
              </h2>
              <p className="text-xs text-text-muted">
                Selecciona si deseas regenerar la UD completa o módulos/apartados específicos
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Target UD Summary Card */}
          <div className="p-3.5 bg-background border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
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
                {ud.trimestre && (
                  <>
                    <span>&bull;</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                      {ud.trimestre}º Trimestre
                    </span>
                  </>
                )}
              </div>
            </div>
            <h3 className="text-sm font-bold text-text-primary">
              {ud.title}
            </h3>
          </div>

          {/* Mode Switch: Full vs Modular */}
          <div className="flex items-center p-1 bg-background border border-border-default rounded-xl">
            <button
              type="button"
              onClick={() => setIsModularMode(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                !isModularMode
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-text-muted hover:text-text-primary hover:bg-alt"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Unidad Completa (Todos los Módulos)
            </button>
            <button
              type="button"
              onClick={() => setIsModularMode(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isModularMode
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-text-muted hover:text-text-primary hover:bg-alt"
              }`}
            >
              <Layers className="w-4 h-4" /> Selección Modular por Apartados
            </button>
          </div>

          {/* Modular Selection View */}
          {isModularMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="font-bold text-text-primary">
                  Selecciona los apartados a generar ({modularCount} de {UD_SECTIONS_CATALOG.length}):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    Todos
                  </button>
                  <span className="text-text-muted">&bull;</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] font-bold text-text-muted hover:text-text-primary hover:underline cursor-pointer"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {UD_SECTIONS_CATALOG.map((sec) => {
                  const isChecked = selectedSections.has(sec.id);
                  const IconComp = sec.icon;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => toggleSection(sec.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked
                          ? `${sec.bgColor} ${sec.borderColor} shadow-xs`
                          : "bg-surface border-border-default opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className={`w-4 h-4 ${sec.color}`} />
                        ) : (
                          <Square className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <IconComp className={`w-3.5 h-3.5 ${sec.color}`} />
                          <span className="font-bold text-xs text-text-primary truncate">
                            {sec.shortLabel}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-tight line-clamp-2">
                          {sec.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {modularCount === 0 && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Debes seleccionar al menos un apartado para proceder con la generación.</span>
                </div>
              )}
            </div>
          ) : (
            /* Full UD Overview */
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">
                    Se generarán los 7 entregables completos de la Unidad Didáctica:
                  </p>
                  <p className="text-text-muted leading-relaxed">
                    Tema Editorial Oficial (8 secciones), Matriz Curricular DUA de 19 Puntos, Cuestionario de Autoevaluación, Banco Moodle GIFT de 60 preguntas, Diagrama de Flujo & Mapa Mental OPML, Programación Didáctica & Rúbricas XML, y Simulador Interactivo HDI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Checkbox of confirmation when overwriting existing UD */}
          {isCompleted && (
            <div
              onClick={() => setUnderstood(!understood)}
              className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 select-none ${
                understood
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-surface border-border-default text-text-muted hover:border-amber-500/40"
              }`}
            >
              <div className="mt-0.5">
                {understood ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded border border-border-default flex items-center justify-center" />
                )}
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-text-primary">
                  Confirmo la actualización de los contenidos generados
                </p>
                <p className="text-[11px] text-text-muted">
                  {isModularMode
                    ? `Se actualizarán únicamente los ${modularCount} apartados seleccionados, preservando intactos el resto de bloques.`
                    : "Se sustituirán los entregables previos por las nuevas respuestas de la IA."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-default flex items-center justify-between gap-3 bg-alt/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={!canSubmit || (isModularMode && modularCount === 0) || isGenerating}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isModularMode
              ? `Generar ${modularCount} ${modularCount === 1 ? "Apartado" : "Apartados"}`
              : "Generar Unidad Completa"}
          </button>
        </div>
      </div>
    </div>
  );
};
