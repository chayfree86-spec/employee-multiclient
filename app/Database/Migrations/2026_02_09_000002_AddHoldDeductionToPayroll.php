<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddHoldDeductionToPayroll extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'payroll';
        if (!$this->db->fieldExists('hold_deduction', $table)) {
            $this->db->query("ALTER TABLE `{$table}` ADD COLUMN `hold_deduction` DECIMAL(10,2) DEFAULT 0 AFTER `hold_salary_released`");
        }
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'payroll';
        if ($this->db->fieldExists('hold_deduction', $table)) {
            $this->db->query("ALTER TABLE `{$table}` DROP COLUMN `hold_deduction`");
        }
    }
}
