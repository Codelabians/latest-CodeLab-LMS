import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { clearCredentials } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

/**
 * Full-screen, non-dismissable gate shown when the logged-in user still
 * has must_reset_password = true (account created with a temporary password
 * that was emailed to them). They cannot reach the rest of the portal until
 * they set their own password. On success the backend revokes the token, so
 * we clear credentials and send them back to the login screen.
 *
 * Props:
 *   changePath  - API path for change-password ("/user/password" | "/teacher/password")
 *   loginRoute  - where to send the user after a successful reset
 *   subtitle    - small caption under the heading
 */
export default function ForcePasswordReset({ changePath, loginRoute, subtitle = "Set a new password to continue" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [post, { isLoading }] = usePostMutation();
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.current || !form.next || !form.confirm) {
      showToast("Fill in all the fields.", "error");
      return;
    }
    if (form.next.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (form.next !== form.confirm) {
      showToast("New password and confirmation don't match.", "error");
      return;
    }
    try {
      await post({
        path: changePath,
        body: {
          current_password: form.current,
          password: form.next,
          password_confirmation: form.confirm,
        },
      }).unwrap();
      showToast("Password updated. Please sign in with your new password.", "success");
      dispatch(clearCredentials());
      localStorage.removeItem("token");
      navigate(loginRoute, { replace: true });
    } catch (err) {
      showToast(
        err?.data?.errors?.current_password?.[0] ||
          err?.data?.errors?.password?.[0] ||
          err?.data?.message ||
          "Could not update your password.",
        "error",
      );
    }
  };

  const signOut = () => {
    dispatch(clearCredentials());
    localStorage.removeItem("token");
    navigate(loginRoute, { replace: true });
  };

  const Pw = ({ label, value, onChange, show, setShow, placeholder }) => (
    <div>
      <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2.5 pr-10 rounded-lg text-[13px] outline-none"
          style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}
          placeholder={placeholder}
        />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FAFBFC", fontFamily: "'Montserrat', sans-serif" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-7" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex flex-col items-center mb-5">
          <span className="grid place-items-center rounded-2xl text-white mb-3" style={{ width: 52, height: 52, background: BRAND }}>
            <ShieldCheck size={26} />
          </span>
          <h1 className="text-[18px] font-bold" style={{ color: "#0F172A" }}>Choose your password</h1>
          <p className="text-[12px] text-center" style={{ color: "#94A3B8" }}>{subtitle}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {Pw({ label: "Temporary password (from email)", value: form.current, onChange: upd("current"), show: showCur, setShow: setShowCur, placeholder: "Paste the emailed password" })}
          {Pw({ label: "New password", value: form.next, onChange: upd("next"), show: showNew, setShow: setShowNew, placeholder: "At least 8 characters" })}
          {Pw({ label: "Confirm new password", value: form.confirm, onChange: upd("confirm"), show: showNew, setShow: setShowNew, placeholder: "Re-enter new password" })}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />} Update password
          </button>
        </form>

        <button type="button" onClick={signOut} className="w-full mt-3 py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5" style={{ color: "#94A3B8" }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}
