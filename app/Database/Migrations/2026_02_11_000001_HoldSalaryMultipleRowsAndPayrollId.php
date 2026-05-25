<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class HoldSalaryMultipleRowsAndPayrollId extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'hold_salary';

        if (!$this->db->tableExists($table)) {
            return;
        }
        // Drop unique constraint on employee_id so multiple hold rows per employee are allowed
        $dbName = $this->db->database;
        $result = $this->db->query("
            SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'employee_id' AND NON_UNIQUE = 0
            LIMIT 1
        ", [$dbName, $table])->getRow();
        if ($result && !empty($result->INDEX_NAME)) {
            $idxName = $result->INDEX_NAME;
            $this->db->query("ALTER TABLE `{$table}` DROP INDEX `{$idxName}`");
        } else {
            // Fallback: try known name from original migration
            try {
                $this->db->query("ALTER TABLE `{$table}` DROP INDEX `unique_employee`");
            } catch (\Throwable $e) {
                // Ignore if index already removed
            }
        }
        if (!$this->db->fieldExists('payroll_id', $table)) {
            $this->db->query("ALTER TABLE `{$table}` ADD COLUMN `payroll_id` INT UNSIGNED NULL DEFAULT NULL AFTER `daily_rate`, ADD KEY `idx_payroll_id` (`payroll_id`)");
        }
        if (!$this->db->fieldExists('total', $table)) {
            $this->db->query("ALTER TABLE `{$table}` ADD COLUMN `total` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `payroll_id`");
        }
        // Backfill total for existing rows where total is 0
        $this->db->query("UPDATE `{$table}` SET `total` = ROUND(remaining_hold_days * daily_rate, 2) WHERE `total` = 0");
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'hold_salary';
        if (!$this->db->tableExists($table)) {
            return;
        }
        if ($this->db->fieldExists('total', $table)) {
            $this->db->query("ALTER TABLE `{$table}` DROP COLUMN `total`");
        }
        if ($this->db->fieldExists('payroll_id', $table)) {
            $this->db->query("ALTER TABLE `{$table}` DROP COLUMN `payroll_id`");
        }
    }
}
