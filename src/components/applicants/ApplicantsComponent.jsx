import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Search, X, UserCheck, AlertTriangle, Loader2, Check, Ban,
  GraduationCap, Megaphone, Mail, Phone, Instagram, User, Pencil, Download,
} from "lucide-react";
import { useGetQuery, usePatchMutation, useLazyGetQuery } from "../../api/apiSlice";
import ReportModal from "../ui/ReportModal";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";

// Normalise an Instagram handle/link into a full URL.
function igUrl(v) {
  if (!v) return "#";
  const t = String(v).trim();
  if (/^https?:\/\//i.test(t)) return t;
  return "https://instagram.com/" + t.replace(/^@/, "");
}

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const ProgramPill = ({ program }) => {
  const cfg = program === "alumni"
    ? { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "Alumni", Icon: GraduationCap }
    : { fg: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Brand Ambassador", Icon: Megaphone };
  const { Icon } = cfg;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
      style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
};
const STATUS_CFG = {
  pending:  { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Pending" },
  approved: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "Approved" },
  rejected: { fg: BRAND_RED, bg: BRAND_RED_TINT, border: "#FECACA", label: "Rejected" },
};
const StatusPill = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return <span className="inline-flex items-center px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
    style={{ color: c.fg, background: c.bg, border: `1px solid ${c.border}` }}>{c.label}</span>;
};

export default function ApplicantsComponent() {
  const user = useSelector(selectCurrentUser);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [photoView, setPhotoView] = useState(null);
  const [edit, setEdit] = useState(null); // applicant being edited
  const [savingEdit, setSavingEdit] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => { const t = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [debounced, program, status, from, to]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (debounced) p.search = debounced;
    if (program) p.program = program;
    if (status) p.status = status;
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  }, [page, perPage, debounced, program, status, from, to]);

  const { data, error, isLoading, refetch } = useGetQuery(
    { path: "/program-applications", params }, { refetchOnMountOrArgChange: true }
  );
  const [patch, { isLoading: updating }] = usePatchMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || { total: rows.length };
  const total = pagination.total ?? rows.length;

  const setAppStatus = async (uuid, newStatus) => {
    try {
      await patch({ path: `/program-applications/${uuid}/status`, body: { status: newStatus } }).unwrap();
      showToast(`Application ${newStatus}`, "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Failed to update.", "error"); }
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSavingEdit(true);
    const body = {
      full_name: edit.full_name, email: edit.email, phone: edit.phone,
      city: edit.city || null, message: edit.message || null,
    };
    if (edit.referral_code !== undefined) body.referral_code = (edit.referral_code || "").trim();
    if (edit.program === "alumni") {
      body.course = edit.course || null;
      body.batch_year = edit.batch_year || null;
      body.current_role = edit.current_role || null;
    } else {
      body.audience_size = edit.audience_size ? Number(edit.audience_size) : null;
      body.social_handles = { instagram: edit.instagram || "" };
    }
    try {
      await patch({ path: `/program-applications/${edit.uuid}`, body }).unwrap();
      showToast("Applicant updated.", "success");
      setEdit(null); refetch();
    } catch (e) { showToast(e?.data?.message || "Could not update.", "error"); }
    setSavingEdit(false);
  };

  const th = { fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY };
  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
          <UserCheck size={18} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Applicants</h1>
          <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Alumni &amp; Brand Ambassador applications from the website</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone…"
            className="w-full py-2 pl-9 pr-9 text-sm rounded-lg outline-none" style={inputStyle} />
          {search && <button onClick={() => setSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }}><X size={14} /></button>}
        </div>
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[{ v: "", l: "All" }, { v: "alumni", l: "Alumni" }, { v: "brand_ambassador", l: "Ambassadors" }].map((o) => (
            <button key={o.v} onClick={() => setProgram(o.v)} className="px-3 py-1 text-xs font-semibold rounded-md"
              style={{ color: program === o.v ? "#fff" : TEXT_SECONDARY, background: program === o.v ? BRAND_RED : "transparent" }}>{o.l}</button>
          ))}
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="py-2 pl-3 pr-8 text-sm rounded-lg outline-none cursor-pointer" style={inputStyle}>
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="py-1.5 px-2 text-sm rounded-lg outline-none" style={inputStyle} />
          <span className="text-[12px]" style={{ color: TEXT_MUTED }}>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="py-1.5 px-2 text-sm rounded-lg outline-none" style={inputStyle} />
        </div>
        <button type="button" onClick={() => {
          const d = new Date(); const first = new Date(d.getFullYear(), d.getMonth(), 1);
          const fmt = (x) => x.toISOString().slice(0, 10);
          setFrom(fmt(first)); setTo(fmt(d));
        }} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>This month</button>
        {(from || to) && (
          <button type="button" onClick={() => { setFrom(""); setTo(""); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: BRAND_RED }}>Clear dates</button>
        )}
        <button onClick={() => setReportOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "#0F172A" }} title="Download report">
          <Download size={14} /> Report
        </button>
        <div className="text-[12px]" style={{ color: TEXT_MUTED }}>{total} total</div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 980 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                <th className="px-4 py-3 text-left" style={{ width: 44 }}><span style={th}>#</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Applicant</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Program</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Details</span></th>
                <th className="px-4 py-3 text-left"><span style={th}>Status</span></th>
                <th className="px-4 py-3 text-right" style={{ width: 170 }}><span style={th}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2].map((i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[24, 200, 120, 160, 80, 120].map((w, j) => (<td key={j} className="px-4 py-4"><div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} /></td>))}
                </tr>
              ))}
              {!isLoading && error && (
                <tr><td colSpan={6} className="px-5 py-10 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}><AlertTriangle size={14} /> Couldn't load applicants.</span>
                </td></tr>
              )}
              {!isLoading && !error && rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center mx-auto mb-3 w-14 h-14 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}><UserCheck size={22} /></div>
                  <div className="text-[14px] font-semibold" style={{ color: TEXT_PRIMARY }}>No applications yet</div>
                  <div className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Alumni and brand-ambassador applications from the website appear here.</div>
                </td></tr>
              )}
              {!isLoading && rows.map((a, idx) => (
                <tr key={a.uuid} style={{ borderTop: `1px solid ${BORDER}` }} className="hover:bg-[#FCFCFD]">
                  <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{(pagination.from || 1) + idx}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {a.photo_url ? (
                        <img src={a.photo_url} alt={a.full_name} onClick={() => setPhotoView(a.photo_url)}
                          className="object-cover rounded-lg cursor-pointer" style={{ width: 42, height: 42, border: `1px solid ${BORDER}` }} title="Click to enlarge" />
                      ) : (
                        <span className="grid rounded-lg place-items-center" style={{ width: 42, height: 42, background: "#F8FAFC", color: TEXT_MUTED, border: `1px solid ${BORDER}` }}><User size={17} /></span>
                      )}
                      <div>
                        <div className="text-[13.5px] font-semibold" style={{ color: TEXT_PRIMARY }}>{a.full_name}</div>
                        <div className="flex items-center gap-3 text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
                          <span className="inline-flex items-center gap-1"><Mail size={11} />{a.email}</span>
                          <span className="inline-flex items-center gap-1"><Phone size={11} />{a.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><ProgramPill program={a.program} /></td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ color: TEXT_SECONDARY }}>
                    {a.program === "alumni"
                      ? <span>{a.course || "—"}{a.batch_year ? ` · ${a.batch_year}` : ""}{a.current_role ? ` · ${a.current_role}` : ""}</span>
: (
                        <span className="inline-flex items-center gap-2 flex-wrap">
                          {a.audience_size ? <span>{Number(a.audience_size).toLocaleString()} followers</span> : null}
                          {a.social_handles && a.social_handles.instagram ? (
                            <a href={igUrl(a.social_handles.instagram)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold" style={{ color: BRAND_RED }}>
                              <Instagram size={13} /> {a.social_handles.instagram}
                            </a>
                          ) : (!a.audience_size ? <span>—</span> : null)}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={a.status} />
                    {a.status === "approved" && a.referral_code && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold" style={{ background: BRAND_RED_TINT, color: BRAND_RED }} title="Referral / promo code">
                        {a.referral_code}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEdit({
                        uuid: a.uuid, program: a.program,
                        full_name: a.full_name || "", email: a.email || "", phone: a.phone || "",
                        city: a.city || "", message: a.message || "",
                        course: a.course || "", batch_year: a.batch_year || "", current_role: a.current_role || "",
                        audience_size: a.audience_size || "", instagram: (a.social_handles && a.social_handles.instagram) || "",
                        referral_code: a.referral_code || "", status: a.status,
                      })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg"
                        style={{ background: "#EEF2F6", color: TEXT_PRIMARY }} title="Edit"><Pencil size={13} /> Edit</button>
                      <button disabled={updating || a.status === "approved"} onClick={() => setAppStatus(a.uuid, "approved")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-40"
                        style={{ background: "#F0FDF4", color: "#15803D" }} title="Approve"><Check size={13} /> Approve</button>
                      <button disabled={updating || a.status === "rejected"} onClick={() => setAppStatus(a.uuid, "rejected")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-40"
                        style={{ background: BRAND_RED_TINT, color: BRAND_RED }} title="Reject"><Ban size={13} /> Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <SimplePagination page={page} total={total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
          </div>
        )}
      </div>

      {photoView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(2,6,23,.7)" }} onClick={() => setPhotoView(null)}>
          <img src={photoView} alt="Applicant" className="max-h-[85vh] max-w-[90vw] rounded-xl" style={{ border: "3px solid #fff" }} />
        </div>
      )}

      <ReportModal
        open={reportOpen} onClose={() => setReportOpen(false)}
        title="Download Applicants Report" path="/program-applications" filenameBase="applicants"
        initialValues={{ program, status, from, to }}
        fields={[
          { type: "select", key: "program", label: "Program", options: [{ value: "", label: "All programs" }, { value: "alumni", label: "Alumni" }, { value: "brand_ambassador", label: "Ambassadors" }] },
          { type: "select", key: "status", label: "Status", options: [{ value: "", label: "Any status" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }] },
          { type: "date", key: "from", label: "From date" },
          { type: "date", key: "to", label: "To date" },
        ]}
        buildParams={(v) => ({ program: v.program || undefined, status: v.status || undefined, from: v.from || undefined, to: v.to || undefined })}
        columns={[
          { label: "Name", key: "full_name" },
          { label: "Program", map: (r) => (r.program === "alumni" ? "Alumni" : "Brand Ambassador") },
          { label: "Status", key: "status" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "City", key: "city" },
          { label: "Course", key: "course" },
          { label: "Batch year", key: "batch_year" },
          { label: "Current role", key: "current_role" },
          { label: "Instagram", map: (r) => (r.social_handles && r.social_handles.instagram) || "" },
          { label: "Followers", key: "audience_size" },
          { label: "Referral code", key: "referral_code" },
          { label: "Applied", map: (r) => (r.created_at || "").slice(0, 10) },
        ]}
      />

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,6,23,.5)" }}>
          <div className="w-full max-w-lg p-6 bg-white rounded-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>Edit applicant</h3>
              <button onClick={() => setEdit(null)} className="grid w-8 h-8 rounded-lg place-items-center" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><X size={16} /></button>
            </div>
            <p className="text-[12px] mb-3" style={{ color: TEXT_SECONDARY }}>{edit.program === "alumni" ? "Alumni" : "Brand Ambassador"} application</p>
            <div className="grid grid-cols-2 gap-2.5">
              <input value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} placeholder="Full name" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} placeholder="Email" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="Phone" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <input value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} placeholder="City" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              {edit.program === "alumni" ? (
                <>
                  <input value={edit.course} onChange={(e) => setEdit({ ...edit, course: e.target.value })} placeholder="Course" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                  <input value={edit.batch_year} onChange={(e) => setEdit({ ...edit, batch_year: e.target.value })} placeholder="Batch year" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                  <input value={edit.current_role} onChange={(e) => setEdit({ ...edit, current_role: e.target.value })} placeholder="Current role" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                </>
              ) : (
                <>
                  <input value={edit.instagram} onChange={(e) => setEdit({ ...edit, instagram: e.target.value })} placeholder="Instagram handle" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                  <input type="number" min="0" value={edit.audience_size} onChange={(e) => setEdit({ ...edit, audience_size: e.target.value })} placeholder="Followers" className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                </>
              )}
              <textarea value={edit.message} onChange={(e) => setEdit({ ...edit, message: e.target.value })} rows={3} placeholder="Message / notes" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              {edit.status === "approved" && (
                <div className="col-span-2">
                  <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Referral / promo code</label>
                  <input value={edit.referral_code} onChange={(e) => setEdit({ ...edit, referral_code: e.target.value.toUpperCase() })} placeholder="e.g. ALI7K3Q"
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none font-mono" style={inputStyle} />
                  <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>Letters, numbers and dashes. Used to track this person's referrals.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEdit(null)} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
              <button onClick={saveEdit} disabled={savingEdit} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: BRAND_RED }}>
                {savingEdit ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
