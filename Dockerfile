# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application source
COPY . .

# Build Vite frontend and compile the server.ts backend
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/db.json
ENV PORT=3000

# Copy package descriptors
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets and compiled commonJS bundle from builder
COPY --from=builder /app/dist ./dist

# Create folder for database persistence
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start server using production compiled script
CMD ["node", "dist/server.cjs"]
