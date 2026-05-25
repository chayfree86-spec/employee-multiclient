<?php

namespace Config;

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// Default route
$routes->get('/', 'DashboardController::index', ['namespace' => 'EmployeeApi\Controllers']);
$routes->get('setup-db', 'DatabaseSetupController::index', ['namespace' => 'EmployeeApi\Controllers']);

$routes->group('api/v1', ['namespace' => 'EmployeeApi\Controllers'], function($routes) {
    
    // Auth
    $routes->post('login', 'AuthController::login');
    $routes->get('logout', 'AuthController::logout');
    $routes->post('forgot-password', 'AuthController::forgotPassword');

    $routes->post('superadmin/login', 'SuperadminController::login');
    $routes->get('superadmin/users', 'SuperadminController::users');
    $routes->post('superadmin/users', 'SuperadminController::createUser');
    $routes->put('superadmin/users/(:num)', 'SuperadminController::updateUser/$1');
    $routes->delete('superadmin/users/(:num)', 'SuperadminController::deleteUser/$1');

    // Employee Resources
    $routes->resource('employees', ['controller' => 'EmployeeController']);
    $routes->post('employees/(:num)/upload-image', 'EmployeeController::uploadImage/$1');
    
    // Attendance
    $routes->get('attendance', 'AttendanceController::index');
    $routes->post('attendance', 'AttendanceController::create');
    $routes->post('attendance/bulk', 'AttendanceController::bulkCreate');
    
    // Advance, Overtime & Fine
    $routes->get('aof', 'AdvanceOvertimeFineController::index');
    $routes->get('aof/summary', 'AdvanceOvertimeFineController::summary');
    $routes->post('aof', 'AdvanceOvertimeFineController::create');
    $routes->post('aof/transfer', 'AdvanceOvertimeFineController::transfer');
    $routes->put('aof/(:num)', 'AdvanceOvertimeFineController::update/$1');
    $routes->delete('aof/(:num)', 'AdvanceOvertimeFineController::delete/$1');

    // Payroll
    $routes->get('payroll', 'PayrollController::index');
    $routes->get('payroll/summary', 'PayrollController::summary');
    $routes->get('payroll/hold-history/(:num)', 'PayrollController::holdHistory/$1');
    $routes->post('payroll/add-hold', 'PayrollController::addManualHold');
    $routes->post('payroll/release-hold', 'PayrollController::releaseManualHold');
    $routes->post('payroll/generate', 'PayrollController::generate');
    $routes->get('payroll/(:num)', 'PayrollController::show');
    $routes->delete('payroll/delete-all', 'PayrollController::deleteAll');
    $routes->delete('payroll/(:num)', 'PayrollController::delete/$1');

    // Reports
    $routes->get('reports/attendance', 'ReportController::attendance');
    $routes->get('reports/salary', 'ReportController::salary');

    // Settings
    $routes->get('settings', 'SettingsController::index');
    $routes->put('settings', 'SettingsController::update');

    // Dashboard
    $routes->get('dashboard', 'DashboardController::index');

    // Profile
    $routes->get('profile', 'ProfileController::index');
    $routes->post('profile/update/(:num)', 'ProfileController::update/$1');
    $routes->post('profile/change-password', 'ProfileController::changePassword');
    $routes->post('profile/upload-image', 'ProfileController::uploadImage');
    $routes->post('change-password', 'ProfileController::changePassword');
});
