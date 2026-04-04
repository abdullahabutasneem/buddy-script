"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value;
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
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
    <form className="_social_registration_form" onSubmit={onSubmit}>
      {error ? (
        <p className="text-sm text-red-600 _mar_b14" role="alert">
          {error}
        </p>
      ) : null}
      <div className="row">
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label className="_social_registration_label _mar_b8" htmlFor="register-first-name">
              First name
            </label>
            <input
              id="register-first-name"
              name="firstName"
              type="text"
              required
              className="form-control _social_registration_input"
              autoComplete="given-name"
            />
          </div>
        </div>
        <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label className="_social_registration_label _mar_b8" htmlFor="register-last-name">
              Last name
            </label>
            <input
              id="register-last-name"
              name="lastName"
              type="text"
              required
              className="form-control _social_registration_input"
              autoComplete="family-name"
            />
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label className="_social_registration_label _mar_b8" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              required
              className="form-control _social_registration_input"
              autoComplete="email"
            />
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label className="_social_registration_label _mar_b8" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              required
              minLength={8}
              className="form-control _social_registration_input"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label className="_social_registration_label _mar_b8" htmlFor="register-password-repeat">
              Repeat password
            </label>
            <input
              id="register-password-repeat"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              className="form-control _social_registration_input"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
          <div className="form-check _social_registration_form_check">
            <input
              className="form-check-input _social_registration_form_check_input"
              type="radio"
              name="registrationTerms"
              id="registration-terms"
              defaultChecked
            />
            <label className="form-check-label _social_registration_form_check_label" htmlFor="registration-terms">
              I agree to terms & conditions
            </label>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
          <div className="_social_registration_form_btn _mar_t40 _mar_b60">
            <button type="submit" className="_social_registration_form_btn_link _btn1" disabled={pending}>
              {pending ? "Creating account…" : "Register now"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
