<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\AttendanceModel;
use EmployeeApi\Models\PayrollModel;
use EmployeeApi\Models\EmployeeModel;

class ReportController extends BaseApiController
{
    /**
     * Attendance Report API
     */
    public function attendance()
    {
        $month = $this->request->getGet('month') ?? date('m');
        $year = $this->request->getGet('year') ?? date('Y');

        $employeeModel = new EmployeeModel();
        $attendanceModel = new \EmployeeApi\Models\AttendanceModel();
        $payrollModel = new PayrollModel();
        $aofModel = new \EmployeeApi\Models\AdvanceOvertimeFineModel();

        $employees = $employeeModel->findAll();
        $reportData = [];

        foreach ($employees as $employee) {
            $joinDate = $employee['join_date'] ?? null;
            $attendance = $attendanceModel->getMonthlyAttendanceEnriched((int)$employee['id'], (int)$month, (int)$year, $joinDate);
            $summary = $attendanceModel->getAttendanceSummaryEnriched((int)$employee['id'], (int)$month, (int)$year, null, $joinDate);
            $salaryCalc = $this->getSalaryCalcForEmployee($employee, $month, $year, $summary, $attendanceModel, $aofModel, $payrollModel);

            $reportData[] = [
                'employee' => $employee,
                'attendance' => $attendance,
                'summary' => $summary,
                'salaryCalc' => $salaryCalc
            ];
        }

        $data = [
            'reportData' => $reportData,
            'month' => $month,
            'year' => $year
        ];

        if ($this->request->getGet('export') === 'pdf') {
            return $this->exportAttendancePDF($data);
        }

        return $this->respondSuccess($reportData, "Attendance report for $month/$year");
    }

    /**
     * Salary Report API
     */
    public function salary()
    {
        $model = new PayrollModel();
        $month = $this->request->getGet('month') ?? date('m');
        $year = $this->request->getGet('year') ?? date('Y');
        $employeeId = $this->request->getGet('employee_id');

        $builder = $model->select('payroll.*, employees.name, employees.mobile')
                        ->join('employees', 'employees.id = payroll.employee_id')
                        ->where('month', $month)
                        ->where('year', $year);

        if ($employeeId && $employeeId != -1) {
            $builder->where('payroll.employee_id', $employeeId);
        }

        $payrolls = $builder->findAll();

        if ($this->request->getGet('export') === 'pdf') {
            if ($employeeId && $employeeId != -1 && count($payrolls) > 0) {
                return $this->exportSalarySlipPDF($payrolls[0]);
            }
            $data = [
                'payrolls' => $payrolls,
                'month' => $month,
                'year' => $year
            ];
            return $this->exportSalaryPDF($data);
        }

        return $this->respondSuccess($payrolls, "Salary report for $month/$year");
    }

    private function getSalaryCalcForEmployee($employee, $month, $year, $summary, $attendanceModel, $aofModel, $payrollModel)
    {
        $baseSalary = (float)($employee['monthly_salary'] ?? 0);
        $presentDays = 0; $halfDays = 0; $absentDays = 0;
        foreach ($summary as $row) {
            if ($row['status'] === 'present') $presentDays = (int)$row['count'];
            if ($row['status'] === 'half_day') $halfDays = (int)$row['count'];
            if ($row['status'] === 'absent') $absentDays = (int)$row['count'];
        }
        $settingsModel = new \EmployeeApi\Models\SettingsModel();
        $daysDivisor = $settingsModel->getDaysDivisor((int)$month, (int)$year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        $dailySalary = $baseSalary / $daysDivisor;
        $weekdayStatus = $attendanceModel->getWeekdayAttendanceStatus((int)$employee['id'], (int)$month, (int)$year);

        if ($payrollMode === 'monthly') {
            $weekendAbsent = $weekdayStatus['weekend_absent_count'] ?? 0;
            $salaryFromAttendance = $baseSalary - ($absentDays * $dailySalary) - ($halfDays * $dailySalary * 0.5) - ($weekendAbsent * $dailySalary);
            $weekendHolidayAmount = 0;
        } else {
            $salaryFromAttendance = ($presentDays * $dailySalary) + ($halfDays * $dailySalary * 0.5);
            $weekendHolidayAmount = ($weekdayStatus['weekend_holiday_count'] ?? 0) * $dailySalary;
        }

        $sums = $aofModel->getSumsForEmployeeMonth((int)$employee['id'], (int)$month, (int)$year);
        $overtime = (float)($sums['overtime'] ?? 0);
        $fine = (float)($sums['fine'] ?? 0);
        $payableSalary = round($salaryFromAttendance + $weekendHolidayAmount + $overtime - $fine, 2);

        return [
            'base_salary' => $baseSalary,
            'payable_salary' => $payableSalary,
            'overtime' => $overtime,
            'fine' => $fine
        ];
    }

    private function exportSalarySlipPDF($payroll)
    {
        $attendanceModel = new \EmployeeApi\Models\AttendanceModel();
        $employeeModel = new EmployeeModel();
        $employee = $employeeModel->find($payroll['employee_id']);
        $month = (int) $payroll['month'];
        $year = (int) $payroll['year'];
        $attendance = $attendanceModel->getMonthlyAttendanceEnriched($payroll['employee_id'], $month, $year, $employee['join_date'] ?? null);
        
        $attMap = [];
        foreach ($attendance as $att) {
            $d = $att['date'];
            $status = $att['status'] ?? 'not_marked';
            $attMap[(int)date('j', strtotime($d))] = $status;
        }

        $pdf = new \TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        $pdf->SetTitle('Salary Slip - ' . ($payroll['name'] ?? 'Employee') . ' - ' . date('F Y', mktime(0, 0, 0, $month, 1, $year)));
        $pdf->SetFont('dejavusans', '', 10);
        $pdf->setPrintHeader(false); $pdf->setPrintFooter(false);
        $pdf->SetMargins(15, 10, 15);
        $pdf->AddPage();

        $this->drawSalarySlipHeader($pdf);

        $monthYear = date('F Y', mktime(0, 0, 0, $month, 1, $year));
        $advanceDed = (float)($payroll['advance_deduction'] ?? 0);
        $holdDed = (float)($payroll['hold_deduction'] ?? 0);
        $fine = (float)($payroll['fine'] ?? 0);
        $overtime = (float)($payroll['overtime'] ?? 0);
        $netSalary = (float)($payroll['total_salary'] ?? 0);
        $holdReleased = (float) ($payroll['hold_salary_released'] ?? 0);
        $whAmount = (float) ($payroll['weekend_holiday_amount'] ?? 0);
        $baseSalary = (float)($payroll['base_salary'] ?? 0);
        $actualEarnings = $netSalary + $fine + $advanceDed + $holdDed;

        $html = '<h1 style="text-align: center; color: #333; margin-bottom: 0;">SALARY SLIP</h1>';
        $html .= '<h3 style="text-align: center; color: #666; font-weight: normal; margin-top: 0;">' . htmlspecialchars($monthYear) . '</h3><hr color="#eee">';
        $html .= '<table border="0" cellpadding="4" width="100%">';
        $html .= '<tr><td width="55%"><strong>Employee Name:</strong> ' . htmlspecialchars($payroll['name'] ?? '') . '</td><td width="45%"><strong>Mobile:</strong> ' . htmlspecialchars($payroll['mobile'] ?? '-') . '</td></tr>';
        $html .= '<tr><td><strong>Base Salary:</strong> Rs. ' . number_format($baseSalary, 0) . '</td><td><strong>Actual (Gross) Salary:</strong> Rs. ' . number_format($actualEarnings, 0) . '</td></tr></table><br>';
        
        $html .= '<table border="1" cellpadding="6" width="100%" style="border-collapse: collapse;">';
        $html .= '<tr style="background-color:#f8f9fa;"><th width="65%"><strong>Earnings & Deductions Component</strong></th><th width="35%" style="text-align:right;"><strong>Amount (Rs.)</strong></th></tr>';
        
        $earnedSalary = $actualEarnings - $whAmount - $overtime - $holdReleased;
        $html .= '<tr><td>Earned Salary</td><td style="text-align:right;">' . number_format($earnedSalary, 0) . '</td></tr>';
        $html .= '<tr><td>Weekend Holiday Amount</td><td style="text-align:right;">' . number_format($whAmount, 0) . '</td></tr>';
        $html .= '<tr><td>Overtime</td><td style="text-align:right;">' . number_format($overtime, 0) . '</td></tr>';
        $html .= '<tr><td>Hold Salary Released</td><td style="text-align:right;">' . number_format($holdReleased, 0) . '</td></tr>';
        $html .= '<tr style="background-color:#fcfcfc;"><td><strong>Total Earnings</strong></td><td style="text-align:right;">' . number_format($actualEarnings, 0) . '</td></tr>';

        $html .= '<tr><td>Fine (Deduction)</td><td style="text-align:right; color: #cc0000;">-' . number_format($fine, 0) . '</td></tr>';
        $html .= '<tr><td>Advance Deduction</td><td style="text-align:right; color: #cc0000;">-' . number_format($advanceDed, 0) . '</td></tr>';
        $html .= '<tr><td>Hold Salary Deduction</td><td style="text-align:right; color: #cc0000;">-' . number_format($holdDed, 0) . '</td></tr>';
        $html .= '<tr style="background-color:#e9ecef;"><td style="font-size: 1.1em;"><strong>Net Payable Salary</strong></td><td style="text-align:right; font-size: 1.1em;"><strong>Rs. ' . number_format($netSalary, 0) . '</strong></td></tr></table>';

        $html .= '<br><table border="0" cellpadding="2" width="100%" style="font-size: 9px;"><tr>';
        $html .= '<td><strong>Present:</strong> ' . ($payroll['present_days'] ?? 0) . '</td>';
        $html .= '<td><strong>Half Day:</strong> ' . ($payroll['half_days'] ?? 0) . '</td>';
        $html .= '<td><strong>Absent:</strong> ' . ($payroll['absent_days'] ?? 0) . '</td>';
        $html .= '<td><strong>Paid Weekend:</strong> ' . ($payroll['weekend_holiday_days'] ?? 0) . '</td></tr></table>';

        $html .= '<br><h3 style="text-align: center; color: #333; margin-bottom: 5px;">ATTENDANCE CALENDAR</h3>';
        $daysInMonth = (int)date('t', mktime(0, 0, 0, $month, 1, $year));
        $firstDayOfWeek = (int)date('w', mktime(0, 0, 0, $month, 1, $year));
        
        $html .= '<table border="1" cellpadding="4" style="text-align: center; width: 100%; border: 1px solid #ddd;">';
        $html .= '<tr style="background-color: #f0f0f0; font-weight: bold;"><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr><tr>';
        
        $day = 1;
        for ($i = 0; $i < 7; $i++) {
            if ($i < $firstDayOfWeek) $html .= '<td style="background-color: #f9f9f9;"></td>';
            else {
                $status = $attMap[$day] ?? 'not_marked';
                $color = $this->getAttColor($status);
                $html .= '<td style="background-color: ' . $color['bg'] . '; color: ' . $color['fg'] . ';">' . $day . '</td>';
                $day++;
            }
        }
        $html .= '</tr>';
        while ($day <= $daysInMonth) {
            $html .= '<tr>';
            for ($i = 0; $i < 7; $i++) {
                if ($day <= $daysInMonth) {
                    $status = $attMap[$day] ?? 'not_marked';
                    $color = $this->getAttColor($status);
                    $html .= '<td style="background-color: ' . $color['bg'] . '; color: ' . $color['fg'] . ';">' . $day . '</td>';
                    $day++;
                } else $html .= '<td style="background-color: #f9f9f9;"></td>';
            }
            $html .= '</tr>';
        }
        $html .= '</table>';
        
        $html .= '<div style="font-size: 8px; margin-top: 5px; text-align: center;">';
        $html .= '<span style="color: #22c55e;">● Present</span> &nbsp; <span style="color: #f59e0b;">● Half Day</span> &nbsp; <span style="color: #ef4444;">● Absent</span> &nbsp; <span style="color: #4b5563;">● Weekend</span> &nbsp; <span style="color: #3b82f6;">● Holiday</span></div>';
        
        $html .= '<br><br><br><table border="0" cellpadding="4" width="100%"><tr><td style="text-align: left;">____________________<br>Employee Signature</td><td style="text-align: right;">____________________<br>Authorized Signatory</td></tr></table>';
        $pdf->writeHTML($html, true, false, true, false, '');
        $pdf->Output('Salary_Slip.pdf', 'D');
        exit();
    }

    private function getAttColor($status) {
        switch ($status) {
            case 'present': return ['bg' => '#22c55e', 'fg' => '#ffffff'];
            case 'absent': return ['bg' => '#ef4444', 'fg' => '#ffffff'];
            case 'half_day': return ['bg' => '#f59e0b', 'fg' => '#ffffff'];
            case 'weekend': return ['bg' => '#4b5563', 'fg' => '#ffffff'];
            case 'holiday': return ['bg' => '#3b82f6', 'fg' => '#ffffff'];
            default: return ['bg' => '#f1f5f9', 'fg' => '#94a3b8'];
        }
    }

    private function drawSalarySlipHeader($pdf) {
        $logoPath = realpath(FCPATH . '../public/images/logo-chaychaupal.png');
        if ($logoPath && is_file($logoPath)) {
            $pdf->Image($logoPath, 85, 8, 40, 0, 'PNG');
            $pdf->SetY(32);
        }
    }

    private function exportAttendancePDF($data)
    {
        $pdf = new \TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        $pdf->SetTitle('Attendance Report - ' . date('F Y', mktime(0,0,0, (int)$data['month'], 1, (int)$data['year'])));
        $pdf->setPrintHeader(false); $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 5, 10);
        $pdf->AddPage();
        $this->drawPDFHeader($pdf, $data);

        $pdf->SetFont('dejavusans', 'B', 10);
        $pdf->SetFillColor(245, 244, 242);
        $pdf->Cell(0, 7, ' OVERALL ATTENDANCE SUMMARY', 0, 1, 'L', true);
        
        $html = '<table cellpadding="2" border="1" style="font-size: 7px; text-align: center;">
            <tr style="background-color: #42291e; color: #ffffff; font-weight: bold;">
                <td width="25%">Employee Name</td>
                <td width="15%">Base Salary</td>
                <td width="10%">Pre</td>
                <td width="10%">Abs</td>
                <td width="10%">HD</td>
                <td width="20%">Payable</td>
                <td width="10%">%</td>
            </tr>';

        foreach ($data['reportData'] as $report) {
            $p = 0; $a = 0; $hd = 0;
            foreach ($report['summary'] as $s) {
                if ($s['status'] === 'present') $p = (int)$s['count'];
                if ($s['status'] === 'absent') $a = (int)$s['count'];
                if ($s['status'] === 'half_day') $hd = (int)$s['count'];
            }
            $pct = ($p+$a+$hd) > 0 ? (($p+($hd*0.5))/($p+$a+$hd))*100 : 0;
            $html .= '<tr>
                <td align="left"> ' . $report['employee']['name'] . '</td>
                <td>Rs.' . number_format($report['salaryCalc']['base_salary'], 0) . '</td>
                <td style="color: #15803d;">' . $p . '</td>
                <td style="color: #dc2626;">' . $a . '</td>
                <td>' . $hd . '</td>
                <td style="font-weight: bold; background-color: #fefce8;">Rs.' . number_format($report['salaryCalc']['payable_salary'], 0) . '</td>
                <td>' . number_format($pct, 0) . '%</td>
            </tr>';
        }
        $html .= '</table>';
        $pdf->writeHTML($html, true, false, true, false, '');
        $pdf->Output('Attendance_Report.pdf', 'D');
        exit();
    }

    private function exportSalaryPDF($data)
    {
        $pdf = new \TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        $pdf->SetTitle('Salary Report - ' . date('F Y', mktime(0, 0, 0, (int)$data['month'], 1, (int)$data['year'])));
        $pdf->setPrintHeader(false); $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 10, 10);
        $pdf->AddPage();
        $this->drawPDFHeader($pdf, $data);

        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->SetFillColor(245, 244, 242);
        $pdf->Cell(0, 8, ' MONTHLY SALARY REPORT: ' . strtoupper(date('F Y', mktime(0, 0, 0, (int)$data['month'], 1, (int)$data['year']))), 0, 1, 'L', true);
        
        $html = '<table cellpadding="4" border="1" style="font-size: 8px; text-align: center;">
            <tr style="background-color: #42291e; color: #ffffff; font-weight: bold;">
                <td width="25%">Employee</td>
                <td width="15%">Base Salary</td>
                <td width="10%">Overtime</td>
                <td width="10%">Fine</td>
                <td width="15%">Advance Ded.</td>
                <td width="15%">Net Payable</td>
                <td width="10%">Status</td>
            </tr>';

        foreach ($data['payrolls'] as $p) {
            $html .= '<tr>
                <td align="left"><strong>' . $p['name'] . '</strong></td>
                <td>Rs.' . number_format($p['base_salary'], 0) . '</td>
                <td>Rs.' . number_format($p['overtime'] ?? 0, 0) . '</td>
                <td>Rs.' . number_format($p['fine'] ?? 0, 0) . '</td>
                <td>Rs.' . number_format($p['advance_deduction'] ?? 0, 0) . '</td>
                <td style="font-weight: bold; background-color: #fefce8;">Rs.' . number_format($p['total_salary'], 0) . '</td>
                <td>' . ($p['paid'] ? 'Paid' : 'Pending') . '</td>
            </tr>';
        }
        $html .= '</table>';
        $pdf->writeHTML($html, true, false, true, false, '');
        $pdf->Output('Salary_Report.pdf', 'D');
        exit();
    }

    private function drawPDFHeader($pdf, $data)
    {
        $pdf->SetY(5);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, self::BRAND_NAME, 0, 1, 'R');
        $pdf->SetFont('helvetica', '', 7);
        $pdf->Cell(0, 4, 'Report: ' . date('F Y', mktime(0, 0, 0, (int)$data['month'], 1, (int)$data['year'])), 0, 1, 'R');
        $pdf->Ln(2);
        $pdf->Line(10, $pdf->GetY(), 200, $pdf->GetY());
        $pdf->Ln(2);
    }
}
