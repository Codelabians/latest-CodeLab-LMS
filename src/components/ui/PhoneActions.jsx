import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle } from "lucide-react";

const WA_GREEN = "#25D366";

/**
 * Clickable phone number with Call / WhatsApp actions.
 *
 * Renders the number as a small button; clicking opens a popover with
 * "Call" (tel:) and "WhatsApp" (wa.me deep link). Numbers are normalized
 * for wa.me with Pakistan as the default country (0300... -> 92300...),
 * mirroring the mobile app's Phone.waNumber helper.
 *
 * Usage: <PhoneActions number={r.contact} name={r.name} />
 * Renders nothing when the number is empty.
 */
export function waNumber(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "92" + digits.slice(1);
  if (digits.length === 10 && digits.startsWith("3")) digits = "92" + digits;
  return digits.length >= 10 ? digits : null;
}

export default function PhoneActions({ number, name = "", className = "", style = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const raw = String(number || "").trim();
  if (!raw || raw === "—") return null;
  const wa = waNumber(raw);

  return (
    <span ref={ref} className={`relative inline-block ${className}`} style={style} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 font-semibold hover:underline"
        style={{ color: "#475569" }}
        title={`Contact ${name || raw}`}
      >
        <Phone size={11} style={{ color: "#94A3B8" }} />
        {raw}
      </button>

      {open && (
        <span
          className="absolute left-0 z-50 mt-1 overflow-hidden bg-white rounded-lg shadow-xl top-full"
          style={{ border: "1px solid #EEF2F6", minWidth: 168 }}
        >
          <a
            href={`tel:${raw}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold hover:bg-gray-50"
            style={{ color: "#0F172A" }}
          >
            <span className="grid place-items-center rounded-md" style={{ width: 24, height: 24, background: "#FEF2F2" }}>
              <Phone size={13} style={{ color: "#C90606" }} />
            </span>
            Call
          </a>
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold hover:bg-gray-50"
              style={{ color: "#0F172A", borderTop: "1px solid #EEF2F6" }}
            >
              <span className="grid place-items-center rounded-md" style={{ width: 24, height: 24, background: "#E7F8EE" }}>
                <MessageCircle size={13} style={{ color: WA_GREEN }} />
              </span>
              WhatsApp
            </a>
          )}
        </span>
      )}
    </span>
  );
}
