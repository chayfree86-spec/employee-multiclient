<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="row">
    <div class="col-md-12">
        &nbsp;
        <p class="text-muted">Generate and export various reports for your employee management system.</p>
    </div>
</div>

<div class="row mt-4 g-3">
    <div class="col-12 col-md-4 mb-4">
        <div class="card h-100">
            <div class="card-body text-center">
                <i class="fas fa-calendar-check fa-3x text-primary mb-3"></i>
                <h5 class="card-title">Attendance Report</h5>
                <p class="card-text">Monthly attendance summary for all employees with detailed breakdown.</p>
                <a href="<?= base_url('report/attendance') ?>" class="btn btn-primary">
                    <i class="fas fa-eye"></i> View Report
                </a>
            </div>
        </div>
    </div>

    <div class="col-12 col-md-4 mb-4">
        <div class="card h-100">
            <div class="card-body text-center">
                <i class="fas fa-money-bill-wave fa-3x text-success mb-3"></i>
                <h5 class="card-title">Salary Report</h5>
                <p class="card-text">Monthly salary details including overtime, deductions, and final amounts.</p>
                <a href="<?= base_url('report/salary') ?>" class="btn btn-success">
                    <i class="fas fa-eye"></i> View Report
                </a>
            </div>
        </div>
    </div>

    <div class="col-12 col-md-4 mb-4">
        <div class="card h-100">
            <div class="card-body text-center">
                <i class="fas fa-hand-holding-usd fa-3x text-warning mb-3"></i>
                <h5 class="card-title">Advance/Loan Report</h5>
                <p class="card-text">History of all advances and loans given to employees.</p>
                <a href="<?= base_url('report/advances') ?>" class="btn btn-warning">
                    <i class="fas fa-eye"></i> View Report
                </a>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header">
                <h5>Quick Stats</h5>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <div class="col-md-3">
                        <h4 class="text-primary">
                            <?= $totalActiveEmployees ?>
                        </h4>
                        <p class="text-muted">Active Employees</p>
                    </div>
                    <div class="col-md-3">
                        <h4 class="text-success">
                            ₹<?= number_format($totalPaidAmount, 0) ?>
                        </h4>
                        <p class="text-muted">Total Paid This Month</p>
                    </div>
                    <div class="col-md-3">
                        <h4 class="text-info">
                            ₹<?= number_format($totalMonthlySalary, 0) ?>
                        </h4>
                        <p class="text-muted">Monthly Salary Budget</p>
                    </div>
                    <div class="col-md-3">
                        <h4 class="text-warning">
                            ₹<?= number_format($totalAdvances, 0) ?>
                        </h4>
                        <p class="text-muted">Total Advances</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>