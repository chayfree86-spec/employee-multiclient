<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSuperadminAndTenantUsers extends Migration
{
    public function up()
    {
        $this->db->query("CREATE TABLE IF NOT EXISTS superadmins (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            mobile VARCHAR(20) NOT NULL,
            password VARCHAR(255) NOT NULL,
            status ENUM('active','inactive') NOT NULL DEFAULT 'active',
            created_at DATETIME NULL,
            updated_at DATETIME NULL,
            PRIMARY KEY (id),
            UNIQUE KEY mobile (mobile)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) NULL AFTER username");
        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS owner_name VARCHAR(100) NULL AFTER email");
        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(120) NULL AFTER owner_name");
        $this->db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL AFTER business_name");

        foreach (['employees', 'attendance', 'payroll', 'advance_overtime_fine', 'settings', 'hold_salary', 'hold_salary_releases'] as $table) {
            $this->db->query("ALTER TABLE {$table} ADD COLUMN IF NOT EXISTS user_id INT UNSIGNED NULL AFTER id");
        }

        $this->db->query("UPDATE users SET mobile = '9005271986' WHERE id = 1 AND (mobile IS NULL OR mobile = '')");
        $this->db->query("UPDATE users SET owner_name = username WHERE owner_name IS NULL OR owner_name = ''");
        $this->db->query("UPDATE users SET business_name = username WHERE business_name IS NULL OR business_name = ''");

        $hash = password_hash('123456', PASSWORD_DEFAULT);
        $this->db->table('superadmins')->ignore(true)->insert([
            'name' => 'Super Admin',
            'mobile' => '9628717175',
            'password' => $hash,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        $this->db->query("UPDATE employees SET user_id = 1 WHERE user_id IS NULL");
        $this->db->query("UPDATE attendance a JOIN employees e ON e.id = a.employee_id SET a.user_id = e.user_id WHERE a.user_id IS NULL");
        $this->db->query("UPDATE payroll p JOIN employees e ON e.id = p.employee_id SET p.user_id = e.user_id WHERE p.user_id IS NULL");
        $this->db->query("UPDATE advance_overtime_fine a JOIN employees e ON e.id = a.employee_id SET a.user_id = e.user_id WHERE a.user_id IS NULL");
        $this->db->query("UPDATE hold_salary h JOIN employees e ON e.id = h.employee_id SET h.user_id = e.user_id WHERE h.user_id IS NULL");
        $this->db->query("UPDATE hold_salary_releases r JOIN hold_salary h ON h.id = r.hold_salary_id SET r.user_id = h.user_id WHERE r.user_id IS NULL");
        $this->db->query("UPDATE settings SET user_id = 1 WHERE user_id IS NULL");

        foreach (['employees', 'attendance', 'payroll', 'advance_overtime_fine', 'settings', 'hold_salary', 'hold_salary_releases'] as $table) {
            $this->db->query("ALTER TABLE {$table} MODIFY user_id INT UNSIGNED NOT NULL");
        }

        $this->db->query("ALTER TABLE users ADD UNIQUE KEY IF NOT EXISTS mobile (mobile)");
        $this->db->query("ALTER TABLE settings DROP INDEX IF EXISTS setting_name");
        $this->db->query("ALTER TABLE settings ADD UNIQUE KEY IF NOT EXISTS user_setting (user_id, setting_name)");
    }

    public function down()
    {
        // Tenant migration is intentionally not reversible because it partitions live business data.
    }
}
