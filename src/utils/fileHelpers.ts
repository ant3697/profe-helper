export function downloadBlob(filename: string, content: string, mimeType: string = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const element = document.createElement("a");
  element.setAttribute("href", url);
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback using textarea
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackErr) {
      console.error("Clipboard copy error:", fallbackErr);
      return false;
    }
  }
}

export const DEFAULT_THEMATICS = [
  {
    id: "term-1",
    grupo: "Termodinámica y Psicrometría",
    temas: [
      "resolución de un caso práctico sobre cálculo psicrométrico avanzado y factor de bypass [Avanzado]",
      "pregunta de interpretación gráfica del impacto del sobrecalentamiento en el diagrama P-h [Intermedio]",
      "cuestión teórica sobre los principios elementales de distribución de aire y efecto Coanda [Básico]",
      "análisis termodinámico del subenfriamiento y su efecto sobre el COP [Intermedio]",
      "diagnóstico de anomalías en el ciclo de compresión simple y doble etapa [Avanzado]",
    ],
    selected: true,
  },
  {
    id: "ref-2",
    grupo: "Refrigerantes y F-Gas (RSIF)",
    temas: [
      "clasificación de seguridad de refrigerantes L1, L2, L3 según RSIF ITC-IF-02 [Intermedio]",
      "normativa sobre detección de fugas obligatoria para sistemas con más de 500 t CO2 eq [Avanzado]",
      "selección de lubricantes sintéticos POE y compatibilidad con HFOs [Intermedio]",
      "cuestión sobre límites de inflamabilidad A2L y ventilación forzada en salas de máquinas [Avanzado]",
      "procedimiento de recuperación, reciclado y regeneración de refrigerantes fluorados [Básico]",
    ],
    selected: true,
  },
  {
    id: "cal-3",
    grupo: "Calefacción, Combustión y RITE",
    temas: [
      "requisitos de rendimiento estacional y temperatura de condensación en calderas de gas [Intermedio]",
      "prescripciones del RITE IT 1.2 sobre calidad del aire interior (IDA 1 a IDA 4) [Intermedio]",
      "dimensionamiento de bombas circuladoras de caudal variable y curva resistente de la red [Avanzado]",
      "análisis de productos de combustión (CO2, O2, exceso de aire y rendimiento de combustión) [Avanzado]",
      "cálculo de vaso de expansión cerrado según UNE-EN 12828 [Avanzado]",
    ],
    selected: true,
  },
  {
    id: "elec-4",
    grupo: "Regulación, Control y REBT",
    temas: [
      "protección contra sobrecargas y cortocircuitos en cuadros de climatización según REBT ITC-BT-19 [Intermedio]",
      "sensores de temperatura (PT100, NTC, termopares) y bucles de control PID [Intermedio]",
      "variadores de frecuencia aplicados a ventiladores y compresores con filtrado de armónicos [Avanzado]",
      "sistemas de equilibrado hidráulico estático vs dinámico (válvulas PICV) [Avanzado]",
      "secuencias de seguridad en quemadores automáticos y presostatos de aire/gas [Básico]",
    ],
    selected: true,
  },
  {
    id: "hid-5",
    grupo: "Sistemas Hidráulicos y Solar Térmica",
    temas: [
      "esquema de principio para integración de solar térmica con apoyo de caldera en ACS [Intermedio]",
      "prevención de legionella según RD 487/2022 en depósitos de acumulación de ACS [Avanzado]",
      "dimensionamiento de tuberías de cobre y multicapa con límite de velocidad para evitar erosión [Intermedio]",
      "aislamiento térmico de conducciones según RITE IT 1.2.4.2 [Básico]",
      "válvulas de 3 vías mezcladoras vs desviadoras en circuitos primarios y secundarios [Intermedio]",
    ],
    selected: true,
  },
];
