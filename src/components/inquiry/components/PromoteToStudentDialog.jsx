import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Loader2, X, Home, Laptop, Wallet } from "lucide-react";
import { useGetQuery } from "../../../api/apiSlice";
import SearchableSelect from "../../ui/SearchableSelect";

const BRAND = "#15803D";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const SURFACE = "#F8FAFC";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const PromoteToStudentDialog = ({ open, inquiry, onCancel, onConfirm, isLoading }) => {
  const [batchUuid, setBatchUuid] = useState("");
  const [joiningDate, setJoiningDate] = useState(todayStr());
  const [enrollmentDue, setEnrollmentDue] = useState("");
  const [monthlyDue, setMonthlyDue] = useState("");
  const [hostalize, setHostalize] = useState(false);
  const [needsLaptop, setNeedsLaptop] = useState(false);
  const [laptopUuid, setLaptopUuid] = useState("");
  const [laptopFullCourse, setLaptopFullCourse] = useState(true);
  const [laptopDays, setLaptopDays] = useState("");
  const [laptopDiscountType, setLaptopDiscountType] = useState("");
  const [laptopDiscountValue, setLaptopDiscountValue] = useState("");
  const [payNow, setPayNow] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [payAccount, setPayAccount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payRef, setPayRef] = useState("");
  const [err, setErr] = useState("");
  const [stu, setStu] = useState({});

  useEffect(() => {
    if (open) {
      setBatchUuid(""); setJoiningDate(todayStr()); setEnrollmentDue(""); setMonthlyDue("");
      setHostalize(false); setNeedsLaptop((inquiry?.is_laptop_demanded === "Yes")); setLaptopUuid("");
      setLaptopFullCourse(true); setLaptopDays(""); setLaptopDiscountType(""); setLaptopDiscountValue("");
      setPayNow(false); setPayMethod("cash"); setPayAccount(""); setPayAmount(""); setPayRef(""); setErr("");
      // Strip placeholder values that the visitor->inquiry conversion writes
      // ("-", "—", "unknown", fake @placeholder.local emails) so the form
      // shows real values and leaves the rest blank for the admin to fill.
      const clean = (v) => {
        const t = String(v ?? "").trim();
        if (!t || t === "-" || t === "—" || t.toLowerCase() === "unknown") return "";
        return t;
      };
      const cleanEmail = (v) => {
        const t = clean(v);
        return /@placeholder\.local$/i.test(t) ? "" : t;
      };
      setStu({
        first_name: clean(inquiry?.first_name),
        last_name: clean(inquiry?.last_name),
        email: cleanEmail(inquiry?.email),
        phone_number: clean(inquiry?.phone_number || inquiry?.phone),
        cnic: clean(inquiry?.cnic),
        gender: ["male","female","other"].includes(String(inquiry?.gender || "").toLowerCase()) ? String(inquiry.gender).toLowerCase() : "",
        date_of_birth: inquiry?.date_of_birth ? String(inquiry.date_of_birth).slice(0,10) : "",
        city: clean(inquiry?.city),
        address: clean(inquiry?.address),
        guardian_name: clean(inquiry?.guardian_name),
        guardian_phone: clean(inquiry?.guardian_phone),
        university: clean(inquiry?.university),
        current_qualification: clean(inquiry?.current_qualification),
      });
    }
  }, [open, inquiry]);

  const { data: batchData } = useGetQuery({ path: "/course/batches", params: { per_page: 200 } }, { skip: !open });
  // Slot-aware: only show laptops free in the selected batch's time slot,
  // so one unit can still serve other slots.
  const laptopSlot = (batchData?.data || []).find((b) => b.batch_uuid === batchUuid)?.time_slot;
  const { data: laptopData } = useGetQuery(
    { path: "/assets/laptops-available", params: laptopSlot ? { time_slot: laptopSlot } : undefined },
    { skip: !open || !needsLaptop },
  );
  const { data: acctData } = useGetQuery({ path: "/finance/payment-accounts/active" }, { skip: !open || !payNow });
  const { data: cityData } = useGetQuery({ path: "/core/cities/active" }, { skip: !open });
  const { data: instData } = useGetQuery({ path: "/employee/institutes" }, { skip: !open });

  const batches = useMemo(() => {
    const list = batchData?.data || [];
    const cid = inquiry?.primary_course_id;
    return list.filter((b) => b.is_active && (!cid || String(b.course_id) === String(cid)));
  }, [batchData, inquiry]);
  const laptops = laptopData?.data || [];
  const accounts = acctData?.data || [];
  const cities = (cityData?.data || []).map((c) => c.name).filter(Boolean);
  const institutes = (instData?.data || []).map((i) => i.name).filter(Boolean);
  const cityOptions = cities.map((c) => ({ value: c, label: c }));
  const instOptions = institutes.map((i) => ({ value: i, label: i }));
  const batchOptions = batches.map((b) => ({ value: b.batch_uuid, label: `${b.name}${b.timing ? ` · ${b.timing}` : ""}${b.course_name ? ` · ${b.course_name}` : ""}` }));

  if (!open || !inquiry) return null;
  const name = `${inquiry.first_name || ""} ${inquiry.last_name || ""}`.trim();

  const submit = () => {
    setErr("");
    if (!batchUuid) { setErr("Please select a batch."); return; }
    if (!joiningDate) { setErr("Please set the joining date."); return; }
    if (needsLaptop && !laptopUuid) { setErr("Please pick a laptop unit, or turn off 'needs laptop'."); return; }
    if (payNow && !(Number(payAmount) > 0)) { setErr("Enter a payment amount, or turn off 'record payment'."); return; }
    if (!stu.gender) { setErr("Please select the student's gender."); return; }
    if (!stu.first_name) { setErr("Please enter the student's first name."); return; }

    const body = {
      batch_uuid: batchUuid,
      joining_date: joiningDate,
      is_hostalize: hostalize,
      student: Object.fromEntries(Object.entries(stu).filter(([, v]) => v !== "" && v != null)),
    };
    if (enrollmentDue) body.enrollment_due_date = enrollmentDue;
    if (monthlyDue) body.first_monthly_due_date = monthlyDue;
    if (needsLaptop && laptopUuid) {
      body.laptop_inventory_uuid = laptopUuid;
      body.laptop_full_course = laptopFullCourse;
      if (!laptopFullCourse && Number(laptopDays) > 0) body.laptop_days = Number(laptopDays);
      if (laptopDiscountType && Number(laptopDiscountValue) > 0) {
        body.laptop_discount_type = laptopDiscountType;
        body.laptop_discount_value = Number(laptopDiscountValue);
      }
    }
    if (payNow && Number(payAmount) > 0) {
      body.payment = {
        payment_method: payMethod,
        paid_at: todayStr(),
        ...(payAccount ? { payment_account_uuid: payAccount } : {}),
        ...(payRef ? { payment_reference: payRef } : {}),
        slots: [{ fee_slot: "enrollment", amount: Number(payAmount), payment_method: payMethod, ...(payAccount ? { payment_account_uuid: payAccount } : {}) }],
      };
    }
    onConfirm(body);
  };

  const inp = { background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
  const Toggle = ({ on, set }) => (
    <button type="button" onClick={() => set(!on)} className="relative inline-block rounded-full transition" style={{ width: 42, height: 24, background: on ? BRAND : "#CBD5E1" }}>
      <span className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: on ? 20 : 2 }} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(2,6,23,.5)", fontFamily: "'Montserrat', sans-serif" }} onClick={onCancel}>
      <div className="w-full max-w-lg my-8 bg-white shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2">
            <span className="grid rounded-lg place-items-center" style={{ width: 34, height: 34, background: "#F0FDF4", color: BRAND }}><GraduationCap size={17} /></span>
            <div>
              <h3 className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>Enroll {name || "student"}</h3>
              <p className="text-[12px]" style={{ color: TEXT_MUTED }}>{inquiry.primary_course?.name || "Course"} · creates the student + fees</p>
            </div>
          </div>
          <button onClick={onCancel} className="grid w-8 h-8 rounded-lg place-items-center" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Batch *</label>
              <SearchableSelect options={batchOptions} value={batchUuid} onChange={(v) => setBatchUuid(v || "")} placeholder="Search a batch…" />
              {batches.length === 0 && <p className="mt-1 text-[11px]" style={{ color: "#B45309" }}>No active batch for this course yet — create one under Batches first.</p>}
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Joining date *</label>
              <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Enrollment fee due</label>
              <input type="date" value={enrollmentDue} onChange={(e) => setEnrollmentDue(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
            </div>
            <div className="col-span-2">
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>First monthly fee due</label>
              <input type="date" value={monthlyDue} onChange={(e) => setMonthlyDue(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
            </div>
          </div>

          <div className="px-3 py-3 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="text-sm font-semibold mb-2" style={{ color: TEXT_PRIMARY }}>Student details</div>
            <div className="grid grid-cols-2 gap-2.5">
              <input value={stu.first_name || ""} onChange={(e) => setStu({ ...stu, first_name: e.target.value })} placeholder="First name *" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <input value={stu.last_name || ""} onChange={(e) => setStu({ ...stu, last_name: e.target.value })} placeholder="Last name" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <select value={stu.gender || ""} onChange={(e) => setStu({ ...stu, gender: e.target.value })} className="px-3 py-2 text-sm rounded-lg outline-none" style={inp}>
                <option value="">Gender *</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
              <input value={stu.cnic || ""} onChange={(e) => setStu({ ...stu, cnic: e.target.value })} placeholder="CNIC" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <input value={stu.email || ""} onChange={(e) => setStu({ ...stu, email: e.target.value })} placeholder="Email" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <input value={stu.phone_number || ""} onChange={(e) => setStu({ ...stu, phone_number: e.target.value })} placeholder="Phone" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <div>
                <label className="block mb-1 text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>Date of birth</label>
                <input type="date" value={stu.date_of_birth || ""} onChange={(e) => setStu({ ...stu, date_of_birth: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              </div>
              <div className="self-end"><SearchableSelect options={cityOptions} value={stu.city || ""} onChange={(v) => setStu({ ...stu, city: v || "" })} placeholder="Search city…" /></div>
              <input value={stu.guardian_name || ""} onChange={(e) => setStu({ ...stu, guardian_name: e.target.value })} placeholder="Guardian name" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <input value={stu.guardian_phone || ""} onChange={(e) => setStu({ ...stu, guardian_phone: e.target.value })} placeholder="Guardian phone" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <input value={stu.address || ""} onChange={(e) => setStu({ ...stu, address: e.target.value })} placeholder="Address" className="col-span-2 px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              <SearchableSelect options={instOptions} value={stu.university || ""} onChange={(v) => setStu({ ...stu, university: v || "" })} placeholder="Search institute…" />
              <input value={stu.current_qualification || ""} onChange={(e) => setStu({ ...stu, current_qualification: e.target.value })} placeholder="Degree (optional)" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Home size={15} style={{ color: BRAND }} /> Hostelite (boarder)</span>
            <Toggle on={hostalize} set={setHostalize} />
          </div>

          <div className="px-3 py-2.5 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Laptop size={15} style={{ color: BRAND }} /> Needs a laptop</span>
              <Toggle on={needsLaptop} set={setNeedsLaptop} />
            </div>
            {needsLaptop && (
              <div className="mt-2.5 space-y-2.5">
                <select value={laptopUuid} onChange={(e) => setLaptopUuid(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inp}>
                  <option value="">{laptopSlot ? `Select a laptop free in the ${laptopSlot} slot` : "Select an available laptop"}</option>
                  {laptops.map((l) => <option key={l.uuid} value={l.uuid}>{l.asset_tag}{l.name ? ` · ${l.name}` : ""}{l.serial_number ? ` · SN ${l.serial_number}` : ""}</option>)}
                </select>
                {laptopUuid && (
                  <>
                    {/* Duration: full course vs N days (days = return-by reminder). */}
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setLaptopFullCourse(true)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: laptopFullCourse ? "#F0FDF4" : SURFACE, color: laptopFullCourse ? BRAND : TEXT_SECONDARY, border: `1px solid ${laptopFullCourse ? BRAND : BORDER}` }}>Full course</button>
                      <button type="button" onClick={() => setLaptopFullCourse(false)} className="flex-1 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: !laptopFullCourse ? "#F0FDF4" : SURFACE, color: !laptopFullCourse ? BRAND : TEXT_SECONDARY, border: `1px solid ${!laptopFullCourse ? BRAND : BORDER}` }}>For N days</button>
                    </div>
                    {!laptopFullCourse && (
                      <input type="number" min="1" value={laptopDays} onChange={(e) => setLaptopDays(e.target.value)} placeholder="Number of days (return-by reminder)" className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
                    )}
                    {/* Optional recurring discount on the monthly laptop fee. */}
                    <div className="grid grid-cols-2 gap-2">
                      <select value={laptopDiscountType} onChange={(e) => setLaptopDiscountType(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inp}>
                        <option value="">No laptop discount</option>
                        <option value="flat">Flat Rs off</option>
                        <option value="percent">% off</option>
                      </select>
                      <input type="number" min="0" value={laptopDiscountValue} onChange={(e) => setLaptopDiscountValue(e.target.value)} disabled={!laptopDiscountType} placeholder={laptopDiscountType === "percent" ? "% per month" : "Rs per month"} className="px-3 py-2 text-sm rounded-lg outline-none" style={{ ...inp, opacity: laptopDiscountType ? 1 : 0.5 }} />
                    </div>
                    <p className="text-[11px]" style={{ color: TEXT_MUTED }}>Laptop fee bills every month at the standard rate{laptopDiscountType ? " minus this discount" : ""} while assigned.</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="px-3 py-2.5 rounded-lg" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}><Wallet size={15} style={{ color: BRAND }} /> Record a payment now</span>
              <Toggle on={payNow} set={setPayNow} />
            </div>
            {payNow && (
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                <input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (enrollment)" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inp}>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={payAccount} onChange={(e) => setPayAccount(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={inp}>
                  <option value="">Account (optional)</option>
                  {accounts.map((a) => <option key={a.uuid} value={a.uuid}>{a.display_name || a.account_title || a.bank_name}</option>)}
                </select>
                <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Reference (optional)" className="px-3 py-2 text-sm rounded-lg outline-none" style={inp} />
              </div>
            )}
          </div>

          {err && <div className="px-3 py-2 rounded-lg text-[13px] font-semibold" style={{ background: "#FEF2F2", color: "#C90606" }}>{err}</div>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}>Cancel</button>
          <button type="button" onClick={submit} disabled={isLoading} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: BRAND }}>
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Enrolling…</> : <><GraduationCap size={15} /> Enroll student</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteToStudentDialog;
