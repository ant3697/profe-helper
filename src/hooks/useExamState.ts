import { useState } from "react";
import {
  ExamData,
  FormatTab,
  EvaluationMode,
  QuestionFilter,
  GenerationTokenUsage,
  ThematicGroup,
  DifficultyLevel,
  CreativityStyle,
} from "../types/exam";
import { DEFAULT_THEMATICS } from "../utils/fileHelpers";

export function useExamState() {
  // Exam Data & View State
  const [currentExamData, setCurrentExamData] = useState<ExamData | null>(null);
  const [loadedFileName, setLoadedFileName] = useState("Examen Generado");
  const [currentTab, setCurrentTab] = useState<FormatTab>("interactive");
  const [evalMode, setEvalMode] = useState<EvaluationMode>("instant");
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);

  // Exam Generation Configuration State
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("standard");
  const [creativityStyle, setCreativityStyle] = useState<CreativityStyle>("literal");
  const [numQuestions, setNumQuestions] = useState(12);
  const [batchCount, setBatchCount] = useState(1);
  const [customPrompt, setCustomPrompt] = useState("");
  const [accumulatedTokens, setAccumulatedTokens] = useState<number>(() => {
    return parseInt(localStorage.getItem("docuexam_tokens") || "0", 10);
  });

  // Thematics State
  const [thematics, setThematics] = useState<ThematicGroup[]>(() => {
    try {
      const saved = localStorage.getItem("docuexam_thematics");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Error reading saved thematics:", e);
    }
    return DEFAULT_THEMATICS;
  });

  // Display & Filtering Options
  const [hideDistractors, setHideDistractors] = useState(false);
  const [highlightCorrect, setHighlightCorrect] = useState(false);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [isCotVisible, setIsCotVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QuestionFilter>("all");

  // Token & Usage Stats
  const [generationModel, setGenerationModel] = useState<string | undefined>(undefined);
  const [lastUsage, setLastUsage] = useState<GenerationTokenUsage | null>(null);

  const handleUpdateThematics = (groups: ThematicGroup[]) => {
    setThematics(groups);
    try {
      localStorage.setItem("docuexam_thematics", JSON.stringify(groups));
    } catch (e) {
      console.warn("Error persisting thematics:", e);
    }
  };

  const addTokensToAccumulated = (newTokens: number) => {
    setAccumulatedTokens((prev) => {
      const total = prev + newTokens;
      try {
        localStorage.setItem("docuexam_tokens", total.toString());
      } catch (e) {
        console.warn("Error saving accumulated tokens:", e);
      }
      return total;
    });
  };

  const resetExamState = () => {
    setCurrentExamData(null);
    setIsExamSubmitted(false);
    setLastUsage(null);
    setGenerationModel(undefined);
  };

  return {
    currentExamData,
    setCurrentExamData,
    loadedFileName,
    setLoadedFileName,
    currentTab,
    setCurrentTab,
    evalMode,
    setEvalMode,
    isExamSubmitted,
    setIsExamSubmitted,
    difficulty,
    setDifficulty,
    creativityStyle,
    setCreativityStyle,
    numQuestions,
    setNumQuestions,
    batchCount,
    setBatchCount,
    customPrompt,
    setCustomPrompt,
    accumulatedTokens,
    setAccumulatedTokens,
    addTokensToAccumulated,
    thematics,
    setThematics,
    handleUpdateThematics,
    hideDistractors,
    setHideDistractors,
    highlightCorrect,
    setHighlightCorrect,
    showAllFeedback,
    setShowAllFeedback,
    isCotVisible,
    setIsCotVisible,
    activeFilter,
    setActiveFilter,
    generationModel,
    setGenerationModel,
    lastUsage,
    setLastUsage,
    resetExamState,
  };
}
