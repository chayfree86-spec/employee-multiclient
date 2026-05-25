<?php

namespace EmployeeApi\Libraries;

/**
 * ApiHelper provides reusable utility functions for the API.
 */
class ApiHelper
{
    /**
     * Format a date to standard API format
     */
    public static function formatDate($date, $format = 'd-m-Y')
    {
        return date($format, strtotime($date));
    }

    /**
     * Helper to clean unexpected characters from input
     */
    public static function cleanInput($data)
    {
        if (is_array($data)) {
            return array_map([self::class, 'cleanInput'], $data);
        }
        return is_string($data) ? trim(strip_tags($data)) : $data;
    }

    /**
     * Generate a slug from string
     */
    public static function slugify($text)
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return strtolower($text);
    }
}
