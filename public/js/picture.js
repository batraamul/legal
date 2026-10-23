/* js/picture.js — one reference → the complete picture.
   LR.find(q) searches every register by any reference (case no., file no., letter no., party, region);
   LR.picture(kind, id) shows everything about that one item on a single card. */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, M = LR.rules, R = LR.refs, e = U.esc, I = LR.icon, UI = LR.ui, S = LR.store;

  LR.find = (q, max) => {
    const t = U.norm(q).trim();
    if (!t) return [];
    const ws = t.replace(/[\/\-]/g, ' ').split(/\s+/).filter(Boolean);
    const ok = (s) => { const h = U.norm(s).replace(/[\/\-]/g, ' '); return ws.every((w) => h.includes(w)); };
    const out = [];
    for (const c of S.data.cases) if (ok([M.caseNo(c), c.number, c.petitioner, c.respondents, c.subject, c.category, c.fileNo, c.region, c.office, c.linked, c.limbs, c.dolaRef, M.courtShort(c)].join(' ')))
      out.push({ kind: 'case', id: c.id, t: M.caseNo(c) + ' · ' + M.courtShort(c), s: M.vs(c), tag: c.status, open: M.isOpen(c) });
    for (const m of S.data.matters) if (ok([m.type, m.ref, m.subject, m.party, m.region, m.fromOffice, m.dolaRef].join(' ')))
      out.push({ kind: 'matter', id: m.id, t: m.type + (m.ref ? ' · ' + m.ref : ''), s: m.subject || '', tag: m.status, open: !R.MATTER_DONE.includes(m.status) });
    for (const n of S.data.notices) if (ok([n.kind, n.from, n.subject, n.advocate, n.region, n.replyRef].join(' ')))
      out.push({ kind: 'notice', id: n.id, t: n.kind + ' · ' + (n.from || ''), s: n.subject || '', tag: n.status, open: n.status === 'Open' });
    for (const c of S.data.counsel) if (ok([c.name, c.type, c.courts].join(' ')))
      out.push({ kind: 'counsel', id: c.id, t: c.name, s: (c.type || '') + ' · ' + (c.courts || ''), tag: 'Counsel', open: true });
    out.sort((a, b) => b.open - a.open);
    return max ? out.slice(0, max) : out;
  };

  const row = (k, v) => v ? '<div class="k">' + k + '</div><div>' + v + '</div>' : '';
  const dateLine = (label, k, done) => k ? '<li><b>' + label + ':</b> ' + U.fmt(k, true) + (done ? ' <span class="badge b-done">done</span>' : ' <span class="badge ' + (U.fromToday(k) < 0 ? 'b-over' : U.fromToday(k) <= 7 ? 'b-soon' : 'b-up') + '">' + M.whenText(U.fromToday(k)) + '</span>') + '</li>' : '';

  function caseCard(c) {
    const ct = M.court(c), cn = M.counsel(c.counselId), acts = M.actions().filter((a) => a.caseId === c.id && a.sev !== 'watch');
    const watch = M.actions().filter((a) => a.caseId === c.id && a.sev === 'watch');
    const hs = (c.hearings || []).slice().sort(U.by('date', -1)).slice(0, 3);
    const os = (c.orders || []).slice().sort(U.by('date', -1));
    const matters = S.data.matters.filter((m) => m.caseId === c.id), notices = S.data.notices.filter((n) => n.caseId === c.id), tasks = S.data.tasks.filter((t) => t.caseId === c.id && !t.done);
    let dates = '';
    if (M.isOpen(c)) dates += dateLine('Next hearing' + (c.nextPurpose ? ' (' + e(c.nextPurpose) + ')' : ''), c.nextDate);
    if (c.replyDue) dates += dateLine('Counter / reply', c.replyDue, !!c.counterOn);
    for (const o of os) {
      if (o.complianceDue && o.direction) dates += dateLine('Comply with order of ' + U.fmt(o.date), o.complianceDue, !M.orderOpen(o));
      if (M.adverse(o) && o.kind !== 'Interim order' && M.orderOpen(o) && o.action !== 'Comply') { const L = M.limitation(c, o); if (L.last || L.target) dates += dateLine((L.last ? 'Last date: ' : 'Target: ') + e(L.r.label), L.last || L.target); }
    }
    return '<div class="case-head"><div style="min-width:0"><div class="no">' + e(M.caseNo(c)) + '</div><div class="court">' + e(ct ? ct.name : '') + (c.bench ? ' · ' + e(c.bench) : '') + '</div>' +
      '<div class="vs">' + e(c.petitioner || '—') + '<em>versus</em>' + e(c.respondents || '—') + '</div></div>' +
      '<div class="st">' + (M.isOpen(c) ? '<span class="badge b-up">' + e(c.status) + '</span>' : '<span class="stamp" style="--c:' + (/against/i.test(c.result || '') ? 'var(--over)' : 'var(--done)') + '">' + e(c.status) + '</span>') + '</div></div>' +
      '<div class="chips">' + [c.region && '<span class="badge">' + e(c.region) + '</span>', c.category && '<span class="badge">' + e(c.category) + '</span>', c.contempt && '<span class="badge b-over">Contempt</span>', c.stay && '<span class="badge b-up">Interim order</span>', c.dola && '<span class="badge b-watch">DoLA</span>', c.priority === 'high' && '<span class="badge b-acc">High priority</span>'].filter(Boolean).join('') + '</div>' +
      (acts.length ? '<h3 class="sec">What needs doing</h3>' + acts.map((a) => '<div class="acard ' + a.sev + '" style="padding:8px 10px"><div class="top"><div class="tt">' + e(a.title) + '</div><div class="due">' + '<span class="badge b-' + a.sev + '">' + e(a.due ? M.whenText(a.days) : M.SEV[a.sev]) + '</span></div></div>' + (a.steps && a.steps.length ? '<ul>' + a.steps.slice(0, 3).map((s) => '<li>' + e(s) + '</li>').join('') + '</ul>' : '') + '</div>').join('') : '<div class="hint">Nothing pressing on this case.</div>') +
      (dates ? '<h3 class="sec">Key dates</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.9">' + dates + '</ul>' : '') +
      '<h3 class="sec">The case</h3><div class="sheet">' + row('Subject', U.nl(c.subject || '')) + row('Relief sought', U.nl(c.relief || '')) + row('Stage', e(c.stage || '') + (c.result ? ' · ' + e(c.result) : '')) +
      row('Region / office', e([...new Set([c.region, c.office, c.section].filter(Boolean))].join(' · '))) + row('Officer-in-charge', e(c.nodal || '')) +
      row('Government counsel', cn ? e(cn.name) + (cn.phone ? ' · ' + e(cn.phone) : '') : '<span style="color:var(--over)">not recorded</span>') +
      row('Interim order', c.stay ? e(c.stayText || 'In force') : '') + row('DoLA', c.dola ? e(c.dolaRef || 'involved') : '') +
      row('Financial implication', c.amount ? U.money(c.amount) : '') + row('e-Office file', e(c.fileNo || '')) + row('Connected', e(c.linked || '')) + '</div>' +
      (hs.length ? '<h3 class="sec">Latest hearings</h3>' + hs.map((h) => '<div class="small" style="padding:5px 0;border-bottom:1px solid var(--rule)"><b>' + U.fmt(h.date) + '</b>' + (h.purpose ? ' · ' + e(h.purpose) : '') + ' — ' + e(h.proceedings || '') + '</div>').join('') : '') +
      (os.length ? '<h3 class="sec">Orders</h3>' + os.map((o) => '<div class="small" style="padding:5px 0;border-bottom:1px solid var(--rule)"><b>' + U.fmt(o.date) + '</b> · ' + e(o.kind || '') + (o.result ? ' · ' + e(o.result) : '') + (o.direction ? '<div>Direction: ' + e(o.direction) + '</div>' : '') + (o.action ? '<div class="muted">Action: ' + e(o.action) + '</div>' : '') + '</div>').join('') : '') +
      (matters.length || notices.length || tasks.length ? '<h3 class="sec">Linked</h3>' + matters.map((m) => '<div class="small">' + e(m.type) + ' — ' + e(m.subject) + ' (' + e(m.status) + ')</div>').join('') + notices.map((n) => '<div class="small">' + e(n.kind) + ' from ' + e(n.from) + '</div>').join('') + tasks.map((t) => '<div class="small">Follow-up: ' + e(t.text) + (t.due ? ' — by ' + U.fmt(t.due) : '') + '</div>').join('') : '') +
      (watch.length ? '<h3 class="sec">Keep an eye on</h3>' + watch.map((a) => '<div class="small">• ' + e(a.title) + '</div>').join('') : '');
  }
  function matterCard(m) {
    const acts = M.actions().filter((a) => a.matterId === m.id);
    const c = m.caseId && M.caseById(m.caseId);
    return '<div class="case-head"><div><div class="no">' + e(m.type) + '</div><div class="court">' + e(m.ref || '') + '</div><div class="vs" style="font-size:15px">' + e(m.subject || '') + '</div></div><div class="st"><span class="badge ' + (R.MATTER_DONE.includes(m.status) ? 'b-done' : 'b-up') + '">' + e(m.status) + '</span></div></div>' +
      (acts.length ? '<h3 class="sec">What needs doing</h3>' + acts.map((a) => '<div class="acard ' + a.sev + '" style="padding:8px 10px"><div class="top"><div class="tt">' + e(a.title) + '</div><div class="due"><span class="badge b-' + a.sev + '">' + e(a.due ? M.whenText(a.days) : M.SEV[a.sev]) + '</span></div></div><ul>' + (a.steps || []).map((s) => '<li>' + e(s) + '</li>').join('') + '</ul></div>').join('') : '') +
      '<div class="sheet">' + row('Region / office', e([m.region, m.fromOffice].filter(Boolean).join(' · '))) + row('Other party', e(m.party || '')) + row('Value', m.value ? U.money(m.value) : '') +
      row('Received', U.fmt(m.receivedOn)) + row('Opinion due', m.dueOn ? U.fmt(m.dueOn) : '') + row('Dealt by', e(m.assigned || '')) +
      row('DoLA', m.dolaRef || m.dolaOn ? e(m.dolaRef || '') + (m.dolaOn ? ' — ' + U.fmt(m.dolaOn) : '') : '') + row('Opinion / vetting', (m.opinionOn ? 'Given ' + U.fmt(m.opinionOn) + '<br>' : '') + U.nl(m.advice || '')) +
      row('Related case', c ? e(M.caseNo(c)) + ' · ' + e(M.courtShort(c)) + (c.nextDate && M.isOpen(c) ? ' — next date ' + U.fmt(c.nextDate) : '') : '') + row('Notes', U.nl(m.notes || '')) + '</div>' +
      ((m.history || []).length ? '<h3 class="sec">Movement</h3>' + m.history.slice().sort(U.by('date', -1)).map((x) => '<div class="small" style="padding:4px 0;border-bottom:1px solid var(--rule)"><b>' + U.fmt(x.date) + '</b> — ' + e(x.note) + '</div>').join('') : '');
  }
  function noticeCard(n) {
    return '<div class="case-head"><div><div class="no">' + e(n.kind) + '</div><div class="court">From ' + e(n.from || '') + (n.advocate ? ' through ' + e(n.advocate) : '') + '</div></div><div class="st"><span class="badge">' + e(n.status) + '</span></div></div>' +
      '<div class="sheet">' + row('Subject', U.nl(n.subject || '')) + row('Demand', e(n.demand || '')) + row('Region / office', e([n.region, n.office].filter(Boolean).join(' · '))) + row('Received', U.fmt(n.receivedOn)) +
      row('Reply due', n.replyDue ? U.fmt(n.replyDue) + (n.status === 'Open' ? ' (' + U.rel(n.replyDue) + ')' : '') : '') + row('Replied', n.repliedOn ? U.fmt(n.repliedOn) : '') + row('Notes', U.nl(n.notes || '')) + '</div>';
  }

  function summaryText(kind, x) {
    if (kind === 'case') {
      const lines = [M.caseNo(x) + ' — ' + (M.court(x) || {}).name, M.vs(x), 'Subject: ' + (x.subject || ''), 'Region: ' + (x.region || '') + (x.office ? ' / ' + x.office : ''), 'Status: ' + x.status + ' — ' + (x.stage || '')];
      if (x.nextDate && M.isOpen(x)) lines.push('Next date: ' + U.fmt(x.nextDate) + (x.nextPurpose ? ' (' + x.nextPurpose + ')' : ''));
      const cn = M.counsel(x.counselId); if (cn) lines.push('Counsel: ' + cn.name);
      for (const a of M.actions().filter((a) => a.caseId === x.id && a.sev !== 'watch')) lines.push('Action: ' + a.title + (a.due ? ' (' + U.fmt(a.due) + ')' : ''));
      return lines.join('\n');
    }
    if (kind === 'matter') return [x.type + (x.ref ? ' — ' + x.ref : ''), x.subject, 'Region: ' + (x.region || '') + (x.fromOffice ? ' / ' + x.fromOffice : ''), 'Received: ' + U.fmt(x.receivedOn) + (x.dueOn ? ' · due ' + U.fmt(x.dueOn) : ''), 'Status: ' + x.status, x.advice ? 'Opinion: ' + x.advice : ''].filter(Boolean).join('\n');
    return [x.kind + ' from ' + x.from, x.subject, 'Reply due: ' + U.fmt(x.replyDue), 'Status: ' + x.status].join('\n');
  }

  LR.picture = (kind, id) => {
    if (kind === 'counsel') return LR.app.act('open-counsel', { id });
    const coll = { case: 'cases', matter: 'matters', notice: 'notices' }[kind];
    const x = S.get(coll, id);
    if (!x) return;
    const body = kind === 'case' ? caseCard(x) : kind === 'matter' ? matterCard(x) : noticeCard(x);
    const m = UI.modal({ title: 'Complete picture', width: 760, body,
      foot: '<button class="btn l" data-copy>' + I('copy') + 'Copy summary</button>' + (kind === 'case' ? '<button class="btn" data-print>' + I('print') + 'Print case sheet</button>' : '') + '<button class="btn pri" data-primary>Open in the register</button>' });
    m.el.querySelector('[data-copy]').onclick = () => LR.app.copy(summaryText(kind, x));
    const pr = m.el.querySelector('[data-print]'); if (pr) pr.onclick = () => LR.settings.printCase(x);
    m.el.querySelector('[data-primary]').onclick = () => { m.close(); LR.app.act({ case: 'open-case', matter: 'open-matter', notice: 'open-notice' }[kind], { id }); };
  };
})();
