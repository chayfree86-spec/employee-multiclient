<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class SyncUserBrandingSettings extends Migration
{
    public function up()
    {
        if (!$this->db->fieldExists('user_id', 'settings')) {
            return;
        }

        $this->upsertSettingFromUser('cafe_name', 'COALESCE(NULLIF(users.business_name, \'\'), NULLIF(users.owner_name, \'\'), NULLIF(users.username, \'\'))');
        $this->upsertSettingFromUser('business_phone', 'NULLIF(users.mobile, \'\')');
        $this->upsertSettingFromUser('business_email', 'NULLIF(users.email, \'\')');
        $this->upsertSettingFromUser('business_address', 'NULLIF(users.address, \'\')');
    }

    public function down()
    {
        // Branding settings are tenant-owned data and should remain intact.
    }

    private function upsertSettingFromUser(string $settingName, string $valueExpression): void
    {
        $now = date('Y-m-d H:i:s');
        $escapedName = $this->db->escape($settingName);
        $escapedNow = $this->db->escape($now);

        $this->db->query("
            INSERT INTO settings (user_id, setting_name, setting_value, created_at, updated_at)
            SELECT users.id, {$escapedName}, {$valueExpression}, {$escapedNow}, {$escapedNow}
            FROM users
            WHERE {$valueExpression} IS NOT NULL
            ON DUPLICATE KEY UPDATE
                setting_value = VALUES(setting_value),
                updated_at = VALUES(updated_at)
        ");
    }
}
