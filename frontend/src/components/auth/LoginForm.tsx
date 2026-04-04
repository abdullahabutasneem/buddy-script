"use client";

import { useActionState } from "react";
import {
  loginAction,
  type AuthFormState,
} from "@/actions/auth";

const initial: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  return (
    <form className="_social_login_form" action={formAction}>
      {state.error ? (
        <p
          className="_auth_form_error"
          role="alert"
          aria-live="polite"
        >
          {state.error}
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
            <button
              type="submit"
              className="_social_login_form_btn_link _btn1"
              disabled={isPending}
            >
              {isPending ? "Signing in…" : "Login now"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
