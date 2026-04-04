/* eslint-disable @next/next/no-img-element -- legacy markup; swap to next/image when optimizing */
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <img
          src="/assets/images/shape1.svg"
          alt=""
          className="_shape_img"
        />
        <img
          src="/assets/images/dark_shape.svg"
          alt=""
          className="_dark_shape"
        />
      </div>
      <div className="_shape_two">
        <img
          src="/assets/images/shape2.svg"
          alt=""
          className="_shape_img"
        />
        <img
          src="/assets/images/dark_shape1.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
        />
      </div>
      <div className="_shape_three">
        <img
          src="/assets/images/shape3.svg"
          alt=""
          className="_shape_img"
        />
        <img
          src="/assets/images/dark_shape2.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
        />
      </div>
      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <img src="/assets/images/registration.png" alt="" />
                </div>
                <div className="_social_registration_right_image_dark">
                  <img src="/assets/images/registration1.png" alt="" />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  <img
                    src="/assets/images/logo.svg"
                    alt="Buddy Script"
                    className="_right_logo"
                  />
                </div>
                <p className="_social_registration_content_para _mar_b8">
                  Get Started Now
                </p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">
                  Registration
                </h4>
                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                >
                  <img
                    src="/assets/images/google.svg"
                    alt=""
                    className="_google_img"
                  />{" "}
                  <span>Register with google</span>
                </button>
                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>
                <RegisterForm />
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account? <Link href="/login">Login</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
