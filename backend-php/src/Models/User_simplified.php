<?php

namespace App\Models;

use App\Database\Connection;
use App\Utils\Security;
use PDO;

class User
{
    /**
     * Find user by ID
     */
    public static function findById(int $id): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.role_id, u.is_active, u.created_at,
                   r.slug as role_slug, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        
        $user = $stmt->fetch();
        return $user ?: null;
    }

    /**
     * Find user by username
     */
    public static function findByUsername(string $username): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.password, u.role_id, u.is_active, u.created_at,
                   r.slug as role_slug, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.username = ?
        ");
        $stmt->execute([$username]);
        
        $user = $stmt->fetch();
        return $user ?: null;
    }

    /**
     * Check if username exists
     */
    public static function usernameExists(string $username): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmt->execute([$username]);
        
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Create a new user
     */
    public static function create(array $data): int
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            INSERT INTO users (username, password, role_id, is_active)
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            strtolower(trim($data['username'])),
            Security::hashPassword($data['password']),
            $data['role_id'] ?? 3, // Default: Editor
            $data['is_active'] ?? 1
        ]);
        
        return (int)$pdo->lastInsertId();
    }

    /**
     * Update user by ID (admin)
     */
    public static function updateById(int $userId, array $data): bool
    {
        $pdo = Connection::getInstance();
        
        $fields = [];
        $values = [];
        
        // Solo campos permitidos
        if (isset($data['role_id'])) {
            $fields[] = "role_id = ?";
            $values[] = $data['role_id'];
        }
        
        if (isset($data['is_active'])) {
            $fields[] = "is_active = ?";
            $values[] = $data['is_active'] ? 1 : 0;
        }
        
        // Cambiar password (opcional)
        if (isset($data['password']) && !empty($data['password'])) {
            $fields[] = "password = ?";
            $values[] = Security::hashPassword($data['password']);
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $userId;
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute($values);
    }

    /**
     * Change password
     */
    public static function changePassword(int $userId, string $newPassword): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        
        return $stmt->execute([
            Security::hashPassword($newPassword),
            $userId
        ]);
    }

    /**
     * Toggle user active status
     */
    public static function toggleStatus(int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("UPDATE users SET is_active = NOT is_active WHERE id = ?");
        
        return $stmt->execute([$userId]);
    }

    /**
     * Delete user (soft delete - actually hard delete now)
     */
    public static function delete(int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        
        return $stmt->execute([$userId]);
    }

    /**
     * Get all users (admin)
     */
    public static function getAll(int $page = 1, int $perPage = 10, string $search = ''): array
    {
        $pdo = Connection::getInstance();
        $offset = ($page - 1) * $perPage;
        
        $searchCondition = '';
        $params = [];
        
        if (!empty($search)) {
            $searchCondition = "WHERE u.username LIKE ?";
            $params[] = "%$search%";
        }
        
        // Get users
        $sql = "
            SELECT u.id, u.username, u.role_id, u.is_active, u.created_at,
                   r.slug as role_slug, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            $searchCondition
            ORDER BY u.id DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $perPage;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM users u $searchCondition";
        $countParams = !empty($search) ? ["%$search%"] : [];
        
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($countParams);
        $total = (int)$stmt->fetchColumn();
        
        return [
            'users' => $users,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => (int)ceil($total / $perPage)
        ];
    }

    /**
     * Get public user data (sin password)
     */
    public static function getPublicData(array $user): array
    {
        return [
            'id' => $user['id'],
            'username' => $user['username'],
            'role_id' => $user['role_id'] ?? null,
            'role_name' => $user['role_name'] ?? null,
            'role_slug' => $user['role_slug'] ?? null,
            'is_active' => (bool)$user['is_active'],
            'created_at' => $user['created_at'] ?? null,
        ];
    }

    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Get user statistics
     */
    public static function getUserStats(int $userId, string $roleSlug): array
    {
        $pdo = Connection::getInstance();
        
        $stats = [
            'role' => $roleSlug,
            'account_age_days' => 0,
            'sessions_count' => 0,
        ];

        try {
            // Get account age
            $stmt = $pdo->prepare("
                SELECT DATEDIFF(NOW(), created_at) as age_days
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch();
            $stats['account_age_days'] = (int)($result['age_days'] ?? 0);
        } catch (\Exception $e) {
            error_log('Error getting account age: ' . $e->getMessage());
        }

        try {
            // Get active sessions count
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count
                FROM user_sessions
                WHERE user_id = ? AND expires_at > NOW()
            ");
            $stmt->execute([$userId]);
            $result = $stmt->fetch();
            $stats['sessions_count'] = (int)($result['count'] ?? 0);
        } catch (\Exception $e) {
            error_log('Error getting sessions count: ' . $e->getMessage());
            $stats['sessions_count'] = 0;
        }

        // Role-specific stats
        try {
            switch ($roleSlug) {
                case 'superadmin':
                    // Total users
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
                    $result = $stmt->fetch();
                    $stats['total_users'] = (int)($result['count'] ?? 0);

                    // Total roles
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM roles WHERE is_active = 1");
                    $result = $stmt->fetch();
                    $stats['total_roles'] = (int)($result['count'] ?? 0);

                    // Active sessions (all users, not expired)
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > NOW()");
                    $result = $stmt->fetch();
                    $stats['total_sessions'] = (int)($result['count'] ?? 0);
                    break;

                case 'admin':
                    // Total users (except superadmins)
                    $stmt = $pdo->query("
                        SELECT COUNT(*) as count
                        FROM users u
                        LEFT JOIN roles r ON u.role_id = r.id
                        WHERE r.slug IS NULL OR r.slug != 'superadmin'
                    ");
                    $result = $stmt->fetch();
                    $stats['manageable_users'] = (int)($result['count'] ?? 0);
                    break;

                case 'editor':
                default:
                    // Content stats placeholder
                    $stats['articles_draft'] = 0;
                    $stats['articles_published'] = 0;
                    break;
            }
        } catch (\Exception $e) {
            error_log('Error getting role-specific stats: ' . $e->getMessage());
        }

        return $stats;
    }
}
