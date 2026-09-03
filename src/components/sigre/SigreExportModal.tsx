import React, { useState } from "react";
import {
  X,
  Download,
  FileArchive,
  FileText,
  GraduationCap,
  FileCode2,
  Share2,
  Cpu,
  CheckCircle2,
  Table,
  Upload,
  AlertTriangle,
  RefreshCw,
  FolderArchive,
  Layers,
  Sparkles,
  Info,
  Copy,
  Check,
  ArrowRight,
  Database,
  FileSpreadsheet,
  Calendar,
  HelpCircle,
  Folder,
} from "lucide-react";
import { SigreCurricularConfig, SigreUDItem } from "../../types/sigre";
import {
  exportMasterConsolidatedDocx,
  buildMasterConsolidatedGift,
  buildMasterConsolidatedRubricsXml,
  buildMasterConsolidatedOpml,
  buildMasterProjectJson,
  generateSigreCompleteZip,
  SigreZipExportOptions,
  buildSingleUdJson,
  exportSingleUdJson,
  parseAndValidateSigrePayload,
  mergeSigreProject,
  ParsedSigrePayload,
  build4LevelTimelineHtml,
  buildConsolidatedAutoevaluacionHtml,
} from "../../utils/sigreCompleteExporter";
import { downloadBlob } from "../../utils/fileHelpers";

interface SigreExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  uds: SigreUDItem[];
  config: SigreCurricularConfig;
  initialTab?: "zip" | "individuales" | "importar" | "backup_restore";
  selectedUdId?: string | null;
  onImportProjectJson?: (importedUds: SigreUDItem[], importedConfig: SigreCurricularConfig) => void;
}

export const SigreExportModal: React.FC<SigreExportModalProps> = ({
  isOpen,
  onClose,
  uds,
  config,
  initialTab = "zip",
  selectedUdId,
  onImportProjectJson,
}) => {
  const [activeTab, setActiveTab] = useState<"zip" | "individuales" | "importar" | "backup_restore">(initialTab);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgressMsg, setZipProgressMsg] = useState("");
  const [zipProgressPercent, setZipProgressPercent] = useState(0);
  const [zipOptions, setZipOptions] = useState<SigreZipExportOptions>({
    includeEditorial: true,
    includeCurricular: true,
    includeAutoevaluacion: true,
    includeMoodleGiftAndTests: true,
    includeOpmlAndDiagrams: true,
    includeProgramacionRubricas: true,
    includeHdiApps: true,
    includeCronograma4Niveles: true,
    includeMasterJson: true,
  });

  // Import / Update state
  const [importSourceType, setImportSourceType] = useState<"file" | "paste">("file");
  const [pastedJsonText, setPastedJsonText] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [parsedPayload, setParsedPayload] = useState<ParsedSigrePayload | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [copiedUdId, setCopiedUdId] = useState<string | null>(null);
  const [copiedProjectJson, setCopiedProjectJson] = useState(false);

  // Single UD selected for individual export/view
  const [currentSelectedUdId, setCurrentSelectedUdId] = useState<string>(
    selectedUdId || (uds[0]?.id ?? "")
  );

  if (!isOpen) return null;

  const completedCount = uds.filter((u) => u.data).length;
  const hdiCount = uds.filter((u) => u.data?.hdi?.appHtmlCode).length;
  const cleanModName = (config.moduloFormativo || "Modulo_FP").replace(/[^a-zA-Z0-9_-]/g, "_");
  const targetUd = uds.find((u) => u.id === currentSelectedUdId) || uds[0];

  // Handler for ZIP download
  const handleDownloadZip = async () => {
    setIsExportingZip(true);
    setZipProgressMsg("Preparando contenidos...");
    setZipProgressPercent(5);

    try {
      const zipBlob = await generateSigreCompleteZip(
        uds,
        config,
        zipOptions,
        (msg, percent) => {
          setZipProgressMsg(msg);
          setZipProgressPercent(percent);
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SIGRE_Paquete_Completo_${cleanModName}_${uds.length}UDs.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error al exportar ZIP:", err);
      alert("Error al empaquetar el archivo ZIP: " + (err.message || err));
    } finally {
      setIsExportingZip(false);
      setZipProgressMsg("");
      setZipProgressPercent(0);
    }
  };

  // Handler for Consolidated Word
  const handleDownloadMasterDocx = async () => {
    await exportMasterConsolidatedDocx(uds, config);
  };

  // Handler for Consolidated GIFT
  const handleDownloadMasterGift = () => {
    const giftText = buildMasterConsolidatedGift(uds, config);
    downloadBlob(
      `Banco_GIFT_Consolidado_${cleanModName}_${uds.length}UDs.gift`,
      giftText,
      "text/plain;charset=utf-8"
    );
  };

  // Handler for Consolidated Rubrics XML
  const handleDownloadMasterRubricsXml = () => {
    const xmlText = buildMasterConsolidatedRubricsXml(uds, config);
    downloadBlob(
      `Rubricas_Consolidadas_${cleanModName}.xml`,
      xmlText,
      "application/xml;charset=utf-8"
    );
  };

  // Handler for Consolidated OPML
  const handleDownloadMasterOpml = () => {
    const opmlText = buildMasterConsolidatedOpml(uds, config);
    downloadBlob(
      `Mapa_Mental_Consolidado_${cleanModName}.opml`,
      opmlText,
      "text/xml;charset=utf-8"
    );
  };

  // Handler for 4-Level Timeline HTML
  const handleDownload4LevelTimelineHtml = () => {
    const htmlText = build4LevelTimelineHtml(uds, config);
    downloadBlob(
      `Cronograma_Visual_4_Niveles_${cleanModName}.html`,
      htmlText,
      "text/html;charset=utf-8"
    );
  };

  // Handler for Consolidated Autoevaluaciones HTML
  const handleDownloadAutoevaluacionesHtml = () => {
    const htmlText = buildConsolidatedAutoevaluacionHtml(uds, config);
    downloadBlob(
      `Cuestionarios_Autoevaluacion_Consolidados_${cleanModName}.html`,
      htmlText,
      "text/html;charset=utf-8"
    );
  };

  // Handler for Master JSON Backup
  const handleDownloadMasterJson = () => {
    const jsonText = buildMasterProjectJson(uds, config);
    downloadBlob(
      `SIGRE_Proyecto_Completo_${cleanModName}_${uds.length}UDs.json`,
      jsonText,
      "application/json;charset=utf-8"
    );
  };

  // Handler for Copy Master JSON
  const handleCopyMasterJson = () => {
    const jsonText = buildMasterProjectJson(uds, config);
    navigator.clipboard.writeText(jsonText);
    setCopiedProjectJson(true);
    setTimeout(() => setCopiedProjectJson(false), 2500);
  };

  // Handler for Single UD JSON copy/export
  const handleCopySingleUdJson = (ud: SigreUDItem) => {
    const jsonText = buildSingleUdJson(ud, config);
    navigator.clipboard.writeText(jsonText);
    setCopiedUdId(ud.id);
    setTimeout(() => setCopiedUdId(null), 2500);
  };

  // Parse incoming text/file
  const handleInspectPayload = (rawContent: string) => {
    setImportError(null);
    setImportSuccess(null);
    const parsed = parseAndValidateSigrePayload(rawContent);

    if (parsed.type === "invalid") {
      setImportError(parsed.error || "El contenido no pudo ser validado como formato SIGRE.");
      setParsedPayload(null);
    } else {
      setParsedPayload(parsed);
    }
  };

  // Handler for file upload inspection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleInspectPayload(text);
    };
    reader.readAsText(file);
  };

  // Apply parsed payload to project
  const handleApplyImport = () => {
    if (!parsedPayload || parsedPayload.type === "invalid") {
      setImportError("No hay contenido válido cargado para aplicar.");
      return;
    }

    try {
      const result = mergeSigreProject(uds, config, parsedPayload, importMode);
      if (onImportProjectJson) {
        onImportProjectJson(result.updatedUds, result.updatedConfig);
        setImportSuccess(
          `¡Actualización completada! ${result.stats.updatedCount} UDs actualizadas, ${result.stats.addedCount} nuevas agregadas (Total: ${result.stats.totalCount} UDs).`
        );
        setParsedPayload(null);
        setPastedJsonText("");
      }
    } catch (err: any) {
      setImportError("Error al aplicar la actualización: " + (err.message || err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-alt to-surface border-b border-border-default flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-text-primary">
                  Gestión de Contenidos: Importar / Exportar
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase">
                  SIGRE v6.0
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {config.moduloFormativo} (Cód. {config.codigo || "0000"}) • {uds.length} UDs ({completedCount} desarrolladas)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-alt transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-border-default bg-alt/50 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("importar")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === "importar"
                ? "bg-surface text-amber-500 border-border-default font-black shadow-xs -mb-px"
                : "text-text-muted hover:text-text-primary border-transparent"
            }`}
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Importar / Actualizar Contenido</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black">
              Sync
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("zip")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === "zip"
                ? "bg-surface text-amber-500 border-border-default font-black shadow-xs -mb-px"
                : "text-text-muted hover:text-text-primary border-transparent"
            }`}
          >
            <FileArchive className="w-4 h-4" />
            <span>Paquete Completo .ZIP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("individuales")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === "individuales"
                ? "bg-surface text-amber-500 border-border-default font-black shadow-xs -mb-px"
                : "text-text-muted hover:text-text-primary border-transparent"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Formatos y Entregables (Word/GIFT/XML)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("backup_restore")}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === "backup_restore"
                ? "bg-surface text-amber-500 border-border-default font-black shadow-xs -mb-px"
                : "text-text-muted hover:text-text-primary border-transparent"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Copia de Respaldo JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB: IMPORT / UPDATE CONTENT */}
          {activeTab === "importar" && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Sincronizar y Actualizar Contenidos Generados
                  </h4>
                  <p className="text-xs text-text-muted max-w-xl">
                    Importa archivos JSON o pega respuestas generadas externamente. El sistema valida los datos, detecta los entregables y actualiza tus Unidades Didácticas sin perder tu configuración.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-1 bg-surface border border-border-default rounded-xl flex text-xs">
                    <button
                      type="button"
                      onClick={() => setImportMode("merge")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        importMode === "merge"
                          ? "bg-amber-500 text-black shadow-xs"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                      title="Actualiza las UDs existentes y agrega nuevas sin borrar las demás"
                    >
                      🔄 Fusionar / Actualizar
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode("replace")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        importMode === "replace"
                          ? "bg-red-500 text-white shadow-xs"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                      title="Reemplaza completamente todas las UDs del proyecto"
                    >
                      ⚡ Reemplazar Todo
                    </button>
                  </div>
                </div>
              </div>

              {/* Input Method Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Método de entrada de contenido:
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setImportSourceType("file")}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        importSourceType === "file"
                          ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      Subir Archivo .JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportSourceType("paste")}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        importSourceType === "paste"
                          ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      Pegar Texto / JSON Directo
                    </button>
                  </div>
                </div>

                {/* File Upload Box */}
                {importSourceType === "file" && (
                  <div className="p-5 border-2 border-dashed border-border-default hover:border-amber-500/50 rounded-2xl text-center space-y-3 bg-alt/30 transition-colors">
                    <Upload className="w-8 h-8 text-amber-500 mx-auto" />
                    <div>
                      <div className="text-xs text-text-primary font-bold">
                        Selecciona o arrastra un archivo de respaldo o unidad didáctica (.json)
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Compatible con copias completas de SIGRE o entregables individuales de UD.
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="block w-full max-w-sm mx-auto text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* Paste Area Box */}
                {importSourceType === "paste" && (
                  <div className="space-y-2">
                    <textarea
                      value={pastedJsonText}
                      onChange={(e) => {
                        setPastedJsonText(e.target.value);
                        if (e.target.value.trim().length > 10) {
                          handleInspectPayload(e.target.value);
                        } else {
                          setParsedPayload(null);
                        }
                      }}
                      placeholder="Pega aquí el contenido JSON (proyecto completo, objeto de unidad didáctica o bloques de respuesta IA)..."
                      className="w-full h-40 p-3 bg-alt/50 border border-border-default rounded-xl font-mono text-xs text-text-primary focus:outline-none focus:border-amber-500/50 resize-y"
                    />
                    <div className="flex justify-between items-center text-[11px] text-text-muted">
                      <span>Puedes pegar respuestas directas con ```json ... ``` incluidas.</span>
                      <button
                        type="button"
                        onClick={() => handleInspectPayload(pastedJsonText)}
                        disabled={!pastedJsonText.trim()}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        Validar y Analizar Contenido
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payload Inspection / Preview Box */}
              {parsedPayload && (
                <div className="p-4 bg-surface border border-emerald-500/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-border-default pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <div>
                        <h5 className="text-xs font-black text-text-primary">
                          Estructura SIGRE Detectada con Éxito:{" "}
                          <span className="text-emerald-500 uppercase">
                            {parsedPayload.type === "full_project"
                              ? "Proyecto Completo de Módulo"
                              : parsedPayload.type === "single_ud"
                              ? "Unidad Didáctica Individual"
                              : "Lista de Unidades"}
                          </span>
                        </h5>
                        <p className="text-[11px] text-text-muted">
                          {parsedPayload.config?.moduloFormativo
                            ? `Módulo: ${parsedPayload.config.moduloFormativo}`
                            : "Contenido listo para sincronizar con el módulo actual"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyImport}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" /> Aplicar Actualización al Módulo
                    </button>
                  </div>

                  {/* List of Detected UDs preview */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(parsedPayload.uds || (parsedPayload.singleUd ? [parsedPayload.singleUd] : [])).map(
                      (ud, idx) => {
                        const hasCurricular = !!ud.data?.udCurricular;
                        const hasEditorial = !!ud.data?.modulo1;
                        const hasGift = !!(
                          ud.data?.recursosDocente?.giftFullText ||
                          ud.data?.recursosDocente?.bancoGiftParte1
                        );
                        const hasRubrics = !!ud.data?.programacionEval?.rubricasXml;
                        const hasHdi = !!ud.data?.hdi?.appHtmlCode;

                        return (
                          <div
                            key={ud.id || idx}
                            className="p-2.5 bg-alt/40 border border-border-default rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                {ud.id || `UD #${idx + 1}`}
                              </span>
                              <span className="font-bold text-text-primary truncate max-w-xs">
                                {ud.title || "Unidad sin título"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              {hasCurricular && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                  Curricular
                                </span>
                              )}
                              {hasEditorial && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                  Editorial
                                </span>
                              )}
                              {hasGift && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                  GIFT
                                </span>
                              )}
                              {hasRubrics && (
                                <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400">
                                  Rúbricas
                                </span>
                              )}
                              {hasHdi && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                  HDI App
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {importSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccess}</span>
                </div>
              )}

              {importError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB: FULL ZIP EXPORT */}
          {activeTab === "zip" && (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Exportación Integral del Módulo en Archivo ZIP
                  </h4>
                  <p className="text-xs text-text-muted max-w-xl">
                    Genera y comprime en una sola descarga todos los documentos Word (.docx), archivos HTML, bancos GIFT de preguntas de Moodle, rúbricas XML, mapas mentales OPML, diagramas Mermaid y simuladores interactivos.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isExportingZip}
                  onClick={handleDownloadZip}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isExportingZip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {zipProgressPercent}% Empaquetando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Descargar Todo en ZIP (.zip)
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar if active */}
              {isExportingZip && (
                <div className="p-4 bg-surface border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-text-primary">
                    <span>{zipProgressMsg || "Procesando archivos..."}</span>
                    <span className="font-mono text-amber-500">{zipProgressPercent}%</span>
                  </div>
                  <div className="w-full bg-alt rounded-full h-2 overflow-hidden border border-border-default">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${zipProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Folders Summary Banner */}
              <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <FolderArchive className="w-4 h-4" /> Estructura de Carpetas Generada en el ZIP
                  </span>
                  <span className="text-[11px] font-mono text-text-muted">8 Categorías Oficiales + Respaldo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">1a. UD Editorial</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">1b. UD Curricular (19 Puntos)</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">2. Cuestionario de Autoevaluación</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">3. Banco Moodle GIFT & Tests</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">4. Diagrama & Mapa Mental (OPML)</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">5. Programación & Rúbricas XML</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-pink-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">6. Simulador HDI</span>
                  </div>
                  <div className="p-2.5 bg-alt/50 border border-border-default rounded-lg flex items-center gap-2">
                    <Folder className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="font-bold text-[11px] text-text-primary truncate">7. Cronograma Visual (4 Niveles)</span>
                  </div>
                </div>
              </div>

              {/* Checkbox Options Grid */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Selecciona qué carpetas y contenidos incluir en el paquete ZIP:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeEditorial}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeEditorial: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500" /> 1a. UD Editorial (Word y HTML)
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Dossier editorial consolidado + tratados técnicos y memorias didácticas individuales por UD.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeCurricular}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeCurricular: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-red-500" /> 1b. UD Curricular (19 Puntos LOMLOE)
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Fichas curriculares oficiales RD 659/2023, dossier consolidado y Matriz Curricular Tabla 7.1.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeAutoevaluacion}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeAutoevaluacion: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> 2. Cuestionario de Autoevaluación
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Cuestionarios de autoevaluación formativa (20 ítems) individuales y banco consolidado con retroalimentación.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeMoodleGiftAndTests}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeMoodleGiftAndTests: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> 3. Banco Moodle GIFT & Tests
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Banco GIFT maestro, archivos GIFT por unidad, exámenes tipo test y solucionarios técnicos razonados.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeOpmlAndDiagrams}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeOpmlAndDiagrams: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-cyan-500" /> 4. Diagrama & Mapa Mental (OPML)
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Mapas mentales OPML consolidados y por UD, diagramas Mermaid (.mmd y Markdown) y visor web.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeProgramacionRubricas}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeProgramacionRubricas: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5 text-purple-500" /> 5. Programación & Rúbricas XML
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Programación didáctica completa en Word/HTML, rúbricas de evaluación Moodle XML y matrices de alineación.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeHdiApps}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeHdiApps: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-pink-500" /> 6. Simulador HDI ({hdiCount} apps)
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Micro-aplicaciones didácticas interactivas autónomas en HTML5, especificaciones PRD y catálogo web.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeCronograma4Niveles}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeCronograma4Niveles: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-500" /> 7. Cronograma Visual (4 Niveles)
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Macrocronograma anual/trimestral, distribución mensual, secuencia semanal de aula/taller e hitos evaluativos.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 bg-surface border border-border-default hover:border-amber-500/40 rounded-xl flex items-start gap-3 cursor-pointer transition-colors sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={zipOptions.includeMasterJson}
                      onChange={(e) => setZipOptions({ ...zipOptions, includeMasterJson: e.target.checked })}
                      className="mt-0.5 rounded border-border-default text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-text-primary flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copia de Seguridad JSON Maestra (Raíz del ZIP)
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Archivo .json en la raíz del archivo ZIP para restaurar, migrar o compartir el proyecto íntegro en SIGRE.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SPECIFIC FORMATS */}
          {activeTab === "individuales" && (
            <div className="space-y-5">
              {/* Consolidated formats */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
                  Formatos Consolidados de Todo el Módulo:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Master Word */}
                  <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Dossier Programación (.docx)</h5>
                        <p className="text-[11px] text-text-muted">Microsoft Word editable de todo el módulo</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadMasterDocx}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Word Completo (.docx)
                    </button>
                  </div>

                  {/* Master GIFT */}
                  <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Banco Moodle GIFT (.gift)</h5>
                        <p className="text-[11px] text-text-muted">Todas las preguntas categorizadas por UD</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadMasterGift}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Banco GIFT (.gift)
                    </button>
                  </div>

                  {/* Master Rubrics XML */}
                  <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center">
                        <FileCode2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Rúbricas Moodle XML (.xml)</h5>
                        <p className="text-[11px] text-text-muted">Criterios de evaluación y descriptores</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadMasterRubricsXml}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Rúbricas XML (.xml)
                    </button>
                  </div>

                  {/* Master OPML */}
                  <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Mapa Mental OPML (.opml)</h5>
                        <p className="text-[11px] text-text-muted">Jerarquía conceptual para XMind / MindNode</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadMasterOpml}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Mapa Mental (.opml)
                    </button>
                  </div>

                  {/* 4-Level Timeline */}
                  <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-500 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Cronograma Visual (4 Niveles)</h5>
                        <p className="text-[11px] text-text-muted">Informe interactivo anual, mensual, semanal e hitos</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload4LevelTimelineHtml}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Cronograma (.html)
                    </button>
                  </div>

                  {/* Consolidated Autoevaluaciones */}
                  <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-text-primary">Cuestionarios de Autoevaluación</h5>
                        <p className="text-[11px] text-text-muted">Banco formativo consolidado de 20 preguntas por UD</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadAutoevaluacionesHtml}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Autoevaluaciones (.html)
                    </button>
                  </div>
                </div>
              </div>

              {/* Individual UD Export Box */}
              <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Exportar / Descargar Unidad Didáctica Individual:
                  </h5>
                  <select
                    value={currentSelectedUdId}
                    onChange={(e) => setCurrentSelectedUdId(e.target.value)}
                    className="px-3 py-1.5 bg-alt border border-border-default rounded-lg text-xs font-bold text-text-primary"
                  >
                    {uds.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.id} - {u.title} {u.data ? "✓ (Desarrollada)" : "(Pendiente)"}
                      </option>
                    ))}
                  </select>
                </div>

                {targetUd && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-alt/30 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-text-primary font-mono">{targetUd.id}: </span>
                      <span className="text-text-muted">{targetUd.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopySingleUdJson(targetUd)}
                        className="px-3 py-1.5 bg-surface border border-border-default hover:bg-alt text-text-primary font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedUdId === targetUd.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-500" /> Copiar JSON UD
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => exportSingleUdJson(targetUd, config)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar JSON UD (.json)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: BACKUP & RESTORE JSON */}
          {activeTab === "backup_restore" && (
            <div className="space-y-4">
              <div className="p-4 bg-surface border border-border-default rounded-xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-text-primary">Copia de Seguridad Maestra en JSON</h5>
                    <p className="text-[11px] text-text-muted">
                      Guarda el estado completo del módulo con todas las configuraciones, parámetros curriculares y contenidos generados.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadMasterJson}
                    className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Download className="w-4 h-4" /> Guardar Archivo .json
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyMasterJson}
                    className="py-2.5 bg-surface border border-border-default hover:bg-alt text-text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedProjectJson ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" /> ¡JSON Copiado al Portapapeles!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-500" /> Copiar JSON Completo al Portapapeles
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tips Box */}
              <div className="p-4 bg-alt/40 border border-border-default rounded-xl space-y-2 text-xs text-text-muted">
                <div className="font-bold text-text-primary flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-500" /> Flujo de Trabajo y Actualización Externa:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                  <li>
                    <strong>Exporta</strong> el proyecto o una UD en formato JSON desde este panel.
                  </li>
                  <li>
                    <strong>Edita o amplía</strong> el contenido en cualquier editor de texto o mediante tus herramientas de IA preferidas.
                  </li>
                  <li>
                    Regresa a la pestaña <strong>"Importar / Actualizar Contenido"</strong> y pega o sube el JSON resultante.
                  </li>
                  <li>
                    Elige <strong>"Fusionar / Actualizar"</strong> para sincronizar los cambios de manera instantánea y segura.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-alt/50 border-t border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Todos los contenidos generados se importan/exportan conforme a LO 3/2022 y RD 659/2023.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-alt border border-border-default text-text-primary text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
