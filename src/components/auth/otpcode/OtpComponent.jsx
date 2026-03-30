import React, { useRef } from "react";
import Logo from "../../../assets/images/park logo.png";
import { useNavigate } from "react-router-dom";
import { usePostMutation } from "../../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import { NEWPASSWORD, SIGNIN } from "../../routes/RouteConstants";
import { toast } from "react-toastify";

const OtpComponent = () => {
  const navigate = useNavigate();
  const [verifyOtp, { isLoading }] = usePostMutation();

  // Refs for auto-focusing
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Validation: Each field must be exactly 1 digit
  const otpValidation = Yup.object({
    otp1: Yup.string()
      .required("Required")
      .matches(/^[0-9]$/, "Must be a digit"),
    otp2: Yup.string()
      .required("Required")
      .matches(/^[0-9]$/, "Must be a digit"),
    otp3: Yup.string()
      .required("Required")
      .matches(/^[0-9]$/, "Must be a digit"),
    otp4: Yup.string()
      .required("Required")
      .matches(/^[0-9]$/, "Must be a digit"),
  });

  const {
    handleBlur,
    handleChange,
    handleSubmit,
    values,
    errors,
    touched,
    isValid,
    dirty,
  } = useFormik({
    initialValues: { otp1: "", otp2: "", otp3: "", otp4: "" },
    validationSchema: otpValidation,
    onSubmit: async (values) => {
      const fullOtp = `${values.otp1}${values.otp2}${values.otp3}${values.otp4}`;
      try {
        await verifyOtp({
          path: "admin/authentication/verify-otp",
          body: { otp: fullOtp },
        }).unwrap();

        navigate(NEWPASSWORD);
      } catch (err) {
        toast.error(err.data.message);
        console.error("Verification failed", err);
      }
    },
  });

  // Check if all fields are filled to enable the button
  const isFormComplete =
    values.otp1 && values.otp2 && values.otp3 && values.otp4;

  const handleInputLogic = (e, index) => {
    const { value } = e.target;
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !values[`otp${index + 1}`] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  return (
    <section className="flex pt-16 pb-4 md:pt-10 h-screen bg-white">
      <div className="container flex flex-col gap-12 w-full md:w-[60%] mx-auto px-4">
        <div className="flex justify-center">
          <img src={Logo} alt="logo" className="w-48 md:w-54" />
        </div>

        <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#aa0e0e]">
              Verify your Email
            </h1>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Please enter the 4-digit code sent to your Email
            </p>
          </div>

          <div className="flex gap-3 md:gap-5 items-center justify-center">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex flex-col items-center">
                <input
                  ref={inputRefs[index]}
                  type="text"
                  name={`otp${index + 1}`}
                  maxLength="1"
                  inputMode="numeric"
                  className={`w-14 h-16 md:w-16 md:h-20 text-center text-3xl font-bold bg-[#eef4fa] border-b-4 rounded-xl transition-all outline-none
                    ${
                      touched[`otp${index + 1}`] && errors[`otp${index + 1}`]
                        ? "border-orange-500 shadow-sm"
                        : "border-[#aa0e0e] focus:border-[#d61111] focus:ring-4 focus:ring-[#d61111]/10"
                    }`}
                  value={values[`otp${index + 1}`]}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    // Only allow numeric input
                    if (/^\d?$/.test(e.target.value)) {
                      handleChange(e);
                      handleInputLogic(e, index);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            ))}
          </div>

          {/* Error Message Display */}
          {(touched.otp1 || touched.otp2 || touched.otp3 || touched.otp4) &&
            !isValid && (
              <p className="text-center text-orange-600 text-sm font-medium">
                Please enter a valid 4-digit code
              </p>
            )}

          <div className="flex flex-col items-center gap-6 mt-4">
            <button
              disabled={isLoading || !isFormComplete}
              type="submit"
              style={{
                backgroundColor: isFormComplete ? "#aa0e0e" : "#a1b5c7",
                cursor: isFormComplete ? "pointer" : "not-allowed",
              }}
              className="w-48 py-3 text-lg text-white font-bold rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:shadow-none"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              onClick={() => navigate(SIGNIN)}
              className="text-gray-500 hover:text-[#d61111] text-sm font-semibold transition-colors"
            >
              Didn't receive code?{" "}
              <span className="underline decoration-dotted underline-offset-4">
                Resend
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default OtpComponent;
