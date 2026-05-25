<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-12 col-lg-8">
        <div class="card shadow-sm">
            <div class="card-header bg-theme-blue text-white py-3">
                <h5 class="mb-0">
                    <i class="fas fa-coins me-2"></i><?= $item ? 'Edit' : 'Add' ?> Advance / Overtime / Fine
                </h5>
            </div>
            <div class="card-body p-4">
                <?php if (session()->getFlashdata('error')): ?>
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i><?= esc(session()->getFlashdata('error')) ?>
                    </div>
                <?php endif; ?>

                <div class="alert alert-warning d-none mb-3" id="payrollLockAlert">
                    <i class="fas fa-lock me-2"></i>
                    <strong>Payroll generated.</strong> This employee's payroll for this month has already been generated. Employees removed from payroll can still add/edit entries.
                </div>

                <form action="" method="post" id="aofForm">
                    <?= csrf_field() ?>
                    <div class="row g-3">
                        <div class="col-12">
                            <label for="employee_id" class="form-label">Employee <span class="text-danger">*</span></label>
                            <select name="employee_id" id="employee_id" class="form-select form-select-lg <?= isset($validation) && $validation->hasError('employee_id') ? 'is-invalid' : '' ?>" required>
                                <option value="">Select employee</option>
                                <?php foreach ($employees as $emp): ?>
                                    <option value="<?= $emp['id'] ?>" <?= old('employee_id', $item['employee_id'] ?? '') == $emp['id'] ? 'selected' : '' ?>>
                                        <?= esc($emp['name']) ?> (<?= esc($emp['mobile']) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <?php if (isset($validation) && $validation->hasError('employee_id')): ?>
                                <div class="invalid-feedback d-block"><?= $validation->getError('employee_id') ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="col-12">
                            <label for="date" class="form-label">Date <span class="text-danger">*</span></label>
                            <input type="date" name="date" id="date" class="form-control form-control-lg <?= isset($validation) && $validation->hasError('date') ? 'is-invalid' : '' ?>"
                                   value="<?= old('date', $item['date'] ?? $today) ?>" max="<?= $today ?>" required>
                            <small class="text-muted">Only today or past dates. If this employee's payroll for this month is generated, save will be blocked.</small>
                            <?php if (isset($validation) && $validation->hasError('date')): ?>
                                <div class="invalid-feedback d-block"><?= $validation->getError('date') ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="col-md-6">
                            <label for="type" class="form-label">Type <span class="text-danger">*</span></label>
                            <select name="type" id="type" class="form-select form-select-lg <?= isset($validation) && $validation->hasError('type') ? 'is-invalid' : '' ?>" required>
                                <option value="">Select type</option>
                                <option value="advance" <?= old('type', $item['type'] ?? '') === 'advance' ? 'selected' : '' ?>>Advance</option>
                                <option value="overtime" <?= old('type', $item['type'] ?? '') === 'overtime' ? 'selected' : '' ?>>Overtime</option>
                                <option value="fine" <?= old('type', $item['type'] ?? '') === 'fine' ? 'selected' : '' ?>>Fine</option>
                            </select>
                            <small class="text-muted">One type per entry. Add separate entries for Advance, Overtime, or Fine.</small>
                            <?php if (isset($validation) && $validation->hasError('type')): ?>
                                <div class="invalid-feedback d-block"><?= $validation->getError('type') ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="col-md-6">
                            <label for="amount" class="form-label">Amount (₹) <span class="text-danger">*</span></label>
                            <input type="number" step="0.01" min="0.01" name="amount" id="amount" class="form-control form-control-lg <?= isset($validation) && $validation->hasError('amount') ? 'is-invalid' : '' ?>"
                                   value="<?= old('amount', $item['amount'] ?? '') ?>" required placeholder="0.00">
                            <?php if (isset($validation) && $validation->hasError('amount')): ?>
                                <div class="invalid-feedback d-block"><?= $validation->getError('amount') ?></div>
                            <?php endif; ?>
                        </div>
                        <input type="hidden" name="repay_months" value="1">
                        <div class="col-12">
                            <label for="notes" class="form-label">Notes</label>
                            <textarea name="notes" id="notes" class="form-control" rows="2" placeholder="Optional"><?= old('notes', $item['notes'] ?? '') ?></textarea>
                        </div>
                        <div class="col-12 pt-2 d-flex flex-wrap gap-2">
                            <button type="submit" class="btn btn-theme-yellow" id="btnSubmit">
                                <i class="fas fa-save me-1"></i> <?= $item ? 'Update' : 'Save' ?>
                            </button>
                            <?php if (!empty($item['employee_id'])): ?>
                                <a href="<?= base_url('employee/profile/' . $item['employee_id']) ?>" class="btn btn-outline-secondary">
                                    <i class="fas fa-user me-1"></i> Back to profile
                                </a>
                            <?php endif; ?>
                            <a href="<?= base_url('advance-overtime-fine') ?>" class="btn btn-outline-secondary">
                                <i class="fas fa-arrow-left me-1"></i> Back to list
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    (function() {
        const today = '<?= $today ?>';
        const checkUrl = '<?= base_url('advance-overtime-fine/check-payroll-lock') ?>';
        const $date = $('#date');
        const $alert = $('#payrollLockAlert');
        const $btn = $('#btnSubmit');

        function checkLock() {
            const val = $date.val();
            const empId = $('#employee_id').val();
            if (!val || !empId) {
                $alert.addClass('d-none');
                $btn.prop('disabled', false);
                return;
            }
            const d = new Date(val + 'T12:00:00');
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            $.get(checkUrl, { month: month, year: year, employee_id: empId }, function(res) {
                if (res.locked) {
                    $alert.removeClass('d-none');
                    $btn.prop('disabled', true);
                } else {
                    $alert.addClass('d-none');
                    $btn.prop('disabled', false);
                }
            });
        }
        $date.on('change', checkLock);
        $('#employee_id').on('change', checkLock);
        checkLock();
    })();
</script>
<?= $this->endSection() ?>
