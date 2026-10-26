#!/bin/bash
# PeopleDesk HRM - Data Inspection & Recovery Script

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=== PeopleDesk HRM Data Inspection & Recovery ==="

if command -v node >/dev/null 2>&1 && [ -d "backend/node_modules/sqlite3" ]; then
  cd backend && node recover_live_data.js "$@"
elif sudo docker ps --format '{{.Names}}' 2>/dev/null | grep -q "employee-db-backend"; then
  sudo docker compose exec -T backend node recover_live_data.js "$@"
else
  sudo docker run --rm \
    -v "$DIR/backend:/usr/src/app" \
    -w /usr/src/app \
    node:20-slim \
    node recover_live_data.js "$@"
fi
