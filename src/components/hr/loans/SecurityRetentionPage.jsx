import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ShieldCheck, Loader2 } from "lucide-react";

import { useGetQuery, usePostMutation, usePatchMutation } from "../../../api/apiSlice";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { showToast } from "../../ui/common/ShowToast";
import SearchableSelect from "../../ui/SearchableSelect";

const BRAND_RED      = "#C90606";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY   = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED     = "#94A3B8";
const BORDER         = "#EEF2F6";
const SURFACE_ALT    = "#F8FAFC";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const thisYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const STATUS_META = {
  pending:    { label: "Not configured", fg: "#64748B", bg: "#F1F5F9" },
  collecting: { label: "Collecting",     fg: "#A16207", bg: "#FEFCE8" },
  held:       { label: "Fully held",     fg: "#15803D", bg: "#F0FDF4" },
  released:   { label: "Released",       fg: "#1D4ED8", bg: "#EFF6FF" },
  forfeited:  { label: "Forfeited",      fg: "#B91C1C", bg: "#FEF2F2" },
};

const HOLD_META = {
  scheduled: { label: "Scheduled", fg: "#A16207", bg: "#FEFCE8" },
  held:      { label: "Held",      fg: "#15803D", bg: "#F0FDF4" },
  deferred:  { label: "Deferred",  fg: "#1D4ED8", bg: "#EFF6FF" },
  cancelled: { label: "Cancelled", fg: "#64748B", bg: "#F1F5F9" },
};

function SetupForm({ profileUuid, baseSalary, onDone }) {
  const [post] = usePostMutation();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("percent"); // percent | amount
  const [percent, setPercent] = useState("50");
  const [amount, setAmount] = useState("");
  const [split, setSplit] = useState("3");
  const [startMonth, setStartMonth] = useState(thisYearMonth());

  const resolved = useMemo(() => {
    if (mode === "amount") return parseFloat(amount) || 0;
    const p = parseFloat(percent);
    if (!p || !baseSalary) return 0;
    return Math.round((baseSalary * p) / 100);
  }, [mode, amount, percent, baseSalary]);

  const submit = async (e) => {
    e.preventDefault();
    if (!(resolved > 0)) return showToast("error", "Resolved amount must be greater than 0.");
    setBusy(true);
    try {
      const body = { split_months: parseInt(split, 10), start_year_month: startMonth };
      if (mode === "amount") body.amount = parseFloat(amount);
      else body.percent = parseFloat(percent);
      const res = await post({ path: `employee/profiles/${profileUuid}/security-retention`, body }).unwrap();
      showToast("success", res?.message || "Retention configured.");
      onDone?.();
    } catch (err) {
      showToast("error", err?.data?.message || "Could not configure retention.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-5 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
      <h3 className="text-[13px] font-semibold mb-4">Set up retention</h3>
      <div className="flex items-center gap-1 p-1 mb-4 border rounded-xl w-fit" style={{ borderColor: BORDER }}>
        {["percent", "amount"].map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-lg capitalize"
                  style={mode === m ? { background: BRAND_RED, color: "white" } : { color: TEXT_SECONDARY }}>
            {m === "percent" ? "% of base" : "Flat amount"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {mode === "percent" ? (
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Percent of base salary</label>
            <input type="number" min="0" max="100" step="0.01" value={percent} onChange={(e) => setPercent(e.target.value)}
                   className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Total amount (PKR)</label>
            <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                   className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
          </div>
        )}
        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Split over (months)</label>
          <input type="number" min="1" max="12" step="1" value={split} onChange={(e) => setSplit(e.target.value)}
                 className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>First hold month</label>
          <input type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)}
                 className="w-full px-3 py-2 text-sm border rounded-lg outline-none" style={{ borderColor: BORDER }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
          Total to hold: <span className="font-semibold" style={{ color: BRAND_RED }}>PKR {fmt(resolved)}</span>
          {mode === "percent" && baseSalary ? ` (of PKR ${fmt(baseSalary)} base)` : ""}
        </div>
        <button type="submit" disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
                style={{ background: BRAND_RED, opacity: busy ? 0.6 : 1 }}>
          {busy && <Loader2 size={14} className="animate-spin" />} Configure
        </button>
      </div>
    </form>
  );
}

export default function SecurityRetentionPage() {
  const user = useSelector(selectCurrentUser);
  const canRead    = hasPermission(user, "get security-retentions");
  const canCreate  = hasPermission(user, "create security-retentions");
  const canUpdate  = hasPermission(user, "update security-retentions");
  const canRelease = hasPermission(user, "release security-retention");
  const canForfeit = hasPermission(user, "forfeit security-retention");

  const [profileUuid, setProfileUuid] = useState("");
  const [busy, setBusy] = useState(null);
  const [post] = usePostMutation();
  const [patch] = usePatchMutation();

  // Inline per-hold editing (month / date / amount / note).
  const [editUuid, setEditUuid] = useState(null);
  const [editForm, setEditForm] = useState({ due_year_month: "", due_date: "", amount: "", note: "" });
  const startEdit = (h) => {
    setEditUuid(h.uuid);
    setEditForm({
      due_year_month: h.due_year_month || "",
      due_date: h.due_date || "",
      amount: h.amount != null ? String(h.amount) : "",
      note: h.note || "",
    });
  };
  const cancelEdit = () => { setEditUuid(null); };
  const saveHold = async (holdUuid) => {
    setBusy(holdUuid);
    try {
      const body = {
        due_year_month: editForm.due_year_month || null,
        due_date: editForm.due_date || null,
        amount: editForm.amount === "" ? null : Number(editForm.amount),
        note: editForm.note || null,
      };
      const res = await patch({ path: `employee/security-retention-holds/${holdUuid}`, body }).unwrap();
      showToast("success", res?.message || "Hold updated.");
      setEditUuid(null);
      refetch();
    } catch (err) {
      showToast("error", err?.data?.message || "Update failed.");
    } finally {
      setBusy(null);
    }
  };

  const { data: profilesResp } = useGetQuery({ path: "employee/profiles?status=active&per_page=200" });
  const employees = useMemo(() => profilesResp?.data || [], [profilesResp]);

  const { data, isFetching, refetch } = useGetQuery(
    profileUuid ? { path: `employee/profiles/${profileUuid}/security-retention` } : { path: "employee/profiles?per_page=1" },
    { skip: !profileUuid }
  );
  const cfg = profileUuid ? data?.data?.config : null;
  const holds = profileUuid ? (data?.data?.holds || []) : [];

  const act = async (action, okMsg) => {
    setBusy(action);
    try {
      const res = await post({ path: `employee/profiles/${profileUuid}/security-retention/${action}`, body: {} }).unwrap();
      showToast("success", res?.message || okMsg);
      refetch();
    } catch (err) {
      showToast("error", err?.data?.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const deferHold = async (holdUuid) => {
    setBusy(holdUuid);
    try {
      const res = await post({ path: `employee/security-retention-holds/${holdUuid}/defer`, body: {} }).unwrap();
      showToast("success", res?.message || "Hold deferred.");
      refetch();
    } catch (err) {
      showToast("error", err?.data?.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  if (!canRead) {
    return <div className="p-6 text-sm" style={{ color: TEXT_SECONDARY }}>You don&apos;t have permission to view security retention.</div>;
  }

  const sm = cfg ? (STATUS_META[cfg.status] || STATUS_META.pending) : null;
  const canConfigure = cfg && ["pending", "released", "forfeited"].includes(cfg.status);
  const isActive = cfg && ["collecting", "held"].includes(cfg.status);

  return (
    <div className="w-full" style={{ padding: "28px 28px 60px", fontFamily: "Montserrat, ui-sans-serif, system-ui", color: TEXT_PRIMARY }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: BRAND_RED_TINT, color: BRAND_RED }}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Security Retention</h1>
          <p className="text-xs" style={{ color: TEXT_MUTED }}>
            Hold back a portion of salary across the first months · refund or forfeit on exit
          </p>
        </div>
      </div>

      {/* Employee picker */}
      <div className="p-4 mb-4 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
        <label className="block text-[11px] font-medium mb-1.5" style={{ color: TEXT_SECONDARY }}>Employee</label>
        <div className="max-w-md">
          <SearchableSelect
            options={employees.map((emp) => ({
              value: emp.uuid,
              label: `${emp.full_name || emp.employee_id}${emp.employee_id ? ` — ${emp.employee_id}` : ""}`,
            }))}
            value={profileUuid}
            onChange={(v) => setProfileUuid(v || "")}
            placeholder="Search & select an employee…"
          />
        </div>
      </div>

      {!profileUuid ? (
        <div className="p-12 text-sm text-center bg-white border rounded-2xl" style={{ borderColor: BORDER, color: TEXT_MUTED }}>
          Pick an employee to view or configure their security retention.
        </div>
      ) : isFetching && !cfg ? (
        <div className="flex items-center justify-center p-12 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
          <Loader2 size={20} className="animate-spin" style={{ color: BRAND_RED }} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Config summary */}
          <div className="p-5 bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center px-2.5 py-1 text-[12px] font-medium rounded-full" style={{ color: sm.fg, background: sm.bg }}>
                {sm.label}
              </span>
              {isActive && (
                <div className="flex items-center gap-2">
                  {canRelease && (
                    <button type="button" disabled={busy === "release"} onClick={() => act("release", "Retention released.")}
                            className="px-3 py-2 text-xs font-medium text-white rounded-lg" style={{ background: "#1D4ED8" }}>
                      Release (refund)
                    </button>
                  )}
                  {canForfeit && (
                    <button type="button" disabled={busy === "forfeit"} onClick={() => act("forfeit", "Retention forfeited.")}
                            className="px-3 py-2 text-xs font-medium border rounded-lg" style={{ borderColor: BORDER, color: "#B91C1C" }}>
                      Forfeit
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Total</div>
                <div className="text-sm tabular-nums">PKR {fmt(cfg.amount)}{cfg.percent ? ` (${cfg.percent}%)` : ""}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Split</div>
                <div className="text-sm">{cfg.split_months ? `${cfg.split_months} months` : "—"}{cfg.start_year_month ? ` · from ${cfg.start_year_month}` : ""}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Collected</div>
                <div className="text-sm tabular-nums">PKR {fmt(cfg.collected)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Outstanding</div>
                <div className="text-lg font-semibold tabular-nums" style={{ color: BRAND_RED }}>PKR {fmt(cfg.outstanding)}</div>
              </div>
            </div>
          </div>

          {/* Setup form */}
          {canConfigure && canCreate && (
            <SetupForm profileUuid={profileUuid} baseSalary={cfg.base_salary} onDone={refetch} />
          )}

          {/* Holds schedule */}
          {holds.length > 0 && (
            <div className="overflow-hidden bg-white border rounded-2xl" style={{ borderColor: BORDER }}>
              <div className="px-5 py-3 text-[13px] font-semibold border-b" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
                Hold schedule
              </div>
              <table className="w-full text-sm">
                <thead style={{ background: SURFACE_ALT }}>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                    <th className="px-5 py-3">#</th>
                    <th className="px-3 py-3">Due month</th>
                    <th className="px-3 py-3">Due date</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Held on</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {holds.map((h) => {
                    const hm = HOLD_META[h.status] || HOLD_META.scheduled;
                    const editable = canUpdate && (h.status === "scheduled" || h.status === "deferred");
                    const isEditing = editUuid === h.uuid;
                    const inputStyle = { background: "#fff", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
                    if (isEditing) {
                      return (
                        <tr key={h.uuid} className="border-t" style={{ borderColor: BORDER, background: SURFACE_ALT }}>
                          <td className="px-5 py-3 tabular-nums">{h.sequence}</td>
                          <td className="px-3 py-3">
                            <input type="month" value={editForm.due_year_month}
                              onChange={(e) => setEditForm((f) => ({ ...f, due_year_month: e.target.value }))}
                              className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
                          </td>
                          <td className="px-3 py-3">
                            <input type="date" value={editForm.due_date}
                              onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                              className="px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <input type="number" min="0" step="0.01" value={editForm.amount}
                              onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                              className="w-24 px-2 py-1 text-xs text-right rounded outline-none" style={inputStyle} />
                          </td>
                          <td className="px-3 py-3" colSpan={1}>
                            <input type="text" placeholder="Note" value={editForm.note}
                              onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                              className="w-full px-2 py-1 text-xs rounded outline-none" style={inputStyle} />
                          </td>
                          <td className="px-3 py-3" />
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <button type="button" disabled={busy === h.uuid} onClick={() => saveHold(h.uuid)}
                              className="px-2 py-1 mr-1 text-[11px] font-semibold text-white rounded" style={{ background: BRAND_RED }}>
                              {busy === h.uuid ? "Saving…" : "Save"}
                            </button>
                            <button type="button" onClick={cancelEdit}
                              className="px-2 py-1 text-[11px] font-medium border rounded" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={h.uuid} className="border-t" style={{ borderColor: BORDER }}>
                        <td className="px-5 py-3 tabular-nums">{h.sequence}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: TEXT_SECONDARY }}>{h.due_year_month}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: TEXT_MUTED }}>{h.due_date || "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmt(h.amount)}</td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ color: hm.fg, background: hm.bg }}>{hm.label}</span>
                          {h.note && <div className="text-[10px] mt-0.5 italic" style={{ color: TEXT_MUTED }}>{h.note}</div>}
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: TEXT_MUTED }}>{h.committed_at ? h.committed_at.slice(0, 10) : "—"}</td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {editable && (
                            <>
                              <button type="button" onClick={() => startEdit(h)}
                                      className="px-2 py-1 mr-1 text-[11px] font-medium border rounded" style={{ borderColor: BORDER, color: "#1D4ED8" }}>
                                Edit
                              </button>
                              {h.status === "scheduled" && (
                                <button type="button" disabled={busy === h.uuid} onClick={() => deferHold(h.uuid)}
                                        className="px-2 py-1 text-[11px] font-medium border rounded" style={{ borderColor: BORDER, color: TEXT_SECONDARY }}>
                                  Defer
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
