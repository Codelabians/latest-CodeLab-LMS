const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/finance/LedgerAccounts.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// icon import: add RotateCcw
rep(`  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote,
} from "lucide-react";`,
`  BookOpen, Plus, X, Loader2, ArrowLeftRight,
  Wallet, User, Paperclip, Banknote, RotateCcw,
} from "lucide-react";`,'icon');

// pass onChanged to StatementDrawer
rep(`      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} />}`,
    `      {openAcct && <StatementDrawer uuid={openAcct} onClose={() => setOpenAcct(null)} onChanged={refreshAll} />}`,'wire');

// StatementDrawer signature + state + handlers
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

// last-column cell: add Reverse button alongside proof
rep(`                  <td className="px-3 py-2">
                    {e.has_proof && e.proof_url && (
                      <button onClick={() => setProof(e.proof_url)} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BLUE }}><Paperclip size={12} /> View</button>
                    )}
                  </td>`,
`                  <td className="px-3 py-2">
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

// confirm modal: insert next to the proof lightbox
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
            <p className="text-[12.5px] mb-5" style={{ color: TEXT_MUTED }}>A balancing entry will be posted to undo {money((confirmEntry.debit || 0) + (confirmEntry.credit || 0))}. The original line stays for the record. If it was a transfer, the other account is reversed too.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmEntry(null)} className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg" style={{ background: SURFACE, color: TEXT_PRIMARY }}>Cancel</button>
              <button onClick={doReverse} disabled={reversing} className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50" style={{ background: BRAND }}>{reversing ? "Reversing…" : "Reverse"}</button>
            </div>
          </div>
        </div>
      )}`,'confirm');

if(/ /.test(c)) throw new Error('NUL');
parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('LedgerAccounts.jsx updated | parse OK');
