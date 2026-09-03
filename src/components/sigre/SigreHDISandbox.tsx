import React, { useState } from "react";
import { Play, Code, FileText, Download, Sparkles, RefreshCw, Check, Maximize2, ExternalLink, Cpu } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SigreHDISandboxProps {
  hdiData?: {
    prdMarkdown: string;
    appHtmlCode: string;
    justificacionPedagogica: string;
    nombreApp: string;
  };
  udTitle: string;
  isGenerating?: boolean;
  onGenerateHDI: () => void;
}

export const SigreHDISandbox: React.FC<SigreHDISandboxProps> = ({
  hdiData,
  udTitle,
  isGenerating = false,
  onGenerateHDI,
}) => {
  const [activeTab, setActiveTab] = useState<"live_app" | "prd" | "code" | "justificacion">("live_app");
  const [copied, setCopied] = useState(false);

  const handleDownloadApp = () => {
    if (!hdiData?.appHtmlCode) return;
    const blob = new Blob([hdiData.appHtmlCode], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(hdiData.nombreApp || "Simulador_Didactico").replace(/[^a-z0-9]/gi, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    if (!hdiData?.appHtmlCode) return;
    navigator.clipboard.writeText(hdiData.appHtmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hdiData && !isGenerating) {
    return (
      <div className="bg-surface border border-border-default rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
          <Cpu className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-black text-text-primary">
            Módulo 2: El Arquitecto de Soluciones Digitales (HDI)
          </h3>
          <p className="text-xs text-text-muted">
            Transforma los conceptos teóricos y cálculos de la unidad en una micro-aplicación web interactiva (simulador/calculadora) lista para el aula o taller.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateHDI}
          disabled={isGenerating}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 mx-auto transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4" /> Construir Simulador Web HDI con IA
        </button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="bg-surface border border-border-default rounded-2xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto animate-pulse">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-black text-text-primary">
            Diseñando Arquitectura y Desarrollando Micro-App HDI...
          </h4>
          <p className="text-xs text-text-muted">
            Generando PRD, esquema de estado reactivo y código HTML5 autónomo sin dependencias externas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border border-border-default rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-text-primary">
              {hdiData?.nombreApp || "Herramienta Didáctica Interactiva (HDI)"}
            </h4>
            <p className="text-xs text-text-muted">
              Solución digital autónoma ejecutable sin servidor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadApp}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Descargar WebApp (.html)
          </button>
          <button
            type="button"
            onClick={onGenerateHDI}
            className="px-3 py-1.5 bg-surface border border-border-default hover:bg-alt text-text-muted hover:text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 dark:bg-slate-950/80 border border-slate-700/80 dark:border-slate-800 rounded-xl shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("live_app")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "live_app"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400 font-black scale-[1.02]"
              : "bg-slate-800/90 dark:bg-slate-800/90 border border-purple-500/30 text-slate-100 hover:text-white hover:border-purple-400 hover:bg-slate-700/90 shadow-xs"
          }`}
        >
          <Play className="w-3.5 h-3.5 text-purple-400" /> Simulador en Vivo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prd")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "prd"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400 font-black scale-[1.02]"
              : "bg-slate-800/90 dark:bg-slate-800/90 border border-purple-500/30 text-slate-100 hover:text-white hover:border-purple-400 hover:bg-slate-700/90 shadow-xs"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" /> PRD & Arquitectura
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "code"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400 font-black scale-[1.02]"
              : "bg-slate-800/90 dark:bg-slate-800/90 border border-purple-500/30 text-slate-100 hover:text-white hover:border-purple-400 hover:bg-slate-700/90 shadow-xs"
          }`}
        >
          <Code className="w-3.5 h-3.5 text-purple-400" /> Código Fuente (.html)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("justificacion")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "justificacion"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 ring-1 ring-purple-400 font-black scale-[1.02]"
              : "bg-slate-800/90 dark:bg-slate-800/90 border border-purple-500/30 text-slate-100 hover:text-white hover:border-purple-400 hover:bg-slate-700/90 shadow-xs"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Justificación Pedagógica
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-surface border border-border-default rounded-xl p-4 shadow-sm min-h-[480px]">
        {activeTab === "live_app" && (
          <div className="space-y-2">
            <div className="w-full bg-slate-950 rounded-xl border border-border-default overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400 font-mono">
                <span>⚡ Sandbox Interactivo / Simulador Web</span>
                <span className="text-emerald-400">● 100% Ejecutable Offline</span>
              </div>
              <iframe
                title="HDI Interactive Sandbox"
                srcDoc={hdiData?.appHtmlCode}
                className="w-full h-[540px] border-none bg-slate-950"
                sandbox="allow-scripts allow-forms allow-modals"
              />
            </div>
          </div>
        )}

        {activeTab === "prd" && (
          <div className="prose dark:prose-invert max-w-none text-sm p-4 bg-white dark:bg-slate-900 rounded-lg border border-border-default">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {hdiData?.prdMarkdown || "Sin PRD disponible"}
            </ReactMarkdown>
          </div>
        )}

        {activeTab === "code" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-purple-400">Código fuente completo (HTML5 + CSS + JS)</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface border border-border-default hover:bg-alt text-text-primary flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code className="w-3.5 h-3.5" />} Copiar Código
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-purple-300 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800 max-h-[500px]">
              {hdiData?.appHtmlCode}
            </pre>
          </div>
        )}

        {activeTab === "justificacion" && (
          <div className="prose dark:prose-invert max-w-none text-sm p-4 bg-white dark:bg-slate-900 rounded-lg border border-border-default">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {hdiData?.justificacionPedagogica || "Sin justificación disponible"}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
