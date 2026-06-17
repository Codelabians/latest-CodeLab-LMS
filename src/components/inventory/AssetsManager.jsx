import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Boxes, Plus, Pencil, Trash2, Search, Loader2, X, AlertTriangle,
  PackageCheck, PackageX, Wrench, Archive, ArrowRightLeft,
  Undo2, Tag, MapPin, Layers, BarChart3, Ban,
} from "lucide-react";

import {
  useGetQuery, usePostMutation, usePutMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import SimplePagination from "../ui/SimplePagination";
import SearchableSelect from "../ui/SearchableSelect";

/* ── brand tokens ── */
const RED = "#C90606", RED_TINT = "#FEF2F2";
const T1 = "#0F172A", T2 = "#475569", TM = "#94A3B8", BORDER = "#EEF2F6";
const SURF = "#FFFFFF", SURF2 = "#F8FAFC";

const can = (u, p) => !u ? false : (u.role === "admin" ? true : (u.permissions || []).includes(p));

const STATUS_META = {
  available: { label: "Available", c: "#15803D", bg: "#DCFCE7", b: "#86EFAC", icon: PackageCheck },
  assigned:  { label: "Assigned",  c: "#1D4ED8", bg: "#EFF6FF", b: "#BFDBFE", icon: ArrowRightLeft },
  in_repair: { label: "In Repair", c: "#B45309", bg: "#FEF3C7", b: "#FCD34D", icon: Wrench },
  retired:   { label: "Retired",   c: "#64748B", bg: "#F1F5F9", b: "#E2E8F0", icon: Archive },
  lost:      { label: "Lost",      c: "#B91C1C", bg: "#FEF2F2", b: "#FECACA", icon: PackageX },
};
const GROUPS = [
  { value: "it", label: "IT / Tech" }, { value: "electrical", label: "Electrical" },
  { value: "furniture", label: "Furniture" }, { value: "student_kit", label: "Student Kit" },
  { value: "other", label: "Other" },
];
const CONDITIONS = ["new", "good", "fair", "poor", "damaged"];
const LOCATION_TYPES = ["room", "office", "lab", "store", "other"];

/* ── tiny primitives ── */
const Modal = ({ open, title, icon: Icon, onClose, children, footer, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Montserrat', sans-serif" }} onClick={onClose}>
      <div className="w-full overflow-hidden bg-white shadow-2xl rounded-2xl" style={{ maxWidth: wide ? 640 : 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: RED_TINT, color: RED }}>{Icon && <Icon size={16} />}</div>
            <h3 className="text-[15px] font-bold" style={{ color: T1 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ color: TM }}><X size={16} /></button>
        </div>
        <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ background: SURF2, borderTop: `1px solid ${BORDER}` }}>{footer}</div>}
      </div>
    </div>
  );
};
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, outline: "none", color: T1 };
const Field = ({ label, children, required }) => (
  <div className="mb-3">
    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T2 }}>{label}{required && <span style={{ color: RED }}> *</span>}</label>
    {children}
  </div>
);
const Btn = ({ onClick, children, kind = "primary", disabled, icon: Icon, busy }) => {
  const styles = {
    primary: { background: RED, color: "#fff", border: "none" },
    ghost: { background: SURF, color: T2, border: `1px solid ${BORDER}` },
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled || busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ ...styles, opacity: (disabled || busy) ? 0.6 : 1 }}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : (Icon && <Icon size={14} />)}{children}
    </button>
  );
};
const Pill = ({ children, c, bg, b }) => (
  <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold" style={{ color: c, background: bg, border: `1px solid ${b}` }}>{children}</span>
);
const IconBtn = ({ onClick, title, icon: Icon, c = T2, bg = SURF, b = BORDER, disabled }) => (
  <button onClick={onClick} title={title} disabled={disabled} className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 6, background: bg, color: c, border: `1px solid ${b}`, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
    <Icon size={13} strokeWidth={2.25} />
  </button>
);

const fmtMoney = (n) => n == null ? "—" : "Rs " + Number(n).toLocaleString();

/* ════════════════════ main ════════════════════ */
const AssetsManager = () => {
  const user = useSelector(selectCurrentUser);
  const canView = can(user, "get inventory");
  const canCreate = can(user, "create inventory");
  const canEdit = can(user, "update inventory");
  const canDelete = can(user, "delete inventory");
  const canAssign = can(user, "update inventory-assign");

  const [tab, setTab] = useState("assets");

  const { data: summaryResp, refetch: refetchSummary } = useGetQuery({ path: "assets/summary" }, { skip: !can(user, "get inventory-summary") });
  const { data: catResp, refetch: refetchCats } = useGetQuery({ path: "assets/categories" }, { skip: !canView });
  const { data: locResp, refetch: refetchLocs } = useGetQuery({ path: "assets/locations" }, { skip: !canView });

  const categories = useMemo(() => catResp?.data || [], [catResp]);
  const locations = useMemo(() => locResp?.data || [], [locResp]);
  const summary = summaryResp?.data;

  if (!canView) {
    return <div className="p-10 text-[13px]" style={{ color: T2 }}>You don&apos;t have permission to view inventory.</div>;
  }

  const TABS = [
    { key: "assets", label: "Assets", icon: Boxes },
    { key: "stock", label: "Bulk Stock", icon: Layers },
    { key: "categories", label: "Categories", icon: Tag },
    { key: "locations", label: "Locations", icon: MapPin },
  ];

  return (
    <div style={{ padding: "26px 26px 60px", fontFamily: "'Montserrat', sans-serif", background: SURF2, minHeight: "100vh" }}>
      {/* header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 50, height: 50, borderRadius: 14, background: RED_TINT, color: RED }}><Boxes size={22} /></div>
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: T1 }}>Inventory &amp; Assets</h1>
          <p className="text-[13px]" style={{ color: T2 }}>Laptops, electronics, furniture &amp; kits — track, locate, and issue to students or staff.</p>
        </div>
      </div>

      {/* summary cards */}
      {summary && (
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {[
            { k: "unit_assets", label: "Unit assets", icon: Boxes, c: T1 },
            { k: "available", label: "Available", icon: PackageCheck, c: "#15803D" },
            { k: "assigned", label: "Assigned", icon: ArrowRightLeft, c: "#1D4ED8" },
            { k: "in_repair", label: "In repair", icon: Wrench, c: "#B45309" },
            { k: "bulk_units", label: "Bulk units", icon: Layers, c: T1 },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl p-4" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2 mb-1.5"><c.icon size={15} style={{ color: c.c }} /><span className="text-[11.5px] font-semibold" style={{ color: TM }}>{c.label}</span></div>
              <div className="text-[22px] font-bold" style={{ color: c.c }}>{summary[c.k] ?? 0}</div>
            </div>
          ))}
          <div className="rounded-2xl p-4" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 mb-1.5"><BarChart3 size={15} style={{ color: RED }} /><span className="text-[11.5px] font-semibold" style={{ color: TM }}>Asset value</span></div>
            <div className="text-[18px] font-bold" style={{ color: RED }}>{fmtMoney(summary.asset_value)}</div>
          </div>
        </div>
      )}

      {/* tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: SURF, border: `1px solid ${BORDER}`, width: "fit-content" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition"
            style={{ background: tab === t.key ? RED_TINT : "transparent", color: tab === t.key ? RED : T2 }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === "assets" && (
        <AssetsTab categories={categories} locations={locations}
          perms={{ canCreate, canEdit, canDelete, canAssign }}
          onChanged={() => { refetchSummary(); }} />
      )}
      {tab === "stock" && <StockTab categories={categories} locations={locations} perms={{ canCreate, canEdit }} onChanged={refetchSummary} />}
      {tab === "categories" && <CategoriesTab categories={categories} perms={{ canCreate, canEdit, canDelete }} onChanged={refetchCats} />}
      {tab === "locations" && <LocationsTab locations={locations} perms={{ canCreate, canEdit, canDelete }} onChanged={refetchLocs} />}
    </div>
  );
};

/* ════════════ Assets tab ════════════ */
const AssetsTab = ({ categories, locations, perms, onChanged }) => {
  const [params, setParams] = useState({ search: "", category_uuid: "", status: "", location_uuid: "", page: 1, per_page: 10 });
  const queryParams = useMemo(() => {
    const p = { per_page: params.per_page, page: params.page };
    if (params.search) p.search = params.search;
    if (params.category_uuid) p.category_uuid = params.category_uuid;
    if (params.status) p.status = params.status;
    if (params.location_uuid) p.location_uuid = params.location_uuid;
    return p;
  }, [params]);

  const { data, isFetching, refetch } = useGetQuery({ path: "assets", params: queryParams }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const meta = data?.meta || { total: 0, current_page: 1 };

  const [del, { isLoading: deleting }] = useDeleteMutation();
  const [stopBill] = usePostMutation();
  const [editTarget, setEditTarget] = useState(null);   // {} = new
  const [assignTarget, setAssignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const stopBilling = async (a) => {
    try {
      const res = await stopBill({ path: `assets/${a.uuid}/stop-billing`, body: {} }).unwrap();
      showToast(res?.message || "Laptop fee stopped.", "success"); refetch(); onChanged?.();
    } catch (e) { showToast(e?.data?.message || "Could not stop billing.", "error"); }
  };

  const set = (k, v) => setParams((s) => ({ ...s, [k]: v, page: k === "page" ? v : 1 }));

  const confirmDelete = async () => {
    try { await del({ path: `assets/${deleteTarget.uuid}` }).unwrap(); showToast("Asset deleted.", "success"); setDeleteTarget(null); refetch(); onChanged?.(); }
    catch (e) { showToast(e?.data?.message || "Delete failed.", "error"); }
  };

  return (
    <div>
      {/* filters */}
      <div className="rounded-2xl mb-4 p-3 flex flex-wrap items-center gap-2" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: TM }} />
          <input value={params.search} onChange={(e) => set("search", e.target.value)} placeholder="Search tag, name, serial…" className="w-full pl-9 pr-3 py-2 rounded-lg" style={{ border: `1px solid ${BORDER}`, fontSize: 13, outline: "none" }} />
        </div>
        <select value={params.category_uuid} onChange={(e) => set("category_uuid", e.target.value)} style={{ ...inputStyle, width: "auto", fontWeight: 600, color: T2 }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
        </select>
        <select value={params.status} onChange={(e) => set("status", e.target.value)} style={{ ...inputStyle, width: "auto", fontWeight: 600, color: T2 }}>
          <option value="">Any status</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={params.location_uuid} onChange={(e) => set("location_uuid", e.target.value)} style={{ ...inputStyle, width: "auto", fontWeight: 600, color: T2 }}>
          <option value="">All locations</option>
          {locations.map((l) => <option key={l.uuid} value={l.uuid}>{l.name}</option>)}
        </select>
        {perms.canCreate && <div className="ml-auto"><Btn icon={Plus} onClick={() => setEditTarget({})}>Add Asset</Btn></div>}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
        {isFetching ? (
          <div className="py-16 flex items-center justify-center" style={{ color: TM }}><Loader2 className="animate-spin mr-2" size={18} /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-[13px]" style={{ color: T2 }}>No assets match your filters.</div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ background: SURF2, borderBottom: `1px solid ${BORDER}` }}>
              {["Tag", "Name", "Category", "Status", "Location", "Assigned To", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold tracking-[0.5px] uppercase" style={{ color: TM }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((a) => {
                const sm = STATUS_META[a.status] || STATUS_META.available;
                return (
                  <tr key={a.uuid} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-3"><code className="text-[11.5px] px-1.5 py-0.5 rounded" style={{ background: SURF2, color: RED }}>{a.asset_tag}</code></td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: T1 }}>{a.name || <span style={{ color: TM }}>—</span>}{a.serial_number && <div className="text-[10.5px]" style={{ color: TM }}>SN: {a.serial_number}</div>}</td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: T2 }}>{a.category?.name || "—"}</td>
                    <td className="px-4 py-3"><Pill c={sm.c} bg={sm.bg} b={sm.b}>{sm.label}</Pill></td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: T2 }}>{a.location?.name || <span style={{ color: TM }}>—</span>}</td>
                    <td className="px-4 py-3 text-[12.5px]" style={{ color: T2 }}>
                      {a.assigned_to ? <span>{a.assigned_to.assignee_name || `#${a.assigned_to.assignee_id}`}<div className="text-[10.5px]" style={{ color: TM }}>{a.assigned_to.assignee_type}</div></span> : <span style={{ color: TM }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <IconBtn icon={Pencil} title="Edit" c="#2563EB" bg="#EFF6FF" b="#BFDBFE" disabled={!perms.canEdit} onClick={() => setEditTarget(a)} />
                        {a.status === "assigned"
                          ? <IconBtn icon={Undo2} title="Return" c="#15803D" bg="#F0FDF4" b="#BBF7D0" disabled={!perms.canAssign} onClick={() => setAssignTarget({ ...a, _mode: "return" })} />
                          : <IconBtn icon={ArrowRightLeft} title="Assign" c="#1D4ED8" bg="#EFF6FF" b="#BFDBFE" disabled={!perms.canAssign || a.status !== "available"} onClick={() => setAssignTarget({ ...a, _mode: "assign" })} />}
                        {(a.category?.name || "").toLowerCase().includes("laptop") && a.status === "assigned" && (
                          <IconBtn icon={Ban} title="Stop laptop fee (this month onward)" c="#B45309" bg="#FFFBEB" b="#FDE68A" disabled={!perms.canAssign} onClick={() => stopBilling(a)} />
                        )}
                        <IconBtn icon={Trash2} title="Delete" c={RED} bg={RED_TINT} b={RED_TINT} disabled={!perms.canDelete} onClick={() => setDeleteTarget(a)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {meta.total > 0 && <SimplePagination page={params.page} total={meta.total} perPage={params.per_page} onPageChange={(p) => set("page", p)} onPerPageChange={(n) => setParams((s) => ({ ...s, per_page: n, page: 1 }))} />}

      {editTarget && <AssetForm asset={editTarget} categories={categories} locations={locations} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); refetch(); onChanged?.(); }} />}
      {assignTarget && <AssignModal asset={assignTarget} mode={assignTarget._mode} onClose={() => setAssignTarget(null)} onDone={() => { setAssignTarget(null); refetch(); onChanged?.(); }} />}
      <Modal open={!!deleteTarget} title="Delete asset" icon={AlertTriangle} onClose={() => setDeleteTarget(null)}
        footer={<><Btn kind="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Btn><Btn icon={Trash2} busy={deleting} onClick={confirmDelete}>Delete</Btn></>}>
        <p className="text-[13px]" style={{ color: T2 }}>Delete <strong style={{ color: T1 }}>{deleteTarget?.asset_tag}</strong>? This can&apos;t be undone.</p>
      </Modal>
    </div>
  );
};

/* ════════════ Asset add/edit form ════════════ */
const AssetForm = ({ asset, categories, locations, onClose, onSaved }) => {
  const isNew = !asset.uuid;
  const [f, setF] = useState({
    category_uuid: asset.category?.uuid || "", asset_tag: asset.asset_tag || "", name: asset.name || "",
    serial_number: asset.serial_number || "", status: asset.status || "available", condition: asset.condition || "good",
    location_uuid: asset.location?.uuid || "", purchase_date: asset.purchase_date || "", purchase_cost: asset.purchase_cost || "",
    vendor: asset.vendor || "", warranty_until: asset.warranty_until || "", remarks: asset.remarks || "",
  });
  const [post, { isLoading: creating }] = usePostMutation();
  const [put, { isLoading: updating }] = usePutMutation();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.category_uuid || !f.asset_tag) { showToast("Category and tag are required.", "error"); return; }
    const body = { ...f, purchase_cost: f.purchase_cost === "" ? null : Number(f.purchase_cost), location_uuid: f.location_uuid || null,
      purchase_date: f.purchase_date || null, warranty_until: f.warranty_until || null };
    try {
      if (isNew) await post({ path: "assets", body }).unwrap();
      else await put({ path: `assets/${asset.uuid}`, body }).unwrap();
      showToast(isNew ? "Asset created." : "Asset updated.", "success");
      onSaved();
    } catch (e) {
      showToast(e?.data?.message || (e?.data?.errors && Object.values(e.data.errors).flat().join("\n")) || "Save failed.", "error");
    }
  };

  return (
    <Modal open wide title={isNew ? "Add asset" : "Edit asset"} icon={Boxes} onClose={onClose}
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn busy={creating || updating} onClick={submit}>{isNew ? "Create" : "Save"}</Btn></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" required><select value={f.category_uuid} onChange={(e) => set("category_uuid", e.target.value)} style={inputStyle}><option value="">Select…</option>{categories.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}</select></Field>
        <Field label="Asset tag" required><input value={f.asset_tag} onChange={(e) => set("asset_tag", e.target.value)} placeholder="LAP-0007" style={inputStyle} /></Field>
        <Field label="Name / model"><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Dell Latitude 5420" style={inputStyle} /></Field>
        <Field label="Serial number"><input value={f.serial_number} onChange={(e) => set("serial_number", e.target.value)} style={inputStyle} /></Field>
        <Field label="Status"><select value={f.status} onChange={(e) => set("status", e.target.value)} style={inputStyle}>{Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
        <Field label="Condition"><select value={f.condition} onChange={(e) => set("condition", e.target.value)} style={inputStyle}>{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="Location"><select value={f.location_uuid} onChange={(e) => set("location_uuid", e.target.value)} style={inputStyle}><option value="">—</option>{locations.map((l) => <option key={l.uuid} value={l.uuid}>{l.name}</option>)}</select></Field>
        <Field label="Vendor"><input value={f.vendor} onChange={(e) => set("vendor", e.target.value)} style={inputStyle} /></Field>
        <Field label="Purchase date"><input type="date" value={f.purchase_date || ""} onChange={(e) => set("purchase_date", e.target.value)} style={inputStyle} /></Field>
        <Field label="Purchase cost (Rs)"><input type="number" value={f.purchase_cost} onChange={(e) => set("purchase_cost", e.target.value)} style={inputStyle} /></Field>
        <Field label="Warranty until"><input type="date" value={f.warranty_until || ""} onChange={(e) => set("warranty_until", e.target.value)} style={inputStyle} /></Field>
        <div className="col-span-2"><Field label="Remarks"><textarea value={f.remarks} onChange={(e) => set("remarks", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field></div>
      </div>
    </Modal>
  );
};

/* ════════════ Assign / Return modal ════════════ */
const AssignModal = ({ asset, mode, onClose, onDone }) => {
  const user = useSelector(selectCurrentUser);
  // The people pickers hit permission-gated endpoints (/student/students needs
  // "get student", employee/profiles needs "get employee"). Only offer a tab
  // the user can actually load, so we never 401 → forced logout.
  const canStudents = can(user, "get student");
  const canEmployees = can(user, "get employee");
  const allowedTypes = [canStudents && "student", canEmployees && "employee"].filter(Boolean);

  const [assigneeType, setAssigneeType] = useState(allowedTypes[0] || "student");
  const [assigneeId, setAssigneeId] = useState(null);
  const [assignedAt, setAssignedAt] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [returnCondition, setReturnCondition] = useState(asset.condition || "good");
  const [lost, setLost] = useState(false);
  const [post, { isLoading }] = usePostMutation();

  // Laptop → student gets a recurring monthly fee + time-slot + duration.
  const isLaptop = (asset.category?.name || "").toLowerCase().includes("laptop");
  const billable = isLaptop && assigneeType === "student";
  const [timeSlot, setTimeSlot] = useState("");
  const [fullCourse, setFullCourse] = useState(true);
  const [days, setDays] = useState("");
  const [discType, setDiscType] = useState("");
  const [discValue, setDiscValue] = useState("");
  const { data: settingsResp } = useGetQuery({ path: "/settings/public" }, { skip: !billable });
  const monthlyRate = Number(settingsResp?.data?.laptop_monthly_fee || 0);
  const netMonthly = discType === "flat" ? Math.max(0, monthlyRate - Number(discValue || 0))
    : discType === "percent" ? Math.max(0, monthlyRate - (monthlyRate * Number(discValue || 0) / 100))
    : monthlyRate;

  // People picker (only when assigning). Students vs employees.
  const { data: studentsResp } = useGetQuery({ path: "/student/students", params: { per_page: 100 } }, { skip: mode !== "assign" || assigneeType !== "student" || !canStudents });
  const { data: empResp } = useGetQuery({ path: "employee/profiles", params: { per_page: 100 } }, { skip: mode !== "assign" || assigneeType !== "employee" || !canEmployees });

  const options = useMemo(() => {
    if (assigneeType === "student") {
      return (studentsResp?.data || []).map((s) => ({ value: s.id ?? s.user_id ?? s.user?.id, label: `${s.first_name || s.name || ""} ${s.last_name || ""}`.trim() || s.email || `#${s.id}` }))
        .filter((o) => o.value);
    }
    return (empResp?.data || []).map((p) => ({ value: p.user?.id ?? p.user_id, label: (p.user ? `${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() : "") || p.employee_id || `#${p.user?.id}` }))
      .filter((o) => o.value);
  }, [assigneeType, studentsResp, empResp]);

  const doAssign = async () => {
    if (!assigneeId) { showToast("Pick who receives the asset.", "error"); return; }
    if (billable && !timeSlot) { showToast("Pick the time slot for this laptop.", "error"); return; }
    try {
      const body = { assignee_type: assigneeType, assignee_id: assigneeId, assigned_at: assignedAt || undefined, due_date: dueDate || undefined, remarks: remarks || undefined };
      if (billable) {
        body.time_slot = timeSlot;
        body.is_billable = true;
        body.is_full_course = fullCourse;
        if (!fullCourse && Number(days) > 0) body.duration_days = Number(days);
        if (discType && Number(discValue) > 0) { body.discount_type = discType; body.discount_value = Number(discValue); }
      }
      await post({ path: `assets/${asset.uuid}/assign`, body }).unwrap();
      showToast("Asset issued.", "success"); onDone();
    } catch (e) { showToast(e?.data?.message || "Assign failed.", "error"); }
  };
  const doReturn = async () => {
    try {
      await post({ path: `assets/${asset.uuid}/return`, body: { condition: returnCondition, lost, remarks: remarks || undefined } }).unwrap();
      showToast(lost ? "Marked lost." : "Asset returned.", "success"); onDone();
    } catch (e) { showToast(e?.data?.message || "Return failed.", "error"); }
  };

  if (mode === "return") {
    return (
      <Modal open title="Return asset" icon={Undo2} onClose={onClose}
        footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn busy={isLoading} onClick={doReturn}>{lost ? "Mark lost" : "Return"}</Btn></>}>
        <p className="text-[13px] mb-3" style={{ color: T2 }}>Returning <strong style={{ color: T1 }}>{asset.asset_tag}</strong> from {asset.assigned_to?.assignee_name || "holder"}.</p>
        <Field label="Condition on return"><select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} style={inputStyle}>{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <label className="flex items-center gap-2 text-[13px] mb-3" style={{ color: T1 }}><input type="checkbox" checked={lost} onChange={(e) => setLost(e.target.checked)} style={{ accentColor: RED }} /> Item is lost / not returned</label>
        <Field label="Remarks"><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      </Modal>
    );
  }

  return (
    <Modal open title="Issue asset" icon={ArrowRightLeft} onClose={onClose}
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn busy={isLoading} onClick={doAssign}>Issue</Btn></>}>
      <p className="text-[13px] mb-3" style={{ color: T2 }}>Issuing <strong style={{ color: T1 }}>{asset.asset_tag}</strong>{asset.name ? ` · ${asset.name}` : ""}.</p>
      <Field label="Issue to">
        <div className="flex gap-2">
          {allowedTypes.map((t) => (
            <button key={t} onClick={() => { setAssigneeType(t); setAssigneeId(null); }} className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold capitalize"
              style={{ background: assigneeType === t ? RED_TINT : SURF, color: assigneeType === t ? RED : T2, border: `1px solid ${assigneeType === t ? RED : BORDER}` }}>{t}</button>
          ))}
        </div>
        {allowedTypes.length === 0 && <p className="text-[11.5px] mt-1" style={{ color: TM }}>You don&apos;t have access to student or employee lists to issue this item.</p>}
      </Field>
      <Field label={assigneeType === "student" ? "Student" : "Employee"} required>
        <SearchableSelect options={options} value={assigneeId} onChange={setAssigneeId} placeholder={`Search ${assigneeType}…`} />
      </Field>
      {billable && (
        <>
          <Field label="Time slot" required>
            <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} style={inputStyle}>
              <option value="">Select slot…</option>
              {["morning", "noon", "evening", "night"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Duration">
            <div className="flex gap-2">
              <button type="button" onClick={() => setFullCourse(true)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: fullCourse ? RED_TINT : SURF, color: fullCourse ? RED : T2, border: `1px solid ${fullCourse ? RED : BORDER}` }}>Full course</button>
              <button type="button" onClick={() => setFullCourse(false)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: !fullCourse ? RED_TINT : SURF, color: !fullCourse ? RED : T2, border: `1px solid ${!fullCourse ? RED : BORDER}` }}>For N days</button>
            </div>
          </Field>
          {!fullCourse && <Field label="Days (return-by reminder)"><input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} style={inputStyle} /></Field>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly discount"><select value={discType} onChange={(e) => setDiscType(e.target.value)} style={inputStyle}><option value="">None</option><option value="flat">Flat Rs</option><option value="percent">%</option></select></Field>
            <Field label="Discount value"><input type="number" min="0" value={discValue} onChange={(e) => setDiscValue(e.target.value)} disabled={!discType} style={{ ...inputStyle, opacity: discType ? 1 : 0.5 }} /></Field>
          </div>
          <div className="rounded-lg px-3 py-2 mb-2" style={{ background: SURF2, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span style={{ color: T2 }}>Monthly laptop fee</span>
              <span style={{ color: T1, fontWeight: 700 }}>Rs {netMonthly.toLocaleString()}<span style={{ color: TM, fontWeight: 400 }}>/mo</span></span>
            </div>
            {discType && monthlyRate > 0 && (
              <div className="text-[10.5px] mt-0.5" style={{ color: TM }}>Standard Rs {monthlyRate.toLocaleString()} − {discType === "percent" ? `${discValue || 0}%` : `Rs ${Number(discValue || 0).toLocaleString()}`} discount</div>
            )}
            <div className="text-[10.5px] mt-0.5" style={{ color: TM }}>Bills every month on the challan while assigned{fullCourse ? " (full course)" : (days ? ` (${days} days)` : "")}.</div>
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Issue date"><input type="date" value={assignedAt} onChange={(e) => setAssignedAt(e.target.value)} style={inputStyle} /></Field>
        <Field label="Due / return by"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Remarks"><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
    </Modal>
  );
};

/* ════════════ Categories tab ════════════ */
const CategoriesTab = ({ categories, perms, onChanged }) => {
  const [edit, setEdit] = useState(null);
  const [del] = useDeleteMutation();
  const remove = async (c) => {
    try { await del({ path: `assets/categories/${c.uuid}` }).unwrap(); showToast("Category deleted.", "success"); onChanged?.(); }
    catch (e) { showToast(e?.data?.message || "Delete failed.", "error"); }
  };
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-[13px] font-bold" style={{ color: T1 }}>Categories</span>
        {perms.canCreate && <Btn icon={Plus} onClick={() => setEdit({})}>Add Category</Btn>}
      </div>
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead><tr style={{ background: SURF2 }}>{["Name", "Group", "Tracking", "Students", "Employees", "Active", ""].map((h) => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold uppercase" style={{ color: TM }}>{h}</th>)}</tr></thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.uuid} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td className="px-4 py-2.5 text-[13px] font-semibold" style={{ color: T1 }}>{c.name}</td>
              <td className="px-4 py-2.5 text-[12.5px]" style={{ color: T2 }}>{GROUPS.find((g) => g.value === c.group)?.label || c.group}</td>
              <td className="px-4 py-2.5 text-[12.5px]" style={{ color: T2 }}>{c.tracking_mode === "unit" ? "Per-unit" : "Bulk qty"}</td>
              <td className="px-4 py-2.5">{c.assignable_to_students ? "✓" : "—"}</td>
              <td className="px-4 py-2.5">{c.assignable_to_employees ? "✓" : "—"}</td>
              <td className="px-4 py-2.5">{c.is_active ? <Pill c="#15803D" bg="#DCFCE7" b="#86EFAC">Active</Pill> : <Pill c={TM} bg={SURF2} b={BORDER}>Off</Pill>}</td>
              <td className="px-4 py-2.5"><div className="flex gap-1.5">
                <IconBtn icon={Pencil} title="Edit" c="#2563EB" bg="#EFF6FF" b="#BFDBFE" disabled={!perms.canEdit} onClick={() => setEdit(c)} />
                <IconBtn icon={Trash2} title="Delete" c={RED} bg={RED_TINT} b={RED_TINT} disabled={!perms.canDelete} onClick={() => remove(c)} />
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <CategoryForm cat={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); onChanged?.(); }} />}
    </div>
  );
};
const CategoryForm = ({ cat, onClose, onSaved }) => {
  const isNew = !cat.uuid;
  const [f, setF] = useState({ name: cat.name || "", group: cat.group || "other", tracking_mode: cat.tracking_mode || "unit",
    assignable_to_students: !!cat.assignable_to_students, assignable_to_employees: !!cat.assignable_to_employees, is_active: cat.is_active ?? true });
  const [post, { isLoading: a }] = usePostMutation();
  const [put, { isLoading: b }] = usePutMutation();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    if (!f.name) { showToast("Name required.", "error"); return; }
    try { isNew ? await post({ path: "assets/categories", body: f }).unwrap() : await put({ path: `assets/categories/${cat.uuid}`, body: f }).unwrap();
      showToast(isNew ? "Category created." : "Category updated.", "success"); onSaved(); }
    catch (e) { showToast(e?.data?.message || "Save failed.", "error"); }
  };
  return (
    <Modal open title={isNew ? "Add category" : "Edit category"} icon={Tag} onClose={onClose}
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn busy={a || b} onClick={submit}>{isNew ? "Create" : "Save"}</Btn></>}>
      <Field label="Name" required><input value={f.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} /></Field>
      <Field label="Group"><select value={f.group} onChange={(e) => set("group", e.target.value)} style={inputStyle}>{GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select></Field>
      <Field label="Tracking"><select value={f.tracking_mode} onChange={(e) => set("tracking_mode", e.target.value)} style={inputStyle}><option value="unit">Per-unit (own tag/serial)</option><option value="bulk">Bulk quantity</option></select></Field>
      <label className="flex items-center gap-2 text-[13px] mb-2" style={{ color: T1 }}><input type="checkbox" checked={f.assignable_to_students} onChange={(e) => set("assignable_to_students", e.target.checked)} style={{ accentColor: RED }} /> Can be issued to students</label>
      <label className="flex items-center gap-2 text-[13px] mb-2" style={{ color: T1 }}><input type="checkbox" checked={f.assignable_to_employees} onChange={(e) => set("assignable_to_employees", e.target.checked)} style={{ accentColor: RED }} /> Can be issued to employees</label>
      <label className="flex items-center gap-2 text-[13px]" style={{ color: T1 }}><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} style={{ accentColor: RED }} /> Active</label>
    </Modal>
  );
};

/* ════════════ Locations tab ════════════ */
const LocationsTab = ({ locations, perms, onChanged }) => {
  const [edit, setEdit] = useState(null);
  const [del] = useDeleteMutation();
  const remove = async (l) => {
    try { await del({ path: `assets/locations/${l.uuid}` }).unwrap(); showToast("Location deleted.", "success"); onChanged?.(); }
    catch (e) { showToast(e?.data?.message || "Delete failed.", "error"); }
  };
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-[13px] font-bold" style={{ color: T1 }}>Locations</span>
        {perms.canCreate && <Btn icon={Plus} onClick={() => setEdit({})}>Add Location</Btn>}
      </div>
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead><tr style={{ background: SURF2 }}>{["Name", "Type", "Description", "Active", ""].map((h) => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold uppercase" style={{ color: TM }}>{h}</th>)}</tr></thead>
        <tbody>
          {locations.map((l) => (
            <tr key={l.uuid} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <td className="px-4 py-2.5 text-[13px] font-semibold" style={{ color: T1 }}>{l.name}</td>
              <td className="px-4 py-2.5 text-[12.5px] capitalize" style={{ color: T2 }}>{l.type}</td>
              <td className="px-4 py-2.5 text-[12.5px]" style={{ color: TM }}>{l.description || "—"}</td>
              <td className="px-4 py-2.5">{l.is_active ? <Pill c="#15803D" bg="#DCFCE7" b="#86EFAC">Active</Pill> : <Pill c={TM} bg={SURF2} b={BORDER}>Off</Pill>}</td>
              <td className="px-4 py-2.5"><div className="flex gap-1.5">
                <IconBtn icon={Pencil} title="Edit" c="#2563EB" bg="#EFF6FF" b="#BFDBFE" disabled={!perms.canEdit} onClick={() => setEdit(l)} />
                <IconBtn icon={Trash2} title="Delete" c={RED} bg={RED_TINT} b={RED_TINT} disabled={!perms.canDelete} onClick={() => remove(l)} />
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <LocationForm loc={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); onChanged?.(); }} />}
    </div>
  );
};
const LocationForm = ({ loc, onClose, onSaved }) => {
  const isNew = !loc.uuid;
  const [f, setF] = useState({ name: loc.name || "", type: loc.type || "room", description: loc.description || "", is_active: loc.is_active ?? true });
  const [post, { isLoading: a }] = usePostMutation();
  const [put, { isLoading: b }] = usePutMutation();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    if (!f.name) { showToast("Name required.", "error"); return; }
    try { isNew ? await post({ path: "assets/locations", body: f }).unwrap() : await put({ path: `assets/locations/${loc.uuid}`, body: f }).unwrap();
      showToast(isNew ? "Location created." : "Location updated.", "success"); onSaved(); }
    catch (e) { showToast(e?.data?.message || "Save failed.", "error"); }
  };
  return (
    <Modal open title={isNew ? "Add location" : "Edit location"} icon={MapPin} onClose={onClose}
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn busy={a || b} onClick={submit}>{isNew ? "Create" : "Save"}</Btn></>}>
      <Field label="Name" required><input value={f.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} /></Field>
      <Field label="Type"><select value={f.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>{LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
      <Field label="Description"><input value={f.description} onChange={(e) => set("description", e.target.value)} style={inputStyle} /></Field>
      <label className="flex items-center gap-2 text-[13px]" style={{ color: T1 }}><input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} style={{ accentColor: RED }} /> Active</label>
    </Modal>
  );
};

/* ════════════ Stock tab ════════════ */
const StockTab = ({ categories, locations, perms, onChanged }) => {
  const { data, refetch } = useGetQuery({ path: "assets/stock" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const [edit, setEdit] = useState(null);
  const bulkCats = categories.filter((c) => c.tracking_mode === "bulk");
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: SURF, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-[13px] font-bold" style={{ color: T1 }}>Bulk stock (chairs, tables…)</span>
        {perms.canEdit && <Btn icon={Plus} onClick={() => setEdit({})}>Set Stock</Btn>}
      </div>
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead><tr style={{ background: SURF2 }}>{["Category", "Location", "Quantity", "Unit cost", ""].map((h) => <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold uppercase" style={{ color: TM }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-[13px]" style={{ color: TM }}>No bulk stock recorded.</td></tr>
            : rows.map((s) => (
              <tr key={s.uuid} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td className="px-4 py-2.5 text-[13px] font-semibold" style={{ color: T1 }}>{s.category?.name}</td>
                <td className="px-4 py-2.5 text-[12.5px]" style={{ color: T2 }}>{s.location?.name || "—"}</td>
                <td className="px-4 py-2.5 text-[13px] font-bold" style={{ color: T1 }}>{s.quantity}</td>
                <td className="px-4 py-2.5 text-[12.5px]" style={{ color: T2 }}>{fmtMoney(s.unit_cost)}</td>
                <td className="px-4 py-2.5">{perms.canEdit && <IconBtn icon={Pencil} title="Edit" c="#2563EB" bg="#EFF6FF" b="#BFDBFE" onClick={() => setEdit({ category_uuid: s.category?.uuid, location_uuid: s.location?.uuid || "", quantity: s.quantity, unit_cost: s.unit_cost || "" })} />}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {edit && <StockForm row={edit} bulkCats={bulkCats} locations={locations} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refetch(); onChanged?.(); }} />}
    </div>
  );
};
const StockForm = ({ row, bulkCats, locations, onClose, onSaved }) => {
  const [f, setF] = useState({ category_uuid: row.category_uuid || "", location_uuid: row.location_uuid || "", quantity: row.quantity ?? 0, unit_cost: row.unit_cost ?? "" });
  const [post, { isLoading }] = usePostMutation();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = async () => {
    if (!f.category_uuid) { showToast("Pick a category.", "error"); return; }
    try {
      await post({ path: "assets/stock", body: { category_uuid: f.category_uuid, location_uuid: f.location_uuid || null, quantity: Number(f.quantity), unit_cost: f.unit_cost === "" ? null : Number(f.unit_cost) } }).unwrap();
      showToast("Stock saved.", "success"); onSaved();
    } catch (e) { showToast(e?.data?.message || "Save failed.", "error"); }
  };
  return (
    <Modal open title="Set bulk stock" icon={Layers} onClose={onClose}
      footer={<><Btn kind="ghost" onClick={onClose}>Cancel</Btn><Btn busy={isLoading} onClick={submit}>Save</Btn></>}>
      <Field label="Category (bulk only)" required><select value={f.category_uuid} onChange={(e) => set("category_uuid", e.target.value)} style={inputStyle}><option value="">Select…</option>{bulkCats.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}</select></Field>
      <Field label="Location"><select value={f.location_uuid} onChange={(e) => set("location_uuid", e.target.value)} style={inputStyle}><option value="">—</option>{locations.map((l) => <option key={l.uuid} value={l.uuid}>{l.name}</option>)}</select></Field>
      <Field label="Quantity" required><input type="number" value={f.quantity} onChange={(e) => set("quantity", e.target.value)} style={inputStyle} /></Field>
      <Field label="Unit cost (Rs)"><input type="number" value={f.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} style={inputStyle} /></Field>
    </Modal>
  );
};

export default AssetsManager;
