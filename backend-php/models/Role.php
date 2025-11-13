<?php

namespace App\Models;

use PDO;

class Role
{
    private PDO $pdo;
    
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }
    
    /**
     * Get all roles
     */
    public function getAll(): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                id,
                name,
                slug,
                description,
                hierarchy_level,
                permissions,
                is_active,
                created_at,
                updated_at
            FROM roles
            WHERE is_active = 1
            ORDER BY hierarchy_level DESC
        ");
        
        $stmt->execute();
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON permissions
        foreach ($roles as &$role) {
            $role['permissions'] = json_decode($role['permissions'], true);
        }
        
        return $roles;
    }
    
    /**
     * Get role by ID
     */
    public function getById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                id,
                name,
                slug,
                description,
                hierarchy_level,
                permissions,
                is_active,
                created_at,
                updated_at
            FROM roles
            WHERE id = ? AND is_active = 1
        ");
        
        $stmt->execute([$id]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($role) {
            $role['permissions'] = json_decode($role['permissions'], true);
        }
        
        return $role ?: null;
    }
    
    /**
     * Get role by slug
     */
    public function getBySlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                id,
                name,
                slug,
                description,
                hierarchy_level,
                permissions,
                is_active,
                created_at,
                updated_at
            FROM roles
            WHERE slug = ? AND is_active = 1
        ");
        
        $stmt->execute([$slug]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($role) {
            $role['permissions'] = json_decode($role['permissions'], true);
        }
        
        return $role ?: null;
    }
    
    /**
     * Check if user has permission
     */
    public function hasPermission(int $roleId, string $resource, string $action): bool
    {
        $role = $this->getById($roleId);
        
        if (!$role || !isset($role['permissions'][$resource])) {
            return false;
        }
        
        return $role['permissions'][$resource][$action] ?? false;
    }
    
    /**
     * Check if role can manage another role (based on hierarchy)
     */
    public function canManageRole(int $managerRoleId, int $targetRoleId): bool
    {
        $managerRole = $this->getById($managerRoleId);
        $targetRole = $this->getById($targetRoleId);
        
        if (!$managerRole || !$targetRole) {
            return false;
        }
        
        // Can only manage roles with lower hierarchy
        return $managerRole['hierarchy_level'] > $targetRole['hierarchy_level'];
    }
    
    /**
     * Get roles that a user can assign (based on their role hierarchy)
     */
    public function getAssignableRoles(int $userRoleId): array
    {
        $userRole = $this->getById($userRoleId);
        
        if (!$userRole) {
            return [];
        }
        
        $stmt = $this->pdo->prepare("
            SELECT 
                id,
                name,
                slug,
                description,
                hierarchy_level
            FROM roles
            WHERE is_active = 1 
            AND hierarchy_level < ?
            ORDER BY hierarchy_level DESC
        ");
        
        $stmt->execute([$userRole['hierarchy_level']]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Count users by role
     */
    public function getUserCount(int $roleId): int
    {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count
            FROM users
            WHERE role_id = ? AND deleted_at IS NULL
        ");
        
        $stmt->execute([$roleId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int) $result['count'];
    }
    
    /**
     * Get all roles with user counts
     */
    public function getAllWithCounts(): array
    {
        $stmt = $this->pdo->query("
            SELECT 
                r.id,
                r.name,
                r.slug,
                r.description,
                r.hierarchy_level,
                r.permissions,
                r.is_active,
                COUNT(u.id) as user_count
            FROM roles r
            LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
            WHERE r.is_active = 1
            GROUP BY r.id
            ORDER BY r.hierarchy_level DESC
        ");
        
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON permissions
        foreach ($roles as &$role) {
            $role['permissions'] = json_decode($role['permissions'], true);
            $role['user_count'] = (int) $role['user_count'];
        }
        
        return $roles;
    }
}
