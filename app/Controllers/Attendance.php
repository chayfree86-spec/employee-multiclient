<?php

namespace App\Controllers;

use App\Models\EmployeeModel;
use App\Models\AttendanceModel;
use App\Models\PayrollModel;

class Attendance extends BaseController
{
    protected $employeeModel;
    protected $attendanceModel;
    protected $payrollModel;

    public function __construct()
    {
        $this->employeeModel = new EmployeeModel();
        $this->attendanceModel = new AttendanceModel();
        $this->payrollModel = new PayrollModel();
    }

    public function index()
    {
        $today = date('Y-m-d');
        $data = [
            'title' => 'Attendance Management',
            'employees' => $this->employeeModel->getActiveEmployees(),
            'today' => $today,
            'maxDate' => $today
        ];

        return view('attendance/index', $data);
    }

    public function mark()
    {
        if (!$this->request->is('post')) {
            return $this->response->setJSON(['success' => false, 'message' => 'Invalid request']);
        }

        $employeeId = $this->request->getPost('employee_id');
        $date = $this->request->getPost('date');
        $status = $this->request->getPost('status');
        $checkIn = $this->request->getPost('check_in');
        $checkOut = $this->request->getPost('check_out');

        $today = date('Y-m-d');
        if (empty($date) || $date > $today) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Attendance is only allowed for previous dates and today. Future dates are not allowed.'
            ]);
        }

        $employee = $this->employeeModel->find($employeeId);
        $joinDate = $employee['join_date'] ?? null;
        if (!empty($joinDate) && $date < $joinDate) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Attendance cannot be marked before employee join date (' . date('d/m/Y', strtotime($joinDate)) . ').'
            ]);
        }

        // Tuesday = weekend (weekly off) but attendance can still be marked if needed (e.g. overtime, special cases)
        // No block for Tuesday - manual marking is allowed and takes precedence in payroll/weekend logic.

        $month = (int) date('n', strtotime($date));
        $year = (int) date('Y', strtotime($date));
        if ($this->payrollModel->hasPayrollForEmployeeMonth($employeeId, $month, $year)) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Attendance cannot be added or updated because payroll for this employee has already been generated.'
            ]);
        }

        if ($this->attendanceModel->markAttendance($employeeId, $date, $status, $checkIn, $checkOut)) {
            try {
                $this->attendanceModel->syncWeekendRuleForMonth((int) $employeeId, $month, $year, $joinDate);
            } catch (\Throwable $e) {
                // If source column missing (migration not run), sync is skipped; mark still succeeds
            }
            return $this->response->setJSON([
                'success' => true,
                'message' => 'Attendance marked successfully'
            ]);
        }

        return $this->response->setJSON([
            'success' => false,
            'message' => 'Failed to mark attendance'
        ]);
    }

    public function checkPayrollLock()
    {
        $month = (int) $this->request->getGet('month');
        $year = (int) $this->request->getGet('year');
        $employeeIds = $this->request->getGet('employee_ids');
        if ($month < 1 || $month > 12 || $year < 2000) {
            return $this->response->setJSON(['locked' => false, 'locks' => []]);
        }
        $locks = [];
        if (!empty($employeeIds)) {
            $ids = is_array($employeeIds) ? $employeeIds : array_map('intval', array_filter(explode(',', (string) $employeeIds)));
            foreach ($ids as $id) {
                if ($id > 0) {
                    $locks[(string) $id] = $this->payrollModel->hasPayrollForEmployeeMonth($id, $month, $year);
                }
            }
        }
        $locked = empty($locks) ? $this->payrollModel->isPayrollGeneratedForMonth($month, $year) : in_array(true, $locks, true);
        return $this->response->setJSON(['locked' => $locked, 'locks' => $locks]);
    }

    public function getAttendance()
    {
        $employeeId = $this->request->getGet('employee_id');
        $date = $this->request->getGet('date');

        $attendance = $this->attendanceModel->getAttendanceByEmployeeAndDate($employeeId, $date);

        return $this->response->setJSON($attendance ?: []);
    }

    public function getMonthlyAttendance($employeeId, $month, $year)
    {
        $employeeId = (int) $employeeId;
        $month = (int) $month;
        $year = (int) $year;
        $employee = $this->employeeModel->find($employeeId);
        $joinDate = $employee['join_date'] ?? null;
        $attendance = $this->attendanceModel->getMonthlyAttendanceEnriched($employeeId, $month, $year, $joinDate);
        $summary = $this->attendanceModel->getAttendanceSummaryEnriched($employeeId, $month, $year, null, $joinDate);
        return $this->response->setJSON([
            'attendance' => $attendance,
            'summary' => $summary,
        ]);
    }

    public function report()
    {
        $month = $this->request->getGet('month') ?: date('m');
        $year = $this->request->getGet('year') ?: date('Y');
        $employeeId = $this->request->getGet('employee_id') ? (int) $this->request->getGet('employee_id') : null;

        if ($employeeId) {
            $emp = $this->employeeModel->find($employeeId);
            $employees = $emp ? [$emp] : [];
        } else {
            $employees = $this->employeeModel->getActiveEmployees();
        }
        $reportData = [];

        foreach ($employees as $employee) {
            $joinDate = $employee['join_date'] ?? null;
            $attendance = $this->attendanceModel->getMonthlyAttendanceEnriched((int) $employee['id'], (int) $month, (int) $year, $joinDate);
            $summary = $this->attendanceModel->getAttendanceSummaryEnriched((int) $employee['id'], (int) $month, (int) $year, null, $joinDate);
            $weekdayStatus = $this->attendanceModel->getWeekdayAttendanceStatus((int) $employee['id'], (int) $month, (int) $year, null, $joinDate);

            $reportData[] = [
                'employee' => $employee,
                'attendance' => $attendance,
                'summary' => $summary,
                'weekdayStatus' => $weekdayStatus
            ];
        }

        $data = [
            'title' => 'Monthly Attendance Report',
            'reportData' => $reportData,
            'month' => $month,
            'year' => $year,
            'filterEmployeeId' => $employeeId,
        ];

        return view('attendance/report', $data);
    }
}