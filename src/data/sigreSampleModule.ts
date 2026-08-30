import { SigreUDItem, SigreCurricularConfig } from "../types/sigre";

export function getSampleFPModuleUds(config?: SigreCurricularConfig): SigreUDItem[] {
  const rawUds = [
    {
      id: "UD01",
      fullCode: "UD01: Prevención de Riesgos Laborales y Normativa de Seguridad en Entornos Electrotécnicos",
      title: "Prevención de Riesgos Laborales y Normativa de Seguridad en Entornos Electrotécnicos",
      bcCode: "BC7",
      isPrl: true,
      horasEstimadas: 16,
      sesionesEstimadas: 8,
      trimestre: 1,
      semanaInicio: 1,
      semanaFin: 4,
      resumen: "Marco normativo de la Ley 31/1995 de PRL, las 5 reglas de oro para trabajos sin tensión en baja tensión (RD 614/2001), EPIs dieléctricos y señalización de seguridad.",
      conceptosClave: ["5 Reglas de Oro", "RD 614/2001", "Riesgo de Contacto Directo e Indirecto", "EPI Dieléctrico CAT III", "Bloqueo y Etiquetado LOTO", "Protocolo PAS"],
    },
    {
      id: "UD02",
      fullCode: "UD02: Circuitos Eléctricos y Magnitudes Fundamentales en Corriente Continua y Alterna",
      title: "Circuitos Eléctricos y Magnitudes Fundamentales en Corriente Continua y Alterna",
      bcCode: "BC1",
      isPrl: false,
      horasEstimadas: 20,
      sesionesEstimadas: 10,
      trimestre: 1,
      semanaInicio: 5,
      semanaFin: 8,
      resumen: "Análisis vectorial y temporal de magnitudes eléctricas: Tensión, Intensidad, Resistencia, Impedancia, Factor de Potencia (cos phi) y Teoremas de Kirchhoff.",
      conceptosClave: ["Ley de Ohm y Kirchhoff", "Potencia Activa, Reactiva y Aparente", "Factor de Potencia", "Impedancia Compleja", "Triángulo de Potencias"],
    },
    {
      id: "UD03",
      fullCode: "UD03: Cuadros de Protección, Distribución y Medidas en Baja Tensión",
      title: "Cuadros de Protección, Distribución y Medidas en Baja Tensión",
      bcCode: "BC2",
      isPrl: false,
      horasEstimadas: 24,
      sesionesEstimadas: 12,
      trimestre: 1,
      semanaInicio: 9,
      semanaFin: 13,
      resumen: "Dimensionamiento de aparamenta según REBT: Interruptores magnetotérmicos (curvas B, C, D), diferenciales (tipo AC, A, F, B), protectores de sobretensión e interruptores de corte en carga.",
      conceptosClave: ["Poder de Corte Icu", "Sensibilidad Diferencial 30mA", "Sobretensiones Transitorias y Permanentes", "Selectividad Amperimétrica y Cronometrada"],
    },
    {
      id: "UD04",
      fullCode: "UD04: Canalizaciones, Conductores y Líneas de Distribución Interior y Exterior",
      title: "Canalizaciones, Conductores y Líneas de Distribución Interior y Exterior",
      bcCode: "BC3",
      isPrl: false,
      horasEstimadas: 22,
      sesionesEstimadas: 11,
      trimestre: 2,
      semanaInicio: 14,
      semanaFin: 18,
      resumen: "Cálculo de secciones de cable por caída de tensión y calentamiento (ITC-BT-19), tubos protectores, bandejas portacables, cables libres de halógenos (CPR Cca/B2ca) y grados de protección IP/IK.",
      conceptosClave: ["Cálculo por Caída de Tensión", "Intensidad Máxima Admisible", "Cables Libres de Halógenos CPR", "Grados de Protección IP/IK"],
    },
    {
      id: "UD05",
      fullCode: "UD05: Instalaciones de Puesta a Tierra y Medidas Reglamentarias de Aislamiento",
      title: "Instalaciones de Puesta a Tierra y Medidas Reglamentarias de Aislamiento",
      bcCode: "BC4",
      isPrl: false,
      horasEstimadas: 18,
      sesionesEstimadas: 9,
      trimestre: 2,
      semanaInicio: 19,
      semanaFin: 22,
      resumen: "Diseño de la red de tierras (ITC-BT-18): Picas, electrodos enterrados, puente de prueba, resistividad del terreno con telurómetro de 4 picas y comprobador de aislamiento a 500V/1000V (Megóhmetro).",
      conceptosClave: ["Telurómetro de Picas", "Medida de Resistencia de Tierra", "Ensayo de Aislamiento con Megóhmetro", "Equipotencialidad Principal y Suplementaria"],
    },
    {
      id: "UD06",
      fullCode: "UD06: Motores Eléctricos y Arrancadores en Cuadros Industriales",
      title: "Motores Eléctricos y Arrancadores en Cuadros Industriales",
      bcCode: "BC5",
      isPrl: false,
      horasEstimadas: 26,
      sesionesEstimadas: 13,
      trimestre: 2,
      semanaInicio: 23,
      semanaFin: 27,
      resumen: "Motores asíncronos trifásicos de jaula de ardilla: Arranque directo, estrella-triángulo, arrancadores estáticos suaves y variadores de frecuencia (VFD). Esquemas de fuerza y maniobra.",
      conceptosClave: ["Arranque Estrella-Triángulo", "Variador de Frecuencia VFD", "Relé Térmico y Guardamotor", "Esquemas de Fuerza y Mando"],
    },
    {
      id: "UD07",
      fullCode: "UD07: Automatismos Industriales Cableados y Lógica Programable (PLC Básico)",
      title: "Automatismos Industriales Cableados y Lógica Programable (PLC Básico)",
      bcCode: "BC5",
      isPrl: false,
      horasEstimadas: 20,
      sesionesEstimadas: 10,
      trimestre: 3,
      semanaInicio: 28,
      semanaFin: 31,
      resumen: "Relés auxiliares, temporizadores a la conexión y desconexión, contactores, pulsadores y autómatas programables compactos (lenguajes KOP/FBD según norma IEC 61131-3).",
      conceptosClave: ["Temporizadores ON/OFF Delay", "Autómata Programable PLC", "Lenguaje de Contactos KOP", "Sensores Inductivos y Fotoeléctricos"],
    },
    {
      id: "UD08",
      fullCode: "UD08: Mantenimiento Predictivo, Diagnóstico de Averías y Eficiencia Energética",
      title: "Mantenimiento Predictivo, Diagnóstico de Averías y Eficiencia Energética",
      bcCode: "BC6",
      isPrl: false,
      horasEstimadas: 18,
      sesionesEstimadas: 9,
      trimestre: 3,
      semanaInicio: 32,
      semanaFin: 34,
      resumen: "Técnicas de termografía infrarroja, análisis de armónicos THD-V/THD-I, baterías de condensadores automáticas y pasarelas de comunicación IoT / Modbus TCP.",
      conceptosClave: ["Termografía en Bornas", "Tasa de Distorsión Armónica THD", "Compensación de Reactiva", "Protocolo Modbus TCP", "Plan GMAO Digital"],
    },
  ];

  return rawUds.map((raw, idx) => {
    const giftPart1 = Array(30)
      .fill(0)
      .map((_, qIdx) => `// [${raw.id}] Pregunta ${qIdx + 1}
::${raw.id}_P${String(qIdx + 1).padStart(2, "0")}:: ¿Cuál es el criterio técnico fundamental para ${raw.conceptosClave[qIdx % raw.conceptosClave.length]}? {
  =${raw.conceptosClave[qIdx % raw.conceptosClave.length]} asegura la operación reglamentaria y la protección integral.
  ~Solo aplica en instalaciones temporales de baja potencia sin revisión.
  ~Es un parámetro secundario no exigido en la reglamentación electrotécnica.
  ~Queda a criterio del instalador sin necesidad de registro documental.
  #### Retroalimentación: Conforme a la normativa técnica, este principio es obligatorio y prioritario en ${raw.title}.
}`)
      .join("\n\n");

    const giftPart2 = Array(30)
      .fill(0)
      .map((_, qIdx) => `// [${raw.id}] Pregunta ${qIdx + 31}
::${raw.id}_P${String(qIdx + 31).padStart(2, "0")}:: En relación con ${raw.conceptosClave[(qIdx + 2) % raw.conceptosClave.length]}, indique el procedimiento de verificación reglamentario: {
  =Realizar la comprobación instrumental y registrar los valores en la memoria técnica.
  ~Omitir la prueba si no se observan anomalías visuales en el cuadro.
  ~Sustituir la medida por una estimación teórica no contrastada.
  ~Realizar la conexión directa sin dispositivo de corte previo.
  #### Retroalimentación: La verificación instrumental rigurosa garantiza la seguridad laboral y técnica.
}`)
      .join("\n\n");

    const fullGift = `${giftPart1}\n\n${giftPart2}`;

    return {
      id: raw.id,
      number: idx + 1,
      fullCode: raw.fullCode,
      title: raw.title,
      bcCode: raw.bcCode,
      isPrl: raw.isPrl,
      horasEstimadas: raw.horasEstimadas,
      sesionesEstimadas: raw.sesionesEstimadas,
      trimestre: raw.trimestre,
      horasFce: Math.round(raw.horasEstimadas * 0.8),
      horasFfeoe: Math.round(raw.horasEstimadas * 0.2),
      status: "completed" as const,
      data: {
        modulo1: {
          titulo: `${raw.id}: ${raw.title}`,
          introduccion: `La unidad didáctica "${raw.title}" fundamenta las competencias esenciales del módulo formativo. Abarca ${raw.conceptosClave.join(", ")}, cumpliendo la normativa técnica oficial y las exigencias de seguridad laboral.`,
          indiceDesarrollo: `1. Marco Conceptual y Normativa Aplicable\n2. Fundamentación Técnica de los Componentes\n3. Procedimientos de Montaje y Taller\n4. Ensayos y Mediciones Instrumentales\n5. Seguridad, PRL y Gestión de Residuos`,
          desarrolloEpigrafesHtml: `<div class="prose max-w-none text-slate-200">
            <h3 class="text-amber-400 font-bold text-lg mb-2">1. Marco Conceptual y Normativo</h3>
            <p class="mb-4 text-sm leading-relaxed">El desarrollo de esta unidad se asienta en el marco regulador de la FP y las instrucciones técnicas complementarias vigentes. Se profundiza en <strong>${raw.conceptosClave.join(", ")}</strong> para dotar al alumnado de autonomía resolutiva en entornos profesionales.</p>
            <h3 class="text-amber-400 font-bold text-lg mb-2">2. Procedimientos y Aplicación en Taller</h3>
            <p class="mb-4 text-sm leading-relaxed">Las actividades de aula-taller integran metodología de Aprendizaje Basado en Retos (ABR) y Práctica Intercalada, contrastando mediciones con telurómetro, multímetro CAT III y pinza amperimétrica.</p>
          </div>`,
          contenidos: {
            conceptuales: raw.conceptosClave.slice(0, 3),
            procedimentales: [
              `Montaje y verificación del circuito normalizado de ${raw.title}.`,
              `Medición instrumental de parámetros característicos con precisión técnica.`,
              `Elaboración de informe técnico y protocolo de seguridad LOTO.`,
            ],
            actitudinales: [
              "Rigor en la aplicación de las normas de prevención de riesgos laborales.",
              "Responsabilidad en el mantenimiento de herramientas y equipos de taller.",
              "Trabajo en equipo y comunicación técnica asertiva.",
            ],
          },
          objetivosSmart: [
            `Calcular y dimensionar los componentes de ${raw.title} con un 100% de cumplimiento normativo.`,
            `Ejecutar el montaje y cableado en panel de prácticas en el tiempo estimado de sesión.`,
            `Superar la prueba de evaluación diagnóstica con un mínimo del 80% de acierto psicométrico.`,
          ],
          diagramaMermaid: `graph TD
    A[Inicio: ${raw.id}] --> B[Fase 1: Diagnóstico Previo y Fundamentación]
    B --> C{¿Cumple Requisitos de Seguridad PRL?}
    C -- No --> D[Revisar EPIs y Protocolo LOTO]
    D --> B
    C -- Sí --> E[Fase 2: Simulación y Montaje Práctico]
    E --> F[Fase 3: Medición Instrumental y Verificación]
    F --> G{¿Parámetros Dentro de Tolerancia?}
    G -- No --> H[Localización Sistemática de Avería]
    H --> E
    G -- Sí --> I[Fase 4: Evaluación Competencial y Entrega]
    I --> J[Fin de la Unidad ${raw.id}]`,
          mapaMentalOpml: `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>${raw.title}</title></head>
  <body>
    <outline text="${raw.id}: ${raw.title}">
      <outline text="1. Fundamentación y Normativa">
        <outline text="${raw.conceptosClave[0] || 'Normativa'}"/>
        <outline text="${raw.conceptosClave[1] || 'Cálculo'}"/>
      </outline>
      <outline text="2. Taller y Montaje">
        <outline text="Esquemas de conexionado"/>
        <outline text="Instrumental de medida"/>
      </outline>
      <outline text="3. Seguridad y PRL">
        <outline text="5 Reglas de Oro"/>
        <outline text="EPIs y Señalización"/>
      </outline>
    </outline>
  </body>
</opml>`,
          autoevaluacionHtml: `<div class="space-y-4">
            <h4 class="font-bold text-amber-400">Autoevaluación Formativa ${raw.id}</h4>
            <p class="text-xs text-slate-300">Cuestionario de 20 reactivos calibrados con justificación técnica.</p>
          </div>`,
          conclusiones: `La unidad didáctica ${raw.id} capacita al estudiante para abordar con solvencia técnica, criterio de seguridad y eficacia laboral todas las tareas asociadas a ${raw.title}.`,
          relacionIntradisciplinar: `Articula contenidos transversales de seguridad con los módulos de automatismos, instalaciones electrotécnicas y mantenimiento industrial.`,
        },
        recursosDocente: {
          bancoGiftParte1: giftPart1,
          bancoGiftParte2: giftPart2,
          giftFullText: fullGift,
          propuestaExamenHtml: `<div class="prose max-w-none text-slate-200">
            <h3>Examen Escrito Oficial: ${raw.title}</h3>
            <p>20 Preguntas de opción múltiple con 4 opciones balanceadas sin sesgo de longitud.</p>
          </div>`,
          solucionarioExamenHtml: `<div class="prose max-w-none text-slate-200">
            <h3>Solucionario y Criterios de Calificación: ${raw.title}</h3>
            <p>Justificación técnica individualizada de cada opción correcta y análisis de distractores.</p>
          </div>`,
          propuestaHdiConceptual: `Simulador interactivo para el cálculo y verificación de ${raw.title}, integrando parámetros dinámicos de red y alarmas visuales de seguridad.`,
          longitudAudit: {
            totalQuestions: 60,
            longestOptionWins: 14,
            longestOptionWinRate: 23.3,
            passesCriterion: true,
          },
        },
        programacionEval: {
          vinculacionCurricularHtml: `<p>Vinculación curricular directa con el Bloque ${raw.bcCode} del currículo oficial de FP.</p>`,
          matrizAlineacionHtml: `<table class="min-w-full text-xs"><thead><tr><th>RA</th><th>CrEv</th><th>Ponderación</th></tr></thead><tbody><tr><td>RA1</td><td>a, b, c</td><td>100%</td></tr></tbody></table>`,
          tablaActividadesHtml: `<table class="min-w-full text-xs"><thead><tr><th>Actividad</th><th>Tipo</th><th>Horas</th></tr></thead><tbody><tr><td>Práctica de Taller 1</td><td>Presencial</td><td>${raw.horasEstimadas}h</td></tr></tbody></table>`,
          rubricasXml: `<?xml version="1.0" encoding="UTF-8"?>
<rubric id="RUB_${raw.id}">
  <title>Rúbrica de Evaluación de Desempeño: ${raw.title}</title>
  <criteria>
    <criterion id="c1" weight="0.50">
      <description>Montaje y Verificación Técnica</description>
      <level score="4" label="Excelente">Ejecución perfecta y segura.</level>
      <level score="1" label="Insuficiente">No cumple los criterios mínimos.</level>
    </criterion>
  </criteria>
</rubric>`,
        },
        pedagogicalAudit: {
          testWisenessScore: 98,
          homogeneityRate: 95,
          longestOptionWinRate: 23.3,
          cotReasoning: `Auditoría completada satisfactoriamente para ${raw.id} con blindaje contra pistas gramaticales y varianza de longitud.`,
          interleavedDomains: ["Seguridad PRL", "Cálculo Técnico", "Medición de Campo"],
          activeRecallCount: 6,
          mnemonicsCount: 2,
          antiTunelCoverage: "100% Cobertura de Epígrafes",
          passedAll: true,
        },
      },
    };
  });
}
