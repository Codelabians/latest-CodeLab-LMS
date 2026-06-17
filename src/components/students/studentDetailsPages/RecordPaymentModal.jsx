import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useGetQuery, usePostMutation } from "../../../api/apiSlice";

/**
 * Record a payment (partial or split-tender) against a single installment.
 *
 * Backend contract: POST finance/student-batches/{studentBatchUuid}/payments
 *   {
 *     paid_at, notes, extend_due_date_to,
 *     allocations: [{ installment_uuid, amount, payment_method,
 *                     payment_account_uuid?, payment_reference? }]
 *   }
 *
 * Each "tender line" below becomes one allocation against the same
 * installment, so the admin can split one payment across methods
 * (e.g. 6k bank + 6k cash). All lines share the same installment_uuid.
 */
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const today = () => new Date().toISOString().slice(0, 10);

const RecordPaymentModal = ({
  isOpen,
  onClose,
  studentBatchUuid,
  installment,
  installmentIndex,
  onRecorded,
}) => {
  const [recordPayment, { isLoading: isSaving }] = usePostMutation();

  const remaining = useMemo(() => {
    if (!installment) return 0;
    if (installment.remaining != null) return Number(installment.remaining);
    const paid = Number(installment.paid_amount || 0);
    return Math.max(Number(installment.amount || 0) - paid, 0);
  }, [installment]);

  const [paidAt, setPaidAt] = useState(today());
  const [notes, setNotes] = useState("");
  const [extendDueDateTo, setExtendDueDateTo] = useState("");
  const [lines, setLines] = useState([
    { amount: "", payment_method: "cash", payment_account_uuid: "", payment_reference: "" },
  ]);

  // Active payment accounts for the optional per-line account dropdown.
  const { data: accountsData } = useGetQuery({
    path: "finance/payment-accounts/active",
  });
  const accounts = accountsData?.data || [];

  useEffect(() => {
    if (isOpen) {
      setPaidAt(today());
      setNotes("");
      setExtendDueDateTo("");
      setLines([
        {
          amount: remaining ? String(remaining) : "",
          payment_method: "cash",
          payment_account_uuid: "",
          payment_reference: "",
        },
      ]);
    }
  }, [isOpen, remaining]);

  if (!isOpen || !installment) return null;

  const totalEntered = lines.reduce(
    (sum, l) => sum + (parseFloat(l.amount) || 0),
    0,
  );

  const updateLine = (idx, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { amount: "", payment_method: "cash", payment_account_uuid: "", payment_reference: "" },
    ]);

  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const cleaned = lines
      .map((l) => ({ ...l, amount: parseFloat(l.amount) }))
      .filter((l) => l.amount > 0 && l.payment_method);

    if (cleaned.length === 0) {
      toast.error("Add at least one payment line with an amount and method.");
      return;
    }
    if (totalEntered > remaining + 0.001) {
      toast.error(
        `Total (Rs. ${totalEntered.toLocaleString()}) exceeds the remaining Rs. ${remaining.toLocaleString()} on this installment.`,
      );
      return;
    }

    const body = {
      paid_at: paidAt ? `${paidAt} 00:00:00` : undefined,
      notes: notes || undefined,
      extend_due_date_to: extendDueDateTo || undefined,
      allocations: cleaned.map((l) => ({
        installment_uuid: installment.installment_uuid,
        amount: l.amount,
        payment_method: l.payment_method,
        payment_account_uuid: l.payment_account_uuid || undefined,
        payment_reference: l.payment_reference || undefined,
      })),
    };

    try {
      await recordPayment({
        path: `finance/student-batches/${studentBatchUuid}/payments`,
        body,
      }).unwrap();
      toast.success("Payment recorded successfully");
      onRecorded?.();
      onClose();
    } catch (error) {
      console.error("Record payment error:", error);
      toast.error(error?.data?.message || "Failed to record payment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Record Payment — Installment #{(installmentIndex ?? 0) + 1}
            </h3>
            <p className="text-sm text-gray-500">
              Amount Rs. {Number(installment.amount || 0).toLocaleString()} ·{" "}
              <span className="font-semibold text-[#C90606]">
                Remaining Rs. {remaining.toLocaleString()}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tender lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Payment lines
              </p>
              <button
                onClick={addLine}
                type="button"
                className="inline-flex items-center gap-1 text-sm text-[#C90606] font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Split across method
              </button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.amount}
                    onChange={(e) => updateLine(idx, "amount", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Method
                  </label>
                  <select
                    value={line.payment_method}
                    onChange={(e) =>
                      updateLine(idx, "payment_method", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Account (optional)
                  </label>
                  <select
                    value={line.payment_account_uuid}
                    onChange={(e) =>
                      updateLine(idx, "payment_account_uuid", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
                  >
                    <option value="">—</option>
                    {accounts.map((a) => (
                      <option key={a.uuid || a.account_uuid} value={a.uuid || a.account_uuid}>
                        {a.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={line.payment_reference}
                    onChange={(e) =>
                      updateLine(idx, "payment_reference", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
                    placeholder="TXN / cheque #"
                  />
                </div>
                <div className="md:col-span-1 flex md:justify-center md:pt-6">
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                      title="Remove line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="text-right text-sm">
              <span className="text-gray-500">Total entered: </span>
              <span
                className={`font-bold ${
                  totalEntered > remaining + 0.001
                    ? "text-red-600"
                    : "text-gray-800"
                }`}
              >
                Rs. {totalEntered.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Payment date
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Extend due date to (optional)
              </label>
              <input
                type="date"
                value={extendDueDateTo}
                onChange={(e) => setExtendDueDateTo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C90606]/30"
              placeholder="e.g. Paid at front desk"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#C90606] hover:bg-[#A00505] rounded-lg disabled:opacity-50"
          >
            {isSaving ? "Recording…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
