const fs = require('fs');
let t = fs.readFileSync('template.html', 'utf8');

const R = [
  [/\.ground \.ph\{[^}]*\}/, '.ground .ph{position:absolute; inset:-14%; background-size:cover; background-position:center; filter:blur(30px) saturate(1.1); opacity:.3}'],
  [/\.ground \.tint\{[^}]*\}/, '.ground .tint{position:absolute; inset:0; background:linear-gradient(180deg, rgba(14,63,44,.34) 0%, rgba(250,248,243,.9) 26%, #FAF8F3 62%)}'],
  [/\.topbar\{[^}]*\}/, '.topbar{position:relative; z-index:3; padding-bottom:16px; border-radius:0 0 26px 26px; background:linear-gradient(158deg,#1A6B4C 0%,#12513A 55%,#0D3E2C 100%); box-shadow:0 10px 30px -14px rgba(11,53,39,.6)}'],
  [/\n  \.appbar\{/, '\n  .topbar::after{content:""; position:absolute; left:26px; right:26px; bottom:0; height:1px; background:linear-gradient(90deg,transparent,rgba(216,198,164,.55),transparent)}\n  .appbar{'],
  [/\n  \.c\{[^}]*\}/, '\n  .c{position:relative; background:#fff; border-radius:20px; padding:15px; box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(11,53,39,.05), 0 4px 10px -4px rgba(11,53,39,.07), 0 18px 34px -22px rgba(11,53,39,.3)}'],
  [/\.c\.solid\{[^}]*\}/, '.c.gold::before{content:""; position:absolute; top:0; left:22px; right:22px; height:1.5px; border-radius:2px; background:linear-gradient(90deg,transparent,#C6A86F,transparent)}'],
  [/\.pill\{[^}]*\}/, '.pill{font-size:11.5px; font-weight:700; padding:5px 12px; border-radius:99px; white-space:nowrap; line-height:1.5}'],
  [/\.pill\.live\{[^}]*\}/, '.pill.live{background:#E4F2E9; color:#0B6540}'],
  [/\.pill\.wait\{[^}]*\}/, '.pill.wait{background:#FBF1DE; color:#7F5310}'],
  [/\.pill\.no\{[^}]*\}/, '.pill.no{background:#FBE9E7; color:#93261C}'],
  [/\.pill\.grey\{[^}]*\}/, '.pill.grey{background:#EFF1ED; color:#5A6C63}'],
  [/\.pill\.gold\{[^}]*\}/, '.pill.gold{background:#F5EDDF; color:#6E5729; box-shadow:inset 0 0 0 1px rgba(198,168,111,.45)}'],
  [/\.meta\{[^}]*\}/, '.meta{display:flex; padding:15px 2px; border-radius:20px; background:#fff; box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(11,53,39,.05), 0 18px 34px -22px rgba(11,53,39,.3)}'],
  [/\.thumb\{[^}]*\}/, '.thumb{width:84px; height:66px; border-radius:14px; flex:none; background-size:cover; background-position:center; box-shadow:0 0 0 1px rgba(198,168,111,.5), 0 6px 16px -7px rgba(11,53,39,.6)}'],
  [/\.banner\{[^}]*\}/, '.banner{height:132px; border-radius:20px; position:relative; overflow:hidden; background-size:cover; background-position:center; display:flex; align-items:flex-end; padding:14px; box-shadow:0 0 0 1px rgba(198,168,111,.45), 0 16px 32px -18px rgba(11,53,39,.7)}'],
  [/\.banner::after\{[^}]*\}/, '.banner::after{content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,53,39,0) 30%, rgba(9,43,31,.86))}'],
  [/\n  \.cta\{[^}]*\}/, '\n  .cta{position:relative; display:flex; align-items:center; gap:14px; border-radius:18px; padding:15px 18px; color:#fff; background:linear-gradient(150deg,#1D7452 0%,#12523A 55%,#0C3A29 100%); box-shadow:inset 0 1px 0 rgba(255,255,255,.18), 0 14px 28px -14px rgba(11,53,39,.9)}'],
  [/\.cta\.off\{[^}]*\}/, '.cta.off{background:#EAEDE9; color:#93A099; box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(11,53,39,.05)}'],
  [/\.btn\.primary\{[^}]*\}/, '.btn.primary{background:linear-gradient(150deg,#1D7452,#0C3A29); color:#fff; box-shadow:inset 0 1px 0 rgba(255,255,255,.18), 0 12px 24px -14px rgba(11,53,39,.9)}'],
  [/\.btn\.ghost\{[^}]*\}/, '.btn.ghost{background:#fff; color:#14593F; border:1.5px solid rgba(20,89,63,.35); box-shadow:0 1px 2px rgba(11,53,39,.05)}'],
  [/\.btn\.line\{[^}]*\}/, '.btn.line{background:#fff; color:#14593F; box-shadow:inset 0 0 0 1px rgba(198,168,111,.5), 0 1px 2px rgba(11,53,39,.05), 0 10px 22px -16px rgba(11,53,39,.4)}'],
  [/\.btn\.off\{[^}]*\}/, '.btn.off{background:#EAEDE9; color:#93A099}'],
  [/\.btn\.danger\{[^}]*\}/, '.btn.danger{background:#fff; color:#C0392B; border:1.5px solid rgba(192,57,43,.3); box-shadow:0 1px 2px rgba(11,53,39,.05)}'],
  [/\.prow\{[^}]*\}/, '.prow{display:flex; align-items:center; gap:12px; border-radius:18px; padding:12px 14px; background:#fff; box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(11,53,39,.05), 0 14px 28px -22px rgba(11,53,39,.3)}'],
  [/\n  \.av\{[^}]*\}/, '\n  .av{width:46px; height:46px; border-radius:50%; flex:none; overflow:hidden; box-shadow:0 0 0 1.5px rgba(198,168,111,.55), 0 4px 12px -5px rgba(11,53,39,.45)}'],
  [/\.selfield\{[^}]*\}/, '.selfield{display:flex; align-items:center; gap:10px; border-radius:16px; padding:14px; color:#75857B; font-size:13.5px; background:#fff; box-shadow:inset 0 0 0 1px rgba(20,89,63,.1), 0 1px 2px rgba(11,53,39,.04)}'],
  [/\.kpi\{[^}]*\}/, '.kpi{position:relative; border-radius:18px; padding:14px 8px; text-align:center; background:#fff; box-shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(11,53,39,.05), 0 16px 30px -22px rgba(11,53,39,.32)}'],
  [/\.kpi span\{[^}]*\}/, '.kpi span{font-size:11px; color:#75857B}\n  .kpi::after{content:""; position:absolute; top:0; left:26px; right:26px; height:1.5px; border-radius:2px; background:linear-gradient(90deg,transparent,#C6A86F,transparent)}'],
  [/\.map\{[^}]*\}/, '.map{height:136px; border-radius:20px; position:relative; overflow:hidden; box-shadow:0 0 0 1px rgba(198,168,111,.45), 0 16px 30px -20px rgba(11,53,39,.6)}'],
  [/\.ring\{[^}]*\}/, '.ring{position:absolute; inset:50% auto auto 50%; transform:translate(50%,-50%); width:108px; height:108px; border-radius:50%; background:rgba(11,138,75,.14); border:1.6px solid rgba(11,138,75,.55)}'],
  [/\.scale\{[^}]*\}/, '.scale{position:absolute; bottom:9px; inset-inline-start:11px; background:#fff; border-radius:9px; padding:3px 10px; font-size:10px; color:#5A6C63; font-weight:700; box-shadow:0 2px 8px -3px rgba(11,53,39,.5)}'],
  [/\.tabbar\{[^}]*\}/, '.tabbar{display:flex; justify-content:space-around; align-items:flex-start; padding:12px 6px 17px; position:relative; z-index:3; background:#fff; box-shadow:0 -1px 0 rgba(20,89,63,.07), 0 -16px 34px -26px rgba(11,53,39,.55)}'],
  [/\.tabbar \.hb\{[^}]*\}/, '.tabbar .hb{width:56px; height:56px; border-radius:50%; color:#fff; display:grid; place-items:center; margin-top:-28px; border:3px solid #fff; background:linear-gradient(150deg,#1D7452,#0C3A29); box-shadow:0 0 0 1px rgba(198,168,111,.5), 0 10px 22px -8px rgba(11,53,39,.75)}'],
  [/\n  \.note\{[^}]*\}/, '\n  .note{border-radius:16px; padding:13px 14px; font-size:12.5px; display:flex; gap:10px; align-items:flex-start; line-height:1.7}'],
  [/\.note\.amber\{[^}]*\}/, '.note.amber{background:#FCF5E7; color:#7A5512; box-shadow:inset 0 0 0 1px rgba(198,168,111,.4)}'],
  [/\.note\.green\{[^}]*\}/, '.note.green{background:#E9F4EE; color:#0B5A3B; box-shadow:inset 0 0 0 1px rgba(11,138,75,.18)}'],
  [/\.note\.red\{[^}]*\}/, '.note.red{background:#FCEDEB; color:#93261C; box-shadow:inset 0 0 0 1px rgba(192,57,43,.18)}'],
  [/\.box\{[^}]*\}/, '.box{width:23px; height:23px; border-radius:8px; border:1.7px solid rgba(20,89,63,.24); flex:none; display:grid; place-items:center; color:#fff; background:#fff}'],
  [/\.box\.on\{[^}]*\}/, '.box.on{background:linear-gradient(150deg,#1D7452,#0C3A29); border-color:transparent; box-shadow:0 4px 10px -4px rgba(11,53,39,.7)}'],
  [/\.tick\{[^}]*\}/, '.tick{width:22px; height:22px; border-radius:8px; flex:none; border:1.7px solid rgba(20,89,63,.22); display:grid; place-items:center; color:#fff; background:#fff}'],
  [/\.tick\.on\{[^}]*\}/, '.tick.on{background:linear-gradient(150deg,#12A05A,#0A7040); border-color:transparent; box-shadow:0 4px 10px -4px rgba(10,112,64,.7)}'],
  [/\.role\{[^}]*\}/, '.role{border-radius:20px; padding:17px 12px; text-align:center; cursor:pointer; background:#fff; border:1.5px solid rgba(20,89,63,.1); box-shadow:0 1px 2px rgba(11,53,39,.05); transition:.18s}'],
  [/\n  \.card\{[^}]*\}/, '\n  .card{background:var(--card); border:1px solid var(--card-brd); border-radius:22px; padding:28px; box-shadow:var(--shadow)}'],
  [/--card:rgba\(255,255,255,\.7\);/, '--card:#FFFFFF;'],
  [/--card-brd:rgba\(255,255,255,\.75\);/, '--card-brd:rgba(20,89,63,.08);'],
  [/--shadow:0 2px 6px rgba\(11,53,39,\.05\), 0 20px 44px -22px rgba\(11,53,39,\.28\);/, '--shadow:inset 0 1px 0 #fff, 0 1px 2px rgba(11,53,39,.05), 0 22px 44px -26px rgba(11,53,39,.32);'],
  [/\.tbl-wrap\{[^}]*\}/, '.tbl-wrap{overflow-x:auto; border-radius:22px; background:var(--card); border:1px solid var(--card-brd); box-shadow:var(--shadow)}'],
  [/\.swatch\{[^}]*\}/, '.swatch{border-radius:20px; overflow:hidden; background:var(--card); border:1px solid var(--card-brd); box-shadow:var(--shadow)}'],
  [/\.screen\{height:100%;/, '.screen{height:100%; background:#FAF8F3;'],
  [/\.hero-meta div\{[^}]*\}/, '.hero-meta div{display:flex; flex-direction:column; line-height:1.4; padding:13px 20px; background:rgba(255,255,255,.07); border:1px solid rgba(216,198,164,.32); border-radius:16px}'],
];

let applied = 0; const failed = [];
for (const [re, rep] of R) {
  const before = t;
  t = t.replace(re, rep);
  if (t !== before) applied++; else failed.push(String(re).slice(0, 56));
}
fs.writeFileSync('template.html', t);
console.log('applied', applied, 'of', R.length);
if (failed.length) console.log('FAILED:\n' + failed.join('\n'));
