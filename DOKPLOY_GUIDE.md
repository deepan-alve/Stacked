# Dokploy Deployment Guide for Stacked

This guide will walk you through deploying Stacked on your own server using Dokploy.

## Prerequisites

1. **A Server** with:
   - Ubuntu 20.04+ (or similar Linux distribution)
   - Minimum 2GB RAM
   - 20GB storage
   - Public IP address or domain

2. **Dokploy Installed** on your server:
   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```
   Visit: https://docs.dokploy.com/get-started/installation

3. **Domain Name** (optional but recommended):
   - Point your domain's A record to your server's IP
   - Example: `app.yourdomain.com → 123.456.789.0`

4. **Git Repository**:
   - GitHub, GitLab, Bitbucket, or any git hosting
   - Push your Stacked code to the repository

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Navigate to your project
cd /path/to/Stacked

# Ensure all changes are committed
git add .
git commit -m "Prepare for Dokploy deployment"
git push origin main
```

### 2. Access Dokploy Dashboard

1. Open your browser and go to: `http://your-server-ip:3000`
2. Log in with your Dokploy credentials
3. Create a new project (e.g., "Stacked")

### 3. Create Application

1. Click **"New Application"**
2. Fill in the details:
   - **Name**: `stacked-app`
   - **Type**: Select **"Docker Compose"**
   - **Git Repository**: Enter your repository URL
   - **Branch**: `main` (or your default branch)

### 4. Configure Environment Variables

In the Dokploy UI, add these environment variables:

**Required Variables:**
```env
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
FRONTEND_URL=https://yourdomain.com
PORT=80
```

**Optional Variables (for enhanced features):**
```env
TMDB_API_KEY=your_tmdb_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
BACKUP_INTERVAL_HOURS=6
```

**Generate JWT_SECRET:**
Run this command on your local machine or server:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Or use an online generator: https://generate-secret.vercel.app

### 5. Configure Domain (Optional but Recommended)

1. In Dokploy, go to your application settings
2. Navigate to **"Domains"** section
3. Add your domain:
   - **Domain**: `app.yourdomain.com`
   - **Port**: `80` (maps to your frontend)
   - **HTTPS**: Enable (Dokploy will auto-configure Let's Encrypt)

### 6. Deploy

1. Click the **"Deploy"** button
2. Dokploy will:
   - Clone your repository
   - Build Docker images
   - Start containers
   - Configure SSL (if domain is set)

3. Monitor the deployment logs in real-time

### 7. Verify Deployment

1. Once deployment is complete, visit your domain (or server IP)
2. You should see the Stacked login/signup page
3. Create an account to get started

## Post-Deployment Configuration

### Setting Up Automatic Deployments

Configure webhook in your git repository:

1. In Dokploy, copy the webhook URL from your app settings
2. In your Git repository (GitHub/GitLab):
   - Go to Settings → Webhooks
   - Add the Dokploy webhook URL
   - Select: "Push events"
3. Now every `git push` will automatically deploy!

### Database Management

#### Option 1: Database in Git (Small Projects)

If you want to commit your database:

```bash
# Edit data/.gitignore
nano data/.gitignore

# Comment out the *.db line:
# *.db

# Commit the database
git add data/stacked.db
git commit -m "Add database"
git push
```

**Pros**: Simple, version controlled
**Cons**: Not suitable for large databases or sensitive data

#### Option 2: External Volume (Recommended for Production)

In Dokploy UI:
1. Go to your app → Volumes
2. Add a volume:
   - **Host Path**: `/var/lib/dokploy/stacked/data`
   - **Container Path**: `/app/data`
3. Your database will persist across deployments

### Backups

Automatic backups run every 6 hours. To access them:

```bash
# SSH into your server
ssh user@your-server-ip

# Access the container
docker exec -it stacked-backend sh

# List backups
ls -lh /app/backups/

# Copy backup to host
docker cp stacked-backend:/app/backups/backup.db ./
```

## Troubleshooting

### Build Fails

**Check logs in Dokploy:**
- Look for missing environment variables
- Verify Docker Compose syntax
- Check for port conflicts

**Common fixes:**
```bash
# Restart Dokploy
systemctl restart dokploy

# Clear Docker cache
docker system prune -a
```

### Database Issues

**Database locked:**
```bash
# Stop containers
docker-compose down

# Remove lock files
rm /var/lib/dokploy/stacked/data/*.db-journal
rm /var/lib/dokploy/stacked/data/*.db-wal

# Restart
docker-compose up -d
```

### SSL Certificate Issues

**If HTTPS doesn't work:**
1. Verify DNS is pointing to your server
2. Check firewall allows ports 80 and 443:
   ```bash
   ufw allow 80
   ufw allow 443
   ```
3. In Dokploy, regenerate the certificate

### Container Won't Start

**Check logs:**
```bash
# View all container logs
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs frontend
```

**Common issues:**
- Missing JWT_SECRET
- Port already in use
- Database file permissions

## Updating Your Application

### Method 1: Git Push (Automatic with Webhook)
```bash
git add .
git commit -m "Update feature"
git push
# Dokploy will auto-deploy
```

### Method 2: Manual Deploy
1. Go to Dokploy dashboard
2. Click your application
3. Click "Deploy" button

### Method 3: Rollback
1. In Dokploy, go to "Deployments"
2. Select a previous deployment
3. Click "Rollback"

## Monitoring

### View Logs
```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
```

### Resource Usage
```bash
# Container stats
docker stats

# System resources
htop
df -h
```

### Health Checks
Visit these endpoints:
- `https://yourdomain.com/api/health` - Backend health
- `https://yourdomain.com` - Frontend

## Security Recommendations

1. **Always use HTTPS** in production
2. **Use strong JWT_SECRET** (32+ characters, random)
3. **Regular backups**: Set up automated backup script
4. **Firewall**: Only open necessary ports (80, 443, 22)
5. **Updates**: Keep Dokploy and Docker updated
6. **Monitoring**: Set up uptime monitoring (e.g., UptimeRobot)

## Cost Estimation

**Minimal Setup:**
- Server: $5-10/month (DigitalOcean, Linode, Hetzner)
- Domain: $10-15/year
- **Total**: ~$7/month

**Recommended Setup:**
- Server (4GB RAM): $12-20/month
- Domain: $10-15/year
- Backups: $1-5/month
- **Total**: ~$15/month

## Need Help?

- Dokploy Docs: https://docs.dokploy.com
- Dokploy Discord: https://discord.gg/dokploy
- Stacked Issues: Your repository issues page

## Alternative Deployment Methods

If Dokploy doesn't work for you, consider:
- **Docker Compose** directly on your server
- **Coolify** (similar to Dokploy)
- **Portainer** (Docker management UI)
- **Kubernetes** (for advanced users)
- **Cloud Platforms**: Railway, Render, Fly.io
