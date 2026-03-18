#!/bin/bash
# Simple deployment script for the VPS

echo "Updating code from repository..."
git stash
git pull --rebase origin main
git stash pop || true

echo "Building and starting containers..."
sudo docker compose up -d --build

echo "Deployment complete! App should be available at http://hrm.orbixdesigns.com"
