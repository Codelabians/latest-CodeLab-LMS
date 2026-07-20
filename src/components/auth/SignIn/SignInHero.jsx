import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import { useFormik } from "formik";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { setCredentials } from "../../../features/auth/authSlice";
import { usePostMutation } from "../../../api/apiSlice";
import {
  ADMINDASHBOARD,
  FORGET,
  PORTAL,
  TEACHER,
} from "../../routes/RouteConstants";
import { firstAccessibleRoute } from "../../dashboard/SidebarComponent";
import { showToast } from "../../ui/common/ShowToast";
import Loader from "../../ui/common/LoaderComponent";

// Brand tokens (kept inline so this page is self-contained and the brand
// colour is correct regardless of what tailwind.config or colors.js say).
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";

// Roles that are explicitly NOT allowed into the admin dashboard.
// The backend itself blocks `user` and `teacher` from /admin/authentication/login,
// but we mirror that on the client so the redirect logic stays in one place.
// Everyone else (admin, employee, receptionist, clerk, etc.) lands on the
// admin dashboard — their visible features are then driven by `permissions[]`.
const NON_ADMIN_ROLES = ["user", "teacher"];

// Decide where to drop a user after login. Admins get the full dashboard
// home; everyone else lands on the first page their role can actually open
// (computed from the same permission-gated sidebar), so no role is dumped on
// the finance-heavy home (or any page) they're not allowed to load.
const LEADERSHIP_ROLES = ["admin", "super_admin", "ceo", "coo"];
const landingRouteFor = (u) => {
  if (!u) return ADMINDASHBOARD;
  const roles = u.roles?.length ? u.roles : [u.role];
  if (roles.some((r) => LEADERSHIP_ROLES.includes(r))) return ADMINDASHBOARD;
  return firstAccessibleRoute(u) || ADMINDASHBOARD;
};

const defaultState = {
  email: "",
  password: "",
};

const SignInHero = () => {
  const [login, { isLoading }] = usePostMutation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [passicon, setPassIcon] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem("rememberMe") === "true"
  );
  const error = useSelector((state) => state.error?.error);
  const { token, user } = useSelector((state) => state.auth);

  const signInValidation = Yup.object({
    email: Yup.string()
      .email("Please enter a valid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const {
    handleBlur,
    handleChange,
    handleSubmit,
    values,
    errors,
    validateForm,
    touched,
    resetForm,
  } = useFormik({
    initialValues: defaultState,
    validationSchema: signInValidation,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (vals, { setSubmitting }) => {
      validateForm().then(async (validationErrors) => {
        if (Object.keys(validationErrors).length !== 0) {
          setSubmitting(false);
          return;
        }
        try {
          const res = await login({
            path: "/admin/authentication/login",
            body: vals,
          }).unwrap();

          const role = res?.data?.role;
          const apiToken = res?.meta?.token;

          // Defensive, multi-role aware: allow entry if the user holds ANY role
          // outside the student/teacher set — even as a SECONDARY role (e.g. a
          // primary "teacher" who is also a COO). Mirrors the backend gate.
          const roleList = (res?.data?.roles?.length ? res.data.roles : [role]).filter(Boolean);
          const hasPortalRole = roleList.some((r) => !NON_ADMIN_ROLES.includes(r));
          if (!hasPortalRole) {
            showToast("You are not allowed to access the admin panel.", "error");
            setSubmitting(false);
            return;
          }

          dispatch(setCredentials({ user: res.data, token: apiToken }));

          // Persist token only when the user asked us to remember them.
          // (authSlice already reads `localStorage.token` on init.)
          if (rememberMe && apiToken) {
            localStorage.setItem("token", apiToken);
            localStorage.setItem("rememberMe", "true");
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("rememberMe");
          }

          resetForm();
          showToast("Welcome back!", "success");
          navigate(landingRouteFor(res.data));
        } catch (err) {
          // Laravel returns { message, errors: { email: [...] } } on 422.
          const apiMsg =
            err?.data?.errors?.email?.[0] ||
            err?.data?.message ||
            "Unable to sign in. Please try again.";
          showToast(apiMsg, "error");
        } finally {
          setSubmitting(false);
        }
      });
    },
  });

  // If a token already exists in Redux, send the user where they belong:
  // students to their portal, teachers to the staff portal — never to an
  // admin page (previously this dumped them on /dashboard/student-summary).
  useEffect(() => {
    if (!token) return;
    if (user?.role === "user") {
      navigate(PORTAL);
    } else if (user?.role === "teacher") {
      navigate(TEACHER);
    } else {
      navigate(landingRouteFor(user));
    }
  }, [token, user, navigate]);

  return (
    <>
      {isLoading && <Loader />}
      {!token && (
        <section
          className="relative flex items-center justify-center min-h-screen px-4 py-10 overflow-hidden bg-white font-Montserrat"
          style={{
            backgroundImage: `
              radial-gradient(1200px 600px at -10% -20%, rgba(201,6,6,0.08) 0%, rgba(201,6,6,0) 60%),
              radial-gradient(900px 600px at 110% 110%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 60%)
            `,
          }}
        >
          {/* Faint corner accents */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2"
            style={{ background: BRAND_RED, filter: "blur(80px)" }}
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-20 translate-x-1/3 translate-y-1/3"
            style={{ background: "#000", filter: "blur(90px)" }}
          />

          <div className="relative w-full max-w-md">
            {/* Logo / brand mark */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                  boxShadow: "0 10px 30px -10px rgba(201,6,6,0.5)",
                }}
              >
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  C<span className="opacity-70">/</span>L
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-black">
                CODELAB
              </h1>
              <p className="mt-1 text-xs tracking-[0.18em] text-gray-500 uppercase">
                Your Potential. Our Dedication.
              </p>
            </div>

            {/* Card */}
            <div
              className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl"
              style={{ boxShadow: "0 20px 50px -20px rgba(0,0,0,0.15)" }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-black">
                  Sign in to your account
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your credentials to access the admin dashboard.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-semibold text-black"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className={`w-full px-4 py-3 text-sm text-black placeholder-gray-400 transition border rounded-lg outline-none bg-gray-50 focus:bg-white focus:ring-2 ${
                      errors.email && touched.email
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-red-100"
                    }`}
                    style={
                      !(errors.email && touched.email)
                        ? { borderColor: undefined }
                        : undefined
                    }
                    value={values.email}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-semibold text-black"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={passicon ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`w-full px-4 py-3 pr-12 text-sm text-black placeholder-gray-400 transition border rounded-lg outline-none bg-gray-50 focus:bg-white focus:ring-2 ${
                        errors.password && touched.password
                          ? "border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:ring-red-100"
                      }`}
                      value={values.password}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setPassIcon((v) => !v)}
                      aria-label={passicon ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500 transition hover:text-black"
                    >
                      {passicon ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember + forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 border-gray-300 rounded cursor-pointer"
                      style={{ accentColor: BRAND_RED }}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to={FORGET}
                    className="text-sm font-semibold transition hover:underline"
                    style={{ color: BRAND_RED }}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-2 text-sm font-bold tracking-wide text-white transition rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg active:translate-y-px"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                    boxShadow: "0 10px 25px -10px rgba(201,6,6,0.55)",
                  }}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              {error && (
                <div className="p-3 mt-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                  <span className="font-semibold">{error.title}:</span>{" "}
                  {error.description}
                </div>
              )}
            </div>

            <p className="mt-6 text-xs text-center text-gray-400">
              &copy; {new Date().getFullYear()} CODELAB. All rights reserved.
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default SignInHero;
