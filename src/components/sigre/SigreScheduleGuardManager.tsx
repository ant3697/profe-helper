import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Shield,
  Users,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  UserCheck,
  Building,
  GraduationCap,
  Copy,
  Check,
  Move,
  Layers,
  Scale,
  FileText,
  Sliders,
  X,
  ChevronRight,
  Info,
  ExternalLink,
  UserMinus,
  UserPlus,
  ArrowLeftRight,
  Settings2,
  Award,
  HeartPulse,
  Briefcase,
  SlidersHorizontal,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCheck,
  Filter,
  Tag,
  Globe,
} from "lucide-react";
import {
  SigreScheduleConfig,
  SigreTeacher,
  SigreTimeSlot,
  SigreScheduleCell,
  SigreScheduleSlotType,
  SigreGroupSchedule,
  SigreTeacherReduction,
  SigreTeacherReductionType,
  SigreNormativaItem,
} from "../../types/sigre";
import {
  DEFAULT_SIGRE_TEACHERS,
  DEFAULT_SIGRE_TIME_SLOTS,
  DEFAULT_TEACHER_SCHEDULES,
  DEFAULT_GROUP_SCHEDULES,
  INITIAL_SIGRE_SCHEDULE_CONFIG,
  PRESET_FP_GROUPS_CATALOG,
} from "../../data/sigreSchedulePresets";
import { DEFAULT_SIGRE_NORMATIVA_LIST } from "../../data/sigreNormativaPresets";
import { SigreAcademicCalendarManager } from "./SigreAcademicCalendarManager";
import { preparePrintableHtmlDocument } from "../../utils/topicPromptGenerator";

interface SigreScheduleGuardManagerProps {
  scheduleConfig?: SigreScheduleConfig;
  onUpdateScheduleConfig: (newConfig: SigreScheduleConfig) => void;
  onApplyToCurricularConfig?: (horasSemanales: number, moduloCodigo?: string) => void;
  currentModuloCodigo?: string;
  moduloNombre?: string;
  cicloFormativo?: string;
  docenteNombre?: string;
  currentUds?: any[];
  theme?: string;
}

const DAYS: Array<{ key: "L" | "M" | "X" | "J" | "V"; label: string; fullLabel: string }> = [
  { key: "L", label: "L", fullLabel: "Lunes" },
  { key: "M", label: "M", fullLabel: "Martes" },
  { key: "X", label: "X", fullLabel: "Miércoles" },
  { key: "J", label: "J", fullLabel: "Jueves" },
  { key: "V", label: "V", fullLabel: "Viernes" },
];

// Presets de reducciones según normativa docente actualizada
const PRESET_REDUCTIONS: Array<{
  tipo: SigreTeacherReductionType;
  nombre: string;
  horasLectivas: number;
  horasComplementarias: number;
  normativaRef: string;
  description: string;
}> = [
  {
    tipo: "mayor_55",
    nombre: "Reducción Profesorado >55 años",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Acuerdo Marco Docente / Instrucciones Inicio de Curso (>55 años)",
    description: "Reducción de 2 horas lectivas semanales sin merma retributiva para mayores de 55 años.",
  },
  {
    tipo: "jefatura_dpto",
    nombre: "Jefatura de Departamento FP",
    horasLectivas: 3,
    horasComplementarias: 3,
    normativaRef: "Reglamento Orgánico de Centros (ROC) FP / Instrucciones de Organización (3-4h según nº profesores)",
    description: "Coordinación didáctica, gestión de inventario y seguimiento de módulos profesionales (ajustable según tamaño del departamento).",
  },
  {
    tipo: "coordinacion_ffeoe",
    nombre: "Coordinación FFEoE / FP Dual",
    horasLectivas: 3,
    horasComplementarias: 4,
    normativaRef: "Ley Orgánica 3/2022 de FP y Real Decreto 659/2023",
    description: "Gestión de estancias en empresa u organismos equiparados, convenios y seguimiento de alumnado dual.",
  },
  {
    tipo: "coordinacion_ateca",
    nombre: "Coordinación Aula ATECA / Tecnología Aplicada",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Plan de Modernización de la FP / Aulas ATECA y Digitalización",
    description: "Gestión técnica de equipamiento digital, gemelos digitales, simuladores y VR.",
  },
  {
    tipo: "coordinacion_innovacion",
    nombre: "Coordinación Aulas de Emprendimiento / Innovación",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Plan Estratégico de FP / Emprendimiento e Innovación",
    description: "Dinamización de proyectos de vivero de empresas y proyectos de innovación aplicada.",
  },
  {
    tipo: "coordinacion_prl",
    nombre: "Coordinación PRL y Sostenibilidad",
    horasLectivas: 2,
    horasComplementarias: 1,
    normativaRef: "Plan de Autoprotección y Prevención de Riesgos en Talleres",
    description: "Supervisión de seguridad en talleres de calor, frío, soldadura y almacenamiento de gases.",
  },
  {
    tipo: "coordinacion_erasmus",
    nombre: "Coordinación Programas Internacionales / Erasmus+ FP",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "SEPIE / Plan de Internacionalización de la Formación Profesional",
    description: "Gestión de movilidades internacionales de alumnado y profesorado en centros europeos.",
  },
  {
    tipo: "coordinacion_bilingue",
    nombre: "Coordinación Proyectos Plurilingües / Bilingüe FP",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Instrucciones de Plurilingüismo en FP / Marco Europeo",
    description: "Coordinación curricular de módulos impartidos en lengua extranjera (inglés técnico).",
  },
  {
    tipo: "coordinacion_tic",
    nombre: "Coordinación TIC / Transformación Digital (Codice TIC)",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Plan Digital de Centro / Competencia Digital Docente",
    description: "Administración de plataformas virtuales, aulas virtuales y soporte pedagógico digital.",
  },
  {
    tipo: "tutoria",
    nombre: "Tutoría de Grupo Formativo",
    horasLectivas: 1,
    horasComplementarias: 2,
    normativaRef: "RD 659/2023 / Orden de Organización de Centros",
    description: "Atención individualizada, seguimiento académico y orientación profesional a las familias.",
  },
  {
    tipo: "equipo_directivo",
    nombre: "Miembro del Equipo Directivo / Jefatura Adjunta",
    horasLectivas: 8,
    horasComplementarias: 6,
    normativaRef: "ROC Centros Integrados de FP / Jefatura de Estudios / Secretaría",
    description: "Dedicación a tareas de dirección, jefatura de estudios de FP o secretaría académica.",
  },
  {
    tipo: "lactancia_guarda",
    nombre: "Guarda Legal / Lactancia / Conciliación",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Estatuto Básico del Empleado Público (EBEP)",
    description: "Reducción horaria por cuidado de hijos menores o familiares dependientes.",
  },
  {
    tipo: "personalizada",
    nombre: "Reducción Personalizada / Nueva Casuística Anual",
    horasLectivas: 2,
    horasComplementarias: 2,
    normativaRef: "Instrucciones Específicas del Curso Escolar",
    description: "Nueva reducción horaria acordada según casuística anual o proyectos específicos del centro.",
  },
];

export const SigreScheduleGuardManager: React.FC<SigreScheduleGuardManagerProps> = ({
  scheduleConfig = INITIAL_SIGRE_SCHEDULE_CONFIG,
  onUpdateScheduleConfig,
  onApplyToCurricularConfig,
  currentModuloCodigo = "",
  moduloNombre = "",
  cicloFormativo = "",
  docenteNombre = "",
  currentUds = [],
  theme = "dark",
}) => {
  const config = scheduleConfig || INITIAL_SIGRE_SCHEDULE_CONFIG;
  const teachers = config.teachers || DEFAULT_SIGRE_TEACHERS;
  const timeSlots = config.timeSlots || DEFAULT_SIGRE_TIME_SLOTS;
  const teacherSchedules = config.teacherSchedules || DEFAULT_TEACHER_SCHEDULES;
  const groupSchedules = config.groupSchedules || DEFAULT_GROUP_SCHEDULES;

  const [activeView, setActiveView] = useState<
    "profesores" | "guardias_general" | "grupos" | "normativa" | "calendario_escolar"
  >((config.activeView as any) || "profesores");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    config.selectedTeacherId || (teachers[0] ? teachers[0].id : "EVM")
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    config.selectedGroupId || (groupSchedules[0] ? groupSchedules[0].id : "cfgm_calor_2")
  );

  // Edit Cell Modal State
  const [editingCell, setEditingCell] = useState<{
    teacherId?: string;
    groupId?: string;
    day: "L" | "M" | "X" | "J" | "V";
    slotId: string;
    cellData: SigreScheduleCell;
  } | null>(null);

  // Teacher Workload & Details Modal (Edit/Create)
  const [editingTeacher, setEditingTeacher] = useState<SigreTeacher | null>(null);
  const [isCreatingTeacher, setIsCreatingTeacher] = useState(false);

  // Group / Cycle Management State
  const [editingGroupModal, setEditingGroupModal] = useState<{
    group: Partial<SigreGroupSchedule> & { id: string; name: string; shortName: string; cycle?: string; course?: string; defaultClassroom?: string };
    isNew: boolean;
  } | null>(null);
  const [groupFilterCategory, setGroupFilterCategory] = useState<"todos" | "1" | "2" | "gs_otros">("todos");
  const [showAddGroupCatalogModal, setShowAddGroupCatalogModal] = useState(false);

  // Drag & Drop State
  const [draggedCellInfo, setDraggedCellInfo] = useState<{
    sourceType: "teacher" | "group";
    sourceId: string; // teacherId or groupId
    sourceDay: "L" | "M" | "X" | "J" | "V";
    sourceSlotId: string;
    cellData: SigreScheduleCell;
  } | null>(null);

  const [dropTargetInfo, setDropTargetInfo] = useState<{
    day: "L" | "M" | "X" | "J" | "V";
    slotId: string;
  } | null>(null);

  // Conflict / Multi-Teacher Split Resolution Modal
  const [dragConflictModal, setDragConflictModal] = useState<{
    source: {
      sourceType: "teacher" | "group";
      sourceId: string;
      sourceDay: "L" | "M" | "X" | "J" | "V";
      sourceSlotId: string;
      cellData: SigreScheduleCell;
    };
    target: {
      targetType: "teacher" | "group";
      targetId: string;
      targetDay: "L" | "M" | "X" | "J" | "V";
      targetSlotId: string;
      existingCellData: SigreScheduleCell;
    };
  } | null>(null);

  // Marco Normativo State
  const [normativaList, setNormativaList] = useState<SigreNormativaItem[]>(DEFAULT_SIGRE_NORMATIVA_LIST);
  const [normativaSearchQuery, setNormativaSearchQuery] = useState<string>("");
  const [normativaCategoryFilter, setNormativaCategoryFilter] = useState<
    "all" | "andalucia_autonomica" | "estatal" | "jornada_horarios" | "reducciones_edad" | "fp_dual_desdobles"
  >("all");
  const [isVerifyingAndalucia, setIsVerifyingAndalucia] = useState<boolean>(false);
  const [lastVerificationTimestamp, setLastVerificationTimestamp] = useState<string>(
    "26/08/2026 11:45:00 - Vigencia Oficial en Andalucía Verificada"
  );
  const [verificationFeedback, setVerificationFeedback] = useState<{
    type: "success" | "info";
    message: string;
    stats: { total: number; vigentes: number; bojas: number; boes: number };
  } | null>(null);
  const [editingNormativaModal, setEditingNormativaModal] = useState<{
    item: Partial<SigreNormativaItem>;
    isNew: boolean;
  } | null>(null);
  const [expandedNormativaIds, setExpandedNormativaIds] = useState<Record<string, boolean>>({});

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
  const activeGroup = groupSchedules.find((g) => g.id === selectedGroupId) || groupSchedules[0];

  // Helper to find a cell in teacher's schedule
  const getTeacherCell = (teacherId: string, day: "L" | "M" | "X" | "J" | "V", slotId: string): SigreScheduleCell | undefined => {
    const list = teacherSchedules[teacherId] || [];
    return list.find((c) => c.day === day && c.slotId === slotId);
  };

  // Helper to find cell in group schedule
  const getGroupCell = (groupId: string, day: "L" | "M" | "X" | "J" | "V", slotId: string): SigreScheduleCell | undefined => {
    const group = groupSchedules.find((g) => g.id === groupId);
    if (!group) return undefined;
    return group.cells.find((c) => c.day === day && c.slotId === slotId);
  };

  // Helper to get all guard duties in a given day & timeSlot across ALL teachers
  const getGuardsForSlot = (day: "L" | "M" | "X" | "J" | "V", slotId: string) => {
    const guards: Array<{ teacher: SigreTeacher; cell: SigreScheduleCell }> = [];
    teachers.forEach((teacher) => {
      const list = teacherSchedules[teacher.id] || [];
      const cell = list.find((c) => c.day === day && c.slotId === slotId);
      if (cell && (cell.type === "guardia" || cell.type === "guardia_recreo" || cell.code?.toUpperCase() === "GUA")) {
        guards.push({ teacher, cell });
      }
    });
    return guards;
  };

  // Detailed Teacher Stats & Statutory Workload Calculation
  const getTeacherWorkloadDetails = (teacher: SigreTeacher) => {
    const list = teacherSchedules[teacher.id] || [];
    
    // 1. Horas lectivas asignadas en el horario semanal (excluye recreo)
    const lectivasAsignadas = list.filter((c) => c.type === "clase" && c.slotId !== "recreo").length;
    
    // 2. Guardias de aula y recreo
    const guardiasAula = list.filter((c) => c.type === "guardia" || (c.code?.toUpperCase() === "GUA" && c.slotId !== "recreo")).length;
    const guardiasRecreo = list.filter((c) => c.type === "guardia_recreo" || (c.slotId === "recreo" && c.code?.toUpperCase() === "GUA")).length;
    const totalGuardias = guardiasAula + guardiasRecreo;

    // 3. Tutorías y reuniones de departamento
    const tutorias = list.filter((c) => c.type === "tutoria").length;
    const reuniones = list.filter((c) => c.type === "reunion_dpto" || c.type === "coordinacion").length;

    // 4. Parámetros normativos
    const permanenciaObligada = teacher.horasPermanenciaCentro || 30; // 30h semanales de permanencia
    const lectivasBase = teacher.horasLectivasBase || 18; // 18h lectivas según LOMLOE / Ley 4/2019

    // 5. Reducciones activas
    const reduccionesActivas = (teacher.reducciones || []).filter((r) => r.activo);
    const totalReduccionLectiva = reduccionesActivas.reduce((acc, r) => acc + (r.horasLectivas || 0), 0);
    const totalReduccionComplementaria = reduccionesActivas.reduce((acc, r) => acc + (r.horasComplementarias || 0), 0);

    // 6. Horas lectivas objetivo reales a impartir
    const lectivasObjetivo = Math.max(0, lectivasBase - totalReduccionLectiva);

    // 7. Balance lectivo
    const balanceLectivo = lectivasAsignadas - lectivasObjetivo; // 0 = exacto, >0 exceso, <0 faltan horas

    // 8. Permanencia total cubierta (lectivas + guardias + complementarias/reducciones + reuniones)
    const permanenciaCubierta = lectivasAsignadas + totalGuardias + tutorias + reuniones + totalReduccionComplementaria;
    const balancePermanencia = permanenciaCubierta - permanenciaObligada;

    return {
      lectivasAsignadas,
      guardiasAula,
      guardiasRecreo,
      totalGuardias,
      tutorias,
      reuniones,
      permanenciaObligada,
      lectivasBase,
      reduccionesActivas,
      totalReduccionLectiva,
      totalReduccionComplementaria,
      lectivasObjetivo,
      balanceLectivo,
      permanenciaCubierta,
      balancePermanencia,
    };
  };

  // Save edited cell
  const handleSaveCell = () => {
    if (!editingCell) return;
    const { teacherId, groupId, day, slotId, cellData } = editingCell;

    if (teacherId) {
      const currentList = teacherSchedules[teacherId] || [];
      const filtered = currentList.filter((c) => !(c.day === day && c.slotId === slotId));
      
      const updatedList =
        cellData.type === "libre" && !cellData.code?.trim()
          ? filtered
          : [...filtered, { ...cellData, day, slotId, teacherId }];

      const updatedSchedules = {
        ...teacherSchedules,
        [teacherId]: updatedList,
      };

      // Si tiene desdoble / profesores compartidos (sharedWith), opcionalmente sincronizar en el horario del otro docente
      if (cellData.sharedWith && cellData.sharedWith.length > 0) {
        cellData.sharedWith.forEach((sharedTeacherId) => {
          if (updatedSchedules[sharedTeacherId]) {
            const otherList = updatedSchedules[sharedTeacherId].filter((c) => !(c.day === day && c.slotId === slotId));
            updatedSchedules[sharedTeacherId] = [
              ...otherList,
              {
                ...cellData,
                day,
                slotId,
                teacherId: sharedTeacherId,
                notes: `Desdoble de taller con ${teacherId}`,
              },
            ];
          }
        });
      }

      onUpdateScheduleConfig({
        ...config,
        teacherSchedules: updatedSchedules,
      });
    } else if (groupId) {
      const updatedGroups = groupSchedules.map((g) => {
        if (g.id === groupId) {
          const filtered = g.cells.filter((c) => !(c.day === day && c.slotId === slotId));
          const updatedCells =
            cellData.type === "libre" && !cellData.code?.trim()
              ? filtered
              : [...filtered, { ...cellData, day, slotId }];
          return { ...g, cells: updatedCells };
        }
        return g;
      });

      onUpdateScheduleConfig({
        ...config,
        groupSchedules: updatedGroups,
      });
    }

    setEditingCell(null);
  };

  // Delete cell
  const handleDeleteCell = () => {
    if (!editingCell) return;
    const { teacherId, groupId, day, slotId } = editingCell;

    if (teacherId) {
      const currentList = teacherSchedules[teacherId] || [];
      const updatedList = currentList.filter((c) => !(c.day === day && c.slotId === slotId));
      onUpdateScheduleConfig({
        ...config,
        teacherSchedules: {
          ...teacherSchedules,
          [teacherId]: updatedList,
        },
      });
    } else if (groupId) {
      const updatedGroups = groupSchedules.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            cells: g.cells.filter((c) => !(c.day === day && c.slotId === slotId)),
          };
        }
        return g;
      });
      onUpdateScheduleConfig({
        ...config,
        groupSchedules: updatedGroups,
      });
    }

    setEditingCell(null);
  };

  // Save or Update Teacher (Full Details & Reductions)
  const handleSaveTeacher = (teacherToSave: SigreTeacher) => {
    if (!teacherToSave.code.trim() || !teacherToSave.name.trim()) {
      alert("El código y el nombre del docente son obligatorios.");
      return;
    }

    let updatedTeachers: SigreTeacher[];
    let updatedSchedules = { ...teacherSchedules };

    if (isCreatingTeacher) {
      // Check for duplicate ID
      const existingId = teachers.find((t) => t.id === teacherToSave.id);
      const finalId = existingId ? `${teacherToSave.id}_${Date.now().toString().slice(-4)}` : teacherToSave.id;
      const newT: SigreTeacher = { ...teacherToSave, id: finalId };
      updatedTeachers = [...teachers, newT];
      updatedSchedules[finalId] = [];
      setSelectedTeacherId(finalId);
    } else {
      updatedTeachers = teachers.map((t) => (t.id === teacherToSave.id ? teacherToSave : t));
    }

    onUpdateScheduleConfig({
      ...config,
      teachers: updatedTeachers,
      teacherSchedules: updatedSchedules,
      selectedTeacherId: teacherToSave.id,
    });

    setEditingTeacher(null);
    setIsCreatingTeacher(false);
  };

  // Delete teacher with confirmation
  const handleDeleteTeacher = (tId: string) => {
    if (teachers.length <= 1) {
      alert("Debe haber al menos un docente en el claustro.");
      return;
    }
    const targetTeacher = teachers.find((t) => t.id === tId);
    const teacherName = targetTeacher ? `${targetTeacher.code} (${targetTeacher.name})` : tId;

    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente al docente ${teacherName}?\nSe eliminará su horario semanal asignado.`
      )
    ) {
      return;
    }

    const updatedTeachers = teachers.filter((t) => t.id !== tId);
    const updatedSchedules = { ...teacherSchedules };
    delete updatedSchedules[tId];

    const nextSelected = updatedTeachers[0]?.id || "";
    setSelectedTeacherId(nextSelected);

    onUpdateScheduleConfig({
      ...config,
      teachers: updatedTeachers,
      teacherSchedules: updatedSchedules,
      selectedTeacherId: nextSelected,
    });
  };

  // ----------------------------------------------------
  // GROUP / CYCLE MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const handleSaveGroup = (
    groupToSave: Partial<SigreGroupSchedule> & { id: string; name: string; shortName: string; cycle?: string; course?: string; defaultClassroom?: string },
    isNew: boolean
  ) => {
    if (!groupToSave.id.trim() || !groupToSave.name.trim() || !groupToSave.shortName.trim()) {
      alert("El identificador, el nombre y el código corto del grupo son obligatorios.");
      return;
    }

    let updatedGroups: SigreGroupSchedule[];

    if (isNew) {
      if (groupSchedules.some((g) => g.id === groupToSave.id)) {
        alert("Ya existe un grupo con este identificador. Usa otro código.");
        return;
      }
      const newGroup: SigreGroupSchedule = {
        id: groupToSave.id,
        name: groupToSave.name,
        shortName: groupToSave.shortName,
        cells: groupToSave.cells || [],
      };
      updatedGroups = [...groupSchedules, newGroup];
      setSelectedGroupId(newGroup.id);
    } else {
      updatedGroups = groupSchedules.map((g) => {
        if (g.id === groupToSave.id) {
          return {
            ...g,
            name: groupToSave.name,
            shortName: groupToSave.shortName,
            cells: groupToSave.cells || g.cells,
          };
        }
        return g;
      });
    }

    onUpdateScheduleConfig({
      ...config,
      groupSchedules: updatedGroups,
      selectedGroupId: groupToSave.id,
    });

    setEditingGroupModal(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groupSchedules.find((g) => g.id === groupId);
    if (!group) return;

    if (groupSchedules.length <= 1) {
      alert("No se puede eliminar el único grupo del centro.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que deseas eliminar el grupo "${group.name}" (${group.shortName})?`)) {
      const updatedGroups = groupSchedules.filter((g) => g.id !== groupId);
      const nextSelected = updatedGroups[0]?.id || "";
      setSelectedGroupId(nextSelected);

      onUpdateScheduleConfig({
        ...config,
        groupSchedules: updatedGroups,
        selectedGroupId: nextSelected,
      });
    }
  };

  // Auto-sync a single group with classes defined in teacher schedules
  const handleSyncGroupFromTeachers = (groupId: string) => {
    const targetGroup = groupSchedules.find((g) => g.id === groupId);
    if (!targetGroup) return;

    const shortLower = targetGroup.shortName.toLowerCase().trim();
    const nameLower = targetGroup.name.toLowerCase().trim();
    const idLower = targetGroup.id.toLowerCase().trim();

    // Collect all cells across all teachers that belong to this group
    const matchedCells: SigreScheduleCell[] = [];

    teachers.forEach((t) => {
      const tCells = teacherSchedules[t.id] || [];
      tCells.forEach((c) => {
        if (c.type === "clase") {
          const groupField = (c.group || "").toLowerCase().trim();
          const classroomField = (c.classroom || "").toLowerCase().trim();

          const isMatch =
            (groupField && (groupField.includes(shortLower) || shortLower.includes(groupField) || nameLower.includes(groupField))) ||
            (c.code && (shortLower.includes(c.code.toLowerCase()) || nameLower.includes(c.code.toLowerCase()))) ||
            (classroomField && classroomField.includes(shortLower));

          if (isMatch) {
            matchedCells.push({
              day: c.day,
              slotId: c.slotId,
              type: "clase",
              code: c.code,
              subject: c.subject,
              classroom: c.classroom,
              teacherId: t.id,
              sharedWith: c.sharedWith,
              notes: c.notes,
            });
          }
        }
      });
    });

    if (matchedCells.length === 0) {
      alert(`No se encontraron clases asignadas específicamente a "${targetGroup.shortName}" en los horarios docentes.`);
      return;
    }

    const updatedGroups = groupSchedules.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          cells: matchedCells,
        };
      }
      return g;
    });

    onUpdateScheduleConfig({
      ...config,
      groupSchedules: updatedGroups,
    });

    alert(`¡Sincronización completada! Se han vinculado ${matchedCells.length} horas de clase al horario de ${targetGroup.shortName}.`);
  };

  // Auto-sync ALL groups with teachers
  const handleSyncAllGroupsFromTeachers = () => {
    let totalSynced = 0;

    const updatedGroups = groupSchedules.map((g) => {
      const shortLower = g.shortName.toLowerCase().trim();
      const nameLower = g.name.toLowerCase().trim();

      const matchedCells: SigreScheduleCell[] = [];

      teachers.forEach((t) => {
        const tCells = teacherSchedules[t.id] || [];
        tCells.forEach((c) => {
          if (c.type === "clase") {
            const groupField = (c.group || "").toLowerCase().trim();
            const classroomField = (c.classroom || "").toLowerCase().trim();

            const isMatch =
              (groupField && (groupField.includes(shortLower) || shortLower.includes(groupField) || nameLower.includes(groupField))) ||
              (classroomField && classroomField.includes(shortLower));

            if (isMatch) {
              matchedCells.push({
                day: c.day,
                slotId: c.slotId,
                type: "clase",
                code: c.code,
                subject: c.subject,
                classroom: c.classroom,
                teacherId: t.id,
                sharedWith: c.sharedWith,
                notes: c.notes,
              });
            }
          }
        });
      });

      if (matchedCells.length > 0) {
        totalSynced += matchedCells.length;
        return { ...g, cells: matchedCells };
      }
      return g;
    });

    onUpdateScheduleConfig({
      ...config,
      groupSchedules: updatedGroups,
    });

    alert(`¡Sincronización global realizada! Se actualizaron los horarios de los ${groupSchedules.length} grupos con un total de ${totalSynced} sesiones.`);
  };

  // Quick add from catalog
  const handleQuickAddPresetGroup = (preset: typeof PRESET_FP_GROUPS_CATALOG[0]) => {
    if (groupSchedules.some((g) => g.id === preset.id)) {
      setSelectedGroupId(preset.id);
      setShowAddGroupCatalogModal(false);
      return;
    }

    // Check if there is preset schedule in DEFAULT_GROUP_SCHEDULES
    const defaultData = DEFAULT_GROUP_SCHEDULES.find((d) => d.id === preset.id);

    const newGroup: SigreGroupSchedule = {
      id: preset.id,
      name: preset.name,
      shortName: preset.shortName,
      cells: defaultData ? defaultData.cells : [],
    };

    const updatedGroups = [...groupSchedules, newGroup];
    setSelectedGroupId(newGroup.id);
    setShowAddGroupCatalogModal(false);

    onUpdateScheduleConfig({
      ...config,
      groupSchedules: updatedGroups,
      selectedGroupId: newGroup.id,
    });
  };

  // ----------------------------------------------------
  // MARCO NORMATIVO HANDLERS
  // ----------------------------------------------------
  const handleVerifyNormativaAndalucia = () => {
    setIsVerifyingAndalucia(true);
    setVerificationFeedback(null);

    setTimeout(() => {
      setIsVerifyingAndalucia(false);
      const now = new Date();
      const timeStr = `${now.toLocaleDateString("es-ES")} a las ${now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      setLastVerificationTimestamp(`${timeStr} - Vigencia Oficial en Andalucía Verificada`);

      // Update lastCheckedDate on all items
      const updatedList = normativaList.map((item) => ({
        ...item,
        isVigenteAndalucia: true,
        status: "vigente" as const,
        lastCheckedDate: now.toISOString().split("T")[0],
      }));
      setNormativaList(updatedList);

      const bojas = updatedList.filter(
        (n) => n.officialScope.includes("Andalucía") || n.officialScope.includes("Consejería")
      ).length;
      const boes = updatedList.filter((n) => n.officialScope.includes("Estatal") || n.officialScope.includes("BOE")).length;

      setVerificationFeedback({
        type: "success",
        message: `¡Marco Normativo 100% Vigente y Actualizado en Andalucía! Se ha comprobado la vigencia de todas las disposiciones con el BOJA (Junta de Andalucía), las Instrucciones de Organización de la Viceconsejería de Desarrollo Educativo y FP, y el BOE.`,
        stats: {
          total: updatedList.length,
          vigentes: updatedList.length,
          bojas,
          boes,
        },
      });
    }, 1000);
  };

  const handleSaveNormativaItem = (itemToSave: Partial<SigreNormativaItem>, isNew: boolean) => {
    if (!itemToSave.code?.trim() || !itemToSave.title?.trim()) {
      alert("El código y el título de la norma son campos obligatorios.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    if (isNew) {
      const newItem: SigreNormativaItem = {
        id: itemToSave.id || `norm_custom_${Date.now()}`,
        code: itemToSave.code.trim(),
        title: itemToSave.title.trim(),
        category: itemToSave.category || "andalucia_autonomica",
        officialScope: itemToSave.officialScope || "Andalucía (BOJA)",
        publicationRef: itemToSave.publicationRef || "Normativa Interna / BOJA",
        status: "vigente",
        isVigenteAndalucia: true,
        lastCheckedDate: todayStr,
        summary: itemToSave.summary || "Regulación aplicable a la organización docente y horaria.",
        keyPoints: itemToSave.keyPoints || ["Disposición de obligado cumplimiento en el centro."],
        applicabilityNotes: itemToSave.applicabilityNotes || "Aplicable en la confección de horarios de FP.",
        legalArticles: itemToSave.legalArticles,
        sourceUrl: itemToSave.sourceUrl,
      };
      setNormativaList([newItem, ...normativaList]);
    } else {
      setNormativaList(
        normativaList.map((n) =>
          n.id === itemToSave.id
            ? {
                ...n,
                ...itemToSave,
                lastCheckedDate: todayStr,
                isVigenteAndalucia: true,
              }
            : n
        )
      );
    }

    setEditingNormativaModal(null);
  };

  const handleDeleteNormativaItem = (id: string) => {
    const item = normativaList.find((n) => n.id === id);
    if (!item) return;

    if (window.confirm(`¿Estás seguro de eliminar la referencia normativa "${item.code}"?`)) {
      setNormativaList(normativaList.filter((n) => n.id !== id));
    }
  };

  const handleResetNormativaDefaults = () => {
    if (window.confirm("¿Deseas restablecer el catálogo de normativa oficial a los valores por defecto de la Junta de Andalucía?")) {
      setNormativaList(DEFAULT_SIGRE_NORMATIVA_LIST);
      setNormativaSearchQuery("");
      setNormativaCategoryFilter("all");
      setVerificationFeedback(null);
    }
  };

  const toggleExpandNormativa = (id: string) => {
    setExpandedNormativaIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Reset to default presets
  const handleResetToPresets = () => {
    if (
      window.confirm(
        "¿Restablecer todos los horarios, guardias y reducciones a la plantilla oficial de CFGM Frío y Calor 2025-2026?"
      )
    ) {
      onUpdateScheduleConfig(INITIAL_SIGRE_SCHEDULE_CONFIG);
      setSelectedTeacherId("EVM");
      setSelectedGroupId("cfgm_calor_2");
    }
  };

  // Calculate hours of current module for current teacher
  const handleApplyHoursToConfig = () => {
    if (!onApplyToCurricularConfig || !activeTeacher) return;
    const list = teacherSchedules[activeTeacher.id] || [];
    let hoursCount = 0;
    if (currentModuloCodigo) {
      const match = currentModuloCodigo.trim().toLowerCase();
      hoursCount = list.filter(
        (c) =>
          c.type === "clase" &&
          c.slotId !== "recreo" &&
          (c.code?.toLowerCase().includes(match) || c.subject?.toLowerCase().includes(match))
      ).length;
    }
    if (hoursCount === 0) {
      hoursCount = list.filter((c) => c.type === "clase" && c.slotId !== "recreo").length;
    }
    if (hoursCount > 0) {
      onApplyToCurricularConfig(hoursCount, currentModuloCodigo);
      alert(`Se han sincronizado ${hoursCount} horas semanales lectivas con la programación curricular.`);
    } else {
      alert("No se detectaron horas lectivas para sincronizar.");
    }
  };

  // ----------------------------------------------------
  // DRAG AND DROP HANDLERS
  // ----------------------------------------------------
  const handleDragStart = (
    e: React.DragEvent,
    sourceType: "teacher" | "group",
    sourceId: string,
    sourceDay: "L" | "M" | "X" | "J" | "V",
    sourceSlotId: string,
    cellData: SigreScheduleCell
  ) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ sourceType, sourceId, sourceDay, sourceSlotId, cellData }));
    e.dataTransfer.effectAllowed = "move";
    setDraggedCellInfo({ sourceType, sourceId, sourceDay, sourceSlotId, cellData });
  };

  const handleDragOver = (e: React.DragEvent, targetDay: "L" | "M" | "X" | "J" | "V", targetSlotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dropTargetInfo || dropTargetInfo.day !== targetDay || dropTargetInfo.slotId !== targetSlotId) {
      setDropTargetInfo({ day: targetDay, slotId: targetSlotId });
    }
  };

  const handleDragLeave = () => {
    setDropTargetInfo(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetType: "teacher" | "group",
    targetId: string,
    targetDay: "L" | "M" | "X" | "J" | "V",
    targetSlotId: string
  ) => {
    e.preventDefault();
    setDropTargetInfo(null);

    if (!draggedCellInfo) return;
    const { sourceType, sourceId, sourceDay, sourceSlotId, cellData } = draggedCellInfo;

    // Si es la misma celda, no hacer nada
    if (sourceType === targetType && sourceId === targetId && sourceDay === targetDay && sourceSlotId === targetSlotId) {
      setDraggedCellInfo(null);
      return;
    }

    // Comprobar si en el destino ya existe una celda ocupada
    let existingCell: SigreScheduleCell | undefined;
    if (targetType === "teacher") {
      existingCell = getTeacherCell(targetId, targetDay, targetSlotId);
    } else {
      existingCell = getGroupCell(targetId, targetDay, targetSlotId);
    }

    if (existingCell && existingCell.type !== "libre" && existingCell.code?.trim()) {
      // Conflicto: mostrar modal de resolución (Intercambiar, Reemplazar o Fusionar en desdoble)
      setDragConflictModal({
        source: { sourceType, sourceId, sourceDay, sourceSlotId, cellData },
        target: { targetType, targetId, targetDay, targetSlotId, existingCellData: existingCell },
      });
      setDraggedCellInfo(null);
      return;
    }

    // Celda destino libre: mover directamente
    executeMoveCell(sourceType, sourceId, sourceDay, sourceSlotId, cellData, targetType, targetId, targetDay, targetSlotId);
    setDraggedCellInfo(null);
  };

  const executeMoveCell = (
    sourceType: "teacher" | "group",
    sourceId: string,
    sourceDay: "L" | "M" | "X" | "J" | "V",
    sourceSlotId: string,
    cellData: SigreScheduleCell,
    targetType: "teacher" | "group",
    targetId: string,
    targetDay: "L" | "M" | "X" | "J" | "V",
    targetSlotId: string
  ) => {
    if (sourceType === "teacher" && targetType === "teacher") {
      const sourceList = (teacherSchedules[sourceId] || []).filter(
        (c) => !(c.day === sourceDay && c.slotId === sourceSlotId)
      );

      let targetList = sourceId === targetId ? sourceList : [...(teacherSchedules[targetId] || [])];
      targetList = targetList.filter((c) => !(c.day === targetDay && c.slotId === targetSlotId));
      targetList.push({
        ...cellData,
        day: targetDay,
        slotId: targetSlotId,
        teacherId: targetId,
      });

      const newSchedules = {
        ...teacherSchedules,
        [sourceId]: sourceList,
        [targetId]: targetList,
      };

      onUpdateScheduleConfig({
        ...config,
        teacherSchedules: newSchedules,
      });
    } else if (sourceType === "group" && targetType === "group") {
      const updatedGroups = groupSchedules.map((g) => {
        if (g.id === sourceId) {
          const filtered = g.cells.filter((c) => !(c.day === sourceDay && c.slotId === sourceSlotId));
          if (sourceId === targetId) {
            return {
              ...g,
              cells: [
                ...filtered.filter((c) => !(c.day === targetDay && c.slotId === targetSlotId)),
                { ...cellData, day: targetDay, slotId: targetSlotId },
              ],
            };
          }
          return { ...g, cells: filtered };
        }
        if (g.id === targetId) {
          const filtered = g.cells.filter((c) => !(c.day === targetDay && c.slotId === targetSlotId));
          return {
            ...g,
            cells: [...filtered, { ...cellData, day: targetDay, slotId: targetSlotId }],
          };
        }
        return g;
      });

      onUpdateScheduleConfig({
        ...config,
        groupSchedules: updatedGroups,
      });
    }
  };

  // Resolución de conflicto de arrastre
  const handleResolveConflict = (action: "swap" | "overwrite" | "merge_split") => {
    if (!dragConflictModal) return;
    const { source, target } = dragConflictModal;

    if (action === "swap") {
      // Intercambiar las dos sesiones
      if (source.sourceType === "teacher" && target.targetType === "teacher") {
        const sourceList = (teacherSchedules[source.sourceId] || []).filter(
          (c) => !(c.day === source.sourceDay && c.slotId === source.sourceSlotId)
        );
        let targetList = source.sourceId === target.targetId ? sourceList : [...(teacherSchedules[target.targetId] || [])];
        targetList = targetList.filter((c) => !(c.day === target.targetDay && c.slotId === target.targetSlotId));

        // Poner la celda destino en la posición origen
        const newSourceList = [
          ...sourceList,
          {
            ...target.existingCellData,
            day: source.sourceDay,
            slotId: source.sourceSlotId,
            teacherId: source.sourceId,
          },
        ];

        // Poner la celda origen en la posición destino
        const newTargetList = [
          ...targetList,
          {
            ...source.cellData,
            day: target.targetDay,
            slotId: target.targetSlotId,
            teacherId: target.targetId,
          },
        ];

        onUpdateScheduleConfig({
          ...config,
          teacherSchedules: {
            ...teacherSchedules,
            [source.sourceId]: newSourceList,
            [target.targetId]: newTargetList,
          },
        });
      }
    } else if (action === "overwrite") {
      // Sobrescribir celda destino
      executeMoveCell(
        source.sourceType,
        source.sourceId,
        source.sourceDay,
        source.sourceSlotId,
        source.cellData,
        target.targetType,
        target.targetId,
        target.targetDay,
        target.targetSlotId
      );
    } else if (action === "merge_split") {
      // Crear desdoble / compartir celda con múltiples profesores (Co-docencia)
      if (source.sourceType === "teacher" && target.targetType === "teacher") {
        const sourceTeacher = teachers.find((t) => t.id === source.sourceId);
        const targetTeacher = teachers.find((t) => t.id === target.targetId);

        const currentShared = target.existingCellData.sharedWith || [];
        const newSharedWith = Array.from(new Set([...currentShared, source.sourceId]));

        const mergedCell: SigreScheduleCell = {
          ...target.existingCellData,
          sharedWith: newSharedWith,
          notes: `Desdoble de taller: ${targetTeacher?.code || target.targetId} + ${sourceTeacher?.code || source.sourceId}`,
        };

        // Eliminar origen
        const sourceList = (teacherSchedules[source.sourceId] || []).filter(
          (c) => !(c.day === source.sourceDay && c.slotId === source.sourceSlotId)
        );

        // Actualizar destino en target
        const targetList = (source.sourceId === target.targetId ? sourceList : teacherSchedules[target.targetId] || []).filter(
          (c) => !(c.day === target.targetDay && c.slotId === target.targetSlotId)
        );
        targetList.push(mergedCell);

        // Si source y target son profesores distintos, también añadir la sesión al horario del profesor fuente con desdoble
        const finalSchedules = {
          ...teacherSchedules,
          [source.sourceId]: [
            ...sourceList,
            {
              ...mergedCell,
              day: target.targetDay,
              slotId: target.targetSlotId,
              teacherId: source.sourceId,
              sharedWith: [target.targetId],
            },
          ],
          [target.targetId]: targetList,
        };

        onUpdateScheduleConfig({
          ...config,
          teacherSchedules: finalSchedules,
        });
      }
    }

    setDragConflictModal(null);
  };

  // Print schedule
  const handlePrintSchedule = () => {
    let title = "Horario y Guardias";
    let bodyContent = "";

    if (activeView === "profesores" && activeTeacher) {
      title = `Horario Semanal Docente - ${activeTeacher.code} (${activeTeacher.name})`;
      const stats = getTeacherWorkloadDetails(activeTeacher);
      bodyContent = `
        <div style="margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          <h2 style="margin: 0 0 4px 0; color: #1e293b; font-size: 18px;">${activeTeacher.code} — ${activeTeacher.name}</h2>
          <p style="margin: 0; color: #64748b; font-size: 12px;">
            Departamento: ${activeTeacher.department || "Instalación y Mantenimiento"} | 
            Lectivas Asignadas: <strong>${stats.lectivasAsignadas} h</strong> (Objetivo: ${stats.lectivasObjetivo} h de ${stats.lectivasBase}h base) | 
            Guardias: <strong>${stats.totalGuardias} (GUA)</strong> | 
            Permanencia Semanal: <strong>${stats.permanenciaObligada} h</strong>
          </p>
          ${
            stats.reduccionesActivas.length > 0
              ? `<p style="margin: 4px 0 0 0; color: #0284c7; font-size: 11px;">
                  Reducciones Horarias Normativas: ${stats.reduccionesActivas.map((r) => `<strong>${r.nombre}</strong> (-${r.horasLectivas}h lectivas)`).join(", ")}
                </p>`
              : ""
          }
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 14%;">HORAS</th>
              ${DAYS.map((d) => `<th style="border: 1px solid #cbd5e1; padding: 6px; width: 17%;">${d.fullLabel} (${d.label})</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${timeSlots
              .map((slot) => {
                if (slot.isBreak) {
                  return `
                    <tr style="background: #f8fafc; font-weight: bold;">
                      <td style="border: 1px solid #cbd5e1; padding: 4px; color: #475569;">${slot.label}<br><span style="font-size: 9px; font-weight: normal;">${slot.timeRange}</span></td>
                      ${DAYS.map((d) => {
                        const cell = getTeacherCell(activeTeacher.id, d.key, slot.id);
                        const isGua = cell && (cell.type === "guardia_recreo" || cell.code?.toUpperCase() === "GUA");
                        return `
                          <td style="border: 1px solid #cbd5e1; padding: 4px; ${isGua ? "background: #fee2e2; color: #991b1b; font-weight: bold;" : "color: #94a3b8;"}">
                            ${isGua ? "GUA (Recreo)" : "RECREO"}
                          </td>
                        `;
                      }).join("")}
                    </tr>
                  `;
                }
                return `
                  <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; background: #fafafa;">
                      ${slot.label}<br><span style="font-size: 9px; color: #64748b; font-weight: normal;">${slot.timeRange}</span>
                    </td>
                    ${DAYS.map((d) => {
                      const cell = getTeacherCell(activeTeacher.id, d.key, slot.id);
                      if (!cell) {
                        return `<td style="border: 1px solid #cbd5e1; padding: 6px; background: #fff;"></td>`;
                      }
                      if (cell.type === "guardia" || cell.code?.toUpperCase() === "GUA") {
                        return `
                          <td style="border: 1px solid #cbd5e1; padding: 6px; background: #fee2e2; color: #991b1b; font-weight: bold;">
                            GUA<br><span style="font-size: 9px; font-weight: normal; color: #b91c1c;">Guardia</span>
                          </td>
                        `;
                      }
                      return `
                        <td style="border: 1px solid #cbd5e1; padding: 6px; background: #eff6ff; color: #1e3a8a;">
                          <strong>${cell.code || ""}</strong><br>
                          <span style="font-size: 9px; color: #2563eb;">${cell.classroom || ""}</span>
                          ${cell.group ? `<br><span style="font-size: 9px; color: #64748b;">${cell.group}</span>` : ""}
                          ${cell.sharedWith && cell.sharedWith.length > 0 ? `<br><span style="font-size: 8px; color: #7c3aed; font-weight: bold;">Desdoble (+${cell.sharedWith.join(",")})</span>` : ""}
                        </td>
                      `;
                    }).join("")}
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      `;
    } else if (activeView === "guardias_general") {
      title = "Cuadrante Maestro de Guardias de Centro (GUA)";
      bodyContent = `
        <div style="margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          <h2 style="margin: 0 0 4px 0; color: #1e293b; font-size: 18px;">Cuadrante Maestro de Guardias de Aula y Recreos</h2>
          <p style="margin: 0; color: #64748b; font-size: 12px;">Departamento de Instalación y Mantenimiento / Centro Integrado de FP</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center;">
          <thead>
            <tr style="background: #fee2e2; color: #991b1b;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; width: 15%;">FRANJA HORARIA</th>
              ${DAYS.map((d) => `<th style="border: 1px solid #cbd5e1; padding: 6px; width: 17%;">${d.fullLabel} (${d.label})</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${timeSlots
              .map((slot) => {
                return `
                  <tr style="${slot.isBreak ? "background: #fff1f2;" : ""}">
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; background: #f8fafc;">
                      ${slot.label}<br><span style="font-size: 9px; color: #64748b; font-weight: normal;">${slot.timeRange}</span>
                    </td>
                    ${DAYS.map((d) => {
                      const guards = getGuardsForSlot(d.key, slot.id);
                      if (guards.length === 0) {
                        return `<td style="border: 1px solid #cbd5e1; padding: 6px; color: #cbd5e1;">-</td>`;
                      }
                      return `
                        <td style="border: 1px solid #cbd5e1; padding: 6px; background: #fef2f2;">
                          ${guards
                            .map(
                              (g) =>
                                `<div style="font-weight: bold; color: #991b1b; margin-bottom: 2px;">${g.teacher.code} <span style="font-size: 9px; color: #dc2626;">(GUA)</span></div>`
                            )
                            .join("")}
                        </td>
                      `;
                    }).join("")}
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      `;
    }

    const fullHtml = preparePrintableHtmlDocument(bodyContent, title);
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Navigation and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-black shadow-md shadow-amber-500/20">
            <Calendar className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Gestor de Horarios, Guardias y Plantilla Docente
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                {teachers.length} Docentes (30h)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Gestión visual interactiva con arrastrar y soltar, desdobles de taller, guardias (GUA) y reducciones horarias LO 3/2022.
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView("profesores")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === "profesores"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Por Profesor
          </button>
          <button
            type="button"
            onClick={() => setActiveView("guardias_general")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === "guardias_general"
                ? "bg-red-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-red-300" />
            Cuadrante Guardias (GUA)
          </button>
          <button
            type="button"
            onClick={() => setActiveView("grupos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === "grupos"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Por Grupo / Ciclo
          </button>
          <button
            type="button"
            onClick={() => setActiveView("normativa")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === "normativa"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-300" />
            Marco Normativo
          </button>
          <button
            type="button"
            onClick={() => setActiveView("calendario_escolar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === "calendario_escolar"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-300" />
            Calendario Escolar & Planificación Anual
          </button>
        </div>

        {/* Action Controls for Horarios */}
        <div className="flex items-center gap-2">
          {activeView !== "calendario_escolar" && (
            <button
              type="button"
              onClick={handleResetToPresets}
              title="Restablecer cuadrantes oficiales Frío y Calor"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: HORARIOS POR PROFESOR */}
      {activeView === "profesores" && (
        <div className="space-y-4">
          {/* Teacher Selector & Management Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Profesor:
              </span>
              {teachers.map((t) => {
                const stats = getTeacherWorkloadDetails(t);
                const isSelected = t.id === selectedTeacherId;
                const isBalanced = stats.balanceLectivo === 0;

                return (
                  <div key={t.id} className="relative group/pill flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? "bg-slate-800 text-white border-amber-500 shadow-md ring-1 ring-amber-500/50"
                          : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                        style={{ backgroundColor: t.color || "#F59E0B" }}
                      />
                      <span>{t.code}</span>
                      <span className={`text-[10px] font-mono px-1 rounded ${
                        isBalanced ? "text-emerald-400 bg-emerald-500/10" : "text-amber-300 bg-amber-500/10"
                      }`}>
                        {stats.lectivasAsignadas}/{stats.lectivasObjetivo}h
                      </span>
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCreatingTeacher(true);
                  setEditingTeacher({
                    id: `DOC_${Date.now().toString().slice(-4)}`,
                    code: "NUEVO",
                    name: "",
                    department: "Instalación y Mantenimiento",
                    email: "",
                    color: "#3B82F6",
                    horasPermanenciaCentro: 30,
                    horasLectivasBase: 18,
                    isMayor55: false,
                    reducciones: [],
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Nuevo Docente
              </button>
            </div>

            {activeTeacher && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTeacher(false);
                    setEditingTeacher({ ...activeTeacher });
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Configurar jornada, horas de permanencia y reducciones horarias"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Editar Profesor & Reducciones
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTeacher(activeTeacher.id)}
                  title="Eliminar este docente"
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Active Teacher Workload Banner (Normativa & Balance de 30h) */}
          {activeTeacher && (() => {
            const stats = getTeacherWorkloadDetails(activeTeacher);
            return (
              <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                      style={{ backgroundColor: activeTeacher.color || "#8B5CF6" }}
                    >
                      {activeTeacher.code.substring(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        {activeTeacher.name || activeTeacher.code}
                        <span className="font-mono text-xs text-amber-400">({activeTeacher.code})</span>
                        {activeTeacher.isMayor55 && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> &gt;55 Años (-2h)
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {activeTeacher.department || "Instalación y Mantenimiento"}
                        {activeTeacher.email ? ` • ${activeTeacher.email}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <div className="px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Lectivas:</span>
                      <strong className="text-cyan-300 text-sm">
                        {stats.lectivasAsignadas} / {stats.lectivasObjetivo} h
                      </strong>
                      <span className="text-[10px] text-slate-500">({stats.lectivasBase}h base)</span>
                    </div>

                    <div className="px-3 py-1.5 bg-red-950/40 rounded-xl border border-red-900/50 flex items-center gap-2">
                      <span className="text-red-300 text-[11px]">Guardias GUA:</span>
                      <strong className="text-red-400 text-sm">{stats.totalGuardias} h</strong>
                      {stats.guardiasRecreo > 0 && (
                        <span className="text-[10px] text-rose-400">({stats.guardiasRecreo} rec)</span>
                      )}
                    </div>

                    <div className="px-3 py-1.5 bg-indigo-950/40 rounded-xl border border-indigo-900/50 flex items-center gap-2">
                      <span className="text-indigo-300 text-[11px]">Permanencia Centro:</span>
                      <strong className="text-indigo-300 text-sm">
                        {stats.permanenciaObligada} h/sem
                      </strong>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 ${
                        stats.balanceLectivo === 0
                          ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                          : stats.balanceLectivo > 0
                          ? "bg-amber-950/50 text-amber-300 border-amber-500/40"
                          : "bg-blue-950/50 text-blue-300 border-blue-500/40"
                      }`}
                    >
                      {stats.balanceLectivo === 0 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Balance Cuadrado</span>
                        </>
                      ) : stats.balanceLectivo > 0 ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Exceso: +{stats.balanceLectivo}h</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Déficit: {stats.balanceLectivo}h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Reductions Chips */}
                {stats.reduccionesActivas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                      <Award className="w-3 h-3 text-amber-400" /> Reducciones Activas:
                    </span>
                    {stats.reduccionesActivas.map((red) => (
                      <span
                        key={red.id}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1 font-mono"
                      >
                        <strong>{red.nombre}</strong> (-{red.horasLectivas}h lectivas / {red.horasComplementarias || 0}h comp)
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTeacher(false);
                        setEditingTeacher({ ...activeTeacher });
                      }}
                      className="text-[10px] text-cyan-400 hover:underline font-bold ml-1 cursor-pointer"
                    >
                      Modificar reducciones &rarr;
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Teacher Weekly Grid (Drag and Drop enabled) */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <div className="bg-slate-900/80 p-2 text-[11px] text-slate-400 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <strong>Interactivo:</strong> Arrastra y suelta cualquier celda para moverla o crear <strong>desdobles de taller</strong> en co-docencia.
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                {DAYS.length * (timeSlots.length - 1)} franjas lectivas disponibles
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                  <th className="p-2.5 w-28 font-bold border-r border-slate-800 text-center">
                    HORAS
                  </th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="p-2.5 font-bold border-r border-slate-800 text-center">
                      <div className="font-bold text-white text-sm">{d.fullLabel}</div>
                      <div className="text-[10px] text-amber-400/80 font-mono">({d.label})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {timeSlots.map((slot) => {
                  if (slot.isBreak) {
                    return (
                      <tr key={slot.id} className="bg-slate-900/80 font-semibold">
                        <td className="p-2.5 border-r border-slate-800 text-center">
                          <span className="text-amber-400 font-bold text-[11px] block">{slot.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{slot.timeRange}</span>
                        </td>
                        {DAYS.map((d) => {
                          const cell = getTeacherCell(activeTeacher.id, d.key, slot.id);
                          const isGua = cell && (cell.type === "guardia_recreo" || cell.code?.toUpperCase() === "GUA");
                          const isDropTarget = dropTargetInfo?.day === d.key && dropTargetInfo?.slotId === slot.id;

                          return (
                            <td
                              key={d.key}
                              onDragOver={(e) => handleDragOver(e, d.key, slot.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, "teacher", activeTeacher.id, d.key, slot.id)}
                              onClick={() =>
                                setEditingCell({
                                  teacherId: activeTeacher.id,
                                  day: d.key,
                                  slotId: slot.id,
                                  cellData: cell || {
                                    day: d.key,
                                    slotId: slot.id,
                                    type: "libre",
                                  },
                                })
                              }
                              className={`p-2 border-r border-slate-800 text-center cursor-pointer transition-all ${
                                isDropTarget ? "bg-amber-500/20 ring-2 ring-amber-500" : ""
                              } ${
                                isGua
                                  ? "bg-red-950/60 hover:bg-red-900/60 text-red-200 border-2 border-red-500/40"
                                  : "hover:bg-slate-800/60 text-slate-400"
                              }`}
                            >
                              {isGua ? (
                                <div className="font-bold text-red-300 flex items-center justify-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-red-400" />
                                  <span>GUA (Recreo)</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[10px] italic">Recreo</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.id} className="hover:bg-slate-900/30">
                      <td className="p-2.5 border-r border-slate-800 text-center bg-slate-900/40">
                        <span className="font-mono font-bold text-white block">{slot.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{slot.timeRange}</span>
                      </td>
                      {DAYS.map((d) => {
                        const cell = getTeacherCell(activeTeacher.id, d.key, slot.id);
                        const isGua = cell && (cell.type === "guardia" || cell.code?.toUpperCase() === "GUA");
                        const isClass = cell && cell.type === "clase";
                        const hasSplit = cell?.sharedWith && cell.sharedWith.length > 0;
                        const isDropTarget = dropTargetInfo?.day === d.key && dropTargetInfo?.slotId === slot.id;

                        return (
                          <td
                            key={d.key}
                            onDragOver={(e) => handleDragOver(e, d.key, slot.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, "teacher", activeTeacher.id, d.key, slot.id)}
                            onClick={() =>
                              setEditingCell({
                                teacherId: activeTeacher.id,
                                day: d.key,
                                slotId: slot.id,
                                cellData: cell || {
                                  day: d.key,
                                  slotId: slot.id,
                                  type: "libre",
                                },
                              })
                            }
                            className={`p-2 border-r border-slate-800 cursor-pointer transition-all min-h-[58px] relative ${
                              isDropTarget ? "bg-amber-500/20 ring-2 ring-amber-400 scale-[1.02] z-10" : ""
                            } ${
                              isGua
                                ? "bg-red-950/50 hover:bg-red-900/50 border-l-2 border-red-500 text-red-200"
                                : isClass
                                ? "bg-slate-900/90 hover:bg-slate-800/90 hover:ring-1 hover:ring-amber-400"
                                : "hover:bg-slate-900/50"
                            }`}
                          >
                            {cell && cell.type !== "libre" ? (
                              <div
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(e, "teacher", activeTeacher.id, d.key, slot.id, cell)
                                }
                                className="space-y-0.5 select-none"
                              >
                                {isGua ? (
                                  <div className="text-center py-1">
                                    <span className="text-sm font-black text-red-400 tracking-wider block flex items-center justify-center gap-1">
                                      <Shield className="w-3 h-3" /> GUA
                                    </span>
                                    <span className="text-[9px] text-red-300/80 font-semibold block">
                                      Guardia de Aula
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-amber-400 text-xs truncate">
                                        {cell.code}
                                      </span>
                                      {hasSplit && (
                                        <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold flex items-center gap-0.5 border border-purple-500/30">
                                          <Users className="w-2.5 h-2.5" /> Desdoble
                                        </span>
                                      )}
                                    </div>
                                    {cell.subject && (
                                      <div className="text-[10px] text-slate-300 line-clamp-1">
                                        {cell.subject}
                                      </div>
                                    )}
                                    {cell.classroom && (
                                      <div className="text-[9px] text-cyan-400/90 flex items-center gap-1">
                                        <Building className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{cell.classroom}</span>
                                      </div>
                                    )}
                                    {cell.sharedWith && cell.sharedWith.length > 0 && (
                                      <div className="text-[9px] text-purple-300 flex items-center gap-1 font-mono">
                                        <Users className="w-2.5 h-2.5 shrink-0" />
                                        <span>Co-docencia: {cell.sharedWith.join(", ")}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-700 hover:text-slate-500 py-2">
                                <Plus className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CUADRANTE MAESTRO DE GUARDIAS */}
      {activeView === "guardias_general" && (
        <div className="space-y-4">
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <h4 className="font-bold text-red-200 text-sm">Cuadrante Maestro de Guardias de Centro (GUA)</h4>
                <p className="text-[11px] text-red-300/80">
                  Visualización consolidada de todos los docentes de guardia en cada periodo semanal para garantizar cobertura de aulas y talleres.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono block">Total Guardias Asignadas:</span>
              <span className="text-sm font-black text-red-400 font-mono">
                {Object.values(teacherSchedules)
                  .flat()
                  .filter((c) => c.type === "guardia" || c.type === "guardia_recreo" || c.code === "GUA").length}{" "}
                horas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-red-950 bg-slate-950">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-red-950/60 text-red-200 border-b border-red-900/60">
                  <th className="p-2.5 w-28 font-bold border-r border-red-900/50 text-center">
                    FRANJA
                  </th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="p-2.5 font-bold border-r border-red-900/50 text-center">
                      <div className="font-bold text-white text-sm">{d.fullLabel}</div>
                      <div className="text-[10px] text-red-300 font-mono">({d.label})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {timeSlots.map((slot) => {
                  return (
                    <tr
                      key={slot.id}
                      className={slot.isBreak ? "bg-red-950/20 font-semibold" : "hover:bg-slate-900/40"}
                    >
                      <td className="p-2.5 border-r border-slate-800 text-center bg-slate-900/60">
                        <span className="font-bold text-white block">{slot.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{slot.timeRange}</span>
                      </td>
                      {DAYS.map((d) => {
                        const guards = getGuardsForSlot(d.key, slot.id);
                        const hasGuards = guards.length > 0;

                        return (
                          <td
                            key={d.key}
                            className={`p-2 border-r border-slate-800 min-h-[50px] ${
                              hasGuards ? "bg-red-950/40" : "bg-slate-950"
                            }`}
                          >
                            {hasGuards ? (
                              <div className="flex flex-col gap-1">
                                {guards.map(({ teacher, cell }) => (
                                  <div
                                    key={teacher.id}
                                    className="px-2 py-1 bg-red-900/60 border border-red-700/60 rounded-lg text-red-200 font-bold flex items-center justify-between gap-1 shadow-sm"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: teacher.color || "#EF4444" }}
                                      />
                                      <span className="truncate">{teacher.code}</span>
                                    </div>
                                    <span className="text-[9px] bg-red-950 text-red-300 px-1 py-0.5 rounded font-mono shrink-0">
                                      {cell.slotId === "recreo" ? "REC" : "GUA"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-slate-700 text-[10px] py-2">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Breakdown of Guards by Teacher */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              Cómputo Total de Guardias por Docente:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 text-xs">
              {teachers.map((t) => {
                const stats = getTeacherWorkloadDetails(t);
                return (
                  <div
                    key={t.id}
                    className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between"
                  >
                    <span className="font-bold text-white text-[11px] truncate flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: t.color || "#F59E0B" }}
                      />
                      {t.code}
                    </span>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Total GUA:</span>
                      <strong className="text-red-400 font-mono">{stats.totalGuardias} h</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HORARIOS POR GRUPO / CICLO */}
      {activeView === "grupos" && (
        <div className="space-y-4">
          {/* Group Navigation Bar & Catalog Actions */}
          <div className="space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">
                  Filtrar Cursos:
                </span>
                {[
                  { id: "todos", label: "Todos los Grupos" },
                  { id: "1", label: "1º Curso (Primeros)" },
                  { id: "2", label: "2º Curso (Segundos)" },
                  { id: "gs_otros", label: "GS / Especialización" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setGroupFilterCategory(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      groupFilterCategory === f.id
                        ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncAllGroupsFromTeachers}
                  title="Sincroniza todos los grupos con las clases que cada profesor tiene asignadas en su horario"
                  className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sincronizar Todos con Docentes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddGroupCatalogModal(true)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Grupo / Ciclo</span>
                </button>
              </div>
            </div>

            {/* Groups Tab Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {groupSchedules
                .filter((g) => {
                  if (groupFilterCategory === "1") return g.shortName.startsWith("1º");
                  if (groupFilterCategory === "2") return g.shortName.startsWith("2º");
                  if (groupFilterCategory === "gs_otros") return g.shortName.includes("GS") || g.shortName.includes("CE") || g.shortName.includes("Básico");
                  return true;
                })
                .map((g) => {
                  const hoursCount = g.cells.filter((c) => c.type === "clase" && c.slotId !== "recreo").length;
                  const is1stYear = g.shortName.startsWith("1º");
                  const is2ndYear = g.shortName.startsWith("2º");

                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                        g.id === selectedGroupId
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-300"
                          : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black ${
                          is1stYear
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : is2ndYear
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {is1stYear ? "1º" : is2ndYear ? "2º" : "FP"}
                      </span>
                      <span>{g.shortName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                          g.id === selectedGroupId ? "bg-indigo-800 text-indigo-200" : "bg-slate-900 text-slate-400"
                        }`}
                      >
                        {hoursCount}h
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Active Group Info Banner & Schedule Grid */}
          {activeGroup && (
            <div className="space-y-3">
              {/* Group Header Card */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        activeGroup.shortName.startsWith("1º")
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : activeGroup.shortName.startsWith("2º")
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {activeGroup.shortName.startsWith("1º")
                        ? "1º Curso"
                        : activeGroup.shortName.startsWith("2º")
                        ? "2º Curso"
                        : "Ciclo Formativo"}
                    </span>
                    <h3 className="text-base font-black text-white">{activeGroup.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono text-amber-400 font-bold">Código: {activeGroup.shortName}</span>
                    <span>•</span>
                    <span>
                      Total Asignado:{" "}
                      <strong className="text-white font-mono">
                        {activeGroup.cells.filter((c) => c.type === "clase" && c.slotId !== "recreo").length} horas / semana
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Teachers in this group */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 px-1">Docentes:</span>
                    {Array.from(new Set(activeGroup.cells.map((c) => c.teacherId).filter(Boolean))).map((tId) => {
                      const teacher = teachers.find((t) => t.id === tId);
                      if (!teacher) return null;
                      const teacherHours = activeGroup.cells.filter((c) => c.teacherId === tId && c.type === "clase").length;
                      return (
                        <div
                          key={tId}
                          title={`${teacher.name} (${teacherHours}h impartidas en este grupo)`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: teacher.color || "#8B5CF6" }}
                          />
                          <span>{teacher.code}</span>
                          <span className="text-slate-500 font-mono text-[9px]">{teacherHours}h</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions for this specific group */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSyncGroupFromTeachers(activeGroup.id)}
                      title="Sincronizar horario de este grupo desde los horarios de profesores"
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Sincronizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingGroupModal({
                          group: {
                            id: activeGroup.id,
                            name: activeGroup.name,
                            shortName: activeGroup.shortName,
                            cells: activeGroup.cells,
                          },
                          isNew: false,
                        })
                      }
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                      title="Editar datos del grupo"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(activeGroup.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 rounded-xl border border-slate-700 hover:border-red-800/60 transition-colors cursor-pointer"
                      title="Eliminar este grupo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-800">
                      <th className="p-2.5 w-28 font-bold border-r border-slate-800 text-center">
                        HORAS
                      </th>
                      {DAYS.map((d) => (
                        <th key={d.key} className="p-2.5 font-bold border-r border-slate-800 text-center">
                          <div className="font-bold text-white text-sm">{d.fullLabel}</div>
                          <div className="text-[10px] text-amber-400/80 font-mono">({d.label})</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {timeSlots.map((slot) => {
                      if (slot.isBreak) {
                        return (
                          <tr key={slot.id} className="bg-slate-900/80 font-semibold">
                            <td className="p-2.5 border-r border-slate-800 text-center">
                              <span className="text-amber-400 font-bold text-[11px] block">{slot.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{slot.timeRange}</span>
                            </td>
                            {DAYS.map((d) => (
                              <td key={d.key} className="p-2 border-r border-slate-800 text-center text-slate-500 text-[10px] italic">
                                RECREO
                              </td>
                            ))}
                          </tr>
                        );
                      }

                      return (
                        <tr key={slot.id} className="hover:bg-slate-900/30">
                          <td className="p-2.5 border-r border-slate-800 text-center bg-slate-900/40">
                            <span className="font-mono font-bold text-white block">{slot.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{slot.timeRange}</span>
                          </td>
                          {DAYS.map((d) => {
                            const cell = getGroupCell(activeGroup.id, d.key, slot.id);
                            const teacher = cell?.teacherId ? teachers.find((t) => t.id === cell.teacherId) : undefined;
                            const isDropTarget = dropTargetInfo?.day === d.key && dropTargetInfo?.slotId === slot.id;

                            return (
                              <td
                                key={d.key}
                                onDragOver={(e) => handleDragOver(e, d.key, slot.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, "group", activeGroup.id, d.key, slot.id)}
                                onClick={() =>
                                  setEditingCell({
                                    groupId: activeGroup.id,
                                    day: d.key,
                                    slotId: slot.id,
                                    cellData: cell || {
                                      day: d.key,
                                      slotId: slot.id,
                                      type: "libre",
                                    },
                                  })
                                }
                                className={`p-2 border-r border-slate-800 cursor-pointer transition-all hover:bg-slate-900/80 hover:ring-1 hover:ring-indigo-400 min-h-[55px] ${
                                  isDropTarget ? "bg-indigo-500/20 ring-2 ring-indigo-400" : ""
                                }`}
                              >
                                {cell && cell.type !== "libre" ? (
                                  <div
                                    draggable
                                    onDragStart={(e) =>
                                      handleDragStart(e, "group", activeGroup.id, d.key, slot.id, cell)
                                    }
                                    className="space-y-0.5 select-none"
                                  >
                                    <div className="font-bold text-amber-400 text-xs truncate">
                                      {cell.code}
                                    </div>
                                    {cell.classroom && (
                                      <div className="text-[9px] text-cyan-400/90 truncate">
                                        {cell.classroom}
                                      </div>
                                    )}
                                    {teacher && (
                                      <div className="text-[9px] font-bold text-indigo-300 truncate flex items-center gap-1">
                                        <span
                                          className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                                          style={{ backgroundColor: teacher.color || "#8B5CF6" }}
                                        />
                                        {teacher.name}
                                      </div>
                                    )}
                                    {cell.sharedWith && cell.sharedWith.length > 0 && (
                                      <div className="text-[8px] text-purple-300 font-bold truncate flex items-center gap-0.5">
                                        <Users className="w-2.5 h-2.5 text-purple-400" />
                                        <span>+ {cell.sharedWith.join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-slate-700 hover:text-slate-500 py-2">
                                    <Plus className="w-3.5 h-3.5 opacity-30 hover:opacity-100" />
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: MARCO NORMATIVO ACTUALIZADO Y BUSCADOR DE VIGENCIA EN ANDALUCÍA */}
      {activeView === "normativa" && (
        <div className="space-y-4 text-xs">
          {/* Header Card */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-white text-base">
                      Marco Normativo de FP, Jornada Docente y Guardias
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Vigente en Andalucía
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Buscador y verificador legal de disposiciones de la Junta de Andalucía (BOJA) y estatales (BOE) aplicadas en el gestor.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Actualizar & Comprobar Vigencia + Añadir */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyNormativaAndalucia}
                  disabled={isVerifyingAndalucia}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                    isVerifyingAndalucia
                      ? "bg-emerald-700 text-white animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 border border-emerald-400/40"
                  }`}
                  title="Comprobar que todas las normas y reducciones están activas y vigentes en el marco normativo de Andalucía"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isVerifyingAndalucia ? "animate-spin text-white" : "text-emerald-100"}`}
                  />
                  <span>
                    {isVerifyingAndalucia
                      ? "Comprobando BOJA y BOE..."
                      : "Actualizar y Comprobar Vigencia en Andalucía"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditingNormativaModal({
                      item: {
                        category: "andalucia_autonomica",
                        officialScope: "Andalucía (BOJA)",
                        isVigenteAndalucia: true,
                        keyPoints: [""],
                      },
                      isNew: true,
                    })
                  }
                  className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-500/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Normativa / Circular</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetNormativaDefaults}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
                  title="Restablecer a las disposiciones oficiales por defecto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
              </div>
            </div>

            {/* Verification Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Última comprobación:</strong>{" "}
                  <span className="text-emerald-300 font-mono">{lastVerificationTimestamp}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>
                  Total normas: <strong className="text-white">{normativaList.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Andalucía (BOJA):{" "}
                  <strong className="text-cyan-300">
                    {normativaList.filter((n) => n.officialScope.includes("Andalucía") || n.officialScope.includes("Consejería")).length}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Básica Estatal (BOE):{" "}
                  <strong className="text-amber-300">
                    {normativaList.filter((n) => n.officialScope.includes("Estatal") || n.officialScope.includes("BOE")).length}
                  </strong>
                </span>
              </div>
            </div>

            {/* Verification Feedback Banner if triggered */}
            {verificationFeedback && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white">{verificationFeedback.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-emerald-300/90 font-mono">
                    <span>✓ {verificationFeedback.stats.total} disposiciones validadas</span>
                    <span>✓ {verificationFeedback.stats.bojas} referencias BOJA activas</span>
                    <span>✓ {verificationFeedback.stats.boes} normas básicas BOE</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Category Filter Toolbar */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={normativaSearchQuery}
                    onChange={(e) => setNormativaSearchQuery(e.target.value)}
                    placeholder="Buscar por código (ej. Decreto 102/2023, LO 3/2022, 20/06/1997), término (30h, 18h, >55 años, desdoble, guardia, BOJA)..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
                  />
                  {normativaSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setNormativaSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Counter Badge */}
                <div className="flex items-center gap-2 shrink-0 self-center sm:self-auto text-slate-400 text-xs">
                  <span>
                    Mostrando{" "}
                    <strong className="text-white">
                      {
                        normativaList.filter((norm) => {
                          if (normativaCategoryFilter !== "all" && norm.category !== normativaCategoryFilter) return false;
                          if (normativaSearchQuery.trim()) {
                            const q = normativaSearchQuery.toLowerCase().trim();
                            const inCode = norm.code.toLowerCase().includes(q);
                            const inTitle = norm.title.toLowerCase().includes(q);
                            const inSummary = norm.summary.toLowerCase().includes(q);
                            const inPub = norm.publicationRef.toLowerCase().includes(q);
                            const inScope = norm.officialScope.toLowerCase().includes(q);
                            const inArticles = (norm.legalArticles || "").toLowerCase().includes(q);
                            const inKeyPoints = norm.keyPoints.some((kp) => kp.toLowerCase().includes(q));
                            return inCode || inTitle || inSummary || inPub || inScope || inArticles || inKeyPoints;
                          }
                          return true;
                        }).length
                      }
                    </strong>{" "}
                    de {normativaList.length} normas
                  </span>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" />
                  Filtrar:
                </span>
                {[
                  { id: "all", label: "Todas las Normas" },
                  { id: "andalucia_autonomica", label: "Andalucía (BOJA / ROC)" },
                  { id: "jornada_horarios", label: "Jornada 30h y 18h Lectivas" },
                  { id: "reducciones_edad", label: "Reducciones y >55 Años" },
                  { id: "fp_dual_desdobles", label: "FP Dual, Co-docencia y Desdobles" },
                  { id: "estatal", label: "Estatal Básica (BOE)" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNormativaCategoryFilter(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      normativaCategoryFilter === cat.id
                        ? "bg-cyan-600/30 text-cyan-300 border-cyan-500/50 shadow-sm"
                        : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Normative Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {normativaList
              .filter((norm) => {
                if (normativaCategoryFilter !== "all" && norm.category !== normativaCategoryFilter) return false;
                if (normativaSearchQuery.trim()) {
                  const q = normativaSearchQuery.toLowerCase().trim();
                  const inCode = norm.code.toLowerCase().includes(q);
                  const inTitle = norm.title.toLowerCase().includes(q);
                  const inSummary = norm.summary.toLowerCase().includes(q);
                  const inPub = norm.publicationRef.toLowerCase().includes(q);
                  const inScope = norm.officialScope.toLowerCase().includes(q);
                  const inArticles = (norm.legalArticles || "").toLowerCase().includes(q);
                  const inKeyPoints = norm.keyPoints.some((kp) => kp.toLowerCase().includes(q));
                  return inCode || inTitle || inSummary || inPub || inScope || inArticles || inKeyPoints;
                }
                return true;
              })
              .map((norm) => {
                const isExpanded = !!expandedNormativaIds[norm.id];
                const isAndalucia = norm.officialScope.includes("Andalucía") || norm.officialScope.includes("Consejería");

                return (
                  <div
                    key={norm.id}
                    className={`p-4 bg-slate-950 rounded-2xl border transition-all space-y-3 flex flex-col justify-between shadow-md ${
                      isAndalucia ? "border-slate-800 hover:border-cyan-500/40" : "border-slate-800 hover:border-amber-500/40"
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Card Header: Code, Scope, Status */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${
                              isAndalucia
                                ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/60"
                                : "bg-amber-950/80 text-amber-300 border-amber-700/60"
                            }`}
                          >
                            {norm.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            {norm.officialScope}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Vigente en Andalucía
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-white text-xs leading-snug">{norm.title}</h4>

                      {/* Official Reference / BOJA */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{norm.publicationRef}</span>
                      </div>

                      {/* Summary */}
                      <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        {norm.summary}
                      </p>

                      {/* Key Points */}
                      <div className="space-y-1.5 pt-1">
                        <span className="font-bold text-slate-300 text-[11px] block">Puntos Clave y Repercusión Horaria:</span>
                        <ul className="space-y-1 text-slate-400 text-[11px]">
                          {norm.keyPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Applicability in SIGRE */}
                      <div className="p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-[11px] text-indigo-200 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Aplicación directa en SIGRE:</strong> {norm.applicabilityNotes}
                        </div>
                      </div>

                      {/* Collapsible Legal Articles & References */}
                      {isExpanded && norm.legalArticles && (
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1 animate-in fade-in">
                          <strong className="text-amber-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            Artículos y Fundamentación Jurídica:
                          </strong>
                          <p className="text-slate-300">{norm.legalArticles}</p>
                          {norm.sourceUrl && (
                            <a
                              href={norm.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 text-[10px] inline-flex items-center gap-1 pt-1 font-mono hover:underline"
                            >
                              <span>Consultar publicación oficial (BOJA/BOE)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-500 font-mono">
                        Comprobado: {norm.lastCheckedDate || "2026-08-26"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {norm.legalArticles && (
                          <button
                            type="button"
                            onClick={() => toggleExpandNormativa(norm.id)}
                            className="px-2 py-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 cursor-pointer font-bold"
                          >
                            {isExpanded ? "Ocultar artículos" : "Ver artículos"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingNormativaModal({ item: { ...norm }, isNew: false })}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 cursor-pointer font-bold flex items-center gap-1"
                          title="Editar detalles de la norma"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        {norm.id.startsWith("norm_custom_") && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNormativaItem(norm.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 cursor-pointer"
                            title="Eliminar norma personalizada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty Search State */}
          {normativaList.filter((norm) => {
            if (normativaCategoryFilter !== "all" && norm.category !== normativaCategoryFilter) return false;
            if (normativaSearchQuery.trim()) {
              const q = normativaSearchQuery.toLowerCase().trim();
              const inCode = norm.code.toLowerCase().includes(q);
              const inTitle = norm.title.toLowerCase().includes(q);
              const inSummary = norm.summary.toLowerCase().includes(q);
              const inPub = norm.publicationRef.toLowerCase().includes(q);
              const inScope = norm.officialScope.toLowerCase().includes(q);
              const inArticles = (norm.legalArticles || "").toLowerCase().includes(q);
              const inKeyPoints = norm.keyPoints.some((kp) => kp.toLowerCase().includes(q));
              return inCode || inTitle || inSummary || inPub || inScope || inArticles || inKeyPoints;
            }
            return true;
          }).length === 0 && (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
              <Scale className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">No se encontraron disposiciones normativas</h4>
                <p className="text-slate-400 text-xs">
                  No hay normas que coincidan con el término de búsqueda &quot;{normativaSearchQuery}&quot; o la categoría seleccionada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNormativaSearchQuery("");
                  setNormativaCategoryFilter("all");
                }}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros y Búsqueda</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: CALENDARIO ESCOLAR & PLANIFICADOR ANUAL DE UDS */}
      {activeView === "calendario_escolar" && (
        <SigreAcademicCalendarManager
          currentUds={currentUds}
          moduloCodigo={currentModuloCodigo || "TEMINS 0037"}
          moduloNombre={moduloNombre || "Técnicas de montaje de instalaciones térmicas"}
          cicloFormativo={cicloFormativo || "1º CFGM Instalaciones Frigoríficas y de Climatización"}
          docenteNombre={docenteNombre || activeTeacher?.name}
          onCalendarChange={(cal) => {
            onUpdateScheduleConfig({
              ...config,
              activeCalendarId: cal.id,
              academicCalendars: [cal],
            });
          }}
        />
      )}

      {/* MODAL: EDITAR / AÑADIR NORMATIVA O CIRCULAR */}
      {editingNormativaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {editingNormativaModal.isNew
                      ? "Registrar Nueva Normativa, Instrucción o Circular"
                      : `Editar Referencia Normativa: ${editingNormativaModal.item.code}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configuración de texto legal, ámbito oficial (BOJA/BOE), puntos clave y repercusión en horarios de FP.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNormativaModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Código / Abreviatura:</label>
                  <input
                    type="text"
                    value={editingNormativaModal.item.code || ""}
                    onChange={(e) =>
                      setEditingNormativaModal({
                        ...editingNormativaModal,
                        item: { ...editingNormativaModal.item, code: e.target.value },
                      })
                    }
                    placeholder="ej. Instrucciones 2026/27"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-300 block mb-1">Título Oficial de la Norma:</label>
                  <input
                    type="text"
                    value={editingNormativaModal.item.title || ""}
                    onChange={(e) =>
                      setEditingNormativaModal({
                        ...editingNormativaModal,
                        item: { ...editingNormativaModal.item, title: e.target.value },
                      })
                    }
                    placeholder="ej. Instrucciones de la Viceconsejería sobre organización de centros de FP..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ámbito Oficial:</label>
                  <select
                    value={editingNormativaModal.item.officialScope || "Andalucía (BOJA)"}
                    onChange={(e) =>
                      setEditingNormativaModal({
                        ...editingNormativaModal,
                        item: { ...editingNormativaModal.item, officialScope: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Andalucía (BOJA)">Andalucía (BOJA)</option>
                    <option value="Consejería de Desarrollo Educativo">Consejería de Desarrollo Educativo (Andalucía)</option>
                    <option value="Estatal (BOE)">Estatal (BOE)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Categoría Temática:</label>
                  <select
                    value={editingNormativaModal.item.category || "andalucia_autonomica"}
                    onChange={(e) =>
                      setEditingNormativaModal({
                        ...editingNormativaModal,
                        item: { ...editingNormativaModal.item, category: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="andalucia_autonomica">Andalucía Autonómica (BOJA / ROC)</option>
                    <option value="jornada_horarios">Jornada 30h y 18h Lectivas</option>
                    <option value="reducciones_edad">Reducciones Horarias y &gt;55 Años</option>
                    <option value="fp_dual_desdobles">FP Dual, Co-docencia y Desdobles</option>
                    <option value="estatal">Estatal Básica (BOE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Referencia de Publicación Oficial:</label>
                <input
                  type="text"
                  value={editingNormativaModal.item.publicationRef || ""}
                  onChange={(e) =>
                    setEditingNormativaModal({
                      ...editingNormativaModal,
                      item: { ...editingNormativaModal.item, publicationRef: e.target.value },
                    })
                  }
                  placeholder="ej. BOJA núm. 90, de 15/05/2023 o Resolución de 25 de junio de 2026"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Resumen y Alcance Jurídico:</label>
                <textarea
                  rows={2}
                  value={editingNormativaModal.item.summary || ""}
                  onChange={(e) =>
                    setEditingNormativaModal({
                      ...editingNormativaModal,
                      item: { ...editingNormativaModal.item, summary: e.target.value },
                    })
                  }
                  placeholder="Describe brevemente el objeto y alcance de la disposición..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Puntos Clave y Criterios Horarios (uno por línea):
                </label>
                <textarea
                  rows={3}
                  value={(editingNormativaModal.item.keyPoints || []).join("\n")}
                  onChange={(e) =>
                    setEditingNormativaModal({
                      ...editingNormativaModal,
                      item: {
                        ...editingNormativaModal.item,
                        keyPoints: e.target.value.split("\n").filter((p) => p.trim().length > 0),
                      },
                    })
                  }
                  placeholder="Criterio 1: 18h lectivas ordinarias&#10;Criterio 2: Desdobles en taller de frío y calor..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Repercusión en SIGRE:</label>
                  <input
                    type="text"
                    value={editingNormativaModal.item.applicabilityNotes || ""}
                    onChange={(e) =>
                      setEditingNormativaModal({
                        ...editingNormativaModal,
                        item: { ...editingNormativaModal.item, applicabilityNotes: e.target.value },
                      })
                    }
                    placeholder="ej. Ajuste de horas lectivas en la configuración docente"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Artículos Específicos:</label>
                  <input
                    type="text"
                    value={editingNormativaModal.item.legalArticles || ""}
                    onChange={(e) =>
                      setEditingNormativaModal({
                        ...editingNormativaModal,
                        item: { ...editingNormativaModal.item, legalArticles: e.target.value },
                      })
                    }
                    placeholder="ej. Artículos 14 (Desdobles) y 18 (Dual)"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Enlace / URL Oficial (Opcional):</label>
                <input
                  type="url"
                  value={editingNormativaModal.item.sourceUrl || ""}
                  onChange={(e) =>
                    setEditingNormativaModal({
                      ...editingNormativaModal,
                      item: { ...editingNormativaModal.item, sourceUrl: e.target.value },
                    })
                  }
                  placeholder="https://www.juntadeandalucia.es/eboja..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setEditingNormativaModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSaveNormativaItem(editingNormativaModal.item, editingNormativaModal.isNew)
                }
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingNormativaModal.isNew ? "Guardar Nueva Norma" : "Guardar Cambios"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER WORKLOAD & REDUCTIONS MODAL (EDIT / CREATE) */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                  style={{ backgroundColor: editingTeacher.color || "#8B5CF6" }}
                >
                  {editingTeacher.code.substring(0, 3)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isCreatingTeacher ? "Alta de Nuevo Profesor/a" : `Configuración Laboral: ${editingTeacher.name || editingTeacher.code}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Jornada de permanencia (30h), horas lectivas y reducciones normativas (LO 3/2022 y &gt;55 años).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTeacher(null);
                  setIsCreatingTeacher(false);
                }}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Código / Acrónimo:</label>
                  <input
                    type="text"
                    value={editingTeacher.code}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, code: e.target.value })}
                    placeholder="ej. EVM-Mont"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-300 block mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={editingTeacher.name}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                    placeholder="ej. Montserrat Elena García"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Departamento:</label>
                  <input
                    type="text"
                    value={editingTeacher.department || ""}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, department: e.target.value })}
                    placeholder="ej. Instalación y Mantenimiento"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={editingTeacher.email || ""}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    placeholder="ej. m.elena@fp.centro.es"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Color Identificativo:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTeacher.color || "#8B5CF6"}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, color: e.target.value })}
                      className="w-9 h-8 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                    />
                    <span className="font-mono text-slate-400 text-[11px]">{editingTeacher.color}</span>
                  </div>
                </div>
              </div>

              {/* Working Hours & Normative Parameters */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4" /> Parámetros de Jornada Docente
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Horas de Permanencia en el Centro (h/semana):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="20"
                        max="37.5"
                        step="0.5"
                        value={editingTeacher.horasPermanenciaCentro || 30}
                        onChange={(e) =>
                          setEditingTeacher({
                            ...editingTeacher,
                            horasPermanenciaCentro: parseFloat(e.target.value) || 30,
                          })
                        }
                        className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px]">
                        Por defecto <strong>30h</strong> (25h regulares + 5h)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Horas Lectivas Base de Referencia (h/semana):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="12"
                        max="25"
                        value={editingTeacher.horasLectivasBase || 18}
                        onChange={(e) =>
                          setEditingTeacher({
                            ...editingTeacher,
                            horasLectivasBase: parseInt(e.target.value) || 18,
                          })
                        }
                        className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px]">
                        Por defecto <strong>18h</strong> (LOMLOE / Ley 4/2019)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switch for >55 years reduction */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <HeartPulse className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-xs">
                        Profesor/a Mayor de 55 Años (&gt;55 Años)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Aplica automáticamente reducción de <strong>2 horas lectivas</strong> (de 18h a 16h) según Acuerdo Marco.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!editingTeacher.isMayor55}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      let updatedReductions = [...(editingTeacher.reducciones || [])];
                      if (isChecked) {
                        if (!updatedReductions.some((r) => r.tipo === "mayor_55")) {
                          updatedReductions.push({
                            id: "red_55",
                            tipo: "mayor_55",
                            nombre: "Reducción Profesorado >55 años",
                            horasLectivas: 2,
                            horasComplementarias: 2,
                            normativaRef: "Acuerdo Marco Docente >55 años",
                            activo: true,
                          });
                        } else {
                          updatedReductions = updatedReductions.map((r) =>
                            r.tipo === "mayor_55" ? { ...r, activo: true } : r
                          );
                        }
                      } else {
                        updatedReductions = updatedReductions.map((r) =>
                          r.tipo === "mayor_55" ? { ...r, activo: false } : r
                        );
                      }
                      setEditingTeacher({
                        ...editingTeacher,
                        isMayor55: isChecked,
                        reducciones: updatedReductions,
                      });
                    }}
                    className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-950 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Reductions and Roles Section (Fully Editable, Addable, Suppressible) */}
              <div className="space-y-3 p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                      <Award className="w-4 h-4 text-amber-400" /> Reducciones Horarias & Cargos de Coordinación
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Entradas editables: modifica horas, añade casuísticas anuales (ej. tamaño del departamento) o suprime cargos.
                    </p>
                  </div>

                  {/* Actions to Add Reduction */}
                  <div className="flex items-center gap-1.5">
                    {/* Add from Preset Catalog Dropdown */}
                    <select
                      onChange={(e) => {
                        const selectedType = e.target.value;
                        if (!selectedType) return;
                        const preset = PRESET_REDUCTIONS.find((p) => p.tipo === selectedType);
                        if (preset) {
                          const newRed: SigreTeacherReduction = {
                            id: `red_${preset.tipo}_${Date.now()}`,
                            tipo: preset.tipo,
                            nombre: preset.nombre,
                            horasLectivas: preset.horasLectivas,
                            horasComplementarias: preset.horasComplementarias,
                            normativaRef: preset.normativaRef,
                            activo: true,
                          };
                          const currentReductions = editingTeacher.reducciones || [];
                          setEditingTeacher({
                            ...editingTeacher,
                            isMayor55: preset.tipo === "mayor_55" ? true : editingTeacher.isMayor55,
                            reducciones: [...currentReductions, newRed],
                          });
                        }
                        e.target.value = "";
                      }}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-lg text-slate-300 text-[11px] font-bold focus:outline-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        + Añadir desde Catálogo FP...
                      </option>
                      {PRESET_REDUCTIONS.map((p) => (
                        <option key={p.tipo} value={p.tipo}>
                          {p.nombre} (-{p.horasLectivas}h lect)
                        </option>
                      ))}
                    </select>

                    {/* Add Custom Reduction */}
                    <button
                      type="button"
                      onClick={() => {
                        const newCustom: SigreTeacherReduction = {
                          id: `red_custom_${Date.now()}`,
                          tipo: "personalizada",
                          nombre: "Nueva Reducción / Cargo Anual",
                          horasLectivas: 2,
                          horasComplementarias: 2,
                          normativaRef: "Acuerdo de Centro / Instrucciones Anuales",
                          activo: true,
                        };
                        setEditingTeacher({
                          ...editingTeacher,
                          reducciones: [...(editingTeacher.reducciones || []), newCustom],
                        });
                      }}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Personalizada
                    </button>
                  </div>
                </div>

                {/* List of Configured Reductions */}
                {(!editingTeacher.reducciones || editingTeacher.reducciones.length === 0) ? (
                  <div className="p-4 bg-slate-900/60 border border-dashed border-slate-800 rounded-xl text-center space-y-1.5">
                    <p className="text-slate-400 text-xs">
                      Este docente no tiene reducciones horarias ni cargos de coordinación asignados.
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Utiliza el menú superior para añadir Jefatura de Departamento, Coordinación FFEoE/Dual, ATECA, PRL o una entrada personalizada.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {editingTeacher.reducciones.map((red, index) => {
                      const isJefatura = red.tipo === "jefatura_dpto" || red.nombre.toLowerCase().includes("jefatura");

                      return (
                        <div
                          key={red.id || `red_${index}`}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            red.activo
                              ? "bg-slate-900/90 border-amber-500/40 ring-1 ring-amber-500/10"
                              : "bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100"
                          }`}
                        >
                          {/* Row 1: Active switch, Name & Delete button */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="checkbox"
                                checked={red.activo}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = { ...updated[index], activo: checked };
                                  setEditingTeacher({
                                    ...editingTeacher,
                                    isMayor55: red.tipo === "mayor_55" ? checked : editingTeacher.isMayor55,
                                    reducciones: updated,
                                  });
                                }}
                                className="w-4 h-4 text-amber-500 rounded border-slate-700 bg-slate-950 focus:ring-amber-500 cursor-pointer"
                                title="Activar/Desactivar reducción"
                              />

                              <input
                                type="text"
                                value={red.nombre}
                                onChange={(e) => {
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = { ...updated[index], nombre: e.target.value };
                                  setEditingTeacher({
                                    ...editingTeacher,
                                    reducciones: updated,
                                  });
                                }}
                                placeholder="Nombre del Cargo / Reducción"
                                className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-xs focus:border-amber-500 focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = (editingTeacher.reducciones || []).filter((_, i) => i !== index);
                                setEditingTeacher({
                                  ...editingTeacher,
                                  isMayor55: red.tipo === "mayor_55" ? false : editingTeacher.isMayor55,
                                  reducciones: updated,
                                });
                              }}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                              title="Suprimir esta reducción"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Row 2: Hours and Normative Reference */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <label className="text-slate-400 font-semibold block mb-0.5">
                                Reducción Lectiva (h/sem):
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="18"
                                  step="0.5"
                                  value={red.horasLectivas}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...(editingTeacher.reducciones || [])];
                                    updated[index] = { ...updated[index], horasLectivas: val };
                                    setEditingTeacher({
                                      ...editingTeacher,
                                      reducciones: updated,
                                    });
                                  }}
                                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-amber-300 font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-amber-400/80 font-mono">
                                  -{red.horasLectivas}h lectivas
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="text-slate-400 font-semibold block mb-0.5">
                                Horas Complementarias:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="18"
                                  step="0.5"
                                  value={red.horasComplementarias ?? 2}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...(editingTeacher.reducciones || [])];
                                    updated[index] = { ...updated[index], horasComplementarias: val };
                                    setEditingTeacher({
                                      ...editingTeacher,
                                      reducciones: updated,
                                    });
                                  }}
                                  className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-indigo-300 font-mono font-bold text-xs focus:border-amber-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-indigo-300/80 font-mono">
                                  +{red.horasComplementarias ?? 2}h comp
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="text-slate-400 font-semibold block mb-0.5">
                                Referencia / Normativa / Casuística:
                              </label>
                              <input
                                type="text"
                                value={red.normativaRef || ""}
                                onChange={(e) => {
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = { ...updated[index], normativaRef: e.target.value };
                                  setEditingTeacher({
                                    ...editingTeacher,
                                    reducciones: updated,
                                  });
                                }}
                                placeholder="ej. ROC FP / Dpto 4-7 profesores"
                                className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-cyan-300 text-[10px] font-mono focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Quick Helper for Jefatura de Departamento FP (Casuística según nº profesores) */}
                          {isJefatura && (
                            <div className="pt-1 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-400 font-bold flex items-center gap-1">
                                <Users className="w-3 h-3 text-amber-400" /> Ajuste por Plantilla Dpto FP:
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = {
                                    ...updated[index],
                                    horasLectivas: 2,
                                    horasComplementarias: 3,
                                    normativaRef: "ROC FP (Dpto 1 a 3 docentes) - 2h lectivas",
                                  };
                                  setEditingTeacher({ ...editingTeacher, reducciones: updated });
                                }}
                                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  red.horasLectivas === 2
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                1-3 profes: 2h
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = {
                                    ...updated[index],
                                    horasLectivas: 3,
                                    horasComplementarias: 3,
                                    normativaRef: "ROC FP (Dpto 4 a 7 docentes) - 3h lectivas",
                                  };
                                  setEditingTeacher({ ...editingTeacher, reducciones: updated });
                                }}
                                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  red.horasLectivas === 3
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                4-7 profes: 3h
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = {
                                    ...updated[index],
                                    horasLectivas: 4,
                                    horasComplementarias: 4,
                                    normativaRef: "ROC FP (Dpto 8+ docentes) - 4h lectivas",
                                  };
                                  setEditingTeacher({ ...editingTeacher, reducciones: updated });
                                }}
                                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  red.horasLectivas === 4
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                8+ profes: 4h
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(editingTeacher.reducciones || [])];
                                  updated[index] = {
                                    ...updated[index],
                                    horasLectivas: 5,
                                    horasComplementarias: 5,
                                    normativaRef: "CIFP / Gran Familia Profesional - 5h lectivas",
                                  };
                                  setEditingTeacher({ ...editingTeacher, reducciones: updated });
                                }}
                                className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  red.horasLectivas === 5
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                                }`}
                              >
                                CIFP (&gt;12 profes): 5h
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Live Balance Preview */}
              {(() => {
                const previewStats = getTeacherWorkloadDetails(editingTeacher);
                return (
                  <div className="p-3 bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/30 rounded-xl space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-white font-bold">
                      <span className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-400" /> Cómputo Resultante:
                      </span>
                      <span className="text-cyan-300">
                        {previewStats.lectivasBase}h base - {previewStats.totalReduccionLectiva}h reducciones = <strong>{previewStats.lectivasObjetivo}h lectivas a impartir</strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Permanencia semanal en centro:</span>
                      <strong className="text-white">{previewStats.permanenciaObligada} horas</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setEditingTeacher(null);
                  setIsCreatingTeacher(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveTeacher(editingTeacher)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAG AND DROP CONFLICT RESOLUTION MODAL */}
      {dragConflictModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  Franja Horaria Ocupada
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ya existe una sesión programada en {DAYS.find((d) => d.key === dragConflictModal.target.targetDay)?.fullLabel},{" "}
                  {timeSlots.find((s) => s.id === dragConflictModal.target.targetSlotId)?.label}.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sesión a Mover:</span>
                  <strong className="text-amber-400 font-mono">
                    {dragConflictModal.source.cellData.code || "Sesión"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sesión Existente:</span>
                  <strong className="text-cyan-400 font-mono">
                    {dragConflictModal.target.existingCellData.code || "Sesión"}
                  </strong>
                </div>
              </div>

              <p className="text-slate-300 font-semibold pt-1">
                ¿Cómo deseas proceder?
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleResolveConflict("swap")}
                  className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-bold text-white text-xs">Intercambiar (Swap)</div>
                      <div className="text-[10px] text-slate-400">Permuta las 2 sesiones entre sí</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveConflict("merge_split")}
                  className="w-full p-2.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/60 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-bold text-purple-200 text-xs">Crear Desdoble / Co-docencia</div>
                      <div className="text-[10px] text-purple-300/80">
                        Compartir franja con ambos profesores (prácticas de taller / clases numerosas)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveConflict("overwrite")}
                  className="w-full p-2.5 bg-red-950/30 hover:bg-red-900/30 border border-red-800/40 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="font-bold text-red-300 text-xs">Sobrescribir / Reemplazar</div>
                      <div className="text-[10px] text-red-400/80">Elimina la sesión previa y coloca la nueva</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDragConflictModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CELL MODAL */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Editar Celda ({DAYS.find((d) => d.key === editingCell.day)?.fullLabel},{" "}
                {timeSlots.find((s) => s.id === editingCell.slotId)?.label})
              </h3>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Type selector */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tipo de Actividad:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "clase", label: "Clase Lectiva", color: "border-amber-500 text-amber-300" },
                    { id: "guardia", label: "Guardia (GUA)", color: "border-red-500 text-red-300" },
                    { id: "guardia_recreo", label: "GUA Recreo", color: "border-rose-500 text-rose-300" },
                    { id: "tutoria", label: "Tutoría", color: "border-blue-500 text-blue-300" },
                    { id: "reunion_dpto", label: "Reunión Dpto", color: "border-purple-500 text-purple-300" },
                    { id: "libre", label: "Libre / Vacía", color: "border-slate-500 text-slate-400" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setEditingCell({
                          ...editingCell,
                          cellData: {
                            ...editingCell.cellData,
                            type: t.id as SigreScheduleSlotType,
                            code:
                              t.id === "guardia" || t.id === "guardia_recreo"
                                ? "GUA"
                                : editingCell.cellData.code === "GUA"
                                ? ""
                                : editingCell.cellData.code,
                          },
                        })
                      }
                      className={`p-2 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                        editingCell.cellData.type === t.id
                          ? `bg-slate-800 ${t.color} ring-1`
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {editingCell.cellData.type !== "libre" && (
                <>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">
                      Código / Acrónimo (ej. CALOR 0302, GUA, SOLAR 0392):
                    </label>
                    <input
                      type="text"
                      value={editingCell.cellData.code || ""}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          cellData: { ...editingCell.cellData, code: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="ej. CALOR 0302"
                    />
                  </div>

                  {editingCell.cellData.type === "clase" && (
                    <>
                      <div>
                        <label className="font-bold text-slate-300 block mb-1">
                          Nombre Asignatura / Módulo:
                        </label>
                        <input
                          type="text"
                          value={editingCell.cellData.subject || ""}
                          onChange={(e) =>
                            setEditingCell({
                              ...editingCell,
                              cellData: { ...editingCell.cellData, subject: e.target.value },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                          placeholder="ej. Instalaciones de Producción de Calor"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-slate-300 block mb-1">Aula / Taller:</label>
                          <input
                            type="text"
                            value={editingCell.cellData.classroom || ""}
                            onChange={(e) =>
                              setEditingCell({
                                ...editingCell,
                                cellData: { ...editingCell.cellData, classroom: e.target.value },
                              })
                            }
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                            placeholder="ej. Aula 2º Calor / Nave 2º"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-300 block mb-1">Grupo:</label>
                          <input
                            type="text"
                            value={editingCell.cellData.group || ""}
                            onChange={(e) =>
                              setEditingCell({
                                ...editingCell,
                                cellData: { ...editingCell.cellData, group: e.target.value },
                              })
                            }
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                            placeholder="ej. 2º Calor"
                          />
                        </div>
                      </div>

                      {/* Desdoble / Co-docencia con otros profesores */}
                      <div>
                        <label className="font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          Desdoble de Taller / Co-docencia (Profesores Compartidos):
                        </label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                          {teachers
                            .filter((t) => t.id !== editingCell.teacherId)
                            .map((otherT) => {
                              const isSelected = (editingCell.cellData.sharedWith || []).includes(otherT.id);
                              return (
                                <button
                                  key={otherT.id}
                                  type="button"
                                  onClick={() => {
                                    const currentShared = editingCell.cellData.sharedWith || [];
                                    const nextShared = isSelected
                                      ? currentShared.filter((id) => id !== otherT.id)
                                      : [...currentShared, otherT.id];
                                    setEditingCell({
                                      ...editingCell,
                                      cellData: {
                                        ...editingCell.cellData,
                                        sharedWith: nextShared,
                                      },
                                    });
                                  }}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                                    isSelected
                                      ? "bg-purple-900/60 text-purple-200 border-purple-500"
                                      : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: otherT.color || "#8B5CF6" }}
                                  />
                                  <span>{otherT.code}</span>
                                  {isSelected && <Check className="w-3 h-3 text-purple-300" />}
                                </button>
                              );
                            })}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Ideal para talleres con clases numerosas conforme a la LO 3/2022 y RD 659/2023.
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={handleDeleteCell}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCell}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ADD GROUP FROM CATALOG MODAL */}
      {showAddGroupCatalogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Catálogo de Ciclos y Grupos Formativos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGroupCatalogModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-xs">
              Selecciona un grupo o curso del catálogo para añadirlo al centro y habilitar su cuadrícula de horarios:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {PRESET_FP_GROUPS_CATALOG.map((preset) => {
                const isAlreadyAdded = groupSchedules.some((g) => g.id === preset.id);

                return (
                  <div
                    key={preset.id}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isAlreadyAdded
                        ? "bg-slate-950/60 border-slate-800 opacity-70"
                        : "bg-slate-950 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        handleQuickAddPresetGroup(preset);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          preset.course === "1º"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : preset.course === "2º"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {preset.course} Curso
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {preset.shortName}
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs line-clamp-2">
                      {preset.name}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1">
                      {preset.description}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                      <span className="text-cyan-400/90 font-mono truncate max-w-[180px]">
                        {preset.defaultClassroom}
                      </span>
                      {isAlreadyAdded ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Añadido
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddPresetGroup(preset);
                          }}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[10px] cursor-pointer"
                        >
                          + Añadir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom group option */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowAddGroupCatalogModal(false);
                  setEditingGroupModal({
                    group: {
                      id: `grupo_custom_${Date.now().toString().slice(-4)}`,
                      name: "",
                      shortName: "",
                      cells: [],
                    },
                    isNew: true,
                  });
                }}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear un Grupo o Ciclo Personalizado</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddGroupCatalogModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / CREATE GROUP MODAL */}
      {editingGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  {editingGroupModal.isNew ? "Crear Nuevo Grupo / Ciclo" : "Editar Grupo / Ciclo"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroupModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Nombre Completo del Ciclo / Grupo:
                </label>
                <input
                  type="text"
                  value={editingGroupModal.group.name || ""}
                  onChange={(e) =>
                    setEditingGroupModal({
                      ...editingGroupModal,
                      group: { ...editingGroupModal.group, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="ej. 1º CFGM Técnico en Instalaciones Frigoríficas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Código Corto / Acrónimo:
                  </label>
                  <input
                    type="text"
                    value={editingGroupModal.group.shortName || ""}
                    onChange={(e) =>
                      setEditingGroupModal({
                        ...editingGroupModal,
                        group: { ...editingGroupModal.group, shortName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="ej. 1º Frío"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Identificador Único (ID):
                  </label>
                  <input
                    type="text"
                    disabled={!editingGroupModal.isNew}
                    value={editingGroupModal.group.id || ""}
                    onChange={(e) =>
                      setEditingGroupModal({
                        ...editingGroupModal,
                        group: { ...editingGroupModal.group, id: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none disabled:opacity-50"
                    placeholder="ej. cfgm_frio_1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setEditingGroupModal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveGroup(editingGroupModal.group as any, editingGroupModal.isNew)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
