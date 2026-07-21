import { useState } from "react";
import { Loader2, Plus, X, MessageSquareWarning, Send, ShieldCheck, Paperclip, Star, RotateCcw, FileText, Download } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

const CATEGORIES = [
  { value: "instructor", label: "Instructor" },
  { value: "course_content", label: "Course content / topic" },
  { value: "environment", label: "Environment" },
  { value: "management", label: "Management" },
  { value: "facilities", label: "Facilities" },
  { value: "finance", label: "Fees / finance" },
  { value: "technical", label: "Technical / portal" },
  { value: "other", label: "Other" },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const STATUS = {
  open: { bg: "#FFFBEB", fg: "#B45309", label: "Open" },
  in_progress: { bg: "#EFF6FF", fg: "#1D4ED8", label: "In progress" },
  resolved: { bg: "#F0FDF4", fg: "#15803D", label: "Resolved" },
  closed: { bg: "#F8FAFC", fg: "#94A3B8", label: "Closed" },
  rejected: { bg: "#FEF2F2", fg: BRAND, label: "Rejected" },
};

const buildFormData = (fields, files) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, typeof v === "boolean" ? (v ? "1" : "0") : v);
  });
  (files || []).forEach((f) => fd.append("attachments[]", f));
  return fd;
};

function AttachmentList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {items.map((a) => (
        <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569", background: "#fff" }} title={a.original_filename}>
          {a.is_image ? <img src={a.url} alt="" className="w-6 h-6 rounded object-cover" /> : <FileText size={13} />}
          <span className="max-w-[120px] truncate">{a.original_filename}</span>
          <Download size={12} />
        </a>
      ))}
    </div>
  );
}

/**
 * Complaint thread UI. Defaults to the STUDENT portal; the staff portal
 * reuses it with its own basePath + employee grievance categories
 * (see teacher/TeacherComplaints.jsx).
 */
export default function PortalComplaints({
  basePath = "/student-portal/complaints",
  categories = CATEGORIES,
  intro = "Raise an issue about an instructor, a topic, the environment, management and more. You can attach screenshots and submit anonymously.",
}) {
  const { data, isLoading, refetch } = useGetQuery({ path: basePath }, { refetchOnMountOrArgChange: true });
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const complaints = data?.data || [];
  const catLabel = (v) => categories.find((c) => c.value === v)?.label || CATEGORY_LABEL[v] || v;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px]" style={{ color: "#94A3B8" }}>{intro}</p>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}><Plus size={14} /> New complaint</button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>You have not submitted any complaints yet.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Subject", "Category", "Submitted", "Status", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {complaints.map((r) => {
                const st = STATUS[r.status] || STATUS.open;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }} className="hover:bg-[#FCFCFD] cursor-pointer" onClick={() => setDetail(r.id)}>
                    <td className="px-4 py-2.5 font-semibold max-w-[240px] truncate" style={{ color: "#0F172A" }} title={r.subject}>
                      {r.subject}
                      {r.satisfaction_rating ? <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px]" style={{ color: "#D97706" }}><Star size={11} fill="#D97706" /> {r.satisfaction_rating}</span> : null}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{catLabel(r.category)}</td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{(r.created_at || "").slice(0, 10)}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                    <td className="px-4 py-2.5 text-right"><button onClick={(e) => { e.stopPropagation(); setDetail(r.id); }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && <NewComplaintModal basePath={basePath} categories={categories} onClose={() => setOpen(false)} onDone={() => { setOpen(false); refetch(); }} />}
      {detail && <ComplaintDetailModal basePath={basePath} categories={categories} id={detail} onClose={() => setDetail(null)} onChanged={() => refetch()} />}
    </div>
  );
}

function FilePicker({ files, setFiles }) {
  return (
    <div>
      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold cursor-pointer" style={{ border: `1px dashed ${BORDER}`, color: "#475569" }}>
        <Paperclip size={14} /> Attach files
        <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => setFiles([...(files || []), ...Array.from(e.target.files || [])].slice(0, 5))} />
      </label>
      {files?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#475569" }}>
              <FileText size={12} /> <span className="max-w-[120px] truncate">{f.name}</span>
              <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function NewComplaintModal({ basePath, categories = CATEGORIES, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [f, setF] = useState({ category: categories[0]?.value || "other", subject: "", description: "", is_anonymous: false });
  const [files, setFiles] = useState([]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.subject.trim() || !f.description.trim()) { showToast("Add a subject and description.", "error"); return; }
    try {
      const body = buildFormData({ category: f.category, subject: f.subject, description: f.description, is_anonymous: f.is_anonymous }, files);
      await post({ path: basePath, body }).unwrap();
      showToast("Your complaint has been submitted.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || e?.data?.errors?.subject?.[0] || "Could not submit.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><MessageSquareWarning size={17} /> New complaint</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>What is this about?</label>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Subject</label>
            <input value={f.subject} onChange={(e) => set("subject", e.target.value)} maxLength={255} placeholder="Brief summary" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Details</label>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={4} maxLength={5000} placeholder="Describe what happened…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
          </div>
          <FilePicker files={files} setFiles={setFiles} />
          <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer rounded-lg px-3 py-2" style={{ color: "#475569", background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
            <input type="checkbox" checked={f.is_anonymous} onChange={(e) => set("is_anonymous", e.target.checked)} />
            <ShieldCheck size={14} /> Submit anonymously (staff will not see your name)
          </label>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2 sticky bottom-0 bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, readOnly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} disabled={readOnly} onMouseEnter={() => !readOnly && setHover(n)} onMouseLeave={() => !readOnly && setHover(0)} onClick={() => !readOnly && onChange(n)} style={{ cursor: readOnly ? "default" : "pointer" }}>
          <Star size={readOnly ? 14 : 22} fill={(hover || value) >= n ? "#D97706" : "none"} color={(hover || value) >= n ? "#D97706" : "#CBD5E1"} />
        </button>
      ))}
    </div>
  );
}

function ComplaintDetailModal({ basePath, categories = CATEGORIES, id, onClose, onChanged }) {
  const catLabel = (v) => categories.find((c) => c.value === v)?.label || CATEGORY_LABEL[v] || v;
  const { data, isLoading, refetch } = useGetQuery({ path: `${basePath}/${id}` }, { refetchOnMountOrArgChange: true });
  const [post, { isLoading: posting }] = usePostMutation();
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState([]);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const c = data?.data;
  const st = c ? (STATUS[c.status] || STATUS.open) : STATUS.open;
  const isClosedState = c && ["resolved", "closed", "rejected"].includes(c.status);
  const canRate = c && ["resolved", "closed"].includes(c.status) && !c.satisfaction_rating;

  const refresh = () => { refetch(); onChanged(); };

  const sendReply = async () => {
    if (!reply.trim() && files.length === 0) return;
    try {
      const body = buildFormData({ body: reply || " " }, files);
      await post({ path: `${basePath}/${id}/reply`, body }).unwrap();
      setReply(""); setFiles([]); refresh();
    } catch (e) { showToast(e?.data?.message || "Could not post reply.", "error"); }
  };

  const submitRating = async () => {
    if (!rating) { showToast("Pick a star rating.", "error"); return; }
    try {
      await post({ path: `${basePath}/${id}/rate`, body: { rating, comment: ratingComment || undefined } }).unwrap();
      showToast("Thanks for your feedback.", "success"); refresh();
    } catch (e) { showToast(e?.data?.message || "Could not submit rating.", "error"); }
  };

  const reopen = async () => {
    try {
      await post({ path: `${basePath}/${id}/reopen`, body: {} }).unwrap();
      showToast("Complaint reopened.", "success"); refresh();
    } catch (e) { showToast(e?.data?.message || "Could not reopen.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><MessageSquareWarning size={17} /> Complaint</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        {isLoading || !c ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[15px] font-bold" style={{ color: "#0F172A" }}>{c.subject}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                {c.reopen_count > 0 && <span className="text-[11px]" style={{ color: "#94A3B8" }}>reopened {c.reopen_count}×</span>}
              </div>
              <div className="text-[12px]" style={{ color: "#94A3B8" }}>{catLabel(c.category)} · {c.created_at}{c.is_anonymous ? " · Anonymous" : ""}</div>
              <p className="mt-2 text-[13px] whitespace-pre-wrap" style={{ color: "#475569" }}>{c.description}</p>
              <AttachmentList items={c.attachments} />
            </div>

            {c.resolution_note && (
              <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: "#F0FDF4", border: `1px solid ${BORDER}`, color: "#15803D" }}>
                <b>Resolution:</b> {c.resolution_note}
              </div>
            )}

            <div>
              <div className="text-[12px] font-semibold mb-2" style={{ color: "#475569" }}>Conversation</div>
              <div className="space-y-2">
                {(c.replies || []).length === 0 && <div className="text-[12px]" style={{ color: "#94A3B8" }}>No replies yet. Staff will respond here.</div>}
                {(c.replies || []).map((m) => (
                  <div key={m.id} className="rounded-lg px-3 py-2 text-[12px]" style={{ background: m.is_staff ? "#EFF6FF" : "#F8FAFC", border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold" style={{ color: "#0F172A" }}>{m.is_staff ? (m.author?.name || "Staff") : "You"}</span>
                      <span style={{ color: "#94A3B8" }}>{m.created_at}</span>
                    </div>
                    <div className="whitespace-pre-wrap" style={{ color: "#475569" }}>{m.body}</div>
                    <AttachmentList items={m.attachments} />
                  </div>
                ))}
              </div>
            </div>

            {!isClosedState && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a reply…" className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" }} onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }} />
                  <button onClick={sendReply} disabled={posting} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND, opacity: posting ? 0.6 : 1 }}><Send size={14} /> Send</button>
                </div>
                <FilePicker files={files} setFiles={setFiles} />
              </div>
            )}

            {/* Satisfaction */}
            {c.satisfaction_rating ? (
              <div className="rounded-lg px-3 py-2.5" style={{ background: "#FFFBEB", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: "#475569" }}>Your rating <StarRating value={c.satisfaction_rating} readOnly /></div>
                {c.satisfaction_comment && <div className="text-[12px] mt-1" style={{ color: "#475569" }}>{c.satisfaction_comment}</div>}
              </div>
            ) : canRate ? (
              <div className="rounded-lg px-3 py-3 space-y-2" style={{ background: "#FFFBEB", border: `1px solid ${BORDER}` }}>
                <div className="text-[12px] font-semibold" style={{ color: "#475569" }}>How satisfied are you with the resolution?</div>
                <StarRating value={rating} onChange={setRating} />
                <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} rows={2} placeholder="Optional feedback…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: "#0F172A" }} />
                <button onClick={submitRating} disabled={posting} className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#D97706" }}>Submit rating</button>
              </div>
            ) : null}

            {/* Reopen */}
            {isClosedState && (
              <button onClick={reopen} disabled={posting} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
                <RotateCcw size={14} /> Reopen complaint
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
