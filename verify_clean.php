<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=employee', 'root', '');
    $stmt = $pdo->query('SELECT * FROM attendance WHERE employee_id=3 AND date = "2026-02-24"');
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        print_r($row);
    } else {
        echo "No record found for Feb 24.\n";
    }
} catch (PDOException $e) {
    echo $e->getMessage();
}
