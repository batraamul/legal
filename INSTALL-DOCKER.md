# Installing the IMD Legal Register with Docker

Step-by-step, for the person who looks after the server. Allow about 15 minutes the first time.

**What you get:** one Docker container named `imd-legal-register`, listening on port **1875**. Users open `http://<server-address>:1875` in any browser and log in with **legal / legal_imd**. The register is kept in a Docker volume called `legal-data`.

---

## 1. What the server needs

| | |
|---|---|
| Operating system | Linux (Ubuntu 20.04+, RHEL/Rocky 8+, Debian 11+) — or Windows Server / Windows 10–11 with Docker Desktop |
| Docker | Docker Engine 20.10 or newer, with the Compose plugin (`docker compose version` should print a version) |
| Memory / disk | 256 MB RAM, 500 MB disk is plenty |
| Network | TCP port 1875 open to the office network |

Check Docker:
```bash
docker --version
docker compose version
```
Install Docker on Ubuntu if needed: `curl -fsSL https://get.docker.com | sudo sh` (or your organisation's approved method).

---

## 2. Copy the files to the server

Unzip `IMD-Legal-Register-v1.1.zip` and copy the folder `imd-legal-register` to the server, for example:

```bash
sudo mkdir -p /opt
sudo cp -r imd-legal-register /opt/
cd /opt/imd-legal-register
```

The folder contains `Dockerfile`, `docker-compose.yml`, `server.js`, `public/` and these instructions.

---

## 3. Set the password (recommended)

Open `docker-compose.yml` and change the password before going live:

```yaml
    environment:
      LEGAL_USER: legal
      LEGAL_PASS: legal_imd     # ← put the Legal Section's password here
```

To use a different port, change the **left** number on the `ports` line, e.g. `"8443:1875"` makes it `http://<server>:8443`.

---

## 4. Build and start

**A. Server with internet (normal case)**

```bash
cd /opt/imd-legal-register
sudo docker compose up -d --build
```

or simply `sudo ./deploy.sh`, which does the same and prints the address.

If the build stops with *429 Too Many Requests* (Docker Hub limit), build from Google's mirror instead:
```bash
sudo docker build --build-arg BASE=mirror.gcr.io/library/node:22-alpine -t imd-legal-register:1.1.0 .
sudo docker compose up -d
```

**B. Server without internet (intranet only)**

On any computer that has internet and Docker:
```bash
cd imd-legal-register
./make-offline-package.sh        # makes imd-legal-register-1.1.0.tar (about 60 MB)
```
Copy `imd-legal-register-1.1.0.tar` and the `imd-legal-register` folder to the server (pen drive / network share), then on the server:
```bash
cd /opt/imd-legal-register
sudo docker load -i imd-legal-register-1.1.0.tar
sudo docker compose up -d        # uses the loaded image — no internet needed
```

**C. Without Docker Compose** (plain Docker):
```bash
sudo docker build -t imd-legal-register:1.1.0 .
sudo docker run -d --name imd-legal-register --restart unless-stopped \
  -p 1875:1875 -e LEGAL_USER=legal -e LEGAL_PASS=legal_imd -e TZ=Asia/Kolkata \
  -v legal-data:/data imd-legal-register:1.1.0
```

**D. Windows (Docker Desktop)** — open PowerShell in the folder:
```powershell
docker compose up -d --build
```
Then allow port 1875 in Windows Defender Firewall:
```powershell
New-NetFirewallRule -DisplayName "IMD Legal Register" -Direction Inbound -Protocol TCP -LocalPort 1875 -Action Allow
```

---

## 5. Check that it is running

```bash
sudo docker ps
```
should show `imd-legal-register   Up … (healthy)   0.0.0.0:1875->1875/tcp`.

```bash
curl http://localhost:1875/api/health
```
should print `{"ok":true,"version":"1.1.0"}`.

Open the firewall on Linux if other computers cannot reach it:
```bash
sudo ufw allow 1875/tcp                                   # Ubuntu
sudo firewall-cmd --permanent --add-port=1875/tcp && sudo firewall-cmd --reload   # RHEL / Rocky
```

Find the server's address with `hostname -I` (Linux) or `ipconfig` (Windows), then from any office computer open:

```
http://<server-address>:1875
```

Log in with **legal / legal_imd** (or the password you set). Type your name too — it goes into the change log.

---

## 6. Everyday commands

| Task | Command |
|---|---|
| See the server's messages | `sudo docker compose logs -f` |
| Restart (users stay logged in) | `sudo docker compose restart` |
| Stop | `sudo docker compose down` (data is kept) |
| Start again | `sudo docker compose up -d` |
| Copy the register file out | `sudo ./backup-now.sh` (makes `imd-legal-register-YYYYMMDD-HHMM.json` here) |
| See the files inside | `sudo docker exec imd-legal-register ls -l /data /data/backups` |

**Daily backup off the server** — add to root's crontab (`sudo crontab -e`):
```
30 18 * * * cd /opt/imd-legal-register && ./backup-now.sh >/dev/null 2>&1
```
Copy those files to another machine or the office backup share now and then.

---

## 7. Updating to a new version

```bash
cd /opt/imd-legal-register
# replace the files with the new version (keep your docker-compose.yml changes)
sudo docker compose up -d --build
```
The data in the `legal-data` volume is not touched. Users see the new version on their next reload.

---

## 8. Moving or restoring the data

- **From the browser:** the ⤒ (upload) button takes a register `.json` file and asks whether to override or merge. The server keeps a backup first.
- **From the command line:**
  ```bash
  sudo docker cp my-register.json imd-legal-register:/data/imd-legal-register.json
  sudo docker compose restart
  ```
- **Server backups** (one per hour of use, and before every upload or restore) are in `/data/backups` and can be restored from **Settings → Server backups** in the app.

**Never delete the volume** unless you mean to erase the register: `docker compose down -v` deletes it.

---

## 9. Settings you can change (in `docker-compose.yml`)

| Setting | Default | Meaning |
|---|---|---|
| `LEGAL_USER` / `LEGAL_PASS` | legal / legal_imd | The login |
| `ports` | `"1875:1875"` | Left number = port users type in the address |
| `TZ` | Asia/Kolkata | Time zone |
| `SESSION_HOURS` | 12 | Idle hours before users must log in again |
| `KEEP_BACKUPS` | 120 | Number of server backups kept |
| `COOKIE_SECURE` | – | Set to `1` if you put the app behind https |

After any change: `sudo docker compose up -d`.

---

## 10. If something goes wrong

| What you see | What to do |
|---|---|
| The page does not open from other computers | Check `docker ps` shows *healthy*; open port 1875 in the firewall; use the server's IP, not `localhost` |
| `port is already allocated` | Another program uses 1875 — change the left number in `ports` |
| Build fails with *429 Too Many Requests* | Use the mirror command in step 4A, or the offline method in 4B |
| Build fails with *apk* or network errors | Use the offline method (4B) |
| Wrong dates / times | Check `TZ: Asia/Kolkata` in `docker-compose.yml` |
| Forgot the password | Read it from `docker-compose.yml`, or set a new one there and run `docker compose up -d` |
| `permission denied` on the volume | Do not bind-mount a host folder owned by root; keep the `legal-data` volume as in the compose file |
