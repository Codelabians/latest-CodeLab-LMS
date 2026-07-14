const fs=require('fs');const cp=require('child_process');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const out=F+'src/components/finance/LedgerAccounts.jsx';
let c=cp.execSync('git show HEAD:src/components/finance/LedgerAccounts.jsx',{cwd:F}).toString();
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// lucide imports
rep(`import {
  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote,
} from "lucide-react";`,
`import {
  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote, RotateCcw, Search,
  Download, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";`,'icons');

// apiSlice import: add API_URL
rep(`import { useGetQuery, usePostMutation } from "../../api/apiSlice";`,
    `import { useGetQuery, usePostMutation, API_URL } from "../../api/apiSlice";`,'api');

// react-redux import after SearchableSelect
rep(`import SearchableSelect from "../ui/SearchableSelect";`,
    `import SearchableSelect from "../ui/SearchableSelect";
import { useSelector } from "react-redux";`,'redux');

// wire onChanged
rep(`      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} />}`,
    `      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} onChanged={refreshAll} />}`,'wire');

// ---- Replace the whole StatementDrawer function (splice between markers) ----
const startMarker='function StatementDrawer({ uuid, onClose }) {';
const endMarker='/* -------------------- Create account -------------------- */';
const si=c.indexOf(startMarker);
const ei=c.indexOf(endMarker);
if(si<0||ei<0||ei<si) throw new Error('drawer markers not found');

const newDrawer=`function StatementDrawer({ uuid, onClose, onChanged }) {
  const token = useSelector((s) => s.auth?.token);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [dir, setDir] = useState("");
  const [cat, setCat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [proof, setProof] = useState(null);
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [exporting, setExporting] = useState("");
  const [reverseEntry, { isLoading: reversing }] = usePostMutation();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { setPage(1); }, [debouncedQ, dir, cat, from, to]);

  const filterParams = {
    ...(debouncedQ ? { q: debouncedQ } : {}),
    ...(dir ? { direction: dir } : {}),
    ...(cat ? { category: cat } : {}),
    ...(from ? { date_from: from } : {}),
    ...(to ? { date_to: to } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useGetQuery(
    { path: \`finance/ledger/accounts/\${uuid}\`, params: { ...filterParams, page, per_page: perPage } },
    { refetchOnMountOrArgChange: true }
  );
  const acct = data?.data?.account;
  const entries = data?.data?.entries || [];
  const meta = data?.meta || {};
  const categories = meta.categories || [];
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;

  const doReverse = async () => {
    try {
      const res = await reverseEntry({ path: \`finance/ledger/entries/\${confirmEntry.entry_uuid}/reverse\`, body: {} }).unwrap();
      setConfirmEntry(null);
      refetch();
      onChanged?.();
      showToast(res?.message || "Entry reversed.", "success");
    } catch (e) {
      showToast(e?.data?.message || "Failed to reverse entry.", "error");
    }
  };

  const doExport = async (format) => {
    try {
      setExporting(format);
      const params = new URLSearchParams({ format, ...filterParams });
      const resp = await fetch(\`\${API_URL}finance/ledger/accounts/\${uuid}/export?\${params.toString()}\`, {
        headers: token ? { Authorization: \`Bearer \${token}\` } : {},
      });
      if (!resp.ok) throw new Error("export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`\${(acct?.name || "account").replace(/[^a-z0-9_-]+/gi, "-")}-ledger.\${format === "pdf" ? "pdf" : "xlsx"}\`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Export failed.", "error");
    } finally {
      setExporting("");
    }
  };

  const inputCls = "px-3 py-2 text-[12px] rounded-lg outline-none";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(15,23,42,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-white overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white px-5 py-4 flex items-center justify-between" style={{ borderBottom: \`1px solid \${BORDER}\` }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{acct?.name || "Account"}</h2>
            {acct && (
              <div className="text-[12px]" style={{ color: TEXT_MUTED }}>
                {acct.is_money ? \`Balance \${money(acct.current_balance)}\` : (positionLabel(acct)?.text || "")}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => doExport("xlsx")} disabled={!!exporting} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-50" style={{ border: \`1px solid \${BORDER}\`, color: GREEN }} title="Download Excel">
              {exporting === "xlsx" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Excel
            </button>
            <button onClick={() => doExport("pdf")} disabled={!!exporting} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-50" style={{ border: \`1px solid \${BORDER}\`, color: BRAND }} title="Download PDF">
              {exporting === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
          </div>
        </div>

        <div className="px-5 py-3 flex flex-wrap items-center gap-2" style={{ borderBottom: \`1px solid \${BORDER}\`, background: "#fff" }}>
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: TEXT_MUTED }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description, party, type…" className={\`w-full pl-8 pr-3 py-2 text-[12px] rounded-lg outline-none\`} style={field} />
          </div>
          <select value={dir} onChange={(e) => setDir(e.target.value)} className={inputCls} style={field}>
            <option value="">Debit & Credit</option>
            <option value="debit">Debit (in)</option>
            <option value="credit">Credit (out)</option>
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls} style={field}>
            <option value="">All types</option>
            {categories.map((ct) => <option key={ct} value={ct}>{String(ct).replace(/_/g, " ")}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} style={field} title="From date" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} style={field} title="To date" />
          {(q || dir || cat || from || to) && (
            <button onClick={() => { setQ(""); setDir(""); setCat(""); setFrom(""); setTo(""); }} className="text-[12px] font-semibold px-2 py-2" style={{ color: TEXT_MUTED }}>Clear</button>
          )}
          {isFetching && <Loader2 size={14} className="animate-spin" style={{ color: TEXT_MUTED }} />}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: SURFACE, color: TEXT_SECONDARY }}>
                {["Date", "Description", "Debit", "Credit", "Balance", ""].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center" style={{ color: TEXT_MUTED }}>No entries match.</td></tr>
              ) : entries.map((e) => (
                <tr key={e.entry_uuid} style={{ borderTop: \`1px solid \${BORDER}\` }}>
                  <td className="px-3 py-2 whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>{e.entry_date}</td>
                  <td className="px-3 py-2" style={{ color: TEXT_PRIMARY }}>
                    {e.description || <span className="capitalize" style={{ color: TEXT_MUTED }}>{String(e.category).replace(/_/g, " ")}</span>}
                    {(e.counterparty?.name || e.counterparty_label) && <span className="text-[11px]" style={{ color: TEXT_MUTED }}> · {e.counterparty?.name || e.counterparty_label}</span>}
                    {e.reversed && (
                      <div className="inline-flex items-center gap-1 text-[11px] mt-1 font-semibold" style={{ color: TEXT_MUTED }}>
                        <RotateCcw size={11} /> Reversed{e.reversed_by ? \` by \${e.reversed_by}\` : ""}{e.reversed_at ? \` · \${e.reversed_at}\` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ color: GREEN, textDecoration: e.reversed ? "line-through" : "none", opacity: e.reversed ? 0.5 : 1 }}>{e.debit > 0 ? money(e.debit) : ""}</td>
                  <td className="px-3 py-2" style={{ color: BRAND, textDecoration: e.reversed ? "line-through" : "none", opacity: e.reversed ? 0.5 : 1 }}>{e.credit > 0 ? money(e.credit) : ""}</td>
                  <td className="px-3 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{money(e.balance_after)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {e.has_proof && e.proof_url && (
                        <button onClick={() => setProof(e.proof_url)} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BLUE }}><Paperclip size={12} /> View</button>
                      )}
                      {e.is_reversal && (
                        <span className="text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>Reversal</span>
                      )}
                      {e.reversible && (
                        <button onClick={() => setConfirmEntry(e)} title="Reverse this entry" className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BRAND }}><RotateCcw size={12} /> Reverse</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && lastPage > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: \`1px solid \${BORDER}\` }}>
            <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>Page {meta.current_page || page} of {lastPage} · {total} entries</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={(meta.current_page || page) <= 1} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-40" style={{ border: \`1px solid \${BORDER}\`, color: TEXT_PRIMARY }}><ChevronLeft size={14} /> Prev</button>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={(meta.current_page || page) >= lastPage} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-lg disabled:opacity-40" style={{ border: \`1px solid \${BORDER}\`, color: TEXT_PRIMARY }}>Next <ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {proof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setProof(null)}>
          <img src={proof} alt="Proof" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}

      {confirmEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.55)" }} onClick={() => setConfirmEntry(null)}>
          <div className="w-full max-w-sm p-6 text-center bg-white rounded-2xl" style={{ border: \`1px solid \${BORDER}\` }} onClick={(ev) => ev.stopPropagation()}>
            <div className="grid w-12 h-12 mx-auto mb-3 rounded-full place-items-center" style={{ background: "#FEF2F2", color: BRAND }}><RotateCcw size={22} /></div>
            <h2 className="text-[15px] font-bold mb-1" style={{ color: TEXT_PRIMARY }}>Reverse this entry?</h2>
            <p className="text-[12.5px] mb-5" style={{ color: TEXT_MUTED }}>This marks the {money((confirmEntry.debit || 0) + (confirmEntry.credit || 0))} entry as reversed and removes its effect on the balance. The line stays on the statement (greyed out) showing who reversed it and when, and cannot be reversed again. If it was a transfer the other account is updated too.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmEntry(null)} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ background: SURFACE, color: TEXT_PRIMARY }}>Cancel</button>
              <button onClick={doReverse} disabled={reversing} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{reversing ? "Reversing…" : "Reverse"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

`;

c = c.slice(0, si) + newDrawer + '\n' + c.slice(ei);

parser.parse(c,{sourceType:'module',plugins:['jsx']});
let cu=0,br=0,pa=0;for(const ch of c){if(ch==='{')cu++;if(ch==='}')cu--;if(ch==='(')pa++;if(ch===')')pa--;if(ch==='[')br++;if(ch===']')br--;}
if(cu||pa||br)throw new Error('unbalanced '+cu+'/'+pa+'/'+br);
fs.writeFileSync(out,c);
console.log('REBUILT FINAL | parse OK | lines='+c.split('\n').length+' | balance',cu,pa,br);
