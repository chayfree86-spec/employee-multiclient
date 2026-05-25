<?php

namespace EmployeeApi\Controllers;

use Config\Database;

class DatabaseSetupController extends BaseApiController
{
    public function index()
    {
        $db = Database::connect();
        $forge = \Config\Database::forge();

        // hold_salary table
        if (!$db->tableExists('hold_salary')) {
            $forge->addField([
                'id' => [
                    'type'           => 'INT',
                    'constraint'     => 11,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'employee_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                ],
                'initial_hold_days' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '10,2',
                ],
                'remaining_hold_days' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '10,2',
                ],
                'daily_rate' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '10,2',
                ],
                'payroll_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'total' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '10,2',
                ],
                'status' => [
                    'type'       => 'ENUM',
                    'constraint' => ['active', 'released', 'cancelled'],
                    'default'    => 'active',
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'updated_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);
            $forge->addKey('id', true);
            $forge->createTable('hold_salary');
            echo "Table 'hold_salary' created successfully.<br>";
        } else {
            echo "Table 'hold_salary' already exists.<br>";
        }

        // Add missing columns to payroll table if any
        $payrollFields = $db->getFieldNames('payroll');
        if (!in_array('hold_salary_released', $payrollFields)) {
            $forge->addColumn('payroll', [
                'hold_salary_released' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '10,2',
                    'default'    => 0,
                ],
            ]);
            echo "Column 'hold_salary_released' added to 'payroll' table.<br>";
        }
        if (!in_array('hold_deduction', $payrollFields)) {
            $forge->addColumn('payroll', [
                'hold_deduction' => [
                    'type'       => 'DECIMAL',
                    'constraint' => '10,2',
                    'default'    => 0,
                ],
            ]);
            echo "Column 'hold_deduction' added to 'payroll' table.<br>";
        }

        $employeeFields = $db->getFieldNames('employees');
        if (!in_array('date_of_birth', $employeeFields)) {
            $forge->addColumn('employees', [
                'date_of_birth' => [
                    'type' => 'DATE',
                    'null' => true,
                    'after' => 'father_name',
                ],
            ]);
            echo "Column 'date_of_birth' added to 'employees' table.<br>";
        }

        return "Setup finished.";
    }
}
