<?php

use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\AIModelController;
use App\Controllers\AIGenerationController;
use App\Controllers\WebsiteController;
use App\Controllers\DashboardController;
use App\Controllers\ArticleController;
use App\Controllers\ArticleTranslationController;

return [
    // Public routes (no authentication required)
    'public' => [
        ['POST', '/api/v1/auth/register', [AuthController::class, 'register']],
        ['POST', '/api/v1/auth/login', [AuthController::class, 'login']],
        ['POST', '/api/v1/auth/refresh', [AuthController::class, 'refresh']],
    ],

    // Protected routes (authentication required)
    'protected' => [
        // Auth routes
        ['POST', '/api/v1/auth/logout', [AuthController::class, 'logout']],
        ['GET', '/api/v1/auth/me', [AuthController::class, 'me']],

        // User profile routes
        ['GET', '/api/v1/user/profile', [UserController::class, 'getProfile']],
        ['PUT', '/api/v1/user/profile', [UserController::class, 'updateProfile']],
        ['PUT', '/api/v1/user/password', [UserController::class, 'changePassword']],
        ['DELETE', '/api/v1/user/account', [UserController::class, 'deleteAccount']],

        // User sessions routes
        ['GET', '/api/v1/user/sessions', [UserController::class, 'getSessions']],
        ['DELETE', '/api/v1/user/sessions/:id', [UserController::class, 'deleteSession']],
        
        // User stats
        ['GET', '/api/v1/user/stats', [UserController::class, 'getStats']],

        // Admin user management routes
        ['GET', '/api/v1/admin/users', [UserController::class, 'getAllUsers']],
        ['POST', '/api/v1/admin/users', [UserController::class, 'createUser']],
        ['PUT', '/api/v1/admin/users/:id', [UserController::class, 'updateUser']],
        ['DELETE', '/api/v1/admin/users/:id', [UserController::class, 'deleteUser']],
        ['PUT', '/api/v1/admin/users/:id/toggle-status', [UserController::class, 'toggleUserStatus']],

        // User websites assignment routes
        ['GET', '/api/v1/users/:id/websites', [UserController::class, 'getUserWebsites']],
        ['POST', '/api/v1/users/:id/websites', [UserController::class, 'assignWebsite']],
        ['DELETE', '/api/v1/users/:userId/websites/:websiteId', [UserController::class, 'unassignWebsite']],

        // AI Models management routes (Superadmin and Admin)
        ['GET', '/api/v1/ai-models', [AIModelController::class, 'getAll']],
        ['GET', '/api/v1/ai-models/active', [AIModelController::class, 'getActive']],
        ['GET', '/api/v1/ai-models/provider-key', [AIModelController::class, 'getProviderKey']],
        ['GET', '/api/v1/ai-models/:id/with-key', [AIModelController::class, 'getOneWithApiKey']],
        ['GET', '/api/v1/ai-models/:id', [AIModelController::class, 'getOne']],
        ['POST', '/api/v1/ai-models', [AIModelController::class, 'create']],
        ['PUT', '/api/v1/ai-models/:id', [AIModelController::class, 'update']],
        ['DELETE', '/api/v1/ai-models/:id', [AIModelController::class, 'delete']],
        ['PUT', '/api/v1/ai-models/:id/toggle', [AIModelController::class, 'toggleActive']],
        ['POST', '/api/v1/ai-models/:id/test', [AIModelController::class, 'testConnection']],

        // AI Generation routes (All authenticated users)
        ['POST', '/api/v1/ai/generate', [AIGenerationController::class, 'generate']],

        // Websites management routes (Superadmin and Admin)
        ['GET', '/api/v1/websites', [WebsiteController::class, 'getAll']],
        ['GET', '/api/v1/websites/:id', [WebsiteController::class, 'getOne']],
        ['POST', '/api/v1/websites', [WebsiteController::class, 'create']],
        ['PUT', '/api/v1/websites/:id', [WebsiteController::class, 'update']],
        ['DELETE', '/api/v1/websites/:id', [WebsiteController::class, 'delete']],
        ['PUT', '/api/v1/websites/:id/toggle', [WebsiteController::class, 'toggleActive']],
        ['POST', '/api/v1/websites/:id/verify', [WebsiteController::class, 'verifyConnection']],
        ['POST', '/api/v1/websites/:id/increment-request', [WebsiteController::class, 'incrementRequest']],

        // Dashboard statistics routes (Superadmin and Admin)
        ['GET', '/api/v1/dashboard/user-growth', [DashboardController::class, 'getUserGrowth']],
        ['GET', '/api/v1/dashboard/api-activity', [DashboardController::class, 'getApiActivity']],
        ['GET', '/api/v1/dashboard/overview', [DashboardController::class, 'getOverview']],

        // Articles routes (All authenticated users)
        ['GET', '/api/v1/articles', [ArticleController::class, 'getAll']],
        ['GET', '/api/v1/articles/:id', [ArticleController::class, 'getOne']],
        ['POST', '/api/v1/articles', [ArticleController::class, 'create']],
        ['PUT', '/api/v1/articles/:id', [ArticleController::class, 'update']],
        ['DELETE', '/api/v1/articles/:id', [ArticleController::class, 'delete']],
        
        // Article workflow (Editors)
        ['POST', '/api/v1/articles/:id/submit', [ArticleController::class, 'submit']],
        
        // Article approval (Admins/Superadmins only)
        ['POST', '/api/v1/articles/:id/approve', [ArticleController::class, 'approve']],
        ['POST', '/api/v1/articles/:id/reject', [ArticleController::class, 'reject']],

        // Editor statistics
        ['GET', '/api/v1/editor/stats', [ArticleController::class, 'getEditorStats']],
        ['GET', '/api/v1/editor/productivity', [ArticleController::class, 'getMonthlyProductivity']],
        
        // Article translations routes
        ['GET', '/api/v1/articles/:id/translations', [ArticleTranslationController::class, 'getAll']],
        ['GET', '/api/v1/articles/:id/translations/:language', [ArticleTranslationController::class, 'getOne']],
        ['POST', '/api/v1/articles/:id/translations', [ArticleTranslationController::class, 'create']],
        ['PUT', '/api/v1/articles/:id/translations/:language', [ArticleTranslationController::class, 'update']],
        ['DELETE', '/api/v1/articles/:id/translations/:language', [ArticleTranslationController::class, 'delete']],
    ],
];
