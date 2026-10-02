# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build-time env vars required by Next.js static page data collection
ARG SESSION_SECRET
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL=http://localhost:81
ARG DATABASE_URL=file:/data/app.db
ENV SESSION_SECRET=$SESSION_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV DATABASE_URL=$DATABASE_URL

# Build Next.js (output: standalone)
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

# Copy Prisma client & schema (needed at runtime for migrations / db access)
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder /app/prisma                ./prisma

# Create DB directory and set ownership
RUN mkdir -p /data && chown nextjs:nodejs /data
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Run the standalone server
CMD ["bun", "server.js"]
