"use client";

import { useActionState } from "react";
import {
  registerAction,
  type AuthFormState,
} from "@/actions/auth";

const initial: AuthFormState = { error: null };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, initial);

  return (
    <form
      className="_social_registration_form"
      action={formAction}
      encType="multipart/form-data"
    >
      {state.error ? (
        <p className="text-sm text-red-600 _mar_b14" role="alert">
          {state.error}
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
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label className="_social_registration_label _mar_b8" htmlFor="register-avatar">
              Profile photo <span className="text-muted">(optional)</span>
            </label>
            <input
              id="register-avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="form-control _social_registration_input"
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
            <button
              type="submit"
              className="_social_registration_form_btn_link _btn1"
              disabled={isPending}
            >
              {isPending ? "Creating account…" : "Register now"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
