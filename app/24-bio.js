/* ============================================================
   الدخولُ بالسِّمة الحيويّة — WebAuthn

   يُستعمل مُصدِّقُ المنصّة (بصمةُ الجهاز أو وجهُه)، لا بصمةٌ
   يحفظها التطبيق: البصمةُ لا تُغادر الجهازَ قطُّ، وما يُحفظ هنا
   هو **معرّفُ اعتمادٍ** لا سرَّ فيه.

   وحين يصل الخادم: يُستبدل التحدّي العشوائيُّ المحلّيُّ بتحدٍّ
   من الخادم، ويُرسَل الجوابُ إليه ليتحقّق. ولا يتغيّر شيءٌ في
   الشاشة — الموضعان معلَّمان بـ«نقطةُ الربط».

   ويعمل على https وعلى localhost وحدهما: وهو شرطُ المتصفّح لا
   اختيارُنا.
   ============================================================ */

const BIO_KEY = 'muhsen_bio_v1';

const bioSupported = () =>
  typeof window.PublicKeyCredential === 'function' &&
  !!(navigator.credentials && navigator.credentials.create);

/* هل في الجهاز مُصدِّقُ منصّةٍ فعلًا؟ سؤالٌ غيرُ متزامن */
let _bioReady = null;
function bioProbe(cb) {
  if (_bioReady !== null) { cb(_bioReady); return; }
  if (!bioSupported()) { _bioReady = false; cb(false); return; }
  try {
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(ok => { _bioReady = !!ok; cb(_bioReady); })
      .catch(() => { _bioReady = false; cb(false); });
  } catch (e) { _bioReady = false; cb(false); }
}

/* ما سُجّل على هذا الجهاز: { id, userId, name } */
function bioSaved() {
  try { return JSON.parse(localStorage.getItem(BIO_KEY) || 'null'); }
  catch (e) { return null; }
}
function bioStore(v) {
  try { v ? localStorage.setItem(BIO_KEY, JSON.stringify(v))
          : localStorage.removeItem(BIO_KEY); } catch (e) {}
}

const b64 = buf => {
  const a = new Uint8Array(buf); let s = '';
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64 = s => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '==='.slice((t.length + 3) % 4));
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
};
const rand = n => { const a = new Uint8Array(n);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a)
    : a.forEach((_, i) => { a[i] = (Math.random() * 256) | 0; });
  return a; };

/* ---------- التسجيل: يُعرَض بعد أوّل دخولٍ ناجح ---------- */
function bioEnroll(u, done) {
  if (!bioSupported()) { done(false, 'الجهاز لا يدعم هذه الميزة'); return; }
  /* نقطةُ الربط: التحدّي يأتي من الخادم */
  navigator.credentials.create({
    publicKey: {
      challenge: rand(32),
      rp: { name: 'مُحسن', id: location.hostname },
      user: { id: rand(16), name: u.code || u.id, displayName: u.name },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 },
                         { type: 'public-key', alg: -257 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    }
  }).then(cred => {
    if (!cred) { done(false, 'لم يكتمل التسجيل'); return; }
    bioStore({ id: b64(cred.rawId), userId: u.id, name: u.name });
    done(true);
  }).catch(err => {
    done(false, err && err.name === 'NotAllowedError'
      ? 'أُلغي التسجيل' : 'تعذّر التسجيل على هذا الجهاز');
  });
}

/* ---------- الدخول ---------- */
function bioLogin(done) {
  const saved = bioSaved();
  if (!saved) { done(false, 'لا سِمة مسجّلة على هذا الجهاز'); return; }
  /* نقطةُ الربط: التحدّي من الخادم، والجوابُ يُرسَل إليه */
  navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      allowCredentials: [{ type: 'public-key', id: unb64(saved.id) }],
      userVerification: 'required',
      timeout: 60000
    }
  }).then(res => {
    if (!res) { done(false, 'لم يكتمل التحقّق'); return; }
    done(true, null, saved.userId);
  }).catch(err => {
    done(false, err && err.name === 'NotAllowedError'
      ? 'أُلغي التحقّق' : 'تعذّر التحقّق — ادخل بكلمة المرور');
  });
}

/* ---------- الأفعال ---------- */
function bioDo() {
  if (S.bioBusy) return;
  S.bioBusy = true; S.loginErr = null; save(); render();
  bioLogin(function (ok, why, uid) {
    S.bioBusy = false;
    if (!ok) { S.loginErr = why; save(); render(); return; }
    const u = userById(uid);
    if (!u) { bioStore(null); S.loginErr = 'الحساب المسجّل لم يعد موجودًا';
      save(); render(); return; }
    enterAs(u.id);
  });
}

function bioAskSheet(u) {
  return '<div class="sheeth"><b>الدخول بالسِّمة الحيويّة</b></div>' +
    '<div class="bioask">' +
      '<span class="bioic">' + icon('i-touch', 's26') + '</span>' +
      '<p>تدخل مرّةً واحدةً ببصمة الجهاز أو وجهه بدل كتابة كلمة المرور. ' +
        'والسِّمةُ لا تُغادر جهازك — يُحفظ معرّفٌ لا سرَّ فيه.</p>' +
    '</div>' +
    '<div class="sheetbtns">' +
      '<button class="btn g" data-a="bioskip">لاحقًا</button>' +
      '<button class="btn p" data-a="bioenroll" data-id="' + u.id + '">' +
        icon('i-touch', 's16') + 'تفعيل</button>' +
    '</div>';
}

function bioEnrollDo(id) {
  const u = userById(id); if (!u) return;
  bioEnroll(u, function (ok, why) {
    S.sheet = null;
    toast(ok ? 'فُعّل الدخول بالسِّمة الحيويّة' : why, ok ? 'g' : 'r');
    save(); render();
  });
}

/* يُعرَض مرّةً واحدةً لكلّ جهاز، وبعد الدخول لا قبله */
function maybeAskBio() {
  if (!S.session || S.bioAsked || bioSaved()) return false;
  if (!bioSupported() || _bioReady === false) return false;
  S.bioAsked = true;
  S.sheet = bioAskSheet(me());
  return true;
}
