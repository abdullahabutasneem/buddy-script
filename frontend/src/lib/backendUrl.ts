/**
 * Normalized Express origin for server-side fetches (Route Handlers, Server Actions).
 * Only http(s) is allowed to limit impact of a misconfigured BACKEND_URL (SSRF-style misuse).
 */
export function getBackendOrigin(): string {
  const fallback = "http://127.0.0.1:4000";
  const raw = (process.env.BACKEND_URL ?? fallback).trim();
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      console.warn(
        "[buddy-script] BACKEND_URL must use http or https; using default origin.",
      );
      return fallback;
    }
    return u.origin;
  } catch {
    console.warn("[buddy-script] Invalid BACKEND_URL; using default origin.");
    return fallback;
  }
}
