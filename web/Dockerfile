# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci

# Copy entire server directory (needed for tRPC type imports)
COPY server /app/server

# Copy web source code
COPY web/ .

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WEB_BASE_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Set them as env vars for the build
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WEB_BASE_URL=$NEXT_PUBLIC_WEB_BASE_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# Build Next.js application
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files from builder
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
