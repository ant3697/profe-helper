import React from "react";
import { Sparkles, HelpCircle, X } from "lucide-react";
import { DifficultyLevel } from "../types/exam";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  numQuestions: number;
  batchCount?: number;
  difficulty: DifficultyLevel;
  hasBaseDocs: boolean;
  baseDocsCount: number;
  antiCollisionCount?: number;
  hasCustomPrompt: boolean;
  activeProviderName?: string;
  activeModelName?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  numQuestions,
  batchCount = 1,
  difficulty,
  hasBaseDocs,
  baseDocsCount,
  antiCollisionCount = 0,
  hasCustomPrompt,
  activeProviderName = "Google Gemini",
  activeModelName = "Gemini 3.7 Flash",
}) => {
  if (!isOpen) return null;

  const diffMap = {
    easy: "🟢 Básico (Teórico)",
    standard: "🟡 Oficial (Práctico)",
    killer: "🔴 Killer (Tribunal)",
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border-default shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border-default pb-3">
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            Confirmar Generación con IA
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-text-secondary">
          <div className="flex justify-between bg-alt/60 p-2.5 rounded-lg border border-border-subtle items-center">
            <span className="font-semibold">Documentos de Temario:</span>
            <span className="text-text-primary font-bold">
              {hasBaseDocs ? `${baseDocsCount} cargado(s)` : "Generación autónoma"}
            </span>
          </div>

          {antiCollisionCount > 0 && (
            <div className="flex justify-between bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/30 items-center">
              <span className="font-semibold text-amber-300">Exámenes Anticolisión:</span>
              <span className="text-amber-400 font-bold font-mono">
                {antiCollisionCount} activo(s) (prohibido repetir)
              </span>
            </div>
          )}

          <div className="flex justify-between bg-alt/60 p-2.5 rounded-lg border border-border-subtle items-center">
            <span className="font-semibold">Modo Dificultad:</span>
            <span className="text-text-primary font-bold">{diffMap[difficulty]}</span>
          </div>

          <div className="flex justify-between bg-alt/60 p-2.5 rounded-lg border border-border-subtle items-center">
            <span className="font-semibold">Generación en Lote:</span>
            <span className="text-amber-400 font-bold font-mono">
              {batchCount} {batchCount === 1 ? "Batería" : "Baterías"} ({batchCount * numQuestions} preguntas en total)
            </span>
          </div>

          <div className="flex justify-between bg-alt/60 p-2.5 rounded-lg border border-border-subtle items-center">
            <span className="font-semibold">Preguntas por Batería:</span>
            <span className="text-text-primary font-bold">{numQuestions}</span>
          </div>

          <div className="flex justify-between bg-alt/60 p-2.5 rounded-lg border border-border-subtle items-center">
            <span className="font-semibold">Instrucciones Extra:</span>
            <span className="text-text-primary font-bold">
              {hasCustomPrompt ? "Sí (Personalizadas)" : "Ninguna"}
            </span>
          </div>

          <div className="flex justify-between bg-alt/60 p-2.5 rounded-lg border border-border-subtle items-center">
            <span className="font-semibold">Motor IA:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold text-[11px]">{activeProviderName}</span>
              <span className="text-text-primary font-mono text-[11px] bg-surface px-2 py-0.5 rounded border border-border-default font-bold">
                {activeModelName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary bg-surface border border-border-default hover:bg-hover transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirmar y Generar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
