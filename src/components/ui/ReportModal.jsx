import React, { useEffect, useMemo, useState } from "react";
import { Download, X, Loader2, FileSpreadsheet } from "lucide-react";
import { useLazyGetQuery } from "../../api/apiSlice";
import { downloadCSV } from "../../api/fileDownload";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE_HOVER = "#F8FAFC";

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Reusable "Download report" modal.
 *
 * Props:
 *  open, onClose
 *  title          modal heading
 *  path           API list path (GET)
 *  columns        CSV columns [{label, key|map}]
 *  filenameBase   e.g. "applicants"
 *  fields         [{ type:'select'|'date'|'text', key, label, options? }]
 *  initialValues  {} initial field values (usually the page's active filters)
 *  buildParams    (values) => API params object
 *  hasDates       show the date preset row (default: auto if a date field exists)
 */
export default function ReportModal({
  open, onClose, title = "Download report", path, columns,
  filenameBase = "report", fields = [], initialValues = {}, buildParams,
}) {
  const [vals, setVals] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(null);
  const [err, setErr] = useState("");
  const [trigger] = useLazyGetQuery();

  useEffect(() => { if (open) { setVals(initialValues); setCount(null); setErr(""); } }, [open]);

  const hasDates = useMemo(() => fields.some((f) => f.type === "date"), [fields]);
  const dateKeys = useMemo(() => {
    const f = fields.find((x) => x.type === "date" && /from/i.test(x.key));
    const t = fields.find((x) => x.type === "date" && /to/i.test(x.key));
    return { from: f?.key || "from", to: t?.key || "to" };
  }, [fields]);

  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  const preset = (kind) => {
    const now = new Date();
    if (kind === "all") { set(dateKeys.from, ""); set(dateKeys.to, ""); return; }
    let from;
    if (kind === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (kind === "30") { from = new Date(now); from.setDate(from.getDate() - 29); }
    else if (kind === "year") from = new Date(now.getFullYear(), 0, 1);
    set(dateKeys.from, fmt(from));
    set(dateKeys.to, fmt(now));
  };

  // Fetch ALL matching rows by paging in chunks (endpoints cap per_page at 200).
  const fetchRows = async () => {
    const base = buildParams ? buildParams(vals) : { ...vals };
    const PER = 200;
    let page = 1, all = [], guard = 0;
    while (guard < 500) {
      guard += 1;
      const res = await trigger({ path, params: { ...base, page, per_page: PER } }).unwrap();
      const chunk = res?.data || [];
      all = all.concat(chunk);
      const meta = res?.meta || res?.pagination || {};
      const last = Number(meta.last_page || 0);
      if (last) { if (page >= last) break; }
      else if (chunk.length < PER) break;
      page += 1;
    }
    return all;
  };

  const preview = async () => {
    setLoading(true); setErr("");
    try { const rows = await fetchRows(); setCount(rows.length); }
    catch (e) { setErr("Could not load records. Please try again."); setCount(null); }
    setLoading(false);
  };

  const download = async () => {
    setLoading(true); setErr("");
    try {
      const rows = await fetchRows();
      if (!rows.length) { setErr("No records match these filters."); setCount(0); setLoading(false); return; }
      downloadCSV(rows, columns, `${filenameBase}_${fmt(new Date())}.csv`);
      setCount(rows.length);
      onClose();
    } catch (e) { setErr("Download failed. Please try again."); }
    setLoading(false);
  };

  if (!open) return null;

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,6,23,.5)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="grid rounded-lg place-items-center" style={{ width: 34, height: 34, background: "#FEF2F2", color: BRAND }}><FileSpreadsheet size={17} /></span>
            <h3 className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
          </div>
          <button onClick={onClose} className="grid w-8 h-8 rounded-lg place-items-center" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}><X size={16} /></button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[12.5px] mb-4" style={{ color: TEXT_SECONDARY }}>Choose filters, then download a CSV (opens in Excel). Leave a field blank to include everything.</p>

          {hasDates && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[{ k: "month", l: "This month" }, { k: "30", l: "Last 30 days" }, { k: "year", l: "This year" }, { k: "all", l: "All time" }].map((p) => (
                <button key={p.k} type="button" onClick={() => preset(p.k)} className="px-3 py-1.5 text-xs font-semibold rounded-lg"
                  style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>{p.l}</button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key} className={f.full ? "col-span-2" : ""}>
                <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>{f.label}</label>
                {f.type === "select" ? (
                  <select value={vals[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle}>
                    {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={f.type === "date" ? "date" : "text"} value={vals[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder || ""} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                )}
              </div>
            ))}
          </div>

          {count !== null && !err && (
            <div className="mt-4 px-3 py-2 rounded-lg text-[13px] font-semibold" style={{ background: "#F0FDF4", color: "#15803D" }}>{count} record{count === 1 ? "" : "s"} match these filters.</div>
          )}
          {err && <div className="mt-4 px-3 py-2 rounded-lg text-[13px] font-semibold" style={{ background: "#FEF2F2", color: BRAND }}>{err}</div>}
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={preview} disabled={loading} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null} Preview count
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
            <button onClick={download} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: BRAND }}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Preparing…</> : <><Download size={15} /> Download CSV</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
