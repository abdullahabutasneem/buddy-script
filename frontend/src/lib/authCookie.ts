import type { NextResponse } from "next/server";

/** First name=value pair in a Set-Cookie header (before attributes). */
function parseCookieNameValue(raw: string): { name: string; value: string } | null {
  const semicolon = raw.indexOf(";");
  const pair = (semicolon === -1 ? raw : raw.slice(0, semicolon)).trim();
  const eq = pair.indexOf("=");
  if (eq <= 0) return null;
  return {
    name: pair.slice(0, eq).trim(),
    value: pair.slice(eq + 1).trim(),
  };
}

function collectSetCookieStrings(source: Response): string[] {
  const h = source.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") {
    return h.getSetCookie();
  }
  const single = source.headers.get("set-cookie");
  return single ? [single] : [];
}

function normalizeCookieValue(value: string): string {
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const BUDDY_TOKEN_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60,
};

/** Read non-empty `buddy_token` from a backend fetch response (Express Set-Cookie). */
export function extractBuddyTokenFromFetchResponse(source: Response): string | null {
  for (const raw of collectSetCookieStrings(source)) {
    const parsed = parseCookieNameValue(raw);
    if (!parsed || parsed.name.toLowerCase() !== "buddy_token") continue;
    const v = parsed.value.trim();
    if (!v) continue;
    return normalizeCookieValue(v);
  }
  return null;
}

/**
 * Apply auth cookies from the backend onto a NextResponse (API routes).
 */
export function forwardSetCookies(source: Response, target: NextResponse): void {
  for (const raw of collectSetCookieStrings(source)) {
    const parsed = parseCookieNameValue(raw);
    if (!parsed || parsed.name.toLowerCase() !== "buddy_token") continue;
    if (!parsed.value.trim()) {
      target.cookies.delete("buddy_token");
      return;
    }
    target.cookies.set(
      "buddy_token",
      normalizeCookieValue(parsed.value),
      BUDDY_TOKEN_OPTIONS,
    );
    return;
  }
}
