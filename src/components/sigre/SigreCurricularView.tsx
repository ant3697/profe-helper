import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import {
  SigreCurricularConfig,
  SigreUDItem,
  SigreUDData,
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
  renderSigreUDCompleteA4Html,
  calculateSigrePedagogicalAudit,
  generateSigreOpml,
} from "../../utils/sigrePromptGenerator";
import { SigrePlanModal } from "./SigrePlanModal";
import { SigreMermaidViewer } from "./SigreMermaidViewer";
import { SigreOpmlViewer } from "./SigreOpmlViewer";
import { SigreMoodleGiftViewer } from "./SigreMoodleGiftViewer";
import { SigreRubricXmlViewer } from "./SigreRubricXmlViewer";
import { SigreHDISandbox } from "./SigreHDISandbox";
import { SigreCurriculumDropzone } from "./SigreCurriculumDropzone";
import { SigreDocumentViewerModal } from "./SigreDocumentViewerModal";
import { SigrePedagogicalAuditModal } from "./SigrePedagogicalAuditModal";
import { SigreAutoevaluacionViewer } from "./SigreAutoevaluacionViewer";
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
      return parsed.map((u) => {
        if (u.status === "generating") {
          return u.data ? { ...u, status: "completed" } : { ...u, status: "pending" };
        }
        return u;
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
    "ud_completa" | "cuestionario_autoeval" | "recursos_docente" | "programacion_eval" | "diagrama_flujo" | "hdi_interactiva"
  >("ud_completa");

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAnalyzingCurriculum, setIsAnalyzingCurriculum] = useState(false);
  const [isGeneratingUd, setIsGeneratingUd] = useState(false);
  const [isGeneratingHdi, setIsGeneratingHdi] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
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
  const [diagramSubTab, setDiagramSubTab] = useState<"mermaid" | "opml">("mermaid");
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
    if (selectedUdId) {
      localStorage.setItem("docuexam_sigre_selected_ud", selectedUdId);
    }
  }, [selectedUdId]);

  const selectedUd = uds.find((u) => u.id === selectedUdId) || uds[0] || null;

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
  const handleConfirmPlan = (updatedUds: SigreUDItem[]) => {
    setUds(updatedUds);
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
      } else {
        console.warn("Fallo o timeout en Módulo 2, aplicando plantilla estructurada de respaldo.");
        recursosDocenteData = {
          bancoGiftParte1: `// Banco de Preguntas - ${targetUd.fullCode}: Parte 1\n::1:: ¿Cuál es el objetivo primordial de ${targetUd.title}? {\n    =Garantizar la correcta ejecución técnica y normativa del sistema#¡Correcto!\n    ~Omitir las especificaciones del fabricante#Incorrecto. Deben respetarse siempre.\n    ~Reducir los tiempos sin verificar parámetros#Incorrecto. La verificación es obligatoria.\n    ~Ignorar las medidas de seguridad y EPIs#Incorrecto. La seguridad es prioritaria.\n}`,
          bancoGiftParte2: `// Banco de Preguntas - ${targetUd.fullCode}: Parte 2\n::31:: En relación con ${targetUd.title}, ¿qué verificación es crítica? {\n    =Comprobar los valores de tensión, continuidad y aislamiento según norma#¡Correcto!\n    ~No realizar mediciones previas#Incorrecto. Las medidas son esenciales.\n    ~Utilizar instrumentación descalibrada#Incorrecto. Los equipos deben estar calibrados.\n    ~Desconectar protecciones del cuadro#Incorrecto. Las protecciones deben operar siempre.\n}`,
          propuestaExamenHtml: `<div class="examen-box"><h3>Prueba Evaluable - ${targetUd.fullCode}</h3><ol><li><strong>1. ¿Cuál es el criterio técnico fundamental en ${targetUd.title}?</strong><br>A) Aplicar los procedimientos reglamentarios y verificar tolerancias.<br>B) Reducir comprobaciones de seguridad.<br>C) Proceder sin diagrama de conexionado.<br>D) Ninguna de las anteriores.</li></ol></div>`,
          solucionarioExamenHtml: `<div class="solucionario-box"><h3>Solucionario de la Prueba Evaluable</h3><ol><li><strong>1. Respuesta Correcta: A</strong><br><em>Justificación:</em> La aplicación rigurosa de los procedimientos y tolerancias normativas es el eje central de este bloque formativo.</li></ol></div>`,
          propuestaHdiConceptual: `Simulador web interactivo (Single-Page Application) para ${targetUd.title}. Permite al alumnado interactuar con esquemas técnicos, verificar parámetros en tiempo real, simular fallos y consolidar el aprendizaje procedimental.`,
        };
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
          indiceDesarrollo: modulo1Data.indiceDesarrollo || `1. Introducción y fundamentos\n2. Procedimientos de trabajo y normativa\n3. Verificación y control de calidad`,
          desarrolloEpigrafesHtml: modulo1Data.desarrolloEpigrafesHtml || `<div class="ud-content"><h3>1. Introducción y fundamentos</h3><p>Desarrollo técnico riguroso de ${targetUd.title}.</p></div>`,
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

      setUds((prev) =>
        prev.map((u) =>
          u.id === targetUd.id ? { ...u, status: "completed", error: undefined, data: completeUdData } : u
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

  // Download DOCX of the selected UD
  const handleDownloadDocx = async () => {
    if (!selectedUd || !selectedUd.data) return;
    const htmlA4 = renderSigreUDCompleteA4Html(selectedUd, selectedUd.data);
    await exportHtmlToDocx(htmlA4, `${selectedUd.id}_${selectedUd.title.replace(/[^a-z0-9]/gi, "_")}.docx`);
  };

  // Download OPML Mindmap
  const handleDownloadOpml = () => {
    if (!selectedUd || !selectedUd.data) return;
    const opmlText = generateSigreOpml(selectedUd, selectedUd.data.modulo1);
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
      {/* Top Banner SIGRE v6.0 */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#1e293b] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] tracking-wider uppercase">
                SIGRE v6.0 CURRICULAR & HDI
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                Formación Profesional & LOMLOE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Diseñador Curricular e Interactivo de Unidades Didácticas
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Genera la base pedagógica completa (U.D., Moodle GIFT de 60 preguntas con validación psicométrica, rúbricas XML y diagramas Mermaid) y construye micro-aplicaciones didácticas interactivas (HDI).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-amber-400" />
              {isConfigOpen ? "Ocultar Parámetros" : "Configurar Currículo"}
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

        {/* Collapsible Curriculum Configuration Form */}
        {isConfigOpen && (
          <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Módulo Formativo:</label>
              <input
                type="text"
                value={config.moduloFormativo}
                onChange={(e) => setConfig({ ...config, moduloFormativo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Código / Ciclo / Grado:</label>
              <input
                type="text"
                value={config.cicloFormativo}
                onChange={(e) => setConfig({ ...config, cicloFormativo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Contexto del Centro (IES / Entorno):</label>
              <input
                type="text"
                value={config.contextoAplicacion}
                onChange={(e) => setConfig({ ...config, contextoAplicacion: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Iterations, Adhesion, User Level */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">
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
              <label className="font-bold text-slate-300">
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
              <label className="font-bold text-slate-300">Nivel de Destinatario:</label>
              <select
                value={config.userLevel}
                onChange={(e) => setConfig({ ...config, userLevel: Number(e.target.value) as SigreUserLevel })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                <option value={1}>1: Secundaria (ESO)</option>
                <option value={2}>2: Bachillerato / Formación Profesional</option>
                <option value={3}>3: Grado Universitario</option>
                <option value={4}>4: Oposiciones y Especialización Avanzada</option>
              </select>
            </div>

            {/* Dimensionamiento Curricular: Horas Totales, Horas Semanales y Número de UDs */}
            <div className="col-span-1 md:col-span-3 space-y-3 pt-3 border-t border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Clock className="w-4 h-4 text-amber-400" />
                  CARGA HORARIA Y DIMENSIONAMIENTO DEL PLAN DE UDs:
                </label>
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Calibración temporal automática y manual
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Horas Totales */}
                <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Horas Totales del Módulo:
                    </label>
                    <span className="font-mono font-black text-amber-400 text-xs">
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
                      onChange={(e) =>
                        setConfig({ ...config, horasTotales: Math.max(1, Number(e.target.value) || 160) })
                      }
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="Ej. 160"
                    />
                    <span className="text-slate-400 font-semibold text-xs">horas</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {[96, 128, 160, 200, 240].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setConfig({ ...config, horasTotales: h })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          config.horasTotales === h
                            ? "bg-amber-500 text-black"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horas Semanales */}
                <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Horas Semanales Lectivas:
                    </label>
                    <span className="font-mono font-black text-cyan-400 text-xs">
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
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="Ej. 5"
                    />
                    <span className="text-slate-400 font-semibold text-xs">h/semana</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {[2, 3, 4, 5, 6, 8].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setConfig({ ...config, horasSemanales: s })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          config.horasSemanales === s
                            ? "bg-cyan-500 text-black"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {s}h/sem
                      </button>
                    ))}
                  </div>
                </div>

                {/* Número de Unidades Didácticas */}
                <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                      <Hash className="w-3.5 h-3.5 text-purple-400" /> Número de Unidades Didácticas:
                    </label>
                    <span className="font-mono font-black text-purple-400 text-xs">
                      {config.numUnidadesDidacticas && config.numUnidadesDidacticas > 0
                        ? `${config.numUnidadesDidacticas} UDs`
                        : "Automático"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={config.numUnidadesDidacticas && config.numUnidadesDidacticas > 0 ? "custom" : "auto"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          numUnidadesDidacticas: e.target.value === "auto" ? 0 : config.numUnidadesDidacticas || 8,
                        })
                      }
                      className="px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="auto">Automático (por Bloques)</option>
                      <option value="custom">Número Personalizado</option>
                    </select>

                    {config.numUnidadesDidacticas && config.numUnidadesDidacticas > 0 ? (
                      <input
                        type="number"
                        min="2"
                        max="30"
                        value={config.numUnidadesDidacticas}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            numUnidadesDidacticas: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="w-16 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500 focus:outline-none text-center"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Por defecto</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, numUnidadesDidacticas: 0 })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        !config.numUnidadesDidacticas || config.numUnidadesDidacticas === 0
                          ? "bg-purple-500 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Auto
                    </button>
                    {[6, 8, 10, 12, 14, 16].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setConfig({ ...config, numUnidadesDidacticas: num })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          config.numUnidadesDidacticas === num
                            ? "bg-purple-500 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {num} UDs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Temporal Metrics Helper */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-purple-500/10 border border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-slate-200">Distribución Temporal Estimada:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="text-slate-300">
                    Duración: <strong className="text-cyan-300 font-mono">~{Math.round((config.horasTotales || 160) / (config.horasSemanales || 5))} semanas lectivas</strong>
                  </span>
                  <span className="text-slate-300">
                    Carga media: <strong className="text-amber-300 font-mono">~{((config.horasTotales || 160) / (config.numUnidadesDidacticas || (uds.length > 0 ? uds.length : 8))).toFixed(1)} h / UD</strong>
                  </span>
                  <span className="text-slate-300">
                    Sesiones: <strong className="text-purple-300 font-mono">~{Math.max(1, Math.round(((config.horasTotales || 160) / (config.numUnidadesDidacticas || (uds.length > 0 ? uds.length : 8))) / 2))} sesiones</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Pedagogical Audit Configuration (6 Axes) */}
            <div className="col-span-1 md:col-span-3 space-y-2 pt-3 border-t border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Award className="w-4 h-4 text-purple-400" />
                  AUDITORÍA Y ENFOQUE PEDAGÓGICO AVANZADO (6 EJES):
                </label>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
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
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-sm"
                      : "bg-slate-900 border-slate-700 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-bold font-mono">1</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Test-Wiseness</span>
                  <span className="text-[9px] text-slate-400">Glosario & Anti-Pistas</span>
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
                      ? "bg-purple-500/10 border-purple-500/50 text-purple-300 shadow-sm"
                      : "bg-slate-900 border-slate-700 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-[9px] font-bold font-mono">2</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">CoT Anticolisión</span>
                  <span className="text-[9px] text-slate-400">Unicidad Temática</span>
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
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-300 shadow-sm"
                      : "bg-slate-900 border-slate-700 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    <span className="text-[9px] font-bold font-mono">3</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Práctica Intercalada</span>
                  <span className="text-[9px] text-slate-400">4 Dominios</span>
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
                      ? "bg-red-500/10 border-red-500/50 text-red-300 shadow-sm"
                      : "bg-slate-900 border-slate-700 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <HelpCircle className="w-4 h-4 text-red-400" />
                    <span className="text-[9px] font-bold font-mono">4</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Active Recall</span>
                  <span className="text-[9px] text-slate-400">Verificación Activa</span>
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
                      ? "bg-orange-500/10 border-orange-500/50 text-orange-300 shadow-sm"
                      : "bg-slate-900 border-slate-700 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <BrainCircuit className="w-4 h-4 text-orange-400" />
                    <span className="text-[9px] font-bold font-mono">5</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Mnemotecnias</span>
                  <span className="text-[9px] text-slate-400">Trucos & Acrónimos</span>
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
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-sm"
                      : "bg-slate-900 border-slate-700 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Scan className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-bold font-mono">6</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 leading-tight">Anti-Túnel</span>
                  <span className="text-[9px] text-slate-400">Cobertura 100%</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Document Reference Zone & Curricular Breakdown */}
            <div className="col-span-1 md:col-span-3 space-y-4 pt-2 border-t border-slate-700/60">
              <SigreCurriculumDropzone
                documents={ragDocuments}
                onDocumentsChange={setRagDocuments}
                onExtractCurriculumWithAI={handleExtractCurriculumWithAI}
                isAnalyzingAI={isAnalyzingCurriculum}
                onViewDocument={(doc) => setViewingDoc(doc)}
              />

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Desglose Curricular Extraído (Bloques de Contenido, RAs y Criterios de Evaluación):
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Editable manualmente o mediante IA
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={config.desgloseCurricular}
                  onChange={(e) => setConfig({ ...config, desgloseCurricular: e.target.value })}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none leading-relaxed"
                  placeholder="Pega o extrae con IA los Bloques de Contenido (BCs), Resultados de Aprendizaje (RAs) y Criterios de Evaluación (CrEvs)..."
                />
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

      {/* Main Layout: Left UDs Navigation / Right UD Deliverables */}
      {uds.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Plan de UDs (List) */}
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
                  className="text-[11px] font-bold text-amber-500 hover:underline cursor-pointer"
                >
                  Editar
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
              {uds.map((ud) => {
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
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted font-mono">{ud.bcCode}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 font-mono font-bold rounded flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {ud.horasEstimadas || Math.round((config.horasTotales || 160) / uds.length)}h
                        </span>
                      </div>
                      {isCompleted ? (
                        <span className="text-emerald-500 font-bold text-[10px]">Completa (3 Módulos)</span>
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
              })}
            </div>
          </div>

          {/* Right Column: Selected UD Deliverables */}
          <div className="lg:col-span-8 space-y-4">
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
                    {/* Pedagogical Quality & 6-Axes Audit Live Badges Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        <span className="text-slate-400 mr-1 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-purple-400" /> Auditoría 6 Ejes:
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Test-Wiseness ({activeAuditResult?.testWisenessScore || 96}%)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-purple-400" /> CoT Anticolisión
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-blue-400" /> Práctica Intercalada
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-red-400" /> Active Recall ({activeAuditResult?.activeRecallCount || 20})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3 text-orange-400" /> Mnemotecnias ({activeAuditResult?.mnemonicsCount || 2})
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Scan className="w-3 h-3 text-cyan-400" /> Anti-Túnel (100%)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAuditModalOpen(true)}
                        className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5 text-purple-400" /> Auditoría IA
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-border-default pb-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("ud_completa")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "ud_completa"
                            ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" /> 1. Unidad Didáctica (1.1 - 1.11)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("cuestionario_autoeval")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "cuestionario_autoeval"
                            ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <HelpCircle className="w-4 h-4" /> 2. Cuestionario de Autoevaluación
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("recursos_docente")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "recursos_docente"
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" /> 3. Banco Moodle GIFT & Tests
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("programacion_eval")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "programacion_eval"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <FileCheck className="w-4 h-4" /> 4. Programación & Rúbricas XML
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("diagrama_flujo")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "diagrama_flujo"
                            ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <Workflow className="w-4 h-4" /> 5. Diagrama & Mapa Mental (OPML)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("hdi_interactiva")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          activeTab === "hdi_interactiva"
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                            : "bg-surface border border-border-default text-text-muted hover:text-text-primary"
                        }`}
                      >
                        <Cpu className="w-4 h-4" /> Módulo 2: Simulador HDI
                      </button>
                    </div>

                    {/* Tab 1: Full UD Deliverables (1.1 - 1.11) */}
                    {activeTab === "ud_completa" && (
                      <div className="space-y-4">
                        {/* Zoom & View Controls Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-alt/60 border border-border-default rounded-xl max-w-4xl mx-auto">
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-semibold text-text-primary">Vista Documento A4</span>
                            <span>•</span>
                            <span>Diseño editorial y tablas técnicas formateadas</span>
                          </div>

                          <div className="flex items-center gap-2">
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

                    {/* Tab 2: Cuestionario de Autoevaluación */}
                    {activeTab === "cuestionario_autoeval" && (
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
                    )}

                    {/* Tab 3: Recurso Docente (GIFT & Tests) */}
                    {activeTab === "recursos_docente" && (
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
                    )}

                    {/* Tab 4: Programación y Rúbricas XML */}
                    {activeTab === "programacion_eval" && (
                      <SigreRubricXmlViewer
                        vinculacionCurricularHtml={selectedUd.data.programacionEval.vinculacionCurricularHtml}
                        matrizAlineacionHtml={selectedUd.data.programacionEval.matrizAlineacionHtml}
                        tablaActividadesHtml={selectedUd.data.programacionEval.tablaActividadesHtml}
                        rubricasXml={selectedUd.data.programacionEval.rubricasXml}
                        udTitle={selectedUd.title}
                      />
                    )}

                    {/* Tab 5: Diagrama de Flujo (Mermaid) & Mapa Mental (OPML) */}
                    {activeTab === "diagrama_flujo" && (
                      <div className="space-y-4">
                        {/* Sub-selector between Mermaid and OPML */}
                        <div className="flex items-center gap-2 p-1 bg-alt/60 border border-border-default rounded-xl w-fit">
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
                        </div>

                        {diagramSubTab === "mermaid" ? (
                          <SigreMermaidViewer
                            mermaidCode={selectedUd.data.modulo1.diagramaMermaid}
                            title="5. Diagrama de Flujo (Mermaid)"
                          />
                        ) : (
                          <SigreOpmlViewer
                            opmlCode={generateSigreOpml(selectedUd, selectedUd.data.modulo1)}
                            title="5. Mapa Mental Estructurado (OPML XML)"
                            onDownload={handleDownloadOpml}
                          />
                        )}
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

      {/* Plan Approval Modal */}
      <SigrePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        uds={uds}
        moduloTitle={config.moduloFormativo}
        horasTotales={config.horasTotales || 160}
        horasSemanales={config.horasSemanales || 5}
        onConfirmPlan={handleConfirmPlan}
      />

      {/* Pedagogical Audit 6 Axes Modal */}
      <SigrePedagogicalAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditResult={activeAuditResult}
        ud={selectedUd}
      />
    </div>
  );
};
