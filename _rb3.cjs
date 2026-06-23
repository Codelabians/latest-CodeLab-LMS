const fs=require('fs');const cp=require('child_process');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const out=F+'src/components/finance/LedgerAccounts.jsx';
let c=cp.execSync('git show HEAD:src/components/finance/LedgerAccounts.jsx',{cwd:F}).toString();
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// icon import
rep(`  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote,
} from "lucide-react";`,
`  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote, RotateCcw,
} from "lucide-react";`,'icon');

// wire onChanged
rep(`      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} />}`,
    `      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} onChanged={refreshAll} />}`,'wire');

// drawer signature + state + handler
rep(`function StatementDrawer({ uuid, onClose }) {
  const { data, isLoading } = useGetQuery({ path: \`finance/ledger/accounts/\${uuid}\`, params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const acct = data?.data?.account;
  const entries = data?.data?.entries || [];
  const [proof, setProof] = useState(null);`,
`function StatementDrawer({ uuid, onClose, onChanged }) {
  const { data, isLoading, refetch } = useGetQuery({ path: \`finance/ledger/accounts/\${uuid}\`, params: { per_page: 100 } }, { refetchOnMountOrArgChange: true });
  const acct = data?.data?.account;
  const entries = data?.data?.entries || [];
  const [proof, setProof] = useState(null);
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [reverseEntry, { isLoading: reversing }] = usePostMutation();

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
  };`,'drawer');

// description cell: add "Reversed by X · date" subtext
rep(`                  <td className="px-3 py-2" style={{ color: TEXT_PRIMARY }}>
                    {e.description || <span className="capitalize" style={{ color: TEXT_MUTED }}>{String(e.category).replace(/_/g, " ")}</span>}
                    {(e.counterparty?.name || e.counterparty_label) && <span className="text-[11px]" style={{ color: TEXT_MUTED }}> · {e.counterparty?.name || e.counterparty_label}</span>}
                  </td>`,
`                  <td className="px-3 py-2" style={{ color: TEXT_PRIMARY }}>
                    {e.description || <span className="capitalize" style={{ color: TEXT_MUTED }}>{String(e.category).replace(/_/g, " ")}</span>}
                    {(e.counterparty?.name || e.counterparty_label) && <span className="text-[11px]" style={{ color: TEXT_MUTED }}> · {e.counterparty?.name || e.counterparty_label}</span>}
                    {e.reversed && (
                      <div className="inline-flex items-center gap-1 text-[11px] mt-1 font-semibold" style={{ color: TEXT_MUTED }}>
                        <RotateCcw size={11} /> Reversed{e.reversed_by ? \` by \${e.reversed_by}\` : ""}{e.reversed_at ? \` · \${e.reversed_at}\` : ""}
                      </div>
                    )}
                  </td>`,'descreversed');

// amount cells: strikethrough when reversed; action column keeps button only when reversible
rep(`                  <td className="px-3 py-2" style={{ color: GREEN }}>{e.debit > 0 ? money(e.debit) : ""}</td>
                  <td className="px-3 py-2" style={{ color: BRAND }}>{e.credit > 0 ? money(e.credit) : ""}</td>
                  <td className="px-3 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{money(e.balance_after)}</td>
                  <td className="px-3 py-2">
                    {e.has_proof && e.proof_url && (
                      <button onClick={() => setProof(e.proof_url)} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BLUE }}><Paperclip size={12} /> View</button>
                    )}
                  </td>`,
`                  <td className="px-3 py-2" style={{ color: GREEN, textDecoration: e.reversed ? "line-through" : "none", opacity: e.reversed ? 0.5 : 1 }}>{e.debit > 0 ? money(e.debit) : ""}</td>
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
                  </td>`,'cell');

// confirm modal
rep(`      {proof && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.8)" }} onClick={() => setProof(null)}>
          <img src={proof} alt="Proof" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}`,
`      {proof && (
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
      )}`,'confirm');

parser.parse(c,{sourceType:'module',plugins:['jsx']});
let cu=0,br=0,pa=0;for(const ch of c){if(ch==='{')cu++;if(ch==='}')cu--;if(ch==='(')pa++;if(ch===')')pa--;if(ch==='[')br++;if(ch===']')br--;}
if(cu||pa||br)throw new Error('unbalanced '+cu+'/'+pa+'/'+br);
fs.writeFileSync(out,c);
console.log('REBUILT v3 | parse OK | lines='+c.split('\n').length+' | balance',cu,pa,br);
