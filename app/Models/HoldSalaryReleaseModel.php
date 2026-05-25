<?php

namespace App\Models;

use CodeIgniter\Model;

class HoldSalaryReleaseModel extends Model
{
    protected $table = 'hold_salary_releases';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'hold_salary_id', 'payroll_id', 'release_type',
        'days_released', 'amount_released', 'notes', 'created_at'
    ];
    protected $useTimestamps = false;
}
