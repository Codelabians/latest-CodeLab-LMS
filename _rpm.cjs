const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/students/studentDetailsPages/RecordPaymentModal.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// imports
rep(`import { useGetQuery, usePostMutation } from "../../../api/apiSlice";`,
`import { useGetQuery, usePostMutation } from "../../../api/apiSlice";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../features/auth/authSlice";

const hasPermission = (user, perm) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return (user.permissions || []).includes(perm);
};`,'imports');

// state: skipFinance + permission
rep(`  const [recordPayment, { isLoading: isSaving }] = usePostMutation();`,
`  const [recordPayment, { isLoading: isSaving }] = usePostMutation();
  const currentUser = useSelector(selectCurrentUser);
  const canSkipFinance = hasPermission(currentUser, "record historical-payment");
  const [skipFinance, setSkipFinance] = useState(false);`,'state');

// reset on open
rep(`      setExtendDueDateTo("");`,
`      setExtendDueDateTo("");
      setSkipFinance(false);`,'reset');

// body: skip_finance
rep(`      paid_at: paidAt ? \`\${paidAt} 00:00:00\` : undefined,
      notes: notes || undefined,
      extend_due_date_to: extendDueDateTo || undefined,`,
`      paid_at: paidAt ? \`\${paidAt} 00:00:00\` : undefined,
      notes: notes || undefined,
      extend_due_date_to: extendDueDateTo || undefined,
      skip_finance: skipFinance || undefined,`,'body');

// checkbox after the Notes block
rep(`              placeholder="e.g. Paid at front desk"
            />
          </div>
        </div>`,
`              placeholder="e.g. Paid at front desk"
            />
          </div>

          {canSkipFinance && (
            <label className="flex items-start gap-2 p-3 rounded-lg cursor-pointer" style={{ background: "#FEF9C3", border: "1px solid #FDE68A" }}>
              <input type="checkbox" checked={skipFinance} onChange={(e) => setSkipFinance(e.target.checked)} className="mt-0.5" />
              <span className="text-xs text-[#854D0E]">
                <b>Historical — don&apos;t record in finance.</b> Marks the fee paid in the student&apos;s record only; no income or ledger entry is created. Use for back-dated months.
              </span>
            </label>
          )}
        </div>`,'checkbox');

if(/\u0000/.test(c)) throw new Error("NUL");
parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('RecordPaymentModal.jsx updated | parse OK');
