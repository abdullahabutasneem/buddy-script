"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  friendlyHttpError,
  readApiJsonBody,
} from "@/lib/apiErrors";
import { getBackendOrigin } from "@/lib/backendUrl";
import { extractBuddyTokenFromFetchResponse } from "@/lib/authCookie";

const backendOrigin = getBackendOrigin();

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

  const emailTrim = email.trim();
  if (!emailTrim) {
    return { error: "Email is required" };
  }

  let res: Response;
  try {
    res = await fetch(`${backendOrigin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailTrim, password }),
    });
  } catch {
    return { error: "Cannot reach the server. Check that the backend is running and BACKEND_URL is correct." };
  }

  const data = await readApiJsonBody(res);
  if (!res.ok) {
    return {
      error: friendlyHttpError(res, data, "Sign in failed"),
    };
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

  if (!firstName.trim() || !lastName.trim()) {
    return { error: "First and last name are required" };
  }

  if (!email.trim()) {
    return { error: "Email is required" };
  }

  const outgoing = new FormData();
  outgoing.append("firstName", firstName.trim());
  outgoing.append("lastName", lastName.trim());
  outgoing.append("email", email.trim());
  outgoing.append("password", password);
  outgoing.append("confirmPassword", confirmPassword);
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    outgoing.append("avatar", avatar);
  }

  let res: Response;
  try {
    res = await fetch(`${backendOrigin}/api/auth/register`, {
      method: "POST",
      body: outgoing,
    });
  } catch {
    return { error: "Cannot reach the server. Check that the backend is running and BACKEND_URL is correct." };
  }

  const data = await readApiJsonBody(res);
  if (!res.ok) {
    return {
      error: friendlyHttpError(res, data, "Registration failed"),
    };
  }

  const token = extractBuddyTokenFromFetchResponse(res);
  if (!token) {
    return {
      error:
        "Session could not be created. Check BACKEND_URL and that the API sets the buddy_token cookie.",
    };
  }

  (await cookies()).set("buddy_token", token, cookieOpts);
  redirect("/feed");
}
