const SettingsManager = {
    _activeTab: 'admin',
    currentSettings: null,

    loadBackendSettings: async (force = false) => {
        if (SettingsManager.currentSettings && !force) {
            return SettingsManager.currentSettings;
        }

        const settings = await ApiClient.getSettings();
        SettingsManager.currentSettings = settings || {};
        ['cafe_name', 'business_address', 'business_phone', 'business_email'].forEach((key) => {
            if (SettingsManager.currentSettings[key] !== undefined) {
                StorageManager.save(key, SettingsManager.currentSettings[key]);
            }
        });
        StorageManager.saveLocal('payroll_settings', {
            payroll_mode: SettingsManager.currentSettings.payroll_mode,
            monthly_days: SettingsManager.currentSettings.monthly_days
        });
        return SettingsManager.currentSettings;
    },

    getSettingValue: (key) => SettingsManager.currentSettings?.[key],

    renderSettings: async (container) => {
        const user = await AuthManager.resolveCurrentUser();
        const displayName = window.BrandingManager?.getCafeName?.()
            || user?.business_name
            || user?.name
            || user?.username
            || 'Admin User';
        const displayRole = user?.role || 'Administrator';

        container.innerHTML = `
            <div class="view-header" style="margin-bottom:2rem;">
                <h2 style="font-size:2rem; color:var(--primary);">System Settings</h2>
                <p style="color:var(--text-muted);">Configure your account and system preferences</p>
            </div>

            <div class="card settings-shell" style="padding:0; border-radius:var(--radius-lg); overflow:hidden;">
                <!-- Tabs Header -->
                <div class="settings-tabs" style="display:flex; background:var(--bg-main); padding:8px; gap:8px; border-bottom:1px solid var(--border);">
                    <button class="settings-tab-btn ${SettingsManager._activeTab === 'admin' ? 'active' : ''}" onclick="SettingsManager.switchTab('admin')">
                        <i class="fas fa-user-shield"></i> Admin Setting
                    </button>
                    <button class="settings-tab-btn ${SettingsManager._activeTab === 'defaults' ? 'active' : ''}" onclick="SettingsManager.switchTab('defaults')">
                        <i class="fas fa-sliders-h"></i> Default Setting
                    </button>
                    <button class="settings-tab-btn ${SettingsManager._activeTab === 'theme' ? 'active' : ''}" onclick="SettingsManager.switchTab('theme')">
                        <i class="fas fa-palette"></i> Theme
                    </button>
                </div>

                <!-- Tab Content Container -->
                <div id="settings-tab-content" class="settings-tab-content" style="padding:2rem; min-height:400px; transition: var(--transition);">
                    ${await SettingsManager.getTabContent(SettingsManager._activeTab, user)}
                </div>
            </div>
        `;
    },

    switchTab: async (tabId) => {
        if (tabId === 'access') {
            tabId = 'admin';
        }
        SettingsManager._activeTab = tabId;
        const container = document.getElementById('settings-tab-content');
        if (!container) return;

        // Visual active state update
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            const isMatch = btn.getAttribute('onclick').includes(`'${tabId}'`);
            btn.classList.toggle('active', isMatch);
        });

        const user = await AuthManager.resolveCurrentUser();
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px)';

        setTimeout(async () => {
            container.innerHTML = await SettingsManager.getTabContent(tabId, user);
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 150);
    },

    getTabContent: async (tabId, user) => {
        const displayName = window.BrandingManager?.getCafeName?.()
            || user?.business_name
            || user?.name
            || user?.username
            || 'Admin User';
        const displayRole = user?.role || 'Administrator';
        const encodedName = encodeURIComponent(displayName);
        const logoSrc = window.BrandingManager?.getBusinessLogo?.() || window.PhotoHelper.normalizeImageUrl(user?.profile_image) || '';
        const avatarSrc = logoSrc || window.PhotoHelper.avatarUrl(encodedName, 'C8A97E', 'fff', 120);
        const escapeAttr = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        let backendSettings = null;
        try {
            backendSettings = await SettingsManager.loadBackendSettings();
        } catch (error) {
            if (tabId === 'defaults' || tabId === 'admin') {
                return `
                    <div style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">
                        Backend settings data unavailable
                    </div>
                `;
            }
        }
        const cafeName = escapeAttr(backendSettings?.cafe_name || '');
        const businessAddress = escapeAttr(backendSettings?.business_address || '');
        const businessPhone = escapeAttr(backendSettings?.business_phone || '');
        const businessEmail = escapeAttr(backendSettings?.business_email || '');

        switch (tabId) {
            case 'admin':
                return `
                    <div class="settings-admin-layout" style="display:grid; grid-template-columns: 280px 1fr; gap:3rem; animation: fadeIn 0.3s ease;">
                        <div class="settings-admin-side" style="display:flex; flex-direction:column; gap:12px;">
                            <button class="nav-item active" style="border:none; width:100%; border-radius:12px;" onclick="SettingsManager.switchTab('admin')">
                                <i class="fas fa-id-card"></i> Profile & Security
                            </button>
                            
                            <div class="settings-logo-card" style="margin-top:2rem; padding:1.5rem; text-align:center; background:var(--bg-main); border-radius:16px;">
                                <div class="settings-logo-box" style="position:relative; width:90px; height:90px; margin:0 auto 1rem; border-radius:12px; border:2px dashed var(--border); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="SettingsManager.showCompanyLogoModal()">
                                    <img id="settings-company-logo" src="${logoSrc}" alt="Company logo" onerror="this.src='https://placehold.co/200x200?text=LOGO'" style="max-width:80%; max-height:80%; object-fit:contain;">
                                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.3); border-radius:10px; color:white; display:flex; align-items:center; justify-content:center; opacity:0; transition:0.3s;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0">
                                        <i class="fas fa-camera"></i>
                                    </div>
                                </div>
                                <p style="font-size:0.75rem; font-weight:700; color:var(--text-main);">Update Logo</p>
                            </div>
                        </div>

                        <div class="settings-admin-main" style="display:flex; flex-direction:column; gap:2rem;">
                                <!-- Identity -->
                                <div class="settings-identity-card" style="display:flex; align-items:center; gap:1.5rem; background:var(--bg-main); padding:1.5rem; border-radius:16px;">
                                    <div style="position:relative; width:80px; height:80px; border-radius:24px; border:3px solid white; overflow:hidden; cursor:pointer;" onclick="AuthManager.showProfileImageModal()">
                                        <img src="${avatarSrc}" alt="${displayName} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodedName}', 'C8A97E', 'fff', 80)" style="width:100%; height:100%; object-fit:cover;">
                                    </div>
                                    <div>
                                        <h3 style="font-size:1.2rem; color:var(--text-main); margin-bottom:4px;">${displayName}</h3>
                                        <p style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">${displayRole}</p>
                                    </div>
                                </div>

                                <!-- Security Controls -->
                                <div>
                                    <h4 style="margin-bottom:1rem; font-family:var(--app-font);">Branding</h4>
                                    <div class="settings-branding-card" style="background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:16px;">
                                        <div class="settings-card-head" style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                                            <div>
                                                <p style="font-weight:700; color:var(--text-main); margin-bottom:6px;">Business Details</p>
                                                <p style="font-size:0.85rem; color:var(--text-muted);">Salary slip header, sidebar, login page, and browser title mein ye details show hongi.</p>
                                            </div>
                                            <button class="btn-primary" onclick="SettingsManager.saveBusinessBranding()">Save</button>
                                        </div>
                                        <div class="settings-branding-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                            <div class="input-group" style="margin-bottom:0;">
                                                <label>Cafe Name</label>
                                                <input type="text" id="settings-cafe-name" value="${cafeName}" maxlength="40" placeholder="Enter cafe name" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                            <div class="input-group" style="margin-bottom:0;">
                                                <label>Contact Number</label>
                                                <input type="text" id="settings-business-phone" value="${businessPhone}" maxlength="40" placeholder="+91 98765 43210" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                            <div class="input-group" style="grid-column:span 2; margin-bottom:0;">
                                                <label>Address</label>
                                                <input type="text" id="settings-business-address" value="${businessAddress}" maxlength="120" placeholder="Near Clock Tower, Main Market, City" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                            <div class="input-group" style="grid-column:span 2; margin-bottom:0;">
                                                <label>Email</label>
                                                <input type="email" id="settings-business-email" value="${businessEmail}" maxlength="120" placeholder="info@example.com" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style="margin-bottom:1rem; font-family:var(--app-font);">Security & Password</h4>
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:16px;">
                                        <div>
                                            <p style="font-weight:700; color:var(--text-main);">Change Admin Password</p>
                                            <p style="font-size:0.85rem; color:var(--text-muted);">Current password verify karke API par update hota hai.</p>
                                        </div>
                                        <button class="btn-primary" onclick="SettingsManager.showChangePasswordModal()">Update</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 style="margin-bottom:1rem; font-family:var(--app-font);">System Controls</h4>
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:16px; margin-bottom:1rem;">
                                        <div>
                                            <p style="font-weight:700; color:var(--text-main);">Cloud Force Sync</p>
                                            <p style="font-size:0.85rem; color:var(--text-muted);">Sync records with server immediately.</p>
                                        </div>
                                        <button class="btn-outline" onclick="SettingsManager.forceSync()">Sync Now</button>
                                    </div>

                                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(214, 48, 49, 0.03); border:1px dashed rgba(214, 48, 49, 0.2); padding:1.25rem; border-radius:16px;">
                                        <div>
                                            <p style="font-weight:700; color:var(--danger);">Clear Local Cache</p>
                                            <p style="font-size:0.85rem; color:var(--text-muted);">This will reset data and log you out.</p>
                                        </div>
                                        <button class="btn-outline" style="color:var(--danger); border-color:rgba(214, 48, 49, 0.4);" onclick="SettingsManager.clearLocalCache()">Logout & Reset</button>
                                    </div>
                                </div>
                        </div>
                    </div>
                `;
            case 'defaults':
                const settings = backendSettings || await SettingsManager.loadBackendSettings(true);
                const salaryCycle = Number(settings.salary_cycle);
                const salaryCycleType = settings.salary_cycle_type;
                const salaryCycleWeekday = Number(settings.salary_cycle_weekday);
                const weeklyHoliday = Number(settings.weekly_holiday);
                const autoHoldEnabled = String(settings.auto_hold_enabled) === '1' || settings.auto_hold_enabled === true;
                const autoHoldDays = Number(settings.auto_hold_days || 0);
                const payrollMode = settings.payroll_mode;
                const monthlyDays = settings.monthly_days;
                const colorStarBadge = settings.color_star_badge;
                const colorAdvance = settings.color_advance;
                const colorDeduction = settings.color_deduction;
                const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                const cycleSuffix = salaryCycle == 1 ? 'st' : salaryCycle == 2 ? 'nd' : salaryCycle == 3 ? 'rd' : 'th';

                let cycleDisplay = "";
                if (salaryCycleType === 'Monthly') {
                    cycleDisplay = `${salaryCycle}${cycleSuffix} Day`;
                } else if (salaryCycleType === 'Weekly') {
                    cycleDisplay = `Every ${daysOfWeek[salaryCycleWeekday]}`;
                } else {
                    cycleDisplay = "Daily";
                }

                return `
                    <div style="max-width:850px; animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom:2rem; font-family:var(--app-font); display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-sliders-h text-primary"></i> Default Business Rules
                        </h4>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                            <!-- Salary Cycle -->
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div>
                                    <p style="font-weight:700; color:var(--text-main);">Salary Cycle</p>
                                    <p style="font-size:0.8rem; color:var(--text-muted);">${salaryCycleType} reset</p>
                                </div>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span class="badge badge-warning">${cycleDisplay}</span>
                                    <button class="btn-icon-sm" onclick="SettingsManager.showSalaryCycleModal()"><i class="fas fa-edit"></i></button>
                                </div>
                            </div>

                            <!-- Weekly Holiday -->
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div>
                                    <p style="font-weight:700; color:var(--text-main);">Weekly Holiday</p>
                                    <p style="font-size:0.8rem; color:var(--text-muted);">Select fixed day-off</p>
                                </div>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span class="badge badge-info">${daysOfWeek[weeklyHoliday]}</span>
                                    <button class="btn-icon-sm" onclick="SettingsManager.showWeeklyHolidayModal()"><i class="fas fa-chevron-down"></i></button>
                                </div>
                            </div>

                            <!-- Payroll Calculation Mode -->
                            <div style="grid-column: span 2; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1.5rem; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:260px;">
                                        <p style="font-weight:700; color:var(--text-main);">Payroll Calculation Mode</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                                            <strong>Monthly:</strong> Fixed days (e.g. 30) for all months. <strong>Per Day:</strong> Actual calendar days (28/29/30/31).
                                        </p>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <span id="payroll-mode-badge" class="badge badge-info">${payrollMode === 'per_day' ? 'Per Day (Calendar)' : 'Monthly (' + monthlyDays + ' days)'}</span>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:end; gap:12px; margin-top:1rem; flex-wrap:wrap;">
                                    <div style="min-width:200px;">
                                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">Mode</label>
                                        <select id="payroll-mode-select" onchange="SettingsManager.toggleMonthlyDaysField()" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:700; color:var(--text-main);">
                                            <option value="monthly" ${payrollMode !== 'per_day' ? 'selected' : ''}>Monthly (Fixed Days)</option>
                                            <option value="per_day" ${payrollMode === 'per_day' ? 'selected' : ''}>Per Day (Calendar Days)</option>
                                        </select>
                                    </div>
                                    <div id="monthly-days-wrap" style="display:${payrollMode !== 'per_day' ? 'block' : 'none'}; min-width:140px;">
                                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">Days in Month</label>
                                        <input type="number" id="monthly-days-input" min="28" max="31" value="${monthlyDays}" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:700; color:var(--text-main);">
                                    </div>
                                    <button class="btn-primary" onclick="SettingsManager.savePayrollMode()">Save</button>
                                </div>
                            </div>

                            <div style="grid-column: span 2; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1.5rem; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:260px;">
                                        <p style="font-weight:700; color:var(--text-main);">Auto Salary Hold For New Staff</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Default OFF. ON karne par new staff ke join month me entered days ka hold auto set ho jayega.</p>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <span id="auto-hold-status-badge" class="badge ${autoHoldEnabled ? 'badge-danger' : 'badge-success'}">${autoHoldEnabled ? `ON • ${autoHoldDays} Days` : 'OFF'}</span>
                                        <label class="switch-toggle" title="Toggle Auto Hold">
                                            <input type="checkbox" id="auto-hold-enabled" ${autoHoldEnabled ? 'checked' : ''} onchange="SettingsManager.toggleAutoHoldFields(this.checked)">
                                            <span class="slider-round"></span>
                                        </label>
                                    </div>
                                </div>

                                <div style="display:flex; align-items:end; gap:12px; margin-top:1rem; flex-wrap:wrap;">
                                    <div id="auto-hold-days-wrap" style="display:${autoHoldEnabled ? 'block' : 'none'}; min-width:220px;">
                                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">Hold Days</label>
                                        <input type="number" id="auto-hold-days" min="1" max="31" value="${autoHoldDays > 0 ? autoHoldDays : 10}" placeholder="Enter hold days" oninput="SettingsManager.toggleAutoHoldFields(document.getElementById('auto-hold-enabled').checked)" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:700;">
                                    </div>
                                    <button class="btn-primary" onclick="SettingsManager.saveAutoHoldDefaults()">Save Auto Hold</button>
                                </div>
                            </div>

                            <!-- Star Badge Color Setting -->
                            <div style="grid-column: span 2; display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                                <!-- Top Performance Star -->
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                    <div>
                                        <p style="font-weight:700; color:var(--text-main);">Top Performance</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-star" style="color:${colorStarBadge}"></i> Star Badge Color</p>
                                    </div>
                                    <input type="color" value="${colorStarBadge}" onchange="SettingsManager.updateSystemColor('color_star_badge', this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                                </div>

                                <!-- Advance Payment Star -->
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                    <div>
                                        <p style="font-weight:700; color:var(--text-main);">Advance Payment</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-star" style="color:${colorAdvance}"></i> Star Indicator Color</p>
                                    </div>
                                    <input type="color" value="${colorAdvance}" onchange="SettingsManager.updateSystemColor('color_advance', this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                                </div>

                                <!-- Payment Deduction Star -->
                                <div style="grid-column: span 2; display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                    <div>
                                        <p style="font-weight:700; color:var(--text-main);">Payment Deduction</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-star" style="color:${colorDeduction}"></i> Star Indicator Color</p>
                                    </div>
                                    <input type="color" value="${colorDeduction}" onchange="SettingsManager.updateSystemColor('color_deduction', this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                                </div>
                            </div>

                            <!-- Auto Sync (System) -->
                            <div style="grid-column: span 2; display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px dashed var(--border); border-radius:16px; margin-top:1rem;">
                                <div>
                                    <p style="font-weight:700; color:var(--text-main); font-size:0.9rem;">Cloud Sync Interval</p>
                                    <p style="font-size:0.75rem; color:var(--text-muted);">Current: Every 5 Minutes</p>
                                </div>
                                <button class="btn-icon-sm"><i class="fas fa-history"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            case 'theme':
                const manualColor = StorageManager.get('custom_primary_color') || '#3E2723';
                const themes = [
                    { id: 'theme-cafe', name: 'Cafe Gold', colors: ['#3E2723', '#5B4037'], desc: 'Classic premium' },
                    { id: 'theme-light', name: 'Clean Light', colors: ['#f8f9fa', '#e9ecef'], desc: 'Minimalist' },
                    { id: 'theme-dark', name: 'Midnight', colors: ['#1A1210', '#121212'], desc: 'High-contrast' },
                    { id: 'theme-ocean', name: 'Ocean Blue', colors: ['#00695C', '#00897B'], desc: 'Calm water' },
                    { id: 'theme-forest', name: 'Forest Green', colors: ['#2E7D32', '#388E3C'], desc: 'Natural vibes' },
                    { id: 'theme-royal', name: 'Royal Purple', colors: ['#4527A0', '#512DA8'], desc: 'Majestic feel' },
                    { id: 'theme-sunset', name: 'Sunset Orange', colors: ['#E64A19', '#F4511E'], desc: 'Warm glow' },
                    { id: 'theme-ruby', name: 'Ruby Red', colors: ['#C62828', '#D32F2F'], desc: 'Energetic' },
                    { id: 'theme-slate', name: 'Modern Slate', colors: ['#37474F', '#455A64'], desc: 'Sophisticated' },
                    { id: 'theme-nebula', name: 'Space Nebula', colors: ['#1A237E', '#283593'], desc: 'Deep galaxy' },
                    { id: 'theme-rose', name: 'Rose Petal', colors: ['#AD1457', '#C2185B'], desc: 'Sweet touch' },
                    { id: 'theme-teal', name: 'Cyber Teal', colors: ['#00838F', '#0097A7'], desc: 'Tech focus' },
                    { id: 'theme-amber', name: 'Vibrant Amber', colors: ['#FF8F00', '#FFA000'], desc: 'Sunny day' },
                    { id: 'theme-indigo', name: 'Indigo Night', colors: ['#283593', '#303F9F'], desc: 'Urban look' },
                    { id: 'theme-brown', name: 'Rustic Brown', colors: ['#4E342E', '#5D4037'], desc: 'Earthy' },
                    { id: 'theme-gray', name: 'Industrial Gray', colors: ['#424242', '#616161'], desc: 'Professional' },
                    { id: 'theme-mint', name: 'Fresh Mint', colors: ['#00695C', '#26A69A'], desc: 'Cool & clean' },
                    { id: 'theme-cherry', name: 'Wild Cherry', colors: ['#880E4F', '#C2185B'], desc: 'Bold fruit' },
                    { id: 'theme-cobalt', name: 'Pure Cobalt', colors: ['#1565C0', '#1976D2'], desc: 'Solid blue' },
                    { id: 'theme-leaf', name: 'Leafy Green', colors: ['#558B2F', '#689F38'], desc: 'Eco friendly' },
                    { id: 'theme-gold', name: 'Luxury Gold', colors: ['#F9A825', '#FBC02D'], desc: 'Elite status' },
                    { id: 'theme-smoke', name: 'White Smoke', colors: ['#CFD8DC', '#ECEFF1'], desc: 'Aery light' },
                    { id: 'theme-carbon', name: 'Carbon Black', colors: ['#212121', '#424242'], desc: 'Stealth mode' },
                    { id: 'theme-lavender', name: 'Soft Lavender', colors: ['#6A1B9A', '#7B1FA2'], desc: 'Relaxing' },
                    { id: 'theme-coral', name: 'Sea Coral', colors: ['#D84315', '#FF5722'], desc: 'Bright ocean' },
                    { id: 'theme-olive', name: 'Vintage Olive', colors: ['#33691E', '#558B2F'], desc: 'Classic army' },
                    { id: 'theme-sky', name: 'Daylight Sky', colors: ['#0277BD', '#0288D1'], desc: 'Open air' },
                    { id: 'theme-maroon', name: 'Rich Maroon', colors: ['#b71c1c', '#c62828'], desc: 'Old school' },
                    { id: 'theme-sand', name: 'Desert Sand', colors: ['#A1887F', '#BCAAA4'], desc: 'Neutral' },
                    { id: 'theme-neon', name: 'Neon Power', colors: ['#1b5e20', '#2e7d32'], desc: 'High energy' }
                ];

                return `
                    <div style="animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom:1.5rem; font-family:var(--app-font);">Visual Identity & Experience</h4>
                        
                        <!-- Manual Color Picker -->
                        <div style="margin-bottom:2rem; padding:1.5rem; background:var(--bg-card); border-radius:16px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <p style="font-weight:700; color:var(--text-main);">Manual Theme Color</p>
                                <p style="font-size:0.8rem; color:var(--text-muted);">Override primary system color manually</p>
                            </div>
                            <div style="display:flex; align-items:center; gap:15px;">
                                <div id="current-manual-color-preview" style="width:30px; height:30px; border-radius:8px; background:${manualColor}; border:2px solid white; box-shadow:0 0 0 1px #ddd;"></div>
                                <input type="color" value="${manualColor}" onchange="SettingsManager.updateManualThemeColor(this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1rem;">
                            ${themes.map(t => `
                                <div class="theme-option-card ${document.body.classList.contains(t.id) ? 'active' : ''}" 
                                     onclick="SettingsManager.setTheme('${t.id}', this, '${t.colors[0]}')"
                                     style="padding:12px; cursor:pointer; border:2px solid var(--border); border-radius:12px; background:var(--bg-card); transition:all 0.2s;">
                                    <div style="width:100%; height:40px; background:linear-gradient(45deg, ${t.colors[0]}, ${t.colors[1]}); border-radius:8px; margin-bottom:0.8rem;"></div>
                                    <p style="font-weight:700; color:var(--text-main); font-size:0.9rem; margin-bottom:2px;">${t.name}</p>
                                    <p style="font-size:0.7rem; color:var(--text-muted);">${t.desc}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
        }
    },

    setTheme: (theme, el, primaryColor = null) => {
        if (primaryColor) {
            StorageManager.save('custom_primary_color', primaryColor);
        }
        ThemeManager.setTheme(theme);

        // Update selection in settings page
        document.querySelectorAll('.theme-option-card').forEach(card => {
            card.classList.remove('active');
            card.style.borderColor = 'var(--border)';
        });
        if (el) {
            el.classList.add('active');
            el.style.borderColor = 'var(--primary)';
        }

        // Toggle manual preview if exists
        const preview = document.getElementById('current-manual-color-preview');
        if (preview && primaryColor) preview.style.background = primaryColor;

        window.showAlert(`Theme changed to ${theme.replace('theme-', '').toUpperCase()}`);
    },

    updateManualThemeColor: (color) => {
        StorageManager.save('custom_primary_color', color);
        // We keep the current theme class but override the color
        const currentTheme = StorageManager.get('theme') || 'theme-cafe';
        ThemeManager.applyTheme(currentTheme);

        const preview = document.getElementById('current-manual-color-preview');
        if (preview) preview.style.background = color;

        window.showAlert('Custom primary color applied!');
    },

    toggleAutoHoldFields: (enabled) => {
        const wrap = document.getElementById('auto-hold-days-wrap');
        const badge = document.getElementById('auto-hold-status-badge');
        const input = document.getElementById('auto-hold-days');

        if (wrap) {
            wrap.style.display = enabled ? 'block' : 'none';
        }

        if (badge) {
            const days = Math.max(1, parseInt(input?.value, 10) || 0);
            badge.className = `badge ${enabled ? 'badge-danger' : 'badge-success'}`;
            badge.textContent = enabled ? `ON • ${days} Days` : 'OFF';
        }
    },

    toggleMonthlyDaysField: () => {
        const mode = document.getElementById('payroll-mode-select')?.value;
        const wrap = document.getElementById('monthly-days-wrap');
        if (wrap) wrap.style.display = mode === 'per_day' ? 'none' : 'block';
    },

    savePayrollMode: async () => {
        const mode = document.getElementById('payroll-mode-select')?.value || 'monthly';
        const days = document.getElementById('monthly-days-input')?.value || '30';
        const daysNum = parseInt(days, 10);

        if (mode === 'monthly' && (daysNum < 28 || daysNum > 31)) {
            window.showAlert('Monthly days must be between 28 and 31');
            return;
        }

        try {
            const updated = await ApiClient.updateSettings({ payroll_mode: mode, monthly_days: String(daysNum) });
            SettingsManager.currentSettings = updated || await SettingsManager.loadBackendSettings(true);
            const savedMode = SettingsManager.currentSettings?.payroll_mode || mode;
            const savedDays = SettingsManager.currentSettings?.monthly_days || String(daysNum);
            StorageManager.saveLocal('payroll_settings', { payroll_mode: savedMode, monthly_days: savedDays });
            const selectedSalary = window.SalaryManager?.getSelectedMonthYear?.();
            if (selectedSalary?.month !== undefined && selectedSalary?.year !== undefined) {
                await window.ApiSyncManager?.syncMonth?.(selectedSalary.month + 1, selectedSalary.year, true);
            }
            const badge = document.getElementById('payroll-mode-badge');
            if (badge) {
                badge.textContent = savedMode === 'per_day' ? 'Per Day (Calendar)' : `Monthly (${savedDays} days)`;
            }
            // Refresh salary list if on salary page
            if (typeof SalaryManager !== 'undefined' && document.getElementById('salary-list')) {
                await SalaryManager.refreshSalaryList();
            }
            window.showAlert(savedMode === 'per_day' ? 'Payroll mode set to Per Day (actual calendar days)' : `Payroll mode set to Monthly (${savedDays} days)`);
        } catch (e) {
            window.showAlert('Failed to save payroll mode: ' + (e.message || 'Unknown error'));
        }
    },

    saveAutoHoldDefaults: async () => {
        const enabled = document.getElementById('auto-hold-enabled')?.checked || false;
        const input = document.getElementById('auto-hold-days');
        const days = enabled ? (parseInt(input?.value, 10) || 0) : 0;

        if (enabled && (days < 1 || days > 31)) {
            window.showAlert('Hold days 1 se 31 ke beech hone chahiye');
            input?.focus();
            return;
        }

        try {
            const updated = await ApiClient.updateSettings({
                auto_hold_enabled: enabled ? '1' : '0',
                auto_hold_days: String(enabled ? days : 0)
            });
            SettingsManager.currentSettings = updated || await SettingsManager.loadBackendSettings(true);
            SettingsManager.toggleAutoHoldFields(enabled);
            window.showAlert(enabled ? `Default auto hold enabled for ${days} days` : 'Default auto hold disabled');
        } catch (error) {
            window.showAlert(`Failed to save auto hold settings: ${error.message}`);
        }
    },

    saveCafeName: async () => {
        return SettingsManager.saveBusinessBranding();
    },

    saveBusinessBranding: async () => {
        const input = document.getElementById('settings-cafe-name');
        if (!input) return;

        const cafeName = input.value.trim();
        const businessAddress = (document.getElementById('settings-business-address')?.value || '').trim();
        const businessPhone = (document.getElementById('settings-business-phone')?.value || '').trim();
        const businessEmail = (document.getElementById('settings-business-email')?.value || '').trim();
        if (!cafeName) {
            window.showAlert('Cafe name cannot be empty');
            input.focus();
            return;
        }
        if (businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
            window.showAlert('Valid business email enter karein');
            document.getElementById('settings-business-email')?.focus();
            return;
        }

        try {
            const updated = await ApiClient.updateSettings({
                cafe_name: cafeName,
                business_address: businessAddress,
                business_phone: businessPhone,
                business_email: businessEmail
            });
            const currentUser = await AuthManager.resolveCurrentUser();
            StorageManager.save('cafe_name', cafeName);
            StorageManager.save('business_address', businessAddress);
            StorageManager.save('business_phone', businessPhone);
            StorageManager.save('business_email', businessEmail);
            if (currentUser?.id) {
                const updatedProfile = await ApiClient.updateProfile(currentUser.id, {
                    business_name: cafeName,
                    owner_name: currentUser.owner_name || currentUser.username || cafeName,
                    mobile: businessPhone,
                    email: businessEmail,
                    address: businessAddress
                });
                const mergedUser = {
                    ...currentUser,
                    ...(updatedProfile || {}),
                    business_name: cafeName,
                    mobile: businessPhone,
                    email: businessEmail,
                    address: businessAddress,
                    name: cafeName
                };
                sessionStorage.setItem(AuthManager.storageKey('user'), JSON.stringify(mergedUser));
                sessionStorage.setItem(AuthManager.storageKey('username'), mergedUser.username || currentUser.username || '');
                AuthManager.updateSidebarUser(mergedUser);
            }
            SettingsManager.currentSettings = updated || await SettingsManager.loadBackendSettings(true);
            if (window.BrandingManager?.applyBranding) {
                window.BrandingManager.applyBranding();
            }

            window.showAlert('Business details updated');
        } catch (error) {
            window.showAlert(`Failed to save business details: ${error.message}`);
        }
    },

    showChangePasswordModal: () => {
        const content = `
            <div style="padding:10px;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem; line-height:1.4;">Enter your new password below. It will be updated instantly across all synced devices.</p>
                <form id="change-password-form" onsubmit="SettingsManager.handleChangePassword(event)">
                    <div class="input-group">
                        <label>Current Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-key"></i>
                            <input type="password" id="current-password" placeholder="Enter current password" required style="padding-left:3rem;">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>New Admin Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="new-password" placeholder="Enter new password" required style="padding-left:3rem;">
                        </div>
                    </div>
                     <div class="input-group">
                        <label>Confirm Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-check-double"></i>
                            <input type="password" id="confirm-password" placeholder="Confirm your password" required style="padding-left:3rem;">
                        </div>
                    </div>
                    <div style="margin-top:2rem;">
                        <button type="submit" class="btn-primary full-width" style="padding:14px; border-radius:14px; font-weight:700;">Update Admin Password</button>
                    </div>
                </form>
            </div>
        `;
        ModalManager.show('Change Security Credentials', content);
    },

    handleChangePassword: async (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const user = await AuthManager.resolveCurrentUser();

        if (!user?.username) {
            window.showAlert('Logged-in user not found');
            return;
        }

        if (newPass.length < 6) {
            window.showAlert('Password must be at least 6 characters');
            return;
        }

        if (newPass !== confirmPass) {
            window.showAlert('Passwords do not match!');
            return;
        }

        try {
            await ApiClient.changePassword(user.username, currentPass, newPass);
            window.showAlert('Password updated successfully');
            ModalManager.hide();
        } catch (error) {
            window.showAlert(error.message || 'Failed to update password');
        }
    },

    showCompanyLogoModal: () => {
        const content = `
            <div style="padding:10px; text-align:center;">
                <div style="width:120px; height:120px; background:var(--bg-main); border:2px dashed var(--border); border-radius:15px; margin:0 auto 1.5rem; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <i class="fas fa-image" style="font-size:3rem; color:var(--border);"></i>
                </div>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem; line-height:1.4;">Upload your company logo (PNG/JPG). This logo will appear on salary slips and reports.</p>
                
                <input type="file" id="company-logo-input" accept="image/*" style="display:none;" onchange="SettingsManager.handleLogoUpload(event)">
                <button class="btn-primary full-width" onclick="document.getElementById('company-logo-input').click()" style="padding:14px; border-radius:14px; font-weight:700;">
                    <i class="fas fa-upload"></i> Choose Logo File
                </button>
                <button class="btn-outline full-width" onclick="ModalManager.hide()" style="margin-top:10px; padding:12px; border-radius:14px;">Cancel</button>
            </div>
        `;
        ModalManager.show('Company Branding', content);
    },

    handleLogoUpload: async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        window.SyncStatus.show('Uploading logo...', 'saving');

        try {
            const currentUser = await AuthManager.resolveCurrentUser();
            if (!currentUser?.id) {
                throw new Error('Logged-in user not found');
            }

            const result = await ApiClient.uploadProfileImage(currentUser.id, file);
            const updatedUser = {
                ...currentUser,
                profile_image: window.PhotoHelper.normalizeImageUrl(result?.profile_image || currentUser.profile_image)
            };
            sessionStorage.setItem(AuthManager.storageKey('user'), JSON.stringify(updatedUser));
            StorageManager.save('business_logo', updatedUser.profile_image || '');
            AuthManager.updateSidebarUser(updatedUser);
            window.BrandingManager?.applyBranding?.();

            const logoEl = document.getElementById('settings-company-logo');
            if (logoEl) {
                logoEl.src = updatedUser.profile_image;
            }

            window.showAlert('Company Logo updated successfully!');
            ModalManager.hide();
            window.SyncStatus.show('Logo updated', 'success', 3000);
        } catch (error) {
            window.SyncStatus.show('Upload failed', 'error', 3000);
            window.showAlert('Failed to upload logo: ' + error.message);
        }
    },

    forceSync: async () => {
        window.SyncStatus.show('Refreshing system data...', 'saving');
        try {
            await ApiSyncManager.bootstrap(true);
            window.SyncStatus.show('System sync complete', 'success', 3000);
            window.showAlert('Data synchronized with cloud');
            SettingsManager.renderSettings(document.getElementById('view-container'));
        } catch (error) {
            window.SyncStatus.show('Sync failed', 'error', 3000);
            window.showAlert('Sync Error: ' + error.message);
        }
    },

    clearLocalCache: async () => {
        const confirmed = await ConfirmManager.ask('Are you sure? This will delete all local attendance/salary data and logout. You will need to login again to sync data.');
        if (confirmed) {
            StorageManager.clear();
            sessionStorage.clear();
            location.reload();
        }
    },

    // Employee Login Management Functions
    renderEmployeeLoginRows: () => {
        const users = StorageManager.get('employee_logins') || [];
        const staffList = StorageManager.get('staff') || [];
        if (users.length === 0) return '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No manual logins created yet.</td></tr>';

        return users.map(user => {
            const staff = staffList.find(s => s.id === user.staff_id);
            const staffName = staff ? staff.name : 'Manual User';

            return `
            <tr>
                <td style="font-weight:700;">${user.username}</td>
                <td style="font-family:monospace; cursor:pointer;" title="Click to view/hide" onclick="const s = this.querySelector('.pass-text'); const b = this.querySelector('.pass-dots'); if(s.style.display==='none'){s.style.display='inline'; b.style.display='none';}else{s.style.display='none'; b.style.display='inline';}">
                    <span class="pass-dots">••••••••</span>
                    <span class="pass-text" style="display:none;">${user.password}</span>
                </td>
                <td style="font-size:0.9rem; font-weight:700;">${staffName}</td>
                <td style="font-size:0.9rem;">${user.mobile || '---'}</td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">
                        ${['dashboard', 'staff', 'attendance', 'salary', 'reports', 'settings'].map(menu => `
                            <button class="badge ${user.permissions.includes(menu) ? 'badge-success' : 'badge-danger'}" 
                                    style="border:none; cursor:pointer; font-size:0.65rem; padding:4px 8px;" 
                                    onclick="SettingsManager.toggleEmployeePermission('${user.username}', '${menu}')">
                                ${menu.toUpperCase()}
                            </button>
                        `).join('')}
                    </div>
                </td>
                <td>
                    <button class="badge ${user.disabled ? 'badge-danger' : 'badge-success'}" 
                            style="border:none; cursor:pointer; font-size:0.65rem; padding:4px 8px; min-width:60px;"
                            onclick="SettingsManager.toggleLoginStatus('${user.username}')">
                        ${user.disabled ? 'OFF' : 'ON'}
                    </button>
                </td>
                <td>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-icon text-primary" onclick="SettingsManager.editEmployeeLogin('${user.username}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="SettingsManager.deleteEmployeeLogin('${user.username}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join('');
    },

    showAddEmployeeLoginModal: () => {
        const staffList = StorageManager.get('staff') || [];
        const content = `
            <form id="add-employee-login-form" onsubmit="SettingsManager.handleAddEmployeeLogin(event)">
                <div class="input-group" style="margin-bottom:1.5rem;">
                    <label>Link to Existing Staff (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-users-cog"></i>
                        <select id="link-staff-select" onchange="SettingsManager.handleStaffSelect(this.value)">
                            <option value="">-- Create Independent Login --</option>
                            ${staffList.map(s => `<option value="${s.id}">${s.name} (${s.mobile || 'No Mobile'})</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                    <div class="input-group">
                        <label>Login Username</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user-tag"></i>
                            <input type="text" id="emp-username" placeholder="e.g. rahul_manager" required>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Assign Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-key"></i>
                            <input type="text" id="emp-password" placeholder="Create a password" required>
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:1.5rem;">
                    <div class="input-group">
                        <label>Date of Birth</label>
                        <div class="input-wrapper">
                            <i class="fas fa-birthday-cake"></i>
                            <input type="text" id="emp-dob" placeholder="00-00-0000" maxlength="10" required style="padding-left:2.8rem;" oninput="SettingsManager.handleDobInput(this)">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Mobile Number</label>
                        <div class="input-wrapper">
                            <i class="fas fa-phone-alt"></i>
                            <input type="tel" id="emp-mobile" pattern="[0-9]{10}" placeholder="10 Digit Number" required oninput="document.getElementById('emp-password').value = this.value">
                        </div>
                    </div>
                </div>

                <div style="margin-top:2rem; padding:1.5rem; background:var(--bg-main); border-radius:12px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <p style="font-size:0.8rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin:0; letter-spacing:0.5px;">INITIAL PERMISSIONS</p>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem; font-weight:700; color:var(--primary);">
                            <input type="checkbox" id="perm-all" onchange="SettingsManager.toggleAllPermissions(this.checked)"> <i class="fas fa-check-double" style="font-size:0.8rem;"></i> All Select
                        </label>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" checked disabled> Dashboard (Required)
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-staff" class="perm-checkbox"> Staff List
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-attendance" class="perm-checkbox" checked> Attendance
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-salary" class="perm-checkbox"> Salary
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-reports" class="perm-checkbox"> Reports
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-settings" class="perm-checkbox"> Settings
                        </label>
                    </div>
                </div>
                <button type="submit" class="btn-primary full-width" style="margin-top:2rem; padding:14px; border-radius:14px; font-weight:700; font-size:1rem;">
                    <i class="fas fa-user-plus"></i> Create Access
                </button>
            </form>
        `;
        ModalManager.show('Create Employee Account', content);

        setTimeout(() => {
            setupCustomDropdown('link-staff-select');
        }, 50);
    },

    handleDobInput: (el) => {
        let v = el.value.replace(/\D/g, '');
        if (v.length > 8) v = v.substring(0, 8);
        let formatted = v;
        if (v.length > 4) {
            formatted = v.substring(0, 2) + '-' + v.substring(2, 4) + '-' + v.substring(4);
        } else if (v.length > 2) {
            formatted = v.substring(0, 2) + '-' + v.substring(2);
        }
        el.value = formatted;
        document.getElementById('emp-username').value = formatted;
    },

    handleStaffSelect: (staffId) => {
        if (!staffId) return;
        const staff = (StorageManager.get('staff') || []).find(s => s.id === staffId);
        if (!staff) return;

        const usernameInput = document.getElementById('emp-username');
        const passwordInput = document.getElementById('emp-password');
        const dobInput = document.getElementById('emp-dob');
        const mobileInput = document.getElementById('emp-mobile');

        let dobValue = '00-00-0000';
        if (staff.dob) {
            const parts = staff.dob.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    dobValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                    dobValue = staff.dob;
                }
            }
        }

        if (dobInput) dobInput.value = dobValue;
        if (mobileInput) mobileInput.value = staff.mobile || '';

        // Auto-fill Username with DOB and Password with Mobile
        if (usernameInput) usernameInput.value = dobValue;
        if (passwordInput) passwordInput.value = mobileInput.value || '';
    },

    toggleAllPermissions: (checked) => {
        document.querySelectorAll('.perm-checkbox').forEach(cb => {
            cb.checked = checked;
        });
    },

    handleAddEmployeeLogin: (e) => {
        e.preventDefault();
        const username = document.getElementById('emp-username').value;
        const password = document.getElementById('emp-password').value;
        const dob = document.getElementById('emp-dob').value;
        const mobile = document.getElementById('emp-mobile').value;
        const staffId = document.getElementById('link-staff-select').value;
        const isEdit = document.getElementById('add-employee-login-form').hasAttribute('data-edit');
        const perms = ['dashboard'];
        if (document.getElementById('perm-staff').checked) perms.push('staff');
        if (document.getElementById('perm-attendance').checked) perms.push('attendance');
        if (document.getElementById('perm-salary').checked) perms.push('salary');
        if (document.getElementById('perm-reports').checked) perms.push('reports');
        if (document.getElementById('perm-settings').checked) perms.push('settings');

        let users = StorageManager.get('employee_logins') || [];

        if (isEdit) {
            const index = users.findIndex(u => u.username === username);
            if (index !== -1) {
                users[index] = { ...users[index], password, dob, mobile, staff_id: staffId, permissions: perms };
            }
        } else {
            if (users.find(u => u.username === username)) {
                window.showAlert('Username already exists!');
                return;
            }
            users.push({ username, password, dob, mobile, staff_id: staffId, permissions: perms, role: 'Staff', disabled: false });
        }

        try {
            StorageManager.save('employee_logins', users);
            ModalManager.hide();
            SettingsManager.switchTab('access');
            window.showAlert(isEdit ? 'Login access updated!' : 'Manual employee login created!');
        } catch (error) {
            console.error(error);
            window.showAlert('Failed to save login: ' + error.message);
        }
    },

    editEmployeeLogin: (username) => {
        const user = (StorageManager.get('employee_logins') || []).find(u => u.username === username);
        if (!user) return;

        SettingsManager.showAddEmployeeLoginModal();

        const modalTitle = document.querySelector('#modal-container h2');
        if (modalTitle) modalTitle.textContent = 'Edit Employee Account';

        const form = document.getElementById('add-employee-login-form');
        form.setAttribute('data-edit', 'true');

        document.getElementById('emp-username').value = user.username;
        document.getElementById('emp-username').readOnly = true;
        document.getElementById('emp-password').value = user.password;
        document.getElementById('emp-dob').value = user.dob || '';
        document.getElementById('emp-mobile').value = user.mobile || '';
        document.getElementById('link-staff-select').value = user.staff_id || '';

        // Permissions
        document.getElementById('perm-staff').checked = user.permissions.includes('staff');
        document.getElementById('perm-attendance').checked = user.permissions.includes('attendance');
        document.getElementById('perm-salary').checked = user.permissions.includes('salary');
        document.getElementById('perm-reports').checked = user.permissions.includes('reports');
        document.getElementById('perm-settings').checked = user.permissions.includes('settings');

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Access';
        }
    },

    toggleLoginStatus: (username) => {
        let users = StorageManager.get('employee_logins') || [];
        const index = users.findIndex(u => u.username === username);
        if (index !== -1) {
            users[index].disabled = !users[index].disabled;
            StorageManager.save('employee_logins', users);
            SettingsManager.switchTab('access');
            window.showAlert(`Login ${users[index].disabled ? 'Disabled' : 'Enabled'} for ${username}`);
        }
    },

    toggleEmployeePermission: (username, permission) => {
        let users = StorageManager.get('employee_logins') || [];
        const user = users.find(u => u.username === username);
        if (!user) return;

        if (user.permissions.includes(permission)) {
            user.permissions = user.permissions.filter(p => p !== permission);
        } else {
            user.permissions.push(permission);
        }

        StorageManager.save('employee_logins', users);
        SettingsManager.switchTab('access');
    },

    deleteEmployeeLogin: async (username) => {
        const ok = await ConfirmManager.ask(`Delete login access for "${username}"?`);
        if (ok) {
            let users = StorageManager.get('employee_logins') || [];
            users = users.filter(u => u.username !== username);
            StorageManager.save('employee_logins', users);
            SettingsManager.switchTab('access');
        }
    },

    showSalaryCycleModal: () => {
        const currentType = SettingsManager.getSettingValue('salary_cycle_type') || 'Monthly';
        const currentDay = Number(SettingsManager.getSettingValue('salary_cycle') || 1);
        const currentWeekday = Number(SettingsManager.getSettingValue('salary_cycle_weekday') || 1);
        const options = Array.from({ length: 28 }, (_, i) => i + 1);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        const content = `
            <div style="padding:10px;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Select the salary calculation cycle type and reset day.</p>
                
                <div class="input-group">
                    <label>Cycle Type</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sync"></i>
                        <select id="new-salary-cycle-type" onchange="SettingsManager.toggleCycleDayVisibility(this.value)" style="padding-left:3rem; width:100%;">
                            <option value="Daily" ${currentType === 'Daily' ? 'selected' : ''}>Daily</option>
                            <option value="Weekly" ${currentType === 'Weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="Monthly" ${currentType === 'Monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </div>
                </div>

                <div id="cycle-day-group" class="input-group" style="display: ${currentType === 'Monthly' ? 'block' : 'none'};">
                    <label>Reset Day (of Month)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-day"></i>
                        <select id="new-salary-cycle" style="padding-left:3rem; width:100%;">
                            ${options.map(d => `<option value="${d}" ${d == currentDay ? 'selected' : ''}>${d}${d == 1 ? 'st' : d == 2 ? 'nd' : d == 3 ? 'rd' : 'th'} Day</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div id="cycle-weekday-group" class="input-group" style="display: ${currentType === 'Weekly' ? 'block' : 'none'};">
                    <label>Reset Weekday</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-week"></i>
                        <select id="new-salary-cycle-weekday" style="padding-left:3rem; width:100%;">
                            ${days.map((d, i) => `<option value="${i}" ${i == currentWeekday ? 'selected' : ''}>${d}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button class="btn-primary full-width" onclick="SettingsManager.updateSalaryCycle()" style="margin-top:1rem;">Save Cycle Settings</button>
            </div>
        `;
        ModalManager.show('Update Salary Cycle', content);
        if (window.setupCustomDropdown) {
            setupCustomDropdown('new-salary-cycle-type');
            setupCustomDropdown('new-salary-cycle');
            setupCustomDropdown('new-salary-cycle-weekday');
        }
    },

    toggleCycleDayVisibility: (type) => {
        const dayGroup = document.getElementById('cycle-day-group');
        const weekdayGroup = document.getElementById('cycle-weekday-group');

        if (dayGroup) dayGroup.style.display = type === 'Monthly' ? 'block' : 'none';
        if (weekdayGroup) weekdayGroup.style.display = type === 'Weekly' ? 'block' : 'none';
    },

    updateSalaryCycle: async () => {
        const type = document.getElementById('new-salary-cycle-type').value;
        const day = document.getElementById('new-salary-cycle').value;
        const weekday = document.getElementById('new-salary-cycle-weekday').value;

        try {
            const updated = await ApiClient.updateSettings({
                salary_cycle_type: type,
                salary_cycle: String(parseInt(day, 10)),
                salary_cycle_weekday: String(parseInt(weekday, 10))
            });
            SettingsManager.currentSettings = updated || await SettingsManager.loadBackendSettings(true);
            ModalManager.hide();
            SettingsManager.switchTab('defaults');
            window.showAlert(`Salary cycle updated to ${type}!`);
        } catch (error) {
            window.showAlert(`Failed to save salary cycle: ${error.message}`);
        }
    },

    showWeeklyHolidayModal: () => {
        const current = Number(SettingsManager.getSettingValue('weekly_holiday') || 0);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const content = `
            <div style="padding:10px;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Select the fixed weekly holiday for your business.</p>
                <div class="input-group">
                    <label>Holiday Day</label>
                    <div class="input-wrapper">
                        <i class="fas fa-mug-hot"></i>
                        <select id="new-weekly-holiday" style="padding-left:3rem; width:100%;">
                            ${days.map((d, i) => `<option value="${i}" ${i == current ? 'selected' : ''}>${d}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button class="btn-primary full-width" onclick="SettingsManager.updateWeeklyHoliday()" style="margin-top:1rem;">Save Holiday</button>
            </div>
        `;
        ModalManager.show('Update Weekly Holiday', content);
        if (window.setupCustomDropdown) setupCustomDropdown('new-weekly-holiday');
    },

    updateWeeklyHoliday: async () => {
        const val = document.getElementById('new-weekly-holiday').value;
        try {
            const updated = await ApiClient.updateSettings({ weekly_holiday: String(parseInt(val, 10)) });
            SettingsManager.currentSettings = updated || await SettingsManager.loadBackendSettings(true);
            ModalManager.hide();
            SettingsManager.switchTab('defaults');
            window.showAlert('Weekly holiday updated!');
        } catch (error) {
            window.showAlert(`Failed to save weekly holiday: ${error.message}`);
        }
    },

    updateSystemColor: async (key, value) => {
        try {
            const updated = await ApiClient.updateSettings({ [key]: value });
            SettingsManager.currentSettings = updated || await SettingsManager.loadBackendSettings(true);
            SettingsManager.switchTab('defaults');
            window.showAlert('Color setting updated!');
        } catch (error) {
            window.showAlert(`Failed to save color setting: ${error.message}`);
        }
    }
};
