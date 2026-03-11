import React, { useEffect, useState } from "react";
import Logo from "../../../assets/images/park logo.png";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { usePostMutation } from "../../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import ForgetImage from "../../../assets/images/forget/ezgif.com-video-to-gif-converter.gif";
import ForgetImage2 from "../../../assets/images/forget/Forgotpassword1-ezgif.com-video-to-gif-converter.gif";
import ArrowImage from "../../../assets/images/forget/arrow.png";
import { SIGNIN } from "../../routes/RouteConstants";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ForgetComponent = () => {
  const navigate = useNavigate();
  const [passicon, setPassIcon] = useState(false);
  const [confirmPassIcon, setConfirmPassIcon] = useState(false);
  const error = useSelector((state) => state.error.error);
  const [updatePassword, { isLoading }] = usePostMutation();
  const [imageValue, setImageValue] = useState(true);

  const signInValidation = Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("Password is required"),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setImageValue(false);
    }, 2000);
    return () => clearTimeout(timeOut);
  }, []);

  const { handleBlur, handleChange, handleSubmit, values, errors, touched } =
    useFormik({
      initialValues: { password: "", password_confirmation: "" },
      validationSchema: signInValidation,
      onSubmit: async (values) => {
        try {
          await updatePassword({
            path: "admin/authentication/reset-password",
            body: values,
          }).unwrap();
          // Navigate to Signin on success
          navigate(SIGNIN);
        } catch (err) {
          console.error("Failed to reset password:", err);
        }
      },
    });

  return (
    <section className="flex pt-16 pb-4 md:pt-10 h-screen bg-white">
      <div className="container flex flex-col gap-12 w-full md:w-[60%] md:border-r border-gray-200">
        <div className="flex items-center justify-center">
          <img src={Logo} alt="logo" className="w-48 md:w-54" />
        </div>

        <form className="flex flex-col gap-8 md:gap-14" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-[#014376]">
              New Password
            </h1>
            <p className="text-xs md:text-sm text-gray-500 px-5 tracking-wide max-w-sm">
              Your new password must be different from previously used
              passwords.
            </p>
          </div>

          <div className="flex flex-col gap-5 md:w-[65%] mx-auto w-full px-6">
            {/* New Password Input */}
            <div className="relative w-full">
              <input
                type={passicon ? "text" : "password"}
                name="password"
                placeholder="New Password*"
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31918D] w-full transition-all ${
                  errors.password && touched.password
                    ? "border-orange-500"
                    : "border-gray-300"
                }`}
                value={values.password}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              <span className="absolute right-4 top-4 cursor-pointer text-gray-400">
                {passicon ? (
                  <FaEyeSlash onClick={() => setPassIcon(false)} />
                ) : (
                  <FaEye onClick={() => setPassIcon(true)} />
                )}
              </span>
              {errors.password && touched.password && (
                <div className="text-orange-600 text-[10px] font-bold mt-1">
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="relative w-full">
              <input
                type={confirmPassIcon ? "text" : "password"}
                name="password_confirmation"
                placeholder="Confirm Password*"
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#31918D] w-full transition-all ${
                  errors.password_confirmation && touched.password_confirmation
                    ? "border-orange-500"
                    : "border-gray-300"
                }`}
                value={values.password_confirmation}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              <span className="absolute right-4 top-4 cursor-pointer text-gray-400">
                {confirmPassIcon ? (
                  <FaEyeSlash onClick={() => setConfirmPassIcon(false)} />
                ) : (
                  <FaEye onClick={() => setConfirmPassIcon(true)} />
                )}
              </span>
              {errors.password_confirmation &&
                touched.password_confirmation && (
                  <div className="text-orange-600 text-[10px] font-bold mt-1">
                    {errors.password_confirmation}
                  </div>
                )}
            </div>
          </div>

          <div className="flex flex-col items-center w-full px-6 gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-64 py-3 bg-[#014376] text-white font-bold rounded-lg hover:bg-[#01355d] transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>

            <div className="flex items-center justify-center gap-2">
              <img src={ArrowImage} alt="back" className="w-4 h-4" />
              <Link
                to={SIGNIN}
                className="text-center cursor-pointer border-b border-dotted border-gray-500 font-semibold text-gray-600 hover:text-[#31918D]"
              >
                Back to Login Page
              </Link>
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-orange-50 p-3 mx-6 rounded border border-orange-200 text-orange-700 text-sm">
            {error.title}: {error.description}
          </div>
        )}
      </div>

      {/* Side Image Section */}
      <div className="w-[40%] hidden md:flex items-center justify-center pr-16 lg:pr-28">
        <div className="max-w-md">
          <img
            src={imageValue ? ForgetImage2 : ForgetImage}
            alt="forget animation"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default ForgetComponent;
