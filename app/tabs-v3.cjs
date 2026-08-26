const fs = require('fs');
let r = fs.readFileSync('10-router.js', 'utf8');

/* استبدال كتلة الأسهم القديمة كاملة بسلوك السحب الجديد */
const startMark = '/* أسهم شريط التابات';
const endMark = "window.addEventListener('resize', function () { syncTabArrows(); });";
const i = r.indexOf(startMark);
const j = r.indexOf(endMark);
if (i >= 0 && j > i) {
  const NEW = `/* ===== شريط التابات: سحب بالماوس، تمرير لمسي أصيل، وإظهار التاب النشط ===== */
function centerActiveTab() {
  const bar = document.querySelector('.tabs'); if (!bar) return;
  const on = bar.querySelector('button.on'); if (!on) return;
  bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
}

(function tabDrag() {
  let st = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;   /* اللمس يستخدم التمرير الأصيل */
    const bar = e.target.closest && e.target.closest('.tabs'); if (!bar) return;
    st = { bar: bar, x: e.clientX, left: bar.scrollLeft, moved: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', function (e) {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x;
    if (!st.moved && Math.abs(dx) < 5) return;
    if (!st.moved) {
      st.moved = true; st.bar.classList.add('dragging');
      try { st.bar.setPointerCapture(e.pointerId); } catch (err) {}
    }
    st.bar.scrollLeft = st.left - dx;
    e.preventDefault();
  });
  function stop() {
    if (!st) return;
    const bar = st.bar;
    if (st.moved) {
      bar.classList.remove('dragging');
      bar.dataset.dragged = '1';
      setTimeout(function () { delete bar.dataset.dragged; }, 220);
    }
    try { bar.releasePointerCapture(st.id); } catch (err) {}
    st = null;
  }
  document.addEventListener('pointerup', stop);
  document.addEventListener('pointercancel', stop);

  /* عجلة الماوس تمرّر الشريط أفقيًا */
  document.addEventListener('wheel', function (e) {
    const bar = e.target.closest && e.target.closest('.tabs'); if (!bar) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    bar.scrollLeft += d; e.preventDefault();
  }, { passive: false });
})();`;
  r = r.slice(0, i) + NEW + r.slice(j + endMark.length);
}

r = r.replace('  syncTabArrows();\n  save();', '  centerActiveTab();\n  save();');
r = r.replace(/\n *case 'tscroll': \{[\s\S]*?\n *\}\n/, '\n');

/* حماية النقر بعد السحب */
if (!r.includes('dataset.dragged)')) {
  r = r.replace("  const b = ev.target.closest('[data-a]'); if (!b) return;",
    "  const b = ev.target.closest('[data-a]'); if (!b) return;\n" +
    "  const inTabs = b.closest ? b.closest('.tabs') : null;\n" +
    "  if (inTabs && inTabs.dataset.dragged) return;   /* كان سحبًا لا نقرًا */");
}

fs.writeFileSync('10-router.js', r);
console.log('syncTabArrows left:', (r.match(/syncTabArrows/g) || []).length,
  '| tabDrag:', (r.match(/tabDrag/g) || []).length,
  '| centerActiveTab:', (r.match(/centerActiveTab/g) || []).length,
  '| tscroll:', (r.match(/tscroll/g) || []).length);

/* stub الاختبار: closest */
let s = fs.readFileSync('smoke.cjs', 'utf8');
s = s.replace('const target = { closest: sel => (sel === \'[data-a]\' ? { dataset: ds } : null) };',
  'const target = { closest: sel => (sel === \'[data-a]\' ? { dataset: ds, closest: () => null } : null) };');
fs.writeFileSync('smoke.cjs', s);
console.log('smoke stub patched:', s.includes('closest: () => null'));
