/**
 * Notification chimes, synthesized with the Web Audio API — no audio files.
 *
 * Browsers block audio until the user interacts with the page once, so call
 * armNotifySounds() early (any layout); it unlocks the AudioContext on the
 * first click/keypress and sounds work from then on.
 */
let ctx = null;

const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

export function armNotifySounds() {
  const unlock = () => { getCtx(); };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

/** notes: array of [frequencyHz, durationSec] played back-to-back. */
function chime(notes, type = "sine", volume = 0.12) {
  const ac = getCtx();
  if (!ac || ac.state !== "running") return;
  let t = ac.currentTime;
  notes.forEach(([freq, dur]) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur * 0.9;
  });
}

/** Mute preference (persisted). Sounds respect this everywhere. */
export const soundsEnabled = () => localStorage.getItem("notify_sounds") !== "off";
export const setSoundsEnabled = (on) => {
  try { localStorage.setItem("notify_sounds", on ? "on" : "off"); } catch { /* ignore */ }
  if (on) getCtx(); // toggling on is a user gesture — unlock right here
};

/** General notification — soft two-note "ding-dong". */
export function playNotificationSound() {
  if (!soundsEnabled()) return;
  chime([[880, 0.16], [660, 0.22]]);
}

/** WhatsApp message — brighter three-note pattern so it's distinct. */
export function playWhatsAppSound() {
  if (!soundsEnabled()) return;
  chime([[520, 0.1], [780, 0.1], [1040, 0.18]], "triangle", 0.14);
}

/** Demo both chimes (used by the header toggle so users can verify). */
export function playTestSounds() {
  chime([[880, 0.16], [660, 0.22]]);
  setTimeout(() => chime([[520, 0.1], [780, 0.1], [1040, 0.18]], "triangle", 0.14), 700);
}
