# Backend Dockerfile for Dokploy
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install git for git backup functionality and wget for healthcheck
RUN apk add --no-cache git wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY migrations/ ./migrations/

# Create directories for database and backups
RUN mkdir -p /app/data /app/backups

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/stacked.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
