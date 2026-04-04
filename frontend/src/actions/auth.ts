"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { extractBuddyTokenFromFetchResponse } from "@/lib/authCookie";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:4000";

export type AuthFormState = { error: string | null };

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60,
};

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required" };
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: "Cannot reach API. Is the backend running?" };
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { error: data.error ?? "Login failed" };
  }

  const token = extractBuddyTokenFromFetchResponse(res);
  if (!token) {
    return {
      error:
        "Session could not be created. Check BACKEND_URL and that the API sets buddy_token.",
    };
  }

  (await cookies()).set("buddy_token", token, cookieOpts);
  redirect("/feed");
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      }),
    });
  } catch {
    return { error: "Cannot reach API. Is the backend running?" };
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { error: data.error ?? "Registration failed" };
  }

  const token = extractBuddyTokenFromFetchResponse(res);
  if (!token) {
    return {
      error:
        "Session could not be created. Check BACKEND_URL and that the API sets buddy_token.",
    };
  }

  (await cookies()).set("buddy_token", token, cookieOpts);
  redirect("/feed");
}
