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
        $username = $json->username ?? $this->request->getPost('username');
        $password = $json->password ?? $this->request->getPost('password');

        if (empty($username) || empty($password)) {
            return $this->respondError('Username and password are required');
        }

        $model = new UserModel();
        $user = $model->where('username', $username)->first();

        if (!$user || !password_verify((string)$password, $user['password'])) {
            return $this->respondError('Invalid credentials', 401);
        }

        // Remove password from response
        unset($user['password']);

        return $this->respondSuccess([
            'user' => $user,
            'token' => base64_encode($user['username'] . ':' . time()) // Placeholder token
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
