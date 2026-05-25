<?php

namespace App\Controllers;

use App\Models\EmployeeModel;
use App\Models\PayrollModel;
use App\Models\PaymentModel;
use App\Models\AdvanceOvertimeFineModel;
use App\Models\HoldSalaryModel;
use TCPDF;

class Payroll extends BaseController
{
    protected $employeeModel;
    protected $payrollModel;
    protected $paymentModel;

    public function __construct()
    {
        $this->employeeModel = new EmployeeModel();
        $this->payrollModel = new PayrollModel();
        $this->paymentModel = new PaymentModel();
    }

    public function index()
    {
        $prevMonth = (int) date('n') - 1;
        $prevYear = (int) date('Y');
        if ($prevMonth < 1) {
            $prevMonth = 12;
            $prevYear--;
        }
        $month = (int) ($this->request->getGet('month') ?: $prevMonth);
        $year = (int) ($this->request->getGet('year') ?: $prevYear);

        if ($this->request->getGet('export') === 'pdf') {
            $payrolls = $this->payrollModel->select('payroll.*, employees.name, employees.mobile')
                                          ->join('employees', 'employees.id = payroll.employee_id')
                                          ->where('month', $month)
                                          ->where('year', $year)
                                          ->findAll();
            return $this->exportPayrollPDF($payrolls, $month, $year);
        }

        $payrolls = $this->payrollModel->select('payroll.*, employees.name, employees.mobile')
                                      ->join('employees', 'employees.id = payroll.employee_id')
                                      ->where('month', $month)
                                      ->where('year', $year)
                                      ->findAll();

        $employeeIds = array_column($payrolls, 'employee_id');
        $pendingAdvances = $this->payrollModel->getPendingAdvanceForEmployees($employeeIds);

        $data = [
            'title' => 'Payroll Management',
            'payrolls' => $payrolls,
            'pendingAdvances' => $pendingAdvances,
            'month' => $month,
            'year' => $year,
            'hasPayroll' => count($payrolls) > 0,
            'activeEmployees' => $this->employeeModel->getActiveEmployees(),
        ];

        return view('payroll/index', $data);
    }

    public function deleteMonth()
    {
        if (!$this->request->is('post')) {
            return redirect()->to('payroll')->with('error', 'Invalid request');
        }

        $month = $this->request->getPost('month') ?: date('m');
        $year = $this->request->getPost('year') ?: date('Y');

        $deleted = $this->payrollModel->deleteMonth($month, $year);

        if ($deleted > 0) {
            return redirect()->to(base_url('payroll?month=' . $month . '&year=' . $year))
                            ->with('success', $deleted . ' payroll record(s) deleted successfully');
        }

        return redirect()->to(base_url('payroll?month=' . $month . '&year=' . $year))
                        ->with('info', 'No payroll records found for the selected month');
    }

    public function deleteEmployee($id)
    {
        if (!$this->request->is('post')) {
            return redirect()->to('payroll')->with('error', 'Invalid request');
        }

        $payroll = $this->payrollModel->find($id);
        if (!$payroll) {
            return redirect()->to('payroll')->with('error', 'Payroll record not found');
        }

        $month = $payroll['month'];
        $year  = $payroll['year'];
        $this->payrollModel->delete($id);

        return redirect()->to(base_url('payroll?month=' . $month . '&year=' . $year))
                        ->with('success', 'Payroll for employee deleted successfully');
    }

    /**
     * Release hold salary into a pending payroll. Only pending (unpaid) payrolls allowed.
     */
    public function releaseHold()
    {
        if (!$this->request->is('post')) {
            return $this->response->setJSON(['success' => false, 'message' => 'Invalid request']);
        }

        $employeeId = (int) $this->request->getPost('employee_id');
        $payrollId = (int) $this->request->getPost('payroll_id');

        if (!$employeeId || !$payrollId) {
            return $this->response->setJSON(['success' => false, 'message' => 'Employee and payroll required']);
        }

        $payroll = $this->payrollModel->find($payrollId);
        if (!$payroll || (int) $payroll['employee_id'] !== $employeeId) {
            return $this->response->setJSON(['success' => false, 'message' => 'Payroll not found']);
        }

        if (!empty($payroll['paid'])) {
            return $this->response->setJSON(['success' => false, 'message' => 'Hold can only be released into pending payroll. This payroll is already paid.']);
        }

        $holdModel = new HoldSalaryModel();
        $summary = $holdModel->getHoldSummaryForEmployee($employeeId);
        if (!$summary['has_hold'] || $summary['remaining_amount'] <= 0) {
            return $this->response->setJSON(['success' => false, 'message' => 'No active hold salary for this employee']);
        }

        $amount = $summary['remaining_amount'];
        $ok = $holdModel->releaseAllIntoPayroll($employeeId, $payrollId);

        if ($ok) {
            return $this->response->setJSON([
                'success' => true,
                'message' => 'Hold amount ₹' . number_format($amount, 0) . ' released into ' . date('F Y', mktime(0, 0, 0, $payroll['month'], 1, $payroll['year'])),
            ]);
        }

        return $this->response->setJSON(['success' => false, 'message' => 'Release failed']);
    }

    private function exportPayrollPDF($payrolls, $month, $year)
    {
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        $pdf->SetCreator('Chay Chaupal');
        $pdf->SetAuthor('Chay Chaupal');
        $pdf->SetTitle('Payroll List - ' . date('F Y', mktime(0, 0, 0, $month, 1, $year)));

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 15);
        $pdf->AddPage();

        // Professional Header
        $logoPath = FCPATH . 'public/images/logo-chaychaupal.png';
        if (is_file($logoPath)) {
            $pdf->Image($logoPath, 15, 5, 20, 0, 'PNG');
        }
        $pdf->SetY(5);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, 'CHAY CHAUPAL', 0, 1, 'R');
        $pdf->SetFont('helvetica', '', 7);
        $pdf->Cell(0, 4, 'Report: ' . date('F Y', mktime(0, 0, 0, $month, 1, $year)), 0, 1, 'R');
        $pdf->Ln(2);
        $pdf->Line(10, $pdf->GetY(), 200, $pdf->GetY());
        $pdf->Ln(3);

        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->SetFillColor(245, 244, 242);
        $pdf->Cell(0, 8, ' PAYROLL MANAGEMENT LIST: ' . strtoupper(date('F Y', mktime(0, 0, 0, $month, 1, $year))), 0, 1, 'L', true);
        $pdf->Ln(2);

        $html = '<table cellpadding="4" border="1" style="border-color: #ddd; font-size: 7.5px; text-align: center;">
            <tr style="background-color: #42291e; color: #ffffff; font-weight: bold;">
                <td width="20%">Employee</td>
                <td width="12%">Base Salary</td>
                <td width="12%">Actual Salary</td>
                <td width="11%">Hold Ded.</td>
                <td width="12%">Advance Ded.</td>
                <td width="13%">Payable</td>
                <td width="10%">Status</td>
            </tr>';

        $totalBase = 0; $totalActual = 0; $totalHold = 0; $totalAdv = 0; $totalPayable = 0;

        foreach ($payrolls as $payroll) {
            $holdDed = (float)($payroll['hold_deduction'] ?? 0);
            $fine = (float)($payroll['fine'] ?? 0);
            $advDed = (float)($payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0);
            $actual = (float)($payroll['total_salary'] ?? 0) + $holdDed + $advDed + $fine;
            
            $totalBase += (float)$payroll['base_salary'];
            $totalActual += $actual;
            $totalHold += $holdDed;
            $totalAdv += $advDed;
            $totalPayable += (float)$payroll['total_salary'];

            $html .= '<tr>
                <td align="left"><strong>' . htmlspecialchars($payroll['name'] ?? '') . '</strong><br/><small>' . htmlspecialchars($payroll['mobile'] ?? '-') . '</small></td>
                <td>&#8377;' . number_format($payroll['base_salary'], 0) . '</td>
                <td>&#8377;' . number_format($actual, 0) . '</td>
                <td>&#8377;' . number_format($holdDed, 0) . '</td>
                <td>&#8377;' . number_format($advDed, 0) . '</td>
                <td style="font-weight: bold; background-color: #fefce8;">&#8377;' . number_format($payroll['total_salary'], 0) . '</td>
                <td>' . ($payroll['paid'] ? '<span style="color: green;">Paid</span>' : '<span style="color: #ca8a04;">Pending</span>') . '</td>
            </tr>';
        }

        $html .= '<tr style="background-color: #f8f9fa; font-weight: bold;">
            <td align="right">TOTAL</td>
            <td>&#8377;' . number_format($totalBase, 0) . '</td>
            <td>&#8377;' . number_format($totalActual, 0) . '</td>
            <td>&#8377;' . number_format($totalHold, 0) . '</td>
            <td>&#8377;' . number_format($totalAdv, 0) . '</td>
            <td style="background-color: #fefce8;">&#8377;' . number_format($totalPayable, 0) . '</td>
            <td></td>
        </tr>';

        $html .= '</table>';

        $pdf->writeHTML($html, true, false, true, false, '');

        // Audit Trail
        $pdf->Ln(5);
        $pdf->SetFont('helvetica', 'I', 6);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 5, 'Generated on ' . date('d-m-Y H:i') . ' by Chay Chaupal', 0, 0, 'C');

        $pdf->Output('Payroll_Report_' . $month . '_' . $year . '.pdf', 'D');
        exit();
    }

    public function salarySlip($id)
    {
        $payroll = $this->payrollModel->select('payroll.*, employees.name, employees.mobile')
                                     ->join('employees', 'employees.id = payroll.employee_id')
                                     ->where('payroll.id', $id)
                                     ->first();

        if (!$payroll) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Payroll not found');
        }

        return $this->exportSalarySlipPDF($payroll);
    }

    private function exportSalarySlipPDF($payroll)
    {
        $attendanceModel = new \App\Models\AttendanceModel();
        $employeeModel = new \App\Models\EmployeeModel();
        $employee = $employeeModel->find($payroll['employee_id']);
        $month = (int) $payroll['month'];
        $year = (int) $payroll['year'];
        $attendance = $attendanceModel->getMonthlyAttendanceEnriched($payroll['employee_id'], $month, $year, $employee['join_date'] ?? null);
        
        // Map attendance for calendar
        $attMap = [];
        foreach ($attendance as $att) {
            $d = $att['date'];
            $status = $att['status'] ?? 'not_marked';
            $attMap[(int)date('j', strtotime($d))] = $status;
        }

        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        $pdf->SetCreator('Chay Chaupal');
        $pdf->SetAuthor('Admin');
        $pdf->SetTitle('Salary Slip - ' . ($payroll['name'] ?? 'Employee') . ' - ' . date('F Y', mktime(0, 0, 0, $month, 1, $year)));
        $pdf->SetSubject('Salary Slip');

        // Set font to dejavusans for better UTF8 support
        $pdf->SetFont('dejavusans', '', 10);

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(15, 10, 15);
        $pdf->SetAutoPageBreak(true, 10);
        $pdf->AddPage();

        $logoPath = FCPATH . 'public/images/logo-chaychaupal.png';
        if (is_file($logoPath)) {
            $pdf->Image($logoPath, 85, 8, 40, 0, 'PNG');
            $pdf->SetY(32);
        }

        $monthYear = date('F Y', mktime(0, 0, 0, $month, 1, $year));
        $advanceDed = (float)($payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0);
        $holdDed = (float)($payroll['hold_deduction'] ?? 0);
        $fine = (float)($payroll['fine'] ?? 0);
        $overtime = (float)($payroll['overtime'] ?? 0);
        $netSalary = (float)($payroll['total_salary'] ?? 0);
        $holdReleased = (float) ($payroll['hold_salary_released'] ?? 0);
        $whAmount = (float) ($payroll['weekend_holiday_amount'] ?? 0);
        $baseSalary = (float)($payroll['base_salary'] ?? 0);
        
        // Calculate Actual (Gross) Salary
        $actualEarnings = $netSalary + $fine + $advanceDed + $holdDed;

        $html = '<h1 style="text-align: center; color: #333; margin-bottom: 0;">SALARY SLIP</h1>';
        $html .= '<h3 style="text-align: center; color: #666; font-weight: normal; margin-top: 0;">' . htmlspecialchars($monthYear) . '</h3>';
        $html .= '<hr color="#eee">';
        
        $html .= '<table border="0" cellpadding="4" width="100%">';
        $html .= '<tr>';
        $html .= '<td width="55%"><strong>Employee Name:</strong> ' . htmlspecialchars($payroll['name'] ?? '') . '</td>';
        $html .= '<td width="45%"><strong>Mobile:</strong> ' . htmlspecialchars($payroll['mobile'] ?? '-') . '</td>';
        $html .= '</tr>';
        $html .= '<tr>';
        $html .= '<td><strong>Base Salary:</strong> Rs. ' . number_format($baseSalary, 0) . '</td>';
        $html .= '<td><strong>Actual (Gross) Salary:</strong> Rs. ' . number_format($actualEarnings, 0) . '</td>';
        $html .= '</tr>';
        $html .= '</table>';
        
        $html .= '<br>';
        $html .= '<table border="1" cellpadding="6" width="100%" style="border-collapse: collapse;">';
        $html .= '<tr style="background-color:#f8f9fa;"><th width="65%"><strong>Earnings & Deductions Component</strong></th><th width="35%" style="text-align:right;"><strong>Amount (Rs.)</strong></th></tr>';
        
        // Basic Earnings Breakup
        $earnedSalary = $actualEarnings - $whAmount - $overtime - $holdReleased;
        $html .= '<tr><td>Actual Salary</td><td style="text-align:right;">' . number_format($earnedSalary, 0) . '</td></tr>';
        $html .= '<tr><td>Weekend Holiday Amount</td><td style="text-align:right;">' . number_format($whAmount, 0) . '</td></tr>';
        $html .= '<tr><td>Overtime</td><td style="text-align:right;">' . number_format($overtime, 0) . '</td></tr>';
        $html .= '<tr><td>Hold Salary Released</td><td style="text-align:right;">' . number_format($holdReleased, 0) . '</td></tr>';
        
        $html .= '<tr style="background-color:#fcfcfc;"><td><strong>Total Actual Salary</strong></td><td style="text-align:right;"><strong>' . number_format($actualEarnings, 0) . '</strong></td></tr>';

        // Deductions Breakup
        $html .= '<tr><td>Fine (Deduction)</td><td style="text-align:right; color: #cc0000;">' . ($fine > 0 ? '-' : '') . number_format($fine, 0) . '</td></tr>';
        $html .= '<tr><td>Advance Deduction</td><td style="text-align:right; color: #cc0000;">' . ($advanceDed > 0 ? '-' : '') . number_format($advanceDed, 0) . '</td></tr>';
        $html .= '<tr><td>Hold Salary Deduction</td><td style="text-align:right; color: #cc0000;">' . ($holdDed > 0 ? '-' : '') . number_format($holdDed, 0) . '</td></tr>';
        
        $payrollModel = new \App\Models\PayrollModel();
        $pendingInfo = $payrollModel->getPendingAdvanceForEmployee((int) $payroll['employee_id']);
        $advanceBalance = $pendingInfo['remaining'] ?? 0;
        $html .= '<tr><td>Advance Balance (Remaining)</td><td style="text-align:right; color: #333;">' . number_format($advanceBalance, 0) . '</td></tr>';
        
        $html .= '<tr style="background-color:#e9ecef;"><td style="font-size: 1.1em;"><strong>Net Payable Salary</strong></td><td style="text-align:right; font-size: 1.1em;"><strong>Rs. ' . number_format($netSalary, 0) . '</strong></td></tr>';
        $html .= '</table>';

        // Attendance Stats
        $whDays = (int) ($payroll['weekend_holiday_days'] ?? 0);
        $html .= '<br><table border="0" cellpadding="2" width="100%" style="font-size: 9px;">';
        $html .= '<tr>';
        $html .= '<td><strong>Present:</strong> ' . ($payroll['present_days'] ?? 0) . '</td>';
        $html .= '<td><strong>Half Day:</strong> ' . ($payroll['half_days'] ?? 0) . '</td>';
        $html .= '<td><strong>Absent:</strong> ' . ($payroll['absent_days'] ?? 0) . '</td>';
        $html .= '<td><strong>Paid Weekend:</strong> ' . $whDays . '</td>';
        $html .= '</tr>';
        $html .= '</table>';

        // Attendance Calendar
        $html .= '<br><h3 style="text-align: center; color: #333; margin-bottom: 5px;">ATTENDANCE CALENDAR</h3>';
        
        $daysInMonth = (int)date('t', mktime(0, 0, 0, $month, 1, $year));
        $firstDayOfWeek = (int)date('w', mktime(0, 0, 0, $month, 1, $year));
        
        $html .= '<table border="1" cellpadding="4" style="text-align: center; border-collapse: collapse; width: 100%; border: 1px solid #ddd;">';
        $html .= '<tr style="background-color: #f0f0f0; font-weight: bold;">';
        $html .= '<th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>';
        $html .= '</tr>';
        
        $day = 1;
        $html .= '<tr>';
        for ($i = 0; $i < 7; $i++) {
            if ($i < $firstDayOfWeek) {
                $html .= '<td style="background-color: #f9f9f9;"></td>';
            } else {
                $status = $attMap[$day] ?? 'not_marked';
                $bgColor = '#ffffff'; $textColor = '#333333';
                
                if ($status === 'present') { $bgColor = '#22c55e'; $textColor = '#ffffff'; }
                elseif ($status === 'absent') { $bgColor = '#ef4444'; $textColor = '#ffffff'; }
                elseif ($status === 'half_day') { $bgColor = '#f59e0b'; $textColor = '#ffffff'; }
                elseif ($status === 'weekend') { $bgColor = '#4b5563'; $textColor = '#ffffff'; } // Dark gray instead of black
                elseif ($status === 'holiday') { $bgColor = '#3b82f6'; $textColor = '#ffffff'; }
                else { $bgColor = '#f1f5f9'; $textColor = '#94a3b8'; }
                
                $html .= '<td style="background-color: ' . $bgColor . '; color: ' . $textColor . ';">' . $day . '</td>';
                $day++;
            }
        }
        $html .= '</tr>';
        
        while ($day <= $daysInMonth) {
            $html .= '<tr>';
            for ($i = 0; $i < 7; $i++) {
                if ($day <= $daysInMonth) {
                    $status = $attMap[$day] ?? 'not_marked';
                    $bgColor = '#ffffff'; $textColor = '#333333';
                    
                    if ($status === 'present') { $bgColor = '#22c55e'; $textColor = '#ffffff'; }
                    elseif ($status === 'absent') { $bgColor = '#ef4444'; $textColor = '#ffffff'; }
                    elseif ($status === 'half_day') { $bgColor = '#f59e0b'; $textColor = '#ffffff'; }
                    elseif ($status === 'weekend') { $bgColor = '#4b5563'; $textColor = '#ffffff'; }
                    elseif ($status === 'holiday') { $bgColor = '#3b82f6'; $textColor = '#ffffff'; }
                    else { $bgColor = '#f1f5f9'; $textColor = '#94a3b8'; }
                    
                    $html .= '<td style="background-color: ' . $bgColor . '; color: ' . $textColor . ';">' . $day . '</td>';
                    $day++;
                } else {
                    $html .= '<td style="background-color: #f9f9f9;"></td>';
                }
            }
            $html .= '</tr>';
        }
        $html .= '</table>';
        
        // Legend with safe dots instead of squares
        $html .= '<div style="font-size: 8px; margin-top: 5px; text-align: center;">';
        $html .= '<span style="color: #22c55e;">● Present</span> &nbsp; &nbsp; ';
        $html .= '<span style="color: #f59e0b;">● Half Day</span> &nbsp; &nbsp; ';
        $html .= '<span style="color: #ef4444;">● Absent</span> &nbsp; &nbsp; ';
        $html .= '<span style="color: #4b5563;">● Weekend (Tue)</span> &nbsp; &nbsp; ';
        $html .= '<span style="color: #3b82f6;">● Holiday</span>';
        $html .= '</div>';
        
        $html .= '<br><br><br>';
        $html .= '<table border="0" cellpadding="4" width="100%">';
        $html .= '<tr>';
        $html .= '<td style="text-align: left;">____________________<br>Employee Signature</td>';
        $html .= '<td style="text-align: right;">____________________<br>Authorized Signatory</td>';
        $html .= '</tr>';
        $html .= '</table>';
        
        $html .= '<div style="text-align: center; font-size: 8px; color: #999; margin-top: 20px;">';
        $html .= 'Generated on ' . date('d-m-Y H:i') . ' by Chay Chaupal';
        $html .= '</div>';

        $pdf->writeHTML($html, true, false, true, false, '');
        $filename = 'salary_slip_' . preg_replace('/[^a-zA-Z0-9]/', '_', $payroll['name'] ?? 'employee') . '_' . $month . '_' . $year . '.pdf';
        $pdf->Output($filename, 'D');
    }

    public function generate()
    {
        $month = $this->request->getPost('month') ?: date('m');
        $year = $this->request->getPost('year') ?: date('Y');
        $employeeId = $this->request->getPost('employee_id') ? (int) $this->request->getPost('employee_id') : null;

        $generated = $this->payrollModel->generateMonthlyPayroll($month, $year, $employeeId);

        return redirect()->to(base_url('payroll?month=' . $month . '&year=' . $year))
                        ->with('success', $generated . ' payroll record(s) generated successfully');
    }

    public function edit($id)
    {
        $payroll = $this->payrollModel->find($id);
        if (!$payroll) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Payroll not found');
        }

        // One-time sync: if this payroll has linked hold_salary but hold_deduction is 0, set hold_deduction and reduce total_salary
        $holdDed = (float) ($payroll['hold_deduction'] ?? 0);
        if ($holdDed === 0.0) {
            $holdModel = new HoldSalaryModel();
            $holdAmount = $holdModel->getHoldAmountForPayrollId((int) $id);
            if ($holdAmount > 0) {
                $currentTotal = (float) ($payroll['total_salary'] ?? 0);
                $this->payrollModel->skipValidation(true)->update($id, [
                    'hold_deduction' => $holdAmount,
                    'total_salary' => max(0, round($currentTotal - $holdAmount, 2)),
                ]);
                $payroll = $this->payrollModel->find($id);
            }
        }

        $employee = $this->employeeModel->find($payroll['employee_id']);

        $data = [
            'title' => 'Edit Payroll',
            'payroll' => $payroll,
            'employee' => $employee
        ];

        if ($this->request->is('post')) {
            $rules = [
                'overtime' => 'required|numeric|greater_than_equal_to[0]',
                'fine' => 'required|numeric|greater_than_equal_to[0]',
                'advance_deduction' => 'required|numeric|greater_than_equal_to[0]'
            ];

            if ($this->validate($rules)) {
                $overtime = $this->request->getPost('overtime');
                $fine = $this->request->getPost('fine');
                $advanceDeduction = $this->request->getPost('advance_deduction');

                // Recalculate total salary (including weekend holiday amount, hold released, minus hold deduction)
                $baseSalary = $payroll['base_salary'];
                $settingsModel = new \App\Models\SettingsModel();
                $daysDivisor = (int)($payroll['days_divisor'] ?? 0) ?: $settingsModel->getDaysDivisor((int)$payroll['month'], (int)$payroll['year']);
                $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
                $dailySalary = $baseSalary / $daysDivisor;

                if ($payrollMode === 'monthly') {
                    $salaryFromAttendance = $baseSalary - ($payroll['absent_days'] * $dailySalary) - ($payroll['half_days'] * $dailySalary * 0.5) - (($payroll['weekend_absent_days'] ?? 0) * $dailySalary);
                    $weekendHolidayAmount = 0;
                } else {
                    $salaryFromAttendance = ($payroll['present_days'] * $dailySalary) + ($payroll['half_days'] * $dailySalary * 0.5);
                    $weekendHolidayAmount = (float) ($payroll['weekend_holiday_amount'] ?? 0);
                }

                $holdSalaryReleased = (float) ($payroll['hold_salary_released'] ?? 0);
                $holdDeduction = (float) ($payroll['hold_deduction'] ?? 0);
                $totalSalary = $salaryFromAttendance + $weekendHolidayAmount + $holdSalaryReleased - $holdDeduction + $overtime - $fine - $advanceDeduction;

                $this->payrollModel->update($id, [
                    'overtime' => $overtime,
                    'fine' => $fine,
                    'advance_deduction' => $advanceDeduction,
                    'total_salary' => max(0, $totalSalary)
                ]);

                return redirect()->to('payroll')->with('success', 'Payroll updated successfully');
            } else {
                $data['validation'] = $this->validator;
            }
        }

        return view('payroll/form', $data);
    }

    public function togglePaid($id)
    {
        $payroll = $this->payrollModel->find($id);
        if (!$payroll) {
            return $this->response->setJSON(['success' => false, 'message' => 'Payroll not found']);
        }

        $newPaid = $payroll['paid'] ? 0 : 1;
        $this->payrollModel->update($id, ['paid' => $newPaid]);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Payroll status updated successfully',
            'new_paid' => $newPaid
        ]);
    }

    /**
     * Apply custom advance deduction for this payroll row.
     * Expects POST amount; recalculates total_salary.
     */
    public function applyAdvance($id)
    {
        if (!$this->request->is('post')) {
            return $this->response->setJSON(['success' => false, 'message' => 'Invalid request']);
        }

        $payroll = $this->payrollModel->find($id);
        if (!$payroll) {
            return $this->response->setJSON(['success' => false, 'message' => 'Payroll not found']);
        }

        $amount = $this->request->getPost('amount');
        if ($amount === null || $amount === '') {
            return $this->response->setJSON(['success' => false, 'message' => 'Amount is required']);
        }
        $advanceToAdd = (float) $amount;
        if ($advanceToAdd < 0) {
            return $this->response->setJSON(['success' => false, 'message' => 'Amount must be 0 or more']);
        }
        $pending = $this->payrollModel->getPendingAdvanceForEmployee((int) $payroll['employee_id']);
        $eligible = (float) $pending['remaining'];
        if ($advanceToAdd > $eligible) {
            return $this->response->setJSON(['success' => false, 'message' => 'Amount cannot exceed eligible Rs. ' . number_format($eligible, 0)]);
        }

        $currentAdvance = (float) ($payroll['advance_deduction'] ?? 0);
        $newAdvanceTotal = $currentAdvance + $advanceToAdd;

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
        $totalSalary = $salaryFromAttendance + (float) ($payroll['weekend_holiday_amount'] ?? 0) + (float) $payroll['overtime'] - (float) $payroll['fine'] - $newAdvanceTotal;

        $this->payrollModel->update($id, [
            'advance_deduction' => $newAdvanceTotal,
            'total_salary' => max(0, round($totalSalary, 2)),
        ]);

        $payrollDate = $payroll['year'] . '-' . str_pad($payroll['month'], 2, '0', STR_PAD_LEFT) . '-01';
        $aofModel = new AdvanceOvertimeFineModel();
        $aofModel->insert([
            'employee_id' => $payroll['employee_id'],
            'date' => $payrollDate,
            'type' => 'advance_paid',
            'amount' => $advanceToAdd,
            'repay_months' => 1,
            'notes' => 'payroll_id:' . $id,
        ]);

        $updated = $this->payrollModel->find($id);
        $newPending = $this->payrollModel->getPendingAdvanceForEmployee((int) $payroll['employee_id']);
        $eligible = (float) ($newPending['remaining'] ?? 0);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Advance deduction applied (Rs. ' . number_format($advanceToAdd, 0) . ')',
            'payroll' => [
                'advance_deduction' => (float) ($updated['advance_deduction'] ?? 0),
                'hold_deduction' => (float) ($updated['hold_deduction'] ?? 0),
                'total_salary' => (float) ($updated['total_salary'] ?? 0),
                'eligible' => $eligible,
            ],
        ]);
    }

    /**
     * Sync payroll row with AOF totals for overtime/fine (after adding AOF from Adjust popup).
     */
    public function syncAof($id)
    {
        $payroll = $this->payrollModel->find($id);
        if (!$payroll) {
            return $this->response->setJSON(['success' => false, 'message' => 'Payroll not found']);
        }
        $aofModel = new AdvanceOvertimeFineModel();
        $sums = $aofModel->getSumsForEmployeeMonth(
            (int) $payroll['employee_id'],
            (int) $payroll['month'],
            (int) $payroll['year']
        );
        $overtime = $sums['overtime'];
        $fine = $sums['fine'];
        $advanceDeduction = (float) ($payroll['advance_deduction'] ?? 0);
        $baseSalary = (float) $payroll['base_salary'];
        $settingsModel = new \App\Models\SettingsModel();
        $daysDivisor = (int)($payroll['days_divisor'] ?? 0) ?: $settingsModel->getDaysDivisor((int)$payroll['month'], (int)$payroll['year']);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        $dailySalary = $baseSalary / $daysDivisor;

        if ($payrollMode === 'monthly') {
            $salaryFromAttendance = $baseSalary - ($payroll['absent_days'] * $dailySalary) - ($payroll['half_days'] * $dailySalary * 0.5) - (($payroll['weekend_absent_days'] ?? 0) * $dailySalary);
            $weekendHolidayAmount = 0;
        } else {
            $salaryFromAttendance = ($payroll['present_days'] * $dailySalary) + ($payroll['half_days'] * $dailySalary * 0.5);
            $weekendHolidayAmount = (float) ($payroll['weekend_holiday_amount'] ?? 0);
        }

        $holdSalaryReleased = (float) ($payroll['hold_salary_released'] ?? 0);
        $totalSalary = max(0, round($salaryFromAttendance + $weekendHolidayAmount + $holdSalaryReleased + $overtime - $fine - $advanceDeduction, 2));

        $this->payrollModel->update($id, [
            'overtime' => $overtime,
            'fine' => $fine,
            'total_salary' => $totalSalary,
        ]);

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Payroll synced with Advance/Overtime/Fine entries.',
            'overtime' => $overtime,
            'fine' => $fine,
            'total_salary' => $totalSalary,
        ]);
    }

    public function payments($payrollId)
    {
        $payroll = $this->payrollModel->find($payrollId);
        if (!$payroll) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('Payroll not found');
        }

        $employee = $this->employeeModel->find($payroll['employee_id']);
        $payments = $this->paymentModel->getPaymentsByPayroll($payrollId);

        $data = [
            'title' => 'Payment History',
            'payroll' => $payroll,
            'employee' => $employee,
            'payments' => $payments
        ];

        return view('payroll/payments', $data);
    }

    public function addPayment()
    {
        if ($this->request->is('post')) {
            // Use model's validation rules via public API
            $rules = $this->paymentModel->getValidationRules();

            if ($this->validate($rules)) {
                $id = $this->paymentModel->insert([
                    'payroll_id' => $this->request->getPost('payroll_id'),
                    'amount' => $this->request->getPost('amount'),
                    'payment_date' => $this->request->getPost('payment_date'),
                    'method' => $this->request->getPost('method')
                ]);

                // Check if payroll should be marked as paid
                $this->paymentModel->markPayrollAsPaid($this->request->getPost('payroll_id'));

                $payment = $this->paymentModel->find($id);
                $payrollId = (int) ($payment['payroll_id'] ?? 0);
                $totalPaid = (float) $this->paymentModel->getTotalPaidByPayroll($payrollId);
                $payroll = $this->payrollModel->find($payrollId);
                $totalSalary = (float) ($payroll['total_salary'] ?? 0);
                $remaining = max(0, $totalSalary - $totalPaid);

                return $this->response->setJSON([
                    'success' => true,
                    'message' => 'Payment added successfully',
                    'payment' => [
                        'id' => $id,
                        'amount' => (float) ($payment['amount'] ?? 0),
                        'payment_date' => $payment['payment_date'] ?? '',
                        'method' => $payment['method'] ?? '',
                    ],
                    'total_paid' => $totalPaid,
                    'remaining' => $remaining,
                ]);
            } else {
                return $this->response->setJSON([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $this->validator->getErrors()
                ]);
            }
        }

        return $this->response->setJSON([
            'success' => false,
            'message' => 'Invalid request'
        ]);
    }

    public function deletePayment($id)
    {
        if (! $this->request->is('post')) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Invalid request method',
            ]);
        }

        $payment = $this->paymentModel->find($id);
        if (!$payment) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Payment not found',
            ]);
        }

        $payrollId = $payment['payroll_id'];

        $amount = (float) ($payment['amount'] ?? 0);

        // Delete payment
        $this->paymentModel->delete($id);

        // Recalculate payroll paid status
        $payroll = $this->payrollModel->find($payrollId);
        $totalPaid = 0.0;
        $remaining = 0.0;
        if ($payroll) {
            $totalPaid = (float) $this->paymentModel->getTotalPaidByPayroll($payrollId);
            $isPaid = $totalPaid >= $payroll['total_salary'];
            $this->payrollModel->update($payrollId, ['paid' => $isPaid ? 1 : 0]);
            $remaining = max(0, (float) ($payroll['total_salary'] ?? 0) - $totalPaid);
        }

        return $this->response->setJSON([
            'success' => true,
            'message' => 'Payment deleted successfully',
            'payment_id' => (int) $id,
            'total_paid' => $totalPaid,
            'remaining' => $remaining,
        ]);
    }
}