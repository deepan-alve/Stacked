#!/bin/bash
# Setup script for Stacked App on Dokploy

set -e

echo "🚀 Stacked App - Setup Script"
echo "=============================="

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p backups

# Create .gitignore for data if it doesn't exist
if [ ! -f data/.gitignore ]; then
  echo "Creating data/.gitignore..."
  cat > data/.gitignore << 'EOF'
# Keep the directory in git but ignore the database file
# Remove the line below if you want to commit your database
*.db
*.db-journal
*.db-wal
*.db-shm
EOF
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  No .env file found!"
  echo ""
  echo "You have two options:"
  echo ""
  echo "1. Interactive generator (recommended):"
  echo "   node generate-env.js"
  echo ""
  echo "2. Manual setup:"
  echo "   cp .env.example .env"
  echo "   nano .env"
  echo ""
  read -p "Use interactive generator? (Y/n): " use_generator
  
  if [[ $use_generator =~ ^[Nn]$ ]]; then
    echo "📝 Copying .env.example to .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and set:"
    echo "   - JWT_SECRET (generate a random secure string)"
    echo "   - FRONTEND_URL (your domain)"
    echo "   - API keys (optional)"
    echo ""
    echo "Generate JWT_SECRET with:"
    echo "  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    echo ""
  else
    if command -v node &> /dev/null; then
      node generate-env.js
    else
      echo "❌ Node.js not found. Falling back to manual setup..."
      cp .env.example .env
      echo "Please edit .env file manually."
    fi
  fi
else
  echo "✓ .env file exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify .env file configuration"
echo "2. If using Dokploy:"
echo "   - Connect your git repository"
echo "   - Set environment variables in Dokploy UI"
echo "   - Deploy!"
echo ""
echo "3. Or run locally with:"
echo "   docker-compose up -d"
echo ""
