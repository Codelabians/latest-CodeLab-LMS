import { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, BookOpen,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, X,
  Users, Award, Heart, CalendarCheck,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { COURSES } from "../routes/RouteConstants";
import { showToast } from "../ui/common/ShowToast";
import CourseModal from "./components/CouuseModal";
import SimplePagination from "../ui/SimplePagination";
import SearchableSelect from "../ui/SearchableSelect";

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

/* ───────────────── tiny components ───────────────── */
const Pill = ({ children, color = "slate", active = false, onClick, title }) => {
  const colors = {
    slate: { fg: TEXT_SECONDARY, bg: "transparent", border: BORDER, hover: "#F1F5F9" },
    red:   { fg: BRAND_RED, bg: BRAND_RED_TINT, border: "#FECACA", hover: "#FECACA" },
    blue:  { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", hover: "#DBEAFE" },
    green: { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", hover: "#DCFCE7" },
    amber: { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", hover: "#FEF3C7" },
  };
  const c = colors[color] || colors.slate;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold transition rounded-full"
      style={{
        color: active ? "#fff" : c.fg,
        background: active ? BRAND_RED : c.bg,
        border: `1px solid ${active ? BRAND_RED : c.border}`,
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => { if (onClick && !active) e.currentTarget.style.background = c.hover; }}
      onMouseLeave={(e) => { if (onClick && !active) e.currentTarget.style.background = c.bg; }}
    >
      {children}
    </button>
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

const StatBadge = ({ icon: Icon, value, color, label }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
    style={{ color: color.fg, background: color.bg }}
    title={`${value} ${label}`}
  >
    <Icon size={11} strokeWidth={2} />
    {value ?? 0}
  </span>
);

/* ───────────────── delete dialog ───────────────── */
const DeleteCourseDialog = ({ open, course, onCancel, onConfirm, isLoading }) => {
  if (!open || !course) return null;
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
          Delete &ldquo;{course.name}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This course currently has{" "}
          <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>
            {course.active_students_count ?? 0} active
          </span>{" "}
          and{" "}
          <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>
            {course.completed_students_count ?? 0} completed
          </span>{" "}
          students. Deleting it cannot be undone.
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
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</>) : "Delete course"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── main component ───────────────────────── */
const CoursesComponent = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* state */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");           // immediate input value
  const [debouncedSearch, setDebouncedSearch] = useState(""); // sent to API
  const [sort, setSort] = useState({ field: null, dir: "asc" });

  // Debounce the search input so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // filters
  const [categoryUuid, setCategoryUuid] = useState("");       // category uuid
  const [statusFilter, setStatusFilter] = useState("");       // basic | advance | ""
  const [hasStudents, setHasStudents] = useState("");         // "true" | "false" | ""
  const [scheduled, setScheduled] = useState("");             // "true" | "false" | ""

  const [formModal, setFormModal] = useState({ open: false, mode: null, course: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, course: null });

  /* permissions */
  const canCreate = hasPermission(user, "create course");
  const canUpdate = hasPermission(user, "update course");
  const canDelete = hasPermission(user, "delete course");

  /* categories — used for filter dropdown + modal */
  const { data: categoriesData } = useGetQuery({
    path: "/course/categories",
    params: { per_page: 100 },
  });
  const categories = categoriesData?.data || [];

  /* sync ?tab=<slug> → category filter on first load and tab change */
  useEffect(() => {
    const tabSlug = searchParams.get("tab");
    if (!tabSlug || !categories.length) return;
    const found = categories.find((c) => c.slug === tabSlug);
    if (found && found.uuid !== categoryUuid) {
      setCategoryUuid(found.uuid);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categories.length]);

  /* keep URL ?tab=... in sync when the user changes the filter */
  useEffect(() => {
    if (!categories.length) return;
    if (!categoryUuid) {
      if (searchParams.get("tab")) {
        const next = new URLSearchParams(searchParams);
        next.delete("tab");
        setSearchParams(next, { replace: true });
      }
      return;
    }
    const cat = categories.find((c) => c.uuid === categoryUuid);
    if (cat && searchParams.get("tab") !== cat.slug) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", cat.slug);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryUuid]);

  /* courses */
  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    if (categoryUuid) p.category_id = categoryUuid;
    if (statusFilter) p.course_status = statusFilter;
    if (hasStudents !== "") p.has_students = hasStudents;
    if (scheduled !== "") p.is_scheduled = scheduled;
    if (debouncedSearch) p.search = debouncedSearch;
    return p;
  }, [page, perPage, categoryUuid, statusFilter, hasStudents, scheduled, debouncedSearch]);

  // reset to page 1 when filters or search change
  useEffect(() => { setPage(1); }, [categoryUuid, statusFilter, hasStudents, scheduled, debouncedSearch]);

  const { data, error, isLoading, isFetching } = useGetQuery(
    { path: "/course/courses", params: queryParams },
    // Always refetch when params (filters / page / search) change.
    // Without this, RTK Query happily serves a stale empty cache from
    // before the backend filter fix went in — manifests as "this one
    // category never shows results" until you hard-reload.
    { refetchOnMountOrArgChange: true }
  );

  const [createCourse, { isLoading: creating }] = usePostMutation();
  const [updateCourse, { isLoading: updating }] = usePatchMutation();
  const [deleteCourse, { isLoading: deleting }] = useDeleteMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0,
  };

  /* server returns search results already filtered; only sort is client-side */
  const visibleRows = useMemo(() => {
    let list = rows;
    if (sort.field) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        let va = a[sort.field], vb = b[sort.field];
        if (sort.field === "monthly_fee" || sort.field === "enrollment_fee") {
          va = parseFloat(va) || 0; vb = parseFloat(vb) || 0;
        }
        if (typeof va === "string") return va.localeCompare(vb) * dir;
        return ((va ?? 0) - (vb ?? 0)) * dir;
      });
    }
    return list;
  }, [rows, sort]);

  /* handlers */
  const openAdd = () => setFormModal({ open: true, mode: "add", course: null });
  const openEdit = (c) => setFormModal({ open: true, mode: "edit", course: c });
  const closeForm = () => setFormModal({ open: false, mode: null, course: null });
  const openDelete = (c) => setDeleteDialog({ open: true, course: c });
  const closeDelete = () => setDeleteDialog({ open: false, course: null });

  const handleSort = (field) =>
    setSort((p) =>
      p.field !== field ? { field, dir: "asc" } :
      p.dir === "asc" ? { field, dir: "desc" } :
      { field: null, dir: "asc" }
    );

  const handleSubmitForm = async (formData) => {
    try {
      if (formModal.mode === "edit") {
        await updateCourse({ path: `/course/${formModal.course.uuid}`, body: formData }).unwrap();
        showToast("Course updated", "success");
      } else {
        await createCourse({ path: "/course/create", body: formData }).unwrap();
        showToast("Course created", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      const errors = err?.data?.errors || {};
      // Surface first error from any field
      const firstFieldError = Object.values(errors)[0]?.[0];
      const msg = firstFieldError || err?.data?.message || "Could not save course.";
      return { error: msg };
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCourse({ path: `/course/${deleteDialog.course.uuid}` }).unwrap();
      showToast("Course deleted", "success");
      closeDelete();
      if (visibleRows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete course.";
      showToast(msg, "error");
    }
  };

  const handleRowClick = (course) => navigate(`/dashboard/courses/${course.uuid}`);

  const isEmpty = !isLoading && !error && rows.length === 0;
  const hasActiveFilters = !!(categoryUuid || statusFilter || hasStudents || scheduled || debouncedSearch);

  const clearFilters = () => {
    setCategoryUuid(""); setStatusFilter(""); setHasStudents(""); setScheduled("");
    setSearch("");
  };

  /* ── render ───────────────────────────────────────────────────── */
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
            <BookOpen size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              Courses
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Manage your course catalogue
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
            Add Course
          </button>
        )}
      </div>

      {/* Filters toolbar */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 mb-3 bg-white rounded-xl"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} strokeWidth={2} style={{ color: TEXT_MUTED }} className="absolute -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
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

        {/* Category dropdown */}
        <div style={{ minWidth: 190 }}>
          <SearchableSelect
            options={categories.map((c) => ({ value: c.uuid, label: c.name }))}
            value={categoryUuid || ""}
            onChange={(v) => setCategoryUuid(v || "")}
            placeholder="All categories" />
        </div>

        {/* Status segmented */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "All" },
            { v: "basic", l: "Basic" },
            { v: "advance", l: "Advance" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setStatusFilter(opt.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{
                color: statusFilter === opt.v ? "#fff" : TEXT_SECONDARY,
                background: statusFilter === opt.v ? BRAND_RED : "transparent",
              }}
            >{opt.l}</button>
          ))}
        </div>

        {/* Has students segmented */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any" },
            { v: "true", l: "With students" },
            { v: "false", l: "Empty" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setHasStudents(opt.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{
                color: hasStudents === opt.v ? "#fff" : TEXT_SECONDARY,
                background: hasStudents === opt.v ? BRAND_RED : "transparent",
              }}
            >{opt.l}</button>
          ))}
        </div>

        {/* Scheduled segmented */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any" },
            { v: "true", l: "Scheduled" },
            { v: "false", l: "Unscheduled" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setScheduled(opt.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{
                color: scheduled === opt.v ? "#fff" : TEXT_SECONDARY,
                background: scheduled === opt.v ? BRAND_RED : "transparent",
              }}
            >{opt.l}</button>
          ))}
        </div>

        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-[12px] font-semibold transition" style={{ color: BRAND_RED }}>
            Clear filters
          </button>
        )}
        <div className="ml-auto text-[12px]" style={{ color: TEXT_MUTED }}>
          {pagination.total} total
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 980 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                <th className="px-4 py-3 text-left" style={{ width: 48 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>#</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Name" field="name" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Category</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Type</span>
                </th>
                <th className="px-4 py-3 text-right"><SortHeader label="Monthly" field="monthly_fee" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-right"><SortHeader label="Enroll" field="enrollment_fee" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Students</span>
                </th>
                <th className="px-4 py-3 text-right" style={{ width: 100 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2, 3].map((i) => (
                <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[40, 180, 100, 70, 70, 70, 140, 80].map((w, j) => (
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
                    <span className="text-sm font-semibold">Couldn't load courses. Please try again.</span>
                  </div>
                </td></tr>
              )}

              {isEmpty && (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <BookOpen size={22} />
                  </div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                    {hasActiveFilters ? "No courses match these filters" : "No courses yet"}
                  </div>
                  <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                    {hasActiveFilters ? "Try clearing filters or search." : "Create your first course to get started."}
                  </div>
                  {!hasActiveFilters && canCreate && (
                    <button type="button" onClick={openAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                      style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
                    >
                      <Plus size={14} />
                      Create Course
                    </button>
                  )}
                </td></tr>
              )}

              {!isLoading && !error && visibleRows.map((c, i) => {
                const indexOnPage = (pagination.from || 1) + i;
                return (
                  <tr key={c.uuid}
                    onClick={() => handleRowClick(c)}
                    style={{ borderTop: `1px solid ${BORDER}`, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{indexOnPage}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                        {c.name}
                        {c.is_scheduled === 1 && (
                          <span title="Scheduled" className="inline-flex items-center ml-1.5" style={{ color: "#15803D" }}>
                            <CalendarCheck size={13} strokeWidth={2.25} />
                          </span>
                        )}
                      </div>
                      {c.course_code && c.course_code !== "N/A" && (
                        <div className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>{c.course_code}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>{c.category}</td>
                    <td className="px-4 py-3">
                      <Pill color={c.course_status === "advance" ? "amber" : "blue"}>
                        {c.course_status_label || (c.course_status === "advance" ? "Advance" : "Basic")}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>
                      Rs. {Number(c.monthly_fee).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>
                      Rs. {Number(c.enrollment_fee).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatBadge icon={Users} value={c.active_students_count} label="active" color={{ fg: "#15803D", bg: "#F0FDF4" }} />
                        <StatBadge icon={Award} value={c.completed_students_count} label="completed" color={{ fg: "#1D4ED8", bg: "#EFF6FF" }} />
                        <StatBadge icon={Heart} value={c.interested_students_count} label="interested" color={{ fg: BRAND_RED, bg: BRAND_RED_TINT }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {canUpdate && (
                          <button type="button" onClick={() => openEdit(c)} title="Edit course"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Pencil size={14} strokeWidth={2} /></button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => openDelete(c)} title="Delete course"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.color = BRAND_RED; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Trash2 size={14} strokeWidth={2} /></button>
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

      {/* Add/Edit modal */}
      <CourseModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialCourse={formModal.course}
        categories={categories}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        isLoading={creating || updating}
      />

      {/* Delete dialog */}
      <DeleteCourseDialog
        open={deleteDialog.open}
        course={deleteDialog.course}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
    </div>
  );
};

export default CoursesComponent;
