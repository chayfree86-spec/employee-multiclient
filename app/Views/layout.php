<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title><?= $title ?? 'Chay Chaupal' ?></title>
    <meta name="csrf-token" content="<?= csrf_hash() ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    
    <!-- PNotify Core -->
    <link href="https://cdn.jsdelivr.net/npm/@pnotify/core@4.0.0/dist/PNotify.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@pnotify/core@4.0.0/dist/BrightTheme.css" rel="stylesheet">
    
    <!-- SweetAlert2 -->
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --sidebar-width: 250px;
            /* Theme: sidebar & right panel use separate, non-clashing colors */
            --theme-dark-brown: #42291e;
            --theme-green: #0b7c3d;
            --theme-grey-purple: #5a534e;
            --theme-light-beige: #c4b5a0;
            /* Sidebar: darker warm grey-brown */
            --sidebar-bg: #3a322b;
            --sidebar-active: var(--theme-green);
            /* Right panel: neutral warm grey - distinct from sidebar, easy on eyes */
            --body-bg: #f5f4f2;
            --content-bg: #f0eeeb;
            --header-bg: #fafaf8;
            --header-border: #e5e3df;
            --card-bg: #ffffff;
            --card-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
            --theme-border: rgba(90, 83, 78, 0.18);
            /* Button & badge colors - unchanged */
            --theme-blue: #2563eb;
            --theme-blue-dark: #1d4ed8;
            --theme-yellow: #eab308;
            --theme-yellow-dark: #ca8a04;
            --theme-green-dark: #065a2d;
            --transition-speed: 0.3s;
        }

        .btn-theme-blue {
            background: var(--theme-blue);
            border-color: var(--theme-blue);
            color: #fff;
        }
        .btn-theme-blue:hover {
            background: var(--theme-blue-dark);
            border-color: var(--theme-blue-dark);
            color: #fff;
        }
        .btn-theme-green, .btn-add-primary {
            background: linear-gradient(135deg, var(--theme-green) 0%, var(--theme-green-dark) 100%);
            border: none;
            color: #fff;
            font-weight: 600;
            letter-spacing: 0.02em;
            box-shadow: 0 2px 8px rgba(11, 124, 61, 0.35);
            transition: box-shadow 0.2s, transform 0.15s;
        }
        .btn-theme-green:hover, .btn-add-primary:hover {
            background: linear-gradient(135deg, var(--theme-green-dark) 0%, #054a24 100%);
            color: #fff;
            box-shadow: 0 4px 12px rgba(11, 124, 61, 0.4);
        }
        .btn-theme-green:active, .btn-add-primary:active {
            transform: scale(0.98);
        }
        .btn-theme-yellow {
            background: var(--theme-yellow);
            border-color: var(--theme-yellow);
            color: #1a1a1a;
        }
        .btn-theme-yellow:hover {
            background: var(--theme-yellow-dark);
            border-color: var(--theme-yellow-dark);
            color: #1a1a1a;
        }

        html, body {
            overflow-x: hidden;
            max-width: 100vw;
        }
        body {
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--body-bg);
            font-size: 15px;
            line-height: 1.5;
            color: #333;
        }

        .sidebar {
            min-height: 100vh;
            background: var(--sidebar-bg);
            border-right: 1px solid rgba(0, 0, 0, 0.12);
            position: fixed;
            top: 0;
            left: 0;
            width: var(--sidebar-width);
            z-index: 1000;
            transition: transform var(--transition-speed) ease;
        }

        .sidebar .nav-link {
            color: rgba(255,255,255,.75);
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all var(--transition-speed);
            text-decoration: none;
        }

        .sidebar .nav-link:hover {
            color: #fff;
            background: rgba(255,255,255,.12);
        }

        .sidebar .nav-link.active {
            color: #fff;
            background: var(--sidebar-active);
        }

        .sidebar-brand { border-bottom: 1px solid rgba(255,255,255,.15); }
        .sidebar-brand a { color: #fff; }
        .sidebar-brand a:hover { color: var(--theme-light-beige); }
        .sidebar-logo {
            max-width: 200px;
            height: auto;
            display: block;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        .sidebar-title { font-size: 0.85rem; font-weight: 600; letter-spacing: 0.5px; opacity: 0.95; }

        .main-content {
            margin-left: var(--sidebar-width);
            padding: 0;
            min-height: 100vh;
            min-width: 0;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        .app-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px 16px 32px;
            flex-shrink: 0;
            background: #f5f4f2;
            background-image: linear-gradient(180deg, #f8f7f5 0%, #f5f4f2 100%);
            border-bottom: 1px solid var(--header-border);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);
            position: relative;
            z-index: 1050;
            border-radius: 0 0 16px 0;
            overflow: visible;
        }
        .app-header::before {
            content: '';
            /* position: absolute; */
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, var(--theme-green) 0%, var(--theme-dark-brown) 100%);
            border-radius: 0 4px 0 0;
        }
        .app-header .header-date {
            font-size: 1rem;
            font-weight: 700;
            color: var(--theme-dark-brown);
            letter-spacing: 0.02em;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .app-header .header-date i.fa-calendar-day {
            margin: 0;
            font-size: 1.05rem;
            background: #fff;
            color: var(--theme-dark-brown);
            font-weight: 600;
            padding: 9px 12px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .app-header .btn-light:hover {
            background: rgba(11, 124, 61, 0.08);
            border-color: var(--theme-green);
            color: var(--theme-dark-brown);
        }
        .app-header .dropdown-menu {
            z-index: 1060;
        }

        @media (max-width: 576px) {
            .app-header {
                padding: 10px 15px;
            }
            .header-date span#currentDate {
                display: none;
            }
            .header-user-dropdown span {
                display: none;
            }
            .header-user-dropdown button {
                padding: 8px 10px;
            }
            .app-header .header-date i.fa-calendar-day {
                padding: 7px 10px;
            }
            .app-header .header-date .clock-wrap {
                margin-left: 0 !important;
                font-size: 13px;
                padding: 5px 8px !important;
            }
        }

        .main-content-inner {
            flex: 1;
            min-width: 0;
            padding: 28px 20px 20px;
            background: #fafaf8;
            background-attachment: local;
            font-size: 1rem;
            color: #333;
            overflow-x: hidden;
        }

        .card {
            border: none;
            border-radius: 12px;
            box-shadow: var(--card-shadow);
            background: var(--card-bg);
        }

        .main-content-inner .page-title {
            color: var(--theme-dark-brown);
            font-weight: 700;
            font-size: 1.65rem;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }

        @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%); width: 280px; max-width: 85vw; }
            .sidebar.show { transform: translateX(0); }
            .main-content { margin-left: 0; }
            .sidebar-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.4);
                z-index: 999;
                opacity: 0;
                transition: opacity 0.25s ease;
            }
            .sidebar-overlay.show { display: block; opacity: 1; }
        }
        @media (min-width: 769px) {
            .sidebar-overlay { display: none !important; }
        }
        .sidebar-toggle-btn {
            display: none;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            padding: 0;
            border-radius: 10px;
            border: 1px solid var(--header-border);
            background: #fff;
            color: var(--theme-dark-brown);
        }
        @media (max-width: 768px) {
            .sidebar-toggle-btn { display: flex; }
        }
    </style>
</head>
<body>
    <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
    <div class="sidebar" id="sidebar">
        <div class="sidebar-brand p-4 text-white text-center">
            <a href="<?= base_url('dashboard') ?>" class="d-inline-block text-decoration-none">
                <img src="<?= base_url('public/images/logo-chaychaupal.png') ?>" alt="Chay Chaupal" class="sidebar-logo" />
            </a>
        </div>
        <nav class="nav flex-column">
            <a href="<?= base_url('dashboard') ?>" class="nav-link <?= (uri_string() == 'dashboard' || uri_string() == '') ? 'active' : '' ?>">
                <i class="fas fa-home"></i> Dashboard
            </a>
            <a href="<?= base_url('employee') ?>" class="nav-link <?= strpos(uri_string(), 'employee') === 0 ? 'active' : '' ?>">
                <i class="fas fa-users"></i> Employees
            </a>
            <a href="<?= base_url('attendance') ?>" class="nav-link <?= (strpos(uri_string(), 'attendance') === 0 && strpos(uri_string(), 'report') === false) ? 'active' : '' ?>">
                <i class="fas fa-calendar-check"></i> Attendance
            </a>
            <a href="<?= base_url('report') ?>" class="nav-link <?= strpos(uri_string(), 'report') !== false ? 'active' : '' ?>">
                <i class="fas fa-file-alt"></i> Reports
            </a>
            <a href="<?= base_url('payroll') ?>" class="nav-link <?= strpos(uri_string(), 'payroll') === 0 ? 'active' : '' ?>">
                <i class="fas fa-file-invoice-dollar"></i> Payroll
            </a>
        </nav>
    </div>

    <div class="main-content">
        <header class="app-header">
            <div class="d-flex align-items-center gap-2">
                <button type="button" class="sidebar-toggle-btn" id="sidebarToggle" aria-label="Open menu">
                    <i class="fas fa-bars fa-lg"></i>
                </button>
                <div class="header-date">
                    <i class="fas fa-calendar-day d-none d-sm-inline-block"></i>
                    <span id="currentDate"><?= date('l, F j, Y') ?></span>
                    <span class="ms-2 px-2 py-1 bg-white rounded shadow-sm border clock-wrap" style="font-family: monospace; font-weight: 700; color: #0b7c3d; white-space: nowrap;">
                        <i class="fas fa-clock me-1 small opacity-75"></i><span id="liveClock">--:--:--</span>
                    </span>
                </div>
            </div>
            <div class="dropdown header-user-dropdown">
                <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle me-1"></i>
                    <span><?= esc(session()->get('user')['username'] ?? 'User') ?></span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow">
                    <li><a class="dropdown-item" href="<?= base_url('profile') ?>">Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="<?= base_url('logout') ?>">Logout</a></li>
                </ul>
            </div>
        </header>

        <div class="main-content-inner">
            <?php $pageTitle = $title ?? 'Dashboard'; if ($pageTitle !== ''): ?>
            <h2 class="mb-4 page-title"><?= esc($pageTitle) ?></h2>
            <?php endif; ?>
            <?= $this->renderSection('content') ?>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    
    <!-- PNotify JS -->
    <script src="https://cdn.jsdelivr.net/npm/@pnotify/core@4.0.0/dist/PNotify.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@pnotify/bootstrap4@4.0.0/dist/PNotifyBootstrap4.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@pnotify/font-awesome5@4.0.0/dist/PNotifyFontAwesome5.js"></script>
    
    <!-- SweetAlert2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    
    <script>
        $(document).ready(function() {
            // Mobile sidebar toggle
            var sidebar = document.getElementById('sidebar');
            var overlay = document.getElementById('sidebarOverlay');
            var toggleBtn = document.getElementById('sidebarToggle');
            function openSidebar() {
                if (sidebar) sidebar.classList.add('show');
                if (overlay) { overlay.classList.add('show'); overlay.setAttribute('aria-hidden', 'false'); }
                if (toggleBtn) {
                    toggleBtn.setAttribute('aria-label', 'Close menu');
                    var icon = toggleBtn.querySelector('i'); if (icon) icon.classList.replace('fa-bars', 'fa-times');
                }
                document.body.style.overflow = 'hidden';
            }
            function closeSidebar() {
                if (sidebar) sidebar.classList.remove('show');
                if (overlay) { overlay.classList.remove('show'); overlay.setAttribute('aria-hidden', 'true'); }
                if (toggleBtn) {
                    toggleBtn.setAttribute('aria-label', 'Open menu');
                    var icon = toggleBtn.querySelector('i'); if (icon) icon.classList.replace('fa-times', 'fa-bars');
                }
                document.body.style.overflow = '';
            }
            if (toggleBtn) toggleBtn.addEventListener('click', function() { sidebar && sidebar.classList.contains('show') ? closeSidebar() : openSidebar(); });
            if (overlay) overlay.addEventListener('click', closeSidebar);
            document.querySelectorAll('#sidebar .nav-link').forEach(function(link) { link.addEventListener('click', closeSidebar); });

            // Live Clock Update
            function updateClock() {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                const clockEl = document.getElementById('liveClock');
                if (clockEl) clockEl.textContent = timeStr;
            }
            setInterval(updateClock, 1000);
            updateClock();

            // Global PNotify configuration
            if (typeof PNotify !== 'undefined') {
                PNotify.defaults.styling = 'bootstrap4';
                PNotify.defaults.icons = 'fontawesome5';
            }

            // Success Flash Message
            <?php if (session()->getFlashdata('success')): ?>
                if (typeof PNotify !== 'undefined') {
                    PNotify.success({
                        title: 'Success',
                        text: <?= json_encode(session()->getFlashdata('success')) ?>
                    });
                }
            <?php endif; ?>

            // Error Flash Message
            <?php if (session()->getFlashdata('error')): ?>
                if (typeof PNotify !== 'undefined') {
                    PNotify.error({
                        title: 'Error',
                        text: <?= json_encode(session()->getFlashdata('error')) ?>
                    });
                }
            <?php endif; ?>
            // Global Smart Share function
            window.smartShare = async function(url, filename, title) {
                try {
                    // Show loading if possible
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            title: 'Preparing file...',
                            text: 'Please wait',
                            allowOutsideClick: false,
                            didOpen: () => { Swal.showLoading(); }
                        });
                    }

                    const response = await fetch(url);
                    const blob = await response.blob();
                    const file = new File([blob], filename, { type: 'application/pdf' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        if (typeof Swal !== 'undefined') Swal.close();
                        await navigator.share({
                            files: [file],
                            title: title,
                            text: title
                        });
                    } else {
                        throw new Error('Web Share not supported for files');
                    }
                } catch (error) {
                    console.error('Share failed:', error);
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'info',
                            title: 'Native Share Unavailable',
                            text: 'Please download the PDF manually and share it.',
                            showCancelButton: true,
                            confirmButtonText: 'Download Now',
                            cancelButtonText: 'Close'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.open(url, '_blank');
                            }
                        });
                    } else {
                        window.open(url, '_blank');
                    }
                }
            };
        });
    </script>
    <?= $this->renderSection('scripts') ?>
</body>
</html>
