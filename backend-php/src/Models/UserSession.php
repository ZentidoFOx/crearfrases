<?php

namespace App\Models;

use App\Database\Connection;
use PDO;

class UserSession
{
    /**
     * Create a new session
     */
    public static function create(int $userId, string $jti, ?string $refreshJti, array $metadata): int
    {
        $pdo = Connection::getInstance();
        $config = require __DIR__ . '/../../config/app.php';
        
        $expiresAt = date('Y-m-d H:i:s', time() + $config['jwt']['refresh_expiration']);
        
        $stmt = $pdo->prepare("
            INSERT INTO user_sessions 
            (user_id, token_jti, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $jti,
            $metadata['ip_address'] ?? '',
            $metadata['user_agent'] ?? '',
            $expiresAt
        ]);
        
        return (int)$pdo->lastInsertId();
    }

    /**
     * Find session by JTI
     */
    public static function findByJti(string $jti): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT * 
            FROM user_sessions 
            WHERE token_jti = ? AND expires_at > NOW()
        ");
        $stmt->execute([$jti]);
        
        $session = $stmt->fetch();
        return $session ?: null;
    }

    /**
     * Find session by refresh token JTI (deprecated - not used in simplified version)
     */
    public static function findByRefreshJti(string $refreshJti): ?array
    {
        // No longer used in simplified structure
        return null;
    }

    /**
     * Update session activity (deprecated - not used in simplified version)
     */
    public static function updateActivity(string $jti): bool
    {
        // No longer tracked in simplified structure
        return true;
    }

    /**
     * Update session tokens (for refresh)
     */
    public static function updateTokens(int $sessionId, string $newJti, string $newRefreshJti): bool
    {
        $pdo = Connection::getInstance();
        $config = require __DIR__ . '/../../config/app.php';
        
        $expiresAt = date('Y-m-d H:i:s', time() + $config['jwt']['refresh_expiration']);
        
        $stmt = $pdo->prepare("
            UPDATE user_sessions 
            SET token_jti = ?, 
                expires_at = ?
            WHERE id = ?
        ");
        
        return $stmt->execute([$newJti, $expiresAt, $sessionId]);
    }

    /**
     * Invalidate session
     */
    public static function invalidate(string $jti): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE user_sessions 
            SET expires_at = NOW() 
            WHERE token_jti = ?
        ");
        
        return $stmt->execute([$jti]);
    }

    /**
     * Invalidate all user sessions
     */
    public static function invalidateAllUserSessions(int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE user_sessions 
            SET expires_at = NOW() 
            WHERE user_id = ?
        ");
        
        return $stmt->execute([$userId]);
    }

    /**
     * Get user's active sessions
     */
    public static function getUserSessions(int $userId): array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT id, ip_address, user_agent, created_at, expires_at
            FROM user_sessions 
            WHERE user_id = ? AND expires_at > NOW()
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId]);
        
        return $stmt->fetchAll();
    }

    /**
     * Delete expired sessions
     */
    public static function cleanupExpired(): int
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            DELETE FROM user_sessions 
            WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        $stmt->execute();
        
        return $stmt->rowCount();
    }

    /**
     * Delete session by ID
     */
    public static function deleteById(int $sessionId, int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            DELETE FROM user_sessions 
            WHERE id = ? AND user_id = ?
        ");
        
        return $stmt->execute([$sessionId, $userId]);
    }
}
