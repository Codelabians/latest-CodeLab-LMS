import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Pencil, Trash2, Layers,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, AlertTriangle, Loader2, X,
  Users, CalendarCheck, Monitor, MapPin, Globe2,
  Clock,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SearchableSelect from "../ui/SearchableSelect";
import BatchModal from "./components/BatchModal";
import MergeBatchModal from "./components/MergeBatchModal";
import SimplePagination from "../ui/SimplePagination";
import { GitMerge, Undo2, GraduationCap } from "lucide-react";

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

/* ───────────────── small bits ───────────────── */
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

const ModePill = ({ mode }) => {
  const cfg =
    mode === "online" ? { fg: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", Icon: Monitor, label: "Online" } :
    mode === "in_person" ? { fg: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", Icon: MapPin, label: "In person" } :
    mode === "hybrid" ? { fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", Icon: Globe2, label: "Hybrid" } :
    { fg: TEXT_SECONDARY, bg: "#F1F5F9", border: BORDER, Icon: Globe2, label: mode || "—" };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold rounded-full"
      style={{ color: cfg.fg, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <cfg.Icon size={11} strokeWidth={2.2} />
      {cfg.label}
    </span>
  );
};

const TimeSlotPill = ({ slot }) => {
  if (!slot) return null;
  const label = String(slot).charAt(0).toUpperCase() + String(slot).slice(1);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md"
      style={{ color: TEXT_SECONDARY, background: "#F1F5F9" }}
    >
      <Clock size={10} strokeWidth={2.2} />
      {label}
    </span>
  );
};

/* ───────────────── delete dialog ───────────────── */
const DeleteBatchDialog = ({ open, batch, onCancel, onConfirm, isLoading }) => {
  if (!open || !batch) return null;
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
          Delete &ldquo;{batch.name}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This batch has{" "}
          <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>
            {batch.students_count ?? 0} student{(batch.students_count ?? 0) === 1 ? "" : "s"}
          </span>
          . Deleting cannot be undone.
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
            {isLoading ? (<><Loader2 size={14} className="mr-1.5 animate-spin" />Deleting…</>) : "Delete batch"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────── main component ───────────────────── */
const BatchesComponent = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  /* state */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState({ field: null, dir: "asc" });

  // filters
  const [courseUuid, setCourseUuid] = useState("");
  const [teacherId, setTeacherId]   = useState("");
  const [mode, setMode]             = useState("");
  const [timeSlot, setTimeSlot]     = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "1", "0"

  const [deleteDialog, setDeleteDialog] = useState({ open: false, batch: null });
  const [formModal, setFormModal] = useState({ open: false, mode: null, batch: null });
  const [mergeModal, setMergeModal] = useState({ open: false, batch: null });

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  /* permissions */
  const canCreate = hasPermission(user, "create batch");
  const canUpdate = hasPermission(user, "update batch");
  const canDelete = hasPermission(user, "delete batch");

  /* lookup queries — courses + teachers (for filter dropdowns) */
  const { data: coursesData } = useGetQuery({
    path: "/course/courses",
    params: { per_page: 100 },
  });
  const courses = coursesData?.data || [];

  const { data: teachersData } = useGetQuery({
    path: "/course/teachers",
  });
  const teachers = teachersData?.data || [];

  const { data: hallsData } = useGetQuery({
    path: "/course/halls",
  });
  const halls = hallsData?.data || [];

  /* batches list */
  const queryParams = useMemo(() => {
    const p = { per_page: perPage, page };
    // Course filter: the batches query reads getCourseId() which is the
    // `course_id` query param. The repo accepts a course UUID or integer id.
    if (courseUuid) p.course_id = courseUuid;
    if (teacherId) p.teacher_id = teacherId;
    if (mode) p.mode = mode;
    if (timeSlot) p.availability = timeSlot; // FilterDTO::getAvailability is what the batch repo reads for time_slot
    if (activeFilter !== "") p.active_status = activeFilter;
    return p;
  }, [page, perPage, courseUuid, teacherId, mode, timeSlot, activeFilter]);

  // reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [courseUuid, teacherId, mode, timeSlot, activeFilter, debouncedSearch]);

  const { data, error, isLoading, isFetching } = useGetQuery(
    { path: "/course/batches", params: queryParams },
    { refetchOnMountOrArgChange: true }
  );

  const [deleteBatch, { isLoading: deleting }] = useDeleteMutation();
  const [createBatch, { isLoading: creating }] = usePostMutation();
  const [updateBatch, { isLoading: updating }] = usePatchMutation();
  const [mergePost,   { isLoading: merging }]  = usePostMutation();
  const [unmergePost, { isLoading: unmerging }] = usePostMutation();
  const [completePost, { isLoading: completing }] = usePostMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0, current_page: 1, last_page: 1, per_page: perPage, from: 0, to: 0,
  };

  /* client-side: name/course/teacher search + sort */
  const visibleRows = useMemo(() => {
    let list = rows;
    const s = debouncedSearch.toLowerCase();
    if (s) {
      list = list.filter((b) =>
        (b.name || "").toLowerCase().includes(s) ||
        (b.course_name || "").toLowerCase().includes(s) ||
        (b.teacher_name || "").toLowerCase().includes(s)
      );
    }
    if (sort.field) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const va = a[sort.field]; const vb = b[sort.field];
        if (typeof va === "string") return va.localeCompare(vb || "") * dir;
        return ((va ?? 0) - (vb ?? 0)) * dir;
      });
    }
    return list;
  }, [rows, debouncedSearch, sort]);

  /* handlers */
  const handleSort = (field) =>
    setSort((p) =>
      p.field !== field ? { field, dir: "asc" } :
      p.dir === "asc" ? { field, dir: "desc" } :
      { field: null, dir: "asc" }
    );

  const openDelete = (b) => setDeleteDialog({ open: true, batch: b });
  const closeDelete = () => setDeleteDialog({ open: false, batch: null });

  const handleConfirmDelete = async () => {
    try {
      await deleteBatch({ path: `/course/batch/${deleteDialog.batch.batch_uuid}` }).unwrap();
      showToast("Batch deleted", "success");
      closeDelete();
      if (visibleRows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete batch.";
      showToast(msg, "error");
    }
  };

  const handleRowClick = (b) => navigate(`/dashboard/students?batch_id=${b.batch_uuid}&batch_name=${encodeURIComponent(b.name || b.batch_name || "")}`);
  const handleEdit = (b) => setFormModal({ open: true, mode: "edit", batch: b });
  const openAdd = () => setFormModal({ open: true, mode: "add", batch: null });
  const closeForm = () => setFormModal({ open: false, mode: null, batch: null });

  const openMerge = (b) => setMergeModal({ open: true, batch: b });
  const closeMerge = () => setMergeModal({ open: false, batch: null });

  const handleConfirmMerge = async (targetUuid) => {
    try {
      await mergePost({
        path: `/course/batch/${mergeModal.batch.batch_uuid}/merge`,
        body: { target_batch_uuid: targetUuid },
      }).unwrap();
      showToast("Batch merged", "success");
      closeMerge();
      return { error: null };
    } catch (err) {
      const msg = err?.data?.message || "Could not merge batch.";
      return { error: msg };
    }
  };

  // Batch finished its course: students are recorded as course-completed
  // (never dropout), monthly billing stops, and the batch closes.
  const handleComplete = async (b) => {
    if (!window.confirm(
      `Mark "${b.name}" as COMPLETED?\n\nAll its current students will be recorded as having completed the course (not dropout), their monthly billing for this batch stops, and the batch becomes inactive. Students with no other active batch become alumni.`
    )) return;
    try {
      const res = await completePost({ path: `/course/batch/${b.batch_uuid}/complete`, body: {} }).unwrap();
      showToast(res?.message || "Batch marked completed.", "success");
    } catch (err) {
      showToast(err?.data?.message || "Could not mark the batch completed.", "error");
    }
  };

  const handleUnmerge = async (b) => {
    try {
      await unmergePost({
        path: `/course/batch/${b.batch_uuid}/unmerge`,
        body: {},
      }).unwrap();
      showToast("Batch un-merged", "success");
    } catch (err) {
      const msg = err?.data?.message || "Could not un-merge.";
      showToast(msg, "error");
    }
  };

  // Eligible merge targets — same course, not the source, not itself merged.
  const mergeCandidates = useMemo(() => {
    if (!mergeModal.batch) return [];
    return rows.filter((b) =>
      b.batch_uuid !== mergeModal.batch.batch_uuid &&
      b.course_id === mergeModal.batch.course_id &&
      !b.is_merged
    );
  }, [rows, mergeModal.batch]);

  const handleSubmitForm = async (payload) => {
    try {
      if (formModal.mode === "edit") {
        await updateBatch({
          path: `/course/batch/${formModal.batch.batch_uuid}`,
          body: payload,
        }).unwrap();
        showToast("Batch updated", "success");
      } else {
        await createBatch({
          path: "/course/batch/create",
          body: payload,
        }).unwrap();
        showToast("Batch created", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      const errors = err?.data?.errors || {};
      const firstFieldError = Object.values(errors)[0]?.[0];
      const msg = firstFieldError || err?.data?.message || "Could not save batch.";
      return { error: msg };
    }
  };

  /* derived */
  const isEmpty = !isLoading && !error && rows.length === 0;
  const isFilteredEmpty = !isLoading && !error && rows.length > 0 && visibleRows.length === 0;
  const hasActiveFilters = !!(courseUuid || teacherId || mode || timeSlot || activeFilter !== "" || debouncedSearch);

  const clearFilters = () => {
    setCourseUuid(""); setTeacherId(""); setMode(""); setTimeSlot("");
    setActiveFilter(""); setSearch("");
  };

  /* options for searchable selects — single-line labels for a clean dropdown */
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.uuid, label: c.name })),
    [courses]
  );
  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: String(t.id), label: t.name || t.first_name || t.email })),
    [teachers]
  );

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
            <Layers size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              Batches
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Cohorts of students learning together — manage teacher, mode, timing and capacity
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
            Add Batch
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
            placeholder="Search batches by name, course or teacher…"
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

        {/* Course (searchable) */}
        <SearchableSelect
          options={courseOptions}
          value={courseUuid}
          onChange={(v) => setCourseUuid(v || "")}
          placeholder="All courses"
          compact
          minWidth={200}
        />

        {/* Teacher (searchable) */}
        <SearchableSelect
          options={teacherOptions}
          value={teacherId}
          onChange={(v) => setTeacherId(v || "")}
          placeholder={teachers.length ? "All teachers" : "No teachers yet"}
          compact
          minWidth={180}
        />

        {/* Mode segmented */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any mode" },
            { v: "online", l: "Online" },
            { v: "in_person", l: "In person" },
            { v: "hybrid", l: "Hybrid" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setMode(opt.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: mode === opt.v ? "#fff" : TEXT_SECONDARY, background: mode === opt.v ? BRAND_RED : "transparent" }}
            >{opt.l}</button>
          ))}
        </div>

        {/* Time slot segmented */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "Any time" },
            { v: "morning", l: "Morning" },
            { v: "noon", l: "Noon" },
            { v: "evening", l: "Evening" },
            { v: "night", l: "Night" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setTimeSlot(opt.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: timeSlot === opt.v ? "#fff" : TEXT_SECONDARY, background: timeSlot === opt.v ? BRAND_RED : "transparent" }}
            >{opt.l}</button>
          ))}
        </div>

        {/* Active toggle */}
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          {[
            { v: "", l: "All" },
            { v: "1", l: "Active" },
            { v: "0", l: "Inactive" },
          ].map((opt) => (
            <button key={opt.v} type="button" onClick={() => setActiveFilter(opt.v)}
              className="px-3 py-1 text-xs font-semibold transition rounded-md"
              style={{ color: activeFilter === opt.v ? "#fff" : TEXT_SECONDARY, background: activeFilter === opt.v ? BRAND_RED : "transparent" }}
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
          <table className="w-full" style={{ minWidth: 1100 }}>
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                <th className="px-4 py-3 text-left" style={{ width: 48 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>#</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Batch" field="name" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left"><SortHeader label="Course" field="course_name" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left"><SortHeader label="Teacher" field="teacher_name" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Mode</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Date" field="date" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Timing</span>
                </th>
                <th className="px-4 py-3 text-left"><SortHeader label="Students" field="students_count" sort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left">
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Status</span>
                </th>
                <th className="px-4 py-3 text-right" style={{ width: 100 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SECONDARY }}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0, 1, 2, 3].map((i) => (
                <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {[40, 140, 120, 110, 80, 70, 100, 60, 60, 70].map((w, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="rounded animate-pulse" style={{ height: 12, width: w, background: "#E2E8F0" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && error && (
                <tr><td colSpan={10} className="px-5 py-10 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <AlertTriangle size={14} />
                    <span className="text-sm font-semibold">Couldn't load batches. Please try again.</span>
                  </div>
                </td></tr>
              )}

              {isEmpty && (
                <tr><td colSpan={10} className="px-5 py-16 text-center">
                  <div className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
                    <Layers size={22} />
                  </div>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                    {hasActiveFilters ? "No batches match these filters" : "No batches yet"}
                  </div>
                  <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                    {hasActiveFilters ? "Try clearing filters or search." : "Create your first batch to enrol students into a course."}
                  </div>
                  {!hasActiveFilters && canCreate && (
                    <button type="button" onClick={openAdd}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                      style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}
                    >
                      <Plus size={14} />
                      Create Batch
                    </button>
                  )}
                </td></tr>
              )}

              {isFilteredEmpty && (
                <tr><td colSpan={10} className="px-5 py-12 text-center">
                  <div className="text-[13px]" style={{ color: TEXT_MUTED }}>
                    No batches match &ldquo;{debouncedSearch}&rdquo; on this page.
                  </div>
                </td></tr>
              )}

              {!isLoading && !error && visibleRows.map((b, i) => {
                const indexOnPage = (pagination.from || 1) + i;
                return (
                  <tr key={b.batch_uuid}
                    onClick={() => handleRowClick(b)}
                    style={{ borderTop: `1px solid ${BORDER}`, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_MUTED }}>{indexOnPage}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                        {b.name}
                      </div>
                      {b.duration && (
                        <div className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>{b.duration}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>{b.course_name || "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>{b.teacher_name || "—"}</td>
                    <td className="px-4 py-3"><ModePill mode={b.mode} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: TEXT_PRIMARY }}>{b.date || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <TimeSlotPill slot={b.time_slot} />
                        {b.timing && (
                          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{b.timing}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[12px] font-semibold rounded-md"
                        style={{ color: "#15803D", background: "#F0FDF4" }}
                        title="Current students (dropouts excluded)"
                      >
                        <Users size={11} strokeWidth={2.2} />
                        {b.students_count ?? 0}
                      </span>
                      {(b.dropout_students_count ?? 0) > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 ml-1.5 text-[11px] font-semibold rounded-md"
                          style={{ color: BRAND_RED, background: BRAND_RED_TINT }}
                          title="Dropped-out students"
                        >
                          {b.dropout_students_count} dropout
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.is_merged ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-semibold rounded-full"
                          style={{ color: BRAND_RED, background: BRAND_RED_TINT, border: "1px solid #FECACA" }}
                          title={`Merged into ${b.merged_into_batch_name || "another batch"}`}
                        >
                          <GitMerge size={11} strokeWidth={2.2} />
                          Merged
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-semibold rounded-full"
                          style={{
                            color: b.is_active ? "#15803D" : TEXT_SECONDARY,
                            background: b.is_active ? "#F0FDF4" : "#F1F5F9",
                            border: `1px solid ${b.is_active ? "#BBF7D0" : BORDER}`,
                          }}
                        >
                          <span
                            className="inline-block rounded-full"
                            style={{ width: 6, height: 6, background: b.is_active ? "#15803D" : "#94A3B8" }}
                          />
                          {b.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                      {b.is_merged && b.merged_into_batch_name && (
                        <div className="text-[10.5px] mt-1" style={{ color: TEXT_MUTED }}>
                          → {b.merged_into_batch_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {/* Batch completed — students become course-completed, NOT dropout */}
                        {canUpdate && !b.is_merged && b.is_active && (
                          <button type="button" onClick={() => handleComplete(b)} title="Mark batch completed — its students are recorded as course-completed (not dropout)"
                            disabled={completing}
                            className="flex items-center justify-center transition rounded-md disabled:opacity-50"
                            style={{ width: 30, height: 30, color: "#15803D", background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          ><GraduationCap size={14} strokeWidth={2} /></button>
                        )}
                        {/* Merge / Un-merge — visible to anyone with update batch */}
                        {canUpdate && !b.is_merged && (
                          <button type="button" onClick={() => openMerge(b)} title="Merge batch"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_RED_TINT; e.currentTarget.style.color = BRAND_RED; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><GitMerge size={14} strokeWidth={2} /></button>
                        )}
                        {canUpdate && b.is_merged && (
                          <button type="button" onClick={() => handleUnmerge(b)} title={`Un-merge from ${b.merged_into_batch_name || "target"}`}
                            disabled={unmerging}
                            className="flex items-center justify-center transition rounded-md disabled:opacity-50"
                            style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Undo2 size={14} strokeWidth={2} /></button>
                        )}
                        {canUpdate && !b.is_merged && (
                          <button type="button" onClick={() => handleEdit(b)} title="Edit batch"
                            className="flex items-center justify-center transition rounded-md"
                            style={{ width: 30, height: 30, color: TEXT_SECONDARY, background: "transparent" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; e.currentTarget.style.color = TEXT_PRIMARY; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TEXT_SECONDARY; }}
                          ><Pencil size={14} strokeWidth={2} /></button>
                        )}
                        {canDelete && !b.is_merged && (
                          <button type="button" onClick={() => openDelete(b)} title="Delete batch"
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

      <DeleteBatchDialog
        open={deleteDialog.open}
        batch={deleteDialog.batch}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />

      <BatchModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialBatch={formModal.batch}
        courses={courses}
        teachers={teachers}
        halls={halls}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        isLoading={creating || updating}
      />

      <MergeBatchModal
        isOpen={mergeModal.open}
        source={mergeModal.batch}
        candidates={mergeCandidates}
        onCancel={closeMerge}
        onConfirm={handleConfirmMerge}
        isLoading={merging}
      />
    </div>
  );
};

export default BatchesComponent;
