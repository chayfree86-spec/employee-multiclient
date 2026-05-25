<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Drop unique constraint on hold_salary.employee_id so multiple hold rows per employee are allowed.
 * The unique index is used by FK fk_hold_salary_employee, so we drop FK first, then index, then re-add FK with a non-unique index.
 */
class DropHoldSalaryUniqueEmployee extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'hold_salary';
        $employeesTable = $prefix . 'employees';

        if (!$this->db->tableExists($table)) {
            return;
        }

        $dbName = $this->db->database;

        // 1. Drop foreign key that uses the unique index (required before dropping index)
        $fk = $this->db->query("
            SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_hold_salary_employee'
        ", [$dbName, $table])->getRow();
        if ($fk) {
            $this->db->query("ALTER TABLE `{$table}` DROP FOREIGN KEY `fk_hold_salary_employee`");
        }

        // 2. Drop the unique index
        $idx = $this->db->query("
            SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = 'unique_employee' LIMIT 1
        ", [$dbName, $table])->getRow();
        if ($idx) {
            $this->db->query("ALTER TABLE `{$table}` DROP INDEX `unique_employee`");
        }

        // 3. Add non-unique index on employee_id if not present
        $idxEmp = $this->db->query("
            SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = 'idx_employee_id' LIMIT 1
        ", [$dbName, $table])->getRow();
        if (!$idxEmp) {
            $this->db->query("ALTER TABLE `{$table}` ADD KEY `idx_employee_id` (`employee_id`)");
        }

        // 4. Re-add foreign key if not present
        $fk2 = $this->db->query("
            SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'fk_hold_salary_employee'
        ", [$dbName, $table])->getRow();
        if (!$fk2) {
            $this->db->query("ALTER TABLE `{$table}` ADD CONSTRAINT `fk_hold_salary_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$employeesTable}` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");
        }
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'hold_salary';
        $employeesTable = $prefix . 'employees';
        if (!$this->db->tableExists($table)) {
            return;
        }
        $this->db->query("ALTER TABLE `{$table}` DROP FOREIGN KEY `fk_hold_salary_employee`");
        $this->db->query("ALTER TABLE `{$table}` DROP INDEX `idx_employee_id`");
        $this->db->query("ALTER TABLE `{$table}` ADD UNIQUE KEY `unique_employee` (`employee_id`)");
        $this->db->query("ALTER TABLE `{$table}` ADD CONSTRAINT `fk_hold_salary_employee` FOREIGN KEY (`employee_id`) REFERENCES `{$employeesTable}` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");
    }
}
