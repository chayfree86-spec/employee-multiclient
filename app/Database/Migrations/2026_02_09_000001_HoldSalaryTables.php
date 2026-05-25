<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class HoldSalaryTables extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix ?: '';

        // hold_salary: 10 working days hold for new employees
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}hold_salary` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `initial_hold_days` DECIMAL(5,2) NOT NULL DEFAULT 10,
            `remaining_hold_days` DECIMAL(5,2) NOT NULL DEFAULT 10,
            `daily_rate` DECIMAL(10,2) NOT NULL DEFAULT 0,
            `status` ENUM('active','released') DEFAULT 'active',
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            `updated_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_employee` (`employee_id`),
            KEY `idx_status` (`status`),
            CONSTRAINT `fk_hold_salary_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // hold_salary_releases: audit log of each release (auto or manual)
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}hold_salary_releases` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `hold_salary_id` INT UNSIGNED NOT NULL,
            `payroll_id` INT UNSIGNED NOT NULL,
            `release_type` ENUM('auto','manual') NOT NULL DEFAULT 'auto',
            `days_released` DECIMAL(5,2) NOT NULL DEFAULT 0,
            `amount_released` DECIMAL(10,2) NOT NULL DEFAULT 0,
            `notes` TEXT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_hold_salary` (`hold_salary_id`),
            KEY `idx_payroll` (`payroll_id`),
            CONSTRAINT `fk_release_hold` FOREIGN KEY (`hold_salary_id`) REFERENCES `{$prefix}hold_salary` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT `fk_release_payroll` FOREIGN KEY (`payroll_id`) REFERENCES `{$prefix}payroll` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // Add hold_salary_released to payroll for audit
        if (!$this->db->fieldExists('hold_salary_released', $prefix . 'payroll')) {
            $this->db->query("ALTER TABLE `{$prefix}payroll` ADD COLUMN `hold_salary_released` DECIMAL(10,2) DEFAULT 0 AFTER `advance_deduction`");
        }
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';

        $this->db->query("DROP TABLE IF EXISTS `{$prefix}hold_salary_releases`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}hold_salary`");

        if ($this->db->fieldExists('hold_salary_released', $prefix . 'payroll')) {
            $this->db->query("ALTER TABLE `{$prefix}payroll` DROP COLUMN `hold_salary_released`");
        }
    }
}
