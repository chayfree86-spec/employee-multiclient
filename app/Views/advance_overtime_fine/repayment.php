<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="d-flex flex-column flex-sm-row flex-wrap justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
    <h4 class="mb-0 text-theme-blue">Advance Repayment Status</h4>
    <div class="d-flex flex-wrap gap-2">
        <a href="<?= base_url('advance-overtime-fine') ?>" class="btn btn-outline-secondary">
            <i class="fas fa-arrow-left me-1"></i> Back to Advance / Overtime / Fine
        </a>
        <a href="<?= base_url('advance-overtime-fine/create') ?>" class="btn btn-theme-green">
            <i class="fas fa-plus me-1"></i> Add Entry
        </a>
    </div>
</div>

<p class="text-muted mb-3">
    <i class="fas fa-info-circle me-1"></i>
    Advance is deducted manually in <strong>Payroll → Edit</strong>. Below: total advance given, total already deducted (from payroll), remaining, and status (Pending / Paid).
</p>

<div class="card shadow-sm">
    <div class="card-header bg-theme-blue text-white py-3">
        <h5 class="mb-0">
            <i class="fas fa-list-check me-2"></i>By Employee – Paid vs Remaining
        </h5>
    </div>
    <div class="card-body p-0">
        <?php if (empty($list)): ?>
            <div class="text-center text-muted py-5">
                <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                <p class="mb-0">No advance entries found.</p>
                <a href="<?= base_url('advance-overtime-fine/create') ?>" class="btn btn-theme-green mt-2">Add Advance</a>
            </div>
        <?php else:
            $totalAdvance = 0;
            $totalPaid = 0;
            $totalRemaining = 0;
            foreach ($list as $row) {
                $totalAdvance += (float) ($row['total_advance'] ?? 0);
                $totalPaid += (float) ($row['total_paid'] ?? 0);
                $totalRemaining += (float) ($row['remaining'] ?? 0);
            }
        ?>
            <div class="table-responsive">
                <table class="table table-hover table-striped align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-4">Employee</th>
                            <th class="text-end">Total Advance (₹)</th>
                            <th class="text-end">Paid (₹)</th>
                            <th class="text-end">Remaining (₹)</th>
                            <th>Progress</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($list as $row):
                            $total = (float) ($row['total_advance'] ?? 0);
                            $paid = (float) ($row['total_paid'] ?? 0);
                            $remaining = (float) ($row['remaining'] ?? 0);
                            $pct = $total > 0 ? min(100, round(($paid / $total) * 100)) : 0;
                            $status = $row['status'] ?? 'Pending';
                        ?>
                            <tr>
                                <td class="ps-4">
                                    <strong><?= esc($row['employee_name']) ?></strong>
                                    <?php if (!empty($row['mobile'])): ?>
                                        <br><small class="text-muted"><?= esc($row['mobile']) ?></small>
                                    <?php endif; ?>
                                </td>
                                <td class="text-end fw-medium">₹<?= number_format($total, 0) ?></td>
                                <td class="text-end text-success">₹<?= number_format($paid, 0) ?></td>
                                <td class="text-end <?= $remaining > 0 ? 'text-warning' : 'text-muted' ?>">₹<?= number_format($remaining, 0) ?></td>
                                <td>
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="progress flex-grow-1" style="height: 8px; min-width: 80px;">
                                            <div class="progress-bar <?= $status === 'Paid' ? 'bg-success' : 'bg-primary' ?>" role="progressbar" style="width: <?= $pct ?>%;"></div>
                                        </div>
                                        <small class="text-muted"><?= $pct ?>%</small>
                                    </div>
                                </td>
                                <td class="text-center">
                                    <?php if ($status === 'Paid'): ?>
                                        <span class="badge bg-success"><i class="fas fa-check me-1"></i>Paid</span>
                                    <?php else: ?>
                                        <span class="badge bg-warning text-dark">Pending</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot class="table-light fw-medium">
                        <tr>
                            <td class="ps-4 text-end">Totals</td>
                            <td class="text-end">₹<?= number_format($totalAdvance, 0) ?></td>
                            <td class="text-end text-success">₹<?= number_format($totalPaid, 0) ?></td>
                            <td class="text-end">₹<?= number_format($totalRemaining, 0) ?></td>
                            <td colspan="2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?= $this->endSection() ?>
