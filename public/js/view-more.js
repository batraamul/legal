/* js/view-more.js — Hearings, Orders & Compliance, Notices & RTI, Counsel & Fees, Ready Reference, Reports */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, M = LR.rules, R = LR.refs, e = U.esc, I = LR.icon;
  const V = LR.views;
  const st = () => LR.app.state;
  const D = () => LR.store.data;
  const head = (...a) => V.head(...a);
  const sheet = (rows) => '<div class="sheet">' + rows.filter((r) => r[1]).map(([k, v]) => '<div class="k">' + k + '</div><div>' + v + '</div>').join('') + '</div>';

  /* ================= HEARINGS ================= */
  function hearingsOn(k) {
    const out = [];
    for (const c of D().cases) {
      if (c.nextDate === k && M.isOpen(c)) out.push({ c, next: true });
      for (const h of c.hearings || []) if (h.date === k && !(c.nextDate === k && M.isOpen(c))) out.push({ c, h });
    }
    return out;
  }
  V.hearings = {
    label: 'Hearings', icon: 'calendar',
    count: () => ({ n: D().cases.filter((c) => M.isOpen(c) && c.nextDate && U.fromToday(c.nextDate) >= 0 && U.fromToday(c.nextDate) <= 7).length }),
    left() {
      const T = U.today(), m0 = st().calMonth || T.slice(0, 8) + '01', d0 = U.parse(m0);
      const first = new Date(d0.getFullYear(), d0.getMonth(), 1), start = U.addDays(U.key(first), -((first.getDay() + 6) % 7));
      let h = head('Hearing Calendar', 'Next dates of every case, and hearings already held', '<button class="btn" data-act="cal-today">Today</button>');
      h += '<div class="cal-head"><span class="m">' + U.MONTHS[d0.getMonth()] + ' ' + d0.getFullYear() + '</span><button class="icon-btn" data-act="cal-move" data-v="-1">' + I('left') + '</button><button class="icon-btn" data-act="cal-move" data-v="1">' + I('right') + '</button></div>';
      h += '<div class="cal">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => '<div class="wd">' + w + '</div>').join('');
      for (let i = 0; i < 42; i++) {
        const k = U.addDays(start, i), d = U.parse(k), list = hearingsOn(k);
        if (i === 35 && d.getMonth() !== d0.getMonth()) break;
        h += '<div class="d' + (d.getMonth() !== d0.getMonth() ? ' out' : '') + (k === T ? ' today' : '') + (k === st().calDay ? ' sel' : '') + (d.getDay() === 0 ? ' sun' : '') + (list.length ? ' has' : '') + '" data-act="cal-day" data-v="' + k + '"><span class="n">' + d.getDate() + '</span>' +
          list.slice(0, 3).map((x) => '<span class="e" style="--c:' + (x.next ? (x.c.contempt ? 'var(--over)' : 'var(--up)') : 'var(--ink3)') + '">' + e(M.caseNo(x.c)) + '</span>').join('') + (list.length > 3 ? '<span class="more">+' + (list.length - 3) + ' more</span>' : '') + '</div>';
      }
      h += '</div><div class="legend" style="margin-top:8px"><span><i style="--c:var(--up)"></i>Next date</span><span><i style="--c:var(--over)"></i>Contempt</span><span><i style="--c:var(--ink3)"></i>Hearing held</span></div>';
      return h;
    },
    right() {
      const k = st().calDay || U.today(), list = hearingsOn(k);
      let h = head('Cause List', U.fmt(k, true), '<button class="btn" data-act="print-cause" data-v="' + k + '">' + I('print') + 'Print</button>');
      if (!list.length) h += '<div class="empty">No hearing on this day.</div>';
      for (const x of list) {
        const c = x.c, cn = M.counsel(c.counselId);
        h += '<div class="cl-item" data-act="open-case" data-id="' + c.id + '"><div><b style="font-family:var(--serif);color:var(--accent)">' + e(M.caseNo(c)) + '</b> <span class="muted small">· ' + e(M.courtShort(c)) + '</span><div class="small">' + e(M.vs(c)) + '</div><div class="p">' +
          (x.next ? e(c.nextPurpose || 'Purpose not recorded') + (cn ? ' · ' + e(cn.name) : '') : 'Held — ' + e(x.h.proceedings || x.h.purpose || '')) + '</div></div><div>' +
          (x.next ? (k < U.today() ? '<button class="btn sm" data-act="add-hearing" data-id="' + c.id + '">Record outcome</button>' : '<span class="badge b-up">Listed</span>') : '<span class="badge">Held</span>') + '</div></div>';
      }
      const T = U.today(), next = D().cases.filter((c) => M.isOpen(c) && c.nextDate && c.nextDate > k && U.diff(T, c.nextDate) <= 30).sort(U.by('nextDate'));
      h += '<h3 class="sec">The next 30 days <span class="c">' + next.length + '</span></h3>';
      const groups = {};
      for (const c of next) (groups[c.nextDate] = groups[c.nextDate] || []).push(c);
      h += Object.keys(groups).length ? Object.entries(groups).map(([d, l]) => V.causeDay(d, l)).join('') : '<div class="empty">None.</div>';
      return h;
    },
  };

  /* ================= ORDERS & COMPLIANCE ================= */
  function orderRows(all) {
    const rows = [];
    for (const c of D().cases) for (const o of c.orders || []) {
      if (!all && !M.orderOpen(o)) continue;
      const L = M.adverse(o) && o.kind !== 'Interim order' ? M.limitation(c, o) : null;
      const lim = L && L.key !== 'none' ? (L.last || L.target) : null;
      const next = [o.complianceDue && M.orderOpen(o) ? o.complianceDue : null, lim && M.orderOpen(o) && o.action !== 'Comply' ? lim : null].filter(Boolean).sort()[0] || null;
      if (!all && !next && !o.direction) continue;
      rows.push({ c, o, L, lim, next });
    }
    rows.sort((a, b) => (a.next || '9999') < (b.next || '9999') ? -1 : 1);
    return rows;
  }
  V.orders = {
    label: 'Orders & Compliance', icon: 'order',
    count: () => { const n = orderRows(false).filter((r) => r.next && U.fromToday(r.next) <= 30).length; return { n, hot: orderRows(false).some((r) => r.next && U.fromToday(r.next) < 0) }; },
    left() {
      const all = st().ordersAll, rows = orderRows(all);
      let h = head('Orders &amp; Compliance', 'Time-bound directions and last dates for appeal — so no order turns into contempt');
      h += '<div class="chips"><button class="chip ' + (!all ? 'on' : '') + '" data-act="orders-all" data-v="">Needing action</button><button class="chip ' + (all ? 'on' : '') + '" data-act="orders-all" data-v="1">All orders</button></div>';
      if (!rows.length) return h + '<div class="empty">No order needs action.</div>';
      h += '<table class="tbl"><tr><th>Case / order</th><th>Direction</th><th>Comply by</th><th>Appeal by</th></tr>' + rows.map(({ c, o, L, lim }) => {
        const cd = o.complianceDue ? U.fromToday(o.complianceDue) : null, ld = lim ? U.fromToday(lim) : null;
        const tag = (n, open) => n == null ? '' : '<div><span class="badge ' + (!open ? 'b-done' : n < 0 ? 'b-over' : n <= 7 ? 'b-crit' : n <= 30 ? 'b-soon' : 'b-up') + '">' + (!open ? 'done' : M.whenText(n)) + '</span></div>';
        return '<tr data-act="edit-order" data-id="' + c.id + '" data-sub="' + o.id + '"><td><b style="font-family:var(--serif);color:var(--accent)">' + e(M.caseNo(c)) + '</b><div class="muted small">' + e(M.courtShort(c)) + ' · ' + U.fmt(o.date) + '</div>' + (o.result ? '<div><span class="badge ' + (M.adverse(o) ? 'b-over' : 'b-done') + '">' + e(o.result) + '</span></div>' : '') + '</td>' +
          '<td>' + e(o.direction || o.summary || '') + '<div class="muted small">' + e(o.action || '') + '</div></td>' +
          '<td class="num">' + (o.complianceDue ? U.fmt(o.complianceDue) + tag(cd, M.orderOpen(o)) : '—') + '</td>' +
          '<td class="num">' + (lim ? U.fmt(lim) + (L.last ? '' : '<div class="muted small">target</div>') + tag(ld, M.orderOpen(o) && o.action !== 'Comply') + '<div class="muted small">' + e(L.r.label.split(' (')[0]) + '</div>' : '—') + '</td></tr>';
      }).join('') + '</table>';
      return h;
    },
    right() {
      let h = head('Limitation Calculator', 'Last date to file, from the date of an order') + V.calc();
      const open = D().cases.filter(M.isOpen);
      const cps = open.filter((c) => c.contempt), stays = open.filter((c) => c.stay);
      h += '<h3 class="sec">Contempt watch <span class="c">' + cps.length + '</span></h3>' + (cps.length ? cps.map((c) => '<div class="cl-item" data-act="open-case" data-id="' + c.id + '"><div><b style="font-family:var(--serif);color:var(--over)">' + e(M.caseNo(c)) + '</b> <span class="muted small">· ' + e(M.courtShort(c)) + '</span><div class="small">' + e(c.subject || M.vs(c)) + '</div></div><div class="when">' + (c.nextDate ? U.fmtShort(c.nextDate) + '<small>' + U.rel(c.nextDate) + '</small>' : '') + '</div></div>').join('') : '<div class="empty">No contempt matter pending.</div>');
      h += '<h3 class="sec">Interim orders in force <span class="c">' + stays.length + '</span></h3>' + (stays.length ? stays.map((c) => '<div class="cl-item" data-act="open-case" data-id="' + c.id + '"><div><b style="font-family:var(--serif);color:var(--accent)">' + e(M.caseNo(c)) + '</b><div class="small">' + e(c.stayText || 'Interim order') + '</div></div><div class="when">' + (c.nextDate ? U.fmtShort(c.nextDate) : '') + '</div></div>').join('') : '<div class="empty">None.</div>');
      return h;
    },
  };

  V.calc = () => {
    const c = st().calc || (st().calc = { remedy: 'slp', date: U.today(), copy: '', excl: 0 });
    const r = R.REMEDIES[c.remedy];
    let res = '';
    if (r && r.days) {
      const base = r.from === 'copy' ? (c.copy || c.date) : c.date;
      if (base) {
        let last = c.remedy === 'arb-34' ? U.addMonths(base, 3) : U.addDays(base, r.days);
        if (c.excl) last = U.addDays(last, +c.excl);
        const n = U.fromToday(last);
        res = '<div class="res"><span class="small muted">Last date</span><b>' + U.fmt(last, true) + '</b><span class="badge ' + (n < 0 ? 'b-over' : n <= 7 ? 'b-crit' : n <= 30 ? 'b-soon' : 'b-up') + '">' + M.whenText(n) + '</span>' +
          '<div class="law" style="margin-top:6px">' + e(r.law) + '</div><div class="small muted" style="margin-top:4px">If the last day falls when the court is closed, it may be filed on the day it reopens (Limitation Act, s.4). Delay can only be condoned on sufficient cause (s.5) — do not plan on it.</div></div>';
      }
    } else if (r) res = '<div class="res"><div class="small">' + e(r.law || 'No appeal: comply within the time the order gives.') + '</div></div>';
    return '<div class="calc"><div class="form">' +
      '<label class="f full">Remedy<select class="field" data-change="calc" data-k="remedy">' + Object.entries(R.REMEDIES).map(([k, x]) => '<option value="' + k + '"' + (k === c.remedy ? ' selected' : '') + '>' + e(x.label) + '</option>').join('') + '</select></label>' +
      '<label class="f">Date of order<input class="field" type="date" value="' + e(c.date) + '" data-change="calc" data-k="date"></label>' +
      '<label class="f">Copy received on<input class="field" type="date" value="' + e(c.copy) + '" data-change="calc" data-k="copy"></label>' +
      '<label class="f full">Days to exclude (time taken for certified copy, s.12)<input class="field" type="number" min="0" value="' + e(c.excl || '') + '" data-change="calc" data-k="excl" placeholder="0"></label>' +
      '</div>' + res + '</div>';
  };

  /* ================= ADVISORY & VETTING (with legal notices and follow-ups) ================= */
  const mOpen = (m) => !R.MATTER_DONE.includes(m.status);
  V.matterRow = (m) => {
    const n = m.dueOn ? U.fromToday(m.dueOn) : null, open = mOpen(m);
    return '<div class="rrow ' + (st().matterId === m.id ? 'sel' : '') + '" data-act="open-matter" data-id="' + m.id + '"><div style="min-width:0"><div class="no">' + e(m.type) + (m.ref ? ' <span class="muted" style="font:500 11.5px var(--sans)">· ' + e(m.ref) + '</span>' : '') + '</div>' +
      '<div class="ti">' + e(m.subject || '') + '</div><div class="mt">' + (m.region ? '<span>' + e(m.region) + '</span>' : '') + (m.fromOffice ? '<span>' + e(m.fromOffice) + '</span>' : '') +
      (m.priority === 'high' && open ? '<span class="badge b-acc">High</span>' : '') + (m.status === 'Referred to DoLA' ? '<span class="badge b-watch">With DoLA</span>' : '') + (m.sample ? '<span class="badge">Example</span>' : '') + '</div></div>' +
      '<div class="rt">' + (open && m.dueOn && m.status !== 'Referred to DoLA' ? '<span class="when">' + U.fmtShort(m.dueOn) + '<small style="' + (n < 0 ? 'color:var(--over)' : '') + '">' + U.rel(m.dueOn) + '</small></span>' : '') +
      '<span class="badge ' + (open ? (m.status === 'Clarification sought' ? 'b-soon' : 'b-up') : 'b-done') + '">' + e(m.status) + '</span></div></div>';
  };
  V.notices = {
    label: 'Advisory & Vetting', icon: 'scales', subs: [['matters', 'Opinions & vetting'], ['notices', 'Legal notices'], ['tasks', 'Follow-ups']],
    count: () => ({ n: D().matters.filter(mOpen).length + D().notices.filter((n) => n.status === 'Open').length }),
    left(sub) {
      if (sub === 'tasks') {
        const list = D().tasks.slice().sort((a, b) => (a.done - b.done) || U.by('due')(a, b));
        return head('Follow-ups', 'Things to chase — for a case or in general', '<button class="btn pri" data-act="add-task">' + I('plus') + 'Add</button>') + (list.length ? list.map(V.taskRow).join('') : '<div class="empty">No follow-ups.</div>');
      }
      if (sub === 'notices') {
        const list = D().notices.slice().sort((a, b) => (a.status !== 'Open') - (b.status !== 'Open') || U.by('receivedOn', -1)(a, b));
        let h = head('Legal Notices', 'Legal notices, s.80 CPC notices and court-directed representations', '<button class="btn pri" data-act="new-notice">' + I('plus') + 'New notice</button>');
        if (!list.length) return h + '<div class="empty">No notices.</div>';
        return h + '<div class="reg">' + list.map((n0) => { const n = n0.replyDue ? U.fromToday(n0.replyDue) : null;
          return '<div class="rrow ' + (st().noticeId === n0.id ? 'sel' : '') + '" data-act="open-notice" data-id="' + n0.id + '"><div style="min-width:0"><div class="no">' + e(n0.kind) + '</div><div class="ti">' + e(n0.from || '') + ' — ' + e(n0.subject || '') + '</div><div class="mt"><span>Received ' + U.fmt(n0.receivedOn) + '</span>' + (n0.region ? '<span>' + e(n0.region) + '</span>' : '') + (n0.office ? '<span>' + e(n0.office) + '</span>' : '') + (n0.sample ? '<span class="badge">Example</span>' : '') + '</div></div>' +
            '<div class="rt">' + (n0.status === 'Open' && n0.replyDue ? '<span class="when">' + U.fmtShort(n0.replyDue) + '<small style="' + (n < 0 ? 'color:var(--over)' : '') + '">reply ' + U.rel(n0.replyDue) + '</small></span>' : '') + '<span class="badge ' + (n0.status === 'Open' ? 'b-up' : 'b-done') + '">' + e(n0.status) + '</span></div></div>'; }).join('') + '</div>';
      }
      const f = st().mf || (st().mf = { type: '', show: 'open', region: '' });
      const all = D().matters;
      const list = all.filter((m) => (!f.type || m.type === f.type) && (!f.region || m.region === f.region) && (f.show === 'all' || (f.show === 'open' ? mOpen(m) : !mOpen(m))))
        .sort((a, b) => (mOpen(b) - mOpen(a)) || ((a.dueOn || '9') < (b.dueOn || '9') ? -1 : 1));
      let h = head('Opinions &amp; Vetting', 'LOA / MOU vetting, RTI legal opinions, recruitment and extension, administrative and DoLA matters', '<button class="btn pri" data-act="new-matter">' + I('plus') + 'New matter</button>');
      h += '<div class="chips"><button class="chip ' + (!f.type ? 'on' : '') + '" data-act="mf" data-k="type" data-v="">All work</button>' + R.MATTER_TYPES.filter((t) => all.some((m) => m.type === t[0])).map((t) =>
        '<button class="chip ' + (f.type === t[0] ? 'on' : '') + '" data-act="mf" data-k="type" data-v="' + e(t[0]) + '">' + e(t[2]) + ' <b>' + all.filter((m) => m.type === t[0] && mOpen(m)).length + '</b></button>').join('') + '</div>';
      h += '<div class="filters"><select class="field" data-change="mf-show"><option value="open"' + (f.show === 'open' ? ' selected' : '') + '>Pending</option><option value="done"' + (f.show === 'done' ? ' selected' : '') + '>Disposed of</option><option value="all"' + (f.show === 'all' ? ' selected' : '') + '>All</option></select>' +
        '<select class="field" data-change="mf-region"><option value="">All regions</option>' + M.regions().map((r) => '<option' + (f.region === r ? ' selected' : '') + '>' + e(r) + '</option>').join('') + '</select></div>';
      return h + (list.length ? '<div class="reg">' + list.map(V.matterRow).join('') + '</div>' : '<div class="empty">No matter here.</div>');
    },
    right(sub) {
      if (sub === 'tasks') return head('About follow-ups') + '<div class="hint">Follow-ups with a date appear on the Dashboard from a week before they fall due. Tick them off here or on the Dashboard.</div>';
      if (sub === 'notices') {
        const n0 = st().noticeId && LR.store.get('notices', st().noticeId);
        if (!n0) return head('Notice Details') + V.refBox('Civil');
        const c = n0.caseId && M.caseById(n0.caseId);
        return head(e(n0.kind), 'From ' + e(n0.from || ''), '<button class="btn" data-act="edit-notice" data-id="' + n0.id + '">' + I('edit') + 'Edit</button>') + sheet([
          ['Received', U.fmt(n0.receivedOn)], ['Region', e(n0.region || '')], ['Through advocate', e(n0.advocate || '')], ['Subject', U.nl(n0.subject || '')], ['Demand', e(n0.demand || '')], ['Office', e(n0.office || '')],
          ['Reply due', n0.replyDue ? U.fmt(n0.replyDue) + (n0.status === 'Open' ? ' (' + U.rel(n0.replyDue) + ')' : '') : ''], ['Replied', n0.repliedOn ? U.fmt(n0.repliedOn) + (n0.replyRef ? ' · ' + e(n0.replyRef) : '') : '<span class="muted">not yet</span>'],
          ['Status', e(n0.status)], ['Became case', c ? '<a href="#" data-act="open-case" data-id="' + c.id + '">' + e(M.caseNo(c)) + '</a>' : ''], ['Notes', U.nl(n0.notes || '')]]) +
          '<p class="small muted">A notice u/s 80 CPC gives the department two months to settle or reply before a suit can be filed.</p>';
      }
      const m = st().matterId && LR.store.get('matters', st().matterId);
      if (!m) {
        const open = D().matters.filter(mOpen);
        return head('Work in Hand') + '<div class="tiles">' + R.MATTER_TYPES.filter((t) => open.some((x) => x.type === t[0])).map((t) => '<div class="tile" data-act="mf" data-k="type" data-v="' + e(t[0]) + '"><b>' + open.filter((x) => x.type === t[0]).length + '</b><span>' + e(t[2]) + '</span></div>').join('') + '</div>' +
          '<div class="hint">Each type gets a usual time for the opinion — vetting 7 days, RTI opinion 3 days (the CPIO’s 30 days are running), recruitment and administrative 10 days, DoLA 30 days. The Dashboard warns as the date comes near; a DoLA reference with no reply for 30 days is flagged for a reminder.</div>' +
          '<h3 class="sec">Checklists</h3>' + ['vetting', 'rti', 'recruit', 'dola'].map((id) => { const p = R.PROCEDURES.find((x) => x.id === id); return '<div class="cl-item" data-act="go-proc" data-v="' + id + '"><div><b>' + e(p.t) + '</b><div class="p">' + e(p.s) + '</div></div><div>' + I('right').replace('<svg', '<svg style="width:16px"') + '</div></div>'; }).join('');
      }
      return V.matterDetail(m);
    },
  };
  V.matterDetail = (m) => {
    const c = m.caseId && M.caseById(m.caseId), n = m.dueOn ? U.fromToday(m.dueOn) : null, open = mOpen(m);
    return head(e(m.type), e(m.ref || ''), '<button class="btn" data-act="picture" data-kind="matter" data-id="' + m.id + '">' + I('list') + 'Full picture</button><button class="btn" data-act="edit-matter" data-id="' + m.id + '">' + I('edit') + 'Edit</button>') +
      (open && m.dueOn && m.status !== 'Referred to DoLA' ? '<div class="banner" style="' + (n < 0 ? '' : 'background:color-mix(in srgb,var(--up) 8%,var(--paper));border-color:color-mix(in srgb,var(--up) 30%,transparent)') + '">' + I('clock') + '<span>Opinion due <b>' + U.fmt(m.dueOn, true) + '</b> — ' + M.whenText(n).toLowerCase() + '.</span></div>' : '') +
      sheet([['Subject', U.nl(m.subject || '')], ['Region / office', e([m.region, m.fromOffice].filter(Boolean).join(' · '))], ['Other party', e(m.party || '')], ['Value', m.value ? U.money(m.value) : ''],
        ['Received', U.fmt(m.receivedOn)], ['Dealt by', e(m.assigned || '')], ['Status', '<span class="badge ' + (open ? 'b-up' : 'b-done') + '">' + e(m.status) + '</span>'],
        ['DoLA', m.dolaRef || m.dolaOn ? e(m.dolaRef || '') + (m.dolaOn ? ' — referred ' + U.fmt(m.dolaOn) + ' (' + U.diff(m.dolaOn, U.today()) + ' days)' : '') : ''],
        ['Opinion / vetting', (m.opinionOn ? 'Given ' + U.fmt(m.opinionOn) + '<br>' : '') + U.nl(m.advice || '')], ['Related case', c ? '<a href="#" data-act="open-case" data-id="' + c.id + '">' + e(M.caseNo(c)) + '</a>' : ''], ['Notes', U.nl(m.notes || '')]]) +
      ((m.history || []).length ? '<h3 class="sec">Movement</h3><div class="tl">' + m.history.slice().sort(U.by('date', -1)).map((x) => '<div class="tl-item"><div class="d">' + U.fmt(x.date) + '</div><div class="b">' + e(x.note) + '</div></div>').join('') + '</div>' : '');
  };
  V.refBox = (g) => '<h3 class="sec">Timelines to remember</h3>' + R.TIMELINES.filter((t) => t.g.startsWith(g)).map((t) => '<div class="ref-item"><h4>' + e(t.t) + ' — ' + e(t.p) + '</h4><p>From: ' + e(t.f) + '</p><p class="law">' + e(t.law) + '</p>' + (t.n ? '<p>' + e(t.n) + '</p>' : '') + '</div>').join('');

  /* ================= COUNSEL & FEES ================= */
  V.counsel = {
    label: 'Counsel & Fees', icon: 'users', subs: [['counsel', 'Counsel'], ['fees', 'Fee bills'], ['courts', 'Courts & forums']],
    left(sub) {
      if (sub === 'fees') {
        const list = D().fees.slice().sort((a, b) => (a.status === 'Paid') - (b.status === 'Paid') || U.by('billDate', -1)(a, b));
        let h = head('Counsel Fee Bills', 'From receipt to payment', '<button class="btn pri" data-act="new-fee">' + I('plus') + 'New bill</button>');
        if (!list.length) return h + '<div class="empty">No fee bills.</div>';
        return h + '<table class="tbl"><tr><th>Bill</th><th>Counsel / case</th><th>Amount</th><th>Status</th></tr>' + list.map((f) => { const cn = M.counsel(f.counselId), c = f.caseId && M.caseById(f.caseId), age = f.billDate ? U.diff(f.billDate, U.today()) : 0;
          return '<tr data-act="edit-fee" data-id="' + f.id + '"><td><b>' + e(f.billNo || '—') + '</b><div class="muted small">' + U.fmt(f.billDate) + '</div></td><td>' + e(cn ? cn.name : '') + '<div class="muted small">' + e(c ? M.caseNo(c) : '') + (f.stage ? ' · ' + e(f.stage) : '') + '</div></td><td class="num">' + U.money(f.amount) + '</td><td><span class="badge ' + (f.status === 'Paid' ? 'b-done' : age > D().settings.alerts.fees ? 'b-over' : 'b-up') + '">' + e(f.status) + '</span>' + (f.status !== 'Paid' ? '<div class="muted small">' + age + ' days</div>' : '') + '</td></tr>'; }).join('') + '</table>';
      }
      if (sub === 'courts') {
        const list = D().courts.slice().sort(U.by('name'));
        return head('Courts &amp; Forums', 'Used in cases and for working out appeal routes', '<button class="btn pri" data-act="new-court">' + I('plus') + 'Add</button>') +
          '<div class="reg">' + list.map((c) => { const n = D().cases.filter((x) => x.courtId === c.id && M.isOpen(x)).length;
            return '<div class="rrow ' + (st().courtId === c.id ? 'sel' : '') + '" data-act="open-court" data-id="' + c.id + '"><div><div class="no">' + e(c.short || c.name) + '</div><div class="ti">' + e(c.name) + '</div><div class="mt"><span>' + e((R.COURT_KINDS.find((k) => k[0] === c.kind) || [, ''])[1]) + '</span><span>' + e(c.place || '') + '</span></div></div><div class="rt"><span class="when">' + n + '<small>pending</small></span></div></div>'; }).join('') + '</div>';
      }
      const list = D().counsel.slice().sort(U.by('name'));
      let h = head('Government Counsel', 'CGSCs, panel counsel and others engaged for IMD', '<button class="btn pri" data-act="new-counsel">' + I('plus') + 'Add counsel</button>');
      if (!list.length) return h + '<div class="empty">No counsel added yet.</div>';
      return h + '<div class="reg">' + list.map((c) => { const n = D().cases.filter((x) => x.counselId === c.id && M.isOpen(x)).length, end = c.termTo ? U.fromToday(c.termTo) : null;
        return '<div class="rrow ' + (st().counselId === c.id ? 'sel' : '') + '" data-act="open-counsel" data-id="' + c.id + '"><div><div class="no">' + e(c.name) + '</div><div class="mt"><span>' + e(c.type || '') + '</span><span>' + e(c.courts || '') + '</span>' + (end != null && end <= 60 ? '<span class="badge ' + (end < 0 ? 'b-over' : 'b-soon') + '">term ' + (end < 0 ? 'ended' : 'ends ' + U.rel(c.termTo)) + '</span>' : '') + '</div></div><div class="rt"><span class="when">' + n + '<small>pending cases</small></span></div></div>'; }).join('') + '</div>';
    },
    right(sub) {
      if (sub === 'fees') {
        const tot = {}, pend = {};
        for (const f of D().fees) { const k = (M.counsel(f.counselId) || {}).name || '—'; tot[k] = (tot[k] || 0) + (+f.amount || 0); if (f.status !== 'Paid' && f.status !== 'Returned') pend[k] = (pend[k] || 0) + (+f.amount || 0); }
        const yr = String(new Date().getFullYear());
        const paidYr = D().fees.filter((f) => f.status === 'Paid' && String(f.paidOn || '').startsWith(yr)).reduce((s, f) => s + (+f.amount || 0), 0);
        return head('Fees at a Glance') + '<div class="tiles"><div class="tile"><b>' + U.money(Object.values(pend).reduce((a, b) => a + b, 0)) + '</b><span>Pending</span></div><div class="tile"><b>' + U.money(paidYr) + '</b><span>Paid in ' + yr + '</span></div></div>' +
          '<h3 class="sec">By counsel</h3><table class="tbl"><tr><th>Counsel</th><th>Billed</th><th>Pending</th></tr>' + Object.keys(tot).sort().map((k) => '<tr><td>' + e(k) + '</td><td class="num">' + U.money(tot[k]) + '</td><td class="num">' + U.money(pend[k] || 0) + '</td></tr>').join('') + '</table>';
      }
      if (sub === 'courts') {
        const c = st().courtId && LR.store.get('courts', st().courtId);
        if (!c) return head('Court Details') + '<div class="hint">The kind of court decides the appeal route the register suggests: CAT → writ in High Court; High Court Single Bench → LPA (30 days); Division Bench → SLP (90 days); District Consumer → State Commission (45 days), and so on.</div>';
        const cs = D().cases.filter((x) => x.courtId === c.id);
        return head(e(c.short || c.name), e(c.name), '<button class="btn" data-act="edit-court" data-id="' + c.id + '">' + I('edit') + 'Edit</button>') +
          sheet([['Kind', e((R.COURT_KINDS.find((k) => k[0] === c.kind) || [, ''])[1])], ['Place', e(c.place || '')], ['Website', c.site ? '<a href="' + e(U.safeUrl(c.site)) + '" target="_blank" rel="noopener">' + e(c.site) + '</a>' : ''], ['Usual remedy', e(R.REMEDIES[R.defaultRemedy(c.kind, 'Division Bench')].label)], ['Notes', U.nl(c.notes || '')]]) +
          '<h3 class="sec">Cases <span class="c">' + cs.length + '</span></h3>' + (cs.length ? cs.map((x) => '<div class="cl-item" data-act="open-case" data-id="' + x.id + '"><div><b style="font-family:var(--serif);color:var(--accent)">' + e(M.caseNo(x)) + '</b><div class="small">' + e(M.vs(x)) + '</div></div><div><span class="badge">' + e(x.status) + '</span></div></div>').join('') : '<div class="empty">None.</div>');
      }
      const c = st().counselId && LR.store.get('counsel', st().counselId);
      if (!c) return head('Counsel Details') + '<div class="hint">Every pending case should have Government counsel recorded; the Action Board flags cases without one, and warns 60 days before a counsel’s engagement ends.</div>';
      const cs = D().cases.filter((x) => x.counselId === c.id), fees = D().fees.filter((f) => f.counselId === c.id);
      return head(e(c.name), e(c.type || ''), '<button class="btn" data-act="edit-counsel" data-id="' + c.id + '">' + I('edit') + 'Edit</button>') +
        sheet([['Courts', e(c.courts || '')], ['Phone', c.phone ? '<a href="tel:' + e(c.phone) + '">' + e(c.phone) + '</a>' : ''], ['E-mail', c.email ? '<a href="mailto:' + e(c.email) + '">' + e(c.email) + '</a>' : ''], ['Chamber', U.nl(c.address || '')],
          ['Engaged', [c.termFrom && 'from ' + U.fmt(c.termFrom), c.termTo && 'up to ' + U.fmt(c.termTo)].filter(Boolean).join(' ')], ['Notes', U.nl(c.notes || '')]]) +
        '<h3 class="sec">Cases <span class="c">' + cs.filter(M.isOpen).length + ' pending of ' + cs.length + '</span></h3>' + (cs.length ? cs.map((x) => '<div class="cl-item" data-act="open-case" data-id="' + x.id + '"><div><b style="font-family:var(--serif);color:var(--accent)">' + e(M.caseNo(x)) + '</b> <span class="muted small">· ' + e(M.courtShort(x)) + '</span><div class="small">' + e(M.vs(x)) + '</div></div><div class="when">' + (M.isOpen(x) && x.nextDate ? U.fmtShort(x.nextDate) + '<small>' + U.rel(x.nextDate) + '</small>' : e(x.status)) + '</div></div>').join('') : '<div class="empty">No cases.</div>') +
        (fees.length ? '<h3 class="sec">Fee bills</h3>' + fees.map((f) => '<div class="small" style="padding:5px 0;border-bottom:1px solid var(--rule)">' + e(f.billNo || '—') + ' · ' + U.fmt(f.billDate) + ' · ' + U.money(f.amount) + ' · <b>' + e(f.status) + '</b></div>').join('') : '');
    },
  };

  /* ================= READY REFERENCE ================= */
  V.reference = {
    label: 'Ready Reference', icon: 'book', subs: [['timelines', 'Timelines'], ['procedures', 'Procedures'], ['formats', 'Formats & glossary'], ['notes', 'Our notes']],
    left(sub) {
      if (sub === 'procedures') {
        const cur = st().refProc || R.PROCEDURES[0].id;
        return head('Procedures', 'Step-by-step checklists for the Legal Section') + '<div class="ref-list">' + R.PROCEDURES.map((p) => '<button class="' + (p.id === cur ? 'on' : '') + '" data-act="ref-proc" data-v="' + p.id + '"><b>' + e(p.t) + '</b><span>' + e(p.s) + '</span></button>').join('') + '</div>' +
          '<div class="hint">These are general working steps. Follow the latest instructions of the Ministry, the Department of Legal Affairs and the National Litigation Policy where they differ.</div>';
      }
      if (sub === 'formats') {
        const q = U.norm(st().glossQ);
        const list = R.GLOSSARY.filter(([t, m]) => !q || U.norm(t + ' ' + m).includes(q));
        return head('Glossary', 'Terms met in court papers') + '<div class="filters"><input class="field" placeholder="Find a term…" value="' + e(st().glossQ || '') + '" data-change="gloss-q"></div>' +
          '<table class="tbl">' + list.map(([t, m]) => '<tr><td style="width:150px"><b>' + e(t) + '</b></td><td>' + e(m) + '</td></tr>').join('') + '</table>';
      }
      if (sub === 'notes') {
        const list = D().refs.slice().sort(U.by((r) => (r.cat || '') + r.title));
        return head('Our Reference Notes', 'OMs, judgments and points the section wants at hand', '<button class="btn pri" data-act="new-ref">' + I('plus') + 'Add note</button>') +
          (list.length ? '<div class="ref-list">' + list.map((r) => '<button class="' + (st().refId === r.id ? 'on' : '') + '" data-act="open-ref" data-id="' + r.id + '"><b>' + e(r.title) + '</b><span>' + e([r.cat, r.source].filter(Boolean).join(' · ')) + '</span></button>').join('') + '</div>' : '<div class="empty">No notes yet. Keep here the DoPT OMs, leading judgments and Ministry instructions the section refers to often.</div>');
      }
      const q = U.norm(st().tlQ);
      const list = R.TIMELINES.filter((t) => !q || U.norm([t.g, t.t, t.p, t.law, t.n].join(' ')).includes(q));
      let h = head('Limitation &amp; Timelines', 'Periods under the main Acts and Rules') + '<div class="filters"><input class="field" placeholder="Find (e.g. SLP, review, RTI, consumer)…" value="' + e(st().tlQ || '') + '" data-change="tl-q"></div>';
      let g = '';
      h += '<table class="tbl">';
      for (const t of list) {
        if (t.g !== g) { h += '<tr><th colspan="2">' + e(t.g) + '</th></tr>'; g = t.g; }
        h += '<tr><td><b>' + e(t.t) + '</b><div class="small muted">From: ' + e(t.f) + '</div>' + (t.n ? '<div class="small">' + e(t.n) + '</div>' : '') + '<div class="law">' + e(t.law) + '</div></td><td class="num" style="white-space:normal;width:110px"><b>' + e(t.p) + '</b></td></tr>';
      }
      return h + '</table><p class="small muted">Check the current text of the Act or Rule and any order of the court in the case; a direction of the court overrides the general period.</p>';
    },
    right(sub) {
      if (sub === 'procedures') {
        const p = R.PROCEDURES.find((x) => x.id === (st().refProc || R.PROCEDURES[0].id));
        return head(e(p.t), e(p.s), '<button class="btn" data-act="copy-proc" data-v="' + p.id + '">' + I('copy') + 'Copy</button>') + '<div class="ref-item"><ol>' + p.steps.map((s) => '<li>' + e(s) + '</li>').join('') + '</ol></div>';
      }
      if (sub === 'formats') {
        return head('Formats', 'Copy, then fill in the blanks') + R.TEMPLATES.map((t, i) => '<h3 class="sec">' + e(t.t) + ' <span class="r"><button class="btn sm" data-act="copy-tpl" data-v="' + i + '">' + I('copy') + 'Copy</button></span></h3><pre class="tpl">' + e(t.x) + '</pre>').join('');
      }
      if (sub === 'notes') {
        const r = st().refId && LR.store.get('refs', st().refId);
        if (!r) return head('Note') + '<div class="empty">Choose a note on the left.</div>';
        return head(e(r.title), e([r.cat, r.source].filter(Boolean).join(' · ')), '<button class="btn" data-act="edit-ref" data-id="' + r.id + '">' + I('edit') + 'Edit</button>') + '<div class="ref-item" style="white-space:pre-wrap;font-family:var(--serif);font-size:14px">' + e(r.body || '') + '</div>';
      }
      return head('Limitation Calculator', 'Work out a last date') + V.calc() +
        '<h3 class="sec">Counting time</h3><div class="ref-item"><ul>' +
        '<li>The day of the order is left out; the period starts the next day (Limitation Act, s.12(1)).</li>' +
        '<li>Time taken to obtain a certified copy of the order may be left out for appeals and reviews (s.12(2)–(3)) — keep the copy-application and delivery dates on record.</li>' +
        '<li>If the period ends on a day the court is closed, file on the day it reopens (s.4).</li>' +
        '<li>Condonation of delay (s.5) needs a day-to-day explanation; government delay is not excused as a matter of course.</li>' +
        '<li>A court’s own time limit for compliance is a separate deadline — missing it invites contempt.</li></ul></div>' +
        '<h3 class="sec">Useful websites</h3><div class="ref-item"><ul>' +
        '<li><a href="https://cgat.gov.in" target="_blank" rel="noopener">Central Administrative Tribunal</a> — case status and cause lists</li>' +
        '<li><a href="https://ecourts.gov.in" target="_blank" rel="noopener">eCourts Services</a> — High Court and district court case status</li>' +
        '<li><a href="https://www.sci.gov.in" target="_blank" rel="noopener">Supreme Court of India</a></li>' +
        '<li><a href="https://legalaffairs.gov.in" target="_blank" rel="noopener">Department of Legal Affairs</a></li>' +
        '<li><a href="https://www.indiacode.nic.in" target="_blank" rel="noopener">India Code</a> — current text of Acts</li>' +
        '<li><a href="https://cic.gov.in" target="_blank" rel="noopener">Central Information Commission</a></li></ul></div>';
    },
  };

  /* ================= REPORTS ================= */
  V.reports = {
    label: 'Reports', icon: 'chart', subs: [['stats', 'Statistics'], ['log', 'Change log']],
    left(sub) {
      const d = D();
      if (sub === 'log') {
        const q = U.norm(st().logQ);
        const list = d.audit.filter((x) => !q || U.norm(x.by + ' ' + x.what).includes(q)).slice(0, 400);
        return head('Change Log', 'Who changed what (latest 600 entries are kept)') + '<div class="filters"><input class="field" placeholder="Find…" value="' + e(st().logQ || '') + '" data-change="log-q"></div>' +
          '<table class="tbl"><tr><th>When</th><th>By</th><th>What</th></tr>' + list.map((x) => '<tr><td style="white-space:nowrap">' + U.fmtTime(x.at) + '</td><td>' + e(x.by) + '</td><td>' + e(x.what) + '</td></tr>').join('') + '</table>';
      }
      const open = d.cases.filter(M.isOpen), T = U.today();
      const age = [['Under 1 year', 0, 365], ['1–3 years', 365, 1095], ['3–5 years', 1095, 1825], ['Over 5 years', 1825, 1e9]].map(([l, a, b]) => [l, open.filter((c) => c.filedOn && U.diff(c.filedOn, T) >= a && U.diff(c.filedOn, T) < b).length]);
      const noDate = open.filter((c) => !c.filedOn).length;
      const res = {};
      for (const c of d.cases) if (c.result) res[c.result] = (res[c.result] || 0) + 1;
      const cat = {};
      for (const c of open) { const k = c.category || 'Not set'; cat[k] = (cat[k] || 0) + 1; }
      const bars = (obj, colorBy) => { const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]), max = Math.max(1, ...rows.map((r) => r[1]));
        return rows.length ? '<div class="bars">' + rows.map(([k, v], i) => '<div class="bar"><span class="l" title="' + e(k) + '">' + e(k) + '</span><span class="t"><i style="width:' + (v / max * 100) + '%;--c:' + (colorBy ? colorBy(k) : 'var(--chart' + (i % 6 + 1) + ')') + '"></i></span><span class="v">' + v + '</span></div>').join('') + '</div>' : '<div class="empty">Nothing yet.</div>'; };
      const won = d.cases.filter((c) => /favour/i.test(c.result || '')).length, lost = d.cases.filter((c) => /against/i.test(c.result || '')).length;
      return head('Statistics', 'The register in numbers', '<button class="btn" data-act="print-register">' + I('print') + 'Print register</button>') +
        '<div class="tiles"><div class="tile"><b>' + d.cases.length + '</b><span>All cases</span></div><div class="tile"><b>' + open.length + '</b><span>Pending</span></div>' +
        '<div class="tile" style="--c:var(--done)"><b>' + (won + lost ? Math.round(won / (won + lost) * 100) + '%' : '—') + '</b><span>Decided in favour</span></div>' +
        '<div class="tile"><b>' + U.moneyShort(open.reduce((s, c) => s + (+c.amount || 0), 0)) + '</b><span>At stake (pending)</span></div></div>' +
        '<h3 class="sec">Pending cases by age</h3>' + bars(Object.fromEntries(age)) + (noDate ? '<p class="small muted">' + noDate + ' pending case(s) have no filing date.</p>' : '') +
        '<h3 class="sec">Results</h3>' + bars(res, (k) => /against/i.test(k) ? 'var(--over)' : /favour/i.test(k) ? 'var(--done)' : 'var(--chart3)') +
        '<h3 class="sec">Pending, by region</h3>' + bars(Object.fromEntries(M.regions().map((r) => [r, open.filter((c) => c.region === r).length]).filter((x) => x[1]).concat(open.some((c) => !c.region) ? [['Region not set', open.filter((c) => !c.region).length]] : []))) +
        '<h3 class="sec">Pending, by subject</h3>' + bars(cat) +
        '<h3 class="sec">Opinions &amp; vetting</h3>' + (() => { const yr = String(new Date().getFullYear()), out = {};
          for (const t of R.MATTER_TYPES) { const l = d.matters.filter((m) => m.type === t[0]); if (l.length) out[t[2] + ' — ' + l.filter((m) => !R.MATTER_DONE.includes(m.status)).length + ' pending'] = l.filter((m) => String(m.receivedOn || '').startsWith(yr)).length; }
          return bars(out) + '<p class="small muted">Bars: received in ' + yr + '.</p>'; })();
    },
    right(sub) {
      const d = D();
      if (sub === 'log') {
        const who = {};
        for (const x of d.audit) who[x.by] = (who[x.by] || 0) + 1;
        return head('Who has been working') + '<table class="tbl"><tr><th>Name</th><th>Changes</th></tr>' + Object.entries(who).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<tr><td>' + e(k) + '</td><td class="num">' + v + '</td></tr>').join('') + '</table>' +
          '<div class="hint">The name comes from the “Your name” box on the login page. Everyone logs in with the same Legal Section account, so ask colleagues to fill it in.</div>';
      }
      const now = new Date().getFullYear(), years = [];
      for (let y = now - 5; y <= now; y++) years.push(String(y));
      const filed = years.map((y) => d.cases.filter((c) => String(c.filedOn || c.year || '').startsWith(y)).length);
      const disp = years.map((y) => d.cases.filter((c) => !M.isOpen(c) && (c.orders || []).some((o) => /Final/.test(o.kind || '') && String(o.date).startsWith(y))).length);
      const max = Math.max(1, ...filed, ...disp);
      const office = {};
      for (const c of d.cases.filter(M.isOpen)) { const k = c.office || 'Not set'; office[k] = (office[k] || 0) + 1; }
      const rows = Object.entries(office).sort((a, b) => b[1] - a[1]).slice(0, 10), om = Math.max(1, ...rows.map((r) => r[1]));
      return head('Trends &amp; Exports') +
        '<h3 class="sec">Filed and decided each year</h3><div class="legend"><span><i style="--c:var(--chart1)"></i>Filed</span><span><i style="--c:var(--chart3)"></i>Decided (final order recorded)</span></div>' +
        '<div class="cols">' + years.map((y, i) => '<div class="cg" title="' + y + ': filed ' + filed[i] + ', decided ' + disp[i] + '"><i style="height:' + (filed[i] / max * 100) + '%;--c:var(--chart1)"></i><i style="height:' + (disp[i] / max * 100) + '%;--c:var(--chart3)"></i></div>').join('') + '</div><div class="cols-x">' + years.map((y) => '<span>' + y + '</span>').join('') + '</div>' +
        '<h3 class="sec">Pending, by office</h3>' + (rows.length ? '<div class="bars">' + rows.map(([k, v], i) => '<div class="bar"><span class="l">' + e(k) + '</span><span class="t"><i style="width:' + (v / om * 100) + '%;--c:var(--chart' + (i % 6 + 1) + ')"></i></span><span class="v">' + v + '</span></div>').join('') + '</div>' : '<div class="empty">No pending cases.</div>') +
        '<h3 class="sec">Print and export</h3><div style="display:flex;flex-wrap:wrap;gap:6px">' +
        '<button class="btn" data-act="print-register">' + I('print') + 'Register of pending cases</button>' +
        '<button class="btn" data-act="print-actions">' + I('print') + 'Action report</button>' +
        '<button class="btn" data-act="print-orders">' + I('print') + 'Compliance statement</button>' +
        '<button class="btn" data-act="export-cases">' + I('download') + 'Cases (CSV for Excel)</button>' +
        '<button class="btn" data-act="export-hearings">' + I('download') + 'Hearings (CSV)</button>' +
        '<button class="btn" data-act="download">' + I('download') + 'Whole register (JSON)</button></div>';
    },
  };
})();
