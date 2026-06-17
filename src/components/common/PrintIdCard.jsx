import React from "react";
import { Printer } from "lucide-react";
import { useGetQuery } from "../../api/apiSlice";

/**
 * PrintIdCard — prints a CODELAB-styled ID card (front + back for staff,
 * single front for students) in a clean print window, matching the brand
 * reference card. The logo is pulled from Settings → Branding automatically.
 *
 * variant: "student" | "employee" | "self"
 * person fields (all optional): name, photoUrl, idLabel, idValue, roleLine,
 *   subLine, dateLabel, dateValue, phone, email, website, address, profileUrl
 */
export default function PrintIdCard({
  person = {},
  variant = "student",
  label,
  className = "",
  style = {},
  brandName = "CODELAB",
  logoUrl = "",
}) {
  // Pull the branded logo from Settings so every card uses the real logo.
  const { data } = useGetQuery({ path: "branding" }, { refetchOnMountOrArgChange: false });
  const brandLogo = logoUrl || data?.data?.logo_url || "";

  const handlePrint = () => {
    const html = buildCardHtml({ person, variant, brandName, logoUrl: brandLogo });
    const w = window.open("", "_blank", "width=960,height=720");
    if (!w) {
      alert("Please allow popups to print the card.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white ${className}`}
      style={{ background: "#C90606", ...style }}
      title="Print ID card"
    >
      <Printer size={14} strokeWidth={2.25} />
      {label || "Print Card"}
    </button>
  );
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildCardHtml({ person, variant, brandName, logoUrl }) {
  const RED = "#C90606";
  const RED_DARK = "#8E0404";
  const name = esc(person.name || "—");
  const photo = person.photoUrl ? esc(person.photoUrl)
    : "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  const idLabel = esc(person.idLabel || (variant === "student" ? "Student ID" : "Employee ID"));
  const idValue = esc(person.idValue || "—");
  const roleLine = esc(person.roleLine || "");
  const subLine = esc(person.subLine || "");
  const dateLabel = esc(person.dateLabel || (variant === "student" ? "Enrolled" : "Joining Date"));
  const dateValue = esc(person.dateValue || "");
  const website = esc(person.website || "");
  const qrData = encodeURIComponent(person.profileUrl || person.idValue || name);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${qrData}`;
  const isStudent = variant === "student";

  // Logo sits directly on the red header, rendered white via a CSS filter
  // (brightness(0) invert(1) turns any logo into a clean white silhouette).
  const logo = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(brandName)}" style="height:40px;max-width:170px;object-fit:contain;display:block;filter:brightness(0) invert(1);" onerror="this.outerHTML='<span style=\\'font-weight:800;color:#fff;font-size:20px;letter-spacing:.5px;\\'>${esc(brandName)}</span>'"/>`
    : `<span style="font-weight:800;color:#fff;font-size:20px;letter-spacing:.5px;">${esc(brandName)}</span>`;

  // Smooth red wave at the top of a card (logo sits on the white pill over it).
  const topWave = `
    <svg class="wave-top" viewBox="0 0 330 150" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${RED}"/><stop offset="1" stop-color="${RED_DARK}"/>
      </linearGradient></defs>
      <path d="M0,0 H330 V92 Q230,150 165,118 Q90,80 0,120 Z" fill="url(#g)"/>
    </svg>`;
  const bottomWave = `
    <svg class="wave-bottom" viewBox="0 0 330 90" preserveAspectRatio="none">
      <path d="M0,60 Q120,0 210,34 Q280,60 330,30 V90 H0 Z" fill="${RED}"/>
    </svg>`;

  // White monochrome SVG icons so every contact icon matches (the emoji
  // globe/pin rendered in colour — blue/red — which looked off on the red circle).
  const ICONS = {
    phone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.3 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.3 0 .7-.3 1l-2.2 2.2z"/></svg>',
    email: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M3 5h18c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1zm9 7l8-5H4l8 5zm0 2L4 9v9h16V9l-8 5z"/></svg>',
    web: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 2.6 2.8 15.4 0 18M12 3c-2.8 2.6-2.8 15.4 0 18"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  };
  const contacts = [];
  if (person.phone) contacts.push([ICONS.phone, esc(person.phone)]);
  if (person.email) contacts.push([ICONS.email, esc(person.email)]);
  if (person.website) contacts.push([ICONS.web, esc(person.website)]);
  if (person.address) contacts.push([ICONS.pin, esc(person.address)]);
  const contactRows = contacts.map(([ic, val]) =>
    `<div class="crow"><span class="cicon">${ic}</span><span class="ctext">${val}</span></div>`).join("");

  // FRONT (same for student + staff): photo, name, role/course, batch/dept,
  // ID, and the date pill. QR + contacts live on the BACK.
  const frontInner = `
    <div class="logo-pill">${logo}</div>
    <img class="photo" src="${photo}" alt="${name}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/847/847969.png'"/>
    <div class="namebox">${name}</div>
    ${roleLine ? `<div class="role">${roleLine}</div>` : ""}
    ${subLine ? `<div class="sub">${subLine}</div>` : ""}
    <div class="idbox"><div class="idlabel">${idLabel}</div><div class="idval">${idValue}</div></div>
    ${dateValue ? `<div class="meta"><span class="pill">${dateLabel}</span><div class="date">${dateValue}</div></div>` : ""}`;

  const backInner = `
    <div class="logo-pill back">${logo}</div>
    <div class="contacts">${contactRows || '<div class="sub">—</div>'}</div>
    <img class="qr big" src="${qrSrc}" alt="QR"/>
    <div class="meta"><span class="pill">${idLabel}: ${idValue}</span></div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name} — ID Card</title>
<style>
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { margin:0; font-family:Arial,Helvetica,sans-serif; background:#0f172a;
         display:flex; align-items:center; justify-content:center; gap:24px; padding:28px; min-height:100vh; flex-wrap:wrap; }
  .card { position:relative; width:330px; height:540px; background:#fff; border-radius:20px;
          overflow:hidden; box-shadow:0 20px 55px rgba(0,0,0,.4); }
  .wave-top { position:absolute; top:0; left:0; width:100%; height:150px; z-index:1; }
  .wave-bottom { position:absolute; bottom:0; left:0; width:100%; height:44px; z-index:1; }
  .logo-pill { position:absolute; top:22px; left:50%; transform:translateX(-50%); z-index:3; }
  .photo { position:relative; z-index:2; width:120px; height:120px; border-radius:50%; object-fit:cover;
           border:5px solid #fff; box-shadow:0 8px 22px rgba(0,0,0,.2); display:block; margin:92px auto 0; background:#f1f5f9; }
  .namebox { margin:14px 24px 0; padding:7px 6px; text-align:center; font-size:19px; font-weight:800; color:#0F172A;
             border-top:2px solid #0F172A; border-bottom:2px solid #0F172A; line-height:1.15; }
  .role { text-align:center; font-size:13.5px; font-weight:800; color:${RED}; margin:9px 14px 0; text-transform:capitalize; }
  .sub  { text-align:center; font-size:12px; color:#475569; margin:3px 14px 0; }
  .idbox { text-align:center; margin:10px 14px 0; }
  .idlabel { font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:#94A3B8; }
  .idval { font-size:14px; font-weight:800; color:#0F172A; font-family:'Courier New',monospace; word-break:break-word; }
  .pill { display:inline-block; background:${RED}; color:#fff; font-size:11px; font-weight:700; padding:4px 16px; border-radius:20px; }
  .meta { text-align:center; margin-top:10px; position:relative; z-index:2; }
  .date { font-size:12px; color:#475569; margin-top:5px; }
  .site { text-align:center; font-size:11.5px; font-weight:700; color:${RED}; margin:8px 14px 0; position:relative; z-index:2; }
  .qr { width:84px; height:84px; display:block; margin:10px auto 0; position:relative; z-index:2; background:#fff; padding:3px; border-radius:6px; }
  .qr.big { width:118px; height:118px; }
  .contacts { position:relative; z-index:2; padding:132px 24px 0; }
  .crow { display:flex; align-items:center; gap:12px; margin:12px 0; }
  .cicon { width:30px; height:30px; min-width:30px; border-radius:50%; background:${RED}; color:#fff;
           display:flex; align-items:center; justify-content:center; font-size:14px; }
  .ctext { font-size:12.5px; color:#1F2937; word-break:break-word; }
  .toolbar { position:fixed; top:14px; right:14px; z-index:10; }
  .btn { background:${RED}; color:#fff; border:none; padding:10px 16px; border-radius:8px; font-weight:700; cursor:pointer; }
  .hint { position:fixed; top:14px; left:14px; max-width:540px; background:rgba(255,255,255,.96); color:#0F172A;
          font-size:12px; line-height:1.45; padding:11px 14px; border-radius:10px; box-shadow:0 6px 22px rgba(0,0,0,.3); z-index:10; }
  .hint b { color:${RED}; }
  @media print { body { background:#fff; padding:0; min-height:auto; } .card { box-shadow:none; } .toolbar, .hint { display:none !important; } }
</style></head>
<body onload="setTimeout(function(){window.print();},400)">
  <div class="toolbar"><button class="btn" onclick="window.print()">Print</button></div>
  <div class="hint">
    &#128424;&#65039; This prints as <b>2 pages — Front &amp; Back</b>. For a real two-sided card,
    open <b>More settings</b> in the print dialog and turn on <b>Two-sided / Print on both sides</b>
    (flip on the <b>long edge</b>). Set paper to your card size if your printer supports it.
  </div>
  <div class="card">${topWave}${frontInner}${bottomWave}</div>
  <div class="card">${topWave}${backInner}${bottomWave}</div>
</body></html>`;
}
