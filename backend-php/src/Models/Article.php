<?php

namespace App\Models;

use App\Database\Connection;
use PDO;

class Article
{
    /**
     * Get all articles (filters based on user role)
     */
    public static function getAll(?int $userId = null, string $status = null, int $limit = 50, int $offset = 0): array
    {
        $db = Connection::getInstance();
        
        $query = "
            SELECT 
                a.*,
                u.username as author_name,
                r.username as reviewer_name,
                p.username as publisher_name
            FROM articles a
            LEFT JOIN users u ON a.created_by = u.id
            LEFT JOIN users r ON a.reviewed_by = r.id
            LEFT JOIN users p ON a.published_by = p.id
            WHERE 1=1
        ";
        
        $params = [];
        
        // Filter by user (for editors)
        if ($userId) {
            $query .= " AND a.created_by = ?";
            $params[] = $userId;
        }
        
        // Filter by status
        if ($status) {
            $query .= " AND a.status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY a.updated_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get single article by ID
     */
    public static function findById(int $id): ?array
    {
        $db = Connection::getInstance();
        
        $query = "
            SELECT 
                a.*,
                u.username as author_name,
                r.username as reviewer_name,
                p.username as publisher_name
            FROM articles a
            LEFT JOIN users u ON a.created_by = u.id
            LEFT JOIN users r ON a.reviewed_by = r.id
            LEFT JOIN users p ON a.published_by = p.id
            WHERE a.id = ?
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Create new article
     */
    public static function create(array $data, int $userId): int
    {
        $db = Connection::getInstance();
        
        // Generate slug if not provided
        $slug = $data['slug'] ?? self::generateSlug($data['title']);
        
        // Convert arrays to JSON
        $keywordsJson = isset($data['keywords_array']) ? json_encode($data['keywords_array']) : null;
        $sectionsJson = isset($data['sections_json']) ? json_encode($data['sections_json']) : null;
        $seoData = isset($data['seo_data']) ? json_encode($data['seo_data']) : null;
        
        // Calculate word count if not provided
        $wordCount = $data['word_count'] ?? self::calculateWordCount($data['content']);
        
        // Preparar categorías de WordPress
        $categoriesJson = null;
        if (isset($data['wordpress_categories']) && is_array($data['wordpress_categories'])) {
            $categoriesJson = json_encode($data['wordpress_categories']);
        }
        
        $query = "
            INSERT INTO articles (
                title,
                h1_title,
                keyword,
                objective_phrase,
                keywords_array,
                slug,
                content,
                sections_json,
                meta_description,
                seo_data,
                word_count,
                status,
                website_id,
                language,
                content_type,
                wordpress_post_id,
                featured_image_url,
                featured_image_id,
                wordpress_categories,
                wordpress_status,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            $data['title'],
            $data['h1_title'] ?? $data['title'],
            $data['keyword'],
            $data['objective_phrase'] ?? null,
            $keywordsJson,
            $slug,
            $data['content'],
            $sectionsJson,
            $data['meta_description'] ?? null,
            $seoData,
            $wordCount,
            $data['status'] ?? 'draft',
            $data['website_id'] ?? null,
            $data['language'] ?? 'es',
            $data['content_type'] ?? 'planner',
            $data['wordpress_post_id'] ?? null,
            $data['featured_image_url'] ?? null,
            $data['featured_image_id'] ?? null,
            $categoriesJson,
            $data['wordpress_status'] ?? 'draft',
            $userId
        ]);
        
        return (int)$db->lastInsertId();
    }
    
    /**
     * Update article
     */
    public static function update(int $id, array $data, int $userId): bool
    {
        $db = Connection::getInstance();
        
        // 🔍 DEBUG: Log de datos recibidos para actualización
        error_log("[ARTICLE-UPDATE] ID: $id, User: $userId");
        error_log("[ARTICLE-UPDATE] Datos recibidos: " . json_encode($data));
        
        $fields = [];
        $params = [];
        
        if (isset($data['title'])) {
            $fields[] = "title = ?";
            $params[] = $data['title'];
        }
        
        if (isset($data['keyword'])) {
            $fields[] = "keyword = ?";
            $params[] = $data['keyword'];
        }
        
        if (isset($data['content'])) {
            $fields[] = "content = ?";
            $params[] = $data['content'];
        }
        
        if (isset($data['meta_description'])) {
            $fields[] = "meta_description = ?";
            $params[] = $data['meta_description'];
        }
        
        if (isset($data['status'])) {
            $fields[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (isset($data['wordpress_post_id'])) {
            $fields[] = "wordpress_post_id = ?";
            $params[] = $data['wordpress_post_id'];
        }
        
        if (isset($data['featured_image_url'])) {
            $fields[] = "featured_image_url = ?";
            $params[] = $data['featured_image_url'];
            error_log("[ARTICLE-UPDATE] 📸 featured_image_url: " . $data['featured_image_url']);
        }
        
        if (isset($data['featured_image_id'])) {
            $fields[] = "featured_image_id = ?";
            $params[] = $data['featured_image_id'];
            error_log("[ARTICLE-UPDATE] 📸 featured_image_id: " . $data['featured_image_id']);
        }
        
        if (isset($data['wordpress_categories'])) {
            $fields[] = "wordpress_categories = ?";
            $categoriesJson = is_array($data['wordpress_categories']) 
                ? json_encode($data['wordpress_categories']) 
                : $data['wordpress_categories'];
            $params[] = $categoriesJson;
            error_log("[ARTICLE-UPDATE] 📁 wordpress_categories JSON: " . $categoriesJson);
        }
        
        if (isset($data['wordpress_status'])) {
            $fields[] = "wordpress_status = ?";
            $params[] = $data['wordpress_status'];
        }
        
        // 🌍 IMPORTANTE: Manejar seo_data para traducciones
        if (isset($data['seo_data'])) {
            $fields[] = "seo_data = ?";
            $seoDataJson = is_array($data['seo_data']) 
                ? json_encode($data['seo_data']) 
                : $data['seo_data'];
            $params[] = $seoDataJson;
            
            error_log("[ARTICLE-UPDATE] 🌍 SEO_DATA detectado:");
            error_log("[ARTICLE-UPDATE] - Tipo: " . gettype($data['seo_data']));
            error_log("[ARTICLE-UPDATE] - Contenido: " . $seoDataJson);
            
            // Si contiene focus_keyword, logearlo específicamente
            if (is_array($data['seo_data']) && isset($data['seo_data']['focus_keyword'])) {
                error_log("[ARTICLE-UPDATE] 🎯 FOCUS_KEYWORD encontrado: " . $data['seo_data']['focus_keyword']);
            }
        }
        
        // Manejar otros campos SEO que pueden venir en las actualizaciones
        if (isset($data['h1_title'])) {
            $fields[] = "h1_title = ?";
            $params[] = $data['h1_title'];
        }
        
        if (isset($data['slug'])) {
            $fields[] = "slug = ?";
            $params[] = $data['slug'];
        }
        
        if (isset($data['objective_phrase'])) {
            $fields[] = "objective_phrase = ?";
            $params[] = $data['objective_phrase'];
        }
        
        if (isset($data['keywords_array'])) {
            $fields[] = "keywords_array = ?";
            $params[] = is_array($data['keywords_array']) 
                ? json_encode($data['keywords_array']) 
                : $data['keywords_array'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $params[] = $id;
        
        $query = "UPDATE articles SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($query);
        
        error_log("[ARTICLE-UPDATE] Query: $query");
        error_log("[ARTICLE-UPDATE] Params: " . json_encode($params));
        
        $result = $stmt->execute($params);
        
        if ($result) {
            error_log("[ARTICLE-UPDATE] ✅ Actualización exitosa para artículo ID: $id");
        } else {
            error_log("[ARTICLE-UPDATE] ❌ Error en actualización para artículo ID: $id");
            error_log("[ARTICLE-UPDATE] Error info: " . json_encode($stmt->errorInfo()));
        }
        
        return $result;
    }
    
    /**
     * Submit article for approval
     */
    public static function submitForApproval(int $id, int $userId): bool
    {
        $db = Connection::getInstance();
        
        $query = "
            UPDATE articles 
            SET status = 'pending'
            WHERE id = ? AND created_by = ? AND status = 'draft'
        ";
        
        $stmt = $db->prepare($query);
        return $stmt->execute([$id, $userId]);
    }
    
    /**
     * Approve article (Admin/Superadmin only)
     */
    public static function approve(int $id, int $adminId): bool
    {
        $db = Connection::getInstance();
        
        $query = "
            UPDATE articles 
            SET 
                status = 'published',
                reviewed_by = ?,
                published_by = ?
            WHERE id = ? AND status = 'pending'
        ";
        
        $stmt = $db->prepare($query);
        return $stmt->execute([$adminId, $adminId, $id]);
    }
    
    /**
     * Reject article (Admin/Superadmin only)
     */
    public static function reject(int $id, int $adminId, string $reason): bool
    {
        $db = Connection::getInstance();
        
        $query = "
            UPDATE articles 
            SET 
                status = 'rejected',
                reviewed_by = ?,
                rejection_reason = ?
            WHERE id = ? AND status = 'pending'
        ";
        
        $stmt = $db->prepare($query);
        return $stmt->execute([$adminId, $reason, $id]);
    }
    
    /**
     * Delete article
     */
    public static function delete(int $id): bool
    {
        $db = Connection::getInstance();
        
        $query = "DELETE FROM articles WHERE id = ?";
        $stmt = $db->prepare($query);
        
        return $stmt->execute([$id]);
    }
    
    /**
     * Get editor statistics
     */
    public static function getEditorStats(int $userId): array
    {
        $db = Connection::getInstance();
        
        $query = "
            SELECT 
                COUNT(*) as total_articles,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_count,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(word_count) as total_words,
                ROUND(
                    (SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) * 100.0 / 
                    NULLIF(SUM(CASE WHEN status IN ('published', 'rejected') THEN 1 ELSE 0 END), 0)),
                    2
                ) as approval_rate
            FROM articles
            WHERE created_by = ?
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$userId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Convert to integers
        return [
            'total_articles' => (int)$result['total_articles'],
            'draft_count' => (int)$result['draft_count'],
            'pending_count' => (int)$result['pending_count'],
            'published_count' => (int)$result['published_count'],
            'rejected_count' => (int)$result['rejected_count'],
            'total_words' => (int)$result['total_words'],
            'approval_rate' => (float)($result['approval_rate'] ?? 0)
        ];
    }
    
    /**
     * Get monthly productivity
     */
    public static function getMonthlyProductivity(int $userId, int $months = 6): array
    {
        $db = Connection::getInstance();
        
        $query = "
            SELECT 
                DATE_FORMAT(created_at, '%b') as mes,
                COUNT(*) as articulos,
                SUM(word_count) as palabras,
                DATE_FORMAT(created_at, '%Y-%m-01') as fecha
            FROM articles
            WHERE created_by = ?
              AND created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
            GROUP BY fecha, mes
            ORDER BY fecha ASC
        ";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$userId, $months]);
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert to integers
        foreach ($data as &$row) {
            $row['articulos'] = (int)$row['articulos'];
            $row['palabras'] = (int)$row['palabras'];
        }
        
        return $data;
    }
    
    /**
     * Get public data (hide sensitive info)
     */
    public static function getPublicData(array $article): array
    {
        // Get available translations
        $articleId = (int)$article['id'];
        $availableLanguages = [$article['language'] ?? 'es']; // Main language
        $translations = [];
        
        // Query translations if table exists
        try {
            $db = Connection::getInstance();
            $stmt = $db->prepare("
                SELECT id, language, title, created_at 
                FROM article_translations 
                WHERE article_id = ?
                ORDER BY language ASC
            ");
            $stmt->execute([$articleId]);
            $translationResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($translationResults as $trans) {
                $availableLanguages[] = $trans['language'];
                $translations[$trans['language']] = [
                    'id' => (int)$trans['id'],
                    'language' => $trans['language'],
                    'title' => $trans['title'],
                    'created_at' => $trans['created_at']
                ];
            }
        } catch (\Exception $e) {
            // Table might not exist yet, skip
        }
        
        return [
            'id' => (int)$article['id'],
            'title' => $article['title'],
            'h1_title' => $article['h1_title'] ?? $article['title'],
            'keyword' => $article['keyword'],
            'objective_phrase' => $article['objective_phrase'] ?? null,
            'keywords_array' => isset($article['keywords_array']) ? json_decode($article['keywords_array'], true) : [],
            'slug' => $article['slug'],
            'content' => $article['content'],
            'sections_json' => isset($article['sections_json']) ? json_decode($article['sections_json'], true) : null,
            'meta_description' => $article['meta_description'],
            'seo_data' => isset($article['seo_data']) ? json_decode($article['seo_data'], true) : null,
            'word_count' => (int)$article['word_count'],
            'status' => $article['status'],
            'rejection_reason' => $article['rejection_reason'] ?? null,
            'website_id' => isset($article['website_id']) ? (int)$article['website_id'] : null,
            'language' => $article['language'] ?? 'es',
            'content_type' => $article['content_type'] ?? 'planner',
            'wordpress_post_id' => isset($article['wordpress_post_id']) ? (int)$article['wordpress_post_id'] : null,
            'featured_image_url' => $article['featured_image_url'] ?? null,
            'featured_image_id' => isset($article['featured_image_id']) ? (int)$article['featured_image_id'] : null,
            'wordpress_categories' => isset($article['wordpress_categories']) ? json_decode($article['wordpress_categories'], true) : null,
            'wordpress_status' => $article['wordpress_status'] ?? 'draft',
            'optimization_count' => (int)($article['optimization_count'] ?? 0),
            'created_by' => (int)$article['created_by'],
            'author_name' => $article['author_name'] ?? null,
            'reviewer_name' => $article['reviewer_name'] ?? null,
            'publisher_name' => $article['publisher_name'] ?? null,
            'created_at' => $article['created_at'],
            'updated_at' => $article['updated_at'],
            'submitted_at' => $article['submitted_at'],
            'reviewed_at' => $article['reviewed_at'],
            'published_at' => $article['published_at'],
            'available_languages' => $availableLanguages,
            'translations' => $translations
        ];
    }
    
    /**
     * Calculate word count from content
     */
    private static function calculateWordCount(string $content): int
    {
        // Remove markdown syntax
        $text = preg_replace('/[#*_`\[\]()]/', '', $content);
        // Count words
        $words = str_word_count($text);
        return $words;
    }
    
    /**
     * Generate URL-friendly slug
     */
    private static function generateSlug(string $title): string
    {
        $slug = strtolower($title);
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        $slug = trim($slug, '-');
        
        // Check if slug exists and add number if needed
        $db = Connection::getInstance();
        $originalSlug = $slug;
        $counter = 1;
        
        while (true) {
            $stmt = $db->prepare("SELECT id FROM articles WHERE slug = ?");
            $stmt->execute([$slug]);
            
            if (!$stmt->fetch()) {
                break;
            }
            
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
}
