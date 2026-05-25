<?php
// Load CodeIgniter bootstrapper
require_once 'vendor/autoload.php';
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR);
chdir(__DIR__);
require 'system/Test/Bootstrap.php';

$attendanceModel = new \App\Models\AttendanceModel();
$employeeId = 3;
$month = 2;
$year = 2026;
$employeeModel = new \App\Models\EmployeeModel();
$employee = $employeeModel->find($employeeId);
$joinDate = $employee['join_date'] ?? null;

echo "Syncing for Ajay (ID 3) for Feb 2026...\n";
$attendanceModel->syncWeekendRuleForMonth($employeeId, $month, $year, $joinDate);
echo "Checking results...\n";
$stmt = $attendanceModel->where('employee_id', 3)->where('date', '2026-02-24')->first();
if ($stmt) {
    echo "FAILED: Record for 2026-02-24 still exists! Source: " . ($stmt['source'] ?? 'unknown') . "\n";
} else {
    echo "SUCCESS: Record for 2026-02-24 is gone.\n";
}
