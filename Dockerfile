# ----------------------------
# 1. Build Stage
# ----------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install

# Copy the full project
COPY . .

# Build the NestJS app
RUN pnpm build


# ----------------------------
# 2. Production Stage
# ----------------------------
FROM node:22-alpine AS production
WORKDIR /app

# Set NODE_ENV for runtime only
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install --prod

# Copy built dist folder from builder
COPY --from=builder /app/dist ./dist

# Run database migrations before start
CMD ["sh", "-c", "node -r tsconfig-paths/register dist/db/data-source.js migration:run && node dist/main.js"]

EXPOSE 3000
