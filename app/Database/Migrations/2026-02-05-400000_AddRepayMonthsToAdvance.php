<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Add repay_months to advance_overtime_fine for type='advance'.
 * Advance amount is repaid over N months: amount/N per month.
 * Default 1 = full deduction in advance month (backward compatible).
 */
class AddRepayMonthsToAdvance extends Migration
{
    public function up(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'advance_overtime_fine';
        if (!$this->db->tableExists($table) || $this->db->fieldExists('repay_months', $table)) {
            return;
        }
        $this->db->query("ALTER TABLE `{$table}` ADD COLUMN `repay_months` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `amount`");
    }

    public function down(): void
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'advance_overtime_fine';
        if ($this->db->fieldExists('repay_months', $table)) {
            $this->db->query("ALTER TABLE `{$table}` DROP COLUMN `repay_months`");
        }
    }
}
