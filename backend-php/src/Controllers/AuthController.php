<?php

namespace App\Controllers;

use App\Models\User;
use App\Models\UserSession;
use App\Utils\JWT;
use App\Utils\Response;
use App\Utils\Security;
use App\Utils\RateLimiter;
use App\Validators\UserValidator;

class AuthController
{
    /**
     * Register a new user
     */
    public static function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Rate limiting
        $config = require __DIR__ . '/../../config/app.php';
        $ip = Security::getClientIp();
        
        if (!RateLimiter::check($ip, 'register', $config['rate_limit']['register'], $config['rate_limit']['window'])) {
            Response::rateLimitExceeded($config['rate_limit']['window']);
        }

        // Validate input
        $errors = UserValidator::validateRegister($data);
        if (!empty($errors)) {
            Response::validationError($errors);
        }

        // Check if email already exists
        if (User::emailExists($data['email'])) {
            Response::error('El email ya está registrado', 'EMAIL_EXISTS', null, 409);
        }

        try {
            // Create user
            $userId = User::create($data);
            $user = User::findById($userId);

            if (!$user) {
                Response::serverError('Error al crear el usuario');
            }

            // Generate tokens
            $accessToken = JWT::createAccessToken($user['id'], $user['email']);
            $refreshToken = JWT::createRefreshToken($user['id']);

            // Decode tokens to get JTI
            $accessPayload = JWT::verifyAccessToken($accessToken);
            $refreshPayload = JWT::verifyRefreshToken($refreshToken);

            // Create session
            $deviceInfo = Security::parseUserAgent(Security::getUserAgent());
            UserSession::create(
                $user['id'],
                $accessPayload['jti'],
                $refreshPayload['jti'],
                [
                    'ip_address' => $ip,
                    'user_agent' => Security::getUserAgent(),
                    'browser' => $deviceInfo['browser'],
                    'device_type' => $deviceInfo['device_type'],
                ]
            );

            // Update last login
            User::updateLastLogin($user['id'], $ip);

            Response::success([
                'user' => User::getPublicData($user),
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'token_type' => 'Bearer',
                'expires_in' => $config['jwt']['access_expiration'],
            ], 'Usuario registrado exitosamente', 201);

        } catch (\Exception $e) {
            error_log('Register error: ' . $e->getMessage());
            Response::serverError('Error al registrar el usuario');
        }
    }

    /**
     * Login user
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
            $config = require __DIR__ . '/../../config/app.php';
            
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
                'token_type' => 'Bearer',
                'expires_in' => $config['jwt']['access_expiration'],
            ], 'Inicio de sesión exitoso');

        } catch (\Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            Response::serverError('Error al iniciar sesión');
        }
    }

    /**
     * Logout user
     */
    public static function logout(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;
        $jti = $_REQUEST['auth_jti'] ?? null;

        if (!$user || !$jti) {
            Response::unauthorized();
        }

        try {
            // Invalidate session
            UserSession::invalidate($jti);

            Response::success(null, 'Sesión cerrada exitosamente');

        } catch (\Exception $e) {
            error_log('Logout error: ' . $e->getMessage());
            Response::serverError('Error al cerrar sesión');
        }
    }

    /**
     * Refresh access token
     */
    public static function refresh(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['refresh_token'])) {
            Response::error('Refresh token requerido', 'REFRESH_TOKEN_REQUIRED', null, 400);
        }

        // Verify refresh token
        $payload = JWT::verifyRefreshToken($data['refresh_token']);

        if (!$payload) {
            Response::error('Refresh token inválido o expirado', 'INVALID_REFRESH_TOKEN', null, 401);
        }

        try {
            // Find session
            $session = UserSession::findByRefreshJti($payload['jti']);

            if (!$session) {
                Response::error('Sesión no encontrada', 'SESSION_NOT_FOUND', null, 401);
            }

            // Get user
            $user = User::findById($payload['sub']);

            if (!$user || !$user['is_active']) {
                Response::error('Usuario no encontrado o inactivo', 'USER_INACTIVE', null, 401);
            }

            // Generate new tokens
            $config = require __DIR__ . '/../../config/app.php';
            $newAccessToken = JWT::createAccessToken($user['id'], $user['email']);
            $newRefreshToken = JWT::createRefreshToken($user['id']);

            // Decode new tokens to get JTI
            $newAccessPayload = JWT::verifyAccessToken($newAccessToken);
            $newRefreshPayload = JWT::verifyRefreshToken($newRefreshToken);

            // Update session with new tokens
            UserSession::updateTokens(
                $session['id'],
                $newAccessPayload['jti'],
                $newRefreshPayload['jti']
            );

            Response::success([
                'access_token' => $newAccessToken,
                'refresh_token' => $newRefreshToken,
                'token_type' => 'Bearer',
                'expires_in' => $config['jwt']['access_expiration'],
            ], 'Token renovado exitosamente');

        } catch (\Exception $e) {
            error_log('Refresh token error: ' . $e->getMessage());
            Response::serverError('Error al renovar el token');
        }
    }

    /**
     * Get authenticated user
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
