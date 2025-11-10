<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\UserSession;
use App\Utils\Response;
use App\Utils\Security;
use App\Validators\UserValidator;

class UserController
{
    /**
     * Get user profile
     */
    public static function getProfile(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        Response::success(User::getPublicData($user));
    }

    /**
     * Update user profile
     */
    public static function updateProfile(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Validate input
        $errors = UserValidator::validateProfileUpdate($data);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        try {
            // Update profile
            $success = User::updateProfile($user['id'], $data);

            if (!$success) {
                Response::error('No se realizaron cambios', 'NO_CHANGES', null, 400);
            }

            // Get updated user
            $updatedUser = User::findById($user['id']);

            Response::success(
                User::getPublicData($updatedUser),
                'Perfil actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Update profile error: ' . $e->getMessage());
            Response::serverError('Error al actualizar el perfil');
        }
    }

    /**
     * Change password
     */
    public static function changePassword(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Validate input
        $errors = UserValidator::validatePasswordChange($data);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        // Verify current password
        $fullUser = User::findByEmail($user['email']);
        
        if (!Security::verifyPassword($data['current_password'], $fullUser['password'])) {
            Response::error('La contraseña actual es incorrecta', 'INVALID_PASSWORD', null, 401);
        }

        try {
            // Update password
            $success = User::updatePassword($user['id'], $data['new_password']);

            if (!$success) {
                Response::serverError('Error al actualizar la contraseña');
            }

            // Invalidate all sessions except current
            $jti = $_REQUEST['auth_jti'] ?? null;
            if ($jti) {
                UserSession::invalidateAllUserSessions($user['id']);
            }

            Response::success(null, 'Contraseña actualizada exitosamente');

        } catch (\Exception $e) {
            error_log('Change password error: ' . $e->getMessage());
            Response::serverError('Error al cambiar la contraseña');
        }
    }

    /**
     * Delete user account
     */
    public static function deleteAccount(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Verify password before deleting
        if (!isset($data['password'])) {
            Response::error('Contraseña requerida para eliminar la cuenta', 'PASSWORD_REQUIRED', null, 400);
        }

        $fullUser = User::findByEmail($user['email']);
        
        if (!Security::verifyPassword($data['password'], $fullUser['password'])) {
            Response::error('Contraseña incorrecta', 'INVALID_PASSWORD', null, 401);
        }

        try {
            // Soft delete user
            User::delete($user['id']);

            // Invalidate all sessions
            UserSession::invalidateAllUserSessions($user['id']);

            Response::success(null, 'Cuenta eliminada exitosamente');

        } catch (\Exception $e) {
            error_log('Delete account error: ' . $e->getMessage());
            Response::serverError('Error al eliminar la cuenta');
        }
    }

    /**
     * Get user's active sessions
     */
    public static function getSessions(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $sessions = UserSession::getUserSessions($user['id']);

            Response::success($sessions);

        } catch (\Exception $e) {
            error_log('Get sessions error: ' . $e->getMessage());
            Response::serverError('Error al obtener las sesiones');
        }
    }

    /**
     * Delete a specific session
     */
    public static function deleteSession(int $sessionId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $success = UserSession::deleteById($sessionId, $user['id']);

            if (!$success) {
                Response::notFound('Sesión no encontrada');
            }

            Response::success(null, 'Sesión cerrada exitosamente');

        } catch (\Exception $e) {
            error_log('Delete session error: ' . $e->getMessage());
            Response::serverError('Error al cerrar la sesión');
        }
    }

    /**
     * Get all users (Admin)
     * Superadmins ven todos los usuarios
     * Admins solo ven los usuarios que ellos crearon
     */
    public static function getAllUsers(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para ver usuarios');
        }

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
        $search = $_GET['search'] ?? '';

        try {
            // Superadmin ve todos los usuarios
            $includeAll = ($user['role_slug'] === 'superadmin');
            // Admin solo ve los usuarios que él creó
            $createdBy = ($user['role_slug'] === 'admin') ? $user['id'] : null;
            
            $result = User::getAll($page, $perPage, $search, $createdBy, $includeAll);
            Response::success($result);

        } catch (\Exception $e) {
            error_log('Get all users error: ' . $e->getMessage());
            Response::serverError('Error al obtener los usuarios');
        }
    }

    /**
     * Create user (Admin)
     */
    public static function createUser(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para crear usuarios');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Check if username already exists
        if (!isset($data['username']) || empty($data['username'])) {
            Response::error('El username es requerido', 'INVALID_DATA', null, 400);
        }

        if (User::usernameExists($data['username'])) {
            Response::error('El username ya está registrado', 'USERNAME_EXISTS', null, 409);
        }

        if (!isset($data['password']) || empty($data['password'])) {
            Response::error('La contraseña es requerida', 'INVALID_DATA', null, 400);
        }

        // Los admins no pueden crear superadmins (role_id = 1)
        if ($user['role_slug'] === 'admin' && isset($data['role_id']) && $data['role_id'] == 1) {
            Response::forbidden('No tienes permisos para crear usuarios superadministrador');
        }

        // Guardar el ID del usuario que crea el nuevo usuario
        $data['created_by'] = $user['id'];

        try {
            $userId = User::create($data);
            $newUser = User::findById($userId);

            Response::success(
                User::getPublicData($newUser),
                'Usuario creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            error_log('Create user error: ' . $e->getMessage());
            Response::serverError('Error al crear el usuario');
        }
    }

    /**
     * Update user (Admin)
     */
    public static function updateUser(int $userId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para actualizar usuarios');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        try {
            $targetUser = User::findById($userId);

            if (!$targetUser) {
                Response::notFound('Usuario no encontrado');
            }

            // Los admins no pueden modificar superadmins
            if ($user['role_slug'] === 'admin' && $targetUser['role_slug'] === 'superadmin') {
                Response::forbidden('No puedes modificar un superadministrador');
            }

            // Los admins no pueden asignar rol de superadmin (role_id = 1)
            if ($user['role_slug'] === 'admin' && isset($data['role_id']) && $data['role_id'] == 1) {
                Response::forbidden('No tienes permisos para asignar el rol de superadministrador');
            }

            $success = User::updateById($userId, $data);

            if (!$success) {
                Response::error('No se realizaron cambios', 'NO_CHANGES', null, 400);
            }

            $updatedUser = User::findById($userId);

            Response::success(
                User::getPublicData($updatedUser),
                'Usuario actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Update user error: ' . $e->getMessage());
            Response::serverError('Error al actualizar el usuario');
        }
    }

    /**
     * Delete user (Admin)
     */
    public static function deleteUser(int $userId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para eliminar usuarios');
        }

        try {
            $targetUser = User::findById($userId);

            if (!$targetUser) {
                Response::notFound('Usuario no encontrado');
            }

            // Los admins no pueden eliminar superadmins
            if ($user['role_slug'] === 'admin' && $targetUser['role_slug'] === 'superadmin') {
                Response::forbidden('No puedes eliminar un superadministrador');
            }

            User::delete($userId);

            Response::success(null, 'Usuario eliminado exitosamente');

        } catch (\Exception $e) {
            error_log('Delete user error: ' . $e->getMessage());
            Response::serverError('Error al eliminar el usuario');
        }
    }

    /**
     * Toggle user status (Admin)
     */
    public static function toggleUserStatus(int $userId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para cambiar el estado de usuarios');
        }

        try {
            $targetUser = User::findById($userId);

            if (!$targetUser) {
                Response::notFound('Usuario no encontrado');
            }

            // Los admins no pueden modificar superadmins
            if ($user['role_slug'] === 'admin' && $targetUser['role_slug'] === 'superadmin') {
                Response::forbidden('No puedes modificar un superadministrador');
            }

            User::toggleStatus($userId);
            $updatedUser = User::findById($userId);

            Response::success(
                User::getPublicData($updatedUser),
                'Estado del usuario actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Toggle user status error: ' . $e->getMessage());
            Response::serverError('Error al cambiar el estado del usuario');
        }
    }

    /**
     * Get user statistics (personalized by role)
     */
    public static function getStats(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $stats = User::getUserStats($user['id'], $user['role_slug'] ?? 'editor');

            Response::success($stats);

        } catch (\Exception $e) {
            error_log('Get stats error: ' . $e->getMessage());
            Response::serverError('Error al obtener las estadísticas');
        }
    }

    /**
     * Get user's assigned websites
     */
    public static function getUserWebsites(int $userId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar permisos: Admin/Superadmin o el mismo usuario
        if (!in_array($user['role_slug'], ['admin', 'superadmin']) && $user['id'] != $userId) {
            Response::forbidden('No tienes permisos para ver los sitios web de este usuario');
        }

        try {
            $websites = User::getAssignedWebsites($userId);
            Response::success($websites);

        } catch (\Exception $e) {
            error_log('Get user websites error: ' . $e->getMessage());
            Response::serverError('Error al obtener los sitios web del usuario');
        }
    }

    /**
     * Assign website to user (Admin)
     */
    public static function assignWebsite(int $userId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para asignar sitios web');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['website_id'])) {
            Response::error('El ID del sitio web es requerido', 'INVALID_DATA', null, 400);
        }

        try {
            // Verificar que el usuario exista
            $targetUser = User::findById($userId);
            if (!$targetUser) {
                Response::notFound('Usuario no encontrado');
            }

            $websiteId = (int)$data['website_id'];
            $success = User::assignWebsite($userId, $websiteId, $user['id']);

            if (!$success) {
                Response::error('El sitio web ya está asignado a este usuario', 'ALREADY_ASSIGNED', null, 409);
            }

            Response::success(null, 'Sitio web asignado exitosamente', 201);

        } catch (\Exception $e) {
            error_log('Assign website error: ' . $e->getMessage());
            Response::serverError('Error al asignar el sitio web');
        }
    }

    /**
     * Unassign website from user (Admin)
     */
    public static function unassignWebsite(int $userId, int $websiteId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Verificar que el usuario sea admin o superadmin
        if (!in_array($user['role_slug'], ['admin', 'superadmin'])) {
            Response::forbidden('No tienes permisos para desasignar sitios web');
        }

        try {
            $success = User::unassignWebsite($userId, $websiteId);

            if (!$success) {
                Response::notFound('Asignación no encontrada');
            }

            Response::success(null, 'Sitio web desasignado exitosamente');

        } catch (\Exception $e) {
            error_log('Unassign website error: ' . $e->getMessage());
            Response::serverError('Error al desasignar el sitio web');
        }
    }
}
