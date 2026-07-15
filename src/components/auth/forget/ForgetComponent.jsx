import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePostMutation } from "../../../api/apiSlice";
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { SIGNIN } from "../../routes/RouteConstants";
import AuthBrandHeader from "../AuthBrandHeader";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";

/**
 * Forgot-password page, restyled to match SignInHero (same background,
 * centered card, brand accents) with the logo driven from Settings →
 * Company branding instead of a hardcoded image. The backend emails a
 * reset LINK that lands on /newpassword?token=...&email=...
 */
const ForgetComponent = () => {
  const navigate = useNavigate();
  const [forget, { isLoading }] = usePostMutation();
  const [sent, setSent] = useState(false);

  const validation = Yup.object({
    email: Yup.string().email("Enter a valid email").required("Email is required"),
  });

  const { handleBlur, handleChange, handleSubmit, values, errors, touched } = useFormik({
    initialValues: { email: "" },
    validationSchema: validation,
    onSubmit: async (vals) => {
      try {
        await forget({ path: "/admin/authentication/forget-password", body: vals }).unwrap();
        setSent(true);
        toast.success("Password reset link sent — check your email inbox.");
      } catch (err) {
        toast.error(err?.data?.message || "Something went wrong. Please try again.");
      }
    },
  });

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
      {/* Faint corner accents — same creative language as the sign-in page */}
      <div aria-hidden="true" className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2" style={{ background: BRAND_RED, filter: "blur(80px)" }} />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-56 h-56 rounded-full opacity-20 translate-x-1/3 translate-y-1/3" style={{ background: "#000", filter: "blur(90px)" }} />

      <div className="relative w-full max-w-md">
        <AuthBrandHeader />

        <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl" style={{ boxShadow: "0 20px 50px -20px rgba(0,0,0,0.15)" }}>
          {sent ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full" style={{ background: "#F0FDF4", color: "#15803D" }}>
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-bold text-black">Check your email</h2>
              <p className="mt-2 text-sm text-gray-500">
                If an account exists for <b>{values.email}</b>, a password reset link is on its way.
                Open it on this device to set your new password.
              </p>
              <Link to={SIGNIN} className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold" style={{ color: BRAND_RED }}>
                <ArrowLeft size={15} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-black">Forgot your password?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your email and we&apos;ll send you a password reset link.
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-semibold text-black">Email address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 text-sm text-black placeholder-gray-400 transition border rounded-lg outline-none bg-gray-50 focus:bg-white focus:ring-2 ${
                      errors.email && touched.email ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-red-100"
                    }`}
                    value={values.email}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !values.email || !!errors.email}
                  className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold text-white transition rounded-lg active:scale-[0.99] disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, boxShadow: "0 10px 24px -12px rgba(201,6,6,0.6)" }}
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? "Sending…" : "Email me a reset link"}
                </button>

                <Link to={SIGNIN} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black">
                  <ArrowLeft size={15} /> Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ForgetComponent;
