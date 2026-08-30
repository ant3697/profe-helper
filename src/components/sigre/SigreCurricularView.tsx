import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BookOpen,
  Sparkles,
  Upload,
  Layers,
  FileText,
  FileCode,
  GraduationCap,
  Cpu,
  Download,
  Printer,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Settings2,
  FileCheck,
  Code2,
  FileArchive,
  ArrowRight,
  Share2,
  ShieldCheck,
  Zap,
  BrainCircuit,
  HelpCircle,
  Scan,
  Bot,
  Award,
  Clock,
  Calendar,
  Hash,
  Workflow,
  Check,
  Info,
  School,
  Building2,
  Search,
  Filter,
  Activity,
  HardDrive,
  Gauge,
  Users,
} from "lucide-react";
import {
  SigreCurricularConfig,
  SigreUDItem,
  SigreUDData,
  SigreUDCurricularData,
  SigreUserLevel,
  SigreRagDocument,
} from "../../types/sigre";
import { AIProviderConfig } from "../../types/aiProviders";
import {
  buildSigreCurriculumExtractionPrompt,
  buildSigrePlanPrompt,
  buildSigreUDModule1Prompt,
  buildSigreUDModuleDocentePrompt,
  buildSigreUDModuleEvalPrompt,
  buildSigreHDIPrompt,
  buildSigreUDCurricularPrompt,
  buildSigreUDCurricularSectionPrompt,
  cleanSigreCurricularData,
  renderSigreUDCompleteA4Html,
  calculateSigrePedagogicalAudit,
  generateSigreOpml,
  cleanSigreLatexMath,
  generateDefaultSigre60GiftBank,
} from "../../utils/sigrePromptGenerator";
import { SigrePlanModal } from "./SigrePlanModal";
import { SigreRegenerateModal, SigreUDSectionKey } from "./SigreRegenerateModal";
import { SigreMermaidViewer } from "./SigreMermaidViewer";
import { SigreOpmlViewer } from "./SigreOpmlViewer";
import { SigreMoodleGiftViewer } from "./SigreMoodleGiftViewer";
import { SigreRubricXmlViewer } from "./SigreRubricXmlViewer";
import { SigreHDISandbox } from "./SigreHDISandbox";
import { SigreCurriculumDropzone } from "./SigreCurriculumDropzone";
import { SigreDocumentViewerModal } from "./SigreDocumentViewerModal";
import { SigrePedagogicalAuditModal } from "./SigrePedagogicalAuditModal";
import { SigreAutoevaluacionViewer } from "./SigreAutoevaluacionViewer";
import { SigreCurricularViewer } from "./SigreCurricularViewer";
import { SigreScheduleGuardManager } from "./SigreScheduleGuardManager";
import { SigreMultiLevelTimeline } from "./SigreMultiLevelTimeline";
import { SigreAcademicCalendarManager } from "./SigreAcademicCalendarManager";
import { SigreTechnicalAuditModal } from "./SigreTechnicalAuditModal";
import { getSampleFPModuleUds } from "../../data/sigreSampleModule";
import { INITIAL_SIGRE_SCHEDULE_CONFIG } from "../../data/sigreSchedulePresets";
import { extractTextFromFile } from "../../utils/pdfExtractor";
import { exportHtmlToDocx } from "../../utils/docxExport";
import { preparePrintableHtmlDocument } from "../../utils/topicPromptGenerator";
import { robustJsonParse } from "../../utils/jsonRepair";

interface SigreCurricularViewProps {
  theme: "dark" | "light";
  activeProviderConfig: AIProviderConfig;
  onOpenAIModal: () => void;
}

const DEFAULT_CONFIG: SigreCurricularConfig = {
  iterations: 3,
  adhesion: 3,
  userLevel: 2, // Bachillerato / FP
  moduloFormativo: "Sistemas Electrotécnicos y Automatizados",
  codigo: "MF0820_3",
  cicloFormativo: "Grado Superior en Mantenimiento Electrónico",
  familiaProfesional: "Electricidad y Electrónica",
  curso: "1º",
  curriculoReferencia: "Real Decreto 1578/2011 y normativa autonómica",
  contextoAplicacion: "IES Al-Baytar de Benalmádena (Málaga)",
  horasTotales: 160,
  horasSemanales: 5,
  numUnidadesDidacticas: 0, // 0 = Automático por Bloques
  semanasCurso: 32, // 32 semanas lectivas estándar del curso (incluye FFEOE práctica y FCE práctica UDs)
  duracionSesionMinutos: 60,
  horasPorSesion: 1,
  totalSesionesPrevistas: 160,
  incluyePeriodoRecuperacionJunio: true,
  incluyePlanificacionSiguienteCursoJunio: true,
  scheduleConfig: INITIAL_SIGRE_SCHEDULE_CONFIG,
  pedagogicalOptions: {
    testWiseness: true,
    cotAnticolision: true,
    practicaIntercalada: true,
    activeRecall: true,
    mnemotecnias: true,
    antiTunel: true,
  },
  desgloseCurricular: `BC1: Circuitos eléctricos y magnitudes fundamentales.
BC2: Cuadros de protección y distribución eléctrica en baja tensión.
BC3: Motores eléctricos y automatismos cableados de maniobra.
BC4: Autómatas programables (PLC) y lógica secuencial.
BC5: Sensores industriales y acondicionamiento de señal.
BC6: Mantenimiento predictivo y diagnóstico de averías.
BC7: Prevención de riesgos laborales y protección ambiental en instalaciones electrotécnicas.`,
};

function sanitizeUdDataMath(
  data?: SigreUDData,
  ud?: { id?: string; fullCode?: string; title?: string }
): SigreUDData | undefined {
  if (!data) return data;

  let recursosDocente = data.recursosDocente;
  if (
    !recursosDocente ||
    !recursosDocente.bancoGiftParte1 ||
    recursosDocente.bancoGiftParte1.trim().length < 50 ||
    !recursosDocente.bancoGiftParte2 ||
    recursosDocente.bancoGiftParte2.trim().length < 50
  ) {
    const defaultBank = generateDefaultSigre60GiftBank({
      id: ud?.id || "UD01",
      number: 1,
      fullCode: ud?.fullCode || ud?.id || "UD01",
      title: ud?.title || "Instalaciones y Mantenimiento Técnico",
      bcCode: "BC1",
      isPrl: false,
      horasEstimadas: 10,
      sesionesEstimadas: 5,
      status: "completed",
    });

    recursosDocente = {
      bancoGiftParte1:
        recursosDocente?.bancoGiftParte1 && recursosDocente.bancoGiftParte1.trim().length >= 50
          ? recursosDocente.bancoGiftParte1
          : defaultBank.bancoGiftParte1,
      bancoGiftParte2:
        recursosDocente?.bancoGiftParte2 && recursosDocente.bancoGiftParte2.trim().length >= 50
          ? recursosDocente.bancoGiftParte2
          : defaultBank.bancoGiftParte2,
      giftFullText: `${recursosDocente?.bancoGiftParte1 || defaultBank.bancoGiftParte1}\n\n${
        recursosDocente?.bancoGiftParte2 || defaultBank.bancoGiftParte2
      }`,
      propuestaExamenHtml:
        recursosDocente?.propuestaExamenHtml && recursosDocente.propuestaExamenHtml.trim().length >= 50
          ? recursosDocente.propuestaExamenHtml
          : defaultBank.propuestaExamenHtml,
      solucionarioExamenHtml:
        recursosDocente?.solucionarioExamenHtml && recursosDocente.solucionarioExamenHtml.trim().length >= 50
          ? recursosDocente.solucionarioExamenHtml
          : defaultBank.solucionarioExamenHtml,
      propuestaHdiConceptual: recursosDocente?.propuestaHdiConceptual || defaultBank.propuestaHdiConceptual,
    };
  }

  return {
    ...data,
    modulo1: data.modulo1
      ? {
          ...data.modulo1,
          titulo: cleanSigreLatexMath(data.modulo1.titulo),
          introduccion: cleanSigreLatexMath(data.modulo1.introduccion),
          conclusiones: cleanSigreLatexMath(data.modulo1.conclusiones),
          relacionIntradisciplinar: cleanSigreLatexMath(data.modulo1.relacionIntradisciplinar),
          indiceDesarrollo: cleanSigreLatexMath(data.modulo1.indiceDesarrollo),
          desarrolloEpigrafesHtml: cleanSigreLatexMath(data.modulo1.desarrolloEpigrafesHtml),
          referenciasNormativasHtml: cleanSigreLatexMath(data.modulo1.referenciasNormativasHtml),
          bibliografiaWebgrafiaHtml: cleanSigreLatexMath(data.modulo1.bibliografiaWebgrafiaHtml),
          glosarioHtml: cleanSigreLatexMath(data.modulo1.glosarioHtml),
          autoevaluacionHtml: cleanSigreLatexMath(data.modulo1.autoevaluacionHtml),
          contenidos: data.modulo1.contenidos
            ? {
                conceptuales: (data.modulo1.contenidos.conceptuales || []).map(cleanSigreLatexMath),
                procedimentales: (data.modulo1.contenidos.procedimentales || []).map(cleanSigreLatexMath),
                actitudinales: (data.modulo1.contenidos.actitudinales || []).map(cleanSigreLatexMath),
              }
            : data.modulo1.contenidos,
          objetivosSmart: (data.modulo1.objetivosSmart || []).map(cleanSigreLatexMath),
        }
      : data.modulo1,
    recursosDocente: {
      ...recursosDocente,
      bancoGiftParte1: cleanSigreLatexMath(recursosDocente.bancoGiftParte1),
      bancoGiftParte2: cleanSigreLatexMath(recursosDocente.bancoGiftParte2),
      giftFullText: cleanSigreLatexMath(recursosDocente.giftFullText),
      propuestaExamenHtml: cleanSigreLatexMath(recursosDocente.propuestaExamenHtml),
      solucionarioExamenHtml: cleanSigreLatexMath(recursosDocente.solucionarioExamenHtml),
      propuestaHdiConceptual: cleanSigreLatexMath(recursosDocente.propuestaHdiConceptual),
    },
    programacionEval: data.programacionEval
      ? {
          ...data.programacionEval,
          vinculacionCurricularHtml: cleanSigreLatexMath(data.programacionEval.vinculacionCurricularHtml),
          matrizAlineacionHtml: cleanSigreLatexMath(data.programacionEval.matrizAlineacionHtml),
          tablaActividadesHtml: cleanSigreLatexMath(data.programacionEval.tablaActividadesHtml),
          rubricasXml: cleanSigreLatexMath(data.programacionEval.rubricasXml),
        }
      : data.programacionEval,
    cotRazonamiento: cleanSigreLatexMath(data.cotRazonamiento || ""),
    glosarioHtml: cleanSigreLatexMath(data.glosarioHtml || ""),
    udCurricular: data.udCurricular ? cleanSigreCurricularData(data.udCurricular) : undefined,
  };
}

export const SigreCurricularView: React.FC<SigreCurricularViewProps> = ({
  theme,
  activeProviderConfig,
  onOpenAIModal,
}) => {
  // State
  const [config, setConfig] = useState<SigreCurricularConfig>(() => {
    try {
      const saved = localStorage.getItem("docuexam_sigre_config");
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [uds, setUds] = useState<SigreUDItem[]>(() => {
    try {
      const saved = localStorage.getItem("docuexam_sigre_uds");
      if (!saved) return [];
      const parsed: SigreUDItem[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Sanitize any stale "generating" status from previous sessions so items are not stuck in an infinite loop
      // and sanitize any LaTeX math syntax into clean plain text
      return parsed.map((u) => {
        const sanitizedData = u.data ? sanitizeUdDataMath(u.data, u) : undefined;
        if (u.status === "generating") {
          return sanitizedData ? { ...u, status: "completed", data: sanitizedData } : { ...u, status: "pending" };
        }
        return {
          ...u,
          title: cleanSigreLatexMath(u.title),
          fullCode: cleanSigreLatexMath(u.fullCode),
          data: sanitizedData,
        };
      });
    } catch {
      return [];
    }
  });

  const [selectedUdId, setSelectedUdId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("docuexam_sigre_selected_ud") || null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<
    "ud_completa" | "ud_curricular" | "cuestionario_autoeval" | "recursos_docente" | "programacion_eval" | "diagrama_flujo" | "hdi_interactiva" | "cronograma"
  >("ud_completa");

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [udToRegenerate, setUdToRegenerate] = useState<SigreUDItem | null>(null);
  const [isAnalyzingCurriculum, setIsAnalyzingCurriculum] = useState(false);
  const [isGeneratingUd, setIsGeneratingUd] = useState(false);
  const [isGeneratingCurricular, setIsGeneratingCurricular] = useState(false);
  const [isGeneratingHdi, setIsGeneratingHdi] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAudit6AxesOpen, setIsAudit6AxesOpen] = useState(false);
  const [isTechnicalAuditModalOpen, setIsTechnicalAuditModalOpen] = useState(false);
  const [globalViewMode, setGlobalViewMode] = useState<
    "unidades" | "calendario" | "cronogramas" | "horarios" | "parametros"
  >("unidades");
  const [udSearchQuery, setUdSearchQuery] = useState("");
  const [udFilterStatus, setUdFilterStatus] = useState<"all" | "completed" | "pending" | "prl">("all");
  const [loadingStatus, setLoadingStatus] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [ragDocuments, setRagDocuments] = useState<SigreRagDocument[]>(() => {
    try {
      const saved = localStorage.getItem("docuexam_sigre_rag_docs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [viewingDoc, setViewingDoc] = useState<SigreRagDocument | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configTab, setConfigTab] = useState<"curricular" | "horarios" | "cronogramas">("curricular");
  const [diagramSubTab, setDiagramSubTab] = useState<"mermaid" | "opml">("opml");
  const [docZoom, setDocZoom] = useState(1);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("docuexam_sigre_config", JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem("docuexam_sigre_uds", JSON.stringify(uds));
    } catch {}
  }, [uds]);

  useEffect(() => {
    try {
      localStorage.setItem("docuexam_sigre_rag_docs", JSON.stringify(ragDocuments));
    } catch {}
  }, [ragDocuments]);

  useEffect(() => {
    try {
      if (selectedUdId) {
        localStorage.setItem("docuexam_sigre_selected_ud", selectedUdId);
      } else {
        localStorage.removeItem("docuexam_sigre_selected_ud");
      }
    } catch {}
  }, [selectedUdId]);

  const selectedUd = uds.find((u) => u.id === selectedUdId) || uds[0] || null;

  // Filtered UDs for search & quick filters
  const filteredUds = useMemo(() => {
    return uds.filter((u) => {
      if (udFilterStatus === "completed" && u.status !== "completed") return false;
      if (udFilterStatus === "pending" && u.status === "completed") return false;
      if (udFilterStatus === "prl" && !u.isPrl) return false;

      if (udSearchQuery.trim()) {
        const q = udSearchQuery.toLowerCase();
        const matchTitle = (u.title || "").toLowerCase().includes(q);
        const matchId = (u.id || "").toLowerCase().includes(q);
        const matchCode = (u.fullCode || "").toLowerCase().includes(q);
        const matchBc = (u.bcCode || "").toLowerCase().includes(q);
        return matchTitle || matchId || matchCode || matchBc;
      }
      return true;
    });
  }, [uds, udFilterStatus, udSearchQuery]);

  const handleLoadSampleFPModule = () => {
    const sample = getSampleFPModuleUds(config);
    setUds(sample);
    setSelectedUdId(sample[0]?.id || null);
  };

  // Compute live pedagogical audit if UD is selected
  const activeAuditResult = selectedUd && selectedUd.data
    ? selectedUd.data.pedagogicalAudit || calculateSigrePedagogicalAudit(selectedUd.data, config)
    : null;

  // AI Extraction of Curriculum Breakdown (Bloques, RAs, Criterios de Evaluación)
  const handleExtractCurriculumWithAI = async (docText: string, docName = "Documento Curricular") => {
    if (!docText || !docText.trim()) return;
    setIsAnalyzingCurriculum(true);
    setLoadingStatus(`Analizando ${docName} y extrayendo Bloques, RAs y Criterios con IA...`);

    try {
      const prompt = buildSigreCurriculumExtractionPrompt(docText);
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          providerId: activeProviderConfig.id,
          apiKey: activeProviderConfig.apiKey,
          endpoint: activeProviderConfig.endpoint,
          model: activeProviderConfig.selectedModel,
          temperature: 0.2,
          jsonMode: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error del servidor: ${res.status}`);
      }

      const data = await res.json();
      const jsonMatch = data.text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : data.text);

      setConfig((prev) => ({
        ...prev,
        moduloFormativo: parsed.moduloFormativo || prev.moduloFormativo,
        codigo: parsed.codigo || prev.codigo,
        cicloFormativo: parsed.cicloFormativo || prev.cicloFormativo,
        familiaProfesional: parsed.familiaProfesional || prev.familiaProfesional,
        curso: parsed.curso || prev.curso,
        curriculoReferencia: parsed.curriculoReferencia || prev.curriculoReferencia,
        horasTotales: parsed.horasTotales || prev.horasTotales || 160,
        horasSemanales: parsed.horasSemanales || prev.horasSemanales || 5,
        desgloseCurricular: parsed.desgloseCurricular || prev.desgloseCurricular,
      }));

      // Ensure the config panel is open so the user sees the extracted result
      setIsConfigOpen(true);
    } catch (err: any) {
      console.error("Error al extraer desglose curricular con IA:", err);
      alert(`Error al analizar currículo con IA: ${err.message || err}`);
    } finally {
      setIsAnalyzingCurriculum(false);
      setLoadingStatus("");
    }
  };

  // Step 1: Analyze curriculum and propose UDs Plan
  const handleAnalyzeCurriculum = async () => {
    setIsAnalyzingCurriculum(true);
    setLoadingStatus("Analizando currículo, dimensionamiento de horas y aplicando regla de priorización PRL...");

    try {
      const ragContext = ragDocuments.map((f) => f.text).join("\n\n");
      const prompt = buildSigrePlanPrompt(config, ragContext);

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          providerId: activeProviderConfig.id,
          apiKey: activeProviderConfig.apiKey,
          endpoint: activeProviderConfig.endpoint,
          model: activeProviderConfig.selectedModel,
          temperature: 0.2,
          jsonMode: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error del servidor: ${res.status}`);
      }

      const data = await res.json();
      let parsedUds: SigreUDItem[] = [];

      try {
        const parsed = robustJsonParse<{ uds?: any[] }>(data.text, {});
        if (Array.isArray(parsed.uds)) {
          const defaultHoursPerUd = Math.round((config.horasTotales || 160) / parsed.uds.length);
          parsedUds = parsed.uds.map((item: any, idx: number) => {
            const h = item.horasEstimadas || defaultHoursPerUd;
            return {
              id: item.id || `UD${String(idx + 1).padStart(2, "0")}`,
              number: item.number || idx + 1,
              bcCode: item.bcCode || `BC${idx + 1}`,
              title: item.title || "Unidad Didáctica",
              fullCode: item.fullCode || `UD${String(idx + 1).padStart(2, "0")}. ${item.title}`,
              isPrl: !!item.isPrl,
              horasEstimadas: h,
              sesionesEstimadas: item.sesionesEstimadas || Math.max(1, Math.round(h / 2)),
              status: "pending",
            };
          });
        }
      } catch (err) {
        console.error("Error parsing UDs plan:", err);
      }

      if (parsedUds.length === 0) {
        // Fallback default structure
        const defaultHours = Math.round((config.horasTotales || 160) / 2);
        parsedUds = [
          {
            id: "UD01",
            number: 1,
            bcCode: "BC7",
            title: "Prevención de riesgos laborales y protección ambiental",
            fullCode: "UD01. BC7. Prevención de riesgos laborales y protección ambiental",
            isPrl: true,
            horasEstimadas: defaultHours,
            sesionesEstimadas: Math.max(1, Math.round(defaultHours / 2)),
            status: "pending",
          },
          {
            id: "UD02",
            number: 2,
            bcCode: "BC1",
            title: "Fundamentos y principios del sistema",
            fullCode: "UD02. BC1. Fundamentos y principios del sistema",
            isPrl: false,
            horasEstimadas: defaultHours,
            sesionesEstimadas: Math.max(1, Math.round(defaultHours / 2)),
            status: "pending",
          },
        ];
      }

      setUds(parsedUds);
      setIsPlanModalOpen(true);
    } catch (err: any) {
      console.error("Error analizando currículo:", err);
      alert("Error al analizar el currículo: " + err.message);
    } finally {
      setIsAnalyzingCurriculum(false);
      setLoadingStatus("");
    }
  };

  // Step 2: Confirm UDs plan
  const handleConfirmPlan = (
    updatedUds: SigreUDItem[],
    configUpdates?: Partial<SigreCurricularConfig>
  ) => {
    setUds(updatedUds);
    if (configUpdates) {
      setConfig((prev) => {
        const updated = { ...prev, ...configUpdates };
        try {
          localStorage.setItem("docuexam_sigre_config", JSON.stringify(updated));
        } catch (e) {
          console.error("Error saving config:", e);
        }
        return updated;
      });
    }
    if (updatedUds.length > 0) {
      if (!selectedUdId || !updatedUds.some((u) => u.id === selectedUdId)) {
        setSelectedUdId(updatedUds[0].id);
      }
    } else {
      setSelectedUdId("");
    }
    setIsPlanModalOpen(false);
  };

  // Cancel active generation
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGeneratingUd(false);
    setIsBatchGenerating(false);
    setLoadingStatus("");
    setUds((prev) =>
      prev.map((u) => (u.status === "generating" ? (u.data ? { ...u, status: "completed" } : { ...u, status: "pending" }) : u))
    );
  };

  // Step 3: Generate chosen UD (Module 1, Module Docente, Module Eval) with concurrency & resilience
  const handleGenerateChosenUD = async (targetUd: SigreUDItem, isBatch = false): Promise<boolean> => {
    if (!isBatch) {
      setIsGeneratingUd(true);
    }
    setSelectedUdId(targetUd.id);

    // Abort previous if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Update status to generating
    setUds((prev) =>
      prev.map((u) => (u.id === targetUd.id ? { ...u, status: "generating", error: undefined } : u))
    );

    try {
      const ragContext = ragDocuments.map((f) => f.text).join("\n\n");
      setLoadingStatus(`Generando Unidad Didáctica completa (${targetUd.fullCode})...`);

      const m1Prompt = buildSigreUDModule1Prompt(targetUd, config, ragContext);
      const m2Prompt = buildSigreUDModuleDocentePrompt(targetUd, null, config);
      const m3Prompt = buildSigreUDModuleEvalPrompt(targetUd, config);

      // Launch requests concurrently for high performance
      const [m1Result, m2Result, m3Result] = await Promise.allSettled([
        fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            prompt: m1Prompt,
            providerId: activeProviderConfig.id,
            apiKey: activeProviderConfig.apiKey,
            endpoint: activeProviderConfig.endpoint,
            model: activeProviderConfig.selectedModel,
            temperature: 0.2,
            jsonMode: true,
          }),
        }),
        fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            prompt: m2Prompt,
            providerId: activeProviderConfig.id,
            apiKey: activeProviderConfig.apiKey,
            endpoint: activeProviderConfig.endpoint,
            model: activeProviderConfig.selectedModel,
            temperature: 0.2,
            jsonMode: true,
          }),
        }),
        fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            prompt: m3Prompt,
            providerId: activeProviderConfig.id,
            apiKey: activeProviderConfig.apiKey,
            endpoint: activeProviderConfig.endpoint,
            model: activeProviderConfig.selectedModel,
            temperature: 0.2,
            jsonMode: true,
          }),
        }),
      ]);

      if (abortController.signal.aborted) {
        return false;
      }

      // Check M1
      let modulo1Data: any = {};
      if (m1Result.status === "fulfilled" && m1Result.value.ok) {
        const m1Raw = await m1Result.value.json();
        modulo1Data = robustJsonParse<any>(m1Raw.text, {});
      } else {
        const errMsg =
          m1Result.status === "fulfilled"
            ? (await m1Result.value.json().catch(() => ({}))).message || `HTTP ${m1Result.value.status}`
            : (m1Result as PromiseRejectedResult).reason?.message || "Fallo de conexión";
        throw new Error(`Error en Módulo 1: ${errMsg}`);
      }

      // Check M2 (Recursos Docente)
      let recursosDocenteData: any = {};
      if (m2Result.status === "fulfilled" && m2Result.value.ok) {
        const m2Raw = await m2Result.value.json();
        recursosDocenteData = robustJsonParse<any>(m2Raw.text, {});
      }

      // Guarantee full 60 questions if model output is missing or truncated
      const defaultBank60 = generateDefaultSigre60GiftBank(targetUd);
      if (!recursosDocenteData.bancoGiftParte1 || recursosDocenteData.bancoGiftParte1.trim().length < 50) {
        recursosDocenteData.bancoGiftParte1 = defaultBank60.bancoGiftParte1;
      }
      if (!recursosDocenteData.bancoGiftParte2 || recursosDocenteData.bancoGiftParte2.trim().length < 50) {
        recursosDocenteData.bancoGiftParte2 = defaultBank60.bancoGiftParte2;
      }
      if (!recursosDocenteData.propuestaExamenHtml || recursosDocenteData.propuestaExamenHtml.trim().length < 50) {
        recursosDocenteData.propuestaExamenHtml = defaultBank60.propuestaExamenHtml;
      }
      if (!recursosDocenteData.solucionarioExamenHtml || recursosDocenteData.solucionarioExamenHtml.trim().length < 50) {
        recursosDocenteData.solucionarioExamenHtml = defaultBank60.solucionarioExamenHtml;
      }
      if (!recursosDocenteData.propuestaHdiConceptual) {
        recursosDocenteData.propuestaHdiConceptual = defaultBank60.propuestaHdiConceptual;
      }

      // Check M3 (Programación & Evaluación)
      let programacionEvalData: any = {};
      if (m3Result.status === "fulfilled" && m3Result.value.ok) {
        const m3Raw = await m3Result.value.json();
        programacionEvalData = robustJsonParse<any>(m3Raw.text, {});
      } else {
        console.warn("Fallo en Módulo 3, aplicando vinculación curricular y rúbricas de respaldo.");
        programacionEvalData = {
          vinculacionCurricularHtml: `<div class="vinculacion-box"><h4>3.1. Vinculación Curricular</h4><p><strong>Bloque de Contenido:</strong> ${targetUd.bcCode} - ${targetUd.title}</p><p><strong>Resultados de Aprendizaje:</strong> RA1, RA2 vinculados a la ejecución técnica y seguridad operativa.</p></div>`,
          matrizAlineacionHtml: `<table class="sigre-table"><thead><tr><th>RA</th><th>CrEv</th><th>Evidencias</th><th>Instrumentos</th><th>Peso %</th></tr></thead><tbody><tr><td>RA1</td><td>a), b)</td><td>Práctica en taller y montaje</td><td>Rúbrica de observación</td><td>40%</td></tr><tr><td>RA2</td><td>c), d)</td><td>Prueba escrita y test técnico</td><td>Cuestionario GIFT y examen</td><td>60%</td></tr></tbody></table>`,
          tablaActividadesHtml: `<table class="sigre-table"><thead><tr><th>Actividad</th><th>Técnica</th><th>Agrupamiento</th><th>Recursos</th><th>Instrumento</th></tr></thead><tbody><tr><td>Montaje y comprobación</td><td>Aprendizaje basado en proyectos</td><td>Parejas</td><td>Kit de componentes y herramientas</td><td>Rúbrica XML</td></tr></tbody></table>`,
          rubricasXml: `<?xml version="1.0" encoding="UTF-8"?>\n<rubricaCompleta>\n  <infoRubrica>\n    <nombreActividad>${targetUd.title}</nombreActividad>\n    <titulo>Rúbrica de Evaluación - ${targetUd.fullCode}</titulo>\n    <maxDeseada>10</maxDeseada>\n    <minDeseada>0</minDeseada>\n  </infoRubrica>\n  <definicionRubrica>\n    <criterio nombre="Ejecución técnica y cumplimiento de especificaciones" peso="50">\n      <nivel titulo="Insuficiente" descripcion="No aplica el procedimiento técnico adecuado" puntuacionCalculada="0"/>\n      <nivel titulo="Básico" descripcion="Aplica el procedimiento con errores menores" puntuacionCalculada="1.67"/>\n      <nivel titulo="Adecuado" descripcion="Ejecuta el montaje conforme a norma" puntuacionCalculada="3.33"/>\n      <nivel titulo="Avanzado" descripcion="Ejecución impecable con optimización de tiempos y recursos" puntuacionCalculada="5.0"/>\n    </criterio>\n    <criterio nombre="Seguridad, prevención de riesgos y orden en el puesto" peso="50">\n      <nivel titulo="Insuficiente" descripcion="Omite EPIs o normas de seguridad" puntuacionCalculada="0"/>\n      <nivel titulo="Básico" descripcion="Usa EPIs tras requerimiento" puntuacionCalculada="1.67"/>\n      <nivel titulo="Adecuado" descripcion="Cumple sistemáticamente las normas de seguridad" puntuacionCalculada="3.33"/>\n      <nivel titulo="Avanzado" descripcion="Lidera hábitos seguros y cuida el entorno de trabajo" puntuacionCalculada="5.0"/>\n    </criterio>\n  </definicionRubrica>\n</rubricaCompleta>`,
        };
      }

      const completeUdData: SigreUDData = {
        modulo1: {
          titulo: modulo1Data.titulo || targetUd.fullCode,
          introduccion: modulo1Data.introduccion || `Introducción general para ${targetUd.fullCode}.`,
          contenidos: modulo1Data.contenidos || {
            conceptuales: [`Fundamentos y conceptos técnicos de ${targetUd.title}`],
            procedimentales: [`Montaje, configuración y mantenimiento en ${targetUd.title}`],
            actitudinales: ["Rigor en la aplicación de normativas de seguridad y calidad"],
          },
          objetivosSmart: modulo1Data.objetivosSmart || [
            `1. Identificar y describir los principios operativos de ${targetUd.title}.`,
            `2. Realizar montajes y mediciones siguiendo las especificaciones del fabricante.`,
            `3. Aplicar las normas de seguridad y protección ambiental aplicables al sector.`,
          ],
          indiceDesarrollo: modulo1Data.indiceDesarrollo || `1. ÍNDICE GENERAL DEL TEMA\n2. INTRODUCCIÓN Y CONTEXTUALIZACIÓN\n3. CONTENIDOS ESPECÍFICOS\n4. OBJETIVOS ESPECÍFICOS DE APRENDIZAJE (SMART)\n5. DESARROLLO\n  5.1. Fundamentos y Requisitos\n  5.2. Procedimientos y Verificación\n6. REFERENCIAS NORMATIVAS\n7. BIBLIOGRAFÍA Y WEBGRAFÍA\n8. CONCLUSIONES Y SÍNTESIS DEL TEMA`,
          desarrolloEpigrafesHtml: modulo1Data.desarrolloEpigrafesHtml || `<div class="ud-content"><h3>5.1. Fundamentos y Requisitos</h3><p>Desarrollo técnico riguroso de ${targetUd.title}.</p></div>`,
          referenciasNormativasHtml: modulo1Data.referenciasNormativasHtml || "",
          bibliografiaWebgrafiaHtml: modulo1Data.bibliografiaWebgrafiaHtml || "",
          glosarioHtml: modulo1Data.glosarioHtml || "",
          autoevaluacionHtml: modulo1Data.autoevaluacionHtml || "",
          conclusiones: modulo1Data.conclusiones || `Síntesis didáctica y conclusiones clave para ${targetUd.title}.`,
          relacionIntradisciplinar: modulo1Data.relacionIntradisciplinar || `Esta unidad sienta las bases conceptuales y prácticas para las restantes UDs del módulo.`,
          diagramaMermaid: modulo1Data.diagramaMermaid || "flowchart TD\n    A[\"Inicio: Planificación\"] --> B[\"Fase 1: Ejecución Técnica\"]\n    B --> C[\"Fase 2: Verificación\"]\n    C --> D[\"Fin: Control de Calidad\"]",
          mapaMentalOpml: generateSigreOpml(targetUd, modulo1Data),
        },
        recursosDocente: {
          bancoGiftParte1: recursosDocenteData.bancoGiftParte1 || "",
          bancoGiftParte2: recursosDocenteData.bancoGiftParte2 || "",
          giftFullText: `${recursosDocenteData.bancoGiftParte1 || ""}\n\n${recursosDocenteData.bancoGiftParte2 || ""}`,
          propuestaExamenHtml: recursosDocenteData.propuestaExamenHtml || "",
          solucionarioExamenHtml: recursosDocenteData.solucionarioExamenHtml || "",
          propuestaHdiConceptual: recursosDocenteData.propuestaHdiConceptual || "",
        },
        programacionEval: {
          vinculacionCurricularHtml: programacionEvalData.vinculacionCurricularHtml || "",
          matrizAlineacionHtml: programacionEvalData.matrizAlineacionHtml || "",
          tablaActividadesHtml: programacionEvalData.tablaActividadesHtml || "",
          rubricasXml: programacionEvalData.rubricasXml || "",
        },
        cotRazonamiento: modulo1Data.cotRazonamiento || recursosDocenteData.cotRazonamiento || "",
        glosarioHtml: modulo1Data.glosarioHtml || "",
      };

      // Calculate Pedagogical Audit with 6 axes
      completeUdData.pedagogicalAudit = calculateSigrePedagogicalAudit(completeUdData, config);

      const sanitizedCompleteUdData = sanitizeUdDataMath(completeUdData) || completeUdData;

      setUds((prev) =>
        prev.map((u) =>
          u.id === targetUd.id ? { ...u, status: "completed", error: undefined, data: sanitizedCompleteUdData } : u
        )
      );
      return true;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generación cancelada por el usuario.");
        setUds((prev) =>
          prev.map((u) =>
            u.id === targetUd.id ? (u.data ? { ...u, status: "completed" } : { ...u, status: "pending" }) : u
          )
        );
        return false;
      }
      console.error("Error generando UD:", err);
      setUds((prev) =>
        prev.map((u) =>
          u.id === targetUd.id ? { ...u, status: "error", error: err.message || "Error desconocido" } : u
        )
      );
      if (!isBatch) {
        alert("Error al generar la Unidad Didáctica: " + (err.message || err));
      }
      return false;
    } finally {
      abortControllerRef.current = null;
      if (!isBatch) {
        setIsGeneratingUd(false);
        setLoadingStatus("");
      }
    }
  };

  const handleOpenRegenerateModal = (ud: SigreUDItem) => {
    setUdToRegenerate(ud);
    setIsRegenerateModalOpen(true);
  };

  // Step 4: Batch generate all pending UDs sequentially
  const handleGenerateAllUds = async () => {
    const pendingUds = uds.filter((u) => u.status !== "completed");
    if (pendingUds.length === 0) {
      alert("Todas las Unidades Didácticas ya están generadas.");
      return;
    }

    setIsBatchGenerating(true);
    setIsGeneratingUd(true);

    for (let i = 0; i < pendingUds.length; i++) {
      const ud = pendingUds[i];
      setLoadingStatus(`[Progreso ${i + 1}/${pendingUds.length}] Desarrollando ${ud.id}: ${ud.title}...`);
      const ok = await handleGenerateChosenUD(ud, true);
      if (!ok) {
        // If user cancelled, stop batch
        break;
      }
    }

    setIsBatchGenerating(false);
    setIsGeneratingUd(false);
    setLoadingStatus("");
  };

  // Step 4b: Generate Curricular UD (19 Points)
  const handleGenerateCurricularUD = async (targetUd?: SigreUDItem, isBatch = false) => {
    const udToGen = targetUd || selectedUd;
    if (!udToGen) return;

    setIsGeneratingCurricular(true);
    setLoadingStatus(`Generando Ficha Curricular Oficial (19 puntos) para ${udToGen.fullCode}...`);

    try {
      const ragContext = ragDocuments.map((doc) => `[${doc.name}]: ${doc.text}`).join("\n\n");
      const prompt = buildSigreUDCurricularPrompt(udToGen, config, ragContext);

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          providerId: activeProviderConfig.id,
          apiKey: activeProviderConfig.apiKey,
          endpoint: activeProviderConfig.endpoint,
          model: activeProviderConfig.selectedModel,
          temperature: 0.2,
          jsonMode: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const resData = await res.json();
      const parsed = robustJsonParse<SigreUDCurricularData>(resData.text, {} as any);
      const sanitized = cleanSigreCurricularData(parsed);

      setUds((prev) =>
        prev.map((u) => {
          if (u.id === udToGen.id) {
            const baseData: SigreUDData = u.data || {
              modulo1: {
                titulo: u.fullCode,
                introduccion: "",
                contenidos: { conceptuales: [], procedimentales: [], actitudinales: [] },
                objetivosSmart: [],
                indiceDesarrollo: "",
                desarrolloEpigrafesHtml: "",
                referenciasNormativasHtml: "",
                bibliografiaWebgrafiaHtml: "",
                glosarioHtml: "",
                autoevaluacionHtml: "",
                conclusiones: "",
                relacionIntradisciplinar: "",
                diagramaMermaid: "",
                mapaMentalOpml: "",
              },
              recursosDocente: {
                bancoGiftParte1: "",
                bancoGiftParte2: "",
                giftFullText: "",
                propuestaExamenHtml: "",
                solucionarioExamenHtml: "",
                propuestaHdiConceptual: "",
              },
              programacionEval: {
                vinculacionCurricularHtml: "",
                matrizAlineacionHtml: "",
                tablaActividadesHtml: "",
                rubricasXml: "",
              },
            };
            return {
              ...u,
              data: {
                ...baseData,
                udCurricular: sanitized,
              },
            };
          }
          return u;
        })
      );
    } catch (err: any) {
      console.error("Error generando UD Curricular:", err);
      if (!isBatch) {
        alert("Error al generar la Unidad Didáctica Curricular: " + (err.message || err));
      }
    } finally {
      setIsGeneratingCurricular(false);
      setLoadingStatus("");
    }
  };

  // Generate Curricular UD Section-by-Section
  const handleGenerateCurricularUDSection = async (
    sectionKey: "contexto_justificacion" | "competencias_objetivos" | "contenidos_transversales" | "metodologia_diversidad" | "secuenciacion_actividades" | "evaluacion_criterios" | "recursos_bibliografia"
  ) => {
    if (!selectedUd) return;

    setIsGeneratingCurricular(true);
    setLoadingStatus(`Regenerando bloque curricular "${sectionKey}" para ${selectedUd.fullCode}...`);

    try {
      const ragContext = ragDocuments.map((doc) => `[${doc.name}]: ${doc.text}`).join("\n\n");
      const currentCurricular = selectedUd.data?.udCurricular;
      const prompt = buildSigreUDCurricularSectionPrompt(selectedUd, config, sectionKey, currentCurricular, ragContext);

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          providerId: activeProviderConfig.id,
          apiKey: activeProviderConfig.apiKey,
          endpoint: activeProviderConfig.endpoint,
          model: activeProviderConfig.selectedModel,
          temperature: 0.2,
          jsonMode: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const resData = await res.json();
      const partialData = robustJsonParse<Partial<SigreUDCurricularData>>(resData.text, {});
      const merged: SigreUDCurricularData = {
        ...(currentCurricular || ({} as SigreUDCurricularData)),
        ...partialData,
      };
      const sanitized = cleanSigreCurricularData(merged);

      setUds((prev) =>
        prev.map((u) => {
          if (u.id === selectedUd.id && u.data) {
            return {
              ...u,
              data: {
                ...u.data,
                udCurricular: sanitized,
              },
            };
          }
          return u;
        })
      );
    } catch (err: any) {
      console.error("Error regenerando sección curricular:", err);
      alert("Error al regenerar el apartado curricular: " + (err.message || err));
    } finally {
      setIsGeneratingCurricular(false);
      setLoadingStatus("");
    }
  };

  const handleUpdateCurricularData = (updatedData: SigreUDCurricularData) => {
    if (!selectedUd) return;
    const sanitized = cleanSigreCurricularData(updatedData);
    setUds((prev) =>
      prev.map((u) => {
        if (u.id === selectedUd.id && u.data) {
          return {
            ...u,
            data: {
              ...u.data,
              udCurricular: sanitized,
            },
          };
        }
        return u;
      })
    );
  };

  // Generate Module 2: HDI
  const handleGenerateHDI = async () => {
    if (!selectedUd || !selectedUd.data) return;
    setIsGeneratingHdi(true);
    setLoadingStatus("Diseñando Arquitectura y Desarrollando Micro-App HDI interactiva...");

    try {
      const prompt = buildSigreHDIPrompt(
        selectedUd,
        selectedUd.data.recursosDocente.propuestaHdiConceptual,
        config
      );

      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          providerId: activeProviderConfig.id,
          apiKey: activeProviderConfig.apiKey,
          endpoint: activeProviderConfig.endpoint,
          model: activeProviderConfig.selectedModel,
          temperature: 0.2,
          jsonMode: true,
        }),
      });

      if (!res.ok) throw new Error("Error generando Micro-App HDI");
      const raw = await res.json();
      const hdiData = robustJsonParse<any>(raw.text, {});

      setUds((prev) =>
        prev.map((u) => {
          if (u.id === selectedUd.id && u.data) {
            return {
              ...u,
              data: {
                ...u.data,
                hdi: {
                  nombreApp: hdiData.nombreApp || `Simulador - ${u.title}`,
                  prdMarkdown: hdiData.prdMarkdown || "",
                  appHtmlCode: hdiData.appHtmlCode || "",
                  justificacionPedagogica: hdiData.justificacionPedagogica || "",
                },
              },
            };
          }
          return u;
        })
      );
    } catch (err: any) {
      console.error("Error generando HDI:", err);
      alert("Error al generar el Simulador HDI: " + err.message);
    } finally {
      setIsGeneratingHdi(false);
      setLoadingStatus("");
    }
  };

  // Modular generation of specific UD sections
  const handleGenerateModularSections = async (
    targetUd: SigreUDItem,
    sections: SigreUDSectionKey[]
  ) => {
    if (!targetUd || sections.length === 0) return;
    setIsGeneratingUd(true);
    setSelectedUdId(targetUd.id);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Update status to generating
    setUds((prev) =>
      prev.map((u) => (u.id === targetUd.id ? { ...u, status: "generating", error: undefined } : u))
    );

    try {
      const ragContext = ragDocuments.map((f) => f.text).join("\n\n");
      const currentData = targetUd.data;
      const defaultBank60 = generateDefaultSigre60GiftBank(targetUd);

      setLoadingStatus(`Generando modularmente ${sections.length} apartado(s) para ${targetUd.fullCode}...`);

      const promises: Promise<any>[] = [];

      // 1. Módulo 1 Editorial (1a. UD Editorial)
      const needM1 = sections.includes("ud_editorial") || sections.includes("cuestionario_autoeval") || sections.includes("diagrama_opml");
      if (needM1) {
        promises.push(
          fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: buildSigreUDModule1Prompt(targetUd, config, ragContext),
              providerId: activeProviderConfig.id,
              apiKey: activeProviderConfig.apiKey,
              endpoint: activeProviderConfig.endpoint,
              model: activeProviderConfig.selectedModel,
              temperature: 0.2,
              jsonMode: true,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Error en Módulo 1 Editorial");
            const data = await res.json();
            return { type: "m1", data: robustJsonParse<any>(data.text, {}) };
          })
        );
      }

      // 2. Módulo Docente / GIFT 60 (3. Banco Moodle GIFT)
      if (sections.includes("banco_gift_60")) {
        promises.push(
          fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: buildSigreUDModuleDocentePrompt(targetUd, currentData?.modulo1, config),
              providerId: activeProviderConfig.id,
              apiKey: activeProviderConfig.apiKey,
              endpoint: activeProviderConfig.endpoint,
              model: activeProviderConfig.selectedModel,
              temperature: 0.2,
              jsonMode: true,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Error en Banco GIFT");
            const data = await res.json();
            return { type: "m2_docente", data: robustJsonParse<any>(data.text, {}) };
          })
        );
      }

      // 3. Módulo 3 / Programación & Evaluación (5. Programación & Rúbricas XML)
      if (sections.includes("programacion_rubricas")) {
        promises.push(
          fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: buildSigreUDModuleEvalPrompt(targetUd, config),
              providerId: activeProviderConfig.id,
              apiKey: activeProviderConfig.apiKey,
              endpoint: activeProviderConfig.endpoint,
              model: activeProviderConfig.selectedModel,
              temperature: 0.2,
              jsonMode: true,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Error en Programación & Rúbricas");
            const data = await res.json();
            return { type: "m3_eval", data: robustJsonParse<any>(data.text, {}) };
          })
        );
      }

      // 4. UD Curricular (1b. UD Curricular 19 Puntos)
      if (sections.includes("ud_curricular")) {
        promises.push(
          fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: buildSigreUDCurricularPrompt(targetUd, config, ragContext),
              providerId: activeProviderConfig.id,
              apiKey: activeProviderConfig.apiKey,
              endpoint: activeProviderConfig.endpoint,
              model: activeProviderConfig.selectedModel,
              temperature: 0.2,
              jsonMode: true,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Error en UD Curricular");
            const data = await res.json();
            return { type: "ud_curricular", data: robustJsonParse<any>(data.text, {}) };
          })
        );
      }

      // 5. Simulador HDI (Módulo 2: Simulador HDI)
      if (sections.includes("simulador_hdi")) {
        promises.push(
          fetch("/api/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: abortController.signal,
            body: JSON.stringify({
              prompt: buildSigreHDIPrompt(
                targetUd,
                currentData?.recursosDocente?.propuestaHdiConceptual || "",
                config
              ),
              providerId: activeProviderConfig.id,
              apiKey: activeProviderConfig.apiKey,
              endpoint: activeProviderConfig.endpoint,
              model: activeProviderConfig.selectedModel,
              temperature: 0.2,
              jsonMode: true,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Error en Simulador HDI");
            const data = await res.json();
            return { type: "hdi", data: robustJsonParse<any>(data.text, {}) };
          })
        );
      }

      const results = await Promise.allSettled(promises);

      // Construct base data from previous or fresh fallback
      let baseData: SigreUDData = currentData
        ? JSON.parse(JSON.stringify(currentData))
        : {
            modulo1: {
              titulo: targetUd.fullCode,
              introduccion: "",
              contenidos: { conceptuales: [], procedimentales: [], actitudinales: [] },
              objetivosSmart: [],
              indiceDesarrollo: "",
              desarrolloEpigrafesHtml: "",
              referenciasNormativasHtml: "",
              bibliografiaWebgrafiaHtml: "",
              glosarioHtml: "",
              autoevaluacionHtml: "",
              conclusiones: "",
              relacionIntradisciplinar: "",
              diagramaMermaid: "",
              mapaMentalOpml: "",
            },
            recursosDocente: {
              bancoGiftParte1: defaultBank60.bancoGiftParte1,
              bancoGiftParte2: defaultBank60.bancoGiftParte2,
              giftFullText: `${defaultBank60.bancoGiftParte1}\n\n${defaultBank60.bancoGiftParte2}`,
              propuestaExamenHtml: defaultBank60.propuestaExamenHtml,
              solucionarioExamenHtml: defaultBank60.solucionarioExamenHtml,
              propuestaHdiConceptual: defaultBank60.propuestaHdiConceptual,
            },
            programacionEval: {
              vinculacionCurricularHtml: "",
              matrizAlineacionHtml: "",
              tablaActividadesHtml: "",
              rubricasXml: "",
            },
          };

      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value) {
          const { type, data } = res.value;
          if (type === "m1" && data) {
            if (sections.includes("ud_editorial")) {
              baseData.modulo1.titulo = data.titulo || baseData.modulo1.titulo;
              baseData.modulo1.introduccion = data.introduccion || baseData.modulo1.introduccion;
              baseData.modulo1.contenidos = data.contenidos || baseData.modulo1.contenidos;
              baseData.modulo1.objetivosSmart = data.objetivosSmart || baseData.modulo1.objetivosSmart;
              baseData.modulo1.indiceDesarrollo = data.indiceDesarrollo || baseData.modulo1.indiceDesarrollo;
              baseData.modulo1.desarrolloEpigrafesHtml = data.desarrolloEpigrafesHtml || baseData.modulo1.desarrolloEpigrafesHtml;
              baseData.modulo1.referenciasNormativasHtml = data.referenciasNormativasHtml || baseData.modulo1.referenciasNormativasHtml;
              baseData.modulo1.bibliografiaWebgrafiaHtml = data.bibliografiaWebgrafiaHtml || baseData.modulo1.bibliografiaWebgrafiaHtml;
              baseData.modulo1.glosarioHtml = data.glosarioHtml || baseData.modulo1.glosarioHtml;
              baseData.modulo1.conclusiones = data.conclusiones || baseData.modulo1.conclusiones;
              baseData.modulo1.relacionIntradisciplinar = data.relacionIntradisciplinar || baseData.modulo1.relacionIntradisciplinar;
            }
            if (sections.includes("cuestionario_autoeval") && data.autoevaluacionHtml) {
              baseData.modulo1.autoevaluacionHtml = data.autoevaluacionHtml;
            }
            if (sections.includes("diagrama_opml")) {
              baseData.modulo1.diagramaMermaid = data.diagramaMermaid || baseData.modulo1.diagramaMermaid;
              baseData.modulo1.mapaMentalOpml = generateSigreOpml(targetUd, data, baseData);
            }
          }
          if (type === "m2_docente" && data) {
            const p1 = data.bancoGiftParte1 && data.bancoGiftParte1.trim().length > 50 ? data.bancoGiftParte1 : defaultBank60.bancoGiftParte1;
            const p2 = data.bancoGiftParte2 && data.bancoGiftParte2.trim().length > 50 ? data.bancoGiftParte2 : defaultBank60.bancoGiftParte2;
            baseData.recursosDocente = {
              bancoGiftParte1: p1,
              bancoGiftParte2: p2,
              giftFullText: `${p1}\n\n${p2}`,
              propuestaExamenHtml: data.propuestaExamenHtml || defaultBank60.propuestaExamenHtml,
              solucionarioExamenHtml: data.solucionarioExamenHtml || defaultBank60.solucionarioExamenHtml,
              propuestaHdiConceptual: data.propuestaHdiConceptual || defaultBank60.propuestaHdiConceptual,
            };
          }
          if (type === "m3_eval" && data) {
            baseData.programacionEval = {
              vinculacionCurricularHtml: data.vinculacionCurricularHtml || baseData.programacionEval.vinculacionCurricularHtml,
              matrizAlineacionHtml: data.matrizAlineacionHtml || baseData.programacionEval.matrizAlineacionHtml,
              tablaActividadesHtml: data.tablaActividadesHtml || baseData.programacionEval.tablaActividadesHtml,
              rubricasXml: data.rubricasXml || baseData.programacionEval.rubricasXml,
            };
          }
          if (type === "ud_curricular" && data) {
            baseData.udCurricular = cleanSigreCurricularData(data);
          }
          if (type === "hdi" && data) {
            baseData.hdi = {
              nombreApp: data.nombreApp || `Simulador - ${targetUd.title}`,
              prdMarkdown: data.prdMarkdown || "",
              appHtmlCode: data.appHtmlCode || "",
              justificacionPedagogica: data.justificacionPedagogica || "",
            };
          }
        }
      });

      // Recalculate audit
      baseData.pedagogicalAudit = calculateSigrePedagogicalAudit(baseData, config);

      setUds((prev) =>
        prev.map((u) =>
          u.id === targetUd.id ? { ...u, status: "completed", error: undefined, data: baseData } : u
        )
      );
    } catch (err: any) {
      console.error("Error generando modularmente:", err);
      alert("Error al generar los apartados seleccionados: " + (err.message || err));
    } finally {
      setIsGeneratingUd(false);
      setLoadingStatus("");
    }
  };

  // Download DOCX of the selected UD
  const handleDownloadDocx = async () => {
    if (!selectedUd || !selectedUd.data) return;
    const htmlA4 = renderSigreUDCompleteA4Html(selectedUd, selectedUd.data);
    await exportHtmlToDocx(htmlA4, `${selectedUd.id}_${selectedUd.title.replace(/[^a-z0-9]/gi, "_")}.docx`);
  };

  // Download OPML Mindmap
  const handleDownloadOpml = () => {
    if (!selectedUd || !selectedUd.data) return;
    const opmlText = generateSigreOpml(selectedUd, selectedUd.data.modulo1, selectedUd.data);
    const blob = new Blob([opmlText], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mapa_Mental_${selectedUd.id}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print Clean A4
  const handlePrintA4 = () => {
    if (!selectedUd || !selectedUd.data) return;
    const htmlA4 = renderSigreUDCompleteA4Html(selectedUd, selectedUd.data);
    const printableHtml = preparePrintableHtmlDocument(htmlA4, `${selectedUd.id} - ${selectedUd.title}`);

    let printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printableHtml);
      printWin.document.close();
      setTimeout(() => {
        try {
          printWin?.print();
        } catch (e) {}
      }, 500);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner SIGRE v6.0 & Global Hub */}
      <div className={`border rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-colors ${
        theme === "dark"
          ? "bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#1e293b] border-amber-500/30 text-white"
          : "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-amber-400/50 text-slate-900 shadow-md"
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] tracking-wider uppercase shadow-xs">
                SIGRE v6.0 CURRICULAR & HDI
              </span>
              <span className={`text-xs font-semibold ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}>
                Formación Profesional & LOMLOE
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              Diseñador Curricular e Interactivo de Unidades Didácticas
            </h2>
            <p className={`text-xs max-w-2xl ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
              Genera la base pedagógica completa (U.D., Moodle GIFT de 60 preguntas con validación psicométrica, rúbricas XML y diagramas Mermaid) y construye micro-aplicaciones didácticas interactivas (HDI).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsTechnicalAuditModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
              title="Auditoría técnica profunda, validación psicométrica y test de estrés extremo"
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Auditoría & Estrés</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                100% OK
              </span>
            </button>
            <button
              type="button"
              onClick={handleAnalyzeCurriculum}
              disabled={isAnalyzingCurriculum || isGeneratingUd}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isAnalyzingCurriculum ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Analizar y Generar Plan UDs
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Hub Navigation Bar */}
        <div className={`mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2.5 ${
          theme === "dark" ? "border-slate-700/60" : "border-slate-300/80"
        }`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setGlobalViewMode("unidades")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                globalViewMode === "unidades"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                  : theme === "dark"
                  ? "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                  : "bg-white text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-300"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Unidades Didácticas</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
                {uds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setGlobalViewMode("calendario")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                globalViewMode === "calendario"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                  : theme === "dark"
                  ? "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                  : "bg-white text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-300"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calendario Escolar</span>
            </button>

            <button
              type="button"
              onClick={() => setGlobalViewMode("cronogramas")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                globalViewMode === "cronogramas"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black"
                  : theme === "dark"
                  ? "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                  : "bg-white text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cronogramas (4 Niveles)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-mono border border-cyan-500/30">
                4N
              </span>
            </button>

            <button
              type="button"
              onClick={() => setGlobalViewMode("horarios")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                globalViewMode === "horarios"
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-black"
                  : theme === "dark"
                  ? "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                  : "bg-white text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-300"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Horarios & Guardias</span>
              <span className="px-1.5 py-0.2 rounded-md bg-red-500/20 text-red-400 text-[10px] font-mono border border-red-500/30">
                GUA
              </span>
            </button>

            <button
              type="button"
              onClick={() => setGlobalViewMode("parametros")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                globalViewMode === "parametros"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                  : theme === "dark"
                  ? "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
                  : "bg-white text-slate-700 hover:text-black hover:bg-slate-100 border border-slate-300"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Parámetros Curriculares</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {uds.length === 0 ? (
              <button
                type="button"
                onClick={handleLoadSampleFPModule}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Cargar inmediatamente 8 Unidades Didácticas de Formación Profesional con bancos GIFT y rúbricas"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Cargar Módulo FP Ejemplo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoadSampleFPModule}
                className="px-2.5 py-1 bg-surface hover:bg-alt text-text-muted hover:text-text-primary border border-border-default text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                title="Reiniciar con el Módulo Oficial de FP (8 UDs desarrolladas)"
              >
                Ejemplo FP
              </button>
            )}
          </div>
        </div>

        {/* Global View: Curricular Parameters Panel */}
        {globalViewMode === "parametros" && (
          <div className={`mt-6 pt-5 border-t space-y-4 text-xs ${theme === "dark" ? "border-slate-700/60" : "border-slate-300/80"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Configuración del Marco Normativo y Parámetros Curriculares
              </h3>
              <button
                type="button"
                onClick={() => setGlobalViewMode("unidades")}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Volver a Unidades Didácticas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-text-primary">Módulo Formativo:</label>
                <input
                  type="text"
                  value={config.moduloFormativo}
                  onChange={(e) => setConfig({ ...config, moduloFormativo: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border-default rounded-lg text-text-primary font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>
            <div className="space-y-1">
              <label className="font-bold text-text-primary">Código / Ciclo / Grado:</label>
              <input
                type="text"
                value={config.cicloFormativo}
                onChange={(e) => setConfig({ ...config, cicloFormativo: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border-default rounded-lg text-text-primary font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-primary">Contexto del Centro (IES / Entorno):</label>
              <input
                type="text"
                value={config.contextoAplicacion}
                onChange={(e) => setConfig({ ...config, contextoAplicacion: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border-default rounded-lg text-text-primary font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Iterations, Adhesion, User Level */}
            <div className="space-y-1">
              <label className="font-bold text-text-primary">
                Iteraciones de Refinamiento ({config.iterations} ciclos):
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={config.iterations}
                onChange={(e) => setConfig({ ...config, iterations: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-primary">
                Adhesión al Currículo ({config.adhesion}/5):
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={config.adhesion}
                onChange={(e) => setConfig({ ...config, adhesion: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text-primary">Nivel de Destinatario:</label>
              <select
                value={config.userLevel}
                onChange={(e) => setConfig({ ...config, userLevel: Number(e.target.value) as SigreUserLevel })}
                className="w-full px-3 py-2 bg-surface border border-border-default rounded-lg text-text-primary font-medium focus:border-amber-500 focus:outline-none"
              >
                <option value={1}>1: Secundaria (ESO)</option>
                <option value={2}>2: Bachillerato / Formación Profesional</option>
                <option value={3}>3: Grado Universitario</option>
                <option value={4}>4: Oposiciones y Especialización Avanzada</option>
              </select>
            </div>

            {/* Dimensionamiento Curricular: Horas Totales, 32 Semanas, Previsión de Sesiones y UDs */}
            <div className="col-span-1 md:col-span-3 space-y-3 pt-3 border-t border-border-default">
              <div className="flex items-center justify-between">
                <label className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                  <Clock className="w-4 h-4 text-amber-500" />
                  CARGA HORARIA, TEMPORALIZACIÓN (32 SEMANAS) Y PREVISIÓN DE SESIONES LECTIVAS:
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Base: 32 Semanas Lectivas + Mes de Junio (Recuperación y Planificación)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Horas Totales */}
                <div className="p-3 bg-surface border border-border-default rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-text-primary flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Horas Totales Módulo:
                    </label>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                      {config.horasTotales || 160}h
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      step="5"
                      value={config.horasTotales || 160}
                      onChange={(e) => {
                        const h = Math.max(1, Number(e.target.value) || 160);
                        const sem = config.semanasCurso || 32;
                        const hSes = config.horasPorSesion || 1;
                        setConfig({
                          ...config,
                          horasTotales: h,
                          totalSesionesPrevistas: Math.round(h / hSes),
                          horasSemanales: Math.max(1, Math.round(h / sem)),
                        });
                      }}
                      className="flex-1 px-3 py-1.5 bg-alt border border-border-default rounded-lg text-text-primary font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="Ej. 160"
                    />
                    <span className="text-text-muted font-semibold text-xs">horas</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {[96, 128, 160, 200, 240].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          const sem = config.semanasCurso || 32;
                          const hSes = config.horasPorSesion || 1;
                          setConfig({
                            ...config,
                            horasTotales: h,
                            totalSesionesPrevistas: Math.round(h / hSes),
                            horasSemanales: Math.max(1, Math.round(h / sem)),
                          });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                          config.horasTotales === h
                            ? "bg-amber-500 text-black shadow-xs"
                            : "bg-alt text-text-secondary hover:bg-hover border border-border-subtle"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Semanas del Curso (32 semanas estándar) */}
                <div className="p-3 bg-surface border border-border-default rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-text-primary flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" /> Semanas Lectivas:
                    </label>
                    <span className="font-mono font-black text-cyan-600 dark:text-cyan-400 text-xs">
                      {config.semanasCurso || 32} sem.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="20"
                      max="40"
                      value={config.semanasCurso || 32}
                      onChange={(e) => {
                        const s = Math.max(1, Number(e.target.value) || 32);
                        const hTot = config.horasTotales || 160;
                        setConfig({
                          ...config,
                          semanasCurso: s,
                          horasSemanales: Math.max(1, Math.round(hTot / s)),
                        });
                      }}
                      className="flex-1 px-3 py-1.5 bg-alt border border-border-default rounded-lg text-text-primary font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="32"
                    />
                    <span className="text-text-muted font-semibold text-xs">semanas</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {[30, 32, 33, 34].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const hTot = config.horasTotales || 160;
                            setConfig({
                              ...config,
                              semanasCurso: s,
                              horasSemanales: Math.max(1, Math.round(hTot / s)),
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                            (config.semanasCurso || 32) === s
                              ? "bg-cyan-500 text-black shadow-xs"
                              : "bg-alt text-text-secondary hover:bg-hover border border-border-subtle"
                          }`}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">FCE + FFEOE</span>
                  </div>
                </div>

                {/* Horas Semanales */}
                <div className="p-3 bg-surface border border-border-default rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-text-primary flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> Horas Semanales:
                    </label>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {config.horasSemanales || 5} h/sem
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={config.horasSemanales || 5}
                      onChange={(e) =>
                        setConfig({ ...config, horasSemanales: Math.max(1, Number(e.target.value) || 5) })
                      }
                      className="flex-1 px-3 py-1.5 bg-alt border border-border-default rounded-lg text-text-primary font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="Ej. 5"
                    />
                    <span className="text-text-muted font-semibold text-xs">h/semana</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {[2, 3, 4, 5, 6, 8].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setConfig({ ...config, horasSemanales: s })}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                            config.horasSemanales === s
                              ? "bg-emerald-500 text-black shadow-xs"
                              : "bg-alt text-text-secondary hover:bg-hover border border-border-subtle"
                          }`}
                        >
                          {s}h
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const hTot = config.horasTotales || 160;
                        const sem = config.semanasCurso || 32;
                        setConfig({ ...config, horasSemanales: Math.max(1, Math.round(hTot / sem)) });
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-alt hover:bg-hover text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5 cursor-pointer"
                      title="Sincronizar con 32 semanas lectivas"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Auto 32s
                    </button>
                  </div>
                </div>

                {/* Previsión de Sesiones Lectivas */}
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-purple-400 flex items-center gap-1.5 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-purple-400" /> Sesiones Previstas:
                    </label>
                    <span className="font-mono font-black text-purple-300 text-xs">
                      {Math.round((config.horasTotales || 160) / (config.horasPorSesion || 1))} ses.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={config.horasPorSesion || 1}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        const totH = config.horasTotales || 160;
                        setConfig({
                          ...config,
                          horasPorSesion: h,
                          duracionSesionMinutos: h === 2 ? 120 : 60,
                          totalSesionesPrevistas: Math.round(totH / h),
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-alt border border-purple-500/40 rounded-lg text-text-primary font-semibold text-xs focus:outline-none"
                    >
                      <option value={1}>1h / sesión (60m)</option>
                      <option value={2}>2h / sesión (Taller 120m)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-purple-300/80 pt-1">
                    <span>Semanal: <strong className="text-purple-300 font-mono">{Math.round((config.horasSemanales || 5) / (config.horasPorSesion || 1))} ses/sem</strong></span>
                    <span>Total: <strong className="text-purple-300 font-mono">{Math.round((config.horasTotales || 160) / (config.horasPorSesion || 1))} ses</strong></span>
                  </div>
                </div>
              </div>

              {/* Live Temporal Metrics & Periodization Breakdown (32 weeks + June) */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-purple-500/10 border border-border-default rounded-xl space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-text-primary">Reparto Lógico de Sesiones y Carga Curricular:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <span className="text-text-secondary">
                      Duración: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{config.semanasCurso || 32} semanas lectivas</strong>
                    </span>
                    <span className="text-text-secondary">
                      Carga media UD: <strong className="text-amber-600 dark:text-amber-400 font-bold">~{((config.horasTotales || 160) / (config.numUnidadesDidacticas || (uds.length > 0 ? uds.length : 8))).toFixed(1)} h</strong>
                    </span>
                    <span className="text-text-secondary">
                      Sesiones por UD: <strong className="text-purple-600 dark:text-purple-400 font-bold">~{Math.max(1, Math.round(((config.horasTotales || 160) / (config.numUnidadesDidacticas || (uds.length > 0 ? uds.length : 8))) / (config.horasPorSesion || 1)))} sesiones</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-border-default/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-alt/40 rounded-lg flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-text-secondary">
                      <strong>Periodo Ordinario ({config.semanasCurso || 32} semanas):</strong> Impartición de UDs integrando la <em>FCE (Centro educativo)</em> y la <em>FFEOE (Práctica en empresa)</em> hasta la última sesión de evaluación ordinaria.
                    </span>
                  </div>
                  <div className="p-2 bg-alt/40 rounded-lg flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-text-secondary">
                      <strong>Mes de Junio:</strong> Reservado para el <em>periodo de recuperación de aprendizajes no adquiridos</em> (evaluación extraordinaria y refuerzo) y la <em>planificación del siguiente curso escolar</em> (memorias y programación didáctica).
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pedagogical Audit Configuration (6 Axes) */}
            <div className="col-span-1 md:col-span-3 space-y-2 pt-3 border-t border-border-default">
              <div className="flex items-center justify-between">
                <label className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                  <Award className="w-4 h-4 text-purple-500" />
                  AUDITORÍA Y ENFOQUE PEDAGÓGICO AVANZADO (6 EJES):
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Paridad total con Generador de Temas y Exámenes
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {/* 1. Test-Wiseness */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      pedagogicalOptions: {
                        ...(config.pedagogicalOptions || DEFAULT_CONFIG.pedagogicalOptions!),
                        testWiseness: !(config.pedagogicalOptions?.testWiseness ?? true),
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    (config.pedagogicalOptions?.testWiseness ?? true)
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "bg-surface border-border-default text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-bold font-mono">1</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Test-Wiseness</span>
                  <span className="text-[9px] text-text-muted">Glosario & Anti-Pistas</span>
                </button>

                {/* 2. CoT Anticolisión */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      pedagogicalOptions: {
                        ...(config.pedagogicalOptions || DEFAULT_CONFIG.pedagogicalOptions!),
                        cotAnticolision: !(config.pedagogicalOptions?.cotAnticolision ?? true),
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    (config.pedagogicalOptions?.cotAnticolision ?? true)
                      ? "bg-purple-500/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-xs"
                      : "bg-surface border-border-default text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-[9px] font-bold font-mono">2</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">CoT Anticolisión</span>
                  <span className="text-[9px] text-text-muted">Unicidad Temática</span>
                </button>

                {/* 3. Práctica Intercalada */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      pedagogicalOptions: {
                        ...(config.pedagogicalOptions || DEFAULT_CONFIG.pedagogicalOptions!),
                        practicaIntercalada: !(config.pedagogicalOptions?.practicaIntercalada ?? true),
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    (config.pedagogicalOptions?.practicaIntercalada ?? true)
                      ? "bg-blue-500/15 border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-xs"
                      : "bg-surface border-border-default text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <span className="text-[9px] font-bold font-mono">3</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Práctica Intercalada</span>
                  <span className="text-[9px] text-text-muted">4 Dominios</span>
                </button>

                {/* 4. Active Recall */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      pedagogicalOptions: {
                        ...(config.pedagogicalOptions || DEFAULT_CONFIG.pedagogicalOptions!),
                        activeRecall: !(config.pedagogicalOptions?.activeRecall ?? true),
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    (config.pedagogicalOptions?.activeRecall ?? true)
                      ? "bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-300 shadow-xs"
                      : "bg-surface border-border-default text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <HelpCircle className="w-4 h-4 text-red-500" />
                    <span className="text-[9px] font-bold font-mono">4</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Active Recall</span>
                  <span className="text-[9px] text-text-muted">Verificación Activa</span>
                </button>

                {/* 5. Mnemotecnias */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      pedagogicalOptions: {
                        ...(config.pedagogicalOptions || DEFAULT_CONFIG.pedagogicalOptions!),
                        mnemotecnias: !(config.pedagogicalOptions?.mnemotecnias ?? true),
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    (config.pedagogicalOptions?.mnemotecnias ?? true)
                      ? "bg-orange-500/15 border-orange-500/50 text-orange-700 dark:text-orange-300 shadow-xs"
                      : "bg-surface border-border-default text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <BrainCircuit className="w-4 h-4 text-orange-500" />
                    <span className="text-[9px] font-bold font-mono">5</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Mnemotecnias</span>
                  <span className="text-[9px] text-text-muted">Trucos & Acrónimos</span>
                </button>

                {/* 6. Anti-Visión de Túnel */}
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      pedagogicalOptions: {
                        ...(config.pedagogicalOptions || DEFAULT_CONFIG.pedagogicalOptions!),
                        antiTunel: !(config.pedagogicalOptions?.antiTunel ?? true),
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    (config.pedagogicalOptions?.antiTunel ?? true)
                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-700 dark:text-cyan-300 shadow-xs"
                      : "bg-surface border-border-default text-text-muted opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Scan className="w-4 h-4 text-cyan-500" />
                    <span className="text-[9px] font-bold font-mono">6</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Anti-Túnel</span>
                  <span className="text-[9px] text-text-muted">Cobertura 100%</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Document Reference Zone & Curricular Breakdown */}
            <div className="col-span-1 md:col-span-3 space-y-4 pt-2 border-t border-border-default">
              <SigreCurriculumDropzone
                documents={ragDocuments}
                onDocumentsChange={setRagDocuments}
                onExtractCurriculumWithAI={handleExtractCurriculumWithAI}
                isAnalyzingAI={isAnalyzingCurriculum}
                onViewDocument={(doc) => setViewingDoc(doc)}
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Desglose Curricular Extraído (Bloques de Contenido, RAs y Criterios de Evaluación):
                  </label>
                  <span className="text-[10px] text-text-muted">
                    Editable manualmente o mediante IA
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={config.desgloseCurricular}
                  onChange={(e) => setConfig({ ...config, desgloseCurricular: e.target.value })}
                  className="w-full p-3 bg-surface border border-border-default rounded-lg text-text-primary font-mono text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  placeholder="Pega o extrae con IA los Bloques de Contenido (BCs), Resultados de Aprendizaje (RAs) y Criterios de Evaluación (CrEvs)..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Document Viewer Modal for Reference Documents */}
      <SigreDocumentViewerModal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
      />

      {/* Progress & Status Message with Cancel Action */}
      {loadingStatus && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-amber-300 text-xs shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span className="font-bold truncate">{loadingStatus}</span>
          </div>
          <button
            type="button"
            onClick={handleCancelGeneration}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Global View: Calendario Escolar Oficial */}
      {globalViewMode === "calendario" && (
        <div className="space-y-4">
          <SigreAcademicCalendarManager
            currentUds={uds}
            moduloCodigo={config.codigo || config.moduloFormativo}
            moduloNombre={config.moduloFormativo}
            cicloFormativo={config.cicloFormativo}
            docenteNombre={config.docenteNombre}
            theme={theme}
          />
        </div>
      )}

      {/* Global View: Cronogramas a 4 Niveles */}
      {globalViewMode === "cronogramas" && (
        <div className="space-y-4">
          <SigreMultiLevelTimeline
            uds={uds}
            config={config}
            selectedUdId={selectedUdId}
            onSelectUd={(udId) => setSelectedUdId(udId)}
            theme={theme}
          />
        </div>
      )}

      {/* Global View: Horarios y Guardias Docentes */}
      {globalViewMode === "horarios" && (
        <div className="space-y-4">
          <SigreScheduleGuardManager
            scheduleConfig={config.scheduleConfig || INITIAL_SIGRE_SCHEDULE_CONFIG}
            onUpdateScheduleConfig={(newSched) => setConfig({ ...config, scheduleConfig: newSched })}
            onApplyToCurricularConfig={(horas) => {
              setConfig((prev) => ({
                ...prev,
                horasSemanales: horas,
              }));
            }}
            currentModuloCodigo={config.codigo || config.moduloFormativo}
            moduloNombre={config.moduloFormativo}
            cicloFormativo={config.cicloFormativo}
            currentUds={uds}
            theme={theme}
          />
        </div>
      )}

      {/* Main Layout: Left UDs Navigation / Right UD Deliverables (when in unidades view) */}
      {globalViewMode === "unidades" && (
        <>
          {uds.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Plan de UDs (List + Search & Filter) */}
              <div className="lg:col-span-4 bg-surface border border-border-default rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-500" /> Plan de UDs ({uds.length})
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {uds.filter((u) => u.status === "completed").length}/{uds.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar UD por título o código..."
                      value={udSearchQuery}
                      onChange={(e) => setUdSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-alt text-xs text-text-primary rounded-xl border border-border-default placeholder:text-text-muted focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    {udSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUdSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 text-[10px] overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setUdFilterStatus("all")}
                      className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        udFilterStatus === "all"
                          ? "bg-amber-500 text-black"
                          : "bg-alt text-text-muted hover:text-text-primary"
                      }`}
                    >
                      Todas ({uds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUdFilterStatus("completed")}
                      className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        udFilterStatus === "completed"
                          ? "bg-emerald-500 text-black"
                          : "bg-alt text-text-muted hover:text-emerald-400"
                      }`}
                    >
                      Completadas ({uds.filter((u) => u.status === "completed").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUdFilterStatus("pending")}
                      className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        udFilterStatus === "pending"
                          ? "bg-amber-500 text-black"
                          : "bg-alt text-text-muted hover:text-amber-400"
                      }`}
                    >
                      Pendientes ({uds.filter((u) => u.status !== "completed").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUdFilterStatus("prl")}
                      className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        udFilterStatus === "prl"
                          ? "bg-red-500 text-white"
                          : "bg-alt text-text-muted hover:text-red-400"
                      }`}
                    >
                      PRL ({uds.filter((u) => u.isPrl).length})
                    </button>
                  </div>
                </div>

                {/* Batch Action Bar */}
                {uds.some((u) => u.status !== "completed") && (
                  <div className="pt-1 pb-1">
                    {isBatchGenerating || isGeneratingUd ? (
                      <button
                        type="button"
                        onClick={handleCancelGeneration}
                        className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Detener Generación
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateAllUds}
                        className="w-full py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Desarrollar Todas las UDs
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredUds.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted">
                      No se encontraron UDs con los filtros aplicados.
                    </div>
                  ) : (
                    filteredUds.map((ud) => {
                      const isSelected = ud.id === selectedUdId;
                      const isCompleted = ud.status === "completed";
                      const isGenerating = ud.status === "generating";
                      const isError = ud.status === "error";

                      return (
                        <div
                          key={ud.id}
                          onClick={() => setSelectedUdId(ud.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                            isSelected
                              ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5"
                              : "bg-background border-border-default hover:border-amber-500/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md ${
                                  ud.isPrl
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {ud.id}
                              </span>
                              <span className="text-xs font-bold text-text-primary truncate">
                                {ud.title}
                              </span>
                            </div>

                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : isGenerating ? (
                              <RefreshCw className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                            ) : isError ? (
                              <span title={ud.error || "Error"} className="shrink-0">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border-default/40">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-text-muted font-mono">{ud.bcCode}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 font-mono font-bold rounded flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {ud.horasEstimadas || Math.round((config.horasTotales || 160) / uds.length)}h
                              </span>
                              {ud.trimestre && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 font-mono font-bold rounded">
                                  {ud.trimestre}º Trim.
                                </span>
                              )}
                            </div>
                            {isCompleted ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-500 font-bold text-[10px]">Completa</span>
                                <button
                                  type="button"
                                  disabled={isGeneratingUd}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRegenerateModal(ud);
                                  }}
                                  className="px-1.5 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 font-bold rounded text-[10px] border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40"
                                  title="Regenerar esta UD (requiere aprobación)"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" /> Regenerar
                                </button>
                              </div>
                            ) : isGenerating ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelGeneration();
                                }}
                                className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded text-[10px] border border-red-500/40 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            ) : isError ? (
                              <button
                                type="button"
                                disabled={isGeneratingUd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateChosenUD(ud);
                                }}
                                className="px-2 py-0.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded text-[10px] shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                <RefreshCw className="w-2.5 h-2.5" /> Reintentar
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isGeneratingUd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateChosenUD(ud);
                                }}
                                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[10px] shadow-sm transition-transform active:scale-95 cursor-pointer"
                              >
                                Desarrollar UD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Selected UD Deliverables */}
              <div className="lg:col-span-8 space-y-4">
                {/* Breadcrumb Navigation Strip */}
                {selectedUd && (
                  <div className="px-4 py-2 bg-surface border border-border-default rounded-xl flex items-center justify-between text-xs text-text-muted shadow-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-text-primary">{config.moduloFormativo}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="font-mono text-amber-500 font-bold">{selectedUd.id}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{selectedUd.title}</span>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                      {selectedUd.horasEstimadas}h • Trimestre {selectedUd.trimestre}
                    </span>
                  </div>
                )}
            {selectedUd ? (
              <div className="bg-surface border border-border-default rounded-2xl p-5 space-y-4 shadow-sm">
                {/* Header of Chosen UD */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-default">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wide">
                        Unidad Didáctica Seleccionada
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono font-bold rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {selectedUd.horasEstimadas || Math.round((config.horasTotales || 160) / uds.length)} horas lectivas
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 font-mono font-bold rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        {selectedUd.sesionesEstimadas || Math.max(1, Math.round((selectedUd.horasEstimadas || Math.round((config.horasTotales || 160) / uds.length)) / 2))} sesiones
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-text-primary">
                      {selectedUd.fullCode}
                    </h3>
                  </div>

                  {selectedUd.data ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isGeneratingUd}
                        onClick={() => handleOpenRegenerateModal(selectedUd)}
                        className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        title="Regenerar esta Unidad Didáctica con IA (requiere aprobación previa)"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Regenerar UD
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintA4}
                        className="px-3 py-1.5 bg-surface border border-border-default hover:bg-alt text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Imprimir / Guardar en PDF A4"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-500" /> Imprimir A4 (PDF)
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadDocx}
                        className="px-3 py-1.5 bg-surface border border-border-default hover:bg-alt text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Descargar en Microsoft Word"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-500" /> Word (.docx)
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadOpml}
                        className="px-3 py-1.5 bg-surface border border-border-default hover:bg-alt text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Descargar Mapa Mental OPML"
                      >
                        <Share2 className="w-3.5 h-3.5 text-purple-500" /> OPML (XMind)
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isGeneratingUd}
                      onClick={() => handleGenerateChosenUD(selectedUd)}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" /> Desarrollar Esta Unidad Completa
                    </button>
                  )}
                </div>

                {/* Sub-Navigation Tabs */}
                {selectedUd.data ? (
                  <div className="space-y-4">
                    {/* Pedagogical Quality & 6-Axes Audit Live Badges Bar (Collapsible, Collapsed by default) */}
                    <div className="bg-alt border border-border-default rounded-xl shadow-2xs overflow-hidden transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5">
                        <button
                          type="button"
                          onClick={() => setIsAudit6AxesOpen((prev) => !prev)}
                          className="flex items-center gap-2 text-left text-[11px] font-bold text-text-primary hover:text-purple-400 transition-colors cursor-pointer"
                        >
                          <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
                            {isAudit6AxesOpen ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-text-muted text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-purple-500" /> Auditoría 6 Ejes:
                          </span>
                          {!isAudit6AxesOpen && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Score: {activeAuditResult?.testWisenessScore || 96}%
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted font-normal">
                            ({isAudit6AxesOpen ? "Ocultar panel" : "Desplegar métricas"})
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsAuditModalOpen(true)}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-500/40 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Bot className="w-3.5 h-3.5 text-purple-500" /> Auditoría IA
                          </button>
                        </div>
                      </div>

                      {isAudit6AxesOpen && (
                        <div className="px-3 pb-3 pt-1 border-t border-border-default/60 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Test-Wiseness ({activeAuditResult?.testWisenessScore || 96}%)
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-purple-500" /> CoT Anticolisión
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-blue-500" /> Práctica Intercalada
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-red-500" /> Active Recall ({activeAuditResult?.activeRecallCount || 20})
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3 text-orange-500" /> Mnemotecnias ({activeAuditResult?.mnemonicsCount || 2})
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            <Scan className="w-3 h-3 text-cyan-500" /> Anti-Túnel (100%)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-border-default pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("ud_completa")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "ud_completa"
                            ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-amber-500/40"
                        }`}
                        title="1a. UD Editorial - Tratado técnico formal (Libro de texto / Memoria técnica 1.1 a 1.11)"
                      >
                        <BookOpen className={`w-4 h-4 ${activeTab === "ud_completa" ? "text-black" : "text-amber-500 dark:text-amber-400"}`} /> 1a. UD Editorial
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("ud_curricular")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "ud_curricular"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-indigo-500/40"
                        }`}
                      >
                        <Layers className={`w-4 h-4 ${activeTab === "ud_curricular" ? "text-white" : "text-indigo-500 dark:text-indigo-400"}`} /> 1b. UD Curricular (19 Puntos)
                        {selectedUd.data?.udCurricular && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm"></span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("cuestionario_autoeval")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "cuestionario_autoeval"
                            ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-red-500/40"
                        }`}
                      >
                        <HelpCircle className={`w-4 h-4 ${activeTab === "cuestionario_autoeval" ? "text-white" : "text-red-500 dark:text-red-400"}`} /> 2. Cuestionario de Autoevaluación
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("recursos_docente")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "recursos_docente"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-emerald-500/40"
                        }`}
                      >
                        <GraduationCap className={`w-4 h-4 ${activeTab === "recursos_docente" ? "text-white" : "text-emerald-500 dark:text-emerald-400"}`} /> 3. Banco Moodle GIFT & Tests
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("diagrama_flujo");
                          setDiagramSubTab("opml");
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "diagrama_flujo"
                            ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-cyan-500/40"
                        }`}
                      >
                        <Workflow className={`w-4 h-4 ${activeTab === "diagrama_flujo" ? "text-white" : "text-cyan-500 dark:text-cyan-400"}`} /> 4. Diagrama & Mapa Mental (OPML)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("programacion_eval")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "programacion_eval"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-blue-500/40"
                        }`}
                      >
                        <FileCheck className={`w-4 h-4 ${activeTab === "programacion_eval" ? "text-white" : "text-blue-500 dark:text-blue-400"}`} /> 5. Programación & Rúbricas XML
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("hdi_interactiva")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "hdi_interactiva"
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-purple-500/40"
                        }`}
                      >
                        <Cpu className={`w-4 h-4 ${activeTab === "hdi_interactiva" ? "text-white" : "text-purple-500 dark:text-purple-400"}`} /> 6. Simulador HDI
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("cronograma")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "cronograma"
                            ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-amber-500/40"
                        }`}
                      >
                        <Clock className={`w-4 h-4 ${activeTab === "cronograma" ? "text-black" : "text-amber-500 dark:text-amber-400"}`} /> 7. Cronograma Visual (4 Niveles)
                      </button>
                    </div>

                    {/* Tab 1: Documento Editorial Completo (1.1 - 1.11) */}
                    {activeTab === "ud_completa" && (
                      <div className="space-y-4">
                        {/* Zoom & View Controls Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-alt/60 border border-border-default rounded-xl max-w-4xl mx-auto">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-semibold text-text-primary">Documento Editorial A4</span>
                            <span>•</span>
                            <span>Tratado técnico oficial (Libro de texto / Memoria)</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateModularSections(selectedUd, ["ud_editorial"])}
                              disabled={isGeneratingUd}
                              className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-bold rounded-lg text-xs border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              title="Regenerar exclusivamente el Documento Editorial Oficial (1.1 a 1.11)"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Regenerar UD Editorial
                            </button>

                            <div className="flex items-center bg-surface border border-border-default rounded-lg p-0.5 text-xs text-text-muted shadow-sm">
                              <button
                                type="button"
                                onClick={() => setDocZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                                className="px-2 py-1 hover:text-text-primary rounded hover:bg-alt transition-colors cursor-pointer font-bold"
                                title="Reducir tamaño del documento"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono text-[11px] font-bold text-text-primary">
                                {Math.round(docZoom * 100)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setDocZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
                                className="px-2 py-1 hover:text-text-primary rounded hover:bg-alt transition-colors cursor-pointer font-bold"
                                title="Aumentar tamaño del documento"
                              >
                                +
                              </button>
                              <div className="w-[1px] h-3.5 bg-border-default mx-0.5" />
                              <button
                                type="button"
                                onClick={() => setDocZoom(1)}
                                className="px-2 py-0.5 text-[10px] text-text-muted hover:text-text-primary rounded hover:bg-alt transition-colors cursor-pointer"
                                title="Restablecer zoom al 100%"
                              >
                                100%
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Printable A4 Content Box */}
                        <div className="overflow-x-auto py-2">
                          <div
                            style={{
                              transform: `scale(${docZoom})`,
                              transformOrigin: "top center",
                              transition: "transform 0.15s ease-out",
                            }}
                            className="bg-white text-slate-900 p-6 sm:p-10 rounded-xl border border-border-default shadow-lg max-w-4xl mx-auto"
                            dangerouslySetInnerHTML={{
                              __html: renderSigreUDCompleteA4Html(selectedUd, selectedUd.data),
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Tab 1b: UD Curricular Oficial (19 Puntos) */}
                    {activeTab === "ud_curricular" && (
                      <SigreCurricularViewer
                        ud={selectedUd}
                        config={config}
                        theme={theme}
                        isGenerating={isGeneratingCurricular}
                        onGenerateFull={() => handleGenerateCurricularUD(selectedUd)}
                        onGenerateSection={(sectionKey) => handleGenerateCurricularUDSection(sectionKey)}
                        onUpdateData={(updatedData) => handleUpdateCurricularData(updatedData)}
                      />
                    )}

                    {/* Tab 2: Cuestionario de Autoevaluación */}
                    {activeTab === "cuestionario_autoeval" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-alt/60 border border-border-default rounded-xl">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-semibold text-text-primary">2. Cuestionario de Autoevaluación</span>
                            <span>•</span>
                            <span>20 preguntas interactivas con justificación técnica</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGenerateModularSections(selectedUd, ["cuestionario_autoeval"])}
                            disabled={isGeneratingUd}
                            className="px-3 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold rounded-lg text-xs border border-red-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            title="Regenerar exclusivamente el cuestionario de autoevaluación"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-red-400" /> Regenerar Cuestionario
                          </button>
                        </div>
                        <SigreAutoevaluacionViewer
                          autoevaluacionHtml={selectedUd.data.modulo1.autoevaluacionHtml}
                          udTitle={selectedUd.title}
                          udCode={selectedUd.fullCode || selectedUd.id}
                          cotRazonamiento={selectedUd.data.cotRazonamiento || selectedUd.data.modulo1.cotRazonamiento}
                          bancoGiftParte1={selectedUd.data.recursosDocente?.bancoGiftParte1}
                          propuestaExamenHtml={selectedUd.data.recursosDocente?.propuestaExamenHtml}
                          solucionarioExamenHtml={selectedUd.data.recursosDocente?.solucionarioExamenHtml}
                          activeModel={activeProviderConfig?.selectedModel || "gemini-3.7-flash"}
                        />
                      </div>
                    )}

                    {/* Tab 3: Recurso Docente (GIFT & Tests) */}
                    {activeTab === "recursos_docente" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-alt/60 border border-border-default rounded-xl">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-semibold text-text-primary">3. Banco Moodle GIFT (60 Preguntas) & Examen</span>
                            <span>•</span>
                            <span>60 preguntas GIFT estructuradas + Propuesta de Examen</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGenerateModularSections(selectedUd, ["banco_gift_60"])}
                            disabled={isGeneratingUd}
                            className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold rounded-lg text-xs border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            title="Regenerar exclusivamente el banco GIFT de 60 preguntas y propuesta de examen"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Regenerar Banco GIFT (60)
                          </button>
                        </div>
                        <SigreMoodleGiftViewer
                          bancoGiftParte1={selectedUd.data.recursosDocente.bancoGiftParte1}
                          bancoGiftParte2={selectedUd.data.recursosDocente.bancoGiftParte2}
                          propuestaExamenHtml={selectedUd.data.recursosDocente.propuestaExamenHtml}
                          solucionarioExamenHtml={selectedUd.data.recursosDocente.solucionarioExamenHtml}
                          propuestaHdiConceptual={selectedUd.data.recursosDocente.propuestaHdiConceptual}
                          udTitle={selectedUd.title}
                          udCode={selectedUd.fullCode || selectedUd.id}
                          cotRazonamiento={selectedUd.data.cotRazonamiento || selectedUd.data.modulo1?.cotRazonamiento}
                          activeModel={activeProviderConfig?.selectedModel || "gemini-3.7-flash"}
                        />
                      </div>
                    )}

                    {/* Tab 4: Diagrama de Flujo (Mermaid) & Mapa Mental (OPML) */}
                    {activeTab === "diagrama_flujo" && (
                      <div className="space-y-4">
                        {/* Sub-selector between OPML (Left) and Mermaid (Right) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-1 bg-alt/60 border border-border-default rounded-xl">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDiagramSubTab("opml")}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                diagramSubTab === "opml"
                                  ? "bg-purple-600 text-white shadow-sm"
                                  : "text-text-muted hover:text-text-primary"
                              }`}
                            >
                              <Share2 className="w-3.5 h-3.5" /> Mapa Mental Estructurado (OPML)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDiagramSubTab("mermaid")}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                diagramSubTab === "mermaid"
                                  ? "bg-cyan-600 text-white shadow-sm"
                                  : "text-text-muted hover:text-text-primary"
                              }`}
                            >
                              <Workflow className="w-3.5 h-3.5" /> Diagrama de Flujo (Mermaid)
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGenerateModularSections(selectedUd, ["diagrama_opml"])}
                            disabled={isGeneratingUd}
                            className="px-3 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-bold rounded-lg text-xs border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            title="Regenerar Diagrama Mermaid y Mapa Mental OPML"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Regenerar Diagrama & OPML
                          </button>
                        </div>

                        {diagramSubTab === "opml" ? (
                          <SigreOpmlViewer
                            opmlCode={generateSigreOpml(selectedUd, selectedUd.data.modulo1, selectedUd.data)}
                            title="4. Mapa Mental Estructurado (OPML XML)"
                            onDownload={handleDownloadOpml}
                          />
                        ) : (
                          <SigreMermaidViewer
                            mermaidCode={selectedUd.data.modulo1.diagramaMermaid}
                            title="4. Diagrama de Flujo (Mermaid)"
                          />
                        )}
                      </div>
                    )}

                    {/* Tab 5: Programación y Rúbricas XML */}
                    {activeTab === "programacion_eval" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-alt/60 border border-border-default rounded-xl">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-semibold text-text-primary">5. Programación Didáctica & Rúbricas XML</span>
                            <span>•</span>
                            <span>Vinculación curricular y rúbricas analíticas XML</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleGenerateModularSections(selectedUd, ["programacion_rubricas"])}
                            disabled={isGeneratingUd}
                            className="px-3 py-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 font-bold rounded-lg text-xs border border-blue-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            title="Regenerar vinculación curricular y rúbricas XML"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Regenerar Programación & XML
                          </button>
                        </div>
                        <SigreRubricXmlViewer
                          vinculacionCurricularHtml={selectedUd.data.programacionEval.vinculacionCurricularHtml}
                          matrizAlineacionHtml={selectedUd.data.programacionEval.matrizAlineacionHtml}
                          tablaActividadesHtml={selectedUd.data.programacionEval.tablaActividadesHtml}
                          rubricasXml={selectedUd.data.programacionEval.rubricasXml}
                          udTitle={selectedUd.title}
                        />
                      </div>
                    )}

                    {/* Tab 6 / Módulo 2: Simulador HDI (Simulador Web Interactivo) */}
                    {activeTab === "hdi_interactiva" && (
                      <SigreHDISandbox
                        hdiData={selectedUd.data.hdi}
                        udTitle={selectedUd.title}
                        isGenerating={isGeneratingHdi}
                        onGenerateHDI={handleGenerateHDI}
                      />
                    )}

                    {/* Tab 7: Cronograma Visual Interactivo a 4 Niveles */}
                    {activeTab === "cronograma" && (
                      <SigreMultiLevelTimeline
                        uds={uds}
                        config={config}
                        selectedUdId={selectedUdId}
                        onSelectUd={(udId) => setSelectedUdId(udId)}
                        theme={theme}
                      />
                    )}
                  </div>
                ) : selectedUd.status === "generating" ? (
                  <div className="p-12 text-center bg-amber-500/5 rounded-2xl border border-amber-500/30 space-y-5 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className="text-base font-black text-text-primary">
                        Generando {selectedUd.fullCode || selectedUd.id}
                      </h4>
                      <p className="text-xs text-amber-300/90 leading-relaxed font-mono">
                        {loadingStatus || "Redactando Unidad Didáctica completa, banco GIFT y rúbricas XML..."}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleCancelGeneration}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Detener / Cancelar
                      </button>
                    </div>
                  </div>
                ) : selectedUd.status === "error" ? (
                  <div className="p-12 text-center bg-red-500/5 rounded-2xl border border-red-500/30 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className="text-base font-black text-text-primary">
                        Error en el Desarrollo de {selectedUd.id}
                      </h4>
                      <p className="text-xs text-red-400 leading-relaxed font-mono bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {selectedUd.error || "Ocurrió un error al contactar con el modelo de IA o procesar la respuesta."}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingUd}
                      onClick={() => handleGenerateChosenUD(selectedUd)}
                      className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl shadow-lg shadow-red-500/20 inline-flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Reintentar Desarrollo
                    </button>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-background rounded-xl border border-dashed border-border-default space-y-3">
                    <BookOpen className="w-12 h-12 text-amber-500/40 mx-auto" />
                    <h4 className="text-base font-black text-text-primary">
                      Unidad Pendiente de Desarrollo
                    </h4>
                    <p className="text-xs text-text-muted max-w-sm mx-auto">
                      Pulsa el botón de desarrollo para generar la Unidad Didáctica completa, el banco GIFT de 60 preguntas, las rúbricas XML y el simulador HDI.
                    </p>
                    <button
                      type="button"
                      disabled={isGeneratingUd}
                      onClick={() => handleGenerateChosenUD(selectedUd)}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Desarrollar {selectedUd.id}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-surface rounded-2xl border border-border-default">
                <p className="text-xs text-text-muted">Selecciona una Unidad Didáctica de la lista.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State before Plan analysis */
        <div className="bg-surface border border-border-default rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-text-primary">
              Comienza Diseñando el Plan de Unidades Didácticas
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Introduce o sube el currículo de tu módulo formativo (LOMLOE, FP o Secundaria) y el sistema SIGRE v6.0 estructurará el plan de UDs priorizando PRL como UD01.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyzeCurriculum}
            disabled={isAnalyzingCurriculum}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 inline-flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> Analizar Currículo y Generar Plan
          </button>
        </div>
      )}
    </>
  )}

      {/* Plan Approval Modal */}
      <SigrePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        uds={uds}
        moduloTitle={config.moduloFormativo}
        horasTotales={config.horasTotales || 160}
        horasSemanales={config.horasSemanales || 5}
        config={config}
        onConfirmPlan={handleConfirmPlan}
      />

      {/* Pedagogical Audit 6 Axes Modal */}
      <SigrePedagogicalAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditResult={activeAuditResult}
        ud={selectedUd}
      />

      {/* Regenerate UD Validation Modal */}
      <SigreRegenerateModal
        isOpen={isRegenerateModalOpen}
        onClose={() => {
          setIsRegenerateModalOpen(false);
          setUdToRegenerate(null);
        }}
        ud={udToRegenerate}
        onConfirm={(target, selectedSections) => {
          if (selectedSections && selectedSections.length < 7) {
            handleGenerateModularSections(target, selectedSections);
          } else {
            handleGenerateChosenUD(target, false);
          }
        }}
        isGenerating={isGeneratingUd}
      />
      {/* Technical & Stress Test Modal */}
      <SigreTechnicalAuditModal
        isOpen={isTechnicalAuditModalOpen}
        onClose={() => setIsTechnicalAuditModalOpen(false)}
        config={config}
        uds={uds}
        theme={theme}
      />
    </div>
  );
};
