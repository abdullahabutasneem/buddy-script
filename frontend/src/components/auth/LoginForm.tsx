"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/feed");
      router.refresh();
    } catch {
      setError("Network error. Is the API running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="_social_login_form" onSubmit={onSubmit}>
      {error ? (
        <p className="text-sm text-red-600 _mar_b14" role="alert">
          {error}
        </p>
      ) : null}
      <div className="row">
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_form_input _mar_b14">
            <label className="_social_login_label _mar_b8" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              className="form-control _social_login_input"
              autoComplete="email"
            />
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_login_form_input _mar_b14">
            <label className="_social_login_label _mar_b8" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              className="form-control _social_login_input"
              autoComplete="current-password"
            />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
          <div className="form-check _social_login_form_check">
            <input
              className="form-check-input _social_login_form_check_input"
              type="radio"
              name="flexRadioDefault"
              id="flexRadioDefault2"
              defaultChecked
            />
            <label className="form-check-label _social_login_form_check_label" htmlFor="flexRadioDefault2">
              Remember me
            </label>
          </div>
        </div>
        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
          <div className="_social_login_form_left">
            <p className="_social_login_form_left_para">Forgot password?</p>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
          <div className="_social_login_form_btn _mar_t40 _mar_b60">
            <button type="submit" className="_social_login_form_btn_link _btn1" disabled={pending}>
              {pending ? "Signing in…" : "Login now"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
