import { useEffect, useLayoutEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

const BRAND = "#C90606";
const BORDER = "#EEF2F6";
const TIP_W = 300;
const GAP = 14;

/**
 * First-login guided tour. Each step can anchor to a real element on the
 * page (via a CSS `selector`); the tooltip moves to that element and a
 * spotlight highlights it. Steps with no selector render centered (intro /
 * outro). Shown once per user (remembered in localStorage under storageKey).
 *
 * Props:
 *   storageKey: unique per user, e.g. `tour_seen_student_<id>`
 *   steps: [{ selector?, title, body, placement? }]   placement: 'right'|'bottom'|'left'|'top'
 *   brandName
 */
export default function FirstLoginTour({ storageKey, steps = [], brandName = "CodeLab" }) {
  const alreadySeen = (() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  })();

  const [open, setOpen] = useState(!alreadySeen && steps.length > 0);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null); // target element rect (viewport coords)

  const step = steps[i];

  // Locate + scroll to the step's target, then measure it.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const measure = () => {
      if (!step.selector) { setRect(null); return; }
      const el = document.querySelector(step.selector);
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, i, step]);

  // Allow Esc to skip.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !step) return null;

  const close = () => {
    try { localStorage.setItem(storageKey, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  const last = i === steps.length - 1;

  // Tooltip position: next to the target, else centered.
  let tipStyle;
  if (rect) {
    const placement = step.placement || "right";
    const vw = window.innerWidth, vh = window.innerHeight;
    let top, left;
    if (placement === "right") { left = rect.left + rect.width + GAP; top = rect.top; }
    else if (placement === "left") { left = rect.left - TIP_W - GAP; top = rect.top; }
    else if (placement === "top") { left = rect.left; top = rect.top - GAP - 150; }
    else { left = rect.left; top = rect.top + rect.height + GAP; } // bottom
    left = Math.max(12, Math.min(left, vw - TIP_W - 12));
    top = Math.max(12, Math.min(top, vh - 200));
    tipStyle = { position: "fixed", top, left, width: TIP_W };
  } else {
    tipStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: TIP_W };
  }

  return (
    <div className="fixed inset-0 z-[60]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Dim + spotlight. A clear box over the target with a huge shadow dims everything else. */}
      {rect ? (
        <div
          style={{
            position: "fixed",
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            borderRadius: 10,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
            border: `2px solid ${BRAND}`,
            pointerEvents: "none",
            transition: "all .25s ease",
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)" }} />
      )}

      {/* Tooltip card */}
      <div style={tipStyle} className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: BRAND }}>
          <span className="text-[13px] font-bold text-white">Welcome to {brandName}</span>
          <button onClick={close} aria-label="Skip"><X size={16} className="text-white/90" /></button>
        </div>

        <div className="px-4 py-4">
          <h3 className="text-[14.5px] font-bold mb-1" style={{ color: "#0F172A" }}>{step.title}</h3>
          <p className="text-[12.5px] leading-relaxed" style={{ color: "#475569" }}>{step.body}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {steps.map((_, idx) => (
            <span key={idx} className="rounded-full" style={{ width: idx === i ? 16 : 6, height: 6, background: idx === i ? BRAND : "#E2E8F0", transition: "all .2s" }} />
          ))}
        </div>

        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={close} className="text-[12px] font-semibold" style={{ color: "#94A3B8" }}>Skip</button>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ border: `1px solid ${BORDER}`, color: "#475569" }}>
                <ChevronLeft size={14} /> Back
              </button>
            )}
            {last ? (
              <button onClick={close} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
                <Check size={14} /> Got it
              </button>
            ) : (
              <button onClick={() => setI(i + 1)} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: BRAND }}>
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
