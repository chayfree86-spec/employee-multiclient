<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\SuperadminModel;
use EmployeeApi\Models\UserModel;

class SuperadminController extends BaseApiController
{
    public function login()
    {
        $json = $this->request->getJSON(true) ?? [];
        $mobile = trim((string) ($json['mobile'] ?? $this->request->getPost('mobile') ?? ''));
        $password = (string) ($json['password'] ?? $this->request->getPost('password') ?? '');

        if ($mobile === '' || $password === '') {
            return $this->respondError('Mobile and password are required', 400);
        }

        $model = new SuperadminModel();
        $admin = $model->where('mobile', $mobile)->first();

        if (!$admin || !password_verify($password, $admin['password'])) {
            return $this->respondError('Invalid credentials', 401);
        }

        if (($admin['status'] ?? '') !== 'active') {
            return $this->respondError('Superadmin is inactive', 403);
        }

        unset($admin['password']);

        return $this->respondSuccess([
            'superadmin' => $admin,
            'token' => $this->makeAuthToken('superadmin', (int) $admin['id'], $admin['mobile']),
        ], 'Superadmin login successful');
    }

    public function users()
    {
        $superadminId = $this->requireSuperadminId();
        if (!is_int($superadminId)) {
            return $superadminId;
        }

        $this->deactivateExpiredUsers();

        $users = (new UserModel())
            ->select('users.id, users.username, users.mobile, users.email, users.role, users.status, users.owner_name, users.business_name, users.address, users.created_at, COUNT(employees.id) AS employee_count')
            ->join('employees', 'employees.user_id = users.id', 'left')
            ->groupBy('users.id')
            ->orderBy('users.id', 'ASC')
            ->findAll();

        return $this->respondSuccess($users, 'Users retrieved');
    }

    public function createUser()
    {
        $superadminId = $this->requireSuperadminId();
        if (!is_int($superadminId)) {
            return $superadminId;
        }

        $data = $this->request->getJSON(true) ?? [];
        $payload = $this->normalizeUserPayload($data, true);

        $model = new UserModel();
        if ($this->userExists($model, $payload['mobile'], $payload['email'] ?? null, $payload['username'] ?? null)) {
            return $this->respondError('User already exists with same mobile, email, or username', 409);
        }

        $payload['password'] = password_hash((string) $payload['password'], PASSWORD_DEFAULT);
        $payload['role'] = $payload['role'] ?? 'admin';
        $payload['status'] = $payload['status'] ?? 'active';

        if (!$model->insert($payload)) {
            return $this->respondError('Failed to create user', 400, $model->errors());
        }

        $id = (int) $model->getInsertID();
        $this->seedSettingsForUser($id);
        $user = $model->find($id);
        unset($user['password']);

        return $this->respondSuccess($user, 'User created', 201);
    }

    public function updateUser($id = null)
    {
        $superadminId = $this->requireSuperadminId();
        if (!is_int($superadminId)) {
            return $superadminId;
        }

        $id = (int) $id;
        $model = new UserModel();
        if (!$model->find($id)) {
            return $this->respondError('User not found', 404);
        }

        $data = $this->request->getJSON(true) ?? [];
        $payload = $this->normalizeUserPayload($data, false);
        if (isset($payload['password'])) {
            $payload['password'] = password_hash((string) $payload['password'], PASSWORD_DEFAULT);
        }

        if ($payload === []) {
            return $this->respondError('No valid user fields provided', 400);
        }

        $duplicate = \Config\Database::connect()
            ->table('users')
            ->where('id !=', $id)
            ->groupStart()
            ->where('mobile', $payload['mobile'] ?? '__never__')
            ->orWhere('email', $payload['email'] ?? '__never__')
            ->orWhere('username', $payload['username'] ?? '__never__')
            ->groupEnd()
            ->get()
            ->getRowArray();

        if ($duplicate) {
            return $this->respondError('Another user already exists with same mobile, email, or username', 409);
        }

        $payload['updated_at'] = date('Y-m-d H:i:s');
        if (!\Config\Database::connect()->table('users')->where('id', $id)->update($payload)) {
            return $this->respondError('Failed to update user', 400);
        }

        $user = $model->find($id);
        unset($user['password']);
        return $this->respondSuccess($user, 'User updated');
    }

    public function deleteUser($id = null)
    {
        $superadminId = $this->requireSuperadminId();
        if (!is_int($superadminId)) {
            return $superadminId;
        }

        $id = (int) $id;
        if ($id === 1) {
            return $this->respondError('Default user cannot be deleted', 400);
        }

        $model = new UserModel();
        if (!$model->find($id)) {
            return $this->respondError('User not found', 404);
        }

        \Config\Database::connect()->table('settings')->where('user_id', $id)->delete();
        $model->delete($id);
        return $this->respondSuccess(null, 'User deleted');
    }

    private function normalizeUserPayload(array $data, bool $requirePassword): array
    {
        $payload = [];
        foreach (['username', 'mobile', 'email', 'owner_name', 'business_name', 'address', 'role', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = trim((string) $data[$field]);
            }
        }

        if (array_key_exists('created_at', $data)) {
            $createdAt = $this->normalizeCreatedAt((string) $data['created_at']);
            if ($createdAt !== null) {
                $payload['created_at'] = $createdAt;
            }
        }

        if (!empty($data['password'])) {
            $payload['password'] = (string) $data['password'];
        }

        if (empty($payload['username']) && !empty($payload['mobile'])) {
            $payload['username'] = $payload['mobile'];
        }
        if (empty($payload['email']) && !empty($payload['mobile'])) {
            $payload['email'] = $payload['mobile'] . '@local.user';
        }
        if ($requirePassword && empty($payload['password'])) {
            $payload['password'] = '123456';
        }

        return $this->filterBlankValues($payload);
    }

    private function normalizeCreatedAt(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        try {
            $date = new \DateTimeImmutable($value);
            return $date->format('Y-m-d 00:00:00');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function deactivateExpiredUsers(): void
    {
        \Config\Database::connect()
            ->table('users')
            ->where('status', 'active')
            ->where('created_at IS NOT NULL', null, false)
            ->where('created_at <=', date('Y-m-d H:i:s', strtotime('-365 days')))
            ->update([
                'status' => 'inactive',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
    }

    private function userExists(UserModel $model, string $mobile, ?string $email, ?string $username): bool
    {
        return (bool) $model->groupStart()
            ->where('mobile', $mobile)
            ->orWhere('email', $email)
            ->orWhere('username', $username)
            ->groupEnd()
            ->first();
    }

    private function seedSettingsForUser(int $userId): void
    {
        $db = \Config\Database::connect();
        $rows = $db->table('settings')->where('user_id', 1)->get()->getResultArray();
        foreach ($rows as $row) {
            unset($row['id']);
            $row['user_id'] = $userId;
            $row['created_at'] = date('Y-m-d H:i:s');
            $row['updated_at'] = date('Y-m-d H:i:s');
            $db->table('settings')->ignore(true)->insert($row);
        }
    }
}
