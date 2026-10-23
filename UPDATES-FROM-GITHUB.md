# Automatic updates from GitHub

The code lives in **github.com/batraamul/legal**. The server checks it every 15 minutes; when a new version is pushed to the `main` branch it pulls it, rebuilds the container and checks it is healthy — with no one having to log in. If the new version does not start, it goes back to the previous one by itself. The register's data (the `legal-data` Docker volume) is never touched, and a copy of the data file is saved to `/var/backups/` before each update.

## One-time setup on the server

**1. Give the server read access to the repository.** If the repository is **public**, skip this. If it is **private**, make a read-only token:
GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → *Generate new token* → Repository access: *Only select repositories* → `legal` → Permissions: **Contents: Read-only** → Generate. Copy the token (starts with `github_pat_`).

**2. Get the code from GitHub** (this replaces the folder you copied by hand; the data is kept because it lives in the Docker volume):
```bash
sudo apt install -y git
cd /opt
sudo docker compose -f /opt/imd-legal-register/docker-compose.yml down     # only if the old copy is running
sudo mv imd-legal-register imd-legal-register.old                           # only if the old folder exists

# public repository:
sudo git clone https://github.com/batraamul/legal.git imd-legal-register
# private repository (paste your token in place of TOKEN):
sudo git clone https://batraamul:TOKEN@github.com/batraamul/legal.git imd-legal-register
```

**3. Put your password in the local settings file** (kept on the server only, never in GitHub):
```bash
cd /opt/imd-legal-register
sudo cp docker-compose.override.example.yml docker-compose.override.yml
sudo nano docker-compose.override.yml          # set LEGAL_PASS
```

**4. Start, then turn on automatic updates:**
```bash
sudo docker compose up -d --build
sudo ./deploy/install-auto-update.sh
```

**5. Check:**
```bash
systemctl list-timers imd-legal-update.timer   # shows the next check
sudo tail /var/log/imd-legal-update.log         # shows each update
curl http://localhost:1875/api/health           # shows the running version
```

## Publishing a new version (from your PC)

```bash
git clone https://github.com/batraamul/legal.git      # first time only
cd legal
# ... change files ...
git add -A
git commit -m "What changed"
git push
```
Within 15 minutes the server picks it up. Users see it the next time they reload the page.

You can also edit a file directly on github.com (pencil icon → *Commit changes*); the server picks that up the same way.

## Useful commands

| Task | Command |
|---|---|
| Update now instead of waiting | `sudo /opt/imd-legal-register/deploy/auto-update.sh` |
| Pause automatic updates | `sudo systemctl disable --now imd-legal-update.timer` |
| Turn them back on | `sudo systemctl enable --now imd-legal-update.timer` |
| Go back to an earlier version | `cd /opt/imd-legal-register && sudo git log --oneline` then `sudo git reset --hard <id> && sudo docker compose up -d --build` (and pause the timer, or it will update again) |

**Keep in mind:** anything pushed to `main` goes live on the server automatically, so only push tested changes. If the server has no internet access to github.com, automatic updates cannot work; the log will say "fetch failed".
