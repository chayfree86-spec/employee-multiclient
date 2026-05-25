<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDateOfBirthToEmployees extends Migration
{
    public function up(): void
    {
        if ($this->db->fieldExists('date_of_birth', 'employees')) {
            return;
        }

        $this->forge->addColumn('employees', [
            'date_of_birth' => [
                'type' => 'DATE',
                'null' => true,
                'after' => 'father_name',
            ],
        ]);
    }

    public function down(): void
    {
        if (!$this->db->fieldExists('date_of_birth', 'employees')) {
            return;
        }

        $this->forge->dropColumn('employees', 'date_of_birth');
    }
}
