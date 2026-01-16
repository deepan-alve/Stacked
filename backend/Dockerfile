# Backend Dockerfile for Dokploy
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY migrations/ ./migrations/

# Create directories
RUN mkdir -p /app/data /app/seed

# Copy seed database (will only be used if no existing db)
COPY data/movies.db /app/seed/movies.db

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/movies.db

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start with entrypoint script
CMD ["/app/entrypoint.sh"]
