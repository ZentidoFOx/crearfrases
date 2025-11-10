<?php
header('Content-Type: application/json');

echo json_encode([
    'status' => 'Backend funcionando correctamente',
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp' => date('c'),
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
]);
