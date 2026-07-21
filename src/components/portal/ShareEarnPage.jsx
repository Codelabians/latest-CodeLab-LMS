import { useState } from "react";
import { Loader2, Share2, Trophy, Copy, Check, Upload, X, Star, Clock, Gift, Link2, FileImage } from "lucide-react";
import { useGetQuery, usePostMutation } from "../../api/apiSlice";
import { showToast } from "../ui/common/ShowToast";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";

const PLATFORMS = [
  { value: "whatsapp", label: "WhatsApp status", pointsKey: "whatsapp_points", color: "#059669" },
  { value: "instagram_story", label: "Instagram story", pointsKey: "instagram_story_points", color: "#DB2777" },
  { value: "instagram_post", label: "Instagram post / reel", pointsKey: "instagram_post_points", color: "#7C3AED" },
];
const PROOF_STATUS = {
  pending: { fg: "#B45309", bg: "#FFFBEB", label: "Pending review" },
  approved: { fg: "#15803D", bg: "#F0FDF4", label: "Approved" },
  rejected: { fg: BRAND, bg: "#FEF2F2", label: "Rejected" },
};

/**
 * Share & Earn — one competition for students and staff. basePath differs
 * per portal (student-portal/share-earn vs teacher/me/share-earn).
 */
export default function ShareEarnPage({ basePath = "/student-portal/share-earn" }) {
  const { data, isLoading, refetch } = useGetQuery({ path: basePath }, { refetchOnMountOrArgChange: true });
  const [proofFor, setProofFor] = useState(null); // campaign object
  const d = data?.data || {};
  const campaigns = d.campaigns || [];
  const leaderboard = d.leaderboard || [];

  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard?.writeText(d.referral_link || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;

  return (
    <div className="space-y-4">
      {/* My points + link */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[22px] font-bold" style={{ color: BRAND }}>{d.my_points_period ?? 0}</div>
          <div className="text-[11px] font-semibold" style={{ color: "#94A3B8" }}>My points this {String(d.period || "week").replace("ly", "")}</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[22px] font-bold" style={{ color: "#0F172A" }}>{d.my_points_total ?? 0}</div>
          <div className="text-[11px] font-semibold" style={{ color: "#94A3B8" }}>All-time points</div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[11px] font-semibold mb-1" style={{ color: "#94A3B8" }}>Your share link — every click earns points</div>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[11.5px] font-semibold truncate" style={{ color: "#0F172A" }}>{d.referral_link}</span>
            <button onClick={copyLink} className="p-1.5 rounded-lg" style={{ border: `1px solid ${BORDER}`, color: copied ? "#15803D" : "#475569" }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <Share2 size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
          <p className="text-[13px]" style={{ color: "#94A3B8" }}>No active campaigns right now — check back soon!</p>
        </div>
      ) : (
        campaigns.map((c) => (
          <div key={c.uuid} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex flex-wrap items-start gap-4">
              {c.asset?.url && (
                <a href={c.asset.url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                  {/\.(mp4|mov)$/i.test(c.asset.url) ? (
                    <video src={c.asset.url} className="w-28 h-28 rounded-xl object-cover" muted />
                  ) : (
                    <img src={c.asset.url} alt="" className="w-28 h-28 rounded-xl object-cover" style={{ border: `1px solid ${BORDER}` }} />
                  )}
                </a>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-bold" style={{ color: "#0F172A" }}>{c.title}</h3>
                  {c.ends_at && <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#94A3B8" }}><Clock size={11} /> until {c.ends_at}</span>}
                </div>
                {c.prize && (
                  <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: "#FFFBEB", color: "#B45309" }}>
                    <Gift size={11} /> {c.reward_period} prize: {c.prize}
                  </div>
                )}
                <p className="text-[12px] mt-2 whitespace-pre-wrap" style={{ color: "#475569" }}>{c.caption_filled}</p>
                <button
                  onClick={() => { navigator.clipboard?.writeText(c.caption_filled); showToast("Caption + your link copied — paste it in your post!", "success"); }}
                  className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold" style={{ color: "#1D4ED8" }}
                >
                  <Copy size={11} /> Copy caption with my link
                </button>

                <div className="flex flex-wrap gap-2 mt-3">
                  {PLATFORMS.map((p) => (
                    <span key={p.value} className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: "#F8FAFC", color: p.color, border: `1px solid ${BORDER}` }}>
                      {p.label}: {c[p.pointsKey]} pts
                    </span>
                  ))}
                  <span className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: "#F8FAFC", color: "#475569", border: `1px solid ${BORDER}` }}>
                    <Link2 size={10} className="inline mr-0.5" /> {c.click_points} pts per link click
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button onClick={() => setProofFor(c)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
                    <Upload size={13} /> I shared it — submit proof
                  </button>
                  {(c.my_proofs || []).map((p, i) => {
                    const st = PROOF_STATUS[p.status] || PROOF_STATUS.pending;
                    return (
                      <span key={i} className="px-2 py-1 rounded-full text-[10.5px] font-bold" style={{ background: st.bg, color: st.fg }} title={p.note || ""}>
                        {String(p.platform).replace(/_/g, " ")}: {st.label}{p.status === "approved" ? ` +${p.points}` : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <Trophy size={15} style={{ color: "#D97706" }} />
          <span className="text-[13px] font-bold" style={{ color: "#0F172A" }}>Leaderboard — this {String(d.period || "week").replace("ly", "")} (since {d.period_since})</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="py-10 text-center text-[12px]" style={{ color: "#94A3B8" }}>No points yet this period — be the first!</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <tbody>
              {leaderboard.map((r, i) => (
                <tr key={r.user_uuid || i} style={{ borderTop: i ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-2 w-10 font-bold" style={{ color: i < 3 ? "#D97706" : "#94A3B8" }}>{["🥇", "🥈", "🥉"][i] || `#${i + 1}`}</td>
                  <td className="px-4 py-2 font-semibold" style={{ color: "#0F172A" }}>{r.name}</td>
                  <td className="px-4 py-2 text-[11px]" style={{ color: "#94A3B8" }}>{r.who}</td>
                  <td className="px-4 py-2 text-right font-bold" style={{ color: BRAND }}>{r.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {proofFor && <ProofModal basePath={basePath} campaign={proofFor} onClose={() => setProofFor(null)} onDone={() => { setProofFor(null); refetch(); }} />}
    </div>
  );
}

function ProofModal({ basePath, campaign, onClose, onDone }) {
  const [post, { isLoading }] = usePostMutation();
  const [platform, setPlatform] = useState("whatsapp");
  const [file, setFile] = useState(null);
  const [postUrl, setPostUrl] = useState("");

  const submit = async () => {
    if (!file) { showToast("Attach a screenshot of your share.", "error"); return; }
    const fd = new FormData();
    fd.append("platform", platform);
    fd.append("screenshot", file);
    if (postUrl.trim()) fd.append("post_url", postUrl.trim());
    try {
      const res = await post({ path: `${basePath}/${campaign.uuid}/proof`, body: fd }).unwrap();
      showToast(res?.message || "Proof submitted.", "success");
      onDone();
    } catch (e) { showToast(e?.data?.message || "Could not submit proof.", "error"); }
  };

  const cell = { background: "#F8FAFC", border: `1px solid ${BORDER}`, color: "#0F172A" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="text-[15px] font-bold flex items-center gap-2" style={{ color: "#0F172A" }}><Upload size={16} /> Submit share proof</span>
          <button onClick={onClose}><X size={18} style={{ color: "#94A3B8" }} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Where did you share it?</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell}>
              {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label} — {campaign[p.pointsKey]} pts</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Screenshot (shows your post/story)</label>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer" style={{ border: `1px dashed ${BORDER}`, color: "#475569" }}>
              <FileImage size={15} /> {file ? file.name : "Choose image…"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1" style={{ color: "#475569" }}>Post link (optional — for Instagram posts/reels)</label>
            <input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://instagram.com/p/…" className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={cell} />
          </div>
          <p className="text-[11px]" style={{ color: "#94A3B8" }}>
            <Star size={11} className="inline mr-0.5" style={{ color: "#D97706" }} />
            Points are added after staff verifies your screenshot. One share per platform per day per campaign.
          </p>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>Cancel</button>
          <button onClick={submit} disabled={isLoading} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: BRAND, opacity: isLoading ? 0.6 : 1 }}>
            {isLoading && <Loader2 size={15} className="animate-spin" />} Submit proof
          </button>
        </div>
      </div>
    </div>
  );
}
