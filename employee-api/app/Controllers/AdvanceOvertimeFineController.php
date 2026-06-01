<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\AdvanceOvertimeFineModel;

class AdvanceOvertimeFineController extends BaseApiController
{
    /**
     * Get list of AOF records for an employee
     */
    public function index()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new AdvanceOvertimeFineModel();
        $employee_id = $this->request->getGet('employee_id');
        $type = $this->request->getGet('type'); // advance, overtime, fine
        $month = $this->request->getGet('month');
        $year = $this->request->getGet('year');

        $query = $model->where('user_id', $userId);
        if ($employee_id) $query = $query->where('employee_id', $employee_id);
        if ($type) $query = $query->where('type', $type);
        if ($month) $query = $query->where('MONTH(date)', (int) $month);
        if ($year) $query = $query->where('YEAR(date)', (int) $year);

        $results = $query->orderBy('date', 'DESC')->findAll();
        return $this->respondSuccess($results, 'Records retrieved');
    }

    /**
     * Create new record
     */
    public function create()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new AdvanceOvertimeFineModel();
        $data = $this->request->getJSON(true) ?? $this->request->getPost();
        if (!$this->employeeBelongsToUser((int) ($data['employee_id'] ?? 0), $userId)) {
            return $this->respondError('Employee not found', 404);
        }
        $data['user_id'] = $userId;
        $balanceError = $this->validateMovementBalances($model, $data);

        if ($balanceError !== null) {
            return $balanceError;
        }

        if ($model->insert($data)) {
            $data['id'] = $model->getInsertID();
            return $this->respondSuccess($data, 'Record created successfully', 201);
        }

        return $this->respondError('Failure', 400, $model->errors());
    }

    /**
     * Delete record
     */
    public function delete($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new AdvanceOvertimeFineModel();
        if (!$model->where('user_id', $userId)->find($id)) {
            return $this->respondError('Record not found', 404);
        }
        if ($model->delete($id)) {
            return $this->respondSuccess(null, 'Record deleted');
        }
        return $this->respondError('Delete failed');
    }

    /**
     * Update record
     */
    public function update($id = null)
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new AdvanceOvertimeFineModel();
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        // Remove blank values so they don't overwrite existing data
        $data = $this->filterBlankValues($data);

        if (empty($data)) {
            return $this->respondError('No valid data provided');
        }

        $existing = $model->where('user_id', $userId)->find($id);
        if (!$existing) {
            return $this->respondError('Record not found', 404);
        }
        if (isset($data['employee_id']) && !$this->employeeBelongsToUser((int) $data['employee_id'], $userId)) {
            return $this->respondError('Employee not found', 404);
        }

        $merged = array_merge($existing, $data);
        $balanceError = $this->validateMovementBalances($model, $merged, (int) $id);
        if ($balanceError !== null) {
            return $balanceError;
        }

        if ($model->update($id, $data)) {
            $data['id'] = $id;
            return $this->respondSuccess($data, 'Record updated successfully');
        }

        return $this->respondError('Update failed', 400, $model->errors());
    }

    /**
     * Get summary of AOF for an employee
     */
    public function summary()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $employeeId = $this->request->getGet('employee_id');
        if (!$employeeId) {
            return $this->respondError('Employee ID is required');
        }

        if (!$this->employeeBelongsToUser((int) $employeeId, $userId)) {
            return $this->respondError('Employee not found', 404);
        }

        $model = new AdvanceOvertimeFineModel();
        $summary = $model->getFinancialSummaryForEmployee((int)$employeeId);

        return $this->respondSuccess($summary, 'AOF summary retrieved');
    }

    public function transfer()
    {
        $userId = $this->requireUserId();
        if (!is_int($userId)) return $userId;

        $model = new AdvanceOvertimeFineModel();
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        $employeeId = (int) ($data['employee_id'] ?? 0);
        $amount = (float) ($data['amount'] ?? 0);
        $date = (string) ($data['date'] ?? '');
        $direction = (string) ($data['direction'] ?? '');
        $notes = trim((string) ($data['notes'] ?? ''));

        if ($employeeId <= 0 || $amount <= 0 || $date === '' || $direction === '') {
            return $this->respondError('Employee, date, direction and positive amount are required');
        }
        if (!$this->employeeBelongsToUser($employeeId, $userId)) {
            return $this->respondError('Employee not found', 404);
        }

        if (!in_array($direction, ['loan_to_saving', 'saving_to_loan'], true)) {
            return $this->respondError('Invalid transfer direction');
        }

        $loanBalance = $model->getLoanBalanceForEmployee($employeeId);
        $savingBalance = $model->getSavingBalanceForEmployee($employeeId);

        if ($direction === 'loan_to_saving' && $amount > $loanBalance) {
            return $this->respondError('Transfer amount exceeds loan balance', 400, [
                'loan_balance' => $loanBalance,
                'saving_balance' => $savingBalance,
            ]);
        }

        if ($direction === 'saving_to_loan' && $amount > $savingBalance) {
            return $this->respondError('Transfer amount exceeds saving balance', 400, [
                'loan_balance' => $loanBalance,
                'saving_balance' => $savingBalance,
            ]);
        }

        $type = $direction === 'loan_to_saving'
            ? AdvanceOvertimeFineModel::TYPE_TRANSFER_LOAN_TO_SAVING
            : AdvanceOvertimeFineModel::TYPE_TRANSFER_SAVING_TO_LOAN;

        $payload = [
            'user_id' => $userId,
            'employee_id' => $employeeId,
            'date' => $date,
            'type' => $type,
            'amount' => $amount,
            'repay_months' => 1,
            'notes' => $notes,
        ];

        if (!$model->insert($payload)) {
            return $this->respondError('Transfer failed', 400, $model->errors());
        }

        return $this->respondSuccess([
            'id' => $model->getInsertID(),
            'direction' => $direction,
            'amount' => round($amount, 0),
            'loan_balance' => $model->getLoanBalanceForEmployee($employeeId),
            'saving_balance' => $model->getSavingBalanceForEmployee($employeeId),
        ], 'Fund transferred successfully', 201);
    }

    private function validateMovementBalances(AdvanceOvertimeFineModel $model, array $data, ?int $excludeId = null)
    {
        $employeeId = (int) ($data['employee_id'] ?? 0);
        $type = (string) ($data['type'] ?? '');
        $amount = (float) ($data['amount'] ?? 0);

        if ($employeeId <= 0 || $amount <= 0) {
            return null;
        }

        if ($type === AdvanceOvertimeFineModel::TYPE_ADVANCE_PAID) {
            $loanBalance = $model->getLoanBalanceForEmployee($employeeId, $excludeId);
            if ($amount > $loanBalance) {
                return $this->respondError('Received amount exceeds loan balance', 400, [
                    'loan_balance' => $loanBalance,
                ]);
            }
        }

        if ($type === AdvanceOvertimeFineModel::TYPE_SAVING_WITHDRAW) {
            $savingBalance = $model->getSavingBalanceForEmployee($employeeId, $excludeId);
            if ($amount > $savingBalance) {
                return $this->respondError('Withdraw amount exceeds saving balance', 400, [
                    'saving_balance' => $savingBalance,
                ]);
            }
        }

        return null;
    }
}
