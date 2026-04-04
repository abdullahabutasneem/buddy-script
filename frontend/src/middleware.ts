import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyBuddyJwt } from "@/lib/verifyBuddyJwt";

const AUTH_COOKIE = "buddy_token";

const PROTECTED_BASES = ["/feed", "/friends", "/messages", "/profile"] as const;

function pathnameNeedsAuth(pathname: string): boolean {
  return PROTECTED_BASES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

let loggedJwtSecretWarning = false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathnameNeedsAuth(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (!loggedJwtSecretWarning) {
      loggedJwtSecretWarning = true;
      console.warn(
        "[buddy-script] JWT_SECRET is missing or too short. Copy JWT_SECRET from backend/.env into frontend/.env.local (same value, at least 16 characters), then restart `next dev`.",
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await verifyBuddyJwt(token, secret);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }
}

/**
 * Match almost all paths so /feed is never skipped (Next matcher quirks on some versions).
 * Auth runs only when pathnameNeedsAuth() is true.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
