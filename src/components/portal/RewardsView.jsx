import { useState } from "react";
import { Loader2, Gift, Copy, Check } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();

/**
 * Shared rewards view for the student & teacher portals. Both endpoints
 * return the same shape:
 *   { referral_code, reward_amount, rewards[],
 *     rewards_summary{count,total,earned,pending}, benefit_text }.
 */
export default function RewardsView({ path }) {
  const { data, isLoading } = useGetQuery({ path }, { refetchOnMountOrArgChange: true });
  const [copied, setCopied] = useState(false);
  const d = data?.data || {};
  const rewards = d.rewards || [];
  const summary = d.rewards_summary || {};
  const benefitText = d.benefit_text || "";
  const code = d.referral_code || "";
  const rewardAmount = d.reward_amount;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: BRAND }} /></div>;
  }

  return (
    <div className="space-y-4">
      {code && (
        <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: `1px solid #FECACA` }}>
          <div className="text-[12px] font-semibold mb-1" style={{ color: BRAND }}>Your referral code</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[22px] font-bold tracking-wide" style={{ color: "#0F172A" }}>{code}</span>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ background: copied ? "#15803D" : BRAND, color: "#fff" }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
          {rewardAmount ? (
            <p className="text-[12.5px] mt-2" style={{ color: "#7F1D1D" }}>
              Share this code. When someone enrols using it, you earn {money(rewardAmount)} per referral.
            </p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: "#94A3B8" }}><Gift size={14} style={{ color: "#1D4ED8" }} /> Referrals</div>
          <div className="text-[22px] font-bold mt-1" style={{ color: "#0F172A" }}>{summary.count ?? rewards.length ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>Earned</div>
          <div className="text-[22px] font-bold mt-1" style={{ color: "#15803D" }}>{money(summary.earned ?? summary.total)}</div>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <div className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>Pending</div>
          <div className="text-[22px] font-bold mt-1" style={{ color: "#B45309" }}>{money(summary.pending)}</div>
        </div>
      </div>

      {benefitText && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <Gift size={18} style={{ color: "#1D4ED8", marginTop: 1 }} />
          <div>
            <div className="text-[12.5px] font-bold mb-0.5" style={{ color: "#1D4ED8" }}>Rewards & referrals</div>
            <p className="text-[12.5px]" style={{ color: "#1E3A8A" }}>{benefitText}</p>
          </div>
        </div>
      )}

      {rewards.length > 0 ? (
        <div>
          <h3 className="text-[13px] font-bold mb-2" style={{ color: "#0F172A" }}>My rewards</h3>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full text-[12px]">
              <thead><tr style={{ background: "#F8FAFC", color: "#475569" }}>{["Type", "Amount", "Status", "Referred", "Date"].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-[11px]">{h}</th>)}</tr></thead>
              <tbody>
                {rewards.map((r, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2 capitalize" style={{ color: "#0F172A" }}>{String(r.reward_type || "").replace(/_/g, " ")}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: "#0F172A" }}>{money(r.amount)}</td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>
                      <span className="capitalize">{r.status}</span>
                      {r.status === "cancelled" && r.cancellation_reason && (
                        <div className="text-[10.5px] mt-0.5" style={{ color: "#B91C1C" }}>{r.cancellation_reason}</div>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ color: "#475569" }}>{r.referred_name || "—"}</td>
                    <td className="px-3 py-2" style={{ color: "#94A3B8" }}>{(r.applied_at || "").slice(0, 10) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: `1px solid ${BORDER}` }}>
          <Gift size={30} className="mx-auto mb-2" style={{ color: "#CBD5E1" }} />
          <p className="text-[13px]" style={{ color: "#94A3B8" }}>No rewards yet. Share your code to start earning.</p>
        </div>
      )}
    </div>
  );
}
