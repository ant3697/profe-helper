import React, { useState, useMemo, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  Download,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Search,
  BookOpen,
  Target,
  Layers,
  FileCode,
  Compass,
  Sliders,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Workflow,
  Sparkles,
  ShieldCheck,
  Award,
  ListTree,
} from "lucide-react";

interface SigreOpmlViewerProps {
  opmlCode: string;
  title?: string;
  onDownload?: () => void;
}

interface OpmlNode {
  id: string;
  text: string;
  level: number;
  children: OpmlNode[];
}

const LEVEL_DESCRIPTIONS: Record<number, { title: string; subtitle: string; color: string; badgeBg: string }> = {
  1: {
    title: "Nivel 1: Unidad Didáctica Raíz",
    subtitle: "Título oficial, código del módulo formativo y perfil profesional",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  },
  2: {
    title: "Nivel 2: Ejes y Bloques Curriculares",
    subtitle: "Marco Formativo, Mapa de Saberes, Epígrafes, Vinculación Curricular, Actividades, Evaluación",
    color: "text-blue-400",
    badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  },
  3: {
    title: "Nivel 3: Epígrafes / RAs / Saberes Específicos",
    subtitle: "Epígrafes temáticos (5.1, 5.2...), Resultados de Aprendizaje (RA) y Saberes (Conceptuales, Procedimentales, Actitudinales)",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  },
  4: {
    title: "Nivel 4: Subepígrafes / Criterios de Evaluación (CE) / Fases",
    subtitle: "Subepígrafes técnicos (5.1.1...), Criterios de Evaluación (CE), Objetivos SMART y Fases de Taller",
    color: "text-purple-400",
    badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  },
  5: {
    title: "Nivel 5: Rúbricas / Indicadores / Parámetros Operativos",
    subtitle: "Rúbricas analíticas por nivel de desempeño (Excelente a Insuficiente), evidencias, instrumental y fórmulas",
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
  },
  6: {
    title: "Nivel 6: Descriptores DUA / EPIs / Normativa Detallada",
    subtitle: "Pautas de Accesibilidad DUA, Tolerancias milimétricas, EPIs obligatorios (Normas EN) y Reglamentación (RITE/REBT)",
    color: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
  },
};

function countNodesAndDepth(node: OpmlNode): { maxDepth: number; totalNodes: number } {
  let max = node.level;
  let count = 1;
  for (const ch of node.children) {
    const res = countNodesAndDepth(ch);
    count += res.totalNodes;
    if (res.maxDepth > max) max = res.maxDepth;
  }
  return { maxDepth: max, totalNodes: count };
}

function parseOpmlToTree(opmlXml: string): { root: OpmlNode | null; maxDepth: number; totalNodes: number } {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opmlXml, "text/xml");
    const body = xmlDoc.querySelector("body");
    if (!body) return { root: null, maxDepth: 0, totalNodes: 0 };

    let counter = 0;
    let maxDepthFound = 1;

    const processNode = (element: Element, currentLevel: number): OpmlNode => {
      counter++;
      if (currentLevel > maxDepthFound) maxDepthFound = currentLevel;
      const text = element.getAttribute("text") || element.getAttribute("title") || "Nodo";
      const childrenEls = Array.from(element.children).filter(
        (c) => c.tagName.toLowerCase() === "outline"
      );
      return {
        id: `node-${counter}-${text.substring(0, 15).replace(/\s+/g, "_")}`,
        text,
        level: currentLevel,
        children: childrenEls.map((child) => processNode(child, currentLevel + 1)),
      };
    };

    const rootOutlines = Array.from(body.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );
    if (rootOutlines.length === 0) return { root: null, maxDepth: 0, totalNodes: 0 };

    let rawRootNode: OpmlNode;
    if (rootOutlines.length === 1) {
      rawRootNode = processNode(rootOutlines[0], 1);
    } else {
      rawRootNode = {
        id: "root-tree",
        text: xmlDoc.querySelector("head > title")?.textContent || "Mapa Mental Curricular",
        level: 1,
        children: rootOutlines.map((el) => processNode(el, 2)),
      };
    }

    const { maxDepth: finalDepth, totalNodes: finalTotal } = countNodesAndDepth(rawRootNode);

    return { root: rawRootNode, maxDepth: finalDepth, totalNodes: finalTotal };
  } catch (err) {
    console.error("Error parsing OPML:", err);
    return { root: null, maxDepth: 0, totalNodes: 0 };
  }
}

/**
 * Prunes an OPML tree to a maximum depth level and serializes it as XML
 */
function pruneOpmlToDepthXml(node: OpmlNode, maxAllowedLevel: number, titleText: string): string {
  const escapeXml = (str: string) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const serializeNode = (n: OpmlNode, indent: number): string => {
    const spaces = "  ".repeat(indent);
    const safeText = escapeXml(n.text);
    if (n.level >= maxAllowedLevel || n.children.length === 0) {
      return `${spaces}<outline text="${safeText}"/>`;
    }
    const childrenXml = n.children
      .map((child) => serializeNode(child, indent + 1))
      .join("\n");
    return `${spaces}<outline text="${safeText}">\n${childrenXml}\n${spaces}</outline>`;
  };

  const bodyContent = serializeNode(node, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(titleText)} (Filtrado a Nivel ${maxAllowedLevel})</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>Sistema SIGRE v6.0</ownerName>
  </head>
  <body>
${bodyContent}
  </body>
</opml>`.trim();
}

interface TreeNodeProps {
  node: OpmlNode;
  sliderDepth: number;
  searchFilter: string;
  manuallyToggled: Record<string, boolean>;
  onToggleNode: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  sliderDepth,
  searchFilter,
  manuallyToggled,
  onToggleNode,
}) => {
  const hasChildren = node.children.length > 0;
  const isManuallyToggled = node.id in manuallyToggled;
  // By default, if the node's level is less than the slider depth, it is expanded
  const isExpanded = isManuallyToggled ? manuallyToggled[node.id] : node.level < sliderDepth;

  const matchesFilter =
    !searchFilter ||
    node.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
    node.children.some((c) =>
      c.text.toLowerCase().includes(searchFilter.toLowerCase())
    );

  if (!matchesFilter && searchFilter) return null;

  const getNodeIcon = (lvl: number, txt: string) => {
    if (lvl === 1) return <Compass className="w-4 h-4 text-amber-400" />;
    if (lvl === 2) {
      if (txt.includes("1.") || txt.includes("MARCO") || txt.includes("INTRODUCCIÓN"))
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
      if (txt.includes("2.") || txt.includes("SABERES") || txt.includes("CONTENIDOS"))
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      if (txt.includes("3.") || txt.includes("EPÍGRAFES") || txt.includes("DESARROLLO"))
        return <Workflow className="w-3.5 h-3.5 text-amber-400" />;
      if (txt.includes("4.") || txt.includes("VINCULACIÓN") || txt.includes("RA"))
        return <Target className="w-3.5 h-3.5 text-purple-400" />;
      if (txt.includes("5.") || txt.includes("ACTIVIDADES") || txt.includes("TALLER"))
        return <Award className="w-3.5 h-3.5 text-rose-400" />;
      if (txt.includes("6.") || txt.includes("EVALUACIÓN") || txt.includes("RÚBRICA") || txt.includes("HDI"))
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      return <FolderTree className="w-3.5 h-3.5 text-slate-400" />;
    }
    if (lvl === 3) return <ListTree className="w-3 h-3 text-emerald-400" />;
    if (lvl === 4) return <CheckCircle2 className="w-3 h-3 text-purple-400" />;
    if (lvl === 5) return <ShieldCheck className="w-3 h-3 text-rose-400" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />;
  };

  const getLevelBadge = (lvl: number) => {
    switch (lvl) {
      case 1:
        return <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">N1 • UD</span>;
      case 2:
        return <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">N2 • Eje</span>;
      case 3:
        return <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">N3 • Epígrafe/RA</span>;
      case 4:
        return <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">N4 • Subepígrafe/CE</span>;
      case 5:
        return <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">N5 • Rúbrica/Paso</span>;
      default:
        return <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">N{lvl} • DUA/EPI</span>;
    }
  };

  return (
    <div className="select-none font-sans text-xs">
      <div
        onClick={() => hasChildren && onToggleNode(node.id)}
        className={`flex items-start gap-2 py-1.5 px-2.5 rounded-xl transition-all group cursor-pointer ${
          node.level === 1
            ? "bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold mb-2 shadow-sm"
            : node.level === 2
            ? "bg-slate-800/80 border border-slate-700/80 font-bold text-text-primary mb-1.5 shadow-sm hover:border-slate-600"
            : node.level === 3
            ? "bg-slate-900/60 border border-slate-800/80 font-semibold text-slate-200 hover:bg-slate-800/60 mb-1"
            : "hover:bg-slate-800/40 text-text-secondary"
        }`}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 text-text-muted">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
            )
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          )}
        </span>

        <span className="shrink-0 mt-0.5">{getNodeIcon(node.level, node.text)}</span>

        <span className="flex-1 leading-snug break-words">
          {node.text}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {getLevelBadge(node.level)}
          {hasChildren && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface border border-border-subtle text-text-muted font-mono" title={`${node.children.length} subnodos`}>
              {node.children.length}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l-2 border-slate-700/60 ml-4 pl-1 space-y-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              sliderDepth={sliderDepth}
              searchFilter={searchFilter}
              manuallyToggled={manuallyToggled}
              onToggleNode={onToggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SigreOpmlViewer: React.FC<SigreOpmlViewerProps> = ({
  opmlCode,
  title = "5. Mapa Mental Estructurado (OPML XML)",
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "xml">("tree");
  const [searchFilter, setSearchFilter] = useState("");
  const [sliderDepth, setSliderDepth] = useState<number>(4); // Default to 4 levels of depth
  const [manuallyToggled, setManuallyToggled] = useState<Record<string, boolean>>({});

  const cleanOpml = useMemo(() => {
    return (opmlCode || "")
      .replace(/^```xml/i, "")
      .replace(/^```opml/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
  }, [opmlCode]);

  const { root: treeRoot, maxDepth: parsedMaxDepth, totalNodes } = useMemo(() => {
    if (!cleanOpml) return { root: null, maxDepth: 0, totalNodes: 0 };
    return parseOpmlToTree(cleanOpml);
  }, [cleanOpml]);

  const effectiveMaxDepth = Math.max(parsedMaxDepth || 1, 6);

  // When slider depth changes, clear manual node overrides so the entire tree aligns to the slider depth
  const handleSliderChange = (newDepth: number) => {
    setSliderDepth(newDepth);
    setManuallyToggled({});
  };

  const handleToggleNode = (nodeId: string) => {
    setManuallyToggled((prev) => {
      // Find node's current computed state
      const current = nodeId in prev ? prev[nodeId] : false;
      return { ...prev, [nodeId]: !current };
    });
  };

  const handleExpandAll = () => {
    setSliderDepth(effectiveMaxDepth);
    setManuallyToggled({});
  };

  const handleCollapseAll = () => {
    setSliderDepth(1);
    setManuallyToggled({});
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanOpml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCompleteFile = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const blob = new Blob([cleanOpml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mapa_mental_sigre_completo.opml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFilteredDepthFile = () => {
    if (!treeRoot) return;
    const prunedXml = pruneOpmlToDepthXml(treeRoot, sliderDepth, title);
    const blob = new Blob([prunedXml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mapa_mental_sigre_nivel_${sliderDepth}.opml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeLevelInfo = LEVEL_DESCRIPTIONS[Math.min(sliderDepth, 6)] || LEVEL_DESCRIPTIONS[6];

  return (
    <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm space-y-0">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-alt/40 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
                {title}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold">
                Multi-Nivel ({parsedMaxDepth} Niveles • {totalNodes} Nodos)
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Formato XML OPML 2.0 estándar compatible con XMind, MindNode, FreeMind, Obsidian y Workflowy
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "tree" && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en el mapa..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-border-default rounded-lg focus:outline-none focus:border-purple-500 w-36 sm:w-44 text-text-primary"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setViewMode(viewMode === "tree" ? "xml" : "tree")}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-default hover:bg-alt text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {viewMode === "tree" ? (
              <>
                <FileCode className="w-3.5 h-3.5 text-purple-400" /> Ver XML OPML
              </>
            ) : (
              <>
                <FolderTree className="w-3.5 h-3.5 text-purple-400" /> Ver Árbol Interactivo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadCompleteFile}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Descargar archivo .opml completo multi-nivel para XMind / MindNode"
          >
            <Download className="w-3.5 h-3.5" /> Descargar .opml Completo
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border-default hover:bg-alt text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-text-muted" /> Copiar XML
              </>
            )}
          </button>
        </div>
      </div>

      {/* Depth Slider & Interactive Controls Bar */}
      {viewMode === "tree" && cleanOpml && (
        <div className="px-5 py-3.5 bg-alt/20 border-b border-border-default space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                Control de Profundidad Jerárquica:
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${activeLevelInfo.badgeBg}`}>
                Nivel {sliderDepth} de {effectiveMaxDepth}
              </span>
            </div>

            {/* Quick Level Presets & Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleSliderChange(lvl)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    sliderDepth === lvl
                      ? "bg-purple-500 text-white shadow-sm shadow-purple-500/30 scale-105"
                      : "bg-surface border border-border-default hover:bg-alt text-text-muted hover:text-text-primary"
                  }`}
                >
                  Niv. {lvl}
                </button>
              ))}

              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-surface border border-border-default hover:bg-alt text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Expandir todos los niveles"
              >
                <Maximize2 className="w-3 h-3" /> Expandir Todo
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-surface border border-border-default hover:bg-alt text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors cursor-pointer"
                title="Colapsar a nivel raíz"
              >
                <Minimize2 className="w-3 h-3" /> Colapsar
              </button>

              <button
                type="button"
                onClick={handleDownloadFilteredDepthFile}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                title={`Descargar archivo .opml acotado hasta el nivel ${sliderDepth}`}
              >
                <Download className="w-3 h-3" /> .opml Nivel {sliderDepth}
              </button>
            </div>
          </div>

          {/* Interactive Range Slide */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-[11px] font-mono text-text-muted font-bold">1</span>
            <input
              type="range"
              min={1}
              max={effectiveMaxDepth}
              step={1}
              value={sliderDepth}
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
            />
            <span className="text-[11px] font-mono text-text-muted font-bold">{effectiveMaxDepth}</span>
          </div>

          {/* Active Level Descriptive Guide */}
          <div className="p-2.5 bg-surface border border-border-default rounded-xl flex items-start gap-2.5 text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-purple-400 mt-1 shrink-0 animate-pulse" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-text-primary flex items-center gap-2">
                <span>{activeLevelInfo.title}</span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                {activeLevelInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Display Area */}
      <div className="p-5 bg-background">
        {cleanOpml ? (
          viewMode === "tree" ? (
            treeRoot ? (
              <div className="bg-surface border border-border-default rounded-xl p-4 sm:p-6 max-h-[580px] overflow-y-auto shadow-inner space-y-1">
                <TreeNode
                  node={treeRoot}
                  sliderDepth={sliderDepth}
                  searchFilter={searchFilter}
                  manuallyToggled={manuallyToggled}
                  onToggleNode={handleToggleNode}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-500 mb-2">
                  Vista simplificada (estructura XML en bruto disponible):
                </p>
                <pre className="p-4 bg-slate-950 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed select-all">
                  {cleanOpml}
                </pre>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono px-1">
                <span>// Estándar OPML 2.0 (XML Multi-Nivel)</span>
                <span>{cleanOpml.split("\n").length} líneas • {totalNodes} nodos</span>
              </div>
              <pre className="p-5 bg-slate-950 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed select-all max-h-[580px]">
                {cleanOpml}
              </pre>
            </div>
          )
        ) : (
          <div className="p-8 text-center text-text-muted text-xs">
            No se ha generado el código OPML para esta Unidad Didáctica.
          </div>
        )}
      </div>
    </div>
  );
};
