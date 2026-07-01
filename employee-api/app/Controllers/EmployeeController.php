<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\EmployeeModel;

class EmployeeController extends BaseApiController
{
    /**
     * Get list of all employees
     */
    public function index()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new EmployeeModel();
        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();

        // Alphabetical staff order everywhere (attendance, staff, salary, reports, profile).
        $employees = $model->where('user_id', $userId)->orderBy('name', 'ASC')->findAll();

        // Only attach the active hold info that the app actually uses from this list
        // (one grouped query, not one per employee). Per-employee attendance / earned
        // salary / advance summaries are intentionally NOT computed here - they were
        // unused by the client and made this endpoint slow. The salary and profile
        // screens fetch those per-staff via the payroll summary endpoint instead.
        $holdMap = $holdModel->getActiveHoldMap(array_map(static fn ($e) => (int)$e['id'], $employees));
        foreach ($employees as &$emp) {
            $hold = $holdMap[(int)$emp['id']] ?? ['total_hold_days' => 0, 'total_hold_amount' => 0];
            $emp['active_hold_days'] = (float)$hold['total_hold_days'];
            $emp['active_hold_amount'] = (float)$hold['total_hold_amount'];
        }
        unset($emp);

        return $this->respondSuccess($employees, 'Employees retrieved successfully');
    }

    /**
     * Get single employee details
     */
    public function show($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new EmployeeModel();
        $employee = $model->where('user_id', $userId)->find($id);

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        $holdInfo = (new \EmployeeApi\Models\HoldSalaryModel())->getTotalHoldForEmployee((int)$id);
        $employee['active_hold_days'] = (float)($holdInfo['total_hold_days'] ?? 0);
        $employee['active_hold_amount'] = (float)($holdInfo['total_hold_amount'] ?? 0);

        return $this->respondSuccess($employee, 'Employee details retrieved');
    }

    /**
     * Create new employee
     * Uses JSON or POST data
     */
    public function create()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new EmployeeModel();
        $this->ensureEmployeeColumns($model);
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data)) {
            return $this->respondError('No data provided');
        }

        $data = $this->normalizeEmployeePayload($data);
        $data['user_id'] = $userId;

        // Remove blank values so empty fields don't get stored
        $data = $this->filterBlankValues($data);

        $duplicate = $this->findDuplicateEmployee($model, $data);
        if ($duplicate) {
            return $this->respondError('Staff already exists with the same name and mobile number', 409, [
                'employee_id' => $duplicate['id'] ?? null,
            ]);
        }

        if ($model->insert($data)) {
            $data['id'] = $model->getInsertID();
            return $this->respondSuccess($data, 'Employee created successfully', 201);
        }

        return $this->respondError('Validation failed', 400, $model->errors());
    }

    /**
     * Update employee details
     */
    public function update($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new EmployeeModel();
        $this->ensureEmployeeColumns($model);
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!$model->where('user_id', $userId)->find($id)) {
            return $this->respondError('Employee not found', 404);
        }

        $data = $this->normalizeEmployeePayload($data);

        // Remove blank values so they don't overwrite existing data
        $data = $this->filterBlankValues($data);

        if (empty($data)) {
            return $this->respondError('No valid data provided');
        }

        $data['user_id'] = $userId;
        $duplicate = $this->findDuplicateEmployee($model, $data, $id);
        unset($data['user_id']);
        if ($duplicate) {
            return $this->respondError('Another staff already exists with the same name and mobile number', 409, [
                'employee_id' => $duplicate['id'] ?? null,
            ]);
        }

        if ($model->update($id, $data)) {
            $data['id'] = $id;
            return $this->respondSuccess($data, 'Employee updated successfully');
        }

        return $this->respondError('Update failed', 400, $model->errors());
    }

    /**
     * Delete employee
     */
    public function delete($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new EmployeeModel();

        if (!$model->where('user_id', $userId)->find($id)) {
            return $this->respondError('Employee not found', 404);
        }

        if ($model->delete($id)) {
            return $this->respondSuccess(null, 'Employee deleted successfully');
        }

        return $this->respondError('Delete failed');
    }

    /**
     * Upload employee profile image
     */
    public function uploadImage($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        if (!$id) return $this->respondError('Employee ID required');

        $model = new EmployeeModel();
        if (!$model->where('user_id', $userId)->find($id)) {
            return $this->respondError('Employee not found', 404);
        }

        $img = $this->request->getFile('profile_image');

        if (!$img || !$img->isValid()) {
            return $this->respondError('Invalid image file', 400);
        }

        $newName = $img->getRandomName();
        $uploadPath = FCPATH . 'uploads/employees';
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        if ($img->move($uploadPath, $newName)) {
            // Save only relative path in DB
            $relativePath = '/uploads/employees/' . $newName;
            
            if ($model->update($id, ['profile_image' => $relativePath])) {
                return $this->respondSuccess(['profile_image' => $relativePath], 'Image uploaded successfully');
            }
        }

        return $this->respondError('Upload failed');
    }

    private function normalizeEmployeePayload(array $data): array
    {
        if (array_key_exists('dob', $data) && !array_key_exists('date_of_birth', $data)) {
            $data['date_of_birth'] = $data['dob'];
        }

        unset($data['dob']);

        return $data;
    }

    private function ensureEmployeeColumns(EmployeeModel $model): void
    {
        if ($model->db->fieldExists('date_of_birth', 'employees')) {
            return;
        }

        $forge = \Config\Database::forge();
        $forge->addColumn('employees', [
            'date_of_birth' => [
                'type' => 'DATE',
                'null' => true,
                'after' => 'father_name',
            ],
        ]);
    }

    private function findDuplicateEmployee(EmployeeModel $model, array $data, $excludeId = null): ?array
    {
        $name = trim((string) ($data['name'] ?? ''));
        $mobile = trim((string) ($data['mobile'] ?? ''));

        if ($name === '' || $mobile === '') {
            return null;
        }

        $matches = $model->where('user_id', $data['user_id'] ?? 0)->where('mobile', $mobile)->findAll();
        foreach ($matches as $employee) {
            if ($excludeId !== null && (string) ($employee['id'] ?? '') === (string) $excludeId) {
                continue;
            }

            if (strcasecmp(trim((string) ($employee['name'] ?? '')), $name) === 0) {
                return $employee;
            }
        }

        return null;
    }
}
