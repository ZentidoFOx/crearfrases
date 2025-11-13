<?php
/**
 * Plugin Name: Content Search API
 * Plugin URI: https://github.com/tu-usuario/content-search-api
 * Description: API REST completa con análisis de contenido, SEO, analytics y recomendaciones. Sistema de vistas integrado. Incluye soporte completo para Yoast SEO (lectura/escritura). Compatible con AdminResh.
 * Version: 2.1.0
 * Author: AdminResh Team
 * License: GPL v2 or later
 * Text Domain: content-search-api
 * Requires at least: 5.6
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register REST API routes
 */
add_action('rest_api_init', function() {
    $namespace = 'content-search/v1';
    
    // Endpoint 1: Buscar contenido (frases)
    register_rest_route($namespace, '/search', array(
        'methods' => 'GET',
        'callback' => 'csa_search_content',
        'permission_callback' => '__return_true',
        'args' => array(
            'query' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'Frase a buscar',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'post_type' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'post,page',
                'description' => 'Tipos de contenido a buscar (separados por coma)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'limit' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 50,
                'description' => 'Número máximo de resultados',
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
                'description' => 'Número de página',
                'sanitize_callback' => 'absint',
            ),
            'lang' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'es',
                'description' => 'Código de idioma (Polylang)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'include_taxonomies' => array(
                'required' => false,
                'type' => 'boolean',
                'default' => true,
                'description' => 'Incluir búsqueda en taxonomías',
            ),
        ),
    ));
    
    // Endpoint 2: Obtener posts/páginas
    register_rest_route($namespace, '/posts', array(
        'methods' => 'GET',
        'callback' => 'csa_get_posts',
        'permission_callback' => '__return_true',
        'args' => array(
            'per_page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 10,
                'description' => 'Posts por página',
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
                'description' => 'Número de página',
                'sanitize_callback' => 'absint',
            ),
            'post_type' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'post',
                'description' => 'Tipo de contenido',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Endpoint 3: Obtener post específico
    register_rest_route($namespace, '/posts/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'csa_get_post',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
    
    // Endpoint 4: Obtener categorías
    register_rest_route($namespace, '/categories', array(
        'methods' => 'GET',
        'callback' => 'csa_get_categories',
        'permission_callback' => '__return_true',
    ));
    
    // Endpoint 5: Obtener tags
    register_rest_route($namespace, '/tags', array(
        'methods' => 'GET',
        'callback' => 'csa_get_tags',
        'permission_callback' => '__return_true',
    ));
    
    // Endpoint 6: Obtener idiomas disponibles
    register_rest_route($namespace, '/languages', array(
        'methods' => 'GET',
        'callback' => 'csa_get_languages',
        'permission_callback' => '__return_true',
    ));
    
    // Endpoint 7: Obtener estadísticas de calidad SEO
    register_rest_route($namespace, '/seo-stats', array(
        'methods' => 'GET',
        'callback' => 'csa_get_seo_stats',
        'permission_callback' => '__return_true',
    ));
    
    // Endpoint 8: Análisis detallado de contenido
    register_rest_route($namespace, '/content-analysis/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'csa_content_analysis',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'required' => true,
                'type' => 'integer',
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
    
    // Endpoint 9: Posts con mejor rendimiento
    register_rest_route($namespace, '/top-performing', array(
        'methods' => 'GET',
        'callback' => 'csa_top_performing',
        'permission_callback' => '__return_true',
        'args' => array(
            'limit' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 10,
                'sanitize_callback' => 'absint',
            ),
            'orderby' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'views',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
    
    // Endpoint 10: Posts que necesitan mejora
    register_rest_route($namespace, '/needs-improvement', array(
        'methods' => 'GET',
        'callback' => 'csa_needs_improvement',
        'permission_callback' => '__return_true',
        'args' => array(
            'limit' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 20,
                'sanitize_callback' => 'absint',
            ),
        ),
    ));
    
    // Endpoint 11: Estadísticas globales del sitio
    register_rest_route($namespace, '/site-stats', array(
        'methods' => 'GET',
        'callback' => 'csa_site_stats',
        'permission_callback' => '__return_true',
    ));
    
    // Endpoint 12: Buscar por Frase Clave Objetivo (Yoast Focus Keyword)
    register_rest_route($namespace, '/focus-keywords', array(
        'methods' => 'GET',
        'callback' => 'csa_search_focus_keywords',
        'permission_callback' => '__return_true',
        'args' => array(
            'query' => array(
                'required' => true,
                'type' => 'string',
                'description' => 'Frase clave objetivo a buscar',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'limit' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 50,
                'description' => 'Número máximo de resultados',
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'required' => false,
                'type' => 'integer',
                'default' => 1,
                'description' => 'Número de página',
                'sanitize_callback' => 'absint',
            ),
            'lang' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'es',
                'description' => 'Código de idioma (Polylang)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'post_type' => array(
                'required' => false,
                'type' => 'string',
                'default' => 'post,page',
                'description' => 'Tipos de contenido (separados por coma)',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));
});

/**
 * Register Yoast SEO fields in REST API for read/write access
 * This allows AdminResh to update Yoast SEO metadata via API
 */
add_action('rest_api_init', function() {
    // Register Yoast SEO fields for 'post' post type
    $post_types = array('post', 'page');
    
    foreach ($post_types as $post_type) {
        // Campo: Título SEO
        register_rest_field($post_type, '_yoast_wpseo_title', array(
            'get_callback' => function($post) {
                return get_post_meta($post['id'], '_yoast_wpseo_title', true);
            },
            'update_callback' => function($value, $post) {
                if (current_user_can('edit_post', $post->ID)) {
                    return update_post_meta($post->ID, '_yoast_wpseo_title', sanitize_text_field($value));
                }
                return false;
            },
            'schema' => array(
                'description' => 'Yoast SEO Title',
                'type' => 'string',
                'context' => array('view', 'edit'),
            ),
        ));
        
        // Campo: Meta Descripción
        register_rest_field($post_type, '_yoast_wpseo_metadesc', array(
            'get_callback' => function($post) {
                return get_post_meta($post['id'], '_yoast_wpseo_metadesc', true);
            },
            'update_callback' => function($value, $post) {
                if (current_user_can('edit_post', $post->ID)) {
                    return update_post_meta($post->ID, '_yoast_wpseo_metadesc', sanitize_textarea_field($value));
                }
                return false;
            },
            'schema' => array(
                'description' => 'Yoast SEO Meta Description',
                'type' => 'string',
                'context' => array('view', 'edit'),
            ),
        ));
        
        // Campo: Palabra Clave Focus (Frase clave objetivo)
        register_rest_field($post_type, '_yoast_wpseo_focuskw', array(
            'get_callback' => function($post) {
                return get_post_meta($post['id'], '_yoast_wpseo_focuskw', true);
            },
            'update_callback' => function($value, $post) {
                if (current_user_can('edit_post', $post->ID)) {
                    return update_post_meta($post->ID, '_yoast_wpseo_focuskw', sanitize_text_field($value));
                }
                return false;
            },
            'schema' => array(
                'description' => 'Yoast SEO Focus Keyword (Frase clave objetivo)',
                'type' => 'string',
                'context' => array('view', 'edit'),
            ),
        ));
        
        // Campo: Canonical URL
        register_rest_field($post_type, '_yoast_wpseo_canonical', array(
            'get_callback' => function($post) {
                return get_post_meta($post['id'], '_yoast_wpseo_canonical', true);
            },
            'update_callback' => function($value, $post) {
                if (current_user_can('edit_post', $post->ID)) {
                    return update_post_meta($post->ID, '_yoast_wpseo_canonical', esc_url_raw($value));
                }
                return false;
            },
            'schema' => array(
                'description' => 'Yoast SEO Canonical URL',
                'type' => 'string',
                'context' => array('view', 'edit'),
            ),
        ));
    }
});

/**
 * Log Yoast SEO updates for debugging
 */
add_action('updated_post_meta', function($meta_id, $post_id, $meta_key, $meta_value) {
    // Solo log para campos de Yoast SEO
    if (strpos($meta_key, '_yoast_wpseo_') === 0) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                '[Content Search API] Yoast field updated - Post ID: %d, Field: %s, Value: %s',
                $post_id,
                $meta_key,
                substr($meta_value, 0, 50) // Solo primeros 50 caracteres
            ));
        }
    }
}, 10, 4);

/**
 * Helper: Decodificar entidades HTML
 */
function csa_decode_html_entities($text) {
    return html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Get complete Yoast SEO data
 */
function csa_get_yoast_data($post_id) {
    if (!class_exists('WPSEO_Meta')) {
        return null;
    }
    
    $yoast_data = array(
        'focus_keyword' => get_post_meta($post_id, '_yoast_wpseo_focuskw', true),
        'title' => get_post_meta($post_id, '_yoast_wpseo_title', true),
        'description' => get_post_meta($post_id, '_yoast_wpseo_metadesc', true),
        'canonical' => get_post_meta($post_id, '_yoast_wpseo_canonical', true),
        
        // SEO Score
        'seo_score' => get_post_meta($post_id, '_yoast_wpseo_linkdex', true),
        'seo_score_text' => csa_get_score_text(get_post_meta($post_id, '_yoast_wpseo_linkdex', true)),
        
        // Readability Score
        'readability_score' => get_post_meta($post_id, '_yoast_wpseo_content_score', true),
        'readability_score_text' => csa_get_score_text(get_post_meta($post_id, '_yoast_wpseo_content_score', true)),
        
        // Open Graph
        'og_title' => get_post_meta($post_id, '_yoast_wpseo_opengraph-title', true),
        'og_description' => get_post_meta($post_id, '_yoast_wpseo_opengraph-description', true),
        'og_image' => get_post_meta($post_id, '_yoast_wpseo_opengraph-image', true),
        
        // Twitter
        'twitter_title' => get_post_meta($post_id, '_yoast_wpseo_twitter-title', true),
        'twitter_description' => get_post_meta($post_id, '_yoast_wpseo_twitter-description', true),
        'twitter_image' => get_post_meta($post_id, '_yoast_wpseo_twitter-image', true),
        
        // Robots
        'robots_noindex' => get_post_meta($post_id, '_yoast_wpseo_meta-robots-noindex', true),
        'robots_nofollow' => get_post_meta($post_id, '_yoast_wpseo_meta-robots-nofollow', true),
        
        // Cornerstone
        'is_cornerstone' => get_post_meta($post_id, '_yoast_wpseo_is_cornerstone', true) === '1',
    );
    
    // Clasificar calidad general
    $seo_score = intval($yoast_data['seo_score']);
    $readability_score = intval($yoast_data['readability_score']);
    
    if ($seo_score >= 70 && $readability_score >= 60) {
        $yoast_data['overall_quality'] = 'excellent';
        $yoast_data['overall_quality_text'] = 'Excelente';
    } elseif ($seo_score >= 50 && $readability_score >= 40) {
        $yoast_data['overall_quality'] = 'good';
        $yoast_data['overall_quality_text'] = 'Bueno';
    } elseif ($seo_score >= 30 || $readability_score >= 30) {
        $yoast_data['overall_quality'] = 'needs_improvement';
        $yoast_data['overall_quality_text'] = 'Necesita Mejorar';
    } else {
        $yoast_data['overall_quality'] = 'poor';
        $yoast_data['overall_quality_text'] = 'Pobre';
    }
    
    return $yoast_data;
}

/**
 * Get score text from numeric score
 */
function csa_get_score_text($score) {
    $score = intval($score);
    
    if ($score >= 70) {
        return array(
            'status' => 'good',
            'color' => 'green',
            'text' => 'Bueno',
            'emoji' => '✅'
        );
    } elseif ($score >= 50) {
        return array(
            'status' => 'ok',
            'color' => 'orange',
            'text' => 'OK',
            'emoji' => '⚠️'
        );
    } else {
        return array(
            'status' => 'bad',
            'color' => 'red',
            'text' => 'Malo',
            'emoji' => '❌'
        );
    }
}

/**
 * Get post views (our own tracking system)
 */
function csa_get_post_views($post_id) {
    $views = get_post_meta($post_id, '_csa_post_views', true);
    return $views ? intval($views) : 0;
}

/**
 * Set post views
 */
function csa_set_post_views($post_id) {
    $count = csa_get_post_views($post_id);
    $count++;
    update_post_meta($post_id, '_csa_post_views', $count);
}

/**
 * Track post views automatically
 */
function csa_track_post_views($post_id) {
    if (!is_single()) return;
    if (empty($post_id)) {
        global $post;
        $post_id = $post->ID;
    }
    csa_set_post_views($post_id);
}
add_action('wp_head', 'csa_track_post_views');

/**
 * Add views column to posts/pages admin
 */
function csa_add_views_column($columns) {
    $columns['csa_views'] = '👁️ Vistas';
    return $columns;
}
add_filter('manage_posts_columns', 'csa_add_views_column');
add_filter('manage_pages_columns', 'csa_add_views_column');

/**
 * Display views in admin column
 */
function csa_display_views_column($column, $post_id) {
    if ($column === 'csa_views') {
        $views = csa_get_post_views($post_id);
        echo '<strong>' . number_format($views) . '</strong>';
    }
}
add_action('manage_posts_custom_column', 'csa_display_views_column', 10, 2);
add_action('manage_pages_custom_column', 'csa_display_views_column', 10, 2);

/**
 * Make views column sortable
 */
function csa_sortable_views_column($columns) {
    $columns['csa_views'] = 'csa_views';
    return $columns;
}
add_filter('manage_edit-post_sortable_columns', 'csa_sortable_views_column');
add_filter('manage_edit-page_sortable_columns', 'csa_sortable_views_column');

/**
 * Sort by views
 */
function csa_sort_by_views($query) {
    if (!is_admin()) return;
    
    $orderby = $query->get('orderby');
    
    if ('csa_views' === $orderby) {
        $query->set('meta_key', '_csa_post_views');
        $query->set('orderby', 'meta_value_num');
    }
}
add_action('pre_get_posts', 'csa_sort_by_views');

/**
 * Get post engagement score
 */
function csa_get_engagement_score($post_id) {
    $views = csa_get_post_views($post_id);
    $comments = get_comments_number($post_id);
    
    // Simple engagement formula
    $engagement = ($views * 0.7) + ($comments * 5);
    
    return round($engagement, 2);
}

/**
 * Analyze content quality
 */
function csa_analyze_content_quality($post_id) {
    $post = get_post($post_id);
    $content = $post->post_content;
    $title = $post->post_title;
    
    $analysis = array(
        'word_count' => str_word_count(strip_tags($content)),
        'char_count' => strlen(strip_tags($content)),
        'paragraph_count' => substr_count($content, '</p>'),
        'heading_count' => substr_count($content, '</h') + substr_count($content, '</H'),
        'image_count' => substr_count($content, '<img'),
        'link_count' => substr_count($content, '<a '),
        'list_count' => substr_count($content, '<ul') + substr_count($content, '<ol'),
    );
    
    // Reading time (avg 200 words per minute)
    $analysis['reading_time_minutes'] = ceil($analysis['word_count'] / 200);
    
    // Content density
    $analysis['avg_words_per_paragraph'] = $analysis['paragraph_count'] > 0 
        ? round($analysis['word_count'] / $analysis['paragraph_count'], 1) 
        : 0;
    
    // Quality score
    $quality_score = 0;
    
    // Word count score (optimal: 1500-2500 words)
    if ($analysis['word_count'] >= 1500 && $analysis['word_count'] <= 2500) {
        $quality_score += 30;
    } elseif ($analysis['word_count'] >= 800) {
        $quality_score += 20;
    } elseif ($analysis['word_count'] >= 300) {
        $quality_score += 10;
    }
    
    // Has images
    if ($analysis['image_count'] >= 3) {
        $quality_score += 15;
    } elseif ($analysis['image_count'] >= 1) {
        $quality_score += 10;
    }
    
    // Has headings
    if ($analysis['heading_count'] >= 3) {
        $quality_score += 15;
    } elseif ($analysis['heading_count'] >= 1) {
        $quality_score += 10;
    }
    
    // Has links
    if ($analysis['link_count'] >= 3) {
        $quality_score += 10;
    } elseif ($analysis['link_count'] >= 1) {
        $quality_score += 5;
    }
    
    // Has lists
    if ($analysis['list_count'] >= 1) {
        $quality_score += 10;
    }
    
    // Paragraph length
    if ($analysis['avg_words_per_paragraph'] > 50 && $analysis['avg_words_per_paragraph'] < 150) {
        $quality_score += 10;
    }
    
    // Title length (optimal: 50-70 characters)
    $title_length = strlen($title);
    if ($title_length >= 50 && $title_length <= 70) {
        $quality_score += 10;
    }
    
    $analysis['content_quality_score'] = $quality_score;
    
    return $analysis;
}

/**
 * Get content recommendations
 */
function csa_get_content_recommendations($post_id) {
    $recommendations = array();
    $analysis = csa_analyze_content_quality($post_id);
    $yoast_data = csa_get_yoast_data($post_id);
    
    // Word count
    if ($analysis['word_count'] < 300) {
        $recommendations[] = array(
            'type' => 'critical',
            'category' => 'content_length',
            'message' => 'El contenido es muy corto. Recomendamos al menos 800 palabras para mejor SEO.',
            'current_value' => $analysis['word_count'],
            'target_value' => 800,
        );
    } elseif ($analysis['word_count'] < 800) {
        $recommendations[] = array(
            'type' => 'warning',
            'category' => 'content_length',
            'message' => 'El contenido podría ser más extenso. Objetivo: 1500-2500 palabras.',
            'current_value' => $analysis['word_count'],
            'target_value' => 1500,
        );
    }
    
    // Images
    if ($analysis['image_count'] === 0) {
        $recommendations[] = array(
            'type' => 'warning',
            'category' => 'media',
            'message' => 'No hay imágenes en el contenido. Agrega al menos 2-3 imágenes relevantes.',
            'current_value' => 0,
            'target_value' => 3,
        );
    }
    
    // Headings
    if ($analysis['heading_count'] < 3) {
        $recommendations[] = array(
            'type' => 'warning',
            'category' => 'structure',
            'message' => 'Usa más encabezados (H2, H3) para mejor estructura y SEO.',
            'current_value' => $analysis['heading_count'],
            'target_value' => 5,
        );
    }
    
    // Links
    if ($analysis['link_count'] < 2) {
        $recommendations[] = array(
            'type' => 'info',
            'category' => 'links',
            'message' => 'Agrega enlaces internos y externos relevantes.',
            'current_value' => $analysis['link_count'],
            'target_value' => 5,
        );
    }
    
    // Yoast SEO
    if ($yoast_data) {
        if (empty($yoast_data['focus_keyword'])) {
            $recommendations[] = array(
                'type' => 'critical',
                'category' => 'seo',
                'message' => 'Define una palabra clave objetivo en Yoast SEO.',
            );
        }
        
        if (intval($yoast_data['seo_score']) < 50) {
            $recommendations[] = array(
                'type' => 'critical',
                'category' => 'seo',
                'message' => 'El SEO score es bajo. Revisa las recomendaciones de Yoast.',
                'current_value' => intval($yoast_data['seo_score']),
                'target_value' => 70,
            );
        }
        
        if (intval($yoast_data['readability_score']) < 40) {
            $recommendations[] = array(
                'type' => 'warning',
                'category' => 'readability',
                'message' => 'La legibilidad es baja. Simplifica las oraciones y usa párrafos más cortos.',
                'current_value' => intval($yoast_data['readability_score']),
                'target_value' => 60,
            );
        }
    }
    
    return $recommendations;
}

/**
 * Search content for keyword phrase
 * Mejorado con paginación, filtro de idioma y búsqueda en taxonomías
 */
function csa_search_content($request) {
    $query = $request->get_param('query');
    $post_types = explode(',', $request->get_param('post_type'));
    $post_types = array_map('trim', $post_types);
    $limit = $request->get_param('limit');
    $page = $request->get_param('page');
    $lang = $request->get_param('lang');
    $include_taxonomies = $request->get_param('include_taxonomies');
    
    $all_results = array();
    
    // ============================================
    // PASO 1: Buscar en Posts/Páginas
    // ============================================
    $args = array(
        'post_type' => $post_types,
        'post_status' => 'publish',
        'posts_per_page' => -1, // Todos primero, luego paginamos
        's' => $query,
    );
    
    // Filtrar por idioma si Polylang está activo
    if (function_exists('pll_get_post') && !empty($lang)) {
        $args['lang'] = $lang;
    }
    
    $search_query = new WP_Query($args);
    
    if ($search_query->have_posts()) {
        while ($search_query->have_posts()) {
            $search_query->the_post();
            
            $post_id = get_the_ID();
            
            // Verificar idioma adicional si Polylang está activo
            $post_lang = '';
            if (function_exists('pll_get_post_language')) {
                $post_lang = pll_get_post_language($post_id);
                // Saltar si no coincide con el idioma solicitado
                if (!empty($lang) && $post_lang !== $lang) {
                    continue;
                }
            }
            
            $content = get_the_content();
            $title = get_the_title();
            
            // Decodificar entidades HTML en el título
            $title_decoded = csa_decode_html_entities($title);
            
            // Contar ocurrencias de la frase
            $content_occurrences = substr_count(strtolower($content), strtolower($query));
            $title_occurrences = substr_count(strtolower($title), strtolower($query));
            $total_occurrences = $content_occurrences + $title_occurrences;
            
            // Solo incluir si se encontró la frase
            if ($total_occurrences > 0) {
                $result = array(
                    'id' => $post_id,
                    'title' => $title_decoded,
                    'url' => get_permalink($post_id),
                    'type' => get_post_type($post_id),
                    'excerpt' => wp_trim_words(strip_tags($content), 30),
                    'occurrences' => array(
                        'title' => $title_occurrences,
                        'content' => $content_occurrences,
                        'total' => $total_occurrences,
                    ),
                    'keyword_phrase' => $query,
                    'source' => 'post',
                );
                
                // Agregar datos completos de Yoast SEO
                $yoast_data = csa_get_yoast_data($post_id);
                if ($yoast_data) {
                    $result['yoast_seo'] = $yoast_data;
                }
                
                // Agregar info de idioma
                if (!empty($post_lang)) {
                    $result['language'] = $post_lang;
                }
                
                $all_results[] = $result;
            }
        }
        wp_reset_postdata();
    }
    
    // ============================================
    // PASO 2: Buscar en Taxonomías (Categorías y Tags)
    // ============================================
    if ($include_taxonomies) {
        $taxonomies = array('category', 'post_tag');
        
        // Agregar taxonomías personalizadas si existen
        $custom_taxonomies = get_taxonomies(array(
            'public' => true,
            '_builtin' => false
        ));
        $taxonomies = array_merge($taxonomies, $custom_taxonomies);
        
        foreach ($taxonomies as $taxonomy) {
            $terms = get_terms(array(
                'taxonomy' => $taxonomy,
                'hide_empty' => true,
                'search' => $query,
            ));
            
            if (!empty($terms) && !is_wp_error($terms)) {
                foreach ($terms as $term) {
                    // Verificar idioma de la taxonomía si Polylang está activo
                    $term_lang = '';
                    if (function_exists('pll_get_term_language')) {
                        $term_lang = pll_get_term_language($term->term_id);
                        // Saltar si no coincide con el idioma solicitado
                        if (!empty($lang) && $term_lang !== $lang) {
                            continue;
                        }
                    }
                    
                    $term_name = $term->name;
                    $term_description = $term->description;
                    
                    // Decodificar entidades HTML en el nombre de la taxonomía
                    $term_name_decoded = csa_decode_html_entities($term_name);
                    $term_desc_decoded = csa_decode_html_entities($term_description);
                    
                    // Contar ocurrencias en nombre y descripción
                    $name_occurrences = substr_count(strtolower($term_name), strtolower($query));
                    $desc_occurrences = substr_count(strtolower($term_description), strtolower($query));
                    $total_occurrences = $name_occurrences + $desc_occurrences;
                    
                    if ($total_occurrences > 0) {
                        $result = array(
                            'id' => $term->term_id,
                            'title' => $term_name_decoded,
                            'url' => get_term_link($term),
                            'type' => $taxonomy,
                            'excerpt' => wp_trim_words(strip_tags($term_desc_decoded), 30),
                            'occurrences' => array(
                                'title' => $name_occurrences,
                                'content' => $desc_occurrences,
                                'total' => $total_occurrences,
                            ),
                            'keyword_phrase' => $query,
                            'source' => 'taxonomy',
                            'taxonomy_name' => $taxonomy,
                            'count' => $term->count, // Número de posts en esta taxonomía
                        );
                        
                        // Agregar idioma
                        if (!empty($term_lang)) {
                            $result['language'] = $term_lang;
                        }
                        
                        $all_results[] = $result;
                    }
                }
            }
        }
    }
    
    // ============================================
    // PASO 3: Ordenar (taxonomías primero, luego por ocurrencias)
    // ============================================
    usort($all_results, function($a, $b) {
        // Primero: Taxonomías antes que posts
        if ($a['source'] === 'taxonomy' && $b['source'] !== 'taxonomy') {
            return -1; // $a va primero
        }
        if ($a['source'] !== 'taxonomy' && $b['source'] === 'taxonomy') {
            return 1; // $b va primero
        }
        
        // Segundo: Si ambos son del mismo tipo, ordenar por ocurrencias
        return $b['occurrences']['total'] - $a['occurrences']['total'];
    });
    
    // ============================================
    // PASO 4: Aplicar Paginación
    // ============================================
    $total_results = count($all_results);
    $total_pages = ceil($total_results / $limit);
    $offset = ($page - 1) * $limit;
    $paged_results = array_slice($all_results, $offset, $limit);
    
    return new WP_REST_Response(array(
        'success' => true,
        'query' => $query,
        'language' => $lang,
        'total_results' => $total_results,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => $total_pages,
        'include_taxonomies' => $include_taxonomies,
        'data' => $paged_results,
    ), 200);
}

/**
 * Get posts/pages
 */
function csa_get_posts($request) {
    $per_page = $request->get_param('per_page');
    $page = $request->get_param('page');
    $post_type = $request->get_param('post_type');
    
    $args = array(
        'post_type' => $post_type,
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => 'date',
        'order' => 'DESC',
    );
    
    $query = new WP_Query($args);
    $posts = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $post_data = array(
                'id' => $post_id,
                'title' => csa_decode_html_entities(get_the_title()),
                'slug' => get_post_field('post_name', $post_id),
                'url' => get_permalink($post_id),
                'excerpt' => get_the_excerpt(),
                'date' => get_the_date('c', $post_id),
                'type' => get_post_type($post_id),
            );
            
            // Yoast SEO completo
            $yoast_data = csa_get_yoast_data($post_id);
            if ($yoast_data) {
                $post_data['yoast_seo'] = $yoast_data;
            }
            
            // Polylang
            if (function_exists('pll_get_post_language')) {
                $post_data['language'] = pll_get_post_language($post_id);
            }
            
            $posts[] = $post_data;
        }
        wp_reset_postdata();
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'total' => $query->found_posts,
        'page' => $page,
        'per_page' => $per_page,
        'total_pages' => $query->max_num_pages,
        'data' => $posts,
    ), 200);
}

/**
 * Get single post
 */
function csa_get_post($request) {
    $post_id = $request->get_param('id');
    $post = get_post($post_id);
    
    if (!$post || $post->post_status !== 'publish') {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Post no encontrado',
        ), 404);
    }
    
    $post_data = array(
        'id' => $post->ID,
        'title' => get_the_title($post_id),
        'slug' => $post->post_name,
        'content' => apply_filters('the_content', $post->post_content),
        'excerpt' => get_the_excerpt($post_id),
        'url' => get_permalink($post_id),
        'date' => get_the_date('c', $post_id),
        'modified' => get_the_modified_date('c', $post_id),
        'type' => $post->post_type,
        'word_count' => str_word_count(strip_tags($post->post_content)),
    );
    
    // Yoast SEO completo
    $yoast_data = csa_get_yoast_data($post_id);
    if ($yoast_data) {
        $post_data['yoast_seo'] = $yoast_data;
    }
    
    // Polylang
    if (function_exists('pll_get_post_language')) {
        $post_data['language'] = pll_get_post_language($post_id);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $post_data,
    ), 200);
}

/**
 * Get categories
 */
function csa_get_categories($request) {
    $categories = get_categories(array(
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC',
    ));
    
    $results = array();
    foreach ($categories as $category) {
        $cat_data = array(
            'id' => $category->term_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'count' => $category->count,
            'description' => $category->description,
            'url' => get_category_link($category->term_id),
        );
        
        // Polylang
        if (function_exists('pll_get_term_language')) {
            $cat_data['language'] = pll_get_term_language($category->term_id);
        }
        
        $results[] = $cat_data;
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'total' => count($results),
        'data' => $results,
    ), 200);
}

/**
 * Get tags
 */
function csa_get_tags($request) {
    $tags = get_tags(array(
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC',
    ));
    
    $results = array();
    foreach ($tags as $tag) {
        $tag_data = array(
            'id' => $tag->term_id,
            'name' => $tag->name,
            'slug' => $tag->slug,
            'count' => $tag->count,
            'description' => $tag->description,
            'url' => get_tag_link($tag->term_id),
        );
        
        // Polylang
        if (function_exists('pll_get_term_language')) {
            $tag_data['language'] = pll_get_term_language($tag->term_id);
        }
        
        $results[] = $tag_data;
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'total' => count($results),
        'data' => $results,
    ), 200);
}

/**
 * Get available languages
 */
function csa_get_languages($request) {
    $languages = array();
    
    // Detectar Polylang
    if (function_exists('pll_languages_list')) {
        $lang_slugs = pll_languages_list();
        
        foreach ($lang_slugs as $slug) {
            $lang_obj = PLL()->model->get_language($slug);
            
            if ($lang_obj) {
                $languages[] = array(
                    'code' => $lang_obj->slug,
                    'name' => $lang_obj->name,
                    'locale' => $lang_obj->locale,
                    'is_default' => (pll_default_language() === $lang_obj->slug),
                    'flag' => $lang_obj->flag_url,
                    'url' => pll_home_url($lang_obj->slug),
                );
            }
        }
    }
    
    // Detectar WPML
    elseif (function_exists('icl_get_languages')) {
        $wpml_languages = icl_get_languages('skip_missing=0');
        
        foreach ($wpml_languages as $lang) {
            $languages[] = array(
                'code' => $lang['code'],
                'name' => $lang['native_name'],
                'locale' => $lang['default_locale'],
                'is_default' => ($lang['active'] == 1),
                'flag' => $lang['country_flag_url'],
                'url' => $lang['url'],
            );
        }
    }
    
    // Si no hay plugin multiidioma
    else {
        $locale = get_locale();
        $languages[] = array(
            'code' => substr($locale, 0, 2),
            'name' => get_bloginfo('language'),
            'locale' => $locale,
            'is_default' => true,
            'flag' => null,
            'url' => home_url(),
        );
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'total' => count($languages),
        'has_multilanguage_plugin' => function_exists('pll_languages_list') || function_exists('icl_get_languages'),
        'plugin' => function_exists('pll_languages_list') ? 'Polylang' : (function_exists('icl_get_languages') ? 'WPML' : 'None'),
        'data' => $languages,
    ), 200);
}

/**
 * Get SEO quality statistics
 */
function csa_get_seo_stats($request) {
    if (!class_exists('WPSEO_Meta')) {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Yoast SEO no está instalado',
        ), 404);
    }
    
    $args = array(
        'post_type' => array('post', 'page'),
        'post_status' => 'publish',
        'posts_per_page' => -1,
    );
    
    $query = new WP_Query($args);
    
    $stats = array(
        'total_posts' => 0,
        'excellent' => 0,
        'good' => 0,
        'needs_improvement' => 0,
        'poor' => 0,
        'no_focus_keyword' => 0,
        'cornerstone_content' => 0,
        'avg_seo_score' => 0,
        'avg_readability_score' => 0,
        'posts_by_quality' => array(),
    );
    
    $total_seo_score = 0;
    $total_readability_score = 0;
    $posts_with_scores = 0;
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $stats['total_posts']++;
            
            $yoast_data = csa_get_yoast_data($post_id);
            
            if ($yoast_data) {
                // Contar por calidad
                $quality = $yoast_data['overall_quality'];
                $stats[$quality]++;
                
                // Posts sin focus keyword
                if (empty($yoast_data['focus_keyword'])) {
                    $stats['no_focus_keyword']++;
                }
                
                // Cornerstone content
                if ($yoast_data['is_cornerstone']) {
                    $stats['cornerstone_content']++;
                }
                
                // Sumar scores para promedio
                if (!empty($yoast_data['seo_score'])) {
                    $total_seo_score += intval($yoast_data['seo_score']);
                    $posts_with_scores++;
                }
                
                if (!empty($yoast_data['readability_score'])) {
                    $total_readability_score += intval($yoast_data['readability_score']);
                }
                
                // Guardar posts por calidad
                $stats['posts_by_quality'][] = array(
                    'id' => $post_id,
                    'title' => csa_decode_html_entities(get_the_title()),
                    'url' => get_permalink($post_id),
                    'quality' => $quality,
                    'quality_text' => $yoast_data['overall_quality_text'],
                    'seo_score' => $yoast_data['seo_score'],
                    'readability_score' => $yoast_data['readability_score'],
                    'focus_keyword' => $yoast_data['focus_keyword'],
                    'is_cornerstone' => $yoast_data['is_cornerstone'],
                );
            }
        }
        wp_reset_postdata();
    }
    
    // Calcular promedios
    if ($posts_with_scores > 0) {
        $stats['avg_seo_score'] = round($total_seo_score / $posts_with_scores, 1);
        $stats['avg_readability_score'] = round($total_readability_score / $posts_with_scores, 1);
    }
    
    // Porcentajes
    $stats['percentages'] = array(
        'excellent' => $stats['total_posts'] > 0 ? round(($stats['excellent'] / $stats['total_posts']) * 100, 1) : 0,
        'good' => $stats['total_posts'] > 0 ? round(($stats['good'] / $stats['total_posts']) * 100, 1) : 0,
        'needs_improvement' => $stats['total_posts'] > 0 ? round(($stats['needs_improvement'] / $stats['total_posts']) * 100, 1) : 0,
        'poor' => $stats['total_posts'] > 0 ? round(($stats['poor'] / $stats['total_posts']) * 100, 1) : 0,
    );
    
    // Recomendaciones
    $stats['recommendations'] = array();
    
    if ($stats['poor'] > 0) {
        $stats['recommendations'][] = "Tienes {$stats['poor']} publicaciones con calidad SEO pobre que necesitan atención urgente.";
    }
    
    if ($stats['no_focus_keyword'] > 0) {
        $stats['recommendations'][] = "Hay {$stats['no_focus_keyword']} publicaciones sin palabra clave objetivo definida.";
    }
    
    if ($stats['avg_seo_score'] < 50) {
        $stats['recommendations'][] = "El promedio de SEO score es bajo ({$stats['avg_seo_score']}). Considera optimizar el contenido existente.";
    }
    
    if ($stats['cornerstone_content'] === 0) {
        $stats['recommendations'][] = "No tienes contenido marcado como cornerstone. Marca tus artículos más importantes.";
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $stats,
    ), 200);
}

/**
 * Content analysis endpoint
 */
function csa_content_analysis($request) {
    $post_id = $request->get_param('id');
    $post = get_post($post_id);
    
    if (!$post || $post->post_status !== 'publish') {
        return new WP_REST_Response(array(
            'success' => false,
            'message' => 'Post no encontrado',
        ), 404);
    }
    
    $analysis = csa_analyze_content_quality($post_id);
    $yoast_data = csa_get_yoast_data($post_id);
    $recommendations = csa_get_content_recommendations($post_id);
    $views = csa_get_post_views($post_id);
    $engagement = csa_get_engagement_score($post_id);
    
    $data = array(
        'post_info' => array(
            'id' => $post_id,
            'title' => get_the_title($post_id),
            'url' => get_permalink($post_id),
            'date' => get_the_date('c', $post_id),
            'modified' => get_the_modified_date('c', $post_id),
            'author' => get_the_author_meta('display_name', $post->post_author),
        ),
        'analytics' => array(
            'views' => $views,
            'comments' => get_comments_number($post_id),
            'engagement_score' => $engagement,
        ),
        'content_analysis' => $analysis,
        'yoast_seo' => $yoast_data,
        'recommendations' => $recommendations,
        'recommendation_count' => array(
            'critical' => count(array_filter($recommendations, function($r) { return $r['type'] === 'critical'; })),
            'warning' => count(array_filter($recommendations, function($r) { return $r['type'] === 'warning'; })),
            'info' => count(array_filter($recommendations, function($r) { return $r['type'] === 'info'; })),
        ),
    );
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $data,
    ), 200);
}

/**
 * Top performing posts
 */
function csa_top_performing($request) {
    $limit = $request->get_param('limit');
    $orderby = $request->get_param('orderby');
    
    $args = array(
        'post_type' => array('post', 'page'),
        'post_status' => 'publish',
        'posts_per_page' => -1,
    );
    
    $query = new WP_Query($args);
    $posts = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $views = csa_get_post_views($post_id);
            $engagement = csa_get_engagement_score($post_id);
            $yoast_data = csa_get_yoast_data($post_id);
            
            $posts[] = array(
                'id' => $post_id,
                'title' => csa_decode_html_entities(get_the_title()),
                'url' => get_permalink($post_id),
                'date' => get_the_date('c', $post_id),
                'views' => $views,
                'comments' => get_comments_number($post_id),
                'engagement_score' => $engagement,
                'seo_score' => $yoast_data ? intval($yoast_data['seo_score']) : 0,
                'readability_score' => $yoast_data ? intval($yoast_data['readability_score']) : 0,
                'overall_quality' => $yoast_data ? $yoast_data['overall_quality_text'] : 'N/A',
            );
        }
        wp_reset_postdata();
    }
    
    // Sort by selected metric
    usort($posts, function($a, $b) use ($orderby) {
        if ($orderby === 'engagement') {
            return $b['engagement_score'] - $a['engagement_score'];
        } elseif ($orderby === 'comments') {
            return $b['comments'] - $a['comments'];
        } elseif ($orderby === 'seo') {
            return $b['seo_score'] - $a['seo_score'];
        } else {
            return $b['views'] - $a['views'];
        }
    });
    
    $posts = array_slice($posts, 0, $limit);
    
    return new WP_REST_Response(array(
        'success' => true,
        'orderby' => $orderby,
        'limit' => $limit,
        'total' => count($posts),
        'data' => $posts,
    ), 200);
}

/**
 * Posts that need improvement
 */
function csa_needs_improvement($request) {
    $limit = $request->get_param('limit');
    
    $args = array(
        'post_type' => array('post', 'page'),
        'post_status' => 'publish',
        'posts_per_page' => -1,
    );
    
    $query = new WP_Query($args);
    $posts = array();
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $yoast_data = csa_get_yoast_data($post_id);
            $analysis = csa_analyze_content_quality($post_id);
            $recommendations = csa_get_content_recommendations($post_id);
            
            // Calculate priority score (higher = more urgent)
            $priority_score = 0;
            
            foreach ($recommendations as $rec) {
                if ($rec['type'] === 'critical') {
                    $priority_score += 10;
                } elseif ($rec['type'] === 'warning') {
                    $priority_score += 5;
                } else {
                    $priority_score += 1;
                }
            }
            
            // Only include posts with issues
            if ($priority_score > 0) {
                $posts[] = array(
                    'id' => $post_id,
                    'title' => csa_decode_html_entities(get_the_title()),
                    'url' => get_permalink($post_id),
                    'date' => get_the_date('c', $post_id),
                    'priority_score' => $priority_score,
                    'issues_count' => count($recommendations),
                    'critical_issues' => count(array_filter($recommendations, function($r) { return $r['type'] === 'critical'; })),
                    'warnings' => count(array_filter($recommendations, function($r) { return $r['type'] === 'warning'; })),
                    'seo_score' => $yoast_data ? intval($yoast_data['seo_score']) : 0,
                    'readability_score' => $yoast_data ? intval($yoast_data['readability_score']) : 0,
                    'word_count' => $analysis['word_count'],
                    'content_quality_score' => $analysis['content_quality_score'],
                    'recommendations' => $recommendations,
                );
            }
        }
        wp_reset_postdata();
    }
    
    // Sort by priority (highest first)
    usort($posts, function($a, $b) {
        return $b['priority_score'] - $a['priority_score'];
    });
    
    $posts = array_slice($posts, 0, $limit);
    
    return new WP_REST_Response(array(
        'success' => true,
        'total' => count($posts),
        'message' => count($posts) > 0 
            ? "Se encontraron {$posts[0]['critical_issues']} problemas críticos en el primer artículo" 
            : "¡Excelente! No hay problemas urgentes en el contenido",
        'data' => $posts,
    ), 200);
}

/**
 * Site statistics
 */
function csa_site_stats($request) {
    $args = array(
        'post_type' => array('post', 'page'),
        'post_status' => 'publish',
        'posts_per_page' => -1,
    );
    
    $query = new WP_Query($args);
    
    $stats = array(
        'total_posts' => 0,
        'total_views' => 0,
        'total_comments' => 0,
        'total_words' => 0,
        'avg_seo_score' => 0,
        'avg_readability_score' => 0,
        'avg_content_quality_score' => 0,
        'posts_by_quality' => array(
            'excellent' => 0,
            'good' => 0,
            'needs_improvement' => 0,
            'poor' => 0,
        ),
    );
    
    $total_seo = 0;
    $total_readability = 0;
    $total_content_quality = 0;
    $posts_with_scores = 0;
    
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            
            $stats['total_posts']++;
            $stats['total_views'] += csa_get_post_views($post_id);
            $stats['total_comments'] += get_comments_number($post_id);
            
            $analysis = csa_analyze_content_quality($post_id);
            $stats['total_words'] += $analysis['word_count'];
            $total_content_quality += $analysis['content_quality_score'];
            
            $yoast_data = csa_get_yoast_data($post_id);
            if ($yoast_data) {
                $total_seo += intval($yoast_data['seo_score']);
                $total_readability += intval($yoast_data['readability_score']);
                $posts_with_scores++;
                
                $stats['posts_by_quality'][$yoast_data['overall_quality']]++;
            }
        }
        wp_reset_postdata();
    }
    
    if ($stats['total_posts'] > 0) {
        $stats['avg_words_per_post'] = round($stats['total_words'] / $stats['total_posts']);
        $stats['avg_content_quality_score'] = round($total_content_quality / $stats['total_posts'], 1);
    }
    
    if ($posts_with_scores > 0) {
        $stats['avg_seo_score'] = round($total_seo / $posts_with_scores, 1);
        $stats['avg_readability_score'] = round($total_readability / $posts_with_scores, 1);
    }
    
    return new WP_REST_Response(array(
        'success' => true,
        'data' => $stats,
    ), 200);
}

/**
 * Search by Yoast Focus Keyword (Frase clave objetivo)
 */
function csa_search_focus_keywords($request) {
    $search = isset($request['query']) ? sanitize_text_field($request['query']) : '';
    $per_page = isset($request['limit']) ? (int) $request['limit'] : 50;
    $page = isset($request['page']) ? (int) $request['page'] : 1;
    $lang = isset($request['lang']) ? sanitize_text_field($request['lang']) : 'es';
    
    // Validar límites
    $per_page = max(1, min(100, $per_page));
    $page = max(1, $page);
    
    // Tipos de post públicos disponibles
    $public_types = get_post_types(array('public' => true, 'show_in_rest' => true), 'names');
    $req_post_type = isset($request['post_type']) ? sanitize_key($request['post_type']) : '';
    if ($req_post_type && in_array($req_post_type, $public_types, true)) {
        $post_types = array($req_post_type);
    } else {
        $post_types = array_values($public_types);
    }
    
    // Construir meta_query según si hay búsqueda o no
    if ($search !== '') {
        $meta_query = array(
            'relation' => 'OR',
            array(
                'key' => '_yoast_wpseo_focuskw',
                'value' => $search,
                'compare' => 'LIKE',
            ),
            array(
                'key' => '_yoast_wpseo_focuskeywords',
                'value' => $search,
                'compare' => 'LIKE',
            ),
        );
    } else {
        $meta_query = array(
            'relation' => 'OR',
            array(
                'key' => '_yoast_wpseo_focuskw',
                'compare' => 'EXISTS',
            ),
            array(
                'key' => '_yoast_wpseo_focuskeywords',
                'compare' => 'EXISTS',
            ),
        );
    }
    
    $args = array(
        'post_type' => $post_types,
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'fields' => 'ids',
        'meta_query' => $meta_query,
        'no_found_rows' => false,
    );
    
    // Limitar a idioma español si Polylang está activo
    if (function_exists('pll_current_language') && !empty($lang)) {
        $args['lang'] = $lang;
    }
    
    $query = new WP_Query($args);
    
    $items = array();
    foreach ($query->posts as $post_id) {
        // Verificar idioma adicional si Polylang está activo
        if (function_exists('pll_get_post_language')) {
            $post_lang = pll_get_post_language($post_id);
            if (!empty($lang) && $post_lang !== $lang) {
                continue;
            }
        }
        
        // Obtener focus keyword
        $focus = get_post_meta($post_id, '_yoast_wpseo_focuskw', true);
        if ($focus === '' || $focus === null) {
            $alt = get_post_meta($post_id, '_yoast_wpseo_focuskeywords', true);
            if (!empty($alt)) {
                $focus = $alt;
            }
        }
        
        // Filtrar vacíos
        if ($focus === '' || $focus === null) {
            continue;
        }
        
        // Verificar similitud con la búsqueda
        $similarity = 0;
        $exact_match = false;
        if ($search !== '') {
            similar_text(strtolower($search), strtolower($focus), $similarity);
            $exact_match = (strtolower($search) === strtolower($focus));
        }
        
        $item = array(
            'id' => $post_id,
            'type' => get_post_type($post_id),
            'url' => get_permalink($post_id),
            'title' => csa_decode_html_entities(get_the_title($post_id)),
            'focus_keyword' => $focus,
        );
        
        // Agregar campos adicionales si hay búsqueda
        if ($search !== '') {
            $item['similarity_percentage'] = round($similarity, 2);
            $item['exact_match'] = $exact_match;
        }
        
        // Agregar datos de Yoast SEO
        $yoast_data = csa_get_yoast_data($post_id);
        if ($yoast_data) {
            $item['yoast_seo'] = $yoast_data;
        }
        
        // Agregar idioma
        if (function_exists('pll_get_post_language')) {
            $post_lang = pll_get_post_language($post_id);
            if (!empty($post_lang)) {
                $item['language'] = $post_lang;
            }
        }
        
        $items[] = $item;
    }
    
    // Ordenar por similitud si hay búsqueda
    if ($search !== '') {
        usort($items, function($a, $b) {
            if ($a['exact_match'] && !$b['exact_match']) return -1;
            if (!$a['exact_match'] && $b['exact_match']) return 1;
            return $b['similarity_percentage'] - $a['similarity_percentage'];
        });
    }
    
    $response = rest_ensure_response($items);
    
    // Añadir cabeceras de totales
    $total = (int) $query->found_posts;
    $total_pages = (int) ceil($total / $per_page);
    $response->header('X-WP-Total', $total);
    $response->header('X-WP-TotalPages', $total_pages);
    
    return $response;
}

/**
 * Add settings page
 */
add_action('admin_menu', function() {
    add_options_page(
        'Content Search API',
        'Content Search API',
        'manage_options',
        'content-search-api',
        'csa_settings_page'
    );
});

/**
 * Settings page HTML
 */
function csa_settings_page() {
    $site_url = get_site_url();
    $endpoint_url = rest_url('content-search/v1/search');
    ?>
    <div class="wrap">
        <h1>Content Search API</h1>
        
        <div class="notice notice-success">
            <p><strong>✓ Plugin activado correctamente</strong></p>
            <p><strong>✓ Sistema de vistas integrado activo</strong> - Meta key: <code>_csa_post_views</code></p>
            <p><strong>✓ Columna de vistas agregada</strong> al listado de Posts y Pages</p>
        </div>
        
        <div class="notice notice-info">
            <p><strong>📊 Sistema de Analytics Propio:</strong></p>
            <ul style="list-style: disc; margin-left: 20px;">
                <li>Contador de vistas automático (no requiere otros plugins)</li>
                <li>Columna "👁️ Vistas" visible en Posts → All Posts</li>
                <li>Columna ordenable (click para ordenar por vistas)</li>
                <li>Compatible con cualquier tema de WordPress</li>
            </ul>
        </div>
        
        <div class="card" style="max-width: 900px;">
            <h2>Endpoints Disponibles</h2>
            <p><strong>✓ API pública - No requiere autenticación</strong></p>
            <p><strong>✓ Arquitectura escalable - Fácil agregar nuevos endpoints</strong></p>
            
            <hr>
            
            <h3>1. Buscar Frases Clave</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/search')); ?>?query=pantanal+jaguar
            </code>
            <p><strong>Parámetros:</strong> query (requerido), post_type (opcional)</p>
            
            <h3>2. Obtener Posts</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/posts')); ?>?per_page=10&page=1
            </code>
            <p><strong>Parámetros:</strong> per_page, page, post_type</p>
            
            <h3>3. Obtener Post Específico</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/posts/123')); ?>
            </code>
            
            <h3>4. Obtener Categorías</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/categories')); ?>
            </code>
            
            <h3>5. Obtener Tags</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/tags')); ?>
            </code>
            
            <h3>6. Obtener Idiomas Disponibles</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/languages')); ?>
            </code>
            <p><strong>Detecta:</strong> Polylang, WPML, o idioma único del sitio</p>
            
            <h3>7. Estadísticas de Calidad SEO</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/seo-stats')); ?>
            </code>
            <p><strong>Incluye:</strong> Scores SEO/Legibilidad, calificaciones, recomendaciones, y lista completa de posts por calidad</p>
            
            <h3>8. Análisis Detallado de Contenido 🆕</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/content-analysis/123')); ?>
            </code>
            <p><strong>Incluye:</strong> Vistas, engagement, análisis de contenido (palabras, párrafos, imágenes, enlaces), Yoast SEO completo, y recomendaciones personalizadas de mejora</p>
            
            <h3>9. Posts con Mejor Rendimiento 🆕</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/top-performing')); ?>?limit=10&orderby=views
            </code>
            <p><strong>Parámetros:</strong> limit (default: 10), orderby (views, engagement, comments, seo)</p>
            <p><strong>Incluye:</strong> Vistas, comentarios, engagement score, SEO/legibilidad scores</p>
            
            <h3>10. Posts que Necesitan Mejora 🆕</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/needs-improvement')); ?>?limit=20
            </code>
            <p><strong>Incluye:</strong> Priority score, problemas críticos, warnings, recomendaciones específicas de mejora</p>
            
            <h3>11. Estadísticas Globales del Sitio 🆕</h3>
            <code style="display: block; padding: 10px; background: #f5f5f5; border-radius: 4px; margin: 10px 0;">
                GET <?php echo esc_url(rest_url('content-search/v1/site-stats')); ?>
            </code>
            <p><strong>Incluye:</strong> Total posts, vistas, comentarios, palabras, promedios de SEO/legibilidad/calidad, distribución por calidad</p>
            
            <hr>
            
            <h2>📈 Nuevas Funcionalidades de Análisis</h2>
            
            <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="margin-top: 0;">🎯 Análisis de Contenido</h3>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><strong>Conteo de palabras, párrafos, encabezados</strong></li>
                    <li><strong>Análisis de imágenes y enlaces</strong></li>
                    <li><strong>Tiempo de lectura estimado</strong></li>
                    <li><strong>Content Quality Score (0-100)</strong></li>
                    <li><strong>Densidad de contenido</strong></li>
                </ul>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="margin-top: 0;">📊 Sistema de Analytics Integrado</h3>
                <p><strong>✅ Completamente independiente - No requiere plugins adicionales</strong></p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><strong>Contador de vistas automático</strong> - Se activa al instalar el plugin</li>
                    <li><strong>Meta key propia:</strong> <code>_csa_post_views</code></li>
                    <li><strong>Tracking en tiempo real</strong> - Sin dependencias externas</li>
                    <li><strong>Engagement score calculado</strong> - Vistas + Comentarios</li>
                    <li><strong>Compatible con cualquier tema</strong></li>
                </ul>
            </div>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="margin-top: 0;">💡 Recomendaciones Inteligentes</h3>
                <p>Cada post recibe recomendaciones personalizadas categorizadas por:</p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><strong style="color: #d32f2f;">Critical:</strong> Problemas urgentes que afectan SEO</li>
                    <li><strong style="color: #f57c00;">Warning:</strong> Mejoras recomendadas</li>
                    <li><strong style="color: #1976d2;">Info:</strong> Sugerencias de optimización</li>
                </ul>
                <p><strong>Categorías de recomendaciones:</strong></p>
                <ul style="list-style: circle; margin-left: 40px;">
                    <li>content_length - Longitud del contenido</li>
                    <li>media - Imágenes y multimedia</li>
                    <li>structure - Encabezados y estructura</li>
                    <li>links - Enlaces internos y externos</li>
                    <li>seo - Configuración SEO</li>
                    <li>readability - Legibilidad del texto</li>
                </ul>
            </div>
            
            <hr>
            
            <h2>📊 Información Yoast SEO Incluida</h2>
            <p>Todos los endpoints que retornan posts incluyen datos completos de Yoast SEO:</p>
            <ul style="list-style: disc; margin-left: 20px;">
                <li><strong>SEO Score</strong> (0-100) con calificación: ✅ Bueno, ⚠️ OK, ❌ Malo</li>
                <li><strong>Readability Score</strong> (0-100) con calificación</li>
                <li><strong>Calidad General:</strong> Excelente, Bueno, Necesita Mejorar, Pobre</li>
                <li><strong>Focus Keyword</strong>, Title, Description</li>
                <li><strong>Open Graph</strong> (título, descripción, imagen)</li>
                <li><strong>Twitter Card</strong> (título, descripción, imagen)</li>
                <li><strong>Robots Meta</strong> (noindex, nofollow)</li>
                <li><strong>Cornerstone Content</strong> (contenido pilar)</li>
                <li><strong>Canonical URL</strong></li>
            </ul>
            
            <h3>Parámetros</h3>
            <ul>
                <li><code>query</code> (requerido) - Frase clave a buscar. Ejemplo: "pantanal jaguar"</li>
                <li><code>post_type</code> (opcional) - Tipos de contenido separados por coma. Default: "post,page"</li>
            </ul>
            
            <h3>Ejemplos de Uso</h3>
            
            <h4>Buscar en posts y páginas:</h4>
            <pre style="background: #2c3e50; color: #2ecc71; padding: 15px; border-radius: 4px; overflow-x: auto;">curl "<?php echo esc_url($endpoint_url); ?>?query=pantanal+jaguar"</pre>
            
            <h4>Buscar solo en posts:</h4>
            <pre style="background: #2c3e50; color: #2ecc71; padding: 15px; border-radius: 4px; overflow-x: auto;">curl "<?php echo esc_url($endpoint_url); ?>?query=pantanal+jaguar&post_type=post"</pre>
            
            <h4>Respuesta de ejemplo:</h4>
            <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 400px;">{
  "success": true,
  "query": "pantanal jaguar",
  "total_results": 3,
  "data": [
    {
      "id": 123,
      "title": "El Jaguar del Pantanal: Guía Completa",
      "url": "<?php echo esc_url($site_url); ?>/jaguar-pantanal",
      "type": "post",
      "excerpt": "El pantanal es el hogar del jaguar...",
      "occurrences": {
        "title": 1,
        "content": 5,
        "total": 6
      },
      "keyword_phrase": "pantanal jaguar",
      "yoast_seo": {
        "seo_score": "85",
        "readability_score": "72",
        "overall_quality": "excellent"
      },
      "language": "es"
    }
  ]
}</pre>
            
            <h3>Integración JavaScript</h3>
            <pre style="background: #2c3e50; color: #3498db; padding: 15px; border-radius: 4px; overflow-x: auto;">fetch('<?php echo esc_url($endpoint_url); ?>?query=pantanal+jaguar')
  .then(response => response.json())
  .then(response => {
    console.log(`Encontrados ${response.total_results} resultados`);
    response.data.forEach(item => {
      console.log(`${item.title}: ${item.occurrences.total} ocurrencias`);
      console.log(`Calidad SEO: ${item.yoast_seo?.overall_quality_text || 'N/A'}`);
    });
  });</pre>
        </div>
    </div>
    <?php
}

/**
 * Activation hook
 */
register_activation_hook(__FILE__, function() {
    flush_rewrite_rules();
});

/**
 * Deactivation hook
 */
register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
