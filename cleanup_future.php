<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=employee', 'root', '');
    $today = date('Y-m-d');
    
    // Delete future weekend_rule records for ALL employees
    $sql = "DELETE FROM attendance WHERE date > ? AND source = 'weekend_rule'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$today]);
    echo "Deleted " . $stmt->rowCount() . " future weekend rule records.\n";
    
} catch (PDOException $e) {
    echo $e->getMessage();
}
