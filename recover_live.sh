#!/bin/bash
# PeopleDesk HRM - Data Inspection & Recovery Script

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=== PeopleDesk HRM Data Inspection & Recovery ==="

# 1. Prefer running inside the active Docker container where sqlite3 is properly compiled
if sudo docker ps --format '{{.Names}}' 2>/dev/null | grep -q "employee-db-backend"; then
  # Ensure container has the latest recover script
  sudo docker cp "$DIR/backend/recover_live_data.js" employee-db-backend:/usr/src/app/recover_live_data.js 2>/dev/null || true
  sudo docker compose exec -T backend node recover_live_data.js "$@"

# 2. Or fallback to host Node only if sqlite3 natively loads without GLIBC error
elif command -v node >/dev/null 2>&1 && (cd backend && node -e "require('sqlite3')" >/dev/null 2>&1); then
  cd backend && node recover_live_data.js "$@"

# 3. Otherwise run in a disposable container using the backend image
else
  sudo docker run --rm \
    -v "$DIR/backend/data:/usr/src/app/data" \
    -v "$DIR/backend/backups:/usr/src/app/backups" \
    -v "$DIR/backend/recover_live_data.js:/usr/src/app/recover_live_data.js" \
    -w /usr/src/app \
    employee-db-backend \
    node recover_live_data.js "$@"
fi
