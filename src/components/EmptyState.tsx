import React, { useState, useRef } from "react";
import { FileText, UploadCloud, Upload, Camera } from "lucide-react";

interface EmptyStateProps {
  onUploadFiles: (files: FileList | File[]) => void;
  onOpenThematicBuilder: () => void;
  onOpenOmrScanner?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadFiles,
  onOpenOmrScanner,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center my-auto min-h-[460px] space-y-6">
      {/* Document Icon */}
      <div className="w-16 h-16 rounded-2xl bg-alt border border-border-default flex items-center justify-center text-text-muted shadow-inner">
        <FileText className="w-8 h-8 stroke-[1.5]" />
      </div>

      {/* Title & Description */}
      <div className="max-w-md space-y-2">
        <h3 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
          Área de Examen Vacía
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          Configura las opciones en el panel izquierdo y haz clic en &quot;Generar Examen&quot; para obtener un simulacro completo de la Especialidad 205.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".gift,.txt,.json,.html,.htm,.md,.pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Import Card */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-lg p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group select-none bg-alt ${
          isDragOver
            ? "border-amber-500 bg-amber-500/10 ring-4 ring-amber-500/20 scale-[1.01]"
            : "border-border-default hover:border-amber-500/70"
        }`}
      >
        <UploadCloud
          className={`w-8 h-8 transition-transform pointer-events-none ${
            isDragOver ? "text-amber-400 scale-125 animate-bounce" : "text-amber-500 group-hover:scale-110"
          }`}
        />
        <p className="text-xs font-bold text-text-primary pointer-events-none">
          {isDragOver
            ? "¡Suelta el archivo aquí para abrirlo!"
            : "Arrastra o haz clic aquí para abrir un examen"}
        </p>
        <p className="text-[11px] text-text-muted pointer-events-none">
          Formatos aceptados: <b className="text-text-secondary">.GIFT, .JSON</b>
        </p>

        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Importar Examen</span>
          </button>

          {onOpenOmrScanner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenOmrScanner();
              }}
              className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 px-4 py-2 rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Corregir OMR con Móvil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


