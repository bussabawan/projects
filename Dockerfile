# syntax=docker/dockerfile:1
FROM node:24.14.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /usr/src/app
# Copy package files
COPY package.json package-lock.json ./
# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /usr/src/app
ENV NODE_ENV production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /usr/src/app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Ensure upload directory exists and has correct permissions
RUN mkdir -p uploads
RUN chown -R nextjs:nodejs uploads

USER nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static



EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
