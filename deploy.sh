#!/bin/bash
# ============================================
# Stacked - One-Click Deployment Script
# ============================================
# This script handles EVERYTHING:
# - Installs Docker if not present
# - Clones repo if not present
# - Sets up environment
# - Builds and deploys

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_URL="https://github.com/deepan-alve/Stacked-db.git"
APP_DIR="$HOME/stacked"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🎬 Stacked Deployment Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ----------------------------------------
# Step 1: Install Docker
# ----------------------------------------
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
    echo -e "${YELLOW}⚠ Please log out and back in, then run this script again${NC}"
    exit 0
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# ----------------------------------------
# Step 2: Install Docker Compose
# ----------------------------------------
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
fi
echo -e "${GREEN}✓ Docker Compose is available${NC}"

# ----------------------------------------
# Step 3: Clone or update repository
# ----------------------------------------
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone "$REPO_URL" "$APP_DIR"
    echo -e "${GREEN}✓ Repository cloned to $APP_DIR${NC}"
else
    echo -e "${YELLOW}📥 Updating repository...${NC}"
    cd "$APP_DIR"
    git pull origin main
    echo -e "${GREEN}✓ Repository updated${NC}"
fi

cd "$APP_DIR"

# ----------------------------------------
# Step 4: Configure environment
# ----------------------------------------
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}⚙️  First time setup - configuring environment...${NC}"
    cp .env.example .env
    
    # Interactive configuration
    echo ""
    read -p "Enter your domain (or press Enter for localhost): " input_domain
    DOMAIN=${input_domain:-localhost}
    
    if [ "$DOMAIN" != "localhost" ]; then
        read -p "Enter email for SSL certificate: " input_email
        ACME_EMAIL=${input_email:-admin@$DOMAIN}
    fi
    
    echo ""
    echo -e "${BLUE}Supabase Backup Configuration (optional, press Enter to skip):${NC}"
    read -p "Supabase DB Host (e.g., db.xxx.supabase.co): " input_sb_host
    
    if [ -n "$input_sb_host" ]; then
        read -p "Supabase DB Password: " input_sb_pass
        
        # Update .env file
        sed -i "s|SUPABASE_DB_HOST=.*|SUPABASE_DB_HOST=$input_sb_host|" .env
        sed -i "s|SUPABASE_DB_PASSWORD=.*|SUPABASE_DB_PASSWORD=$input_sb_pass|" .env
    fi
    
    sed -i "s|DOMAIN=.*|DOMAIN=$DOMAIN|" .env
    [ -n "$ACME_EMAIL" ] && sed -i "s|ACME_EMAIL=.*|ACME_EMAIL=$ACME_EMAIL|" .env
    
    echo -e "${GREEN}✓ Environment configured${NC}"
fi

# Load environment
source .env
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  Supabase: ${SUPABASE_DB_HOST:-not configured}"
echo ""

# ----------------------------------------
# Step 5: Deploy
# ----------------------------------------
echo -e "${YELLOW}🚀 Building and deploying...${NC}"

# Stop existing containers
docker-compose down --remove-orphans 2>/dev/null || true

if [ "$DOMAIN" != "localhost" ] && [ -n "$ACME_EMAIL" ]; then
    echo -e "${BLUE}Mode: Production (HTTPS with SSL)${NC}"
    # For SSL, we need to not expose port 80 on frontend (Traefik handles it)
    # Use profile to enable Traefik
    docker-compose --profile ssl up -d --build
    URL="https://$DOMAIN"
else
    echo -e "${BLUE}Mode: Development (HTTP)${NC}"
    docker-compose up -d --build
    URL="http://localhost"
fi

# ----------------------------------------
# Step 6: Wait and verify
# ----------------------------------------
echo ""
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

# Check health
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose ps

# Test backend
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend may still be starting...${NC}"
fi

# ----------------------------------------
# Done!
# ----------------------------------------
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Deployment Complete!        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "🌐 Access your app at: ${BLUE}$URL${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  cd $APP_DIR"
echo "  docker-compose logs -f        # View logs"
echo "  docker-compose restart        # Restart services"
echo "  docker-compose down           # Stop services"
echo "  curl -X POST localhost:3000/api/backup/sync  # Trigger backup"
echo ""
