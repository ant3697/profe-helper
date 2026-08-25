import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Trash2,
  Eye,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
} from "lucide-react";
import { SigreRagDocument } from "../../types/sigre";
import { extractTextFromFile } from "../../utils/pdfExtractor";

interface SigreCurriculumDropzoneProps {
  documents: SigreRagDocument[];
  onDocumentsChange: (docs: SigreRagDocument[]) => void;
  onExtractCurriculumWithAI: (docText: string, docName?: string) => Promise<void>;
  isAnalyzingAI: boolean;
  onViewDocument: (doc: SigreRagDocument) => void;
}

export const SigreCurriculumDropzone: React.FC<SigreCurriculumDropzoneProps> = ({
  documents,
  onDocumentsChange,
  onExtractCurriculumWithAI,
  isAnalyzingAI,
  onViewDocument,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [extractingStatus, setExtractingStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get file type icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="w-5 h-5 text-red-400" />;
    if (ext === "docx" || ext === "doc") return <FileText className="w-5 h-5 text-blue-400" />;
    if (ext === "txt" || ext === "md") return <FileCode className="w-5 h-5 text-emerald-400" />;
    if (ext === "xml" || ext === "gift") return <FileSpreadsheet className="w-5 h-5 text-amber-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setExtractingStatus("Procesando y extrayendo texto...");
    const newDocs: SigreRagDocument[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setExtractingStatus(`Extrayendo contenido de ${file.name} (${i + 1}/${files.length})...`);
        const text = await extractTextFromFile(file, (msg) => setExtractingStatus(msg));

        if (text && text.trim()) {
          const wordCount = text.trim().split(/\s+/).length;
          const ext = file.name.split(".").pop()?.toLowerCase() || "doc";
          const newDoc: SigreRagDocument = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: file.name,
            size: file.size,
            type: ext,
            text: text.trim(),
            wordCount,
            uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          newDocs.push(newDoc);
        }
      }

      if (newDocs.length > 0) {
        const updatedDocs = [...documents, ...newDocs];
        onDocumentsChange(updatedDocs);

        // Automatically trigger AI extraction using the combined or most recent text
        const combinedText = newDocs.map((d) => d.text).join("\n\n---\n\n");
        setExtractingStatus("Extracción de texto completada. Analizando currículo con IA...");
        await onExtractCurriculumWithAI(combinedText, newDocs[0].name);
      }
    } catch (err: any) {
      console.error("Error al procesar archivos curriculares:", err);
      alert(`Error al procesar el archivo: ${err.message || err}`);
    } finally {
      setExtractingStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDocumentsChange(documents.filter((d) => d.id !== id));
  };

  const handleExtractSingleDoc = async (doc: SigreRagDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    await onExtractCurriculumWithAI(doc.text, doc.name);
  };

  const totalWords = documents.reduce((acc, curr) => acc + curr.wordCount, 0);

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-amber-400 bg-amber-500/10 scale-[1.01] shadow-lg shadow-amber-500/20"
            : "border-slate-700 hover:border-amber-500/50 bg-slate-900/60 hover:bg-slate-900"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.rtf,.gift,.xml"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`p-3.5 rounded-2xl transition-colors ${
              isDragOver ? "bg-amber-500 text-black animate-bounce" : "bg-slate-800 text-amber-400"
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              {isDragOver
                ? "¡Suelta los documentos curriculares aquí!"
                : "Arrastra y suelta aquí el currículo (PDF, DOCX, TXT, MD...)"}
            </h4>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              La IA analizará el documento oficial (Real Decreto, Orden Autonómica o Programación) y extraerá automáticamente el <strong className="text-amber-400 font-bold">Desglose Curricular (Bloques, RAs y Criterios)</strong>.
            </p>
          </div>

          {/* Supported formats chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold">
              PDF (Digital o Escaneado)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
              Word (DOCX / DOC)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              Texto / Markdown (.TXT, .MD)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
              Moodle GIFT / XML
            </span>
          </div>
        </div>

        {/* Real-time Extraction Status */}
        {extractingStatus && (
          <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center gap-2.5 text-amber-300 text-xs font-bold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>{extractingStatus}</span>
          </div>
        )}
      </div>

      {/* Uploaded Reference Documents (Documentos de Consulta Curricular RAG) */}
      {documents.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Documentos de Consulta Curricular ({documents.length})
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                {totalWords.toLocaleString()} palabras indexadas
              </span>
            </div>

            <button
              type="button"
              disabled={isAnalyzingAI}
              onClick={() => {
                const combined = documents.map((d) => d.text).join("\n\n---\n\n");
                onExtractCurriculumWithAI(combined, "Documentos Curriculares");
              }}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isAnalyzingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extrayendo con IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Re-extraer Todo con IA
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onViewDocument(doc)}
                className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 group transition-all cursor-pointer hover:bg-slate-950"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-slate-900 rounded-lg shrink-0 group-hover:scale-105 transition-transform">
                    {getFileIcon(doc.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{doc.wordCount.toLocaleString()} palabras</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">Indexado</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(doc);
                    }}
                    title="Ver texto del documento"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isAnalyzingAI}
                    onClick={(e) => handleExtractSingleDoc(doc, e)}
                    title="Extraer desglose curricular de este documento"
                    className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                    title="Eliminar documento de consulta"
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
