<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AdvanceOvertimeFineAndPayrollRename extends Migration
{
    public function up(): void
    {
        // Table: advance_overtime_fine (only if not already created by 000001) — one type + one amount per entry
        $prefix = $this->db->DBPrefix ?: '';
        if (!$this->db->tableExists('advance_overtime_fine')) {
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
        }

        // Rename payroll.loan_deduction to advance_deduction (for DBs created from db_schema with loan_deduction)
        if ($this->db->fieldExists('loan_deduction', 'payroll')) {
            $this->forge->modifyColumn('payroll', [
                'loan_deduction' => [
                    'name' => 'advance_deduction',
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0,
                ],
            ]);
        }
    }

    public function down(): void
    {
        $this->forge->dropTable('advance_overtime_fine', true);
        if ($this->db->fieldExists('advance_deduction', 'payroll')) {
            $this->forge->modifyColumn('payroll', [
                'advance_deduction' => [
                    'name' => 'loan_deduction',
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0,
                ],
            ]);
        }
    }
}
