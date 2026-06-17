import { useSelector } from "react-redux";
import { X, History, Pencil, Loader2 } from "lucide-react";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { useGetQuery } from "../../api/apiSlice";

/* Shared tokens (match Finance pages) */
const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

/**
 * Expense action permissions, derived from the logged-in user.
 *   - canEdit   : finance staff + leadership + admins (`update expenses`)
 *   - canDelete : admins / leadership only (`delete expenses`)
 * The `admin` role bypasses all permission checks (mirrors the backend).
 */
export function useExpensePerms() {
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === "admin";
  const has = (perm) => isAdmin || (user?.permissions || []).includes(perm);
  return {
    canEdit: has("update expenses"),
    canDelete: has("delete expenses"),
  };
}

const FIELD_LABELS = {
  amount: "Amount",
  category_id: "Category",
  transaction_date: "Date",
  description: "Description",
  payee_user_id: "Paid to",
  payment_method: "Method",
  payment_account_id: "Account",
};

const fmtVal = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
};

const fmtWhen = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString();
};

/**
 * Edit-history popover for a single expense. Fetches finance/expense-logs/{uuid}
 * and lists each edit: who, when, and the field-level old → new diff.
 */
export function ExpenseHistoryModal({ uuid, title = "Edit history", onClose }) {
  const { data, isLoading, isError } = useGetQuery(
    { path: `finance/expense-logs/${uuid}` },
    { skip: !uuid, refetchOnMountOrArgChange: true },
  );
  const logs = data?.data || [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="inline-flex items-center gap-2 text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>
            <History size={16} style={{ color: BRAND }} /> {title}
          </h2>
          <button onClick={onClose} className="grid rounded-md w-7 h-7 place-items-center" style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10" style={{ color: TEXT_MUTED }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : isError ? (
            <p className="py-8 text-center text-[13px]" style={{ color: BRAND }}>Failed to load history.</p>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center" style={{ color: TEXT_MUTED }}>
              <Pencil size={22} className="mx-auto mb-2 opacity-40" />
              <p className="text-[13px]">No edits recorded for this expense yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => {
                const changes = log.changes || {};
                return (
                  <li key={log.id} className="p-3 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12.5px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                        {log.actor_name || "Unknown user"}
                      </span>
                      <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{fmtWhen(log.created_at)}</span>
                    </div>
                    {Object.keys(changes).length === 0 ? (
                      <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Edited (no field-level detail).</p>
                    ) : (
                      <ul className="space-y-1">
                        {Object.entries(changes).map(([field, diff]) => (
                          <li key={field} className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
                            <span className="font-semibold" style={{ color: TEXT_PRIMARY }}>{FIELD_LABELS[field] || field}:</span>{" "}
                            <span style={{ color: TEXT_MUTED, textDecoration: "line-through" }}>{fmtVal(diff?.old)}</span>{" "}
                            <span style={{ color: TEXT_MUTED }}>→</span>{" "}
                            <span style={{ color: BRAND, fontWeight: 600 }}>{fmtVal(diff?.new)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
