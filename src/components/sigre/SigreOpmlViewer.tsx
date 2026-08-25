import React, { useState, useMemo } from "react";
import {
  Share2,
  Copy,
  Check,
  Download,
  Code2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  BookOpen,
  Target,
  Layers,
  FileCode,
  Compass,
} from "lucide-react";

interface SigreOpmlViewerProps {
  opmlCode: string;
  title?: string;
  onDownload?: () => void;
}

interface OpmlNode {
  id: string;
  text: string;
  children: OpmlNode[];
}

function parseOpmlToTree(opmlXml: string): OpmlNode | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(opmlXml, "text/xml");
    const body = xmlDoc.querySelector("body");
    if (!body) return null;

    let counter = 0;
    const processNode = (element: Element): OpmlNode => {
      counter++;
      const text = element.getAttribute("text") || element.getAttribute("title") || "Nodo";
      const childrenEls = Array.from(element.children).filter(
        (c) => c.tagName.toLowerCase() === "outline"
      );
      return {
        id: `node-${counter}-${text.substring(0, 15).replace(/\s+/g, "_")}`,
        text,
        children: childrenEls.map(processNode),
      };
    };

    const rootOutlines = Array.from(body.children).filter(
      (c) => c.tagName.toLowerCase() === "outline"
    );
    if (rootOutlines.length === 0) return null;

    if (rootOutlines.length === 1) {
      return processNode(rootOutlines[0]);
    }

    return {
      id: "root-tree",
      text: xmlDoc.querySelector("head > title")?.textContent || "Mapa Mental Curricular",
      children: rootOutlines.map(processNode),
    };
  } catch (err) {
    console.error("Error parsing OPML:", err);
    return null;
  }
}

const TreeNode: React.FC<{
  node: OpmlNode;
  level: number;
  searchFilter: string;
}> = ({ node, level, searchFilter }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  const matchesFilter =
    !searchFilter ||
    node.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
    node.children.some((c) =>
      c.text.toLowerCase().includes(searchFilter.toLowerCase())
    );

  if (!matchesFilter && searchFilter) return null;

  const getNodeIcon = (lvl: number, txt: string) => {
    if (lvl === 0) return <Compass className="w-4 h-4 text-amber-500" />;
    if (txt.includes("1.") || txt.includes("INTRODUCCIÓN"))
      return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
    if (txt.includes("2.") || txt.includes("CONTENIDOS"))
      return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
    if (txt.includes("3.") || txt.includes("OBJETIVOS"))
      return <Target className="w-3.5 h-3.5 text-purple-400" />;
    if (lvl === 1) return <FolderTree className="w-3.5 h-3.5 text-cyan-400" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />;
  };

  return (
    <div className="select-none font-sans text-xs">
      <div
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={`flex items-start gap-2 py-1.5 px-2.5 rounded-lg transition-colors group cursor-pointer ${
          level === 0
            ? "bg-amber-500/10 border border-amber-500/30 text-amber-900 font-bold mb-2"
            : level === 1
            ? "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-semibold text-text-primary mb-1"
            : "hover:bg-alt/70 text-text-secondary"
        }`}
        style={{ marginLeft: `${Math.min(level * 16, 80)}px` }}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 text-text-muted">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
            )
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
        </span>

        <span className="shrink-0 mt-0.5">{getNodeIcon(level, node.text)}</span>

        <span className="flex-1 leading-snug break-words">
          {node.text}
        </span>

        {hasChildren && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface border border-border-subtle text-text-muted shrink-0 font-mono">
            {node.children.length}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-border-subtle/80 ml-4 pl-1 space-y-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              searchFilter={searchFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SigreOpmlViewer: React.FC<SigreOpmlViewerProps> = ({
  opmlCode,
  title = "Mapa Mental Estructurado (OPML)",
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "xml">("tree");
  const [searchFilter, setSearchFilter] = useState("");

  const cleanOpml = useMemo(() => {
    return (opmlCode || "")
      .replace(/^```xml/i, "")
      .replace(/^```opml/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();
  }, [opmlCode]);

  const treeRoot = useMemo(() => {
    if (!cleanOpml) return null;
    return parseOpmlToTree(cleanOpml);
  }, [cleanOpml]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanOpml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const blob = new Blob([cleanOpml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mapa_mental_sigre.opml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm space-y-0">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-alt/40 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
              {title}
            </h4>
            <p className="text-[11px] text-text-muted">
              Formato estándar XML OPML 2.0 compatible con XMind, FreeMind, MindNode y Obsidian
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "tree" && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar nodos..."
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
            onClick={handleDownloadFile}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Descargar archivo .opml para XMind"
          >
            <Download className="w-3.5 h-3.5" /> Descargar .opml
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

      {/* Main Display Area */}
      <div className="p-5 bg-background">
        {cleanOpml ? (
          viewMode === "tree" ? (
            treeRoot ? (
              <div className="bg-surface border border-border-default rounded-xl p-4 sm:p-6 max-h-[550px] overflow-y-auto shadow-inner">
                <TreeNode
                  node={treeRoot}
                  level={0}
                  searchFilter={searchFilter}
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
                <span>// Estándar OPML 2.0 (XML)</span>
                <span>{cleanOpml.split("\n").length} líneas</span>
              </div>
              <pre className="p-5 bg-slate-950 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed select-all max-h-[550px]">
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
