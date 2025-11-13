<?php

namespace App\Models;

use App\Database\Connection;
use PDO;

class ArticleTranslation
{
    /**
     * Get all translations for an article
     */
    public static function getByArticleId(int $articleId): array
    {
        $db = Connection::getInstance();
        
        $stmt = $db->prepare("
            SELECT * FROM article_translations 
            WHERE article_id = :article_id 
            ORDER BY language ASC
        ");
        
        $stmt->execute(['article_id' => $articleId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get specific translation
     */
    public static function getByArticleIdAndLanguage(int $articleId, string $language): ?array
    {
        $db = Connection::getInstance();
        
        $stmt = $db->prepare("
            SELECT * FROM article_translations 
            WHERE article_id = :article_id AND language = :language
        ");
        
        $stmt->execute([
            'article_id' => $articleId,
            'language' => $language
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }
    
    /**
     * Create translation
     */
    public static function create(int $articleId, array $data): int
    {
        $db = Connection::getInstance();
        
        $stmt = $db->prepare("
            INSERT INTO article_translations (
                article_id, language, title, h1_title, keyword, 
                objective_phrase, keywords_array, slug, content, 
                sections_json, meta_description, seo_data, word_count,
                featured_image_url, wordpress_categories, wordpress_status
            ) VALUES (
                :article_id, :language, :title, :h1_title, :keyword,
                :objective_phrase, :keywords_array, :slug, :content,
                :sections_json, :meta_description, :seo_data, :word_count,
                :featured_image_url, :wordpress_categories, :wordpress_status
            )
        ");
        
        $stmt->execute([
            'article_id' => $articleId,
            'language' => $data['language'],
            'title' => $data['title'],
            'h1_title' => $data['h1_title'] ?? null,
            'keyword' => $data['keyword'],
            'objective_phrase' => $data['objective_phrase'] ?? null,
            'keywords_array' => isset($data['keywords_array']) ? json_encode($data['keywords_array']) : null,
            'slug' => $data['slug'] ?? null,
            'content' => $data['content'],
            'sections_json' => isset($data['sections_json']) ? json_encode($data['sections_json']) : null,
            'meta_description' => $data['meta_description'] ?? null,
            'seo_data' => isset($data['seo_data']) ? json_encode($data['seo_data']) : null,
            'word_count' => $data['word_count'] ?? 0,
            'featured_image_url' => $data['featured_image_url'] ?? null,
            'wordpress_categories' => isset($data['wordpress_categories']) && is_array($data['wordpress_categories']) ? json_encode($data['wordpress_categories']) : null,
            'wordpress_status' => $data['wordpress_status'] ?? 'draft'
        ]);
        
        return (int)$db->lastInsertId();
    }
    
    /**
     * Update translation
     */
    public static function update(int $articleId, string $language, array $data): bool
    {
        $db = Connection::getInstance();
        
        $fields = [];
        $values = ['article_id' => $articleId, 'language' => $language];
        
        foreach ($data as $key => $value) {
            if (in_array($key, ['title', 'h1_title', 'keyword', 'objective_phrase', 'slug', 'content', 'meta_description', 'word_count', 'wordpress_post_id', 'featured_image_url', 'wordpress_status'])) {
                $fields[] = "$key = :$key";
                $values[$key] = $value;
            } elseif (in_array($key, ['keywords_array', 'sections_json', 'seo_data', 'wordpress_categories'])) {
                $fields[] = "$key = :$key";
                $values[$key] = is_array($value) ? json_encode($value) : $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE article_translations SET " . implode(', ', $fields) . 
               " WHERE article_id = :article_id AND language = :language";
        
        $stmt = $db->prepare($sql);
        
        return $stmt->execute($values);
    }
    
    /**
     * Delete translation
     */
    public static function delete(int $articleId, string $language): bool
    {
        $db = Connection::getInstance();
        
        $stmt = $db->prepare("
            DELETE FROM article_translations 
            WHERE article_id = :article_id AND language = :language
        ");
        
        return $stmt->execute([
            'article_id' => $articleId,
            'language' => $language
        ]);
    }
    
    /**
     * Get available languages for an article
     */
    public static function getAvailableLanguages(int $articleId): array
    {
        $db = Connection::getInstance();
        
        $stmt = $db->prepare("
            SELECT language FROM article_translations 
            WHERE article_id = :article_id 
            ORDER BY language ASC
        ");
        
        $stmt->execute(['article_id' => $articleId]);
        
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'language');
    }
    
    /**
     * Format translation data for public response
     */
    public static function getPublicData(array $translation): array
    {
        return [
            'id' => (int)$translation['id'],
            'article_id' => (int)$translation['article_id'],
            'language' => $translation['language'],
            'title' => $translation['title'],
            'h1_title' => $translation['h1_title'],
            'keyword' => $translation['keyword'],
            'objective_phrase' => $translation['objective_phrase'],
            'keywords_array' => isset($translation['keywords_array']) ? json_decode($translation['keywords_array'], true) : [],
            'slug' => $translation['slug'],
            'content' => $translation['content'],
            'sections_json' => isset($translation['sections_json']) ? json_decode($translation['sections_json'], true) : null,
            'meta_description' => $translation['meta_description'],
            'seo_data' => isset($translation['seo_data']) ? json_decode($translation['seo_data'], true) : null,
            'word_count' => (int)$translation['word_count'],
            'wordpress_post_id' => $translation['wordpress_post_id'] ? (int)$translation['wordpress_post_id'] : null,
            'featured_image_url' => $translation['featured_image_url'] ?? null,
            'wordpress_categories' => isset($translation['wordpress_categories']) ? json_decode($translation['wordpress_categories'], true) : null,
            'wordpress_status' => $translation['wordpress_status'] ?? 'draft',
            'created_at' => $translation['created_at'],
            'updated_at' => $translation['updated_at']
        ];
    }
}
