import { useState } from "react";
import {
  AISettingsState,
  DEFAULT_AI_PROVIDERS,
} from "../types/aiProviders";

export function useAISettings() {
  const [aiSettings, setAISettings] = useState<AISettingsState>(() => {
    try {
      const saved = localStorage.getItem("docuexam_ai_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedProviders = {
          ...DEFAULT_AI_PROVIDERS,
          ...(parsed.providers || {}),
        };

        // Ensure availableModels and obsolete selectedModel are sanitized for Gemini
        if (mergedProviders.gemini) {
          mergedProviders.gemini.availableModels = DEFAULT_AI_PROVIDERS.gemini.availableModels;
          const validIds = DEFAULT_AI_PROVIDERS.gemini.availableModels.map((m) => m.id);
          if (
            !validIds.includes(mergedProviders.gemini.selectedModel) ||
            mergedProviders.gemini.selectedModel.includes("2.5") ||
            mergedProviders.gemini.selectedModel.includes("2.0") ||
            mergedProviders.gemini.selectedModel.includes("1.5")
          ) {
            mergedProviders.gemini.selectedModel = "gemini-3.6-flash";
          }
        }
        if (mergedProviders.temp_demo) {
          mergedProviders.temp_demo.availableModels = DEFAULT_AI_PROVIDERS.temp_demo.availableModels;
          const validIds = DEFAULT_AI_PROVIDERS.temp_demo.availableModels.map((m) => m.id);
          if (
            !validIds.includes(mergedProviders.temp_demo.selectedModel) ||
            mergedProviders.temp_demo.selectedModel.includes("2.5") ||
            mergedProviders.temp_demo.selectedModel.includes("2.0")
          ) {
            mergedProviders.temp_demo.selectedModel = "gemini-3.6-flash";
          }
        }

        return {
          activeProviderId: parsed.activeProviderId || "gemini",
          providers: mergedProviders,
        };
      }
    } catch (e) {
      console.warn("Failed to parse saved AI settings:", e);
    }
    return {
      activeProviderId: "gemini",
      providers: DEFAULT_AI_PROVIDERS,
    };
  });

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const handleSaveAISettings = (newSettings: AISettingsState) => {
    setAISettings(newSettings);
    try {
      localStorage.setItem("docuexam_ai_settings", JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Failed to persist AI settings:", e);
    }
  };

  const getActiveProviderConfig = () => {
    return aiSettings.providers[aiSettings.activeProviderId] || aiSettings.providers.gemini;
  };

  return {
    aiSettings,
    setAISettings,
    isAIModalOpen,
    setIsAIModalOpen,
    handleSaveAISettings,
    getActiveProviderConfig,
  };
}
