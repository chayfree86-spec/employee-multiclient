<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<?php
$emp = $employee;
$empId = (int) ($emp['id'] ?? 0);
$today = date('Y-m-d');
?>

<style>
/* Employee profile - theme colors */
.employee-profile-wrap { background: transparent; }
.profile-sidebar {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(110,93,97,0.08);
    border: 1px solid rgba(110,93,97,0.2);
    overflow: hidden;
}
.profile-sidebar .nav-link {
    padding: 12px 16px;
    color: #6e5d61;
    border-radius: 8px;
    margin: 2px 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
}
.profile-sidebar .nav-link:hover { background: rgba(235,210,162,0.35); color: #42291e; }
.profile-sidebar .nav-link.active { background: rgba(11,124,61,0.12); color: #0b7c3d; font-weight: 600; border-left: 3px solid #0b7c3d; }
.profile-sidebar .p-3.border-bottom.bg-light { background: rgba(235,210,162,0.25) !important; border-color: rgba(110,93,97,0.15) !important; }
.profile-panel { display: none; animation: fadeIn 0.25s ease; }
.profile-panel.active { display: block; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.profile-card {
    border-radius: 12px;
    border: 1px solid rgba(110,93,97,0.2);
    box-shadow: 0 2px 10px rgba(110,93,97,0.06);
    overflow: hidden;
    background: #fff;
}
.profile-card .card-header {
    background: linear-gradient(135deg, #0b7c3d 0%, #065a2d 100%);
    border: none;
    padding: 16px 20px;
    font-weight: 600;
    font-size: 1.15rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #fff;
}
.profile-header-title { font-size: 1.35rem; font-weight: 700; letter-spacing: 0.03em; }
.profile-card .card-header.profile-header-with-name {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
}
.profile-card .card-header.profile-header-with-name .profile-header-title {
    text-align: center;
}
.profile-card .card-header.profile-header-with-name .profile-header-left { justify-self: start; }
.profile-card .card-header.profile-header-with-name .profile-header-right { justify-self: end; }
.profile-content-font .profile-detail-row label { font-size: 0.8rem; }
.profile-content-font .profile-value { font-size: 1.05rem; }
.profile-detail-row { padding: 12px 0; border-bottom: 1px solid rgba(235,210,162,0.4); }
.profile-detail-row:last-of-type { border-bottom: none; }
.aof-stat-card { border-radius: 8px; padding: 12px 16px; }
#attendance-calendar-container { display: flex; justify-content: center; }
.att-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; width: 100%; max-width: 420px; margin: 0 auto; }
.att-cal-h { text-align: center; font-size: 0.6rem; font-weight: 600; color: #64748b; padding: 3px 0; }
.att-calendar-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.65rem; font-weight: 500; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; min-height: 28px; padding: 2px; }
.att-calendar-cell .att-day-num { font-size: 0.7rem; font-weight: 600; line-height: 1.1; }
.att-calendar-cell .att-day-name { font-size: 0.5rem; opacity: 0.9; line-height: 1; margin-top: 1px; }
.att-calendar-cell.att-tuesday { box-shadow: inset 0 0 0 2px rgba(59,130,246,0.8); }
.att-calendar-cell.att-tuesday .att-day-name { font-weight: 700; }
.att-calendar-cell:hover { transform: scale(1.05); box-shadow: 0 2px 6px rgba(0,0,0,.15); }
.att-calendar-cell.att-future { cursor: not-allowed; opacity: 0.7; }
.att-calendar-cell.att-future:hover { transform: none; }
.att-calendar-cell.att-before-join { opacity: 0.5; cursor: not-allowed; background: #d1d5db !important; color: #9ca3af !important; }
.att-calendar-cell.att-before-join:hover { transform: none; }
.att-calendar-cell.att-empty { background: transparent !important; cursor: default; pointer-events: none; }
</style>

<div class="employee-profile-wrap d-flex flex-column flex-lg-row gap-4">
    <!-- Left sidebar -->
    <div class="col-12 col-lg-3">
        <div class="profile-sidebar">
            <div class="p-3 border-bottom bg-light">
                <small class="text-muted d-block mb-1">Payable as of <?= date('d M Y') ?></small>
                <h5 class="mb-0 fw-bold text-success" id="sidebar-payable">₹<?= number_format($currentPayable ?? 0, 0) ?></h5>
            </div>
            <nav class="nav flex-column py-2">
                <a class="nav-link active profile-nav" href="#" data-panel="profile">
                    <i class="fas fa-user me-2" style="width:20px;text-align:center"></i> Profile
                </a>
                <a class="nav-link profile-nav" href="#" data-panel="advance">
                    <i class="fas fa-hand-holding-usd me-2 text-info" style="width:20px;text-align:center"></i> Advance
                    <span id="sidebar-badge-advance" class="ms-auto"><?php if (($pendingAdvanceRemaining ?? 0) > 0): ?><span class="badge bg-info rounded-pill">₹<?= number_format($pendingAdvanceRemaining, 0) ?></span><?php endif; ?></span>
                </a>
                <a class="nav-link profile-nav" href="#" data-panel="overtime">
                    <i class="fas fa-clock me-2 text-success" style="width:20px;text-align:center"></i> Overtime
                    <span id="sidebar-badge-overtime" class="ms-auto"><?php if (!($currentMonthPayrollPaid ?? true) && ($currentMonthOvertime ?? 0) > 0): ?><span class="badge bg-success rounded-pill">₹<?= number_format($currentMonthOvertime, 0) ?></span><?php endif; ?></span>
                </a>
                <a class="nav-link profile-nav" href="#" data-panel="fine">
                    <i class="fas fa-exclamation-circle me-2 text-danger" style="width:20px;text-align:center"></i> Fine
                    <span id="sidebar-badge-fine" class="ms-auto"><?php if (!($currentMonthPayrollPaid ?? true) && ($currentMonthFine ?? 0) > 0): ?><span class="badge bg-danger rounded-pill">₹<?= number_format($currentMonthFine, 0) ?></span><?php endif; ?></span>
                </a>
                <a class="nav-link profile-nav" href="#" data-panel="attendance">
                    <i class="fas fa-calendar-check me-2 text-primary" style="width:20px;text-align:center"></i> Attendance
                    <?php $attCount = (float)($currentMonthPresentCount ?? 0); $attCountStr = ($attCount == floor($attCount)) ? (string)(int)$attCount : number_format($attCount, 1, '.', ''); ?>
                    <span id="sidebar-badge-attendance" class="ms-auto"><span class="badge bg-primary rounded-pill"><?= $attCountStr ?></span></span>
                </a>
                <hr class="my-2 mx-3">
                <!-- <a class="nav-link profile-nav btn-delete-profile" href="#" data-id="<?= $empId ?>" data-name="<?= esc($emp['name']) ?>">
                    <i class="fas fa-trash me-2 text-danger" style="width:20px;text-align:center"></i> Delete
                </a> -->

                <a class="nav-link profile-nav" href="#" data-panel="hold-salary">
                    <i class="fas fa-lock me-2 text-warning" style="width:20px;text-align:center"></i> Hold Salary
                    <span id="sidebar-badge-hold" class="ms-auto"><?php if (($holdPendingAmount ?? 0) > 0): ?><span class="badge bg-warning text-dark rounded-pill">₹<?= number_format($holdPendingAmount, 0) ?></span><?php endif; ?></span>
                </a>
                <a class="nav-link profile-nav" href="#" data-panel="payroll">
                    <span class="me-2 text-success" style="width:20px;text-align:center;font-weight:700">₹</span> Payroll
                </a>
            </nav>
        </div>
    </div>

    <!-- Right content -->
    <div class="col-12 col-lg-9">
        <div id="panel-alert" class="alert d-none mb-3"></div>

        <!-- Panel: Profile -->
        <div class="profile-panel active" id="panel-profile">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><i class="fas fa-user me-2"></i> PROFILE</span>
                    <span class="profile-header-title profile-header-name-update" id="profile-header-name"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"></span>
                </div>
                <div class="card-body p-4 profile-content-font">
                    <div class="row g-0">
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Name</label><p class="fw-semibold mb-0 profile-value" id="profile-display-name"><?= esc($emp['name']) ?></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Mobile</label><p class="mb-0 profile-value" id="profile-display-mobile"><i class="fas fa-phone text-muted me-2"></i><?= esc($emp['mobile']) ?></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Alt. Mobile</label><p class="mb-0 profile-value" id="profile-display-alt-mobile"><i class="fas fa-mobile-alt text-muted me-2"></i><?= esc($emp['alternate_mobile'] ?? '—') ?></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Father's Name</label><p class="mb-0 profile-value" id="profile-display-father"><?= esc($emp['father_name'] ?? '—') ?></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Monthly Salary</label><p class="fw-semibold text-success mb-0 profile-value" id="profile-display-salary">₹<?= number_format((float) ($emp['monthly_salary'] ?? 0), 0) ?></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Join Date</label><p class="mb-0 profile-value" id="profile-display-join"><i class="fas fa-calendar-alt text-muted me-2"></i><?= !empty($emp['join_date']) ? date('d/m/Y', strtotime($emp['join_date'])) : '—' ?></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Status</label><p class="mb-0 profile-value" id="profile-display-status"><span class="badge bg-<?= $emp['status'] === 'active' ? 'success' : 'secondary' ?> rounded-pill"><?= ucfirst($emp['status']) ?></span></p></div>
                        <div class="col-md-6 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Created</label><p class="mb-0 profile-value"><i class="fas fa-calendar text-muted me-2"></i><?= !empty($emp['created_at']) ? date('d/m/Y', strtotime($emp['created_at'])) : '—' ?></p></div>
                        <?php if (!empty($holdSummary['has_hold'])): ?>
                        <div class="col-12 profile-detail-row"><label class="text-muted small text-uppercase mb-1">Hold Salary</label><p class="mb-0"><span class="badge bg-warning text-dark"><?= number_format($holdSummary['remaining_days'], 1) ?> days</span> <strong class="text-warning">₹<?= number_format($holdSummary['remaining_amount'], 0) ?></strong> <small class="text-muted">(10 working days hold for new employees)</small></p></div>
                        <?php endif; ?>
                    </div>
                    <hr class="my-4">
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-theme-blue profile-nav" data-panel="edit-profile"><i class="fas fa-edit me-1"></i> Edit Profile</button>
                        <button type="button" class="btn btn-outline-warning btn-toggle-status-profile" data-id="<?= $empId ?>" data-status="<?= $emp['status'] ?>"><i class="fas fa-toggle-<?= $emp['status'] === 'active' ? 'off' : 'on' ?> me-1"></i><span class="btn-toggle-text"><?= $emp['status'] === 'active' ? 'Deactivate' : 'Activate' ?></span></button>
                        <a href="<?= base_url('employee') ?>" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i> Back to List</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel: Advance (listing + stats + Add) -->
        <div class="profile-panel" id="panel-advance">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name flex-wrap gap-2 py-3">
                    <span class="profile-header-left"><i class="fas fa-hand-holding-usd me-2"></i> Advance</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <div class="profile-header-right d-flex flex-wrap align-items-center gap-2">
                        <div id="advance-apply-section" class="d-flex flex-wrap align-items-center gap-2"></div>
                        <button type="button" class="btn btn-light btn-sm btn-aof-add" data-type="advance"><i class="fas fa-plus me-1"></i> Add</button>
                    </div>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3 mb-4">
                        <div class="col-4"><div class="aof-stat-card bg-primary bg-opacity-10"><small class="text-muted d-block">Total Advance</small><strong class="text-primary" id="advance-stat-total">₹0</strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-success bg-opacity-10"><small class="text-muted d-block">Total Paid</small><strong class="text-success" id="advance-stat-paid">₹0</strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Total Pending</small><strong class="text-warning" id="advance-stat-pending">₹0</strong></div></div>
                    </div>
                    <div class="alert alert-warning d-none mb-3" id="aof-lock-alert-advance"><i class="fas fa-lock me-2"></i>Payroll for this month is generated. Save blocked.</div>
                    <div id="advance-list-container"><div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div></div>
                </div>
            </div>
        </div>

        <!-- Panel: Overtime -->
        <div class="profile-panel" id="panel-overtime">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><i class="fas fa-clock me-2"></i> Overtime</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"><button type="button" class="btn btn-light btn-sm btn-aof-add" data-type="overtime"><i class="fas fa-plus me-1"></i> Add</button></span>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3 mb-4">
                        <div class="col-4"><div class="aof-stat-card bg-primary bg-opacity-10"><small class="text-muted d-block">Total Overtime</small><strong class="text-primary" id="overtime-stat-total">₹0</strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-success bg-opacity-10"><small class="text-muted d-block">Total Paid</small><strong class="text-success" id="overtime-stat-paid">₹0</strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Total Pending</small><strong class="text-warning" id="overtime-stat-pending">₹0</strong></div></div>
                    </div>
                    <div class="alert alert-warning d-none mb-3" id="aof-lock-alert-overtime"><i class="fas fa-lock me-2"></i>Payroll for this month is generated. Save blocked.</div>
                    <div id="overtime-list-container"><div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div></div>
                </div>
            </div>
        </div>

        <!-- Panel: Fine -->
        <div class="profile-panel" id="panel-fine">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><i class="fas fa-exclamation-circle me-2"></i> Fine</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"><button type="button" class="btn btn-light btn-sm btn-aof-add" data-type="fine"><i class="fas fa-plus me-1"></i> Add</button></span>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3 mb-4">
                        <div class="col-4"><div class="aof-stat-card bg-primary bg-opacity-10"><small class="text-muted d-block">Total Fine</small><strong class="text-primary" id="fine-stat-total">₹0</strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-success bg-opacity-10"><small class="text-muted d-block">Total Paid</small><strong class="text-success" id="fine-stat-paid">₹0</strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Total Pending</small><strong class="text-warning" id="fine-stat-pending">₹0</strong></div></div>
                    </div>
                    <div class="alert alert-warning d-none mb-3" id="aof-lock-alert-fine"><i class="fas fa-lock me-2"></i>Payroll for this month is generated. Save blocked.</div>
                    <div id="fine-list-container"><div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div></div>
                </div>
            </div>
        </div>

        <!-- Panel: Attendance -->
        <div class="profile-panel" id="panel-attendance">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><i class="fas fa-calendar-check me-2"></i> Attendance</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"></span>
                </div>
                <div class="card-body p-4">
                    <?php
                    $attFilterMonth = (int) date('n');
                    $attFilterYear = (int) date('Y');
                    ?>
                    <div class="row g-3 mb-4">
                        <div class="col-3"><div class="aof-stat-card bg-success bg-opacity-10"><small class="text-muted d-block">Present</small><strong class="text-success" id="att-stat-present">0</strong></div></div>
                        <div class="col-3"><div class="aof-stat-card bg-danger bg-opacity-10"><small class="text-muted d-block">Absent</small><strong class="text-danger" id="att-stat-absent">0</strong></div></div>
                        <div class="col-3"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Half Day</small><strong class="text-warning" id="att-stat-halfday">0</strong></div></div>
                        <div class="col-3"><div class="aof-stat-card bg-info bg-opacity-10"><small class="text-muted d-block">Holiday</small><strong class="text-info" id="att-stat-holiday">0</strong></div></div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <span class="small text-muted">Overall Attendance</span>
                            <strong class="text-primary" id="att-stat-pct">0%</strong>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-success" id="att-stat-progress" role="progressbar" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="d-flex flex-nowrap align-items-center gap-2 mb-3">
                        <label class="text-muted mb-0">Month:</label>
                        <select id="attendanceMonthFilter" class="form-select form-select-sm" style="min-width: 120px;">
                            <?php for ($m = 1; $m <= 12; $m++): ?>
                                <option value="<?= $m ?>" <?= $m == $attFilterMonth ? 'selected' : '' ?>><?= date('F', mktime(0, 0, 0, $m, 1)) ?></option>
                            <?php endfor; ?>
                        </select>
                        <select id="attendanceYearFilter" class="form-select form-select-sm" style="min-width: 80px;">
                            <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                                <option value="<?= $y ?>" <?= $y == $attFilterYear ? 'selected' : '' ?>><?= $y ?></option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    <div class="alert alert-warning d-none mb-3" id="attendance-lock-alert"><i class="fas fa-lock me-2"></i>Payroll for this month is generated. Attendance cannot be updated.</div>
                    <h6 class="mb-2">Monthly Calendar <small class="text-muted">(Tuesday = Weekend)</small></h6>
                    <p class="small text-muted mb-2">Tuesday shows as <strong>Absent</strong> (red) when the day before (Mon) or after (Wed) is absent, or when there are 2+ absents in the month.</p>
                    <div id="attendance-calendar-container" class="mb-3"><div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div></div>
                    <div class="d-flex flex-wrap gap-3 align-items-center small">
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#22c55e"></span> Present</span>
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#f59e0b"></span> Half Day</span>
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#ef4444"></span> Absent</span>
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#000000"></span> Weekend (Tue)</span>
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#3b82f6"></span> Holiday</span>
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#e5e7eb"></span> Not Marked</span>
                        <span><span class="d-inline-block rounded me-1" style="width:12px;height:12px;background:#d1d5db"></span> Before Join</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel: Hold Salary -->
        <div class="profile-panel" id="panel-hold-salary">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><i class="fas fa-lock me-2"></i> Hold Salary</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"><?php if (!empty($holdSummary['has_hold'])): ?><button type="button" class="btn btn-light btn-sm" id="btn-release-hold"><i class="fas fa-unlock me-1"></i> Release</button><?php endif; ?></span>
                </div>
                <div class="card-body p-4">
                    <p class="text-muted small mb-3">When payroll is generated and working days are less than 10, those working days are moved to hold (initial_hold_days = remaining_hold_days = worked days, entry in hold_salary, hold_deduction in payroll). When the next payroll is generated, the system releases up to 10 days from hold into that payroll (hold_salary_released) and deducts the remaining hold amount. This continues until all hold is released. Admin can also release hold manually into a pending payroll.</p>
                    <div class="alert alert-light border mb-3 small">
                        <strong>Hold Salary Formula:</strong><br>
                        <?php $daysDivisor = (new \App\Models\SettingsModel())->getDaysDivisor((int)date('n'), (int)date('Y')); ?>
                        Total days = <?= $daysDivisor ?> &nbsp;|&nbsp; 1 day salary = Base Salary &divide; <?= $daysDivisor ?> &nbsp;|&nbsp;
                        Hold amount = Hold days × 1 day salary &nbsp;|&nbsp;
                        Payroll payable = Payable − Hold amount
                    </div>
                    <?php if (!empty($holdSummary['has_hold'])): ?>
                    <div class="row g-3 mb-4">
                        <div class="col-4"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Remaining Days</small><strong class="text-warning" id="hold-stat-days"><?= number_format($holdSummary['remaining_days'], 1) ?></strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Hold Amount</small><strong class="text-warning" id="hold-stat-amount">₹<?= number_format($holdSummary['remaining_amount'], 0) ?></strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-secondary bg-opacity-10"><small class="text-muted d-block">Initial Hold</small><strong><?= number_format($holdSummary['initial_days'], 1) ?> days</strong></div></div>
                    </div>
                    <?php if (!empty($holdSummary['rows'])): ?>
                    <h6 class="mb-2">Hold entries (all released together)</h6>
                    <div class="table-responsive"><table class="table table-sm table-hover mb-3"><thead><tr><th>Payroll ID</th><th>Total (₹)</th><th>Remaining days</th></tr></thead><tbody>
                    <?php foreach ($holdSummary['rows'] as $row): ?>
                        <tr><td><?= !empty($row['payroll_id']) ? (int)$row['payroll_id'] : '—' ?></td><td>₹<?= number_format($row['total'] ?? 0, 0) ?></td><td><?= number_format($row['remaining_hold_days'] ?? 0, 1) ?></td></tr>
                    <?php endforeach; ?>
                    </tbody></table></div>
                    <?php endif; ?>
                    <?php elseif (!empty($holdSummary['status']) && $holdSummary['status'] === 'released'): ?>
                    <div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Hold salary fully released.</div>
                    <?php else: ?>
                    <div class="alert alert-secondary"><i class="fas fa-info-circle me-2"></i>No hold salary for this employee.</div>
                    <?php endif; ?>
                    <?php if (!empty($holdReleases)): ?>
                    <h6 class="mb-2">Release History</h6>
                    <div class="table-responsive"><table class="table table-sm table-hover mb-0"><thead><tr><th>Date</th><th>Month</th><th>Days</th><th>Amount</th><th>Type</th><th>Status</th></tr></thead><tbody>
                    <?php foreach ($holdReleases as $hr): ?>
                        <tr>
                            <td><?= date('d/m/Y H:i', strtotime($hr['created_at'] ?? '')) ?></td>
                            <td><?= date('F Y', mktime(0, 0, 0, $hr['month'] ?? 1, 1, $hr['year'] ?? date('Y'))) ?></td>
                            <td><?= number_format($hr['days_released'] ?? 0, 1) ?></td>
                            <td>₹<?= number_format($hr['amount_released'] ?? 0, 0) ?></td>
                            <td><span class="badge bg-<?= ($hr['release_type'] ?? '') === 'manual' ? 'info' : 'secondary' ?>"><?= ucfirst($hr['release_type'] ?? 'auto') ?></span></td>
                            <td><span class="badge bg-<?= ($hr['paid'] ?? 0) ? 'success' : 'warning' ?>"><?= ($hr['paid'] ?? 0) ? 'Paid' : 'Pending' ?></span></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody></table></div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Panel: Payroll -->
        <div class="profile-panel" id="panel-payroll">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><span class="me-2 fw-bold">₹</span> Payroll</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"></span>
                </div>
                <div class="card-body p-4">
                    <div class="row g-3 mb-4">
                        <div class="col-4"><div class="aof-stat-card bg-primary bg-opacity-10"><small class="text-muted d-block">Total Records</small><strong class="text-primary" id="payroll-stat-count"><?= count($payrolls ?? []) ?></strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-success bg-opacity-10"><small class="text-muted d-block">Total Paid</small><strong class="text-success" id="payroll-stat-paid">₹<?= number_format(array_sum(array_map(fn($p) => ($p['paid'] ?? 0) ? ($p['total_salary'] ?? 0) : 0, $payrolls ?? [])), 0) ?></strong></div></div>
                        <div class="col-4"><div class="aof-stat-card bg-warning bg-opacity-10"><small class="text-muted d-block">Total Pending</small><strong class="text-warning" id="payroll-stat-pending">₹<?= number_format(array_sum(array_map(fn($p) => ($p['paid'] ?? 0) ? 0 : ($p['total_salary'] ?? 0), $payrolls ?? [])), 0) ?></strong></div></div>
                    </div>
                    <div id="payroll-list-container">
                        <?php if (empty($payrolls)): ?>
                        <div class="text-center py-4 text-muted"><i class="fas fa-inbox fa-2x mb-2"></i><p class="mb-0">No payroll records yet.</p></div>
                        <?php else: ?>
                        <div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Month</th><th>Base Salary</th><th>Total Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                        <?php foreach ($payrolls as $p): ?>
                        <tr>
                            <td><?= date('F Y', mktime(0, 0, 0, $p['month'], 1, $p['year'])) ?></td>
                            <td>₹<?= number_format($p['base_salary'] ?? 0, 0) ?></td>
                            <td><strong>₹<?= number_format($p['total_salary'] ?? 0, 0) ?></strong></td>
                            <td><span class="badge bg-<?= $p['paid'] ? 'success' : 'warning' ?>"><?= $p['paid'] ? 'Paid' : 'Pending' ?></span></td>
                            <td><a href="<?= base_url('payroll/salary-slip/' . $p['id']) ?>" class="btn btn-sm btn-success" target="_blank"><i class="fas fa-file-pdf"></i> Slip</a> <a href="<?= base_url('payroll/edit/' . $p['id']) ?>" class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></a></td>
                        </tr>
                        <?php endforeach; ?>
                        </tbody></table></div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panel: Edit Profile -->
        <div class="profile-panel" id="panel-edit-profile">
            <div class="profile-card card border-0">
                <div class="card-header text-white profile-header-with-name">
                    <span class="profile-header-left"><i class="fas fa-edit me-2"></i> Edit Profile</span>
                    <span class="profile-header-title profile-header-name-update"><?= strtoupper(esc($emp['name'])) ?></span>
                    <span class="profile-header-right"></span>
                </div>
                <div class="card-body p-4">
                    <form id="form-edit-profile">
                        <?= csrf_field() ?>
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label">Name <span class="text-danger">*</span></label><input type="text" name="name" class="form-control" value="<?= esc($emp['name']) ?>" required></div>
                            <div class="col-md-6"><label class="form-label">Mobile</label><input type="tel" name="mobile" class="form-control" value="<?= esc($emp['mobile']) ?>" maxlength="15" placeholder="Optional"></div>
                            <div class="col-md-6"><label class="form-label">Alt. Mobile</label><input type="tel" name="alternate_mobile" class="form-control" value="<?= esc($emp['alternate_mobile'] ?? '') ?>" maxlength="15" placeholder="Optional"></div>
                            <div class="col-md-6"><label class="form-label">Father's Name</label><input type="text" name="father_name" class="form-control" value="<?= esc($emp['father_name'] ?? '') ?>" placeholder="Optional"></div>
                            <div class="col-md-6"><label class="form-label">Monthly Salary (₹) <span class="text-danger">*</span></label><input type="number" step="0.01" min="0" name="monthly_salary" class="form-control" value="<?= $emp['monthly_salary'] ?? '' ?>" required></div>
                            <div class="col-md-6"><label class="form-label">Join Date <span class="text-danger">*</span></label><input type="date" name="join_date" class="form-control" value="<?= esc($emp['join_date'] ?? $today) ?>" required></div>
                            <div class="col-md-6"><label class="form-label">Status <span class="text-danger">*</span></label><select name="status" class="form-select" required><option value="active" <?= ($emp['status'] ?? '') === 'active' ? 'selected' : '' ?>>Active</option><option value="inactive" <?= ($emp['status'] ?? '') === 'inactive' ? 'selected' : '' ?>>Inactive</option></select></div>
                        </div>
                        <hr class="my-4">
                        <button type="submit" class="btn btn-theme-blue"><i class="fas fa-save me-1"></i> Update</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Hold Salary Release Modal -->
<div class="modal fade" id="holdReleaseModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-unlock me-2"></i> Release Hold Salary</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted small">Release hold amount into a <strong>pending</strong> payroll. Paid payrolls cannot receive hold release.</p>
                <div class="mb-3">
                    <label class="form-label">Select Payroll <span class="text-danger">*</span></label>
                    <select id="holdReleasePayrollId" class="form-select">
                        <option value="">-- Select Pending Payroll --</option>
                        <?php
                        $pendingPayrolls = array_filter($payrolls ?? [], fn($p) => empty($p['paid']));
                        foreach ($pendingPayrolls as $p):
                        ?>
                        <option value="<?= $p['id'] ?>"><?= date('F Y', mktime(0, 0, 0, $p['month'], 1, $p['year'])) ?> (₹<?= number_format($p['total_salary'] ?? 0, 0) ?>)</option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="alert alert-info small mb-0">
                    <strong>Release amount:</strong> <span id="holdReleaseAmount">₹0</span> (full remaining hold)
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-warning" id="holdReleaseConfirmBtn"><i class="fas fa-unlock me-1"></i> Release</button>
            </div>
        </div>
    </div>
</div>

<!-- AOF Add/Edit Modal -->
<div class="modal fade" id="aofModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="aofModalTitle">Add</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="alert alert-warning d-none mb-3" id="aofModalLockAlert"><i class="fas fa-lock me-2"></i>Payroll for this month is generated. Save blocked.</div>
                <form id="aofModalForm">
                    <?= csrf_field() ?>
                    <input type="hidden" name="employee_id" value="<?= $empId ?>">
                    <input type="hidden" name="type" id="aof_modal_type">
                    <input type="hidden" name="id" id="aof_modal_id">
                    <div class="mb-3">
                        <label class="form-label">Date <span class="text-danger">*</span></label>
                        <input type="date" name="date" id="aof_modal_date" class="form-control" value="<?= $today ?>" max="<?= $today ?>" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Amount (₹) <span class="text-danger">*</span></label>
                        <input type="number" step="0.01" min="0" name="amount" id="aof_modal_amount" class="form-control" placeholder="0.00" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" id="aof_modal_notes" class="form-control" rows="2" placeholder="Optional"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-theme-blue" id="aofModalSaveBtn"><i class="fas fa-save me-1"></i> Save</button>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
(function() {
    var csrf = $('meta[name="csrf-token"]').attr('content');
    var empId = <?= $empId ?>;
    var today = '<?= $today ?>';
    var joinDate = '<?= esc($emp['join_date'] ?? '') ?>';
    var aofCreateUrl = '<?= base_url('advance-overtime-fine/create') ?>';
    var aofEditUrl = '<?= base_url('advance-overtime-fine/edit') ?>';
    var aofGetUrl = '<?= base_url('advance-overtime-fine/get') ?>';
    var aofListUrl = '<?= base_url('advance-overtime-fine/list') ?>';
    var employeeUrl = '<?= base_url('employee') ?>';
    var profileBadgesUrl = '<?= base_url('employee/profile-badges/') ?>';
    var lockCheckUrl = '<?= base_url('advance-overtime-fine/check-payroll-lock') ?>';
    var holdReleaseUrl = '<?= base_url('payroll/release-hold') ?>';
    var holdSummary = <?= json_encode($holdSummary ?? []) ?>;

    function loadHoldSalaryPanel() { /* Panel is server-rendered */ }

    function showPanel(panelId) {
        $('.profile-panel').removeClass('active');
        $('#panel-' + panelId).addClass('active');
        $('.profile-nav').removeClass('active');
        $('.profile-nav[data-panel="' + panelId + '"]').addClass('active');
        $('#panel-alert').addClass('d-none');
        if (['advance','overtime','fine'].indexOf(panelId) >= 0) loadList(panelId);
        if (panelId === 'attendance') { loadAttendanceCalendar(); }
        if (panelId === 'hold-salary') { loadHoldSalaryPanel(); }
    }

    function showAlert(msg, type) {
        var $a = $('#panel-alert');
        $a.removeClass('d-none alert-success alert-danger').addClass('alert-' + type)
          .html('<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle') + ' me-2"></i>' + msg);
        if (typeof PNotify !== 'undefined') {
            if (type === 'success') {
                PNotify.success({ title: 'Success', text: msg });
            } else {
                PNotify.error({ title: 'Error', text: msg });
            }
        }
    }

    function refreshProfileBadges() {
        $.get(profileBadgesUrl + empId, {}).done(function(res) {
            if (!res.success || !res.badges) return;
            var b = res.badges;
            $('#sidebar-payable').text('₹' + Math.round(b.currentPayable || 0).toLocaleString('en-IN'));
            $('#sidebar-badge-advance').html((b.pendingAdvanceRemaining > 0) ? '<span class="badge bg-info rounded-pill">₹' + Math.round(b.pendingAdvanceRemaining).toLocaleString('en-IN') + '</span>' : '');
            var showOvertime = !b.currentMonthPayrollPaid && (b.currentMonthOvertime || 0) > 0;
            $('#sidebar-badge-overtime').html(showOvertime ? '<span class="badge bg-success rounded-pill">₹' + Math.round(b.currentMonthOvertime).toLocaleString('en-IN') + '</span>' : '');
            var showFine = !b.currentMonthPayrollPaid && (b.currentMonthFine || 0) > 0;
            $('#sidebar-badge-fine').html(showFine ? '<span class="badge bg-danger rounded-pill">₹' + Math.round(b.currentMonthFine).toLocaleString('en-IN') + '</span>' : '');
            $('#sidebar-badge-hold').html((b.holdPendingAmount > 0) ? '<span class="badge bg-warning text-dark rounded-pill">₹' + Math.round(b.holdPendingAmount).toLocaleString('en-IN') + '</span>' : '');
            var presentCount = parseFloat(b.currentMonthPresentCount) || 0;
            var presentStr = (presentCount === Math.floor(presentCount)) ? String(Math.floor(presentCount)) : presentCount.toFixed(1);
            $('#sidebar-badge-attendance').html('<span class="badge bg-primary rounded-pill">' + presentStr + '</span>');
        });
    }

    $('.profile-nav').on('click', function(e) {
        e.preventDefault();
        if ($(this).hasClass('btn-delete-profile')) return;
        showPanel($(this).data('panel'));
    });

    function loadList(type) {
        var $container = $('#' + type + '-list-container');
        $container.html('<div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div>');
        $.get(aofListUrl + '/' + empId + '/' + type, {})
            .done(function(res) {
                if (!res.success) {
                    $container.html('<div class="text-center py-4 text-danger">' + (res.message || 'Could not load.') + '</div>');
                    return;
                }
                var stats = res.stats || {};
                $('#' + type + '-stat-total').text('₹' + Math.round(stats.total || 0).toLocaleString('en-IN'));
                $('#' + type + '-stat-paid').text('₹' + Math.round(stats.paid || 0).toLocaleString('en-IN'));
                $('#' + type + '-stat-pending').text('₹' + Math.round(stats.pending || 0).toLocaleString('en-IN'));

                if (type === 'advance' && res.applyAdvance) {
                    var aa = res.applyAdvance;
                    var eligible = parseFloat(aa.eligible || 0);
                    var payrolls = aa.payrolls || [];
                    var $section = $('#advance-apply-section');
                    if (payrolls.length && eligible > 0) {
                        var html = '<span class="small text-white-50 align-middle me-1">Apply Advance:</span><span class="text-white fw-semibold align-middle me-2">₹' + Math.round(eligible).toLocaleString('en-IN') + '</span>';
                        payrolls.forEach(function(p) {
                            var disabled = p.paid ? ' disabled title="Already paid"' : '';
                            html += '<button type="button" class="btn btn-sm btn-light btn-apply-advance-profile" data-id="' + p.id + '" data-eligible="' + eligible + '" data-month="' + p.month_name + '"' + disabled + '><i class="fas fa-hand-holding-usd me-1"></i> ' + p.month_name + '</button>';
                        });
                        $section.html(html).show();
                    } else {
                        $section.empty().hide();
                    }
                }

                var entries = res.entries || [];
                if (entries.length === 0) {
                    $container.html('<div class="text-center py-4 text-muted"><i class="fas fa-inbox fa-2x mb-2"></i><p class="mb-0">No entries yet. Click Add to create one.</p></div>');
                } else {
                    var html = '<div class="table-responsive"><table class="table table-hover mb-0"><thead><tr><th>Date</th><th>Amount</th><th>Notes</th><th class="text-end">Actions</th></tr></thead><tbody>';
                    entries.forEach(function(e) {
                        var dateStr = e.date ? new Date(e.date).toLocaleDateString('en-GB') : '—';
                        var isRepayment = (e.type || '') === 'advance_paid';
                        var amount = Math.round(parseFloat(e.amount || 0));
                        var amountDisplay = (type === 'advance' && isRepayment) ? '-₹' + amount.toLocaleString('en-IN') : '+₹' + amount.toLocaleString('en-IN');
                        var amountClass = (type === 'advance' && isRepayment) ? 'text-danger' : 'text-success';
                        var notesRaw = (e.notes || '').replace(/payroll_id:\d+/g, '').trim();
                        var notesDisplay;
                        if (isRepayment) {
                            notesDisplay = (e.month_name) ? 'Applied to ' + e.month_name : 'Applied to payroll';
                        } else {
                            notesDisplay = notesRaw ? notesRaw : '—';
                        }
                        var notes = notesDisplay === '—' ? '—' : (notesDisplay.substring(0, 40) + (notesDisplay.length > 40 ? '...' : ''));
                        var editBtn = !isRepayment ? '<button type="button" class="btn btn-sm btn-outline-primary btn-aof-edit" data-id="' + e.id + '" data-type="' + type + '"><i class="fas fa-edit"></i></button> ' : '';
                        html += '<tr><td>' + dateStr + '</td><td class="fw-bold ' + amountClass + '">' + amountDisplay + '</td><td class="text-muted small">' + escapeHtml(notes) + '</td><td class="text-end">' + editBtn + '<button type="button" class="btn btn-sm btn-outline-danger btn-aof-delete" data-id="' + e.id + '" data-type="' + type + '"><i class="fas fa-trash"></i></button></td></tr>';
                    });
                    html += '</tbody></table></div>';
                    $container.html(html);
                }
            })
            .fail(function() {
                $container.html('<div class="text-center py-4 text-danger">Could not load list.</div>');
            });
    }

    function escapeHtml(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    var attendanceMarkUrl = '<?= base_url('attendance/mark') ?>';
    var attendanceGetUrl = '<?= base_url('attendance/get-attendance') ?>';
    var attendanceLockUrl = '<?= base_url('attendance/check-payroll-lock') ?>';
    var attendanceMonthlyUrl = '<?= base_url('attendance/get-monthly/') ?>';

    var attStatusColors = { present: '#22c55e', half_day: '#f59e0b', absent: '#ef4444', holiday: '#3b82f6', weekend: '#000000', not_marked: '#e5e7eb' };

    function loadAttendanceCalendar(silent) {
        var month = $('#attendanceMonthFilter').val();
        var year = $('#attendanceYearFilter').val();
        if (!silent) {
            $('#attendance-calendar-container').html('<div class="text-center py-3 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div>');
        }
        $.get(attendanceMonthlyUrl + empId + '/' + month + '/' + year).done(function(res) {
            var present = 0, absent = 0, halfDay = 0, holiday = 0, weekend = 0;
            (res.summary || []).forEach(function(s) {
                var c = parseInt(s.count || 0, 10);
                if (s.status === 'present') present = c;
                else if (s.status === 'absent') absent = c;
                else if (s.status === 'half_day') halfDay = c;
                else if (s.status === 'weekend') weekend = c;
                else if (s.status === 'holiday') holiday = c;
            });
            $('#att-stat-present').text(present);
            $('#att-stat-absent').text(absent);
            $('#att-stat-halfday').text(halfDay);
            $('#att-stat-holiday').text(holiday + weekend);
            var marked = present + absent + halfDay + holiday + weekend;
            var pct = marked > 0 ? ((present + (halfDay * 0.5)) / marked * 100) : 0;
            $('#att-stat-pct').text(pct.toFixed(1) + '%');
            $('#att-stat-progress').css('width', Math.min(100, pct) + '%').removeClass('bg-warning bg-danger').addClass(pct >= 75 ? 'bg-success' : (pct >= 50 ? 'bg-warning' : 'bg-danger'));

            var attMap = {};
            (res.attendance || []).forEach(function(a) {
                var raw = (a.date || '').toString();
                var d = raw.substring(0, 10);
                if (d && d.length === 10) {
                    attMap[d] = (a.source === 'weekend_rule') ? 'absent' : (a.status || 'not_marked');
                }
            });
            var daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
            var firstDay = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).getDay();
            var html = '<div class="att-calendar-grid">';
            html += '<div class="att-cal-h">S</div><div class="att-cal-h">M</div><div class="att-cal-h">T</div><div class="att-cal-h">W</div><div class="att-cal-h">T</div><div class="att-cal-h">F</div><div class="att-cal-h">S</div>';
            for (var i = 0; i < firstDay; i++) {
                html += '<div class="att-calendar-cell att-empty"></div>';
            }
            var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            for (var d = 1; d <= daysInMonth; d++) {
                var ymd = year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
                var dayOfWeek = new Date(ymd + 'T12:00:00').getDay();
                var dayName = dayNames[dayOfWeek];
                var isTuesday = (dayOfWeek === 2);
                var isFuture = ymd > today;
                var isBeforeJoin = joinDate && ymd < joinDate;
                var status = attMap[ymd] || 'not_marked';
                var bg = attStatusColors[status] || attStatusColors.not_marked;
                var cls = 'att-calendar-cell';
                if (isFuture) cls += ' att-future';
                if (isBeforeJoin) cls += ' att-before-join';
                if (isTuesday) cls += ' att-tuesday';
                var textColor = (status === 'not_marked') ? '#374151' : '#fff';
                if (isBeforeJoin) { bg = '#d1d5db'; textColor = '#9ca3af'; }
                html += '<div class="' + cls + '" data-date="' + ymd + '" data-status="' + status + '" data-future="' + (isFuture ? '1' : '0') + '" data-before-join="' + (isBeforeJoin ? '1' : '0') + '" style="background:' + bg + ';color:' + textColor + ';"><span class="att-day-num">' + d + '</span><span class="att-day-name">' + dayName + '</span></div>';
            }
            html += '</div>';
            $('#attendance-calendar-container').html(html);
            var parts = [year, month];
            $.get(attendanceLockUrl, { month: parseInt(month, 10), year: year, employee_ids: empId }).done(function(lockRes) {
                var locked = (lockRes.locks && lockRes.locks[String(empId)]) === true;
                $('#attendance-lock-alert').toggleClass('d-none', !locked);
                $('#attendance-calendar-container').data('locked', locked ? 1 : 0);
            });
        }).fail(function() {
            $('#attendance-calendar-container').html('<div class="text-center py-4 text-danger">Could not load attendance.</div>');
        });
    }

    $('#attendanceMonthFilter, #attendanceYearFilter').on('change', loadAttendanceCalendar);

    $(document).on('click', '#attendance-calendar-container .att-calendar-cell.att-future', function(e) {
        e.preventDefault();
        e.stopPropagation();
        Swal.fire({ icon: 'info', title: 'Future Date', text: 'Attendance can only be marked for today or past dates.' });
    });
    $(document).on('click', '#attendance-calendar-container .att-calendar-cell.att-before-join', function(e) {
        e.preventDefault();
        e.stopPropagation();
        Swal.fire({ icon: 'info', title: 'Before Join Date', text: 'Attendance cannot be marked for dates before employee join date.' });
    });
    $(document).on('click', '#attendance-calendar-container .att-calendar-cell:not(.att-empty):not(.att-future):not(.att-before-join)', function(e) {
        var $cell = $(this);
        var dateStr = $cell.data('date');
        if (dateStr > today) {
            e.preventDefault();
            e.stopPropagation();
            Swal.fire({ icon: 'info', title: 'Future Date', text: 'Attendance can only be marked for today or past dates.' });
            return;
        }
        if (joinDate && dateStr < joinDate) {
            Swal.fire({ icon: 'info', title: 'Before Join Date', text: 'Attendance cannot be marked for dates before employee join date.' });
            return;
        }
        var locked = $('#attendance-calendar-container').data('locked');
        if (locked) {
            Swal.fire({ icon: 'warning', title: 'Locked', text: 'Payroll for this month is generated. Attendance cannot be updated.' });
            return;
        }
        var dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        var isTuesday = new Date(dateStr + 'T12:00:00').getDay() === 2;
        var tuesdayHint = isTuesday ? '<p class="small text-info mb-2"><i class="fas fa-umbrella-beach me-1"></i> Tuesday = Weekend. You can still mark attendance if needed.</p>' : '';
        Swal.fire({
            title: 'Submit Attendance',
            html: '<p class="text-muted mb-3">' + dateLabel + '</p>' + tuesdayHint + '<div class="d-grid gap-2"><button type="button" class="btn btn-success btn-att-submit" data-status="present"><i class="fas fa-user-check me-2"></i> Present</button><button type="button" class="btn btn-danger btn-att-submit" data-status="absent"><i class="fas fa-user-times me-2"></i> Absent</button><button type="button" class="btn btn-warning text-dark btn-att-submit" data-status="half_day"><i class="fas fa-user-clock me-2"></i> Half Day</button><button type="button" class="btn btn-info btn-att-submit" data-status="holiday"><i class="fas fa-umbrella-beach me-2"></i> Holiday</button></div>',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            didOpen: function() {
                var el = Swal.getHtmlContainer();
                if (el) $(el).find('.btn-att-submit').on('click', function() {
                    var status = $(this).data('status');
                    $.ajax({
                        url: attendanceMarkUrl,
                        type: 'POST',
                        data: { csrf_test_name: csrf, employee_id: empId, date: dateStr, status: status },
                        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                        dataType: 'json'
                    }).done(function(res) {
                        if (res.success) {
                            Swal.close();
                            showAlert(res.message, 'success');
                            loadAttendanceCalendar(true);
                            refreshProfileBadges();
                        } else {
                            Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not save.' });
                        }
                    }).fail(function(xhr) {
                        var r = xhr.responseJSON || {};
                        Swal.fire({ icon: 'error', title: 'Error', text: r.message || 'Could not save.' });
                    });
                });
            }
        });
    });

    $('#holdReleaseAmount').text('₹' + Math.round(holdSummary.remaining_amount || 0).toLocaleString('en-IN'));
    $('#btn-release-hold').on('click', function() {
        var opts = $('#holdReleasePayrollId option');
        if (opts.length <= 1) {
            Swal.fire({ icon: 'warning', title: 'No Pending Payroll', text: 'There is no pending payroll to release hold into. Hold can only be released when a payroll is pending (unpaid).' });
            return;
        }
        new bootstrap.Modal(document.getElementById('holdReleaseModal')).show();
    });
    $('#holdReleaseConfirmBtn').on('click', function() {
        var payrollId = $('#holdReleasePayrollId').val();
        if (!payrollId) {
            Swal.fire({ icon: 'warning', title: 'Select Payroll', text: 'Please select a pending payroll.' });
            return;
        }
        var $btn = $(this);
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Releasing...');
        $.ajax({
            url: holdReleaseUrl,
            type: 'POST',
            data: { csrf_test_name: csrf, employee_id: empId, payroll_id: payrollId },
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
            dataType: 'json'
        }).done(function(res) {
            $btn.prop('disabled', false).html('<i class="fas fa-unlock me-1"></i> Release');
            bootstrap.Modal.getInstance(document.getElementById('holdReleaseModal')).hide();
            if (res.success) {
                showAlert(res.message, 'success');
                refreshProfileBadges();
                if (typeof loadHoldSalaryPanel === 'function') loadHoldSalaryPanel();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not release.' });
            }
        }).fail(function(xhr) {
            $btn.prop('disabled', false).html('<i class="fas fa-unlock me-1"></i> Release');
            var r = xhr.responseJSON || {};
            Swal.fire({ icon: 'error', title: 'Error', text: r.message || 'Could not release.' });
        });
    });

    function openAofModal(type, editId) {
        var isEdit = !!editId;
        $('#aofModalTitle').text((isEdit ? 'Edit ' : 'Add ') + type.charAt(0).toUpperCase() + type.slice(1));
        $('#aof_modal_type').val(type);
        $('#aof_modal_id').val(editId || '');
        $('#aof_modal_date').val(today);
        $('#aof_modal_amount').val('');
        $('#aof_modal_notes').val('');
        $('#aofModalLockAlert').addClass('d-none');
        if (isEdit) {
            $.get(aofGetUrl + '/' + editId).done(function(res) {
                if (res.success && res.item) {
                    var i = res.item;
                    $('#aof_modal_date').val(i.date || today);
                    $('#aof_modal_amount').val(i.amount || '');
                    $('#aof_modal_notes').val(i.notes || '');
                }
            });
        }
        new bootstrap.Modal(document.getElementById('aofModal')).show();
    }

    $('.btn-aof-add').on('click', function() {
        var type = $(this).data('type');
        openAofModal(type, null);
    });

    $(document).on('click', '.btn-aof-edit', function() {
        var id = $(this).data('id');
        var type = $(this).data('type');
        openAofModal(type, id);
    });

    $(document).on('click', '.btn-aof-delete', function() {
        var id = $(this).data('id');
        var type = $(this).data('type');
        var $row = $(this).closest('tr');
        var amount = $row.find('td').eq(1).text().trim() || '';
        var notes = $row.find('td').eq(2).text().trim() || '';
        Swal.fire({
            title: 'Delete Entry?',
            html: '<p class="mb-2">Are you sure you want to delete this entry?</p>' + (amount ? '<p class="text-muted small mb-0"><strong>' + amount + '</strong>' + (notes ? ' – ' + notes : '') + '</p>' : '') + '<p class="text-danger small mt-2 mb-0">This action cannot be undone.</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel'
        }).then(function(r) {
            if (!r.isConfirmed) return;
            $.ajax({
                url: '<?= base_url('advance-overtime-fine/delete/') ?>' + id,
                type: 'POST',
                data: { csrf_test_name: csrf },
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                dataType: 'json'
            }).done(function(res) {
                if (res.success) {
                    if (typeof PNotify !== 'undefined') PNotify.success({ title: 'Deleted', text: res.message });
                    Swal.fire({ icon: 'success', title: 'Deleted', text: res.message, timer: 1500, showConfirmButton: false });
                    loadList(type);
                    refreshProfileBadges();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not delete.' });
                }
            }).fail(function(xhr) {
                var res = xhr.responseJSON || {};
                Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not delete.' });
            });
        });
    });

    function checkAofLock() {
        var dateVal = $('#aof_modal_date').val();
        if (!dateVal) return;
        var d = new Date(dateVal + 'T12:00:00');
        $.get(lockCheckUrl, { month: d.getMonth() + 1, year: d.getFullYear(), employee_id: empId }, function(res) {
            if (res.locked) {
                $('#aofModalLockAlert').removeClass('d-none');
                $('#aofModalSaveBtn').prop('disabled', true);
            } else {
                $('#aofModalLockAlert').addClass('d-none');
                $('#aofModalSaveBtn').prop('disabled', false);
            }
        });
    }
    $('#aof_modal_date').on('change', checkAofLock);

    $('#aofModalSaveBtn').on('click', function() {
        var $form = $('#aofModalForm');
        var id = $('#aof_modal_id').val();
        var isEdit = !!id;
        var url = isEdit ? aofEditUrl + '/' + id : aofCreateUrl;
        var $btn = $(this);
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Saving...');

        var data = {
            csrf_test_name: csrf,
            employee_id: $form.find('[name="employee_id"]').val(),
            type: $form.find('[name="type"]').val(),
            date: $form.find('[name="date"]').val(),
            amount: $form.find('[name="amount"]').val(),
            repay_months: 1,
            notes: $form.find('[name="notes"]').val()
        };

        $.ajax({ url: url, type: 'POST', data: data, headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }, dataType: 'json' })
            .done(function(res) {
                if (res.success) {
                    $('#aofModal').modal('hide');
                    showAlert(res.message, 'success');
                    var type = $('#aof_modal_type').val();
                    loadList(type);
                    refreshProfileBadges();
                } else {
                    showAlert(res.message || 'Could not save.', 'danger');
                }
            })
            .fail(function(xhr) {
                var res = xhr.responseJSON || {};
                showAlert(res.message || 'Could not save.', 'danger');
            })
            .always(function() {
                $btn.prop('disabled', false).html(orig);
            });
    });

    $('#form-edit-profile').on('submit', function(e) {
        e.preventDefault();
        var $form = $(this);
        var $btn = $form.find('button[type="submit"]');
        var orig = $btn.html();
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Updating...');
        $.ajax({
            url: employeeUrl + '/edit/' + empId,
            type: 'POST',
            data: { 
                csrf_test_name: csrf, 
                name: $form.find('[name="name"]').val(), 
                mobile: $form.find('[name="mobile"]').val(), 
                alternate_mobile: $form.find('[name="alternate_mobile"]').val(),
                father_name: $form.find('[name="father_name"]').val(),
                monthly_salary: $form.find('[name="monthly_salary"]').val(), 
                join_date: $form.find('[name="join_date"]').val(), 
                status: $form.find('[name="status"]').val() 
            },
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
            dataType: 'json'
        }).done(function(res) {
            if (res.success) {
                showAlert(res.message, 'success');
                refreshProfileBadges();
                var name = $form.find('[name="name"]').val();
                var mobile = $form.find('[name="mobile"]').val();
                var altMobile = $form.find('[name="alternate_mobile"]').val();
                var fatherName = $form.find('[name="father_name"]').val();
                var salary = parseFloat($form.find('[name="monthly_salary"]').val()) || 0;
                var joinDate = $form.find('[name="join_date"]').val();
                var status = $form.find('[name="status"]').val();
                $('#profile-display-name').text(name);
                $('.profile-header-name-update').text(name.toUpperCase());
                $('#profile-display-mobile').html('<i class="fas fa-phone text-muted me-2"></i>' + (mobile || '—'));
                $('#profile-display-alt-mobile').html('<i class="fas fa-mobile-alt text-muted me-2"></i>' + (altMobile || '—'));
                $('#profile-display-father').text(fatherName || '—');
                $('#profile-display-salary').text('₹' + Math.round(salary).toLocaleString('en-IN'));
                $('#profile-display-join').html('<i class="fas fa-calendar-alt text-muted me-2"></i>' + (joinDate ? new Date(joinDate).toLocaleDateString('en-GB') : '—'));
                $('#profile-display-status').html('<span class="badge bg-' + (status === 'active' ? 'success' : 'secondary') + ' rounded-pill">' + (status === 'active' ? 'Active' : 'Inactive') + '</span>');
                $('.btn-toggle-status-profile').data('status', status).find('.btn-toggle-text').text(status === 'active' ? 'Deactivate' : 'Activate').end().find('i').removeClass('fa-toggle-off fa-toggle-on').addClass(status === 'active' ? 'fa-toggle-off' : 'fa-toggle-on');
            } else { showAlert(res.message || 'Could not update.', 'danger'); }
            $btn.prop('disabled', false).html(orig);
        }).fail(function(xhr) {
            var res = xhr.responseJSON || {};
            showAlert(res.message || 'Could not update.', 'danger');
            $btn.prop('disabled', false).html(orig);
        });
    });

    $('.btn-toggle-status-profile').on('click', function() {
        $.ajax({ url: employeeUrl + '/toggle-status/' + empId, type: 'POST', data: { csrf_test_name: csrf }, headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }, dataType: 'json' })
            .done(function(res) {
                if (res.success) {
                    showAlert(res.message, 'success');
                    refreshProfileBadges();
                    var s = (res.data && res.data.new_status) || 'active';
                    $('#profile-display-status').html('<span class="badge bg-' + (s === 'active' ? 'success' : 'secondary') + ' rounded-pill">' + (s === 'active' ? 'Active' : 'Inactive') + '</span>');
                    $('.btn-toggle-status-profile').data('status', s).find('.btn-toggle-text').text(s === 'active' ? 'Deactivate' : 'Activate').end().find('i').removeClass('fa-toggle-off fa-toggle-on').addClass(s === 'active' ? 'fa-toggle-off' : 'fa-toggle-on');
                } else { showAlert(res.message || 'Could not update.', 'danger'); }
            }).fail(function() { showAlert('Could not update.', 'danger'); });
    });

    $('.btn-delete-profile').on('click', function(e) {
        e.preventDefault();
        var name = $(this).data('name');
        Swal.fire({ title: 'Delete employee?', text: 'Delete ' + name + '? This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Yes, delete' })
            .then(function(r) {
                if (!r.isConfirmed) return;
                $.ajax({ url: employeeUrl + '/delete/' + empId, type: 'POST', data: { csrf_test_name: csrf }, headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }, dataType: 'json' })
                    .done(function(res) {
                        if (res.success) Swal.fire({ icon: 'success', title: 'Deleted', text: res.message }).then(function() { window.location.href = employeeUrl; });
                        else Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not delete.' });
                    }).fail(function() { Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete.' }); });
            });
    });

    $('#aofModal').on('show.bs.modal', function() { checkAofLock(); });
    $('#aofModal').on('shown.bs.modal', function() {
        setTimeout(function() { $('#aof_modal_amount').focus(); }, 100);
    });

    $(document).on('click', '.btn-apply-advance-profile', function() {
        var id = $(this).data('id');
        var eligible = parseFloat($(this).data('eligible')) || 0;
        var monthName = $(this).data('month') || '';
        var eligibleStr = Math.round(eligible).toLocaleString('en-IN');
        Swal.fire({
            title: 'Apply Advance Deduction',
            html: '<p class="text-success mb-2"><strong>Eligible amount: ₹' + eligibleStr + '</strong></p><p class="small text-muted mb-2">Amount cannot exceed ₹' + eligibleStr + '.</p><label class="form-label text-start w-100">Amount (₹) <span class="text-danger">*</span></label><input type="number" step="0.01" min="0" max="' + eligible + '" id="swal-advance-amount" class="swal2-input" placeholder="0.00">',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Apply',
            preConfirm: function() {
                var val = document.getElementById('swal-advance-amount').value;
                var num = parseFloat(val);
                if (val === '' || isNaN(num) || num < 0) {
                    Swal.showValidationMessage('Please enter a valid amount (0 or more).');
                    return false;
                }
                if (num > eligible) {
                    Swal.showValidationMessage('Amount cannot exceed eligible ₹' + Math.round(eligible).toLocaleString('en-IN') + '.');
                    return false;
                }
                return val;
            }
        }).then(function(r) {
            if (!r.isConfirmed || r.value === undefined) return;
            $.ajax({
                url: '<?= base_url('payroll/apply-advance/') ?>' + id,
                type: 'POST',
                data: { csrf_test_name: csrf, amount: r.value },
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                dataType: 'json'
            }).done(function(res) {
                if (res.success) {
                    if (typeof PNotify !== 'undefined') PNotify.success({ title: 'Applied', text: res.message });
                    Swal.fire({ icon: 'success', title: 'Applied', text: res.message, timer: 1500, showConfirmButton: false }).then(function() {
                        loadList('advance');
                        refreshProfileBadges();
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not apply advance.' });
                }
            }).fail(function() {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not apply advance.' });
            });
        });
    });
})();
</script>
<?= $this->endSection() ?>
