<?php

namespace App\Controllers;

use App\Models\Article;
use App\Utils\Response;

class ArticleController
{
    /**
     * Get all articles
     * Editors: Only their own articles
     * Admins/Superadmins: All articles
     */
    public static function getAll(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            // Editors can only see their own articles
            $userId = ($user['role_slug'] === 'editor') ? $user['id'] : null;
            
            // Get filters from query params
            $status = $_GET['status'] ?? null;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $articles = Article::getAll($userId, $status, $limit, $offset);
            
            $publicArticles = array_map(function($article) {
                return Article::getPublicData($article);
            }, $articles);

            Response::success($publicArticles);

        } catch (\Exception $e) {
            error_log('Get articles error: ' . $e->getMessage());
            Response::serverError('Error al obtener los artículos');
        }
    }

    /**
     * Get single article by ID
     */
    public static function getOne(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $article = Article::findById($id);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only see their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('No tienes acceso a este artículo');
            }

            Response::success(Article::getPublicData($article));

        } catch (\Exception $e) {
            error_log('Get article error: ' . $e->getMessage());
            Response::serverError('Error al obtener el artículo');
        }
    }

    /**
     * Create new article
     */
    public static function create(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        // Validate required fields
        if (empty($data['title']) || empty($data['keyword']) || empty($data['content'])) {
            Response::error('Título, palabra clave y contenido son requeridos', 'VALIDATION_ERROR', null, 400);
        }

        try {
            $articleId = Article::create($data, $user['id']);
            $article = Article::findById($articleId);

            Response::success(
                Article::getPublicData($article),
                'Artículo creado exitosamente',
                201
            );

        } catch (\Exception $e) {
            error_log('Create article error: ' . $e->getMessage());
            Response::serverError('Error al crear el artículo');
        }
    }

    /**
     * Update article
     * Editors can only update their own draft articles
     */
    public static function update(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
        }

        try {
            $article = Article::findById($id);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only update their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes modificar tus propios artículos');
            }

            // Editors cannot update published articles
            if ($user['role_slug'] === 'editor' && $article['status'] === 'published') {
                Response::forbidden('No puedes modificar artículos publicados');
            }

            $success = Article::update($id, $data, $user['id']);

            if (!$success) {
                Response::error('No se realizaron cambios', 'NO_CHANGES', null, 400);
            }

            $updatedArticle = Article::findById($id);

            Response::success(
                Article::getPublicData($updatedArticle),
                'Artículo actualizado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Update article error: ' . $e->getMessage());
            Response::serverError('Error al actualizar el artículo');
        }
    }

    /**
     * Submit article for approval
     * Only for editors with draft articles
     */
    public static function submit(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $article = Article::findById($id);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Only editors can submit
            if ($user['role_slug'] !== 'editor') {
                Response::forbidden('Solo los editores pueden enviar artículos para aprobación');
            }

            // Must be the owner
            if ($article['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes enviar tus propios artículos');
            }

            // Must be draft
            if ($article['status'] !== 'draft') {
                Response::error('Solo puedes enviar artículos en borrador', 'INVALID_STATUS', null, 400);
            }

            $success = Article::submitForApproval($id, $user['id']);

            if (!$success) {
                Response::serverError('Error al enviar el artículo');
            }

            $updatedArticle = Article::findById($id);

            Response::success(
                Article::getPublicData($updatedArticle),
                'Artículo enviado para aprobación exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Submit article error: ' . $e->getMessage());
            Response::serverError('Error al enviar el artículo');
        }
    }

    /**
     * Approve article
     * Only for admins/superadmins
     */
    public static function approve(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Only admins can approve
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('Solo los administradores pueden aprobar artículos');
        }

        try {
            $article = Article::findById($id);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            if ($article['status'] !== 'pending') {
                Response::error('Solo puedes aprobar artículos pendientes', 'INVALID_STATUS', null, 400);
            }

            $success = Article::approve($id, $user['id']);

            if (!$success) {
                Response::serverError('Error al aprobar el artículo');
            }

            $updatedArticle = Article::findById($id);

            Response::success(
                Article::getPublicData($updatedArticle),
                'Artículo aprobado y publicado exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Approve article error: ' . $e->getMessage());
            Response::serverError('Error al aprobar el artículo');
        }
    }

    /**
     * Reject article
     * Only for admins/superadmins
     */
    public static function reject(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        // Only admins can reject
        if (!in_array($user['role_slug'] ?? '', ['superadmin', 'admin'])) {
            Response::forbidden('Solo los administradores pueden rechazar artículos');
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['reason']) || empty($data['reason'])) {
            Response::error('Debes proporcionar un motivo de rechazo', 'VALIDATION_ERROR', null, 400);
        }

        try {
            $article = Article::findById($id);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            if ($article['status'] !== 'pending') {
                Response::error('Solo puedes rechazar artículos pendientes', 'INVALID_STATUS', null, 400);
            }

            $success = Article::reject($id, $user['id'], $data['reason']);

            if (!$success) {
                Response::serverError('Error al rechazar el artículo');
            }

            $updatedArticle = Article::findById($id);

            Response::success(
                Article::getPublicData($updatedArticle),
                'Artículo rechazado'
            );

        } catch (\Exception $e) {
            error_log('Reject article error: ' . $e->getMessage());
            Response::serverError('Error al rechazar el artículo');
        }
    }

    /**
     * Delete article
     * Editors can only delete draft articles
     * Admins can delete any article
     */
    public static function delete(int $id): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $article = Article::findById($id);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only delete their own draft articles
            if ($user['role_slug'] === 'editor') {
                if ($article['created_by'] != $user['id']) {
                    Response::forbidden('Solo puedes eliminar tus propios artículos');
                }
                
                if ($article['status'] !== 'draft') {
                    Response::forbidden('Solo puedes eliminar borradores');
                }
            }

            Article::delete($id);

            Response::success(null, 'Artículo eliminado exitosamente');

        } catch (\Exception $e) {
            error_log('Delete article error: ' . $e->getMessage());
            Response::serverError('Error al eliminar el artículo');
        }
    }

    /**
     * Get editor statistics
     */
    public static function getEditorStats(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $stats = Article::getEditorStats($user['id']);

            Response::success($stats);

        } catch (\Exception $e) {
            error_log('Get editor stats error: ' . $e->getMessage());
            Response::serverError('Error al obtener estadísticas');
        }
    }

    /**
     * Get monthly productivity
     */
    public static function getMonthlyProductivity(): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $months = isset($_GET['months']) ? (int)$_GET['months'] : 6;
            $months = max(1, min(12, $months));

            $data = Article::getMonthlyProductivity($user['id'], $months);

            Response::success($data);

        } catch (\Exception $e) {
            error_log('Get productivity error: ' . $e->getMessage());
            Response::serverError('Error al obtener productividad');
        }
    }
}
