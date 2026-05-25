<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h3>&nbsp;</h3>
    <div>
        <form method="get" class="d-inline">
            <div class="input-group">
                <select name="month" class="form-select">
                    <?php for ($m = 1; $m <= 12; $m++): ?>
                        <option value="<?= $m ?>" <?= $m == $month ? 'selected' : '' ?>>
                            <?= date('F', mktime(0, 0, 0, $m, 1)) ?>
                        </option>
                    <?php endfor; ?>
                </select>
                <select name="year" class="form-select">
                    <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                        <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>>
                            <?= $y ?>
                        </option>
                    <?php endfor; ?>
                </select>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-search"></i> Filter
                </button>
            </div>
        </form>
        <a href="?month=<?= $month ?>&year=<?= $year ?>&export=pdf" class="btn btn-success ms-2">
            <i class="fas fa-download"></i> Export PDF
        </a>
        <a href="https://wa.me/?text=<?= urlencode('Monthly Salary Report for ' . date('F Y', mktime(0, 0, 0, $month, 1, $year)) . ' - Check the attached PDF') ?>" class="btn btn-success ms-2" target="_blank">
            <i class="fab fa-whatsapp"></i> Share on WhatsApp
        </a>

    </div>
</div>

<div class="alert alert-light border mb-3 small">
    <?php $daysDivisor = (new \App\Models\SettingsModel())->getDaysDivisor((int)($month ?? date('n')), (int)($year ?? date('Y'))); ?>
    <strong>Salary Formula:</strong> Total days = <?= $daysDivisor ?> &nbsp;|&nbsp; 1 day salary = Base &divide; <?= $daysDivisor ?> &nbsp;|&nbsp; Hold amount = Hold days &times; 1 day &nbsp;|&nbsp; Payroll payable = Payable &minus; Hold amount
</div>
<div class="card">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Employee</th>
                        <th>Mobile</th>
                        <th>Base Salary</th>
                        <th>Overtime</th>
                        <th>Fine</th>
                        <th>Advance Deduction</th>
                        <th>Total Salary</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $totalBase = 0;
                    $totalOvertime = 0;
                    $totalFine = 0;
                    $totalLoan = 0;
                    $totalSalary = 0;
                    $paidCount = 0;
                    ?>
                    <?php foreach ($payrolls as $payroll): ?>
                        <?php
                        $totalBase += $payroll['base_salary'];
                        $totalOvertime += $payroll['overtime'];
                        $totalFine += $payroll['fine'];
                        $totalLoan += $payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0;
                        $totalSalary += $payroll['total_salary'];
                        if ($payroll['paid']) $paidCount++;
                        ?>
                        <tr>
                            <td>
                                <strong><?= $payroll['name'] ?></strong>
                            </td>
                            <td><?= $payroll['mobile'] ?></td>
                            <td>₹<?= number_format($payroll['base_salary'], 0) ?></td>
                            <td>₹<?= number_format($payroll['overtime'], 0) ?></td>
                            <td>₹<?= number_format($payroll['fine'], 0) ?></td>
                            <td>₹<?= number_format($payroll['advance_deduction'] ?? $payroll['loan_deduction'] ?? 0, 0) ?></td>
                            <td><strong>₹<?= number_format($payroll['total_salary'], 0) ?></strong></td>
                            <td>
                                <span class="badge bg-<?= $payroll['paid'] ? 'success' : 'warning' ?>">
                                    <?= $payroll['paid'] ? 'Paid' : 'Pending' ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot class="table-dark">
                    <tr>
                        <th colspan="2">TOTAL</th>
                        <th>₹<?= number_format($totalBase, 0) ?></th>
                        <th>₹<?= number_format($totalOvertime, 0) ?></th>
                        <th>₹<?= number_format($totalFine, 0) ?></th>
                        <th>₹<?= number_format($totalLoan, 0) ?></th>
                        <th>₹<?= number_format($totalSalary, 0) ?></th>
                        <th><?= $paidCount ?>/<?= count($payrolls) ?> Paid</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<?= $this->endSection() ?>