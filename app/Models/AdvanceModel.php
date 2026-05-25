<?php

namespace App\Models;

use CodeIgniter\Model;

class AdvanceModel extends Model
{
    protected $table = 'advances';
    protected $primaryKey = 'id';
    protected $allowedFields = ['employee_id', 'amount', 'reason', 'date'];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = '';

    protected $validationRules = [
        'employee_id' => 'required|integer|is_not_unique[employees.id]',
        'amount' => 'required|numeric|greater_than[0]',
        'reason' => 'permit_empty|max_length[500]',
        'date' => 'required|valid_date[Y-m-d]'
    ];

    protected $validationMessages = [
        'employee_id' => [
            'required' => 'Employee ID is required',
            'integer' => 'Employee ID must be an integer',
            'is_not_unique' => 'Invalid employee ID'
        ],
        'amount' => [
            'required' => 'Amount is required',
            'numeric' => 'Amount must be numeric',
            'greater_than' => 'Amount must be greater than 0'
        ],
        'reason' => [
            'max_length' => 'Reason cannot exceed 500 characters'
        ],
        'date' => [
            'required' => 'Date is required',
            'valid_date' => 'Invalid date format'
        ]
    ];

    public function getAdvancesByEmployee($employeeId)
    {
        return $this->where('employee_id', $employeeId)
                   ->orderBy('date', 'DESC')
                   ->findAll();
    }

    public function getTotalAdvancesByEmployee($employeeId)
    {
        return $this->selectSum('amount')
                   ->where('employee_id', $employeeId)
                   ->get()
                   ->getRow()
                   ->amount ?? 0;
    }

    public function getTotalAdvances()
    {
        return $this->selectSum('amount')
                   ->get()
                   ->getRow()
                   ->amount ?? 0;
    }

    public function getAdvancesByDateRange($startDate, $endDate)
    {
        return $this->where('date >=', $startDate)
                   ->where('date <=', $endDate)
                   ->orderBy('date', 'DESC')
                   ->findAll();
    }
}