<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
    <div>
        <h3><?= !empty($filterEmployeeId) && isset($reportData[0]['employee']['name']) ? 'Attendance Report - ' . esc($reportData[0]['employee']['name']) : 'Monthly Attendance Report' ?></h3>
        <small class="text-muted d-block"><i class="fas fa-umbrella-beach me-1"></i> Tuesday = Weekend (weekly off). Absent count includes Tuesday when Mon or Wed is absent, or when there are 2+ absents in the month.</small>
    </div>
    <div>
        <form method="get" class="d-inline">
            <?php if (!empty($filterEmployeeId)): ?>
            <input type="hidden" name="employee_id" value="<?= $filterEmployeeId ?>">
            <?php endif; ?>
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
        <a href="<?= base_url('attendance/report?month=' . $month . '&year=' . $year . (isset($filterEmployeeId) && $filterEmployeeId ? '&employee_id=' . $filterEmployeeId : '') . '&export=pdf') ?>" class="btn btn-success ms-2">
            <i class="fas fa-download"></i> Export PDF
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
                        <th>Mobile</th>
                        <th>Weekend</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Half Day</th>
                        <th>Holiday</th>
                        <th>Attendance %</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($reportData as $report): ?>
                        <?php
                        $totalDays = 0;
                        $present = 0;
                        $absent = 0;
                        $halfDay = 0;
                        $weekend = 0;
                        $holiday = 0;

                        foreach ($report['summary'] as $summary) {
                            switch ($summary['status']) {
                                case 'present':
                                    $present = $summary['count'];
                                    $totalDays += $summary['count'];
                                    break;
                                case 'absent':
                                    $absent = $summary['count'];
                                    $totalDays += $summary['count'];
                                    break;
                                case 'half_day':
                                    $halfDay = $summary['count'];
                                    $totalDays += $summary['count'];
                                    break;
                                case 'weekend':
                                    $weekend = $summary['count'];
                                    $totalDays += $summary['count'];
                                    break;
                                case 'holiday':
                                    $holiday = $summary['count'];
                                    $totalDays += $summary['count'];
                                    break;
                            }
                        }

                        $workingDays = $totalDays;
                        $attendancePercentage = $workingDays > 0 ? (($present + ($halfDay * 0.5)) / $workingDays) * 100 : 0;
                        ?>
                        <tr>
                            <td><?= $report['employee']['name'] ?></td>
                            <td><?= !empty(trim((string)($report['employee']['mobile'] ?? ''))) ? esc($report['employee']['mobile']) : '—' ?></td>
                            <td><span class="fw-bold" style="color:#000"><?= $weekend ?></span></td>
                            <td><span class="badge bg-success"><?= $present ?></span></td>
                            <td><span class="badge bg-danger"><?= $absent ?></span></td>
                            <td><span class="badge bg-warning"><?= $halfDay ?></span></td>
                            <td><span class="badge bg-info"><?= $holiday ?></span></td>
                            <td>
                                <span class="badge bg-<?= $attendancePercentage >= 75 ? 'success' : ($attendancePercentage >= 50 ? 'warning' : 'danger') ?>">
                                    <?= number_format($attendancePercentage, 1) ?>%
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?= $this->endSection() ?>