/* ============================================================
   مسبارُ الإجراءات — أيُّ زرٍّ لا يتمّ؟

   الحرّاسُ يمنعون زرًّا بلا `case`، والمسابرُ ترسم الشاشاتِ وتجرّب
   مساراتٍ مختارة. وبين الاثنين ثقبٌ: زرٌّ له `case` وله شاشةٌ،
   ويُنقَر فلا يقع شيء — أو يقع رفضٌ أحمرُ في كلّ الأحوال.

   فهذا ينقر كلَّ زرٍّ في كلّ شاشةٍ بالدورين، ثمّ كلَّ زرٍّ داخل كلّ
   لوحٍ يُفتح، ويقيس هل تغيّرت الحالةُ أصلًا:

     ميت   نُقر فلم تتغيّر الحالةُ ولا الشاشةُ ولا ظهر توست
     يرفض  لا يُنتج إلّا توستًا أحمرَ — يُقرأ ليُعرف: شرطٌ أم علّة
     يرمي  يُسقط استثناءً

     node acts.cjs
   ============================================================ */
const fs = require('fs'), cp = require('child_process');
const SC = __dirname.split('\\').join('/') + '/';
const SRC = SC + '../docs/index.html';

/* أزرارٌ تعتمد عتادًا أو ملفًّا لا يوجد في المتصفّح الصامت */
const SKIP = ['shoot', 'memories', 'upphoto', 'gal', 'appupdate',
  'bioadd', 'bioin', 'biooff', 'bionone', 'biodrop', 'push', 'pushask'];

const harness = `<script>
(function () {
  var OUT = [], ERR = [];
  window.addEventListener('error', function (e) { ERR.push(e.message); });
  var SKIP = ${JSON.stringify(SKIP)};

  /* بصمةُ الحالة: نتجاهل المفاتيحَ الداخليّةَ ووقتَ العرض */
  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
  }
  function sig() {
    var st;
    try {
      st = JSON.stringify(S, function (k, v) { return k.charAt(0) === '_' ? undefined : v; });
    } catch (e) { st = 'X'; }
    var sc = document.getElementById('screen');
    var sh = document.getElementById('sheet');
    return hash(st) + '/' + (sc ? hash(sc.innerHTML) : 0) + '/' + (sh ? hash(sh.innerHTML) : 0);
  }
  function tkind() { return S.toast ? (S.toast.kind || 'g') : ''; }
  function label(b) {
    var t = (b.textContent || b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
    return t.length > 26 ? t.slice(0, 26) + '…' : (t || '—');
  }

  setTimeout(function () {
    var SNAP = JSON.stringify(S);
    var ROUTES = Object.keys(SCREENS).filter(function (r) { return r !== 'login'; });
    var dead = [], rej = [], thr = [], seen = {}, clicks = 0, sheets = {};

    function setup(uid, r) {
      S = JSON.parse(SNAP);
      S.session = { id: uid, at: Date.now() };
      S.route = { n: r, id: (S.tasks[0] || {}).id };
      S.sheet = null; S.sheetBare = false; S.pushAsked = true; S.toast = null;
    }
    /* لا نقرَ على زرٍّ يفتح ملفًّا أو كاميرا، ولا على الخروج فيضيع السياق */
    function skip(a) { return SKIP.indexOf(a) >= 0 || a === 'logout'; }

    function click(b, where) {
      var a = b.dataset.a, lb = label(b);
      if (skip(a)) return null;
      var k = where + ' · ' + a;
      var pre = sig(), e0 = ERR.length;
      try { b.click(); } catch (e) { thr.push(k + ' — ' + e.message); return 'thr'; }
      clicks++;
      if (ERR.length > e0) { thr.push(k + ' — ' + ERR[ERR.length - 1]); return 'thr'; }
      var post = sig();
      if (pre === post && !S.toast) {
        if (!seen['d' + a]) { seen['d' + a] = 1; dead.push(k + ' [' + lb + ']'); }
        return 'dead';
      }
      if (tkind() === 'r' && pre === post.split('/')[0] + '/' + post.split('/')[1] + '/' + post.split('/')[2]) {
        /* لم يقع إلّا التوست */
      }
      if (tkind() === 'r' && !seen['r' + a]) {
        seen['r' + a] = 1; rej.push(k + ' [' + lb + '] → ' + S.toast.text);
      }
      if (S.sheet) sheets[a] = where;
      return 'ok';
    }

    [['leader', 'L'], ['muhsen', 'M'], ['muhsen-نقل', 'Q']].forEach(function (pair) {
      var who = pair[0] === 'muhsen-نقل'
        ? S.users.filter(function (x) { return x.role === 'muhsen' && x.specialty === 'نقل'; })[0]
        : S.users.filter(function (x) { return x.role === pair[0] && !x.admin; })[0];
      if (!who) return;
      var uid = who.id, tag = pair[1];

      ROUTES.forEach(function (r) {
        /* الجولةُ الأولى: عددُ الأزرار */
        setup(uid, r);
        try { render(); } catch (e) { thr.push(tag + '/' + r + ' — رسم: ' + e.message); return; }
        var n = document.querySelectorAll('#screen [data-a]').length;
        for (var i = 0; i < n; i++) {
          setup(uid, r);
          try { render(); } catch (e) { break; }
          var bs = document.querySelectorAll('#screen [data-a]');
          if (!bs[i]) break;
          var res = click(bs[i], tag + '/' + r);
          /* إن انفتح لوحٌ فلنجرّب ما فيه الآن — فالسياقُ قائم */
          if (res === 'ok' && S.sheet) {
            var sb = document.querySelectorAll('#sheet [data-a]');
            var m = sb.length;
            for (var j = 0; j < m; j++) {
              /* نعيد بناءَ السياق لكلّ زرٍّ داخل اللوح */
              setup(uid, r);
              try { render(); } catch (e) { break; }
              var bs2 = document.querySelectorAll('#screen [data-a]');
              if (!bs2[i]) break;
              try { bs2[i].click(); } catch (e) { break; }
              var sb2 = document.querySelectorAll('#sheet [data-a]');
              if (!sb2[j]) break;
              click(sb2[j], tag + '/' + r + '/لوح ' + bs2[i].dataset.a);
            }
          }
        }
      });
    });

    OUT.push('نقرات=' + clicks + ' · أدوار=٣ · وجهات=' + ROUTES.length);
    if (dead.length) { OUT.push(''); OUT.push('ميتٌ لا يُحدث شيئًا (' + dead.length + '):'); dead.forEach(function (x) { OUT.push('  X ' + x); }); }
    if (thr.length) { OUT.push(''); OUT.push('يرمي استثناءً (' + thr.length + '):'); thr.forEach(function (x) { OUT.push('  X ' + x); }); }
    if (rej.length) { OUT.push(''); OUT.push('رفضٌ أحمرُ — يُقرأ (' + rej.length + '):'); rej.forEach(function (x) { OUT.push('  · ' + x); }); }
    if (!dead.length && !thr.length) OUT.push('+ كلُّ زرٍّ يقع له أثر');

    var p = document.createElement('pre'); p.id = 'PP';
    p.textContent = OUT.join(String.fromCharCode(10));
    document.body.appendChild(p);
  }, 900);
})();
</scr` + `ipt>`;

const html = fs.readFileSync(SRC, 'utf8');
const i = html.lastIndexOf('</body>');
fs.writeFileSync(SC + '_acts.html', html.slice(0, i) + harness + html.slice(i));

const r = cp.execSync('"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new ' +
  '--disable-gpu --window-size=430,900 --virtual-time-budget=180000 --dump-dom ' +
  '"file:///' + SC + '_acts.html"', { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const m = r.match(/<pre id="PP">([\s\S]*?)<\/pre>/);
const out = m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>').replace(/&quot;/g, '"') : 'X لا مخرجات';
console.log(out);
if (/^\s*X /m.test(out) || out.indexOf('لا مخرجات') >= 0) process.exitCode = 1;
