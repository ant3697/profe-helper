/**
 * Safe LocalStorage Utilities for SIGRE Curricular Suite
 * Handles browser storage quotas (typically ~5MB), debouncing, and graceful degradations.
 */

// Keys that can be pruned in emergency if browser storage is exhausted
const PRUNABLE_CACHE_KEYS = [
  "docuexam_topic_rag_files",
  "docuexam_temp_export",
  "docuexam_topic_history",
  "docuexam_debug_logs",
  "sigre_temp_pdf_cache",
];

/**
 * Attempts to free up storage space if quota is exceeded
 */
export function pruneStorageCaches(): void {
  try {
    for (const key of PRUNABLE_CACHE_KEYS) {
      localStorage.removeItem(key);
    }

    // Clean up duplicated keys in module curricula store if present
    const MODULE_CURRICULA_KEY = "sigre_module_curricula_portfolio_v2";
    const raw = localStorage.getItem(MODULE_CURRICULA_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          // Keep only unique normalized keys, strip duplicate aliases
          const compacted: Record<string, any> = {};
          const seenModules = new Set<string>();

          for (const [k, v] of Object.entries(parsed)) {
            const modId = (v as any)?.config?.codigo || (v as any)?.config?.moduloFormativo || k;
            if (!seenModules.has(modId)) {
              seenModules.add(modId);
              compacted[k] = v;
            }
          }
          localStorage.setItem(MODULE_CURRICULA_KEY, JSON.stringify(compacted));
        }
      } catch {}
    }
  } catch (err) {
    console.warn("Storage cache prune attempted:", err);
  }
}

/**
 * Safely writes a key-value string to localStorage without crashing on QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError =
      err?.name === "QuotaExceededError" ||
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err?.code === 22 ||
      err?.code === 1014;

    if (isQuotaError) {
      console.warn(`[safeLocalStorageSet] Quota exceeded on key "${key}". Attempting cache pruning...`);
      pruneStorageCaches();

      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(
          `[safeLocalStorageSet] Storage quota still exceeded for "${key}" (${Math.round(value.length / 1024)} KB). Data held in memory.`
        );
        return false;
      }
    } else {
      console.warn(`[safeLocalStorageSet] Error saving key "${key}":`, err);
      return false;
    }
  }
}

/**
 * Safely retrieves and parses a JSON item from localStorage with a fallback value.
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Simple debounce utility for delaying high-frequency updates (e.g. storage persistence).
 */
export function debounce<F extends (...args: any[]) => void>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: any = null;
  return (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
