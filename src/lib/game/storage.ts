import type { SessionState } from "./types";

// Bump when the guided flow changes so an older saved step cannot mask a new UI.
const STORAGE_KEY = "future-school-ai-session-v2";

export function saveSession(state: SessionState): void {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as SessionState : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}
