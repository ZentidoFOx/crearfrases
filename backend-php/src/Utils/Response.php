<?php

namespace App\Utils;

class Response
{
    /**
     * Send JSON response
     */
    private static function json(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Success response
     */
    public static function success($data = null, string $message = '', int $statusCode = 200): void
    {
        $response = [
            'success' => true,
            'timestamp' => date('c'),
        ];

        if ($message) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        self::json($response, $statusCode);
    }

    /**
     * Error response
     */
    public static function error(
        string $message,
        string $code = 'ERROR',
        $details = null,
        int $statusCode = 400
    ): void {
        $response = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
            'timestamp' => date('c'),
        ];

        if ($details !== null) {
            $response['error']['details'] = $details;
        }

        self::json($response, $statusCode);
    }

    /**
     * Validation error response
     */
    public static function validationError(array $errors): void
    {
        self::error(
            'Los datos proporcionados son inválidos',
            'VALIDATION_ERROR',
            $errors,
            422
        );
    }

    /**
     * Unauthorized response
     */
    public static function unauthorized(string $message = 'No autorizado'): void
    {
        self::error($message, 'UNAUTHORIZED', null, 401);
    }

    /**
     * Forbidden response
     */
    public static function forbidden(string $message = 'Acceso prohibido'): void
    {
        self::error($message, 'FORBIDDEN', null, 403);
    }

    /**
     * Not found response
     */
    public static function notFound(string $message = 'Recurso no encontrado'): void
    {
        self::error($message, 'NOT_FOUND', null, 404);
    }

    /**
     * Server error response
     */
    public static function serverError(string $message = 'Error interno del servidor'): void
    {
        self::error($message, 'SERVER_ERROR', null, 500);
    }

    /**
     * Rate limit exceeded response
     */
    public static function rateLimitExceeded(int $retryAfter = 900): void
    {
        header('Retry-After: ' . $retryAfter);
        self::error(
            'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
            'RATE_LIMIT_EXCEEDED',
            ['retry_after' => $retryAfter],
            429
        );
    }

    /**
     * Paginated response
     */
    public static function paginated(
        array $data,
        int $currentPage,
        int $perPage,
        int $total
    ): void {
        $totalPages = (int) ceil($total / $perPage);

        self::success([
            'items' => $data,
            'pagination' => [
                'current_page' => $currentPage,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $totalPages,
                'has_next' => $currentPage < $totalPages,
                'has_prev' => $currentPage > 1,
            ]
        ]);
    }
}
