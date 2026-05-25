<?php

$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$filePath = __DIR__ . str_replace('/', DIRECTORY_SEPARATOR, rawurldecode($uriPath));

if (is_file($filePath)) {
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $contentTypes = [
        'css' => 'text/css; charset=UTF-8',
        'js' => 'application/javascript; charset=UTF-8',
        'json' => 'application/json; charset=UTF-8',
        'webmanifest' => 'application/manifest+json; charset=UTF-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'ttf' => 'font/ttf',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
    ];

    if (isset($contentTypes[$extension])) {
        header('Content-Type: ' . $contentTypes[$extension]);
    }

    if (in_array($extension, ['css', 'js', 'ttf', 'woff', 'woff2', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'ico'], true)) {
        header('Cache-Control: public, max-age=31536000, immutable');
    } elseif (in_array($extension, ['html', 'webmanifest'], true)) {
        header('Cache-Control: no-cache, must-revalidate');
    }

    $contents = file_get_contents($filePath);
    $canCompress = in_array($extension, ['html', 'css', 'js', 'json', 'webmanifest', 'svg'], true)
        && str_contains($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip');

    if ($canCompress && $contents !== false) {
        header('Vary: Accept-Encoding');
        header('Content-Encoding: gzip');
        echo gzencode($contents, 6);
        return true;
    }

    if ($contents !== false) {
        echo $contents;
    }
    return true;
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
