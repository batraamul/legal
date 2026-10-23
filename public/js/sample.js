/* js/sample.js — default settings, the starter court list, and removable example entries.
   All example names are invented. */
(function () {
  'use strict';
  const LR = window.LR, U = LR.util;
  const S = LR.sample = {};

  S.settings = () => ({
    orgName: 'India Meteorological Department', orgHindi: 'भारत मौसम विज्ञान विभाग',
    section: 'Legal Section', sectionHindi: 'विधि अनुभाग', ministry: 'Ministry of Earth Sciences',
    look: 'maroon', dark: 'auto', cover: true,
    autoDownload: true, askBeforeClose: true, filePrefix: 'IMD-Legal-Register',
    sampleBanner: true,
    regions: LR.refs.REGIONS.slice(),
    alerts: { hearing: 7, reply: 15, compliance: 30, appeal: 45, writTarget: 90, matter: 3, dola: 30, fees: 60, dormant: 180, reserved: 90, panel: 60, paraDays: 15 },
    _at: 0,
  });

  S.courts = () => [
    ['ct-cat-pb', 'Central Administrative Tribunal, Principal Bench', 'CAT (PB)', 'cat', 'New Delhi', 'https://cgat.gov.in'],
    ['ct-cat-mum', 'Central Administrative Tribunal, Mumbai Bench', 'CAT Mumbai', 'cat', 'Mumbai', 'https://cgat.gov.in'],
    ['ct-cat-kol', 'Central Administrative Tribunal, Kolkata Bench', 'CAT Kolkata', 'cat', 'Kolkata', 'https://cgat.gov.in'],
    ['ct-cat-chn', 'Central Administrative Tribunal, Chennai Bench', 'CAT Chennai', 'cat', 'Chennai', 'https://cgat.gov.in'],
    ['ct-cat-gau', 'Central Administrative Tribunal, Guwahati Bench', 'CAT Guwahati', 'cat', 'Guwahati', 'https://cgat.gov.in'],
    ['ct-cat-nag', 'Central Administrative Tribunal, Nagpur Bench', 'CAT Nagpur', 'cat', 'Nagpur', 'https://cgat.gov.in'],
    ['ct-hc-del', 'High Court of Delhi', 'Delhi HC', 'hc', 'New Delhi', 'https://delhihighcourt.nic.in'],
    ['ct-hc-bom', 'High Court of Bombay', 'Bombay HC', 'hc', 'Mumbai', 'https://bombayhighcourt.nic.in'],
    ['ct-hc-cal', 'High Court at Calcutta', 'Calcutta HC', 'hc', 'Kolkata', 'https://calcuttahighcourt.gov.in'],
    ['ct-hc-mad', 'High Court of Madras', 'Madras HC', 'hc', 'Chennai', 'https://hcmadras.tn.gov.in'],
    ['ct-sc', 'Supreme Court of India', 'Supreme Court', 'sc', 'New Delhi', 'https://www.sci.gov.in'],
    ['ct-ncdrc', 'National Consumer Disputes Redressal Commission', 'NCDRC', 'cons-n', 'New Delhi', 'https://ncdrc.nic.in'],
    ['ct-scdrc-del', 'State Consumer Disputes Redressal Commission, Delhi', 'SCDRC Delhi', 'cons-s', 'New Delhi', ''],
    ['ct-dcdrc-nd', 'District Consumer Disputes Redressal Commission, New Delhi', 'DCDRC New Delhi', 'cons-d', 'New Delhi', ''],
    ['ct-cic', 'Central Information Commission', 'CIC', 'cic', 'New Delhi', 'https://cic.gov.in'],
    ['ct-cgit', 'CGIT-cum-Labour Court, New Delhi', 'CGIT New Delhi', 'labour', 'New Delhi', ''],
    ['ct-arb', 'Arbitral Tribunal (sole arbitrator)', 'Arbitration', 'arb', 'New Delhi', ''],
  ].map(([id, name, short, kind, place, site]) => ({ id, name, short, kind, place, site, updatedAt: 1 }));

  /** Fill a new register: courts, and example entries the user can clear. */
  S.seed = (d) => {
    if (!d.courts.length) d.courts = S.courts();
    d.meta.seeded = Date.now();
    S.addExamples(d);
  };

  S.addExamples = (d) => {
    const T = U.today(), t = (n) => U.addDays(T, n), now = Date.now();
    const mk = (o) => Object.assign({ hearings: [], orders: [], docs: [], letters: [], sample: true, createdAt: now, updatedAt: now }, o);
    const h = (date, purpose, proceedings, nextDate) => ({ id: U.uid('hr'), date, purpose, proceedings, nextDate: nextDate || '' });

    d.counsel.push(
      { id: 'cn-x1', name: 'Sh. Arvind Mehta (example)', type: 'CGSC', courts: 'CAT (PB), New Delhi', phone: '98xxxxxx01', email: 'counsel1@example.in', address: 'Chamber 12, CAT PB, Copernicus Marg, New Delhi', termTo: t(400), sample: true, updatedAt: now },
      { id: 'cn-x2', name: 'Ms. Kavita Rao (example)', type: 'Senior Panel Counsel', courts: 'High Court of Delhi', phone: '98xxxxxx02', email: 'counsel2@example.in', address: 'Lawyers’ Chambers, Delhi High Court', termTo: t(700), sample: true, updatedAt: now },
      { id: 'cn-x3', name: 'Sh. P. N. Ghosh (example)', type: 'CGSC', courts: 'CAT Kolkata; Calcutta HC', phone: '98xxxxxx03', email: 'counsel3@example.in', address: 'Kolkata', termTo: t(40), sample: true, updatedAt: now },
    );

    d.cases.push(
      mk({ id: 'cs-x1', region: 'Headquarters (DGM), New Delhi', caseType: 'OA', number: '1452', year: '2025', courtId: 'ct-cat-pb', bench: '', petitioner: 'R. K. Verma, Scientist-C', respondents: 'Union of India through the Secretary, Ministry of Earth Sciences & Ors.', imdRole: 'Respondent',
        category: 'Pay fixation / MACP / ACP', subject: 'Grant of 3rd MACP from 2019 with arrears; challenge to the screening committee decision.', relief: 'Quash order dated 12.03.2024; grant MACP with arrears and interest.',
        office: 'UAID, New Delhi', section: 'Establishment-II', nodal: 'Dr. S. Kumar, Scientist-E (example)', counselId: 'cn-x1', filedOn: t(-70), noticeOn: t(-40), replyDue: t(5), paraSentOn: t(-12), counterOn: '',
        status: 'Pending', stage: 'Para-wise comments sent', nextDate: t(3), nextPurpose: 'Reply / Counter', priority: 'high', fileNo: 'IMD/LEGAL/OA-1452/2025', limbs: '', amount: 640000,
        hearings: [h(t(-40), 'Notice', 'Notice issued. Respondents to file reply within four weeks. Ld. CGSC accepted notice.', t(3))] }),
      mk({ id: 'cs-x2', region: 'Headquarters (DGM), New Delhi', caseType: 'WP(C)', number: '8821', year: '2024', courtId: 'ct-hc-del', bench: 'Division Bench', petitioner: 'Union of India & Ors. (IMD)', respondents: 'S. Meenakshi', imdRole: 'Petitioner / Applicant',
        category: 'Seniority', subject: 'Challenge to CAT (PB) order directing revision of the seniority list of Scientific Assistants.', relief: 'Set aside CAT order dated 05.07.2024.',
        office: 'Headquarters, New Delhi', section: 'Establishment-I', nodal: 'Sh. A. Joshi (example)', counselId: 'cn-x2', filedOn: t(-420),
        status: 'Pending', stage: 'Arguments', nextDate: t(12), nextPurpose: 'Arguments', priority: 'normal', stay: true, stayText: 'Operation of the impugned CAT order stayed till the next date.', fileNo: 'IMD/LEGAL/WP-8821/2024', amount: 0,
        hearings: [h(t(-400), 'Admission', 'Notice issued; interim stay granted.', t(-200)), h(t(-200), 'Completion of pleadings', 'Counter and rejoinder on record. List for arguments.', t(-30)), h(t(-30), 'Arguments', 'Part-heard. Adjourned at the request of the respondent’s counsel.', t(12))],
        orders: [{ id: 'or-x2', date: t(-400), kind: 'Stay order', copyOn: t(-398), result: 'In favour of IMD', summary: 'Operation of impugned order stayed till next date; extended thereafter.', direction: '', complianceDue: '', action: 'No action needed' }] }),
      mk({ id: 'cs-x3', region: 'RMC Kolkata', caseType: 'OA', number: '210', year: '2023', courtId: 'ct-cat-kol', petitioner: 'A. Das & 4 Ors.', respondents: 'Union of India through the Secretary, MoES & Ors.', imdRole: 'Respondent',
        category: 'Regularisation / Contract staff', subject: 'Regularisation of casual labourers engaged at RMC Kolkata.', relief: 'Regularise the applicants from the date of initial engagement.',
        office: 'RMC Kolkata', section: 'Establishment (RMC)', nodal: 'Sh. B. Sen (example)', counselId: 'cn-x3', filedOn: t(-800),
        status: 'Disposed', stage: 'Judgment delivered', result: 'Against IMD', nextDate: '', priority: 'high', amount: 2100000,
        hearings: [h(t(-35), 'Final hearing', 'Heard and disposed of by the order of the same date.')],
        orders: [{ id: 'or-x3', date: t(-35), kind: 'Final order / Judgment', copyOn: t(-30), result: 'Against IMD', summary: 'OA allowed in part.', direction: 'Consider the applicants for regularisation as per the scheme and pass a reasoned and speaking order within 8 weeks of receipt of a copy.', complianceDue: t(26), action: 'Decision pending', remedy: 'writ-hc' }] }),
      mk({ id: 'cs-x4', region: 'Headquarters (DGM), New Delhi', caseType: 'CP (Contempt)', number: '55', year: '2026', courtId: 'ct-cat-pb', petitioner: 'M. L. Bhatia (retd.)', respondents: 'Dr. ________, Director General of Meteorology & Anr.', imdRole: 'Respondent',
        category: 'Pension / Retirement benefits', subject: 'Alleged non-compliance of order dated 14.11.2025 in OA 980/2022 (revision of pension).', relief: 'Punish the respondents for contempt; direct compliance.',
        office: 'Pension Cell, HQ', section: 'Accounts', nodal: 'Ms. R. Iyer (example)', counselId: 'cn-x1', filedOn: t(-30), noticeOn: t(-25), paraSentOn: t(-15),
        status: 'Pending', stage: 'Compliance', nextDate: t(1), nextPurpose: 'Compliance', priority: 'high', contempt: true, linked: 'OA 980/2022', amount: 380000,
        hearings: [h(t(-25), 'Notice', 'Notice issued to respondents. Compliance report / affidavit to be filed before next date.', t(1))] }),
      mk({ id: 'cs-x5', region: 'RMC New Delhi', caseType: 'CC (Consumer)', number: '312', year: '2025', courtId: 'ct-dcdrc-nd', petitioner: 'M/s Green Valley Farms (example)', respondents: 'Director General of Meteorology', imdRole: 'Opposite party',
        category: 'Weather forecast / Service liability', subject: 'Claim for crop loss allegedly due to an inaccurate district forecast.', relief: 'Compensation of Rs. 12 lakh.',
        office: 'Agromet Division', section: 'Agromet', nodal: 'Dr. N. Rao (example)', counselId: '', filedOn: t(-150), noticeOn: t(-140), counterOn: t(-110),
        status: 'Pending', stage: 'Arguments', nextDate: t(-4), nextPurpose: 'Arguments', priority: 'normal', amount: 1200000,
        hearings: [h(t(-60), 'Arguments', 'Arguments of complainant heard in part.', t(-4))] }),
      mk({ id: 'cs-x6', region: 'RMC Mumbai', caseType: 'WP(C)', number: '4410', year: '2025', courtId: 'ct-hc-bom', bench: 'Single Bench', petitioner: 'V. Patil', respondents: 'Union of India & Ors.', imdRole: 'Respondent',
        category: 'Compassionate appointment', subject: 'Compassionate appointment of the son of a deceased Senior Observer, RMC Mumbai.', relief: 'Direct appointment on compassionate grounds.',
        office: 'RMC Mumbai', section: 'Establishment (RMC)', nodal: 'Sh. K. More (example)', filedOn: t(-300),
        status: 'Disposed', stage: 'Appeal / Review being considered', result: 'Against IMD', priority: 'normal',
        orders: [{ id: 'or-x6', date: t(-20), kind: 'Final order / Judgment', copyOn: t(-16), result: 'Against IMD', summary: 'Petition allowed.', direction: 'Reconsider the case of the petitioner within 12 weeks without applying the 3-year limit.', complianceDue: t(64), action: 'Appeal / review proposed', remedy: 'lpa' }] }),
      mk({ id: 'cs-x7', region: 'IMD Pune', caseType: 'Arbitration', number: '3', year: '2024', courtId: 'ct-arb', petitioner: 'M/s Skyline Instruments Pvt. Ltd. (example)', respondents: 'India Meteorological Department', imdRole: 'Respondent',
        category: 'Tender / Contract / GeM', subject: 'Claim for balance payment and refund of performance security — supply of automatic weather stations.', relief: 'Rs. 86 lakh with interest.',
        office: 'Surface Instruments, Pune', section: 'Stores & Purchase', filedOn: t(-500),
        status: 'Reserved', stage: 'Reserved for judgment', reservedOn: t(-100), priority: 'normal', amount: 8600000 }),
      mk({ id: 'cs-x8', region: 'RMC Chennai', caseType: 'OA', number: '77', year: '2021', courtId: 'ct-cat-chn', petitioner: 'T. Raman', respondents: 'Union of India & Ors.', imdRole: 'Respondent', category: 'Promotion / DPC', subject: 'Review DPC for promotion to Meteorologist Grade-II.',
        office: 'RMC Chennai', filedOn: '2021-02-11', status: 'Closed', stage: 'Closed', result: 'In favour of IMD', priority: 'low' }),
      mk({ id: 'cs-x9', region: 'Headquarters (DGM), New Delhi', caseType: 'OA', number: '1180', year: '2022', courtId: 'ct-cat-pb', petitioner: 'S. Arora & Ors.', respondents: 'Union of India & Ors.', imdRole: 'Respondent', category: 'Recruitment / Selection', subject: 'Cancellation of a recruitment notice for Scientific Assistants.',
        office: 'Headquarters, New Delhi', filedOn: '2022-08-03', status: 'Closed', stage: 'Closed', result: 'In favour of IMD', priority: 'low' }),
      mk({ id: 'cs-x10', region: 'RMC Guwahati', caseType: 'OA', number: '402', year: '2024', courtId: 'ct-cat-gau', petitioner: 'D. Bora', respondents: 'Union of India & Ors.', imdRole: 'Respondent', category: 'Transfer / Posting', subject: 'Transfer from MC Guwahati to MC Agartala.',
        office: 'RMC Guwahati', filedOn: '2024-04-19', status: 'Disposed', stage: 'Closed', result: 'Withdrawn', priority: 'low' }),
      mk({ id: 'cs-x11', region: 'RMC Chennai', caseType: 'OA', number: '611', year: '2025', courtId: 'ct-cat-chn', petitioner: 'K. Subramanian & 11 Ors., Meteorologists Gr.-I', respondents: 'Union of India through the Secretary, MoES & Ors.', imdRole: 'Respondent',
        category: 'NFU (Non-Functional Upgradation)', subject: 'Grant of NFU in the scale of the next higher grade from the date batchmates in other services got it.', relief: 'Grant NFU with arrears from 2016.',
        office: 'RMC Chennai', section: 'Establishment (RMC)', nodal: 'Sh. R. Kannan (example)', counselId: '', filedOn: t(-90), noticeOn: t(-12),
        status: 'Pending', stage: 'Notice received', nextDate: t(9), nextPurpose: 'Reply / Counter', replyDue: t(16), priority: 'high', amount: 5400000,
        hearings: [h(t(-12), 'Notice', 'Notice issued; respondents to file reply in four weeks.', t(9))] }),
      mk({ id: 'cs-x12', region: 'RMC Kolkata', caseType: 'SLP(C)', number: 'Diary 41522', year: '2026', courtId: 'ct-sc', petitioner: 'Union of India & Ors. (IMD)', respondents: 'N. Dutta', imdRole: 'Petitioner / Applicant',
        category: 'Pension / Retirement benefits', subject: 'SLP against Calcutta HC Division Bench order on counting of past service for pension. Filing approved by DoLA.', relief: 'Set aside the HC order; stay its operation.',
        office: 'RMC Kolkata', section: 'Accounts (RMC)', nodal: 'Sh. P. Basu (example)', counselId: '', filedOn: t(-6),
        status: 'Pending', stage: 'Appeal filed', priority: 'normal', dola: true, dolaRef: 'DoLA advice no. 2210/2026 (example)', amount: 1500000 }),
    );

    d.notices.push(
      { id: 'nt-x1', kind: 'Legal notice', receivedOn: t(-20), from: 'M/s Northern Builders (example)', advocate: 'Adv. R. Malhotra', subject: 'Payment of escalation for the office building at Lodhi Road.', demand: 'Rs. 18.4 lakh within 15 days', replyDue: t(10), status: 'Open', office: 'Civil Works', region: 'Headquarters (DGM), New Delhi', sample: true, updatedAt: now },
      { id: 'nt-x2', kind: 'Notice u/s 80 CPC', receivedOn: t(-55), from: 'K. S. Rathore (example)', advocate: 'Adv. M. Sinha', subject: 'Damage to orchard allegedly caused by the observatory boundary wall.', demand: 'Compensation Rs. 3 lakh', replyDue: U.addMonths(t(-55), 2), status: 'Open', office: 'MC Jaipur', region: 'RMC New Delhi', sample: true, updatedAt: now },
    );
    const mt = (o) => Object.assign({ status: 'Under examination', priority: 'normal', history: [], sample: true, createdAt: now, updatedAt: now }, o);
    d.matters.push(
      mt({ id: 'mt-x1', type: 'LOA / MOU vetting', ref: 'IMD/UAID/MOU/14/2026', receivedOn: t(-5), dueOn: t(2), region: 'Headquarters (DGM), New Delhi', fromOffice: 'Upper Air Instrumentation Division',
        subject: 'Draft MOU with an IIT for joint development of a GNSS radiosonde (example).', party: 'Indian Institute of Technology (example)', value: 4500000, assigned: 'Sh. V. Rao, Legal Officer (example)',
        history: [{ date: t(-5), note: 'Received with comments of the Finance wing.' }] }),
      mt({ id: 'mt-x2', type: 'RTI — legal opinion', ref: 'RTI/E/26/00412', receivedOn: t(-1), dueOn: t(1), region: 'Headquarters (DGM), New Delhi', fromOffice: 'CPIO (Establishment)', priority: 'high',
        subject: 'Whether DPC minutes for Scientist-B to C can be given when OA 1452/2025 is pending (example).', caseId: 'cs-x1', assigned: 'Legal Officer',
        notes: 'RTI received by CPIO on ' + U.fmt(t(-6)) + '; reply due ' + U.fmt(t(24)) + '.' }),
      mt({ id: 'mt-x3', type: 'Recruitment / extension', ref: 'IMD/E-I/EXT/09/2026', receivedOn: t(-14), dueOn: t(-4), region: 'RMC Mumbai', fromOffice: 'Establishment-I',
        subject: 'Extension of contract engagement of retired Meteorologists as consultants at RMC Mumbai (example).', assigned: 'Legal Officer', status: 'Clarification sought',
        history: [{ date: t(-9), note: 'Asked Establishment-I for the engagement policy and the earlier approvals.' }] }),
      mt({ id: 'mt-x4', type: 'Administrative matter', ref: 'IMD/ADMN/LEG/77', receivedOn: t(-3), dueOn: t(7), region: 'RMC Guwahati', fromOffice: 'Administration, RMC Guwahati',
        subject: 'Eviction of an unauthorised occupant from staff quarters at Guwahati airport colony (example).' }),
      mt({ id: 'mt-x5', type: 'DoLA reference', ref: 'IMD/LEGAL/DOLA/12/2026', receivedOn: t(-40), dueOn: t(-10), region: 'RMC Kolkata', fromOffice: 'Legal Section', status: 'Referred to DoLA',
        subject: 'Opinion on implementing the Calcutta HC order on pension of casual employees (example).', dolaRef: 'DoLA ID No. 3141/2026-AdvA (example)', dolaOn: t(-38),
        history: [{ date: t(-38), note: 'Referred to DoLA through MoES.' }] }),
      mt({ id: 'mt-x6', type: 'LOA / MOU vetting', ref: 'IMD/SI/LOA/31/2026', receivedOn: t(-20), dueOn: t(-13), region: 'IMD Pune', fromOffice: 'Surface Instruments Division', status: 'Opinion given / vetted', opinionOn: t(-15),
        subject: 'Letter of Award for annual maintenance of automatic weather stations (example).', party: 'M/s Skyline Instruments Pvt. Ltd. (example)', value: 2800000, advice: 'Vetted with changes to the penalty and termination clauses.' }),
    );
    d.fees.push(
      { id: 'fe-x1', counselId: 'cn-x1', caseId: 'cs-x1', billNo: 'AM/112/2026', billDate: t(-75), stage: 'Appearance on 2 dates; drafting', amount: 21000, status: 'Verified', sample: true, updatedAt: now },
      { id: 'fe-x2', counselId: 'cn-x2', caseId: 'cs-x2', billNo: 'KR/45', billDate: t(-25), stage: 'Arguments', amount: 15000, status: 'Received', sample: true, updatedAt: now },
    );
    d.tasks.push(
      { id: 'tk-x1', caseId: 'cs-x1', text: 'Obtain the service book of R. K. Verma from the Establishment section', due: t(1), who: 'LDC, Legal', done: false, sample: true, updatedAt: now },
      { id: 'tk-x2', caseId: 'cs-x4', text: 'Get the pension revision order issued and file the compliance affidavit', due: t(0), who: 'Pension Cell', done: false, sample: true, updatedAt: now },
    );
  };

  S.clearExamples = (d) => {
    const now = Date.now();
    for (const c of ['cases', 'notices', 'matters', 'counsel', 'fees', 'tasks']) {
      d[c] = d[c].filter((x) => { if (x.sample) { d.deleted[x.id] = now; return false; } return true; });
    }
    d.settings.sampleBanner = false; d.settings._at = now;
  };
})();
