const ApiClient = {
    _workingBaseUrl: null,

    get configuredApiRoot() {
        const value = window.EmployeeAdminEnv?.API_BASE_URL || '';
        const configuredUrl = String(value).trim().replace(/\/+$/, '');

        return configuredUrl.replace(/\/api\/v1$/, '');
    },

    get configuredBaseUrl() {
        if (!this.configuredApiRoot) return '';

        if (this.configuredApiRoot.includes('?route=')) {
            return this.configuredApiRoot;
        }

        return `${this.configuredApiRoot}/api/v1`;
    },

    get appRoot() {
        if (this.configuredApiRoot) {
            return this.configuredApiRoot;
        }

        const adminPath = '/employee-admin';
        const currentPath = window.location.pathname || '';
        const adminIndex = currentPath.indexOf(adminPath);

        if (adminIndex !== -1) {
            return `${window.location.origin}${currentPath.slice(0, adminIndex)}/employee-api`;
        }

        return `${window.location.origin}/employee-api`;
    },

    get baseUrl() {
        return `${this.appRoot}/api/v1`;
    },

    get gatewayUrl() {
        return `${this.appRoot}/gateway.php?route=/api/v1`;
    },

    get baseUrlCandidates() {
        const origin = window.location.origin;
        const configuredBaseUrl = this.configuredBaseUrl;
        const fallbackCandidates = configuredBaseUrl
            ? [configuredBaseUrl]
            : [
                `${origin}/api/v1`,
                `${origin}/index.php/api/v1`,
                this.gatewayUrl,
                this.baseUrl,
                `${this.appRoot}/index.php/api/v1`,
                `${this.appRoot}/index.php?route=/api/v1`
            ];
        const candidates = this._workingBaseUrl
            ? [this._workingBaseUrl, ...fallbackCandidates]
            : fallbackCandidates;

        return Array.from(new Set(candidates));
    },

    buildUrl(baseUrl, path) {
        if (!baseUrl.includes('?route=')) {
            return `${baseUrl}${path}`;
        }

        const queryIndex = path.indexOf('?');
        if (queryIndex === -1) {
            return `${baseUrl}${path}`;
        }

        const routePath = path.slice(0, queryIndex);
        const query = path.slice(queryIndex + 1);
        return `${baseUrl}${routePath}&${query}`;
    },

    async request(path, options = {}) {
        const { method = 'GET', body, formData, headers = {} } = options;
        const requestHeaders = {
            Accept: 'application/json',
            'Cache-Control': 'no-store',
            ...headers
        };
        const token = sessionStorage.getItem('employee_management_admin_token');
        if (token) {
            requestHeaders.Authorization = `Bearer ${token}`;
        }

        const fetchOptions = {
            method,
            headers: requestHeaders,
            cache: 'no-store'
        };

        if (formData) {
            fetchOptions.body = formData;
            delete fetchOptions.headers['Content-Type'];
        } else if (body !== undefined) {
            fetchOptions.headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(body);
        }

        let lastError = null;

        for (const baseUrl of this.baseUrlCandidates) {
            try {
                const response = await fetch(this.buildUrl(baseUrl, path), fetchOptions);
                const raw = await response.text();

                let payload = null;
                if (raw) {
                    try {
                        payload = JSON.parse(raw);
                    } catch (error) {
                        if (response.status === 404) {
                            lastError = new Error(`Invalid server response (${response.status})`);
                            continue;
                        }
                        throw new Error(`Invalid server response (${response.status})`);
                    }
                }

                if (response.status === 404) {
                    lastError = new Error(payload?.message || `Request failed (${response.status})`);
                    continue;
                }

                if (!response.ok || payload?.status === false) {
                    throw new Error(payload?.message || `Request failed (${response.status})`);
                }

                this._workingBaseUrl = baseUrl;
                return payload?.data ?? null;
            } catch (error) {
                lastError = error;
                if (!String(error?.message || '').includes('(404)')) {
                    throw error;
                }
            }
        }

        throw lastError || new Error('API request failed');
    },

    login(username, password) {
        return this.request('/login', {
            method: 'POST',
            body: { username, password }
        });
    },

    changePassword(username, currentPassword, newPassword) {
        return this.request('/profile/change-password', {
            method: 'POST',
            body: {
                username,
                current_password: currentPassword,
                new_password: newPassword
            }
        });
    },

    getProfile(params = {}) {
        const query = new URLSearchParams();
        if (params.id) query.set('id', params.id);
        if (params.username) query.set('username', params.username);
        return this.request(`/profile?${query.toString()}`);
    },

    updateProfile(id, data) {
        return this.request(`/profile/update/${encodeURIComponent(id)}`, {
            method: 'POST',
            body: data
        });
    },

    getDashboard() {
        return this.request('/dashboard');
    },

    getAttendanceReport(month, year) {
        return this.request(`/reports/attendance?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
    },

    getSalaryReport(month, year) {
        return this.request(`/reports/salary?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
    },

    listEmployees() {
        return this.request('/employees');
    },

    createEmployee(data) {
        return this.request('/employees', {
            method: 'POST',
            body: data
        });
    },

    updateEmployee(id, data) {
        return this.request(`/employees/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    deleteEmployee(id) {
        return this.request(`/employees/${id}`, {
            method: 'DELETE'
        });
    },

    uploadEmployeeImage(id, file) {
        const formData = new FormData();
        formData.append('profile_image', file);

        return this.request(`/employees/${id}/upload-image`, {
            method: 'POST',
            formData
        });
    },

    uploadProfileImage(id, file) {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('profile_image', file);

        return this.request('/profile/upload-image', {
            method: 'POST',
            formData
        });
    },

    getAttendanceByDate(date) {
        return this.request(`/attendance?date=${encodeURIComponent(date)}`);
    },

    getAttendanceByEmployeeMonth(employeeId, month, year) {
        return this.request(`/attendance?employee_id=${encodeURIComponent(employeeId)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
    },

    getAttendanceMonth(month, year) {
        return this.request(`/attendance?scope=month&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
    },

    saveAttendance(record) {
        return this.request('/attendance', {
            method: 'POST',
            body: record
        });
    },

    saveAttendanceBulk(records) {
        return this.request('/attendance/bulk', {
            method: 'POST',
            body: { records }
        });
    },

    listAof() {
        return this.request('/aof');
    },

    getAofSummary(employeeId) {
        return this.request(`/aof/summary?employee_id=${encodeURIComponent(employeeId)}`);
    },

    createAof(data) {
        return this.request('/aof', {
            method: 'POST',
            body: data
        });
    },

    transferFund(data) {
        return this.request('/aof/transfer', {
            method: 'POST',
            body: data
        });
    },

    updateAof(id, data) {
        return this.request(`/aof/${id}`, {
            method: 'PUT',
            body: data
        });
    },

    deleteAof(id) {
        return this.request(`/aof/${id}`, {
            method: 'DELETE'
        });
    },

    listPayroll(month, year) {
        if (month === undefined || month === null || year === undefined || year === null) {
            return this.request('/payroll');
        }
        return this.request(`/payroll?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
    },

    getPayrollSummary(employeeId, month, year, advanceDeduction = null, releaseHold = false) {
        let url = `/payroll/summary?employee_id=${encodeURIComponent(employeeId)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
        if (advanceDeduction !== null) {
            url += `&advance_deduction=${encodeURIComponent(Number(advanceDeduction) || 0)}`;
        }
        if (releaseHold) {
            url += '&release_hold=1';
        }
        return this.request(url);
    },

    generatePayroll(data) {
        return this.request('/payroll/generate', {
            method: 'POST',
            body: data
        });
    },

    addManualHold(employeeId, days, amount = 0) {
        return this.request('/payroll/add-hold', {
            method: 'POST',
            body: {
                employee_id: Number(employeeId),
                days: Number(days) || 0,
                amount: Number(amount) || 0
            }
        });
    },

    releaseManualHold(employeeId, days = 0) {
        return this.request('/payroll/release-hold', {
            method: 'POST',
            body: {
                employee_id: Number(employeeId),
                days: Number(days) || 0
            }
        });
    },

    deletePayroll(id) {
        return this.request(`/payroll/${id}`, {
            method: 'DELETE'
        });
    },

    deleteAllPayroll(month, year) {
        return this.request(`/payroll/delete-all?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
            method: 'DELETE'
        });
    },

    getSettings() {
        return this.request('/settings');
    },

    updateSettings(data) {
        return this.request('/settings', {
            method: 'PUT',
            body: data
        });
    }
};

window.PayrollSettings = {
    /**
     * Get the days divisor for salary calculation.
     * @param {number} month 1-12
     * @param {number} year e.g. 2026
     * @returns {number}
     */
    getDaysDivisor(month, year) {
        const s = StorageManager.get('payroll_settings') || {};
        if (s.payroll_mode === 'per_day') {
            return new Date(year, month, 0).getDate();
        }
        return Number(s.monthly_days || 30) || 30;
    }
};

window.PhotoHelper = {
    normalizeImageUrl(value = '') {
        const raw = String(value || '').trim();
        if (!raw) return '';
        if (/^(data:|blob:)/i.test(raw)) return raw;
        if (/^https?:/i.test(raw)) {
            try {
                const url = new URL(raw);
                if (url.origin === window.location.origin && url.pathname.startsWith('/uploads/')) {
                    return `${ApiClient.appRoot}${url.pathname}`;
                }
            } catch (error) {
                return raw;
            }
            return raw;
        }
        if (/^[^/\\]+\.(png|jpe?g|webp|gif|svg)$/i.test(raw)) return '';

        const path = raw.startsWith('/')
            ? raw
            : `/uploads/profile/${raw.replace(/^uploads\/profile\//, '')}`;

        if (path.startsWith('/uploads/')) {
            return `${ApiClient.appRoot}${path}`;
        }

        return `${window.location.origin}${path}`;
    },

    decodeName(encodedName = '') {
        try {
            return decodeURIComponent(encodedName);
        } catch (error) {
            return encodedName || 'User';
        }
    },

    getInitials(encodedName = '') {
        const name = this.decodeName(encodedName);
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    },

    pickBackground(encodedName = '', fallback = '8B5E3C') {
        if (fallback && fallback !== 'random') return fallback;

        const colors = ['3E2723', '0F766E', '166534', '1D4ED8', '7C3AED', 'B45309', 'BE123C', '374151'];
        const seed = this.decodeName(encodedName)
            .split('')
            .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        return colors[seed % colors.length];
    },

    avatarUrl(encodedName, background = 'random', color = 'fff', size = 80) {
        const initials = this.getInitials(encodedName);
        const bg = this.pickBackground(encodedName, background);
        const safeColor = color || 'fff';
        const fontSize = Math.max(14, Math.round(size * 0.38));
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#${bg}" />
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                    font-family="Mulish" font-size="${fontSize}" font-weight="700" fill="#${safeColor}">
                    ${initials}
                </text>
            </svg>
        `.replace(/\s+/g, ' ').trim();

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    },

    applyFallback(img, encodedName, background = 'random', color = 'fff', size = 80) {
        if (!img) return;
        img.onerror = null;
        img.src = this.avatarUrl(encodedName, background, color, size);
    }
};

window.HoldSalaryUI = {
    isHeld(source) {
        return Number(source?.activeHoldAmount || source?.active_hold_amount || 0) > 0
            || Number(source?.activeHoldDays || source?.active_hold_days || 0) > 0
            || Number(source?.total_hold_amount || 0) > 0
            || Number(source?.total_hold_days || 0) > 0;
    },

    icon(source) {
        return this.isHeld(source)
            ? '<i class="fas fa-lock hold-salary-lock" title="Salary hold active"></i>'
            : '';
    },

    amount(amount, source) {
        return `<span class="salary-amount-with-lock">₹${Number(amount || 0).toLocaleString()}${this.icon(source)}</span>`;
    }
};

const ApiSyncManager = {
    CACHE_TTL_MS: 5 * 60 * 1000,
    _bootPromise: null,
    _bootIncludesMonth: false,
    _monthPromises: {},
    _datePromises: {},
    _monthSyncedAt: {},
    _dateSyncedAt: {},

    statusFromApi(status) {
        if (status === 'half_day') return 'halfday';
        if (status === 'weekend') return 'holiday';
        return status;
    },

    statusToApi(status) {
        if (status === 'halfday') return 'half_day';
        return status;
    },

    monthKey(month, year) {
        return `${year}-${String(month).padStart(2, '0')}`;
    },

    isFresh(timestamp) {
        return Number(timestamp) > 0 && (Date.now() - timestamp) < this.CACHE_TTL_MS;
    },

    touchMonth(month, year) {
        this._monthSyncedAt[this.monthKey(month, year)] = Date.now();
    },

    touchDate(date) {
        this._dateSyncedAt[date] = Date.now();
    },

    primeAttendanceDay(date, dayData) {
        const attendance = StorageManager.get('attendance') || {};
        attendance[date] = { ...(dayData || {}) };
        StorageManager.saveLocal('attendance', attendance);
        this.touchDate(date);

        const parsedDate = new Date(`${date}T00:00:00`);
        if (!Number.isNaN(parsedDate.getTime())) {
            this.touchMonth(parsedDate.getMonth() + 1, parsedDate.getFullYear());
        }
    },

    normalizeEmployee(employee) {
        return {
            id: String(employee.id),
            name: employee.name || '',
            fatherName: employee.father_name || '',
            dob: employee.dob || employee.date_of_birth || '',
            mobile: employee.mobile || '',
            mobileAlt: employee.alternate_mobile || '',
            role: employee.role || 'Staff',
            joinDate: employee.join_date || '',
            status: String(employee.status || 'active').toLowerCase(),
            salaryType: 'Monthly',
            salaryAmount: Number(employee.monthly_salary || 0),
            activeHoldDays: Number(employee.active_hold_days || 0),
            activeHoldAmount: Number(employee.active_hold_amount || 0),
            photo: window.PhotoHelper.normalizeImageUrl(employee.profile_image) || null
        };
    },

    normalizeAof(aofRecords) {
        const advances = {};
        const savings = {};
        const transfers = {};
        const fines = {};
        const overtime = {};

        (aofRecords || []).forEach((record) => {
            const employeeId = String(record.employee_id);
            const entry = {
                id: Number(record.id),
                amount: Number(record.amount || 0),
                date: record.date,
                remark: record.notes || '',
                type: record.type || ''
            };

            if (record.type === 'advance' || record.type === 'advance_paid') {
                if (!advances[employeeId]) advances[employeeId] = [];
                advances[employeeId].push({
                    ...entry,
                    type: record.type === 'advance' ? 'paid' : 'received'
                });
            } else if (record.type === 'saving_deposit' || record.type === 'saving_withdraw') {
                if (!savings[employeeId]) savings[employeeId] = [];
                savings[employeeId].push({
                    ...entry,
                    type: record.type === 'saving_deposit' ? 'deposit' : 'withdraw'
                });
            } else if (record.type === 'transfer_loan_to_saving' || record.type === 'transfer_saving_to_loan') {
                if (!transfers[employeeId]) transfers[employeeId] = [];
                transfers[employeeId].push({
                    ...entry,
                    type: record.type === 'transfer_loan_to_saving' ? 'loan_to_saving' : 'saving_to_loan'
                });
            } else if (record.type === 'overtime') {
                if (!overtime[employeeId]) overtime[employeeId] = [];
                overtime[employeeId].push(entry);
            } else if (record.type === 'fine' || record.type === 'deduction') {
                if (!fines[employeeId]) fines[employeeId] = [];
                fines[employeeId].push(entry);
            }
        });

        return { advances, savings, transfers, fines, overtime };
    },

    buildPayrollState(payrollRecords) {
        const salaryAdjustments = {};
        const payrollMap = {};

        (payrollRecords || []).forEach((record) => {
            const employeeId = String(record.employee_id);
            const monthKey = this.monthKey(record.month, record.year);
            const recordDivisor = Number(record.days_divisor || 0) || window.PayrollSettings.getDaysDivisor(Number(record.month), Number(record.year));
            const dailyRate = Number(record.base_salary || 0) / recordDivisor;
            const holdDays = dailyRate > 0 ? Math.round(Number(record.hold_deduction || 0) / dailyRate) : 0;

            if (!salaryAdjustments[employeeId]) salaryAdjustments[employeeId] = {};
            salaryAdjustments[employeeId][monthKey] = {
                overtime: Number(record.overtime || 0),
                advance: Number(record.advance_deduction || 0),
                fine: Number(record.fine || 0),
                adjustment: 0,
                hold: Number(record.hold_deduction || 0) > 0,
                holdDays,
                status: 'generated',
                payrollId: Number(record.id),
                paid: Number(record.paid || 0) === 1,
                netPayable: Number(record.total_salary || 0),
                totalDays: Number(record.total_days || 0),
                presentDays: Number(record.present_days || 0),
                absentDays: Number(record.absent_days || 0),
                halfDays: Number(record.half_days || 0),
                holdAmount: Number(record.hold_deduction || 0),
                releasedAmount: Number(record.hold_salary_released || 0),
                weekendHolidayAmount: Number(record.weekend_holiday_amount || 0),
                raw: record
            };

            payrollMap[`${employeeId}:${monthKey}`] = record;
        });

        return { salaryAdjustments, payrollMap, payrollRecords: payrollRecords || [] };
    },

    mergeAttendance(existingAttendance, incomingAttendance) {
        return {
            ...(existingAttendance || {}),
            ...(incomingAttendance || {})
        };
    },

    mergeSalaryAdjustments(existingAdjustments, incomingAdjustments) {
        const merged = { ...(existingAdjustments || {}) };

        Object.entries(incomingAdjustments || {}).forEach(([staffId, monthMap]) => {
            merged[staffId] = {
                ...(merged[staffId] || {}),
                ...(monthMap || {})
            };
        });

        return merged;
    },

    async syncCore(options = {}) {
        const { includeCurrentMonth = true } = options;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [employees, aofRecords, payrollRecords, dashboard, settings] = await Promise.all([
            ApiClient.listEmployees(),
            ApiClient.listAof(),
            ApiClient.listPayroll(month, year),
            ApiClient.getDashboard(),
            ApiClient.getSettings().catch(() => null)
        ]);

        if (settings) {
            StorageManager.saveLocal('payroll_settings', settings);
            ['cafe_name', 'business_address', 'business_phone', 'business_email'].forEach((key) => {
                if (settings[key] !== undefined) {
                    StorageManager.save(key, settings[key]);
                }
            });
            window.BrandingManager?.applyBranding?.();
        }

        const localStaff = (employees || []).map((employee) => this.normalizeEmployee(employee));
        const { advances, savings, transfers, fines, overtime } = this.normalizeAof(aofRecords);
        const payrollState = this.buildPayrollState(payrollRecords);

        StorageManager.saveLocal('staff', localStaff);
        StorageManager.saveLocal('advances', advances);
        StorageManager.saveLocal('savings', savings);
        StorageManager.saveLocal('transfers', transfers);
        StorageManager.saveLocal('fines', fines);
        StorageManager.saveLocal('overtime', overtime);
        StorageManager.saveLocal('salaryAdjustments', payrollState.salaryAdjustments);
        StorageManager.saveLocal('payrollRecords', payrollState.payrollRecords);
        StorageManager.saveLocal('payrollMap', payrollState.payrollMap);
        StorageManager.saveLocal('apiDashboard', dashboard);

        if (includeCurrentMonth) {
            await this.syncMonth(month, year, true);
        }
    },

    async bootstrap(force = false, options = {}) {
        const includeCurrentMonth = options.includeCurrentMonth !== false;

        if (!force && this._bootPromise) {
            if (this._bootIncludesMonth || !includeCurrentMonth) {
                return this._bootPromise;
            }
        }

        const previousPromise = (!force && includeCurrentMonth && this._bootPromise && !this._bootIncludesMonth)
            ? this._bootPromise
            : null;

        this._bootIncludesMonth = includeCurrentMonth;

        const promise = (async () => {
            if (previousPromise) {
                await previousPromise.catch(() => null);
            }

            await this.syncCore({ includeCurrentMonth });
        })().catch((error) => {
            if (this._bootPromise === promise) {
                this._bootPromise = null;
                this._bootIncludesMonth = false;
            }
            throw error;
        });

        this._bootPromise = promise;
        return promise;
    },

    async bootstrapCore(force = false) {
        return this.bootstrap(force, { includeCurrentMonth: false });
    },

    async syncMonth(month, year, force = false) {
        const key = this.monthKey(month, year);
        if (!force && this.isFresh(this._monthSyncedAt[key])) return Promise.resolve();
        if (!force && this._monthPromises[key]) return this._monthPromises[key];

        const run = async () => {
            const attendanceMap = {};

            try {
                const monthlyAttendance = await ApiClient.getAttendanceMonth(month, year);
                const rows = monthlyAttendance?.list || [];

                rows.forEach((row) => {
                    const staffId = String(row.employee_id || '');
                    if (!staffId) return;
                    if (!attendanceMap[row.date]) attendanceMap[row.date] = {};
                    attendanceMap[row.date][staffId] = this.statusFromApi(row.status);
                });
            } catch (error) {
                const employees = StorageManager.get('staff') || [];
                const attendanceEntries = await Promise.all(
                    employees.map(async (staff) => {
                        try {
                            const data = await ApiClient.getAttendanceByEmployeeMonth(staff.id, month, year);
                            return { staffId: staff.id, data };
                        } catch (fallbackError) {
                            return { staffId: staff.id, data: null };
                        }
                    })
                );

                const hasAnyAttendanceResponse = attendanceEntries.some((entry) => Array.isArray(entry?.data?.list));
                if (!hasAnyAttendanceResponse) {
                    throw error;
                }

                attendanceEntries.forEach((entry) => {
                    const rows = entry?.data?.list || [];
                    rows.forEach((row) => {
                        if (!attendanceMap[row.date]) attendanceMap[row.date] = {};
                        attendanceMap[row.date][entry.staffId] = this.statusFromApi(row.status);
                    });
                });
            }

            const payrollRecords = await ApiClient.listPayroll(month, year);
            const payrollState = this.buildPayrollState(payrollRecords);

            const existingAttendance = StorageManager.get('attendance') || {};
            const existingPayrollMap = StorageManager.get('payrollMap') || {};

            // CRITICAL: Clear all entries for this specific month from maps to reflect deletions
            const monthKey = this.monthKey(month, year);

            // Clear in payrollMap
            const updatedPayrollMap = { ...existingPayrollMap };
            Object.keys(updatedPayrollMap).forEach(key => {
                if (key.endsWith(`:${monthKey}`)) {
                    delete updatedPayrollMap[key];
                }
            });

            const updatedAttendance = { ...existingAttendance };
            Object.keys(updatedAttendance).forEach((date) => {
                if (date.startsWith(`${monthKey}-`)) {
                    delete updatedAttendance[date];
                }
            });

            // Now merge the fresh data
            StorageManager.saveLocal('attendance', this.mergeAttendance(updatedAttendance, attendanceMap));
            StorageManager.saveLocal('salaryAdjustments', payrollState.salaryAdjustments);
            StorageManager.saveLocal('payrollRecords', payrollState.payrollRecords);
            StorageManager.saveLocal('payrollMap', {
                ...updatedPayrollMap,
                ...payrollState.payrollMap
            });
            this.touchMonth(month, year);
        };

        this._monthPromises[key] = run()
            .finally(() => {
                delete this._monthPromises[key];
            });

        return this._monthPromises[key];
    },

    async syncDate(date, force = false) {
        if (!force && this.isFresh(this._dateSyncedAt[date])) return Promise.resolve();
        if (!force && this._datePromises[date]) return this._datePromises[date];

        const run = async () => {
            const rows = await ApiClient.getAttendanceByDate(date);
            const attendance = StorageManager.get('attendance') || {};
            const dayData = {};

            (rows || []).forEach((row) => {
                dayData[String(row.employee_id)] = this.statusFromApi(row.status);
            });

            attendance[date] = dayData;
            StorageManager.saveLocal('attendance', attendance);
            this.touchDate(date);
        };

        this._datePromises[date] = run()
            .finally(() => {
                delete this._datePromises[date];
            });

        return this._datePromises[date];
    },

    async refreshAfterMutation(month = null, year = null) {
        await this.bootstrap(true);

        if (month && year) {
            await this.syncMonth(month, year, true);
        }
    }
};
