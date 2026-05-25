<?php
/**
 * Health check – run without CodeIgniter to verify server/PHP.
 * Access: https://yourdomain.com/health.php (or /public/health.php if doc root is project root)
 * Delete this file after debugging.
 */
header('Content-Type: text/plain; charset=utf-8');
echo "PHP version: " . PHP_VERSION . "\n";
echo "PHP 8.2+ required: " . (version_compare(PHP_VERSION, '8.2.0', '>=') ? 'Yes' : 'No - upgrade in Hostinger PHP settings') . "\n\n";

$root = dirname(__DIR__);
echo "Project root: " . $root . "\n";
echo ".env exists: " . (file_exists($root . '/.env') ? 'Yes' : 'No') . "\n";
echo "writable/ exists: " . (is_dir($root . '/writable') ? 'Yes' : 'No') . "\n";
echo "writable/session writable: " . (is_writable($root . '/writable/session') ? 'Yes' : 'No') . "\n";
echo "writable/logs writable: " . (is_writable($root . '/writable/logs') ? 'Yes' : 'No') . "\n";
echo "app/Config/Paths.php exists: " . (file_exists($root . '/app/Config/Paths.php') ? 'Yes' : 'No') . "\n\n";

echo "If all above look OK, 500 is likely: database credentials in .env or .htaccess RewriteBase.\n";
echo "See DEPLOY-HOSTINGER.md for steps.\n";
