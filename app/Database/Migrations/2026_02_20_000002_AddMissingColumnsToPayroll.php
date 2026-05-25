<?php
/**
 * Migration to add missing updated_at column to payroll table.
 */

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMissingColumnsToPayroll extends Migration
{
    public function up()
    {
        $fields = [
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
                'after' => 'created_at'
            ]
        ];
        $this->forge->addColumn('payroll', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('payroll', 'updated_at');
    }
}
