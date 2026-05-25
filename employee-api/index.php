<?php

use CodeIgniter\Boot;
use Config\Paths;

$allowedOrigins = [
    'https://employee.chaychaupal.com',
    'http://localhost',
    'http://127.0.0.1',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '') {
    $normalizedOrigin = preg_replace('#:\d+$#', '', $origin);
    if (in_array($origin, $allowedOrigins, true) || in_array($normalizedOrigin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Accept, Authorization, Content-Type, Origin, X-Requested-With');
        header('Access-Control-Max-Age: 7200');
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Shared hosting can drop PATH_INFO for URLs like index.php/api/v1/login.
// The admin app can fall back to index.php?route=/api/v1/login, then we
// normalize it before CodeIgniter resolves routes.
$queryRoute = $_GET['route'] ?? '';
if (is_string($queryRoute) && $queryRoute !== '') {
    $normalizedRoute = '/' . ltrim($queryRoute, '/');
    $_SERVER['REQUEST_URI'] = $normalizedRoute;
    $_SERVER['PATH_INFO'] = $normalizedRoute;
    unset($_GET['route'], $_REQUEST['route']);
}

// Check PHP version
$minPhpVersion = '8.2';
if (version_compare(PHP_VERSION, $minPhpVersion, '<')) {
    header('HTTP/1.1 503 Service Unavailable.', true, 503);
    echo 'Your PHP version must be ' . $minPhpVersion . ' or higher to run CodeIgniter. Current version: ' . PHP_VERSION;
    exit(1);
}

// Path to the front controller
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);

// Ensure the current directory is pointing to the front controller's directory
if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
    chdir(FCPATH);
}

// Load Paths config
require FCPATH . 'app/Config/Paths.php';

$paths = new Paths();

// Load the framework bootstrap file
require $paths->systemDirectory . '/Boot.php';

exit(Boot::bootWeb($paths));
