import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { PauseCircle, Loader2, Search, RotateCcw, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import SimplePagination from "../ui/SimplePagination";
import { FeeRecordModal } from "../finance/FeeStatusList";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
const hasPermission = (u, p) => (!u ? false : u.role === "admin" || (u.permissions || []).includes(p));

export default function StudentsOnBreak() {
  const currentUser = useSelector(selectCurrentUser);
  const canManage = hasPermission(currentUser, "update student");
  const canSkipFinance = hasPermission(currentUser, "record historical-payment");

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [recordFor, setRecordFor] = useState(null);
  const [toast, setToast] = useState(null);
  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800); };

  useEffect(() => { const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage, on_break: 1 };
    if (q) p.q = q;
    return p;
  }, [page, perPage, q]);

  const { data, isFetching, refetch } = useGetQuery({ path: "/student/students", params });
  const rows = data?.data || [];
  const meta = data?.meta?.pagination || data?.meta || data?.pagination || {};
  const total = meta.total || rows.length;

  const [resumePost, { isLoading: resuming }] = usePostMutation();
  const [resumeUuid, setResumeUuid] = useState(null);
  const resume = async (uuid) => {
    setResumeUuid(uuid);
    try {
      await resumePost({ path: `student/${uuid}/resume-break`, body: {} }).unwrap();
      notify("Student resumed from break.");
      refetch();
    } catch (e) {
      notify(e?.data?.message || "Could not resume the student.", false);
    } finally { setResumeUuid(null); }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: "#EFF6FF", color: "#1D4ED8" }}><PauseCircle size={22} /></span>
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: TEXT_PRIMARY }}>Students on Break</h1>
          <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Students who paused with no set return date. Their billing is frozen until you resume them.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 mb-4 flex items-center gap-2" style={{ border: `1px solid ${BORDER}` }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute -translate-y-1/2 left-3 top-1/2" style={{ color: TEXT_MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, CNIC, phone…"
            className="w-full py-2 pr-3 text-sm rounded-lg outline-none pl-9"
            style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }} />
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-2.5 flex items-center justify-between text-[12px]" style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
          <span>{total} student{total === 1 ? "" : "s"} on break</span>
          {isFetching && <Loader2 size={14} className="animate-spin" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: SURFACE_HOVER, color: TEXT_SECONDARY }}>
                <th className="px-4 py-2.5 text-left font-semibold">Student</th>
                <th className="px-4 py-2.5 text-left font-semibold">Course / Batch</th>
                <th className="px-4 py-2.5 text-left font-semibold">On break since</th>
                <th className="px-4 py-2.5 text-right font-semibold">Paid</th>
                <th className="px-4 py-2.5 text-right font-semibold">Outstanding</th>
                <th className="px-4 py-2.5 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {!isFetching && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center" style={{ color: TEXT_MUTED }}>No students are on break.</td></tr>
              )}
              {rows.map((s) => (
                <tr key={s.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold" style={{ color: TEXT_PRIMARY }}>{s.name}</div>
                    <div className="text-[11px]" style={{ color: TEXT_MUTED }}>{s.email}</div>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>{s.course || "—"}{s.batch ? ` · ${s.batch}` : ""}</td>
                  <td className="px-4 py-2.5" style={{ color: TEXT_SECONDARY }}>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>{s.break_since || "—"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ color: "#15803D" }}>{money(s.collected)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: Number(s.pending) > 0 ? BRAND : TEXT_MUTED }}>{money(s.pending)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <button onClick={() => setRecordFor(s)} title="View fees" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><Eye size={13} /> Fees</button>
                      {canManage && (
                        <button onClick={() => resume(s.uuid)} disabled={resuming && resumeUuid === s.uuid} title="Resume — reactivate billing" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#15803D", opacity: resuming && resumeUuid === s.uuid ? 0.6 : 1 }}>
                          {resuming && resumeUuid === s.uuid ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Resume
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <SimplePagination page={page} total={total} perPage={perPage} onPageChange={setPage} onPerPageChange={(n) => { setPerPage(n); setPage(1); }} alwaysShow />
        </div>
      </div>

      {recordFor && <FeeRecordModal student={recordFor} canSkipFinance={canSkipFinance} onClose={() => setRecordFor(null)} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white flex items-center gap-2 shadow-lg" style={{ background: toast.ok ? "#15803D" : BRAND }}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-[13px]">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
