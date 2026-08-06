FROM --platform=linux/amd64 node:22-bookworm-slim AS base

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY client ./client
COPY server ./server
# vite/typescript liegen in client/devDependencies — auch bei NODE_ENV=production installieren
RUN npm ci --include=dev
ENV NODE_ENV=development
ENV VITE_APP_BASE_PATH=/ai/
ENV VITE_UMAMI_SCRIPT_SRC=https://cloud.umami.is/script.js
ENV VITE_UMAMI_WEBSITE_ID=423e42f0-9310-4efa-9a0d-30d8e0437c5f
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PLAYGROUND_BASE_PATH=/ai
USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends iputils-tracepath traceroute \
  && rm -rf /var/lib/apt/lists/* \
  && chown -R node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node client/package.json ./client/
COPY --chown=node:node server/package.json ./server/
COPY --from=builder --chown=node:node /app/client/dist ./client/dist
COPY --from=builder --chown=node:node /app/server/src ./server/src
RUN npm ci --omit=dev
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["sh", "-c", "PORT=3000 HOST=0.0.0.0 exec npm run start"]
