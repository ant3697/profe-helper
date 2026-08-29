import React, { useState } from "react";
import { X, Check, ArrowUpDown, Trash2, Plus, AlertCircle, ShieldAlert, Sparkles, BookOpen, Clock, Calendar } from "lucide-react";
import { SigreUDItem } from "../../types/sigre";

interface SigrePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  uds: SigreUDItem[];
  moduloTitle: string;
  horasTotales?: number;
  horasSemanales?: number;
  onConfirmPlan: (updatedUds: SigreUDItem[]) => void;
}

export const SigrePlanModal: React.FC<SigrePlanModalProps> = ({
  isOpen,
  onClose,
  uds: initialUds,
  moduloTitle,
  horasTotales = 160,
  horasSemanales = 5,
  onConfirmPlan,
}) => {
  const [uds, setUds] = useState<SigreUDItem[]>(() => {
    // Ensure all UDs have estimated hours
    const defaultHoursPerUd = Math.round(horasTotales / (initialUds.length || 8));
    return initialUds.map((u) => ({
      ...u,
      horasEstimadas: u.horasEstimadas || defaultHoursPerUd,
      sesionesEstimadas: u.sesionesEstimadas || Math.max(1, Math.round((u.horasEstimadas || defaultHoursPerUd) / 2)),
    }));
  });

  React.useEffect(() => {
    if (isOpen) {
      const defaultHoursPerUd = Math.round(horasTotales / (initialUds.length || 8));
      setUds(
        initialUds.map((u) => ({
          ...u,
          horasEstimadas: u.horasEstimadas || defaultHoursPerUd,
          sesionesEstimadas: u.sesionesEstimadas || Math.max(1, Math.round((u.horasEstimadas || defaultHoursPerUd) / 2)),
        }))
      );
    }
  }, [isOpen, initialUds, horasTotales]);

  if (!isOpen) return null;

  const totalAssignedHours = uds.reduce((acc, u) => acc + (u.horasEstimadas || 0), 0);

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      title: newTitle,
      fullCode: `UD${String(index + 1).padStart(2, "0")}. ${updated[index].bcCode}. ${newTitle}`,
    };
    setUds(updated);
  };

  const handleBcCodeChange = (index: number, newBc: string) => {
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      bcCode: newBc,
      fullCode: `UD${String(index + 1).padStart(2, "0")}. ${newBc}. ${updated[index].title}`,
    };
    setUds(updated);
  };

  const handleHoursChange = (index: number, hours: number) => {
    const val = Math.max(1, hours || 1);
    const updated = [...uds];
    updated[index] = {
      ...updated[index],
      horasEstimadas: val,
      sesionesEstimadas: Math.max(1, Math.round(val / 2)),
    };
    setUds(updated);
  };

  const handleDistributeEvenly = () => {
    if (uds.length === 0) return;
    const baseHours = Math.floor(horasTotales / uds.length);
    let remainder = horasTotales % uds.length;
    const updated = uds.map((u) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      const h = baseHours + extra;
      return {
        ...u,
        horasEstimadas: h,
        sesionesEstimadas: Math.max(1, Math.round(h / 2)),
      };
    });
    setUds(updated);
  };

  const handleDelete = (index: number) => {
    const filtered = uds.filter((_, i) => i !== index);
    const renumbered = filtered.map((item, idx) => ({
      ...item,
      number: idx + 1,
      id: `UD${String(idx + 1).padStart(2, "0")}`,
      fullCode: `UD${String(idx + 1).padStart(2, "0")}. ${item.bcCode}. ${item.title}`,
    }));
    setUds(renumbered);
  };

  const handleClearAll = () => {
    setUds([]);
  };

  const handleAddUd = () => {
    const nextNum = uds.length + 1;
    const defaultHours = Math.round(horasTotales / (nextNum || 1)) || 16;
    const newUd: SigreUDItem = {
      id: `UD${String(nextNum).padStart(2, "0")}`,
      number: nextNum,
      bcCode: `BC${nextNum}`,
      title: "Nueva Unidad Didáctica",
      fullCode: `UD${String(nextNum).padStart(2, "0")}. BC${nextNum}. Nueva Unidad Didáctica`,
      horasEstimadas: defaultHours,
      sesionesEstimadas: Math.max(1, Math.round(defaultHours / 2)),
      isPrl: false,
      status: "pending",
    };
    setUds([...uds, newUd]);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= uds.length) return;
    const reordered = [...uds];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const renumbered = reordered.map((item, idx) => ({
      ...item,
      number: idx + 1,
      id: `UD${String(idx + 1).padStart(2, "0")}`,
      fullCode: `UD${String(idx + 1).padStart(2, "0")}. ${item.bcCode}. ${item.title}`,
    }));
    setUds(renumbered);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface border border-border-default rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-default bg-alt/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-text-primary">
                Propuesta del Plan de Unidades Didácticas ({uds.length} UDs)
              </h3>
              <p className="text-xs text-text-muted">
                {moduloTitle || "Módulo Profesional"} — Revisa, ajusta horas lectivas y aprueba la estructura curricular
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-alt transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {/* Summary / Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-bold">Carga Total del Módulo:</span>
              </div>
              <span className="font-mono font-black text-amber-400 text-sm">{horasTotales}h</span>
            </div>

            <div className="p-3 bg-surface border border-border-default rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Horas Semanales:</span>
              </div>
              <span className="font-mono font-bold text-text-primary">{horasSemanales} h/sem</span>
            </div>

            <div className="p-3 bg-surface border border-border-default rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <span>Horas Asignadas:</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold ${
                    totalAssignedHours === horasTotales ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {totalAssignedHours} / {horasTotales}h
                </span>
                <button
                  type="button"
                  onClick={handleDistributeEvenly}
                  className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition-colors"
                  title="Repartir horas de manera uniforme"
                >
                  Equilibrar
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>Regla de Priorización PRL:</strong> Los bloques de contenido de Prevención de Riesgos y Seguridad están asignados como <strong>UD01</strong> con carácter transversal prioritario.
            </div>
          </div>

          {/* List of UDs */}
          {uds.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border-default rounded-2xl bg-alt/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">No hay Unidades Didácticas en el plan</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Has eliminado todas las UDs. Pulsa el botón inferior para añadir una nueva unidad didáctica.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddUd}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Añadir Primera Unidad Didáctica
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] text-text-muted">
                <span>{uds.length} {uds.length === 1 ? "Unidad configurada" : "Unidades configuradas"}</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hover:text-red-400 transition-colors cursor-pointer text-[10px] font-semibold"
                >
                  Vaciar lista
                </button>
              </div>

              {uds.map((ud, idx) => (
                <div
                  key={ud.id}
                  className="p-3 sm:p-4 bg-background border border-border-default rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, "up")}
                        className="text-text-muted hover:text-amber-400 disabled:opacity-20 transition-colors p-0.5"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === uds.length - 1}
                        onClick={() => handleMove(idx, "down")}
                        className="text-text-muted hover:text-amber-400 disabled:opacity-20 transition-colors p-0.5"
                      >
                        ▼
                      </button>
                    </div>

                    <span className="font-mono font-black text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md shrink-0">
                      {ud.id}
                    </span>

                    <input
                      type="text"
                      value={ud.bcCode}
                      onChange={(e) => handleBcCodeChange(idx, e.target.value)}
                      className="w-16 px-2 py-1 text-xs font-mono font-bold bg-surface border border-border-default rounded-lg text-text-primary focus:border-amber-500 focus:outline-none"
                      placeholder="BCx"
                    />

                    <input
                      type="text"
                      value={ud.title}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1 text-xs sm:text-sm font-semibold bg-surface border border-border-default rounded-lg text-text-primary focus:border-amber-500 focus:outline-none truncate"
                    />

                    {ud.isPrl && (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-300 font-bold rounded uppercase shrink-0">
                        PRL Prioritaria
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <div className="flex items-center gap-1 bg-surface border border-border-default px-2 py-1 rounded-lg text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={ud.horasEstimadas || 16}
                        onChange={(e) => handleHoursChange(idx, Number(e.target.value))}
                        className="w-12 bg-transparent text-text-primary font-mono font-bold text-center focus:outline-none"
                        title="Horas lectivas estimadas"
                      />
                      <span className="text-[10px] text-text-muted font-semibold">horas</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar UD"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uds.length > 0 && (
            <button
              type="button"
              onClick={handleAddUd}
              className="w-full py-2.5 border border-dashed border-border-default hover:border-amber-500 text-xs font-bold text-text-muted hover:text-amber-400 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Añadir Otra Unidad Didáctica
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-default bg-alt/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmPlan(uds)}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4" /> {uds.length === 0 ? "Guardar y Limpiar Plan (0 UDs)" : `Aprobar Plan (${uds.length} UDs • ${totalAssignedHours}h)`}
          </button>
        </div>
      </div>
    </div>
  );
};
