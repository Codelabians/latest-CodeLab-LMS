import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCw } from "lucide-react";
import { apiSlice } from "../../api/apiSlice";

/**
 * Global soft-refresh: re-fetches every query currently on screen (all GET
 * queries carry the "KeyName" tag) WITHOUT reloading the page. Dropped into
 * the top bar of all three portals (admin / staff / student).
 */
export default function RefreshButton({ style = {}, size = 16, title = "Refresh data" }) {
  const dispatch = useDispatch();
  const [spinKick, setSpinKick] = useState(false);
  // Keep spinning while any query is actually in flight.
  const busy = useSelector((s) =>
    Object.values(s.api?.queries || {}).some((q) => q?.status === "pending")
  );

  const refresh = () => {
    setSpinKick(true);
    dispatch(apiSlice.util.invalidateTags(["KeyName"]));
    // Minimum spin so the click always gives visible feedback.
    setTimeout(() => setSpinKick(false), 800);
  };

  const spinning = busy || spinKick;
  return (
    <button
      type="button"
      onClick={refresh}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center rounded-lg transition"
      style={{ width: 34, height: 34, color: "#475569", background: "transparent", ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <RefreshCw size={size} className={spinning ? "animate-spin" : ""} />
    </button>
  );
}
