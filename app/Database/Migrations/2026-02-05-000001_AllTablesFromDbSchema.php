<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Creates all tables to match db_schema.sql plus advance_overtime_fine.
 * Uses raw SQL to avoid Forge AUTO_INCREMENT/primary key issues on MySQL.
 */
class AllTablesFromDbSchema extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix;
        $prefix = $prefix ?: '';

        // 1. Employees
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}employees` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL,
            `mobile` VARCHAR(15) NOT NULL,
            `monthly_salary` DECIMAL(10,2) NOT NULL,
            `status` ENUM('active','inactive') DEFAULT 'active',
            `join_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_status` (`status`),
            KEY `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 2. Attendance
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}attendance` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `date` DATE NOT NULL,
            `status` ENUM('present','absent','half_day','holiday') NOT NULL,
            `check_in` TIME NULL DEFAULT NULL,
            `check_out` TIME NULL DEFAULT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
            KEY `idx_status` (`status`),
            CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 3. Advances
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}advances` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `amount` DECIMAL(10,2) NOT NULL,
            `reason` TEXT NULL,
            `date` DATE NOT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_advances_employee_date` (`employee_id`,`date`),
            CONSTRAINT `fk_advances_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 4. Payroll
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}payroll` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `month` INT NOT NULL,
            `year` INT NOT NULL,
            `total_days` INT NOT NULL,
            `present_days` INT NOT NULL,
            `half_days` INT NOT NULL,
            `absent_days` INT NOT NULL,
            `base_salary` DECIMAL(10,2) NOT NULL,
            `overtime` DECIMAL(10,2) DEFAULT 0,
            `fine` DECIMAL(10,2) DEFAULT 0,
            `advance_deduction` DECIMAL(10,2) DEFAULT 0,
            `total_salary` DECIMAL(10,2) NOT NULL,
            `paid` TINYINT(1) DEFAULT 0,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `unique_employee_month_year` (`employee_id`,`month`,`year`),
            KEY `idx_paid` (`paid`),
            CONSTRAINT `fk_payroll_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 5. Payments
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}payments` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `payroll_id` INT UNSIGNED NOT NULL,
            `amount` DECIMAL(10,2) NOT NULL,
            `payment_date` DATE NOT NULL,
            `method` VARCHAR(50) NULL DEFAULT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_payroll_date` (`payroll_id`,`payment_date`),
            CONSTRAINT `fk_payments_payroll` FOREIGN KEY (`payroll_id`) REFERENCES `{$prefix}payroll` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 6. Advance, Overtime & Fine (one type + one amount per entry; payroll sums by type per month)
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}advance_overtime_fine` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `date` DATE NOT NULL,
            `type` ENUM('advance','overtime','fine') NOT NULL,
            `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
            `notes` TEXT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_aof_employee_date` (`employee_id`,`date`),
            CONSTRAINT `fk_aof_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 7. Users
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}users` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `username` VARCHAR(50) NOT NULL,
            `email` VARCHAR(100) NOT NULL,
            `password` VARCHAR(255) NOT NULL,
            `role` ENUM('admin','user') DEFAULT 'user',
            `status` ENUM('active','inactive') DEFAULT 'active',
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            `updated_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `username` (`username`),
            UNIQUE KEY `email` (`email`),
            KEY `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        // 8. CI Sessions
        $this->db->query("CREATE TABLE IF NOT EXISTS `{$prefix}ci_sessions` (
            `id` VARCHAR(128) NOT NULL,
            `ip_address` VARCHAR(45) NOT NULL,
            `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `data` BLOB NOT NULL,
            PRIMARY KEY (`id`),
            KEY `ci_sessions_timestamp` (`timestamp`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';

        $this->db->query('SET FOREIGN_KEY_CHECKS = 0');
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}ci_sessions`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}users`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}advance_overtime_fine`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}payments`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}payroll`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}advances`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}attendance`");
        $this->db->query("DROP TABLE IF EXISTS `{$prefix}employees`");
        $this->db->query('SET FOREIGN_KEY_CHECKS = 1');
    }
}
