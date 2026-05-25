<?php

namespace EmployeeApi\Models;

use CodeIgniter\Model;

class HoldSalaryModel extends Model
{
    protected $table = 'hold_salary';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'employee_id', 'initial_hold_days', 'remaining_hold_days',
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

    public function addToHold(int $employeeId, float $daysToAdd, float $dailyRateForNewDays, ?int $payrollId = null): bool
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
}
