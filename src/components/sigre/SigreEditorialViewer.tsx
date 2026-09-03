import React, { useState } from "react";
import {
  BookOpen,
  Printer,
  Download,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Eye,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Target,
  FileText,
  HelpCircle,
  BookMarked,
  ShieldCheck,
  Sliders,
  Play,
  ArrowRight,
} from "lucide-react";
import {
  SigreUDItem,
  SigreCurricularConfig,
  SigreEpigrafeItem,
  SigreUDData,
} from "../../types/sigre";
import {
  renderSigreUDCompleteA4Html,
  cleanSigreLatexMath,
  formatSigreIndiceHtml,
  formatSigreDesarrolloHtml,
  extractOrInitEpigrafesFromUD,
  rebuildDesarrolloEpigrafesHtml,
} from "../../utils/sigrePromptGenerator";
import { exportHtmlToDocx } from "../../utils/docxExport";
import { preparePrintableHtmlDocument } from "../../utils/topicPromptGenerator";

interface SigreEditorialViewerProps {
  ud: SigreUDItem;
  config: SigreCurricularConfig;
  theme: "dark" | "light";
  isGenerating?: boolean;
  generatingSectionId?: string | null; // e.g. "index", "5.1", "closing", "all"
  progressPercent?: number;
  onGenerateIndex?: () => void;
  onGenerateEpigrafe?: (epigrafe: SigreEpigrafeItem) => void;
  onGenerateClosing?: () => void;
  onGenerateAllModular?: () => void;
  onUpdateModulo1Data?: (updatedModulo1: Partial<SigreUDData["modulo1"]>) => void;
}

export const SigreEditorialViewer: React.FC<SigreEditorialViewerProps> = ({
  ud,
  config,
  theme,
  isGenerating = false,
  generatingSectionId = null,
  progressPercent = 0,
  onGenerateIndex,
  onGenerateEpigrafe,
  onGenerateClosing,
  onGenerateAllModular,
  onUpdateModulo1Data,
}) => {
  const [activeTab, setActiveTab] = useState<"a4_doc" | "modular_blocks" | "structure_index">("a4_doc");
  const [docZoom, setDocZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedEpigrafeId, setSelectedEpigrafeId] = useState<string>("5.1");
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const m1 = ud.data?.modulo1;
  const epList = extractOrInitEpigrafesFromUD(ud);

  // Stats
  const completedCount = epList.filter((e) => e.contenidoHtml && e.contenidoHtml.trim().length > 50).length;
  const totalEpigrafes = epList.length;
  const hasIndex = !!(m1?.indiceDesarrollo && m1.indiceDesarrollo.trim().length > 20);
  const hasIntro = !!(m1?.introduccion && m1.introduccion.trim().length > 30);
  const hasClosing = !!(m1?.referenciasNormativasHtml || m1?.bibliografiaWebgrafiaHtml || m1?.conclusiones);

  // Copy Full HTML
  const handleCopyA4Html = () => {
    if (!ud.data) return;
    const html = renderSigreUDCompleteA4Html(ud, ud.data);
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export to Word (.docx)
  const handleExportDocx = async () => {
    if (!ud.data) return;
    const html = renderSigreUDCompleteA4Html(ud, ud.data);
    const fileName = `${ud.fullCode || ud.id}_Editorial_Completo.docx`;
    await exportHtmlToDocx(html, fileName);
  };

  // Print A4
  const handlePrint = () => {
    if (!ud.data) return;
    const html = renderSigreUDCompleteA4Html(ud, ud.data);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        preparePrintableHtmlDocument(html, `${ud.fullCode} - Tratado Editorial`)
      );
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 350);
    }
  };

  // Handle Editing an epigraph or block
  const handleStartEdit = (blockId: string, currentContent: string) => {
    setEditingBlock(blockId);
    setEditText(currentContent);
  };

  const handleSaveEdit = (blockId: string) => {
    if (!onUpdateModulo1Data || !m1) return;

    if (blockId === "introduccion") {
      onUpdateModulo1Data({ introduccion: editText });
    } else if (blockId === "indice") {
      onUpdateModulo1Data({ indiceDesarrollo: editText });
    } else if (blockId === "conclusiones") {
      onUpdateModulo1Data({ conclusiones: editText });
    } else if (blockId.startsWith("5.")) {
      const updatedEps = epList.map((ep) =>
        ep.id === blockId
          ? {
              ...ep,
              contenidoHtml: editText,
              status: editText.trim().length > 50 ? ("completed" as const) : ("pending" as const),
            }
          : ep
      );
      const combinedHtml = rebuildDesarrolloEpigrafesHtml(updatedEps);
      onUpdateModulo1Data({
        epigrafes: updatedEps,
        desarrolloEpigrafesHtml: combinedHtml,
      });
    }

    setEditingBlock(null);
  };

  // Add a new empty epigraph
  const handleAddEpigrafe = () => {
    if (!onUpdateModulo1Data) return;
    const nextNum = epList.length + 1;
    const newId = `5.${nextNum}`;
    const newEp: SigreEpigrafeItem = {
      id: newId,
      titulo: `${newId}. [Nuevo Epígrafe Técnico]`,
      subepigrafes: [],
      contenidoHtml: "",
      status: "pending",
    };
    const updatedEps = [...epList, newEp];
    onUpdateModulo1Data({
      epigrafes: updatedEps,
      indiceDesarrollo: `${m1?.indiceDesarrollo || ""}\n  ${newEp.titulo}`,
    });
    setSelectedEpigrafeId(newId);
  };

  // Delete an epigraph
  const handleDeleteEpigrafe = (id: string) => {
    if (!onUpdateModulo1Data) return;
    const updatedEps = epList.filter((e) => e.id !== id);
    const combinedHtml = rebuildDesarrolloEpigrafesHtml(updatedEps);
    onUpdateModulo1Data({
      epigrafes: updatedEps,
      desarrolloEpigrafesHtml: combinedHtml,
    });
    if (selectedEpigrafeId === id && updatedEps.length > 0) {
      setSelectedEpigrafeId(updatedEps[0].id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Modular Generation Controls & Progress */}
      <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                1a. UD Editorial Modular
              </span>
              <span className="text-xs text-slate-400">
                • {ud.fullCode || ud.title}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Desarrollo Modular por Apartados y Epígrafes
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Genera primero el <strong>Índice y Estructura Maestra</strong> con rigor pedagógico y, a continuación, desarrolla cada epígrafe de forma modular con <strong>máxima profundidad técnica (800-1500 palabras por epígrafe)</strong>, tablas operativas y fórmulas detalladas.
            </p>
          </div>

          {/* Action Buttons Hub */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Step 1: Generate Master Index */}
            <button
              type="button"
              onClick={onGenerateIndex}
              disabled={isGenerating}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                hasIndex
                  ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40"
                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 ring-2 ring-amber-400 animate-pulse font-black"
              }`}
              title="Genera o ajusta el Índice General, la Introducción, los Objetivos SMART y desglosa los sub-epígrafes 5.1 a 5.x"
            >
              <Sparkles className="w-4 h-4" />
              <span>{hasIndex ? "1. Regenerar Índice y Base" : "1. Generar Índice y Estructura"}</span>
            </button>

            {/* Step 2: Develop All Modular Epigraphs Sequentially */}
            <button
              type="button"
              onClick={onGenerateAllModular}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
              title="Ejecuta la generación secuencial profunda de todos los epígrafes del índice (uno por uno con máxima extensión)"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>2. Desarrollar Todos los Epígrafes</span>
            </button>
          </div>
        </div>

        {/* Status Indicators & Progress Bar */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasIndex ? "bg-emerald-400 shadow-xs shadow-emerald-400" : "bg-slate-500"}`} />
              Índice: <strong className={hasIndex ? "text-emerald-400" : "text-slate-400"}>{hasIndex ? "Listo" : "Pendiente"}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${completedCount === totalEpigrafes && totalEpigrafes > 0 ? "bg-emerald-400 shadow-xs shadow-emerald-400" : completedCount > 0 ? "bg-amber-400" : "bg-slate-500"}`} />
              Epígrafes Técnicos (5.x): <strong className="text-white">{completedCount}/{totalEpigrafes}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasClosing ? "bg-emerald-400 shadow-xs shadow-emerald-400" : "bg-slate-500"}`} />
              Normativa y Cierre: <strong className={hasClosing ? "text-emerald-400" : "text-slate-400"}>{hasClosing ? "Listo" : "Pendiente"}</strong>
            </span>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 text-amber-400 font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>
                {generatingSectionId === "index"
                  ? "Diseñando Índice y Estructura Maestra..."
                  : generatingSectionId === "closing"
                  ? "Generando Normativas y Glosario..."
                  : generatingSectionId
                  ? `Desarrollando Epígrafe ${generatingSectionId} en profundidad...`
                  : "Generando contenido modular..."}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar when running */}
        {isGenerating && (
          <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${Math.max(5, progressPercent || 15)}%` }}
            />
          </div>
        )}
      </div>

      {/* Mode View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/80 rounded-xl shadow-inner">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("a4_doc")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "a4_doc"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-300 font-black scale-[1.02]"
                : "bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700/90"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📄 Vista Documento Oficial A4 (Completo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("modular_blocks")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "modular_blocks"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-300 font-black scale-[1.02]"
                : "bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700/90"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📑 Desarrollo Modular por Epígrafes ({completedCount}/{totalEpigrafes})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("structure_index")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "structure_index"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-300 font-black scale-[1.02]"
                : "bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700/90"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>🗂️ Estructura & Índice Editorial</span>
          </button>
        </div>

        {/* Global A4 Utilities: Zoom, Docx, Print, Copy */}
        <div className="flex items-center gap-1.5 text-xs">
          {activeTab === "a4_doc" && (
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-slate-300 mr-1">
              <button
                type="button"
                onClick={() => setDocZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                className="px-2 py-0.5 hover:text-white rounded hover:bg-slate-700 transition-colors font-bold cursor-pointer"
                title="Reducir tamaño del documento"
              >
                -
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold text-white">
                {Math.round(docZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setDocZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
                className="px-2 py-0.5 hover:text-white rounded hover:bg-slate-700 transition-colors font-bold cursor-pointer"
                title="Aumentar tamaño del documento"
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportDocx}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            title="Exportar documento completo a Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Word</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            title="Imprimir o guardar en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyA4Html}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            title="Copiar código HTML maquetado completo"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Copiar"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: UNIFIED A4 DOCUMENT VIEW
         ======================================================== */}
      {activeTab === "a4_doc" && (
        <div className="overflow-x-auto py-2">
          {ud.data ? (
            <div
              style={{
                transform: `scale(${docZoom})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="bg-white text-slate-900 p-6 sm:p-10 rounded-xl border border-border-default shadow-lg max-w-4xl mx-auto"
              dangerouslySetInnerHTML={{
                __html: renderSigreUDCompleteA4Html(ud, ud.data),
              }}
            />
          ) : (
            <div className="text-center py-12 text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
              <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold">No hay contenido editorial generado aún para esta unidad.</p>
              <button
                type="button"
                onClick={onGenerateIndex}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Comenzar generando el Índice y Estructura
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: MODULAR DEVELOPMENT BY EPIGRAPHS & BLOCKS
         ======================================================== */}
      {activeTab === "modular_blocks" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Epigraphs Navigator */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-amber-400" />
                  Apartados del Tema
                </span>
                <button
                  type="button"
                  onClick={handleAddEpigrafe}
                  className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Añadir nuevo sub-epígrafe al tema"
                >
                  <Plus className="w-3 h-3" /> Añadir 5.x
                </button>
              </div>

              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {/* Block 1: Introducción, Objetivos y Contenidos */}
                <button
                  type="button"
                  onClick={() => setSelectedEpigrafeId("bloque_intro")}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    selectedEpigrafeId === "bloque_intro"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20 font-bold ring-1 ring-amber-300"
                      : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 border border-slate-700/60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">1-4. Introducción y Objetivos</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {hasIntro ? "Introducción, Contenidos y SMART" : "Pendiente de definir"}
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      hasIntro ? "bg-emerald-400 shadow-xs" : "bg-slate-500"
                    }`}
                  />
                </button>

                {/* Sub-epigraphs 5.1 to 5.x */}
                <div className="pt-2 pb-1 px-1 text-[11px] font-black uppercase text-amber-400/90 tracking-wide flex items-center justify-between">
                  <span>5. Desarrollo Técnico</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {completedCount}/{totalEpigrafes} listos
                  </span>
                </div>

                {epList.map((ep) => {
                  const isCompleted = !!(ep.contenidoHtml && ep.contenidoHtml.trim().length > 50);
                  const isCurrent = selectedEpigrafeId === ep.id;
                  const isThisGenerating = generatingSectionId === ep.id;

                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setSelectedEpigrafeId(ep.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? "bg-amber-600 text-white shadow-md shadow-amber-500/20 font-bold ring-1 ring-amber-300"
                          : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 border border-slate-700/60"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="font-mono text-amber-300 font-black">{ep.id}</span>
                          <span className="truncate">{ep.titulo.replace(/^5\.\d+\.?\s*/, "")}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {isCompleted
                            ? `✓ Desarrollado (~${Math.round((ep.contenidoHtml?.length || 0) / 6)} palabras)`
                            : "Pendiente de generar"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        {isThisGenerating ? (
                          <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Block 6-8: Normativas, Bibliografía y Cierre */}
                <div className="pt-2 pb-1 px-1 text-[11px] font-black uppercase text-amber-400/90 tracking-wide">
                  <span>6-8. Normativa y Cierre</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEpigrafeId("bloque_cierre")}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                    selectedEpigrafeId === "bloque_cierre"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-500/20 font-bold ring-1 ring-amber-300"
                      : "bg-slate-800/80 text-slate-200 hover:bg-slate-800 border border-slate-700/60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">6-8. Normativa, Síntesis y Glosario</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {hasClosing ? "Normativas, Bibliografía y Glosario" : "Pendiente de generar"}
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      hasClosing ? "bg-emerald-400 shadow-xs" : "bg-slate-500"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Active Epigraph / Block Content & Editor */}
          <div className="lg:col-span-8 space-y-4">
            {/* ---------------- Case 1: Bloque 1-4 (Introducción y Objetivos) ---------------- */}
            {selectedEpigrafeId === "bloque_intro" && (
              <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black tracking-wide uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                      Apartados 1 a 4
                    </span>
                    <h3 className="text-base font-black text-white mt-1">
                      Introducción, Contexto, Contenidos y Objetivos SMART
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onGenerateIndex}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Regenerar Bloque 1-4
                    </button>
                  </div>
                </div>

                {/* 2. Introducción */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <BookMarked className="w-3.5 h-3.5" /> 2. Introducción y Contextualización
                    </h4>
                    {editingBlock !== "introduccion" ? (
                      <button
                        type="button"
                        onClick={() => handleStartEdit("introduccion", m1?.introduccion || "")}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Editar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveEdit("introduccion")}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold"
                      >
                        <Save className="w-3 h-3" /> Guardar
                      </button>
                    )}
                  </div>

                  {editingBlock === "introduccion" ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-900 text-slate-100 text-xs p-3 rounded-lg border border-amber-500/50 font-sans focus:outline-hidden"
                    />
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed text-justify">
                      {m1?.introduccion || "Pendiente de generación. Pulsa en 'Regenerar Bloque 1-4'."}
                    </p>
                  )}
                </div>

                {/* 3. Contenidos Específicos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 rounded-xl p-3.5 border border-sky-500/30">
                    <h5 className="text-xs font-black text-sky-400 uppercase mb-2">📘 Conceptuales (Saber)</h5>
                    <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                      {(m1?.contenidos?.conceptuales || []).map((c, i) => (
                        <li key={i}>{cleanSigreLatexMath(c)}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-800/60 rounded-xl p-3.5 border border-emerald-500/30">
                    <h5 className="text-xs font-black text-emerald-400 uppercase mb-2">🛠️ Procedimentales (Saber Hacer)</h5>
                    <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                      {(m1?.contenidos?.procedimentales || []).map((c, i) => (
                        <li key={i}>{cleanSigreLatexMath(c)}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-800/60 rounded-xl p-3.5 border border-purple-500/30">
                    <h5 className="text-xs font-black text-purple-400 uppercase mb-2">🤝 Actitudinales (Saber Ser)</h5>
                    <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                      {(m1?.contenidos?.actitudinales || []).map((c, i) => (
                        <li key={i}>{cleanSigreLatexMath(c)}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Objetivos SMART */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> 4. Objetivos Específicos de Aprendizaje (SMART)
                  </h4>
                  <ul className="text-xs text-slate-200 space-y-2 pl-4 list-disc">
                    {(m1?.objetivosSmart || []).map((obj, i) => (
                      <li key={i} className="leading-relaxed">
                        {cleanSigreLatexMath(obj)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ---------------- Case 2: Individual Epigraph 5.x ---------------- */}
            {selectedEpigrafeId.startsWith("5.") && (() => {
              const currentEp = epList.find((e) => e.id === selectedEpigrafeId);
              if (!currentEp) return null;

              const hasContent = !!(currentEp.contenidoHtml && currentEp.contenidoHtml.trim().length > 50);
              const isThisGenerating = generatingSectionId === currentEp.id;

              return (
                <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black tracking-wide uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          Epígrafe {currentEp.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasContent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                          {hasContent ? "✓ Desarrollado en profundidad" : "Pendiente de desarrollar"}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white">
                        {currentEp.titulo}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onGenerateEpigrafe?.(currentEp)}
                        disabled={isGenerating}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                        title="Genera este epígrafe de forma dedicada con 800-1500 palabras, tablas de parámetros y cajas de taller"
                      >
                        {isThisGenerating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{hasContent ? `Regenerar Epígrafe ${currentEp.id}` : `Desarrollar Epígrafe ${currentEp.id}`}</span>
                      </button>

                      {editingBlock !== currentEp.id ? (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(currentEp.id, currentEp.contenidoHtml || "")}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-xl border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(currentEp.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Guardar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteEpigrafe(currentEp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Eliminar este epígrafe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtopics bullet checklist */}
                  {currentEp.subepigrafes && currentEp.subepigrafes.length > 0 && (
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
                      <span className="font-bold text-amber-400 text-[11px] uppercase block mb-1">
                        Subtemas y Aspectos Técnicos a cubrir:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {currentEp.subepigrafes.map((st, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-[11px]">
                            • {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editor or Content Display */}
                  {editingBlock === currentEp.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={16}
                        className="w-full bg-slate-900 text-slate-100 text-xs p-3.5 rounded-xl border border-amber-500/50 font-mono focus:outline-hidden leading-relaxed"
                        placeholder="Escribe o pega el contenido HTML/texto del epígrafe..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBlock(null)}
                          className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(currentEp.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </div>
                  ) : hasContent ? (
                    <div
                      className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-inner overflow-x-auto sigre-ud-page"
                      dangerouslySetInnerHTML={{ __html: formatSigreDesarrolloHtml(currentEp.contenidoHtml || "") }}
                    />
                  ) : (
                    <div className="text-center py-10 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-slate-400 space-y-3">
                      <FileText className="w-10 h-10 mx-auto text-slate-600" />
                      <p className="text-xs max-w-md mx-auto">
                        Este epígrafe aún no tiene desarrollo técnico generado. Haz clic en el botón superior para generarlo con IA de forma exhaustiva (800-1500 palabras, tablas técnicas y cajas de taller).
                      </p>
                      <button
                        type="button"
                        onClick={() => onGenerateEpigrafe?.(currentEp)}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                        Desarrollar Epígrafe {currentEp.id} ahora
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ---------------- Case 3: Bloque 6-8 (Normativa, Síntesis y Glosario) ---------------- */}
            {selectedEpigrafeId === "bloque_cierre" && (
              <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black tracking-wide uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                      Apartados 6 al 9
                    </span>
                    <h3 className="text-base font-black text-white mt-1">
                      Marco Normativo, Bibliografía, Síntesis y Glosario
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onGenerateClosing}
                      disabled={isGenerating}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {hasClosing ? "Regenerar Cierre y Normativas" : "Generar Cierre y Normativas"}
                    </button>
                  </div>
                </div>

                {/* 6. Normativas */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    6. Referencias Normativas Aplicables
                  </h4>
                  {m1?.referenciasNormativasHtml ? (
                    <div
                      className="bg-white text-slate-900 p-4 rounded-lg overflow-x-auto sigre-ud-page"
                      dangerouslySetInnerHTML={{ __html: formatSigreDesarrolloHtml(m1.referenciasNormativasHtml) }}
                    />
                  ) : (
                    <p className="text-xs text-slate-400">Pendiente de generación.</p>
                  )}
                </div>

                {/* 7. Bibliografía */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    7. Bibliografía y Webgrafía Oficial
                  </h4>
                  {m1?.bibliografiaWebgrafiaHtml ? (
                    <div
                      className="bg-white text-slate-900 p-4 rounded-lg overflow-x-auto sigre-ud-page"
                      dangerouslySetInnerHTML={{ __html: formatSigreDesarrolloHtml(m1.bibliografiaWebgrafiaHtml) }}
                    />
                  ) : (
                    <p className="text-xs text-slate-400">Pendiente de generación.</p>
                  )}
                </div>

                {/* 8. Conclusiones */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    8. Conclusiones y Síntesis del Tema
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed text-justify">
                    {m1?.conclusiones || "Pendiente de generación."}
                  </p>
                </div>

                {/* 9. Glosario */}
                {m1?.glosarioHtml && (
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                      9. Glosario y Fórmulas
                    </h4>
                    <div
                      className="bg-white text-slate-900 p-4 rounded-lg overflow-x-auto sigre-ud-page"
                      dangerouslySetInnerHTML={{ __html: formatSigreDesarrolloHtml(m1.glosarioHtml) }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: STRUCTURE & MASTER INDEX CONFIG
         ======================================================== */}
      {activeTab === "structure_index" && (
        <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-amber-400" />
                Estructura del Índice General y Desglose de Epígrafes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personaliza la lista de epígrafes técnicos 5.1 a 5.x antes o después de desarrollarlos con IA.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddEpigrafe}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Epígrafe 5.x
            </button>
          </div>

          {/* Epigraphs Table Editor */}
          <div className="space-y-3">
            {epList.map((ep, idx) => (
              <div
                key={ep.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono font-black text-xs rounded-lg border border-amber-500/30">
                    {ep.id}
                  </span>
                  <input
                    type="text"
                    value={ep.titulo}
                    onChange={(e) => {
                      if (!onUpdateModulo1Data) return;
                      const newTitle = e.target.value;
                      const updatedEps = epList.map((item) =>
                        item.id === ep.id ? { ...item, titulo: newTitle } : item
                      );
                      onUpdateModulo1Data({ epigrafes: updatedEps });
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs rounded-lg px-3 py-1.5 font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      ep.contenidoHtml && ep.contenidoHtml.trim().length > 50
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {ep.contenidoHtml && ep.contenidoHtml.trim().length > 50 ? "✓ Listo" : "Pendiente"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEpigrafeId(ep.id);
                      setActiveTab("modular_blocks");
                    }}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteEpigrafe(ep.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                    title="Eliminar este epígrafe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Raw Index Text Block */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wide">
              Texto del Índice Completo del Tema (1 al 8)
            </h4>
            <div
              className="bg-white text-slate-900 p-4 rounded-xl text-xs overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: formatSigreIndiceHtml(m1?.indiceDesarrollo || ""),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
