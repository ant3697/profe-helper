import React from "react";
import { Bot } from "lucide-react";

interface CotAuditCardProps {
  cotText: string;
}

export const CotAuditCard: React.FC<CotAuditCardProps> = ({ cotText }) => {
  if (!cotText) return null;

  return (
    <div className="p-4 sm:p-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl shadow-xs no-print space-y-2 relative overflow-hidden">
      <div className="flex items-center gap-2 text-purple-400">
        <Bot className="w-5 h-5 shrink-0" />
        <strong className="text-xs uppercase tracking-wider font-extrabold">
          Auditoría Anticolisión (Razonamiento Interno de la IA)
        </strong>
      </div>
      <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap pl-7">
        {cotText}
      </div>
    </div>
  );
};
