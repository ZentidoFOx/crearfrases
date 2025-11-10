<?php

namespace App\Middleware;

use App\Models\User;
use App\Models\UserSession;
use App\Utils\JWT;
use App\Utils\Response;

class AuthMiddleware
{
    public static function handle(): void
    {
        // Get authorization header
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader) {
            Response::unauthorized('Token de autenticación no proporcionado');
        }

        // Extract token
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            Response::unauthorized('Formato de token inválido');
        }

        $token = $matches[1];

        // Verify token
        $payload = JWT::verifyAccessToken($token);

        if (!$payload) {
            Response::unauthorized('Token inválido o expirado');
        }

        // Verify session exists
        $session = UserSession::findByJti($payload['jti']);

        if (!$session) {
            Response::unauthorized('Sesión no válida');
        }

        // Get user
        $user = User::findById($payload['sub']);

        if (!$user) {
            Response::unauthorized('Usuario no encontrado');
        }

        if (!$user['is_active']) {
            Response::forbidden('Cuenta desactivada');
        }

        // Update session activity
        UserSession::updateActivity($payload['jti']);

        // Store user in request
        $_REQUEST['auth_user'] = $user;
        $_REQUEST['auth_jti'] = $payload['jti'];
    }
}
