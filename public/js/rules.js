/* js/rules.js — case helpers, limitation dates, and the preemptive action engine.
   LR.rules.actions() reads the whole register and returns what needs doing, most urgent first. */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util, R = LR.refs;
  const M = LR.rules = {};
  const D = () => LR.store.data;
  const A = () => D().settings.alerts;

  M.caseNo = (c) => c ? ((c.caseType || '') + ' ' + (c.number || '?') + (c.year ? '/' + c.year : '')).trim() : '';
  M.court = (c) => (D().courts.find((x) => x.id === c.courtId)) || null;
  M.courtShort = (c) => { const ct = M.court(c); return ct ? ct.short || ct.name : (c.courtText || ''); };
  M.vs = (c) => (c.petitioner || '—') + ' vs ' + (c.respondents || '—');
  M.isOpen = (c) => c.status === 'Pending' || c.status === 'Reserved';
  M.counsel = (id) => D().counsel.find((x) => x.id === id) || null;
  M.caseById = (id) => D().cases.find((x) => x.id === id) || null;

  M.lastHearing = (c) => (c.hearings || []).slice().sort(U.by('date', -1))[0] || null;
  /** Add or edit a hearing; keep the case's next date in step with the latest hearing. */
  M.syncNext = (c) => {
    const last = M.lastHearing(c);
    if (!last) return;
    if (last.nextDate) { c.nextDate = last.nextDate; c.nextPurpose = last.nextPurpose || ''; }
    else if (c.nextDate && c.nextDate <= last.date) { c.nextDate = ''; c.nextPurpose = ''; }
  };

  /** Limitation for a remedy against an order. Returns { r, from, last, target, law }. */
  M.limitation = (c, o) => {
    const ct = M.court(c);
    const key = o.remedy || R.defaultRemedy(ct && ct.kind, c.bench);
    const r = R.REMEDIES[key] || R.REMEDIES.none;
    const base = r.from === 'copy' ? (o.copyOn || o.date) : o.date;
    if (!base) return { key, r, from: null, last: null };
    const last = r.days ? (key === 'arb-34' ? U.addMonths(base, 3) : U.addDays(base, r.days)) : null;
    const target = !r.days && key === 'writ-hc' ? U.addDays(base, A().writTarget || 90) : null;
    return { key, r, from: base, last, target, law: r.law };
  };
  M.adverse = (o) => /against/i.test(o.result || '');
  M.orderOpen = (o) => !['Complied', 'No action needed', 'Appeal / review filed'].includes(o.action);

  function sev(days, win) {
    if (days < 0) return 'over';
    if (days <= 2) return 'crit';
    if (days <= 7) return 'soon';
    if (days <= win) return 'up';
    return null;
  }
  M.SEV = { over: 'Overdue', crit: 'Within 2 days', soon: 'This week', up: 'Coming up', watch: 'Watch' };
  M.RANK = { over: 0, crit: 1, soon: 2, up: 3, watch: 4 };
  M.whenText = (days) => days == null ? '' : days < 0 ? Math.abs(days) + (Math.abs(days) === 1 ? ' day' : ' days') + ' overdue' : days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days';

  M.actions = (opts = {}) => {
    const d = D(), T = U.today(), al = A(), out = [];
    const push = (a) => {
      const st = d.actionState[a.key];
      if (st && st.done && !opts.all) return;
      if (st && st.snooze && st.snooze > T && !opts.all) return;
      a.days = a.due ? U.diff(T, a.due) : null;
      out.push(a);
    };
    for (const c of d.cases) {
      const no = M.caseNo(c), open = M.isOpen(c), base = { caseId: c.id, ref: no, court: M.courtShort(c), sample: c.sample };
      if (open) {
        // 1. hearings
        if (c.nextDate) {
          const n = U.diff(T, c.nextDate);
          const recorded = (c.hearings || []).some((h) => h.date >= c.nextDate);
          if (n < 0 && !recorded) {
            push(Object.assign({}, base, { key: 'upd:' + c.id + ':' + c.nextDate, kind: 'hearing', sev: 'over', due: c.nextDate,
              title: 'Record what happened on ' + U.fmt(c.nextDate) + ' and the next date', steps: ['Get the order sheet / daily order from counsel or the court website.', 'Add the hearing in the case and enter the next date of hearing.'] }));
          } else if (n >= 0) {
            const s = sev(n, al.hearing);
            if (s) {
              const steps = ['Check the cause list for the item number and court room.', 'Brief counsel and send the latest instructions and documents.', 'Name an officer to attend with the file.'];
              if (c.replyDue && !c.counterOn) steps.unshift('Counter / reply not yet filed — ask counsel to file it or seek time on this date.');
              if (c.contempt) steps.unshift('Contempt matter — keep the compliance affidavit ready; the officer may be asked to appear.');
              if (c.stay) steps.push('Interim order in force — ask counsel to seek its continuation.');
              push(Object.assign({}, base, { key: 'hear:' + c.id + ':' + c.nextDate, kind: 'hearing', sev: s, due: c.nextDate,
                title: (n === 0 ? 'Hearing today' : 'Hearing ' + U.rel(c.nextDate)) + (c.nextPurpose ? ' — ' + c.nextPurpose : ''), steps }));
            }
          }
        } else if (c.status === 'Pending') {
          push(Object.assign({}, base, { key: 'nodate:' + c.id + ':' + (M.lastHearing(c) || {}).date, kind: 'hearing', sev: 'watch', due: null,
            title: 'No next date of hearing recorded', steps: ['Check the court website / cause list or ask counsel.', 'Enter the next date in the case.'] }));
        }
        // 2. reply / counter
        if (c.replyDue && !c.counterOn) {
          const n = U.diff(T, c.replyDue), s = sev(n, al.reply);
          if (s) {
            const steps = [];
            if (!c.paraSentOn) steps.push('Send approved para-wise comments to counsel now (aim: 10 days before the due date).');
            steps.push('Get the draft counter from counsel, check it against records, and arrange the deponent.');
            if (n < 0) steps.push('Overdue — ask counsel to file at once or seek time; make sure the right to file is not closed.');
            push(Object.assign({}, base, { key: 'reply:' + c.id + ':' + c.replyDue, kind: 'reply', sev: s, due: c.replyDue, title: 'Counter / reply due ' + U.fmt(c.replyDue), steps }));
          }
        } else if (c.noticeOn && !c.paraSentOn && !c.counterOn && c.status === 'Pending') {
          const due = U.addDays(c.noticeOn, al.paraDays || 15), n = U.diff(T, due), s = sev(n, 7);
          if (s) push(Object.assign({}, base, { key: 'para:' + c.id, kind: 'reply', sev: s, due,
            title: 'Prepare para-wise comments (notice received ' + U.fmt(c.noticeOn) + ')', steps: ['Collect facts and records from ' + (c.section || 'the dealing section') + '.', 'Draft para-wise comments (format in Ready Reference) and get approval.'] }));
        }
        // 3. no counsel
        if (!c.counselId && c.imdRole !== 'Petitioner / Applicant' && c.caseType !== 'Arbitration') {
          push(Object.assign({}, base, { key: 'counsel:' + c.id, kind: 'counsel', sev: c.nextDate && U.diff(T, c.nextDate) <= 7 ? 'soon' : 'watch', due: c.nextDate || null,
            title: 'No Government counsel recorded for this case', steps: ['Find the CGSC / panel counsel for this bench and send the brief.', 'Enter the counsel in the case.'] }));
        }
        // 4. reserved too long
        if (c.status === 'Reserved' && c.reservedOn && U.diff(c.reservedOn, T) >= (al.reserved || 90)) {
          push(Object.assign({}, base, { key: 'resv:' + c.id + ':' + Math.floor(U.diff(c.reservedOn, T) / 30), kind: 'watch', sev: 'watch', due: null,
            title: 'Judgment reserved for ' + U.diff(c.reservedOn, T) + ' days', steps: ['Watch the pronouncement list; ask counsel to mention if the delay is long.'] }));
        }
        // 5. dormant
        const lh = M.lastHearing(c);
        const since = lh ? lh.date : c.filedOn;
        if (c.status === 'Pending' && since && U.diff(since, T) >= (al.dormant || 180) && (!c.nextDate || c.nextDate < T)) {
          push(Object.assign({}, base, { key: 'dorm:' + c.id + ':' + since, kind: 'watch', sev: 'watch', due: null,
            title: 'No hearing recorded for ' + U.diff(since, T) + ' days', steps: ['Check the case status online; it may have been listed or disposed.'] }));
        }
        // 6. contempt / stay watch
        if (c.contempt) push(Object.assign({}, base, { key: 'cp:' + c.id, kind: 'watch', sev: 'watch', due: null, title: 'Contempt proceedings pending', steps: ['Complete compliance first; file a compliance affidavit.', 'Keep the officer named in the petition informed.'] }));
        if (c.stay) push(Object.assign({}, base, { key: 'stay:' + c.id, kind: 'watch', sev: 'watch', due: null, title: 'Interim order in force', steps: [c.stayText || 'Follow the interim order and get it continued on every date.'] }));
      }
      // 7. orders: compliance and appeal limitation (open or disposed cases)
      for (const o of c.orders || []) {
        if (!M.orderOpen(o)) continue;
        if (o.complianceDue && o.direction) {
          const n = U.diff(T, o.complianceDue), s = sev(n, al.compliance);
          if (s) {
            const steps = n < 0
              ? ['Time for compliance is over — CONTEMPT RISK.', 'Comply at once, or file an application for extension of time / appeal with stay today.', 'Inform counsel and the competent authority.']
              : ['Decide now: comply, or challenge the order.', 'If challenging: file the appeal / review and seek a stay before ' + U.fmt(o.complianceDue) + '.', 'If more time is needed: file an application for extension of time before the due date.', 'Get the approval of the competent authority on file.'];
            push(Object.assign({}, base, { key: 'comp:' + c.id + ':' + o.id + ':' + o.complianceDue, kind: 'order', sev: s, due: o.complianceDue,
              title: 'Comply with order of ' + U.fmt(o.date) + ' by ' + U.fmt(o.complianceDue), note: o.direction, steps, orderId: o.id }));
          }
        }
        if (M.adverse(o) && o.kind !== 'Interim order' && o.action !== 'Comply') {
          const L = M.limitation(c, o);
          const due = L.last || L.target;
          if (due && L.key !== 'none') {
            const n = U.diff(T, due), s = sev(n, al.appeal);
            if (s) push(Object.assign({}, base, { key: 'appeal:' + c.id + ':' + o.id + ':' + due, kind: 'order', sev: s, due,
              title: (L.last ? 'Last date: ' : 'Target date: ') + L.r.label + ' — ' + U.fmt(due),
              note: L.law, orderId: o.id,
              steps: [ 'Obtain counsel’s opinion on the merits of ' + L.r.label.toLowerCase() + '.',
                'Send the proposal with the opinion to the competent authority / Ministry / DoLA — at least 30 days before the last date.',
                L.last ? 'Do not wait for the last day; delay beyond this date needs a condonation application.' : 'No fixed period — but delay can defeat the petition.' ] }));
          }
        }
      }
    }
    // 8. tasks (follow-ups)
    for (const t of d.tasks) {
      if (t.done || !t.due) continue;
      const n = U.diff(T, t.due), s = sev(n, 7);
      if (!s) continue;
      const c = t.caseId ? M.caseById(t.caseId) : null;
      push({ key: 'task:' + t.id + ':' + t.due, kind: 'task', sev: s, due: t.due, title: t.text, caseId: c ? c.id : null, ref: c ? M.caseNo(c) : 'Follow-up', court: c ? M.courtShort(c) : '', taskId: t.id, steps: t.who ? ['With: ' + t.who] : [], sample: t.sample });
    }
    // 9. notices
    for (const n0 of d.notices) {
      if (n0.status !== 'Open' || !n0.replyDue) continue;
      const n = U.diff(T, n0.replyDue), s = sev(n, al.reply);
      if (s) push({ key: 'notice:' + n0.id + ':' + n0.replyDue, kind: 'notice', sev: s, due: n0.replyDue, ref: n0.kind, court: n0.from, noticeId: n0.id, sample: n0.sample,
        title: 'Reply to ' + n0.kind.toLowerCase() + ' from ' + (n0.from || '—'), note: n0.subject,
        steps: ['Examine the claim with ' + (n0.office || 'the dealing office') + '; settle it if it is just.', 'Send a reasoned reply after vetting; keep proof of dispatch.'] });
    }
    // 10. advisory & vetting matters (LOA/MOU, RTI opinions, recruitment, administrative, DoLA)
    for (const m of d.matters || []) {
      if (R.MATTER_DONE.includes(m.status)) continue;
      const base = { matterId: m.id, ref: R.matterShort(m.type) + (m.ref ? ' · ' + m.ref : ''), court: m.region || m.fromOffice || '', sample: m.sample, kind: 'matter' };
      if (m.status === 'Referred to DoLA') {
        const since = m.dolaOn || m.receivedOn;
        if (since && U.diff(since, T) >= (al.dola || 30)) push(Object.assign({}, base, { key: 'dola:' + m.id + ':' + Math.floor(U.diff(since, T) / 15), sev: 'watch', due: null,
          title: 'No reply from DoLA for ' + U.diff(since, T) + ' days', note: m.subject, steps: ['Send a reminder quoting ' + (m.dolaRef || 'the reference number') + '.', 'If a court date depends on it, tell counsel to seek time.'] }));
        continue;
      }
      if (!m.dueOn) continue;
      const n = U.diff(T, m.dueOn), s0 = sev(n, al.matter || 3);
      if (!s0) continue;
      const steps = {
        'LOA / MOU vetting': ['Check parties, signatory powers, scope, payment, IPR / data, termination and dispute clauses (checklist in Ready Reference).', 'Return the vetted draft with changes marked.'],
        'RTI — legal opinion': ['The CPIO’s 30-day period is running — give the opinion today if possible.', 'Check s.8(1)(b) (court bar), s.8(1)(j), s.11 third-party procedure and s.10 severance.'],
        'Recruitment / extension': ['Check the Recruitment Rules / DoPT instructions and the competent authority.', 'Look for court orders on the same post or batch.'],
        'DoLA reference': ['Send a self-contained reference with documents and the last date.'],
      }[m.type] || ['Examine and give the opinion on file.'];
      if (m.status === 'Clarification sought') steps.unshift('Clarification asked from ' + (m.fromOffice || 'the office') + ' — remind them.');
      push(Object.assign({}, base, { key: 'mat:' + m.id + ':' + m.dueOn, sev: s0, due: m.dueOn, title: m.type + ' — opinion due', note: m.subject, steps }));
    }
    // 11. counsel panel term and fee bills
    for (const cn of d.counsel) {
      if (!cn.termTo) continue;
      const n = U.diff(T, cn.termTo), s = sev(n, al.panel || 60);
      if (s) push({ key: 'panel:' + cn.id + ':' + cn.termTo, kind: 'counsel', sev: s === 'up' ? 'watch' : s, due: cn.termTo, ref: cn.name, court: cn.type, counselId: cn.id, sample: cn.sample,
        title: 'Engagement of ' + cn.name + ' ends ' + U.fmt(cn.termTo), steps: ['Check with DoLA / the Ministry on renewal.', 'Arrange other counsel for the cases this counsel handles: ' + d.cases.filter((c) => c.counselId === cn.id && M.isOpen(c)).length + ' pending.'] });
    }
    for (const f of d.fees) {
      if (f.status === 'Paid' || f.status === 'Returned' || !f.billDate) continue;
      const age = U.diff(f.billDate, T);
      if (age >= (al.fees || 60)) {
        const cn = M.counsel(f.counselId);
        push({ key: 'fee:' + f.id, kind: 'fee', sev: 'watch', due: null, ref: 'Fee bill ' + (f.billNo || ''), court: cn ? cn.name : '', feeId: f.id, sample: f.sample,
          title: 'Counsel fee bill pending for ' + age + ' days — ' + U.money(f.amount), steps: ['Status: ' + f.status + '. Push it to the DDO / PAO for payment.'] });
      }
    }
    out.sort((a, b) => (M.RANK[a.sev] - M.RANK[b.sev]) || ((a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : 0));
    return out;
  };

  /** Emergencies: what must be acted on today. Each has a short hint. */
  M.emergencies = () => {
    const list = M.actions(), out = [];
    for (const a of list) {
      const n = a.days;
      let hint = null;
      if (a.kind === 'order' && a.key.startsWith('comp:') && n != null && n <= 3) hint = n < 0 ? 'Compliance date passed — contempt risk. Comply or move for extension / stay today.' : 'Compliance due ' + M.whenText(n).toLowerCase() + ' — seek extension or stay now if it cannot be met.';
      else if (a.kind === 'order' && a.key.startsWith('appeal:') && n != null && n <= 7) hint = n < 0 ? 'Limitation has run — file with a delay-condonation application at once.' : 'Limitation ends ' + M.whenText(n).toLowerCase() + ' — the appeal must be filed now.';
      else if (a.kind === 'hearing' && n != null && n >= 0 && n <= 1) {
        const c = M.caseById(a.caseId);
        if (c && (c.contempt || (c.replyDue && !c.counterOn) || !c.counselId)) hint = (n === 0 ? 'Hearing today' : 'Hearing tomorrow') + (c.contempt ? ' in a contempt matter — compliance affidavit and officer ready.' : !c.counselId ? ' and no counsel recorded.' : ' and the counter is not filed.');
      } else if (a.kind === 'reply' && n != null && n <= 1) hint = n < 0 ? 'Counter overdue — ask counsel to file or seek time.' : 'Counter due ' + M.whenText(n).toLowerCase() + '.';
      else if (a.kind === 'matter' && /RTI/.test(a.ref) && n != null && n <= 1) hint = 'RTI opinion due ' + (n < 0 ? 'and late' : M.whenText(n).toLowerCase()) + ' — the CPIO’s statutory period is running.';
      else if (a.kind === 'notice' && n != null && n <= 2) hint = 'Reply to the notice ' + (n < 0 ? 'is overdue.' : 'due ' + M.whenText(n).toLowerCase() + '.');
      if (hint) out.push(Object.assign({}, a, { hint }));
    }
    return out;
  };

  M.regions = () => {
    const d = D(), set = new Set(d.settings.regions || []);
    for (const c of d.cases) if (c.region) set.add(c.region);
    for (const m of d.matters || []) if (m.region) set.add(m.region);
    return [...set];
  };

  M.counts = (list) => { const c = { over: 0, crit: 0, soon: 0, up: 0, watch: 0 }; for (const a of list) c[a.sev]++; return c; };
})();
