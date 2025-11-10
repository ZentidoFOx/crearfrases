<?php

namespace App\Controllers;

use App\Models\Article;
use App\Models\ArticleTranslation;
use App\Utils\Response;

class ArticleTranslationController
{
    /**
     * Get all translations for an article
     * GET /api/v1/articles/:id/translations
     */
    public static function getAll(int $articleId): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $article = Article::findById($articleId);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only see their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('No tienes acceso a este artículo');
            }

            $translations = ArticleTranslation::getByArticleId($articleId);
            
            $publicTranslations = array_map(function($translation) {
                return ArticleTranslation::getPublicData($translation);
            }, $translations);

            Response::success($publicTranslations);

        } catch (\Exception $e) {
            error_log('Get translations error: ' . $e->getMessage());
            Response::serverError('Error al obtener las traducciones');
        }
    }

    /**
     * Get specific translation
     * GET /api/v1/articles/:id/translations/:language
     */
    public static function getOne(int $articleId, string $language): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $article = Article::findById($articleId);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only see their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('No tienes acceso a este artículo');
            }

            $translation = ArticleTranslation::getByArticleIdAndLanguage($articleId, $language);

            if (!$translation) {
                Response::notFound('Traducción no encontrada');
            }

            Response::success(ArticleTranslation::getPublicData($translation));

        } catch (\Exception $e) {
            error_log('Get translation error: ' . $e->getMessage());
            Response::serverError('Error al obtener la traducción');
        }
    }

    /**
     * Create new translation
     * POST /api/v1/articles/:id/translations
     */
    public static function create(int $articleId): void
    {
        error_log("=== CREATE TRANSLATION DEBUG ===");
        error_log("Article ID: " . $articleId);
        
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            error_log("No user authenticated");
            Response::unauthorized();
            return;
        }
        
        error_log("User ID: " . $user['id']);

        $data = json_decode(file_get_contents('php://input'), true);
        error_log("Request data: " . json_encode($data));

        if (!$data) {
            error_log("Invalid data");
            Response::error('Datos inválidos', 'INVALID_DATA', null, 400);
            return;
        }

        // Validate required fields
        if (empty($data['language']) || empty($data['title']) || empty($data['keyword']) || empty($data['content'])) {
            error_log("Missing required fields");
            Response::error('Idioma, título, palabra clave y contenido son requeridos', 'VALIDATION_ERROR', null, 400);
            return;
        }

        try {
            $article = Article::findById($articleId);
            error_log("Article found: " . ($article ? 'YES' : 'NO'));

            if (!$article) {
                Response::notFound('Artículo no encontrado');
                return;
            }

            // Editors can only translate their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes traducir tus propios artículos');
                return;
            }

            // Check if translation already exists
            $existing = ArticleTranslation::getByArticleIdAndLanguage($articleId, $data['language']);
            error_log("Translation exists: " . ($existing ? 'YES' : 'NO'));
            
            if ($existing) {
                Response::error('Ya existe una traducción para este idioma', 'DUPLICATE_TRANSLATION', null, 400);
                return;
            }

            error_log("Creating translation...");
            $translationId = ArticleTranslation::create($articleId, $data);
            error_log("Translation created with ID: " . $translationId);
            
            $translation = ArticleTranslation::getByArticleIdAndLanguage($articleId, $data['language']);

            Response::success(
                ArticleTranslation::getPublicData($translation),
                'Traducción creada exitosamente',
                201
            );

        } catch (\Exception $e) {
            error_log('Create translation error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            Response::serverError('Error al crear la traducción: ' . $e->getMessage());
        }
    }

    /**
     * Update translation
     * PUT /api/v1/articles/:id/translations/:language
     */
    public static function update(int $articleId, string $language): void
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
            $article = Article::findById($articleId);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only update their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes modificar traducciones de tus propios artículos');
            }

            $translation = ArticleTranslation::getByArticleIdAndLanguage($articleId, $language);

            if (!$translation) {
                Response::notFound('Traducción no encontrada');
            }

            $success = ArticleTranslation::update($articleId, $language, $data);

            if (!$success) {
                Response::error('No se realizaron cambios', 'NO_CHANGES', null, 400);
            }

            $updatedTranslation = ArticleTranslation::getByArticleIdAndLanguage($articleId, $language);

            Response::success(
                ArticleTranslation::getPublicData($updatedTranslation),
                'Traducción actualizada exitosamente'
            );

        } catch (\Exception $e) {
            error_log('Update translation error: ' . $e->getMessage());
            Response::serverError('Error al actualizar la traducción');
        }
    }

    /**
     * Delete translation
     * DELETE /api/v1/articles/:id/translations/:language
     */
    public static function delete(int $articleId, string $language): void
    {
        $user = $_REQUEST['auth_user'] ?? null;

        if (!$user) {
            Response::unauthorized();
        }

        try {
            $article = Article::findById($articleId);

            if (!$article) {
                Response::notFound('Artículo no encontrado');
            }

            // Editors can only delete translations of their own articles
            if ($user['role_slug'] === 'editor' && $article['created_by'] != $user['id']) {
                Response::forbidden('Solo puedes eliminar traducciones de tus propios artículos');
            }

            $translation = ArticleTranslation::getByArticleIdAndLanguage($articleId, $language);

            if (!$translation) {
                Response::notFound('Traducción no encontrada');
            }

            ArticleTranslation::delete($articleId, $language);

            Response::success(null, 'Traducción eliminada exitosamente');

        } catch (\Exception $e) {
            error_log('Delete translation error: ' . $e->getMessage());
            Response::serverError('Error al eliminar la traducción');
        }
    }
}
