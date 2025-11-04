# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy the whole monorepo structure (but still install deps only for web)
COPY web/package*.json web/
COPY server/package*.json server/

WORKDIR /app/web
RUN npm ci

# Copy all source files for both web and server
COPY web ./ 
COPY server ../server

# Build Next.js app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WEB_BASE_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WEB_BASE_URL=$NEXT_PUBLIC_WEB_BASE_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

RUN npm run build

# Production stage
FROM node:24-alpine
WORKDIR /app/web
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/web/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/web/.next ./.next
COPY --from=builder /app/web/public ./public
COPY --from=builder /app/web/next.config.ts ./next.config.ts
COPY --from=builder /app/server ../server

EXPOSE 3001
CMD ["npm", "start"]
