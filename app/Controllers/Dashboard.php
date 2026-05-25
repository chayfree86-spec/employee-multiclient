<?php

namespace App\Controllers;

use App\Models\EmployeeModel;
use App\Models\PayrollModel;
use App\Models\AttendanceModel;
use App\Models\AdvanceOvertimeFineModel;

class Dashboard extends BaseController
{
    public function index()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $employeeModel = new EmployeeModel();
        $payrollModel = new PayrollModel();
        $attendanceModel = new AttendanceModel();
        $aofModel = new AdvanceOvertimeFineModel();

        $today = date('Y-m-d');
        $currentMonth = (int) date('n');
        $currentYear = (int) date('Y');

        $data = [
            'title' => 'Dashboard',
            'totalEmployees' => $employeeModel->getTotalActiveEmployees(),
            'totalPayoutDone' => $payrollModel->getTotalPaidAmount(),
            'totalAdvancePending' => $payrollModel->getTotalAdvancePending(),
            'currentMonthPayable' => $this->getCurrentMonthPayable($employeeModel, $attendanceModel, $aofModel, $currentMonth, $currentYear),
            'currentMonthPayableDate' => $today,
            'attendanceMonthly' => $this->getAttendanceMonthlyData($attendanceModel, $employeeModel, $currentYear),
            'payoutMonthly' => $this->getPayoutMonthlyData($payrollModel, $currentYear),
        ];

        return view('dashboard', $data);
    }

    /**
     * Total payable for current month - uses same calculation as Report attendance page.
     * Formula: (present + half_day*0.5) * dailyRate + weekend_holiday_amount + overtime - fine per employee.
     */
    private function getCurrentMonthPayable(EmployeeModel $employeeModel, AttendanceModel $attendanceModel, AdvanceOvertimeFineModel $aofModel, int $month, int $year): float
    {
        $employees = $employeeModel->findAll();
        $total = 0.0;
        $settingsModel = new \App\Models\SettingsModel();
        $workingDaysInMonth = $settingsModel->getDaysDivisor($month, $year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        foreach ($employees as $emp) {
            $empId = (int) $emp['id'];
            $joinDate = $emp['join_date'] ?? null;
            $summary = $attendanceModel->getAttendanceSummaryEnriched($empId, $month, $year, null, $joinDate);
            $presentDays = 0;
            $halfDays = 0;
            $absentDays = 0;
            foreach ($summary as $row) {
                $count = (int) ($row['count'] ?? 0);
                switch ($row['status'] ?? '') {
                    case 'present': $presentDays = $count; break;
                    case 'half_day': $halfDays = $count; break;
                    case 'absent': $absentDays = $count; break;
                }
            }
            $baseSalary = (float) ($emp['monthly_salary'] ?? 0);
            $dailySalary = $workingDaysInMonth > 0 ? $baseSalary / $workingDaysInMonth : 0;
            $weekdayStatus = $attendanceModel->getWeekdayAttendanceStatus($empId, $month, $year, null, $joinDate);

            if ($payrollMode === 'monthly') {
                $weekendAbsentDays = $weekdayStatus['weekend_absent_count'] ?? 0;
                $salaryFromAttendance = $baseSalary - ($absentDays * $dailySalary) - ($halfDays * $dailySalary * 0.5) - ($weekendAbsentDays * $dailySalary);
                $weekendHolidayAmount = 0;
            } else {
                $salaryFromAttendance = ($presentDays * $dailySalary) + ($halfDays * $dailySalary * 0.5);
                $weekendHolidayAmount = ($weekdayStatus['weekend_holiday_count'] ?? 0) * $dailySalary;
            }

            $sums = $aofModel->getSumsForEmployeeMonth($empId, $month, $year);
            $overtime = (float) ($sums['overtime'] ?? 0);
            $fine = (float) ($sums['fine'] ?? 0);
            $payable = $salaryFromAttendance + $weekendHolidayAmount + $overtime - $fine;
            $holdModel = new \App\Models\HoldSalaryModel();
            $hold = $holdModel->getActiveHold($empId);
            if ($hold) {
                $remainingHoldDays = (float) $hold['remaining_hold_days'];
                $holdDailyRate = (float) $hold['daily_rate'];
                $holdDeduction = $remainingHoldDays * $holdDailyRate;
                $payable = $payable - $holdDeduction;
            }
            $total += max(0, round($payable, 2));
        }
        return round($total, 2);
    }

    /** Last 12 months: present, absent, half_day, weekend per month (aggregate). */
    private function getAttendanceMonthlyData(AttendanceModel $attendanceModel, EmployeeModel $employeeModel, int $currentYear): array
    {
        $employees = $employeeModel->getActiveEmployees();
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $m = (int) date('n', strtotime("-$i months"));
            $y = (int) date('Y', strtotime("-$i months"));
            $present = 0;
            $absent = 0;
            $halfDay = 0;
            $weekend = 0;
            $holiday = 0;
            foreach ($employees as $emp) {
                $joinDate = $emp['join_date'] ?? null;
                $summary = $attendanceModel->getAttendanceSummaryEnriched((int) $emp['id'], $m, $y, null, $joinDate);
                foreach ($summary as $row) {
                    $c = (int) ($row['count'] ?? 0);
                    switch ($row['status'] ?? '') {
                        case 'present': $present += $c; break;
                        case 'absent': $absent += $c; break;
                        case 'half_day': $halfDay += $c; break;
                        case 'weekend': $weekend += $c; break;
                        case 'holiday': $holiday += $c; break;
                    }
                }
            }
            $months[] = [
                'label' => date('M Y', mktime(0, 0, 0, $m, 1, $y)),
                'present' => $present,
                'absent' => $absent,
                'half_day' => $halfDay,
                'weekend' => $weekend,
                'holiday' => $holiday,
            ];
        }
        return $months;
    }

    /** Last 12 months: payout (paid) per month. */
    private function getPayoutMonthlyData(PayrollModel $payrollModel, int $currentYear): array
    {
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $m = (int) date('n', strtotime("-$i months"));
            $y = (int) date('Y', strtotime("-$i months"));
            $row = $payrollModel->selectSum('total_salary')
                ->where('month', $m)
                ->where('year', $y)
                ->where('paid', 1)
                ->get()
                ->getRow();
            $amount = (float) ($row->total_salary ?? 0);
            $months[] = [
                'label' => date('M Y', mktime(0, 0, 0, $m, 1, $y)),
                'amount' => $amount,
            ];
        }
        return $months;
    }
}