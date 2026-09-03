# ---------- Build stage ----------
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install dependencies (incl. dev deps for Prisma generate + Vite build)
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Build frontend (vite build -> dist/)
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Non-root user for the container
RUN groupadd -r warung && useradd -r -g warung -d /app warung

# Runtime deps: full node_modules from build stage (keeps @prisma/client engines intact)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/server.ts ./server.ts
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# Writable logs dir
RUN mkdir -p /app/logs && chown -R warung:warung /app

USER warung
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["npx", "tsx", "server.ts"]
