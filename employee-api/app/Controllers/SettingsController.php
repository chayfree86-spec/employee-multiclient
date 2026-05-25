<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\SettingsModel;

class SettingsController extends BaseApiController
{
    /**
     * GET /api/v1/settings
     */
    public function index()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new SettingsModel();
        return $this->respondSuccess($model->getAll(), 'Settings retrieved');
    }

    /**
     * PUT /api/v1/settings
     */
    public function update($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $data = $this->request->getJSON(true);
        if (!is_array($data) || empty($data)) {
            return $this->respondError('No settings provided', 400);
        }

        $model = new SettingsModel();
        $allowedKeys = [
            'cafe_name',
            'business_address',
            'business_phone',
            'business_email',
            'salary_cycle_type',
            'salary_cycle',
            'salary_cycle_weekday',
            'weekly_holiday',
            'auto_hold_enabled',
            'auto_hold_days',
            'payroll_mode',
            'monthly_days',
            'color_star_badge',
            'color_advance',
            'color_deduction',
        ];

        foreach ($data as $key => $value) {
            if (!in_array($key, $allowedKeys, true)) {
                continue;
            }

            if ($key === 'payroll_mode' && !in_array($value, ['monthly', 'per_day'], true)) {
                return $this->respondError('payroll_mode must be "monthly" or "per_day"', 400);
            }

            if (in_array($key, ['cafe_name', 'business_address', 'business_phone', 'business_email'], true)) {
                $value = trim((string) $value);
                if ($key === 'cafe_name' && $value === '') {
                    return $this->respondError('cafe_name cannot be empty', 400);
                }
                if ($key === 'business_email' && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return $this->respondError('business_email must be a valid email address', 400);
                }
                if (strlen($value) > 120) {
                    return $this->respondError("$key must be 120 characters or less", 400);
                }
            }

            if ($key === 'monthly_days') {
                $days = (int) $value;
                if ($days < 28 || $days > 31) {
                    return $this->respondError('monthly_days must be between 28 and 31', 400);
                }
                $value = (string) $days;
            }

            if ($key === 'salary_cycle_type' && !in_array($value, ['Daily', 'Weekly', 'Monthly'], true)) {
                return $this->respondError('salary_cycle_type must be Daily, Weekly, or Monthly', 400);
            }

            if ($key === 'salary_cycle') {
                $day = (int) $value;
                if ($day < 1 || $day > 28) {
                    return $this->respondError('salary_cycle must be between 1 and 28', 400);
                }
                $value = (string) $day;
            }

            if ($key === 'salary_cycle_weekday' || $key === 'weekly_holiday') {
                $weekday = (int) $value;
                if ($weekday < 0 || $weekday > 6) {
                    return $this->respondError("$key must be between 0 and 6", 400);
                }
                $value = (string) $weekday;
            }

            if ($key === 'auto_hold_enabled') {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            }

            if ($key === 'auto_hold_days') {
                $holdDays = (int) $value;
                if ($holdDays < 0 || $holdDays > 31) {
                    return $this->respondError('auto_hold_days must be between 0 and 31', 400);
                }
                $value = (string) $holdDays;
            }

            $model->setSetting($key, $value);
        }

        return $this->respondSuccess($model->getAll(), 'Settings updated');
    }
}
