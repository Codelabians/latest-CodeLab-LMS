import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Loader2, User, Phone, CreditCard, MapPin, GraduationCap, Award,
  Camera, KeyRound, Eye, EyeOff, BadgeCheck, CalendarDays,
} from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { clearCredentials } from "../../features/auth/authSlice";
import { showToast } from "../ui/common/ShowToast";
import { PORTAL_LOGIN } from "../routes/RouteConstants";

const BRAND = "#C90606";
const BRAND_DARK = "#A00505";
const BORDER = "#EEF2F6";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="flex items-center justify-center flex-shrink-0 rounded-md" style={{ width: 26, height: 26, background: "#F8FAFC", color: "#94A3B8" }}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>{label}</div>
        <div className="text-[13px] font-semibold mt-0.5 break-words capitalize" style={{ color: "#0F172A" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

export default function PortalProfile() {
  const { data, isLoading, refetch } = useGetQuery({ path: "/student-portal/profile" }, { refetchOnMountOrArgChange: true });
  const s = data?.data?.student || {};
  const [uploadAvatar, { isLoading: uploading }] = usePostMutation();
  const fileRef = useRef(null);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  const name = s.name || "Student";
  const initials = name.split(/\s+/).map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  const avatarUrl = s.image?.file_url || s.image?.url || (typeof s.image === "string" ? s.image : null);

  const pickAvatar = () => fileRef.current?.click();
  const onAvatar = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("avatar", f);
    try {
      await uploadAvatar({ path: "user/upload-personal-avatar", body: fd }).unwrap();
      showToast("Profile photo updated.", "success");
      refetch();
    } catch (err) {
      showToast(err?.data?.message || "Could not update photo.", "error");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div style={{ height: 8, background: `linear-gradient(90deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` }} />
        <div className="bg-white p-5 flex flex-wrap items-center gap-4">
          <div className="relative flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt={name} className="rounded-2xl object-cover" style={{ width: 64, height: 64, border: `2px solid ${BORDER}` }} />
              : <span className="grid place-items-center rounded-2xl text-white font-bold" style={{ width: 64, height: 64, background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`, fontSize: 24 }}>{initials}</span>}
            <button onClick={pickAvatar} disabled={uploading} title="Change photo"
              className="absolute -bottom-1 -right-1 grid place-items-center rounded-full text-white shadow"
              style={{ width: 24, height: 24, background: BRAND }}>
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold" style={{ color: "#0F172A" }}>{name}</h2>
            <div className="text-[12.5px]" style={{ color: "#94A3B8" }}>{s.email}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {s.is_brand_ambassador && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1" style={{ background: "#FEF3C7", color: "#B45309" }}>
                  <Award size={11} /> Brand Ambassador
                </span>
              )}
              {s.promo_code && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1" style={{ background: "#FEF2F2", color: BRAND }}>
                  <BadgeCheck size={11} /> {s.promo_code}
                </span>
              )}
              {s.status && (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize" style={{ background: "#F0FDF4", color: "#15803D" }}>{s.status}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-2 text-[12px] font-bold" style={{ color: "#0F172A" }}><User size={14} style={{ color: BRAND }} /> My details</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <InfoRow icon={Phone} label="Phone" value={s.contact} />
          <InfoRow icon={CreditCard} label="CNIC" value={s.cnic} />
          <InfoRow icon={User} label="Gender" value={s.gender} />
          <InfoRow icon={MapPin} label="City" value={s.city} />
          <InfoRow icon={MapPin} label="Address" value={s.address} />
          <InfoRow icon={User} label="Guardian" value={s.guardian_name ? `${s.guardian_name}${s.guardian_phone ? ` · ${s.guardian_phone}` : ""}` : "—"} />
          <InfoRow icon={GraduationCap} label="Qualification" value={s.qualification} />
          <InfoRow icon={CalendarDays} label="Joined" value={s.date_of_joining ? String(s.date_of_joining).slice(0, 10) : "—"} />
        </div>
        <p className="text-[11px] mt-2" style={{ color: "#94A3B8" }}>To correct any of these details, please contact the front desk.</p>
      </div>

      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [post, { isLoading }] = usePostMutation();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.current || !form.next || !form.confirm) { showToast("Fill in all password fields.", "error"); return; }
    if (form.next.length < 8) { showToast("New password must be at least 8 characters.", "error"); return; }
    if (form.next !== form.confirm) { showToast("New password and confirmation don't match.", "error"); return; }
    try {
      await post({ path: "user/password", body: { current_password: form.current, password: form.next, password_confirmation: form.confirm } }).unwrap();
      showToast("Password changed. Please sign in again.", "success");
      dispatch(clearCredentials());
      localStorage.removeItem("token");
      navigate(PORTAL_LOGIN, { replace: true });
    } catch (e) {
      showToast(e?.data?.errors?.current_password?.[0] || e?.data?.message || "Could not change password.", "error");
    }
  };

  const fields = [
    { k: "current", label: "Current password", ph: "Current" },
    { k: "next", label: "New password", ph: "At least 8 characters" },
    { k: "confirm", label: "Confirm new", ph: "Re-enter new" },
  ];

  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[12px] font-bold" style={{ color: "#0F172A" }}><KeyRound size={14} style={{ color: BRAND }} /> Change password</div>
        <button onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#94A3B8" }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? "Hide" : "Show"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.k}>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>{f.label}</label>
            <input type={show ? "text" : "password"} value={form[f.k]} onChange={upd(f.k)} placeholder={f.ph}
              className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "#F8FAFC", border: `1px solid ${BORDER}` }} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px]" style={{ color: "#94A3B8" }}>You will be signed out and asked to sign in with the new password.</span>
        <button onClick={submit} disabled={isLoading} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
          {isLoading && <Loader2 size={14} className="animate-spin" />} Update password
        </button>
      </div>
    </div>
  );
}
