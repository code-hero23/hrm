# PowerShell script to prepare the deployment bundle for SCP

$BundleDir = "deploy_bundle"

Write-Host "Creating clean deployment bundle in $BundleDir..." -ForegroundColor Cyan

# Remove existing bundle if any
if (Test-Path $BundleDir) {
    Remove-Item -Path $BundleDir -Recurse -Force
}

# Create folder structure
New-Item -ItemType Directory -Path "$BundleDir\backend" -Force
New-Item -ItemType Directory -Path "$BundleDir\frontend" -Force

# Copy Backend files
Write-Host "Copying backend files..." -ForegroundColor Green
Copy-Item "backend\package*.json" "$BundleDir\backend\"
Copy-Item "backend\index.js" "$BundleDir\backend\"
Copy-Item "backend\db.js" "$BundleDir\backend\"
Copy-Item "backend\ecosystem.config.js" "$BundleDir\backend\"
Copy-Item "backend\.env.example" "$BundleDir\backend\"
Copy-Item "backend\Dockerfile" "$BundleDir\backend\"

# Build Frontend
Write-Host "Building frontend..." -ForegroundColor Green
Set-Location "frontend"
npm install
npm run build
Set-Location ".."

# Copy Frontend files
Write-Host "Copying frontend files..." -ForegroundColor Green
Copy-Item "frontend\package*.json" "$BundleDir\frontend\" # Added this as a backup
Copy-Item -Path "frontend\dist" -Destination "$BundleDir\frontend\dist" -Recurse
Copy-Item "frontend\Dockerfile" "$BundleDir\frontend\"
Copy-Item "frontend\nginx.conf" "$BundleDir\frontend\"

# Copy Docker Compose (in case needed)
Write-Host "Copying Docker configuration..." -ForegroundColor Green
Copy-Item "docker-compose.yml" "$BundleDir\"

Write-Host "`nBundle prepared successfully in the '$BundleDir' folder!" -ForegroundColor Yellow
Write-Host "You can now SCP this folder to your VPS." -ForegroundColor Cyan
