import { Check, X, Loader2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

// "manage get-course" -> { verb:"get", resource:"course" }; "dashboard" -> { verb:"access", resource:"dashboard" }
const parsePermission = (label) => {
  const slug = String(label || "").replace(/^manage\s+/i, "").trim();
  const idx = slug.indexOf("-");
  if (idx === -1) return { verb: "access", resource: slug || "general", slug };
  return { verb: slug.slice(0, idx), resource: slug.slice(idx + 1), slug };
};
const pretty = (s) => String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const VERB_LABEL = { get: "View", create: "Create", update: "Edit", delete: "Delete", access: "Access" };

const AssignPermissionModal = ({ isOpen, onClose, role, permissions = [], onSave, isSubmitting = false }) => {
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());

  // Pre-select the role's current permissions whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    const existing = (role?.permissions || []).map((p) => (typeof p === "object" ? p.id : p));
    setSelected(new Set(existing));
    setQuery("");
    setCollapsed(new Set());
  }, [role, isOpen]);

  // Group permissions by resource.
  const groups = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      const { verb, resource } = parsePermission(p.label);
      (map[resource] = map[resource] || []).push({ id: p.value, verb, label: p.label });
    });
    return Object.entries(map)
      .map(([resource, items]) => ({ resource, items: items.sort((a, b) => a.verb.localeCompare(b.verb)) }))
      .sort((a, b) => a.resource.localeCompare(b.resource));
  }, [permissions]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => g.resource.toLowerCase().includes(q) || it.label.toLowerCase().includes(q) || it.verb.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  if (!isOpen) return null;

  const total = permissions.length;
  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const setMany = (ids, on) => setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; });
  const toggleGroupCollapse = (r) => setCollapsed((prev) => { const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n; });

  const allVisibleIds = filteredGroups.flatMap((g) => g.items.map((i) => i.id));
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)", fontFamily: "'Montserrat', sans-serif" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "88vh" }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: "#0F172A" }}>Permissions</h2>
            <p className="text-[12px]" style={{ color: "#94A3B8" }}>Role: <span style={{ color: BRAND, fontWeight: 600 }}>{pretty(role?.name)}</span> · {selected.size} of {total} selected</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search permissions…" className="w-full pl-8 pr-3 py-2 rounded-lg text-[12.5px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <button onClick={() => setMany(allVisibleIds, !allVisibleSelected)} className="px-3 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>
            {allVisibleSelected ? "Clear shown" : "Select shown"}
          </button>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: "#94A3B8" }}>No permissions match your search.</div>
          ) : filteredGroups.map((g) => {
            const ids = g.items.map((i) => i.id);
            const sel = ids.filter((id) => selected.has(id)).length;
            const all = sel === ids.length;
            const isCollapsed = collapsed.has(g.resource);
            return (
              <div key={g.resource} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "#F8FAFC" }}>
                  <button onClick={() => toggleGroupCollapse(g.resource)} className="text-slate-400">{isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</button>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input type="checkbox" checked={all} ref={(el) => { if (el) el.indeterminate = sel > 0 && !all; }} onChange={() => setMany(ids, !all)} />
                    <span className="text-[13px] font-bold" style={{ color: "#0F172A" }}>{pretty(g.resource)}</span>
                  </label>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sel ? "#FEF2F2" : "#F1F5F9", color: sel ? BRAND : "#94A3B8" }}>{sel}/{ids.length}</span>
                </div>
                {!isCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-3 py-2.5">
                    {g.items.map((it) => {
                      const on = selected.has(it.id);
                      return (
                        <button key={it.id} type="button" onClick={() => toggle(it.id)} title={it.label}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                          style={on ? { background: BRAND, color: "#fff" } : { background: "#fff", color: "#475569", border: `1px solid ${BORDER}` }}>
                          {on ? <Check size={13} /> : <span style={{ width: 13 }} />} {VERB_LABEL[it.verb] || pretty(it.verb)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
          <span className="text-[12px]" style={{ color: "#94A3B8" }}>{selected.size} permission(s) selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
            <button onClick={() => onSave(Array.from(selected))} disabled={isSubmitting} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isSubmitting ? 0.6 : 1 }}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPermissionModal;
