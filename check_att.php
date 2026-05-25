<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=employee', 'root', '');
    $stmt = $pdo->query('SELECT * FROM attendance WHERE employee_id=3 AND date LIKE "2026-02-%" ORDER BY date ASC');
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo implode(" | ", $row) . "\n";
    }
} catch (PDOException $e) {
    echo $e->getMessage();
}
