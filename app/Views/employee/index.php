<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<style>
/* Employee section - theme colors */
.employee-section .emp-stat-card {
    border-radius: 12px;
    border: 1px solid var(--theme-border, rgba(110,93,97,.18));
    background: var(--card-bg, #fff);
    transition: all 0.2s;
}
.employee-section .emp-stat-card:hover {
    box-shadow: 0 4px 14px rgba(66,41,30,0.08);
    border-color: rgba(110,93,97,0.3);
}
.employee-section .emp-stat-card .bg-primary.bg-opacity-10 { background-color: rgba(11,124,61,0.12) !important; }
.employee-section .emp-stat-card .text-primary { color: #0b7c3d !important; }
.employee-section .emp-stat-card .bg-success.bg-opacity-10 { background-color: rgba(11,124,61,0.1) !important; }
.employee-section .emp-stat-card .text-success { color: #0b7c3d !important; }
.employee-section .emp-stat-card .bg-info.bg-opacity-10 { background-color: rgba(110,93,97,0.12) !important; }
.employee-section .emp-stat-card .text-info { color: #6e5d61 !important; }
.employee-section .card.shadow-sm {
    background: var(--card-bg, #fff);
    border: 1px solid var(--theme-border, rgba(110,93,97,.18));
    border-radius: 12px;
}
.employee-section .table thead.table-light {
    background: rgba(235,210,162,0.35) !important;
    color: #42291e;
    border-bottom: 2px solid rgba(110,93,97,0.25);
}
.employee-section .table thead th { font-weight: 600; }
.employee-section .table-hover tbody tr:hover { background: rgba(235,210,162,0.2) !important; }
.table-responsive { overflow: visible !important; }
.card-body, .card { overflow: visible !important; }
.dropdown-menu { z-index: 2000 !important; }
#employeeModal .modal-content { border-radius: 12px; border: none; box-shadow: 0 10px 40px rgba(66,41,30,0.12); }
#employeeModal .modal-header { padding: 20px 24px; background: linear-gradient(135deg, #0b7c3d 0%, #065a2d 100%); color: #fff; border: none; }
#employeeModal .modal-body { padding: 24px; background: #faf8f4; }
#employeeModal .modal-footer { padding: 16px 24px; border-top: 1px solid rgba(110,93,97,.2); background: #fff; }
#employeeModal .form-control, #employeeModal .form-select { border-radius: 8px; border-color: rgba(110,93,97,.3); }
#employeeModal .form-control:focus { border-color: #0b7c3d; box-shadow: 0 0 0 0.2rem rgba(11,124,61,.2); }
</style>

<!-- Stats cards at top -->
<div class="employee-section">
<div class="row mb-4 g-3">
    <div class="col-6 col-md-3">
        <div class="card emp-stat-card border-0 shadow-sm h-100">
            <div class="card-body py-3 px-4 d-flex align-items-center">
                <div class="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                    <i class="fas fa-users text-primary"></i>
                </div>
                <div>
                    <p class="text-muted small mb-0">Total</p>
                    <h5 class="mb-0 fw-bold" id="stat-total"><?= $totalEmployees ?? 0 ?></h5>
                </div>
            </div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="card emp-stat-card border-0 shadow-sm h-100">
            <div class="card-body py-3 px-4 d-flex align-items-center">
                <div class="bg-success bg-opacity-10 rounded-3 p-2 me-3">
                    <i class="fas fa-user-check text-success"></i>
                </div>
                <div>
                    <p class="text-muted small mb-0">Active</p>
                    <h5 class="mb-0 fw-bold" id="stat-active"><?= $totalActive ?? 0 ?></h5>
                </div>
            </div>
        </div>
    </div>
    <div class="col-6 col-md-3">
        <div class="card emp-stat-card border-0 shadow-sm h-100">
            <div class="card-body py-3 px-4 d-flex align-items-center">
                <div class="bg-info bg-opacity-10 rounded-3 p-2 me-3">
                    <i class="fas fa-rupee-sign text-info"></i>
                </div>
                <div>
                    <p class="text-muted small mb-0">Monthly Salary</p>
                    <h5 class="mb-0 fw-bold" id="stat-salary">₹<?= number_format($totalMonthlySalary ?? 0, 0) ?></h5>
                </div>
            </div>
        </div>
    </div>
    <div class="col-6 col-md-3 d-flex align-items-stretch">
        <button type="button" class="btn btn-theme-green btn-lg w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-3" id="addEmployeeBtn" data-bs-toggle="modal" data-bs-target="#employeeModal">
            <i class="fas fa-user-plus fa-lg"></i>
            <span>Add Employee</span>
        </button>
    </div>
</div>

<!-- Success/Error message toast -->
<div id="empToast" class="position-fixed top-0 end-0 p-3" style="z-index: 9999; margin-top: 60px;">
    <div class="toast align-items-center text-white border-0 shadow" role="alert" data-bs-autohide="true" data-bs-delay="3500">
        <div class="d-flex">
            <div class="toast-body py-3"></div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body p-0">
        <!-- Desktop Table View -->
        <div class="table-responsive d-none d-md-block" style="overflow: visible;">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th class="ps-4">ID</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Monthly Salary</th>
                        <th>Join Date</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th class="text-end pe-4">Actions</th>
                    </tr>
                </thead>
                <tbody id="employeeTableBody">
                    <?php if (empty($employees)): ?>
                        <tr>
                            <td colspan="8" class="text-center py-5 text-muted">
                                <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                                <p class="mb-0">No employees found. Add your first employee to get started.</p>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($employees as $employee): ?>
                            <tr>
                                <td class="ps-4"><?= $employee['id'] ?></td>
                                <td>
                                    <strong><?= esc($employee['name']) ?></strong>
                                    <?php if (in_array($employee['id'], $activeAdvances ?? [])): ?>
                                        <i class="fas fa-star text-warning ms-1" title="Active Advance"></i>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <i class="fas fa-phone text-muted me-2"></i>
                                    <?= !empty(trim((string)($employee['mobile'] ?? ''))) ? esc($employee['mobile']) : '—' ?>
                                </td>
                                <td>
                                    <span class="fw-bold text-success">₹<?= number_format($employee['monthly_salary'], 0) ?></span>
                                </td>
                                <td class="text-muted">
                                    <i class="fas fa-calendar-alt me-2"></i>
                                    <?= !empty($employee['join_date']) ? date('d/m/Y', strtotime($employee['join_date'])) : '—' ?>
                                </td>
                                <td>
                                    <span class="badge bg-<?= $employee['status'] === 'active' ? 'success' : 'secondary' ?> rounded-pill px-3 py-2">
                                        <i class="fas fa-circle me-1" style="font-size: 0.6em;"></i>
                                        <?= ucfirst($employee['status']) ?>
                                    </span>
                                </td>
                                <td class="text-muted">
                                    <i class="fas fa-calendar me-2"></i>
                                    <?= date('d/m/Y', strtotime($employee['created_at'])) ?>
                                </td>
                                <td class="text-end pe-4">
                                    <a href="<?= base_url('employee/profile/' . $employee['id']) ?>" class="btn btn-sm btn-theme-blue">
                                        <i class="fas fa-eye me-1"></i> View
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View -->
        <div class="d-md-none p-3" id="employeeMobileList">
            <?php if (empty($employees)): ?>
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                    <p class="mb-0">No employees found. Add your first employee to get started.</p>
                </div>
            <?php else: ?>
                <?php foreach ($employees as $employee): ?>
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h5 class="mb-1 fw-bold">
                                        <?= esc($employee['name']) ?>
                                        <?php if (in_array($employee['id'], $activeAdvances ?? [])): ?>
                                            <i class="fas fa-star text-warning ms-1" title="Active Advance"></i>
                                        <?php endif; ?>
                                    </h5>
                                    <small class="text-muted">ID: <?= $employee['id'] ?></small>
                                </div>
                                <span class="badge bg-<?= $employee['status'] === 'active' ? 'success' : 'secondary' ?> rounded-pill px-3 py-2">
                                    <i class="fas fa-circle me-1" style="font-size: 0.6em;"></i>
                                    <?= ucfirst($employee['status']) ?>
                                </span>
                            </div>
                            
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <small class="text-muted d-block">Mobile</small>
                                    <strong><i class="fas fa-phone text-muted me-1"></i><?= !empty(trim((string)($employee['mobile'] ?? ''))) ? esc($employee['mobile']) : '—' ?></strong>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Salary</small>
                                    <strong class="text-success">₹<?= number_format($employee['monthly_salary'], 0) ?></strong>
                                </div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <small class="text-muted d-block">Join Date</small>
                                    <strong><i class="fas fa-calendar-alt text-muted me-1"></i><?= !empty($employee['join_date']) ? date('d/m/Y', strtotime($employee['join_date'])) : '—' ?></strong>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Created</small>
                                    <strong class="text-muted"><?= date('d/m/Y', strtotime($employee['created_at'])) ?></strong>
                                </div>
                            </div>
                            
                            <a href="<?= base_url('employee/profile/' . $employee['id']) ?>" class="btn btn-theme-blue w-100">
                                <i class="fas fa-eye me-1"></i> View Profile
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>
</div>
<!-- /employee-section -->

<!-- Employee Create/Update Modal -->
<div class="modal fade" id="employeeModal" tabindex="-1" aria-labelledby="employeeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header border-0 pb-0">
                <h5 class="modal-title" id="employeeModalLabel">
                    <i class="fas fa-user-plus text-primary me-2"></i>
                    <span id="employeeModalTitle">Add Employee</span>
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="employeeModalForm" novalidate>
                    <?= csrf_field() ?>
                    <input type="hidden" id="employee_id" name="employee_id">

                    <div class="row">
                        <div class="col-12 col-md-6 mb-3">
                            <label for="modal_name" class="form-label fw-bold">
                                Employee Name <span class="text-danger">*</span>
                            </label>
                            <input type="text"
                                   class="form-control"
                                   id="modal_name"
                                   name="name"
                                   placeholder="Enter employee name">
                            <div class="invalid-feedback"></div>
                        </div>

                    <div class="row">
                        <div class="col-12 col-md-4 mb-3">
                            <label for="modal_mobile" class="form-label fw-bold">
                                Mobile Number <span class="text-danger">*</span>
                            </label>
                            <input type="tel"
                                   class="form-control"
                                   id="modal_mobile"
                                   name="mobile"
                                   placeholder="Enter mobile"
                                   maxlength="15"
                                   required>
                            <div class="invalid-feedback"></div>
                        </div>

                        <div class="col-12 col-md-4 mb-3">
                            <label for="modal_alternate_mobile" class="form-label fw-bold">
                                Alternate Mobile
                            </label>
                            <input type="tel"
                                   class="form-control"
                                   id="modal_alternate_mobile"
                                   name="alternate_mobile"
                                   placeholder="Optional"
                                   maxlength="15">
                            <div class="invalid-feedback"></div>
                        </div>

                        <div class="col-12 col-md-4 mb-3">
                            <label for="modal_father_name" class="form-label fw-bold">
                                Father's Name
                            </label>
                            <input type="text"
                                   class="form-control"
                                   id="modal_father_name"
                                   name="father_name"
                                   placeholder="Optional">
                            <div class="invalid-feedback"></div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12 mb-3">
                            <label for="modal_join_date" class="form-label fw-bold">
                                Join Date <span class="text-danger">*</span>
                            </label>
                            <input type="date"
                                   class="form-control"
                                   id="modal_join_date"
                                   name="join_date"
                                   value="<?= date('Y-m-d') ?>"
                                   required>
                            <div class="invalid-feedback"></div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12 col-md-6 mb-3">
                            <label for="modal_monthly_salary" class="form-label fw-bold">
                                Monthly Salary (₹) <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text bg-light">₹</span>
                                <input type="number"
                                       step="0.01"
                                       min="0"
                                       class="form-control"
                                       id="modal_monthly_salary"
                                       name="monthly_salary"
                                       placeholder="0.00">
                            </div>
                            <div class="invalid-feedback"></div>
                        </div>

                        <div class="col-12 col-md-6 mb-3">
                            <label for="modal_status" class="form-label fw-bold">
                                Status <span class="text-danger">*</span>
                            </label>
                            <select class="form-select" id="modal_status" name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <div class="invalid-feedback"></div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer border-0">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-theme-blue" id="saveEmployeeBtn">
                    <i class="fas fa-save me-1"></i>
                    <span id="saveEmployeeText">Save Employee</span>
                </button>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
$(document).ready(function() {
    const API_BASE = '<?= base_url('employee') ?>';
    let isEdit = false;
    let currentEmployeeId = null;

    function apiRequest(options) {
        return $.ajax({
            ...options,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            dataType: 'json'
        });
    }

    function getApiResponse(xhr) {
        try {
            if (xhr.responseJSON) return xhr.responseJSON;
            if (xhr.responseText) return JSON.parse(xhr.responseText);
        } catch (e) {}
        return { success: false, message: 'Invalid response from server.' };
    }

    function resetEmployeeForm() {
        $('#employeeModalForm')[0].reset();
        $('#employee_id').val('');
        $('#modal_join_date').val('<?= date('Y-m-d') ?>');
        $('#employeeModalForm').find('.is-invalid, .is-valid').removeClass('is-invalid is-valid');
        $('#employeeModalForm').find('.invalid-feedback').text('');
    }

    function validateField(field, value) {
        let isValid = true;
        let errorMessage = '';

        switch(field) {
            case 'name':
                if (!value || value.trim().length < 2) {
                    isValid = false;
                    errorMessage = 'Employee name must be at least 2 characters';
                } else if (value.length > 255) {
                    isValid = false;
                    errorMessage = 'Employee name cannot exceed 255 characters';
                }
                break;
            case 'mobile':
                if (value && value.trim() !== '') {
                    const mobileRegex = /^[0-9]{10,15}$/;
                    if (!mobileRegex.test(value.replace(/\D/g, ''))) {
                        isValid = false;
                        errorMessage = 'Mobile number must be 10-15 digits';
                    }
                }
                break;
            case 'monthly_salary':
                const salary = parseFloat(value);
                if (!value || isNaN(salary) || salary <= 0) {
                    isValid = false;
                    errorMessage = 'Monthly salary must be greater than 0';
                }
                break;
            case 'join_date':
                if (!value || value.trim() === '') {
                    isValid = false;
                    errorMessage = 'Join date is required';
                }
                break;
            case 'status':
                if (!value || (value !== 'active' && value !== 'inactive')) {
                    isValid = false;
                    errorMessage = 'Please select a valid status';
                }
                break;
        }

        const input = $('#modal_' + (field === 'monthly_salary' ? 'monthly_salary' : (field === 'join_date' ? 'join_date' : field)));
        const feedback = input.closest('.mb-3').find('.invalid-feedback');

        if (isValid) {
            input.removeClass('is-invalid').addClass('is-valid');
            feedback.text('');
        } else {
            input.removeClass('is-valid').addClass('is-invalid');
            feedback.text(errorMessage);
        }

        return isValid;
    }

    // Open create modal
    $('#addEmployeeBtn').on('click', function() {
        isEdit = false;
        currentEmployeeId = null;
        resetEmployeeForm();
        $('#modal_join_date').val('<?= date('Y-m-d') ?>');
        $('#employeeModalLabel i').removeClass('fa-user-edit').addClass('fa-user-plus');
        $('#employeeModalTitle').text('Add Employee');
        $('#saveEmployeeText').text('Save Employee');
    });

    // Real-time validation
    $('#modal_name').on('blur input', function() {
        validateField('name', $(this).val());
    });

    $('#modal_mobile').on('blur input', function() {
        let value = $(this).val().replace(/\D/g, '');
        $(this).val(value);
        validateField('mobile', value);
    });

    $('#modal_monthly_salary').on('blur input', function() {
        validateField('monthly_salary', $(this).val());
    });

    $('#modal_join_date').on('change blur', function() {
        validateField('join_date', $(this).val());
    });

    $('#modal_status').on('change', function() {
        validateField('status', $(this).val());
    });

    // Save (create/update) employee
    $('#saveEmployeeBtn').on('click', function() {
        const nameValid = validateField('name', $('#modal_name').val());
        const mobileValid = validateField('mobile', $('#modal_mobile').val());
        const salaryValid = validateField('monthly_salary', $('#modal_monthly_salary').val());
        const joinDateValid = validateField('join_date', $('#modal_join_date').val());
        const statusValid = validateField('status', $('#modal_status').val());

        if (!nameValid || !mobileValid || !salaryValid || !joinDateValid || !statusValid) {
            showToast('Please fix the highlighted fields before saving.', 'error');
            return;
        }

        const url = isEdit ? API_BASE + '/edit/' + currentEmployeeId : API_BASE + '/create';
        const btn = $(this);
        const originalHtml = btn.html();
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i> Saving...');

        const formData = {
            csrf_test_name: $('meta[name="csrf-token"]').attr('content'),
            name: $('#modal_name').val().trim(),
            mobile: $('#modal_mobile').val(),
            alternate_mobile: $('#modal_alternate_mobile').val(),
            father_name: $('#modal_father_name').val().trim(),
            monthly_salary: $('#modal_monthly_salary').val(),
            join_date: $('#modal_join_date').val(),
            status: $('#modal_status').val()
        };

        apiRequest({ url: url, type: 'POST', data: formData })
            .done(function(response) {
                if (response.success) {
                    $('#employeeModal').modal('hide');
                    resetEmployeeForm();
                    showToast(response.message, 'success');
                    refreshList();
                } else {
                    if (response.errors) {
                        $.each(response.errors, function(field, message) {
                            const id = (field === 'monthly_salary' ? 'monthly_salary' : (field === 'join_date' ? 'join_date' : field));
                            const input = $('#modal_' + id);
                            const feedback = input.closest('.mb-3').find('.invalid-feedback');
                            feedback.text(Array.isArray(message) ? message[0] : message);
                            input.addClass('is-invalid');
                        });
                    }
                    showToast(response.message || 'Please fix the validation errors.', 'error');
                    btn.prop('disabled', false).html(originalHtml);
                }
            })
            .fail(function(xhr) {
                var res = getApiResponse(xhr);
                if (res.errors) {
                    $.each(res.errors, function(field, message) {
                        const id = (field === 'monthly_salary' ? 'monthly_salary' : (field === 'join_date' ? 'join_date' : field));
                        const input = $('#modal_' + id);
                        const feedback = input.closest('.mb-3').find('.invalid-feedback');
                        feedback.text(Array.isArray(message) ? message[0] : message);
                        input.addClass('is-invalid');
                    });
                }
                showToast(res.message || 'Could not save employee. Please try again.', 'error');
                btn.prop('disabled', false).html(originalHtml);
            });
    });

    // Prevent form from submitting normally
    $('#employeeModalForm').on('submit', function(e) {
        e.preventDefault();
        $('#saveEmployeeBtn').trigger('click');
    });

    function showToast(message, type) {
        var bg = type === 'success' ? 'bg-success' : 'bg-danger';
        var icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        var $toast = $('#empToast .toast');
        $toast.removeClass('bg-success bg-danger').addClass(bg);
        $toast.find('.toast-body').html('<i class="fas fa-' + icon + ' me-2"></i>' + message);
        try {
            var toastEl = $toast[0];
            var toast = bootstrap.Toast.getOrCreateInstance(toastEl);
            toast.show();
        } catch (e) {
            $toast.toast('show');
        }
    }

    function refreshList() {
        apiRequest({ url: API_BASE + '/list', type: 'GET' })
            .done(function(res) {
                if (!res.success || !res.employees) return;
                var employees = res.employees;
                var activeAdvances = res.activeAdvances || [];

                // Update stats
                $('#stat-total').text(res.totalEmployees || 0);
                $('#stat-active').text(res.totalActive || 0);
                $('#stat-salary').text('₹' + Number(res.totalMonthlySalary || 0).toLocaleString('en-IN'));

                // Build table rows
                var baseUrl = '<?= base_url() ?>';
                if (employees.length === 0) {
                    $('#employeeTableBody').html('<tr><td colspan="8" class="text-center py-5 text-muted"><i class="fas fa-inbox fa-3x mb-3 d-block"></i><p class="mb-0">No employees found. Add your first employee to get started.</p></td></tr>');
                } else {
                    var html = '';
                    employees.forEach(function(e) {
                        var joinDate = e.join_date ? new Date(e.join_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '—';
                        var createdDate = e.created_at ? new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '—';
                        var star = (activeAdvances && activeAdvances.indexOf(parseInt(e.id, 10)) >= 0) ? ' <i class="fas fa-star text-warning ms-1" title="Active Advance"></i>' : '';
                        html += '<tr><td class="ps-4">' + e.id + '</td><td><strong>' + escapeHtml(e.name) + '</strong>' + star + '</td>';
                        html += '<td><i class="fas fa-phone text-muted me-2"></i>' + (e.mobile && String(e.mobile).trim() ? escapeHtml(e.mobile) : '—') + '</td>';
                        html += '<td><span class="fw-bold text-success">₹' + Math.round(parseFloat(e.monthly_salary || 0)).toLocaleString('en-IN') + '</span></td>';
                        html += '<td class="text-muted"><i class="fas fa-calendar-alt me-2"></i>' + joinDate + '</td>';
                        html += '<td><span class="badge bg-' + (e.status === 'active' ? 'success' : 'secondary') + ' rounded-pill px-3 py-2"><i class="fas fa-circle me-1" style="font-size:0.6em;"></i>' + (e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : '') + '</span></td>';
                        html += '<td class="text-muted"><i class="fas fa-calendar me-2"></i>' + createdDate + '</td>';
                        html += '<td class="text-end pe-4"><a href="' + baseUrl + 'employee/profile/' + e.id + '" class="btn btn-sm btn-theme-blue"><i class="fas fa-eye me-1"></i> View</a></td></tr>';
                    });
                    $('#employeeTableBody').html(html);
                }

                // Build mobile cards
                if (employees.length === 0) {
                    $('#employeeMobileList').html('<div class="text-center py-5 text-muted"><i class="fas fa-inbox fa-3x mb-3 d-block"></i><p class="mb-0">No employees found. Add your first employee to get started.</p></div>');
                } else {
                    var mHtml = '';
                    employees.forEach(function(e) {
                        var joinDate = e.join_date ? new Date(e.join_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '—';
                        var createdDate = e.created_at ? new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '—';
                        var star = (activeAdvances && activeAdvances.indexOf(parseInt(e.id, 10)) >= 0) ? ' <i class="fas fa-star text-warning ms-1" title="Active Advance"></i>' : '';
                        mHtml += '<div class="card mb-3 shadow-sm"><div class="card-body">';
                        mHtml += '<div class="d-flex justify-content-between align-items-start mb-2"><div><h5 class="mb-1 fw-bold">' + escapeHtml(e.name) + star + '</h5><small class="text-muted">ID: ' + e.id + '</small></div>';
                        mHtml += '<span class="badge bg-' + (e.status === 'active' ? 'success' : 'secondary') + ' rounded-pill px-3 py-2"><i class="fas fa-circle me-1" style="font-size:0.6em;"></i>' + (e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : '') + '</span></div>';
                        mHtml += '<div class="row g-2 mb-3"><div class="col-6"><small class="text-muted d-block">Mobile</small><strong><i class="fas fa-phone text-muted me-1"></i>' + (e.mobile && String(e.mobile).trim() ? escapeHtml(e.mobile) : '—') + '</strong></div>';
                        mHtml += '<div class="col-6"><small class="text-muted d-block">Salary</small><strong class="text-success">₹' + Math.round(parseFloat(e.monthly_salary || 0)).toLocaleString('en-IN') + '</strong></div></div>';
                        mHtml += '<div class="row g-2 mb-3"><div class="col-6"><small class="text-muted d-block">Join Date</small><strong><i class="fas fa-calendar-alt text-muted me-1"></i>' + joinDate + '</strong></div>';
                        mHtml += '<div class="col-6"><small class="text-muted d-block">Created</small><strong class="text-muted">' + createdDate + '</strong></div></div>';
                        mHtml += '<a href="' + baseUrl + 'employee/profile/' + e.id + '" class="btn btn-theme-blue w-100"><i class="fas fa-eye me-1"></i> View Profile</a></div></div>';
                    });
                    $('#employeeMobileList').html(mHtml);
                }
            })
            .fail(function() {
                showToast('Could not refresh list. Please reload the page.', 'error');
            });
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
</script>
<?= $this->endSection() ?>
