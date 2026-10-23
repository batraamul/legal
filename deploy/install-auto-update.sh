#!/usr/bin/env bash
# Turn on automatic updates from GitHub.  Run once:  sudo ./deploy/install-auto-update.sh
set -e
cd "$(dirname "$0")/.."
chmod +x deploy/auto-update.sh
mkdir -p /var/backups
cp deploy/imd-legal-update.service deploy/imd-legal-update.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now imd-legal-update.timer
echo "Automatic updates are on. Check:  systemctl list-timers imd-legal-update.timer"
echo "Log:  tail /var/log/imd-legal-update.log"
