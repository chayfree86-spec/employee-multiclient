<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
    <h3>Payment History - <?= $employee['name'] ?></h3>
    <div>
        <button class="btn btn-theme-green" data-bs-toggle="modal" data-bs-target="#addPaymentModal">
            <i class="fas fa-plus me-1"></i> Add Payment
        </button>
        <a href="<?= base_url('payroll') ?>" class="btn btn-secondary ms-2">
            <i class="fas fa-arrow-left"></i> Back to Payroll
        </a>
    </div>
</div>

<?php $totalPaid = array_sum(array_column($payments, 'amount')); $remaining = $payroll['total_salary'] - $totalPaid; ?>
<div class="row mb-4 g-3">
    <div class="col-12 col-md-4">
        <div class="card bg-light">
            <div class="card-body text-center">
                <h5>Total Salary</h5>
                <h3 class="text-primary" id="payments-total-salary">₹<?= number_format($payroll['total_salary'], 0) ?></h3>
            </div>
        </div>
    </div>
    <div class="col-12 col-md-4">
        <div class="card bg-success text-white">
            <div class="card-body text-center">
                <h5>Total Paid</h5>
                <h3 id="payments-total-paid">₹<?= number_format($totalPaid, 0) ?></h3>
            </div>
        </div>
    </div>
    <div class="col-12 col-md-4">
        <div class="card bg-warning text-white">
            <div class="card-body text-center">
                <h5>Remaining</h5>
                <h3 id="payments-remaining">₹<?= number_format($remaining, 0) ?></h3>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <h5>Payment Records</h5>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($payments)): ?>
                        <tr id="payments-empty-row">
                            <td colspan="4" class="text-center text-muted">No payments recorded yet.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($payments as $payment): ?>
                            <tr data-payment-id="<?= $payment['id'] ?>">
                                <td><?= date('d/m/Y', strtotime($payment['payment_date'])) ?></td>
                                <td>₹<?= number_format($payment['amount'], 0) ?></td>
                                <td><?= $payment['method'] ?: 'N/A' ?></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-danger delete-payment"
                                            data-id="<?= $payment['id'] ?>" data-amount="<?= $payment['amount'] ?>">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add Payment Modal -->
<div class="modal fade" id="addPaymentModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Payment</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="addPaymentForm">
                <?= csrf_field() ?>
                <div class="modal-body">
                    <input type="hidden" name="payroll_id" value="<?= $payroll['id'] ?>">
                    <div class="mb-3">
                        <label for="amount" class="form-label">Amount (₹) *</label>
                        <input type="number" step="0.01" class="form-control" id="amount" name="amount"
                               max="<?= $payroll['total_salary'] - array_sum(array_column($payments, 'amount')) ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="payment_date" class="form-label">Payment Date *</label>
                        <input type="date" class="form-control" id="payment_date" name="payment_date"
                               value="<?= date('Y-m-d') ?>" required>
                    </div>
                    <div class="mb-3">
                        <label for="method" class="form-label">Payment Method</label>
                        <select class="form-select" id="method" name="method">
                            <option value="">Select Method</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-theme-green">Add Payment</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Payment Modal -->
<div class="modal fade" id="deletePaymentModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                Are you sure you want to delete this payment of ₹<span id="deleteAmount"></span>?
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeletePayment">Delete</button>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    let deletePaymentId = null;

    $('#addPaymentForm').on('submit', function(e) {
        e.preventDefault();

        const amount = parseFloat($('#amount').val());
        const paymentDate = $('#payment_date').val();

        if (!amount || amount <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Amount must be greater than 0.'
            });
            return;
        }

        if (!paymentDate) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Payment date is required.'
            });
            return;
        }

        $.ajax({
            url: '<?= base_url('payroll/add-payment') ?>',
            type: 'POST',
            data: $(this).serialize(),
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#addPaymentModal').modal('hide');
                    $('#addPaymentForm')[0].reset();
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(function() {
                        var p = response.payment;
                        if (p) {
                            $('#payments-total-paid').text('₹' + Math.round(response.total_paid || 0).toLocaleString('en-IN'));
                            $('#payments-remaining').text('₹' + Math.round(response.remaining || 0).toLocaleString('en-IN'));
                            var dateStr = p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : '—';
                            var row = '<tr data-payment-id="' + p.id + '"><td>' + dateStr + '</td><td>₹' + Math.round(p.amount || 0).toLocaleString('en-IN') + '</td><td>' + (p.method || 'N/A') + '</td><td><button class="btn btn-sm btn-outline-danger delete-payment" data-id="' + p.id + '" data-amount="' + p.amount + '"><i class="fas fa-trash"></i> Delete</button></td></tr>';
                            if ($('#payments-empty-row').length) {
                                $('#payments-empty-row').replaceWith(row);
                            } else {
                                $('tbody tr:first').before(row);
                            }
                        }
                    });
                } else {
                    if (response.errors) {
                        console.log(response.errors);
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to add payment.'
                    });
                }
            },
            error: function(xhr) {
                console.log(xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while adding the payment.'
                });
            }
        });
    });

    $(document).on('click', '.delete-payment', function() {
        deletePaymentId = $(this).data('id');
        $('#deleteAmount').text($(this).data('amount'));
        $('#deletePaymentModal').modal('show');
    });

    $('#confirmDeletePayment').on('click', function() {
        if (!deletePaymentId) {
            return;
        }

        $.ajax({
            url: '<?= base_url('payroll/delete-payment/') ?>' + deletePaymentId,
            type: 'POST',
            data: {
                csrf_test_name: $('meta[name="csrf-token"]').attr('content')
            },
            dataType: 'json',
            success: function(response) {
                $('#deletePaymentModal').modal('hide');

                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(function() {
                        $('#payments-total-paid').text('₹' + Math.round(response.total_paid || 0).toLocaleString('en-IN'));
                        $('#payments-remaining').text('₹' + Math.round(response.remaining || 0).toLocaleString('en-IN'));
                        $('[data-payment-id="' + deletePaymentId + '"]').fadeOut(300, function() {
                            $(this).remove();
                            if ($('tbody tr[data-payment-id]').length === 0) {
                                $('tbody').append('<tr id="payments-empty-row"><td colspan="4" class="text-center text-muted">No payments recorded yet.</td></tr>');
                            }
                        });
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to delete payment.'
                    });
                }
            },
            error: function() {
                $('#deletePaymentModal').modal('hide');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while deleting the payment.'
                });
            }
        });
    });
</script>
<?= $this->endSection() ?>