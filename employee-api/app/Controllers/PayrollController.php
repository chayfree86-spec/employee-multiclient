<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\PayrollModel;

class PayrollController extends BaseApiController
{
    /**
     * Get payroll list for a month
     */
    public function index()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new PayrollModel();
        $employeeId = $this->request->getGet('employee_id');
        $month = $this->request->getGet('month');
        $year = $this->request->getGet('year');
        
        $builder = $model->builder();
        $profileImageSelect = $model->db->fieldExists('profile_image', 'employees')
            ? 'employees.profile_image'
            : 'NULL as profile_image';
        $builder->select('payroll.*, employees.name as employee_name, employees.mobile as employee_mobile, ' . $profileImageSelect);
        $builder->join('employees', 'employees.id = payroll.employee_id');
        $builder->where('payroll.user_id', $userId);
        $builder->where('employees.user_id', $userId);

        if ($employeeId && $employeeId != -1) {
            $builder->where('payroll.employee_id', $employeeId);
        }
        if ($month) {
            $builder->where('payroll.month', $month);
        }
        if ($year) {
            $builder->where('payroll.year', $year);
        }

        $payroll = $builder->orderBy('payroll.id', 'DESC')->get()->getResultArray();
        
        // Enrich with attendance object for frontend compatibility
        foreach ($payroll as &$p) {
            $p['net_payable'] = (float)$p['total_salary'];
            $p['status'] = !empty($p['id']) ? 'Generated' : 'Pending';
            $p['attendance'] = [
                'present' => (int)$p['present_days'],
                'absent' => (int)$p['absent_days'],
                'half_day' => (int)$p['half_days'],
                'total_days' => (int)$p['total_days']
            ];
        }

        return $this->respondSuccess($payroll, "Payroll retrieved");
    }

    /**
     * Get specific salary slip data
     */
    public function show($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new PayrollModel();
        $slip = $model->where('user_id', $userId)->find($id);

        if (!$slip) {
            return $this->respondError('Payroll record not found', 404);
        }

        return $this->respondSuccess($slip, 'Salary slip details retrieved');
    }

    /**
     * Preview salary generation (summarize earnings and available advance)
     */
    public function summary()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $employeeId = $this->request->getGet('employee_id');
        $month = $this->request->getGet('month') ?? date('m');
        $year = $this->request->getGet('year') ?? date('Y');
        $requestedAdvanceDeduction = (float)($this->request->getGet('advance_deduction') ?? 0);
        $releaseHoldRequested = filter_var($this->request->getGet('release_hold') ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$employeeId) {
            return $this->respondError('Employee ID is required');
        }
        if (!$this->employeeBelongsToUser((int) $employeeId, $userId)) {
            return $this->respondError('Employee not found', 404);
        }

        $model = new PayrollModel();
        
        // Check if payroll already exists
        $existing = $model->where('user_id', $userId)->where('employee_id', $employeeId)->where('month', $month)->where('year', $year)->first();
        
        $aofModel = new \EmployeeApi\Models\AdvanceOvertimeFineModel();
        $sums = $aofModel->getSumsForEmployeeMonth((int)$employeeId, (int)$month, (int)$year);
        $employeeModel = new \EmployeeApi\Models\EmployeeModel();
        $employee = $employeeModel->where('user_id', $userId)->find((int)$employeeId);
        
        // Get estimated earnings from calculateSalary
        $estimated = $model->calculateSalary($employeeId, $month, $year, $sums['overtime'], $sums['fine'], 0, $sums['deduction']);
        if (!$estimated) {
            return $this->respondError('Unable to calculate salary preview');
        }
        
        // Get available advance
        $advanceInfo = $model->getPendingAdvanceForEmployee((int)$employeeId);

        // Get hold salary info
        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();
        $holdInfo = $holdModel->getTotalHoldForEmployee((int)$employeeId);
        // Hold is deducted only once - in the month it was created. Later months keep
        // showing it as a standing liability (hold_info) but never deduct it again.
        $holdCreatedThisMonth = $holdModel->getHoldCreatedInMonth((int)$employeeId, (int)$month, (int)$year);

        $settingsModel = new \EmployeeApi\Models\SettingsModel();
        $daysDivisor = $settingsModel->getDaysDivisor((int)$month, (int)$year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        $attendanceModel = new \EmployeeApi\Models\AttendanceModel();
        $rawAttendance = $attendanceModel->getMonthlyAttendanceEnriched((int)$employeeId, (int)$month, (int)$year, $employee['join_date'] ?? null);
        $presentDays = 0.0;
        $halfDays = 0.0;
        $absentDays = 0.0;
        $holidayDays = 0.0;

        foreach ($rawAttendance as $row) {
            $status = $row['status'] ?? '';
            if ($status === 'present') {
                $presentDays++;
            } elseif ($status === 'half_day' || $status === 'halfday') {
                $halfDays++;
            } elseif ($status === 'absent') {
                $absentDays++;
            } elseif ($status === 'holiday' || $status === 'weekend') {
                $holidayDays++;
            }
        }

        $workingDays = $presentDays + ($halfDays * 0.5) + $holidayDays;
        $baseSalary = (float)($employee['monthly_salary'] ?? $estimated['base_salary'] ?? 0);
        $dailyRate = $daysDivisor > 0 ? ($baseSalary / $daysDivisor) : 0;
        // Attendance-based earnings: Present + Holiday + Weekly-off + (Half x 0.5) are paid.
        // Holiday & weekly-off count as paid working days; Absent and unmarked days are not.
        // Monthly mode is capped at the full monthly salary (so a 31-day month never exceeds base).
        $attendanceEarned = round($dailyRate * $workingDays, 0);
        $earnedSalary = $payrollMode === 'monthly'
            ? max(0, min($baseSalary, $attendanceEarned))
            : $attendanceEarned;
        $holdDeduction = $releaseHoldRequested ? 0.0 : round((float)($holdCreatedThisMonth['total_hold_amount'] ?? 0), 0);
        $holdRelease = $releaseHoldRequested ? round((float)($holdInfo['total_hold_amount'] ?? 0), 0) : 0.0;

        $beforeAdvance = max(0, round($earnedSalary + (float)$sums['overtime'] - (float)$sums['fine'] - (float)$sums['deduction'] - $holdDeduction + $holdRelease, 0));
        $selectedAdvanceDeduction = min(
            max(0, round($requestedAdvanceDeduction, 0)),
            (float)$advanceInfo['remaining'],
            (float)$beforeAdvance
        );
        $finalSalary = max(0, round($beforeAdvance - $selectedAdvanceDeduction, 0));
        $deductionEntries = $aofModel->select('id, date, type, amount, notes')
            ->where('employee_id', (int)$employeeId)
            ->where('user_id', $userId)
            ->whereIn('type', [
                \EmployeeApi\Models\AdvanceOvertimeFineModel::TYPE_FINE,
                \EmployeeApi\Models\AdvanceOvertimeFineModel::TYPE_DEDUCTION,
            ])
            ->where('MONTH(date)', (int)$month)
            ->where('YEAR(date)', (int)$year)
            ->orderBy('date', 'ASC')
            ->findAll();

        $generatedPreview = null;
        if ($existing) {
            $existingPresent = (float)($existing['present_days'] ?? 0);
            $existingHalf = (float)($existing['half_days'] ?? 0);
            $existingAbsent = (float)($existing['absent_days'] ?? 0);
            $existingHoliday = (float)($existing['weekend_holiday_days'] ?? 0);
            $existingWorkingDays = $existingPresent + ($existingHalf * 0.5) + $existingHoliday;
            $existingEarnedSalary = max(0, round(
                (float)($existing['total_salary'] ?? 0)
                - (float)($existing['overtime'] ?? 0)
                + (float)($existing['fine'] ?? 0)
                + (float)($existing['deduction'] ?? 0)
                + (float)($existing['advance_deduction'] ?? 0)
                + (float)($existing['hold_deduction'] ?? 0)
                - (float)($existing['hold_salary_released'] ?? 0),
                0
            ));
            $generatedBeforeAdvance = max(0, round((float)($existing['total_salary'] ?? 0) + (float)($existing['advance_deduction'] ?? 0), 0));

            $generatedPreview = [
                'id' => (int)($existing['id'] ?? 0),
                'attendance' => [
                    'present' => $existingPresent,
                    'half' => $existingHalf,
                    'absent' => $existingAbsent,
                    'holiday' => $existingHoliday,
                    'working_days' => $existingWorkingDays,
                ],
                'earned_salary' => $existingEarnedSalary,
                'base_salary' => (float)($existing['base_salary'] ?? 0),
                'days_divisor' => (float)($existing['days_divisor'] ?? $daysDivisor),
                'overtime' => (float)($existing['overtime'] ?? 0),
                'payment_deduction' => (float)($existing['fine'] ?? 0) + (float)($existing['deduction'] ?? 0),
                'fine' => (float)($existing['fine'] ?? 0),
                'deduction' => (float)($existing['deduction'] ?? 0),
                'advance_deduction' => (float)($existing['advance_deduction'] ?? 0),
                'hold_deduction' => (float)($existing['hold_deduction'] ?? 0),
                'hold_release' => (float)($existing['hold_salary_released'] ?? 0),
                'before_advance' => $generatedBeforeAdvance,
                'final_salary' => (float)($existing['total_salary'] ?? 0),
                'deduction_entries' => array_map(static function ($row) {
                    return [
                        'id' => (int)($row['id'] ?? 0),
                        'date' => $row['date'] ?? null,
                        'type' => $row['type'] ?? '',
                        'amount' => (float)($row['amount'] ?? 0),
                        'notes' => $row['notes'] ?? '',
                    ];
                }, $deductionEntries),
            ];
        }

        return $this->respondSuccess([
            'estimated_earnings' => $beforeAdvance,
            'available_advance' => (float)$advanceInfo['remaining'],
            'is_already_generated' => $existing ? true : false,
            'existing_payroll_id' => $existing ? $existing['id'] : null,
            'employee' => [
                'id' => (int)($employee['id'] ?? 0),
                'name' => $employee['name'] ?? '',
                'role' => $employee['role'] ?? '',
                'mobile' => $employee['mobile'] ?? '',
                'monthly_salary' => (float)($employee['monthly_salary'] ?? 0),
            ],
            'details' => $estimated,
            'hold_info' => $holdInfo,
            'preview' => [
                'attendance' => [
                    'present' => $presentDays,
                    'half' => $halfDays,
                    'absent' => $absentDays,
                    'holiday' => $holidayDays,
                    'working_days' => $workingDays,
                ],
                'earned_salary' => $earnedSalary,
                'overtime' => (float)$sums['overtime'],
                'payment_deduction' => (float)$sums['fine'] + (float)$sums['deduction'],
                'fine' => (float)$sums['fine'],
                'deduction' => (float)$sums['deduction'],
                'advance_deduction' => $selectedAdvanceDeduction,
                'hold_deduction' => $holdDeduction,
                'hold_release' => $holdRelease,
                'before_advance' => $beforeAdvance,
                'final_without_advance' => $beforeAdvance,
                'final_salary' => $finalSalary,
                'deduction_entries' => array_map(static function ($row) {
                    return [
                        'id' => (int)($row['id'] ?? 0),
                        'date' => $row['date'] ?? null,
                        'type' => $row['type'] ?? '',
                        'amount' => (float)($row['amount'] ?? 0),
                        'notes' => $row['notes'] ?? '',
                    ];
                }, $deductionEntries),
            ],
            'generated' => $generatedPreview,
        ], 'Salary summary retrieved');
    }

    /**
     * Generate payroll with optional deduction
     */
    public function generate()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $data = $this->request->getJSON(true);
        $employeeId = $data['employee_id'] ?? null;
        $month = $data['month'] ?? date('n');
        $year = $data['year'] ?? date('Y');
        $advanceDeduction = (float)($data['advance_deduction'] ?? 0);
        $releaseHold = (bool)($data['release_hold'] ?? false);

        $model = new PayrollModel();
        $employeeModel = new \EmployeeApi\Models\EmployeeModel();
        $aofModel = new \EmployeeApi\Models\AdvanceOvertimeFineModel();
        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();

        // Check if we are doing bulk generation
        $employeesToProcess = [];
        if (!$employeeId || $employeeId == -1) {
            $employeesToProcess = $employeeModel->where('user_id', $userId)->where('status', 'active')->findAll();
        } else {
            $emp = $employeeModel->where('user_id', $userId)->find($employeeId);
            if ($emp) {
                $employeesToProcess[] = $emp;
            }
        }

        if (empty($employeesToProcess)) {
            return $this->respondError('No active employees found to process');
        }

        $countGenerated = 0;
        $countSkipped = 0;
        $errors = [];

        $settingsModel = new \EmployeeApi\Models\SettingsModel();
        $daysDivisor = $settingsModel->getDaysDivisor((int)$month, (int)$year);

        foreach ($employeesToProcess as $emp) {
            $currEmpId = $emp['id'];
            
            // Check if already exists
            $existing = $model->where('user_id', $userId)->where('employee_id', $currEmpId)->where('month', $month)->where('year', $year)->first();
            if ($existing) {
                $countSkipped++;
                continue;
            }

            $empSums = $aofModel->getSumsForEmployeeMonth((int)$currEmpId, (int)$month, (int)$year);

            $payrollData = $model->calculateSalary($currEmpId, $month, $year, $empSums['overtime'], $empSums['fine'], 0, $empSums['deduction']);
            
            if (!$payrollData) {
                $errors[] = "Failed to calculate for employee ID: $currEmpId";
                continue;
            }

            // Hold salary logic - deduct the hold only in the month it was created
            // (one-time, e.g. first salary after joining), not every month.
            $activeHoldInfo = $holdModel->getTotalHoldForEmployee((int)$currEmpId);
            $holdCreatedThisMonth = $holdModel->getHoldCreatedInMonth((int)$currEmpId, (int)$month, (int)$year);
            $holdAmount = $releaseHold ? 0.0 : round((float)($holdCreatedThisMonth['total_hold_amount'] ?? 0), 0);
            $releasedAmount = 0.0;
            if ($releaseHold && (float)($activeHoldInfo['total_hold_days'] ?? 0) > 0) {
                $releasedAmount = $holdModel->releaseHold((int)$currEmpId, (float)$activeHoldInfo['total_hold_days']);
            }
            
            $payrollData['hold_deduction'] = $holdAmount;
            $payrollData['hold_salary_released'] = $releasedAmount;
            $beforeAdvance = max(0, round($payrollData['total_salary'] - $holdAmount + $releasedAmount, 0));
            $pendingAdvance = $model->getPendingAdvanceForEmployee((int)$currEmpId);
            $requestedDeduction = ($employeeId && $employeeId != -1) ? $advanceDeduction : 0;
            $deductionToUse = min(
                max(0, round((float)$requestedDeduction, 0)),
                (float)($pendingAdvance['remaining'] ?? 0),
                (float)$beforeAdvance
            );
            $payrollData['advance_deduction'] = $deductionToUse;
            $payrollData['total_salary'] = max(0, round($beforeAdvance - $deductionToUse, 0));
            $payrollData['paid'] = 1;
            $payrollData['user_id'] = $userId;
            
            // Insert
            $payrollId = $model->insert($payrollData);
            if ($payrollId) {
                $countGenerated++;
                // Record advance payment if applied
                if ($deductionToUse > 0) {
                    $aofModel->insert([
                        'user_id' => $userId,
                        'employee_id' => $currEmpId,
                        'date' => $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-01',
                        'type' => 'advance_paid',
                        'amount' => $deductionToUse,
                        'repay_months' => 1,
                        'notes' => 'payroll_id:' . $payrollId,
                    ]);
                }
            } else {
                $errors[] = "Failed to insert for employee ID: $currEmpId";
            }
        }

        $message = "Generation complete. $countGenerated generated, $countSkipped skipped (already existed).";
        if (!empty($errors)) {
            $message .= " Encounered " . count($errors) . " errors.";
        }

        return $this->respondSuccess([
            'generated' => $countGenerated,
            'skipped' => $countSkipped,
            'errors' => $errors
        ], $message);
    }

    /**
     * Delete a payroll record
     */
    public function delete($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $id = (int)$id;
        $model = new PayrollModel();
        $aofModel = new \EmployeeApi\Models\AdvanceOvertimeFineModel();
        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();

        if (!$model->where('user_id', $userId)->find($id)) {
            return $this->respondError('Payroll record not found', 404);
        }

        // 1. Delete associated advance payment records
        $aofModel->where('user_id', $userId)->where('notes', 'payroll_id:' . $id)->delete();

        // 2. Delete associated hold salary records
        $holdModel->where('user_id', $userId)->where('payroll_id', $id)->delete();

        // 3. Delete the payroll record itself
        if ($model->delete($id)) {
            return $this->respondSuccess(null, 'Payroll record and associated data deleted');
        }
        return $this->respondError('Failed to delete payroll record');
    }

    /**
     * Delete all payroll records for a month/year
     */
    public function deleteAll()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $month = $this->request->getGet('month');
        $year = $this->request->getGet('year');

        if (!$month || !$year) {
            return $this->respondError('Month and year are required');
        }

        $model = new PayrollModel();
        $aofModel = new \EmployeeApi\Models\AdvanceOvertimeFineModel();
        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();

        // Get all payroll IDs for this month/year before deleting them
        $payrolls = $model->where('month', (int)$month)
                          ->where('user_id', $userId)
                          ->where('year', (int)$year)
                          ->findAll();

        foreach ($payrolls as $p) {
            $pId = $p['id'];
            $aofModel->where('user_id', $userId)->where('notes', 'payroll_id:' . $pId)->delete();
            $holdModel->where('user_id', $userId)->where('payroll_id', $pId)->delete();
        }

        // Delete all payroll records for the selected month/year
        $model->where('user_id', $userId)->where('month', (int)$month)->where('year', (int)$year)->delete();

        return $this->respondSuccess(null, 'All payroll records and associated data for the selected month have been deleted');
    }

    public function holdHistory($employeeId)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;
        if (!$this->employeeBelongsToUser((int) $employeeId, $userId)) return $this->respondError('Employee not found', 404);

        $model = new \EmployeeApi\Models\HoldSalaryModel();
        $history = $model->where('user_id', $userId)->where('employee_id', (int)$employeeId)->orderBy('created_at', 'DESC')->findAll();
        return $this->respondSuccess($history, 'Hold history retrieved');
    }

    public function addManualHold()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $data = $this->request->getJSON(true);
        if (!is_array($data)) {
            $data = $this->request->getPost();
        }

        $employeeId = $data['employee_id'] ?? null;
        $days = (float)($data['days'] ?? 0);
        $amount = (float)($data['amount'] ?? 0);
        
        if (!$employeeId || (!$days && !$amount)) {
            return $this->respondError('Invalid data provided');
        }

        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();
        $employeeModel = new \EmployeeApi\Models\EmployeeModel();
        $employee = $employeeModel->where('user_id', $userId)->find($employeeId);
        
        if (!$employee) {
            return $this->respondError('Employee not found');
        }

        $dailyRate = $employee['monthly_salary'] / (new \EmployeeApi\Models\SettingsModel())->getDaysDivisor((int)date('n'), (int)date('Y'));
        
        // If amount provided but not days, calculate days
        if ($amount > 0 && $days <= 0) {
            $days = $amount / $dailyRate;
        }
        
        $success = $holdModel->addToHold((int)$employeeId, $days, $dailyRate, null, $userId);
        
        if ($success) {
            return $this->respondSuccess(null, 'Manual hold added successfully');
        }
        return $this->respondError('Failed to add manual hold');
    }

    public function releaseManualHold()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $data = $this->request->getJSON(true);
        if (!is_array($data)) {
            $data = $this->request->getPost();
        }

        $employeeId = $data['employee_id'] ?? null;
        $days = (float)($data['days'] ?? 0);

        if (!$employeeId) {
            return $this->respondError('Employee ID is required');
        }
        if (!$this->employeeBelongsToUser((int) $employeeId, $userId)) {
            return $this->respondError('Employee not found', 404);
        }

        $holdModel = new \EmployeeApi\Models\HoldSalaryModel();
        $holdInfo = $holdModel->getTotalHoldForEmployee((int)$employeeId);
        $daysToRelease = $days > 0 ? $days : (float)($holdInfo['total_hold_days'] ?? 0);

        if ($daysToRelease <= 0) {
            return $this->respondSuccess([
                'released_amount' => 0,
                'released_days' => 0
            ], 'No active hold to release');
        }

        $releasedAmount = $holdModel->releaseHold((int)$employeeId, $daysToRelease);

        return $this->respondSuccess([
            'released_amount' => $releasedAmount,
            'released_days' => $daysToRelease
        ], 'Hold released successfully');
    }
}
