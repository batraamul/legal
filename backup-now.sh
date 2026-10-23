#!/usr/bin/env bash
# Copy the register file out of the container into this folder.
set -e
cd "$(dirname "$0")"
F="imd-legal-register-$(date +%Y%m%d-%H%M).json"
docker cp imd-legal-register:/data/imd-legal-register.json "$F"
echo "Saved $F"
