import { NextResponse } from "next/server";
import { getBackendOrigin } from "@/lib/backendUrl";
import { forwardSetCookies } from "@/lib/authCookie";

const backendOrigin = getBackendOrigin();

function clearBuddyCookie(res: NextResponse) {
  res.cookies.set("buddy_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  let res: Response;
  try {
    res = await fetch(`${backendOrigin}/api/auth/logout`, {
      method: "POST",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });
  } catch {
    const nextResponse = NextResponse.json({ ok: true });
    clearBuddyCookie(nextResponse);
    return nextResponse;
  }

  const data = await res.json().catch(() => ({}));
  const nextResponse = NextResponse.json(data, { status: res.status });
  forwardSetCookies(res, nextResponse);
  clearBuddyCookie(nextResponse);
  return nextResponse;
}
