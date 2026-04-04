import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "buddy_token";

export async function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    console.error("JWT_SECRET is missing or too short in frontend environment (use .env.local).");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }
}

export const config = {
  matcher: [
    "/feed",
    "/feed/:path*",
    "/friends",
    "/friends/:path*",
    "/messages",
    "/messages/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
