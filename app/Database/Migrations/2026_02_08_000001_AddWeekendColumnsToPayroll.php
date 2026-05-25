<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddWeekendColumnsToPayroll extends Migration
{
    public function up()
    {
        $this->forge->addColumn('payroll', [
            'weekend_holiday_days' => [
                'type'       => 'INT',
                'null'       => true,
                'default'    => 0,
                'after'      => 'absent_days',
            ],
            'weekend_absent_days' => [
                'type'       => 'INT',
                'null'       => true,
                'default'    => 0,
                'after'      => 'weekend_holiday_days',
            ],
            'weekend_holiday_amount' => [
                'type'       => 'DECIMAL(10,2)',
                'null'       => true,
                'default'    => 0,
                'after'      => 'weekend_absent_days',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('payroll', ['weekend_holiday_days', 'weekend_absent_days', 'weekend_holiday_amount']);
    }
}
