# IMD Legal Register — a small Node.js server (no npm packages to install)
# Build:  docker build -t imd-legal-register:1.1.0 .
# If Docker Hub is slow or rate-limited, use Google's mirror:
#         docker build --build-arg BASE=mirror.gcr.io/library/node:22-alpine -t imd-legal-register:1.1.0 .
ARG BASE=node:22-alpine
FROM ${BASE}
ENV NODE_ENV=production PORT=1875 DATA_DIR=/data TZ=Asia/Kolkata
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME ["/data"]
EXPOSE 1875
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:1875/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
