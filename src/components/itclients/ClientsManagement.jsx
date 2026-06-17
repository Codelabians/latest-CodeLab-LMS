import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Plus, X, Pencil, Trash2, Loader2, Building2, Users, Mail, Phone,
  ArrowLeft, FolderKanban, CalendarClock, LayoutDashboard,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

/* ---- design tokens (match dashboards) ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const AMBER = "#B45309";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

const STATUSES = [
  { value: "lead", label: "Lead", color: BLUE, tint: "#EFF6FF" },
  { value: "active", label: "Active", color: GREEN, tint: "#F0FDF4" },
  { value: "on_hold", label: "On hold", color: AMBER, tint: "#FFFBEB" },
  { value: "completed", label: "Completed", color: "#7C3AED", tint: "#F5F3FF" },
  { value: "archived", label: "Archived", color: TEXT_MUTED, tint: SURFACE },
];
const statusMeta = (s) => STATUSES.find((x) => x.value === s) || STATUSES[1];

const PROJECT_STATUSES = [
  { value: "planned", label: "Planned", color: BLUE, tint: "#EFF6FF" },
  { value: "in_progress", label: "In progress", color: GREEN, tint: "#F0FDF4" },
  { value: "on_hold", label: "On hold", color: AMBER, tint: "#FFFBEB" },
  { value: "completed", label: "Completed", color: "#7C3AED", tint: "#F5F3FF" },
  { value: "cancelled", label: "Cancelled", color: BRAND, tint: "#FEF2F2" },
];
const projStatusMeta = (s) => PROJECT_STATUSES.find((x) => x.value === s) || PROJECT_STATUSES[0];

const PROJECT_TYPES = [
  { value: "software", label: "Software", color: BLUE, tint: "#EFF6FF" },
  { value: "social_media", label: "Social media", color: "#7C3AED", tint: "#F5F3FF" },
  { value: "seo", label: "SEO", color: GREEN, tint: "#F0FDF4" },
  { value: "other", label: "Other", color: TEXT_MUTED, tint: SURFACE },
];
const projTypeMeta = (t) => PROJECT_TYPES.find((x) => x.value === t) || PROJECT_TYPES[0];

/* ------------------------- Create / Edit modal ------------------------- */
function ClientFormModal({ isOpen, onClose, onSubmit, client, teamOptions, saving, error }) {
  const isEdit = !!client;
  const [form, setForm] = useState({});

  useMemo(() => {
    if (isOpen) {
      setForm({
        name: client?.name || "",
        company_name: client?.company_name || "",
        email: client?.email || "",
        phone: client?.phone || "",
        team_id: client?.team_id ? String(client.team_id) : "",
        status: client?.status || "active",
        notes: client?.notes || "",
        is_active: client ? !!client.is_active : true,
      });
    }
  }, [isOpen, client]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-lg p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#FEF2F2", color: BRAND }}><Briefcase size={17} /></span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit client" : "New client"}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Client / contact name</label>
            <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ali Raza" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Company</label>
            <input value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value)} placeholder="Company name (optional)" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Email</label>
            <input value={form.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Phone</label>
            <input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="03xx-xxxxxxx" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Assigned team</label>
            <SearchableSelect options={teamOptions} value={form.team_id || ""} onChange={(v) => set("team_id", v || "")} placeholder="Unassigned" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Status</label>
            <select value={form.status || "active"} onChange={(e) => set("status", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Notes</label>
            <textarea rows={2} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Anything worth remembering…" className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>
        )}

        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onSubmit({
              name: (form.name || "").trim(),
              company_name: (form.company_name || "").trim() || null,
              email: (form.email || "").trim() || null,
              phone: (form.phone || "").trim() || null,
              team_id: form.team_id ? Number(form.team_id) : null,
              status: form.status || "active",
              notes: (form.notes || "").trim() || null,
              is_active: form.is_active ?? true,
            })}
            disabled={!form.name?.trim() || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            {saving ? "Saving…" : isEdit ? "Update client" : "Create client"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ isOpen, onClose, onConfirm, busy }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 text-center bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="grid w-12 h-12 mx-auto mb-3 rounded-full place-items-center" style={{ background: "#FEF2F2", color: BRAND }}><Trash2 size={22} /></div>
        <h2 className="text-[15px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>Delete this client?</h2>
        <p className="text-[12px] mb-5" style={{ color: TEXT_MUTED }}>This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{busy ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Project modal ----------------------------- */
function ProjectModal({ isOpen, onClose, onSubmit, project, saving, error }) {
  const isEdit = !!project;
  const [form, setForm] = useState({});

  useMemo(() => {
    if (isOpen) {
      setForm({
        name: project?.name || "",
        description: project?.description || "",
        status: project?.status || "planned",
        type: project?.type || "software",
        start_date: project?.start_date || "",
        due_date: project?.due_date || "",
      });
    }
  }, [isOpen, project]);

  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#EFF6FF", color: BLUE }}><FolderKanban size={17} /></span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit project" : "New project"}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Project name</label>
            <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Fudchef mobile app" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Status</label>
              <select value={form.status || "planned"} onChange={(e) => set("status", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Type</label>
              <select value={form.type || "software"} onChange={(e) => set("type", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                {PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Start date</label>
              <input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Due date</label>
              <input type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Description</label>
            <textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Scope / deliverable…" className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
        </div>

        {error && <div className="mt-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>}

        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onSubmit({
              name: (form.name || "").trim(),
              description: (form.description || "").trim() || null,
              status: form.status || "planned",
              type: form.type || "software",
              start_date: form.start_date || null,
              due_date: form.due_date || null,
            })}
            disabled={!form.name?.trim() || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BLUE }}>
            {saving ? "Saving…" : isEdit ? "Update project" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Client detail ----------------------------- */
function ClientDetail({ client, onBack, onEdit, onAskDelete }) {
  const navigate = useNavigate();
  const sm = statusMeta(client.status);
  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: "clients/projects", params: { it_client_id: client.id } },
    { refetchOnMountOrArgChange: true }
  );
  const projects = data?.data || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [err, setErr] = useState(null);

  const [createProject, { isLoading: creating }] = usePostMutation();
  const [updateProject, { isLoading: updating }] = usePatchMutation();
  const [deleteProject, { isLoading: removing }] = useDeleteMutation();

  const submit = async (body) => {
    setErr(null);
    try {
      if (editing) await updateProject({ path: `clients/projects/${editing.uuid}`, body }).unwrap();
      else await createProject({ path: "clients/projects", body: { ...body, it_client_id: client.id } }).unwrap();
      setModalOpen(false); setEditing(null); refetch();
    } catch (e) {
      console.error("save project failed", e);
      setErr(e?.data?.message || (e?.status === 404 ? "Endpoint not found — restart the backend after migrating." : `Request failed (HTTP ${e?.status ?? "?"}).`));
    }
  };
  const onDelete = async () => {
    try { await deleteProject({ path: `clients/projects/${deleting.uuid}`, body: {} }).unwrap(); setDeleting(null); refetch(); }
    catch (e) { console.error("delete project failed", e); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <button onClick={onBack} className="grid w-9 h-9 rounded-lg place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ArrowLeft size={16} /></button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{client.name}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sm.tint, color: sm.color }}>{sm.label}</span>
            </div>
            <p className="text-[11.5px] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5" style={{ color: TEXT_MUTED }}>
              {client.company_name && <span className="inline-flex items-center gap-1"><Building2 size={11} /> {client.company_name}</span>}
              <span className="inline-flex items-center gap-1"><Users size={11} /> {client.team?.name || "Unassigned"}</span>
              {client.email && <span className="inline-flex items-center gap-1"><Mail size={11} /> {client.email}</span>}
              {client.phone && <span className="inline-flex items-center gap-1"><Phone size={11} /> {client.phone}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(client)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={13} /> Edit client</button>
          <button onClick={() => onAskDelete(client)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold inline-flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}><FolderKanban size={15} /> Projects {isFetching && <span className="text-[11px] font-normal" style={{ color: BRAND }}>· updating…</span>}</h3>
        <button onClick={() => { setEditing(null); setErr(null); setModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white rounded-lg" style={{ background: BLUE }}><Plus size={14} /> New project</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : projects.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No projects yet</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Create the first project for this client.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {projects.map((p) => {
            const ps = projStatusMeta(p.status);
            return (
              <div key={p.uuid} className="p-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>{p.name}</div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ps.tint, color: ps.color }}>{ps.label}</span>
                    {(() => { const tm = projTypeMeta(p.type); return <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tm.tint, color: tm.color }}>{tm.label}</span>; })()}
                  </div>
                </div>
                {p.description && <p className="text-[11.5px] mt-1" style={{ color: TEXT_SECONDARY }}>{p.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: TEXT_MUTED }}>
                  {(p.start_date || p.due_date) && <span className="inline-flex items-center gap-1"><CalendarClock size={12} /> {p.start_date || "—"} → {p.due_date || "—"}</span>}
                  {p.team?.name && <span className="inline-flex items-center gap-1"><Users size={12} /> {p.team.name}</span>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={() => navigate(`/dashboard/it-solutions/projects/${p.uuid}`)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: "#EFF6FF", border: `1px solid ${BORDER}`, color: BLUE }}><LayoutDashboard size={13} /> Open board</button>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditing(p); setErr(null); setModalOpen(true); }} className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={13} /></button>
                    <button onClick={() => setDeleting(p)} className="grid rounded-md w-7 h-7 place-items-center" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); setErr(null); }} onSubmit={submit} project={editing} saving={creating || updating} error={err} />
      <ConfirmDelete isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={onDelete} busy={removing} />
    </div>
  );
}

/* ------------------------------- main ---------------------------------- */
export default function ClientsManagement() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [formError, setFormError] = useState(null);
  const [selectedUuid, setSelectedUuid] = useState(null);

  const params = useMemo(() => (statusFilter ? { status: statusFilter } : {}), [statusFilter]);
  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: "clients/it-clients", params },
    { refetchOnMountOrArgChange: true }
  );
  const clients = data?.data || [];
  const selected = clients.find((c) => c.uuid === selectedUuid) || null;

  const { data: teamData } = useGetQuery({ path: "employee/teams" });
  const teamOptions = (teamData?.data || []).map((t) => ({ value: String(t.id), label: t.name }));

  const [createClient, { isLoading: creating }] = usePostMutation();
  const [updateClient, { isLoading: updating }] = usePatchMutation();
  const [deleteClient, { isLoading: removing }] = useDeleteMutation();

  const errText = (e) => {
    if (!e) return "Request failed.";
    if (e?.data?.message) return e.data.message;
    if (e?.data?.errors) return Object.values(e.data.errors).flat().join(" ");
    if (e?.status === 403) return "You don't have permission to do this (need the it-clients permission).";
    if (e?.status === 404 || e?.originalStatus === 404) return "Endpoint not found — run `php artisan migrate` and clear route cache.";
    if (typeof e?.status === "number") return `Request failed (HTTP ${e.status}).`;
    return "Request failed. Check the console / network tab.";
  };

  const submitForm = async (body) => {
    setFormError(null);
    try {
      if (editing) await updateClient({ path: `clients/it-clients/${editing.uuid}`, body }).unwrap();
      else await createClient({ path: "clients/it-clients", body }).unwrap();
      setFormOpen(false); setEditing(null); refetch();
    } catch (e) {
      console.error("save client failed", e);
      setFormError(errText(e));
    }
  };
  const onDelete = async () => {
    try {
      const wasOpen = deleting?.uuid === selectedUuid;
      await deleteClient({ path: `clients/it-clients/${deleting.uuid}`, body: {} }).unwrap();
      setDeleting(null);
      if (wasOpen) setSelectedUuid(null);
      refetch();
    } catch (e) { console.error("delete client failed", e); }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Briefcase size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>IT Solutions Clients</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Customers and the team delivering for them {isFetching && <span style={{ color: BRAND }}>· updating…</span>}</p>
          </div>
        </div>
        {!selected && (
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-[12px] font-semibold rounded-lg outline-none" style={field}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={() => { setEditing(null); setFormError(null); setFormOpen(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg" style={{ background: BRAND }}>
              <Plus size={15} /> New client
            </button>
          </div>
        )}
      </div>

      {selected ? (
        <ClientDetail
          client={selected}
          onBack={() => setSelectedUuid(null)}
          onEdit={(c) => { setEditing(c); setFormError(null); setFormOpen(true); }}
          onAskDelete={(c) => setDeleting(c)}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : clients.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No clients yet</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Add your first IT Solutions client and assign a team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const sm = statusMeta(c.status);
            return (
              <div key={c.uuid} className="p-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{c.name}</div>
                    {c.company_name && <div className="text-[11.5px] mt-0.5 inline-flex items-center gap-1" style={{ color: TEXT_MUTED }}><Building2 size={11} /> {c.company_name}</div>}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sm.tint, color: sm.color }}>{sm.label}</span>
                </div>

                <div className="mt-3 space-y-1 text-[11.5px]" style={{ color: TEXT_SECONDARY }}>
                  {c.email && <div className="inline-flex items-center gap-1.5"><Mail size={12} style={{ color: TEXT_MUTED }} /> {c.email}</div>}
                  {c.phone && <div className="inline-flex items-center gap-1.5"><Phone size={12} style={{ color: TEXT_MUTED }} /> {c.phone}</div>}
                  <div className="inline-flex items-center gap-1.5"><Users size={12} style={{ color: BLUE }} /> {c.team?.name || <span style={{ color: TEXT_MUTED }}>Unassigned</span>}</div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={() => setSelectedUuid(c.uuid)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: "#EFF6FF", border: `1px solid ${BORDER}`, color: BLUE }}><FolderKanban size={13} /> Open · Projects</button>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditing(c); setFormError(null); setFormOpen(true); }} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={13} /> Edit</button>
                    <button onClick={() => setDeleting(c)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClientFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditing(null); setFormError(null); }} onSubmit={submitForm} client={editing} teamOptions={teamOptions} saving={creating || updating} error={formError} />
      <ConfirmDelete isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={onDelete} busy={removing} />
    </div>
  );
}
