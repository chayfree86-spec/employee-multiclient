<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\UserModel;

class AuthController extends BaseApiController
{
    /**
     * API Login
     */
    public function login()
    {
        $json = $this->request->getJSON();
        $username = trim((string) ($json->username ?? $json->mobile ?? $this->request->getPost('username') ?? $this->request->getPost('mobile') ?? ''));
        $password = $json->password ?? $this->request->getPost('password');

        if (empty($username) || empty($password)) {
            return $this->respondError('Mobile and password are required');
        }

        $model = new UserModel();
        $user = $model->groupStart()
            ->where('mobile', $username)
            ->orWhere('username', $username)
            ->orWhere('email', $username)
            ->orWhere('business_name', $username)
            ->groupEnd()
            ->first();

        if (!$user || !$this->passwordMatches((string) $password, (string) ($user['password'] ?? ''))) {
            return $this->respondError('Invalid login details. Please check username/mobile/email and password.', 401);
        }

        if (password_get_info((string) $user['password'])['algo'] === 0) {
            $model->builder()->where('id', $user['id'])->update([
                'password' => password_hash((string) $password, PASSWORD_DEFAULT),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        if (!empty($user['created_at']) && strtotime((string) $user['created_at']) <= strtotime('-365 days')) {
            $model->update($user['id'], ['status' => 'inactive']);
            return $this->respondError('Account has expired after 365 days', 403);
        }

        if (($user['status'] ?? '') !== 'active') {
            return $this->respondError('Account is inactive', 403);
        }

        // Remove password from response
        unset($user['password']);

        return $this->respondSuccess([
            'user' => $user,
            'token' => $this->makeAuthToken('user', (int) $user['id'], $user['username'] ?? $user['mobile'])
        ], 'Login successful');
    }

    /**
     * API Logout
     */
    public function logout()
    {
        // For API, logout is usually handled client-side by deleting the token.
        return $this->respondSuccess(null, 'Logged out successfully');
    }

    private function passwordMatches(string $inputPassword, string $storedPassword): bool
    {
        if ($storedPassword === '') {
            return false;
        }

        if (password_get_info($storedPassword)['algo'] !== 0) {
            return password_verify($inputPassword, $storedPassword);
        }

        return hash_equals($storedPassword, $inputPassword);
    }

    public function forgotPassword()
    {
        $json = $this->request->getJSON();
        $email = $json->email ?? $this->request->getPost('email');

        if (empty($email)) {
            return $this->respondError('Email is required');
        }

        $model = new UserModel();
        $user = $model->where('email', $email)->first();

        if (!$user) {
            return $this->respondError('No internal account found for this email address.', 404);
        }

        // Functional Demo: Update password to a default one
        // In a real app, you would send an email with a unique token link.
        $tempPassword = '123456';
        $model->update($user['id'], [
            'password' => password_hash($tempPassword, PASSWORD_DEFAULT)
        ]);

        return $this->respondSuccess([
            'status' => true,
            'message' => "A temporary password ($tempPassword) has been set for your account. Please login using this and change it immediately."
        ]);
    }
}
