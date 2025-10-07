#!/bin/bash

# Safe Vercel Deployment Script
# Prevents accidental production deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${GREEN}🚀 Safe Vercel Deployment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if on main branch
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${RED}❌ ERROR: You are on the 'main' branch!${NC}"
    echo ""
    echo -e "${YELLOW}Production deployments should only happen via GitHub PR merge.${NC}"
    echo ""
    echo "To deploy to production:"
    echo "  1. Create PR: gh pr create --base main --head develop"
    echo "  2. Get approval and merge"
    echo "  3. Vercel will automatically deploy"
    echo ""
    exit 1
fi

# Check if on develop branch (DEV)
if [ "$CURRENT_BRANCH" = "develop" ]; then
    echo -e "${GREEN}✓${NC} Current branch: ${GREEN}develop${NC} (DEV environment)"
    echo ""
    echo "This will deploy to: Preview/DEV environment"
    echo "Database: DEV_POSTGRES_URL"
    echo ""
    read -p "Continue with DEV deployment? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi

    echo ""
    echo -e "${GREEN}Deploying to DEV...${NC}"
    vercel --yes
    exit 0
fi

# For other branches (feature branches)
echo -e "${YELLOW}⚠${NC} Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"
echo ""
echo "This will deploy to: Preview environment"
echo ""
read -p "Continue with Preview deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Deploying to Preview...${NC}"
vercel --yes
