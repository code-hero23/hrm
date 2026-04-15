# 🏗 System Architecture

This document details the technical design of the Master Employee Database (PeopleDesk).

## 📁 Directory Structure

```text
master-employee-database/
├── backend/                # Node.js/Express API
│   ├── data/               # Persistent database storage
│   ├── uploads/            # Document and photo storage
│   ├── index.js            # Main entry point & API routes
│   ├── db.js               # Database schema & migrations
│   └── .env.example        # Environment template
├── frontend/               # React (Vite) Single Page Application
│   ├── src/
│   │   ├── pages/          # Full-page components (Dashboard, Onboarding, etc.)
│   │   ├── assets/         # Static images and styles
│   │   └── config.js       # Global API configuration
│   └── Dockerfile          # Frontend container config
├── deploy_bundle/          # Pre-packaged artifacts for deployment
├── docker-compose.yml      # Multi-container orchestration
└── Root Utility Scripts    # SQL verifiers and import cleaners
```

---

## 🗄 Database Design (SQLite)

The system uses a flat-file SQLite database located at `backend/data/database.sqlite`. It is automatically initialized and migrated on application startup via `db.js`.

### Main Tables

- **`employees`**: Stores 70+ fields of employee information, including personal data, bank details, and 19-step onboarding status.
- **`users`**: Authentication table with Bcrypt-hashed passwords.
- **`resource_bucket`**: Tracks assets (SIM cards, laptops) and their assignment status to employees.
- **`invitations`**: Manages unique onboarding tokens for secure, single-use invite links.

---

## 🌟 Intelligent System Features

### 1. Robust Database Initialization & Recovery (`db.js`)
The database module includes aggressive recovery logic:
- If a database is found in the root directory but missing from the `data/` volume (common in Docker volumes), it automatically migrates the root data to the persistent volume to prevent data loss.
- Automatic column migrations: The system checks for missing columns on startup and adds them without data loss.

### 2. Intelligent Bulk Import (`BulkImport.jsx`)
The bulk import module features:
- **Header Normalization**: Automatically maps non-standard CSV/Excel headers (e.g., "Email ID" -> `personal_email`).
- **Data Quality Scoring**: Calculates a completion percentage for each row based on required fields.
- **Status Alignment**: Normalizes status strings (e.g., "Working" -> "Current Employee").

### 3. Automated File No. Generation
The system implements a sequential `file_no` generator (e.g., `HRM/26/001`) that automatically increments based on the last record in the database, ensuring unique and consistent employee IDs.

---

## 🛡 Security & Authentication

- **Hashing**: All passwords are encrypted using `bcrypt` (10 rounds).
- **Session Management**: Static role-based authorization via `users` table.
- **CORS Configuration**: Restricted to modern browser security standards.
- **File Access**: Strict directory serving for the `uploads/` folder with proper headers.

---

## 🔄 Data Flow

1. **Onboarding**: User fills React form -> Multi-part form data sent to Express -> Files saved to `/uploads` -> Record committed to SQLite.
2. **Bulk Import**: XLSX read via `SheetJS` -> Frontend normalization -> JSON payload sent to `/api/employees/bulk` -> Transactional commit in SQLite.
3. **Invitations**: Admin generates token -> Stored in `invitations` -> Link sent to candidate -> Single-use validation on submission.
