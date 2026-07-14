const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/finance/FeeCollection.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// mutation + handler after sendChallan
rep(`  const [sendChallan] = usePostMutation();`,
`  const [sendChallan] = usePostMutation();
  const [resetInst] = usePostMutation();

  const resetToPending = async (uuid) => {
    if (!window.confirm("Undo all payments on this installment and set it back to pending? Any finance income/ledger for it is reversed.")) return;
    try {
      await resetInst({ path: \`finance/installments/\${uuid}/reset\`, body: {} }).unwrap();
      notify("Installment reset to pending.");
      refetch();
    } catch (e) {
      notify(e?.data?.message || "Could not reset installment.", false);
    }
  };`,'handler');

// Reset button on paid rows (gated)
rep(`                            {i.remaining > 0 && (
                              <button
                                onClick={() => setCollectFor(i)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                                style={{ background: BRAND }}
                              >Collect</button>
                            )}`,
`                            {i.remaining > 0 && (
                              <button
                                onClick={() => setCollectFor(i)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                                style={{ background: BRAND }}
                              >Collect</button>
                            )}
                            {canSkipFinance && i.remaining <= 0 && Number(i.paid) > 0 && (
                              <button
                                onClick={() => resetToPending(i.installment_uuid)}
                                title="Undo payments → pending"
                                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ border: "1px solid #FCA5A5", color: "#B91C1C" }}
                              >Reset</button>
                            )}`,'button');

if(/\u0000/.test(c)) throw new Error("NUL");
parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('FeeCollection reset button added | parse OK');
