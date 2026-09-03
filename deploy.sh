#!/bin/bash
# Production deployment script for VPS

set -e

echo "=== PeopleDesk HRM Deployment ==="

# 0. Ensure target data directories exist and ownership is writable
sudo mkdir -p backend/data backend/uploads backend/backups 2>/dev/null || mkdir -p backend/data backend/uploads backend/backups
sudo chown -R $(id -u):$(id -g) backend/data backend/uploads backend/backups 2>/dev/null || true
sudo chmod -R 777 backend/data backend/uploads backend/backups 2>/dev/null || true

# 1. Automatic Database & Uploads Backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backend/backups/deploy_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "Creating safety backup of all database and upload files to $BACKUP_DIR..."
# Backup any database file found anywhere in backend (root, data, etc.)
if [ -d "backend/data" ]; then
  cp -r backend/data/* "$BACKUP_DIR/" 2>/dev/null || true
fi
cp backend/*.sqlite "$BACKUP_DIR/" 2>/dev/null || true

if [ -d "backend/uploads" ]; then
  cp -r backend/uploads "$BACKUP_DIR/" 2>/dev/null || true
fi

# 2. Pre-Deployment Data Recovery & Migration Check (BEFORE DOCKER STARTS)
# If a database file exists on host root (backend/database.sqlite or backend/hrms.sqlite) or in backups
# but backend/data/hrms.sqlite is missing/empty, sync it into backend/data/hrms.sqlite so Docker can see it!

# Fix permissions first to ensure cp succeeds even if files were created by root Docker
sudo chown -R $(id -u):$(id -g) backend/data 2>/dev/null || true

if [ ! -f "backend/data/hrms.sqlite" ] || [ ! -s "backend/data/hrms.sqlite" ]; then
  if [ -f "backend/data/database.sqlite" ]; then
    echo ">>> MIGRATION: Found backend/data/database.sqlite. Syncing to backend/data/hrms.sqlite..."
    sudo cp backend/data/database.sqlite backend/data/hrms.sqlite
  elif [ -f "backend/database.sqlite" ]; then
    echo ">>> MIGRATION: Found legacy root backend/database.sqlite. Syncing to backend/data/hrms.sqlite..."
    sudo cp backend/database.sqlite backend/data/hrms.sqlite
  elif [ -f "backend/hrms.sqlite" ]; then
    echo ">>> MIGRATION: Found legacy root backend/hrms.sqlite. Syncing to backend/data/hrms.sqlite..."
    sudo cp backend/hrms.sqlite backend/data/hrms.sqlite
  else
    # Look for any recent database in backups if none found in active folders
    LATEST_BACKUP_DB=$(find backend/backups/ -name "*.sqlite" -type f 2>/dev/null | sort -r | head -n 1)
    if [ -n "$LATEST_BACKUP_DB" ]; then
      echo ">>> RECOVERY: Restoring database from backup: $LATEST_BACKUP_DB..."
      sudo cp "$LATEST_BACKUP_DB" backend/data/hrms.sqlite
    fi
  fi
else
  # If backend/data/hrms.sqlite exists, check if database.sqlite in backend/data or root is larger
  if [ -f "backend/data/database.sqlite" ]; then
    SIZE_HRMS=$(stat -c%s "backend/data/hrms.sqlite" 2>/dev/null || stat -f%z "backend/data/hrms.sqlite" 2>/dev/null || echo 0)
    SIZE_DATA_DB=$(stat -c%s "backend/data/database.sqlite" 2>/dev/null || stat -f%z "backend/data/database.sqlite" 2>/dev/null || echo 0)
    if [ "$SIZE_DATA_DB" -ge "$SIZE_HRMS" ] && [ "$SIZE_DATA_DB" -gt 8192 ]; then
      echo ">>> SYNC: backend/data/database.sqlite ($SIZE_DATA_DB bytes) contains active/larger data. Syncing to hrms.sqlite..."
      sudo cp backend/data/database.sqlite backend/data/hrms.sqlite
    fi
  fi
fi

# Ensure permissions so Docker container can write to mounted volumes
sudo chown -R $(id -u):$(id -g) backend/data backend/uploads 2>/dev/null || true
sudo chmod -R 777 backend/data backend/uploads 2>/dev/null || true

# 3. Update Code from Repository
echo "Updating code from repository..."
git stash
git pull --rebase origin main
git stash pop || true

# Re-verify database file is present in backend/data/hrms.sqlite after git pull
if [ ! -f "backend/data/hrms.sqlite" ] || [ ! -s "backend/data/hrms.sqlite" ]; then
  RESTORE_DB=$(find "$BACKUP_DIR" -name "*.sqlite" -type f 2>/dev/null | head -n 1)
  if [ -n "$RESTORE_DB" ]; then
    echo ">>> RECOVERY: Restoring database from deployment backup $RESTORE_DB..."
    sudo cp "$RESTORE_DB" backend/data/hrms.sqlite
  fi
fi

sudo chown -R $(id -u):$(id -g) backend/data backend/uploads 2>/dev/null || true
sudo chmod -R 777 backend/data backend/uploads 2>/dev/null || true

# 4. Build & Restart Containers
echo "Building and starting containers..."
sudo docker compose up -d --build


echo "Deployment complete! App should be available at http://hrm.orbixdesigns.com"


