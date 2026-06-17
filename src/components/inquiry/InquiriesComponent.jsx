import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, ClipboardList,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, X,
  Send, FileText, GraduationCap, ArrowUpDown, ArrowUp, ArrowDown,
  Mail, Phone, Download, Bell, FileSpreadsheet,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation, useLazyGetQuery,
} from "../../api/apiSlice";
import ReportModal from "../ui/ReportModal";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";
import { TRAINING_INQUIRY_CREATE, TRAINING_INQUIRY_EDIT, STUDENT_ENROLL } from "../routes/RouteConstants";
import SendChallanDialog from "./components/SendChallanDialog";
import ImportInquiriesModal from "./components/ImportInquiriesModal";
import UpdateInquiryReminderDialog from "./components/UpdateInquiryReminderDialog";
import ChallanHistoryModal from "../ui/ChallanHistoryModal";
import SimplePagination from "../ui/SimplePagination";
import LeadStatsStrip from "../ui/LeadStatsStrip";

/* ───────────────── brand tokens ───────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* Status pill */
const STATUS_CFG = {
  process:  { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Process" },
  pending:  { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", label: "Pending" },
  enrolled: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "Enrolled" },
  dropout:  { fg: TEXT_SECONDARY, bg: "#F1F5F9", border: BORDER, label: "Dropout" },
};
const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
      style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
};

const SortHeader = ({ label, field, sort, onSort }) => {
  const active = sort.field === field;
  const Arrow = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 select-none transition-colors"
      style={{
        color: active ? TEXT_PRIMARY : TEXT_SECONDARY, fontWeight: 600,
        letterSpacing: "0.04em", textTransform: "uppercase", fontSize: 11,
      }}
    >
      {label}
      <Arrow size={12} strokeWidth={2.25} style={{ color: active ? BRAND_RED : TEXT_MUTED }} />
    </button>
  );
};

/* Delete dialog */
/* Compact "challan sent" status pill for list rows. Click to view history. */
const ChallanStatusBadge = ({ row, onClick }) => {
  const count = Number(row?.challan_sent_count || 0);
  const wa = Number(row?.challan_whatsapp_count || 0);
  const em = Number(row?.challan_email_count || 0);
  if (count === 0) {
    return (
      <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
        style={{ background: "#F1F5F9", color: "#94A3B8" }}>
        Challan not sent
      </div>
    );
  }
  const parts = [];
  if (wa) parts.push(`WA ${wa}`);
  if (em) parts.push(`Email ${em}`);
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer"
      style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}
      title="View challan history & reasons">
      Challan ×{count}{parts.length ? ` · ${parts.join(" · ")}` : ""}
    </button>
  );
};

const DeleteInquiryDialog = ({ open, inquiry, onCancel, onConfirm, isLoading }) => {
  if (!open || !inquiry) return null;
  const name = `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete &ldquo;{name}&rdquo;'s inquiry?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          Removes the inquiry record permanently. Cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60"
            style={{ background: BRAND_RED }}
          >
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</>) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── main ───────────────── */
const InquiriesComponent = () => {
  const user = useSelector(selectCurrentUser);
  // Live auth token (same source as every RTK call). localStorage is only a
  // stale fallback — preferring Redux avoids 500s from an outdated token.
  const authToken = useSelector((s) => s.auth?.token);
  const navigate = useNavigate();

  /* state */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState({ field: null, dir: "asc" });

  // filters
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [shift, setShift] = useState("");
  const [source, setSource] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [followUp, setFollowUp] = useState(""); // "" | "true" | "false" → has_reminder

  // dialogs (modal-based) — add/edit moved to a dedicated /create + /:id/edit page.
  const [deleteDialog, setDeleteDialog] = useState({ open: false, inquiry: null });
  const [challanDialog, setChallanDialog] = useState({ open: false, inquiry: null, mode: "send" });
  const [challanLog, setChallanLog] = useState({ open: false, id: null, name: "" });
  const [reminderDialog, setReminderDialog] = useState({ open: false, inquiry: null });
  const [importOpen, setImportOpen] = useState(false);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* permissions */
  const canCreate = hasPermission(user, "create training-inquiries");
  const canUpdate = hasPermission(user, "update training-inquiries");
  const canDelete = hasPermission(user, "delete training-inquiries");
  const canChallan = hasPermission(user, "send inquiry-challan");
  const canPromote = hasPermission(user, "promote inquiry-to-student");

  /* courses for the dropdown */
  const { data: coursesData } = useGetQuery({
    path: "/course/courses",
    params: { per_page: 100 },
  });
  const courses = coursesData?.data || [];

  /* inquiries list */
  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    if (debouncedSearch) p["filters[q]"] = debouncedSearch;
    if (courseId)        p["filters[primary_course_id]"] = courseId;
    if (status)          p["filters[status]"] = status;
    if (shift)           p["filters[shift]"] = shift;
    if (source)          p["filters[source]"] = source;
    if (followUp !== "") p["filters[has_reminder]"] = followUp; // needs / no follow-up
    if (fromDate)        p.from = fromDate;
    if (toDate)          p.to = toDate;
    return p;
  }, [page, perPage, debouncedSearch, courseId, status, shift, source, followUp, fromDate, toDate]);

  useEffect(() => { setPage(1); }, [debouncedSearch, courseId, status, shift, source, followUp, fromDate, toDate]);

  const { data, error, isLoading, isFetching, refetch } = useGetQuery(
    { path: "/student/inquiry", params: queryParams },
    { refetchOnMountOrArgChange: true }
  );

  // create + update mutations live on the dedicated form page now.
  const [deleteInquiry, { isLoading: deleting }] = useDeleteMutation();
  const [challanPost,   { isLoading: challanLoading }] = usePostMutation();
  const [reminderPatch, { isLoading: scheduling }] = usePatchMutation();

  /**
   * The inquiry list endpoint returns a Laravel paginator OBJECT (not the
   * standardised apiResponse shape). The actual data array lives at
   * `data.data.data` and meta lives on `data.data.{current_page,...}`.
   * Normalise it once here so the rest of the component reads the same
   * shape as the other CRUDs.
   */
  const paginator = data?.data?.data ? data.data : null;
  const rows = paginator?.data || data?.data || [];
  const pagination = paginator ? {
    total: paginator.total,
    count: rows.length,
    current_page: paginator.current_page,
    last_page: paginator.last_page,
    per_page: paginator.per_page,
    from: paginator.from,
    to: paginator.to,
  } : (data?.meta?.pagination || {
    total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0,
  });

  /* client-side sort */
  const visibleRows = useMemo(() => {
    let list = rows;
    if (sort.field) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const va = a[sort.field]; const vb = b[sort.field];
        if (typeof va === "string") return va.localeCompare(vb || "") * dir;
        return ((va ?? 0) - (vb ?? 0)) * dir;
      });
    }
    return list;
  }, [rows, sort]);

  /* handlers */
  const handleSort = (field) =>
    setSort((p) =>
      p.field !== field ? { field, dir: "asc" } :
      p.dir === "asc" ? { field, dir: "desc" } :
      { field: null, dir: "asc" }
    );

  // Add / Edit now navigate to the dedicated full-page form.
  const openAdd = () => navigate(TRAINING_INQUIRY_CREATE);
  const openEdit = (v) => navigate(TRAINING_INQUIRY_EDIT.replace(":id", v.id));
  const openDelete = (v) => setDeleteDialog({ open: true, inquiry: v });
  const closeDelete = () => setDeleteDialog({ open: false, inquiry: null });
  const openChallan = (v, mode = "send") => setChallanDialog({ open: true, inquiry: v, mode });
  const closeChallan = () => setChallanDialog({ open: false, inquiry: null, mode: "send" });
  const openPromote = (v) => navigate(STUDENT_ENROLL.replace(':id', v.id));
  const openReminder = (v) => setReminderDialog({ open: true, inquiry: v });
  const closeReminder = () => setReminderDialog({ open: false, inquiry: null });

  const handleConfirmReminder = async (payload) => {
    try {
      await reminderPatch({
        path: `/student/inquiry/${reminderDialog.inquiry.id}/reminder`,
        body: payload,
      }).unwrap();
      showToast("Reminder updated", "success");
      closeReminder();
      refetch();
      return { error: null };
    } catch (err) {
      return { error: err?.data?.message || "Could not update reminder." };
    }
  };

  // Download/preview the challan PDF. `params` (optional) carries ad-hoc
  // discount + course overrides, sent as query string so the PDF reflects
  // exactly what the admin chose in the dialog.
  const previewChallan = (v, params = null) => {
    // GET /challan-pdf — authed fetch, blob open in new tab.
    // Strip any trailing slash on VITE_API_URL (e.g. ".../api/") so we
    // don't end up with "//student/inquiry/…" which Laravel 404s on.
    // Also check res.ok before turning the body into a blob, otherwise
    // an error HTML page gets opened as a fake "PDF".
    const token = authToken || localStorage.getItem("token");
    const baseUrl = (import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/")
      .replace(/\/+$/, "");
    let url = `${baseUrl}/student/inquiry/${v.id}/challan-pdf`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.course_id) qs.set("course_id", params.course_id);
      qs.set("enrollment_discount", params.enrollment_discount ?? 0);
      qs.set("enrollment_discount_type", params.enrollment_discount_type || "amount");
      qs.set("monthly_discount", params.monthly_discount ?? 0);
      qs.set("monthly_discount_type", params.monthly_discount_type || "amount");
      qs.set("is_laptop", params.is_laptop ? 1 : 0);
      if (params.discount_reason) qs.set("discount_reason", params.discount_reason);
      url += `?${qs.toString()}`;
    }

    fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } })
      .then(async (r) => {
        if (!r.ok) {
          // Try to surface the backend's message; fall back to status text.
          let msg = `Could not load challan PDF (HTTP ${r.status}).`;
          try {
            const txt = await r.text();
            const j = txt && JSON.parse(txt);
            if (j?.message) msg = j.message;
          } catch { /* not JSON */ }
          throw new Error(msg);
        }
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/pdf")) {
          throw new Error("Server didn't return a PDF.");
        }
        return r.blob();
      })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener");
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 30_000);
      })
      .catch((err) => showToast(err?.message || "Could not load challan PDF.", "error"));
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteInquiry({ path: `/student/inquiry/${deleteDialog.inquiry.id}` }).unwrap();
      showToast("Inquiry deleted", "success");
      closeDelete();
      if (visibleRows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      showToast(err?.data?.message || "Failed to delete.", "error");
    }
  };

  const handleConfirmChallan = async (payload = { channels: ["whatsapp", "email"] }) => {
    // Download mode: render + open the PDF with the chosen discounts, no send.
    if (challanDialog.mode === "download") {
      previewChallan(challanDialog.inquiry, payload);
      closeChallan();
      return;
    }
    try {
      const res = await challanPost({
        path: `/student/inquiry/${challanDialog.inquiry.id}/send-challan`,
        body: payload,
      }).unwrap();
      const sent = res?.data || {};
      const parts = [];
      if (sent.whatsapp_sent === true) parts.push("WhatsApp");
      if (sent.email_sent === true) parts.push("email");
      showToast(
        parts.length ? `Challan sent via ${parts.join(" + ")}` : "Challan processed",
        parts.length ? "success" : "info"
      );
      closeChallan();
    } catch (err) {
      showToast(err?.data?.message || "Failed to send challan.", "error");
    }
  };


  /* options for searchable selects */
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.name })),
    [courses]
  );

  const [reportOpen, setReportOpen] = useState(false);
  const hasActiveFilters = !!(courseId || status || shift || source || followUp || fromDate || toDate || debouncedSearch);
  const clearFilters = () => {
    setCourseId(""); setStatus(""); setShift(""); setSource(""); setFollowUp(""); setFromDate(""); setToDate(""); setSearch("");
  };

  const isEmpty = !isLoading && !error && rows.length === 0;

  /* ── render ── */
  return (
    <div
      className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}
          >
            <ClipboardList size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              Training Inquiries
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Manage enrollment intake — send challans, promote to student, edit details
            </p>
          </div>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition rounded-lg"
              style={{ color: TEXT_PRIMARY, background: "#F1F5F9", border: "1px solid #E2E8F0" }}
            >
              <FileSpreadsheet size={15} strokeWidth={2.25} />
              Import Excel
            </button>
            <button
              type="button" onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
              style={{
                background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)",
              }}
            >
              <Plus size={15} strokeWidth={2.25} />
              Add Inquiry
            </button>
          </div>
        )}
      </div>

      {/* Filters toolbar */}
      <LeadStatsStrip />
        <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} strokeWidth={2} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, CNIC…"
            className="w-full py-2 pl-9 pr-9 text-sm transition rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
            onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
            onBlur={(e) => { e.currentTarget.style.background = SURFACE_HOVER; e.currentTarget.style.borderColor = BORDER; }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }} aria-label="Clear">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Course (searchable) */}
        <SearchableSelect
          options={courseOptions}
          value={courseId}
          onChange={(v) => setCourseId(v || "")}
          placeholder="All courses"
          compact
        />

        {/* Status */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any status" },
            { v: "process", l: "Process" },
            { v: "pending", l: "Pending" },
            { v: "enrolled", l: "Enrolled" },
            { v: "dropout", l: "Dropout" },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => setStatus(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: status === o.v ? "#fff" : TEXT_SECONDARY, background: status === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

        {/* Source: website vs in-house */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "All sources" },
            { v: "website", l: "Website" },
            { v: "in_house", l: "In-house" },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => setSource(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: source === o.v ? "#fff" : TEXT_SECONDARY, background: source === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

        {/* Shift */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any shift" },
            { v: "morning", l: "Morning" },
            { v: "afternoon", l: "Afternoon" },
            { v: "evening", l: "Evening" },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => setShift(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: shift === o.v ? "#fff" : TEXT_SECONDARY, background: shift === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

        {/* Follow-up (has a reminder set) */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any" },
            { v: "true", l: "Needs follow-up" },
            { v: "false", l: "No follow-up" },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => setFollowUp(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: followUp === o.v ? "#fff" : TEXT_SECONDARY, background: followUp === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

        {/* Date range */}
        <input
          type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From"
          className="py-2 px-3 text-sm rounded-lg outline-none"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
        />
        <span className="text-[12px]" style={{ color: TEXT_MUTED }}>→</span>
        <input
          type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="To"
          className="py-2 px-3 text-sm rounded-lg outline-none"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
        />

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-[12px] font-semibold transition" style={{ color: BRAND_RED }}>
            Clear filters
          </button>
        )}
        <button onClick={() => setReportOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white" style={{ background: "#0F172A" }} title="Download report">
          <Download size={14} /> Report
        </button>
        <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
          {pagination.total} total
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 1100 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                <th className="px-4 py-3 text-left" style={{ width: 48 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>#</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Name" field="first_name" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Contact</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Primary course</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Status</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Shift</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Submitted" field="submitted_at" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-right" style={{ width: 180 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2, 3].map((i) => (
                <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[40, 160, 120, 130, 80, 80, 100, 130].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && error && (
                <tr><td colSpan={8} className="px-5 py-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <AlertTriangle size={14} />
                    <span className="text-sm font-semibold">Couldn't load inquiries. Please try again.</span>
                  </div>
                </td></tr>
              )}

              {isEmpty && (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <ClipboardList size={22} />
                  </div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                    {hasActiveFilters ? "No inquiries match these filters" : "No inquiries yet"}
                  </div>
                  <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                    {hasActiveFilters ? "Try clearing filters or search." : "Create your first inquiry to start the enrolment funnel."}
                  </div>
                  {!hasActiveFilters && canCreate && (
                    <button type="button" onClick={openAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                      style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
                    >
                      <Plus size={14} />
                      Add Inquiry
                    </button>
                  )}
                </td></tr>
              )}

              {!isLoading && !error && visibleRows.map((v, i) => {
                const indexOnPage = (pagination.from || 1) + i;
                const isEnrolled = v.status === "enrolled";
                return (
                  <tr key={v.id}
                    onClick={() => canUpdate && openEdit(v)}
                    style={{ borderTop: `1px solid ${BORDER}`, cursor: canUpdate ? "pointer" : "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{indexOnPage}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                        {v.first_name} {v.last_name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: TEXT_MUTED }}>
                        <Mail size={10} strokeWidth={2} />
                        {v.email}
                      </div>
                      <ChallanStatusBadge row={v} onClick={() => setChallanLog({ open: true, id: v.id, name: `${v.first_name || ""} ${v.last_name || ""}`.trim() })} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm" style={{ color: TEXT_PRIMARY }}>
                        <Phone size={12} strokeWidth={2} style={{ color: TEXT_MUTED }} />
                        {v.phone_number}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>
                      {v.primary_course?.name || (courses.find((c) => c.id === v.primary_course_id)?.name) || "—"}
                      {v.primary_status && (
                        <span className="ml-1.5 text-[10.5px] font-semibold uppercase" style={{ color: TEXT_MUTED, letterSpacing: "0.05em" }}>
                          · {v.primary_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={v.status} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_PRIMARY }}>
                      {v.shift ? String(v.shift).charAt(0).toUpperCase() + String(v.shift).slice(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_PRIMARY }}>
                      {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {canChallan && !isEnrolled && (
                          <button type="button" onClick={() => openChallan(v)} title="Send fee challan"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF3C7"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFBEB"; }}
                          ><Send size={14} strokeWidth={2.2} /></button>
                        )}
                        <button type="button" onClick={() => openChallan(v, "download")} title="Download challan PDF"
                          className="flex items-center justify-center transition rounded-md"
                          style={{ width: 30, height: 30, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#DBEAFE"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                        ><FileText size={14} strokeWidth={2.2} /></button>
                        {canPromote && !isEnrolled && (
                          <button type="button" onClick={() => openPromote(v)} title="Promote to student"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: "#15803D", background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#DCFCE7"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F0FDF4"; }}
                          ><GraduationCap size={14} strokeWidth={2.2} /></button>
                        )}
                        {canUpdate && !isEnrolled && (
                          <button type="button" onClick={() => openReminder(v)}
                            title={v.reminder_date ? `Follow-up set for ${v.reminder_date}` : "Set follow-up reminder"}
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: v.reminder_date ? "#B45309" : TEXT_SECONDARY, background: v.reminder_date ? "#FFFBEB" : "#F1F5F9", border: `1px solid ${v.reminder_date ? "#FDE68A" : "#E2E8F0"}` }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF3C7"; e.currentTarget.style.color = "#B45309"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = v.reminder_date ? "#FFFBEB" : "#F1F5F9"; e.currentTarget.style.color = v.reminder_date ? "#B45309" : TEXT_SECONDARY; }}
                          ><Bell size={14} strokeWidth={2.2} /></button>
                        )}
                        {canUpdate && (
                          <button type="button" onClick={() => openEdit(v)} title="Edit"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: TEXT_PRIMARY, background: "#F1F5F9", border: "1px solid #E2E8F0" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#E2E8F0"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
                          ><Pencil size={14} strokeWidth={2.2} /></button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => openDelete(v)} title="Delete"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: BRAND_RED, background: BRAND_RED_TINT, border: "1px solid #FECACA" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEE2E2"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; }}
                          ><Trash2 size={14} strokeWidth={2.2} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      <SimplePagination
        page={page}
        total={pagination.total || 0}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <DeleteInquiryDialog
        open={deleteDialog.open}
        inquiry={deleteDialog.inquiry}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
      <SendChallanDialog
        open={challanDialog.open}
        inquiry={challanDialog.inquiry}
        courses={courses}
        mode={challanDialog.mode}
        onCancel={closeChallan}
        onConfirm={handleConfirmChallan}
        isLoading={challanLoading}
      />
      <ChallanHistoryModal
        open={challanLog.open}
        type="inquiry"
        id={challanLog.id}
        name={challanLog.name}
        onClose={() => setChallanLog({ open: false, id: null, name: "" })}
      />
      <UpdateInquiryReminderDialog
        open={reminderDialog.open}
        inquiry={reminderDialog.inquiry}
        onCancel={closeReminder}
        onConfirm={handleConfirmReminder}
        isLoading={scheduling}
      />
      <ImportInquiriesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { setImportOpen(false); refetch(); }}
      />

      <ReportModal
        open={reportOpen} onClose={() => setReportOpen(false)}
        title="Download Inquiries Report" path="/student/inquiry" filenameBase="inquiries"
        initialValues={{ status, shift, source, from: fromDate, to: toDate, q: debouncedSearch }}
        fields={[
          { type: "select", key: "status", label: "Status", options: [{ value: "", label: "Any status" }, { value: "pending", label: "Pending" }, { value: "process", label: "In process" }, { value: "enrolled", label: "Enrolled" }, { value: "rejected", label: "Rejected" }] },
          { type: "select", key: "shift", label: "Shift", options: [{ value: "", label: "Any shift" }, { value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" }] },
          { type: "select", key: "source", label: "Source", options: [{ value: "", label: "Any source" }, { value: "website", label: "Website" }, { value: "admin", label: "Admin" }, { value: "student_portal", label: "Student portal" }] },
          { type: "date", key: "from", label: "From date" },
          { type: "date", key: "to", label: "To date" },
          { type: "text", key: "q", label: "Search (name / email / phone)", full: true },
        ]}
        buildParams={(v) => {
          const p = {};
          if (v.status) p["filters[status]"] = v.status;
          if (v.shift) p["filters[shift]"] = v.shift;
          if (v.source) p["filters[source]"] = v.source;
          if (v.q) p["filters[q]"] = v.q;
          if (v.from) p.from = v.from;
          if (v.to) p.to = v.to;
          return p;
        }}
        columns={[
          { label: "Name", map: (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone_number" },
          { label: "Course", map: (r) => r.primary_course?.name || "" },
          { label: "Shift", key: "shift" },
          { label: "Status", key: "status" },
          { label: "Source", key: "source" },
          { label: "City", key: "city" },
          { label: "Date", map: (r) => (r.created_at || r.submitted_at || "").slice(0, 10) },
        ]}
      />
    </div>
  );
};

export default InquiriesComponent;
