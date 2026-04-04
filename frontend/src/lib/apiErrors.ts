/** Normalize error text from typical API JSON shapes (Express, Mongoose, etc.). */
export function errorMessageFromApiBody(
  body: unknown,
  fallback: string,
): string {
  if (body == null) return fallback;
  if (typeof body === "string") {
    const t = body.trim();
    return t || fallback;
  }
  if (typeof body !== "object") return fallback;

  const o = body as Record<string, unknown>;

  if (typeof o.error === "string") {
    const t = o.error.trim();
    if (t) return t;
  }

  if (typeof o.message === "string") {
    const t = o.message.trim();
    if (t) return t;
  }

  if (Array.isArray(o.message)) {
    const parts = o.message.filter((m): m is string => typeof m === "string");
    const joined = parts.map((s) => s.trim()).filter(Boolean).join(" ");
    if (joined) return joined;
  }

  if (o.errors && typeof o.errors === "object") {
    const msgs: string[] = [];
    for (const v of Object.values(o.errors as Record<string, unknown>)) {
      if (v && typeof v === "object" && "message" in v) {
        const m = (v as { message: unknown }).message;
        if (typeof m === "string" && m.trim()) msgs.push(m.trim());
      }
    }
    if (msgs.length) return msgs.join(" ");
  }

  return fallback;
}

export async function readApiJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return { __nonJson: true as const };
  }
}

export function friendlyHttpError(
  res: Response,
  body: unknown,
  fallback: string,
): string {
  const fromJson = errorMessageFromApiBody(body, "");
  if (fromJson) return fromJson;

  if (body && typeof body === "object" && "__nonJson" in body) {
    return "The server returned an unexpected response. Try again or check that the API is running.";
  }

  switch (res.status) {
    case 400:
      return "Invalid request.";
    case 401:
      return "Invalid email or password.";
    case 403:
      return "You do not have permission to do that.";
    case 404:
      return "Not found.";
    case 409:
      return "An account with this email already exists.";
    case 429:
      return "Too many attempts. Try again later.";
    case 502:
    case 503:
      return "Service unavailable. Try again later.";
    default:
      if (res.status >= 500) return "Server error. Try again later.";
      if (res.statusText) return `${fallback} (${res.status} ${res.statusText})`.trim();
      return `${fallback} (${res.status})`;
  }
}
