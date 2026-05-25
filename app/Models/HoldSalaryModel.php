<?php

namespace App\Models;

use CodeIgniter\Model;

class HoldSalaryModel extends Model
{
    protected $table = 'hold_salary';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'employee_id', 'initial_hold_days', 'remaining_hold_days',
        'daily_rate', 'payroll_id', 'total', 'status', 'created_at', 'updated_at'
    ];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    /** Legacy: used only if createHold() is called explicitly (e.g. optional policy). */
    public const HOLD_DAYS = 10;

    /** If working days in a month are less than this, those worked days are added to hold. */
    public const MIN_WORKING_DAYS_PER_MONTH = 10;

    /** Each payroll releases up to this many days from hold into that payroll. */
    public const RELEASE_DAYS_PER_PAYROLL = 10;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_RELEASED = 'released';

    /**
     * Get single active hold for employee (legacy / backward compat). Prefer getActiveHoldsForEmployee.
     */
    public function getActiveHold(int $employeeId): ?array
    {
        return $this->where('employee_id', $employeeId)
            ->where('status', self::STATUS_ACTIVE)
            ->where('remaining_hold_days >', 0)
            ->first();
    }

    /**
     * Get all active hold rows for employee (status=active and remaining_hold_days > 0).
     */
    public function getActiveHoldsForEmployee(int $employeeId): array
    {
        return $this->where('employee_id', $employeeId)
            ->where('status', self::STATUS_ACTIVE)
            ->where('remaining_hold_days >', 0)
            ->orderBy('id', 'ASC')
            ->findAll();
    }

    /**
     * Get first hold row for employee (any status). Prefer getActiveHoldsForEmployee for active rows.
     */
    public function getHoldForEmployee(int $employeeId): ?array
    {
        return $this->where('employee_id', $employeeId)->orderBy('id', 'DESC')->first();
    }

    /**
     * Create initial 10-day hold for new employee (first payroll).
     */
    public function createHold(int $employeeId, float $dailyRate): int|false
    {
        $existing = $this->getHoldForEmployee($employeeId);
        if ($existing) {
            return (int) $existing['id'];
        }
        $total = round(self::HOLD_DAYS * $dailyRate, 2);
        return $this->insert([
            'employee_id' => $employeeId,
            'initial_hold_days' => self::HOLD_DAYS,
            'remaining_hold_days' => self::HOLD_DAYS,
            'daily_rate' => $dailyRate,
            'total' => $total,
            'status' => self::STATUS_ACTIVE,
        ]);
    }

    /**
     * Add days to hold by inserting a new row. When working_days < MIN_WORKING_DAYS_PER_MONTH,
     * those working_days are added as a new hold row. Multiple rows per employee allowed.
     *
     * @param int|null $payrollId Optional payroll id this hold is linked to (month when hold was created).
     */
    public function addToHold(int $employeeId, float $daysToAdd, float $dailyRateForNewDays, ?int $payrollId = null): bool
    {
        if ($daysToAdd <= 0) {
            return true;
        }

        $total = round($daysToAdd * $dailyRateForNewDays, 2);
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

    /**
     * Total hold amount linked to a specific payroll (hold_salary rows where payroll_id = $payrollId).
     * Used to sync payroll hold_deduction when it was missing.
     */
    public function getHoldAmountForPayrollId(int $payrollId): float
    {
        $row = $this->selectSum('total')
            ->where('payroll_id', $payrollId)
            ->first();
        return (float) ($row['total'] ?? 0);
    }

    /**
     * Release hold into a payroll: reduce remaining days, record release, add amount to payroll.
     */
    public function releaseIntoPayroll(
        int $holdId,
        int $payrollId,
        float $daysToRelease,
        float $amount,
        string $releaseType = 'auto',
        ?string $notes = null
    ): bool {
        $hold = $this->find($holdId);
        if (!$hold || (float) $hold['remaining_hold_days'] <= 0) {
            return false;
        }

        $days = min((float) $hold['remaining_hold_days'], $daysToRelease);
        if ($days <= 0) {
            return false;
        }

        $this->db->transStart();

        $newRemaining = max(0, (float) $hold['remaining_hold_days'] - $days);
        $this->update($holdId, [
            'remaining_hold_days' => $newRemaining,
            'status' => $newRemaining <= 0 ? self::STATUS_RELEASED : self::STATUS_ACTIVE,
        ]);

        $releaseModel = new HoldSalaryReleaseModel();
        $releaseModel->insert([
            'hold_salary_id' => $holdId,
            'payroll_id' => $payrollId,
            'release_type' => $releaseType,
            'days_released' => $days,
            'amount_released' => $amount,
            'notes' => $notes,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        $payrollModel = new PayrollModel();
        $payroll = $payrollModel->find($payrollId);
        if ($payroll) {
            $currentReleased = (float) ($payroll['hold_salary_released'] ?? 0);
            $payrollModel->skipValidation(true)->update($payrollId, [
                'hold_salary_released' => $currentReleased + $amount,
                'total_salary' => (float) ($payroll['total_salary'] ?? 0) + $amount,
            ]);
        }

        $this->db->transComplete();
        return $this->db->transStatus();
    }

    /**
     * Get hold summary for profile / UI: sum of all active hold rows for employee.
     * Also returns rows list for display (payroll_id, total, remaining_hold_days per row).
     */
    public function getHoldSummaryForEmployee(int $employeeId): array
    {
        $rows = $this->getActiveHoldsForEmployee($employeeId);
        if (empty($rows)) {
            return [
                'has_hold' => false,
                'remaining_days' => 0,
                'remaining_amount' => 0,
                'initial_days' => 0,
                'status' => null,
                'rows' => [],
                'hold_id' => null,
            ];
        }

        $remainingDays = 0.0;
        $remainingAmount = 0.0;
        $initialDays = 0.0;
        $list = [];
        foreach ($rows as $row) {
            $rem = (float) $row['remaining_hold_days'];
            $rate = (float) $row['daily_rate'];
            $remainingDays += $rem;
            $remainingAmount += round($rem * $rate, 2);
            $initialDays += (float) $row['initial_hold_days'];
            $list[] = [
                'id' => (int) $row['id'],
                'payroll_id' => isset($row['payroll_id']) ? (int) $row['payroll_id'] : null,
                'initial_hold_days' => (float) $row['initial_hold_days'],
                'remaining_hold_days' => $rem,
                'daily_rate' => $rate,
                'total' => (float) ($row['total'] ?? ($rem * $rate)),
            ];
        }

        return [
            'has_hold' => true,
            'hold_id' => (int) $rows[0]['id'],
            'remaining_days' => round($remainingDays, 2),
            'remaining_amount' => round($remainingAmount, 2),
            'initial_days' => round($initialDays, 2),
            'status' => self::STATUS_ACTIVE,
            'rows' => $list,
        ];
    }

    /**
     * Release all active hold rows for this employee into the given payroll in one go.
     * Sums remaining days and amount from all rows, updates payroll, marks all holds released.
     */
    public function releaseAllIntoPayroll(int $employeeId, int $payrollId): bool
    {
        $rows = $this->getActiveHoldsForEmployee($employeeId);
        if (empty($rows)) {
            return false;
        }

        $totalDays = 0.0;
        $totalAmount = 0.0;
        foreach ($rows as $row) {
            $rem = (float) $row['remaining_hold_days'];
            $rate = (float) $row['daily_rate'];
            $totalDays += $rem;
            $totalAmount += round($rem * $rate, 2);
        }
        if ($totalDays <= 0) {
            return false;
        }

        $this->db->transStart();

        foreach ($rows as $row) {
            $holdId = (int) $row['id'];
            $days = (float) $row['remaining_hold_days'];
            $amount = round($days * (float) $row['daily_rate'], 2);
            $this->update($holdId, [
                'remaining_hold_days' => 0,
                'status' => self::STATUS_RELEASED,
            ]);
            $releaseModel = new HoldSalaryReleaseModel();
            $releaseModel->insert([
                'hold_salary_id' => $holdId,
                'payroll_id' => $payrollId,
                'release_type' => 'manual',
                'days_released' => $days,
                'amount_released' => $amount,
                'notes' => 'Release all holds into payroll',
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }

        $payrollModel = new PayrollModel();
        $payroll = $payrollModel->find($payrollId);
        if ($payroll) {
            $currentReleased = (float) ($payroll['hold_salary_released'] ?? 0);
            $payrollModel->skipValidation(true)->update($payrollId, [
                'hold_salary_released' => $currentReleased + $totalAmount,
                'total_salary' => (float) ($payroll['total_salary'] ?? 0) + $totalAmount,
            ]);
        }

        $this->db->transComplete();
        return $this->db->transStatus();
    }

    /**
     * Get release history for employee (all hold rows for this employee).
     */
    public function getReleaseHistory(int $employeeId): array
    {
        $holdIds = $this->where('employee_id', $employeeId)->findColumn('id');
        if (empty($holdIds)) {
            return [];
        }

        $releaseModel = new HoldSalaryReleaseModel();
        return $releaseModel->select('hold_salary_releases.*, payroll.month, payroll.year, payroll.paid')
            ->join('payroll', 'payroll.id = hold_salary_releases.payroll_id')
            ->whereIn('hold_salary_releases.hold_salary_id', $holdIds)
            ->orderBy('hold_salary_releases.created_at', 'DESC')
            ->findAll();
    }
}
