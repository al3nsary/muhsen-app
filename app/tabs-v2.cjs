const fs = require('fs');

/* ---------- 1) التنسيق: شريط واحد متصل قابل للسحب ---------- */
let c = fs.readFileSync('01-style.html', 'utf8');

c = c.replace(/  \.tabs\{[^}]*\}/,
`  .tabs{display:flex; gap:4px; align-items:flex-start; padding:10px 10px 14px; background:#fff;
    position:relative; z-index:3; flex:none;
    overflow-x:auto; overflow-y:hidden; overscroll-behavior-x:contain;
    scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch;
    touch-action:pan-x; cursor:grab; scrollbar-width:none;
    box-shadow:0 -1px 0 rgba(20,89,63,.07), 0 -16px 34px -26px rgba(11,53,39,.55);
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 16px,#000 calc(100% - 16px),transparent 100%);
    mask-image:linear-gradient(90deg,transparent 0,#000 16px,#000 calc(100% - 16px),transparent 100%)}
  .tabs::-webkit-scrollbar{display:none}
  .tabs.dragging{cursor:grabbing; scroll-behavior:auto; scroll-snap-type:none}
  .tabs.dragging button{pointer-events:none}`);

c = c.replace(/  \.tabs button\{[^}]*\}/,
`  .tabs button{display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10.5px;
    color:#8C9B92; width:64px; flex:none; text-align:center; padding:3px 0 0; scroll-snap-align:center;
    border-radius:14px; -webkit-user-select:none; user-select:none}`);

/* زر الرئيسية داخل الشريط بلا بروز يقطعه التمرير */
c = c.replace(/  \.tabs \.hb\{[^}]*\}/,
`  .tabs .hb{width:42px; height:42px; border-radius:50%; color:#fff; display:grid; place-items:center;
    background:linear-gradient(150deg,var(--g3),var(--g2));
    box-shadow:0 0 0 1px rgba(198,168,111,.55), 0 6px 14px -5px rgba(11,53,39,.7)}`);

/* إزالة الأسهم والتقسيم */
c = c.replace(/\n  \.tabs \.side\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.side::-webkit-scrollbar\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.side button\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.mid\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.arrow\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.arrow\.on\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.arrow\.ar\{[^}]*\}/g, '');
c = c.replace(/\n  \.tabs \.arrow \.n\{[^}]*\}/g, '');
fs.writeFileSync('01-style.html', c);

/* ---------- 2) بناء الشريط: قائمة واحدة والرئيسية في وسطها ---------- */
let u = fs.readFileSync('05-ui.js', 'utf8');
const start = u.indexOf('function tabs() {');
const end = u.indexOf('const ground =');

const tabs = `function tabs() {
  const L = isLeader(), r = S.route.n;
  const inbox = S.requests.filter(x => x.to === S.session.id && x.state === "pending").length;
  const items = L
    ? [{ k:"tasks", i:"i-tasks", l:"المهام", on:["tasks","task","assign","timeline","filter"] },
       { k:"lreq", i:"i-swap", l:"الطلبات", b:inbox, on:["lreq","pending"] },
       { k:"muhsens", i:"i-users", l:"المحسنون", on:["muhsens"] },
       { home:1 },
       { k:"notifs", i:"i-bell", l:"الإشعارات", b:unread(), on:["notifs"] },
       { k:"tickets", i:"i-ticket", l:"التذاكر", on:["tickets","ticket"] },
       { k:"reports", i:"i-report", l:"التقارير", on:["reports","report"] },
       { k:"calendar", i:"i-cal", l:"التقويم", on:["calendar"] },
       { k:"pilgrims", i:"i-user", l:"الحجاج", on:["pilgrims"] },
       { k:"more", i:"i-dots", l:"المزيد", on:["more","profile","admin","completed"] }]
    : [{ k:"mytask", i:"i-tasks", l:"مهمتي", on:["mytask","timeline"] },
       { k:"requests", i:"i-swap", l:"الطلبات", b:inbox, on:["requests"] },
       { k:"pilgrims", i:"i-user", l:"الحجاج", on:["pilgrims"] },
       { home:1 },
       { k:"notifs", i:"i-bell", l:"الإشعارات", b:unread(), on:["notifs"] },
       { k:"tickets", i:"i-ticket", l:"التذاكر", on:["tickets","ticket"] },
       { k:"reports", i:"i-report", l:"التقارير", on:["reports","report"] },
       { k:"calendar", i:"i-cal", l:"التقويم", on:["calendar"] },
       { k:"completed", i:"i-checkc", l:"المكتملة", on:["completed"] },
       { k:"more", i:"i-dots", l:"المزيد", on:["more","profile","admin"] }];

  const homeOn = ["home","mhome"].includes(r);
  return '<nav class="tabs" role="tablist" aria-label="التنقّل">' + items.map(function (it) {
    if (it.home) return '<button class="home' + (homeOn ? ' on' : '') + '" role="tab"' +
      (homeOn ? ' aria-selected="true"' : '') + ' data-a="go" data-n="' + (L ? 'home' : 'mhome') + '">' +
      '<span class="wi hb"><img src="' + IMG.logo_white + '" alt="" style="width:24px"></span>الرئيسية</button>';
    const on = it.on.includes(r);
    return '<button class="' + (on ? 'on' : '') + '" role="tab"' + (on ? ' aria-selected="true"' : '') +
      ' data-a="go" data-n="' + it.k + '">' +
      '<span class="wi">' + icon(it.i) + (it.b ? '<span class="badge">' + AR(it.b) + '</span>' : '') +
      '</span>' + it.l + '</button>';
  }).join('') + '</nav>';
}

`;
u = u.slice(0, start) + tabs + u.slice(end);
fs.writeFileSync('05-ui.js', u);

/* ---------- 3) السلوك: سحب بالماوس + عجلة + إظهار التاب النشط ---------- */
let r = fs.readFileSync('10-router.js', 'utf8');

/* إزالة منطق الأسهم القديم */
r = r.replace(/\/\* أسهم شريط التابات[\s\S]*?window\.addEventListener\('resize', function \(\) \{ syncTabArrows\(\); \}\);\n/, '');
r = r.replace(/\n *case 'tscroll': \{[\s\S]*?\n *\}\n/, '\n');
r = r.replace('  S._viewKey = key;\n  syncTabArrows();\n  save();', '  S._viewKey = key;\n  centerActiveTab();\n  save();');

if (!r.includes('centerActiveTab')) {
  r = r.replace('/* عدّاد حي',
`/* ===== شريط التابات: سحب بالماوس، تمرير لمسي أصيل، وإظهار النشط ===== */
function centerActiveTab() {
  const bar = document.querySelector('.tabs'); if (!bar) return;
  const on = bar.querySelector('button.on'); if (!on) return;
  const target = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
  bar.scrollTo({ left: target, behavior: 'auto' });
}

(function tabDrag() {
  let st = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;   /* اللمس يستخدم التمرير الأصيل */
    const bar = e.target.closest && e.target.closest('.tabs'); if (!bar) return;
    st = { bar, x: e.clientX, left: bar.scrollLeft, moved: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', function (e) {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x;
    if (!st.moved && Math.abs(dx) < 5) return;
    if (!st.moved) { st.moved = true; st.bar.classList.add('dragging'); st.bar.setPointerCapture(e.pointerId); }
    st.bar.scrollLeft = st.left - dx;
    e.preventDefault();
  });
  function stop(e) {
    if (!st) return;
    const bar = st.bar, moved = st.moved;
    if (moved) { bar.classList.remove('dragging'); bar.dataset.dragged = '1';
      setTimeout(function () { delete bar.dataset.dragged; }, 220); }
    try { bar.releasePointerCapture(st.id); } catch (err) {}
    st = null;
  }
  document.addEventListener('pointerup', stop);
  document.addEventListener('pointercancel', stop);

  /* عجلة الماوس تمرّر أفقيًا */
  document.addEventListener('wheel', function (e) {
    const bar = e.target.closest && e.target.closest('.tabs'); if (!bar) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    bar.scrollLeft += d; e.preventDefault();
  }, { passive: false });
})();

/* عدّاد حي`);
  fs.writeFileSync('10-router.js', r);
}

/* منع تنفيذ النقر بعد سحب */
r = fs.readFileSync('10-router.js', 'utf8');
if (!r.includes('dataset.dragged')) {
  r = r.replace("  const b = ev.target.closest('[data-a]'); if (!b) return;",
    "  const b = ev.target.closest('[data-a]'); if (!b) return;\n" +
    "  const inTabs = b.closest('.tabs');\n" +
    "  if (inTabs && inTabs.dataset.dragged) return;   /* كان سحبًا لا نقرًا */");
  fs.writeFileSync('10-router.js', r);
}

console.log('tabs v2 →',
  'arrows:', (fs.readFileSync('05-ui.js', 'utf8').match(/tscroll/g) || []).length,
  '| drag:', (fs.readFileSync('10-router.js', 'utf8').match(/tabDrag/g) || []).length,
  '| center:', (fs.readFileSync('10-router.js', 'utf8').match(/centerActiveTab/g) || []).length);
