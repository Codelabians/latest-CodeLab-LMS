import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePostMutation } from "../../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { SIGNIN } from "../../routes/RouteConstants";
import AuthBrandHeader from "../AuthBrandHeader";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";

/**
 * Set-new-password page, opened from the reset link in the email as
 * /newpassword?token=...&email=... — restyled to match SignInHero, with
 * the logo driven from Settings → Company branding.
 */
const NewPasswordComponent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") || "";
  const resetEmail = searchParams.get("email") || "";
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatePassword, { isLoading }] = usePostMutation();

  const validation = Yup.object({
    password: Yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
    password_confirmation: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const { handleBlur, handleChange, handleSubmit, values, errors, touched } = useFormik({
    initialValues: { password: "", password_confirmation: "" },
    validationSchema: validation,
    onSubmit: async (vals) => {
      if (!resetToken || !resetEmail) {
        toast.error("This reset link is invalid or incomplete. Please request a new one.");
        return;
      }
      try {
        await updatePassword({
          path: "admin/authentication/password/reset",
          body: { ...vals, token: resetToken, email: resetEmail },
        }).unwrap();
        toast.success("Password updated. Please sign in with your new password.");
        navigate(SIGNIN);
      } catch (err) {
        const errs = err?.data?.errors;
        const firstErr = errs && Object.values(errs)[0]?.[0];
        toast.error(firstErr || err?.data?.message || "Could not reset password. The link may have expired — request a new one.");
      }
    },
  });

  const linkBroken = !resetToken || !resetEmail;

  const passwordField = (name, label, show, setShow) => (
    <div>
      <label htmlFor={name} className="block mb-2 text-sm font-semibold text-black">{label}</label>
      <div className="relative">
        <input
          id={name}
          type={show ? "text" : "password"}
          name={name}
          autoComplete="new-password"
          placeholder="••••••••"
          className={`w-full px-4 py-3 pr-11 text-sm text-black placeholder-gray-400 transition border rounded-lg outline-none bg-gray-50 focus:bg-white focus:ring-2 ${
            errors[name] && touched[name] ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-red-100"
          }`}
          value={values[name]}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        <span className="absolute text-gray-400 -translate-y-1/2 cursor-pointer right-4 top-1/2">
          {show ? <FaEyeSlash onClick={() => setShow(false)} /> : <FaEye onClick={() => setShow(true)} />}
        </span>
      </div>
      {errors[name] && touched[name] && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <section
      className="relative flex items-center justify-center min-h-screen px-4 py-10 overflow-hidden bg-white font-Montserrat"
      style={{
        backgroundImage: `
          radial-gradient(1200px 600px at -10% -20%, rgba(201,6,6,0.08) 0%, rgba(201,6,6,0) 60%),
          radial-gradient(900px 600px at 110% 110%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0) 60%)
        `,
      }}
    >
      <div aria-hidden="true" className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2" style={{ background: BRAND_RED, filter: "blur(80px)" }} />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-20 translate-x-1/3 translate-y-1/3" style={{ background: "#000", filter: "blur(90px)" }} />

      <div className="relative w-full max-w-md">
        <AuthBrandHeader />

        <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl" style={{ boxShadow: "0 20px 50px -20px rgba(0,0,0,0.15)" }}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black">Set a new password</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          {linkBroken && (
            <div className="flex items-start gap-2.5 p-3 mb-5 text-xs rounded-lg" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>
                This page must be opened from the reset link in your email.
                If you don&apos;t have one, request it from the <Link to="/forget" className="font-bold underline">Forgot Password</Link> page.
              </span>
            </div>
          )}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {passwordField("password", "New password", showPass, setShowPass)}
            {passwordField("password_confirmation", "Confirm password", showConfirm, setShowConfirm)}

            <button
              type="submit"
              disabled={isLoading || linkBroken}
              className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-white transition rounded-lg active:scale-[0.99] disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 10px 24px -12px rgba(201,6,6,0.6)" }}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Updating…" : "Update password"}
            </button>

            <Link to={SIGNIN} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black">
              <ArrowLeft size={15} /> Back to sign in
            </Link>
          </form>
        </div>
      </div>
    </section>
  );
};

export default NewPasswordComponent;
