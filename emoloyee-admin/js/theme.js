const ThemeManager = {
    themePalette: {
        'theme-cafe': '#3E2723',
        'theme-light': '#F8F9FA',
        'theme-dark': '#1E1E1E',
        'theme-ocean': '#00695C',
        'theme-forest': '#2E7D32',
        'theme-royal': '#4527A0',
        'theme-sunset': '#E64A19',
        'theme-ruby': '#C62828',
        'theme-slate': '#37474F',
        'theme-nebula': '#1A237E',
        'theme-rose': '#AD1457',
        'theme-teal': '#00838F',
        'theme-amber': '#FF8F00',
        'theme-indigo': '#283593',
        'theme-brown': '#4E342E',
        'theme-gray': '#424242',
        'theme-mint': '#26A69A',
        'theme-cherry': '#880E4F',
        'theme-cobalt': '#1565C0',
        'theme-leaf': '#558B2F',
        'theme-gold': '#F9A825',
        'theme-smoke': '#CFD8DC',
        'theme-carbon': '#212121',
        'theme-lavender': '#6A1B9A',
        'theme-coral': '#D84315',
        'theme-olive': '#33691E',
        'theme-sky': '#0277BD',
        'theme-maroon': '#B71C1C',
        'theme-sand': '#A1887F',
        'theme-neon': '#1B5E20'
    },

    init: () => {
        const savedTheme = StorageManager.get('theme') || 'theme-cafe';
        ThemeManager.applyTheme(savedTheme);
    },

    setTheme: (themeName) => {
        StorageManager.save('theme', themeName);
        ThemeManager.applyTheme(themeName);
    },

    hexToRgb: (hex) => {
        const normalized = String(hex || '').trim().replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16)
        };
    },

    rgbToHex: ({ r, g, b }) => `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`,

    mixHex: (baseHex, mixHex, ratio = 0.5) => {
        const base = ThemeManager.hexToRgb(baseHex);
        const mix = ThemeManager.hexToRgb(mixHex);
        if (!base || !mix) return baseHex;

        const weight = Math.max(0, Math.min(1, ratio));
        return ThemeManager.rgbToHex({
            r: base.r + ((mix.r - base.r) * weight),
            g: base.g + ((mix.g - base.g) * weight),
            b: base.b + ((mix.b - base.b) * weight)
        });
    },

    getLuminance: (hex) => {
        const rgb = ThemeManager.hexToRgb(hex);
        if (!rgb) return 0;

        const normalize = (value) => {
            const channel = value / 255;
            return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        };

        return (0.2126 * normalize(rgb.r)) + (0.7152 * normalize(rgb.g)) + (0.0722 * normalize(rgb.b));
    },

    applySidebarPalette: (themeName, primaryColor) => {
        const rootStyle = document.documentElement.style;
        const color = primaryColor || ThemeManager.themePalette[themeName] || '#3E2723';
        const luminance = ThemeManager.getLuminance(color);
        const isLightTheme = luminance > 0.58 || ['theme-light', 'theme-smoke', 'theme-sand'].includes(themeName);

        if (isLightTheme) {
            rootStyle.setProperty('--sidebar-bg', ThemeManager.mixHex(color, '#FFFFFF', 0.82));
            rootStyle.setProperty('--sidebar-text', '#1F2A37');
            rootStyle.setProperty('--sidebar-hover', 'rgba(15, 23, 42, 0.06)');
            return;
        }

        rootStyle.setProperty('--sidebar-bg', ThemeManager.mixHex(color, '#081018', 0.72));
        rootStyle.setProperty('--sidebar-text', '#ECF3F9');
        rootStyle.setProperty('--sidebar-hover', 'rgba(255, 255, 255, 0.08)');
    },

    applyTheme: (themeName) => {
        document.body.className = '';
        document.body.classList.add(themeName);

        // Apply custom primary color if it's a theme that supports it (or always)
        const customColor = StorageManager.get('custom_primary_color');
        if (customColor) {
            document.documentElement.style.setProperty('--primary', customColor);
            document.documentElement.style.setProperty('--primary-light', ThemeManager.mixHex(customColor, '#FFFFFF', 0.22));
        } else {
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--primary-light');
        }

        ThemeManager.applySidebarPalette(themeName, customColor || ThemeManager.themePalette[themeName]);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});
