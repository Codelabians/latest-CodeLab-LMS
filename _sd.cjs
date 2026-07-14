const fs=require('fs');const parser=require('@babel/parser');
const F='/sessions/wizardly-eager-newton/mnt/latest-CodeLab-LMS/';
const p='src/components/students/EditStudentPage.jsx';
let c=fs.readFileSync(F+p,'utf8');
function rep(a,b,t){const n=c.split(a).length-1;if(n!==1)throw new Error(t+' count='+n);c=c.replace(a,b);}

// prefill in form effect
rep(`        fixed_fee: s.fixed_fee ?? "",`,
`        fixed_fee: s.fixed_fee ?? "",
        join_date: (s.enrollments?.[0]?.join_date || "").slice(0, 10),
        enrollment_fee_due_date: "",
        monthly_billing_day: "",`,'prefill');

// submit body
rep(`    const body = { ...form, fixed_fee: form.fixed_fee === "" || form.fixed_fee == null ? null : Number(form.fixed_fee) };`,
`    const body = {
      ...form,
      fixed_fee: form.fixed_fee === "" || form.fixed_fee == null ? null : Number(form.fixed_fee),
      join_date: form.join_date || undefined,
      enrollment_fee_due_date: form.enrollment_fee_due_date || undefined,
      monthly_billing_day: form.monthly_billing_day ? Number(form.monthly_billing_day) : undefined,
    };`,'body');

// UI fields after Fixed fee
rep(`          <Field icon={CreditCard} label="Fixed fee (Rs)">
            <input type="number" min="0" className={inp} style={inputStyle()} value={form.fixed_fee} onChange={(e) => set("fixed_fee", e.target.value)} />
          </Field>`,
`          <Field icon={CreditCard} label="Fixed fee (Rs)">
            <input type="number" min="0" className={inp} style={inputStyle()} value={form.fixed_fee} onChange={(e) => set("fixed_fee", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Enrollment date">
            <input type="date" className={inp} style={inputStyle()} value={form.join_date} onChange={(e) => set("join_date", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Enrollment fee due date">
            <input type="date" className={inp} style={inputStyle()} value={form.enrollment_fee_due_date} onChange={(e) => set("enrollment_fee_due_date", e.target.value)} />
          </Field>
          <Field icon={CreditCard} label="Monthly fee day (1-28)">
            <input type="number" min="1" max="28" className={inp} style={inputStyle()} value={form.monthly_billing_day} onChange={(e) => set("monthly_billing_day", e.target.value)} />
          </Field>`,'ui');

parser.parse(c,{sourceType:'module',plugins:['jsx']});
fs.writeFileSync(F+p,c);
console.log('EditStudentPage.jsx updated | parse OK');
