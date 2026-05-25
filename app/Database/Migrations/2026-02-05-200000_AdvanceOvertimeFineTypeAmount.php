<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Change advance_overtime_fine to one type + one amount per entry.
 * Each row: type (advance|overtime|fine) and amount. Payroll sums by type for the month.
 */
class AdvanceOvertimeFineTypeAmount extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'advance_overtime_fine';

        if (!$this->db->tableExists($table)) {
            return;
        }

        // Already new structure
        if ($this->db->fieldExists('type', $table)) {
            return;
        }

        // Old structure (advance, overtime, fine) -> convert to type + amount
        if (!$this->db->fieldExists('advance', $table)) {
            return;
        }

        $newTable = $table . '_new';
        $this->db->query("CREATE TABLE `{$newTable}` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `date` DATE NOT NULL,
            `type` ENUM('advance','overtime','fine') NOT NULL,
            `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
            `notes` TEXT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_aof_employee_date` (`employee_id`,`date`),
            CONSTRAINT `fk_aof_employee_new` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        $this->db->query("INSERT INTO `{$newTable}` (employee_id, date, type, amount, notes, created_at)
            SELECT employee_id, date, 'advance', advance, notes, created_at FROM `{$table}` WHERE advance > 0");
        $this->db->query("INSERT INTO `{$newTable}` (employee_id, date, type, amount, notes, created_at)
            SELECT employee_id, date, 'overtime', overtime, notes, created_at FROM `{$table}` WHERE overtime > 0");
        $this->db->query("INSERT INTO `{$newTable}` (employee_id, date, type, amount, notes, created_at)
            SELECT employee_id, date, 'fine', fine, notes, created_at FROM `{$table}` WHERE fine > 0");

        $this->db->query("DROP TABLE `{$table}`");
        $this->db->query("RENAME TABLE `{$newTable}` TO `{$table}`");
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'advance_overtime_fine';
        if (!$this->db->tableExists($table) || !$this->db->fieldExists('type', $table)) {
            return;
        }

        $oldTable = $table . '_old';
        $this->db->query("CREATE TABLE `{$oldTable}` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `employee_id` INT UNSIGNED NOT NULL,
            `date` DATE NOT NULL,
            `advance` DECIMAL(10,2) DEFAULT 0,
            `overtime` DECIMAL(10,2) DEFAULT 0,
            `fine` DECIMAL(10,2) DEFAULT 0,
            `notes` TEXT NULL,
            `created_at` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_aof_employee_date` (`employee_id`,`date`),
            CONSTRAINT `fk_aof_employee_old` FOREIGN KEY (`employee_id`) REFERENCES `{$prefix}employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");

        $this->db->query("INSERT INTO `{$oldTable}` (employee_id, date, advance, overtime, fine, notes, created_at)
            SELECT employee_id, date,
                SUM(CASE WHEN type='advance' THEN amount ELSE 0 END),
                SUM(CASE WHEN type='overtime' THEN amount ELSE 0 END),
                SUM(CASE WHEN type='fine' THEN amount ELSE 0 END),
                MAX(notes), MAX(created_at)
            FROM `{$table}` GROUP BY employee_id, date");

        $this->db->query("DROP TABLE `{$table}`");
        $this->db->query("RENAME TABLE `{$oldTable}` TO `{$table}`");
    }
}
