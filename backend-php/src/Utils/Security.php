<?php

namespace App\Utils;

class Security
{
    /**
     * Hash password
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Generate random token
     */
    public static function generateToken(int $length = 32): string
    {
        return bin2hex(random_bytes($length));
    }

    /**
     * Sanitize string
     */
    public static function sanitize(string $data): string
    {
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Get client IP address
     */
    public static function getClientIp(): string
    {
        $keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($keys as $key) {
            if (isset($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Get user agent
     */
    public static function getUserAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    }

    /**
     * Parse user agent to get browser and device info
     */
    public static function parseUserAgent(string $userAgent): array
    {
        $browser = 'Unknown';
        $deviceType = 'desktop';

        // Detect browser
        if (preg_match('/Firefox/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Safari/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/Opera|OPR/i', $userAgent)) {
            $browser = 'Opera';
        }

        // Detect device type
        if (preg_match('/mobile/i', $userAgent)) {
            $deviceType = 'mobile';
        } elseif (preg_match('/tablet/i', $userAgent)) {
            $deviceType = 'tablet';
        }

        return [
            'browser' => $browser,
            'device_type' => $deviceType,
        ];
    }

    /**
     * Validate email
     */
    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate password strength
     */
    public static function isStrongPassword(string $password, int $minLength = 8): array
    {
        $errors = [];

        if (strlen($password) < $minLength) {
            $errors[] = "La contraseña debe tener al menos {$minLength} caracteres";
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "La contraseña debe contener al menos una letra mayúscula";
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "La contraseña debe contener al menos una letra minúscula";
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "La contraseña debe contener al menos un número";
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = "La contraseña debe contener al menos un carácter especial";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}
