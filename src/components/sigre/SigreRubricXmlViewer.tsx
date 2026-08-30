import React, { useState } from "react";
import { Download, Copy, Check, Table, FileCode2, BookCheck } from "lucide-react";

interface SigreRubricXmlViewerProps {
  vinculacionCurricularHtml: string;
  matrizAlineacionHtml: string;
  tablaActividadesHtml: string;
  rubricasXml: string;
  udTitle: string;
}

export const SigreRubricXmlViewer: React.FC<SigreRubricXmlViewerProps> = ({
  vinculacionCurricularHtml,
  matrizAlineacionHtml,
  tablaActividadesHtml,
  rubricasXml,
  udTitle,
}) => {
  const [activeTab, setActiveTab] = useState<"vinculacion" | "matriz" | "actividades" | "rubricas_xml">("matriz");
  const [copied, setCopied] = useState(false);

  const cleanXml = (rubricasXml || "").trim();

  const handleDownloadXml = () => {
    const blob = new Blob([cleanXml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rubricas_Evaluacion_${udTitle.replace(/[^a-z0-9]/gi, "_")}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface border border-border-default rounded-xl shadow-sm">
        <div>
          <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
            <BookCheck className="w-4 h-4 text-blue-500" />
            5. Programación, Alineación Curricular y Rúbricas XML
          </h4>
          <p className="text-xs text-text-muted mt-0.5">
            Matrices formales de ponderación y rúbricas XML estandarizadas para evaluación competencial.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadXml}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 shrink-0 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Descargar Rúbricas XML (.xml)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-default pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("matriz")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "matriz"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
          }`}
        >
          📊 3.2.1. Matriz de Alineación y Pesos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("actividades")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "actividades"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
          }`}
        >
          📋 3.2.2. Tabla de Actividades
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vinculacion")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "vinculacion"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
          }`}
        >
          🎯 3.1. Vinculación Curricular (RA / CrEv)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rubricas_xml")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "rubricas_xml"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 inline mr-1" /> 3.2.3. Rúbricas (XML)
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-surface border border-border-default rounded-xl p-4 shadow-sm">
        {activeTab === "matriz" && (
          <div className="overflow-x-auto">
            <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: matrizAlineacionHtml }} />
          </div>
        )}

        {activeTab === "actividades" && (
          <div className="overflow-x-auto">
            <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: tablaActividadesHtml }} />
          </div>
        )}

        {activeTab === "vinculacion" && (
          <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: vinculacionCurricularHtml }} />
        )}

        {activeTab === "rubricas_xml" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-purple-400">Rúbricas XML (Formato Moodle / iDoceo / Additio)</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface border border-border-default hover:bg-alt text-text-primary flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} Copiar XML
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-cyan-300 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800 max-h-[420px]">
              {cleanXml}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
