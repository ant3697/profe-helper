import React, { useState, useRef, useId, useEffect, useLayoutEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Printer,
  Sparkles,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  Award,
  Clock,
  BookOpen,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Layers,
  ArrowRight,
  FileText,
  HelpCircle,
  Hash,
  Link,
  X,
  Bookmark,
  CalendarRange,
  GraduationCap,
  Briefcase,
  Sun,
  AlertCircle,
  Flag,
  Copy,
  Paintbrush,
  Palette,
  Pipette,
  MousePointer,
  Save,
  Undo2,
  Redo2,
  RotateCw,
  Eraser,
  Landmark,
  Eye,
  Filter,
  Sliders,
  MoreVertical,
} from "lucide-react";
import {
  SigreAcademicCalendar,
  SigreCalendarLegendItem,
  SigreCalendarDayOverride,
  SigreCalendarDayType,
  SigreUDItem,
} from "../../types/sigre";
import {
  ALL_PRESET_ACADEMIC_CALENDARS,
  PRESET_CALENDAR_2026_2027,
  PRESET_CALENDAR_2025_2026,
  DEFAULT_LEGEND_ITEMS_2026_2027,
} from "../../data/sigreAcademicCalendarPresets";
import {
  getAcademicMonthsList,
  generateMonthGrid,
  calculateAcademicCalendarStats,
  autoDistributeUdsToCalendar,
  assignRangeToCalendar,
  renderOfficialSchoolCalendarA4Html,
  createNewAcademicCalendarTemplate,
  getOfficialEventStyle,
  isSpecialEventType,
  deriveMonthLateralLegends,
  formatOfficialLegendChip,
  MonthLateralTag,
  CalendarGridDay,
  UD_COLOR_PALETTE,
  UD_DISTINCT_COLOR_PALETTE,
  OFFICIAL_EVENT_COLOR_PALETTE,
  getOptimalTextColorForBg,
  getDistinctUdColor,
  MONTH_NAMES_ES,
  getAcademicTrimestersStructure,
  SigreAcademicTrimesterItem,
  getMonthTrimesterInfo,
  MonthTrimesterInfo,
  shiftCalendarToAcademicYear,
  sanitizeAcademicCalendar,
  buildUdLegendTitleAndCode,
} from "../../utils/sigreCalendarUtils";
import { preparePrintableHtmlDocument } from "../../utils/topicPromptGenerator";
import { SigreMultiLevelTimeline } from "./SigreMultiLevelTimeline";

interface SigreAcademicCalendarManagerProps {
  currentUds?: SigreUDItem[];
  moduloCodigo?: string;
  moduloNombre?: string;
  cicloFormativo?: string;
  docenteNombre?: string;
  onCalendarChange?: (cal: SigreAcademicCalendar) => void;
  onOpenModuleCurriculum?: (
    cal: SigreAcademicCalendar,
    targetView?: "unidades" | "parametros" | "cronogramas"
  ) => void;
  theme?: "dark" | "light";
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  dateStr: string;
  dayNumber: number;
  monthName: string;
  dayInfo: any;
}

export interface CopiedFormatState {
  type: SigreCalendarDayType;
  customColor?: string;
  customTextColor?: string;
  legendItemId?: string;
  assignedUdId?: string;
  assignedUdCode?: string;
  title?: string;
  label: string;
  sourceDate?: string;
}

export const SigreAcademicCalendarManager: React.FC<SigreAcademicCalendarManagerProps> = ({
  currentUds = [],
  moduloCodigo = "TEMINS 0037",
  moduloNombre = "Técnicas de montaje de instalaciones térmicas",
  cicloFormativo = "1º CFGM Instalaciones Frigoríficas y de Climatización",
  docenteNombre = "Profesorado FP",
  onCalendarChange,
  onOpenModuleCurriculum,
  theme = "dark",
}) => {
  // Store all available calendars (allows adding / deleting courses & modules)
  const STORAGE_KEY_CALENDARS = "sigre_academic_calendars_portfolio_v2";
  const STORAGE_KEY_ACTIVE_ID = "sigre_academic_active_cal_id_v2";

  const [calendarsList, setCalendarsList] = useState<SigreAcademicCalendar[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALENDARS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeAcademicCalendar);
        }
      }
    } catch (e) {
      console.error("Error loading calendars from storage:", e);
    }
    return ALL_PRESET_ACADEMIC_CALENDARS.map(sanitizeAcademicCalendar);
  });

  const [activeCalendarId, setActiveCalendarId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch (e) {}
    return ALL_PRESET_ACADEMIC_CALENDARS[0]?.id || "cal_2026_2027_malaga_andalucia";
  });

  // Auto-persist calendars and active ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(calendarsList));
    } catch (e) {
      console.error("Error saving calendars:", e);
    }
  }, [calendarsList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeCalendarId);
    } catch (e) {}
  }, [activeCalendarId]);

  const calendar = calendarsList.find((c) => c.id === activeCalendarId) || calendarsList[0] || PRESET_CALENDAR_2026_2027;

  // View Mode: Traditional Monthly Grid vs Module Timeline vs Global Portfolio Timeline
  const [calendarViewMode, setCalendarViewMode] = useState<"calendario" | "cronograma_modulo" | "cronograma_global">("calendario");

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<SigreAcademicCalendar[]>([]);
  const [future, setFuture] = useState<SigreAcademicCalendar[]>([]);
  const historyRef = useRef<SigreAcademicCalendar[]>([]);
  const futureRef = useRef<SigreAcademicCalendar[]>([]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    futureRef.current = future;
  }, [future]);

  const [highlightedLegendId, setHighlightedLegendId] = useState<string | null>(null);

  // Legend Items Collapsed/Expanded State (Default is collapsed as requested: "por defecto estará colapsada")
  const [expandedLegendIds, setExpandedLegendIds] = useState<Set<string>>(new Set());

  // Mouse Area Drag Selection & Multi-Day Format State
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedSingleDay, setSelectedSingleDay] = useState<{ dateStr: string; dayData: any } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const justAppliedDragRef = useRef<boolean>(false);
  const selectedDatesRef = useRef<Set<string>>(new Set());
  const dragStartInfoRef = useRef<{
    dateStr: string;
    monthIndex: number;
    rowIdx: number;
    colIdx: number;
    monthDays: CalendarGridDay[];
  } | null>(null);

  // Copied Format / Format Painter State (MS Excel 1-click single use vs double-click persistent anchor)
  const [copiedFormat, setCopiedFormat] = useState<CopiedFormatState | null>(null);
  const copiedFormatRef = useRef<CopiedFormatState | null>(null);
  const [isFormatPainterActive, setIsFormatPainterActive] = useState<boolean>(false);
  const isFormatPainterActiveRef = useRef<boolean>(false);
  const [isFormatPainterLocked, setIsFormatPainterLocked] = useState<boolean>(false);
  const isFormatPainterLockedRef = useRef<boolean>(false);
  const calendarRef = useRef<SigreAcademicCalendar>(calendar);

  // Keep refs in sync with state for event listeners
  useEffect(() => {
    copiedFormatRef.current = copiedFormat;
  }, [copiedFormat]);

  useEffect(() => {
    isFormatPainterActiveRef.current = isFormatPainterActive;
  }, [isFormatPainterActive]);

  useEffect(() => {
    isFormatPainterLockedRef.current = isFormatPainterLocked;
  }, [isFormatPainterLocked]);

  useEffect(() => {
    calendarRef.current = calendar;
  }, [calendar]);

  useEffect(() => {
    selectedDatesRef.current = selectedDates;
  }, [selectedDates]);

  // Day Edit Modal
  const [editingDayModal, setEditingDayModal] = useState<{
    dateStr: string;
    override: Partial<SigreCalendarDayOverride>;
    dayNumber: number;
    monthName: string;
  } | null>(null);

  // Day Configuration Modal Tab & Sub-Form State
  const [dayModalTab, setDayModalTab] = useState<"festivos" | "uds" | "nueva_ud" | "nuevo_evento" | "color">("festivos");
  const [inlineNewUd, setInlineNewUd] = useState({
    code: "UD05. RA02",
    title: "Nueva Unidad Didáctica",
    color: "#fed7aa",
  });
  const [inlineNewEvent, setInlineNewEvent] = useState<{
    title: string;
    type: SigreCalendarDayType;
    color: string;
    sidePosition: "left" | "right";
  }>({
    title: "Día del Patrón del Centro",
    type: "festivo_local",
    color: "#ec4899",
    sidePosition: "right",
  });

  // Legend Item Edit / Create Modal
  const [editingLegendModal, setEditingLegendModal] = useState<{
    item: Partial<SigreCalendarLegendItem>;
    isNew: boolean;
  } | null>(null);

  // Range Assignment Modal
  const [rangeAssignModal, setRangeAssignModal] = useState<{
    startDate: string;
    endDate: string;
    legendItemId: string;
    preserveSpecialEvents: boolean;
  } | null>(null);

  // A4 Printable Document Live Preview Modal
  const [isPreviewA4Open, setIsPreviewA4Open] = useState<boolean>(false);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Edit Resolution / URL Modal
  const [editingResolutionModal, setEditingResolutionModal] = useState<{
    resolutionRef: string;
    resolutionUrl: string;
    province: string;
    educationalStage: string;
    notes: string;
  } | null>(null);

  // Add Course / Module Modal
  const [addCourseModal, setAddCourseModal] = useState<{
    academicYear: string;
    province: string;
    moduloNombre: string;
    moduloCodigo: string;
    cicloFormativo: string;
    docente: string;
    baseTemplate: "2026_2027" | "2025_2026" | "blank";
    includeSampleUds: boolean;
  } | null>(null);

  // Edit Active Module Info Modal
  const [editingModuleModal, setEditingModuleModal] = useState<{
    moduloFormativo: string;
    codigoModulo: string;
    cicloFormativo: string;
    docente: string;
    academicYear: string;
    province: string;
    educationalStage: string;
    notes: string;
  } | null>(null);

  // Duplicate Module Modal
  const [duplicateModuleModal, setDuplicateModuleModal] = useState<{
    moduloFormativo: string;
    codigoModulo: string;
    cicloFormativo: string;
    keepUds: boolean;
  } | null>(null);

  // Context Menu State for Calendar Grid Cells
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [contextMenuTab, setContextMenuTab] = useState<"uds" | "evals" | "festivos" | "especiales">("uds");

  // Context Menu State for Module Cards in Cartera de Módulos
  const [moduleContextMenu, setModuleContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    calendar: SigreAcademicCalendar;
  } | null>(null);

  // Close module context menu on window click or Escape
  useEffect(() => {
    const handleModuleContextMenuOutside = () => {
      if (moduleContextMenu) setModuleContextMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModuleContextMenu(null);
    };
    window.addEventListener("click", handleModuleContextMenuOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleModuleContextMenuOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [moduleContextMenu]);

  // Academic Trimesters and June Recuperation panel toggle
  const [isTrimestersExpanded, setIsTrimestersExpanded] = useState<boolean>(false);

  // Dedicated Academic Year Switcher & Modal state
  const [isChangeYearModalOpen, setIsChangeYearModalOpen] = useState<boolean>(false);
  const [targetAcademicYear, setTargetAcademicYear] = useState<string>("2026-2027");
  const [customAcademicYearInput, setCustomAcademicYearInput] = useState<string>("");
  const [changeYearMode, setChangeYearMode] = useState<"shift_dates" | "load_official_preset" | "update_label_only">("shift_dates");
  const [changeYearCreateCopy, setChangeYearCreateCopy] = useState<boolean>(false);
  const [portfolioYearFilter, setPortfolioYearFilter] = useState<string>("all");

  // Drag & Drop state for moving assigned formats / milestones / evaluations between calendar cells
  const [draggedDayData, setDraggedDayData] = useState<{
    sourceDateStr: string;
    sourceDayNumber: number;
    sourceMonthName: string;
    title: string;
    override?: SigreCalendarDayOverride;
    assignedUdId?: string;
    assignedUdCode?: string;
    specialEventType?: SigreCalendarDayType;
    specialEventLabel?: string;
    displayBgColor?: string;
    displayTextColor?: string;
    legendItemId?: string;
  } | null>(null);
  const [dragOverTargetDate, setDragOverTargetDate] = useState<string | null>(null);
  const draggedDayDataRef = useRef(draggedDayData);
  draggedDayDataRef.current = draggedDayData;

  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);

  const stats = calculateAcademicCalendarStats(calendar);
  const academicMonths = getAcademicMonthsList(calendar.academicYear);
  const trimestersStructure = getAcademicTrimestersStructure(calendar.academicYear);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Open module curriculum in Curricular Designer (Double Click / Context Menu)
  const handleOpenCurricularDesigner = (
    calItem: SigreAcademicCalendar,
    targetView: "unidades" | "parametros" | "cronogramas" = "unidades"
  ) => {
    setActiveCalendarId(calItem.id);
    if (onOpenModuleCurriculum) {
      onOpenModuleCurriculum(calItem, targetView);
    } else {
      showToast(`📖 Módulo [${calItem.codigoModulo || "MOD"}] cargado en el Diseñador Curricular.`);
    }
  };

  // Toggle single legend item collapse / expand
  const toggleLegendExpand = (id: string) => {
    setExpandedLegendIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAllLegends = () => {
    setExpandedLegendIds(new Set(calendar.legendItems.map((l) => l.id)));
    showToast("Todas las tarjetas de la leyenda expandidas");
  };

  const collapseAllLegends = () => {
    setExpandedLegendIds(new Set());
    showToast("Todas las tarjetas de la leyenda colapsadas");
  };

  // Global window mouseup listener to finish drag selection cleanly and auto-apply format if active
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setIsMouseDown(false);

        const activeCopied = copiedFormatRef.current;
        const activeSelected = selectedDatesRef.current;
        const hadDrag = hasDraggedRef.current;

        dragStartInfoRef.current = null;
        hasDraggedRef.current = false;

        // Auto-apply format directly when selecting a window of dates if format is loaded
        if (activeCopied && activeSelected && activeSelected.size > 0 && hadDrag && isFormatPainterActiveRef.current) {
          justAppliedDragRef.current = true;
          setTimeout(() => {
            justAppliedDragRef.current = false;
          }, 80);
          applyCopiedFormatToDatesList(activeSelected);
          if (!isFormatPainterLockedRef.current) {
            setIsFormatPainterActive(false);
            setIsFormatPainterLocked(false);
          }
        }
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Close context menu on outside click or scroll
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("scroll", handleGlobalClick, true);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("scroll", handleGlobalClick, true);
    };
  }, [contextMenu]);

  // Context menu dynamic viewport positioning constraint (prevents overflowing off-screen)
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const el = contextMenuRef.current;
      const rect = el.getBoundingClientRect();
      const padding = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedY = contextMenu.y;
      let adjustedX = contextMenu.x;
      let needsAdjust = false;

      if (rect.bottom > viewportHeight - padding) {
        adjustedY = Math.max(padding, viewportHeight - rect.height - padding);
        needsAdjust = true;
      }
      if (rect.top < padding) {
        adjustedY = padding;
        needsAdjust = true;
      }
      if (rect.right > viewportWidth - padding) {
        adjustedX = Math.max(padding, viewportWidth - rect.width - padding);
        needsAdjust = true;
      }
      if (rect.left < padding) {
        adjustedX = padding;
        needsAdjust = true;
      }

      if (needsAdjust) {
        el.style.top = `${adjustedY}px`;
        el.style.left = `${adjustedX}px`;
      }
    }
  }, [contextMenu, contextMenuTab]);

  // Keyboard shortcut: Escape, Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z"))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === "Escape" || e.key === "Esc") {
        if (selectedDates.size > 0) {
          setSelectedDates(new Set());
        }
        if (isFormatPainterActive) {
          setIsFormatPainterActive(false);
          setIsFormatPainterLocked(false);
          showToast("Modo Copiar Formato desactivado (Esc)");
        }
        if (contextMenu) {
          setContextMenu(null);
        }
        if (editingDayModal) {
          setEditingDayModal(null);
        }
        if (editingLegendModal) {
          setEditingLegendModal(null);
        }
        if (rangeAssignModal) {
          setRangeAssignModal(null);
        }
        if (editingResolutionModal) {
          setEditingResolutionModal(null);
        }
        if (addCourseModal) {
          setAddCourseModal(null);
        }
        if (editingModuleModal) {
          setEditingModuleModal(null);
        }
        if (duplicateModuleModal) {
          setDuplicateModuleModal(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isFormatPainterActive,
    selectedDates,
    contextMenu,
    editingDayModal,
    editingLegendModal,
    rangeAssignModal,
    editingResolutionModal,
    addCourseModal,
    editingModuleModal,
    duplicateModuleModal,
    history,
    future,
    calendar,
  ]);

  const updateCurrentCalendar = (newCal: SigreAcademicCalendar, recordHistory: boolean = true) => {
    const sanitized = sanitizeAcademicCalendar(newCal);
    if (recordHistory) {
      setHistory((prev) => [...prev.slice(-50), calendarRef.current]);
      setFuture([]);
    }
    const updatedList = calendarsList.map((c) => (c.id === sanitized.id ? sanitized : c));
    setCalendarsList(updatedList);
    if (onCalendarChange) {
      onCalendarChange(sanitized);
    }
  };

  // Undo global (Deshacer)
  const handleUndo = () => {
    const currentHistory = historyRef.current;
    if (currentHistory.length === 0) {
      showToast("No hay más cambios anteriores para deshacer");
      return;
    }
    const previous = currentHistory[currentHistory.length - 1];
    const newHistory = currentHistory.slice(0, -1);

    setFuture((prev) => [calendarRef.current, ...prev]);
    setHistory(newHistory);

    const updatedList = calendarsList.map((c) => (c.id === previous.id ? previous : c));
    setCalendarsList(updatedList);
    if (onCalendarChange) {
      onCalendarChange(previous);
    }
    showToast("Deshecho el último cambio (Ctrl+Z)");
  };

  // Redo global (Rehacer)
  const handleRedo = () => {
    const currentFuture = futureRef.current;
    if (currentFuture.length === 0) {
      showToast("No hay cambios posteriores para rehacer");
      return;
    }
    const next = currentFuture[0];
    const newFuture = currentFuture.slice(1);

    setHistory((prev) => [...prev, calendarRef.current]);
    setFuture(newFuture);

    const updatedList = calendarsList.map((c) => (c.id === next.id ? next : c));
    setCalendarsList(updatedList);
    if (onCalendarChange) {
      onCalendarChange(next);
    }
    showToast("Rehecho el cambio (Ctrl+Y)");
  };

  // Undo specifically for a single monthly window
  const handleUndoForMonth = (year: number, month: number, monthName: string) => {
    const monthNum1Indexed = month + 1;
    const monthPrefix = `${year}-${String(monthNum1Indexed).padStart(2, "0")}`;
    const currentCal = calendarRef.current;
    const currentHistory = historyRef.current;

    if (currentHistory.length === 0) {
      showToast(`No hay cambios anteriores para deshacer en ${monthName}`);
      return;
    }

    let targetIndex = -1;
    for (let i = currentHistory.length - 1; i >= 0; i--) {
      const snap = currentHistory[i];
      const snapMonthOverrides = Object.entries(snap.dayOverrides || {}).filter(([k]) => k.startsWith(monthPrefix));
      const currMonthOverrides = Object.entries(currentCal.dayOverrides || {}).filter(([k]) => k.startsWith(monthPrefix));
      const snapMonthLegends = (snap.legendItems || []).filter(
        (l) => l.monthTarget === monthNum1Indexed || l.monthTarget === month
      );
      const currMonthLegends = (currentCal.legendItems || []).filter(
        (l) => l.monthTarget === monthNum1Indexed || l.monthTarget === month
      );

      const isOverridesDiff = JSON.stringify(snapMonthOverrides) !== JSON.stringify(currMonthOverrides);
      const isLegendsDiff = JSON.stringify(snapMonthLegends) !== JSON.stringify(currMonthLegends);

      if (isOverridesDiff || isLegendsDiff) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      targetIndex = currentHistory.length - 1;
    }

    const previousSnap = currentHistory[targetIndex];

    const newOverrides = { ...currentCal.dayOverrides };
    Object.keys(newOverrides).forEach((k) => {
      if (k.startsWith(monthPrefix)) delete newOverrides[k];
    });
    Object.entries(previousSnap.dayOverrides || {}).forEach(([k, v]) => {
      if (k.startsWith(monthPrefix)) newOverrides[k] = v;
    });

    const otherLegends = (currentCal.legendItems || []).filter(
      (l) => l.monthTarget !== monthNum1Indexed && l.monthTarget !== month
    );
    const targetMonthLegends = (previousSnap.legendItems || []).filter(
      (l) => l.monthTarget === monthNum1Indexed || l.monthTarget === month
    );

    const updatedCal: SigreAcademicCalendar = {
      ...currentCal,
      dayOverrides: newOverrides,
      legendItems: [...otherLegends, ...targetMonthLegends],
    };

    setFuture((prev) => [currentCal, ...prev]);
    setHistory((prev) => prev.slice(0, targetIndex));

    const updatedList = calendarsList.map((c) => (c.id === updatedCal.id ? updatedCal : c));
    setCalendarsList(updatedList);
    if (onCalendarChange) {
      onCalendarChange(updatedCal);
    }
    showToast(`Deshecho cambio local en ${monthName}`);
  };

  // Redo specifically for a single monthly window
  const handleRedoForMonth = (year: number, month: number, monthName: string) => {
    const monthNum1Indexed = month + 1;
    const monthPrefix = `${year}-${String(monthNum1Indexed).padStart(2, "0")}`;
    const currentCal = calendarRef.current;
    const currentFuture = futureRef.current;

    if (currentFuture.length === 0) {
      showToast(`No hay cambios posteriores para rehacer en ${monthName}`);
      return;
    }

    let targetIndex = -1;
    for (let i = 0; i < currentFuture.length; i++) {
      const snap = currentFuture[i];
      const snapMonthOverrides = Object.entries(snap.dayOverrides || {}).filter(([k]) => k.startsWith(monthPrefix));
      const currMonthOverrides = Object.entries(currentCal.dayOverrides || {}).filter(([k]) => k.startsWith(monthPrefix));
      const snapMonthLegends = (snap.legendItems || []).filter(
        (l) => l.monthTarget === monthNum1Indexed || l.monthTarget === month
      );
      const currMonthLegends = (currentCal.legendItems || []).filter(
        (l) => l.monthTarget === monthNum1Indexed || l.monthTarget === month
      );

      const isOverridesDiff = JSON.stringify(snapMonthOverrides) !== JSON.stringify(currMonthOverrides);
      const isLegendsDiff = JSON.stringify(snapMonthLegends) !== JSON.stringify(currMonthLegends);

      if (isOverridesDiff || isLegendsDiff) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      targetIndex = 0;
    }

    const nextSnap = currentFuture[targetIndex];

    const newOverrides = { ...currentCal.dayOverrides };
    Object.keys(newOverrides).forEach((k) => {
      if (k.startsWith(monthPrefix)) delete newOverrides[k];
    });
    Object.entries(nextSnap.dayOverrides || {}).forEach(([k, v]) => {
      if (k.startsWith(monthPrefix)) newOverrides[k] = v;
    });

    const otherLegends = (currentCal.legendItems || []).filter(
      (l) => l.monthTarget !== monthNum1Indexed && l.monthTarget !== month
    );
    const targetMonthLegends = (nextSnap.legendItems || []).filter(
      (l) => l.monthTarget === monthNum1Indexed || l.monthTarget === month
    );

    const updatedCal: SigreAcademicCalendar = {
      ...currentCal,
      dayOverrides: newOverrides,
      legendItems: [...otherLegends, ...targetMonthLegends],
    };

    setHistory((prev) => [...prev, currentCal]);
    setFuture((prev) => prev.slice(targetIndex + 1));

    const updatedList = calendarsList.map((c) => (c.id === updatedCal.id ? updatedCal : c));
    setCalendarsList(updatedList);
    if (onCalendarChange) {
      onCalendarChange(updatedCal);
    }
    showToast(`Rehecho cambio local en ${monthName}`);
  };

  // Clear all formats and legends for a specific month (Borrar formatos y leyendas del mes)
  const handleClearMonth = (year: number, month: number, monthName: string) => {
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

    // 1. Remove dayOverrides belonging to this month
    const newDayOverrides = { ...calendar.dayOverrides };
    let removedCount = 0;
    Object.keys(newDayOverrides).forEach((dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        delete newDayOverrides[dateKey];
        removedCount++;
      }
    });

    // 2. Remove legend items specifically targeting this month
    const newLegendItems = calendar.legendItems.filter((leg) => leg.monthTarget !== month);

    const updatedCalendar: SigreAcademicCalendar = {
      ...calendar,
      dayOverrides: newDayOverrides,
      legendItems: newLegendItems,
    };

    updateCurrentCalendar(updatedCalendar, true);
    showToast(`Formatos y leyendas de ${monthName} borrados correctamente (${removedCount} días restablecidos)`);
  };

  // Load administrative presets for a specific month (Cargar preestablecidos por la administración)
  const handleLoadAdminPresetsForMonth = (year: number, month: number, monthName: string) => {
    const is2025 = calendar.academicYear?.includes("2025");
    const sourcePreset = is2025 ? PRESET_CALENDAR_2025_2026 : PRESET_CALENDAR_2026_2027;
    const currentMonthPrefix = `${year}-${String(month).padStart(2, "0")}`;

    // 1. Remove current overrides for this month
    const newDayOverrides = { ...calendar.dayOverrides };
    Object.keys(newDayOverrides).forEach((dateKey) => {
      if (dateKey.startsWith(currentMonthPrefix)) {
        delete newDayOverrides[dateKey];
      }
    });

    // 2. Add preset overrides for this month (adjusting the year prefix if needed)
    let addedCount = 0;
    Object.entries(sourcePreset.dayOverrides).forEach(([presetDateStr, override]) => {
      const parts = presetDateStr.split("-");
      if (parts.length === 3) {
        const pMonth = parseInt(parts[1], 10);
        const pDay = parts[2];
        if (pMonth === month) {
          const targetDateKey = `${year}-${String(month).padStart(2, "0")}-${pDay}`;
          newDayOverrides[targetDateKey] = {
            ...override,
            date: targetDateKey,
          };
          addedCount++;
        }
      }
    });

    // 3. Extract and replace preset legend items for this month
    const presetLegendsForMonth = sourcePreset.legendItems.filter((leg) => leg.monthTarget === month);
    const filteredLegends = calendar.legendItems.filter((leg) => leg.monthTarget !== month);
    const mergedLegends = [...filteredLegends, ...presetLegendsForMonth];

    const updatedCalendar: SigreAcademicCalendar = {
      ...calendar,
      dayOverrides: newDayOverrides,
      legendItems: mergedLegends,
    };

    updateCurrentCalendar(updatedCalendar, true);
    showToast(`Preestablecidos oficiales de la Administración cargados para ${monthName} (${addedCount} hitos/festivos)`);
  };

  // Add New Course or Subject Module
  const handleCreateNewCourse = () => {
    if (!addCourseModal) return;
    const { academicYear, province, moduloNombre: newModNombre, moduloCodigo: newModCodigo, cicloFormativo: newCiclo, docente: newDocente, baseTemplate, includeSampleUds } = addCourseModal;

    if (!academicYear.trim()) {
      alert("Introduce un curso escolar válido (ej. 2026-2027 o 2027-2028)");
      return;
    }

    const modCode = newModCodigo.trim() || "MOD";
    const modNom = newModNombre.trim() || "Nuevo Módulo Formativo";
    const cicNom = newCiclo.trim() || cicloFormativo;
    const docNom = newDocente.trim() || docenteNombre;

    let newCal: SigreAcademicCalendar;
    if (baseTemplate === "2026_2027") {
      newCal = {
        ...PRESET_CALENDAR_2026_2027,
        id: `cal_${modCode.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}`,
        academicYear: academicYear.trim(),
        province: province || "Málaga",
        moduloFormativo: modNom,
        codigoModulo: modCode,
        cicloFormativo: cicNom,
        docente: docNom,
      };
      if (!includeSampleUds) {
        newCal.legendItems = newCal.legendItems.filter((l) => l.type !== "ud_ra");
        newCal.dayOverrides = Object.fromEntries(
          Object.entries(newCal.dayOverrides).filter(([_, ov]) => ov.type !== "lectivo" && !ov.assignedUdId)
        );
      }
    } else if (baseTemplate === "2025_2026") {
      newCal = {
        ...PRESET_CALENDAR_2025_2026,
        id: `cal_${modCode.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}`,
        academicYear: academicYear.trim(),
        province: province || "Málaga",
        moduloFormativo: modNom,
        codigoModulo: modCode,
        cicloFormativo: cicNom,
        docente: docNom,
      };
      if (!includeSampleUds) {
        newCal.legendItems = newCal.legendItems.filter((l) => l.type !== "ud_ra");
        newCal.dayOverrides = Object.fromEntries(
          Object.entries(newCal.dayOverrides).filter(([_, ov]) => ov.type !== "lectivo" && !ov.assignedUdId)
        );
      }
    } else {
      newCal = createNewAcademicCalendarTemplate(
        academicYear.trim(),
        province || "Málaga",
        modNom,
        modCode,
        cicNom,
        docNom
      );
    }

    setCalendarsList([...calendarsList, newCal]);
    setActiveCalendarId(newCal.id);
    setAddCourseModal(null);
    if (onCalendarChange) onCalendarChange(newCal);
    showToast(`Módulo "${modCode}" para el curso ${academicYear} creado y activado`);
  };

  // Edit Active Module Information
  const handleSaveModuleDetails = () => {
    if (!editingModuleModal) return;
    const updated: SigreAcademicCalendar = {
      ...calendar,
      moduloFormativo: editingModuleModal.moduloFormativo.trim(),
      codigoModulo: editingModuleModal.codigoModulo.trim(),
      cicloFormativo: editingModuleModal.cicloFormativo.trim(),
      docente: editingModuleModal.docente.trim(),
      academicYear: editingModuleModal.academicYear.trim(),
      province: editingModuleModal.province.trim(),
      educationalStage: editingModuleModal.educationalStage.trim(),
      notes: editingModuleModal.notes.trim(),
    };
    updateCurrentCalendar(updated);
    setEditingModuleModal(null);
    showToast("Datos de la asignatura y módulo actualizados con éxito");
  };

  // Quick Academic Year Switcher from header dropdown
  const handleQuickChangeAcademicYear = (newYearValue: string) => {
    if (newYearValue === "custom" || newYearValue === "advanced_options") {
      setTargetAcademicYear(calendar.academicYear || "2026-2027");
      setCustomAcademicYearInput(calendar.academicYear || "2026-2027");
      setIsChangeYearModalOpen(true);
      return;
    }

    if (newYearValue === calendar.academicYear) return;

    // Apply smart date shift
    const shifted = shiftCalendarToAcademicYear(calendar, newYearValue, "shift_dates");
    updateCurrentCalendar(shifted);
    showToast(`Curso escolar actualizado a ${newYearValue} con adaptación de fechas y trimestres`);
  };

  // Full Change Academic Year Confirmation from Modal
  const handleApplyChangeAcademicYear = () => {
    const finalYear = targetAcademicYear === "custom" ? customAcademicYearInput.trim() : targetAcademicYear.trim();
    if (!finalYear || !/^\d{4}-\d{4}$/.test(finalYear)) {
      alert("Introduce un curso escolar válido en formato AAAA-AAAA (ej. 2025-2026 o 2027-2028)");
      return;
    }

    if (changeYearCreateCopy) {
      // Create new calendar in portfolio with this year
      let newCal: SigreAcademicCalendar;
      if (changeYearMode === "load_official_preset") {
        if (finalYear === "2025-2026") {
          newCal = {
            ...PRESET_CALENDAR_2025_2026,
            moduloFormativo: calendar.moduloFormativo,
            codigoModulo: `${calendar.codigoModulo || "MOD"}_2526`,
            cicloFormativo: calendar.cicloFormativo,
            docente: calendar.docente,
            province: calendar.province || "Málaga",
          };
        } else if (finalYear === "2026-2027") {
          newCal = {
            ...PRESET_CALENDAR_2026_2027,
            moduloFormativo: calendar.moduloFormativo,
            codigoModulo: `${calendar.codigoModulo || "MOD"}_2627`,
            cicloFormativo: calendar.cicloFormativo,
            docente: calendar.docente,
            province: calendar.province || "Málaga",
          };
        } else {
          newCal = createNewAcademicCalendarTemplate(
            finalYear,
            calendar.province || "Málaga",
            calendar.moduloFormativo,
            calendar.codigoModulo,
            calendar.cicloFormativo,
            calendar.docente
          );
        }
      } else {
        newCal = shiftCalendarToAcademicYear(calendar, finalYear, changeYearMode);
      }
      const cleanCode = `${calendar.codigoModulo || "MOD"}_${finalYear.replace("-", "_")}`;
      newCal.id = `cal_${cleanCode.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}`;
      newCal.codigoModulo = cleanCode;

      setCalendarsList([...calendarsList, newCal]);
      setActiveCalendarId(newCal.id);
      setIsChangeYearModalOpen(false);
      if (onCalendarChange) onCalendarChange(newCal);
      showToast(`Nueva asignatura para el curso ${finalYear} creada y activada en tu cartera`);
    } else {
      // Apply to current active calendar
      let updatedCal: SigreAcademicCalendar;
      if (changeYearMode === "load_official_preset") {
        if (finalYear === "2025-2026") {
          updatedCal = {
            ...PRESET_CALENDAR_2025_2026,
            id: calendar.id,
            moduloFormativo: calendar.moduloFormativo,
            codigoModulo: calendar.codigoModulo,
            cicloFormativo: calendar.cicloFormativo,
            docente: calendar.docente,
            province: calendar.province || "Málaga",
          };
        } else if (finalYear === "2026-2027") {
          updatedCal = {
            ...PRESET_CALENDAR_2026_2027,
            id: calendar.id,
            moduloFormativo: calendar.moduloFormativo,
            codigoModulo: calendar.codigoModulo,
            cicloFormativo: calendar.cicloFormativo,
            docente: calendar.docente,
            province: calendar.province || "Málaga",
          };
        } else {
          updatedCal = createNewAcademicCalendarTemplate(
            finalYear,
            calendar.province || "Málaga",
            calendar.moduloFormativo,
            calendar.codigoModulo,
            calendar.cicloFormativo,
            calendar.docente
          );
          updatedCal.id = calendar.id;
        }
      } else {
        updatedCal = shiftCalendarToAcademicYear(calendar, finalYear, changeYearMode);
      }

      updateCurrentCalendar(updatedCal);
      setIsChangeYearModalOpen(false);
      showToast(`Curso escolar actualizado a ${finalYear} con éxito`);
    }
  };

  // Clone Current Calendar for another Subject or Group
  const handleCloneCurrentCalendar = () => {
    if (!duplicateModuleModal) return;
    const { moduloFormativo: newModNom, codigoModulo: newModCod, cicloFormativo: newCiclo, keepUds } = duplicateModuleModal;
    if (!newModNom.trim()) {
      alert("Introduce el nombre de la nueva asignatura o módulo.");
      return;
    }
    const cleanCode = newModCod.trim() || "CLON";
    const newId = `cal_${cleanCode.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}`;
    const clonedCalendar: SigreAcademicCalendar = {
      ...calendar,
      id: newId,
      moduloFormativo: newModNom.trim(),
      codigoModulo: cleanCode,
      cicloFormativo: newCiclo.trim() || calendar.cicloFormativo,
      legendItems: keepUds
        ? [...calendar.legendItems]
        : calendar.legendItems.filter((leg) => leg.type !== "ud_ra"),
      dayOverrides: keepUds
        ? { ...calendar.dayOverrides }
        : Object.fromEntries(
            Object.entries(calendar.dayOverrides).filter(([_, ov]) => ov.type !== "lectivo" && !ov.assignedUdId)
          ),
    };
    const updatedList = [...calendarsList, clonedCalendar];
    setCalendarsList(updatedList);
    setActiveCalendarId(clonedCalendar.id);
    setDuplicateModuleModal(null);
    if (onCalendarChange) onCalendarChange(clonedCalendar);
    showToast(`Asignatura "${clonedCalendar.codigoModulo}" duplicada con éxito manteniendo marco oficial`);
  };

  // Sync Calendar with Active SIGRE Curriculum Module
  const handleSyncWithActiveSigre = () => {
    const updated: SigreAcademicCalendar = {
      ...calendar,
      moduloFormativo: moduloNombre || calendar.moduloFormativo,
      codigoModulo: moduloCodigo || calendar.codigoModulo,
      cicloFormativo: cicloFormativo || calendar.cicloFormativo,
      docente: docenteNombre || calendar.docente,
    };
    if (currentUds && currentUds.length > 0) {
      const withUds = autoDistributeUdsToCalendar(updated, currentUds, moduloCodigo);
      updateCurrentCalendar(withUds);
      showToast(`Sincronizado con módulo "${moduloCodigo}" y ${currentUds.length} UDs de SIGRE`);
    } else {
      updateCurrentCalendar(updated);
      showToast(`Sincronizados datos del módulo activo "${moduloCodigo}"`);
    }
  };

  // Export Full Teacher Multi-Module Portfolio
  const handleExportPortfolio = () => {
    const portfolioData = {
      tipo: "CARTERA_CALENDARIOS_DOCENTE_SIGRE",
      fechaExportacion: new Date().toISOString(),
      docente: docenteNombre || calendar.docente || "Profesorado FP",
      totalAsignaturas: calendarsList.length,
      calendars: calendarsList,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolioData, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute(
      "download",
      `Cartera_Completa_Calendarios_Docente_SIGRE_${calendar.academicYear}_${calendarsList.length}_Modulos.json`
    );
    dl.click();
    showToast(`Cartera completa (${calendarsList.length} módulos) exportada con éxito`);
  };

  // Import Portfolio from JSON
  const handleImportPortfolio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.calendars && Array.isArray(json.calendars) && json.calendars.length > 0) {
          setCalendarsList(json.calendars);
          setActiveCalendarId(json.calendars[0].id);
          if (onCalendarChange) onCalendarChange(json.calendars[0]);
          showToast(`Cartera restaurada: ${json.calendars.length} asignaturas cargadas`);
        } else if (json.academicYear && json.legendItems) {
          // Single calendar JSON
          const imported: SigreAcademicCalendar = {
            ...json,
            id: json.id || `cal_imported_${Date.now()}`,
          };
          setCalendarsList([...calendarsList.filter((c) => c.id !== imported.id), imported]);
          setActiveCalendarId(imported.id);
          if (onCalendarChange) onCalendarChange(imported);
          showToast(`Asignatura "${imported.codigoModulo || imported.academicYear}" importada`);
        } else {
          alert("El archivo JSON no tiene un formato reconocido de calendario o cartera docente SIGRE.");
        }
      } catch (err: any) {
        alert("Error al leer el archivo JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Delete Current Course
  const handleDeleteCurrentCourse = () => {
    if (calendarsList.length <= 1) {
      alert("No se puede eliminar el único módulo disponible.");
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la planificación de "${calendar.codigoModulo || calendar.moduloFormativo}" (${calendar.academicYear})? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    const updatedList = calendarsList.filter((c) => c.id !== calendar.id);
    setCalendarsList(updatedList);
    const nextCal = updatedList[0];
    setActiveCalendarId(nextCal.id);
    if (onCalendarChange) onCalendarChange(nextCal);
    showToast(`Módulo "${calendar.codigoModulo || calendar.moduloFormativo}" eliminado`);
  };

  const handleDeleteSpecificCalendar = (calId: string) => {
    if (calendarsList.length <= 1) {
      alert("No se puede eliminar el único módulo disponible.");
      return;
    }
    const calToDelete = calendarsList.find((c) => c.id === calId);
    const updatedList = calendarsList.filter((c) => c.id !== calId);
    setCalendarsList(updatedList);
    if (activeCalendarId === calId) {
      const nextCal = updatedList[0];
      setActiveCalendarId(nextCal.id);
      if (onCalendarChange) onCalendarChange(nextCal);
    }
    if (calToDelete) {
      showToast(`Módulo "${calToDelete.codigoModulo || calToDelete.moduloFormativo}" eliminado`);
    }
  };

  // Save Resolution Reference & Link
  const handleSaveResolution = () => {
    if (!editingResolutionModal) return;
    const updated = {
      ...calendar,
      resolutionRef: editingResolutionModal.resolutionRef,
      resolutionUrl: editingResolutionModal.resolutionUrl,
      province: editingResolutionModal.province,
      educationalStage: editingResolutionModal.educationalStage,
      notes: editingResolutionModal.notes,
    };
    updateCurrentCalendar(updated);
    setEditingResolutionModal(null);
    showToast("Resolución y enlace oficial actualizados");
  };

  // Auto-distribute current UDs of the module
  const handleAutoDistributeUds = () => {
    if (!currentUds || currentUds.length === 0) {
      const demoUds: SigreUDItem[] = [
        { id: "UD01", number: 1, bcCode: "RA08", title: "Prevención de riesgos laborales y PA", fullCode: "UD01. RA08", isPrl: true, status: "completed" },
        { id: "UD02", number: 2, bcCode: "RA01", title: "Procesos de mecanizado y unión", fullCode: "UD02. RA01", isPrl: false, status: "completed" },
        { id: "UD03", number: 3, bcCode: "RA02", title: "Dibujo técnico y trazado de tuberías", fullCode: "UD03. RA02", isPrl: false, status: "completed" },
        { id: "UD04", number: 4, bcCode: "RA03", title: "Técnicas anticorrosión y aislamiento", fullCode: "UD04. RA03", isPrl: false, status: "completed" },
        { id: "UD05", number: 5, bcCode: "RA04", title: "Montaje de equipos térmicos", fullCode: "UD05. RA04", isPrl: false, status: "completed" },
        { id: "UD06", number: 6, bcCode: "RA05", title: "Instalaciones de bombeo y redes de agua", fullCode: "UD06. RA05", isPrl: false, status: "completed" },
        { id: "UD07", number: 7, bcCode: "RA06", title: "Pruebas de estanqueidad y puesta en marcha", fullCode: "UD07. RA06", isPrl: false, status: "completed" },
        { id: "UD08", number: 8, bcCode: "RA07", title: "Mantenimiento preventivo e higienización", fullCode: "UD08. RA07", isPrl: false, status: "completed" },
      ];
      const updated = autoDistributeUdsToCalendar(calendar, demoUds, moduloCodigo);
      updateCurrentCalendar(updated);
      showToast("Distribución completada: UDs asignadas de Septiembre a Mayo. Semanas 1-3 de Junio reservadas para Recuperaciones y Semana 4 para Evaluación Extraordinaria y Planificación.");
    } else {
      const updated = autoDistributeUdsToCalendar(calendar, currentUds, moduloCodigo);
      updateCurrentCalendar(updated);
      showToast(`Distribuidas ${currentUds.length} UDs (Sep-May). Semanas 1-3 de Junio reservadas para Recuperaciones de aprendizajes no adquiridos y semana 4 para Evaluación Extraordinaria/Planificación.`);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calendar, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute(
      "download",
      `Calendario_Escolar_${calendar.academicYear}_${calendar.codigoModulo?.replace(/[^a-z0-9]/gi, "_") || "SIGRE"}.sigre-cal.json`
    );
    dl.click();
    showToast("Calendario Escolar exportado en archivo JSON con éxito");
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === "object") {
          const yearParts = String(json.academicYear || "2026-2027").split("-");
          const startYear = parseInt(yearParts[0], 10) || 2026;
          const endYear = parseInt(yearParts[1], 10) || startYear + 1;

          const imported: SigreAcademicCalendar = {
            id: json.id || `cal_imported_${Date.now()}`,
            academicYear: json.academicYear || `${startYear}-${endYear}`,
            region: json.region || "Andalucía",
            province: json.province || "Málaga",
            resolutionRef: json.resolutionRef || "",
            resolutionUrl: json.resolutionUrl || "",
            educationalStage: json.educationalStage || "Formación Profesional",
            startDate: json.startDate || `${startYear}-09-15`,
            endDate: json.endDate || `${endYear}-06-24`,
            moduloFormativo: json.moduloFormativo || moduloNombre || "",
            codigoModulo: json.codigoModulo || moduloCodigo || "",
            cicloFormativo: json.cicloFormativo || cicloFormativo || "",
            docente: json.docente || docenteNombre || "",
            totalLectivosEstimated: Number(json.totalLectivosEstimated) || 175,
            legendItems: Array.isArray(json.legendItems) ? json.legendItems : [],
            dayOverrides: typeof json.dayOverrides === "object" && json.dayOverrides !== null ? json.dayOverrides : {},
            specialEvents: Array.isArray(json.specialEvents) ? json.specialEvents : [],
            notes: json.notes || "",
          };

          setCalendarsList((prev) => [...prev.filter((c) => c.id !== imported.id), imported]);
          setActiveCalendarId(imported.id);
          if (onCalendarChange) onCalendarChange(imported);
          showToast(`Calendario ${imported.academicYear} importado correctamente`);
        } else {
          alert("El archivo JSON seleccionado no contiene un objeto de configuración válido.");
        }
      } catch (err: any) {
        alert("Error al leer el archivo JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Download Official A4 as standalone HTML file
  const handleDownloadA4Html = () => {
    const htmlA4 = renderOfficialSchoolCalendarA4Html(calendar);
    const blob = new Blob([htmlA4], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Calendario_Oficial_A4_${calendar.academicYear}_${calendar.codigoModulo || "FP"}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast("Documento HTML A4 descargado");
  };

  // Open Official A4 in a clean new tab
  const handleOpenA4NewTab = () => {
    const htmlA4 = renderOfficialSchoolCalendarA4Html(calendar);
    const blob = new Blob([htmlA4], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Print Official A4 (Matches authentic Junta de Andalucía resolution in 5-col x 2-row rigid landscape grid)
  const handlePrintOfficialA4 = () => {
    const htmlA4 = renderOfficialSchoolCalendarA4Html(calendar);

    // Strategy 1: PostMessage and Direct print on preview iframe if open and mounted
    if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
      try {
        previewIframeRef.current.contentWindow.postMessage({ type: "PRINT" }, "*");
        previewIframeRef.current.contentWindow.focus();
        previewIframeRef.current.contentWindow.print();
        showToast("Abriendo diálogo de impresión A4 apaisado...");
        return;
      } catch (err) {
        console.warn("Direct iframe print fallback triggered:", err);
      }
    }

    // Strategy 2: Clean window write for guaranteed cross-origin printing
    try {
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlA4);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {}
        }, 300);
        showToast("Abriendo diálogo de impresión A4 apaisado...");
        return;
      }
    } catch (e) {
      console.warn("Window open print failed:", e);
    }

    // Strategy 3: Blob URL fallback
    try {
      const blob = new Blob([htmlA4], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, "_blank");
      if (win) {
        win.onload = () => {
          setTimeout(() => {
            try {
              win.focus();
              win.print();
            } catch (e) {}
          }, 300);
        };
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        showToast("Abriendo vista de impresión en nueva pestaña...");
        return;
      }
    } catch (e) {
      console.warn("Blob URL window open failed:", e);
    }

    // Strategy 4: Dynamic hidden iframe fallback
    try {
      let iframe = document.getElementById("sigre-official-print-iframe") as HTMLIFrameElement | null;
      if (iframe) {
        iframe.remove();
      }
      iframe = document.createElement("iframe");
      iframe.id = "sigre-official-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "-9999px";
      iframe.style.bottom = "-9999px";
      iframe.style.width = "297mm";
      iframe.style.height = "210mm";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlA4);
        doc.close();
        setTimeout(() => {
          try {
            iframe?.contentWindow?.focus();
            iframe?.contentWindow?.print();
          } catch (err) {
            handleOpenA4NewTab();
          }
        }, 350);
      }
    } catch (e) {
      handleOpenA4NewTab();
    }
  };

  // Save day override from modal
  const handleSaveDayOverride = () => {
    if (!editingDayModal) return;
    const { dateStr, override } = editingDayModal;

    const newOverrides = { ...calendar.dayOverrides };
    if (!override.type && !override.legendItemId) {
      delete newOverrides[dateStr];
    } else {
      let customColor = override.customColor;
      let customTextColor = override.customTextColor;

      if (override.legendItemId) {
        const leg = calendar.legendItems.find((l) => l.id === override.legendItemId);
        if (leg) {
          customColor = leg.color;
          customTextColor = leg.textColor;
        }
      }

      newOverrides[dateStr] = {
        date: dateStr,
        type: (override.type || "lectivo") as SigreCalendarDayType,
        legendItemId: override.legendItemId,
        assignedUdId: override.assignedUdId,
        assignedUdCode: override.assignedUdCode,
        customColor,
        customTextColor,
        title: override.title,
        notes: override.notes,
      };
    }

    updateCurrentCalendar({
      ...calendar,
      dayOverrides: newOverrides,
    });
    setEditingDayModal(null);
    showToast(`Día ${dateStr} actualizado`);
  };

  // Create new UD from inside Day Modal and instantly link to the day
  const handleCreateAndAssignInlineUd = () => {
    if (!inlineNewUd.code.trim() || !inlineNewUd.title.trim()) {
      showToast("Por favor introduce el código y título de la nueva UD");
      return;
    }
    if (!editingDayModal) return;

    const newUdId = `leg_ud_${Date.now()}`;
    const dateParts = editingDayModal.dateStr.split("-");
    const monthNum = parseInt(dateParts[1], 10);
    const dayNum = parseInt(dateParts[2], 10);
    const optimalText = getOptimalTextColorForBg(inlineNewUd.color);

    const newLegItem: SigreCalendarLegendItem = {
      id: newUdId,
      code: inlineNewUd.code.trim(),
      title: `${inlineNewUd.code.trim()} (${inlineNewUd.title.trim()})`,
      type: "ud_ra",
      color: inlineNewUd.color,
      textColor: optimalText,
      monthTarget: monthNum,
      sidePosition: "right",
      dayRangeText: `${dayNum} ${MONTH_NAMES_ES[monthNum - 1]?.slice(0, 3)}`,
    };

    const newLegends = [...calendar.legendItems, newLegItem];
    const newOverrides = { ...calendar.dayOverrides };
    newOverrides[editingDayModal.dateStr] = {
      date: editingDayModal.dateStr,
      type: "lectivo",
      legendItemId: newUdId,
      assignedUdId: newUdId,
      assignedUdCode: newLegItem.code,
      customColor: newLegItem.color,
      customTextColor: optimalText,
      title: newLegItem.title,
    };

    updateCurrentCalendar({
      ...calendar,
      legendItems: newLegends,
      dayOverrides: newOverrides,
    });

    setEditingDayModal(null);
    showToast(`Nueva UD "${newLegItem.code}" creada y asignada al día`);
  };

  // Create new Custom Event / Holiday from inside Day Modal and link to day
  const handleCreateAndAssignInlineCustomEvent = () => {
    if (!inlineNewEvent.title.trim()) {
      showToast("Por favor introduce el nombre del evento o festivo");
      return;
    }
    if (!editingDayModal) return;

    const newEventId = `leg_custom_${Date.now()}`;
    const dateParts = editingDayModal.dateStr.split("-");
    const monthNum = parseInt(dateParts[1], 10);
    const dayNum = parseInt(dateParts[2], 10);
    const optimalText = getOptimalTextColorForBg(inlineNewEvent.color);

    const newLegItem: SigreCalendarLegendItem = {
      id: newEventId,
      code: String(dayNum),
      title: inlineNewEvent.title.trim(),
      type: inlineNewEvent.type.startsWith("evaluacion") ? "evaluacion" : "hito",
      color: inlineNewEvent.color,
      textColor: optimalText,
      monthTarget: monthNum,
      sidePosition: inlineNewEvent.sidePosition,
      dayRangeText: `${dayNum} ${MONTH_NAMES_ES[monthNum - 1]?.slice(0, 3)}`,
    };

    const newLegends = [...calendar.legendItems, newLegItem];
    const newOverrides = { ...calendar.dayOverrides };
    newOverrides[editingDayModal.dateStr] = {
      date: editingDayModal.dateStr,
      type: inlineNewEvent.type,
      legendItemId: newEventId,
      customColor: inlineNewEvent.color,
      customTextColor: optimalText,
      title: inlineNewEvent.title.trim(),
    };

    updateCurrentCalendar({
      ...calendar,
      legendItems: newLegends,
      dayOverrides: newOverrides,
    });

    setEditingDayModal(null);
    showToast(`Evento/Festivo "${newLegItem.title}" creado y fijado en el calendario`);
  };

  // Save / Add legend item
  const handleSaveLegendItem = (item: Partial<SigreCalendarLegendItem>, isNew: boolean) => {
    if (!item.code || !item.title) {
      alert("Por favor introduce código y título del elemento.");
      return;
    }

    let updatedLegendItems = [...calendar.legendItems];
    if (isNew) {
      const newId = `leg_custom_${Date.now()}`;
      updatedLegendItems.push({
        id: newId,
        code: item.code,
        title: item.title,
        type: item.type || "ud_ra",
        color: item.color || "#fed7aa",
        textColor: item.textColor || "#9a3412",
        monthTarget: item.monthTarget || 9,
        sidePosition: item.sidePosition || "right",
        dayRangeText: item.dayRangeText,
        notes: item.notes,
      });
    } else {
      updatedLegendItems = updatedLegendItems.map((l) => (l.id === item.id ? ({ ...l, ...item } as SigreCalendarLegendItem) : l));
    }

    updateCurrentCalendar({
      ...calendar,
      legendItems: updatedLegendItems,
    });
    setEditingLegendModal(null);
    showToast(isNew ? "Elemento añadido a la leyenda" : "Elemento de leyenda actualizado");
  };

  // Delete legend item
  const handleDeleteLegendItem = (id: string) => {
    if (!confirm("¿Deseas eliminar este elemento de la leyenda y desvincularlo de los días asignados?")) return;

    const updatedLegends = calendar.legendItems.filter((l) => l.id !== id);
    const updatedOverrides = { ...calendar.dayOverrides };

    Object.keys(updatedOverrides).forEach((date) => {
      if (updatedOverrides[date].legendItemId === id) {
        delete updatedOverrides[date];
      }
      if (updatedOverrides[date].assignedUdId === id) {
        delete updatedOverrides[date].assignedUdId;
        delete updatedOverrides[date].assignedUdCode;
      }
    });

    updateCurrentCalendar({
      ...calendar,
      legendItems: updatedLegends,
      dayOverrides: updatedOverrides,
    });
    showToast("Elemento eliminado de la leyenda");
  };

  // --- FORMAT PAINTER / COPIAR FORMATO ENGINE ---

  // Copy format from a specific calendar date
  const handleCopyFormatFromDate = (dateStr: string, dayData: any) => {
    const override = calendar.dayOverrides[dateStr];
    let newFormat: CopiedFormatState;

    if (override) {
      newFormat = {
        type: override.type,
        customColor: override.customColor,
        customTextColor: override.customTextColor,
        legendItemId: override.legendItemId,
        assignedUdId: override.assignedUdId,
        assignedUdCode: override.assignedUdCode,
        title: override.title,
        label:
          override.title ||
          override.assignedUdCode ||
          getOfficialEventStyle(override.type).label ||
          "Formato de celda",
        sourceDate: dateStr,
      };
    } else {
      const isWeekend = dayData?.isWeekend;
      newFormat = {
        type: isWeekend ? "no_lectivo" : "lectivo",
        label: isWeekend ? "No lectivo (Fin de semana)" : "Lectivo ordinario",
        sourceDate: dateStr,
      };
    }

    setCopiedFormat(newFormat);
    setIsFormatPainterActive(true);
    setContextMenu(null);
    showToast(`📋 Formato copiado: "${newFormat.label}". Haz clic en días del calendario para aplicarlo.`);
  };

  // Copy format from a Legend Item (UD / Event / Dual / Recuperación)
  const handleCopyFormatFromLegendItem = (item: SigreCalendarLegendItem) => {
    const isDual = item.type === "dual";
    const isRecup = item.type === "recuperacion";
    const newFormat: CopiedFormatState = {
      type: isDual ? "periodo_dual_empresa" : isRecup ? "periodo_recuperacion" : "lectivo",
      customColor: item.color,
      customTextColor: item.textColor,
      legendItemId: item.id,
      assignedUdId: item.id,
      assignedUdCode: item.code,
      title: item.title,
      label: `${item.code} (${item.title || "UD"})`,
    };

    setCopiedFormat(newFormat);
    setIsFormatPainterActive(true);
    showToast(`🖌️ Pincel activo para "${item.code}". Haz clic en las celdas del calendario para pintarlas.`);
  };

  // Apply copied format to a single calendar date
  const applyCopiedFormatToDate = (dateStr: string) => {
    if (!copiedFormat) return;

    const [y, m, dNum] = dateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1, dNum);
    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

    // Strict protection: Weekends (Saturdays and Sundays) cannot have UDs or lectivo format applied
    if (isWeekend && (copiedFormat.type === "lectivo" || copiedFormat.assignedUdId || copiedFormat.legendItemId)) {
      showToast("⚠️ Los fines de semana (sábados y domingos) son días no lectivos. No se pueden asignar unidades didácticas.");
      return;
    }

    const newOverrides = { ...calendar.dayOverrides };
    const existing = calendar.dayOverrides[dateStr];

    // Plain lectivo format resets override
    if (
      copiedFormat.type === "lectivo" &&
      !copiedFormat.customColor &&
      !copiedFormat.legendItemId &&
      !copiedFormat.assignedUdId
    ) {
      delete newOverrides[dateStr];
      updateCurrentCalendar({
        ...calendar,
        dayOverrides: newOverrides,
      });
      showToast(`Día ${dateStr} restablecido a lectivo ordinario`);
      return;
    }

    // If target date is a special event and format is a UD / legend item, preserve visual priority
    if (
      existing &&
      isSpecialEventType(existing.type) &&
      (copiedFormat.legendItemId || copiedFormat.assignedUdId)
    ) {
      const udId = copiedFormat.legendItemId || copiedFormat.assignedUdId;
      const udCode = copiedFormat.assignedUdCode || copiedFormat.label;
      newOverrides[dateStr] = {
        ...existing,
        assignedUdId: udId,
        assignedUdCode: udCode,
      };
      showToast(`Asignada "${udCode}" a ${dateStr} (conservando evento festivo/evaluación)`);
    } else {
      newOverrides[dateStr] = {
        date: dateStr,
        type: copiedFormat.type,
        customColor: copiedFormat.customColor,
        customTextColor: copiedFormat.customTextColor,
        legendItemId: copiedFormat.legendItemId,
        assignedUdId: copiedFormat.assignedUdId,
        assignedUdCode: copiedFormat.assignedUdCode,
        title: copiedFormat.title,
      };
      showToast(`Formato "${copiedFormat.label}" aplicado a ${dateStr}`);
    }

    updateCurrentCalendar({
      ...calendar,
      dayOverrides: newOverrides,
    });
  };

  // Apply copied format to the whole school week (Mon-Fri)
  const applyFormatToWeek = (dateStr: string) => {
    if (!copiedFormat) return;

    const [y, m, dNum] = dateStr.split("-").map(Number);
    const targetDate = new Date(y, m - 1, dNum);
    const dayOfWeek = targetDate.getDay(); // 0 Sun, 1 Mon ... 6 Sat
    const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(y, m - 1, dNum + mondayDiff);

    const newOverrides = { ...calendar.dayOverrides };
    let count = 0;

    for (let i = 0; i < 5; i++) {
      const curr = new Date(monday);
      curr.setDate(monday.getDate() + i);
      const currStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`;
      const existing = newOverrides[currStr];

      if (
        existing &&
        isSpecialEventType(existing.type) &&
        (copiedFormat.legendItemId || copiedFormat.assignedUdId)
      ) {
        newOverrides[currStr] = {
          ...existing,
          assignedUdId: copiedFormat.legendItemId || copiedFormat.assignedUdId,
          assignedUdCode: copiedFormat.assignedUdCode || copiedFormat.label,
        };
        count++;
      } else {
        newOverrides[currStr] = {
          date: currStr,
          type: copiedFormat.type,
          customColor: copiedFormat.customColor,
          customTextColor: copiedFormat.customTextColor,
          legendItemId: copiedFormat.legendItemId,
          assignedUdId: copiedFormat.assignedUdId,
          assignedUdCode: copiedFormat.assignedUdCode,
          title: copiedFormat.title,
        };
        count++;
      }
    }

    updateCurrentCalendar({
      ...calendar,
      dayOverrides: newOverrides,
    });
    showToast(`🖌️ Formato "${copiedFormat.label}" aplicado a los ${count} días lectivos de la semana`);
  };

  // Apply format to multiple selected dates at once (direct helper)
  const applyCopiedFormatToDatesList = (dates: Set<string> | string[]) => {
    const activeCopied = copiedFormatRef.current || copiedFormat;
    if (!activeCopied) return;
    const dateArr = Array.from(dates);
    if (dateArr.length === 0) return;

    const currentCal = calendarRef.current || calendar;
    const newOverrides = { ...currentCal.dayOverrides };
    let count = 0;

    dateArr.forEach((dateStr) => {
      const [y, m, dNum] = dateStr.split("-").map(Number);
      const targetDate = new Date(y, m - 1, dNum);
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

      // Strict protection: Weekends cannot receive UDs or lectivo formatting
      if (isWeekend && (activeCopied.type === "lectivo" || activeCopied.assignedUdId || activeCopied.legendItemId)) {
        return;
      }

      const existing = newOverrides[dateStr];
      if (
        existing &&
        isSpecialEventType(existing.type) &&
        (activeCopied.legendItemId || activeCopied.assignedUdId)
      ) {
        newOverrides[dateStr] = {
          ...existing,
          assignedUdId: activeCopied.legendItemId || activeCopied.assignedUdId,
          assignedUdCode: activeCopied.assignedUdCode || activeCopied.label,
        };
      } else {
        newOverrides[dateStr] = {
          date: dateStr,
          type: activeCopied.type,
          legendItemId: activeCopied.legendItemId,
          assignedUdId: activeCopied.assignedUdId,
          assignedUdCode: activeCopied.assignedUdCode,
          customColor: activeCopied.customColor,
          customTextColor: activeCopied.customTextColor,
          title: activeCopied.title || activeCopied.label,
        };
      }
      count++;
    });

    updateCurrentCalendar({
      ...currentCal,
      dayOverrides: newOverrides,
    });
    showToast(`🖌️ Formato "${activeCopied.label}" aplicado a ${count} día${count > 1 ? "s" : ""}`);
    setSelectedDates(new Set());
    selectedDatesRef.current = new Set();
  };

  // Apply format to multiple selected dates at once
  const applyCopiedFormatToSelectedDates = () => {
    if (selectedDates.size === 0) return;
    applyCopiedFormatToDatesList(selectedDates);
  };

  // Helper to calculate list of YYYY-MM-DD dates between two dates
  const getDatesBetween = (startStr: string, endStr: string): string[] => {
    const dates: string[] = [];
    const [sY, sM, sD] = startStr.split("-").map(Number);
    const [eY, eM, eD] = endStr.split("-").map(Number);
    let curr = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    if (curr > end) {
      const temp = new Date(curr);
      curr = new Date(end);
      end.setTime(temp.getTime());
    }

    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const d = String(curr.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  // Handle cell mouse down for drag area / window selection
  const handleCellMouseDown = (
    e: React.MouseEvent,
    d: CalendarGridDay,
    mIdx: number,
    rowIdx: number,
    colIdx: number,
    monthDays: CalendarGridDay[]
  ) => {
    if (!d.isCurrentMonth || e.button !== 0) return; // only left click
    setSelectedSingleDay({ dateStr: d.dateString, dayData: d });
    setIsMouseDown(true);
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    dragStartInfoRef.current = {
      dateStr: d.dateString,
      monthIndex: mIdx,
      rowIdx,
      colIdx,
      monthDays,
    };

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedDates((prev) => {
        const next = new Set(prev);
        if (next.has(d.dateString)) {
          next.delete(d.dateString);
        } else {
          next.add(d.dateString);
        }
        selectedDatesRef.current = next;
        return next;
      });
    } else {
      const single = new Set([d.dateString]);
      setSelectedDates(single);
      selectedDatesRef.current = single;
    }
  };

  // Handle cell mouse enter during drag - calculates 2D rectangular window within the month
  const handleCellMouseEnter = (
    d: CalendarGridDay,
    mIdx: number,
    rowIdx: number,
    colIdx: number,
    monthDays: CalendarGridDay[]
  ) => {
    if (!isMouseDownRef.current || !d.isCurrentMonth || !dragStartInfoRef.current) return;
    hasDraggedRef.current = true;

    if (dragStartInfoRef.current.monthIndex === mIdx) {
      // 2D rectangular window submatrix selection within this month grid
      const startRow = dragStartInfoRef.current.rowIdx;
      const startCol = dragStartInfoRef.current.colIdx;
      const minRow = Math.min(startRow, rowIdx);
      const maxRow = Math.max(startRow, rowIdx);
      const minCol = Math.min(startCol, colIdx);
      const maxCol = Math.max(startCol, colIdx);

      const windowDates = new Set<string>();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const idx = r * 7 + c;
          const cellDay = monthDays[idx];
          if (cellDay && cellDay.isCurrentMonth) {
            windowDates.add(cellDay.dateString);
          }
        }
      }
      setSelectedDates(windowDates);
      selectedDatesRef.current = windowDates;
    } else {
      // Multi-month sequential range drag
      const range = getDatesBetween(dragStartInfoRef.current.dateStr, d.dateString);
      const rangeSet = new Set(range);
      setSelectedDates(rangeSet);
      selectedDatesRef.current = rangeSet;
    }
  };

  // 1-Click on Format Painter: Single-use mode (1 target cell, then auto-deactivates like MS Excel)
  const handleFormatPainterClick = () => {
    if (isFormatPainterActive) {
      setIsFormatPainterActive(false);
      setIsFormatPainterLocked(false);
      showToast("Modo Copiar Formato desactivado");
      return;
    }

    if (selectedSingleDay) {
      handleCopyFormatFromDate(selectedSingleDay.dateStr, selectedSingleDay.dayData);
    } else if (selectedDates.size > 0) {
      const firstDate = Array.from(selectedDates)[0];
      const override = calendar.dayOverrides[firstDate];
      handleCopyFormatFromDate(firstDate, { isWeekend: false, override });
    } else if (!copiedFormat) {
      const firstLeg = calendar.legendItems[0];
      if (firstLeg) {
        handleCopyFormatFromLegendItem(firstLeg);
      } else {
        setIsFormatPainterActive(true);
        setIsFormatPainterLocked(false);
        showToast("🖌️ Copiar formato (1 uso): Haz clic en una celda para copiar su formato.");
        return;
      }
    }
    setIsFormatPainterActive(true);
    setIsFormatPainterLocked(false);
    showToast("🖌️ Copiar formato (1 uso): Haz clic en la celda destino para aplicar el formato.");
  };

  // Double-Click on Format Painter: Persistent / Anchored mode (multiple target cells like MS Excel)
  const handleFormatPainterDoubleClick = () => {
    if (selectedSingleDay) {
      handleCopyFormatFromDate(selectedSingleDay.dateStr, selectedSingleDay.dayData);
    } else if (selectedDates.size > 0) {
      const firstDate = Array.from(selectedDates)[0];
      const override = calendar.dayOverrides[firstDate];
      handleCopyFormatFromDate(firstDate, { isWeekend: false, override });
    } else if (!copiedFormat) {
      const firstLeg = calendar.legendItems[0];
      if (firstLeg) {
        handleCopyFormatFromLegendItem(firstLeg);
      }
    }
    setIsFormatPainterActive(true);
    setIsFormatPainterLocked(true);
    showToast("🖌️📌 Copiar formato ANCLADO (Modo continuo): Haz clic en varias celdas para aplicar el formato. Pulsa Esc o clic para salir.");
  };

  // Toggle Format Painter button (Backward compatibility helper)
  const handleToggleFormatPainter = () => {
    handleFormatPainterClick();
  };

  // Assign Range of Dates with Special Event Prevalence
  const handleApplyRangeAssignment = () => {
    if (!rangeAssignModal || !rangeAssignModal.startDate || !rangeAssignModal.endDate || !rangeAssignModal.legendItemId) {
      alert("Indica fecha inicial, fecha final y selecciona una Unidad Didáctica o Evento.");
      return;
    }

    const { startDate, endDate, legendItemId, preserveSpecialEvents } = rangeAssignModal;
    const leg = calendar.legendItems.find((l) => l.id === legendItemId);
    if (!leg) return;

    const { updatedCalendar, countAssigned, countPreserved } = assignRangeToCalendar(
      calendar,
      startDate,
      endDate,
      leg,
      preserveSpecialEvents
    );

    updateCurrentCalendar(updatedCalendar);
    setRangeAssignModal(null);

    if (preserveSpecialEvents && countPreserved > 0) {
      showToast(`Asignada "${leg.code}" a ${countAssigned} días lectivos (${countPreserved} eventos festivos/evaluaciones conservaron su prevalencia visual)`);
    } else {
      showToast(`Asignada "${leg.code}" a ${countAssigned} días entre ${startDate} y ${endDate}`);
    }
  };

  // --- DRAG AND DROP ENGINE FOR MOVING ASSIGNED FORMATS / MILESTONES / EVALUATIONS ---

  // Drag Start on a Day Cell with assigned format / milestone / UD / evaluation
  const handleDayCellDragStart = (
    e: React.DragEvent,
    d: CalendarGridDay,
    monthName: string
  ) => {
    if (!d.isCurrentMonth) {
      e.preventDefault();
      return;
    }

    const hasContent = Boolean(
      d.override ||
        d.assignedUdId ||
        d.specialEventType ||
        (d.displayBgColor && d.displayBgColor !== "transparent") ||
        d.hasSpecialPrevalence
    );

    if (!hasContent) {
      e.preventDefault();
      return;
    }

    const title =
      d.override?.title ||
      d.specialEventLabel ||
      d.legendItem?.title ||
      d.assignedUdCode ||
      (d.override?.type ? getOfficialEventStyle(d.override.type).label : "Asignación");

    const dragPayload = {
      sourceDateStr: d.dateString,
      sourceDayNumber: d.dayNumber,
      sourceMonthName: monthName,
      title,
      override: d.override ? { ...d.override } : undefined,
      assignedUdId: d.assignedUdId,
      assignedUdCode: d.assignedUdCode,
      specialEventType: d.specialEventType,
      specialEventLabel: d.specialEventLabel,
      displayBgColor: d.displayBgColor,
      displayTextColor: d.displayTextColor,
      legendItemId: d.override?.legendItemId || d.legendItem?.id,
    };

    setDraggedDayData(dragPayload);
    draggedDayDataRef.current = dragPayload;

    try {
      e.dataTransfer.setData("application/sigre-day-format", JSON.stringify(dragPayload));
      e.dataTransfer.setData("text/plain", d.dateString);
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      console.warn("Drag setData error", err);
    }
  };

  const handleDayCellDragOver = (e: React.DragEvent, d: CalendarGridDay) => {
    if (!d.isCurrentMonth) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDayCellDragEnter = (e: React.DragEvent, d: CalendarGridDay) => {
    if (!d.isCurrentMonth) return;
    e.preventDefault();
    setDragOverTargetDate(d.dateString);
  };

  const handleDayCellDragLeave = (e: React.DragEvent, d: CalendarGridDay) => {
    if (dragOverTargetDate === d.dateString) {
      setDragOverTargetDate(null);
    }
  };

  const handleDayCellDragEnd = () => {
    setDraggedDayData(null);
    draggedDayDataRef.current = null;
    setDragOverTargetDate(null);
  };

  // Drop on target cell: relocates the assigned format, evaluation, holiday or UD to the target cell
  const handleDayCellDrop = (
    e: React.DragEvent,
    targetDay: CalendarGridDay,
    targetMonthName: string
  ) => {
    e.preventDefault();
    setDragOverTargetDate(null);

    let payload = draggedDayDataRef.current;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData("application/sigre-day-format");
        if (raw) payload = JSON.parse(raw);
      } catch (err) {
        console.warn("Could not parse drag payload", err);
      }
    }

    if (!payload || !targetDay.isCurrentMonth) {
      setDraggedDayData(null);
      return;
    }

    const {
      sourceDateStr,
      sourceDayNumber,
      title,
      override,
      legendItemId,
      assignedUdId,
      assignedUdCode,
    } = payload;
    const targetDateStr = targetDay.dateString;

    if (sourceDateStr === targetDateStr) {
      setDraggedDayData(null);
      return;
    }

    if (targetDay.isWeekend && (override?.type === "lectivo" || assignedUdId || assignedUdCode || legendItemId)) {
      showToast("⚠️ Los fines de semana (sábados y domingos) son días no lectivos. No se pueden mover ni asignar unidades didácticas a estos días.");
      setDraggedDayData(null);
      return;
    }

    const newOverrides = { ...calendar.dayOverrides };
    const targetDateParts = targetDateStr.split("-");
    const targetMonthNum = parseInt(targetDateParts[1], 10);
    const targetDayNum = parseInt(targetDateParts[2], 10);

    // 1. Prepare and apply override onto target date
    if (override) {
      newOverrides[targetDateStr] = {
        ...override,
        date: targetDateStr,
      };
    } else if (assignedUdId || assignedUdCode) {
      newOverrides[targetDateStr] = {
        date: targetDateStr,
        type: "lectivo",
        assignedUdId,
        assignedUdCode,
        legendItemId,
        customColor: payload.displayBgColor,
        customTextColor: payload.displayTextColor,
        title,
      };
    } else if (payload.specialEventType) {
      newOverrides[targetDateStr] = {
        date: targetDateStr,
        type: payload.specialEventType,
        legendItemId,
        customColor: payload.displayBgColor,
        customTextColor: payload.displayTextColor,
        title: payload.specialEventLabel || title,
      };
    }

    // 2. Clear previous override on source date
    delete newOverrides[sourceDateStr];

    // 3. If moving an evaluation session, holiday or milestone that has an associated lateral legend item,
    // update the legend item's target day/month text and code seamlessly!
    let newLegendItems = [...calendar.legendItems];
    if (legendItemId) {
      const targetMonthShort = MONTH_NAMES_ES[targetMonthNum - 1]?.slice(0, 3) || "";
      newLegendItems = newLegendItems.map((leg) => {
        if (leg.id === legendItemId) {
          const isEvalOrHito = leg.type === "evaluacion" || leg.type === "hito";
          return {
            ...leg,
            code: isEvalOrHito ? `${targetDayNum} ${targetMonthShort}` : leg.code,
            monthTarget: targetMonthNum,
            dayRangeText: `${targetDayNum} ${targetMonthShort}`,
          };
        }
        return leg;
      });
    }

    // 4. Save and commit changes with Undo/Redo history
    updateCurrentCalendar({
      ...calendar,
      legendItems: newLegendItems,
      dayOverrides: newOverrides,
    });

    setDraggedDayData(null);
    draggedDayDataRef.current = null;

    showToast(`🎯 Asignación "${title}" movida con éxito del día ${sourceDayNumber} al día ${targetDay.dayNumber} de ${MONTH_NAMES_ES[targetMonthNum - 1] || targetMonthName}`);
  };

  // Quick Action from Context Menu
  const handleContextMenuQuickAction = (
    dateStr: string,
    actionType:
      | "assign_legend"
      | "assign_special_type"
      | "clear"
      | "open_range"
      | "open_edit_modal",
    payload?: any
  ) => {
    setContextMenu(null);

    if (actionType === "open_range") {
      setRangeAssignModal({
        startDate: dateStr,
        endDate: dateStr,
        legendItemId: calendar.legendItems[0]?.id || "",
        preserveSpecialEvents: true,
      });
      return;
    }

    if (actionType === "open_edit_modal") {
      const monthNum = parseInt(dateStr.split("-")[1], 10);
      const dayNum = parseInt(dateStr.split("-")[2], 10);
      setEditingDayModal({
        dateStr,
        dayNumber: dayNum,
        monthName: MONTH_NAMES_ES[monthNum - 1],
        override: calendar.dayOverrides[dateStr] || { type: "lectivo" },
      });
      return;
    }

    if (actionType === "clear") {
      const newOverrides = { ...calendar.dayOverrides };
      delete newOverrides[dateStr];
      updateCurrentCalendar({
        ...calendar,
        dayOverrides: newOverrides,
      });
      showToast(`Día ${dateStr} restablecido a lectivo ordinario`);
      return;
    }

    if (actionType === "assign_legend" && payload) {
      const [y, m, dNum] = dateStr.split("-").map(Number);
      const targetDate = new Date(y, m - 1, dNum);
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

      if (isWeekend) {
        showToast("⚠️ Los fines de semana (sábados y domingos) son días no lectivos. No se pueden asignar unidades didácticas a estos días.");
        return;
      }

      const leg: SigreCalendarLegendItem = payload;
      const existing = calendar.dayOverrides[dateStr];
      const newOverrides = { ...calendar.dayOverrides };

      if (existing && isSpecialEventType(existing.type)) {
        // Retain special event, link UD
        newOverrides[dateStr] = {
          ...existing,
          assignedUdId: leg.id,
          assignedUdCode: leg.code,
        };
        showToast(`Vinculada ${leg.code} al día especial ${dateStr} (prevalece visualmente ${getOfficialEventStyle(existing.type).label})`);
      } else {
        newOverrides[dateStr] = {
          date: dateStr,
          type:
            leg.type === "dual"
              ? "periodo_dual_empresa"
              : leg.type === "recuperacion"
              ? "periodo_recuperacion"
              : "lectivo",
          legendItemId: leg.id,
          customColor: leg.color,
          customTextColor: leg.textColor,
          title: leg.title,
        };
        showToast(`Asignada ${leg.code} al ${dateStr}`);
      }

      updateCurrentCalendar({
        ...calendar,
        dayOverrides: newOverrides,
      });
      return;
    }

    if (actionType === "assign_special_type" && payload) {
      const spType: SigreCalendarDayType = payload.type;
      const spTitle: string = payload.title;
      const style = getOfficialEventStyle(spType);
      const existing = calendar.dayOverrides[dateStr];

      const newOverrides = {
        ...calendar.dayOverrides,
        [dateStr]: {
          date: dateStr,
          type: spType,
          title: spTitle || style.label,
          customColor: style.bgColor,
          customTextColor: style.textColor,
          assignedUdId: existing?.assignedUdId || existing?.legendItemId,
          assignedUdCode: existing?.assignedUdCode,
        },
      };

      updateCurrentCalendar({
        ...calendar,
        dayOverrides: newOverrides,
      });
      showToast(`Marcado ${dateStr} como ${spTitle || style.label}`);
    }
  };

  // Open Context Menu
  const handleDayContextMenu = (
    e: React.MouseEvent,
    dayData: any,
    monthName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dayData.isCurrentMonth) return;

    setSelectedSingleDay({ dateStr: dayData.dateString, dayData });

    const menuWidth = 340;
    const menuEstimatedHeight = 460;
    const padding = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate X coordinate: prefer positioning right of click, flip left if overflowing
    let posX = e.clientX + 4;
    if (posX + menuWidth > viewportWidth - padding) {
      posX = Math.max(padding, e.clientX - menuWidth - 4);
    }
    posX = Math.max(padding, Math.min(posX, viewportWidth - menuWidth - padding));

    // Calculate Y coordinate: if clicked in bottom area, position upwards or clamp
    let posY = e.clientY - 10;
    if (posY + menuEstimatedHeight > viewportHeight - padding) {
      posY = Math.max(padding, viewportHeight - menuEstimatedHeight - padding);
    }
    posY = Math.max(padding, Math.min(posY, viewportHeight - menuEstimatedHeight - padding));

    setContextMenu({
      isOpen: true,
      x: posX,
      y: posY,
      dateStr: dayData.dateString,
      dayNumber: dayData.dayNumber,
      monthName,
      dayInfo: dayData,
    });
  };

  // Open Context Menu when clicking or right-clicking on Month Lateral Legend Tags
  const handleLegendClickOrContextMenu = (
    e: React.MouseEvent,
    leg: MonthLateralTag,
    year: number,
    month: number,
    monthName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Set highlight on this legend item
    setHighlightedLegendId(leg.id);

    const monthNum = month + 1;
    const monthPrefix = `${year}-${String(monthNum).padStart(2, "0")}`;

    // Find representative date for this legend in this month
    let targetDate = leg.dateStr;
    if (!targetDate || !targetDate.startsWith(monthPrefix)) {
      const matchKey = Object.keys(calendar.dayOverrides).find(
        (k) =>
          k.startsWith(monthPrefix) &&
          (calendar.dayOverrides[k].legendItemId === leg.id ||
            calendar.dayOverrides[k].assignedUdId === leg.id ||
            calendar.dayOverrides[k].assignedUdCode === leg.code)
      );
      targetDate = matchKey || `${monthPrefix}-01`;
    }

    const parts = targetDate.split("-");
    const dayNum = parseInt(parts[2], 10) || 1;
    const dayData = {
      dateString: targetDate,
      dayNumber: dayNum,
      isCurrentMonth: true,
      override: calendar.dayOverrides[targetDate],
      legendItem: leg,
    };

    setSelectedSingleDay({ dateStr: targetDate, dayData });

    // Pre-select tab corresponding to legend type
    let tab: "uds" | "evals" | "festivos" | "especiales" = "uds";
    if (leg.type === "hito" || (leg.type as string) === "evaluacion" || (leg.type as string) === "inicio_fin") tab = "evals";
    else if (leg.type === "festivo" || leg.type === "vacaciones") tab = "festivos";
    else if (leg.type === "dual" || leg.type === "recuperacion") tab = "especiales";

    setContextMenuTab(tab);

    const menuWidth = 340;
    const menuEstimatedHeight = 460;
    const padding = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let posX = e.clientX + 4;
    if (posX + menuWidth > viewportWidth - padding) {
      posX = Math.max(padding, e.clientX - menuWidth - 4);
    }
    posX = Math.max(padding, Math.min(posX, viewportWidth - menuWidth - padding));

    let posY = e.clientY - 10;
    if (posY + menuEstimatedHeight > viewportHeight - padding) {
      posY = Math.max(padding, viewportHeight - menuEstimatedHeight - padding);
    }
    posY = Math.max(padding, Math.min(posY, viewportHeight - menuEstimatedHeight - padding));

    setContextMenu({
      isOpen: true,
      x: posX,
      y: posY,
      dateStr: targetDate,
      dayNumber: dayNum,
      monthName,
      dayInfo: dayData,
    });
  };

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Top Banner: Multi-Module Teacher Portfolio, Academic Year & Resolution Toolbar */}
      <div className="p-4 bg-surface border border-border-default rounded-2xl space-y-3.5 shadow-md">
        {/* Header Title & General Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border-default pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 font-bold shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-text-primary text-base">
                  Calendario Escolar y Planificador Temporal de UDs
                </h3>

                {/* DIRECT INTERACTIVE ACADEMIC YEAR SELECTOR */}
                <div className="flex items-center gap-1.5 bg-emerald-500/15 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-500/40">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    Curso:
                  </span>
                  <select
                    id="academic-year-quick-select"
                    value={calendar.academicYear}
                    onChange={(e) => handleQuickChangeAcademicYear(e.target.value)}
                    className="bg-surface text-emerald-950 dark:text-emerald-200 font-black text-[11px] px-2 py-0.5 rounded-lg border border-emerald-500/40 cursor-pointer hover:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    title="Cambiar rápidamente el curso escolar de este calendario"
                  >
                    <option value="2026-2027">2026-2027 (Oficial Activo)</option>
                    <option value="2025-2026">2025-2026 (Oficial)</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2027-2028">2027-2028</option>
                    <option value="2028-2029">2028-2029</option>
                    {calendar.academicYear &&
                      !["2026-2027", "2025-2026", "2024-2025", "2027-2028", "2028-2029"].includes(calendar.academicYear) && (
                        <option value={calendar.academicYear}>{calendar.academicYear} (Personalizado)</option>
                      )}
                    <option value="custom">✏️ Otro / Opciones avanzadas...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetAcademicYear(calendar.academicYear || "2026-2027");
                      setCustomAcademicYearInput(calendar.academicYear || "2026-2027");
                      setIsChangeYearModalOpen(true);
                    }}
                    className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Abrir asistente para cambiar el curso escolar, migrar fechas o cargar marco oficial"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Cambiar</span>
                  </button>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Andalucía
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-alt text-text-secondary border border-border-default">
                  {calendar.province || "Málaga"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40">
                  {calendarsList.length} Asignatura{calendarsList.length > 1 ? "s" : ""} en Cartera
                </span>
              </div>
              <p className="text-text-muted text-[11px] mt-0.5">
                Organizador anual por módulos/asignaturas para temporalizar UDs/RAs de FP, periodos de FP Dual (FFEoE), sesiones de evaluación y recuperaciones.
              </p>
            </div>
          </div>

          {/* Quick Actions & Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Calendario Mensual vs Cronograma Módulo vs Cronograma Cartera */}
            <div className="flex items-center gap-1 bg-alt p-1 rounded-xl border border-border-default">
              <button
                type="button"
                onClick={() => setCalendarViewMode("calendario")}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
                  calendarViewMode === "calendario"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-hover"
                }`}
                title="Ver matriz mensual del calendario escolar oficial"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Calendario Mensual</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode("cronograma_modulo")}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
                  calendarViewMode === "cronograma_modulo"
                    ? "bg-amber-500 text-black shadow-xs font-black"
                    : "text-text-secondary hover:text-text-primary hover:bg-hover"
                }`}
                title={`Ver y gestionar el cronograma temporal interactivo del módulo ${calendar.codigoModulo || "MOD"}`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cronograma del Módulo ({calendar.codigoModulo || "MOD"})</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode("cronograma_global")}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
                  calendarViewMode === "cronograma_global"
                    ? "bg-purple-600 text-white shadow-xs font-black"
                    : "text-text-secondary hover:text-text-primary hover:bg-hover"
                }`}
                title="Ver y comparar cronogramas de toda la cartera docente"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cronograma Global ({calendarsList.length})</span>
              </button>
            </div>

            {/* Global Undo / Redo */}
            <div className="flex items-center gap-1 bg-alt p-1 rounded-xl border border-border-default">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  history.length > 0
                    ? "bg-surface hover:bg-hover text-amber-600 dark:text-amber-300 border border-amber-500/40 shadow-xs"
                    : "text-text-muted cursor-not-allowed opacity-50"
                }`}
                title="Deshacer último cambio (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Deshacer</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={future.length === 0}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  future.length > 0
                    ? "bg-surface hover:bg-hover text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 shadow-xs"
                    : "text-text-muted cursor-not-allowed opacity-50"
                }`}
                title="Rehacer cambio (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Rehacer</span>
              </button>
            </div>

            {/* Auto-distribute UDs button */}
            <button
              type="button"
              onClick={handleAutoDistributeUds}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              title="Distribuir automáticamente las UDs creadas en el plan curricular a lo largo de las semanas lectivas respetando festivos"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Auto-distribuir UDs</span>
            </button>

            {/* Format Painter / Copiar Formato Button */}
            <button
              type="button"
              onClick={handleFormatPainterClick}
              onDoubleClick={handleFormatPainterDoubleClick}
              className={`px-3 py-1.5 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                isFormatPainterActive
                  ? isFormatPainterLocked
                    ? "bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/40 ring-2 ring-amber-300 animate-pulse"
                    : "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 ring-1 ring-amber-300"
                  : copiedFormat
                  ? "bg-alt hover:bg-hover text-amber-600 dark:text-amber-300 border-amber-500/40"
                  : "bg-alt hover:bg-hover text-text-primary border-border-default"
              }`}
              title="Copiar Formato: 1 clic para 1 celda, doble clic para anclar a varias (MS Excel). Pulsa Esc para salir."
            >
              <Paintbrush className={`w-3.5 h-3.5 ${isFormatPainterActive ? "text-slate-950" : "text-amber-500"}`} />
              <span>
                {isFormatPainterActive
                  ? isFormatPainterLocked
                    ? "📌 Anclado (Continuo)"
                    : "🖌️ 1 Celda"
                  : "Copiar Formato"}
              </span>
            </button>

            {/* Range Assignment Button */}
            <button
              type="button"
              onClick={() =>
                setRangeAssignModal({
                  startDate: `${calendar.startDate}`,
                  endDate: `${calendar.startDate}`,
                  legendItemId: calendar.legendItems[0]?.id || "",
                  preserveSpecialEvents: true,
                })
              }
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer border border-indigo-500/40"
              title="Asignar una UD o Periodo Dual a un rango continuo de fechas con prevalencia de festivos"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Asignar Periodo</span>
            </button>

            {/* Preview Official A4 */}
            <button
              type="button"
              onClick={() => setIsPreviewA4Open(true)}
              className="px-2.5 py-1.5 bg-alt hover:bg-hover text-text-primary font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-border-default"
              title="Previsualizar en pantalla la hoja oficial A4 con la cuadrícula de 2 columnas x 5 filas"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Vista Previa A4</span>
            </button>

            {/* Print Official A4 */}
            <button
              type="button"
              onClick={handlePrintOfficialA4}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              title="Imprimir Calendario Escolar Oficial A4 con formato de la Junta de Andalucía"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Oficial A4</span>
            </button>
          </div>
        </div>

        {/* TEACHER'S MULTI-MODULE / MULTI-CALENDAR PORTFOLIO SECTION */}
        <div className="bg-alt p-3 rounded-xl border border-border-default space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-text-primary text-xs">
                Cartera de Módulos y Asignaturas del Docente ({calendarsList.length})
              </span>
              <span className="text-[10px] text-text-muted">
                Selecciona la asignatura para planificar su temporalización y UDs independientemente:
              </span>
            </div>

            {/* Portfolio Actions: Add, Duplicate, Edit, Change Year, Sync, Export/Import */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Change Academic Year button */}
              <button
                type="button"
                onClick={() => {
                  setTargetAcademicYear(calendar.academicYear || "2026-2027");
                  setCustomAcademicYearInput(calendar.academicYear || "2026-2027");
                  setIsChangeYearModalOpen(true);
                }}
                className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer border border-emerald-500/40 shadow-xs"
                title="Cambiar el curso escolar de este calendario (adaptar fechas, cargar marco oficial o crear copia)"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
                <span>Cambiar Curso Escolar</span>
              </button>

              {/* Add New Module / Calendar */}
              <button
                type="button"
                onClick={() =>
                  setAddCourseModal({
                    academicYear: calendar.academicYear || "2026-2027",
                    province: calendar.province || "Málaga",
                    moduloNombre: "",
                    moduloCodigo: "",
                    cicloFormativo: calendar.cicloFormativo || cicloFormativo,
                    docente: calendar.docente || docenteNombre,
                    baseTemplate: "2026_2027",
                    includeSampleUds: true,
                  })
                }
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                title="Añadir nuevo módulo formativo o asignatura a tu cartera docente"
              >
                <Plus className="w-3 h-3" />
                <span>Nueva Asignatura</span>
              </button>

              {/* Duplicate Current Module */}
              <button
                type="button"
                onClick={() =>
                  setDuplicateModuleModal({
                    moduloFormativo: `${calendar.moduloFormativo || "Módulo"} (Grupo B)`,
                    codigoModulo: `${calendar.codigoModulo || "MOD"}_B`,
                    cicloFormativo: calendar.cicloFormativo || cicloFormativo,
                    keepUds: false,
                  })
                }
                className="px-2 py-1 bg-surface hover:bg-hover text-text-primary font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer border border-border-default"
                title="Duplicar este calendario manteniendo todo el marco escolar oficial para otro grupo o módulo"
              >
                <Copy className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span className="hidden md:inline">Duplicar</span>
              </button>

              {/* Edit Active Module Info */}
              <button
                type="button"
                onClick={() =>
                  setEditingModuleModal({
                    moduloFormativo: calendar.moduloFormativo || moduloNombre,
                    codigoModulo: calendar.codigoModulo || moduloCodigo,
                    cicloFormativo: calendar.cicloFormativo || cicloFormativo,
                    docente: calendar.docente || docenteNombre,
                    academicYear: calendar.academicYear || "2026-2027",
                    province: calendar.province || "Málaga",
                    educationalStage: calendar.educationalStage || "Formación Profesional / Secundaria",
                    notes: calendar.notes || "",
                  })
                }
                className="px-2 py-1 bg-surface hover:bg-hover text-text-primary font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer border border-border-default"
                title="Editar datos de la asignatura actual (nombre, código, ciclo, docente)"
              >
                <Edit2 className="w-3 h-3 text-amber-500" />
                <span className="hidden md:inline">Editar Datos</span>
              </button>

              {/* Sync with Active SIGRE */}
              <button
                type="button"
                onClick={handleSyncWithActiveSigre}
                className="px-2 py-1 bg-surface hover:bg-hover text-text-primary font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer border border-border-default"
                title="Sincronizar con el módulo activo de SIGRE"
              >
                <RefreshCw className="w-3 h-3 text-emerald-500" />
                <span className="hidden lg:inline">Sincronizar SIGRE</span>
              </button>

              {/* Export Full Portfolio */}
              <button
                type="button"
                onClick={handleExportPortfolio}
                className="p-1 bg-surface hover:bg-hover text-text-secondary rounded-lg transition-colors border border-border-default cursor-pointer"
                title="Exportar cartera completa de asignaturas (JSON)"
              >
                <Download className="w-3 h-3" />
              </button>

              {/* Import Full Portfolio */}
              <input
                type="file"
                ref={portfolioFileInputRef}
                onChange={handleImportPortfolio}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => portfolioFileInputRef.current?.click()}
                className="p-1 bg-surface hover:bg-hover text-text-secondary rounded-lg transition-colors border border-border-default cursor-pointer"
                title="Importar cartera o calendario (JSON)"
              >
                <Upload className="w-3 h-3" />
              </button>

              {/* Delete Active Module */}
              {calendarsList.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentCourse}
                  className="p-1 bg-red-500/20 hover:bg-red-500 text-red-700 dark:text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title={`Eliminar módulo "${calendar.codigoModulo || calendar.moduloFormativo}"`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Academic Year Filter Bar for Multi-Module Portfolio */}
          {(() => {
            const availableYears = Array.from(new Set(calendarsList.map((c) => c.academicYear).filter(Boolean)));
            if (availableYears.length <= 1) return null;
            return (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border-subtle text-[10px]">
                <span className="text-text-muted font-bold flex items-center gap-1">
                  <Filter className="w-3 h-3 text-emerald-500" />
                  Filtrar por Curso:
                </span>
                <button
                  type="button"
                  onClick={() => setPortfolioYearFilter("all")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    portfolioYearFilter === "all"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-surface hover:bg-hover text-text-secondary border border-border-default"
                  }`}
                >
                  Todos ({calendarsList.length})
                </button>
                {availableYears.map((yr) => {
                  const countInYear = calendarsList.filter((c) => c.academicYear === yr).length;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setPortfolioYearFilter(yr)}
                      className={`px-2 py-0.5 rounded-md font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        portfolioYearFilter === yr
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-surface hover:bg-hover text-text-secondary border border-border-default"
                      }`}
                    >
                      <span>{yr}</span>
                      <span className="text-[9px] opacity-75">({countInYear})</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Guidance Banner for Double Click & Context Menu */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-alt/80 border border-border-subtle rounded-lg text-[10.5px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-500 font-bold">💡 Consejo:</span>
              <span>Doble clic en un módulo o clic derecho (menú contextual) para abrir su Currículo y UDs en el Diseñador Curricular.</span>
            </span>
            <span className="hidden sm:inline text-[9.5px] text-text-muted font-mono">
              [Doble Clic = Abrir UDs] • [Clic Derecho = Opciones]
            </span>
          </div>

          {/* Scrollable list of Subject Module Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
            {calendarsList
              .filter((c) => portfolioYearFilter === "all" || c.academicYear === portfolioYearFilter)
              .map((calItem) => {
                const isActive = calItem.id === activeCalendarId;
                const udsCount = calItem.legendItems.filter((leg) => leg.type === "ud_ra").length;
                return (
                  <div
                    key={calItem.id}
                    onClick={() => setActiveCalendarId(calItem.id)}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      handleOpenCurricularDesigner(calItem, "unidades");
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModuleContextMenu({
                        isOpen: true,
                        x: Math.min(e.clientX, window.innerWidth - 300),
                        y: Math.min(e.clientY, window.innerHeight - 390),
                        calendar: calItem,
                      });
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between select-none ${
                      isActive
                        ? "bg-surface border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                        : "bg-surface/80 border-border-default hover:border-emerald-500/60 hover:bg-hover hover:shadow-xs"
                    }`}
                    title="Doble clic para abrir en el Diseñador Curricular de UDs | Clic derecho para menú contextual"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`font-black text-[11px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                            isActive
                              ? "bg-emerald-500 text-slate-950 font-bold shadow-xs"
                              : "bg-alt text-text-secondary group-hover:bg-emerald-500/20 group-hover:text-emerald-300"
                          }`}
                        >
                          {calItem.codigoModulo || "MÓDULO"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCalendarId(calItem.id);
                              setTargetAcademicYear(calItem.academicYear || "2026-2027");
                              setCustomAcademicYearInput(calItem.academicYear || "2026-2027");
                              setIsChangeYearModalOpen(true);
                            }}
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-alt text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                            title="Haz clic para cambiar el curso escolar de este módulo"
                          >
                            🎓 {calItem.academicYear}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setModuleContextMenu({
                                isOpen: true,
                                x: Math.min(rect.left, window.innerWidth - 300),
                                y: Math.min(rect.bottom + 5, window.innerHeight - 390),
                                calendar: calItem,
                              });
                            }}
                            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-hover transition-colors"
                            title="Menú de opciones del módulo"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-text-primary text-[11px] line-clamp-1 leading-snug">
                        {calItem.moduloFormativo || "Planificación del Módulo"}
                      </h4>
                      <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
                        {calItem.cicloFormativo || "Formación Profesional"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-1.5 border-t border-border-subtle text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {udsCount} UDs
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCurricularDesigner(calItem, "unidades");
                          }}
                          className="px-2 py-0.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-800 dark:text-emerald-300 hover:text-white font-bold border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title={`Abrir currículo y UDs de ${calItem.codigoModulo || "este módulo"} en el Diseñador Curricular`}
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>Currículo</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCalendarId(calItem.id);
                            setCalendarViewMode("cronograma_modulo");
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500 text-amber-800 dark:text-amber-300 hover:text-black font-bold border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          title={`Ver cronograma del módulo ${calItem.codigoModulo}`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>Cronograma</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Resolution Bar with Editable URL & Links - Fixed 2-Row Consistent Layout */}
        <div className="flex flex-col justify-between gap-1.5 text-[11px] bg-alt p-2.5 rounded-xl border border-border-default h-[76px] overflow-hidden">
          {/* Row 1: Marco Normativo Oficial + Link + Edit Button + Add UD Button */}
          <div className="flex items-center justify-between gap-2.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
              <span className="font-bold text-text-primary flex items-center gap-1 shrink-0">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Marco Normativo Oficial:
              </span>
              <span
                className="text-text-muted italic truncate shrink min-w-0"
                title={calendar.resolutionRef || "Resolución Oficial de Calendario Escolar"}
              >
                {calendar.resolutionRef || "Resolución Oficial de Calendario Escolar"}
              </span>

              {/* Link to Resolution on Junta de Andalucia Portal */}
              {calendar.resolutionUrl && (
                <a
                  href={calendar.resolutionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold transition-colors shrink-0"
                  title={`Abrir enlace oficial: ${calendar.resolutionUrl}`}
                >
                  <span className="hidden md:inline">Ver resolución en Junta de Andalucía</span>
                  <span className="md:hidden">Ver resolución</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Button to edit resolution & link */}
              <button
                type="button"
                onClick={() =>
                  setEditingResolutionModal({
                    resolutionRef: calendar.resolutionRef || "",
                    resolutionUrl: calendar.resolutionUrl || "",
                    province: calendar.province || "Málaga",
                    educationalStage: calendar.educationalStage || "Formación Profesional / Secundaria",
                    notes: calendar.notes || "",
                  })
                }
                className="px-2 py-0.5 bg-surface hover:bg-hover text-text-secondary hover:text-text-primary rounded text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-border-default shrink-0"
                title="Modificar texto de resolución, enlace web y provincia"
              >
                <Edit2 className="w-2.5 h-2.5" />
                <span>Editar Enlace / Resolución</span>
              </button>
            </div>

            {/* Button to add a new UD / Legend Item (Pinned cleanly on the right) */}
            <button
              type="button"
              onClick={() => {
                const nextNum = calendar.legendItems.filter((l) => l.type === "ud_ra").length + 1;
                const { code: nextCode, title: nextTitle } = buildUdLegendTitleAndCode({
                  udNumber: nextNum,
                  title: `Nueva Unidad Didáctica ${nextNum}`,
                });
                const nextColor = getDistinctUdColor(nextNum - 1);
                setEditingLegendModal({
                  item: {
                    code: nextCode,
                    title: nextTitle,
                    type: "ud_ra",
                    color: nextColor.bg,
                    textColor: nextColor.text,
                    monthTarget: 9,
                    sidePosition: "right",
                  },
                  isNew: true,
                });
              }}
              className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-emerald-500/50 shadow-xs shrink-0 whitespace-nowrap"
              title="Añadir una nueva Unidad Didáctica a la planificación de este módulo"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>+ Añadir UD</span>
            </button>
          </div>

          {/* Row 2: Quick Context Menu Tip & Calendar Indicators */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
              <Info className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Haz <strong>clic derecho</strong> en cualquier día para abrir el menú contextual rápido.</span>
            </div>
            <div className="text-[10px] text-text-muted hidden sm:flex items-center gap-2 shrink-0">
              <span>{calendar.legendItems.filter((l) => l.type === "ud_ra").length} UDs planificadas</span>
              <span>•</span>
              <span>{calendar.totalLectivosEstimated || 158} días lectivos</span>
            </div>
          </div>
        </div>

        {/* Multi-Selection / Format Painter Active Notice Banner */}
        {selectedDates.size > 0 && (
          <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white">
                {selectedDates.size} día{selectedDates.size > 1 ? "s" : ""} seleccionado{selectedDates.size > 1 ? "s" : ""} en el calendario
              </span>
              <span className="text-slate-300 text-[11px]">
                (Arrastra con el ratón o usa Ctrl+Clic para seleccionar múltiples días)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {copiedFormat && (
                <button
                  type="button"
                  onClick={applyCopiedFormatToSelectedDates}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Aplicar formato "{copiedFormat.label}" a la selección</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedDates(new Set())}
                className="px-2.5 py-1 bg-surface hover:bg-hover text-text-primary rounded-lg text-xs transition-colors cursor-pointer border border-border-default"
              >
                Limpiar Selección (Esc)
              </button>
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          <div className="bg-alt p-2 rounded-xl border border-border-default flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              {stats.totalSchoolDays}
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">Días Lectivos FP</div>
              <div className="text-[11px] font-bold text-text-primary">Mínimo 175 días</div>
            </div>
          </div>

          <div className="bg-alt p-2 rounded-xl border border-border-default flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              {stats.totalHolidays}
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">Festivos</div>
              <div className="text-[11px] font-bold text-text-primary">Nac. / Aut. / Locales</div>
            </div>
          </div>

          <div className="bg-alt p-2 rounded-xl border border-border-default flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              {stats.totalVacationDays}
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">Vacaciones</div>
              <div className="text-[11px] font-bold text-text-primary">Navidad, S. Santa, S. Blanca</div>
            </div>
          </div>

          <div className="bg-alt p-2 rounded-xl border border-border-default flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              {stats.totalEvalDays}
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">Evaluaciones</div>
              <div className="text-[11px] font-bold text-text-primary">1T, 2T, 1ª Final, 2ª Final</div>
            </div>
          </div>

          <div className="bg-alt p-2 rounded-xl border border-border-default flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 flex items-center justify-center font-bold">
              {stats.totalDualDays}
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">FP Dual (FFEoE)</div>
              <div className="text-[11px] font-bold text-text-primary">120h Empresa</div>
            </div>
          </div>

          <div className="bg-alt p-2 rounded-xl border border-border-default flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              {calendar.legendItems.filter((l) => l.type === "ud_ra").length}
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold">UDs / RAs</div>
              <div className="text-[11px] font-bold text-text-primary">Temporalizadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg font-bold flex items-center gap-2 animate-fade-in text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{notification}</span>
        </div>
      )}

      {/* ACTIVE FORMAT PAINTER TOP BANNER */}
      {isFormatPainterActive && (
        <div className="p-3 bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-surface border border-amber-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 sticky top-2 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
              <Paintbrush className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-600 dark:text-amber-300 text-xs">
                  {isFormatPainterLocked ? "📌 COPIAR FORMATO ANCLADO (MODO CONTINUO)" : "🖌️ COPIAR FORMATO (1 CELDA)"}
                </span>
                {copiedFormat ? (
                  <span
                    className="px-2 py-0.5 rounded font-black text-[10px] shadow-sm border border-black/20"
                    style={{
                      backgroundColor: copiedFormat.customColor || "#fed7aa",
                      color: copiedFormat.customTextColor || "#9a3412",
                    }}
                  >
                    {copiedFormat.label}
                  </span>
                ) : (
                  <span className="text-[11px] text-text-secondary italic">Haz clic en una celda origen para copiar</span>
                )}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {isFormatPainterLocked
                  ? "Modo anclado activo: Haz clic en todas las celdas que desees para pintarlas. Pulsa Esc o haz clic de nuevo para desanclar."
                  : "Haz clic en la celda destino para pegar el formato (se desactivará tras 1 celda). Haz doble clic en el botón para anclar a varias."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsFormatPainterActive(false);
                setIsFormatPainterLocked(false);
                showToast("Modo Copiar Formato desactivado (Esc)");
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors border border-red-400/40 cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
              title="Salir del modo copiar formato (tecla Escape)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Desactivar (Esc)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Interactive Multi-Level Cronogramas vs Monthly Calendar Matrix */}
      {calendarViewMode !== "calendario" ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Cronograma Context Notification Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface border border-amber-500/40 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-text-primary text-xs sm:text-sm">
                    {calendarViewMode === "cronograma_modulo"
                      ? `Cronograma Temporal del Módulo: [${calendar.codigoModulo || "MOD"}] ${calendar.moduloFormativo || "Módulo"}`
                      : `Cartera de Cronogramas Multimódulo (${calendarsList.length} Módulos Docentes)`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                    Nivel de Módulo / Asignatura
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Planificación jerárquica con escala temporal interactiva, arrastre visual de hitos/periodos y sincronización automática.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCalendarViewMode("calendario")}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-xs shrink-0"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Volver a Matriz Mensual</span>
            </button>
          </div>

          <SigreMultiLevelTimeline
            modulesList={calendarsList}
            activeModuleId={activeCalendarId}
            onSelectModule={(modId) => setActiveCalendarId(modId)}
            initialLevel="modulo"
            onClose={() => setCalendarViewMode("calendario")}
          />
        </div>
      ) : (
        <>
          {/* ACADEMIC TRIMESTERS & JUNE ASSESSMENT STRUCTURE ACCORDION */}
          <div className="bg-surface border border-border-default rounded-2xl overflow-hidden shadow-sm transition-all">
        <div
          onClick={() => setIsTrimestersExpanded(!isTrimestersExpanded)}
          className="p-3.5 bg-alt hover:bg-hover cursor-pointer flex flex-wrap items-center justify-between gap-3 border-b border-border-default select-none transition-colors"
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-text-primary text-xs sm:text-sm">
                  Estructura Trimestral, Sesiones de Evaluación y Periodo de Recuperación (Junio)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Régimen Oficial FP Andalucía
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Organización de 3 trimestres, sesiones de evaluación ordinarias/extraordinarias y reserva pedagógica de Junio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-muted font-medium hidden sm:inline">
              {isTrimestersExpanded ? "Ocultar detalle" : "Ver detalle de fechas"}
            </span>
            <button
              type="button"
              className="p-1 rounded-lg bg-surface text-text-secondary hover:text-text-primary border border-border-default transition-colors"
            >
              {isTrimestersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isTrimestersExpanded && (
          <div className="p-4 bg-alt/50 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs animate-in fade-in duration-200">
            {trimestersStructure.map((trim) => (
              <div
                key={trim.id}
                className="bg-surface border border-border-default rounded-xl p-3.5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border-default">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">{trim.name}</span>
                    <span className="text-[10px] font-mono text-text-muted bg-alt px-1.5 py-0.5 rounded border border-border-subtle">
                      {trim.periodText}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 text-[11px]">
                    <div className="flex items-start gap-2 bg-alt p-2 rounded-lg border border-border-subtle">
                      <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-text-muted text-[10px] uppercase font-bold">Sesión de Evaluación:</div>
                        <div className="font-semibold text-sky-600 dark:text-sky-300">
                          {trim.evalSessionDate.split("-").reverse().join("/")} &bull; {trim.evalSessionLabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-alt p-2 rounded-lg border border-border-subtle">
                      <FileText className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-text-muted text-[10px] uppercase font-bold">Entrega de Calificaciones:</div>
                        <div className="font-semibold text-cyan-600 dark:text-cyan-300">
                          {trim.reportCardDeliveryDate.split("-").reverse().join("/")} &bull; {trim.reportCardDeliveryLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {trim.juneStructure && (
                  <div className="pt-2 border-t border-border-subtle space-y-1.5 text-[10px]">
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-amber-900 dark:text-amber-200">
                      <div className="font-black text-amber-700 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                        <RefreshCw className="w-3 h-3 text-amber-500" />
                        <span>Semanas 1-3 de Junio (01 al 19 Jun):</span>
                      </div>
                      <p className="text-[10px] text-amber-800 dark:text-amber-100/90 leading-tight">
                        Periodo de recuperación de aprendizajes no adquiridos y refuerzo curricular para el alumnado.
                      </p>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/30 p-2 rounded-lg text-purple-900 dark:text-purple-200 space-y-1">
                      <div className="font-black text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                        <span>4ª Semana de Junio (20 al 24 Jun y cierre):</span>
                      </div>
                      <div className="text-[10px] text-purple-800 dark:text-purple-100/90 leading-tight">
                        &bull; <strong>22 Jun:</strong> 2ª Evaluación Final Extraordinaria<br />
                        &bull; <strong>24 Jun:</strong> Fin de Clases y Calificaciones Finales<br />
                        &bull; <strong>25-30 Jun:</strong> Planificación curso siguiente y memorias
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Months Grid (Full Width 2-Column Responsive Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicMonths.map(({ year, month, monthName }, mIdx) => {
              const monthData = generateMonthGrid(year, month, calendar);
              const { leftLegends, rightLegends } = deriveMonthLateralLegends(year, month, calendar);
              const trimesterInfo = getMonthTrimesterInfo(year, month, calendar);

              return (
                <div
                  key={`${year}-${month}`}
                  className="bg-surface border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:border-border-strong"
                  style={{ borderColor: trimesterInfo.headerBorderColor }}
                >
                  {/* Month Header (Color-coded by Trimester with dynamic indicators & Toolbar, max 2 rows, buttons always right-justified) */}
                  <div
                    className={`${trimesterInfo.headerBgClass} text-white px-3 py-1.5 sm:px-3.5 sm:py-2 border-b shadow-xs transition-colors`}
                    style={{
                      backgroundColor: trimesterInfo.headerStyleBg,
                      borderColor: trimesterInfo.headerBorderColor,
                    }}
                  >
                    {/* Row 1: Month Title & Main Trimester Badge + Action Buttons Toolbar Justified Right */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      {/* Left: Month Name and Primary Trimester Badge */}
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
                        <span className="tracking-wide uppercase font-black drop-shadow-sm text-xs sm:text-sm whitespace-nowrap shrink-0">
                          {monthName}
                        </span>

                        {/* Trimester Badge */}
                        <span
                          className="px-2 py-0.5 rounded-md font-extrabold text-[10px] sm:text-[10.5px] shadow-sm uppercase tracking-wide border flex items-center gap-1 shrink min-w-0 truncate"
                          style={{
                            backgroundColor: trimesterInfo.badgeStyleBg,
                            color: trimesterInfo.badgeStyleText,
                            borderColor: "rgba(255, 255, 255, 0.4)",
                          }}
                          title={trimesterInfo.sharedExplanation || trimesterInfo.name}
                        >
                          <span className="truncate">{trimesterInfo.isShared ? `🔄 ${trimesterInfo.name}` : trimesterInfo.name}</span>
                        </span>
                      </div>

                      {/* Right: Monthly Window Action Buttons - ALWAYS Right-Justified */}
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        {/* Deshacer (Undo Local para este Mes) */}
                        <button
                          type="button"
                          onClick={() => handleUndoForMonth(year, month, monthName)}
                          disabled={history.length === 0}
                          className={`p-1 sm:p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            history.length > 0
                              ? "bg-black/30 hover:bg-black/50 text-amber-300 hover:text-white border border-amber-400/50 shadow-xs hover:scale-105 active:scale-95"
                              : "bg-black/20 text-white/40 cursor-not-allowed border border-white/20"
                          }`}
                          title={`Deshacer último cambio local en ${monthName}`}
                          aria-label={`Deshacer último cambio en ${monthName}`}
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Rehacer (Redo Local para este Mes) */}
                        <button
                          type="button"
                          onClick={() => handleRedoForMonth(year, month, monthName)}
                          disabled={future.length === 0}
                          className={`p-1 sm:p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            future.length > 0
                              ? "bg-black/30 hover:bg-black/50 text-cyan-300 hover:text-white border border-cyan-400/50 shadow-xs hover:scale-105 active:scale-95"
                              : "bg-black/20 text-white/40 cursor-not-allowed border border-white/20"
                          }`}
                          title={`Rehacer cambio local en ${monthName}`}
                          aria-label={`Rehacer cambio en ${monthName}`}
                        >
                          <Redo2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Copiar Formato (Format Painter - Global entre todas las ventanas/meses) */}
                        <button
                          type="button"
                          onClick={handleFormatPainterClick}
                          onDoubleClick={handleFormatPainterDoubleClick}
                          className={`p-1 sm:p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer relative ${
                            isFormatPainterActive
                              ? isFormatPainterLocked
                                ? "bg-amber-500 text-black border-2 border-amber-300 shadow-md shadow-amber-500/40 ring-2 ring-amber-400/80 animate-pulse scale-105"
                                : "bg-amber-500/90 text-black border border-amber-300 shadow-xs ring-1 ring-amber-400 scale-105"
                              : "bg-black/30 hover:bg-black/50 text-amber-300 hover:text-amber-200 border border-amber-500/40 shadow-xs hover:scale-105 active:scale-95"
                          }`}
                          title={
                            isFormatPainterActive
                              ? isFormatPainterLocked
                                ? "📌 Copiar formato ANCLADO continuo (Doble clic - Actúa entre todos los meses). Clic para desactivar o pulsa Esc."
                                : "🖌️ Copiar formato activo (1 celda - Actúa entre todos los meses). Clic para desactivar o pulsa Esc."
                              : "Copiar Formato (Inter-mensual / Entre ventanas): 1 clic para 1 celda, doble clic para anclar a varias (MS Excel). Pulsa Esc para salir."
                          }
                          aria-label="Copiar formato entre todas las ventanas"
                        >
                          <Paintbrush className={`w-3.5 h-3.5 ${isFormatPainterActive ? "text-black" : "text-amber-300"}`} />
                          {isFormatPainterActive && isFormatPainterLocked && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />
                          )}
                        </button>

                        {/* Cargar Preestablecidos por la Administración (Local para este Mes) */}
                        <button
                          type="button"
                          onClick={() => handleLoadAdminPresetsForMonth(year, month, monthName)}
                          className="p-1 sm:p-1.5 bg-black/30 hover:bg-black/50 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer border border-emerald-400/50 shadow-xs hover:scale-105 active:scale-95"
                          title={`Cargar hitos y festivos oficiales preestablecidos por la Administración para ${monthName}`}
                          aria-label="Cargar preestablecidos de la Administración"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                        </button>

                        {/* Borrar formatos y leyendas del mes (Local para este Mes) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Deseas borrar todos los formatos, colores y leyendas del mes de ${monthName}?`)) {
                              handleClearMonth(year, month, monthName);
                            }
                          }}
                          className="p-1 sm:p-1.5 bg-black/30 hover:bg-black/50 text-red-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer border border-red-500/40 shadow-xs hover:scale-105 active:scale-95"
                          title={`Borrar todos los formatos, colores y leyendas del mes de ${monthName}`}
                          aria-label="Borrar mes"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Secondary Indicators (Laborable Days, Shared Month Badge, Transition notes) */}
                    <div className="flex items-center justify-between gap-1.5 mt-1 pt-1 border-t border-white/15 text-[10px] sm:text-[10.5px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Explicit Shared Month Indicator */}
                        {trimesterInfo.isShared && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[9.5px] flex items-center gap-1 shadow-xs border border-amber-300 animate-pulse"
                            title={trimesterInfo.sharedExplanation}
                          >
                            <span>Mes Compartido</span>
                          </span>
                        )}

                        {/* Laborable Days Badge */}
                        <span className="font-semibold text-white/95 font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/20 text-[9.5px] sm:text-[10px]">
                          {monthData.days.filter((d) => d.isCurrentMonth && !d.isWeekend).length} días laborables
                        </span>
                      </div>

                      {/* Right Subtitle / Trimester Context */}
                      <span className="text-[9px] sm:text-[9.5px] text-white/80 font-semibold truncate hidden xs:inline">
                        {trimesterInfo.isShared ? "Transición trimestral" : "Periodo lectivo ordinario"}
                      </span>
                    </div>
                  </div>

                  {/* Month Content Window with Fixed 3-Area Layout: Left Labels, Central Calendar, Right Labels */}
                  <div className="flex flex-col sm:flex-row flex-1 p-2 sm:p-2.5 gap-2 items-stretch justify-between bg-surface overflow-hidden">
                    {/* 1. Left Fixed Area for Labels (Hitos / Inicios de Curso / Evaluaciones Iniciales) */}
                    <div className="w-full sm:w-[130px] md:w-[140px] lg:w-[148px] shrink-0 flex flex-col justify-center order-1">
                      {leftLegends.length > 0 ? (
                        <div className="w-full flex flex-col gap-1 p-1.5 rounded-none border border-border-default bg-alt/50 max-h-[175px] overflow-y-auto custom-scrollbar">
                          {leftLegends.map((leg) => {
                            const isHighlight =
                              highlightedLegendId === leg.id ||
                              (leg.dateStr && highlightedLegendId === `day_${leg.dateStr}`) ||
                              (leg.id.startsWith("auto_ud_") && highlightedLegendId === leg.id);
                            const chipText = formatOfficialLegendChip(leg);

                            return (
                              <div
                                key={leg.id}
                                onClick={(e) => handleLegendClickOrContextMenu(e, leg, year, month, monthName)}
                                onContextMenu={(e) => handleLegendClickOrContextMenu(e, leg, year, month, monthName)}
                                className={`flex items-start gap-1.5 p-1 rounded-none border transition-all cursor-pointer ${
                                  isHighlight
                                    ? "ring-1.5 ring-emerald-500 bg-surface border-emerald-500 shadow-sm"
                                    : "bg-surface border-border-default hover:border-border-strong hover:bg-hover"
                                }`}
                                title={`Haz clic o clic derecho para abrir menú contextual y configurar: ${leg.title}`}
                              >
                                <span
                                  className="px-1.5 py-0.5 rounded-none text-[8.5px] font-black shrink-0 text-center shadow-xs border border-black/40"
                                  style={{
                                    backgroundColor: leg.color,
                                    color: leg.textColor || "#000000",
                                    minWidth: "18px",
                                  }}
                                >
                                  {chipText}
                                </span>
                                <span className="text-[9.5px] text-text-primary font-medium leading-[1.2] line-clamp-2">
                                  {leg.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="hidden sm:block w-full h-[10px] pointer-events-none opacity-0" />
                      )}
                    </div>

                    {/* 2. Central Fixed Area for Month Calendar Days Table */}
                    <div className="flex-1 flex flex-col justify-center min-w-0 w-full px-1 order-2">
                      <table className="w-full border-collapse text-center text-xs font-mono">
                        <thead>
                          <tr className="border-b border-border-default text-[10.5px] font-bold text-text-muted">
                            <th className="py-1 px-0.5">L</th>
                            <th className="py-1 px-0.5">M</th>
                            <th className="py-1 px-0.5">X</th>
                            <th className="py-1 px-0.5">J</th>
                            <th className="py-1 px-0.5">V</th>
                            <th className="py-1 px-0.5 text-red-500 font-black">S</th>
                            <th className="py-1 px-0.5 text-red-500 font-black">D</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: Math.ceil(monthData.days.length / 7) }).map((_, rowIdx) => {
                            const rowDays = monthData.days.slice(rowIdx * 7, (rowIdx + 1) * 7);
                            return (
                              <tr key={rowIdx}>
                                {rowDays.map((d, dIdx) => {
                                  const isSelectedHighlight =
                                    highlightedLegendId &&
                                    (d.override?.legendItemId === highlightedLegendId ||
                                      d.legendItem?.id === highlightedLegendId ||
                                      d.assignedUdId === highlightedLegendId ||
                                      d.override?.assignedUdCode === highlightedLegendId ||
                                      d.dateString === highlightedLegendId ||
                                      `day_${d.dateString}` === highlightedLegendId ||
                                      (highlightedLegendId.startsWith("auto_ud_") &&
                                        (d.assignedUdId === highlightedLegendId.replace("auto_ud_", "") ||
                                          d.override?.assignedUdCode === highlightedLegendId.replace("auto_ud_", "") ||
                                          d.override?.legendItemId === highlightedLegendId.replace("auto_ud_", "") ||
                                          (d.override?.title && d.override.title.includes(highlightedLegendId.replace("auto_ud_", ""))))) ||
                                      (highlightedLegendId.startsWith("auto_period_") &&
                                        (d.specialEventType === highlightedLegendId.replace("auto_period_", "") ||
                                          d.override?.type === highlightedLegendId.replace("auto_period_", ""))));

                                  let cellBg = d.isWeekend ? "rgba(125,125,125,0.08)" : "transparent";
                                  let isCustomStyled = false;

                                  if (d.isCurrentMonth) {
                                    if (d.hasSpecialPrevalence) {
                                      cellBg = d.displayBgColor;
                                      isCustomStyled = true;
                                    } else if (!d.isWeekend && d.displayBgColor && d.displayBgColor !== "transparent") {
                                      cellBg = d.displayBgColor;
                                      isCustomStyled = true;
                                    }
                                  }

                                  // Guaranteed high-contrast text color resolution
                                  let cellTextColor = "var(--text-secondary)";
                                  if (!d.isCurrentMonth) {
                                    cellTextColor = "var(--text-muted)";
                                  } else if (isCustomStyled && cellBg && cellBg !== "transparent") {
                                    cellTextColor =
                                      d.displayTextColor && d.displayTextColor !== "#0f172a"
                                        ? d.displayTextColor
                                        : getOptimalTextColorForBg(cellBg);
                                  } else {
                                    cellTextColor = d.isWeekend ? "#ef4444" : "var(--text-primary)";
                                  }

                                  const tooltipText = d.isCurrentMonth
                                    ? d.hasSpecialPrevalence
                                      ? `${d.specialEventLabel || "Evento Especial"}${
                                          d.assignedUdCode ? ` (En periodo de ${d.assignedUdCode})` : ""
                                        }`
                                      : d.override?.title ||
                                        d.legendItem?.title ||
                                        `${d.dateString} (${d.isWeekend ? "Fin de semana" : "Lectivo"})`
                                    : "";

                                  const isCellMultiSelected = selectedDates.has(d.dateString);
                                  const isCopiedSource = isFormatPainterActive && copiedFormat?.sourceDate === d.dateString;

                                  const isDraggable = Boolean(
                                    d.isCurrentMonth &&
                                      (d.override ||
                                        d.assignedUdId ||
                                        d.specialEventType ||
                                        (d.displayBgColor && d.displayBgColor !== "transparent") ||
                                        d.hasSpecialPrevalence)
                                  );

                                  const isDraggedSource = draggedDayData?.sourceDateStr === d.dateString;
                                  const isDragTargetHovered =
                                    dragOverTargetDate === d.dateString && draggedDayData?.sourceDateStr !== d.dateString;

                                  return (
                                    <td
                                      key={dIdx}
                                      draggable={isDraggable}
                                      onDragStart={(e) => handleDayCellDragStart(e, d, monthName)}
                                      onDragOver={(e) => handleDayCellDragOver(e, d)}
                                      onDragEnter={(e) => handleDayCellDragEnter(e, d)}
                                      onDragLeave={(e) => handleDayCellDragLeave(e, d)}
                                      onDragEnd={handleDayCellDragEnd}
                                      onDrop={(e) => handleDayCellDrop(e, d, monthName)}
                                      onMouseDown={(e) =>
                                        handleCellMouseDown(e, d, mIdx, rowIdx, dIdx, monthData.days)
                                      }
                                      onMouseEnter={() =>
                                        handleCellMouseEnter(d, mIdx, rowIdx, dIdx, monthData.days)
                                      }
                                      onClick={() => {
                                        if (justAppliedDragRef.current) return;
                                        if (d.isCurrentMonth) {
                                          if (isFormatPainterActive || copiedFormat) {
                                            if (copiedFormat) {
                                              if (copiedFormat.sourceDate === d.dateString) {
                                                showToast(`📌 Celda origen ${d.dateString} activa. Haz clic en la/s celda/s destino.`);
                                              } else {
                                                applyCopiedFormatToDate(d.dateString);
                                                // MS Excel behavior: Single-click applies to 1 cell and unpins/exits
                                                // Double-click keeps isFormatPainterLocked true until Esc or re-click
                                                if (!isFormatPainterLockedRef.current) {
                                                  setIsFormatPainterActive(false);
                                                  setIsFormatPainterLocked(false);
                                                }
                                              }
                                            } else {
                                              handleCopyFormatFromDate(d.dateString, d);
                                            }
                                          } else if (!hasDraggedRef.current) {
                                            setSelectedSingleDay({ dateStr: d.dateString, dayData: d });
                                            setEditingDayModal({
                                              dateStr: d.dateString,
                                              dayNumber: d.dayNumber,
                                              monthName,
                                              override: d.override || {
                                                type: d.isWeekend ? "no_lectivo" : "lectivo",
                                              },
                                            });
                                          }
                                        }
                                      }}
                                      onContextMenu={(e) => handleDayContextMenu(e, d, monthName)}
                                      className={`p-0 h-6 sm:h-7 border border-border-default transition-all relative select-none ${
                                        d.isCurrentMonth
                                          ? isFormatPainterActive
                                            ? "cursor-crosshair hover:ring-2 hover:ring-amber-400 hover:scale-105 z-10"
                                            : isDraggable
                                            ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-cyan-400"
                                            : "cursor-pointer hover:ring-2 hover:ring-cyan-400"
                                          : "cursor-default opacity-25"
                                      } ${isCellMultiSelected ? "ring-2 ring-emerald-400 bg-emerald-500/20 z-10" : ""} ${
                                        isSelectedHighlight ? "ring-2 ring-amber-400 font-black scale-105 z-10" : ""
                                      } ${
                                        isCopiedSource
                                          ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-surface border-2 border-dashed border-amber-400 animate-pulse shadow-lg shadow-amber-500/50 z-30 font-black scale-105 bg-amber-500/30"
                                          : ""
                                      } ${
                                        isDraggedSource
                                          ? "opacity-40 ring-2 ring-amber-400 border-2 border-dashed border-amber-500 scale-95 animate-pulse z-20"
                                          : ""
                                      } ${
                                        isDragTargetHovered
                                          ? "ring-3 ring-emerald-400 bg-emerald-500/40 scale-110 shadow-lg z-30 font-black"
                                          : ""
                                      }`}
                                    >
                                      <div
                                        className="w-full h-full flex flex-col items-center justify-center rounded-none text-[10.5px] font-bold relative transition-colors"
                                        style={{
                                          backgroundColor: isCustomStyled
                                            ? cellBg
                                            : d.isWeekend && d.isCurrentMonth
                                            ? "rgba(125, 125, 125, 0.08)"
                                            : "transparent",
                                          color: cellTextColor,
                                        }}
                                        title={
                                          isCopiedSource
                                            ? `📌 Celda de origen copiada (${d.dateString}). Haz clic en las celdas destino para pintar su formato.`
                                            : isDraggable
                                            ? `${tooltipText} · 🖐️ Arrastra a otro día para mover este formato/sesión`
                                            : tooltipText
                                        }
                                      >
                                        <span>{String(d.dayNumber).padStart(2, "0")}</span>

                                        {/* Drag Target Hover Highlight Indicator */}
                                        {isDragTargetHovered && (
                                          <span className="absolute inset-0 border-2 border-emerald-400 pointer-events-none rounded-none animate-pulse bg-emerald-400/25 z-20" />
                                        )}

                                        {/* Copied Source Indicator Badge */}
                                        {isCopiedSource && (
                                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-sm z-30 animate-ping" />
                                        )}

                                        {/* Bottom Accent Bar if day has overlapping UD assignment and special event prevalence */}
                                        {d.isCurrentMonth && d.hasSpecialPrevalence && d.assignedUdColor && (
                                          <div
                                            className="absolute bottom-0 left-0 right-0 h-1 rounded-none shadow-sm"
                                            style={{ backgroundColor: d.assignedUdColor }}
                                            title={`UD asignada: ${d.assignedUdCode || ""}`}
                                          />
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 3. Right Fixed Area for Labels (UDs / RAs / Periodos Dual y Recuperación) */}
                    <div className="w-full sm:w-[130px] md:w-[140px] lg:w-[148px] shrink-0 flex flex-col justify-center order-3">
                      {rightLegends.length > 0 ? (
                        <div className="w-full flex flex-col gap-1 p-1.5 rounded-none border border-border-default bg-alt/50 max-h-[175px] overflow-y-auto custom-scrollbar">
                          {rightLegends.map((leg) => {
                            const isHighlight =
                              highlightedLegendId === leg.id ||
                              (leg.id.startsWith("auto_ud_") && highlightedLegendId === leg.id);
                            const chipText = formatOfficialLegendChip(leg);

                            return (
                              <div
                                key={leg.id}
                                onClick={(e) => handleLegendClickOrContextMenu(e, leg, year, month, monthName)}
                                onContextMenu={(e) => handleLegendClickOrContextMenu(e, leg, year, month, monthName)}
                                className={`flex items-start gap-1.5 p-1 rounded-none border transition-all cursor-pointer ${
                                  isHighlight
                                    ? "ring-1.5 ring-emerald-500 bg-surface border-emerald-500 shadow-md"
                                    : "bg-surface border-border-default hover:border-border-strong hover:bg-hover"
                                }`}
                                title={`Haz clic o clic derecho para abrir menú contextual y configurar: ${leg.title}`}
                              >
                                <span
                                  className="px-1.5 py-0.5 rounded-none text-[8.5px] font-black shrink-0 text-center shadow-xs border border-black/40"
                                  style={{
                                    backgroundColor: leg.color,
                                    color: leg.textColor || "#000000",
                                    minWidth: "18px",
                                  }}
                                >
                                  {chipText}
                                </span>
                                <span className="text-[9.5px] text-text-primary font-medium leading-[1.2] line-clamp-2">
                                  {leg.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="hidden sm:block w-full h-[10px] pointer-events-none opacity-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* COMPACT FLOATING CONTEXT MENU & QUICK FORMATTER */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-80 max-w-[94vw] max-h-[calc(100vh-24px)] overflow-y-auto custom-scrollbar bg-surface border border-border-default rounded-2xl shadow-2xl p-2.5 text-xs animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl ring-1 ring-black/5 select-none"
        >
          {/* Header */}
          <div className="px-1.5 pb-2 border-b border-border-default flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-black flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                {String(contextMenu.dayNumber).padStart(2, "0")}
              </span>
              <div className="leading-tight">
                <div className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                  <span>{contextMenu.dayNumber} {contextMenu.monthName}</span>
                  <span className="text-[10px] text-text-muted font-mono">({contextMenu.dateStr})</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[180px]">
                  {contextMenu.dayInfo?.override?.title ||
                    (contextMenu.dayInfo?.hasSpecialPrevalence && contextMenu.dayInfo?.specialEventLabel) ||
                    (contextMenu.dayInfo?.assignedUdCode ? `UD: ${contextMenu.dayInfo.assignedUdCode}` : "Día Lectivo Ordinario")}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setContextMenu(null)}
              className="p-1 hover:bg-hover text-text-muted hover:text-text-primary rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Instant 1-Click Quick Color Palette */}
          <div className="py-1.5 border-b border-border-default">
            <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider px-1 mb-1">
              <span>⚡ Formato Rápido en 1 Clic:</span>
            </div>
            <div className="grid grid-cols-7 gap-1 px-0.5">
              <button
                type="button"
                title="Festivo Nacional (Rojo)"
                onClick={() =>
                  handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                    type: "festivo_nacional",
                    title: "Festivo Nacional",
                  })
                }
                className="h-6 rounded-lg bg-[#ef4444] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-black text-white shadow-sm cursor-pointer"
              >
                F
              </button>
              <button
                type="button"
                title="Festivo Autonómico / Andalucía (Verde)"
                onClick={() =>
                  handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                    type: "festivo_autonomico",
                    title: "Festivo Autonómico (Día de Andalucía)",
                  })
                }
                className="h-6 rounded-lg bg-[#16a34a] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-black text-white shadow-sm cursor-pointer"
              >
                A
              </button>
              <button
                type="button"
                title="Sesión de Evaluación (Azul)"
                onClick={() =>
                  handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                    type: "evaluacion_trimestral",
                    title: "Sesión de Evaluación",
                  })
                }
                className="h-6 rounded-lg bg-[#0284c7] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-black text-white shadow-sm cursor-pointer"
              >
                EV
              </button>
              <button
                type="button"
                title="FP Dual / Empresa (Amarillo)"
                onClick={() =>
                  handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                    type: "periodo_dual_empresa",
                    title: "Formación en Empresa / FP Dual (120h)",
                  })
                }
                className="h-6 rounded-lg bg-[#fef08a] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-black text-amber-900 shadow-sm cursor-pointer"
              >
                DU
              </button>
              <button
                type="button"
                title="Periodo de Recuperación (Naranja)"
                onClick={() =>
                  handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                    type: "periodo_recuperacion",
                    title: "Periodo de Recuperación de Aprendizajes",
                  })
                }
                className="h-6 rounded-lg bg-[#fed7aa] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-black text-orange-950 shadow-sm cursor-pointer"
              >
                REC
              </button>
              <button
                type="button"
                title="Inicio / Fin de Curso (Púrpura)"
                onClick={() =>
                  handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                    type: "inicio_fin_curso",
                    title: "Hito Inicio / Fin de Régimen de Clases",
                  })
                }
                className="h-6 rounded-lg bg-[#d946ef] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-black text-white shadow-sm cursor-pointer"
              >
                IN
              </button>
              <button
                type="button"
                title="Restablecer a Lectivo Ordinario"
                onClick={() => handleContextMenuQuickAction(contextMenu.dateStr, "clear")}
                className="h-6 rounded-lg bg-alt hover:bg-hover hover:scale-110 active:scale-95 transition-transform flex items-center justify-center text-[10px] font-bold text-text-secondary shadow-sm cursor-pointer border border-border-default"
              >
                <RotateCcw className="w-3 h-3 text-text-muted" />
              </button>
            </div>
          </div>

          {/* Segmented Category Tabs */}
          <div className="flex bg-alt p-1 rounded-xl gap-1 my-1.5 border border-border-default">
            <button
              type="button"
              onClick={() => setContextMenuTab("uds")}
              className={`flex-1 py-1 px-1 rounded-lg text-[10.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                contextMenuTab === "uds"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-hover"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>UDs</span>
            </button>
            <button
              type="button"
              onClick={() => setContextMenuTab("evals")}
              className={`flex-1 py-1 px-1 rounded-lg text-[10.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                contextMenuTab === "evals"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-hover"
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>Eval.</span>
            </button>
            <button
              type="button"
              onClick={() => setContextMenuTab("festivos")}
              className={`flex-1 py-1 px-1 rounded-lg text-[10.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                contextMenuTab === "festivos"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-hover"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>Festivos</span>
            </button>
            <button
              type="button"
              onClick={() => setContextMenuTab("especiales")}
              className={`flex-1 py-1 px-1 rounded-lg text-[10.5px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                contextMenuTab === "especiales"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-hover"
              }`}
            >
              <Briefcase className="w-3 h-3" />
              <span>Dual/Otros</span>
            </button>
          </div>

          {/* Tab Content Panels (Compact, No Scroll needed) */}
          <div className="min-h-[110px] py-1">
            {/* TAB 1: UDS / RAS */}
            {contextMenuTab === "uds" && (
              <div className="space-y-1.5">
                {/* Header Action: Add UD button integrated into context menu */}
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-semibold">Unidades Didácticas:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const cMonth = parseInt(contextMenu.dateStr.split("-")[1], 10);
                      const nextNum = calendar.legendItems.filter((l) => l.type === "ud_ra").length + 1;
                      const { code: nextCode, title: nextTitle } = buildUdLegendTitleAndCode({
                        udNumber: nextNum,
                        title: `Nueva Unidad Didáctica ${nextNum}`,
                      });
                      const nextColor = getDistinctUdColor(nextNum - 1);
                      setEditingLegendModal({
                        item: {
                          code: nextCode,
                          title: nextTitle,
                          type: "ud_ra",
                          color: nextColor.bg,
                          textColor: nextColor.text,
                          monthTarget: cMonth || 9,
                          sidePosition: "right",
                        },
                        isNew: true,
                      });
                      setContextMenu(null);
                    }}
                    className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors border border-cyan-500/30 cursor-pointer"
                    title="Crear y añadir nueva Unidad Didáctica a la planificación"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Añadir UD</span>
                  </button>
                </div>

                {/* List of UDs with integrated action buttons */}
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5 custom-scrollbar">
                  {calendar.legendItems
                    .filter((l) => l.type === "ud_ra")
                    .map((leg, legIdx) => {
                      const cleanDisplayTitle =
                        leg.title.replace(/^\[UD\d+\]\s*\[(?:BC|RA|UT)\w+\]\s*\[\d+\/\d+h\]\s*\[\d+\s*sesion(?:es)?\]\s*/i, "") ||
                        leg.title;
                      return (
                      <div
                        key={`${leg.id}_${legIdx}`}
                        className="group flex items-center justify-between gap-1 p-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        {/* Assign UD to current day */}
                        <button
                          type="button"
                          onClick={() =>
                            handleContextMenuQuickAction(contextMenu.dateStr, "assign_legend", leg)
                          }
                          className="flex-1 flex items-center gap-1.5 text-left min-w-0 cursor-pointer"
                          title={`Asignar ${leg.code}: ${leg.title} a ${contextMenu.dateStr}`}
                        >
                          <span
                            className="px-1.5 py-0.5 rounded-none text-[9px] font-black shrink-0 border border-black/30 shadow-sm"
                            style={{ backgroundColor: leg.color, color: leg.textColor || "#000" }}
                          >
                            {leg.code}
                          </span>
                          <span className="text-[10px] font-bold text-white truncate max-w-[125px]" title={leg.title}>
                            {cleanDisplayTitle}
                          </span>
                        </button>

                        {/* Integrated UD Action Buttons - Compact & Functional */}
                        <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                          {/* Format Painter with this UD */}
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyFormatFromLegendItem(leg);
                              setContextMenu(null);
                            }}
                            className="p-1 rounded-md bg-slate-800 hover:bg-amber-500 hover:text-black text-amber-300 transition-colors cursor-pointer"
                            title={`Copiar formato de ${leg.code} (Pincel)`}
                          >
                            <Paintbrush className="w-3 h-3" />
                          </button>

                          {/* Edit UD */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLegendModal({
                                item: leg,
                                isNew: false,
                              });
                              setContextMenu(null);
                            }}
                            className="p-1 rounded-md bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-300 transition-colors cursor-pointer"
                            title={`Editar datos de ${leg.code}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Delete UD */}
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteLegendItem(leg.id);
                            }}
                            className="p-1 rounded-md bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title={`Eliminar ${leg.code}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Range assignment from date */}
                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "open_range")
                  }
                  className="w-full text-center py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg flex items-center justify-center gap-1.5 text-[10.5px] font-bold transition-colors cursor-pointer border border-indigo-500/30"
                >
                  <CalendarRange className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Asignar Rango de Días desde esta fecha...</span>
                </button>
              </div>
            )}

            {/* TAB 2: EVALUACIONES */}
            {contextMenuTab === "evals" && (
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "evaluacion_inicial",
                      title: "Evaluación Inicial / Claustro",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#86efac] shrink-0" />
                  <span className="truncate">Eval. Inicial</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "evaluacion_trimestral",
                      title: "Sesión de Evaluación 1º Trimestre",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                  <span className="truncate">Eval. 1º Trim.</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "evaluacion_trimestral",
                      title: "Sesión de Evaluación 2º Trimestre",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                  <span className="truncate">Eval. 2º Trim.</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "evaluacion_final",
                      title: "Sesión de Evaluación 1ª Final Ordinaria",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0369a1] shrink-0" />
                  <span className="truncate">1ª Final Ordinaria</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "evaluacion_extraordinaria",
                      title: "Sesión Evaluación 2ª Final Extraordinaria",
                    })
                  }
                  className="col-span-2 text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e40af] shrink-0" />
                  <span className="truncate">2ª Final Extraordinaria</span>
                </button>
              </div>
            )}

            {/* TAB 3: FESTIVOS & VACACIONES */}
            {contextMenuTab === "festivos" && (
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "festivo_nacional",
                      title: "Festivo Nacional",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
                  <span className="truncate">Festivo Nacional</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "festivo_autonomico",
                      title: "Festivo Autonómico (Día de Andalucía)",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shrink-0" />
                  <span className="truncate">Día Andalucía</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "festivo_local",
                      title: "Fiesta Local",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] shrink-0" />
                  <span className="truncate">Fiesta Local</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "dia_comunidad_educativa",
                      title: "Día de la Comunidad Educativa",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                  <span className="truncate">Comunidad Ed.</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "vacaciones_navidad",
                      title: "Vacaciones de Navidad",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shrink-0" />
                  <span className="truncate">Navidad</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "vacaciones_semana_santa",
                      title: "Vacaciones de Semana Santa",
                    })
                  }
                  className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shrink-0" />
                  <span className="truncate">Semana Santa</span>
                </button>
              </div>
            )}

            {/* TAB 4: FP DUAL & ESPECIALES */}
            {contextMenuTab === "especiales" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "periodo_dual_empresa",
                      title: "Formación en Empresa / FP Dual (120h)",
                    })
                  }
                  className="w-full text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fef08a] shrink-0" />
                  <span className="truncate">Formación Empresa / FP Dual (120h)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                      type: "periodo_recuperacion",
                      title: "Periodo de Recuperación de Aprendizajes",
                    })
                  }
                  className="w-full text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-2 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fed7aa] shrink-0" />
                  <span className="truncate">Periodo de Recuperación</span>
                </button>

                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                        type: "inicio_fin_curso",
                        title: "Inicio de Régimen de Clases",
                      })
                    }
                    className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d946ef] shrink-0" />
                    <span className="truncate">Inicio Clases</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleContextMenuQuickAction(contextMenu.dateStr, "assign_special_type", {
                        type: "inicio_fin_curso",
                        title: "Fin de Régimen de Clases",
                      })
                    }
                    className="text-left px-2 py-1.5 bg-slate-900/90 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 text-[10.5px] text-slate-200 cursor-pointer border border-slate-800"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d946ef] shrink-0" />
                    <span className="truncate">Fin de Clases</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Format Painter Toolstrip (Clean & Direct) */}
          <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                handleCopyFormatFromDate(contextMenu.dateStr, contextMenu.dayInfo);
                setIsFormatPainterLocked(false);
              }}
              onDoubleClick={() => {
                handleCopyFormatFromDate(contextMenu.dateStr, contextMenu.dayInfo);
                setIsFormatPainterLocked(true);
                showToast("🖌️📌 Formato copiado y ANCLADO (Doble clic). Pulsa Esc para salir.");
              }}
              className="flex-1 py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg flex items-center justify-center gap-1.5 text-[10.5px] font-bold transition-colors cursor-pointer border border-amber-500/30"
              title="Copiar formato: 1 clic para 1 celda, doble clic para anclar a varias (MS Excel)"
            >
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>Copiar Formato</span>
            </button>

            {copiedFormat && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    applyCopiedFormatToDate(contextMenu.dateStr);
                    setContextMenu(null);
                  }}
                  className="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg flex items-center justify-center gap-1.5 text-[10.5px] font-bold transition-colors cursor-pointer border border-emerald-500/30 truncate"
                  title={`Pegar formato copiado (${copiedFormat.label})`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: copiedFormat.customColor || "#10b981" }}
                  />
                  <span>Pegar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    applyFormatToWeek(contextMenu.dateStr);
                    setContextMenu(null);
                  }}
                  className="py-1.5 px-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 rounded-lg flex items-center justify-center gap-1.5 text-[10.5px] font-bold transition-colors cursor-pointer border border-sky-500/30"
                  title="Pegar en toda la semana lectiva (Lunes a Viernes)"
                >
                  <CalendarRange className="w-3.5 h-3.5 text-sky-400" />
                  <span>Semana (L-V)</span>
                </button>
              </>
            )}
          </div>

          {/* Bottom Actions: Advanced config & Clear Day */}
          <div className="pt-1.5 border-t border-slate-800/60 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleContextMenuQuickAction(contextMenu.dateStr, "open_edit_modal")
              }
              className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer text-center"
            >
              Configuración Avanzada...
            </button>
            <button
              type="button"
              onClick={() =>
                handleContextMenuQuickAction(contextMenu.dateStr, "clear")
              }
              className="py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer text-center border border-red-500/20 flex items-center justify-center gap-1"
              title="Restablecer día a lectivo ordinario"
            >
              <RotateCcw className="w-3 h-3 text-red-400" />
              <span>Restablecer Día</span>
            </button>
          </div>
        </div>
      )}
      </>
      )}

      {/* FLOATING CONTEXT MENU FOR CARTERA DE MÓDULOS */}
      {moduleContextMenu && moduleContextMenu.isOpen && (
        <div
          className="fixed z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 w-76 text-xs space-y-1.5 backdrop-blur-md animate-fade-in select-none"
          style={{
            left: `${moduleContextMenu.x}px`,
            top: `${moduleContextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with module code, year, title */}
          <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-emerald-400 text-xs px-1.5 py-0.5 bg-emerald-500/20 rounded border border-emerald-500/30">
                  {moduleContextMenu.calendar.codigoModulo || "MÓDULO"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {moduleContextMenu.calendar.academicYear || "2026-2027"}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-200 truncate mt-0.5" title={moduleContextMenu.calendar.moduloFormativo}>
                {moduleContextMenu.calendar.moduloFormativo || "Módulo Formativo"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModuleContextMenu(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Action: Open in Curricular Designer */}
          <button
            type="button"
            onClick={() => {
              handleOpenCurricularDesigner(moduleContextMenu.calendar, "unidades");
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 flex items-center gap-2.5 font-bold transition-all cursor-pointer shadow-xs group"
          >
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black text-amber-300">Abrir en Diseñador Curricular (UDs)</div>
              <div className="text-[9.5px] text-amber-400/80 font-normal">Cargar UDs, Exámenes GIFT y micro-apps HDI</div>
            </div>
          </button>

          {/* Secondary Action: Curricular Parameters & RAG */}
          <button
            type="button"
            onClick={() => {
              handleOpenCurricularDesigner(moduleContextMenu.calendar, "parametros");
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-[11px]">Parámetros Curriculares & RAG</span>
            </div>
          </button>

          {/* Third Action: Timeline */}
          <button
            type="button"
            onClick={() => {
              setActiveCalendarId(moduleContextMenu.calendar.id);
              setCalendarViewMode("cronograma_modulo");
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-[11px]">Cronograma y Temporalización Anual</span>
            </div>
          </button>

          {/* Fourth Action: Official Calendar Matrix */}
          <button
            type="button"
            onClick={() => {
              setActiveCalendarId(moduleContextMenu.calendar.id);
              setCalendarViewMode("calendario");
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-[11px]">Ver en Calendario Escolar Oficial</span>
            </div>
          </button>

          <div className="border-t border-slate-800 my-1"></div>

          {/* Action: Change Academic Year */}
          <button
            type="button"
            onClick={() => {
              setActiveCalendarId(moduleContextMenu.calendar.id);
              setTargetAcademicYear(moduleContextMenu.calendar.academicYear || "2026-2027");
              setCustomAcademicYearInput(moduleContextMenu.calendar.academicYear || "2026-2027");
              setIsChangeYearModalOpen(true);
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px]">Cambiar Curso Escolar ({moduleContextMenu.calendar.academicYear})</span>
          </button>

          {/* Action: Edit Module details */}
          <button
            type="button"
            onClick={() => {
              setEditingModuleModal({
                moduloFormativo: moduleContextMenu.calendar.moduloFormativo || "",
                codigoModulo: moduleContextMenu.calendar.codigoModulo || "",
                cicloFormativo: moduleContextMenu.calendar.cicloFormativo || "",
                docente: moduleContextMenu.calendar.docente || "",
                academicYear: moduleContextMenu.calendar.academicYear || "2026-2027",
                province: moduleContextMenu.calendar.province || "Málaga",
                educationalStage: moduleContextMenu.calendar.educationalStage || "FP Grado Medio",
                notes: moduleContextMenu.calendar.notes || "",
              });
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px]">Editar Datos del Módulo</span>
          </button>

          {/* Action: Duplicate Module */}
          <button
            type="button"
            onClick={() => {
              setDuplicateModuleModal({
                moduloFormativo: `${moduleContextMenu.calendar.moduloFormativo} (Copia)`,
                codigoModulo: `${moduleContextMenu.calendar.codigoModulo || "MOD"}_COPIA`,
                cicloFormativo: moduleContextMenu.calendar.cicloFormativo || "",
                keepUds: true,
              });
              setModuleContextMenu(null);
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px]">Duplicar Módulo y Currículo</span>
          </button>

          {/* Action: Delete Module */}
          {calendarsList.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const calToDelete = moduleContextMenu.calendar;
                setModuleContextMenu(null);
                if (window.confirm(`¿Estás seguro de que deseas eliminar el módulo "${calToDelete.moduloFormativo}" (${calToDelete.codigoModulo}) de tu cartera?`)) {
                  handleDeleteSpecificCalendar(calToDelete.id);
                }
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-950/50 text-red-400 hover:text-red-300 flex items-center gap-2 transition-colors cursor-pointer border border-transparent hover:border-red-500/30"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-[11px]">Eliminar Módulo de la Cartera</span>
            </button>
          )}
        </div>
      )}

      {/* MODAL 1: ADD NEW ACADEMIC COURSE / MODULE */}
      {addCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Añadir Nueva Asignatura / Módulo Formativo</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddCourseModal(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Código de la Asignatura / Módulo:
                  </label>
                  <input
                    type="text"
                    value={addCourseModal.moduloCodigo}
                    onChange={(e) =>
                      setAddCourseModal({ ...addCourseModal, moduloCodigo: e.target.value })
                    }
                    placeholder="ej. IST 0038, FOL, etc."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Curso Escolar:
                  </label>
                  <input
                    type="text"
                    value={addCourseModal.academicYear}
                    onChange={(e) =>
                      setAddCourseModal({ ...addCourseModal, academicYear: e.target.value })
                    }
                    placeholder="ej. 2026-2027"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {["2025-2026", "2026-2027", "2027-2028"].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() =>
                          setAddCourseModal({
                            ...addCourseModal,
                            academicYear: yr,
                            baseTemplate: yr === "2025-2026" ? "2025_2026" : "2026_2027",
                          })
                        }
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                          addCourseModal.academicYear === yr
                            ? "bg-emerald-600 text-white font-bold"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nombre Completo del Módulo / Materia:
                </label>
                <input
                  type="text"
                  value={addCourseModal.moduloNombre}
                  onChange={(e) =>
                    setAddCourseModal({ ...addCourseModal, moduloNombre: e.target.value })
                  }
                  placeholder="ej. Instalaciones solares térmicas"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Ciclo Formativo / Nivel:
                  </label>
                  <input
                    type="text"
                    value={addCourseModal.cicloFormativo}
                    onChange={(e) =>
                      setAddCourseModal({ ...addCourseModal, cicloFormativo: e.target.value })
                    }
                    placeholder="ej. 1º CFGM Frío y Clima"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Provincia / Delegación:
                  </label>
                  <input
                    type="text"
                    value={addCourseModal.province}
                    onChange={(e) =>
                      setAddCourseModal({ ...addCourseModal, province: e.target.value })
                    }
                    placeholder="ej. Málaga, Sevilla, etc."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Plantilla Base Oficial a Aplicar:
                </label>
                <select
                  value={addCourseModal.baseTemplate}
                  onChange={(e) =>
                    setAddCourseModal({
                      ...addCourseModal,
                      baseTemplate: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="2026_2027">
                    Plantilla Oficial Andalucía 2026-2027 (Resolución 20 de mayo 2026)
                  </option>
                  <option value="2025_2026">
                    Plantilla Andalucía 2025-2026 (Resolución 2025/2026)
                  </option>
                  <option value="blank">
                    Plantilla Genérica en Blanco (Con festivos nacionales)
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeSampleUdsCheckbox"
                  checked={addCourseModal.includeSampleUds}
                  onChange={(e) =>
                    setAddCourseModal({
                      ...addCourseModal,
                      includeSampleUds: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="includeSampleUdsCheckbox" className="text-[11px] text-slate-300 cursor-pointer">
                  Incluir 8 Unidades Didácticas (RAs) de ejemplo preconfiguradas
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAddCourseModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNewCourse}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Asignatura en Cartera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1B: EDIT ACTIVE MODULE INFORMATION */}
      {editingModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Editar Datos de la Asignatura / Módulo</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingModuleModal(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Código del Módulo:
                  </label>
                  <input
                    type="text"
                    value={editingModuleModal.codigoModulo}
                    onChange={(e) =>
                      setEditingModuleModal({ ...editingModuleModal, codigoModulo: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Curso Escolar:
                  </label>
                  <input
                    type="text"
                    value={editingModuleModal.academicYear}
                    onChange={(e) =>
                      setEditingModuleModal({ ...editingModuleModal, academicYear: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {["2024-2025", "2025-2026", "2026-2027", "2027-2028"].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() =>
                          setEditingModuleModal({ ...editingModuleModal, academicYear: yr })
                        }
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                          editingModuleModal.academicYear === yr
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nombre del Módulo Formativo / Asignatura:
                </label>
                <input
                  type="text"
                  value={editingModuleModal.moduloFormativo}
                  onChange={(e) =>
                    setEditingModuleModal({ ...editingModuleModal, moduloFormativo: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Ciclo Formativo / Grupo:
                  </label>
                  <input
                    type="text"
                    value={editingModuleModal.cicloFormativo}
                    onChange={(e) =>
                      setEditingModuleModal({ ...editingModuleModal, cicloFormativo: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Docente / Profesorado:
                  </label>
                  <input
                    type="text"
                    value={editingModuleModal.docente}
                    onChange={(e) =>
                      setEditingModuleModal({ ...editingModuleModal, docente: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Provincia:
                  </label>
                  <input
                    type="text"
                    value={editingModuleModal.province}
                    onChange={(e) =>
                      setEditingModuleModal({ ...editingModuleModal, province: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Etapa Educativa:
                  </label>
                  <input
                    type="text"
                    value={editingModuleModal.educationalStage}
                    onChange={(e) =>
                      setEditingModuleModal({ ...editingModuleModal, educationalStage: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const currYear = editingModuleModal.academicYear;
                  setEditingModuleModal(null);
                  setTargetAcademicYear(currYear || "2026-2027");
                  setCustomAcademicYearInput(currYear || "2026-2027");
                  setIsChangeYearModalOpen(true);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Asistente de Cambio de Curso...</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModuleModal(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModuleDetails}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED MODAL: CAMBIAR CURSO ESCOLAR / ASISTENTE DE TEMPORALIZACIÓN */}
      {isChangeYearModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Cambiar Curso Escolar</h3>
                  <p className="text-[11px] text-slate-400">
                    Módulo actual: <span className="text-emerald-400 font-bold font-mono">{calendar.codigoModulo || "MÓDULO"}</span> · Curso activo: <span className="text-white font-mono font-bold">{calendar.academicYear}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeYearModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Target Academic Year Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  Selecciona el Curso Escolar de Destino:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[
                    { year: "2025-2026", badge: "Oficial Junta" },
                    { year: "2026-2027", badge: "Oficial Activo" },
                    { year: "2024-2025", badge: "Histórico" },
                    { year: "2027-2028", badge: "Próximo" },
                  ].map((item) => (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => {
                        setTargetAcademicYear(item.year);
                        setCustomAcademicYearInput(item.year);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        targetAcademicYear === item.year
                          ? "bg-emerald-600/30 border-emerald-500 text-white ring-2 ring-emerald-500/40 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="font-mono font-bold text-xs">{item.year}</span>
                      <span className="text-[9.5px] text-emerald-400 mt-1 font-semibold">{item.badge}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Academic Year Input */}
                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 shrink-0">O introduce otro año:</span>
                  <input
                    type="text"
                    placeholder="ej. 2028-2029"
                    value={targetAcademicYear === "custom" ? customAcademicYearInput : customAcademicYearInput || targetAcademicYear}
                    onChange={(e) => {
                      setTargetAcademicYear("custom");
                      setCustomAcademicYearInput(e.target.value);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Behavior Mode Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  ¿Cómo deseas aplicar el nuevo curso escolar?
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      changeYearMode === "shift_dates"
                        ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="changeYearMode"
                      checked={changeYearMode === "shift_dates"}
                      onChange={() => setChangeYearMode("shift_dates")}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <span className="font-bold block text-[11px] text-emerald-300">
                        🔄 Adaptar y Reubicar Fechas al Nuevo Curso (Recomendado)
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">
                        Desplaza automáticamente todas las UDs programadas, festivos autonómicos y sesiones de evaluación al año de destino, ajustando las cuadrículas mensuales y estadísticas oficiales.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      changeYearMode === "load_official_preset"
                        ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="changeYearMode"
                      checked={changeYearMode === "load_official_preset"}
                      onChange={() => setChangeYearMode("load_official_preset")}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <span className="font-bold block text-[11px] text-indigo-300">
                        ⭐ Cargar Marco Oficial de Andalucía para el Curso
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">
                        Carga el calendario oficial con todas las festividades de la Junta de Andalucía, vacaciones escolares y periodos de evaluación para ese curso, conservando tus datos de módulo.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      changeYearMode === "update_label_only"
                        ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="changeYearMode"
                      checked={changeYearMode === "update_label_only"}
                      onChange={() => setChangeYearMode("update_label_only")}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <span className="font-bold block text-[11px] text-slate-300">
                        🏷️ Solo Actualizar Rótulo y Periodo
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-relaxed">
                        Cambia la etiqueta del curso escolar sin modificar la estructura de días personalizados ni mover fechas existentes.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Create as New Module Checkbox */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={changeYearCreateCopy}
                    onChange={(e) => setChangeYearCreateCopy(e.target.checked)}
                    className="rounded accent-emerald-500 w-4 h-4"
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    Crear como nueva asignatura en mi cartera (conservar el curso actual {calendar.academicYear} intacto)
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setIsChangeYearModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyChangeAcademicYear}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Curso Escolar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1C: DUPLICATE MODULE MODAL */}
      {duplicateModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Duplicar Calendario para otro Módulo / Grupo</h3>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateModuleModal(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-[11px]">
              Se duplicará todo el calendario oficial ({calendar.academicYear}, festivos autonómicos y locales, vacaciones de Navidad, Semana Santa y Semana Blanca, periodos de evaluación).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Código del Nuevo Módulo:
                </label>
                <input
                  type="text"
                  value={duplicateModuleModal.codigoModulo}
                  onChange={(e) =>
                    setDuplicateModuleModal({ ...duplicateModuleModal, codigoModulo: e.target.value })
                  }
                  placeholder="ej. TEMINS_B, DIG 1664"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nombre de la Nueva Asignatura / Módulo:
                </label>
                <input
                  type="text"
                  value={duplicateModuleModal.moduloFormativo}
                  onChange={(e) =>
                    setDuplicateModuleModal({ ...duplicateModuleModal, moduloFormativo: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ciclo Formativo / Grupo Destino:
                </label>
                <input
                  type="text"
                  value={duplicateModuleModal.cicloFormativo}
                  onChange={(e) =>
                    setDuplicateModuleModal({ ...duplicateModuleModal, cicloFormativo: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="keepUdsCheckbox"
                  checked={duplicateModuleModal.keepUds}
                  onChange={(e) =>
                    setDuplicateModuleModal({
                      ...duplicateModuleModal,
                      keepUds: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="keepUdsCheckbox" className="text-[11px] text-slate-300 cursor-pointer">
                  Copiar también la distribución de UDs actual (desmarcar para empezar con días lectivos libres)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDuplicateModuleModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCloneCurrentCalendar}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar Calendario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT RESOLUTION & LINK */}
      {editingResolutionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Editar Resolución Oficial y Enlace de Junta de Andalucía
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingResolutionModal(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Texto de la Resolución Oficial:
                </label>
                <textarea
                  rows={2}
                  value={editingResolutionModal.resolutionRef}
                  onChange={(e) =>
                    setEditingResolutionModal({
                      ...editingResolutionModal,
                      resolutionRef: e.target.value,
                    })
                  }
                  placeholder="ej. Resolución de 20 de mayo de 2026 de la Delegación Territorial de Desarrollo Educativo y Formación Profesional en Málaga"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Enlace URL Web ("Ver resolución en Junta de Andalucía"):
                </label>
                <input
                  type="url"
                  value={editingResolutionModal.resolutionUrl}
                  onChange={(e) =>
                    setEditingResolutionModal({
                      ...editingResolutionModal,
                      resolutionUrl: e.target.value,
                    })
                  }
                  placeholder="https://www.juntadeandalucia.es/educacion/portales/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Provincia / Delegación:
                  </label>
                  <input
                    type="text"
                    value={editingResolutionModal.province}
                    onChange={(e) =>
                      setEditingResolutionModal({
                        ...editingResolutionModal,
                        province: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Etapa Educativa:
                  </label>
                  <input
                    type="text"
                    value={editingResolutionModal.educationalStage}
                    onChange={(e) =>
                      setEditingResolutionModal({
                        ...editingResolutionModal,
                        educationalStage: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Observaciones / Notas Legales:
                </label>
                <textarea
                  rows={2}
                  value={editingResolutionModal.notes}
                  onChange={(e) =>
                    setEditingResolutionModal({
                      ...editingResolutionModal,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Observaciones de fiestas locales, días no lectivos de convenio provincial..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingResolutionModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveResolution}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ASSIGN DATE RANGE TO UD WITH PREVALENCE TOGGLE */}
      {rangeAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">
                  Asignar Periodo de Días a una Unidad Didáctica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRangeAssignModal(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Unidad Didáctica / Evento a Asignar:
                </label>
                <select
                  value={rangeAssignModal.legendItemId}
                  onChange={(e) =>
                    setRangeAssignModal({ ...rangeAssignModal, legendItemId: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {calendar.legendItems.map((leg) => (
                    <option key={leg.id} value={leg.id}>
                      {leg.code} — {leg.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Fecha Inicial:
                  </label>
                  <input
                    type="date"
                    value={rangeAssignModal.startDate}
                    onChange={(e) =>
                      setRangeAssignModal({ ...rangeAssignModal, startDate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Fecha Final:
                  </label>
                  <input
                    type="date"
                    value={rangeAssignModal.endDate}
                    onChange={(e) =>
                      setRangeAssignModal({ ...rangeAssignModal, endDate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Prevalence toggle */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="prevalenceToggle"
                  checked={rangeAssignModal.preserveSpecialEvents}
                  onChange={(e) =>
                    setRangeAssignModal({
                      ...rangeAssignModal,
                      preserveSpecialEvents: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="prevalenceToggle" className="cursor-pointer">
                  <div className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prevalencia visual de eventos especiales</span>
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                    Los días festivos, vacaciones escolares y sesiones de evaluación que caigan dentro del rango conservarán su color y visibilidad oficial prioritaria.
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRangeAssignModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyRangeAssignment}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Periodo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADVANCED DAY EDIT (With Visual Color Swatches & Live Preview) */}
      {editingDayModal && (() => {
        const currentType = editingDayModal.override.type || "lectivo";
        const selectedLegend = calendar.legendItems.find((l) => l.id === editingDayModal.override.legendItemId);
        
        // Compute effective preview colors
        let previewBg = "#0f172a";
        let previewText = "#ffffff";
        
        if (editingDayModal.override.customColor) {
          previewBg = editingDayModal.override.customColor;
          previewText = editingDayModal.override.customTextColor || getOptimalTextColorForBg(previewBg);
        } else if (selectedLegend) {
          previewBg = selectedLegend.color;
          previewText = selectedLegend.textColor || getOptimalTextColorForBg(previewBg);
        } else {
          const matchedOfficial = OFFICIAL_EVENT_COLOR_PALETTE.find((o) => {
            if (currentType === "festivo_nacional" || currentType === "festivo_local") return o.bg === "#ff0000";
            if (currentType === "festivo_autonomico") return o.bg === "#16a34a" || o.name.includes("Andalucía");
            if (currentType === "vacaciones_navidad") return o.bg === "#00ffff";
            if (currentType === "vacaciones_semana_santa") return o.bg === "#ff99ff";
            if (currentType === "semana_blanca") return o.bg === "#80cbc4";
            if (currentType === "dia_comunidad_educativa") return o.bg === "#ffc000";
            if (currentType === "inicio_fin_curso") return o.bg === "#ff00ff";
            if (currentType.startsWith("evaluacion")) return o.bg === "#0080ff" || o.bg === "#99cc33";
            if (currentType === "periodo_dual_empresa") return o.bg === "#fff2b2";
            if (currentType === "periodo_recuperacion") return o.bg === "#f8cb9c";
            if (currentType === "no_lectivo") return o.bg === "#64748b";
            return false;
          });
          if (matchedOfficial) {
            previewBg = matchedOfficial.bg;
            previewText = matchedOfficial.text;
          }
        }

        const DAY_TYPE_OPTIONS: Array<{
          type: SigreCalendarDayType;
          label: string;
          bg: string;
          text: string;
          border?: string;
        }> = [
          { type: "lectivo", label: "Día Lectivo Ordinario", bg: "#1e293b", text: "#ffffff", border: "#334155" },
          { type: "festivo_nacional", label: "Festivo Nacional", bg: "#ff0000", text: "#ffffff", border: "#cc0000" },
          { type: "festivo_autonomico", label: "Día de Andalucía / Autonómico", bg: "#16a34a", text: "#ffffff", border: "#15803d" },
          { type: "festivo_local", label: "Fiesta Local", bg: "#dc2626", text: "#ffffff", border: "#b91c1c" },
          { type: "vacaciones_navidad", label: "Vacaciones de Navidad", bg: "#00ffff", text: "#000000", border: "#00cccc" },
          { type: "vacaciones_semana_santa", label: "Vacaciones Semana Santa", bg: "#ff99ff", text: "#000000", border: "#e680e6" },
          { type: "semana_blanca", label: "Semana Blanca", bg: "#80cbc4", text: "#000000", border: "#4db6ac" },
          { type: "dia_comunidad_educativa", label: "Día Comunidad Educativa", bg: "#ffc000", text: "#000000", border: "#e6ac00" },
          { type: "inicio_fin_curso", label: "Inicio / Fin de Clases", bg: "#ff00ff", text: "#ffffff", border: "#d900d9" },
          { type: "evaluacion_inicial", label: "Evaluación Inicial", bg: "#99cc33", text: "#000000", border: "#7da829" },
          { type: "evaluacion_trimestral", label: "Evaluación 1º / 2º Trimestre", bg: "#0080ff", text: "#ffffff", border: "#0066cc" },
          { type: "evaluacion_final", label: "1ª Evaluación Final Ordinaria", bg: "#2563eb", text: "#ffffff", border: "#1d4ed8" },
          { type: "evaluacion_extraordinaria", label: "2ª Evaluación Extraordinaria", bg: "#4f46e5", text: "#ffffff", border: "#3730a3" },
          { type: "periodo_dual_empresa", label: "FP Dual / FFEoE Empresa", bg: "#fff2b2", text: "#713f12", border: "#fde047" },
          { type: "periodo_recuperacion", label: "Periodo de Recuperación", bg: "#f8cb9c", text: "#7c2d12", border: "#fb923c" },
          { type: "no_lectivo", label: "No Lectivo Genérico", bg: "#64748b", text: "#ffffff", border: "#475569" },
        ];

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs max-h-[92vh] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-md border border-black/30 shrink-0"
                    style={{ backgroundColor: previewBg, color: previewText }}
                  >
                    {editingDayModal.dayNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Configurar Día: {editingDayModal.dayNumber} de {editingDayModal.monthName}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">{editingDayModal.dateStr}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDayModal(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Visual Live Preview Bar */}
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold">Vista previa del día:</span>
                  <span
                    className="px-2.5 py-1 rounded-md font-black text-xs shadow-sm border border-black/30"
                    style={{ backgroundColor: previewBg, color: previewText }}
                  >
                    {editingDayModal.dayNumber}
                  </span>
                  {selectedLegend && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-black border border-black/30"
                      style={{ backgroundColor: selectedLegend.color, color: selectedLegend.textColor || "#000" }}
                    >
                      {selectedLegend.code}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Fondo: {previewBg}
                </span>
              </div>

              {/* Tab Navigation */}
              <div className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setDayModalTab("festivos")}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    dayModalTab === "festivos"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Tipos y Festivos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDayModalTab("uds")}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    dayModalTab === "uds"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Vincular UD/RA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDayModalTab("nueva_ud")}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    dayModalTab === "nueva_ud"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>+ Crear Nueva UD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDayModalTab("nuevo_evento")}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    dayModalTab === "nuevo_evento"
                      ? "bg-fuchsia-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
                  <span>+ Crear Festivo / Evento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDayModalTab("color")}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    dayModalTab === "color"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Formato Libre</span>
                </button>
              </div>

              {/* TAB 1: TIPOS Y FESTIVOS OFICIALES */}
              {dayModalTab === "festivos" && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>🏛️ Seleccionar Jornada o Festivo Oficial:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Muestra visual oficial</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar p-1.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    {DAY_TYPE_OPTIONS.map((opt) => {
                      const isSelected = currentType === opt.type && !editingDayModal.override.customColor;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            setEditingDayModal({
                              ...editingDayModal,
                              override: {
                                ...editingDayModal.override,
                                type: opt.type,
                                customColor: undefined,
                                customTextColor: undefined,
                              },
                            });
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xs"
                              : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-md shrink-0 border border-black/40 shadow-xs"
                            style={{ backgroundColor: opt.bg }}
                          />
                          <span className={`text-[10.5px] truncate font-medium ${isSelected ? "text-white font-bold" : "text-slate-300"}`}>
                            {opt.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: VINCULAR UD / RA EXISTENTE */}
              {dayModalTab === "uds" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-300">
                      📚 Unidades Didácticas (UD / RA) Registradas:
                    </label>
                    <button
                      type="button"
                      onClick={() => setDayModalTab("nueva_ud")}
                      className="text-[10.5px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>¿No encuentras tu UD? Créala aquí</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar p-1.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                    {/* Option for none */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditingDayModal({
                          ...editingDayModal,
                          override: {
                            ...editingDayModal.override,
                            legendItemId: undefined,
                            assignedUdId: undefined,
                            assignedUdCode: undefined,
                          },
                        })
                      }
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        !editingDayModal.override.legendItemId
                          ? "bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/40"
                          : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-md bg-slate-800 border border-slate-600 flex items-center justify-center text-[9px] text-slate-400">∅</span>
                      <span className="text-[10.5px] text-slate-300 font-medium">Ninguna UD específica</span>
                    </button>

                    {calendar.legendItems.map((leg) => {
                      const isSelected = editingDayModal.override.legendItemId === leg.id;
                      return (
                        <button
                          key={leg.id}
                          type="button"
                          onClick={() =>
                            setEditingDayModal({
                              ...editingDayModal,
                              override: {
                                ...editingDayModal.override,
                                legendItemId: leg.id,
                                assignedUdId: leg.id,
                                assignedUdCode: leg.code,
                                customColor: leg.color,
                                customTextColor: leg.textColor,
                              },
                            })
                          }
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/40 shadow-xs"
                              : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                          }`}
                        >
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 border border-black/40 shadow-xs"
                            style={{ backgroundColor: leg.color, color: leg.textColor || "#000" }}
                          >
                            {leg.code}
                          </span>
                          <span className="text-[10.5px] text-slate-200 truncate font-medium flex-1">
                            {leg.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: CREAR NUEVA UD Y VINCULAR */}
              {dayModalTab === "nueva_ud" && (
                <div className="space-y-3 p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-amber-400" />
                      Crear Nueva Unidad Didáctica (UD / RA)
                    </span>
                    <span className="text-[10px] text-slate-400">Se añadirá a la leyenda y a este día</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                        Código de la UD (ej. UD06. RA03):
                      </label>
                      <input
                        type="text"
                        value={inlineNewUd.code}
                        onChange={(e) => setInlineNewUd({ ...inlineNewUd, code: e.target.value })}
                        placeholder="ej. UD05 o TEMINS. RA02"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                        Título descriptivo de la UD:
                      </label>
                      <input
                        type="text"
                        value={inlineNewUd.title}
                        onChange={(e) => setInlineNewUd({ ...inlineNewUd, title: e.target.value })}
                        placeholder="ej. Sistemas de Regulación y Control"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-300 mb-1.5">
                      Color identificativo para la UD:
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {UD_COLOR_PALETTE.map((pal, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setInlineNewUd({ ...inlineNewUd, color: pal.bg })}
                          className={`h-7 rounded-md font-bold text-[10px] border flex items-center justify-center cursor-pointer transition-all ${
                            inlineNewUd.color === pal.bg
                              ? "ring-2 ring-white border-white scale-105"
                              : "border-black/30 opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: pal.bg, color: pal.text }}
                        >
                          UD{pIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateAndAssignInlineUd}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Crear UD y Vincular al Día {editingDayModal.dayNumber}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: CREAR NUEVO FESTIVO / EVENTO PERSONALIZADO */}
              {dayModalTab === "nuevo_evento" && (
                <div className="space-y-3 p-3 bg-slate-950/80 border border-fuchsia-500/30 rounded-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-fuchsia-300 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                      Crear Nuevo Festivo / Jornada Especial Personalizada
                    </span>
                    <span className="text-[10px] text-slate-400">Aparecerá en el día y en la leyenda lateral</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                        Nombre del Evento o Festivo:
                      </label>
                      <input
                        type="text"
                        value={inlineNewEvent.title}
                        onChange={(e) => setInlineNewEvent({ ...inlineNewEvent, title: e.target.value })}
                        placeholder="ej. Patrón del Centro / Jornadas Técnicas"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                        Tipo de Jornada:
                      </label>
                      <select
                        value={inlineNewEvent.type}
                        onChange={(e) => setInlineNewEvent({ ...inlineNewEvent, type: e.target.value as SigreCalendarDayType })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                      >
                        <option value="festivo_local">Fiesta Local / Día del Centro (Festivo)</option>
                        <option value="evaluacion_trimestral">Sesión de Evaluación / Hito</option>
                        <option value="periodo_dual_empresa">Jornada Dual / Empresa</option>
                        <option value="inicio_fin_curso">Actividad Especial / Visita Técnica</option>
                        <option value="no_lectivo">No Lectivo Especial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                        Posición en la Leyenda del Mes:
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setInlineNewEvent({ ...inlineNewEvent, sidePosition: "left" })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            inlineNewEvent.sidePosition === "left"
                              ? "bg-fuchsia-600 text-white border-fuchsia-400 shadow-xs"
                              : "bg-slate-900 text-slate-400 border-slate-700"
                          }`}
                        >
                          👈 Columna Izquierda
                        </button>
                        <button
                          type="button"
                          onClick={() => setInlineNewEvent({ ...inlineNewEvent, sidePosition: "right" })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            inlineNewEvent.sidePosition === "right"
                              ? "bg-fuchsia-600 text-white border-fuchsia-400 shadow-xs"
                              : "bg-slate-900 text-slate-400 border-slate-700"
                          }`}
                        >
                          Columna Derecha 👉
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-300 mb-1">
                        Color identificativo:
                      </label>
                      <div className="grid grid-cols-6 gap-1">
                        {["#ec4899", "#8b5cf6", "#f43f5e", "#06b6d4", "#10b981", "#f59e0b"].map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setInlineNewEvent({ ...inlineNewEvent, color: c })}
                            className={`h-7 rounded-md border cursor-pointer transition-transform ${
                              inlineNewEvent.color === c ? "ring-2 ring-white scale-110" : "border-black/30 opacity-80"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateAndAssignInlineCustomEvent}
                      className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Crear Festivo/Evento y Fijar al Día {editingDayModal.dayNumber}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: FORMATO LIBRE, COLOR Y NOTAS */}
              {dayModalTab === "color" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>🎨 Paleta de Color Directo para el Día:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Color visual libre</span>
                    </label>
                    <div className="grid grid-cols-8 gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                      {UD_DISTINCT_COLOR_PALETTE.slice(0, 16).map((pal, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() =>
                            setEditingDayModal({
                              ...editingDayModal,
                              override: {
                                ...editingDayModal.override,
                                customColor: pal.bg,
                                customTextColor: pal.text,
                              },
                            })
                          }
                          className="h-6 rounded-md flex items-center justify-center text-[9px] font-black border border-black/30 shadow-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                          style={{ backgroundColor: pal.bg, color: pal.text }}
                          title={pal.name}
                        >
                          ●
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Título / Descripción del Día:
                      </label>
                      <input
                        type="text"
                        value={editingDayModal.override.title || ""}
                        onChange={(e) =>
                          setEditingDayModal({
                            ...editingDayModal,
                            override: {
                              ...editingDayModal.override,
                              title: e.target.value,
                            },
                          })
                        }
                        placeholder="ej. Sesión de evaluación 1º trimestre"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Notas pedagógicas:
                      </label>
                      <input
                        type="text"
                        value={editingDayModal.override.notes || ""}
                        onChange={(e) =>
                          setEditingDayModal({
                            ...editingDayModal,
                            override: {
                              ...editingDayModal.override,
                              notes: e.target.value,
                            },
                          })
                        }
                        placeholder="Observaciones pedagógicas..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const newOverrides = { ...calendar.dayOverrides };
                    delete newOverrides[editingDayModal.dateStr];
                    updateCurrentCalendar({
                      ...calendar,
                      dayOverrides: newOverrides,
                    });
                    setEditingDayModal(null);
                    showToast(`Día ${editingDayModal.dateStr} restablecido`);
                  }}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Limpiar Día
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDayModal(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDayOverride}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 5: LEGEND ITEM CREATE / EDIT */}
      {editingLegendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                {editingLegendModal.isNew ? "Añadir Elemento a la Leyenda" : "Editar Elemento de la Leyenda"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingLegendModal(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Código Breve:
                  </label>
                  <input
                    type="text"
                    value={editingLegendModal.item.code || ""}
                    onChange={(e) =>
                      setEditingLegendModal({
                        ...editingLegendModal,
                        item: { ...editingLegendModal.item, code: e.target.value },
                      })
                    }
                    placeholder="UD01. RA08"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tipo de Elemento:
                  </label>
                  <select
                    value={editingLegendModal.item.type || "ud_ra"}
                    onChange={(e) =>
                      setEditingLegendModal({
                        ...editingLegendModal,
                        item: { ...editingLegendModal.item, type: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="ud_ra">Unidad Didáctica / RA</option>
                    <option value="evaluacion">Sesión de Evaluación</option>
                    <option value="dual">Formación en Empresa / FP Dual</option>
                    <option value="recuperacion">Periodo de Recuperación</option>
                    <option value="hito">Hito Oficial / Inicio de Curso</option>
                    <option value="festivo">Festivo / Vacaciones</option>
                    <option value="otro">Otro Evento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Título Completo:
                </label>
                <input
                  type="text"
                  value={editingLegendModal.item.title || ""}
                  onChange={(e) =>
                    setEditingLegendModal({
                      ...editingLegendModal,
                      item: { ...editingLegendModal.item, title: e.target.value },
                    })
                  }
                  placeholder="ej. TEMINS. RA08 (Prevención de Riesgos Laborales)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Quick Distinct UD Color Palette Swatches */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>🎨 Paleta de Colores Distintivos (Equilibrados para Imprimir):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Clic para aplicar fondo y contraste</span>
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 bg-slate-950/80 border border-slate-800 rounded-xl">
                  {UD_DISTINCT_COLOR_PALETTE.map((pal, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() =>
                        setEditingLegendModal({
                          ...editingLegendModal,
                          item: {
                            ...editingLegendModal.item,
                            color: pal.bg,
                            textColor: pal.text,
                          },
                        })
                      }
                      className="group relative h-7 rounded-lg flex items-center justify-center text-[10px] font-black border border-black/30 shadow-xs hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      style={{ backgroundColor: pal.bg, color: pal.text }}
                      title={`Color ${pIdx + 1}: ${pal.bg}`}
                    >
                      <span>UD{pIdx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Color de Fondo:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingLegendModal.item.color || "#fed7aa"}
                      onChange={(e) => {
                        const newBg = e.target.value;
                        const optimalText = getOptimalTextColorForBg(newBg);
                        setEditingLegendModal({
                          ...editingLegendModal,
                          item: {
                            ...editingLegendModal.item,
                            color: newBg,
                            textColor: optimalText,
                          },
                        });
                      }}
                      className="w-10 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editingLegendModal.item.color || "#fed7aa"}
                      onChange={(e) => {
                        const newBg = e.target.value;
                        setEditingLegendModal({
                          ...editingLegendModal,
                          item: {
                            ...editingLegendModal.item,
                            color: newBg,
                            textColor: newBg.startsWith("#") && newBg.length === 7 ? getOptimalTextColorForBg(newBg) : editingLegendModal.item.textColor,
                          },
                        });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Color de Texto:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingLegendModal.item.textColor || "#9a3412"}
                      onChange={(e) =>
                        setEditingLegendModal({
                          ...editingLegendModal,
                          item: { ...editingLegendModal.item, textColor: e.target.value },
                        })
                      }
                      className="w-10 h-8 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={editingLegendModal.item.textColor || "#9a3412"}
                      onChange={(e) =>
                        setEditingLegendModal({
                          ...editingLegendModal,
                          item: { ...editingLegendModal.item, textColor: e.target.value },
                        })
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mes Asignado (1-12):
                  </label>
                  <select
                    value={editingLegendModal.item.monthTarget || 9}
                    onChange={(e) =>
                      setEditingLegendModal({
                        ...editingLegendModal,
                        item: {
                          ...editingLegendModal.item,
                          monthTarget: parseInt(e.target.value, 10),
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value={9}>Septiembre (09)</option>
                    <option value={10}>Octubre (10)</option>
                    <option value={11}>Noviembre (11)</option>
                    <option value={12}>Diciembre (12)</option>
                    <option value={1}>Enero (01)</option>
                    <option value={2}>Febrero (02)</option>
                    <option value={3}>Marzo (03)</option>
                    <option value={4}>Abril (04)</option>
                    <option value={5}>Mayo (05)</option>
                    <option value={6}>Junio (06)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Posición Lateral:
                  </label>
                  <select
                    value={editingLegendModal.item.sidePosition || "right"}
                    onChange={(e) =>
                      setEditingLegendModal({
                        ...editingLegendModal,
                        item: {
                          ...editingLegendModal.item,
                          sidePosition: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="left">Columna Izquierda (Inicio / Hitos)</option>
                    <option value="right">Columna Derecha (Evaluaciones / UDs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Texto de Rango de Fechas:
                </label>
                <input
                  type="text"
                  value={editingLegendModal.item.dayRangeText || ""}
                  onChange={(e) =>
                    setEditingLegendModal({
                      ...editingLegendModal,
                      item: { ...editingLegendModal.item, dayRangeText: e.target.value },
                    })
                  }
                  placeholder="ej. 15-30 Sep, 02/02 - 20/02 (120h)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingLegendModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSaveLegendItem(editingLegendModal.item, editingLegendModal.isNew)
                }
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingLegendModal.isNew ? "Añadir Elemento" : "Guardar Cambios"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISTA PREVIA OFICIAL A4 (5 COLUMNAS X 2 FILAS APAISADO) */}
      {isPreviewA4Open && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-[96vw] xl:max-w-[1400px] h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Vista Previa de Impresión Oficial A4
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded-md text-[10px] font-semibold">
                      Cuadrícula 5x2 Apaisada &bull; Cabeceras Verdes
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Resolución oficial de la Delegación Territorial de la Junta de Andalucía &bull; Curso {calendar.academicYear} (Formato Apaisado / Landscape)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadA4Html}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Descargar el documento como archivo HTML independiente"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Descargar HTML</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenA4NewTab}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Abrir en una nueva pestaña para vista completa o imprimir desde el navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Abrir Pestaña</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintOfficialA4}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
                  title="Imprimir o guardar como PDF en orientación apaisada A4"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewA4Open(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Landscape Sheet Display Container */}
            <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-y-auto flex flex-col items-center justify-start">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-[292mm] p-1 border border-slate-300 my-1 flex-shrink-0">
                <iframe
                  ref={previewIframeRef}
                  title="A4 Preview Landscape"
                  srcDoc={renderOfficialSchoolCalendarA4Html(calendar)}
                  className="w-full h-[760px] border-0 block"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
