import { NextResponse } from "next/server";
import { getBackendOrigin } from "@/lib/backendUrl";
import { forwardSetCookies } from "@/lib/authCookie";
import { rejectOversizedJsonBody } from "@/lib/rejectOversizedBody";

const backendOrigin = getBackendOrigin();

export async function POST(request: Request) {
  const tooLarge = rejectOversizedJsonBody(request);
  if (tooLarge) return tooLarge;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${backendOrigin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach API. Is the backend running?" },
      { status: 502 },
    );
  }

  const data = await res.json().catch(() => ({}));
  const nextResponse = NextResponse.json(data, { status: res.status });
  forwardSetCookies(res, nextResponse);
  return nextResponse;
}
