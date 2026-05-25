const SalaryManager = {
    isActiveStaff: (staff) => String(staff?.status || 'active').toLowerCase() === 'active',

    formatSalaryAmountWithHold: (amount, holdSource = null) => {
        if (window.HoldSalaryUI?.amount) {
            return window.HoldSalaryUI.amount(amount, holdSource);
        }
        return `₹${Number(amount || 0).toLocaleString()}`;
    },

    getAllowedMonthIndexes: (year) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const maxMonth = year >= currentYear ? now.getMonth() : 11;
        return Array.from({ length: maxMonth + 1 }, (_, index) => index);
    },

    getAllowedYears: (selectedYear = null) => {
        const currentYear = new Date().getFullYear();
        const safeSelectedYear = selectedYear !== null ? Math.min(selectedYear, currentYear) : null;
        const years = [currentYear, currentYear - 1];
        if (safeSelectedYear !== null && safeSelectedYear < currentYear - 1) {
            years.push(safeSelectedYear);
        }
        return Array.from(new Set(years)).sort((a, b) => b - a);
    },

    getPreviousMonthYear: () => {
        const now = new Date();
        const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        return {
            month: previous.getMonth(),
            year: previous.getFullYear()
        };
    },

    getDefaultSalaryPeriod: async () => {
        const now = new Date();
        const currentPeriod = {
            month: now.getMonth(),
            year: now.getFullYear()
        };
        const previousPeriod = SalaryManager.getPreviousMonthYear();

        try {
            const payrollRows = await ApiClient.listPayroll(currentPeriod.month + 1, currentPeriod.year);
            if (Array.isArray(payrollRows) && payrollRows.length > 0) {
                return currentPeriod;
            }
        } catch (error) {
            console.warn('Could not check current month payroll status', error);
        }

        return previousPeriod;
    },

    initializeSalaryPeriod: async () => {
        const monthEl = document.getElementById('salary-month');
        const yearEl = document.getElementById('salary-year');
        if (!monthEl || !yearEl) return;

        const period = await SalaryManager.getDefaultSalaryPeriod();
        monthEl.value = String(period.month);
        yearEl.value = String(period.year);
        await SalaryManager.refreshSalaryList();
    },

    getSelectedMonthYear: (fallbackMonth = null, fallbackYear = null) => {
        const now = new Date();
        const monthEl = document.getElementById('salary-month');
        const yearEl = document.getElementById('salary-year');

        return {
            month: monthEl ? parseInt(monthEl.value, 10) : (fallbackMonth ?? now.getMonth()),
            year: yearEl ? parseInt(yearEl.value, 10) : (fallbackYear ?? now.getFullYear())
        };
    },

    getLocalPendingHold: (staffId, salaryAmount = 0) => {
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

    renderSalary: (container) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const now = new Date();
        const currentYear = now.getFullYear();
        const initialPeriod = SalaryManager.getPreviousMonthYear();

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2rem; padding-bottom:2rem;">
                <!-- Header & Stats -->
                <div class="salary-dashboard-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
                    <div>
                        <h1 style="font-size:2rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">Salary Dashboard</h1>
                        <p style="color:var(--text-muted); font-weight:600;">Manage monthly payroll and deductions</p>
                    </div>
                    <div class="salary-filter-bar" style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-card); padding:8px; border-radius:16px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-calendar-alt" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-month" onchange="SalaryManager.refreshSalaryList()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease; min-width:150px;">
                                ${months.map((m, i) => `<option value="${i}" ${i === initialPeriod.month ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:12px; color:var(--text-muted); font-size:0.7rem; pointer-events:none;"></i>
                        </div>
                        <div class="salary-filter-divider" style="width:1px; height:20px; background:var(--border);"></div>
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-clock" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-year" onchange="SalaryManager.refreshSalaryList()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease;">
                                ${SalaryManager.getAllowedYears(initialPeriod.year).map((year) => `<option value="${year}" ${year === initialPeriod.year ? 'selected' : ''}>${year}</option>`).join('')}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:12px; color:var(--text-muted); font-size:0.7rem; pointer-events:none;"></i>
                        </div>
                        <div class="salary-filter-divider" style="width:1px; height:20px; background:var(--border);"></div>
                        <button id="generate-all-btn" class="btn-primary" onclick="SalaryManager.generateAllSalaries()" style="padding:10px 15px; border-radius:12px; font-size:0.85rem; display:flex; align-items:center; gap:8px; white-space:nowrap;">
                            <i class="fas fa-magic"></i> Generate All
                        </button>
                        <button id="delete-all-btn" class="btn-outline" onclick="SalaryManager.deleteAllSalaries()" style="padding:10px; border-radius:12px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" title="Delete All Generated Salaries">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;">
                    <!-- Total Payable Card -->
                    <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.25rem; transition: transform 0.2s; cursor:default; border:1px solid var(--border);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width:60px; height:60px; border-radius:18px; background:rgba(0, 184, 148, 0.1); color:var(--success); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Total Payable</label>
                            <h2 id="stats-total-payable" style="font-size:1.6rem; font-weight:800; color:var(--text-main); margin:0;">₹0</h2>
                            <div id="stats-pay-period" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Period: -</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Gross Salary: <span id="stats-total-earned">₹0</span></div>
                            <span style="font-size:0.75rem; color:var(--success); font-weight:700;"><i class="fas fa-check-circle"></i> Ready to Pay</span>
                        </div>
                    </div>

                    <!-- Total Held Card -->
                    <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.25rem; transition: transform 0.2s; cursor:default; border:1px solid var(--border);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width:60px; height:60px; border-radius:18px; background:rgba(214, 48, 49, 0.1); color:var(--danger); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Total Held Amount</label>
                            <h2 id="stats-total-held" style="font-size:1.6rem; font-weight:800; color:var(--danger); margin:0;">₹0</h2>
                            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Held for <span id="stats-held-count">0</span> Staff</div>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-lock"></i> Locked</span>
                        </div>
                    </div>

                    <!-- Advance Deduction Card -->
                    <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.25rem; transition: transform 0.2s; cursor:default; border:1px solid var(--border);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width:60px; height:60px; border-radius:18px; background:rgba(108, 92, 231, 0.1); color:#6c5ce7; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Advance Adjusted</label>
                            <h2 id="stats-total-advance" style="font-size:1.6rem; font-weight:800; color:#6c5ce7; margin:0;">₹0</h2>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-sync-alt"></i> Deducted</span>
                        </div>
                    </div>
                </div>

                <!-- Staff Salary Table -->
                <div class="card" style="padding:0; overflow:hidden;">
                    <div class="table-responsive salary-table-wrap">
                        <table class="salary-table" style="width:100%; border-collapse:collapse;">
                            <thead style="background:var(--bg-main);">
                                <tr>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Staff Member</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Base Salary</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Working Days</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Earned</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Deductions</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Hold Status</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Advance</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Final Payable</th>
                                    <th style="padding:1.2rem; text-align:right; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="salary-list">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        SalaryManager.initializeSalaryPeriod();
    },

    getSearchQuery: () => {
        return (document.getElementById('global-search')?.value || '').trim().toLowerCase();
    },

    matchesSearch: (staff, query) => {
        if (!query) return true;
        const name = String(staff.name || '').toLowerCase();
        const mobile = String(staff.mobile || '').toLowerCase();
        return name.includes(query) || mobile.includes(query);
    },

    refreshSalaryListLocalDeprecated: async () => {
        throw new Error('Local salary fallback has been removed. Use refreshSalaryList for backend data.');
    },

    refreshSalaryListRemovedBody: false,

    /*
        tbody.innerHTML = staff.length > 0 ? staff.map(s => {
            const adjMap = adjustments[s.id] || {};
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            const adj = adjMap[monthKey] || { overtime: 0, advance: 0, fine: 0, adjustment: 0, hold: false, holdDays: 0 };
            const payrollRecord = payrollMap[`${s.id}:${monthKey}`] || null;
            const attCounts = !payrollRecord ? SalaryManager.calculateAttendanceCounts(s.id, month, year, attendance) : null;
            const daysPresent = payrollRecord
                ? (Number(payrollRecord.present_days || 0) + (Number(payrollRecord.half_days || 0) * 0.5) + Number(payrollRecord.weekend_holiday_days || 0))
                : SalaryManager.calculateDaysPresent(s.id, month, year, attendance);

            const isGenerated = Boolean(payrollRecord) || adj.status === 'generated';
            if (isGenerated) anyGenerated = true;
            else anyUnfinished = true;

            const baseEarned = payrollRecord
                ? Number(payrollRecord.base_salary || 0)
                : SalaryManager.calculateBaseEarned(s, daysPresent, month, year, attCounts);
            const finalSalary = payrollRecord
                ? Number(payrollRecord.total_salary || 0)
                : SalaryManager.calculateFinalSalary(s, daysPresent, adj, s.id, month, year, attCounts);

            // Calculate stats
            totalPayable += finalSalary;
            totalAdvanceDeducted += payrollRecord ? Number(payrollRecord.advance_deduction || 0) : (adj.advance || 0);
            totalEarnedAmount += baseEarned;

            let holdInfo = "";
            const holdAmount = payrollRecord
                ? Number(payrollRecord.hold_deduction || 0)
                : (adj.hold ? (SalaryManager.calculateBaseEarned(s, 1, month, year) * (adj.holdDays || 0)) : 0);

            if (holdAmount > 0) {
                totalHeldAmount += holdAmount;
                heldStaffCount++;
                holdInfo = `<div style="display:flex; flex-direction:column; gap:2px; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${s.id}', '${monthKey}')" title="Click to Manage Hold">
                    <span style="color:var(--danger); font-size:0.8rem; font-weight:700;"><i class="fas fa-lock"></i> Held</span>
                    <span style="font-size:0.75rem; color:var(--danger); font-weight:600;">₹${Math.round(holdAmount).toLocaleString()}</span>
                </div>`;
            } else {
                holdInfo = `<span style="color:var(--success); font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${s.id}', '${monthKey}')" title="Click to Put on Hold"><i class="fas fa-check-circle"></i> No Hold</span>`;
            }

            // Total Deductions (Advance + Fines)
            const allFines = StorageManager.get('fines') || {};
            const staffFines = allFines[s.id] || [];
            const monthlyFine = staffFines.filter(f => {
                const d = new Date(f.date);
                return d.getMonth() === month && d.getFullYear() === year;
            }).reduce((sum, f) => sum + f.amount, 0);
            const totalDeductions = payrollRecord
                ? Number(payrollRecord.advance_deduction || 0) + Number(payrollRecord.fine || 0) + Number(payrollRecord.deduction || 0) + Number(payrollRecord.hold_deduction || 0)
                : (adj.advance || 0) + monthlyFine;

            // Calculate Advance Balance
            const advances = StorageManager.get('advances') || {};
            const staffAdvances = advances[s.id] || [];
            const totalPaidAdv = staffAdvances.filter(a => a.type === 'paid').reduce((sum, a) => sum + a.amount, 0);

            // Manual received in this month
            const monthlyManualReceived = staffAdvances.filter(a => {
                if (a.type !== 'received') return false;
                const d = new Date(a.date);
                return d.getMonth() === month && d.getFullYear() === year;
            }).reduce((sum, a) => sum + a.amount, 0);
            totalManualReceived += monthlyManualReceived;

            const totalReceivedAdv = staffAdvances.filter(a => a.type === 'received').reduce((sum, a) => sum + a.amount, 0);
            const advBalance = totalPaidAdv - totalReceivedAdv;

            return `
                <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                    <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${s.id}')">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), '3E2723', 'fff', 40)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                            <div>
                                <div style="font-weight:700; color:var(--primary);">${s.name}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">${s.role} | ${s.salaryType}</div>
                            </div>
                        </div>
                    </td>
                    <td data-label="Base Salary" style="padding:1.2rem; font-weight:600; color:var(--text-main);">${SalaryManager.formatSalaryAmountWithHold(s.salaryAmount, s)}</td>
                    <td data-label="Working Days" style="padding:1.2rem; font-weight:700;">${daysPresent} Days</td>
                    <td data-label="Earned" style="padding:1.2rem; font-weight:700; color:var(--success);">₹${Math.round(baseEarned).toLocaleString()}</td>
                    <td data-label="Deductions" style="padding:1.2rem;">
                        <div style="font-weight:700; color:${totalDeductions > 0 ? 'var(--danger)' : 'var(--text-muted)'};">₹${totalDeductions.toLocaleString()}</div>
                    </td>
                    <td data-label="Hold Status" style="padding:1.2rem;">${holdInfo}</td>
                    <td data-label="Advance" style="padding:1.2rem; cursor:pointer; transition:background 0.2s;" onclick="StaffManager.showAdvanceModal('${s.id}')" title="Click to Manage Advance">
                        <div style="font-weight:700; color:${(payrollRecord ? Number(payrollRecord.advance_deduction || 0) : (adj.advance || 0)) > 0 ? '#6c5ce7' : 'var(--text-muted)'};">₹${(payrollRecord ? Number(payrollRecord.advance_deduction || 0) : (adj.advance || 0)).toLocaleString()}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Bal: ₹${advBalance.toLocaleString()}</div>
                    </td>
                    <td data-label="Final Payable" style="padding:1.2rem;">
                        <div style="font-size:1.1rem; font-weight:800; color:#0984e3;">₹${finalSalary.toLocaleString()}</div>
                    </td>
                    <td data-label="Action" style="padding:1.2rem; text-align:right;">
                        <div class="salary-row-actions" style="display:flex; justify-content:flex-end; gap:8px;">
                            ${isGenerated ? `
                            <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:#0984e3; border:1.5px solid #0984e3;" 
                                    onclick="event.stopPropagation(); SalaryManager.showSalarySlipUI('${s.id}', ${month}, ${year})" title="View Salary Slip">
                                <i class="fas fa-eye"></i> View Slip
                            </button>
                            <button class="btn-outline" style="padding:8px; border-radius:10px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" 
                                    onclick="event.stopPropagation(); SalaryManager.deleteSalary('${s.id}', '${monthKey}')" title="Delete Generated Salary">
                                <i class="fas fa-trash-alt"></i>
                            </button>` : `
                            <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                    onclick="event.stopPropagation(); SalaryManager.showSalaryConfigModal('${s.id}', ${month}, ${year})">
                                <i class="fas fa-file-invoice-dollar"></i> Generate
                            </button>`}
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : `<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);">${searchQuery ? 'No staff found for this search.' : 'No active staff found for this period.'}</td></tr>`;

        // Update Summary Stats
        document.getElementById('stats-total-payable').textContent = `₹${totalPayable.toLocaleString()}`;
        document.getElementById('stats-total-earned').textContent = `₹${Math.round(totalEarnedAmount).toLocaleString()}`;
        document.getElementById('stats-total-held').textContent = `₹${Math.round(totalHeldAmount).toLocaleString()}`;
        document.getElementById('stats-held-count').textContent = heldStaffCount;

        const totalAdjusted = totalAdvanceDeducted + totalManualReceived;
        document.getElementById('stats-total-advance').textContent = `₹${totalAdjusted.toLocaleString()}`;

        // Update advance card subtitle if element exists
        const advCard = document.getElementById('stats-total-advance').parentElement;
        let sub = advCard.querySelector('.adv-breakdown');
        if (!sub) {
            sub = document.createElement('div');
            sub.className = 'adv-breakdown';
            sub.style.cssText = 'font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-top:4px;';
            advCard.appendChild(sub);
        }
        sub.innerHTML = `Adj: ₹${totalAdvanceDeducted.toLocaleString()} | Rec: ₹${totalManualReceived.toLocaleString()}`;

        // Update buttons state
        const genBtn = document.getElementById('generate-all-btn');
        const delBtn = document.getElementById('delete-all-btn');

        if (genBtn) {
            if (!anyUnfinished && activeStaff.length > 0 && !searchQuery) {
                genBtn.disabled = true;
                genBtn.style.opacity = '0.5';
                genBtn.style.cursor = 'not-allowed';
                genBtn.title = "All salaries generated for this month";
                genBtn.innerHTML = '<i class="fas fa-check-circle"></i> All Generated';
            } else {
                genBtn.disabled = false;
                genBtn.style.opacity = '1';
                genBtn.style.cursor = 'pointer';
                genBtn.title = "";
                genBtn.innerHTML = '<i class="fas fa-magic"></i> Generate All';
            }
        }

        if (delBtn) {
            delBtn.style.display = anyGenerated ? 'block' : 'none';
        }
    },
    */

    refreshSalaryList: async (options = {}) => {
        const monthEl = document.getElementById('salary-month');
        const yearEl = document.getElementById('salary-year');
        const tbody = document.getElementById('salary-list');
        if (!monthEl || !yearEl || !tbody) return;

        const month = parseInt(monthEl.value);
        const year = parseInt(yearEl.value);
        tbody.innerHTML = `<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading backend salary data...</td></tr>`;

        let activeStaff = [];
        try {
            const employees = await ApiClient.listEmployees();
            activeStaff = (employees || []).map((employee) => ApiSyncManager.normalizeEmployee(employee)).filter(SalaryManager.isActiveStaff);
        } catch (error) {
            console.error('Failed to load salary staff from backend', error);
            tbody.innerHTML = '<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend staff data unavailable</td></tr>';
            return;
        }

        const searchQuery = SalaryManager.getSearchQuery();
        const staff = activeStaff.filter(s => SalaryManager.matchesSearch(s, searchQuery));

        let totalPayable = 0;
        let totalHeldAmount = 0;
        let totalAdvanceDeducted = 0;
        let totalEarnedAmount = 0;
        let heldStaffCount = 0;
        let anyUnfinished = false;
        let anyGenerated = false;

        if (staff.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);">${searchQuery ? 'No staff found for this search.' : 'No active staff found for this period.'}</td></tr>`;
        } else {
            const rows = await Promise.all(staff.map(async (s) => {
                const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                const payrollSummary = await ApiClient.getPayrollSummary(Number(s.id), month + 1, year).catch((error) => {
                    console.error('Failed to fetch salary summary', error);
                    return null;
                });
                const slipData = SalaryManager.getSlipDataFromSummary(payrollSummary, month, year);

                if (!slipData) {
                    anyUnfinished = true;
                    return `
                        <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                            <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${s.id}')">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), '3E2723', 'fff', 40)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                    <div>
                                        <div style="font-weight:700; color:var(--primary);">${s.name}</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">${s.role} | ${s.salaryType}</div>
                                    </div>
                                </div>
                            </td>
                            <td colspan="7" style="padding:1.2rem; color:var(--danger); font-weight:700;">Backend salary data unavailable</td>
                            <td data-label="Action" style="padding:1.2rem; text-align:right;">
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                        onclick="event.stopPropagation(); SalaryManager.refreshSalaryList({skipSync:true})">
                                    <i class="fas fa-sync-alt"></i> Retry
                                </button>
                            </td>
                        </tr>
                    `;
                }

                const isGenerated = Boolean(payrollSummary?.is_already_generated || payrollSummary?.generated);
                if (isGenerated) anyGenerated = true;
                else anyUnfinished = true;

                const staffInfo = slipData.staff;
                const daysPresent = Number(slipData.daysPresent || 0);
                const baseEarned = Number(slipData.earnedSalary || 0);
                const finalSalary = Number(slipData.finalSalary || 0);
                const salarySource = payrollSummary?.generated || payrollSummary?.details || null;
                const baseAmount = Number(salarySource?.base_salary || 0);
                const daysDivisor = Number(salarySource?.days_divisor || 0);
                const perDaySalary = baseAmount > 0 && daysDivisor > 0 ? Math.round(baseAmount / daysDivisor) : 0;
                const currentHoldDeduction = Number(slipData.holdAmount || 0);
                const activeHoldDays = Number(payrollSummary?.hold_info?.total_hold_days || 0);
                const activeHoldAmount = Number(payrollSummary?.hold_info?.total_hold_amount || 0);
                const holdAmount = activeHoldAmount;
                const advanceDeduction = Number(slipData.adj?.advance || 0);
                const monthlyFine = Number(slipData.monthlyFine || 0);
                const totalDeductions = advanceDeduction + monthlyFine + currentHoldDeduction;
                const advBalance = Number(slipData.advBalance || 0);

                totalPayable += finalSalary;
                totalAdvanceDeducted += advanceDeduction;
                totalEarnedAmount += baseEarned;

                let holdInfo = "";
                if (holdAmount > 0) {
                    totalHeldAmount += holdAmount;
                    heldStaffCount++;
                    holdInfo = `<div style="display:flex; flex-direction:column; gap:2px; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${s.id}', '${monthKey}')" title="Click to Manage Hold">
                        <span style="color:var(--danger); font-size:0.8rem; font-weight:700;"><i class="fas fa-lock"></i> Held</span>
                        <span style="font-size:0.75rem; color:var(--danger); font-weight:600;">₹${Math.round(holdAmount).toLocaleString()}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${activeHoldDays.toLocaleString()} Days</span>
                    </div>`;
                } else {
                    holdInfo = `<span style="color:var(--success); font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${s.id}', '${monthKey}')" title="Click to Put on Hold"><i class="fas fa-check-circle"></i> No Hold</span>`;
                }

                return `
                    <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                        <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${s.id}')">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), '3E2723', 'fff', 40)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                <div>
                                    <div style="font-weight:700; color:var(--primary);">${staffInfo.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${staffInfo.role} | ${staffInfo.salaryType}</div>
                                </div>
                            </div>
                        </td>
                        <td data-label="Base Salary" style="padding:1.2rem; color:var(--text-main);">
                            <div style="font-weight:700;">${SalaryManager.formatSalaryAmountWithHold(baseAmount, payrollSummary?.hold_info)}</div>
                            ${perDaySalary > 0 ? `<div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; margin-top:4px;">Per day: ₹${perDaySalary.toLocaleString()}</div>` : ''}
                        </td>
                        <td data-label="Working Days" style="padding:1.2rem; font-weight:700;">${daysPresent} Days</td>
                        <td data-label="Earned" style="padding:1.2rem; font-weight:700; color:var(--success);">₹${Math.round(baseEarned).toLocaleString()}</td>
                        <td data-label="Deductions" style="padding:1.2rem;">
                            <div style="font-weight:700; color:${totalDeductions > 0 ? 'var(--danger)' : 'var(--text-muted)'};">₹${Math.round(totalDeductions).toLocaleString()}</div>
                        </td>
                        <td data-label="Hold Status" style="padding:1.2rem;">${holdInfo}</td>
                        <td data-label="Advance" style="padding:1.2rem; cursor:pointer; transition:background 0.2s;" onclick="StaffManager.showAdvanceModal('${s.id}')" title="Click to Manage Advance">
                            <div style="font-weight:700; color:${advanceDeduction > 0 ? '#6c5ce7' : 'var(--text-muted)'};">₹${advanceDeduction.toLocaleString()}</div>
                            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Bal: ₹${advBalance.toLocaleString()}</div>
                        </td>
                        <td data-label="Final Payable" style="padding:1.2rem;">
                            <div style="font-size:1.1rem; font-weight:800; color:#0984e3;">₹${finalSalary.toLocaleString()}</div>
                        </td>
                        <td data-label="Action" style="padding:1.2rem; text-align:right;">
                            <div class="salary-row-actions" style="display:flex; justify-content:flex-end; gap:8px;">
                                ${isGenerated ? `
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:#0984e3; border:1.5px solid #0984e3;" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalarySlipUI('${s.id}', ${month}, ${year})" title="View Salary Slip">
                                    <i class="fas fa-eye"></i> View Slip
                                </button>
                                <button class="btn-outline" style="padding:8px; border-radius:10px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" 
                                        onclick="event.stopPropagation(); SalaryManager.deleteSalary('${s.id}', '${monthKey}')" title="Delete Generated Salary">
                                    <i class="fas fa-trash-alt"></i>
                                </button>` : `
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalaryConfigModal('${s.id}', ${month}, ${year})">
                                    <i class="fas fa-file-invoice-dollar"></i> Generate
                                </button>`}
                            </div>
                        </td>
                    </tr>
                `;
            }));

            tbody.innerHTML = rows.join('');
        }

        document.getElementById('stats-total-payable').textContent = `₹${totalPayable.toLocaleString()}`;
        const periodEl = document.getElementById('stats-pay-period');
        if (periodEl) {
            const fromDate = new Date(year, month, 1);
            const toDate = new Date(year, month + 1, 0);
            const formatDate = (date) => date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            periodEl.textContent = `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`;
        }
        document.getElementById('stats-total-earned').textContent = `₹${Math.round(totalEarnedAmount).toLocaleString()}`;
        document.getElementById('stats-total-held').textContent = `₹${Math.round(totalHeldAmount).toLocaleString()}`;
        document.getElementById('stats-held-count').textContent = heldStaffCount;
        document.getElementById('stats-total-advance').textContent = `₹${totalAdvanceDeducted.toLocaleString()}`;

        const advCard = document.getElementById('stats-total-advance').parentElement;
        let sub = advCard.querySelector('.adv-breakdown');
        if (!sub) {
            sub = document.createElement('div');
            sub.className = 'adv-breakdown';
            sub.style.cssText = 'font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-top:4px;';
            advCard.appendChild(sub);
        }
        sub.innerHTML = `Adj: ₹${totalAdvanceDeducted.toLocaleString()}`;

        const genBtn = document.getElementById('generate-all-btn');
        const delBtn = document.getElementById('delete-all-btn');

        if (genBtn) {
            if (!anyUnfinished && activeStaff.length > 0 && !searchQuery) {
                genBtn.disabled = true;
                genBtn.style.opacity = '0.5';
                genBtn.style.cursor = 'not-allowed';
                genBtn.title = "All salaries generated for this month";
                genBtn.innerHTML = '<i class="fas fa-check-circle"></i> All Generated';
            } else {
                genBtn.disabled = false;
                genBtn.style.opacity = '1';
                genBtn.style.cursor = 'pointer';
                genBtn.title = "";
                genBtn.innerHTML = '<i class="fas fa-magic"></i> Generate All';
            }
        }

        if (delBtn) {
            delBtn.style.display = anyGenerated ? 'block' : 'none';
        }
    },

    calculateDaysPresent: (staffId, month, year, attendance) => {
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const status = attendance[dateStr] ? attendance[dateStr][staffId] : '';
            if (status === 'present' || status === 'holiday') {
                count++;
            } else if (status === 'halfday') {
                count += 0.5;
            }
        }
        return count;
    },

    calculateAttendanceCounts: (staffId, month, year, attendance) => {
        let present = 0, absent = 0, half = 0, holiday = 0, weekendHoliday = 0, weekendAbsent = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const holidayDay = StorageManager.get('weekly_holiday') ?? 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dateObj = new Date(`${dateStr}T00:00:00`);
            const isWeekend = dateObj.getDay() === holidayDay;
            const status = attendance[dateStr] ? attendance[dateStr][staffId] : '';
            if (isWeekend) {
                if (status === 'absent') weekendAbsent++;
                else weekendHoliday++;
            } else if (status === 'present' || status === 'holiday') {
                if (status === 'holiday') holiday++;
                present++;
            } else if (status === 'halfday') {
                half++;
            } else if (status === 'absent') {
                absent++;
            }
        }
        return { present, absent, half, holiday: holiday + weekendHoliday, weekendHoliday, weekendAbsent };
    },

    calculateBaseEarned: (staff, daysPresent, month = null, year = null, attCounts = null) => {
        const dMonth = month !== null ? month : new Date().getMonth();
        const dYear = year !== null ? year : new Date().getFullYear();
        const daysDivisor = window.PayrollSettings.getDaysDivisor(dMonth + 1, dYear);

        if (staff.salaryType === 'Daily') {
            return staff.salaryAmount * daysPresent;
        } else if (staff.salaryType === 'Weekly') {
            return (staff.salaryAmount / 7) * daysPresent;
        } else {
            const settings = StorageManager.get('payroll_settings') || {};
            if (settings.payroll_mode === 'monthly' && attCounts) {
                const dailyRate = daysDivisor > 0 ? staff.salaryAmount / daysDivisor : 0;
                return staff.salaryAmount - (attCounts.absent * dailyRate) - (attCounts.half * dailyRate * 0.5) - (attCounts.weekendAbsent * dailyRate);
            }
            return (staff.salaryAmount / daysDivisor) * daysPresent;
        }
    },

    calculateFinalSalary: (staff, daysPresent, adj, staffId = null, month = null, year = null, attCounts = null) => {
        const base = SalaryManager.calculateBaseEarned(staff, daysPresent, month, year, attCounts);

        // Calculate logged fines for this month
        let loggedFines = 0;
        let loggedOT = 0;
        if (staffId && month !== null && year !== null) {
            // Fines
            const allFines = StorageManager.get('fines') || {};
            const staffFines = allFines[staffId] || [];
            loggedFines = staffFines.filter(f => {
                const d = new Date(f.date);
                return d.getMonth() === month && d.getFullYear() === year;
            }).reduce((sum, f) => sum + f.amount, 0);

            // Overtime
            const allOT = StorageManager.get('overtime') || {};
            const staffOT = allOT[staffId] || [];
            loggedOT = staffOT.filter(f => {
                const d = new Date(f.date);
                return d.getMonth() === month && d.getFullYear() === year;
            }).reduce((sum, f) => sum + f.amount, 0);
        }

        // Hold Salary Logic (Deduct value of held days)
        let holdAmount = 0;
        if (adj.hold && (adj.holdDays || 0) > 0) {
            const dayValue = SalaryManager.calculateBaseEarned(staff, 1, month, year);
            holdAmount = dayValue * (adj.holdDays || 0);
        }

        const total = base + loggedOT - (adj.advance || 0) - loggedFines + (adj.adjustment || 0) - holdAmount;
        return Math.round(total);
    },

    showAdjustModal: (staffId, monthKey) => {
        const staff = (StorageManager.get('staff') || []).find(s => s.id === staffId);
        const adjData = (StorageManager.get('salaryAdjustments') || {})[staffId] || {};
        const mData = adjData[monthKey] || { overtime: 0, advance: 0, fine: 0, adjustment: 0, hold: false };

        const content = `
            <form onsubmit="SalaryManager.handleAdjustSubmit(event, '${staffId}', '${monthKey}')">
                <div class="grid-2">
                    <div class="input-group">
                        <label>Advance (₹)</label>
                        <input type="number" id="adj-advance" class="date-input full-width" value="${mData.advance}">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Manual Adj (₹)</label>
                        <input type="number" id="adj-manual" class="date-input full-width" value="${mData.adjustment}">
                    </div>
                </div>
                <div class="input-group" style="display:flex; align-items:center; gap:0.5rem;">
                    <input type="checkbox" id="adj-hold" ${mData.hold ? 'checked' : ''}>
                    <label for="adj-hold">Hold Salary</label>
                </div>
                <button type="submit" class="btn-primary full-width" style="margin-top:1rem;">Save Adjustments</button>
            </form>
        `;
        ModalManager.show(`Adjustments for ${staff.name}`, content);
    },

    handleAdjustSubmit: (e, staffId, monthKey) => {
        e.preventDefault();
        const adjustments = StorageManager.get('salaryAdjustments') || {};
        if (!adjustments[staffId]) adjustments[staffId] = {};

        adjustments[staffId][monthKey] = {
            advance: parseFloat(document.getElementById('adj-advance').value) || 0,
            adjustment: parseFloat(document.getElementById('adj-manual').value) || 0,
            hold: document.getElementById('adj-hold').checked
        };

        StorageManager.save('salaryAdjustments', adjustments);
        ModalManager.hide();

        // Refresh appropriate view
        const salaryList = document.getElementById('salary-list');
        if (salaryList) {
            SalaryManager.refreshSalaryList();
        } else {
            // Check if we are on staff profile
            const profileMonthPicker = document.getElementById('profile-month-picker');
            if (profileMonthPicker) {
                const [y, m] = profileMonthPicker.value.split('-');
                StaffManager.renderProfilePage(document.getElementById('view-container'), staffId, parseInt(m) - 1, parseInt(y));
            }
        }

        window.showAlert('Adjustments saved');
    },

    refreshConfigModal: async (staffId) => {
        const month = parseInt(document.getElementById('config-month')?.value, 10);
        const year = parseInt(document.getElementById('config-year')?.value, 10);
        await SalaryManager.showSalaryConfigModal(staffId, month, year);
    },

    showSalaryConfigModal: async (staffId, selectedMonth = null, selectedYear = null) => {
        const staff = (StorageManager.get('staff') || []).find(s => s.id === staffId);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const selected = SalaryManager.getSelectedMonthYear(selectedMonth, selectedYear);
        const currentYear = Math.min(selected.year, new Date().getFullYear());
        const allowedMonthIndexes = SalaryManager.getAllowedMonthIndexes(currentYear);
        const currentMonth = allowedMonthIndexes.includes(selected.month)
            ? selected.month
            : allowedMonthIndexes[allowedMonthIndexes.length - 1];
        const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const payrollSummary = await ApiClient.getPayrollSummary(Number(staffId), currentMonth + 1, currentYear).catch((error) => {
            console.error('Failed to fetch payroll summary', error);
            return null;
        });

        if (!payrollSummary?.preview) {
            window.showAlert?.('Backend salary preview load nahi hua. Real data ke bina preview generate nahi hoga.');
            return;
        }

        const preview = payrollSummary.preview;
        const attCounts = preview.attendance || {};
        const monthlyFineEntries = preview.deduction_entries || [];
        const monthlyPaymentDeduction = Math.round(Number(preview.payment_deduction || 0));
        const monthlyOvertime = Math.round(Number(preview.overtime || 0));
        const advBalance = Math.max(0, Math.round(Number(payrollSummary.available_advance || 0)));
        const holdInfo = payrollSummary.hold_info || { total_hold_days: 0, total_hold_amount: 0 };
        const pendingHoldAmount = Math.round(Number(preview.hold_deduction || 0));
        const holdReleaseAmount = Math.round(Number(preview.hold_release || 0));
        const pendingHoldDays = Number(holdInfo.total_hold_days || 0);
        const hasActiveHold = pendingHoldAmount > 0 || holdReleaseAmount > 0 || pendingHoldDays > 0;
        const daysPresent = Number(attCounts.working_days || 0);
        const earnedSalaryPreview = Math.round(Number(preview.earned_salary || 0));
        const estimatedPayable = Math.max(0, Math.round(Number(preview.before_advance || payrollSummary.estimated_earnings || 0)));

        const content = `
            <div style="padding:0;">
                <div class="input-group" style="margin-bottom:0.65rem;">
                    <label style="font-weight:700; color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Select Month</label>
                    <div style="display:flex; gap:10px;">
                        <select id="config-month" class="full-width" onchange="SalaryManager.refreshConfigModal('${staffId}')" style="padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${allowedMonthIndexes.map((i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${months[i]}</option>`).join('')}
                        </select>
                        <select id="config-year" onchange="SalaryManager.refreshConfigModal('${staffId}')" style="width:110px; padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${SalaryManager.getAllowedYears(currentYear).map((year) => `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`).join('')}
                        </select>
                    </div>
                </div>

                ${advBalance > 0 ? `
                <!-- Advance Payment Section -->
                <div style="margin-bottom:1.5rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--danger);"></div>
                            <span style="font-weight:700; font-size:1rem;">Deduct Advance Payment</span>
                        </div>
                        <input type="checkbox" id="config-adv-toggle" onchange="SalaryManager.updateConfigUI('${staffId}', ${advBalance})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-top:14px;">
                        <div style="padding:10px 12px; border-radius:12px; background:rgba(9, 132, 227, 0.06); border:1px solid rgba(9, 132, 227, 0.12);">
                            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Balance</div>
                            <div style="font-size:1rem; font-weight:800; color:var(--info); margin-top:4px;">₹${advBalance.toLocaleString()}</div>
                        </div>
                    </div>
                    <div id="config-adv-options" style="display:none; margin-top:1.2rem; padding-top:1.2rem; border-top:1px dashed var(--border);">
                        <p style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-bottom:12px;">Balance: ₹${advBalance.toLocaleString()}</p>
                        <div style="display:flex; gap:20px; margin-bottom:15px;">
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="full" checked onchange="SalaryManager.updateConfigUI('${staffId}', ${advBalance})"> Full Amount
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="custom" onchange="SalaryManager.updateConfigUI('${staffId}', ${advBalance})"> Custom Amount
                            </label>
                        </div>
                        <input type="number" id="config-adv-custom" placeholder="Enter amount" oninput="SalaryManager.updateConfigUI('${staffId}', ${advBalance})"
                            style="display:none; width:100%; padding:12px; border-radius:10px; border:1.5px solid var(--border); font-weight:700; font-size:1rem;">
                    </div>
                </div>
                ` : ''}

                <!-- Payment Deduction Section -->
                <div id="new-deduction-section" style="margin-bottom:0.55rem; padding:0.6rem 0.75rem; background:rgba(214, 48, 49, 0.02); border-radius:12px; border:1px solid rgba(214, 48, 49, 0.12);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-minus-circle" style="color:var(--danger); font-size:0.9rem;"></i>
                            <span style="font-weight:800; font-size:0.84rem; color:var(--text-main);">Payment Deduction</span>
                        </div>
                        <button class="btn-icon" style="color:var(--danger); background:rgba(214,48,49,0.07); border:none; width:24px; height:24px;" onclick="SalaryManager.showDeductionPopup('${staffId}', ${currentMonth}, ${currentYear})" title="Add New Deduction">
                            <i class="fas fa-plus" style="font-size:0.8rem;"></i>
                        </button>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        ${monthlyFineEntries.length === 0 ? `
                            <p style="font-size:0.68rem; color:var(--text-muted); text-align:center; padding:4px 6px; background:rgba(0,0,0,0.01); border-radius:8px; border:1px dashed var(--border); margin:0;">No deductions found.</p>
                        ` : monthlyFineEntries.map(f => `
                            <div style="display:flex; align-items:center; justify-content:space-between; background:white; padding:5px 8px; border-radius:9px; border:1px solid var(--border);">
                                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                                    <div style="font-weight:800; color:var(--danger); font-size:0.95rem; white-space:nowrap;">₹${Number(f.amount || 0).toLocaleString()}</div>
                                    <div style="width:1px; height:12px; background:var(--border);"></div>
                                    <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${f.notes || ''}">${f.notes || 'Deduction'}</div>
                                </div>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn-icon" style="width:24px; height:24px; background:transparent; color:var(--info); border:none;" onclick="StaffManager.showEditFineModal('${staffId}', ${f.id})">
                                        <i class="fas fa-edit" style="font-size:0.75rem;"></i>
                                    </button>
                                    <button class="btn-icon" style="width:24px; height:24px; background:transparent; color:var(--danger); border:none;" onclick="StaffManager.deleteFine('${staffId}', ${f.id})">
                                        <i class="fas fa-trash-alt" style="font-size:0.75rem;"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    ${monthlyPaymentDeduction > 0 ? `
                    <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Total:</span>
                        <strong style="color:var(--danger); font-size:0.95rem;">₹${monthlyPaymentDeduction.toLocaleString()}</strong>
                    </div>
                    ` : ''}
                </div>

                ${hasActiveHold ? `
                <!-- Hold Salary Section -->
                <div style="margin-bottom:2rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-lock" style="color:var(--danger); font-size:1.1rem;"></i>
                            <span style="font-weight:700; font-size:1rem;">Release Hold Salary</span>
                        </div>
                        <input type="checkbox" id="config-hold-toggle" onchange="SalaryManager.updateConfigUI('${staffId}', ${advBalance})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Pending hold: ${pendingHoldDays} days | ₹${pendingHoldAmount.toLocaleString()}</p>
                </div>
                ` : ''}

                <!-- Salary Detail Preview -->
                <div id="salary-detail-preview" style="margin-bottom:0.65rem; padding:0.7rem; background:var(--bg-main); border-radius:14px; border:1px solid var(--border);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-file-invoice-dollar" style="color:var(--primary);"></i>
                            <span style="font-weight:800; color:var(--text-main);">Salary Detail Preview</span>
                        </div>
                        <strong id="salary-preview-total" style="font-size:1rem; color:var(--success);">&#8377;${estimatedPayable.toLocaleString()}</strong>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px;">
                        <div style="grid-column:span 2; padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Attendance</span>
                            <strong style="font-size:0.82rem;">${attCounts.present || 0} P / ${attCounts.half || 0} H / ${attCounts.absent || 0} A / ${attCounts.holiday || 0} Hol</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Working Days</span>
                            <strong style="font-size:0.9rem;">${daysPresent}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Earned Salary</span>
                            <strong style="font-size:0.9rem; color:var(--info);">&#8377;${Math.round(earnedSalaryPreview).toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Overtime</span>
                            <strong style="font-size:0.9rem; color:var(--success);">+&#8377;${monthlyOvertime.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Deduction</span>
                            <strong style="font-size:0.9rem; color:var(--danger);">-&#8377;${monthlyPaymentDeduction.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Advance</span>
                            <strong id="salary-advance-deduction-preview" style="font-size:0.9rem; color:#6c5ce7;">-&#8377;0</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Hold</span>
                            <strong id="salary-hold-preview" style="font-size:0.9rem; color:var(--warning);">${holdReleaseAmount > 0 ? '+' : '-'}&#8377;${(holdReleaseAmount > 0 ? holdReleaseAmount : pendingHoldAmount).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:0.75rem; padding:10px 14px; border-radius:15px; background:linear-gradient(135deg, rgba(0,184,148,0.12), rgba(9,132,227,0.10)); border:1px solid rgba(0,184,148,0.25); text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Net Payable Salary</div>
                    <div id="salary-net-payable" style="font-size:1.8rem; line-height:1.05; font-weight:900; color:var(--success); margin-top:3px;">&#8377;${estimatedPayable.toLocaleString()}</div>
                </div>

                <button type="button" id="salary-preview-btn" class="btn-primary full-width" data-staff-id="${staffId}" data-advance-balance="${advBalance}" data-before-advance="${estimatedPayable}" onclick="SalaryManager.handleConfigSubmit('${staffId}', this)" 
                    style="padding:12px; border-radius:14px; font-size:1rem; font-weight:800;">
                    Submit & Preview Slip
                </button>
            </div>
        `;
        ModalManager.show(`Salary Generation : ${staff.name}`, content);
        const modal = document.getElementById('modal-container');
        const card = modal?.querySelector('.modal-card');
        const header = modal?.querySelector('.modal-header');
        const body = modal?.querySelector('.modal-body');
        if (card) {
            card.style.maxHeight = '96vh';
            card.style.padding = '1.35rem';
        }
        if (header) {
            header.style.marginBottom = '0.8rem';
            header.style.paddingBottom = '0.65rem';
        }
        if (body) {
            body.style.overflowY = 'hidden';
            body.style.paddingRight = '0';
        }
        setupCustomDropdown('config-month');
        setupCustomDropdown('config-year');
        setTimeout(() => {
            const previewBtn = document.getElementById('salary-preview-btn');
            if (!previewBtn) return;
            previewBtn.onclick = null;
            previewBtn.addEventListener('click', () => {
                SalaryManager.handleConfigSubmit(staffId, previewBtn);
            });
        }, 0);
    },

    getSelectedAdvanceDeduction: (advanceBalance, beforeAdvance) => {
        const advToggleEl = document.getElementById('config-adv-toggle');
        const advToggle = advToggleEl ? advToggleEl.checked : false;
        const advType = document.querySelector('input[name="adv-type"]:checked')?.value;
        const advCustomValue = parseFloat(document.getElementById('config-adv-custom')?.value) || 0;

        if (!advToggle) return 0;

        const requested = advType === 'full' ? advanceBalance : advCustomValue;
        return Math.min(Math.max(0, requested), advanceBalance, beforeAdvance);
    },

    setConfigNetPayable: (amount) => {
        const payable = Math.max(0, Math.round(Number(amount || 0)));
        const formatted = `₹${payable.toLocaleString()}`;
        const netPayableEl = document.getElementById('salary-net-payable');
        const previewTotalEl = document.getElementById('salary-preview-total');
        if (netPayableEl) netPayableEl.textContent = formatted;
        if (previewTotalEl) previewTotalEl.textContent = formatted;
    },

    setConfigAdvanceDeductionPreview: (amount) => {
        const deduction = Math.max(0, Math.round(Number(amount || 0)));
        const advancePreviewEl = document.getElementById('salary-advance-deduction-preview');
        if (advancePreviewEl) advancePreviewEl.textContent = `-₹${deduction.toLocaleString()}`;
    },

    setConfigHoldPreview: (holdDeduction, holdRelease) => {
        const holdPreviewEl = document.getElementById('salary-hold-preview');
        if (!holdPreviewEl) return;
        const release = Math.max(0, Math.round(Number(holdRelease || 0)));
        const deduction = Math.max(0, Math.round(Number(holdDeduction || 0)));
        holdPreviewEl.textContent = release > 0
            ? `+₹${release.toLocaleString()}`
            : `-₹${deduction.toLocaleString()}`;
    },

    updateConfigUI: async (staffId, advBalance) => {
        const advToggleEl = document.getElementById('config-adv-toggle');
        const advToggle = advToggleEl ? advToggleEl.checked : false;
        const advOptions = document.getElementById('config-adv-options');
        const advCustom = document.getElementById('config-adv-custom');
        const advType = document.querySelector('input[name="adv-type"]:checked')?.value;
        const previewBtn = document.getElementById('salary-preview-btn');
        const monthEl = document.getElementById('config-month');
        const yearEl = document.getElementById('config-year');
        const releaseHold = document.getElementById('config-hold-toggle')?.checked || false;

        if (advOptions) advOptions.style.display = advToggle ? 'block' : 'none';
        if (advCustom) advCustom.style.display = (advToggle && advType === 'custom') ? 'block' : 'none';

        if (!previewBtn || !monthEl || !yearEl) return;

        const beforeAdvance = Math.max(0, Number(previewBtn.dataset.beforeAdvance || 0));
        const selectedDeduction = SalaryManager.getSelectedAdvanceDeduction(
            Math.max(0, Number(advBalance || 0)),
            beforeAdvance
        );
        previewBtn.dataset.selectedAdvanceDeduction = selectedDeduction;
        SalaryManager.setConfigAdvanceDeductionPreview(selectedDeduction);
        SalaryManager.setConfigNetPayable(beforeAdvance - selectedDeduction);

        try {
            const summary = await ApiClient.getPayrollSummary(
                Number(staffId),
                Number(monthEl.value) + 1,
                Number(yearEl.value),
                selectedDeduction,
                releaseHold
            );
            const backendNetPayable = Math.max(0, Math.round(Number(summary?.preview?.final_salary ?? beforeAdvance)));
            SalaryManager.setConfigHoldPreview(summary?.preview?.hold_deduction, summary?.preview?.hold_release);
            SalaryManager.setConfigNetPayable(backendNetPayable);
        } catch (error) {
            console.error('Failed to refresh backend net payable', error);
        }
    },

    showDeductionPopup: (staffId, month, year) => {
        document.getElementById('salary-deduction-popup')?.remove();
        const now = new Date();
        const defaultDate = now.getMonth() === month && now.getFullYear() === year
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
            : `${year}-${String(month + 1).padStart(2, '0')}-01`;

        const popup = document.createElement('div');
        popup.id = 'salary-deduction-popup';
        popup.style.cssText = 'position:fixed; inset:0; z-index:20000; background:rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; padding:18px;';
        popup.innerHTML = `
            <div style="width:min(360px, 100%); background:white; border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.22); padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <strong style="font-size:1rem; color:var(--text-main);">Add Payment Deduction</strong>
                    <button type="button" class="btn-icon" onclick="SalaryManager.closeDeductionPopup()" style="width:28px; height:28px; border:none; background:var(--bg-main); color:var(--text-muted);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="salary-deduction-form" onsubmit="SalaryManager.handleDeductionPopupSubmit(event, '${staffId}', ${month}, ${year})">
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>Date</label>
                        <input type="date" id="salary-deduction-date" required value="${defaultDate}" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:700;">
                    </div>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>Amount (&#8377;)</label>
                        <input type="number" id="salary-deduction-amount" required min="0.01" step="0.01" placeholder="0" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:800;">
                    </div>
                    <div class="input-group" style="margin-bottom:14px;">
                        <label>Remarks</label>
                        <input type="text" id="salary-deduction-notes" placeholder="Reason" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:600;">
                    </div>
                    <button type="submit" class="btn-primary full-width" style="padding:12px; border-radius:12px; font-weight:800;">Save Deduction</button>
                </form>
            </div>
        `;
        popup.addEventListener('click', (event) => {
            if (event.target === popup) SalaryManager.closeDeductionPopup();
        });
        document.body.appendChild(popup);
        setTimeout(() => document.getElementById('salary-deduction-amount')?.focus(), 0);
    },

    closeDeductionPopup: () => {
        document.getElementById('salary-deduction-popup')?.remove();
    },

    handleDeductionPopupSubmit: async (event, staffId, month, year) => {
        event.preventDefault();
        const amount = Number(document.getElementById('salary-deduction-amount')?.value || 0);
        const date = document.getElementById('salary-deduction-date')?.value;
        const notes = document.getElementById('salary-deduction-notes')?.value || '';

        if (!date || amount <= 0) {
            window.showAlert('Valid deduction amount enter karein');
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalHTML = submitBtn?.innerHTML;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }

        try {
            await ApiClient.createAof({
                employee_id: Number(staffId),
                amount,
                date,
                notes,
                type: 'fine',
                repay_months: 1
            });
            await ApiSyncManager.bootstrap(true);
            await ApiSyncManager.syncMonth(month + 1, year, true);
            SalaryManager.closeDeductionPopup();
            await SalaryManager.showSalaryConfigModal(staffId, month, year);
            window.showAlert('Payment deduction recorded');
        } catch (error) {
            window.showAlert(error.message || 'Failed to save payment deduction');
        } finally {
            if (submitBtn?.isConnected) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        }
    },

    getConfigPayload: (staffId) => {
        const month = parseInt(document.getElementById('config-month').value);
        const year = parseInt(document.getElementById('config-year').value);

        const releaseHold = document.getElementById('config-hold-toggle')?.checked || false;

        const previewBtn = document.getElementById('salary-preview-btn');
        const advanceBalance = Math.max(0, Number(previewBtn?.dataset.advanceBalance || 0));
        const beforeAdvance = Math.max(0, Number(previewBtn?.dataset.beforeAdvance || 0));

        let advanceDeduction = SalaryManager.getSelectedAdvanceDeduction(advanceBalance, beforeAdvance);

        if (advanceDeduction < 0) advanceDeduction = 0;
        if (advanceDeduction > advanceBalance) {
            window.showAlert(`Advance deduction balance se zyada nahi ho sakta. Available: ₹${advanceBalance.toLocaleString()}`);
            return null;
        }

        return {
            staffId,
            month,
            year,
            advanceDeduction,
            advanceBalance,
            releaseHold
        };
    },

    handleConfigSubmit: async (staffId, button = null) => {
        const payload = SalaryManager.getConfigPayload(staffId);
        if (!payload) return;

        const originalHTML = button?.innerHTML;
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Preview...';
        }

        try {
            await SalaryManager.showGenerationPreview(payload);
        } finally {
            if (button?.isConnected) {
                button.disabled = false;
                button.innerHTML = originalHTML;
            }
        }
    },

    showGenerationPreview: async (payload) => {
        const { staffId, month, year, advanceDeduction, advanceBalance } = payload;

        try {
            await ApiSyncManager.syncMonth(month + 1, year, true).catch(() => null);

            const payrollSummary = await ApiClient.getPayrollSummary(Number(staffId), month + 1, year, advanceDeduction, payload.releaseHold).catch((error) => {
                console.error('Failed to fetch payroll summary', error);
                return null;
            });
            if (!payrollSummary?.preview || !payrollSummary?.employee?.name || !Number(payrollSummary?.employee?.monthly_salary)) {
                window.showAlert('Backend salary preview load nahi hua. Real data ke bina slip preview nahi banega.');
                return;
            }

            const employee = payrollSummary.employee;
            const staff = {
                id: employee.id,
                name: employee.name,
                role: employee.role || '-',
                salaryType: 'Monthly',
                salaryAmount: Number(employee.monthly_salary)
            };
            const preview = payrollSummary.preview;
            const attendance = preview.attendance || {};
            const p = Number(attendance.present || 0);
            const a = Number(attendance.absent || 0);
            const h = Number(attendance.half || 0);
            const holiday = Number(attendance.holiday || 0);
            const daysPresent = Number(attendance.working_days || 0);
            const earnedSalary = Math.round(Number(preview.earned_salary || 0));
            const monthlyFine = Math.round(Number(preview.payment_deduction || 0));
            const paymentDeductionRemarks = (preview.deduction_entries || [])
                .map((entry) => String(entry.notes || '').trim())
                .filter(Boolean);
            const monthlyOT = Math.round(Number(preview.overtime || 0));
            const holdAmount = Math.round(Number(preview.hold_deduction || 0));
            const holdRelease = Math.round(Number(preview.hold_release || 0));
            const beforeAdvance = Math.max(0, Math.round(Number(preview.before_advance || payrollSummary.estimated_earnings || 0)));
            const finalSalary = Math.max(0, Math.round(Number(preview.final_salary ?? beforeAdvance)));
            const adj = { advance: advanceDeduction, hold: holdAmount > 0, holdDays: 0, releasedAmount: holdRelease };

            const slipHTML = SalaryManager.getCompactSlipHTML({
                staff,
                p,
                a,
                h,
                holiday,
                daysPresent,
                adj,
                finalSalary,
                month,
                year,
                monthlyOT,
                monthlyFine,
                advBalance: Math.max(0, advanceBalance - advanceDeduction),
                earnedSalary,
                holdAmount,
                paymentDeductionRemarks
            });

            const content = `
                <div class="salary-slip-fit-shell">
                    ${slipHTML}
                </div>
                <div class="slip-actions" style="margin-top:0.7rem; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
                    <button class="btn-outline" style="font-weight:800; padding:10px; border-radius:13px;" onclick="SalaryManager.showSalaryConfigModal('${staffId}', ${month}, ${year})">
                        <i class="fas fa-arrow-left"></i> Edit
                    </button>
                    <button class="btn-primary" style="background:var(--success); font-weight:900; padding:10px; border-radius:13px;" onclick="SalaryManager.confirmGenerateSalary('${staffId}', ${month}, ${year}, ${advanceDeduction}, ${payload.releaseHold ? 'true' : 'false'})">
                        <i class="fas fa-check-circle"></i> Generate Salary
                    </button>
                </div>
            `;

            ModalManager.show(`Preview Salary Slip - ${staff.name}`, content);
            SalaryManager.fitActiveSalarySlipModal();
        } catch (error) {
            window.showAlert(error.message || 'Failed to preview salary');
        }
    },

    confirmGenerateSalary: async (staffId, month, year, advanceDeduction = 0, releaseHold = false) => {
        try {
            window.SyncStatus?.show('Generating salary...', 'saving');

            await ApiClient.generatePayroll({
                employee_id: Number(staffId),
                month: month + 1,
                year,
                advance_deduction: Number(advanceDeduction) || 0,
                release_hold: Boolean(releaseHold)
            });

            await ApiSyncManager.syncMonth(month + 1, year, true);

            const dashMonth = document.getElementById('salary-month');
            const dashYear = document.getElementById('salary-year');
            if (dashMonth) dashMonth.value = month;
            if (dashYear) dashYear.value = year;

            window.SyncStatus?.show('Salary generated', 'success', 1600);
            if (window.currentView === 'staff-profile') {
                ModalManager.hide();
                await StaffManager.renderProfilePage(document.getElementById('view-container'), staffId);
                return;
            }

            await SalaryManager.refreshSalaryList();
            await SalaryManager.showSalarySlipUI(staffId, month, year);
        } catch (error) {
            window.showAlert(error.message || 'Failed to generate salary');
        }
    },

    generateAllSalaries: async () => {
        const month = parseInt(document.getElementById('salary-month').value);
        const year = parseInt(document.getElementById('salary-year').value);
        let staff = [];
        try {
            const employees = await ApiClient.listEmployees();
            staff = (employees || []).map((employee) => ApiSyncManager.normalizeEmployee(employee)).filter(SalaryManager.isActiveStaff);
        } catch (error) {
            window.showAlert(`Backend staff data unavailable: ${error.message}`);
            return;
        }

        if (staff.length === 0) {
            window.showAlert('No active staff found');
            return;
        }

        const isConfirmed = await ConfirmManager.ask(`Are you sure you want to generate salary for all ${staff.length} staff members for this month?`);
        if (!isConfirmed) return;

        try {
            const result = await ApiClient.generatePayroll({
                employee_id: -1,
                month: month + 1,
                year
            });
            await ApiSyncManager.syncMonth(month + 1, year, true);
            await SalaryManager.refreshSalaryList();
            window.showAlert(`Successfully generated salary for ${result?.generated || 0} staff members`);
        } catch (error) {
            window.showAlert(error.message || 'Failed to generate salaries');
        }
    },

    deleteAllSalaries: async () => {
        const month = parseInt(document.getElementById('salary-month').value);
        const year = parseInt(document.getElementById('salary-year').value);

        const isConfirmed = await ConfirmManager.ask(`Are you sure you want to delete ALL generated salaries for this month? This will reset all advance and hold deductions.`);
        if (!isConfirmed) return;

        try {
            await ApiClient.deleteAllPayroll(month + 1, year);
            await ApiSyncManager.syncMonth(month + 1, year, true);
            await SalaryManager.refreshSalaryList();
            window.showAlert('Successfully reset salary data for this month');
        } catch (error) {
            window.showAlert(error.message || 'Failed to delete salary records');
        }
    },

    getSlipDataFromSummary: (payrollSummary, month, year, advanceDeduction = null, advanceBalance = null) => {
        if (!payrollSummary?.employee?.name || !Number(payrollSummary?.employee?.monthly_salary)) {
            return null;
        }

        const source = payrollSummary.generated || payrollSummary.preview;
        if (!source) return null;

        const employee = payrollSummary.employee;
        const attendance = source.attendance || {};
        const appliedAdvance = advanceDeduction === null
            ? Number(source.advance_deduction || 0)
            : Number(advanceDeduction || 0);
        const availableAdvance = advanceBalance === null
            ? Number(payrollSummary.available_advance || 0)
            : Number(advanceBalance || 0);
        const beforeAdvance = Math.max(0, Math.round(Number(source.before_advance || payrollSummary.estimated_earnings || 0)));
        const isGeneratedSource = source.final_salary !== undefined && advanceDeduction === null;
        const finalSalary = isGeneratedSource
            ? Math.max(0, Math.round(Number(source.final_salary || 0)))
            : Math.max(0, beforeAdvance - appliedAdvance);

        return {
            staff: {
                id: employee.id,
                name: employee.name,
                role: employee.role || '-',
                salaryType: 'Monthly',
                salaryAmount: Number(employee.monthly_salary)
            },
            p: Number(attendance.present || 0),
            a: Number(attendance.absent || 0),
            h: Number(attendance.half || 0),
            holiday: Number(attendance.holiday || 0),
            daysPresent: Number(attendance.working_days || 0),
            adj: {
                advance: appliedAdvance,
                hold: Number(source.hold_deduction || 0) > 0,
                holdDays: 0,
                releasedAmount: Math.round(Number(source.hold_release || 0))
            },
            finalSalary,
            month,
            year,
            monthlyOT: Math.round(Number(source.overtime || 0)),
            monthlyFine: Math.round(Number(source.payment_deduction || 0)),
            advBalance: Math.max(0, isGeneratedSource ? availableAdvance : availableAdvance - appliedAdvance),
            earnedSalary: Math.round(Number(source.earned_salary || 0)),
            holdAmount: Math.round(Number(source.hold_deduction || 0)),
            paymentDeductionRemarks: (source.deduction_entries || [])
                .map((entry) => String(entry.notes || '').trim())
                .filter(Boolean)
        };
    },

    showSalarySlipUI: async (staffId, month, year) => {
        await ApiSyncManager.syncMonth(month + 1, year, true).catch(() => null);

        const payrollSummary = await ApiClient.getPayrollSummary(Number(staffId), month + 1, year).catch((error) => {
            console.error('Failed to fetch payroll summary', error);
            return null;
        });
        const slipData = SalaryManager.getSlipDataFromSummary(payrollSummary, month, year);
        if (!slipData) {
            window.showAlert('Backend salary data load nahi hua. Real data ke bina slip nahi banegi.');
            return;
        }

        const { staff, p, a, h, holiday, adj, finalSalary, monthlyOT, monthlyFine, advBalance } = slipData;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const slipHTML = SalaryManager.getSlipHTML(slipData);

        const content = `
            <div class="salary-slip-fit-shell">
                ${slipHTML}
            </div>
            <div class="slip-actions" style="margin-top:2rem; padding-bottom: 2rem; display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
                <button class="btn-primary" onclick="SalaryManager.printSlip()"><i class="fas fa-print"></i> Print Slip</button>
                <button class="btn-primary" style="background:#0984e3;" onclick="SalaryManager.downloadPDF('${staff.name}', '${months[month]}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
                <button class="btn-primary" style="background:#25D366; border:none;" onclick="SalaryManager.shareWhatsApp('${staff.name}', ${finalSalary}, '${months[month]}', {p:${p}, a:${a}, h:${h}, holiday:${holiday}, ot:${monthlyOT}, fine:${monthlyFine}, adv:${adj.advance || 0}, bal:${advBalance}})">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-outline" style="grid-column: span 3; font-weight:700; border-color:var(--primary); color:var(--primary);" onclick="ModalManager.hide();">
                    <i class="fas fa-times"></i> Close Preview
                </button>
            </div>
        `;
        ModalManager.show(`Salary Slip - ${staff.name}`, content);
        SalaryManager.fitActiveSalarySlipModal();
    },

    fitActiveSalarySlipModal: () => {
        const modal = document.getElementById('modal-container');
        const card = modal?.querySelector('.modal-card');
        const header = modal?.querySelector('.modal-header');
        const body = modal?.querySelector('.modal-body');
        const shell = modal?.querySelector('.salary-slip-fit-shell');
        const slip = modal?.querySelector('#salary-slip-print');
        const actions = modal?.querySelector('.slip-actions');

        if (!modal || !card || !body || !shell || !slip) return;

        modal.classList.add('salary-slip-modal');
        card.classList.add('salary-slip-modal-card');
        body.classList.add('salary-slip-modal-body');

        const fit = () => {
            slip.style.transform = '';
            shell.style.height = '';
            shell.style.minHeight = '';

            const headerHeight = header?.offsetHeight || 0;
            const actionsHeight = actions?.offsetHeight || 0;
            const cardStyles = window.getComputedStyle(card);
            const bodyStyles = window.getComputedStyle(body);
            const gapValue = parseFloat(bodyStyles.rowGap || bodyStyles.gap || 0);
            const verticalPadding = parseFloat(cardStyles.paddingTop) + parseFloat(cardStyles.paddingBottom)
                + (Number.isFinite(gapValue) ? gapValue : 0);
            const availableWidth = Math.max(280, body.clientWidth);
            const availableHeight = Math.max(260, window.innerHeight - headerHeight - actionsHeight - verticalPadding - 52);
            const slipWidth = Math.max(slip.scrollWidth, slip.offsetWidth, 1);
            const slipHeight = Math.max(slip.scrollHeight, slip.offsetHeight, 1);
            const scale = Math.min(1, availableWidth / slipWidth, availableHeight / slipHeight);
            const fittedHeight = Math.ceil(slipHeight * scale);

            slip.style.transformOrigin = 'top center';
            slip.style.transform = `scale(${scale})`;
            shell.style.height = `${fittedHeight}px`;
            shell.style.minHeight = `${fittedHeight}px`;
        };

        requestAnimationFrame(() => {
            fit();
            requestAnimationFrame(fit);
        });
        window.removeEventListener('resize', SalaryManager._fitSalarySlipOnResize);
        SalaryManager._fitSalarySlipOnResize = fit;
        window.addEventListener('resize', SalaryManager._fitSalarySlipOnResize);
    },

    printSlip: () => {
        const content = document.getElementById('salary-slip-print').innerHTML;
        const win = window.open('', '', 'height=700,width=700');
        win.document.write('<html><head><title>Salary Slip</title>');
        win.document.write('<link rel="stylesheet" href="style.css">');
        win.document.write('<style>body{padding:20px;} .salary-slip{border:1px solid #ddd; padding:20px; border-radius:8px;} .slip-header{text-align:center; margin-bottom:20px;} .slip-row{display:flex; justify-content:space-between; margin-bottom:10px;} .total-row{font-size:1.2rem; border-top:2px solid #333; padding-top:10px; margin-top:10px;} .slip-footer{display:flex; justify-content:space-between; margin-top:50px; border-top:1px dashed #ccc; padding-top:20px;}</style>');
        win.document.write('</head><body>');
        win.document.write(content);
        win.document.write('</body></html>');
        win.document.close();
        setTimeout(() => win.print(), 500);
    },

    downloadPDF: (name, month) => {
        const element = document.getElementById('salary-slip-print');
        const previousTransform = element?.style.transform || '';
        const previousTransformOrigin = element?.style.transformOrigin || '';
        if (element) {
            element.style.transform = '';
            element.style.transformOrigin = '';
        }
        const opt = {
            margin: 1,
            filename: `Salary_Slip_${name}_${month}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        Promise.resolve(html2pdf().set(opt).from(element).save()).finally(() => {
            if (!element) return;
            element.style.transform = previousTransform;
            element.style.transformOrigin = previousTransformOrigin;
        });
    },

    deleteSalary: async (staffId, monthKey) => {
        const isConfirmed = await ConfirmManager.ask('Are you sure you want to delete this generated salary? This will reset advance and hold status for this month.');
        if (!isConfirmed) return;

        const payrollMap = StorageManager.get('payrollMap') || {};
        const adjustments = StorageManager.get('salaryAdjustments') || {};

        // Try to find the record in payrollMap
        let payrollRecord = payrollMap[`${staffId}:${monthKey}`];
        let payrollId = payrollRecord?.id || payrollRecord?.payrollId || (adjustments[staffId]?.[monthKey]?.payrollId);

        if (!payrollId) {
            const [year, month] = monthKey.split('-').map(Number);
            await ApiSyncManager.syncMonth(month, year, true);

            const freshPayrollMap = StorageManager.get('payrollMap') || {};
            const freshAdjustments = StorageManager.get('salaryAdjustments') || {};
            payrollRecord = freshPayrollMap[`${staffId}:${monthKey}`];
            payrollId = payrollRecord?.id || payrollRecord?.payrollId || (freshAdjustments[staffId]?.[monthKey]?.payrollId);

            if (!payrollId) {
                window.showAlert('No generated payroll record ID found. Please try refreshing the page.');
                return;
            }
        }

        try {
            await ApiClient.deletePayroll(payrollId);

            // Manual local cleanup for immediate feedback
            const freshPayrollMap = StorageManager.get('payrollMap') || {};
            delete freshPayrollMap[`${staffId}:${monthKey}`];
            StorageManager.saveLocal('payrollMap', freshPayrollMap);

            if (adjustments[staffId] && adjustments[staffId][monthKey]) {
                delete adjustments[staffId][monthKey];
                StorageManager.saveLocal('salaryAdjustments', adjustments);
            }

            const [year, month] = monthKey.split('-').map(Number);
            await ApiSyncManager.syncMonth(month, year, true);
            await SalaryManager.refreshSalaryList();
            window.showAlert('Generated salary deleted successfully');
        } catch (error) {
            const [year, month] = monthKey.split('-').map(Number);
            if (error.message && error.message.toLowerCase().includes('not found')) {
                await ApiSyncManager.syncMonth(month, year, true);
                await SalaryManager.refreshSalaryList();
                window.showAlert('Salary record already removed');
            } else {
                window.showAlert(error.message || 'Failed to delete salary');
            }
        }
    },

    shareWhatsApp: (name, salary, month, details = {}) => {
        let text = `*CAFE PREMIUM SALARY SLIP*%0A---------------------------%0A*Staff:* ${name}%0A*Month:* ${month}%0A%0A*Attendance Summary:*%0A- Present: ${details.p || 0}%0A- Half Days: ${details.h || 0}%0A- Absent: ${details.a || 0}%0A- Holiday: ${details.holiday || 0}%0A%0A*Financial Details:*%0A- OT: ₹${(details.ot || 0).toLocaleString()}%0A- Payment Deduction: ₹${(details.fine || 0).toLocaleString()}%0A- Advance Adj: ₹${(details.adv || 0).toLocaleString()}%0A%0A*Final Payout: ₹${salary.toLocaleString()}*%0A---------------------------%0A*Balance Advance: ₹${(details.bal || 0).toLocaleString()}*%0A%0AHave a great day!`;
        window.open(`https://wa.me/?text=${text}`, '_blank');
    },

    getCompactSlipHTML: (data) => {
        const { staff, p, a, h, holiday = 0, daysPresent, adj, finalSalary, month, year, monthlyOT, monthlyFine, advBalance, earnedSalary, holdAmount } = data;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const row = (label, value, color = 'var(--text-main)') => `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <span>${label}</span>
                <strong style="color:${color}; white-space:nowrap;">${value}</strong>
            </div>`;

        return `
            <div id="salary-slip-print" class="salary-slip" style="padding:16px; border:1px solid #ddd; border-radius:14px; background:#fff; color:#333; font-family:'Inter', sans-serif;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:10px; margin-bottom:12px; border-bottom:1px solid #eee;">
                    <div>
                        <div style="font-size:0.78rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Salary Slip</div>
                        <strong style="font-size:1rem; color:var(--primary);">${months[month]} ${year}</strong>
                    </div>
                    <div style="text-align:right; font-size:0.8rem; color:var(--text-muted);">
                        <strong style="display:block; color:var(--text-main); font-size:0.95rem;">${staff.name}</strong>
                        ${staff.role || '-'}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div>
                        <h3 style="font-size:0.78rem; color:var(--primary); text-transform:uppercase; margin:0 0 8px; border-left:3px solid var(--primary); padding-left:8px;">Attendance</h3>
                        <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:5px;">
                            ${row('Present', p, 'var(--success)')}
                            ${row('Half', h, 'var(--warning)')}
                            ${row('Absent', a, 'var(--danger)')}
                            ${row('Holiday', holiday, 'var(--info)')}
                            ${row('Working', `${daysPresent} Days`)}
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:0.78rem; color:var(--primary); text-transform:uppercase; margin:0 0 8px; border-left:3px solid var(--primary); padding-left:8px;">Financial</h3>
                        <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:5px;">
                            ${row('Base Salary', SalaryManager.formatSalaryAmountWithHold(staff.salaryAmount, { activeHoldAmount: holdAmount }))}
                            ${row('Earned Salary', `₹${Math.round(earnedSalary).toLocaleString()}`, 'var(--info)')}
                            ${row('Overtime', `+₹${monthlyOT.toLocaleString()}`, 'var(--success)')}
                            ${row('Deduction', `-₹${monthlyFine.toLocaleString()}`, 'var(--danger)')}
                            ${row('Hold', `-₹${Math.round(holdAmount).toLocaleString()}`, 'var(--warning)')}
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Advance Deducted</div>
                        <strong style="font-size:0.95rem; color:var(--danger);">₹${(adj.advance || 0).toLocaleString()}</strong>
                    </div>
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Remaining Balance</div>
                        <strong style="font-size:0.95rem; color:#6c5ce7;">₹${advBalance.toLocaleString()}</strong>
                    </div>
                </div>

                <div style="margin-top:12px; padding:15px; background:linear-gradient(135deg, rgba(0,184,148,0.14), rgba(9,132,227,0.10)); border:2px solid rgba(0,184,148,0.28); border-radius:15px; text-align:center;">
                    <span style="font-size:0.74rem; color:var(--text-muted); text-transform:uppercase; font-weight:900;">Net Payable Salary</span>
                    <div style="font-size:2.35rem; line-height:1.02; font-weight:900; color:var(--success); margin-top:4px;">₹${finalSalary.toLocaleString()}</div>
                    <p style="font-size:0.68rem; color:#777; margin:4px 0 0; font-style:italic;">${numberToWords(Math.round(finalSalary))} Only</p>
                </div>
            </div>`;
    },

    getSlipHTML: (data) => {
        const { staff, p, a, h, holiday = 0, daysPresent, adj, finalSalary, month, year, monthlyOT, monthlyFine, advBalance, earnedSalary, holdAmount, paymentDeductionRemarks = [] } = data;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const escapeHTML = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const paymentDeductionRemarksHTML = monthlyFine > 0 && paymentDeductionRemarks.length > 0
            ? `
                            <div style="margin-top:8px; padding:10px 12px; border-radius:10px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.14);">
                                <div style="font-size:0.75rem; font-weight:700; color:var(--danger); text-transform:uppercase; margin-bottom:6px;">Deduction Remarks</div>
                                <div style="display:flex; flex-direction:column; gap:4px; color:#666; font-size:0.82rem;">
                                    ${paymentDeductionRemarks.map((remark) => `<div>- ${escapeHTML(remark)}</div>`).join('')}
                                </div>
                            </div>
                        `
            : '';
        const businessName = escapeHTML(window.BrandingManager?.getCafeName?.() || 'Cafe Admin');
        const businessAddress = escapeHTML(window.BrandingManager?.getBusinessAddress?.() || '');
        const businessPhone = escapeHTML(window.BrandingManager?.getBusinessPhone?.() || '');
        const businessEmail = escapeHTML(window.BrandingManager?.getBusinessEmail?.() || '');
        const contactParts = [];
        if (businessPhone) contactParts.push(`Contact: ${businessPhone}`);
        if (businessEmail) contactParts.push(`Email: ${businessEmail}`);
        const contactLine = contactParts.join(' | ');

        return `
            <div id="salary-slip-print" class="salary-slip" style="padding:38px; border:1px solid #ddd; border-radius:16px; background:#fff; color:#333; font-family:'Inter', sans-serif; line-height:1.58; overflow:visible;">
                <!-- Business Header -->
                <div style="text-align:center; margin-bottom:28px; border-bottom:2px solid var(--primary); padding-bottom:18px;">
                    <h1 style="margin:0; font-size:2rem; color:var(--primary); text-transform:uppercase; letter-spacing:1px;">${businessName}</h1>
                    ${businessAddress ? `<p style="margin:5px 0 0; font-size:1rem; font-weight:700; color:#555;">${businessAddress}</p>` : ''}
                    ${contactLine ? `<p style="margin:2px 0; color:#777; font-size:0.92rem;">${contactLine}</p>` : ''}
                    <div style="display:flex; justify-content:center; align-items:center; margin-top:18px;">
                        <div style="display:inline-flex; align-items:center; justify-content:center; min-width:190px; padding:6px 18px; background:var(--primary); color:white; border-radius:20px; font-size:0.88rem; font-weight:800;">
                            Salary Slip: ${months[month]} ${year}
                        </div>
                    </div>
                </div>

                <!-- Detail Grid -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:38px;">
                    <!-- Staff & Attendance -->
                    <div>
                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Staff Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Name:</span> <strong>${staff.name}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Role:</span> <strong>${staff.role}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Salary Type:</span> <strong>${staff.salaryType}</strong></div>
                        </div>

                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-top:24px; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Attendance Summary</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Present Days:</span> <strong style="color:var(--success);">${p}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Half Days:</span> <strong style="color:var(--warning);">${h}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Absent Days:</span> <strong style="color:var(--danger);">${a}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Holiday:</span> <strong style="color:var(--info);">${holiday}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Total Working:</span> <strong>${daysPresent} Days</strong></div>
                        </div>
                    </div>

                    <!-- Financial & Advance -->
                    <div>
                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Financial Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Base Salary:</span> <strong>${SalaryManager.formatSalaryAmountWithHold(staff.salaryAmount, { activeHoldAmount: holdAmount })}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--success);"><span>Overtime (+):</span> <strong>₹${monthlyOT.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--danger);"><span>Payment Deduction (-):</span> <strong>₹${monthlyFine.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--warning);"><span>Hold Amount (-):</span> <strong>₹${Math.round(holdAmount).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Earned Salary:</span> <strong>₹${Math.round(earnedSalary).toLocaleString()}</strong></div>
                        </div>
                        ${paymentDeductionRemarksHTML}

                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-top:24px; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Advance Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Advance Deducted:</span> <strong style="color:var(--danger);">₹${(adj.advance || 0).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Remaining Balance:</span> <strong style="color:#6c5ce7;">₹${advBalance.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Final Payout Section -->
                <div style="position:relative; z-index:2; margin:38px 18px 10px; padding:28px; background:linear-gradient(135deg, #dffbf4, #eaf7ff); border:2px solid rgba(0,184,148,0.32); border-radius:16px; text-align:center; box-shadow:0 0 0 14px #fff;">
                    <span style="font-size:1rem; color:var(--text-muted); text-transform:uppercase; font-weight:900; letter-spacing:1px;">Net Payable Salary</span>
                    <div style="font-size:3.25rem; line-height:1.05; font-weight:900; color:var(--success); margin-top:8px;">₹${finalSalary.toLocaleString()}</div>
                    <p style="font-size:0.9rem; color:#777; margin-top:6px; font-style:italic;">(Rupees: ${numberToWords(Math.round(finalSalary))} Only)</p>
                </div>

                <div class="slip-footer" style="display:flex; justify-content:space-between; margin-top:38px;">
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employer Signature</strong>
                    </div>
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employee Signature</strong>
                    </div>
                </div>
            </div>`;
    },

    downloadAllSlips: async () => {
        const monthEl = document.getElementById('report-month') || document.getElementById('salary-month');
        const yearEl = document.getElementById('report-year') || document.getElementById('salary-year');
        if (!monthEl || !yearEl) return;

        const month = parseInt(monthEl.value);
        const year = parseInt(yearEl.value);
        let staffList = [];
        let payrollIds = new Set();
        try {
            const [employees, payrollRows] = await Promise.all([
                ApiClient.listEmployees(),
                ApiClient.listPayroll(month + 1, year)
            ]);
            staffList = (employees || [])
                .map((employee) => ApiSyncManager.normalizeEmployee(employee))
                .filter(s => ['active', 'inactive'].includes(String(s.status || 'active').toLowerCase()));
            payrollIds = new Set((payrollRows || []).map((row) => String(row.employee_id)));
        } catch (error) {
            window.showAlert(`Backend salary slip data unavailable: ${error.message}`);
            return;
        }
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const tempContainer = document.createElement('div');
        tempContainer.style.width = '800px';
        tempContainer.style.background = 'white';

        window.showAlert("Generating all slips... This may take a moment.");

        let hasData = false;
        let renderedCount = 0;
        for (const staff of staffList) {
            if (!payrollIds.has(String(staff.id))) continue;

            const payrollSummary = await ApiClient.getPayrollSummary(Number(staff.id), month + 1, year).catch((error) => {
                console.error('Failed to fetch payroll summary', error);
                return null;
            });
            const slipData = SalaryManager.getSlipDataFromSummary(payrollSummary, month, year);
            if (!slipData) continue;

            const slipWrapper = document.createElement('div');
            slipWrapper.innerHTML = SalaryManager.getSlipHTML(slipData);

            const slip = slipWrapper.firstElementChild;
            if (slip) {
                if (renderedCount > 0) {
                    slip.style.pageBreakBefore = 'always';
                }
                slip.style.marginBottom = '0';
                tempContainer.appendChild(slip);
                renderedCount++;
                hasData = true;
            }
        }

        if (!hasData) {
            window.showAlert("No generated slips found for this month!");
            return;
        }

        const opt = {
            margin: 0.3,
            filename: `Salary_Slips_${months[month]}_${year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Temporarily add to DOM for better rendering
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);

        html2pdf().set(opt).from(tempContainer).save().then(() => {
            document.body.removeChild(tempContainer);
        });
    }
};

function numberToWords(num) {
    if (isNaN(num) || num === null) return '';
    const n = Math.floor(Math.abs(num));
    if (n === 0) return 'Zero';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function make(val) {
        if (val < 20) return a[val];
        if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
        if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' and ' + make(val % 100) : '');
        if (val < 100000) return make(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + make(val % 1000) : '');
        if (val < 10000000) return make(Math.floor(val / 100000)) + ' Lakh' + (val % 100000 !== 0 ? ' ' + make(val % 100000) : '');
        return '';
    }
    return (num < 0 ? 'Minus ' : '') + make(n);
}

window.SalaryManager = SalaryManager;
