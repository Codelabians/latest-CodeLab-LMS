import React, { useEffect, useState } from "react";
import logo from "../../../assets/images/park logo.png";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePostMutation } from "../../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import ForgetImage from "../../../assets/images/forget/forget illustration rohi.png";
import ForgetImage2 from "../../../assets/images/forget/forget illustration rohi.png";
import ArrowImage from "../../../assets/images/forget/arrow.png";
import { SIGNIN, OTP } from "../../routes/RouteConstants";
import { toast } from "react-toastify";

const ForgetComponent = () => {
  const navigate = useNavigate();
  const error = useSelector((state) => state.error.error);
  const [forget, { isLoading }] = usePostMutation();
  const [imageValue, setImageValue] = useState(true);

  const signInValidation = Yup.object().shape({
    email: Yup.string()
      .trim()
      .email("Please enter a valid email address")
      .required("Email is required"),
  });

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setImageValue(false);
    }, 2000);
    return () => clearTimeout(timeOut);
  }, []);

  const {
    handleBlur,
    handleChange,
    handleSubmit,
    values,
    errors,
    touched,
    isValid,
  } = useFormik({
    initialValues: { email: "" },
    validationSchema: signInValidation,
    onSubmit: async (values) => {
      try {
        const res = await forget({
          path: "/admin/authentication/forget-password",
          body: values,
        }).unwrap();
        toast.success(res?.message || "OTP sent successfully!");
        navigate(OTP);
      } catch (err) {
        toast.error(err?.data?.message || "Something went wrong");
        console.error("Failed to forget:", err);
      }
    },
  });

  // Logic to determine if button should be active
  const isButtonDisabled = isLoading || !values.email || !!errors.email;

  return (
    <section className="flex h-screen pt-16 pb-4 md:pt-10 bg-white">
      <div className="container flex flex-col gap-12 w-full md:w-[60%] md:border-r border-gray-200">
        <div className="flex items-center justify-center">
          <img src={logo} alt="logo" className="w-40 md:w-44" />
        </div>

        <form className="flex flex-col gap-8 md:gap-16" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-2xl font-bold sm:text-4xl text-[#aa0e0e]">
              Forget Password
            </h1>
            <p className="px-5 text-xs tracking-wide text-gray-500 md:text-sm max-w-sm">
              Please enter your Email to receive your confirmation code
            </p>
          </div>

          <div className="flex flex-col gap-3 md:w-[60%] mx-auto w-full px-6">
            <div className="relative w-full">
              <input
                type="email"
                name="email"
                placeholder="E-Mail*"
                className={`p-3 border rounded-lg focus:outline-none transition-all w-full focus:ring-2 focus:ring-[#d61111] ${
                  errors.email && touched.email
                    ? "border-orange-500"
                    : "border-gray-300"
                }`}
                value={values.email}
                onBlur={handleBlur}
                onChange={handleChange}
              />

              {errors.email && touched.email && (
                <p className="text-[11px] font-semibold text-orange-600 mt-1">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 md:w-[45%] mx-auto px-6">
            <button
              type="submit"
              disabled={isButtonDisabled}
              style={{
                backgroundColor: isButtonDisabled ? "#a1b5c7" : "#aa0e0e",
              }}
              className="w-full py-3 text-lg font-bold text-white transition-all duration-300 rounded-lg shadow-md active:scale-95 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Code"}
            </button>

            <div className="flex items-center justify-center gap-2">
              <img src={ArrowImage} alt="arrow" className="w-4 h-4" />
              <button
                type="button"
                className="font-semibold text-gray-600 border-b border-dotted border-gray-400 cursor-pointer hover:text-[#d61111] transition-colors"
                onClick={() => navigate(SIGNIN)}
              >
                Back to Login Page
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mx-10 p-3 bg-orange-50 text-orange-700 text-xs rounded border border-orange-200">
            {error.title}: {error.description}
          </div>
        )}
      </div>

      {/* Side Illustration */}
      <div className="container mx-auto md:mt-16 md:pr-16 lg:pr-28 w-[40%] hidden md:block">
        <div className="flex justify-center">
          <img
            src={imageValue ? ForgetImage2 : ForgetImage}
            alt="forget illustration"
            className={`max-w-full h-auto ${!imageValue && "animate-pulse"}`}
          />
        </div>
      </div>
    </section>
  );
};

export default ForgetComponent;
