import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Copy,
  Check,
  Eye,
  Code2,
  Download,
  Workflow,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Move,
} from "lucide-react";

interface SigreMermaidViewerProps {
  mermaidCode: string;
  title?: string;
}

export const SigreMermaidViewer: React.FC<SigreMermaidViewerProps> = ({
  mermaidCode,
  title = "5. Diagrama de Flujo (Mermaid)",
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"diagram" | "code">("diagram");
  
  // Interactive Pan & Zoom State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cleanMermaid = (mermaidCode || "")
    .replace(/^```mermaid/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  // Reset view to origin and 100%
  const handleResetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setScale((prevScale) => {
      const nextScale = Math.min(Math.max(prevScale * zoomFactor, 0.35), 3.5);
      return Number(nextScale.toFixed(3));
    });
  };

  // Mouse Down - start pan with left click
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag on left click (button 0)
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: pan.x, y: pan.y };
  };

  // Mouse Move - perform pan
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  // Mouse Up & Leave - stop pan
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for mobile / touch devices
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { x: pan.x, y: pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Render iframe content when code changes
  useEffect(() => {
    if (viewMode !== "diagram" || !iframeRef.current || !cleanMermaid) return;

    const iframeDoc =
      iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (!iframeDoc) return;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 30px;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 480px;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: visible;
      user-select: none;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    .mermaid svg {
      max-width: none !important;
      height: auto !important;
    }
    #error-box {
      color: #ef4444;
      background: #fef2f2;
      border: 1px solid #f87171;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      display: none;
    }
    .node rect, .node circle, .node polygon {
      stroke-width: 2px !important;
    }
  </style>
</head>
<body>
  <div id="error-box"></div>
  <pre class="mermaid">
${cleanMermaid}
  </pre>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis' }
    });
    window.onerror = function(msg) {
      var err = document.getElementById('error-box');
      if (err) {
        err.style.display = 'block';
        err.innerText = 'Error al renderizar Mermaid: ' + msg;
      }
    };
  </script>
</body>
</html>`;

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
  }, [cleanMermaid, viewMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanMermaid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMmd = () => {
    const blob = new Blob([cleanMermaid], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagrama_flujo_sigre.mmd";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm space-y-0">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-alt/40 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
              {title}
            </h4>
            <p className="text-[11px] text-text-muted">
              Representación algorítmica y mapa de procesos del tema en sintaxis Mermaid.js
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom and Pan Controls */}
          {viewMode === "diagram" && (
            <div className="flex items-center bg-surface border border-border-default rounded-lg p-0.5 text-xs text-text-muted shadow-sm">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.35, Number((s - 0.15).toFixed(2))))}
                className="p-1.5 hover:text-text-primary rounded hover:bg-alt transition-colors cursor-pointer"
                title="Reducir zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <button
                type="button"
                onClick={handleResetView}
                className="px-2 py-0.5 font-mono text-[11px] font-bold hover:text-cyan-400 hover:bg-alt rounded transition-colors cursor-pointer"
                title="Restablecer escala (100%) y centrar posición"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3.5, Number((s + 0.15).toFixed(2))))}
                className="p-1.5 hover:text-text-primary rounded hover:bg-alt transition-colors cursor-pointer"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-border-default mx-0.5" />

              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 hover:text-text-primary rounded hover:bg-alt transition-colors cursor-pointer"
                title="Centrar y reiniciar vista"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === "diagram" ? "code" : "diagram")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-default hover:bg-alt text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === "diagram" ? (
              <>
                <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Ver Código Fuente
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Ver Diagrama Interactivo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadMmd}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-default hover:bg-alt text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Descargar archivo .mmd"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" /> Descargar .mmd
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar Código
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="p-5 bg-background">
        {cleanMermaid ? (
          viewMode === "diagram" ? (
            <div className="relative">
              {/* Interactive Canvas Hint */}
              <div className="absolute top-3 left-3 z-10 bg-slate-900/85 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-md text-[10px] text-slate-300 font-medium flex items-center gap-1.5 shadow-md pointer-events-none">
                <Move className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Rueda: <strong>Zoom</strong> | Botón izquierdo: <strong>Mover lienzo</strong></span>
              </div>

              {/* Viewport with Wheel Zoom & Mouse Drag Pan */}
              <div
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-full bg-white rounded-xl border border-border-default p-4 overflow-hidden flex justify-center items-center shadow-inner min-h-[520px] select-none ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
                style={{ touchAction: "none" }}
              >
                <div
                  style={{
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 0.12s cubic-bezier(0.2, 0, 0, 1)",
                    width: "100%",
                    minHeight: "480px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    pointerEvents: isDragging ? "none" : "auto",
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Mermaid Diagram"
                    className="w-full min-h-[480px] border-none pointer-events-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono px-1">
                <span>// Sintaxis Mermaid (Flowchart)</span>
                <span>{cleanMermaid.split("\n").length} líneas</span>
              </div>
              <pre className="p-5 bg-slate-950 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {cleanMermaid}
              </pre>
            </div>
          )
        ) : (
          <div className="p-8 text-center text-text-muted text-xs">
            No se ha generado el diagrama Mermaid para esta Unidad Didáctica.
          </div>
        )}
      </div>
    </div>
  );
};
