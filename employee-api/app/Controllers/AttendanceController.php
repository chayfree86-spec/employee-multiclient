<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\AttendanceModel;

class AttendanceController extends BaseApiController
{
    /**
     * Get attendance list
     */
    public function index()
    {
        $model = new AttendanceModel();

        $employee_id = $this->request->getGet('employee_id');
        $month = $this->request->getGet('month') ?? date('m');
        $year = $this->request->getGet('year') ?? date('Y');
        $scope = $this->request->getGet('scope');

        if ($employee_id) {
            $employeeModel = new \EmployeeApi\Models\EmployeeModel();
            $employee = $employeeModel->find($employee_id);
            $joinDate = $employee['join_date'] ?? null;

            $data = [
                'list' => $model->getMonthlyAttendanceEnriched($employee_id, (int)$month, (int)$year, $joinDate),
                'summary' => $model->getAttendanceSummaryEnriched($employee_id, (int)$month, (int)$year, null, $joinDate)
            ];
            return $this->respondSuccess($data, "Monthly attendance retrieved");
        }

        if ($scope === 'month') {
            $employeeModel = new \EmployeeApi\Models\EmployeeModel();
            $employees = $employeeModel->select('id, join_date')->findAll();

            $data = [
                'list' => $model->getMonthlyAttendanceSnapshot($employees, (int) $month, (int) $year)
            ];
            return $this->respondSuccess($data, "Monthly attendance snapshot retrieved");
        }

        $date = $this->request->getGet('date') ?? date('Y-m-d');
        $attendance = $model->where('date', $date)->findAll();
        return $this->respondSuccess($attendance, "Attendance for $date retrieved");
    }

    /**
     * Mark/Update attendance
     */
    public function create()
    {
        $model = new AttendanceModel();
        $data = $this->request->getJSON(true);

        if (empty($data['employee_id']) || empty($data['date'])) {
            return $this->respondError('Employee ID and Date are required');
        }

        $existing = $model->where([
            'employee_id' => $data['employee_id'],
            'date'        => $data['date']
        ])->first();

        if ($existing) {
            $model->update($existing['id'], $data);
            return $this->respondSuccess($data, 'Attendance updated');
        }

        if ($model->insert($data)) {
            return $this->respondSuccess($data, 'Attendance marked', 201);
        }

        return $this->respondError('Failed to mark attendance', 400, $model->errors());
    }

    /**
     * Bulk mark/update attendance
     */
    public function bulkCreate()
    {
        $model = new AttendanceModel();
        $payload = $this->request->getJSON(true);
        $records = $payload['records'] ?? [];

        if (!is_array($records) || empty($records)) {
            return $this->respondError('Attendance records are required');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        foreach ($records as $record) {
            if (empty($record['employee_id']) || empty($record['date'])) {
                $db->transRollback();
                return $this->respondError('Employee ID and Date are required for each record');
            }

            $existing = $model->where([
                'employee_id' => $record['employee_id'],
                'date'        => $record['date']
            ])->first();

            if ($existing) {
                if (!$model->update($existing['id'], $record)) {
                    $db->transRollback();
                    return $this->respondError('Failed to update attendance', 400, $model->errors());
                }
                continue;
            }

            if (!$model->insert($record)) {
                $db->transRollback();
                return $this->respondError('Failed to mark attendance', 400, $model->errors());
            }
        }

        $db->transComplete();

        if (!$db->transStatus()) {
            return $this->respondError('Failed to save attendance records', 400);
        }

        return $this->respondSuccess([
            'saved' => count($records)
        ], 'Attendance saved');
    }
}
