<?php

namespace App\Controllers;

use App\Models\EmployeeModel;
use App\Models\AdvanceOvertimeFineModel;
use App\Models\PayrollModel;
use App\Models\HoldSalaryModel;
use App\Models\AttendanceModel;

class Employee extends BaseController
{
    protected $employeeModel;
    protected $advanceModel;
    protected $payrollModel;

    public function __construct()
    {
        $this->employeeModel = new EmployeeModel();
        $this->advanceModel = new AdvanceOvertimeFineModel();
        $this->payrollModel = new PayrollModel();
    }

    /**
     * Return JSON API response (for AJAX / API calls).
     */
    private function apiResponse(array $payload, int $statusCode = 200)
    {
        return $this->response
            ->setContentType('application/json')
            ->setStatusCode($statusCode)
            ->setJSON($payload);
    }

    public function index()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $employees = $this->employeeModel->findAll();
        $activeAdvances = $this->advanceModel->getEmployeesWithActiveAdvances();

        $data = [
            'title' => 'Employee Management',
            'employees' => $employees,
            'activeAdvances' => $activeAdvances,
            'totalEmployees' => $this->employeeModel->getTotalEmployees(),
            'totalActive' => $this->employeeModel->getTotalActiveEmployees(),
            'totalMonthlySalary' => $this->employeeModel->getTotalMonthlySalary(),
        ];

        return view('employee/index', $data);
    }

    /**
     * Return employee list as JSON for AJAX refresh (no page reload).
     */
    public function getList()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $employees = $this->employeeModel->findAll();
        $activeAdvances = $this->advanceModel->getEmployeesWithActiveAdvances();

        return $this->apiResponse([
            'success' => true,
            'employees' => $employees,
            'activeAdvances' => $activeAdvances,
            'totalEmployees' => $this->employeeModel->getTotalEmployees(),
            'totalActive' => $this->employeeModel->getTotalActiveEmployees(),
            'totalMonthlySalary' => $this->employeeModel->getTotalMonthlySalary(),
        ]);
    }

    /**
     * Compute badge data for employee profile sidebar (payable + advance/overtime/fine/hold badges).
     */
    private function getProfileBadgeData(array $employee): array
    {
        $empId = (int) $employee['id'];
        $currentMonth = (int) date('n');
        $currentYear = (int) date('Y');
        $joinDate = $employee['join_date'] ?? null;
        $attendanceModel = new AttendanceModel();
        $summary = $attendanceModel->getAttendanceSummaryEnriched($empId, $currentMonth, $currentYear, null, $joinDate);
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
        $baseSalary = (float) ($employee['monthly_salary'] ?? 0);
        $settingsModel = new \App\Models\SettingsModel();
        $workingDaysInMonth = $settingsModel->getDaysDivisor($currentMonth, $currentYear);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        $dailySalary = $workingDaysInMonth > 0 ? $baseSalary / $workingDaysInMonth : 0;
        $weekdayStatus = $attendanceModel->getWeekdayAttendanceStatus($empId, $currentMonth, $currentYear, null, $joinDate);

        if ($payrollMode === 'monthly') {
            $weekendAbsentDays = $weekdayStatus['weekend_absent_count'] ?? 0;
            $salaryFromAttendance = $baseSalary - ($absentDays * $dailySalary) - ($halfDays * $dailySalary * 0.5) - ($weekendAbsentDays * $dailySalary);
            $weekendHolidayAmount = 0;
        } else {
            $salaryFromAttendance = ($presentDays * $dailySalary) + ($halfDays * $dailySalary * 0.5);
            $weekendHolidayAmount = ($weekdayStatus['weekend_holiday_count'] ?? 0) * $dailySalary;
        }

        $sums = $this->advanceModel->getSumsForEmployeeMonth($empId, $currentMonth, $currentYear);
        $currentMonthOvertime = (float) ($sums['overtime'] ?? 0);
        $currentMonthFine = (float) ($sums['fine'] ?? 0);
        $currentPayable = max(0, round($salaryFromAttendance + $weekendHolidayAmount + $currentMonthOvertime - $currentMonthFine, 2));
        $holdModel = new HoldSalaryModel();
        $pendingAdvance = $this->payrollModel->getPendingAdvanceForEmployee($empId);
        $holdSummary = $holdModel->getHoldSummaryForEmployee($empId);
        $currentMonthPayroll = $this->payrollModel->getPayrollByEmployeeAndMonth($empId, $currentMonth, $currentYear);
        $currentMonthPayrollPaid = $currentMonthPayroll && !empty($currentMonthPayroll['paid']);

        // Present count: full present + half days as 0.5 each
        $currentMonthPresentCount = $presentDays + ($halfDays * 0.5);

        return [
            'currentPayable' => $currentPayable,
            'pendingAdvanceRemaining' => (float) ($pendingAdvance['remaining'] ?? 0),
            'currentMonthOvertime' => $currentMonthOvertime,
            'currentMonthFine' => $currentMonthFine,
            'currentMonthPayrollPaid' => $currentMonthPayrollPaid,
            'holdPendingAmount' => (float) ($holdSummary['remaining_amount'] ?? 0),
            'currentMonthPresentCount' => round($currentMonthPresentCount, 1),
        ];
    }

    /**
     * Return profile sidebar badge data as JSON (for AJAX refresh without page reload).
     */
    public function profileBadges($id)
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            return $this->apiResponse(['success' => false, 'message' => 'Employee not found'], 404);
        }

        $badges = $this->getProfileBadgeData($employee);
        return $this->apiResponse(['success' => true, 'badges' => $badges]);
    }

    /**
     * Employee profile page with left sidebar menu (Profile, Add Advance, Add Overtime, Add Fine, Delete).
     */
    public function profile($id)
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Employee not found');
        }

        $empId = (int) $employee['id'];
        $payrolls = $this->payrollModel->select('payroll.*')
            ->where('employee_id', $empId)
            ->orderBy('year', 'DESC')
            ->orderBy('month', 'DESC')
            ->findAll();
        $pendingAdvance = $this->payrollModel->getPendingAdvanceForEmployee($empId);
        $holdSummary = (new HoldSalaryModel())->getHoldSummaryForEmployee($empId);
        $holdReleases = (new HoldSalaryModel())->getReleaseHistory($empId);

        $badges = $this->getProfileBadgeData($employee);

        $data = [
            'title' => '',
            'employee' => $employee,
            'payrolls' => $payrolls,
            'pendingAdvance' => $pendingAdvance,
            'holdSummary' => $holdSummary,
            'holdReleases' => $holdReleases,
            'currentPayable' => $badges['currentPayable'],
            'pendingAdvanceRemaining' => $badges['pendingAdvanceRemaining'],
            'currentMonthOvertime' => $badges['currentMonthOvertime'],
            'currentMonthFine' => $badges['currentMonthFine'],
            'currentMonthPayrollPaid' => $badges['currentMonthPayrollPaid'],
            'holdPendingAmount' => $badges['holdPendingAmount'],
            'currentMonthPresentCount' => $badges['currentMonthPresentCount'],
        ];

        return view('employee/profile', $data);
    }

    public function create()
    {
        $data = [
            'title' => 'Add Employee'
        ];

        // Process form only when request is POST (form submit or AJAX POST)
        if ($this->request->is('post')) {
            $rules = $this->employeeModel->getValidationRules();
            $messages = $this->employeeModel->getValidationMessages();
            $flatMessages = [];
            foreach ($messages as $field => $fieldMessages) {
                foreach ($fieldMessages as $rule => $message) {
                    $flatMessages[$field . '.' . $rule] = $message;
                }
            }

            if ($this->validate($rules, $flatMessages)) {
                $employeeData = [
                    'name'           => trim((string) $this->request->getPost('name')),
                    'mobile'         => trim((string) $this->request->getPost('mobile')),
                    'alternate_mobile' => trim((string) $this->request->getPost('alternate_mobile')),
                    'father_name'    => trim((string) $this->request->getPost('father_name')),
                    'monthly_salary' => (float) $this->request->getPost('monthly_salary'),
                    'join_date'      => $this->request->getPost('join_date'),
                    'status'         => in_array($this->request->getPost('status'), ['active', 'inactive'], true)
                        ? $this->request->getPost('status')
                        : 'active',
                ];

                $saved = $this->employeeModel->save($employeeData);

                if ($saved) {
                    if ($this->request->isAJAX()) {
                        return $this->apiResponse([
                            'success' => true,
                            'message' => 'Employee added successfully',
                            'data' => [
                                'id' => (int) $this->employeeModel->getInsertID()
                            ]
                        ], 200);
                    }
                    return redirect()->to(base_url('employee'))->with('success', 'Employee added successfully');
                }

                $modelErrors = $this->employeeModel->errors();
                if ($this->request->isAJAX()) {
                    return $this->apiResponse([
                        'success' => false,
                        'message' => 'Failed to save employee. Please try again.',
                        'errors' => $modelErrors ?: ['general' => 'Database error occurred']
                    ], 400);
                }
                $data['validation'] = $this->validator;
                $data['error'] = 'Failed to save employee. Please try again.';
            } else {
                if ($this->request->isAJAX()) {
                    return $this->apiResponse([
                        'success' => false,
                        'message' => 'Please fix the validation errors below.',
                        'errors' => $this->validator->getErrors()
                    ], 422);
                }
                $data['validation'] = $this->validator;
            }
        }

        return view('employee/form', $data);
    }

    public function edit($id)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            if ($this->request->isAJAX()) {
                return $this->apiResponse([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Employee not found');
        }

        $data = [
            'title' => 'Edit Employee',
            'employee' => $employee
        ];

        // Process form only when request is POST (form submit or AJAX POST)
        if ($this->request->is('post')) {
            // Get validation rules and messages from model
            $rules = $this->employeeModel->getValidationRules();
            $messages = $this->employeeModel->getValidationMessages();
            
            // Flatten messages array for CodeIgniter validator
            $flatMessages = [];
            foreach ($messages as $field => $fieldMessages) {
                foreach ($fieldMessages as $rule => $message) {
                    $flatMessages[$field . '.' . $rule] = $message;
                }
            }
            
            if ($this->validate($rules, $flatMessages)) {
                $employeeData = [
                    'name'           => trim((string) $this->request->getPost('name')),
                    'mobile'         => trim((string) $this->request->getPost('mobile')),
                    'alternate_mobile' => trim((string) $this->request->getPost('alternate_mobile')),
                    'father_name'    => trim((string) $this->request->getPost('father_name')),
                    'monthly_salary' => (float) $this->request->getPost('monthly_salary'),
                    'join_date'      => $this->request->getPost('join_date'),
                    'status'         => in_array($this->request->getPost('status'), ['active', 'inactive'], true)
                        ? $this->request->getPost('status')
                        : 'active',
                ];

                $updated = $this->employeeModel->update($id, $employeeData);
                
                if ($updated) {
                    if ($this->request->isAJAX()) {
                        return $this->apiResponse([
                            'success' => true,
                            'message' => 'Employee updated successfully',
                            'data' => ['id' => (int) $id]
                        ], 200);
                    }
                    return redirect()->to(base_url('employee'))->with('success', 'Employee updated successfully');
                }

                $modelErrors = $this->employeeModel->errors();
                if ($this->request->isAJAX()) {
                    return $this->apiResponse([
                        'success' => false,
                        'message' => 'Failed to update employee. Please try again.',
                        'errors' => $modelErrors ?: ['general' => 'Database error occurred']
                    ], 400);
                }
                $data['validation'] = $this->validator;
                $data['error'] = 'Failed to update employee. Please try again.';
            } else {
                if ($this->request->isAJAX()) {
                    return $this->apiResponse([
                        'success' => false,
                        'message' => 'Please fix the validation errors below.',
                        'errors' => $this->validator->getErrors()
                    ], 422);
                }
                $data['validation'] = $this->validator;
            }
        }

        return view('employee/form', $data);
    }

    public function delete($id)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            return $this->apiResponse(['success' => false, 'message' => 'Employee not found'], 404);
        }
        $this->employeeModel->delete($id);
        return $this->apiResponse(['success' => true, 'message' => 'Employee deleted successfully'], 200);
    }

    public function toggleStatus($id)
    {
        $employee = $this->employeeModel->find($id);
        if (!$employee) {
            return $this->apiResponse(['success' => false, 'message' => 'Employee not found'], 404);
        }
        $newStatus = $employee['status'] === 'active' ? 'inactive' : 'active';
        $this->employeeModel->update($id, ['status' => $newStatus]);
        return $this->apiResponse([
            'success' => true,
            'message' => 'Employee status updated successfully',
            'data' => ['new_status' => $newStatus]
        ], 200);
    }
}
