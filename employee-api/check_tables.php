<?php
require 'app/Config/Database.php';
$db = \Config\Database::connect();
$tables = $db->listTables();
print_r($tables);
