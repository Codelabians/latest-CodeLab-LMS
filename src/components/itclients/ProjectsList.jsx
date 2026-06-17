import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban, Loader2, Building2, Users, CalendarClock, LayoutDashboard, Search,
  Plus, X,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

/* ---- tokens ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const AMBER = "#B45309";
const PURPLE = "#7C3AED";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";
const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

const STATUSES = [
  { value: "planned", label: "Planned", color: BLUE, tint: "#EFF6FF" },
  { value: "in_progress", label: "In progress", color: GREEN, tint: "#F0FDF4" },
  { value: "on_hold", label: "On hold", color: AMBER, tint: "#FFFBEB" },
  { value: "completed", label: "Completed", color: PURPLE, tint: "#F5F3FF" },
  { value: "cancelled", label: "Cancelled", color: BRAND, tint: "#FEF2F2" },
];
const statusMeta = (s) => STATUSES.find((x) => x.value === s) || STATUSES[0];
const TYPES = [
  { value: "software", label: "Software", color: BLUE, tint: "#EFF6FF" },
  { value: "social_media", label: "Social media", color: PURPLE, tint: "#F5F3FF" },
  { value: "seo", label: "SEO", color: GREEN, tint: "#F0FDF4" },
  { value: "other", label: "Other", color: TEXT_MUTED, tint: SURFACE },
];
const typeMeta = (t) => TYPES.find((x) => x.value === t) || TYPES[0];

/* ------------------------- Create project modal ------------------------- */
function CreateProjectModal({ isOpen, onClose, onSubmit, clientOptions, saving, error }) {
  const [form, setForm] = useState({});
  useMemo(() => {
    if (isOpen) setForm({ it_client_id: "", name: "", type: "software", status: "planned", start_date: "", due_date: "", description: "" });
  }, [isOpen]);
  if (!isOpen) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#EFF6FF", color: BLUE }}><FolderKanban size={17} /></span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>New project</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Client</label>
            <SearchableSelect options={clientOptions} value={form.it_client_id || ""} onChange={(v) => set("it_client_id", v || "")} placeholder="Select a client" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Project name</label>
            <input value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Fudchef mobile app" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Type</label>
              <select value={form.type || "software"} onChange={(e) => set("type", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Status</label>
              <select value={form.status || "planned"} onChange={(e) => set("status", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Start date</label>
              <input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Due date</label>
              <input type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} className="w-full px-2 py-2 text-sm rounded-lg outline-none" style={field} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Description</label>
            <textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
        </div>
        {error && <div className="mt-4 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", color: BRAND, border: `1px solid ${BORDER}` }}>{error}</div>}
        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onSubmit({
              it_client_id: form.it_client_id ? Number(form.it_client_id) : null,
              name: (form.name || "").trim(),
              type: form.type || "software",
              status: form.status || "planned",
              start_date: form.start_date || null,
              due_date: form.due_date || null,
              description: (form.description || "").trim() || null,
            })}
            disabled={!form.it_client_id || !form.name?.trim() || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            {saving ? "Saving…" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createErr, setCreateErr] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (status) p.status = status;
    if (type) p.type = type;
    if (q.trim()) p.q = q.trim();
    return p;
  }, [status, type, q]);

  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: "clients/projects", params },
    { refetchOnMountOrArgChange: true }
  );
  const projects = data?.data || [];

  const { data: clientData } = useGetQuery({ path: "clients/it-clients" });
  const clientOptions = (clientData?.data || []).map((c) => ({ value: String(c.id), label: c.company_name ? `${c.name} · ${c.company_name}` : c.name }));

  const [createProject, { isLoading: creating }] = usePostMutation();
  const submitCreate = async (body) => {
    setCreateErr(null);
    try {
      const res = await createProject({ path: "clients/projects", body }).unwrap();
      setCreateOpen(false);
      refetch();
      const newUuid = res?.data?.uuid;
      if (newUuid) navigate(`/dashboard/it-solutions/projects/${newUuid}`);
    } catch (e) {
      console.error("create project failed", e);
      setCreateErr(e?.data?.message || (e?.status === 404 ? "Endpoint not found — restart backend after migrating." : `Request failed (HTTP ${e?.status ?? "?"}).`));
    }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><FolderKanban size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Projects</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>All delivery projects · open a board for its sprints & tasks {isFetching && <span style={{ color: BRAND }}>· updating…</span>}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={13} style={{ color: TEXT_MUTED, position: "absolute", left: 9, top: 9 }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="py-2 pl-7 pr-3 text-[12px] rounded-lg outline-none" style={field} />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 text-[12px] font-semibold rounded-lg outline-none" style={field}>
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-[12px] font-semibold rounded-lg outline-none" style={field}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => { setCreateErr(null); setCreateOpen(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg" style={{ background: BRAND }}>
            <Plus size={15} /> New project
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No projects found</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Create projects from a client, then open their boards here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const sm = statusMeta(p.status);
            const tm = typeMeta(p.type);
            return (
              <button key={p.uuid} onClick={() => navigate(`/dashboard/it-solutions/projects/${p.uuid}`)} className="p-4 text-left bg-white rounded-xl hover:shadow-md transition-shadow" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{p.name}</div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sm.tint, color: sm.color }}>{sm.label}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tm.tint, color: tm.color }}>{tm.label}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-[11.5px]" style={{ color: TEXT_SECONDARY }}>
                  {p.client?.name && <div className="inline-flex items-center gap-1.5"><Building2 size={12} style={{ color: TEXT_MUTED }} /> {p.client.name}</div>}
                  <div className="inline-flex items-center gap-1.5"><Users size={12} style={{ color: BLUE }} /> {p.team?.name || <span style={{ color: TEXT_MUTED }}>Unassigned</span>}</div>
                  {(p.start_date || p.due_date) && <div className="inline-flex items-center gap-1.5" style={{ color: TEXT_MUTED }}><CalendarClock size={12} /> {p.start_date || "—"} → {p.due_date || "—"}</div>}
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg" style={{ background: "#EFF6FF", color: BLUE }}><LayoutDashboard size={13} /> Open board</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateProjectModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSubmit={submitCreate} clientOptions={clientOptions} saving={creating} error={createErr} />
    </div>
  );
}
