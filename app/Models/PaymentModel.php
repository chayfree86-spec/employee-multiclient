<?php

namespace App\Models;

use CodeIgniter\Model;

class PaymentModel extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'id';
    protected $allowedFields = ['payroll_id', 'amount', 'payment_date', 'method'];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = '';

    protected $validationRules = [
        'payroll_id' => 'required|integer|is_not_unique[payroll.id]',
        'amount' => 'required|numeric|greater_than[0]',
        'payment_date' => 'required|valid_date[Y-m-d]',
        'method' => 'permit_empty|max_length[50]'
    ];

    protected $validationMessages = [
        'payroll_id' => [
            'required' => 'Payroll ID is required',
            'integer' => 'Payroll ID must be an integer',
            'is_not_unique' => 'Invalid payroll ID'
        ],
        'amount' => [
            'required' => 'Amount is required',
            'numeric' => 'Amount must be numeric',
            'greater_than' => 'Amount must be greater than 0'
        ],
        'payment_date' => [
            'required' => 'Payment date is required',
            'valid_date' => 'Invalid payment date format'
        ],
        'method' => [
            'max_length' => 'Payment method cannot exceed 50 characters'
        ]
    ];

    public function getPaymentsByPayroll($payrollId)
    {
        return $this->where('payroll_id', $payrollId)
                   ->orderBy('payment_date', 'DESC')
                   ->findAll();
    }

    public function getTotalPaidByPayroll($payrollId)
    {
        return $this->selectSum('amount')
                   ->where('payroll_id', $payrollId)
                   ->get()
                   ->getRow()
                   ->amount ?? 0;
    }

    public function markPayrollAsPaid($payrollId)
    {
        $payrollModel = new PayrollModel();
        $payroll = $payrollModel->find($payrollId);
        if ($payroll) {
            $totalPaid = $this->getTotalPaidByPayroll($payrollId);
            if ($totalPaid >= $payroll['total_salary']) {
                $payrollModel->update($payrollId, ['paid' => 1]);
                return true;
            }
        }
        return false;
    }
}