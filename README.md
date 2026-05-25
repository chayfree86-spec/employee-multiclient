# Employee Attendance & Payroll Management System

A complete web-based employee management system built with CodeIgniter 4, MySQL, and Bootstrap 5.

## Features

### Dashboard
- Overview of total employees, monthly salary budget, payouts, and advances
- Interactive charts for data visualization

### Employee Management
- Add, edit, delete employees
- Active/Inactive status management
- Employee details: name, mobile, monthly salary

### Attendance System
- Daily attendance marking with one-tap UI
- Support for Present, Absent, Half Day, and Holiday statuses
- Check-in and check-out time tracking
- Monthly attendance reports

### Payroll Management
- Automatic salary calculation based on attendance
- Salary formula: Full day = full salary, Half day = 50%, Absent = 0
- Add overtime, fine deductions, and loan/advance deductions
- Mark payroll as paid/unpaid
- Payment history tracking

### Reports
- Monthly attendance reports with percentages
- Monthly salary reports with breakdowns
- Advance/loan payment history
- PDF export functionality
- WhatsApp sharing ready

## Technology Stack

- **Backend**: PHP CodeIgniter 4
- **Database**: MySQL
- **Frontend**: Bootstrap 5 + Font Awesome
- **Charts**: Chart.js
- **PDF Export**: TCPDF

## Installation

1. **Prerequisites**
   - PHP 8.0 or higher
   - MySQL 5.7 or higher
   - Composer
   - XAMPP/WAMP or similar web server

2. **Setup**
   ```bash
   # Clone or download the project
   cd /path/to/xampp/htdocs

   # Install dependencies
   composer install

   # Create database
   mysql -u root -e "CREATE DATABASE employee_management;"

   # Import database schema
   mysql -u root employee_management < db_schema.sql
   ```

   **One-click setup (migrations)**  
   Create the database first, then run migrations and seed in one go:
   - **Windows**: Double-click `migrate.bat` (or run it from the project folder)
   - **Linux/Mac**: `chmod +x migrate.sh && ./migrate.sh`  
   This runs `php spark migrate` and seeds the admin user (username: `admin`, password: `admin`).

3. **Configuration**
   - Update database settings in `app/Config/Database.php` if needed
   - Ensure web server points to the `employee_management` directory

4. **Access**
   - Open browser and go to: `http://localhost/employee_management/`
   - Default database: `employee_management`
   - Sample data is included

## Database Schema

### Tables
- `employees` - Employee information
- `attendance` - Daily attendance records
- `payroll` - Monthly payroll calculations
- `advances` - Loan/advance records
- `payments` - Payment transactions

### Sample Data
The system comes with sample employees and data for testing.

## Usage

### Daily Workflow
1. **Mark Attendance**: Go to Attendance section and mark daily attendance for all employees
2. **Generate Payroll**: At month-end, generate payroll for all active employees
3. **Edit Payroll**: Add overtime, fines, or loan deductions as needed
4. **Mark as Paid**: Update payment status and record payment transactions
5. **Generate Reports**: Export PDF reports and share via WhatsApp

### Key Features
- **One-tap Attendance**: Quick attendance marking with status buttons
- **Auto-calculation**: Salary automatically calculated based on attendance
- **Flexible Deductions**: Add various types of deductions and additions
- **Comprehensive Reports**: Detailed reports with export capabilities
- **Mobile Friendly**: Responsive design works on all devices

## API Endpoints

The system includes RESTful API endpoints for:
- Employee CRUD operations
- Attendance marking
- Payroll calculations
- Report generation

## Security Features

- Input validation and sanitization
- CSRF protection
- SQL injection prevention
- XSS protection

## File Structure

```
employee_management/
├── app/
│   ├── Config/
│   ├── Controllers/
│   ├── Models/
│   └── Views/
├── public/
├── vendor/
├── db_schema.sql
├── composer.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support or questions, please check the CodeIgniter 4 documentation or create an issue in the repository.

When updating, check the release notes to see if there are any changes you might need to apply
to your `app` folder. The affected files can be copied or merged from
`vendor/codeigniter4/framework/app`.

## Setup

Copy `env` to `.env` and tailor for your app, specifically the baseURL
and any database settings.

## Important Change with index.php

`index.php` is no longer in the root of the project! It has been moved inside the *public* folder,
for better security and separation of components.

This means that you should configure your web server to "point" to your project's *public* folder, and
not to the project root. A better practice would be to configure a virtual host to point there. A poor practice would be to point your web server to the project root and expect to enter *public/...*, as the rest of your logic and the
framework are exposed.

**Please** read the user guide for a better explanation of how CI4 works!

## Repository Management

We use GitHub issues, in our main repository, to track **BUGS** and to track approved **DEVELOPMENT** work packages.
We use our [forum](http://forum.codeigniter.com) to provide SUPPORT and to discuss
FEATURE REQUESTS.

This repository is a "distribution" one, built by our release preparation script.
Problems with it can be raised on our forum, or as issues in the main repository.

## Server Requirements

PHP version 8.2 or higher is required, with the following extensions installed:

- [intl](http://php.net/manual/en/intl.requirements.php)
- [mbstring](http://php.net/manual/en/mbstring.installation.php)

> [!WARNING]
> - The end of life date for PHP 7.4 was November 28, 2022.
> - The end of life date for PHP 8.0 was November 26, 2023.
> - The end of life date for PHP 8.1 was December 31, 2025.
> - If you are still using below PHP 8.2, you should upgrade immediately.
> - The end of life date for PHP 8.2 will be December 31, 2026.

Additionally, make sure that the following extensions are enabled in your PHP:

- json (enabled by default - don't turn it off)
- [mysqlnd](http://php.net/manual/en/mysqlnd.install.php) if you plan to use MySQL
- [libcurl](http://php.net/manual/en/curl.requirements.php) if you plan to use the HTTP\CURLRequest library
