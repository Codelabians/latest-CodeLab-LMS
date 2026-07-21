import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Lock, Unlock, Loader2, Eye, EyeOff } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import {
  unlockFinance,
  lockFinance,
  selectFinanceUnlocked,
  selectFinanceUnlockedAt,
} from "../../features/financeGate/financeGateSlice";

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

// Auto-relock after 10 minutes of being unlocked.
const RELOCK_MS = 10 * 60 * 1000;

/**
 * FinanceGate — wraps finance-area pages behind a password prompt.
 *
 * The unlock flag lives in the (non-persisted) financeGate redux slice, so
 * moving between finance pages doesn't re-prompt, but a full page refresh
 * re-locks. Unlock auto-expires after 10 minutes; a floating "Lock" button
 * lets the user re-lock manually.
 */
export default function FinanceGate({ children }) {
  const dispatch = useDispatch();
  const unlocked = useSelector(selectFinanceUnlocked);
  const unlockedAt = useSelector(selectFinanceUnlockedAt);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [verify, { isLoading: verifying }] = usePostMutation();

  // Auto-relock 10 minutes after unlock.
  useEffect(() => {
    if (!unlocked || !unlockedAt) return;
    const remaining = unlockedAt + RELOCK_MS - Date.now();
    if (remaining <= 0) {
      dispatch(lockFinance());
      return;
    }
    const t = setTimeout(() => dispatch(lockFinance()), remaining);
    return () => clearTimeout(t);
  }, [unlocked, unlockedAt, dispatch]);

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    try {
      const res = await verify({ path: "user/verify-password", body: { password } }).unwrap();
      if (res?.data?.verified || res?.verified) {
        setPassword("");
        dispatch(unlockFinance());
      } else {
        setError(res?.message || "Password could not be verified.");
      }
    } catch (err) {
      const fieldErr = err?.data?.errors?.password;
      setError(
        (Array.isArray(fieldErr) ? fieldErr[0] : fieldErr) ||
          err?.data?.message ||
          "Incorrect password.",
      );
    }
  };

  if (!unlocked) {
    return (
      <div
        className="flex items-center justify-center px-4"
        style={{ minHeight: "calc(100vh - 8rem)", fontFamily: "'Montserrat', sans-serif" }}
      >
        <div
          className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-sm text-center"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full"
            style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <Lock size={26} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
            Finance area is locked
          </h2>
          <p className="mt-1 text-[12.5px]" style={{ color: TEXT_MUTED }}>
            Enter your account password to unlock finance pages for this session.
          </p>
          <form onSubmit={submit} className="mt-5 text-left">
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                autoFocus
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Your password"
                className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg outline-none"
                style={{ background: SURFACE_HOVER, border: `1px solid ${error ? BRAND_RED : BORDER}`, color: TEXT_PRIMARY }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute -translate-y-1/2 right-3 top-1/2"
                style={{ color: TEXT_MUTED }}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <div
                className="mt-2 px-3 py-2 text-[12px] font-semibold rounded-lg"
                style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={verifying}
              className="flex items-center justify-center w-full gap-2 py-2.5 mt-4 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ background: BRAND_RED }}
            >
              {verifying ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />}
              {verifying ? "Verifying…" : "Unlock"}
            </button>
          </form>
          <p className="mt-4 text-[11px]" style={{ color: TEXT_MUTED }}>
            Unlock lasts 10 minutes and re-locks on page refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating manual re-lock button */}
      <button
        type="button"
        onClick={() => dispatch(lockFinance())}
        title="Lock the finance area again"
        className="fixed z-40 inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-full shadow-lg"
        style={{ bottom: 20, right: 20, background: "#0F172A", color: "#fff", fontFamily: "'Montserrat', sans-serif" }}
      >
        <Lock size={13} /> Lock
      </button>
      {children}
    </div>
  );
}
