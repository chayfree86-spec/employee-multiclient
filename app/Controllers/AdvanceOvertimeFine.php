<?php

namespace App\Controllers;

use App\Models\AdvanceOvertimeFineModel;
use App\Models\EmployeeModel;
use App\Models\PayrollModel;

class AdvanceOvertimeFine extends BaseController
{
    protected $model;
    protected $employeeModel;
    protected $payrollModel;

    public function __construct()
    {
        $this->model = new AdvanceOvertimeFineModel();
        $this->employeeModel = new EmployeeModel();
        $this->payrollModel = new PayrollModel();
    }

    /**
     * Check if payroll is already generated (locked) for a specific employee and date.
     */
    private function isPayrollLockedForEmployeeDate(int $employeeId, string $date): bool
    {
        $month = (int) date('n', strtotime($date));
        $year = (int) date('Y', strtotime($date));
        
        return $this->payrollModel
            ->where('employee_id', $employeeId)
            ->where('month', $month)
            ->where('year', $year)
            ->countAllResults() > 0;
    }

    public function index()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $month = $this->request->getGet('month');
        $year = $this->request->getGet('year');

        $list = $this->model->getList($month ? (int)$month : null, $year ? (int)$year : null);
        foreach ($list as &$row) {
            if (($row['type'] ?? '') === 'advance_paid' && preg_match('/payroll_id:(\d+)/', $row['notes'] ?? '', $m)) {
                $pr = $this->payrollModel->find((int) $m[1]);
                $row['month_name'] = $pr ? date('F Y', mktime(0, 0, 0, (int) $pr['month'], 1, (int) $pr['year'])) : null;
            }
        }
        unset($row);
        $data = [
            'title' => 'Advances, Overtime & Fines',
            'list' => $list,
            'month' => $month ? (int)$month : (int) date('n'),
            'year' => $year ? (int)$year : (int) date('Y'),
        ];

        return view('advance_overtime_fine/index', $data);
    }

    /**
     * View repayment status for all advances.
     */
    public function repayment()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $advances = $this->model->getAdvanceListForRepayment();
        $items = [];
        foreach ($advances as $adv) {
            $items[] = array_merge($adv, [
                'status' => AdvanceOvertimeFineModel::getAdvanceRepaymentStatus($adv)
            ]);
        }

        $data = [
            'title' => 'Advance Repayment Status',
            'items' => $items,
        ];

        return view('advance_overtime_fine/repayment', $data);
    }

    public function create()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $item = null;
        if ($this->request->is('get')) {
            $empId = (int) $this->request->getGet('employee_id');
            $type = $this->request->getGet('type');
            if ($empId || $type) {
                $item = [
                    'employee_id' => $empId ?: '',
                    'type' => in_array($type, ['advance', 'overtime', 'fine']) ? $type : '',
                ];
            }
        }

        $data = [
            'title' => 'Add Advance / Overtime / Fine',
            'employees' => $this->employeeModel->getActiveEmployees(),
            'today' => date('Y-m-d'),
            'item' => $item,
        ];

        if ($this->request->is('post')) {
            $isAJAX = $this->request->isAJAX();
            $date = $this->request->getPost('date');
            $employeeId = (int) $this->request->getPost('employee_id');
            $fromPayrollAdjust = (bool) $this->request->getPost('from_payroll_adjust');

            // Check Payroll Lock (skip when adding from Payroll Adjust - we sync after)
            if (!$fromPayrollAdjust && $employeeId && $this->isPayrollLockedForEmployeeDate($employeeId, $date)) {
                if ($isAJAX) {
                    return $this->response->setStatusCode(403)->setJSON([
                        'success' => false,
                        'message' => 'Cannot add: payroll for this employee has already been generated.'
                    ]);
                }
                return redirect()->back()
                    ->withInput()
                    ->with('error', 'Cannot add: payroll for this employee has already been generated.');
            }

            // Validation
            if (!$this->validate($this->model->getValidationRules())) {
                if ($isAJAX) {
                    return $this->response->setStatusCode(422)->setJSON([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors'  => $this->validator->getErrors()
                    ]);
                }
                $data['validation'] = $this->validator;
            } else {
                $type = $this->request->getPost('type');
                $repayMonths = ($type === 'advance') ? max(1, (int) $this->request->getPost('repay_months')) : 1;
                
                $saveData = [
                    'employee_id'  => $employeeId,
                    'date'         => $date,
                    'type'         => $type,
                    'amount'       => (float) $this->request->getPost('amount'),
                    'repay_months' => $repayMonths,
                    'notes'        => $this->request->getPost('notes'),
                ];

                if ($this->model->save($saveData)) {
                    if ($isAJAX) {
                        return $this->response->setJSON([
                            'success' => true,
                            'message' => 'Entry added successfully.'
                        ]);
                    }
                    return redirect()->to(base_url('advance-overtime-fine'))->with('success', 'Entry added successfully.');
                }

                if ($isAJAX) {
                    return $this->response->setStatusCode(500)->setJSON([
                        'success' => false,
                        'message' => 'Failed to save entry.'
                    ]);
                }
            }
            
            $data['item'] = [
                'employee_id' => $employeeId,
                'date' => $date,
                'type' => $this->request->getPost('type'),
                'amount' => $this->request->getPost('amount'),
                'repay_months' => $this->request->getPost('repay_months'),
                'notes' => $this->request->getPost('notes'),
            ];
        }

        return view('advance_overtime_fine/form', $data);
    }

    /**
     * Get single entry as JSON (for edit popup).
     */
    public function get($id)
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $item = $this->model->find($id);
        if (!$item) {
            return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Entry not found']);
        }
        return $this->response->setJSON(['success' => true, 'item' => $item]);
    }

    public function edit($id)
    {
        $item = $this->model->find($id);
        if (!$item) {
            if ($this->request->isAJAX()) {
                return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Entry not found']);
            }
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Entry not found');
        }

        $data = [
            'title' => 'Edit Entry',
            'employees' => $this->employeeModel->getActiveEmployees(),
            'item' => $item,
            'today' => date('Y-m-d'),
        ];

        if ($this->request->is('post')) {
            $date = $this->request->getPost('date');
            $employeeId = (int) $this->request->getPost('employee_id');

            // Check Payroll Lock
            if ($employeeId && $this->isPayrollLockedForEmployeeDate($employeeId, $date)) {
                if ($this->request->isAJAX()) {
                    return $this->response->setStatusCode(403)->setJSON(['success' => false, 'message' => 'Cannot edit: payroll for this month is generated.']);
                }
                return redirect()->back()
                    ->withInput()
                    ->with('error', 'Cannot edit: payroll for this employee has already been generated.');
            }

            if ($this->validate($this->model->getValidationRules())) {
                $type = $this->request->getPost('type');
                $repayMonths = ($type === 'advance') ? max(1, (int) $this->request->getPost('repay_months')) : 1;

                if ($this->model->update($id, [
                    'employee_id' => $employeeId,
                    'date' => $date,
                    'type' => $type,
                    'amount' => (float) $this->request->getPost('amount'),
                    'repay_months' => $repayMonths,
                    'notes' => $this->request->getPost('notes'),
                ])) {
                    if ($this->request->isAJAX()) {
                        return $this->response->setJSON(['success' => true, 'message' => 'Entry updated successfully.']);
                    }
                    return redirect()->to(base_url('advance-overtime-fine'))->with('success', 'Entry updated successfully.');
                }
            }
            if ($this->request->isAJAX()) {
                return $this->response->setStatusCode(422)->setJSON([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $this->validator->getErrors(),
                ]);
            }
            $data['validation'] = $this->validator;
            $data['item'] = array_merge($item, $this->request->getPost());
        }

        return view('advance_overtime_fine/form', $data);
    }

    /**
     * Get list + stats for an employee by type (advance/overtime/fine). Returns JSON for AJAX.
     */
    public function getListForEmployee($employeeId, $type)
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $employeeId = (int) $employeeId;
        $type = strtolower((string) $type);
        if (!in_array($type, ['advance', 'overtime', 'fine'], true)) {
            return $this->response->setStatusCode(400)->setJSON(['success' => false, 'message' => 'Invalid type']);
        }

        if ($type === 'advance') {
            $this->syncAdvanceRepaymentsFromPayroll($employeeId);
        }

        $entries = $this->model->getEntriesForEmployee($employeeId, $type);

        // Enrich advance_paid entries with payroll month for display
        if ($type === 'advance') {
            foreach ($entries as &$e) {
                if (($e['type'] ?? '') === 'advance_paid' && preg_match('/payroll_id:(\d+)/', $e['notes'] ?? '', $m)) {
                    $pr = $this->payrollModel->find((int) $m[1]);
                    $e['month_name'] = $pr ? date('F Y', mktime(0, 0, 0, (int) $pr['month'], 1, (int) $pr['year'])) : null;
                }
            }
            unset($e);
        }

        $total = match ($type) {
            'advance' => $this->model->getTotalAdvanceForEmployee($employeeId),
            'overtime' => $this->model->getTotalOvertimeForEmployee($employeeId),
            'fine' => $this->model->getTotalFineForEmployee($employeeId),
            default => 0,
        };

        $paid = match ($type) {
            'advance' => $this->payrollModel->getTotalAdvanceDeductionForEmployee($employeeId),
            'overtime' => $this->payrollModel->getTotalOvertimeForEmployee($employeeId),
            'fine' => $this->payrollModel->getTotalFineForEmployee($employeeId),
            default => 0,
        };

        $pending = round(max(0, $total - $paid), 2);
        $total = round($total, 2);
        $paid = round($paid, 2);

        $applyAdvance = null;
        if ($type === 'advance') {
            $payrolls = $this->payrollModel->select('id, month, year, paid')
                ->where('employee_id', $employeeId)
                ->orderBy('year', 'DESC')->orderBy('month', 'DESC')
                ->findAll();
            $applyAdvance = [
                'eligible' => $pending,
                'payrolls' => array_map(function ($p) {
                    return [
                        'id' => $p['id'],
                        'month' => $p['month'],
                        'year' => $p['year'],
                        'month_name' => date('F Y', mktime(0, 0, 0, $p['month'], 1, $p['year'])),
                        'paid' => !empty($p['paid']),
                    ];
                }, $payrolls),
            ];
        }

        return $this->response->setJSON([
            'success' => true,
            'entries' => $entries,
            'stats' => ['total' => $total, 'paid' => $paid, 'pending' => $pending],
            'applyAdvance' => $applyAdvance,
        ]);
    }

    /**
     * Sync advance_paid records from payroll. For payrolls with advance_deduction > 0
     * but no matching advance_paid, create the record so -amount shows in the list.
     */
    private function syncAdvanceRepaymentsFromPayroll(int $employeeId): void
    {
        $payrolls = $this->payrollModel->where('employee_id', $employeeId)
            ->where('advance_deduction >', 0)
            ->findAll();

        foreach ($payrolls as $pr) {
            $payrollId = (int) $pr['id'];
            $amount = (float) ($pr['advance_deduction'] ?? 0);
            if ($amount <= 0) continue;

            $existing = $this->model->where('employee_id', $employeeId)
                ->where('type', 'advance_paid')
                ->like('notes', 'payroll_id:' . $payrollId)
                ->first();
            if ($existing) continue;

            $date = $pr['year'] . '-' . str_pad($pr['month'], 2, '0', STR_PAD_LEFT) . '-01';
            $this->model->insert([
                'employee_id' => $employeeId,
                'date' => $date,
                'type' => 'advance_paid',
                'amount' => $amount,
                'repay_months' => 1,
                'notes' => 'payroll_id:' . $payrollId,
            ]);
        }
    }

    /**
     * Check if payroll is locked for a given employee and month/year (for AJAX).
     */
    public function checkPayrollLock()
    {
        $month = (int) $this->request->getGet('month');
        $year = (int) $this->request->getGet('year');
        $employeeId = (int) $this->request->getGet('employee_id');
        $locked = false;
        if ($month >= 1 && $month <= 12 && $year >= 2000 && $employeeId > 0) {
            $locked = $this->payrollModel->hasPayrollForEmployeeMonth($employeeId, $month, $year);
        }
        return $this->response->setJSON(['locked' => $locked]);
    }

    public function delete($id)
    {
        $item = $this->model->find($id);
        if (!$item) {
            if ($this->request->isAJAX()) {
                return $this->response->setStatusCode(404)->setJSON(['success' => false, 'message' => 'Entry not found']);
            }
            return redirect()->to(base_url('advance-overtime-fine'))->with('error', 'Entry not found');
        }

        if (($item['type'] ?? '') === 'advance_paid') {
            $notes = $item['notes'] ?? '';
            if (preg_match('/payroll_id:(\d+)/', $notes, $m)) {
                $payrollId = (int) $m[1];
                $payroll = $this->payrollModel->find($payrollId);
                if ($payroll) {
                    $amount = (float) ($item['amount'] ?? 0);
                    $currentDed = (float) ($payroll['advance_deduction'] ?? 0);
                    $newDed = max(0, $currentDed - $amount);
                    $baseSalary = (float) $payroll['base_salary'];
                    $settingsModel = new \App\Models\SettingsModel();
                    $daysDivisor = (int)($payroll['days_divisor'] ?? 0) ?: $settingsModel->getDaysDivisor((int)$payroll['month'], (int)$payroll['year']);
                    $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
                    $dailySalary = $baseSalary / $daysDivisor;

                    if ($payrollMode === 'monthly') {
                        $salaryFromAttendance = $baseSalary - ($payroll['absent_days'] * $dailySalary) - ($payroll['half_days'] * $dailySalary * 0.5) - (($payroll['weekend_absent_days'] ?? 0) * $dailySalary);
                    } else {
                        $salaryFromAttendance = ($payroll['present_days'] * $dailySalary) + ($payroll['half_days'] * $dailySalary * 0.5);
                    }
                    $weekendHolidayAmount = ($payrollMode === 'monthly') ? 0 : (float)($payroll['weekend_holiday_amount'] ?? 0);
                    $totalSalary = max(0, round($salaryFromAttendance + $weekendHolidayAmount + (float) $payroll['overtime'] - (float) $payroll['fine'] - $newDed, 2));
                    $this->payrollModel->update($payrollId, [
                        'advance_deduction' => $newDed,
                        'total_salary' => $totalSalary,
                    ]);
                }
            }
        } else {
            if ($this->isPayrollLockedForEmployeeDate($item['employee_id'], $item['date'])) {
                if ($this->request->isAJAX()) {
                    return $this->response->setStatusCode(403)->setJSON(['success' => false, 'message' => 'Cannot delete: payroll for this month is generated.']);
                }
                return redirect()->to(base_url('advance-overtime-fine'))->with('error', 'Cannot delete: payroll for this employee has already been generated.');
            }
        }

        $this->model->delete($id);
        if ($this->request->isAJAX()) {
            return $this->response->setJSON(['success' => true, 'message' => 'Entry deleted successfully.']);
        }
        return redirect()->to(base_url('advance-overtime-fine'))->with('success', 'Entry deleted successfully.');
    }
}
