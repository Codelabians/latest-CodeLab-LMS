import { useGetQuery } from "../api/apiSlice";

/**
 * Site-wide monthly laptop fee, set by admins on the Website Settings page
 * (settings.laptop_monthly_fee). Used as the default laptop-fee amount in
 * every fee form and challan dialog so a laptop, when assigned/provided,
 * is charged the configured amount (e.g. Rs 1000) — never a hardcoded value.
 *
 * RTK Query dedupes the /settings/public request across components, so it's
 * safe to call this hook from many forms at once.
 */
export function useLaptopFee(fallback = 0) {
  const { data } = useGetQuery({ path: "/settings/public" });
  const value = Number(data?.data?.laptop_monthly_fee);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export default useLaptopFee;
