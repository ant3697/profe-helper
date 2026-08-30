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
  GripVertical,
  Search,
  CheckSquare,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Save,
  FileText,
  FileCode,
  Image as ImageIcon,
  Printer,
  ChevronDown,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  Target,
  ArrowRightLeft,
  X,
  Copy,
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
} from "../../types/sigreTimeline";
import { SigreUDItem, SigreCurricularConfig } from "../../types/sigre";
import {
  TIMELINE_COLOR_PRESETS,
  MONTH_COLORS_TIMELINE,
  getDefaultCursoTimelineEvents,
  getDefaultProfesorTimelineEvents,
  getDefaultModuloTimelineEvents,
  getDefaultUnidadTimelineEvents,
} from "../../data/sigreTimelinePresets";
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
} from "../../utils/sigreTimelineUtils";

interface SigreMultiLevelTimelineProps {
  uds?: SigreUDItem[];
  config?: SigreCurricularConfig;
  selectedUdId?: string | null;
  onSelectUd?: (udId: string) => void;
  theme?: "dark" | "light";
}

export const SigreMultiLevelTimeline: React.FC<SigreMultiLevelTimelineProps> = ({
  uds = [],
  config = { moduloFormativo: "Módulo Profesional", horasTotales: 160, semanasCurso: 32, horasSemanales: 5 },
  selectedUdId,
  onSelectUd,
  theme = "dark",
}) => {
  // Global multi-level timeline state stored in localStorage
  const [timelineData, setTimelineData] = useState<MultiLevelTimelineData>(() => {
    try {
      const saved = localStorage.getItem("docuexam_sigre_multilevel_timeline");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          schoolYear: parsed.schoolYear || "2025-2026",
          activeLevel: parsed.activeLevel || "modulo",
          cursoEvents: parsed.cursoEvents || getDefaultCursoTimelineEvents(2025),
          profesorEvents: parsed.profesorEvents || getDefaultProfesorTimelineEvents(2025),
          moduloEvents: parsed.moduloEvents || getDefaultModuloTimelineEvents(2025, config.moduloFormativo, config.horasTotales),
          unidadEvents: parsed.unidadEvents || {
            UD01: getDefaultUnidadTimelineEvents(2025, "UD01", "Instalaciones y Mantenimiento"),
          },
        };
      }
    } catch (e) {
      console.warn("Could not load saved timeline data", e);
    }

    return {
      schoolYear: "2025-2026",
      activeLevel: "modulo",
      cursoEvents: getDefaultCursoTimelineEvents(2025),
      profesorEvents: getDefaultProfesorTimelineEvents(2025),
      moduloEvents: getDefaultModuloTimelineEvents(2025, config.moduloFormativo, config.horasTotales),
      unidadEvents: {
        UD01: getDefaultUnidadTimelineEvents(2025, "UD01", "Instalaciones y Mantenimiento"),
      },
    };
  });

  const [activeLevel, setActiveLevel] = useState<TimelineLevel>(timelineData.activeLevel || "modulo");
  const [activeUdId, setActiveUdId] = useState<string>(selectedUdId || uds[0]?.id || "UD01");

  // Keep activeUdId in sync if selectedUdId changes externally
  useEffect(() => {
    if (selectedUdId) {
      setActiveUdId(selectedUdId);
    } else if (uds.length > 0 && !activeUdId) {
      setActiveUdId(uds[0].id);
    }
  }, [selectedUdId, uds]);

  // Current active events array according to the chosen level
  const currentEvents: TimelineEvent[] = useMemo(() => {
    switch (activeLevel) {
      case "curso":
        return timelineData.cursoEvents;
      case "profesor":
        return timelineData.profesorEvents;
      case "modulo":
        return timelineData.moduloEvents;
      case "unidad":
        return timelineData.unidadEvents[activeUdId] || getDefaultUnidadTimelineEvents(2025, activeUdId, "Unidad Didáctica");
      default:
        return timelineData.moduloEvents;
    }
  }, [activeLevel, activeUdId, timelineData]);

  // Updater for the current level's events
  const setCurrentEvents = (newEvents: TimelineEvent[]) => {
    setTimelineData((prev) => {
      const updated = { ...prev };
      if (activeLevel === "curso") {
        updated.cursoEvents = newEvents;
      } else if (activeLevel === "profesor") {
        updated.profesorEvents = newEvents;
      } else if (activeLevel === "modulo") {
        updated.moduloEvents = newEvents;
      } else if (activeLevel === "unidad") {
        updated.unidadEvents = {
          ...prev.unidadEvents,
          [activeUdId]: newEvents,
        };
      }
      return updated;
    });
  };

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("docuexam_sigre_multilevel_timeline", JSON.stringify(timelineData));
    } catch (e) {
      console.warn("Storage full or error saving timeline", e);
    }
  }, [timelineData]);

  // Timeline Visual state
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const eventsLayerRef = useRef<HTMLDivElement>(null);

  const [panOffset, setPanOffset] = useState<number>(50);
  const [pixelsPerDay, setPixelsPerDay] = useState<number>(4.5);
  const [showWeekends, setShowWeekends] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEventIds, setSelectedEventIds] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<"id" | "description" | "startDate" | "endDate">("startDate");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Split-pane Resizer (horizontal percentage on desktop)
  const [leftPanePercent, setLeftPanePercent] = useState<number>(65);
  const [isResizingPane, setIsResizingPane] = useState<boolean>(false);

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
      const fitted = Math.max(0.5, Math.min(20, (containerWidth - 100) / totalDays));
      setPixelsPerDay(fitted);
      setPanOffset(50);
      return;
    }

    const factor = 1.25;
    const nextPixels = direction === "in" ? pixelsPerDay * factor : pixelsPerDay / factor;
    if (nextPixels < 0.2 || nextPixels > 50) return;

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

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      const nextPixels = Math.max(0.2, Math.min(40, pixelsPerDay * factor));
      setPixelsPerDay(nextPixels);
    } else {
      // Horizontal pan with standard scroll
      setPanOffset((prev) => prev - e.deltaX - (e.shiftKey ? e.deltaY : 0));
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
      const generated = generateModuleTimelineFromUds(uds, config, timelineData.schoolYear);
      setCurrentEvents(generated);
      setSaveBanner(`¡Sincronizado cronograma del Módulo (${generated.length} hitos y periodos generados desde el plan)!`);
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
      setSaveBanner("¡Restablecido cronograma docente y colegiado del Profesorado!");
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

    const eventBoxWidth = 190;
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
    <div className="w-full space-y-4 font-sans select-none">
      {/* Level Selection Bar (Curso • Profesor • Módulo • Unidad) */}
      <div className="p-3 bg-surface/90 border border-border-default rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
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

        {/* School Year Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-muted font-bold">Curso:</label>
          <input
            type="text"
            value={timelineData.schoolYear}
            onChange={(e) => setTimelineData({ ...timelineData, schoolYear: e.target.value })}
            className="w-24 px-2 py-1 bg-alt border border-border-default rounded-lg text-xs font-mono font-bold text-center text-text-primary"
            placeholder="2025-2026"
          />
        </div>
      </div>

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
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Hito
          </button>
          <button
            type="button"
            onClick={() => handleAddEvent("periodo")}
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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

        {/* Canvas view controls (Zoom, weekends, export) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowWeekends(!showWeekends)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showWeekends ? "bg-alt text-amber-400 border-amber-500/40" : "bg-alt text-text-muted border-border-default"
            }`}
            title="Mostrar / Ocultar fines de semana y ticks diarios"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 bg-alt border border-border-default p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => handleZoom("out")}
              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              title="Reducir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-text-muted px-1">
              {Math.round(pixelsPerDay * 20)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom("in")}
              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom("fit")}
              className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
              title="Ajustar al tamaño de pantalla"
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
            title="Importar archivo JSON"
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
        </div>
      </div>

      {/* Split-Pane: Visual Timeline (Left) & Resizer & Data Table Editor (Right) */}
      <div
        className="w-full flex flex-col md:flex-row border border-border-default rounded-2xl overflow-hidden bg-background shadow-lg relative min-h-[560px]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Left Pane: Interactive Timeline Canvas */}
        <div
          ref={timelineContainerRef}
          style={{ width: `${leftPanePercent}%` }}
          className="relative h-[560px] overflow-hidden bg-alt/30 cursor-grab active:cursor-grabbing border-b md:border-b-0 md:border-r border-border-default"
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onContextMenu={handleContextMenu}
        >
          {/* Header Info Label */}
          <div className="absolute top-3 left-3 z-30 pointer-events-none flex items-center gap-2">
            <span className="px-2.5 py-1 bg-surface/90 backdrop-blur-xs border border-border-default rounded-lg text-xs font-bold text-text-primary shadow-xs">
              {activeLevel === "curso" && "🎓 Cronograma de Curso Académico (32 Semanas)"}
              {activeLevel === "profesor" && "👨‍🏫 Cronograma Docente y Departamental"}
              {activeLevel === "modulo" && `📚 Cronograma del Módulo (${config.moduloFormativo})`}
              {activeLevel === "unidad" && `🎯 Cronograma de Sesiones (${activeUdId})`}
            </span>
          </div>

          {/* SVG Axis Layer */}
          <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Weekend Bands & Day Ticks */}
            {showWeekends && (() => {
              const dayChars = ["D", "L", "M", "X", "J", "V", "S"];
              const elements: React.ReactNode[] = [];
              const iterDate = new Date(scale.minDate.getTime());
              const axisY = 280;
              const axisHeight = 36;

              while (iterDate <= scale.maxDate) {
                const x = dateToX(iterDate, scale, panOffset);
                const dayOfWeek = iterDate.getDay();

                if (x > -100 && x < 2500) {
                  // Day tick
                  elements.push(
                    <line
                      key={`tick-${iterDate.toISOString()}`}
                      x1={x}
                      x2={x}
                      y1={axisY + axisHeight / 2}
                      y2={axisY + axisHeight / 2 + 8}
                      stroke="currentColor"
                      className="text-border-default"
                      strokeWidth="1"
                    />
                  );

                  // Day char label if zoom is sufficient
                  if (scale.pixelsPerDay > 9) {
                    elements.push(
                      <text
                        key={`lbl-${iterDate.toISOString()}`}
                        x={x + scale.pixelsPerDay / 2}
                        y={axisY + axisHeight / 2 + 18}
                        className="text-[9px] fill-text-muted font-mono font-bold text-center"
                        textAnchor="middle"
                      >
                        {dayChars[dayOfWeek]}
                      </text>
                    );
                  }

                  // Weekend background tint
                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                    const nextDate = new Date(iterDate.getTime() + ONE_DAY_MS);
                    const endX = dateToX(nextDate, scale, panOffset);
                    elements.push(
                      <rect
                        key={`wknd-${iterDate.toISOString()}`}
                        x={x}
                        y={0}
                        width={Math.max(0, endX - x)}
                        height={560}
                        className="fill-black/5 dark:fill-white/5"
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

                  elements.push(
                    <rect
                      key={`mbar-${curMonth.toISOString()}`}
                      x={startX}
                      y={axisY - axisHeight / 2}
                      width={Math.max(0, endX - startX)}
                      height={axisHeight}
                      fill={mColor}
                      rx="3"
                      className="opacity-80"
                    />
                  );

                  elements.push(
                    <text
                      key={`mlbl-${curMonth.toISOString()}`}
                      x={startX + (endX - startX) / 2}
                      y={axisY + 4}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono tracking-wider drop-shadow-xs"
                    >
                      {curMonth.toLocaleString("es-ES", { month: "short" }).toUpperCase()} {curMonth.getFullYear()}
                    </text>
                  );
                }
                curMonth = nextMonth;
              }
              return <g>{elements}</g>;
            })()}

            {/* Today Line */}
            {todayX > -50 && todayX < 3000 && (
              <g>
                <line
                  x1={todayX}
                  x2={todayX}
                  y1={0}
                  y2={560}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <rect x={todayX - 22} y={10} width={44} height={18} rx="4" fill="#ef4444" />
                <text x={todayX} y={23} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
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
                    fill={event.bgColor || "#06b6d4"}
                    stroke={isSelected ? "#ffffff" : event.borderColor || "#0891b2"}
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
                    className="cursor-ew-resize pointer-events-auto opacity-70 hover:opacity-100"
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
                    className="cursor-ew-resize pointer-events-auto opacity-70 hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, event, "resize-end")}
                  />
                </g>
              );
            })}

            {/* Stem connectors from axis to floating cards */}
            {layoutCalculations.cards.map(({ event, startX, boxStartX, isAbove, laneIndex, boxWidth }) => {
              if (event.hidden) return null;
              const axisY = 280;
              const cardHeight = 74;
              const verticalPadding = 12;
              const stemLength = 20;

              let boxY: number;
              if (isAbove) {
                boxY = axisY - 18 - stemLength - cardHeight - laneIndex * (cardHeight + verticalPadding);
              } else {
                boxY = axisY + 18 + stemLength + laneIndex * (cardHeight + verticalPadding);
              }

              return (
                <g key={`stem-${event.id}`}>
                  {/* Circle milestone indicator */}
                  {!event.endDate || event.startDate === event.endDate ? (
                    <circle
                      cx={startX}
                      cy={axisY + 23}
                      r={5}
                      fill={event.bgColor || "#f59e0b"}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ) : null}
                  {/* Line */}
                  <line
                    x1={startX}
                    x2={startX}
                    y1={isAbove ? axisY - 18 : axisY + 18}
                    y2={isAbove ? boxY + cardHeight : boxY}
                    stroke="currentColor"
                    className="text-border-default"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML Floating Cards Layer */}
          <div ref={eventsLayerRef} className="absolute inset-0 pointer-events-none z-10">
            {layoutCalculations.cards.map(({ event, isPeriod, startX, boxStartX, isAbove, laneIndex, boxWidth }) => {
              if (event.hidden) return null;
              const axisY = 280;
              const cardHeight = 74;
              const verticalPadding = 12;
              const stemLength = 20;

              let boxY: number;
              if (isAbove) {
                boxY = axisY - 18 - stemLength - cardHeight - laneIndex * (cardHeight + verticalPadding);
              } else {
                boxY = axisY + 18 + stemLength + laneIndex * (cardHeight + verticalPadding);
              }

              const isSelected = selectedEventIds.has(event.id);
              const customBg = event.bgColor;
              const customText = event.textColor;
              const customBorder = event.borderColor;

              return (
                <div
                  key={`card-${event.id}`}
                  data-event-id={event.id}
                  style={{
                    left: `${boxStartX}px`,
                    top: `${boxY}px`,
                    width: `${boxWidth}px`,
                    backgroundColor: customBg || undefined,
                    color: customText || undefined,
                    borderColor: isSelected ? "#f59e0b" : customBorder || undefined,
                  }}
                  onMouseDown={(e) => handleCardDragStart(e, event)}
                  onDoubleClick={() => openEditModal(event)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventIds(new Set([event.id]));
                  }}
                  className={`absolute pointer-events-auto rounded-xl p-2 text-xs border shadow-sm transition-shadow cursor-move flex flex-col justify-between select-none ${
                    !customBg
                      ? isPeriod
                        ? "bg-surface border-cyan-500/40 text-text-primary"
                        : "bg-surface border-amber-500/40 text-text-primary"
                      : ""
                  } ${isSelected ? "ring-2 ring-amber-500 ring-offset-1 z-20 shadow-md scale-102" : "hover:shadow-md hover:z-10"}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      style={{ color: customText || undefined }}
                      className={`text-[10px] font-mono font-bold truncate block ${
                        !customText ? (isPeriod ? "text-cyan-400" : "text-amber-400") : ""
                      }`}
                    >
                      {new Date(event.startDate + "T00:00:00").toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                      {event.endDate && event.startDate !== event.endDate
                        ? ` → ${new Date(event.endDate + "T00:00:00").toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : ""}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold font-mono opacity-80 border border-current">
                      #{event.id}
                    </span>
                  </div>

                  <p
                    style={{ color: customText || undefined }}
                    className="text-[11px] font-semibold leading-tight line-clamp-2 mt-0.5"
                    title={event.description}
                  >
                    {event.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Date tooltip under cursor */}
          {hoverDateText && !isPanning && !dragState.active && (
            <div
              style={{
                left: `${cursorPos.x - (timelineContainerRef.current?.getBoundingClientRect().left || 0)}px`,
                top: `${cursorPos.y - (timelineContainerRef.current?.getBoundingClientRect().top || 0) - 28}px`,
              }}
              className="absolute pointer-events-none z-30 px-2 py-0.5 bg-amber-500 text-black font-bold font-mono text-[10px] rounded-md shadow-md transform -translate-x-1/2"
            >
              {hoverDateText}
            </div>
          )}
        </div>

        {/* Resizer Divider Bar */}
        <div
          onMouseDown={() => setIsResizingPane(true)}
          className="hidden md:flex items-center justify-center w-2 hover:w-3 bg-border-default hover:bg-amber-500 cursor-col-resize transition-all z-20"
          title="Arrastrar para ajustar ancho"
        >
          <div className="w-0.5 h-8 bg-text-muted rounded-full" />
        </div>

        {/* Right Pane: Data Table & Event Editor */}
        <div
          style={{ width: `${100 - leftPanePercent}%` }}
          className="flex-1 flex flex-col bg-surface overflow-hidden min-h-[560px]"
        >
          {/* Table Header & Search */}
          <div className="p-3 border-b border-border-default flex items-center justify-between gap-2">
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
          <div className="flex-1 overflow-y-auto max-h-[460px]">
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
