import { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";

import { useGetQuery } from "../../../api/apiSlice";
import { BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../dashboardConstants";
import WidgetCard from "./WidgetCard";

const BRAND = "#C90606";
const money = (n) => "Rs " + Number(n || 0).toLocaleString();

/**
 * Personal referral widget — shows the staff member's own shareable code and
 * what they've earned / are owed. Cash rewards are paid out by finance; the
 * "pending" figure is what's been earned but not yet disbursed.
 */
export default function MyReferralWidget() {
  const { data, isLoading, error } = useGetQuery({ path: "employee/dashboard/my-summary" });
  const [copied, setCopied] = useState(false);
  const r = data?.data?.referral;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(r?.referral_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const sum = r?.rewards_summary || {};

  return (
    <WidgetCard
      icon={Gift}
      title="My referral code"
      subtitle="Share your code — earn a reward for every enrolment"
      loading={isLoading}
      error={error ? "Failed to load your referral details." : null}
      empty={!isLoading && !r?.referral_code}
      emptyMessage="No referral code assigned to this account yet."
    >
      {r?.referral_code && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <span className="text-lg font-bold tracking-wide" style={{ color: TEXT_PRIMARY }}>{r.referral_code}</span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold text-white"
              style={{ background: copied ? "#15803D" : BRAND }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
          {r.reward_amount ? (
            <p className="text-[12px]" style={{ color: TEXT_SECONDARY }}>
              You earn <b>{money(r.reward_amount)}</b> in cash for every new student who enrols with your code.
            </p>
          ) : null}
          <ul className="grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: BORDER }}>
            <MiniStat label="Referrals" value={sum.count ?? 0} />
            <MiniStat label="Earned" value={money(sum.earned ?? sum.total)} color="#15803D" />
            <MiniStat label="Pending" value={money(sum.pending)} color="#B45309" />
          </ul>
        </div>
      )}
    </WidgetCard>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <li className="flex flex-col">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: color || TEXT_PRIMARY }}>{value}</span>
    </li>
  );
}
