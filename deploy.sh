#!/usr/bin/env bash
# Build and start the IMD Legal Register on this server with Docker.
set -e
cd "$(dirname "$0")"
if docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
else
  docker build -t imd-legal-register:1.1.0 .
  docker rm -f imd-legal-register >/dev/null 2>&1 || true
  docker run -d --name imd-legal-register --restart unless-stopped -p 1875:1875 \
    -e LEGAL_USER=legal -e LEGAL_PASS=legal_imd -e TZ=Asia/Kolkata \
    -v imd-legal-data:/data imd-legal-register:1.1.0
fi
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo
echo "IMD Legal Register is starting."
echo "Open:  http://${IP:-<server-address>}:1875   (login: legal / legal_imd)"
