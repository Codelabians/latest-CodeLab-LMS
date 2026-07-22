import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import { Eye, EyeOff, Lock, Loader2 , X } from "lucide-react";
import { usePostMutation } from "../../api/apiSlice";
import { selectFinanceUnlocked } from "../../features/financeGate/financeGateSlice";

/* ---- design tokens (match FinanceGate / Finance pages) ---- */
const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

/* ------------------------------------------------------------------ */
/* Module-level "revealed keys" store.                                 */
/*                                                                     */
/* Deliberately NOT in redux/persist: reveals are in-memory only, so a */
/* page refresh hides everything again. When the FinanceGate re-locks  */
/* (manual lock, 10-minute expiry, or refresh) every reveal is reset.  */
/* ------------------------------------------------------------------ */
const revealedKeys = new Set();
const listeners = new Set();
let version = 0;
const emit = () => { version += 1; listeners.forEach((l) => l()); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getVersion = () => version;

export const revealFigure = (key) => { if (!revealedKeys.has(key)) { revealedKeys.add(key); emit(); } };
export const hideFigure = (key) => { if (revealedKeys.delete(key)) emit(); };
export const resetRevealedFigures = () => { if (revealedKeys.size) { revealedKeys.clear(); emit(); } };

/* ------------------------------------------------------------------ */
/* Shared password prompt — one implementation for every SecureFigure. */
/* ------------------------------------------------------------------ */
export function RevealPrompt({ onClose, onVerified }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [verify, { isLoading: verifying }] = usePostMutation();
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!password) {
      setError("Please enter your finance password.");
      return;
    }
    try {
      const res = await verify({ path: "user/verify-finance-password", body: { password } }).unwrap();
      if (res?.data?.verified || res?.verified) {
        setPassword("");
        onVerified();
      } else {
        setError(res?.message || "Finance password could not be verified.");
      }
    } catch (err) {
      const fieldErr = err?.data?.errors?.password;
      setError(
        (Array.isArray(fieldErr) ? fieldErr[0] : fieldErr) ||
          err?.data?.message ||
          "Incorrect finance password.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="w-full max-w-xs p-5 bg-white rounded-2xl shadow-lg"
        style={{ border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="grid rounded-lg place-items-center" style={{ width: 30, height: 30, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Lock size={15} />
            </span>
            <div>
              <div className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Reveal figure</div>
              <div className="text-[10.5px]" style={{ color: TEXT_MUTED }}>Enter your finance password to show it</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg" style={{ color: TEXT_MUTED }}>
            <X size={15} />
          </button>
        </div>
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            placeholder="Your finance password"
            autoComplete="current-password"
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${error ? BRAND_RED : BORDER}`, color: TEXT_PRIMARY }}
          />
          {error && (
            <div className="mt-2 px-2.5 py-1.5 text-[11.5px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
              {error}
              {/no finance password set/i.test(error) && (
                <div className="mt-1 font-normal" style={{ color: TEXT_SECONDARY }}>
                  Set it from the finance lock screen.
                </div>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={verifying}
            className="flex items-center justify-center w-full gap-1.5 py-2 mt-3 text-[12.5px] font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ background: BRAND_RED }}
          >
            {verifying ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
            {verifying ? "Verifying…" : "Reveal"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SecureFigure — masks a sensitive money figure (inline) or a whole   */
/* card/section (card) until the user re-enters their password.        */
/* Hiding again is instant; revealing always prompts.                  */
/* ------------------------------------------------------------------ */
export default function SecureFigure({ children, maskKey, variant = "inline", className = "", maskText = "Rs ••••••" }) {
  useSyncExternalStore(subscribe, getVersion);
  const unlocked = useSelector(selectFinanceUnlocked);
  const [promptOpen, setPromptOpen] = useState(false);
  const revealed = revealedKeys.has(maskKey);

  // FinanceGate re-locked (manual, expiry or refresh) → hide everything.
  useEffect(() => {
    if (!unlocked) {
      resetRevealedFigures();
      setPromptOpen(false);
    }
  }, [unlocked]);

  const onEyeClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (revealed) hideFigure(maskKey); // hiding is instant
    else setPromptOpen(true); // revealing needs the password
  };
  const onVerified = () => { revealFigure(maskKey); setPromptOpen(false); };

  const prompt = promptOpen ? <RevealPrompt onClose={() => setPromptOpen(false)} onVerified={onVerified} /> : null;

  if (variant === "card") {
    return (
      <div className={`relative ${className}`}>
        <div
          style={revealed ? undefined : { filter: "blur(10px)", userSelect: "none", pointerEvents: "none", opacity: 0.55 }}
          aria-hidden={!revealed}
        >
          {children}
        </div>
        {!revealed && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl"
            style={{ background: "rgba(248,250,252,0.35)", fontFamily: "'Montserrat', sans-serif" }}
          >
            <span className="grid rounded-full place-items-center" style={{ width: 34, height: 34, background: BRAND_RED_TINT, color: BRAND_RED }}>
              <Lock size={16} />
            </span>
            <button
              type="button"
              onClick={onEyeClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold rounded-lg bg-white shadow-sm"
              style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}
            >
              <Eye size={13} /> Reveal
            </button>
          </div>
        )}
        {revealed && (
          <button
            type="button"
            onClick={onEyeClick}
            title="Hide figure"
            className="absolute z-10 grid rounded-md place-items-center bg-white"
            style={{ top: 8, right: 8, width: 24, height: 24, border: `1px solid ${BORDER}`, color: TEXT_MUTED }}
          >
            <EyeOff size={12} />
          </button>
        )}
        {prompt}
      </div>
    );
  }

  // inline variant
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {revealed ? (
        children
      ) : (
        <span aria-label="Hidden amount" style={{ letterSpacing: 1 }}>{maskText}</span>
      )}
      <button
        type="button"
        onClick={onEyeClick}
        title={revealed ? "Hide figure" : "Reveal figure"}
        className="inline-grid rounded place-items-center align-middle"
        style={{ width: 18, height: 18, color: TEXT_MUTED }}
      >
        {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      {prompt}
    </span>
  );
}
