import React from "react";
import { Copy, Download, Check, Info } from "lucide-react";
import { copyTextToClipboard, downloadBlob } from "../utils/fileHelpers";

interface CodeViewPanelProps {
  title: string;
  description: string;
  content: string;
  downloadFilename: string;
  onShowToast: (msg: string) => void;
}

export const CodeViewPanel: React.FC<CodeViewPanelProps> = ({
  description,
  content,
  downloadFilename,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const success = await copyTextToClipboard(content);
    if (success) {
      setCopied(true);
      onShowToast("Contenido copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadBlob(downloadFilename, content);
    onShowToast(`Archivo descargado: ${downloadFilename}`);
  };

  return (
    <div className="space-y-4 w-full flex flex-col flex-1">
      {/* Top Description & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-alt/60 border border-border-default rounded-xl">
        <span className="text-xs text-text-muted font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          {description}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="bg-surface text-text-primary border border-border-strong px-3 py-1.5 rounded-lg hover:bg-hover transition-colors font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Copiado" : "Copiar"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="bg-amber-500 text-black px-3.5 py-1.5 rounded-lg hover:bg-amber-400 transition-colors font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Code Container */}
      <pre className="w-full bg-surface border border-border-default text-text-primary font-mono text-xs p-4 rounded-xl shadow-inner whitespace-pre-wrap break-words select-all max-h-[600px] overflow-y-auto leading-relaxed">
        {content}
      </pre>
    </div>
  );
};
