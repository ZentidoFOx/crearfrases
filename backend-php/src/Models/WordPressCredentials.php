<?php

namespace App\Models;

use App\Database\Connection;
use App\Utils\Security;
use PDO;

class WordPressCredentials
{
    /**
     * Get WordPress credentials for a user and website
     */
    public static function getByUserAndWebsite(int $userId, int $websiteId): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT wc.id, wc.user_id, wc.website_id, wc.username, wc.app_password,
                   wc.is_active, wc.last_tested, wc.test_status, wc.created_at, wc.updated_at,
                   w.name as website_name, w.url as website_url
            FROM wordpress_credentials wc
            JOIN websites w ON wc.website_id = w.id
            WHERE wc.user_id = ? AND wc.website_id = ? AND wc.is_active = 1
        ");
        $stmt->execute([$userId, $websiteId]);
        
        $credentials = $stmt->fetch();
        if (!$credentials) {
            return null;
        }

        // Decrypt app password for return
        $credentials['app_password'] = Security::decrypt($credentials['app_password']);
        
        return $credentials;
    }

    /**
     * Save or update WordPress credentials
     */
    public static function saveCredentials(int $userId, int $websiteId, string $username, string $appPassword): bool
    {
        $pdo = Connection::getInstance();
        
        try {
            $pdo->beginTransaction();
            
            // Encrypt the app password
            $encryptedPassword = Security::encrypt($appPassword);
            
            // Check if credentials already exist
            $stmt = $pdo->prepare("
                SELECT id FROM wordpress_credentials 
                WHERE user_id = ? AND website_id = ?
            ");
            $stmt->execute([$userId, $websiteId]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                // Update existing credentials
                $stmt = $pdo->prepare("
                    UPDATE wordpress_credentials 
                    SET username = ?, app_password = ?, test_status = 'pending', updated_at = NOW()
                    WHERE user_id = ? AND website_id = ?
                ");
                $result = $stmt->execute([$username, $encryptedPassword, $userId, $websiteId]);
            } else {
                // Insert new credentials
                $stmt = $pdo->prepare("
                    INSERT INTO wordpress_credentials (user_id, website_id, username, app_password, test_status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
                ");
                $result = $stmt->execute([$userId, $websiteId, $username, $encryptedPassword]);
            }
            
            $pdo->commit();
            return $result;
            
        } catch (\Exception $e) {
            $pdo->rollBack();
            error_log('Error saving WordPress credentials: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Test WordPress connection
     */
    public static function testConnection(int $userId, int $websiteId, string $username, string $appPassword): array
    {
        // Get website URL
        $pdo = Connection::getInstance();
        $stmt = $pdo->prepare("SELECT url FROM websites WHERE id = ?");
        $stmt->execute([$websiteId]);
        $website = $stmt->fetch();
        
        if (!$website) {
            return ['success' => false, 'error' => 'Sitio web no encontrado'];
        }
        
        $websiteUrl = rtrim($website['url'], '/');
        $testUrl = $websiteUrl . '/wp-json/wp/v2/users/me';
        
        try {
            // Create authentication header
            $auth = base64_encode($username . ':' . $appPassword);
            
            // Initialize cURL
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $testUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Basic ' . $auth,
                    'Content-Type: application/json',
                ],
                CURLOPT_SSL_VERIFYPEER => false, // For development - should be true in production
                CURLOPT_USERAGENT => 'AdminResh WordPress Connector/1.0'
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                self::updateTestStatus($userId, $websiteId, 'failed');
                return ['success' => false, 'error' => 'Error de conexión: ' . $error];
            }
            
            if ($httpCode === 200) {
                $userData = json_decode($response, true);
                if ($userData && isset($userData['id'])) {
                    self::updateTestStatus($userId, $websiteId, 'success');
                    return [
                        'success' => true, 
                        'message' => 'Conexión exitosa con WordPress',
                        'user_data' => [
                            'id' => $userData['id'],
                            'name' => $userData['name'] ?? 'Usuario',
                            'roles' => $userData['roles'] ?? []
                        ]
                    ];
                }
            }
            
            // Handle different HTTP error codes
            $errorMessage = match($httpCode) {
                401 => 'Credenciales incorrectas. Verifica tu usuario y contraseña de aplicación.',
                403 => 'Acceso denegado. El usuario no tiene permisos suficientes.',
                404 => 'WordPress REST API no encontrada. Verifica que WordPress esté actualizado.',
                default => 'Error de conexión (HTTP ' . $httpCode . '). Verifica la URL del sitio web.'
            };
            
            self::updateTestStatus($userId, $websiteId, 'failed');
            return ['success' => false, 'error' => $errorMessage];
            
        } catch (\Exception $e) {
            self::updateTestStatus($userId, $websiteId, 'failed');
            error_log('WordPress connection test error: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Error interno al probar la conexión'];
        }
    }

    /**
     * Update test status
     */
    private static function updateTestStatus(int $userId, int $websiteId, string $status): void
    {
        $pdo = Connection::getInstance();
        $stmt = $pdo->prepare("
            UPDATE wordpress_credentials 
            SET test_status = ?, last_tested = NOW() 
            WHERE user_id = ? AND website_id = ?
        ");
        $stmt->execute([$status, $userId, $websiteId]);
    }

    /**
     * Get all credentials for a user
     */
    public static function getByUser(int $userId): array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT wc.id, wc.user_id, wc.website_id, wc.username,
                   wc.is_active, wc.last_tested, wc.test_status, wc.created_at,
                   w.name as website_name, w.url as website_url
            FROM wordpress_credentials wc
            JOIN websites w ON wc.website_id = w.id
            WHERE wc.user_id = ? AND wc.is_active = 1
            ORDER BY w.name ASC
        ");
        $stmt->execute([$userId]);
        
        return $stmt->fetchAll();
    }

    /**
     * Delete credentials
     */
    public static function delete(int $userId, int $websiteId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE wordpress_credentials 
            SET is_active = 0, updated_at = NOW()
            WHERE user_id = ? AND website_id = ?
        ");
        
        return $stmt->execute([$userId, $websiteId]);
    }

    /**
     * Check if user has valid credentials for website
     */
    public static function hasValidCredentials(int $userId, int $websiteId): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM wordpress_credentials 
            WHERE user_id = ? AND website_id = ? AND is_active = 1 AND test_status = 'success'
        ");
        $stmt->execute([$userId, $websiteId]);
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
}
