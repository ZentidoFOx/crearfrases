<?php

namespace App\Controllers;

use App\Models\AIModel;
use App\Utils\Response;
use App\Utils\Logger;

class AIModelController
{
    /**
     * Get all AI models
     * Superadmins see all models
     * Admins see only their created models
     */
    public static function getAll(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $roleSlug = $user['role_slug'] ?? '';
            
            // Debug logging
            Logger::debug('GET ALL MODELS - Request', [
                'user_id' => $user['id'] ?? 'N/A',
                'role' => $roleSlug,
                'created_by' => $user['created_by'] ?? null
            ]);
            
            $createdBy = null;
            $includeAll = false;
            
            // Superadmin ve todos los modelos
            if ($roleSlug === 'superadmin') {
                $includeAll = true;
                Logger::debug('GET ALL MODELS - Superadmin: showing ALL models');
            }
            // Admin solo ve los modelos que él creó
            else if ($roleSlug === 'admin') {
                $createdBy = $user['id'];
                Logger::debug('GET ALL MODELS - Admin: filtering by created_by=' . $createdBy);
            }
            // Editor ve los modelos del admin que lo creó
            else if ($roleSlug === 'editor') {
                $createdBy = $user['created_by'] ?? null;
                Logger::debug('GET ALL MODELS - Editor: filtering by admin created_by=' . ($createdBy ?? 'NULL'));
                
                if (!$createdBy) {
                    Logger::warning('GET ALL MODELS - Editor without created_by');
                    Response::success([]);
                    return;
                }
            }
            
            $models = AIModel::getAll($createdBy, $includeAll);
            
            Logger::debug('GET ALL MODELS - Found ' . count($models) . ' models');
            
            $publicModels = array_map(function($model) {
                return AIModel::getPublicData($model);
            }, $models);

            Response::success($publicModels);

        } catch (\Exception $e) {
            Logger::error('Get AI models error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            Response::serverError('Error al obtener los modelos');
        }
    }

    /**
     * Get active AI models only
     * Filters models based on user role and creator relationship
     */
    public static function getActive(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $createdBy = null;
            
            // Superadmin: ve todos los modelos activos
            if ($user['role_slug'] === 'superadmin') {
                $createdBy = null;
            }
            // Admin: solo ve los modelos que él creó
            else if ($user['role_slug'] === 'admin') {
                $createdBy = $user['id'];
            }
            // Editor: ve los modelos del admin que lo creó
            else if ($user['role_slug'] === 'editor') {
                $createdBy = $user['created_by'] ?? null;
                
                if (!$createdBy) {
                    // Si el editor no tiene created_by, no puede ver modelos
                    Response::success([]);
                    return;
                }
            }
            
            $models = AIModel::getActive($createdBy);
            Response::success($models);

        } catch (\Exception $e) {
            error_log('Get active AI models error: ' . $e->getMessage());
            Response::serverError('Error al obtener los modelos activos');
        }
    }

    /**
     * Get a single AI model (public data with masked API key)
     */
    public static function getOne(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $model = AIModel::findById($id);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            Response::success(AIModel::getPublicData($model));

        } catch (\Exception $e) {
            error_log('Get AI model error: ' . $e->getMessage());
            Response::serverError('Error al obtener el modelo');
        }
    }

    /**
     * Get AI model with full API key (for server-side use only)
     * Used by Next.js API routes to generate content
     */
    public static function getOneWithApiKey(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $model = AIModel::findById($id);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            // Permission checks based on role
            $roleSlug = $user['role_slug'] ?? '';
            
            if ($roleSlug === 'superadmin') {
                // Superadmin can access any model
            } elseif ($roleSlug === 'admin') {
                // Admin can only access their own models
                if ($model['created_by'] != $user['id']) {
                    Response::forbidden('Solo puedes acceder a tus propios modelos');
                }
            } elseif ($roleSlug === 'editor') {
                // Editor can access models created by their admin
                $editorCreatedBy = $user['created_by'] ?? null;
                if (!$editorCreatedBy || $model['created_by'] != $editorCreatedBy) {
                    Response::forbidden('Solo puedes acceder a modelos de tu administrador');
                }
            } else {
                Response::forbidden('No tienes permisos para acceder a este modelo');
            }

            // Return model with FULL API key (NOT masked)
            Response::success([
                'id' => (int)$model['id'],
                'name' => $model['name'],
                'provider' => $model['provider'],
                'model_identifier' => $model['model_identifier'] ?? null,
                'api_key' => $model['api_key'], // ← FULL API KEY
                'endpoint' => $model['endpoint'] ?? null,
                'description' => $model['description'] ?? null,
                'is_active' => (bool)$model['is_active'],
                'created_by' => (int)$model['created_by'],
                'created_at' => $model['created_at'],
                'updated_at' => $model['updated_at']
            ]);

        } catch (\Exception $e) {
            Logger::error('Get AI model with API key error: ' . $e->getMessage());
            Response::serverError('Error al obtener el modelo');
        }
    }

    /**
     * Create a new AI model (Superadmin and Admin)
     */
    public static function create(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::error('No tienes permisos para realizar esta acción', 'FORBIDDEN', null, 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Validate required fields
        if (empty($data['name']) || empty($data['provider']) || empty($data['api_key'])) {
            Response::error('Nombre, proveedor y API Key son requeridos', 'VALIDATION_ERROR', null, 400);
        }

        try {
            $modelId = AIModel::create($data, $user['id']);
            $model = AIModel::findById($modelId);

            Response::success(
                AIModel::getPublicData($model),
                'Modelo creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            error_log('Create AI model error: ' . $e->getMessage());
            Response::serverError('Error al crear el modelo');
        }
    }

    /**
     * Update an AI model (Superadmin and Admin)
     * Admins can only update their own models
     */
    public static function update(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::error('No tienes permisos para realizar esta acción', 'FORBIDDEN', null, 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        try {
            $model = AIModel::findById($id);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            // Admins can only update their own models
            if ($user['role_slug'] === 'admin' && $model['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes modificar tus propios modelos');
            }

            $success = AIModel::update($id, $data, $user['id']);

            if (!$success) {
                Response::error('No se realizaron cambios', 'NO_CHANGES', null, 400);
            }

            $updatedModel = AIModel::findById($id);

            Response::success(
                AIModel::getPublicData($updatedModel),
                'Modelo actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Update AI model error: ' . $e->getMessage());
            Response::serverError('Error al actualizar el modelo');
        }
    }

    /**
     * Delete an AI model (Superadmin and Admin)
     * Admins can only delete their own models
     */
    public static function delete(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::error('No tienes permisos para realizar esta acción', 'FORBIDDEN', null, 403);
        }

        try {
            $model = AIModel::findById($id);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            // Admins can only delete their own models
            if ($user['role_slug'] === 'admin' && $model['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes eliminar tus propios modelos');
            }

            AIModel::delete($id);

            Response::success(null, 'Modelo eliminado exitosamente');

        } catch (\Exception $e) {
            error_log('Delete AI model error: ' . $e->getMessage());
            Response::serverError('Error al eliminar el modelo');
        }
    }

    /**
     * Toggle active status (Superadmin and Admin)
     * Admins can only toggle their own models
     */
    public static function toggleActive(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::error('No tienes permisos para realizar esta acción', 'FORBIDDEN', null, 403);
        }

        try {
            $model = AIModel::findById($id);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            // Admins can only toggle their own models
            if ($user['role_slug'] === 'admin' && $model['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes modificar tus propios modelos');
            }

            // Validate: Cannot activate model without API key
            if (!$model['is_active'] && empty($model['api_key'])) {
                Response::error(
                    'No se puede activar un modelo sin API Key configurada. Por favor, configura la API Key primero.',
                    'VALIDATION_ERROR',
                    null,
                    400
                );
            }

            AIModel::toggleActive($id);
            $updatedModel = AIModel::findById($id);

            Response::success(
                AIModel::getPublicData($updatedModel),
                'Estado actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Toggle AI model error: ' . $e->getMessage());
            Response::serverError('Error al cambiar el estado del modelo');
        }
    }

    /**
     * Test connection to AI model
     * Users can test models they have access to based on their role
     */
    public static function testConnection(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $model = AIModel::findById($id);

            if (!$model) {
                Response::notFound('Modelo no encontrado');
            }

            // Debug logging
            Logger::debug('TEST CONNECTION - Request', [
                'user_id' => $user['id'] ?? 'N/A',
                'role' => $user['role_slug'] ?? 'N/A',
                'user_created_by' => $user['created_by'] ?? null,
                'model_id' => $model['id'],
                'model_created_by' => $model['created_by']
            ]);

            // Permission checks based on role
            $roleSlug = $user['role_slug'] ?? '';
            
            if ($roleSlug === 'superadmin') {
                // Superadmin can test any model
                Logger::debug('TEST CONNECTION - Superadmin access granted');
            } elseif ($roleSlug === 'admin') {
                // Admin can only test their own models
                if ($model['created_by'] != $user['id']) {
                    Logger::warning('TEST CONNECTION - Admin forbidden', [
                        'model_created_by' => $model['created_by'],
                        'user_id' => $user['id']
                    ]);
                    Response::forbidden('Solo puedes probar tus propios modelos');
                }
                Logger::debug('TEST CONNECTION - Admin access granted');
            } elseif ($roleSlug === 'editor') {
                // Editor can test models created by their admin
                $editorCreatedBy = $user['created_by'] ?? null;
                Logger::debug('TEST CONNECTION - Editor check', [
                    'editor_created_by' => $editorCreatedBy,
                    'model_created_by' => $model['created_by']
                ]);
                if (!$editorCreatedBy || $model['created_by'] != $editorCreatedBy) {
                    Logger::warning('TEST CONNECTION - Editor forbidden');
                    Response::forbidden('Solo puedes probar modelos de tu administrador');
                }
                Logger::debug('TEST CONNECTION - Editor access granted');
            } else {
                Logger::warning('TEST CONNECTION - Unknown role: ' . $roleSlug);
                Response::forbidden('No tienes permisos para realizar esta acción');
            }

            $result = AIModel::testConnection($id);
            Response::success($result);

        } catch (\Exception $e) {
            error_log('Test AI model connection error: ' . $e->getMessage());
            Response::serverError('Error al probar la conexión');
        }
    }

    /**
     * Get active API key for a specific provider
     * Returns the API key and endpoint for content generation
     * Filters based on user role and creator relationship
     */
    public static function getProviderKey(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Get provider from query params
        $provider = $_GET['provider'] ?? 'Google';

        try {
            // Determine which creator to filter by
            $createdBy = null;
            
            if ($user['role_slug'] === 'superadmin') {
                $createdBy = null; // Ve todos
            } else if ($user['role_slug'] === 'admin') {
                $createdBy = $user['id']; // Solo sus modelos
            } else if ($user['role_slug'] === 'editor') {
                $createdBy = $user['created_by'] ?? null; // Modelos del admin que lo creó
                
                if (!$createdBy) {
                    Response::error(
                        "No tienes un administrador asignado. Por favor, contacta al superadmin.",
                        'NO_ADMIN_ASSIGNED',
                        null,
                        403
                    );
                    return;
                }
            }
            
            $model = AIModel::getActiveByProvider($provider, $createdBy);

            if (!$model) {
                Response::error(
                    "No hay un modelo de {$provider} activo configurado para tu cuenta. Por favor, contacta al administrador.",
                    'NO_ACTIVE_MODEL',
                    null,
                    404
                );
            }

            if (empty($model['api_key'])) {
                Response::error(
                    "El modelo de {$provider} no tiene API Key configurada. Por favor, contacta al administrador.",
                    'NO_API_KEY',
                    null,
                    400
                );
            }

            // Return full API key for content generation (only for authenticated users)
            Response::success([
                'api_key' => $model['api_key'],
                'endpoint' => $model['endpoint'],
                'model_name' => $model['name'],
                'provider' => $model['provider']
            ]);

        } catch (\Exception $e) {
            error_log('Get provider key error: ' . $e->getMessage());
            Response::serverError('Error al obtener la API key');
        }
    }
}
