import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2, User, Wallet, Download, Plus, X,
  Mail, Phone, GraduationCap, Briefcase, BadgeCheck, Building2, ShieldCheck, CalendarRange,
  FileText, FileSignature, CheckCircle2, AlertTriangle, Eraser, MapPin,
  Coins, Landmark, Boxes,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";
import { EMPLOYMENT_SECTIONS } from "./employmentSections";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();
const API_URL = import.meta.env?.VITE_API_URL || "https://api.codelab.pk/public/api/";

const SECTION_COMPONENTS = {
  profile: ProfileTab, schedule: ScheduleTab, attendance: AttendanceTab, payslips: PayslipsTab,
  payroll: PayrollStatusTab, leave: LeaveTab, loans: LoansTab, bank: BankTab,
  documents: DocumentsTab, assets: AssetsTab, contracts: ContractsTab, stp: StpTab,
};

/* Assets issued to the signed-in staff member (read-only). */
function AssetsTab() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/assets" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data?.assets || [];
  if (isLoading) return <Spinner />;
  if (rows.length === 0) {
    return <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <Boxes size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="text-[13px]" style={{ color: "#94A3B8" }}>No assets issued to you.</p>
    </div>;
  }
  const statusChip = (s) => {
    const m = { issued: ["#1D4ED8", "#EFF6FF"], returned: ["#15803D", "#F0FDF4"], lost: ["#B91C1C", "#FEF2F2"], overdue: ["#B45309", "#FFFBEB"] }[s] || ["#475569", "#F1F5F9"];
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ color: m[0], background: m[1] }}>{s}</span>;
  };
  return (
    <div className="space-y-2">
      {rows.map((a) => (
        <div key={a.uuid} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[14px]" style={{ color: "#0F172A" }}>{a.asset?.name || a.asset?.asset_tag}</span>
              {statusChip(a.status)}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
              Tag {a.asset?.asset_tag}{a.assigned_at ? ` · issued ${String(a.assigned_at).slice(0, 10)}` : ""}{a.due_date ? ` · due ${String(a.due_date).slice(0, 10)}` : ""}{a.returned_at ? ` · returned ${String(a.returned_at).slice(0, 10)}` : ""}
            </div>
            {a.remarks && <div className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>{a.remarks}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function TeacherEmployment() {
  const { section } = useParams();
  const key = SECTION_COMPONENTS[section] ? section : "profile";
  const meta = EMPLOYMENT_SECTIONS.find((s) => s.key === key) || EMPLOYMENT_SECTIONS[0];
  const Comp = SECTION_COMPONENTS[key];
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center rounded-xl flex-shrink-0" style={{ width: 38, height: 38, background: "#FEF2F2", color: BRAND }}>
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-[16px] font-bold" style={{ color: "#0F172A" }}>{meta.label}</h2>
          <p className="text-[12px]" style={{ color: "#94A3B8" }}>{meta.hint}</p>
        </div>
      </div>
      <Comp />
    </div>
  );
}

function authedDownload(path, fallbackName) {
  return fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
    .then((res) => { if (!res.ok) throw new Error("nf"); return res.blob(); })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) { const a = document.createElement("a"); a.href = url; a.download = fallbackName; document.body.appendChild(a); a.click(); a.remove(); }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    })
    .catch(() => showToast("File not available.", "error"));
}

function DocumentsTab() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/documents" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  if (isLoading) return <Spinner />;
  if (rows.length === 0) {
    return <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <FileText size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="text-[13px]" style={{ color: "#94A3B8" }}>No documents on file yet.</p>
    </div>;
  }
  const expired = (d) => d && new Date(d) < new Date();
  return (
    <div className="space-y-2">
      {rows.map((d, i) => (
        <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[14px]" style={{ color: "#0F172A" }}>{d.label}</span>
              {d.is_verified
                ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1" style={{ background: "#F0FDF4", color: "#15803D" }}><CheckCircle2 size={10} /> Verified</span>
                : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#FFFBEB", color: "#B45309" }}>Unverified</span>}
              {expired(d.expiry_date) && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1" style={{ background: "#FEF2F2", color: BRAND }}><AlertTriangle size={10} /> Expired</span>}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
              {d.filename || "—"}{d.expiry_date ? ` · expires ${String(d.expiry_date).slice(0, 10)}` : ""}
            </div>
          </div>
          <button onClick={() => authedDownload(`teacher/me/documents/${d.uuid}/download`, d.filename || "document")}
            className="inline-flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: BRAND }}>
            <Download size={13} /> View
          </button>
        </div>
      ))}
    </div>
  );
}

function ContractsTab() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/me/contracts" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const [signFor, setSignFor] = useState(null);
  if (isLoading) return <Spinner />;
  if (rows.length === 0) {
    return <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <FileSignature size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="text-[13px]" style={{ color: "#94A3B8" }}>No contracts assigned to you yet.</p>
    </div>;
  }
  const STATUS = {
    signed: { fg: "#15803D", bg: "#F0FDF4", label: "Signed" },
    sent: { fg: "#B45309", bg: "#FFFBEB", label: "Awaiting your signature" },
    draft: { fg: "#94A3B8", bg: "#F1F5F9", label: "Draft" },
    rejected: { fg: BRAND, bg: "#FEF2F2", label: "Rejected" },
  };
  return (
    <div className="space-y-2">
      {rows.map((c, i) => {
        const st = STATUS[c.status] || STATUS.draft;
        return (
          <div key={i} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-[14px]" style={{ color: "#0F172A" }}>{c.name || "Employment contract"}{c.version ? ` · v${c.version}` : ""}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
                  {c.signed_at ? `Signed ${String(c.signed_at).slice(0, 10)}` : c.sent_at ? `Sent ${String(c.sent_at).slice(0, 10)}` : ""}
                  {c.expires_at ? ` · expires ${String(c.expires_at).slice(0, 10)}` : ""}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0" style={{ color: st.fg, background: st.bg }}>{st.label}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {c.has_pdf && (
                <button onClick={() => authedDownload(`teacher/me/contracts/${c.uuid}/download`, "contract")}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#475569" }}>
                  <Download size={13} /> View PDF
                </button>
              )}
              {c.can_sign && (
                <button onClick={() => setSignFor(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
                  <FileSignature size={13} /> Review & sign
                </button>
              )}
            </div>
          </div>
        );
      })}
      {signFor && <SignContractModal contract={signFor} onClose={() => setSignFor(null)} onDone={() => { setSignFor(null); refetch(); }} />}
    </div>
  );
}

function SignContractModal({ contract, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  const pos = (e) => {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    const t = e.touches?.[0];
    return { x: (t ? t.clientX : e.clientX) - r.left, y: (t ? t.clientY : e.clientY) - r.top };
  };
  const start = (e) => { drawing.current = true; const ctx = canvasRef.current.getContext("2d"); const { x, y } = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const { x, y } = pos(e); ctx.lineTo(x, y); ctx.strokeStyle = "#0F172A"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); hasInk.current = true; };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); hasInk.current = false; };

  const submit = async () => {
    if (!hasInk.current) { showToast("Please draw your signature first.", "error"); return; }
    const dataUrl = canvasRef.current.toDataURL("image/png");
    try {
      await post({ path: `teacher/me/contracts/${contract.uuid}/sign`, body: { signature_base64: dataUrl } }).unwrap();
      showToast("Contract signed.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not sign contract.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><FileSignature size={17} /> {contract.name || "Sign contract"}</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto" style={{ flex: 1 }}>
          <div className="rounded-lg p-3 text-[12.5px] mb-4" style={{ border: `1px solid ${BORDER}`, color: "#475569", maxHeight: 280, overflowY: "auto" }}
            dangerouslySetInnerHTML={{ __html: contract.body_html || "<p>Contract body unavailable.</p>" }} />
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold" style={{ color: "#475569" }}>Draw your signature</label>
            <button onClick={clear} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#94A3B8" }}><Eraser size={12} /> Clear</button>
          </div>
          <canvas ref={canvasRef} width={560} height={150}
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            className="w-full rounded-lg" style={{ border: `1px dashed #CBD5E1`, background: "#F8FAFC", touchAction: "none" }} />
          <p className="text-[11px] mt-2" style={{ color: "#94A3B8" }}>By signing you confirm you have read and agree to this contract. Your signature, date, IP and device are recorded.</p>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2 flex-shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Sign contract
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
}

const cap = (s) => (s ? String(s).replace(/_/g, " ") : "—");
const dt = (v) => (v ? String(v).slice(0, 10) : "—");

function InfoRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div className="flex items-start gap-2.5 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 26, height: 26, background: "#F8FAFC", color: "#94A3B8" }}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>{label}</div>
        <div className="text-[13px] font-semibold mt-0.5 break-words" style={{ color: valueColor || "#0F172A" }}>{value ?? "—"}</div>
      </div>
    </div>
  );
}

function CardBox({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2 mb-2 text-[12px] font-bold" style={{ color: "#0F172A" }}>
        {Icon && <Icon size={14} style={{ color: BRAND }} />} {title}
      </div>
      {children}
    </div>
  );
}

function ProfileTab() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/profile" }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  if (isLoading) return <Spinner />;
  if (!d.has_profile) {
    return <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <Briefcase size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="text-[13px]" style={{ color: "#94A3B8" }}>No employee profile is linked to your account yet.</p>
    </div>;
  }

  const initials = (d.name || "T").split(/\s+/).map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  const statusOk = String(d.employment_status || "").toLowerCase() === "active";

  return (
    <div className="space-y-3">
      {/* Header banner */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div style={{ height: 8, background: `linear-gradient(90deg, ${BRAND} 0%, #A00505 100%)` }} />
        <div className="bg-white p-5 flex flex-wrap items-center gap-4">
          <span className="grid place-items-center rounded-2xl text-white font-bold flex-shrink-0" style={{ width: 60, height: 60, background: `linear-gradient(135deg, ${BRAND} 0%, #A00505 100%)`, fontSize: 22 }}>{initials}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-bold" style={{ color: "#0F172A" }}>{d.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1" style={{ background: statusOk ? "#F0FDF4" : "#FFFBEB", color: statusOk ? "#15803D" : "#B45309" }}>
                <BadgeCheck size={11} /> {cap(d.employment_status)}
              </span>
            </div>
            <div className="text-[13px] font-semibold mt-0.5" style={{ color: BRAND }}>{d.designation || "—"}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px]" style={{ color: "#94A3B8" }}>
              <span className="inline-flex items-center gap-1"><BadgeCheck size={11} /> {d.employee_id || "—"}</span>
              <span>·</span>
              <span className="capitalize inline-flex items-center gap-1"><Briefcase size={11} /> {cap(d.employment_type)}</span>
              <span>·</span>
              <span className="capitalize inline-flex items-center gap-1"><Building2 size={11} /> {cap(d.work_location)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>Basic salary</div>
            <div className="text-[20px] font-bold" style={{ color: "#15803D" }}>{d.basic_salary != null ? money(d.basic_salary) : "—"}</div>
          </div>
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CardBox title="Employment" icon={Briefcase}>
          <InfoRow icon={CalendarRange} label="Joined" value={dt(d.joining_date)} />
          <InfoRow icon={CalendarRange} label="Contract period" value={(d.contract_start || d.contract_end) ? `${dt(d.contract_start)} → ${dt(d.contract_end)}` : "—"} />
          <div style={{ marginBottom: -8 }}>
            <InfoRow icon={ShieldCheck} label="Probation" value={d.probation_confirmed ? "Confirmed" : (d.probation_end_date ? `Until ${dt(d.probation_end_date)}` : "—")} valueColor={d.probation_confirmed ? "#15803D" : "#0F172A"} />
          </div>
        </CardBox>
        <CardBox title="Personal" icon={User}>
          <InfoRow icon={Mail} label="Email" value={d.email} />
          <InfoRow icon={Phone} label="Phone" value={d.contact} />
          <div style={{ marginBottom: -8 }}>
            <InfoRow icon={GraduationCap} label="Qualification" value={d.highest_qualification} />
          </div>
        </CardBox>
      </div>
    </div>
  );
}

function ScheduleTab() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/schedule" }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  if (isLoading) return <Spinner />;
  const ws = d.weekly_schedule || {};
  const hasAny = ws && Object.keys(ws).length > 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>Weekly hours</div>
          <div className="text-[20px] font-bold mt-1" style={{ color: "#0F172A" }}>{d.weekly_hours_expected ?? "—"}</div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>Schedule type</div>
          <div className="text-[14px] font-bold mt-1 capitalize" style={{ color: "#0F172A" }}>{(d.work_schedule_type || "—").toString().replace(/_/g, " ")}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3 text-[13px] font-bold" style={{ color: "#0F172A", borderBottom: `1px solid ${BORDER}` }}>Weekly schedule</div>
        {!hasAny ? (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#94A3B8" }}>No weekly schedule set. Your hours follow the default office timings.</div>
        ) : (
          DAYS.map((day) => {
            const slot = ws[day] || ws[day.slice(0, 3)] || {};
            const off = slot.off || slot.is_off || (!slot.start && !slot.end);
            return (
              <div key={day} className="flex items-center justify-between px-4 py-2.5 text-[13px]" style={{ borderTop: `1px solid ${BORDER}` }}>
                <span className="capitalize font-semibold" style={{ color: "#0F172A" }}>{day}</span>
                <span style={{ color: off ? "#94A3B8" : "#475569" }}>{off ? "Off" : `${slot.start || "—"} – ${slot.end || "—"}`}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PayslipsTab() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/payslips" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const [busy, setBusy] = useState(null);

  const openPayslip = async (uuid) => {
    setBusy(uuid);
    try {
      const res = await fetch(`${API_URL}teacher/me/payslips/${uuid}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) { showToast("Payslip not available yet.", "error"); return; }
      const blob = await res.blob();
      // Open in a new tab so both PDF and HTML payslips render in the browser
      // instead of downloading a mislabeled file.
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (!win) {
        // Popup blocked — fall back to a download with the right extension.
        const ext = (blob.type || "").includes("pdf") ? "pdf" : "html";
        const a = document.createElement("a");
        a.href = url; a.download = `payslip-${uuid}.${ext}`;
        document.body.appendChild(a); a.click(); a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      showToast("Could not open payslip.", "error");
    } finally { setBusy(null); }
  };

  if (isLoading) return <Spinner />;
  if (rows.length === 0) {
    return <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <Wallet size={28} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="text-[13px]" style={{ color: "#94A3B8" }}>No payslips yet.</p>
    </div>;
  }
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
          <div>
            <div className="text-[14px] font-bold" style={{ color: "#0F172A" }}>{r.year_month || "—"}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>
              Base {money(r.base_salary)} · +{money(r.allowances + r.bonuses)} · −{money(r.deductions)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[16px] font-bold" style={{ color: "#15803D" }}>{money(r.net_payable)}</div>
            <div className="inline-flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ background: "#F8FAFC", color: "#475569" }}>{r.status}</span>
              {r.has_payslip && (
                <button onClick={() => openPayslip(r.salary_uuid)} disabled={busy === r.salary_uuid}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: BRAND }}>
                  {busy === r.salary_uuid ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} View payslip
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaveTab() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/me/leave" }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const [applyOpen, setApplyOpen] = useState(false);

  if (isLoading) return <Spinner />;
  const balances = d.balances || [];
  const requests = d.requests || [];
  const types = d.types || [];

  const STATUS = {
    approved: { fg: "#15803D", bg: "#F0FDF4" }, pending: { fg: "#B45309", bg: "#FFFBEB" },
    rejected: { fg: BRAND, bg: "#FEF2F2" }, cancelled: { fg: "#94A3B8", bg: "#F1F5F9" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold" style={{ color: "#0F172A" }}>Leave balances ({new Date().getFullYear()})</h3>
        <button onClick={() => setApplyOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus size={13} /> Apply for leave
        </button>
      </div>

      {balances.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center text-[12px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No leave balances configured yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {balances.map((b, i) => (
            <div key={i} className="bg-white rounded-xl p-3.5" style={{ border: `1px solid ${BORDER}` }}>
              <div className="text-[12px] font-semibold" style={{ color: b.color || "#475569" }}>{b.leave_type}</div>
              <div className="text-[20px] font-bold mt-1" style={{ color: "#0F172A" }}>{b.remaining}</div>
              <div className="text-[10.5px] mt-0.5" style={{ color: "#94A3B8" }}>left of {b.allotted + b.carry_forward} · {b.used} used · {b.pending} pending</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>My requests</h3>
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-[12px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No leave requests yet.</div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-[12px]">
              <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Type", "Dates", "Days", "Status"].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {requests.map((r, i) => {
                  const st = STATUS[r.status] || STATUS.pending;
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td className="px-3 py-2" style={{ color: "#0F172A" }}>{r.leave_type}</td>
                      <td className="px-3 py-2" style={{ color: "#475569" }}>{String(r.start_date).slice(0, 10)}{r.end_date && r.end_date !== r.start_date ? ` → ${String(r.end_date).slice(0, 10)}` : ""}</td>
                      <td className="px-3 py-2" style={{ color: "#475569" }}>{r.day_count}{r.is_half_day ? " (½)" : ""}</td>
                      <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold capitalize" style={{ color: st.fg, background: st.bg }}>{r.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {applyOpen && <ApplyLeaveModal types={types} onClose={() => setApplyOpen(false)} onDone={() => { setApplyOpen(false); refetch(); }} />}
    </div>
  );
}

function ApplyLeaveModal({ types, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [form, setForm] = useState({ leave_type_uuid: "", start_date: "", end_date: "", reason: "", is_half_day: false, half_day_part: "am" });
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async () => {
    if (!form.leave_type_uuid || !form.start_date || !form.end_date) { showToast("Pick a leave type and dates.", "error"); return; }
    // A half-day must be a single day, and the backend requires half_day_part.
    if (form.is_half_day && form.start_date !== form.end_date) {
      showToast("A half-day leave must start and end on the same day.", "error");
      return;
    }
    const body = {
      leave_type_uuid: form.leave_type_uuid,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason || undefined,
      is_half_day: form.is_half_day,
      ...(form.is_half_day ? { half_day_part: form.half_day_part } : {}),
    };
    try {
      await post({ path: "teacher/me/leave", body }).unwrap();
      showToast("Leave request submitted.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not submit leave.", "error"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold" style={{ color: "#0F172A" }}>Apply for leave</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Leave type</label>
            <select value={form.leave_type_uuid} onChange={upd("leave_type_uuid")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
              <option value="">Select…</option>
              {types.map((t) => <option key={t.type_uuid} value={t.type_uuid}>{t.name}{t.is_paid ? "" : " (unpaid)"}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Start</label>
              <input type="date" value={form.start_date} onChange={upd("start_date")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>End</label>
              <input type="date" value={form.end_date} onChange={upd("end_date")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[12px]" style={{ color: "#475569" }}>
              <input type="checkbox" checked={form.is_half_day} onChange={upd("is_half_day")} /> Half day
            </label>
            {form.is_half_day && (
              <select value={form.half_day_part} onChange={upd("half_day_part")} className="px-2 py-1.5 rounded-lg text-[12px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
                <option value="am">Morning (AM)</option>
                <option value="pm">Afternoon (PM)</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Reason (optional)</label>
            <textarea value={form.reason} onChange={upd("reason")} rows={2} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-y" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function StpTab() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/me/stp" }, { refetchOnMountOrArgChange: true });
  const [post, { isLoading: saving }] = usePostMutation();
  const d = data?.data || {};
  const offices = d.offices || [];
  const recent = d.recent || [];
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ attendance_date: today, in_time: "", out_time: "", office_id: "", note: "" });
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading) return <Spinner />;
  if (!d.has_stp_office) {
    return <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
      <MapPin size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
      <p className="text-[13px]" style={{ color: "#94A3B8" }}>You are not assigned to a partner site (STP), so there is nothing to mark here.</p>
    </div>;
  }

  const submit = async () => {
    if (!form.attendance_date) { showToast("Pick a date.", "error"); return; }
    const body = { attendance_date: form.attendance_date };
    if (form.in_time) body.in_time = `${form.attendance_date} ${form.in_time}`;
    if (form.out_time) body.out_time = `${form.attendance_date} ${form.out_time}`;
    if (form.office_id) body.office_id = Number(form.office_id);
    if (form.note) body.note = form.note;
    try {
      await post({ path: "teacher/me/stp", body }).unwrap();
      showToast("STP attendance marked.", "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not mark attendance.", "error"); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <MapPin size={18} style={{ color: "#1D4ED8", marginTop: 1 }} />
        <div>
          <div className="text-[12.5px] font-bold mb-0.5" style={{ color: "#1D4ED8" }}>You work at a partner site (STP)</div>
          <p className="text-[12.5px]" style={{ color: "#1E3A8A" }}>Mark your attendance here for the days you are at the STP. {d.marked_today ? "Today is already marked." : "Today is not marked yet."}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="text-[12px] font-bold mb-3" style={{ color: "#0F172A" }}>Mark STP attendance</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Date</label>
            <input type="date" value={form.attendance_date} onChange={upd("attendance_date")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Site</label>
            <select value={form.office_id} onChange={upd("office_id")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }}>
              <option value="">{offices.length === 1 ? offices[0].name : "Select site (optional)"}</option>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}{o.city ? ` · ${o.city}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>In time</label>
            <input type="time" value={form.in_time} onChange={upd("in_time")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Out time</label>
            <input type="time" value={form.out_time} onChange={upd("out_time")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Note (optional)</label>
            <input value={form.note} onChange={upd("note")} placeholder="e.g. client meeting at STP" className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: saving ? 0.6 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />} Mark attendance
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>Recent attendance</h3>
        {recent.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-[12px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No attendance recorded yet.</div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-[12px]">
              <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Date", "In", "Out", "Status"].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2 font-semibold" style={{ color: "#0F172A" }}>{String(r.date).slice(0, 10)}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{r.in ? String(r.in).slice(11, 16) : "—"}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{r.out ? String(r.out).slice(11, 16) : "—"}</td>
                    <td className="px-3 py-2 capitalize" style={{ color: r.status === "at_stp" ? "#1D4ED8" : "#475569" }}>{String(r.status || "").replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLOR = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "present") return "#15803D";
  if (k === "absent") return BRAND;
  if (k === "on_leave" || k === "leave") return "#B45309";
  if (k === "at_stp") return "#1D4ED8";
  return "#475569";
};

function AttendanceTab() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/attendance", params: { month } }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const rows = d.rows || [];
  const t = d.totals || {};
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-[13px] font-bold" style={{ color: "#0F172A" }}>My attendance</h3>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-lg text-[12px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[["Present", t.present, "#15803D"], ["Absent", t.absent, BRAND], ["Leave", t.leave, "#B45309"], ["At STP", t.at_stp, "#1D4ED8"], ["Late", t.late, "#475569"]].map(([l, v, c], i) => (
          <div key={i} className="bg-white rounded-xl p-3 text-center" style={{ border: `1px solid ${BORDER}` }}>
            <div className="text-[18px] font-bold" style={{ color: c }}>{v ?? 0}</div>
            <div className="text-[10.5px] font-semibold" style={{ color: "#94A3B8" }}>{l}</div>
          </div>
        ))}
      </div>
      {isLoading ? <Spinner /> : rows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-[12px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No attendance this month.</div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <table className="w-full text-[12px]">
            <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Date", "In", "Out", "Status", "Note"].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: "#0F172A" }}>{String(r.date).slice(0, 10)}</td>
                  <td className="px-3 py-2" style={{ color: "#475569" }}>{r.in ? String(r.in).slice(11, 16) : "—"}</td>
                  <td className="px-3 py-2" style={{ color: "#475569" }}>{r.out ? String(r.out).slice(11, 16) : "—"}</td>
                  <td className="px-3 py-2 capitalize font-semibold" style={{ color: STATUS_COLOR(r.status) }}>{String(r.status || "").replace(/_/g, " ")}{r.late_minutes > 0 ? ` (+${r.late_minutes}m)` : ""}</td>
                  <td className="px-3 py-2" style={{ color: "#94A3B8" }}>{r.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PayrollStatusTab() {
  const { data, isLoading } = useGetQuery({ path: "/teacher/me/payroll-readiness" }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const blockers = d.blockers || [];
  if (isLoading) return <Spinner />;
  if (!d.has_profile) return <div className="bg-white rounded-xl p-10 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No employee profile linked.</div>;
  return (
    <div className="space-y-3">
      {d.is_ready ? (
        <div className="rounded-xl p-5 flex items-center gap-3" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <CheckCircle2 size={22} style={{ color: "#15803D" }} />
          <div>
            <div className="text-[14px] font-bold" style={{ color: "#15803D" }}>You are payroll-ready</div>
            <div className="text-[12px]" style={{ color: "#15803D" }}>All requirements are met — nothing is blocking your salary.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <AlertTriangle size={18} style={{ color: "#B45309", marginTop: 1 }} />
            <div>
              <div className="text-[13px] font-bold" style={{ color: "#B45309" }}>{blockers.length} item{blockers.length === 1 ? "" : "s"} to resolve before payroll</div>
              <div className="text-[12px]" style={{ color: "#92400E" }}>Complete these (some may need HR) so your salary can be processed.</div>
            </div>
          </div>
          <div className="space-y-2">
            {blockers.map((b, i) => (
              <div key={i} className="bg-white rounded-xl p-3.5 flex items-start gap-2.5" style={{ border: `1px solid ${BORDER}` }}>
                <span className="grid place-items-center rounded-md flex-shrink-0 mt-0.5" style={{ width: 22, height: 22, background: "#FEF2F2", color: BRAND }}><AlertTriangle size={12} /></span>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: "#0F172A" }}>{b.message || b.code}</div>
                  {b.action_required && <div className="text-[11.5px] mt-0.5" style={{ color: "#94A3B8" }}>{b.action_required}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LoansTab() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/me/loans" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const [open, setOpen] = useState(false);
  if (isLoading) return <Spinner />;
  const STATUS = { approved: "#15803D", pending: "#B45309", active: "#1D4ED8", rejected: BRAND, completed: "#475569", cancelled: "#94A3B8" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold" style={{ color: "#0F172A" }}>Loans & salary advances</h3>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus size={13} /> Request advance
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-[12px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No loans or advances yet.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
              <div>
                <div className="text-[14px] font-bold" style={{ color: "#0F172A" }}>{money(r.principal)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{r.installment_count} installments{r.installment_amount ? ` · ${money(r.installment_amount)}/mo` : ""}{r.start_year_month ? ` · from ${r.start_year_month}` : ""}{r.reason ? ` · ${r.reason}` : ""}</div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize" style={{ color: STATUS[r.status] || "#475569", background: "#F8FAFC" }}>{r.status}</span>
                {r.collected > 0 && <div className="text-[10.5px] mt-1" style={{ color: "#94A3B8" }}>Repaid {money(r.collected)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && <LoanRequestModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); refetch(); }} />}
    </div>
  );
}

function LoanRequestModal({ onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const nextMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); })();
  const [form, setForm] = useState({ principal_amount: "", installment_count: "3", start_year_month: nextMonth, reason: "" });
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!(Number(form.principal_amount) > 0) || !(Number(form.installment_count) > 0)) { showToast("Enter amount and installments.", "error"); return; }
    try {
      await post({ path: "teacher/me/loans", body: { principal_amount: Number(form.principal_amount), installment_count: Number(form.installment_count), start_year_month: form.start_year_month, reason: form.reason || undefined } }).unwrap();
      showToast("Advance request submitted.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not submit request.", "error"); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Coins size={17} /> Request salary advance</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Amount (Rs)</label>
            <input type="number" min="1" value={form.principal_amount} onChange={upd("principal_amount")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Installments</label>
            <input type="number" min="1" max="60" value={form.installment_count} onChange={upd("installment_count")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Repay from</label>
            <input type="month" value={form.start_year_month} onChange={upd("start_year_month")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Reason (optional)</label>
            <input value={form.reason} onChange={upd("reason")} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function BankTab() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/teacher/me/bank-accounts" }, { refetchOnMountOrArgChange: true });
  const rows = data?.data || [];
  const [open, setOpen] = useState(false);
  if (isLoading) return <Spinner />;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold" style={{ color: "#0F172A" }}>Payroll bank account</h3>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus size={13} /> Add account
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-[12px]" style={{ border: `1px solid ${BORDER}`, color: "#94A3B8" }}>No bank account on file. Add one so your salary can be paid.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3">
                <span className="grid place-items-center rounded-lg flex-shrink-0" style={{ width: 34, height: 34, background: "#F8FAFC", color: "#475569" }}><Landmark size={16} /></span>
                <div>
                  <div className="text-[14px] font-bold" style={{ color: "#0F172A" }}>{r.bank_name}{r.is_primary ? " · Primary" : ""}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{r.account_title} · {r.iban || r.account_number || "—"}{r.branch_name ? ` · ${r.branch_name}` : ""}</div>
                </div>
              </div>
              {r.is_verified
                ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1" style={{ background: "#F0FDF4", color: "#15803D" }}><CheckCircle2 size={10} /> Verified</span>
                : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#FFFBEB", color: "#B45309" }}>Pending HR verify</span>}
            </div>
          ))}
        </div>
      )}
      {open && <BankModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); refetch(); }} />}
    </div>
  );
}

function BankModal({ onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [form, setForm] = useState({ account_title: "", bank_name: "", branch_name: "", account_number: "", iban: "", is_primary: true });
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const submit = async () => {
    if (!form.account_title || !form.bank_name) { showToast("Account title and bank are required.", "error"); return; }
    if (!form.iban && !form.account_number) { showToast("Enter an IBAN or account number.", "error"); return; }
    try {
      await post({ path: "teacher/me/bank-accounts", body: { ...form, is_primary: form.is_primary ? 1 : 0 } }).unwrap();
      showToast("Bank account added. HR will verify it.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not add account.", "error"); }
  };
  const F = [["account_title", "Account title"], ["bank_name", "Bank name"], ["branch_name", "Branch (optional)"], ["account_number", "Account number"], ["iban", "IBAN"]];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Landmark size={17} /> Add bank account</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-2.5">
          {F.map(([k, label]) => (
            <div key={k}>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>{label}</label>
              <input value={form[k]} onChange={upd(k)} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
            </div>
          ))}
          <label className="flex items-center gap-2 text-[12px] pt-1" style={{ color: "#475569" }}>
            <input type="checkbox" checked={form.is_primary} onChange={upd("is_primary")} /> Use as primary payroll account
          </label>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Add account
          </button>
        </div>
      </div>
    </div>
  );
}
