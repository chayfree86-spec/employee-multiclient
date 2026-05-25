<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Creates or updates the default admin user.
 * Default login: username = admin, password = 123456
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! $this->db->tableExists('users')) {
            return;
        }

        $hashedPassword = password_hash('123456', PASSWORD_DEFAULT);
        $now = date('Y-m-d H:i:s');

        $existing = $this->db->table('users')->where('username', 'admin')->get()->getRowArray();
        if ($existing) {
            $this->db->table('users')->where('username', 'admin')->update([
                'password' => $hashedPassword,
                'email' => 'admin@example.com',
                'role' => 'admin',
                'status' => 'active',
                'updated_at' => $now,
            ]);
            return;
        }

        $this->db->table('users')->insert([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => $hashedPassword,
            'role' => 'admin',
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}
