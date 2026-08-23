export type AIProviderId =
  | "gemini"
  | "openrouter"
  | "temp_demo"
  | "local_ollama"
  | "openai"
  | "deepseek"
  | "groq"
  | "custom";

export interface AIModelOption {
  id: string;
  name: string;
  description?: string;
  isFree?: boolean;
}

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  subtitle: string;
  description: string;
  endpoint: string;
  endpointHelp: string;
  requiresKey: boolean;
  keyPlaceholder: string;
  keyLabel: string;
  apiKey: string;
  selectedModel: string;
  availableModels: AIModelOption[];
  customModelEnabled?: boolean;
}

export interface AISettingsState {
  activeProviderId: AIProviderId;
  providers: Record<AIProviderId, AIProviderConfig>;
}

export const DEFAULT_AI_PROVIDERS: Record<AIProviderId, AIProviderConfig> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini (Google AI Studio - Plan Gratuito)",
    subtitle: "Google Gemini",
    description: "Modelo Gemini 3.6 Flash, 3.1 Flash Lite, 3.7 Flash y 3.1 Pro con máxima velocidad y precisión técnica",
    endpoint: "https://generativelanguage.googleapis.com",
    endpointHelp: "Endpoint oficial Google AI Studio",
    requiresKey: true,
    keyPlaceholder: "AIzaSy...",
    keyLabel: "GEMINI",
    apiKey: "",
    selectedModel: "gemini-3.6-flash",
    availableModels: [
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Recomendado - Ultra Rápido)", description: "Velocidad máxima, precisión técnica y estructuración profunda" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite (Alta Disponibilidad)", description: "Menor latencia y alta eficiencia" },
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Razonamiento Avanzado)", description: "Balance óptimo y pensamiento" },
      { id: "gemini-flash-latest", name: "Gemini Flash Latest", description: "Versión más reciente de la familia Flash" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (Máxima Profundidad)", description: "Mayor profundidad técnica para casos complejos" },
    ],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter (Modelos Gratuitos y Premium)",
    subtitle: "OpenRouter",
    description: "Acceso unificado a DeepSeek R1, Llama 3.3, Claude 3.5, Mistral y más",
    endpoint: "https://openrouter.ai/api/v1",
    endpointHelp: "Endpoint OpenAI-compatible de OpenRouter",
    requiresKey: true,
    keyPlaceholder: "sk-or-v1-...",
    keyLabel: "OPENROUTER",
    apiKey: "",
    selectedModel: "deepseek/deepseek-r1:free",
    availableModels: [
      { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1 (Gratuito / OpenRouter)", isFree: true },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Meta Llama 3.3 70B (Gratuito)", isFree: true },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Premium)" },
      { id: "mistralai/mistral-large-2407", name: "Mistral Large 2" },
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (Gratuito)", isFree: true },
    ],
  },
  temp_demo: {
    id: "temp_demo",
    name: "⚡ API Temporal de Prueba (Prueba Inmediata Sin Claves)",
    subtitle: "API Temporal de Prueba",
    description: "Usa directamente el servidor de la plataforma sin necesidad de registrar claves",
    endpoint: "Servidor Interno AI Studio",
    endpointHelp: "Conexión gestionada automáticamente en la nube",
    requiresKey: false,
    keyPlaceholder: "No requerida (utiliza cuota del servidor)",
    keyLabel: "SERVIDOR",
    apiKey: "",
    selectedModel: "gemini-3.6-flash",
    availableModels: [
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash (Recomendado - Servidor)", isFree: true },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite (Servidor)", isFree: true },
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Servidor)", isFree: true },
      { id: "gemini-flash-latest", name: "Gemini Flash Latest (Servidor)", isFree: true },
    ],
  },
  local_ollama: {
    id: "local_ollama",
    name: "IA Local (Ollama / LM Studio)",
    subtitle: "IA Local (Ollama)",
    description: "Ejecución 100% privada y offline en tu propio ordenador (Ollama, LM Studio, vLLM)",
    endpoint: "http://localhost:11434/v1",
    endpointHelp: "Endpoint OpenAI-compatible local",
    requiresKey: false,
    keyPlaceholder: "ollama (o dejar en blanco)",
    keyLabel: "LOCAL",
    apiKey: "",
    selectedModel: "llama3:latest",
    availableModels: [
      { id: "llama3:latest", name: "Llama 3 (Local)" },
      { id: "deepseek-r1:latest", name: "DeepSeek R1 (Local)" },
      { id: "mistral:latest", name: "Mistral (Local)" },
      { id: "phi3:latest", name: "Phi-3 (Local)" },
      { id: "qwen2.5:latest", name: "Qwen 2.5 (Local)" },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    subtitle: "OpenAI",
    description: "Modelos GPT-4o, GPT-4o Mini y o3-mini oficiales de OpenAI",
    endpoint: "https://api.openai.com/v1",
    endpointHelp: "Endpoint base oficial OpenAI",
    requiresKey: true,
    keyPlaceholder: "sk-proj-...",
    keyLabel: "OPENAI",
    apiKey: "",
    selectedModel: "gpt-4o-mini",
    availableModels: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Rápido y Económico)" },
      { id: "gpt-4o", name: "GPT-4o (Completo y Preciso)" },
      { id: "o3-mini", name: "o3-mini (Razonamiento Lógico)" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    ],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek AI",
    subtitle: "DeepSeek",
    description: "Modelos DeepSeek-V3 y DeepSeek-R1",
    endpoint: "https://api.deepseek.com/v1",
    endpointHelp: "Endpoint base OpenAI-compatible",
    requiresKey: true,
    keyPlaceholder: "sk-...",
    keyLabel: "DEEPSEEK",
    apiKey: "",
    selectedModel: "deepseek-chat",
    availableModels: [
      { id: "deepseek-chat", name: "DeepSeek V3 (Chat)" },
      { id: "deepseek-reasoner", name: "DeepSeek R1 (Reasoner)" },
    ],
  },
  groq: {
    id: "groq",
    name: "Groq Cloud",
    subtitle: "Groq Cloud",
    description: "Inferencia LPU ultra-rápida (500+ tokens/segundo)",
    endpoint: "https://api.groq.com/openai/v1",
    endpointHelp: "Endpoint base OpenAI-compatible de Groq",
    requiresKey: true,
    keyPlaceholder: "gsk_...",
    keyLabel: "GROQ",
    apiKey: "",
    selectedModel: "llama-3.3-70b-versatile",
    availableModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant (Ultra Rápido)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B IT" },
    ],
  },
  custom: {
    id: "custom",
    name: "Personalizado / Endpoint compatible OpenAI",
    subtitle: "Personalizado",
    description: "Cualquier servidor o proveedor con API compatible con OpenAI (vLLM, LiteLLM, FastChat)",
    endpoint: "https://mi-servidor-ai.com/v1",
    endpointHelp: "Endpoint base OpenAI-compatible personalizado",
    requiresKey: false,
    keyPlaceholder: "sk-...",
    keyLabel: "PERSONALIZADO",
    apiKey: "",
    selectedModel: "custom-model",
    availableModels: [
      { id: "custom-model", name: "Modelo Personalizado" },
    ],
  },
};
