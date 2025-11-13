<?php

return [
    'env' => 'development',
    'debug' => true,
    'url' => 'http://backend-php.test',
    'frontend_url' => 'http://localhost:3000',
    
    // JWT Configuration
    'jwt' => [
        'secret' => 'adminresh_jwt_secret_key_change_in_production_2024',
        'access_expiration' => 86400, // 1 hour
        'refresh_expiration' => 604800, // 7 days
    ],
    
    // CORS Configuration
    'cors' => [
        'allowed_origins' => [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'https://crearfrases.turin.dev'
        ],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        'exposed_headers' => ['Authorization'],
        'max_age' => 86400,
        'credentials' => true,
    ],
    
    // Rate Limiting
    'rate_limit' => [
        'login' => 5,
        'register' => 3,
        'window' => 900, // 15 minutes
    ],
    
    // Security
    'security' => [
        'password_min_length' => 8,
        'max_login_attempts' => 5,
        'lockout_time' => 900, // 15 minutes
    ],
];
