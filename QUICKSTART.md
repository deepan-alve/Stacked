# Quick Start Guide - Stacked

Get Stacked running in 5 minutes!

## 🚀 Fastest Setup (Docker Compose)

### Prerequisites
- Docker and Docker Compose installed
- That's it!

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Stacked
   ```

2. **Setup environment**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Generate secure JWT secret and add to .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Edit .env and set:
   # - JWT_SECRET (paste the generated value)
   # - FRONTEND_URL (e.g., http://localhost)
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the app**
   - Open browser: http://localhost
   - Create your first account
   - Start tracking!

## 📦 What Just Happened?

- ✅ Backend API started on port 3000
- ✅ Frontend served on port 80
- ✅ SQLite database created in `data/`
- ✅ Automatic backups configured

## 🛠️ Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop the app
docker-compose down

# Restart
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Database backup
docker-compose exec backend node scripts/gitBackup.js

# Access backend shell
docker-compose exec backend sh

# View database
docker-compose exec backend sqlite3 /app/data/stacked.db
```

## 🌐 Deploy to Production (Dokploy)

See [DOKPLOY_GUIDE.md](DOKPLOY_GUIDE.md) for full deployment instructions.

Quick version:
1. Install Dokploy on your server
2. Push code to git repository
3. Create app in Dokploy UI
4. Set environment variables
5. Deploy!

## ❓ Common Issues

### Port 80 already in use
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 80 to 8080 or any available port
```

### Database permission errors
```bash
sudo chown -R $USER:$USER data/
chmod 755 data/
```

### Can't access from other devices
Make sure to:
1. Open port 80 in firewall
2. Use your machine's IP instead of localhost
3. Update FRONTEND_URL in .env

## 📚 Next Steps

- **Customize**: Edit environment variables
- **Add API Keys**: Get TMDB key for auto-poster fetching
- **Configure Backups**: Adjust backup interval
- **Set up Domain**: Point your domain to the server
- **Enable HTTPS**: Use Dokploy or Caddy for SSL

## 🎯 Features to Explore

- Add movies, TV shows, anime, or books
- Search and auto-fill details from TMDB
- Track watch dates and ratings
- Add personal notes
- Organize by type and status
- View detailed info from IMDb/Wikipedia

## 🔐 Default Credentials

**There are no default credentials!**

The first account you create becomes your account. Keep your credentials safe!

## 🆘 Need Help?

1. Check [README.md](README.md) - Full documentation
2. See [DOKPLOY_GUIDE.md](DOKPLOY_GUIDE.md) - Deployment guide
3. Review [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration from Supabase
4. Open an issue - Report bugs or request features

## 🎉 That's It!

You're now running your own self-hosted movie tracker!

Happy tracking! 🍿
