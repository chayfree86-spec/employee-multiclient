<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class EmployeeModel extends Model
{
    protected $table = 'employees';
    protected $primaryKey = 'id';
    protected $allowedFields = ['name', 'mobile', 'alternate_mobile', 'father_name', 'role', 'monthly_salary', 'status', 'join_date', 'date_of_birth', 'profile_image'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    protected $beforeInsert = ['roundSalary'];
    protected $beforeUpdate = ['roundSalary'];

    protected function roundSalary(array $data)
    {
        if (isset($data['data']['monthly_salary'])) {
            $data['data']['monthly_salary'] = (float) round($data['data']['monthly_salary'], 0);
        }
        return $data;
    }

    public function getActiveEmployees()
    {
        return $this->where('status', 'active')->findAll();
    }

    public function getTotalActiveEmployees()
    {
        return $this->where('status', 'active')->countAllResults();
    }

    public function getTotalDeactiveEmployees()
    {
        return $this->whereIn('status', ['deactive', 'inactive'])->countAllResults();
    }

    public function getTotalSalarySum()
    {
        $row = $this->selectSum('monthly_salary')->where('status', 'active')->first();
        return (float)($row['monthly_salary'] ?? 0);
    }
}
