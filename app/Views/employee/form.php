<?= $this->extend('layout') ?>

<?= $this->section('content') ?>

<div class="row justify-content-center">
    <div class="col-12 col-md-10 col-lg-8">
        <div class="card shadow-sm border-0" style="border: 1px solid rgba(110,93,97,0.2) !important; border-radius: 12px;">
            <div class="card-header text-white border-0" style="background: linear-gradient(135deg, #0b7c3d 0%, #065a2d 100%); border-radius: 12px 12px 0 0;">
                <h4 class="mb-0">
                    <i class="fas fa-user-<?= isset($employee) ? 'edit' : 'plus' ?>"></i>
                    <?= isset($employee) ? 'Edit Employee' : 'Add New Employee' ?>
                </h4>
            </div>
            <div class="card-body p-4" style="background: #faf8f4;">
                <!-- Server-side error/success (when form is re-displayed after POST) -->
                <?php if (!empty($error)): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i><?= esc($error) ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>

                <?php if (isset($validation) && $validation->getErrors()): ?>
                    <div class="alert alert-warning alert-dismissible fade show" role="alert">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Please fix the following errors:</strong>
                        <ul class="mb-0 mt-2">
                            <?php foreach ($validation->getErrors() as $field => $message): ?>
                                <li><?= esc($message) ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>

                <!-- AJAX feedback alert (hidden by default) -->
                <div id="formAlert" class="alert d-none" role="alert"></div>

                <form id="employeeForm" novalidate>
                    <?= csrf_field() ?>
                    
                    <div class="row">
                        <div class="col-12 col-md-6 mb-3">
                            <label for="name" class="form-label fw-bold">
                                Employee Name <span class="text-danger">*</span>
                            </label>
                            <input type="text" 
                                   class="form-control form-control-lg <?= isset($validation) && $validation->hasError('name') ? 'is-invalid' : '' ?>" 
                                   id="name" 
                                   name="name" 
                                   value="<?= old('name', $employee['name'] ?? '') ?>"
                                   placeholder="Enter employee name">
                            <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('name') ? esc($validation->getError('name')) : '' ?></div>
                            <small class="form-text text-muted">Minimum 2 characters required</small>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 col-md-4 mb-3">
                            <label for="mobile" class="form-label fw-bold">
                                Mobile Number <span class="text-danger">*</span>
                            </label>
                            <input type="tel" 
                                   class="form-control form-control-lg <?= isset($validation) && $validation->hasError('mobile') ? 'is-invalid' : '' ?>" 
                                   id="mobile" 
                                   name="mobile" 
                                   value="<?= old('mobile', $employee['mobile'] ?? '') ?>"
                                   placeholder="Enter mobile"
                                   maxlength="15"
                                   required>
                            <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('mobile') ? esc($validation->getError('mobile')) : '' ?></div>
                        </div>

                        <div class="col-12 col-md-4 mb-3">
                            <label for="alternate_mobile" class="form-label fw-bold">
                                Alternate Mobile
                            </label>
                            <input type="tel" 
                                   class="form-control form-control-lg <?= isset($validation) && $validation->hasError('alternate_mobile') ? 'is-invalid' : '' ?>" 
                                   id="alternate_mobile" 
                                   name="alternate_mobile" 
                                   value="<?= old('alternate_mobile', $employee['alternate_mobile'] ?? '') ?>"
                                   placeholder="Optional"
                                   maxlength="15">
                            <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('alternate_mobile') ? esc($validation->getError('alternate_mobile')) : '' ?></div>
                        </div>

                        <div class="col-12 col-md-4 mb-3">
                            <label for="father_name" class="form-label fw-bold">
                                Father's Name
                            </label>
                            <input type="text" 
                                   class="form-control form-control-lg <?= isset($validation) && $validation->hasError('father_name') ? 'is-invalid' : '' ?>" 
                                   id="father_name" 
                                   name="father_name" 
                                   value="<?= old('father_name', $employee['father_name'] ?? '') ?>"
                                   placeholder="Optional">
                            <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('father_name') ? esc($validation->getError('father_name')) : '' ?></div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12 col-md-6 mb-3">
                            <label for="monthly_salary" class="form-label fw-bold">
                                Monthly Salary (₹) <span class="text-danger">*</span>
                            </label>
                            <div class="input-group <?= isset($validation) && $validation->hasError('monthly_salary') ? 'is-invalid' : '' ?>">
                                <span class="input-group-text bg-light">₹</span>
                                <input type="number" 
                                       step="0.01" 
                                       min="0"
                                       class="form-control form-control-lg <?= isset($validation) && $validation->hasError('monthly_salary') ? 'is-invalid' : '' ?>" 
                                       id="monthly_salary" 
                                       name="monthly_salary" 
                                       value="<?= old('monthly_salary', $employee['monthly_salary'] ?? '') ?>"
                                       placeholder="0.00">
                                <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('monthly_salary') ? esc($validation->getError('monthly_salary')) : '' ?></div>
                            </div>
                            <small class="form-text text-muted">Must be greater than 0</small>
                        </div>

                        <div class="col-12 col-md-6 mb-3">
                            <label for="join_date" class="form-label fw-bold">
                                Join Date <span class="text-danger">*</span>
                            </label>
                            <input type="date"
                                   class="form-control form-control-lg <?= isset($validation) && $validation->hasError('join_date') ? 'is-invalid' : '' ?>"
                                   id="join_date"
                                   name="join_date"
                                   value="<?= old('join_date', $employee['join_date'] ?? date('Y-m-d')) ?>"
                                   required>
                            <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('join_date') ? esc($validation->getError('join_date')) : '' ?></div>
                        </div>

                        <div class="col-12 col-md-6 mb-3">
                            <label for="status" class="form-label fw-bold">
                                Status <span class="text-danger">*</span>
                            </label>
                            <select class="form-select form-select-lg <?= isset($validation) && $validation->hasError('status') ? 'is-invalid' : '' ?>" id="status" name="status">
                                <option value="active" <?= old('status', $employee['status'] ?? 'active') === 'active' ? 'selected' : '' ?>>Active</option>
                                <option value="inactive" <?= old('status', $employee['status'] ?? '') === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                            </select>
                            <div class="invalid-feedback"><?= isset($validation) && $validation->hasError('status') ? esc($validation->getError('status')) : '' ?></div>
                        </div>
                    </div>

                    <div class="d-flex flex-column flex-sm-row gap-2 mt-4">
                        <button type="submit" class="btn btn-primary btn-lg flex-fill" id="submitBtn">
                            <i class="fas fa-spinner fa-spin d-none" id="submitSpinner"></i>
                            <i class="fas fa-save" id="submitIcon"></i> 
                            <span id="submitText"><?= isset($employee) ? 'Update' : 'Save' ?> Employee</span>
                        </button>
                        <a href="<?= base_url('employee') ?>" class="btn btn-outline-secondary btn-lg">
                            <i class="fas fa-arrow-left"></i> Back to List
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script>
$(document).ready(function() {
    const API_BASE = '<?= base_url('employee') ?>';
    const form = $('#employeeForm');
    const isEdit = <?= isset($employee) ? 'true' : 'false' ?>;
    const employeeId = <?= isset($employee) ? (int)$employee['id'] : 'null' ?>;
    const formUrl = isEdit ? (API_BASE + '/edit/' + employeeId) : (API_BASE + '/create');

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

    // Real-time validation
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
                    if (!mobileRegex.test(String(value).replace(/\D/g, ''))) {
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
            
            case 'status':
                if (!value || (value !== 'active' && value !== 'inactive')) {
                    isValid = false;
                    errorMessage = 'Please select a valid status';
                }
                break;
        }

        const input = $(`#${field}`);
        const feedback = input.siblings('.invalid-feedback');

        if (isValid) {
            input.removeClass('is-invalid').addClass('is-valid');
            feedback.text('');
        } else {
            input.removeClass('is-valid').addClass('is-invalid');
            feedback.text(errorMessage);
        }

        return isValid;
    }

    // Real-time field validation
    $('#name').on('blur input', function() {
        validateField('name', $(this).val());
    });

    $('#mobile').on('blur input', function() {
        let value = $(this).val().replace(/\D/g, ''); // Remove non-digits
        $(this).val(value);
        validateField('mobile', value);
    });

    $('#monthly_salary').on('blur input', function() {
        validateField('monthly_salary', $(this).val());
    });

    $('#status').on('change', function() {
        validateField('status', $(this).val());
    });

    // Form submission
    form.on('submit', function(e) {
        e.preventDefault();
        
        // Remove previous validation classes
        form.find('.is-invalid, .is-valid').removeClass('is-invalid is-valid');
        $('#formAlert').addClass('d-none').removeClass('alert-success alert-danger');

        // Validate all fields
        const nameValid = validateField('name', $('#name').val());
        const mobileValid = validateField('mobile', $('#mobile').val());
        const salaryValid = validateField('monthly_salary', $('#monthly_salary').val());
        const statusValid = validateField('status', $('#status').val());

        if (!nameValid || !mobileValid || !salaryValid || !statusValid) {
            showAlert('Please fix the validation errors before submitting.', 'danger');
            // Scroll to first error
            const firstError = form.find('.is-invalid').first();
            if (firstError.length) {
                $('html, body').animate({
                    scrollTop: firstError.offset().top - 100
                }, 500);
            }
            return;
        }

        // Disable submit button and show loading
        const submitBtn = $('#submitBtn');
        const submitSpinner = $('#submitSpinner');
        const submitIcon = $('#submitIcon');
        const submitText = $('#submitText');
        
        submitBtn.prop('disabled', true);
        submitSpinner.removeClass('d-none');
        submitIcon.addClass('d-none');
        submitText.text('Processing...');

        // Prepare form data
        const formData = {
            csrf_test_name: $('meta[name="csrf-token"]').attr('content'),
            name: $('#name').val().trim(),
            mobile: $('#mobile').val(),
            alternate_mobile: $('#alternate_mobile').val(),
            father_name: $('#father_name').val().trim(),
            monthly_salary: $('#monthly_salary').val(),
            status: $('#status').val(),
            join_date: $('#join_date').val()
        };

        // AJAX API call
        apiRequest({ url: formUrl, type: 'POST', data: formData })
            .done(function(response) {
                if (response.success) {
                    showAlert(response.message, 'success');
                    setTimeout(function() {
                        window.location.href = API_BASE;
                    }, 1500);
                } else {
                    handleValidationErrors(response.errors || {});
                    showAlert(response.message || 'Please fix the errors below.', 'danger');
                    submitBtn.prop('disabled', false);
                    submitSpinner.addClass('d-none');
                    submitIcon.removeClass('d-none');
                    submitText.text(isEdit ? 'Update Employee' : 'Save Employee');
                }
            })
            .fail(function(xhr) {
                var res = getApiResponse(xhr);
                if (res.errors) {
                    handleValidationErrors(res.errors);
                }
                showAlert(res.message || 'An error occurred while saving the employee.', 'danger');
                submitBtn.prop('disabled', false);
                submitSpinner.addClass('d-none');
                submitIcon.removeClass('d-none');
                submitText.text(isEdit ? 'Update Employee' : 'Save Employee');
            });
    });

    function handleValidationErrors(errors) {
        $.each(errors, function(field, message) {
            const input = $(`#${field}`);
            const feedback = input.siblings('.invalid-feedback');
            
            input.addClass('is-invalid').removeClass('is-valid');
            feedback.text(Array.isArray(message) ? message[0] : message);
        });
    }

    function showAlert(message, type) {
        const alert = $('#formAlert');
        alert.removeClass('d-none alert-success alert-danger')
             .addClass(`alert-${type}`)
             .html(`<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`);
        
        // Scroll to alert
        $('html, body').animate({
            scrollTop: alert.offset().top - 100
        }, 500);
    }
});
</script>
<?= $this->endSection() ?>
