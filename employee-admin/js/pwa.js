(function () {
    let deferredPrompt = null;
    let installButton = null;

    const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    const hideInstallButton = () => {
        if (installButton) {
            installButton.remove();
            installButton = null;
        }
    };

    const showInstallButton = () => {
        if (isStandalone() || installButton) return;

        installButton = document.createElement('button');
        installButton.type = 'button';
        installButton.id = 'pwa-install-btn';
        installButton.innerHTML = '<i class="fas fa-download"></i><span>Install App</span>';
        installButton.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:3000;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#3E2723;color:#fff;padding:12px 16px;font-weight:800;box-shadow:0 14px 34px rgba(62,39,35,.28);cursor:pointer;';
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice.catch(() => null);
            deferredPrompt = null;
            hideInstallButton();
        });
        document.body.appendChild(installButton);
    };

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallButton();
    });

    window.addEventListener('load', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/employee-admin/sw.js', { scope: '/employee-admin/' }).catch(() => {});
        }

        if (isStandalone()) {
            hideInstallButton();
        }
    });
}());
