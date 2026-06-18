document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

window.BrandingManager = {
    getStoredUser: () => {
        try {
            return JSON.parse(sessionStorage.getItem('employee_management_admin_user') || 'null');
        } catch (error) {
            return null;
        }
    },
    getCafeName: () => {
        const user = BrandingManager.getStoredUser();
        return StorageManager.get('cafe_name') || user?.business_name || user?.name || user?.username || 'Cafe Admin';
    },
    getBusinessLogo: () => {
        const user = BrandingManager.getStoredUser();
        const storedLogo = StorageManager.get('business_logo') || '';
        const fallbackLogo = /^(data:|blob:)/i.test(String(storedLogo)) ? storedLogo : '';
        return window.PhotoHelper?.normalizeImageUrl?.(user?.profile_image || fallbackLogo) || '';
    },
    getBusinessAddress: () => StorageManager.get('business_address') || 'Near Clock Tower, Main Market, City',
    getBusinessPhone: () => StorageManager.get('business_phone') || '+91 98765 43210',
    getBusinessEmail: () => StorageManager.get('business_email') || 'info@cafepremium.com',

    applyBranding: () => {
        const cafeName = BrandingManager.getCafeName();

        document.title = `${cafeName} Attendance & Salary Management`;

        document.querySelectorAll('.brand-info h2').forEach((el) => {
            el.textContent = cafeName;
        });

        const logo = BrandingManager.getBusinessLogo();
        if (logo) {
            document.querySelectorAll('.sidebar-logo').forEach((el) => {
                if (el.tagName.toLowerCase() === 'img') {
                    el.onerror = function () {
                        window.PhotoHelper?.applyFallback?.(this, encodeURIComponent(cafeName), '007965', 'fff', 52);
                    };
                    el.src = logo;
                    el.alt = `${cafeName} logo`;
                    return;
                }

                const img = document.createElement('img');
                img.className = el.className;
                img.alt = `${cafeName} logo`;
                img.onerror = function () {
                    window.PhotoHelper?.applyFallback?.(this, encodeURIComponent(cafeName), '007965', 'fff', 52);
                };
                img.src = logo;
                el.replaceWith(img);
            });
        }
    }
};

window.HeaderManager = {
    getSearchHost: () => document.querySelector('.header-search'),
    getSearchField: () => document.getElementById('header-search-field'),
    getProfileField: () => document.getElementById('header-profile-select-wrap'),
    getSearchInput: () => document.getElementById('global-search'),
    getProfileSelect: () => document.getElementById('profile-staff-selector-header'),

    renderDefaultSearch: (value = '') => {
        const host = HeaderManager.getSearchHost();
        const searchField = HeaderManager.getSearchField();
        const profileField = HeaderManager.getProfileField();
        const searchInput = HeaderManager.getSearchInput();
        if (!host || !searchField || !profileField || !searchInput) return;

        host.classList.remove('header-search-select-mode');
        searchField.classList.remove('hidden');
        profileField.classList.add('hidden');
        searchInput.value = value || '';
    },

    renderProfileSelector: (selectedStaffId) => {
        const host = HeaderManager.getSearchHost();
        const searchField = HeaderManager.getSearchField();
        const profileField = HeaderManager.getProfileField();
        const profileSelect = HeaderManager.getProfileSelect();
        if (!host || !searchField || !profileField || !profileSelect || typeof StaffManager === 'undefined' || typeof StaffManager.buildProfileStaffSelectorOptions !== 'function') return;

        host.classList.add('header-search-select-mode');
        searchField.classList.add('hidden');
        profileField.classList.remove('hidden');
        profileSelect.dataset.searchable = 'true';
        profileSelect.innerHTML = StaffManager.buildProfileStaffSelectorOptions(selectedStaffId);
        profileSelect.value = String(selectedStaffId);
        window.setupCustomDropdown?.('profile-staff-selector-header');
    },

    sync: (viewId, data = null) => {
        if (viewId === 'staff-profile' && data) {
            HeaderManager.renderProfileSelector(data);
            return;
        }

        const currentValue = window.currentView === 'staff'
            ? (document.getElementById('global-search')?.value || '')
            : '';
        HeaderManager.renderDefaultSearch(currentValue);
    },

    startClock: () => {
        const dateEl = document.getElementById('current-date-label');
        const timeEl = document.getElementById('current-time-label');
        if (!dateEl || !timeEl) return;

        const update = () => {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            timeEl.textContent = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        };

        update();
        window.clearInterval(HeaderManager._clockTimer);
        HeaderManager._clockTimer = window.setInterval(update, 1000);
    }
};

window.LayoutManager = {
    ensureMobileChrome: () => {
        const appContainer = document.getElementById('app-container');
        const header = document.querySelector('.app-header');

        if (!appContainer || !header) return;

        document.getElementById('mobile-nav-toggle')?.remove();

        if (!document.getElementById('mobile-pwa-nav')) {
            const footerNav = document.createElement('nav');
            footerNav.id = 'mobile-pwa-nav';
            footerNav.className = 'mobile-pwa-nav';
            footerNav.setAttribute('aria-label', 'Mobile app navigation');
            footerNav.innerHTML = `
                <a href="index.html?view=dashboard" class="mobile-pwa-item" data-view="dashboard">
                    <i class="fas fa-th-large"></i><span>Dashboard</span>
                </a>
                <a href="staff.html" class="mobile-pwa-item" data-view="staff">
                    <i class="fas fa-users-cog"></i><span>Staff</span>
                </a>
                <a href="attendance.html" class="mobile-pwa-item" data-view="attendance">
                    <i class="fas fa-calendar-alt"></i><span>Attendance</span>
                </a>
                <a href="salary.html" class="mobile-pwa-item" data-view="salary">
                    <i class="fas fa-money-check-alt"></i><span>Salary</span>
                </a>
                <button type="button" class="mobile-pwa-item" id="mobile-more-btn" aria-label="More menu">
                    <i class="fas fa-bars"></i><span>Menu</span>
                </button>
            `;
            document.body.appendChild(footerNav);
        }

        if (!document.getElementById('mobile-more-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'mobile-more-backdrop';
            backdrop.className = 'mobile-more-backdrop';
            backdrop.addEventListener('click', () => LayoutManager.closeMoreMenu());
            document.body.appendChild(backdrop);
        }

        if (!document.getElementById('mobile-more-sheet')) {
            const isFromSuperadmin = sessionStorage.getItem('employee_management_admin_from_superadmin') === 'true';
            const sheet = document.createElement('div');
            sheet.id = 'mobile-more-sheet';
            sheet.className = 'mobile-more-sheet';
            sheet.setAttribute('role', 'dialog');
            sheet.setAttribute('aria-modal', 'true');
            sheet.setAttribute('aria-label', 'More menu');
            sheet.innerHTML = `
                <div class="mobile-more-handle"></div>
                <div class="mobile-more-title">More</div>
                <a href="reports.html" class="mobile-more-item" data-view="reports">
                    <i class="fas fa-chart-bar"></i><span>Reports</span>
                </a>
                <a href="settings.html" class="mobile-more-item" data-view="settings">
                    <i class="fas fa-cog"></i><span>Settings</span>
                </a>
                ${isFromSuperadmin ? `
                    <button type="button" class="mobile-more-item" id="mobile-back-superadmin-btn">
                        <i class="fas fa-arrow-left"></i><span>Back to Superadmin</span>
                    </button>
                ` : ''}
                <button type="button" class="mobile-more-item danger" id="mobile-logout-btn">
                    <i class="fas fa-sign-out-alt"></i><span>Logout</span>
                </button>
            `;
            document.body.appendChild(sheet);
        }

        document.getElementById('mobile-more-btn')?.addEventListener('click', () => LayoutManager.openMoreMenu());
        document.getElementById('mobile-logout-btn')?.addEventListener('click', () => AuthManager.logout());
        document.getElementById('mobile-back-superadmin-btn')?.addEventListener('click', () => AuthManager.backToSuperadmin?.());
        document.querySelectorAll('.mobile-more-item[href]').forEach((item) => {
            item.addEventListener('click', () => LayoutManager.closeMoreMenu());
        });

        LayoutManager.updateMobileNavActive();
    },

    closeSidebar: () => {
        document.body.classList.remove('sidebar-open');
        document.getElementById('mobile-sidebar-backdrop')?.classList.remove('active');
        const toggle = document.getElementById('mobile-nav-toggle');
        if (toggle) {
            toggle.setAttribute('aria-label', 'Open navigation');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
        LayoutManager.closeMoreMenu();
    },

    openMoreMenu: () => {
        document.body.classList.add('mobile-more-open');
    },

    closeMoreMenu: () => {
        document.body.classList.remove('mobile-more-open');
    },

    updateMobileNavActive: () => {
        const page = AppNavigation?.getCurrentView?.() || 'attendance';

        document.querySelectorAll('.mobile-pwa-item[data-view], .mobile-more-item[data-view]').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-view') === page);
        });
        document.getElementById('mobile-more-btn')?.classList.toggle('active', ['reports', 'settings'].includes(page));
    }
};

window.AppNavigation = {
    viewToFile: {
        dashboard: 'index.html',
        staff: 'staff.html',
        attendance: 'attendance.html',
        salary: 'salary.html',
        reports: 'reports.html',
        settings: 'settings.html'
    },

    scriptVersions: {
        staff: '20260618-1',
        attendance: '20260615-1',
        salary: '20260615-1',
        reports: '20260615-1',
        settings: '20260601-2'
    },

    loadedScripts: (() => {
        const set = new Set(Array.from(document.scripts)
            .map((script) => script.getAttribute('src') || '')
            .filter(Boolean)
            .map((src) => src.split('?')[0].split('/').pop()));
        if (set.has('api.js')) {
            set.add('salary.js');
        }
        return set;
    })(),

    loadScript: (filename) => {
        if (AppNavigation.loadedScripts.has(filename)) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `js/min/${filename}?v=${AppNavigation.scriptVersions[filename.replace('.js', '')] || Date.now()}`;
            script.defer = true;
            script.onload = () => {
                AppNavigation.loadedScripts.add(filename);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${filename}`));
            document.body.appendChild(script);
        });
    },

    ensureViewBundle: async (viewId) => {
        const bundles = {
            dashboard: ['reports.js'],
            staff: ['salary.js', 'reports.js', 'attendance.js', 'staff.js'],
            'staff-profile': ['salary.js', 'reports.js', 'attendance.js', 'staff.js'],
            attendance: ['attendance.js'],
            salary: ['staff.js', 'salary.js'],
            reports: ['salary.js', 'reports.js'],
            settings: ['settings.js']
        };

        await Promise.all(
            (bundles[viewId] || []).map((filename) => AppNavigation.loadScript(filename))
        );
    },

    getCurrentView: () => {
        const requestedView = new URLSearchParams(window.location.search).get('view');
        if (requestedView && AppNavigation.viewToFile[requestedView]) return requestedView;

        const file = window.location.pathname.split('/').pop() || 'index.html';
        if (file === 'index.html') return 'attendance';

        const view = Object.entries(AppNavigation.viewToFile)
            .find(([, filename]) => filename === file)?.[0];
        return view || 'attendance';
    },

    urlForView: (viewId) => {
        if (viewId === 'dashboard') return 'index.html?view=dashboard';

        const filename = AppNavigation.viewToFile[viewId] || 'index.html';
        return filename;
    },

    bindLinks: () => {
        document.querySelectorAll('a[data-view]').forEach((link) => {
            if (link.dataset.spaBound === 'true') return;
            link.dataset.spaBound = 'true';
            link.addEventListener('click', (event) => {
                const viewId = link.getAttribute('data-view');
                if (!AppNavigation.viewToFile[viewId] || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

                event.preventDefault();
                AppNavigation.go(viewId);
            });
        });
    },

    go: async (viewId, data = null, options = {}) => {
        if (!AppNavigation.viewToFile[viewId]) return switchView(viewId, data);

        await AppNavigation.ensureViewBundle(viewId);
        await switchView(viewId, data);
        const nextUrl = AppNavigation.urlForView(viewId);
        if (options.replace) {
            window.history.replaceState({ viewId }, '', nextUrl);
        } else if (window.location.pathname.split('/').pop() !== AppNavigation.viewToFile[viewId]) {
            window.history.pushState({ viewId }, '', nextUrl);
        }
        AppNavigation.syncActive(viewId);
        LayoutManager.closeSidebar();
    },

    syncActive: (viewId) => {
        document.querySelectorAll('[data-view]').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-view') === viewId);
        });
        LayoutManager.updateMobileNavActive?.();
    }
};

function initApp() {
    let staffSearchTimer = null;

    BrandingManager.applyBranding();
    HeaderManager.startClock();

    const page = AppNavigation.getCurrentView();
    AppNavigation.syncActive(page);
    AppNavigation.bindLinks();

    // Global Search/Profile Selector Handler
    document.addEventListener('input', (e) => {
        if (e.target?.id !== 'global-search') return;

        const query = e.target.value;
        const container = document.getElementById('view-container');
        if (window.currentView === 'staff') {
            window.clearTimeout(staffSearchTimer);
            staffSearchTimer = window.setTimeout(() => {
                StaffManager.renderStaffList(container, query);
            }, 150);
        } else if (window.currentView === 'salary') {
            window.clearTimeout(staffSearchTimer);
            staffSearchTimer = window.setTimeout(() => {
                SalaryManager.refreshSalaryList({ skipSync: true });
            }, 150);
        }
    });

    document.addEventListener('change', (e) => {
        if (e.target?.id !== 'profile-staff-selector-header') return;
        StaffManager.handleProfileStaffChange(e.target.value);
    });

    // Theme Switcher Buttons
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            ThemeManager.setTheme(theme);

            // Update active state
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Set initial active theme button
    const currentTheme = StorageManager.get('theme') || 'theme-cafe';
    const activeBtn = document.querySelector(`.theme-btn[data-theme="${currentTheme}"]`);
    if (activeBtn) {
        themeBtns.forEach(b => b.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    // Modal Close
    const closeBtn = document.querySelector('.close-modal');
    const modalOverlay = document.getElementById('modal-container');
    if (closeBtn && modalOverlay) {
        closeBtn.addEventListener('click', () => {
            ModalManager.hide();
        });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) ModalManager.hide();
        });
    }

    AppNavigation.bindLinks();

    window.addEventListener('popstate', () => {
        AppNavigation.go(AppNavigation.getCurrentView(), null, { replace: true });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
            LayoutManager.closeSidebar();
        }
    });

    // Check Auth Status
    AuthManager.checkStatus();
}

async function switchView(viewId, data = null) {
    await AppNavigation.ensureViewBundle(viewId);

    if (window.currentView === 'attendance' && viewId !== 'attendance' && window.AttendanceManager?.flushPendingSave) {
        await window.AttendanceManager.flushPendingSave();
    }

    window.currentView = viewId;
    HeaderManager.sync(viewId, data);
    AppNavigation.syncActive(viewId);

    // Check Permissions for Employee accounts
    const currentUser = AuthManager.getStoredUser();
    if (currentUser?.role === 'Staff' && currentUser?.permissions) {
        if (!currentUser.permissions.includes(viewId)) {
            window.showAlert(`Access Denied: You don't have permission for ${viewId.toUpperCase()}`);
            // Fallback to first available permission or logout
            const fallback = currentUser.permissions[0] || 'dashboard';
            if (viewId !== fallback) return switchView(fallback);
            return;
        }
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        const itemHover = item.getAttribute('data-view');

        // Hide sidebar items if no permission
        if (currentUser?.role === 'Staff' && currentUser?.permissions && itemHover) {
            item.style.display = currentUser.permissions.includes(itemHover) ? 'flex' : 'none';
        } else {
            item.style.display = 'flex';
        }

        item.classList.remove('active');
        if (itemHover === viewId) {
            item.classList.add('active');
        }
    });

    // Load view content
    const container = document.getElementById('view-container');
    if (!container) return;

    // Clear current content
    container.innerHTML = '<div class="loader-container"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    // Load view content immediately (Removed artificial 300ms delay)
    const render = () => {
        switch (viewId) {
            case 'dashboard':
                ReportsManager.renderDashboard(container);
                break;
            case 'staff':
                StaffManager.renderStaffList(container);
                break;
            case 'staff-profile':
                StaffManager.renderProfilePage(container, data).catch((error) => {
                    console.error('Failed to render staff profile', error);
                    container.innerHTML = '<h2>Staff profile could not be loaded</h2>';
                });
                break;
            case 'attendance':
                AttendanceManager.renderAttendance(container);
                break;
            case 'salary':
                SalaryManager.renderSalary(container);
                break;
            case 'reports':
                ReportsManager.renderReports(container);
                break;
            case 'settings':
                SettingsManager.renderSettings(container);
                break;
            default:
                container.innerHTML = '<h2>View not found</h2>';
        }
    };

    // Fast-path for instant rendering
    render();
}

// Global Modal Manager
window.ModalManager = {
    show: (title, contentHTML) => {
        const modal = document.getElementById('modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalCard = modal?.querySelector('.modal-card');
        const modalHeader = modal?.querySelector('.modal-header');

        // Cleanup any orphan dropdown portals before showing new content
        modal.querySelectorAll('.select-options-portal').forEach(el => el.remove());
        if (modalCard) {
            modalCard.classList.remove('salary-slip-modal-card');
            modalCard.style.maxHeight = '';
            modalCard.style.padding = '';
        }
        if (modalHeader) {
            modalHeader.style.marginBottom = '';
            modalHeader.style.paddingBottom = '';
        }
        if (modalBody) {
            modalBody.classList.remove('salary-slip-modal-body');
            modalBody.style.overflowY = '';
            modalBody.style.paddingRight = '';
        }
        modal.classList.remove('salary-slip-modal');

        modalTitle.textContent = title;
        modalBody.innerHTML = contentHTML;
        modal.classList.remove('hidden');
    },
    hide: () => {
        const modal = document.getElementById('modal-container');
        // Cleanup portals on hide too
        modal.querySelectorAll('.select-options-portal').forEach(el => el.remove());
        modal.classList.remove('salary-slip-modal');
        modal.querySelector('.modal-card')?.classList.remove('salary-slip-modal-card');
        modal.querySelector('.modal-body')?.classList.remove('salary-slip-modal-body');
        modal.classList.add('hidden');
    }
};

window.ConfirmManager = {
    ask: (message) => {
        return new Promise((resolve) => {
            const content = `
                <div style="text-align:center; padding:0.5rem 0;">
                    <div style="width:60px; height:60px; background:rgba(214, 48, 49, 0.1); color:var(--danger); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; font-size:1.5rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <p style="font-size:1.05rem; font-weight:700; color:var(--text-main); line-height:1.5; margin-bottom:2rem; padding:0 10px;">${message}</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <button class="btn-outline" id="confirm-cancel" style="padding:12px; border-radius:12px; font-weight:700;">Cancel</button>
                        <button class="btn-primary" id="confirm-ok" style="padding:12px; border-radius:12px; background:var(--primary); font-weight:700;">Confirm</button>
                    </div>
                </div>
            `;
            ModalManager.show('Are you sure?', content);

            document.getElementById('confirm-ok').onclick = () => {
                ModalManager.hide();
                resolve(true);
            };
            document.getElementById('confirm-cancel').onclick = () => {
                ModalManager.hide();
                resolve(false);
            };
        });
    }
};

window.AlertManager = {
    show: (message, title = 'Notification') => {
        const content = `
            <div style="text-align:center; padding:0.5rem 0;">
                <div style="width:60px; height:60px; background:rgba(62, 39, 35, 0.1); color:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; font-size:1.5rem;">
                    <i class="fas fa-info-circle"></i>
                </div>
                <p style="font-size:1.05rem; font-weight:700; color:var(--text-main); line-height:1.5; margin-bottom:1.5rem;">${message}</p>
                <button class="btn-primary full-width" onclick="ModalManager.hide()" style="padding:12px; border-radius:12px; font-weight:700;">OK</button>
            </div>
        `;
        ModalManager.show(title, content);
    }
};

// Custom Dropdown Helper
window.setupCustomDropdown = (selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;
    const isSearchable = select.dataset.searchable === 'true';
    let container = select.parentElement?.classList.contains('custom-select') ? select.parentElement : null;
    let trigger;
    let optionsList;
    let searchInput = null;

    if (!container) {
        // Hide original select
        select.style.display = 'none';

        // Create custom elements
        container = document.createElement('div');
        container.className = 'custom-select';
        container.dataset.selectId = selectId;
        if (select.classList.contains('full-width')) {
            container.classList.add('full-width');
        }
        if (select.style.width) {
            container.style.width = select.style.width;
            container.style.flex = '0 0 auto';
        }

        select.parentNode.insertBefore(container, select);
        container.appendChild(select);

        trigger = document.createElement('div');
        trigger.className = 'select-trigger';
        trigger.textContent = select.options[select.selectedIndex]?.text || '';
        container.appendChild(trigger);

        const portalRoot = select.closest('#modal-container') || document.body;
        const usePortalOverlay = portalRoot !== document.body;

        // Cleanup any existing orphan options lists for this portal
        if (usePortalOverlay) {
            portalRoot.querySelectorAll(`.select-options-portal[data-for="${selectId}"]`).forEach(el => el.remove());
        }

        optionsList = document.createElement('div');
        optionsList.className = 'select-options select-options-floating';
        optionsList.dataset.for = selectId;
        if (usePortalOverlay) {
            optionsList.classList.add('select-options-portal');
        }
        portalRoot.appendChild(optionsList);

        const syncSelectedState = () => {
            const selectedOption = Array.from(select.options).find((option) => option.value === select.value);
            if (selectedOption) {
                trigger.textContent = selectedOption.text;
            }

            optionsList.querySelectorAll('.select-option').forEach((optionEl) => {
                optionEl.classList.toggle('selected', optionEl.dataset.value === select.value);
            });
        };

        const buildOptions = (filterValue = '') => {
            const normalizedFilter = String(filterValue || '').trim().toLowerCase();
            optionsList.innerHTML = '';

            if (isSearchable) {
                const searchWrap = document.createElement('div');
                searchWrap.className = 'select-search';
                searchWrap.innerHTML = `
                    <i class="fas fa-search"></i>
                    <input type="text" class="select-search-input" placeholder="Search staff...">
                `;
                searchInput = searchWrap.querySelector('.select-search-input');
                searchInput.value = filterValue;
                searchInput.addEventListener('click', (e) => e.stopPropagation());
                searchInput.addEventListener('input', (e) => {
                    buildOptions(e.target.value);
                    window.requestAnimationFrame(() => {
                        searchInput?.focus();
                        if (searchInput) {
                            const cursorAt = searchInput.value.length;
                            searchInput.setSelectionRange(cursorAt, cursorAt);
                        }
                    });
                });
                optionsList.appendChild(searchWrap);
            }

            const matchingOptions = Array.from(select.options).filter((option) =>
                !normalizedFilter || option.text.toLowerCase().includes(normalizedFilter)
            );

            if (matchingOptions.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'select-option-empty';
                empty.textContent = 'No staff found';
                optionsList.appendChild(empty);
                return;
            }

            matchingOptions.forEach((option) => {
                const opt = document.createElement('div');
                opt.className = 'select-option';
                opt.textContent = option.text;
                opt.dataset.value = option.value;
                if (option.selected) opt.classList.add('selected');

                opt.addEventListener('click', () => {
                    select.value = opt.dataset.value;
                    trigger.textContent = opt.textContent;

                    optionsList.querySelectorAll('.select-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');

                    closeDropdown();

                    // Trigger change event on original select
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                });

                optionsList.appendChild(opt);
            });
        };

        let repositionTimer = null;

        const positionDropdown = () => {
            if (!container.isConnected) {
                optionsList.remove();
                return;
            }

            const triggerRect = trigger.getBoundingClientRect();
            const portalRect = usePortalOverlay
                ? portalRoot.getBoundingClientRect()
                : { top: 0, left: 0 };
            const optionCount = Math.max(select.options.length, 1);
            const extraSearchHeight = isSearchable ? 58 : 0;
            const estimatedHeight = Math.min(320, (optionCount * 42) + extraSearchHeight);
            const viewportPadding = 12;
            const availableWidth = Math.max(160, window.innerWidth - (viewportPadding * 2));
            const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
            const spaceAbove = triggerRect.top - viewportPadding;
            const shouldOpenUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
            const maxHeight = Math.max(140, Math.min(320, shouldOpenUp ? spaceAbove : spaceBelow));
            const dropdownWidth = Math.min(triggerRect.width, availableWidth);
            const left = Math.max(
                viewportPadding,
                Math.min(
                    triggerRect.left,
                    window.innerWidth - dropdownWidth - viewportPadding
                )
            );
            const top = shouldOpenUp
                ? Math.max(viewportPadding, triggerRect.top - Math.min(estimatedHeight, maxHeight) - 6)
                : Math.min(window.innerHeight - maxHeight - viewportPadding, triggerRect.bottom + 6);

            container.classList.toggle('open-up', shouldOpenUp);
            optionsList.classList.toggle('open-up', shouldOpenUp);
            optionsList.style.top = `${top - portalRect.top}px`;
            optionsList.style.left = `${left - portalRect.left}px`;
            optionsList.style.width = `${dropdownWidth}px`;
            optionsList.style.maxHeight = `${maxHeight}px`;
        };

        const refreshDropdownPosition = () => {
            if (!container.classList.contains('active')) return;
            positionDropdown();
        };

        const scheduleDropdownPosition = () => {
            window.requestAnimationFrame(refreshDropdownPosition);
            window.requestAnimationFrame(refreshDropdownPosition);
            clearTimeout(repositionTimer);
            repositionTimer = window.setTimeout(refreshDropdownPosition, 220);
        };

        const closeDropdown = () => {
            clearTimeout(repositionTimer);
            container.classList.remove('active', 'open-up');
            optionsList.classList.remove('active', 'open-up');
        };

        select.addEventListener('change', syncSelectedState);
        optionsList.addEventListener('click', (e) => e.stopPropagation());

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select.active').forEach((dropdown) => {
                if (dropdown !== container) {
                    dropdown.classList.remove('active', 'open-up');
                }
            });
            document.querySelectorAll('.select-options-floating.active').forEach((dropdown) => {
                if (dropdown !== optionsList) {
                    dropdown.classList.remove('active', 'open-up');
                }
            });

            if (container.classList.contains('active')) {
                closeDropdown();
                return;
            }

            buildOptions('');
            syncSelectedState();
            positionDropdown();
            container.classList.add('active');
            optionsList.classList.add('active');
            scheduleDropdownPosition();
            if (isSearchable && searchInput) {
                searchInput.focus();
            }
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            closeDropdown();
        });

        window.addEventListener('resize', closeDropdown);

        container._refreshCustomDropdown = () => {
            buildOptions(searchInput?.value || '');
            syncSelectedState();
        };
        container._closeCustomDropdown = closeDropdown;

        buildOptions('');
        syncSelectedState();
        return;
    }

    trigger = container.querySelector('.select-trigger');
    optionsList = document.querySelector(`.select-options[data-for="${selectId}"]`);
    if (!trigger || !optionsList) return;

    container._refreshCustomDropdown?.();
};

// Global popup alert system
window.showAlert = function (message, options = {}) {
    console.log('Alert:', message);

    const text = String(message || '');
    const inferredType = /fail|failed|error|invalid|cannot|unable/i.test(text) ? 'error' : 'success';
    const type = options.type || inferredType;
    const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };
    const title = options.title || titles[type] || 'Success';
    const iconClass = icons[type] || icons.success;
    const autoCloseMs = Number(options.autoCloseMs || 2400);

    const existing = document.querySelector('.app-alert-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'app-alert-overlay';
    overlay.setAttribute('role', 'presentation');

    const popup = document.createElement('div');
    popup.className = `app-alert-popup app-alert-${type}`;
    popup.setAttribute('role', 'alertdialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-labelledby', 'app-alert-title');
    popup.setAttribute('aria-describedby', 'app-alert-message');

    const icon = document.createElement('div');
    icon.className = 'app-alert-icon';
    icon.innerHTML = `<i class="fas ${iconClass}" aria-hidden="true"></i>`;

    const titleEl = document.createElement('h3');
    titleEl.id = 'app-alert-title';
    titleEl.textContent = title;

    const highlightEl = document.createElement('div');
    highlightEl.className = 'app-alert-highlight';
    highlightEl.textContent = String(options.highlight || '');

    const messageEl = document.createElement('p');
    messageEl.id = 'app-alert-message';
    messageEl.textContent = text;

    const statsEl = document.createElement('div');
    statsEl.className = 'app-alert-stats';
    const stats = Array.isArray(options.stats) ? options.stats : [];
    const statIcons = {
        success: 'fa-check',
        error: 'fa-xmark',
        warning: 'fa-adjust',
        info: 'fa-mug-hot'
    };
    stats.forEach((stat) => {
        const chip = document.createElement('span');
        chip.className = `app-alert-stat app-alert-stat-${stat.type || 'info'}`;
        const iconClass = stat.icon || statIcons[stat.type] || statIcons.info;
        chip.innerHTML = `<i class="fas ${iconClass}" aria-label="${stat.label || ''}"></i><b>${stat.value}</b>`;
        statsEl.appendChild(chip);
    });

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-alert-button';
    button.textContent = options.buttonText || 'OK';

    const close = () => {
        overlay.classList.add('is-closing');
        setTimeout(() => overlay.remove(), 160);
    };

    button.addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) close();
    });

    popup.append(icon, titleEl);
    if (options.highlight) {
        popup.appendChild(highlightEl);
    }
    popup.appendChild(messageEl);
    if (stats.length > 0) {
        popup.appendChild(statsEl);
    }
    popup.appendChild(button);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    button.focus({ preventScroll: true });

    if (autoCloseMs > 0) {
        setTimeout(close, autoCloseMs);
    }
};

// Also make it available without window prefix
window.showAlert = window.showAlert;

window.loadHtml2Pdf = () => {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (window._html2pdfPromise) return window._html2pdfPromise;

    window._html2pdfPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => resolve(window.html2pdf);
        script.onerror = () => reject(new Error('PDF library load failed'));
        document.head.appendChild(script);
    });

    return window._html2pdfPromise;
};

window.SyncStatus = {
    _hideTimer: null,

    ensureElement() {
        let el = document.getElementById('sync-status-chip');
        if (el) return el;

        el = document.createElement('div');
        el.id = 'sync-status-chip';
        el.className = 'sync-status-chip hidden';
        document.body.appendChild(el);
        return el;
    },

    show(message, state = 'info', autoHideMs = 0) {
        const el = this.ensureElement();

        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        el.className = `sync-status-chip sync-status-${state}`;
        el.innerHTML = `
            <span class="sync-status-dot"></span>
            <span>${message}</span>
        `;

        if (autoHideMs > 0) {
            this._hideTimer = setTimeout(() => this.hide(), autoHideMs);
        }
    },

    hide() {
        const el = document.getElementById('sync-status-chip');
        if (!el) return;
        el.className = 'sync-status-chip hidden';
    }
};

