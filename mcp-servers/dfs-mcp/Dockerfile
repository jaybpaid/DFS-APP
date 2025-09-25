# Multi-stage build for DFS MCP Server
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy package.json files for all workspaces
COPY mcp-servers/dfs-mcp/package.json ./mcp-servers/dfs-mcp/
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/database && pnpm db:generate

# Build packages
RUN pnpm build:packages

# Build MCP server
RUN cd mcp-servers/dfs-mcp && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 mcpuser
RUN adduser --system --uid 1001 mcpuser

# Copy built application
COPY --from=builder /app/mcp-servers/dfs-mcp/dist ./dist
COPY --from=builder /app/mcp-servers/dfs-mcp/package.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p /app/data /app/uploads /app/logs
RUN chown mcpuser:mcpuser /app/data /app/uploads /app/logs

USER mcpuser

EXPOSE 4000

ENV PORT=4000
ENV HOST=0.0.0.0
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
