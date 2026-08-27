/* ============================ مركز الطلبات — للدورين ============================ */
const REQST = { pending:['بانتظار الرد','wait'], accepted:['مقبول','live'],
  rejected:['مرفوض','no'], withdrawn:['مسحوب','grey'] };

function reqCardFull(r, actionable) {
  const t = reqTask(r);
  const from = userById(r.from), to = userById(r.to);
  if (!from || !to) return '';
  const st = REQST[r.state] || [r.state, 'grey'];
  const urgent = r.state === 'pending' && t && t.start - now() < 3 * HR && t.start > now();
  const phone = to.phone ? to.phone.replace(/[^0-9]/g, '') : '';

  return '<div class="c ' + (urgent ? 'urgent' : '') + '">' +
    '<div class="row"><b style="font-size:14px">طلب ' + E(r.kind) + '</b>' + pill(st[0], st[1]) + '</div>' +

    '<div class="flow2">' +
      '<span class="who">' + avat(from, 'sm') + '<span class="tiny"><b>' + E(from.name) + '</b>' +
        '<span class="dim2">من · ' + (from.role === 'leader' ? 'ليدر' : 'مُحسن') + '</span></span></span>' +
      '<span class="arrow">' + icon('i-back','s16') + '</span>' +
      '<span class="who">' + avat(to, 'sm') + '<span class="tiny"><b>' + E(to.name) + '</b>' +
        '<span class="dim2">إلى · ' + (to.role === 'leader' ? 'ليدر' : 'مُحسن') + '</span></span></span>' +
    '</div>' +

    (t ? '<button class="fl reqtask" data-a="go" data-n="task" data-id="' + t.id + '">' +
        '<span class="thumb" style="width:40px;height:40px;background-image:url(' + IMG[t.photo + '_t'] + ')"></span>' +
        '<span class="sp" style="text-align:right"><b class="tiny" style="display:block">' + E(t.title) + '</b>' +
        '<span class="tiny dim2">' + hijri(t.start) + ' · ' + t12(t.start) + '</span></span>' + icon('i-back','s16') + '</button>' : '') +

    '<div class="row tiny dim2" style="margin-top:9px">' +
      '<span>أُرسل ' + t12(r.at) + ' · ' + hijri(r.at) + '</span>' +
      (r.respAt ? '<span>الرد ' + t12(r.respAt) + '</span>' : '<span>' + ago(r.at) + '</span>') + '</div>' +

    (r.note ? '<div class="note a" style="margin-top:9px">' + icon('i-edit','s16') +
      '<span>ملاحظة المرسِل: ' + E(r.note) + '</span></div>' : '') +
    (r.respNote ? '<div class="note ' + (r.state === 'rejected' ? 'r' : 'g') + '" style="margin-top:8px">' +
      icon('i-info','s16') + '<span>رد المستقبِل: ' + E(r.respNote) + '</span></div>' : '') +
    (r.respPhoto ? excuseChip(r.respPhoto) : '') +
    (urgent ? '<div class="strip r">' + icon('i-warn','s16') + '<span>بقي أقل من ٣ ساعات على المهمة</span></div>' : '') +

    (actionable && r.state === 'pending' && t ? (
      r.kind === 'تسكين'
        ? '<div class="grid2" style="margin-top:10px">' +
          '<button class="btn d sm" data-a="resp" data-id="' + t.id + '" data-v="0">رفض</button>' +
          '<button class="btn p sm" data-a="resp" data-id="' + t.id + '" data-v="1">قبول</button></div>'
        : '<div class="grid2" style="margin-top:10px">' +
          '<button class="btn d sm" data-a="rdeleg" data-id="' + t.id + '" data-v="0">رفض</button>' +
          '<button class="btn p sm" data-a="rdeleg" data-id="' + t.id + '" data-v="1">قبول</button></div>') : '') +

    (!actionable && r.state === 'pending' && r.from === S.session.id && t && !lockedForAssign(t) ?
      '<div class="grid3" style="margin-top:10px">' +
        (phone ? '<a class="btn l sm" href="tel:' + phone + '">' + icon('i-phone','s16') + 'اتصال</a>' +
                 '<a class="btn l sm" href="https://wa.me/' + phone + '" target="_blank" rel="noopener">' + icon('i-send','s16') + 'واتساب</a>' : '') +
        '<button class="btn d sm" data-a="withdraw" data-id="' + t.id + '" data-u="' + r.to + '">' + icon('i-x','s16') + 'سحب</button>' +
      '</div>' : '') +
  '</div>';
}

function screenReqCenter() {
  const uid_ = S.session.id;
  const all = S.requests.slice();
  const inbox = all.filter(r => r.to === uid_ && r.state === 'pending');
  const sent = all.filter(r => r.from === uid_);
  const recv = all.filter(r => r.to === uid_);
  const done = all.filter(r => (r.from === uid_ || r.to === uid_) && r.state !== 'pending');
  const mine = all.filter(r => r.from === uid_ || r.to === uid_);
  const seg = S.tab.rq || (inbox.length ? 'inbox' : 'sent');
  const list = seg === 'inbox' ? inbox : seg === 'sent' ? sent : seg === 'recv' ? recv
    : seg === 'done' ? done : mine;

  return bar('الطلبات') + '<div class="view">' + ground() +
    '<div class="grid3">' +
      '<div class="kpi"><b style="color:var(--amber)">' + AR(inbox.length) + '</b><span>بانتظار ردي</span></div>' +
      '<div class="kpi"><b>' + AR(sent.length) + '</b><span>مرسلة</span></div>' +
      '<div class="kpi"><b style="color:var(--dim)">' + AR(done.length) + '</b><span>منتهية</span></div></div>' +

    '<div class="seg">' +
      [['inbox','بانتظار ردي'],['sent','المرسلة'],['recv','المستقبلة'],['done','المنتهية'],['all','الكل']]
        .map(x => '<button class="' + (seg === x[0] ? 'on' : '') + '" data-a="seg" data-k="rq" data-v="' + x[0] + '">' + x[1] + '</button>').join('') +
    '</div>' +

    (list.length ? list.map(r => reqCardFull(r, r.to === uid_ && r.state === 'pending')).join('')
      : '<div class="c center" style="padding:26px"><b>لا توجد طلبات في هذا التصنيف</b>' +
        '<div class="sm dim" style="margin-top:6px">' +
          (isLeader() ? 'ابدأ التسكين من شاشة المهام.' : 'ستصلك طلبات الليدر هنا.') + '</div>' +
        (isLeader() ? '<button class="btn l sm" style="margin-top:12px" data-a="go" data-n="tasks">' +
          icon('i-tasks','s16') + 'فتح المهام</button>' : '') + '</div>') +
    '</div>' + tabs();
}
