# Stacked - Docker Deployment Guide

## 🚀 One-Command Deployment

SSH into your Hetzner VPS and run:

```bash
curl -fsSL https://raw.githubusercontent.com/deepan-alve/Stacked-db/main/deploy.sh | bash
```

**That's it!** The script will:
1. ✅ Install Docker & Docker Compose
2. ✅ Clone the repository
3. ✅ Ask for your configuration (domain, Supabase credentials)
4. ✅ Build and deploy everything
5. ✅ Set up SSL automatically (if domain is configured)

---

## Manual Setup (Alternative)

If you prefer step-by-step:

```bash
# 1. Clone repository
git clone https://github.com/deepan-alve/Stacked-db.git ~/stacked
cd ~/stacked

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 3. Deploy
chmod +x deploy.sh
./deploy.sh
```

---

## Environment Variables

Edit `.env` with your values:

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your domain for SSL | `stacked.yourdomain.com` |
| `ACME_EMAIL` | Email for Let's Encrypt | `you@email.com` |
| `SUPABASE_DB_HOST` | Supabase database host | `db.xxx.supabase.co` |
| `SUPABASE_DB_PASSWORD` | Supabase database password | `your-password` |
| `BACKUP_INTERVAL_HOURS` | How often to sync (hours) | `6` |

---

## Commands

```bash
cd ~/stacked

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Update to latest version
git pull && docker-compose up -d --build

# Trigger manual backup
curl -X POST http://localhost:3000/api/backup/sync

# Check backup status
curl http://localhost:3000/api/backup/status
```

---

## Migrating Existing Database

### Option A: Copy Database File

```bash
# On your local machine
scp backend/movies.db root@your-server:/root/

# On the server
docker cp /root/movies.db stacked-backend:/app/movies.db
docker-compose restart backend
```

### Option B: Restore from Supabase

If you've already synced to Supabase:

```bash
# Trigger restore endpoint
curl -X POST http://localhost:3000/api/backup/restore
```

---

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check Backup Status
```bash
curl http://localhost:3000/api/backup/status
```

### Trigger Manual Backup
```bash
curl -X POST http://localhost:3000/api/backup/sync
```

### Restart Services
```bash
docker-compose restart
```

### Update Deployment
```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

---

## DNS Configuration

Point your domain to your Hetzner VPS IP:

| Type | Name | Value |
|------|------|-------|
| A | @ | your-server-ip |
| A | www | your-server-ip |

---

## SSL Certificates

Traefik automatically handles SSL certificates via Let's Encrypt:
- Certificates are stored in `/letsencrypt/acme.json`
- Auto-renewal happens before expiration
- HTTP automatically redirects to HTTPS

---

## Troubleshooting

### Backend not starting
```bash
docker-compose logs backend
# Check if movies.db exists
docker exec -it stacked-backend ls -la /app/
```

### Supabase connection issues
```bash
# Test from within container
docker exec -it stacked-backend curl -X POST http://localhost:3000/api/backup/test
```

### SSL certificate issues
```bash
# Check Traefik logs
docker-compose -f docker-compose.prod.yml logs traefik
# Ensure ports 80 and 443 are open
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443
# Kill the process or stop the service
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Traefik                           │
│              (SSL Termination & Routing)                │
│                    :80 → :443                           │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│    Frontend     │             │    Backend      │
│     (nginx)     │────────────▶│   (Express)     │
│    React SPA    │   /api/*    │   SQLite DB     │
│      :80        │             │     :3000       │
└─────────────────┘             └────────┬────────┘
                                         │
                                    Every 6h
                                         │
                                         ▼
                                ┌─────────────────┐
                                │    Supabase     │
                                │   (PostgreSQL)  │
                                │     Backup      │
                                └─────────────────┘
```

---

## Data Persistence

- **SQLite Database**: Stored in Docker volume `stacked-data`
- **Supabase Backup**: Synced every 6 hours (configurable)
- **Git Backup**: Commits database changes to repository

To backup the Docker volume:
```bash
docker run --rm -v stacked-data:/data -v $(pwd):/backup alpine tar czf /backup/stacked-data-backup.tar.gz /data
```
