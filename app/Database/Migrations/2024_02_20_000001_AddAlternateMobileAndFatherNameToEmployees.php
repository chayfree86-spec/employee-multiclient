<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddAlternateMobileAndFatherNameToEmployees extends Migration
{
    public function up()
    {
        $fields = [
            'alternate_mobile' => [
                'type' => 'VARCHAR',
                'constraint' => '15',
                'null' => true,
                'after' => 'mobile'
            ],
            'father_name' => [
                'type' => 'VARCHAR',
                'constraint' => '255',
                'null' => true,
                'after' => 'alternate_mobile'
            ],
        ];
        $this->forge->addColumn('employees', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('employees', ['alternate_mobile', 'father_name']);
    }
}
