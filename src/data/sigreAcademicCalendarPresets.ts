import { SigreAcademicCalendar, SigreCalendarLegendItem } from "../types/sigre";

// Default Legend for Andalucia 2026-2027 based on official Resolution & TEMINS module
export const DEFAULT_LEGEND_ITEMS_2026_2027: SigreCalendarLegendItem[] = [
  // Inicio de curso e hitos institucionales (Lado Izquierdo)
  {
    id: "leg_ini_inf",
    code: "3 Sep",
    title: "Inicio Primer Ciclo Educación Infantil",
    type: "hito",
    color: "#ff00ff", // Magenta / Fucsia
    textColor: "#ffffff",
    sidePosition: "left",
    monthTarget: 9,
  },
  {
    id: "leg_ini_prim",
    code: "10 Sep",
    title: "Inicio 2º Ciclo Ed. Infantil y Primaria (178 días)",
    type: "hito",
    color: "#ff00ff", // Magenta / Fucsia
    textColor: "#ffffff",
    sidePosition: "left",
    monthTarget: 9,
  },
  {
    id: "leg_ini_fp",
    code: "15 Sep",
    title: "Inicio Régimen Ordinario ESO / Bach / Formación Profesional",
    type: "hito",
    color: "#ff00ff", // Magenta / Fucsia
    textColor: "#ffffff",
    sidePosition: "left",
    monthTarget: 9,
  },
  {
    id: "leg_eval_inicial",
    code: "22 Sep",
    title: "Evaluación Inicial / Claustro Pedagógico",
    type: "evaluacion",
    color: "#99cc33", // Verde pistacho / lima
    textColor: "#000000",
    sidePosition: "left",
    monthTarget: 9,
  },

  // Unidades Didácticas / Resultados de Aprendizaje (RAs) del Módulo
  {
    id: "leg_ud_01",
    code: "TEMINS. RA08",
    title: "TEMINS. RA08 (Prevención de Riesgos Laborales y Protección Ambiental)",
    type: "ud_ra",
    color: "#fcd5b4", // Melocotón Crema Cálido
    textColor: "#431407",
    dayRangeText: "16-30 Sep",
    monthTarget: 9,
    udId: "UD01",
  },
  {
    id: "leg_ud_02",
    code: "TEMINS. RA01",
    title: "TEMINS. RA01 (Procesos de mecanizado y unión en instalaciones)",
    type: "ud_ra",
    color: "#e2d5e8", // Lavanda / Malva suave
    textColor: "#3b0764",
    dayRangeText: "01-31 Oct",
    monthTarget: 10,
    udId: "UD02",
  },
  {
    id: "leg_ud_03",
    code: "TEMINS. RA02",
    title: "TEMINS. RA02 (Interpretación de planos y trazado de tuberías)",
    type: "ud_ra",
    color: "#f5deb3", // Marrón Canela / Crema Tostado
    textColor: "#7c2d12",
    dayRangeText: "03-20 Nov",
    monthTarget: 11,
    udId: "UD03",
  },
  {
    id: "leg_ud_04",
    code: "TEMINS. RA03",
    title: "TEMINS. RA03 (Técnicas anticorrosión y aislamiento térmico)",
    type: "ud_ra",
    color: "#fff2b2", // Amarillo Pastel / Crema Dorada
    textColor: "#713f12",
    dayRangeText: "21 Nov - 18 Dic",
    monthTarget: 12,
    udId: "UD04",
  },
  {
    id: "leg_ud_05",
    code: "TEMINS. RA04",
    title: "TEMINS. RA04 (Montaje de equipos y accesorios en instalaciones térmicas)",
    type: "ud_ra",
    color: "#ffc482", // Naranja Melocotón Salmón
    textColor: "#7c2d12",
    dayRangeText: "07-30 Ene",
    monthTarget: 1,
    udId: "UD05",
  },
  {
    id: "leg_dual_1",
    code: "DUAL 120h",
    title: "Periodo de Formación en Empresa / FP Dual (01/02 - 19/02 - 120h)",
    type: "dual",
    color: "#fff2b2", // Amarillo Dual / Empresa
    textColor: "#713f12",
    dayRangeText: "01-19 Feb",
    monthTarget: 2,
  },
  {
    id: "leg_ud_06",
    code: "TEMINS. RA05",
    title: "TEMINS. RA05 (Montaje de redes de fluidos y bombas de circulación)",
    type: "ud_ra",
    color: "#99e6ff", // Azul Cielo / Cyan Pastel
    textColor: "#0c4a6e",
    dayRangeText: "01-19 Mar",
    monthTarget: 3,
    udId: "UD06",
  },
  {
    id: "leg_ud_07",
    code: "TEMINS. RA06",
    title: "TEMINS. RA06 (Puesta en servicio y pruebas de estanqueidad)",
    type: "ud_ra",
    color: "#b2e6b2", // Verde Menta Pastel
    textColor: "#14532d",
    dayRangeText: "05-23 Abr",
    monthTarget: 4,
    udId: "UD07",
  },
  {
    id: "leg_ud_08",
    code: "TEMINS. RA07",
    title: "TEMINS. RA07 (Mantenimiento preventivo e higienización)",
    type: "ud_ra",
    color: "#80deea", // Turquesa / Aguamarina Claro
    textColor: "#134e4a",
    dayRangeText: "26 Abr - 21 May",
    monthTarget: 5,
    udId: "UD08",
  },

  // Sesiones de Evaluación (Hitos Oficiales en Azul Eléctrico)
  {
    id: "leg_eval_1",
    code: "16 Dic",
    title: "Sesión de Evaluación 1º Trimestre",
    type: "evaluacion",
    color: "#0080ff", // Azul eléctrico vivo
    textColor: "#ffffff",
    sidePosition: "right",
    monthTarget: 12,
  },
  {
    id: "leg_eval_2",
    code: "17 Mar",
    title: "Sesión de Evaluación 2º Trimestre",
    type: "evaluacion",
    color: "#0080ff",
    textColor: "#ffffff",
    sidePosition: "right",
    monthTarget: 3,
  },
  {
    id: "leg_eval_3",
    code: "27 May",
    title: "Sesión de Evaluación 3º Trimestre (1ª Final 2º Curso)",
    type: "evaluacion",
    color: "#0080ff",
    textColor: "#ffffff",
    sidePosition: "right",
    monthTarget: 5,
  },
  {
    id: "leg_eval_final",
    code: "23 Jun",
    title: "Sesión de Evaluación Segunda Final / Ordinaria 1º Curso",
    type: "evaluacion",
    color: "#0080ff",
    textColor: "#ffffff",
    sidePosition: "right",
    monthTarget: 6,
  },

  // Periodo de Recuperación
  {
    id: "leg_recup",
    code: "Recuperación",
    title: "Periodo de recuperación de aprendizajes no adquiridos",
    type: "recuperacion",
    color: "#f8cb9c", // Melocotón tostado
    textColor: "#7c2d12",
    sidePosition: "right",
    monthTarget: 6,
  },
  {
    id: "leg_fin_lectivo",
    code: "24 Jun",
    title: "Fin de días lectivos en Formación Profesional (24 de junio)",
    type: "hito",
    color: "#ff00ff", // Magenta / Fucsia
    textColor: "#ffffff",
    sidePosition: "right",
    monthTarget: 6,
  },

  // Días Festivos y Vacaciones Oficiales Junta de Andalucía
  {
    id: "leg_fest_12oct",
    code: "12 Oct",
    title: "Fiesta Nacional de España (12 de octubre)",
    type: "festivo",
    color: "#ff0000", // Rojo vivo
    textColor: "#ffffff",
    monthTarget: 10,
  },
  {
    id: "leg_fest_2nov",
    code: "2 Nov",
    title: "Festividad de Todos los Santos (por domingo 1 de noviembre)",
    type: "festivo",
    color: "#ff0000",
    textColor: "#ffffff",
    monthTarget: 11,
  },
  {
    id: "leg_fest_7dic",
    code: "7 Dic",
    title: "Día de la Constitución Española (por domingo 6 de diciembre)",
    type: "festivo",
    color: "#ff0000",
    textColor: "#ffffff",
    monthTarget: 12,
  },
  {
    id: "leg_fest_8dic",
    code: "8 Dic",
    title: "Inmaculada Concepción (8 de diciembre)",
    type: "festivo",
    color: "#ff0000",
    textColor: "#ffffff",
    monthTarget: 12,
  },
  {
    id: "leg_vac_navidad",
    code: "23 Dic - 6 Ene",
    title: "Vacaciones de Navidad (23 de diciembre a 6 de enero)",
    type: "vacaciones",
    color: "#00ffff", // Cyan brillante
    textColor: "#000000",
    monthTarget: 12,
  },
  {
    id: "leg_sem_blanca",
    code: "22-25 Feb",
    title: "Semana Blanca (22 a 25 de febrero de 2027)",
    type: "vacaciones",
    color: "#80cbc4", // Aguamarina / Verde pastel
    textColor: "#000000",
    monthTarget: 2,
  },
  {
    id: "leg_dia_comunidad",
    code: "26 Feb",
    title: "Día de la Comunidad Educativa (26 de febrero de 2027)",
    type: "festivo",
    color: "#ffc000", // Amarillo oro
    textColor: "#000000",
    monthTarget: 2,
  },
  {
    id: "leg_dia_andalucia",
    code: "1 Mar",
    title: "Día de Andalucía (por domingo 28 de febrero)",
    type: "festivo",
    color: "#99cc33", // Verde pistacho / Andalucía
    textColor: "#000000",
    monthTarget: 3,
  },
  {
    id: "leg_vac_semana_santa",
    code: "22-28 Mar",
    title: "Semana Santa (22 a 28 de marzo de 2027 - Jueves 25 y Viernes 26)",
    type: "vacaciones",
    color: "#ff99ff", // Rosa pastel / Violeta
    textColor: "#000000",
    monthTarget: 3,
  },
  {
    id: "leg_fest_1may",
    code: "1 May",
    title: "Fiesta del Trabajo (1 de mayo)",
    type: "festivo",
    color: "#ff0000",
    textColor: "#ffffff",
    monthTarget: 5,
  },
];

// Academic Calendar 2026-2027 (Official Junta de Andalucía - Resolución de 20 de mayo de 2026)
export const PRESET_CALENDAR_2026_2027: SigreAcademicCalendar = {
  id: "cal_2026_2027_malaga_andalucia",
  academicYear: "2026-2027",
  region: "Andalucía",
  province: "Málaga",
  resolutionRef:
    "Resolución de 20 de mayo de 2026 de la Delegación Territorial de la Consejería de Desarrollo Educativo y FP en Málaga",
  resolutionUrl: "https://www.juntadeandalucia.es/educacion/portales/w/260522_del_calendescolar",
  educationalStage: "Formación Profesional (Grado Básico, Medio, Superior y Cursos de Especialización)",
  startDate: "2026-09-15",
  endDate: "2027-06-24",
  moduloFormativo: "Técnicas de Montaje de Instalaciones Térmicas (TEMINS 0037)",
  codigoModulo: "TEMINS 0037",
  cicloFormativo: "1º CFGM Técnico en Instalaciones Frigoríficas y de Climatización",
  docente: "Montserrat Elena (EVM)",
  totalLectivosEstimated: 175,
  legendItems: DEFAULT_LEGEND_ITEMS_2026_2027,
  dayOverrides: {
    // Septiembre 2026
    "2026-09-03": { date: "2026-09-03", type: "inicio_fin_curso", legendItemId: "leg_ini_inf", customColor: "#ff00ff", customTextColor: "#fff", title: "Inicio Infantil" },
    "2026-09-10": { date: "2026-09-10", type: "inicio_fin_curso", legendItemId: "leg_ini_prim", customColor: "#ff00ff", customTextColor: "#fff", title: "Inicio Primaria" },
    "2026-09-15": { date: "2026-09-15", type: "inicio_fin_curso", legendItemId: "leg_ini_fp", customColor: "#ff00ff", customTextColor: "#fff", title: "Inicio FP" },
    "2026-09-22": { date: "2026-09-22", type: "evaluacion_inicial", legendItemId: "leg_eval_inicial", customColor: "#99cc33", customTextColor: "#000", title: "Evaluación Inicial" },
    // UD 01 (16 a 30 de sept)
    "2026-09-16": { date: "2026-09-16", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-17": { date: "2026-09-17", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-18": { date: "2026-09-18", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-21": { date: "2026-09-21", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-23": { date: "2026-09-23", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-24": { date: "2026-09-24", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-25": { date: "2026-09-25", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-28": { date: "2026-09-28", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-29": { date: "2026-09-29", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-30": { date: "2026-09-30", type: "lectivo", legendItemId: "leg_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },

    // Octubre 2026
    "2026-10-12": { date: "2026-10-12", type: "festivo_nacional", legendItemId: "leg_fest_12oct", customColor: "#ff0000", customTextColor: "#fff", title: "Fiesta Nacional de España" },

    // Noviembre 2026
    "2026-11-02": { date: "2026-11-02", type: "festivo_autonomico", legendItemId: "leg_fest_2nov", customColor: "#ff0000", customTextColor: "#fff", title: "Todos los Santos (por dom 1)" },

    // Diciembre 2026
    "2026-12-07": { date: "2026-12-07", type: "festivo_nacional", legendItemId: "leg_fest_7dic", customColor: "#ff0000", customTextColor: "#fff", title: "Constitución Española" },
    "2026-12-08": { date: "2026-12-08", type: "festivo_nacional", legendItemId: "leg_fest_8dic", customColor: "#ff0000", customTextColor: "#fff", title: "Inmaculada Concepción" },
    "2026-12-16": { date: "2026-12-16", type: "evaluacion_trimestral", legendItemId: "leg_eval_1", customColor: "#0080ff", customTextColor: "#fff", title: "Sesión Evaluación 1º Trimestre" },
    "2026-12-23": { date: "2026-12-23", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2026-12-24": { date: "2026-12-24", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2026-12-25": { date: "2026-12-25", type: "festivo_nacional", legendItemId: "leg_vac_navidad", customColor: "#ff0000", customTextColor: "#fff", title: "Navidad" },
    "2026-12-28": { date: "2026-12-28", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2026-12-29": { date: "2026-12-29", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2026-12-30": { date: "2026-12-30", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2026-12-31": { date: "2026-12-31", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },

    // Enero 2027
    "2027-01-01": { date: "2027-01-01", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff", title: "Año Nuevo" },
    "2027-01-04": { date: "2027-01-04", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2027-01-05": { date: "2027-01-05", type: "vacaciones_navidad", legendItemId: "leg_vac_navidad", customColor: "#00ffff", customTextColor: "#000" },
    "2027-01-06": { date: "2027-01-06", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff", title: "Epifanía del Señor (Reyes)" },

    // Febrero 2027 (Semana Blanca y Día de la Comunidad Educativa)
    "2027-02-22": { date: "2027-02-22", type: "semana_blanca", legendItemId: "leg_sem_blanca", customColor: "#80cbc4", customTextColor: "#000" },
    "2027-02-23": { date: "2027-02-23", type: "semana_blanca", legendItemId: "leg_sem_blanca", customColor: "#80cbc4", customTextColor: "#000" },
    "2027-02-24": { date: "2027-02-24", type: "semana_blanca", legendItemId: "leg_sem_blanca", customColor: "#80cbc4", customTextColor: "#000" },
    "2027-02-25": { date: "2027-02-25", type: "semana_blanca", legendItemId: "leg_sem_blanca", customColor: "#80cbc4", customTextColor: "#000" },
    "2027-02-26": { date: "2027-02-26", type: "dia_comunidad_educativa", legendItemId: "leg_dia_comunidad", customColor: "#ffc000", customTextColor: "#000", title: "Día de la Comunidad Educativa" },

    // Marzo 2027 (Día de Andalucía y Semana Santa)
    "2027-03-01": { date: "2027-03-01", type: "festivo_autonomico", legendItemId: "leg_dia_andalucia", customColor: "#99cc33", customTextColor: "#000", title: "Día de Andalucía (por 28 feb)" },
    "2027-03-17": { date: "2027-03-17", type: "evaluacion_trimestral", legendItemId: "leg_eval_2", customColor: "#0080ff", customTextColor: "#fff", title: "Sesión Evaluación 2º Trimestre" },
    "2027-03-22": { date: "2027-03-22", type: "vacaciones_semana_santa", legendItemId: "leg_vac_semana_santa", customColor: "#ff99ff", customTextColor: "#000" },
    "2027-03-23": { date: "2027-03-23", type: "vacaciones_semana_santa", legendItemId: "leg_vac_semana_santa", customColor: "#ff99ff", customTextColor: "#000" },
    "2027-03-24": { date: "2027-03-24", type: "vacaciones_semana_santa", legendItemId: "leg_vac_semana_santa", customColor: "#ff99ff", customTextColor: "#000" },
    "2027-03-25": { date: "2027-03-25", type: "festivo_autonomico", legendItemId: "leg_vac_semana_santa", customColor: "#00b050", customTextColor: "#fff", title: "Jueves Santo" },
    "2027-03-26": { date: "2027-03-26", type: "festivo_nacional", legendItemId: "leg_vac_semana_santa", customColor: "#ff0000", customTextColor: "#fff", title: "Viernes Santo" },
    "2027-03-29": { date: "2027-03-29", type: "festivo_local", customColor: "#ff0000", customTextColor: "#fff", title: "Fiesta Local 1 (Res. Málaga)" },

    // Mayo 2027
    "2027-05-01": { date: "2027-05-01", type: "festivo_nacional", legendItemId: "leg_fest_1may", customColor: "#ff0000", customTextColor: "#fff", title: "Fiesta del Trabajo" },
    "2027-05-03": { date: "2027-05-03", type: "festivo_local", customColor: "#ff0000", customTextColor: "#fff", title: "Fiesta Local 2 (Res. Málaga)" },
    "2027-05-24": { date: "2027-05-24", type: "inicio_fin_curso", customColor: "#ff00ff", customTextColor: "#fff", title: "Último día lectivo 2º Bachillerato" },
    "2027-05-27": { date: "2027-05-27", type: "evaluacion_final", legendItemId: "leg_eval_3", customColor: "#0080ff", customTextColor: "#fff", title: "1ª Sesión Evaluación Final (2º FP)" },

    // Junio 2027
    "2027-06-23": { date: "2027-06-23", type: "evaluacion_final", legendItemId: "leg_eval_final", customColor: "#0080ff", customTextColor: "#fff", title: "2ª Sesión Evaluación Final FP" },
    "2027-06-24": { date: "2027-06-24", type: "inicio_fin_curso", legendItemId: "leg_fin_lectivo", customColor: "#ff00ff", customTextColor: "#fff", title: "Último día lectivo FP y resto de enseñanzas" },
  },
  specialEvents: [
    { date: "2026-09-15", title: "Inicio de clases FP", type: "inicio_fin_curso" },
    { date: "2026-10-12", title: "Fiesta Nacional de España", type: "festivo_nacional" },
    { date: "2026-11-02", title: "Todos los Santos", type: "festivo_autonomico" },
    { date: "2026-12-07", title: "Día de la Constitución", type: "festivo_nacional" },
    { date: "2026-12-08", title: "Inmaculada Concepción", type: "festivo_nacional" },
    { date: "2026-12-16", title: "Evaluación 1º Trimestre", type: "evaluacion_trimestral" },
    { date: "2026-12-23", title: "Inicio Vacaciones Navidad", type: "vacaciones_navidad" },
    { date: "2027-01-07", title: "Reanudación clases", type: "lectivo" },
    { date: "2027-02-22", title: "Inicio Semana Blanca", type: "semana_blanca" },
    { date: "2027-02-26", title: "Día de la Comunidad Educativa", type: "dia_comunidad_educativa" },
    { date: "2027-03-01", title: "Día de Andalucía", type: "festivo_autonomico" },
    { date: "2027-03-17", title: "Evaluación 2º Trimestre", type: "evaluacion_trimestral" },
    { date: "2027-03-22", title: "Inicio Semana Santa", type: "vacaciones_semana_santa" },
    { date: "2027-05-01", title: "Fiesta del Trabajo", type: "festivo_nacional" },
    { date: "2027-06-24", title: "Fin de curso FP", type: "inicio_fin_curso" },
  ],
  notes:
    "Calendario escolar oficial conforme a la Resolución de 20 de mayo de 2026 de la Delegación Territorial de Desarrollo Educativo y Formación Profesional en Málaga.",
};

// Preset Calendar 2025-2026 (From User Reference Image)
export const PRESET_CALENDAR_2025_2026: SigreAcademicCalendar = {
  id: "cal_2025_2026_andalucia_temins",
  academicYear: "2025-2026",
  region: "Andalucía",
  province: "Málaga / Andalucía",
  resolutionRef: "Resolución Calendario Escolar Andalucía Curso 2025/2026 (BOJA)",
  educationalStage: "Formación Profesional (CFGM / CFGS / Grado D)",
  startDate: "2025-09-15",
  endDate: "2026-06-23",
  moduloFormativo: "Técnicas de montaje de instalaciones térmicas (TEMINS)",
  codigoModulo: "TEMINS 0037",
  cicloFormativo: "1º CFGM Instalaciones Frigoríficas y de Climatización",
  docente: "Profesorado Especialidad Instalaciones Térmicas y Fluidos",
  totalLectivosEstimated: 175,
  legendItems: [
    { id: "leg25_ini_3", code: "3", title: "Enseñanzas Deportivas y 1º ciclo Ed. Inf.", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "leg25_ini_10", code: "10", title: "2º ciclo Ed. Inf., Prim., E.E.", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "leg25_ini_15", code: "15", title: "E.S.O., Bach., F.P.", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "leg25_ini_20", code: "20", title: "Evaluación inicial", type: "evaluacion", color: "#99cc33", textColor: "#000", sidePosition: "left", monthTarget: 9 },
    { id: "leg25_ra08", code: "TEMINS. RA08", title: "TEMINS. RA08 (PRL y PA)", type: "ud_ra", color: "#fcd5b4", textColor: "#431407", monthTarget: 9 },
    { id: "leg25_ra01", code: "TEMINS. RA01", title: "TEMINS. RA01 (Proc. de mecanizado)", type: "ud_ra", color: "#e2d5e8", textColor: "#3b0764", monthTarget: 10 },
    { id: "leg25_ra02", code: "TEMINS. RA02", title: "TEMINS. RA02. Dibujo", type: "ud_ra", color: "#f5deb3", textColor: "#7c2d12", monthTarget: 11 },
    { id: "leg25_ra03", code: "TEMINS. RA03", title: "TEMINS. RA03. Corrosión", type: "ud_ra", color: "#fff2b2", textColor: "#713f12", monthTarget: 12 },
    { id: "leg25_ra04", code: "TEMINS. RA04", title: "TEMINS. RA04 (Montaje de equipos)", type: "ud_ra", color: "#ffc482", textColor: "#7c2d12", monthTarget: 1 },
    { id: "leg25_dual", code: "DUAL", title: "Formación Dual (02/02 - 20/02 - 120h)", type: "dual", color: "#fff2b2", textColor: "#713f12", monthTarget: 2 },
    { id: "leg25_ra05", code: "TEMINS. RA05", title: "TEMINS. RA05 (Bombas y fluidos)", type: "ud_ra", color: "#99e6ff", textColor: "#0c4a6e", monthTarget: 3 },
    { id: "leg25_ra06", code: "TEMINS. RA06", title: "TEMINS. RA06 (Pruebas estanqueidad)", type: "ud_ra", color: "#b2e6b2", textColor: "#14532d", monthTarget: 4 },
    { id: "leg25_ra07", code: "TEMINS. RA07", title: "TEMINS. RA07 (Mantenimiento)", type: "ud_ra", color: "#80deea", textColor: "#134e4a", monthTarget: 5 },
    { id: "leg25_ev1", code: "17", title: "Sesión de evaluación 1º trimestre", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 12 },
    { id: "leg25_ev2", code: "18", title: "Sesion de evaluación 2 trimestre", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 3 },
    { id: "leg25_ev3", code: "28", title: "Sesión de evaluación 3º trim. (1ª, final)", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 5 },
    { id: "leg25_evfin2", code: "25", title: "Sesión de evaluación segunda final", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
    { id: "leg25_recup", code: "Recup", title: "Periodo de recup. aprend. No adquiridos", type: "recuperacion", color: "#f8cb9c", textColor: "#7c2d12", sidePosition: "right", monthTarget: 6 },
    { id: "leg25_fin23", code: "23", title: "Último día lectivo en el resto de enseñanzas", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
  ],
  dayOverrides: {
    // 2025
    "2025-09-03": { date: "2025-09-03", type: "inicio_fin_curso", customColor: "#ff00ff", customTextColor: "#fff" },
    "2025-09-10": { date: "2025-09-10", type: "inicio_fin_curso", customColor: "#ff00ff", customTextColor: "#fff" },
    "2025-09-15": { date: "2025-09-15", type: "inicio_fin_curso", customColor: "#ff00ff", customTextColor: "#fff" },
    "2025-09-20": { date: "2025-09-20", type: "evaluacion_inicial", customColor: "#99cc33", customTextColor: "#000" },
    "2025-10-12": { date: "2025-10-12", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2025-10-13": { date: "2025-10-13", type: "festivo_autonomico", customColor: "#ff0000", customTextColor: "#fff" },
    "2025-11-01": { date: "2025-11-01", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2025-12-06": { date: "2025-12-06", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2025-12-08": { date: "2025-12-08", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2025-12-17": { date: "2025-12-17", type: "evaluacion_trimestral", customColor: "#0080ff", customTextColor: "#fff" },
    "2025-12-25": { date: "2025-12-25", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    // 2026
    "2026-01-01": { date: "2026-01-01", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2026-01-06": { date: "2026-01-06", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2026-02-27": { date: "2026-02-27", type: "dia_comunidad_educativa", customColor: "#ffc000", customTextColor: "#000" },
    "2026-02-28": { date: "2026-02-28", type: "festivo_autonomico", customColor: "#99cc33", customTextColor: "#000" },
    "2026-03-18": { date: "2026-03-18", type: "evaluacion_trimestral", customColor: "#0080ff", customTextColor: "#fff" },
    "2026-04-02": { date: "2026-04-02", type: "festivo_autonomico", customColor: "#00b050", customTextColor: "#fff" },
    "2026-04-03": { date: "2026-04-03", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2026-05-01": { date: "2026-05-01", type: "festivo_nacional", customColor: "#ff0000", customTextColor: "#fff" },
    "2026-05-28": { date: "2026-05-28", type: "evaluacion_final", customColor: "#0080ff", customTextColor: "#fff" },
    "2026-06-23": { date: "2026-06-23", type: "inicio_fin_curso", customColor: "#ff00ff", customTextColor: "#fff" },
    "2026-06-25": { date: "2026-06-25", type: "evaluacion_final", customColor: "#0080ff", customTextColor: "#fff" },
  },
  specialEvents: [],
};

// Preset Calendar 2026-2027: IST 0038 (2º CFGM)
export const PRESET_CALENDAR_2026_2027_IST: SigreAcademicCalendar = {
  id: "cal_2026_2027_ist_0038",
  academicYear: "2026-2027",
  region: "Andalucía",
  province: "Málaga",
  resolutionRef:
    "Resolución de 20 de mayo de 2026 de la Delegación Territorial de Desarrollo Educativo y FP en Málaga",
  resolutionUrl: "https://www.juntadeandalucia.es/educacion/portales/w/260522_del_calendescolar",
  educationalStage: "Formación Profesional Grado Medio (2º Curso)",
  startDate: "2026-09-15",
  endDate: "2027-06-24",
  moduloFormativo: "Instalaciones Solares Térmicas (IST 0038)",
  codigoModulo: "IST 0038",
  cicloFormativo: "2º CFGM Técnico en Instalaciones Frigoríficas y de Climatización",
  docente: "Montserrat Elena (EVM)",
  totalLectivosEstimated: 175,
  legendItems: [
    { id: "ist_ini_fp", code: "15 Sep", title: "Inicio Régimen Ordinario 2º CFGM", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "ist_eval_ini", code: "22 Sep", title: "Evaluación Inicial 2º Curso", type: "evaluacion", color: "#99cc33", textColor: "#000", sidePosition: "left", monthTarget: 9 },
    { id: "ist_ud_01", code: "IST. RA01", title: "IST. RA01 (Radiación solar y captadores térmicos)", type: "ud_ra", color: "#fcd5b4", textColor: "#431407", monthTarget: 9, udId: "UD01" },
    { id: "ist_ud_02", code: "IST. RA02", title: "IST. RA02 (Circuitos primario y secundario de fluidos)", type: "ud_ra", color: "#e2d5e8", textColor: "#3b0764", monthTarget: 10, udId: "UD02" },
    { id: "ist_ud_03", code: "IST. RA03", title: "IST. RA03 (Sistemas de acumulación, purgado y seguridad)", type: "ud_ra", color: "#f5deb3", textColor: "#7c2d12", monthTarget: 11, udId: "UD03" },
    { id: "ist_ud_04", code: "IST. RA04", title: "IST. RA04 (Regulación electrónica y control solar)", type: "ud_ra", color: "#fff2b2", textColor: "#713f12", monthTarget: 12, udId: "UD04" },
    { id: "ist_dual", code: "DUAL 2º FP", title: "Periodo Formación en Empresa / FP Dual 2º (160h)", type: "dual", color: "#fef08a", textColor: "#854d0e", monthTarget: 2 },
    { id: "ist_ud_05", code: "IST. RA05", title: "IST. RA05 (Montaje e interconexión de campos solares)", type: "ud_ra", color: "#99e6ff", textColor: "#0c4a6e", monthTarget: 3, udId: "UD05" },
    { id: "ist_ud_06", code: "IST. RA06", title: "IST. RA06 (Puesta en marcha, mantenimiento e higienización)", type: "ud_ra", color: "#b2e6b2", textColor: "#14532d", monthTarget: 4, udId: "UD06" },
    { id: "ist_ev1", code: "16 Dic", title: "Sesión de Evaluación 1º Trimestre", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 12 },
    { id: "ist_ev2", code: "17 Mar", title: "Sesión de Evaluación 2º Trimestre", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 3 },
    { id: "ist_ev3", code: "27 May", title: "1ª Sesión Evaluación Final (2º Curso Ordinaria)", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 5 },
    { id: "ist_recup", code: "Recuperación", title: "Periodo de Recuperación aprendizajes no adquiridos", type: "recuperacion", color: "#f8cb9c", textColor: "#7c2d12", sidePosition: "right", monthTarget: 6 },
    { id: "ist_evfin", code: "23 Jun", title: "2ª Sesión Evaluación Final Extraordinaria", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
    { id: "ist_fin", code: "24 Jun", title: "Fin lectivo oficial FP", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
  ],
  dayOverrides: {
    ...PRESET_CALENDAR_2026_2027.dayOverrides,
    // Custom UD assignment for IST
    "2026-09-16": { date: "2026-09-16", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-17": { date: "2026-09-17", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-18": { date: "2026-09-18", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-21": { date: "2026-09-21", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-23": { date: "2026-09-23", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-24": { date: "2026-09-24", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-25": { date: "2026-09-25", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-28": { date: "2026-09-28", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-29": { date: "2026-09-29", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
    "2026-09-30": { date: "2026-09-30", type: "lectivo", legendItemId: "ist_ud_01", customColor: "#fcd5b4", customTextColor: "#431407" },
  },
  specialEvents: PRESET_CALENDAR_2026_2027.specialEvents,
  notes: "Planificación didáctica y temporalización anual del módulo Instalaciones Solares Térmicas (2º CFGM).",
};

// Preset Calendar 2026-2027: DIG 1664 (Digitalización Aplicada)
export const PRESET_CALENDAR_2026_2027_DIG: SigreAcademicCalendar = {
  id: "cal_2026_2027_dig_1664",
  academicYear: "2026-2027",
  region: "Andalucía",
  province: "Málaga",
  resolutionRef:
    "Resolución de 20 de mayo de 2026 de la Delegación Territorial de Desarrollo Educativo y FP en Málaga",
  resolutionUrl: "https://www.juntadeandalucia.es/educacion/portales/w/260522_del_calendescolar",
  educationalStage: "Formación Profesional (Módulo Transversal Grado D)",
  startDate: "2026-09-15",
  endDate: "2027-06-24",
  moduloFormativo: "Digitalización Aplicada a los Sectores Productivos (DIG 1664)",
  codigoModulo: "DIG 1664",
  cicloFormativo: "1º Grado D Técnico en Instalaciones Frigoríficas / Energía",
  docente: "Montserrat Elena (EVM)",
  totalLectivosEstimated: 175,
  legendItems: [
    { id: "dig_ini_fp", code: "15 Sep", title: "Inicio Curso Formación Profesional", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "dig_eval_ini", code: "22 Sep", title: "Evaluación Diagnóstica Competencia Digital", type: "evaluacion", color: "#99cc33", textColor: "#000", sidePosition: "left", monthTarget: 9 },
    { id: "dig_ud_01", code: "DIG. RA01", title: "DIG. RA01 (Entornos cloud, gemelos digitales e IoT en instalaciones)", type: "ud_ra", color: "#80deea", textColor: "#134e4a", monthTarget: 9, udId: "UD01" },
    { id: "dig_ud_02", code: "DIG. RA02", title: "DIG. RA02 (Ciberseguridad y protección de datos en infraestructuras)", type: "ud_ra", color: "#c7d2fe", textColor: "#3730a3", monthTarget: 11, udId: "UD02" },
    { id: "dig_ud_03", code: "DIG. RA03", title: "DIG. RA03 (Inteligencia Artificial y analítica de datos en mantenimiento)", type: "ud_ra", color: "#fbcfe8", textColor: "#831843", monthTarget: 1, udId: "UD03" },
    { id: "dig_ud_04", code: "DIG. RA04", title: "DIG. RA04 (Economía circular y gemelo digital en el sector térmico)", type: "ud_ra", color: "#a7f3d0", textColor: "#065f46", monthTarget: 4, udId: "UD04" },
    { id: "dig_ev1", code: "16 Dic", title: "Evaluación 1º Trimestre DIG", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 12 },
    { id: "dig_ev2", code: "17 Mar", title: "Evaluación 2º Trimestre DIG", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 3 },
    { id: "dig_ev3", code: "23 Jun", title: "Evaluación Final Ordinaria DIG", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
    { id: "dig_fin", code: "24 Jun", title: "Fin de clases ordinarias", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
  ],
  dayOverrides: {
    ...PRESET_CALENDAR_2026_2027.dayOverrides,
  },
  specialEvents: PRESET_CALENDAR_2026_2027.specialEvents,
  notes: "Planificación temporal del módulo transversal de Digitalización conforme al RD 659/2023.",
};

// Preset Calendar 2026-2027: CIT 0036 (2º CFGS Mantenimiento Térmico)
export const PRESET_CALENDAR_2026_2027_CIT: SigreAcademicCalendar = {
  id: "cal_2026_2027_cit_0036",
  academicYear: "2026-2027",
  region: "Andalucía",
  province: "Málaga",
  resolutionRef:
    "Resolución de 20 de mayo de 2026 de la Delegación Territorial de Desarrollo Educativo y FP en Málaga",
  resolutionUrl: "https://www.juntadeandalucia.es/educacion/portales/w/260522_del_calendescolar",
  educationalStage: "Formación Profesional Grado Superior (2º Curso)",
  startDate: "2026-09-15",
  endDate: "2027-06-24",
  moduloFormativo: "Configuración de Instalaciones Térmicas y de Fluidos (CIT 0036)",
  codigoModulo: "CIT 0036",
  cicloFormativo: "2º CFGS Mantenimiento de Instalaciones Térmicas y de Fluidos",
  docente: "Montserrat Elena (EVM)",
  totalLectivosEstimated: 175,
  legendItems: [
    { id: "cit_ini_fp", code: "15 Sep", title: "Inicio Régimen Ordinario 2º CFGS", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "left", monthTarget: 9 },
    { id: "cit_eval_ini", code: "22 Sep", title: "Evaluación Inicial 2º CFGS", type: "evaluacion", color: "#99cc33", textColor: "#000", sidePosition: "left", monthTarget: 9 },
    { id: "cit_ud_01", code: "CIT. RA01", title: "CIT. RA01 (Cálculo de cargas térmicas de calefacción y refrigeración)", type: "ud_ra", color: "#fcd5b4", textColor: "#431407", monthTarget: 9, udId: "UD01" },
    { id: "cit_ud_02", code: "CIT. RA02", title: "CIT. RA02 (Dimensionado de redes hidráulicas y bombas centrífugas)", type: "ud_ra", color: "#e2d5e8", textColor: "#3b0764", monthTarget: 10, udId: "UD02" },
    { id: "cit_ud_03", code: "CIT. RA03", title: "CIT. RA03 (Selección de calderas, bombas de calor y aerotermia)", type: "ud_ra", color: "#f5deb3", textColor: "#7c2d12", monthTarget: 11, udId: "UD03" },
    { id: "cit_ud_04", code: "CIT. RA04", title: "CIT. RA04 (Dimensionado de conductos de aire y UTA según RITE)", type: "ud_ra", color: "#fff2b2", textColor: "#713f12", monthTarget: 12, udId: "UD04" },
    { id: "cit_dual", code: "DUAL 2º GS", title: "Periodo de Formación en Empresa / FP Dual Superior (180h)", type: "dual", color: "#fef08a", textColor: "#854d0e", monthTarget: 2 },
    { id: "cit_ud_05", code: "CIT. RA05", title: "CIT. RA05 (Sistemas de regulación DDC, domótica y KNX)", type: "ud_ra", color: "#99e6ff", textColor: "#0c4a6e", monthTarget: 3, udId: "UD05" },
    { id: "cit_ud_06", code: "CIT. RA06", title: "CIT. RA06 (Eficiencia energética y certificación en edificios)", type: "ud_ra", color: "#b2e6b2", textColor: "#14532d", monthTarget: 4, udId: "UD06" },
    { id: "cit_ud_07", code: "CIT. RA07", title: "CIT. RA07 (Elaboración de memoria técnica y planos de proyecto)", type: "ud_ra", color: "#80deea", textColor: "#134e4a", monthTarget: 5, udId: "UD07" },
    { id: "cit_ev1", code: "16 Dic", title: "Sesión Evaluación 1º Trimestre CIT", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 12 },
    { id: "cit_ev2", code: "17 Mar", title: "Sesión Evaluación 2º Trimestre CIT", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 3 },
    { id: "cit_ev3", code: "27 May", title: "1ª Sesión Evaluación Final (2º CFGS)", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 5 },
    { id: "cit_recup", code: "Recuperación", title: "Periodo de Recuperación / Proyecto Integrado", type: "recuperacion", color: "#f8cb9c", textColor: "#7c2d12", sidePosition: "right", monthTarget: 6 },
    { id: "cit_evfin", code: "23 Jun", title: "2ª Sesión Evaluación Final Extraordinaria", type: "evaluacion", color: "#0080ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
    { id: "cit_fin", code: "24 Jun", title: "Fin lectivo oficial FP", type: "hito", color: "#ff00ff", textColor: "#fff", sidePosition: "right", monthTarget: 6 },
  ],
  dayOverrides: {
    ...PRESET_CALENDAR_2026_2027.dayOverrides,
  },
  specialEvents: PRESET_CALENDAR_2026_2027.specialEvents,
  notes: "Planificación de Unidades Didácticas y Resultados de Aprendizaje para el ciclo superior de Mantenimiento Térmico.",
};

// All Preset Calendars
export const ALL_PRESET_ACADEMIC_CALENDARS: SigreAcademicCalendar[] = [
  PRESET_CALENDAR_2026_2027,
  PRESET_CALENDAR_2026_2027_IST,
  PRESET_CALENDAR_2026_2027_DIG,
  PRESET_CALENDAR_2026_2027_CIT,
  PRESET_CALENDAR_2025_2026,
];

