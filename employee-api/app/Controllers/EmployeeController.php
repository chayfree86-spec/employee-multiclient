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
        $model = new EmployeeModel();
        $attendanceModel = new \EmployeeApi\Models\AttendanceModel();
        $payrollModel = new \EmployeeApi\Models\PayrollModel();
        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();
        
        $employees = $model->findAll();
        
        $month = (int) date('n');
        $year = (int) date('Y');
        $today = date('Y-m-d');
        $settingsModel = new \EmployeeApi\Models\SettingsModel();
        $daysDivisor = $settingsModel->getDaysDivisor($month, $year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');

        foreach ($employees as &$emp) {
            $summary = $attendanceModel->getAttendanceSummaryEnriched((int)$emp['id'], $month, $year, $today, $emp['join_date']);

            $present = 0;
            $weekend = 0;
            $holiday = 0;
            $halfDay = 0;
            $absent = 0;

            foreach ($summary as $s) {
                switch ($s['status']) {
                    case 'present': $present = (int)$s['count']; break;
                    case 'half_day': $halfDay = (int)$s['count']; break;
                    case 'weekend': $weekend = (int)$s['count']; break;
                    case 'holiday': $holiday = (int)$s['count']; break;
                    case 'absent': $absent = (int)$s['count']; break;
                }
            }

            // Total Days = Present + Weekend + Holiday + (Half Day * 0.5)
            $totalDaysForSal = $present + $weekend + $holiday + ($halfDay * 0.5);
            $emp['total_present_days'] = round($totalDaysForSal, 1);
            $emp['weekend_count'] = $weekend;
            $emp['holiday_count'] = $holiday;
            $emp['present_only_count'] = $present;

            // Calculate earned salary so far (based on settings-driven day divisor)
            $monthlySalary = (float)($emp['monthly_salary'] ?? 0);
            $dailySalary = $monthlySalary / $daysDivisor;

            if ($payrollMode === 'monthly') {
                $weekdayStatus = $attendanceModel->getWeekdayAttendanceStatus((int)$emp['id'], $month, $year, $today, $emp['join_date']);
                $weekendAbsent = $weekdayStatus['weekend_absent_count'] ?? 0;
                $baseEarned = $monthlySalary - ($absent * $dailySalary) - ($halfDay * $dailySalary * 0.5) - ($weekendAbsent * $dailySalary);
            } else {
                $baseEarned = $totalDaysForSal * $dailySalary;
            }
            
            // Subtract monthly adjustments (fines, deductions)
            $aofModel = new \EmployeeApi\Models\AdvanceOvertimeFineModel();
            $sums = $aofModel->getSumsForEmployeeMonth((int)$emp['id'], $month, $year);
            $emp['earned_salary'] = round($baseEarned - ($sums['fine'] ?? 0) - ($sums['deduction'] ?? 0), 0);
            
            // Get pending advance
            $advanceInfo = $payrollModel->getPendingAdvanceForEmployee((int)$emp['id']);
            $emp['pending_advance'] = (float)$advanceInfo['remaining'];

            $holdInfo = $holdModel->getTotalHoldForEmployee((int)$emp['id']);
            $emp['active_hold_days'] = (float)($holdInfo['total_hold_days'] ?? 0);
            $emp['active_hold_amount'] = (float)($holdInfo['total_hold_amount'] ?? 0);
        }
        
        return $this->respondSuccess($employees, 'Employees retrieved successfully');
    }

    /**
     * Get single employee details
     */
    public function show($id = null)
    {
        $model = new EmployeeModel();
        $employee = $model->find($id);

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
        $model = new EmployeeModel();
        $this->ensureEmployeeColumns($model);
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        if (empty($data)) {
            return $this->respondError('No data provided');
        }

        $data = $this->normalizeEmployeePayload($data);

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
        $model = new EmployeeModel();
        $this->ensureEmployeeColumns($model);
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!$model->find($id)) {
            return $this->respondError('Employee not found', 404);
        }

        $data = $this->normalizeEmployeePayload($data);

        // Remove blank values so they don't overwrite existing data
        $data = $this->filterBlankValues($data);

        if (empty($data)) {
            return $this->respondError('No valid data provided');
        }

        $duplicate = $this->findDuplicateEmployee($model, $data, $id);
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
        $model = new EmployeeModel();

        if (!$model->find($id)) {
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
        if (!$id) return $this->respondError('Employee ID required');

        $model = new EmployeeModel();
        if (!$model->find($id)) {
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

        $matches = $model->where('mobile', $mobile)->findAll();
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
