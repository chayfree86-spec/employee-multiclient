<?php

$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$filePath = __DIR__ . str_replace('/', DIRECTORY_SEPARATOR, rawurldecode($uriPath));

if (is_file($filePath)) {
    return false;
}

$redirects = [
    '/' => '/employee-admin/attendance.html',
    '/dashboard' => '/employee-admin/attendance.html',
    '/login' => '/employee-admin/attendance.html',
    '/login.html' => '/employee-admin/attendance.html',
    '/superadmin' => '/employee-admin/superadmin/index.html',
    '/superadmin/index.html' => '/employee-admin/superadmin/index.html',
    '/attendance.html' => '/employee-admin/attendance.html',
    '/salary.html' => '/employee-admin/salary.html',
    '/reports.html' => '/employee-admin/reports.html',
    '/staff.html' => '/employee-admin/staff.html',
    '/settings.html' => '/employee-admin/settings.html',
];

if (isset($redirects[$uriPath])) {
    header('Location: ' . $redirects[$uriPath], true, 302);
    exit;
}

if (str_starts_with($uriPath, '/emoloyee-admin/')) {
    header('Location: /employee-admin/' . substr($uriPath, 16), true, 302);
    exit;
}

require __DIR__ . '/index.php';
