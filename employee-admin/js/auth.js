const AuthManager = {
    storageKey: (key) => `employee_management_admin_${key}`,

    getStoredUser: () => {
        const raw = sessionStorage.getItem(AuthManager.storageKey('user'));
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    },

    getStoredUsername: () => {
        return sessionStorage.getItem(AuthManager.storageKey('username')) || null;
    },

    updateSidebarUser: (user = null) => {
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarRole = document.getElementById('sidebar-user-role');
        const sidebarAvatar = document.getElementById('sidebar-user-avatar');

        if (!sidebarName || !sidebarRole || !sidebarAvatar) return;

        const currentUser = user || AuthManager.getStoredUser();
        const displayName = window.BrandingManager?.getCafeName?.()
            || currentUser?.business_name
            || currentUser?.name
            || currentUser?.username
            || 'Admin User';
        const displayRole = currentUser?.role || 'Administrator';
        const encodedName = encodeURIComponent(displayName);
        const avatarSrc = window.PhotoHelper.normalizeImageUrl(currentUser?.profile_image) || window.PhotoHelper.avatarUrl(encodedName, 'C8A97E', 'fff', 48);

        sidebarName.textContent = displayName;
        sidebarRole.textContent = displayRole;
        sidebarAvatar.onerror = function () {
            window.PhotoHelper.applyFallback(this, encodedName, 'C8A97E', 'fff', 48);
        };
        sidebarAvatar.src = avatarSrc;
        window.BrandingManager?.applyBranding?.();
    },

    getUsernameFromToken: () => {
        const token = sessionStorage.getItem(AuthManager.storageKey('token'));
        if (!token) return null;

        try {
            const decoded = atob(token);
            return decoded.split(':')[0] || null;
        } catch (error) {
            return null;
        }
    },

    getFallbackUsername: () => {
        return AuthManager.getStoredUser()?.username
            || AuthManager.getStoredUsername()
            || AuthManager.getUsernameFromToken();
    },

    resolveCurrentUser: async () => {
        const storedUser = AuthManager.getStoredUser();
        const username = AuthManager.getFallbackUsername();
        if (!username) return storedUser || null;

        try {
            const resolvedUser = await ApiClient.getProfile({ username });
            if (resolvedUser) {
                sessionStorage.setItem(AuthManager.storageKey('user'), JSON.stringify(resolvedUser));
                sessionStorage.setItem(AuthManager.storageKey('username'), resolvedUser.username || username);
                AuthManager.updateSidebarUser(resolvedUser);
                return resolvedUser;
            }
        } catch (error) {
            return storedUser || null;
        }

        return storedUser || null;
    },

    showProfileImageModal: async () => {
        const currentUser = await AuthManager.resolveCurrentUser();
        if (!currentUser?.id) {
            alert('Logged-in user not found');
            return;
        }

        const displayName = window.BrandingManager?.getCafeName?.()
            || currentUser?.business_name
            || currentUser?.name
            || currentUser?.username
            || 'Admin User';
        const encodedName = encodeURIComponent(displayName);
        const content = `
            <form id="admin-photo-upload-form" onsubmit="AuthManager.handleProfileImageSubmit(event)">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div style="position:relative; width:120px; height:120px; margin:0 auto; border-radius:28px; overflow:hidden; border:2px dashed var(--primary); display:flex; align-items:center; justify-content:center; background:rgba(62, 39, 35, 0.05);">
                        <img id="admin-photo-upload-preview" src="${window.PhotoHelper.normalizeImageUrl(currentUser?.profile_image) || window.PhotoHelper.avatarUrl(encodedName, 'C8A97E', 'fff', 120)}" alt="${displayName} profile photo preview" onerror="window.PhotoHelper.applyFallback(this, '${encodedName}', 'C8A97E', 'fff', 120)" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <p style="margin:1rem 0 0; color:var(--text-muted); font-weight:600;">${displayName}</p>
                    <p style="margin:0.25rem 0 0; color:var(--text-muted); font-size:0.85rem;">${currentUser?.role || 'Administrator'}</p>
                </div>

                <div style="display:flex; justify-content:center; gap:10px; margin-bottom:1rem;">
                    <button type="button" class="btn-outline" style="padding:10px 14px; border-radius:12px;" onclick="document.getElementById('admin-photo-upload-camera').click()">
                        <i class="fas fa-camera"></i> Camera
                    </button>
                    <button type="button" class="btn-outline" style="padding:10px 14px; border-radius:12px;" onclick="document.getElementById('admin-photo-upload-gallery').click()">
                        <i class="fas fa-image"></i> Gallery
                    </button>
                </div>

                <input type="file" id="admin-photo-upload-camera" accept="image/*" capture="environment" style="display:none;" onchange="AuthManager.previewProfileImage(this, '${encodedName}')">
                <input type="file" id="admin-photo-upload-gallery" accept="image/*" style="display:none;" onchange="AuthManager.previewProfileImage(this, '${encodedName}')">

                <button type="submit" class="btn-primary full-width">Upload Profile Photo</button>
            </form>
        `;

        ModalManager.show('Update Profile Photo', content);
    },

    previewProfileImage: (input, encodedName) => {
        const file = input.files[0];
        const preview = document.getElementById('admin-photo-upload-preview');
        if (!preview) return;

        if (!file) {
            window.PhotoHelper.applyFallback(preview, encodedName, 'C8A97E', 'fff', 120);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    handleProfileImageSubmit: async (e) => {
        e.preventDefault();
        const currentUser = await AuthManager.resolveCurrentUser();
        if (!currentUser?.id) {
            alert('Logged-in user not found');
            return;
        }

        const selectedFile = document.getElementById('admin-photo-upload-camera')?.files?.[0]
            || document.getElementById('admin-photo-upload-gallery')?.files?.[0];

        if (!selectedFile) {
            alert('Please select a photo first');
            return;
        }

        try {
            const result = await ApiClient.uploadProfileImage(currentUser.id, selectedFile);
            const updatedUser = {
                ...currentUser,
                profile_image: window.PhotoHelper.normalizeImageUrl(result?.profile_image || currentUser.profile_image)
            };
            sessionStorage.setItem(AuthManager.storageKey('user'), JSON.stringify(updatedUser));
            StorageManager.save('business_logo', updatedUser.profile_image || '');
            AuthManager.updateSidebarUser(updatedUser);
            window.BrandingManager?.applyBranding?.();
            ModalManager.hide();
            alert('Profile photo updated');
        } catch (error) {
            alert(error.message || 'Failed to upload profile photo');
        }
    },

    checkStatus: async () => {
        const isLoggedIn = sessionStorage.getItem(AuthManager.storageKey('logged_in'));
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');

        if (isLoggedIn === 'true') {
            document.body.classList.add('is-authenticated');
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            try {
                const storedUser = AuthManager.getStoredUser();
                AuthManager.updateSidebarUser(storedUser ? { ...storedUser, profile_image: null } : null);

                const page = window.AppNavigation?.getCurrentView?.() || 'attendance';

                // Show UI immediately
                switchView(page);

                // Run heavy stuff in background
                AuthManager.resolveCurrentUser().then(() => {
                    ApiSyncManager.bootstrapCore();
                });
            } catch (error) {
                sessionStorage.removeItem(AuthManager.storageKey('logged_in'));
                sessionStorage.removeItem(AuthManager.storageKey('token'));
                sessionStorage.removeItem(AuthManager.storageKey('username'));
                sessionStorage.removeItem(AuthManager.storageKey('user'));
                document.body.classList.remove('is-authenticated');
                alert(`API connection failed: ${error.message}`);
                loginContainer.classList.remove('hidden');
                appContainer.classList.add('hidden');
                AuthManager.initLoginForm();
            }
        } else {
            document.body.classList.remove('is-authenticated');
            loginContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
            AuthManager.renderUserLogin();
            AuthManager.initLoginForm();
        }
    },

    renderUserLogin: () => {
        document.querySelectorAll('.login-header h1').forEach((el) => {
            el.textContent = 'User Login';
        });
        document.querySelectorAll('.login-header p').forEach((el) => {
            el.textContent = 'Enter your account details to continue.';
        });
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const canRememberPassword = window.innerWidth <= 900;
        const rememberedUsername = localStorage.getItem(AuthManager.storageKey('last_login_identifier')) || '';
        const rememberedPassword = canRememberPassword
            ? (localStorage.getItem(AuthManager.storageKey('last_login_password')) || '')
            : '';
        if (username) {
            username.value = rememberedUsername;
            username.setAttribute('autocomplete', 'username');
        }
        if (password) {
            password.value = rememberedPassword;
            password.setAttribute('autocomplete', 'current-password');
        }
    },

    initLoginForm: () => {
        const form = document.getElementById('login-form');
        if (!form) return;

        if (form.dataset.bound === 'true') return;
        form.dataset.bound = 'true';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            try {
                const loginData = await ApiClient.login(user, pass);
                sessionStorage.setItem(AuthManager.storageKey('logged_in'), 'true');
                sessionStorage.setItem(AuthManager.storageKey('token'), loginData?.token || '');
                sessionStorage.setItem(AuthManager.storageKey('username'), loginData?.user?.username || user);
                sessionStorage.setItem(AuthManager.storageKey('user'), JSON.stringify(loginData?.user || { username: user, role: 'Administrator' }));
                localStorage.setItem(AuthManager.storageKey('last_login_identifier'), user);
                if (window.innerWidth <= 900) {
                    localStorage.setItem(AuthManager.storageKey('last_login_password'), pass);
                }
                AuthManager.updateSidebarUser(loginData?.user || { username: user, role: 'Administrator' });
                await ApiSyncManager.bootstrap(true);
                await AuthManager.checkStatus();
            } catch (error) {
                alert(error.message || 'Login failed');
            }
        });
    },

    logout: () => {
        sessionStorage.removeItem(AuthManager.storageKey('logged_in'));
        sessionStorage.removeItem(AuthManager.storageKey('token'));
        sessionStorage.removeItem(AuthManager.storageKey('username'));
        sessionStorage.removeItem(AuthManager.storageKey('user'));
        sessionStorage.removeItem(AuthManager.storageKey('from_superadmin'));
        location.reload();
    },

    backToSuperadmin: () => {
        sessionStorage.removeItem(AuthManager.storageKey('logged_in'));
        sessionStorage.removeItem(AuthManager.storageKey('token'));
        sessionStorage.removeItem(AuthManager.storageKey('username'));
        sessionStorage.removeItem(AuthManager.storageKey('user'));
        sessionStorage.removeItem(AuthManager.storageKey('from_superadmin'));
        window.location.href = '/employee-admin/superadmin/index.html';
    },

    renderSuperadminBackButton: () => {
        if (sessionStorage.getItem(AuthManager.storageKey('from_superadmin')) !== 'true') return;
        if (document.getElementById('back-superadmin-btn')) return;

        const sidebarBottom = document.querySelector('.sidebar-bottom');
        if (!sidebarBottom) return;

        const button = document.createElement('button');
        button.id = 'back-superadmin-btn';
        button.className = 'nav-item';
        button.type = 'button';
        button.innerHTML = '<i class="fas fa-arrow-left"></i><span>Back to Superadmin</span>';
        button.style.cssText = 'border:none; cursor:pointer; width:100%; margin-bottom:0.5rem; background:rgba(200,169,126,0.16); color:var(--sidebar-text);';
        button.addEventListener('click', AuthManager.backToSuperadmin);
        sidebarBottom.insertBefore(button, sidebarBottom.firstChild);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const sidebarUserCard = document.getElementById('sidebar-user-card');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            AuthManager.logout();
        });
    }
    if (sidebarUserCard) {
        sidebarUserCard.addEventListener('click', async () => {
            await AuthManager.showProfileImageModal();
        });
    }
    AuthManager.renderSuperadminBackButton();
});
