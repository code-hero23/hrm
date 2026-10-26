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

# 2. Pre-Deployment Data Safety & Migration Check (BEFORE DOCKER STARTS)
# Fix permissions first to ensure operations succeed
sudo chown -R $(id -u):$(id -g) backend/data 2>/dev/null || true

copy_sqlite_with_wal() {
  SRC="$1"
  DST="$2"
  if [ -f "$SRC" ]; then
    sudo cp "$SRC" "$DST"
    [ -f "${SRC}-wal" ] && sudo cp "${SRC}-wal" "${DST}-wal" || true
    [ -f "${SRC}-shm" ] && sudo cp "${SRC}-shm" "${DST}-shm" || true
  fi
}

# Safeguard: Archive any legacy database.sqlite so it NEVER overwrites active hrms.sqlite
if [ -f "backend/data/database.sqlite" ]; then
  if [ -s "backend/data/hrms.sqlite" ]; then
    echo "Archiving legacy database.sqlite to backend/data/database.sqlite.archived..."
    sudo mv backend/data/database.sqlite backend/data/database.sqlite.archived 2>/dev/null || true
    [ -f "backend/data/database.sqlite-wal" ] && sudo mv backend/data/database.sqlite-wal backend/data/database.sqlite-wal.archived 2>/dev/null || true
    [ -f "backend/data/database.sqlite-shm" ] && sudo mv backend/data/database.sqlite-shm backend/data/database.sqlite-shm.archived 2>/dev/null || true
  fi
fi

# Only if active hrms.sqlite does NOT exist or is 0 bytes, check for fallback/initial migration
if [ ! -f "backend/data/hrms.sqlite" ] || [ ! -s "backend/data/hrms.sqlite" ]; then
  if [ -f "backend/data/database.sqlite" ]; then
    echo ">>> INITIAL MIGRATION: Migrating legacy backend/data/database.sqlite to hrms.sqlite..."
    copy_sqlite_with_wal "backend/data/database.sqlite" "backend/data/hrms.sqlite"
    sudo mv backend/data/database.sqlite backend/data/database.sqlite.archived 2>/dev/null || true
  elif [ -f "backend/database.sqlite" ]; then
    echo ">>> INITIAL MIGRATION: Migrating legacy root backend/database.sqlite to hrms.sqlite..."
    copy_sqlite_with_wal "backend/database.sqlite" "backend/data/hrms.sqlite"
    sudo mv backend/database.sqlite backend/database.sqlite.archived 2>/dev/null || true
  elif [ -f "backend/hrms.sqlite" ]; then
    echo ">>> INITIAL MIGRATION: Moving root backend/hrms.sqlite to backend/data/hrms.sqlite..."
    copy_sqlite_with_wal "backend/hrms.sqlite" "backend/data/hrms.sqlite"
  else
    # Look for most recent backup if completely missing
    LATEST_BACKUP_DB=$(find backend/backups/ -name "hrms.sqlite" -type f 2>/dev/null | sort -r | head -n 1)
    if [ -n "$LATEST_BACKUP_DB" ]; then
      echo ">>> RECOVERY: Restoring database from backup: $LATEST_BACKUP_DB..."
      copy_sqlite_with_wal "$LATEST_BACKUP_DB" "backend/data/hrms.sqlite"
    fi
  fi
else
  echo ">>> Active database backend/data/hrms.sqlite is present and verified."
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
  RESTORE_DB=$(find "$BACKUP_DIR" -name "hrms.sqlite" -type f 2>/dev/null | head -n 1)
  [ -z "$RESTORE_DB" ] && RESTORE_DB=$(find "$BACKUP_DIR" -name "*.sqlite" -type f 2>/dev/null | head -n 1)
  if [ -n "$RESTORE_DB" ]; then
    echo ">>> RECOVERY: Restoring database from deployment backup $RESTORE_DB..."
    copy_sqlite_with_wal "$RESTORE_DB" "backend/data/hrms.sqlite"
  fi
fi

sudo chown -R $(id -u):$(id -g) backend/data backend/uploads 2>/dev/null || true
sudo chmod -R 777 backend/data backend/uploads 2>/dev/null || true

# 4. Build & Restart Containers
echo "Building and starting containers..."
sudo docker compose up -d --build


echo "Deployment complete! App should be available at http://hrm.orbixdesigns.com"


