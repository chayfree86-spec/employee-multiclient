const AttendanceManager = {
    currentDate: null,
    saveDebounceMs: 450,
    _saveTimer: null,
    _pendingSaveSnapshot: null,
    currentStaff: [],
    currentAttendanceData: {},
    currentAofRows: [],
    _lastChangedAttendance: null,

    normalizeStatus: (status) => {
        if (!status) return '';
        if (status === 'half_day' || status === 'halfday') return 'halfday';
        if (status === 'weekend' || status === 'holiday') return 'holiday';
        return status;
    },

    isWeeklyOffDate: (dateString) => {
        return false;
    },

    getDisplayAttendanceData: (staff, attendanceData) => {
        const data = { ...(attendanceData || {}) };

        if (Object.keys(data).length === 0 && AttendanceManager.isWeeklyOffDate(AttendanceManager.currentDate)) {
            staff
                .filter((s) => s.status === 'active')
                .forEach((s) => {
                    data[s.id] = 'holiday';
                });
        }

        return data;
    },

    getLatestSavedDate: () => {
        return null;
    },

    formatDateLocal: (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    parseLocalDate: (dateString) => {
        if (!dateString) return null;
        const [year, month, day] = String(dateString).split('-').map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    },

    isSameLocalDate: (firstDate, secondDate) => {
        if (!firstDate || !secondDate) return false;
        return AttendanceManager.formatDateLocal(firstDate) === AttendanceManager.formatDateLocal(secondDate);
    },

    updateDateSelectionState: (date) => {
        const dateBox = document.querySelector('.date-selection-box');
        if (!dateBox || !date) return;

        const today = new Date();

        dateBox.classList.toggle('has-selected-date', Boolean(date));
        dateBox.classList.toggle('is-today', AttendanceManager.isSameLocalDate(date, today));
    },

    decorateCalendarDay: (dayElem, dateObj, instance) => {
        const today = new Date();

        if (AttendanceManager.isSameLocalDate(dateObj, today)) {
            dayElem.classList.add('attendance-today');
        }
    },

    changeDateByDays: (days) => {
        const current = new Date(`${AttendanceManager.currentDate}T00:00:00`);
        current.setDate(current.getDate() + days);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (current > today) return;

        AttendanceManager.currentDate = AttendanceManager.formatDateLocal(current);
        const picker = document.getElementById('attendance-date')?._flatpickr;
        if (picker) {
            picker.setDate(AttendanceManager.currentDate, true);
            return;
        }

        AttendanceManager.loadAttendanceList();
        AttendanceManager.updateWeekdayDisplay(current);
    },

    hasAdvanceInCurrentViewMonth: (staffId) => {
        const currentDate = new Date(`${AttendanceManager.currentDate}T00:00:00`);
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        return (AttendanceManager.currentAofRows || []).some((entry) => {
            if (String(entry.employee_id) !== String(staffId)) return false;
            if (entry.type !== 'advance' || (Number(entry.amount) || 0) <= 0 || !entry.date) {
                return false;
            }

            const entryDate = new Date(`${entry.date}T00:00:00`);
            return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });
    },

    hasDeductionInCurrentViewMonth: (staffId) => {
        const currentDate = new Date(`${AttendanceManager.currentDate}T00:00:00`);
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        return (AttendanceManager.currentAofRows || []).some((entry) => {
            if (String(entry.employee_id) !== String(staffId)) return false;
            if (entry.type !== 'fine' || (Number(entry.amount) || 0) <= 0 || !entry.date) {
                return false;
            }

            const entryDate = new Date(`${entry.date}T00:00:00`);
            return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });
    },

    rowsToDayData: (rows) => {
        const dayData = {};
        (rows || []).forEach((row) => {
            dayData[String(row.employee_id)] = ApiSyncManager.statusFromApi(row.status);
        });
        return dayData;
    },

    getMonthlyStatusCounts: (rows) => {
        const counts = {};
        (rows || []).forEach((row) => {
            const staffId = String(row.employee_id || '');
            if (!staffId) return;
            const status = AttendanceManager.normalizeStatus(ApiSyncManager.statusFromApi(row.status));
            if (!status) return;
            if (!counts[staffId]) {
                counts[staffId] = { present: 0, absent: 0, halfday: 0, holiday: 0 };
            }
            if (status === 'present') counts[staffId].present++;
            else if (status === 'absent') counts[staffId].absent++;
            else if (status === 'halfday') counts[staffId].halfday++;
            else if (status === 'holiday') counts[staffId].holiday++;
        });
        return counts;
    },

    getStatusLabel: (label, count) => {
        return count > 0 ? `${label} <span class="attendance-status-count">[ ${count} ]</span>` : label;
    },

    formatSalaryAmountWithHold: (amount, holdSource = null) => {
        if (window.HoldSalaryUI?.amount) {
            return window.HoldSalaryUI.amount(amount, holdSource);
        }
        return `₹${Number(amount || 0).toLocaleString()}`;
    },

    renderAttendance: (container) => {
        container.innerHTML = `
            <div class="card">
                <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
                    <h3>Daily Attendance</h3>
                    <div class="date-selection-box" style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                        <button type="button" class="date-nav-btn" aria-label="Previous date" onclick="AttendanceManager.changeDateByDays(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="input-wrapper" style="min-width: 250px;">
                            <i class="fas fa-calendar-day" style="left: 1rem; color: var(--primary);"></i>
                            <input type="text" id="attendance-date" class="date-input" value="${AttendanceManager.currentDate}" 
                                style="width: 100%; padding: 0.8rem 1rem 0.8rem 3rem; border: 1px solid var(--border); border-radius: 12px; font-weight: 700; font-family: var(--app-font); cursor: pointer; background: var(--bg-main);">
                        </div>
                        <button type="button" class="date-nav-btn" aria-label="Next date" onclick="AttendanceManager.changeDateByDays(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div id="weekday-display" style="font-weight: 700; color: var(--text-muted); background: var(--bg-main); padding: 0.8rem 1.2rem; border-radius: 12px; font-size: 0.9rem; letter-spacing: 0.5px; border: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
                            <i class="far fa-clock"></i>
                            <span id="weekday-text"></span>
                        </div>
                    </div>
                    <div class="attendance-actions" style="display:flex; gap:1rem; width:100%;">
                        <button id="btn-mark-present" class="btn-primary" onclick="AttendanceManager.markAll('present')" style="background:rgba(0, 184, 148, 0.1); color:var(--success); border:1px solid rgba(0, 184, 148, 0.2); display:flex; align-items:center; justify-content:center; gap:8px; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.3s ease;">
                            <i class="fas fa-check-double"></i> Mark All Present
                        </button>
                        <button id="btn-mark-holiday" class="btn-primary" onclick="AttendanceManager.markAll('holiday')" style="background:rgba(10, 189, 227, 0.1); color:var(--info); border:1px solid rgba(10, 189, 227, 0.2); display:flex; align-items:center; justify-content:center; gap:8px; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.3s ease;">
                            <i class="fas fa-mug-hot"></i> Mark All Weekly Off
                        </button>
                        <button id="btn-mark-absent" class="btn-primary" onclick="AttendanceManager.markAll('absent')" style="background:rgba(214, 48, 49, 0.1); color:var(--danger); border:1px solid rgba(214, 48, 49, 0.2); display:flex; align-items:center; justify-content:center; gap:8px; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.3s ease;">
                            <i class="fas fa-user-times"></i> Mark All Absent
                        </button>
                    </div>
                </div>
                <div class="attendance-stats-header" id="attendance-stats-row">
                    <!-- Stats will be injected here -->
                </div>

                <div id="attendance-empty-note" style="display:none; margin:0 0 1rem; padding:0.9rem 1rem; border:1px solid rgba(245, 158, 11, 0.25); background:rgba(245, 158, 11, 0.08); color:#9a6700; border-radius:14px; font-weight:600;"></div>
                <div class="table-responsive">
                    <table id="attendance-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody id="attendance-list">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Initialize Flatpickr
        flatpickr("#attendance-date", {
            defaultDate: AttendanceManager.currentDate,
            maxDate: "today",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d M, D",
            monthSelectorType: "static",
            disableMobile: true,
            onDayCreate: (dObj, dStr, instance, dayElem) => {
                AttendanceManager.decorateCalendarDay(dayElem, dayElem.dateObj, instance);
            },
            onChange: (selectedDates, dateStr) => {
                AttendanceManager.currentDate = dateStr;
                AttendanceManager.loadAttendanceList();
                AttendanceManager.updateWeekdayDisplay(selectedDates[0]);
                AttendanceManager.updateDateSelectionState(selectedDates[0]);
            },
            onMonthChange: (selectedDates, dateStr, instance) => {
                instance.redraw();
            },
            onYearChange: (selectedDates, dateStr, instance) => {
                instance.redraw();
            },
            onReady: (selectedDates, dateStr, instance) => {
                instance.calendarContainer.classList.add('attendance-calendar', 'app-date-calendar');
                AttendanceManager.updateWeekdayDisplay(selectedDates[0]);
                AttendanceManager.updateDateSelectionState(selectedDates[0]);
            }
        });

        AttendanceManager.loadAttendanceList();
        AttendanceManager.updateStats();
    },

    loadAttendanceList: async () => {
        const tbody = document.getElementById('attendance-list');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading backend attendance data...</td></tr>';

        let staff = [];
        let attendanceData = {};
        let monthlyCounts = {};
        try {
            const currentDate = new Date(`${AttendanceManager.currentDate}T00:00:00`);
            const [employees, dayRows, aofRows, monthRows] = await Promise.all([
                ApiClient.listEmployees(),
                ApiClient.getAttendanceByDate(AttendanceManager.currentDate),
                ApiClient.listAof(),
                ApiClient.getAttendanceMonth(currentDate.getMonth() + 1, currentDate.getFullYear())
            ]);
            staff = (employees || []).map((employee) => ApiSyncManager.normalizeEmployee(employee));
            attendanceData = AttendanceManager.rowsToDayData(dayRows || []);
            monthlyCounts = AttendanceManager.getMonthlyStatusCounts(monthRows?.list || []);
            AttendanceManager.currentStaff = staff;
            AttendanceManager.currentAttendanceData = attendanceData;
            AttendanceManager.currentAofRows = aofRows || [];
        } catch (error) {
            console.error('Failed to load attendance from backend', error);
            AttendanceManager.currentStaff = [];
            AttendanceManager.currentAttendanceData = {};
            AttendanceManager.currentAofRows = [];
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--danger); font-weight:700;">Backend attendance data unavailable</td></tr>';
            AttendanceManager.updateStats();
            AttendanceManager.updateEmptyStateNote(0, true);
            return;
        }

        const displayAttendanceData = AttendanceManager.getDisplayAttendanceData(staff, attendanceData);

        if (staff.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">No staff found. Add staff first.</td></tr>';
            return;
        }

        tbody.innerHTML = staff.filter(s => s.status === 'active').map(s => {
            const status = AttendanceManager.normalizeStatus(displayAttendanceData[s.id] || '');
            const hasAdvance = AttendanceManager.hasAdvanceInCurrentViewMonth(s.id);
            const hasDeduction = AttendanceManager.hasDeductionInCurrentViewMonth(s.id);
            const counts = monthlyCounts[String(s.id)] || {};
            const baseSalary = Number(s.salaryAmount || 0);
            const currentDate = new Date(`${AttendanceManager.currentDate}T00:00:00`);
            const daysDivisor = window.PayrollSettings.getDaysDivisor(currentDate.getMonth() + 1, currentDate.getFullYear());
            const perDaySalary = daysDivisor > 0 ? Math.round(baseSalary / daysDivisor) : 0;
            return `
                <tr class="attendance-row">
                    <td onclick="switchView('staff-profile', '${s.id}')" style="cursor:pointer; font-weight:600; color:var(--primary);">
                        <div style="display:flex; align-items:center; gap:10px;" class="staff-link">
                            <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), 'random', 'fff', 30)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', 'random', 'fff', 30)}" style="width:30px; height:30px; border-radius:8px; object-fit:cover;">
                            <div>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span>${s.name}</span>
                                    ${hasAdvance
                    ? '<i class="fas fa-star" style="color:#FFD700; font-size:0.8rem; text-shadow: 0 0 5px rgba(255,215,0,0.5);" title="Advance pending"></i>'
                    : ''}
                                    ${hasDeduction
                    ? '<i class="fas fa-star" style="color:#0984e3; font-size:0.8rem; text-shadow: 0 0 5px rgba(9,132,227,0.45);" title="Payment deduction applied"></i>'
                    : ''}
                                </div>
                                <div class="attendance-salary-meta">Basic Salary: ${AttendanceManager.formatSalaryAmountWithHold(baseSalary, s)} / ₹${perDaySalary.toLocaleString()}</div>
                            </div>
                        </div>
                    </td>
                    <td onclick="switchView('staff-profile', '${s.id}')" style="cursor:pointer; color:var(--text-muted);">${s.role}</td>
                    <td>
                        <div class="attendance-toggle">
                            <label class="toggle-btn ${status === 'present' ? 'active' : ''}" title="Present" style="--active-bg: var(--success);">
                                <input type="radio" name="att-${s.id}" value="present" 
                                    ${status === 'present' ? 'checked' : ''} 
                                    data-checked="${status === 'present'}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel('P', Number(counts.present || 0))}
                            </label>
                            <label class="toggle-btn ${status === 'absent' ? 'active' : ''}" title="Absent" style="--active-bg: var(--danger);">
                                <input type="radio" name="att-${s.id}" value="absent" 
                                    ${status === 'absent' ? 'checked' : ''} 
                                    data-checked="${status === 'absent'}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel('A', Number(counts.absent || 0))}
                            </label>
                            <label class="toggle-btn ${status === 'halfday' ? 'active' : ''}" title="Half Day" style="--active-bg: #FF9F43;">
                                <input type="radio" name="att-${s.id}" value="halfday" 
                                    ${status === 'halfday' ? 'checked' : ''} 
                                    data-checked="${status === 'halfday'}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel('H', Number(counts.halfday || 0))}
                            </label>
                            <label class="toggle-btn ${status === 'holiday' ? 'active' : ''}" title="Holiday" style="--active-bg: #0ABDE3;">
                                <input type="radio" name="att-${s.id}" value="holiday" 
                                    ${status === 'holiday' ? 'checked' : ''} 
                                    data-checked="${status === 'holiday'}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel('Off', Number(counts.holiday || 0))}
                            </label>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.attendance-toggle').forEach((group) => {
            const checkedInput = group.querySelector('input:checked');
            if (!checkedInput) return;

            group.querySelectorAll('.toggle-btn').forEach((btn) => btn.classList.remove('active'));
            checkedInput.parentElement.classList.add('active');
        });

        const filledCount = Object.keys(attendanceData).length;
        AttendanceManager.updateEmptyStateNote(filledCount);

        AttendanceManager.updateStats();
    },

    updateEmptyStateNote: (filledCount, backendFailed = false) => {
        const note = document.getElementById('attendance-empty-note');
        if (!note) return;

        if (backendFailed) {
            note.style.display = 'block';
            note.textContent = 'Backend attendance data unavailable. Cached fallback data is not shown.';
            return;
        }

        if (filledCount > 0) {
            note.style.display = 'none';
            note.innerHTML = '';
            return;
        }

        const latestDate = AttendanceManager.getLatestSavedDate();
        const currentDate = AttendanceManager.currentDate;

        if (AttendanceManager.isWeeklyOffDate(currentDate)) {
            note.style.display = 'block';
            note.textContent = `Tuesday weekly off is applied by default for ${currentDate}.`;
            return;
        }

        if (latestDate && latestDate !== currentDate) {
            note.style.display = 'block';
            note.innerHTML = `No attendance saved for <strong>${currentDate}</strong>. Latest saved date is <strong>${latestDate}</strong>.
                <button type="button" onclick="AttendanceManager.loadLatestSavedDate()" style="margin-left:10px; padding:6px 10px; border:none; border-radius:10px; background:#9a6700; color:white; font-weight:700; cursor:pointer;">Load Latest Saved Date</button>`;
            return;
        }

        note.style.display = 'block';
        note.textContent = `No attendance saved for ${currentDate}.`;
    },

    loadLatestSavedDate: () => {
        const latestDate = AttendanceManager.getLatestSavedDate();
        if (!latestDate) return;

        AttendanceManager.currentDate = latestDate;
        const dateInput = document.getElementById('attendance-date');
        if (dateInput) {
            dateInput._flatpickr?.setDate(latestDate, true);
        } else {
            AttendanceManager.loadAttendanceList();
        }
    },

    updateHighlight: (input) => {
        const parent = input.closest('.attendance-toggle');
        parent.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        input.parentElement.classList.add('active');

        const group = document.getElementsByName(input.name);
        group.forEach(r => r.dataset.checked = (r === input).toString());

        AttendanceManager._lastChangedAttendance = {
            staffId: String(input.name || '').replace(/^att-/, ''),
            status: input.value
        };
        AttendanceManager.persistDraftFromDom();
    },

    toggleStatus: (radio) => {
        const isCurrentlyChecked = radio.dataset.checked === 'true';

        if (isCurrentlyChecked) {
            AttendanceManager._lastChangedAttendance = {
                staffId: String(radio.name || '').replace(/^att-/, ''),
                status: ''
            };
            radio.checked = false;
            radio.dataset.checked = 'false';
            radio.parentElement.classList.remove('active');
            const group = document.getElementsByName(radio.name);
            group.forEach(r => r.dataset.checked = 'false');
            AttendanceManager.persistDraftFromDom();
        } else {
            AttendanceManager.updateHighlight(radio);
        }
    },

    markAll: async (status) => {
        let staff = AttendanceManager.currentStaff || [];
        if (staff.length === 0) {
            try {
                staff = (await ApiClient.listEmployees() || []).map((employee) => ApiSyncManager.normalizeEmployee(employee));
                AttendanceManager.currentStaff = staff || [];
            } catch (error) {
                window.showAlert(`Unable to load staff from backend: ${error.message}`);
                return;
            }
        }
        const activeStaff = staff.filter((s) => s.status === 'active');

        if (activeStaff.length === 0) return;
        AttendanceManager._lastChangedAttendance = {
            staffId: '',
            status: status,
            bulkCount: activeStaff.length
        };

        let accentColor = 'var(--success)';
        let statusText = 'Present';
        let statusIcon = 'fa-check-double';

        if (status === 'absent') {
            accentColor = 'var(--danger)';
            statusText = 'Absent';
            statusIcon = 'fa-user-times';
        } else if (status === 'holiday') {
            accentColor = '#0ABDE3';
            statusText = 'Weekly Off';
            statusIcon = 'fa-mug-hot';
        }

        const modalContent = `
            <div id="premium-sync-container" style="text-align:center; padding: 2rem 1rem; position:relative; min-width:350px;">
                <div style="position:relative; z-index:1001;">
                    <div style="position:relative; width:220px; height:220px; margin:0 auto 2.5rem; display:flex; align-items:center; justify-content:center;">
                        <div style="position:absolute; width:240px; height:240px; border:1px dashed ${accentColor}; border-radius:50%; opacity:0.1; animation: spin-slow 20s linear infinite;"></div>
                        <div style="position:absolute; width:260px; height:260px; border:1px solid ${accentColor}; border-radius:50%; opacity:0.03; animation: pulse-ring 3s ease-out infinite;"></div>
                        
                        <svg viewBox="0 0 100 100" style="position:absolute; width:100%; height:100%; transform: rotate(-90deg);">
                            <circle cx="50" cy="50" r="45" stroke="var(--border)" stroke-width="5" fill="none" opacity="0.3" />
                            <circle id="sync-ring" cx="50" cy="50" r="45" stroke="${accentColor}" stroke-width="6" fill="none" 
                                stroke-dasharray="283" stroke-dashoffset="283" 
                                style="transition: stroke-dashoffset 0.3s ease-out; stroke-linecap: round;" />
                        </svg>

                        <div style="text-align:center; z-index:2;">
                            <div id="sync-counter" style="font-size:5rem; font-weight:900; color:var(--primary); line-height:1; font-family:var(--app-font);">0</div>
                            <div style="font-size:0.85rem; color:var(--text-muted); font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-top:5px;">Process</div>
                        </div>
                    </div>

                    <div style="height:80px; margin-bottom:1.5rem; display:flex; align-items:center; justify-content:center; perspective: 1000px;">
                        <div id="syncing-name" style="font-size:2.2rem; font-weight:800; color:var(--primary); font-family:var(--app-font); opacity:0; transform:translateY(20px) rotateX(-20deg); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">Initializing...</div>
                    </div>

                    <div style="display:inline-flex; align-items:center; gap:15px; background:var(--bg-main); padding:1.25rem 3.5rem; border-radius:100px; border:1px solid var(--border); box-shadow:0 15px 45px rgba(0,0,0,0.08);">
                        <i class="fas ${statusIcon}" style="color:${accentColor}; font-size:1.5rem;"></i>
                        <span style="font-weight:800; color:var(--text-main); font-size:1.2rem;">Marking <b>${statusText}</b></span>
                    </div>
                </div>

                <style>
                    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.1; } 100% { transform: scale(1.1); opacity: 0; } }
                    .name-active { opacity: 1 !important; transform: translateY(0) rotateX(0deg) !important; }
                    #modal-container { z-index: 10000 !important; }
                </style>
            </div>
        `;

        if (window.ModalManager) {
            window.ModalManager.show('Bulk Attendance Sync', modalContent);
        }

        const ring = document.getElementById('sync-ring');
        const counter = document.getElementById('sync-counter');
        const nameDisplay = document.getElementById('syncing-name');
        const dashArray = 283;
        const total = activeStaff.length;

        for (let i = 0; i < total; i++) {
            const s = activeStaff[i];
            counter.textContent = i + 1;
            ring.style.strokeDashoffset = dashArray - ((i + 1) / total) * dashArray;

            if (nameDisplay) {
                nameDisplay.classList.remove('name-active');
                await new Promise(r => setTimeout(r, 80));
                nameDisplay.textContent = s.name;
                nameDisplay.classList.add('name-active');
            }

            const r = document.querySelector(`input[name="att-${s.id}"][value="${status}"]`);
            if (r) {
                r.checked = true;
                r.dataset.checked = 'true';
                const parent = r.closest('.attendance-toggle');
                if (parent) {
                    parent.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                    r.parentElement.classList.add('active');
                }
                document.getElementsByName(r.name).forEach(input => { if (input !== r) input.dataset.checked = 'false'; });
            }

            AttendanceManager.updateStats();
            await new Promise(r => setTimeout(r, 220));
        }

        if (nameDisplay) {
            nameDisplay.innerHTML = `<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Sync Successful</span>`;
        }

        setTimeout(() => {
            window.ModalManager?.hide();
            AttendanceManager.persistDraftFromDom(true);
        }, 1500);
    },

    collectDayDataFromDom: () => {
        const dayData = {};
        document.querySelectorAll('#attendance-list input[type="radio"]:checked').forEach((radio) => {
            const staffId = String(radio.name || '').replace(/^att-/, '');
            if (staffId) dayData[staffId] = radio.value;
        });
        return dayData;
    },

    persistDraftFromDom: (saveImmediately = false) => {
        const dayData = AttendanceManager.collectDayDataFromDom();
        ApiSyncManager.primeAttendanceDay(AttendanceManager.currentDate, dayData);
        window.SyncStatus?.show('Attendance changes pending', 'info');

        const filledCount = Object.keys(dayData).length;
        AttendanceManager.updateEmptyStateNote(filledCount);
        AttendanceManager.updateStats();

        if (AttendanceManager._saveTimer) {
            clearTimeout(AttendanceManager._saveTimer);
            AttendanceManager._saveTimer = null;
        }

        AttendanceManager._pendingSaveSnapshot = {
            date: AttendanceManager.currentDate,
            dayData
        };

        if (saveImmediately) {
            AttendanceManager.flushPendingSave();
            return;
        }

        AttendanceManager._saveTimer = setTimeout(() => {
            AttendanceManager.flushPendingSave();
        }, AttendanceManager.saveDebounceMs);
    },

    flushPendingSave: async () => {
        if (AttendanceManager._saveTimer) {
            clearTimeout(AttendanceManager._saveTimer);
            AttendanceManager._saveTimer = null;
        }

        const snapshot = AttendanceManager._pendingSaveSnapshot;
        if (!snapshot) return;

        AttendanceManager._pendingSaveSnapshot = null;

        const staff = AttendanceManager.currentStaff || [];
        const activeStaff = staff.filter(s => s.status === 'active');
        const records = activeStaff
            .map((s) => {
                const status = snapshot.dayData[s.id];
                if (!status) return null;

                return {
                    employee_id: Number(s.id),
                    date: snapshot.date,
                    status: ApiSyncManager.statusToApi(status)
                };
            })
            .filter(Boolean);

        try {
            window.SyncStatus?.show('Saving attendance...', 'saving');
            if (records.length > 0) {
                await ApiClient.saveAttendanceBulk(records);
            }
        } catch (error) {
            window.SyncStatus?.show('Attendance sync failed', 'error', 2800);
            window.showAlert(`Attendance sync failed: ${error.message}`);
            return;
        }

        if (snapshot.date === AttendanceManager.currentDate) {
            AttendanceManager.currentAttendanceData = { ...snapshot.dayData };
            const savedCounts = { present: 0, absent: 0, halfday: 0, holiday: 0 };
            Object.values(snapshot.dayData || {}).forEach((status) => {
                const normalized = AttendanceManager.normalizeStatus(status);
                if (normalized && Object.prototype.hasOwnProperty.call(savedCounts, normalized)) {
                    savedCounts[normalized]++;
                }
            });
            const statusLabels = {
                present: 'P',
                absent: 'A',
                halfday: 'H',
                holiday: 'Off'
            };
            const popupTypes = {
                present: 'success',
                absent: 'error',
                halfday: 'warning',
                holiday: 'info'
            };
            const popupTitles = {
                present: 'Present Saved',
                absent: 'Absent Saved',
                halfday: 'Half Day Saved',
                holiday: 'Off Saved'
            };
            const changed = AttendanceManager._lastChangedAttendance || {};
            const changedStatus = AttendanceManager.normalizeStatus(changed.status || '');
            const changedStaff = (AttendanceManager.currentStaff || []).find((s) => String(s.id) === String(changed.staffId));
            const savedMessage = changedStaff
                ? `${statusLabels[changedStatus] || 'Not Marked'} saved for ${snapshot.date}`
                : changed.bulkCount
                    ? `${changed.bulkCount} staff marked ${statusLabels[changedStatus] || ''} for ${snapshot.date}`
                    : `Attendance saved for ${snapshot.date}`;
            window.SyncStatus?.show(`Attendance saved for ${snapshot.date}`, 'success', 1600);
            window.showAlert(savedMessage, {
                title: popupTitles[changedStatus] || 'Attendance Saved',
                type: popupTypes[changedStatus] || 'success',
                highlight: changedStaff ? changedStaff.name : '',
                autoCloseMs: 3600,
                stats: [
                    { label: 'P', value: savedCounts.present, type: 'success' },
                    { label: 'A', value: savedCounts.absent, type: 'error' },
                    { label: 'H', value: savedCounts.halfday, type: 'warning' },
                    { label: 'Off', value: savedCounts.holiday, type: 'info' }
                ]
            });
        }
    },

    updateStats: () => {
        const staff = AttendanceManager.currentStaff || [];
        const activeStaff = staff.filter(s => s.status === 'active');
        const domData = AttendanceManager.collectDayDataFromDom();
        const attendanceData = Object.keys(domData).length ? domData : (AttendanceManager.currentAttendanceData || {});
        const displayAttendanceData = AttendanceManager.getDisplayAttendanceData(staff, attendanceData);
        const statsRow = document.getElementById('attendance-stats-row');
        if (!statsRow) return;

        let present = 0, absent = 0, halfday = 0, holiday = 0;

        activeStaff.forEach(s => {
            const status = AttendanceManager.normalizeStatus(displayAttendanceData[s.id] || '');
            if (status === 'present') present++;
            else if (status === 'absent') absent++;
            else if (status === 'halfday') halfday++;
            else if (status === 'holiday') holiday++;
        });

        statsRow.innerHTML = `
            <div class="attendance-stat-pill stat-present" title="Present">
                <i class="fas fa-check"></i><strong>${present}</strong>
            </div>
            <div class="attendance-stat-pill stat-absent" title="Absent">
                <i class="fas fa-xmark"></i><strong>${absent}</strong>
            </div>
            <div class="attendance-stat-pill stat-halfday" title="Half Day">
                <i class="fas fa-adjust"></i><strong>${halfday}</strong>
            </div>
            <div class="attendance-stat-pill stat-off" title="Off">
                <i class="fas fa-mug-hot"></i><strong>${holiday}</strong>
            </div>
        `;

        const btnPresent = document.getElementById('btn-mark-present');
        const btnHoliday = document.getElementById('btn-mark-holiday');
        const btnAbsent = document.getElementById('btn-mark-absent');
        const total = activeStaff.length;

        if (total > 0 && btnPresent && btnHoliday && btnAbsent) {
            if (present === total) {
                btnPresent.style.background = 'var(--success)';
                btnPresent.style.color = 'white';
            } else {
                btnPresent.style.background = 'rgba(0, 184, 148, 0.1)';
                btnPresent.style.color = 'var(--success)';
            }
            if (holiday === total) {
                btnHoliday.style.background = 'var(--info)';
                btnHoliday.style.color = 'white';
            } else {
                btnHoliday.style.background = 'rgba(10, 189, 227, 0.1)';
                btnHoliday.style.color = 'var(--info)';
            }
            if (absent === total) {
                btnAbsent.style.background = 'var(--danger)';
                btnAbsent.style.color = 'white';
            } else {
                btnAbsent.style.background = 'rgba(214, 48, 49, 0.1)';
                btnAbsent.style.color = 'var(--danger)';
            }
        }
    },

    updateWeekdayDisplay: (date) => {
        const weekdayText = document.getElementById('weekday-text');
        if (weekdayText && date) {
            const options = { weekday: 'long' };
            weekdayText.textContent = date.toLocaleDateString('en-US', options).toUpperCase();
        }
        AttendanceManager.updateDateSelectionState(date);
    }
};

AttendanceManager.currentDate = AttendanceManager.formatDateLocal(new Date());
window.AttendanceManager = AttendanceManager;
