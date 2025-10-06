# Multi-stage build for VO backend + shared using plain npm (no workspaces needed)
FROM node:20-slim AS base
ENV NODE_ENV=production \
    NPM_CONFIG_CACHE=/tmp/.npm
WORKDIR /app

# Install minimal build tooling for native modules if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

# Copy only package manifests first to leverage layer caching
COPY packages/shared/package*.json packages/shared/
COPY packages/vo-backend/package*.json packages/vo-backend/

# Install and build shared (needs dev deps for TypeScript)
RUN cd packages/shared \
 && npm ci --no-audit --no-fund \
 && npm run build

# Copy source code
COPY packages/shared packages/shared
COPY packages/vo-backend packages/vo-backend

# Install backend deps and build (needs dev deps for TypeScript)
RUN cd packages/vo-backend \
 && npm ci --no-audit --no-fund \
 && npm run build

# Runtime image
FROM node:20-slim AS runtime
ENV NODE_ENV=production \
    PORT=3002 \
    NPM_CONFIG_CACHE=/tmp/.npm
WORKDIR /app

# Only copy the built artifacts and node_modules needed at runtime
COPY --from=base /app/packages/shared/dist /app/packages/shared/dist
COPY --from=base /app/packages/vo-backend/dist /app/packages/vo-backend/dist
COPY --from=base /app/packages/vo-backend/node_modules /app/packages/vo-backend/node_modules

# Prune dev dependencies for runtime
RUN cd /app/packages/vo-backend \
 && npm prune --omit=dev --no-audit --no-fund

EXPOSE 3002
CMD ["node", "packages/vo-backend/dist/server.js"]
