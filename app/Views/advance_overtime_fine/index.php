<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="mb-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 bg-light rounded-3">
        <form method="get" class="d-flex flex-nowrap align-items-center gap-2">
            <label class="form-label mb-0 text-muted small text-nowrap">Month</label>
            <select name="month" class="form-select form-select-sm" style="min-width: 120px;">
                <?php for ($m = 1; $m <= 12; $m++): ?>
                    <option value="<?= $m ?>" <?= $m == $month ? 'selected' : '' ?>><?= date('F', mktime(0, 0, 0, $m, 1)) ?></option>
                <?php endfor; ?>
            </select>
            <label class="form-label mb-0 text-muted small text-nowrap">Year</label>
            <select name="year" class="form-select form-select-sm" style="min-width: 80px;">
                <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                    <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>><?= $y ?></option>
                <?php endfor; ?>
            </select>
            <button type="submit" class="btn btn-theme-blue btn-sm">
                <i class="fas fa-filter me-1"></i> Filter
            </button>
        </form>
        <div class="d-flex flex-nowrap gap-2">
            <a href="<?= base_url('advance-overtime-fine/repayment-status') ?>" class="btn btn-outline-primary btn-sm text-nowrap">
                <i class="fas fa-list-check me-1"></i> Repayment Status
            </a>
            <a href="<?= base_url('advance-overtime-fine/create') ?>" class="btn btn-theme-green btn-sm text-nowrap">
                <i class="fas fa-plus me-1"></i> Add Entry
            </a>
        </div>
    </div>
</div>

<?php if (session()->getFlashdata('error')): ?>
    <div class="alert alert-danger alert-dismissible fade show">
        <i class="fas fa-exclamation-circle me-2"></i><?= esc(session()->getFlashdata('error')) ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>
<?php if (session()->getFlashdata('success')): ?>
    <div class="alert alert-success alert-dismissible fade show">
        <i class="fas fa-check-circle me-2"></i><?= esc(session()->getFlashdata('success')) ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>

<div class="card shadow-sm border-0">
    <div class="card-header bg-theme-blue text-white py-3 px-4">
        <h5 class="mb-0 fw-semibold">
            <i class="fas fa-list me-2"></i>Entries for <?= date('F', mktime(0, 0, 0, $month, 1)) ?> <?= $year ?>
        </h5>
    </div>
    <div class="card-body p-0" id="aof-list-body">
        <?php if (empty($list)): ?>
            <div class="text-center text-muted py-5 px-4">
                <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                <p class="mb-0">No entries for this month.</p>
                <a href="<?= base_url('advance-overtime-fine/create') ?>" class="btn btn-theme-green btn-sm mt-2">Add Entry</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-4 py-3">Date</th>
                            <th class="py-3">Employee</th>
                            <th class="py-3">Type</th>
                            <th class="text-end py-3">Amount</th>
                            <th class="py-3">Notes</th>
                            <th class="text-end pe-4 py-3" style="min-width: 100px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($list as $row):
                            $type = $row['type'] ?? 'advance';
                            $typeBadge = $type === 'overtime' ? 'bg-success' : ($type === 'fine' ? 'bg-danger' : 'bg-primary');
                        ?>
                            <tr class="border-bottom border-light" data-aof-id="<?= $row['id'] ?>">
                                <td class="ps-4 py-3">
                                    <span class="text-nowrap"><?= date('d M Y', strtotime($row['date'])) ?></span>
                                </td>
                                <td class="py-3">
                                    <div class="fw-semibold"><?= esc($row['employee_name']) ?></div>
                                    <?php if (!empty($row['mobile'])): ?>
                                        <small class="text-muted"><?= esc($row['mobile']) ?></small>
                                    <?php endif; ?>
                                </td>
                                <td class="py-3">
                                    <span class="badge <?= $typeBadge ?> rounded-pill px-3 py-2"><?= esc(\App\Models\AdvanceOvertimeFineModel::typeLabel($type)) ?></span>
                                </td>
                                <td class="text-end py-3">
                                    <span class="fw-semibold">₹<?= number_format((float) ($row['amount'] ?? 0), 0) ?></span>
                                </td>
                                <td class="py-3"><small class="text-muted"><?php
                                    $rtype = $row['type'] ?? '';
                                    $notes = trim($row['notes'] ?? '');
                                    if ($rtype === 'advance_paid' && !empty($row['month_name'] ?? '')) {
                                        echo 'Applied to ' . esc($row['month_name']);
                                    } elseif ($notes && !preg_match('/^payroll_id:\d+$/', $notes)) {
                                        echo esc($row['notes']);
                                    } else {
                                        echo '—';
                                    }
                                ?></small></td>
                                <td class="text-end pe-4 py-3">
                                    <div class="btn-group btn-group-sm">
                                        <a href="<?= base_url('advance-overtime-fine/edit/' . $row['id']) ?>" class="btn btn-outline-primary" title="Edit"><i class="fas fa-edit"></i></a>
                                        <button type="button" class="btn btn-outline-danger btn-delete" data-id="<?= $row['id'] ?>" data-name="<?= esc($row['employee_name']) ?> - <?= date('d M Y', strtotime($row['date'])) ?>" title="Delete"><i class="fas fa-trash-alt"></i></button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    const deleteUrl = '<?= base_url('advance-overtime-fine/delete/') ?>';
    const csrfToken = $('meta[name="csrf-token"]').attr('content');

    $('.btn-delete').on('click', function() {
        const id = $(this).data('id');
        const name = $(this).data('name');
        Swal.fire({
            title: 'Delete entry?',
            html: 'Entry: <strong>' + name + '</strong>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete'
        }).then(function(result) {
            if (result.isConfirmed) {
                $.ajax({
                    url: deleteUrl + id,
                    type: 'POST',
                    data: { csrf_test_name: csrfToken },
                    dataType: 'json',
                    success: function(res) {
                        if (res.success) {
                            Swal.fire({ icon: 'success', title: 'Deleted', text: res.message, timer: 1500, showConfirmButton: false }).then(function() {
                                $('[data-aof-id="' + id + '"]').fadeOut(300, function() {
                                    $(this).remove();
                                    if ($('tbody tr[data-aof-id]').length === 0) {
                                        $('#aof-list-body').html('<div class="text-center text-muted py-5 px-4"><i class="fas fa-inbox fa-3x mb-3 opacity-50"></i><p class="mb-0">No entries for this month.</p><a href="<?= base_url('advance-overtime-fine/create') ?>" class="btn btn-theme-green btn-sm mt-2">Add Entry</a></div>');
                                    }
                                });
                            });
                        } else {
                            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not delete.' });
                        }
                    },
                    error: function(xhr) {
                        var msg = (xhr.responseJSON && xhr.responseJSON.message) ? xhr.responseJSON.message : 'Could not delete.';
                        Swal.fire({ icon: 'error', title: 'Error', text: msg });
                    }
                });
            }
        });
    });
</script>
<?= $this->endSection() ?>
