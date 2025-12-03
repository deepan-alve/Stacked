# Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build arguments for Supabase
ARG SUPABASE_DB_HOST
ARG SUPABASE_DB_PASSWORD

# Install git for git backup functionality
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/

# Create data directory for SQLite
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/movies.db
ENV SUPABASE_DB_HOST=$SUPABASE_DB_HOST
ENV SUPABASE_DB_PORT=5432
ENV SUPABASE_DB_NAME=postgres
ENV SUPABASE_DB_USER=postgres
ENV SUPABASE_DB_PASSWORD=$SUPABASE_DB_PASSWORD
ENV BACKUP_INTERVAL_HOURS=6

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
