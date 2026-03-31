import React, { useEffect, useState } from "react";
import careerLogo from "../../../assets/images/SigninImages/careers.png";
import logo from "../../../assets/images/signinImages/logo.png";
import skillImage from "../../../assets/images/SigninImages/skill.png";
import ProjectImage from "../../../assets/images/SigninImages/project.png";
import profileImage from "../../../assets/images/SigninImages/profile.png";
import clientImage from "../../../assets/images/SigninImages/client.png";
import DiversImage from "../../../assets/images/SigninImages/divers.png";
import pricingImage from "../../../assets/images/SigninImages/pricing.jpg";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Aos from "aos";
import "aos/dist/aos.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { setCredentials } from "../../../features/auth/authSlice";
import { usePostMutation } from "../../../api/apiSlice";
import {
  ADMINDASHBOARD,
  FORGET,
  RESET,
  SIGNIN,
  SIGNUP,
  STUDENT_SUMMARY,
} from "../../routes/RouteConstants";
import { showToast } from "../../ui/common/ShowToast";
import Loader from "../../ui/common/LoaderComponent";

const defaultState = {
  email: "",
  password: "",
};

const SignInHero = () => {
  const [login, { isLoading }] = usePostMutation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passicon, setPassIcon] = useState(false);
  const error = useSelector((state) => state.error.error);
  const { token, user } = useSelector((state) => state.auth);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const signInValidation = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

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
            resetForm();
            dispatch(setCredentials({ user: res.data, token: res.meta.token }));
            // if (keepLoggedIn) {
            //   localStorage.setItem("token", res.meta.token);
            // }
            showToast("Welcome To Dashboard", "success");
            if (
              res.data.role === "admin" ||
              res.data.role === "oic" ||
              res.data.role === "manager" ||
              res.data.role === "asstmanager"
            ) {
              navigate(ADMINDASHBOARD);
            } else {
              navigate(STUDENT_SUMMARY);
            }
          } catch (err) {
            showToast(err.data.message, "error");
          } finally {
            setSubmitting(false);
          }
        }
      });
    },
  });
  useEffect(() => {
    if (token) {
      if (
        user?.role === "admin" ||
        user?.role === "oic" ||
        user?.role === "manager" ||
        user?.role === "asstmanager"
      ) {
        navigate(ADMINDASHBOARD);
      } else {
        navigate(STUDENT_SUMMARY);
      }
    } else {
      navigate(SIGNIN);
    }
  }, [token, user]);

  useEffect(() => {
    Aos.init({ duration: 1700 });
  }, []);

  return (
    <>
      {isLoading && <Loader />}
      {!token && (
        <section className="flex h-screen pt-16 pb-4 md:pt-10">
          <div className="container flex flex-col gap-12 w-full md:w-[60%] md:border-r border-gray-500">
            <div className="flex items-center justify-center md:items-center md:justify-center">
              <img src={logo} alt="logo" className="w-48 md:w-64" />
            </div>
            <form
              className="flex flex-col gap-5 md:gap-12"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-4xl md:text-5xl">
                  Welcome
                  <span className="text-2xl font-bold tracking-tight text-lightbrown sm:text-4xl md:text-5xl">
                    Back
                  </span>
                </h1>
                <p className="px-5 text-xs tracking-wide text-center text-lightbrown md:text-sm sm:text-center">
                  Sign in to continue your journey with us
                </p>
              </div>
              <div className="relative flex flex-col gap-3 md:flex md:flex-col md:gap-5 md:w-[60%] md:mx-auto md:items-start">
                <div className="relative w-full">
                  <input
                    type="email"
                    name="email"
                    placeholder={errors.email && touched.email ? "" : "E-mail*"}
                    className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
                      errors.email && touched.email && "border-red-500"
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
                    type={passicon ? "text" : "password"}
                    name="password"
                    placeholder={
                      errors.password && touched.password ? "" : "Password*"
                    }
                    className={`p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brown w-full ${
                      errors.password && touched.password && "border-red-500"
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
                    {passicon ? (
                      <FaEyeSlash
                        className="text-xl"
                        onClick={() => setPassIcon(!passicon)}
                      />
                    ) : (
                      <FaEye
                        className="text-xl"
                        onClick={() => setPassIcon(!passicon)}
                      />
                    )}
                  </span>
                </div>
                <div className="w-[100%] flex items-center justify-between ">
                  {/* <div className="flex items-center "> */}
                  {/* <div className="flex items-center justify-center gap-2 ">
                  {/* <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="cursor-pointer"
                    id="keep"
                    name="keep"
                  /> */}
                  {/* <label htmlFor="keep">Keep me logged in</label>
                </div>  */}
                  <Link
                    to={FORGET}
                    className="font-semibold underline cursor-pointer text-end"
                  >
                    Forgot password?
                  </Link>
                  {/* </div> */}
                </div>
              </div>
              <div className="flex flex-col md:w-[40%] mx-auto">
                <button
                  type="submit"
                  className="py-3 font-bold text-white transition duration-300 rounded-lg custom-AddButton"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>
            {error && (
              <div className="error">
                {error.title}: {error.description}
              </div>
            )}
            {/* <div className="flex items-center justify-center mt-5 underline cursor-pointer">
          <Link to={RESET} className="text-xs text-center md:text-sm">
            Trouble Logging in? Reset your password
          </Link>
        </div> */}
          </div>
          <div className="mx-auto  md:mt-24 md:pr-16 lg:mt-[8.5rem] lg:pr-28 w-[40%] hidden md:block">
            <div></div>
            <div className="mx-auto">
              <div className="relative">
                <img
                  src={careerLogo}
                  alt="Careerlogo"
                  className="md:w-[70%] lg:w-[60%] mx-auto"
                />
                <div
                  className="absolute -top-[14%] left-[30%] w-[38%] hover:scale-105"
                  data-aos="fade-down"
                >
                  <img
                    src={ProjectImage}
                    alt="projectlogo"
                    className="hover:scale-105"
                  />
                </div>
                <div className="absolute top-[5%] left-[61%] w-[38%] hover:scale-105">
                  <img
                    src={skillImage}
                    alt=""
                    className="hover:scale-105"
                    data-aos="fade-down-left"
                  />
                </div>
                <div className="absolute top-[25%] left-[70%] w-[38%] hover:scale-105">
                  <img src={profileImage} alt="" data-aos="fade-left" />
                </div>
                <div className="absolute top-[52%] left-[75%] w-[38%] hover:scale-105">
                  <img src={clientImage} alt="" data-aos="fade-left" />
                </div>
                <div className="absolute top-[80%] left-[70%] w-[38%] hover:scale-105">
                  <img src={DiversImage} alt="" data-aos="fade-up-left" />
                </div>
                <div
                  className="absolute top-[96%] left-[30%] w-[38%]"
                  data-aos="fade-up"
                >
                  <img src={pricingImage} alt="" className="hover:scale-105" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default SignInHero;
