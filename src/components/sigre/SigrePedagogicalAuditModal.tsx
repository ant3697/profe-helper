import React from "react";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  HelpCircle,
  BrainCircuit,
  Scan,
  CheckCircle2,
  X,
  AlertTriangle,
  FileCheck2,
  Award,
  BookOpen,
} from "lucide-react";
import { SigrePedagogicalAuditResult, SigreUDItem } from "../../types/sigre";

interface SigrePedagogicalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: SigrePedagogicalAuditResult | null;
  ud: SigreUDItem | null;
}

export const SigrePedagogicalAuditModal: React.FC<SigrePedagogicalAuditModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  ud,
}) => {
  if (!isOpen || !auditResult || !ud) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Auditoría Pedagógica 6 Ejes
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprobada al 100%
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {ud.fullCode}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Score Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-emerald-950/40 border border-purple-500/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Índice Test-Wiseness
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {auditResult.testWisenessScore}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Neutralización de pistas
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Sesgo Opción Más Larga
              </span>
              <span className="text-2xl font-black text-purple-400">
                {auditResult.longestOptionWinRate}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Umbral normativo &le; 40%
              </span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Homogeneidad de Longitud
              </span>
              <span className="text-2xl font-black text-blue-400">
                {auditResult.homogeneityRate}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Equilibrio simétrico
              </span>
            </div>
          </div>

          {/* 6 Ejes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Test-Wiseness */}
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 1. Test-Wiseness & Glosario
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded">
                  PASADO
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Validada la ausencia de absolutismos ("siempre", "nunca"), eliminación de pistas gramaticales de género/número y garantía de opciones con longitud simétrica (&plusmn;10%).
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Glosario Técnico de Términos y Fórmulas activado.</span>
              </div>
            </div>

            {/* 2. CoT Anticolisión */}
            <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> 2. CoT Anticolisión
                </span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold rounded">
                  PASADO
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                "{auditResult.cotReasoning}"
              </p>
              <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>60 preguntas GIFT únicas sin colisión temática con otras UDs.</span>
              </div>
            </div>

            {/* 3. Práctica Intercalada */}
            <div className="p-4 bg-slate-950 border border-blue-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" /> 3. Práctica Intercalada
                </span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded">
                  4 Dominios
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Secuencia didáctica que alterna sistemáticamente entre 4 dimensiones profesionales:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-400 pl-2">
                {auditResult.interleavedDomains.map((dom, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{dom}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Active Recall */}
            <div className="p-4 bg-slate-950 border border-red-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> 4. Active Recall (Verificación)
                </span>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-300 font-mono text-[10px] font-bold rounded">
                  {auditResult.activeRecallCount} Puntos Activos
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Inclusión de cuadros de autoevaluación rápida intercalados en los epígrafes del tema (1.6) y cuestionario sumativo de 20 preguntas con solucionario técnico (1.7).
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Estimula la recuperación de memoria activa del alumno.</span>
              </div>
            </div>

            {/* 5. Mnemotecnias */}
            <div className="p-4 bg-slate-950 border border-orange-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-400 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4" /> 5. Mnemotecnias & Trucos
                </span>
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 font-mono text-[10px] font-bold rounded">
                  {auditResult.mnemonicsCount} Reglas Insertadas
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Reglas mnemotécnicas, acrónimos y claves mentales integradas en los apartados de alta complejidad conceptual y procedimientos normativos secuenciales.
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Optimiza la retención a largo plazo y fijación semántica.</span>
              </div>
            </div>

            {/* 6. Anti-Visión de Túnel */}
            <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Scan className="w-4 h-4" /> 6. Anti-Visión de Túnel
                </span>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold rounded">
                  100% Cobertura
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {auditResult.antiTunelCoverage}
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Equilibrio entre teoría, diagramas Mermaid, OPML y micro-app HDI.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Marco de Calidad Psicométrica y Curricular SIGRE v6.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Auditoría
          </button>
        </div>
      </div>
    </div>
  );
};
