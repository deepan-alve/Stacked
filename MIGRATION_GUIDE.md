# Migration Guide: Supabase to Self-Hosted

This guide helps you migrate from the old Supabase-based authentication to the new self-hosted JWT authentication.

## Changes Overview

### What Changed
- ✅ **No more Supabase dependency** - All auth is handled locally
- ✅ **SQLite database** - Local file-based database (can be committed to git)
- ✅ **JWT authentication** - Self-contained token-based auth
- ✅ **Dokploy-ready** - Optimized for self-hosted deployment
- ✅ **Simplified setup** - No external services required

### What Stayed the Same
- ✅ **All application features** work the same
- ✅ **UI/UX** remains unchanged
- ✅ **API endpoints** are compatible
- ✅ **Docker support** enhanced

## Migration Steps

### Step 1: Update Your Code

If you have an existing installation:

```bash
# Pull the latest changes
git pull origin main

# Or if you have local changes, stash them first
git stash
git pull origin main
git stash pop
```

### Step 2: Update Environment Variables

**Old .env file (Supabase):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**New .env file (Self-hosted):**
```env
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here
FRONTEND_URL=https://yourdomain.com
DB_PATH=/app/data/stacked.db
```

Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Update Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 4: Database Migration (If Needed)

**If you have existing data in Supabase:**

Unfortunately, there's no automatic migration tool. You have two options:

#### Option A: Manual Data Entry
- Export your data from Supabase
- Start fresh with the new system
- Manually re-enter critical data

#### Option B: Write Custom Migration Script

```javascript
// Example migration script (customize as needed)
const { createClient } = require('@supabase/supabase-js');
const Database = require('./src/config/database.js').default;

async function migrate() {
  // Connect to Supabase
  const supabase = createClient(
    process.env.OLD_SUPABASE_URL,
    process.env.OLD_SUPABASE_KEY
  );

  // Connect to SQLite
  const db = new Database();
  await db.connect();

  // Fetch data from Supabase
  const { data: movies } = await supabase
    .from('movies')
    .select('*');

  // Insert into SQLite
  for (const movie of movies) {
    await db.run(
      'INSERT INTO movies (title, type, rating, ...) VALUES (?, ?, ?, ...)',
      [movie.title, movie.type, movie.rating, ...]
    );
  }

  console.log('Migration complete!');
}

migrate();
```

### Step 5: Rebuild and Deploy

**For Docker Compose:**
```bash
# Stop existing containers
docker-compose down

# Remove old images
docker-compose rm -f

# Rebuild and start
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

**For Dokploy:**
1. Update environment variables in Dokploy UI
2. Commit and push your code
3. Dokploy will auto-deploy (if webhook is configured)
4. Or manually click "Deploy" in Dokploy dashboard

### Step 6: Create New User Account

Since authentication changed, you'll need to create a new account:

1. Visit your app URL
2. Click "Sign Up"
3. Create a new account with email/password
4. This will be your new admin account

## Troubleshooting

### "Authentication required" errors

**Clear browser cookies:**
- Chrome: Settings → Privacy → Clear browsing data → Cookies
- Firefox: Settings → Privacy → Clear Data → Cookies
- Or use Incognito/Private mode

### Database doesn't exist

```bash
# Check if database exists
ls -la data/

# If not, container should create it automatically
docker-compose restart backend

# View logs
docker-compose logs backend
```

### JWT_SECRET not set error

```bash
# Verify environment variable
docker-compose exec backend printenv | grep JWT_SECRET

# If missing, add to .env and restart
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
docker-compose restart
```

### Old Supabase references

If you see errors about Supabase:

```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

# Rebuild Docker images
docker-compose build --no-cache
docker-compose up -d
```

## Rollback (If Needed)

If you need to rollback to Supabase version:

```bash
# Find the last commit before migration
git log --oneline

# Rollback (replace COMMIT_HASH with actual hash)
git reset --hard COMMIT_HASH

# Force push (if already deployed)
git push --force
```

## Benefits of Migration

### Before (Supabase)
- ❌ External dependency
- ❌ Monthly costs (after free tier)
- ❌ Requires Supabase account
- ❌ Network latency to Supabase servers
- ❌ Data stored externally

### After (Self-hosted)
- ✅ Fully self-contained
- ✅ No external costs
- ✅ Complete control over data
- ✅ Faster (no external API calls)
- ✅ Database can be git-committed
- ✅ Works offline (for development)

## Data Privacy

With the new system:
- **All data** stored locally on your server
- **Passwords** hashed with SHA-256
- **No third-party services** have access
- **You control** backups and retention
- **GDPR-friendly** - data stays with you

## Performance Improvements

- **Faster auth** - No external API calls
- **Lower latency** - Everything is local
- **No rate limits** - You control everything
- **Offline capable** - For development

## Need Help?

- Check the [README.md](README.md) for general setup
- See [DOKPLOY_GUIDE.md](DOKPLOY_GUIDE.md) for deployment
- Open an issue on your repository

## FAQ

**Q: Can I still use Supabase?**
A: No, this version is designed for self-hosting. If you need Supabase, use an older commit.

**Q: Is this more secure than Supabase?**
A: It's different. Supabase has enterprise-grade security, but you don't control it. Self-hosted gives you full control.

**Q: Can I migrate my existing users?**
A: Not automatically. Users will need to create new accounts, as passwords are stored differently.

**Q: What about password reset?**
A: Not implemented in this version. You can manually reset passwords in the database or add email functionality.

**Q: Can I switch back to Supabase later?**
A: Yes, but you'd need to revert the code and write a migration script.
