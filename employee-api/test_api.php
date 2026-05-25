<?php

/**
 * simple API Test Script
 * Run this from browser: http://localhost/employee/employee-api/test_api.php
 * or CLI: php test_api.php
 */

$baseUrl = "http://localhost/employee/api/v1";

function runTest($name, $url, $method = 'GET', $data = null) {
    echo "Testing [$name]... ";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        $jsonData = json_encode($data);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($httpCode >= 200 && $httpCode < 300 && isset($result['status']) && $result['status'] === true) {
        echo "\033[32mPASSED\033[0m (Code: $httpCode)\n";
    } else {
        echo "\033[31mFAILED\033[0m (Code: $httpCode)\n";
        echo "Response: $response\n";
    }
    echo "--------------------------------------------------\n";
}

// 1. Test Dashboard
runTest("Dashboard Stats", "$baseUrl/dashboard");

// 2. Test Employee List
runTest("Employee List", "$baseUrl/employees");

// 3. Test Attendance List
runTest("Attendance List", "$baseUrl/attendance?date=" . date('Y-m-d'));

// 4. Test Login (Failure Case)
runTest("Login (Expected Failure)", "$baseUrl/login", "POST", ["username" => "wrong", "password" => "wrong"]);

echo "\nTests Completed.\n";
