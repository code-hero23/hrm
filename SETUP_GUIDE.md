# 🛠 Setup & Installation Guide

This guide provides detailed instructions to set up the Master Employee Database (PeopleDesk) for development or production environments.

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **NPM**: v9.0.0 or higher
- **Git**: (Optional) For cloning the repository
- **Docker**: (Optional) For containerized deployment

---

## 🚀 Standard Installation

### 1. Clone the Project
```bash
git clone <repository-url>
cd master-employee-database
```

### 2. Backend Configuration
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

**Environment Variables**:
Create a `.env` file in the `backend` directory based on `.env.example`:
```env
PORT=5018
NODE_ENV=development
# SMTP Settings (Optional for emails)
# WHATSAPP_ACCESS_TOKEN= (Optional)
```

**Storage Setup**:
Ensure the `uploads` and `data` directories exist:
```bash
mkdir uploads data
```

### 3. Frontend Configuration
Navigate to the `frontend` directory and install dependencies:
```bash
cd ../frontend
npm install
```

---

## 🏃 Running the Application

### Development Mode (Full HMR)
Open two terminal windows/tabs:

**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```
The application will be accessible at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5018`

---

## 🐳 Docker Deployment

To run the application using Docker Compose (simplest method):

```bash
docker-compose up --build -d
```
The system will be available at:
- **Web UI**: `http://localhost:8080`
- **API**: `http://localhost:5018`

---

## 🔧 Troubleshooting Dependency Issues

### SQLite3 Build Failures
The `sqlite3` package occasionally fails to install on Windows due to missing build tools.
- **Solution**: Install Windows Build Tools via PowerShell as Administrator:
  ```powershell
  npm install --global --production windows-build-tools
  ```
- **Alternative**: Use a pre-built binary:
  ```bash
  npm install sqlite3 --build-from-source --sqlite=/usr/local
  ```

### Shared Dependency Conflicts (peerDependencies)
If you encounter `ERR! code ERESOLVE` during `npm install`:
- **Fix**: Use the legacy-peer-deps flag:
  ```bash
  npm install --legacy-peer-deps
  ```

### Backend Not Connecting
- Check if port `5018` is already in use by another service.
- Ensure `backend/data/database.sqlite` has write permissions for the user running the process.

---

## 📦 Production Build

**Frontend**:
```bash
cd frontend
npm run build
```
This generates a `dist` folder. In production, these static files are typically served via Nginx (config available in `frontend/nginx.conf`).

**Backend**:
Set `NODE_ENV=production` in your `.env` and use a process manager like PM2:
```bash
pm2 start index.js --name "hrm-backend"
```
