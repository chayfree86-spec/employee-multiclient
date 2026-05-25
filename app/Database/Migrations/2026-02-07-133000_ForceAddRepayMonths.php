<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ForceAddRepayMonths extends Migration
{
    public function up()
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table = $prefix . 'advance_overtime_fine';

        if (!$this->db->fieldExists('repay_months', $table)) {
            $this->forge->addColumn($table, [
                'repay_months' => [
                    'type' => 'TINYINT',
                    'constraint' => 1, // Actually tinyint unsigned
                    'unsigned' => true,
                    'null' => false,
                    'default' => 1,
                    'after' => 'amount',
                ],
            ]);
        }
    }

    public function down()
    {
    // Do nothing to avoid cascading issues if we roll back
    }
}
