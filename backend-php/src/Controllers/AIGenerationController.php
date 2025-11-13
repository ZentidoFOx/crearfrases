<?php

namespace App\Controllers;

use App\Models\AIModel;
use App\Utils\Response;
use App\Utils\Logger;

class AIGenerationController
{
    /**
     * Generate text using selected AI model
     * POST /api/v1/ai/generate
     */
    public static function generate(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            // Get request body
            $body = file_get_contents('php://input');
            $data = json_decode($body, true);

            if (!$data) {
                Response::error('Invalid JSON body', 'INVALID_REQUEST', null, 400);
            }

            // Validate required fields
            $modelId = $data['model_id'] ?? null;
            $prompt = $data['prompt'] ?? null;

            if (!$modelId || !$prompt) {
                Response::error('model_id and prompt are required', 'MISSING_FIELDS', null, 400);
            }

            // Get model
            $model = AIModel::findById($modelId);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            // Check if model is active
            if (!$model['is_active']) {
                Response::error('El modelo no está activo', 'MODEL_INACTIVE', null, 400);
            }

            // Permission checks based on role
            $roleSlug = $user['role_slug'] ?? '';
            
            if ($roleSlug === 'superadmin') {
                // Superadmin can use any model
            } elseif ($roleSlug === 'admin') {
                // Admin can only use their own models
                if ($model['created_by'] != $user['id']) {
                    Response::forbidden('Solo puedes usar tus propios modelos');
                }
            } elseif ($roleSlug === 'editor') {
                // Editor can use models created by their admin
                $editorCreatedBy = $user['created_by'] ?? null;
                if (!$editorCreatedBy || $model['created_by'] != $editorCreatedBy) {
                    Response::forbidden('Solo puedes usar modelos de tu administrador');
                }
            } else {
                Response::forbidden('No tienes permisos para usar modelos de IA');
            }

            // Get options
            $temperature = $data['temperature'] ?? 0.7;
            $maxTokens = $data['max_tokens'] ?? 4096;

            // Log request
            Logger::debug('AI GENERATE - Request', [
                'user_id' => $user['id'],
                'model_id' => $modelId,
                'model_name' => $model['name'],
                'provider' => $model['provider'],
                'prompt_length' => strlen($prompt)
            ]);

            // Generate content based on provider
            $content = self::generateContent($model, $prompt, $temperature, $maxTokens);

            Logger::debug('AI GENERATE - Success', [
                'response_length' => strlen($content)
            ]);

            Response::success([
                'content' => $content,
                'model' => [
                    'id' => $model['id'],
                    'name' => $model['name'],
                    'provider' => $model['provider']
                ]
            ]);

        } catch (\Exception $e) {
            Logger::error('AI Generation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            Response::serverError('Error al generar contenido con IA: ' . $e->getMessage());
        }
    }

    /**
     * Generate content using the appropriate provider
     */
    private static function generateContent(
        array $model,
        string $prompt,
        float $temperature,
        int $maxTokens
    ): string {
        $provider = strtolower($model['provider']);
        $apiKey = $model['api_key'];
        $endpoint = $model['endpoint'];

        switch ($provider) {
            case 'google':
                return self::generateWithGoogle($apiKey, $prompt, $temperature, $maxTokens);
            
            case 'openai':
                return self::generateWithOpenAI($apiKey, $endpoint, $prompt, $temperature, $maxTokens);
            
            case 'anthropic':
                return self::generateWithAnthropic($apiKey, $endpoint, $prompt, $temperature, $maxTokens);
            
            default:
                throw new \Exception("Provider '{$provider}' not supported");
        }
    }

    /**
     * Generate with Google Gemini
     */
    private static function generateWithGoogle(
        string $apiKey,
        string $prompt,
        float $temperature,
        int $maxTokens
    ): string {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={$apiKey}";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            Logger::error('Google API error', [
                'http_code' => $httpCode,
                'response' => $response
            ]);
            throw new \Exception("Google API error: HTTP {$httpCode}");
        }

        $data = json_decode($response, true);

        if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('Invalid response from Google API');
        }

        return $data['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * Generate with OpenAI
     */
    private static function generateWithOpenAI(
        string $apiKey,
        string $endpoint,
        string $prompt,
        float $temperature,
        int $maxTokens
    ): string {
        $url = rtrim($endpoint, '/') . '/chat/completions';

        $payload = [
            'model' => 'gpt-4-turbo-preview',
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => $temperature,
            'max_tokens' => $maxTokens
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            "Authorization: Bearer {$apiKey}"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            Logger::error('OpenAI API error', [
                'http_code' => $httpCode,
                'response' => $response
            ]);
            throw new \Exception("OpenAI API error: HTTP {$httpCode}");
        }

        $data = json_decode($response, true);

        if (!isset($data['choices'][0]['message']['content'])) {
            throw new \Exception('Invalid response from OpenAI API');
        }

        return $data['choices'][0]['message']['content'];
    }

    /**
     * Generate with Anthropic Claude
     */
    private static function generateWithAnthropic(
        string $apiKey,
        string $endpoint,
        string $prompt,
        float $temperature,
        int $maxTokens
    ): string {
        $url = rtrim($endpoint, '/') . '/messages';

        $payload = [
            'model' => 'claude-3-sonnet-20240229',
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => $temperature,
            'max_tokens' => $maxTokens
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'anthropic-version: 2023-06-01',
            "x-api-key: {$apiKey}"
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            Logger::error('Anthropic API error', [
                'http_code' => $httpCode,
                'response' => $response
            ]);
            throw new \Exception("Anthropic API error: HTTP {$httpCode}");
        }

        $data = json_decode($response, true);

        if (!isset($data['content'][0]['text'])) {
            throw new \Exception('Invalid response from Anthropic API');
        }

        return $data['content'][0]['text'];
    }
}
