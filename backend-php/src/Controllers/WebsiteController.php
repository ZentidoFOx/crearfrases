<?php

namespace App\Controllers;

use App\Models\Website;
use App\Utils\Response;

class WebsiteController
{
    /**
     * Get all websites
     * Superadmins see all websites
     * Admins see only their created websites
     */
    public static function getAll(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para gestionar sitios web');
        }

        try {
            // Superadmin ve todos los sitios
            $includeAll = ($user['role_slug'] === 'superadmin');
            // Admin solo ve los sitios que él creó
            $createdBy = ($user['role_slug'] === 'admin') ? $user['id'] : null;
            
            $websites = Website::getAll($createdBy, $includeAll);
            
            $publicWebsites = array_map(function($website) {
                return Website::getPublicData($website);
            }, $websites);

            Response::success($publicWebsites);

        } catch (\Exception $e) {
            error_log('Get websites error: ' . $e->getMessage());
            Response::serverError('Error al obtener los sitios web');
        }
    }

    /**
     * Get a single website
     */
    public static function getOne(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para ver sitios web');
        }

        try {
            $website = Website::findById($id);

            if (!$website) {
                Response::notFound('Sitio web no encontrado');
            }

            // Admins can only see their own websites
            if ($user['role_slug'] === 'admin' && $website['created_by'] != $user['id']) {
                Response::forbidden('No tienes acceso a este sitio web');
            }

            Response::success(Website::getPublicData($website));

        } catch (\Exception $e) {
            error_log('Get website error: ' . $e->getMessage());
            Response::serverError('Error al obtener el sitio web');
        }
    }

    /**
     * Create a new website (Superadmin and Admin)
     */
    public static function create(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para crear sitios web');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Validate required fields
        if (empty($data['name']) || empty($data['url']) || empty($data['app_password'])) {
            Response::error('Nombre, URL y contraseña de aplicación son requeridos', 'VALIDATION_ERROR', null, 400);
        }

        // Validate URL format
        if (!filter_var($data['url'], FILTER_VALIDATE_URL)) {
            Response::error('URL inválida', 'VALIDATION_ERROR', null, 400);
        }

        try {
            $websiteId = Website::create($data, $user['id']);
            $website = Website::findById($websiteId);

            Response::success(
                Website::getPublicData($website),
                'Sitio web creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            error_log('Create website error: ' . $e->getMessage());
            Response::serverError('Error al crear el sitio web');
        }
    }

    /**
     * Update a website (Superadmin and Admin)
     * Admins can only update their own websites
     */
    public static function update(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para actualizar sitios web');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Validate URL if provided
        if (isset($data['url']) && !filter_var($data['url'], FILTER_VALIDATE_URL)) {
            Response::error('URL inválida', 'VALIDATION_ERROR', null, 400);
        }

        try {
            $website = Website::findById($id);

            if (!$website) {
                Response::notFound('Sitio web no encontrado');
            }

            // Admins can only update their own websites
            if ($user['role_slug'] === 'admin' && $website['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes modificar tus propios sitios web');
            }

            $success = Website::update($id, $data, $user['id']);

            if (!$success) {
                Response::error('No se realizaron cambios', 'NO_CHANGES', null, 400);
            }

            $updatedWebsite = Website::findById($id);

            Response::success(
                Website::getPublicData($updatedWebsite),
                'Sitio web actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Update website error: ' . $e->getMessage());
            Response::serverError('Error al actualizar el sitio web');
        }
    }

    /**
     * Delete a website (Superadmin and Admin)
     * Admins can only delete their own websites
     */
    public static function delete(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para eliminar sitios web');
        }

        try {
            $website = Website::findById($id);

            if (!$website) {
                Response::notFound('Sitio web no encontrado');
            }

            // Admins can only delete their own websites
            if ($user['role_slug'] === 'admin' && $website['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes eliminar tus propios sitios web');
            }

            Website::delete($id);

            Response::success(null, 'Sitio web eliminado exitosamente');

        } catch (\Exception $e) {
            error_log('Delete website error: ' . $e->getMessage());
            Response::serverError('Error al eliminar el sitio web');
        }
    }

    /**
     * Toggle active status (Superadmin and Admin)
     * Admins can only toggle their own websites
     */
    public static function toggleActive(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para modificar sitios web');
        }

        try {
            $website = Website::findById($id);

            if (!$website) {
                Response::notFound('Sitio web no encontrado');
            }

            // Admins can only toggle their own websites
            if ($user['role_slug'] === 'admin' && $website['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes modificar tus propios sitios web');
            }

            Website::toggleActive($id);
            $updatedWebsite = Website::findById($id);

            Response::success(
                Website::getPublicData($updatedWebsite),
                'Estado actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Toggle website error: ' . $e->getMessage());
            Response::serverError('Error al cambiar el estado del sitio web');
        }
    }

    /**
     * Verify connection to website
     * Admins can only verify their own websites
     */
    public static function verifyConnection(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para verificar conexiones');
        }

        try {
            $website = Website::findById($id);

            if (!$website) {
                Response::notFound('Sitio web no encontrado');
            }

            // Admins can only verify their own websites
            if ($user['role_slug'] === 'admin' && $website['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes verificar tus propios sitios web');
            }

            $result = Website::verifyConnection($id);
            
            if ($result['success']) {
                $updatedWebsite = Website::findById($id);
                Response::success(
                    [
                        'website' => Website::getPublicData($updatedWebsite),
                        'details' => $result['details'] ?? null
                    ],
                    $result['message']
                );
            } else {
                Response::error(
                    $result['message'], 
                    'VERIFICATION_FAILED', 
                    ['details' => $result['details'] ?? null], 
                    400
                );
            }

        } catch (\Exception $e) {
            error_log('Verify connection error: ' . $e->getMessage());
            Response::serverError('Error al verificar la conexión');
        }
    }

    /**
     * Increment request count for a website
     * POST /api/v1/websites/:id/increment-request
     * This is called automatically when a website is accessed
     */
    public static function incrementRequest(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para realizar esta acción');
        }

        try {
            $website = Website::findById($id);

            if (!$website) {
                Response::notFound('Sitio web no encontrado');
            }

            // Admins can only increment their own websites
            if ($user['role_slug'] === 'admin' && $website['created_by'] != $user['id']) {
                Response::forbidden('No tienes acceso a este sitio web');
            }

            // Increment request count
            $db = \App\Database\Connection::getInstance();
            
            $query = "
                UPDATE websites 
                SET 
                    request_count = request_count + 1,
                    last_request_at = NOW()
                WHERE id = ?
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);

            // Log in api_requests if table exists
            try {
                $logQuery = "
                    INSERT INTO api_requests (
                        website_id, 
                        endpoint, 
                        method, 
                        status_code,
                        created_at
                    ) VALUES (?, ?, ?, ?, NOW())
                ";
                
                $logStmt = $db->prepare($logQuery);
                $logStmt->execute([
                    $id,
                    '/api/v1/websites/' . $id,
                    'GET',
                    200
                ]);
            } catch (\PDOException $e) {
                // Table doesn't exist, continue without error
            }

            // Get updated website
            $updatedWebsite = Website::findById($id);

            Response::success(
                [
                    'id' => (int)$updatedWebsite['id'],
                    'request_count' => (int)$updatedWebsite['request_count'],
                    'last_request_at' => $updatedWebsite['last_request_at']
                ],
                'Request count incremented'
            );

        } catch (\Exception $e) {
            error_log('Increment request error: ' . $e->getMessage());
            Response::serverError('Error al incrementar contador de requests');
        }
    }
}
