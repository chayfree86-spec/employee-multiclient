<?php

namespace Config;

/**
 * Config Registrar: sets App baseURL from the current request.
 * Works on any server/domain with zero config.
 * Wrapped in try-catch so it never causes a 500; on failure, app uses default baseURL.
 */
class Registrar
{
    public static function App(): array
    {
        try {
            if (PHP_SAPI === 'cli') {
                return [];
            }
            if (! isset($_SERVER['HTTP_HOST']) || $_SERVER['HTTP_HOST'] === '') {
                return [];
            }
            $host = (string) $_SERVER['HTTP_HOST'];
            $protocol = 'http';
            if (! empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
                $protocol = 'https';
            } elseif (! empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
                $protocol = 'https';
            }
            $scriptName = isset($_SERVER['SCRIPT_NAME']) ? (string) $_SERVER['SCRIPT_NAME'] : '/index.php';
            $basePath   = dirname($scriptName);
            $basePath   = str_replace('\\', '/', $basePath);
            $basePath   = rtrim($basePath, '/');
            if ($basePath === '' || $basePath === '.') {
                $basePath = '/';
            } else {
                $basePath .= '/';
            }
            $baseURL = $protocol . '://' . $host . $basePath;
            return ['baseURL' => $baseURL];
        } catch (\Throwable $e) {
            return [];
        }
    }
}
