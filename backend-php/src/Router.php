<?php

namespace App;

use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class Router
{
    private array $routes = [];

    public function __construct()
    {
        $this->loadRoutes();
    }

    private function loadRoutes(): void
    {
        $routes = require __DIR__ . '/Routes/api.php';
        $this->routes = $routes;
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Try public routes first
        foreach ($this->routes['public'] as $route) {
            if ($this->matchRoute($route[0], $route[1], $method, $path)) {
                $this->executeRoute($route[2], []);
                return;
            }
        }

        // Try protected routes (require authentication)
        foreach ($this->routes['protected'] as $route) {
            $params = [];
            if ($this->matchRoute($route[0], $route[1], $method, $path, $params)) {
                // Run authentication middleware
                AuthMiddleware::handle();
                
                $this->executeRoute($route[2], $params);
                return;
            }
        }

        // No route found
        Response::notFound('Endpoint no encontrado');
    }

    private function matchRoute(string $routeMethod, string $routePath, string $requestMethod, string $requestPath, array &$params = []): bool
    {
        // Method must match
        if ($routeMethod !== $requestMethod) {
            return false;
        }

        // Convert route pattern to regex
        $pattern = preg_replace('/\/:([^\/]+)/', '/(?P<$1>[^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        // Match path
        if (preg_match($pattern, $requestPath, $matches)) {
            // Extract named parameters
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }
            return true;
        }

        return false;
    }

    private function executeRoute(array $handler, array $params): void
    {
        [$controller, $method] = $handler;

        if (!class_exists($controller)) {
            Response::serverError('Controlador no encontrado');
        }

        if (!method_exists($controller, $method)) {
            Response::serverError('Método no encontrado');
        }

        // Call controller method with params
        if (!empty($params)) {
            call_user_func([$controller, $method], ...array_values($params));
        } else {
            call_user_func([$controller, $method]);
        }
    }
}
