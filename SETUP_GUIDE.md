# 🛠 Setup & Installation Guide

# PeopleDesk HRM - Master Employee Database

[![Status](https://img.shields.io/badge/Status-Active-success.svg)]
[![Frontend](https://img.shields.io/badge/Frontend-React%20(Vite)-61DAFB.svg)]
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%26%20Express-339933.svg)]
[![Database](https://img.shields.io/badge/Database-SQLite-003B57.svg)]

PeopleDesk HRM is a comprehensive Human Resource Management (HRM) system that manages the complete employee lifecycle—from onboarding to resignation.

The application centralizes employee information, stores official documents, tracks important dates, manages company resources, and provides HR teams with a single source of truth for employee records.

---

# Features

## Employee Lifecycle Management

- Complete employee onboarding workflow
- Employee profile management
- Employment history
- Department & designation management
- Employee status tracking
- Resignation management
- Exit record maintenance

---

## Employee Information

Maintain complete employee information including:

- Personal Details
- Contact Information
- Emergency Contacts
- Address
- Educational Details
- Previous Employment
- Salary Information
- Bank Details
- Government IDs
- Passport Details
- Family Information

---

## Document Management

Securely upload and manage employee documents.

Supported documents include:

- Resume
- Offer Letter
- Aadhaar
- PAN
- Passport
- Educational Certificates
- Experience Certificates
- Relieving Letters
- Salary Slips
- Employee Photo
- Other Company Documents

---

## Resource Bucket

Track company resources assigned to employees.

Examples:

- Company Email
- WhatsApp Business Number
- Laptop
- Desktop
- Mobile Phone
- SIM Card
- Software Licenses
- Office Assets
- Access Credentials

This helps HR know exactly which company resources are assigned to each employee.

---

## Important Date Tracking

Never miss employee events.

Track:

- Birthday
- Wedding Anniversary
- Date of Joining
- Probation End Date
- Confirmation Date
- Exit Date

---

## Bulk Employee Import

Import employee records using Excel or CSV.

Features include:

- Intelligent field mapping
- Validation
- Duplicate detection
- Import summary
- Error reporting

---

## Authentication & Authorization

- Secure Login
- Password Encryption
- Role Based Access Control
- Admin Access
- Viewer Access

---

## Notifications

- Email notifications for onboarding
- Employee updates
- HR alerts

---

# Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Database | SQLite3 |
| Storage | Multer |
| File Processing | XLSX |
| PDF Reports | jsPDF |

---

# Project Structure

```
PeopleDesk-HRM/
│
├── backend/
│   ├── data/
│   ├── uploads/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── index.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── API_DOCS.md
├── ARCHITECTURE.md
├── bulk_import_sample.xlsx
├── bulk_import_sample.csv
└── README.md
```

---

# Installation

## Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```
http://localhost:5018
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# Docker

```bash
docker-compose up --build
```

---

# Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | Admin@cookscape.com | Hrmaster@2026 |
| Viewer | View@cookscape.com | View@2026 |

---

# Main Modules

- Dashboard
- Employee Management
- Employee Onboarding
- Employee Exit
- Document Management
- Resource Bucket
- Birthday Tracker
- Wedding Anniversary Tracker
- Bulk Import
- Reports
- Authentication
- User Management
- Settings

---

# API Documentation

See:

```
API_DOCS.md
```

---

# Architecture

See:

```
ARCHITECTURE.md
```

---

# Future Improvements

- Attendance Management
- Leave Management
- Payroll
- Performance Reviews
- Holiday Calendar
- Shift Management
- Recruitment Module
- Mobile Application
- Cloud Storage Integration

---

# License

This project is intended for internal company HR operations.

© 2026 PeopleDesk HRM