<?php

namespace App\Models;

use CodeIgniter\Model;

class AdvanceOvertimeFineModel extends Model
{
    protected $table = 'advance_overtime_fine';
    protected $primaryKey = 'id';
    protected $allowedFields = ['employee_id', 'date', 'type', 'amount', 'repay_months', 'notes'];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = '';

    protected $validationRules = [
        'employee_id' => 'required|integer|is_not_unique[employees.id]',
        'date' => 'required|valid_date[Y-m-d]',
        'type' => 'required|in_list[advance,advance_paid,overtime,fine,deduction,saving_deposit,saving_withdraw,transfer_loan_to_saving,transfer_saving_to_loan]',
        'amount' => 'required|numeric|greater_than[0]',
        'repay_months' => 'permit_empty|integer|greater_than_equal_to[1]|less_than_equal_to[60]',
        'notes' => 'permit_empty|string',
    ];

    /** Type labels for display */
    public static function typeLabel(string $type): string
    {
        $labels = [
            'advance' => 'Advance',
            'advance_paid' => 'Advance Paid',
            'overtime' => 'Overtime',
            'fine' => 'Fine',
            'deduction' => 'Deduction',
            'saving_deposit' => 'Saving Deposit',
            'saving_withdraw' => 'Saving Withdraw',
            'transfer_loan_to_saving' => 'Loan to Saving Transfer',
            'transfer_saving_to_loan' => 'Saving to Loan Transfer',
        ];
        return $labels[$type] ?? $type;
    }

    /**
     * Get repayment status for an advance entry (type=advance).
     * Based on schedule: how many installments have fallen due by today.
     *
     * @param array $advance Row with date, amount, repay_months
     * @param string|null $asOfDate Optional date (Y-m-d) to compute as of; default today
     * @return array { installments_due, installments_total, amount_paid, amount_remaining, is_complete }
     */
    public static function getAdvanceRepaymentStatus(array $advance, ?string $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?? date('Y-m-d');
        $amount = (float) ($advance['amount'] ?? 0);
        $n = max(1, (int) ($advance['repay_months'] ?? 1));
        $advDate = $advance['date'] ?? null;
        if (!$advDate || $amount <= 0) {
            return [
                'installments_due' => 0,
                'installments_total' => $n,
                'amount_paid' => 0.0,
                'amount_remaining' => $amount,
                'is_complete' => false,
            ];
        }
        $advMonth = (int) date('n', strtotime($advDate));
        $advYear = (int) date('Y', strtotime($advDate));
        $asOfMonth = (int) date('n', strtotime($asOfDate));
        $asOfYear = (int) date('Y', strtotime($asOfDate));
        $monthsElapsed = ($asOfYear - $advYear) * 12 + ($asOfMonth - $advMonth) + 1;
        $installmentsDue = max(0, min($monthsElapsed, $n));
        $perInstallment = round($amount / $n, 2);
        $amountPaid = round($perInstallment * $installmentsDue, 2);
        $amountRemaining = round($amount - $amountPaid, 2);
        return [
            'installments_due' => $installmentsDue,
            'installments_total' => $n,
            'amount_paid' => $amountPaid,
            'amount_remaining' => $amountRemaining,
            'is_complete' => $installmentsDue >= $n,
        ];
    }

    /**
     * Get all advance entries (for repayment status view), with employee name.
     */
    public function getAdvanceListForRepayment(): array
    {
        return $this->select('advance_overtime_fine.*, employees.name as employee_name, employees.mobile')
            ->join('employees', 'employees.id = advance_overtime_fine.employee_id')
            ->where('advance_overtime_fine.type', 'advance')
            ->orderBy('advance_overtime_fine.date', 'DESC')
            ->orderBy('advance_overtime_fine.id', 'DESC')
            ->findAll();
    }

    /**
     * Get summed advance, overtime, fine for an employee for a given month/year.
     * Used when generating payroll.
     */
    public function getSumsForEmployeeMonth(int $employeeId, int $month, int $year): array
    {
        $result = ['advance' => 0, 'overtime' => 0, 'fine' => 0];

        // Overtime and fine: sum for the given month only
        $rows = $this->select('type, SUM(amount) as total')
            ->where('employee_id', $employeeId)
            ->where('type !=', 'advance')
            ->where('MONTH(date)', $month)
            ->where('YEAR(date)', $year)
            ->groupBy('type')
            ->findAll();
        foreach ($rows as $row) {
            $t = $row['type'] ?? '';
            if (isset($result[$t])) {
                $result[$t] = (float) ($row['total'] ?? 0);
            }
        }

        // Advance: installment-based
        $advances = $this->select('date, amount, repay_months')
            ->where('employee_id', $employeeId)
            ->where('type', 'advance')
            ->findAll();

        foreach ($advances as $row) {
            $advDate = $row['date'] ?? null;
            $amount = (float) ($row['amount'] ?? 0);
            $n = max(1, (int) ($row['repay_months'] ?? 1));

            if (!$advDate || $amount <= 0) {
                continue;
            }

            $advMonth = (int) date('n', strtotime($advDate));
            $advYear = (int) date('Y', strtotime($advDate));

            $monthIndex = ($year - $advYear) * 12 + ($month - $advMonth) + 1;
            if ($monthIndex >= 1 && $monthIndex <= $n) {
                $result['advance'] += round($amount / $n, 2);
            }
        }

        $result['advance'] = round($result['advance'], 2);
        return $result;
    }

    /**
     * Total advance amount given to an employee (sum of all type=advance entries).
     */
    public function getTotalAdvanceForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('amount')
            ->where('employee_id', $employeeId)
            ->where('type', 'advance')
            ->first();
        return (float) ($row['amount'] ?? 0);
    }

    /**
     * Total overtime amount for an employee (sum of all type=overtime entries).
     */
    public function getTotalOvertimeForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('amount')
            ->where('employee_id', $employeeId)
            ->where('type', 'overtime')
            ->first();
        return (float) ($row['amount'] ?? 0);
    }

    /**
     * Total fine amount for an employee (sum of all type=fine entries).
     */
    public function getTotalFineForEmployee(int $employeeId): float
    {
        $row = $this->selectSum('amount')
            ->where('employee_id', $employeeId)
            ->where('type', 'fine')
            ->first();
        return (float) ($row['amount'] ?? 0);
    }

    /**
     * Get entries for an employee by type, optionally filtered by month/year.
     * For type='advance', includes both advance (add) and advance_repayment (apply) entries.
     */
    public function getEntriesForEmployee(int $employeeId, string $type, ?int $month = null, ?int $year = null): array
    {
        $types = ($type === 'advance') ? ['advance', 'advance_paid'] : [$type];
        $builder = $this->where('employee_id', $employeeId)
            ->whereIn('type', $types)
            ->orderBy('date', 'DESC')
            ->orderBy('id', 'DESC');
        if ($month !== null && $year !== null) {
            $builder->where('MONTH(date)', $month)->where('YEAR(date)', $year);
        }
        return $builder->findAll();
    }

    /**
     * Get all entries, optionally by month/year, with employee name.
     */
    public function getList(?int $month = null, ?int $year = null): array
    {
        $builder = $this->select('advance_overtime_fine.*, employees.name as employee_name, employees.mobile')
            ->join('employees', 'employees.id = advance_overtime_fine.employee_id')
            ->orderBy('advance_overtime_fine.date', 'DESC')
            ->orderBy('advance_overtime_fine.id', 'DESC');
        if ($month !== null && $year !== null) {
            $builder->where('MONTH(advance_overtime_fine.date)', $month)
                ->where('YEAR(advance_overtime_fine.date)', $year);
        }
        return $builder->findAll();
    }

    /**
     * Get list of employee IDs who have at least one active (unpaid) advance.
     */
    public function getEmployeesWithActiveAdvances(): array
    {
        // Get all advances
        $advances = $this->where('type', 'advance')->findAll();
        $activeEmployeeIds = [];
        $currentMonth = (int) date('n');
        $currentYear = (int) date('Y');

        foreach ($advances as $advance) {
            $empId = (int) ($advance['employee_id'] ?? 0);
            
            // Skip if no employee ID or already marked active
            if (!$empId || in_array($empId, $activeEmployeeIds)) {
                continue;
            }

            $advDate = $advance['date'] ?? null;
            if (!$advDate) continue;

            $n = max(1, (int) ($advance['repay_months'] ?? 1));
            $advMonth = (int) date('n', strtotime($advDate));
            $advYear = (int) date('Y', strtotime($advDate));

            // Calculate months elapsed since advance start
            $monthsElapsed = ($currentYear - $advYear) * 12 + ($currentMonth - $advMonth) + 1;

            if ($monthsElapsed <= $n) {
                $activeEmployeeIds[] = $empId;
            }
        }
        
        return $activeEmployeeIds;
    }
}
