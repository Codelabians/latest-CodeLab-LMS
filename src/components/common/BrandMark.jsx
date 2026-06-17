import { useState } from "react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";
const TEXT_PRIMARY = "#0F172A";
const TEXT_MUTED = "#94A3B8";

/**
 * Brand logo + name, driven by the configured company branding
 * (Settings → Company → logo). Falls back to a monogram if no logo is set.
 * Used in the student and staff portal headers so they match the real brand
 * instead of a hardcoded box.
 */
export default function BrandMark({ subtitle = "", collapsed = false, size = 36 }) {
  const { data } = useGetQuery({ path: "branding" }, { refetchOnMountOrArgChange: false });
  const [imgError, setImgError] = useState(false);

  const logoUrl = data?.data?.logo_url;
  const appName = (data?.data?.app_name || "CodeLab").trim();
  const initials = appName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "CL";
  const hasLogo = logoUrl && !imgError;

  const Mark = hasLogo ? (
    <img
      src={logoUrl}
      alt={appName}
      onError={() => setImgError(true)}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  ) : (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, borderRadius: 10, background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`, color: "#fff", fontWeight: 700, fontSize: 12 }}
    >
      {initials}
    </div>
  );

  if (collapsed) return Mark;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {Mark}
      <div className="min-w-0">
        <div className="truncate" style={{ fontSize: 13.5, fontWeight: 700, color: TEXT_PRIMARY, letterSpacing: "0.02em" }}>{appName}</div>
        {subtitle ? (
          <div className="truncate" style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", color: TEXT_MUTED, textTransform: "uppercase", marginTop: 1 }}>{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
