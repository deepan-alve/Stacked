# Deployment Steps for Stacked

## The Database Problem

Your **local development database** at `backend/movies.db` (192KB with data) is **NOT being deployed** to your production server.

When you run `docker-compose up` on your production server, it:
1. Pulls the pre-built images from GitHub Container Registry
2. Tries to mount `./backend/movies.db` from the **server's filesystem** (which doesn't exist there)
3. Creates an **empty database** instead

## Solution: Copy Database to Production Server

You need to **copy your local database to your production server** before starting the containers.

### Option 1: Manual Copy (Recommended for first time)

On your production server:

```bash
# 1. Stop the containers
cd /path/to/Stacked
docker-compose down

# 2. Create the backend directory if it doesn't exist
mkdir -p backend

# 3. Copy your local database to the server
# On your LOCAL machine, run:
scp backend/movies.db user@your-server:/path/to/Stacked/backend/movies.db

# 4. On your server, restart the containers
docker-compose up -d

# 5. Check the logs
docker logs stacked-backend -f
# You should see: [ENTRIES] Found X entries (where X > 0)
```

### Option 2: Alternative - Use Data Volume

If you want to keep data separate, you can use a Docker volume:

1. **Create a backup script** (already exists at `backend/scripts/gitBackup.js`)
2. **Run it once** to populate the production database
3. **Use a persistent volume** in docker-compose

### Option 3: Use the Backup Service

Your app already has Supabase backup configured! You can:

1. Make sure `SUPABASE_DB_HOST` and other backup env vars are set
2. The backup service will sync data between SQLite and Supabase
3. On a new server, it will restore from Supabase

## Current Docker Compose Configuration

```yaml
volumes:
  - ./backend/movies.db:/app/movies.db
```

This mounts `backend/movies.db` from the **host filesystem** (your server), not from the Docker image.

## Quick Fix Command (for your server)

```bash
# If your server is running and has SSH access:
ssh your-server 'cd /path/to/Stacked && mkdir -p backend'
scp backend/movies.db your-server:/path/to/Stacked/backend/movies.db
ssh your-server 'cd /path/to/Stacked && docker-compose restart backend'
```

## Check Database on Server

```bash
# SSH into your server
ssh your-server

# Check if database file exists
ls -lh /path/to/Stacked/backend/movies.db

# Check if it has data
docker exec stacked-backend sqlite3 /app/movies.db "SELECT COUNT(*) FROM movies;"
```
