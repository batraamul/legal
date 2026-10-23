# IMD Legal Register — Developer Guide

For anyone who has to deploy, understand, change or maintain the code. It follows the same plan as the E-Diary Planner: plain HTML, CSS and JavaScript, one global object, views that return HTML, and event delegation through `data-act` attributes. The difference is that the data lives on a server, not in the browser.

## 1. The short version

| Question | Answer |
|---|---|
| What is it? | A small **Node.js server** (`server.js`, no npm packages) + a **static web app** (`public/`). |
| Languages | JavaScript (Node 18+ on the server, ES2019 in the browser), HTML5, CSS3. No framework, no build step. |
| Data | One JSON file on the server: `$DATA_DIR/imd-legal-register.json` (`/data` in Docker), with rolling backups in `$DATA_DIR/backups/`. |
| Login | One account from `LEGAL_USER` / `LEGAL_PASS` (default `legal` / `legal_imd`); session cookie `imdlr` (HttpOnly, SameSite=Strict). |
| Port | `PORT`, default **1875**. |
| Internet needed? | No. Everything is served from the server; no CDN, no web fonts. |

## 2. Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 1875 | Port the server listens on (inside the container) |
| `LEGAL_USER`, `LEGAL_PASS` | legal, legal_imd | The login (username is not case-sensitive) |
| `DATA_DIR` | `./data` (`/data` in Docker) | Where the register, backups and sessions are kept |
| `SESSION_HOURS` | 12 | Idle time before a new login is needed |
| `KEEP_BACKUPS` | 120 | Number of backup files kept |
| `COOKIE_SECURE` | – | Set to `1` when served through https |
| `TZ` | Asia/Kolkata (Docker) | Time zone for backup names and dates |

## 3. Server (`server.js`)

| Route | Login | What it does |
|---|---|---|
| `GET /api/health` | no | `{ ok, version }` — used by the Docker health check |
| `POST /api/login` `{username, password, name}` | no | Checks the login (timing-safe), sets the cookie; 8 failures from one IP → 15-minute lock |
| `POST /api/logout` | yes | Ends the session |
| `GET /api/meta` | yes | `{ rev, savedAt, savedBy, fresh }` — the browser polls this every 20 s |
| `GET /api/data` | yes | `{ meta, data }` — the whole register |
| `PUT /api/data` `{baseRev, data, by, mode}` | yes | `mode: 'save'` — if `baseRev` equals the stored revision the data is written as is, otherwise it is **merged** with the stored copy and the merged copy is returned; `'replace'` — upload/override (backup first); `'merge'` — upload/merge (backup first) |
| `GET /api/download` | yes | The register as a file |
| `GET /api/backups`, `GET /api/backups/<name>`, `POST /api/backups/<name>/restore` | yes | List, download, restore a backup (backup first) |
| anything else | – | Static files from `public/`; without a session, `/` serves `login.html` |

Writes are queued one after another, written to `*.tmp`, `fsync`-ed and renamed, so the file is never half-written. A file that cannot be parsed at start-up is copied aside (`*.damaged-<time>`) rather than overwritten. Sessions are kept in memory and in `$DATA_DIR/.sessions.json` (mode 600), so a restart does not log people out. Security headers: a strict Content-Security-Policy (`script-src 'self'`, no inline scripts), `X-Frame-Options: DENY`, `nosniff`, `no-referrer`.

## 4. Merging (`public/js/merge.js`, used by both sides)

Every entry in the lists `cases, matters, notices, rti, counsel, fees, courts, refs, tasks` has an `id` and an `updatedAt` (ms). Two copies merge by id: the entry with the later `updatedAt` wins; deletions are recorded in `deleted: { id: time }` and win over any older edit (tombstones are dropped after 400 days). `settings` goes as a whole by `settings._at`; `actionState` (done/snoozed actions) per key by `at`; the `audit` log is united and capped at 600. A case's hearings, orders, documents and letters are stored inside the case, so they travel with it.

## 5. Browser code (`public/js/`, loaded in this order)

| File | Part |
|---|---|
| `util.js` | `LR.util` — date keys (`'YYYY-MM-DD'`, local time), formatting, `esc()`, downloads, CSV |
| `merge.js` | `LR.merge` — see above |
| `icons.js` | `LR.icon(name)` line icons; `LR.emblem()` scales-under-a-cloud emblem |
| `ui.js` | `LR.ui` — `modal`, `form` (dialog built from a field list), `confirm`, `choose`, `toast`, `menu` |
| `refs.js` | `LR.refs` — lists for the forms, appeal remedies with their periods, and the Ready Reference content (`TIMELINES`, `PROCEDURES`, `GLOSSARY`, `TEMPLATES`) |
| `sample.js` | `LR.sample` — default settings, starter courts, example entries |
| `store.js` | `LR.store` — load, `commit()`, save (debounced), poll, upload, download, logout |
| `rules.js` | `LR.rules` — case helpers, `limitation()`, **`actions()`, the preemptive action engine**, `emergencies()` (the subset to act on today, with a hint each) and `regions()` |
| `editors.js` | `LR.editors` — the dialogs for cases, hearings, orders, documents, letters, follow-ups, notices, RTI, counsel, fees, courts, notes |
| `view-board.js` | `LR.views.board` (Dashboard: emergencies, reference lookup, region table) and `LR.views.cases` (register, case detail, region picture) |
| `picture.js` | `LR.find(q)` — search every register by any reference; `LR.picture(kind, id)` — the complete-picture card |
| `view-more.js` | Advisory & Vetting (matters, legal notices, follow-ups), Hearings, Orders & Compliance, Counsel & Fees, Ready Reference, Reports |
| `settings.js` | `LR.settings` — Settings, looks, server backups, search, printing, CSV export |
| `app.js` | Shell, tabs, `render()`, click/change/keyboard handling, the cover, closing with download |

**The rule for any change:** change `LR.store.data` → `LR.store.commit('what was done')`. That stamps the change log, saves to the server within a second and redraws. For list entries use `LR.store.upsert(coll, item, what)` and `LR.store.remove(coll, id, what)` (which sets `updatedAt` / the tombstone and offers Undo).

**Drawing:** each view has `left(sub)` and `right(sub)` returning HTML for the two pages; optional `subs` (top-bar pages), `count()` (badge on the side tab). User text always goes through `U.esc()`.

**Clicks:** `<button data-act="open-case" data-id="…">` → `A['open-case'](dataset, element)` in `app.js`. Inputs use `data-change="…"` → `CH[...]`.

**Closing:** the book button saves, downloads `S.download()` and logs out. `beforeunload` downloads the same copy and, if `askBeforeClose` is on or changes are unsaved, asks the browser's *Leave site?* question; unsaved changes under 60 KB are also sent with a `keepalive` request. If a save fails, the unsent copy is kept in `localStorage` (`imdlr-unsaved`) and merged in at the next start.

## 6. The data file

```js
{
  app: 'IMD-Legal-Register', format: 1,
  meta: { rev, savedAt, savedBy, createdAt, updatedAt, seeded },
  settings: { orgName, orgHindi, section, sectionHindi, ministry, look, dark, cover, autoDownload, askBeforeClose, filePrefix, sampleBanner,
              regions: [ 'Headquarters (DGM), New Delhi', 'RMC New Delhi', … ],
              alerts: { hearing, reply, compliance, appeal, writTarget, matter, dola, fees, dormant, reserved, panel, paraDays }, _at },
  cases: [ { id, region, caseType, number, year, courtId, bench, dola, dolaRef, petitioner, respondents, imdRole, category, subject, relief,
             office, section, nodal, counselId, oppCounsel, fileNo, limbs, linked, amount, priority,
             filedOn, noticeOn, replyDue, paraSentOn, counterOn, nextDate, nextPurpose,
             status: 'Pending'|'Reserved'|'Disposed'|'Closed', stage, result, reservedOn, contempt, stay, stayText, notes,
             hearings: [ { id, date, purpose, item, attended, proceedings, nextDate, nextPurpose } ],
             orders:   [ { id, date, kind, copyOn, result, summary, direction, complianceDue, action, remedy, compliedOn, appealRef, notes } ],
             docs:     [ { id, date, kind, title, ref, link, notes } ],
             letters:  [ { id, date, dir: 'in'|'out', with, ref, subject, replyBy, notes } ],
             createdAt, updatedAt, sample } ],
  matters: [ { id, type: 'LOA / MOU vetting'|'RTI — legal opinion'|'Recruitment / extension'|'Administrative matter'|'DoLA reference'|'Legal opinion (other)'|'Contract / tender dispute'|'Other',
              ref, receivedOn, dueOn, region, fromOffice, subject, party, value, priority, assigned, status, opinionOn, dolaRef, dolaOn, caseId, advice, notes,
              history: [ { date, note } ] } ],
  notices: [ { id, kind, receivedOn, region, from, advocate, subject, demand, office, replyDue, repliedOn, replyRef, status, caseId, notes } ],
  rti:     [],   // no longer used: entries from 1.0 are turned into 'RTI — legal opinion' matters on load
  counsel: [ { id, name, type, courts, phone, email, address, termFrom, termTo, notes } ],
  fees:    [ { id, counselId, caseId, billNo, billDate, stage, amount, status, paidOn, notes } ],
  courts:  [ { id, name, short, kind: 'cat'|'hc'|'sc'|'cons-d'|'cons-s'|'cons-n'|'cic'|'civil'|'labour'|'arb'|'comm'|'other', place, site, notes } ],
  refs:    [ { id, title, cat, source, body } ],
  tasks:   [ { id, caseId, text, due, who, done } ],
  actionState: { '<action key>': { at, done } | { at, snooze: 'YYYY-MM-DD' } },
  audit: [ { id, at, by, what } ],
  deleted: { '<id>': time }
}
```

Every list entry also carries `updatedAt` (and `sample: true` for example entries).

## 7. The demo build

`node tools/build-demo.mjs` writes `demo/IMD-Legal-Register-demo.html`: every CSS and JS file inlined, plus `js/demo.js`, which stands in for the server (`LR.demoApi`) and keeps the register in the browser's localStorage. `LR.demo` switches off downloads, printing and logout, which a preview frame cannot do. It is for showing the register; the real app always runs with `server.js`.

## 8. Common changes

| I want to… | Edit |
|---|---|
| Change a limitation period or add a remedy | `R.REMEDIES` and `R.defaultRemedy` in `refs.js` |
| Add a row to Ready Reference | `R.TIMELINES`, `R.PROCEDURES`, `R.GLOSSARY`, `R.TEMPLATES` in `refs.js` |
| Add a new kind of warning | a new block in `M.actions()` in `rules.js` (give it a stable `key` that includes the date it depends on) |
| Add a field to cases | `Ed.caseForm()` in `editors.js` (field list) and the summary rows in `V.caseDetail()` in `view-board.js`; add it to `SET.exportCases()` if it should be in the CSV |
| Add a case type / category / stage | `R.CASE_TYPES`, `R.CATEGORIES`, `R.STAGES` in `refs.js` |
| Add a kind of advisory work, or change its usual days | `R.MATTER_TYPES` in `refs.js` (name, days, short name) |
| Change the starting regions | `R.REGIONS` in `refs.js` (existing registers: Settings → Regions / RMCs) |
| Add a look | `SET.LOOKS` in `settings.js` + a `html[data-look="…"]` block in `css/tokens.css` (and `css/login.css`) |
| Change the starter courts | `S.courts()` in `sample.js` (new registers only; existing ones: Counsel & Fees → Courts & forums) |

After editing, rebuild: `docker compose up -d --build`. The browser loads new files on the next reload (files are served with `Cache-Control: no-cache`).

## 9. Testing a change

1. Log in, add a case with a region, a hearing with a next date, and an adverse final order with a compliance date; check the Dashboard, the emergency pill and the region table. Type the case number in *Look up anything by reference*.
2. Open the register in two browsers, change different entries in each; both changes must appear in both within 20 seconds.
3. Close with the book button — a JSON file must download and the session end.
4. Upload that file → *override* and → *merge*; Settings → Server backups shows the backups made first.
5. `docker compose restart` — the data and the login survive.
6. Narrow the window to phone width; switch looks and dark pages.
