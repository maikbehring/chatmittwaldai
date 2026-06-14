FROM --platform=linux/amd64 node:22-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY client ./client
COPY server ./server
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN chown -R node:node /app
USER node
COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/client/package.json ./client/package.json
COPY --from=builder --chown=node:node /app/client/dist ./client/dist
COPY --from=builder --chown=node:node /app/server ./server
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["sh", "-c", "PORT=3000 HOST=0.0.0.0 exec npm run start"]
