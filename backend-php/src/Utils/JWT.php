<?php

namespace App\Utils;

class JWT
{
    private static function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode(string $data): string
    {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }

    /**
     * Generate a JWT token
     */
    public static function encode(array $payload, string $secret, int $expiration = 3600): string
    {
        $config = require __DIR__ . '/../../config/app.php';
        
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $now = time();
        
        $payload = array_merge([
            'iat' => $now,
            'exp' => $now + $expiration,
            'nbf' => $now,
        ], $payload);

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            $secret,
            true
        );
        
        $signatureEncoded = self::base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    /**
     * Decode and verify a JWT token
     */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // Verify signature
        $signature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            $secret,
            true
        );
        
        $expectedSignature = self::base64UrlEncode($signature);

        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            return null; // Invalid signature
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        if (!$payload) {
            return null;
        }

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Token expired
        }

        // Check not before
        if (isset($payload['nbf']) && $payload['nbf'] > time()) {
            return null; // Token not valid yet
        }

        return $payload;
    }

    /**
     * Generate a unique JWT ID
     */
    public static function generateJti(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Create access token
     */
    public static function createAccessToken(int $userId, string $email): string
    {
        $config = require __DIR__ . '/../../config/app.php';
        
        $payload = [
            'jti' => self::generateJti(),
            'sub' => $userId,
            'email' => $email,
            'type' => 'access',
        ];

        return self::encode(
            $payload,
            $config['jwt']['secret'],
            $config['jwt']['access_expiration']
        );
    }

    /**
     * Create refresh token
     */
    public static function createRefreshToken(int $userId): string
    {
        $config = require __DIR__ . '/../../config/app.php';
        
        $payload = [
            'jti' => self::generateJti(),
            'sub' => $userId,
            'type' => 'refresh',
        ];

        return self::encode(
            $payload,
            $config['jwt']['secret'],
            $config['jwt']['refresh_expiration']
        );
    }

    /**
     * Verify access token
     */
    public static function verifyAccessToken(string $token): ?array
    {
        $config = require __DIR__ . '/../../config/app.php';
        $payload = self::decode($token, $config['jwt']['secret']);

        if (!$payload || !isset($payload['type']) || $payload['type'] !== 'access') {
            return null;
        }

        return $payload;
    }

    /**
     * Verify refresh token
     */
    public static function verifyRefreshToken(string $token): ?array
    {
        $config = require __DIR__ . '/../../config/app.php';
        $payload = self::decode($token, $config['jwt']['secret']);

        if (!$payload || !isset($payload['type']) || $payload['type'] !== 'refresh') {
            return null;
        }

        return $payload;
    }
}
