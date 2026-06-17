import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, UserSearch,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, X,
  Snowflake, Bell, ArrowRightCircle, GraduationCap, Receipt,
  ArrowUpDown, ArrowUp, ArrowDown, Mail, Phone, Calendar, Download, FileText,
} from "lucide-react";
import { TRAINING_INQUIRY_CREATE, ENROLL_STUDENT, STUDENT_ENROLL } from "../routes/RouteConstants";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation, useLazyGetQuery,
} from "../../api/apiSlice";
import ReportModal from "../ui/ReportModal";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import VisitorModal from "./components/VisitorModal";
import MarkColdDialog from "./components/MarkColdDialog";
import UpdateReminderDialog from "./components/UpdateReminderDialog";
import ConvertDialog from "./components/ConvertDialog";
import SendChallanDialog from "./components/SendChallanDialog";
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

/* ───────────────── pills + helpers ───────────────── */
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

const SectionPill = ({ section }) => {
  const cfg = section === "tech_school"
    ? { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", label: "Tech School" }
    : section === "it_solutions"
    ? { fg: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "IT Solutions" }
    : { fg: TEXT_SECONDARY, bg: "#F1F5F9", border: BORDER, label: "Other" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
      style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
};

const STATUS_CFG = {
  pending:              { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "Pending" },
  followed_up:          { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", label: "Followed up" },
  converted_to_inquiry: { fg: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Converted → Inquiry" },
  converted_to_student: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "Enrolled (Student)" },
  cold:                 { fg: TEXT_MUTED, bg: "#F1F5F9", border: BORDER, label: "Cold" },
};
const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
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

/* ───────────────── delete dialog ───────────────── */
const DeleteVisitorDialog = ({ open, visitor, onCancel, onConfirm, isLoading }) => {
  if (!open || !visitor) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
        >
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete &ldquo;{visitor.name}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This removes the visitor record permanently. Cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button" onClick={onCancel} disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >Cancel</button>
          <button
            type="button" onClick={onConfirm} disabled={isLoading}
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

/* ───────────────────── main ───────────────────── */
const VisitorsComponent = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  /* state */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState({ field: null, dir: "asc" });

  // filters
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState("");

  // modals / dialogs
  const [formModal, setFormModal] = useState({ open: false, mode: null, visitor: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, visitor: null });
  const [coldDialog, setColdDialog] = useState({ open: false, visitor: null });
  const [reminderDialog, setReminderDialog] = useState({ open: false, visitor: null });
  const [convertDialog, setConvertDialog] = useState({ open: false, visitor: null, target: null });
  const [challanDialog, setChallanDialog] = useState({ open: false, visitor: null, mode: "send" });
  const [challanLog, setChallanLog] = useState({ open: false, id: null, name: "" });

  /* search debounce */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* permissions */
  const canCreate = hasPermission(user, "create visitors");
  const canUpdate = hasPermission(user, "update visitors");
  const canDelete = hasPermission(user, "delete visitors");
  const canMarkCold = hasPermission(user, "mark visitor-cold");
  const canConvertToStudent = hasPermission(user, "convert visitor-to-student");
  const canConvertToInquiry = hasPermission(user, "create training-inquiries");

  /* dropdown data — courses + purposes + users (for referrer picker) */
  const { data: coursesData } = useGetQuery({
    path: "/course/courses",
    params: { per_page: 100 },
  });
  const courses = coursesData?.data || [];

  const { data: purposesData } = useGetQuery({
    path: "/student/visit-purposes/active",
  });
  const purposes = purposesData?.data || [];

  const { data: employeesData } = useGetQuery({
    path: "/user/employees",
    params: { per_page: 200 },
  });
  const referrerUsers = employeesData?.data || [];

  /* visitors list */
  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    if (debouncedSearch) p.q = debouncedSearch;
    if (fromDate) p.from = fromDate;
    if (toDate)   p.to = toDate;
    // "Needs follow-up" = a reminder is set (reminder_date not null); "No
    // follow-up" = no reminder. Uses the repo's has_reminder filter so it
    // matches the bell/reminder system rather than the legacy boolean.
    if (followUpRequired !== "") p["filters[has_reminder]"] = followUpRequired;
    // F4b universal filters
    if (section)  p["filters[section]"] = section;
    if (status)   p["filters[status]"]  = status;
    if (sourceFilter) p["filters[referral_source]"] = sourceFilter;
    return p;
  }, [page, perPage, debouncedSearch, section, status, sourceFilter, fromDate, toDate, followUpRequired]);

  // reset to page 1 when filters/search change
  useEffect(() => { setPage(1); }, [debouncedSearch, section, status, sourceFilter, fromDate, toDate, followUpRequired]);

  const { data, error, isLoading, isFetching, refetch } = useGetQuery(
    { path: "/student/visitors", params: queryParams },
    { refetchOnMountOrArgChange: true }
  );

  const [createVisitor, { isLoading: creating }] = usePostMutation();
  const [updateVisitor, { isLoading: updating }] = usePatchMutation();
  const [deleteVisitor, { isLoading: deleting }] = useDeleteMutation();
  const [markColdPost, { isLoading: marking }]    = usePostMutation();
  const [reminderPatch, { isLoading: scheduling }] = usePatchMutation();
  const [convertPost, { isLoading: converting }]  = usePostMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0,
  };

  /* client-side sort over the page */
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

  const openAdd = () => setFormModal({ open: true, mode: "add", visitor: null });
  const openEdit = (v) => setFormModal({ open: true, mode: "edit", visitor: v });
  const closeForm = () => setFormModal({ open: false, mode: null, visitor: null });
  const openDelete = (v) => setDeleteDialog({ open: true, visitor: v });
  const closeDelete = () => setDeleteDialog({ open: false, visitor: null });
  const openCold = (v) => setColdDialog({ open: true, visitor: v });
  const closeCold = () => setColdDialog({ open: false, visitor: null });
  const openReminder = (v) => setReminderDialog({ open: true, visitor: v });
  const closeReminder = () => setReminderDialog({ open: false, visitor: null });
  const openConvert = (v, target) => setConvertDialog({ open: true, visitor: v, target });
  const closeConvert = () => setConvertDialog({ open: false, visitor: null, target: null });

  const handleSubmitForm = async (payload) => {
    try {
      if (formModal.mode === "edit") {
        await updateVisitor({
          path: `/student/visitors/${formModal.visitor.id}`,
          body: payload,
        }).unwrap();
        showToast("Visitor updated", "success");
      } else {
        await createVisitor({
          path: "/student/visitors",
          body: payload,
        }).unwrap();
        showToast("Visitor logged", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      const errors = err?.data?.errors || {};
      const firstFieldError = Object.values(errors)[0]?.[0];
      const msg = firstFieldError || err?.data?.message || "Could not save visitor.";
      return { error: msg };
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteVisitor({ path: `/student/visitors/${deleteDialog.visitor.id}` }).unwrap();
      showToast("Visitor deleted", "success");
      closeDelete();
      if (visibleRows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      showToast(err?.data?.message || "Failed to delete.", "error");
    }
  };

  const handleConfirmCold = async (reason) => {
    try {
      await markColdPost({
        path: `/student/visitors/${coldDialog.visitor.id}/mark-cold`,
        body: { cold_reason: reason },
      }).unwrap();
      showToast("Marked as cold", "success");
      closeCold();
      return { error: null };
    } catch (err) {
      return { error: err?.data?.message || "Could not mark cold." };
    }
  };

  const handleConfirmReminder = async (payload) => {
    try {
      await reminderPatch({
        path: `/student/visitors/${reminderDialog.visitor.id}/reminder`,
        body: payload,
      }).unwrap();
      showToast("Reminder updated", "success");
      closeReminder();
      return { error: null };
    } catch (err) {
      return { error: err?.data?.message || "Could not update reminder." };
    }
  };

  /**
   * Conversion is now form-driven rather than a single-click API call.
   * The visitor only carries the bare minimum (name, contact, email,
   * interested course); the inquiry and student records require the
   * full intake form. Routing to the form with prefill data is the
   * cleanest UX — the admin sees the captured fields, fills the rest,
   * then submits.
   */
  const handleConfirmConvert = async () => {
    if (!convertDialog.visitor || !convertDialog.target) return;
    const v = convertDialog.visitor;

    // Visitor → Inquiry: hop into the inquiry create page with whatever
    // we already know prefilled. The form treats prefill as a starting
    // point; admin can still edit before saving.
    if (convertDialog.target === "inquiry") {
      const [firstName, ...rest] = (v.name || "").trim().split(/\s+/);
      const prefill = {
        first_name:           firstName || "",
        last_name:            rest.join(" "),
        email:                v.email || "",
        phone_number:         v.contact || "",
        primary_course_id:    v.interested_course?.id ? String(v.interested_course.id) : "",
        // Stamp the source so the inquiry form can flag this as a
        // converted-from-visitor record if it wants to.
        _source_visitor_id:   v.id,
      };
      closeConvert();
      navigate(TRAINING_INQUIRY_CREATE, { state: { prefill } });
      return;
    }

    // Visitor → Student: drop into the enrol-student page. The existing
    // ENROLL_STUDENT page accepts whatever the user types; full prefill
    // wiring belongs to its own ticket (would mirror the inquiry-prefill
    // approach above).
    // Visitor → Student: auto-convert the visitor into an inquiry first,
    // then open the SAME enrollment dialog (batch + fee + hostelite + laptop).
    if (convertDialog.target === "student") {
      try {
        let inquiryId = v.converted_to_inquiry_id || null;
        if (!inquiryId) {
          try {
            const res = await convertPost({ path: `/student/visitors/${v.id}/convert`, body: {} }).unwrap();
            inquiryId = res?.inquiry_id || res?.data?.inquiry_id || null;
          } catch (err) {
            inquiryId = err?.data?.inquiry_id || null; // already-converted (409) returns the inquiry id
            if (!inquiryId) { showToast(err?.data?.message || "Could not convert visitor.", "error"); return; }
          }
        }
        if (!inquiryId) { showToast("Could not convert visitor.", "error"); return; }
        closeConvert();
        navigate(STUDENT_ENROLL.replace(":id", inquiryId));
      } catch (e) {
        showToast(e?.data?.message || "Could not start enrollment.", "error");
      }
      return;
    }
  };


  const [reportOpen, setReportOpen] = useState(false);
  const hasActiveFilters = !!(section || status || fromDate || toDate || followUpRequired !== "" || debouncedSearch);
  const clearFilters = () => {
    setSection(""); setStatus(""); setSourceFilter(""); setFromDate(""); setToDate("");
    setFollowUpRequired(""); setSearch("");
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
            <UserSearch size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              Visitors
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Reception log — track walk-ins, follow-ups, and conversions
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button" onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)",
            }}
          >
            <Plus size={15} strokeWidth={2.25} />
            Log Visitor
          </button>
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
            placeholder="Search by name, contact, email or IG…"
            className="w-full py-2 pl-9 pr-9 text-sm transition rounded-lg outline-none"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
            onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
            onBlur={(e) => { e.currentTarget.style.background = SURFACE_HOVER; e.currentTarget.style.borderColor = BORDER; }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute -translate-y-1/2 right-2 top-1/2" style={{ color: TEXT_MUTED }} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Section */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "All" },
            { v: "tech_school", l: "Tech School" },
            { v: "it_solutions", l: "IT Solutions" },
            { v: "other", l: "Other" },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => setSection(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: section === o.v ? "#fff" : TEXT_SECONDARY, background: section === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

        {/* Status */}
        <select
          value={status} onChange={(e) => setStatus(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm transition rounded-lg outline-none cursor-pointer"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
        >
          <option value="">Any status</option>
          {Object.entries(STATUS_CFG).map(([k, c]) => (
            <option key={k} value={k}>{c.label}</option>
          ))}
        </select>

        {/* Source */}
        <select
          value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="py-2 pl-3 pr-8 text-sm transition rounded-lg outline-none cursor-pointer"
          style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" }}
        >
          <option value="">Any source</option>
          <option value="website">Website</option>
          <option value="walk_in">Walk-in</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="referral_friend">Referral (friend)</option>
          <option value="referral_employee">Referral (employee)</option>
          <option value="google_ads">Google Ads</option>
          <option value="other">Other</option>
        </select>

        {/* Dates */}
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

        {/* Follow-up required */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any" },
            { v: "true",  l: "Needs follow-up" },
            { v: "false", l: "No follow-up" },
          ].map((o) => (
            <button key={o.v} type="button" onClick={() => setFollowUpRequired(o.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: followUpRequired === o.v ? "#fff" : TEXT_SECONDARY, background: followUpRequired === o.v ? BRAND_RED : "transparent" }}
            >{o.l}</button>
          ))}
        </div>

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
                <th className="px-4 py-3 text-left"><SortHeader label="Name" field="name" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Contact</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Section</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Purpose</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Visited" field="visit_date" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Interested in</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Status</span>
                </th>
                <th className="px-4 py-3 text-right" style={{ width: 200 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2, 3].map((i) => (
                <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[40, 140, 110, 100, 110, 70, 110, 70, 130].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && error && (
                <tr><td colSpan={9} className="px-5 py-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <AlertTriangle size={14} />
                    <span className="text-sm font-semibold">Couldn't load visitors. Please try again.</span>
                  </div>
                </td></tr>
              )}

              {isEmpty && (
                <tr><td colSpan={9} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <UserSearch size={22} />
                  </div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                    {hasActiveFilters ? "No visitors match these filters" : "No visitors logged yet"}
                  </div>
                  <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                    {hasActiveFilters ? "Try clearing filters or search." : "Walk-ins, calls and chat enquiries get logged here."}
                  </div>
                  {!hasActiveFilters && canCreate && (
                    <button type="button" onClick={openAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                      style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
                    >
                      <Plus size={14} />
                      Log first visitor
                    </button>
                  )}
                </td></tr>
              )}

              {!isLoading && !error && visibleRows.map((v, i) => {
                const indexOnPage = (pagination.from || 1) + i;
                const isCold = v.status === "cold";
                const isConverted = v.status === "converted_to_inquiry" || v.status === "converted_to_student";
                return (
                  <tr key={v.id}
                    onClick={() => canUpdate && openEdit(v)}
                    style={{ borderTop: `1px solid ${BORDER}`, cursor: canUpdate ? "pointer" : "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{indexOnPage}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{v.name}</div>
                      {v.email && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px]" style={{ color: TEXT_MUTED }}>
                          <Mail size={10} strokeWidth={2} />
                          {v.email}
                        </div>
                      )}
                      <ChallanStatusBadge row={v} onClick={() => setChallanLog({ open: true, id: v.id, name: v.name })} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm" style={{ color: TEXT_PRIMARY }}>
                        <Phone size={12} strokeWidth={2} style={{ color: TEXT_MUTED }} />
                        {v.contact}
                      </div>
                    </td>
                    <td className="px-4 py-3"><SectionPill section={v.section} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>
                      {v.visit_purpose?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_PRIMARY }}>
                      {v.visit_date ? new Date(v.visit_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>
                      {v.interested_course?.name || "—"}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={v.status || "pending"} /></td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {canUpdate && !isConverted && (
                          <button type="button" onClick={() => openReminder(v)} title="Update reminder"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#FFFBEB"; e.currentTarget.style.color = "#B45309"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Bell size={13} strokeWidth={2} /></button>
                        )}
                        {canConvertToInquiry && !isConverted && !isCold && (
                          <button type="button" onClick={() => openConvert(v, "inquiry")} title="Convert to inquiry"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F3FF"; e.currentTarget.style.color = "#7C3AED"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><ArrowRightCircle size={13} strokeWidth={2} /></button>
                        )}
                        {!isConverted && !isCold && (
                          <button type="button" onClick={() => setChallanDialog({ open: true, visitor: v, mode: "send" })} title="Send course challan (email / WhatsApp)"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = BRAND_RED; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Receipt size={13} strokeWidth={2} /></button>
                        )}
                        {!isConverted && !isCold && (
                          <button type="button" onClick={() => setChallanDialog({ open: true, visitor: v, mode: "download" })} title="Download course challan PDF"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#1D4ED8"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><FileText size={13} strokeWidth={2} /></button>
                        )}
                        {canConvertToStudent && !isConverted && !isCold && (
                          <button type="button" onClick={() => openConvert(v, "student")} title="Convert to student"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.color = "#15803D"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><GraduationCap size={13} strokeWidth={2} /></button>
                        )}
                        {canMarkCold && !isCold && !isConverted && (
                          <button type="button" onClick={() => openCold(v)} title="Mark as cold"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.color = "#1D4ED8"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Snowflake size={13} strokeWidth={2} /></button>
                        )}
                        {canUpdate && (
                          <button type="button" onClick={() => openEdit(v)} title="Edit"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Pencil size={13} strokeWidth={2} /></button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => openDelete(v)} title="Delete"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 28, height: 28, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.color = BRAND_RED; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Trash2 size={13} strokeWidth={2} /></button>
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

      {/* Modals + dialogs */}
      <VisitorModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialVisitor={formModal.visitor}
        purposes={purposes}
        courses={courses}
        referrerUsers={referrerUsers}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        isLoading={creating || updating}
      />
      <DeleteVisitorDialog
        open={deleteDialog.open}
        visitor={deleteDialog.visitor}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
      <MarkColdDialog
        open={coldDialog.open}
        visitor={coldDialog.visitor}
        onCancel={closeCold}
        onConfirm={handleConfirmCold}
        isLoading={marking}
      />
      <UpdateReminderDialog
        open={reminderDialog.open}
        visitor={reminderDialog.visitor}
        onCancel={closeReminder}
        onConfirm={handleConfirmReminder}
        isLoading={scheduling}
      />

      <ConvertDialog
        open={convertDialog.open}
        visitor={convertDialog.visitor}
        target={convertDialog.target}
        onCancel={closeConvert}
        onConfirm={handleConfirmConvert}
        isLoading={converting}
      />
      {challanDialog.open && (
        <SendChallanDialog
          visitor={challanDialog.visitor}
          courses={courses}
          mode={challanDialog.mode}
          onClose={() => setChallanDialog({ open: false, visitor: null, mode: "send" })}
          onSent={() => setChallanDialog({ open: false, visitor: null, mode: "send" })}
        />
      )}
      <ChallanHistoryModal
        open={challanLog.open}
        type="visitor"
        id={challanLog.id}
        name={challanLog.name}
        onClose={() => setChallanLog({ open: false, id: null, name: "" })}
      />
      <ReportModal
        open={reportOpen} onClose={() => setReportOpen(false)}
        title="Download Visitors Report" path="/student/visitors" filenameBase="visitors"
        initialValues={{ status, source: sourceFilter, from: fromDate, to: toDate }}
        fields={[
          { type: "select", key: "status", label: "Status", options: [{ value: "", label: "Any status" }, { value: "pending", label: "Pending" }, { value: "cold", label: "Cold" }, { value: "converted_to_inquiry", label: "Converted to inquiry" }, { value: "converted_to_student", label: "Converted to student" }] },
          { type: "select", key: "source", label: "Source", options: [{ value: "", label: "Any source" }, { value: "website", label: "Website" }, { value: "walk_in", label: "Walk-in" }, { value: "call", label: "Call" }] },
          { type: "date", key: "from", label: "From date" },
          { type: "date", key: "to", label: "To date" },
        ]}
        buildParams={(v) => {
          const p = {};
          if (v.status) p["filters[status]"] = v.status;
          if (v.source) p["filters[referral_source]"] = v.source;
          if (v.from) p.from = v.from;
          if (v.to) p.to = v.to;
          return p;
        }}
        columns={[
          { label: "Name", key: "name" },
          { label: "Phone", key: "contact" },
          { label: "Email", key: "email" },
          { label: "Course", map: (r) => r.interested_course?.name || "" },
          { label: "Status", key: "status" },
          { label: "Source", map: (r) => r.referral_source_label || r.referral_source || "" },
          { label: "Referred by", map: (r) => r.referrer?.name || (r.referral_note ? `(${r.referral_note})` : "") },
          { label: "Instagram", key: "instagram_handle" },
          { label: "Notes", key: "notes" },
          { label: "Date", map: (r) => (r.visit_date || r.created_at || "").slice(0, 10) },
        ]}
      />
    </div>
  );
};

export default VisitorsComponent;
