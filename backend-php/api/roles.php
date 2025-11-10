<?php

/**
 * API Endpoint: Roles Management
 * GET /api/roles - Lista todos los roles
 * GET /api/roles/{id} - Obtiene un rol específico
 * GET /api/roles/permissions - Obtiene permisos del usuario actual
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Role.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../middleware/RoleMiddleware.php';

use App\Models\Role;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    // Database connection
    $config = require __DIR__ . '/../config/database.php';
    $pdo = new PDO(
        "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}",
        $config['username'],
        $config['password'],
        $config['options']
    );
    
    $roleModel = new Role($pdo);
    $authMiddleware = new AuthMiddleware($pdo);
    $roleMiddleware = new RoleMiddleware($pdo);
    
    // Authenticate user
    $user = $authMiddleware->authenticate();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'No autenticado'
        ]);
        exit;
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '/';
    
    // Routes
    switch ($method) {
        case 'GET':
            if ($path === '/' || $path === '') {
                // GET /api/roles - List all roles
                handleListRoles($roleModel, $roleMiddleware, $user);
            } elseif ($path === '/permissions') {
                // GET /api/roles/permissions - Get current user permissions
                handleGetPermissions($roleMiddleware, $user);
            } elseif (preg_match('/^\/(\d+)$/', $path, $matches)) {
                // GET /api/roles/{id} - Get specific role
                handleGetRole($roleModel, $roleMiddleware, $user, (int)$matches[1]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Endpoint no encontrado'
                ]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Método no permitido'
            ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error del servidor',
        'message' => $e->getMessage()
    ]);
}

/**
 * List all roles (with user counts)
 */
function handleListRoles(Role $roleModel, RoleMiddleware $roleMiddleware, array $user): void
{
    // Check permission to read roles
    if (!$roleMiddleware->requirePermission($user, 'roles', 'read')) {
        return;
    }
    
    $roles = $roleModel->getAllWithCounts();
    
    echo json_encode([
        'success' => true,
        'data' => $roles
    ]);
}

/**
 * Get specific role
 */
function handleGetRole(Role $roleModel, RoleMiddleware $roleMiddleware, array $user, int $roleId): void
{
    // Check permission to read roles
    if (!$roleMiddleware->requirePermission($user, 'roles', 'read')) {
        return;
    }
    
    $role = $roleModel->getById($roleId);
    
    if (!$role) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Rol no encontrado'
        ]);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $role
    ]);
}

/**
 * Get current user permissions
 */
function handleGetPermissions(RoleMiddleware $roleMiddleware, array $user): void
{
    if (!isset($user['role_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Usuario sin rol asignado'
        ]);
        return;
    }
    
    $permissions = $roleMiddleware->getUserPermissions($user['role_id']);
    
    echo json_encode([
        'success' => true,
        'data' => $permissions
    ]);
}
