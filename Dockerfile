FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build client (Vite) + server (esbuild)
RUN pnpm run build

# Startup
CMD ["node", "dist/index.js"]
