const API_URL_KEY = "mailfort_api_url";

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
