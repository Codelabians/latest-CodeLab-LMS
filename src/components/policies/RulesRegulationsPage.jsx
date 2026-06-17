import { useMemo, useState } from "react";
import { Loader2, BookText, Plus, X, Pencil, Trash2 } from "lucide-react";
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const AUDIENCES = [
  { value: "student", label: "Students" },
  { value: "employee", label: "Employees" },
  { value: "both", label: "Everyone" },
];
const AUD_TONE = {
  student: { fg: "#1D4ED8", bg: "#EFF6FF" },
  employee: { fg: "#7C3AED", bg: "#F5F3FF" },
  both: { fg: "#15803D", bg: "#F0FDF4" },
};

export default function RulesRegulationsPage() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/core/policies" }, { refetchOnMountOrArgChange: true });
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [del] = useDeleteMutation();
  const [put] = usePutMutation();

  const rows = data?.data || [];
  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.audience === filter)),
    [rows, filter],
  );

  const remove = async (p) => {
    if (!window.confirm(`Delete rule "${p.title}"?`)) return;
    try {
      await del({ path: `core/policies/${p.policy_uuid}` }).unwrap();
      showToast("Rule deleted.", "success");
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not delete.", "error");
    }
  };

  const toggleActive = async (p) => {
    try {
      await put({ path: `core/policies/${p.policy_uuid}`, body: { is_active: !p.is_active } }).unwrap();
      refetch();
    } catch (e) {
      showToast(e?.data?.message || "Could not update.", "error");
    }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: "#0F172A" }}><BookText size={20} /> Rules &amp; Regulations</h1>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">Manage the rules shown to students and employees in their portals.</p>
        </div>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}><Plus size={14} /> Add rule</button>
      </div>

      <div className="flex gap-2 mb-4">
        {[{ value: "all", label: "All" }, ...AUDIENCES].map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={filter === t.value ? { background: BRAND, color: "#fff" } : { background: "#fff", color: "#475569", border: `1px solid ${BORDER}` }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[13px]" style={{ color: "#94A3B8" }}>
            <BookText size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} /> No rules yet.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Title", "Category", "Audience", "Active", ""].map((h, i) => <th key={i} className="px-4 py-2.5 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((p) => {
                const tone = AUD_TONE[p.audience] || AUD_TONE.both;
                return (
                  <tr key={p.policy_uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold" style={{ color: "#0F172A" }}>{p.title}</div>
                      <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "#94A3B8" }}>{p.content}</div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "#475569" }}>{p.category || "—"}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ color: tone.fg, background: tone.bg }}>{AUDIENCES.find((a) => a.value === p.audience)?.label || p.audience}</span></td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => toggleActive(p)} className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={p.is_active ? { color: "#15803D", background: "#F0FDF4" } : { color: "#94A3B8", background: "#F1F5F9" }}>
                        {p.is_active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold mr-2" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}><Pencil size={12} /> Edit</button>
                      <button onClick={() => remove(p)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && <RuleModal rule={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); refetch(); }} />}
    </div>
  );
}

function RuleModal({ rule, onClose, onDone }) {
  const isEdit = !!rule.policy_uuid;
  const [post, { isLoading: posting }] = usePostMutation();
  const [put, { isLoading: putting }] = usePutMutation();
  const [f, setF] = useState({
    audience: rule.audience || "student",
    category: rule.category || "",
    title: rule.title || "",
    content: rule.content || "",
    is_active: rule.is_active ?? true,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const saving = posting || putting;

  const submit = async () => {
    if (!f.title.trim()) return showToast("Enter a title.", "error");
    if (!f.content.trim()) return showToast("Enter the rule text.", "error");
    const body = { audience: f.audience, title: f.title, content: f.content, category: f.category || undefined, is_active: f.is_active };
    try {
      if (isEdit) await put({ path: `core/policies/${rule.policy_uuid}`, body }).unwrap();
      else await post({ path: "core/policies", body }).unwrap();
      showToast(isEdit ? "Rule updated." : "Rule added.", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not save.", "error");
    }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><BookText size={17} /> {isEdit ? "Edit rule" : "Add rule"}</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Applies to</label>
              <select value={f.audience} onChange={(e) => set("audience", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Category</label>
              <input value={f.category} onChange={(e) => set("category", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="e.g. Conduct" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Title</label>
            <input value={f.title} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="Rule title" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Rule text</label>
            <textarea value={f.content} onChange={(e) => set("content", e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} placeholder="Describe the rule…" />
          </div>
          <label className="flex items-center gap-2 text-[12px]" style={{ color: "#475569" }}>
            <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Visible in portals
          </label>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: saving ? 0.6 : 1 }}>
            {saving && <Loader2 size={15} className="animate-spin" />} {isEdit ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
