<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-12 col-lg-8">
        <div class="card">
            <div class="card-header">
                <h4>Edit Payroll - <?= $employee['name'] ?> (<?= date('F Y', mktime(0, 0, 0, $payroll['month'], 1, $payroll['year'])) ?>)</h4>
            </div>
            <div class="card-body">
                <form action="" method="post">
                    <?= csrf_field() ?>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Base Salary</label>
                            <input type="text" class="form-control" value="₹<?= number_format($payroll['base_salary'], 0) ?>" readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Total Salary (Current)</label>
                            <input type="text" class="form-control" value="₹<?= number_format($payroll['total_salary'], 0) ?>" readonly>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label for="overtime" class="form-label">Overtime Amount (₹)</label>
                            <input type="number" step="0.01" class="form-control <?= isset($validation) && $validation->hasError('overtime') ? 'is-invalid' : '' ?>"
                                   id="overtime" name="overtime" value="<?= old('overtime', $payroll['overtime']) ?>">
                            <?php if (isset($validation) && $validation->hasError('overtime')): ?>
                                <div class="invalid-feedback">
                                    <?= $validation->getError('overtime') ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="col-md-4">
                            <label for="fine" class="form-label">Fine/Deduction (₹)</label>
                            <input type="number" step="0.01" class="form-control <?= isset($validation) && $validation->hasError('fine') ? 'is-invalid' : '' ?>"
                                   id="fine" name="fine" value="<?= old('fine', $payroll['fine']) ?>">
                            <?php if (isset($validation) && $validation->hasError('fine')): ?>
                                <div class="invalid-feedback">
                                    <?= $validation->getError('fine') ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="col-md-4">
                            <label for="advance_deduction" class="form-label">Advance Deduction (₹)</label>
                            <input type="number" step="0.01" class="form-control <?= isset($validation) && $validation->hasError('advance_deduction') ? 'is-invalid' : '' ?>"
                                   id="advance_deduction" name="advance_deduction" value="<?= old('advance_deduction', $payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0) ?>">
                            <?php if (isset($validation) && $validation->hasError('advance_deduction')): ?>
                                <div class="invalid-feedback">
                                    <?= $validation->getError('advance_deduction') ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <?php
                    $daysDivisor = (int)($payroll['days_divisor'] ?? 30);
                    $perDay = $payroll['base_salary'] / $daysDivisor;
                    $payrollMode = (new \App\Models\SettingsModel())->getSetting('payroll_mode', 'monthly');
                    if ($payrollMode === 'monthly') {
                        $attSalary = $payroll['base_salary'] - ($payroll['absent_days'] * $perDay) - ($payroll['half_days'] * $perDay * 0.5) - (($payroll['weekend_absent_days'] ?? 0) * $perDay);
                        $whAmount = 0;
                    } else {
                        $attSalary = $payroll['base_salary'] * ($payroll['present_days'] + $payroll['half_days'] * 0.5) / $daysDivisor;
                        $whAmount = (float) ($payroll['weekend_holiday_amount'] ?? 0);
                    }
                    $whDays = (int) ($payroll['weekend_holiday_days'] ?? 0);
                    ?>
                    <div class="alert alert-info py-2 mb-3">
                        <i class="fas fa-umbrella-beach me-2"></i><strong>Tuesday = Weekend</strong> (weekly off). Weekend holidays are paid.
                    </div>
                    <div class="alert alert-light border py-2 mb-3 small">
                        <strong>Salary Formula:</strong> 1 day = Base &divide; <?= $daysDivisor ?> &nbsp;|&nbsp; Hold amount = Hold days &times; 1 day &nbsp;|&nbsp; Payable = Payable &minus; Hold amount
                    </div>
                    <div class="mb-3">
                        <h5>Salary Calculation Preview</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Attendance-based Salary:</strong>
                                ₹<?= number_format($attSalary, 0) ?><br>
                                <?php if ($whAmount > 0): ?>
                                <strong>Weekend Holiday (<?= $whDays ?> × ₹<?= number_format($perDay, 0) ?>):</strong>
                                ₹<?= number_format($whAmount, 0) ?><br>
                                <?php endif; ?>
                                <?php $holdReleased = (float) ($payroll['hold_salary_released'] ?? 0); if ($holdReleased > 0): ?>
                                <strong>Hold Salary Released:</strong> ₹<?= number_format($holdReleased, 0) ?><br>
                                <?php endif; ?>
                                <strong>Overtime:</strong> ₹<span id="overtime-preview"><?= number_format($payroll['overtime'], 0) ?></span><br>
                                <strong>Subtotal:</strong> ₹<span id="subtotal-preview">
                                    <?= number_format($attSalary + $whAmount + ($payroll['overtime'] ?? 0), 0) ?>
                                </span>
                            </div>
                            <div class="col-md-6">
                                <strong>Fine:</strong> ₹<span id="fine-preview"><?= number_format($payroll['fine'], 0) ?></span><br>
                                <?php $holdDed = (float) ($payroll['hold_deduction'] ?? 0); if ($holdDed > 0): ?>
                                <strong>Hold Deduction (this month):</strong> ₹<?= number_format($holdDed, 0) ?><br>
                                <?php endif; ?>
                                <strong>Advance Deduction:</strong> ₹<span id="advance-preview"><?= number_format($payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0, 0) ?></span><br>
                                <strong>Final Total:</strong> ₹<span id="total-preview" class="text-primary fw-bold">
                                    <?= number_format($payroll['total_salary'], 0) ?>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Update Payroll
                        </button>
                        <a href="<?= base_url('payroll') ?>" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to List
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    function updatePreview() {
        const overtime = parseFloat($('#overtime').val()) || 0;
        const fine = parseFloat($('#fine').val()) || 0;
        const advance = parseFloat($('#advance_deduction').val()) || 0;

        const baseSalary = <?= $payroll['base_salary'] ?>;
        const daysDivisor = <?= $daysDivisor ?>;
        const payrollMode = '<?= $payrollMode ?>';
        const perDay = baseSalary / daysDivisor;
        let attendanceSalary;
        if (payrollMode === 'monthly') {
            attendanceSalary = baseSalary - (<?= $payroll['absent_days'] ?> * perDay) - (<?= $payroll['half_days'] ?> * perDay * 0.5) - (<?= $payroll['weekend_absent_days'] ?? 0 ?> * perDay);
        } else {
            attendanceSalary = baseSalary * (<?= $payroll['present_days'] ?> + <?= $payroll['half_days'] ?> * 0.5) / daysDivisor;
        }
        const weekendHolidayAmount = <?= $whAmount ?? 0 ?>;
        const holdSalaryReleased = <?= (float) ($payroll['hold_salary_released'] ?? 0) ?>;

        const subtotal = attendanceSalary + weekendHolidayAmount + holdSalaryReleased + overtime;
        const total = subtotal - fine - advance;

        $('#overtime-preview').text(Math.round(overtime).toLocaleString('en-IN'));
        $('#fine-preview').text(Math.round(fine).toLocaleString('en-IN'));
        $('#advance-preview').text(Math.round(advance).toLocaleString('en-IN'));
        $('#subtotal-preview').text(Math.round(subtotal).toLocaleString('en-IN'));
        $('#total-preview').text(Math.round(Math.max(0, total)).toLocaleString('en-IN'));
    }

    $('#overtime, #fine, #advance_deduction').on('input', updatePreview);
</script>
<?= $this->endSection() ?>