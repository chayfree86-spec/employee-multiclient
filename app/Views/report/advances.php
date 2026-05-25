<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h3>&nbsp;</h3>
    <div>
        <form method="get" class="d-inline">
            <div class="input-group">
                <input type="date" name="start_date" class="form-control" value="<?= $startDate ?>">
                <span class="input-group-text">to</span>
                <input type="date" name="end_date" class="form-control" value="<?= $endDate ?>">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-search"></i> Filter
                </button>
            </div>
        </form>
        <a href="?start_date=<?= $startDate ?>&end_date=<?= $endDate ?>&export=pdf" class="btn btn-success ms-2">
            <i class="fas fa-download"></i> Export PDF
        </a>
        <a href="https://wa.me/?text=<?= urlencode('Advance Payment History from ' . date('d/m/Y', strtotime($startDate)) . ' to ' . date('d/m/Y', strtotime($endDate)) . ' - Check the attached PDF') ?>" class="btn btn-success ms-2" target="_blank">
            <i class="fab fa-whatsapp"></i> Share on WhatsApp
        </a>

    </div>
</div>

<div class="card">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Employee</th>
                        <th>Amount</th>
                        <th>Reason</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $totalAmount = 0;
                    ?>
                    <?php foreach ($advances as $advance): ?>
                        <?php $totalAmount += $advance['amount']; ?>
                        <tr>
                            <td>
                                <strong><?= $advance['name'] ?></strong>
                            </td>
                            <td>₹<?= number_format($advance['amount'], 0) ?></td>
                            <td><?= $advance['reason'] ?: '<em class="text-muted">No reason specified</em>' ?></td>
                            <td><?= date('d/m/Y', strtotime($advance['date'])) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot class="table-dark">
                    <tr>
                        <th>TOTAL</th>
                        <th>₹<?= number_format($totalAmount, 0) ?></th>
                        <th colspan="2"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<?= $this->endSection() ?>