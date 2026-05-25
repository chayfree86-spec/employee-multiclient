<?php

namespace EmployeeApi\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

/**
 * BaseApiController provides a standardized way to return JSON responses.
 * All API controllers should extend this class.
 */
class BaseApiController extends ResourceController
{
    use ResponseTrait;

    const BRAND_NAME = 'CHAY CHAUPAL';
    const APP_NAME = 'Attendance App';

    protected $format = 'json';

    /**
     * Remove blank/null/empty values from data so they don't overwrite existing DB values.
     * Use this before any update() call.
     */
    protected function filterBlankValues(array $data): array
    {
        return array_filter($data, function ($value) {
            if (is_null($value)) return false;
            if (is_string($value) && trim($value) === '') return false;
            return true;
        });
    }

    /**
     * Get the base URL from the current request (scheme + host + base path)
     * E.g. https://employee-api.chaychaupal.com or http://localhost/employee/employee-api
     */
    protected function getBaseUrl(): string
    {
        // Use actual request Host header, not CI4's configured baseURL
        $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? $this->request->getUri()->getHost();
        $path = $this->request->getUri()->getPath();
        // Strip /api/v1/... to get the application root
        $basePath = preg_replace('#/api/v1.*$#', '', $path);
        return rtrim($scheme . '://' . $host . $basePath, '/');
    }

    /**
     * Recursively prepend base URL to any profile_image fields that are relative paths
     */
    private function addImageBaseUrl($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if ($key === 'profile_image' && is_string($value) && !empty($value)) {
                    // Only prepend base URL if it's a relative path (starts with /)
                    // If it already has http/https, leave it as-is
                    if (str_starts_with($value, '/')) {
                        $data[$key] = $this->getBaseUrl() . $value;
                    }
                } else {
                    $data[$key] = $this->addImageBaseUrl($value);
                }
            }
        } elseif (is_object($data)) {
            foreach ($data as $key => $value) {
                if ($key === 'profile_image' && is_string($value) && !empty($value)) {
                    if (str_starts_with($value, '/')) {
                        $data->$key = $this->getBaseUrl() . $value;
                    }
                } else {
                    $data->$key = $this->addImageBaseUrl($value);
                }
            }
        }
        return $data;
    }

    /**
     * Standard success response structure
     */
    protected function respondSuccess($data = null, string $message = 'Request successful', int $code = 200)
    {
        $processed = $this->roundNumericData($data);
        $processed = $this->addImageBaseUrl($processed);

        return $this->respond([
            'status'  => true,
            'message' => $message,
            'data'    => $processed
        ], $code);
    }

    /**
     * Recursive helper to round all float values in the data
     */
    private function roundNumericData($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->roundNumericData($value);
            }
        } elseif (is_object($data)) {
            foreach ($data as $key => $value) {
                $data->$key = $this->roundNumericData($value);
            }
        } elseif (is_float($data) || (is_string($data) && is_numeric($data) && strpos($data, '.') !== false)) {
            $data = (int) round((float)$data, 0);
        }

        return $data;
    }

    /**
     * Standard error response structure
     */
    protected function respondError(string $message = 'An error occurred', int $code = 400, $errors = null)
    {
        $response = [
            'status'  => false,
            'message' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return $this->respond($response, $code);
    }
}
