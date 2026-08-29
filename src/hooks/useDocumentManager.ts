import { useState } from "react";
import { UploadedDocument } from "../types/exam";
import { extractTextFromFile } from "../utils/pdfExtractor";

export function useDocumentManager() {
  const [baseMode, setBaseMode] = useState<"files" | "text">("files");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [selectedBaseDoc, setSelectedBaseDoc] = useState<UploadedDocument | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [docViewerPreferredMode, setDocViewerPreferredMode] = useState<"html" | "markdown" | "plain" | undefined>(undefined);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState("");

  const handleFileUpload = async (files: FileList | File[]) => {
    setIsProcessingFiles(true);
    setProcessingStatusText("Procesando documentos...");
    const newDocs: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatusText(`Extrayendo texto de: ${file.name}`);
      try {
        const text = await extractTextFromFile(file);
        newDocs.push({
          id: `doc_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          role: "base",
          timestamp: Date.now(),
          size: file.size,
          text,
          active: true,
        });
      } catch (err: any) {
        console.error(`Error procesando el archivo ${file.name}:`, err);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newDocs]);
    setIsProcessingFiles(false);
    setProcessingStatusText("");
    return newDocs;
  };

  const removeDocument = (id: string) => {
    setUploadedFiles((prev) => prev.filter((doc) => doc.id !== id));
    if (selectedDocumentId === id) {
      setSelectedDocumentId(null);
      setSelectedBaseDoc(null);
    }
  };

  const toggleDocumentActive = (id: string) => {
    setUploadedFiles((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, active: !doc.active } : doc))
    );
  };

  return {
    baseMode,
    setBaseMode,
    uploadedFiles,
    setUploadedFiles,
    pastedText,
    setPastedText,
    selectedBaseDoc,
    setSelectedBaseDoc,
    selectedDocumentId,
    setSelectedDocumentId,
    docViewerPreferredMode,
    setDocViewerPreferredMode,
    isProcessingFiles,
    setIsProcessingFiles,
    processingStatusText,
    setProcessingStatusText,
    handleFileUpload,
    removeDocument,
    toggleDocumentActive,
  };
}
