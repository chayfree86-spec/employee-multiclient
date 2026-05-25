<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class SuperadminModel extends Model
{
    protected $table = 'superadmins';
    protected $primaryKey = 'id';
    protected $allowedFields = ['name', 'mobile', 'password', 'status'];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
}
