<?php

namespace App\Models;

use CodeIgniter\Model;
use App\Models\AdvanceOvertimeFineModel;
use App\Models\HoldSalaryModel;

class PayrollModel extends Model
{
    protected $table = 'payroll';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'employee_id', 'month', 'year', 'total_days', 'present_days',
        'half_days', 'absent_days', 'weekend_holiday_days', 'weekend_absent_days', 'weekend_holiday_amount',
        'base_salary', 'overtime', 'fine',
        'advance_deduction', 'hold_salary_released', 'hold_deduction', 'total_salary', 'paid',
        'days_divisor'
    ];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = '';

    protected $validationRules = [
        'employee_id' => 'required|integer|is_not_unique[employees.id]',
        'month' => 'required|integer|greater_than_equal_to[1]|less_than_equal_to[12]',
        'year' => 'required|integer|greater_than[2000]',
        'total_days' => 'required|integer|greater_than[0]',
        'present_days' => 'required|integer|greater_than_equal_to[0]',
        'half_days' => 'required|integer|greater_than_equal_to[0]',
        'absent_days' => 'required|integer|greater_than_equal_to[0]',
        'weekend_holiday_days' => 'permit_empty|integer|greater_than_equal_to[0]',
        'weekend_absent_days' => 'permit_empty|integer|greater_than_equal_to[0]',
        'weekend_holiday_amount' => 'permit_empty|numeric|greater_than_equal_to[0]',
        'base_salary' => 'required|numeric|greater_than_equal_to[0]',
        'overtime' => 'required|numeric|greater_than_equal_to[0]',
        'fine' => 'required|numeric|greater_than_equal_to[0]',
        'advance_deduction' => 'required|numeric|greater_than_equal_to[0]',
        'hold_salary_released' => 'permit_empty|numeric|greater_than_equal_to[0]',
        'hold_deduction' => 'permit_empty|numeric|greater_than_equal_to[0]',
        'total_salary' => 'required|numeric|greater_than_equal_to[0]',
        'paid' => 'required|in_list[0,1]'
    ];

    public function getPayrollByEmployeeAndMonth($employeeId, $month, $year)
    {
        return $this->where('employee_id', $employeeId)
                   ->where('month', $month)
                   ->where('year', $year)
                   ->first();
    }

    /**
     * Delete all payroll records for a given month/year.
     * Related payments are deleted automatically via FK CASCADE.
     * Returns the number of deleted records.
     */
    public function deleteMonth($month, $year)
    {
        $month = (int) $month;
        $year = (int) $year;
        return $this->db->table($this->table)
            ->where('month', $month)
            ->where('year', $year)
            ->delete();
    }

    /**
     * Returns true if payroll has been generated for the given month/year (any employee).
     */
    public function isPayrollGeneratedForMonth($month, $year)
    {
        $count = $this->where('month', (int) $month)
                      ->where('year', (int) $year)
                      ->countAllResults();
        return $count > 0;
    }

    /**
     * Returns true if this specific employee has a payroll record for the given month/year.
     * Used for per-employee lock: if employee was deleted from payroll, they are not locked.
     */
    public function hasPayrollForEmployeeMonth($employeeId, $month, $year)
    {
        return $this->where('employee_id', (int) $employeeId)
                    ->where('month', (int) $month)
                    ->where('year', (int) $year)
                    ->countAllResults() > 0;
    }

    public function getTotalPaidAmount()
    {
        return $this->selectSum('total_salary')
                   ->where('paid', 1)
                   ->get()
                   ->getRow()
                   ->total_salary ?? 0;
    }

    public function getTotalPendingAmount()
    {
        return $this->selectSum('total_salary')
                   ->where('paid', 0)
                   ->get()
                   ->getRow()
                   ->total_salary ?? 0;
    }

    /**
     * Calculate salary for an employee for a month based on attendance.
     * Uses attendance summary: present = full day, half_day = 0.5 day, absent/holiday = 0.
     * total_salary = (present_days + half_days*0.5) * daily_rate + overtime - fine - advance_deduction.
     * Overtime, fine, advance_deduction typically come from advance_overtime_fine table (summed for month).
     *
     * Hold Salary Formula (settings-driven):
     * - Total working days in month = from settings (default 30, or actual calendar days)
     * - 1 day salary = Base Salary / days_divisor
     * - Hold amount = Hold days × 1 day salary  (e.g. 10 × 500 = 5000)
     * - Payroll payable = Payable - Hold amount  (e.g. 15000 - 5000 = 10000)
     */
    public function calculateSalary($employeeId, $month, $year, $overtime = 0, $fine = 0, $advanceDeduction = 0)
    {
        $attendanceModel = new AttendanceModel();
        $employeeModel = new EmployeeModel();

        $employee = $employeeModel->find($employeeId);
        if (!$employee) {
            return false;
        }

        $baseSalary = (float) $employee['monthly_salary'];
        $month = (int) $month;
        $year = (int) $year;

        // Get attendance-based counts (with weekday logic: Tuesday = weekend, join date filter)
        $joinDate = $employee['join_date'] ?? null;
        $summary = $attendanceModel->getAttendanceSummaryEnriched($employeeId, $month, $year, null, $joinDate);
        $weekdayStatus = $attendanceModel->getWeekdayAttendanceStatus($employeeId, $month, $year, null, $joinDate);

        $presentDays = 0;
        $halfDays = 0;
        $absentDays = 0;
        $holidayDays = 0;

        foreach ($summary as $row) {
            $count = (int) ($row['count'] ?? 0);
            switch ($row['status'] ?? '') {
                case 'present':
                    $presentDays = $count;
                    break;
                case 'half_day':
                    $halfDays = $count;
                    break;
                case 'absent':
                    $absentDays = $count;
                    break;
                case 'holiday':
                    $holidayDays = $count;
                    break;
            }
        }

        $totalDays = $presentDays + $halfDays + $absentDays + $holidayDays;

        // If no attendance marked for the month, do not pay full salary: use 0 present days.
        $settingsModel = new SettingsModel();
        $workingDaysInMonth = $settingsModel->getDaysDivisor($month, $year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        if ($totalDays === 0) {
            $totalDays = $workingDaysInMonth;
        }

        $dailySalary = $workingDaysInMonth > 0 ? $baseSalary / $workingDaysInMonth : 0;
        $weekendHolidayDays = $weekdayStatus['weekend_holiday_count'] ?? 0;
        $weekendAbsentDays = $weekdayStatus['weekend_absent_count'] ?? 0;

        if ($payrollMode === 'monthly') {
            // Monthly mode: start from base salary, deduct absences
            $salaryFromAttendance = $baseSalary - ($absentDays * $dailySalary) - ($halfDays * $dailySalary * 0.5) - ($weekendAbsentDays * $dailySalary);
            $weekendHolidayAmount = 0;
        } else {
            // Per-day mode: add up present days + weekends
            $salaryFromAttendance = ($presentDays * $dailySalary) + ($halfDays * $dailySalary * 0.5);
            $weekendHolidayAmount = round($weekendHolidayDays * $dailySalary, 2);
        }

        $totalSalary = $salaryFromAttendance + $weekendHolidayAmount + (float) $overtime - (float) $fine - (float) $advanceDeduction;

        // Working days = present + half_day (0.5 each) + weekend available (paid Tuesday/holiday)
        $workingDays = $presentDays + ($halfDays * 0.5) + $weekendHolidayDays;

        return [
            'employee_id' => $employeeId,
            'month' => $month,
            'year' => $year,
            'total_days' => $totalDays,
            'present_days' => $presentDays,
            'half_days' => $halfDays,
            'absent_days' => $absentDays,
            'weekend_holiday_days' => $weekendHolidayDays,
            'weekend_absent_days' => $weekendAbsentDays,
            'working_days' => round($workingDays, 2),
            'weekend_holiday_amount' => $weekendHolidayAmount,
            'base_salary' => $baseSalary,
            'overtime' => (float) $overtime,
            'fine' => (float) $fine,
            'advance_deduction' => (float) $advanceDeduction,
            'total_salary' => max(0, round($totalSalary, 2)),
            'paid' => 0,
            'days_divisor' => $workingDaysInMonth
        ];
    }

    public function generateMonthlyPayroll($month, $year, ?int $employeeId = null)
    {
        $employeeModel = new EmployeeModel();
        $aofModel = new AdvanceOvertimeFineModel();
        $employees = $employeeModel->getActiveEmployees();

        if ($employeeId) {
            $employees = array_filter($employees, fn($e) => (int) $e['id'] === $employeeId);
        }

        $generated = 0;
        $holdModel = new HoldSalaryModel();
        $settingsModel = new SettingsModel();
        $workingDaysInMonth = $settingsModel->getDaysDivisor((int) $month, (int) $year);
        foreach ($employees as $employee) {
            $existing = $this->getPayrollByEmployeeAndMonth($employee['id'], $month, $year);
            if (!$existing) {
                $sums = $aofModel->getSumsForEmployeeMonth((int) $employee['id'], (int) $month, (int) $year);
                // Advance is not auto-calculated; add manually in payroll Edit
                $sums['advance'] = 0;
                $payrollData = $this->calculateSalary(
                    $employee['id'],
                    $month,
                    $year,
                    $sums['overtime'],
                    $sums['fine'],
                    $sums['advance']
                );
                if ($payrollData) {
                    $payrollData['hold_salary_released'] = 0;
                    $payrollData['hold_deduction'] = 0;
                    $empId = (int) $employee['id'];
                    $baseSalary = (float) ($payrollData['base_salary'] ?? $employee['monthly_salary']);
                    $dailyRate = $workingDaysInMonth > 0 ? $baseSalary / $workingDaysInMonth : 0;
                    // Working days = present + half_day (0.5 each) + weekend available (for payroll and hold)
                    $presentDays = (int) ($payrollData['present_days'] ?? 0);
                    $halfDays = (float) ($payrollData['half_days'] ?? 0);
                    $weekendAvailable = (float) ($payrollData['weekend_holiday_days'] ?? 0);
                    $workingDays = $presentDays + ($halfDays * 0.5) + $weekendAvailable;

                    $holdAmount = 0.0;
                    if ($workingDays < HoldSalaryModel::MIN_WORKING_DAYS_PER_MONTH && $workingDays > 0 && $dailyRate > 0) {
                        $holdAmount = round(round($workingDays, 2) * $dailyRate, 2);
                    }
                    $payrollData['hold_deduction'] = $holdAmount;
                    $payrollData['total_salary'] = max(0, round((float) ($payrollData['total_salary'] ?? 0) - $holdAmount, 2));
                    $payrollId = $this->insert($payrollData);
                    if ($payrollId) {
                        $generated++;
                        // If working days < 10, add those working days to hold as a new row (linked to this payroll)
                        if ($holdAmount > 0) {
                            $holdModel->addToHold($empId, round($workingDays, 2), $dailyRate, (int) $payrollId);
                        }
                    }
                }
            }
        }

        return $generated;
    }

    /**
     * Pending advance: total advance given (from advance_overtime_fine) minus total deducted (from payroll).
     * Used in payroll list to show remaining advance and status Pending/Paid.
     */
    /**
     * Total advance pending across all employees (remaining to be repaid).
     */
    public function getTotalAdvancePending(): float
    {
        $employees = (new EmployeeModel())->getActiveEmployees();
        $total = 0.0;
        foreach ($employees as $emp) {
            $info = $this->getPendingAdvanceForEmployee((int) $emp['id']);
            $total += (float) ($info['remaining'] ?? 0);
        }
        return round($total, 2);
    }

    public function getPendingAdvanceForEmployee(int $employeeId): array
    {
        $aofModel = new AdvanceOvertimeFineModel();
        $totalAdvance = $aofModel->getTotalAdvanceForEmployee($employeeId);
        $totalPaid = $this->getTotalAdvanceDeductionForEmployee($employeeId);
        $remaining = round(max(0, $totalAdvance - $totalPaid), 2);
        return [
            'total_advance' => round($totalAdvance, 2),
            'total_paid' => round($totalPaid, 2),
            'remaining' => $remaining,
            'status' => $remaining > 0 ? 'Pending' : 'Paid',
        ];
    }

    /**
     * Batch: pending advance for multiple employees. Returns [ employee_id => [ total_advance, total_paid, remaining, status ], ... ]
     */
    public function getPendingAdvanceForEmployees(array $employeeIds): array
    {
        if (empty($employeeIds)) {
            return [];
        }
        $result = [];
        foreach ($employeeIds as $id) {
            $result[(int) $id] = $this->getPendingAdvanceForEmployee((int) $id);
        }
        return $result;
    }

    /** Sum of advance_deduction for this employee across all payroll records. */
    public function getTotalAdvanceDeductionForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('advance_deduction')
            ->where('employee_id', $employeeId)
            ->first();
        return (float) ($row['advance_deduction'] ?? 0);
    }

    /** Sum of overtime for this employee across all payroll records. */
    public function getTotalOvertimeForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('overtime')
            ->where('employee_id', $employeeId)
            ->first();
        return (float) ($row['overtime'] ?? 0);
    }

    /** Sum of fine for this employee across all payroll records. */
    public function getTotalFineForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('fine')
            ->where('employee_id', $employeeId)
            ->first();
        return (float) ($row['fine'] ?? 0);
    }
}