<?php

namespace App\Middleware;

use App\Models\Role;
use PDO;

class RoleMiddleware
{
    private PDO $pdo;
    private Role $roleModel;
    
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->roleModel = new Role($pdo);
    }
    
    /**
     * Check if user has required permission
     */
    public function requirePermission(array $user, string $resource, string $action): bool
    {
        if (!isset($user['role_id'])) {
            $this->sendUnauthorized('Usuario sin rol asignado');
            return false;
        }
        
        $hasPermission = $this->roleModel->hasPermission(
            $user['role_id'],
            $resource,
            $action
        );
        
        if (!$hasPermission) {
            $this->sendForbidden("No tienes permiso para: {$action} en {$resource}");
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if user has required role (by slug)
     */
    public function requireRole(array $user, string|array $requiredRoles): bool
    {
        if (!isset($user['role_slug'])) {
            $this->sendUnauthorized('Usuario sin rol asignado');
            return false;
        }
        
        $requiredRoles = is_array($requiredRoles) ? $requiredRoles : [$requiredRoles];
        
        if (!in_array($user['role_slug'], $requiredRoles)) {
            $this->sendForbidden('No tienes el rol necesario para esta acción');
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if user has minimum hierarchy level
     */
    public function requireMinHierarchy(array $user, int $minLevel): bool
    {
        if (!isset($user['role_hierarchy'])) {
            $this->sendUnauthorized('Usuario sin rol asignado');
            return false;
        }
        
        if ($user['role_hierarchy'] < $minLevel) {
            $this->sendForbidden('Tu nivel de jerarquía es insuficiente');
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if user can manage target user
     */
    public function canManageUser(array $currentUser, int $targetUserId): bool
    {
        if (!isset($currentUser['role_id'])) {
            $this->sendUnauthorized('Usuario sin rol asignado');
            return false;
        }
        
        // Get target user
        $stmt = $this->pdo->prepare("
            SELECT role_id 
            FROM users 
            WHERE id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$targetUserId]);
        $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$targetUser || !$targetUser['role_id']) {
            return true; // Can manage users without role
        }
        
        // Check hierarchy
        $canManage = $this->roleModel->canManageRole(
            $currentUser['role_id'],
            $targetUser['role_id']
        );
        
        if (!$canManage) {
            $this->sendForbidden('No puedes gestionar usuarios con rol igual o superior al tuyo');
            return false;
        }
        
        return true;
    }
    
    /**
     * Get user permissions for frontend
     */
    public function getUserPermissions(int $roleId): array
    {
        $role = $this->roleModel->getById($roleId);
        
        if (!$role) {
            return [];
        }
        
        return [
            'role' => [
                'id' => $role['id'],
                'name' => $role['name'],
                'slug' => $role['slug'],
                'hierarchy_level' => $role['hierarchy_level']
            ],
            'permissions' => $role['permissions'],
            'can' => $this->buildPermissionHelpers($role['permissions'])
        ];
    }
    
    /**
     * Build permission helpers (flattened)
     */
    private function buildPermissionHelpers(array $permissions): array
    {
        $helpers = [];
        
        foreach ($permissions as $resource => $actions) {
            foreach ($actions as $action => $allowed) {
                $helpers["{$resource}.{$action}"] = $allowed;
            }
        }
        
        return $helpers;
    }
    
    /**
     * Send 401 Unauthorized response
     */
    private function sendUnauthorized(string $message): void
    {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized',
            'message' => $message
        ]);
        exit;
    }
    
    /**
     * Send 403 Forbidden response
     */
    private function sendForbidden(string $message): void
    {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Forbidden',
            'message' => $message
        ]);
        exit;
    }
}
