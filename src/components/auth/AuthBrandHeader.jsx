import { useState } from "react";
import { useGetQuery } from "../../api/apiSlice";

const BRAND_RED = "#C90606";
const BRAND_RED_DARK = "#A00505";

/**
 * Brand header for the pre-auth pages (sign-in, forgot password, reset).
 * Logo + name come from the configured company branding (Settings →
 * Company) via the PUBLIC /branding endpoint — same source as the portal
 * headers — with the C/L monogram as fallback when no logo is set.
 */
export default function AuthBrandHeader({ tagline = "Your Potential. Our Dedication." }) {
  const { data } = useGetQuery({ path: "branding" }, { refetchOnMountOrArgChange: false });
  const [imgError, setImgError] = useState(false);

  const logoUrl = data?.data?.logo_url;
  const appName = (data?.data?.app_name || "CodeLab").trim();
  const hasLogo = logoUrl && !imgError;

  return (
    <div className="flex flex-col items-center mb-8">
      {hasLogo ? (
        <img
          src={logoUrl}
          alt={appName}
          onError={() => setImgError(true)}
          className="object-contain mb-4"
          style={{ height: 64, maxWidth: 240, width: "auto" }}
        />
      ) : (
        <div
          className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${BRAND_RED} 0%, ${BRAND_RED_DARK} 100%)`,
            boxShadow: "0 10px 30px -10px rgba(201,6,6,0.5)",
          }}
        >
          <span className="text-2xl font-extrabold tracking-tight text-white">
            C<span className="opacity-70">/</span>L
          </span>
        </div>
      )}
      <h1 className="text-3xl font-extrabold tracking-tight text-black uppercase">{appName}</h1>
      {/* The uploaded logo lockup usually carries its own tagline — only
          show ours alongside the monogram fallback. */}
      {tagline && !hasLogo && (
        <p className="mt-1 text-xs tracking-[0.18em] text-gray-500 uppercase">{tagline}</p>
      )}
    </div>
  );
}
