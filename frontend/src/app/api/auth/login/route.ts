import { NextResponse } from "next/server";
import { forwardSetCookies } from "@/lib/authCookie";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:4000";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl}/api/auth/login`, {
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
