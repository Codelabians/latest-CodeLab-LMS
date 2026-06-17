import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Presentation, Eye, EyeOff, Loader2 } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { setCredentials } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import { TEACHER } from "../routes/RouteConstants";

const BRAND = "#C90606";

/** Teacher portal login — posts to /teacher/authentication/login (accepts
 *  the teacher role), then routes into the /teacher-portal layout. */
export default function TeacherLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = usePostMutation();
  const { token } = useSelector((s) => s.auth);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  if (token) navigate(TEACHER);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { showToast("Enter your email and password.", "error"); return; }
    try {
      const res = await login({ path: "/teacher/authentication/login", body: form }).unwrap();
      const apiToken = res?.meta?.token;
      dispatch(setCredentials({ user: res.data, token: apiToken }));
      if (apiToken) localStorage.setItem("token", apiToken);
      showToast("Welcome back!", "success");
      navigate(TEACHER);
    } catch (err) {
      showToast(err?.data?.errors?.email?.[0] || err?.data?.message || "Unable to sign in.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FAFBFC", fontFamily: "'Montserrat', sans-serif" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-7" style={{ border: "1px solid #EEF2F6" }}>
        <div className="flex flex-col items-center mb-6">
          <span className="grid place-items-center rounded-2xl text-white mb-3" style={{ width: 52, height: 52, background: BRAND }}>
            <Presentation size={26} />
          </span>
          <h1 className="text-[18px] font-bold" style={{ color: "#0F172A" }}>Staff Portal</h1>
          <p className="text-[12px]" style={{ color: "#94A3B8" }}>Sign in to access your work & employment details</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: "1px solid #EEF2F6" }} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2.5 pr-10 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: "1px solid #EEF2F6" }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white flex items-center justify-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading && <Loader2 size={16} className="animate-spin" />} Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
