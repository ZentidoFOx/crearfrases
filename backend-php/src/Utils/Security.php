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

    /**
     * Encrypt sensitive data (like WordPress app passwords)
     */
    public static function encrypt(string $data): string
    {
        // Check if OpenSSL is available
        if (!extension_loaded('openssl')) {
            throw new \Exception('OpenSSL extension is required for encryption');
        }
        
        $key = self::getEncryptionKey();
        $iv = random_bytes(16); // AES-256-CBC requires 16 bytes IV
        
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        
        if ($encrypted === false) {
            throw new \Exception('Encryption failed');
        }
        
        // Combine IV and encrypted data
        return base64_encode($iv . $encrypted);
    }

    /**
     * Decrypt sensitive data
     */
    public static function decrypt(string $encryptedData): string
    {
        // Check if OpenSSL is available
        if (!extension_loaded('openssl')) {
            throw new \Exception('OpenSSL extension is required for decryption');
        }
        
        $key = self::getEncryptionKey();
        $data = base64_decode($encryptedData);
        
        if ($data === false || strlen($data) < 16) {
            return '';
        }
        
        // Extract IV (first 16 bytes) and encrypted data
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
        
        return $decrypted ?: '';
    }

    /**
     * Get encryption key from environment or generate one
     */
    private static function getEncryptionKey(): string
    {
        // Try to get from environment variable first
        $key = $_ENV['ENCRYPTION_KEY'] ?? null;
        
        if (!$key) {
            // Fallback: use a combination of server-specific values
            // In production, you should set ENCRYPTION_KEY in your environment
            $serverKey = $_SERVER['SERVER_NAME'] ?? 'localhost';
            $key = hash('sha256', $serverKey . 'adminresh_encryption_salt_2024');
        }
        
        // Ensure key is exactly 32 bytes for AES-256
        return substr(hash('sha256', $key), 0, 32);
    }

    /**
     * Generate a secure encryption key (for setup)
     */
    public static function generateEncryptionKey(): string
    {
        if (!function_exists('random_bytes')) {
            throw new \Exception('random_bytes function is not available');
        }
        
        return bin2hex(random_bytes(32)); // 256-bit key
    }
}
