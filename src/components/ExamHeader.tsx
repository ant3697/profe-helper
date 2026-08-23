import React from "react";
import {
  FileText,
  Shield,
  Bot,
  Zap,
  Maximize,
  Minimize,
  Copy,
  Printer,
  Code,
  FileDown,
  X,
} from "lucide-react";
import { GenerationTokenUsage } from "../types/exam";

interface ExamHeaderProps {
  fileName: string;
  modelName?: string;
  usage?: GenerationTokenUsage | null;
  hasCotAudit: boolean;
  isCotVisible: boolean;
  onToggleCot: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onCopyToWord: () => void;
  onPrintPDF: () => void;
  onExportHTML: () => void;
  onExportJSON: () => void;
  onCloseExam: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  fileName,
  modelName,
  usage,
  hasCotAudit,
  isCotVisible,
  onToggleCot,
  isFocusMode,
  onToggleFocusMode,
  onCopyToWord,
  onPrintPDF,
  onExportHTML,
  onExportJSON,
  onCloseExam,
}) => {
  return (
    <div className="border-b border-border-default bg-surface p-5 rounded-t-2xl space-y-4 no-print">
      {/* Top Meta info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl font-bold text-xs shadow-xs">
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate max-w-sm sm:max-w-md">{fileName || "Examen Técnico Activo"}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {modelName && (
            <span className="text-[11px] font-mono bg-alt border border-border-default text-text-primary px-2.5 py-1 rounded-lg">
              {modelName}
            </span>
          )}
          {usage && (
            <span className="text-[11px] font-mono bg-alt border border-border-default text-text-muted px-2.5 py-1 rounded-lg">
              Tokens: {usage.totalTokens}
            </span>
          )}
        </div>
      </div>

      {/* Feature Badges & Focus mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <Shield className="w-3 h-3" /> Test-Wiseness
          </span>
          <span className="font-mono bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <Zap className="w-3 h-3" /> CoT Anticolisión
          </span>
          <span className="font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
            <Bot className="w-3 h-3" /> Práctica Intercalada
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasCotAudit && (
            <button
              type="button"
              onClick={onToggleCot}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isCotVisible
                  ? "bg-purple-500 text-white border-purple-400 shadow-xs"
                  : "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Auditoría IA</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isFocusMode
                ? "bg-amber-500 text-black border-amber-400 shadow-xs"
                : "bg-surface border-border-strong text-text-secondary hover:border-amber-500 hover:text-amber-500"
            }`}
            title="Ocultar panel lateral para modo examen"
          >
            {isFocusMode ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>Modo Enfoque</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Toolbar & Close */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-default">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCopyToWord}
            className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Copiar texto con formato para Microsoft Word"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>.Word</span>
          </button>

          <button
            type="button"
            onClick={onPrintPDF}
            className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Imprimir o guardar en PDF limpio"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportHTML}
            className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Descargar archivo HTML autónomo e interactivo"
          >
            <Code className="w-3.5 h-3.5" />
            <span>.HTML</span>
          </button>

          <button
            type="button"
            onClick={onExportJSON}
            className="text-xs font-bold bg-alt border border-border-strong text-text-primary hover:bg-hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            title="Exportar archivo de datos JSON"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>.JSON</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onCloseExam}
          className="text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cerrar Vista</span>
        </button>
      </div>
    </div>
  );
};
