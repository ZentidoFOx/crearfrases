<?php
/**
 * SCRIPT DE PRUEBA PARA ACTUALIZACIÓN DE SEO_DATA
 * 
 * Este script prueba si el backend puede actualizar correctamente
 * el campo seo_data con focus_keyword para las traducciones.
 */

require_once __DIR__ . '/src/Database/Connection.php';
require_once __DIR__ . '/src/Models/Article.php';

use App\Database\Connection;
use App\Models\Article;

echo "🧪 PRUEBA DE ACTUALIZACIÓN SEO_DATA\n";
echo "=====================================\n\n";

try {
    // Configurar la conexión a la base de datos
    $db = Connection::getInstance();
    echo "✅ Conexión a base de datos establecida\n\n";
    
    // Buscar un artículo de prueba
    $stmt = $db->prepare("SELECT id, title, keyword, seo_data, language FROM articles LIMIT 1");
    $stmt->execute();
    $article = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$article) {
        echo "❌ No se encontraron artículos para probar\n";
        exit(1);
    }
    
    echo "📄 Artículo de prueba encontrado:\n";
    echo "   - ID: {$article['id']}\n";
    echo "   - Título: {$article['title']}\n";
    echo "   - Keyword actual: {$article['keyword']}\n";
    echo "   - Idioma: {$article['language']}\n";
    echo "   - SEO Data actual: " . ($article['seo_data'] ?: 'NULL') . "\n\n";
    
    // Preparar datos de prueba para seo_data
    $testSeoData = [
        'focus_keyword' => 'keyword de prueba traducido',
        'meta_description' => 'Meta descripción de prueba',
        'seo_title' => 'Título SEO de prueba',
        'slug' => 'slug-de-prueba',
        'related_keywords' => ['keyword1', 'keyword2', 'keyword3']
    ];
    
    echo "🔄 Probando actualización con seo_data...\n";
    echo "   Datos a enviar: " . json_encode($testSeoData, JSON_PRETTY_PRINT) . "\n\n";
    
    // Intentar actualizar con seo_data
    $updateData = [
        'seo_data' => $testSeoData
    ];
    
    $result = Article::update($article['id'], $updateData, 1);
    
    if ($result) {
        echo "✅ Actualización exitosa!\n\n";
        
        // Verificar que se guardó correctamente
        $stmt = $db->prepare("SELECT seo_data FROM articles WHERE id = ?");
        $stmt->execute([$article['id']]);
        $updatedArticle = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "📊 SEO Data guardado en BD:\n";
        echo "   " . $updatedArticle['seo_data'] . "\n\n";
        
        // Decodificar y verificar focus_keyword
        $savedSeoData = json_decode($updatedArticle['seo_data'], true);
        if ($savedSeoData && isset($savedSeoData['focus_keyword'])) {
            echo "🎯 Focus Keyword guardado correctamente: '{$savedSeoData['focus_keyword']}'\n";
        } else {
            echo "❌ Focus Keyword NO se guardó correctamente\n";
        }
        
    } else {
        echo "❌ Error en la actualización\n";
    }
    
    echo "\n🧪 Prueba completada\n";
    
} catch (Exception $e) {
    echo "❌ Error durante la prueba: " . $e->getMessage() . "\n";
    echo "   Stack trace: " . $e->getTraceAsString() . "\n";
}
