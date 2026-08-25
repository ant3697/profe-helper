import React, { useState } from "react";
import { X, Search, Copy, Check, FileText, Download } from "lucide-react";
import { SigreRagDocument } from "../../types/sigre";

interface SigreDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: SigreRagDocument | null;
}

export const SigreDocumentViewerModal: React.FC<SigreDocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(document.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([document.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.name.replace(/\.[^/.]+$/, "")}_extraido.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter or highlight matches
  const matchCount = searchTerm
    ? (document.text.toLowerCase().match(new RegExp(searchTerm.toLowerCase(), "g")) || []).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">
                {document.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>{(document.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>{document.wordCount.toLocaleString()} palabras</span>
                <span>•</span>
                <span>Subido: {document.uploadedAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Texto
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Descargar texto plano"
            >
              <Download className="w-3.5 h-3.5" /> .TXT
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el documento (ej. RA1, Bloque, Criterio, Riesgos...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          {searchTerm && (
            <span className="text-amber-400 font-mono text-[11px] shrink-0 font-bold">
              {matchCount} {matchCount === 1 ? "coincidencia" : "coincidencias"}
            </span>
          )}
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950/80 whitespace-pre-wrap selection:bg-amber-500 selection:text-black">
          {document.text ? (
            document.text
          ) : (
            <span className="text-slate-500 italic">El documento no contiene texto legible extraído.</span>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Documento disponible para consulta RAG durante la generación de UDs.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
