<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<style>
    tr.att-before-join, .card.att-before-join { display: none !important; }
</style>

<div class="row">
    <div class="col-12">
        <!-- Date selector: only previous and current date allowed; default = today -->
        <div class="card mb-3">
            <div class="card-body py-3">
                <div class="d-flex flex-wrap align-items-center justify-content-center w-100 gap-2">
                    <label class="text-muted mb-0 me-1">Date:</label>
                    <div class="d-flex align-items-center bg-light rounded border">
                        <button type="button" class="btn btn-outline-secondary border-0 rounded-start px-3 py-2" id="datePrev" title="Previous day">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <input type="date" id="attendanceDate" class="form-control border-0 bg-transparent text-center py-2" style="min-width: 150px; max-width: 180px;" value="<?= $today ?>" max="<?= $maxDate ?>" title="Click to open calendar">
                        <button type="button" class="btn btn-outline-secondary border-0 rounded-end px-3 py-2" id="dateNext" title="Next day">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Weekend info when Tuesday selected -->
        <div class="alert alert-info d-none mb-3" id="weekendInfoAlert">
            <i class="fas fa-umbrella-beach me-2"></i>
            <strong>Tuesday is Weekend.</strong> You can still mark attendance if needed (e.g. for overtime or special cases).
        </div>

        <!-- Before join date info -->
        <div class="alert alert-info d-none mb-3" id="beforeJoinAlert">
            <i class="fas fa-calendar-check me-2"></i>
            <strong>Employees are shown from their join date.</strong> Employees who have not joined yet for the selected date are hidden from the list.
        </div>

        <!-- Payroll locked message -->
        <div class="alert alert-warning d-none mb-3" id="payrollLockedAlert">
            <i class="fas fa-lock me-2"></i>
            <strong>Attendance locked.</strong> Payroll for this month has been generated for some employees. Locked employees cannot be edited. Employees removed from payroll can still be updated.
        </div>

        <div class="card">
            <div class="card-header d-flex flex-wrap align-items-center gap-2">
                <h4 class="mb-0">Daily Attendance</h4>
                <span class="text-muted" id="dateLabel"><?= date('l, F j, Y', strtotime($today)) ?></span>
                <span class="badge bg-info d-none" id="weekendBadge"><i class="fas fa-umbrella-beach me-1"></i> Weekend (Tuesday)</span>
            </div>
            <div class="card-body" id="attendanceCardBody">
                <!-- Select all attendance -->
                <div class="d-flex flex-wrap gap-2 mb-3 p-2 bg-light rounded">
                    <span class="align-self-center text-muted small me-1">Mark all for this date:</span>
                    <button type="button" class="btn btn-sm btn-success" id="markAllPresent" title="Mark all as Present">
                        <i class="fas fa-user-check"></i> All Present
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" id="markAllAbsent" title="Mark all as Absent">
                        <i class="fas fa-user-times"></i> All Absent
                    </button>
                    <button type="button" class="btn btn-sm btn-warning text-dark" id="markAllHalfDay" title="Mark all as Half Day">
                        <i class="fas fa-user-clock"></i> All Half Day
                    </button>
                    <button type="button" class="btn btn-sm btn-info" id="markAllHoliday" title="Mark all as Holiday">
                        <i class="fas fa-umbrella-beach"></i> All Holiday
                    </button>
                </div>
                <!-- Empty state when no employees for date -->
                <div class="alert alert-secondary d-none mb-3" id="noEmployeesAlert">
                    <i class="fas fa-info-circle me-2"></i>
                    No employees have joined yet for the selected date. Change the date to see employees.
                </div>
                <!-- Desktop Table -->
                <div class="table-responsive d-none d-md-block">
                    <table class="table table-striped mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th>Employee</th>
                                <th>Mobile</th>
                                <th>Today's Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($employees as $employee): ?>
                                <tr data-employee-id="<?= $employee['id'] ?>" data-join-date="<?= esc($employee['join_date'] ?? '') ?>">
                                    <td><?= esc($employee['name']) ?></td>
                                    <td><?= !empty(trim((string)($employee['mobile'] ?? ''))) ? esc($employee['mobile']) : '—' ?></td>
                                    <td id="status-<?= $employee['id'] ?>">
                                        <span class="badge bg-secondary">Not Marked</span>
                                    </td>
                                    <td>
                                        <div class="btn-group btn-group-sm flex-wrap" role="group">
                                            <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="present-<?= $employee['id'] ?>" autocomplete="off" value="present">
                                            <label class="btn btn-outline-success" for="present-<?= $employee['id'] ?>">Present</label>
                                            <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="absent-<?= $employee['id'] ?>" autocomplete="off" value="absent">
                                            <label class="btn btn-outline-danger" for="absent-<?= $employee['id'] ?>">Absent</label>
                                            <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="half-day-<?= $employee['id'] ?>" autocomplete="off" value="half_day">
                                            <label class="btn btn-outline-warning" for="half-day-<?= $employee['id'] ?>">Half Day</label>
                                            <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="holiday-<?= $employee['id'] ?>" autocomplete="off" value="holiday">
                                            <label class="btn btn-outline-info" for="holiday-<?= $employee['id'] ?>">Holiday</label>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Card View -->
                <div class="d-md-none">
                    <?php foreach ($employees as $employee): ?>
                        <div class="card mb-3 shadow-sm" data-employee-id="<?= $employee['id'] ?>" data-join-date="<?= esc($employee['join_date'] ?? '') ?>">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h5 class="mb-1"><?= esc($employee['name']) ?></h5>
                                        <small class="text-muted"><?= !empty(trim((string)($employee['mobile'] ?? ''))) ? esc($employee['mobile']) : '—' ?></small>
                                    </div>
                                    <span id="status-mob-<?= $employee['id'] ?>">
                                        <span class="badge bg-secondary">Not Marked</span>
                                    </span>
                                </div>
                                <div class="btn-group btn-group-sm w-100 flex-wrap" role="group">
                                    <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="present-mob-<?= $employee['id'] ?>" autocomplete="off" value="present">
                                    <label class="btn btn-outline-success" for="present-mob-<?= $employee['id'] ?>">Present</label>
                                    <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="absent-mob-<?= $employee['id'] ?>" autocomplete="off" value="absent">
                                    <label class="btn btn-outline-danger" for="absent-mob-<?= $employee['id'] ?>">Absent</label>
                                    <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="half-day-mob-<?= $employee['id'] ?>" autocomplete="off" value="half_day">
                                    <label class="btn btn-outline-warning" for="half-day-mob-<?= $employee['id'] ?>">Half</label>
                                    <input type="radio" class="btn-check attendance-radio" name="status-<?= $employee['id'] ?>" id="holiday-mob-<?= $employee['id'] ?>" autocomplete="off" value="holiday">
                                    <label class="btn btn-outline-info" for="holiday-mob-<?= $employee['id'] ?>">Holiday</label>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <div class="mt-3">
                    <a href="<?= base_url('attendance/report') ?>" class="btn btn-secondary">
                        <i class="fas fa-chart-bar"></i> View Report
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    $(document).ready(function() {
        const todayStr = '<?= $today ?>';
        const API_MARK = '<?= base_url('attendance/mark') ?>';
        const API_GET = '<?= base_url('attendance/get-attendance') ?>';
        const API_PAYROLL_LOCK = '<?= base_url('attendance/check-payroll-lock') ?>';

        const $dateInput = $('#attendanceDate');
        const $dateLabel = $('#dateLabel');
        const $datePrev = $('#datePrev');
        const $dateNext = $('#dateNext');
        const $lockAlert = $('#payrollLockedAlert');

        function getSelectedDate() {
            return $dateInput.val() || todayStr;
        }

        function formatDateLabel(ymd) {
            const d = new Date(ymd + 'T12:00:00');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return d.toLocaleDateString('en-US', options);
        }

        function setDateInput(val) {
            $dateInput.val(val);
            $dateLabel.text(formatDateLabel(val));
            var max = $dateInput.attr('max');
            $dateNext.prop('disabled', val >= max);
            var d = new Date(val + 'T12:00:00');
            if (d.getDay() === 2) {
                $('#weekendBadge').removeClass('d-none');
                $('#weekendInfoAlert').removeClass('d-none');
            } else {
                $('#weekendBadge').addClass('d-none');
                $('#weekendInfoAlert').addClass('d-none');
            }
        }

        function refreshForDate(dateStr) {
            setDateInput(dateStr);
            resetAllBadges();
            loadAttendanceData(dateStr);
            checkPayrollLockAndToggle(dateStr);
        }

        function resetAllBadges() {
            <?php foreach ($employees as $employee): ?>
            $('#status-<?= $employee['id'] ?>').html('<span class="badge bg-secondary">Not Marked</span>');
            $('#status-mob-<?= $employee['id'] ?>').html('<span class="badge bg-secondary">Not Marked</span>');
            $('input[name="status-<?= $employee['id'] ?>"]').prop('checked', false);
            <?php endforeach; ?>
        }

        const employeeIds = [<?= implode(',', array_column($employees, 'id')) ?>];
        const employeeJoinDates = <?= json_encode(array_column($employees, 'join_date', 'id')) ?>;
        function isBeforeJoinDate(empId, dateStr) {
            var jd = employeeJoinDates[empId] || employeeJoinDates[String(empId)];
            return jd && dateStr && dateStr < jd;
        }
        function filterEmployeesByJoinDate(dateStr) {
            var anyHidden = false;
            var visibleCount = 0;
            employeeIds.forEach(function(empId) {
                var beforeJoin = isBeforeJoinDate(empId, dateStr);
                if (beforeJoin) anyHidden = true;
                else visibleCount++;
                var row = $('tr[data-employee-id="' + empId + '"]');
                var card = $('.card[data-employee-id="' + empId + '"]');
                row.toggleClass('att-before-join', beforeJoin);
                card.toggleClass('att-before-join', beforeJoin);
                $('input[name="status-' + empId + '"]').prop('disabled', beforeJoin);
            });
            if (anyHidden) $('#beforeJoinAlert').removeClass('d-none');
            else $('#beforeJoinAlert').addClass('d-none');
            $('#noEmployeesAlert').toggleClass('d-none', visibleCount > 0);
        }
        function checkPayrollLockAndToggle(dateStr) {
            filterEmployeesByJoinDate(dateStr);
            var parts = dateStr.split('-');
            var year = parts[0], month = parseInt(parts[1], 10);
            var visibleIds = employeeIds.filter(function(id) { return !isBeforeJoinDate(id, dateStr); });
            $.get(API_PAYROLL_LOCK, { month: month, year: year, employee_ids: visibleIds.join(',') }, function(res) {
                var locks = res.locks || {};
                var anyLocked = false;
                visibleIds.forEach(function(empId) {
                    var payrollLocked = locks[String(empId)] === true;
                    if (payrollLocked) anyLocked = true;
                    $('input[name="status-' + empId + '"]').prop('disabled', payrollLocked);
                    $('label[for="present-' + empId + '"], label[for="absent-' + empId + '"], label[for="half-day-' + empId + '"], label[for="holiday-' + empId + '"]').toggleClass('disabled', payrollLocked);
                    $('label[for="present-mob-' + empId + '"], label[for="absent-mob-' + empId + '"], label[for="half-day-mob-' + empId + '"], label[for="holiday-mob-' + empId + '"]').toggleClass('disabled', payrollLocked);
                });
                if (anyLocked) $lockAlert.removeClass('d-none');
                else $lockAlert.addClass('d-none');
            });
        }

        // Left arrow: previous day (any past date allowed)
        $datePrev.on('click', function() {
            var d = new Date(getSelectedDate() + 'T12:00:00');
            d.setDate(d.getDate() - 1);
            var nextStr = d.toISOString().slice(0, 10);
            if (nextStr <= todayStr) refreshForDate(nextStr);
        });

        // Right arrow: next day only up to today
        $dateNext.on('click', function() {
            var current = getSelectedDate();
            if (current >= todayStr) return;
            var d = new Date(current + 'T12:00:00');
            d.setDate(d.getDate() + 1);
            var nextStr = d.toISOString().slice(0, 10);
            if (nextStr <= todayStr) refreshForDate(nextStr);
        });

        $dateInput.on('change', function() {
            var val = $(this).val();
            if (!val || val > todayStr) {
                $(this).val(todayStr);
                val = todayStr;
            }
            refreshForDate(val);
        });

        // Initial: disable next if already today
        setDateInput(getSelectedDate());

        loadAttendanceData(getSelectedDate());
        checkPayrollLockAndToggle(getSelectedDate());

        // On status change: save attendance (use current selected date)
        $('.attendance-radio').on('change', function() {
            if ($(this).prop('disabled')) return;
            const name = $(this).attr('name');
            const employeeId = name.split('-')[1];
            const status = $(this).val();
            const dateStr = getSelectedDate();

            if (isBeforeJoinDate(employeeId, dateStr)) {
                $('input[name="status-' + employeeId + '"]').prop('checked', false);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Attendance cannot be marked before employee join date.' });
                return;
            }

            const postData = {
                csrf_test_name: $('meta[name="csrf-token"]').attr('content'),
                employee_id: employeeId,
                date: dateStr,
                status: status
            };

            $.ajax({
                url: API_MARK,
                type: 'POST',
                data: postData,
                dataType: 'json',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                success: function(response) {
                    if (response.success) {
                        updateStatusBadge(employeeId, status);
                        Swal.fire({
                            icon: 'success',
                            title: 'Saved',
                            text: response.message,
                            timer: 1200,
                            showConfirmButton: false
                        });
                    } else {
                        $('input[name="status-' + employeeId + '"]').prop('checked', false);
                        loadAttendanceForEmployee(employeeId, dateStr);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: response.message || 'Failed to save attendance.'
                        });
                    }
                },
                error: function(xhr) {
                    $('input[name="status-' + employeeId + '"]').prop('checked', false);
                    loadAttendanceForEmployee(employeeId, dateStr);
                    var msg = 'Failed to save attendance.';
                    try {
                        if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                    } catch (e) {}
                    Swal.fire({ icon: 'error', title: 'Error', text: msg });
                }
            });
        });

        function statusToInputId(status) { return (status || '').replace('_', '-'); }
        function loadAttendanceForEmployee(empId, dateStr) {
            $.ajax({
                url: API_GET,
                type: 'GET',
                data: { employee_id: empId, date: dateStr },
                dataType: 'json',
                success: function(response) {
                    $('input[name="status-' + empId + '"]').prop('checked', false);
                    if (response && response.status) {
                        var sid = statusToInputId(response.status);
                        $('#' + sid + '-' + empId).prop('checked', true);
                        $('#' + sid + '-mob-' + empId).prop('checked', true);
                        updateStatusBadge(empId, response.status);
                    } else {
                        $('#status-' + empId).html('<span class="badge bg-secondary">Not Marked</span>');
                        $('#status-mob-' + empId).html('<span class="badge bg-secondary">Not Marked</span>');
                    }
                }
            });
        }
        function loadAttendanceData(dateStr) {
            <?php foreach ($employees as $employee): ?>
            (function(empId) {
                $.ajax({
                    url: API_GET,
                    type: 'GET',
                    data: { employee_id: empId, date: dateStr },
                    dataType: 'json',
                    success: function(response) {
                        $('input[name="status-' + empId + '"]').prop('checked', false);
                        if (response && response.status) {
                            var sid = statusToInputId(response.status);
                            $('#' + sid + '-' + empId).prop('checked', true);
                            $('#' + sid + '-mob-' + empId).prop('checked', true);
                            updateStatusBadge(empId, response.status);
                        } else {
                            $('#status-' + empId).html('<span class="badge bg-secondary">Not Marked</span>');
                            $('#status-mob-' + empId).html('<span class="badge bg-secondary">Not Marked</span>');
                        }
                    }
                });
            })(<?= $employee['id'] ?>);
            <?php endforeach; ?>
        }

        function updateStatusBadge(employeeId, status) {
            const badgeClasses = {
                'present': 'bg-success',
                'absent': 'bg-danger',
                'half_day': 'bg-warning',
                'holiday': 'bg-info'
            };
            const statusText = {
                'present': 'Present',
                'absent': 'Absent',
                'half_day': 'Half Day',
                'holiday': 'Holiday'
            };
            const badge = '<span class="badge ' + (badgeClasses[status] || 'bg-secondary') + '">' + (statusText[status] || status) + '</span>';
            $('#status-' + employeeId).html(badge);
            $('#status-mob-' + employeeId).html(badge);
        }

        // Mark all employees with one status (only unlocked + join date ok)
        function markAllWithStatus(status) {
            const dateStr = getSelectedDate();
            var unlockedIds = employeeIds.filter(function(id) {
                if ($('input[name="status-' + id + '"]').first().prop('disabled')) return false;
                if (isBeforeJoinDate(id, dateStr)) return false;
                return true;
            });
            if (unlockedIds.length === 0) {
                Swal.fire({ icon: 'warning', title: 'Cannot mark', text: 'No employees eligible. Either all are locked for payroll or selected date is before their join date.' });
                return;
            }
            let done = 0, failed = 0;
            const total = unlockedIds.length;
            Swal.fire({ title: 'Marking all...', text: '0 / ' + total, allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            function runNext(index) {
                if (index >= total) {
                    Swal.fire({ icon: 'success', title: 'Done', text: done + ' marked. ' + (failed ? failed + ' failed.' : '') });
                    return;
                }
                const empId = unlockedIds[index];
                $.ajax({
                    url: API_MARK,
                    type: 'POST',
                    data: {
                        csrf_test_name: $('meta[name="csrf-token"]').attr('content'),
                        employee_id: empId,
                        date: dateStr,
                        status: status
                    },
                    dataType: 'json',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    },
                    success: function(r) {
                        if (r && r.success) {
                            done++;
                            $('input[name="status-' + empId + '"][value="' + status + '"]').prop('checked', true);
                            updateStatusBadge(empId, status);
                        } else { failed++; }
                    },
                    error: function() { failed++; },
                    complete: function() {
                        try {
                            var el = Swal.getHtmlContainer && Swal.getHtmlContainer();
                            if (el) {
                                var target = (el[0] ? el[0] : el);
                                var p = target.querySelector ? target.querySelector('p') : null;
                                (p || target).textContent = done + ' / ' + total;
                            }
                        } catch (e) {}
                        runNext(index + 1);
                    }
                });
            }
            runNext(0);
        }
        $('#markAllPresent').on('click', function() { markAllWithStatus('present'); });
        $('#markAllAbsent').on('click', function() { markAllWithStatus('absent'); });
        $('#markAllHalfDay').on('click', function() { markAllWithStatus('half_day'); });
        $('#markAllHoliday').on('click', function() { markAllWithStatus('holiday'); });
    });
</script>
<?= $this->endSection() ?>
