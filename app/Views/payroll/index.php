<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="d-flex flex-column flex-sm-row flex-wrap justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
    <form method="get" class="d-flex flex-wrap gap-2 align-items-center">
        <select name="month" class="form-select form-select-sm" style="min-width: 120px;">
            <?php for ($m = 1; $m <= 12; $m++): ?>
                <option value="<?= $m ?>" <?= $m == $month ? 'selected' : '' ?>>
                    <?= date('F', mktime(0, 0, 0, $m, 1)) ?>
                </option>
            <?php endfor; ?>
        </select>
        <select name="year" class="form-select form-select-sm" style="min-width: 80px;">
            <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>><?= $y ?></option>
            <?php endfor; ?>
        </select>
        <button type="submit" class="btn btn-theme-blue btn-sm">
            <i class="fas fa-search"></i> Filter
        </button>
    </form>
    <div class="d-flex flex-wrap gap-2 align-items-center">
        <?php if (!empty($hasPayroll)): ?>
            <a href="<?= base_url('payroll?month=' . $month . '&year=' . $year . '&export=pdf') ?>" class="btn btn-success btn-sm">
                <i class="fas fa-download"></i> Download PDF
            </a>
            <button type="button" class="btn btn-success btn-sm" onclick="smartShare('<?= base_url('payroll?month=' . $month . '&year=' . $year . '&export=pdf') ?>', 'Payroll_List_<?= $month ?>_<?= $year ?>.pdf', 'Payroll List for <?= date('F Y', mktime(0, 0, 0, $month, 1, $year)) ?>')">
                <i class="fab fa-whatsapp"></i> Share on WhatsApp
            </button>

        <?php endif; ?>
        <button type="button" class="btn btn-danger btn-sm" data-bs-toggle="modal" data-bs-target="#deleteMonthModal">
            <i class="fas fa-trash-alt"></i> Delete Month Payroll
        </button>
        <button type="button" class="btn btn-theme-yellow btn-generate-payroll" data-bs-toggle="modal" data-bs-target="#generatePayrollModal">
            <i class="fas fa-file-invoice-dollar"></i>
            <span>Generate Payroll</span>
        </button>
    </div>
</div>

<p class="text-muted small mb-2">
    <i class="fas fa-info-circle me-1"></i>
    Add <strong>Advance Deduction</strong> via <strong>Apply Advance</strong> (enter amount) or <strong>Edit</strong>.
</p>
<p class="text-muted small mb-2">
    <i class="fas fa-umbrella-beach me-1"></i>
    <strong>Tuesday = Weekend</strong> (weekly off). Weekend holidays are included in payroll.
</p>
<p class="text-muted small mb-2">
    <i class="fas fa-lock me-1"></i>
    <strong>Hold amount</strong> is deducted from payable. Formula: 1 day = Base &divide; <?= (new \App\Models\SettingsModel())->getDaysDivisor((int)date('n'), (int)date('Y')) ?>, Hold = Hold days &times; 1 day, Payable = Payable &minus; Hold.
</p>
<div class="card">
    <div class="card-body p-0">
        <!-- Desktop Table -->
        <div class="table-responsive d-none d-lg-block">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Employee</th>
                        <th>Base Salary</th>
                        <th>Actual Salary</th>
                        <th>Advance Deduction</th>
                        <th>Total Salary (Payable)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $pendingAdvances = $pendingAdvances ?? [];
                    foreach ($payrolls as $payroll):
                        $empId = (int) ($payroll['employee_id'] ?? 0);
                        $adv = $pendingAdvances[$empId] ?? null;
                        $eligible = $adv ? (float) $adv['remaining'] : 0;
                    ?>
                        <tr data-payroll-id="<?= $payroll['id'] ?>" data-eligible="<?= number_format($eligible, 2, '.', '') ?>">
                            <td>
                                <strong><?= $payroll['name'] ?></strong><br>
                                <small class="text-muted"><?= $payroll['mobile'] ?></small>
                            </td>
                            <td>₹<?= number_format($payroll['base_salary'], 0) ?></td>
                            <td class="payroll-actual-td"><span class="payroll-actual-amt">₹<?= number_format(($payroll['total_salary'] ?? 0) + ($payroll['hold_deduction'] ?? 0) + ($payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0) + ($payroll['fine'] ?? 0), 0) ?></span></td>
                            <td class="payroll-advance-td"><span class="payroll-advance-amt">₹<?= number_format($payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0, 0) ?></span></td>
                            <td class="payroll-total-td"><strong>₹<?= number_format($payroll['total_salary'], 0) ?></strong></td>
                            <td class="payroll-status-td">
                                <span class="badge <?= $payroll['paid'] ? 'bg-success' : 'bg-warning text-dark' ?> payroll-status-badge">
                                    <?= $payroll['paid'] ? 'Paid' : 'Pending' ?>
                                </span>
                            </td>
                            <td>
                                <a href="<?= base_url('payroll/salary-slip/' . $payroll['id']) ?>" class="btn btn-sm btn-success" target="_blank" title="Download Salary Slip PDF">
                                    <i class="fas fa-file-pdf"></i> Slip
                                </a>
                                <button type="button" class="btn btn-sm btn-success" onclick="smartShare('<?= base_url('payroll/salary-slip/' . $payroll['id']) ?>', 'Salary_Slip_<?= preg_replace('/[^a-zA-Z0-9]/', '_', $payroll['name']) ?>.pdf', 'Salary slip for <?= date('F Y', mktime(0, 0, 0, $month, 1, $year)) ?>')">
                                    <i class="fab fa-whatsapp"></i>
                                </button>

                                <?php if (!$payroll['paid'] && $eligible > 0): ?>
                                <button type="button" class="btn btn-sm btn-danger btn-apply-advance payroll-apply-btn" title="Add advance deduction (enter amount)"
                                        data-id="<?= $payroll['id'] ?>" data-eligible="<?= number_format($eligible, 2, '.', '') ?>">
                                    <i class="fas fa-hand-holding-usd"></i> Apply Advance
                                </button>
                                <?php endif; ?>
                                <a href="<?= base_url('payroll/edit/' . $payroll['id']) ?>" class="btn btn-sm btn-theme-blue">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <button class="btn btn-sm <?= $payroll['paid'] ? 'btn-outline-secondary' : 'btn-theme-yellow' ?> toggle-paid payroll-toggle-btn"
                                        data-id="<?= $payroll['id'] ?>" data-paid="<?= $payroll['paid'] ?>">
                                    <i class="fas fa-<?= $payroll['paid'] ? 'undo' : 'check' ?>"></i>
                                    <span class="toggle-paid-text"><?= $payroll['paid'] ? 'Revert Payment' : 'Mark Paid' ?></span>
                                </button>
                                <form method="post" action="<?= base_url('payroll/delete/' . $payroll['id']) ?>" class="d-inline" data-name="<?= esc($payroll['name']) ?>">
                                    <?= csrf_field() ?>
                                    <button type="submit" class="btn btn-sm btn-outline-danger btn-delete-payroll" title="Delete this employee's payroll">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View -->
        <div class="d-lg-none p-3">
            <?php
            $pendingAdvances = $pendingAdvances ?? [];
            foreach ($payrolls as $payroll):
                $empId = (int) ($payroll['employee_id'] ?? 0);
                $adv = $pendingAdvances[$empId] ?? null;
                $eligible = $adv ? (float) $adv['remaining'] : 0;
            ?>
                <div class="card mb-3 shadow-sm" data-payroll-id="<?= $payroll['id'] ?>" data-eligible="<?= number_format($eligible, 2, '.', '') ?>">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="mb-1"><?= esc($payroll['name']) ?></h5>
                                <small class="text-muted"><?= esc($payroll['mobile']) ?></small>
                            </div>
                            <span class="badge <?= $payroll['paid'] ? 'bg-success' : 'bg-warning text-dark' ?> payroll-status-badge">
                                <?= $payroll['paid'] ? 'Paid' : 'Pending' ?>
                            </span>
                        </div>
                        <div class="row g-2 mb-2 small">
                            <div class="col-6">Base: ₹<?= number_format($payroll['base_salary'], 0) ?></div>
                            <div class="col-6 payroll-actual-td">Actual: <span class="payroll-actual-amt">₹<?= number_format(($payroll['total_salary'] ?? 0) + ($payroll['hold_deduction'] ?? 0) + ($payroll['advance_deduction'] ?? 0) + ($payroll['fine'] ?? 0), 0) ?></span></div>
                            <div class="col-6 payroll-advance-td">Advance: <span class="payroll-advance-amt">₹<?= number_format($payroll['advance_deduction'] ?? 0, 0) ?></span></div>
                            <div class="col-6 payroll-total-td">Payable: <strong>₹<?= number_format($payroll['total_salary'], 0) ?></strong></div>
                        </div>
                        <div class="d-flex flex-wrap gap-1">
                            <a href="<?= base_url('payroll/salary-slip/' . $payroll['id']) ?>" class="btn btn-sm btn-success" target="_blank" title="Download Salary Slip">
                                <i class="fas fa-file-pdf"></i>
                            </a>
                            <button type="button" class="btn btn-sm btn-success" onclick="smartShare('<?= base_url('payroll/salary-slip/' . $payroll['id']) ?>', 'Salary_Slip_<?= preg_replace('/[^a-zA-Z0-9]/', '_', $payroll['name']) ?>.pdf', 'Salary slip for <?= date('F Y', mktime(0, 0, 0, $month, 1, $year)) ?>')">
                                <i class="fab fa-whatsapp"></i>
                            </button>

                            <?php if (!$payroll['paid'] && $eligible > 0): ?>
                            <button type="button" class="btn btn-sm btn-danger btn-apply-advance payroll-apply-btn" title="Add advance deduction"
                                    data-id="<?= $payroll['id'] ?>" data-eligible="<?= number_format($eligible, 2, '.', '') ?>">
                                <i class="fas fa-hand-holding-usd"></i>
                            </button>
                            <?php endif; ?>
                            <a href="<?= base_url('payroll/edit/' . $payroll['id']) ?>" class="btn btn-sm btn-theme-blue">
                                <i class="fas fa-edit"></i>
                            </a>
                            <button class="btn btn-sm <?= $payroll['paid'] ? 'btn-outline-secondary' : 'btn-theme-yellow' ?> toggle-paid payroll-toggle-btn"
                                    data-id="<?= $payroll['id'] ?>" data-paid="<?= $payroll['paid'] ?>">
                                <i class="fas fa-<?= $payroll['paid'] ? 'undo' : 'check' ?>"></i>
                                <span class="toggle-paid-text d-none d-lg-inline"><?= $payroll['paid'] ? 'Revert Payment' : 'Mark Paid' ?></span>
                            </button>
                            <form method="post" action="<?= base_url('payroll/delete/' . $payroll['id']) ?>" class="d-inline" data-name="<?= esc($payroll['name']) ?>">
                                <?= csrf_field() ?>
                                <button type="submit" class="btn btn-sm btn-outline-danger btn-delete-payroll" title="Delete payroll">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<!-- Generate Payroll Modal -->
<div class="modal fade" id="generatePayrollModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Generate Monthly Payroll</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form action="<?= base_url('payroll/generate') ?>" method="post">
                <?= csrf_field() ?>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Generate For</label>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="generate_type" id="gen_all" value="all" checked>
                            <label class="form-check-label" for="gen_all">All Active Employees</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="generate_type" id="gen_specific" value="specific">
                            <label class="form-check-label" for="gen_specific">Specific Employee</label>
                        </div>
                    </div>
                    <div class="mb-3 d-none" id="gen_employee_wrap">
                        <label for="gen_employee_id" class="form-label">Select Employee</label>
                        <select name="employee_id" id="gen_employee_id" class="form-select">
                            <option value="">-- Select Employee --</option>
                            <?php foreach (($activeEmployees ?? []) as $emp): ?>
                                <option value="<?= $emp['id'] ?>"><?= esc($emp['name']) ?> (<?= esc($emp['mobile'] ?? '') ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <?php
                    $genPrevMonth = (int) date('n') - 1;
                    $genPrevYear = (int) date('Y');
                    if ($genPrevMonth < 1) { $genPrevMonth = 12; $genPrevYear--; }
                    ?>
                    <div class="mb-3">
                        <label for="gen_month" class="form-label">Month</label>
                        <select name="month" id="gen_month" class="form-select" required>
                            <?php for ($m = 1; $m <= 12; $m++): ?>
                                <option value="<?= $m ?>" <?= $m == $genPrevMonth ? 'selected' : '' ?>>
                                    <?= date('F', mktime(0, 0, 0, $m, 1)) ?>
                                </option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="gen_year" class="form-label">Year</label>
                        <select name="year" id="gen_year" class="form-select" required>
                            <?php for ($y = date('Y') - 1; $y <= date('Y') + 1; $y++): ?>
                                <option value="<?= $y ?>" <?= $y == $genPrevYear ? 'selected' : '' ?>>
                                    <?= $y ?>
                                </option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    <p class="text-muted small mb-0" id="gen_hint">Generate payroll for all active employees for the selected month.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-theme-yellow" id="gen_submit_btn">
                        <i class="fas fa-file-invoice-dollar me-2"></i>Generate Payroll
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Month Payroll Modal -->
<div class="modal fade" id="deleteMonthModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title"><i class="fas fa-exclamation-triangle me-2"></i>Delete Month Payroll</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <form action="<?= base_url('payroll/delete-month') ?>" method="post">
                <?= csrf_field() ?>
                <div class="modal-body">
                    <p class="mb-3">Select the month and year to delete payroll records.</p>
                        <div class="mb-3">
                            <label for="del_month" class="form-label">Month <span class="text-danger">*</span></label>
                            <select name="month" id="del_month" class="form-select" required>
                                <?php for ($m = 1; $m <= 12; $m++): ?>
                                    <option value="<?= $m ?>" <?= $m == $month ? 'selected' : '' ?>>
                                        <?= date('F', mktime(0, 0, 0, $m, 1)) ?>
                                    </option>
                                <?php endfor; ?>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="del_year" class="form-label">Year <span class="text-danger">*</span></label>
                            <select name="year" id="del_year" class="form-select" required>
                                <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                                    <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>><?= $y ?></option>
                                <?php endfor; ?>
                            </select>
                        </div>
                    <p class="text-danger small mb-0"><i class="fas fa-info-circle"></i> This will delete all payroll and related payment records for the selected month. This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-danger">
                        <i class="fas fa-trash-alt me-2"></i>Delete Payroll
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    $('#gen_all, #gen_specific').on('change', function() {
        const isSpecific = $('#gen_specific').is(':checked');
        $('#gen_employee_wrap').toggleClass('d-none', !isSpecific);
        $('#gen_employee_id').prop('required', isSpecific);
        $('#gen_hint').text(isSpecific ? 'Generate payroll for the selected employee only.' : 'Generate payroll for all active employees for the selected month.');
    });

    $('form[action*="payroll/generate"]').on('submit', function(e) {
        if ($('#gen_specific').is(':checked') && !$('#gen_employee_id').val()) {
            e.preventDefault();
            Swal.fire({ icon: 'warning', title: 'Select Employee', text: 'Please select an employee for payroll generation.' });
            return false;
        }
    });

    $(document).on('submit', 'form[action*="payroll/delete/"]', function(e) {
        e.preventDefault();
        const form = this;
        const name = $(form).data('name') || 'this employee';
        Swal.fire({
            title: 'Delete payroll?',
            text: 'Delete payroll for ' + name + '? Related payments will also be removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete'
        }).then(function(r) {
            if (r.isConfirmed) form.submit();
        });
        return false;
    });

    $('.toggle-paid').on('click', function() {
        const id = $(this).data('id');
        const currentPaid = $(this).data('paid');

        $.ajax({
            url: '<?= base_url('payroll/toggle-paid/') ?>' + id,
            type: 'POST',
            data: {
                csrf_test_name: $('meta[name="csrf-token"]').attr('content')
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(function() {
                        const newPaid = response.new_paid ? 1 : 0;
                        const $row = $('[data-payroll-id="' + id + '"]');
                        $row.find('.payroll-status-badge').removeClass('bg-success bg-warning text-dark').addClass(newPaid ? 'bg-success' : 'bg-warning text-dark').text(newPaid ? 'Paid' : 'Pending');
                        $row.find('.payroll-toggle-btn').data('paid', newPaid).removeClass('btn-outline-secondary btn-theme-yellow').addClass(newPaid ? 'btn-outline-secondary' : 'btn-theme-yellow').find('i').removeClass('fa-check fa-undo').addClass(newPaid ? 'fa-undo' : 'fa-check');
                        $row.find('.toggle-paid-text').text(newPaid ? 'Revert Payment' : 'Mark Paid');
                        if (!newPaid) {
                            const eligible = parseFloat($row.data('eligible')) || 0;
                            if (eligible > 0 && $row.find('.btn-apply-advance').length === 0) {
                                const applyBtn = '<button type="button" class="btn btn-sm btn-danger btn-apply-advance payroll-apply-btn" title="Add advance deduction" data-id="' + id + '" data-eligible="' + eligible + '"><i class="fas fa-hand-holding-usd"></i> <span class="d-none d-lg-inline">Apply Advance</span></button>';
                                $row.find('.payroll-toggle-btn').before(applyBtn);
                            }
                        } else {
                            $row.find('.btn-apply-advance').remove();
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to update payroll status.'
                    });
                }
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while updating payroll status.'
                });
            }
        });
    });

    $(document).on('click', '.btn-apply-advance', function() {
        const id = $(this).data('id');
        const eligible = parseFloat($(this).data('eligible')) || 0;
        const eligibleStr = Math.round(eligible).toLocaleString('en-IN');
        Swal.fire({
            title: 'Advance Deduction',
            html: '<p class="text-success mb-2"><strong>Advance amount deduct eligible: Rs. ' + eligibleStr + '</strong></p><p class="small text-muted mb-2">Amount cannot exceed Rs. ' + eligibleStr + '.</p><label class="form-label text-start w-100">Amount (Rs.) <span class="text-danger">*</span></label><input type="number" step="0.01" min="0" max="' + eligible + '" id="swal-advance-amount" class="swal2-input" placeholder="0.00">',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Apply',
            preConfirm: function() {
                const val = document.getElementById('swal-advance-amount').value;
                const num = parseFloat(val);
                if (val === '' || isNaN(num) || num < 0) {
                    Swal.showValidationMessage('Please enter a valid amount (0 or more).');
                    return false;
                }
                if (num > eligible) {
                    Swal.showValidationMessage('Amount cannot exceed eligible Rs. ' + Math.round(eligible).toLocaleString('en-IN') + '.');
                    return false;
                }
                return val;
            }
        }).then(function(r) {
            if (!r.isConfirmed || r.value === undefined) return;
            $.ajax({
                url: '<?= base_url('payroll/apply-advance/') ?>' + id,
                type: 'POST',
                data: {
                    csrf_test_name: $('meta[name="csrf-token"]').attr('content'),
                    amount: r.value
                },
                dataType: 'json',
                success: function(res) {
                    if (res.success) {
                        Swal.fire({ icon: 'success', title: 'Applied', text: res.message, timer: 1500, showConfirmButton: false }).then(function() {
                            if (res.payroll) {
                                const p = res.payroll;
                                const $row = $('[data-payroll-id="' + id + '"]');
                                const actual = (p.total_salary || 0) + (p.hold_deduction || 0) + (p.advance_deduction || 0);
                                const fmt = function(n) { return '₹' + Math.round(n || 0).toLocaleString('en-IN'); };
                                $row.find('.payroll-actual-amt').text(fmt(actual));
                                $row.find('.payroll-advance-amt').text(fmt(p.advance_deduction));
                                $row.find('.payroll-total-td strong').text(fmt(p.total_salary));
                                $row.find('.payroll-apply-btn').data('eligible', p.eligible);
                                $row.data('eligible', p.eligible);
                                if (p.eligible <= 0) $row.find('.btn-apply-advance').remove();
                            }
                        });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not apply advance.' });
                    }
                },
                error: function() {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Could not apply advance.' });
                }
            });
        });
    });

</script>
<?= $this->endSection() ?>