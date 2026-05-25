<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddJoinDateToEmployees extends Migration
{
    public function up()
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table  = $prefix . 'employees';

        if (!$this->db->fieldExists('join_date', $table)) {
            $this->db->query("ALTER TABLE `{$table}` ADD COLUMN `join_date` DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER `status`");
        }
    }

    public function down()
    {
        $prefix = $this->db->DBPrefix ?: '';
        $table  = $prefix . 'employees';

        if ($this->db->fieldExists('join_date', $table)) {
            $this->db->query("ALTER TABLE `{$table}` DROP COLUMN `join_date`");
        }
    }
}
