/* js/view-board.js — "Action Board" (preemptive actions) and "Cases" (the register and each case) */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, M = LR.rules, R = LR.refs, e = U.esc, I = LR.icon;
  const V = LR.views = LR.views || {};
  const st = () => LR.app.state;
  const D = () => LR.store.data;
  const S = LR.store;

  const sevBadge = (a) => '<span class="badge b-' + a.sev + '">' + e(a.due ? M.whenText(a.days) : M.SEV[a.sev]) + '</span>';
  const head = (title, sub, tools) => '<div class="pg-head"><div><h2 class="pg-title">' + title + '</h2>' + (sub ? '<p class="pg-sub">' + sub + '</p>' : '') + '</div>' + (tools ? '<div class="pg-tools">' + tools + '</div>' : '') + '</div>';
  V.head = head;

  /* ---------- one action card ---------- */
  const openOf = (a) => a.caseId ? 'data-act="open-case" data-id="' + a.caseId + '"' : a.matterId ? 'data-act="open-matter" data-id="' + a.matterId + '"' : a.noticeId ? 'data-act="open-notice" data-id="' + a.noticeId + '"' : a.counselId ? 'data-act="open-counsel" data-id="' + a.counselId + '"' : a.feeId ? 'data-act="edit-fee" data-id="' + a.feeId + '"' : '';
  V.card = (a) => {
    const openAct = openOf(a);
    return '<div class="acard ' + a.sev + '"><div class="top"><div style="min-width:0"><div class="ref" ' + openAct + '>' + e(a.ref || '') + (a.court ? ' <span class="muted" style="font:400 11.5px var(--sans)">· ' + e(a.court) + '</span>' : '') + '</div>' +
      '<div class="tt">' + e(a.title) + '</div>' + (a.note ? '<div class="small muted" style="margin-top:2px">' + e(a.note) + '</div>' : '') + '</div>' +
      '<div class="due">' + sevBadge(a) + (a.due ? '<div class="small muted" style="margin-top:4px">' + U.fmt(a.due) + '</div>' : '') + '</div></div>' +
      (a.steps && a.steps.length ? '<ul>' + a.steps.map((s) => '<li>' + e(s) + '</li>').join('') + '</ul>' : '') +
      '<div class="ops">' + (openAct ? '<button class="btn sm" ' + openAct + '>' + I('folder') + 'Open</button>' : '') +
      (a.kind === 'hearing' && a.caseId && a.sev === 'over' ? '<button class="btn sm" data-act="add-hearing" data-id="' + a.caseId + '">' + I('plus') + 'Add the hearing</button>' : '') +
      '<button class="btn sm" data-act="act-done" data-key="' + e(a.key) + '"' + (a.taskId ? ' data-task="' + a.taskId + '"' : '') + '>' + I('check') + 'Done</button>' +
      '<button class="btn sm ghost" data-act="act-snooze" data-key="' + e(a.key) + '">' + I('snooze') + 'Remind me later</button></div></div>';
  };

  /* ================= DASHBOARD ================= */
  V.board = {
    label: 'Dashboard', icon: 'board',
    count: () => { const c = M.counts(M.actions()); return { n: c.over + c.crit + c.soon, hot: c.over + c.crit > 0 }; },
    left() {
      const list = M.actions(), c = M.counts(list), f = st().sevFilter || '', em = M.emergencies();
      const shown = f ? list.filter((a) => a.sev === f) : list.filter((a) => a.sev !== 'watch');
      const hasSample = D().settings.sampleBanner && D().cases.some((x) => x.sample);
      let h = head('Dashboard', U.fmt(U.today(), true) + ' — everything the Legal Section has in hand, and what to do first',
        '<button class="btn" data-act="new-matter">' + I('plus') + 'Matter</button><button class="btn pri" data-act="new-case">' + I('plus') + 'Case</button>');
      if (hasSample) h += '<div class="banner">' + I('book') + '<span>The register opens with <b>example entries</b> so you can see how it works.</span><button class="btn sm" data-act="clear-examples">Clear examples</button></div>';
      // emergencies
      if (em.length) {
        h += '<div class="emerg"><div class="emerg-h">' + I('alert') + '<b>Emergencies — act today</b><span>' + em.length + '</span></div>' + em.map((a) =>
          '<div class="emerg-i"><div style="min-width:0"><div class="ref" ' + openOf(a) + '>' + e(a.ref || '') + (a.court ? ' <span>· ' + e(a.court) + '</span>' : '') + '</div><div class="eh">' + e(a.hint) + '</div></div>' +
          '<button class="btn sm" data-act="picture" data-kind="' + (a.caseId ? 'case' : a.matterId ? 'matter' : 'notice') + '" data-id="' + (a.caseId || a.matterId || a.noticeId) + '">See all</button></div>').join('') + '</div>';
      } else h += '<div class="calm">' + I('shield') + '<span>No emergencies today. Nothing is overdue, and no limitation or compliance date falls in the next few days.</span></div>';
      // one-box reference
      const q = st().qref || '', hits = q ? LR.find(q, 7) : [];
      h += '<div class="qref"><label for="qref">Look up anything by reference</label><div class="qbox">' + I('search') + '<input id="qref" class="field" placeholder="OA 1452/2025, file no., LOA / MOU no., party, RMC Kolkata…" value="' + e(q) + '" data-change="qref" autocomplete="off"></div>' +
        (q ? (hits.length ? '<div class="qhits">' + hits.map((x) => '<button data-act="picture" data-kind="' + x.kind + '" data-id="' + x.id + '"><span class="badge">' + e({ case: 'Case', matter: 'Matter', notice: 'Notice', counsel: 'Counsel' }[x.kind]) + '</span><b>' + e(x.t) + '</b><span class="s">' + e(x.s) + '</span><span class="badge ' + (x.open ? 'b-up' : 'b-done') + '">' + e(x.tag) + '</span></button>').join('') + '</div>' : '<div class="small muted" style="padding:6px 2px">Nothing matches “' + e(q) + '”.</div>') : '<div class="small muted" style="padding:6px 2px">Shows the complete picture — status, next date, deadlines, orders, counsel and what to do.</div>') + '</div>';
      h += '<div class="sev-strip">' + ['over', 'crit', 'soon', 'up', 'watch'].map((k) =>
        '<button style="--c:var(--' + k + ')" class="' + (f === k ? 'on' : '') + '" data-act="sev-filter" data-v="' + k + '"><b>' + c[k] + '</b><span>' + M.SEV[k] + '</span></button>').join('') + '</div>';
      if (!shown.length) h += '<div class="empty">' + (f ? 'Nothing under “' + M.SEV[f] + '”.' : 'Nothing pressing. Every deadline is more than ' + D().settings.alerts.compliance + ' days away.') + '</div>';
      let last = '';
      for (const a of shown) {
        if (!f && a.sev !== last) { h += '<h3 class="sec">' + M.SEV[a.sev] + ' <span class="c">' + c[a.sev] + '</span></h3>'; last = a.sev; }
        h += V.card(a);
      }
      if (!f && c.watch) h += '<p class="small muted" style="margin-top:14px">' + c.watch + ' more under <a href="#" data-act="sev-filter" data-v="watch">Watch</a> (contempt matters, interim orders, DoLA references without reply, cases without a date, fee bills).</p>';
      return h;
    },
    right() {
      const d = D(), T = U.today(), open = d.cases.filter(M.isOpen), mOpenL = d.matters.filter((m) => !R.MATTER_DONE.includes(m.status));
      let h = head('Cause List', 'Hearings in the next seven days', '<button class="btn" data-act="go" data-tab="hearings">' + I('calendar') + 'Calendar</button>');
      const days = [];
      for (let i = 0; i < 7; i++) { const k = U.addDays(T, i), l = open.filter((c) => c.nextDate === k); if (l.length) days.push([k, l]); }
      h += days.length ? days.map(([k, l]) => V.causeDay(k, l)).join('') : '<div class="empty">No hearings in the next seven days.</div>';
      let comply = 0;
      for (const c of d.cases) for (const o of c.orders || []) if (o.complianceDue && o.direction && M.orderOpen(o) && U.fromToday(o.complianceDue) <= 30) comply++;
      h += '<h3 class="sec">Work at a glance</h3><div class="tiles">' +
        '<div class="tile" data-act="cases-filter" data-v="open"><b>' + open.length + '</b><span>Cases pending</span></div>' +
        '<div class="tile" style="--c:var(--over)" data-act="cases-filter" data-v="contempt"><b>' + open.filter((c) => c.contempt).length + '</b><span>Contempt</span></div>' +
        '<div class="tile" style="--c:var(--soon)" data-act="go" data-tab="orders"><b>' + comply + '</b><span>Orders to comply (30 days)</span></div>' +
        '<div class="tile" style="--c:var(--up)" data-act="cases-filter" data-v="stay"><b>' + open.filter((c) => c.stay).length + '</b><span>Interim orders</span></div>' +
        '<div class="tile" data-act="go" data-tab="notices" data-sub="matters"><b>' + mOpenL.length + '</b><span>Opinions & vetting pending</span></div>' +
        '<div class="tile" style="--c:var(--watch)" data-act="go" data-tab="notices" data-sub="matters"><b>' + (mOpenL.filter((m) => m.status === 'Referred to DoLA').length + open.filter((c) => c.dola).length) + '</b><span>With DoLA</span></div>' +
        '<div class="tile" data-act="go" data-tab="notices" data-sub="notices"><b>' + d.notices.filter((n) => n.status === 'Open').length + '</b><span>Legal notices open</span></div>' +
        '<div class="tile" data-act="cases-filter" data-v="nfu"><b>' + open.filter((c) => /^NFU/.test(c.category || '')).length + '</b><span>NFU cases</span></div></div>';
      // opinions by type
      if (mOpenL.length) h += '<div class="chips">' + R.MATTER_TYPES.filter((t) => mOpenL.some((m) => m.type === t[0])).map((t) => '<button class="chip" data-act="mf" data-k="type" data-v="' + e(t[0]) + '">' + e(t[2]) + ' <b>' + mOpenL.filter((m) => m.type === t[0]).length + '</b></button>').join('') + '</div>';
      // region-wise
      const acts = M.actions();
      const regRows = M.regions().map((r) => {
        const cs = open.filter((c) => c.region === r);
        return { r, cases: cs.length, hear: cs.filter((c) => c.nextDate && U.fromToday(c.nextDate) >= 0 && U.fromToday(c.nextDate) <= 7).length,
          matters: mOpenL.filter((m) => m.region === r).length,
          urgent: acts.filter((a) => (a.sev === 'over' || a.sev === 'crit') && ((a.caseId && (M.caseById(a.caseId) || {}).region === r) || (a.matterId && (S.get('matters', a.matterId) || {}).region === r))).length };
      }).filter((x) => x.cases || x.matters);
      const none = open.filter((c) => !c.region).length;
      h += '<h3 class="sec">Region-wise</h3>' + (regRows.length ? '<table class="tbl"><tr><th>Region / RMC</th><th class="num">Cases</th><th class="num">Hearings 7 days</th><th class="num">Opinions</th><th class="num">Urgent</th></tr>' +
        regRows.map((x) => '<tr data-act="region" data-v="' + e(x.r) + '"><td>' + e(x.r) + '</td><td class="num">' + x.cases + '</td><td class="num">' + (x.hear || '–') + '</td><td class="num">' + (x.matters || '–') + '</td><td class="num">' + (x.urgent ? '<span class="badge b-over">' + x.urgent + '</span>' : '–') + '</td></tr>').join('') + '</table>' +
        (none ? '<p class="small muted">' + none + ' pending case(s) have no region — open them and choose one.</p>' : '') : '<div class="empty">No pending work.</div>');
      const au = d.audit.slice(0, 5);
      if (au.length) h += '<h3 class="sec">Recent changes <span class="r"><button class="btn sm ghost" data-act="go" data-tab="reports" data-sub="log">All</button></span></h3>' +
        au.map((x) => '<div class="small" style="padding:4px 0;border-bottom:1px solid var(--rule)"><b>' + e(x.by) + '</b> — ' + e(x.what) + ' <span class="muted">· ' + U.fmtTime(x.at) + '</span></div>').join('');
      return h;
    },
  };

  V.causeDay = (k, list) => {
    const n = U.fromToday(k);
    return '<div class="cl-day"><h4>' + U.fmt(k, true) + ' <span class="badge ' + (n === 0 ? 'b-crit' : n <= 2 ? 'b-soon' : 'b-up') + '">' + (n === 0 ? 'Today' : U.rel(k)) + '</span> <span class="muted" style="margin-left:auto;font-weight:500;text-transform:none;letter-spacing:0">' + U.plural(list.length, 'case') + '</span></h4>' +
      list.map((c) => { const cn = M.counsel(c.counselId);
        return '<div class="cl-item" data-act="open-case" data-id="' + c.id + '"><div><b style="font-family:var(--serif);color:var(--accent)">' + e(M.caseNo(c)) + '</b> <span class="muted small">· ' + e(M.courtShort(c)) + (c.bench ? ' (' + e(c.bench) + ')' : '') + '</span><div class="small">' + e(M.vs(c)) + '</div><div class="p">' + e(c.nextPurpose || 'Purpose not recorded') + (cn ? ' · ' + e(cn.name) : ' · no counsel recorded') + '</div></div><div>' + (c.contempt ? '<span class="badge b-over">Contempt</span>' : '') + (c.priority === 'high' ? ' <span class="badge b-acc">High</span>' : '') + '</div></div>'; }).join('') + '</div>';
  };

  /* ================= CASES ================= */
  function filtered() {
    const f = st().cf, q = U.norm(f.q);
    let list = D().cases.filter((c) => {
      if (f.status === 'open' && !M.isOpen(c)) return false;
      if (['Pending', 'Reserved', 'Disposed', 'Closed'].includes(f.status) && c.status !== f.status) return false;
      if (f.status === 'contempt' && !(c.contempt && M.isOpen(c))) return false;
      if (f.status === 'stay' && !(c.stay && M.isOpen(c))) return false;
      if (f.status === 'nfu' && !(/^NFU/.test(c.category || '') && M.isOpen(c))) return false;
      if (f.status === 'dola' && !c.dola) return false;
      if (f.region && c.region !== f.region) return false;
      if (f.court && c.courtId !== f.court) return false;
      if (f.cat && c.category !== f.cat) return false;
      if (f.office && c.office !== f.office) return false;
      if (q) {
        const hay = U.norm([M.caseNo(c), c.region, c.dolaRef, c.petitioner, c.respondents, c.subject, c.fileNo, c.office, c.nodal, c.linked, c.limbs, M.courtShort(c)].join(' '));
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const s = f.sort || 'next';
    if (s === 'next') list.sort((a, b) => (M.isOpen(b) - M.isOpen(a)) || ((a.nextDate || '9999') < (b.nextDate || '9999') ? -1 : (a.nextDate || '9999') > (b.nextDate || '9999') ? 1 : 0));
    if (s === 'new') list.sort(U.by((c) => c.filedOn || '', -1));
    if (s === 'old') list.sort(U.by((c) => c.filedOn || ''));
    if (s === 'no') list.sort(U.by((c) => M.caseNo(c)));
    if (s === 'prio') list.sort(U.by((c) => ({ high: 0, normal: 1, low: 2 }[c.priority] ?? 1)));
    return list;
  }
  V.filteredCases = filtered;

  V.cases = {
    label: 'Cases', icon: 'folder',
    count: () => ({ n: D().cases.filter((c) => c.status === 'Pending' || c.status === 'Reserved').length }),
    left() {
      const f = st().cf, list = filtered();
      const courts = D().courts.slice().sort(U.by('name')).filter((ct) => D().cases.some((c) => c.courtId === ct.id));
      const offices = [...new Set(D().cases.map((c) => c.office).filter(Boolean))].sort();
      let h = head('Case Register', U.plural(list.length, 'case') + ' shown of ' + D().cases.length, '<button class="btn" data-act="export-cases" title="Export to Excel (CSV)">' + I('download') + 'CSV</button><button class="btn pri" data-act="new-case">' + I('plus') + 'New case</button>');
      h += '<div class="chips">' + [['open', 'Pending & reserved'], ['Pending', 'Pending'], ['Reserved', 'Reserved'], ['Disposed', 'Disposed'], ['Closed', 'Closed'], ['contempt', 'Contempt'], ['stay', 'Interim orders'], ['nfu', 'NFU'], ['dola', 'DoLA'], ['all', 'All']]
        .map(([v, l]) => '<button class="chip ' + (f.status === v ? 'on' : '') + '" data-act="cases-filter" data-v="' + v + '">' + l + '</button>').join('') + '</div>';
      h += '<div class="filters"><input class="field" id="cf-q" placeholder="Search number, party, subject, file no…" value="' + e(f.q || '') + '" data-change="cf-q">' +
        '<select class="field" data-change="cf-region"><option value="">All regions</option>' + M.regions().filter((r) => D().cases.some((c) => c.region === r)).map((r) => '<option' + (f.region === r ? ' selected' : '') + '>' + e(r) + '</option>').join('') + '</select>' +
        '<select class="field" data-change="cf-court"><option value="">All courts</option>' + courts.map((c) => '<option value="' + c.id + '"' + (f.court === c.id ? ' selected' : '') + '>' + e(c.short || c.name) + '</option>').join('') + '</select>' +
        '<select class="field" data-change="cf-cat"><option value="">All subjects</option>' + R.CATEGORIES.filter((k) => D().cases.some((c) => c.category === k)).map((k) => '<option' + (f.cat === k ? ' selected' : '') + '>' + e(k) + '</option>').join('') + '</select>' +
        (offices.length > 1 ? '<select class="field" data-change="cf-office"><option value="">All offices</option>' + offices.map((k) => '<option' + (f.office === k ? ' selected' : '') + '>' + e(k) + '</option>').join('') + '</select>' : '') +
        '<select class="field" data-change="cf-sort">' + [['next', 'Next date first'], ['prio', 'Priority'], ['new', 'Newest filed'], ['old', 'Oldest filed'], ['no', 'Case number']].map(([v, l]) => '<option value="' + v + '"' + ((f.sort || 'next') === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>';
      if (!list.length) return h + '<div class="empty">No case matches.</div>';
      h += '<div class="reg">' + list.map((c) => {
        const n = c.nextDate ? U.fromToday(c.nextDate) : null;
        return '<div class="rrow ' + (st().caseId === c.id ? 'sel' : '') + '" data-act="open-case" data-id="' + c.id + '"><div style="min-width:0"><div class="no">' + e(M.caseNo(c)) + ' <span class="muted" style="font:500 11.5px var(--sans)">· ' + e(M.courtShort(c)) + '</span></div>' +
          '<div class="ti">' + e(M.vs(c)) + '</div><div class="mt">' + (c.region ? '<span><b>' + e(c.region) + '</b></span>' : '') + (c.category ? '<span>' + e(c.category) + '</span>' : '') + (c.office ? '<span>' + e(c.office) + '</span>' : '') +
          (c.contempt ? '<span class="badge b-over">Contempt</span>' : '') + (c.dola ? '<span class="badge b-watch">DoLA</span>' : '') + (c.stay && M.isOpen(c) ? '<span class="badge b-up">Interim order</span>' : '') + (c.priority === 'high' && M.isOpen(c) ? '<span class="badge b-acc">High</span>' : '') + (c.sample ? '<span class="badge">Example</span>' : '') + '</div></div>' +
          '<div class="rt">' + (M.isOpen(c) ? (c.nextDate ? '<span class="when">' + U.fmtShort(c.nextDate) + '<small>' + (n < 0 ? '<span style="color:var(--over)">' + U.rel(c.nextDate) + '</span>' : U.rel(c.nextDate)) + '</small></span>' : '<span class="when muted">no date</span>') + '<span class="badge ' + (c.status === 'Reserved' ? 'b-watch' : 'b-up') + '">' + e(c.status) + '</span>'
            : '<span class="badge ' + (/against/i.test(c.result || '') ? 'b-over' : /favour/i.test(c.result || '') ? 'b-done' : '') + '">' + e(c.result || c.status) + '</span>') + '</div></div>';
      }).join('') + '</div>';
      return h;
    },
    right() {
      const c = st().caseId && M.caseById(st().caseId);
      if (!c && st().cf.region) return V.regionPicture(st().cf.region);
      if (!c) {
        return head('Case Details', 'Choose a case on the left') + '<div class="empty" style="text-align:center;padding-top:40px">' + LR.emblem('') .replace('<svg', '<svg style="width:120px;height:120px;opacity:.35;color:var(--accent)"') + '<br>Choose a case on the left, or add a new one.</div>' +
          '<div style="text-align:center;margin-top:10px"><button class="btn pri" data-act="new-case">' + I('plus') + 'New case</button></div>';
      }
      return V.caseDetail(c);
    },
  };

  V.regionPicture = (r) => {
    const cs = D().cases.filter((c) => c.region === r), open = cs.filter(M.isOpen);
    const ms = D().matters.filter((m) => m.region === r && !R.MATTER_DONE.includes(m.status));
    const acts = M.actions().filter((a) => (a.caseId && cs.some((c) => c.id === a.caseId)) || (a.matterId && ms.some((m) => m.id === a.matterId)));
    const counsel = [...new Set(open.map((c) => (M.counsel(c.counselId) || {}).name).filter(Boolean))];
    return head(e(r), 'The region at a glance', '<button class="btn" data-act="cf-clear-region">Show all regions</button>') +
      '<div class="tiles"><div class="tile"><b>' + open.length + '</b><span>Cases pending</span></div><div class="tile" style="--c:var(--over)"><b>' + open.filter((c) => c.contempt).length + '</b><span>Contempt</span></div>' +
      '<div class="tile"><b>' + cs.filter((c) => !M.isOpen(c)).length + '</b><span>Disposed / closed</span></div><div class="tile"><b>' + ms.length + '</b><span>Opinions pending</span></div></div>' +
      '<h3 class="sec">What needs doing <span class="c">' + acts.filter((a) => a.sev !== 'watch').length + '</span></h3>' + (acts.filter((a) => a.sev !== 'watch').map(V.card).join('') || '<div class="empty">Nothing pressing in this region.</div>') +
      (ms.length ? '<h3 class="sec">Opinions &amp; vetting</h3>' + ms.map(V.matterRow).join('') : '') +
      (counsel.length ? '<h3 class="sec">Counsel for this region</h3><p class="small">' + counsel.map(e).join(' · ') + '</p>' : '');
  };

  V.caseDetail = (c) => {
    const tab = st().caseTab || 'summary', cn = M.counsel(c.counselId), ct = M.court(c);
    const acts = M.actions().filter((a) => a.caseId === c.id);
    const tasks = D().tasks.filter((t) => t.caseId === c.id);
    let h = '<div class="case-head"><div style="min-width:0"><div class="no">' + e(M.caseNo(c)) + '</div><div class="court">' + e(ct ? ct.name : '') + (c.bench ? ' · ' + e(c.bench) : '') + (ct && ct.site ? ' · <a href="' + e(U.safeUrl(ct.site)) + '" target="_blank" rel="noopener">website</a>' : '') + '</div>' +
      '<div class="vs">' + e(c.petitioner || '—') + '<em>versus</em>' + e(c.respondents || '—') + '</div></div>' +
      '<div class="st">' + (M.isOpen(c) ? '<span class="badge b-up">' + e(c.status) + '</span>' : '<span class="stamp" style="--c:' + (/against/i.test(c.result || '') ? 'var(--over)' : 'var(--done)') + '">' + e(c.status) + '</span>') +
      '<div style="display:flex;gap:2px"><button class="icon-btn" title="Complete picture" data-act="picture" data-kind="case" data-id="' + c.id + '">' + I('list') + '</button><button class="icon-btn" title="Edit case" data-act="edit-case" data-id="' + c.id + '">' + I('edit') + '</button><button class="icon-btn" title="Print case sheet" data-act="print-case" data-id="' + c.id + '">' + I('print') + '</button><button class="icon-btn" title="More" data-act="case-menu" data-id="' + c.id + '">' + I('more') + '</button></div></div></div>';
    if (c.contempt || c.stay) h += '<div class="chips">' + (c.contempt ? '<span class="badge b-over">' + I('alert') + 'Contempt matter</span>' : '') + (c.stay ? '<span class="badge b-up">' + I('shield') + e(c.stayText || 'Interim order in force') + '</span>' : '') + '</div>';
    const tabs = [['summary', 'Summary'], ['hearings', 'Hearings', (c.hearings || []).length], ['orders', 'Orders', (c.orders || []).length], ['docs', 'Documents', (c.docs || []).length], ['letters', 'Letters', (c.letters || []).length], ['tasks', 'Follow-ups', tasks.filter((t) => !t.done).length], ['actions', 'Actions', acts.length]];
    h += '<div class="ctabs">' + tabs.map(([k, l, n]) => '<button class="' + (tab === k ? 'on' : '') + '" data-act="case-tab" data-v="' + k + '">' + l + (n ? '<span>' + n + '</span>' : '') + '</button>').join('') + '</div>';

    if (tab === 'summary') {
      const nx = c.nextDate ? U.fmt(c.nextDate, true) + ' <span class="muted">(' + U.rel(c.nextDate) + ')</span>' + (c.nextPurpose ? ' — ' + e(c.nextPurpose) : '') : '<span class="muted">not recorded</span>';
      const rows = [
        ['Next date', M.isOpen(c) ? nx : '—'], ['Stage', e(c.stage || '')], ['Result', e(c.result || '—')],
        ['Subject', e(c.category || '') + (c.subject ? '<div>' + U.nl(c.subject) + '</div>' : '')], ['Relief sought', U.nl(c.relief || '')],
        ['IMD is', e(c.imdRole || '')], ['Region / RMC', e(c.region || '')], ['Office / section', e([c.office, c.section].filter(Boolean).join(' · '))], ['DoLA', c.dola ? e(c.dolaRef || 'Involved') : ''], ['Officer-in-charge', e(c.nodal || '')],
        ['Government counsel', cn ? '<a href="#" data-act="open-counsel" data-id="' + cn.id + '">' + e(cn.name) + '</a>' + (cn.phone ? ' · ' + e(cn.phone) : '') : '<span style="color:var(--over)">not recorded</span>'],
        ['Other side’s counsel', e(c.oppCounsel || '')],
        ['Filed / notice', [c.filedOn && 'Filed ' + U.fmt(c.filedOn), c.noticeOn && 'notice received ' + U.fmt(c.noticeOn)].filter(Boolean).join(', ')],
        ['Reply', [c.replyDue && 'due ' + U.fmt(c.replyDue), c.paraSentOn && 'para-wise sent ' + U.fmt(c.paraSentOn), c.counterOn && 'filed ' + U.fmt(c.counterOn)].filter(Boolean).join(' · ') || '—'],
        ['Financial implication', c.amount ? U.money(c.amount) : '—'], ['e-Office file', e(c.fileNo || '')], ['LIMBS / ID', e(c.limbs || '')], ['Connected cases', e(c.linked || '')],
        ['Notes', U.nl(c.notes || '')],
      ].filter((r) => r[1] !== '' && r[1] != null);
      h += '<div class="sheet">' + rows.map(([k, v]) => '<div class="k">' + k + '</div><div>' + v + '</div>').join('') + '</div>';
      h += '<p class="small muted">Added ' + U.fmtTime(c.createdAt) + (c.updatedAt ? ' · last changed ' + U.fmtTime(c.updatedAt) : '') + '</p>';
    }
    if (tab === 'hearings') {
      h += '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn pri sm" data-act="add-hearing" data-id="' + c.id + '">' + I('plus') + 'Add hearing</button></div>';
      const list = (c.hearings || []).slice().sort(U.by('date', -1));
      h += list.length ? '<div class="tl">' + (M.isOpen(c) && c.nextDate ? '<div class="tl-item" style="--c:var(--up)"><div class="d">' + U.fmt(c.nextDate, true) + ' <span class="badge b-up">Next date</span></div><div class="b">' + e(c.nextPurpose || '') + '</div></div>' : '') +
        list.map((x) => '<div class="tl-item"><div class="d">' + U.fmt(x.date, true) + (x.purpose ? ' <span class="badge">' + e(x.purpose) + '</span>' : '') + '<span class="act"><button class="icon-btn" data-act="edit-hearing" data-id="' + c.id + '" data-sub="' + x.id + '">' + I('edit') + '</button></span></div>' +
          (x.proceedings ? '<div class="b">' + e(x.proceedings) + '</div>' : '') + '<div class="x">' + [x.item, x.attended && 'Attended by ' + x.attended, x.nextDate && 'Next: ' + U.fmt(x.nextDate) + (x.nextPurpose ? ' (' + x.nextPurpose + ')' : '')].filter(Boolean).map(e).join(' · ') + '</div></div>').join('') + '</div>' : '<div class="empty">No hearings recorded yet.</div>';
    }
    if (tab === 'orders') {
      h += '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn pri sm" data-act="add-order" data-id="' + c.id + '">' + I('plus') + 'Add order / judgment</button></div>';
      const list = (c.orders || []).slice().sort(U.by('date', -1));
      h += list.length ? '<div class="tl">' + list.map((o) => {
        const L = M.adverse(o) && o.kind !== 'Interim order' ? M.limitation(c, o) : null;
        const col = M.adverse(o) ? 'var(--over)' : /favour/i.test(o.result || '') ? 'var(--done)' : 'var(--accent)';
        return '<div class="tl-item" style="--c:' + col + '"><div class="d">' + U.fmt(o.date) + ' <span class="badge">' + e(o.kind || '') + '</span>' + (o.result ? ' <span class="badge ' + (M.adverse(o) ? 'b-over' : 'b-done') + '">' + e(o.result) + '</span>' : '') +
          '<span class="act"><button class="icon-btn" data-act="edit-order" data-id="' + c.id + '" data-sub="' + o.id + '">' + I('edit') + '</button></span></div>' +
          (o.summary ? '<div class="b">' + e(o.summary) + '</div>' : '') + (o.direction ? '<div class="b"><b>Direction:</b> ' + e(o.direction) + '</div>' : '') +
          '<div class="x">' + [o.copyOn && 'Copy received ' + U.fmt(o.copyOn), o.complianceDue && 'Comply by <b>' + U.fmt(o.complianceDue) + '</b> (' + U.rel(o.complianceDue) + ')', o.action && 'Action: ' + e(o.action), o.compliedOn && 'Complied ' + U.fmt(o.compliedOn), o.appealRef && 'Appeal: ' + e(o.appealRef)].filter(Boolean).join(' · ') + '</div>' +
          (L && L.key !== 'none' ? '<div class="x" style="color:var(--ink2)">' + I('clock').replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-2px"') + ' ' + e(L.r.label) + ': ' + (L.last ? '<b>last date ' + U.fmt(L.last) + '</b> (' + U.rel(L.last) + ')' : L.target ? 'no fixed period; target ' + U.fmt(L.target) : '') + '<div class="law">' + e(L.law || '') + '</div></div>' : '') + '</div>';
      }).join('') + '</div>' : '<div class="empty">No orders recorded yet.</div>';
    }
    if (tab === 'docs') {
      h += '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn pri sm" data-act="add-doc" data-id="' + c.id + '">' + I('plus') + 'Add document</button></div>';
      const list = (c.docs || []).slice().sort(U.by('date', -1));
      h += list.length ? '<table class="tbl"><tr><th>Date</th><th>Document</th><th>Ref.</th><th></th></tr>' + list.map((x) => '<tr data-act="edit-doc" data-id="' + c.id + '" data-sub="' + x.id + '"><td style="white-space:nowrap">' + U.fmt(x.date) + '</td><td><b>' + e(x.title) + '</b><div class="muted small">' + e(x.kind || '') + '</div></td><td>' + e(x.ref || '') + '</td><td>' + (x.link ? '<a href="' + e(U.safeUrl(x.link)) + '" target="_blank" rel="noopener" data-stop>' + I('link').replace('<svg', '<svg style="width:15px"') + '</a>' : '') + '</td></tr>').join('') + '</table>' : '<div class="empty">No documents listed. Keep the petition, para-wise comments, counter, orders and opinions here (with a link to where each is kept).</div>';
    }
    if (tab === 'letters') {
      h += '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn pri sm" data-act="add-letter" data-id="' + c.id + '">' + I('plus') + 'Add letter</button></div>';
      const list = (c.letters || []).slice().sort(U.by('date', -1));
      h += list.length ? '<table class="tbl"><tr><th>Date</th><th></th><th>With</th><th>Subject</th></tr>' + list.map((x) => '<tr data-act="edit-letter" data-id="' + c.id + '" data-sub="' + x.id + '"><td style="white-space:nowrap">' + U.fmt(x.date) + '</td><td><span class="badge ' + (x.dir === 'in' ? 'b-up' : 'b-done') + '">' + (x.dir === 'in' ? 'In' : 'Out') + '</span></td><td>' + e(x.with || '') + '</td><td>' + e(x.subject) + (x.ref ? '<div class="muted small">' + e(x.ref) + '</div>' : '') + (x.replyBy ? '<div class="small" style="color:var(--soon)">Reply by ' + U.fmt(x.replyBy) + '</div>' : '') + '</td></tr>').join('') + '</table>' : '<div class="empty">No correspondence recorded.</div>';
    }
    if (tab === 'tasks') {
      h += '<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn pri sm" data-act="add-task" data-id="' + c.id + '">' + I('plus') + 'Add follow-up</button></div>';
      h += tasks.length ? tasks.sort(U.by('due')).map(V.taskRow).join('') : '<div class="empty">No follow-ups.</div>';
    }
    if (tab === 'actions') h += acts.length ? acts.map(V.card).join('') : '<div class="empty">Nothing to do for this case right now.</div>';
    return h;
  };

  V.taskRow = (t) => {
    const c = t.caseId ? M.caseById(t.caseId) : null, n = t.due ? U.fromToday(t.due) : null;
    return '<div class="rrow" style="grid-template-columns:auto 1fr auto;align-items:center"><button class="icon-btn" data-act="task-toggle" data-id="' + t.id + '" title="' + (t.done ? 'Not done' : 'Done') + '" style="border:1.5px solid var(--rule2);border-radius:50%;width:24px;height:24px;' + (t.done ? 'background:var(--done);color:#fff;border-color:var(--done)' : '') + '">' + (t.done ? I('check') : '') + '</button>' +
      '<div data-act="edit-task" data-id="' + t.id + '" style="' + (t.done ? 'text-decoration:line-through;opacity:.6' : '') + '"><div style="font-size:13.5px">' + e(t.text) + '</div><div class="mt">' + (c ? '<span>' + e(M.caseNo(c)) + '</span>' : '') + (t.who ? '<span>' + e(t.who) + '</span>' : '') + '</div></div>' +
      '<div class="when">' + (t.due ? U.fmtShort(t.due) + '<small style="' + (n < 0 && !t.done ? 'color:var(--over)' : '') + '">' + U.rel(t.due) + '</small>' : '') + '</div></div>';
  };
})();
