<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\UserSession;
use App\Utils\JWT;
use App\Utils\Response;
use App\Utils\Security;

class AuthController
{
    /**
     * Login
     */
    public static function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['username']) || !isset($data['password'])) {
            Response::error('Username y password son requeridos', 'INVALID_DATA', null, 400);
        }

        // Find user
        $user = User::findByUsername($data['username']);

        if (!$user) {
            Response::error('Credenciales inválidas', 'INVALID_CREDENTIALS', null, 401);
        }

        // Verify password
        if (!User::verifyPassword($data['password'], $user['password'])) {
            Response::error('Credenciales inválidas', 'INVALID_CREDENTIALS', null, 401);
        }

        // Check if user is active
        if (!$user['is_active']) {
            Response::error('Usuario inactivo', 'USER_INACTIVE', null, 403);
        }

        try {
            // Generate tokens
            $accessToken = JWT::createAccessToken($user['id'], $user['username']);
            $refreshToken = JWT::createRefreshToken($user['id']);

            // Decode tokens to get JTI
            $accessPayload = JWT::verifyAccessToken($accessToken);
            $refreshPayload = JWT::verifyRefreshToken($refreshToken);

            // Create session
            $ip = Security::getClientIp();
            UserSession::create(
                $user['id'],
                $accessPayload['jti'],
                $refreshPayload['jti'] ?? null,
                [
                    'ip_address' => $ip,
                    'user_agent' => Security::getUserAgent(),
                ]
            );

            Response::success([
                'user' => User::getPublicData($user),
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
            ], 'Login exitoso');

        } catch (\Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            Response::serverError('Error al procesar el login');
        }
    }

    /**
     * Logout
     */
    public static function logout(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $jti = $_REQUEST['auth_jti'] ?? null;
            
            if ($jti) {
                UserSession::invalidateByJti($jti);
            }

            Response::success(null, 'Logout exitoso');

        } catch (\Exception $e) {
            error_log('Logout error: ' . $e->getMessage());
            Response::serverError('Error al cerrar sesión');
        }
    }

    /**
     * Refresh token
     */
    public static function refresh(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['refresh_token'])) {
            Response::error('Refresh token requerido', 'INVALID_DATA', null, 400);
        }

        try {
            $payload = JWT::verifyRefreshToken($data['refresh_token']);
            
            if (!$payload) {
                Response::error('Refresh token inválido', 'INVALID_TOKEN', null, 401);
            }

            $userId = $payload['user_id'];
            $user = User::findById($userId);

            if (!$user || !$user['is_active']) {
                Response::error('Usuario no encontrado o inactivo', 'USER_NOT_FOUND', null, 401);
            }

            // Generate new tokens
            $accessToken = JWT::createAccessToken($user['id'], $user['username']);
            $refreshToken = JWT::createRefreshToken($user['id']);

            // Update session
            $accessPayload = JWT::verifyAccessToken($accessToken);
            $refreshPayload = JWT::verifyRefreshToken($refreshToken);
            
            UserSession::updateJtis($payload['jti'], $accessPayload['jti'], $refreshPayload['jti']);

            Response::success([
                'user' => User::getPublicData($user),
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
            ], 'Token actualizado');

        } catch (\Exception $e) {
            error_log('Refresh token error: ' . $e->getMessage());
            Response::error('Error al actualizar token', 'REFRESH_ERROR', null, 401);
        }
    }

    /**
     * Get current user
     */
    public static function me(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        Response::success(User::getPublicData($user));
    }
}
