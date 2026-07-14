const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/finance/FeeCollection.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// imports: react-redux + authSlice + local hasPermission
rep(`import { useGetQuery, usePostMutation, useDownloadChallanMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";`,
`import { useGetQuery, usePostMutation, useDownloadChallanMutation } from "../../api/apiSlice";
import SearchableSelect from "../ui/SearchableSelect";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};`,'imports');

// compute canSkipFinance in main component (right after the q state) and pass to modal
rep(`  const [q, setQ] = useState("");`,
`  const currentUser = useSelector(selectCurrentUser);
  const canSkipFinance = hasPermission(currentUser, "record historical-payment");
  const [q, setQ] = useState("");`,'compute');

rep(`        <CollectModal
          installment={collectFor}
          studentUuid={selectedUuid}`,
`        <CollectModal
          installment={collectFor}
          studentUuid={selectedUuid}
          canSkipFinance={canSkipFinance}`,'prop');

// CollectModal: accept prop + state + checkbox + send flag
rep(`function CollectModal({ installment, studentUuid, onClose, onDone, onError }) {
  const remaining = Number(installment.remaining || 0);`,
`function CollectModal({ installment, studentUuid, onClose, onDone, onError, canSkipFinance }) {
  const remaining = Number(installment.remaining || 0);
  const [skipFinance, setSkipFinance] = useState(false);`,'modal-state');

rep(`          installment_uuid: installment.installment_uuid,
          note: note || undefined,`,
`          installment_uuid: installment.installment_uuid,
          note: note || undefined,
          skip_finance: skipFinance || undefined,`,'body');

// checkbox after the Note field
rep(`          <div className="mt-4">
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. balance to be paid next week"
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cellStyle} />
          </div>`,
`          <div className="mt-4">
            <label className="text-[11px] font-semibold block mb-1" style={{ color: TEXT_SECONDARY }}>Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. balance to be paid next week"
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cellStyle} />
          </div>
          {canSkipFinance && (
            <label className="mt-3 flex items-start gap-2 p-3 rounded-lg cursor-pointer" style={{ background: "#FEF9C3", border: "1px solid #FDE68A" }}>
              <input type="checkbox" checked={skipFinance} onChange={(e) => setSkipFinance(e.target.checked)} className="mt-0.5" />
              <span className="text-[11.5px]" style={{ color: "#854D0E" }}>
                <b>Historical — don&apos;t record in finance.</b> Marks the fee paid in the student&apos;s record only; no income or ledger entry is created. Use for back-dated months.
              </span>
            </label>
          )}`,'checkbox');

if(/\u0000/.test(c)) throw new Error("NUL");
parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('FeeCollection.jsx updated | parse OK');
