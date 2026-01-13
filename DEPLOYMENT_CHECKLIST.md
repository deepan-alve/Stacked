# Pre-Deployment Checklist

Use this checklist before deploying to production.

## ✅ Configuration Files

- [ ] `docker-compose.yml` exists and is valid
- [ ] `dokploy.json` exists
- [ ] `.env.example` exists with all required variables
- [ ] `.gitignore` properly configured
- [ ] `data/.gitignore` exists
- [ ] `backups/.gitignore` exists

## ✅ Environment Variables

- [ ] JWT_SECRET generated (32+ characters, random)
- [ ] FRONTEND_URL set to your domain
- [ ] NODE_ENV set to "production"
- [ ] All API keys configured (if using external services)

## ✅ Docker Configuration

- [ ] `backend/Dockerfile` builds successfully
- [ ] `frontend/Dockerfile` builds successfully
- [ ] docker-compose.yml has correct volume mounts
- [ ] Ports configured correctly (80 for frontend)

## ✅ Database

- [ ] `data/` directory exists
- [ ] Database will be created automatically on first run
- [ ] Backup directory exists
- [ ] Users table will be initialized

## ✅ Security

- [ ] JWT_SECRET is strong and random (not default)
- [ ] HTTPS configured (via Dokploy or reverse proxy)
- [ ] CORS settings allow your domain only
- [ ] Rate limiting enabled
- [ ] Helmet security headers configured

## ✅ Code Quality

- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] All dependencies installed
- [ ] No Supabase imports remaining
- [ ] Authentication working locally

## ✅ Testing (Local)

```bash
# Test build
docker-compose build

# Test startup
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs

# Test frontend
curl http://localhost

# Test backend health
curl http://localhost/api/health

# Test signup
curl -X POST http://localhost/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Test login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

## ✅ Documentation

- [ ] README.md updated
- [ ] QUICKSTART.md reviewed
- [ ] DOKPLOY_GUIDE.md ready
- [ ] MIGRATION_GUIDE.md available
- [ ] CHANGES.md documents all changes

## ✅ Git Repository

- [ ] All changes committed
- [ ] .gitignore prevents sensitive files
- [ ] Repository pushed to remote
- [ ] Branch is correct (main/master)

## ✅ Dokploy Setup

- [ ] Dokploy installed on server
- [ ] Domain DNS pointing to server
- [ ] Dokploy accessible via web UI
- [ ] Git repository connected
- [ ] Environment variables set in Dokploy

## ✅ Deployment

- [ ] Initial deployment successful
- [ ] Containers running
- [ ] Database created
- [ ] SSL certificate issued (if using HTTPS)
- [ ] Application accessible via domain

## ✅ Post-Deployment

- [ ] First user account created
- [ ] Login/logout working
- [ ] Can add entries
- [ ] Data persists after restart
- [ ] Backups working
- [ ] Logs look clean

## 🚨 Red Flags (Stop if Any Apply)

- ⛔ JWT_SECRET is default or weak
- ⛔ Database files committed to git (unless intentional)
- ⛔ Secrets visible in docker-compose.yml
- ⛔ HTTP only (no HTTPS) in production
- ⛔ Default ports exposed publicly
- ⛔ No backups configured
- ⛔ CORS allows all origins (*)

## 🎯 Deployment Commands

### Dokploy
```bash
# Push to git
git add .
git commit -m "Ready for production"
git push origin main

# Deploy via Dokploy UI or webhook
```

### Docker Compose
```bash
# Deploy
docker-compose up -d --build

# Monitor
docker-compose logs -f

# Check status
docker-compose ps
```

## 📝 Post-Deployment Notes

**Server**: _________________
**Domain**: _________________
**Deployed On**: _________________
**Deployed By**: _________________
**Version/Commit**: _________________

**Issues Encountered**: 
- 
- 

**Performance Notes**:
- 
- 

**Next Steps**:
- 
- 

## 🆘 Emergency Rollback

If something goes wrong:

```bash
# Stop services
docker-compose down

# Revert to previous commit
git reset --hard <previous-commit>

# Redeploy
docker-compose up -d
```

## ✅ Success Indicators

- [ ] Application loads at domain
- [ ] Can create account
- [ ] Can login
- [ ] Can add/edit/delete entries
- [ ] Data survives container restart
- [ ] Backups are being created
- [ ] No errors in logs
- [ ] HTTPS working (production only)

## 🎉 Ready to Deploy!

Once all checkboxes are marked, you're ready for production deployment!

**Last Updated**: _________________
**Checked By**: _________________
**Approved By**: _________________
