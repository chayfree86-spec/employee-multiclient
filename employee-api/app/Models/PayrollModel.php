<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class PayrollModel extends Model
{
    protected $table = 'payroll';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'user_id', 'employee_id', 'month', 'year', 'total_days', 'present_days',
        'half_days', 'absent_days', 'weekend_holiday_days', 'weekend_absent_days', 'weekend_holiday_amount',
        'base_salary', 'overtime', 'fine', 'deduction',
        'advance_deduction', 'hold_salary_released', 'hold_deduction', 'total_salary', 'paid',
        'days_divisor'
    ];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $beforeInsert = ['roundAmounts'];
    protected $beforeUpdate = ['roundAmounts'];

    protected function roundAmounts(array $data)
    {
        $fields = ['base_salary', 'overtime', 'fine', 'deduction', 'advance_deduction', 'hold_salary_released', 'hold_deduction', 'total_salary', 'weekend_holiday_amount'];
        foreach ($fields as $field) {
            if (isset($data['data'][$field])) {
                $data['data'][$field] = (float) round($data['data'][$field], 0);
            }
        }
        return $data;
    }

    public function getPayrollByEmployeeAndMonth($employeeId, $month, $year)
    {
        return $this->where('employee_id', $employeeId)
                   ->where('month', $month)
                   ->where('year', $year)
                   ->first();
    }

    public function calculateSalary($employeeId, $month, $year, $overtime = 0, $fine = 0, $advanceDeduction = 0, $deduction = 0)
    {
        $attendanceModel = new AttendanceModel();
        $employeeModel = new EmployeeModel();

        $employee = $employeeModel->find($employeeId);
        if (!$employee) return false;

        $baseSalary = (float) $employee['monthly_salary'];
        $month = (int) $month;
        $year = (int) $year;
        $joinDate = $employee['join_date'] ?? null;

        $rawAttendance = $attendanceModel->getMonthlyAttendanceEnriched($employeeId, $month, $year, $joinDate);
        $presentDays = 0; $halfDays = 0; $absentDays = 0; $holidayDays = 0; $weekendDays = 0;

        foreach ($rawAttendance as $row) {
            switch ($row['status'] ?? '') {
                case 'present': $presentDays++; break;
                case 'half_day':
                case 'halfday': $halfDays++; break;
                case 'absent': $absentDays++; break;
                case 'holiday': $holidayDays++; break;
                case 'weekend': $weekendDays++; break;
            }
        }

        $totalDays = $presentDays + $halfDays + $absentDays + $holidayDays + $weekendDays;
        $settingsModel = new SettingsModel();
        $workingDaysInMonth = $settingsModel->getDaysDivisor($month, $year);
        if ($totalDays === 0) $totalDays = $workingDaysInMonth;

        $dailySalary = $workingDaysInMonth > 0 ? (float)($baseSalary / $workingDaysInMonth) : 0;
        $weekendHolidayDays = $holidayDays + $weekendDays;
        $weekendAbsentDays = 0;
        $salaryFromAttendance = (float)round(($presentDays * $dailySalary) + ($halfDays * $dailySalary * 0.5) + ($weekendHolidayDays * $dailySalary), 0);
        $weekendHolidayAmount = 0;

        $totalSalary = $salaryFromAttendance + $weekendHolidayAmount + (float) $overtime - (float) $fine - (float) $advanceDeduction - (float) $deduction;
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
            'working_days' => round($workingDays, 1),
            'weekend_holiday_amount' => $weekendHolidayAmount,
            'base_salary' => $baseSalary,
            'overtime' => (float) round($overtime, 0),
            'fine' => (float) round($fine, 0),
            'advance_deduction' => (float) round($advanceDeduction, 0),
            'deduction' => (float) round($deduction, 0),
            'total_salary' => max(0, (float)round($totalSalary, 0)),
            'paid' => 0,
            'days_divisor' => $workingDaysInMonth
        ];
    }

    public function getPendingAdvanceForEmployee(int $employeeId): array
    {
        $aofModel = new AdvanceOvertimeFineModel();
        $totalAdvance = $aofModel->getTotalAdvanceForEmployee($employeeId);
        $totalPaid = $aofModel->getTotalRepaidForEmployee($employeeId);
        $remaining = round(max(0, $totalAdvance - $totalPaid), 0);
        return [
            'total_advance' => round($totalAdvance, 0),
            'total_paid' => round($totalPaid, 0),
            'remaining' => $remaining,
            'status' => $remaining > 0 ? 'Pending' : 'Paid',
        ];
    }

    public function getTotalAdvanceDeductionForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('advance_deduction')
            ->where('employee_id', $employeeId)
            ->first();
        return (float) ($row['advance_deduction'] ?? 0);
    }

    public function getTotalPaidAmount(?int $userId = null)
    {
        $builder = $this->selectSum('total_salary')->where('paid', 1);
        if ($userId !== null) {
            $builder->where('user_id', $userId);
        }
        $row = $builder->first();
        return (float)($row['total_salary'] ?? 0);
    }

    public function getTotalAdvancePending(?int $userId = null)
    {
        $aofModel = new AdvanceOvertimeFineModel();
        $givenQuery = $aofModel->selectSum('amount')->where('type', 'advance');
        if ($userId !== null) {
            $givenQuery->where('user_id', $userId);
        }
        $totalGiven = $givenQuery->first();

        $paidModel = new AdvanceOvertimeFineModel();
        $paidQuery = $paidModel->selectSum('amount')->where('type', 'advance_paid');
        if ($userId !== null) {
            $paidQuery->where('user_id', $userId);
        }
        $totalRepaid = $paidQuery->first();
        return max(0, (float)($totalGiven['amount'] ?? 0) - (float)($totalRepaid['amount'] ?? 0));
    }
}
