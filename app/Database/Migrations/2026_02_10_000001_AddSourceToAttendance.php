<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSourceToAttendance extends Migration
{
    public function up()
    {
        $this->forge->addColumn('attendance', [
            'source' => [
                'type'       => "ENUM('manual','weekend_rule')",
                'null'       => false,
                'default'    => 'manual',
                'after'      => 'status',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('attendance', 'source');
    }
}
