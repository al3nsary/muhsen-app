/* ============================================================
   الإعدادات — اللغةُ والشريطُ والحسابُ

   الشريطُ ثلاثةُ مواضعَ يملؤها المستخدم. وكان ثابتًا في الشيفرة،
   فمن لا يستعمل «التحضير» يراه كلَّ يوم ومن يستعمل «الصور» لا
   يصل إليها إلّا بنقرتين.
   ============================================================ */

/* نقرُ وجهةٍ: تُدخَل إن بقي موضع، وتُخرَج إن كانت داخلًا.
   والترتيبُ ترتيبُ الإدخال — فيضع المستخدمُ الأهمَّ أوّلًا. */
function tabPick(k) {
  const cur = tabChosen().slice();
  const i = cur.indexOf(k);
  if (i >= 0) {
    if (cur.length <= 1) { toast('لا بدّ من وجهةٍ واحدةٍ على الأقلّ', 'r'); return; }
    cur.splice(i, 1);
  } else if (cur.length >= TAB_SLOTS) {
    /* المواضعُ ممتلئةٌ: يخرج الأقدمُ ويدخل الجديد. وكان يُرفَض
       الاختيارُ ويُطلَب إخراجٌ يدويٌّ أوّلًا — نقرتان لعملٍ واحد. */
    cur.shift(); cur.push(k);
  } else cur.push(k);
  S.tabs = cur;
}

function screenSettings() {
  const u = me();
  const cat = tabCatalog(), cur = tabChosen();
  const custom = !!(S.tabs && S.tabs.length);

  /* معاينةُ الشريط كما سيظهر — خمسةُ مواضعَ بترتيبها */
  const slot = (it, home) =>
    '<span class="tprev' + (home ? ' h' : '') + '">' +
      (home ? '<i class="mlogo"></i>' : icon(it ? it.i : 'i-plus', 's18')) +
      '<b>' + (home ? 'الرئيسية' : it ? it.l : '—') + '</b></span>';
  const sel = cur.map(k => cat.find(x => x.k === k));
  const preview = '<div class="tprevbar">' +
    slot(sel[0]) + slot(sel[1]) + slot(null, true) + slot(sel[2]) +
    '<span class="tprev">' + icon('i-dots', 's18') + '<b>المزيد</b></span></div>';

  return bar('الإعدادات', { back: true }) +
  '<div class="view">' + ground() +

    /* ---------- الشريط ---------- */
    '<div class="c">' +
      '<div class="h"><b>شريط التنقّل</b>' +
        (custom ? '<button class="btn g sm" data-a="tabreset">' +
          icon('i-reset', 's16') + 'الترتيب الأوّل</button>' : '') + '</div>' +
      preview +
      '<div class="tiny dim2" style="margin:10px 0 8px">' +
        'اختر ثلاثًا تظهر في الشريط. والباقي في «المزيد».' +
        '<br>وإن كانت المواضعُ ممتلئةً خرج الأقدمُ ودخل الجديد.</div>' +
      '<div class="tpicks">' + cat.map(x => {
        const on = cur.indexOf(x.k) >= 0;
        return '<button class="tpick' + (on ? ' on' : '') + '" data-a="tabpick" data-v="' + x.k + '" ' +
          'aria-pressed="' + (on ? 'true' : 'false') + '">' +
          icon(x.i, 's18') + '<b>' + x.l + '</b>' +
          (on ? '<i class="tn">' + AR(cur.indexOf(x.k) + 1) + '</i>' : '') + '</button>';
      }).join('') + '</div>' +
    '</div>' +

    /* ---------- اللغة ---------- */
    '<div class="c">' +
      '<div class="h"><b>اللغة</b></div>' +
      '<div class="langrow">' + Object.keys(LANGS).map(k =>
        '<button class="lgbtn' + (langOf() === k ? ' on' : '') + '" data-a="lang" data-v="' + k + '" ' +
          'lang="' + k + '">' +
          '<b>' + E(langName(k)) + '</b>' +
          (langName(k) === LANGS[k].ar ? '' : '<span>' + E(LANGS[k].ar) + '</span>') +
        '</button>').join('') + '</div>' +
    '</div>' +

    /* ---------- الحساب ---------- */
    '<div class="c">' +
      '<div class="h"><b>الحساب</b></div>' +
      '<button class="prow" data-a="go" data-n="profile">' + avat(u) +
        '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(u.code) + '</span></span>' +
        icon('i-back', 's16') + '</button>' +
      '<button class="prow" data-a="place">' + icon('i-pin', 's20') +
        '<span class="nm sp"><b>موقعي</b><span>' +
        (S.myPlace === 'hq' ? 'داخل المقر' : 'في الموقع') + '</span></span>' +
        icon('i-back', 's16') + '</button>' +
      '<button class="prow" data-a="go" data-n="admin">' + icon('i-gear', 's20') +
        '<span class="nm sp"><b>شاشة التحكم</b></span>' + icon('i-back', 's16') + '</button>' +
      '<button class="prow danger" data-a="logout">' + icon('i-out', 's20') +
        '<span class="nm sp"><b>تسجيل الخروج</b></span></button>' +
    '</div>' +

    '<div class="appver">' + APP_VER + '</div>' +
  '</div>' + tabs();
}
