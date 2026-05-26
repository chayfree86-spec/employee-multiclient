<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class BackfillTenantUserSettings extends Migration
{
    private array $fallbackSettings = [
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

    public function up()
    {
        if (!$this->db->fieldExists('user_id', 'settings')) {
            return;
        }

        $now = date('Y-m-d H:i:s');
        $sourceRows = $this->db->table('settings')
            ->select('setting_name, setting_value')
            ->where('user_id', 1)
            ->get()
            ->getResultArray();

        if ($sourceRows === []) {
            $sourceRows = array_map(
                static fn ($name, $value) => [
                    'setting_name' => $name,
                    'setting_value' => $value,
                ],
                array_keys($this->fallbackSettings),
                $this->fallbackSettings
            );
        }

        $users = $this->db->table('users')->select('id')->get()->getResultArray();
        foreach ($users as $user) {
            $userId = (int) $user['id'];
            foreach ($sourceRows as $row) {
                $this->db->table('settings')->ignore(true)->insert([
                    'user_id' => $userId,
                    'setting_name' => $row['setting_name'],
                    'setting_value' => $row['setting_value'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down()
    {
        // Backfilled tenant defaults should remain with the tenant data.
    }
}
