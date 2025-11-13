<?php
/**
 * Test simple del backend - verificar que PHP funciona
 */

// Headers para navegador
header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>";
echo "<html><head><title>Test Backend PHP</title></head><body>";
echo "<h1>🧪 Test Simple del Backend PHP</h1>";
echo "<hr>";

// Test 1: PHP básico
echo "<h2>✅ PHP funciona correctamente</h2>";
echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
echo "<p><strong>Server:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p><strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>";
echo "<p><strong>Script Name:</strong> " . $_SERVER['SCRIPT_NAME'] . "</p>";

// Test 2: Verificar archivos
echo "<h2>📁 Test de archivos:</h2>";
echo "<ul>";

$files = [
    'src/Utils/Response.php',
    'src/Utils/Security.php', 
    'src/Controllers/UserController.php',
    'src/Router.php',
    'src/Routes/api.php',
    'public/index.php',
    '.htaccess'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "<li>✅ $file - <span style='color:green'>EXISTS</span></li>";
    } else {
        echo "<li>❌ $file - <span style='color:red'>MISSING</span></li>";
    }
}

echo "</ul>";

// Test 3: Extensiones PHP
echo "<h2>🔧 Extensiones PHP:</h2>";
echo "<ul>";

$extensions = ['openssl', 'json', 'pdo', 'curl', 'mbstring'];
foreach ($extensions as $ext) {
    if (extension_loaded($ext)) {
        echo "<li>✅ $ext - <span style='color:green'>LOADED</span></li>";
    } else {
        echo "<li>❌ $ext - <span style='color:red'>MISSING</span></li>";
    }
}

echo "</ul>";

// Test 4: Variables de entorno
echo "<h2>🌍 Variables del servidor:</h2>";
echo "<ul>";
echo "<li><strong>REQUEST_URI:</strong> " . ($_SERVER['REQUEST_URI'] ?? 'N/A') . "</li>";
echo "<li><strong>HTTP_HOST:</strong> " . ($_SERVER['HTTP_HOST'] ?? 'N/A') . "</li>";
echo "<li><strong>HTTPS:</strong> " . ($_SERVER['HTTPS'] ?? 'N/A') . "</li>";
echo "</ul>";

// Test 5: JSON Response
echo "<h2>📡 Test JSON Response:</h2>";
$testResponse = [
    'success' => true,
    'message' => 'Backend PHP funcionando correctamente',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
];

echo "<pre>" . json_encode($testResponse, JSON_PRETTY_PRINT) . "</pre>";

echo "<hr>";
echo "<p><strong>🏁 Test completado exitosamente</strong></p>";
echo "</body></html>";
?>
