<?php
/**
 * Test específico para el login - simular la funcionalidad básica
 */

// Headers CORS
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo manejar POST para login
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Leer datos de entrada
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// Validar campos requeridos
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Username and password required']);
    exit();
}

// Simular validación de usuario (sin base de datos por ahora)
$username = $data['username'];
$password = $data['password'];

// Credenciales de prueba
$validUsers = [
    'admin' => 'admin123',
    'editor' => 'editor123',
    'test' => 'test123'
];

if (isset($validUsers[$username]) && $validUsers[$username] === $password) {
    // Login exitoso
    $response = [
        'success' => true,
        'data' => [
            'user' => [
                'id' => 1,
                'username' => $username,
                'role_id' => 1,
                'role_slug' => 'admin',
                'role_name' => 'Administrator',
                'is_active' => true,
                'created_at' => '2024-01-01 00:00:00'
            ],
            'access_token' => 'test_access_token_' . time(),
            'refresh_token' => 'test_refresh_token_' . time(),
            'token_type' => 'Bearer',
            'expires_in' => 3600
        ],
        'message' => 'Login successful'
    ];
    
    http_response_code(200);
    echo json_encode($response);
} else {
    // Login fallido
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INVALID_CREDENTIALS',
            'message' => 'Invalid username or password'
        ]
    ]);
}
?>
