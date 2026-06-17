import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import {
  useGetQuery,
  usePostMutation,
  usePatchMutation,
  useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { COURSES } from "../routes/RouteConstants";
import { showToast } from "../ui/common/ShowToast";
import CategoryFormModal from "./AddCategory";
import SimplePagination from "../ui/SimplePagination";

/* ───────────────────────── brand tokens ───────────────────────── */
const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

/* ───────────────── permission helper ───────────────── */
const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

/* ───────────────── delete confirm dialog ───────────────── */
const DeleteCategoryDialog = ({ open, category, onCancel, onConfirm, isLoading }) => {
  if (!open || !category) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full"
          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
        >
          <AlertTriangle size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-center" style={{ color: TEXT_PRIMARY }}>
          Delete &ldquo;{category.name}&rdquo;?
        </h3>
        <p className="mt-2 text-sm text-center" style={{ color: TEXT_SECONDARY }}>
          This category contains{" "}
          <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>
            {category.course_count} course{category.course_count === 1 ? "" : "s"}
          </span>
          . Deleting the category will also delete every course inside it. This cannot be undone.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="py-2.5 text-sm font-semibold transition rounded-lg disabled:opacity-60"
            style={{ color: TEXT_PRIMARY, background: "#F1F5F9" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center justify-center py-2.5 text-sm font-semibold text-white transition rounded-lg disabled:opacity-60"
            style={{ background: BRAND_RED }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete category"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── sortable header ───────────────── */
const SortHeader = ({ label, field, sort, onSort }) => {
  const active = sort.field === field;
  const Arrow = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 select-none transition-colors"
      style={{
        color: active ? TEXT_PRIMARY : TEXT_SECONDARY,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontSize: 11,
      }}
    >
      {label}
      <Arrow size={12} strokeWidth={2.25} style={{ color: active ? BRAND_RED : TEXT_MUTED }} />
    </button>
  );
};

/* ───────────────── main component ───────────────── */
const CategoriesComponent = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  /* state */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: null, dir: "asc" });
  const [formModal, setFormModal] = useState({ open: false, mode: null, category: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });

  /* permissions */
  const canCreate = hasPermission(user, "create category");
  const canUpdate = hasPermission(user, "update category");
  const canDelete = hasPermission(user, "delete category");

  /* data */
  const { data, error, isLoading, isFetching } = useGetQuery({
    path: "/course/categories",
    params: { per_page: perPage, page },
  });

  const [createCategory, { isLoading: creating }] = usePostMutation();
  const [updateCategory, { isLoading: updating }] = usePatchMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteMutation();

  const rows = data?.data || [];
  const pagination = data?.meta?.pagination || {
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    from: 0,
    to: 0,
  };

  /* client-side filter + sort over the current page */
  const visibleRows = useMemo(() => {
    let list = rows;
    const s = search.trim().toLowerCase();
    if (s) list = list.filter((c) => (c.name || "").toLowerCase().includes(s));
    if (sort.field) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const va = a[sort.field];
        const vb = b[sort.field];
        if (typeof va === "string") return va.localeCompare(vb) * dir;
        return ((va ?? 0) - (vb ?? 0)) * dir;
      });
    }
    return list;
  }, [rows, search, sort]);

  /* handlers */
  const openAdd = () => setFormModal({ open: true, mode: "add", category: null });
  const openEdit = (category) => setFormModal({ open: true, mode: "edit", category });
  const closeForm = () => setFormModal({ open: false, mode: null, category: null });

  const openDelete = (category) => setDeleteDialog({ open: true, category });
  const closeDelete = () => setDeleteDialog({ open: false, category: null });

  const handleSort = (field) => {
    setSort((prev) => {
      if (prev.field !== field) return { field, dir: "asc" };
      if (prev.dir === "asc") return { field, dir: "desc" };
      return { field: null, dir: "asc" };
    });
  };

  const handleSubmitForm = async (name) => {
    const trimmed = (name || "").trim();
    if (trimmed.length < 3) {
      return { error: "Category name must be at least 3 characters" };
    }
    try {
      if (formModal.mode === "edit") {
        await updateCategory({
          path: `/course/category/${formModal.category.uuid}`,
          body: { name: trimmed },
        }).unwrap();
        showToast("Category updated", "success");
      } else {
        await createCategory({
          path: "/course/category/create",
          body: { name: trimmed },
        }).unwrap();
        showToast("Category created", "success");
      }
      closeForm();
      return { error: null };
    } catch (err) {
      const apiMsg =
        err?.data?.errors?.name?.[0] ||
        err?.data?.message ||
        "Could not save category. Please try again.";
      return { error: apiMsg };
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory({
        path: `/course/category/${deleteDialog.category.uuid}`,
      }).unwrap();
      showToast("Category deleted", "success");
      closeDelete();
      // if we just deleted the last row of a page > 1, step back a page
      if (visibleRows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      const apiMsg = err?.data?.message || "Failed to delete category.";
      showToast(apiMsg, "error");
    }
  };

  const goToCourses = (category) => {
    navigate(`${COURSES}?tab=${encodeURIComponent(category.slug)}`);
  };

  /* derived UI */
  const totalShown = visibleRows.length;
  const isEmpty = !isLoading && !error && rows.length === 0;
  const isFilteredEmpty = !isLoading && !error && rows.length > 0 && visibleRows.length === 0;

  return (
    <div
      className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]"
      style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: BRAND_RED_TINT,
              color: BRAND_RED,
            }}
          >
            <Tag size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
              Course Categories
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
              Organise your courses into categories
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition rounded-lg shadow-sm hover:shadow active:translate-y-px"
            style={{
              background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
              boxShadow: "0 8px 22px -10px rgba(201,6,6,0.45)",
            }}
          >
            <Plus size={15} strokeWidth={2.25} />
            Add Category
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 mb-3 bg-white rounded-xl"
        style={{ border: `1px solid ${BORDER}` }}
      >
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            strokeWidth={2}
            style={{ color: TEXT_MUTED }}
            className="absolute -translate-y-1/2 left-3 top-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name…"
            className="w-full py-2 pl-9 pr-9 text-sm transition rounded-lg outline-none"
            style={{
              background: SURFACE_HOVER,
              border: `1px solid ${BORDER}`,
              color: TEXT_PRIMARY,
              fontFamily: "'Montserrat', sans-serif",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#CBD5E1";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = SURFACE_HOVER;
              e.currentTarget.style.borderColor = BORDER;
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute -translate-y-1/2 right-2 top-1/2"
              style={{ color: TEXT_MUTED }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
          {search ? `${totalShown} shown` : `${pagination.total} total`}
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <tr>
                <th className="px-5 py-3 text-left" style={{ width: 56 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    #
                  </span>
                </th>
                <th className="px-5 py-3 text-left">
                  <SortHeader label="Name" field="name" sort={sort} onSort={handleSort} />
                </th>
                <th className="px-5 py-3 text-left">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Slug
                  </span>
                </th>
                <th className="px-5 py-3 text-left">
                  <SortHeader
                    label="Courses"
                    field="course_count"
                    sort={sort}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-3 text-right" style={{ width: 140 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={`sk-${i}`} style={{ borderTop: `1px solid ${BORDER}` }}>
                    {[60, 200, 120, 60, 120].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div
                          className="rounded animate-pulse"
                          style={{ height: 12, width: w, background: "#E2E8F0" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && error && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
                    >
                      <AlertTriangle size={14} />
                      <span className="text-sm font-semibold">
                        Couldn't load categories. Please try again.
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {isEmpty && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div
                      className="flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-2xl"
                      style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
                    >
                      <Tag size={22} />
                    </div>
                    <div className="text-[14px] font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>
                      No categories yet
                    </div>
                    <div className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                      Create your first category to start organising courses.
                    </div>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
                        }}
                      >
                        <Plus size={14} />
                        Create Category
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {isFilteredEmpty && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="text-[13px]" style={{ color: TEXT_MUTED }}>
                      No categories match &ldquo;{search}&rdquo; on this page.
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                visibleRows.map((cat, i) => {
                  const indexOnPage = (pagination.from || 1) + i;
                  return (
                    <tr
                      key={cat.uuid}
                      style={{ borderTop: `1px solid ${BORDER}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-5 py-3 text-sm" style={{ color: TEXT_MUTED }}>
                        {indexOnPage}
                      </td>
                      <td
                        className="px-5 py-3 text-sm"
                        style={{ color: TEXT_PRIMARY, fontWeight: 600 }}
                      >
                        {cat.name}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: TEXT_SECONDARY }}>
                        <code
                          className="px-2 py-0.5 rounded text-[11.5px]"
                          style={{ background: "#F1F5F9", color: TEXT_SECONDARY }}
                        >
                          {cat.slug}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <button
                          type="button"
                          onClick={() => goToCourses(cat)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition"
                          style={{ background: BRAND_RED_TINT, color: BRAND_RED }}
                          title={`View ${cat.course_count} course${
                            cat.course_count === 1 ? "" : "s"
                          } in ${cat.name}`}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#FECACA")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = BRAND_RED_TINT)}
                        >
                          {cat.course_count} course{cat.course_count === 1 ? "" : "s"}
                          <ChevronRight size={12} strokeWidth={2.5} />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() => openEdit(cat)}
                              title="Edit category"
                              className="flex items-center justify-center transition rounded-md"
                              style={{
                                width: 30,
                                height: 30,
                                color: TEXT_SECONDARY,
                                background: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#F1F5F9";
                                e.currentTarget.style.color = TEXT_PRIMARY;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = TEXT_SECONDARY;
                              }}
                            >
                              <Pencil size={14} strokeWidth={2} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => openDelete(cat)}
                              title="Delete category"
                              className="flex items-center justify-center transition rounded-md"
                              style={{
                                width: 30,
                                height: 30,
                                color: TEXT_SECONDARY,
                                background: "transparent",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = BRAND_RED_TINT;
                                e.currentTarget.style.color = BRAND_RED;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = TEXT_SECONDARY;
                              }}
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
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

      <CategoryFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialName={formModal.category?.name || ""}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        isLoading={creating || updating}
      />

      <DeleteCategoryDialog
        open={deleteDialog.open}
        category={deleteDialog.category}
        onCancel={closeDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
    </div>
  );
};

export default CategoriesComponent;
