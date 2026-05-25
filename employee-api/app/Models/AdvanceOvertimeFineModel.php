<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class AdvanceOvertimeFineModel extends Model
{
    public const TYPE_ADVANCE = 'advance';
    public const TYPE_ADVANCE_PAID = 'advance_paid';
    public const TYPE_OVERTIME = 'overtime';
    public const TYPE_FINE = 'fine';
    public const TYPE_DEDUCTION = 'deduction';
    public const TYPE_SAVING_DEPOSIT = 'saving_deposit';
    public const TYPE_SAVING_WITHDRAW = 'saving_withdraw';
    public const TYPE_TRANSFER_LOAN_TO_SAVING = 'transfer_loan_to_saving';
    public const TYPE_TRANSFER_SAVING_TO_LOAN = 'transfer_saving_to_loan';

    protected $table = 'advance_overtime_fine';
    protected $primaryKey = 'id';
    protected $allowedFields = ['employee_id', 'date', 'type', 'amount', 'repay_months', 'notes'];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    protected $beforeInsert = ['roundAmount'];
    protected $beforeUpdate = ['roundAmount'];

    protected function roundAmount(array $data)
    {
        if (isset($data['data']['amount'])) {
            $data['data']['amount'] = (float) round($data['data']['amount'], 0);
        }
        return $data;
    }

    protected $validationRules = [
        'employee_id' => 'required|integer',
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
            self::TYPE_ADVANCE => 'Loan Added',
            self::TYPE_ADVANCE_PAID => 'Loan Received',
            self::TYPE_OVERTIME => 'Overtime',
            self::TYPE_FINE => 'Fine',
            self::TYPE_DEDUCTION => 'Deduction',
            self::TYPE_SAVING_DEPOSIT => 'Saving Deposit',
            self::TYPE_SAVING_WITHDRAW => 'Saving Withdraw',
            self::TYPE_TRANSFER_LOAN_TO_SAVING => 'Loan to Saving Transfer',
            self::TYPE_TRANSFER_SAVING_TO_LOAN => 'Saving to Loan Transfer',
        ];
        return $labels[$type] ?? $type;
    }

    public function getLoanBalanceForEmployee(int $employeeId, ?int $excludeId = null): float
    {
        $credits = $this->sumTypes($employeeId, [
            self::TYPE_ADVANCE,
            self::TYPE_TRANSFER_SAVING_TO_LOAN,
        ], $excludeId);
        $debits = $this->sumTypes($employeeId, [
            self::TYPE_ADVANCE_PAID,
            self::TYPE_TRANSFER_LOAN_TO_SAVING,
        ], $excludeId);

        return round(max(0, $credits - $debits), 0);
    }

    public function getSavingBalanceForEmployee(int $employeeId, ?int $excludeId = null): float
    {
        $credits = $this->sumTypes($employeeId, [
            self::TYPE_SAVING_DEPOSIT,
            self::TYPE_TRANSFER_LOAN_TO_SAVING,
        ], $excludeId);
        $debits = $this->sumTypes($employeeId, [
            self::TYPE_SAVING_WITHDRAW,
            self::TYPE_TRANSFER_SAVING_TO_LOAN,
        ], $excludeId);

        return round(max(0, $credits - $debits), 0);
    }

    public function getFinancialSummaryForEmployee(int $employeeId): array
    {
        return [
            'loan_balance' => $this->getLoanBalanceForEmployee($employeeId),
            'saving_balance' => $this->getSavingBalanceForEmployee($employeeId),
            'total_loan_added' => $this->sumTypes($employeeId, [self::TYPE_ADVANCE]),
            'total_loan_received' => $this->sumTypes($employeeId, [self::TYPE_ADVANCE_PAID]),
            'total_saving_deposit' => $this->sumTypes($employeeId, [self::TYPE_SAVING_DEPOSIT]),
            'total_saving_withdraw' => $this->sumTypes($employeeId, [self::TYPE_SAVING_WITHDRAW]),
            'loan_to_saving' => $this->sumTypes($employeeId, [self::TYPE_TRANSFER_LOAN_TO_SAVING]),
            'saving_to_loan' => $this->sumTypes($employeeId, [self::TYPE_TRANSFER_SAVING_TO_LOAN]),
        ];
    }

    private function sumTypes(int $employeeId, array $types, ?int $excludeId = null): float
    {
        $builder = $this->builder()
            ->selectSum('amount', 'total')
            ->where('employee_id', $employeeId)
            ->whereIn('type', $types);

        if ($excludeId !== null) {
            $builder->where('id !=', $excludeId);
        }

        $row = $builder->get()->getRow();

        return (float) ($row->total ?? 0);
    }

    /**
     * Get repayment status for an advance entry (type=advance).
     * Based on schedule: how many installments have fallen due by today.
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
        $perInstallment = round($amount / $n, 0);
        $amountPaid = round($perInstallment * $installmentsDue, 0);
        $amountRemaining = round($amount - $amountPaid, 0);
        return [
            'installments_due' => $installmentsDue,
            'installments_total' => $n,
            'amount_paid' => $amountPaid,
            'amount_remaining' => $amountRemaining,
            'is_complete' => $installmentsDue >= $n,
        ];
    }

    /**
     * Get summed advance, overtime, fine for an employee for a given month/year.
     */
    public function getSumsForEmployeeMonth(int $employeeId, int $month, int $year): array
    {
        $result = ['advance' => 0, 'overtime' => 0, 'fine' => 0, 'deduction' => 0];

        // Overtime, fine, deduction: sum for the given month only
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
                $result['advance'] += round($amount / $n, 0);
            }
        }

        $result['advance'] = round($result['advance'], 0);
        return $result;
    }

    public function getTotalAdvanceForEmployee(int $employeeId): float
    {
        return $this->sumTypes($employeeId, [self::TYPE_ADVANCE]);
    }

    public function getTotalRepaidForEmployee(int $employeeId): float
    {
        return $this->sumTypes($employeeId, [self::TYPE_ADVANCE_PAID]);
    }
}
