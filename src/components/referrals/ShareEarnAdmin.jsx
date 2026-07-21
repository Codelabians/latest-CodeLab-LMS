import { useState } from "react";
import { Loader2, Share2, Plus, X, Trophy, CheckCircle2, XCircle, ExternalLink, Gift, Megaphone } from "lucide-react";
import { useGetQuery, usePostMutation, usePatchMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TEXT_PRIMARY = "#0F172A";
const TEXT_SECONDARY = "#475569";
const TEXT_MUTED = "#94A3B8";

const PLATFORM_LABEL = { whatsapp: "WhatsApp", instagram_story: "Insta story", instagram_post: "Insta post" };

/**
 * Admin — Share & Earn: publish campaigns, review share proofs, watch the
 * combined student + employee leaderboard.
 */
export default function ShareEarnAdmin() {
  const [tab, setTab] = useState("campaigns");
  return (
    <div className="w-full px-6 py-6" style={{ fontFamily: "'Montserrat', sans-serif", background: "#FAFBFC", minHeight: "calc(100vh - 4rem)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Share2 size={20} style={{ color: BRAND }} />
        <h1 className="text-[18px] font-bold" style={{ color: TEXT_PRIMARY }}>Share & Earn</h1>
      </div>
      <div className="flex gap-2 mb-4">
        {[["campaigns", "Campaigns"], ["proofs", "Proof queue"], ["leaderboard", "Leaderboard"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold"
            style={tab === id ? { background: BRAND, color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "campaigns" && <CampaignsTab />}
      {tab === "proofs" && <ProofsTab />}
      {tab === "leaderboard" && <LeaderboardTab />}
    </div>
  );
}

function CampaignsTab() {
  const { data, isLoading, refetch } = useGetQuery({ path: "share-earn/campaigns" }, { refetchOnMountOrArgChange: true });
  const [patch] = usePatchMutation();
  const [open, setOpen] = useState(false);
  const rows = data?.data || [];

  const toggle = async (c) => {
    try {
      await patch({ path: `share-earn/campaigns/${c.uuid}`, body: { is_active: !c.is_active } }).unwrap();
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not update.", "error"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold text-white" style={{ background: BRAND }}>
          <Plus size={14} /> New campaign
        </button>
      </div>
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        : rows.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}>
            No campaigns yet. Publish one — every student and employee gets notified and can start sharing.
          </div>
        ) : rows.map((c) => (
          <div key={c.uuid} className="bg-white rounded-xl p-4 flex flex-wrap items-start gap-4" style={{ border: `1px solid ${BORDER}` }}>
            {c.asset?.url && <img src={c.asset.url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" style={{ border: `1px solid ${BORDER}` }} />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-bold" style={{ color: TEXT_PRIMARY }}>{c.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold" style={{ background: c.is_active ? "#F0FDF4" : "#F8FAFC", color: c.is_active ? "#15803D" : TEXT_MUTED }}>
                  {c.is_active ? "Active" : "Paused"}
                </span>
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{c.starts_at}{c.ends_at ? ` → ${c.ends_at}` : ""} · {c.reward_period}</span>
              </div>
              {c.prize && <div className="text-[11.5px] mt-0.5 inline-flex items-center gap-1" style={{ color: "#B45309" }}><Gift size={11} /> {c.prize}</div>}
              <div className="text-[11.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
                WA {c.whatsapp_points} · Story {c.instagram_story_points} · Post {c.instagram_post_points} · Click {c.click_points} pts
                &nbsp;·&nbsp; <b style={{ color: c.pending_proofs ? "#B45309" : TEXT_MUTED }}>{c.pending_proofs} pending proof(s)</b> · {c.approved_proofs} approved
              </div>
            </div>
            <button onClick={() => toggle(c)} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: c.is_active ? BRAND : "#15803D" }}>
              {c.is_active ? "Pause" : "Activate"}
            </button>
          </div>
        ))}
      {open && <NewCampaignModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); refetch(); }} />}
    </div>
  );
}

function NewCampaignModal({ onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [f, setF] = useState({
    title: "", caption: "", whatsapp_points: 10, instagram_story_points: 15, instagram_post_points: 30,
    click_points: 2, reward_period: "weekly", prize: "", ends_at: "",
  });
  const [asset, setAsset] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!f.title.trim() || !f.caption.trim()) { showToast("Add a title and caption.", "error"); return; }
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => { if (v !== "" && v != null) fd.append(k, v); });
    if (asset) fd.append("asset", asset);
    try {
      await post({ path: "share-earn/campaigns", body: fd }).unwrap();
      showToast("Campaign published — students and employees have been notified.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not publish.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: TEXT_PRIMARY };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 bg-white" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: TEXT_PRIMARY }}><Megaphone size={16} /> New Share & Earn campaign</span>
          <button onClick={onClose}><X size={18} style={{ color: TEXT_MUTED }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Title</label>
            <input value={f.title} onChange={set("title")} maxLength={255} placeholder="e.g. Summer admissions open!" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>
              Caption — use {"{referral_link}"} where each person&apos;s tracked link should go
            </label>
            <textarea value={f.caption} onChange={set("caption")} rows={4} maxLength={3000}
              placeholder={"🚀 Admissions open at CodeLab! Enroll here: {referral_link}"}
              className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Image / video to share (optional)</label>
            <input type="file" accept="image/*,video/mp4" onChange={(e) => setAsset(e.target.files?.[0] || null)} className="text-[12px]" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[["whatsapp_points", "WhatsApp pts"], ["instagram_story_points", "Story pts"], ["instagram_post_points", "Post pts"], ["click_points", "Click pts"]].map(([k, label]) => (
              <div key={k}>
                <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>{label}</label>
                <input type="number" min="0" value={f[k]} onChange={set(k)} className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none" style={cell} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Reward period</label>
              <select value={f.reward_period} onChange={set("reward_period")} className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none" style={cell}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Ends (optional)</label>
              <input type="date" value={f.ends_at} onChange={set("ends_at")} className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none" style={cell} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: TEXT_SECONDARY }}>Prize for the period winner (optional)</label>
            <input value={f.prize} onChange={set("prize")} maxLength={500} placeholder="e.g. CodeLab bottle + shoutout on our page" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2 sticky bottom-0 bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: TEXT_SECONDARY }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Publish & notify everyone
          </button>
        </div>
      </div>
    </div>
  );
}

function ProofsTab() {
  const [status, setStatus] = useState("pending");
  const { data, isLoading, refetch } = useGetQuery({ path: "share-earn/proofs", params: { status } }, { refetchOnMountOrArgChange: true });
  const [post, { isLoading: deciding }] = usePostMutation();
  const rows = data?.data || [];

  const decide = async (p, action) => {
    let body = {};
    if (action === "reject") {
      const note = window.prompt("Reason for rejection (shown to the participant):", "Screenshot does not show the share clearly.");
      if (note === null) return;
      body = { note };
    }
    try {
      const res = await post({ path: `share-earn/proofs/${p.uuid}/${action}`, body }).unwrap();
      showToast(res?.message || "Done.", "success");
      refetch();
    } catch (e) { showToast(e?.data?.message || "Could not update.", "error"); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["pending", "approved", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold capitalize"
            style={status === s ? { background: "#0F172A", color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>
            {s}
          </button>
        ))}
      </div>
      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
        : rows.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-[13px]" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}>No {status} proofs.</div>
        ) : rows.map((p) => (
          <div key={p.uuid} className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-4" style={{ border: `1px solid ${BORDER}` }}>
            {p.screenshot && (
              <a href={p.screenshot} target="_blank" rel="noreferrer">
                <img src={p.screenshot} alt="proof" className="w-20 h-20 rounded-lg object-cover" style={{ border: `1px solid ${BORDER}` }} />
              </a>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold" style={{ color: TEXT_PRIMARY }}>{p.user}</div>
              <div className="text-[11.5px]" style={{ color: TEXT_SECONDARY }}>
                {PLATFORM_LABEL[p.platform] || p.platform} · {p.campaign} · {String(p.created_at || "").slice(0, 16)}
              </div>
              {p.post_url && <a href={p.post_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#1D4ED8" }}><ExternalLink size={11} /> View post</a>}
              {p.note && <div className="text-[11px]" style={{ color: BRAND }}>Note: {p.note}</div>}
              {status === "approved" && <div className="text-[11px] font-bold" style={{ color: "#15803D" }}>+{p.points} pts</div>}
            </div>
            {status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => decide(p, "approve")} disabled={deciding} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: "#15803D" }}>
                  <CheckCircle2 size={13} /> Approve
                </button>
                <button onClick={() => decide(p, "reject")} disabled={deciding} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: BRAND }}>
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function LeaderboardTab() {
  const [period, setPeriod] = useState("weekly");
  const { data, isLoading } = useGetQuery({ path: "share-earn/leaderboard", params: { period } }, { refetchOnMountOrArgChange: true });
  const d = data?.data || {};
  const rows = d.rows || [];
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        {["weekly", "biweekly", "monthly"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold capitalize"
            style={period === p ? { background: "#0F172A", color: "#fff" } : { background: "#fff", color: TEXT_SECONDARY, border: `1px solid ${BORDER}` }}>
            {p}
          </button>
        ))}
        {d.since && <span className="text-[11.5px]" style={{ color: TEXT_MUTED }}>since {d.since}</span>}
      </div>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {isLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>
          : rows.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: TEXT_MUTED }}>No points in this period yet.</div>
          ) : (
            <table className="w-full text-[12.5px]">
              <thead><tr style={{ background: "#F8FAFC", color: TEXT_SECONDARY }}>{["#", "Name", "Who", "Points"].map((h, i) => <th key={i} className={`px-4 py-2 font-semibold text-[11px] ${h === "Points" ? "text-right" : "text-left"}`}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.user_uuid || i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-4 py-2 font-bold" style={{ color: i < 3 ? "#D97706" : TEXT_MUTED }}>{["🥇", "🥈", "🥉"][i] || i + 1}</td>
                    <td className="px-4 py-2 font-semibold" style={{ color: TEXT_PRIMARY }}>{r.name}</td>
                    <td className="px-4 py-2" style={{ color: TEXT_MUTED }}>{r.who}</td>
                    <td className="px-4 py-2 text-right font-bold" style={{ color: BRAND }}>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      <p className="text-[11.5px] flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
        <Trophy size={12} style={{ color: "#D97706" }} /> One combined competition — students and employees rank together. Hand out the period prize to the top scorer(s) and log it in your expenses as usual.
      </p>
    </div>
  );
}
