import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Tag,
  Tags,
  GripVertical,
  Search,
  CheckSquare,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Save,
  FileText,
  FileCode,
  Image as ImageIcon,
  Printer,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  Target,
  ArrowRightLeft,
  X,
  Copy,
  Edit3,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  TimelineEvent,
  TimelineLevel,
  TimelineEventCategory,
  TimelineScale,
  MultiLevelTimelineData,
  SigreCourseTimelineItem,
} from "../../types/sigreTimeline";
import { SigreUDItem, SigreCurricularConfig } from "../../types/sigre";
import {
  TIMELINE_COLOR_PRESETS,
  MONTH_COLORS_TIMELINE,
  getDefaultCursoTimelineEvents,
  getDefaultCursoCronogramas,
  getDefaultProfesorTimelineEvents,
  getDefaultModuloTimelineEvents,
  getDefaultUnidadTimelineEvents,
} from "../../data/sigreTimelinePresets";
import {
  ALL_PRESET_ACADEMIC_CALENDARS,
} from "../../data/sigreAcademicCalendarPresets";
import {
  ONE_DAY_MS,
  getSchoolYearRange,
  formatDateToIso,
  parseIsoDate,
  calculateDateScale,
  dateToX,
  xToDate,
  generateModuleTimelineFromUds,
  generateUnitTimelineFromUd,
  generateModuleTimelineFromCalendar,
} from "../../utils/sigreTimelineUtils";
import { SigreAcademicCalendar } from "../../types/sigre";

interface SigreMultiLevelTimelineProps {
  uds?: SigreUDItem[];
  config?: SigreCurricularConfig;
  selectedUdId?: string | null;
  onSelectUd?: (udId: string) => void;
  modulesList?: SigreAcademicCalendar[];
  activeModuleId?: string | null;
  onSelectModule?: (moduleId: string) => void;
  onOpenModuleCurriculum?: (
    cal: SigreAcademicCalendar,
    targetView?: "unidades" | "parametros" | "cronogramas"
  ) => void;
  initialLevel?: TimelineLevel;
  theme?: "dark" | "light";
  onClose?: () => void;
}

export const SigreMultiLevelTimeline: React.FC<SigreMultiLevelTimelineProps> = ({
  uds = [],
  config = { moduloFormativo: "Módulo Profesional", horasTotales: 160, semanasCurso: 32, horasSemanales: 5 },
  selectedUdId,
  onSelectUd,
  modulesList = ALL_PRESET_ACADEMIC_CALENDARS,
  activeModuleId,
  onSelectModule,
  onOpenModuleCurriculum,
  initialLevel,
  theme = "dark",
  onClose,
}) => {
  // Determine available modules list
  const allModules = useMemo(() => {
    return modulesList && modulesList.length > 0 ? modulesList : ALL_PRESET_ACADEMIC_CALENDARS;
  }, [modulesList]);

  const [currentModuleId, setCurrentModuleId] = useState<string>(() => {
    if (activeModuleId) return activeModuleId;
    return allModules[0]?.id || "cal_2026_2027_malaga_andalucia";
  });

  // Sync currentModuleId if activeModuleId changes
  useEffect(() => {
    if (activeModuleId) {
      setCurrentModuleId(activeModuleId);
    }
  }, [activeModuleId]);

  const currentModule = useMemo(() => {
    return allModules.find((m) => m.id === currentModuleId) || allModules[0];
  }, [allModules, currentModuleId]);

  // Global multi-level timeline state stored in localStorage
  const [timelineData, setTimelineData] = useState<MultiLevelTimelineData>(() => {
    try {
      const saved = localStorage.getItem("docuexam_sigre_multilevel_timeline_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedCursoCronos: SigreCourseTimelineItem[] =
          Array.isArray(parsed.cursoCronogramas) && parsed.cursoCronogramas.length > 0
            ? parsed.cursoCronogramas
            : getDefaultCursoCronogramas(2026);

        const initialActiveCursoId =
          parsed.activeCursoCronogramaId || parsedCursoCronos[0]?.id || "curso_general_centro";
        const initialActiveCursoItem =
          parsedCursoCronos.find((c) => c.id === initialActiveCursoId) || parsedCursoCronos[0];

        return {
          schoolYear: parsed.schoolYear || currentModule?.academicYear || "2026-2027",
          activeLevel: initialLevel || parsed.activeLevel || "modulo",
          activeModuleId: currentModuleId,
          activeCursoCronogramaId: initialActiveCursoId,
          cursoEvents: initialActiveCursoItem?.events || parsed.cursoEvents || getDefaultCursoTimelineEvents(2026),
          cursoCronogramas: parsedCursoCronos,
          profesorEvents: parsed.profesorEvents || getDefaultProfesorTimelineEvents(2026),
          moduloEvents: parsed.moduloEvents || (currentModule ? generateModuleTimelineFromCalendar(currentModule) : getDefaultModuloTimelineEvents(2026, config.moduloFormativo, config.horasTotales)),
          moduloEventsByModule: parsed.moduloEventsByModule || {},
          unidadEvents: parsed.unidadEvents || {
            UD01: getDefaultUnidadTimelineEvents(2026, "UD01", "Instalaciones y Mantenimiento"),
          },
        };
      }
    } catch (e) {
      console.warn("Could not load saved timeline data", e);
    }

    const defaultCursoCronos = getDefaultCursoCronogramas(2026);
    const initModEvents = currentModule ? generateModuleTimelineFromCalendar(currentModule) : getDefaultModuloTimelineEvents(2026, config.moduloFormativo, config.horasTotales);

    return {
      schoolYear: currentModule?.academicYear || "2026-2027",
      activeLevel: initialLevel || "modulo",
      activeModuleId: currentModuleId,
      activeCursoCronogramaId: defaultCursoCronos[0].id,
      cursoEvents: defaultCursoCronos[0].events,
      cursoCronogramas: defaultCursoCronos,
      profesorEvents: getDefaultProfesorTimelineEvents(2026),
      moduloEvents: initModEvents,
      moduloEventsByModule: {
        [currentModuleId]: initModEvents,
      },
      unidadEvents: {
        UD01: getDefaultUnidadTimelineEvents(2026, "UD01", "Instalaciones y Mantenimiento"),
      },
    };
  });

  const [activeLevel, setActiveLevel] = useState<TimelineLevel>(initialLevel || timelineData.activeLevel || "modulo");
  const [activeCursoCronogramaId, setActiveCursoCronogramaId] = useState<string>(
    () => timelineData.activeCursoCronogramaId || timelineData.cursoCronogramas?.[0]?.id || "curso_general_centro"
  );
  const [activeUdId, setActiveUdId] = useState<string>(selectedUdId || uds[0]?.id || "UD01");
  const [modulePortfolioView, setModulePortfolioView] = useState<"single" | "all_modules">("single");

  // Modals state for Course Cronogramas
  const [isNewCursoModalOpen, setIsNewCursoModalOpen] = useState<boolean>(false);
  const [newCursoName, setNewCursoName] = useState<string>("");
  const [newCursoCategory, setNewCursoCategory] = useState<string>("1º Curso FP");
  const [newCursoTemplate, setNewCursoTemplate] = useState<"general" | "fp1" | "fp2_dual" | "evaluaciones" | "blank" | "duplicate">("general");

  const [isRenameCursoModalOpen, setIsRenameCursoModalOpen] = useState<boolean>(false);
  const [renameCursoName, setRenameCursoName] = useState<string>("");
  const [renameCursoCategory, setRenameCursoCategory] = useState<string>("General Centro");

  // Keep activeUdId in sync if selectedUdId changes externally
  useEffect(() => {
    if (selectedUdId) {
      setActiveUdId(selectedUdId);
    } else if (uds.length > 0 && !activeUdId) {
      setActiveUdId(uds[0].id);
    }
  }, [selectedUdId, uds]);

  // When switching current module, ensure its events exist
  useEffect(() => {
    if (currentModule) {
      setTimelineData((prev) => {
        const byModule = prev.moduloEventsByModule || {};
        let modEvents = byModule[currentModule.id];
        if (!modEvents || modEvents.length === 0) {
          modEvents = generateModuleTimelineFromCalendar(currentModule);
        }
        return {
          ...prev,
          schoolYear: currentModule.academicYear || prev.schoolYear,
          activeModuleId: currentModule.id,
          moduloEvents: modEvents,
          moduloEventsByModule: {
            ...byModule,
            [currentModule.id]: modEvents,
          },
        };
      });
    }
  }, [currentModuleId, currentModule]);

  // Currently active course cronograma item
  const activeCursoItem = useMemo(() => {
    const cronos = timelineData.cursoCronogramas || [];
    return cronos.find((c) => c.id === activeCursoCronogramaId) || cronos[0];
  }, [timelineData.cursoCronogramas, activeCursoCronogramaId]);

  // Current active events array according to the chosen level
  const currentEvents: TimelineEvent[] = useMemo(() => {
    switch (activeLevel) {
      case "curso": {
        return activeCursoItem ? activeCursoItem.events : timelineData.cursoEvents;
      }
      case "profesor":
        return timelineData.profesorEvents;
      case "modulo":
        return timelineData.moduloEvents;
      case "unidad":
        return timelineData.unidadEvents[activeUdId] || getDefaultUnidadTimelineEvents(2026, activeUdId, "Unidad Didáctica");
      default:
        return timelineData.moduloEvents;
    }
  }, [activeLevel, activeUdId, activeCursoItem, timelineData]);

  // Updater for the current level's events
  const setCurrentEvents = (newEvents: TimelineEvent[]) => {
    setTimelineData((prev) => {
      const updated = { ...prev };
      if (activeLevel === "curso") {
        updated.cursoEvents = newEvents;
        const currentActiveId = activeCursoCronogramaId || prev.activeCursoCronogramaId || "curso_general_centro";
        const cronos = prev.cursoCronogramas || getDefaultCursoCronogramas(2026);
        updated.cursoCronogramas = cronos.map((c) =>
          c.id === currentActiveId ? { ...c, events: newEvents } : c
        );
      } else if (activeLevel === "profesor") {
        updated.profesorEvents = newEvents;
      } else if (activeLevel === "modulo") {
        updated.moduloEvents = newEvents;
        updated.moduloEventsByModule = {
          ...(prev.moduloEventsByModule || {}),
          [currentModuleId]: newEvents,
        };
      } else if (activeLevel === "unidad") {
        updated.unidadEvents = {
          ...prev.unidadEvents,
          [activeUdId]: newEvents,
        };
      }
      return updated;
    });
  };

  // Course Timeline Management Handlers
  const handleSelectCursoCronograma = (id: string) => {
    setActiveCursoCronogramaId(id);
    const found = (timelineData.cursoCronogramas || []).find((c) => c.id === id);
    if (found) {
      setTimelineData((prev) => ({
        ...prev,
        activeCursoCronogramaId: id,
        cursoEvents: found.events,
      }));
    }
  };

  const handleCreateCursoCronograma = () => {
    if (!newCursoName.trim()) return;
    const newId = `curso_custom_${Date.now()}`;
    const { startYear } = getSchoolYearRange(timelineData.schoolYear);

    let templateEvents: TimelineEvent[] = [];
    if (newCursoTemplate === "general") {
      templateEvents = getDefaultCursoTimelineEvents(startYear);
    } else if (newCursoTemplate === "fp1") {
      templateEvents = getDefaultCursoCronogramas(startYear).find((c) => c.id === "curso_fp_1_anual")?.events || [];
    } else if (newCursoTemplate === "fp2_dual") {
      templateEvents = getDefaultCursoCronogramas(startYear).find((c) => c.id === "curso_fp_2_dual")?.events || [];
    } else if (newCursoTemplate === "evaluaciones") {
      templateEvents = getDefaultCursoCronogramas(startYear).find((c) => c.id === "curso_evaluaciones_examenes")?.events || [];
    } else if (newCursoTemplate === "duplicate" && activeCursoItem) {
      templateEvents = JSON.parse(JSON.stringify(activeCursoItem.events));
    }

    const newItem: SigreCourseTimelineItem = {
      id: newId,
      name: newCursoName.trim(),
      category: newCursoCategory.trim() || "General Centro",
      academicYear: timelineData.schoolYear,
      events: templateEvents,
    };

    setTimelineData((prev) => {
      const list = prev.cursoCronogramas || getDefaultCursoCronogramas(startYear);
      return {
        ...prev,
        activeCursoCronogramaId: newId,
        cursoEvents: templateEvents,
        cursoCronogramas: [...list, newItem],
      };
    });

    setActiveCursoCronogramaId(newId);
    setIsNewCursoModalOpen(false);
    setNewCursoName("");
    setSaveBanner(`¡Creado nuevo cronograma de curso «${newItem.name}» (${templateEvents.length} hitos y periodos)!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleDuplicateCursoCronograma = (crono: SigreCourseTimelineItem) => {
    const newId = `curso_copy_${Date.now()}`;
    const newCopy: SigreCourseTimelineItem = {
      id: newId,
      name: `${crono.name} (Copia)`,
      category: crono.category || "General Centro",
      academicYear: crono.academicYear || timelineData.schoolYear,
      events: JSON.parse(JSON.stringify(crono.events)),
    };

    setTimelineData((prev) => {
      const list = prev.cursoCronogramas || [];
      return {
        ...prev,
        activeCursoCronogramaId: newId,
        cursoEvents: newCopy.events,
        cursoCronogramas: [...list, newCopy],
      };
    });

    setActiveCursoCronogramaId(newId);
    setSaveBanner(`¡Duplicado cronograma de curso «${newCopy.name}»!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleOpenRenameModal = (crono: SigreCourseTimelineItem) => {
    setRenameCursoName(crono.name);
    setRenameCursoCategory(crono.category || "General Centro");
    setIsRenameCursoModalOpen(true);
  };

  const handleSaveRenameCurso = () => {
    if (!renameCursoName.trim()) return;
    setTimelineData((prev) => {
      const list = prev.cursoCronogramas || [];
      return {
        ...prev,
        cursoCronogramas: list.map((c) =>
          c.id === activeCursoCronogramaId
            ? { ...c, name: renameCursoName.trim(), category: renameCursoCategory.trim() }
            : c
        ),
      };
    });
    setIsRenameCursoModalOpen(false);
    setSaveBanner(`¡Renombrado cronograma a «${renameCursoName.trim()}»!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleDeleteCursoCronograma = (id: string, name: string) => {
    const list = timelineData.cursoCronogramas || [];
    if (list.length <= 1) {
      setSaveBanner("No se puede eliminar el único cronograma de curso existente.");
      setTimeout(() => setSaveBanner(null), 4000);
      return;
    }
    const filtered = list.filter((c) => c.id !== id);
    const nextActive = filtered[0];
    setTimelineData((prev) => ({
      ...prev,
      activeCursoCronogramaId: nextActive.id,
      cursoEvents: nextActive.events,
      cursoCronogramas: filtered,
    }));
    setActiveCursoCronogramaId(nextActive.id);
    setSaveBanner(`¡Eliminado cronograma de curso «${name}»!`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("docuexam_sigre_multilevel_timeline_v3", JSON.stringify(timelineData));
    } catch (e) {
      console.warn("Storage full or error saving timeline", e);
    }
  }, [timelineData]);

  // Timeline Visual state
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const eventsLayerRef = useRef<HTMLDivElement>(null);

  const [panOffset, setPanOffset] = useState<number>(50);
  const [pixelsPerDay, setPixelsPerDay] = useState<number>(4.5);
  const [showWeekends, setShowWeekends] = useState<boolean>(true);
  const [hideLabels, setHideLabels] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<"id" | "description" | "startDate" | "endDate">("startDate");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Split-pane Resizer (horizontal percentage on desktop)
  const [leftPanePercent, setLeftPanePercent] = useState<number>(65);
  const [isResizingPane, setIsResizingPane] = useState<boolean>(false);
  const [isRightPaneCollapsed, setIsRightPaneCollapsed] = useState<boolean>(false);

  // Helper for uppercase Spanish date matching original webapp
  const formatSpanishUpperDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const monthNames = [
        "ENERO",
        "FEBRERO",
        "MARZO",
        "ABRIL",
        "MAYO",
        "JUNIO",
        "JULIO",
        "AGOSTO",
        "SEPTIEMBRE",
        "OCTUBRE",
        "NOVIEMBRE",
        "DICIEMBRE",
      ];
      if (m >= 0 && m < 12) {
        return `${d} DE ${monthNames[m]} DE ${y}`;
      }
    }
    return dateStr.toUpperCase();
  };

  // Visual categorization and high-contrast color scheme for timeline cards
  const getTimelineEventVisuals = (event: TimelineEvent, isPeriod: boolean, isSelected: boolean) => {
    const desc = (event.description || "").toLowerCase();
    const cat = event.category || "otro";

    const isFestivo =
      cat === "festivo" ||
      /festiv|inmaculada|navidad|semana santa|reyes|constituci|andaluc|trabajo|pilar|santos|asunci|hispanidad|candelaria/i.test(
        desc
      );
    const isInicioCurso =
      (cat === "hito" && /inicio|primer ciclo|2º ciclo|segundo ciclo|infantil|primaria|eso|bach|presentaci|inaugura/i.test(desc)) ||
      /inicio (primer|1er|2º|segundo|régimen|clases|curso)/i.test(desc);
    const isEvaluacion = cat === "evaluacion" || /evaluaci|examen|calificaci|acta|junta/i.test(desc);
    const isDual = cat === "dual" || /dual|fct|ffeoe|empresa|práctica/i.test(desc);
    const isVacaciones = /vacaciones|semana blanca|semana santa/i.test(desc);
    const isRecuperacion = cat === "recuperacion" || /recuperaci|refuerzo/i.test(desc);
    const isUd = Boolean(event.udId) || /\[ud\d+\]|ud\d+/i.test(desc);

    // Color definitions
    let borderColor = "#0d6efd"; // default blue
    let dateColor = "#38bdf8"; // bright cyan date header
    let badgeLabel = "EVENTO";
    let badgeClass = "bg-blue-500/20 text-blue-300 border-blue-500/40";
    // Strictly solid dark background for maximum distinction and WCAG contrast
    const cardBg = "#090d16";
    const textColor = "#f8fafc";
    let stemColor = "#0d6efd";

    if (isFestivo) {
      // Días festivos oficiales
      borderColor = "#ef4444"; // Red border
      dateColor = "#fca5a5"; // Coral/rose legible date text
      badgeLabel = "FESTIVO";
      badgeClass = "bg-red-500/20 text-red-300 border-red-500/50";
      stemColor = "#ef4444";
    } else if (isInicioCurso) {
      // Inicio de curso e hitos institucionales
      borderColor = "#d946ef"; // Vivid Magenta / Fuchsia border
      dateColor = "#f0abfc"; // Bright fuchsia date text
      badgeLabel = "INICIO CURSO";
      badgeClass = "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50";
      stemColor = "#d946ef";
    } else if (isVacaciones) {
      // Vacaciones escolares y semanas blancas
      borderColor = "#06b6d4"; // Cyan border
      dateColor = "#67e8f9"; // Bright Cyan date text
      badgeLabel = "VACACIONES";
      badgeClass = "bg-cyan-500/20 text-cyan-300 border-cyan-500/50";
      stemColor = "#06b6d4";
    } else if (isEvaluacion) {
      // Sesiones de evaluación y exámenes
      borderColor = "#f59e0b"; // Amber border
      dateColor = "#fde047"; // Yellow/Amber date text
      badgeLabel = "EVALUACIÓN";
      badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/50";
      stemColor = "#f59e0b";
    } else if (isDual) {
      // FP Dual / Formación en empresa
      borderColor = "#eab308"; // Golden border
      dateColor = "#fef08a"; // Soft yellow date text
      badgeLabel = "DUAL";
      badgeClass = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      stemColor = "#eab308";
    } else if (isRecuperacion) {
      // Periodos de recuperación
      borderColor = "#fb923c"; // Orange border
      dateColor = "#fdba74"; // Soft orange date text
      badgeLabel = "RECUPERACIÓN";
      badgeClass = "bg-orange-500/20 text-orange-300 border-orange-500/50";
      stemColor = "#fb923c";
    } else if (isUd) {
      // Unidades didácticas curriculares
      borderColor = "#10b981"; // Emerald border
      dateColor = "#6ee7b7"; // Light emerald date text
      badgeLabel = event.udId || "UD";
      badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
      stemColor = "#10b981";
    } else if (isPeriod) {
      // Periodos genéricos
      borderColor = "#3b82f6"; // Blue border
      dateColor = "#93c5fd"; // Light blue date text
      badgeLabel = "PERIODO";
      badgeClass = "bg-blue-500/20 text-blue-300 border-blue-500/50";
      stemColor = "#3b82f6";
    } else {
      // Hitos genéricos
      borderColor = "#8b5cf6"; // Purple border
      dateColor = "#c4b5fd"; // Light purple date text
      badgeLabel = "HITO";
      badgeClass = "bg-purple-500/20 text-purple-300 border-purple-500/50";
      stemColor = "#8b5cf6";
    }

    // Explicit custom border overrides if user customized it
    if (event.borderColor && event.borderColor !== "#0891b2" && event.borderColor !== "#000000") {
      borderColor = event.borderColor;
      stemColor = event.borderColor;
    } else if (event.bgColor && !isFestivo && !isVacaciones && !isEvaluacion && !isInicioCurso) {
      // If event has a custom category color, use it as border/accent color
      borderColor = event.bgColor;
      stemColor = event.bgColor;
    }

    if (isSelected) {
      borderColor = "#f59e0b";
    }

    return {
      cardBg,
      borderColor,
      dateColor,
      textColor,
      badgeLabel,
      badgeClass,
      stemColor,
      isFestivo,
      isInicioCurso,
    };
  };

  // Splitter drag listener on window for smooth dragging across entire screen
  useEffect(() => {
    if (!isResizingPane) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clientX = e.clientX;
      const percent = Math.min(85, Math.max(15, ((clientX - rect.left) / rect.width) * 100));
      setLeftPanePercent(percent);
    };

    const handleWindowMouseUp = () => {
      setIsResizingPane(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizingPane]);

  // Drag & drop interaction on canvas / cards
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStartX, setPanStartX] = useState<number>(0);
  const [hoverDateText, setHoverDateText] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [dragState, setDragState] = useState<{
    active: boolean;
    eventId: number | null;
    type: "move" | "resize-start" | "resize-end" | null;
    startX: number;
    startY: number;
    initialStart: Date | null;
    initialEnd: Date | null;
  }>({
    active: false,
    eventId: null,
    type: null,
    startX: 0,
    startY: 0,
    initialStart: null,
    initialEnd: null,
  });

  // Table row dragging
  const [draggedRowId, setDraggedRowId] = useState<number | null>(null);

  // Modals & Context menu
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<{
    description: string;
    startDate: string;
    endDate: string;
    category: TimelineEventCategory;
    bgColor: string;
    textColor: string;
    borderColor: string;
    forcedPosition: "top" | "bottom" | null;
  }>({
    description: "",
    startDate: "",
    endDate: "",
    category: "lectivo",
    bgColor: "",
    textColor: "",
    borderColor: "",
    forcedPosition: null,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPasteJsonModalOpen, setIsPasteJsonModalOpen] = useState<boolean>(false);
  const [pasteJsonText, setPasteJsonText] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    date: Date;
    eventId: number | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: new Date(),
    eventId: null,
  });

  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // ESC key listener to exit maximized mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized]);

  // Scale computation
  const scale: TimelineScale = useMemo(() => {
    const { minDate, maxDate } = calculateDateScale(currentEvents, timelineData.schoolYear);
    return { minDate, maxDate, pixelsPerDay };
  }, [currentEvents, timelineData.schoolYear, pixelsPerDay]);

  // Center on event function
  const scrollToEvent = (eventId: number) => {
    const event = currentEvents.find((e) => e.id === eventId);
    if (!event || !event.startDate || !timelineContainerRef.current) return;
    const containerWidth = timelineContainerRef.current.clientWidth;
    const eventDate = parseIsoDate(event.startDate);
    const daysFromStart = (eventDate.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
    const absoluteX = daysFromStart * scale.pixelsPerDay;
    setPanOffset(containerWidth / 2 - absoluteX);
  };

  // Preset zoom levels
  const applyZoomPreset = (preset: "curso" | "trimestre1" | "trimestre2" | "trimestre3" | "mes" | "dia") => {
    if (!timelineContainerRef.current) return;
    const containerWidth = timelineContainerRef.current.clientWidth;
    const year = typeof timelineData.schoolYear === "number" ? timelineData.schoolYear : (parseInt(String(timelineData.schoolYear), 10) || 2025);

    switch (preset) {
      case "curso": {
        const totalDays = (scale.maxDate.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
        const fitted = Math.max(0.5, Math.min(25, (containerWidth - 80) / totalDays));
        setPixelsPerDay(fitted);
        setPanOffset(40);
        break;
      }
      case "trimestre1": {
        const t1Start = new Date(year, 8, 1); // Sep 1
        const t1Days = (t1Start.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
        const newPixels = Math.max(3, (containerWidth - 60) / 105);
        setPixelsPerDay(newPixels);
        setPanOffset(40 - t1Days * newPixels);
        break;
      }
      case "trimestre2": {
        const t2Start = new Date(year + 1, 0, 7); // Jan 7
        const t2Days = (t2Start.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
        const newPixels = Math.max(3, (containerWidth - 60) / 90);
        setPixelsPerDay(newPixels);
        setPanOffset(40 - t2Days * newPixels);
        break;
      }
      case "trimestre3": {
        const t3Start = new Date(year + 1, 3, 1); // Apr 1
        const t3Days = (t3Start.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
        const newPixels = Math.max(3, (containerWidth - 60) / 85);
        setPixelsPerDay(newPixels);
        setPanOffset(40 - t3Days * newPixels);
        break;
      }
      case "mes": {
        const newPixels = Math.max(6, (containerWidth - 60) / 32);
        setPixelsPerDay(newPixels);
        break;
      }
      case "dia": {
        setPixelsPerDay(24);
        break;
      }
    }
  };

  // Zoom handlers
  const handleZoom = (direction: "in" | "out" | "fit" | "reset") => {
    if (direction === "reset") {
      setPixelsPerDay(4.5);
      setPanOffset(50);
      return;
    }
    if (direction === "fit") {
      if (!timelineContainerRef.current) return;
      const containerWidth = timelineContainerRef.current.clientWidth;
      const totalDays = (scale.maxDate.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
      const fitted = Math.max(0.5, Math.min(25, (containerWidth - 80) / totalDays));
      setPixelsPerDay(fitted);
      setPanOffset(40);
      return;
    }

    const factor = 1.25;
    const nextPixels = direction === "in" ? pixelsPerDay * factor : pixelsPerDay / factor;
    if (nextPixels < 0.2 || nextPixels > 60) return;

    if (timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const centerDate = xToDate(rect.width / 2, scale, panOffset);
      setPixelsPerDay(nextPixels);
      const newDaysFromStart = (centerDate.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
      const newCenterX = newDaysFromStart * nextPixels;
      setPanOffset(rect.width / 2 - newCenterX);
    } else {
      setPixelsPerDay(nextPixels);
    }
  };

  // Wheel zoom anchored to cursor
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const dateBeforeZoom = xToDate(mouseX, scale, panOffset);

    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const nextPixels = Math.max(0.2, Math.min(60, pixelsPerDay * zoomFactor));
      setPixelsPerDay(nextPixels);

      const daysFromStart = (dateBeforeZoom.getTime() - scale.minDate.getTime()) / ONE_DAY_MS;
      const newMouseX = daysFromStart * nextPixels;
      setPanOffset(mouseX - newMouseX);
    } else {
      // Horizontal pan
      setPanOffset((prev) => prev - e.deltaX);
    }
  };

  // Mouse pan handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    if ((e.target as HTMLElement).closest(".event-card, .resize-handle, circle")) return;
    setIsPanning(true);
    setPanStartX(e.clientX - panOffset);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isResizingPane) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.min(85, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100));
      setLeftPanePercent(percent);
      return;
    }

    if (isPanning) {
      setPanOffset(e.clientX - panStartX);
    } else if (dragState.active && dragState.eventId) {
      const dx = e.clientX - dragState.startX;
      const daysChanged = Math.round(dx / scale.pixelsPerDay);
      const ev = currentEvents.find((item) => item.id === dragState.eventId);
      if (ev && dragState.initialStart) {
        const updated = [...currentEvents];
        const index = updated.findIndex((item) => item.id === dragState.eventId);
        if (index !== -1) {
          if (dragState.type === "move") {
            const newStart = new Date(dragState.initialStart.getTime() + daysChanged * ONE_DAY_MS);
            const duration = dragState.initialEnd
              ? dragState.initialEnd.getTime() - dragState.initialStart.getTime()
              : 0;
            const newEnd = duration > 0 ? new Date(newStart.getTime() + duration) : null;
            updated[index] = {
              ...updated[index],
              startDate: formatDateToIso(newStart),
              endDate: newEnd ? formatDateToIso(newEnd) : undefined,
            };

            // Vertical position preference threshold
            if (timelineContainerRef.current) {
              const rect = timelineContainerRef.current.getBoundingClientRect();
              const axisY = rect.height / 2;
              const relativeY = e.clientY - rect.top;
              if (relativeY < axisY - 40) {
                updated[index].forcedPosition = "top";
              } else if (relativeY > axisY + 40) {
                updated[index].forcedPosition = "bottom";
              }
            }
          } else if (dragState.type === "resize-start") {
            const newStart = new Date(dragState.initialStart.getTime() + daysChanged * ONE_DAY_MS);
            const curEnd = ev.endDate ? parseIsoDate(ev.endDate) : newStart;
            if (newStart <= curEnd) {
              updated[index] = {
                ...updated[index],
                startDate: formatDateToIso(newStart),
              };
            }
          } else if (dragState.type === "resize-end" && dragState.initialEnd) {
            const newEnd = new Date(dragState.initialEnd.getTime() + daysChanged * ONE_DAY_MS);
            const curStart = parseIsoDate(ev.startDate);
            if (newEnd >= curStart) {
              updated[index] = {
                ...updated[index],
                endDate: formatDateToIso(newEnd),
              };
            }
          }
          setCurrentEvents(updated);
        }
      }
    }

    // Cursor date tooltip
    if (timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const dateUnderMouse = xToDate(mouseX, scale, panOffset);
      setHoverDateText(
        dateUnderMouse.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
      setCursorPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsResizingPane(false);
    setDragState({
      active: false,
      eventId: null,
      type: null,
      startX: 0,
      startY: 0,
      initialStart: null,
      initialEnd: null,
    });
  };

  // Card start drag
  const handleCardDragStart = (e: React.MouseEvent, event: TimelineEvent) => {
    e.stopPropagation();
    setDragState({
      active: true,
      eventId: event.id,
      type: "move",
      startX: e.clientX,
      startY: e.clientY,
      initialStart: parseIsoDate(event.startDate),
      initialEnd: event.endDate ? parseIsoDate(event.endDate) : null,
    });
  };

  // Period Handle resize start
  const handleResizeStart = (e: React.MouseEvent, event: TimelineEvent, type: "resize-start" | "resize-end") => {
    e.stopPropagation();
    setDragState({
      active: true,
      eventId: event.id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialStart: parseIsoDate(event.startDate),
      initialEnd: event.endDate ? parseIsoDate(event.endDate) : parseIsoDate(event.startDate),
    });
  };

  // Open Edit Modal
  const openEditModal = (event: TimelineEvent) => {
    setEditingEventId(event.id);
    setEditFormData({
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate || "",
      category: event.category || "lectivo",
      bgColor: event.bgColor || "",
      textColor: event.textColor || "",
      borderColor: event.borderColor || "",
      forcedPosition: event.forcedPosition || null,
    });
    setIsEditModalOpen(true);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Save Event from Modal
  const handleSaveModal = () => {
    if (editingEventId === null) return;
    const updated = currentEvents.map((e) => {
      if (e.id === editingEventId) {
        return {
          ...e,
          description: editFormData.description || "Evento sin título",
          startDate: editFormData.startDate || formatDateToIso(new Date()),
          endDate: editFormData.endDate ? editFormData.endDate : undefined,
          category: editFormData.category,
          bgColor: editFormData.bgColor || undefined,
          textColor: editFormData.textColor || undefined,
          borderColor: editFormData.borderColor || undefined,
          forcedPosition: editFormData.forcedPosition,
        };
      }
      return e;
    });
    setCurrentEvents(updated);
    setIsEditModalOpen(false);
    setEditingEventId(null);
  };

  // Add new Event
  const handleAddEvent = (type: "hito" | "periodo" = "hito", customDate?: string) => {
    const nextId = Math.max(1, ...currentEvents.map((e) => e.id)) + 1;
    const startDate = customDate || formatDateToIso(new Date());
    const endDate = type === "periodo" ? formatDateToIso(new Date(parseIsoDate(startDate).getTime() + 7 * ONE_DAY_MS)) : undefined;

    const newEv: TimelineEvent = {
      id: nextId,
      description: `Nuevo ${type === "hito" ? "Hito" : "Periodo"} #${nextId}`,
      startDate,
      endDate,
      category: "lectivo",
      level: activeLevel,
      udId: activeLevel === "unidad" ? activeUdId : undefined,
    };

    setCurrentEvents([...currentEvents, newEv]);
    setSelectedEventIds(new Set([nextId]));
    openEditModal(newEv);
  };

  // Delete event
  const handleDeleteEvent = (id: number) => {
    setCurrentEvents(currentEvents.filter((e) => e.id !== id));
    setSelectedEventIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
  };

  // Duplicate event
  const handleDuplicateEvent = (id: number) => {
    const ev = currentEvents.find((e) => e.id === id);
    if (!ev) return;
    const nextId = Math.max(1, ...currentEvents.map((e) => e.id)) + 1;
    const clone: TimelineEvent = {
      ...ev,
      id: nextId,
      description: `${ev.description} (Copia)`,
    };
    setCurrentEvents([...currentEvents, clone]);
    setSelectedEventIds(new Set([nextId]));
  };

  // Toggle visible/hidden
  const handleToggleHidden = (id: number) => {
    setCurrentEvents(
      currentEvents.map((e) => (e.id === id ? { ...e, hidden: !e.hidden } : e))
    );
  };

  // Bulk actions
  const handleBulkShow = () => {
    setCurrentEvents(
      currentEvents.map((e) => (selectedEventIds.has(e.id) ? { ...e, hidden: false } : e))
    );
  };

  const handleBulkHide = () => {
    setCurrentEvents(
      currentEvents.map((e) => (selectedEventIds.has(e.id) ? { ...e, hidden: true } : e))
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`¿Eliminar ${selectedEventIds.size} eventos seleccionados?`)) {
      setCurrentEvents(currentEvents.filter((e) => !selectedEventIds.has(e.id)));
      setSelectedEventIds(new Set());
    }
  };

  // Synchronize 1-Click with SIGRE curriculum
  const handleSyncWithSigre = () => {
    if (activeLevel === "modulo") {
      let generated: TimelineEvent[] = [];
      if (currentModule) {
        generated = generateModuleTimelineFromCalendar(currentModule);
      } else {
        generated = generateModuleTimelineFromUds(uds, config, timelineData.schoolYear);
      }
      setCurrentEvents(generated);
      setSaveBanner(`¡Sincronizado cronograma del Módulo ${currentModule?.codigoModulo || config.moduloFormativo} (${generated.length} hitos y periodos generados a partir de sus UDs y calendario escolar)!`);
      setTimeout(() => setSaveBanner(null), 4000);
    } else if (activeLevel === "unidad") {
      const activeUd = uds.find((u) => u.id === activeUdId) || uds[0];
      if (activeUd) {
        const generated = generateUnitTimelineFromUd(activeUd, timelineData.schoolYear);
        setCurrentEvents(generated);
        setSaveBanner(`¡Sincronizadas sesiones de la ${activeUd.id} (${generated.length} sesiones e hitos evaluativos)!`);
        setTimeout(() => setSaveBanner(null), 4000);
      }
    } else if (activeLevel === "curso") {
      const { startYear } = getSchoolYearRange(timelineData.schoolYear);
      const generated = getDefaultCursoTimelineEvents(startYear);
      setCurrentEvents(generated);
      setSaveBanner("¡Restablecido cronograma oficial de Curso Académico (32 semanas + Mes de Junio)!");
      setTimeout(() => setSaveBanner(null), 4000);
    } else if (activeLevel === "profesor") {
      const { startYear } = getSchoolYearRange(timelineData.schoolYear);
      const generated = getDefaultProfesorTimelineEvents(startYear);
      setCurrentEvents(generated);
      setSaveBanner("¡Restablecido cronograma docente departamental y claustro!");
      setTimeout(() => setSaveBanner(null), 4000);
    }
  };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const dateAtClick = xToDate(mouseX, scale, panOffset);

    const targetCard = (e.target as HTMLElement).closest("[data-event-id]");
    const eventId = targetCard ? Number(targetCard.getAttribute("data-event-id")) : null;

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      date: dateAtClick,
      eventId,
    });
  };

  // Close context menu on global click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [contextMenu.visible]);

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timelineData, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `sigre-cronograma-${activeLevel}-${timelineData.schoolYear}.json`);
    dl.click();
    dl.remove();
  };

  // Import JSON
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed)) {
            setCurrentEvents(parsed);
          } else if (parsed.cursoEvents || parsed.moduloEvents) {
            setTimelineData(parsed);
          }
          setSaveBanner("¡Datos importados con éxito!");
          setTimeout(() => setSaveBanner(null), 3000);
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Paste JSON
  const handleConfirmPasteJson = () => {
    try {
      const parsed = JSON.parse(pasteJsonText);
      if (Array.isArray(parsed)) {
        setCurrentEvents(parsed);
      } else if (parsed && typeof parsed === "object") {
        setTimelineData(parsed);
      }
      setIsPasteJsonModalOpen(false);
      setPasteJsonText("");
      setSaveBanner("¡JSON cargado correctamente!");
      setTimeout(() => setSaveBanner(null), 3000);
    } catch (e: any) {
      alert("JSON inválido: " + e.message);
    }
  };

  // Export PNG / JPG / Print
  const handleExportImage = (format: "png" | "jpeg" | "print") => {
    if (!timelineContainerRef.current) return;
    if (format === "print") {
      window.print();
      setIsExportModalOpen(false);
      return;
    }

    import("html-to-image")
      .then((htmlToImage) => {
        const node = timelineContainerRef.current;
        if (!node) return;
        const options = {
          backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
          quality: 0.95,
        };
        const exportFn = format === "png" ? htmlToImage.toPng : htmlToImage.toJpeg;
        exportFn(node, options)
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.download = `cronograma-sigre-${activeLevel}.${format}`;
            link.href = dataUrl;
            link.click();
            setIsExportModalOpen(false);
          })
          .catch((err) => {
            console.error("Error exporting image", err);
            alert("No se pudo generar la imagen.");
          });
      })
      .catch(() => {
        alert("Generador de imagen no disponible.");
      });
  };

  // Filtered & sorted table events
  const filteredTableEvents = useMemo(() => {
    let list = [...currentEvents];
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (e) => e.description.toLowerCase().includes(s) || String(e.id).includes(s) || e.startDate.includes(s)
      );
    }

    list.sort((a, b) => {
      let valA: any = a[sortColumn] || "";
      let valB: any = b[sortColumn] || "";
      if (sortColumn === "id") {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [currentEvents, searchTerm, sortColumn, sortAsc]);

  // Layout calculation for SVG & HTML Cards (Multi-Lane Auto Collision Prevention)
  const layoutCalculations = useMemo(() => {
    const validEvents = currentEvents
      .filter((e) => e.startDate && !isNaN(new Date(`${e.startDate}T00:00:00`).getTime()))
      .sort((a, b) => new Date(`${a.startDate}T00:00:00`).getTime() - new Date(`${b.startDate}T00:00:00`).getTime());

    const topLanes: number[] = [];
    const bottomLanes: number[] = [];
    const periodLanes: number[] = [];

    const eventBoxWidth = 215;
    const buffer = 16;

    const findLane = (lanes: number[], boxStartX: number) => {
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] + buffer < boxStartX) return i;
      }
      return lanes.length;
    };

    // 1. Periods (Horizontal Bars on timeline axis)
    const periods = validEvents
      .filter((e) => e.endDate && e.startDate !== e.endDate)
      .map((event) => {
        const startX = dateToX(event.startDate, scale, panOffset);
        const endX = dateToX(event.endDate || event.startDate, scale, panOffset);
        let laneIndex = periodLanes.findIndex((l) => l < startX);
        if (laneIndex === -1) laneIndex = periodLanes.length;
        periodLanes[laneIndex] = endX;
        return { event, startX, endX, laneIndex, width: Math.max(6, endX - startX) };
      });

    // 2. Cards (Milestones + Period labels)
    const cards = validEvents.map((event) => {
      const isPeriod = Boolean(event.endDate && event.startDate !== event.endDate);
      const startX = dateToX(event.startDate, scale, panOffset);
      const boxStartX = startX - eventBoxWidth / 2;

      let isAbove: boolean;
      if (event.forcedPosition === "top") isAbove = true;
      else if (event.forcedPosition === "bottom") isAbove = false;
      else isAbove = topLanes.length <= bottomLanes.length;

      let laneIndex = isAbove ? findLane(topLanes, boxStartX) : findLane(bottomLanes, boxStartX);

      if (isAbove) topLanes[laneIndex] = boxStartX + eventBoxWidth;
      else bottomLanes[laneIndex] = boxStartX + eventBoxWidth;

      return {
        event,
        isPeriod,
        startX,
        boxStartX,
        isAbove,
        laneIndex,
        boxWidth: eventBoxWidth,
      };
    });

    return { periods, cards };
  }, [currentEvents, scale, panOffset]);

  // Today marker
  const todayIso = formatDateToIso(new Date());
  const todayX = dateToX(todayIso, scale, panOffset);

  return (
    <div
      id="sigre-timeline-main-container"
      className={`font-sans select-none transition-all duration-150 ${
        isMaximized
          ? "fixed inset-0 z-50 bg-[#0c1017] dark:bg-[#0c1017] p-3 md:p-4 flex flex-col h-screen w-screen overflow-hidden shadow-2xl backdrop-blur-md space-y-2.5"
          : "w-full space-y-4 relative"
      }`}
    >
      {/* Level Selection Bar (Curso • Profesor • Módulo • Unidad) */}
      <div className="p-2.5 md:p-3 bg-surface/90 border border-border-default rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLevel("curso")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeLevel === "curso"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-alt border border-transparent"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>1. Nivel de Curso</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/15 font-mono">32s + Jun</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLevel("profesor")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeLevel === "profesor"
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-alt border border-transparent"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Nivel de Profesor</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 font-mono">Docente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLevel("modulo")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeLevel === "modulo"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-alt border border-transparent"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3. Nivel de Módulo</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/15 font-mono">FCE + FFEOE</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveLevel("unidad")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeLevel === "unidad"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                : "text-text-secondary hover:text-text-primary hover:bg-alt border border-transparent"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>4. Nivel de Unidad (UD)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/15 font-mono">Sesiones</span>
          </button>
        </div>

        {/* UD Selector when in Unidad Level */}
        {activeLevel === "unidad" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-bold">UD Activa:</span>
            <select
              value={activeUdId}
              onChange={(e) => {
                setActiveUdId(e.target.value);
                if (onSelectUd) onSelectUd(e.target.value);
              }}
              className="px-3 py-1.5 bg-alt border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none"
            >
              {uds.length > 0 ? (
                uds.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullCode || u.id} ({u.horasEstimadas || 16}h • {u.sesionesEstimadas || 8} ses.)
                  </option>
                ))
              ) : (
                <option value="UD01">UD01. Unidad Didáctica 01</option>
              )}
            </select>
          </div>
        )}

        {/* Course Cronograma Selector when in Curso Level */}
        {activeLevel === "curso" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted font-bold">Cronograma de Curso:</span>
            <select
              value={activeCursoCronogramaId}
              onChange={(e) => handleSelectCursoCronograma(e.target.value)}
              className="px-3 py-1.5 bg-alt border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-400 focus:outline-none max-w-[280px] truncate"
            >
              {(timelineData.cursoCronogramas || []).map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.category || "CURSO"}] {c.name} ({c.events.length} ev.)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Module Selector when in Modulo Level */}
        {activeLevel === "modulo" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted font-bold">Módulo Activo:</span>
            <select
              value={currentModuleId}
              onChange={(e) => {
                const newModId = e.target.value;
                setCurrentModuleId(newModId);
                if (onSelectModule) onSelectModule(newModId);
              }}
              className="px-3 py-1.5 bg-alt border border-amber-500/40 rounded-xl text-xs font-bold text-amber-400 focus:outline-none max-w-[280px] truncate"
            >
              {allModules.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.codigoModulo || "MOD"}] {m.moduloFormativo || "Módulo"} ({m.academicYear || "2026-2027"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* School Year Selector & Optional Close Button */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted font-bold">Curso:</label>
          <input
            type="text"
            value={timelineData.schoolYear}
            onChange={(e) => setTimelineData({ ...timelineData, schoolYear: e.target.value })}
            className="w-24 px-2 py-1 bg-alt border border-border-default rounded-lg text-xs font-mono font-bold text-center text-text-primary"
            placeholder="2026-2027"
          />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary rounded-lg border border-border-default transition-colors cursor-pointer"
              title="Cerrar vista de cronograma y volver"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Course Multi-Cronograma Strip when in Curso Level */}
      {activeLevel === "curso" && (
        <div className="p-3 bg-surface border border-cyan-500/30 rounded-2xl space-y-2.5 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-500 text-black font-mono shadow-xs flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>NIVEL CURSO</span>
              </span>
              <span className="font-bold text-text-primary text-xs">
                {activeCursoItem?.name || "Cronograma Oficial de Curso"}
              </span>
              {activeCursoItem?.category && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {activeCursoItem.category}
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-alt text-text-muted border border-border-default">
                {activeCursoItem?.events?.length || 0} hitos y periodos
              </span>
            </div>

            {/* Actions: + Nuevo Cronograma, Duplicar, Renombrar, Eliminar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setNewCursoName("");
                  setNewCursoCategory("1º Curso FP");
                  setNewCursoTemplate("fp1");
                  setIsNewCursoModalOpen(true);
                }}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                title="Crear un nuevo cronograma a nivel de curso"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Cronograma</span>
              </button>

              {activeCursoItem && (
                <>
                  <button
                    type="button"
                    onClick={() => handleDuplicateCursoCronograma(activeCursoItem)}
                    className="px-2 py-1 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary border border-border-default rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Duplicar este cronograma de curso"
                  >
                    <Copy className="w-3 h-3 text-cyan-400" />
                    <span className="hidden md:inline">Duplicar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRenameModal(activeCursoItem)}
                    className="px-2 py-1 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary border border-border-default rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Renombrar título y categoría"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    <span className="hidden md:inline">Renombrar</span>
                  </button>

                  {(timelineData.cursoCronogramas || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCursoCronograma(activeCursoItem.id, activeCursoItem.name)}
                      className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      title="Eliminar este cronograma de curso"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden md:inline">Eliminar</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Course Cronogramas Selector Tabs/Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-border-subtle/50">
            <span className="text-[11px] font-bold text-text-muted shrink-0 mr-0.5 flex items-center gap-1">
              Cronogramas Disponibles ({(timelineData.cursoCronogramas || []).length}):
            </span>
            {(timelineData.cursoCronogramas || []).map((crono) => {
              const isSelected = crono.id === activeCursoCronogramaId;
              return (
                <button
                  key={crono.id}
                  type="button"
                  onClick={() => handleSelectCursoCronograma(crono.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 ring-2 ring-cyan-500/20 shadow-xs"
                      : "bg-alt text-text-secondary hover:text-text-primary border-border-default hover:border-border-strong"
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${isSelected ? "bg-cyan-500 text-black" : "bg-surface text-text-muted"}`}>
                    {crono.category || "CURSO"}
                  </span>
                  <span className="max-w-[200px] sm:max-w-[280px] truncate">{crono.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({crono.events.length} ev.)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Portfolio Strip when in Modulo Level */}
      {activeLevel === "modulo" && (
        <div className="p-3 bg-surface border border-amber-500/30 rounded-2xl space-y-2.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-default pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-black font-mono shadow-xs">
                {currentModule?.codigoModulo || "MÓDULO"}
              </span>
              <span className="font-bold text-text-primary text-xs">
                {currentModule?.moduloFormativo || config.moduloFormativo}
              </span>
              <span className="text-[11px] text-text-muted hidden md:inline">
                ({currentModule?.cicloFormativo || "Formación Profesional"})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-alt text-amber-400 border border-amber-500/30">
                🎓 {currentModule?.academicYear || timelineData.schoolYear}
              </span>
            </div>

            {/* Sub-view switcher for single module vs multi-module portfolio */}
            <div className="flex items-center gap-1 bg-alt p-0.5 rounded-xl border border-border-default text-xs">
              <button
                type="button"
                onClick={() => setModulePortfolioView("single")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modulePortfolioView === "single"
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cronograma del Módulo</span>
              </button>
              <button
                type="button"
                onClick={() => setModulePortfolioView("all_modules")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  modulePortfolioView === "all_modules"
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Comparativa Multimódulo ({allModules.length})</span>
              </button>
            </div>
          </div>

          {/* Module Selector Chips - Multi-row wrapped layout without scrollbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-border-subtle/50">
            <span className="text-[11px] font-bold text-text-muted shrink-0 mr-0.5 flex items-center gap-1">
              Cartera de Módulos:
            </span>
            {allModules.map((m) => {
              const isSelected = m.id === currentModuleId;
              const udsCount = m.legendItems.filter((leg) => leg.type === "ud_ra").length;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setCurrentModuleId(m.id);
                    if (onSelectModule) onSelectModule(m.id);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    if (onOpenModuleCurriculum) {
                      onOpenModuleCurriculum(m, "unidades");
                    }
                  }}
                  title="Clic para seleccionar cronograma • Doble clic para abrir en Diseñador Curricular de UDs"
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                      : "bg-alt text-text-secondary hover:text-text-primary border-border-default hover:border-border-strong"
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${isSelected ? "bg-amber-500 text-black" : "bg-surface"}`}>
                    {m.codigoModulo || "MOD"}
                  </span>
                  <span className="max-w-[180px] sm:max-w-[240px] truncate">{m.moduloFormativo}</span>
                  <span className="text-[10px] opacity-75 font-mono">({udsCount} UDs)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Notification Banner */}
      {saveBanner && (
        <div className="p-3 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-amber-500/20 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Main Controls Toolbar */}
      <div className="p-2.5 bg-surface border border-border-default rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAddEvent("hito")}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Hito
          </button>
          <button
            type="button"
            onClick={() => handleAddEvent("periodo")}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Periodo
          </button>

          <button
            type="button"
            onClick={handleSyncWithSigre}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sincronizar automáticamente con las UDs y parámetros del plan curricular"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Sincronizar con Plan Curricular
          </button>
        </div>

        {/* Canvas view controls (Zoom presets, zoom buttons, weekends toggle, export) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Quick Zoom Presets */}
          <div className="hidden lg:flex items-center gap-0.5 bg-alt border border-border-default p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => applyZoomPreset("curso")}
              className="px-2 py-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Vista global del curso (36 semanas)"
            >
              Curso
            </button>
            <button
              type="button"
              onClick={() => applyZoomPreset("trimestre1")}
              className="px-2 py-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Primer Trimestre (Sep - Dic)"
            >
              1T
            </button>
            <button
              type="button"
              onClick={() => applyZoomPreset("trimestre2")}
              className="px-2 py-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Segundo Trimestre (Ene - Mar)"
            >
              2T
            </button>
            <button
              type="button"
              onClick={() => applyZoomPreset("trimestre3")}
              className="px-2 py-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Tercer Trimestre (Abr - Jun)"
            >
              3T
            </button>
            <button
              type="button"
              onClick={() => applyZoomPreset("mes")}
              className="px-2 py-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Vista mensual detallada (4 semanas)"
            >
              Mes
            </button>
            <button
              type="button"
              onClick={() => applyZoomPreset("dia")}
              className="px-2 py-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Vista día a día de alta resolución"
            >
              Día
            </button>
          </div>

          {/* Toggle Weekends & Daily Guides */}
          <button
            type="button"
            id="toggle-weekends"
            onClick={() => setShowWeekends(!showWeekends)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs ${
              showWeekends ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-alt text-text-muted border-border-default hover:text-text-primary"
            }`}
            title="Mostrar / Ocultar Guías (Fines de semana y ticks diarios)"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guías y Fines de Semana</span>
          </button>

          {/* Toggle Labels (Ocultar / Mostrar etiquetas) */}
          <button
            type="button"
            id="toggle-hide-labels"
            onClick={() => setHideLabels(!hideLabels)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs ${
              hideLabels
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                : "bg-alt text-text-muted border-border-default hover:text-text-primary"
            }`}
            title={hideLabels ? "Mostrar todas las etiquetas flotantes" : "Ocultar todas las etiquetas flotantes"}
          >
            {hideLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{hideLabels ? "Mostrar Etiquetas" : "Ocultar Etiquetas"}</span>
          </button>

          {/* Manual Zoom In / Out / Fit */}
          <div className="flex items-center gap-1 bg-alt border border-border-default p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => handleZoom("out")}
              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              title="Reducir Zoom (o rueda del ratón hacia abajo)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom("reset")}
              className="text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 px-1 cursor-pointer"
              title="Restablecer zoom al 100%"
            >
              {Math.round(pixelsPerDay * 22)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom("in")}
              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              title="Aumentar Zoom (o rueda del ratón hacia arriba)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom("fit")}
              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              title="Ajustar al ancho de pantalla"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-border-default mx-1" />

          {/* Import / Export actions */}
          <button
            type="button"
            onClick={() => setIsPasteJsonModalOpen(true)}
            className="p-1.5 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary rounded-lg border border-border-default cursor-pointer"
            title="Pegar JSON"
          >
            <FileCode className="w-4 h-4" />
          </button>

          <label
            className="p-1.5 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary rounded-lg border border-border-default cursor-pointer"
            title="Importar archivo JSON (o arrastrar al cronograma)"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExportJson}
            className="p-1.5 bg-alt hover:bg-hover text-text-secondary hover:text-text-primary rounded-lg border border-border-default cursor-pointer"
            title="Descargar Datos JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Exportar Gráfico
          </button>

          {/* Toggle Collapsible Right Pane (Tabla / Leyendas) */}
          <button
            type="button"
            id="btn-toggle-right-table-pane"
            onClick={() => setIsRightPaneCollapsed((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isRightPaneCollapsed
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                : "bg-alt hover:bg-hover text-text-primary border-border-default hover:border-amber-500/40"
            }`}
            title={isRightPaneCollapsed ? "Mostrar columna lateral de tabla y leyendas" : "Ocultar columna lateral de tabla y leyendas"}
          >
            {isRightPaneCollapsed ? (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Mostrar Tabla</span>
              </>
            ) : (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-text-secondary" />
                <span>Ocultar Tabla</span>
              </>
            )}
          </button>

          {/* Maximize / Minimize Section Button */}
          <button
            type="button"
            id="btn-toggle-maximize-timeline"
            onClick={() => setIsMaximized((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isMaximized
                ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-400 ring-2 ring-amber-500/30"
                : "bg-alt hover:bg-hover text-text-primary border-border-default hover:border-amber-500/50"
            }`}
            title={isMaximized ? "Minimizar sección / Salir de pantalla completa (Esc)" : "Maximizar sección de cronograma a pantalla completa"}
          >
            {isMaximized ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-black" />
                <span>Minimizar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Maximizar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split-Pane: Visual Timeline (Left) & Resizer & Data Table Editor (Right) */}
      <div
        ref={splitContainerRef}
        className={`w-full flex flex-col md:flex-row border border-border-default rounded-2xl overflow-hidden bg-background shadow-lg relative ${
          isMaximized ? "flex-1 h-full min-h-0" : "min-h-[560px]"
        }`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Left Pane: Interactive Timeline Canvas */}
        <div
          ref={timelineContainerRef}
          style={{
            width: isRightPaneCollapsed ? "100%" : `${leftPanePercent}%`,
            flexBasis: isRightPaneCollapsed ? "100%" : `${leftPanePercent}%`,
          }}
          className={`relative overflow-hidden bg-alt/30 cursor-grab active:cursor-grabbing border-b md:border-b-0 ${
            !isRightPaneCollapsed ? "md:border-r border-border-default" : ""
          } shrink-0 ${isMaximized ? "h-full" : "h-[560px]"}`}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onContextMenu={handleContextMenu}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOverCanvas(true);
          }}
          onDragLeave={() => setIsDragOverCanvas(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOverCanvas(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const parsed = JSON.parse(event.target?.result as string);
                  if (Array.isArray(parsed)) {
                    setCurrentEvents(parsed);
                    setSaveBanner("¡Cronograma importado exitosamente desde archivo JSON!");
                    setTimeout(() => setSaveBanner(null), 3500);
                  }
                } catch {
                  alert("Error al leer el archivo JSON.");
                }
              };
              reader.readAsText(file);
            }
          }}
        >
          {/* Header Info Label & Red Floating Date Pill */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-surface/90 backdrop-blur-xs border border-border-default rounded-lg text-xs font-bold text-text-primary shadow-xs">
                {activeLevel === "curso" && "🎓 Cronograma de Curso Académico (32 Semanas)"}
                {activeLevel === "profesor" && "👨‍🏫 Cronograma Docente y Departamental"}
                {activeLevel === "modulo" && (modulePortfolioView === "all_modules" ? `🌐 Comparativa Multimódulo (${allModules.length} Módulos en Cartera)` : `📚 Cronograma del Módulo [${currentModule?.codigoModulo || "MOD"}] ${currentModule?.moduloFormativo || config.moduloFormativo}`)}
                {activeLevel === "unidad" && `🎯 Cronograma de Sesiones (${activeUdId})`}
              </span>
            </div>

            {/* Pinned Red Date Badge matching original webapp screenshot */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#dc0d15] text-white rounded-md text-[11px] font-mono font-bold shadow-md w-fit select-none">
              <Calendar className="w-3 h-3 text-white shrink-0" />
              <span>
                {hoverDateText
                  ? hoverDateText.split(" • ")[0]
                  : new Date().toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
              </span>
            </div>
          </div>

          {/* Quick Reveal Button when Right Table is Collapsed */}
          {isRightPaneCollapsed && (
            <button
              type="button"
              onClick={() => setIsRightPaneCollapsed(false)}
              className="absolute top-3 right-3 z-30 px-3 py-1.5 bg-surface/90 hover:bg-surface border border-amber-500/60 hover:border-amber-400 text-amber-400 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
              title="Mostrar panel de tabla y leyendas"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              <span>Mostrar Tabla y Leyendas</span>
            </button>
          )}

          {/* Drag & Drop JSON Overlay */}
          {isDragOverCanvas && (
            <div className="absolute inset-0 z-40 bg-amber-500/20 backdrop-blur-xs border-4 border-dashed border-amber-500 rounded-2xl flex flex-col items-center justify-center text-amber-400 p-6 text-center pointer-events-none">
              <Upload className="w-12 h-12 mb-2 animate-bounce" />
              <p className="text-base font-bold text-text-primary">Suelta el archivo JSON aquí para cargar el cronograma</p>
              <p className="text-xs text-text-muted mt-1">Soporta estructuras completas de eventos y periodos SIGRE</p>
            </div>
          )}

          {/* SVG Axis Layer */}
          <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Weekend & Weekday Bands (Rendered at background layer) */}
            {showWeekends && (() => {
              const elements: React.ReactNode[] = [];
              const iterDate = new Date(scale.minDate.getTime());

              while (iterDate <= scale.maxDate) {
                const x = dateToX(iterDate, scale, panOffset);
                const dayOfWeek = iterDate.getDay();

                if (x > -120 && x < 2600) {
                  const nextDate = new Date(iterDate.getTime() + ONE_DAY_MS);
                  const endX = dateToX(nextDate, scale, panOffset);
                  const bandWidth = Math.max(0, endX - x);

                  // Fin de semana (Sábado: 6, Domingo: 0) -> ZONA MÁS CLARA
                  // Días laborables (L-V: 1-5) -> ZONA MÁS OSCURA
                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                    elements.push(
                      <rect
                        key={`wknd-bg-${iterDate.toISOString()}`}
                        x={x}
                        y={0}
                        width={bandWidth}
                        height={560}
                        fill="rgba(255, 255, 255, 0.08)"
                        className="dark:fill-white/[0.08] fill-white/80 pointer-events-none"
                      />
                    );
                  } else {
                    elements.push(
                      <rect
                        key={`wkdy-bg-${iterDate.toISOString()}`}
                        x={x}
                        y={0}
                        width={bandWidth}
                        height={560}
                        fill="rgba(0, 0, 0, 0.45)"
                        className="dark:fill-black/55 fill-slate-950/10 pointer-events-none"
                      />
                    );
                  }
                }
                iterDate.setDate(iterDate.getDate() + 1);
              }
              return <g>{elements}</g>;
            })()}

            {/* Months Axis Bar */}
            {(() => {
              const SHORT_MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEPT", "OCT", "NOV", "DIC"];
              const elements: React.ReactNode[] = [];
              let curMonth = new Date(scale.minDate.getFullYear(), scale.minDate.getMonth(), 1);
              const axisY = 280;
              const axisHeight = 36;

              while (curMonth <= scale.maxDate) {
                const nextMonth = new Date(curMonth.getFullYear(), curMonth.getMonth() + 1, 1);
                const startX = dateToX(curMonth > scale.minDate ? curMonth : scale.minDate, scale, panOffset);
                const endX = dateToX(nextMonth < scale.maxDate ? nextMonth : scale.maxDate, scale, panOffset);

                if (endX > -100 && startX < 2500) {
                  const mIndex = curMonth.getMonth();
                  const mColor = MONTH_COLORS_TIMELINE[mIndex];
                  const mName = SHORT_MONTHS[mIndex];

                  elements.push(
                    <rect
                      key={`mbar-${curMonth.toISOString()}`}
                      x={startX}
                      y={axisY - axisHeight / 2}
                      width={Math.max(0, endX - startX)}
                      height={axisHeight}
                      fill={mColor}
                      rx="2"
                      className="opacity-95"
                    />
                  );

                  elements.push(
                    <text
                      key={`mlbl-${curMonth.toISOString()}`}
                      x={startX + (endX - startX) / 2}
                      y={axisY + 5}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono tracking-wider drop-shadow-xs select-none"
                    >
                      {mName}
                    </text>
                  );
                }
                curMonth = nextMonth;
              }
              return <g>{elements}</g>;
            })()}

            {/* Day Ticks & Day-of-Week Letters (Rendered directly under Month Axis Bar) */}
            {showWeekends && (() => {
              const dayChars = ["D", "L", "M", "X", "J", "V", "S"];
              const elements: React.ReactNode[] = [];
              const iterDate = new Date(scale.minDate.getTime());
              const axisY = 280;
              const axisHeight = 36;

              while (iterDate <= scale.maxDate) {
                const x = dateToX(iterDate, scale, panOffset);
                const dayOfWeek = iterDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                if (x > -100 && x < 2500) {
                  // Day tick line
                  elements.push(
                    <line
                      key={`tick-${iterDate.toISOString()}`}
                      x1={x}
                      x2={x}
                      y1={axisY + axisHeight / 2}
                      y2={axisY + axisHeight / 2 + 7}
                      stroke="currentColor"
                      className="text-border-default/80"
                      strokeWidth="1"
                    />
                  );

                  // Day char label (e.g. V, S, D, L, M, X, J) and day number when zoomed in
                  if (scale.pixelsPerDay > 4) {
                    const dayNum = iterDate.getDate();
                    const showNumber = scale.pixelsPerDay >= 12;

                    elements.push(
                      <g key={`lbl-grp-${iterDate.toISOString()}`}>
                        {showNumber && (
                          <text
                            x={x + scale.pixelsPerDay / 2}
                            y={axisY + axisHeight / 2 + 13}
                            className="text-[8px] fill-text-muted font-mono font-bold text-center select-none"
                            textAnchor="middle"
                          >
                            {dayNum}
                          </text>
                        )}
                        <text
                          x={x + scale.pixelsPerDay / 2}
                          y={axisY + axisHeight / 2 + (showNumber ? 23 : 17)}
                          className={`text-[9px] font-mono font-bold text-center select-none ${
                            isWeekend ? "fill-amber-400 dark:fill-amber-400 font-extrabold" : "fill-text-secondary"
                          }`}
                          textAnchor="middle"
                        >
                          {dayChars[dayOfWeek]}
                        </text>
                      </g>
                    );
                  }
                }
                iterDate.setDate(iterDate.getDate() + 1);
              }
              return <g>{elements}</g>;
            })()}

            {/* Today Line with HOY badge */}
            {todayX > -50 && todayX < 3000 && (
              <g>
                <line
                  x1={todayX}
                  x2={todayX}
                  y1={0}
                  y2={560}
                  stroke="#dc0d15"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={todayX + 4}
                  y={18}
                  fill="#dc0d15"
                  fontSize="11"
                  fontWeight="900"
                  className="font-mono tracking-wider select-none"
                >
                  HOY
                </text>
              </g>
            )}

            {/* Period Bars on Axis */}
            {layoutCalculations.periods.map(({ event, startX, endX, laneIndex, width }) => {
              const axisY = 280;
              const y = axisY - 24 - (laneIndex + 1) * 12;
              const isSelected = selectedEventIds.has(event.id);
              return (
                <g key={`pbar-${event.id}`}>
                  <rect
                    x={startX}
                    y={y}
                    width={width}
                    height={8}
                    rx="4"
                    fill={event.bgColor || "#0d6efd"}
                    stroke={isSelected ? "#ffffff" : event.borderColor || "#0b5ed7"}
                    strokeWidth={isSelected ? "2" : "1"}
                    className="cursor-pointer pointer-events-auto"
                    onClick={() => {
                      setSelectedEventIds(new Set([event.id]));
                    }}
                  />
                  {/* Left handle for resizing */}
                  <rect
                    x={startX - 4}
                    y={y - 2}
                    width={8}
                    height={12}
                    rx="2"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1"
                    className="cursor-ew-resize pointer-events-auto opacity-80 hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, event, "resize-start")}
                  />
                  {/* Right handle for resizing */}
                  <rect
                    x={endX - 4}
                    y={y - 2}
                    width={8}
                    height={12}
                    rx="2"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="1"
                    className="cursor-ew-resize pointer-events-auto opacity-80 hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, event, "resize-end")}
                  />
                </g>
              );
            })}

            {/* Stem connectors from axis to floating cards */}
            {!hideLabels &&
              layoutCalculations.cards.map(({ event, startX, isPeriod, isAbove, laneIndex }) => {
                if (event.hidden) return null;
                const axisY = 280;
                const cardHeight = 78;
                const verticalPadding = 14;
                const stemLength = 22;

                let boxY: number;
                if (isAbove) {
                  boxY = axisY - 18 - stemLength - cardHeight - laneIndex * (cardHeight + verticalPadding);
                } else {
                  boxY = axisY + 18 + stemLength + laneIndex * (cardHeight + verticalPadding);
                }

                const isSelected = selectedEventIds.has(event.id);
                const visuals = getTimelineEventVisuals(event, isPeriod, isSelected);
                const isMilestone = !event.endDate || event.startDate === event.endDate;

                return (
                  <g key={`stem-${event.id}`}>
                    {/* Circle milestone indicator on axis */}
                    {isMilestone && (
                      <circle
                        cx={startX}
                        cy={isAbove ? axisY - 18 : axisY + 18}
                        r={4.5}
                        fill={visuals.borderColor}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    )}
                    {/* Line */}
                    <line
                      x1={startX}
                      x2={startX}
                      y1={isAbove ? axisY - 18 : axisY + 18}
                      y2={isAbove ? boxY + cardHeight : boxY}
                      stroke={visuals.stemColor}
                      strokeWidth="1.5"
                      className="opacity-85"
                    />
                  </g>
                );
              })}
          </svg>

          {/* HTML Floating Cards Layer */}
          {!hideLabels && (
            <div ref={eventsLayerRef} className="absolute inset-0 pointer-events-none z-10">
              {layoutCalculations.cards.map(({ event, isPeriod, startX, boxStartX, isAbove, laneIndex, boxWidth }) => {
                if (event.hidden) return null;
                const axisY = 280;
                const cardHeight = 78;
                const verticalPadding = 14;
                const stemLength = 22;

                let boxY: number;
                if (isAbove) {
                  boxY = axisY - 18 - stemLength - cardHeight - laneIndex * (cardHeight + verticalPadding);
                } else {
                  boxY = axisY + 18 + stemLength + laneIndex * (cardHeight + verticalPadding);
                }

                const isSelected = selectedEventIds.has(event.id);
                const visuals = getTimelineEventVisuals(event, isPeriod, isSelected);

                const hasEndDate = event.endDate && event.startDate !== event.endDate;
                const startFormatted = formatSpanishUpperDate(event.startDate);
                const endFormatted = hasEndDate ? formatSpanishUpperDate(event.endDate!) : null;

                return (
                  <div
                    key={`card-${event.id}`}
                    data-event-id={event.id}
                    style={{
                      left: `${boxStartX}px`,
                      top: `${boxY}px`,
                      width: `${boxWidth}px`,
                      backgroundColor: visuals.cardBg,
                      color: visuals.textColor,
                      borderColor: visuals.borderColor,
                    }}
                    onMouseDown={(e) => handleCardDragStart(e, event)}
                    onDoubleClick={() => openEditModal(event)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventIds(new Set([event.id]));
                    }}
                    className={`absolute pointer-events-auto rounded-lg px-3 py-2 text-xs border-[1.5px] shadow-md transition-all cursor-move flex flex-col justify-between select-none group ${
                      isSelected
                        ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 z-20 shadow-xl scale-[1.02]"
                        : "hover:shadow-lg hover:z-10 hover:brightness-110"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <div
                          className="flex flex-col text-[10.5px] font-bold tracking-tight leading-[1.25] select-none"
                          style={{ color: visuals.dateColor }}
                        >
                          <span>{startFormatted}</span>
                          {endFormatted && <span>{endFormatted}</span>}
                        </div>

                        {/* Category Badge Pill */}
                        <span
                          className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${visuals.badgeClass}`}
                        >
                          {visuals.badgeLabel}
                        </span>
                      </div>
                    </div>

                    <p
                      style={{ color: visuals.textColor }}
                      className="text-[12px] font-medium leading-snug line-clamp-2 mt-1 tracking-tight"
                      title={event.description}
                    >
                      {event.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Date tooltip under cursor */}
          {hoverDateText && !isPanning && !dragState.active && (
            <div
              id="date-cursor-tooltip"
              style={{
                left: `${cursorPos.x - (timelineContainerRef.current?.getBoundingClientRect().left || 0)}px`,
                top: `${cursorPos.y - (timelineContainerRef.current?.getBoundingClientRect().top || 0) - 34}px`,
              }}
              className="absolute pointer-events-none z-30 px-3 py-1 bg-surface/95 border border-amber-500/80 text-text-primary font-medium text-[10px] rounded-lg shadow-xl backdrop-blur-xs transform -translate-x-1/2 flex items-center gap-1.5"
            >
              <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{hoverDateText}</span>
            </div>
          )}
        </div>

        {/* Resizer Divider Bar (Hidden when Right Pane is collapsed) */}
        {!isRightPaneCollapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingPane(true);
            }}
            className={`hidden md:flex flex-col items-center justify-center w-2.5 hover:w-3.5 bg-border-default hover:bg-amber-500 cursor-col-resize transition-all z-20 shrink-0 select-none relative group ${
              isResizingPane ? "bg-amber-500 w-3.5 ring-2 ring-amber-400/50" : ""
            }`}
            title="Arrastrar para ajustar ancho • Doble clic para colapsar"
            onDoubleClick={() => setIsRightPaneCollapsed(true)}
          >
            <div className="w-1 h-10 bg-text-muted/60 rounded-full pointer-events-none mb-2" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRightPaneCollapsed(true);
              }}
              className="w-4 h-6 bg-surface border border-border-default hover:border-amber-500 rounded-r flex items-center justify-center text-text-muted hover:text-amber-400 shadow-xs cursor-pointer"
              title="Ocultar columna lateral de tabla"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Right Pane: Data Table & Event Editor (Hidden when collapsed) */}
        {!isRightPaneCollapsed && (
          <div
            style={{ width: `${100 - leftPanePercent}%`, flexBasis: `${100 - leftPanePercent}%` }}
            className={`flex flex-col bg-surface overflow-hidden min-w-0 flex-1 ${
              isMaximized ? "h-full min-h-0" : "min-h-[560px]"
            }`}
          >
          {/* Table Header & Search */}
          <div className="p-3 border-b border-border-default flex items-center justify-between gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar hitos y fechas..."
                className="w-full pl-8 pr-3 py-1.5 bg-alt border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-amber-500"
              />
            </div>

            {selectedEventIds.size > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-amber-400">{selectedEventIds.size} sel.</span>
                <button
                  type="button"
                  onClick={handleBulkShow}
                  className="p-1 bg-alt hover:bg-hover rounded text-text-secondary hover:text-text-primary"
                  title="Mostrar en visualizador"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleBulkHide}
                  className="p-1 bg-alt hover:bg-hover rounded text-text-secondary hover:text-text-primary"
                  title="Ocultar etiqueta"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="p-1 bg-alt hover:bg-hover rounded text-red-400 hover:text-red-300"
                  title="Eliminar seleccionados"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Table Body */}
          <div className={`flex-1 overflow-y-auto ${isMaximized ? "max-h-full" : "max-h-[460px]"}`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-alt/90 backdrop-blur-xs border-b border-border-default z-10 text-[10px] text-text-muted uppercase font-bold">
                <tr>
                  <th className="p-2 w-7 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredTableEvents.length > 0 &&
                        filteredTableEvents.every((e) => selectedEventIds.has(e.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEventIds(new Set(filteredTableEvents.map((ev) => ev.id)));
                        } else {
                          setSelectedEventIds(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="p-2 w-6 text-center">Ver</th>
                  <th
                    className="p-2 w-8 cursor-pointer hover:text-text-primary"
                    onClick={() => {
                      setSortColumn("id");
                      setSortAsc(!sortAsc);
                    }}
                  >
                    ID {sortColumn === "id" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th
                    className="p-2 cursor-pointer hover:text-text-primary"
                    onClick={() => {
                      setSortColumn("description");
                      setSortAsc(!sortAsc);
                    }}
                  >
                    Descripción {sortColumn === "description" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th
                    className="p-2 w-20 cursor-pointer hover:text-text-primary"
                    onClick={() => {
                      setSortColumn("startDate");
                      setSortAsc(!sortAsc);
                    }}
                  >
                    Inicio {sortColumn === "startDate" && (sortAsc ? "▲" : "▼")}
                  </th>
                  <th className="p-2 w-20">Fin</th>
                  <th className="p-2 w-10 text-center">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredTableEvents.map((ev) => {
                  const isPeriod = Boolean(ev.endDate && ev.startDate !== ev.endDate);
                  const isSelected = selectedEventIds.has(ev.id);
                  return (
                    <tr
                      key={ev.id}
                      className={`hover:bg-hover/60 transition-colors ${
                        isSelected ? "bg-amber-500/10" : ""
                      } ${isPeriod ? "border-l-2 border-cyan-500" : "border-l-2 border-amber-500"}`}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const next = new Set(selectedEventIds);
                            if (e.target.checked) next.add(ev.id);
                            else next.delete(ev.id);
                            setSelectedEventIds(next);
                          }}
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHidden(ev.id)}
                          className={`cursor-pointer ${ev.hidden ? "text-text-muted opacity-40" : "text-amber-400"}`}
                        >
                          {ev.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      <td className="p-2 font-mono font-bold text-text-muted text-[11px]">#{ev.id}</td>

                      <td
                        className="p-2 cursor-pointer"
                        onClick={() => {
                          setSelectedEventIds(new Set([ev.id]));
                          scrollToEvent(ev.id);
                        }}
                        onDoubleClick={() => openEditModal(ev)}
                        title="Clic para centrar en visualizador • Doble clic para editar"
                      >
                        <div className="flex items-center gap-1.5">
                          {ev.bgColor && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-border-default"
                              style={{ backgroundColor: ev.bgColor }}
                            />
                          )}
                          <span className="font-semibold text-text-primary truncate max-w-[200px] block">
                            {ev.description}
                          </span>
                        </div>
                      </td>

                      <td className="p-2">
                        <input
                          type="date"
                          value={ev.startDate}
                          onChange={(e) => {
                            const updated = currentEvents.map((item) =>
                              item.id === ev.id ? { ...item, startDate: e.target.value } : item
                            );
                            setCurrentEvents(updated);
                          }}
                          className="w-20 px-1 py-0.5 bg-alt border border-border-default rounded text-[10px] font-mono text-text-primary"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="date"
                          value={ev.endDate || ""}
                          onChange={(e) => {
                            const updated = currentEvents.map((item) =>
                              item.id === ev.id
                                ? { ...item, endDate: e.target.value ? e.target.value : undefined }
                                : item
                            );
                            setCurrentEvents(updated);
                          }}
                          className="w-20 px-1 py-0.5 bg-alt border border-border-default rounded text-[10px] font-mono text-text-primary"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-text-muted hover:text-red-400 p-1 cursor-pointer transition-colors"
                          title="Eliminar evento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-2 border-t border-border-default bg-alt/40 flex items-center justify-between text-xs">
            <span className="text-text-muted text-[11px]">
              {filteredTableEvents.length} eventos en total ({layoutCalculations.periods.length} periodos • {currentEvents.length - layoutCalculations.periods.length} hitos)
            </span>
            <button
              type="button"
              onClick={() => handleAddEvent("hito")}
              className="px-2.5 py-1 bg-amber-500 text-black font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Añadir
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Context Menu on Canvas */}
      {contextMenu.visible && (
        <div
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          className="fixed z-50 bg-surface border border-border-default rounded-xl shadow-2xl p-1.5 text-xs min-w-[200px] animate-fadeIn space-y-1"
        >
          {contextMenu.eventId ? (
            <>
              <button
                type="button"
                onClick={() => {
                  const ev = currentEvents.find((e) => e.id === contextMenu.eventId);
                  if (ev) openEditModal(ev);
                }}
                className="w-full px-3 py-1.5 hover:bg-hover rounded-lg text-left text-text-primary font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> Editar Evento #{contextMenu.eventId}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.eventId) handleDuplicateEvent(contextMenu.eventId);
                  setContextMenu((p) => ({ ...p, visible: false }));
                }}
                className="w-full px-3 py-1.5 hover:bg-hover rounded-lg text-left text-text-primary font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" /> Duplicar Evento
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.eventId) handleToggleHidden(contextMenu.eventId);
                  setContextMenu((p) => ({ ...p, visible: false }));
                }}
                className="w-full px-3 py-1.5 hover:bg-hover rounded-lg text-left text-text-primary font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" /> Mostrar / Ocultar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.eventId) {
                    const ev = currentEvents.find((e) => e.id === contextMenu.eventId);
                    if (ev) {
                      const isPeriod = Boolean(ev.endDate && ev.startDate !== ev.endDate);
                      const updated = currentEvents.map((item) =>
                        item.id === ev.id
                          ? {
                              ...item,
                              endDate: isPeriod
                                ? undefined
                                : formatDateToIso(new Date(parseIsoDate(item.startDate).getTime() + 7 * ONE_DAY_MS)),
                            }
                          : item
                      );
                      setCurrentEvents(updated);
                    }
                  }
                  setContextMenu((p) => ({ ...p, visible: false }));
                }}
                className="w-full px-3 py-1.5 hover:bg-hover rounded-lg text-left text-text-primary font-semibold flex items-center gap-2 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" /> Convertir a Periodo / Hito
              </button>
              <div className="h-px bg-border-default my-1" />
              <button
                type="button"
                onClick={() => {
                  if (contextMenu.eventId) handleDeleteEvent(contextMenu.eventId);
                  setContextMenu((p) => ({ ...p, visible: false }));
                }}
                className="w-full px-3 py-1.5 hover:bg-red-500/20 rounded-lg text-left text-red-400 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar Evento
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  handleAddEvent("hito", formatDateToIso(contextMenu.date));
                  setContextMenu((p) => ({ ...p, visible: false }));
                }}
                className="w-full px-3 py-1.5 hover:bg-hover rounded-lg text-left text-amber-400 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Crear Hito aquí (
                {contextMenu.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })})
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAddEvent("periodo", formatDateToIso(contextMenu.date));
                  setContextMenu((p) => ({ ...p, visible: false }));
                }}
                className="w-full px-3 py-1.5 hover:bg-hover rounded-lg text-left text-cyan-400 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Crear Periodo aquí (+7 días)
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border-default rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                Editar Evento #{editingEventId}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-text-muted block mb-1">Descripción / Título del Evento:</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-text-primary font-medium focus:outline-none focus:border-amber-500"
                  placeholder="Escribe la descripción del hito o periodo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-text-muted block mb-1">Fecha Inicio:</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-alt border border-border-default rounded-lg text-text-primary font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-text-muted block mb-1">Fecha Fin (Opcional - Periodo):</label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 bg-alt border border-border-default rounded-lg text-text-primary font-mono text-xs"
                  />
                </div>
              </div>

              {/* High-Contrast Color Presets */}
              <div className="pt-2 border-t border-border-default space-y-2">
                <label className="font-bold text-text-muted block text-[11px]">
                  Paletas y Presets de Alto Contraste:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TIMELINE_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        if (preset.isDefault) {
                          setEditFormData({
                            ...editFormData,
                            bgColor: "",
                            textColor: "",
                            borderColor: "",
                          });
                        } else {
                          setEditFormData({
                            ...editFormData,
                            bgColor: preset.bg,
                            textColor: preset.text,
                            borderColor: preset.border,
                          });
                        }
                      }}
                      className="px-2 py-1 rounded-lg border text-[10px] font-bold transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: preset.bg || "#1e293b",
                        color: preset.text || "#ffffff",
                        borderColor: preset.border || "#475569",
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-text-muted block mb-1">Color Fondo:</label>
                  <input
                    type="color"
                    value={editFormData.bgColor || "#0f172a"}
                    onChange={(e) => setEditFormData({ ...editFormData, bgColor: e.target.value })}
                    className="w-full h-8 bg-transparent border border-border-default rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted block mb-1">Color Texto:</label>
                  <input
                    type="color"
                    value={editFormData.textColor || "#ffffff"}
                    onChange={(e) => setEditFormData({ ...editFormData, textColor: e.target.value })}
                    className="w-full h-8 bg-transparent border border-border-default rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted block mb-1">Color Borde:</label>
                  <input
                    type="color"
                    value={editFormData.borderColor || "#f59e0b"}
                    onChange={(e) => setEditFormData({ ...editFormData, borderColor: e.target.value })}
                    className="w-full h-8 bg-transparent border border-border-default rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-alt hover:bg-hover text-text-secondary font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border-default rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fadeIn text-center">
            <h3 className="text-base font-bold text-text-primary">Exportar Cronograma Visual</h3>
            <p className="text-xs text-text-muted">Selecciona el formato para generar el archivo:</p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleExportImage("png")}
                className="p-3 bg-alt hover:bg-hover border border-border-default rounded-xl font-bold text-xs text-text-primary flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span>PNG</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportImage("jpeg")}
                className="p-3 bg-alt hover:bg-hover border border-border-default rounded-xl font-bold text-xs text-text-primary flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>JPG</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportImage("print")}
                className="p-3 bg-alt hover:bg-hover border border-border-default rounded-xl font-bold text-xs text-text-primary flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-5 h-5 text-purple-400" />
                <span>PDF / Imprimir</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(false)}
              className="w-full py-2 bg-alt hover:bg-hover text-text-muted font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* New Course Cronograma Modal */}
      {isNewCursoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface border border-border-default rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <span>Crear Nuevo Cronograma de Curso</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCursoModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-alt cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-text-muted block mb-1">Nombre / Título del Cronograma:</label>
                <input
                  type="text"
                  value={newCursoName}
                  onChange={(e) => setNewCursoName(e.target.value)}
                  placeholder="Ej: Plan 1º FP Mañana, Calendario Depto Informática, Plan Dual..."
                  className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-text-primary font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-text-muted block mb-1">Categoría / Etiqueta:</label>
                  <input
                    type="text"
                    value={newCursoCategory}
                    onChange={(e) => setNewCursoCategory(e.target.value)}
                    placeholder="Ej: 1º FP, 2º Dual, General, Departamento..."
                    className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-text-primary font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-text-muted block mb-1">Plantilla de Eventos Inicial:</label>
                  <select
                    value={newCursoTemplate}
                    onChange={(e) => setNewCursoTemplate(e.target.value as any)}
                    className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-text-primary font-medium focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fp1">📘 Plan FP 1º Curso (32 sem + Junio)</option>
                    <option value="fp2_dual">💼 Plan FP 2º Curso Dual (FCE + Empresa)</option>
                    <option value="general">🏛️ Calendario General de Centro</option>
                    <option value="evaluaciones">📊 Evaluaciones y Convocatorias</option>
                    <option value="duplicate">📋 Duplicar cronograma actual</option>
                    <option value="blank">📄 En blanco (sin eventos)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-alt rounded-xl border border-border-subtle text-text-muted space-y-1">
                <p className="font-bold text-text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Múltiples Cronogramas a Nivel de Curso
                </p>
                <p className="text-[11px] leading-relaxed">
                  Podrás cambiar entre cronogramas de curso en cualquier momento, personalizarlos individualmente y exportarlos sin alterar el resto de planificaciones de centro o módulo.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default">
              <button
                type="button"
                onClick={() => setIsNewCursoModalOpen(false)}
                className="px-4 py-2 bg-alt hover:bg-hover text-text-muted font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateCursoCronograma}
                disabled={!newCursoName.trim()}
                className={`px-5 py-2 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                  newCursoName.trim()
                    ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                    : "bg-alt text-text-muted border border-border-default cursor-not-allowed opacity-60"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Cronograma</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Course Cronograma Modal */}
      {isRenameCursoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface border border-border-default rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-default pb-3">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Renombrar Cronograma de Curso</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameCursoModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-alt cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-text-muted block mb-1">Nombre del Cronograma:</label>
                <input
                  type="text"
                  value={renameCursoName}
                  onChange={(e) => setRenameCursoName(e.target.value)}
                  className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-text-primary font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-text-muted block mb-1">Categoría / Etiqueta:</label>
                <input
                  type="text"
                  value={renameCursoCategory}
                  onChange={(e) => setRenameCursoCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-text-primary font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-default">
              <button
                type="button"
                onClick={() => setIsRenameCursoModalOpen(false)}
                className="px-4 py-2 bg-alt hover:bg-hover text-text-muted font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRenameCurso}
                disabled={!renameCursoName.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste JSON Modal */}
      {isPasteJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border-default rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              Pegar Código JSON
            </h3>
            <textarea
              value={pasteJsonText}
              onChange={(e) => setPasteJsonText(e.target.value)}
              placeholder="Pega el array JSON con los eventos del cronograma..."
              rows={8}
              className="w-full px-3 py-2 bg-alt border border-border-default rounded-xl text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPasteJsonModalOpen(false)}
                className="px-4 py-2 bg-alt hover:bg-hover text-text-muted font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPasteJson}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-xl cursor-pointer"
              >
                Cargar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
