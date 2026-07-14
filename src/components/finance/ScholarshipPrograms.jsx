import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus, Pencil, Trash2, X, AlertTriangle, Loader2, HeartHandshake,
  Users, Eye, CheckCircle2,
} from "lucide-react";
import {
  useGetQuery, usePostMutation, usePatchMutation, useDeleteMutation,
} from "../../api/apiSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BRAND_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE = "#F8FAFC";

const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const inputStyle = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, outline: "none" };
const label = { fontSize: 12, fontWeight: 600, color: TEXT_SECONDARY, marginBottom: 4, display: "block" };

const blank = {
  name: "", description: "", criteria: "",
  monthly_fee_override: "", enrollment_fee_override: "", laptop_fee_override: "",
  is_active: true,
};

function ProgramModal({ open, mode, initial, onCancel, onSubmit, isLoading }) {
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    setF(initial ? {
      name: initial.name || "",
      description: initial.description || "",
      criteria: initial.criteria || "",
      monthly_fee_override: initial.monthly_fee_override ?? "",
      enrollment_fee_override: initial.enrollment_fee_override ?? "",
      laptop_fee_override: initial.laptop_fee_override ?? "",
      is_active: initial.is_active !== false,
    } : blank);
  }, [open, initial]);

  if (!open) return null;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) { setErr("Program name is required."); return; }
    if (f.monthly_fee_override === "" || Number(f.monthly_fee_override) < 0) { setErr("Monthly fee is required (0 or more)."); return; }
    const body = {
      name: f.name.trim(),
      description: f.description.trim() || null,
      criteria: f.criteria.trim() || null,
      monthly_fee_override: Number(f.monthly_fee_override),
      enrollment_fee_override: f.enrollment_fee_override === "" ? null : Number(f.enrollment_fee_override),
      laptop_fee_override: f.laptop_fee_override === "" ? null : Number(f.laptop_fee_override),
      is_active: !!f.is_active,
    };
    const res = await onSubmit(body);
    if (res?.error) setErr(res.error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-lg bg-white rounded-2xl p-6" style={{ border: `1px solid ${BORDER}`, fontFamily: "'Montserrat', sans-serif", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{mode === "edit" ? "Edit program" : "New scholarship / NGO program"}</h2>
          <button onClick={onCancel} style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        {err && <div className="mb-3 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2" style={{ background: BRAND_TINT, color: BRAND }}><AlertTriangle size={14} /> {err}</div>}

        <div className="space-y-3">
          <div>
            <label style={label}>Program name *</label>
            <input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. AppsUK Foundation" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={label}>Monthly fee (Rs) *</label>
              <input type="number" min="0" style={inputStyle} value={f.monthly_fee_override} onChange={(e) => set("monthly_fee_override", e.target.value)} />
            </div>
            <div>
              <label style={label}>Enrollment fee (Rs)</label>
              <input type="number" min="0" style={inputStyle} value={f.enrollment_fee_override} onChange={(e) => set("enrollment_fee_override", e.target.value)} placeholder="blank = normal" />
            </div>
            <div>
              <label style={label}>Laptop fee (Rs)</label>
              <input type="number" min="0" style={inputStyle} value={f.laptop_fee_override} onChange={(e) => set("laptop_fee_override", e.target.value)} placeholder="blank = normal" />
            </div>
          </div>
          <p className="text-[11px]" style={{ color: TEXT_MUTED }}>These are the fixed amounts a sponsored student pays. The difference from the normal fee is recorded as this program&apos;s subsidy. Leave enrollment/laptop blank to charge the normal fee.</p>
          <div>
            <label style={label}>Eligibility criteria</label>
            <textarea rows={3} style={inputStyle} value={f.criteria} onChange={(e) => set("criteria", e.target.value)} placeholder="Who qualifies for this program?" />
          </div>
          <div>
            <label style={label}>Description</label>
            <textarea rows={2} style={inputStyle} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            <span className="text-[13px]" style={{ color: TEXT_SECONDARY }}>Active</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={save} disabled={isLoading} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportDrawer({ program, onClose }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isFetching, refetch } = useGetQuery(
    { path: `student/scholarship-programs/${program.uuid}/report`, params: { from: from || undefined, to: to || undefined } },
    { refetchOnMountOrArgChange: true },
  );
  const r = data?.data;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto p-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-bold" style={{ color: TEXT_PRIMARY }}>{program.name} — subsidy report</h2>
            <p className="text-[12px]" style={{ color: TEXT_MUTED }}>How much was waived/funded, per student.</p>
          </div>
          <button onClick={onClose} style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>

        <div className="flex items-end gap-2 mb-4">
          <div><label style={label}>From</label><input type="date" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label style={label}>To</label><input type="date" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button onClick={() => refetch()} className="px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>Apply</button>
        </div>

        {isFetching ? (
          <div className="py-10 text-center" style={{ color: TEXT_MUTED }}><Loader2 size={18} className="inline animate-spin" /> Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl p-3" style={{ background: BRAND_TINT }}>
                <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Total subsidy</div>
                <div className="text-[18px] font-bold" style={{ color: BRAND }}>{money(r?.totals?.total_subsidy)}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: SURFACE }}>
                <div className="text-[11px]" style={{ color: TEXT_MUTED }}>Assigned students</div>
                <div className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{r?.totals?.assigned_students ?? 0}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: SURFACE }}>
                <div className="text-[11px]" style={{ color: TEXT_MUTED }}>With subsidy</div>
                <div className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>{r?.totals?.students_with_subsidy ?? 0}</div>
              </div>
            </div>

            <h3 className="text-[13px] font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Subsidy by student</h3>
            <div className="rounded-xl overflow-hidden mb-5" style={{ border: `1px solid ${BORDER}` }}>
              <table className="w-full text-[12px]">
                <thead><tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                  <th className="text-left px-3 py-2">Student</th><th className="text-right px-3 py-2">Months</th><th className="text-right px-3 py-2">Subsidy</th>
                </tr></thead>
                <tbody>
                  {(r?.students || []).length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center" style={{ color: TEXT_MUTED }}>No subsidy recorded in this range.</td></tr>}
                  {(r?.students || []).map((s) => (
                    <tr key={s.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-3 py-2" style={{ color: TEXT_PRIMARY }}>{s.name || s.email}</td>
                      <td className="px-3 py-2 text-right" style={{ color: TEXT_SECONDARY }}>{s.installments}</td>
                      <td className="px-3 py-2 text-right font-semibold" style={{ color: BRAND }}>{money(s.subsidy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-[13px] font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Assigned students</h3>
            <div className="flex flex-wrap gap-2">
              {(r?.assigned_students || []).length === 0 && <span className="text-[12px]" style={{ color: TEXT_MUTED }}>None assigned yet.</span>}
              {(r?.assigned_students || []).map((s) => (
                <span key={s.uuid} className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: s.active ? "#F0FDF4" : SURFACE, color: s.active ? "#15803D" : TEXT_MUTED }}>{s.name || s.email}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ScholarshipPrograms() {
  const user = useSelector(selectCurrentUser);
  const canManage = hasPermission(user, "create scholarship-programs");

  const [formModal, setFormModal] = useState({ open: false, mode: null, program: null });
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [reportFor, setReportFor] = useState(null);

  const { data, isLoading, refetch } = useGetQuery({ path: "student/scholarship-programs", params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];

  const [createP, { isLoading: creating }] = usePostMutation();
  const [updateP, { isLoading: updating }] = usePatchMutation();
  const [deleteP] = useDeleteMutation();

  const handleSubmit = async (payload) => {
    try {
      if (formModal.mode === "edit") {
        await updateP({ path: `student/scholarship-programs/${formModal.program.uuid}`, body: payload }).unwrap();
        showToast("Program updated", "success");
      } else {
        await createP({ path: "student/scholarship-programs", body: payload }).unwrap();
        showToast("Program created", "success");
      }
      setFormModal({ open: false, mode: null, program: null });
      refetch();
      return { error: null };
    } catch (err) {
      const errs = err?.data?.errors || {};
      return { error: Object.values(errs)[0]?.[0] || err?.data?.message || "Could not save program." };
    }
  };

  const handleDelete = async () => {
    try {
      await deleteP({ path: `student/scholarship-programs/${deleteDialog.uuid}` }).unwrap();
      showToast("Program deleted", "success");
      setDeleteDialog(null);
      refetch();
    } catch (err) {
      showToast(err?.data?.message || "Could not delete.", "error");
    }
  };

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_TINT, color: BRAND }}><HeartHandshake size={18} /></div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Scholarship / NGO Programs</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Sponsored students pay each program&apos;s fixed fees; the waived difference is tracked per program.</p>
          </div>
        </div>
        {canManage && (
          <button type="button" onClick={() => setFormModal({ open: true, mode: "add", program: null })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }}>
            <Plus size={15} /> Add program
          </button>
        )}
      </div>

      <div className="overflow-hidden bg-white rounded-xl" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full">
          <thead style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
              <th className="px-5 py-3">Program</th>
              <th className="px-5 py-3">Monthly</th>
              <th className="px-5 py-3">Enrollment</th>
              <th className="px-5 py-3">Laptop</th>
              <th className="px-5 py-3">Students</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}><Loader2 size={16} className="inline animate-spin" /> Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No programs yet.</td></tr>}
            {rows.map((p) => (
              <tr key={p.uuid} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-5 py-3">
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{p.name}</div>
                  {p.criteria && <div className="text-[11px] mt-0.5" style={{ color: TEXT_MUTED }}>{p.criteria.length > 80 ? p.criteria.slice(0, 80) + "…" : p.criteria}</div>}
                </td>
                <td className="px-5 py-3 text-[13px]" style={{ color: TEXT_PRIMARY }}>{money(p.monthly_fee_override)}</td>
                <td className="px-5 py-3 text-[13px]" style={{ color: TEXT_SECONDARY }}>{p.enrollment_fee_override === null || p.enrollment_fee_override === undefined ? "—" : money(p.enrollment_fee_override)}</td>
                <td className="px-5 py-3 text-[13px]" style={{ color: TEXT_SECONDARY }}>{p.laptop_fee_override === null || p.laptop_fee_override === undefined ? "—" : money(p.laptop_fee_override)}</td>
                <td className="px-5 py-3 text-[13px]" style={{ color: TEXT_SECONDARY }}><Users size={12} className="inline mr-1" />{p.users_count ?? 0}</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: p.is_active ? "#F0FDF4" : SURFACE, color: p.is_active ? "#15803D" : TEXT_MUTED }}>{p.is_active ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setReportFor(p)} title="Subsidy report" className="p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: "#1D4ED8" }}><Eye size={14} /></button>
                    {canManage && <button onClick={() => setFormModal({ open: true, mode: "edit", program: p })} title="Edit" className="p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}><Pencil size={14} /></button>}
                    {canManage && <button onClick={() => setDeleteDialog(p)} title="Delete" className="p-1.5 rounded-lg" style={{ border: "1px solid #FCA5A5", color: BRAND }}><Trash2 size={14} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProgramModal
        open={formModal.open}
        mode={formModal.mode}
        initial={formModal.program}
        onCancel={() => setFormModal({ open: false, mode: null, program: null })}
        onSubmit={handleSubmit}
        isLoading={creating || updating}
      />

      {reportFor && <ReportDrawer program={reportFor} onClose={() => setReportFor(null)} />}

      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <h3 className="text-[15px] font-bold mb-2" style={{ color: TEXT_PRIMARY }}>Delete program?</h3>
            <p className="text-[13px] mb-4" style={{ color: TEXT_SECONDARY }}>Delete <b>{deleteDialog.name}</b>? Students already assigned keep their current fees; only the program definition is removed.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteDialog(null)} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
