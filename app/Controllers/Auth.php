<?php

namespace App\Controllers;

use App\Models\UserModel;

class Auth extends BaseController
{
    protected $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    public function login()
    {
        if (session()->get('user')) {
            return redirect()->to(base_url());
        }

        $data = [
            'title' => 'Login'
        ];

        if ($this->request->isAJAX()) {
            if ($this->request->is('post')) {
                $username = $this->request->getPost('username');
                $password = $this->request->getPost('password');

                $user = $this->userModel->authenticate($username, $password);

                if ($user) {
                    session()->set('user', $user);
                    return $this->response->setJSON([
                        'success' => true,
                        'message' => 'Login successful',
                        'redirect' => base_url()
                    ]);
                } else {
                    return $this->response->setJSON([
                        'success' => false,
                        'message' => 'Invalid username or password'
                    ]);
                }
            }
        } else {
            if ($this->request->is('post')) {
                $username = $this->request->getPost('username');
                $password = $this->request->getPost('password');

                $user = $this->userModel->authenticate($username, $password);

                if ($user) {
                    session()->set('user', $user);
                    return redirect()->to(base_url())->with('success', 'Login successful');
                } else {
                    $data['error'] = 'Invalid username or password';
                }
            }

            return view('auth/login', $data);
        }
    }

    public function logout()
    {
        session()->destroy();
        return redirect()->to(base_url('login'))->with('success', 'Logged out successfully');
    }
}