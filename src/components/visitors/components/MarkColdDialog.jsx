import React, { useEffect, useState } from "react";
import { Snowflake, X, Loader2 } from "lucide-react";

const BRAND_RED = "#C90606";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const MarkColdDialog = ({ open, visitor, onCancel, onConfirm, isLoading }) => {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (open) { setReason(""); setTouched(false); setServerError(""); }
  }, [open]);

  if (!open || !visitor) return null;

  const trimmed = reason.trim();
  const err = trimmed.length === 0
    ? "A reason is required"
    : trimmed.length > 500
    ? "Reason must be 500 characters or fewer"
    : "";
  const visibleErr = touched ? err : "";
  const canSubmit = !err && !isLoading;

  const handle = async () => {
    setTouched(true);
    if (err) return;
    setServerError("");
    const res = await onConfirm(trimmed);
    if (res?.error) setServerError(res.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
          <Snowflake size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Mark &ldquo;{visitor.name}&rdquo; as cold
        </h3>
        <p className="mt-1.5 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          Reception will stop following up. The reason is stored for the record.
        </p>

        {serverError && (
          <div className="p-2.5 mt-3 text-[12px] rounded-lg" style={{ background: "#FEF2F2", color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}>
            {serverError}
          </div>
        )}

        <div className="mt-4">
          <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
            Cold reason <span style={{ color: BRAND_RED }}>*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (serverError) setServerError(""); }}
            onBlur={() => setTouched(true)}
            placeholder="Said they'll come back — never did. Phone off for 2 weeks."
            disabled={isLoading}
            style={{
              background: SURFACE_HOVER,
              border: `1px solid ${visibleErr ? "#FCA5A5" : BORDER}`,
              color: TEXT_PRIMARY,
              fontFamily: "'Montserrat', sans-serif",
              width: "100%",
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              resize: "vertical",
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px]" style={{ color: visibleErr ? BRAND_RED : TEXT_MUTED, fontWeight: visibleErr ? 500 : 400 }}>
              {visibleErr || "Required • 500 characters max"}
            </p>
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>{trimmed.length}/500</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={handle} disabled={!canSubmit}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#1D4ED8" }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Saving…</>) : (<><Snowflake size={14} className="mr-1.5" />Mark cold</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkColdDialog;
