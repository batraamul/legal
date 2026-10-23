# IMD Legal Register

A leather-bound register for the **Legal Section, India Meteorological Department**: every court case, region / RMC-wise, with its hearings, orders, documents and letters; a hearing calendar and cause list; orders and compliance deadlines; **opinions and vetting** — LOA / MOU vetting, legal opinions on RTI applications, recruitment and extension, administrative matters and DoLA references; legal notices; Government counsel and their fee bills; a **Ready Reference** of limitation periods, procedures, formats and a glossary; reports and a change log. From all of this it builds a **Dashboard**: emergencies to act on today, a box where typing any reference (case number, file number, LOA / MOU number, party, region) brings up the complete picture of that matter, the week's cause list, work in hand by type and by region, and every action due — before a deadline turns into an adverse order or contempt.

It runs on one server inside Docker. Anyone on the network opens it in a browser at the server's address and port **1875** (the year IMD was founded), and logs in with the Legal Section account. The register is kept on the server as **one JSON file**; a copy is downloaded to the user's computer when the register is closed, and a JSON file can be uploaded back at any time.

---

## 1. Put it on the server (Docker)

> Full step-by-step instructions, including servers without internet and Windows, are in **`INSTALL-DOCKER.md`**. The short version:

**Needs:** a Linux (or Windows) server with Docker and Docker Compose.

1. Copy the folder `imd-legal-register` to the server, e.g. `/opt/imd-legal-register`.
2. In that folder run:
   ```bash
   docker compose up -d --build
   ```
   (or `./deploy.sh`, which does the same and prints the address).
3. Open **`http://<server-address>:1875`** from any computer on the network.
4. Log in with **username `legal`** and **password `legal_imd`**, and type your own name (it goes into the change log).

**Change the password before going live:** copy `docker-compose.override.example.yml` to `docker-compose.override.yml`, set `LEGAL_PASS` there, and run `docker compose up -d` again. That file stays on the server and is not overwritten by updates from GitHub.

**Automatic updates from GitHub:** see `UPDATES-FROM-GITHUB.md`.

**Firewall:** allow TCP port 1875 on the server (e.g. `sudo ufw allow 1875/tcp`). To use another port, change the left number in `ports: - "1875:1875"`.

**Without Docker** (for a quick trial): install Node.js 18 or newer and run `node server.js` in the folder. Data goes to `./data`.

| Docker command | What it does |
|---|---|
| `docker compose up -d --build` | Build and start (also after updating the files) |
| `docker compose logs -f` | See the server's messages |
| `docker compose restart` | Restart (users stay logged in) |
| `docker compose down` | Stop (the data stays in the `legal-data` volume) |
| `./backup-now.sh` | Copy the register file out of the container into this folder |

### Where the data is
Inside the container at `/data` (a Docker volume called `legal-data`, which survives rebuilds and restarts):
- `/data/imd-legal-register.json` — **the register** (everything).
- `/data/backups/` — a copy every hour of use and before every upload or restore (the newest 120 are kept).

---

## 2. Opening, saving and closing

- **Login** — the closed leather cover. Username and password are the same for the whole section; *Your name* is remembered on that computer and shown in the change log.
- **Saving** — every change is saved to the server within a second (the pill at the top shows *Saved on server*). If two people change the register at the same time, both changes are kept: the server merges them entry by entry, and each screen picks up the other's changes within 20 seconds.
- **If the server cannot be reached** — the pill turns red. Changes stay in the browser and are sent as soon as the server answers; if the browser is closed meanwhile, they are merged in the next time you log in on that computer.
- **Closing** — click the **book button** (top right). The register is saved, **a copy (`IMD-Legal-Register-YYYY-MM-DD-HHMM.json`) is downloaded to your computer**, and you are logged out.
  Closing the browser tab or window also downloads the copy; the browser first asks *Leave site?* — choose **Leave** (or *Cancel* to stay). Both can be switched off in Settings → *When the register is closed*.
  *Tip:* in Chrome / Edge, turn off “Ask where to save each file” so the copy goes straight to Downloads. The first time, the browser may ask to allow downloads from the site — allow it.
- **Download any time** — the ⤓ button.
- **Upload a file** — the ⤒ button. Choose a register `.json` file. The register shows what is in the file and what is on the server, and asks **“Do you want to override the existing data?”**
  - **Yes, override existing data** — the server's register is replaced by the file (after one more confirmation).
  - **No — merge, keep both** — new entries in the file are added; where the same entry was changed in both, the newer one is kept.
  Either way the server first saves a backup of the present data.
- **Server backups** — Settings → *Server backups…* lists the backups; download one, or **Restore** it for everyone.

---

## 3. The tabs

| Tab | What it holds |
|---|---|
| **Dashboard** | **Emergencies — act today** (contempt hearing tomorrow, compliance date passed or within 3 days, limitation ending within 7 days, counter overdue, RTI opinion due) with a one-line hint each; **Look up anything by reference** — type part of a case number, file number, LOA / MOU number, party or region and open the *complete picture*; the action list (Overdue · Within 2 days · This week · Coming up · Watch); the cause list for 7 days; work at a glance; and a **region-wise** table (cases, hearings this week, opinions pending, urgent items) — click a region for that region's picture. A red pill at the top of every page shows how many emergencies there are. |
| **Cases** | The case register, filterable by **region / RMC**, status (including NFU and DoLA cases), court, subject and office. Each case: summary, hearings (entering the next date updates the case), orders (compliance date and appeal limitation worked out), documents, letters, follow-ups and actions; the ☰ button shows the complete picture on one card. |
| **Advisory & Vetting** | **Opinions & vetting** — LOA / MOU vetting, RTI — legal opinion, recruitment / extension, administrative matters, DoLA references, other legal opinions and contract disputes, each with file number, region, office, due date for the opinion (vetting 7 days, RTI opinion 3 days, recruitment / administrative 10 days, DoLA 30 days), status, DoLA reference, the opinion in brief and a movement log. Also **legal notices** (s.80 CPC reply period worked out) and **follow-ups**. |
| **Hearings** | Month calendar of next dates and past hearings; the cause list for any day (printable), and the next 30 days. *Record outcome* for a date that has passed. |
| **Orders & Compliance** | Every order needing action — comply-by date and appeal-by date side by side; a **limitation calculator**; contempt watch; interim orders in force. |
| **Counsel & Fees** | Government counsel (cases they hold, when their engagement ends), fee bills from receipt to payment, and the list of courts and forums. |
| **Ready Reference** | Limitation and timelines (searchable); checklists for a court notice, para-wise comments, counter affidavits, judgments, avoiding contempt, **RTI legal opinions**, **LOA / MOU vetting**, **recruitment and extension**, **DoLA references** and legal notices; formats (para-wise comments, letters to counsel, appeal proposal, extension of time, vetting note, RTI opinion, reply to a legal notice); a glossary; and the section's own notes. |
| **Reports** | Statistics (pending by age, by region, by subject; results; opinions and vetting by type; filed and decided each year), printouts (region-wise register of pending cases, action report, compliance statement), CSV exports and the change log. |

### How the Dashboard decides what to show
| It warns about | When |
|---|---|
| A hearing | 7 days ahead (stronger at 2 days and on the day); a past date with no outcome recorded is **overdue** |
| Counter / reply due | 15 days ahead; reminds you if para-wise comments have not been sent |
| Para-wise comments | due 15 days after the notice was received |
| Compliance with a court order | 30, then 7, then 2 days ahead — after the date: **contempt risk** |
| Last date for appeal / review / SLP | 45 days ahead of the date worked out for the remedy (LPA 30 days, SLP 90 days, CAT review 30 days from copy, consumer appeals 45/30 days, s.34 Arbitration 3 months…) |
| Opinions and vetting | 3 days before the opinion is due; a DoLA reference with no reply for 30 days is flagged |
| Legal notice reply | 15 days ahead |
| Watch items | DoLA references without reply, contempt matters, interim orders in force, no next date, judgment reserved over 90 days, no hearing for 180 days, no counsel recorded, counsel's engagement ending, fee bill unpaid after 60 days |

All the windows can be changed in Settings → *Warn me ahead*.

> The periods in Ready Reference are as stated in the Acts and Rules named. Always check the current text and the court's own directions; a direction in the order overrides a general period.

### First steps
1. The register opens with **example entries** (marked *Example*). Click **Clear examples** on the Dashboard when ready.
2. Settings (⚙): office names, your name, warning windows, and the list of **regions / RMCs** (one per line — Headquarters, RMC New Delhi, Mumbai, Chennai, Kolkata, Guwahati, Nagpur, IMD Pune are there to start).
3. Counsel & Fees → add your **Government counsel**; Courts & forums → add any court not in the list.
4. Add cases (**N** or *New case*) with their region, then their hearings and orders; add opinion and vetting work with **M** or *New matter*.

**Looks:** the palette button — Court Maroon, Barrister Black, Law Report Green, Navy Brief, Government File (buff cover with red tape) and Monsoon Teal; light or dark pages.

**Keys:** `1`–`8` tabs · `/` or `Ctrl K` look up by reference · `N` new case · `M` new opinion / vetting matter · `Ctrl S` save now · `Ctrl Enter` save a dialog · `Esc` close · `?` help.

**Upgrading from 1.0:** any old RTI entries become *RTI — legal opinion* matters automatically.

**Phone or tablet:** the same address works; the tabs move to a bar at the bottom.

---

## 4. Security notes

- The login is checked on the server; a session lasts 12 hours of inactivity (`SESSION_HOURS`). Eight wrong passwords from one computer lock it out for 15 minutes.
- The single shared account means the change log relies on the names people type at login.
- The app is served over plain **http**. On an office network that is usual; for access from outside, put it behind an https reverse proxy (Nginx, Caddy, IIS) and set `COOKIE_SECURE=1`.
- Downloaded copies contain the whole register. Keep them on official computers and delete old copies you no longer need.

## 5. Troubleshooting

- **The page does not open** — check `docker ps` (status *healthy*), the firewall (port 1875), and use the server's address, not `localhost`, from other computers.
- **“Not saved — server unreachable”** — the server or network is down; keep working, changes are sent when it is back.
- **No file is downloaded on closing** — allow downloads for the site in the browser; use the book button, which always downloads.
- **Logged out unexpectedly** — the session ended after 12 idle hours; log in again. Unsaved changes are merged back in.
- **Wrong date or time** — `TZ` in `docker-compose.yml` must be `Asia/Kolkata`.

## 6. Files

| File | Purpose |
|---|---|
| `server.js` | The server: login, the JSON data file, merging, backups (plain Node.js, no packages) |
| `public/` | The app: `index.html`, `login.html`, `css/`, `js/`, `icons/` |
| `Dockerfile`, `docker-compose.yml`, `.dockerignore` | Docker build and run |
| `UPDATES-FROM-GITHUB.md`, `deploy/` | Install from GitHub and update the server automatically |
| `INSTALL-DOCKER.md` | Step-by-step installation, servers without internet, Windows, backups, updates |
| `deploy.sh`, `backup-now.sh`, `make-offline-package.sh` | Start on a server; copy the data file out; make an image file for a server without internet |
| `demo/`, `tools/build-demo.mjs` | A one-file demo (runs without a server, data kept in the browser) and the script that builds it |
| `DEVELOPER-GUIDE.md` | How the code works and how to change it |
