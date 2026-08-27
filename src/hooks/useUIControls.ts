import { useState, useEffect } from "react";

export function useUIControls() {
  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("docuexam_theme") as "dark" | "light") || "dark";
  });

  // Fullscreen & Focus Mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isExtendedMode, setIsExtendedMode] = useState(() => {
    return localStorage.getItem("docuexam_extended") === "true";
  });

  // App Navigation & Modals
  const [appMode, setAppMode] = useState<"exams" | "topic_builder" | "sigre_curricular">("exams");
  const [isThematicModalOpen, setIsThematicModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
  const [isOmrScannerOpen, setIsOmrScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  // Sync Theme to HTML root
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("docuexam_theme", theme);
  }, [theme]);

  // Fullscreen listener
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleExtendedMode = () => {
    setIsExtendedMode((prev) => {
      const next = !prev;
      localStorage.setItem("docuexam_extended", String(next));
      return next;
    });
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isFullscreen,
    toggleFullscreen,
    isFocusMode,
    setIsFocusMode,
    isExtendedMode,
    setIsExtendedMode,
    toggleExtendedMode,
    appMode,
    setAppMode,
    isThematicModalOpen,
    setIsThematicModalOpen,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isResultsModalOpen,
    setIsResultsModalOpen,
    isOmrModalOpen,
    setIsOmrModalOpen,
    isOmrScannerOpen,
    setIsOmrScannerOpen,
    isLoading,
    setIsLoading,
    toastMessage,
    toastIsError,
    showToast,
  };
}
