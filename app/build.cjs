const fs = require('fs');
const path = require('path');
const IMGP = require('path').join(__dirname, 'assets', 'images.json');

const imgs = JSON.parse(fs.readFileSync(IMGP, 'utf8'));
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

const out =
  read('01-style.html') + '\n' +
  read('02-defs.html') + '\n' +
  '<div id="device"><div id="screen"></div></div>\n' +
  '<script>window.IMG=' + JSON.stringify(imgs) + ';</scr' + 'ipt>\n' +
  '<script>\n' +
  read('03-data.js') + '\n' +
  read('04-core.js') + '\n' +
  read('05-ui.js') + '\n' +
  read('06-task.js') + '\n' +
  read('07-muhsen.js') + '\n' +
  read('08-more.js') + '\n' +
  read('09-admin.js') + '\n' +
  read('11-reqcenter.js') + '\n' +
  read('10-router.js') + '\n' +
  '</scr' + 'ipt>\n';

const dest = path.join(__dirname, '..', 'muhsen-app.html');
fs.writeFileSync(dest, out);
console.log('built:', dest);
console.log('size:', Math.round(fs.statSync(dest).size / 1024) + 'KB');

/* نسخة قابلة للتثبيت كتطبيق — للاستضافة */
const deploy = path.join(__dirname, '..', 'docs');   /* مصدر GitHub Pages */
fs.mkdirSync(deploy, { recursive: true });
const pwa = '<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n' + read('pwa-head.html') +
  '\n</head>\n<body>\n' + out + read('pwa-tail.html') + '\n</body>\n</html>';
fs.writeFileSync(path.join(deploy, 'index.html'), pwa);
console.log('docs/index.html:', Math.round(fs.statSync(path.join(deploy, 'index.html')).size / 1024) + 'KB');

// فحص سريع للأخطاء النحوية في جزء الجافاسكربت
const js = [ '03-data.js','04-core.js','05-ui.js','06-task.js','07-muhsen.js','08-more.js','09-admin.js','11-reqcenter.js','10-router.js' ]
  .map(read).join('\n');
try { new Function(js); console.log('syntax: OK'); }
catch (e) { console.log('SYNTAX ERROR:', e.message); process.exitCode = 1; }

/* حارس: أسماء عامة محجوزة في المتصفح — إعلانها في النطاق العام يُسقط السكربت كله */
const RESERVED = ['top','self','parent','window','document','location','history','navigator','screen',
  'frames','length','name','status','origin','close','closed','open','focus','blur','print','stop',
  'alert','confirm','prompt','event','external','opener','scrollX','scrollY','innerWidth','innerHeight'];
const declared = new Set();
/* المستوى الأعلى فقط: بلا مسافة بادئة */
const re = /(?:^|\n)(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;
let m; while ((m = re.exec(js))) declared.add(m[1]);
const clash = RESERVED.filter(r => declared.has(r));
if (clash.length) { console.log('GLOBAL CLASH:', clash.join(', '), '→ أعد التسمية'); process.exitCode = 1; }
else console.log('globals: OK');

/* حارس: كل دالة شاشة مسجّلة في المُوجِّه يجب أن تكون معرَّفة فعلًا في المخرجات */
const routed = [...(js.match(/:\s*(screen[A-Za-z]+)/g) || [])].map(s => s.split(':')[1].trim());
const defined = new Set([...(js.match(/function\s+(screen[A-Za-z]+)/g) || [])].map(s => s.split(/\s+/)[1]));
const missing = [...new Set(routed)].filter(n => !defined.has(n));
if (missing.length) { console.log('MISSING SCREENS:', missing.join(', ')); process.exitCode = 1; }
else console.log('screens: OK (' + defined.size + ')');
