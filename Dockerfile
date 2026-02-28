FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build client
RUN bun run build

# Production
EXPOSE 3001
CMD ["bun", "src/server/index.ts"]
