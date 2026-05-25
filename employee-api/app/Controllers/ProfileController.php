<?php

namespace EmployeeApi\Controllers;

use EmployeeApi\Models\UserModel;

class ProfileController extends BaseApiController
{
    /**
     * Get current logged in user profile
     */
    public function index()
    {
        $model = new UserModel();
        $userId = $this->request->getGet('id'); // In production, get from JWT token
        $username = $this->request->getGet('username');

        if ($userId) {
            $user = $model->find($userId);
        } elseif ($username) {
            $user = $model->where('username', $username)->first();
        } else {
            return $this->respondError('User ID or username required');
        }

        if (!$user) return $this->respondError('User not found', 404);

        unset($user['password']);
        return $this->respondSuccess($user, 'Profile retrieved');
    }

    /**
     * Update profile info (username, email)
     */
    public function update($id = null)
    {
        $model = new UserModel();
        $data = $this->request->getJSON(true);

        if (empty($data)) return $this->respondError('No data provided');

        // Remove blank values so they don't overwrite existing data
        $data = $this->filterBlankValues($data);

        if (empty($data)) return $this->respondError('No valid data provided');

        if ($model->update($id, $data)) {
            return $this->respondSuccess($data, 'Profile updated successfully');
        }

        return $this->respondError('Update failed', 400, $model->errors());
    }

    /**
     * Change user password
     */
    public function changePassword()
    {
        $model = new UserModel();
        $json = $this->request->getJSON();
        
        $username = $json->username ?? null;
        $currentPass = $json->current_password ?? null;
        $newPass = $json->new_password ?? null;

        if (!$username || !$newPass) {
            return $this->respondError('Missing username or new password');
        }

        // Find user
        $user = $model->where('username', $username)->first();
        if (!$user) {
            return $this->respondError('User not found');
        }

        // Verify current password if provided
        if ($currentPass) {
            if (!password_verify((string)$currentPass, $user['password'])) {
                return $this->respondError('Current password is incorrect');
            }
        }

        $hash = password_hash((string)$newPass, PASSWORD_DEFAULT);
        
        if ($model->builder()->where('id', $user['id'])->update(['password' => $hash])) {
            return $this->respondSuccess(null, 'Password changed successfully');
        }

        return $this->respondError('Failed to change password');
    }

    /**
     * Upload profile image
     */
    public function uploadImage()
    {
        $userId = $this->request->getPost('id');
        if (!$userId) return $this->respondError('User ID required');

        $img = $this->request->getFile('profile_image');

        if (!$img || !$img->isValid()) {
            return $this->respondError('Invalid image file', 400);
        }

        $newName = $img->getRandomName();
        // Path relative to web root (FCPATH = where index.php is)
        $uploadPath = FCPATH . 'uploads/profile';
        
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }

        if ($img->move($uploadPath, $newName)) {
            $model = new UserModel();
            // Save only relative path in DB
            $relativePath = '/uploads/profile/' . $newName;
            
            if ($model->update($userId, ['profile_image' => $relativePath])) {
                return $this->respondSuccess(['profile_image' => $relativePath], 'Image uploaded successfully');
            }
        }

        return $this->respondError('Upload failed');
    }
}
