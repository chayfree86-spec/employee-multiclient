<?php

namespace App\Models;

use CodeIgniter\Model;

class EmployeeModel extends Model
{
    protected $table = 'employees';
    protected $primaryKey = 'id';
    protected $allowedFields = ['name', 'mobile', 'alternate_mobile', 'father_name', 'role', 'monthly_salary', 'status', 'join_date', 'date_of_birth', 'profile_image'];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = '';  // empty = do not set updated_at (table has no updated_at column)

    protected $validationRules = [
        'name' => 'required|min_length[2]|max_length[255]',
        'mobile' => 'permit_empty|numeric|min_length[10]|max_length[15]',
        'alternate_mobile' => 'permit_empty|numeric|min_length[10]|max_length[15]',
        'father_name' => 'permit_empty|min_length[2]|max_length[255]',
        'monthly_salary' => 'required|numeric|greater_than[0]',
        'status' => 'required|in_list[active,inactive]',
        'join_date' => 'required|valid_date[Y-m-d]',
        'date_of_birth' => 'permit_empty|valid_date[Y-m-d]'
    ];

    protected $validationMessages = [
        'name' => [
            'required' => 'Employee name is required',
            'min_length' => 'Employee name must be at least 2 characters',
            'max_length' => 'Employee name cannot exceed 255 characters'
        ],
        'mobile' => [
            'required' => 'Mobile number is required',
            'numeric' => 'Mobile number must be numeric',
            'min_length' => 'Mobile number must be at least 10 digits',
            'max_length' => 'Mobile number cannot exceed 15 digits'
        ],
        'monthly_salary' => [
            'required' => 'Monthly salary is required',
            'numeric' => 'Monthly salary must be numeric',
            'greater_than' => 'Monthly salary must be greater than 0'
        ],
        'status' => [
            'required' => 'Status is required',
            'in_list' => 'Status must be either active or inactive'
        ],
        'join_date' => [
            'required' => 'Join date is required',
            'valid_date' => 'Join date must be a valid date (YYYY-MM-DD)'
        ]
    ];

    public function getActiveEmployees()
    {
        return $this->where('status', 'active')->findAll();
    }

    public function getTotalEmployees()
    {
        return $this->countAllResults();
    }

    public function getTotalActiveEmployees()
    {
        return $this->where('status', 'active')->countAllResults();
    }

    public function getTotalMonthlySalary()
    {
        return $this->selectSum('monthly_salary')->where('status', 'active')->get()->getRow()->monthly_salary ?? 0;
    }

    /**
     * Get validation messages for use in controllers
     * 
     * @return array
     */
    public function getValidationMessages(): array
    {
        return $this->validationMessages;
    }
}
