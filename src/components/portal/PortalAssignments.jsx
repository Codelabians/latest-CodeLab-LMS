import { useState } from "react";
import { Loader2, FileText, ExternalLink, CheckCircle2, Clock, Link2, X, Paperclip } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

export default function PortalAssignments() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/student-portal/assignments" }, { refetchOnMountOrArgChange: true });
  const items = data?.data || [];
  const [submitFor, setSubmitFor] = useState(null);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <FileText size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
          <p className="text-[13px]" style={{ color: "#94A3B8" }}>No assignments yet.</p>
        </div>
      ) : (
        items.map((a, i) => {
          const pct = a.graded && a.max_marks ? Math.round((a.marks / a.max_marks) * 100) : null;
          return (
            <div key={a.uuid || i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[14px]" style={{ color: "#0F172A" }}>{a.title}</h3>
                    {a.batch && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "#F8FAFC", color: "#475569" }}>{a.batch}</span>}
                  </div>
                  {a.description && <p className="text-[12px] mt-1" style={{ color: "#475569" }}>{a.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "#94A3B8" }}>
                    {a.deadline && <span className="inline-flex items-center gap-1"><Clock size={12} /> Due {String(a.deadline).slice(0, 10)}</span>}
                    {(a.links?.length ? a.links : a.url ? [a.url] : []).map((l, li) => (
                      <a key={li} href={l} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold" style={{ color: BRAND }}><ExternalLink size={12} /> Resource{(a.links?.length || 0) > 1 ? ` ${li + 1}` : ""}</a>
                    ))}
                    {a.document_url && (
                      <a href={a.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold" style={{ color: BRAND }}><Paperclip size={12} /> PDF</a>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {a.graded ? (
                    <>
                      <div className="text-[18px] font-bold" style={{ color: pct >= 50 ? "#15803D" : BRAND }}>{a.marks}<span className="text-[12px]" style={{ color: "#94A3B8" }}>/{a.max_marks}</span></div>
                      <div className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#15803D" }}><CheckCircle2 size={11} /> Graded</div>
                    </>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#FFFBEB", color: "#B45309" }}>Not graded</span>
                  )}
                </div>
              </div>
              {a.graded && a.feedback && (
                <div className="mt-3 rounded-lg p-2.5 text-[12px]" style={{ background: "#F8FAFC", color: "#475569" }}>
                  <span className="font-semibold">Feedback: </span>{a.feedback}
                </div>
              )}
              {/* Submission (link only) */}
              <div className="mt-3 pt-3 flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                {a.submission_link ? (
                  <a href={a.submission_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold truncate" style={{ color: "#15803D" }}>
                    <CheckCircle2 size={13} /> Submitted{a.submitted_at ? ` · ${String(a.submitted_at).slice(0, 10)}` : ""}
                  </a>
                ) : (
                  <span className="text-[12px]" style={{ color: "#94A3B8" }}>Not submitted</span>
                )}
                <button onClick={() => setSubmitFor(a)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
                  <Link2 size={12} /> {a.submission_link ? "Update link" : "Submit link"}
                </button>
              </div>
            </div>
          );
        })
      )}

      {submitFor && <SubmitModal assignment={submitFor} onClose={() => setSubmitFor(null)} onDone={() => { setSubmitFor(null); refetch(); }} />}
    </div>
  );
}

function SubmitModal({ assignment, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [link, setLink] = useState(assignment.submission_link || "");

  const submit = async () => {
    if (!link.trim()) { showToast("Paste your work link.", "error"); return; }
    try {
      await post({ path: `student-portal/assignments/${assignment.uuid}/submit`, body: { link: link.trim() } }).unwrap();
      showToast("Submission saved.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not submit.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Link2 size={17} /> Submit your work</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="text-[12px]" style={{ color: "#475569" }}>{assignment.title}</div>
          <label className="block text-[11px] font-semibold" style={{ color: "#475569" }}>Work link (Drive, GitHub, etc.)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" }} />
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}
