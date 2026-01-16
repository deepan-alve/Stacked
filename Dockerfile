# Combined Dockerfile - runs both backend and frontend
FROM node:20-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx wget supervisor

# Create directories
WORKDIR /app
RUN mkdir -p /app/backend /app/frontend /app/data /run/nginx /var/log/supervisor

# Copy and build backend
COPY backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm ci --only=production

COPY backend/src/ /app/backend/src/
COPY backend/scripts/ /app/backend/scripts/
COPY backend/migrations/ /app/backend/migrations/
COPY backend/data/movies.db /app/seed/movies.db
COPY backend/entrypoint.sh /app/backend/entrypoint.sh
RUN chmod +x /app/backend/entrypoint.sh

# Copy and build frontend
COPY frontend/package*.json /app/frontend/
WORKDIR /app/frontend
RUN npm ci

COPY frontend/ /app/frontend/
RUN npm run build

# Copy built frontend to nginx
RUN mkdir -p /usr/share/nginx/html
RUN cp -r /app/frontend/dist/* /usr/share/nginx/html/

# Nginx config - proxy to localhost backend
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api { \
        proxy_pass http://127.0.0.1:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_pass_header Set-Cookie; \
    } \
    \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/http.d/default.conf

# Supervisor config
RUN echo '[supervisord] \
nodaemon=true \
logfile=/var/log/supervisor/supervisord.log \
\
[program:backend] \
command=/bin/sh -c "cd /app/backend && ./entrypoint.sh" \
autostart=true \
autorestart=true \
stdout_logfile=/dev/stdout \
stdout_logfile_maxbytes=0 \
stderr_logfile=/dev/stderr \
stderr_logfile_maxbytes=0 \
environment=NODE_ENV=production,PORT=8080,DB_PATH=/app/data/movies.db \
\
[program:nginx] \
command=nginx -g "daemon off;" \
autostart=true \
autorestart=true \
stdout_logfile=/dev/stdout \
stdout_logfile_maxbytes=0 \
stderr_logfile=/dev/stderr \
stderr_logfile_maxbytes=0' > /etc/supervisord.conf

WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/movies.db

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/api/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
