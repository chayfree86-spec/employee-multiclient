<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\EmployeeModel;
use EmployeeApi\Models\PayrollModel;
use EmployeeApi\Models\AttendanceModel;
use EmployeeApi\Models\AdvanceOvertimeFineModel;
use EmployeeApi\Models\HoldSalaryModel;

class DashboardController extends BaseApiController
{
    /**
     * Get summary data for dashboard widgets and charts
     */
    public function index()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $employeeModel   = new EmployeeModel();
        $payrollModel    = new PayrollModel();
        $attendanceModel = new AttendanceModel();
        $aofModel        = new AdvanceOvertimeFineModel();
        $holdModel       = new HoldSalaryModel();

        $currentMonth = (int) date('n');
        $currentYear  = (int) date('Y');
        $today = date('Y-m-d');
        $activeEmployees = $employeeModel->where('user_id', $userId)->where('status', 'active')->findAll();
        $activeIds = array_map(static fn ($employee) => (int)($employee['id'] ?? 0), $activeEmployees);
        $todayRows = $attendanceModel->where('user_id', $userId)->where('date', $today)->findAll();
        $todayByEmployee = [];
        foreach ($todayRows as $row) {
            $todayByEmployee[(int)($row['employee_id'] ?? 0)] = $row;
        }

        $todayPresent = 0;
        $todayAbsent = 0;
        $todayHalfDay = 0;
        foreach ($activeIds as $employeeId) {
            $status = $todayByEmployee[$employeeId]['status'] ?? '';
            if ($status === 'present') {
                $todayPresent++;
            } elseif ($status === 'absent') {
                $todayAbsent++;
            } elseif ($status === 'half_day' || $status === 'halfday') {
                $todayHalfDay++;
            }
        }

        $holdRow = $holdModel->select('COUNT(DISTINCT employee_id) as staff_count')
            ->selectSum('remaining_hold_days', 'days')
            ->selectSum('total', 'amount')
            ->where('user_id', $userId)
            ->where('status', HoldSalaryModel::STATUS_ACTIVE)
            ->first();

        $advanceCount = 0;
        foreach ($activeEmployees as $employee) {
            if ($aofModel->getLoanBalanceForEmployee((int)($employee['id'] ?? 0)) > 0) {
                $advanceCount++;
            }
        }

        $data = [
            'stats' => [
                'totalEmployees'      => (int) (new EmployeeModel())->where('user_id', $userId)->countAllResults(),
                'activeEmployees'     => (int) (new EmployeeModel())->where('user_id', $userId)->where('status', 'active')->countAllResults(),
                'deactiveEmployees'   => (int) (new EmployeeModel())->where('user_id', $userId)->whereIn('status', ['deactive', 'inactive'])->countAllResults(),
                'todayPresent'        => $todayPresent,
                'todayAbsent'         => $todayAbsent,
                'todayHalfDay'        => $todayHalfDay,
                'totalPayoutDone'     => (float) $payrollModel->getTotalPaidAmount($userId),
                'totalAdvancePending' => (float) $payrollModel->getTotalAdvancePending($userId),
                'advanceStaffCount'   => $advanceCount,
                'heldSalaryAmount'    => (float)($holdRow['amount'] ?? 0),
                'heldSalaryDays'      => (float)($holdRow['days'] ?? 0),
                'holdStaffCount'      => (int)($holdRow['staff_count'] ?? 0),
                'currentMonthPayable' => (float) $this->calculatePayable($userId, $employeeModel, $attendanceModel, $aofModel, $currentMonth, $currentYear),
                'totalBaseSalary'     => (float) (((new EmployeeModel())->selectSum('monthly_salary')->where('user_id', $userId)->where('status', 'active')->first())['monthly_salary'] ?? 0),
            ],
            'staffOverview' => $this->getStaffOverview($activeEmployees, $todayByEmployee),
            'charts' => [
                'attendanceHistory' => $this->getAttendanceData($userId, $attendanceModel, $employeeModel),
                'payoutHistory'     => $this->getPayoutData($userId, $payrollModel),
            ]
        ];

        return $this->respondSuccess($data, 'Dashboard data retrieved');
    }

    private function calculatePayable($userId, $employeeModel, $attendanceModel, $aofModel, $month, $year)
    {
        $employees = $employeeModel->where('user_id', $userId)->findAll();
        $total = 0.0;
        $settingsModel = new \EmployeeApi\Models\SettingsModel();
        $workingDays = $settingsModel->getDaysDivisor($month, $year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');

        foreach ($employees as $emp) {
            $empId = (int)$emp['id'];
            $summary = $attendanceModel->getAttendanceSummaryEnriched($empId, $month, $year, null, $emp['join_date']);

            $present = 0; $half = 0; $absent = 0;
            foreach ($summary as $row) {
                if ($row['status'] == 'present') $present = (int)$row['count'];
                if ($row['status'] == 'half_day') $half = (int)$row['count'];
                if ($row['status'] == 'absent') $absent = (int)$row['count'];
            }

            $daily = $workingDays > 0 ? (float)$emp['monthly_salary'] / $workingDays : 0;
            $weekday = $attendanceModel->getWeekdayAttendanceStatus($empId, $month, $year, null, $emp['join_date']);

            if ($payrollMode === 'monthly') {
                $weekendAbsent = $weekday['weekend_absent_count'] ?? 0;
                $salary = (float)$emp['monthly_salary'] - ($absent * $daily) - ($half * $daily * 0.5) - ($weekendAbsent * $daily);
                $weekendAmount = 0;
            } else {
                $salary = ($present * $daily) + ($half * $daily * 0.5);
                $weekendAmount = ($weekday['weekend_holiday_count'] ?? 0) * $daily;
            }

            try {
                $sums = $aofModel->getSumsForEmployeeMonth($empId, $month, $year);
                $payable = $salary + $weekendAmount + (float)($sums['overtime'] ?? 0) - (float)($sums['fine'] ?? 0);
                $total += max(0, round($payable, 0));
            } catch (\Exception $e) {
                // Skip error for specific employee, keep going
            }
        }
        return round($total, 0);
    }

    private function getStaffOverview(array $activeEmployees, array $todayByEmployee): array
    {
        $rows = [];
        foreach (array_slice($activeEmployees, 0, 5) as $employee) {
            $employeeId = (int)($employee['id'] ?? 0);
            $attendance = $todayByEmployee[$employeeId] ?? [];
            $status = $attendance['status'] ?? 'not_marked';

            $rows[] = [
                'id' => $employeeId,
                'name' => $employee['name'] ?? '',
                'role' => $employee['role'] ?? 'Staff',
                'status' => $employee['status'] ?? 'active',
                'attendance_status' => $status,
                'check_in' => $attendance['check_in'] ?? null,
                'profile_image' => $employee['profile_image'] ?? null,
            ];
        }

        return $rows;
    }

    private function getAttendanceData($userId, $attendanceModel, $employeeModel)
    {
        $history = [];
        $activeCount = (int) $employeeModel->where('user_id', $userId)->where('status', 'active')->countAllResults();
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $rows = $attendanceModel->where('user_id', $userId)->where('date', $date)->findAll();
            $present = 0;
            $absent = 0;
            $halfDay = 0;
            foreach ($rows as $row) {
                $status = $row['status'] ?? '';
                if ($status === 'present') {
                    $present++;
                } elseif ($status === 'absent') {
                    $absent++;
                } elseif ($status === 'half_day' || $status === 'halfday') {
                    $halfDay++;
                }
            }

            $history[] = [
                'label' => date('D', strtotime($date)),
                'date' => $date,
                'present' => $present,
                'absent' => $absent,
                'half_day' => $halfDay,
                'active_staff' => $activeCount,
                'is_weekend' => AttendanceModel::isWeekday($date),
            ];
        }
        return $history;
    }

    private function getPayoutData($userId, $payrollModel)
    {
        $data = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = (int)date('n', strtotime("-$i months"));
            $y = (int)date('Y', strtotime("-$i months"));
            $row = $payrollModel->selectSum('total_salary')->where(['user_id' => $userId, 'month' => $m, 'year' => $y, 'paid' => 1])->get()->getRow();
            $data[] = [
                'label' => date('M Y', mktime(0, 0, 0, $m, 1, $y)),
                'amount' => (float)($row->total_salary ?? 0)
            ];
        }
        return $data;
    }
}
