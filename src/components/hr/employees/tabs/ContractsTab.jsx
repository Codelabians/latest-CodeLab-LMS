import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, X, Send, PenLine, XCircle, Repeat, ScrollText, ExternalLink,
} from "lucide-react";

import {
  useGetQuery,
  usePostMutation,
} from "../../../../api/apiSlice";
import { showToast } from "../../../ui/common/ShowToast";
import SignatureCanvasModal from "./SignatureCanvasModal";

const BRAND_RED = "#C90606";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_ALT = "#F8FAFC";

const inputCls = "w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2";

const unwrap = (resp) => {
  const root = resp?.data ?? resp ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  return [];
};

const STATUS_COLORS = {
  draft:      { fg: "#64748B", bg: "#F1F5F9" },
  sent:       { fg: "#1D4ED8", bg: "#EFF6FF" },
  signed:     { fg: "#16A34A", bg: "#F0FDF4" },
  rejected:   { fg: "#DC2626", bg: "#FEF2F2" },
  expired:    { fg: "#CA8A04", bg: "#FEFCE8" },
  superseded: { fg: "#7C3AED", bg: "#F5F3FF" },
  cancelled:  { fg: "#64748B", bg: "#F1F5F9" },
};

const StatusChip = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full"
      style={{ color: c.fg, background: c.bg }}
    >
      {status || "—"}
    </span>
  );
};

/* generate/supersede modal — Phase 1.99 (2026-05-25)
 *
 * Two bugs were closed here:
 *   1. Picker was sending `template_id` (integer); the BE expects
 *      `template_uuid` (string). Now sends uuid + designation correctly.
 *   2. Picker dropdown was empty because the contract_templates table
 *      had no seeded rows. We seeded 5 defaults (see
 *      EmployeeContractTemplateSeeder).
 *
 * Customization: picking a template now reveals an editable textarea
 * pre-filled with the template body. HR tweaks per-employee, hits
 * Generate, and the BE renders variables against the override.
 */
const GenerateModal = ({ open, onClose, profileUuid, supersedeUuid, onDone }) => {
  const [templateUuid, setTemplateUuid] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [bodyOverride, setBodyOverride] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Fetch templates. Default to listing all when the picker opens —
  // the BE already supports an is_active=1 filter so we keep that.
  const { data: templatesData } = useGetQuery(
    { path: "employee/contract-templates" },
    { skip: !open }
  );
  const templates = useMemo(() => {
    const list = unwrap(templatesData);
    return list.map((t) => ({
      uuid:        t.uuid,
      name:        t.name,
      applies_to:  t.applies_to,
      designation: t.designation,
      is_default:  t.is_default,
      body_text:   t.body_text,
      body_html:   t.body_html,
    }));
  }, [templatesData]);

  // When HR picks a template, pre-fill the customize textarea with the
  // template's plain-text body so they have a starting point.
  useEffect(() => {
    if (!templateUuid) return;
    const t = templates.find((x) => x.uuid === templateUuid);
    if (t && !bodyOverride) {
      setBodyOverride(t.body_text || stripHtml(t.body_html) || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateUuid]);

  const [generate, { isLoading: generating }] = usePostMutation();
  const [supersede, { isLoading: superseding }] = usePostMutation();
  const busy = generating || superseding;

  const reset = () => {
    setTemplateUuid(""); setEffectiveFrom(""); setEffectiveTo("");
    setBodyOverride(""); setCustomizeOpen(false);
  };
  const close = () => { reset(); onClose(); };

  const submit = async (e) => {
    e.preventDefault();
    if (!templateUuid) { showToast("Pick a template.", "error"); return; }
    if (!effectiveFrom) { showToast("Effective from date is required.", "error"); return; }

    const chosen = templates.find((t) => t.uuid === templateUuid);
    const usedDefault = chosen?.body_text === bodyOverride || !customizeOpen;

    const body = {
      template_uuid: templateUuid,
      designation: chosen?.designation || undefined,
      effective_from: effectiveFrom,
      effective_to: effectiveTo || undefined,
      // Only send override when HR actually opened the customize section
      // AND changed something. Avoids overwriting the template's HTML
      // formatting with a stripped plain-text version.
      ...(customizeOpen && !usedDefault
        ? { body_html_override: plainTextToHtml(bodyOverride) }
        : {}),
    };

    try {
      if (supersedeUuid) {
        await supersede({
          path: `employee/contracts/${supersedeUuid}/supersede`,
          body,
        }).unwrap();
        showToast("Contract superseded with new draft", "success");
      } else {
        await generate({
          path: `employee/profiles/${profileUuid}/contracts`,
          body,
        }).unwrap();
        showToast("Draft contract generated", "success");
      }
      onDone?.();
      close();
    } catch (err) {
      showToast(err?.data?.message || "Could not generate contract.", "error");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: BORDER }}>
          <h3 className="text-base font-semibold" style={{ color: TEXT_PRIMARY }}>
            {supersedeUuid ? "Supersede contract" : "Generate new contract"}
          </h3>
          <button type="button" onClick={close} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
              Template *
            </label>
            <select
              className={inputCls}
              style={{ borderColor: BORDER }}
              value={templateUuid}
              onChange={(e) => { setTemplateUuid(e.target.value); setBodyOverride(""); }}
            >
              <option value="">— pick a template —</option>
              {templates.map((t) => (
                <option key={t.uuid} value={t.uuid}>
                  {t.name}
                  {t.applies_to ? ` · ${t.applies_to.replace(/_/g, " ")}` : ""}
                  {t.is_default ? " · default" : ""}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="mt-1 text-[10.5px]" style={{ color: "#A16207" }}>
                No templates available. Seed them with: <code>php artisan db:seed --class=&quot;Modules\\Employee\\Database\\Seeders\\EmployeeContractTemplateSeeder&quot;</code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
                Effective from *
              </label>
              <input
                type="date"
                className={inputCls}
                style={{ borderColor: BORDER }}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase" style={{ color: TEXT_SECONDARY }}>
                Effective to
              </label>
              <input
                type="date"
                className={inputCls}
                style={{ borderColor: BORDER }}
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          {/* Per-employee customization. Collapsed by default to keep the
              modal simple; HR opens it when terms vary from the template. */}
          {templateUuid && (
            <div className="pt-2 border-t" style={{ borderColor: BORDER }}>
              <button
                type="button"
                onClick={() => setCustomizeOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: BRAND_RED }}
              >
                {customizeOpen ? "▾" : "▸"}
                Customize body for this employee (optional)
              </button>
              {customizeOpen && (
                <div className="mt-3">
                  <textarea
                    className="w-full px-3 py-2 text-[12px] border rounded-md"
                    style={{ borderColor: BORDER, color: TEXT_PRIMARY, fontFamily: "Georgia, serif", minHeight: 280 }}
                    value={bodyOverride}
                    onChange={(e) => setBodyOverride(e.target.value)}
                    placeholder="Template body (edit per-employee as needed)"
                  />
                  <p className="mt-1 text-[10px]" style={{ color: TEXT_SECONDARY }}>
                    Variables like <code>{"{employee_first_name}"}</code>, <code>{"{employee_basic_salary}"}</code>,
                    <code>{" {company_name}"}</code> are replaced automatically when the contract is generated.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 text-xs border rounded-md"
              style={{ borderColor: BORDER, color: TEXT_SECONDARY }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50"
              style={{ background: BRAND_RED }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              {supersedeUuid ? "Supersede" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Strip HTML tags for the customize-body starting point. Quick + dirty;
// good enough for plain-text editing since templates are stored as
// pre-formatted text wrapped in <pre>.
function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<\/?[^>]+>/g, "");
}

// Wrap edited text back into the <pre> shell so DomPDF renders it with
// the same monospace-friendly formatting the template uses.
function plainTextToHtml(text) {
  const escaped = String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<pre style="font-family: Georgia, serif; white-space: pre-wrap;">${escaped}</pre>`;
}

const ContractsTab = ({ profile, refetch: refetchParent }) => {
  const { data, isFetching, refetch } = useGetQuery({
    path: `employee/profiles/${profile.uuid}/contracts`,
  });
  const list = unwrap(data);

  const [genOpen, setGenOpen] = useState(false);
  const [supersedeUuid, setSupersedeUuid] = useState(null);
  const [signFor, setSignFor] = useState(null);

  const [send, { isLoading: sending }] = usePostMutation();
  const [reject, { isLoading: rejecting }] = usePostMutation();

  const reload = () => {
    refetch();
    refetchParent?.();
  };

  const handleSend = async (uuid) => {
    try {
      await send({
        path: `employee/contracts/${uuid}/send`,
        body: {},
      }).unwrap();
      showToast("Contract sent for signature", "success");
      reload();
    } catch (err) {
      showToast(err?.data?.message || "Could not send.", "error");
    }
  };

  const handleReject = async (uuid) => {
    const reason = window.prompt("Reason for rejection?");
    if (!reason) return;
    try {
      await reject({
        path: `employee/contracts/${uuid}/reject`,
        body: { reason },
      }).unwrap();
      showToast("Contract rejected", "success");
      reload();
    } catch (err) {
      showToast(err?.data?.message || "Could not reject.", "error");
    }
  };

  return (
    <div className="p-5 bg-white border rounded-xl" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
            Contracts
          </h2>
          <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
            Generate, send, sign and supersede employment contracts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setSupersedeUuid(null); setGenOpen(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md"
          style={{ background: BRAND_RED }}
        >
          <Plus size={12} /> Generate new contract
        </button>
      </div>

      {isFetching && !list.length ? (
        <div className="py-8 text-center text-xs" style={{ color: TEXT_MUTED }}>
          <Loader2 size={14} className="inline mr-2 animate-spin" /> Loading contracts…
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: TEXT_MUTED }}>
          <ScrollText size={20} className="mx-auto mb-2" style={{ color: TEXT_MUTED }} />
          No contracts generated yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li
              key={c.uuid}
              className="flex items-start justify-between gap-3 px-4 py-3 border rounded-md"
              style={{ borderColor: BORDER, background: SURFACE_ALT }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                    v{c.version_number}
                  </span>
                  <StatusChip status={c.status} />
                  {c.template_name_snapshot && (
                    <span className="text-xs" style={{ color: TEXT_SECONDARY }}>
                      {c.template_name_snapshot}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] flex flex-wrap gap-x-3" style={{ color: TEXT_MUTED }}>
                  {c.effective_from && <span>Effective {c.effective_from}{c.effective_to ? ` → ${c.effective_to}` : ""}</span>}
                  {c.sent_at && <span>· sent {c.sent_at}</span>}
                  {c.signed_at && <span>· signed {c.signed_at}</span>}
                  {c.rejected_at && <span>· rejected {c.rejected_at}</span>}
                </div>
                {c.signed_pdf_url && (
                  <a
                    href={c.signed_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-[11px] hover:underline"
                    style={{ color: BRAND_RED }}
                  >
                    <ExternalLink size={11} /> Signed PDF
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {c.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => handleSend(c.uuid)}
                    disabled={sending}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                    style={{ borderColor: "#BFDBFE", color: "#1D4ED8", background: "#EFF6FF" }}
                  >
                    <Send size={11} /> Send for signature
                  </button>
                )}
                {c.status === "sent" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSignFor(c.uuid)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md"
                      style={{ borderColor: "#BBF7D0", color: "#16A34A", background: "#F0FDF4" }}
                    >
                      <PenLine size={11} /> Sign now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(c.uuid)}
                      disabled={rejecting}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md disabled:opacity-50"
                      style={{ borderColor: "#FECACA", color: BRAND_RED, background: "#FEF2F2" }}
                    >
                      <XCircle size={11} /> Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { setSupersedeUuid(c.uuid); setGenOpen(true); }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded-md"
                  style={{ borderColor: BORDER, color: TEXT_SECONDARY, background: "white" }}
                >
                  <Repeat size={11} /> Supersede
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <GenerateModal
        open={genOpen}
        onClose={() => { setGenOpen(false); setSupersedeUuid(null); }}
        profileUuid={profile.uuid}
        supersedeUuid={supersedeUuid}
        onDone={reload}
      />

      <SignatureCanvasModal
        open={!!signFor}
        onClose={() => setSignFor(null)}
        contractUuid={signFor}
        onSigned={reload}
      />
    </div>
  );
};

export default ContractsTab;
