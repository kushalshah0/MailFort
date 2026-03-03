const API_URL_KEY = "mailfort_api_url";
const API_MODEL_KEY = "mailfort_api_model";

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

export function clearApiSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_URL_KEY);
  localStorage.removeItem(API_MODEL_KEY);
}
