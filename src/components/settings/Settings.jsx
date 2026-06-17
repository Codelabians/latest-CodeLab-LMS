import { useState, useEffect } from "react";
import { usePostMutation, usePatchMutation, useGetQuery } from "../../api/apiSlice";
import { toast } from "react-toastify";
import { Settings as SettingsIcon, ClipboardCheck, Laptop, Loader2, Percent, Mail, Plus, Trash2, Sparkles } from "lucide-react";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const BRAND_RED_TINT = "#FEF2F2";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const SURFACE_HOVER = "#F8FAFC";

const Settings = () => {
  const [makeCheck, { isLoading: isToggling }] = usePostMutation();
  const { data, isLoading: isFetchingStatus } = useGetQuery({ path: "admin/feedback/status" });
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);

  useEffect(() => {
    if (data?.status !== undefined) setShowEvaluationForm(data.status === true || data.status === 1);
  }, [data]);

  const handleToggleChange = async (newValue) => {
    setShowEvaluationForm(newValue);
    try {
      const res = await makeCheck({ path: "/admin/feedback/toggle", body: { status: newValue ? 1 : 0 } }).unwrap();
      if (res.message) toast.success(res.message);
    } catch (error) {
      setShowEvaluationForm(!newValue);
      toast.error(error?.data?.message || "Failed to update settings.");
    }
  };

  // Website site-settings
  const [patchSite] = usePatchMutation();
  const { data: siteData } = useGetQuery({ path: "/site-settings" });
  const [laptopFee, setLaptopFee] = useState("");
  const [currency, setCurrency] = useState("Rs");
  const [certFee, setCertFee] = useState("");
  const [referralReward, setReferralReward] = useState("");
  const [ntnNumber, setNtnNumber] = useState("");
  const [savingSite, setSavingSite] = useState(false);
  useEffect(() => {
    if (siteData?.data) {
      setLaptopFee(String(siteData.data.laptop_monthly_fee ?? ""));
      setCurrency(siteData.data.currency || "Rs");
      setCertFee(String(siteData.data.certificate_fee ?? ""));
      setReferralReward(String(siteData.data.referral_reward ?? ""));
      setNtnNumber(String(siteData.data.ntn_number ?? ""));
    }
  }, [siteData]);
  const saveSite = async () => {
    setSavingSite(true);
    try {
      await patchSite({ path: "/site-settings", body: { laptop_monthly_fee: Number(laptopFee) || 0, currency, certificate_fee: Number(certFee) || 0, referral_reward: Number(referralReward) || 0, ntn_number: ntnNumber } }).unwrap();
      toast.success("Website settings saved");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to save");
    }
    setSavingSite(false);
  };

  // Org-wide default fee discounts (percent) — pre-fills challan/enroll dialogs.
  const { data: discData } = useGetQuery({ path: "finance/fee-discount-settings" });
  const [enrDisc, setEnrDisc] = useState("");
  const [monDisc, setMonDisc] = useState("");
  const [expiryDays, setExpiryDays] = useState("3");
  const [savingDisc, setSavingDisc] = useState(false);
  useEffect(() => {
    if (discData?.data) {
      setEnrDisc(String(discData.data.enrollment_discount_percent ?? ""));
      setMonDisc(String(discData.data.monthly_discount_percent ?? ""));
      setExpiryDays(String(discData.data.challan_expiry_days ?? 3));
    }
  }, [discData]);
  const saveDiscounts = async () => {
    setSavingDisc(true);
    try {
      await patchSite({
        path: "finance/fee-discount-settings",
        body: { enrollment_discount_percent: Number(enrDisc) || 0, monthly_discount_percent: Number(monDisc) || 0, challan_expiry_days: Number(expiryDays) || 0 },
      }).unwrap();
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to save discounts");
    }
    setSavingDisc(false);
  };

  // Challan notify recipients (BCC on challan emails) — per challan type.
  const { data: notifyData } = useGetQuery({ path: "finance/challan-notify-settings" });
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [savingNotify, setSavingNotify] = useState(false);
  useEffect(() => {
    const d = notifyData?.data;
    if (!d) return;
    setNotifyEnabled(!!d.enabled);
    setRecipients(Array.isArray(d.recipients) ? d.recipients.map((r) => ({
      email: r.email || "", student: !!r.student, inquiry: !!r.inquiry, visitor: !!r.visitor,
    })) : []);
  }, [notifyData]);
  const addRecipient = () => setRecipients((rs) => [...rs, { email: "", student: true, inquiry: true, visitor: true }]);
  const removeRecipient = (i) => setRecipients((rs) => rs.filter((_, idx) => idx !== i));
  const setRecipient = (i, patch) => setRecipients((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const saveNotify = async () => {
    setSavingNotify(true);
    try {
      const clean = recipients.filter((r) => r.email.trim());
      await patchSite({ path: "finance/challan-notify-settings", body: { enabled: notifyEnabled, recipients: clean } }).unwrap();
      toast.success("Challan notification recipients saved");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to save recipients");
    }
    setSavingNotify(false);
  };

  // WhatsApp AI draft assistant — enable + knowledge base.
  const { data: aiData } = useGetQuery({ path: "communication/ai-assistant-settings" });
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiKnowledge, setAiKnowledge] = useState("");
  const [savingAi, setSavingAi] = useState(false);
  useEffect(() => {
    const d = aiData?.data;
    if (!d) return;
    setAiEnabled(!!d.enabled);
    setAiKnowledge(d.knowledge || "");
  }, [aiData]);
  const saveAi = async () => {
    setSavingAi(true);
    try {
      await patchSite({ path: "communication/ai-assistant-settings", body: { enabled: aiEnabled, knowledge: aiKnowledge } }).unwrap();
      toast.success("AI assistant settings saved");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to save AI settings");
    }
    setSavingAi(false);
  };

  const inputStyle = { background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_PRIMARY, fontFamily: "'Montserrat', sans-serif" };
  const Switch = ({ on, onClick, disabled }) => (
    <button type="button" onClick={() => !disabled && onClick(!on)} disabled={disabled}
      className="relative inline-block rounded-full transition disabled:opacity-60" style={{ width: 46, height: 26, background: on ? BRAND_RED : "#CBD5E1" }}>
      <span className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 22, height: 22, left: on ? 22 : 2 }} />
    </button>
  );

  return (
    <div className="w-full px-6 py-6 min-h-[calc(100vh-4rem)]" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_RED_TINT, color: BRAND_RED }}>
          <SettingsIcon size={18} />
        </div>
        <div>
          <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>Settings</h1>
          <p className="text-[12px] mt-0.5" style={{ color: TEXT_MUTED }}>Portal options and public-website configuration</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Teacher Evaluation */}
        <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "#EFF6FF", color: "#1D4ED8" }}><ClipboardCheck size={17} /></span>
            <div className="flex-1">
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Teacher Evaluation Form</h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_SECONDARY }}>Show the evaluation form in the student panel.</p>
            </div>
            {isFetchingStatus
              ? <Loader2 size={18} className="animate-spin" style={{ color: TEXT_MUTED }} />
              : <Switch on={showEvaluationForm} onClick={handleToggleChange} disabled={isToggling} />}
          </div>
          <div className="mt-4 rounded-lg px-3 py-2 text-[12px] font-semibold inline-flex items-center"
            style={ showEvaluationForm ? { background: "#F0FDF4", color: "#15803D" } : { background: "#F1F5F9", color: TEXT_MUTED } }>
            {showEvaluationForm ? "✓ Visible to students" : "✕ Hidden from students"}
          </div>
        </div>

        {/* Website Settings */}
        <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: BRAND_RED_TINT, color: BRAND_RED }}><Laptop size={17} /></span>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Website Settings</h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_SECONDARY }}>Shown on the public admission form.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Laptop fee / month</label>
              <input type="number" min="0" value={laptopFee} onChange={(e) => setLaptopFee(e.target.value)} placeholder="3000"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Currency</label>
              <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Rs"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Certificate fee</label>
              <input type="number" min="0" value={certFee} onChange={(e) => setCertFee(e.target.value)} placeholder="5000"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Referral reward</label>
              <input type="number" min="0" value={referralReward} onChange={(e) => setReferralReward(e.target.value)} placeholder="500"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>NTN number (on certificate)</label>
              <input type="text" value={ntnNumber} onChange={(e) => setNtnNumber(e.target.value)} placeholder="e.g. 1234567-8"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
          </div>
          <button type="button" onClick={saveSite} disabled={savingSite}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>
            {savingSite ? <Loader2 size={14} className="animate-spin" /> : "Save changes"}
          </button>
          <p className="mt-3 text-[12px]" style={{ color: TEXT_MUTED }}>The laptop fee shows on the admission form. The certificate fee is the default challan amount. The referral reward is credited to an ambassador/alumni when one of their referrals becomes a paying student.</p>
        </div>

        {/* Default Fee Discounts */}
        <div className="bg-white rounded-xl p-6" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "#FFFBEB", color: "#B45309" }}><Percent size={17} /></span>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Default Fee Discounts</h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_SECONDARY }}>Applied to all courses as a percentage. Pre-fills the discount on challans &amp; enrollment — editable per person.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Enrolment discount (%)</label>
              <input type="number" min="0" max="100" value={enrDisc} onChange={(e) => setEnrDisc(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Monthly discount (%)</label>
              <input type="number" min="0" max="100" value={monDisc} onChange={(e) => setMonDisc(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Challan validity (days)</label>
              <input type="number" min="0" max="365" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} placeholder="3"
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>&quot;Valid till&quot; on challans = issue date + this many days (visitor/inquiry), or due date + this many days (student).</p>
            </div>
          </div>
          <button type="button" onClick={saveDiscounts} disabled={savingDisc}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>
            {savingDisc ? <Loader2 size={14} className="animate-spin" /> : "Save discounts"}
          </button>
          <p className="mt-3 text-[12px]" style={{ color: TEXT_MUTED }}>Set 0 for no default. These percentages auto-fill the discount fields on inquiry &amp; visitor challans, the inquiry form, and student enrollment — staff can still change them for an individual.</p>
        </div>

        {/* Challan notification recipients (BCC) */}
        <div className="bg-white rounded-xl p-6 lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "#EFF6FF", color: "#1D4ED8" }}><Mail size={17} /></span>
            <div className="flex-1">
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>Challan Email Notifications</h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_SECONDARY }}>BCC these people on challan emails (free). Toggle each per challan type — student, inquiry, visitor.</p>
            </div>
            <Switch on={notifyEnabled} onClick={setNotifyEnabled} />
          </div>

          {!notifyEnabled ? (
            <div className="rounded-lg px-3 py-2 text-[12px] inline-flex items-center" style={{ background: "#F1F5F9", color: TEXT_MUTED }}>✕ Notifications off — no one is BCC&apos;d</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase" style={{ color: TEXT_SECONDARY }}>
                      <th className="py-2 pr-3 font-semibold">Email</th>
                      <th className="py-2 px-2 font-semibold text-center">Student</th>
                      <th className="py-2 px-2 font-semibold text-center">Inquiry</th>
                      <th className="py-2 px-2 font-semibold text-center">Visitor</th>
                      <th className="py-2 pl-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.length === 0 ? (
                      <tr><td colSpan={5} className="py-3 text-[12px]" style={{ color: TEXT_MUTED }}>No recipients yet. Add one below.</td></tr>
                    ) : recipients.map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td className="py-2 pr-3">
                          <input type="email" value={r.email} onChange={(e) => setRecipient(i, { email: e.target.value })} placeholder="name@codelab.pk"
                            className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                        </td>
                        {["student", "inquiry", "visitor"].map((t) => (
                          <td key={t} className="py-2 px-2 text-center">
                            <input type="checkbox" checked={!!r[t]} onChange={(e) => setRecipient(i, { [t]: e.target.checked })} />
                          </td>
                        ))}
                        <td className="py-2 pl-2 text-right">
                          <button type="button" onClick={() => removeRecipient(i)} title="Remove"
                            className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, color: BRAND_RED, background: BRAND_RED_TINT, border: "1px solid #FECACA" }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addRecipient}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg"
                style={{ background: SURFACE_HOVER, border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>
                <Plus size={14} /> Add email
              </button>
            </>
          )}

          <div className="mt-4">
            <button type="button" onClick={saveNotify} disabled={savingNotify}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>
              {savingNotify ? <Loader2 size={14} className="animate-spin" /> : "Save recipients"}
            </button>
          </div>
          <p className="mt-3 text-[12px]" style={{ color: TEXT_MUTED }}>Recipients are BCC&apos;d (hidden from the student) on every matching challan email — student fee challans, inquiry challans, and visitor challans. Email is free, so this adds no cost.</p>
        </div>

        {/* WhatsApp AI draft assistant */}
        <div className="bg-white rounded-xl p-6 lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, background: "#F5F3FF", color: "#6D28D9" }}><Sparkles size={17} /></span>
            <div className="flex-1">
              <h2 className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>WhatsApp AI Assistant</h2>
              <p className="text-[12.5px] mt-0.5" style={{ color: TEXT_SECONDARY }}>Suggests replies in the WhatsApp Inbox (✨ button). It only <strong>drafts</strong> — your team reviews and sends. It answers strictly from the knowledge below.</p>
            </div>
            <Switch on={aiEnabled} onClick={setAiEnabled} />
          </div>
          <label className="block mb-1 text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Knowledge base (courses, fees, timings, FAQs…)</label>
          <textarea
            value={aiKnowledge}
            onChange={(e) => setAiKnowledge(e.target.value)}
            rows={8}
            placeholder={"e.g.\nWe offer: Web Development, Digital Marketing, Graphic Design.\nTimings: Mon–Sat, morning & evening batches.\nEnrolment fee: Rs 5,000. Monthly fee varies by course.\nLocation: Rafi Qamar Road, Bahawalpur.\nTo enroll: visit techschool.codelab.pk/enroll"}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-y"
            style={inputStyle}
          />
          <button type="button" onClick={saveAi} disabled={savingAi}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)` }}>
            {savingAi ? <Loader2 size={14} className="animate-spin" /> : "Save AI settings"}
          </button>
          <p className="mt-3 text-[12px]" style={{ color: TEXT_MUTED }}>The AI never sends on its own — it only fills the reply box for an admin to review. It costs a few paisa per suggestion. Keep the knowledge accurate; the AI won&apos;t invent answers and will defer to your team when unsure.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
