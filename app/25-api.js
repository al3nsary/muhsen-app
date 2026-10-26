/* ============================================================
   طبقةُ الربط — البابُ الوحيدُ إلى الخادم

   كلُّ ما سيُصبح نداءً للخادم يمرّ من هنا. وجسدُ كلّ دالّةٍ اليوم
   يعمل على الحالة المحلّيّة، فإذا وصل الخادمُ استُبدل الجسدُ وحدَه
   ولم تُمَسّ شاشةٌ ولا مُوجِّه.

   وكلُّ دالّةٍ تُرجع وعدًا (Promise) من الآن — وإن كان الجوابُ
   محلّيًّا فوريًّا. فلا يتغيّر توقيعُها عند الربط.

       API.mode === 'local'   تعمل على الحالة
       API.mode === 'remote'  تعمل على الخادم
   ============================================================ */

const API = {
  mode: 'local',
  base: '',                       /* يُملأ عند الربط: 'https://…/v1' */
  token: null,

  /* ---------- الناقل ---------- */
  /* نقطةُ الربط الوحيدة: هنا يقع fetch حين يصير mode = 'remote' */
  call(path, opt) {
    if (API.mode === 'local') return Promise.resolve(null);
    const o = opt || {};
    return fetch(API.base + path, {
      method: o.method || 'GET',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Accept-Language': langOf()
      }, API.token ? { Authorization: 'Bearer ' + API.token } : {}),
      body: o.body ? JSON.stringify(o.body) : undefined
    }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },

  /* يُغلّف فعلًا محلّيًّا في وعد: فالتوقيعُ واحدٌ في الحالين */
  local(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
};

/* ============================================================
   ساعةُ الخادم

   المهلُ والعدّاداتُ تُحسب بـ now(). وهي اليوم ساعةُ الجهاز مزاحةً
   بـ clockOffset. وجهازان بساعتين مختلفتين يُصعّدان البلاغَ نفسَه
   في وقتين — فالساعةُ يجب أن تأتي من الخادم.

   setServerTime(ts) يُستدعى بعد كلّ نداءٍ يحمل وقتَ الخادم.
   ============================================================ */
let SKEW = 0;                     /* فرقُ ساعة الخادم عن الجهاز، بالملّي */
function setServerTime(ts) {
  if (!ts) return;
  SKEW = Number(ts) - Date.now();
}
/* الفرقُ يُضاف داخل now() — انظر 04-core.js */
const serverSkew = () => SKEW;

/* ============================================================
   ختمُ النسخة

   مهمّةٌ واحدةٌ يحرّرها الليدرُ والكنترولُ معًا: بلا ختمٍ تكسب آخرُ
   كتابةٍ صامتةً وتضيع الأولى. فكلُّ سجلٍّ يُكتب يحمل رقمَ نسخةٍ
   وختمَ وقت، والخادمُ يرفض الكتابةَ على نسخةٍ أقدم.
   ============================================================ */
function touch(rec) {
  if (!rec) return rec;
  rec.v = (rec.v || 0) + 1;
  rec.at2 = now();
  rec.by = S.session ? S.session.id : null;
  return rec;
}

/* ============================================================
   كتالوجُ التصعيد

   ٨١ حالةً مبنيّةٌ في المخرجات. وعند الربط تُجلب من الخادم وتُخزَّن
   بنسختها، فتُحدَّث القواعدُ بلا إصدارٍ جديدٍ للتطبيق.
   ============================================================ */
const escCatalog = () => (S && S.escal && S.escal.length) ? S.escal : ESCAL;
const escVersion = () => (S && S.escalV) || 'built-in';

/* ============================================================
   السطحُ — ما سيطلبه الخادم

   الأسماءُ هي المسارات. وما كُتب هنا هو العقدُ الذي يُبنى عليه
   الطرفان: وثيقةُ API.md تشرح كلَّ واحدةٍ بجسدها.
   ============================================================ */
const APIv = {

  /* ---------- المصادقة ---------- */
  login: (identifier, password) => API.mode === 'remote'
    ? API.call('/auth/login', { method:'POST', body:{ identifier, password } })
        .then(r => { API.token = r.token; setServerTime(r.serverTime); return r.user; })
    : API.local(() => {
        const u = loginMatch();
        if (!u) throw { code:'NOT_FOUND' };
        if (!checkPassword(u, password)) throw { code:'BAD_CREDENTIALS' };
        return u;
      }),

  logout: () => API.mode === 'remote'
    ? API.call('/auth/logout', { method:'POST' }).then(() => { API.token = null; })
    : API.local(() => { API.token = null; }),

  /* ---------- المهامّ ---------- */
  tasks:    () => API.mode === 'remote' ? API.call('/tasks') : API.local(() => myTasks()),
  task:     id => API.mode === 'remote' ? API.call('/tasks/' + id) : API.local(() => taskById(id)),
  taskStart: id => API.mode === 'remote'
    ? API.call('/tasks/' + id + '/start', { method:'POST' })
    : API.local(() => touch(taskById(id))),
  taskClose: (id, body) => API.mode === 'remote'
    ? API.call('/tasks/' + id + '/close', { method:'POST', body })
    : API.local(() => touch(taskById(id))),
  subToggle: (id, subId, done) => API.mode === 'remote'
    ? API.call('/tasks/' + id + '/subs/' + subId, { method:'PATCH', body:{ done } })
    : API.local(() => touch(taskById(id))),

  /* ---------- الحضور ---------- */
  checkIn:  loc => API.mode === 'remote'
    ? API.call('/attendance/in', { method:'POST', body:{ loc } })
    : API.local(() => true),
  checkOut: loc => API.mode === 'remote'
    ? API.call('/attendance/out', { method:'POST', body:{ loc } })
    : API.local(() => true),

  /* ---------- الردود ---------- */
  rideAdd:   body => API.mode === 'remote'
    ? API.call('/rides', { method:'POST', body }) : API.local(() => body),
  rideStart: (id, loc) => API.mode === 'remote'
    ? API.call('/rides/' + id + '/start', { method:'POST', body:{ loc } })
    : API.local(() => true),
  rideEnd:   (id, loc) => API.mode === 'remote'
    ? API.call('/rides/' + id + '/end', { method:'POST', body:{ loc } })
    : API.local(() => true),

  /* ---------- البلاغات والتذاكر ---------- */
  catalog:  () => API.mode === 'remote'
    ? API.call('/catalog/escalation').then(r => { S.escal = r.items; S.escalV = r.version; return r; })
    : API.local(() => ({ items: ESCAL, version: 'built-in' })),
  reportRaise: body => API.mode === 'remote'
    ? API.call('/reports', { method:'POST', body }) : API.local(() => body),
  ticketReply: (id, body) => API.mode === 'remote'
    ? API.call('/tickets/' + id + '/replies', { method:'POST', body }) : API.local(() => body),

  /* ---------- الصور ----------
     تُحفظ اليوم وصفًا لا محتوًى. والرفعُ الفعليُّ يقع هنا. */
  upload: (file, meta) => API.mode === 'remote'
    ? (function () {
        const fd = new FormData();
        fd.append('file', file); fd.append('meta', JSON.stringify(meta || {}));
        return fetch(API.base + '/uploads', {
          method:'POST', body: fd,
          headers: API.token ? { Authorization:'Bearer ' + API.token } : {}
        }).then(r => r.json());
      })()
    : API.local(() => ({ name: file && file.name, size: file && file.size, at: now() })),

  /* ---------- المزامنة ---------- */
  /* ما كُتب والشبكةُ منقطعةٌ يُطابَر ويُرسَل عند عودتها */
  flush: () => API.local(() => (S.outbox || []).length)
};
