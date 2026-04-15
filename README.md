# Master Employee Database (PeopleDesk)

[![Project Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/code-hero23/hrm)
[![Tech Stack](https://img.shields.io/badge/Stack-Node--React--SQLite-blue.svg)](https://github.com/code-hero23/hrm)

A high-performance, high-fidelity Employee Management System designed for robust data handling, bulk imports, and streamlined onboarding workflows.

---

## ✨ Key Features

- **🚀 Intelligent Onboarding**: 19-step workflow for comprehensive employee data collection.
- **📊 Bulk Import**: High-speed Excel/CSV import with intelligent field mapping and data quality scoring.
- **🔒 Secure Authentication**: Role-based access control (Admin & Viewer) with hashed credentials.
- **📂 Resource Bucket**: Integrated asset and service management linked to employee records.
- **📧 Automated Notifications**: Instant email alerts for new onboarding submissions.
- **🐳 Docker Ready**: Full containerization support for one-command deployment.

---

## 🛠 Technical Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React 19 (Vite)** | Atomic component structure, Lucide icons, responsive glassmorphism UI. |
| **Backend** | **Node.js & Express** | RESTful API architecture with robust error handling and file management. |
| **Database** | **SQLite3** | Localized, high-performance database with automatic schema migrations. |
| **Storage** | **Multer** | Local disk storage for employee documents and photos. |
| **Utils** | **XLSX / jsPDF** | Advanced document processing and report generation. |

---

## ⚡ Quick Start

### Option 1: Using Docker (Recommended)
Launch the entire system in under 2 minutes:
```bash
docker-compose up --build
```
Access the system at `http://localhost:8080` (Frontend) and `http://localhost:5018` (Backend).

### Option 2: Local Development
1. **Prerequisites**: Ensure you have Node.js v18+ and NPM installed.
2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🔐 Default Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `Admin@cookscape.com` | `Hrmaster@2026` |
| **Viewer** | `View@cookscape.com` | `View@2026` |

---

## 📚 Detailed Documentation

- 📘 **[Setup Guide](file:///C:/Users/aravi/Desktop/master-employee-database/SETUP_GUIDE.md)**: Deep dive into environment variables and troubleshooting.
- 🏗 **[Architecture](file:///C:/Users/aravi/Desktop/master-employee-database/ARCHITECTURE.md)**: System design, database schema, and project structure.
- 🔌 **[API Documentation](file:///C:/Users/aravi/Desktop/master-employee-database/API_DOCS.md)**: REST API endpoint reference.

---

© 2026 PeopleDesk HRM. Designed for performance and precision.
