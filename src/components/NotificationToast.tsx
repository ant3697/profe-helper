import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface NotificationToastProps {
  message: string | null;
  isError?: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  isError = false,
}) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-semibold ${
          isError
            ? "bg-red-950/90 text-red-200 border-red-500/50"
            : "bg-surface/90 text-text-primary border-amber-500/40"
        }`}
      >
        {isError ? (
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};
