import React from "react";
import { FormatTab } from "../types/exam";

interface FormatTabsProps {
  currentTab: FormatTab;
  onTabChange: (tab: FormatTab) => void;
}

export const FormatTabs: React.FC<FormatTabsProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs: { id: FormatTab; label: string }[] = [
    { id: "interactive", label: "General (Interactivo)" },
    { id: "gift", label: ".GIFT (Moodle/Anki)" },
    { id: "txt-full", label: "TXT (Completo)" },
    { id: "txt-correct", label: "TXT (Soluciones)" },
    { id: "json", label: ".JSON (Backup)" },
  ];

  return (
    <div className="flex overflow-x-auto pb-3 gap-2 border-b border-border-default no-scrollbar no-print">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
            currentTab === tab.id
              ? "bg-surface border border-border-strong text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
