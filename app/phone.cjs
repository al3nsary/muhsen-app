/* ============================================================
   قياسُ الصفحة بعرض جوّالٍ حقيقيّ

   Chrome لا يُنزل نافذته تحت ٥٠٠ بكسل، فعرضُ ٣٩٠ يُقتطع لا يُرسم.
   والحلُّ إطارٌ بعرض الجهاز داخل مضيفٍ أوسعَ — فتسري عليه
   استعلاماتُ الوسائط كما تسري على الجهاز.

     node phone.cjs <muhsen|leader> <ar|en|ms> <عرض> <وجهة> <meas|shot> [لوح]
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';

const ROLEARG = process.argv[2] || 'muhsen';
const LANG  = process.argv[3] || 'ar';
const W     = +(process.argv[4] || 390);
const ROUTE = process.argv[5] || 'mhome';
const MODE  = process.argv[6] || 'meas';
const SHEET = process.argv[7] || '';            /* more | ride */

const ROLE = ROLEARG === 'leader' ? 'leader' : 'muhsen';
const SRC = 'C:/Users/KSA/Desktop/Muhsen-Field/docs/index.html';

const inner = fs.readFileSync(SRC, 'utf8');
const inject = '<script>\n' +
'window.__E = [];\n' +
'window.addEventListener("error", function (e) { window.__E.push(e.message); });\n' +
'setTimeout(function () {\n' +
'  try {\n' +
'    S.lang = ' + JSON.stringify(LANG) + '; i18nReset(); applyDir();\n' +
'    if (' + JSON.stringify(ROUTE) + ' !== "login") {\n' +
'      var u = S.users.filter(function (x) { return x.role === ' + JSON.stringify(ROLE) + '; })[0];\n' +
'      S.session = { id: u.id, at: Date.now() };\n' +
'    }\n' +
'    S.route = { n: ' + JSON.stringify(ROUTE) + ', id: (S.tasks[0] || {}).id };\n' +
'    S.pushAsked = true; S.sheet = null;\n' +
'    if (' + JSON.stringify(SHEET) + ' === "more") { S.sheet = moreSheet(); S.sheetBare = true; }\n' +
'    if (' + JSON.stringify(SHEET) + ' === "ride") { S.rdLeg = 0; S.sheet = rideSheet(); }\n' +
/* قائمةُ الأسماء: مفتوحةً، ومفتوحةً بعد كتابةِ حرفين */
'    if (' + JSON.stringify(SHEET) + ' === "combo") S.loginOpen = true;\n' +
'    if (' + JSON.stringify(SHEET) + ' === "typed") {\n' +
'      S.loginOpen = true; S.loginU = "\\u0645\\u062D"; }\n' +
/* رَدٌّ مفتوحٌ أو جارٍ — لا تُصنعان في البذرة، والبطاقةُ تُقاس بهما */
'    if (' + JSON.stringify(SHEET) + '.indexOf("open") === 0 ||\n' +
'        ' + JSON.stringify(SHEET) + '.indexOf("transit") === 0) {\n' +
'      var go = ' + JSON.stringify(SHEET) + '.indexOf("transit") === 0;\n' +
'      S.rides.push({ id: "RDX", no: "RD-4399", userId: S.session.id, seq: 3,\n' +
'        from: "\\u0645\\u0632\\u062F\\u0644\\u0641\\u0629", to: "\\u0645\\u0634\\u0639\\u0631 \\u0645\\u0646\\u0649",\n' +
'        mins: 35, legAr: "\\u0645\\u0632\\u062F\\u0644\\u0641\\u0629 \\u2190 \\u0645\\u0646\\u0649",\n' +
'        pax: 45, addedAt: Date.now() - 28 * 60000,\n' +
'        startedAt: go ? Date.now() - 22 * 60000 : null,\n' +
'        startLoc: go ? { lat: 21.389, lng: 39.937, acc: 9 } : null,\n' +
'        endedAt: null });\n' +
'    }\n' +
'    render();\n' +
'  } catch (e) { window.__E.push("render: " + e.message); }\n' +
'}, 600);\n' +
'</scr' + 'ipt>';
const i = inner.lastIndexOf('</body>');
fs.writeFileSync(SC + '_inner.html', inner.slice(0, i) + inject + inner.slice(i));

const probe = MODE === 'meas' ? '\n' +
'  var p = document.createElement("pre"); p.id = "PP";\n' +
'  p.textContent = o.join(String.fromCharCode(10));\n' +
'  document.body.appendChild(p);\n' : '';

const host = '<!doctype html><html><head><meta charset="utf-8"><style>' +
'html,body{margin:0;background:#20262b;height:100%}' +
'iframe{width:' + W + 'px;height:844px;border:0;display:block;margin:0 auto;background:#fff}' +
'pre{position:fixed;inset:auto 0 0 0;margin:0;background:#fff;color:#000;font:11px monospace;' +
'white-space:pre-wrap;max-height:62%;overflow:auto;z-index:9}' +
'</style></head><body><iframe id="fr" src="_inner.html"></iframe><script>\n' +
'setTimeout(function () {\n' +
'  var fr = document.getElementById("fr"), d = fr.contentDocument, w = fr.contentWindow;\n' +
'  var o = [], vw = d.documentElement.clientWidth;\n' +
'  o.push("إطار = " + vw + "px · dir = " + d.documentElement.getAttribute("dir"));\n' +
'  var errs = w.__E || [];\n' +
'  o.push("أخطاء التشغيل = " + errs.length);\n' +
'  errs.slice(0, 5).forEach(function (x) { o.push("  X " + x); });\n' +
'\n' +
'  [".tabs", ".tabs .tside", ".tabs .home", ".view", ".top", ".sheet", ".acclist"]\n' +
'  .forEach(function (q) {\n' +
'    var e = d.querySelector(q);\n' +
'    if (!e) { o.push(q + " : —"); return; }\n' +
'    var r = e.getBoundingClientRect();\n' +
'    o.push(q + " : w=" + Math.round(r.width) + " h=" + Math.round(r.height) +\n' +
'      " x=" + Math.round(r.left));\n' +
'  });\n' +
'\n' +
'  var fb = d.querySelectorAll(".fab, .fabmain");\n' +
'  if (fb.length) {\n' +
'    o.push("— القائمة العائمة: " + fb.length + " —");\n' +
'    [].forEach.call(fb, function (b, k) {\n' +
'      var r = b.getBoundingClientRect();\n' +
'      o.push("  " + k + " «" + b.textContent.trim().slice(0, 14) + "» w=" + Math.round(r.width) +\n' +
'        " h=" + Math.round(r.height) + " x=" + Math.round(r.left) +\n' +
'        (r.left < -1 || r.right > vw + 1 ? "  X خارج الشاشة" : "") +\n' +
'        (r.height < 44 ? "  X لمسٌ دون ٤٤" : ""));\n' +
'    });\n' +
'  }\n' +
'\n' +
'  var bs = d.querySelectorAll(".tabs button");\n' +
'  o.push("— أزرارُ الشريط: " + bs.length + " —");\n' +
'  [].forEach.call(bs, function (b, k) {\n' +
'    var r = b.getBoundingClientRect();\n' +
'    o.push("  " + k + " «" + b.textContent.trim().slice(0, 16) + "» w=" + Math.round(r.width) +\n' +
'      " h=" + Math.round(r.height) + " x=" + Math.round(r.left) +\n' +
'      (r.left < -1 || r.right > vw + 1 ? "  X خارج الشاشة" : ""));\n' +
'  });\n' +
'\n' +
'  var small = [];\n' +
'  [].forEach.call(d.querySelectorAll("button, a, input"), function (e) {\n' +
'    var r = e.getBoundingClientRect();\n' +
'    if (r.width < 1 || r.height < 1) return;\n' +
'    if (r.height < 44) small.push(Math.round(r.height) + "px ." + String(e.className || e.tagName).slice(0, 26));\n' +
'  });\n' +
'  o.push("— لمسٌ دون ٤٤px: " + small.length + " —");\n' +
'  small.slice(0, 8).forEach(function (x) { o.push("  " + x); });\n' +
'\n' +
'  var over = [];\n' +
'  [].forEach.call(d.querySelectorAll("body *"), function (e) {\n' +
'    var r = e.getBoundingClientRect();\n' +
'    if (r.width < 1 || r.height < 1) return;\n' +
'    var ov = Math.round(r.right - vw);\n' +
'    if (ov > 2) over.push({ o: ov, e: e });\n' +
'  });\n' +
'  over.sort(function (a, b) { return b.o - a.o; });\n' +
'  o.push("— يتجاوز العرض: " + over.length + " —");\n' +
'  over.slice(0, 6).forEach(function (x) {\n' +
'    o.push("  +" + x.o + "px " + x.e.tagName + "." + String(x.e.className || "-").slice(0, 32));\n' +
'  });\n' +
'\n' +
'  var RE = new RegExp("[\\u0600-\\u06FF]"), bad = {}, n = 0;\n' +
'  var wk = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT, null), nd;\n' +
'  while ((nd = wk.nextNode())) {\n' +
'    var t = String(nd.nodeValue || "").replace(/\\s+/g, " ").trim();\n' +
'    if (!t || !RE.test(t)) continue;\n' +
'    var pn = nd.parentNode && nd.parentNode.nodeName;\n' +
'    if (pn === "SCRIPT" || pn === "STYLE" || pn === "TITLE") continue;\n' +
'    if (!bad[t]) { bad[t] = 1; n++; }\n' +
'  }\n' +
'  o.push("— عربيٌّ باقٍ: " + n + " —");\n' +
'  Object.keys(bad).slice(0, 18).forEach(function (t) { o.push("  » " + t); });\n' +
probe +
'}, 2400);\n' +
'</scr' + 'ipt></body></html>';
fs.writeFileSync(SC + '_host.html', host);

const out = SC + 'ph-' + ROLEARG + '-' + LANG + '-' + ROUTE + (SHEET ? '-' + SHEET : '') + '.png';
const cmd = '"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu ' +
  '--allow-file-access-from-files --window-size=' + Math.max(W + 24, 520) + ',900 ' +
  '--virtual-time-budget=22000 ' +
  (MODE === 'meas' ? '--dump-dom' : '--screenshot="' + out + '"') +
  ' "file:///' + SC + '_host.html"';
const r = cp.execSync(cmd, { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();

if (MODE === 'meas') {
  const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
  console.log('== ' + ROLEARG + ' · ' + LANG + ' @' + W + ' /' + ROUTE + (SHEET ? ' +' + SHEET : '') + '\n' +
    (m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<')
           .replace(/&gt;/g, '>').replace(/&quot;/g, '"') : 'X لا مخرجات'));
} else console.log(out);
