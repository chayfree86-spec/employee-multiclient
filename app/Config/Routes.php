<?php

namespace App\Config;

use CodeIgniter\Config\BaseConfig;
use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// API is now a separate project in employee-api folder with its own entry point.

// Public JSON API fallback for deployments where the employee-api sub-app is not
// reachable as /employee-api. These routes use the same controllers from
// employee-api/app via the EmployeeApi namespace autoload mapping.
$routes->options('api/v1/(:any)', static function () {
    return service('response')
        ->setStatusCode(204)
        ->setHeader('Access-Control-Allow-Origin', '*')
        ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->setHeader('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, Origin, X-Requested-With');
});

$routes->group('api/v1', ['namespace' => 'EmployeeApi\Controllers'], static function ($routes) {
    $routes->post('login', 'AuthController::login');
    $routes->get('logout', 'AuthController::logout');
    $routes->post('forgot-password', 'AuthController::forgotPassword');

    $routes->post('superadmin/login', 'SuperadminController::login');
    $routes->get('superadmin/users', 'SuperadminController::users');
    $routes->post('superadmin/users', 'SuperadminController::createUser');
    $routes->put('superadmin/users/(:num)', 'SuperadminController::updateUser/$1');
    $routes->delete('superadmin/users/(:num)', 'SuperadminController::deleteUser/$1');

    $routes->resource('employees', ['controller' => 'EmployeeController']);
    $routes->post('employees/(:num)/upload-image', 'EmployeeController::uploadImage/$1');

    $routes->get('attendance', 'AttendanceController::index');
    $routes->post('attendance', 'AttendanceController::create');
    $routes->post('attendance/bulk', 'AttendanceController::bulkCreate');

    $routes->get('aof', 'AdvanceOvertimeFineController::index');
    $routes->get('aof/summary', 'AdvanceOvertimeFineController::summary');
    $routes->post('aof', 'AdvanceOvertimeFineController::create');
    $routes->post('aof/transfer', 'AdvanceOvertimeFineController::transfer');
    $routes->put('aof/(:num)', 'AdvanceOvertimeFineController::update/$1');
    $routes->delete('aof/(:num)', 'AdvanceOvertimeFineController::delete/$1');

    $routes->get('payroll', 'PayrollController::index');
    $routes->get('payroll/summary', 'PayrollController::summary');
    $routes->get('payroll/hold-history/(:num)', 'PayrollController::holdHistory/$1');
    $routes->post('payroll/add-hold', 'PayrollController::addManualHold');
    $routes->post('payroll/release-hold', 'PayrollController::releaseManualHold');
    $routes->post('payroll/generate', 'PayrollController::generate');
    $routes->get('payroll/(:num)', 'PayrollController::show');
    $routes->delete('payroll/delete-all', 'PayrollController::deleteAll');
    $routes->delete('payroll/(:num)', 'PayrollController::delete/$1');

    $routes->get('reports/attendance', 'ReportController::attendance');
    $routes->get('reports/salary', 'ReportController::salary');

    $routes->get('settings', 'SettingsController::index');
    $routes->put('settings', 'SettingsController::update');

    $routes->get('dashboard', 'DashboardController::index');

    $routes->get('profile', 'ProfileController::index');
    $routes->post('profile/update/(:num)', 'ProfileController::update/$1');
    $routes->post('profile/change-password', 'ProfileController::changePassword');
    $routes->post('profile/upload-image', 'ProfileController::uploadImage');
    $routes->post('change-password', 'ProfileController::changePassword');
});

// Main UI: serve the static employee admin design. Legacy CI views/controllers
// remain available behind their specific routes so API/data functionality stays intact.
$routes->get('/', static fn () => redirect()->to('/employee-admin/attendance.html'));
$routes->get('/dashboard', static fn () => redirect()->to('/employee-admin/attendance.html'));
$routes->get('/superadmin', static fn () => redirect()->to('/employee-admin/superadmin/index.html'));
$routes->get('/superadmin/index.html', static fn () => redirect()->to('/employee-admin/superadmin/index.html'));

// Auth routes
$routes->get('/login', static fn () => redirect()->to('/employee-admin/attendance.html'));
$routes->post('/login', 'Auth::login');
$routes->get('/logout', 'Auth::logout');

// Profile routes
$routes->get('/profile', 'Profile::index');
$routes->post('/profile/update', 'Profile::update');
$routes->post('/profile/change-password', 'Profile::changePassword');

// Employee routes
$routes->get('/employee', 'Employee::index');
$routes->get('/employee/list', 'Employee::getList');
$routes->get('/employee/profile/(:num)', 'Employee::profile/$1');
$routes->get('/employee/profile-badges/(:num)', 'Employee::profileBadges/$1');
$routes->get('/employee/edit/(:num)', 'Employee::edit/$1');
$routes->post('/employee/create', 'Employee::create');
$routes->post('/employee/edit/(:num)', 'Employee::edit/$1');
$routes->post('/employee/delete/(:num)', 'Employee::delete/$1');
$routes->post('/employee/toggle-status/(:num)', 'Employee::toggleStatus/$1');

// Attendance routes
$routes->get('/attendance', 'Attendance::index');
$routes->post('/attendance/mark', 'Attendance::mark');
$routes->get('/attendance/get-attendance', 'Attendance::getAttendance');
$routes->get('/attendance/get-monthly/(:num)/(:num)/(:num)', 'Attendance::getMonthlyAttendance/$1/$2/$3');
$routes->get('/attendance/check-payroll-lock', 'Attendance::checkPayrollLock');
$routes->get('/attendance/report', 'Attendance::report');

// Advance, Overtime & Fine
$routes->get('/advance-overtime-fine', 'AdvanceOvertimeFine::index');
$routes->get('/advance-overtime-fine/list/(:num)/(:alpha)', 'AdvanceOvertimeFine::getListForEmployee/$1/$2');
$routes->get('/advance-overtime-fine/get/(:num)', 'AdvanceOvertimeFine::get/$1');
$routes->get('/advance-overtime-fine/repayment-status', 'AdvanceOvertimeFine::repaymentStatus');
$routes->get('/advance-overtime-fine/create', 'AdvanceOvertimeFine::create');
$routes->post('/advance-overtime-fine/create', 'AdvanceOvertimeFine::create');
$routes->get('/advance-overtime-fine/edit/(:num)', 'AdvanceOvertimeFine::edit/$1');
$routes->post('/advance-overtime-fine/edit/(:num)', 'AdvanceOvertimeFine::edit/$1');
$routes->post('/advance-overtime-fine/delete/(:num)', 'AdvanceOvertimeFine::delete/$1');
$routes->get('/advance-overtime-fine/check-payroll-lock', 'AdvanceOvertimeFine::checkPayrollLock');

// Payroll routes
$routes->get('/payroll', 'Payroll::index');
$routes->get('/payroll/salary-slip/(:num)', 'Payroll::salarySlip/$1');
$routes->post('/payroll/generate', 'Payroll::generate');
$routes->post('/payroll/delete-month', 'Payroll::deleteMonth');
$routes->post('/payroll/delete/(:num)', 'Payroll::deleteEmployee/$1');
$routes->get('/payroll/edit/(:num)', 'Payroll::edit/$1');
$routes->post('/payroll/edit/(:num)', 'Payroll::edit/$1');
$routes->post('/payroll/toggle-paid/(:num)', 'Payroll::togglePaid/$1');
$routes->post('/payroll/apply-advance/(:num)', 'Payroll::applyAdvance/$1');
$routes->post('/payroll/sync-aof/(:num)', 'Payroll::syncAof/$1');
$routes->post('/payroll/release-hold', 'Payroll::releaseHold');
$routes->get('/payroll/payments/(:num)', 'Payroll::payments/$1');
$routes->post('/payroll/add-payment', 'Payroll::addPayment');
$routes->post('/payroll/delete-payment/(:num)', 'Payroll::deletePayment/$1');

// Report routes
$routes->get('/report', 'Report::index');
$routes->get('/report/attendance', 'Report::attendance');
$routes->get('/report/salary-calc/(:num)/(:num)/(:num)', 'Report::salaryCalc/$1/$2/$3');
$routes->get('/report/salary', 'Report::salary');
$routes->get('/report/advances', 'Report::advances');
