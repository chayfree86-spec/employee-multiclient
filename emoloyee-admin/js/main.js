document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

window.BrandingManager = {
    getCafeName: () => StorageManager.get('cafe_name') || 'Cafe Admin',
    getBusinessAddress: () => StorageManager.get('business_address') || 'Near Clock Tower, Main Market, City',
    getBusinessPhone: () => StorageManager.get('business_phone') || '+91 98765 43210',
    getBusinessEmail: () => StorageManager.get('business_email') || 'info@cafepremium.com',

    applyBranding: () => {
        const cafeName = BrandingManager.getCafeName();

        document.title = `${cafeName} Attendance & Salary Management`;

        document.querySelectorAll('.login-header h1').forEach((el) => {
            el.textContent = cafeName;
        });

        document.querySelectorAll('.brand-info h2').forEach((el) => {
            el.textContent = cafeName;
        });
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
    }
};

window.LayoutManager = {
    ensureMobileChrome: () => {
        const appContainer = document.getElementById('app-container');
        const header = document.querySelector('.app-header');

        if (!appContainer || !header) return;

        if (!document.getElementById('mobile-nav-toggle')) {
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.id = 'mobile-nav-toggle';
            toggle.className = 'mobile-nav-toggle';
            toggle.setAttribute('aria-label', 'Open navigation');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
            toggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-open');
                const isOpen = document.body.classList.contains('sidebar-open');
                toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
                toggle.innerHTML = `<i class="fas fa-${isOpen ? 'times' : 'bars'}"></i>`;
                document.getElementById('mobile-sidebar-backdrop')?.classList.toggle('active', isOpen);
            });
            header.prepend(toggle);
        }

        if (!document.getElementById('mobile-sidebar-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'mobile-sidebar-backdrop';
            backdrop.className = 'mobile-sidebar-backdrop';
            backdrop.addEventListener('click', () => LayoutManager.closeSidebar());
            document.body.appendChild(backdrop);
        }
    },

    closeSidebar: () => {
        document.body.classList.remove('sidebar-open');
        document.getElementById('mobile-sidebar-backdrop')?.classList.remove('active');
        const toggle = document.getElementById('mobile-nav-toggle');
        if (toggle) {
            toggle.setAttribute('aria-label', 'Open navigation');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
};

function initApp() {
    let staffSearchTimer = null;

    BrandingManager.applyBranding();

    // Detect current page from filename
    const path = window.location.pathname;
    let page = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
    if (!page || page === 'index') page = 'dashboard';

    // Sidebar Navigation handles physical page loads
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
        const view = item.getAttribute('data-view');

        // Update active state based on current page
        const isMatch = view === page;

        item.classList.toggle('active', isMatch);

        // Nav items already have href in HTML, no need for click listeners for standard navigation
    });

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

    LayoutManager.ensureMobileChrome();
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
            LayoutManager.closeSidebar();
        }
    });

    document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                LayoutManager.closeSidebar();
            }
        });
    });

    // Check Auth Status
    AuthManager.checkStatus();
}

async function switchView(viewId, data = null) {
    if (window.currentView === 'attendance' && viewId !== 'attendance' && window.AttendanceManager?.flushPendingSave) {
        await window.AttendanceManager.flushPendingSave();
    }

    window.currentView = viewId;
    HeaderManager.sync(viewId, data);

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

// Custom Alert / Toast (Fallback if not defined elsewhere)
// Global Alert System
window.showAlert = function (message) {
    console.log('Alert:', message);
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    } else {
        alert(message);
    }
};

// Also make it available without window prefix
window.showAlert = window.showAlert;

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
