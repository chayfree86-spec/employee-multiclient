<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class SettingsModel extends Model
{
    protected $table      = 'settings';
    protected $primaryKey = 'id';
    protected $allowedFields = ['user_id', 'setting_name', 'setting_value'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * In-memory cache to avoid repeated DB queries within a single request.
     */
    protected static ?array $_cache = null;
    protected static ?int $_currentUserId = null;

    public static function setCurrentUserId(int $userId): void
    {
        if (static::$_currentUserId !== $userId) {
            static::$_cache = null;
        }
        static::$_currentUserId = $userId;
    }

    private function currentUserId(): int
    {
        if (static::$_currentUserId === null) {
            throw new \RuntimeException('Settings user context is not set');
        }

        return static::$_currentUserId;
    }

    protected array $defaultSettings = [
        'cafe_name' => 'Cafe Admin',
        'business_address' => 'Near Clock Tower, Main Market, City',
        'business_phone' => '+91 98765 43210',
        'business_email' => 'info@cafepremium.com',
        'salary_cycle_type' => 'Monthly',
        'salary_cycle' => '1',
        'salary_cycle_weekday' => '1',
        'weekly_holiday' => '0',
        'auto_hold_enabled' => '0',
        'auto_hold_days' => '0',
        'payroll_mode' => 'monthly',
        'monthly_days' => '30',
        'color_star_badge' => '#FFD700',
        'color_advance' => '#6c5ce7',
        'color_deduction' => '#d63031',
    ];

    public function getDefaultSettings(): array
    {
        return $this->defaultSettings;
    }

    /**
     * Load all settings into cache (once per request).
     */
    protected function loadCache(): void
    {
        if (static::$_cache === null) {
            $rows = $this->where('user_id', $this->currentUserId())->findAll();
            static::$_cache = [];
            foreach ($rows as $row) {
                static::$_cache[$row['setting_name']] = $row['setting_value'];
            }
        }
    }

    /**
     * Get all settings as key-value pairs.
     */
    public function getAll(): array
    {
        $this->loadCache();
        $missingDefaults = [];
        foreach ($this->defaultSettings as $key => $value) {
            if (!array_key_exists($key, static::$_cache)) {
                $missingDefaults[$key] = $value;
            }
        }

        foreach ($missingDefaults as $key => $value) {
            $this->setSetting($key, $value);
        }

        if ($missingDefaults) {
            $this->loadCache();
        }

        return static::$_cache;
    }

    /**
     * Get a single setting value by name.
     */
    public function getSetting(string $name, $default = null)
    {
        $this->loadCache();
        return static::$_cache[$name] ?? $default;
    }

    /**
     * Upsert a setting.
     */
    public function setSetting(string $name, string $value): void
    {
        $userId = $this->currentUserId();
        $existing = $this->where('user_id', $userId)->where('setting_name', $name)->first();
        if ($existing) {
            $this->update($existing['id'], ['setting_value' => $value]);
        } else {
            $this->insert(['user_id' => $userId, 'setting_name' => $name, 'setting_value' => $value]);
        }

        // Invalidate cache
        static::$_cache = null;
    }

    /**
     * Get the days divisor for salary calculation based on payroll_mode setting.
     *
     * @param int $month 1-12
     * @param int $year  e.g. 2026
     * @return int  Number of days to divide monthly salary by
     */
    public function getDaysDivisor(int $month, int $year): int
    {
        $mode = $this->getSetting('payroll_mode', 'monthly');

        if ($mode === 'per_day') {
            return (int) date('t', mktime(0, 0, 0, $month, 1, $year));
        }

        return (int) ($this->getSetting('monthly_days', '30') ?: 30);
    }
}
