<?php

namespace App\Models;

use PDO;
use App\Database\Connection;

class Website
{
    /**
     * Get all websites with creator information
     * @param int|null $createdBy Filter by creator (admin sees only their created websites)
     * @param bool $includeAll If true, ignores createdBy filter (for superadmin)
     */
    public static function getAll(?int $createdBy = null, bool $includeAll = false): array
    {
        $pdo = Connection::getInstance();
        
        $whereClause = "1=1";
        $params = [];
        
        // Filter by created_by for admins (not superadmin)
        if (!$includeAll && $createdBy !== null) {
            $whereClause .= " AND w.created_by = ?";
            $params[] = $createdBy;
        }
        
        $sql = "
            SELECT 
                w.id,
                w.name,
                w.url,
                w.app_password,
                w.description,
                w.is_active,
                w.connection_verified,
                w.last_verified_at,
                w.last_request_at,
                w.request_count,
                w.created_by,
                w.updated_by,
                w.created_at,
                w.updated_at,
                u_created.username as created_by_name,
                u_updated.username as updated_by_name
            FROM websites w
            LEFT JOIN users u_created ON w.created_by = u_created.id
            LEFT JOIN users u_updated ON w.updated_by = u_updated.id
            WHERE $whereClause
            ORDER BY w.created_at DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get a single website by ID
     */
    public static function findById(int $id): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT 
                w.*,
                u_created.username as created_by_name
            FROM websites w
            LEFT JOIN users u_created ON w.created_by = u_created.id
            WHERE w.id = ?
        ");
        
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Find website by URL
     */
    public static function findByUrl(string $url): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT * FROM websites 
            WHERE url = ? AND is_active = 1
        ");
        
        $stmt->execute([$url]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Create a new website
     */
    public static function create(array $data, int $userId): int
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            INSERT INTO websites (name, url, app_password, description, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['name'],
            $data['url'],
            $data['app_password'],
            $data['description'] ?? null,
            $data['is_active'] ?? true,
            $userId
        ]);
        
        return (int) $pdo->lastInsertId();
    }

    /**
     * Update a website
     */
    public static function update(int $id, array $data, int $userId): bool
    {
        $pdo = Connection::getInstance();
        
        $fields = [];
        $values = [];
        
        if (isset($data['name'])) {
            $fields[] = 'name = ?';
            $values[] = $data['name'];
        }
        
        if (isset($data['url'])) {
            $fields[] = 'url = ?';
            $values[] = $data['url'];
        }
        
        if (array_key_exists('description', $data)) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }
        
        if (isset($data['app_password'])) {
            $fields[] = 'app_password = ?';
            $values[] = $data['app_password'];
        }
        
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = ?';
            $values[] = $data['is_active'];
        }
        
        // Always update updated_by
        $fields[] = 'updated_by = ?';
        $values[] = $userId;
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        
        $sql = "UPDATE websites SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute($values);
    }

    /**
     * Delete a website
     */
    public static function delete(int $id): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("DELETE FROM websites WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Toggle active status
     */
    public static function toggleActive(int $id): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE websites 
            SET is_active = NOT is_active 
            WHERE id = ?
        ");
        
        return $stmt->execute([$id]);
    }

    /**
     * Verify connection to website
     */
    public static function verifyConnection(int $id): array
    {
        $website = self::findById($id);
        
        if (!$website) {
            return [
                'success' => false,
                'message' => 'Sitio web no encontrado'
            ];
        }
        
        // Construir URL del endpoint del plugin
        $url = rtrim($website['url'], '/') . '/wp-json/content-search/v1/search?query=test';
        
        // Verificar conexión mediante cURL (API pública, sin autenticación)
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        // Error de conexión
        if ($error) {
            return [
                'success' => false,
                'message' => "✗ Error de conexión: {$error}",
                'details' => [
                    'endpoint' => $url,
                    'error_type' => 'connection_error'
                ]
            ];
        }
        
        // Error HTTP
        if ($httpCode === 401) {
            return [
                'success' => false,
                'message' => "✗ Autenticación fallida. Verifica la contraseña de aplicación.",
                'details' => [
                    'http_code' => $httpCode,
                    'endpoint' => $url,
                    'error_type' => 'authentication_error'
                ]
            ];
        }
        
        if ($httpCode === 404) {
            return [
                'success' => false,
                'message' => "✗ Plugin no encontrado. Instala 'Content Search API' en WordPress.",
                'details' => [
                    'http_code' => $httpCode,
                    'endpoint' => $url,
                    'error_type' => 'plugin_not_found'
                ]
            ];
        }
        
        if ($httpCode < 200 || $httpCode >= 400) {
            return [
                'success' => false,
                'message' => "✗ Error HTTP {$httpCode}. Verifica la configuración.",
                'details' => [
                    'http_code' => $httpCode,
                    'endpoint' => $url,
                    'error_type' => 'http_error'
                ]
            ];
        }
        
        // Validar respuesta JSON
        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'message' => "✗ Respuesta inválida. El sitio no devuelve JSON válido.",
                'details' => [
                    'http_code' => $httpCode,
                    'endpoint' => $url,
                    'error_type' => 'invalid_json'
                ]
            ];
        }
        
        // Validar estructura de respuesta
        if (!isset($data['success']) || !isset($data['data'])) {
            return [
                'success' => false,
                'message' => "✗ Estructura de respuesta incorrecta. Actualiza el plugin.",
                'details' => [
                    'http_code' => $httpCode,
                    'endpoint' => $url,
                    'error_type' => 'invalid_structure'
                ]
            ];
        }
        
        // Conexión exitosa
        $pdo = Connection::getInstance();
        $stmt = $pdo->prepare("
            UPDATE websites 
            SET connection_verified = 1, last_verified_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        // Contar resultados disponibles
        $totalResults = isset($data['total_results']) ? $data['total_results'] : 0;
        
        return [
            'success' => true,
            'message' => "✓ Conexión exitosa con {$website['name']}",
            'details' => [
                'http_code' => $httpCode,
                'endpoint' => $url,
                'test_results' => $totalResults,
                'plugin_version' => 'Content Search API v1.0',
                'wordpress_detected' => true,
                'api_working' => $data['success'] === true
            ]
        ];
    }

    /**
     * Update request stats
     */
    public static function updateRequestStats(int $id): void
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE websites 
            SET request_count = request_count + 1,
                last_request_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$id]);
    }


    /**
     * Get public data (safe to return to client)
     */
    public static function getPublicData(array $website): array
    {
        $data = [
            'id' => (int)$website['id'],
            'name' => $website['name'],
            'url' => $website['url'],
            'app_password' => $website['app_password'],
            'description' => $website['description'] ?? null,
            'is_active' => (bool)$website['is_active'],
            'connection_verified' => (bool)($website['connection_verified'] ?? false),
            'last_verified_at' => $website['last_verified_at'] ?? null,
            'last_request_at' => $website['last_request_at'] ?? null,
            'request_count' => (int)($website['request_count'] ?? 0),
            'created_at' => $website['created_at'],
            'updated_at' => $website['updated_at'] ?? $website['created_at']
        ];

        // Add creator information if available
        if (isset($website['created_by'])) {
            $data['created_by'] = (int)$website['created_by'];
        }
        if (isset($website['created_by_name'])) {
            $data['created_by_name'] = $website['created_by_name'];
        }

        // Add updater information if available
        if (isset($website['updated_by']) && $website['updated_by']) {
            $data['updated_by'] = (int)$website['updated_by'];
        }
        if (isset($website['updated_by_name']) && $website['updated_by_name']) {
            $data['updated_by_name'] = $website['updated_by_name'];
        }

        return $data;
    }
}
