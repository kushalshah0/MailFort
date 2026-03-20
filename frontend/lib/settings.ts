const API_URL_KEY = "mailfort_api_url";
const API_MODEL_KEY = "mailfort_api_model";
const ANALYSIS_MODE_KEY = "mailfort_analysis_mode";

export function getApiUrl(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_URL_KEY);
}

export function setApiUrl(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_URL_KEY, url);
}

export function clearApiUrl(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_URL_KEY);
}

export type ModelType = "bert" | "lstm" | "gru";

export function getApiModel(): ModelType {
  if (typeof window === "undefined") return "bert";
  return (localStorage.getItem(API_MODEL_KEY) as ModelType) || "bert";
}

export function setApiModel(model: ModelType): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_MODEL_KEY, model);
}

export type AnalysisMode = "single" | "batch";

export function getAnalysisMode(): AnalysisMode {
  if (typeof window === "undefined") return "single";
  return (localStorage.getItem(ANALYSIS_MODE_KEY) as AnalysisMode) || "single";
}

export function setAnalysisMode(mode: AnalysisMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANALYSIS_MODE_KEY, mode);
}

export function clearApiSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_URL_KEY);
  localStorage.removeItem(API_MODEL_KEY);
  localStorage.removeItem(ANALYSIS_MODE_KEY);
}
