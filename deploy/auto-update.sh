#!/usr/bin/env bash
# IMD Legal Register — automatic update from GitHub.
# Runs every 15 minutes (systemd timer). If GitHub has a newer version, it pulls it,
# rebuilds the container and checks it is healthy. If the new version fails, it goes back
# to the version that was running. The register's data (Docker volume legal-data) is never touched.
set -u
APP_DIR="${APP_DIR:-/opt/imd-legal-register}"
BRANCH="${BRANCH:-main}"
LOG=/var/log/imd-legal-update.log
exec >>"$LOG" 2>&1
cd "$APP_DIR" || exit 1
exec 9>/tmp/imd-legal-update.lock; flock -n 9 || exit 0     # one run at a time

git fetch --quiet origin "$BRANCH" || { echo "$(date '+%F %T') fetch failed (no network?)"; exit 0; }
OLD=$(git rev-parse HEAD); NEW=$(git rev-parse "origin/$BRANCH")
[ "$OLD" = "$NEW" ] && exit 0

echo "$(date '+%F %T') update ${OLD:0:7} -> ${NEW:0:7}"
# copy the data file out first, just in case
docker cp imd-legal-register:/data/imd-legal-register.json "/var/backups/imd-legal-register-before-${NEW:0:7}.json" 2>/dev/null || true

git reset --hard --quiet "$NEW"                 # docker-compose.override.yml is not in git, so local settings stay
if docker compose up -d --build; then
  for i in $(seq 1 30); do
    curl -fs http://127.0.0.1:${PORT:-1875}/api/health >/dev/null && { echo "$(date '+%F %T') OK, now on ${NEW:0:7}"; docker image prune -f >/dev/null; exit 0; }
    sleep 2
  done
fi
echo "$(date '+%F %T') new version did not start — going back to ${OLD:0:7}"
git reset --hard --quiet "$OLD"
docker compose up -d --build
