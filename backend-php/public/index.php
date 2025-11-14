<?php

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Set timezone
date_default_timezone_set('America/Mexico_City');

// Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

// CORS Middleware
use App\Middleware\CorsMiddleware;
CorsMiddleware::handle();

// Error handler
set_exception_handler(function ($exception) {
    error_log('Uncaught exception: ' . $exception->getMessage());
    error_log('Stack trace: ' . $exception->getTraceAsString());
    
    $config = require __DIR__ . '/../config/app.php';
    
    if ($config['debug']) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'SERVER_ERROR',
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTrace(),
            ]
        ]);
    } else {
        \App\Utils\Response::serverError('Error interno del servidor');
    }
});

// Route the request
use App\Router;

try {
    $router = new Router();
    $router->dispatch();
} catch (Exception $e) {
    error_log('Router error: ' . $e->getMessage());
    \App\Utils\Response::serverError();
}
