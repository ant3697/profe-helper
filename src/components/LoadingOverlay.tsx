import React from "react";
import { Loader2, X } from "lucide-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  onCancel: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  onCancel,
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#14151d] border border-amber-500/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center relative space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-amber-400 font-primary">
            Construyendo examen con IA...
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Analizando normativas, redactando opciones homogéneas y auditando sesgos (Test-Wiseness).
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-bold shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancelar Generación</span>
        </button>
      </div>
    </div>
  );
};

