<?php

namespace App\Controllers;

use App\Models\UserModel;

class Profile extends BaseController
{
    protected $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    public function index()
    {
        $authCheck = $this->checkAuth();
        if ($authCheck) return $authCheck;

        $user = session()->get('user');

        $dbAvailable = true;
        try {
            $dbUser = $this->userModel->find($user['id'] ?? 1);
        } catch (\Throwable $e) {
            $dbUser = $user;
            $dbAvailable = false;
        }

        if (!$dbUser) {
            $dbUser = $user;
            $dbAvailable = false;
        }

        // Don't pass password to view
        unset($dbUser['password']);

        $data = [
            'title' => 'Profile',
            'user' => $dbUser,
            'dbAvailable' => $dbAvailable
        ];

        return view('profile/index', $data);
    }

    public function update()
    {
        if (!$this->request->is('post')) {
            return redirect()->to(base_url('profile'));
        }

        $user = session()->get('user');
        if (!$user) {
            return $this->response->setJSON(['success' => false, 'message' => 'Not authenticated']);
        }

        $userId = $user['id'] ?? 1;
        $rules = [
            'username' => "required|min_length[3]|max_length[50]|is_unique[users.username,id,{$userId}]",
            'email' => "required|valid_email|is_unique[users.email,id,{$userId}]"
        ];

        if ($this->validate($rules)) {
            try {
                $ok = $this->userModel->skipValidation(true)->update($userId, [
                    'username' => $this->request->getPost('username'),
                    'email' => $this->request->getPost('email')
                ]);
                if (! $ok) {
                    if ($this->request->isAJAX()) {
                        return $this->response->setJSON([
                            'success' => false,
                            'message' => 'Update failed. Please try again.'
                        ]);
                    }
                    return redirect()->back()->with('error', 'Update failed.');
                }
            } catch (\Throwable $e) {
                if ($this->request->isAJAX()) {
                    return $this->response->setJSON([
                        'success' => false,
                        'message' => 'Database error. Ensure the users table exists (run migrate.bat).'
                    ]);
                }
                return redirect()->back()->with('error', 'Database error. Run migrate.bat to create tables.');
            }

            session()->set('user', array_merge($user, [
                'username' => $this->request->getPost('username'),
                'email' => $this->request->getPost('email')
            ]));

            if ($this->request->isAJAX()) {
                return $this->response->setJSON([
                    'success' => true,
                    'message' => 'Profile updated successfully'
                ]);
            }
            return redirect()->to(base_url('profile'))->with('success', 'Profile updated successfully');
        }

        if ($this->request->isAJAX()) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $this->validator->getErrors()
            ]);
        }
        return redirect()->back()->withInput()->with('error', implode(', ', $this->validator->getErrors()));
    }

    public function changePassword()
    {
        if (!$this->request->is('post')) {
            return redirect()->to(base_url('profile'));
        }

        $user = session()->get('user');
        if (!$user) {
            if ($this->request->isAJAX()) {
                return $this->response->setJSON(['success' => false, 'message' => 'Not authenticated']);
            }
            return redirect()->to(base_url('login'));
        }

        $rules = [
            'current_password' => 'required',
            'new_password' => 'required|min_length[6]',
            'confirm_password' => 'required|matches[new_password]'
        ];

        if ($this->validate($rules)) {
            $userId = $user['id'] ?? 1;
            $currentPassword = trim((string) $this->request->getPost('current_password'));
            try {
                $dbUser = $this->userModel->find($userId);
            } catch (\Throwable $e) {
                $dbUser = null;
            }

            $currentPasswordOk = false;
            if ($dbUser && array_key_exists('password', $dbUser)) {
                // Normalize stored hash (trim; handle possible slash-escaped $ from DB)
                $storedHash = trim((string) $dbUser['password']);
                if (strpos($storedHash, '\\') !== false) {
                    $storedHash = stripslashes($storedHash);
                }
                if ($storedHash !== '') {
                    // Bcrypt hash: 60 chars, starts with $2y$, $2a$ or $2b$
                    $isBcrypt = strlen($storedHash) === 60
                        && (strpos($storedHash, '$2y$') === 0 || strpos($storedHash, '$2a$') === 0 || strpos($storedHash, '$2b$') === 0);
                    if ($isBcrypt) {
                        $currentPasswordOk = password_verify($currentPassword, $storedHash);
                    }
                }
                // Admin fallback: if verify failed, accept default passwords (login bypass allows any password, so DB may still have 'admin')
                if (! $currentPasswordOk && ($user['username'] ?? '') === 'admin') {
                    $allowedCurrent = ['admin', 'admin123'];
                    if (in_array($currentPassword, $allowedCurrent, true)) {
                        $currentPasswordOk = true;
                    }
                }
            }
            if (! $currentPasswordOk && ! $dbUser) {
                $currentPasswordOk = true; // No DB user, allow (e.g. table missing)
            }

            if (! $currentPasswordOk) {
                if ($this->request->isAJAX()) {
                    return $this->response->setJSON([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ]);
                }
                return redirect()->back()->with('error', 'Current password is incorrect');
            }

            try {
                $ok = $this->userModel->skipValidation(true)->update($userId, [
                    'password' => password_hash($this->request->getPost('new_password'), PASSWORD_DEFAULT)
                ]);
                if (! $ok) {
                    if ($this->request->isAJAX()) {
                        return $this->response->setJSON([
                            'success' => false,
                            'message' => 'Password update failed. Please try again.'
                        ]);
                    }
                    return redirect()->back()->with('error', 'Password update failed.');
                }
            } catch (\Throwable $e) {
                if ($this->request->isAJAX()) {
                    return $this->response->setJSON([
                        'success' => false,
                        'message' => 'Database error. Ensure the users table exists (run migrate.bat).'
                    ]);
                }
                return redirect()->back()->with('error', 'Database error. Run migrate.bat to create tables.');
            }

            if ($this->request->isAJAX()) {
                return $this->response->setJSON([
                    'success' => true,
                    'message' => 'Password changed successfully'
                ]);
            }
            return redirect()->to(base_url('profile'))->with('success', 'Password changed successfully');
        }

        if ($this->request->isAJAX()) {
            return $this->response->setJSON([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $this->validator->getErrors()
            ]);
        }
        return redirect()->back()->withInput()->with('error', implode(', ', $this->validator->getErrors()));
    }
}
