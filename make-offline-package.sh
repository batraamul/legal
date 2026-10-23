#!/usr/bin/env bash
# On a computer WITH internet: build the image and save it to a file you can carry to a server without internet.
set -e
cd "$(dirname "$0")"
docker build -t imd-legal-register:1.1.0 .
docker save -o imd-legal-register-1.1.0.tar imd-legal-register:1.1.0
echo "Made imd-legal-register-1.1.0.tar — copy it to the server together with docker-compose.yml"
echo "On the server:  docker load -i imd-legal-register-1.1.0.tar   then   docker compose up -d"
