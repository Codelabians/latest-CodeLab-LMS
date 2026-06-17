import { useState } from "react";
import {
  Activity, Users, Briefcase, FolderKanban, CheckCircle2, AlertTriangle,
  Loader2, ArrowLeft, ListChecks,
} from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

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

const num = (n) => Number(n || 0).toLocaleString();
const MIX = [
  { key: "todo", label: "To do", color: "#CBD5E1" },
  { key: "in_progress", label: "In progress", color: BLUE },
  { key: "in_review", label: "In review", color: PURPLE },
  { key: "done", label: "Done", color: GREEN },
  { key: "blocked", label: "Blocked", color: BRAND },
];
const rateColor = (r) => (r >= 75 ? GREEN : r >= 40 ? AMBER : BRAND);

function Kpi({ icon: Icon, label, value, sub, color = TEXT_PRIMARY, tint = SURFACE }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2">
        <span className="grid place-items-center rounded-lg" style={{ width: 30, height: 30, background: tint, color }}><Icon size={15} /></span>
        <span className="text-[11.5px] font-semibold" style={{ color: TEXT_MUTED }}>{label}</span>
      </div>
      <div className="text-[22px] font-bold mt-2" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>{sub}</div>}
    </div>
  );
}

/* Stacked task-mix bar */
function MixBar({ tasks }) {
  const total = tasks?.total || 0;
  if (!total) return <div className="h-2 rounded-full" style={{ background: SURFACE }} />;
  return (
    <div className="flex h-2 overflow-hidden rounded-full" style={{ background: SURFACE }}>
      {MIX.map((m) => {
        const v = tasks[m.key] || 0;
        if (!v) return null;
        return <div key={m.key} style={{ width: `${(v / total) * 100}%`, background: m.color }} title={`${m.label}: ${v}`} />;
      })}
    </div>
  );
}

export default function TeamPerformance() {
  const [teamId, setTeamId] = useState(null);

  const { data, isLoading, isFetching } = useGetQuery(
    { path: "clients/team-performance", params: teamId ? { team_id: teamId } : {} },
    { refetchOnMountOrArgChange: true }
  );
  const d = data?.data || {};
  const teams = d.teams || [];
  const totals = d.totals || {};
  const members = d.members || [];
  const selected = teams.find((t) => t.team_id === teamId) || null;

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center gap-3 mb-5">
        {selected && (
          <button onClick={() => setTeamId(null)} className="grid w-9 h-9 rounded-lg place-items-center" style={{ background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><ArrowLeft size={16} /></button>
        )}
        <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: BRAND }}><Activity size={18} /></div>
        <div>
          <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{selected ? selected.name : "Team Performance"}</h1>
          <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>
            {selected ? "Workload by team member" : "Delivery across every team's client & project tasks"}
            {isFetching && <span style={{ color: BRAND }}> · updating…</span>}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
      ) : selected ? (
        /* ---- per-team member workload ---- */
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Kpi icon={ListChecks} label="Tasks" value={num(selected.tasks.total)} color={TEXT_PRIMARY} />
            <Kpi icon={CheckCircle2} label="Completion" value={`${selected.completion_rate}%`} color={rateColor(selected.completion_rate)} tint="#F0FDF4" />
            <Kpi icon={AlertTriangle} label="Overdue" value={num(selected.tasks.overdue)} color={BRAND} tint="#FEF2F2" />
            <Kpi icon={Users} label="Members" value={num(selected.members)} color={BLUE} tint="#EFF6FF" />
          </div>

          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <h3 className="text-[13px] font-bold px-4 py-3" style={{ color: TEXT_PRIMARY, borderBottom: `1px solid ${BORDER}` }}>Workload by member</h3>
            {members.length === 0 ? (
              <div className="py-10 text-center text-[12px]" style={{ color: TEXT_MUTED }}>No tasks for this team yet.</div>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                    {["Member", "Assigned", "Done", "Overdue", "Completion"].map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-[11px]">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, i) => {
                    const rate = m.assigned > 0 ? Math.round((m.done / m.assigned) * 100) : 0;
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-2 font-semibold" style={{ color: m.user_id ? TEXT_PRIMARY : TEXT_MUTED }}>{m.name}</td>
                        <td className="px-4 py-2" style={{ color: TEXT_SECONDARY }}>{num(m.assigned)}</td>
                        <td className="px-4 py-2" style={{ color: GREEN }}>{num(m.done)}</td>
                        <td className="px-4 py-2" style={{ color: m.overdue > 0 ? BRAND : TEXT_MUTED }}>{num(m.overdue)}</td>
                        <td className="px-4 py-2 font-semibold" style={{ color: rateColor(rate) }}>{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* ---- all-teams overview ---- */
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <Kpi icon={Users} label="Teams" value={num(totals.teams)} color={TEXT_PRIMARY} />
            <Kpi icon={Briefcase} label="Clients" value={num(totals.clients)} color={PURPLE} tint="#F5F3FF" />
            <Kpi icon={FolderKanban} label="Projects" value={num(totals.projects)} color={BLUE} tint="#EFF6FF" />
            <Kpi icon={ListChecks} label="Tasks" value={num(totals.tasks)} color={TEXT_PRIMARY} />
            <Kpi icon={CheckCircle2} label="Completion" value={`${totals.completion_rate ?? 0}%`} color={rateColor(totals.completion_rate ?? 0)} tint="#F0FDF4" />
            <Kpi icon={AlertTriangle} label="Overdue" value={num(totals.overdue)} color={BRAND} tint="#FEF2F2" />
          </div>

          {teams.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>No teams yet</p>
              <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>Create teams and assign clients/projects to see performance here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {teams.map((t) => (
                <button key={t.team_id} onClick={() => setTeamId(t.team_id)} className="p-4 text-left bg-white rounded-xl hover:shadow-md transition-shadow" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-start justify-between">
                    <div className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{t.name}</div>
                    <span className="text-[12px] font-bold" style={{ color: rateColor(t.completion_rate) }}>{t.completion_rate}%</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                    <span className="inline-flex items-center gap-1"><Users size={11} /> {t.members}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={11} /> {t.clients} clients</span>
                    <span className="inline-flex items-center gap-1"><FolderKanban size={11} /> {t.projects} projects</span>
                  </div>
                  <div className="mt-3"><MixBar tasks={t.tasks} /></div>
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <span style={{ color: TEXT_SECONDARY }}>{num(t.tasks.total)} tasks · {num(t.tasks.done)} done</span>
                    {t.tasks.overdue > 0 && <span className="inline-flex items-center gap-1 font-semibold" style={{ color: BRAND }}><AlertTriangle size={11} /> {t.tasks.overdue} overdue</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
