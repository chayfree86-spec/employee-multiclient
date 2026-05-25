<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="<?= csrf_hash() ?>">
    <meta name="theme-color" content="#42291e">
    <title>Login - Chay Chaupal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        html {
            -webkit-text-size-adjust: 100%;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            margin: 0;
            min-height: 100vh;
            min-height: 100dvh;
            background: linear-gradient(135deg, #d4a574 0%, #8b4513 50%, #5d3a1a 100%);
            background-attachment: fixed;
            display: flex;
            display: -webkit-flex;
            align-items: center;
            -webkit-align-items: center;
            justify-content: center;
            -webkit-justify-content: center;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            padding: constant(safe-area-inset-top) constant(safe-area-inset-right) constant(safe-area-inset-bottom) constant(safe-area-inset-left);
        }
        .login-wrapper {
            width: 100%;
            max-width: 420px;
            padding: 1rem;
        }
        .login-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
            overflow: hidden;
            width: 100%;
        }
        .login-header {
            background: linear-gradient(135deg, #8b4513 0%, #5d3a1a 100%);
            color: white;
            padding: 1.5rem 1rem;
            text-align: center;
        }
        .login-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 0.75rem;
            display: block;
            margin-left: auto;
            margin-right: auto;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2));
        }
        .login-header h3 { font-size: 1.35rem; margin: 0 0 0.25rem 0; }
        .login-header p { margin: 0; font-size: 0.9rem; opacity: 0.95; }
        .login-body {
            padding: 1.5rem 1rem;
        }
        .form-control:focus {
            border-color: #8b4513;
            box-shadow: 0 0 0 0.2rem rgba(139, 69, 19, 0.25);
        }
        .btn-login {
            background: #8b4513;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 25px;
            font-weight: 600;
            transition: all 0.3s;
            min-height: 44px;
        }
        .btn-login:hover {
            background: #6d3510;
            transform: translateY(-2px);
        }
        @media (min-width: 576px) {
            .login-header { padding: 2rem; }
            .login-body { padding: 2rem; }
            .login-header h3 { font-size: 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <div class="login-card">
            <div class="login-header">
                <img src="<?= base_url('images/logo-chaychaupal.png') ?>" alt="Chay Chaupal" class="login-logo" />
                <h3>Login</h3>
                <p>Chay Chaupal</p>
            </div>
            <div class="login-body">
                <?php if (isset($error)): ?>
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <?= $error ?>
                    </div>
                <?php endif; ?>

                <form action="<?= base_url('login') ?>" method="post" id="loginForm">
                    <?= csrf_field() ?>
                    <div class="mb-3">
                        <label for="username" class="form-label">
                            <i class="fas fa-user me-2"></i>Username
                        </label>
                        <input type="text" class="form-control form-control-lg" id="username" name="username"
                               value="<?= old('username') ?>" required autocomplete="username">
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">
                            <i class="fas fa-lock me-2"></i>Password
                        </label>
                        <input type="password" class="form-control form-control-lg" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <div class="d-grid">
                        <button type="submit" class="btn btn-login" style="background: #00723f; border-color: #00723f; color: #fff;">
                            <i class="fas fa-sign-in-alt me-2"></i>Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            fetch('<?= base_url('login') ?>', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken
                }
            })
            .then(response => {
                const ct = response.headers.get('content-type');
                if (!ct || !ct.includes('application/json')) {
                    throw new Error('Server returned non-JSON response. Check server logs.');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = data.redirect || '<?= base_url() ?>';
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Invalid username or password'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'An error occurred. Please try again.'
                });
            });
        });
    </script>
</body>
</html>