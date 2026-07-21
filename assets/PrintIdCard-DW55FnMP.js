import{c as $,a as L,j as w}from"./index-ftLxu7yx.js";/**
 * @license lucide-react v0.535.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],j=$("printer",D);/**
 * @license lucide-react v0.535.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]],P=$("repeat",R);function B({person:t={},variant:l="student",label:a,className:p="",style:e={},brandName:f="CODELAB",logoUrl:o=""}){var r;const{data:s}=L({path:"branding"},{refetchOnMountOrArgChange:!1}),c=o||((r=s==null?void 0:s.data)==null?void 0:r.logo_url)||"",x=()=>{const h=V({person:t,variant:l,brandName:f,logoUrl:c}),n=window.open("","_blank","width=960,height=720");if(!n){alert("Please allow popups to print the card.");return}n.document.open(),n.document.write(h),n.document.close()};return w.jsxs("button",{type:"button",onClick:x,className:`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white ${p}`,style:{background:"#C90606",...e},title:"Print ID card",children:[w.jsx(j,{size:14,strokeWidth:2.25}),a||"Print Card"]})}function i(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function V({person:t,variant:l,brandName:a,logoUrl:p}){const e="#C90606",f="#8E0404",o=i(t.name||"—"),s=t.photoUrl?i(t.photoUrl):"https://cdn-icons-png.flaticon.com/512/847/847969.png",c=i(t.idLabel||(l==="student"?"Student ID":"Employee ID")),x=i(t.idValue||"—"),r=i(t.roleLine||""),h=i(t.subLine||""),n=i(t.dateLabel||(l==="student"?"Enrolled":"Joining Date")),b=i(t.dateValue||"");i(t.website||"");const y=`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(t.profileUrl||t.idValue||o)}`,u=p?`<img src="${i(p)}" alt="${i(a)}" style="height:40px;max-width:170px;object-fit:contain;display:block;filter:brightness(0) invert(1);" onerror="this.outerHTML='<span style=\\'font-weight:800;color:#fff;font-size:20px;letter-spacing:.5px;\\'>${i(a)}</span>'"/>`:`<span style="font-weight:800;color:#fff;font-size:20px;letter-spacing:.5px;">${i(a)}</span>`,v=`
    <svg class="wave-top" viewBox="0 0 330 150" preserveAspectRatio="none">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${e}"/><stop offset="1" stop-color="${f}"/>
      </linearGradient></defs>
      <path d="M0,0 H330 V92 Q230,150 165,118 Q90,80 0,120 Z" fill="url(#g)"/>
    </svg>`,m=`
    <svg class="wave-bottom" viewBox="0 0 330 90" preserveAspectRatio="none">
      <path d="M0,60 Q120,0 210,34 Q280,60 330,30 V90 H0 Z" fill="${e}"/>
    </svg>`,g={phone:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.3 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.3 0 .7-.3 1l-2.2 2.2z"/></svg>',email:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M3 5h18c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1zm9 7l8-5H4l8 5zm0 2L4 9v9h16V9l-8 5z"/></svg>',web:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 2.6 2.8 15.4 0 18M12 3c-2.8 2.6-2.8 15.4 0 18"/></svg>',pin:'<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>'},d=[];t.phone&&d.push([g.phone,i(t.phone)]),t.email&&d.push([g.email,i(t.email)]),t.website&&d.push([g.web,i(t.website)]),t.address&&d.push([g.pin,i(t.address)]);const k=d.map(([M,A])=>`<div class="crow"><span class="cicon">${M}</span><span class="ctext">${A}</span></div>`).join(""),z=`
    <div class="logo-pill">${u}</div>
    <img class="photo" src="${s}" alt="${o}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/847/847969.png'"/>
    <div class="namebox">${o}</div>
    ${r?`<div class="role">${r}</div>`:""}
    ${h?`<div class="sub">${h}</div>`:""}
    <div class="idbox"><div class="idlabel">${c}</div><div class="idval">${x}</div></div>
    ${b?`<div class="meta"><span class="pill">${n}</span><div class="date">${b}</div></div>`:""}`,C=`
    <div class="logo-pill back">${u}</div>
    <div class="contacts">${k||'<div class="sub">—</div>'}</div>
    <img class="qr big" src="${y}" alt="QR"/>
    <div class="meta"><span class="pill">${c}: ${x}</span></div>`;return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${o} — ID Card</title>
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
  .role { text-align:center; font-size:13.5px; font-weight:800; color:${e}; margin:9px 14px 0; text-transform:capitalize; }
  .sub  { text-align:center; font-size:12px; color:#475569; margin:3px 14px 0; }
  .idbox { text-align:center; margin:10px 14px 0; }
  .idlabel { font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:#94A3B8; }
  .idval { font-size:14px; font-weight:800; color:#0F172A; font-family:'Courier New',monospace; word-break:break-word; }
  .pill { display:inline-block; background:${e}; color:#fff; font-size:11px; font-weight:700; padding:4px 16px; border-radius:20px; }
  .meta { text-align:center; margin-top:10px; position:relative; z-index:2; }
  .date { font-size:12px; color:#475569; margin-top:5px; }
  .site { text-align:center; font-size:11.5px; font-weight:700; color:${e}; margin:8px 14px 0; position:relative; z-index:2; }
  .qr { width:84px; height:84px; display:block; margin:10px auto 0; position:relative; z-index:2; background:#fff; padding:3px; border-radius:6px; }
  .qr.big { width:118px; height:118px; }
  .contacts { position:relative; z-index:2; padding:132px 24px 0; }
  .crow { display:flex; align-items:center; gap:12px; margin:12px 0; }
  .cicon { width:30px; height:30px; min-width:30px; border-radius:50%; background:${e}; color:#fff;
           display:flex; align-items:center; justify-content:center; font-size:14px; }
  .ctext { font-size:12.5px; color:#1F2937; word-break:break-word; }
  .toolbar { position:fixed; top:14px; right:14px; z-index:10; }
  .btn { background:${e}; color:#fff; border:none; padding:10px 16px; border-radius:8px; font-weight:700; cursor:pointer; }
  .hint { position:fixed; top:14px; left:14px; max-width:540px; background:rgba(255,255,255,.96); color:#0F172A;
          font-size:12px; line-height:1.45; padding:11px 14px; border-radius:10px; box-shadow:0 6px 22px rgba(0,0,0,.3); z-index:10; }
  .hint b { color:${e}; }
  @media print { body { background:#fff; padding:0; min-height:auto; } .card { box-shadow:none; } .toolbar, .hint { display:none !important; } }
</style></head>
<body onload="setTimeout(function(){window.print();},400)">
  <div class="toolbar"><button class="btn" onclick="window.print()">Print</button></div>
  <div class="hint">
    &#128424;&#65039; This prints as <b>2 pages — Front &amp; Back</b>. For a real two-sided card,
    open <b>More settings</b> in the print dialog and turn on <b>Two-sided / Print on both sides</b>
    (flip on the <b>long edge</b>). Set paper to your card size if your printer supports it.
  </div>
  <div class="card">${v}${z}${m}</div>
  <div class="card">${v}${C}${m}</div>
</body></html>`}export{B as P,P as R};
