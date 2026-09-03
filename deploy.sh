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

  # Ensure legacy database.sqlite and its WAL files are synced to hrms.sqlite so no data is lost
  if [ -f "backend/data/database.sqlite" ]; then
    echo "Syncing legacy database.sqlite and WAL files to hrms.sqlite..."
    cp "backend/data/database.sqlite" "backend/data/hrms.sqlite"
    [ -f "backend/data/database.sqlite-wal" ] && cp "backend/data/database.sqlite-wal" "backend/data/hrms.sqlite-wal" || true
    [ -f "backend/data/database.sqlite-shm" ] && cp "backend/data/database.sqlite-shm" "backend/data/hrms.sqlite-shm" || true
  fi
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

