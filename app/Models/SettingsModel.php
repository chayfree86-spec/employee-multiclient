<?php

namespace App\Models;

use CodeIgniter\Model;

class SettingsModel extends Model
{
    protected $table      = 'settings';
    protected $primaryKey = 'id';
    protected $allowedFields = ['setting_name', 'setting_value'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * In-memory cache to avoid repeated DB queries within a single request.
     */
    protected static ?array $_cache = null;

    /**
     * Load all settings into cache (once per request).
     */
    protected function loadCache(): void
    {
        if (static::$_cache === null) {
            $rows = $this->findAll();
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
        $existing = $this->where('setting_name', $name)->first();
        if ($existing) {
            $this->update($existing['id'], ['setting_value' => $value]);
        } else {
            $this->insert(['setting_name' => $name, 'setting_value' => $value]);
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
