import React, { useState, useEffect } from "react";
import {
  ZipGradeQuiz,
  ZipGradeClass,
  ZipGradeStudent,
  ZipGradeTag,
  OmrScanResult,
} from "../../types/omr";
import { ExamData } from "../../types/exam";
import {
  INITIAL_ZIPGRADE_CLASSES,
  INITIAL_ZIPGRADE_STUDENTS,
  INITIAL_ZIPGRADE_TAGS,
  INITIAL_ZIPGRADE_QUIZZES,
} from "../../data/initialZipgradeData";
import { getAnswerKeyFromExam, OMR_LETTERS } from "../../utils/omrProcessor";
import { EditQuizModal } from "./EditQuizModal";
import { QuizDetailView } from "./QuizDetailView";
import { QuizKeyEditor } from "./QuizKeyEditor";
import { LiveScannerView } from "./LiveScannerView";
import { ReviewDocumentsView } from "./ReviewDocumentsView";
import { ItemAnalysisView } from "./ItemAnalysisView";
import { TagReportView } from "./TagReportView";
import { ClassesManagerView } from "./ClassesManagerView";
import { StudentsManagerView } from "./StudentsManagerView";
import { TagsManagerView } from "./TagsManagerView";

import {
  CheckSquare,
  Users,
  User,
  Tag,
  Cloud,
  ChevronLeft,
  X,
  Search,
  Plus,
  ArrowUpDown,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Share2,
} from "lucide-react";

interface ZipgradeSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  examData: ExamData | null;
  examTitle: string;
  onShowToast: (msg: string, isError?: boolean) => void;
}

type BottomTab = "quizzes" | "classes" | "students" | "tags" | "account";
type QuizSubView =
  | "quiz_list"
  | "quiz_menu"
  | "quiz_key"
  | "live_scanner"
  | "review_docs"
  | "item_analysis"
  | "tag_report";

export const ZipgradeSuiteModal: React.FC<ZipgradeSuiteModalProps> = ({
  isOpen,
  onClose,
  examData,
  examTitle,
  onShowToast,
}) => {
  // Navigation state
  const [bottomTab, setBottomTab] = useState<BottomTab>("quizzes");
  const [quizSubView, setQuizSubView] = useState<QuizSubView>("quiz_list");
  const [activeQuizId, setActiveQuizId] = useState<string | null>("quiz_ra04_a");
  const [selectedDocIdToReview, setSelectedDocIdToReview] = useState<string | null>(null);

  // Persistent / Local storage state
  const [quizzes, setQuizzes] = useState<ZipGradeQuiz[]>(() => {
    const saved = localStorage.getItem("zipgrade_quizzes_data");
    return saved ? JSON.parse(saved) : INITIAL_ZIPGRADE_QUIZZES;
  });

  const [classes, setClasses] = useState<ZipGradeClass[]>(() => {
    const saved = localStorage.getItem("zipgrade_classes_data");
    return saved ? JSON.parse(saved) : INITIAL_ZIPGRADE_CLASSES;
  });

  const [students, setStudents] = useState<ZipGradeStudent[]>(() => {
    const saved = localStorage.getItem("zipgrade_students_data");
    return saved ? JSON.parse(saved) : INITIAL_ZIPGRADE_STUDENTS;
  });

  const [tags, setTags] = useState<ZipGradeTag[]>(() => {
    const saved = localStorage.getItem("zipgrade_tags_data");
    return saved ? JSON.parse(saved) : INITIAL_ZIPGRADE_TAGS;
  });

  // Edit / Create Quiz Modal state
  const [isEditQuizModalOpen, setIsEditQuizModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState<ZipGradeQuiz | null>(null);

  // Search & Sorting for Quizzes list
  const [quizSearchTerm, setQuizSearchTerm] = useState("");
  const [quizSortBy, setQuizSortBy] = useState<"date" | "name">("date");

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("zipgrade_quizzes_data", JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem("zipgrade_classes_data", JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem("zipgrade_students_data", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("zipgrade_tags_data", JSON.stringify(tags));
  }, [tags]);

  if (!isOpen) return null;

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || quizzes[0] || null;

  // Import Active Exam as Quiz
  const handleImportCurrentExam = () => {
    if (!examData) return;
    const ansKey = getAnswerKeyFromExam(examData);
    const totalQ = Object.keys(ansKey).length || 30;

    const newQuiz: ZipGradeQuiz = {
      id: `quiz_imported_${Date.now()}`,
      name: examTitle || "Examen Importado",
      sheetType: totalQ <= 20 ? "20 Question Form" : totalQ <= 50 ? "50 Question Form (2)" : "100 Question Form",
      date: new Date().toISOString().split("T")[0],
      folder: "Main Folder",
      classes: classes.length > 0 ? [classes[0].name] : ["General"],
      tags: ["RA04"],
      totalQuestions: totalQ,
      penaltyPerWrong: 0.33,
      activeKeyId: "key_1",
      keys: [
        {
          id: "key_1",
          name: "A: PRINCIPAL",
          answers: ansKey,
          points: Object.fromEntries(Array.from({ length: totalQ }, (_, i) => [i + 1, 1])),
          tags: {},
        },
      ],
      scannedDocuments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setQuizzes([newQuiz, ...quizzes]);
    setActiveQuizId(newQuiz.id);
    setQuizSubView("quiz_menu");
    onShowToast?.(`✓ Quiz "${newQuiz.name}" creado con las ${totalQ} preguntas del examen`);
  };

  const handleUpdateQuiz = (updated: ZipGradeQuiz) => {
    setQuizzes(quizzes.map((q) => (q.id === updated.id ? updated : q)));
  };

  const handleSaveNewOrEditedQuiz = (savedQuiz: ZipGradeQuiz) => {
    const exists = quizzes.some((q) => q.id === savedQuiz.id);
    if (exists) {
      setQuizzes(quizzes.map((q) => (q.id === savedQuiz.id ? savedQuiz : q)));
    } else {
      setQuizzes([savedQuiz, ...quizzes]);
    }
    setActiveQuizId(savedQuiz.id);
    setQuizSubView("quiz_menu");
    onShowToast?.(`Quiz "${savedQuiz.name}" guardado correctamente`);
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizzes(quizzes.filter((q) => q.id !== quizId));
    setQuizSubView("quiz_list");
    onShowToast?.("Quiz eliminado");
  };

  const handleDuplicateQuiz = (quiz: ZipGradeQuiz) => {
    const copy: ZipGradeQuiz = {
      ...quiz,
      id: `quiz_${Date.now()}_copy`,
      name: `${quiz.name} (Copia)`,
      scannedDocuments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setQuizzes([copy, ...quizzes]);
    setActiveQuizId(copy.id);
    onShowToast?.(`Copia de "${quiz.name}" creada`);
  };

  // Header Title Resolver
  const getHeaderTitle = () => {
    if (bottomTab === "classes") return "CLASES";
    if (bottomTab === "students") return "ESTUDIANTES";
    if (bottomTab === "tags") return "ETIQUETAS (RA / CE)";
    if (bottomTab === "account") return "RESPALDO Y ESTADÍSTICAS";

    // bottomTab === "quizzes"
    if (quizSubView === "quiz_list") return "EXÁMENES";
    if (quizSubView === "quiz_menu") return "MENÚ DE EXAMEN";
    if (quizSubView === "quiz_key") return "CLAVE DE RESPUESTAS";
    if (quizSubView === "live_scanner") return "ESCÁNER OMR EN VIVO";
    if (quizSubView === "review_docs") return "REVISAR DOCUMENTOS";
    if (quizSubView === "item_analysis") return "ANÁLISIS DE ELEMENTOS";
    if (quizSubView === "tag_report") return "INFORME DE ETIQUETAS";
    return "CORRECTOR OMR";
  };

  const showBackButton = bottomTab === "quizzes" && quizSubView !== "quiz_list";

  const handleBack = () => {
    if (quizSubView === "quiz_menu") {
      setQuizSubView("quiz_list");
    } else {
      setQuizSubView("quiz_menu");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0e14] rounded-3xl shadow-2xl border border-[#232d42] w-full max-w-2xl h-[92vh] max-h-[850px] overflow-hidden flex flex-col relative select-none text-slate-100">
        
        {/* Top Header Bar with AI Exams Builder Dark/Amber styling */}
        <div className="bg-[#10141e] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shadow-md shrink-0 z-30 border-b border-[#232d42]">
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Volver"
              >
                <ChevronLeft className="w-5 h-5 text-amber-400" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/20">
                A
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wide uppercase text-white flex items-center gap-2">
                <span>AI</span>
                <span className="text-amber-400">{getHeaderTitle()}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick sync current active exam if not in quiz yet */}
            {examData && (
              <button
                type="button"
                onClick={handleImportCurrentExam}
                className="text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-amber-500/30 shadow-xs"
                title="Cargar el examen que tienes abierto en el editor"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Importar Examen Actual</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Cerrar corrector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0b0e14]">
          {/* TAB 1: QUIZZES */}
          {bottomTab === "quizzes" && (
            <>
              {/* QUIZ LIST VIEW */}
              {quizSubView === "quiz_list" && (
                <div className="relative flex flex-col h-full bg-[#0b0e14]">
                  {/* Filter & Sort Bar */}
                  <div className="p-3.5 bg-[#10141e] border-b border-[#232d42] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Ordenar por:</span>
                      <select
                        value={quizSortBy}
                        onChange={(e) => setQuizSortBy(e.target.value as any)}
                        className="flex-1 py-1.5 px-3 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 font-bold outline-hidden cursor-pointer focus:border-amber-500"
                      >
                        <option value="date">Fecha</option>
                        <option value="name">Nombre de la Prueba</option>
                      </select>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar prueba por nombre..."
                        value={quizSearchTerm}
                        onChange={(e) => setQuizSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#26334a] bg-[#161c28] text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Quizzes List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]">
                    {quizzes
                      .filter((q) => q.name.toLowerCase().includes(quizSearchTerm.toLowerCase()))
                      .sort((a, b) => {
                        if (quizSortBy === "name") return a.name.localeCompare(b.name);
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                      })
                      .map((q) => (
                        <div
                          key={q.id}
                          onClick={() => {
                            setActiveQuizId(q.id);
                            setQuizSubView("quiz_menu");
                          }}
                          className="p-4 hover:bg-[#161c28]/60 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                              {q.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-400 font-medium">
                                {q.classes.join(", ") || "Sin clase"}
                              </span>
                              <span className="text-[10px] text-slate-500">·</span>
                              <span className="text-[11px] text-amber-400 font-semibold">
                                {q.totalQuestions} Preguntas
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-lg shadow-xs">
                              {q.scannedDocuments.length} doc{q.scannedDocuments.length === 1 ? "" : "s"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {q.date}
                            </span>
                          </div>
                        </div>
                      ))}

                    {quizzes.length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                        <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
                        <p className="text-sm font-bold text-slate-200">No hay pruebas creadas</p>
                        <p className="text-xs mt-1">Pulse el botón "+ NUEVO EXAMEN" para comenzar.</p>
                      </div>
                    )}
                  </div>

                  {/* Floating Action Button: + NUEVO EXAMEN */}
                  <div className="absolute bottom-6 right-6 z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizToEdit(null);
                        setIsEditQuizModalOpen(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-3 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center gap-2 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ NUEVO EXAMEN</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QUIZ MENU VIEW */}
              {quizSubView === "quiz_menu" && activeQuiz && (
                <QuizDetailView
                  quiz={activeQuiz}
                  onEditQuiz={() => {
                    setQuizToEdit(activeQuiz);
                    setIsEditQuizModalOpen(true);
                  }}
                  onOpenKeyEditor={() => setQuizSubView("quiz_key")}
                  onOpenLiveScanner={() => setQuizSubView("live_scanner")}
                  onOpenReviewDocuments={() => setQuizSubView("review_docs")}
                  onOpenItemAnalysis={() => setQuizSubView("item_analysis")}
                  onOpenTagReport={() => setQuizSubView("tag_report")}
                  onShowToast={onShowToast}
                />
              )}

              {/* QUIZ KEY EDITOR */}
              {quizSubView === "quiz_key" && activeQuiz && (
                <QuizKeyEditor
                  quiz={activeQuiz}
                  onUpdateQuiz={handleUpdateQuiz}
                  onScanKeyWithCamera={() => setQuizSubView("live_scanner")}
                  availableTags={tags.map((t) => t.name)}
                  onShowToast={onShowToast}
                />
              )}

              {/* LIVE SCANNER CAMERA VIEW */}
              {quizSubView === "live_scanner" && activeQuiz && (
                <LiveScannerView
                  quiz={activeQuiz}
                  registeredStudents={students}
                  onDocumentScanned={(doc: OmrScanResult) => {
                    const updatedDocs = [doc, ...activeQuiz.scannedDocuments.filter((d) => d.id !== doc.id)];
                    handleUpdateQuiz({
                      ...activeQuiz,
                      scannedDocuments: updatedDocs,
                    });
                  }}
                  onDeleteDocument={(docId) => {
                    const updatedDocs = activeQuiz.scannedDocuments.filter((d) => d.id !== docId);
                    handleUpdateQuiz({
                      ...activeQuiz,
                      scannedDocuments: updatedDocs,
                    });
                  }}
                  onUpdateDocument={(doc) => {
                    const updatedDocs = activeQuiz.scannedDocuments.map((d) => (d.id === doc.id ? doc : d));
                    handleUpdateQuiz({
                      ...activeQuiz,
                      scannedDocuments: updatedDocs,
                    });
                  }}
                  onReviewDocument={(docId) => {
                    setSelectedDocIdToReview(docId);
                    setQuizSubView("review_docs");
                  }}
                  onBack={() => setQuizSubView("quiz_menu")}
                  onShowToast={onShowToast}
                />
              )}

              {/* REVIEW SCANNED DOCUMENTS */}
              {quizSubView === "review_docs" && activeQuiz && (
                <ReviewDocumentsView
                  quiz={activeQuiz}
                  initialDocId={selectedDocIdToReview}
                  onUpdateQuiz={handleUpdateQuiz}
                  onShowToast={onShowToast}
                />
              )}

              {/* ITEM ANALYSIS VIEW */}
              {quizSubView === "item_analysis" && activeQuiz && (
                <ItemAnalysisView quiz={activeQuiz} />
              )}

              {/* TAG REPORT VIEW */}
              {quizSubView === "tag_report" && activeQuiz && (
                <TagReportView quiz={activeQuiz} />
              )}
            </>
          )}

          {/* TAB 2: CLASSES */}
          {bottomTab === "classes" && (
            <ClassesManagerView
              classes={classes}
              quizzes={quizzes}
              students={students}
              onAddClass={(newCls) => setClasses([...classes, newCls])}
              onDeleteClass={(clsId) => setClasses(classes.filter((c) => c.id !== clsId))}
              onSelectClassForQuizzes={(className) => {
                setBottomTab("quizzes");
                setQuizSubView("quiz_list");
                setQuizSearchTerm(className);
              }}
            />
          )}

          {/* TAB 3: STUDENTS */}
          {bottomTab === "students" && (
            <StudentsManagerView
              students={students}
              classes={classes}
              onAddStudent={(newStd) => setStudents([...students, newStd])}
              onDeleteStudent={(stdId) => setStudents(students.filter((s) => s.id !== stdId))}
            />
          )}

          {/* TAB 4: TAGS (RA / CE) */}
          {bottomTab === "tags" && (
            <TagsManagerView
              tags={tags}
              onAddTag={(newTag) => setTags([...tags, newTag])}
              onDeleteTag={(tagId) => setTags(tags.filter((t) => t.id !== tagId))}
            />
          )}

          {/* TAB 5: ACCOUNT & STORAGE */}
          {bottomTab === "account" && (
            <div className="p-6 overflow-y-auto space-y-4 bg-[#0b0e14]">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center space-y-2">
                <Cloud className="w-10 h-10 mx-auto text-amber-400" />
                <h3 className="text-base font-black text-white">Almacenamiento Local y Respaldo</h3>
                <p className="text-xs text-slate-300">
                  Todos tus exámenes, clases, estudiantes y hojas escaneadas se guardan de forma persistente y están listos para exportar a CSV/Excel.
                </p>
              </div>

              <div className="bg-[#121620] rounded-2xl border border-[#232d42] divide-y divide-[#1e293b] text-sm">
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Estado del motor OMR</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Activo (100% Offline / Online)
                  </span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Exámenes Registrados</span>
                  <span className="font-bold text-slate-100">{quizzes.length}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Grupos y Clases</span>
                  <span className="font-bold text-slate-100">{classes.length}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Estudiantes en Roster</span>
                  <span className="font-bold text-slate-100">{students.length}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuizzes(INITIAL_ZIPGRADE_QUIZZES);
                  setClasses(INITIAL_ZIPGRADE_CLASSES);
                  setStudents(INITIAL_ZIPGRADE_STUDENTS);
                  setTags(INITIAL_ZIPGRADE_TAGS);
                  onShowToast?.("Datos de prueba restaurados");
                }}
                className="w-full py-3 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-all cursor-pointer shadow-xs"
              >
                Restaurar Datos de Demostración (TEMINS 25_26, etc.)
              </button>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar with Dark Amber styling */}
        <div className="border-t border-[#232d42] bg-[#10141e] px-3 py-2 flex items-center justify-around shrink-0 z-20">
          <button
            type="button"
            onClick={() => {
              setBottomTab("quizzes");
              if (quizSubView !== "quiz_list") setQuizSubView("quiz_list");
            }}
            className={`flex flex-col items-center py-1.5 px-3 sm:px-4 rounded-xl transition-all cursor-pointer ${
              bottomTab === "quizzes"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">Exámenes</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomTab("classes")}
            className={`flex flex-col items-center py-1.5 px-3 sm:px-4 rounded-xl transition-all cursor-pointer ${
              bottomTab === "classes"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">Clases</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomTab("students")}
            className={`flex flex-col items-center py-1.5 px-3 sm:px-4 rounded-xl transition-all cursor-pointer ${
              bottomTab === "students"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">Estudiantes</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomTab("tags")}
            className={`flex flex-col items-center py-1.5 px-3 sm:px-4 rounded-xl transition-all cursor-pointer ${
              bottomTab === "tags"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            }`}
          >
            <Tag className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">Etiquetas</span>
          </button>

          <button
            type="button"
            onClick={() => setBottomTab("account")}
            className={`flex flex-col items-center py-1.5 px-3 sm:px-4 rounded-xl transition-all cursor-pointer ${
              bottomTab === "account"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            }`}
          >
            <Cloud className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">Respaldo</span>
          </button>
        </div>

        {/* Edit / Create Quiz Modal */}
        <EditQuizModal
          isOpen={isEditQuizModalOpen}
          onClose={() => setIsEditQuizModalOpen(false)}
          onSave={handleSaveNewOrEditedQuiz}
          onDelete={handleDeleteQuiz}
          onDuplicate={handleDuplicateQuiz}
          initialQuiz={quizToEdit}
          availableClasses={classes.map((c) => c.name)}
          availableTags={tags.map((t) => t.name)}
        />
      </div>
    </div>
  );
};
