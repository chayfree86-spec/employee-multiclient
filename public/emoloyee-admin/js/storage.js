const StorageManager = {
    DB_NAME: 'employee_management_admin_db',
    _dbCache: null,
    _localKeys: new Set([
        'cafe_name',
        'business_address',
        'business_phone',
        'business_email',
        'business_logo',
        'theme',
        'auto_hold_enabled',
        'auto_hold_days',
        'salary_cycle',
        'salary_cycle_type',
        'salary_cycle_weekday',
        'weekly_holiday',
        'color_advance',
        'color_deduction',
        'color_star_badge',
        'custom_primary_color',
        'employee_logins',
        'payroll_settings'
    ]),

    save: (key, data) => {
        const db = StorageManager.getDB();
        db[key] = data;
        StorageManager._dbCache = db;
        StorageManager.persistLocalSettings();
    },

    saveLocal: (key, data) => {
        const db = StorageManager.getDB();
        db[key] = data;
        StorageManager._dbCache = db;
    },

    get: (key) => {
        const db = StorageManager.getDB();
        return db[key] || null;
    },

    getDB: () => {
        if (StorageManager._dbCache) {
            return StorageManager._dbCache;
        }

        localStorage.removeItem('cafe_management_db');
        const raw = localStorage.getItem(StorageManager.DB_NAME);
        const saved = raw ? JSON.parse(raw) : {};
        StorageManager._dbCache = {
            staff: [],
            attendance: {}, // { "YYYY-MM-DD": { "staffId": status } }
            salaryAdjustments: {}, // { "staffId": { "YYYY-MM-DD": { overtime, advance, fine, adjustment, hold } } }
            advances: {},
            savings: {},
            transfers: {},
            fines: {},
            overtime: {},
            payrollRecords: [],
            payrollMap: {},
            apiDashboard: null,
            cafe_name: saved.cafe_name || 'Cafe Admin',
            business_address: saved.business_address || 'Near Clock Tower, Main Market, City',
            business_phone: saved.business_phone || '+91 98765 43210',
            business_email: saved.business_email || 'info@cafepremium.com',
            business_logo: saved.business_logo || '',
            auto_hold_enabled: saved.auto_hold_enabled || false,
            auto_hold_days: saved.auto_hold_days || 0,
            theme: saved.theme || 'theme-cafe',
            salary_cycle: saved.salary_cycle || 1,
            salary_cycle_type: saved.salary_cycle_type || 'Monthly',
            salary_cycle_weekday: saved.salary_cycle_weekday ?? 1, // 1=Monday
            weekly_holiday: saved.weekly_holiday ?? 0, // 0=Sunday
            color_advance: saved.color_advance || '#6c5ce7',
            color_deduction: saved.color_deduction || '#d63031',
            color_star_badge: saved.color_star_badge || '#FFD700',
            custom_primary_color: saved.custom_primary_color || '#3E2723',
            employee_logins: saved.employee_logins || [],
            payroll_settings: saved.payroll_settings || null
        };
        StorageManager.sanitizeImageCache(StorageManager._dbCache);

        return StorageManager._dbCache;
    },

    sanitizeImageCache: (value) => {
        if (!value || typeof value !== 'object') return;

        Object.keys(value).forEach((key) => {
            const item = value[key];
            if (item && typeof item === 'object') {
                StorageManager.sanitizeImageCache(item);
                return;
            }

            if (!['photo', 'profile_image', 'business_logo'].includes(key)) return;
            if (typeof item !== 'string') return;
            if (/^[^/\\]+\.(png|jpe?g|webp|gif|svg)$/i.test(item.trim())) {
                value[key] = '';
            }
        });
    },

    persistLocalSettings: () => {
        const db = StorageManager._dbCache || {};
        const persisted = {};
        StorageManager._localKeys.forEach((key) => {
            if (db[key] !== undefined) {
                persisted[key] = db[key];
            }
        });
        localStorage.setItem(StorageManager.DB_NAME, JSON.stringify(persisted));
    },

    clear: () => {
        StorageManager._dbCache = null;
        localStorage.removeItem(StorageManager.DB_NAME);
        localStorage.removeItem('cafe_management_db');
    }
};
