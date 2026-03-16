#!/bin/bash
# Simple deployment script for the VPS

echo "Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

echo "Building and starting containers..."
sudo docker compose up -d --build

echo "Deployment complete! App should be available at http://www.hrm.orbixdesigns.com"
