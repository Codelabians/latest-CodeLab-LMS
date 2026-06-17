import { useMemo, useState } from "react";
import {
  Users, Plus, X, Pencil, Trash2, ArrowLeft, Crown, Loader2, Building2, UserPlus,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";

/* ---- design tokens (match dashboards / Finance Stats) ---- */
const BRAND = "#C90606";
const BLUE = "#1D4ED8";
const GREEN = "#15803D";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

const field = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
const initials = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

/* ------------------------- Create / Edit modal ------------------------- */
function TeamFormModal({ isOpen, onClose, onSubmit, team, employeeOptions, saving }) {
  const isEdit = !!team;
  const [name, setName] = useState("");
  const [lead, setLead] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Reset whenever the modal opens.
  useMemo(() => {
    if (isOpen) {
      setName(team?.name || "");
      setLead(team?.lead_user_id ? String(team.lead_user_id) : "");
      setDescription(team?.description || "");
      setIsActive(team ? !!team.is_active : true);
    }
  }, [isOpen, team]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-md p-6 bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="grid rounded-lg place-items-center" style={{ width: 36, height: 36, background: "#FEF2F2", color: BRAND }}><Users size={17} /></span>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{isEdit ? "Edit team" : "New team"}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Team name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Web Squad A" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Team lead</label>
            <SearchableSelect options={employeeOptions} value={lead} onChange={(v) => setLead(v || "")} placeholder="Select a lead (optional)" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this team works on…" className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={field} />
          </div>
          <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer" style={{ color: TEXT_SECONDARY }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
          </label>
        </div>

        <div className="flex gap-2 pt-5">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button
            onClick={() => onSubmit({ name: name.trim(), lead_user_id: lead ? Number(lead) : null, description: description.trim() || null, is_active: isActive })}
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>
            {saving ? "Saving…" : isEdit ? "Update team" : "Create team"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ isOpen, onClose, onConfirm, busy, label }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 text-center bg-white rounded-2xl" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="grid w-12 h-12 mx-auto mb-3 rounded-full place-items-center" style={{ background: "#FEF2F2", color: BRAND }}><Trash2 size={22} /></div>
        <h2 className="text-[15px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>{label}</h2>
        <p className="text-[12px] mb-5" style={{ color: TEXT_MUTED }}>This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{busy ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- detail -------------------------------- */
function TeamDetail({ uuid, employees, onBack, onEdit, onDeleted }) {
  const { data, isLoading, isFetching, refetch } = useGetQuery({ path: `employee/teams/${uuid}` }, { refetchOnMountOrArgChange: true });
  const team = data?.data;
  const members = team?.members || [];

  const [role, setRole] = useState("");
  const [pickUser, setPickUser] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const [addMember, { isLoading: adding }] = usePostMutation();
  const [removeMember] = useDeleteMutation();
  const [deleteTeam, { isLoading: deleting }] = useDeleteMutation();

  const memberIds = new Set(members.map((m) => m.id));
  const addable = employees.filter((e) => !memberIds.has(e.id)).map((e) => ({ value: String(e.id), label: e.employee_id ? `${e.name} · ${e.employee_id}` : e.name }));

  const onAdd = async () => {
    if (!pickUser) return;
    try {
      await addMember({ path: `employee/teams/${uuid}/members`, body: { user_id: Number(pickUser), role_in_team: role.trim() || null } }).unwrap();
      setPickUser(""); setRole(""); refetch();
    } catch (e) { console.error("add member failed", e); }
  };
  const onRemove = async (userId) => {
    try { await removeMember({ path: `employee/teams/${uuid}/members/${userId}`, body: {} }).unwrap(); refetch(); }
    catch (e) { console.error("remove member failed", e); }
  };
  const onDelete = async () => {
    try { await deleteTeam({ path: `employee/teams/${uuid}`, body: {} }).unwrap(); setConfirmDel(false); onDeleted(); }
    catch (e) { console.error("delete team failed", e); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
  if (!team) return <div className="py-16 text-center text-[13px]" style={{ color: BRAND }}>Team not found.</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="grid w-9 h-9 rounded-lg place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ArrowLeft size={16} /></button>
          <div>
            <h2 className="text-[16px] font-bold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}>
              {team.name}
              {!team.is_active && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: SURFACE, color: TEXT_MUTED }}>Inactive</span>}
            </h2>
            <p className="text-[11.5px] flex items-center gap-2" style={{ color: TEXT_MUTED }}>
              {team.brand?.name && <span className="inline-flex items-center gap-1"><Building2 size={12} /> {team.brand.name}</span>}
              <span>· {members.length} member{members.length === 1 ? "" : "s"}</span>
              {isFetching && <span style={{ color: BRAND }}>· updating…</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(team)} className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={14} /> Edit</button>
          <button onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      {team.description && (
        <div className="px-4 py-3 mb-4 text-[12.5px] bg-white rounded-xl" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>{team.description}</div>
      )}

      {/* Add member */}
      <div className="flex flex-wrap items-end gap-2 px-4 py-3 mb-4 bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div style={{ minWidth: 240, flex: 1 }}>
          <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}>Add employee</label>
          <SearchableSelect options={addable} value={pickUser} onChange={(v) => setPickUser(v || "")} placeholder="Search employees…" />
        </div>
        <div style={{ width: 160 }}>
          <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_MUTED }}>Role on team</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
        </div>
        <button onClick={onAdd} disabled={!pickUser || adding} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: GREEN }}>
          <UserPlus size={15} /> {adding ? "Adding…" : "Add"}
        </button>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>Members</h3>
        {members.length === 0 ? (
          <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No members yet. Add employees above.</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3">
                <span className="grid rounded-full place-items-center text-[11px] font-bold" style={{ width: 32, height: 32, background: SURFACE, color: TEXT_SECONDARY }}>{initials(m.name)}</span>
                <div>
                  <div className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}>
                    {m.name}
                    {m.is_lead && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#FFFBEB", color: "#B45309" }}><Crown size={10} /> Lead</span>}
                  </div>
                  <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{m.role_in_team || m.email || "—"}</div>
                </div>
              </div>
              <button onClick={() => onRemove(m.id)} className="grid rounded-md w-7 h-7 place-items-center" style={{ background: "#FEF2F2", border: `1px solid ${BORDER}`, color: BRAND }}><X size={14} /></button>
            </div>
          ))
        )}
      </div>

      <ConfirmDelete isOpen={confirmDel} onClose={() => setConfirmDel(false)} onConfirm={onDelete} busy={deleting} label="Delete this team?" />
    </div>
  );
}

/* ------------------------------- main ---------------------------------- */
export default function TeamsManagement() {
  const [selected, setSelected] = useState(null);   // team uuid
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: listData, isLoading, isFetching, refetch } = useGetQuery({ path: "employee/teams" }, { refetchOnMountOrArgChange: true });
  const teams = listData?.data || [];

  const { data: empData } = useGetQuery({ path: "employee/teams/employees" });
  const employees = empData?.data || [];
  const employeeOptions = employees.map((e) => ({ value: String(e.id), label: e.employee_id ? `${e.name} · ${e.employee_id}` : e.name }));

  const [createTeam, { isLoading: creating }] = usePostMutation();
  const [updateTeam, { isLoading: updating }] = usePatchMutation();

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (team) => { setEditing(team); setFormOpen(true); };

  const submitForm = async (body) => {
    try {
      if (editing) await updateTeam({ path: `employee/teams/${editing.uuid}`, body }).unwrap();
      else await createTeam({ path: "employee/teams", body }).unwrap();
      setFormOpen(false); setEditing(null); refetch();
    } catch (e) { console.error("save team failed", e); }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Users size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Teams</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Squads of employees for IT Solutions {isFetching && !selected && <span style={{ color: BRAND }}>· updating…</span>}</p>
          </div>
        </div>
        {!selected && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white rounded-lg" style={{ background: BRAND }}>
            <Plus size={15} /> New team
          </button>
        )}
      </div>

      {selected ? (
        <TeamDetail
          uuid={selected}
          employees={employees}
          onBack={() => { setSelected(null); refetch(); }}
          onEdit={openEdit}
          onDeleted={() => { setSelected(null); refetch(); }}
        />
      ) : isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : teams.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
          <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No teams yet</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Create your first team to start grouping employees.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <button key={t.uuid} onClick={() => setSelected(t.uuid)} className="p-4 text-left transition-shadow bg-white rounded-xl hover:shadow-md" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-start justify-between">
                <span className="grid rounded-lg place-items-center" style={{ width: 38, height: 38, background: "#FEF2F2", color: BRAND }}><Users size={18} /></span>
                {!t.is_active && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: SURFACE, color: TEXT_MUTED }}>Inactive</span>}
              </div>
              <div className="text-[15px] font-bold mt-3" style={{ color: TEXT_PRIMARY }}>{t.name}</div>
              <div className="text-[11.5px] mt-0.5 flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
                {t.brand?.name && <span className="inline-flex items-center gap-1"><Building2 size={11} /> {t.brand.name}</span>}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[11.5px]" style={{ color: TEXT_SECONDARY }}>
                <span className="inline-flex items-center gap-1"><Users size={13} style={{ color: BLUE }} /> {t.members_count ?? 0} members</span>
                {t.lead?.name && <span className="inline-flex items-center gap-1"><Crown size={13} style={{ color: "#B45309" }} /> {t.lead.name}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <TeamFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={submitForm} team={editing} employeeOptions={employeeOptions} saving={creating || updating} />
    </div>
  );
}
