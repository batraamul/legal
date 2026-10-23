/* js/refs.js — lists used in the forms, and the Ready Reference content (timelines, procedures, glossary, formats).
   Periods are as in the Acts and Rules named; always check the current text and any court direction. */
(function () {
  'use strict';
  const LR = window.LR;
  const R = LR.refs = {};

  R.CASE_TYPES = ['OA', 'TA', 'MA', 'RA', 'CP (Contempt)', 'WP(C)', 'WP(Crl)', 'LPA', 'CM Appl.', 'RFA', 'CRP', 'SLP(C)', 'SLP(Crl)', 'CA', 'Diary No.', 'CC (Consumer)', 'FA (Consumer)', 'RP (Consumer)', 'Civil Suit', 'Arbitration', 'OMP (Arb.)', 'ID (Industrial)', 'CIC Second Appeal', 'Other'];
  R.CATEGORIES = ['Promotion / DPC', 'Seniority', 'Pay fixation / MACP / ACP', 'NFU (Non-Functional Upgradation)', 'Recruitment / Selection', 'Transfer / Posting', 'Disciplinary / CCS (CCA)', 'Pension / Retirement benefits', 'NPS / OPS', 'Regularisation / Contract staff', 'Compassionate appointment', 'Allowances / Recovery', 'Leave / Service conditions', 'Reservation (SC/ST/OBC/PwD)', 'Tender / Contract / GeM', 'Arbitration', 'Land / Property / Lease', 'Consumer complaint', 'RTI', 'Labour / Industrial', 'Tax / Statutory dues', 'Accident / Compensation', 'Weather forecast / Service liability', 'Environment / NGT', 'Criminal', 'Other'];
  R.STAGES = ['Notice received', 'Para-wise comments sent', 'Counter / Reply filed', 'Rejoinder', 'Pleadings complete', 'Arguments', 'Reserved for judgment', 'Judgment delivered', 'Compliance', 'Appeal / Review being considered', 'Appeal filed', 'Closed'];
  R.STATUSES = ['Pending', 'Reserved', 'Disposed', 'Closed'];
  R.RESULTS = ['', 'In favour of IMD', 'Against IMD', 'Partly against IMD', 'Disposed with directions', 'Withdrawn', 'Dismissed in default', 'Infructuous'];
  R.ROLES = ['Respondent', 'Petitioner / Applicant', 'Appellant', 'Proforma respondent', 'Complainant', 'Opposite party'];
  R.PRIORITY = [['high', 'High'], ['normal', 'Normal'], ['low', 'Low']];
  R.COURT_KINDS = [
    ['cat', 'Central Administrative Tribunal'], ['hc', 'High Court'], ['sc', 'Supreme Court'],
    ['cons-d', 'District Consumer Commission'], ['cons-s', 'State Consumer Commission'], ['cons-n', 'National Consumer Commission (NCDRC)'],
    ['cic', 'Central Information Commission'], ['civil', 'Civil Court (District)'], ['labour', 'Labour Court / CGIT'],
    ['arb', 'Arbitral Tribunal'], ['comm', 'Commercial Court'], ['other', 'Other forum'],
  ];
  R.BENCH = ['', 'Single Bench', 'Division Bench', 'Full Bench'];
  R.HEARING_PURPOSES = ['Admission', 'Notice', 'Reply / Counter', 'Rejoinder', 'Completion of pleadings', 'Arguments', 'Final hearing', 'Orders', 'Pronouncement', 'Compliance', 'Mention', 'Directions', 'Personal appearance'];
  R.ORDER_KINDS = ['Interim order', 'Final order / Judgment', 'Notice issued', 'Direction', 'Stay order', 'Review order'];
  R.ORDER_ACTIONS = ['Decision pending', 'Comply', 'Complied', 'Appeal / review proposed', 'Appeal / review filed', 'Extension of time sought', 'No action needed'];
  R.DOC_KINDS = ['Petition / OA', 'Para-wise comments', 'Counter affidavit / Reply', 'Rejoinder', 'Additional affidavit', 'Compliance affidavit', 'Order copy', 'Judgment', 'Legal opinion', 'Vakalatnama / Memo of appearance', 'Letter', 'Note sheet', 'Evidence / Annexure', 'Other'];
  R.COUNSEL_TYPES = ['CGSC', 'Senior Panel Counsel', 'Panel Counsel', 'Additional Solicitor General', 'Government Pleader', 'Departmental Representative', 'Legal Officer (IMD)', 'Arbitrator', 'Other'];
  R.FEE_STATUS = ['Received', 'Verified', 'Sent to DDO / PAO', 'Paid', 'Returned'];
  R.NOTICE_KINDS = ['Legal notice', 'Notice u/s 80 CPC', 'Representation (court-directed)', 'Pre-contempt notice', 'Consumer notice', 'Show cause by authority', 'Other'];
  R.NOTICE_STATUS = ['Open', 'Replied', 'Settled', 'Became a case', 'Closed'];
  R.REGIONS = ['Headquarters (DGM), New Delhi', 'RMC New Delhi', 'RMC Mumbai', 'RMC Chennai', 'RMC Kolkata', 'RMC Guwahati', 'RMC Nagpur', 'IMD Pune', 'Other office'];
  /* Non-litigation work of the Legal Section: type → [usual time to give the opinion (days), short name] */
  R.MATTER_TYPES = [
    ['LOA / MOU vetting', 7, 'Vetting'], ['RTI — legal opinion', 3, 'RTI opinion'], ['Recruitment / extension', 10, 'Recruitment'],
    ['Administrative matter', 10, 'Admin'], ['DoLA reference', 30, 'DoLA'], ['Legal opinion (other)', 10, 'Opinion'],
    ['Contract / tender dispute', 10, 'Contract'], ['Other', 15, 'Other'],
  ];
  R.matterDays = (t) => (R.MATTER_TYPES.find((x) => x[0] === t) || [, 15])[1];
  R.matterShort = (t) => (R.MATTER_TYPES.find((x) => x[0] === t) || [, , t || 'Matter'])[2];
  R.MATTER_STATUS = ['Received', 'Under examination', 'Clarification sought', 'Referred to DoLA', 'Opinion given / vetted', 'Returned', 'Closed'];
  R.MATTER_DONE = ['Opinion given / vetted', 'Returned', 'Closed'];
  R.LETTER_WITH = ['CGSC / Counsel', 'Department of Legal Affairs', 'MoES', 'Court / Registry', 'Petitioner / Advocate', 'Regional office / RMC', 'Other'];

  /* Remedy after an order: days and from which date the time runs. */
  R.REMEDIES = {
    'review-cat': { label: 'Review application before CAT', days: 30, from: 'copy', law: 'CAT (Procedure) Rules, 1987, r.17 — 30 days from receipt of copy' },
    'writ-hc': { label: 'Writ petition in High Court (against CAT / CIC / CGIT order)', days: null, from: 'order', law: 'Art. 226/227 — no fixed period; file without delay (delay and laches). Internal target in Settings.' },
    'lpa': { label: 'LPA / intra-court appeal (Single → Division Bench)', days: 30, from: 'order', law: 'Limitation Act, Art. 117 / High Court Rules — 30 days' },
    'review-hc': { label: 'Review in High Court', days: 30, from: 'order', law: 'Limitation Act, Art. 124 — 30 days' },
    'slp': { label: 'SLP to the Supreme Court', days: 90, from: 'order', law: 'Limitation Act, Art. 133(c) — 90 days from judgment (time for certified copy excludable, s.12)' },
    'review-sc': { label: 'Review petition in the Supreme Court', days: 30, from: 'order', law: 'Supreme Court Rules, 2013, Order XLVII — 30 days' },
    'cons-s': { label: 'Appeal to State Consumer Commission', days: 45, from: 'order', law: 'Consumer Protection Act, 2019, s.41 — 45 days' },
    'cons-n': { label: 'Appeal to NCDRC', days: 30, from: 'order', law: 'Consumer Protection Act, 2019, s.51 — 30 days' },
    'cons-sc': { label: 'Appeal to the Supreme Court from NCDRC', days: 30, from: 'order', law: 'Consumer Protection Act, 2019, s.67 — 30 days' },
    'civil-hc': { label: 'First appeal to High Court', days: 90, from: 'order', law: 'Limitation Act, Art. 116(a) — 90 days' },
    'civil-dc': { label: 'Appeal to District Court', days: 30, from: 'order', law: 'Limitation Act, Art. 116(b) — 30 days' },
    'arb-34': { label: 'Petition to set aside arbitral award (s.34)', days: 90, from: 'copy', law: 'Arbitration and Conciliation Act, 1996, s.34(3) — 3 months from receipt of award (+30 days only for sufficient cause)' },
    'comm-13': { label: 'Appeal under Commercial Courts Act', days: 60, from: 'order', law: 'Commercial Courts Act, 2015, s.13 — 60 days' },
    'none': { label: 'No appeal — comply', days: null, from: 'order', law: '' },
  };
  /** The usual remedy against a final order of this forum. */
  R.defaultRemedy = (kind, bench) => ({ cat: 'writ-hc', cic: 'writ-hc', labour: 'writ-hc', sc: 'review-sc', 'cons-d': 'cons-s', 'cons-s': 'cons-n', 'cons-n': 'cons-sc', civil: 'civil-hc', arb: 'arb-34', comm: 'comm-13' }[kind] || (kind === 'hc' ? (bench === 'Single Bench' ? 'lpa' : 'slp') : 'none'));

  /* ---------- Ready Reference: timelines ---------- */
  R.TIMELINES = [
    { g: 'Tribunal (CAT)', t: 'Filing an Original Application', p: '1 year', f: 'Final order on grievance; or end of 6 months after appeal/representation was made without a decision', law: 'Administrative Tribunals Act, 1985, s.21', n: 'Delay can be condoned on sufficient cause (s.21(3)). Remedies under service rules must normally be exhausted first (s.20).' },
    { g: 'Tribunal (CAT)', t: 'Reply / counter by respondents', p: '1 month (or as directed)', f: 'Service of notice of the OA', law: 'CAT (Procedure) Rules, 1987, r.12', n: 'The Tribunal may allow more time; ask before the date, not after.' },
    { g: 'Tribunal (CAT)', t: 'Review of CAT order', p: '30 days', f: 'Receipt of copy of the order', law: 'CAT (Procedure) Rules, 1987, r.17', n: 'Courts have held that CAT cannot condone delay beyond this period.' },
    { g: 'High Court', t: 'Writ petition against a CAT order', p: 'No fixed period', f: 'Date of the CAT order', law: 'Constitution, Art. 226/227', n: 'Delay and laches apply; file promptly and seek stay where compliance is due.' },
    { g: 'High Court', t: 'LPA / intra-court appeal', p: '30 days', f: 'Date of judgment of Single Judge', law: 'Limitation Act, Art. 117; High Court Rules', n: '' },
    { g: 'High Court', t: 'Review of judgment (any court other than SC)', p: '30 days', f: 'Date of decree / order', law: 'Limitation Act, Art. 124', n: '' },
    { g: 'High Court', t: 'First appeal from a decree to High Court', p: '90 days', f: 'Date of decree / order', law: 'Limitation Act, Art. 116(a)', n: 'To any other court: 30 days (Art. 116(b)).' },
    { g: 'High Court', t: 'Revision (CPC / CrPC)', p: '90 days', f: 'Date of decree / order', law: 'Limitation Act, Art. 131', n: '' },
    { g: 'Supreme Court', t: 'Special Leave Petition (other than death sentence)', p: '90 days', f: 'Date of judgment / order', law: 'Limitation Act, Art. 133(c)', n: 'Where the High Court refused a certificate: 60 days from the refusal (Art. 133(b)). Time to obtain a certified copy may be excluded (s.12).' },
    { g: 'Supreme Court', t: 'Review petition', p: '30 days', f: 'Date of judgment / order', law: 'Supreme Court Rules, 2013, Order XLVII', n: '' },
    { g: 'Contempt', t: 'Initiating contempt proceedings', p: '1 year', f: 'Date the contempt is alleged to have been committed', law: 'Contempt of Courts Act, 1971, s.20', n: 'Non-compliance within the time set by the court is the most common ground. Seek extension of time before the period ends.' },
    { g: 'Civil', t: 'Notice before suing the Government', p: '2 months', f: 'Delivery of notice', law: 'CPC, s.80', n: 'The suit cannot be filed until two months after the notice (except with leave for urgent relief, s.80(2)). Reply on merits within this period.' },
    { g: 'Civil', t: 'Written statement', p: '30 days (extendable up to 90 days)', f: 'Service of summons', law: 'CPC, Order VIII Rule 1', n: 'In commercial disputes the 120-day outer limit is strict.' },
    { g: 'Civil', t: 'Restoration of case dismissed for default', p: '30 days', f: 'Date of dismissal', law: 'Limitation Act, Art. 122', n: '' },
    { g: 'Civil', t: 'Setting aside an ex parte decree', p: '30 days', f: 'Date of decree (or knowledge, if summons not duly served)', law: 'Limitation Act, Art. 123', n: '' },
    { g: 'Commercial / Arbitration', t: 'Setting aside an arbitral award', p: '3 months (+30 days on sufficient cause)', f: 'Receipt of the signed award', law: 'Arbitration and Conciliation Act, 1996, s.34(3)', n: 'No extension beyond the extra 30 days.' },
    { g: 'Commercial / Arbitration', t: 'Appeal from a Commercial Court', p: '60 days', f: 'Date of judgment / order', law: 'Commercial Courts Act, 2015, s.13(1A)', n: '' },
    { g: 'Consumer', t: 'Filing a complaint', p: '2 years', f: 'Date the cause of action arose', law: 'Consumer Protection Act, 2019, s.69', n: '' },
    { g: 'Consumer', t: 'Written version by opposite party', p: '30 days (+15 days)', f: 'Receipt of complaint', law: 'Consumer Protection Act, 2019, s.38(2)(a)', n: 'The outer limit of 45 days is strict.' },
    { g: 'Consumer', t: 'Appeal to State Commission', p: '45 days', f: 'Date of District Commission order', law: 'Consumer Protection Act, 2019, s.41', n: 'Deposit of 50% of the amount ordered is required.' },
    { g: 'Consumer', t: 'Appeal to National Commission', p: '30 days', f: 'Date of State Commission order', law: 'Consumer Protection Act, 2019, s.51', n: '' },
    { g: 'Consumer', t: 'Appeal to the Supreme Court', p: '30 days', f: 'Date of NCDRC order', law: 'Consumer Protection Act, 2019, s.67', n: '' },
    { g: 'RTI (for opinions)', t: 'Reply by CPIO', p: '30 days (48 hours where life or liberty is involved)', f: 'Receipt of request', law: 'RTI Act, 2005, s.7(1)', n: '+5 days when received through an APIO; transfer to another authority within 5 days, s.6(3).' },
    { g: 'RTI (for opinions)', t: 'First appeal by applicant', p: '30 days', f: 'Reply, or end of the reply period', law: 'RTI Act, 2005, s.19(1)', n: 'FAA may admit later on sufficient cause.' },
    { g: 'RTI (for opinions)', t: 'Decision by First Appellate Authority', p: '30 days (max 45 days, with reasons)', f: 'Receipt of appeal', law: 'RTI Act, 2005, s.19(6)', n: '' },
    { g: 'RTI (for opinions)', t: 'Second appeal to CIC', p: '90 days', f: 'Date FAA decision was due or received', law: 'RTI Act, 2005, s.19(3)', n: '' },
    { g: 'Service (departmental)', t: 'Appeal against a penalty', p: '45 days', f: 'Receipt of copy of the order', law: 'CCS (CCA) Rules, 1965, r.25', n: 'Appellate authority may admit later on sufficient cause.' },
  ];

  /* ---------- Ready Reference: procedures ---------- */
  R.PROCEDURES = [
    { id: 'notice', t: 'On receiving a court notice', s: 'The first ten days decide the case', steps: [
      'Enter the case in the register the same day: case number, court, parties, next date, subject, and the date the notice was received.',
      'Put up the notice on an e-office file; mark it to the section that deals with the subject and to the Legal Section.',
      'Find out who is the Government counsel (CGSC / panel counsel) for the bench; send the paper book and ask for an appearance on the first date.',
      'Collect the facts and records from the dealing section / regional office: service book, orders, rules, earlier representations.',
      'Prepare para-wise comments (see the format) and get them approved by the competent authority.',
      'Send para-wise comments to counsel at least 10 days before the reply is due, so the counter affidavit can be drafted and vetted.',
      'Watch the cause list for every listing; record each hearing and the next date in the register.' ] },
    { id: 'para', t: 'Preparing para-wise comments', s: 'What counsel needs from the department', steps: [
      'Start with a short background note: the employee, post, dates, and what is being challenged.',
      'Take each paragraph of the petition in turn: admit what is correct, deny what is wrong with reasons, and give the facts and rule position.',
      'Quote the rule, OM or order relied on, with number and date, and attach a copy.',
      'Raise preliminary objections where they apply: limitation, non-exhaustion of remedies (AT Act s.20), non-joinder, suppression of facts, lack of jurisdiction.',
      'State the reply to each relief sought and whether there is any financial implication.',
      'Have the comments signed by an officer who can verify the facts; the same officer usually swears the counter affidavit.' ] },
    { id: 'counter', t: 'Counter affidavit and vetting', s: 'Before it is filed', steps: [
      'Check the draft from counsel against the records: dates, names, figures and annexures.',
      'Make sure the deponent is competent and authorised; get the affidavit attested.',
      'Send it back to counsel well before the date; record the date of filing in the register (Counter filed on).',
      'If more time is needed, ask counsel to seek it on or before the date — never let the right to file be closed.' ] },
    { id: 'judgment', t: 'On receiving a judgment or final order', s: 'Comply or challenge — in time', steps: [
      'Enter the order in the case (Orders tab): date, date the copy was received, the direction and the time allowed for compliance.',
      'Get the order examined at once: is it in favour, against, or partly against?',
      'If against: obtain a legal opinion from counsel on the merits of an appeal or review; note the last date (the register works it out).',
      'Send the proposal for appeal with the opinion to the competent authority / Ministry / Department of Legal Affairs at least 30 days before the last date.',
      'If accepting the order: issue the compliance order within the time allowed and file a compliance report / affidavit if the court asked for one.',
      'If the order cannot be complied with in time: file an application for extension of time, or an appeal with a stay application, BEFORE the time ends.' ] },
    { id: 'contempt', t: 'Avoiding contempt', s: 'Most contempt cases come from delay', steps: [
      'Treat every time-bound direction as a deadline in the register; the Action Board warns 30, 15 and 7 days ahead.',
      'A pending decision to appeal is not a reason to delay — either get a stay or comply.',
      'Seek extension of time from the same court before the time expires, giving genuine reasons.',
      'If a contempt notice comes, comply first, then file an affidavit of compliance with an unconditional apology where needed.',
      'Keep the officer named in the contempt petition informed; personal appearance may be directed.' ] },
    { id: 'rti', t: 'RTI — giving a legal opinion', s: 'When a CPIO or FAA asks whether information can be given', steps: [
      'Note the date the RTI application reached the CPIO: the reply is due in 30 days (48 hours for life or liberty), so the opinion is needed within about 3 days.',
      'Check whether a court has expressly forbidden publication, or whether disclosure would be contempt — s.8(1)(b). A case being pending (sub judice) is not by itself a ground to refuse.',
      'Check the other exemptions that may apply: personal information with no public interest (s.8(1)(j)), information received in confidence (s.8(1)(e)), cabinet papers (s.8(1)(i)).',
      'If the information relates to a third party, the s.11 procedure (notice and hearing) must be followed before deciding.',
      'Where part can be given, advise severance under s.10.',
      'Record the opinion on file with reasons; the decision itself is the CPIO’s / FAA’s.' ] },
    { id: 'vetting', t: 'Vetting an LOA / MOU', s: 'Points to check before it is signed', steps: [
      'Parties: correct legal names, who signs for each side, and whether the signatory has the delegated power (and financial concurrence where money is involved).',
      'Scope and deliverables: clear, measurable, with timelines; what IMD gives and gets.',
      'Money: amount, payment milestones, taxes, bank guarantee / performance security, penalties — consistent with GFR and the tender, if any.',
      'Term, renewal, termination and the effect of termination.',
      'Data, intellectual property and confidentiality — especially for weather data, instruments and software.',
      'Liability and indemnity: IMD should not take on unlimited liability.',
      'Disputes: amicable settlement, then arbitration (Arbitration and Conciliation Act, 1996) with seat and venue — or, between Government departments and CPSEs, the administrative mechanism for resolving disputes laid down by the Government.',
      'Governing law (Indian law) and jurisdiction; stamp duty, where the instrument needs it.',
      'Return the vetted draft with the changes marked, and note on file what was vetted.' ] },
    { id: 'recruit', t: 'Recruitment and extension matters', s: 'Recruitment rules, selections, extension of service', steps: [
      'Check the notified Recruitment Rules for the post and any amendment; selections must follow them.',
      'Check the DoPT instructions that apply (reservation, age relaxation, deputation, contract engagement).',
      'For extension of service or re-employment: check the rule and instructions it is sought under and the competent authority (ACC approval where the post requires it).',
      'Look for court orders on the same post or batch — similarly placed employees often file the same claim.',
      'Give the opinion with the rule position quoted, and point out any risk of litigation.' ] },
    { id: 'dola', t: 'References to the Department of Legal Affairs', s: 'Appeals, opinions and DoLA matters', steps: [
      'Send a self-contained reference: brief facts, the question, the department’s view, copies of the order / documents, and the last date if there is one.',
      'For filing an appeal or SLP, send the proposal with counsel’s opinion well before the limitation date (the register warns 45 days ahead).',
      'Record the DoLA reference number and date in the matter or case; follow up if there is no reply in 30 days.',
      'Keep the advice of DoLA on the file and act on it within the time available.' ] },
    { id: 'legalnotice', t: 'On a legal notice (incl. s.80 CPC)', s: 'Pre-litigation — the cheapest stage', steps: [
      'Register it (Notices & RTI → Legal notices) with the date received.',
      'Examine the claim on merits with the dealing section; if the claim is just, settle it — the National Litigation Policy discourages avoidable litigation.',
      'Reply within the notice period (two months for s.80 CPC) with reasons, after legal vetting where needed.',
      'Keep proof of dispatch; link the notice to the case if a suit or OA follows.' ] },
  ];

  R.GLOSSARY = [
    ['OA', 'Original Application — a case filed before the Central Administrative Tribunal.'],
    ['MA', 'Miscellaneous Application in a pending OA (e.g., for delay condonation, extension of time).'],
    ['RA', 'Review Application against an order of the same Tribunal / court.'],
    ['CP', 'Contempt Petition — for wilful disobedience of a court order.'],
    ['WP(C)', 'Writ Petition (Civil) under Article 226 in a High Court, or Article 32 in the Supreme Court.'],
    ['LPA', 'Letters Patent Appeal — appeal from a Single Judge to a Division Bench of the same High Court.'],
    ['SLP', 'Special Leave Petition to the Supreme Court under Article 136.'],
    ['CGSC', 'Central Government Standing Counsel — counsel who appears for the Union of India.'],
    ['DoLA', 'Department of Legal Affairs, Ministry of Law & Justice — advises Ministries; approves filing of appeals in many matters.'],
    ['LIMBS', 'Legal Information Management & Briefing System — the Government of India portal for monitoring Union litigation.'],
    ['Para-wise comments', 'The department’s reply, paragraph by paragraph, from which counsel drafts the counter affidavit.'],
    ['Counter affidavit', 'The sworn reply of the respondent to the petition.'],
    ['Rejoinder', 'The petitioner’s answer to the counter affidavit.'],
    ['Vakalatnama', 'The authority given to an advocate to appear for a party.'],
    ['Ex parte', 'Proceeding in the absence of a party who did not appear.'],
    ['Interim order', 'An order in force while the case is pending (e.g., stay, status quo).'],
    ['Status quo', 'Keep things as they are on the date of the order.'],
    ['Condonation of delay', 'Permission to file after the limitation period, for sufficient cause (Limitation Act s.5).'],
    ['Infructuous', 'A case that no longer serves a purpose because the matter has been resolved otherwise.'],
    ['Pronouncement', 'The day the judgment is delivered in court.'],
    ['Cause list', 'The court’s list of cases to be heard on a day, with item numbers and court rooms.'],
    ['Advance list', 'A list of cases likely to be taken up on a later date.'],
    ['Compliance affidavit', 'An affidavit telling the court how and when its order was complied with.'],
    ['Delay and laches', 'Unreasonable delay that can defeat a writ petition even where no limitation period is fixed.'],
    ['NFU', 'Non-Functional Upgradation — higher pay given to officers of Organised Group A services under DoPT instructions after the 6th CPC (OM dated 24.04.2009), without promotion to a higher post. A frequent subject of service cases.'],
    ['LOA', 'Letter of Award / Acceptance — the letter that concludes a contract after a tender.'],
    ['MOU', 'Memorandum of Understanding — an agreement recording the terms of co-operation between two organisations.'],
    ['Vetting', 'Legal examination of a draft (agreement, LOA, MOU, notice, rules) before it is signed or issued.'],
    ['Sub judice', 'A matter pending before a court. Under the RTI Act it is not, by itself, a ground to refuse information.'],
    ['Res judicata', 'A matter already decided between the same parties cannot be re-agitated.'],
    ['Locus standi', 'The right of a person to bring the case.'],
  ];

  R.TEMPLATES = [
    { t: 'Para-wise comments (format)', x:
`PARA-WISE COMMENTS ON OA No. ____/____ FILED BY SH./SMT. ____________ BEFORE THE HON'BLE CENTRAL ADMINISTRATIVE TRIBUNAL, ________ BENCH

Brief facts of the case:
1. ____________________________________________

Preliminary objections:
(a) The OA is barred by limitation under Section 21 of the Administrative Tribunals Act, 1985.
(b) The applicant has not exhausted the remedies available under the service rules (Section 20).
(c) ____________________________________________

Para-wise reply:
Para 1 — Matter of record; needs no reply.
Para 2 — Admitted to the extent that ______; rest is denied. ______
Para 3 — Denied. As per Rule/OM No. ____ dated ____, ______

Reply to the reliefs sought:
The applicant is not entitled to any of the reliefs for the reasons given above.

Financial implication (if the OA is allowed): Rs. ______

(Signature)
Name and designation of the officer
India Meteorological Department` },
    { t: 'Forwarding para-wise comments to counsel', x:
`No. ____________                                         Date: __________
To
Sh./Smt. ____________, Ld. CGSC
____________

Subject: OA No. ____/____ — ____________ vs. Union of India & Ors. before the Hon'ble CAT, ________ Bench — forwarding of para-wise comments — reg.

Sir/Madam,
Please find enclosed the para-wise comments in the above case, approved by the competent authority, with the relevant documents (Annexures R-1 to R-__). The case is listed on __________.
You are requested to draft the counter reply and send it for vetting at the earliest, so that it may be filed before the next date of hearing.
The officer-in-charge of the case is Sh./Smt. ____________ (Phone: ________).

Yours faithfully,
(____________)
For Director General of Meteorology` },
    { t: 'Proposal for filing appeal / SLP', x:
`Subject: Proposal for filing ____________ against the judgment dated ________ of the Hon'ble ________ in ________ No. ____/____ — reg.

1. Brief facts: ____________________________
2. Directions in the judgment: ____________________________
3. Time allowed for compliance: ________   Copy received on: ________
4. Last date for filing appeal / SLP: ________ (Article ___ of the Limitation Act / Rule ___)
5. Grounds on which the judgment is assailable: ____________________________
6. Legal opinion of Ld. counsel (copy enclosed): ____________________________
7. Financial implication and wider effect (similarly placed employees): ____________________________
8. Recommendation: It is proposed to file ____________ along with an application for stay of the judgment.

Approval of the competent authority is solicited.` },
    { t: 'Application for extension of time (points)', x:
`MA No. ____ in OA/WP No. ____/____ — Application for extension of time to comply with the order dated ________

1. The Hon'ble ________ by order dated ________ directed the respondents to ________ within ____ weeks.
2. The respondents have taken the following steps: ________________ (dates).
3. Compliance requires ________ (e.g., approval of Ministry / DoPT / Finance), which is in process.
4. The delay is neither wilful nor deliberate; the respondents respect the order of the Hon'ble ________.
5. Prayer: Extend the time for compliance by ____ weeks/months.` },
    { t: 'Vetting note on an LOA / MOU', x:
`Subject: Vetting of draft ____________ between India Meteorological Department and ____________ — reg.

1. The draft received from ____________ (file no. ________, dated ________) has been examined.
2. Parties and signatories: ____________
3. Observations:
   (a) Clause __ (scope): ____________
   (b) Clause __ (payment / security): ____________
   (c) Clause __ (IPR / data / confidentiality): ____________
   (d) Clause __ (termination): ____________
   (e) Clause __ (dispute resolution / jurisdiction): ____________
4. Subject to the above changes, the draft is legally in order and may be processed for approval of the competent authority.

(____________)
Legal Section` },
    { t: 'Legal opinion on an RTI application', x:
`Subject: RTI application no. ________ dated ________ from Sh./Smt. ____________ — legal opinion — reg.

1. The CPIO, ____________ has sought advice on whether the information at point(s) ____ may be provided.
2. Information sought: ____________
3. Position: The information relates to ____________ (OA/WP No. ____ pending before ____). A matter being sub judice is not by itself a ground for refusal; no court has forbidden its publication [s.8(1)(b)].
4. Point(s) ____ contain personal information of third parties with no larger public interest [s.8(1)(j)]; these may be withheld / severed under s.10.
5. Advice: Information at point(s) ____ may be provided; point(s) ____ may be denied under s.8(1)(__) with reasons.
6. The decision rests with the CPIO.

(____________)
Legal Section` },
    { t: 'Reply to a legal notice (outline)', x:
`No. ____________                                         Date: __________
To
____________ (Advocate for ____________)

Subject: Your legal notice dated ________ on behalf of ____________ — reply — reg.

1. The notice dated ________ received on ________ has been examined.
2. Facts of the matter as per records: ____________________________
3. The claim is not tenable / has been considered as follows: ____________________________
4. Without prejudice to the rights of the department.

(____________)
For Director General of Meteorology` },
  ];
})();
