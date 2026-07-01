<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class HoldSalaryModel extends Model
{
    protected $table = 'hold_salary';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'user_id', 'employee_id', 'initial_hold_days', 'remaining_hold_days',
        'daily_rate', 'payroll_id', 'total', 'status'
    ];
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $beforeInsert = ['roundMonetary'];
    protected $beforeUpdate = ['roundMonetary'];

    protected function roundMonetary(array $data)
    {
        $fields = ['daily_rate', 'total'];
        foreach ($fields as $field) {
            if (isset($data['data'][$field])) {
                $data['data'][$field] = (float) round($data['data'][$field], 0);
            }
        }
        return $data;
    }

    public const MIN_WORKING_DAYS_PER_MONTH = 10;
    public const STATUS_ACTIVE = 'active';

    public function addToHold(int $employeeId, float $daysToAdd, float $dailyRateForNewDays, ?int $payrollId = null, ?int $userId = null): bool
    {
        if ($daysToAdd <= 0) {
            return true;
        }

        $total = (float)round($daysToAdd * $dailyRateForNewDays, 0);
        $data = [
            'employee_id' => $employeeId,
            'initial_hold_days' => $daysToAdd,
            'remaining_hold_days' => $daysToAdd,
            'daily_rate' => $dailyRateForNewDays,
            'total' => $total,
            'status' => self::STATUS_ACTIVE,
        ];
        if ($userId !== null) {
            $data['user_id'] = $userId;
        }
        if ($payrollId !== null) {
            $data['payroll_id'] = $payrollId;
        }
        return (bool) $this->insert($data);
    }

    public function releaseHold(int $employeeId, float $daysToRelease): float
    {
        $activeHolds = $this->where('employee_id', $employeeId)
                            ->where('status', self::STATUS_ACTIVE)
                            ->orderBy('created_at', 'ASC')
                            ->findAll();
        
        $totalReleasedAmount = 0.0;
        $remainingToRelease = $daysToRelease;

        foreach ($activeHolds as $hold) {
            if ($remainingToRelease <= 0) break;

            $available = (float) $hold['remaining_hold_days'];
            $willRelease = min($available, $remainingToRelease);
            $amount = round($willRelease * (float)$hold['daily_rate'], 0);

            $newRemaining = $available - $willRelease;
            $newTotal = round($newRemaining * (float)$hold['daily_rate'], 0);

            $updateData = [
                'remaining_hold_days' => $newRemaining,
                'total' => $newTotal
            ];

            if ($newRemaining <= 0.5) { // Close enough to zero
                $updateData['status'] = 'released';
            }

            $this->update($hold['id'], $updateData);

            $totalReleasedAmount += $amount;
            $remainingToRelease -= $willRelease;
        }

        return (float)round($totalReleasedAmount, 0);
    }

    public function previewReleaseHold(int $employeeId, float $daysToRelease): float
    {
        $activeHolds = $this->where('employee_id', $employeeId)
                            ->where('status', self::STATUS_ACTIVE)
                            ->orderBy('created_at', 'ASC')
                            ->findAll();

        $totalReleasedAmount = 0.0;
        $remainingToRelease = $daysToRelease;

        foreach ($activeHolds as $hold) {
            if ($remainingToRelease <= 0) {
                break;
            }

            $available = (float) $hold['remaining_hold_days'];
            $willRelease = min($available, $remainingToRelease);
            $totalReleasedAmount += round($willRelease * (float) $hold['daily_rate'], 0);
            $remainingToRelease -= $willRelease;
        }

        return (float) round($totalReleasedAmount, 0);
    }

    public function getTotalHoldForEmployee(int $employeeId): array
    {
        $row = $this->selectSum('remaining_hold_days')
            ->selectSum('total')
            ->where('employee_id', $employeeId)
            ->where('status', self::STATUS_ACTIVE)
            ->first();

        return [
            'total_hold_days' => (float)($row['remaining_hold_days'] ?? 0),
            'total_hold_amount' => (float)($row['total'] ?? 0),
        ];
    }

    /**
     * Active hold totals for many employees in a single grouped query.
     * Returns [employee_id => ['total_hold_days' => x, 'total_hold_amount' => y]].
     * Used by the employee list so it doesn't run one query per employee.
     */
    public function getActiveHoldMap(array $employeeIds): array
    {
        $employeeIds = array_values(array_unique(array_map('intval', $employeeIds)));
        if ($employeeIds === []) {
            return [];
        }

        $rows = $this->select('employee_id, SUM(remaining_hold_days) as days, SUM(total) as amount')
            ->whereIn('employee_id', $employeeIds)
            ->where('status', self::STATUS_ACTIVE)
            ->groupBy('employee_id')
            ->findAll();

        $map = [];
        foreach ($rows as $row) {
            $map[(int)$row['employee_id']] = [
                'total_hold_days' => (float)($row['days'] ?? 0),
                'total_hold_amount' => (float)($row['amount'] ?? 0),
            ];
        }
        return $map;
    }

    /**
     * Hold salary is deducted only ONCE - in the month the hold was created
     * (e.g. when a new staff joins and their first salary is generated).
     * This returns the original hold amount created in the given month so it is
     * never re-deducted in subsequent months. Uses initial_hold_days * daily_rate
     * so a later partial release does not change the original creation-month amount.
     */
    public function getHoldCreatedInMonth(int $employeeId, int $month, int $year): array
    {
        $row = $this->select('SUM(initial_hold_days * daily_rate) as amount, SUM(initial_hold_days) as days')
            ->where('employee_id', $employeeId)
            ->where('MONTH(created_at)', $month)
            ->where('YEAR(created_at)', $year)
            ->first();

        return [
            'total_hold_days' => (float)($row['days'] ?? 0),
            'total_hold_amount' => (float)round((float)($row['amount'] ?? 0), 0),
        ];
    }
}
