import React, { useEffect, useMemo, useState } from "react";
import {
  Award, Users, Coins, Search, Loader2, UserPlus, CheckCircle2, AlertTriangle, X,
  User as UserIcon, Clock, AlertCircle,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import SimplePagination from "../ui/SimplePagination";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

export default function BrandAmbassadors() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [feeStatus, setFeeStatus] = useState("all"); // all|pending|overdue|paid
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [assignFor, setAssignFor] = useState(null); // ambassador row
  const [toast, setToast] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [debouncedQ, feeStatus]);
  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };

  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    if (feeStatus !== "all") p.set("fee_status", feeStatus);
    p.set("page", String(page));
    p.set("per_page", String(perPage));
    return p.toString();
  }, [debouncedQ, feeStatus, page, perPage]);

  const { data, isFetching, refetch } = useGetQuery({ path: `student/brand-ambassadors?${queryStr}` });
  const rows = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta || data?.pagination || {};
  const lastPage = meta.last_page || meta.lastPage || 1;

  const totals = useMemo(() => ({
    people: rows.length,
    referred: rows.reduce((s, r) => s + Number(r.referred_count || 0), 0),
    collected: rows.reduce((s, r) => s + Number(r.collected_from_referred || 0), 0),
  }), [rows]);

  const Chip = ({ id, label }) => (
    <button onClick={() => setFeeStatus(id)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition"
      style={feeStatus === id ? { background: BRAND, color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>{label}</button>
  );

  const Stat = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
      <span className="flex items-center justify-center rounded-lg" style={{ width: 38, height: 38, background: `${color}14`, color }}><Icon size={18} /></span>
      <div>
        <div className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{value}</div>
        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: `${BRAND}14`, color: BRAND }}><Award size={22} /></span>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>Brand Ambassadors</h1>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Who they referred, those students' fee health, and assign students to an ambassador.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <Stat icon={Award} label="Ambassadors (page)" value={totals.people} color={BRAND} />
        <Stat icon={Users} label="Students referred" value={totals.referred} color="#2563EB" />
        <Stat icon={Coins} label="Collected from referred" value={money(totals.collected)} color="#15803D" />
      </div>

      <div className="bg-white rounded-xl p-4 mb-4 flex flex-col md:flex-row md:items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg" style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}` }}>
          <Search size={15} style={{ color: TEXT_MUTED }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ambassador by name or email…"
            className="bg-transparent outline-none text-[13px] w-full" style={{ color: TEXT_PRIMARY }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Referred-student fee:</span>
          <Chip id="all" label="All" />
          <Chip id="pending" label="Has pending" />
          <Chip id="overdue" label="Has overdue" />
          <Chip id="paid" label="All paid" />
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>Ambassadors</span>
          {isFetching && <Loader2 size={16} className="animate-spin" style={{ color: TEXT_MUTED }} />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
                <th className="text-left px-4 py-2 font-semibold">Ambassador</th>
                <th className="text-center px-4 py-2 font-semibold">Referred</th>
                <th className="text-center px-4 py-2 font-semibold">Paid</th>
                <th className="text-center px-4 py-2 font-semibold">Pending</th>
                <th className="text-center px-4 py-2 font-semibold">Overdue</th>
                <th className="text-right px-4 py-2 font-semibold">Collected</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !isFetching && (
                <tr><td colSpan={7} className="text-center px-4 py-8" style={{ color: TEXT_MUTED }}>No brand ambassadors found.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {r.image
                        ? <img src={r.image} alt="" className="rounded-full object-cover" style={{ width: 34, height: 34 }} />
                        : <span className="flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: `${BRAND}14`, color: BRAND }}><UserIcon size={16} /></span>}
                      <div>
                        <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{r.name || "—"}</div>
                        <div style={{ color: TEXT_MUTED }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold" style={{ color: TEXT_PRIMARY }}>{r.referred_count}</td>
                  <td className="px-4 py-2.5 text-center" style={{ color: "#15803D" }}>{r.paid_students}</td>
                  <td className="px-4 py-2.5 text-center" style={{ color: "#B45309" }}>{r.pending_students}</td>
                  <td className="px-4 py-2.5 text-center" style={{ color: "#B91C1C" }}>{r.overdue_students}</td>
                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: TEXT_PRIMARY }}>{money(r.collected_from_referred)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setAssignFor(r)} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 ml-auto"
                      style={{ border: `1px solid ${BRAND}`, color: BRAND }}>
                      <UserPlus size={13} /> Assign student
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastPage > 1 && (
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <SimplePagination currentPage={page} lastPage={lastPage} onPageChange={setPage} alwaysShow />
          </div>
        )}
      </div>

      {assignFor && (
        <AssignStudentModal
          ambassador={assignFor}
          onClose={() => setAssignFor(null)}
          onDone={(msg) => { notify(msg); setAssignFor(null); refetch(); }}
          onError={(msg) => notify(msg, false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg" style={{ background: toast.ok ? "#15803D" : BRAND }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-[13px]">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assign-student-to-ambassador modal                                  */
/* ------------------------------------------------------------------ */
function AssignStudentModal({ ambassador, onClose, onDone, onError }) {
  const [q, setQ] = useState("");
  const [studentUuid, setStudentUuid] = useState(null);
  const [post, { isLoading }] = usePostMutation();

  const { data } = useGetQuery({ path: `finance/fee-collection/students?q=${encodeURIComponent(q)}&limit=50` });
  const students = useMemo(() => data?.data || [], [data]);
  const options = useMemo(() => students.map((s) => ({
    value: s.uuid,
    label: `${s.name}${s.course ? " — " + s.course : ""}`,
    avatarUrl: s.image || null,
  })), [students]);

  const submit = async () => {
    if (!studentUuid) { onError("Pick a student first."); return; }
    try {
      await post({ path: `student/${studentUuid}/assign-ambassador`, body: { ambassador_uuid: ambassador.uuid } }).unwrap();
      onDone(`Assigned to ${ambassador.name}.`);
    } catch (e) {
      onError(e?.data?.message || "Could not assign student.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Assign student to {ambassador.name}</span>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12px] mb-3" style={{ color: TEXT_SECONDARY }}>
            The chosen student's referrer becomes this ambassador, so they earn leaderboard and reward credit.
          </p>
          <SearchableSelect
            options={options}
            value={studentUuid}
            onChange={setStudentUuid}
            onSearch={setQ}
            showAvatars
            placeholder="Search a student…"
            label="Student"
          />
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading || !studentUuid}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #A30505)`, opacity: (isLoading || !studentUuid) ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Assign
          </button>
        </div>
      </div>
    </div>
  );
}
