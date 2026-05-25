const ReportsManager = {
    currentAttendanceReport: [],
    currentAttendanceMap: {},
    currentExpandedAttendanceStaffId: null,

    getSummaryCount: (summary, status) => {
        const row = (summary || []).find((entry) => entry.status === status);
        return Number(row?.count || 0);
    },

    normalizeReportStatus: (status) => {
        if (status === 'half_day') return 'halfday';
        if (status === 'weekend') return 'holiday';
        return status || '';
    },

    getPayrollStatusMeta: (status) => {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'generated' || normalized === 'paid') {
            return {
                generated: true,
                html: '<span class="status-badge status-active"><i class="fas fa-check-circle" style="margin-right:5px;"></i> Generated</span>'
            };
        }
        if (normalized === 'draft') {
            return {
                generated: false,
                html: '<span class="status-badge" style="background:rgba(0,0,0,0.05); color:var(--text-muted);"><i class="fas fa-file-alt" style="margin-right:5px;"></i> Draft</span>'
            };
        }
        return {
            generated: false,
            html: '<span class="status-badge" style="background:rgba(0,0,0,0.05); color:var(--text-muted);"><i class="fas fa-clock" style="margin-right:5px;"></i> Pending</span>'
        };
    },

    getSlipActionButtonStyle: (isGenerated, color) => {
        const activeColor = color || 'var(--primary)';
        return `padding:8px 12px; font-size:0.8rem; border-radius:10px; background:${isGenerated ? activeColor : '#b8b0ad'}; color:#fff; opacity:${isGenerated ? '1' : '0.55'}; cursor:${isGenerated ? 'pointer' : 'not-allowed'}; border:none;`;
    },

    formatSalaryAmountWithHold: (amount, holdSource = null) => {
        if (window.HoldSalaryUI?.amount) {
            return window.HoldSalaryUI.amount(amount, holdSource);
        }
        return `₹${Number(amount || 0).toLocaleString()}`;
    },

    formatReportDate: (value) => {
        if (!value) return '';
        const d = new Date(`${value}T00:00:00`);
        if (Number.isNaN(d.getTime())) return value;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    },

    getDefaultReportPeriod: async () => {
        const now = new Date();
        const fallback = { month: now.getMonth(), year: now.getFullYear() };

        try {
            const payrollRows = await ApiClient.listPayroll();
            const generatedRows = (payrollRows || [])
                .filter((row) => {
                    const status = String(row.status || '').toLowerCase();
                    return status === 'generated' || status === 'paid' || row.id;
                })
                .map((row) => ({
                    month: Number(row.month || 0),
                    year: Number(row.year || 0),
                    id: Number(row.id || 0)
                }))
                .filter((row) => row.month >= 1 && row.month <= 12 && row.year > 0)
                .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (b.id - a.id));

            if (generatedRows.length > 0) {
                return {
                    month: generatedRows[0].month - 1,
                    year: generatedRows[0].year
                };
            }
        } catch (error) {
            console.error('Failed to load default report payroll period from backend', error);
        }

        return fallback;
    },

    renderExpandedStaffShell: (staff, sectionTitle, detailHtml, actionHtml = '') => `
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:var(--bg-main);">
                    <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff Member</th>
                    <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Section</th>
                    <th style="padding:1.2rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr class="attendance-row active">
                    <td style="padding:1.2rem;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${staff.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(staff.name), '3E2723', 'fff', 35)}" alt="${staff.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(staff.name)}', '3E2723', 'fff', 35)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                            <div>
                                <div style="font-weight:800;">${staff.name}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">${staff.role || 'Staff'}</div>
                            </div>
                        </div>
                    </td>
                    <td style="padding:1.2rem; font-weight:800; color:var(--primary);">${sectionTitle}</td>
                    <td style="padding:1.2rem; text-align:right;">${actionHtml}</td>
                </tr>
                <tr class="details-row active">
                    <td colspan="3" style="padding:0;">
                        <div style="padding:1.5rem; border-top:1px solid var(--border); background:#fafafa;">
                            ${detailHtml}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    `,

    renderExpandedFinancialDetail: (record, staff = null) => {
        if (!record) {
            return '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-weight:800;">Backend payroll record not generated for this month.</div>';
        }
        const cards = [
            ['Base Salary', record.base_salary || 0, 'var(--primary)', staff],
            ['Overtime', record.overtime || 0, 'var(--success)'],
            ['Payment Deduction', Number(record.fine || 0) + Number(record.deduction || 0), 'var(--danger)'],
            ['Advance Deducted', record.advance_deduction || 0, 'var(--info)'],
            ['Hold Salary', record.hold_deduction || 0, 'var(--warning)'],
            ['Net Payable', record.total_salary || 0, 'var(--success)']
        ].map(([label, amount, color, holdSource]) => `
            <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:1rem;">
                <div style="font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">${label}</div>
                <div style="font-size:1.2rem; font-weight:900; color:${color}; margin-top:5px;">${label === 'Base Salary' ? ReportsManager.formatSalaryAmountWithHold(amount, holdSource) : `₹${Number(amount || 0).toLocaleString()}`}</div>
            </div>
        `).join('');

        return `
            <div style="display:grid; grid-template-columns:repeat(3, minmax(160px, 1fr)); gap:12px;">
                ${cards}
            </div>
            <div style="margin-top:12px; color:var(--text-muted); font-size:0.82rem; font-weight:700;">
                Attendance: ${Number(record.present_days || 0)}P / ${Number(record.half_days || 0)}HD / ${Number(record.absent_days || 0)}A / ${Number(record.weekend_holiday_days || 0)}HO
            </div>
        `;
    },

    renderExpandedAdvancesDetail: (entries) => {
        if (!entries.length) {
            return '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-weight:800;">No backend advance records found for this month.</div>';
        }
        return `
            <table style="width:100%; border-collapse:collapse; background:var(--bg-card); border-radius:14px; overflow:hidden;">
                <thead>
                    <tr style="background:var(--bg-main);">
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Date</th>
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Type</th>
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Amount</th>
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map((entry) => `
                        <tr style="border-bottom:1px solid var(--border);">
                            <td style="padding:1rem; font-weight:700;">${ReportsManager.formatReportDate(entry.date)}</td>
                            <td style="padding:1rem;"><span class="badge ${entry.type === 'paid' ? 'badge-danger' : 'badge-success'}">${entry.type.toUpperCase()}</span></td>
                            <td style="padding:1rem; font-weight:900;">₹${Number(entry.amount || 0).toLocaleString()}</td>
                            <td style="padding:1rem; color:var(--text-muted);">${entry.remark || '---'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    renderExpandedSlipDetail: (staff, record, month, year, monthKey, monthName) => {
        const statusMeta = ReportsManager.getPayrollStatusMeta(record?.status);
        const isGenerated = statusMeta.generated;
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <div>
                    <div style="font-size:0.72rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Salary Slip Status</div>
                    <div style="margin-top:8px;">${statusMeta.html}</div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn-primary" onclick="${isGenerated ? `SalaryManager.showSalarySlipUI('${staff.id}', ${month}, ${year})` : 'return false'}"
                        style="${ReportsManager.getSlipActionButtonStyle(isGenerated, 'var(--primary)')}"
                        ${!isGenerated ? 'disabled' : ''} title="View Slip">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-primary" onclick="${isGenerated ? `SalaryManager.showSalarySlipUI('${staff.id}', ${month}, ${year}); setTimeout(() => SalaryManager.printSlip(), 500);` : 'return false'}"
                        style="${ReportsManager.getSlipActionButtonStyle(isGenerated, '#0984e3')}"
                        ${!isGenerated ? 'disabled' : ''} title="Download/Print">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn-primary" onclick="${isGenerated ? `ReportsManager.handleShareSlip('${staff.id}', ${month}, ${year}, '${monthKey}', '${monthName}')` : 'return false'}"
                        style="${ReportsManager.getSlipActionButtonStyle(isGenerated, '#25D366')}"
                        ${!isGenerated ? 'disabled' : ''} title="Share on WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </div>
            ${record ? `<div style="margin-top:1rem; color:var(--text-muted); font-size:0.82rem; font-weight:700;">Net Payable: ₹${Number(record.total_salary || 0).toLocaleString()}</div>` : ''}
        `;
    },

    renderDashboard: async (container) => {
        const dashboard = await ApiClient.getDashboard().catch((error) => {
            console.error('Failed to load dashboard', error);
            return null;
        });

        if (!dashboard?.stats) {
            container.innerHTML = `
                <div class="card" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">
                    Backend dashboard data unavailable
                </div>
            `;
            return;
        }

        const stats = dashboard.stats;
        const staffRows = ReportsManager.getDashboardStaffRows(dashboard.staffOverview || []);
        const attendanceBars = ReportsManager.getDashboardAttendanceBars(dashboard.charts?.attendanceHistory || []);

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#F3E5F5; color:#7B1FA2;"><i class="fas fa-users"></i></div>
                        <span class="stat-trend badge-success">Current</span>
                    </div>
                    <div class="stat-info">
                        <h3>Total Staff</h3>
                        <div class="stat-value">${stats.totalEmployees ?? 0}</div>
                        <div style="display:flex; gap:12px; margin-top:6px; flex-wrap:wrap; font-size:0.75rem; font-weight:700;">
                            <span style="color:var(--success);">Active: ${stats.activeEmployees ?? 0}</span>
                            <span style="color:var(--danger);">Deactive: ${stats.deactiveEmployees ?? 0}</span>
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#E8F5E9; color:#2E7D32;"><i class="fas fa-user-check"></i></div>
                        <span class="stat-trend badge-success">+2.5%</span>
                    </div>
                    <div class="stat-info">
                        <h3>Present Today</h3>
                        <div class="stat-value">${stats.todayPresent ?? 0}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#FFEBEE; color:#C62828;"><i class="fas fa-user-times"></i></div>
                        <span class="stat-trend badge-warning">-1.2%</span>
                    </div>
                    <div class="stat-info">
                        <h3>Absent Today</h3>
                        <div class="stat-value">${stats.todayAbsent ?? 0}</div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3>Payment Detail</h3>
                </div>
                
                <div class="payment-summary-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:1.5rem;">
                    <div>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">TOTAL SALARY</p>
                        <h4 style="font-size:1.25rem; color:var(--primary);">₹${Number(stats.totalBaseSalary || 0).toLocaleString()}</h4>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:20px;">
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">PAYOUT SALARY</p>
                        <h4 style="font-size:1.25rem; color:var(--success);">₹${Number(stats.currentMonthPayable || 0).toLocaleString()}</h4>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:20px;">
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">ADVANCE PAYMENTS</p>
                        <h4 style="font-size:1.25rem; color:var(--info);">₹${Number(stats.totalAdvancePending || 0).toLocaleString()} (${Number(stats.advanceStaffCount || 0)} Staff)</h4>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:20px;">
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">HELD SALARY</p>
                        <h4 style="font-size:1.25rem; color:var(--danger);">₹${Number(stats.heldSalaryAmount || 0).toLocaleString()} (${Number(stats.holdStaffCount || 0)} Staff)</h4>
                    </div>
                </div>
                <div style="text-align:right;">
                    <button class="btn-primary" onclick="switchView('salary')" style="min-width:200px;">
                        <i class="fas fa-wallet" style="margin-right:8px;"></i> Manage Monthly Salaries
                    </button>
                </div>
            </div>

            <div class="dashboard-middle" style="grid-template-columns: 1fr;"> <!-- Made it 1 column -->
                <div class="card">
                    <div class="card-header">
                        <h3>Weekly Attendance Trends</h3>
                        <select class="btn-outline">
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div class="chart-container" style="align-items:end; min-height:230px;">
                        ${attendanceBars.map((bar) => `
                            <div class="chart-bar-wrapper" title="${bar.title}" style="gap:8px;">
                                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:800;">${bar.total}</div>
                                <div class="chart-bar-stack" style="height:${bar.height}%; min-height:${bar.total > 0 ? '18px' : '3px'}; width:28px; border-radius:12px 12px 4px 4px; overflow:hidden; display:flex; flex-direction:column-reverse; background:#eef2f7; box-shadow:inset 0 0 0 1px rgba(0,0,0,0.04);">
                                    <span style="display:block; flex:0 0 ${bar.presentPct}%; background:#00b894;"></span>
                                    <span style="display:block; flex:0 0 ${bar.halfPct}%; background:#fdcb6e;"></span>
                                    <span style="display:block; flex:0 0 ${bar.absentPct}%; background:#d63031;"></span>
                                </div>
                                <span class="chart-label">${bar.label}</span>
                                <span style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">${bar.dateLabel}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="display:flex; justify-content:center; gap:18px; margin-top:14px; font-size:0.75rem; color:var(--text-muted); font-weight:700;">
                        <span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#00b894;"></span> Present</span>
                        <span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#fdcb6e;"></span> Half Day</span>
                        <span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#d63031;"></span> Absent</span>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 2rem;">
                <div class="card-header">
                    <h3>Staff Overview</h3>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-outline"><i class="fas fa-filter"></i> Filter</button>
                        <button class="btn-primary" style="background:#2b1b17;"><i class="fas fa-file-export"></i> Export</button>
                    </div>
                </div>
                <div class="staff-overview">
                    <table>
                        <thead>
                            <tr>
                                <th>EMPLOYEE</th>
                                <th>ROLE</th>
                                <th>SHIFT STATUS</th>
                                <th>CHECK IN</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${staffRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getDashboardStaffRows: (staff = []) => {
        if (staff.length === 0) return '<tr><td colspan="5" style="text-align:center; padding:2rem;">No staff registered yet</td></tr>';

        return staff.slice(0, 5).map(s => `
            <tr>
                <td>
                    <div class="employee-cell">
                        <img src="${s.profile_image || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), '3E2723', 'fff', 40)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', '3E2723', 'fff', 40)" class="employee-avatar">
                        <div>
                            <div style="font-weight:600;">${s.name}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${s.id}</div>
                        </div>
                    </div>
                </td>
                <td>${s.role}</td>
                <td><span class="badge ${ReportsManager.getAttendanceBadgeClass(s.attendance_status)}">${ReportsManager.formatAttendanceStatus(s.attendance_status)}</span></td>
                <td>${s.check_in || '--:--'}</td>
                <td><button class="btn-outline" onclick="switchView('staff-profile', '${s.id}')">View Profile</button></td>
            </tr>
        `).join('');
    },

    getDashboardAttendanceBars: (history = []) => {
        if (!Array.isArray(history) || history.length === 0) {
            return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => ({
                label,
                height: 0,
                isWeekend: index >= 5
            }));
        }

        const max = Math.max(...history.map(row => {
            const present = Number(row.present || 0);
            const absent = Number(row.absent || 0);
            const half = Number(row.half_day || row.halfDay || 0);
            return present + absent + half;
        }), 1);
        return history.slice(-7).map((row, index) => {
            const present = Number(row.present || 0);
            const absent = Number(row.absent || 0);
            const half = Number(row.half_day || row.halfDay || 0);
            const total = present + absent + half;
            const date = row.date ? new Date(`${row.date}T00:00:00`) : null;
            const dateLabel = date && !Number.isNaN(date.getTime())
                ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                : '';
            return {
                label: row.label || row.day || row.month || `D${index + 1}`,
                dateLabel,
                total,
                presentPct: total > 0 ? Math.round((present / total) * 100) : 0,
                absentPct: total > 0 ? Math.round((absent / total) * 100) : 0,
                halfPct: total > 0 ? Math.round((half / total) * 100) : 0,
                height: total > 0 ? Math.max(12, Math.round((total / max) * 100)) : 2,
                isWeekend: Boolean(row.is_weekend || row.isWeekend),
                title: `${row.date || ''} | Present: ${present}, Half: ${half}, Absent: ${absent}`
            };
        });
    },

    getAttendanceBadgeClass: (status) => {
        if (status === 'present') return 'badge-success';
        if (status === 'absent') return 'badge-danger';
        if (status === 'half_day' || status === 'halfday') return 'badge-warning';
        if (status === 'holiday' || status === 'weekend') return 'badge-info';
        return 'badge-warning';
    },

    formatAttendanceStatus: (status) => {
        const labels = {
            present: 'Present',
            absent: 'Absent',
            half_day: 'Half Day',
            halfday: 'Half Day',
            holiday: 'Holiday',
            weekend: 'Weekly Off',
            not_marked: 'Not Marked'
        };
        return labels[status] || 'Not Marked';
    },

    renderReports: async (container) => {
        await ApiSyncManager.bootstrapCore();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const now = new Date();
        const defaultPeriod = await ReportsManager.getDefaultReportPeriod();
        const currentMonth = defaultPeriod.month;
        const currentYear = defaultPeriod.year;
        const yearOptions = Array.from(new Set([currentYear, now.getFullYear(), now.getFullYear() - 1]))
            .filter((year) => Number.isFinite(year) && year > 0)
            .sort((a, b) => b - a);

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2rem; padding-bottom:2rem; animation: fadeIn 0.4s ease-out;">
                <!-- Premium Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, var(--primary), var(--primary-light)); padding:2rem; border-radius:24px; color:white; box-shadow:0 10px 30px rgba(62, 39, 35, 0.15);">
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                            <div style="background:rgba(255,255,255,0.2); width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-chart-pie" style="color:var(--accent);"></i>
                            </div>
                            <h1 style="font-size:1.8rem; font-weight:800; margin:0; letter-spacing:-0.5px;">Business Reports</h1>
                        </div>
                        <p style="opacity:0.8; font-size:0.9rem; font-weight:500;">Analyze your cafe's performance and staff efficiency</p>
                    </div>
                    
                    <div class="report-period-controls">
                        <div class="report-period-control">
                            <select id="report-month" onchange="ReportsManager.refreshReportView()" 
                                class="report-period-select" style="width:150px;">
                                ${months.map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                        <div class="report-period-control">
                            <select id="report-year" onchange="ReportsManager.refreshReportView()" 
                                class="report-period-select" style="width:115px;">
                                ${yearOptions.map((year) => `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Tabs & Quick Actions -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); padding:0.75rem; border-radius:20px; border:1px solid var(--border); box-shadow:var(--shadow);">
                    <div class="report-tabs" style="display:flex; gap:5px; background:var(--bg-main); padding:6px; border-radius:16px;">
                        <button class="report-tab-btn active" onclick="ReportsManager.updateActiveTab(this, 'attendance')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:white; color:var(--primary); box-shadow:0 4px 6px rgba(0,0,0,0.05);">Attendance</button>
                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'salary')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Financials</button>
                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'advances')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Advances</button>
                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'slips')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Salary Slips</button>
                    </div>
                    <button id="report-action-btn" class="btn-primary" onclick="window.print()" style="background:var(--primary); padding:12px 24px; border-radius:14px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-print"></i> <span>Download Report</span>
                    </button>
                </div>

                <!-- Main Data Table Container -->
                <div class="card" style="padding:0; overflow:hidden; border-radius:24px; border:1px solid var(--border);">
                    <div id="report-content" class="table-responsive" style="margin:0;"></div>
                </div>
            </div>
            <style>
                .attendance-row { cursor: pointer; transition: background 0.2s; }
                .attendance-row:hover { background: rgba(0,0,0,0.02) !important; }
                .attendance-row.active { background: #fcfcfc !important; }
                .details-row { display: none; background: #fafafa; border-bottom: 1px solid var(--border); }
                .details-row.active { display: table-row; }
                .calendar-grid { 
                    display: grid; 
                    grid-template-columns: repeat(16, 1fr); 
                    gap: 10px; 
                    padding: 20px; 
                    width: 100%;
                }
                .calendar-day {
                    aspect-ratio: 1/1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid var(--border);
                    transition: all 0.2s;
                }
                .calendar-day span { font-size: 0.62rem; opacity: 0.9; margin-top: 2px; text-transform:uppercase; }
                .day-present { background: var(--success); color: #fff; border-color: var(--success); }
                .day-absent { background: var(--danger); color: #fff; border-color: var(--danger); }
                .day-half { background: var(--warning); color: #3E2723; border-color: var(--warning); }
                .day-off { background: #B2BEC3; color: #fff; border-color: #B2BEC3; }
                .calendar-header { 
                    text-align: center; 
                    font-size: 0.7rem; 
                    font-weight: 700; 
                    color: var(--text-muted); 
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
            </style>
        `;
        window.requestAnimationFrame(() => {
            window.setupCustomDropdown?.('report-month');
            window.setupCustomDropdown?.('report-year');
        });
        ReportsManager.refreshReportView();
    },

    updateActiveTab: (btn, type) => {
        document.querySelectorAll('.report-tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = 'var(--text-muted)';
            b.style.boxShadow = 'none';
        });
        btn.classList.add('active');
        btn.style.background = 'white';
        btn.style.color = 'var(--primary)';
        btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';

        ReportsManager.showReport(type);
    },

    refreshReportView: () => {
        const activeTab = document.querySelector('.report-tab-btn.active');
        const text = activeTab.textContent.toLowerCase();
        const type = text.includes('attendance') ? 'attendance' :
            text.includes('financials') ? 'salary' :
                text.includes('advances') ? 'advances' : 'slips';
        ReportsManager.showReport(type);
    },

    showReport: async (type) => {
        // Update Action Button based on tab
        const actionBtn = document.getElementById('report-action-btn');
        if (actionBtn) {
            if (type === 'slips') {
                actionBtn.onclick = () => SalaryManager.downloadAllSlips();
                actionBtn.querySelector('span').textContent = 'Download All Slips';
                actionBtn.querySelector('i').className = 'fas fa-file-pdf';
                actionBtn.style.background = '#0984e3';
            } else {
                actionBtn.onclick = () => ReportsManager.downloadTableAsPDF(type);
                actionBtn.querySelector('span').textContent = `Download ${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
                actionBtn.querySelector('i').className = 'fas fa-file-pdf';
                actionBtn.style.background = 'var(--primary)';
            }
        }

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const content = document.getElementById('report-content');
        const summaryContainer = document.getElementById('report-summary-cards');
        const month = parseInt(document.getElementById('report-month').value);
        const year = parseInt(document.getElementById('report-year').value);
        let staff = [];
        let attendance = {};
        let adjustments = {};
        let payrollRecords = [];
        let aofState = { advances: {}, fines: {}, overtime: {} };
        try {
            const [employees, aofRows, payrollRows, monthlyAttendance] = await Promise.all([
                ApiClient.listEmployees(),
                ApiClient.listAof(),
                ApiClient.listPayroll(month + 1, year),
                ApiClient.getAttendanceMonth(month + 1, year)
            ]);
            staff = (employees || [])
                .map((employee) => ApiSyncManager.normalizeEmployee(employee))
                .filter(s => s.status === 'active' || s.status === 'inactive');

            (monthlyAttendance?.list || []).forEach((row) => {
                const staffId = String(row.employee_id || '');
                if (!staffId || !row.date) return;
                if (!attendance[row.date]) attendance[row.date] = {};
                attendance[row.date][staffId] = ApiSyncManager.statusFromApi(row.status);
            });
            ReportsManager.currentAttendanceMap = attendance;

            aofState = ApiSyncManager.normalizeAof(aofRows || []);
            StorageManager.saveLocal('advances', aofState.advances);
            StorageManager.saveLocal('fines', aofState.fines);
            StorageManager.saveLocal('overtime', aofState.overtime);
            payrollRecords = payrollRows || [];
            adjustments = ApiSyncManager.buildPayrollState(payrollRecords).salaryAdjustments;
        } catch (error) {
            console.error('Failed to load backend report data', error);
            content.innerHTML = '<div style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend report data unavailable</div>';
            return;
        }
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const payrollByEmployee = {};
        payrollRecords.forEach((record) => {
            payrollByEmployee[String(record.employee_id)] = record;
        });
        const selectedStaff = staff.find((entry) => String(entry.id) === String(ReportsManager.currentExpandedAttendanceStaffId));

        if (type !== 'attendance' && selectedStaff) {
            if (type === 'salary') {
                const selectedPayrollRecord = payrollByEmployee[String(selectedStaff.id)];
                content.innerHTML = ReportsManager.renderExpandedStaffShell(
                    selectedStaff,
                    'Financials',
                    ReportsManager.renderExpandedFinancialDetail(selectedPayrollRecord, selectedStaff),
                    selectedPayrollRecord ? `<button class="btn-primary" onclick="SalaryManager.showSalarySlipUI('${selectedStaff.id}', ${month}, ${year})" style="padding:8px 12px; font-size:0.8rem; border-radius:10px;"><i class="fas fa-file-invoice-dollar"></i> Slip</button>` : ''
                );
                return;
            }

            if (type === 'advances') {
                const entries = ((aofState.advances || {})[String(selectedStaff.id)] || []).filter((entry) => {
                    const d = new Date(`${entry.date}T00:00:00`);
                    return d.getMonth() === month && d.getFullYear() === year;
                });
                content.innerHTML = ReportsManager.renderExpandedStaffShell(
                    selectedStaff,
                    'Advances',
                    ReportsManager.renderExpandedAdvancesDetail(entries)
                );
                return;
            }

            if (type === 'slips') {
                content.innerHTML = ReportsManager.renderExpandedStaffShell(
                    selectedStaff,
                    'Salary Slips',
                    ReportsManager.renderExpandedSlipDetail(selectedStaff, payrollByEmployee[String(selectedStaff.id)], month, year, monthKey, months[month])
                );
                return;
            }
        }

        if (type === 'attendance') {
            let totalP = 0, totalA = 0, totalH = 0;
            const rows = staff.map(s => {
                let p = 0, a = 0, h = 0, off = 0;
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const status = (attendance[dateStr] || {})[s.id];
                    if (status === 'present') p++;
                    else if (status === 'absent') a++;
                    else if (status === 'halfday') h++;
                    else if (status === 'holiday') off++;
                }
                totalP += p; totalA += a; totalH += h;
                return `
                    <tr class="attendance-row" onclick="ReportsManager.toggleStaffAttendance('${s.id}')" id="row-${s.id}">
                        <td style="padding:1.2rem; display:flex; align-items:center; gap:12px;">
                            <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), '3E2723', 'fff', 30)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', '3E2723', 'fff', 30)" style="width:30px; height:30px; border-radius:8px; object-fit:cover;">
                            <span style="font-weight:700;">${s.name} <i class="fas fa-chevron-down" style="font-size:0.7rem; margin-left:8px; opacity:0.3;"></i></span>
                        </td>
                        <td style="padding:1.2rem;"><span style="color:var(--success); font-weight:700;">${p}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem;"><span style="color:var(--danger); font-weight:700;">${a}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem;"><span style="color:var(--warning); font-weight:700;">${h}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem; font-weight:800; background:rgba(0,0,0,0.02); color:var(--success);">${p + (h * 0.5)} <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem; text-align:right;">
                            <button class="btn-outline" onclick="event.stopPropagation(); ReportsManager.downloadSingleStaffCalendar('${s.id}', ${month}, ${year}, '${s.name}')" style="padding:6px 10px; font-size:0.7rem; border-radius:8px;" title="Download Calendar">
                                <i class="fas fa-download"></i>
                            </button>
                        </td>
                    </tr>
                    <tr class="details-row" id="details-${s.id}">
                        <td colspan="6" style="padding:0;">
                            <div style="padding:1.5rem; text-align:center; border-top:1px solid var(--border);">
                                <h4 style="font-size:0.9rem; margin-bottom:1rem; color:var(--primary);">Attendance Calendar - ${months[month]} ${year}</h4>
                                <div id="calendar-export-${s.id}">
                                    ${ReportsManager.renderStaffCalendar(s.id, month, year)}
                                </div>
                                <div style="display:flex; justify-content:center; gap:15px; margin-top:15px; font-size:0.7rem; font-weight:700;">
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--success);"></span> Present</span>
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--danger);"></span> Absent</span>
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--warning);"></span> Half Day</span>
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:#ccc;"></span> Holiday/Off</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            content.innerHTML = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-main);">
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Present</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Absent</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Half</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Att.</th>
                            <th style="padding:1.2rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
            ReportsManager.restoreExpandedAttendanceRow();
        } else if (type === 'salary') {
            let totalF = 0, totalA = 0, totalO = 0;
            const rows = staff.map(s => {
                const adj = (adjustments[s.id] || {})[monthKey] || { advance: 0, hold: false, holdDays: 0 };
                const daysPresent = SalaryManager.calculateDaysPresent(s.id, month, year, attendance);
                const earnedSalary = SalaryManager.calculateBaseEarned(s, daysPresent, month, year);

                const mFine = ((StorageManager.get('fines') || {})[s.id] || []).filter(f => {
                    const d = new Date(f.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                }).reduce((sum, f) => sum + f.amount, 0);

                const mOT = ((StorageManager.get('overtime') || {})[s.id] || []).filter(f => {
                    const d = new Date(f.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                }).reduce((sum, f) => sum + f.amount, 0);

                const dayValue = earnedSalary / (daysPresent || 1);
                const holdAmount = adj.hold ? (dayValue * (adj.holdDays || 0)) : 0;
                const payout = SalaryManager.calculateFinalSalary(s, daysPresent, adj, s.id, month, year);

                return `
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:1rem; font-weight:700;">${s.name}</td>
                        <td style="padding:1rem;">${ReportsManager.formatSalaryAmountWithHold(s.salaryAmount || 0, s)}</td>
                        <td style="padding:1rem; color:var(--success); font-weight:600;">+₹${mOT.toLocaleString()}</td>
                        <td style="padding:1rem; color:var(--danger); font-weight:600;">-₹${mFine.toLocaleString()}</td>
                        <td style="padding:1rem; color:var(--danger); font-weight:600;">-₹${(adj.advance || 0).toLocaleString()}</td>
                        <td style="padding:1rem; color:var(--warning); font-weight:600;">₹${Math.round(holdAmount).toLocaleString()}</td>
                        <td style="padding:1rem; font-weight:600;">₹${Math.round(earnedSalary).toLocaleString()}</td>
                        <td style="padding:1rem; font-weight:800; color:var(--info); background:rgba(9,132,227,0.03);">₹${Math.round(payout).toLocaleString()}</td>
                        <td style="padding:1rem; text-align:right;">
                            <button class="btn-primary" onclick="SalaryManager.showSalarySlipUI('${s.id}', ${month}, ${year})" style="padding:6px 10px; font-size:0.7rem; border-radius:8px;" title="View Slip">
                                <i class="fas fa-file-invoice-dollar"></i> Slip
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            content.innerHTML = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-main);">
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Name</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Base Salary</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Overtime</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Payment Deduction</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Advance Adj</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Hold Salary</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Earn Salary</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Payout</th>
                            <th style="padding:1rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;
        } else if (type === 'advances') {
            const allAdvances = StorageManager.get('advances') || {};
            let logs = [];
            staff.forEach(s => {
                (allAdvances[s.id] || []).filter(a => {
                    const d = new Date(a.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                }).forEach(a => logs.push({ ...a, staffName: s.name }));
            });
            content.innerHTML = `<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:var(--bg-main);"><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Date</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Type</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Amount</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Remark</th></tr></thead><tbody>${logs.map(l => `<tr><td style="padding:1.2rem;">${new Date(l.date).toLocaleDateString()}</td><td style="padding:1.2rem; font-weight:700;">${l.staffName}</td><td style="padding:1.2rem;"><span class="badge ${l.type === 'paid' ? 'badge-danger' : 'badge-success'}">${l.type.toUpperCase()}</span></td><td style="padding:1.2rem; font-weight:800;">₹${l.amount.toLocaleString()}</td><td style="padding:1.2rem; color:var(--text-muted); font-size:0.85rem;">${l.remark || '---'}</td></tr>`).join('')}</tbody></table>`;
        } else if (type === 'slips') {
            const rows = staff.map(s => {
                const payrollRecord = payrollByEmployee[String(s.id)];
                const statusMeta = ReportsManager.getPayrollStatusMeta(payrollRecord?.status);
                const isGenerated = statusMeta.generated;

                return `
                    <tr>
                        <td style="padding:1.2rem;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${s.photo || window.PhotoHelper.avatarUrl(encodeURIComponent(s.name), '3E2723', 'fff', 35)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', '3E2723', 'fff', 35)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                <div>
                                    <div style="font-weight:700;">${s.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${s.role}</div>
                                </div>
                            </div>
                        </td>
                        <td style="padding:1.2rem;">
                            ${statusMeta.html}
                        </td>
                        <td style="padding:1.2rem; text-align:right;">
                            <div style="display:flex; justify-content:flex-end; gap:8px;">
                                <button class="btn-primary" onclick="${isGenerated ? `SalaryManager.showSalarySlipUI('${s.id}', ${month}, ${year})` : 'return false'}"
                                    style="${ReportsManager.getSlipActionButtonStyle(isGenerated, 'var(--primary)')}"
                                    ${!isGenerated ? 'disabled' : ''} title="View Slip">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-primary" onclick="${isGenerated ? `SalaryManager.showSalarySlipUI('${s.id}', ${month}, ${year}); setTimeout(() => SalaryManager.printSlip(), 500);` : 'return false'}"
                                    style="${ReportsManager.getSlipActionButtonStyle(isGenerated, '#0984e3')}"
                                    ${!isGenerated ? 'disabled' : ''} title="Download/Print">
                                    <i class="fas fa-print"></i>
                                </button>
                                <button class="btn-primary" onclick="${isGenerated ? `ReportsManager.handleShareSlip('${s.id}', ${month}, ${year}, '${monthKey}', '${months[month]}')` : 'return false'}"
                                    style="${ReportsManager.getSlipActionButtonStyle(isGenerated, '#25D366')}"
                                    ${!isGenerated ? 'disabled' : ''} title="Share on WhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            content.innerHTML = `
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-main);">
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff Member</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Status</th>
                            <th style="padding:1.2rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staff.length === 0 ? '<tr><td colspan="3" style="padding:3rem; text-align:center; color:var(--text-muted);">No staff found matching the criteria.</td></tr>' : rows}
                    </tbody>
                </table>
            `;
        }
    },

    toggleStaffAttendance: (staffId) => {
        const row = document.getElementById(`row-${staffId}`);
        const details = document.getElementById(`details-${staffId}`);
        if (!row || !details) return;
        const isVisible = details.classList.contains('active');

        // Close others
        document.querySelectorAll('.details-row').forEach(d => d.classList.remove('active'));
        document.querySelectorAll('.attendance-row').forEach(r => r.classList.remove('active'));

        if (!isVisible) {
            ReportsManager.currentExpandedAttendanceStaffId = String(staffId);
            row.classList.add('active');
            details.classList.add('active');
        } else {
            ReportsManager.currentExpandedAttendanceStaffId = null;
        }
    },

    restoreExpandedAttendanceRow: () => {
        const staffId = ReportsManager.currentExpandedAttendanceStaffId;
        if (!staffId) return;
        const row = document.getElementById(`row-${staffId}`);
        const details = document.getElementById(`details-${staffId}`);
        if (!row || !details) return;
        row.classList.add('active');
        details.classList.add('active');
    },

    renderStaffCalendar: (staffId, month, year) => {
        const attendance = ReportsManager.currentAttendanceMap || {};
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '<div class="calendar-grid">';
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Days loop without offset
        for (let d = 1; d <= daysInMonth; d++) {
            const currentDayDate = new Date(year, month, d);
            const dayName = weekDays[currentDayDate.getDay()];
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const status = (attendance[dateStr] || {})[staffId];

            let statusClass = '';
            if (status === 'present') statusClass = 'day-present';
            else if (status === 'absent') statusClass = 'day-absent';
            else if (status === 'halfday') statusClass = 'day-half';
            else if (status === 'holiday') statusClass = 'day-off';

            html += `
                <div class="calendar-day ${statusClass}" title="${d} ${status || 'No Data'}">
                    <div>${d}</div>
                    <span>${dayName}</span>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    handleShareSlip: async (staffId, month, year, monthKey, monthName) => {
        try {
            const summary = await ApiClient.getPayrollSummary(Number(staffId), month + 1, year);
            const slip = SalaryManager.getSlipDataFromSummary(summary, month, year);
            if (!slip) {
                window.showAlert('Backend salary slip data unavailable');
                return;
            }

            SalaryManager.shareWhatsApp(slip.staff.name, slip.finalSalary, monthName, {
                p: slip.presentDays,
                a: slip.absentDays,
                h: slip.halfDays,
                ot: slip.adj.overtime || 0,
                fine: slip.monthlyFine || 0,
                adv: slip.adj.advance || 0,
                bal: slip.advBalance || 0
            });
        } catch (error) {
            window.showAlert(`Backend salary slip data unavailable: ${error.message}`);
        }
    },

    downloadTableAsPDF: async (type) => {
        const element = document.getElementById('report-content');
        const month = parseInt(document.getElementById('report-month').value);
        const year = parseInt(document.getElementById('report-year').value);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Temporarily hide action buttons and columns for clean PDF
        const buttons = element.querySelectorAll('button, .action-cell, th:last-child, td:last-child');
        buttons.forEach(btn => btn.style.display = 'none');

        const opt = {
            margin: 0.3,
            filename: `${type.charAt(0).toUpperCase() + type.slice(1)}_Report_${months[month]}_${year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: (['attendance', 'salary'].includes(type) ? 'landscape' : 'portrait') }
        };

        window.showAlert(`Generating ${type} report PDF...`);
        const html2pdf = await window.loadHtml2Pdf();
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore buttons
            buttons.forEach(btn => btn.style.display = '');
        });
    },

    downloadSingleStaffCalendar: async (staffId, month, year, name) => {
        const element = document.getElementById(`calendar-export-${staffId}`);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        // Wrap in a temporary branded div for better PDF look
        const wrapper = document.createElement('div');
        wrapper.style.padding = '40px';
        wrapper.style.background = '#fff';
        wrapper.style.fontFamily = "var(--app-font)";
        wrapper.innerHTML = `
            <div style="text-align:center; margin-bottom:30px; border-bottom:2px solid #3E2723; padding-bottom:15px;">
                <h1 style="color:#3E2723; margin:0;">CAFE PREMIUM</h1>
                <p style="margin:5px 0; font-weight:700;">Attendance Calendar: ${name}</p>
                <p style="color:#666; font-size:0.9rem;">${months[month]} ${year}</p>
            </div>
            ${element.innerHTML}
            <div style="display:flex; justify-content:center; gap:15px; margin-top:30px; font-size:0.8rem; font-weight:700;">
                <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#00b894;"></span> Present</span>
                <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#d63031;"></span> Absent</span>
                <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#fdcb6e;"></span> Half Day</span>
            </div>
        `;

        const opt = {
            margin: 0.5,
            filename: `Attendance_${name}_${months[month]}_${year}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const html2pdf = await window.loadHtml2Pdf();
        html2pdf().set(opt).from(wrapper).save();
    }
};

window.ReportsManager = ReportsManager;
