import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyBuddyJwt } from "@/lib/verifyBuddyJwt";

const AUTH_COOKIE = "buddy_token";

/**
 * Use in Server Components / layouts for routes that require a valid session.
 * Complements middleware (handles cases where middleware is skipped or misconfigured).
 */
export async function requireSessionOrRedirect(loginPath = "/login"): Promise<void> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    redirect(loginPath);
  }
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect(loginPath);
  }
  try {
    await verifyBuddyJwt(token, secret);
  } catch {
    redirect(loginPath);
  }
}
