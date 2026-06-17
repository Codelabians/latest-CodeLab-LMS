import React, { useEffect, useMemo, useState } from "react";
import { X, GitMerge, AlertTriangle, Loader2, ArrowRight, Users } from "lucide-react";
import SearchableSelect from "../../ui/SearchableSelect";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";

/**
 * MergeBatchModal — pick a target batch to merge the SOURCE into.
 *
 * Props:
 *   isOpen
 *   source            — { batch_uuid, name, course_id, course_name, students_count, ... }
 *   candidates        — list of OTHER batches the source can merge into.
 *                       Caller is expected to filter to same-course +
 *                       not-already-merged + not-the-source.
 *   onCancel
 *   onConfirm(uuid)   — Promise<{error: string | null}>
 *   isLoading
 */
const MergeBatchModal = ({ isOpen, source, candidates = [], onCancel, onConfirm, isLoading }) => {
  const [targetUuid, setTargetUuid] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isOpen) { setTargetUuid(""); setServerError(""); }
  }, [isOpen]);

  const options = useMemo(
    () => candidates.map((b) => ({
      value: b.batch_uuid,
      label: `${b.name}${b.teacher_name ? " · " + b.teacher_name : ""}`,
    })),
    [candidates]
  );

  if (!isOpen || !source) return null;

  const target = candidates.find((b) => b.batch_uuid === targetUuid);
  const canConfirm = !!target && !isLoading;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setServerError("");
    const res = await onConfirm(targetUuid);
    if (res?.error) setServerError(res.error);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg overflow-hidden bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, borderRadius: 10, background: BRAND_RED_TINT, color: BRAND_RED }}
            >
              <GitMerge size={16} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Merge batch</h3>
              <p className="text-[11.5px] mt-0.5" style={{ color: TEXT_MUTED }}>
                Pick which batch &ldquo;{source.name}&rdquo; should be merged into
              </p>
            </div>
          </div>
          <button
            type="button" onClick={onCancel} aria-label="Close"
            className="flex items-center justify-center transition rounded-md"
            style={{ width: 30, height: 30, color: TEXT_MUTED, background: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_MUTED; }}
          >
            <X size={15} strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {serverError && (
            <div
              className="p-2.5 mb-4 text-[12px] rounded-lg"
              style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA", fontWeight: 500 }}
            >
              {serverError}
            </div>
          )}

          {/* Source → Target visual */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="flex-1 p-3 rounded-lg"
              style={{ background: "#F1F5F9", border: `1px solid ${BORDER}` }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
                From (will be merged)
              </div>
              <div className="mt-1 text-[14px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                {source.name}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11.5px]" style={{ color: TEXT_SECONDARY }}>
                <Users size={11} strokeWidth={2.2} />
                {source.students_count ?? 0} student{(source.students_count ?? 0) === 1 ? "" : "s"}
              </div>
            </div>
            <ArrowRight size={18} strokeWidth={2.25} style={{ color: BRAND_RED, flexShrink: 0 }} />
            <div
              className="flex-1 p-3 rounded-lg"
              style={{
                background: target ? BRAND_RED_TINT : "#FAFBFC",
                border: `1px solid ${target ? "#FECACA" : BORDER}`,
              }}
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED, letterSpacing: "0.08em" }}>
                Into (target)
              </div>
              <div className="mt-1 text-[14px] font-semibold" style={{ color: target ? BRAND_RED : TEXT_MUTED }}>
                {target ? target.name : "Pick a target below"}
              </div>
              {target && (
                <div className="flex items-center gap-1.5 mt-1 text-[11.5px]" style={{ color: BRAND_RED }}>
                  <Users size={11} strokeWidth={2.2} />
                  {target.students_count ?? 0} student{(target.students_count ?? 0) === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="block mb-2" style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
              Target batch (same course only)
            </label>
            {candidates.length === 0 ? (
              <div
                className="flex items-center gap-2 px-3 py-3 text-[12.5px] rounded-lg"
                style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: "1px solid #FECACA" }}
              >
                <AlertTriangle size={14} strokeWidth={2.25} />
                No eligible target. There are no other unmerged batches in <strong>{source.course_name}</strong>.
              </div>
            ) : (
              <SearchableSelect
                options={options}
                value={targetUuid}
                onChange={(v) => setTargetUuid(v || "")}
                placeholder="Search for a batch…"
              />
            )}
          </div>

          {target && (
            <div
              className="px-3 py-2.5 text-[12px] rounded-lg"
              style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}
            >
              <strong>What this will do:</strong> all students from &ldquo;{source.name}&rdquo; will be moved to &ldquo;{target.name}&rdquo;.
              The source batch stays in the list but is marked as <em>Merged</em>. You can un-merge later — students get moved back.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFBFC" }}
        >
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleConfirm} disabled={!canConfirm}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 6px 18px -10px rgba(201,6,6,0.45)",
            }}
          >
            {isLoading ? (<><Loader2 size={14} className="animate-spin" />Merging…</>) : (<><GitMerge size={14} />Merge</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeBatchModal;
