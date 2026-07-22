import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Lock, Unlock, Loader2, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { usePostMutation, useGetQuery } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
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

const firstError = (err, field) => {
  const fieldErr = err?.data?.errors?.[field];
  return Array.isArray(fieldErr) ? fieldErr[0] : fieldErr;
};

/* Shared password input with show/hide toggle. */
function PwInput({ value, onChange, placeholder, hasError, autoFocus, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg outline-none"
        style={{ background: SURFACE_HOVER, border: `1px solid ${hasError ? BRAND_RED : BORDER}`, color: TEXT_PRIMARY }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute -translate-y-1/2 right-3 top-1/2"
        style={{ color: TEXT_MUTED }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>
      {children}
    </label>
  );
}

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div
      className="mt-2 px-3 py-2 text-[12px] font-semibold rounded-lg"
      style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
    >
      {children}
    </div>
  );
}

/**
 * FinanceGate — wraps finance-area pages behind a dedicated finance password.
 *
 * The unlock flag lives in the (non-persisted) financeGate redux slice, so
 * moving between finance pages doesn't re-prompt, but a full page refresh
 * re-locks. Unlock auto-expires after 10 minutes; a floating "Lock" button
 * lets the user re-lock manually.
 *
 * If the user hasn't set a finance password yet, the lock screen becomes a
 * "set your finance password" form (POST user/finance-password). Otherwise it
 * verifies via POST user/verify-finance-password, with a "change finance
 * password" flow available under the unlock form.
 */
export default function FinanceGate({ children }) {
  const dispatch = useDispatch();
  const unlocked = useSelector(selectFinanceUnlocked);
  const unlockedAt = useSelector(selectFinanceUnlockedAt);

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

  if (!unlocked) return <LockScreen />;

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

/* ------------------------------------------------------------------ */
/* Lock screen: set / unlock / change finance password.                */
/* ------------------------------------------------------------------ */
function LockScreen() {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("unlock"); // "unlock" | "setup" | "change"

  const {
    data: statusRes,
    isLoading: statusLoading,
    isFetching: statusFetching,
  } = useGetQuery(
    { path: "user/finance-password/status" },
    { refetchOnMountOrArgChange: true },
  );
  const isSet = statusRes?.data?.is_set;

  useEffect(() => {
    if (statusRes && isSet === false) setMode("setup");
  }, [statusRes, isSet]);

  // ---- unlock form state ----
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [verify, { isLoading: verifying }] = usePostMutation();

  // ---- set / change form state ----
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [save, { isLoading: saving }] = usePostMutation();

  const resetForms = () => {
    setPassword("");
    setError(null);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setFormErrors({});
  };

  const submitUnlock = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!password) {
      setError("Please enter your finance password.");
      return;
    }
    try {
      const res = await verify({
        path: "user/verify-finance-password",
        body: { password },
      }).unwrap();
      if (res?.data?.verified || res?.verified) {
        setPassword("");
        dispatch(unlockFinance());
      } else {
        setError(res?.message || "Finance password could not be verified.");
      }
    } catch (err) {
      setError(
        firstError(err, "password") ||
          err?.data?.message ||
          "Incorrect finance password.",
      );
    }
  };

  const submitSave = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (mode === "change" && !currentPw) errs.current_password = "Please enter your current finance password.";
    if (!newPw) errs.password = "Please enter a new finance password.";
    else if (newPw.length < 6) errs.password = "Finance password must be at least 6 characters.";
    if (newPw !== confirmPw) errs.password_confirmation = "Passwords do not match.";
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      await save({
        path: "user/finance-password",
        body: {
          password: newPw,
          password_confirmation: confirmPw,
          ...(mode === "change" ? { current_password: currentPw } : {}),
        },
      }).unwrap();
      showToast(
        mode === "change"
          ? "Finance password changed successfully."
          : "Finance password set successfully.",
        "success",
      );
      resetForms();
      // Auto-unlock — the user just proved they hold the new password.
      dispatch(unlockFinance());
    } catch (err) {
      setFormErrors({
        current_password: firstError(err, "current_password"),
        password: firstError(err, "password"),
        general:
          !firstError(err, "current_password") && !firstError(err, "password")
            ? err?.data?.message || "Could not save the finance password."
            : null,
      });
    }
  };

  const loadingStatus = statusLoading || (statusFetching && !statusRes);

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
          {mode === "setup" ? <ShieldCheck size={26} /> : mode === "change" ? <KeyRound size={26} /> : <Lock size={26} />}
        </div>

        {loadingStatus ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm" style={{ color: TEXT_MUTED }}>
            <Loader2 size={16} className="animate-spin" /> Checking finance password…
          </div>
        ) : mode === "setup" ? (
          <>
            <h2 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
              Set your finance password
            </h2>
            <p className="mt-1 text-[12.5px]" style={{ color: TEXT_MUTED }}>
              This is a separate password (not your login password) that protects
              financial data. You&apos;ll enter it to open finance pages and reveal figures.
            </p>
            <form onSubmit={submitSave} className="mt-5 text-left">
              <FieldLabel>New finance password</FieldLabel>
              <PwInput
                value={newPw}
                autoFocus
                autoComplete="new-password"
                onChange={(e) => { setNewPw(e.target.value); setFormErrors({}); }}
                placeholder="At least 6 characters"
                hasError={!!formErrors.password}
              />
              <ErrorBox>{formErrors.password}</ErrorBox>
              <div className="mt-3">
                <FieldLabel>Confirm finance password</FieldLabel>
                <PwInput
                  value={confirmPw}
                  autoComplete="new-password"
                  onChange={(e) => { setConfirmPw(e.target.value); setFormErrors({}); }}
                  placeholder="Repeat the password"
                  hasError={!!formErrors.password_confirmation}
                />
                <ErrorBox>{formErrors.password_confirmation}</ErrorBox>
              </div>
              <ErrorBox>{formErrors.general}</ErrorBox>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center w-full gap-2 py-2.5 mt-4 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: BRAND_RED }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                {saving ? "Saving…" : "Set password & unlock"}
              </button>
            </form>
          </>
        ) : mode === "change" ? (
          <>
            <h2 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
              Change finance password
            </h2>
            <p className="mt-1 text-[12.5px]" style={{ color: TEXT_MUTED }}>
              Enter your current finance password, then choose a new one.
            </p>
            <form onSubmit={submitSave} className="mt-5 text-left">
              <FieldLabel>Current finance password</FieldLabel>
              <PwInput
                value={currentPw}
                autoFocus
                autoComplete="current-password"
                onChange={(e) => { setCurrentPw(e.target.value); setFormErrors({}); }}
                placeholder="Current finance password"
                hasError={!!formErrors.current_password}
              />
              <ErrorBox>{formErrors.current_password}</ErrorBox>
              <div className="mt-3">
                <FieldLabel>New finance password</FieldLabel>
                <PwInput
                  value={newPw}
                  autoComplete="new-password"
                  onChange={(e) => { setNewPw(e.target.value); setFormErrors({}); }}
                  placeholder="At least 6 characters"
                  hasError={!!formErrors.password}
                />
                <ErrorBox>{formErrors.password}</ErrorBox>
              </div>
              <div className="mt-3">
                <FieldLabel>Confirm new finance password</FieldLabel>
                <PwInput
                  value={confirmPw}
                  autoComplete="new-password"
                  onChange={(e) => { setConfirmPw(e.target.value); setFormErrors({}); }}
                  placeholder="Repeat the new password"
                  hasError={!!formErrors.password_confirmation}
                />
                <ErrorBox>{formErrors.password_confirmation}</ErrorBox>
              </div>
              <ErrorBox>{formErrors.general}</ErrorBox>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center w-full gap-2 py-2.5 mt-4 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                style={{ background: BRAND_RED }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                {saving ? "Saving…" : "Change password"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { resetForms(); setMode("unlock"); }}
              className="mt-4 text-[11.5px] font-semibold underline"
              style={{ color: TEXT_MUTED }}
            >
              Back to unlock
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
              Finance area is locked
            </h2>
            <p className="mt-1 text-[12.5px]" style={{ color: TEXT_MUTED }}>
              Enter your finance password to unlock finance pages for this session.
            </p>
            <form onSubmit={submitUnlock} className="mt-5 text-left">
              <FieldLabel>Finance password</FieldLabel>
              <PwInput
                value={password}
                autoFocus
                autoComplete="current-password"
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Your finance password"
                hasError={!!error}
              />
              <ErrorBox>{error}</ErrorBox>
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
            <button
              type="button"
              onClick={() => { resetForms(); setMode("change"); }}
              className="mt-3 text-[11.5px] font-semibold underline"
              style={{ color: TEXT_MUTED }}
            >
              Change finance password
            </button>
          </>
        )}

        <p className="mt-4 text-[11px]" style={{ color: TEXT_MUTED }}>
          Unlock lasts 10 minutes and re-locks on page refresh.
        </p>
      </div>
    </div>
  );
}
