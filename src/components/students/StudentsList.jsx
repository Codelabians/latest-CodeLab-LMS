import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users, Search, Loader2, Plus, Home, Laptop, Eye, ChevronDown, Download, UserX, X, Trash2, AlertTriangle, StickyNote,
} from "lucide-react";
import { useGetQuery, useLazyGetQuery, usePostMutation, useDeleteMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { downloadCSV } from "../../api/fileDownload";
import SimplePagination from "../ui/SimplePagination";
import PhoneActions from "../ui/PhoneActions";
import SearchableSelect from "../ui/SearchableSelect";
import LeadNotesModal from "../ui/LeadNotesModal";
import { loadRememberedFilters, loadRememberFlag, saveRememberedFilters } from "../../hooks/useRememberFilters";
import { STUDENT_ADD, STUDENT } from "../routes/RouteConstants";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const BRAND_RED = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const FEE_BADGE = {
  paid:     { bg: "#F0FDF4", fg: "#15803D", label: "Paid" },
  pending:  { bg: "#FFFBEB", fg: "#B45309", label: "Pending" },
  overdue:  { bg: "#FEF2F2", fg: BRAND_RED, label: "Overdue" },
  waived:   { bg: "#F5F3FF", fg: "#6D28D9", label: "Waived" },
  break:    { bg: "#EFF6FF", fg: "#1D4ED8", label: "On break" },
  refunded: { bg: "#F5F3FF", fg: "#6D28D9", label: "Refunded" },
  on_break: { bg: "#EFF6FF", fg: "#1D4ED8", label: "On break" },
  dropped_out: { bg: "#F1F5F9", fg: "#64748B", label: "Dropped out" },
};

const Select = ({ value, onChange, children, width }) => (
  <div className="relative" style={{ minWidth: width || 150 }}>
    <select value={value} onChange={onChange}
      className="w-full py-2 pl-3 pr-8 text-sm rounded-lg outline-none"
      style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, appearance: "none", fontFamily: "'Montserrat', sans-serif", cursor: "pointer" }}>
      {children}
    </select>
    <ChevronDown size={14} className="absolute pointer-events-none -translate-y-1/2 right-2.5 top-1/2" style={{ color: TEXT_MUTED }} />
  </div>
);

export default function StudentsList() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const canPurge = hasPermission(currentUser, "purge student");
  const remembered = loadRememberedFilters("students") || {};
  const [rememberFilters, setRememberFilters] = useState(() => loadRememberFlag("students"));
  const [search, setSearch] = useState(remembered.search ?? "");
  const [q, setQ] = useState(remembered.search ?? "");
  const [courseId, setCourseId] = useState(remembered.courseId ?? "");
  // Pre-select the batch when arriving from the Batches page
  // (/dashboard/students?batch_id=<uuid>). The batch dropdown's option value
  // is the batch_uuid, and the backend accepts a uuid for batch_id, so this
  // both filters the list and shows the batch as selected.
  const [searchParams] = useSearchParams();
  const [batchId, setBatchId] = useState(searchParams.get("batch_id") || remembered.batchId || "");
  const [feeStatus, setFeeStatus] = useState(remembered.feeStatus ?? "");
  const [joined, setJoined] = useState(remembered.joined ?? "");
  const [status, setStatus] = useState(remembered.status ?? "");
  const [instructorId, setInstructorId] = useState(remembered.instructorId ?? "");
  const [joinedFrom, setJoinedFrom] = useState(remembered.joinedFrom ?? "");
  const [joinedTo, setJoinedTo] = useState(remembered.joinedTo ?? "");
  const [scholarship, setScholarship] = useState(remembered.scholarship ?? "");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(remembered.perPage ?? 15);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(1); }, [courseId, batchId, feeStatus, joined, status, instructorId, joinedFrom, joinedTo, scholarship]);

  useEffect(() => {
    saveRememberedFilters("students", rememberFilters, {
      search, courseId, batchId, feeStatus, joined, status, instructorId, joinedFrom, joinedTo, scholarship, perPage,
    });
  }, [rememberFilters, search, courseId, batchId, feeStatus, joined, status, instructorId, joinedFrom, joinedTo, scholarship, perPage]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (q) p.q = q;
    if (courseId) p.course_id = courseId;
    if (batchId) p.batch_id = batchId;
    if (feeStatus) p.fee_status = feeStatus;
    if (joined) p.joined = joined;
    if (status) p.status = status;
    if (instructorId) p.instructor_id = instructorId;
    if (joinedFrom) p.joined_from = joinedFrom;
    if (joinedTo) p.joined_to = joinedTo;
    if (scholarship) p.scholarship_program = scholarship;
    return p;
  }, [page, perPage, q, courseId, batchId, feeStatus, joined, status, instructorId, joinedFrom, joinedTo, scholarship]);

  const { data, isLoading, isFetching, refetch } = useGetQuery({ path: "/student/students", params });
  const rows = data?.data || [];
  const meta = data?.meta?.pagination || data?.meta || data?.pagination || {};
  const total = meta.total || rows.length;

  // Mark-dropout
  const todayStr = new Date().toISOString().slice(0, 10);
  const DROPOUT_CATEGORIES = ["personal", "financial", "academic", "relocation", "health", "job", "other"];
  const [dropTarget, setDropTarget] = useState(null); // student row
  const [photoPreview, setPhotoPreview] = useState(null); // full-size photo lightbox
  const [dropReason, setDropReason] = useState("");
  const [dropDate, setDropDate] = useState(todayStr);
  const [dropCategory, setDropCategory] = useState("personal");
  const [dropErr, setDropErr] = useState(null);
  const [markDropout, { isLoading: dropping }] = usePostMutation();
  const openDropout = (row) => { setDropTarget(row); setDropReason(""); setDropDate(todayStr); setDropCategory("personal"); setDropErr(null); };
  const submitDropout = async () => {
    setDropErr(null);
    try {
      await markDropout({
        path: `user/${dropTarget.uuid}/mark-dropped-out`,
        body: { reason: dropReason.trim() || null, dropped_out_at: dropDate || null, dropout_category: dropCategory || null },
      }).unwrap();
      setDropTarget(null); refetch();
    } catch (e) {
      console.error("mark dropout failed", e);
      setDropErr(e?.data?.message || (e?.status === 403 ? "You don't have permission to mark dropouts." : `Request failed (HTTP ${e?.status ?? "?"}).`));
    }
  };

  // Purge — permanently wipe EVERY record for a person (test-account cleanup).
  const [purgeTarget, setPurgeTarget] = useState(null); // student row
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purgeErr, setPurgeErr] = useState(null);
  const [notesModal, setNotesModal] = useState({ open: false, id: null, name: "" });
  const [purgeUser, { isLoading: purging }] = useDeleteMutation();
  const openPurge = (row) => { setPurgeTarget(row); setPurgeConfirm(""); setPurgeErr(null); };
  const submitPurge = async () => {
    setPurgeErr(null);
    try {
      await purgeUser({
        path: `/student/students/${purgeTarget.uuid}/purge?confirm=${encodeURIComponent(purgeConfirm.trim())}`,
      }).unwrap();
      setPurgeTarget(null); refetch();
    } catch (e) {
      console.error("purge failed", e);
      setPurgeErr(e?.data?.message || (e?.status === 403 ? "You don't have permission to purge." : `Request failed (HTTP ${e?.status ?? "?"}).`));
    }
  };

  const { data: courseData } = useGetQuery({ path: "/course/courses", params: { per_page: 200 } });
  const courses = courseData?.data || [];
  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } });
  const { data: teacherData } = useGetQuery({ path: "/course/teachers" });
  const teachers = teacherData?.data || [];
  const { data: progData } = useGetQuery({ path: "student/scholarship-programs/active" });
  const programs = progData?.data || [];
  const batches = useMemo(() => {
    const list = batchData?.data || [];
    return courseId ? list.filter((b) => String(b.course_id) === String(courseId)) : list;
  }, [batchData, courseId]);

  const [triggerExport] = useLazyGetQuery();
  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await triggerExport({ path: "/student/students", params: { ...params, page: 1, per_page: 100000 } }).unwrap();
      const list = res?.data || [];
      const cols = [
        { label: "Name", key: "name" }, { label: "Email", key: "email" }, { label: "CNIC", key: "cnic" },
        { label: "Phone", key: "contact" }, { label: "Course", key: "course" }, { label: "Batch", key: "batch" },
        { label: "Instructor", key: "instructor" }, { label: "Joined", map: (r) => (r.date_of_joining || "").slice(0, 10) },
        { label: "Pending (Rs)", key: "pending" }, { label: "Fee status", key: "fee_status" },
        { label: "Hostelite", map: (r) => (r.is_hostalize ? "Yes" : "No") }, { label: "Laptop", map: (r) => (r.laptop_provided ? "Yes" : "No") },
        { label: "Status", key: "status" },
      ];
      if (list.length) downloadCSV(list, cols, `students_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {}
    setDownloading(false);
  };

  const clearFilters = () => { setSearch(""); setQ(""); setCourseId(""); setBatchId(""); setFeeStatus(""); setJoined(""); setStatus(""); setInstructorId(""); setJoinedFrom(""); setJoinedTo(""); setScholarship(""); };
  const hasFilters = !!(q || courseId || batchId || feeStatus || joined || status || instructorId || joinedFrom || joinedTo || scholarship);

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}><Users size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Students</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>{total} student{total === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadReport} disabled={downloading} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50" style={{ background: "#0F172A" }}>
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Report
          </button>
          <button onClick={() => navigate(STUDENT_ADD)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white" style={{ background: BRAND_RED }}>
            <Plus size={15} /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 mb-3 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search size={15} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, CNIC, phone, reg #…"
            className="w-full py-2 pl-9 pr-3 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
        </div>
        <div style={{ minWidth: 170 }}>
          <SearchableSelect
            options={courses.map((c) => ({ value: String(c.id), label: c.name }))}
            value={courseId ? String(courseId) : ""}
            onChange={(v) => { setCourseId(v || ""); setBatchId(""); }}
            placeholder="All courses" />
        </div>
        <div style={{ minWidth: 150 }}>
          <SearchableSelect
            options={batches.map((b) => ({ value: String(b.batch_uuid || b.id), label: `${b.name}${b.teacher_name ? ` · ${b.teacher_name}` : ""}` }))}
            value={batchId ? String(batchId) : ""}
            onChange={(v) => setBatchId(v || "")}
            placeholder="All batches" />
        </div>
        <Select value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)} width={130}>
          <option value="">Any fee</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="waived">Waived</option>
          <option value="refunded">Refunded</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </Select>
        <Select value={joined} onChange={(e) => setJoined(e.target.value)} width={130}>
          <option value="">Any time</option>
          <option value="today">Joined today</option>
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
        </Select>
        <input type="date" value={joinedFrom} onChange={(e) => setJoinedFrom(e.target.value)} title="Joined from"
          className="py-2 px-2 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }} />
        <input type="date" value={joinedTo} onChange={(e) => setJoinedTo(e.target.value)} title="Joined to"
          className="py-2 px-2 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }} />
        <Select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} width={150}>
          <option value="">Any instructor</option>
          {teachers.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.name || `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.email}</option>
          ))}
        </Select>
        <Select value={scholarship} onChange={(e) => setScholarship(e.target.value)} width={170}>
          <option value="">Any program</option>
          <option value="none">No program</option>
          {programs.map((pr) => (
            <option key={pr.uuid} value={pr.uuid}>{pr.name}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} width={130}>
          <option value="">Any status</option>
          <option value="enrolled">Enrolled</option>
          <option value="active">Active</option>
          <option value="dropped_out">Dropped out</option>
        </Select>
        <label className="inline-flex items-center gap-1.5 text-[12px] font-medium cursor-pointer select-none" style={{ color: "#475569" }} title="Keep these filters next time you open this page">
          <input type="checkbox" checked={rememberFilters} onChange={(e) => setRememberFilters(e.target.checked)} />
          Remember filters
        </label>
        {hasFilters && <button onClick={clearFilters} className="text-[12px] font-semibold" style={{ color: BRAND_RED }}>Clear</button>}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
              {["Student", "Course / Batch", "Instructor", "Joined", "Fee", "Status", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-[12px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(isLoading || isFetching) && <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}><Loader2 className="inline animate-spin" size={18} /> Loading…</td></tr>}
            {!isLoading && !isFetching && rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>No students match these filters.</td></tr>}
            {!isLoading && !isFetching && rows.map((r) => {
              const fee = FEE_BADGE[r.fee_status] || FEE_BADGE.paid;
              return (
                <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {r.image
                        ? <img src={r.image} alt={r.name} onClick={(ev) => { ev.stopPropagation(); setPhotoPreview(r.image); }} className="object-cover rounded-full flex-shrink-0 cursor-zoom-in" style={{ width: 34, height: 34 }} title="Click to view full size" />
                        : <span className="grid rounded-full place-items-center text-white font-bold flex-shrink-0" style={{ width: 34, height: 34, background: BRAND_RED, fontSize: 13 }}>{(r.name || "?").charAt(0).toUpperCase()}</span>}
                      <div>
                        <div className="font-semibold flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}>
                          {r.name || "—"}
                          {r.is_hostalize && <Home size={12} style={{ color: "#0891B2" }} title="Hostelite" />}
                          {r.laptop_provided && <Laptop size={12} style={{ color: "#B45309" }} title="Laptop provided" />}
                        </div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{r.email || r.cnic || ""}</div>
                        {r.contact && (
                          <PhoneActions number={r.contact} name={r.name} className="text-[11px]" />
                        )}
                        {r.latest_note?.body && (
                          <div className="flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: TEXT_SECONDARY, maxWidth: 260 }} title={r.latest_note.body}>
                            <StickyNote size={10} strokeWidth={2} /> <span className="truncate">{r.latest_note.body}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: TEXT_SECONDARY }}>
                    {(r.enrollments && r.enrollments.length ? r.enrollments : [{ course: r.course, batch: r.batch }]).map((e, ei) => (
                      <div key={ei} className={ei > 0 ? "mt-1.5 pt-1.5" : ""} style={ei > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}>
                        <div style={{ color: TEXT_PRIMARY }}>{e.course || "—"}</div>
                        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{e.batch || "—"}</div>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: TEXT_SECONDARY }}>
                    {(r.enrollments && r.enrollments.length ? r.enrollments : [{ instructor: r.instructor }]).map((e, ei) => (
                      <div key={ei} className={ei > 0 ? "mt-1.5 pt-1.5" : ""} style={ei > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}>{e.instructor || "—"}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: TEXT_MUTED }}>{(r.date_of_joining || "").slice(0, 10) || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: fee.bg, color: fee.fg }}>{fee.label}</span>
                    {r.pending > 0 && <div className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>Rs {Number(r.pending).toLocaleString()} due</div>}
                    {(r.enrollment_fee != null || r.monthly_fee != null) && (
                      <div className="mt-1 text-[11px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                        {r.enrollment_fee != null ? `Enroll Rs ${Number(r.enrollment_fee).toLocaleString()}` : ""}
                        {r.enrollment_fee != null && r.monthly_fee != null ? " · " : ""}
                        {r.monthly_fee != null ? `Rs ${Number(r.monthly_fee).toLocaleString()}/mo` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] capitalize" style={{ color: TEXT_SECONDARY }}>{(r.status || "").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => setNotesModal({ open: true, id: r.id, name: r.name })} title="Notes & reminders"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#B45309" }}><StickyNote size={14} /></button>
                      <button onClick={() => navigate(`${STUDENT}/${r.uuid}`)} title="View student"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><Eye size={14} /> View</button>
                      {(r.status || "").toLowerCase() !== "dropout" ? (
                        <button onClick={() => openDropout(r)} title="Mark as dropout"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, border: `1px solid ${BORDER}`, color: BRAND_RED }}><UserX size={14} /></button>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>Dropout</span>
                      )}
                      {canPurge && (
                        <button onClick={() => openPurge(r)} title="Permanently wipe ALL records for this person"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: "#1E1B1B", border: "1px solid #1E1B1B", color: "#fff" }}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <SimplePagination page={page} total={total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
        </div>
      </div>

      {dropTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
          <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: BRAND_RED_TINT, color: BRAND_RED }}><UserX size={17} /></span>
                <div>
                  <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Mark as dropout</h2>
                  <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>{dropTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setDropTarget(null)} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Dropout date</label>
                <input type="date" value={dropDate} max={todayStr} onChange={(e) => setDropDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Category</label>
                <select value={dropCategory} onChange={(e) => setDropCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none capitalize" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
                  {DROPOUT_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
            </div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Reason / notes</label>
            <textarea rows={3} value={dropReason} onChange={(e) => setDropReason(e.target.value)} placeholder="e.g. Left after 1 week — personal reasons"
              className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
            {dropErr && <div className="mt-3 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid ${BORDER}` }}>{dropErr}</div>}
            <div className="flex gap-2 pt-5">
              <button onClick={() => setDropTarget(null)} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
              <button onClick={submitDropout} disabled={dropping} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND_RED }}>{dropping ? "Marking…" : "Mark dropout"}</button>
            </div>
          </div>
        </div>
      )}

      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: BRAND_RED_TINT, color: BRAND_RED }}><AlertTriangle size={17} /></span>
                <div>
                  <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Permanently wipe records</h2>
                  <p className="text-[11.5px]" style={{ color: TEXT_MUTED }}>{purgeTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setPurgeTarget(null)} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
            </div>
            <div className="px-3 py-2.5 mb-3 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid ${BORDER}` }}>
              This deletes EVERY record tied to this person — fees, payments, refunds, attendance, certificates and the account itself. This cannot be undone.
            </div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Type the student's full name to confirm</label>
            <input value={purgeConfirm} onChange={(e) => setPurgeConfirm(e.target.value)} placeholder={purgeTarget.name}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
            {purgeErr && <div className="mt-3 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED, border: `1px solid ${BORDER}` }}>{purgeErr}</div>}
            <div className="flex gap-2 pt-5">
              <button onClick={() => setPurgeTarget(null)} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
              <button onClick={submitPurge} disabled={purging || purgeConfirm.trim().toLowerCase() !== (purgeTarget.name || "").trim().toLowerCase()}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-40" style={{ background: "#1E1B1B" }}>{purging ? "Wiping…" : "Wipe everything"}</button>
            </div>
          </div>
        </div>
      )}
      <LeadNotesModal open={notesModal.open} type="student" id={notesModal.id} name={notesModal.name} onClose={() => setNotesModal({ open: false, id: null, name: "" })} />

      {photoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-zoom-out" style={{ background: "rgba(15,23,42,0.85)" }} onClick={() => setPhotoPreview(null)}>
          <img src={photoPreview} alt="Student" className="object-contain rounded-2xl" style={{ maxWidth: "90vw", maxHeight: "85vh", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </div>
  );
}
