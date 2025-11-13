<?php

namespace App\Controllers;

use App\Database\Connection;
use App\Utils\Response;

class DashboardController
{
    /**
     * Get user growth statistics by month
     * GET /api/v1/dashboard/user-growth?months=6
     */
    public static function getUserGrowth(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para ver estadísticas del dashboard');
        }

        try {
            $months = isset($_GET['months']) ? (int)$_GET['months'] : 6;
            $months = max(1, min(12, $months)); // Límite entre 1 y 12 meses

            $db = Connection::getInstance();
            
            $query = "
                SELECT 
                    DATE_FORMAT(created_at, '%b') as mes,
                    COUNT(*) as usuarios,
                    DATE_FORMAT(created_at, '%Y-%m-01') as fecha
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
                GROUP BY fecha, mes
                ORDER BY fecha ASC
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$months]);
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Convert numbers to integers
            foreach ($data as &$row) {
                $row['usuarios'] = (int)$row['usuarios'];
            }
            
            Response::success($data);
            
        } catch (\Exception $e) {
            error_log('Get user growth error: ' . $e->getMessage());
            Response::serverError('Error al obtener datos de crecimiento de usuarios');
        }
    }

    /**
     * Get API activity statistics by day
     * GET /api/v1/dashboard/api-activity?days=7
     */
    public static function getApiActivity(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para ver estadísticas del dashboard');
        }

        try {
            $days = isset($_GET['days']) ? (int)$_GET['days'] : 7;
            $days = max(1, min(30, $days)); // Límite entre 1 y 30 días

            $db = Connection::getInstance();
            
            // Try to get data from api_requests table first
            $query = "
                SELECT 
                    CASE DAYOFWEEK(created_at)
                        WHEN 1 THEN 'Dom'
                        WHEN 2 THEN 'Lun'
                        WHEN 3 THEN 'Mar'
                        WHEN 4 THEN 'Mié'
                        WHEN 5 THEN 'Jue'
                        WHEN 6 THEN 'Vie'
                        WHEN 7 THEN 'Sáb'
                    END as dia,
                    COUNT(*) as llamadas,
                    DATE(created_at) as fecha
                FROM api_requests
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY fecha, dia
                ORDER BY fecha ASC
            ";
            
            try {
                $stmt = $db->prepare($query);
                $stmt->execute([$days]);
                $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            } catch (\PDOException $e) {
                // If api_requests table doesn't exist, use websites table
                $query = "
                    SELECT 
                        CASE DAYOFWEEK(last_request_at)
                            WHEN 1 THEN 'Dom'
                            WHEN 2 THEN 'Lun'
                            WHEN 3 THEN 'Mar'
                            WHEN 4 THEN 'Mié'
                            WHEN 5 THEN 'Jue'
                            WHEN 6 THEN 'Vie'
                            WHEN 7 THEN 'Sáb'
                        END as dia,
                        SUM(request_count) as llamadas,
                        DATE(last_request_at) as fecha
                    FROM websites
                    WHERE last_request_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                        AND last_request_at IS NOT NULL
                    GROUP BY fecha, dia
                    ORDER BY fecha ASC
                ";
                
                $stmt = $db->prepare($query);
                $stmt->execute([$days]);
                $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            }
            
            // Convert numbers to integers
            foreach ($data as &$row) {
                $row['llamadas'] = (int)$row['llamadas'];
            }
            
            Response::success($data);
            
        } catch (\Exception $e) {
            error_log('Get API activity error: ' . $e->getMessage());
            Response::serverError('Error al obtener datos de actividad API');
        }
    }

    /**
     * Get dashboard overview statistics
     * GET /api/v1/dashboard/overview
     */
    public static function getOverview(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Check if user is superadmin or admin
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('No tienes permisos para ver estadísticas del dashboard');
        }

        try {
            $db = Connection::getInstance();
            
            $query = "
                SELECT 
                    -- USERS STATS
                    (SELECT COUNT(*) FROM users) as totalUsers,
                    (SELECT COUNT(*) FROM users WHERE is_active = 1) as activeUsers,
                    (SELECT COUNT(*) FROM users WHERE is_active = 0) as inactiveUsers,
                    (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as recentUsers,
                    
                    -- WEBSITES STATS
                    (SELECT COUNT(*) FROM websites) as totalWebsites,
                    (SELECT COUNT(*) FROM websites WHERE is_active = 1) as activeWebsites,
                    (SELECT COUNT(*) FROM websites WHERE connection_verified = 1) as verifiedWebsites,
                    (SELECT COALESCE(SUM(request_count), 0) FROM websites) as totalApiCalls,
                    
                    -- AI MODELS STATS
                    (SELECT COUNT(*) FROM ai_models) as totalAIModels,
                    (SELECT COUNT(*) FROM ai_models WHERE is_active = 1) as activeAIModels
            ";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            // Convert all values to integers
            foreach ($data as $key => $value) {
                $data[$key] = (int)$value;
            }
            
            Response::success($data);
            
        } catch (\Exception $e) {
            error_log('Get dashboard overview error: ' . $e->getMessage());
            Response::serverError('Error al obtener resumen del dashboard');
        }
    }
}
