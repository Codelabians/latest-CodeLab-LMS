import React, { useEffect, useState } from "react";
import CodeLabLogo from "../../../assets/images/SigninImages/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { usePostMutation } from "../../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import ResetImage from "../../../assets/images/reset/ezgif.com-video-to-gif-converter (1).gif";
import ResetImage2 from "../../../assets/images/reset/Resetpassword1-ezgif.com-video-to-gif-converter.gif";
import ArrowImage from "../../../assets/images/forget/arrow.png";
import { SIGNIN } from "../../routes/RouteConstants";
import { FaEye, FaEyeSlash } from "react-icons/fa";
const defaultState = {
  email: "",
  password: "",
  oldpassword: "",
  password_confirmation: "",
};
const ResetComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [oldPassicon, setOldPassIcon] = useState(false);
  const [newPassicon, setNewPassIcon] = useState(false);
  const [confirmPassicon, setConfirmPassIcon] = useState(false);
  const error = useSelector((state) => state.error.error);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [login, { isLoading }] = usePostMutation();
  const [imageValue, setImageValue] = useState(true);
  const signInValidation = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "New Password must be at least 8 characters")
      .required("New Password is required"),
    oldpassword: Yup.string().required("Old Password is required"),
    password_confirmation: Yup.string()
      .oneOf(
        [Yup.ref("password"), null],
        "Confirm Password must match New Password"
      )
      .min(8, "Confirm Password must be at least 8 characters")
      .required("Confirm Password is required"),
  });

  useEffect(() => {
    const timeOut = setTimeout(() => {
      setImageValue(false);
    }, 1000);

    return () => {
      clearTimeout(timeOut);
    };
  }, [imageValue]);
  const {
    handleBlur,
    handleChange,
    handleSubmit,
    values,
    errors,
    validateForm,
    touched,
    setSubmitting,
    resetForm,
  } = useFormik({
    initialValues: defaultState,
    validationSchema: signInValidation,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      setFormSubmitted(true);
      validateForm().then(async (validationErrors) => {
        if (Object.keys(validationErrors).length === 0) {
          try {
            const res = await login({
              path: "admin/authentication/login",
              body: values,
            }).unwrap();
            dispatch(setCredentials({ user: res.data, token: res.meta.token }));
            navigate(ADMINDASHBOARD);
          } catch (err) {
            console.error("Failed to login:", err);
          } finally {
            setSubmitting(false);
            resetForm();
          }
        } else {
          setSubmitting(false);
        }
      });
    },
  });
  return (
    <section className="flex h-screen pt-16 pb-4 md:pt-10">
      <div className="container flex flex-col gap-12 w-full md:w-[60%] md:border-r border-gray-500">
        <div className="flex items-center justify-center md:items-center md:justify-center">
          <img src={CodeLabLogo} alt="logo" className="w-48 md:w-64" />
        </div>
        <form className="flex flex-col gap-5 md:gap-14" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Reset New Password
            </h1>
            <p className="text-xs md:text-sm text-center px-5 sm:text-center tracking-wide w-[50%]">
              Your new password must be different from previously used password
            </p>
          </div>
          <div className="relative flex flex-col gap-3 md:flex md:flex-col md:gap-5 md:w-[60%] md:mx-auto md:items-start">
            <div className="relative w-full">
              <input
                type="email"
                name="email"
                placeholder={errors.email && touched.email ? "" : "E-Mail*"}
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
                  errors.email && touched.email && "border-brown"
                }`}
                value={values.email}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              {errors.email && touched.email && (
                <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
                  {errors.email}
                </div>
              )}
            </div>
            <div className="relative w-full">
              <input
                type={oldPassicon ? "text" : "password"}
                name="oldpassword"
                placeholder={
                  errors.oldpassword && touched.oldpassword
                    ? ""
                    : "Old Password*"
                }
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
                  errors.oldpassword && touched.oldpassword && "border-brown"
                }`}
                value={values.oldpassword}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              {errors.oldpassword && touched.oldpassword && (
                <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
                  {errors.oldpassword}
                </div>
              )}
              <span className="absolute cursor-pointer right-4 top-4">
                {oldPassicon ? (
                  <FaEyeSlash
                    className="text-xl"
                    onClick={() => setOldPassIcon(!oldPassicon)}
                  />
                ) : (
                  <FaEye
                    className="text-xl"
                    onClick={() => setOldPassIcon(!oldPassicon)}
                  />
                )}
              </span>
            </div>
            <div className="relative w-full">
              <input
                type={newPassicon ? "text" : "password"}
                name="password"
                placeholder={
                  errors.password && touched.password ? "" : "New Password*"
                }
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
                  errors.password && touched.password && "border-brown"
                }`}
                value={values.password}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              {errors.password && touched.password && (
                <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
                  {errors.password}
                </div>
              )}
              <span className="absolute cursor-pointer right-4 top-4">
                {newPassicon ? (
                  <FaEyeSlash
                    className="text-xl"
                    onClick={() => setNewPassIcon(!newPassicon)}
                  />
                ) : (
                  <FaEye
                    className="text-xl"
                    onClick={() => setNewPassIcon(!newPassicon)}
                  />
                )}
              </span>
            </div>
            <div className="relative w-full">
              <input
                type={confirmPassicon ? "text" : "password"}
                name="password_confirmation"
                placeholder={
                  errors.password_confirmation && touched.password_confirmation
                    ? ""
                    : "Confirm Password*"
                }
                className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
                  errors.password_confirmation &&
                  touched.password_confirmation &&
                  "border-brown"
                }`}
                value={values.password_confirmation}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              {errors.password_confirmation &&
                touched.password_confirmation && (
                  <div className="absolute text-xs font-bold text-red-500 top-1 left-2">
                    {errors.password_confirmation}
                  </div>
                )}
              <span className="absolute cursor-pointer right-4 top-4">
                {confirmPassicon ? (
                  <FaEyeSlash
                    className="text-xl"
                    onClick={() => setConfirmPassIcon(!confirmPassicon)}
                  />
                ) : (
                  <FaEye
                    className="text-xl"
                    onClick={() => setConfirmPassIcon(!confirmPassicon)}
                  />
                )}
              </span>
            </div>
          </div>
          <div className="flex flex-col md:w-[40%] mx-auto ">
            <button
              type="submit"
              className="py-3 text-lg font-bold text-white transition duration-300 rounded-lg bg-brown hover:bg-darkbrown"
            >
              Save
            </button>
            <div className="flex flex-wrap items-center justify-center gap-2 my-4 ">
              <img src={ArrowImage} alt="" />
              <h1>Remember password?</h1>
              <Link
                to={SIGNIN}
                className="font-semibold text-center border-b border-dotted cursor-pointer text-darkbrown"
              >
                Login
              </Link>
            </div>
          </div>
        </form>
        {error && (
          <div className="error">
            {error.title}: {error.description}
          </div>
        )}
      </div>
      <div className="container mx-auto md:mt-24 md:pr-16 lg:mt-20 lg:pr-28 w-[40%] hidden md:block">
        <div className="mx-auto">
          {imageValue ? (
            <img src={ResetImage2} alt="" />
          ) : (
            <img src={ResetImage} alt="" />
          )}
        </div>
      </div>
    </section>
  );
};

export default ResetComponent;
