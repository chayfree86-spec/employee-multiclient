const StaffManager = {
    _renderToken: 0,
    _isSavingStaff: false,
    currentStaffList: [],
    currentAofRows: [],

    initDatePicker: (selector, options = {}) => {
        if (typeof flatpickr !== 'function') return null;

        const userOnReady = options.onReady;
        const config = {
            dateFormat: 'Y-m-d',
            monthSelectorType: 'static',
            disableMobile: true,
            ...options,
            onReady: (selectedDates, dateStr, instance) => {
                instance.calendarContainer.classList.add('attendance-calendar', 'app-date-calendar');
                if (typeof userOnReady === 'function') {
                    userOnReady(selectedDates, dateStr, instance);
                }
            }
        };

        return flatpickr(selector, config);
    },

    formatSalaryAmountWithHold: (amount, holdSource = null) => {
        if (window.HoldSalaryUI?.amount) {
            return window.HoldSalaryUI.amount(amount, holdSource);
        }
        return `&#8377;${Number(amount || 0).toLocaleString()}`;
    },

    getPositiveAmount: (elementId, label = 'Amount') => {
        const amount = parseFloat(document.getElementById(elementId)?.value);
        if (!Number.isFinite(amount) || amount <= 0) {
            window.showAlert(`${label} 0 se bada hona chahiye`);
            return null;
        }
        return amount;
    },

    getLoanAndSavingState: (staffId) => {
        const advances = StorageManager.get('advances') || {};
        const savings = StorageManager.get('savings') || {};
        const transfers = StorageManager.get('transfers') || {};
        const staffAdvances = advances[staffId] || [];
        const staffSavings = savings[staffId] || [];
        const staffTransfers = transfers[staffId] || [];

        const loanGiven = staffAdvances
            .filter((entry) => entry.type === 'paid')
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const loanReceived = staffAdvances
            .filter((entry) => entry.type === 'received')
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const savingDeposits = staffSavings
            .filter((entry) => entry.type === 'deposit')
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const savingWithdrawals = staffSavings
            .filter((entry) => entry.type === 'withdraw')
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const loanToSaving = staffTransfers
            .filter((entry) => entry.type === 'loan_to_saving')
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const savingToLoan = staffTransfers
            .filter((entry) => entry.type === 'saving_to_loan')
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        return {
            staffAdvances,
            staffSavings,
            staffTransfers,
            loanGiven,
            loanReceived,
            savingDeposits,
            savingWithdrawals,
            loanToSaving,
            savingToLoan,
            loanBalance: Math.max(0, loanGiven + savingToLoan - loanReceived - loanToSaving),
            savingBalance: Math.max(0, savingDeposits + loanToSaving - savingWithdrawals - savingToLoan)
        };
    },

    getLoanHistoryMeta: (type) => {
        if (type === 'received') {
            return { label: 'Credit', badgeClass: 'badge-success' };
        }

        return { label: 'Debit', badgeClass: 'badge-danger' };
    },

    getLedgerSummary: async (staffId) => {
        const summary = await ApiClient.getAofSummary(Number(staffId));
        return {
            loanBalance: Number(summary?.loan_balance || 0),
            savingBalance: Number(summary?.saving_balance || 0),
            totalLoanAdded: Number(summary?.total_loan_added || 0),
            totalLoanReceived: Number(summary?.total_loan_received || 0),
            totalSavingDeposit: Number(summary?.total_saving_deposit || 0),
            totalSavingWithdraw: Number(summary?.total_saving_withdraw || 0),
            totalLoanToSaving: Number(summary?.loan_to_saving || 0),
            totalSavingToLoan: Number(summary?.saving_to_loan || 0)
        };
    },

    refreshAdvanceModalSummary: async (staffId) => {
        const summaryNode = document.getElementById('advance-ledger-status');
        if (!summaryNode) return;

        summaryNode.innerHTML = '<span style="color:var(--text-muted);">Loading advance payment...</span>';

        try {
            const summary = await StaffManager.getLedgerSummary(staffId);
            summaryNode.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                <div style="padding:10px; border-radius:12px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.2);">
                    <div style="font-size:0.7rem; font-weight:700; color:var(--danger); text-transform:uppercase;">Advance Balance</div>
                    <div style="font-size:1rem; font-weight:700; color:var(--danger);">&#8377;${summary.loanBalance.toLocaleString()}</div>
                </div>
                <div style="padding:10px; border-radius:12px; background:rgba(9, 132, 227, 0.06); border:1px solid rgba(9, 132, 227, 0.2);">
                    <div style="font-size:0.7rem; font-weight:700; color:var(--info); text-transform:uppercase;">Debit</div>
                    <div style="font-size:1rem; font-weight:700; color:var(--info);">&#8377;${summary.totalLoanAdded.toLocaleString()}</div>
                </div>
                <div style="padding:10px; border-radius:12px; background:rgba(0, 184, 148, 0.06); border:1px solid rgba(0, 184, 148, 0.2);">
                    <div style="font-size:0.7rem; font-weight:700; color:var(--success); text-transform:uppercase;">Credit</div>
                    <div style="font-size:1rem; font-weight:700; color:var(--success);">&#8377;${summary.totalLoanReceived.toLocaleString()}</div>
                </div>
            </div>
        `;
        } catch (error) {
            summaryNode.innerHTML = '<span style="color:var(--danger); font-weight:700;">Backend advance summary load nahi ho payi.</span>';
        }
    },

    hasAdvanceTakenInMonth: (staffId, month = new Date().getMonth(), year = new Date().getFullYear()) => {
        if (Array.isArray(StaffManager.currentAofRows) && StaffManager.currentAofRows.length > 0) {
            return StaffManager.currentAofRows.some((entry) => {
                if (String(entry.employee_id) !== String(staffId) || entry.type !== 'advance' || (Number(entry.amount) || 0) <= 0 || !entry.date) return false;
                const date = new Date(`${entry.date}T00:00:00`);
                return date.getMonth() === month && date.getFullYear() === year;
            });
        }

        const advances = StorageManager.get('advances') || {};
        const staffAdvances = advances[staffId] || [];

        return staffAdvances.some((entry) => {
            if (entry.type !== 'paid' || (Number(entry.amount) || 0) <= 0 || !entry.date) {
                return false;
            }

            const date = new Date(`${entry.date}T00:00:00`);
            return date.getMonth() === month && date.getFullYear() === year;
        });
    },

    hasDeductionInMonth: (staffId, month = new Date().getMonth(), year = new Date().getFullYear()) => {
        if (Array.isArray(StaffManager.currentAofRows) && StaffManager.currentAofRows.length > 0) {
            return StaffManager.currentAofRows.some((entry) => {
                if (String(entry.employee_id) !== String(staffId) || !['fine', 'deduction'].includes(entry.type) || (Number(entry.amount) || 0) <= 0 || !entry.date) return false;
                const date = new Date(`${entry.date}T00:00:00`);
                return date.getMonth() === month && date.getFullYear() === year;
            });
        }

        const fines = StorageManager.get('fines') || {};
        const staffEntries = fines[staffId] || [];

        return staffEntries.some((entry) => {
            if (entry.type !== 'deduction' || (Number(entry.amount) || 0) <= 0 || !entry.date) {
                return false;
            }

            const date = new Date(`${entry.date}T00:00:00`);
            return date.getMonth() === month && date.getFullYear() === year;
        });
    },

    getActiveHoldMonthKey: (staffId, fallbackMonthKey = null) => {
        const adjustments = StorageManager.get('salaryAdjustments') || {};
        const staffAdjustments = adjustments[staffId] || {};
        const activeMonthKeys = Object.entries(staffAdjustments)
            .filter(([, monthData]) => Boolean(monthData?.hold) && Number(monthData?.holdDays || 0) > 0)
            .map(([key]) => key)
            .sort();

        return activeMonthKeys[0] || fallbackMonthKey;
    },

    getLocalPendingHold: (staffId, salaryAmount = 0) => {
        if (window.SalaryManager?.getLocalPendingHold) {
            return window.SalaryManager.getLocalPendingHold(staffId, salaryAmount);
        }

        const adjustments = StorageManager.get('salaryAdjustments') || {};
        const staffAdjustments = adjustments[staffId] || {};
        const now = new Date();
        const dailyRate = Number(salaryAmount || 0) / window.PayrollSettings.getDaysDivisor(now.getMonth() + 1, now.getFullYear());

        return Object.values(staffAdjustments).reduce((acc, monthData) => {
            const holdDays = Number(monthData?.holdDays || 0);
            if (!monthData?.hold || holdDays <= 0) return acc;

            acc.days += holdDays;
            acc.amount += (dailyRate * holdDays);
            return acc;
        }, { days: 0, amount: 0 });
    },

    getDefaultAutoHoldConfig: () => ({
        enabled: StorageManager.get('auto_hold_enabled') === true,
        days: Number(StorageManager.get('auto_hold_days') || 0)
    }),

    applyDefaultHoldForNewStaff: async (staffId, joinDate) => {
        const config = StaffManager.getDefaultAutoHoldConfig();
        if (!config.enabled || config.days <= 0) {
            return { applied: false, holdDays: 0, warning: null };
        }

        if (!joinDate) {
            return { applied: false, holdDays: 0, warning: 'Auto hold skipped because joining date is missing.' };
        }

        const parsedJoinDate = new Date(`${joinDate}T00:00:00`);
        if (Number.isNaN(parsedJoinDate.getTime())) {
            return { applied: false, holdDays: 0, warning: 'Auto hold skipped because joining date is invalid.' };
        }

        const normalizedStaffId = String(staffId);
        const monthKey = `${parsedJoinDate.getFullYear()}-${String(parsedJoinDate.getMonth() + 1).padStart(2, '0')}`;
        const adjustments = StorageManager.get('salaryAdjustments') || {};

        if (!adjustments[normalizedStaffId]) {
            adjustments[normalizedStaffId] = {};
        }

        adjustments[normalizedStaffId][monthKey] = {
            overtime: 0,
            advance: 0,
            fine: 0,
            adjustment: 0,
            ...(adjustments[normalizedStaffId][monthKey] || {}),
            hold: true,
            holdDays: config.days
        };

        StorageManager.save('salaryAdjustments', adjustments);

        let warning = null;
        try {
            await ApiClient.addManualHold(normalizedStaffId, config.days);
        } catch (error) {
            warning = 'Auto hold local me save hua, lekin cloud hold sync nahi ho paya.';
        }

        return {
            applied: true,
            holdDays: config.days,
            monthKey,
            warning
        };
    },

    getFilteredStaff: (searchQuery = '') => {
        let staff = StorageManager.get('staff') || [];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            staff = staff.filter(s =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.mobile && s.mobile.includes(query))
            );
        }

        return staff;
    },

    findExistingStaffByNameMobile: (name, mobile, excludeId = null) => {
        const normalizedName = String(name || '').trim().toLowerCase();
        const normalizedMobile = String(mobile || '').trim();
        if (!normalizedName || !normalizedMobile) return null;

        const staffList = StaffManager.currentStaffList.length > 0
            ? StaffManager.currentStaffList
            : (StorageManager.get('staff') || []);

        return staffList.find((staff) =>
            String(staff.id) !== String(excludeId || '') &&
            String(staff.mobile || '').trim() === normalizedMobile &&
            String(staff.name || '').trim().toLowerCase() === normalizedName
        ) || null;
    },

    getCurrentMonthIndicators: (month = new Date().getMonth(), year = new Date().getFullYear(), aofRows = null) => {
        if (Array.isArray(aofRows)) {
            const advanceIds = new Set();
            const deductionIds = new Set();

            aofRows.forEach((entry) => {
                if (!entry?.date || (Number(entry.amount) || 0) <= 0) return;
                const date = new Date(`${entry.date}T00:00:00`);
                if (date.getMonth() !== month || date.getFullYear() !== year) return;

                if (entry.type === 'advance') advanceIds.add(String(entry.employee_id));
                if (entry.type === 'fine' || entry.type === 'deduction') deductionIds.add(String(entry.employee_id));
            });

            return { advanceIds, deductionIds };
        }

        const advances = StorageManager.get('advances') || {};
        const fines = StorageManager.get('fines') || {};
        const advanceIds = new Set();
        const deductionIds = new Set();

        Object.entries(advances).forEach(([staffId, entries]) => {
            if ((entries || []).some((entry) => {
                if (entry.type !== 'paid' || (Number(entry.amount) || 0) <= 0 || !entry.date) {
                    return false;
                }

                const date = new Date(`${entry.date}T00:00:00`);
                return date.getMonth() === month && date.getFullYear() === year;
            })) {
                advanceIds.add(String(staffId));
            }
        });

        Object.entries(fines).forEach(([staffId, entries]) => {
            if ((entries || []).some((entry) => {
                if (entry.type !== 'deduction' || (Number(entry.amount) || 0) <= 0 || !entry.date) {
                    return false;
                }

                const date = new Date(`${entry.date}T00:00:00`);
                return date.getMonth() === month && date.getFullYear() === year;
            })) {
                deductionIds.add(String(staffId));
            }
        });

        return { advanceIds, deductionIds };
    },

    buildStaffListMarkup: (searchQuery = '', options = {}) => {
        const { isLoading = false, loadFailed = false, staffList = null, aofRows = null } = options;
        let staff = Array.isArray(staffList) ? staffList.slice() : StaffManager.getFilteredStaff(searchQuery);
        if (searchQuery && Array.isArray(staffList)) {
            const query = searchQuery.toLowerCase();
            staff = staff.filter(s =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.mobile && s.mobile.includes(query))
            );
        }
        const { advanceIds, deductionIds } = StaffManager.getCurrentMonthIndicators(new Date().getMonth(), new Date().getFullYear(), aofRows);

        return `
            <div class="card">
                <div class="card-header">
                    <h3>Staff Management ${searchQuery ? `<span style="font-size:0.8rem; color:var(--text-muted); font-weight:400;">(Searching for "${searchQuery}")</span>` : ''}</h3>
                    <button class="btn-primary" onclick="StaffManager.showAddStaffModal()">
                        <i class="fas fa-plus"></i> Add Staff
                    </button>
                </div>
                <div class="table-responsive staff-list-wrap">
                    <table class="staff-list-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Role</th>
                                <th>Salary Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${isLoading ? `<tr><td colspan="7" style="text-align:center; padding:3rem;">
                                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem; color:var(--text-muted); display:block; margin-bottom:10px;"></i>
                                Loading staff...
                            </td></tr>` :
                staff.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:3rem;">
                                <i class="fas ${loadFailed ? 'fa-triangle-exclamation' : 'fa-search-minus'}" style="font-size:2rem; color:var(--text-muted); display:block; margin-bottom:10px;"></i>
                                ${loadFailed ? 'Failed to load staff from backend.' : 'No staff found matching your search'}
                            </td></tr>` :
                staff.map(s => {
                    const hasAdvance = advanceIds.has(String(s.id));
                    const hasDeduction = deductionIds.has(String(s.id));
                    const joinDateDisplay = StaffManager.formatDateDisplay(s.joinDate);

                    return `
                                <tr class="attendance-row staff-card-row" data-staff-id="${s.id}" role="button" tabindex="0" style="cursor:pointer;">
                                    <td class="staff-card-primary" data-label="Name" style="font-weight:700; color:var(--primary);">
                                        <div style="display:flex; align-items:center; gap:10px;" class="staff-link">
                                            <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), 'random', 'fff', 30)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', 'random', 'fff', 30)" style="width:30px; height:30px; border-radius:8px; object-fit:cover;">
                                            <div style="display:flex; flex-direction:column; gap:3px;">
                                                <div style="display:flex; align-items:center; gap:6px;">
                                                    <span style="font-weight:700;">${s.name}</span>
                                                    ${hasAdvance ? '<i class="fas fa-star" style="color:#FFD700; font-size:0.8rem; text-shadow: 0 0 5px rgba(255,215,0,0.5);" title="Has Salary Advance"></i>' : ''}
                                                    ${hasDeduction ? '<i class="fas fa-star" style="color:#0984e3; font-size:0.8rem; text-shadow: 0 0 5px rgba(9,132,227,0.45);" title="Has Payment Deduction"></i>' : ''}
                                                </div>
                                                ${joinDateDisplay ? `<span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">${joinDateDisplay}</span>` : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Mobile" style="font-weight:600; color:var(--text-muted);"><i class="fas fa-phone-alt" style="font-size:0.75rem; margin-right:5px; opacity:0.5;"></i>${s.mobile || '---'}</td>
                                    <td data-label="Role" style="color:var(--text-muted);">${s.role || '---'}</td>
                                    <td data-label="Salary Type">${s.salaryType}</td>
                                    <td data-label="Amount">${StaffManager.formatSalaryAmountWithHold(s.salaryAmount, s)}</td>
                                    <td data-label="Status">
                                        <span class="status-badge ${s.status === 'active' ? 'status-active' : 'status-inactive'}">
                                            ${s.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td class="staff-card-actions" data-label="Actions" onclick="event.stopPropagation()">
                                        <div class="staff-action-row" style="display:flex; align-items:center; gap:12px;">
                                            <label class="switch-toggle" title="Toggle Status">
                                                <input type="checkbox" ${s.status === 'active' ? 'checked' : ''} onchange="StaffManager.toggleStaffStatus('${s.id}')">
                                                <span class="slider-round"></span>
                                            </label>
                                            <button class="btn-icon" style="color:var(--success); border-color:rgba(0,184,148,0.2);" onclick="StaffManager.showQuickSalaryActionModal('${s.id}')" title="Quick Adjustment">
                                                <i class="fas fa-money-bill-wave"></i>
                                            </button>
                                            <button class="btn-icon" style="color:var(--info); border-color:rgba(9,132,227,0.2);" onclick="StaffManager.showPhotoUploadModal('${s.id}')" title="Update Photo">
                                                <i class="fas fa-camera"></i>
                                            </button>
                                            <button class="btn-icon" onclick="StaffManager.showEditStaffModal('${s.id}')"><i class="fas fa-edit"></i></button>
                                            <button class="btn-icon text-danger" onclick="StaffManager.deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    formatDateDisplay: (value) => {
        if (!value) return '';
        const parts = String(value).slice(0, 10).split('-');
        if (parts.length !== 3) return String(value);
        const [year, month, day] = parts;
        if (!year || !month || !day) return '';
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    },

    renderStaffList: async (container, searchQuery = '') => {
        const renderToken = ++StaffManager._renderToken;

        container.innerHTML = StaffManager.buildStaffListMarkup(searchQuery, {
            isLoading: true
        });

        try {
            const [employees, aofRows] = await Promise.all([
                ApiClient.listEmployees(),
                ApiClient.listAof()
            ]);
            StaffManager.currentStaffList = (employees || []).map((employee) => ApiSyncManager.normalizeEmployee(employee));
            StaffManager.currentAofRows = aofRows || [];
        } catch (error) {
            if (renderToken !== StaffManager._renderToken) return;

            container.innerHTML = StaffManager.buildStaffListMarkup(searchQuery, {
                loadFailed: true
            });
            return;
        }

        if (renderToken !== StaffManager._renderToken) return;
        container.innerHTML = StaffManager.buildStaffListMarkup(searchQuery, {
            staffList: StaffManager.currentStaffList,
            aofRows: StaffManager.currentAofRows
        });
        StaffManager.bindStaffCardProfileLinks(container);
    },

    bindStaffCardProfileLinks: (container) => {
        container.querySelectorAll('.staff-card-row[data-staff-id]').forEach((row) => {
            const openProfile = (event) => {
                if (event.target.closest('button, input, label, a, select, textarea, .staff-card-actions')) {
                    return;
                }

                const staffId = row.dataset.staffId;
                if (staffId) {
                    AppNavigation.go('staff-profile', staffId);
                }
            };

            row.addEventListener('click', openProfile);
            row.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openProfile(event);
            });
        });
    },

    buildProfileStaffSelectorOptions: (selectedStaffId) => {
        const staffList = (StaffManager.currentStaffList.length > 0 ? StaffManager.currentStaffList : (StorageManager.get('staff') || []))
            .slice()
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return staffList.map((entry) => `
            <option value="${entry.id}" ${String(entry.id) === String(selectedStaffId) ? 'selected' : ''}>
                ${entry.name}${entry.role ? ` - ${entry.role}` : ''}
            </option>
        `).join('');
    },

    handleProfileStaffChange: async (nextStaffId) => {
        const container = document.getElementById('view-container');
        if (!container || !nextStaffId) return;

        const profileMonthPicker = document.getElementById('profile-month-picker');
        if (profileMonthPicker?.value) {
            const [y, m] = profileMonthPicker.value.split('-');
            await StaffManager.renderProfilePage(container, nextStaffId, parseInt(m, 10) - 1, parseInt(y, 10));
            return;
        }

        await StaffManager.renderProfilePage(container, nextStaffId);
    },

    getProfileMonthPickerHtml: (staffId, month, year, includeHiddenInput = true) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const maxYear = now.getFullYear();
        const maxMonth = now.getMonth();
        const selectedKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const selectedLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const monthButtons = months.map((label, index) => {
            const disabled = year > maxYear || (year === maxYear && index > maxMonth);
            const active = index === month;
            return `
                <button type="button"
                    class="profile-month-option ${active ? 'active' : ''}"
                    ${disabled ? 'disabled' : ''}
                    onclick="StaffManager.selectProfileMonth('${staffId}', ${index}, ${year})">
                    ${label}
                </button>
            `;
        }).join('');

        return `
            <div class="profile-month-picker">
                ${includeHiddenInput ? `<input type="hidden" id="profile-month-picker" value="${selectedKey}">` : ''}
                <button type="button" class="profile-month-trigger" onclick="StaffManager.toggleProfileMonthMenu(event)">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${selectedLabel}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="profile-month-menu">
                    <div class="profile-month-year">
                        <button type="button" class="profile-month-nav" onclick="StaffManager.changeProfileMonthYear('${staffId}', ${month}, ${year - 1})">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span>${year}</span>
                        <button type="button" class="profile-month-nav" ${year >= maxYear ? 'disabled' : ''} onclick="StaffManager.changeProfileMonthYear('${staffId}', ${month}, ${year + 1})">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="profile-month-grid">
                        ${monthButtons}
                    </div>
                    <div class="profile-month-actions">
                        <button type="button" onclick="StaffManager.selectProfileMonth('${staffId}', ${maxMonth}, ${maxYear})">This month</button>
                    </div>
                </div>
            </div>
        `;
    },

    toggleProfileMonthMenu: (event) => {
        event?.stopPropagation();
        const picker = event?.currentTarget?.closest('.profile-month-picker');
        const menu = picker?.querySelector('.profile-month-menu');
        document.querySelectorAll('.profile-month-menu.open').forEach((openMenu) => {
            if (openMenu !== menu) openMenu.classList.remove('open');
        });
        menu?.classList.toggle('open');
    },

    selectProfileMonth: async (staffId, month, year) => {
        const container = document.getElementById('view-container');
        if (!container) return;
        await StaffManager.renderProfilePage(container, staffId, month, year);
    },

    changeProfileMonthYear: async (staffId, selectedMonth, nextYear) => {
        const now = new Date();
        const month = nextYear === now.getFullYear()
            ? Math.min(selectedMonth, now.getMonth())
            : selectedMonth;
        await StaffManager.selectProfileMonth(staffId, month, nextYear);
    },

    renderProfilePage: async (container, staffId, selectedMonth = null, selectedYear = null) => {
        const now = new Date();
        let month = selectedMonth;
        let year = selectedYear;
        if (month === null || year === null) {
            const cyclePeriod = SalaryManager.getPreviousMonthYear();
            let currentPayrollSummary = null;
            let cyclePayrollSummary = null;
            try {
                currentPayrollSummary = await ApiClient.getPayrollSummary(Number(staffId), now.getMonth() + 1, now.getFullYear());
                cyclePayrollSummary = await ApiClient.getPayrollSummary(Number(staffId), cyclePeriod.month + 1, cyclePeriod.year);
            } catch (error) {
                console.error('Failed to load backend payroll summary for profile default month', error);
                container.innerHTML = '<h2>Backend staff profile data unavailable</h2>';
                return;
            }
            const defaultPeriod = currentPayrollSummary?.is_already_generated || cyclePayrollSummary?.is_already_generated
                ? { month: now.getMonth(), year: now.getFullYear() }
                : cyclePeriod;
            month = defaultPeriod.month;
            year = defaultPeriod.year;
        }
        const paymentMonth = month;
        const paymentYear = year;
        window.HeaderManager?.sync('staff-profile', staffId);
        let staff = null;
        let payrollSummary = null;
        let monthlyAttendance = null;
        try {
            const [employees, payrollData, attendanceData, aofRows] = await Promise.all([
                ApiClient.listEmployees(),
                ApiClient.getPayrollSummary(Number(staffId), paymentMonth + 1, paymentYear),
                ApiClient.getAttendanceByEmployeeMonth(Number(staffId), paymentMonth + 1, paymentYear),
                ApiClient.listAof()
            ]);
            StaffManager.currentStaffList = (employees || []).map((employee) => ApiSyncManager.normalizeEmployee(employee));
            staff = StaffManager.currentStaffList.find(s => String(s.id) === String(staffId));
            payrollSummary = payrollData;
            monthlyAttendance = attendanceData;
            StaffManager.currentAofRows = aofRows || [];
        } catch (error) {
            console.error('Failed to load staff profile from backend', error);
            return container.innerHTML = '<h2>Backend staff profile data unavailable</h2>';
        }
        if (!staff) return container.innerHTML = '<h2>Staff not found</h2>';

        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const paymentMonthKey = `${paymentYear}-${String(paymentMonth + 1).padStart(2, '0')}`;
        const backendHoldInfo = payrollSummary?.hold_info || { total_hold_days: 0, total_hold_amount: 0 };
        const slipData = SalaryManager.getSlipDataFromSummary(payrollSummary, paymentMonth, paymentYear);

        const daysPresent = Number(slipData?.daysPresent || 0);
        const adj = slipData?.adj || { overtime: 0, advance: 0, fine: 0, adjustment: 0, hold: false };
        const holdDeductionAmount = Math.round(Number(slipData?.holdAmount || 0));
        const earnedSalaryBeforeHold = Math.round(Number(slipData?.earnedSalary || 0));
        const earnedSalaryAfterHold = Math.max(0, earnedSalaryBeforeHold - holdDeductionAmount);
        const salarySource = payrollSummary?.generated || payrollSummary?.details || null;
        const baseAmount = Number(salarySource?.base_salary || 0);
        const daysDivisor = Number(salarySource?.days_divisor || 0);
        const perDaySalary = baseAmount > 0 && daysDivisor > 0 ? Math.round(baseAmount / daysDivisor) : 0;
        const displayHoldDays = Math.max(
            Number(adj.holdDays || 0),
            Number(backendHoldInfo.total_hold_days || 0)
        );
        const displayHoldAmount = Math.max(
            Math.round(Number(backendHoldInfo.total_hold_amount || 0))
        );
        const hasAnyHold = Boolean(adj.hold)
            || Number(adj.holdDays || 0) > 0
            || Number(backendHoldInfo.total_hold_days || 0) > 0
            || Number(backendHoldInfo.total_hold_amount || 0) > 0;
        const isSelectedMonthGenerated = Boolean(payrollSummary?.is_already_generated);
        const isSelectedMonthCurrent = month === now.getMonth() && year === now.getFullYear();
        const canGenerateSelectedMonth = !isSelectedMonthGenerated && !isSelectedMonthCurrent;
        const staffAttendance = (monthlyAttendance?.list || []).map((row) => ({
            date: row.date,
            status: ApiSyncManager.statusFromApi(row.status) || row.status || ''
        })).sort((a, b) => b.date.localeCompare(a.date));
        const attendanceCounts = {
            present: staffAttendance.filter((row) => row.status === 'present').length,
            holiday: staffAttendance.filter((row) => row.status === 'holiday').length,
            halfday: staffAttendance.filter((row) => row.status === 'halfday').length
        };
        const attendanceCountBadges = [
            attendanceCounts.present > 0 ? `<span style="color:var(--success);">${attendanceCounts.present}P</span>` : '',
            attendanceCounts.holiday > 0 ? `<span style="color:var(--info);">${attendanceCounts.holiday}HO</span>` : '',
            attendanceCounts.halfday > 0 ? `<span style="color:var(--warning);">${attendanceCounts.halfday}HD</span>` : ''
        ].filter(Boolean).join('');
        const attendance = staffAttendance.reduce((map, row) => {
            if (!row.date) return map;
            if (!map[row.date]) map[row.date] = {};
            map[row.date][String(staffId)] = row.status;
            return map;
        }, {});
        const staffAofRows = (StaffManager.currentAofRows || [])
            .filter((row) => String(row.employee_id) === String(staffId))
            .map((row) => ({
                id: Number(row.id || 0),
                type: row.type || '',
                amount: Number(row.amount || 0),
                date: row.date || '',
                remark: row.notes || ''
            }));
        const isInPaymentMonth = (entry) => {
            if (!entry.date) return false;
            const d = new Date(`${entry.date}T00:00:00`);
            return d.getMonth() === paymentMonth && d.getFullYear() === paymentYear;
        };
        const hasAdvanceInPaymentMonth = staffAofRows.some((entry) => entry.type === 'advance' && isInPaymentMonth(entry));
        const hasDeductionInPaymentMonth = staffAofRows.some((entry) => ['fine', 'deduction'].includes(entry.type) && isInPaymentMonth(entry));

        container.innerHTML = `
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div style="display:flex; align-items:center; gap:1.5rem;">
                    <button class="btn-icon" onclick="switchView('staff')"><i class="fas fa-arrow-left"></i></button>
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <img src="${staff.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(staff.name), '3E2723', 'fff', 80)}" alt="${staff.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(staff.name)}', '3E2723', 'fff', 80)" style="width:60px; height:60px; border-radius:15px; object-fit:cover;">
                        <div>
                            <h1 style="font-size:1.8rem; margin:0; line-height:1.2;">
                                ${staff.name}
                                ${hasAdvanceInPaymentMonth ? '<i class="fas fa-star" style="color:#FFD700; font-size:1rem; margin-left:8px;"></i>' : ''}
                                ${hasDeductionInPaymentMonth ? '<i class="fas fa-star" style="color:#0984e3; font-size:1rem; margin-left:8px;"></i>' : ''}
                            </h1>
                            <p style="color:var(--text-muted); font-weight:600;"><i class="fas fa-id-badge" style="margin-right:8px; color:var(--accent);"></i>${staff.role}</p>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
                    <button class="btn-outline" onclick="StaffManager.showPhotoUploadModal('${staff.id}')"><i class="fas fa-camera"></i> Update Photo</button>
                    ${StaffManager.getProfileMonthPickerHtml(staffId, month, year)}
                    <button class="btn-outline" onclick="StaffManager.showEditStaffModal('${staff.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-primary" style="background:${canGenerateSelectedMonth ? 'var(--success)' : 'var(--text-muted)'}; cursor:${canGenerateSelectedMonth ? 'pointer' : 'not-allowed'};" ${canGenerateSelectedMonth ? `onclick="SalaryManager.showSalaryConfigModal('${staff.id}', ${month}, ${year})"` : 'disabled'}>
                        <i class="fas fa-file-invoice-dollar"></i> ${isSelectedMonthGenerated ? 'Salary Generated' : 'Generate Salary'}
                    </button>
                    <button class="btn-primary" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
                </div>
            </div>

            <div class="profile-detail-layout" style="display:grid; grid-template-columns: 350px 1fr; gap:2rem;">
                <!-- Left Sidebar -->
                <div class="profile-side-column" style="display:flex; flex-direction:column; gap:2rem;">
                    <!-- Personal Details -->
                    <div class="card profile-personal-card">
                        <div class="card-header"><h3>Personal Details</h3></div>
                        <div style="padding-top:10px;">
                            <div style="margin-bottom:1.5rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Father's Name</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;">${staff.fatherName || '---'}</span>
                            </div>
                            <div style="margin-bottom:1.5rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Mobile Number</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;"><i class="fas fa-phone-alt" style="margin-right:10px; font-size:0.9rem; color:var(--primary);"></i>${staff.mobile || '---'}</span>
                            </div>
                            <div style="margin-bottom:1.5rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Alt Mobile</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;"><i class="fas fa-phone" style="margin-right:10px; font-size:0.9rem; color:var(--text-muted);"></i>${staff.mobileAlt || '---'}</span>
                            </div>
                            <div style="margin-bottom:1rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Joining Date</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;"><i class="fas fa-calendar-alt" style="margin-right:10px; font-size:0.9rem; color:var(--primary);"></i>${staff.joinDate || '---'}</span>
                            </div>
                            <div style="margin-bottom:1rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Staff Status</label>
                                <span class="badge ${staff.status === 'active' ? 'badge-success' : 'badge-danger'}" style="text-transform: uppercase; font-weight: 700; padding: 4px 12px; font-size:0.7rem;">${staff.status}</span>
                            </div>

                            <!-- Action Buttons inside Personal Details -->
                            <div style="border-top: 1px solid var(--border); padding-top: 1.5rem; display:flex; flex-direction:column; gap:12px;">
                                <button class="btn-outline" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:0.8rem;" onclick="StaffManager.toggleStaffStatus('${staff.id}')">
                                    <i class="fas fa-power-off"></i> ${staff.status === 'active' ? 'Deactivate Staff' : 'Activate Staff'}
                                </button>
                                <button class="btn-outline text-danger" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:0.8rem; border-color:rgba(214, 48, 49, 0.2);" onclick="StaffManager.deleteStaff('${staff.id}')">
                                    <i class="fas fa-trash-alt"></i> Delete Record
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Summary Stats -->
                    <div class="card profile-summary-card">
                        <div class="card-header"><h3>Attendance Summary</h3></div>
                        ${(() => {
                const monthAtt = staffAttendance.filter(a => {
                    const d = new Date(a.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                });
                const counts = {
                    present: monthAtt.filter(a => a.status === 'present').length,
                    absent: monthAtt.filter(a => a.status === 'absent').length,
                    halfday: monthAtt.filter(a => a.status === 'halfday').length,
                    holiday: monthAtt.filter(a => a.status === 'holiday').length
                };
                return `
                            <div class="profile-attendance-summary" style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; padding-top:10px;">
                                <div class="profile-attendance-stat" style="background:rgba(0, 184, 148, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(0, 184, 148, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--success); font-weight:700; text-transform:uppercase;">Present</label>
                                    <h4 style="font-size:1.4rem; color:var(--success); margin-top:4px;">${counts.present}</h4>
                                </div>
                                <div class="profile-attendance-stat" style="background:rgba(214, 48, 49, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(214, 48, 49, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--danger); font-weight:700; text-transform:uppercase;">Absent</label>
                                    <h4 style="font-size:1.4rem; color:var(--danger); margin-top:4px;">${counts.absent}</h4>
                                </div>
                                <div class="profile-attendance-stat" style="background:rgba(253, 203, 110, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(253, 203, 110, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--warning); font-weight:700; text-transform:uppercase;">Half Day</label>
                                    <h4 style="font-size:1.4rem; color:var(--warning); margin-top:4px;">${counts.halfday}</h4>
                                </div>
                                <div class="profile-attendance-stat" style="background:rgba(9, 132, 227, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(9, 132, 227, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--info); font-weight:700; text-transform:uppercase;">Holiday</label>
                                    <h4 style="font-size:1.4rem; color:var(--info); margin-top:4px;">${counts.holiday}</h4>
                                </div>
                            </div>
                        `;
            })()}
                    </div>
                </div>

                <!-- Right Side -->
                <div class="profile-main-column" style="display:flex; flex-direction:column; gap:2rem;">
                    <!-- Stats Grid -->
                    <div class="card profile-payment-card">
                        <div class="card-header"><h3>Payment Detail</h3></div>
                        <p style="margin:0 0 1rem; color:var(--text-muted); font-size:0.8rem; font-weight:600;">
                            Showing salary month: ${new Date(paymentYear, paymentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; margin-top:10px;">
                            <div style="background:var(--bg-main); padding:1.25rem; border-radius:15px; border:1px solid var(--border);">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Salary Type</label>
                                <h4 style="font-size:1.2rem; color:var(--primary); margin-top:4px;">${staff.salaryType}</h4>
                            </div>
                            <div style="background:var(--bg-main); padding:1.25rem; border-radius:15px; border:1px solid var(--border);">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Base Amount</label>
                                <h4 style="font-size:1.2rem; color:var(--success); margin-top:4px;">${StaffManager.formatSalaryAmountWithHold(baseAmount, backendHoldInfo)}</h4>
                                ${perDaySalary > 0 ? `<div style="font-size:0.74rem; color:var(--text-muted); font-weight:700; margin-top:5px;">Per day: &#8377;${perDaySalary.toLocaleString()}</div>` : ''}
                            </div>
                            <div style="background:var(--bg-main); padding:1.25rem; border-radius:15px; border:1px solid var(--border);">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Earn Salary</label>
                                <h4 style="font-size:1.2rem; color:var(--info); margin-top:4px;">&#8377;${earnedSalaryAfterHold.toLocaleString()}</h4>
                                ${attendanceCountBadges ? `<div style="font-size:0.68rem; font-weight:700; margin-top:4px; display:flex; gap:7px; align-items:center;">${attendanceCountBadges}</div>` : ''}
                                ${holdDeductionAmount > 0 ? `<div style="font-size:0.74rem; color:var(--danger); font-weight:700; margin-top:5px;">Hold: -&#8377;${holdDeductionAmount.toLocaleString()}</div>` : ''}
                            </div>
                            <div style="background:${hasAnyHold ? 'rgba(214, 48, 49, 0.05)' : 'var(--bg-main)'}; padding:1.25rem; border-radius:15px; border:1px solid ${hasAnyHold ? 'var(--danger)' : 'var(--border)'}; cursor:pointer; transition: all 0.2s ease;" 
                                 onclick="StaffManager.showHoldToggleModal('${staff.id}', '${paymentMonthKey}')">
                                <label style="font-size:0.65rem; color:${hasAnyHold ? 'var(--danger)' : 'var(--text-muted)'}; font-weight:700; text-transform:uppercase;">Hold Status</label>
                                <h4 style="font-size:1.2rem; color:${hasAnyHold ? 'var(--danger)' : 'var(--success)'}; margin-top:4px;">
                                    ${hasAnyHold
                ? `<i class="fas fa-lock"></i> Held (${displayHoldDays} D${displayHoldAmount > 0 ? ` | &#8377;${displayHoldAmount.toLocaleString()}` : ''})`
                : '<i class="fas fa-check-circle"></i> No Hold'}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <!-- Advance Payment Section -->
                    <div class="card profile-advance-card">
                        <div class="card-header" style="border-bottom:none; margin-bottom:0;">
                            <h3>Advance Payment</h3>
                            <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:#6c5ce7;" onclick="StaffManager.showAdvanceModal('${staff.id}')">
                                <i class="fas fa-plus"></i> Add Advance Payment
                            </button>
                        </div>
                        ${(() => {
                const staffAdvances = staffAofRows
                    .filter((entry) => ['advance', 'advance_paid'].includes(entry.type))
                    .map((entry) => ({
                        ...entry,
                        type: entry.type === 'advance' ? 'paid' : 'received'
                    }))
                    .sort((a, b) => {
                    const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
                    return dateCompare !== 0 ? dateCompare : Number(b.id || 0) - Number(a.id || 0);
                });
                const debitTotal = staffAdvances
                    .filter((entry) => entry.type === 'paid')
                    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
                const creditTotal = staffAdvances
                    .filter((entry) => entry.type === 'received')
                    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
                const balance = Math.max(0, debitTotal - creditTotal);
                const escapeAttr = (value) => String(value || '')
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                return `
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-top:1.25rem;">
                                <div style="background:rgba(108, 92, 231, 0.07); border:1px solid rgba(108, 92, 231, 0.22); padding:1rem; border-radius:14px;">
                                    <label style="font-size:0.65rem; color:#6c5ce7; font-weight:700; text-transform:uppercase;">Balance</label>
                                    <h4 style="font-size:1.35rem; color:#6c5ce7; margin-top:4px;">&#8377;${balance.toLocaleString()}</h4>
                                </div>
                                <div style="background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.18); padding:1rem; border-radius:14px;">
                                    <label style="font-size:0.65rem; color:var(--danger); font-weight:700; text-transform:uppercase;">Debit Given</label>
                                    <h4 style="font-size:1.35rem; color:var(--danger); margin-top:4px;">&#8377;${debitTotal.toLocaleString()}</h4>
                                </div>
                                <div style="background:rgba(0, 184, 148, 0.06); border:1px solid rgba(0, 184, 148, 0.18); padding:1rem; border-radius:14px;">
                                    <label style="font-size:0.65rem; color:var(--success); font-weight:700; text-transform:uppercase;">Credit Received</label>
                                    <h4 style="font-size:1.35rem; color:var(--success); margin-top:4px;">&#8377;${creditTotal.toLocaleString()}</h4>
                                </div>
                            </div>
                            <div class="table-responsive" style="max-height:280px; border:1px solid var(--border); border-radius:12px; margin-top:1.25rem;">
                                <table class="table-compact" style="font-size:0.85rem;">
                                    <thead style="position:sticky; top:0; z-index:1;">
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Remark</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${staffAdvances.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:1rem;">No advance payment records</td></tr>' :
                        staffAdvances.map((entry) => {
                            const isCredit = entry.type === 'received';
                            const meta = StaffManager.getLoanHistoryMeta(entry.type);
                            return `
                                                <tr>
                                                    <td data-label="Date"><span class="ledger-cell-value">${entry.date ? new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '-'}</span></td>
                                                    <td data-label="Type"><span class="ledger-cell-value"><span class="badge ${meta.badgeClass}" style="font-size:0.65rem; padding:4px 9px;">${meta.label}</span></span></td>
                                                    <td data-label="Amount" style="font-weight:700; color:${isCredit ? 'var(--success)' : 'var(--danger)'};"><span class="ledger-cell-value">${isCredit ? '+' : '-'}&#8377;${Number(entry.amount || 0).toLocaleString()}</span></td>
                                                    <td data-label="Remark" style="font-size:0.8rem; color:var(--text-muted); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeAttr(entry.remark)}"><span class="ledger-cell-value">${entry.remark || '-'}</span></td>
                                                    <td data-label="Action">
                                                        <div style="display:flex; gap:3px;">
                                                            <button class="btn-icon" style="width:28px; height:28px;" onclick="StaffManager.showEditAdvanceModal('${staff.id}', ${entry.id})"><i class="fas fa-edit" style="font-size:0.7rem;"></i></button>
                                                            <button class="btn-icon text-danger" style="width:28px; height:28px;" onclick="StaffManager.deleteAdvance('${staff.id}', ${entry.id})"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
            })()}
                    </div>

                    <!-- Financial Logs Section (Payment Deduction & Overtime) -->
                    <div class="card profile-finance-card">
                        <div class="card-header" style="border-bottom:none; margin-bottom:0;">
                            <h3>Financial Logs</h3>
                            <div class="profile-finance-actions" style="display:flex; gap:10px;">
                                <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:var(--danger);" onclick="StaffManager.showDeductionModal('${staff.id}')">
                                    <i class="fas fa-plus"></i> Add Payment Deduction
                                </button>
                                <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:var(--success);" onclick="StaffManager.showOvertimeModal('${staff.id}')">
                                    <i class="fas fa-plus"></i> Add Overtime
                                </button>
                            </div>
                        </div>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:1.5rem;">
                            <!-- Payment Deduction Column -->
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <h4 style="font-size:0.9rem; color:var(--danger);">Payment Deduction History</h4>
                                    ${(() => {
                const staffFines = staffAofRows.filter((entry) => ['fine', 'deduction'].includes(entry.type));
                const totalFine = staffFines.reduce((sum, f) => sum + f.amount, 0);
                return `<span style="font-size:0.8rem; font-weight:700; color:var(--danger);">Total: &#8377;${totalFine.toLocaleString()}</span>`;
            })()}
                                </div>
                                <div class="table-responsive" style="max-height:250px; border:1px solid var(--border); border-radius:12px;">
                                    <table class="table-compact" style="font-size:0.85rem;">
                                        <thead style="position:sticky; top:0; z-index:1;">
                                            <tr>
                                                <th>Date</th>
                                                <th>Amt</th>
                                                <th>Remark</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${(() => {
                const staffFines = staffAofRows.filter((entry) => ['fine', 'deduction'].includes(entry.type));
                return staffFines.length === 0 ? '<tr><td colspan="4" style="text-align:center">No records</td></tr>' :
                    staffFines.sort((a, b) => b.id - a.id).map(f => `
                                                        <tr>
                                                            <td data-label="Date"><span class="ledger-cell-value">${f.date ? new Date(`${f.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}</span></td>
                                                            <td data-label="Amount" style="font-weight:700; color:var(--danger);"><span class="ledger-cell-value">&#8377;${f.amount}</span></td>
                                                            <td data-label="Remark" style="font-size:0.8rem; color:var(--text-muted); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${f.remark || ''}"><span class="ledger-cell-value">${f.remark || '-'}</span></td>
                                                            <td data-label="Action">
                                                                <div style="display:flex; gap:3px;">
                                                                    <button class="btn-icon" style="width:28px; height:28px;" onclick="StaffManager.showEditFineModal('${staff.id}', ${f.id})"><i class="fas fa-edit" style="font-size:0.7rem;"></i></button>
                                                                    <button class="btn-icon text-danger" style="width:28px; height:28px;" onclick="StaffManager.deleteFine('${staff.id}', ${f.id})"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    `).join('');
            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Overtime Column -->
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <h4 style="font-size:0.9rem; color:var(--success);">Overtime History</h4>
                                    ${(() => {
                const staffOT = staffAofRows.filter((entry) => entry.type === 'overtime');
                const totalOT = staffOT.reduce((sum, f) => sum + f.amount, 0);
                return `<span style="font-size:0.8rem; font-weight:700; color:var(--success);">Total: &#8377;${totalOT.toLocaleString()}</span>`;
            })()}
                                </div>
                                <div class="table-responsive" style="max-height:250px; border:1px solid var(--border); border-radius:12px;">
                                    <table class="table-compact" style="font-size:0.85rem;">
                                        <thead style="position:sticky; top:0; z-index:1;">
                                            <tr>
                                                <th>Date</th>
                                                <th>Amt</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${(() => {
                const staffOT = staffAofRows.filter((entry) => entry.type === 'overtime');
                return staffOT.length === 0 ? '<tr><td colspan="3" style="text-align:center">No records</td></tr>' :
                    staffOT.sort((a, b) => b.id - a.id).map(ot => `
                                                        <tr>
                                                            <td data-label="Date"><span class="ledger-cell-value">${ot.date ? new Date(`${ot.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}</span></td>
                                                            <td data-label="Amount" style="font-weight:700; color:var(--success);"><span class="ledger-cell-value">&#8377;${ot.amount}</span></td>
                                                            <td data-label="Action">
                                                                <div style="display:flex; gap:3px;">
                                                                    <button class="btn-icon" style="width:28px; height:28px;" onclick="StaffManager.showEditOvertimeModal('${staff.id}', ${ot.id})"><i class="fas fa-edit" style="font-size:0.7rem;"></i></button>
                                                                    <button class="btn-icon text-danger" style="width:28px; height:28px;" onclick="StaffManager.deleteOvertime('${staff.id}', ${ot.id})"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    `).join('');
            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Section -->
                    <div class="card profile-calendar-card" style="padding: 1.5rem;">
                        <div class="card-header" style="margin-bottom: 2rem;">
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <div style="background:var(--primary); color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                                <div>
                                    <h3 style="margin:0;">Attendance Report</h3>
                                    <p style="font-size:0.75rem; color:var(--text-muted); margin:0;">Daily tracking for ${new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            ${StaffManager.getProfileMonthPickerHtml(staffId, month, year, false)}
                        </div>
                        
                        <!-- Visual Calendar View -->
                        <div class="mini-calendar" style="margin-bottom: 2rem; background:var(--bg-main); border:1px solid var(--border); border-radius:16px; padding: 1.5rem;">
                            <div class="cal-header" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 1rem;">
                                ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${d}</span>`).join('')}
                            </div>
                            <div class="cal-body" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                                ${(() => {
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                let cells = [];
                // Empty cells for previous month
                for (let i = 0; i < firstDay; i++) cells.push('<div class="cal-cell empty" style="aspect-ratio:1/1;"></div>');
                // Day cells
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const status = (attendance[dateStr] || {})[staffId] || 'none';

                    let bgColor = 'transparent';
                    let textColor = 'var(--text-muted)';
                    let border = '1px solid rgba(0,0,0,0.05)';

                    if (status === 'present') {
                        bgColor = 'var(--success)';
                        textColor = '#fff';
                        border = 'none';
                    } else if (status === 'absent') {
                        bgColor = 'var(--danger)';
                        textColor = '#fff';
                        border = 'none';
                    } else if (status === 'halfday') {
                        bgColor = 'var(--warning)';
                        textColor = '#fff';
                        border = 'none';
                    } else if (status === 'holiday') {
                        bgColor = 'var(--info)';
                        textColor = '#fff';
                        border = 'none';
                    }

                    cells.push(`
                                        <div class="cal-cell" 
                                            onclick="StaffManager.showMarkAttendanceModal('${staffId}', '${dateStr}')"
                                            style="aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; border-radius:10px; background:${bgColor}; color:${textColor}; font-weight:700; font-size:0.85rem; border:${border}; cursor:pointer; transition: all 0.2s ease;">
                                            ${d}
                                        </div>
                                    `);
                }
                return cells.join('');
            })()}
                            </div>
                        </div>

                        <!-- Table View -->
                        <div class="table-responsive profile-attendance-table-wrap" style="max-height:400px; border:1px solid var(--border); border-radius:12px;">
                            <table class="profile-attendance-table">
                                <thead>
                                    <tr>
                                        <th style="background:var(--bg-main); position:sticky; top:0; z-index:1;">Date</th>
                                        <th style="background:var(--bg-main); position:sticky; top:0; z-index:1;">Status</th>
                                        <th style="background:var(--bg-main); position:sticky; top:0; z-index:1;">Day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(() => {
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = [];

                for (let d = daysInMonth; d >= 1; d--) {
                    const date = new Date(year, month, d);
                    // Only show if the date is not in the future
                    if (date > today) continue;

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const status = (attendance[dateStr] || {})[staffId] || 'absent';
                    days.push({ date: dateStr, status });
                }
                return days.map(a => `
                                            <tr>
                                                <td style="font-weight:600;">${new Date(a.date).toLocaleDateString('en-GB')}</td>
                                                <td>
                                                    <span class="badge ${a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-danger' : a.status === 'halfday' ? 'badge-warning' : 'badge-info'}" style="font-size:0.65rem; padding:4px 10px;">
                                                        ${a.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style="color:var(--text-muted); font-size:0.8rem;">${new Date(a.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                                            </tr>
                                        `).join('');
            })()}
                                </tbody>
                            </table>
                        </div>
                        </div>

                        <!-- Print Only Signatures -->
                        <div class="print-only-signatures">
                            <div class="sig-box">
                                <div class="sig-line"></div>
                                <p style="font-size: 0.8rem; font-weight: 700;">Accountant / Manager</p>
                            </div>
                            <div class="sig-box">
                                <div class="sig-line"></div>
                                <p style="font-size: 0.8rem; font-weight: 700;">Staff Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    showAddStaffModal: () => {
        const content = `
            <form id="add-staff-form" data-mode="add" onsubmit="StaffManager.handleAddStaff(event, this.dataset.editId || null)">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div id="photo-preview-container" style="position:relative; width:100px; height:100px; margin:0 auto; border-radius:30%; overflow:hidden; border:2px dashed var(--primary); display:flex; align-items:center; justify-content:center; background:rgba(62, 39, 35, 0.05); cursor:pointer;" onclick="document.getElementById('staff-photo-input-gallery').click()">
                        <img id="staff-photo-preview" src="" alt="Selected staff photo preview" style="width:100%; height:100%; object-fit:cover; display:none;">
                        <div id="photo-placeholder" style="text-align:center; color:var(--primary);">
                            <i class="fa-solid fa-camera" style="font-size:2rem; display:block; margin-bottom:5px;"></i>
                            <span style="font-size:0.7rem; font-weight:700; letter-spacing:0.5px;">ADD PHOTO</span>
                        </div>
                    </div>
                    <div style="margin-top:12px; display:flex; justify-content:center; gap:10px;">
                         <button type="button" class="btn-outline" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; border-color:var(--primary); color:var(--primary); background:rgba(62, 39, 35, 0.05);" onclick="document.getElementById('staff-photo-input-camera').click()">
                            <i class="fas fa-camera"></i> Camera
                         </button>
                         <button type="button" class="btn-outline" style="padding:8px 12px; font-size:0.75rem; border-radius:10px;" onclick="document.getElementById('staff-photo-input-gallery').click()">
                            <i class="fas fa-image"></i> Gallery
                         </button>
                    </div>
                    <!-- Hidden Inputs -->
                    <input type="file" id="staff-photo-input-camera" accept="image/*" capture="environment" style="display:none;" onchange="StaffManager.handlePhotoPreview(this)">
                    <input type="file" id="staff-photo-input-gallery" accept="image/*" style="display:none;" onchange="StaffManager.handlePhotoPreview(this)">
                    <input type="hidden" id="staff-photo-data">
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Full Name</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user"></i>
                            <input type="text" id="staff-name" required placeholder="Employee Name">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Father's Name</label>
                        <div class="input-wrapper">
                            <i class="fas fa-users"></i>
                            <input type="text" id="staff-father-name" placeholder="Optional">
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Mobile Number</label>
                        <div class="input-wrapper">
                            <i class="fas fa-phone-alt"></i>
                            <input type="tel" id="staff-mobile" pattern="[0-9]{10}" placeholder="10 Digit Number">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Date of Birth</label>
                        <div class="input-wrapper">
                            <i class="fas fa-birthday-cake"></i>
                            <input type="date" id="staff-dob" class="date-input">
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Designation / Role (Optional)</label>
                        <div class="input-wrapper">
                            <i class="fas fa-briefcase"></i>
                            <input type="text" id="staff-role" placeholder="e.g. Chef, Waiter">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Joining Date</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar-day"></i>
                            <input type="text" id="staff-join-date" class="date-input" required>
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Status</label>
                        <div class="input-wrapper">
                            <i class="fas fa-info-circle"></i>
                            <select id="staff-status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Salary Type</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar-alt"></i>
                            <select id="staff-salary-type">
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly" selected>Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="input-group">
                    <label>Base Salary Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="staff-salary-amount" required placeholder="0.00">
                    </div>
                </div>

                <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                    <button type="submit" class="btn-primary full-width">Save Staff</button>
                </div>
            </form>
        `;
        ModalManager.show('Add New Staff', content);

        // Initialize Custom Dropdowns & Datepicker
        setTimeout(() => {
            setupCustomDropdown('staff-status');
            setupCustomDropdown('staff-salary-type');
            StaffManager.initDatePicker("#staff-join-date", {
                defaultDate: "today",
                dateFormat: "Y-m-d"
            });
        }, 50);
    },

    handlePhotoPreview: (input) => {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('staff-photo-preview').src = e.target.result;
                document.getElementById('staff-photo-preview').style.display = 'block';
                document.getElementById('photo-placeholder').style.display = 'none';
                document.getElementById('staff-photo-data').value = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    },

    showPhotoUploadModal: (id) => {
        const staff = (StorageManager.get('staff') || []).find(s => s.id === id);
        if (!staff) return;

        const content = `
            <form id="photo-upload-form" onsubmit="StaffManager.handlePhotoUploadSubmit(event, '${id}')">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div style="position:relative; width:120px; height:120px; margin:0 auto; border-radius:28px; overflow:hidden; border:2px dashed var(--primary); display:flex; align-items:center; justify-content:center; background:rgba(62, 39, 35, 0.05);">
                        <img id="staff-photo-upload-preview" src="${staff.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(staff.name), '3E2723', 'fff', 120)}" alt="${staff.name} profile photo preview" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(staff.name)}', '3E2723', 'fff', 120)" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <p style="margin:1rem 0 0; color:var(--text-muted); font-weight:600;">${staff.name}</p>
                </div>

                <div style="display:flex; justify-content:center; gap:10px; margin-bottom:1rem;">
                    <button type="button" class="btn-outline" style="padding:10px 14px; border-radius:12px;" onclick="document.getElementById('staff-photo-upload-camera').click()">
                        <i class="fas fa-camera"></i> Camera
                    </button>
                    <button type="button" class="btn-outline" style="padding:10px 14px; border-radius:12px;" onclick="document.getElementById('staff-photo-upload-gallery').click()">
                        <i class="fas fa-image"></i> Gallery
                    </button>
                </div>

                <input type="file" id="staff-photo-upload-camera" accept="image/*" capture="environment" style="display:none;" onchange="StaffManager.previewPhotoUpload(this, '${encodeURIComponent(staff.name)}')">
                <input type="file" id="staff-photo-upload-gallery" accept="image/*" style="display:none;" onchange="StaffManager.previewPhotoUpload(this, '${encodeURIComponent(staff.name)}')">

                <button type="submit" class="btn-primary full-width">Upload Photo</button>
            </form>
        `;

        ModalManager.show(`Update Photo - ${staff.name}`, content);
    },

    previewPhotoUpload: (input, encodedName) => {
        const file = input.files[0];
        const preview = document.getElementById('staff-photo-upload-preview');

        if (!file || !preview) {
            if (preview) {
                window.PhotoHelper.applyFallback(preview, encodedName, '3E2723', 'fff', 120);
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    handlePhotoUploadSubmit: async (e, id) => {
        e.preventDefault();
        const selectedFile = document.getElementById('staff-photo-upload-camera').files[0]
            || document.getElementById('staff-photo-upload-gallery').files[0];

        if (!selectedFile) {
            window.showAlert('Please select a photo first');
            return;
        }

        try {
            await ApiClient.uploadEmployeeImage(id, selectedFile);
            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const container = document.getElementById('view-container');
            if (window.currentView === 'staff' && container) {
                await StaffManager.renderStaffList(container);
            } else if (window.currentView === 'staff-profile' && container) {
                const profileMonthPicker = document.getElementById('profile-month-picker');
                if (profileMonthPicker) {
                    const [y, m] = profileMonthPicker.value.split('-');
                    await StaffManager.renderProfilePage(container, id, parseInt(m, 10) - 1, parseInt(y, 10));
                }
            } else if (window.currentView === 'attendance') {
                await AttendanceManager.loadAttendanceList();
            } else if (window.currentView === 'salary') {
                await SalaryManager.refreshSalaryList();
            } else if (window.currentView === 'reports' && container) {
                await ReportsManager.renderReports(container);
            }

            window.showAlert('Photo uploaded successfully');
        } catch (error) {
            window.showAlert(error.message || 'Failed to upload photo');
        }
    },

    showEditStaffModal: (id) => {
        const staff = (StorageManager.get('staff') || []).find(s => s.id === id);
        if (!staff) return;

        StaffManager.showAddStaffModal();
        document.getElementById('modal-title').textContent = 'Edit Staff Member';

        const form = document.getElementById('add-staff-form');
        form.dataset.editId = String(id);
        form.dataset.mode = 'edit';

        const setValue = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (!element) return;
            element.value = value ?? '';
            element.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const applyEditValues = () => {
            setValue('staff-name', staff.name);
            setValue('staff-father-name', staff.fatherName || '');
            setValue('staff-mobile', staff.mobile || '');
            setValue('staff-role', staff.role || '');
            setValue('staff-dob', staff.dob || '');
            setValue('staff-status', staff.status || 'active');
            setValue('staff-salary-type', staff.salaryType || 'Monthly');
            setValue('staff-salary-amount', staff.salaryAmount || 0);

            const joinDateInput = document.getElementById('staff-join-date');
            if (joinDateInput?._flatpickr) {
                joinDateInput._flatpickr.setDate(staff.joinDate || new Date(), true, 'Y-m-d');
            } else {
                setValue('staff-join-date', staff.joinDate || '');
            }

            if (staff.photo) {
                const preview = document.getElementById('staff-photo-preview');
                const placeholder = document.getElementById('photo-placeholder');
                const photoData = document.getElementById('staff-photo-data');
                if (preview) {
                    preview.src = staff.photo;
                    preview.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                if (photoData) photoData.value = staff.photo;
            }
        };

        setTimeout(applyEditValues, 80);
    },

    handleAddStaff: async (e, id = null) => {
        e.preventDefault();
        id = id || e.target?.dataset?.editId || null;
        if (e.target?.dataset?.mode === 'edit' && !id) {
            window.showAlert('Edit staff id missing hai. Duplicate create block kar diya.');
            return;
        }
        if (StaffManager._isSavingStaff) return;

        const submitButton = e.target?.querySelector('button[type="submit"]');
        StaffManager._isSavingStaff = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.dataset.originalText = submitButton.textContent;
            submitButton.textContent = id ? 'Updating...' : 'Saving...';
        }

        const newStaff = {
            name: document.getElementById('staff-name').value,
            father_name: document.getElementById('staff-father-name').value,
            mobile: document.getElementById('staff-mobile').value,
            alternate_mobile: document.getElementById('staff-mobile-alt')?.value || undefined,
            date_of_birth: document.getElementById('staff-dob').value,
            role: document.getElementById('staff-role').value,
            join_date: document.getElementById('staff-join-date').value,
            status: document.getElementById('staff-status').value,
            monthly_salary: parseFloat(document.getElementById('staff-salary-amount').value) || 0
        };

        const selectedFile = document.getElementById('staff-photo-input-camera').files[0]
            || document.getElementById('staff-photo-input-gallery').files[0];

        try {
            if (!id) {
                const existingStaff = StaffManager.findExistingStaffByNameMobile(newStaff.name, newStaff.mobile);
                if (existingStaff) {
                    window.showAlert(`Ye staff already exist karta hai: ${existingStaff.name}`);
                    return;
                }
            }

            const employee = id
                ? await ApiClient.updateEmployee(id, newStaff)
                : await ApiClient.createEmployee(newStaff);

            const employeeId = String(employee?.id || id);
            let autoHoldResult = null;

            if (selectedFile && employeeId) {
                await ApiClient.uploadEmployeeImage(employeeId, selectedFile);
            }

            if (!id && employeeId) {
                autoHoldResult = await StaffManager.applyDefaultHoldForNewStaff(employeeId, newStaff.join_date);
            }

            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const container = document.getElementById('view-container');
            if (window.currentView === 'salary') {
                await SalaryManager.refreshSalaryList();
            } else if (window.currentView === 'staff-profile' && container) {
                const profileMonthPicker = document.getElementById('profile-month-picker');
                if (profileMonthPicker && employeeId) {
                    const [y, m] = profileMonthPicker.value.split('-');
                    await StaffManager.renderProfilePage(container, employeeId, parseInt(m, 10) - 1, parseInt(y, 10));
                }
            } else if (window.currentView === 'attendance') {
                await AttendanceManager.loadAttendanceList();
            } else if (window.currentView === 'reports' && container) {
                await ReportsManager.renderReports(container);
            } else if (container) {
                await StaffManager.renderStaffList(container);
            }

            if (id) {
                window.showAlert('Staff updated');
                return;
            }

            if (autoHoldResult?.applied) {
                const holdMessage = `Staff added. Auto hold set for ${autoHoldResult.holdDays} days.`;
                window.showAlert(autoHoldResult.warning ? `${holdMessage} ${autoHoldResult.warning}` : holdMessage);
                return;
            }

            window.showAlert(autoHoldResult?.warning || 'Staff added');
        } catch (error) {
            window.showAlert(error.message || 'Failed to save staff');
        } finally {
            StaffManager._isSavingStaff = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitButton.dataset.originalText || 'Save Staff';
                delete submitButton.dataset.originalText;
            }
        }
    },

    toggleStaffStatus: async (id) => {
        const staff = StorageManager.get('staff') || [];
        const index = staff.findIndex(s => s.id === id);
        if (index !== -1) {
            const newStatus = staff[index].status === 'active' ? 'inactive' : 'active';
            try {
                await ApiClient.updateEmployee(id, { status: newStatus });
                await ApiSyncManager.bootstrap(true);
                StaffManager.renderStaffList(document.getElementById('view-container'));
                window.showAlert('Status updated');
            } catch (error) {
                window.showAlert(error.message || 'Failed to update status');
            }
        }
    },

    deleteStaff: async (id) => {
        const isConfirmed = await ConfirmManager.ask('Are you sure? This will remove all records for this staff.');
        if (!isConfirmed) return;

        try {
            await ApiClient.deleteEmployee(id);
            await ApiSyncManager.bootstrap(true);
            StaffManager.renderStaffList(document.getElementById('view-container'));
            window.showAlert('Staff deleted');
        } catch (error) {
            window.showAlert(error.message || 'Failed to delete staff');
        }
    },

    showAdvanceModal: (staffId) => {
        const content = `
            <form id="advance-form" onsubmit="StaffManager.handleAdvanceSubmit(event, '${staffId}')">
                <div id="advance-ledger-status" style="margin-bottom:1rem;"></div>
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="adv-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Transaction Type</label>
                    <div class="input-wrapper">
                        <i class="fas fa-exchange-alt"></i>
                        <select id="adv-type">
                            <option value="paid">Debit - Given to Staff</option>
                            <option value="received">Credit - Received from Staff</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="adv-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remark (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="adv-remark" placeholder="e.g. Urgent help, Medical">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Save Record</button>
                </div>
            </form>
        `;
        ModalManager.show('Advance Payment', content);

        // Initialize custom UI elements
        setTimeout(() => {
            setupCustomDropdown('adv-type');
            StaffManager.initDatePicker("#adv-date", {
                defaultDate: "today",
                dateFormat: "Y-m-d"
            });
            StaffManager.refreshAdvanceModalSummary(staffId);
        }, 50);
    },

    showEditAdvanceModal: (staffId, advId) => {
        const advances = StorageManager.get('advances') || {};
        const record = (advances[staffId] || []).find(a => a.id === advId);
        if (!record) return;

        StaffManager.showAdvanceModal(staffId);
        document.getElementById('modal-title').textContent = 'Edit Advance Payment';
        document.getElementById('adv-amount').value = record.amount;
        document.getElementById('adv-type').value = record.type;
        document.getElementById('adv-date').value = record.date;
        document.getElementById('adv-remark').value = record.remark || '';

        const form = document.getElementById('advance-form');
        form.onsubmit = (e) => StaffManager.handleAdvanceSubmit(e, staffId, advId);
    },

    handleAdvanceSubmit: async (e, staffId, editId = null) => {
        e.preventDefault();
        const amount = StaffManager.getPositiveAmount('adv-amount', 'Loan/advance amount');
        if (amount === null) return;
        const transactionType = document.getElementById('adv-type').value;
        let summary = null;
        try {
            summary = await StaffManager.getLedgerSummary(staffId);
        } catch (error) {
            window.showAlert(error.message || 'Backend advance summary load nahi ho payi');
            return;
        }
        const existingEntries = (StorageManager.get('advances') || {})[staffId] || [];
        const existingRecord = editId ? existingEntries.find((entry) => Number(entry.id) === Number(editId)) : null;
        const editableCreditAllowance = existingRecord?.type === 'received' ? Number(existingRecord.amount || 0) : 0;
        const availableCreditBalance = Number(summary.loanBalance || 0) + editableCreditAllowance;

        if (transactionType === 'received') {
            if (availableCreditBalance <= 0) {
                window.showAlert('Advance balance nahi hai, credit receive nahi ho sakta');
                return;
            }

            if (amount > availableCreditBalance) {
                window.showAlert(`Credit amount advance balance se zyada nahi ho sakta. Available: ₹${availableCreditBalance.toLocaleString()}`);
                return;
            }
        }

        const apiData = {
            employee_id: Number(staffId),
            amount,
            type: transactionType === 'paid' ? 'advance' : 'advance_paid',
            date: document.getElementById('adv-date').value,
            notes: document.getElementById('adv-remark').value,
            repay_months: 1
        };

        try {
            if (editId) {
                await ApiClient.updateAof(editId, apiData);
            } else {
                await ApiClient.createAof(apiData);
            }

            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const picker = document.getElementById('profile-month-picker');
                if (picker) {
                    const [y, m] = picker.value.split('-');
                    await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId, parseInt(m, 10) - 1, parseInt(y, 10));
                } else {
                    await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId);
                }
            }

            window.showAlert(editId ? 'Advance payment updated' : 'Advance payment saved');
        } catch (error) {
            window.showAlert(error.message || 'Failed to save advance');
        }
    },

    deleteAdvance: async (staffId, advId) => {
        const isConfirmed = await ConfirmManager.ask('Delete this record?');
        if (!isConfirmed) return;

        try {
            await ApiClient.deleteAof(advId);
            await ApiSyncManager.bootstrap(true);

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const picker = document.getElementById('profile-month-picker');
                if (picker) {
                    const [y, m] = picker.value.split('-');
                    await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId, parseInt(m, 10) - 1, parseInt(y, 10));
                } else {
                    await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId);
                }
            }

            window.showAlert('Advance payment deleted');
        } catch (error) {
            window.showAlert(error.message || 'Failed to delete record');
        }
    },

    showSavingModal: (staffId, mode = 'deposit') => {
        const content = `
            <form id="saving-form" onsubmit="StaffManager.handleSavingSubmit(event, '${staffId}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="saving-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Saving Type</label>
                    <div class="input-wrapper">
                        <i class="fas fa-piggy-bank"></i>
                        <select id="saving-type">
                            <option value="deposit" ${mode === 'deposit' ? 'selected' : ''}>Deposit</option>
                            <option value="withdraw" ${mode === 'withdraw' ? 'selected' : ''}>Withdraw</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="saving-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remark (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="saving-remark" placeholder="e.g. Monthly saving">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width" style="background:var(--success);">Save Saving</button>
                </div>
            </form>
        `;
        ModalManager.show('Manage Saving', content);

        setTimeout(() => {
            setupCustomDropdown('saving-type');
            StaffManager.initDatePicker('#saving-date', {
                defaultDate: 'today',
                dateFormat: 'Y-m-d'
            });
        }, 50);
    },

    showEditSavingModal: (staffId, savingId) => {
        const savings = StorageManager.get('savings') || {};
        const record = (savings[staffId] || []).find((entry) => entry.id === savingId);
        if (!record) return;

        StaffManager.showSavingModal(staffId, record.type);
        document.getElementById('modal-title').textContent = 'Edit Saving Record';
        document.getElementById('saving-amount').value = record.amount;
        document.getElementById('saving-type').value = record.type;
        document.getElementById('saving-date').value = record.date;
        document.getElementById('saving-remark').value = record.remark || '';

        const form = document.getElementById('saving-form');
        form.onsubmit = (e) => StaffManager.handleSavingSubmit(e, staffId, savingId);
    },

    handleSavingSubmit: async (e, staffId, editId = null) => {
        e.preventDefault();
        const amount = StaffManager.getPositiveAmount('saving-amount', 'Saving amount');
        if (amount === null) return;
        const savingType = document.getElementById('saving-type').value;
        const ledger = StaffManager.getLoanAndSavingState(staffId);

        if (savingType === 'withdraw') {
            if (ledger.savingBalance <= 0) {
                window.showAlert('Saving master me balance nahi hai, withdraw nahi ho sakta');
                return;
            }

            if (amount > ledger.savingBalance) {
                window.showAlert(`Withdraw amount saving balance se zyada nahi ho sakta. Available: &#8377;${ledger.savingBalance.toLocaleString()}`);
                return;
            }
        }

        const type = savingType === 'withdraw' ? 'saving_withdraw' : 'saving_deposit';
        const apiData = {
            employee_id: Number(staffId),
            amount,
            type,
            date: document.getElementById('saving-date').value,
            notes: document.getElementById('saving-remark').value,
            repay_months: 1
        };

        try {
            if (editId) {
                await ApiClient.updateAof(editId, apiData);
            } else {
                await ApiClient.createAof(apiData);
            }

            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId);
            }

            window.showAlert(editId ? 'Saving updated' : 'Saving recorded');
        } catch (error) {
            window.showAlert(error.message || 'Failed to save saving entry');
        }
    },

    deleteSaving: async (staffId, savingId) => {
        const isConfirmed = await ConfirmManager.ask('Delete this saving record?');
        if (!isConfirmed) return;

        try {
            await ApiClient.deleteAof(savingId);
            await ApiSyncManager.bootstrap(true);

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId);
            }

            window.showAlert('Saving record deleted');
        } catch (error) {
            window.showAlert(error.message || 'Failed to delete saving record');
        }
    },

    showTransferModal: (staffId) => {
        const ledger = StaffManager.getLoanAndSavingState(staffId);
        const content = `
            <form id="transfer-form" onsubmit="StaffManager.handleTransferSubmit(event, '${staffId}')">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:1rem;">
                    <div style="padding:12px; border-radius:12px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.2);">
                        <div style="font-size:0.75rem; font-weight:700; color:var(--danger); text-transform:uppercase;">Loan Balance</div>
                        <div style="font-size:1.1rem; font-weight:700; color:var(--danger);">&#8377;${ledger.loanBalance.toLocaleString()}</div>
                    </div>
                    <div style="padding:12px; border-radius:12px; background:rgba(0, 184, 148, 0.06); border:1px solid rgba(0, 184, 148, 0.2);">
                        <div style="font-size:0.75rem; font-weight:700; color:var(--success); text-transform:uppercase;">Saving Balance</div>
                        <div style="font-size:1.1rem; font-weight:700; color:var(--success);">&#8377;${ledger.savingBalance.toLocaleString()}</div>
                    </div>
                </div>
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="transfer-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Direction</label>
                    <div class="input-wrapper">
                        <i class="fas fa-right-left"></i>
                        <select id="transfer-direction">
                            <option value="loan_to_saving">Loan Master to Saving Master</option>
                            <option value="saving_to_loan">Saving Master to Loan Master</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="transfer-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remark (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="transfer-remark" placeholder="e.g. Shift excess fund">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Transfer Fund</button>
                </div>
            </form>
        `;
        ModalManager.show('Transfer Between Masters', content);

        setTimeout(() => {
            setupCustomDropdown('transfer-direction');
            StaffManager.initDatePicker('#transfer-date', {
                defaultDate: 'today',
                dateFormat: 'Y-m-d'
            });
        }, 50);
    },

    handleTransferSubmit: async (e, staffId) => {
        e.preventDefault();
        const amount = StaffManager.getPositiveAmount('transfer-amount', 'Transfer amount');
        if (amount === null) return;

        try {
            await ApiClient.transferFund({
                employee_id: Number(staffId),
                amount,
                direction: document.getElementById('transfer-direction').value,
                date: document.getElementById('transfer-date').value,
                notes: document.getElementById('transfer-remark').value
            });

            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId);
            }

            window.showAlert('Fund transferred successfully');
        } catch (error) {
            window.showAlert(error.message || 'Failed to transfer fund');
        }
    },

    showMarkAttendanceModal: (staffId, date) => {
        const attendance = StorageManager.get('attendance') || {};
        const currentStatus = (attendance[date] || {})[staffId] || 'absent';
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        const content = `
            <div style="text-align:center; padding:10px;">
                <p style="color:var(--text-muted); margin-bottom:1.5rem;">Marking attendance for: <br><strong>${formattedDate}</strong></p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${staffId}', '${date}', 'present')" 
                        style="border-color:var(--success); color:var(--success); background:${currentStatus === 'present' ? 'rgba(0, 184, 148, 0.1)' : 'transparent'};">
                        <i class="fas fa-check-circle" style="margin-right:8px;"></i> Present
                    </button>
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${staffId}', '${date}', 'absent')" 
                        style="border-color:var(--danger); color:var(--danger); background:${currentStatus === 'absent' ? 'rgba(214, 48, 49, 0.1)' : 'transparent'};">
                        <i class="fas fa-times-circle" style="margin-right:8px;"></i> Absent
                    </button>
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${staffId}', '${date}', 'halfday')" 
                        style="border-color:var(--warning); color:var(--warning); background:${currentStatus === 'halfday' ? 'rgba(253, 203, 110, 0.1)' : 'transparent'};">
                        <i class="fas fa-adjust" style="margin-right:8px;"></i> Half Day
                    </button>
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${staffId}', '${date}', 'holiday')" 
                        style="border-color:var(--info); color:var(--info); background:${currentStatus === 'holiday' ? 'rgba(9, 132, 227, 0.1)' : 'transparent'};">
                        <i class="fas fa-mug-hot" style="margin-right:8px;"></i> Weekly Off
                    </button>
                </div>
            </div>
        `;
        ModalManager.show('Mark Attendance', content);
    },

    handleMarkAttendance: async (staffId, date, status) => {
        const attendance = StorageManager.get('attendance') || {};
        if (!attendance[date]) attendance[date] = {};
        const previousStatus = attendance[date][staffId];
        attendance[date][staffId] = status;
        ApiSyncManager.primeAttendanceDay(date, attendance[date]);
        window.SyncStatus?.show('Saving attendance...', 'saving');

        const d = new Date(`${date}T00:00:00`);
        ModalManager.hide();

        try {
            await ApiClient.saveAttendance({
                employee_id: Number(staffId),
                date,
                status: ApiSyncManager.statusToApi(status)
            });

            ApiSyncManager.primeAttendanceDay(date, attendance[date]);
            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId, d.getMonth(), d.getFullYear());
            }

            window.SyncStatus?.show(`Attendance saved for ${new Date(date).toLocaleDateString()}`, 'success', 1600);
            window.showAlert(`Status updated for ${new Date(date).toLocaleDateString()}`);
        } catch (error) {
            const latestAttendance = StorageManager.get('attendance') || {};
            if (!latestAttendance[date]) latestAttendance[date] = {};

            if (previousStatus) {
                latestAttendance[date][staffId] = previousStatus;
            } else {
                delete latestAttendance[date][staffId];
            }

            ApiSyncManager.primeAttendanceDay(date, latestAttendance[date]);

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId, d.getMonth(), d.getFullYear());
            }

            window.SyncStatus?.show('Attendance sync failed', 'error', 2800);
            window.showAlert(error.message || 'Failed to update attendance');
        }
    },

    showQuickSalaryActionModal: (staffId) => {
        const staff = (StorageManager.get('staff') || []).find(s => s.id === staffId);
        if (!staff) return;

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const localPendingHold = StaffManager.getLocalPendingHold(staffId, staff.salaryAmount);
        const isHeld = Number(localPendingHold.days || 0) > 0;

        const content = `
            <div class="quick-salary-modal" style="padding:10px;">
                <p class="quick-salary-subtitle" style="text-align:center; color:var(--text-muted); margin-bottom:1.5rem;">Quick adjustment for <strong>${staff.name}</strong></p>
                
                <div class="quick-salary-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:15px; margin-bottom:2rem;">
                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:rgba(108, 92, 231, 0.25); color:#6c5ce7; background:rgba(108, 92, 231, 0.07); transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showAdvanceModal('${staffId}')">
                        <i class="fas fa-wallet" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">Advance Payment</span>
                    </button>

                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:rgba(214, 48, 49, 0.2); color:var(--danger); background:rgba(214, 48, 49, 0.08); transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showDeductionModal('${staffId}')">
                        <i class="fas fa-minus-circle" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">Payment Deduction</span>
                    </button>
                    
                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:rgba(0, 184, 148, 0.2); color:var(--success); background:rgba(0, 184, 148, 0.05); transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showOvertimeModal('${staffId}')">
                        <i class="fas fa-clock" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">Overtime</span>
                    </button>

                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:${isHeld ? 'var(--danger)' : 'rgba(99, 110, 114, 0.2)'}; color:${isHeld ? 'var(--danger)' : 'var(--text-muted)'}; background:${isHeld ? 'rgba(214, 48, 49, 0.05)' : 'rgba(99, 110, 114, 0.05)'}; transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showHoldToggleModal('${staffId}', '${monthKey}')">
                        <i class="fas ${isHeld ? 'fa-lock' : 'fa-play-circle'}" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">${isHeld ? 'Held (Manage)' : 'Hold Salary'}</span>
                    </button>
                </div>

                <div class="quick-salary-note" style="background:var(--bg-main); padding:1rem; border-radius:12px; border:1px solid var(--border); display:flex; gap:12px; align-items:start;">
                    <i class="fas fa-info-circle" style="color:var(--info); margin-top:3px;"></i>
                    <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin:0;">
                        <strong>Advance Payment</strong> debit/credit real backend ledger me save hota hai. <strong>Amount Deduction</strong> selected date wale month's salary me apply hota hai.
                    </p>
                </div>
            </div>
        `;
        ModalManager.show('Quick Salary Actions', content);
    },

    getHoldMonthOptions: (selectedMonth, selectedYear = null) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const now = new Date();
        const resolvedYear = selectedYear !== null
            ? Math.min(selectedYear, now.getFullYear())
            : (parseInt(document.getElementById('hold-year-select')?.value, 10) || now.getFullYear());
        const maxMonth = resolvedYear >= now.getFullYear() ? now.getMonth() : 11;
        return months
            .slice(0, maxMonth + 1)
            .map((month, index) => `<option value="${index}" ${index === selectedMonth ? 'selected' : ''}>${month}</option>`)
            .join('');
    },

    getHoldYearOptions: (selectedYear) => {
        const currentYear = new Date().getFullYear();
        const safeSelectedYear = Math.min(selectedYear, currentYear);
        const years = Array.from(new Set([safeSelectedYear, currentYear, currentYear - 1])).sort((a, b) => b - a);
        return years.map((year) => `<option value="${year}" ${year === safeSelectedYear ? 'selected' : ''}>${year}</option>`).join('');
    },

    refreshHoldModalMonth: (staffId) => {
        const month = parseInt(document.getElementById('hold-month-select')?.value, 10);
        const year = parseInt(document.getElementById('hold-year-select')?.value, 10);
        if (Number.isNaN(month) || Number.isNaN(year)) return;
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        StaffManager.showHoldToggleModal(staffId, monthKey);
    },

    showHoldToggleModal: async (staffId, monthKey) => {
        const staff = (StorageManager.get('staff') || []).find(s => s.id === staffId);
        if (!staff) return;
        const adjustments = StorageManager.get('salaryAdjustments') || {};
        const fallbackDate = new Date();
        const [selectedYearRaw, selectedMonthRaw] = (monthKey || `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, '0')}`).split('-');
        const selectedYear = parseInt(selectedYearRaw, 10) || fallbackDate.getFullYear();
        const maxAllowedMonth = selectedYear >= fallbackDate.getFullYear() ? fallbackDate.getMonth() : 11;
        const requestedMonth = (parseInt(selectedMonthRaw, 10) || (fallbackDate.getMonth() + 1)) - 1;
        const selectedMonth = Math.min(requestedMonth, maxAllowedMonth);
        const resolvedMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const adj = (adjustments[staffId] || {})[resolvedMonthKey] || { hold: false, holdDays: 0 };
        const localPendingHold = StaffManager.getLocalPendingHold(staffId, staff.salaryAmount);
        const payrollSummary = await ApiClient.getPayrollSummary(Number(staffId), selectedMonth + 1, selectedYear).catch(() => null);
        const backendHoldInfo = payrollSummary?.hold_info || { total_hold_days: 0, total_hold_amount: 0 };
        const overallHoldDays = Math.max(
            Number(adj.holdDays || 0),
            Number(localPendingHold.days || 0),
            Number(backendHoldInfo.total_hold_days || 0)
        );
        const overallHoldAmount = Math.max(
            Math.round(Number(localPendingHold.amount || 0)),
            Math.round(Number(backendHoldInfo.total_hold_amount || 0))
        );
        const hasOverallHold = Boolean(adj.hold)
            || Number(adj.holdDays || 0) > 0
            || Number(localPendingHold.days || 0) > 0
            || Number(backendHoldInfo.total_hold_days || 0) > 0
            || Number(backendHoldInfo.total_hold_amount || 0) > 0;
        const monthSelector = `
            <div class="input-group" style="margin-bottom:1.25rem;">
                <label>Select Month</label>
                <div style="display:flex; gap:10px;">
                    <select id="hold-month-select" class="full-width" onchange="StaffManager.refreshHoldModalMonth('${staffId}')" style="padding:12px; border-radius:12px; background:var(--bg-main); font-weight:600;">
                        ${StaffManager.getHoldMonthOptions(selectedMonth, selectedYear)}
                    </select>
                    <select id="hold-year-select" onchange="StaffManager.refreshHoldModalMonth('${staffId}')" style="width:120px; padding:12px; border-radius:12px; background:var(--bg-main); font-weight:600;">
                        ${StaffManager.getHoldYearOptions(selectedYear)}
                    </select>
                </div>
            </div>
        `;

        if (hasOverallHold) {
            const content = `
                <div style="text-align:center; padding:1rem;">
                    ${monthSelector}
                    <div style="background:rgba(214, 48, 49, 0.1); width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; color:var(--danger); font-size:1.5rem;">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3>Salary is Currently Held</h3>
                    <p style="color:var(--text-muted); margin:10px 0 8px;">Pending Hold: <strong>${overallHoldDays} Days</strong>${overallHoldAmount > 0 ? ` | <strong>&#8377;${overallHoldAmount.toLocaleString()}</strong>` : ''}</p>
                    <p style="color:var(--text-muted); margin:0 0 20px; font-size:0.85rem;">Release selected month se trigger hoga, lekin active hold overall clear ho jayega.</p>
                    <button class="btn-primary" style="background:var(--success); width:100%;" onclick="StaffManager.toggleHoldSalary('${staffId}', '${resolvedMonthKey}', false)">
                        <i class="fas fa-unlock"></i> Release Salary
                    </button>
                    <button class="btn-outline" style="width:100%; margin-top:10px;" onclick="ModalManager.hide()">Cancel</button>
                </div>
            `;
            ModalManager.show(`Manage Hold - ${staff.name}`, content);
        } else {
            const content = `
                <div style="padding:0.5rem;">
                    ${monthSelector}
                    <p style="margin-bottom:1.5rem; color:var(--text-muted); font-size:0.9rem;">Select how many days of salary you want to put on hold for this month.</p>
                    <div class="input-group">
                        <label>Days to Hold</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar-times"></i>
                            <input type="number" id="manual-hold-days" value="31" min="1" max="31" placeholder="e.g. 30">
                        </div>
                    </div>
                    <button class="btn-primary" style="width:100%; background:var(--danger); margin-top:1rem;" onclick="StaffManager.toggleHoldSalary('${staffId}', '${resolvedMonthKey}', true)">
                        <i class="fas fa-lock"></i> Put on Hold
                    </button>
                </div>
            `;
            ModalManager.show(`Hold Salary - ${staff.name}`, content);
        }

        setupCustomDropdown('hold-month-select');
        setupCustomDropdown('hold-year-select');
    },

    toggleHoldSalary: async (staffId, monthKey, status) => {
        const adjustments = StorageManager.get('salaryAdjustments') || {};
        if (!adjustments[staffId]) adjustments[staffId] = {};
        if (!adjustments[staffId][monthKey]) {
            adjustments[staffId][monthKey] = { overtime: 0, advance: 0, fine: 0, adjustment: 0, hold: false, holdDays: 0 };
        }

        const previousState = { ...adjustments[staffId][monthKey] };
        const previousStaffAdjustments = JSON.parse(JSON.stringify(adjustments[staffId] || {}));
        const holdDays = status ? (parseInt(document.getElementById('manual-hold-days').value) || 0) : 0;

        try {
            window.SyncStatus?.show(status ? 'Saving hold...' : 'Releasing hold...', 'saving');

            if (status) {
                await ApiClient.addManualHold(staffId, holdDays);
            } else {
                const pendingHold = StaffManager.getLocalPendingHold(staffId, 0);
                const daysToRelease = Number(pendingHold.days || previousState.holdDays || 0);
                await ApiClient.releaseManualHold(staffId, daysToRelease);
            }

            if (status) {
                adjustments[staffId][monthKey].hold = true;
                adjustments[staffId][monthKey].holdDays = holdDays;
            } else {
                Object.keys(adjustments[staffId]).forEach((key) => {
                    if (!adjustments[staffId][key]) return;
                    adjustments[staffId][key].hold = false;
                    adjustments[staffId][key].holdDays = 0;
                });
            }
            StorageManager.save('salaryAdjustments', adjustments);
            ModalManager.hide();

            // Refresh appropriate view
            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const profileMonthPicker = document.getElementById('profile-month-picker');
                if (profileMonthPicker) {
                    const [y, m] = profileMonthPicker.value.split('-');
                    await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId, parseInt(m) - 1, parseInt(y));
                }
            }

            window.SyncStatus?.show(status ? `Hold saved for ${holdDays} days` : 'Hold released', 'success', 1600);
            window.showAlert(status ? `Salary held for ${holdDays} days` : 'Salary released successfully');
        } catch (error) {
            adjustments[staffId] = previousStaffAdjustments;
            adjustments[staffId][monthKey] = previousState;
            StorageManager.save('salaryAdjustments', adjustments);
            window.SyncStatus?.show('Hold sync failed', 'error', 2800);
            window.showAlert(error.message || 'Failed to update hold');
        }
    },

    showDeductionModal: (staffId) => {
        const content = `
            <form id="deduction-form" onsubmit="StaffManager.handleDeductionSubmit(event, '${staffId}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="deduction-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Deduction Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-minus-circle"></i>
                        <input type="number" id="deduction-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remarks</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="deduction-remark" placeholder="e.g. Breakage, Uniform, Cash short">
                    </div>
                </div>
                <div style="margin-top:1.5rem;">
                    <button type="submit" class="btn-primary full-width" style="background:#b26a00;">Save Deduction</button>
                </div>
            </form>
        `;
        ModalManager.show('Add Payment Deduction', content);

        setTimeout(() => {
            StaffManager.initDatePicker("#deduction-date", {
                defaultDate: "today",
                dateFormat: "Y-m-d"
            });
        }, 50);
    },

    handleDeductionSubmit: async (e, staffId, editId = null) => {
        e.preventDefault();
        const deductionDate = document.getElementById('deduction-date').value;
        const deductionAmount = StaffManager.getPositiveAmount('deduction-amount', 'Deduction amount');
        if (deductionAmount === null) return;
        const deductionRemark = document.getElementById('deduction-remark').value;
        const deductionMonth = new Date(`${deductionDate}T00:00:00`);

        const apiData = {
            employee_id: Number(staffId),
            amount: deductionAmount,
            date: deductionDate,
            notes: deductionRemark,
            type: 'deduction',
            repay_months: 1
        };

        try {
            if (editId) {
                await ApiClient.updateAof(editId, apiData);
            } else {
                await ApiClient.createAof(apiData);
            }

            await ApiSyncManager.bootstrap(true);
            await ApiSyncManager.syncMonth(deductionMonth.getMonth() + 1, deductionMonth.getFullYear(), true);
            ModalManager.hide();

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                const monthEl = document.getElementById('salary-month');
                const yearEl = document.getElementById('salary-year');
                if (monthEl && yearEl) {
                    monthEl.value = String(deductionMonth.getMonth());
                    yearEl.value = String(deductionMonth.getFullYear());
                }
                await SalaryManager.refreshSalaryList();
            } else {
                const profileContainer = document.getElementById('view-container');
                const profileMonthPicker = document.getElementById('profile-month-picker');
                if (profileContainer && profileMonthPicker) {
                    const [y, m] = profileMonthPicker.value.split('-');
                    await StaffManager.renderProfilePage(profileContainer, staffId, parseInt(m, 10) - 1, parseInt(y, 10));
                }
            }

            window.showAlert(`Deduction saved for ${deductionMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
        } catch (error) {
            window.showAlert(error.message || 'Failed to save deduction');
        }
    },

    showFineModal: (staffId) => {
        const content = `
            <form id="fine-form" onsubmit="StaffManager.handleFineSubmit(event, '${staffId}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="fine-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Payment Deduction Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="fine-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remarks</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="fine-remark" placeholder="e.g. Late coming, Glass broken">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Save Payment Deduction</button>
                </div>
            </form>
        `;
        ModalManager.show('Add Payment Deduction', content);

        setTimeout(() => {
            StaffManager.initDatePicker("#fine-date", {
                defaultDate: "today",
                dateFormat: "Y-m-d"
            });
        }, 50);
    },

    handleFineSubmit: async (e, staffId, editId = null) => {
        e.preventDefault();
        const amount = StaffManager.getPositiveAmount('fine-amount', 'Payment deduction amount');
        if (amount === null) return;

        const apiData = {
            employee_id: Number(staffId),
            amount,
            date: document.getElementById('fine-date').value,
            notes: document.getElementById('fine-remark').value,
            type: 'fine',
            repay_months: 1
        };

        try {
            if (editId) {
                await ApiClient.updateAof(editId, apiData);
            } else {
                await ApiClient.createAof(apiData);
            }

            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const profileContainer = document.getElementById('view-container');
                if (profileContainer && profileContainer.querySelector('.mini-calendar')) {
                    const monthPicker = document.getElementById('profile-month-picker');
                    if (monthPicker) {
                        const [y, m] = monthPicker.value.split('-');
                        await StaffManager.renderProfilePage(profileContainer, staffId, parseInt(m) - 1, parseInt(y));
                    } else {
                        await StaffManager.renderProfilePage(profileContainer, staffId);
                    }
                }
            }

            window.showAlert(editId ? 'Payment deduction updated' : 'Payment deduction recorded');
        } catch (error) {
            window.showAlert(error.message || 'Failed to save payment deduction');
        }
    },

    showEditFineModal: (staffId, fineId) => {
        const fines = StorageManager.get('fines') || {};
        const record = (fines[staffId] || []).find(f => f.id === fineId);
        if (!record) return;

        StaffManager.showFineModal(staffId);
        document.getElementById('modal-title').textContent = 'Edit Payment Deduction Record';
        document.getElementById('fine-amount').value = record.amount;
        document.getElementById('fine-date').value = record.date;
        document.getElementById('fine-remark').value = record.remark || '';

        const form = document.getElementById('fine-form');
        form.onsubmit = (e) => StaffManager.handleFineSubmit(e, staffId, fineId);
    },

    deleteFine: async (staffId, fineId) => {
        const isConfirmed = await ConfirmManager.ask('Delete this payment deduction record?');
        if (!isConfirmed) return;

        try {
            await ApiClient.deleteAof(fineId);
            await ApiSyncManager.bootstrap(true);

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const profileContainer = document.getElementById('view-container');
                if (profileContainer && profileContainer.querySelector('.mini-calendar')) {
                    const monthPicker = document.getElementById('profile-month-picker');
                    if (monthPicker) {
                        const [y, m] = monthPicker.value.split('-');
                        await StaffManager.renderProfilePage(profileContainer, staffId, parseInt(m) - 1, parseInt(y));
                    } else {
                        await StaffManager.renderProfilePage(profileContainer, staffId);
                    }
                }
            }

            window.showAlert('Payment deduction record deleted');
        } catch (error) {
            window.showAlert(error.message || 'Failed to delete payment deduction');
        }
    },

    showOvertimeModal: (staffId) => {
        const content = `
            <form id="overtime-form" onsubmit="StaffManager.handleOvertimeSubmit(event, '${staffId}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="ot-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="ot-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remarks</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="ot-remark" placeholder="e.g. Extra shift, Sunday working">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Save Overtime</button>
                </div>
            </form>
        `;
        ModalManager.show('Add Overtime', content);

        setTimeout(() => {
            StaffManager.initDatePicker("#ot-date", {
                defaultDate: "today",
                dateFormat: "Y-m-d"
            });
        }, 50);
    },

    handleOvertimeSubmit: async (e, staffId, editId = null) => {
        e.preventDefault();
        const amount = StaffManager.getPositiveAmount('ot-amount', 'Overtime amount');
        if (amount === null) return;

        const apiData = {
            employee_id: Number(staffId),
            amount,
            date: document.getElementById('ot-date').value,
            notes: document.getElementById('ot-remark').value,
            type: 'overtime',
            repay_months: 1
        };

        try {
            if (editId) {
                await ApiClient.updateAof(editId, apiData);
            } else {
                await ApiClient.createAof(apiData);
            }

            await ApiSyncManager.bootstrap(true);
            ModalManager.hide();

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const profileContainer = document.getElementById('view-container');
                if (profileContainer && profileContainer.querySelector('.mini-calendar')) {
                    const monthPicker = document.getElementById('profile-month-picker');
                    if (monthPicker) {
                        const [y, m] = monthPicker.value.split('-');
                        await StaffManager.renderProfilePage(profileContainer, staffId, parseInt(m) - 1, parseInt(y));
                    } else {
                        await StaffManager.renderProfilePage(profileContainer, staffId);
                    }
                }
            }

            window.showAlert(editId ? 'Overtime updated' : 'Overtime recorded');
        } catch (error) {
            window.showAlert(error.message || 'Failed to save overtime');
        }
    },

    showEditOvertimeModal: (staffId, otId) => {
        const overtime = StorageManager.get('overtime') || {};
        const record = (overtime[staffId] || []).find(f => f.id === otId);
        if (!record) return;

        StaffManager.showOvertimeModal(staffId);
        document.getElementById('modal-title').textContent = 'Edit Overtime Record';
        document.getElementById('ot-amount').value = record.amount;
        document.getElementById('ot-date').value = record.date;
        document.getElementById('ot-remark').value = record.remark || '';

        const form = document.getElementById('overtime-form');
        form.onsubmit = (e) => StaffManager.handleOvertimeSubmit(e, staffId, otId);
    },

    deleteOvertime: async (staffId, otId) => {
        const isConfirmed = await ConfirmManager.ask('Delete this overtime record?');
        if (!isConfirmed) return;

        try {
            await ApiClient.deleteAof(otId);
            await ApiSyncManager.bootstrap(true);

            const salaryList = document.getElementById('salary-list');
            if (salaryList) {
                await SalaryManager.refreshSalaryList();
            } else {
                const profileContainer = document.getElementById('view-container');
                if (profileContainer && profileContainer.querySelector('.mini-calendar')) {
                    const monthPicker = document.getElementById('profile-month-picker');
                    if (monthPicker) {
                        const [y, m] = monthPicker.value.split('-');
                        await StaffManager.renderProfilePage(profileContainer, staffId, parseInt(m) - 1, parseInt(y));
                    } else {
                        await StaffManager.renderProfilePage(profileContainer, staffId);
                    }
                }
            }

            window.showAlert('Overtime record deleted');
        } catch (error) {
            window.showAlert(error.message || 'Failed to delete overtime');
        }
    }
};

window.StaffManager = StaffManager;

document.addEventListener('click', (event) => {
    const picker = event.target.closest?.('.profile-month-picker');
    if (picker) return;
    document.querySelectorAll('.profile-month-menu.open').forEach((menu) => menu.classList.remove('open'));
});
