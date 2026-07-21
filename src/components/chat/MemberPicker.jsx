import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";
import {
  BRAND, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SURFACE,
} from "./chatTheme";

/*
 * Shared member picker with Staff / Students tabs + debounced search.
 * - Staff rows come from communication/reminders/recipients?q=
 * - Student rows come from the students list endpoint (?q= search)
 * `selected` is a map keyed by user id → {id, name, role}; `onToggle(row)`
 * flips one entry. `excludeIds` hides users who are already members.
 */
export default function MemberPicker({ selected, onToggle, excludeIds = [] }) {
  const [tab, setTab] = useState("staff"); // 'staff' | 'students'
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: staffData, isFetching: staffFetching } = useGetQuery(
    { path: "communication/reminders/recipients", params: { q: q || undefined, per_page: 50 } },
    { skip: tab !== "staff" },
  );
  const { data: studentData, isFetching: studentsFetching } = useGetQuery(
    { path: "/student/students", params: { q: q || undefined, per_page: 50, page: 1 } },
    { skip: tab !== "students" },
  );

  const isFetching = tab === "staff" ? staffFetching : studentsFetching;
  const rows =
    tab === "staff"
      ? (staffData?.data || []).map((r) => ({
          id: r.user_id ?? r.id,
          name: r.name,
          role: r.role || "staff",
        }))
      : (studentData?.data || []).map((r) => ({
          id: r.user_id ?? r.id,
          name: r.name,
          role: "student",
        }));

  const visible = rows.filter((r) => r.id != null && !excludeIds.includes(r.id));
  const selectedCount = Object.keys(selected).length;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 mb-2 rounded-lg" style={{ background: SURFACE }}>
        {[
          { key: "staff", label: "Staff" },
          { key: "students", label: "Students" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); setSearch(""); setQ(""); }}
            className="flex-1 py-1.5 text-[12px] font-semibold rounded-md"
            style={{
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? BRAND : TEXT_SECONDARY,
              boxShadow: tab === t.key ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search size={14} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "staff" ? "Search staff…" : "Search students…"}
          className="w-full py-2 pl-9 pr-3 text-sm rounded-lg outline-none"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
        />
      </div>

      <div className="flex items-center justify-end px-1 mb-1">
        <span className="text-[11.5px] font-semibold" style={{ color: selectedCount ? BRAND : TEXT_MUTED }}>
          {selectedCount} selected
        </span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto rounded-lg" style={{ maxHeight: 220, border: `1px solid ${BORDER}` }}>
        {isFetching && (
          <div className="flex items-center justify-center gap-2 py-6 text-[12px]" style={{ color: TEXT_MUTED }}>
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        )}
        {!isFetching && visible.length === 0 && (
          <div className="py-6 text-center text-[12px]" style={{ color: TEXT_MUTED }}>
            No {tab === "staff" ? "staff" : "students"} found.
          </div>
        )}
        {!isFetching &&
          visible.map((r) => (
            <label
              key={`${tab}-${r.id}`}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#F8FAFC]"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <input type="checkbox" checked={!!selected[r.id]} onChange={() => onToggle(r)} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{r.name}</span>
                {r.role && <span className="block text-[11px] capitalize truncate" style={{ color: TEXT_MUTED }}>{r.role}</span>}
              </span>
            </label>
          ))}
      </div>
    </div>
  );
}
