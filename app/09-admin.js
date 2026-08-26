/* ============================ شاشة التحكم ============================ */
function screenAdmin() {
  const off = S.clockOffset || 0;
  const tasks = S.tasks.slice().sort((a, b) => a.start - b.start);
  return bar('شاشة التحكم', { back: 1 }) + '<div class="view">' +
    '<div class="note b">' + icon('i-info','s16') +
      '<span>هذه الشاشة للتجربة فقط وليست جزءًا من أدوار العمل. كل ما تغيّره هنا ينعكس فورًا على التطبيق.</span></div>' +

    '<div class="admcard"><div class="lbl">الوقت</div>' +
      '<div class="row" style="margin:10px 0"><span class="sm">الوقت الحالي في التطبيق</span>' +
        '<b>' + t12(now()) + ' · ' + hijri(now()) + '</b></div>' +
      '<div class="row sm" style="margin-bottom:10px"><span>الإزاحة</span><b>' +
        (off === 0 ? 'بلا إزاحة' : (off > 0 ? '+' : '−') + AR(Math.abs(off)) + ' دقيقة') + '</b></div>' +
      '<div class="grid3">' +
        '<button class="btn l sm" data-a="clock" data-v="-60">‏−ساعة</button>' +
        '<button class="btn l sm" data-a="clock" data-v="0">تصفير</button>' +
        '<button class="btn l sm" data-a="clock" data-v="60">+ساعة</button></div>' +
      '<div class="grid3" style="margin-top:8px">' +
        '<button class="btn l sm" data-a="clock" data-v="-15">‏−١٥د</button>' +
        '<button class="btn l sm" data-a="clock" data-v="15">+١٥د</button>' +
        '<button class="btn l sm" data-a="clock" data-v="240">+٤ ساعات</button></div>' +
      '<div class="tiny" style="margin-top:9px;opacity:.75">تقديم الوقت يفتح نوافذ التحضير ويُطلق التنبيهات الزمنية.</div></div>' +

    '<div class="admcard"><div class="lbl">الموقع</div>' +
      '<div class="row sm" style="margin:10px 0"><span>موقعي الحالي</span>' +
        '<b>' + (S.myPlace === 'site' ? 'داخل موقع المهمة' : 'خارج النطاق') + '</b></div>' +
      '<div class="grid2">' +
        '<button class="btn ' + (S.myPlace === 'site' ? 'p' : 'l') + ' sm" data-a="setplace" data-v="site">داخل الموقع</button>' +
        '<button class="btn ' + (S.myPlace !== 'site' ? 'p' : 'l') + ' sm" data-a="setplace" data-v="away">خارج النطاق</button></div>' +
      '<div class="tiny" style="margin-top:9px;opacity:.75">للعرض فقط — إثبات الحضور غير مقيَّد بالموقع في نسخة التجربة.</div></div>' +

    '<div class="admcard"><div class="lbl">المهام</div>' +
      '<button class="btn p sm" style="margin:10px 0" data-a="addtask">' + icon('i-plus','s16') + 'إضافة مهمة جديدة</button>' +
      '<div class="col">' + tasks.map(t => {
        const L = userById(t.leaderId);
        return '<div style="background:#132833;border-radius:14px;padding:12px">' +
          '<div class="row"><b class="sm">' + E(t.title) + '</b>' + pill(STATUS[t.status].t, STATUS[t.status].c) + '</div>' +
          '<div class="tiny" style="opacity:.7;margin:4px 0 9px">' + E(L.name) + ' · ' + E(t.kt) + ' · ' + E(orgOf(t).type) +
            ' · ' + hijri(t.start) + ' ' + t12(t.start) + '</div>' +
          '<div class="grid3">' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="-60">‏−ساعة</button>' +
            '<button class="btn l sm" data-a="edittask" data-id="' + t.id + '">تعديل</button>' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="60">+ساعة</button></div>' +
          '<div class="grid2" style="margin-top:8px">' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="-1440">أمس</button>' +
            '<button class="btn l sm" data-a="shift" data-id="' + t.id + '" data-v="1440">غدًا</button></div>' +
          '</div>';
      }).join('') + '</div></div>' +

    '<div class="admcard"><div class="lbl">إعادة الضبط</div>' +
      '<div class="tiny" style="margin:9px 0;opacity:.75">تحذف كل التسكينات والردود والتنبيهات والتذاكر والتقارير وتعيد البيانات إلى حالتها الأولى.</div>' +
      '<button class="btn d" data-a="askreset">' + icon('i-reset','s16') + 'إعادة ضبط كل شيء</button></div>' +

    '<div class="admcard"><div class="lbl">لمحة</div>' +
      '<div class="row sm" style="margin-top:8px"><span>المستخدمون</span><b>' + AR(S.users.length) + '</b></div>' +
      '<div class="row sm"><span>المهام</span><b>' + AR(S.tasks.length) + '</b></div>' +
      '<div class="row sm"><span>التذاكر</span><b>' + AR(S.tickets.length) + '</b></div>' +
      '<div class="row sm"><span>التقارير</span><b>' + AR(S.reports.length) + '</b></div>' +
      '<div class="row sm"><span>التنبيهات</span><b>' + AR(S.notifs.length) + '</b></div></div>' +
    '</div>' + tabs();
}

function editTaskSheet(t) {
  const d = new Date(t.start);
  const dv = d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  const tv = two(d.getHours()) + ':' + two(d.getMinutes());
  return '<div class="grip"></div><h3>تعديل «' + E(t.title) + '»</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(userById(t.leaderId).name) + ' · ' + E(t.kt) + '</div>' +
    '<div class="lbl plain">التاريخ</div>' +
    '<div class="field" style="margin:8px 0"><input type="date" id="ed" value="' + dv + '"></div>' +
    '<div class="lbl plain">وقت البداية</div>' +
    '<div class="field" style="margin:8px 0"><input type="time" id="et" value="' + tv + '"></div>' +
    '<div class="lbl plain">المدة بالساعات</div>' +
    '<div class="field" style="margin:8px 0"><input type="number" id="eh" min="1" max="24" value="' + t.durH + '"></div>' +
    '<div class="grid2" style="margin-top:14px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="savetask" data-id="' + t.id + '">حفظ</button></div>';
}

function addTaskSheet() {
  const leaders = S.users.filter(u => u.role === 'leader');
  const d = new Date(now() + 3 * HR);
  return '<div class="grip"></div><h3>إضافة مهمة جديدة</h3>' +
    '<div class="lbl plain">النشاط</div>' +
    '<div class="field" style="margin:8px 0"><select id="ak">' +
      Object.entries(CAT).map(([k, c]) => '<option value="' + k + '">' + c.ar + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">القائد</div>' +
    '<div class="field" style="margin:8px 0"><select id="al">' +
      leaders.map(l => '<option value="' + l.id + '">' + l.name + ' — ' + l.kt + ' (' + ORGS.find(o=>o.id===l.orgId).type + ')</option>').join('') + '</select></div>' +
    '<div class="lbl plain">التاريخ</div>' +
    '<div class="field" style="margin:8px 0"><input type="date" id="ad" value="' + d.getFullYear() + '-' + two(d.getMonth()+1) + '-' + two(d.getDate()) + '"></div>' +
    '<div class="lbl plain">الوقت</div>' +
    '<div class="field" style="margin:8px 0"><input type="time" id="at" value="' + two(d.getHours()) + ':' + two(d.getMinutes()) + '"></div>' +
    '<div class="grid2" style="margin-top:14px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="createtask">إضافة</button></div>';
}

/* ============================ أوراق عامة ============================ */
function textSheet(title, sub, action, extra, ph) {
  return '<div class="grip"></div><h3>' + E(title) + '</h3>' +
    (sub ? '<div class="tiny dim2" style="margin-bottom:12px">' + E(sub) + '</div>' : '') +
    (extra || '') +
    '<div class="field" style="margin:10px 0"><input id="txt" placeholder="' + E(ph || 'اكتب هنا…') + '"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" ' + action + '>إرسال</button></div>';
}

function reportSheet(taskId) {
  const L = isLeader();
  const tasks = myTasks();
  return '<div class="grip"></div><h3>رفع تقرير</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + (L ? 'يُرفع إلى غرفة العمليات — الكونترول' : 'يُرفع إلى قائد فريقك') + '</div>' +
    '<div class="lbl plain">التصنيف</div>' +
    '<div class="field" style="margin:8px 0"><select id="rc">' + RCATS.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">المهمة</div>' +
    '<div class="field" style="margin:8px 0"><select id="rt"><option value="">بدون ربط بمهمة</option>' +
      tasks.map(t => '<option value="' + t.id + '"' + (t.id === taskId ? ' selected' : '') + '>' + t.title + ' — ' + hijri(t.start) + '</option>').join('') + '</select></div>' +
    '<div class="lbl plain">العنوان</div>' +
    '<div class="field" style="margin:8px 0"><input id="rti" placeholder="عنوان مختصر"></div>' +
    '<div class="lbl plain">التفاصيل</div>' +
    '<div class="field" style="margin:8px 0"><input id="rb" placeholder="اشرح الحالة"></div>' +
    '<div class="grid2" style="margin-top:12px">' +
      '<button class="btn g" data-a="close">إلغاء</button>' +
      '<button class="btn p" data-a="sendreport">رفع التقرير</button></div>';
}

function flagSheet(t, g, p) {
  const opts = ['مريض','حالة حرجة','نُقل للمستشفى','كرسي متحرك','متخلّف عن المجموعة','مفقود','وفاة','بلا ملاحظة'];
  return '<div class="grip"></div><h3>بلاغ عن حاج</h3>' +
    '<div class="fl" style="margin:10px 0 14px">' +
      '<span class="av ' + p.av + '"><svg viewBox="0 0 44 44"><use href="#av-' + p.g + '"/></svg></span>' +
      '<span class="nm sp"><b>' + E(p.name) + '</b><span>' + E(p.pp) + ' · غرفة ' + AR(p.room) + '</span></span></div>' +
    '<div class="col">' + opts.map(o => '<button class="prow" data-a="doflag" data-id="' + t.id + '" data-g="' + g.id +
      '" data-p="' + p.id + '" data-v="' + o + '"><span class="sp b">' + o + '</span>' +
      (p.flag === o ? icon('i-checkc','s16') : icon('i-back','s16')) + '</button>').join('') + '</div>' +
    (p.note ? '<div class="note a" style="margin-top:10px">' + icon('i-edit','s16') + '<span>' + E(p.note) + '</span></div>' : '') +
    '<button class="btn l" style="margin-top:10px" data-a="pnote" data-id="' + t.id + '" data-g="' + g.id + '" data-p="' + p.id + '">' + icon('i-edit','s16') + 'كتابة ملاحظة أخرى</button>' +
    '<div class="tiny dim2" style="margin-top:10px">يُسجَّل البلاغ والملاحظة في تقاريرك وفي سجل المهمة.</div>' +
    '<button class="btn g" style="margin-top:10px" data-a="close">إغلاق</button>';
}

function histSheet(t) {
  return '<div class="grip"></div><h3>سجل المهمة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(t.title) + ' · ' + AR(t.history.length) + ' حدثًا</div>' +
    '<div class="col">' + t.history.map(h =>
      '<div class="c"><div class="sm">' + E(h.text) + '</div>' +
      '<div class="tiny dim2" style="margin-top:4px">' + t12(h.at) + ' · ' + hijri(h.at) + '</div></div>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

function ticketStateSheet(k) {
  const opts = ['مفتوحة','قيد المعالجة','مُصعّدة','مغلقة'];
  return '<div class="grip"></div><h3>تغيير حالة التذكرة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(k.title) + '</div>' +
    '<div class="col">' + opts.map(o => '<button class="prow" data-a="dostate" data-id="' + k.id + '" data-v="' + o + '">' +
      '<span class="sp b">' + o + '</span>' + (k.status === o ? icon('i-checkc','s16') : icon('i-back','s16')) + '</button>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

function ticketAssignSheet(k) {
  const team = teamOf(k.leaderId);
  return '<div class="grip"></div><h3>إسناد التذكرة</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">' + E(k.title) + '</div>' +
    '<div class="col">' + team.map(u => '<button class="prow" data-a="doassign" data-id="' + k.id + '" data-u="' + u.id + '">' +
      avat(u) + '<span class="nm sp"><b>' + E(u.name) + '</b><span>' + E(u.specialty) + '</span></span>' +
      (k.assignedTo === u.id ? icon('i-checkc','s16') : pill('إسناد','live')) + '</button>').join('') + '</div>' +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

function placeSheet() {
  return '<div class="grip"></div><h3>تحديد موقعي</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">وضع التجربة — اختر أي موقع، ولن يمنعك النظام من إثبات الحضور.</div>' +
    '<div class="col">' +
      '<button class="prow" data-a="setplace" data-v="site"><span class="ico" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#E4F2E9;color:#0B6540">' + icon('i-target','s18') + '</span>' +
        '<span class="nm sp"><b>داخل موقع المهمة</b><span>على بُعد ٤٠٠ متر</span></span>' + (S.myPlace === 'site' ? icon('i-checkc','s16') : '') + '</button>' +
      '<button class="prow" data-a="setplace" data-v="away"><span class="ico" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#FBE9E7;color:#93261C">' + icon('i-pin','s18') + '</span>' +
        '<span class="nm sp"><b>خارج النطاق</b><span>على بُعد ٢.٦ كم</span></span>' + (S.myPlace !== 'site' ? icon('i-checkc','s16') : '') + '</button>' +
    '</div><button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}

function confirmSheet(title, body, action, danger) {
  return '<div class="grip"></div><h3>' + E(title) + '</h3>' +
    '<div class="sm dim" style="margin:8px 0 14px">' + E(body) + '</div>' +
    '<div class="grid2"><button class="btn g" data-a="close">تراجع</button>' +
    '<button class="btn ' + (danger ? 'd' : 'p') + '" ' + action + '>تأكيد</button></div>';
}

/* اختيار مجموعة شاغرة لإسناد مهمة لمحسن معيّن */
function assignToSheet(uid_) {
  const u = userById(uid_);
  const rows = [];
  S.tasks.filter(t => t.leaderId === S.session.id && !['done', 'cancelled'].includes(t.status))
    .sort((a, b) => a.start - b.start)
    .forEach(t => t.groups.filter(g => !g.muhsenId).forEach(g => {
      const busy = busyIn(uid_, t);
      const taken = t.groups.some(x => x.muhsenId === uid_);
      rows.push({ t, g, blocked: !!busy || taken,
        why: taken ? 'مسكَّن على مجموعة أخرى في هذه المهمة' : busy ? 'مرتبط بـ«' + busy.title + '» في وقت متداخل' : '' });
    }));
  return '<div class="grip"></div><h3>إسناد مهمة إلى ' + E(u.name) + '</h3>' +
    '<div class="tiny dim2" style="margin-bottom:12px">المجموعات الشاغرة في مهامك</div>' +
    (rows.length ? '<div class="col">' + rows.map(r =>
      '<button class="prow" ' + (r.blocked ? 'disabled style="opacity:.5"'
        : 'data-a="send" data-id="' + r.t.id + '" data-g="' + r.g.id + '" data-u="' + uid_ + '"') + '>' +
        '<span class="thumb" style="width:42px;height:42px;background-image:url(' + IMG[r.t.photo + '_t'] + ')"></span>' +
        '<span class="nm sp"><b>' + E(r.t.title) + '</b><span>مجموعة ' + AR(r.g.no) + ' · ' +
        hijri(r.t.start) + ' ' + t12(r.t.start) + (r.why ? ' · ' + r.why : '') + '</span></span>' +
        (r.blocked ? pill('غير متاح', 'no') : pill('إرسال طلب', 'live')) + '</button>').join('') + '</div>'
      : '<div class="c center dim sm">لا توجد مجموعات شاغرة</div>') +
    '<button class="btn g" style="margin-top:12px" data-a="close">إغلاق</button>';
}
