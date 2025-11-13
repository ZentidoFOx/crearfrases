<?php

namespace App\Utils;

use App\Database\Connection;
use PDO;

class RateLimiter
{
    /**
     * Check if rate limit is exceeded
     */
    public static function check(string $identifier, string $action, int $maxAttempts, int $windowSeconds): bool
    {
        $pdo = Connection::getInstance();
        
        // Clean expired records first
        self::cleanup();

        $stmt = $pdo->prepare("
            SELECT attempts, expires_at 
            FROM rate_limits 
            WHERE identifier = ? AND action = ?
        ");
        $stmt->execute([$identifier, $action]);
        $record = $stmt->fetch();

        if (!$record) {
            // First attempt
            self::record($identifier, $action, $windowSeconds);
            return true; // Allow
        }

        // Check if window has expired
        if (strtotime($record['expires_at']) < time()) {
            // Reset counter
            self::reset($identifier, $action);
            self::record($identifier, $action, $windowSeconds);
            return true; // Allow
        }

        // Check if limit exceeded
        if ($record['attempts'] >= $maxAttempts) {
            return false; // Deny
        }

        // Increment attempts
        self::increment($identifier, $action);
        return true; // Allow
    }

    /**
     * Record a rate limit attempt
     */
    private static function record(string $identifier, string $action, int $windowSeconds): void
    {
        $pdo = Connection::getInstance();
        
        $expiresAt = date('Y-m-d H:i:s', time() + $windowSeconds);
        
        $stmt = $pdo->prepare("
            INSERT INTO rate_limits (identifier, action, attempts, expires_at)
            VALUES (?, ?, 1, ?)
            ON DUPLICATE KEY UPDATE 
                attempts = 1,
                window_start = CURRENT_TIMESTAMP,
                expires_at = ?
        ");
        $stmt->execute([$identifier, $action, $expiresAt, $expiresAt]);
    }

    /**
     * Increment attempts
     */
    private static function increment(string $identifier, string $action): void
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE rate_limits 
            SET attempts = attempts + 1 
            WHERE identifier = ? AND action = ?
        ");
        $stmt->execute([$identifier, $action]);
    }

    /**
     * Reset rate limit
     */
    private static function reset(string $identifier, string $action): void
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            DELETE FROM rate_limits 
            WHERE identifier = ? AND action = ?
        ");
        $stmt->execute([$identifier, $action]);
    }

    /**
     * Clean expired records
     */
    private static function cleanup(): void
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            DELETE FROM rate_limits 
            WHERE expires_at < NOW()
        ");
        $stmt->execute();
    }

    /**
     * Get remaining attempts
     */
    public static function getRemaining(string $identifier, string $action, int $maxAttempts): int
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT attempts 
            FROM rate_limits 
            WHERE identifier = ? AND action = ? AND expires_at > NOW()
        ");
        $stmt->execute([$identifier, $action]);
        $record = $stmt->fetch();

        if (!$record) {
            return $maxAttempts;
        }

        return max(0, $maxAttempts - $record['attempts']);
    }
}
