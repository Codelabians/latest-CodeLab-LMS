import {
  Sparkles, Trophy, CalendarCheck, GraduationCap, Gift, Award, Wallet,
} from "lucide-react";

/**
 * PortalHero — animated, data-driven welcome banner for the student portal.
 *
 * The student (carrying a laptop) runs along their *course journey*, leaping
 * the hurdles that represent each course milestone, toward a trophy finish
 * line. The runner's position reflects real progress (course attendance),
 * cleared milestones show a check, and a row of "winning achievements" badges
 * surfaces the student's real stats.
 *
 * Pure inline SVG + CSS keyframes (no GIF / Lottie / extra deps — keeps the
 * bundle light, see Polish audit U15). Animations disabled under
 * `prefers-reduced-motion`; the scene is decorative for AT.
 *
 * Props:
 *   name          string   student's name
 *   courseName    string   active course (shown in the subtitle)
 *   progress      number   0–100 journey completion (drives runner position)
 *   milestones    array    [{ label, done }] course checkpoints (the hurdles)
 *   achievements  array    [{ icon, label }] icon ∈ attendance|courses|rewards|ambassador|fees|trophy
 */

const BRAND = "#C90606";

const ACH_ICONS = {
  attendance: CalendarCheck,
  courses: GraduationCap,
  rewards: Gift,
  ambassador: Award,
  fees: Wallet,
  trophy: Trophy,
};

export default function PortalHero({
  name = "Student",
  courseName = null,
  progress = 0,
  milestones = [],
  achievements = [],
}) {
  const first = String(name).trim().split(/\s+/)[0] || "Student";
  const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  const done = pct >= 100;

  // Track geometry (viewBox 0 0 600 112). Runner travels between the first
  // and last checkpoint; trophy sits at the finish.
  const X0 = 46;
  const X1 = 528;
  const TROPHY_X = 566;
  const TRACK_Y = 86;
  const runnerX = X0 + ((X1 - X0) * pct) / 100;

  const stops = milestones.length
    ? milestones
    : [{ label: "Enrolled", done: true }];
  const stopX = (i) =>
    stops.length === 1 ? X0 : X0 + ((X1 - X0) * i) / (stops.length - 1);

  return (
    <div
      className="ch-hero relative overflow-hidden rounded-xl"
      style={{ background: "linear-gradient(135deg, #aa0e0e 0%, #100F0F 100%)" }}
    >
      <style>{HERO_CSS}</style>
      <span className="ch-hero__glow" aria-hidden="true" />

      <div className="relative p-5 sm:p-6 space-y-4">
        {/* Greeting + achievements */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-[200px]">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "rgba(255,255,255,0.14)", color: "#FFE3E3" }}
            >
              <Sparkles size={12} /> Your learning journey
            </div>
            <h1 className="mt-2 text-white font-bold leading-tight" style={{ fontSize: 22 }}>
              Welcome back, {first} 👋
            </h1>
            <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.82)" }}>
              {courseName
                ? <>{courseName} · <span className="font-semibold text-white">{pct}%</span> of the way{done ? " — you made it! 🏆" : ""}</>
                : "Keep clearing the hurdles — one session at a time."}
            </p>
          </div>

          {achievements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-[320px] justify-end">
              {achievements.slice(0, 4).map((a, i) => {
                const Icon = ACH_ICONS[a.icon] || Trophy;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }}
                  >
                    <Icon size={12} style={{ color: "#FFD900" }} /> {a.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Animated course-journey track */}
        <div aria-hidden="true">
          <svg viewBox="0 0 600 112" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chHeroLaptop" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#FFD3D3" />
              </linearGradient>
            </defs>

            {/* base track */}
            <line x1={X0 - 16} y1={TRACK_Y} x2={TROPHY_X} y2={TRACK_Y}
              stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" />
            {/* progress fill */}
            <line x1={X0 - 16} y1={TRACK_Y} x2={runnerX} y2={TRACK_Y}
              stroke="#FFD900" strokeWidth="3" strokeLinecap="round" className="ch-fill" />

            {/* milestone hurdles */}
            {stops.map((m, i) => {
              const x = stopX(i);
              const cleared = m.done || runnerX >= x - 1;
              return (
                <g key={i} transform={`translate(${x} 0)`}>
                  <rect x="-1.5" y={TRACK_Y - 24} width="3" height="24" rx="1.5"
                    fill={cleared ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)"} />
                  <rect x="-9" y={TRACK_Y - 26} width="18" height="5" rx="2.5"
                    fill={cleared ? "#22C55E" : BRAND} stroke="#FFFFFF" strokeWidth="1" />
                  {cleared && (
                    <g transform={`translate(0 ${TRACK_Y - 38})`}>
                      <circle r="7" fill="#22C55E" stroke="#fff" strokeWidth="1" />
                      <path d="M -3 0 L -1 2.5 L 3.2 -2.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  )}
                  {/* milestone label */}
                  <text x="0" y={TRACK_Y + 16} textAnchor="middle"
                    fontSize="9.5" fontWeight="600"
                    fill={cleared ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)"}>
                    {m.label}
                  </text>
                </g>
              );
            })}

            {/* trophy finish */}
            <g transform={`translate(${TROPHY_X} ${TRACK_Y})`} className={done ? "ch-trophy ch-trophy--won" : "ch-trophy"}>
              <rect x="-9" y="-4" width="18" height="4" rx="1.5" fill={done ? "#FFD900" : "rgba(255,255,255,0.5)"} />
              <rect x="-3" y="-12" width="6" height="9" fill={done ? "#FFD900" : "rgba(255,255,255,0.5)"} />
              <path d="M -10 -34 h20 v6 a10 10 0 0 1 -20 0 Z" fill={done ? "#FFD900" : "rgba(255,255,255,0.5)"} />
              <path d="M -10 -32 h-5 a6 6 0 0 0 6 8" fill="none" stroke={done ? "#FFD900" : "rgba(255,255,255,0.5)"} strokeWidth="2" />
              <path d="M 10 -32 h5 a6 6 0 0 1 -6 8" fill="none" stroke={done ? "#FFD900" : "rgba(255,255,255,0.5)"} strokeWidth="2" />
              {done && (
                <g fill="#FFD900" className="ch-trophy-spark">
                  <circle cx="-16" cy="-30" r="1.6" /><circle cx="16" cy="-26" r="1.4" /><circle cx="0" cy="-46" r="1.6" />
                </g>
              )}
            </g>

            {/* runner — student carrying a laptop, positioned by progress */}
            <g transform={`translate(${runnerX - 8} 0)`}>
              <ellipse className="ch-shadow" cx="6" cy={TRACK_Y + 2} rx="16" ry="3" fill="rgba(0,0,0,0.3)" />
              <g className="ch-runner-body" style={{ transformBox: "fill-box" }}>
                <g style={{ transform: `translateY(${TRACK_Y - 86}px)` }}>
                  <rect className="ch-leg ch-leg--back" x="0" y="58" width="6" height="16" rx="3" fill="#7A0A0A" />
                  <rect className="ch-leg ch-leg--front" x="8" y="58" width="6" height="16" rx="3" fill="#9E0D0D" />
                  <rect x="-2" y="38" width="17" height="24" rx="7" fill="#FF5A5A" />
                  <rect x="11" y="43" width="13" height="5" rx="2.5" fill="#FF7A7A" />
                  <g>
                    <rect x="18" y="36" width="20" height="13" rx="2.5" fill="url(#chHeroLaptop)" stroke="#fff" strokeWidth="0.8" />
                    <rect className="ch-screen" x="20" y="38" width="16" height="9" rx="1.5" fill={BRAND} opacity="0.9" />
                    <rect x="17" y="49" width="22" height="3" rx="1.5" fill="#E9E9E9" />
                  </g>
                  <circle cx="6" cy="30" r="8" fill="#FFE0D2" />
                  <path d="M -2 27 a8 8 0 0 1 16 0 q-8 -6 -16 0Z" fill="#2B2B2B" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

const HERO_CSS = `
.ch-hero__glow{ position:absolute; top:-40%; right:-10%; width:280px; height:280px; border-radius:9999px;
  background:radial-gradient(circle, rgba(255,217,0,0.20), rgba(255,217,0,0) 70%); pointer-events:none; }

@keyframes chBob { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }
.ch-runner-body{ animation:chBob .55s ease-in-out infinite; }

@keyframes chShadow { 0%,100%{ transform:scaleX(1); opacity:.3; } 50%{ transform:scaleX(.8); opacity:.18; } }
.ch-shadow{ animation:chShadow .55s ease-in-out infinite; transform-origin:center; transform-box:fill-box; }

@keyframes chLegF { 0%,100%{ transform:rotate(20deg);} 50%{ transform:rotate(-24deg);} }
@keyframes chLegB { 0%,100%{ transform:rotate(-24deg);} 50%{ transform:rotate(20deg);} }
.ch-leg{ transform-box:fill-box; transform-origin:top center; }
.ch-leg--front{ animation:chLegF .42s ease-in-out infinite; }
.ch-leg--back{ animation:chLegB .42s ease-in-out infinite; }

@keyframes chScreen { 0%,100%{ opacity:.9;} 50%{ opacity:1;} }
.ch-screen{ animation:chScreen 1.2s ease-in-out infinite; }

@keyframes chFill { from{ opacity:.75;} 50%{ opacity:1;} to{ opacity:.75;} }
.ch-fill{ animation:chFill 1.8s ease-in-out infinite; }

@keyframes chTrophyWon { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-3px);} }
.ch-trophy--won{ animation:chTrophyWon 1s ease-in-out infinite; transform-box:fill-box; }
@keyframes chSpark { 0%,100%{ opacity:0; } 50%{ opacity:1; } }
.ch-trophy-spark{ animation:chSpark 1.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce){
  .ch-runner-body, .ch-shadow, .ch-leg--front, .ch-leg--back, .ch-screen,
  .ch-fill, .ch-trophy--won, .ch-trophy-spark{ animation:none !important; }
}
`;
