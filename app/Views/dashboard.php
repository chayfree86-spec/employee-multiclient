<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="row mb-4 g-3">
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card card-dashboard card-stat border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center">
                <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                    <i class="fas fa-users fa-lg text-primary"></i>
                </div>
                <div class="flex-grow-1">
                    <p class="text-muted text-uppercase small fw-semibold mb-1">Total Employees</p>
                    <h4 class="mb-0 fw-bold"><?= $totalEmployees ?></h4>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card card-dashboard card-stat border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center">
                <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
                    <i class="fas fa-rupee-sign fa-lg text-success"></i>
                </div>
                <div class="flex-grow-1">
                    <p class="text-muted text-uppercase small fw-semibold mb-1">Current Month Payable</p>
                    <h4 class="mb-0 fw-bold">₹<?= number_format($currentMonthPayable ?? 0, 0) ?></h4>
                    <small class="text-muted"><?= date('F Y', mktime(0, 0, 0, (int)date('n'), 1, (int)date('Y'))) ?> · as of <?= date('d M Y', strtotime($currentMonthPayableDate ?? 'now')) ?></small>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card card-dashboard card-stat border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center">
                <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
                    <i class="fas fa-money-bill-wave fa-lg text-info"></i>
                </div>
                <div class="flex-grow-1">
                    <p class="text-muted text-uppercase small fw-semibold mb-1">Payout Done</p>
                    <h4 class="mb-0 fw-bold">₹<?= number_format($totalPayoutDone ?? 0, 0) ?></h4>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-sm-6 col-xl-3">
        <div class="card card-dashboard card-stat border-0 shadow-sm h-100">
            <div class="card-body d-flex align-items-center">
                <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                    <i class="fa fa-inr fa-lg text-warning"></i>
                </div>
                <div class="flex-grow-1">
                    <p class="text-muted text-uppercase small fw-semibold mb-1">Advance Pending Total</p>
                    <h4 class="mb-0 fw-bold">₹<?= number_format($totalAdvancePending ?? 0, 0) ?></h4>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Charts Section -->
<div class="row g-3">
    <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 pt-4 pb-2">
                <h5 class="mb-0 fw-semibold"><i class="fas fa-user-check text-primary me-2"></i>Attendance Monthly Report</h5>
                <p class="text-muted small mb-0 mt-1">Aggregate present, absent, half day by month</p>
            </div>
            <div class="card-body pt-2">
                <div class="chart-container" style="position: relative; height: 280px;">
                    <canvas id="attendanceMonthlyChart"></canvas>
                </div>
            </div>
        </div>
    </div>
    <div class="col-12 col-lg-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 pt-4 pb-2">
                <h5 class="mb-0 fw-semibold"><i class="fas fa-chart-bar text-primary me-2"></i>Payout Distribution Monthly</h5>
                <p class="text-muted small mb-0 mt-1">Total paid salary by month</p>
            </div>
            <div class="card-body pt-2">
                <div class="chart-container" style="position: relative; height: 280px;">
                    <canvas id="payoutMonthlyChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0,0,0,0.8)';
    Chart.defaults.plugins.tooltip.padding = 12;

    var attData = <?= json_encode($attendanceMonthly ?? []) ?>;
    var payoutData = <?= json_encode($payoutMonthly ?? []) ?>;

    new Chart(document.getElementById('attendanceMonthlyChart'), {
        type: 'bar',
        data: {
            labels: attData.map(function(m) { return m.label; }),
            datasets: [
                { label: 'Present', data: attData.map(function(m) { return m.present; }), backgroundColor: 'rgba(34, 197, 94, 0.8)', borderRadius: 4 },
                { label: 'Absent', data: attData.map(function(m) { return m.absent; }), backgroundColor: 'rgba(239, 68, 68, 0.8)', borderRadius: 4 },
                { label: 'Half Day', data: attData.map(function(m) { return m.half_day; }), backgroundColor: 'rgba(245, 158, 11, 0.8)', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ctx.dataset.label + ': ' + ctx.raw;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: false, grid: { display: false } },
                y: { beginAtZero: true, stacked: false }
            }
        }
    });

    new Chart(document.getElementById('payoutMonthlyChart'), {
        type: 'bar',
        data: {
            labels: payoutData.map(function(m) { return m.label; }),
            datasets: [{
                label: 'Payout (₹)',
                data: payoutData.map(function(m) { return m.amount; }),
                backgroundColor: 'rgba(23, 162, 184, 0.85)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return '₹' + Math.round(Number(ctx.raw) || 0).toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(v) {
                            if (v >= 100000) return '₹' + (v/100000) + 'L';
                            if (v >= 1000) return '₹' + (v/1000) + 'k';
                            return '₹' + v;
                        }
                    }
                }
            }
        }
    });
</script>
<?= $this->endSection() ?>
