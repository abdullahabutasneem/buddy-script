import { NextResponse } from "next/server";

/** Reject obvious JSON body DoS when Content-Length is present. */
export function rejectOversizedJsonBody(
  request: Request,
  maxBytes = 32_768,
): NextResponse | null {
  const raw = request.headers.get("content-length");
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= maxBytes) return null;
  return NextResponse.json({ error: "Request body too large" }, { status: 413 });
}
