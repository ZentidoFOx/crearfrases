<?php

namespace App\Models;

use PDO;
use App\Database\Connection;

class AIModel
{
    /**
     * Get all AI models with creator information
     * @param int|null $createdBy Filter by creator (admin sees only their created models)
     * @param bool $includeAll If true, ignores createdBy filter (for superadmin)
     */
    public static function getAll(?int $createdBy = null, bool $includeAll = false): array
    {
        $pdo = Connection::getInstance();
        
        $whereClause = "1=1";
        $params = [];
        
        // Filter by created_by for admins (not superadmin)
        if (!$includeAll && $createdBy !== null) {
            $whereClause .= " AND am.created_by = ?";
            $params[] = $createdBy;
        }
        
        $sql = "
            SELECT 
                am.id,
                am.name,
                am.provider,
                CONCAT(SUBSTRING(am.api_key, 1, 4), '***', SUBSTRING(am.api_key, -4)) as api_key_masked,
                am.endpoint,
                am.description,
                am.is_active,
                am.created_by,
                am.updated_by,
                am.created_at,
                am.updated_at,
                u_created.username as created_by_name,
                u_updated.username as updated_by_name
            FROM ai_models am
            LEFT JOIN users u_created ON am.created_by = u_created.id
            LEFT JOIN users u_updated ON am.updated_by = u_updated.id
            WHERE $whereClause
            ORDER BY am.is_active DESC, am.created_at DESC
        ";
        
        // Debug logging
        error_log('AIModel::getAll() - includeAll: ' . ($includeAll ? 'true' : 'false') . 
                 ', createdBy: ' . ($createdBy ?? 'NULL'));
        error_log('AIModel::getAll() - WHERE: ' . $whereClause);
        error_log('AIModel::getAll() - PARAMS: ' . json_encode($params));
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log('AIModel::getAll() - Query returned ' . count($results) . ' rows');
        foreach ($results as $row) {
            error_log('  - Model ID: ' . $row['id'] . ', Name: ' . $row['name'] . ', Created by: ' . $row['created_by']);
        }
        
        return $results;
    }

    /**
     * Get a single AI model by ID
     */
    public static function findById(int $id): ?array
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                provider,
                api_key,
                endpoint,
                description,
                is_active,
                created_by,
                updated_by,
                created_at,
                updated_at
            FROM ai_models
            WHERE id = ?
        ");
        
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Get active AI models only
     * @param int|null $createdBy Filter by creator (null = all active models)
     */
    public static function getActive(?int $createdBy = null): array
    {
        $pdo = Connection::getInstance();
        
        $whereClause = "is_active = 1";
        $params = [];
        
        // Filter by creator if specified
        if ($createdBy !== null) {
            $whereClause .= " AND created_by = ?";
            $params[] = $createdBy;
        }
        
        $sql = "
            SELECT 
                id,
                name,
                provider,
                endpoint,
                description
            FROM ai_models
            WHERE $whereClause
            ORDER BY name ASC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get active AI model by provider
     * Returns the first active model for the given provider
     * @param string $provider The AI provider (Google, OpenAI, etc.)
     * @param int|null $createdBy Filter by creator (null = all active models)
     */
    public static function getActiveByProvider(string $provider, ?int $createdBy = null): ?array
    {
        $pdo = Connection::getInstance();
        
        $whereClause = "provider = ? AND is_active = 1";
        $params = [$provider];
        
        // Filter by creator if specified
        if ($createdBy !== null) {
            $whereClause .= " AND created_by = ?";
            $params[] = $createdBy;
        }
        
        $sql = "
            SELECT 
                id,
                name,
                provider,
                api_key,
                endpoint,
                description,
                is_active,
                created_at,
                updated_at
            FROM ai_models
            WHERE $whereClause
            ORDER BY created_at DESC
            LIMIT 1
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Create a new AI model
     */
    public static function create(array $data, int $userId): int
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            INSERT INTO ai_models (name, provider, api_key, endpoint, description, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['name'],
            $data['provider'],
            $data['api_key'],
            $data['endpoint'] ?? null,
            $data['description'] ?? null,
            $data['is_active'] ?? true,
            $userId
        ]);
        
        return (int) $pdo->lastInsertId();
    }

    /**
     * Update an AI model
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
        
        if (isset($data['provider'])) {
            $fields[] = 'provider = ?';
            $values[] = $data['provider'];
        }
        
        if (isset($data['api_key']) && !empty($data['api_key'])) {
            $fields[] = 'api_key = ?';
            $values[] = $data['api_key'];
        }
        
        if (array_key_exists('endpoint', $data)) {
            $fields[] = 'endpoint = ?';
            $values[] = $data['endpoint'];
        }
        
        if (array_key_exists('description', $data)) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
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
        
        $sql = "UPDATE ai_models SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute($values);
    }

    /**
     * Delete an AI model
     */
    public static function delete(int $id): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("DELETE FROM ai_models WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Toggle active status
     */
    public static function toggleActive(int $id): bool
    {
        $pdo = Connection::getInstance();
        
        $stmt = $pdo->prepare("
            UPDATE ai_models 
            SET is_active = NOT is_active 
            WHERE id = ?
        ");
        
        return $stmt->execute([$id]);
    }

    /**
     * Test connection to AI model
     * Returns array with success status and message
     */
    public static function testConnection(int $id): array
    {
        $model = self::findById($id);
        
        if (!$model) {
            return [
                'success' => false,
                'message' => 'Modelo no encontrado'
            ];
        }
        
        if (empty($model['api_key'])) {
            return [
                'success' => false,
                'message' => 'API Key no configurada'
            ];
        }
        
        // Test connection based on provider
        try {
            switch ($model['provider']) {
                case 'OpenAI':
                    return self::testOpenAI($model);
                
                case 'Google':
                    return self::testGoogle($model);
                
                case 'Anthropic':
                    return self::testAnthropic($model);
                
                case 'Meta':
                case 'Mistral':
                default:
                    // For other providers, do basic endpoint check
                    return self::testGenericEndpoint($model);
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => "✗ Error de conexión: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Test OpenAI API connection
     */
    private static function testOpenAI(array $model): array
    {
        $endpoint = $model['endpoint'] ?: 'https://api.openai.com/v1';
        $url = rtrim($endpoint, '/') . '/models';
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $model['api_key'],
                'Content-Type: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'message' => "✗ Error de red: {$error}"
            ];
        }
        
        if ($httpCode === 200) {
            return [
                'success' => true,
                'message' => "✓ Conexión exitosa con {$model['name']}. API Key válida."
            ];
        } else if ($httpCode === 401) {
            return [
                'success' => false,
                'message' => "✗ API Key inválida o no autorizada"
            ];
        } else {
            return [
                'success' => false,
                'message' => "✗ Error HTTP {$httpCode}. Verifica tu configuración."
            ];
        }
    }
    
    /**
     * Test Google Gemini API connection
     */
    private static function testGoogle(array $model): array
    {
        $endpoint = $model['endpoint'] ?: 'https://generativelanguage.googleapis.com/v1';
        $url = rtrim($endpoint, '/') . '/models?key=' . $model['api_key'];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'message' => "✗ Error de red: {$error}"
            ];
        }
        
        if ($httpCode === 200) {
            return [
                'success' => true,
                'message' => "✓ Conexión exitosa con {$model['name']}. API Key válida."
            ];
        } else if ($httpCode === 400 || $httpCode === 403) {
            return [
                'success' => false,
                'message' => "✗ API Key inválida o sin permisos"
            ];
        } else {
            return [
                'success' => false,
                'message' => "✗ Error HTTP {$httpCode}. Verifica tu configuración."
            ];
        }
    }
    
    /**
     * Test Anthropic Claude API connection
     */
    private static function testAnthropic(array $model): array
    {
        $endpoint = $model['endpoint'] ?: 'https://api.anthropic.com/v1';
        $url = rtrim($endpoint, '/') . '/messages';
        
        // Anthropic requires a minimal request to test
        $data = [
            'model' => 'claude-3-haiku-20240307',
            'max_tokens' => 1,
            'messages' => [
                ['role' => 'user', 'content' => 'test']
            ]
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'x-api-key: ' . $model['api_key'],
                'anthropic-version: 2023-06-01',
                'Content-Type: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'message' => "✗ Error de red: {$error}"
            ];
        }
        
        if ($httpCode === 200) {
            return [
                'success' => true,
                'message' => "✓ Conexión exitosa con {$model['name']}. API Key válida."
            ];
        } else if ($httpCode === 401 || $httpCode === 403) {
            return [
                'success' => false,
                'message' => "✗ API Key inválida o sin permisos"
            ];
        } else {
            return [
                'success' => false,
                'message' => "✗ Error HTTP {$httpCode}. Verifica tu configuración."
            ];
        }
    }
    
    /**
     * Test generic endpoint
     */
    private static function testGenericEndpoint(array $model): array
    {
        $endpoint = $model['endpoint'];
        
        if (empty($endpoint)) {
            return [
                'success' => false,
                'message' => "✗ Endpoint no configurado para {$model['name']}"
            ];
        }
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_NOBODY => true
        ]);
        
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            return [
                'success' => false,
                'message' => "✗ No se puede conectar al endpoint: {$error}"
            ];
        }
        
        if ($httpCode >= 200 && $httpCode < 500) {
            return [
                'success' => true,
                'message' => "✓ Endpoint accesible para {$model['name']}"
            ];
        }
        
        return [
            'success' => false,
            'message' => "✗ Endpoint no responde correctamente (HTTP {$httpCode})"
        ];
    }

    /**
     * Get public data (safe to return to client)
     */
    public static function getPublicData(array $model): array
    {
        $data = [
            'id' => (int)$model['id'],
            'name' => $model['name'],
            'provider' => $model['provider'],
            'api_key' => isset($model['api_key_masked']) 
                ? $model['api_key_masked'] 
                : (isset($model['api_key']) 
                    ? self::maskApiKey($model['api_key']) 
                    : '***'),
            'endpoint' => $model['endpoint'] ?? null,
            'description' => $model['description'] ?? null,
            'is_active' => (bool)$model['is_active'],
            'created_at' => $model['created_at'],
            'updated_at' => $model['updated_at'] ?? $model['created_at']
        ];

        // Add creator information if available
        if (isset($model['created_by'])) {
            $data['created_by'] = (int)$model['created_by'];
        }
        if (isset($model['created_by_name'])) {
            $data['created_by_name'] = $model['created_by_name'];
        }
        if (isset($model['created_by_email'])) {
            $data['created_by_email'] = $model['created_by_email'];
        }

        // Add updater information if available
        if (isset($model['updated_by']) && $model['updated_by']) {
            $data['updated_by'] = (int)$model['updated_by'];
        }
        if (isset($model['updated_by_name']) && $model['updated_by_name']) {
            $data['updated_by_name'] = $model['updated_by_name'];
        }

        return $data;
    }

    /**
     * Mask API key for security
     */
    private static function maskApiKey(string $apiKey): string
    {
        if (strlen($apiKey) <= 8) {
            return '***';
        }
        
        return substr($apiKey, 0, 4) . '***' . substr($apiKey, -4);
    }
}
