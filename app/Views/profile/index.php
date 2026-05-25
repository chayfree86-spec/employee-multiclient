<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-theme-blue text-white py-3">
                <h5 class="mb-0"><i class="fas fa-user-circle me-2"></i>Profile Settings</h5>
            </div>
            <div class="card-body p-4">
                <?php if (session()->getFlashdata('success')): ?>
                    <div class="alert alert-success"><?= session()->getFlashdata('success') ?></div>
                <?php endif; ?>
                <?php if (session()->getFlashdata('error')): ?>
                    <div class="alert alert-danger"><?= session()->getFlashdata('error') ?></div>
                <?php endif; ?>
                <?php if (isset($dbAvailable) && !$dbAvailable): ?>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Users table not found. Profile updates and password changes will not be saved until you run <code>db_schema.sql</code>.
                    </div>
                <?php endif; ?>

                <!-- Profile Form -->
                <form id="profileForm" class="mb-4">
                    <?= csrf_field() ?>
                    <h6 class="text-muted text-uppercase small fw-semibold mb-3">Account Information</h6>
                    <div class="row g-3">
                        <div class="col-12 col-md-6">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username" name="username"
                                   value="<?= esc($user['username'] ?? '') ?>" required>
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="col-12 col-md-6">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="email" name="email"
                                   value="<?= esc($user['email'] ?? '') ?>" required>
                            <div class="invalid-feedback"></div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button type="submit" class="btn btn-theme-blue">
                            <i class="fas fa-save me-2"></i>Update Profile
                        </button>
                    </div>
                </form>

                <hr>

                <!-- Change Password -->
                <form id="passwordForm">
                    <?= csrf_field() ?>
                    <h6 class="text-muted text-uppercase small fw-semibold mb-3">Change Password</h6>
                    <div class="row g-3">
                        <div class="col-12">
                            <label for="current_password" class="form-label">Current Password</label>
                            <input type="password" class="form-control" id="current_password" name="current_password" required>
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="col-12 col-md-6">
                            <label for="new_password" class="form-label">New Password</label>
                            <input type="password" class="form-control" id="new_password" name="new_password" minlength="6" required>
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="col-12 col-md-6">
                            <label for="confirm_password" class="form-label">Confirm New Password</label>
                            <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                            <div class="invalid-feedback"></div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button type="submit" class="btn btn-theme-yellow">
                            <i class="fas fa-key me-2"></i>Change Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
    $('#profileForm').on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        $.ajax({
            url: '<?= base_url('profile/update') ?>',
            type: 'POST',
            data: $form.serialize(),
            dataType: 'json',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function(res) {
                if (res.success) {
                    Swal.fire({ icon: 'success', title: 'Success', text: res.message });
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Update failed' });
                }
            },
            error: function(xhr) {
                var msg = 'An error occurred';
                if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                else if (xhr.responseText) { try { var j = JSON.parse(xhr.responseText); if (j.message) msg = j.message; } catch(e) {} }
                Swal.fire({ icon: 'error', title: 'Error', text: msg });
            }
        });
    });

    $('#passwordForm').on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const np = $('#new_password').val();
        const cp = $('#confirm_password').val();
        if (np !== cp) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'New password and confirm password do not match' });
            return;
        }
        $.ajax({
            url: '<?= base_url('profile/change-password') ?>',
            type: 'POST',
            data: $form.serialize(),
            dataType: 'json',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            success: function(res) {
                if (res.success) {
                    Swal.fire({ icon: 'success', title: 'Success', text: res.message });
                    $form[0].reset();
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Password change failed' });
                }
            },
            error: function(xhr) {
                var msg = 'An error occurred';
                if (xhr.responseJSON && xhr.responseJSON.message) msg = xhr.responseJSON.message;
                else if (xhr.responseText) { try { var j = JSON.parse(xhr.responseText); if (j.message) msg = j.message; } catch(e) {} }
                Swal.fire({ icon: 'error', title: 'Error', text: msg });
            }
        });
    });
</script>
<?= $this->endSection() ?>
