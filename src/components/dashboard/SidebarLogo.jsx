import { useState } from "react";
import fallbackLogo from "../../../assets/loggo.png";
import { useGetQuery } from "../../api/apiSlice";

/**
 * Sidebar logo — driven by Settings (Company Settings → logo). Falls back
 * to the bundled asset if branding hasn't loaded or no logo is configured.
 */
const SidebarLogo = () => {
  const { data } = useGetQuery({ path: "branding" }, { refetchOnMountOrArgChange: false });
  const [errored, setErrored] = useState(false);

  const logoUrl = data?.data?.logo_url;
  const src = !errored && logoUrl ? logoUrl : fallbackLogo;

  return (
    <div className="flex flex-col items-center gap-2 w-[95%] mx-auto">
      <img
        src={src}
        alt={data?.data?.app_name || "Codelab Console"}
        onError={() => setErrored(true)}
        className="object-contain w-40 h-16 rounde-lg"
      />
    </div>
  );
};

export default SidebarLogo;
