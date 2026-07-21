import { useState } from "react";
import {
  MessageSquareWarning, Loader2, X, UserCheck, CheckCircle2, Send, ShieldAlert,
  Paperclip, RotateCcw, Star, FileText, Download, Clock, AlertTriangle,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../../api/apiSlice";
import { showToast } from "../../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";

const STATUS_BADGE = {
  open: { bg: "#FFFBEB", fg: "#B45309", label: "Open" },
  in_progress: { bg: "#EFF6FF", fg: "#1D4ED8", label: "In progress" },
  resolved: { bg: "#F0FDF4", fg: "#15803D", label: "Resolved" },
  closed: { bg: "#F8FAFC", fg: TEXT_MUTED, label: "Closed" },
  rejected: { bg: "#FEF2F2", fg: BRAND, label: "Rejected" },
};
const PRIORITY_BADGE = {
  low: { bg: "#F8FAFC", fg: "#64748B", label: "Low" },
  medium: { bg: "#EFF6FF", fg: "#1D4ED8", label: "Medium" },
  high: { bg: "#FFF7ED", fg: "#C2410C", label: "High" },
  urgent: { bg: "#FEF2F2", fg: BRAND, label: "Urgent" },
};
const FILTERS = ["all", "open", "in_progress", "resolved", "closed", "rejected"];

const labelize = (v) => (v || "").replace(/_/g, " ");
const ageLabel = (h) => {
  if (h == null) return "";
  if (h < 1) return "<1h";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

function AttachmentList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {items.map((a) => (
        <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY, background: "#fff" }} title={a.original_filename}>
          {a.is_image ? <img src={a.url} alt="" className="w-6 h-6 rounded object-cover" /> : <FileText size={13} />}
          <span className="max-w-[120px] truncate">{a.original_filename}</span>
          <Download size={12} />
        </a>
      ))}
    </div>
  );
}

function StaffFilePicker({ files, setFiles }) {
  return (
    <div>
      <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer" style={{ border: `1px dashed ${BORDER}`, color: TEXT_SECONDARY }}>
        <Paperclip size={13} /> Attach
        <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => setFiles([...(files || []), ...Array.from(e.target.files || [])].slice(0, 5))} />
      </label>
      {files?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px]" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
              <FileText size={11} /> <span className="max-w-[100px] truncate">{f.name}</span>
              <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffStars({ value }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} fill={value >= n ? "#D97706" : "none"} color={value >= n ? "#D97706" : "#CBD5E1"} />)}
    </span>
  );
}

/**
 * Admin complaints inbox. channel="student" (default) shows student
 * complaints; channel="employee" shows staff grievances (same endpoints,
 * separated server-side by the channel column).
 */
export default function StudentComplaintsPage({ channel = "student", title = "Student Complaints" }) {
  const [filter, setFilter] = useState("open");
  const [selected, setSelected] = useState(null);

  const { data, isLoading, refetch } = useGetQuery(
    { path: "/student/complaints", params: { per_page: 200, sort: "-created_at", channel } },
    { refetchOnMountOrArgChange: true },
  );

  const rows = data?.data || [];
  const counts = data?.meta?.status_counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || rows.length;
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareWarning size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          const count = f === "all" ? total : (counts[f] || 0);
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize"
              style={isActive ? { background: BRAND, color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}
            >
              {labelize(f)} <span style={{ opacity: 0.8 }}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: TEXT_MUTED }}>
            No {filter === "all" ? "" : labelize(filter)} complaints.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: "#F8FAFC", color: TEXT_SECONDARY }}>
                  {["Subject", "From", "Category", "Priority", "Assigned to", "Age", "Status", ""].map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-left font-semibold text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const b = STATUS_BADGE[r.status] || STATUS_BADGE.open;
                  const p = r.priority ? (PRIORITY_BADGE[r.priority] || null) : null;
                  return (
                    <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }} className="hover:bg-[#FCFCFD] cursor-pointer" onClick={() => setSelected(r)}>
                      <td className="px-3 py-2.5 font-semibold max-w-[260px] truncate" style={{ color: TEXT_PRIMARY }} title={r.subject}>{r.subject}</td>
                      <td className="px-3 py-2.5" style={{ color: r.is_anonymous ? TEXT_MUTED : TEXT_SECONDARY }}>
                        {r.is_anonymous ? <span className="inline-flex items-center gap-1"><ShieldAlert size={12} /> Anonymous</span> : (r.student_display || "—")}
                      </td>
                      <td className="px-3 py-2.5 capitalize" style={{ color: TEXT_SECONDARY }}>{labelize(r.category)}</td>
                      <td className="px-3 py-2.5">
                        {p ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: p.bg, color: p.fg }}>{p.label}</span> : <span style={{ color: TEXT_MUTED }}>—</span>}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: TEXT_SECONDARY }}>{r.assigned_to?.name || <span style={{ color: TEXT_MUTED }}>Unassigned</span>}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {r.is_overdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: BRAND }}><AlertTriangle size={12} /> {ageLabel(r.age_hours)}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: TEXT_MUTED }}><Clock size={12} /> {ageLabel(r.age_hours)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: b.bg, color: b.fg }}>{b.label}</span>
                        {r.satisfaction_rating ? <span className="ml-1 inline-flex items-center gap-0.5 text-[11px]" style={{ color: "#D97706" }}><Star size={11} fill="#D97706" /> {r.satisfaction_rating}</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <button onClick={(e) => { e.stopPropagation(); setSelected(r); }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>Manage</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ManageComplaintModal
          id={selected.id}
          onClose={() => setSelected(null)}
          onChanged={() => refetch()}
        />
      )}
    </div>
  );
}

function ManageComplaintModal({ id, onClose, onChanged }) {
  const { data, isLoading, refetch } = useGetQuery(
    { path: `/student/complaints/${id}` },
    { refetchOnMountOrArgChange: true },
  );
  const { data: staffData } = useGetQuery({ path: "/user/staff" });

  const [post] = usePostMutation();
  const [patch] = usePatchMutation();
  const [del] = useDeleteMutation();

  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const c = data?.data;
  const staff = staffData?.data || [];
  const isClosedState = c && ["resolved", "closed", "rejected"].includes(c.status);

  const refresh = () => { refetch(); onChanged(); };

  const doAssign = async () => {
    if (!assignee) { showToast("Pick a staff member.", "error"); return; }
    setBusy(true);
    try {
      await post({ path: `/student/complaints/${id}/assign`, body: { assignee_uuid: assignee } }).unwrap();
      showToast("Complaint assigned.", "success");
      refresh();
    } catch (e) { showToast(e?.data?.message || "Could not assign.", "error"); }
    finally { setBusy(false); }
  };

  const doUnassign = async () => {
    setBusy(true);
    try {
      await del({ path: `/student/complaints/${id}/assign` }).unwrap();
      showToast("Assignment cleared.", "success");
      refresh();
    } catch (e) { showToast(e?.data?.message || "Failed.", "error"); }
    finally { setBusy(false); }
  };

  const setPriority = async (priority) => {
    setBusy(true);
    try {
      await patch({ path: `/student/complaints/${id}/priority`, body: { priority } }).unwrap();
      refresh();
    } catch (e) { showToast(e?.data?.message || "Failed.", "error"); }
    finally { setBusy(false); }
  };

  const setStatus = async (status) => {
    setBusy(true);
    try {
      await patch({ path: `/student/complaints/${id}/status`, body: { status } }).unwrap();
      showToast("Status updated.", "success");
      refresh();
    } catch (e) { showToast(e?.data?.message || "Failed.", "error"); }
    finally { setBusy(false); }
  };

  const doResolve = async () => {
    if (!reply.trim()) { showToast("Add a resolution note in the reply box first.", "error"); return; }
    setBusy(true);
    try {
      await post({ path: `/student/complaints/${id}/resolve`, body: { note: reply } }).unwrap();
      showToast("Complaint resolved.", "success");
      setReply("");
      refresh();
    } catch (e) { showToast(e?.data?.message || "Failed.", "error"); }
    finally { setBusy(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() && files.length === 0) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("body", reply || " ");
      fd.append("is_internal", internal ? "1" : "0");
      files.forEach((f) => fd.append("attachments[]", f));
      await post({ path: `/student/complaints/${id}/reply`, body: fd }).unwrap();
      setReply("");
      setInternal(false);
      setFiles([]);
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not post reply.", "error"); }
    finally { setBusy(false); }
  };

  const reopen = async () => {
    setBusy(true);
    try {
      await post({ path: `/student/complaints/${id}/reopen`, body: {} }).unwrap();
      showToast("Complaint reopened.", "success");
      refresh();
    } catch (e) { showToast(e?.data?.message || "Could not reopen.", "error"); }
    finally { setBusy(false); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
            <MessageSquareWarning size={17} style={{ color: BRAND }} /> Manage complaint
          </span>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>

        {isLoading || !c ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{c.subject}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: (STATUS_BADGE[c.status] || STATUS_BADGE.open).bg, color: (STATUS_BADGE[c.status] || STATUS_BADGE.open).fg }}>{(STATUS_BADGE[c.status] || STATUS_BADGE.open).label}</span>
              </div>
              <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {labelize(c.category)} · {c.is_anonymous ? "Anonymous" : (c.student_display || "—")} · {c.created_at}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px]">
                {c.is_overdue
                  ? <span className="inline-flex items-center gap-1 font-bold" style={{ color: BRAND }}><AlertTriangle size={12} /> Overdue ({ageLabel(c.age_hours)} / SLA {ageLabel(c.sla_hours)})</span>
                  : <span className="inline-flex items-center gap-1" style={{ color: TEXT_MUTED }}><Clock size={12} /> {ageLabel(c.age_hours)} old · SLA {ageLabel(c.sla_hours)}</span>}
                {c.first_response_at && <span style={{ color: TEXT_MUTED }}>· 1st response {c.first_response_at}</span>}
                {c.reopen_count > 0 && <span style={{ color: TEXT_MUTED }}>· reopened {c.reopen_count}×</span>}
              </div>
              <p className="mt-2 text-[13px] whitespace-pre-wrap" style={{ color: TEXT_SECONDARY }}>{c.description}</p>
              <AttachmentList items={c.attachments} />
            </div>

            {c.satisfaction_rating ? (
              <div className="rounded-lg px-3 py-2" style={{ background: "#FFFBEB", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: TEXT_SECONDARY }}>Student rating <StaffStars value={c.satisfaction_rating} /></div>
                {c.satisfaction_comment && <div className="text-[12px] mt-1" style={{ color: TEXT_SECONDARY }}>{c.satisfaction_comment}</div>}
              </div>
            ) : null}

            {/* Triage controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Priority</label>
                <select value={c.priority || ""} disabled={busy} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                  <option value="" disabled>Set priority</option>
                  {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{labelize(p)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Status</label>
                <select value={c.status} disabled={busy} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none capitalize" style={cell}>
                  {["open", "in_progress", "resolved", "closed", "rejected"].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Assign to</label>
                <div className="flex gap-1.5">
                  <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                    <option value="">{c.assigned_to?.name ? `Current: ${c.assigned_to.name}` : "Choose…"}</option>
                    {staff.map((s) => <option key={s.uuid} value={s.uuid}>{s.name}</option>)}
                  </select>
                  <button onClick={doAssign} disabled={busy} className="px-2.5 rounded-lg text-white" style={{ background: BRAND }} title="Assign"><UserCheck size={15} /></button>
                </div>
                {c.assigned_to && <button onClick={doUnassign} className="mt-1 text-[11px] font-semibold" style={{ color: BRAND }}>Clear assignment</button>}
              </div>
            </div>

            {/* Thread */}
            <div>
              <div className="text-[12px] font-semibold mb-2" style={{ color: TEXT_SECONDARY }}>Conversation</div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(c.replies || []).length === 0 && <div className="text-[12px]" style={{ color: TEXT_MUTED }}>No replies yet.</div>}
                {(c.replies || []).map((m) => (
                  <div key={m.id} className="rounded-lg px-3 py-2 text-[12px]" style={{
                    background: m.is_internal ? "#FFFBEB" : (m.is_staff ? "#EFF6FF" : "#F8FAFC"),
                    border: `1px solid ${BORDER}`,
                  }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>
                        {m.author?.name || (m.is_staff ? "Staff" : "Student")}
                        {m.is_staff && <span className="ml-1 text-[10px] font-bold" style={{ color: "#1D4ED8" }}>STAFF</span>}
                        {m.is_internal && <span className="ml-1 text-[10px] font-bold" style={{ color: "#B45309" }}>INTERNAL</span>}
                      </span>
                      <span style={{ color: TEXT_MUTED }}>{m.created_at}</span>
                    </div>
                    <div className="whitespace-pre-wrap" style={{ color: TEXT_SECONDARY }}>{m.body}</div>
                    <AttachmentList items={m.attachments} />
                  </div>
                ))}
              </div>
            </div>

            {/* Reply / resolve box */}
            <div className="rounded-lg p-3" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Write a reply, internal note, or resolution note…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer" style={{ color: TEXT_SECONDARY }}>
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (hidden from student)
                </label>
                <StaffFilePicker files={files} setFiles={setFiles} />
                <div className="flex gap-2">
                  <button onClick={doResolve} disabled={busy} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#15803D", opacity: busy ? 0.6 : 1 }}><CheckCircle2 size={14} /> Resolve</button>
                  <button onClick={sendReply} disabled={busy} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND, opacity: busy ? 0.6 : 1 }}><Send size={14} /> Reply</button>
                </div>
              </div>
            </div>

            {isClosedState && (
              <button onClick={reopen} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
                <RotateCcw size={14} /> Reopen complaint
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
