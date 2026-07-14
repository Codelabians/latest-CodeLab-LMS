const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/finance/StudentLoans.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// icons: add Paperclip
rep(`  HandCoins, Plus, X, Loader2, Check, Ban, Send, CircleDollarSign, Search,
} from "lucide-react";`,
`  HandCoins, Plus, X, Loader2, Check, Ban, Send, CircleDollarSign, Search, Paperclip,
} from "lucide-react";`,'icons');

// state: disburseFor
rep(`  const [repayFor, setRepayFor] = useState(null); // loan object`,
`  const [repayFor, setRepayFor] = useState(null); // loan object
  const [disburseFor, setDisburseFor] = useState(null); // loan object`,'state');

// disburse button -> open modal
rep(`<button disabled={posting} onClick={() => act(l.loan_uuid, "disburse", { disbursed_on: today() })} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#FEF2F2", color: BRAND }}><Send size={12} /> Disburse</button>`,
`<button disabled={posting} onClick={() => setDisburseFor(l)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#FEF2F2", color: BRAND }}><Send size={12} /> Disburse</button>`,'disburse-btn');

// render DisburseModal
rep(`      {repayFor && <RepaymentModal loan={repayFor} onClose={() => setRepayFor(null)} onDone={() => { setRepayFor(null); refetch(); }} />}`,
`      {repayFor && <RepaymentModal loan={repayFor} onClose={() => setRepayFor(null)} onDone={() => { setRepayFor(null); refetch(); }} />}
      {disburseFor && <DisburseModal loan={disburseFor} onClose={() => setDisburseFor(null)} onDone={() => { setDisburseFor(null); refetch(); }} />}`,'render');

// RepaymentModal: account-options + proof state
rep(`function RepaymentModal({ loan, onClose, onDone }) {
  const [form, setForm] = useState({ amount: "", paid_on: today(), method: "cash", note: "" });
  const [post, { isLoading }] = usePostMutation();`,
`function RepaymentModal({ loan, onClose, onDone }) {
  const [form, setForm] = useState({ amount: "", paid_on: today(), method: "cash", note: "", funded_by_account_uuid: "" });
  const [proofFile, setProofFile] = useState(null);
  const [post, { isLoading }] = usePostMutation();
  const { data: acctResp } = useGetQuery({ path: "finance/ledger/account-options" });
  const officeAccts = useMemo(() => (acctResp?.data || []).filter((a) => a.is_money), [acctResp]);`,'repay-state');

// RepaymentModal submit -> FormData
rep(`    try {
      const res = await post({ path: \`finance/student-loans/\${loan.loan_uuid}/repayments\`, body: form }).unwrap();`,
`    try {
      const fd = new FormData();
      fd.append("amount", String(amt));
      fd.append("paid_on", form.paid_on);
      fd.append("method", form.method);
      if (form.note) fd.append("note", form.note);
      if (form.funded_by_account_uuid) fd.append("funded_by_account_uuid", form.funded_by_account_uuid);
      if (proofFile) fd.append("proof", proofFile);
      const res = await post({ path: \`finance/student-loans/\${loan.loan_uuid}/repayments\`, body: fd }).unwrap();`,'repay-submit');

// RepaymentModal UI: Received into + proof before save
rep(`          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <button disabled={isLoading} onClick={submit}`,
`          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Received into</label>
            <select value={form.funded_by_account_uuid} onChange={(e) => setForm((f) => ({ ...f, funded_by_account_uuid: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">Auto (by method)</option>
              {officeAccts.map((a) => <option key={a.account_uuid} value={a.account_uuid}>{a.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={field}>
            <Paperclip size={13} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={isLoading} onClick={submit}`,'repay-ui');

// Insert DisburseModal before the Record repayment section
rep(`/* -------------------- Record repayment -------------------- */`,
`/* -------------------- Disburse loan -------------------- */
function DisburseModal({ loan, onClose, onDone }) {
  const [payerType, setPayerType] = useState("office");
  const [fundedAccount, setFundedAccount] = useState("");
  const [disbursedOn, setDisbursedOn] = useState(today());
  const [proofFile, setProofFile] = useState(null);
  const [post, { isLoading }] = usePostMutation();
  const { data: acctResp } = useGetQuery({ path: "finance/ledger/account-options" });
  const officeAccts = useMemo(() => (acctResp?.data || []).filter((a) => a.is_money), [acctResp]);
  const personAccts = useMemo(() => (acctResp?.data || []).filter((a) => a.is_person), [acctResp]);
  const sourceAccts = payerType === "person" ? personAccts : officeAccts;

  const submit = async () => {
    if (payerType === "person" && !fundedAccount) return showToast("Pick the person giving this loan", "error");
    try {
      const fd = new FormData();
      fd.append("disbursed_on", disbursedOn);
      if (fundedAccount) fd.append("funded_by_account_uuid", fundedAccount);
      if (proofFile) fd.append("proof", proofFile);
      const res = await post({ path: \`finance/student-loans/\${loan.loan_uuid}/disburse\`, body: fd }).unwrap();
      showToast(res?.message || "Loan disbursed", "success");
      onDone();
    } catch (e) {
      showToast(e?.data?.message || "Could not disburse", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="w-full max-w-sm p-6 bg-white rounded-2xl" style={{ border: \`1px solid \${BORDER}\`, fontFamily: "'Montserrat', sans-serif" }}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Disburse loan</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: TEXT_MUTED }}><X size={18} /></button>
        </div>
        <div className="mb-3 p-2.5 rounded-lg text-[12px]" style={{ background: SURFACE, color: TEXT_SECONDARY }}>
          {loan.student?.name} · {money(loan.principal_amount)}
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Disbursed on</label>
            <input type="date" value={disbursedOn} onChange={(e) => setDisbursedOn(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Given from</label>
            <div className="inline-flex p-0.5 mb-2 rounded-lg" style={{ background: SURFACE }}>
              {[{ v: "office", l: "Office account" }, { v: "person", l: "A person" }].map((o) => (
                <button key={o.v} type="button" onClick={() => { setPayerType(o.v); setFundedAccount(""); }}
                        className="px-3 py-1.5 text-[12px] font-medium rounded-md"
                        style={payerType === o.v ? { background: "#fff", color: BRAND } : { color: TEXT_MUTED }}>{o.l}</button>
              ))}
            </div>
            <select value={fundedAccount} onChange={(e) => setFundedAccount(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={field}>
              <option value="">{payerType === "person" ? "Select a person…" : "Default cash account"}</option>
              {sourceAccts.map((a) => <option key={a.account_uuid} value={a.account_uuid}>{a.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg cursor-pointer" style={field}>
            <Paperclip size={13} /> {proofFile ? proofFile.name : "Attach proof image (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={isLoading} onClick={submit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5" style={{ background: BRAND, opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Disburse loan
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Record repayment -------------------- */`,'disburse-modal');

if(/\u0000/.test(c)) throw new Error("NUL");
parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('StudentLoans.jsx updated | parse OK');
