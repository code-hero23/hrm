# 🔌 API Documentation

This document describes the REST API endpoints available in the Master Employee Database backend.

**Base URL**: `http://localhost:5018`
**Content Type**: `application/json` (unless specified otherwise)

---

## 🔐 Authentication

### POST `/api/login`
Authenticates a user and returns their role.
- **Request Body**:
  ```json
  { "username": "...", "password": "..." }
  ```
- **Success Response**: `200 OK`
  ```json
  { "id": 1, "username": "Admin@cookscape.com", "role": "admin" }
  ```

---

## 👥 Employees

### GET `/api/employees`
Returns a list of all employees.
- **Query Params**: `status` (optional) - filter by status.

### GET `/api/employees/:id`
Returns full details for a single employee.

### POST `/api/employees`
Creates a new employee record.
- **Type**: `multipart/form-data`
- **Fields**: Supports all employee fields + file uploads (photo, bank_passbook, etc.).

### PUT `/api/employees/:id`
Updates an existing employee record.
- **Type**: `multipart/form-data`

### PATCH `/api/employees/:id`
Partial update (JSON only) for specific fields.

### DELETE `/api/employees/:id`
Permanently deletes an employee record.

---

## 📥 Bulk Operations

### POST `/api/employees/bulk`
Bulk inserts multiple employee records.
- **Request Body**:
  ```json
  { "employees": [ { "full_name": "...", "employee_id": "..." }, ... ] }
  ```
- **Response**: Summary of success and error counts.

---

## 📦 Resource Bucket

### GET `/api/bucket`
Lists all resources and their assignment status.

### POST `/api/bucket/bulk`
Bulk imports resources (SIMs, Laptops).

### PATCH `/api/bucket/:id/assign`
Assigns a resource to an employee.

### PATCH `/api/bucket/:id/unassign`
Removes assignment from a resource.

---

## 📩 Invitations

### POST `/api/invitations`
Generates a unique onboarding invitation token.
- **Request Body**: `{ "shared_name": "..." }`

### GET `/api/invitations/verify/:token`
Verifies if a token is valid and still "pending".

---

## 📂 Static Files

### GET `/uploads/:filename`
Serves static files (documents/photos).
- **Security**: CORS allowed for cross-origin access from the frontend.
