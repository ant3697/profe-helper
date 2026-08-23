import React, { useState, useEffect } from "react";
import {
  Bot,
  X,
  Key,
  Eye,
  EyeOff,
  Radio,
  Lock,
  Edit3,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Check,
  Sparkles,
} from "lucide-react";
import {
  AIProviderId,
  AIProviderConfig,
  AISettingsState,
  DEFAULT_AI_PROVIDERS,
} from "../types/aiProviders";

interface AIProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettingsState;
  onSaveSettings: (newSettings: AISettingsState) => void;
  onShowToast: (msg: string, isError?: boolean) => void;
}

export const AIProviderModal: React.FC<AIProviderModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onShowToast,
}) => {
  const [localSettings, setLocalSettings] = useState<AISettingsState>(settings);
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
      setTestResult(null);
      setShowPassword(false);
      setIsCustomModelMode(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentProviderId = localSettings.activeProviderId;
  const currentConfig: AIProviderConfig =
    localSettings.providers[currentProviderId] ||
    DEFAULT_AI_PROVIDERS[currentProviderId];

  const handleProviderSelect = (newId: AIProviderId) => {
    setLocalSettings((prev) => ({
      ...prev,
      activeProviderId: newId,
    }));
    setTestResult(null);
    setIsCustomModelMode(false);
  };

  const handleApiKeyChange = (val: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [currentProviderId]: {
          ...prev.providers[currentProviderId],
          apiKey: val,
        },
      },
    }));
    setTestResult(null);
  };

  const handleEndpointChange = (val: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [currentProviderId]: {
          ...prev.providers[currentProviderId],
          endpoint: val,
        },
      },
    }));
    setTestResult(null);
  };

  const handleModelChange = (val: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [currentProviderId]: {
          ...prev.providers[currentProviderId],
          selectedModel: val,
        },
      },
    }));
    setTestResult(null);
  };

  const handleAddCustomModel = () => {
    if (!customModelInput.trim()) return;
    const modelName = customModelInput.trim();
    const updatedModels = [
      ...currentConfig.availableModels.filter((m) => m.id !== modelName),
      { id: modelName, name: `${modelName} (Personalizado)` },
    ];

    setLocalSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [currentProviderId]: {
          ...prev.providers[currentProviderId],
          availableModels: updatedModels,
          selectedModel: modelName,
        },
      },
    }));

    setIsCustomModelMode(false);
    setCustomModelInput("");
    onShowToast(`Modelo "${modelName}" añadido correctamente.`);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: currentProviderId,
          apiKey: currentConfig.apiKey,
          endpoint: currentConfig.endpoint,
          model: currentConfig.selectedModel,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || `Conexión exitosa (${data.latencyMs}ms)`,
          latencyMs: data.latencyMs,
        });
        onShowToast(data.message || "Conexión exitosa");
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || "Error de conexión",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "No se pudo comunicar con el servidor.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        `¿Deseas restablecer la configuración por defecto para ${currentConfig.name}?`
      )
    ) {
      const defaultForThis = DEFAULT_AI_PROVIDERS[currentProviderId];
      setLocalSettings((prev) => ({
        ...prev,
        providers: {
          ...prev.providers,
          [currentProviderId]: JSON.parse(JSON.stringify(defaultForThis)),
        },
      }));
      setTestResult(null);
      setIsCustomModelMode(false);
      onShowToast(`Configuración de ${currentConfig.subtitle} restablecida.`);
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onShowToast(
      `Proveedor activado: ${currentConfig.subtitle} (${currentConfig.selectedModel})`
    );
    onClose();
  };

  const hasActiveKey =
    !currentConfig.requiresKey || (currentConfig.apiKey && currentConfig.apiKey.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-border-default rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto text-text-primary">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-default flex items-center justify-between bg-alt/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-text-primary font-primary flex items-center gap-2">
                Configuración de Proveedores de IA
              </h2>
              <p className="text-xs text-text-muted leading-tight">
                Google Gemini, API Temporal, IA Local (Ollama), OpenAI, DeepSeek, Groq
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-alt border border-border-default text-text-muted hover:text-text-primary hover:bg-hover flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Proveedor de IA / Motor Local */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary tracking-wide uppercase">
              Proveedor de IA / Motor Local
            </label>
            <div className="relative">
              <select
                value={currentProviderId}
                onChange={(e) => handleProviderSelect(e.target.value as AIProviderId)}
                className="w-full bg-alt border-2 border-amber-500 text-text-primary font-bold rounded-xl text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all cursor-pointer shadow-xs appearance-none"
              >
                <option value="gemini">Google Gemini (Google AI Studio - Plan Gratuito)</option>
                <option value="openrouter">OpenRouter (Modelos Gratuitos y Premium)</option>
                <option value="temp_demo">⚡ API Temporal de Prueba (Prueba Inmediata Sin Claves)</option>
                <option value="local_ollama">IA Local (Ollama / LM Studio)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="groq">Groq Cloud</option>
                <option value="custom">Personalizado / Endpoint compatible OpenAI</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-amber-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <p className="text-[11.5px] text-text-muted font-medium">
              {currentConfig.description}
            </p>
          </div>

          {/* Section 2: Clave API */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary tracking-wide uppercase flex items-center gap-1.5">
                Clave API ({currentConfig.keyLabel})
              </label>

              {hasActiveKey ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 shadow-xs">
                  <Key className="w-3 h-3" />
                  Clave Activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/40 shadow-xs">
                  <AlertCircle className="w-3 h-3" />
                  Clave Requerida
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentConfig.apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={currentConfig.keyPlaceholder}
                  disabled={!currentConfig.requiresKey}
                  className={`w-full bg-alt border border-border-default text-text-primary rounded-xl text-xs sm:text-sm px-4 py-3 pr-10 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono ${
                    !currentConfig.requiresKey ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
                {currentConfig.requiresKey && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 cursor-pointer"
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="bg-alt hover:bg-hover border border-border-default text-text-primary font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-95 whitespace-nowrap shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span>Probando...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 text-amber-500" />
                    <span>Probar Conexión</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 animate-in fade-in duration-200 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5 pt-0.5">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Por seguridad, la clave API se guarda solo en memoria de esta sesión (
                <code className="text-amber-600 dark:text-amber-300 font-mono font-bold">sessionStorage</code>) y se borrará
                automáticamente al cerrar el navegador.
              </span>
            </p>
          </div>

          {/* Section 3: Base URL Servidor Local / API Endpoint */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary tracking-wide">
              Base URL Servidor Local / API Endpoint
            </label>
            <input
              type="text"
              value={currentConfig.endpoint}
              onChange={(e) => handleEndpointChange(e.target.value)}
              placeholder="https://..."
              className="w-full bg-alt border border-border-default text-text-primary rounded-xl text-xs sm:text-sm px-4 py-3 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all font-mono"
            />
            <p className="text-[11px] text-text-muted font-medium">{currentConfig.endpointHelp}</p>
          </div>

          {/* Section 4: Modelo Seleccionado */}
          <div className="p-4 rounded-2xl bg-alt/80 border border-border-default space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Modelo Seleccionado ({currentConfig.keyLabel})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomModelMode(!isCustomModelMode)}
                className="bg-surface border border-amber-500/60 hover:border-amber-500 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {isCustomModelMode ? "Seleccionar de Lista" : "/ Personalizar / Añadir Modelo"}
                </span>
              </button>
            </div>

            {isCustomModelMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="Escribe el nombre exacto del modelo (ej: deepseek/deepseek-r1:free)..."
                  className="flex-1 bg-surface border border-amber-500 text-text-primary rounded-xl text-xs sm:text-sm px-3.5 py-2.5 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddCustomModel}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={currentConfig.selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-surface border-2 border-amber-500 text-text-primary font-bold rounded-xl text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all cursor-pointer shadow-xs appearance-none"
                >
                  {currentConfig.availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isFree ? "(Gratuito)" : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-amber-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Storage Guarantee Card */}
          <div className="p-4 rounded-2xl bg-alt border border-border-default flex items-center gap-3 text-xs text-text-secondary">
            <Laptop className="w-5 h-5 text-text-muted shrink-0" />
            <p className="leading-relaxed">
              Tus claves de API se almacenan de forma segura en tu navegador y no se comparten con
              terceros.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border-default bg-alt/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto border border-border-default bg-surface hover:bg-hover text-text-secondary text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer por Defecto</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto border border-border-default bg-surface text-text-primary hover:bg-hover text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Guardar Configuración
            </button>
          </div>
        </div>

        {/* Platform Bottom Brand Signature */}
        <div className="py-2 text-center text-[11px] text-text-muted border-t border-border-default bg-alt">
          Smart Test Platform · Desarrollado por{" "}
          <strong className="text-text-primary">Antonio Díaz Pérez</strong>
        </div>
      </div>
    </div>
  );
};
