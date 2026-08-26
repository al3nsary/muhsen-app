const fs = require('fs');

/* 1) أسهم التمرير داخل شريط التابات */
let u = fs.readFileSync('05-ui.js', 'utf8');
u = u.replace(
  '  return "<div class=\\"tabs\\">" +\n    "<div class=\\"side\\">" + right.map(btn).join("") + "</div>" +',
  '  return "<div class=\\"tabs\\">" +\n' +
  '    "<button class=\\"arrow ar\\" data-a=\\"tscroll\\" data-v=\\"r\\">" + icon("i-fwd","s16") + "<span class=\\"n\\"></span></button>" +\n' +
  '    "<button class=\\"arrow al\\" data-a=\\"tscroll\\" data-v=\\"l\\">" + icon("i-back","s16") + "<span class=\\"n\\"></span></button>" +\n' +
  '    "<div class=\\"side\\" data-side=\\"r\\">" + right.map(btn).join("") + "</div>" +'
);
u = u.replace(
  '    "<div class=\\"side\\">" + left.map(btn).join("") + "</div>" +',
  '    "<div class=\\"side\\" data-side=\\"l\\">" + left.map(btn).join("") + "</div>" +'
);
fs.writeFileSync('05-ui.js', u);

/* 2) قياس المخفي بعد كل رسم + دعم عجلة الماوس + زر السهم */
let r = fs.readFileSync('10-router.js', 'utf8');

if (!r.includes('syncTabArrows')) {
  r = r.replace('  S._viewKey = key;\n  save();',
    '  S._viewKey = key;\n  syncTabArrows();\n  save();');

  r = r.replace('/* عدّاد حي',
`/* أسهم شريط التابات: تُظهر عدد العناصر المخفية على كل جهة */
function hiddenCount(side) {
  if (!side) return 0;
  const r0 = side.getBoundingClientRect();
  let n = 0;
  Array.prototype.forEach.call(side.children, function (b) {
    const rb = b.getBoundingClientRect();
    if (rb.right > r0.right + 2 || rb.left < r0.left - 2) n++;
  });
  return n;
}
function syncTabArrows() {
  const bar = document.querySelector('.tabs'); if (!bar) return;
  [['r', '.arrow.ar'], ['l', '.arrow.al']].forEach(function (p) {
    const side = bar.querySelector('[data-side="' + p[0] + '"]');
    const arrow = bar.querySelector(p[1]);
    if (!side || !arrow) return;
    const n = hiddenCount(side);
    arrow.classList.toggle('on', n > 0);
    const dot = arrow.querySelector('.n');
    if (dot) dot.textContent = n ? AR(n) : '';
  });
}
/* عجلة الماوس تمرّر الشريط أفقيًا على الحاسوب */
document.addEventListener('wheel', function (e) {
  const side = e.target.closest && e.target.closest('.tabs .side');
  if (!side) return;
  side.scrollLeft += (e.deltaY || e.deltaX);
  e.preventDefault(); syncTabArrows();
}, { passive: false });
window.addEventListener('resize', function () { syncTabArrows(); });

/* عدّاد حي`);

  r = r.replace("    case 'seg': S.tab[b.dataset.k] = v; break;",
    "    case 'seg': S.tab[b.dataset.k] = v; break;\n" +
    "    case 'tscroll': {\n" +
    "      const side = document.querySelector('.tabs [data-side=\"' + v + '\"]');\n" +
    "      if (side) { const dir = getComputedStyle(document.body).direction === 'rtl' ? -1 : 1;\n" +
    "        side.scrollLeft += dir * (v === 'r' ? -140 : 140);\n" +
    "        setTimeout(syncTabArrows, 320); }\n" +
    "      return;\n" +
    "    }");
  fs.writeFileSync('10-router.js', r);
}

console.log('tabs arrows:', (fs.readFileSync('05-ui.js', 'utf8').match(/data-a=\\"tscroll/g) || []).length);
console.log('router hooks:', (fs.readFileSync('10-router.js', 'utf8').match(/syncTabArrows/g) || []).length);
