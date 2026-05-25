<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDaysDivisorToPayroll extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('payroll', [
            'days_divisor' => [
                'type'    => 'INT',
                'null'    => false,
                'default' => 30,
                'after'   => 'total_days',
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('payroll', 'days_divisor');
    }
}
