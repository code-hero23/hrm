#!/bin/bash
# Simple deployment script for the VPS

echo "Pulling latest changes..."
git pull origin main

echo "Building and starting containers..."
docker compose up -d --build

echo "Deployment complete! App should be available at http://www.hrm.orbixdesigns.com"
