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
            SELECT u.id, u.username, u.role_id, u.is_active, u.created_by, u.created_at,
                   r.slug as role_slug, r.name as role_name,
                   creator.username as created_by_username
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN users creator ON u.created_by = creator.id
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
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
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
            'created_by' => $user['created_by'] ?? null,
            'created_by_username' => $user['created_by_username'] ?? null,
            'created_at' => $user['created_at'] ?? null,
        ];
    }

    /**
     * Create a new user
     */
    public static function create(array $data): int
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            INSERT INTO users (username, password, role_id, is_active, created_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            trim($data['username']),
            password_hash($data['password'], PASSWORD_BCRYPT),
            $data['role_id'] ?? 3, // Default: Editor
            $data['is_active'] ?? true,
            $data['created_by'] ?? null, // ID del usuario que crea
        ]);
        
        return (int)$pdo->lastInsertId();
    }

    /**
     * Update user profile
     */
    public static function updateProfile(int $userId, array $data): bool
    {
        $pdo = Connection::getInstance();
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['first_name', 'last_name', 'phone', 'company', 'job_title', 'avatar_url'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = Security::sanitize($data[$field]);
            }
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
     * Update password
     */
    public static function updatePassword(int $userId, string $newPassword): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET password = ?, login_attempts = 0, locked_until = NULL 
            WHERE id = ?
        ");
        
        return $stmt->execute([
            Security::hashPassword($newPassword),
            $userId
        ]);
    }

    /**
     * Update last login
     */
    public static function updateLastLogin(int $userId, string $ip): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET last_login_at = NOW(), 
                last_login_ip = ?,
                login_attempts = 0,
                locked_until = NULL
            WHERE id = ?
        ");
        
        return $stmt->execute([$ip, $userId]);
    }

    /**
     * Increment login attempts
     */
    public static function incrementLoginAttempts(string $email): void
    {
        $pdo = Connection::getInstance();
        $config = require __DIR__ . '/../../config/app.php';
        
        $maxAttempts = $config['security']['max_login_attempts'];
        $lockoutTime = $config['security']['lockout_time'];
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET login_attempts = login_attempts + 1,
                locked_until = CASE 
                    WHEN login_attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? SECOND)
                    ELSE locked_until
                END
            WHERE email = ?
        ");
        
        $stmt->execute([$maxAttempts, $lockoutTime, $email]);
    }

    /**
     * Check if user is locked
     */
    public static function isLocked(string $email): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT locked_until 
            FROM users 
            WHERE email = ? AND locked_until IS NOT NULL AND locked_until > NOW()
        ");
        $stmt->execute([$email]);
        
        return $stmt->fetch() !== false;
    }

    /**
     * Check if email exists
     */
    public static function emailExists(string $email): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM users 
            WHERE email = ? AND deleted_at IS NULL
        ");
        $stmt->execute([strtolower(trim($email))]);
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }

    /**
     * Soft delete user
     */
    public static function delete(int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET deleted_at = NOW(), is_active = FALSE 
            WHERE id = ?
        ");
        
        return $stmt->execute([$userId]);
    }

    /**
     * Get all users with pagination
     * @param int $page Page number
     * @param int $perPage Items per page
     * @param string $search Search term
     * @param int|null $createdBy Filter by creator (admin sees only their created users)
     * @param bool $includeAll If true, ignores createdBy filter (for superadmin)
     */
    public static function getAll(int $page = 1, int $perPage = 10, string $search = '', ?int $createdBy = null, bool $includeAll = false): array
    {
        $pdo = Connection::getInstance();
        $offset = ($page - 1) * $perPage;
        
        $whereClause = "1=1";
        $params = [];
        
        if (!empty($search)) {
            $whereClause .= " AND u.username LIKE ?";
            $searchParam = "%$search%";
            $params[] = $searchParam;
        }
        
        // Filter by created_by for admins (not superadmin)
        if (!$includeAll && $createdBy !== null) {
            $whereClause .= " AND u.created_by = ?";
            $params[] = $createdBy;
        }
        
        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM users u WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get users with role info and creator info
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.role_id, u.is_active, u.created_by, u.created_at,
                   r.slug as role_slug, r.name as role_name,
                   creator.username as created_by_username
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN users creator ON u.created_by = creator.id
            WHERE $whereClause
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $perPage;
        $params[] = $offset;
        $stmt->execute($params);
        
        return [
            'users' => $stmt->fetchAll(),
            'total' => (int)$total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage)
        ];
    }

    /**
     * Toggle user active status
     */
    public static function toggleStatus(int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE users 
            SET is_active = NOT is_active 
            WHERE id = ?
        ");
        
        return $stmt->execute([$userId]);
    }

    /**
     * Update user by ID (admin function)
     */
    public static function updateById(int $userId, array $data): bool
    {
        $pdo = Connection::getInstance();
        
        $fields = [];
        $values = [];
        
        $allowedFields = ['role_id', 'is_active', 'password'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'password') {
                    $fields[] = "$field = ?";
                    $values[] = password_hash($data[$field], PASSWORD_BCRYPT);
                } elseif ($field === 'is_active') {
                    $fields[] = "$field = ?";
                    $values[] = (bool)$data[$field];
                } else {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $userId;
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ? AND deleted_at IS NULL";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute($values);
    }


    /**
     * Get user statistics (personalized by role)
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
            // Get active sessions count (sessions not expired)
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
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL");
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

                    // Users by role
                    $stmt = $pdo->query("
                        SELECT r.name, COUNT(u.id) as count
                        FROM roles r
                        LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
                        GROUP BY r.id
                        ORDER BY r.hierarchy_level DESC
                    ");
                    $stats['users_by_role'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                    break;

            case 'admin':
                // Total users (except superadmins)
                $stmt = $pdo->query("
                    SELECT COUNT(*) as count
                    FROM users u
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE u.deleted_at IS NULL 
                    AND (r.slug IS NULL OR r.slug != 'superadmin')
                ");
                $result = $stmt->fetch();
                $stats['manageable_users'] = (int)($result['count'] ?? 0);

                // Active users (last 30 days)
                $stmt = $pdo->query("
                    SELECT COUNT(*) as count
                    FROM users
                    WHERE deleted_at IS NULL 
                    AND last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ");
                $result = $stmt->fetch();
                $stats['active_users_30d'] = (int)($result['count'] ?? 0);

                // Recent registrations (last 7 days)
                $stmt = $pdo->query("
                    SELECT COUNT(*) as count
                    FROM users
                    WHERE deleted_at IS NULL 
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ");
                $result = $stmt->fetch();
                $stats['new_users_7d'] = (int)($result['count'] ?? 0);
                break;

                case 'editor':
                default:
                    // Content stats (placeholder - ajustar cuando exista tabla de contenido)
                    $stats['articles_draft'] = 0;
                    $stats['articles_published'] = 0;
                    $stats['total_articles'] = 0;
                    $stats['total_words'] = 0;
                    break;
            }
        } catch (\Exception $e) {
            error_log('Error getting role-specific stats: ' . $e->getMessage());
        }

        return $stats;
    }

    /**
     * Get websites assigned to a user
     */
    public static function getAssignedWebsites(int $userId): array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT w.id, w.name, w.url, w.description, w.is_active, 
                   w.connection_verified, w.created_at, uw.assigned_at,
                   uw.is_active as assignment_active,
                   assigner.username as assigned_by_username
            FROM user_websites uw
            INNER JOIN websites w ON uw.website_id = w.id
            LEFT JOIN users assigner ON uw.assigned_by = assigner.id
            WHERE uw.user_id = ? AND uw.is_active = 1
            ORDER BY uw.assigned_at DESC
        ");
        $stmt->execute([$userId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Assign a website to a user
     */
    public static function assignWebsite(int $userId, int $websiteId, int $assignedBy): bool
    {
        $pdo = Connection::getInstance();
        
        try {
            // Check if already assigned
            $stmt = $pdo->prepare("
                SELECT id FROM user_websites 
                WHERE user_id = ? AND website_id = ?
            ");
            $stmt->execute([$userId, $websiteId]);
            
            if ($stmt->fetch()) {
                return false; // Already assigned
            }
            
            // Insert assignment
            $stmt = $pdo->prepare("
                INSERT INTO user_websites (user_id, website_id, assigned_by, is_active)
                VALUES (?, ?, ?, 1)
            ");
            
            return $stmt->execute([$userId, $websiteId, $assignedBy]);
            
        } catch (\Exception $e) {
            error_log('Assign website error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Unassign a website from a user
     */
    public static function unassignWebsite(int $userId, int $websiteId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            DELETE FROM user_websites 
            WHERE user_id = ? AND website_id = ?
        ");
        
        $result = $stmt->execute([$userId, $websiteId]);
        
        return $result && $stmt->rowCount() > 0;
    }
}
