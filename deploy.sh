#!/bin/bash
# Production deployment script for VPS

set -e

echo "=== PeopleDesk HRM Deployment ==="

# 1. Automatic Database & Uploads Backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backend/backups/deploy_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

if [ -d "backend/data" ]; then
  echo "Backing up persistent database files to $BACKUP_DIR..."
  cp -r backend/data/* "$BACKUP_DIR/" 2>/dev/null || true
fi

if [ -d "backend/uploads" ]; then
  echo "Backing up uploaded documents..."
  cp -r backend/uploads "$BACKUP_DIR/" 2>/dev/null || true
fi

# 2. Update Code from Repository
echo "Updating code from repository..."
git stash
git pull --rebase origin main
git stash pop || true

# 3. Build & Restart Containers
echo "Building and starting containers..."
sudo docker compose up -d --build

echo "Deployment complete! App should be available at http://hrm.orbixdesigns.com"

