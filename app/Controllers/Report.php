<?php

namespace App\Controllers;

use App\Models\EmployeeModel;
use App\Models\AttendanceModel;
use App\Models\PayrollModel;
use App\Models\AdvanceModel;
use App\Models\AdvanceOvertimeFineModel;
use App\Models\PaymentModel;
use TCPDF;

class Report extends BaseController
{
    protected $employeeModel;
    protected $attendanceModel;
    protected $payrollModel;
    protected $advanceModel;
    protected $aofModel;
    protected $paymentModel;

    public function __construct()
    {
        $this->employeeModel = new EmployeeModel();
        $this->attendanceModel = new AttendanceModel();
        $this->payrollModel = new PayrollModel();
        $this->advanceModel = new AdvanceModel();
        $this->aofModel = new AdvanceOvertimeFineModel();
        $this->paymentModel = new PaymentModel();
    }

    public function index()
    {
        $employeeModel = new EmployeeModel();
        $payrollModel = new PayrollModel();
        $advanceModel = new AdvanceModel();

        $data = [
            'title' => 'Reports',
            'totalActiveEmployees' => $employeeModel->getTotalActiveEmployees(),
            'totalPaidAmount' => $payrollModel->getTotalPaidAmount(),
            'totalMonthlySalary' => $employeeModel->getTotalMonthlySalary(),
            'totalAdvances' => $advanceModel->getTotalAdvances()
        ];

        return view('report/index', $data);
    }

    public function attendance()
    {
        $month = $this->request->getGet('month') ?: date('m');
        $year = $this->request->getGet('year') ?: date('Y');

        $employees = $this->employeeModel->findAll();
        $reportData = [];

        foreach ($employees as $employee) {
            $joinDate = $employee['join_date'] ?? null;
            $attendance = $this->attendanceModel->getMonthlyAttendanceEnriched((int) $employee['id'], (int) $month, (int) $year, $joinDate);
            $summary = $this->attendanceModel->getAttendanceSummaryEnriched((int) $employee['id'], (int) $month, (int) $year, null, $joinDate);
            $weekdayStatus = $this->attendanceModel->getWeekdayAttendanceStatus((int) $employee['id'], (int) $month, (int) $year, null, $joinDate);
            $salaryCalc = $this->getSalaryCalcForEmployee((int) $employee['id'], (int) $month, (int) $year, $summary, $joinDate);

            $reportData[] = [
                'employee' => $employee,
                'attendance' => $attendance,
                'summary' => $summary,
                'weekdayStatus' => $weekdayStatus,
                'salaryCalc' => $salaryCalc
            ];
        }

        $data = [
            'title' => 'Monthly Attendance Report',
            'reportData' => $reportData,
            'month' => $month,
            'year' => $year
        ];

        if ($this->request->getGet('export') === 'pdf') {
            return $this->exportAttendancePDF($data);
        }

        return view('report/attendance', $data);
    }

    /**
     * Real-time salary calculation for attendance report expanded row.
     */
    private function getSalaryCalcForEmployee(int $employeeId, int $month, int $year, array $summary, ?string $joinDate = null): array
    {
        $employee = $this->employeeModel->find($employeeId);
        if (!$employee) {
            return ['base_salary' => 0, 'payable_salary' => 0, 'advance_pending' => 0, 'overtime' => 0, 'fine' => 0];
        }
        $joinDate = $joinDate ?? ($employee['join_date'] ?? null);
        $baseSalary = (float) ($employee['monthly_salary'] ?? 0);
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
        $settingsModel = new \App\Models\SettingsModel();
        $workingDaysInMonth = $settingsModel->getDaysDivisor((int)$month, (int)$year);
        $payrollMode = $settingsModel->getSetting('payroll_mode', 'monthly');
        $dailySalary = $workingDaysInMonth > 0 ? $baseSalary / $workingDaysInMonth : 0;
        $weekdayStatus = $this->attendanceModel->getWeekdayAttendanceStatus($employeeId, $month, $year, null, $joinDate);

        if ($payrollMode === 'monthly') {
            $weekendAbsentDays = $weekdayStatus['weekend_absent_count'] ?? 0;
            $salaryFromAttendance = $baseSalary - ($absentDays * $dailySalary) - ($halfDays * $dailySalary * 0.5) - ($weekendAbsentDays * $dailySalary);
            $weekendHolidayAmount = 0;
        } else {
            $salaryFromAttendance = ($presentDays * $dailySalary) + ($halfDays * $dailySalary * 0.5);
            $weekendHolidayAmount = ($weekdayStatus['weekend_holiday_count'] ?? 0) * $dailySalary;
        }
        $sums = $this->aofModel->getSumsForEmployeeMonth($employeeId, $month, $year);
        $overtime = (float) ($sums['overtime'] ?? 0);
        $fine = (float) ($sums['fine'] ?? 0);
        // Attendance report pe sirf attendance ke hisaab se payable (hold minus nahi). Hold payroll generate hote waqt lagta hai.
        $payableSalary = max(0, round($salaryFromAttendance + $weekendHolidayAmount + $overtime - $fine, 2));
        $advanceInfo = $this->payrollModel->getPendingAdvanceForEmployee($employeeId);
        $advancePending = (float) ($advanceInfo['remaining'] ?? 0);

        return [
            'base_salary' => round($baseSalary, 2),
            'payable_salary' => $payableSalary,
            'advance_pending' => $advancePending,
            'overtime' => $overtime,
            'fine' => $fine
        ];
    }

    public function salaryCalc($employeeId, $month, $year)
    {
        $employeeId = (int) $employeeId;
        $month = (int) $month;
        $year = (int) $year;
        $employee = $this->employeeModel->find($employeeId);
        $joinDate = $employee['join_date'] ?? null;
        $summary = $this->attendanceModel->getAttendanceSummaryEnriched($employeeId, $month, $year, null, $joinDate);
        $salaryCalc = $this->getSalaryCalcForEmployee($employeeId, $month, $year, $summary, $joinDate);
        return $this->response->setJSON($salaryCalc);
    }

    public function salary()
    {
        $month = $this->request->getGet('month') ?: date('m');
        $year = $this->request->getGet('year') ?: date('Y');

        $payrolls = $this->payrollModel->select('payroll.*, employees.name, employees.mobile')
                                      ->join('employees', 'employees.id = payroll.employee_id')
                                      ->where('month', $month)
                                      ->where('year', $year)
                                      ->findAll();

        $data = [
            'title' => 'Monthly Salary Report',
            'payrolls' => $payrolls,
            'month' => $month,
            'year' => $year
        ];

        if ($this->request->getGet('export') === 'pdf') {
            return $this->exportSalaryPDF($data);
        }

        return view('report/salary', $data);
    }

    public function advances()
    {
        $startDate = $this->request->getGet('start_date') ?: date('Y-m-01');
        $endDate = $this->request->getGet('end_date') ?: date('Y-m-t');

        $advances = $this->advanceModel->select('advances.*, employees.name')
                                      ->join('employees', 'employees.id = advances.employee_id')
                                      ->where('advances.date >=', $startDate)
                                      ->where('advances.date <=', $endDate)
                                      ->orderBy('advances.date', 'DESC')
                                      ->findAll();

        $data = [
            'title' => 'Advance Payment History',
            'advances' => $advances,
            'startDate' => $startDate,
            'endDate' => $endDate
        ];

        if ($this->request->getGet('export') === 'pdf') {
            return $this->exportAdvancesPDF($data);
        }

        return view('report/advances', $data);
    }

    private function exportAttendancePDF($data)
    {
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        // PDF Metadata
        $pdf->SetCreator('Chay Chaupal');
        $pdf->SetAuthor('Chay Chaupal');
        $pdf->SetTitle('Attendance Report - ' . date('F Y', mktime(0,0,0, (int)$data['month'], 1, (int)$data['year'])));

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 5, 10);
        $pdf->SetAutoPageBreak(TRUE, 15);

        $statusColors = [
            'present' => '#15803d',   // Strong Green
            'absent' => '#dc2626',    // Strong Red
            'half_day' => '#ca8a04',  // Strong Amber
            'weekend' => '#475569',   // Strong Grey
            'holiday' => '#1d4ed8',   // Strong Blue
            'not_marked' => '#ffffff'
        ];

        // --- PAGE 1: OVERALL SUMMARY ---
        $pdf->AddPage();
        $this->drawPDFHeader($pdf, $data);

        $pdf->SetFont('dejavusans', 'B', 10); // Using dejavusans for better symbol support
        $pdf->SetFillColor(245, 244, 242);
        $pdf->Cell(0, 7, ' OVERALL ATTENDANCE SUMMARY', 0, 1, 'L', true);
        $pdf->Ln(0.5);

        $htmlSummary = '<table cellpadding="2" border="1" style="border-color: #ddd; font-size: 7px; text-align: center;">
            <tr style="background-color: #42291e; color: #ffffff; font-weight: bold;">
                <td width="20%">Employee Name</td>
                <td width="12%">Base Salary</td>
                <td width="7%">Wkd</td>
                <td width="7%">Pre</td>
                <td width="7%">Abs</td>
                <td width="7%">HD</td>
                <td width="7%">Hol</td>
                <td width="18%">Payable</td>
                <td width="15%">%</td>
            </tr>';

        foreach ($data['reportData'] as $report) {
            $p = 0; $a = 0; $hd = 0; $w = 0; $h = 0;
            foreach ($report['summary'] as $s) {
                switch ($s['status']) {
                    case 'present': $p = (int)$s['count']; break;
                    case 'absent': $a = (int)$s['count']; break;
                    case 'half_day': $hd = (int)$s['count']; break;
                    case 'weekend': $w = (int)$s['count']; break;
                    case 'holiday': $h = (int)$s['count']; break;
                }
            }
            $marked = $p + $a + $hd + $w + $h;
            $pct = $marked > 0 ? (($p + ($hd * 0.5)) / $marked) * 100 : 0;

            $htmlSummary .= '<tr>
                <td align="left"> ' . $report['employee']['name'] . '</td>
                <td>&#8377;' . number_format($report['salaryCalc']['base_salary'], 0) . '</td>
                <td>' . $w . '</td>
                <td style="color: #15803d; font-weight: bold;">' . $p . '</td>
                <td style="color: #dc2626; font-weight: bold;">' . $a . '</td>
                <td>' . $hd . '</td>
                <td>' . $h . '</td>
                <td style="font-weight: bold; background-color: #fefce8;">&#8377;' . number_format($report['salaryCalc']['payable_salary'], 0) . '</td>
                <td>' . number_format($pct, 0) . '%</td>
            </tr>';
        }
        $htmlSummary .= '</table>';
        $pdf->writeHTML($htmlSummary, true, false, true, false, '');
        $pdf->Ln(2);

        // --- DETAILED GRIDS ---
        $daysInMonth = (int)date('t', strtotime($data['year'] . '-' . $data['month'] . '-01'));
        $totalEmployees = count($data['reportData']);
        
        $htmlOuter = '<table cellpadding="0" cellspacing="2" style="width: 100%;">';
        foreach ($data['reportData'] as $index => $report) {
            // New page every 10 grids (5 rows x 2 columns) on fresh pages
            // But for the first page, it might break earlier which is fine
            if ($index > 0 && $index % 10 === 0) {
                $htmlOuter .= '</table>';
                $pdf->writeHTML($htmlOuter, true, false, true, false, '');
                $htmlOuter = '<table cellpadding="0" cellspacing="2" style="width: 100%;">';
                $this->drawLegend($pdf);
                $pdf->AddPage();
                $this->drawPDFHeader($pdf, $data);
            }

            if ($index % 2 === 0) { $htmlOuter .= '<tr>'; }

            // Build Individual Calendar HTML
            $attMap = [];
            foreach ($report['attendance'] as $att) {
                $day = (int)date('j', strtotime($att['date']));
                $attMap[$day] = $att['status'];
            }
            $firstDayTs = strtotime($data['year'] . '-' . $data['month'] . '-01');
            $startDayOfWeek = (int)date('w', $firstDayTs);

            $gridHtml = '<div style="border: 0.1px solid #ddd; padding: 1px;">';
            $gridHtml .= '<div style="background-color: #f5f4f2; font-weight: bold; font-size: 7px; padding: 2px;"> ' . $report['employee']['name'] . '</div>';
            $gridHtml .= '<table cellpadding="1" style="width: 100%; text-align: center; font-size: 6px; border-collapse: collapse;">';
            $gridHtml .= '<tr style="font-weight: bold; color: #555;">';
            foreach (['S', 'M', 'T', 'W', 'T', 'F', 'S'] as $dayName) {
                $gridHtml .= '<th style="border-bottom: 0.1px solid #eee;">' . $dayName . '</th>';
            }
            $gridHtml .= '</tr>';

            $currentDay = 1;
            $gridHtml .= '<tr>';
            for ($i = 0; $i < $startDayOfWeek; $i++) { $gridHtml .= '<td></td>'; }
            for ($i = $startDayOfWeek; $i < 7; $i++) {
                $status = $attMap[$currentDay] ?? 'not_marked';
                $bgColor = $statusColors[$status] ?? '#ffffff';
                $textColor = ($status === 'not_marked') ? '#000000' : '#ffffff';
                $gridHtml .= '<td style="border: 0.1px solid #f9f9f9; background-color: ' . $bgColor . '; color: ' . $textColor . '; font-weight: bold;">' . $currentDay . '</td>';
                $currentDay++;
            }
            $gridHtml .= '</tr>';

            while ($currentDay <= $daysInMonth) {
                $gridHtml .= '<tr>';
                for ($i = 0; $i < 7; $i++) {
                    if ($currentDay <= $daysInMonth) {
                        $status = $attMap[$currentDay] ?? 'not_marked';
                        $bgColor = $statusColors[$status] ?? '#ffffff';
                        $textColor = ($status === 'not_marked') ? '#000000' : '#ffffff';
                        $gridHtml .= '<td style="border: 0.1px solid #f9f9f9; background-color: ' . $bgColor . '; color: ' . $textColor . '; font-weight: bold;">' . $currentDay . '</td>';
                        $currentDay++;
                    } else { $gridHtml .= '<td></td>'; }
                }
                $gridHtml .= '</tr>';
            }
            $gridHtml .= '</table></div>';

            $htmlOuter .= '<td width="50%" valign="top">' . $gridHtml . '</td>';

            if ($index % 2 === 1 || $index === $totalEmployees - 1) {
                if ($index % 2 === 0) { $htmlOuter .= '<td width="50%"></td>'; }
                $htmlOuter .= '</tr>';
            }

            if ($index === $totalEmployees - 1) {
                $htmlOuter .= '</table>';
                $pdf->writeHTML($htmlOuter, true, false, true, false, '');
                $this->drawLegend($pdf);
            }
        }

        $pdf->Output('Attendance_Report_' . $data['month'] . '_' . $data['year'] . '.pdf', 'D');
        exit();
    }

    private function drawPDFHeader($pdf, $data)
    {
        $logoPath = FCPATH . 'public/images/logo-chaychaupal.png';
        if (is_file($logoPath)) { $pdf->Image($logoPath, 15, 5, 20, 0, 'PNG'); }
        $pdf->SetY(5);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, 'CHAY CHAUPAL', 0, 1, 'R');
        $pdf->SetFont('helvetica', '', 7);
        
        $subTitle = 'Report';
        if (isset($data['month']) && isset($data['year'])) {
            $subTitle .= ': ' . date('F Y', mktime(0,0,0, (int)$data['month'], 1, (int)$data['year']));
        }
        $pdf->Cell(0, 4, $subTitle, 0, 1, 'R');
        
        $pdf->Ln(2);
        $pdf->Line(10, $pdf->GetY(), 200, $pdf->GetY());
        $pdf->Ln(2);
    }

    private function drawLegend($pdf)
    {
        $html = '<table cellpadding="1" style="font-size: 6px; color: #666; text-align: center; width: 100%;">
            <tr>
                <td width="20%"><span style="background-color: #15803d; color: #ffffff; border: 0.1px solid #ccc;">&nbsp;&nbsp;</span> Present</td>
                <td width="20%"><span style="background-color: #dc2626; color: #ffffff; border: 0.1px solid #ccc;">&nbsp;&nbsp;</span> Absent</td>
                <td width="20%"><span style="background-color: #ca8a04; color: #ffffff; border: 0.1px solid #ccc;">&nbsp;&nbsp;</span> Half Day</td>
                <td width="20%"><span style="background-color: #475569; color: #ffffff; border: 0.1px solid #ccc;">&nbsp;&nbsp;</span> Weekend</td>
                <td width="20%"><span style="background-color: #1d4ed8; color: #ffffff; border: 0.1px solid #ccc;">&nbsp;&nbsp;</span> Holiday</td>
            </tr>
        </table>';
        $pdf->writeHTML($html, true, false, true, false, '');
        
        $pdf->SetFont('helvetica', 'I', 6);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 5, 'Generated on ' . date('d-m-Y H:i') . ' by Chay Chaupal', 0, 0, 'C');
    }


    private function exportSalaryPDF($data)
    {
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        $pdf->SetCreator('Chay Chaupal');
        $pdf->SetAuthor('Chay Chaupal');
        $pdf->SetTitle('Monthly Salary Report - ' . date('F Y', mktime(0, 0, 0, (int)$data['month'], 1, (int)$data['year'])));

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(TRUE, 15);
        $pdf->AddPage();

        // Use professional header helper
        $this->drawPDFHeader($pdf, $data);

        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->SetFillColor(245, 244, 242);
        $pdf->Cell(0, 8, ' MONTHLY SALARY REPORT: ' . strtoupper(date('F Y', mktime(0, 0, 0, (int)$data['month'], 1, (int)$data['year']))), 0, 1, 'L', true);
        $pdf->Ln(2);

        $html = '<table cellpadding="4" border="1" style="border-color: #ddd; font-size: 8px; text-align: center;">
            <tr style="background-color: #42291e; color: #ffffff; font-weight: bold;">
                <td width="20%">Employee</td>
                <td width="12%">Base Salary</td>
                <td width="10%">Overtime</td>
                <td width="10%">Fine</td>
                <td width="12%">Advance Ded.</td>
                <td width="15%">Holds</td>
                <td width="11%">Payable</td>
                <td width="10%">Status</td>
            </tr>';

        $totalBase = 0; $totalOT = 0; $totalFine = 0; $totalAdv = 0; $totalPayable = 0;

        foreach ($data['payrolls'] as $payroll) {
            $adv = $payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0;
            $holds = $payroll['hold_deduction'] ?? 0;
            
            $totalBase += $payroll['base_salary'];
            $totalOT += $payroll['overtime'] ?? 0;
            $totalFine += $payroll['fine'] ?? 0;
            $totalAdv += $adv;
            $totalPayable += $payroll['total_salary'];

            $html .= '<tr>
                <td align="left"><strong>' . $payroll['name'] . '</strong><br/><small>' . $payroll['mobile'] . '</small></td>
                <td>&#8377;' . number_format($payroll['base_salary'], 0) . '</td>
                <td>&#8377;' . number_format($payroll['overtime'] ?? 0, 0) . '</td>
                <td>&#8377;' . number_format($payroll['fine'] ?? 0, 0) . '</td>
                <td>&#8377;' . number_format($adv, 0) . '</td>
                <td>&#8377;' . number_format($holds, 0) . '</td>
                <td style="font-weight: bold; background-color: #fefce8;">&#8377;' . number_format($payroll['total_salary'], 0) . '</td>
                <td>' . ($payroll['paid'] ? '<span style="color: green;">Paid</span>' : '<span style="color: #ca8a04;">Pending</span>') . '</td>
            </tr>';
        }

        $html .= '<tr style="background-color: #f8f9fa; font-weight: bold;">
            <td align="right">TOTAL</td>
            <td>&#8377;' . number_format($totalBase, 0) . '</td>
            <td>&#8377;' . number_format($totalOT, 0) . '</td>
            <td>&#8377;' . number_format($totalFine, 0) . '</td>
            <td>&#8377;' . number_format($totalAdv, 0) . '</td>
            <td>-</td>
            <td style="background-color: #fefce8;">&#8377;' . number_format($totalPayable, 0) . '</td>
            <td></td>
        </tr>';

        $html .= '</table>';

        $pdf->writeHTML($html, true, false, true, false, '');
        
        // Footer info
        $pdf->Ln(5);
        $pdf->SetFont('helvetica', 'I', 7);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 5, 'Generated on ' . date('d-m-Y H:i') . ' by Chay Chaupal', 0, 0, 'C');

        $pdf->Output('Salary_Report_' . $data['month'] . '_' . $data['year'] . '.pdf', 'D');
        exit();
    }

    private function exportAdvancesPDF($data)
    {
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        $pdf->SetCreator('Chay Chaupal');
        $pdf->SetAuthor('Chay Chaupal');
        $pdf->SetTitle('Advance Payment History');

        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(TRUE, 15);
        $pdf->AddPage();

        // Use professional header helper
        $this->drawPDFHeader($pdf, $data);

        $pdf->SetFont('dejavusans', 'B', 11);
        $pdf->SetFillColor(245, 244, 242);
        $pdf->Cell(0, 8, ' ADVANCE PAYMENT HISTORY', 0, 1, 'L', true);
        $pdf->SetFont('dejavusans', '', 8);
        $pdf->Cell(0, 5, 'From: ' . date('d-m-Y', strtotime($data['startDate'])) . ' To: ' . date('d-m-Y', strtotime($data['endDate'])), 0, 1, 'L');
        $pdf->Ln(2);

        $html = '<table cellpadding="4" border="1" style="border-color: #ddd; font-size: 9px; text-align: center;">
            <tr style="background-color: #42291e; color: #ffffff; font-weight: bold;">
                <td width="30%">Employee</td>
                <td width="20%">Amount</td>
                <td width="30%">Reason</td>
                <td width="20%">Date</td>
            </tr>';

        $total = 0;
        foreach ($data['advances'] as $advance) {
            $total += $advance['amount'];
            $html .= '<tr>
                <td align="left"><strong>' . $advance['name'] . '</strong></td>
                <td>&#8377;' . number_format($advance['amount'], 0) . '</td>
                <td>' . ($advance['reason'] ?: '-') . '</td>
                <td>' . date('d-m-Y', strtotime($advance['date'])) . '</td>
            </tr>';
        }

        $html .= '<tr style="background-color: #f8f9fa; font-weight: bold;">
            <td align="right">TOTAL</td>
            <td>&#8377;' . number_format($total, 0) . '</td>
            <td colspan="2"></td>
        </tr>';

        $html .= '</table>';

        $pdf->writeHTML($html, true, false, true, false, '');

        // Footer info
        $pdf->Ln(5);
        $pdf->SetFont('helvetica', 'I', 7);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->Cell(0, 5, 'Generated on ' . date('d-m-Y H:i') . ' by Chay Chaupal', 0, 0, 'C');

        $pdf->Output('Advance_Reports_' . date('d-m-Y') . '.pdf', 'D');
        exit();
    }
}