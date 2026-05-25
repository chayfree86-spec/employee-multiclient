<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<style>
    .report-filter-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: none;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        border-radius: 15px;
        margin-bottom: 2rem;
    }
    .attendance-table {
        border-collapse: separate;
        border-spacing: 0 0.5rem;
    }
    .attendance-table tr:not(.att-calendar-row) {
        background-color: #fff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        transition: transform 0.2s;
    }
    .attendance-table tr:not(.att-calendar-row):hover {
        transform: scale(1.01);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .attendance-table td {
        padding: 1rem 0.75rem;
        vertical-align: middle;
        border: none !important;
    }
    .attendance-table thead th {
        background-color: transparent !important;
        color: #64748b !important;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 1px;
        border: none !important;
        padding-bottom: 1rem;
    }
    .badge-premium {
        padding: 0.5rem 1rem;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .not-marked-cell {
        background-color: #f1f5f9;
        border-radius: 10px;
    }
    .att-row-toggle { cursor: pointer; }
    .att-row-toggle .chevron { transition: transform 0.2s; }
    .att-row-toggle.expanded .chevron { transform: rotate(180deg); }
    .att-calendar-row td { padding: 1rem !important; background: #f8fafc !important; border-top: none !important; vertical-align: top !important; }
    .att-calendar-wrap { max-width: 100%; width: 100%; }
    .att-calendar-wrap .att-cal { display: flex; flex-wrap: nowrap; gap: 2px; width: 100%; }
    .att-calendar-wrap .att-cal-cell { flex: 1 1 0; min-width: 0; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 0.65rem; font-weight: 500; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
    .att-calendar-wrap .att-cal-cell:hover { transform: scale(1.05); box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .att-calendar-wrap .att-cal-cell.att-future { cursor: not-allowed; opacity: 0.6; }
    .att-calendar-wrap .att-cal-cell.att-before-join { opacity: 0.5; cursor: not-allowed; background: #d1d5db !important; color: #9ca3af !important; }
    .att-calendar-wrap .att-cal-cell.att-future:hover { transform: none; }
    .att-calendar-wrap .att-cal-legend { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem; font-size: 0.75rem; color: #64748b; }
    .att-expanded-stats { display: flex; flex-wrap: wrap; gap: 1rem 1.5rem; margin-bottom: 1rem; padding: 0.75rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 0.85rem; }
    .att-expanded-stats span { display: inline-flex; align-items: center; gap: 0.35rem; }
    .att-main-base, .att-main-payable, .att-main-advance, .att-main-overtime, .att-main-fine { font-size: 0.8rem; white-space: nowrap; }
</style>

<div class="card report-filter-card">
    <div class="card-body p-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div>
                <h4 class="mb-0 text-primary fw-bold">
                    <i class="fas fa-chart-line me-2"></i> Attendance Overview
                </h4>
                <small class="text-muted d-block"><i class="fas fa-umbrella-beach me-1"></i> Tuesday = Weekend (weekly off). Absent includes Tuesday when Mon or Wed is absent, or when there are 2+ absents in the month.</small>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                <form method="get" class="d-flex gap-2">
                    <select name="month" class="form-select form-select-sm" style="min-width: 120px;">
                        <?php for ($m = 1; $m <= 12; $m++): ?>
                            <option value="<?= $m ?>" <?= $m == $month ? 'selected' : '' ?>>
                                <?= date('F', mktime(0, 0, 0, $m, 1)) ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                    <select name="year" class="form-select form-select-sm" style="min-width: 100px;">
                        <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                            <option value="<?= $y ?>" <?= $y == $year ? 'selected' : '' ?>>
                                <?= $y ?>
                            </option>
                        <?php endfor; ?>
                    </select>
                    <button type="submit" class="btn btn-primary btn-sm px-3">
                        <i class="fas fa-filter me-1"></i> Filter
                    </button>
                </form>
                <div class="vr mx-2 d-none d-md-block"></div>
                <a href="?month=<?= $month ?>&year=<?= $year ?>&export=pdf" class="btn btn-outline-danger btn-sm px-3">
                    <i class="fas fa-file-pdf me-1"></i> PDF
                </a>
                <button type="button" class="btn btn-outline-success btn-sm px-3" onclick="smartShare('<?= base_url('report/attendance?month=' . $month . '&year=' . $year . '&export=pdf') ?>', 'Attendance_Report_<?= $month ?>_<?= $year ?>.pdf', 'Attendance Report for <?= date('F Y', mktime(0, 0, 0, $month, 1, $year)) ?>')">
                    <i class="fab fa-whatsapp me-1"></i> Share
                </button>
            </div>
        </div>
    </div>
</div>

<div class="table-responsive">
    <table class="table attendance-table">
        <thead>
            <tr>
                <th>Employee Details</th>
                <th class="text-center">Weekend</th>
                <th class="text-center text-success">Present</th>
                <th class="text-center text-danger">Absent</th>
                <th class="text-center text-warning">Half Day</th>
                <th class="text-center text-secondary">Holiday</th>
                <th class="text-center">Not Marked</th>
                <th class="text-center">Score</th>
                <th class="text-center">Base Salary</th>
                <th class="text-center">Payable</th>
                <th class="text-center">Advance Pending</th>
                <th class="text-center">Overtime</th>
                <th class="text-center">Fine</th>
            </tr>
        </thead>
        <tbody>
            <?php
            $today = date('Y-m-d');
            $attColors = ['present' => '#22c55e', 'half_day' => '#f59e0b', 'absent' => '#ef4444', 'holiday' => '#3b82f6', 'weekend' => '#000000', 'not_marked' => '#e5e7eb'];
            foreach ($reportData as $report):
                $p = 0; $a = 0; $hd = 0; $h = 0; $w = 0;
                foreach ($report['summary'] as $summary) {
                    switch ($summary['status']) {
                        case 'present': $p = $summary['count']; break;
                        case 'absent': $a = $summary['count']; break;
                        case 'half_day': $hd = $summary['count']; break;
                        case 'weekend': $w = $summary['count']; break;
                        case 'holiday': $h = $summary['count']; break;
                    }
                }
                $ws = $report['weekdayStatus'] ?? [];
                $weekendCount = $w > 0 ? (int)$w : (int)($ws['weekend_holiday_count'] ?? 0);
                $holidayExclWeekend = (int)$h;
                $marked = $p + $a + $hd + $h;
                $daysInMonth = (int)date('t', strtotime("$year-$month-01"));
                $notMarked = max(0, $daysInMonth - $marked);
                $pct = $marked > 0 ? (($p + ($hd * 0.5)) / $marked * 100) : 0;

                $attMap = [];
                foreach ($report['attendance'] ?? [] as $att) {
                    $d = is_string($att['date']) ? substr($att['date'], 0, 10) : date('Y-m-d', strtotime($att['date']));
                    $attMap[$d] = (($att['source'] ?? '') === 'weekend_rule') ? 'absent' : ($att['status'] ?? 'not_marked');
                }
                $monthPad = str_pad((string)$month, 2, '0', STR_PAD_LEFT);
                $sc = $report['salaryCalc'] ?? [];
                $baseSal = $sc['base_salary'] ?? 0;
                $joinDate = $report['employee']['join_date'] ?? null;
                $payableSal = $sc['payable_salary'] ?? 0;
                $advPending = $sc['advance_pending'] ?? 0;
                $otAmt = $sc['overtime'] ?? 0;
                $fineAmt = $sc['fine'] ?? 0;
                $fmt = function($n) { return '₹' . number_format((float)$n, 0); };
                ?>
                <tr class="att-row-toggle" data-row-id="att-row-<?= $report['employee']['id'] ?>">
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="chevron me-2 text-muted small"><i class="fas fa-chevron-down"></i></span>
                            <div class="avatar-sm me-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="fas fa-user text-primary"></i>
                            </div>
                            <div>
                                <div class="fw-bold text-dark"><?= esc($report['employee']['name']) ?></div>
                                <div class="small text-muted"><?= !empty(trim((string)($report['employee']['mobile'] ?? ''))) ? esc($report['employee']['mobile']) : '—' ?></div>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="fw-bold att-weekend-count" style="color:#000"><?= $weekendCount ?></span>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-success-subtle text-success badge-premium"><?= $p ?></span>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-danger-subtle text-danger badge-premium"><?= $a ?></span>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-warning-subtle text-warning badge-premium"><?= $hd ?></span>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-secondary-subtle text-secondary badge-premium"><?= $holidayExclWeekend ?></span>
                    </td>
                    <td class="text-center">
                        <div class="not-marked-cell py-2 fw-bold text-secondary">
                            <?= $notMarked ?>
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="fw-bold <?= $pct >= 75 ? 'text-success' : ($pct >= 50 ? 'text-warning' : 'text-danger') ?>">
                            <?= number_format($pct, 1) ?>%
                        </div>
                        <div class="progress mt-1" style="height: 4px; width: 60px; margin: 0 auto;">
                            <div class="progress-bar <?= $pct >= 75 ? 'bg-success' : ($pct >= 50 ? 'bg-warning' : 'bg-danger') ?>" role="progressbar" style="width: <?= $pct ?>%"></div>
                        </div>
                    </td>
                    <td class="text-center att-main-base"><?= $fmt($baseSal) ?></td>
                    <td class="text-center att-main-payable text-success fw-bold"><?= $fmt($payableSal) ?></td>
                    <td class="text-center att-main-advance"><?= $fmt($advPending) ?></td>
                    <td class="text-center att-main-overtime text-success"><?= $fmt($otAmt) ?></td>
                    <td class="text-center att-main-fine text-danger"><?= $fmt($fineAmt) ?></td>
                </tr>
                <tr class="att-calendar-row d-none" id="att-row-<?= $report['employee']['id'] ?>" data-employee-id="<?= $report['employee']['id'] ?>" data-month="<?= $month ?>" data-year="<?= $year ?>" data-join-date="<?= esc($joinDate ?? '') ?>" data-locked="0" data-base-salary="<?= $baseSal ?>" data-advance-pending="<?= $advPending ?>" data-overtime="<?= $otAmt ?>" data-fine="<?= $fineAmt ?>">
                    <td colspan="13">
                        <div class="att-calendar-wrap">
                            <div class="att-cal">
                                <?php for ($d = 1; $d <= $daysInMonth; $d++):
                                    $ymd = "$year-$monthPad-" . str_pad((string)$d, 2, '0', STR_PAD_LEFT);
                                    $status = $attMap[$ymd] ?? 'not_marked';
                                    $bg = $attColors[$status] ?? $attColors['not_marked'];
                                    $textColor = ($status === 'not_marked') ? '#374151' : '#fff';
                                    $isFuture = $ymd > $today;
                                    $isBeforeJoin = $joinDate && $ymd < $joinDate;
                                    $cellClass = 'att-cal-cell' . ($isFuture ? ' att-future' : '') . ($isBeforeJoin ? ' att-before-join' : '');
                                ?>
                                    <div class="<?= $cellClass ?>" data-date="<?= $ymd ?>" data-status="<?= $status ?>" data-future="<?= $isFuture ? '1' : '0' ?>" data-before-join="<?= $isBeforeJoin ? '1' : '0' ?>" style="background:<?= $bg ?>;color:<?= $textColor ?>;flex-direction:column;line-height:1.1;">
                                        <span><?= $d ?></span>
                                        <span style="font-size: 0.5rem; font-weight: normal;"><?= date('D', strtotime($ymd)) ?></span>
                                    </div>
                                <?php endfor; ?>
                            </div>
                            <div class="att-cal-legend">
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#22c55e"></span> Present</span>
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#f59e0b"></span> Half Day</span>
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#ef4444"></span> Absent</span>
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#000000"></span> Weekend (Tue)</span>
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#3b82f6"></span> Holiday</span>
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#e5e7eb"></span> Not Marked</span>
                                <span><span class="d-inline-block rounded me-1" style="width:10px;height:10px;background:#d1d5db"></span> Before Join</span>
                            </div>
                        </div>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var csrf = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    var markUrl = '<?= base_url('attendance/mark') ?>';
    var lockUrl = '<?= base_url('attendance/check-payroll-lock') ?>';
    var monthlyUrl = '<?= base_url('attendance/get-monthly/') ?>';
    var salaryCalcUrl = '<?= base_url('report/salary-calc/') ?>';
    var attColors = { present: '#22c55e', half_day: '#f59e0b', absent: '#ef4444', holiday: '#3b82f6', weekend: '#000000', not_marked: '#e5e7eb' };
    var today = '<?= date('Y-m-d') ?>';

    function fmtRs(n) { return '₹' + Math.round(parseFloat(n) || 0).toLocaleString('en-IN'); }

    function updateRowFromAttendance(calRow, res) {
        var attMap = {};
        (res.attendance || []).forEach(function(a) {
            var raw = (a.date || '').toString();
            var d = raw.substring(0, 10);
            if (d && d.length === 10) {
                attMap[d] = (a.source === 'weekend_rule') ? 'absent' : (a.status || 'not_marked');
            }
        });
        var summary = {};
        (res.summary || []).forEach(function(s) {
            summary[s.status] = parseInt(s.count || 0, 10);
        });
        var p = summary.present || 0, a = summary.absent || 0, hd = summary.half_day || 0, w = summary.weekend || 0, h = summary.holiday || 0;
        var marked = p + a + hd + w + h;
        var daysInMonth = calRow.querySelectorAll('.att-cal-cell').length;
        var notMarked = Math.max(0, daysInMonth - marked);
        var pct = marked > 0 ? ((p + (hd * 0.5)) / marked) * 100 : 0;

        var joinDateStr = calRow.dataset.joinDate || '';
        calRow.querySelectorAll('.att-cal-cell').forEach(function(cell) {
            var dateStr = cell.dataset.date;
            if (!dateStr) return;
            var status = attMap[dateStr] || 'not_marked';
            var isFuture = dateStr > today;
            var isBeforeJoin = joinDateStr && dateStr < joinDateStr;
            var bg = attColors[status] || attColors.not_marked;
            var textColor = (status === 'not_marked') ? '#374151' : '#fff';
            cell.style.background = bg;
            cell.style.color = textColor;
            cell.dataset.status = status;
            cell.classList.toggle('att-future', isFuture);
            cell.classList.toggle('att-before-join', isBeforeJoin);
        });

        var mainRow = calRow.previousElementSibling;
        if (!mainRow || !mainRow.classList.contains('att-row-toggle')) return;
        var cells = mainRow.cells;
        if (cells[1]) { var wEl = cells[1].querySelector('.att-weekend-count'); if (wEl) wEl.textContent = w; }
        if (cells[2]) cells[2].querySelector('.badge') && (cells[2].querySelector('.badge').textContent = p);
        if (cells[3]) cells[3].querySelector('.badge') && (cells[3].querySelector('.badge').textContent = a);
        if (cells[4]) cells[4].querySelector('.badge') && (cells[4].querySelector('.badge').textContent = hd);
        if (cells[5]) cells[5].querySelector('.badge') && (cells[5].querySelector('.badge').textContent = h);
        if (cells[6]) cells[6].querySelector('.not-marked-cell') && (cells[6].querySelector('.not-marked-cell').textContent = notMarked);
        if (cells[7]) {
            var pctEl = cells[7].querySelector('.fw-bold');
            var barEl = cells[7].querySelector('.progress-bar');
            if (pctEl) {
                pctEl.textContent = pct.toFixed(1) + '%';
                pctEl.className = 'fw-bold ' + (pct >= 75 ? 'text-success' : (pct >= 50 ? 'text-warning' : 'text-danger'));
            }
            if (barEl) {
                barEl.style.width = pct + '%';
                barEl.className = 'progress-bar ' + (pct >= 75 ? 'bg-success' : (pct >= 50 ? 'bg-warning' : 'bg-danger'));
            }
        }

        var expStats = calRow.querySelector('.att-expanded-stats');
        if (expStats) {
            var es = expStats;
            if (es.querySelector('.att-stat-weekend')) es.querySelector('.att-stat-weekend').textContent = w;
            if (es.querySelector('.att-stat-present')) es.querySelector('.att-stat-present').textContent = p;
            if (es.querySelector('.att-stat-absent')) es.querySelector('.att-stat-absent').textContent = a;
            if (es.querySelector('.att-stat-halfday')) es.querySelector('.att-stat-halfday').textContent = hd;
            if (es.querySelector('.att-stat-holiday')) es.querySelector('.att-stat-holiday').textContent = h;
            if (es.querySelector('.att-stat-notmarked')) es.querySelector('.att-stat-notmarked').textContent = notMarked;
            var scoreEl = es.querySelector('.att-stat-score');
            if (scoreEl) { scoreEl.textContent = pct.toFixed(1) + '%'; scoreEl.className = 'att-stat-score fw-bold ' + (pct >= 75 ? 'text-success' : (pct >= 50 ? 'text-warning' : 'text-danger')); }
        }

        var mainPayable = mainRow.querySelector('.att-main-payable');
        var empId = calRow.dataset.employeeId;
        var month = calRow.dataset.month;
        var year = calRow.dataset.year;
        if (empId && month && year) {
            fetch(salaryCalcUrl + empId + '/' + month + '/' + year)
                .then(function(r) { return r.json(); })
                .then(function(sc) {
                    var pay = parseFloat(sc.payable_salary || 0);
                    if (mainPayable) mainPayable.textContent = fmtRs(pay);
                    var expPayable = calRow.querySelector('.att-exp-payable');
                    if (expPayable) expPayable.textContent = fmtRs(pay);
                }).catch(function() {});
        }
    }

    document.querySelectorAll('.att-row-toggle').forEach(function(row) {
        row.addEventListener('click', function(e) {
            if (e.target.closest('.att-cal-cell')) return;
            var id = this.getAttribute('data-row-id');
            var calRow = document.getElementById(id);
            if (!calRow) return;
            var isExpanding = calRow.classList.contains('d-none');
            calRow.classList.toggle('d-none');
            this.classList.toggle('expanded');
            if (isExpanding && calRow.dataset.locked === '0') {
                fetch(lockUrl + '?month=' + calRow.dataset.month + '&year=' + calRow.dataset.year + '&employee_ids=' + calRow.dataset.employeeId)
                    .then(function(r) { return r.json(); })
                    .then(function(res) {
                        calRow.dataset.locked = (res.locks && res.locks[calRow.dataset.employeeId]) ? '1' : '0';
                    });
            }
        });
    });

    document.addEventListener('click', function(e) {
        var cell = e.target.closest('.att-calendar-wrap .att-cal-cell:not(.att-future):not(.att-before-join)');
        if (!cell) return;
        var row = cell.closest('.att-calendar-row');
        if (!row || row.classList.contains('d-none')) return;
        var empId = row.dataset.employeeId;
        var dateStr = cell.dataset.date;
        if (dateStr > today) {
            if (typeof Swal !== 'undefined') Swal.fire({ icon: 'info', title: 'Future Date', text: 'Attendance can only be marked for today or past dates.' });
            return;
        }
        var joinDateStr = row.dataset.joinDate || '';
        if (joinDateStr && dateStr < joinDateStr) {
            if (typeof Swal !== 'undefined') Swal.fire({ icon: 'info', title: 'Before Join Date', text: 'Attendance cannot be marked for dates before employee join date.' });
            return;
        }
        if (row.dataset.locked === '1') {
            if (typeof Swal !== 'undefined') Swal.fire({ icon: 'warning', title: 'Locked', text: 'Payroll for this month is generated. Attendance cannot be updated.' });
            return;
        }
        var dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        var isTuesday = new Date(dateStr + 'T12:00:00').getDay() === 2;
        var tuesdayHint = isTuesday ? '<p class="small text-info mb-2"><i class="fas fa-umbrella-beach me-1"></i> Tuesday = Weekend. You can still mark attendance if needed.</p>' : '';
        if (typeof Swal === 'undefined') return;
        Swal.fire({
            title: 'Submit Attendance',
            html: '<p class="text-muted mb-3">' + dateLabel + '</p>' + tuesdayHint + '<div class="d-grid gap-2"><button type="button" class="btn btn-success btn-att-submit" data-status="present"><i class="fas fa-user-check me-2"></i> Present</button><button type="button" class="btn btn-danger btn-att-submit" data-status="absent"><i class="fas fa-user-times me-2"></i> Absent</button><button type="button" class="btn btn-warning text-dark btn-att-submit" data-status="half_day"><i class="fas fa-user-clock me-2"></i> Half Day</button><button type="button" class="btn btn-info btn-att-submit" data-status="holiday"><i class="fas fa-umbrella-beach me-2"></i> Holiday</button></div>',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            didOpen: function() {
                var el = Swal.getHtmlContainer();
                if (!el) return;
                el.querySelectorAll('.btn-att-submit').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var status = this.getAttribute('data-status');
                        fetch(markUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                            body: 'csrf_test_name=' + encodeURIComponent(csrf) + '&employee_id=' + empId + '&date=' + dateStr + '&status=' + status
                        }).then(function(r) { return r.json(); }).then(function(res) {
                            if (res.success) {
                                Swal.close();
                                if (typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Saved', text: res.message, timer: 1200, showConfirmButton: false });
                                fetch(monthlyUrl + empId + '/' + row.dataset.month + '/' + row.dataset.year)
                                    .then(function(r2) { return r2.json(); })
                                    .then(function(data) { updateRowFromAttendance(row, data); });
                            } else {
                                Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Could not save.' });
                            }
                        }).catch(function() {
                            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not save.' });
                        });
                    });
                });
            }
        });
    });

    document.addEventListener('click', function(e) {
        var cell = e.target.closest('.att-calendar-wrap .att-cal-cell.att-future');
        if (cell && typeof Swal !== 'undefined') Swal.fire({ icon: 'info', title: 'Future Date', text: 'Attendance can only be marked for today or past dates.' });
        var cellBefore = e.target.closest('.att-calendar-wrap .att-cal-cell.att-before-join');
        if (cellBefore && typeof Swal !== 'undefined') Swal.fire({ icon: 'info', title: 'Before Join Date', text: 'Attendance cannot be marked for dates before employee join date.' });
    });
});
</script>

<?= $this->endSection() ?>