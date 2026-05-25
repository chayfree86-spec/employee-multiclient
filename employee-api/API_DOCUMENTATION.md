# Employee Management API Documentation (v1)

This documentation covers all the available API endpoints for the Employee Management System.

## Base URL
`http://localhost/employee/api/v1`

## Response Format
All responses follow a standard JSON structure:

### Success Response
```json
{
    "status": true,
    "message": "Success message",
    "data": { ... } or [ ... ]
}
```

### Error Response
```json
{
    "status": false,
    "message": "Error message",
    "errors": { "field": "error detail" } (Optional)
}
```

---

## 🔐 Authentication
**Endpoint:** `POST /login`

**Request Body:**
```json
{
    "username": "admin",
    "password": "yourpassword"
}
```

---

## 👥 Employees
### 1. List All Employees
- **URL:** `GET /employees`
- **Description:** Returns a list of all active and inactive employees.

### 2. Create Employee
- **URL:** `POST /employees`
- **Request Body:**
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "monthly_salary": 25000,
    "join_date": "2024-01-01"
}
```

---

## 📅 Attendance
### 1. View Attendance
- **URL:** `GET /attendance?date=YYYY-MM-DD`
- **Description:** Returns attendance records for the specified date.

### 2. Mark Attendance
- **URL:** `POST /attendance`
- **Request Body:**
```json
{
    "employee_id": 1,
    "date": "2024-02-09",
    "status": "present",
    "check_in": "09:00:00"
}
```

---

## 💰 Advance, Overtime & Fine (AOF)
### 1. List Transactions
- **URL:** `GET /aof?employee_id=1&type=advance`
- **Types:** `advance`, `overtime`, `fine`

---

## 💳 Payroll
### 1. List Payroll
- **URL:** `GET /payroll?month=02&year=2024`
- **Description:** Returns payroll records for the specified month and year.

### 2. View Salary Slip
- **URL:** `GET /payroll/(:num)`
- **Description:** Returns details for a specific payroll record.

---

## 👤 Profile
### 1. View Profile
- **URL:** `GET /profile?id=1`

### 2. Update Profile
- **URL:** `POST /profile/update/(:num)`

### 3. Change Password
- **URL:** `POST /profile/change-password`
- **Request Body:**
```json
{
    "id": 1,
    "new_password": "newpassword"
}
```

---

## 📊 Dashboard & Reports
### 1. Dashboard Metrics
- **URL:** `GET /dashboard`
- **Returns:** Summary stats and historical chart data.

### 2. Attendance Report
- **URL:** `GET /reports/attendance?month=02&year=2024`

### 3. Salary Report
- **URL:** `GET /reports/salary?month=02&year=2024`

---

## 🛠 Support Libraries
- **ApiHelper**: Specialized library for cleaning inputs and formatting API data located at `employee-api/Libraries/ApiHelper.php`.
