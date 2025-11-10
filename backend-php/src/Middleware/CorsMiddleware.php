<?php

namespace App\Middleware;

class CorsMiddleware
{
    public static function handle(): void
    {
        $config = require __DIR__ . '/../../config/app.php';
        $corsConfig = $config['cors'];

        // Get origin
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Check if origin is allowed
        if (in_array($origin, $corsConfig['allowed_origins']) || in_array('*', $corsConfig['allowed_origins'])) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }

        // Set other CORS headers
        header('Access-Control-Allow-Methods: ' . implode(', ', $corsConfig['allowed_methods']));
        header('Access-Control-Allow-Headers: ' . implode(', ', $corsConfig['allowed_headers']));
        
        if (!empty($corsConfig['exposed_headers'])) {
            header('Access-Control-Expose-Headers: ' . implode(', ', $corsConfig['exposed_headers']));
        }

        if ($corsConfig['credentials']) {
            header('Access-Control-Allow-Credentials: true');
        }

        if (isset($corsConfig['max_age'])) {
            header('Access-Control-Max-Age: ' . $corsConfig['max_age']);
        }

        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
