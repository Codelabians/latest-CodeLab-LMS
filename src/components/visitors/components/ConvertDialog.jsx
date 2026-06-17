import React from "react";
import { ArrowRightCircle, GraduationCap, Loader2 } from "lucide-react";

const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";

const ConvertDialog = ({ open, visitor, target, onCancel, onConfirm, isLoading }) => {
  if (!open || !visitor || !target) return null;

  const isStudent = target === "student";
  const cfg = isStudent
    ? { fg: "#15803D", bg: "#F0FDF4", btn: "#15803D", Icon: GraduationCap, title: "Convert to student", verb: "Convert to student", caption: "Direct enrol — skip the inquiry step. Use only if the visitor is paying / decided." }
    : { fg: "#7C3AED", bg: "#F5F3FF", btn: "#7C3AED", Icon: ArrowRightCircle, title: "Convert to inquiry", verb: "Convert to inquiry", caption: "Promote the visitor to a Training Inquiry — they go into your inquiry funnel." };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: cfg.bg, color: cfg.fg }}>
          <cfg.Icon size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          {cfg.title}: &ldquo;{visitor.name}&rdquo;?
        </h3>
        <p className="mt-1.5 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          {cfg.caption}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={onConfirm} disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: cfg.btn }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Converting…</>) : cfg.verb}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertDialog;
