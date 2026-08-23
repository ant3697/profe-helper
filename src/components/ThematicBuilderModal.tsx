import React, { useState } from "react";
import {
  X,
  Layers,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  Shuffle,
} from "lucide-react";
import { ThematicGroup } from "../types/exam";
import { copyTextToClipboard, downloadBlob } from "../utils/fileHelpers";

interface ThematicBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  thematics: ThematicGroup[];
  onUpdateThematics: (groups: ThematicGroup[]) => void;
  onApplySelection: (selectedGroups: ThematicGroup[]) => void;
  onShowToast: (msg: string) => void;
}

export const ThematicBuilderModal: React.FC<ThematicBuilderModalProps> = ({
  isOpen,
  onClose,
  thematics,
  onUpdateThematics,
  onApplySelection,
  onShowToast,
}) => {
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPrompt = async (id: string, text: string) => {
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedPromptId(id);
      onShowToast("Prompt copiado al portapapeles");
      setTimeout(() => setCopiedPromptId(null), 2000);
    }
  };

  const toggleGroupCheck = (id: string, checked: boolean) => {
    const updated = thematics.map((g) => (g.id === id ? { ...g, selected: checked } : g));
    onUpdateThematics(updated);
  };

  const toggleAll = (checked: boolean) => {
    const updated = thematics.map((g) => ({ ...g, selected: checked }));
    onUpdateThematics(updated);
  };

  const selectRandom5 = () => {
    const validIndices = thematics
      .map((g, idx) => (g.temas.length > 0 ? idx : -1))
      .filter((i) => i !== -1);

    // Shuffle indices
    for (let i = validIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validIndices[i], validIndices[j]] = [validIndices[j], validIndices[i]];
    }

    const chosen = new Set(validIndices.slice(0, 5));
    const updated = thematics.map((g, idx) => ({
      ...g,
      selected: chosen.has(idx),
    }));
    onUpdateThematics(updated);
    onShowToast("5 temáticas seleccionadas aleatoriamente");
  };

  const handleAddNewGroup = () => {
    const title = prompt("Nombre del nuevo bloque temático:");
    if (!title || !title.trim()) return;

    const newGroup: ThematicGroup = {
      id: `group-${Date.now()}`,
      grupo: title.trim(),
      temas: ["Nueva directriz de examen (un ítem por línea)"],
      selected: true,
    };
    onUpdateThematics([...thematics, newGroup]);
    setOpenAccordions((prev) => ({ ...prev, [newGroup.id]: true }));
  };

  const handleEditTitle = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt("Editar nombre de la temática:", currentTitle);
    if (newTitle && newTitle.trim()) {
      const updated = thematics.map((g) =>
        g.id === id ? { ...g, grupo: newTitle.trim() } : g
      );
      onUpdateThematics(updated);
    }
  };

  const handleDeleteGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Seguro que deseas eliminar esta temática?")) {
      const updated = thematics.filter((g) => g.id !== id);
      onUpdateThematics(updated);
    }
  };

  const handleItemsChange = (id: string, value: string) => {
    const items = value
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const updated = thematics.map((g) => (g.id === id ? { ...g, temas: items } : g));
    onUpdateThematics(updated);
  };

  const handleExportSingle = (group: ThematicGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = group.temas.join("\n");
    const filename = `${group.grupo.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
    downloadBlob(filename, content);
    onShowToast(`Exportado: ${filename}`);
  };

  const handleExportAll = () => {
    let allText = "";
    thematics.forEach((g) => {
      allText += `### ${g.grupo}\n` + g.temas.join("\n") + "\n\n";
    });
    downloadBlob("todas_las_tematicas_docuexam.txt", allText.trim());
    onShowToast("Todas las temáticas exportadas");
  };

  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files) as File[];
    const newGroups: ThematicGroup[] = [];

    for (const file of files) {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("###"));
      const title = file.name.replace(/\.[^/.]+$/, "");
      newGroups.push({
        id: `imported-${Date.now()}-${Math.random()}`,
        grupo: title,
        temas: lines,
        selected: true,
      });
    }

    onUpdateThematics([...thematics, ...newGroups]);
    onShowToast(`${newGroups.length} temática(s) importada(s) con éxito`);
    e.target.value = "";
  };

  // Drag & Drop Reordering
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const reordered = [...thematics];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    onUpdateThematics(reordered);
    setDraggedIndex(null);
  };

  const allSelected = thematics.length > 0 && thematics.every((g) => g.selected);

  const thematicPrompt1 = `Eres un asistente experto en estructuración de contenidos curriculares para oposiciones técnicas. Tu tarea es analizar el texto que te proporcionaré a continuación y extraer de él una única "Temática" principal y una lista detallada de "Ítems de Evaluación" clave.

Instrucciones de formato y extracción:

1. TÍTULO (La Temática): Identifica el bloque o título principal que engloba todo el contenido analizado. Debe ser conciso. No incluyas números ni prefijos.

2. EXCLUSIÓN DE RELLENO (Filtro de relevancia): IGNORA introducciones, prólogos, anécdotas históricas, bibliografías o texto de relleno. Extrae ÚNICAMENTE materia técnica pura susceptible de ser evaluada.

3. DIVERSIFICACIÓN COGNITIVA: Clasifica mentalmente el contenido y redacta ítems que cubran diferentes niveles: Memoria (ej. definiciones), Comprensión (ej. funcionamiento), y Aplicación (ej. cálculos, diagnóstico de averías).

4. ÍTEMS (Directrices de examen): Extrae los conceptos y redáctalos en forma de directriz para un examinador.
   * Usa formatos como: "pregunta [teórica / de cálculo / normativa / de diagnóstico de averías] sobre [concepto] enfocado en [detalle]".
   * Longitud y Especificidad: Cada ítem debe tener entre 15 y 20 palabras. Específico pero no demasiado cerrado.
   * Muestra ESTRICTAMENTE UN ÍTEM POR LÍNEA. NO utilices viñetas, guiones, números ni asteriscos al inicio de la línea.
   * Etiquetado de Dificultad: Añade al final de cada ítem la etiqueta [Básico], [Intermedio] o [Avanzado].

Texto a analizar:
[Pega aquí tu contenido, unidad didáctica o capítulo]`;

  const thematicPrompt2 = `Eres un asistente experto en creación de material de estudio para "flashcards" y memorización mediante repetición espaciada.

Tu tarea es analizar el texto proporcionado (normativas, bibliografías, leyes, parámetros técnicos, fechas) y extraer exclusivamente los "Datos Duros de Memorización".

Instrucciones estrictas:
1. TÍTULO: Crea un título conciso que describa el conjunto de datos (ej. "Bibliografía Normativa RITE", "Fechas y Reales Decretos F-Gas").
2. RESTRICCIÓN: Céntrate exclusivamente en datos inequívocos: Autor-Obra-Año (APA), Ley-Año-Objeto, Elemento-Valor Límite.
3. FORMATO: Redacta directrices de examen diseñadas para generar preguntas de asociación y memoria fotográfica.
   * Usa: "pregunta de memorización asociativa sobre [Dato A] para identificar su correspondiente [Dato B]".
   * Abreviaturas obligatorias: LO 2/2006, RD 659/2023, etc.
4. SALIDA: Primera línea: TÍTULO. Siguientes: ESTRICTAMENTE UN ÍTEM POR LÍNEA sin viñetas ni números.

Texto a analizar:
[Pega aquí tu lista de leyes, valores, bibliografía o reglamento]`;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border-2 border-amber-500 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-alt/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-primary">
                Constructor de Temáticas del Simulacro
              </h2>
              <p className="text-xs text-text-muted">
                Selecciona, ordena y personaliza los temas técnicos para la generación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Prompt Extraction Templates */}
        <div className="p-4 bg-alt/30 border-b border-border-subtle grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Prompt 1: Curricular */}
          <details className="bg-surface rounded-xl border border-amber-500/30 overflow-hidden text-xs group">
            <summary className="p-3 font-bold text-amber-400 flex items-center justify-between cursor-pointer hover:bg-amber-500/5 select-none">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Extraer Temáticas de Estudio (Prompt IA)
              </span>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-3 border-t border-border-subtle bg-alt/40 relative">
              <button
                type="button"
                onClick={() => handleCopyPrompt("p1", thematicPrompt1)}
                className="absolute top-2 right-2 px-2 py-1 bg-surface border border-border-default rounded-md text-[11px] font-bold text-amber-400 hover:bg-amber-500 hover:text-black flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedPromptId === "p1" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedPromptId === "p1" ? "Copiado" : "Copiar"}
              </button>
              <pre className="text-[11px] font-mono text-text-muted whitespace-pre-wrap max-h-36 overflow-y-auto pr-16">
                {thematicPrompt1}
              </pre>
            </div>
          </details>

          {/* Prompt 2: Memorization */}
          <details className="bg-surface rounded-xl border border-blue-500/30 overflow-hidden text-xs group">
            <summary className="p-3 font-bold text-blue-400 flex items-center justify-between cursor-pointer hover:bg-blue-500/5 select-none">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Datos de Memorización Pura (Prompt IA)
              </span>
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-3 border-t border-border-subtle bg-alt/40 relative">
              <button
                type="button"
                onClick={() => handleCopyPrompt("p2", thematicPrompt2)}
                className="absolute top-2 right-2 px-2 py-1 bg-surface border border-border-default rounded-md text-[11px] font-bold text-blue-400 hover:bg-blue-500 hover:text-black flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedPromptId === "p2" ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copiedPromptId === "p2" ? "Copiado" : "Copiar"}
              </button>
              <pre className="text-[11px] font-mono text-text-muted whitespace-pre-wrap max-h-36 overflow-y-auto pr-16">
                {thematicPrompt2}
              </pre>
            </div>
          </details>
        </div>

        {/* Action Toolbar */}
        <div className="p-3 bg-alt/60 border-b border-border-default flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 bg-surface border border-border-default px-2.5 py-1.5 rounded-lg font-bold text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => toggleAll(e.target.checked)}
                className="accent-amber-500 cursor-pointer"
              />
              <span>Todas</span>
            </label>

            <input
              type="file"
              ref={importInputRef}
              accept=".txt"
              multiple
              className="hidden"
              onChange={handleImportFiles}
            />

            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="bg-surface border border-border-default px-2.5 py-1.5 rounded-lg font-bold text-text-secondary hover:text-amber-400 hover:border-amber-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar (.txt)</span>
            </button>

            <button
              type="button"
              onClick={handleExportAll}
              className="bg-surface border border-border-default px-2.5 py-1.5 rounded-lg font-bold text-text-secondary hover:text-amber-400 hover:border-amber-500/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Todo (.txt)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectRandom5}
              className="bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>5 Aleatorios</span>
            </button>

            <button
              type="button"
              onClick={handleAddNewGroup}
              className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Temática</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Thematic Groups List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-app/50">
          {thematics.map((group, idx) => {
            const isOpen = !!openAccordions[group.id];

            return (
              <div
                key={group.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`bg-surface border rounded-xl overflow-hidden transition-all shadow-xs ${
                  draggedIndex === idx
                    ? "opacity-40 border-amber-500"
                    : "border-border-default hover:border-amber-500/40"
                }`}
              >
                {/* Item Header */}
                <div
                  onClick={() => toggleAccordion(group.id)}
                  className="flex items-center justify-between p-3 bg-alt/40 cursor-pointer hover:bg-hover transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="cursor-grab text-text-muted hover:text-amber-500"
                      title="Arrastrar para ordenar"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>

                    <input
                      type="checkbox"
                      checked={group.selected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => toggleGroupCheck(group.id, e.target.checked)}
                      className="accent-amber-500 cursor-pointer"
                    />

                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}

                    <span className="font-bold text-sm text-text-primary truncate">
                      {group.grupo}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleEditTitle(group.id, group.grupo, e)}
                      className="p-1 text-text-muted hover:text-amber-500 rounded-md transition-colors"
                      title="Editar Título"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    <span className="text-[11px] font-normal text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border-subtle ml-1">
                      {group.temas.length} ítems
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={(e) => handleExportSingle(group, e)}
                      className="text-[10px] font-bold bg-surface border border-border-default px-2 py-1 rounded text-text-secondary hover:text-text-primary"
                    >
                      Exportar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteGroup(group.id, e)}
                      className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500 hover:text-white"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="p-3 border-t border-border-subtle bg-app/30">
                    <textarea
                      rows={5}
                      defaultValue={group.temas.join("\n")}
                      onBlur={(e) => handleItemsChange(group.id, e.target.value)}
                      placeholder="Escribe una directriz de evaluación por línea..."
                      className="w-full bg-surface border border-border-default rounded-lg text-xs p-2.5 text-text-primary outline-none focus:border-amber-500 font-mono resize-y"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-default bg-alt/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-text-secondary bg-surface border border-border-default hover:bg-hover transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const selected = thematics.filter((g) => g.selected);
              if (selected.length === 0) {
                onShowToast("Debes seleccionar al menos una temática");
                return;
              }
              onApplySelection(selected);
              onClose();
            }}
            className="px-6 py-2 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Selección</span>
          </button>
        </div>
      </div>
    </div>
  );
};
